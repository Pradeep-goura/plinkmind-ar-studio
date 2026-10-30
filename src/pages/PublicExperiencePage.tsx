import { lazy, Suspense, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { PlinkmindMark } from '../components/layout/PlinkmindMark'
import { Notice } from '../components/ui/Notice'
import { AudioControls } from '../features/publishing/AudioControls'
import { DeviceCheck } from '../features/publishing/DeviceCheck'
import { isValidSlug } from '../features/publishing/experienceUrl'
import { createPublicAssetUrls, getPublicExperience } from '../features/publishing/publicApi'
import type { PublicExperience } from '../features/publishing/publicApi'
import { buildViewData } from '../features/publishing/viewData'
import type { ViewData } from '../features/publishing/viewData'
import { errorMessage } from '../lib/utils/errors'

// Heavy 3D and AR code is only downloaded when this page needs it.
const PublicStage = lazy(() => import('../features/publishing/PublicStage'))
const ArLauncher = lazy(() => import('../features/publishing/ArLauncher'))

type PageState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; experience: PublicExperience; urls: Map<string, string>; view: ViewData }

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

export function PublicExperiencePage() {
  const { slug } = useParams()
  const [state, setState] = useState<PageState>({ status: 'loading' })
  const slugIsValid = slug !== undefined && isValidSlug(slug)

  useEffect(() => {
    if (!slug || !isValidSlug(slug)) return
    let ignore = false

    async function load(validSlug: string) {
      try {
        const result = await getPublicExperience(validSlug)
        if (ignore) return
        if (result.status === 'not-found') {
          setState({ status: 'not-found' })
          return
        }
        if (result.status === 'invalid') {
          setState({ status: 'error', message: result.message })
          return
        }
        const { urls, failed } = await createPublicAssetUrls(result.experience.assets)
        if (ignore) return
        const view = buildViewData(result.experience.scene, urls, failed)
        setState({ status: 'ready', experience: result.experience, urls, view })
      } catch (error) {
        if (!ignore) setState({ status: 'error', message: errorMessage(error) })
      }
    }

    void load(slug)
    return () => {
      ignore = true
    }
  }, [slug])

  if (!slugIsValid || state.status === 'not-found') return <NotAvailable />

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

  const { experience, urls, view } = state

  return (
    <Frame>
      <div>
        <h1 className="break-words text-2xl font-semibold">{experience.title}</h1>
        <p className="text-sm text-neutral-700">
          Surface placement experience · version {experience.version}
        </p>
      </div>

      {view.missing.size > 0 && (
        <Notice tone="warning">Some parts of this experience could not be loaded.</Notice>
      )}

      <Suspense fallback={<p role="status">Loading the 3D view...</p>}>
        <PublicStage models={view.models} urls={urls} missing={view.missing} />
      </Suspense>

      <AudioControls items={view.audioItems} />

      <section aria-labelledby="ar-heading" className="rounded-card bg-brand-paper p-4">
        <h2 id="ar-heading" className="text-lg font-semibold">View in AR</h2>
        {view.arModel ? (
          <>
            <p className="mb-3 mt-1 text-sm">
              Place "{view.arModel.name}" on a floor or table with your phone camera.
            </p>
            <Suspense fallback={<p role="status">Preparing AR...</p>}>
              <ArLauncher src={view.arModel.url} alt={view.arModel.name} />
            </Suspense>
          </>
        ) : (
          <p className="mt-1 text-sm">This experience has no visible 3D model to show in AR.</p>
        )}
        <p className="mt-3 text-xs text-neutral-700">
          AR currently places the first visible model only. Position, rotation and scale from the
          editor are not applied in AR yet, and sound may not play inside the phone's AR viewer.
          Full multi-object AR is planned.
        </p>
      </section>

      <DeviceCheck />
    </Frame>
  )
}