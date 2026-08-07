import { useState } from 'react'
import { Eye, Lock, MapPin, MessageSquare, Sparkles } from 'lucide-react'
import { GlassCard, NeoButton, NeoPill, useTheme } from '../neo'
import { emojiFor, isCampusId, type Claim, type Item } from '../types'
import WorkflowTracker from './WorkflowTracker'
import { trackActivity } from '../trackActivity'

export default function NeoCard({
  item,
  claim,
  isOwnReport = false,
  variant = 'default',
  onClaim,
  onChat,
}: {
  item: Item
  claim?: Claim
  isOwnReport?: boolean
  variant?: 'default' | 'ai'
  onClaim: (item: Item) => void
  onChat?: (item: Item) => void
}) {
  const ai = variant === 'ai'
  const { theme } = useTheme()
  const aiDark = ai && theme === 'dark'
  const [confirmed, setConfirmed] = useState(false)
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
          <span className="flex size-12 items-center justify-center rounded-neo-full bg-ink text-on-ink shadow-float">
            <Lock size={20} />
          </span>
          <div className="rounded-neo bg-ink px-lg py-md">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-on-ink">
              Private match notified to owner
            </p>
          </div>
        </div>
      </GlassCard>
    )
  }

  const shell = ai ? 'text-ai-ink' : 'text-ink'
  const muted = ai ? 'text-ai-ink-muted' : 'text-ink-muted'

  const Body = (
    <>
      <div className="flex items-start justify-between gap-md">
        <div className="flex items-center gap-md">
          <span
            className={`flex size-11 items-center justify-center rounded-neo text-xl ${ai ? 'border border-ai-border bg-ai-surface' : 'bg-plate shadow-extrude-sm'}`}
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
        {ai ? (
          <span className="flex items-center gap-xs rounded-neo-full border border-ai-border px-md py-xs text-[10px] font-black uppercase tracking-widest text-ai-ink">
            <Sparkles size={11} /> {Math.round((typeof item?.matchScore === 'number' ? item.matchScore : 0.5) * 100)}%
          </span>
        ) : null}
      </div>

      <p className={`text-xs leading-relaxed ${muted}`}>{item.description}</p>

      {item.photos?.length ? (
        <div className="grid grid-cols-3 gap-xs">
          {item.photos.slice(0, 3).map((photo, index) => (
            <img key={`${item.id}-photo-${index}`} src={photo} alt={`${item.title} reference ${index + 1}`} className="aspect-square rounded-neo object-cover shadow-carve-sm" />
          ))}
        </div>
      ) : null}

      {claim ? (
        <div className="flex flex-col gap-md">
          <div className={`rounded-neo p-md ${ai ? 'border border-ai-border bg-ai-surface' : 'bg-plate shadow-carve-sm'}`}>
            <WorkflowTracker stage={claim.stage} dark={aiDark} />
          </div>
          <NeoPill iconStart={<MessageSquare size={13} />} onClick={() => { trackActivity('chat_opened', item.id); onChat?.(item) }}>
            Safe chat &amp; handover
          </NeoPill>
        </div>
      ) : isOwnReport ? (
        <div className="flex items-center justify-between gap-md">
          <NeoPill active iconStart={<Eye size={13} />}>
            Your report
          </NeoPill>
          <NeoButton variant={aiDark ? 'dark' : 'raised'} size="sm" disabled>
            Claim hidden
          </NeoButton>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-md">
          <NeoPill
            active={confirmed}
            iconStart={<Eye size={13} />}
            onClick={() => {
              const nextState = !confirmed
              setConfirmed(nextState)
              trackActivity('i_saw_this', item.id, { title: item.title, confirmed: nextState })
            }}
          >
            I saw this
          </NeoPill>
          <NeoButton variant={aiDark ? 'dark' : 'raised'} size="sm" onClick={() => { trackActivity('claim_opened', item.id); onClaim(item) }}>
            Claim
          </NeoButton>
        </div>
      )}
    </>
  )

  if (ai) {
    return (
      <div
        className={`flex w-72 shrink-0 flex-col gap-lg rounded-neo-lg border border-ai-border bg-ai-surface p-xl shadow-glass-lg backdrop-blur-2xl ${shell}`}
      >
        {Body}
      </div>
    )
  }

  return (
    <GlassCard className={`flex w-72 shrink-0 flex-col gap-lg p-xl ${shell}`}>{Body}</GlassCard>
  )
}
