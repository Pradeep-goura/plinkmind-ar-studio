import type { Scene } from './sceneSchema'

export const MAX_HISTORY = 100
export const MERGE_WINDOW_MS = 1000

export type HistoryState = {
  past: Scene[]
  present: Scene
  future: Scene[]
  lastKey: string | null
  lastTime: number
}

export type HistoryAction =
  | { type: 'change'; scene: Scene; key?: string; now: number }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset'; scene: Scene }

export function createHistory(scene: Scene): HistoryState {
  return { past: [], present: scene, future: [], lastKey: null, lastTime: 0 }
}

export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'change': {
      if (action.scene === state.present) return state

      // Quick repeated edits of the same field (like typing) become ONE undo step.
      const canMerge =
        action.key !== undefined &&
        action.key === state.lastKey &&
        action.now - state.lastTime < MERGE_WINDOW_MS
      if (canMerge) return { ...state, present: action.scene, lastTime: action.now }

      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY),
        present: action.scene,
        future: [],
        lastKey: action.key ?? null,
        lastTime: action.now,
      }
    }
    case 'undo': {
      const previous = state.past[state.past.length - 1]
      if (!previous) return state
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        lastKey: null,
        lastTime: 0,
      }
    }
    case 'redo': {
      const [next, ...rest] = state.future
      if (!next) return state
      return {
        past: [...state.past, state.present],
        present: next,
        future: rest,
        lastKey: null,
        lastTime: 0,
      }
    }
    case 'reset':
      return createHistory(action.scene)
  }
}