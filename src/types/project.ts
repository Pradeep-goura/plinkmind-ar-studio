export type ProjectStatus = 'draft' | 'published'

export type TrackingMode = 'surface' | 'image'

export type Project = {
  id: string
  name: string
  status: ProjectStatus
  trackingMode: TrackingMode
  updatedAt: string
}