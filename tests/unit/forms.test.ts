import { describe, expect, it } from 'vitest'
import {
  projectNameSchema,
  registerSchema,
  signInSchema,
} from '../../src/lib/validation/forms'

describe('projectNameSchema', () => {
  it('trims spaces around a valid name', () => {
    expect(projectNameSchema.parse('  My Sofa  ')).toBe('My Sofa')
  })

  it('rejects an empty or spaces-only name', () => {
    expect(projectNameSchema.safeParse('').success).toBe(false)
    expect(projectNameSchema.safeParse('   ').success).toBe(false)
  })

  it('accepts 100 characters and rejects 101', () => {
    expect(projectNameSchema.safeParse('a'.repeat(100)).success).toBe(true)
    expect(projectNameSchema.safeParse('a'.repeat(101)).success).toBe(false)
  })
})

describe('registerSchema', () => {
  const valid = {
    name: 'Pradeep',
    email: 'user@example.com',
    password: 'longenough1',
    confirm: 'longenough1',
  }

  it('accepts a valid registration', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects passwords that do not match', () => {
    const result = registerSchema.safeParse({ ...valid, confirm: 'different123' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['confirm'])
  })

  it('rejects a password shorter than 8 characters', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'short', confirm: 'short' }).success).toBe(false)
  })

  it('rejects an invalid email', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false)
  })
})

describe('signInSchema', () => {
  it('accepts an email and a password', () => {
    expect(signInSchema.safeParse({ email: 'user@example.com', password: 'x' }).success).toBe(true)
  })

  it('rejects an empty password', () => {
    expect(signInSchema.safeParse({ email: 'user@example.com', password: '' }).success).toBe(false)
  })
})