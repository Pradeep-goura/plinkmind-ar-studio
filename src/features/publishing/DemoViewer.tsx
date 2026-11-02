import { StatusBadge } from '../../components/ui/StatusBadge'
import { DEMO_EXPERIENCE_SLUG } from '../../lib/config'
import { buildExperienceUrl, isValidSlug } from './experienceUrl'
import { QrCode } from './QrCode'

const demoSlug = isValidSlug(DEMO_EXPERIENCE_SLUG) ? DEMO_EXPERIENCE_SLUG : null

// The 3D model itself lives in the page header. This section is only for opening it on a phone.
export function DemoViewer() {
  if (!demoSlug) return null
  const phoneUrl = buildExperienceUrl(window.location.origin, demoSlug)

  return (
    <section
      aria-labelledby="phone-heading"
      className="flex flex-wrap items-center gap-6 rounded-card bg-brand-paper p-6"
    >
      <div className="min-w-[220px] flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h2 id="phone-heading" className="text-2xl font-semibold">Try it on your phone</h2>
          <StatusBadge tone="sample" label="Sample experience" />
        </div>
        <p className="text-sm">
          Scan the code with your phone camera to open the sample and place it in your room with AR.
          AR needs a supported phone, and results can differ between devices.
        </p>
        <a
          href={phoneUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block text-sm font-medium text-brand-link underline"
        >
          Open the AR page
        </a>
      </div>
      <QrCode text={phoneUrl} filename="plinkmind-sample-qr.png" showDownload={false} />
    </section>
  )
}