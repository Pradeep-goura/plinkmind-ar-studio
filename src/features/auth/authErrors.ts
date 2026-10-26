import type { AuthError } from '@supabase/supabase-js'

export function friendlyAuthError(error: AuthError): string {
  const message = error.message.toLowerCase()
  if (message.includes('invalid login credentials')) return 'Email or password is incorrect.'
  if (message.includes('email not confirmed')) return 'Please confirm your email first, then sign in.'
  if (message.includes('rate limit') || error.status === 429) {
    return 'Too many attempts or emails sent. Please wait a while and try again.'
  }
  if (message.includes('already registered')) {
    return 'Could not create the account. If you already registered, try signing in.'
  }
  return 'Something went wrong. Please try again.'
}