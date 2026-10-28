-- Plinkmind AR Studio - Phase 6A: publishing
-- Run once in Supabase Dashboard > SQL Editor.

-- ============ TABLES ============

create table public.published_experiences (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]{8,32}$'),
  status text not null default 'live' check (status in ('live', 'unpublished')),
  live_version int not null default 0 check (live_version >= 0),
  published_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger published_experiences_set_updated_at
  before update on public.published_experiences
  for each row execute function private.set_updated_at();

-- One immutable copy of the scene per published version.
create table public.published_versions (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.published_experiences (id) on delete cascade,
  version int not null check (version >= 1),
  title text not null,
  tracking_mode text not null check (tracking_mode in ('surface', 'image')),
  schema_version int not null,
  scene jsonb not null,
  published_by uuid references auth.users (id) on delete set null,
  published_at timestamptz not null default now(),
  unique (experience_id, version)
);

create table public.published_assets (
  experience_id uuid not null references public.published_experiences (id) on delete cascade,
  version int not null,
  asset_id uuid not null,
  storage_path text not null,
  kind text not null check (kind in ('model', 'audio')),
  size_bytes bigint not null,
  primary key (experience_id, version, asset_id)
);
create index published_assets_path_idx on public.published_assets (storage_path);

-- ============ ACCESS ============
-- Only the publish functions below write to these tables. The browser can only
-- read the list of its own experiences (slug, status, live version).

alter table public.published_experiences enable row level security;
alter table public.published_versions enable row level security;
alter table public.published_assets enable row level security;

revoke all on public.published_experiences, public.published_versions, public.published_assets
  from anon, authenticated;

grant select on public.published_experiences to authenticated;

create policy "published_experiences_select_member" on public.published_experiences
  for select to authenticated
  using (private.is_project_member(project_id));

-- ============ HELPERS ============

create or replace function private.is_published_asset(p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.published_assets pa
    join public.published_experiences pe
      on pe.id = pa.experience_id and pe.live_version = pa.version
    where pe.status = 'live' and pa.storage_path = p_path
  );
$$;

create or replace function private.is_asset_published(p_asset_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.published_assets pa
    join public.published_experiences pe
      on pe.id = pa.experience_id and pe.live_version = pa.version
    where pe.status = 'live' and pa.asset_id = p_asset_id
  );
$$;

revoke all on function private.is_published_asset(text) from public;
revoke all on function private.is_asset_published(uuid) from public;
grant execute on function private.is_published_asset(text) to anon, authenticated;
grant execute on function private.is_asset_published(uuid) to authenticated;
grant usage on schema private to anon;

-- ============ PUBLISH ============

