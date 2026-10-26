import { describe, expect, it } from 'vitest'
import { MAX_OBJECTS, parseScene } from '../../src/features/editor/sceneSchema'

const id1 = '11111111-1111-4111-8111-111111111111'
const asset1 = '22222222-2222-4222-8222-222222222222'

const model = {
  id: id1,
  type: 'model',
  name: 'Duck',
  visible: true,
  assetId: asset1,
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
}

const audio = { id: id1, type: 'audio', name: 'Music', visible: true, assetId: asset1, volume: 0.5, loop: true }

function sceneWith(objects: unknown[]) {
  return { schemaVersion: 1, objects }
}

describe('parseScene', () => {
  it('accepts an empty scene', () => {
    expect(parseScene(sceneWith([]), 1).ok).toBe(true)
  })

  it('accepts a scene with a model', () => {
    expect(parseScene(sceneWith([model]), 1).ok).toBe(true)
  })

  it('accepts a scene with an audio object', () => {
    expect(parseScene(sceneWith([audio]), 1).ok).toBe(true)
  })

  it('rejects an unknown object type', () => {
    expect(parseScene(sceneWith([{ ...model, type: 'video' }]), 1).ok).toBe(false)
  })

  it('rejects a scale of zero', () => {
    expect(parseScene(sceneWith([{ ...model, scale: [0, 1, 1] }]), 1).ok).toBe(false)
  })

  it('rejects more than the maximum number of objects', () => {
    const many = Array.from({ length: MAX_OBJECTS + 1 }, (_, index) => ({
      ...model,
      id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    }))
    expect(parseScene(sceneWith(many), 1).ok).toBe(false)
  })

  it('rejects duplicate object ids', () => {
    expect(parseScene(sceneWith([model, model]), 1).ok).toBe(false)
  })

  it('rejects a scene saved by a newer schema version', () => {
    expect(parseScene(sceneWith([]), 2).ok).toBe(false)
  })

  it('rejects data that is not a scene', () => {
    expect(parseScene({}, 1).ok).toBe(false)
  })
})