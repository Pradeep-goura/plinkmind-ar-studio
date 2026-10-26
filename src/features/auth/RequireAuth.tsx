import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

// Convenience only. Real protection comes from Row Level Security in the database.
export function RequireAuth() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <p role="status" className="p-8">
        Loading...
      </p>
    )
  }
  if (!user) return <Navigate to="/sign-in" replace />
  return <Outlet />
}