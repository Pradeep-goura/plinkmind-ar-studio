import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { Notice } from '../../components/ui/Notice'
import { isWebGLAvailable } from '../../lib/utils/webgl'


export default function ModelViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
    const webglOk = useMemo(() => isWebGLAvailable(), [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !webglOk) return
    let disposed = false

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000)
    camera.position.set(2.5, 1.8, 3.5)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 1.2))
    const sun = new THREE.DirectionalLight(0xffffff, 2)
    sun.position.set(3, 5, 4)
    scene.add(sun)
    scene.add(new THREE.GridHelper(10, 20, 0x888888, 0xcccccc))

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 0.8, 0)

    function resize() {
      const width = container!.clientWidth
      const height = Math.max(container!.clientHeight, 1)
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)

    const draco = new DRACOLoader()
    draco.setDecoderPath('/draco/gltf/')
    const loader = new GLTFLoader()
    loader.setDRACOLoader(draco)
    loader.setMeshoptDecoder(MeshoptDecoder)

    loader.load(
      url,
      (gltf) => {
        if (disposed) return
        const root = gltf.scene
        // Scale so the longest side is 2 units, centre it, and sit it on the grid.
        const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3())
        root.scale.setScalar(2 / (Math.max(size.x, size.y, size.z) || 1))
        const box = new THREE.Box3().setFromObject(root)
        const centre = box.getCenter(new THREE.Vector3())
        root.position.x -= centre.x
        root.position.z -= centre.z
        root.position.y -= box.min.y
        scene.add(root)
        setStatus('ready')
      },
      undefined,
      (error) => {
        console.error('Model load failed', error)
        if (!disposed) setStatus('error')
      },
    )

    renderer.setAnimationLoop(() => {
      controls.update()
      renderer.render(scene, camera)
    })

    return () => {
      disposed = true
      renderer.setAnimationLoop(null)
      observer.disconnect()
      controls.dispose()
      draco.dispose()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => material.dispose())
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [url, webglOk])

  if (!webglOk) {
    return (
      <Notice tone="warning" title="3D preview is not available">
        This browser or device cannot run WebGL, which the 3D preview needs.
      </Notice>
    )
  }

  return (
    <div>
      <div className="relative">
        <div
          ref={containerRef}
          role="img"
          aria-label="3D model preview"
          className="h-[360px] w-full overflow-hidden rounded-md bg-neutral-200"
        />
        {status === 'loading' && (
          <p role="status" className="absolute inset-0 grid place-items-center">
            Loading model...
          </p>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 grid place-items-center p-4">
            <Notice tone="error" title="Could not load this model">
              The file may be damaged or use a feature the viewer does not support yet.
            </Notice>
          </div>
        )}
      </div>
      <p className="mt-2 text-sm text-neutral-700">Drag to rotate, scroll or pinch to zoom.</p>
    </div>
  )
}