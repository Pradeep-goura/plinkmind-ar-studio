import { lazy, Suspense, useState } from 'react'
import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { PlinkmindMark } from '../components/layout/PlinkmindMark'
import { Button } from '../components/ui/Button'
import { Notice } from '../components/ui/Notice'
import { formatBytes } from '../features/assets/fileRules'
import { AudioControls } from '../features/publishing/AudioControls'
import { DeviceCheck } from '../features/publishing/DeviceCheck'
import { detectInAppBrowser } from '../features/publishing/environment'
import { isValidSlug } from '../features/publishing/experienceUrl'
import { usePublicExperience } from '../features/publishing/usePublicExperience'
import type { PublicExperienceState } from '../features/publishing/usePublicExperience'

// Heavy 3D and AR code is only downloaded when this page needs it.
const PublicStage = lazy(() => import('../features/publishing/PublicStage'))
const ArLauncher = lazy(() => import('../features/publishing/ArLauncher'))

const HEAVY_MODEL_BYTES = 15 * 1024 * 1024

type ReadyState = Extract<PublicExperienceState, { status: 'ready' }>

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

function NotAvailable() {
  return (
    <Frame>
      <h1 className="text-2xl font-semibold">This experience is not available</h1>
      <p>The link may be wrong, or the creator has unpublished it.</p>
    </Frame>
  )
}

function ExperienceView({ ready }: { ready: ReadyState }) {
  const { experience, urls, view } = ready
  const [mode, setMode] = useState<'stage' | 'ar'>('stage')

  const totalModelBytes = experience.assets
    .filter((asset) => asset.kind === 'model')
    .reduce((sum, asset) => sum + asset.sizeBytes, 0)
  const heavy = totalModelBytes > HEAVY_MODEL_BYTES
  // Large models are not downloaded until the visitor asks, so a weak phone cannot crash on arrival.
  const [stageStarted, setStageStarted] = useState(!heavy)
  const inApp = detectInAppBrowser(navigator.userAgent)

  return (
    <Frame>
      <div>
        <h1 className="break-words text-2xl font-semibold">{experience.title}</h1>
        <p className="text-sm text-neutral-700">
          Surface placement experience · version {experience.version}
        </p>
      </div>

      {inApp && (
        <Notice tone="warning" title={`You opened this inside ${inApp}`}>
          AR and sound often do not work in a browser inside another app. Open this page in Safari
          (iPhone) or Chrome (Android) from the app's menu.
        </Notice>
      )}

      {heavy && (
        <Notice tone="warning" title="This experience has large models">
          The models are {formatBytes(totalModelBytes)} in total. They can be slow, or fail, on older
          phones.
        </Notice>
      )}

      {view.missing.size > 0 && (
        <Notice tone="warning">Some parts of this experience could not be loaded.</Notice>
      )}

      {mode === 'stage' ? (
        stageStarted ? (
          <Suspense fallback={<p role="status">Loading the 3D view...</p>}>
            <PublicStage models={view.models} urls={urls} missing={view.missing} />
          </Suspense>
        ) : (
          <div className="grid min-h-[200px] place-items-center rounded-card bg-brand-paper p-6 text-center">
            <div>
              <p className="mb-3 text-sm">The 3D view is a large download, so it loads only when you ask.</p>
              <Button onClick={() => setStageStarted(true)}>Load the 3D view</Button>
            </div>
          </div>
        )
      ) : (
        <section aria-labelledby="ar-heading" className="rounded-card bg-brand-paper p-4">
          <h2 id="ar-heading" className="text-lg font-semibold">AR view</h2>
          {view.arModel && (
            <>
              <p className="mb-3 mt-1 text-sm">
                Place "{view.arModel.name}" on a floor or table with your phone camera.
              </p>
              <Suspense fallback={<p role="status">Preparing AR...</p>}>
                <ArLauncher src={view.arModel.url} alt={view.arModel.name} />
              </Suspense>
            </>
          )}
          <div className="mt-3">
            <Button variant="outline" onClick={() => setMode('stage')}>Back to the 3D view</Button>
          </div>
        </section>
      )}

      <AudioControls items={view.audioItems} />

      {mode === 'stage' && (
        <section aria-labelledby="ar-card-heading" className="rounded-card bg-brand-paper p-4">
          <h2 id="ar-card-heading" className="text-lg font-semibold">View in AR</h2>
          {view.arModel ? (
            <>
              <p className="mb-3 mt-1 text-sm">
                Opening the AR view replaces the 3D view above, so your phone only keeps one copy of the
                model in memory.
              </p>
              <Button onClick={() => setMode('ar')}>Open the AR view</Button>
            </>
          ) : (
            <p className="mt-1 text-sm">This experience has no visible 3D model to show in AR.</p>
          )}
          <p className="mt-3 text-xs text-neutral-700">
            AR currently places the first visible model only. Position, rotation and scale from the
            editor are not applied in this mode yet, and sound may not play inside the phone's AR
            viewer. Full multi-object AR is planned.
          </p>
        </section>
      )}

      <DeviceCheck />
    </Frame>
  )
}

export function PublicExperiencePage() {
  const { slug } = useParams()
  const valid = slug !== undefined && isValidSlug(slug)
  const state = usePublicExperience(valid ? slug : undefined)

  if (!valid || state.status === 'not-found') return <NotAvailable />

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

  return <ExperienceView ready={state} />
}