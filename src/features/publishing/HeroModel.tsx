import { lazy, Suspense, useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { DEMO_EXPERIENCE_SLUG } from '../../lib/config'
import { formatBytes } from '../assets/fileRules'
import { isValidSlug } from './experienceUrl'
import { shouldAutoLoadHero } from './heroPolicy'
import { createPublicAssetUrls, getPublicExperience } from './publicApi'
import type { PublicExperience } from './publicApi'
import { buildViewData } from './viewData'
import type { ViewData } from './viewData'

const HeroStage = lazy(() => import('./HeroStage'))

type HeroState =
  | { status: 'hidden' }
  | { status: 'checking' }
  | { status: 'idle'; experience: PublicExperience }
  | { status: 'preparing' }
  | { status: 'ready'; experience: PublicExperience; urls: Map<string, string>; view: ViewData }

const demoSlug = isValidSlug(DEMO_EXPERIENCE_SLUG) ? DEMO_EXPERIENCE_SLUG : null
const boxClass = 'h-[320px] w-full rounded-card md:h-[400px]'

function modelBytes(experience: PublicExperience): number {
  return experience.assets
    .filter((asset) => asset.kind === 'model')
    .reduce((sum, asset) => sum + asset.sizeBytes, 0)
}

function canAutoLoad(experience: PublicExperience): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  return shouldAutoLoadHero({
    totalModelBytes: modelBytes(experience),
    isWideScreen: window.matchMedia('(min-width: 768px)').matches,
    saveData: nav.connection?.saveData === true,
    deviceMemoryGb: nav.deviceMemory,
  })
}

async function prepare(experience: PublicExperience): Promise<HeroState> {
  try {
    const { urls, failed } = await createPublicAssetUrls(experience.assets)
    return { status: 'ready', experience, urls, view: buildViewData(experience.scene, urls, failed) }
  } catch (error) {
    console.error('The header model could not be prepared', error)
    return { status: 'hidden' }
  }
}

function Placeholder({ busy }: { busy: boolean }) {
  return (
    <div
      role="status"
      className={`${boxClass} bg-white/10 ${busy ? 'animate-pulse motion-reduce:animate-none' : ''}`}
    >
      <span className="sr-only">Loading the 3D model</span>
    </div>
  )
}

export function HeroModel() {
  const [state, setState] = useState<HeroState>({ status: demoSlug ? 'checking' : 'hidden' })

  useEffect(() => {
    if (!demoSlug) return
    let ignore = false

    async function check(slug: string) {
      try {
        const result = await getPublicExperience(slug)
        if (ignore) return
        if (result.status !== 'ok') {
          setState({ status: 'hidden' })
          return
        }
        if (!canAutoLoad(result.experience)) {
          setState({ status: 'idle', experience: result.experience })
          return
        }
        setState({ status: 'preparing' })
        const next = await prepare(result.experience)
        if (!ignore) setState(next)
      } catch (error) {
        console.error('The header model could not be checked', error)
        if (!ignore) setState({ status: 'hidden' })
      }
    }

    void check(demoSlug)
    return () => {
      ignore = true
    }
  }, [])

  async function start(experience: PublicExperience) {
    setState({ status: 'preparing' })
    setState(await prepare(experience))
  }

  if (state.status === 'hidden') return null
  if (state.status === 'checking' || state.status === 'preparing') return <Placeholder busy />

  if (state.status === 'idle') {
    return (
      <div className={`${boxClass} grid place-items-center bg-white/5 p-6 text-center`}>
        <div>
          <p className="mb-3 text-sm text-brand-warm">
            3D sample · {formatBytes(modelBytes(state.experience))}
          </p>
          <Button variant="light" onClick={() => void start(state.experience)}>
            Load the 3D model
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<Placeholder busy />}>
      <HeroStage
        models={state.view.models}
        urls={state.urls}
        missing={state.view.missing}
        
      />
    </Suspense>
  )
}