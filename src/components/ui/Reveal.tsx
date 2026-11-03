import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

// Fades a block in once, when it first scrolls into view. Shown at once if the visitor
// prefers less motion or the browser cannot watch scrolling.
export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(
    () => typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const element = ref.current
    if (!element || shown) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [shown])

  return (
    <div
      ref={ref}
      className={`transition duration-700 ease-out motion-reduce:transition-none ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}