import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PlinkmindMark } from '../components/layout/PlinkmindMark'
import { Button } from '../components/ui/Button'
import { Notice } from '../components/ui/Notice'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ArSessionEngine } from '../features/lab/ArSessionEngine'
import type { ArLoadResult, ArPhase } from '../features/lab/ArSessionEngine'
import { AudioControls } from '../features/publishing/AudioControls'
import { DeviceCheck } from '../features/publishing/DeviceCheck'
import { checkImmersiveAr } from '../features/publishing/environment'
import { isValidSlug } from '../features/publishing/experienceUrl'
import { usePublicExperience } from '../features/publishing/usePublicExperience'
import type { ViewData } from '../features/publishing/viewData'
import { isWebGLAvailable } from '../lib/utils/webgl'

// While AR is running, taps on these controls must not also place the scene.
function blockXrSelect(element: HTMLElement | null) {
  element?.addEventListener('beforexrselect', (event) => event.preventDefault())
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
        <PlinkmindMark />
        <span className="text-xl font-light tracking-tight">Plinkmind</span>
      </header>
      <main className="mx-auto max-w-4xl space-y-4 px-4 pb-12">{children}</main>
    </div>
  )
}

const phaseText: Record<ArPhase, string> = {
  idle: '',
  searching: 'Move your phone slowly so it can find the floor or a table.',
  aiming: 'Surface found. Tap the screen to place the scene.',
  placed: 'Placed. Walk around it, and use the controls below.',
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; result: ArLoadResult }

type ContentProps = { slug: string; title: string; urls: Map<string, string>; view: ViewData }

