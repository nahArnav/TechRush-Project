import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { MapPin, PlusCircle, Layers, X, Sparkles } from 'lucide-react'
import { NeoButton } from '../neo'
import type { Item } from '../types'
import type { ReportPrefill } from './ReportItemModal'

export type BuildingBlock = {
  id: string
  label: string
  x: number
  z: number
  width: number
  depth: number
  height: number
  color: number
  floors?: string[]
}

const BUILDINGS: BuildingBlock[] = [
  { id: 'library', label: 'Hargrove Library', x: -14, z: -10, width: 16, depth: 10, height: 8, color: 0x2a2f3a, floors: ['Ground', '1st Floor', '2nd Floor'] },
  { id: 'science', label: 'Kessler Science', x: 12, z: -10, width: 14, depth: 11, height: 7, color: 0x242832, floors: ['Ground', '1st Floor', '2nd Floor'] },
  { id: 'dining', label: 'Warren Dining', x: -1, z: 8, width: 12, depth: 8, height: 5, color: 0x1f232b, floors: ['Ground'] },
  { id: 'quad', label: 'Ellsworth Quad', x: -13, z: 9, width: 13, depth: 9, height: 0.4, color: 0x1a3322 },
  { id: 'security', label: 'Security Office', x: 14, z: 8, width: 7, depth: 6, height: 4.5, color: 0x332822, floors: ['Ground'] },
  { id: 'girls-hostel', label: 'Girls Hostel', x: 22, z: -14, width: 8, depth: 10, height: 9, color: 0x282333 },
  { id: 'boys-hostel', label: 'Boys Hostel', x: 22, z: 12, width: 8, depth: 10, height: 9, color: 0x282333 },
  { id: 'canteen', label: 'Canteen', x: 22, z: -1, width: 8, depth: 8, height: 4, color: 0x332b22 },
  { id: 'f-building', label: 'F Building', x: -10, z: 20, width: 10, depth: 8, height: 6, color: 0x222833 },
]

