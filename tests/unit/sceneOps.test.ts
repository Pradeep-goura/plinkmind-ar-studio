import { describe, expect, it } from 'vitest'
import {
  addAudio,
  addModel,
  createEmptyScene,
  removeObject,
  renameObject,
  setAudioSettings,
  setTransform,
  setVisible,
} from '../../src/features/editor/sceneOps'
import { MAX_OBJECTS } from '../../src/features/editor/sceneSchema'

const id1 = '11111111-1111-4111-8111-111111111111'
const asset = { id: '22222222-2222-4222-8222-222222222222', originalName: 'Duck.glb' }

describe('scene operations', () => {
  it('adds a visible model at the origin, named without the file extension', () => {
    const scene = addModel(createEmptyScene(), asset, id1)
    expect(scene.objects).toHaveLength(1)
    expect(scene.objects[0]).toMatchObject({
      type: 'model',
      name: 'Duck',
      visible: true,
      position: [0, 0, 0],
      scale: [1, 1, 1],
    })
  })

  it('adds an audio object with full volume and no loop', () => {
    const scene = addAudio(createEmptyScene(), { ...asset, originalName: 'song.mp3' }, id1)
    expect(scene.objects[0]).toMatchObject({ type: 'audio', name: 'song', volume: 1, loop: false })
  })

  it('does not add objects beyond the maximum', () => {
    let scene = createEmptyScene()
    for (let index = 0; index < MAX_OBJECTS; index += 1) {
      scene = addModel(scene, asset, `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`)
    }
    expect(addModel(scene, asset, id1)).toBe(scene)
  })

  it('renames an object', () => {
    const scene = renameObject(addModel(createEmptyScene(), asset, id1), id1, 'Big duck')
    expect(scene.objects[0]?.name).toBe('Big duck')
  })

  it('hides and shows an object', () => {
    const hidden = setVisible(addModel(createEmptyScene(), asset, id1), id1, false)
    expect(hidden.objects[0]?.visible).toBe(false)
  })

  it('updates a model position and leaves its rotation alone', () => {
    const scene = setTransform(addModel(createEmptyScene(), asset, id1), id1, { position: [1, 2, 3] })
    expect(scene.objects[0]).toMatchObject({ position: [1, 2, 3], rotation: [0, 0, 0] })
  })

  it('ignores a transform sent to an audio object', () => {
    const before = addAudio(createEmptyScene(), asset, id1)
    const after = setTransform(before, id1, { position: [1, 2, 3] })
    expect(after.objects[0]).toEqual(before.objects[0])
  })

  it('updates audio volume and loop', () => {
    const scene = setAudioSettings(addAudio(createEmptyScene(), asset, id1), id1, { volume: 0.3, loop: true })
    expect(scene.objects[0]).toMatchObject({ volume: 0.3, loop: true })
  })

  it('removes an object', () => {
    const scene = removeObject(addModel(createEmptyScene(), asset, id1), id1)
    expect(scene.objects).toHaveLength(0)
  })

  it('never changes the scene it was given', () => {
    const original = addModel(createEmptyScene(), asset, id1)
    const snapshot = JSON.stringify(original)
    renameObject(original, id1, 'Changed')
    setTransform(original, id1, { position: [5, 5, 5] })
    removeObject(original, id1)
    expect(JSON.stringify(original)).toBe(snapshot)
  })
})