import { describe, expect, it } from 'vitest'
import { describeError, formatReport, withTimeout } from '../../src/features/diagnostics/report'

describe('withTimeout', () => {
  it('returns the value when the work finishes in time', async () => {
    await expect(withTimeout(Promise.resolve(42), 200)).resolves.toBe(42)
  })

  it('rejects when the work takes too long', async () => {
    await expect(withTimeout(new Promise<number>(() => undefined), 20, 'too slow')).rejects.toThrow('too slow')
  })
})

describe('formatReport', () => {
  it('writes one "label: value" line per entry', () => {
    const text = formatReport([
      { label: 'A', value: '1' },
      { label: 'B', value: '2' },
    ])
    expect(text).toBe('A: 1\nB: 2')
  })
})

describe('describeError', () => {
  it('describes errors and unknown values', () => {
    expect(describeError(new TypeError('Failed to fetch'))).toBe('TypeError: Failed to fetch')
    expect(describeError('oops')).toBe('unknown error')
  })
})