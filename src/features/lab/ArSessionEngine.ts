/// <reference types="webxr" />
import * as THREE from 'three'
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js'
import type { ModelObject } from '../editor/sceneSchema'
import { toRadians } from '../editor/viewport/transformMath'
import { clampUserScale, computeAutoFit } from './arMath'
import { createModelLoader } from './modelLoader'

export type ArPhase = 'idle' | 'searching' | 'aiming' | 'placed'
export type ArLoadResult = { loaded: number; failed: number; autoFitted: boolean }

type ArCallbacks = { onPhase: (phase: ArPhase) => void }

// Anchors are optional and not in every phone, so they are described here and checked at run time.
type AnchorLike = { anchorSpace: XRSpace; delete: () => void }
type AnchorHit = { createAnchor?: () => Promise<AnchorLike> }

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

// Experimental WebXR "place the whole scene on a surface" player.
// All Three.js and WebXR work lives here, outside React.
export class ArSessionEngine {
  private readonly callbacks: ArCallbacks
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera()
  private readonly content = new THREE.Group()
  private readonly models = new THREE.Group()
  private readonly reticleGeometry = new THREE.RingGeometry(0.12, 0.16, 32).rotateX(-Math.PI / 2)
  private readonly reticleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
  private readonly reticle: THREE.Mesh
  private readonly modelLoader = createModelLoader()
  private session: XRSession | null = null
  private hitTestSource: XRHitTestSource | null = null
  private lastHit: XRHitTestResult | null = null
  private anchor: AnchorLike | null = null
  private phase: ArPhase = 'idle'
  private placed = false
  private baseScale = 1
  private userScale = 1
  private yawDegrees = 0
  private disposed = false

