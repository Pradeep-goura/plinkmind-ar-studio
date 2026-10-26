import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && key)

// Only the PUBLIC url and PUBLISHABLE key are used in the browser.
// The fallback values keep the app from crashing when .env.local is missing;
// isSupabaseConfigured tells the UI to show a helpful message instead.
export const supabase = createClient(
  url ?? 'http://localhost:54321',
  key ?? 'missing-publishable-key',
)