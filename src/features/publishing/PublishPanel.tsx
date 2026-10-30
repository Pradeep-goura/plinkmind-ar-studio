import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import type { Project } from '../../types/project'
import { buildExperienceUrl } from './experienceUrl'
import type { PublishInfo } from './publishApi'
import { QrCode } from './QrCode'

type PublishPanelProps = {
  project: Project
  info: PublishInfo | undefined
  busy: boolean
  onPublish: () => void
  onUnpublish: () => void
}

export function PublishPanel({ project, info, busy, onPublish, onUnpublish }: PublishPanelProps) {
  const [showQr, setShowQr] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  if (project.trackingMode === 'image') {
    return (
      <p className="mt-4 border-t border-neutral-300 pt-4 text-sm text-neutral-700">
        Image-target projects cannot be published yet (planned).
      </p>
    )
  }

  if (!info || info.status !== 'live') {
    return (
      <div className="mt-4 border-t border-neutral-300 pt-4">
        <p className="text-sm">
          {info
            ? 'Unpublished. Publishing again keeps the same link and creates a new version.'
            : 'Not published yet.'}
        </p>
        <Button className="mt-2" disabled={busy} onClick={onPublish}>
          Publish
        </Button>
      </div>
    )
  }

  const url = buildExperienceUrl(window.location.origin, info.slug)
  const onLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <div className="mt-4 space-y-3 border-t border-neutral-300 pt-4">
      <p className="text-sm font-medium">Live · version {info.liveVersion}</p>

      <div>
        <label htmlFor={`link-${project.id}`} className="mb-1 block text-xs font-medium">
          Public link
        </label>
        <input
          id={`link-${project.id}`}
          readOnly
          value={url}
          onFocus={(event) => event.target.select()}
          className="w-full rounded-md border border-neutral-500 bg-neutral-50 px-2 py-1 text-sm"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => void copyLink()}>Copy link</Button>
          <Button variant="outline" onClick={() => setShowQr(!showQr)}>
            {showQr ? 'Hide QR code' : 'Show QR code'}
          </Button>
          <span role="status" className="text-sm">
            {copyState === 'copied' && 'Link copied.'}
            {copyState === 'failed' && 'Could not copy. Select the link and copy it manually.'}
          </span>
        </div>
      </div>

      {onLocalhost && (
        <p className="text-xs text-neutral-700">
          This link uses localhost, so it only works on this computer. Phones need the deployed address.
        </p>
      )}
            <a href={url} target="_blank" rel="noreferrer" className="block text-sm font-medium text-brand-link underline">
        Open public page
      </a>

      {showQr && <QrCode text={url} filename={`plinkmind-qr-${info.slug}.png`} />}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={busy} onClick={onPublish}>Publish new version</Button>
        <Button variant="outline" disabled={busy} onClick={onUnpublish}>Unpublish</Button>
      </div>
    </div>
  )
}