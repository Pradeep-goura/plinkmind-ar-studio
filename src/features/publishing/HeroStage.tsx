import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { isWebGLAvailable } from '../../lib/utils/webgl'
import type { ModelObject } from '../editor/sceneSchema'
import { ViewportEngine } from '../editor/viewport/ViewportEngine'

type HeroStageProps = {
  models: ModelObject[]
  urls: ReadonlyMap<string, string>
  missing: ReadonlySet<string>
  slug: string
}

const overlayButton =
  'rounded-md bg-white/15 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/25'

// The big 3D model in the page header: it turns slowly, and the visitor can drag it.
export default function HeroStage({ models, urls, missing, slug }: HeroStageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<ViewportEngine | null>(null)
  const framedRef = useRef(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const webglOk = useMemo(() => isWebGLAvailable(), [])
  const canFullscreen = useMemo(() => document.fullscreenEnabled === true, [])
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

  useEffect(() => {
    function onChange() {
      setIsFullscreen(document.fullscreenElement !== null && document.fullscreenElement === wrapperRef.current)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await wrapperRef.current?.requestFullscreen()
    } catch {
      // Some browsers refuse full screen. Nothing else to do.
    }
  }

  if (!webglOk) return null

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full overflow-hidden bg-brand-ink ${
        isFullscreen ? 'h-full rounded-none' : 'h-[320px] rounded-card md:h-[400px]'
      }`}
    >
      <div ref={containerRef} role="img" aria-label="Interactive 3D model" className="h-full w-full" />
      <p className="pointer-events-none absolute bottom-3 left-3 text-xs text-white/70">
        Sample experience · drag to rotate
      </p>
      <div className="absolute bottom-3 right-3 flex gap-2">
        {canFullscreen && (
          <button type="button" className={overlayButton} onClick={() => void toggleFullscreen()}>
            {isFullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
        )}
        <Link to={`/experience/${slug}`} className={overlayButton}>
          Open AR page
        </Link>
      </div>
    </div>
  )
}