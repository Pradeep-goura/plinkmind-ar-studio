import { z } from 'zod'
import { supabase } from '../../lib/supabase/client'
import type { Asset, AssetKind } from '../../types/asset'

const BUCKET = 'project-assets'
const columns = 'id, workspace_id, kind, original_name, storage_path, mime_type, size_bytes, created_at'

const assetRowSchema = z.object({
  id: z.string(),
  workspace_id: z.string(),
  kind: z.enum(['model', 'audio', 'image']),
  original_name: z.string(),
  storage_path: z.string(),
  mime_type: z.string(),
  size_bytes: z.number(),
  created_at: z.string(),
})

function toAsset(row: unknown): Asset {
  const parsed = assetRowSchema.parse(row)
  return {
    id: parsed.id,
    workspaceId: parsed.workspace_id,
    kind: parsed.kind,
    originalName: parsed.original_name,
    storagePath: parsed.storage_path,
    mimeType: parsed.mime_type,
    sizeBytes: parsed.size_bytes,
    createdAt: parsed.created_at,
  }
}

export async function listAssets(): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select(columns)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(toAsset)
}

type RegisterInput = {
  assetId: string
  workspaceId: string
  kind: AssetKind
  originalName: string
  storagePath: string
}

export async function registerAsset(input: RegisterInput): Promise<Asset> {
  const { data, error } = await supabase.rpc('register_asset', {
    p_asset_id: input.assetId,
    p_workspace_id: input.workspaceId,
    p_kind: input.kind,
    p_original_name: input.originalName,
    p_storage_path: input.storagePath,
  })
  if (error) throw new Error(error.message)
  return toAsset(data)
}

export async function deleteStorageObject(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new Error(error.message)
}

// Removing the same file twice is safe, so a failed delete can simply be retried.
export async function deleteAsset(asset: Asset): Promise<void> {
  // The database row goes first. Its rules refuse the delete while a live
  // published experience uses this asset.
  const { data, error } = await supabase.from('assets').delete().eq('id', asset.id).select('id')
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) {
    throw new Error(
      'The asset was not deleted. It may be used by a published experience (unpublish it first), or you may not have permission.',
    )
  }
  try {
    await deleteStorageObject(asset.storagePath)
  } catch (storageError) {
    // The asset is already gone from the app. A leftover file is cleaned up later.
    console.error('Asset file could not be removed from storage', storageError)
  }
}
export async function createAssetUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
  if (error || !data) throw new Error(error?.message ?? 'Could not create a preview link.')
  return data.signedUrl
}