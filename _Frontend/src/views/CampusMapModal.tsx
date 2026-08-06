import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Compass, Layers, MapPin, PackageSearch, PlusCircle, X } from 'lucide-react'
import { NeoButton, NeoModal, NeoPill, SPRING } from '../neo'
import type { ReportPrefill } from './ReportItemModal'

/*
 * Interactive Campus Map (Task 2). A full-width dark-glass spatial plan built to
 * the reference layout: every building is a hotspot with default / hover-glow /
 * active states, a right-click context menu reports an item at that spot, and
 * selecting a block slides in a floor-plan panel with per-floor item pins.
 *
 * Positions are percentages of the map canvas so the whole plan scales fluidly.
 */
type Block = { id: string; label: string; x: number; y: number; w: number; h: number; floors?: string[] }

const FLOORS = ['Ground', '1st Floor', '2nd Floor', '3rd Floor']

const BLOCKS: Block[] = [
  { id: 'parking-1', label: 'Parking 1', x: 2, y: 4, w: 8, h: 52 },
  { id: 'a1', label: 'A1 Building', x: 12, y: 4, w: 10, h: 52, floors: FLOORS },
  { id: 'library', label: 'Library', x: 24, y: 4, w: 32, h: 22, floors: FLOORS },
  { id: 'a3', label: 'A3 Building', x: 46, y: 26, w: 10, h: 26, floors: FLOORS },
  { id: 'ground', label: 'Ground', x: 59, y: 4, w: 18, h: 48 },
  { id: 'girls-hostel', label: 'Girls Hostel', x: 81, y: 2, w: 17, h: 28, floors: FLOORS },
  { id: 'canteen', label: 'Canteen', x: 81, y: 33, w: 17, h: 30, floors: ['Ground'] },
  { id: 'boys-hostel', label: 'Boys Hostel', x: 81, y: 71, w: 17, h: 27, floors: FLOORS },
  { id: 'walkway', label: '', x: 4, y: 62, w: 73, h: 8 },
  { id: 'gate', label: 'Gate', x: 2, y: 76, w: 11, h: 12 },
  { id: 'f-building', label: 'F Building', x: 20, y: 75, w: 18, h: 22, floors: FLOORS },
  { id: 'parking-2', label: 'Parking 2', x: 41, y: 80, w: 34, h: 16 },
]

type PinStatus = 'lost' | 'found' | 'claimed' | 'new'
type Pin = {
  id: string
  block: string
  floor: string
  x: number
  y: number
  status: PinStatus
  name: string
  category: string
  seen: string
  time: string
}

const STATUS: Record<PinStatus, { label: string; className: string; dot: string }> = {
  lost: { label: 'Lost', className: 'text-status-lost border-status-lost/50', dot: 'bg-status-lost' },
  found: { label: 'Found', className: 'text-status-found border-status-found/50', dot: 'bg-status-found' },
  claimed: { label: 'Claimed', className: 'text-status-claimed border-status-claimed/50', dot: 'bg-status-claimed' },
  new: { label: 'Just reported', className: 'text-status-new border-status-new/50', dot: 'bg-status-new' },
}

const PINS: Pin[] = [
  { id: 'p1', block: 'library', floor: 'Ground', x: 32, y: 60, status: 'found', name: 'Black leather wallet', category: 'Wallet', seen: 'Reading hall, desk 12', time: 'Today, 10:24 AM' },
  { id: 'p2', block: 'library', floor: '1st Floor', x: 68, y: 38, status: 'lost', name: 'Silver laptop', category: 'Electronics', seen: 'Reference section', time: 'Today, 9:05 AM' },
  { id: 'p3', block: 'a3', floor: '2nd Floor', x: 45, y: 52, status: 'claimed', name: 'Blue water bottle', category: 'Bottle', seen: 'Lab 204', time: 'Yesterday, 4:40 PM' },
  { id: 'p4', block: 'canteen', floor: 'Ground', x: 60, y: 44, status: 'new', name: 'Wireless earbuds', category: 'Electronics', seen: 'Counter 3', time: '12 minutes ago' },
  { id: 'p5', block: 'f-building', floor: 'Ground', x: 38, y: 66, status: 'found', name: 'Campus ID card', category: 'ID Card', seen: 'Corridor noticeboard', time: 'Today, 8:15 AM' },
  { id: 'p6', block: 'a1', floor: '3rd Floor', x: 55, y: 30, status: 'lost', name: 'Grey hoodie', category: 'Clothing', seen: 'Seminar hall', time: '2 days ago' },
]