  constructor(callbacks: ArCallbacks) {
    this.callbacks = callbacks

    // No antialiasing and a slightly smaller picture: much lighter on a mid-range phone.
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(1)
    this.renderer.xr.enabled = true
    this.renderer.xr.setFramebufferScaleFactor(0.8)

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 1.4))
    const sun = new THREE.DirectionalLight(0xffffff, 2)
    sun.position.set(2, 4, 3)
    this.scene.add(sun)

    this.content.visible = false
    this.content.add(this.models)
    this.scene.add(this.content)

    this.reticle = new THREE.Mesh(this.reticleGeometry, this.reticleMaterial)
    this.reticle.matrixAutoUpdate = false
    this.reticle.visible = false
    this.scene.add(this.reticle)
  }

  private setPhase(phase: ArPhase) {
    if (this.phase === phase) return
    this.phase = phase
    this.callbacks.onPhase(phase)
  }

  private applyContentTransform() {
    this.content.scale.setScalar(this.baseScale * this.userScale)
    this.content.rotation.y = THREE.MathUtils.degToRad(this.yawDegrees)
  }

  // Builds the whole scene once, exactly as authored in the editor.
  async load(models: ModelObject[], urls: ReadonlyMap<string, string>): Promise<ArLoadResult> {
    let loaded = 0
    let failed = 0
    const templates = new Map<string, Promise<THREE.Object3D>>()

    await Promise.all(
      models
        .filter((model) => model.visible)
        .map(async (model) => {
          const url = urls.get(model.assetId)
          if (!url) {
            failed += 1
            return
          }
          try {
            let template = templates.get(model.assetId)
            if (!template) {
              template = this.modelLoader.loader.loadAsync(url).then((gltf) => gltf.scene)
              templates.set(model.assetId, template)
            }
            const copy = SkeletonUtils.clone(await template)
            if (this.disposed) return

            const group = new THREE.Group()
            group.position.set(...model.position)
            const rotation = toRadians(model.rotation)
            group.rotation.set(rotation[0], rotation[1], rotation[2])
            group.scale.set(...model.scale)
            group.add(copy)
            this.models.add(group)
            loaded += 1
          } catch (error) {
            console.error('A model could not be loaded for AR', error)
            failed += 1
          }
        }),
    )

    let autoFitted = false
    const box = new THREE.Box3().setFromObject(this.models)
    if (!box.isEmpty()) {
      // Nothing should sink below the surface it is placed on.
      if (box.min.y < 0) this.models.position.y = -box.min.y
      const size = box.getSize(new THREE.Vector3())
      const fit = computeAutoFit(Math.max(size.x, size.y, size.z))
      this.baseScale = fit.scale
      autoFitted = fit.fitted
    }
    this.applyContentTransform()
    return { loaded, failed, autoFitted }
  }

  async start(overlayRoot: HTMLElement): Promise<void> {
    const xr = navigator.xr
    if (!xr) throw new Error('WebXR is not available in this browser.')

    const session = await xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay', 'anchors'],
      domOverlay: { root: overlayRoot },
    })

    this.renderer.xr.setReferenceSpaceType('local')
    await this.renderer.xr.setSession(session)
    this.session = session
    session.addEventListener('end', this.handleSessionEnd)
    session.addEventListener('select', this.handleSelect)

    const viewerSpace = await session.requestReferenceSpace('viewer')
    this.hitTestSource = (await session.requestHitTestSource?.({ space: viewerSpace })) ?? null

    this.placed = false
    this.content.visible = false
    this.renderer.setAnimationLoop(this.onFrame)
    this.setPhase('searching')
  }

  private readonly onFrame = (_time: number, frame?: XRFrame) => {
    if (frame) {
      if (!this.placed && this.hitTestSource) this.updateReticle(frame, this.hitTestSource)
      else if (this.placed && this.anchor) this.followAnchor(frame, this.anchor)
    }
    this.renderer.render(this.scene, this.camera)
  }

  private updateReticle(frame: XRFrame, source: XRHitTestSource) {
    const referenceSpace = this.renderer.xr.getReferenceSpace()
    const results = frame.getHitTestResults(source)
    const pose = referenceSpace ? results[0]?.getPose(referenceSpace) : undefined

    if (pose) {
      this.lastHit = results[0] ?? null
      this.reticle.visible = true
      this.reticle.matrix.fromArray(pose.transform.matrix)
      this.setPhase('aiming')
    } else {
      this.lastHit = null
      this.reticle.visible = false
      this.setPhase('searching')
    }
  }

  // The anchor keeps the scene attached to the real surface, which reduces drifting.
  private followAnchor(frame: XRFrame, anchor: AnchorLike) {
    const referenceSpace = this.renderer.xr.getReferenceSpace()
    const pose = referenceSpace ? frame.getPose(anchor.anchorSpace, referenceSpace) : undefined
    if (pose) {
      const { x, y, z } = pose.transform.position
      this.content.position.set(x, y, z)
    }
  }

  private pinToSurface() {
    const hit = this.lastHit as unknown as AnchorHit | null
    if (!hit?.createAnchor) return
    hit
      .createAnchor()
      .then((anchor) => {
        if (this.disposed || !this.placed) {
          anchor.delete()
          return
        }
        this.releaseAnchor()
        this.anchor = anchor
      })
      .catch(() => undefined) // Anchors are optional. Placement still works without them.
  }

  private releaseAnchor() {
    this.anchor?.delete()
    this.anchor = null
  }

  private readonly handleSelect = () => {
    if (this.placed || !this.reticle.visible) return
    // Placed upright on the surface. The rotate slider turns it around.
    this.content.position.setFromMatrixPosition(this.reticle.matrix)
    this.content.visible = true
    this.placed = true
    this.reticle.visible = false
    this.setPhase('placed')
    this.pinToSurface()
  }

  private readonly handleSessionEnd = () => {
    this.renderer.setAnimationLoop(null)
    this.hitTestSource?.cancel()
    this.hitTestSource = null
    this.releaseAnchor()
    this.lastHit = null
    this.session = null
    this.placed = false
    this.reticle.visible = false
    this.content.visible = false
    this.setPhase('idle')
  }

  resetPlacement() {
    this.releaseAnchor()
    this.placed = false
    this.content.visible = false
    this.setPhase('searching')
  }

  setUserScale(value: number) {
    this.userScale = clampUserScale(value)
    this.applyContentTransform()
  }

  setYaw(degrees: number) {
    this.yawDegrees = degrees
    this.applyContentTransform()
  }

  end() {
    this.session?.end().catch(() => undefined)
  }

  dispose() {
    this.disposed = true
    this.end()
    this.releaseAnchor()
    this.renderer.setAnimationLoop(null)
    disposeObject(this.models)
    this.reticleGeometry.dispose()
    this.reticleMaterial.dispose()
    this.modelLoader.dispose()
    this.renderer.dispose()
  }
}