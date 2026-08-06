import { useState } from 'react'
import { NeoModal } from '../neo'

/*
 * 2.5D Isometric Campus Map (Module 3, Feature 5). A flat SVG map tilted into a
 * fake-3D plane with CSS isometric transforms (no Three.js). Click anywhere to
 * drop a floating pin with a drop shadow directly beneath it. Zones glow on hover.
 */
type Pin = { x: number; y: number }
const ZONES = [
  { id: 'library', label: 'Library', x: 18, y: 20, w: 34, h: 26 },
  { id: 'canteen', label: 'Canteen', x: 60, y: 30, w: 30, h: 24 },
  { id: 'sports', label: 'Sports Ground', x: 22, y: 56, w: 44, h: 30 },
]

export default function CampusMapModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [pin, setPin] = useState<Pin | null>({ x: 40, y: 40 })
  const [hover, setHover] = useState<string | null>(null)

  const drop = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setPin({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  }

  return (
    <NeoModal isOpen={isOpen} onClose={onClose} title="Where was it?">
      <div className="flex flex-col gap-lg">
        <p className="text-center text-xs text-ink-muted">Tap the map to mark the exact spot.</p>

        {/* Perspective stage */}
        <div className="flex h-72 items-center justify-center" style={{ perspective: '1000px' }}>
          <div
            onClick={drop}
            className="relative cursor-crosshair rounded-neo bg-plate shadow-carve"
            style={{
              width: 300,
              height: 300,
              transform: 'rotateX(60deg) rotateZ(-45deg) scale(0.82)',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* grid */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full opacity-30">
              {Array.from({ length: 11 }).map((_, i) => (
                <g key={i} stroke="var(--line)" strokeWidth="0.4">
                  <line x1={i * 10} y1="0" x2={i * 10} y2="100" />
                  <line x1="0" y1={i * 10} x2="100" y2={i * 10} />
                </g>
              ))}
            </svg>

            {/* zones */}
            {ZONES.map((z) => (
              <div
                key={z.id}
                onMouseEnter={() => setHover(z.id)}
                onMouseLeave={() => setHover(null)}
                className="absolute rounded-neo-sm border transition-all"
                style={{
                  left: `${z.x}%`,
                  top: `${z.y}%`,
                  width: `${z.w}%`,
                  height: `${z.h}%`,
                  background: hover === z.id ? 'var(--ink)' : 'var(--glass-strong)',
                  borderColor: 'var(--line)',
                  boxShadow: hover === z.id ? '0 0 24px 4px var(--blob-1)' : 'var(--sh-glass)',
                }}
              >
                <span
                  className="absolute left-1 top-1 text-[7px] font-black uppercase tracking-widest"
                  style={{
                    color: hover === z.id ? 'var(--on-dark)' : 'var(--ink-muted)',
                    transform: 'rotateZ(45deg) rotateX(-60deg)',
                    transformOrigin: 'left top',
                  }}
                >
                  {z.label}
                </span>
              </div>
            ))}

            {/* dropped pin — floats above the plane with a shadow directly below */}
            {pin ? (
              <div className="absolute" style={{ left: `${pin.x}%`, top: `${pin.y}%` }}>
                <span
                  className="absolute rounded-full"
                  style={{ width: 16, height: 8, background: 'rgba(0,0,0,0.35)', filter: 'blur(3px)', transform: 'translate(-50%, -50%)' }}
                />
                <span
                  className="absolute block size-4 rounded-full rounded-br-none bg-ink"
                  style={{ transform: 'translate(-50%, -100%) translateZ(40px) rotateZ(45deg) rotateX(-60deg)', boxShadow: '0 6px 10px rgba(0,0,0,0.4)' }}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-sm">
          {ZONES.map((z) => (
            <button
              key={z.id}
              onMouseEnter={() => setHover(z.id)}
              onMouseLeave={() => setHover(null)}
              className={`rounded-neo-full bg-plate px-lg py-md text-xs font-medium tracking-wide text-ink ${hover === z.id ? 'shadow-carve' : 'shadow-extrude-sm'}`}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>
    </NeoModal>
  )
}
