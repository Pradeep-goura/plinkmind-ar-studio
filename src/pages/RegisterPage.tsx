import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Notice } from '../components/ui/Notice'
import { TextField } from '../components/ui/TextField'

export function RegisterPage() {
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="mx-auto max-w-md rounded-card bg-brand-paper p-8">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          const password = String(form.get('password') ?? '')
          const confirm = String(form.get('confirm') ?? '')

          if (password !== confirm) {
            setSubmitted(false)
            setError('The two passwords do not match.')
            return
          }
          setError('')
          setSubmitted(true)
        }}
      >
        <TextField id="name" name="name" label="Full name" autoComplete="name" required />
        <TextField id="email" name="email" type="email" label="Email" autoComplete="email" required />
        <TextField id="password" name="password" type="password" label="Password (at least 8 characters)" autoComplete="new-password" required minLength={8} />
        <TextField id="confirm" name="confirm" type="password" label="Confirm password" autoComplete="new-password" required minLength={8} />
        <Button type="submit" className="w-full">Register</Button>
      </form>

      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {submitted && (
        <div className="mt-4">
          <Notice tone="info" title="Registration is not connected yet">
            No account was created. Real registration arrives in Phase 3 with Supabase. Nothing
            was sent or stored.
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