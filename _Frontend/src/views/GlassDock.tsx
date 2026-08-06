import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SPRING, Tooltip } from '../neo'

/*
 * Floating, auto-hiding Glass Dock (Module 2). Replaces sidebars for primary
 * navigation. Rises from the bottom on scroll-up / mouse-near-bottom and tucks
 * away on scroll-down. Icon-first, macOS-style magnifying hover.
 */
export type DockItem = { id: string; label: string; icon: React.ReactNode; onClick: () => void; active?: boolean }

export default function GlassDock({ items }: { items: DockItem[] }) {
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      // Functional update: React bails out when the boolean is unchanged, so a
      // burst of scroll events can never drive a re-render loop.
      setVisible((prev) => {
        const next = y < lastY.current || y < 40
        lastY.current = y
        return prev === next ? prev : next
      })
    }
    const onMove = (e: MouseEvent) => {
      if (e.clientY > window.innerHeight - 90) setVisible((prev) => prev || true)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-center pb-2xl">
      <AnimatePresence>
        {visible ? (
          <motion.nav
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={SPRING}
            className="glass pointer-events-auto flex items-center gap-lg rounded-neo-full px-xl py-lg shadow-glass-lg"
          >
            {items.map((it) => (
              <Tooltip key={it.id} label={it.label} side="top">
                <motion.button
                  onClick={it.onClick}
                  whileHover={{ y: -6, scale: 1.1 }}
                  whileTap={{ scale: 0.92 }}
                  transition={SPRING}
                  aria-label={it.label}
                  className={`flex size-12 items-center justify-center rounded-neo-full bg-plate text-ink ${it.active ? 'shadow-carve' : 'shadow-extrude-sm'}`}
                >
                  {it.icon}
                </motion.button>
              </Tooltip>
            ))}
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
