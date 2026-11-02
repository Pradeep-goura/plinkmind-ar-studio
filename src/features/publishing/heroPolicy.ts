// The 3D model in the page header starts by itself only where a phone or computer can
// carry it. Everywhere else the visitor taps a button first.
export const HERO_AUTO_LOAD_LIMIT_BYTES = 8 * 1024 * 1024

export type HeroInputs = {
  totalModelBytes: number
  isWideScreen: boolean
  saveData: boolean
  deviceMemoryGb: number | undefined // only some browsers report this
}

export function shouldAutoLoadHero(input: HeroInputs): boolean {
  if (!input.isWideScreen || input.saveData) return false
  if (input.deviceMemoryGb !== undefined && input.deviceMemoryGb < 4) return false
  return input.totalModelBytes <= HERO_AUTO_LOAD_LIMIT_BYTES
}