import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import type { AudioItem } from './viewData'

function canPlayOgg(): boolean {
  return document.createElement('audio').canPlayType('audio/ogg; codecs="vorbis"') !== ''
}

function isOggUrl(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith('.ogg')
  } catch {
    return false
  }
}

function describeError(audio: HTMLAudioElement): string {
  switch (audio.error?.code) {
    case 4:
      return 'This device cannot play this audio format. MP3 works on all phones; OGG often does not work on iPhone.'
    case 2:
      return 'The sound could not be downloaded. Check your connection.'
    case 3:
      return 'The sound file could not be decoded.'
    default:
      return 'The sound could not be played.'
  }
}

function release(ref: { current: HTMLAudioElement[] }) {
  for (const audio of ref.current) {
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
  }
  ref.current = []
}

export function AudioControls({ items }: { items: AudioItem[] }) {
  const elementsRef = useRef<HTMLAudioElement[]>([])
  const [playing, setPlaying] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    return () => release(elementsRef)
  }, [items])

  // Created inside the tap itself. iPhones only allow sound that starts from a tap.
  function ensureElements(): HTMLAudioElement[] {
    if (elementsRef.current.length > 0) return elementsRef.current

    const supportsOgg = canPlayOgg()
    const elements: HTMLAudioElement[] = []
    for (const item of items) {
      if (isOggUrl(item.url) && !supportsOgg) continue
      const audio = new Audio()
      audio.preload = 'auto'
      audio.loop = item.loop
      audio.volume = item.volume
      audio.src = item.url
      audio.addEventListener('ended', () => {
        if (elements.every((other) => other.paused || other.ended)) setPlaying(false)
      })
      audio.addEventListener('error', () => setMessage(describeError(audio)))
      elements.push(audio)
    }
    elementsRef.current = elements
    return elements
  }

  async function toggle() {
    setMessage('')
    const elements = ensureElements()

    if (playing) {
      elements.forEach((audio) => audio.pause())
      setPlaying(false)
      return
    }
    if (elements.length === 0) {
      setMessage(
        'This device cannot play the audio format used here. MP3 works on all phones; OGG often does not work on iPhone.',
      )
      return
    }

    const results = await Promise.allSettled(elements.map((audio) => audio.play()))
    const failed = results.filter((result) => result.status === 'rejected').length
    if (failed === results.length) {
      elements.forEach((audio) => audio.pause())
      setMessage('The browser did not start the sound. Tap the button again and check the phone volume.')
      return
    }
    if (failed > 0) setMessage('Some sounds could not start.')
    setPlaying(true)
  }

  if (items.length === 0) return null

  return (
    <section aria-labelledby="sound-heading" className="rounded-card bg-brand-paper p-4">
      <h2 id="sound-heading" className="text-lg font-semibold">Sound</h2>
      <p className="mt-1 text-sm">{items.map((item) => item.name).join(', ')}</p>
      <Button className="mt-3" aria-pressed={playing} onClick={() => void toggle()}>
        {playing ? 'Pause sound' : 'Play sound'}
      </Button>
      <p role="status" className="mt-2 text-sm">{message}</p>
    </section>
  )
}