import { useEffect, useState } from 'react'
import { NeoButton, NeoModal } from '../neo'
import { CLAIM_STAGES, emojiFor, isSensitive, type Item } from '../types'
import { createClaim } from '../api'

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
  onSubmit: (item: Item, proof: string) => void
}) {
  const [proof, setProof] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setProof('')
    setError('')
    setLoading(false)
  }, [item])

  if (!item) return null

  const prompt = PROOF_PROMPT[item.category] ?? 'Describe details only the owner would know.'

  const handleSubmit = async () => {
    if (proof.trim().length < 10) return
    setLoading(true)
    setError('')
    try {
      await createClaim(item.id, proof)
      onSubmit(item, proof)
    } catch (err: any) {
      setError(err?.message || 'Failed to submit claim. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <NeoModal isOpen={!!item} onClose={onClose} title="Verify your claim">
      <div className="flex w-full min-w-0 flex-col gap-lg overflow-y-auto pr-sm sm:min-w-[28rem]">
        {error ? (
          <div className="rounded-neo border border-line bg-plate px-lg py-md text-xs font-medium text-ink shadow-carve-sm">
            ⚠️ {error}
          </div>
        ) : null}

        <div className="flex min-w-0 items-center gap-md rounded-neo bg-plate p-lg shadow-carve-sm">
          <span className="flex size-11 items-center justify-center rounded-neo bg-plate text-xl shadow-extrude-sm">
            {emojiFor(item.category)}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">{item.title}</p>
            <p className="text-xs text-ink-muted">{item.location}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-sm">
          {CLAIM_STAGES.map((s, i) => (
            <div key={s.id} className="flex min-w-0 items-center">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-xs text-center">
                <span
                  className={`size-3 rounded-neo-full ${i === 0 ? 'bg-ink' : 'border border-dashed border-ink-muted'}`}
                />
                <span className="w-full text-[10px] font-medium uppercase tracking-widest text-ink-muted">
                  {s.label}
                </span>
              </div>
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

        <div className="flex justify-end gap-md pt-md">
          <NeoButton variant="raised" onClick={onClose} disabled={loading}>
            Cancel
          </NeoButton>
          <NeoButton variant="dark" disabled={proof.trim().length < 10 || loading} onClick={handleSubmit}>
            {loading ? 'Submitting…' : 'Submit claim'}
          </NeoButton>
        </div>
      </div>
    </NeoModal>
  )
}
