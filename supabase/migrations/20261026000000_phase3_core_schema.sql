-- Plinkmind AR Studio - Phase 3 core schema
-- Run once in Supabase Dashboard > SQL Editor.

-- A private schema for helper functions. It is NOT exposed to the web API.
create schema if not exists private;
grant usage on schema private to authenticated;

-- ============ TABLES ============

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_id_idx on public.workspace_members (user_id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  status text not null default 'draft' check (status in ('draft', 'published')),
  tracking_mode text not null default 'surface' check (tracking_mode in ('surface', 'image')),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_workspace_updated_idx on public.projects (workspace_id, updated_at desc);

-- ============ HELPER FUNCTIONS ============

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function private.set_updated_at();

-- Is the signed-in user a member of this workspace?
create or replace function private.is_workspace_member(ws_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = ws_id
      and m.user_id = (select auth.uid())
  );
$$;

-- Does the signed-in user have one of these roles in this workspace?
create or replace function private.has_workspace_role(ws_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = ws_id
      and m.user_id = (select auth.uid())
      and m.role = any (allowed_roles)
  );
$$;

revoke all on function private.is_workspace_member(uuid) from public, anon;
revoke all on function private.has_workspace_role(uuid, text[]) from public, anon;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.has_workspace_role(uuid, text[]) to authenticated;

-- When someone signs up: create their profile, a personal workspace, and an owner membership.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_workspace_id uuid;
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), 80)
  );

  insert into public.workspaces (name, owner_id)
  values ('My workspace', new.id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ============ TABLE PRIVILEGES (least privilege) ============
-- The browser role "anon" (not signed in) gets nothing.
-- Signed-in users get only the columns they genuinely need to change.

revoke all on public.profiles, public.workspaces, public.workspace_members, public.projects
  from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

grant select on public.workspaces to authenticated;
grant update (name) on public.workspaces to authenticated;

grant select on public.workspace_members to authenticated;

grant select, delete on public.projects to authenticated;
grant insert (workspace_id, name, tracking_mode) on public.projects to authenticated;
grant update (name, tracking_mode) on public.projects to authenticated;
-- Note: "status" cannot be changed from the browser. Publishing will be a trusted
-- server-side operation in a later phase.

-- ============ ROW LEVEL SECURITY ============

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;

-- profiles: you can read and edit only your own
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- workspaces: members can read; owner/admin can rename
create policy "workspaces_select_member" on public.workspaces
  for select to authenticated
  using (private.is_workspace_member(id));

create policy "workspaces_update_owner_admin" on public.workspaces
  for update to authenticated
  using (private.has_workspace_role(id, array['owner', 'admin']))
  with check (private.has_workspace_role(id, array['owner', 'admin']));

-- workspace_members: members can see who is in their workspace (read-only from the browser)
create policy "members_select_same_workspace" on public.workspace_members
  for select to authenticated
  using (private.is_workspace_member(workspace_id));

-- projects
create policy "projects_select_member" on public.projects
  for select to authenticated
  using (private.is_workspace_member(workspace_id));

create policy "projects_insert_editor_up" on public.projects
  for insert to authenticated
  with check (
    private.has_workspace_role(workspace_id, array['owner', 'admin', 'editor'])
    and created_by = (select auth.uid())
  );

create policy "projects_update_editor_up" on public.projects
  for update to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']));

create policy "projects_delete_owner_admin" on public.projects
  for delete to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'admin']));