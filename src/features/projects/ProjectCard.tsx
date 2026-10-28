import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, ButtonLink } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import type { Project } from '../../types/project'
import type { PublishInfo } from '../publishing/publishApi'
import { PublishPanel } from '../publishing/PublishPanel'

type ProjectCardProps = {
  project: Project
  publishInfo: PublishInfo | undefined
  busy: boolean
  onRename: (name: string) => void
  onDuplicate: () => void
  onDelete: () => void
  onPublish: () => void
  onUnpublish: () => void
}

type Mode = 'view' | 'rename' | 'delete'

const trackingLabels = {
  surface: 'Surface placement',
  image: 'Image target',
}

export function ProjectCard(props: ProjectCardProps) {
  const { project, publishInfo, busy, onRename, onDuplicate, onDelete, onPublish, onUnpublish } = props
  const [mode, setMode] = useState<Mode>('view')

  function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = String(new FormData(event.currentTarget).get('name') ?? '')
    setMode('view')
    onRename(name)
  }

  return (
    <li className="rounded-card bg-brand-paper p-5">
      <div className="mb-3 flex flex-wrap gap-2">
        <StatusBadge
          tone={project.status}
          label={project.status === 'draft' ? 'Draft' : 'Published'}
        />
      </div>
      <h3 className="break-words text-lg font-semibold">{project.name}</h3>
      <p className="mt-1 text-sm text-neutral-700">
        {trackingLabels[project.trackingMode]} · Updated{' '}
        {new Date(project.updatedAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </p>

      {mode === 'rename' && (
        <form className="mt-4 space-y-2" onSubmit={submitRename}>
          <label htmlFor={`rename-${project.id}`} className="block text-sm font-medium">
            New name
          </label>
          <input
            id={`rename-${project.id}`}
            name="name"
            defaultValue={project.name}
            required
            className="w-full rounded-md border border-neutral-500 px-3 py-2"
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>Save</Button>
            <Button variant="outline" onClick={() => setMode('view')}>Cancel</Button>
          </div>
        </form>
      )}

      {mode === 'delete' && (
        <div className="mt-4 rounded-md border border-red-700 bg-red-50 p-3 text-sm" role="group" aria-label="Confirm delete">
          <p>
            Delete "{project.name}"? This cannot be undone.
            {project.status === 'published' &&
              ' This project is published, so its public link and QR code will stop working.'}
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => {
                setMode('view')
                onDelete()
              }}
            >
              Yes, delete
            </Button>
            <Button variant="outline" onClick={() => setMode('view')}>Cancel</Button>
          </div>
        </div>
      )}

      {mode === 'view' && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" disabled={busy} onClick={() => setMode('rename')}>Rename</Button>
            <Button variant="outline" disabled={busy} onClick={onDuplicate}>Duplicate</Button>
            <Button variant="outline" disabled={busy} onClick={() => setMode('delete')}>Delete</Button>
            <ButtonLink to={`/dashboard/projects/${project.id}/editor`} variant="outline">Open editor</ButtonLink>
          </div>
          <PublishPanel
            project={project}
            info={publishInfo}
            busy={busy}
            onPublish={onPublish}
            onUnpublish={onUnpublish}
          />
        </>
      )}
    </li>
  )
}