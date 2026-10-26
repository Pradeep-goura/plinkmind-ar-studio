import { describe, expect, it } from 'vitest'
import {
  MAX_FILE_BYTES,
  detectFileType,
  formatBytes,
  safeDisplayName,
  validateFile,
} from '../../src/features/assets/fileRules'

function blobOf(bytes: number[]): Blob {
  return new Blob([new Uint8Array(bytes)])
}

const glbInfo = { kind: 'model', mimeType: 'model/gltf-binary', extension: 'glb' } as const

describe('detectFileType', () => {
  it('detects a GLB 3D model', async () => {
    const bytes = [0x67, 0x6c, 0x54, 0x46, 0x02, 0x00, 0x00, 0x00, 0, 0, 0, 0]
    expect(await detectFileType(blobOf(bytes))).toEqual(glbInfo)
  })

  it('rejects a GLB with the wrong version', async () => {
    const bytes = [0x67, 0x6c, 0x54, 0x46, 0x01, 0x00, 0x00, 0x00]
    expect(await detectFileType(blobOf(bytes))).toBeNull()
  })

  it('detects a PNG image', async () => {
    const bytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    expect((await detectFileType(blobOf(bytes)))?.mimeType).toBe('image/png')
  })

  it('detects a JPEG image', async () => {
    expect((await detectFileType(blobOf([0xff, 0xd8, 0xff, 0xe0])))?.mimeType).toBe('image/jpeg')
  })

  it('detects a WebP image', async () => {
    const bytes = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]
    expect((await detectFileType(blobOf(bytes)))?.mimeType).toBe('image/webp')
  })

  it('detects OGG audio', async () => {
    expect((await detectFileType(blobOf([0x4f, 0x67, 0x67, 0x53, 0x00])))?.mimeType).toBe('audio/ogg')
  })

  it('detects MP3 with an ID3 tag', async () => {
    expect((await detectFileType(blobOf([0x49, 0x44, 0x33, 0x04])))?.mimeType).toBe('audio/mpeg')
  })

  it('detects MP3 with a raw frame header', async () => {
    expect((await detectFileType(blobOf([0xff, 0xfb, 0x90, 0x00])))?.mimeType).toBe('audio/mpeg')
  })

  it('returns null for a plain text file', async () => {
    const text = new Blob(['hello world, this is not a model'])
    expect(await detectFileType(text)).toBeNull()
  })

  it('returns null for an empty file', async () => {
    expect(await detectFileType(new Blob([]))).toBeNull()
  })
})

describe('validateFile', () => {
  it('accepts a normal file', () => {
    expect(validateFile({ size: 1000 }, glbInfo)).toBeNull()
  })

  it('rejects an empty file', () => {
    expect(validateFile({ size: 0 }, glbInfo)).toMatch(/empty/)
  })

  it('rejects a file over the maximum size', () => {
    expect(validateFile({ size: MAX_FILE_BYTES + 1 }, glbInfo)).toMatch(/maximum/)
  })

  it('rejects an unsupported file', () => {
    expect(validateFile({ size: 1000 }, null)).toMatch(/Unsupported/)
  })
})

describe('formatBytes', () => {
  it('formats bytes, kilobytes and megabytes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })
})

describe('safeDisplayName', () => {
  it('removes folder parts', () => {
    expect(safeDisplayName('../../etc/passwd')).toBe('passwd')
    expect(safeDisplayName('C:\\Users\\me\\my model.glb')).toBe('my model.glb')
  })

  it('falls back to "untitled" for an empty name', () => {
    expect(safeDisplayName('   ')).toBe('untitled')
  })

  it('limits the name to 200 characters', () => {
    expect(safeDisplayName('a'.repeat(300))).toHaveLength(200)
  })
})