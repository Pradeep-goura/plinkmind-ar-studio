import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="py-16">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-3">
        <Link to="/" className="text-brand-link underline">
          Go back to Home
        </Link>
      </p>
    </section>
  )
}