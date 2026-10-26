import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import type { Asset } from '../../types/asset'
import type { Scene } from './sceneSchema'

type HierarchyPanelProps = {
  scene: Scene
  selectedId: string | null
  assetsById: Map<string, Asset>
  onSelect: (id: string) => void
  onToggleVisible: (id: string) => void
  onDelete: (id: string) => void
}

export function HierarchyPanel({ scene, selectedId, assetsById, onSelect, onToggleVisible, onDelete }: HierarchyPanelProps) {
  return (
    <section aria-labelledby="hierarchy-heading" className="rounded-card bg-brand-paper p-4">
      <h2 id="hierarchy-heading" className="mb-3 text-lg font-semibold">Scene objects</h2>
      {scene.objects.length === 0 ? (
        <p className="text-sm">The scene is empty. Add a model or audio from the asset library below.</p>
      ) : (
        <ul className="space-y-2">
          {scene.objects.map((object) => {
            const selected = object.id === selectedId
            const missing = !assetsById.has(object.assetId)
            return (
              <li
                key={object.id}
                className={`rounded-md border p-2 ${selected ? 'border-brand-ink bg-neutral-100' : 'border-neutral-300'}`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(object.id)}
                  aria-current={selected ? 'true' : undefined}
                  className="block w-full text-left"
                >
                  <span className={`block break-words text-sm font-medium ${object.visible ? '' : 'text-neutral-500 line-through'}`}>
                    {object.name}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    <StatusBadge tone="info" label={object.type === 'model' ? '3D model' : 'Audio'} />
                    {missing && <StatusBadge tone="planned" label="Asset missing" />}
                  </span>
                </button>
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" onClick={() => onToggleVisible(object.id)} aria-label={`${object.visible ? 'Hide' : 'Show'} ${object.name}`}>
                    {object.visible ? 'Hide' : 'Show'}
                  </Button>
                  <Button variant="outline" onClick={() => onDelete(object.id)} aria-label={`Delete ${object.name}`}>
                    Delete
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}