create or replace function public.publish_project(p_project_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_project public.projects;
  v_scene public.scenes;
  v_experience public.published_experiences;
  v_objects jsonb;
  v_object jsonb;
  v_asset public.assets;
  v_asset_id uuid;
  v_asset_ids uuid[] := '{}';
  v_visible_models int := 0;
  v_slug text;
  v_version int;
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  if not private.has_project_role(p_project_id, array['owner', 'admin', 'editor']) then
    raise exception 'You cannot publish this project' using errcode = '42501';
  end if;

  -- One publish at a time per project, so version numbers never collide.
  perform pg_advisory_xact_lock(hashtext(p_project_id::text));

  select * into v_project from public.projects where id = p_project_id;
  if v_project.tracking_mode <> 'surface' then
    raise exception 'Only surface placement projects can be published right now';
  end if;

  select * into v_scene from public.scenes where project_id = p_project_id;
  if not found then
    raise exception 'This project has no scene yet. Open the editor and add a model first';
  end if;
  if v_scene.schema_version <> 1 then
    raise exception 'Unsupported scene version';
  end if;

  v_objects := v_scene.data -> 'objects';
  if jsonb_typeof(v_objects) is distinct from 'array'
     or jsonb_array_length(v_objects) < 1
     or jsonb_array_length(v_objects) > 200 then
    raise exception 'The scene must contain between 1 and 200 objects';
  end if;

  for v_object in select value from jsonb_array_elements(v_objects) loop
    if jsonb_typeof(v_object) is distinct from 'object'
       or coalesce(v_object ->> 'type', '') not in ('model', 'audio') then
      raise exception 'The scene contains an unsupported object';
    end if;

    begin
      v_asset_id := (v_object ->> 'assetId')::uuid;
    exception when others then
      raise exception 'The scene contains an invalid asset reference';
    end;

    select * into v_asset
    from public.assets
    where id = v_asset_id and workspace_id = v_project.workspace_id;
    if not found then
      raise exception 'The scene uses an asset that no longer exists (%)',
        coalesce(v_object ->> 'name', 'unnamed object');
    end if;

    if v_asset.kind <> (v_object ->> 'type') then
      raise exception 'An object in the scene uses an asset of the wrong type';
    end if;

    if (v_object ->> 'type') = 'model' and (v_object -> 'visible') = 'true'::jsonb then
      v_visible_models := v_visible_models + 1;
    end if;

    v_asset_ids := array_append(v_asset_ids, v_asset_id);
  end loop;

  if v_visible_models = 0 then
    raise exception 'Add at least one visible 3D model before publishing';
  end if;

  select * into v_experience from public.published_experiences where project_id = p_project_id;
  if not found then
    loop
      v_slug := substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
      exit when not exists (select 1 from public.published_experiences where slug = v_slug);
    end loop;

    insert into public.published_experiences (project_id, slug, status, live_version, published_by)
    values (p_project_id, v_slug, 'live', 0, v_user)
    returning * into v_experience;
  end if;

  select coalesce(max(version), 0) + 1 into v_version
  from public.published_versions
  where experience_id = v_experience.id;

  insert into public.published_versions
    (experience_id, version, title, tracking_mode, schema_version, scene, published_by)
  values
    (v_experience.id, v_version, v_project.name, v_project.tracking_mode,
     v_scene.schema_version, v_scene.data, v_user);

  insert into public.published_assets (experience_id, version, asset_id, storage_path, kind, size_bytes)
  select v_experience.id, v_version, a.id, a.storage_path, a.kind, a.size_bytes
  from public.assets a
  where a.id = any (v_asset_ids);

  update public.published_experiences
  set status = 'live', live_version = v_version, published_by = v_user
  where id = v_experience.id;

  update public.projects set status = 'published' where id = p_project_id;

  return jsonb_build_object('slug', v_experience.slug, 'version', v_version);
end;
$$;

create or replace function public.unpublish_project(p_project_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  if not private.has_project_role(p_project_id, array['owner', 'admin', 'editor']) then
    raise exception 'You cannot unpublish this project' using errcode = '42501';
  end if;

  update public.published_experiences
  set status = 'unpublished'
  where project_id = p_project_id and status = 'live';

  if not found then
    raise exception 'This project is not published';
  end if;

  update public.projects set status = 'draft' where id = p_project_id;
  return jsonb_build_object('status', 'unpublished');
end;
$$;

-- What the public viewer page reads. Returns null when the link is not live.
create or replace function public.get_public_experience(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if p_slug is null or p_slug !~ '^[a-z0-9]{8,32}$' then
    return null;
  end if;

  select jsonb_build_object(
    'slug', e.slug,
    'version', v.version,
    'title', v.title,
    'trackingMode', v.tracking_mode,
    'schemaVersion', v.schema_version,
    'scene', v.scene,
    'assets', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pa.asset_id,
        'kind', pa.kind,
        'storagePath', pa.storage_path,
        'sizeBytes', pa.size_bytes
      ))
      from public.published_assets pa
      where pa.experience_id = e.id and pa.version = v.version
    ), '[]'::jsonb)
  )
  into v_result
  from public.published_experiences e
  join public.published_versions v
    on v.experience_id = e.id and v.version = e.live_version
  where e.slug = p_slug and e.status = 'live';

  return v_result;
end;
$$;

revoke all on function public.publish_project(uuid) from public, anon;
revoke all on function public.unpublish_project(uuid) from public, anon;
revoke all on function public.get_public_experience(text) from public;
grant execute on function public.publish_project(uuid) to authenticated;
grant execute on function public.unpublish_project(uuid) to authenticated;
grant execute on function public.get_public_experience(text) to anon, authenticated;

-- ============ FILE ACCESS ============

-- Files of a LIVE published version can be read without signing in. Nothing else can.
create policy "assets_storage_select_published" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'project-assets' and private.is_published_asset(name));

-- An asset used by a live experience cannot be deleted. Unpublish first.
drop policy if exists "assets_delete_owner_admin" on public.assets;
create policy "assets_delete_owner_admin" on public.assets
  for delete to authenticated
  using (
    private.has_workspace_role(workspace_id, array['owner', 'admin'])
    and not private.is_asset_published(id)
  );

drop policy if exists "assets_storage_delete_owner_admin" on storage.objects;
create policy "assets_storage_delete_owner_admin" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'project-assets'
    and not private.is_published_asset(name)
    and (storage.foldername(name))[1] in (
      select m.workspace_id::text from public.workspace_members m
      where m.user_id = (select auth.uid())
        and m.role in ('owner', 'admin')
    )
  );