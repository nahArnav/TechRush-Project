import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BadgeCheck, CheckCheck, ImagePlus, MapPin, SendHorizonal, ShieldAlert, ShieldCheck, UserRound, X } from 'lucide-react'
import { fetchClaimMessages, fetchMessages, sendClaimMessage, sendMessage, type ChatMessage } from '../api'
import { NeoButton, NeoIconButton, SPRING, Tooltip } from '../neo'
import { emojiFor, type Item } from '../types'
import HandoverModal from './HandoverModal'
import { trackActivity } from '../trackActivity'

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export default function SafeChatPanel({ item, claimId, onClose }: { item: Item | null; claimId?: string; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [bannerOpen, setBannerOpen] = useState(true)
  const [handover, setHandover] = useState<Item | null>(null)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    if (!item) return
    setMessages([])
    const load = claimId ? fetchClaimMessages(claimId) : fetchMessages(item.id)
    load.then((loaded) => {
      if (active) setMessages(loaded)
    })
    return () => {
      active = false
    }
  }, [item, claimId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    const body = text.trim()
    if (!body || !item || sending) return
    setSending(true)
    try {
      const saved = claimId ? await sendClaimMessage(claimId, body) : await sendMessage(item.id, body)
      setMessages((current) => [...current, saved])
      setDraft('')
      trackActivity('chat_message_sent', item.id, { textLength: body.length })
    } finally {
      setSending(false)
    }
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
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={SPRING}
              className="glass fixed inset-0 z-50 m-auto flex h-[86dvh] w-[min(94vw,880px)] flex-col overflow-hidden rounded-neo-lg shadow-float"
            >
              <header className="flex shrink-0 flex-col gap-md border-b border-line-soft px-xl py-lg">
                <div className="flex items-start justify-between gap-md">
                  <div className="flex min-w-0 items-center gap-md">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-neo bg-plate text-xl shadow-extrude-sm">
                      {emojiFor(item.category)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black tracking-tight text-ink">{item.title}</p>
                      <p className="flex min-w-0 items-center gap-sm text-[11px] text-ink-muted">
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
                <div className="flex flex-wrap items-center gap-sm">
                  <span className="flex items-center gap-xs rounded-neo-full bg-plate px-md py-px text-[10px] font-bold text-ink-muted shadow-extrude-sm">
                    <UserRound size={11} /> Secure alias
                  </span>
                  <span className="flex items-center gap-px rounded-neo-full bg-ink px-md py-px text-[9px] font-bold uppercase tracking-widest text-on-ink">
                    <BadgeCheck size={11} /> Verified account
                  </span>
                  <NeoButton
                    size="sm"
                    variant="dark"
                    className="ml-auto"
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
                      <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-on-ink-muted">
                        <span className="font-bold text-on-ink">Stay safe.</span> Meet in public campus areas for item exchanges.
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
                {messages.length ? messages.map((message) => {
                  const mine = message.sender === 'me'
                  return (
                    <div key={message.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[78%] rounded-neo border px-lg py-md text-sm shadow-extrude-sm backdrop-blur-xl ${
                          mine ? 'border-accent-border bg-accent-soft text-ink' : 'border-line-soft bg-plate text-ink'
                        }`}
                      >
                        {message.text}
                      </div>
                      <span className="mt-xs flex items-center gap-xs px-sm text-[10px] tabular-nums text-ink-muted">
                        {timeLabel(message.createdAt)}
                        {mine ? <CheckCheck size={12} className="text-accent" aria-label="Delivered" /> : null}
                      </span>
                    </div>
                  )
                }) : (
                  <div className="flex flex-1 items-center justify-center text-center">
                    <p className="max-w-sm text-sm text-ink-muted">No messages yet. Start the secure chat to arrange details without exposing personal contact info.</p>
                  </div>
                )}
              </div>

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
                      onClick={() => setDraft((current) => current || 'Photo reference shared for handover.')}
                      aria-label="Attach a photo"
                    />
                  </Tooltip>
                  <span className="flex min-w-0 flex-1 items-center rounded-neo-full bg-plate px-xl shadow-carve">
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
                    disabled={!draft.trim() || sending}
                    className={draft.trim() && !sending ? '' : 'opacity-40'}
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
