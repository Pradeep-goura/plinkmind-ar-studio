import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Notice } from '../components/ui/Notice'
import { TextField } from '../components/ui/TextField'
import { friendlyAuthError } from '../features/auth/authErrors'
import { useAuth } from '../features/auth/useAuth'
import { isSupabaseConfigured, supabase } from '../lib/supabase/client'
import { firstError, registerSchema } from '../lib/validation/forms'

export function RegisterPage() {
  const { user } = useAuth()
  const [error, setError] = useState('')
  const [checkEmail, setCheckEmail] = useState(false)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const parsed = registerSchema.safeParse({
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      confirm: String(form.get('confirm') ?? ''),
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
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { full_name: parsed.data.name } },
    })
    setBusy(false)

    if (signUpError) {
      setError(friendlyAuthError(signUpError))
    } else if (!data.session) {
      setCheckEmail(true)
    }
    // If a session exists, the user is signed in and this page redirects to the dashboard.
  }

  return (
    <div className="mx-auto max-w-md rounded-card bg-brand-paper p-8">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <TextField id="name" name="name" label="Full name" autoComplete="name" required />
        <TextField id="email" name="email" type="email" label="Email" autoComplete="email" required />
        <TextField id="password" name="password" type="password" label="Password (at least 8 characters)" autoComplete="new-password" required minLength={8} />
        <TextField id="confirm" name="confirm" type="password" label="Confirm password" autoComplete="new-password" required minLength={8} />
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Creating account...' : 'Register'}
        </Button>
      </form>

      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {checkEmail && (
        <div className="mt-4">
          <Notice tone="info" title="Check your email">
            We sent a confirmation link. Open it, then sign in.
          </Notice>
        </div>
      )}

      <p className="mt-6 text-sm">
        Already have an account?{' '}
        <Link to="/sign-in" className="font-medium text-brand-link underline">Sign in</Link>
      </p>
    </div>
  )
}