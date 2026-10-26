import { useCallback, useEffect, useReducer, useState } from 'react'
import { errorMessage } from '../../lib/utils/errors'
import { createHistory, historyReducer } from './sceneHistory'
import { createEmptyScene } from './sceneOps'
import type { Scene } from './sceneSchema'
import { SceneConflictError, loadOrCreateScene, saveScene } from './scenesApi'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready' }

type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string }
  | { status: 'conflict'; message: string }

export type SaveLabel = 'saved' | 'unsaved' | 'saving' | 'error' | 'conflict'

const AUTOSAVE_DELAY_MS = 2000

export function useSceneEditor(projectId: string) {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [history, dispatch] = useReducer(historyReducer, createEmptyScene(), createHistory)
  const [savedScene, setSavedScene] = useState<Scene | null>(null)
  const [version, setVersion] = useState(0)
  const [save, setSave] = useState<SaveState>({ status: 'idle' })

  useEffect(() => {
    let ignore = false
    loadOrCreateScene(projectId)
      .then((loaded) => {
        if (ignore) return
        dispatch({ type: 'reset', scene: loaded.scene })
        setSavedScene(loaded.scene)
        setVersion(loaded.version)
        setLoad({ status: 'ready' })
      })
      .catch((error: unknown) => {
        if (!ignore) setLoad({ status: 'error', message: errorMessage(error) })
      })
    return () => {
      ignore = true
    }
  }, [projectId])

  const present = history.present
  const dirty = load.status === 'ready' && present !== savedScene

  // Autosave: 2 seconds after the last change, one save at a time.
  useEffect(() => {
    if (!dirty || save.status !== 'idle') return
    const timer = window.setTimeout(() => {
      setSave({ status: 'saving' })
      saveScene(projectId, present, version)
        .then((newVersion) => {
          setVersion(newVersion)
          setSavedScene(present)
          setSave({ status: 'idle' })
        })
        .catch((error: unknown) => {
          if (error instanceof SceneConflictError) {
            setSave({ status: 'conflict', message: error.message })
          } else {
            setSave({ status: 'error', message: errorMessage(error) })
          }
        })
    }, AUTOSAVE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [dirty, present, version, projectId, save.status])

  // Warn before closing the tab with unsaved work.
  useEffect(() => {
    if (!dirty) return
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const change = useCallback((scene: Scene, key?: string) => {
    dispatch({ type: 'change', scene, key, now: Date.now() })
    setSave((current) => (current.status === 'error' ? { status: 'idle' } : current))
  }, [])

  const undo = useCallback(() => dispatch({ type: 'undo' }), [])
  const redo = useCallback(() => dispatch({ type: 'redo' }), [])
  const retry = useCallback(() => setSave({ status: 'idle' }), [])

  let saveLabel: SaveLabel = 'saved'
  if (save.status === 'saving') saveLabel = 'saving'
  else if (save.status === 'conflict') saveLabel = 'conflict'
  else if (save.status === 'error') saveLabel = 'error'
  else if (dirty) saveLabel = 'unsaved'

  return {
    load,
    scene: present,
    change,
    undo,
    redo,
    retry,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    saveLabel,
    saveMessage: save.status === 'error' || save.status === 'conflict' ? save.message : '',
  }
}