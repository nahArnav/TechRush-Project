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
    <div className="flex items-center">
      {CLAIM_STAGES.map((s, i) => {
        const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending'
        return (
          <div key={s.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-xs">
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
              <span className={`text-[10px] font-medium uppercase tracking-widest ${labelColor}`}>
                {s.label}
              </span>
            </div>
            {i < CLAIM_STAGES.length - 1 ? (
              <span className={`mx-sm mb-4 h-px flex-1 ${dark ? 'bg-on-dark/25' : 'bg-ink/20'}`} />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
