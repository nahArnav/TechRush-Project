import { motion } from 'framer-motion'

/*
 * The Moving Liquid (Module 1). Sits behind the global frost at z-[-1]: four
 * massive, heavily blurred blobs that slowly drift + scale forever. Colors are
 * theme tokens (soft tints in light, grey clouds in dark) so they stay editable
 * from the CSS. Positions use viewport % (left/top); motion uses pixel transforms
 * — framer-motion animates numeric px keyframes reliably (unlike unit strings).
 */
const BLOBS = [
  { color: 'var(--blob-1)', size: 640, left: '5%', top: '2%', dx: 260, dy: 180, d: 26 },
  { color: 'var(--blob-2)', size: 560, left: '58%', top: '0%', dx: -300, dy: 220, d: 32 },
  { color: 'var(--blob-3)', size: 700, left: '20%', top: '48%', dx: 320, dy: -200, d: 30 },
  { color: 'var(--blob-4)', size: 520, left: '62%', top: '52%', dx: -240, dy: -160, d: 36 },
]

export default function LiquidBlobs() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
      {BLOBS.map((b, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, scale: 1 }}
          animate={{ x: [0, b.dx, 0], y: [0, b.dy, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: b.d, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute rounded-full blur-[110px]"
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            backgroundColor: b.color,
            opacity: 'var(--blob-opacity)',
          }}
        />
      ))}
    </div>
  )
}
