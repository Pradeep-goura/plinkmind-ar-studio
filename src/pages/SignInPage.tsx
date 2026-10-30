import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Notice } from '../components/ui/Notice'
import { TextField } from '../components/ui/TextField'
import { friendlyAuthError } from '../features/auth/authErrors'
import { useAuth } from '../features/auth/useAuth'
import { isSupabaseConfigured, supabase } from '../lib/supabase/client'
import { firstError, signInSchema } from '../lib/validation/forms'
import { SIGNUPS_OPEN } from '../lib/config'

export function SignInPage() {
  const { user } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const parsed = signInSchema.safeParse({
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
    })
    if (!parsed.success) {
      setError(firstError(parsed.error))
      return
    }
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Check .env.local and restart npm run dev.')
      return
    }

    setBusy(true)
    setError('')
    const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data)
    setBusy(false)
    if (signInError) setError(friendlyAuthError(signInError))
  }

  return (
    <div className="mx-auto max-w-md rounded-card bg-brand-paper p-8">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <TextField id="email" name="email" type="email" label="Email" autoComplete="email" required />
        <TextField id="password" name="password" type="password" label="Password" autoComplete="current-password" required />
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <p className="mt-6 text-sm">
        <Link to="/forgot-password" className="font-medium text-brand-link underline">Forgot password?</Link>
      </p>
            {SIGNUPS_OPEN && (
        <p className="mt-2 text-sm">
          No account yet?{' '}
          <Link to="/register" className="font-medium text-brand-link underline">Register</Link>
        </p>
      )}
      
    </div>
  )
}