import { useState } from 'react'
import { Eye, Lock, MapPin, MessageSquare } from 'lucide-react'
import { GlassCard, NeoButton, NeoPill } from '../neo'
import { emojiFor, isCampusId, timelineFor, type Claim, type Item } from '../types'
import WorkflowTracker from './WorkflowTracker'

/*
 * The discovery unit. Three states, all strictly grayscale:
 *   variant "ai"     → inverted dark glass, high contrast (AI Matches lane)
 *   Campus ID item   → locked + heavily blurred with a B/W private-match banner (F22)
 *   default          → light glass card with movement timeline (F19) + community
 *                       confirmation pill "I saw this item" (F28)
 */
export default function NeoCard({
  item,
  claim,
  variant = 'default',
  onClaim,
  onChat,
}: {
  item: Item
  claim?: Claim
  variant?: 'default' | 'ai'
  onClaim: (item: Item) => void
  onChat?: (item: Item) => void
}) {
  const dark = variant === 'ai'
  const [confirmed, setConfirmed] = useState(false)
  const [confirms, setConfirms] = useState(3)
  const timeline = timelineFor(item)

  // Automatic ID match (Feature 22): locked, blurred, owner-notified.
  if (isCampusId(item.category)) {
    return (
      <GlassCard className="relative w-72 shrink-0 overflow-hidden p-xl">
        <div className="pointer-events-none select-none blur-md">
          <div className="mb-lg flex items-center gap-md">
            <span className="flex size-11 items-center justify-center rounded-neo bg-plate text-xl shadow-extrude-sm">
              {emojiFor(item.category)}
            </span>
            <div>
              <p className="text-sm font-bold text-ink">{item.title}</p>
              <p className="text-xs text-ink-muted">{item.location}</p>
            </div>
          </div>
          <p className="text-xs text-ink-soft">{item.description}</p>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-md p-xl text-center">
          <span className="flex size-12 items-center justify-center rounded-neo-full bg-ink text-on-dark shadow-float">
            <Lock size={20} />
          </span>
          <div className="rounded-neo bg-ink px-lg py-md">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-on-dark">
              Private match notified to owner
            </p>
          </div>
        </div>
      </GlassCard>
    )
  }

  const shell = dark ? 'text-on-dark' : 'text-ink'
  const muted = dark ? 'text-on-dark-muted' : 'text-ink-muted'

  return (
    <GlassCard dark={dark} className={`flex w-72 shrink-0 flex-col gap-lg p-xl ${shell}`}>
      <div className="flex items-start justify-between gap-md">
        <div className="flex items-center gap-md">
          <span
            className={`flex size-11 items-center justify-center rounded-neo text-xl ${dark ? 'glass-dark' : 'bg-plate shadow-extrude-sm'}`}
          >
            {emojiFor(item.category)}
          </span>
          <div>
            <p className="text-sm font-bold tracking-tight">{item.title}</p>
            <p className={`flex items-center gap-xs text-xs ${muted}`}>
              <MapPin size={11} /> {item.location}
            </p>
          </div>
        </div>
        {variant === 'ai' ? (
          <span className="rounded-neo-full border border-white/40 px-md py-xs text-[10px] font-black uppercase tracking-widest">
            {Math.round(item.matchScore * 100)}%
          </span>
        ) : null}
      </div>

      <p className={`text-xs leading-relaxed ${muted}`}>{item.description}</p>

      {/* Movement timeline (Feature 19) */}
      <div className="flex flex-col gap-sm">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${muted}`}>Last seen</p>
        <ol className="flex flex-col gap-sm">
          {timeline.map((ev, i) => (
            <li key={i} className="flex items-center gap-md">
              <span
                className={`size-2 shrink-0 rounded-neo-full ${dark ? 'bg-on-dark/70' : 'bg-ink/70'} ${i === timeline.length - 1 ? 'animate-ring' : ''}`}
              />
              <span className={`text-[11px] font-bold tabular-nums ${shell}`}>{ev.time}</span>
              <span className={`text-[11px] ${muted}`}>{ev.place}</span>
            </li>
          ))}
        </ol>
      </div>

      {claim ? (
        <div className="flex flex-col gap-md">
          <div className={`rounded-neo p-md ${dark ? 'bg-white/5' : 'bg-plate shadow-carve-sm'}`}>
            <WorkflowTracker stage={claim.stage} dark={dark} />
          </div>
          <NeoPill iconStart={<MessageSquare size={13} />} onClick={() => onChat?.(item)}>
            Safe chat &amp; handover
          </NeoPill>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-md">
          {/* Community confirmation (Feature 28) */}
          <NeoPill
            active={confirmed}
            iconStart={<Eye size={13} />}
            onClick={() => {
              setConfirmed((c) => !c)
              setConfirms((n) => (confirmed ? n - 1 : n + 1))
            }}
          >
            I saw this · {confirms}
          </NeoPill>
          <NeoButton
            variant={dark ? 'dark' : 'raised'}
            size="sm"
            onClick={() => onClaim(item)}
          >
            Claim
          </NeoButton>
        </div>
      )}
    </GlassCard>
  )
}
