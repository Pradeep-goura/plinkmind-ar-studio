import { lazy, Suspense, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Notice } from '../../components/ui/Notice'
import { Skeleton } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { DEMO_EXPERIENCE_SLUG } from '../../lib/config'
import { buildExperienceUrl, isValidSlug } from './experienceUrl'
import { createPublicAssetUrls, getPublicExperience } from './publicApi'
import { QrCode } from './QrCode'
import { buildViewData } from './viewData'
import type { ViewData } from './viewData'

const PublicStage = lazy(() => import('./PublicStage'))

type DemoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; title: string; urls: Map<string, string>; view: ViewData }

const demoSlug = isValidSlug(DEMO_EXPERIENCE_SLUG) ? DEMO_EXPERIENCE_SLUG : null

// The 3D scene and model are only downloaded when the visitor asks for them.
export function DemoViewer() {
  const [state, setState] = useState<DemoState>({ status: 'idle' })

  if (!demoSlug) return null

  async function start(slug: string) {
    setState({ status: 'loading' })
    try {
      const result = await getPublicExperience(slug)
      if (result.status !== 'ok') {
        setState({ status: 'error' })
        return
      }
      const { urls, failed } = await createPublicAssetUrls(result.experience.assets)
      setState({
        status: 'ready',
        title: result.experience.title,
        urls,
        view: buildViewData(result.experience.scene, urls, failed),
      })
    } catch (error) {
      console.error('The sample experience could not be loaded', error)
      setState({ status: 'error' })
    }
  }

  const phoneUrl = buildExperienceUrl(window.location.origin, demoSlug)

  return (
    <section aria-labelledby="demo-heading" className="rounded-card bg-brand-paper p-6">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h2 id="demo-heading" className="text-2xl font-semibold">Try it yourself</h2>
        <StatusBadge tone="sample" label="Sample experience" />
      </div>
      <p className="mb-4 text-sm">
        Look around the sample in 3D, then scan the code with your phone to open it in AR.
      </p>

            <div className="grid gap-6 md:grid-cols-[1fr_240px]">
        <div className="min-w-0">
          {state.status === 'idle' && (
            <div className="grid min-h-[260px] place-items-center rounded-md bg-neutral-200 p-6 text-center">
              <div>
                <p className="mb-3 text-sm">The 3D sample is a larger download, so it loads only when you ask.</p>
                <Button onClick={() => void start(demoSlug)}>Load the 3D sample</Button>
              </div>
            </div>
          )}
          {state.status === 'loading' && (
            <div role="status">
              <span className="sr-only">Loading the 3D sample</span>
              <Skeleton className="h-[320px]" />
            </div>
          )}
          {state.status === 'error' && (
            <div className="space-y-3">
              <Notice tone="warning" title="The sample could not be loaded">
                It may have been unpublished. You can try again.
              </Notice>
              <Button variant="outline" onClick={() => void start(demoSlug)}>Try again</Button>
            </div>
          )}
          {state.status === 'ready' && (
            <Suspense fallback={<Skeleton className="h-[320px]" />}>
              <PublicStage models={state.view.models} urls={state.urls} missing={state.view.missing} />
            </Suspense>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold">Open on your phone</h3>
          <QrCode text={phoneUrl} filename="plinkmind-sample-qr.png" showDownload={false} />
          <a
            href={phoneUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-sm font-medium text-brand-link underline"
          >
            Open the AR page
          </a>
        </div>
      </div>
    </section>
  )
}