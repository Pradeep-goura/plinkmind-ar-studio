-- Plinkmind AR Studio - Phase 5: scenes
-- Run once in Supabase Dashboard > SQL Editor.

-- ============ HELPERS (project-based access) ============

create or replace function private.is_project_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    join public.workspace_members m on m.workspace_id = p.workspace_id
    where p.id = p_project_id
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_project_role(p_project_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    join public.workspace_members m on m.workspace_id = p.workspace_id
    where p.id = p_project_id
      and m.user_id = (select auth.uid())
      and m.role = any (allowed_roles)
  );
$$;

revoke all on function private.is_project_member(uuid) from public, anon;
revoke all on function private.has_project_role(uuid, text[]) from public, anon;
grant execute on function private.is_project_member(uuid) to authenticated;
grant execute on function private.has_project_role(uuid, text[]) to authenticated;

-- ============ SCENES TABLE ============

create table public.scenes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  schema_version int not null check (schema_version >= 1),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 1048576),
  version int not null default 1,
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- On every update the SERVER bumps the version. The browser cannot set it.
create or replace function private.scenes_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger scenes_before_update
  before update on public.scenes
  for each row execute function private.scenes_before_update();

-- Saving a scene also marks the project as recently updated.
create or replace function private.scenes_touch_project()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.projects set updated_at = now() where id = new.project_id;
  return new;
end;
$$;

revoke all on function private.scenes_before_update() from public, anon, authenticated;
revoke all on function private.scenes_touch_project() from public, anon, authenticated;

create trigger scenes_touch_project
  after insert or update on public.scenes
  for each row execute function private.scenes_touch_project();

-- ============ ACCESS ============

alter table public.scenes enable row level security;

revoke all on public.scenes from anon, authenticated;
grant select on public.scenes to authenticated;
grant insert (project_id, schema_version, data) on public.scenes to authenticated;
grant update (schema_version, data) on public.scenes to authenticated;

create policy "scenes_select_member" on public.scenes
  for select to authenticated
  using (private.is_project_member(project_id));

create policy "scenes_insert_editor_up" on public.scenes
  for insert to authenticated
  with check (private.has_project_role(project_id, array['owner', 'admin', 'editor']));

create policy "scenes_update_editor_up" on public.scenes
  for update to authenticated
  using (private.has_project_role(project_id, array['owner', 'admin', 'editor']))
  with check (private.has_project_role(project_id, array['owner', 'admin', 'editor']));