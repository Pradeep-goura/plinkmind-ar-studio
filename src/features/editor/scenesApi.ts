import { z } from 'zod'
import { supabase } from '../../lib/supabase/client'
import { createEmptyScene } from './sceneOps'
import { CURRENT_SCHEMA_VERSION, parseScene, sceneSchema } from './sceneSchema'
import type { Scene } from './sceneSchema'

const columns = 'project_id, schema_version, data, version'

const rowSchema = z.object({
  project_id: z.string(),
  schema_version: z.number(),
  data: z.unknown(),
  version: z.number(),
})

export type LoadedScene = { scene: Scene; version: number }

export class SceneConflictError extends Error {
  constructor() {
    super(
      'This scene was changed somewhere else, or you no longer have permission to edit it. Reload the page to get the latest version.',
    )
    this.name = 'SceneConflictError'
  }
}

function toLoadedScene(row: unknown): LoadedScene {
  const parsed = rowSchema.parse(row)
  const result = parseScene(parsed.data, parsed.schema_version)
  if (!result.ok) throw new Error(result.message)
  return { scene: result.scene, version: parsed.version }
}

export async function loadOrCreateScene(projectId: string): Promise<LoadedScene> {
  const existing = await supabase.from('scenes').select(columns).eq('project_id', projectId).maybeSingle()
  if (existing.error) throw new Error(existing.error.message)
  if (existing.data) return toLoadedScene(existing.data)

  const created = await supabase
    .from('scenes')
    .insert({ project_id: projectId, schema_version: CURRENT_SCHEMA_VERSION, data: createEmptyScene() })
    .select(columns)
    .single()

  if (created.error) {
    // 23505 = someone else created it a moment ago. Just read theirs.
    if (created.error.code === '23505') {
      const again = await supabase.from('scenes').select(columns).eq('project_id', projectId).single()
      if (again.error) throw new Error(again.error.message)
      return toLoadedScene(again.data)
    }
    throw new Error(created.error.message)
  }
  return toLoadedScene(created.data)
}

// Saves only if nobody else saved since we loaded (the version must still match).
export async function saveScene(projectId: string, scene: Scene, expectedVersion: number): Promise<number> {
  if (!sceneSchema.safeParse(scene).success) {
    throw new Error('The scene has invalid values, so it was not saved.')
  }

  const { data, error } = await supabase
    .from('scenes')
    .update({ schema_version: CURRENT_SCHEMA_VERSION, data: scene })
    .eq('project_id', projectId)
    .eq('version', expectedVersion)
    .select('version')
  if (error) throw new Error(error.message)

  const newVersion = data?.[0]?.version
  if (typeof newVersion !== 'number') throw new SceneConflictError()
  return newVersion
}

export async function copyScene(sourceProjectId: string, targetProjectId: string): Promise<void> {
  const { data, error } = await supabase
    .from('scenes')
    .select('schema_version, data')
    .eq('project_id', sourceProjectId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return

  const { error: insertError } = await supabase
    .from('scenes')
    .insert({ project_id: targetProjectId, schema_version: data.schema_version, data: data.data })
  if (insertError) throw new Error(insertError.message)
}