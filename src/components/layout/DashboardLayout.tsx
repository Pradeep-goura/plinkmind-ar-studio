import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/StatusBadge'
import { PlinkmindMark } from './PlinkmindMark'

const plannedItems = ['Team', 'Settings']

export function DashboardLayout() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="border-b border-black/10 bg-brand-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-3" aria-label="Plinkmind AR Studio home">
            <PlinkmindMark />
            <span className="text-xl font-light">Plinkmind</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[220px] truncate text-sm sm:inline">{user?.email}</span>
            <Button variant="outline" onClick={() => void signOut()}>Sign out</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[200px_1fr]">
        <nav aria-label="Dashboard navigation" className="flex flex-wrap gap-2 md:flex-col">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-brand-ink text-brand-paper' : 'hover:bg-black/10'
              }`
            }
          >
            Projects
          </NavLink>
                    <NavLink
            to="/dashboard/assets"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-brand-ink text-brand-paper' : 'hover:bg-black/10'
              }`
            }
          >
            Assets
          </NavLink>
          {plannedItems.map((item) => (
            <span
              key={item}
              aria-disabled="true"
              className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-neutral-700"
            >
              {item}
              <StatusBadge tone="planned" label="Planned" />
            </span>
          ))}
        </nav>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}