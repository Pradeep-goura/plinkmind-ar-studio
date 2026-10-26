import { Upload } from 'tus-js-client'
import { supabase } from '../../lib/supabase/client'
import type { Asset } from '../../types/asset'
import { deleteStorageObject, registerAsset } from './assetsApi'
import { detectFileType, safeDisplayName, validateFile } from './fileRules'

const BUCKET = 'project-assets'

function uploadEndpoint(): string {
  const url = import.meta.env.VITE_SUPABASE_URL as string
  // Supabase recommends the direct storage hostname for uploads.
  const direct = url.replace('.supabase.co', '.storage.supabase.co')
  return `${direct}/storage/v1/upload/resumable`
}

function sendWithProgress(
  file: File,
  path: string,
  contentType: string,
  accessToken: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

  return new Promise((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: uploadEndpoint(),
      retryDelays: [0, 3000, 5000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        apikey: publishableKey,
        'x-upsert': 'false',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024, // Supabase requires exactly 6 MB
      metadata: {
        bucketName: BUCKET,
        objectName: path,
        contentType,
        cacheControl: '3600',
      },
      onError: (error) => {
        console.error('Upload failed', error)
        reject(new Error('Upload failed. Check your connection and permissions, then try again.'))
      },
      onProgress: (sent, total) => onProgress(Math.round((sent / total) * 100)),
      onSuccess: () => resolve(),
    })
    upload.start()
  })
}

type UploadOptions = {
  file: File
  workspaceId: string
  onProgress: (percent: number) => void
}

export async function uploadAsset({ file, workspaceId, onProgress }: UploadOptions): Promise<Asset> {
  const detected = await detectFileType(file)
  const problem = validateFile(file, detected)
  if (problem || !detected) throw new Error(problem ?? 'Unsupported file.')

  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) throw new Error('Please sign in again.')

  const assetId = crypto.randomUUID()
  const storagePath = `${workspaceId}/${assetId}.${detected.extension}`

  await sendWithProgress(file, storagePath, detected.mimeType, accessToken, onProgress)

  try {
    return await registerAsset({
      assetId,
      workspaceId,
      kind: detected.kind,
      originalName: safeDisplayName(file.name),
      storagePath,
    })
  } catch (error) {
    // Do not leave an unregistered file behind.
    await deleteStorageObject(storagePath).catch(() => undefined)
    throw error
  }
}