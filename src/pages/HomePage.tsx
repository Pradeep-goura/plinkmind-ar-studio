import { ButtonLink } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/StatusBadge'
import { howItWorks, useCases } from '../features/marketing/content'
import { DemoViewer } from '../features/publishing/DemoViewer'

const marqueeText = 'We Are XR Optimizers |'

export function HomePage() {
  return (
    <div className="space-y-14">
      <section className="overflow-hidden rounded-card bg-brand-ink text-brand-paper">
        <div className="p-8 md:p-12">
          <StatusBadge tone="info" label="In development · closed beta" />
          <h1 className="mt-4 text-4xl font-semibold uppercase leading-tight md:text-6xl">
            Plinkmind
            <br />
            AR Studio
          </h1>
          <p className="mt-6 max-w-xl text-lg text-brand-warm">
            A browser-based studio to upload 3D models, add sound, publish, and share AR experiences
            through a link or a QR code.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/features" variant="light">See planned features</ButtonLink>
            <ButtonLink to="/dashboard" variant="outlineLight">Open dashboard</ButtonLink>
          </div>
        </div>

        <div aria-hidden="true" className="overflow-hidden border-t border-white/15 py-4 text-brand-warm">
          <div className="marquee-track whitespace-nowrap text-3xl font-semibold uppercase tracking-tight md:text-5xl">
            {[0, 1].map((half) => (
              <div key={half} className="flex shrink-0">
                {Array.from({ length: 4 }, (_, index) => (
                  <span key={index} className="px-6">{marqueeText}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <DemoViewer />

      <section aria-labelledby="how-heading">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 id="how-heading" className="text-2xl font-semibold">How it works</h2>
        </div>
        <ol className="grid gap-4 md:grid-cols-4">
          {howItWorks.map((step, index) => (
            <li key={step.title} className="rounded-card bg-brand-paper p-5">
              <p className="text-sm font-medium text-neutral-700">Step {index + 1}</p>
              <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="use-heading">
        <h2 id="use-heading" className="text-2xl font-semibold">Potential use cases</h2>
        <p className="mt-1 text-sm text-neutral-800">
          These are areas where AR can help. They are not claims about existing customers.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {useCases.map((useCase) => (
            <li key={useCase} className="rounded-md bg-brand-paper p-4 text-sm font-medium">
              {useCase}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="contact-heading" className="rounded-card bg-brand-paper p-6">
        <h2 id="contact-heading" className="text-2xl font-semibold">Contact</h2>
        <p className="mt-2 text-sm">
          There is no enquiry form yet. For now, please reach Plinkmind through its main website.
        </p>
        <p className="mt-3">
          <a
            href="https://www.plinkmind.world/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand-link underline"
          >
            Visit plinkmind.world
          </a>
        </p>
      </section>
    </div>
  )
}