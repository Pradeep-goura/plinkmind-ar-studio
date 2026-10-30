export type Platform = 'ios' | 'android' | 'other'

export function detectPlatform(userAgent: string, maxTouchPoints = 0): Platform {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios'
  // iPadOS 13 and later reports itself as a Mac, but has a touch screen.
  if (/Macintosh/i.test(userAgent) && maxTouchPoints > 1) return 'ios'
  if (/Android/i.test(userAgent)) return 'android'
  return 'other'
}

type XrNavigator = Navigator & {
  xr?: { isSessionSupported: (mode: string) => Promise<boolean> }
}

export async function checkImmersiveAr(): Promise<boolean> {
  try {
    const xr = (navigator as XrNavigator).xr
    if (!xr) return false
    return await xr.isSessionSupported('immersive-ar')
  } catch {
    return false
  }
}