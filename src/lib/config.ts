// This only controls what the screen shows.
// The REAL lock is the "Allow new users to sign up" setting in Supabase Auth.
export const SIGNUPS_OPEN = import.meta.env.VITE_SIGNUPS_OPEN === 'true'
// Slug of a PUBLISHED project to show as a sample on the home page. Leave empty to hide it.
// Slugs are public by design, so it is safe to keep here.
export const DEMO_EXPERIENCE_SLUG = '00313386a89a'