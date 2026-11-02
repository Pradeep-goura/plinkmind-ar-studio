import { describe, expect, it } from 'vitest'
import { HERO_AUTO_LOAD_LIMIT_BYTES, shouldAutoLoadHero } from '../../src/features/publishing/heroPolicy'

const base = {
  totalModelBytes: 2 * 1024 * 1024,
  isWideScreen: true,
  saveData: false,
  deviceMemoryGb: 8,
}

describe('shouldAutoLoadHero', () => {
  it('loads by itself on a wide screen with a small model', () => {
    expect(shouldAutoLoadHero(base)).toBe(true)
  })

  it('waits for a tap on a narrow (phone) screen', () => {
    expect(shouldAutoLoadHero({ ...base, isWideScreen: false })).toBe(false)
  })

  it('waits for a tap when data saver is on', () => {
    expect(shouldAutoLoadHero({ ...base, saveData: true })).toBe(false)
  })

  it('waits for a tap on a device with little memory', () => {
    expect(shouldAutoLoadHero({ ...base, deviceMemoryGb: 2 })).toBe(false)
  })

  it('still loads when the browser does not report memory', () => {
    expect(shouldAutoLoadHero({ ...base, deviceMemoryGb: undefined })).toBe(true)
  })

  it('waits for a tap when the models are larger than the limit', () => {
    expect(shouldAutoLoadHero({ ...base, totalModelBytes: HERO_AUTO_LOAD_LIMIT_BYTES + 1 })).toBe(false)
    expect(shouldAutoLoadHero({ ...base, totalModelBytes: HERO_AUTO_LOAD_LIMIT_BYTES })).toBe(true)
  })
})