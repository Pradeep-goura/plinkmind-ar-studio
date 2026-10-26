-- Assets isolation test. Replace the two placeholder IDs with real user IDs
-- (select id, email from auth.users). User A must have uploaded at least one asset.
-- "Success. No rows returned" = pass. Any error containing FAIL = security problem.
do $$
declare
  v_a uuid := 'PUT-A-ID-HERE';
  v_b uuid := 'PUT-B-ID-HERE';
  v_a_workspace uuid;
  n int;
begin
  select a.workspace_id into v_a_workspace from public.assets a where a.uploaded_by = v_a limit 1;
  if v_a_workspace is null then
    raise exception 'TEST INVALID: user A has no assets';
  end if;

  select count(*) into n from storage.objects
  where bucket_id = 'project-assets' and (storage.foldername(name))[1] = v_a_workspace::text;
  if n = 0 then
    raise exception 'TEST INVALID: user A has no stored files';
  end if;

  -- 1) Not signed in
  set local role anon;
  begin
    perform 1 from public.assets limit 1;
    raise exception 'FAIL: anon can read assets';
  exception when insufficient_privilege then
    null;
  end;
  begin
    select count(*) into n from storage.objects where bucket_id = 'project-assets';
    if n <> 0 then raise exception 'FAIL: anon can see stored files (%)', n; end if;
  exception when insufficient_privilege then
    null;
  end;

  -- 2) Signed in as B
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_b, 'role', 'authenticated')::text, true);

  select count(*) into n from public.assets where workspace_id = v_a_workspace;
  if n <> 0 then raise exception 'FAIL: B can read A assets (%)', n; end if;

  select count(*) into n from storage.objects
  where bucket_id = 'project-assets' and (storage.foldername(name))[1] = v_a_workspace::text;
  if n <> 0 then raise exception 'FAIL: B can see A stored files (%)', n; end if;

  delete from public.assets where workspace_id = v_a_workspace;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B deleted A assets (%)', n; end if;

  begin
    perform public.register_asset(
      gen_random_uuid(), v_a_workspace, 'image', 'x.png',
      v_a_workspace::text || '/' || gen_random_uuid()::text || '.png');
    raise exception 'FAIL: B registered an asset in A workspace';
  exception when insufficient_privilege then
    null;
  end;
end $$;