export default function CampusMap3D({
  items = [],
  onReportHere,
  onSelectItem,
}: {
  items?: Item[]
  onReportHere?: (prefill: ReportPrefill) => void
  onSelectItem?: (item: Item) => void
}) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingBlock | null>(null)
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null)

  // Filter out claimed / closed items — pins automatically disappear when claimed!
  const activeItems = items.filter((item) => item.status !== 'closed')

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 800
    const height = container.clientHeight || 500

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0e1117)
    scene.fog = new THREE.FogExp2(0x0e1117, 0.015)

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000)
    camera.position.set(0, 45, 55)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2.1
    controls.minDistance = 15
    controls.maxDistance = 120

    // Ground Plane
    const groundGeo = new THREE.PlaneGeometry(120, 100)
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x141820, roughness: 0.8, metalness: 0.2 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.1
    ground.receiveShadow = true
    scene.add(ground)

    // Grid Helper
    const grid = new THREE.GridHelper(120, 40, 0x2e3646, 0x1c222d)
    grid.position.y = 0.01
    scene.add(grid)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(30, 50, 40)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = 150
    dirLight.shadow.camera.left = -60
    dirLight.shadow.camera.right = 60
    dirLight.shadow.camera.top = 60
    dirLight.shadow.camera.bottom = -60
    scene.add(dirLight)

    const bluePointLight = new THREE.PointLight(0x3b82f6, 2, 60)
    bluePointLight.position.set(-15, 10, -10)
    scene.add(bluePointLight)

    // Building Meshes
    const buildingMeshes: THREE.Mesh[] = []

    BUILDINGS.forEach((b) => {
      const geo = new THREE.BoxGeometry(b.width, b.height, b.depth)
      const mat = new THREE.MeshStandardMaterial({
        color: b.color,
        roughness: 0.4,
        metalness: 0.5,
        wireframe: false,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(b.x, b.height / 2, b.z)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData = { building: b }
      scene.add(mesh)
      buildingMeshes.push(mesh)

      // Add roof accent wireframe
      const edges = new THREE.EdgesGeometry(geo)
      const lineMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.3 })
      const wire = new THREE.LineSegments(edges, lineMat)
      mesh.add(wire)
    })

    // Active Item 3D Pins (Floating Spheres + Beacons)
    const pinGroup = new THREE.Group()
    scene.add(pinGroup)

    activeItems.forEach((item, index) => {
      let px = 0
      let pz = 0
      const locLower = (item.location || '').toLowerCase()
      const matchedBuilding = BUILDINGS.find((b) => locLower.includes(b.id) || b.label.toLowerCase().includes(locLower))

      if (matchedBuilding) {
        px = matchedBuilding.x + (index % 3 - 1) * 2
        pz = matchedBuilding.z + (index % 2 - 1) * 2
      } else {
        const hash = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        px = ((hash % 40) - 20)
        pz = (((hash * 7) % 30) - 15)
      }

      const py = (matchedBuilding ? matchedBuilding.height : 3) + 3.5

      // Pin Glow Sphere
      const pinGeo = new THREE.SphereGeometry(0.8, 16, 16)
      const pinColor = item.type === 'found' ? 0x10b981 : 0xf59e0b
      const pinMat = new THREE.MeshBasicMaterial({ color: pinColor })
      const pinMesh = new THREE.Mesh(pinGeo, pinMat)
      pinMesh.position.set(px, py, pz)
      pinMesh.userData = { item }
      pinGroup.add(pinMesh)

      // Vertical Light Beam / Line
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(px, 0, pz),
        new THREE.Vector3(px, py, pz),
      ])
      const lineMaterial = new THREE.LineDashedMaterial({ color: pinColor, dashSize: 0.5, gapSize: 0.2 })
      const beaconLine = new THREE.Line(lineGeo, lineMaterial)
      beaconLine.computeLineDistances()
      pinGroup.add(beaconLine)
    })

    // Raycasting for Interactivity
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(buildingMeshes)

      if (intersects.length > 0) {
        const hitBuilding = intersects[0].object.userData.building as BuildingBlock
        setHoveredBuilding(hitBuilding.label)
        container.style.cursor = 'pointer'
      } else {
        setHoveredBuilding(null)
        container.style.cursor = 'default'
      }
    }

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)

      // Check pin clicks first
      const pinIntersects = raycaster.intersectObjects(pinGroup.children)
      if (pinIntersects.length > 0) {
        const itemData = pinIntersects[0].object.userData.item as Item
        if (itemData) {
          onSelectItem?.(itemData)
          return
        }
      }

      // Check building clicks
      const intersects = raycaster.intersectObjects(buildingMeshes)
      if (intersects.length > 0) {
        const hitBuilding = intersects[0].object.userData.building as BuildingBlock
        setSelectedBuilding(hitBuilding)
      }
    }

    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('click', onClick)

    // Animation Loop
    let animationFrameId: number
    let clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()

      // Float pins smoothly
      pinGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.position.y += Math.sin(elapsedTime * 3 + child.position.x) * 0.01
          child.rotation.y += 0.02
        }
      })

      controls.update()
      renderer.render(scene, camera)
    }

    animate()

    // Handle Resize
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('click', onClick)
      controls.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [items, activeItems.length])

  return (
    <div className="relative size-full overflow-hidden rounded-neo-lg bg-[#0e1117]">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="h-[460px] w-full cursor-grab active:cursor-grabbing" />

      {/* Hover Info Tag */}
      {hoveredBuilding ? (
        <div className="pointer-events-none absolute left-md top-md rounded-neo bg-black/80 px-lg py-md text-xs font-bold text-white shadow-float backdrop-blur-md">
          🏢 {hoveredBuilding} (Click to inspect / report)
        </div>
      ) : null}

      {/* Active Pins Short-phrase Overlay List */}
      <div className="absolute right-md top-md max-h-[400px] w-64 overflow-y-auto rounded-neo bg-black/60 p-md text-white backdrop-blur-lg">
        <p className="mb-xs flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/70">
          <span>Live 3D Item Pins</span>
          <span className="rounded-neo-full bg-blue-500/30 px-md py-px text-[9px] text-blue-400">
            {activeItems.length} Active
          </span>
        </p>

        {activeItems.length === 0 ? (
          <p className="py-md text-center text-xs text-white/50">No active item pins on map.</p>
        ) : (
          <div className="flex flex-col gap-xs">
            {activeItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectItem?.(item)}
                className="flex items-center justify-between rounded-neo bg-white/10 p-xs text-left text-xs transition-colors hover:bg-white/20"
              >
                <div className="flex items-center gap-xs truncate">
                  <span className={`size-2 shrink-0 rounded-neo-full ${item.type === 'found' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="truncate font-bold">{item.title}</span>
                </div>
                <span className="shrink-0 text-[10px] text-white/60">{item.location.split(',')[0]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Building Inspector Modal Overlay */}
      {selectedBuilding ? (
        <div className="absolute inset-x-md bottom-md z-20 flex flex-col gap-md rounded-neo bg-plate/95 p-lg shadow-float backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-md">
            <span className="flex size-10 items-center justify-center rounded-neo-full bg-ink text-on-ink">
              <Layers size={18} />
            </span>
            <div>
              <p className="text-sm font-black text-ink">{selectedBuilding.label}</p>
              <p className="text-xs text-ink-muted">
                Floors: {selectedBuilding.floors ? selectedBuilding.floors.join(', ') : 'Ground'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-sm">
            <NeoButton
              size="sm"
              variant="dark"
              iconStart={<PlusCircle size={14} />}
              onClick={() => {
                onReportHere?.({
                  type: 'found',
                  building: selectedBuilding.label,
                  floor: selectedBuilding.floors?.[0] ?? 'Ground',
                  coordinates: `3D Coordinates (${selectedBuilding.x}, ${selectedBuilding.z})`,
                })
                setSelectedBuilding(null)
              }}
            >
              Report Item at {selectedBuilding.label}
            </NeoButton>
            <button
              onClick={() => setSelectedBuilding(null)}
              className="rounded-neo p-xs text-ink-muted hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
