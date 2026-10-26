import type { Asset } from '../../types/asset'
import { NumberField } from './NumberField'
import { renameObject, setAudioSettings, setTransform, setVisible } from './sceneOps'
import type { Scene, SceneObject } from './sceneSchema'

type Vec3 = [number, number, number]

type PropertiesPanelProps = {
  scene: Scene
  object: SceneObject | undefined
  asset: Asset | undefined
  onChange: (scene: Scene, key?: string) => void
}

const groups = [
  { key: 'position', label: 'Position (meters)', min: -10000, max: 10000 },
  { key: 'rotation', label: 'Rotation (degrees)', min: -3600, max: 3600 },
  { key: 'scale', label: 'Scale', min: 0.001, max: 1000 },
] as const

const axes = [
  { label: 'X', index: 0 },
  { label: 'Y', index: 1 },
  { label: 'Z', index: 2 },
] as const

function replaceAxis(values: Vec3, index: 0 | 1 | 2, next: number): Vec3 {
  const copy: Vec3 = [values[0], values[1], values[2]]
  copy[index] = next
  return copy
}

export function PropertiesPanel({ scene, object, asset, onChange }: PropertiesPanelProps) {
  if (!object) {
    return (
      <section aria-labelledby="properties-heading" className="rounded-card bg-brand-paper p-4">
        <h2 id="properties-heading" className="mb-3 text-lg font-semibold">Properties</h2>
        <p className="text-sm">Select an object to edit it.</p>
      </section>
    )
  }

  return (
    <section aria-labelledby="properties-heading" className="space-y-4 rounded-card bg-brand-paper p-4">
      <h2 id="properties-heading" className="text-lg font-semibold">Properties</h2>

      <div>
        <label htmlFor="prop-name" className="mb-1 block text-sm font-medium">Name</label>
        <input
          id="prop-name"
          key={`${object.id}:${object.name}`}
          defaultValue={object.name}
          maxLength={100}
          onBlur={(event) => {
            const next = event.target.value.trim()
            if (next && next !== object.name) onChange(renameObject(scene, object.id, next))
            else event.target.value = object.name
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
          className="w-full rounded-md border border-neutral-500 px-3 py-2 text-sm"
        />
      </div>

      <p className="text-sm">
        Asset: <strong>{asset ? asset.originalName : 'missing (it may have been deleted)'}</strong>
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={object.visible}
          onChange={(event) => onChange(setVisible(scene, object.id, event.target.checked))}
        />
        Visible
      </label>

      {object.type === 'model' &&
        groups.map((group) => (
          <fieldset key={group.key}>
            <legend className="mb-1 text-sm font-medium">{group.label}</legend>
            <div className="grid grid-cols-3 gap-2">
              {axes.map((axis) => (
                <NumberField
                  key={axis.label}
                  id={`prop-${group.key}-${axis.label}`}
                  label={axis.label}
                  min={group.min}
                  max={group.max}
                  value={object[group.key][axis.index] ?? 0}
                  onCommit={(next) => {
                    const updated = replaceAxis(object[group.key], axis.index, next)
                    const patch =
                      group.key === 'position'
                        ? { position: updated }
                        : group.key === 'rotation'
                          ? { rotation: updated }
                          : { scale: updated }
                    onChange(setTransform(scene, object.id, patch), `${object.id}:${group.key}`)
                  }}
                />
              ))}
            </div>
          </fieldset>
        ))}

      {object.type === 'audio' && (
        <>
          <div>
            <label htmlFor="prop-volume" className="mb-1 block text-sm font-medium">
              Volume: {Math.round(object.volume * 100)}%
            </label>
            <input
              id="prop-volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={object.volume}
              onChange={(event) =>
                onChange(setAudioSettings(scene, object.id, { volume: Number(event.target.value) }), `${object.id}:volume`)
              }
              className="w-full"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={object.loop}
              onChange={(event) => onChange(setAudioSettings(scene, object.id, { loop: event.target.checked }))}
            />
            Loop
          </label>
          <p className="text-xs text-neutral-700">Audio plays in the published experience after the viewer taps the screen.</p>
        </>
      )}
    </section>
  )
}