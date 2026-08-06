import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Layers, MapPin, PlusCircle, X } from 'lucide-react'
import { NeoButton } from '../neo'
import type { Item } from '../types'
import type { ReportPrefill } from './ReportItemModal'

export type CampusBlock = {
  id: string
  label: string
  x: number
  z: number
  width: number
  depth: number
  height: number
  kind?: 'building' | 'parking' | 'ground' | 'gate'
}

type MapSelection = {
  label: string
  x: number
  z: number
  floor: string
}

const BLOCKS: CampusBlock[] = [
  { id: 'parking-1', label: 'Parking 1', x: -33, z: -8, width: 6, depth: 25, height: 2.2, kind: 'parking' },
  { id: 'a1', label: 'A1 Building', x: -24, z: -8, width: 8, depth: 25, height: 6.8 },
  { id: 'library', label: 'Library', x: -7, z: -18, width: 24, depth: 10, height: 6.2 },
  { id: 'a3', label: 'A3 Building', x: 0, z: -3, width: 8, depth: 13, height: 7.2 },
  { id: 'ground', label: 'Ground', x: 15, z: -7, width: 14, depth: 24, height: 0.5, kind: 'ground' },
  { id: 'girls-hostel', label: 'Girls Hostel', x: 32, z: -16, width: 13, depth: 13, height: 7.8 },
  { id: 'canteen', label: 'Canteen', x: 32, z: 2, width: 13, depth: 14, height: 5.8 },
  { id: 'boys-hostel', label: 'Boys Hostel', x: 32, z: 20, width: 13, depth: 13, height: 7.8 },
  { id: 'gate', label: 'Gate', x: -31, z: 19, width: 9, depth: 6, height: 2.6, kind: 'gate' },
  { id: 'f-building', label: 'F Building', x: -15, z: 21, width: 14, depth: 10, height: 5.4 },
  { id: 'parking-2', label: 'Parking 2', x: 8, z: 22, width: 23, depth: 7, height: 2.4, kind: 'parking' },
]

const PATHS = [
  { x: -4, z: 11, width: 56, depth: 3.4 },
  { x: -39, z: 7, width: 3, depth: 31 },
  { x: 25, z: 7, width: 3, depth: 34 },
]

function labelTexture(text: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 192
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 42px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const words = text.split(' ')
  const lines = words.length > 1 && text.length > 10 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [text]
  lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, canvas.height / 2 + (i - (lines.length - 1) / 2) * 48))
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function statusColor(item: Item) {
  if (item.status === 'in_review') return 0xf59e0b
  if (item.status === 'secured') return 0x3b82f6
  return item.type === 'lost' ? 0xef4444 : 0x10b981
}

