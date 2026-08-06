import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Check, Clock, Landmark, MapPin, QrCode, ShieldCheck } from 'lucide-react'
import { NeoButton, NeoModal, NeoPill, SPRING } from '../neo'
import type { Item } from '../types'
import { trackActivity } from '../trackActivity'

/*
 * Handover Verification (Features 7 & 15). A guided, safety-first exchange: pick a
 * monitored Safe Handover Zone, choose a time, then reveal a one-time 4-digit code
 * + stylised QR to confirm identity at the desk. Strictly monochrome, token-driven.
 */
const ZONES = [
  { id: 'security', label: 'Campus Security Office', hint: 'Staffed 24/7 · CCTV', icon: <ShieldCheck size={18} /> },
  { id: 'library', label: 'Main Library Desk', hint: 'Open 8 AM – 10 PM', icon: <Landmark size={18} /> },
  { id: 'admin', label: 'Admin Block Reception', hint: 'Open 9 AM – 6 PM', icon: <Building2 size={18} /> },
]
const SLOTS = ['9–10 AM', '11–12 PM', '2–3 PM', '4–5 PM']

// Deterministic monochrome QR-style plate keyed to the code.
function QrPlate({ seed }: { seed: string }) {
  const n = 9
  const base = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 11)
  const cells = Array.from({ length: n * n }, (_, i) => {
    const x = i % n
    const y = Math.floor(i / n)
    const finder = (fx: number, fy: number) => x >= fx && x < fx + 3 && y >= fy && y < fy + 3
    if (finder(0, 0) || finder(n - 3, 0) || finder(0, n - 3)) return (x + y) % 2 === 0
    return ((base * (x + 2) * (y + 3)) >> 1) % 3 === 0
  })
  return (
    /* White wrapper keeps the black-on-white code sharp on dark glass (Directive 4B) */
    <div className="rounded-neo bg-white p-lg">
      <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, width: 108 }}>
        {cells.map((on, i) => (
          <span key={i} className={`aspect-square ${on ? 'bg-black' : 'bg-transparent'}`} />
        ))}
      </div>
    </div>
  )
}

const PIN_LENGTH = 6

/* Digit-box PIN display / entry (Task 4B). Read-only when `value` is fixed. */
function PinBoxes({
  value,
  onChange,
  tone = 'light',
}: {
  value: string
  onChange?: (v: string) => void
  tone?: 'light' | 'dark'
}) {
  const digits = Array.from({ length: PIN_LENGTH }, (_, i) => value[i] ?? '')
  const boxes = (
    <div className="flex justify-center gap-sm" aria-hidden={!!onChange}>
      {digits.map((d, i) => (
        <span
          key={i}
          className={`flex size-11 items-center justify-center rounded-neo text-xl font-black tabular-nums ${
            tone === 'dark' ? 'bg-white/10 text-on-ink' : 'bg-plate text-ink shadow-carve'
          }`}
        >
          {d || <span className={tone === 'dark' ? 'text-on-ink-muted' : 'text-ink-muted'}>·</span>}
        </span>
      ))}
    </div>
  )
  if (!onChange) return boxes
  return (
    <label className="relative block">
      {boxes}
      {/* A single invisible field drives all six boxes — keeps mobile keyboards happy. */}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH))}
        inputMode="numeric"
        aria-label="Enter handover code"
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      />
    </label>
  )
}

