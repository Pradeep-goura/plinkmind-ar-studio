import { Button } from '../components/ui/Button'
import { Notice } from '../components/ui/Notice'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ProjectList } from '../features/projects/ProjectList'

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Projects</h1>
        <div className="flex items-center gap-2">
          <StatusBadge tone="planned" label="Planned" />
          <Button disabled>New project</Button>
        </div>
      </div>

      <Notice tone="info" title="Sample data">
        These projects are samples to show the layout. Search and the status filter work on this
        sample list. Real projects and saving come in Phase 3.
      </Notice>

      <ProjectList />
    </div>
  )
}