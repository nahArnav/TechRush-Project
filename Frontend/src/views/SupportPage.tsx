import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Clock, LifeBuoy, Mail, Phone, Send } from 'lucide-react'
import { GlassCard, GlassPanel, LaneTitle, NeoButton, NeoInput, NeoSelect, useToast } from '../neo'

/*
 * Support & Help (Directive 6). A full-width page frame on the same glassmorphism
 * grid as the dashboards: contact cards, an FAQ accordion, and a report-an-issue
 * form. Every value resolves to a design-system token.
 */
const CONTACTS = [
  { icon: <Mail size={18} />, label: 'Support email', value: 'findit.support@pict.edu' },
  { icon: <Phone size={18} />, label: 'Help desk', value: '+91 20 2437 0000' },
  { icon: <Clock size={18} />, label: 'Support hours', value: 'Mon – Sat · 9 AM – 7 PM' },
]

const FAQS = [
  {
    q: 'How soon should I report a lost item?',
    a: 'As soon as you notice it missing. Reports filed within the first hour match against found items far more often, because finders usually hand items in the same day.',
  },
  {
    q: 'How does the AI match my item?',
    a: 'We compare your description, category, last-seen location, and photo against every open found report on campus, then surface anything above an 85% confidence score in your AI Matches lane.',
  },
  {
    q: 'What proof of ownership do I need?',
    a: 'Details only the owner would know — a lock-screen wallpaper, the cards in a wallet, an engraving. Campus IDs and other sensitive items are always released in person through campus security.',
  },
  {
    q: 'Where do handovers happen?',
    a: 'Only in monitored Safe Handover Zones: the Campus Security Office, the Main Library desk, or Admin Block reception. Never arrange a private meeting off-campus.',
  },
  {
    q: 'Can I request CCTV footage?',
    a: 'Yes. Use the CCTV request in the dock with the place and approximate time. Security reviews the footage privately and replies within 24 hours — footage is never shared with students.',
  },
]

const ISSUE_TYPES = [
  { value: 'claim', label: 'Problem with a claim' },
  { value: 'account', label: 'Account or sign-in issue' },
  { value: 'report', label: 'Report an incorrect listing' },
  { value: 'safety', label: 'Safety concern' },
  { value: 'other', label: 'Something else' },
]

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-neo bg-plate shadow-extrude-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-lg px-lg py-lg text-left"
      >
        <span className="text-sm font-bold text-ink">{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="shrink-0 text-ink-muted">
          <ChevronDown size={16} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-lg pb-lg text-xs leading-relaxed text-ink-soft">{a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default function SupportPage() {
  const { push } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [issue, setIssue] = useState('claim')
  const [message, setMessage] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    push({ title: 'Issue reported', description: 'Our support team will reply by email.' })
    setName('')
    setEmail('')
    setMessage('')
  }

  return (
    <main className="flex-1 px-2xl py-3xl pb-32">
      <div className="mx-auto flex max-w-6xl flex-col gap-3xl">
        <div className="flex flex-col gap-xs">
          <h1 className="flex items-center gap-md text-3xl font-light tracking-tight text-ink">
            <LifeBuoy size={28} /> Support &amp; <span className="font-black">Help</span>
          </h1>
          <p className="text-sm text-ink-muted">
            Guidance on campus lost-and-found, plus a direct line to the FindIt team.
          </p>
        </div>

        {/* Contact info cards */}
        <div className="grid gap-xl sm:grid-cols-3">
          {CONTACTS.map((c) => (
            <GlassCard key={c.label} className="flex items-center gap-lg p-xl">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-neo-full bg-plate text-ink shadow-extrude-sm">
                {c.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">{c.label}</p>
                <p className="truncate text-sm font-bold text-ink">{c.value}</p>
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="grid gap-2xl lg:grid-cols-5">
          {/* FAQ accordion */}
          <GlassPanel className="flex flex-col gap-lg p-2xl shadow-extrude lg:col-span-3">
            <LaneTitle>Frequently asked</LaneTitle>
            <div className="flex flex-col gap-md">
              {FAQS.map((f) => (
                <Faq key={f.q} {...f} />
              ))}
            </div>
          </GlassPanel>

          {/* Report an issue */}
          <GlassPanel className="flex flex-col gap-lg p-2xl shadow-extrude lg:col-span-2">
            <LaneTitle>Report an issue</LaneTitle>
            <form onSubmit={submit} className="flex flex-col gap-lg">
              <label className="flex flex-col gap-sm">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">Name</span>
                <NeoInput value={name} onChange={setName} placeholder="Your full name" />
              </label>
              <label className="flex flex-col gap-sm">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">Email</span>
                <NeoInput type="email" value={email} onChange={setEmail} placeholder="you@pict.edu" />
              </label>
              <label className="flex flex-col gap-sm">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">Issue type</span>
                <NeoSelect value={issue} onChange={setIssue} options={ISSUE_TYPES} />
              </label>
              <label className="flex flex-col gap-sm">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">Message</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what went wrong."
                  className="min-h-32 w-full resize-y rounded-neo bg-plate px-lg py-md text-sm text-ink shadow-carve placeholder:text-ink-muted focus:outline-none"
                />
              </label>
              <NeoButton
                type="submit"
                variant="dark"
                className="w-full"
                iconEnd={<Send size={15} />}
                disabled={!name.trim() || !email.trim() || !message.trim()}
              >
                Submit request
              </NeoButton>
            </form>
          </GlassPanel>
        </div>
      </div>
    </main>
  )
}