/* Status pin with an animated double-ring ripple when highlighted. */
function MapPinDot({ status, highlighted }: { status: PinStatus; highlighted?: boolean }) {
  return (
    <span className="relative flex size-4 items-center justify-center">
      {highlighted ? (
        <>
          <span className={`absolute size-4 rounded-neo-full ${STATUS[status].dot} animate-ripple opacity-60`} />
          <span
            className={`absolute size-4 rounded-neo-full ${STATUS[status].dot} animate-ripple opacity-40`}
            style={{ animationDelay: '0.9s' }}
          />
        </>
      ) : null}
      <span className={`relative size-3 rounded-neo-full border border-white/70 ${STATUS[status].dot}`} />
    </span>
  )
}

export default function CampusMapModal({
  isOpen,
  onClose,
  onReportHere,
}: {
  isOpen: boolean
  onClose: () => void
  onReportHere?: (prefill: ReportPrefill) => void
}) {
  const [hover, setHover] = useState<string | null>(null)
  const [selected, setSelected] = useState<Block | null>(null)
  const [floor, setFloor] = useState(FLOORS[0])
  const [activePin, setActivePin] = useState<Pin | null>(null)
  const [menu, setMenu] = useState<{ block: Block; x: number; y: number; cx: number; cy: number } | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setSelected(null)
      setActivePin(null)
      setMenu(null)
    }
  }, [isOpen])

  // Any click that is not on the menu itself dismisses it.
  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [menu])

  const openBlock = (b: Block) => {
    if (!b.label) return
    setSelected(b)
    setFloor(b.floors?.[0] ?? 'Ground')
    setActivePin(null)
  }

  const contextMenu = (e: React.MouseEvent, b: Block) => {
    e.preventDefault()
    e.stopPropagation()
    const canvas = e.currentTarget.parentElement!.getBoundingClientRect()
    setMenu({
      block: b,
      x: ((e.clientX - canvas.left) / canvas.width) * 100,
      y: ((e.clientY - canvas.top) / canvas.height) * 100,
      cx: Math.round(((e.clientX - canvas.left) / canvas.width) * 1000),
      cy: Math.round(((e.clientY - canvas.top) / canvas.height) * 1000),
    })
  }

  const report = (type: 'lost' | 'found') => {
    if (!menu) return
    onReportHere?.({
      type,
      building: menu.block.label,
      floor: menu.block.floors?.[0] ?? 'Ground',
      coordinates: `Map ${menu.cx}, ${menu.cy}`,
    })
    setMenu(null)
  }

  const floorPins = selected ? PINS.filter((p) => p.block === selected.id && p.floor === floor) : []

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      icon={<Compass size={18} />}
      title="Campus map"
      subtitle="Click a building for its floor plan · right-click anywhere to report an item there"
    >
      {/* Positioning context for the floor panel, so it sits below the modal
          header instead of covering the close button. */}
      <div className="relative flex min-h-full flex-col gap-xl">
        {/* Status legend */}
        <div className="flex flex-wrap items-center gap-lg">
          {(Object.keys(STATUS) as PinStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-sm text-[11px] font-bold text-ink-soft">
              <span className={`size-2.5 rounded-neo-full ${STATUS[s].dot}`} /> {STATUS[s].label}
            </span>
          ))}
        </div>

        {/* Spatial plan */}
        <div className="relative w-full overflow-hidden rounded-neo-lg bg-map-canvas p-lg shadow-float">
          <div className="relative w-full" style={{ aspectRatio: '16 / 9', minHeight: 320 }}>
            {BLOCKS.map((b) => {
              const isWalkway = !b.label
              const on = hover === b.id || selected?.id === b.id
              return (
                <button
                  key={b.id}
                  type="button"
                  disabled={isWalkway}
                  onMouseEnter={() => setHover(b.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => openBlock(b)}
                  onContextMenu={(e) => contextMenu(e, b)}
                  className={`absolute flex items-center justify-center rounded-neo p-sm text-center text-[11px] font-bold leading-tight transition-all duration-200 sm:text-xs ${
                    isWalkway ? 'cursor-default' : 'cursor-pointer'
                  } ${
                    on
                      ? 'bg-map-block-hover text-map-block-ink shadow-[0_0_28px_4px_var(--accent-soft)] ring-1 ring-accent-border'
                      : 'bg-map-block text-map-block-ink shadow-glass-lg'
                  } ${selected?.id === b.id ? 'ring-2 ring-accent' : ''}`}
                  style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
                >
                  {b.label}
                </button>
              )
            })}

            {/* Right-click context menu (Task 2D) */}
            <AnimatePresence>
              {menu ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={SPRING}
                  onClick={(e) => e.stopPropagation()}
                  className="glass absolute z-20 w-56 overflow-hidden rounded-neo p-1 shadow-float"
                  style={{ left: `${Math.min(menu.x, 70)}%`, top: `${Math.min(menu.y, 70)}%` }}
                >
                  <p className="px-lg py-md text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">
                    {menu.block.label || 'Walkway'}
                  </p>
                  <button
                    type="button"
                    onClick={() => report('lost')}
                    className="flex w-full items-center gap-md rounded-neo px-lg py-md text-left text-xs font-bold text-ink hover:bg-ink/5"
                  >
                    <span className="size-2 rounded-neo-full bg-status-lost" /> Report lost item here
                  </button>
                  <button
                    type="button"
                    onClick={() => report('found')}
                    className="flex w-full items-center gap-md rounded-neo px-lg py-md text-left text-xs font-bold text-ink hover:bg-ink/5"
                  >
                    <span className="size-2 rounded-neo-full bg-status-found" /> Report found item here
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-xs text-ink-muted">
          {selected ? `Viewing ${selected.label}` : 'Tip: right-click a building to file a report pinned to that spot.'}
        </p>

      {/* Floor-plan slide-in panel (Task 2B) */}
      <AnimatePresence>
        {selected ? (
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={SPRING}
            className="glass absolute right-0 top-0 z-30 flex h-full w-full max-w-sm flex-col overflow-hidden rounded-neo-lg border border-line shadow-float"
          >
            <header className="flex items-start justify-between gap-md border-b border-line-soft px-xl py-lg">
              <div>
                <p className="flex items-center gap-sm text-sm font-black tracking-tight text-ink">
                  <Layers size={15} /> {selected.label}
                </p>
                <p className="text-[11px] text-ink-muted">Floor plan &amp; reported items</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close floor plan"
                className="text-ink-muted hover:text-ink"
              >
                <X size={18} />
              </button>
            </header>

            {/* Floor tabs */}
            <div className="flex flex-wrap gap-sm px-xl py-lg">
              {(selected.floors ?? ['Ground']).map((f) => (
                <NeoPill key={f} active={floor === f} onClick={() => { setFloor(f); setActivePin(null) }}>
                  {f}
                </NeoPill>
              ))}
            </div>

            {/* Floor outline with pins */}
            <div className="px-xl">
              <div className="relative w-full rounded-neo bg-plate shadow-carve" style={{ aspectRatio: '4 / 3' }}>
                <svg viewBox="0 0 100 75" className="absolute inset-0 size-full">
                  <rect x="4" y="4" width="92" height="67" rx="3" fill="none" stroke="var(--line)" strokeWidth="1" />
                  <line x1="4" y1="28" x2="96" y2="28" stroke="var(--line)" strokeWidth="0.8" />
                  <line x1="38" y1="28" x2="38" y2="71" stroke="var(--line)" strokeWidth="0.8" />
                  <line x1="68" y1="4" x2="68" y2="28" stroke="var(--line)" strokeWidth="0.8" />
                  <text x="8" y="24" fontSize="4" fill="var(--ink-muted)">Corridor</text>
                  <text x="42" y="48" fontSize="4" fill="var(--ink-muted)">Hall</text>
                </svg>

                {floorPins.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePin(activePin?.id === p.id ? null : p)}
                    aria-label={p.name}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  >
                    <MapPinDot status={p.status} highlighted={activePin?.id === p.id} />
                  </button>
                ))}

                {!floorPins.length ? (
                  <p className="absolute inset-x-0 bottom-lg text-center text-[11px] text-ink-muted">
                    No reported items on this floor.
                  </p>
                ) : null}
              </div>
            </div>

            {/* Pin popover card */}
            <div className="flex-1 overflow-y-auto p-xl">
              <AnimatePresence mode="wait">
                {activePin ? (
                  <motion.div
                    key={activePin.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={SPRING}
                    className="flex flex-col gap-md rounded-neo bg-plate p-lg shadow-extrude-sm"
                  >
                    <div className="flex items-start justify-between gap-md">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">{activePin.name}</p>
                        <p className="text-[11px] text-ink-muted">{activePin.category}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-neo-full border px-md py-px text-[10px] font-black uppercase tracking-widest ${STATUS[activePin.status].className}`}
                      >
                        {STATUS[activePin.status].label}
                      </span>
                    </div>
                    <p className="flex items-center gap-xs text-[11px] text-ink-soft">
                      <MapPin size={11} /> {activePin.seen}
                    </p>
                    <p className="text-[11px] tabular-nums text-ink-muted">{activePin.time}</p>
                    <NeoButton size="sm" variant="dark" className="w-full" iconStart={<PackageSearch size={14} />}>
                      View details
                    </NeoButton>
                  </motion.div>
                ) : (
                  <p key="hint" className="text-center text-[11px] text-ink-muted">
                    Select a pin to see the item report.
                  </p>
                )}
              </AnimatePresence>
            </div>

            <footer className="border-t border-line-soft p-xl">
              <NeoButton
                className="w-full"
                iconStart={<PlusCircle size={15} />}
                onClick={() =>
                  onReportHere?.({
                    type: 'lost',
                    building: selected.label,
                    floor,
                    coordinates: `${selected.label} · ${floor}`,
                  })
                }
              >
                Report an item here
              </NeoButton>
            </footer>
          </motion.aside>
        ) : null}
      </AnimatePresence>
      </div>
    </NeoModal>
  )
}
