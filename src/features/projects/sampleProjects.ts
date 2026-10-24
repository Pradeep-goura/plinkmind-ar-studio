import type { Project } from '../../types/project'

// SAMPLE DATA ONLY. Real projects will come from Supabase in Phase 3.
export const sampleProjects: Project[] = [
  { id: 'sample-1', name: 'Sample: Sofa on your floor', status: 'draft', trackingMode: 'surface', updatedAt: '2026-10-20' },
  { id: 'sample-2', name: 'Sample: Museum poster target', status: 'published', trackingMode: 'image', updatedAt: '2026-10-18' },
  { id: 'sample-3', name: 'Sample: Plant pot viewer', status: 'published', trackingMode: 'surface', updatedAt: '2026-10-12' },
  { id: 'sample-4', name: 'Sample: Classroom heart model', status: 'draft', trackingMode: 'surface', updatedAt: '2026-10-05' },
]