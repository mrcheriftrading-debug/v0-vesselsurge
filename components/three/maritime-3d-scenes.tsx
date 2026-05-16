"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

type RiskLevel = "low" | "medium" | "high" | "critical" | string

const RISK_COLORS: Record<string, number> = {
  low: 0x22c55e,
  medium: 0xeab308,
  high: 0xf97316,
  critical: 0xef4444,
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function createRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
  renderer.setClearColor(0x000000, 0)
  return renderer
}

function useThreeScene(setup: (canvas: HTMLCanvasElement) => () => void) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    return setup(canvas)
  }, [setup])

  return canvasRef
}

export function HeroOceanScene() {
  const canvasRef = useThreeScene((canvas) => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100)
    const renderer = createRenderer(canvas)
    const group = new THREE.Group()
    const animated = !prefersReducedMotion()
    let frame = 0

    scene.add(group)
    camera.position.set(0, 1.5, 8)

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 64, 32),
      new THREE.MeshBasicMaterial({
        color: 0x0b1f36,
        wireframe: true,
        transparent: true,
        opacity: 0.28,
      }),
    )
    group.add(globe)

    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.22 })
    for (let i = 0; i < 4; i += 1) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.7 + i * 0.45, 0.006, 8, 160), ringMaterial.clone())
      ring.rotation.x = Math.PI / 2
      ring.rotation.z = i * 0.35
      group.add(ring)
    }

    const laneMaterial = new THREE.LineBasicMaterial({ color: 0x22c5ff, transparent: true, opacity: 0.65 })
    const routes = [
      [[-2.4, -0.35, 0.2], [-0.9, 0.7, 0.3], [0.7, 0.35, 0.2], [2.5, 0.9, 0.1]],
      [[-2.2, 0.95, -0.1], [-0.6, 0.15, 0.3], [1.0, -0.05, 0.2], [2.2, -0.85, 0.1]],
      [[-1.8, -1.05, 0], [-0.2, -0.55, 0.5], [1.5, -0.35, 0.2], [2.4, 0.35, 0]],
    ]
    routes.forEach((route) => {
      const curve = new THREE.CatmullRomCurve3(route.map(([x, y, z]) => new THREE.Vector3(x, y, z)))
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(90)), laneMaterial.clone()))
    })

    const vesselGeometry = new THREE.ConeGeometry(0.075, 0.28, 3)
    const vesselMaterial = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.42 })
    const vessels = routes.map((route, index) => {
      const curve = new THREE.CatmullRomCurve3(route.map(([x, y, z]) => new THREE.Vector3(x, y, z)))
      const mesh = new THREE.Mesh(vesselGeometry, vesselMaterial.clone())
      mesh.rotation.z = -Math.PI / 2
      group.add(mesh)
      return { curve, mesh, offset: index / routes.length }
    })

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      renderer.setSize(rect.width, rect.height, false)
      camera.aspect = rect.width / Math.max(rect.height, 1)
      camera.updateProjectionMatrix()
    }

    const render = () => {
      resize()
      const t = frame * 0.004
      if (animated) {
        group.rotation.y = t * 0.38
        group.rotation.x = Math.sin(t * 0.7) * 0.08
        vessels.forEach(({ curve, mesh, offset }) => {
          const p = curve.getPoint((t * 0.18 + offset) % 1)
          mesh.position.copy(p)
        })
        frame = requestAnimationFrame(render)
      }
      renderer.render(scene, camera)
    }

    render()

    return () => {
      cancelAnimationFrame(frame)
      renderer.dispose()
      globe.geometry.dispose()
      vesselGeometry.dispose()
      group.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose())
          else object.material.dispose()
        }
      })
    }
  })

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
}

