import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgeCheck,
  CheckCheck,
  ImagePlus,
  MapPin,
  Paperclip,
  SendHorizonal,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'
import { NeoButton, NeoIconButton, SPRING, Tooltip } from '../neo'
import { emojiFor, type Item } from '../types'
import HandoverModal from './HandoverModal'
import { trackActivity } from '../trackActivity'

type Msg = { from: 'them' | 'me'; text: string; time: string; image?: boolean }

const now = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

const QUICK_REPLIES = [
  'Can we meet at the library desk?',
  'I can share one more identifying detail.',
  'Please use a public handover zone.',
]

export default function SafeChatPanel({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [draft, setDraft] = useState('')
  const [bannerOpen, setBannerOpen] = useState(true)
  const [handover, setHandover] = useState<Item | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!item) return
    setBannerOpen(true)
    setDraft('')
    setMessages([
      {
        from: 'them',
        text: item.type === 'found'
          ? 'Hi, I have this item safely with me. Let us confirm details before the handover.'
          : 'Hi, I think this may be yours. Please share a detail only the owner would know.',
        time: now(),
      },
    ])
  }, [item])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = (text: string, image = false) => {
    const body = text.trim()
    if (!body && !image) return
    setMessages((m) => [...m, { from: 'me', text: image ? 'Photo attached for verification.' : body, time: now(), image }])
    setDraft('')
    trackActivity(image ? 'photo_attached' : 'chat_message_sent', item?.id, image ? undefined : { textLength: body.length })
    window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          from: 'them',
          text: 'Thanks. Once both sides are comfortable, we can confirm a monitored handover zone.',
          time: now(),
        },
      ])
    }, 700)
  }

  return createPortal(
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
              className="glass fixed right-0 top-0 z-[1000] flex h-[100dvh] w-[min(100vw,42rem)] max-w-none flex-col overflow-hidden shadow-float"
            >
              <header className="flex shrink-0 flex-col gap-lg border-b border-line-soft px-xl py-lg">
                <div className="flex items-start justify-between gap-md">
                  <div className="flex min-w-0 items-center gap-md">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-neo bg-plate text-xl shadow-extrude-sm">
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
                          {item.type}
                        </span>
                        <span className="flex min-w-0 items-center gap-xs truncate">
                          <MapPin size={10} /> {item.location}
                        </span>
                      </p>
                    </div>
                  </div>
                  <NeoIconButton size="sm" icon={<X size={16} />} onClick={onClose} aria-label="Close chat" />
                </div>

                <div className="grid gap-md sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="flex min-w-0 items-center gap-md rounded-neo bg-plate p-md shadow-carve-sm">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-neo-full bg-ink text-on-ink">
                      <UserRound size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-ink">Finder #4821</p>
                      <p className="flex items-center gap-xs text-[11px] font-bold text-ink-muted">
                        <BadgeCheck size={12} /> Verified student
                      </p>
                    </div>
                  </div>
                  <NeoButton
                    size="sm"
                    variant="dark"
                    className="w-full sm:w-auto"
                    iconStart={<ShieldCheck size={14} />}
                    onClick={() => {
                      setHandover(item)
                      trackActivity('handover_proposed', item.id)
                    }}
                  >
                    Propose handover
                  </NeoButton>
                </div>
              </header>

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
                        <span className="font-bold text-on-ink">Stay safe.</span> Keep personal details private and meet only at monitored campus desks.
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

              <div ref={scrollRef} className="no-scrollbar flex flex-1 flex-col gap-lg overflow-y-auto p-xl">
                <div className="rounded-neo bg-plate p-lg shadow-carve-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">Item context</p>
                  <p className="mt-xs text-sm font-bold text-ink">{item.description}</p>
                </div>

                {messages.map((m, i) => {
                  const mine = m.from === 'me'
                  return (
                    <div key={i} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[82%] rounded-neo border px-lg py-md text-sm shadow-extrude-sm backdrop-blur-xl ${
                          mine ? 'border-accent-border bg-accent-soft text-ink' : 'border-line-soft bg-plate text-ink'
                        }`}
                      >
                        {m.image ? (
                          <span className="flex items-center gap-sm text-xs font-medium">
                            <ImagePlus size={14} /> {m.text}
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

              <div className="shrink-0 border-t border-line-soft p-xl">
                <div className="mb-md flex gap-sm overflow-x-auto pb-xs">
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      onClick={() => send(reply)}
                      className="shrink-0 rounded-neo-full bg-plate px-lg py-sm text-[11px] font-bold text-ink shadow-extrude-sm"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
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
                      icon={<Paperclip size={18} />}
                      onClick={() => send('', true)}
                      aria-label="Attach a photo"
                    />
                  </Tooltip>
                  <span className="flex flex-1 items-center rounded-neo-full bg-plate px-xl shadow-carve">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Write a message..."
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
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <HandoverModal item={handover} onClose={() => setHandover(null)} />
    </>,
    document.body,
  )
}
