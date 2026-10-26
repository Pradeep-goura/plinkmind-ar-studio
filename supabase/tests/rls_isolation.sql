-- RLS isolation test. Replace the two placeholder IDs with real user IDs
-- (select id, email from auth.users), make sure user A has a project, then run.
-- "Success. No rows returned" = pass. Any error containing FAIL = security problem.

do $$
declare
  v_a uuid := 'PUT-A-ID-HERE';
  v_b uuid := 'PUT-B-ID-HERE';
  v_a_workspace uuid;
  n int;
begin
  -- Setup as admin: make sure A really has data, otherwise the test proves nothing.
  select workspace_id into v_a_workspace from public.projects where created_by = v_a limit 1;
  if v_a_workspace is null then
    raise exception 'TEST INVALID: user A has no projects';
  end if;

  -- 1) Not signed in (anon): must be blocked completely.
  set local role anon;
  begin
    perform 1 from public.projects limit 1;
    raise exception 'FAIL: anon can read projects';
  exception when insufficient_privilege then
    null;
  end;

  -- 2) Signed in as B: must not touch A's data.
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_b, 'role', 'authenticated')::text, true);

  select count(*) into n from public.projects where created_by = v_a;
  if n <> 0 then raise exception 'FAIL: B can read A projects (%)', n; end if;

  select count(*) into n from public.profiles where id = v_a;
  if n <> 0 then raise exception 'FAIL: B can read A profile (%)', n; end if;

  update public.projects set name = 'hacked' where created_by = v_a;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B updated A projects (%)', n; end if;

  delete from public.projects where created_by = v_a;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B deleted A projects (%)', n; end if;

  begin
    insert into public.projects (workspace_id, name) values (v_a_workspace, 'intruder');
    raise exception 'FAIL: B inserted a project into A workspace';
  exception when insufficient_privilege then
    null;
  end;

  -- 3) Signed in as A: cannot self-publish (status is not writable from the browser).
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  begin
    update public.projects set status = 'published' where created_by = v_a;
    raise exception 'FAIL: A changed status from the browser';
  exception when insufficient_privilege then
    null;
  end;
end $$;