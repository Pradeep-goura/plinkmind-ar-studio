import { describe, expect, it } from 'vitest'
import {
  buildExperiencePath,
  buildExperienceUrl,
  isValidSlug,
} from '../../src/features/publishing/experienceUrl'

describe('isValidSlug', () => {
  it('accepts a typical slug', () => {
    expect(isValidSlug('a1b2c3d4e5f6')).toBe(true)
  })

  it('rejects uppercase letters, symbols and spaces', () => {
    expect(isValidSlug('A1B2C3D4E5F6')).toBe(false)
    expect(isValidSlug('a1b2c3d4-e5f6')).toBe(false)
    expect(isValidSlug('a1b2c3d4 e5f6')).toBe(false)
    expect(isValidSlug('../../secret')).toBe(false)
  })

  it('rejects slugs that are too short or too long', () => {
    expect(isValidSlug('abc123')).toBe(false)
    expect(isValidSlug('a'.repeat(33))).toBe(false)
  })
})

describe('experience URLs', () => {
  it('builds the public path', () => {
    expect(buildExperiencePath('a1b2c3d4e5f6')).toBe('/experience/a1b2c3d4e5f6')
  })

  it('builds a full URL', () => {
    expect(buildExperienceUrl('https://studio.example.com', 'a1b2c3d4e5f6')).toBe(
      'https://studio.example.com/experience/a1b2c3d4e5f6',
    )
  })

  it('ignores a trailing slash on the origin', () => {
    expect(buildExperienceUrl('https://studio.example.com/', 'a1b2c3d4e5f6')).toBe(
      'https://studio.example.com/experience/a1b2c3d4e5f6',
    )
  })
})