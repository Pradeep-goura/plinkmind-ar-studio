export function HomePage() {
  return (
    <section className="rounded-card bg-brand-ink p-8 text-brand-paper md:p-12">
      <p className="mb-4 inline-block rounded bg-brand-warm px-3 py-1 text-sm text-brand-ink">
        Foundation build: provisional design, no product features yet
      </p>
      <h1 className="text-4xl font-semibold uppercase leading-tight md:text-6xl">
        Plinkmind
        <br />
        AR Studio
      </h1>
      <p className="mt-6 max-w-xl text-lg text-brand-warm">
        A browser-based studio to create, publish and share AR experiences.
        This page is the project foundation. Upload, editor, publishing and QR codes are planned
        and not available yet.
      </p>
    </section>
  )
}