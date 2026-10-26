import { z } from 'zod'

export const CURRENT_SCHEMA_VERSION = 1
export const MAX_OBJECTS = 200

const coordinate = z.number().min(-10000).max(10000)
const degrees = z.number().min(-3600).max(3600)
const scaleValue = z.number().min(0.001).max(1000)

const baseFields = {
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  visible: z.boolean(),
}

const modelObjectSchema = z.object({
  ...baseFields,
  type: z.literal('model'),
  assetId: z.string().uuid(),
  position: z.tuple([coordinate, coordinate, coordinate]), // meters
  rotation: z.tuple([degrees, degrees, degrees]), // degrees
  scale: z.tuple([scaleValue, scaleValue, scaleValue]),
})

const audioObjectSchema = z.object({
  ...baseFields,
  type: z.literal('audio'),
  assetId: z.string().uuid(),
  volume: z.number().min(0).max(1),
  loop: z.boolean(),
})

export const sceneObjectSchema = z.discriminatedUnion('type', [modelObjectSchema, audioObjectSchema])

export const sceneSchema = z
  .object({
    schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
    objects: z.array(sceneObjectSchema).max(MAX_OBJECTS),
  })
  .refine((scene) => new Set(scene.objects.map((object) => object.id)).size === scene.objects.length, {
    message: 'Object ids must be unique',
  })

export type Scene = z.infer<typeof sceneSchema>
export type SceneObject = z.infer<typeof sceneObjectSchema>
export type ModelObject = z.infer<typeof modelObjectSchema>
export type AudioObject = z.infer<typeof audioObjectSchema>

export type ParseSceneResult = { ok: true; scene: Scene } | { ok: false; message: string }

// The one place where saved scene data is checked and, in future, upgraded.
export function parseScene(raw: unknown, schemaVersion: number): ParseSceneResult {
  if (schemaVersion > CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      message: 'This scene was saved by a newer version of Plinkmind AR Studio. Please update the app.',
    }
  }
  // Older versions would be upgraded here, one step at a time. Version 1 is the first one.
  const result = sceneSchema.safeParse(raw)
  if (!result.success) {
    return { ok: false, message: 'This scene data is not valid and could not be opened.' }
  }
  return { ok: true, scene: result.data }
}