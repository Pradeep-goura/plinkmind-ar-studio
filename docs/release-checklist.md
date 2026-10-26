# Release checklist (running list)

Do not deploy publicly until all of these are done:

- [ ] Turn ON "Confirm email" in Supabase Auth (it is OFF for development)
- [ ] Set up custom SMTP (the default sender is limited to 2 emails per hour)
- [ ] Remove the /status developer page
- [ ] Set Site URL and Redirect URLs to the real https domain
- [ ] Re-run supabase/tests/rls_isolation.sql after every schema change
- [ ] Check Supabase free-plan limits on the official pricing page
- [ ] Legal review of the Privacy and Terms drafts
- [ ] Add code-splitting (large JS bundle warning)
- [ ] Re-validate uploaded files on the server when publishing (the browser-side signature check can be bypassed)
- [ ] Clean up storage files left behind by deleted workspaces or interrupted uploads
- [ ] Review licenses: three.js (MIT) and the Draco decoder files in public/draco (Apache-2.0)
- [ ] Re-run supabase/tests/assets_isolation.sql after every storage change
- [ ] Check total storage limit on the Supabase Usage page