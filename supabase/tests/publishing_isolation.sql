-- Publishing isolation test. Replace the two placeholder IDs with real user IDs
-- (select id, email from auth.users). User A must have a LIVE published project
-- (publish one from the dashboard first). User B must not be a member of A's workspace.
-- "Success. No rows returned" = pass. Any error = a problem to investigate.
do $$
declare
  v_a uuid := 'PUT-A-ID-HERE';
  v_b uuid := 'PUT-B-ID-HERE';
  v_exp uuid;
  v_project uuid;
  v_slug text;
  v_live_version int;
  v_live_count int;
  v_asset uuid;
  n int;
  result jsonb;
begin
  select e.id, e.project_id, e.slug, e.live_version
    into v_exp, v_project, v_slug, v_live_version
  from public.published_experiences e
  join public.projects p on p.id = e.project_id
  where p.created_by = v_a and e.status = 'live'
  limit 1;
  if v_exp is null then
    raise exception 'TEST INVALID: user A has no live published project';
  end if;

   select count(distinct storage_path) into v_live_count
  from public.published_assets
  where experience_id = v_exp and version = v_live_version;

  select asset_id into v_asset
  from public.published_assets
  where experience_id = v_exp and version = v_live_version
  limit 1;
  if v_live_count = 0 then
    raise exception 'TEST INVALID: the live version has no assets';
  end if;

  -- 1) Not signed in
  set local role anon;

  begin
    perform 1 from public.published_experiences limit 1;
    raise exception 'FAIL: anon can read published_experiences';
  exception when insufficient_privilege then null;
  end;

  begin
    perform 1 from public.published_versions limit 1;
    raise exception 'FAIL: anon can read published_versions';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.publish_project(v_project);
    raise exception 'FAIL: anon can publish';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.unpublish_project(v_project);
    raise exception 'FAIL: anon can unpublish';
  exception when insufficient_privilege then null;
  end;

  result := public.get_public_experience(v_slug);
  if result is null then raise exception 'FAIL: anon cannot load the live experience'; end if;
  if result ->> 'title' is null then raise exception 'FAIL: public result has no title'; end if;
  if result::text like '%published_by%' then raise exception 'FAIL: public result leaks the publisher'; end if;

  if public.get_public_experience('zzzzzzzzzzzz') is not null then
    raise exception 'FAIL: an unknown slug returned data';
  end if;
  if public.get_public_experience('../../x') is not null then
    raise exception 'FAIL: an invalid slug returned data';
  end if;

  -- Anonymous visitors may see ONLY the files of the live version.
  select count(*) into n from storage.objects where bucket_id = 'project-assets';
  if n <> v_live_count then
    raise exception 'FAIL: anon sees % files, expected only the % live ones', n, v_live_count;
  end if;

  -- 2) Signed in as B (not a member of A's workspace)
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_b, 'role', 'authenticated')::text, true);

  select count(*) into n from public.published_experiences where id = v_exp;
  if n <> 0 then raise exception 'FAIL: B can read A experience (%)', n; end if;

  begin
    perform public.publish_project(v_project);
    raise exception 'FAIL: B published A project';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.unpublish_project(v_project);
    raise exception 'FAIL: B unpublished A project';
  exception when insufficient_privilege then null;
  end;

  -- 3) Signed in as A
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_a, 'role', 'authenticated')::text, true);

  begin
    update public.published_versions set title = 'changed' where experience_id = v_exp;
    raise exception 'FAIL: A edited a published version';
  exception when insufficient_privilege then null;
  end;

  begin
    delete from public.published_versions where experience_id = v_exp;
    raise exception 'FAIL: A deleted a published version';
  exception when insufficient_privilege then null;
  end;

  delete from public.assets where id = v_asset;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: A deleted an asset used by a live experience'; end if;
end $$;