function locateItem(item: Item, index: number) {
  const location = item.location.toLowerCase()
  const block = BLOCKS.find((b) => {
    const label = b.label.toLowerCase()
    return location.includes(label) || label.includes(location.split(',')[0] || '')
  })
  if (block) {
    const spreadX = ((index % 3) - 1) * Math.min(2.2, block.width / 5)
    const spreadZ = ((Math.floor(index / 3) % 3) - 1) * Math.min(2.2, block.depth / 5)
    return { x: block.x + spreadX, z: block.z + spreadZ, y: block.height + 2.5 }
  }
  const hash = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return { x: (hash % 62) - 31, z: ((hash * 7) % 38) - 10, y: 4 }
}

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
  const [selected, setSelected] = useState<MapSelection | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const activeItems = useMemo(() => items.filter((item) => item.status !== 'closed'), [items])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 1000
    const height = container.clientHeight || 560
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x07101f)
    scene.fog = new THREE.FogExp2(0x07101f, 0.012)

    const camera = new THREE.PerspectiveCamera(42, width / height, 1, 1000)
    camera.position.set(0, 64, 70)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 36
    controls.maxDistance = 115
    controls.maxPolarAngle = Math.PI / 2.35
    controls.target.set(0, 0, 4)

    const campus = new THREE.Mesh(
      new THREE.BoxGeometry(82, 1, 54),
      new THREE.MeshStandardMaterial({ color: 0x0b1730, roughness: 0.86, metalness: 0.15 }),
    )
    campus.position.y = -0.55
    campus.receiveShadow = true
    scene.add(campus)

    PATHS.forEach((path) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(path.width, 0.18, path.depth),
        new THREE.MeshStandardMaterial({ color: 0x262626, roughness: 0.7, metalness: 0.2 }),
      )
      mesh.position.set(path.x, 0.08, path.z)
      mesh.receiveShadow = true
      scene.add(mesh)
    })

    scene.add(new THREE.AmbientLight(0xffffff, 0.68))
    const key = new THREE.DirectionalLight(0xffffff, 1.35)
    key.position.set(-22, 52, 36)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -60
    key.shadow.camera.right = 60
    key.shadow.camera.top = 55
    key.shadow.camera.bottom = -55
    scene.add(key)
    const rim = new THREE.PointLight(0x3b82f6, 1.6, 80)
    rim.position.set(20, 18, -22)
    scene.add(rim)

    const blockMeshes: THREE.Mesh[] = []
    BLOCKS.forEach((block) => {
      const mat = new THREE.MeshStandardMaterial({
        color: block.kind === 'ground' ? 0x1f1f1f : 0x252525,
        roughness: 0.52,
        metalness: 0.32,
      })
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(block.width, block.height, block.depth), mat)
      mesh.position.set(block.x, block.height / 2, block.z)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData = { block }
      scene.add(mesh)
      blockMeshes.push(mesh)

      const edges = new THREE.EdgesGeometry(mesh.geometry)
      const edge = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 }))
      mesh.add(edge)

      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(block.label), transparent: true, depthTest: false }))
      label.position.set(block.x, block.height + 1.25, block.z)
      label.scale.set(Math.max(8, block.width * 0.78), Math.max(3, block.depth * 0.22), 1)
      scene.add(label)
    })

    const pinGroup = new THREE.Group()
    scene.add(pinGroup)
    activeItems.forEach((item, index) => {
      const pos = locateItem(item, index)
      const color = statusColor(item)
      const pin = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 18, 18),
        new THREE.MeshBasicMaterial({ color }),
      )
      pin.position.set(pos.x, pos.y, pos.z)
      pin.userData = { item }
      pinGroup.add(pin)

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.15, 0.08, 8, 28),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }),
      )
      ring.rotation.x = Math.PI / 2
      ring.position.set(pos.x, 0.22, pos.z)
      pinGroup.add(ring)

      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(pos.x, 0.3, pos.z), new THREE.Vector3(pos.x, pos.y, pos.z)]),
        new THREE.LineDashedMaterial({ color, dashSize: 0.45, gapSize: 0.25, transparent: true, opacity: 0.8 }),
      )
      line.computeLineDistances()
      pinGroup.add(line)
    })

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    const campusPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const groundHit = new THREE.Vector3()

    const setMouse = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
    }

    const chooseSpot = (label: string, x: number, z: number) => {
      setSelected({ label, x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10, floor: 'Ground' })
    }

    const onPointerMove = (e: MouseEvent) => {
      setMouse(e)
      const hit = raycaster.intersectObjects(blockMeshes)[0]
      if (hit) {
        setHovered((hit.object.userData.block as CampusBlock).label)
        container.style.cursor = 'pointer'
      } else {
        setHovered(null)
        container.style.cursor = 'grab'
      }
    }

    const onClick = (e: MouseEvent) => {
      setMouse(e)
      const pinHit = raycaster.intersectObjects(pinGroup.children, false).find((hit) => hit.object.userData.item)
      if (pinHit?.object.userData.item) {
        onSelectItem?.(pinHit.object.userData.item as Item)
        return
      }
      const blockHit = raycaster.intersectObjects(blockMeshes)[0]
      if (blockHit) {
        const block = blockHit.object.userData.block as CampusBlock
        chooseSpot(block.label, block.x, block.z)
      }
    }

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      setMouse(e)
      const blockHit = raycaster.intersectObjects(blockMeshes)[0]
      if (blockHit) {
        const block = blockHit.object.userData.block as CampusBlock
        chooseSpot(block.label, block.x, block.z)
        return
      }
      raycaster.ray.intersectPlane(campusPlane, groundHit)
      chooseSpot('Campus map pin', groundHit.x, groundHit.z)
    }

    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('click', onClick)
    renderer.domElement.addEventListener('contextmenu', onContextMenu)

    let animationFrameId = 0
    const clock = new THREE.Clock()
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      pinGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) {
          child.position.y += Math.sin(t * 3 + child.position.x) * 0.008
        }
      })
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      const w = container.clientWidth || width
      const h = container.clientHeight || height
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
      renderer.domElement.removeEventListener('contextmenu', onContextMenu)
      controls.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [activeItems, onReportHere, onSelectItem])

  const reportAt = (type: 'lost' | 'found') => {
    if (!selected) return
    onReportHere?.({
      type,
      building: selected.label,
      floor: selected.floor,
      coordinates: `Map pin ${selected.x}, ${selected.z}`,
    })
    setSelected(null)
  }

  return (
    <div className="relative size-full overflow-hidden rounded-neo-lg bg-[#07101f]">
      <div ref={mountRef} className="h-full min-h-[560px] w-full cursor-grab active:cursor-grabbing" />

      <div className="absolute left-md top-md flex flex-wrap gap-md rounded-neo bg-black/55 px-lg py-md text-xs font-bold text-white shadow-float backdrop-blur-lg">
        <span className="flex items-center gap-xs"><span className="size-2 rounded-neo-full bg-status-lost" /> Lost</span>
        <span className="flex items-center gap-xs"><span className="size-2 rounded-neo-full bg-status-found" /> Found</span>
        <span className="flex items-center gap-xs"><span className="size-2 rounded-neo-full bg-status-claimed" /> Claimed</span>
        <span className="flex items-center gap-xs"><span className="size-2 rounded-neo-full bg-status-new" /> Just reported</span>
      </div>

      {hovered ? (
        <div className="pointer-events-none absolute left-md top-16 rounded-neo bg-black/75 px-lg py-md text-xs font-bold text-white shadow-float backdrop-blur-md">
          {hovered}
        </div>
      ) : null}

      <div className="absolute right-md top-md max-h-[420px] w-72 overflow-y-auto rounded-neo bg-black/60 p-md text-white shadow-float backdrop-blur-lg">
        <p className="mb-sm flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/70">
          <span>Map Pins</span>
          <span className="rounded-neo-full bg-white/10 px-md py-px text-[9px]">{activeItems.length}</span>
        </p>
        {activeItems.length === 0 ? (
          <p className="py-md text-center text-xs text-white/50">No active pins yet. Right-click the 3D map to add one.</p>
        ) : (
          <div className="flex flex-col gap-xs">
            {activeItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectItem?.(item)}
                className="flex items-center justify-between gap-md rounded-neo bg-white/10 p-sm text-left text-xs transition-colors hover:bg-white/20"
              >
                <span className="flex min-w-0 items-center gap-xs">
                  <span className={`size-2 shrink-0 rounded-neo-full ${item.type === 'lost' ? 'bg-status-lost' : 'bg-status-found'}`} />
                  <span className="truncate font-bold">{item.title}</span>
                </span>
                <span className="shrink-0 text-[10px] text-white/60">{item.id}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected ? (
        <div className="absolute inset-x-md bottom-md z-20 flex flex-col gap-lg rounded-neo bg-plate/95 p-lg text-ink shadow-float backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-md">
            <span className="flex size-10 items-center justify-center rounded-neo-full bg-ink text-on-ink">
              <Layers size={18} />
            </span>
            <div>
              <p className="text-sm font-black">{selected.label}</p>
              <p className="text-xs text-ink-muted">Selected pin: {selected.x}, {selected.z}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-sm">
            <NeoButton size="sm" variant="raised" iconStart={<MapPin size={14} />} onClick={() => reportAt('lost')}>
              Report lost here
            </NeoButton>
            <NeoButton size="sm" variant="dark" iconStart={<PlusCircle size={14} />} onClick={() => reportAt('found')}>
              Report found here
            </NeoButton>
            <button onClick={() => setSelected(null)} className="rounded-neo p-xs text-ink-muted hover:text-ink" aria-label="Close map menu">
              <X size={18} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
