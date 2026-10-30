// This only controls what the screen shows.
// The REAL lock is the "Allow new users to sign up" setting in Supabase Auth.
export const SIGNUPS_OPEN = import.meta.env.VITE_SIGNUPS_OPEN === 'true'