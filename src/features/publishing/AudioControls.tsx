import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import type { AudioItem } from './viewData'


export function AudioControls({ items }: { items: AudioItem[] }) {
  const elementsRef = useRef<HTMLAudioElement[]>([])
  const [playing, setPlaying] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const elements = items.map((item) => {
      const audio = new Audio()
      audio.src = item.url
      audio.preload = 'none'
      audio.loop = item.loop
      audio.volume = item.volume
      audio.addEventListener('ended', () => {
        if (elements.every((other) => other.paused || other.ended)) setPlaying(false)
      })
      return audio
    })
    elementsRef.current = elements

    return () => {
      for (const audio of elements) {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      }
      elementsRef.current = []
    }
  }, [items])

  async function toggle() {
    setMessage('')
    if (playing) {
      elementsRef.current.forEach((audio) => audio.pause())
      setPlaying(false)
      return
    }
    try {
      await Promise.all(elementsRef.current.map((audio) => audio.play()))
      setPlaying(true)
    } catch {
      elementsRef.current.forEach((audio) => audio.pause())
      setMessage('Your browser did not allow the sound to start. Tap the button again.')
    }
  }

  if (items.length === 0) return null

  return (
    <section aria-labelledby="sound-heading" className="rounded-card bg-brand-paper p-4">
      <h2 id="sound-heading" className="text-lg font-semibold">Sound</h2>
      <p className="mt-1 text-sm">
        {items.map((item) => item.name).join(', ')}
      </p>
      <Button className="mt-3" aria-pressed={playing} onClick={() => void toggle()}>
        {playing ? 'Pause sound' : 'Play sound'}
      </Button>
      <p role="status" className="mt-2 text-sm">{message}</p>
    </section>
  )
}