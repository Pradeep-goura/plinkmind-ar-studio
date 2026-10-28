import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Notice } from '../../components/ui/Notice'
import { TextField } from '../../components/ui/TextField'
import { errorMessage } from '../../lib/utils/errors'
import { firstError, projectNameSchema } from '../../lib/validation/forms'
import type { Project, ProjectStatus, TrackingMode } from '../../types/project'
import { useAuth } from '../auth/useAuth'
import { listPublishInfo, publishProject, unpublishProject } from '../publishing/publishApi'
import type { PublishInfo } from '../publishing/publishApi'
import { ProjectCard } from './ProjectCard'
import {
  createProject,
  deleteProject,
  duplicateProject,
  getWorkspaceId,
  listProjects,
  renameProject,
} from './projectsApi'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; workspaceId: string; projects: Project[]; publish: PublishInfo[] }

type NoticeState = { tone: 'success' | 'error'; text: string }

export function ProjectManager() {
  const { user } = useAuth()
  const userId = user?.id
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [notice, setNotice] = useState<NoticeState | null>(null)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all')

  useEffect(() => {
    if (!userId) return
    let ignore = false

    async function load(id: string) {
      try {
        const [workspaceId, projects, publish] = await Promise.all([
          getWorkspaceId(id),
          listProjects(),
          listPublishInfo(),
        ])
        if (!ignore) setState({ status: 'ready', workspaceId, projects, publish })
      } catch (error) {
        if (!ignore) setState({ status: 'error', message: errorMessage(error) })
      }
    }

    void load(userId)
    return () => {
      ignore = true
    }
  }, [userId])

  function changeProjects(change: (projects: Project[]) => Project[]) {
    setState((previous) =>
      previous.status === 'ready' ? { ...previous, projects: change(previous.projects) } : previous,
    )
  }

  function changePublish(change: (publish: PublishInfo[]) => PublishInfo[]) {
    setState((previous) =>
      previous.status === 'ready' ? { ...previous, publish: change(previous.publish) } : previous,
    )
  }

  async function runAction(action: () => Promise<string>) {
    setBusy(true)
    setNotice(null)
    try {
      setNotice({ tone: 'success', text: await action() })
    } catch (error) {
      setNotice({ tone: 'error', text: errorMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state.status !== 'ready') return
    const workspaceId = state.workspaceId
    const form = event.currentTarget
    const data = new FormData(form)
    const parsed = projectNameSchema.safeParse(String(data.get('name') ?? ''))
    if (!parsed.success) {
      setNotice({ tone: 'error', text: firstError(parsed.error) })
      return
    }
    const name = parsed.data
    const mode: TrackingMode = data.get('tracking') === 'image' ? 'image' : 'surface'

    void runAction(async () => {
      const project = await createProject(workspaceId, name, mode)
      changeProjects((list) => [project, ...list])
      form.reset()
      return `Created "${project.name}".`
    })
  }

  function handleRename(project: Project, rawName: string) {
    const parsed = projectNameSchema.safeParse(rawName)
    if (!parsed.success) {
      setNotice({ tone: 'error', text: firstError(parsed.error) })
      return
    }
    const name = parsed.data
    if (name === project.name) return

    void runAction(async () => {
      const updated = await renameProject(project.id, name)
      changeProjects((list) => list.map((item) => (item.id === updated.id ? updated : item)))
      return `Renamed to "${updated.name}".`
    })
  }

  function handleDuplicate(project: Project) {
    if (state.status !== 'ready') return
    const workspaceId = state.workspaceId

    void runAction(async () => {
      const copy = await duplicateProject(workspaceId, project)
      changeProjects((list) => [copy, ...list])
      return `Created "${copy.name}".`
    })
  }

  function handleDelete(project: Project) {
    void runAction(async () => {
      await deleteProject(project.id)
      changeProjects((list) => list.filter((item) => item.id !== project.id))
      changePublish((list) => list.filter((item) => item.projectId !== project.id))
      return `Deleted "${project.name}".`
    })
  }

  function handlePublish(project: Project) {
    void runAction(async () => {
      const result = await publishProject(project.id)
      changePublish((list) => [
        ...list.filter((item) => item.projectId !== project.id),
        {
          projectId: project.id,
          slug: result.slug,
          status: 'live',
          liveVersion: result.version,
          updatedAt: new Date().toISOString(),
        },
      ])
      changeProjects((list) =>
        list.map((item) => (item.id === project.id ? { ...item, status: 'published' } : item)),
      )
      return `Published "${project.name}" as version ${result.version}.`
    })
  }

  function handleUnpublish(project: Project) {
    void runAction(async () => {
      await unpublishProject(project.id)
      changePublish((list) =>
        list.map((item) => (item.projectId === project.id ? { ...item, status: 'unpublished' } : item)),
      )
      changeProjects((list) =>
        list.map((item) => (item.id === project.id ? { ...item, status: 'draft' } : item)),
      )
      return `Unpublished "${project.name}". Its link no longer works until you publish again.`
    })
  }

  if (state.status === 'loading') {
    return (
      <p role="status" className="rounded-md bg-brand-paper p-6">
        Loading your projects...
      </p>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="space-y-3">
        <Notice tone="error" title="Could not load your projects">
          {state.message}
        </Notice>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </div>
    )
  }

  const visibleProjects = state.projects.filter((project) => {
    const matchesName = project.name.toLowerCase().includes(query.trim().toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    return matchesName && matchesStatus
  })

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="grid gap-3 rounded-card bg-brand-paper p-5 sm:grid-cols-[1fr_220px_auto] sm:items-end">
        <TextField id="new-project-name" name="name" label="New project name" required />
        <div>
          <label htmlFor="new-project-tracking" className="mb-1 block text-sm font-medium">
            Tracking mode
          </label>
          <select
            id="new-project-tracking"
            name="tracking"
            className="w-full rounded-md border border-neutral-500 bg-brand-paper px-3 py-2"
          >
            <option value="surface">Surface placement</option>
            <option value="image">Image target (planned)</option>
          </select>
        </div>
        <Button type="submit" disabled={busy}>Create project</Button>
      </form>

      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="project-search" className="mb-1 block text-sm font-medium">
            Search projects
          </label>
          <input
            id="project-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-md border border-neutral-500 bg-brand-paper px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="project-status" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select
            id="project-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | ProjectStatus)}
            className="rounded-md border border-neutral-500 bg-brand-paper px-3 py-2"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {state.projects.length === 0 ? (
        <p className="rounded-md bg-brand-paper p-6 text-center">
          You have no projects yet. Create your first one above.
        </p>
      ) : visibleProjects.length === 0 ? (
        <p className="rounded-md bg-brand-paper p-6 text-center">No projects match your search.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {visibleProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              publishInfo={state.publish.find((item) => item.projectId === project.id)}
              busy={busy}
              onRename={(name) => handleRename(project, name)}
              onDuplicate={() => handleDuplicate(project)}
              onDelete={() => handleDelete(project)}
              onPublish={() => handlePublish(project)}
              onUnpublish={() => handleUnpublish(project)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}