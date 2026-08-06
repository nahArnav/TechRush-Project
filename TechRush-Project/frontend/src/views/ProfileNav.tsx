import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, LogOut, UserCheck } from 'lucide-react'
import { GlassPanel, NeoIconButton, NeoPill, SPRING, ThemeToggle } from '../neo'
import { ROLE_LABELS, type Role } from '../types'

/*
 * Top profile navigation. Houses the user ID badge, role switcher, theme switch (Module 1),
 * notifications bell (Feature 6), and sign-out button — all monochrome and neatly aligned.
 */
const ALERTS = [
  { title: 'New AI match', body: 'A silver laptop matches your lost report (92%).' },
  { title: 'Claim in review', body: 'Your AirPods claim moved to Review.' },
  { title: 'Saved search alert', body: '“Black wallet” — 2 new found items.' },
]

export default function ProfileNav({
  role,
  userId,
  onRole,
  offline,
  onToggleOffline,
  onSignOut,
}: {
  role: Role
  userId?: string
  onRole: (r: Role) => void
  offline?: boolean
  onToggleOffline?: () => void
  onSignOut: () => void
}) {
  const [bellOpen, setBellOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-lg px-2xl py-lg">
      <div className="flex items-center gap-md">
        <div className="glass flex items-center gap-md rounded-neo-full px-md py-md shadow-glass">
          <span className="flex size-9 items-center justify-center rounded-neo-full bg-ink text-sm font-black text-on-dark">
            F
          </span>
          <span className="pr-md text-sm font-black uppercase tracking-[0.25em] text-ink">FindIt</span>
        </div>

        {userId ? (
          <div className="glass hidden sm:flex items-center gap-xs rounded-neo-full px-lg py-sm shadow-glass text-xs font-bold text-ink">
            <UserCheck size={14} className="text-ink-muted" />
            <span className="text-ink-muted uppercase tracking-widest text-[10px]">ID:</span>
            <span className="font-black tracking-wide">{userId}</span>
          </div>
        ) : null}
      </div>

      <div className="glass flex items-center gap-xs rounded-neo-full p-1 shadow-glass">
        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
          <NeoPill key={r} active={role === r} onClick={() => onRole(r)}>
            {ROLE_LABELS[r]}
          </NeoPill>
        ))}
      </div>

      <div className="flex items-center gap-md">
        <ThemeToggle />

        {/* Notifications (Feature 6) */}
        <div className="relative">
          <NeoIconButton
            icon={<Bell size={16} />}
            onClick={() => setBellOpen((o) => !o)}
            aria-label="Notifications"
            aria-expanded={bellOpen}
            className={bellOpen ? 'shadow-carve' : ''}
          />
          <span className="pointer-events-none absolute right-2 top-2 size-2 rounded-neo-full bg-ink" />
          <AnimatePresence>
            {bellOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={SPRING}
                className="absolute right-0 top-14 z-[100] w-72"
              >
                <GlassPanel className="p-md shadow-float">
                  <p className="px-md py-sm text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">
                    Notifications
                  </p>
                  <div className="flex flex-col">
                    {ALERTS.map((a, i) => (
                      <div key={i} className="rounded-neo px-md py-md hover:bg-ink/5">
                        <p className="text-sm font-bold text-ink">{a.title}</p>
                        <p className="text-xs text-ink-muted">{a.body}</p>
                      </div>
                    ))}
                  </div>
                </GlassPanel>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <NeoIconButton icon={<LogOut size={16} />} onClick={onSignOut} aria-label="Sign out" />
      </div>
    </header>
  )
}
