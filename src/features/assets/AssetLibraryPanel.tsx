import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { formatBytes } from './fileRules'
import type { Asset } from '../../types/asset'

type AssetLibraryPanelProps = {
  assets: Asset[]
  full: boolean
  onAddModel: (asset: Asset) => void
  onAddAudio: (asset: Asset) => void
}

export function AssetLibraryPanel({ assets, full, onAddModel, onAddAudio }: AssetLibraryPanelProps) {
  const models = assets.filter((asset) => asset.kind === 'model')
  const audios = assets.filter((asset) => asset.kind === 'audio')

  function renderList(list: Asset[], onAdd: (asset: Asset) => void) {
    return (
      <ul className="space-y-2">
        {list.map((asset) => (
          <li key={asset.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 break-words">
              {asset.originalName}
                           <span className="block text-xs text-neutral-700">
                {formatBytes(asset.sizeBytes)}
                {asset.kind === 'model' && asset.sizeBytes > 15 * 1024 * 1024 && ' · large: may be slow on phones'}
              </span>
            </span>
            <Button variant="outline" disabled={full} onClick={() => onAdd(asset)} aria-label={`Add ${asset.originalName} to the scene`}>
              Add
            </Button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section aria-labelledby="library-heading" className="rounded-card bg-brand-paper p-4">
      <h2 id="library-heading" className="mb-3 text-lg font-semibold">Asset library</h2>
      {full && <p className="mb-2 text-sm">The scene has reached its object limit.</p>}
      {assets.length === 0 && (
        <p className="text-sm">
          No assets yet. <Link to="/dashboard/assets" className="font-medium underline">Upload some first.</Link>
        </p>
      )}
      {models.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold">3D models</h3>
          {renderList(models, onAddModel)}
        </div>
      )}
      {audios.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold">Audio</h3>
          {renderList(audios, onAddAudio)}
        </div>
      )}
      <p className="text-xs text-neutral-700">Image and video objects are planned and not available yet.</p>
    </section>
  )
}