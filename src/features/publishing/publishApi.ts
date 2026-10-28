import { z } from 'zod'
import { supabase } from '../../lib/supabase/client'

const infoSchema = z.object({
  project_id: z.string(),
  slug: z.string(),
  status: z.enum(['live', 'unpublished']),
  live_version: z.number(),
  updated_at: z.string(),
})

export type PublishInfo = {
  projectId: string
  slug: string
  status: 'live' | 'unpublished'
  liveVersion: number
  updatedAt: string
}

export async function listPublishInfo(): Promise<PublishInfo[]> {
  const { data, error } = await supabase
    .from('published_experiences')
    .select('project_id, slug, status, live_version, updated_at')
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => {
    const parsed = infoSchema.parse(row)
    return {
      projectId: parsed.project_id,
      slug: parsed.slug,
      status: parsed.status,
      liveVersion: parsed.live_version,
      updatedAt: parsed.updated_at,
    }
  })
}

const publishResultSchema = z.object({ slug: z.string(), version: z.number() })

export async function publishProject(projectId: string): Promise<{ slug: string; version: number }> {
  const { data, error } = await supabase.rpc('publish_project', { p_project_id: projectId })
  if (error) throw new Error(error.message)
  return publishResultSchema.parse(data)
}

export async function unpublishProject(projectId: string): Promise<void> {
  const { error } = await supabase.rpc('unpublish_project', { p_project_id: projectId })
  if (error) throw new Error(error.message)
}