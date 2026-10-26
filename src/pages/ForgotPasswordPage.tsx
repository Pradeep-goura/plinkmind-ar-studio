import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Notice } from '../components/ui/Notice'
import { TextField } from '../components/ui/TextField'
import { friendlyAuthError } from '../features/auth/authErrors'
import { isSupabaseConfigured, supabase } from '../lib/supabase/client'
import { firstError, forgotPasswordSchema } from '../lib/validation/forms'

export function ForgotPasswordPage() {
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const parsed = forgotPasswordSchema.safeParse({ email: String(form.get('email') ?? '') })
    if (!parsed.success) {
      setError(firstError(parsed.error))
      return
    }
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured.')
      return
    }

    setBusy(true)
    setError('')
    setSent(false)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setBusy(false)

    if (resetError?.status === 429) {
      setError(friendlyAuthError(resetError))
    } else {
      // Same message whether or not the account exists, so emails cannot be probed.
      setSent(true)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-card bg-brand-paper p-8">
      <h1 className="text-2xl font-semibold">Reset your password</h1>
      <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <TextField id="email" name="email" type="email" label="Email" autoComplete="email" required />
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>

      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {sent && (
        <div className="mt-4">
          <Notice tone="info" title="Check your email">
            If an account exists for that email, a reset link has been sent.
          </Notice>
        </div>
      )}

      <p className="mt-6 text-sm">
        <Link to="/sign-in" className="font-medium text-brand-link underline">Back to sign in</Link>
      </p>
    </div>
  )
}