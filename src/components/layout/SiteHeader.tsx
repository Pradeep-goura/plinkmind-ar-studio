import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { Button, ButtonLink } from '../ui/Button'
import { PlinkmindMark } from './PlinkmindMark'

function navClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'border-b-2 border-brand-link pb-1 text-brand-link'
    : 'border-b-2 border-transparent pb-1 hover:text-brand-link'
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAuth()

  const links = [
    { to: '/', label: 'Home', end: true },
    { to: '/features', label: 'Features', end: false },
    ...(user ? [{ to: '/dashboard', label: 'Dashboard', end: false }] : []),
  ]

  return (
    <header className="mx-auto w-full max-w-6xl px-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3" aria-label="Plinkmind AR Studio home">
          <PlinkmindMark />
          <span className="text-2xl font-light tracking-tight">Plinkmind</span>
        </Link>

        <button
          type="button"
          className="rounded-md border border-brand-ink px-3 py-1.5 text-sm md:hidden"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen(!open)}
        >
          {open ? 'Close' : 'Menu'}
        </button>

        <nav
          id="main-nav"
          aria-label="Main navigation"
          className={`${open ? 'flex' : 'hidden'} w-full flex-col gap-3 md:flex md:w-auto md:flex-row md:items-center md:gap-6`}
        >
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navClass} onClick={() => setOpen(false)}>
              {link.label}
            </NavLink>
          ))}
          {user ? (
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false)
                void signOut()
              }}
            >
              Sign out
            </Button>
          ) : (
            <>
              <NavLink to="/sign-in" className={navClass} onClick={() => setOpen(false)}>
                Sign in
              </NavLink>
              <ButtonLink to="/register" onClick={() => setOpen(false)}>
                Register
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}