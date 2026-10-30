import { z } from 'zod'
import { supabase } from '../../lib/supabase/client'
import { createAssetUrl } from '../assets/assetsApi'
import { parseScene } from '../editor/sceneSchema'
import type { Scene } from '../editor/sceneSchema'

const publicSchema = z.object({
  slug: z.string(),
  version: z.number(),
  title: z.string(),
  trackingMode: z.enum(['surface', 'image']),
  schemaVersion: z.number(),
  scene: z.unknown(),
  assets: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(['model', 'audio']),
      storagePath: z.string(),
      sizeBytes: z.number(),
    }),
  ),
})

export type PublicAsset = {
  id: string
  kind: 'model' | 'audio'
  storagePath: string
  sizeBytes: number
}

export type PublicExperience = {
  slug: string
  version: number
  title: string
  trackingMode: 'surface' | 'image'
  scene: Scene
  assets: PublicAsset[]
}

export type PublicLoadResult =
  | { status: 'ok'; experience: PublicExperience }
  | { status: 'not-found' }
  | { status: 'invalid'; message: string }

export async function getPublicExperience(slug: string): Promise<PublicLoadResult> {
  const { data, error } = await supabase.rpc('get_public_experience', { p_slug: slug })
  if (error) throw new Error('Could not load this experience. Please try again.')
  if (data === null || data === undefined) return { status: 'not-found' }

  const parsed = publicSchema.safeParse(data)
  if (!parsed.success) return { status: 'invalid', message: 'This experience could not be read.' }

  // The saved scene is checked again here, before anything is drawn.
  const scene = parseScene(parsed.data.scene, parsed.data.schemaVersion)
  if (!scene.ok) return { status: 'invalid', message: scene.message }

  return {
    status: 'ok',
    experience: {
      slug: parsed.data.slug,
      version: parsed.data.version,
      title: parsed.data.title,
      trackingMode: parsed.data.trackingMode,
      scene: scene.scene,
      assets: parsed.data.assets,
    },
  }
}

// Temporary file links last 6 hours. A page left open longer needs a refresh.
export const PUBLIC_LINK_SECONDS = 6 * 60 * 60

export async function createPublicAssetUrls(
  assets: PublicAsset[],
): Promise<{ urls: Map<string, string>; failed: Set<string> }> {
  const urls = new Map<string, string>()
  const failed = new Set<string>()
  await Promise.all(
    assets.map(async (asset) => {
      try {
        urls.set(asset.id, await createAssetUrl(asset.storagePath, PUBLIC_LINK_SECONDS))
      } catch {
        failed.add(asset.id)
      }
    }),
  )
  return { urls, failed }
}