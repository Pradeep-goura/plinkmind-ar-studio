import { useEffect, useState } from 'react'
import { errorMessage } from '../../lib/utils/errors'
import { isValidSlug } from './experienceUrl'
import { createPublicAssetUrls, getPublicExperience } from './publicApi'
import type { PublicExperience } from './publicApi'
import { buildViewData } from './viewData'
import type { ViewData } from './viewData'

export type PublicExperienceState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; experience: PublicExperience; urls: Map<string, string>; view: ViewData }

export function usePublicExperience(slug: string | undefined): PublicExperienceState {
  const [state, setState] = useState<PublicExperienceState>({ status: 'loading' })

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

  return state
}