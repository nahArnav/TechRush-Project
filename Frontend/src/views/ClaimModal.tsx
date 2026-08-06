import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { NeoButton, NeoModal, useToast } from '../neo'
import { CLAIM_STAGES, emojiFor, isSensitive, type Item } from '../types'
import { createClaim } from '../api'

const PROOF_PROMPT: Record<string, string> = {
  Phone: 'Describe the lock-screen wallpaper and case.',
  Electronics: 'Describe the wallpaper, stickers, or any engraving.',
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
  const { push } = useToast()
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
      push({ title: 'Claim submitted', description: 'Your ownership proof is now under review.' })
      onSubmit(item, proof)
    } catch (err: any) {
      const message = err?.message || 'Failed to submit claim. Please try again.'
      console.error('Claim submission failed:', err)
      setError(message)
      push({ title: 'Claim could not be submitted', description: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <NeoModal isOpen={!!item} onClose={onClose} title="Verify your claim" className="!max-w-[500px] !p-8">
      <form
        className="mx-auto flex w-full max-w-[500px] flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault()
          handleSubmit()
        }}
      >
        {error ? (
          <div className="w-full rounded-neo border border-line bg-plate px-4 py-3 text-sm font-medium leading-relaxed text-ink shadow-carve-sm">
            Error: {error}
          </div>
        ) : null}

        <section className="flex w-full min-w-0 items-start gap-4 rounded-neo border border-line bg-glass-strong p-5 shadow-carve-sm">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-neo bg-plate text-2xl shadow-extrude-sm">
            {emojiFor(item.category)}
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="min-w-0">
              <p className="break-words text-base font-black leading-snug text-ink">{item.title}</p>
              <p className="break-words text-sm leading-relaxed text-ink-muted">{item.location}</p>
            </div>
            <p className="break-words text-sm leading-relaxed text-ink-soft">{item.description}</p>
          </div>
        </section>

        <section className="w-full rounded-neo border border-line bg-plate px-5 py-4 shadow-carve-sm">
          <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)_32px_minmax(0,1fr)] items-start">
            {CLAIM_STAGES.map((stage, index) => (
              <div key={stage.id} className="contents">
                <div className="flex min-w-0 flex-col items-center gap-2 text-center">
                  <span
                    className={`size-3.5 rounded-neo-full ${
                      index === 0 ? 'bg-ink' : 'border border-dashed border-ink-muted'
                    }`}
                  />
                  <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.14em] text-ink-muted">
                    {stage.label}
                  </span>
                </div>
                {index < CLAIM_STAGES.length - 1 ? <span className="mt-[7px] h-px w-full bg-ink/20" /> : null}
              </div>
            ))}
          </div>
        </section>

        {isSensitive(item.category) ? (
          <p className="w-full break-words rounded-neo bg-ink p-4 text-sm font-medium leading-relaxed text-on-ink">
            Sensitive item: your claim is routed to campus security for in-person handover.
          </p>
        ) : null}

        <label className="flex w-full flex-col gap-3">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-ink">Proof of ownership</span>
          <span className="text-sm leading-relaxed text-ink-muted">{prompt}</span>
          <textarea
            value={proof}
            onChange={(event) => setProof(event.target.value)}
            rows={4}
            placeholder="Be specific. This is checked against the finder report."
            className="min-h-32 w-full resize-y rounded-neo border border-line bg-plate px-4 py-3 text-sm leading-relaxed text-ink shadow-carve placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
        </label>

        <div className="flex w-full flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
          <NeoButton
            variant="ghost"
            className="h-11 px-6 text-ink-muted hover:text-ink"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </NeoButton>
          <NeoButton
            variant="dark"
            type="submit"
            className="h-11 min-w-40 px-6"
            disabled={proof.trim().length < 10 || loading}
            iconStart={loading ? <LoaderCircle className="animate-spin" size={15} /> : undefined}
          >
            {loading ? 'Submitting...' : 'Submit claim'}
          </NeoButton>
        </div>
      </form>
    </NeoModal>
  )
}
