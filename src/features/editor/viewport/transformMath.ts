export type Vec3 = [number, number, number]
export type ModelTransform = { position: Vec3; rotation: Vec3; scale: Vec3 }

const RADIANS_TO_DEGREES = 180 / Math.PI

// Limits match the scene schema. A test checks that they stay in sync.
function clean(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  const clamped = Math.min(max, Math.max(min, value))
  return Math.round(clamped * 1000) / 1000
}

function cleanVec(values: Vec3, min: number, max: number, fallback: number): Vec3 {
  return [
    clean(values[0], min, max, fallback),
    clean(values[1], min, max, fallback),
    clean(values[2], min, max, fallback),
  ]
}

// Turns what the 3D gizmo produced into values the scene schema accepts.
export function toSceneTransform(position: Vec3, rotationRadians: Vec3, scale: Vec3): ModelTransform {
  const rotationDegrees: Vec3 = [
    rotationRadians[0] * RADIANS_TO_DEGREES,
    rotationRadians[1] * RADIANS_TO_DEGREES,
    rotationRadians[2] * RADIANS_TO_DEGREES,
  ]
  return {
    position: cleanVec(position, -10000, 10000, 0),
    rotation: cleanVec(rotationDegrees, -3600, 3600, 0),
    scale: cleanVec(scale, 0.001, 1000, 1),
  }
}

export function toRadians(degrees: Vec3): Vec3 {
  return [
    degrees[0] / RADIANS_TO_DEGREES,
    degrees[1] / RADIANS_TO_DEGREES,
    degrees[2] / RADIANS_TO_DEGREES,
  ]
}