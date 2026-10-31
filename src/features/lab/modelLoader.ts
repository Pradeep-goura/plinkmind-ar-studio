import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export function createModelLoader() {
  const draco = new DRACOLoader()
  draco.setDecoderPath('/draco/gltf/')
  const loader = new GLTFLoader()
  loader.setDRACOLoader(draco)
  loader.setMeshoptDecoder(MeshoptDecoder)
  return { loader, dispose: () => draco.dispose() }
}