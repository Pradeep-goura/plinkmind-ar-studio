-- Plinkmind AR Studio - Phase 4: assets and storage
-- Run once in Supabase Dashboard > SQL Editor.

-- ============ STORAGE BUCKET ============
-- Private bucket. 52428800 bytes = 50 MB (the free-plan maximum per file).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-assets',
  'project-assets',
  false,
  52428800,
  array['model/gltf-binary', 'audio/mpeg', 'audio/ogg', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ============ ASSETS TABLE ============
create table public.assets (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  uploaded_by uuid references auth.users (id) on delete set null,
  kind text not null check (kind in ('model', 'audio', 'image')),
  original_name text not null check (char_length(original_name) between 1 and 200),
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
  created_at timestamptz not null default now()
);
create index assets_workspace_created_idx on public.assets (workspace_id, created_at desc);

alter table public.assets enable row level security;

revoke all on public.assets from anon, authenticated;
grant select, delete on public.assets to authenticated;
-- No insert or update from the browser. Rows are created only by register_asset().

create policy "assets_select_member" on public.assets
  for select to authenticated
  using (private.is_workspace_member(workspace_id));

create policy "assets_delete_owner_admin" on public.assets
  for delete to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'admin']));

-- ============ REGISTER AN UPLOADED FILE ============
-- Size and type are read from the stored object itself, not from the browser.
create or replace function public.register_asset(
  p_asset_id uuid,
  p_workspace_id uuid,
  p_kind text,
  p_original_name text,
  p_storage_path text
)
returns public.assets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_meta jsonb;
  v_size bigint;
  v_mime text;
  v_row public.assets;
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  if not private.has_workspace_role(p_workspace_id, array['owner', 'admin', 'editor']) then
    raise exception 'You cannot add assets to this workspace' using errcode = '42501';
  end if;

  if p_kind not in ('model', 'audio', 'image') then
    raise exception 'Invalid asset kind';
  end if;

  if p_storage_path !~ ('^' || p_workspace_id::text || '/' || p_asset_id::text || '\.(glb|mp3|ogg|png|jpg|webp)$') then
    raise exception 'Invalid storage path';
  end if;

  select o.metadata into v_meta
  from storage.objects o
  where o.bucket_id = 'project-assets' and o.name = p_storage_path;

  if v_meta is null then
    raise exception 'The uploaded file was not found in storage';
  end if;

  v_size := (v_meta ->> 'size')::bigint;
  v_mime := v_meta ->> 'mimetype';

  if not (
    (p_kind = 'model' and v_mime = 'model/gltf-binary')
    or (p_kind = 'audio' and v_mime in ('audio/mpeg', 'audio/ogg'))
    or (p_kind = 'image' and v_mime in ('image/png', 'image/jpeg', 'image/webp'))
  ) then
    raise exception 'File type does not match the asset kind';
  end if;

  insert into public.assets (id, workspace_id, uploaded_by, kind, original_name, storage_path, mime_type, size_bytes)
  values (p_asset_id, p_workspace_id, v_user, p_kind, left(btrim(p_original_name), 200), p_storage_path, v_mime, v_size)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.register_asset(uuid, uuid, text, text, text) from public, anon;
grant execute on function public.register_asset(uuid, uuid, text, text, text) to authenticated;

-- ============ STORAGE ACCESS RULES ============
-- The first folder in every path is the workspace id.

create policy "assets_storage_select_member" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] in (
      select m.workspace_id::text from public.workspace_members m
      where m.user_id = (select auth.uid())
    )
  );

create policy "assets_storage_insert_editor_up" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] in (
      select m.workspace_id::text from public.workspace_members m
      where m.user_id = (select auth.uid())
        and m.role in ('owner', 'admin', 'editor')
    )
  );

create policy "assets_storage_delete_owner_admin" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] in (
      select m.workspace_id::text from public.workspace_members m
      where m.user_id = (select auth.uid())
        and m.role in ('owner', 'admin')
    )
  );