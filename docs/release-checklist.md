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
- [ ] Re-run supabase/tests/scenes_isolation.sql after every schema change
- [ ] Validate scene data on the server when publishing (a scene may reference an asset from another workspace)
- [ ] Test the 3D editor on real phones and tablets (touch gizmo handles, performance with large models)
- [ ] Add a size/triangle warning for heavy models in the editor
- [ ] Re-run supabase/tests/publishing_isolation.sql after every publishing change
- [ ] Re-check uploaded files on the server at publish time (magic bytes) with an Edge Function
- [ ] Re-validate numeric scene values (position/rotation/scale ranges) at publish time; the public viewer also validates on load
- [ ] Decide signed-link lifetime for public viewing and test a page left open for hours
- [ ] Add rate limiting or caching in front of get_public_experience
- [ ] The public asset path contains the workspace id; decide whether that is acceptable
- [ ] Print a QR code and scan it from a distance, on at least two phones
- [ ] Review the qr package license (MIT)