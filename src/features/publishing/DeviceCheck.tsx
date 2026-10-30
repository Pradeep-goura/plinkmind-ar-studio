import { useEffect, useMemo, useState } from 'react'
import { isWebGLAvailable } from '../../lib/utils/webgl'
import { checkImmersiveAr, detectPlatform } from './environment'

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No'
}

export function DeviceCheck() {
  const [webxr, setWebxr] = useState<'checking' | 'yes' | 'no'>('checking')
  const platform = useMemo(() => detectPlatform(navigator.userAgent, navigator.maxTouchPoints), [])
  const webgl = useMemo(() => isWebGLAvailable(), [])
  const secure = window.isSecureContext

  useEffect(() => {
    let ignore = false
    void checkImmersiveAr().then((supported) => {
      if (!ignore) setWebxr(supported ? 'yes' : 'no')
    })
    return () => {
      ignore = true
    }
  }, [])

  return (
    <details className="rounded-card bg-brand-paper p-4">
      <summary className="cursor-pointer font-semibold">Device check</summary>
      <ul className="mt-3 space-y-1 text-sm">
        <li>Secure connection (HTTPS): <strong>{yesNo(secure)}</strong></li>
        <li>3D graphics (WebGL): <strong>{yesNo(webgl)}</strong></li>
        <li>
          WebXR AR in this browser:{' '}
          <strong>{webxr === 'checking' ? 'Checking...' : webxr === 'yes' ? 'Yes' : 'No'}</strong>
        </li>
      </ul>
      <p className="mt-3 text-sm">
        {platform === 'ios' &&
          "iPhones and iPads open AR in Apple's AR Quick Look, usually from Safari. The WebXR line above does not apply to them."}
        {platform === 'android' &&
          'On Android, AR works through Chrome with Google Play Services for AR (Scene Viewer or WebXR).'}
        {platform === 'other' &&
          'AR needs a phone or tablet. On a computer you can still look at the model in 3D.'}
      </p>
      <p className="mt-2 text-xs text-neutral-700">
        AR support differs between devices and browsers. Plinkmind AR Studio has not finished
        testing on real devices yet, so some phones may not work.
      </p>
    </details>
  )
}