import { describe, expect, it } from 'vitest'
import { clampUserScale, computeAutoFit } from '../../src/features/lab/arMath'

describe('computeAutoFit', () => {
  it('keeps a normal real-world size', () => {
    expect(computeAutoFit(1.7)).toEqual({ scale: 1, fitted: false })
  })

  it('shrinks a huge model to about 1 meter', () => {
    const result = computeAutoFit(100)
    expect(result.fitted).toBe(true)
    expect(result.scale).toBeCloseTo(0.01)
  })

  it('enlarges a tiny model to about 1 meter', () => {
    const result = computeAutoFit(0.01)
    expect(result.fitted).toBe(true)
    expect(result.scale).toBeCloseTo(100)
  })

  it('keeps sizes exactly on the limits', () => {
    expect(computeAutoFit(3).fitted).toBe(false)
    expect(computeAutoFit(0.02).fitted).toBe(false)
  })

  it('ignores zero and invalid sizes', () => {
    expect(computeAutoFit(0)).toEqual({ scale: 1, fitted: false })
    expect(computeAutoFit(NaN)).toEqual({ scale: 1, fitted: false })
    expect(computeAutoFit(-5)).toEqual({ scale: 1, fitted: false })
  })
})

describe('clampUserScale', () => {
  it('keeps the value between 0.1 and 5', () => {
    expect(clampUserScale(0)).toBe(0.1)
    expect(clampUserScale(10)).toBe(5)
    expect(clampUserScale(2)).toBe(2)
    expect(clampUserScale(NaN)).toBe(1)
  })
})