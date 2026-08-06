import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, Check, Clock, ShieldCheck, X } from 'lucide-react'
import { NeoButton, NeoIconButton, NeoPill, SPRING } from '../neo'
import type { Item } from '../types'

/*
 * Safe Chat + Handover (Features 14, 15, 7). A slide-out panel with neumorphically
 * extruded bubbles, tap-only quick replies (no free typing required), a carved
 * scheduling module, and a stark high-contrast one-time collection code.
 */
type Msg = { from: 'them' | 'me'; text: string }
const QUICK_REPLIES = ['Yes, that’s mine!', 'Where can I collect it?', 'What are the timings?', 'Thank you!']
const DATES = ['Mon 4', 'Tue 5', 'Wed 6', 'Thu 7']
const SLOTS = ['9–10 AM', '11–12 PM', '2–3 PM', '4–5 PM']

export default function SafeChatPanel({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([
    { from: 'them', text: 'Hi! I found this item near the help desk. Happy to arrange a safe handover.' },
  ])
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('')
  const [code, setCode] = useState<string | null>(null)

  const send = (text: string) => {
    setMessages((m) => [...m, { from: 'me', text }])
    setTimeout(
      () => setMessages((m) => [...m, { from: 'them', text: 'Great — pick a slot below and I’ll confirm.' }]),
      600,
    )
  }

  const confirm = () => {
    const c = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')
    setCode(c)
  }

  return (
    <AnimatePresence>
      {item ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-scrim backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={SPRING}
            className="glass fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col shadow-float"
          >
            <header className="flex items-center justify-between gap-md border-b border-line-soft px-xl py-lg">
              <div className="flex items-center gap-md">
                <span className="flex size-9 items-center justify-center rounded-neo-full bg-plate text-ink shadow-extrude-sm">
                  <ShieldCheck size={16} />
                </span>
                <div>
                  <p className="text-sm font-black tracking-tight text-ink">Safe Chat</p>
                  <p className="text-[11px] text-ink-muted">Re: {item.title}</p>
                </div>
              </div>
              <NeoIconButton size="sm" icon={<X size={16} />} onClick={onClose} aria-label="Close chat" />
            </header>

            <div className="no-scrollbar flex flex-1 flex-col gap-md overflow-y-auto p-xl">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-neo px-lg py-md text-sm shadow-extrude-sm ${m.from === 'me' ? 'bg-ink text-on-dark' : 'bg-plate text-ink'}`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Handover scheduling (Features 15 & 7) */}
              <div className="mt-md rounded-neo bg-plate p-lg shadow-carve">
                <p className="mb-md flex items-center gap-sm text-[11px] font-black uppercase tracking-[0.2em] text-ink">
                  <Calendar size={13} /> Collection date
                </p>
                <div className="mb-lg flex flex-wrap gap-sm">
                  {DATES.map((d) => (
                    <NeoPill key={d} active={date === d} onClick={() => setDate(d)}>
                      {d}
                    </NeoPill>
                  ))}
                </div>
                <p className="mb-md flex items-center gap-sm text-[11px] font-black uppercase tracking-[0.2em] text-ink">
                  <Clock size={13} /> Available time slot
                </p>
                <div className="flex flex-wrap gap-sm">
                  {SLOTS.map((s) => (
                    <NeoPill key={s} active={slot === s} onClick={() => setSlot(s)}>
                      {s}
                    </NeoPill>
                  ))}
                </div>

                {code ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={SPRING}
                    className="mt-lg rounded-neo bg-ink p-lg text-center shadow-float"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-dark-muted">
                      One-time collection code
                    </p>
                    <p className="mt-sm font-black tracking-[0.4em] text-on-dark" style={{ fontSize: 30 }}>
                      {code}
                    </p>
                    <p className="mt-sm text-[11px] text-on-dark-muted">
                      Show this at the security desk on {date}, {slot}
                    </p>
                  </motion.div>
                ) : (
                  <NeoButton
                    className="mt-lg w-full"
                    disabled={!date || !slot}
                    iconStart={<Check size={15} />}
                    onClick={confirm}
                  >
                    Confirm handover
                  </NeoButton>
                )}
              </div>
            </div>

            {/* Predefined quick replies — no typing required (Feature 14) */}
            <footer className="border-t border-line-soft p-xl">
              <p className="mb-md text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">
                Quick replies
              </p>
              <div className="flex flex-wrap gap-sm">
                {QUICK_REPLIES.map((q) => (
                  <NeoPill key={q} onClick={() => send(q)}>
                    {q}
                  </NeoPill>
                ))}
              </div>
            </footer>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}
