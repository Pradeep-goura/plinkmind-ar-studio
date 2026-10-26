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