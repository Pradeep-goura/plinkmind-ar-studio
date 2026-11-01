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
// Returns the name of the app when the page is opened inside another app's browser.
export function detectInAppBrowser(userAgent: string): string | null {
  if (/Instagram/i.test(userAgent)) return 'Instagram'
  if (/FBAN|FBAV|FB_IAB/i.test(userAgent)) return 'Facebook'
  if (/Snapchat/i.test(userAgent)) return 'Snapchat'
  if (/TikTok|musical_ly|BytedanceWebview/i.test(userAgent)) return 'TikTok'
  if (/LinkedInApp/i.test(userAgent)) return 'LinkedIn'
  if (/MicroMessenger/i.test(userAgent)) return 'WeChat'
  if (/Line\//i.test(userAgent)) return 'LINE'
  if (/\bGSA\//i.test(userAgent)) return 'the Google app'
  if (/; wv\)/i.test(userAgent)) return 'another app'
  return null
}