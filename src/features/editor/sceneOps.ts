import { MAX_OBJECTS } from './sceneSchema'
import type { AudioObject, ModelObject, Scene, SceneObject } from './sceneSchema'

export type AssetRef = { id: string; originalName: string }

export function createEmptyScene(): Scene {
  return { schemaVersion: 1, objects: [] }
}

function displayName(asset: AssetRef, fallback: string): string {
  const withoutExtension = asset.originalName.replace(/\.[^.]+$/, '').trim()
  return (withoutExtension || fallback).slice(0, 100)
}

export function addModel(scene: Scene, asset: AssetRef, id: string): Scene {
  if (scene.objects.length >= MAX_OBJECTS) return scene
  const object: ModelObject = {
    id,
    type: 'model',
    name: displayName(asset, 'Model'),
    visible: true,
    assetId: asset.id,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  }
  return { ...scene, objects: [...scene.objects, object] }
}

export function addAudio(scene: Scene, asset: AssetRef, id: string): Scene {
  if (scene.objects.length >= MAX_OBJECTS) return scene
  const object: AudioObject = {
    id,
    type: 'audio',
    name: displayName(asset, 'Audio'),
    visible: true,
    assetId: asset.id,
    volume: 1,
    loop: false,
  }
  return { ...scene, objects: [...scene.objects, object] }
}

export function findObject(scene: Scene, id: string): SceneObject | undefined {
  return scene.objects.find((object) => object.id === id)
}

function mapObject(scene: Scene, id: string, change: (object: SceneObject) => SceneObject): Scene {
  return { ...scene, objects: scene.objects.map((object) => (object.id === id ? change(object) : object)) }
}

export function renameObject(scene: Scene, id: string, name: string): Scene {
  return mapObject(scene, id, (object) => ({ ...object, name }))
}

export function setVisible(scene: Scene, id: string, visible: boolean): Scene {
  return mapObject(scene, id, (object) => ({ ...object, visible }))
}

export function setTransform(
  scene: Scene,
  id: string,
  transform: Partial<Pick<ModelObject, 'position' | 'rotation' | 'scale'>>,
): Scene {
  return mapObject(scene, id, (object) => (object.type === 'model' ? { ...object, ...transform } : object))
}

export function setAudioSettings(
  scene: Scene,
  id: string,
  settings: Partial<Pick<AudioObject, 'volume' | 'loop'>>,
): Scene {
  return mapObject(scene, id, (object) => (object.type === 'audio' ? { ...object, ...settings } : object))
}

export function removeObject(scene: Scene, id: string): Scene {
  return { ...scene, objects: scene.objects.filter((object) => object.id !== id) }
}