export function DataNetworkScene() {
  const canvasRef = useThreeScene((canvas) => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    const renderer = createRenderer(canvas)
    const animated = !prefersReducedMotion()
    const root = new THREE.Group()
    let frame = 0

    scene.add(root)
    camera.position.set(0, 0, 7)

    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    const coreMaterial = new THREE.MeshBasicMaterial({ color: 0x00e676 })
    const linkMaterial = new THREE.LineBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.5 })
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), coreMaterial)
    root.add(core)

    const nodes: THREE.Mesh[] = []
    for (let i = 0; i < 14; i += 1) {
      const angle = (i / 14) * Math.PI * 2
      const radius = 1.7 + (i % 4) * 0.42
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.08 + (i % 3) * 0.025, 16, 12), nodeMaterial.clone())
      node.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.62, (i % 5) * 0.18 - 0.36)
      nodes.push(node)
      root.add(node)
      root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), node.position]), linkMaterial.clone()))
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      renderer.setSize(rect.width, rect.height, false)
      camera.aspect = rect.width / Math.max(rect.height, 1)
      camera.updateProjectionMatrix()
    }

    const render = () => {
      resize()
      const t = frame * 0.006
      if (animated) {
        root.rotation.y = t * 0.45
        core.rotation.x = t
        core.rotation.y = t * 0.7
        nodes.forEach((node, index) => {
          node.scale.setScalar(1 + Math.sin(t * 3 + index) * 0.18)
        })
        frame = requestAnimationFrame(render)
      }
      renderer.render(scene, camera)
    }

    render()

    return () => {
      cancelAnimationFrame(frame)
      renderer.dispose()
      root.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose())
          else object.material.dispose()
        }
      })
    }
  })

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
}

export function HotspotRiskOrbital({ riskLevel = "medium", reports = 0, sources = 0 }: {
  riskLevel?: RiskLevel
  reports?: number
  sources?: number
}) {
  const color = RISK_COLORS[riskLevel] ?? RISK_COLORS.medium
  const canvasRef = useThreeScene((canvas) => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    const renderer = createRenderer(canvas)
    const animated = !prefersReducedMotion()
    const root = new THREE.Group()
    let frame = 0

    scene.add(root)
    camera.position.set(0, 0, 5.6)

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.72, 2),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, wireframe: true }),
    )
    root.add(core)

    const ringCount = Math.min(5, Math.max(2, Math.ceil((sources || 1) / 3)))
    for (let i = 0; i < ringCount; i += 1) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.05 + i * 0.22, 0.01, 8, 128),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.42 - i * 0.05 }),
      )
      ring.rotation.x = Math.PI / 2 + i * 0.42
      ring.rotation.y = i * 0.18
      root.add(ring)
    }

    const blipMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
    const blips: THREE.Mesh[] = []
    const blipCount = Math.min(24, Math.max(4, reports || 4))
    for (let i = 0; i < blipCount; i += 1) {
      const blip = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), blipMaterial.clone())
      blip.userData.angle = (i / blipCount) * Math.PI * 2
      blip.userData.radius = 1.16 + (i % 4) * 0.17
      blips.push(blip)
      root.add(blip)
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      renderer.setSize(rect.width, rect.height, false)
      camera.aspect = rect.width / Math.max(rect.height, 1)
      camera.updateProjectionMatrix()
    }

    const render = () => {
      resize()
      const t = frame * 0.008
      if (animated) {
        core.rotation.x = t * 0.9
        core.rotation.y = t * 1.2
        root.rotation.z = Math.sin(t * 0.6) * 0.12
        blips.forEach((blip, index) => {
          const angle = blip.userData.angle + t * (0.45 + (index % 3) * 0.12)
          const radius = blip.userData.radius
          blip.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.55, Math.sin(angle * 1.3) * 0.35)
        })
        frame = requestAnimationFrame(render)
      }
      renderer.render(scene, camera)
    }

    render()

    return () => {
      cancelAnimationFrame(frame)
      renderer.dispose()
      root.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose())
          else object.material.dispose()
        }
      })
    }
  })

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
}
