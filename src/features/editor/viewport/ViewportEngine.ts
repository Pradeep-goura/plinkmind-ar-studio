import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js'
import type { ModelObject } from '../sceneSchema'
import { toRadians, toSceneTransform } from './transformMath'
import type { ModelTransform, Vec3 } from './transformMath'

export type TransformMode = 'translate' | 'rotate' | 'scale'

type EngineCallbacks = {
  onSelect: (id: string | null) => void
  onTransformEnd: (id: string, transform: ModelTransform) => void
  onAssetFailed: (assetId: string) => void
  onSettled?: () => void
}

type EngineOptions = {
  maxPixelRatio?: number
  transparent?: boolean // no background colour: the page behind shows through
  showGrid?: boolean
  environment?: boolean // soft all-round lighting, for a more realistic look
  autoRotate?: boolean // slowly turns until the visitor touches it
}

type Entry = {
  id: string
  assetId: string
  group: THREE.Group
  placeholder: THREE.Mesh
  state: 'pending' | 'loading' | 'ready' | 'error'
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.geometry.dispose()
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      for (const material of materials) {
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) value.dispose()
        }
        material.dispose()
      }
    }
  })
}

// All Three.js work lives here, outside React, so nothing re-renders on every frame.
// It also draws only when something changed, which keeps phones cool.
export class ViewportEngine {
  private readonly container: HTMLElement
  private readonly callbacks: EngineCallbacks
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000)
  private readonly orbit: OrbitControls
  private readonly transform: TransformControls
  private readonly raycaster = new THREE.Raycaster()
  private readonly entries = new Map<string, Entry>()
  private readonly templates = new Map<string, Promise<THREE.Object3D>>()
  private readonly draco = new DRACOLoader()
  private readonly loader = new GLTFLoader()
  private readonly observer: ResizeObserver
  private readonly placeholderGeometry = new THREE.BoxGeometry(1, 1, 1)
  private readonly pendingMaterial = new THREE.MeshBasicMaterial({ color: 0x4f7cff, transparent: true, opacity: 0.3 })
  private readonly errorMaterial = new THREE.MeshBasicMaterial({ color: 0xd32f2f, transparent: true, opacity: 0.4 })
  private environmentTarget: THREE.WebGLRenderTarget | null = null
  private resumeTimer: number | undefined
  private pointerStart: { x: number; y: number } | null = null
  private needsRender = true
  private disposed = false

  constructor(container: HTMLElement, callbacks: EngineCallbacks, options: EngineOptions = {}) {
    this.container = container
    this.callbacks = callbacks

    const transparent = options.transparent ?? false
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: transparent })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, options.maxPixelRatio ?? 2))
    if (transparent) this.renderer.setClearColor(0x000000, 0)
    else this.renderer.setClearColor(0xe5e5e5)
    const canvas = this.renderer.domElement
    // The canvas always fills the container. Its own pixel size can never push the page wider.
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    container.appendChild(canvas)

    const lit = options.environment === true
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, lit ? 0.35 : 1.2))
    const sun = new THREE.DirectionalLight(0xffffff, lit ? 0.8 : 2)
    sun.position.set(3, 5, 4)
    this.scene.add(sun)
    if (options.showGrid ?? true) this.scene.add(new THREE.GridHelper(20, 40, 0x888888, 0xcccccc))
    if (lit) this.addEnvironment()

    this.orbit = new OrbitControls(this.camera, canvas)
    this.orbit.enableDamping = true
    this.orbit.addEventListener('change', () => this.requestRender())
    if (options.autoRotate) this.enableAutoRotate()
    this.resetView()

    this.transform = new TransformControls(this.camera, canvas)
    this.scene.add(this.transform.getHelper())
    this.transform.addEventListener('change', () => this.requestRender())
    this.transform.addEventListener('dragging-changed', (event) => {
      const dragging = Boolean(event.value)
      this.orbit.enabled = !dragging
      if (!dragging) this.commitTransform()
    })

    this.draco.setDecoderPath('/draco/gltf/')
    this.loader.setDRACOLoader(this.draco)
    this.loader.setMeshoptDecoder(MeshoptDecoder)

    canvas.addEventListener('pointerdown', this.handlePointerDown)
    canvas.addEventListener('pointerup', this.handlePointerUp)

    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(container)
    this.resize()

    this.renderer.setAnimationLoop(() => {
      const moved = this.orbit.update()
      if (!this.needsRender && !moved) return
      this.needsRender = false
      this.renderer.render(this.scene, this.camera)
    })
  }

  private addEnvironment() {
    const generator = new THREE.PMREMGenerator(this.renderer)
    const room = new RoomEnvironment()
    this.environmentTarget = generator.fromScene(room, 0.04)
    this.scene.environment = this.environmentTarget.texture
    room.dispose()
    generator.dispose()
  }

  // Turns slowly. A touch stops it, and it starts again after 3 quiet seconds.
  private enableAutoRotate() {
    this.orbit.autoRotate = true
    this.orbit.autoRotateSpeed = 1.5
    this.orbit.addEventListener('start', () => {
      this.orbit.autoRotate = false
      window.clearTimeout(this.resumeTimer)
    })
    this.orbit.addEventListener('end', () => {
      window.clearTimeout(this.resumeTimer)
      this.resumeTimer = window.setTimeout(() => {
        this.orbit.autoRotate = true
      }, 3000)
    })
  }

  requestRender() {
    this.needsRender = true
  }

  private resize() {
    const width = Math.max(this.container.clientWidth, 1)
    const height = Math.max(this.container.clientHeight, 1)
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.requestRender()
  }

  private readonly handlePointerDown = (event: PointerEvent) => {
    // A press on the gizmo is a drag, not a selection click.
    if (event.button !== 0 || this.transform.dragging || this.transform.axis !== null) {
      this.pointerStart = null
      return
    }
    this.pointerStart = { x: event.clientX, y: event.clientY }
  }

  private readonly handlePointerUp = (event: PointerEvent) => {
    const start = this.pointerStart
    this.pointerStart = null
    if (!start || event.button !== 0) return
    // If the pointer moved, the user was orbiting the camera, not clicking.
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 4) return
    this.pick(event)
  }

  private pick(event: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const pointer = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
    this.raycaster.setFromCamera(pointer, this.camera)
    const groups = [...this.entries.values()].filter((entry) => entry.group.visible).map((entry) => entry.group)
    const hit = this.raycaster.intersectObjects(groups, true)[0]
    this.callbacks.onSelect(hit ? this.findObjectId(hit.object) : null)
  }

  private findObjectId(object: THREE.Object3D): string | null {
    let node: THREE.Object3D | null = object
    while (node) {
      const id: unknown = node.userData.objectId
      if (typeof id === 'string') return id
      node = node.parent
    }
    return null
  }

  private commitTransform() {
    const group = this.transform.object
    if (!group) return
    const id: unknown = group.userData.objectId
    if (typeof id !== 'string') return
    const position: Vec3 = [group.position.x, group.position.y, group.position.z]
    const rotation: Vec3 = [group.rotation.x, group.rotation.y, group.rotation.z]
    const scale: Vec3 = [group.scale.x, group.scale.y, group.scale.z]
    this.callbacks.onTransformEnd(id, toSceneTransform(position, rotation, scale))
  }

  private applyTransform(group: THREE.Group, object: ModelObject) {
    group.position.set(...object.position)
    const rotation = toRadians(object.rotation)
    group.rotation.set(rotation[0], rotation[1], rotation[2])
    group.scale.set(...object.scale)
  }

  private createEntry(object: ModelObject): Entry {
    const group = new THREE.Group()
    group.userData.objectId = object.id
    const placeholder = new THREE.Mesh(this.placeholderGeometry, this.pendingMaterial)
    placeholder.position.y = 0.5
    group.add(placeholder)
    this.scene.add(group)
    return { id: object.id, assetId: object.assetId, group, placeholder, state: 'pending' }
  }

  private getTemplate(assetId: string, url: string): Promise<THREE.Object3D> {
    let template = this.templates.get(assetId)
    if (!template) {
      template = this.loader.loadAsync(url).then((gltf) => gltf.scene)
      this.templates.set(assetId, template)
    }
    return template
  }

  private markError(entry: Entry) {
    entry.state = 'error'
    entry.placeholder.material = this.errorMaterial
    this.requestRender()
  }

  // Tells the page when every model has either loaded or failed.
  private notifyIfSettled() {
    if (this.disposed) return
    for (const entry of this.entries.values()) {
      if (entry.state === 'pending' || entry.state === 'loading') return
    }
    this.callbacks.onSettled?.()
  }

  private startLoad(entry: Entry, url: string) {
    entry.state = 'loading'
    this.getTemplate(entry.assetId, url)
      .then((template) => {
        if (this.disposed || this.entries.get(entry.id) !== entry) return
        entry.group.remove(entry.placeholder)
        entry.group.add(SkeletonUtils.clone(template))
        entry.state = 'ready'
        this.requestRender()
        this.notifyIfSettled()
      })
      .catch((error: unknown) => {
        console.error('Model load failed', error)
        if (this.disposed) return
        this.markError(entry)
        this.callbacks.onAssetFailed(entry.assetId)
        this.notifyIfSettled()
      })
  }

  syncObjects(objects: ModelObject[], urls: ReadonlyMap<string, string>, missing: ReadonlySet<string>) {
    const keep = new Set<string>()

    for (const object of objects) {
      keep.add(object.id)
      const entry = this.entries.get(object.id) ?? this.createEntry(object)
      this.entries.set(object.id, entry)

      // Do not fight the user while they are dragging this very object.
      const beingDragged = this.transform.dragging && this.transform.object === entry.group
      if (!beingDragged) this.applyTransform(entry.group, object)

      entry.group.visible = object.visible
      if (!object.visible && this.transform.object === entry.group) this.transform.detach()

      if (entry.state === 'pending') {
        const url = urls.get(object.assetId)
        if (url) this.startLoad(entry, url)
        else if (missing.has(object.assetId)) this.markError(entry)
      }
    }

    for (const [id, entry] of this.entries) {
      if (keep.has(id)) continue
      if (this.transform.object === entry.group) this.transform.detach()
      this.scene.remove(entry.group)
      this.entries.delete(id)
    }

    this.requestRender()
    this.notifyIfSettled()
  }

  setSelected(id: string | null) {
    const entry = id ? this.entries.get(id) : undefined
    if (entry && entry.group.visible) this.transform.attach(entry.group)
    else this.transform.detach()
    this.requestRender()
  }

  setMode(mode: TransformMode) {
    this.transform.setMode(mode)
    this.requestRender()
  }

  setSnap(enabled: boolean) {
    this.transform.setTranslationSnap(enabled ? 0.1 : null)
    this.transform.setRotationSnap(enabled ? THREE.MathUtils.degToRad(15) : null)
    this.transform.setScaleSnap(enabled ? 0.1 : null)
  }

  resetView() {
    this.camera.near = 0.01
    this.camera.far = 1000
    this.camera.updateProjectionMatrix()
    this.camera.position.set(4, 3, 5)
    this.orbit.target.set(0, 0.5, 0)
    this.orbit.update()
    this.requestRender()
  }

  // Moves the camera to fit the selected object, or everything when nothing is selected.
  frame(selectedId: string | null) {
    const box = new THREE.Box3()
    const selected = selectedId ? this.entries.get(selectedId) : undefined
    if (selected) {
      box.setFromObject(selected.group)
    } else {
      for (const entry of this.entries.values()) {
        if (entry.group.visible) box.expandByObject(entry.group)
      }
    }
    if (box.isEmpty()) {
      this.resetView()
      return
    }

    const size = box.getSize(new THREE.Vector3())
    const centre = box.getCenter(new THREE.Vector3())
    const radius = Math.max(size.x, size.y, size.z, 0.001) / 2
    const distance = (radius / Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2)) * 1.6

    const direction = this.camera.position.clone().sub(this.orbit.target).normalize()
    this.orbit.target.copy(centre)
    this.camera.position.copy(centre).addScaledVector(direction, distance)
    this.camera.near = Math.max(distance / 100, 0.001)
    this.camera.far = Math.max(distance * 100, 100)
    this.camera.updateProjectionMatrix()
    this.orbit.update()
    this.requestRender()
  }

  dispose() {
    this.disposed = true
    window.clearTimeout(this.resumeTimer)
    this.renderer.setAnimationLoop(null)
    this.observer.disconnect()
    const canvas = this.renderer.domElement
    canvas.removeEventListener('pointerdown', this.handlePointerDown)
    canvas.removeEventListener('pointerup', this.handlePointerUp)
    this.transform.detach()
    this.transform.dispose()
    this.orbit.dispose()
    this.templates.forEach((template) => {
      void template.then(disposeObject).catch(() => undefined)
    })
    this.placeholderGeometry.dispose()
    this.pendingMaterial.dispose()
    this.errorMaterial.dispose()
    this.environmentTarget?.dispose()
    this.draco.dispose()
    this.renderer.dispose()
    canvas.remove()
  }
}