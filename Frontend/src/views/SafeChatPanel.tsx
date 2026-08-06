import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BadgeCheck, CheckCheck, ImagePlus, MapPin, SendHorizonal, ShieldAlert, ShieldCheck, UserRound, X } from 'lucide-react'
import { NeoButton, NeoIconButton, SPRING, Tooltip } from '../neo'
import { emojiFor, type Item } from '../types'
import HandoverModal from './HandoverModal'

/*
 * Safe Chat (Features 14, 7). A slide-out panel with:
 *   • Top bar — masked alias + verified-student badge + "Propose handover" action
 *   • A dismissible safety banner about safe meeting locations
 *   • A claim-item context card pinned above the conversation
 *   • Timestamped bubbles (sender vs receiver) with image attachments
 *   • An input bar — text field + attachment icon + send button
 * Strictly monochrome, token-driven.
 */
type Msg = { from: 'them' | 'me'; text: string; time: string; image?: boolean }

const now = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export default function SafeChatPanel({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([
    { from: 'them', text: 'Hi! I found this item near the help desk. Happy to arrange a safe handover.', time: '10:24 AM' },
  ])
  const [draft, setDraft] = useState('')
  const [bannerOpen, setBannerOpen] = useState(true)
  const [handover, setHandover] = useState<Item | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = (text: string, image = false) => {
    const body = text.trim()
    if (!body && !image) return
    setMessages((m) => [...m, { from: 'me', text: image ? 'Photo attached' : body, time: now(), image }])
    setDraft('')
    setTimeout(
      () => setMessages((m) => [...m, { from: 'them', text: 'Great — let’s set up a safe handover.', time: now() }]),
      700,
    )
  }

  return (
    <>
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
              className="glass fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-md flex-col shadow-float"
            >
              {/* Top bar — item thumbnail, title, status badge, anonymised user */}
              <header className="flex shrink-0 flex-col gap-md border-b border-line-soft px-xl py-lg">
                <div className="flex items-start justify-between gap-md">
                  <div className="flex min-w-0 items-center gap-md">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-neo bg-plate text-xl shadow-extrude-sm">
                      {emojiFor(item.category)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black tracking-tight text-ink">{item.title}</p>
                      <p className="flex items-center gap-sm text-[11px] text-ink-muted">
                        <span
                          className={`rounded-neo-full border px-md py-px text-[9px] font-black uppercase tracking-widest ${
                            item.type === 'found'
                              ? 'border-status-found/50 text-status-found'
                              : 'border-status-lost/50 text-status-lost'
                          }`}
                        >
                          {item.type === 'found' ? 'Found' : 'Lost'}
                        </span>
                        <span className="flex min-w-0 items-center gap-xs truncate">
                          <MapPin size={10} /> {item.location}
                        </span>
                      </p>
                    </div>
                  </div>
                  <NeoIconButton size="sm" icon={<X size={16} />} onClick={onClose} aria-label="Close chat" />
                </div>
                {/* Anonymised user identity — alias only, never a real name */}
                <div className="flex items-center gap-sm">
                  <span className="flex items-center gap-xs rounded-neo-full bg-plate px-md py-px text-[10px] font-bold text-ink-muted shadow-extrude-sm">
                    <UserRound size={11} /> Finder&nbsp;#4821
                  </span>
                  <span className="flex items-center gap-px rounded-neo-full bg-ink px-md py-px text-[9px] font-bold uppercase tracking-widest text-on-ink">
                    <BadgeCheck size={11} /> Verified student
                  </span>
                </div>
                <NeoButton
                  size="sm"
                  variant="dark"
                  className="w-full"
                  iconStart={<ShieldCheck size={14} />}
                  onClick={() => setHandover(item)}
                >
                  Propose handover
                </NeoButton>
              </header>

              {/* Dismissible safety banner */}
              <AnimatePresence initial={false}>
                {bannerOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden px-xl"
                  >
                    <div className="mt-lg flex items-start gap-md rounded-neo bg-ink p-lg shadow-float">
                      <ShieldAlert size={16} className="mt-px shrink-0 text-on-ink" />
                      <p className="flex-1 text-[11px] leading-relaxed text-on-ink-muted">
                        <span className="font-bold text-on-ink">Stay safe.</span> Meet in public campus areas
                        (e.g., Canteen, Library Gate) for item exchanges.
                      </p>
                      <button
                        onClick={() => setBannerOpen(false)}
                        aria-label="Dismiss safety notice"
                        className="shrink-0 text-on-ink-muted transition-colors hover:text-on-ink"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Conversation */}
              <div ref={scrollRef} className="no-scrollbar flex flex-1 flex-col gap-lg overflow-y-auto p-xl">
                {messages.map((m, i) => {
                  const mine = m.from === 'me'
                  return (
                    <div key={i} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                      <div
                        /* Mine: accent glass blue. Theirs: translucent dark slate. */
                        className={`max-w-[80%] rounded-neo border px-lg py-md text-sm shadow-extrude-sm backdrop-blur-xl ${
                          mine ? 'border-accent-border bg-accent-soft text-ink' : 'border-line-soft bg-plate text-ink'
                        }`}
                      >
                        {m.image ? (
                          <span className="flex items-center gap-sm text-xs font-medium">
                            <ImagePlus size={14} /> Photo attached
                          </span>
                        ) : (
                          m.text
                        )}
                      </div>
                      <span className="mt-xs flex items-center gap-xs px-sm text-[10px] tabular-nums text-ink-muted">
                        {m.time}
                        {mine ? <CheckCheck size={12} className="text-accent" aria-label="Delivered" /> : null}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Input bar — attachment + text field + send */}
              <footer className="shrink-0 border-t border-line-soft p-xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    send(draft)
                  }}
                  className="flex items-center gap-md"
                >
                  <Tooltip label="Attach a photo">
                    <NeoIconButton
                      type="button"
                      icon={<ImagePlus size={18} />}
                      onClick={() => send('', true)}
                      aria-label="Attach a photo"
                    />
                  </Tooltip>
                  <span className="flex flex-1 items-center rounded-neo-full bg-plate px-xl shadow-carve">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Write a message…"
                      className="h-12 w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                    />
                  </span>
                  <NeoIconButton
                    type="submit"
                    icon={<SendHorizonal size={18} />}
                    aria-label="Send message"
                    disabled={!draft.trim()}
                    className={draft.trim() ? '' : 'opacity-40'}
                  />
                </form>
              </footer>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <HandoverModal item={handover} onClose={() => setHandover(null)} />
    </>
  )
}
