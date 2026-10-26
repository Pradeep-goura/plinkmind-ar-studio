import { lazy, Suspense, useEffect, useState } from 'react'
import { Notice } from '../../components/ui/Notice'
import { errorMessage } from '../../lib/utils/errors'
import type { Asset } from '../../types/asset'
import { createAssetUrl } from './assetsApi'

// The 3D viewer (and Three.js) is only downloaded when a model is previewed.
const ModelViewer = lazy(() => import('./ModelViewer'))

type UrlState =
  | { status: 'loading' }
  | { status: 'ready'; url: string }
  | { status: 'error'; message: string }

export function AssetPreview({ asset }: { asset: Asset }) {
  const [state, setState] = useState<UrlState>({ status: 'loading' })

  useEffect(() => {
    let ignore = false
    createAssetUrl(asset.storagePath)
      .then((url) => {
        if (!ignore) setState({ status: 'ready', url })
      })
      .catch((error: unknown) => {
        if (!ignore) setState({ status: 'error', message: errorMessage(error) })
      })
    return () => {
      ignore = true
    }
  }, [asset.storagePath])

  if (state.status === 'loading') return <p role="status">Loading preview...</p>
  if (state.status === 'error') {
    return (
      <Notice tone="error" title="Could not load the preview">
        {state.message}
      </Notice>
    )
  }

  if (asset.kind === 'model') {
    return (
      <Suspense fallback={<p role="status">Loading 3D viewer...</p>}>
        <ModelViewer url={state.url} />
      </Suspense>
    )
  }
  if (asset.kind === 'audio') {
    return (
      <audio controls src={state.url} className="w-full">
        Your browser does not support audio playback.
      </audio>
    )
  }
  return <img src={state.url} alt={asset.originalName} className="max-h-[360px] max-w-full rounded-md" />
}