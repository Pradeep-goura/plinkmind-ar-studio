import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { z } from 'zod'
import { Notice } from '../components/ui/Notice'
import { listAssets } from '../features/assets/assetsApi'
import { AssetLibraryPanel } from '../features/assets/AssetLibraryPanel'
import { EditorToolbar } from '../features/editor/EditorToolbar'
import { HierarchyPanel } from '../features/editor/HierarchyPanel'
import { PropertiesPanel } from '../features/editor/PropertiesPanel'
import { addAudio, addModel, findObject, removeObject, setTransform, setVisible } from '../features/editor/sceneOps'
import { MAX_OBJECTS } from '../features/editor/sceneSchema'
import { useSceneEditor } from '../features/editor/useSceneEditor'
import { getProject } from '../features/projects/projectsApi'
import { errorMessage } from '../lib/utils/errors'
import type { Asset } from '../types/asset'
import type { Project } from '../types/project'
import type { TransformMode } from '../features/editor/viewport/ViewportEngine'

const Viewport = lazy(() => import('../features/editor/Viewport'))
type ExtraState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; project: Project; assets: Asset[] }

function SceneEditor({ projectId }: { projectId: string }) {
  const editor = useSceneEditor(projectId)
  const { scene, change, undo, redo } = editor
  const [extra, setExtra] = useState<ExtraState>({ status: 'loading' })
  const [selectedId, setSelectedId] = useState<string | null>(null)
    const [mode, setMode] = useState<TransformMode>('translate')

  useEffect(() => {
    let ignore = false
    Promise.all([getProject(projectId), listAssets()])
      .then(([project, assets]) => {
        if (!ignore) setExtra({ status: 'ready', project, assets })
      })
      .catch((error: unknown) => {
        if (!ignore) setExtra({ status: 'error', message: errorMessage(error) })
      })
    return () => {
      ignore = true
    }
  }, [projectId])

  // Keyboard shortcuts (ignored while typing in a field, so normal text undo still works).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return
      const modifier = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()
            if (!modifier && !event.altKey) {
        if (key === 'w') setMode('translate')
        else if (key === 'e') setMode('rotate')
        else if (key === 'r') setMode('scale')
        else if (event.key === 'Escape') setSelectedId(null)
      }

      if (modifier && key === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      } else if (modifier && key === 'y') {
        event.preventDefault()
        redo()
      } else if (event.key === 'Delete' && selectedId) {
        event.preventDefault()
        change(removeObject(scene, selectedId))
        setSelectedId(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo, change, scene, selectedId])

  if (editor.load.status === 'error' || extra.status === 'error') {
    const message = editor.load.status === 'error' ? editor.load.message : extra.status === 'error' ? extra.message : ''
    return (
      <div className="mx-auto max-w-xl space-y-3 p-8">
        <Notice tone="error" title="Could not open the editor">{message}</Notice>
        <Link to="/dashboard" className="font-medium underline">Back to projects</Link>
      </div>
    )
  }
  if (editor.load.status === 'loading' || extra.status === 'loading') {
    return <p role="status" className="p-8">Loading the editor...</p>
  }

  const assetsById = new Map(extra.assets.map((asset) => [asset.id, asset]))
  const selected = selectedId ? findObject(scene, selectedId) : undefined

  function handleAddModel(asset: Asset) {
    const id = crypto.randomUUID()
    change(addModel(scene, asset, id))
    setSelectedId(id)
  }

  function handleAddAudio(asset: Asset) {
    const id = crypto.randomUUID()
    change(addAudio(scene, asset, id))
    setSelectedId(id)
  }

  function handleToggleVisible(id: string) {
    const object = findObject(scene, id)
    if (object) change(setVisible(scene, id, !object.visible))
  }

  function handleDelete(id: string) {
    change(removeObject(scene, id))
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <div className="min-h-screen">
      <EditorToolbar
        projectName={extra.project.name}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        onUndo={undo}
        onRedo={redo}
        saveLabel={editor.saveLabel}
        saveMessage={editor.saveMessage}
        onRetry={editor.retry}
      />
      <div className="mx-auto grid max-w-[1400px] gap-4 p-4 lg:grid-cols-[280px_1fr_300px]">
        <div className="space-y-4">
          <HierarchyPanel
            scene={scene}
            selectedId={selectedId}
            assetsById={assetsById}
            onSelect={setSelectedId}
            onToggleVisible={handleToggleVisible}
            onDelete={handleDelete}
          />
          <AssetLibraryPanel
            assets={extra.assets}
            full={scene.objects.length >= MAX_OBJECTS}
            onAddModel={handleAddModel}
            onAddAudio={handleAddAudio}
          />
        </div>

                <Suspense fallback={<p role="status">Loading the 3D viewport...</p>}>
          <Viewport
            scene={scene}
            assets={extra.assets}
            selectedId={selectedId}
            mode={mode}
            onModeChange={setMode}
            onSelect={setSelectedId}
            onTransformEnd={(id, transform) => change(setTransform(scene, id, transform))}
          />
        </Suspense>

        <PropertiesPanel
          scene={scene}
          object={selected}
          asset={selected ? assetsById.get(selected.assetId) : undefined}
          onChange={change}
        />
      </div>
    </div>
  )
}

export function EditorPage() {
  const { projectId } = useParams()
  const parsed = z.string().uuid().safeParse(projectId)

  if (!parsed.success) {
    return (
      <div className="mx-auto max-w-xl space-y-3 p-8">
        <Notice tone="error" title="Project not found">This editor link is not valid.</Notice>
        <Link to="/dashboard" className="font-medium underline">Back to projects</Link>
      </div>
    )
  }
  return <SceneEditor key={parsed.data} projectId={parsed.data} />
}