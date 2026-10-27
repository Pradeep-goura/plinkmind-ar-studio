import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Notice } from '../../components/ui/Notice'
import { isWebGLAvailable } from '../../lib/utils/webgl'
import type { Asset } from '../../types/asset'
import { createAssetUrl } from '../assets/assetsApi'
import type { ModelObject, Scene } from './sceneSchema'
import { ViewportEngine } from './viewport/ViewportEngine'
import type { TransformMode } from './viewport/ViewportEngine'
import type { ModelTransform } from './viewport/transformMath'

type ViewportProps = {
  scene: Scene
  assets: Asset[]
  selectedId: string | null
  mode: TransformMode
  onModeChange: (mode: TransformMode) => void
  onSelect: (id: string | null) => void
  onTransformEnd: (id: string, transform: ModelTransform) => void
}

const modes: { value: TransformMode; label: string; key: string }[] = [
  { value: 'translate', label: 'Move', key: 'W' },
  { value: 'rotate', label: 'Rotate', key: 'E' },
  { value: 'scale', label: 'Scale', key: 'R' },
]

export default function Viewport(props: ViewportProps) {
  const { scene, assets, selectedId, mode, onModeChange, onSelect, onTransformEnd } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<ViewportEngine | null>(null)
  const requestedRef = useRef(new Set<string>())
  const callbacksRef = useRef({ onSelect, onTransformEnd })
  const [urls, setUrls] = useState<Map<string, string>>(new Map())
  const [failed, setFailed] = useState<Set<string>>(new Set())
  const [snap, setSnap] = useState(false)
  const webglOk = useMemo(() => isWebGLAvailable(), [])

  const assetsById = useMemo(() => new Map(assets.map((asset) => [asset.id, asset])), [assets])
  const modelObjects = useMemo(
    () => scene.objects.filter((object): object is ModelObject => object.type === 'model'),
    [scene],
  )
  const missing = useMemo(() => {
    const ids = new Set<string>(failed)
    for (const object of modelObjects) {
      if (!assetsById.has(object.assetId)) ids.add(object.assetId)
    }
    return ids
  }, [modelObjects, assetsById, failed])

  // Always call the latest callbacks without recreating the 3D engine.
  useEffect(() => {
    callbacksRef.current = { onSelect, onTransformEnd }
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container || !webglOk) return
    const engine = new ViewportEngine(container, {
      onSelect: (id) => callbacksRef.current.onSelect(id),
      onTransformEnd: (id, transform) => callbacksRef.current.onTransformEnd(id, transform),
      onAssetFailed: (assetId) => setFailed((previous) => new Set(previous).add(assetId)),
    })
    engineRef.current = engine
    return () => {
      engine.dispose()
      engineRef.current = null
    }
  }, [webglOk])

  // Create a private, temporary link for each model asset used in the scene.
  useEffect(() => {
    for (const object of modelObjects) {
      const asset = assetsById.get(object.assetId)
      if (!asset || requestedRef.current.has(asset.id)) continue
      requestedRef.current.add(asset.id)
      createAssetUrl(asset.storagePath)
        .then((url) => setUrls((previous) => new Map(previous).set(asset.id, url)))
        .catch((error: unknown) => {
          console.error('Could not create a model link', error)
          setFailed((previous) => new Set(previous).add(asset.id))
        })
    }
  }, [modelObjects, assetsById])

  useEffect(() => {
    engineRef.current?.syncObjects(modelObjects, urls, missing)
  }, [modelObjects, urls, missing])

  useEffect(() => {
    engineRef.current?.setSelected(selectedId)
  }, [selectedId, modelObjects])

  useEffect(() => {
    engineRef.current?.setMode(mode)
  }, [mode])

  useEffect(() => {
    engineRef.current?.setSnap(snap)
  }, [snap])

  if (!webglOk) {
    return (
      <section aria-label="3D viewport" className="rounded-card bg-brand-paper p-6">
        <Notice tone="warning" title="3D viewport is not available">
          This browser or device cannot run WebGL. You can still edit values in the Properties panel.
        </Notice>
      </section>
    )
  }

  return (
    <section aria-label="3D viewport" className="space-y-2">
      <div role="toolbar" aria-label="Viewport tools" className="flex flex-wrap items-center gap-2">
        {modes.map((item) => (
          <Button
            key={item.value}
            variant={mode === item.value ? 'primary' : 'outline'}
            aria-pressed={mode === item.value}
            onClick={() => onModeChange(item.value)}
          >
            {item.label} ({item.key})
          </Button>
        ))}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={snap} onChange={(event) => setSnap(event.target.checked)} />
          Snap
        </label>
        <Button variant="outline" onClick={() => engineRef.current?.frame(selectedId)}>
          Frame
        </Button>
        <Button variant="outline" onClick={() => engineRef.current?.resetView()}>
          Reset view
        </Button>
      </div>

      {missing.size > 0 && (
        <Notice tone="warning">
          Some models are missing or could not be loaded. They appear as red boxes.
        </Notice>
      )}

      <div
        ref={containerRef}
        role="img"
        aria-label="3D scene editor viewport"
        className="h-[60vh] min-h-[420px] w-full overflow-hidden rounded-card bg-neutral-200"
      />
      <p className="text-sm text-neutral-700">
        Click an object to select it, then drag its handles. Drag empty space to orbit, scroll to zoom.
        Keys: W move, E rotate, R scale, Esc deselect. Blue boxes are models still loading.
      </p>
    </section>
  )
}