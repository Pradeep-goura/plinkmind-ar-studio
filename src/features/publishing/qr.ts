import encodeQR from 'qr'

// true = dark module. The text is encoded exactly as given.
export function createQrMatrix(text: string): boolean[][] {
  const raw = encodeQR(text, 'raw', { ecc: 'high' })
  return raw.map((row) => row.map((cell) => Boolean(cell)))
}

// Draws the matrix with a 4-module white border (the "quiet zone" scanners need).
export function drawQr(canvas: HTMLCanvasElement, matrix: boolean[][], moduleSize = 8, quiet = 4) {
  const size = (matrix.length + quiet * 2) * moduleSize
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) return

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, size, size)
  context.fillStyle = '#000000'
  matrix.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) context.fillRect((x + quiet) * moduleSize, (y + quiet) * moduleSize, moduleSize, moduleSize)
    })
  })
}