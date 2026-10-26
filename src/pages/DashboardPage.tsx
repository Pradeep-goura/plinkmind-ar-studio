import { ProjectManager } from '../features/projects/ProjectManager'

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Projects</h1>
      <ProjectManager />
    </div>
  )
}