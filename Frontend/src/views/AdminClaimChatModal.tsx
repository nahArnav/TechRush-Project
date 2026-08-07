import { useEffect, useRef, useState } from 'react'
import { MessageCircle, SendHorizonal, ShieldCheck, X } from 'lucide-react'
import { fetchClaimMessages, sendClaimMessage, type ChatMessage } from '../api'
import { NeoIconButton } from '../neo'
import type { AdminClaim } from '../types'

const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export default function AdminClaimChatModal({ claim, onClose, onRead }: { claim: AdminClaim | null; onClose: () => void; onRead?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!claim) return
    let active = true
    const loadHistory = () => fetchClaimMessages(claim.id, true)
      .then((history) => { if (active) { setMessages(history); onRead?.() } })
      .catch((err) => { if (active) setError(err.message || 'Unable to load messages.') })
    setMessages([])
    setError('')
    loadHistory()
    const poll = window.setInterval(loadHistory, 5000)
    return () => { active = false; window.clearInterval(poll) }
  }, [claim])

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [messages])

  const send = async () => {
    const body = draft.trim()
    if (!claim || !body || sending) return
    setSending(true)
    try {
      const saved = await sendClaimMessage(claim.id, body, true)
      setMessages((current) => [...current, saved])
      setDraft('')
    } catch (err: any) {
      setError(err?.message || 'Message could not be sent.')
    } finally { setSending(false) }
  }

  if (!claim) return null
  const itemTitle = claim.item?.title || claim.itemTitle || claim.itemId
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-scrim p-lg backdrop-blur-sm" onClick={onClose}>
      <section className="glass flex h-[min(82dvh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-neo-lg shadow-float" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-md border-b border-line-soft p-xl">
          <div className="min-w-0">
            <p className="flex items-center gap-sm text-sm font-black text-ink"><MessageCircle size={17} />Safe Chat &amp; Handover</p>
            <p className="mt-xs truncate text-xs text-ink-muted">{itemTitle} · {claim.claimerEmail || claim.claimerId || 'Claimant'}</p>
            <span className="mt-sm inline-flex items-center gap-xs rounded-neo-full bg-ink px-md py-xs text-[9px] font-black uppercase tracking-widest text-on-ink"><ShieldCheck size={11} />Claim #{claim.id.slice(-6)}</span>
          </div>
          <NeoIconButton icon={<X size={17} />} onClick={onClose} aria-label="Close claim chat" />
        </header>
        <div ref={scrollRef} className="no-scrollbar flex flex-1 flex-col gap-md overflow-y-auto p-xl">
          {error ? <p className="rounded-neo border border-status-lost/40 p-md text-xs text-status-lost">{error}</p> : null}
          {messages.length ? messages.map((message) => {
            const mine = message.sender === 'staff'
            return <div key={message.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] rounded-neo border px-lg py-md text-sm ${mine ? 'border-accent-border bg-accent-soft text-ink' : 'border-line-soft bg-plate text-ink'}`}>{message.text}</div>
              <span className="mt-xs px-sm text-[10px] text-ink-muted">{mine ? 'Admin · ' : 'Claimer · '}{timeLabel(message.createdAt)}</span>
            </div>
          }) : !error ? <p className="m-auto max-w-sm text-center text-sm text-ink-muted">No messages yet. Send a secure message to arrange a safe handover.</p> : null}
        </div>
        <form onSubmit={(event) => { event.preventDefault(); send() }} className="flex gap-md border-t border-line-soft p-xl">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Reply to the claimer..." className="h-12 min-w-0 flex-1 rounded-neo bg-plate px-lg text-sm text-ink shadow-carve focus:outline-none" />
          <NeoIconButton type="submit" icon={<SendHorizonal size={18} />} aria-label="Send reply" disabled={!draft.trim() || sending} />
        </form>
      </section>
    </div>
  )
}
