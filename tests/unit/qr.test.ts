import { describe, expect, it } from 'vitest'
import { createQrMatrix } from '../../src/features/publishing/qr'

const url = 'https://studio.example.com/experience/a1b2c3d4e5f6'

describe('createQrMatrix', () => {
  it('makes a square grid of at least 21 modules', () => {
    const matrix = createQrMatrix(url)
    expect(matrix.length).toBeGreaterThanOrEqual(21)
    expect(matrix.every((row) => row.length === matrix.length)).toBe(true)
  })

  it('contains both dark and light modules', () => {
    const flat = createQrMatrix(url).flat()
    expect(flat).toContain(true)
    expect(flat).toContain(false)
  })

  it('gives a different code for a different link', () => {
    const other = createQrMatrix('https://studio.example.com/experience/zzzzzzzzzzzz')
    expect(JSON.stringify(other)).not.toBe(JSON.stringify(createQrMatrix(url)))
  })
})