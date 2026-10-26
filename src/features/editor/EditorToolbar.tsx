import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Notice } from '../../components/ui/Notice'
import type { SaveLabel } from './useSceneEditor'

const labels: Record<SaveLabel, string> = {
  saved: 'All changes saved',
  unsaved: 'Unsaved changes',
  saving: 'Saving...',
  error: 'Save failed',
  conflict: 'Not saved: scene changed elsewhere',
}

type EditorToolbarProps = {
  projectName: string
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  saveLabel: SaveLabel
  saveMessage: string
  onRetry: () => void
}

export function EditorToolbar(props: EditorToolbarProps) {
  const { projectName, canUndo, canRedo, onUndo, onRedo, saveLabel, saveMessage, onRetry } = props

  return (
    <header className="border-b border-black/10 bg-brand-paper">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3">
        <Link to="/dashboard" className="text-sm font-medium underline">
          Back to projects
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{projectName}</h1>
        <Button variant="outline" disabled={!canUndo} onClick={onUndo}>Undo</Button>
        <Button variant="outline" disabled={!canRedo} onClick={onRedo}>Redo</Button>
        <p aria-live="polite" className="text-sm font-medium">{labels[saveLabel]}</p>
      </div>

      {saveLabel === 'error' && (
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 pb-3">
          <div className="min-w-0 flex-1">
            <Notice tone="error" title="Could not save">{saveMessage}</Notice>
          </div>
          <Button onClick={onRetry}>Retry</Button>
        </div>
      )}
      {saveLabel === 'conflict' && (
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 pb-3">
          <div className="min-w-0 flex-1">
            <Notice tone="warning" title="Your recent changes are not saved">{saveMessage}</Notice>
          </div>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      )}
    </header>
  )
}