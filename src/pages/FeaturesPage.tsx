import { Notice } from '../components/ui/Notice'
import { StatusBadge } from '../components/ui/StatusBadge'
import { features } from '../features/marketing/content'

export function FeaturesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Features</h1>
        <p className="mt-2 max-w-2xl">
          This is the planned feature list. Every item below is marked Planned because none of
          them is built yet. We will change a label only after the feature is built and tested.
        </p>
      </div>

      <Notice tone="warning" title="Device support is not promised yet">
        AR works differently on different phones and browsers. We will test on real devices and
        publish what actually works before calling anything supported.
      </Notice>

      <ul className="grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <li key={feature.title} className="rounded-card bg-brand-paper p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{feature.title}</h2>
              <StatusBadge tone="planned" label="Planned" />
            </div>
            <p className="mt-2 text-sm">{feature.text}</p>
            {feature.note && <p className="mt-2 text-sm text-neutral-700">{feature.note}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}