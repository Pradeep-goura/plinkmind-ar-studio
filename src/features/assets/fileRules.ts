import type { AssetKind } from '../../types/asset'

export const MAX_FILE_BYTES = 50 * 1024 * 1024
export const LARGE_MODEL_WARNING_BYTES = 20 * 1024 * 1024

export type DetectedFile = {
  kind: AssetKind
  mimeType: string
  extension: string
}

// Looks at the first bytes of the file. The file name and the browser's type are NOT trusted.
export async function detectFileType(file: Blob): Promise<DetectedFile | null> {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const startsWith = (...values: number[]) => values.every((value, index) => bytes[index] === value)

  // GLB: "glTF" followed by version 2
  if (startsWith(0x67, 0x6c, 0x54, 0x46, 0x02, 0x00, 0x00, 0x00)) {
    return { kind: 'model', mimeType: 'model/gltf-binary', extension: 'glb' }
  }
  // PNG
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) {
    return { kind: 'image', mimeType: 'image/png', extension: 'png' }
  }
  // JPEG
  if (startsWith(0xff, 0xd8, 0xff)) {
    return { kind: 'image', mimeType: 'image/jpeg', extension: 'jpg' }
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    startsWith(0x52, 0x49, 0x46, 0x46) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { kind: 'image', mimeType: 'image/webp', extension: 'webp' }
  }
  // OGG: "OggS"
  if (startsWith(0x4f, 0x67, 0x67, 0x53)) {
    return { kind: 'audio', mimeType: 'audio/ogg', extension: 'ogg' }
  }
  // MP3 with an ID3 tag
  if (startsWith(0x49, 0x44, 0x33)) {
    return { kind: 'audio', mimeType: 'audio/mpeg', extension: 'mp3' }
  }
  // MP3 starting directly with a frame header
  if (bytes[0] === 0xff && ((bytes[1] ?? 0) & 0xe0) === 0xe0) {
    return { kind: 'audio', mimeType: 'audio/mpeg', extension: 'mp3' }
  }
  return null
}

export function validateFile(file: { size: number }, detected: DetectedFile | null): string | null {
  if (file.size === 0) return 'This file is empty.'
  if (file.size > MAX_FILE_BYTES) {
    return `This file is ${formatBytes(file.size)}. The maximum is ${formatBytes(MAX_FILE_BYTES)}.`
  }
  if (!detected) {
    return 'Unsupported file. Use GLB (3D model), MP3 or OGG (audio), or PNG, JPEG or WebP (image).'
  }
  return null
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Used only for showing a name. It is never used to build a storage path.
export function safeDisplayName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? ''
  const cleaned = Array.from(base)
    .filter((character) => {
      const code = character.charCodeAt(0)
      return code > 31 && code !== 127
    })
    .join('')
    .trim()
  return (cleaned || 'untitled').slice(0, 200)
}