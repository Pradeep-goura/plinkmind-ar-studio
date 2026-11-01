import { useEffect, useMemo, useRef } from 'react'
import { Button } from '../../components/ui/Button'
import { Notice } from '../../components/ui/Notice'
import { isWebGLAvailable } from '../../lib/utils/webgl'
import type { ModelObject } from '../editor/sceneSchema'
import { ViewportEngine } from '../editor/viewport/ViewportEngine'

type PublicStageProps = {
  models: ModelObject[]
  urls: ReadonlyMap<string, string>
  missing: ReadonlySet<string>
}

// A read-only 3D view of the published scene: no selection, no handles.
export default function PublicStage({ models, urls, missing }: PublicStageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<ViewportEngine | null>(null)
  const framedRef = useRef(false)
  const webglOk = useMemo(() => isWebGLAvailable(), [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !webglOk) return

    const engine = new ViewportEngine(
      container,
      {
        onSelect: () => undefined,
        onTransformEnd: () => undefined,
        onAssetFailed: () => undefined,
        onSettled: () => {
          // Fit everything on screen once, as soon as all models have finished loading.
          if (!framedRef.current) {
            framedRef.current = true
            engine.frame(null)
          }
        },
      },
      { maxPixelRatio: 1.5 }, // phones have very dense screens; this keeps drawing light
    )
    engineRef.current = engine

    return () => {
      engine.dispose()
      engineRef.current = null
      framedRef.current = false
    }
  }, [webglOk])

  useEffect(() => {
    engineRef.current?.syncObjects(models, urls, missing)
  }, [models, urls, missing])

  if (!webglOk) {
    return (
      <Notice tone="warning" title="3D view is not available">
        This browser or device cannot run WebGL, which the 3D view needs.
      </Notice>
    )
  }

  return (
    <div className="min-w-0 space-y-2">
      <div
        ref={containerRef}
        role="img"
        aria-label="3D view of the experience"
        className="h-[55vh] min-h-[320px] w-full min-w-0 overflow-hidden rounded-card bg-neutral-200"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => engineRef.current?.frame(null)}>
          Reset view
        </Button>
        <p className="text-sm text-neutral-700">Drag to look around, scroll or pinch to zoom.</p>
      </div>
    </div>
  )
}