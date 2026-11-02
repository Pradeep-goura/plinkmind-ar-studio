import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PlinkmindMark } from '../components/layout/PlinkmindMark'
import { Button } from '../components/ui/Button'
import { describeError, formatReport, withTimeout } from '../features/diagnostics/report'
import type { ReportLine } from '../features/diagnostics/report'
import { checkImmersiveAr, detectInAppBrowser, detectPlatform } from '../features/publishing/environment'
import { isValidSlug } from '../features/publishing/experienceUrl'
import { createPublicAssetUrls, getPublicExperience } from '../features/publishing/publicApi'

function canPlay(type: string): string {
  return document.createElement('audio').canPlayType(type) || 'no'
}

function deviceLines(): ReportLine[] {
  const nav = navigator as Navigator & { deviceMemory?: number }
  return [
    { label: 'Time', value: new Date().toISOString() },
    { label: 'Page', value: window.location.origin },
    { label: 'Secure connection (HTTPS)', value: String(window.isSecureContext) },
    { label: 'Platform', value: detectPlatform(navigator.userAgent, navigator.maxTouchPoints) },
    { label: 'Opened inside another app', value: detectInAppBrowser(navigator.userAgent) ?? 'no' },
    {
      label: 'Screen',
      value: `${window.screen.width}x${window.screen.height}, pixel ratio ${window.devicePixelRatio}`,
    },
    {
      label: 'Device memory in GB (approximate)',
      value: nav.deviceMemory === undefined ? 'not reported' : String(nav.deviceMemory),
    },
    { label: 'CPU cores', value: String(navigator.hardwareConcurrency ?? 'not reported') },
    { label: 'MP3 audio', value: canPlay('audio/mpeg') },
    { label: 'OGG audio', value: canPlay('audio/ogg; codecs="vorbis"') },
    { label: 'User agent', value: navigator.userAgent },
  ]
}

function webglLines(): ReportLine[] {
  try {
    const canvas = document.createElement('canvas')
    const gl2 = canvas.getContext('webgl2')
    const gl = gl2 ?? canvas.getContext('webgl')
    if (!gl) return [{ label: 'WebGL', value: 'NOT AVAILABLE' }]

    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const lines: ReportLine[] = [
      { label: 'WebGL', value: gl2 ? 'WebGL 2' : 'WebGL 1 only' },
      {
        label: 'Graphics chip',
        value: info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : 'hidden by the browser',
      },
      { label: 'Max texture size', value: String(gl.getParameter(gl.MAX_TEXTURE_SIZE)) },
    ]
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return lines
  } catch (error) {
    return [{ label: 'WebGL', value: `error - ${describeError(error)}` }]
  }
}

async function networkLines(slug: string | null): Promise<ReportLine[]> {
  const lines: ReportLine[] = []
  lines.push({ label: 'WebXR AR available', value: (await checkImmersiveAr()) ? 'yes' : 'no' })

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
  if (!url || !key) {
    lines.push({ label: 'Supabase set up in this build', value: 'NO (settings missing)' })
    return lines
  }

  lines.push({ label: 'Supabase host', value: new URL(url).host })
  try {
    const started = performance.now()
    const response = await withTimeout(fetch(`${url}/auth/v1/health`, { headers: { apikey: key } }), 8000)
    lines.push({
      label: 'Supabase reachable',
      value: `YES (HTTP ${response.status}, ${Math.round(performance.now() - started)} ms)`,
    })
  } catch (error) {
    lines.push({
      label: 'Supabase reachable',
      value: `NO - ${describeError(error)}. Some networks block or slow supabase.co.`,
    })
    return lines
  }

  if (!slug) {
    lines.push({ label: 'Experience test', value: 'skipped (add ?slug=YOUR-SLUG to the address)' })
    return lines
  }

  try {
    const result = await withTimeout(getPublicExperience(slug), 10000)
    if (result.status !== 'ok') {
      lines.push({ label: 'Experience test', value: `result: ${result.status}` })
      return lines
    }
    lines.push({
      label: 'Experience test',
      value: `OK, "${result.experience.title}", ${result.experience.assets.length} file(s)`,
    })
    const { urls, failed } = await withTimeout(createPublicAssetUrls(result.experience.assets), 10000)
    lines.push({ label: 'File links', value: `${urls.size} created, ${failed.size} failed` })
  } catch (error) {
    lines.push({ label: 'Experience test', value: `FAILED - ${describeError(error)}` })
  }
  return lines
}

export function DiagnosticsPage() {
  const [params] = useSearchParams()
  const slugParam = params.get('slug')
  const slug = slugParam && isValidSlug(slugParam) ? slugParam : null
  const deviceInfo = useMemo(() => [...deviceLines(), ...webglLines()], [])
  const [network, setNetwork] = useState<ReportLine[] | null>(null)
  const [copyMessage, setCopyMessage] = useState('')

  useEffect(() => {
    let ignore = false
    void networkLines(slug).then((lines) => {
      if (!ignore) setNetwork(lines)
    })
    return () => {
      ignore = true
    }
  }, [slug])

  const report = formatReport(network ? [...deviceInfo, ...network] : deviceInfo)

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report)
      setCopyMessage('Copied.')
    } catch {
      setCopyMessage('Could not copy. Select the text and copy it by hand.')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
        <PlinkmindMark />
        <span className="text-xl font-light tracking-tight">Plinkmind</span>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-4 pb-12">
        <h1 className="text-2xl font-semibold">Device check report</h1>
        <p className="text-sm">
          This page tests your phone and network. It shows the result here and does not send it
          anywhere. Take a screenshot or copy the text and send it to the Plinkmind team.
        </p>
        {!network && <p role="status" className="text-sm font-medium">Running network checks...</p>}
        <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-card bg-brand-paper p-4 text-xs">
          {report}
        </pre>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void copyReport()}>Copy report</Button>
          <span role="status" className="text-sm">{copyMessage}</span>
        </div>
      </main>
    </div>
  )
}