import { useEffect, useState } from 'react'
import { Notice } from '../components/ui/Notice'
import { isSupabaseConfigured, supabase } from '../lib/supabase/client'

export function StatusPage() {
  const [message, setMessage] = useState('Checking connection...')

  useEffect(() => {
    if (!isSupabaseConfigured) return

    supabase
      .from('projects')
      .select('id')
      .limit(1)
      .then(({ data, error }) => {
        if (error?.code === '42501') {
          setMessage('Connected. Not-signed-in access to projects is blocked, as intended.')
        } else if (error) {
          setMessage(`Unexpected error: ${error.code ?? 'no code'} - ${error.message}`)
        } else {
          setMessage(`WARNING: a not-signed-in visitor could read the projects table (${data.length} rows).`)
        }
      })
  }, [])

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-semibold">Developer check</h1>
      <p className="text-sm">
        A temporary page to confirm the Supabase connection. It will be removed later.
      </p>
      {isSupabaseConfigured ? (
        <Notice tone="info" title="Supabase connection">{message}</Notice>
      ) : (
        <Notice tone="error" title="Supabase is not configured">
          Create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then restart npm run dev.
        </Notice>
      )}
    </div>
  )
}