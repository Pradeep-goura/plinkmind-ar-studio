import { describe, expect, it } from 'vitest'
import { buildOnboardingSteps } from '../../src/features/projects/onboardingSteps'
import type { PublishInfo } from '../../src/features/publishing/publishApi'
import type { Project } from '../../src/types/project'

const project: Project = {
  id: 'p1',
  name: 'Test',
  status: 'draft',
  trackingMode: 'surface',
  updatedAt: '2026-11-01T00:00:00Z',
}

const live: PublishInfo = {
  projectId: 'p1',
  slug: 'a1b2c3d4e5f6',
  status: 'live',
  liveVersion: 1,
  updatedAt: '2026-11-01T00:00:00Z',
}

function done(steps: ReturnType<typeof buildOnboardingSteps>): string[] {
  return steps.filter((step) => step.done).map((step) => step.id)
}

describe('buildOnboardingSteps', () => {
  it('has nothing done for a new account', () => {
    expect(done(buildOnboardingSteps(0, [], []))).toEqual([])
  })

  it('marks the upload step when there is an asset', () => {
    expect(done(buildOnboardingSteps(2, [], []))).toEqual(['upload'])
  })

  it('marks the project step when there is a project', () => {
    expect(done(buildOnboardingSteps(0, [project], []))).toEqual(['project'])
  })

  it('counts only a live experience as published', () => {
    expect(done(buildOnboardingSteps(1, [project], [{ ...live, status: 'unpublished' }]))).toEqual([
      'upload',
      'project',
    ])
    expect(done(buildOnboardingSteps(1, [project], [live]))).toEqual(['upload', 'project', 'publish'])
  })
})