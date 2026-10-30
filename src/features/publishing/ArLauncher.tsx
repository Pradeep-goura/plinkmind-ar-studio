import '@google/model-viewer'
import { useEffect, useRef, useState } from 'react'
import { Notice } from '../../components/ui/Notice'

type ArLauncherProps = { src: string; alt: string }

// Uses Google's <model-viewer> for AR: WebXR, Scene Viewer (Android) or Quick Look (iPhone).
// The element is created in code so no special JSX typing is needed.
export default function ArLauncher({ src, alt }: ArLauncherProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [problem, setProblem] = useState('')

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const viewer = document.createElement('model-viewer')
    viewer.setAttribute('src', src)
    viewer.setAttribute('alt', alt)
    viewer.setAttribute('ar', '')
    viewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look')
    viewer.setAttribute('camera-controls', '')
    viewer.setAttribute('touch-action', 'pan-y')
    viewer.setAttribute('shadow-intensity', '1')
    viewer.style.cssText = 'display:block;width:100%;height:300px;background:#e5e5e5;border-radius:6px;'

    // model-viewer shows this button only on devices that can start AR.
    const button = document.createElement('button')
    button.setAttribute('slot', 'ar-button')
    button.type = 'button'
    button.textContent = 'View in AR'
    button.style.cssText =
      'position:absolute;bottom:12px;right:12px;padding:10px 16px;border:0;border-radius:6px;' +
      'background:#0b0b0c;color:#ffffff;font-size:14px;font-weight:600;cursor:pointer;'
    viewer.appendChild(button)

    viewer.addEventListener('error', () => {
      setProblem('The model could not be prepared for AR.')
    })
    viewer.addEventListener('ar-status', (event) => {
      const status = (event as CustomEvent<{ status?: string }>).detail?.status
      if (status === 'failed') setProblem('AR could not start on this device or browser.')
      else if (status === 'session-started') setProblem('')
    })

    host.appendChild(viewer)
    return () => {
      viewer.remove()
    }
  }, [src, alt])

  return (
    <div>
      <div ref={hostRef} />
      {problem && (
        <div className="mt-2">
          <Notice tone="warning">{problem}</Notice>
        </div>
      )}
      <p className="mt-2 text-sm">
        If no "View in AR" button appears on the model, this device or browser cannot start AR.
      </p>
    </div>
  )
}