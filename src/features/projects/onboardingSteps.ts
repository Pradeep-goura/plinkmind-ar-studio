import type { Project } from '../../types/project'
import type { PublishInfo } from '../publishing/publishApi'

export type OnboardingStep = { id: string; label: string; done: boolean; to?: string }

export function buildOnboardingSteps(
  assetCount: number,
  projects: Project[],
  publish: PublishInfo[],
): OnboardingStep[] {
  return [
    { id: 'upload', label: 'Upload a 3D model', done: assetCount > 0, to: '/dashboard/assets' },
    { id: 'project', label: 'Create a project', done: projects.length > 0 },
    { id: 'publish', label: 'Publish an experience', done: publish.some((item) => item.status === 'live') },
  ]
}