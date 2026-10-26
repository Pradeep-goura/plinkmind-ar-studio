import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Notice } from '../../components/ui/Notice'
import { errorMessage } from '../../lib/utils/errors'
import type { Asset } from '../../types/asset'
import { useAuth } from '../auth/useAuth'
import { getWorkspaceId } from '../projects/projectsApi'
import { AssetPreview } from './AssetPreview'
import { AssetRow } from './AssetRow'
import { deleteAsset, listAssets } from './assetsApi'
import { LARGE_MODEL_WARNING_BYTES, MAX_FILE_BYTES, formatBytes } from './fileRules'
import { uploadAsset } from './uploadAsset'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; workspaceId: string; assets: Asset[] }

type NoticeState = { tone: 'success' | 'error'; text: string }

export function AssetManager() {
  const { user } = useAuth()
  const userId = user?.id
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [notice, setNotice] = useState<NoticeState | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [warning, setWarning] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let ignore = false

    async function load(id: string) {
      try {
        const workspaceId = await getWorkspaceId(id)
        const assets = await listAssets()
        if (!ignore) setState({ status: 'ready', workspaceId, assets })
      } catch (error) {
        if (!ignore) setState({ status: 'error', message: errorMessage(error) })
      }
    }

    void load(userId)
    return () => {
      ignore = true
    }
  }, [userId])

  function changeAssets(change: (assets: Asset[]) => Asset[]) {
    setState((previous) =>
      previous.status === 'ready' ? { ...previous, assets: change(previous.assets) } : previous,
    )
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file && file.name.toLowerCase().endsWith('.glb') && file.size > LARGE_MODEL_WARNING_BYTES) {
      setWarning(
        `This model is ${formatBytes(file.size)}. Large models can load slowly on phones. Consider compressing it.`,
      )
    } else {
      setWarning('')
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state.status !== 'ready') return
    const workspaceId = state.workspaceId
    const form = event.currentTarget
    const input = form.elements.namedItem('file') as HTMLInputElement | null
    const file = input?.files?.[0]
    if (!file) {
      setNotice({ tone: 'error', text: 'Choose a file first.' })
      return
    }

    setBusy(true)
    setProgress(0)
    setNotice(null)
    try {
      const asset = await uploadAsset({ file, workspaceId, onProgress: setProgress })
      changeAssets((list) => [asset, ...list])
      form.reset()
      setWarning('')
      setNotice({ tone: 'success', text: `Uploaded "${asset.originalName}".` })
    } catch (error) {
      setNotice({ tone: 'error', text: errorMessage(error) })
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  async function handleDelete(asset: Asset) {
    setBusy(true)
    setNotice(null)
    try {
      await deleteAsset(asset)
      changeAssets((list) => list.filter((item) => item.id !== asset.id))
      setSelectedId((current) => (current === asset.id ? null : current))
      setNotice({ tone: 'success', text: `Deleted "${asset.originalName}".` })
    } catch (error) {
      setNotice({ tone: 'error', text: errorMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  if (state.status === 'loading') {
    return <p role="status" className="rounded-md bg-brand-paper p-6">Loading your assets...</p>
  }
  if (state.status === 'error') {
    return (
      <div className="space-y-3">
        <Notice tone="error" title="Could not load your assets">{state.message}</Notice>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </div>
    )
  }

  const usedBytes = state.assets.reduce((total, asset) => total + asset.sizeBytes, 0)
  const selected = state.assets.find((asset) => asset.id === selectedId)

  return (
    <div className="space-y-6">
      <form onSubmit={(event) => void handleUpload(event)} className="space-y-3 rounded-card bg-brand-paper p-5">
        <div>
          <label htmlFor="asset-file" className="mb-1 block text-sm font-medium">
            Upload a file
          </label>
          <input
            id="asset-file"
            name="file"
            type="file"
            accept=".glb,.mp3,.ogg,.png,.jpg,.jpeg,.webp"
            onChange={handleFileChange}
            className="block w-full text-sm"
          />
          <p className="mt-1 text-sm text-neutral-700">
            3D model (GLB), audio (MP3, OGG) or image (PNG, JPEG, WebP). Maximum {formatBytes(MAX_FILE_BYTES)} each.
          </p>
        </div>
        {warning && <Notice tone="warning">{warning}</Notice>}
        {progress !== null && (
          <div>
            <progress value={progress} max={100} className="w-full" aria-label="Upload progress" />
            <p className="text-sm" role="status">{progress}%</p>
          </div>
        )}
        <Button type="submit" disabled={busy}>{busy ? 'Working...' : 'Upload'}</Button>
      </form>

      <p className="text-sm">
        Storage used by this workspace: <strong>{formatBytes(usedBytes)}</strong> in {state.assets.length}{' '}
        {state.assets.length === 1 ? 'file' : 'files'}. Your plan's total storage limit is shown on Supabase's Usage page.
      </p>

      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      {selected && (
        <section aria-label="Preview" className="rounded-card bg-brand-paper p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="break-words text-lg font-semibold">{selected.originalName}</h2>
            <Button variant="outline" onClick={() => setSelectedId(null)}>Close preview</Button>
          </div>
          <AssetPreview key={selected.id} asset={selected} />
        </section>
      )}

      {state.assets.length === 0 ? (
        <p className="rounded-md bg-brand-paper p-6 text-center">
          No assets yet. Upload your first file above.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {state.assets.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              busy={busy}
              onPreview={() => setSelectedId(asset.id)}
              onDelete={() => void handleDelete(asset)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}