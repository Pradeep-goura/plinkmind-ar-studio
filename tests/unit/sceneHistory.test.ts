import { describe, expect, it } from 'vitest'
import {
  MAX_HISTORY,
  MERGE_WINDOW_MS,
  createHistory,
  historyReducer,
} from '../../src/features/editor/sceneHistory'
import { addModel, createEmptyScene, renameObject } from '../../src/features/editor/sceneOps'

const id1 = '11111111-1111-4111-8111-111111111111'
const asset = { id: '22222222-2222-4222-8222-222222222222', originalName: 'Duck.glb' }

const s0 = createEmptyScene()
const s1 = addModel(s0, asset, id1)
const s2 = renameObject(s1, id1, 'A')
const s3 = renameObject(s2, id1, 'AB')

describe('history', () => {
  it('starts with nothing to undo or redo', () => {
    const state = createHistory(s0)
    expect(state.past).toHaveLength(0)
    expect(state.future).toHaveLength(0)
  })

  it('can undo and redo a change', () => {
    let state = historyReducer(createHistory(s0), { type: 'change', scene: s1, now: 0 })
    state = historyReducer(state, { type: 'undo' })
    expect(state.present).toBe(s0)
    state = historyReducer(state, { type: 'redo' })
    expect(state.present).toBe(s1)
  })

  it('clears redo when a new change is made after undo', () => {
    let state = historyReducer(createHistory(s0), { type: 'change', scene: s1, now: 0 })
    state = historyReducer(state, { type: 'undo' })
    state = historyReducer(state, { type: 'change', scene: s2, now: 10 })
    expect(state.future).toHaveLength(0)
  })

  it('ignores a change that gives back the same scene', () => {
    const state = createHistory(s0)
    expect(historyReducer(state, { type: 'change', scene: s0, now: 0 })).toBe(state)
  })

  it('merges quick edits of the same field into one undo step', () => {
    let state = historyReducer(createHistory(s1), { type: 'change', scene: s2, key: 'name', now: 0 })
    state = historyReducer(state, { type: 'change', scene: s3, key: 'name', now: 100 })
    expect(state.past).toHaveLength(1)
    expect(state.present).toBe(s3)
  })

  it('does not merge edits of different fields', () => {
    let state = historyReducer(createHistory(s1), { type: 'change', scene: s2, key: 'a', now: 0 })
    state = historyReducer(state, { type: 'change', scene: s3, key: 'b', now: 100 })
    expect(state.past).toHaveLength(2)
  })

  it('does not merge edits made far apart in time', () => {
    let state = historyReducer(createHistory(s1), { type: 'change', scene: s2, key: 'name', now: 0 })
    state = historyReducer(state, { type: 'change', scene: s3, key: 'name', now: MERGE_WINDOW_MS + 1 })
    expect(state.past).toHaveLength(2)
  })

  it('clears everything on reset', () => {
    let state = historyReducer(createHistory(s0), { type: 'change', scene: s1, now: 0 })
    state = historyReducer(state, { type: 'reset', scene: s2 })
    expect(state.past).toHaveLength(0)
    expect(state.present).toBe(s2)
  })

  it('keeps at most the maximum number of undo steps', () => {
    let state = createHistory(s0)
    for (let index = 0; index < MAX_HISTORY + 5; index += 1) {
      state = historyReducer(state, { type: 'change', scene: renameObject(s1, id1, `n${index}`), now: index })
    }
    expect(state.past.length).toBeLessThanOrEqual(MAX_HISTORY)
  })
})