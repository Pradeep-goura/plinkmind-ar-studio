import { useEffect, useMemo, useRef } from 'react'
import { isWebGLAvailable } from '../../lib/utils/webgl'
import type { ModelObject } from '../editor/sceneSchema'
import { ViewportEngine } from '../editor/viewport/ViewportEngine'

type HeroStageProps = {
  models: ModelObject[]
  urls: ReadonlyMap<string, string>
  missing: ReadonlySet<string>
}

// The big 3D model in the page header. It turns slowly, and the visitor can drag it.
// There is no text or buttons on top of it.
export default function HeroStage({ models, urls, missing }: HeroStageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<ViewportEngine | null>(null)
  const framedRef = useRef(false)
  const webglOk = useMemo(() => isWebGLAvailable(), [])
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])

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
          if (!framedRef.current) {
            framedRef.current = true
            engine.frame(null)
          }
        },
      },
      {
        maxPixelRatio: 1.5,
        transparent: true,
        showGrid: false,
        environment: true,
        autoRotate: !reducedMotion,
        scrollFriendly: true,
      },
    )
    engineRef.current = engine

    return () => {
      engine.dispose()
      engineRef.current = null
      framedRef.current = false
    }
  }, [webglOk, reducedMotion])

  useEffect(() => {
    engineRef.current?.syncObjects(models, urls, missing)
  }, [models, urls, missing])

  if (!webglOk) return null

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Interactive 3D model. Drag to rotate."
      className="h-[320px] w-full overflow-hidden rounded-card bg-brand-ink md:h-[400px]"
    />
  )
}