function ArLabContent({ slug, title, urls, view }: ContentProps) {
  const engineRef = useRef<ArSessionEngine | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<ArPhase>('idle')
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [supported, setSupported] = useState<'checking' | 'yes' | 'no'>('checking')
  const [startError, setStartError] = useState('')
  const [size, setSize] = useState(1)
  const [yaw, setYaw] = useState(0)

  useEffect(() => {
    let ignore = false
    void checkImmersiveAr().then((ok) => {
      if (!ignore) setSupported(ok ? 'yes' : 'no')
    })
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    const engine = new ArSessionEngine({ onPhase: setPhase })
    engineRef.current = engine
    let ignore = false

    engine
      .load(view.models, urls)
      .then((result) => {
        if (!ignore) setLoad({ status: 'ready', result })
      })
      .catch((error: unknown) => {
        console.error('The AR scene could not be prepared', error)
        if (!ignore) setLoad({ status: 'error' })
      })

    return () => {
      ignore = true
      engine.dispose()
      engineRef.current = null
    }
  }, [view.models, urls])

  async function handleStart() {
    const engine = engineRef.current
    const overlay = overlayRef.current
    if (!engine || !overlay) return
    setStartError('')
    try {
      await engine.start(overlay)
    } catch (error) {
      console.error('AR could not start', error)
      setStartError(
        'AR could not start. Check that camera access is allowed and that Google Play Services for AR is installed.',
      )
    }
  }

  function handleSize(value: number) {
    setSize(value)
    engineRef.current?.setUserScale(value)
  }

  function handleYaw(value: number) {
    setYaw(value)
    engineRef.current?.setYaw(value)
  }

  const canStart = supported === 'yes' && load.status === 'ready' && load.result.loaded > 0

  return (
    <Frame>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="break-words text-2xl font-semibold">{title}</h1>
          <StatusBadge tone="planned" label="Experimental" />
        </div>
        <p className="mt-1 text-sm text-neutral-700">
          A test of our own AR player. It places the whole scene on a surface. It is not a supported
          feature yet.
        </p>
      </div>

      {supported === 'no' && (
        <Notice tone="warning" title="This browser cannot start WebXR AR">
          WebXR AR needs Chrome on an Android phone with Google Play Services for AR, over HTTPS. On
          iPhone, the normal page uses Apple's AR Quick Look instead.
        </Notice>
      )}

      {load.status === 'loading' && <p role="status">Preparing the scene...</p>}
      {load.status === 'error' && (
        <Notice tone="error" title="The scene could not be prepared">
          Try reloading the page.
        </Notice>
      )}
      {load.status === 'ready' && (
        <div className="space-y-2">
          <p className="text-sm">
            {load.result.loaded} model(s) ready
            {load.result.failed > 0 && `, ${load.result.failed} could not be loaded`}.
          </p>
          {load.result.autoFitted && (
            <p className="text-sm">
              This model's real size looks unusual, so it was resized to about 1 meter. Use the size
              slider to change it.
            </p>
          )}
        </div>
      )}

      {startError && <Notice tone="error">{startError}</Notice>}

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={!canStart} onClick={() => void handleStart()}>
          Start AR
        </Button>
        <Link to={`/experience/${slug}`} className="text-sm font-medium text-brand-link underline">
          Open the normal page
        </Link>
      </div>

      <DeviceCheck />

      {/* The AR overlay. Outside an AR session it is empty and does not block anything. */}
      <div ref={overlayRef} className="pointer-events-none fixed inset-0 z-50">
        {phase !== 'idle' && (
          <div
            ref={blockXrSelect}
            className="pointer-events-auto absolute inset-x-3 bottom-3 space-y-3 rounded-card bg-brand-paper/95 p-4 text-brand-ink"
          >
            <p role="status" className="text-sm font-medium">{phaseText[phase]}</p>

            {phase === 'placed' && (
              <>
                <div>
                  <label htmlFor="ar-size" className="block text-sm font-medium">
                    Size: x{size.toFixed(2)}
                  </label>
                  <input
                    id="ar-size"
                    type="range"
                    min={0.1}
                    max={3}
                    step={0.05}
                    value={size}
                    onChange={(event) => handleSize(Number(event.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="ar-rotate" className="block text-sm font-medium">
                    Rotate: {Math.round(yaw)} degrees
                  </label>
                  <input
                    id="ar-rotate"
                    type="range"
                    min={0}
                    max={360}
                    step={5}
                    value={yaw}
                    onChange={(event) => handleYaw(Number(event.target.value))}
                    className="w-full"
                  />
                </div>
              </>
            )}

            <div className="flex flex-wrap gap-2">
              {phase === 'placed' && (
                <Button variant="outline" onClick={() => engineRef.current?.resetPlacement()}>
                  Place again
                </Button>
              )}
              <Button variant="outline" onClick={() => engineRef.current?.end()}>
                Exit AR
              </Button>
            </div>

            <AudioControls items={view.audioItems} />
          </div>
        )}
      </div>
    </Frame>
  )
}

export function ArLabPage() {
  const { slug } = useParams()
  const valid = slug !== undefined && isValidSlug(slug)
  const state = usePublicExperience(valid ? slug : undefined)
  const webglOk = useMemo(() => isWebGLAvailable(), [])

  if (!valid || state.status === 'not-found') {
    return (
      <Frame>
        <h1 className="text-2xl font-semibold">This experience is not available</h1>
        <p>The link may be wrong, or the creator has unpublished it.</p>
      </Frame>
    )
  }
  if (state.status === 'loading') {
    return (
      <Frame>
        <p role="status">Loading the experience...</p>
      </Frame>
    )
  }
  if (state.status === 'error') {
    return (
      <Frame>
        <Notice tone="error" title="Could not open this experience">{state.message}</Notice>
      </Frame>
    )
  }
  if (!webglOk) {
    return (
      <Frame>
        <Notice tone="warning" title="3D graphics are not available">
          This browser or device cannot run WebGL, which AR needs.
        </Notice>
      </Frame>
    )
  }

  return (
    <ArLabContent
      slug={state.experience.slug}
      title={state.experience.title}
      urls={state.urls}
      view={state.view}
    />
  )
}