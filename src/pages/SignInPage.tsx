import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Notice } from '../components/ui/Notice'
import { TextField } from '../components/ui/TextField'

export function SignInPage() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="mx-auto max-w-md rounded-card bg-brand-paper p-8">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(true)
        }}
      >
        <TextField id="email" name="email" type="email" label="Email" autoComplete="email" required />
        <TextField id="password" name="password" type="password" label="Password" autoComplete="current-password" required />
        <Button type="submit" className="w-full">Sign in</Button>
      </form>

      {submitted && (
        <div className="mt-4">
          <Notice tone="info" title="Sign-in is not connected yet">
            Real accounts arrive in Phase 3 with Supabase. Nothing was sent or stored.
          </Notice>
        </div>
      )}

      <p className="mt-6 text-sm">
        No account yet?{' '}
        <Link to="/register" className="font-medium text-brand-link underline">Register</Link>
      </p>
    </div>
  )
}