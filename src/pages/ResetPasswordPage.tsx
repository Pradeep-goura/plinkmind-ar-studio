import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Notice } from '../components/ui/Notice'
import { TextField } from '../components/ui/TextField'
import { useAuth } from '../features/auth/useAuth'
import { supabase } from '../lib/supabase/client'
import { firstError, newPasswordSchema } from '../lib/validation/forms'

export function ResetPasswordPage() {
  const { user, loading } = useAuth()
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const parsed = newPasswordSchema.safeParse({
      password: String(form.get('password') ?? ''),
      confirm: String(form.get('confirm') ?? ''),
    })
    if (!parsed.success) {
      setError(firstError(parsed.error))
      return
    }

    setBusy(true)
    setError('')
    const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.password })
    setBusy(false)

    if (updateError) setError('Could not update the password. The link may have expired.')
    else setDone(true)
  }

  if (loading) return <p role="status">Loading...</p>

  return (
    <div className="mx-auto max-w-md rounded-card bg-brand-paper p-8">
      <h1 className="text-2xl font-semibold">Choose a new password</h1>

      {!user ? (
        <div className="mt-4">
          <Notice tone="warning" title="Reset link needed">
            Open this page from the link in your password reset email. The link may have expired.
          </Notice>
          <p className="mt-4 text-sm">
            <Link to="/forgot-password" className="font-medium text-brand-link underline">Send a new link</Link>
          </p>
        </div>
      ) : done ? (
        <div className="mt-4">
          <Notice tone="success">Your password was updated.</Notice>
          <p className="mt-4 text-sm">
            <Link to="/dashboard" className="font-medium text-brand-link underline">Go to dashboard</Link>
          </p>
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <TextField id="password" name="password" type="password" label="New password (at least 8 characters)" autoComplete="new-password" required minLength={8} />
          <TextField id="confirm" name="confirm" type="password" label="Confirm new password" autoComplete="new-password" required minLength={8} />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Saving...' : 'Update password'}
          </Button>
        </form>
      )}

      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
    </div>
  )
}