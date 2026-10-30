import { describe, expect, it } from 'vitest'
import { addAudio, addModel, createEmptyScene, setVisible } from '../../src/features/editor/sceneOps'
import { buildViewData } from '../../src/features/publishing/viewData'

const modelAsset = { id: '11111111-1111-4111-8111-111111111111', originalName: 'Duck.glb' }
const modelAsset2 = { id: '22222222-2222-4222-8222-222222222222', originalName: 'Robot.glb' }
const audioAsset = { id: '33333333-3333-4333-8333-333333333333', originalName: 'song.mp3' }
const idA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const idB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const idC = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'

describe('buildViewData', () => {
  it('collects the model objects', () => {
    const scene = addModel(addModel(createEmptyScene(), modelAsset, idA), modelAsset2, idB)
    const urls = new Map([[modelAsset.id, 'u1'], [modelAsset2.id, 'u2']])
    expect(buildViewData(scene, urls, new Set()).models).toHaveLength(2)
  })

  it('marks assets without a link, and failed assets, as missing', () => {
    const scene = addModel(addModel(createEmptyScene(), modelAsset, idA), modelAsset2, idB)
    const view = buildViewData(scene, new Map([[modelAsset.id, 'u1']]), new Set(['extra']))
    expect(view.missing.has(modelAsset2.id)).toBe(true)
    expect(view.missing.has('extra')).toBe(true)
    expect(view.missing.has(modelAsset.id)).toBe(false)
  })

  it('skips hidden audio and audio without a link', () => {
    let scene = addAudio(createEmptyScene(), audioAsset, idA)
    scene = setVisible(scene, idA, false)
    expect(buildViewData(scene, new Map([[audioAsset.id, 'a']]), new Set()).audioItems).toHaveLength(0)

    const visible = addAudio(createEmptyScene(), audioAsset, idA)
    expect(buildViewData(visible, new Map(), new Set()).audioItems).toHaveLength(0)
    expect(buildViewData(visible, new Map([[audioAsset.id, 'a']]), new Set()).audioItems).toHaveLength(1)
  })

  it('picks the first visible model that has a link for AR', () => {
    let scene = addModel(addModel(createEmptyScene(), modelAsset, idA), modelAsset2, idB)
    scene = setVisible(scene, idA, false)
    const urls = new Map([[modelAsset.id, 'u1'], [modelAsset2.id, 'u2']])
    expect(buildViewData(scene, urls, new Set()).arModel).toEqual({ url: 'u2', name: 'Robot' })
  })

  it('has no AR model when nothing is visible or loadable', () => {
    const empty = createEmptyScene()
    expect(buildViewData(empty, new Map(), new Set()).arModel).toBeNull()

    const onlyAudio = addAudio(empty, audioAsset, idC)
    expect(buildViewData(onlyAudio, new Map([[audioAsset.id, 'a']]), new Set()).arModel).toBeNull()
  })
})