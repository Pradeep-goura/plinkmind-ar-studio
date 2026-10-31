export const AR_MAX_NATURAL_SIZE = 3 // meters
export const AR_MIN_NATURAL_SIZE = 0.02 // meters

// A model that is huge or tiny in real meters is resized to about 1 meter.
export function computeAutoFit(largestSide: number): { scale: number; fitted: boolean } {
  if (!Number.isFinite(largestSide) || largestSide <= 0) return { scale: 1, fitted: false }
  if (largestSide > AR_MAX_NATURAL_SIZE || largestSide < AR_MIN_NATURAL_SIZE) {
    return { scale: 1 / largestSide, fitted: true }
  }
  return { scale: 1, fitted: false }
}

export function clampUserScale(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(5, Math.max(0.1, value))
}