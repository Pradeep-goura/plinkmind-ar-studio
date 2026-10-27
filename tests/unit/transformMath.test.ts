import { describe, expect, it } from 'vitest'
import { addModel, createEmptyScene, setTransform } from '../../src/features/editor/sceneOps'
import { parseScene } from '../../src/features/editor/sceneSchema'
import { toRadians, toSceneTransform } from '../../src/features/editor/viewport/transformMath'

const id1 = '11111111-1111-4111-8111-111111111111'
const asset = { id: '22222222-2222-4222-8222-222222222222', originalName: 'Duck.glb' }

describe('toSceneTransform', () => {
  it('rounds values to 3 decimals', () => {
    const result = toSceneTransform([1.23456, 2, 0.0004], [0, 0, 0], [1, 1, 1])
    expect(result.position).toEqual([1.235, 2, 0])
  })

  it('converts rotation from radians to degrees', () => {
    const result = toSceneTransform([0, 0, 0], [Math.PI / 2, Math.PI, 0], [1, 1, 1])
    expect(result.rotation).toEqual([90, 180, 0])
  })

  it('keeps scale within the allowed range', () => {
    const result = toSceneTransform([0, 0, 0], [0, 0, 0], [0, -2, 5000])
    expect(result.scale).toEqual([0.001, 0.001, 1000])
  })

  it('keeps position within the allowed range', () => {
    const result = toSceneTransform([1e9, -1e9, 5], [0, 0, 0], [1, 1, 1])
    expect(result.position).toEqual([10000, -10000, 5])
  })

  it('replaces invalid numbers with safe defaults', () => {
    const result = toSceneTransform([NaN, Infinity, -Infinity], [NaN, 0, 0], [NaN, 1, 1])
    expect(result.position).toEqual([0, 0, 0])
    expect(result.rotation).toEqual([0, 0, 0])
    expect(result.scale).toEqual([1, 1, 1])
  })

  it('always produces values the scene schema accepts', () => {
    const transform = toSceneTransform([1e6, 2, 3], [10, 20, 30], [0, 5, 2000])
    const scene = setTransform(addModel(createEmptyScene(), asset, id1), id1, transform)
    expect(parseScene(scene, 1).ok).toBe(true)
  })
})

describe('toRadians', () => {
  it('converts degrees back to radians', () => {
    const result = toRadians([90, 180, 0])
    expect(result[0]).toBeCloseTo(Math.PI / 2)
    expect(result[1]).toBeCloseTo(Math.PI)
    expect(result[2]).toBe(0)
  })
})