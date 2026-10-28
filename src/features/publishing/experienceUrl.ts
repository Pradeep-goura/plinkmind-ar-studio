export const SLUG_PATTERN = /^[a-z0-9]{8,32}$/

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug)
}

export function buildExperiencePath(slug: string): string {
  return `/experience/${slug}`
}

export function buildExperienceUrl(origin: string, slug: string): string {
  return `${origin.replace(/\/+$/, '')}${buildExperiencePath(slug)}`
}