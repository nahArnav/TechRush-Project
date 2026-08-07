import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, LifeBuoy, LogOut, User, UserCheck } from 'lucide-react'
import { GlassPanel, NeoIconButton, SPRING, ThemeToggle, Tooltip } from '../neo'
import { ROLE_LABELS, type Notification, type Role } from '../types'

export default function ProfileNav({
  role,
  authRole,
  userId,
  onProfile,
  onSupport,
  onSignOut,
  notifications = [],
}: {
  role: Role
  authRole: Role
  userId?: string
  notifications?: Notification[]
  onProfile: () => void
  onSupport: () => void
  onSignOut: () => void
}) {
  const [bellOpen, setBellOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-lg px-2xl py-lg">
      <div className="flex items-center gap-md">
        <div className="glass flex items-center gap-md rounded-neo-full px-md py-md shadow-glass">
          <span className="flex size-9 items-center justify-center rounded-neo-full bg-ink text-base font-black lowercase text-on-ink">
            f
          </span>
          <span className="pr-md text-sm font-black tracking-[0.1em] text-ink">
            Find<span className="text-ink-muted">It</span>
          </span>
        </div>

        {userId ? (
          <div className="glass hidden items-center gap-xs rounded-neo-full px-lg py-sm text-xs font-bold text-ink shadow-glass sm:flex">
            <UserCheck size={14} className="text-ink-muted" />
            <span className="text-[10px] uppercase tracking-widest text-ink-muted">ID:</span>
            <span className="font-black tracking-wide">{userId}</span>
          </div>
        ) : null}
      </div>

      <div className="glass hidden items-center rounded-neo-full px-lg py-sm text-xs font-black uppercase tracking-widest text-ink shadow-glass sm:flex">
        {ROLE_LABELS[authRole]}
      </div>

      <div className="flex items-center gap-md">
        <ThemeToggle />

        <div className="relative">
          <Tooltip label="Notifications">
            <NeoIconButton
              icon={<Bell size={16} />}
              onClick={() => setBellOpen((o) => !o)}
              aria-label="Notifications"
              aria-expanded={bellOpen}
              className={bellOpen ? 'shadow-carve' : ''}
            />
          </Tooltip>
          {notifications.length ? <span className="pointer-events-none absolute right-2 top-2 size-2 rounded-neo-full bg-ink" /> : null}
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
                    {notifications.length ? notifications.map((a, i) => (
                      <div key={i} className="rounded-neo px-md py-md hover:bg-ink/5">
                        <p className="text-sm font-bold text-ink">{a.title}</p>
                        <p className="text-xs text-ink-muted">{a.body}</p>
                      </div>
                    )) : (
                      <div className="rounded-neo px-md py-md">
                        <p className="text-sm font-bold text-ink">No notifications yet</p>
                        <p className="text-xs text-ink-muted">New report, claim, and search updates will appear here.</p>
                      </div>
                    )}
                  </div>
                </GlassPanel>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <Tooltip label="My Profile">
          <NeoIconButton icon={<User size={16} />} onClick={onProfile} aria-label="My Profile" />
        </Tooltip>
        <Tooltip label="Support & help">
          <NeoIconButton icon={<LifeBuoy size={16} />} onClick={onSupport} aria-label="Support and help" />
        </Tooltip>
        <Tooltip label="Sign out">
          <NeoIconButton icon={<LogOut size={16} />} onClick={onSignOut} aria-label="Sign out" />
        </Tooltip>
      </div>
    </header>
  )
}
