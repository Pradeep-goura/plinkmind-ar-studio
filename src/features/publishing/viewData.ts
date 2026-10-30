import type { ModelObject, Scene } from '../editor/sceneSchema'

export type AudioItem = { id: string; name: string; url: string; volume: number; loop: boolean }
export type ArModel = { url: string; name: string }

export type ViewData = {
  models: ModelObject[]
  missing: Set<string>
  audioItems: AudioItem[]
  arModel: ArModel | null
}

// Everything the public page needs, worked out once when the experience loads.
export function buildViewData(
  scene: Scene,
  urls: ReadonlyMap<string, string>,
  failed: ReadonlySet<string>,
): ViewData {
  const models: ModelObject[] = []
  const audioItems: AudioItem[] = []
  const missing = new Set<string>(failed)
  let arModel: ArModel | null = null

  for (const object of scene.objects) {
    if (object.type === 'model') {
      models.push(object)
      const url = urls.get(object.assetId)
      if (!url) missing.add(object.assetId)
      else if (object.visible && arModel === null) arModel = { url, name: object.name }
    } else if (object.visible) {
      const url = urls.get(object.assetId)
      if (url) {
        audioItems.push({ id: object.id, name: object.name, url, volume: object.volume, loop: object.loop })
      }
    }
  }

  return { models, missing, audioItems, arModel }
}