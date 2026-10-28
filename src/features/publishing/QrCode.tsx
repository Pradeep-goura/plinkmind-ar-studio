import { useEffect, useMemo, useRef } from 'react'
import { Button } from '../../components/ui/Button'
import { createQrMatrix, drawQr } from './qr'

type QrCodeProps = { text: string; filename: string }

export function QrCode({ text, filename }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const matrix = useMemo(() => createQrMatrix(text), [text])

  useEffect(() => {
    if (canvasRef.current) drawQr(canvasRef.current, matrix)
  }, [matrix])

  function download() {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    }, 'image/png')
  }

  return (
    <div className="mt-3">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`QR code for ${text}`}
        className="h-auto w-full max-w-[220px] rounded-md border border-neutral-300"
      />
      <Button variant="outline" className="mt-2" onClick={download}>
        Download QR (PNG)
      </Button>
    </div>
  )
}