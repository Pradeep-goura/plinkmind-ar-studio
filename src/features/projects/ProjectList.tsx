import { useState } from 'react'
import type { ProjectStatus } from '../../types/project'
import { sampleProjects } from './sampleProjects'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'

type StatusFilter = 'all' | ProjectStatus

const trackingLabels = {
  surface: 'Surface placement',
  image: 'Image target',
}

export function ProjectList() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  const visibleProjects = sampleProjects.filter((project) => {
    const matchesName = project.name.toLowerCase().includes(query.trim().toLowerCase())
    const matchesStatus = status === 'all' || project.status === status
    return matchesName && matchesStatus
  })

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
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
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            className="rounded-md border border-neutral-500 bg-brand-paper px-3 py-2"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {visibleProjects.length === 0 ? (
        <p className="rounded-md bg-brand-paper p-6 text-center">No sample projects match your search.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {visibleProjects.map((project) => (
            <li key={project.id} className="rounded-card bg-brand-paper p-5">
              <div className="mb-3 flex flex-wrap gap-2">
                <StatusBadge tone="sample" label="Sample" />
                <StatusBadge tone={project.status} label={project.status === 'draft' ? 'Draft' : 'Published'} />
              </div>
              <h3 className="text-lg font-semibold">{project.name}</h3>
              <p className="mt-1 text-sm text-neutral-700">
                {trackingLabels[project.trackingMode]} · Updated{' '}
                {new Date(project.updatedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <Button variant="outline" disabled className="mt-4">
                Open editor (planned)
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}