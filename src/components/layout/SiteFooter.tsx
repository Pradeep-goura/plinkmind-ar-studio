import { Link } from 'react-router-dom'

export function SiteFooter() {
  return (
    <footer className="border-t border-black/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm">
        <p>Plinkmind AR Studio is in development.</p>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-4">
          <Link to="/privacy" className="underline">Privacy (draft)</Link>
          <Link to="/terms" className="underline">Terms (draft)</Link>
          <a href="https://www.plinkmind.world/" target="_blank" rel="noreferrer" className="underline">
            plinkmind.world
          </a>
        </nav>
      </div>
    </footer>
  )
}