import { Fragment } from 'react'
import { CLAIM_STAGES, type ClaimStage } from '../types'

/*
 * Claim workflow (Feature 8) — zero color. Status is encoded by shape only:
 *   Completed   → solid black dot
 *   In progress → pulsating grey ring (animate-ring)
 *   Pending     → hollow dashed grey circle
 */
export default function WorkflowTracker({ stage, dark = false }: { stage: ClaimStage; dark?: boolean }) {
  const activeIndex = CLAIM_STAGES.findIndex((s) => s.id === stage)
  const labelColor = dark ? 'text-on-dark-muted' : 'text-ink-muted'

  return (
    <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)_24px_minmax(0,1fr)] items-start">
      {CLAIM_STAGES.map((s, i) => {
        const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending'
        return (
          <Fragment key={s.id}>
            <div className="flex min-w-0 flex-col items-center gap-xs text-center">
              {state === 'done' ? (
                <span className={`size-3.5 rounded-neo-full ${dark ? 'bg-on-dark' : 'bg-ink'}`} />
              ) : state === 'active' ? (
                <span
                  className={`size-3.5 animate-ring rounded-neo-full ${dark ? 'bg-on-dark/70' : 'bg-ink/60'}`}
                />
              ) : (
                <span
                  className={`size-3.5 rounded-neo-full border border-dashed ${dark ? 'border-on-dark/50' : 'border-ink-muted'}`}
                />
              )}
              <span className={`whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.14em] ${labelColor}`}>
                {s.label}
              </span>
            </div>
            {i < CLAIM_STAGES.length - 1 ? (
              <span className={`mt-[7px] h-px w-full ${dark ? 'bg-on-dark/25' : 'bg-ink/20'}`} />
            ) : null}
          </Fragment>
        )
      })}
    </div>
  )
}
