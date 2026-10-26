import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import type { Asset } from '../../types/asset'
import { formatBytes } from './fileRules'

type AssetRowProps = {
  asset: Asset
  busy: boolean
  onPreview: () => void
  onDelete: () => void
}

const kindLabels = { model: '3D model', audio: 'Audio', image: 'Image' }

export function AssetRow({ asset, busy, onPreview, onDelete }: AssetRowProps) {
  const [confirming, setConfirming] = useState(false)

  return (
    <li className="rounded-card bg-brand-paper p-5">
      <div className="mb-2 flex flex-wrap gap-2">
        <StatusBadge tone="info" label={kindLabels[asset.kind]} />
      </div>
      <h3 className="break-words text-lg font-semibold">{asset.originalName}</h3>
      <p className="mt-1 text-sm text-neutral-700">
        {formatBytes(asset.sizeBytes)} · Uploaded{' '}
        {new Date(asset.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </p>

      {confirming ? (
        <div className="mt-4 rounded-md border border-red-700 bg-red-50 p-3 text-sm" role="group" aria-label="Confirm delete">
          <p>Delete "{asset.originalName}"? This cannot be undone.</p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => {
                setConfirming(false)
                onDelete()
              }}
            >
              Yes, delete
            </Button>
            <Button variant="outline" onClick={() => setConfirming(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={onPreview}>Preview</Button>
          <Button variant="outline" disabled={busy} onClick={() => setConfirming(true)}>Delete</Button>
        </div>
      )}
    </li>
  )
}