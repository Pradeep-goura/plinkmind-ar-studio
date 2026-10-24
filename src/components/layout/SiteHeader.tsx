import { NavLink } from 'react-router-dom'
import { PlinkmindMark } from './PlinkmindMark'

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
      <div className="flex items-center gap-3">
        <PlinkmindMark />
        <span className="text-2xl font-light tracking-tight">Plinkmind</span>
      </div>
      <nav aria-label="Main navigation">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive
              ? 'border-b-2 border-brand-link pb-1 text-brand-link'
              : 'pb-1 hover:text-brand-link'
          }
        >
          Home
        </NavLink>
      </nav>
    </header>
  )
}