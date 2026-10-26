export type AssetKind = 'model' | 'audio' | 'image'

export type Asset = {
  id: string
  workspaceId: string
  kind: AssetKind
  originalName: string
  storagePath: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}