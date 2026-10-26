import { z } from 'zod'
import { supabase } from '../../lib/supabase/client'
import type { Project, TrackingMode } from '../../types/project'

const columns = 'id, name, status, tracking_mode, updated_at'

const projectRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['draft', 'published']),
  tracking_mode: z.enum(['surface', 'image']),
  updated_at: z.string(),
})

// Every row from the database is validated before the app uses it.
function toProject(row: unknown): Project {
  const parsed = projectRowSchema.parse(row)
  return {
    id: parsed.id,
    name: parsed.name,
    status: parsed.status,
    trackingMode: parsed.tracking_mode,
    updatedAt: parsed.updated_at,
  }
}

export async function getWorkspaceId(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
  if (error) throw new Error(error.message)
  const workspaceId = data?.[0]?.workspace_id
  if (typeof workspaceId !== 'string') throw new Error('No workspace found for this account.')
  return workspaceId
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select(columns)
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(toProject)
}

export async function createProject(
  workspaceId: string,
  name: string,
  trackingMode: TrackingMode,
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ workspace_id: workspaceId, name, tracking_mode: trackingMode })
    .select(columns)
    .single()
  if (error) throw new Error(error.message)
  return toProject(data)
}

export async function renameProject(id: string, name: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update({ name })
    .eq('id', id)
    .select(columns)
    .single()
  if (error) throw new Error(error.message)
  return toProject(data)
}

export async function duplicateProject(workspaceId: string, project: Project): Promise<Project> {
  // Only name and tracking mode exist today. Scene data will be copied once scenes exist.
  return createProject(workspaceId, `Copy of ${project.name}`.slice(0, 100), project.trackingMode)
}

export async function deleteProject(id: string): Promise<void> {
  const { data, error } = await supabase.from('projects').delete().eq('id', id).select('id')
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) {
    throw new Error('The project was not deleted. You may not have permission.')
  }
}