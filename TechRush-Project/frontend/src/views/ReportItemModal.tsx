import { useState } from 'react'
import { AlertTriangle, Camera, Check, Sparkles } from 'lucide-react'
import { NeoButton, NeoInput, NeoModal, NeoSelect, NeoToggle } from '../neo'
import { CATEGORY_NAMES, ITEMS, isSensitive } from '../types'

/*
 * Smart reporting flow (Features 11, 1, 21, 13, 16). Photo → simulated AI fills
 * category + brand; dynamic Device Color for electronics; sensitive items and
 * duplicate detection raise a stark BLACK-GLASS warning modal (no red anywhere).
 */
const CATEGORY_OPTIONS = [
  { value: '', label: 'Select a category…' },
  ...CATEGORY_NAMES.map((c) => ({ value: c, label: c })),
  { value: 'ID Card', label: 'ID Card' },
]

type Warning = null | 'sensitive' | 'duplicate'

export default function ReportItemModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [analyzed, setAnalyzed] = useState(false)
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [color, setColor] = useState('')
  const [title, setTitle] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [warning, setWarning] = useState<Warning>(null)
  const [submitted, setSubmitted] = useState(false)

  const isDevice = category === 'Electronics' || category === 'Phone'
  const sensitive = isSensitive(category)

  const reset = () => {
    setAnalyzed(false)
    setCategory('')
    setBrand('')
    setColor('')
    setTitle('')
    setAnonymous(false)
    setWarning(null)
    setSubmitted(false)
  }
  const close = () => {
    reset()
    onClose()
  }

  const analyze = () => {
    setAnalyzed(true)
    setCategory('Electronics')
    setBrand('Apple')
    setTitle('Silver laptop')
  }

  const submit = () => {
    if (sensitive) return setWarning('sensitive')
    const dup = ITEMS.some((i) => i.category === category && i.type === 'found')
    if (dup) return setWarning('duplicate')
    setSubmitted(true)
  }

  return (
    <>
      <NeoModal isOpen={isOpen && !submitted} onClose={close} title="Report an item">
        <div className="flex flex-col gap-lg">
          {/* Photo upload → AI auto-populate (Feature 11) */}
          <button
            type="button"
            onClick={analyze}
            className={`flex cursor-pointer flex-col items-center justify-center gap-md rounded-neo bg-plate p-2xl text-center ${analyzed ? 'shadow-carve' : 'shadow-extrude'}`}
          >
            {analyzed ? (
              <>
                <Sparkles size={22} className="text-ink" />
                <span className="text-xs font-black uppercase tracking-widest text-ink">
                  AI filled category &amp; brand
                </span>
              </>
            ) : (
              <>
                <Camera size={28} className="text-ink-muted" />
                <span className="text-xs font-black uppercase tracking-widest text-ink">Upload a photo</span>
                <span className="text-xs text-ink-muted">We’ll auto-detect the details</span>
              </>
            )}
          </button>

          <NeoSelect value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
          <NeoInput value={title} onChange={setTitle} placeholder="Title — e.g. Navy backpack" />
          <div className="flex gap-md">
            <NeoInput className="flex-1" value={brand} onChange={setBrand} placeholder="Brand" />
            {/* Dynamic field (Feature 1) */}
            {isDevice ? (
              <NeoInput className="flex-1" value={color} onChange={setColor} placeholder="Device color" />
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-lg rounded-neo bg-plate p-lg shadow-carve-sm">
            <div>
              <p className="text-sm font-bold text-ink">Report anonymously</p>
              <p className="text-xs text-ink-muted">Hide your name from other students.</p>
            </div>
            <NeoToggle checked={anonymous} onChange={setAnonymous} label="Report anonymously" />
          </div>

          <NeoButton className="w-full" disabled={!category || !title} onClick={submit}>
            Submit report
          </NeoButton>
        </div>
      </NeoModal>

      {/* Stark black-glass warning (Features 16 & 21) — pure white border + icon */}
      <NeoModal
        isOpen={warning !== null}
        onClose={() => setWarning(null)}
        tone="dark"
        icon={<AlertTriangle size={26} />}
        title={warning === 'sensitive' ? 'Sensitive Item' : 'Possible Duplicate'}
        footer={
          <>
            <NeoButton variant="dark" onClick={() => setWarning(null)}>
              Go back
            </NeoButton>
            {warning === 'duplicate' ? (
              <NeoButton
                variant="dark"
                onClick={() => {
                  setWarning(null)
                  setSubmitted(true)
                }}
              >
                Submit anyway
              </NeoButton>
            ) : null}
          </>
        }
      >
        <p className="text-center text-sm">
          {warning === 'sensitive'
            ? 'Hand this item over to campus security immediately. Do not arrange a private handover.'
            : 'A similar item was already reported found. Review the feed before adding a duplicate.'}
        </p>
      </NeoModal>

      {/* Success */}
      <NeoModal isOpen={submitted} onClose={close} icon={<Check size={26} />} title="Report submitted">
        <p className="text-center text-sm">We’ll alert you the moment a match appears.</p>
        <div className="mt-2xl flex justify-center">
          <NeoButton onClick={close}>Done</NeoButton>
        </div>
      </NeoModal>
    </>
  )
}