export default function HandoverModal({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const [zone, setZone] = useState('')
  const [slot, setSlot] = useState('')
  const [side, setSide] = useState<'finder' | 'seeker'>('finder')
  const [entered, setEntered] = useState('')
  const [code, setCode] = useState<string | null>(null)

  const confirmed = code !== null
  const reveal = () => {
    const generated = String(Math.floor(100000 + Math.random() * 900000))
    setCode(generated)
    trackActivity('handover_code_generated', item?.id, { zone, slot, role: side })
  }
  const close = () => {
    onClose()
    // reset after the exit animation so the next open starts clean
    setTimeout(() => {
      setZone('')
      setSlot('')
      setSide('finder')
      setEntered('')
      setCode(null)
    }, 250)
  }

  const zoneLabel = ZONES.find((z) => z.id === zone)?.label

  return (
    <NeoModal isOpen={!!item} onClose={close} icon={<ShieldCheck size={24} />} title="Verify the handover">
      <div className="flex flex-col gap-xl">
        {!confirmed ? (
          <>
            {/* Step 1 — Safe Handover Zones */}
            <section className="flex flex-col gap-md">
              <p className="flex items-center gap-sm text-[11px] font-black uppercase tracking-[0.2em] text-ink">
                <MapPin size={13} /> Safe handover zones
              </p>
              <div className="grid gap-sm">
                {ZONES.map((z) => {
                  const on = zone === z.id
                  return (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setZone(z.id)}
                      className={`flex items-center gap-lg rounded-neo bg-plate p-lg text-left transition-shadow ${on ? 'shadow-carve' : 'shadow-extrude-sm'}`}
                    >
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-neo-full ${on ? 'bg-ink text-on-ink' : 'bg-plate text-ink shadow-extrude-sm'}`}
                      >
                        {z.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-ink">{z.label}</span>
                        <span className="block text-xs text-ink-muted">{z.hint}</span>
                      </span>
                      {on ? <Check size={16} className="ml-auto text-ink" /> : null}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Step 2 — Meeting time */}
            <section className="flex flex-col gap-md">
              <p className="flex items-center gap-sm text-[11px] font-black uppercase tracking-[0.2em] text-ink">
                <Clock size={13} /> Meeting time
              </p>
              <div className="flex flex-wrap gap-sm">
                {SLOTS.map((s) => (
                  <NeoPill key={s} active={slot === s} onClick={() => setSlot(s)}>
                    {s}
                  </NeoPill>
                ))}
              </div>
            </section>

            {/* Step 3 — who is at the desk decides which OTP affordance shows */}
            <section className="flex flex-col gap-md">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-ink">Your role</p>
              <div className="flex flex-wrap gap-sm">
                <NeoPill active={side === 'finder'} onClick={() => setSide('finder')}>
                  I found the item
                </NeoPill>
                <NeoPill active={side === 'seeker'} onClick={() => setSide('seeker')}>
                  I’m claiming it
                </NeoPill>
              </div>
            </section>

            {side === 'finder' ? (
              <NeoButton className="w-full" disabled={!zone || !slot} iconStart={<QrCode size={15} />} onClick={reveal}>
                Generate handover code
              </NeoButton>
            ) : (
              <section className="flex flex-col gap-md">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-ink">Enter handover code</p>
                <PinBoxes value={entered} onChange={setEntered} />
                <NeoButton
                  className="w-full"
                  disabled={entered.length < PIN_LENGTH}
                  iconStart={<Check size={15} />}
                  onClick={() => {
                    setCode(entered)
                    trackActivity('handover_code_verified', item?.id, { zone, slot, role: side })
                  }}
                >
                  Verify code
                </NeoButton>
              </section>
            )}
          </>
        ) : (
          /* Step 3 — One-time verification */
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
            className="flex flex-col items-center gap-lg rounded-neo bg-ink p-2xl text-center shadow-float"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-ink-muted">One-time handover code</p>
            <PinBoxes value={code!} tone="dark" />
            <div className="flex flex-col items-center gap-sm">
              <QrPlate seed={code!} />
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-on-ink-muted">
                Scan to complete handover
              </p>
            </div>
            <p className="text-[11px] leading-relaxed text-on-ink-muted">
              Show this at <span className="font-bold text-on-ink">{zoneLabel}</span> at{' '}
              <span className="font-bold text-on-ink">{slot}</span> to release “{item?.title}”.
            </p>
            <button
              type="button"
              onClick={() => {
                trackActivity('handover_confirmed', item?.id, { zone, slot })
                close()
              }}
              className="mt-sm flex w-full items-center justify-center gap-sm rounded-neo-full bg-status-found px-xl py-md text-sm font-bold text-white shadow-float transition-opacity hover:opacity-90"
            >
              <Check size={15} /> Confirm match &amp; close case
            </button>
          </motion.section>
        )}
      </div>
    </NeoModal>
  )
}
