-- Scenes isolation test. Replace the two placeholder IDs with real user IDs
-- (select id, email from auth.users). User A must own a project that has a scene
-- (open that project's editor at least once). "Success. No rows returned" = pass.
-- Any error containing FAIL = security problem.
do $$
declare
  v_a uuid := 'PUT-A-ID-HERE';
  v_b uuid := 'PUT-B-ID-HERE';
  v_project uuid;
  v_version int;
  v_new int;
  n int;
begin
  select s.project_id, s.version into v_project, v_version
  from public.scenes s
  join public.projects p on p.id = s.project_id
  where p.created_by = v_a
  limit 1;
  if v_project is null then
    raise exception 'TEST INVALID: user A has no scene';
  end if;

  -- 1) Not signed in
  set local role anon;
  begin
    perform 1 from public.scenes limit 1;
    raise exception 'FAIL: anon can read scenes';
  exception when insufficient_privilege then
    null;
  end;

  -- 2) Signed in as B: must not touch A's scene
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_b, 'role', 'authenticated')::text, true);

  select count(*) into n from public.scenes where project_id = v_project;
  if n <> 0 then raise exception 'FAIL: B can read A scene (%)', n; end if;

  update public.scenes set data = '{}'::jsonb where project_id = v_project;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B updated A scene (%)', n; end if;

  begin
    insert into public.scenes (project_id, schema_version, data)
    values (v_project, 1, '{}'::jsonb);
    raise exception 'FAIL: B inserted a scene for A project';
  exception
    when insufficient_privilege then null;
    when unique_violation then raise exception 'FAIL: B passed the insert policy for A project';
  end;

  -- 3) Signed in as A: the version is controlled by the server
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_a, 'role', 'authenticated')::text, true);

  begin
    update public.scenes set version = 999 where project_id = v_project;
    raise exception 'FAIL: A set the version directly';
  exception when insufficient_privilege then
    null;
  end;

  update public.scenes set data = data where project_id = v_project;
  select version into v_new from public.scenes where project_id = v_project;
  if v_new <> v_version + 1 then
    raise exception 'FAIL: version did not increase by 1 (% -> %)', v_version, v_new;
  end if;
end $$;