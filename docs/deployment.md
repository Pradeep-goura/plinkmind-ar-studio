# Deployment notes

Host: Cloudflare Workers (static assets), deployed from GitHub `main` with Workers Builds.

## Build settings
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables (names only, never secrets):
  - NODE_VERSION
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_PUBLISHABLE_KEY
  - VITE_SIGNUPS_OPEN (false during the closed beta)
- Vite bakes VITE_ values into the app at build time. After changing one, redeploy.
- NEVER add the Supabase secret key or service_role key here.

## Closed beta
- Supabase Auth: "Allow new users to sign up" is OFF.
- Add a user: Supabase dashboard > Authentication > Users > Add user (tick auto-confirm).
- Password reset emails are not reliable yet (default sender limits). Set a password from the dashboard.

## Rollback
Cloudflare dashboard > the project > Deployments > pick an earlier deployment > roll back.

## Known risks
- Supabase free projects pause after about 7 days of inactivity. A paused project breaks published AR links.
- No Content-Security-Policy yet.
- get_public_experience has no rate limit.