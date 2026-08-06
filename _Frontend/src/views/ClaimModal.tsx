import { useEffect, useState } from 'react'
import { NeoButton, NeoModal } from '../neo'
import { CLAIM_STAGES, emojiFor, isSensitive, type Item } from '../types'

/*
 * Secure claiming (Features 4 & 8). Ownership must be proven before release; the
 * verification prompt adapts to the category ("Describe the phone wallpaper").
 * A preview of the Submitted → Review → Approved stepper sets expectations.
 */
const PROOF_PROMPT: Record<string, string> = {
  Phone: 'Describe the lock-screen wallpaper and case.',
  Electronics: 'Describe the wallpaper, stickers or any engraving.',
  Wallet: 'List the cards inside and any distinguishing marks.',
  Keys: 'Describe the keyring and number of keys.',
}

export default function ClaimModal({
  item,
  onClose,
  onSubmit,
}: {
  item: Item | null
  onClose: () => void
  onSubmit: (item: Item) => void
}) {
  const [proof, setProof] = useState('')
  useEffect(() => setProof(''), [item])
  if (!item) return null

  const prompt = PROOF_PROMPT[item.category] ?? 'Describe details only the owner would know.'

  return (
    <NeoModal isOpen={!!item} onClose={onClose} title="Verify your claim">
      <div className="flex flex-col gap-lg">
        <div className="flex items-center gap-md rounded-neo bg-plate p-lg shadow-carve-sm">
          <span className="flex size-11 items-center justify-center rounded-neo bg-plate text-xl shadow-extrude-sm">
            {emojiFor(item.category)}
          </span>
          <div>
            <p className="text-sm font-bold text-ink">{item.title}</p>
            <p className="text-xs text-ink-muted">{item.location}</p>
          </div>
        </div>

        {/* Stepper preview */}
        <div className="flex items-center justify-between">
          {CLAIM_STAGES.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-xs">
                <span
                  className={`size-3 rounded-neo-full ${i === 0 ? 'bg-ink' : 'border border-dashed border-ink-muted'}`}
                />
                <span className="text-[10px] font-medium uppercase tracking-widest text-ink-muted">
                  {s.label}
                </span>
              </div>
              {i < CLAIM_STAGES.length - 1 ? <span className="mx-sm mb-4 h-px flex-1 bg-ink/15" /> : null}
            </div>
          ))}
        </div>

        {isSensitive(item.category) ? (
          <p className="rounded-neo bg-ink p-lg text-xs font-medium text-on-ink">
            Sensitive item — your claim is routed to campus security for in-person handover.
          </p>
        ) : null}

        <label className="flex flex-col gap-sm">
          <span className="text-xs font-black uppercase tracking-widest text-ink">Proof of ownership</span>
          <span className="text-xs text-ink-muted">{prompt}</span>
          <textarea
            value={proof}
            onChange={(e) => setProof(e.target.value)}
            placeholder="Be specific — checked against the finder’s report."
            className="min-h-24 w-full resize-y rounded-neo bg-plate px-lg py-md text-sm text-ink shadow-carve placeholder:text-ink-muted focus:outline-none"
          />
        </label>

        <div className="flex justify-end gap-md">
          <NeoButton variant="raised" onClick={onClose}>
            Cancel
          </NeoButton>
          <NeoButton variant="dark" disabled={proof.trim().length < 10} onClick={() => onSubmit(item)}>
            Submit claim
          </NeoButton>
        </div>
      </div>
    </NeoModal>
  )
}
