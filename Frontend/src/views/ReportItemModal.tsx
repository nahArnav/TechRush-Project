import { useEffect, useState } from 'react'
import { AlertTriangle, Camera, Check, Sparkles, UploadCloud } from 'lucide-react'
import { NeoButton, NeoInput, NeoModal, NeoPill, NeoSelect, NeoToggle, useToast } from '../neo'
import { CATEGORY_NAMES, isSensitive } from '../types'
import { trackActivity } from '../trackActivity'
import { createItem, suggestReportDetails } from '../api'

/*
 * Smart reporting flow (Features 11, 1, 21, 13, 16). Photo → simulated AI fills
 * category + brand; dynamic Device Color for electronics; sensitive items and
 * duplicate detection raise a stark BLACK-GLASS warning modal (no red anywhere).
 *
 * Layout (Task 1): a wide desktop frame, a fill-container drop zone with a fixed
 * 160px height, a two-column field grid, a full-width description, an inline
 * anonymous toggle, and a submit CTA anchored in the sticky modal footer.
 */
const CATEGORY_OPTIONS = [
  { value: '', label: 'Select a category…' },
  ...CATEGORY_NAMES.map((c) => ({ value: c, label: c })),
  { value: 'ID Card', label: 'ID Card' },
]

const FLOOR_OPTIONS = [
  { value: 'Ground', label: 'Ground floor' },
  { value: '1st', label: '1st floor' },
  { value: '2nd', label: '2nd floor' },
  { value: '3rd', label: '3rd floor' },
]

/* Sent by the campus map's right-click "report here" menu (Task 2D). */
export type ReportPrefill = {
  type: 'lost' | 'found'
  building: string
  floor: string
  coordinates: string
  category?: string
  title?: string
  description?: string
  brand?: string
  color?: string
}

type Warning = null | 'sensitive' | 'duplicate'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-sm">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">{label}</span>
      {children}
    </label>
  )
}

export default function ReportItemModal({
  isOpen,
  prefill,
  onClose,
}: {
  isOpen: boolean
  prefill?: ReportPrefill | null
  onClose: () => void
}) {
  const { push } = useToast()
  const [analyzed, setAnalyzed] = useState(false)
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [brand, setBrand] = useState('')
  const [color, setColor] = useState('')
  const [building, setBuilding] = useState('')
  const [floor, setFloor] = useState('Ground')
  const [spot, setSpot] = useState('')
  const [when, setWhen] = useState('')
  const [description, setDescription] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [warning, setWarning] = useState<Warning>(null)
  const [submitted, setSubmitted] = useState(false)

  const [reportType, setReportType] = useState<'lost' | 'found'>('lost')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isDevice = category === 'Electronics' || category === 'Phone'
  const sensitive = isSensitive(category)

  // Prefill building / floor / coordinates when opened from the map hotspot menu.
  useEffect(() => {
    if (!isOpen || !prefill) return
    if (prefill.type) setReportType(prefill.type)
    setBuilding(prefill.building)
    setFloor(FLOOR_OPTIONS.find((f) => prefill.floor.startsWith(f.value))?.value ?? 'Ground')
    setSpot(prefill.coordinates)
    if (prefill.category) setCategory(prefill.category)
    if (prefill.title) setTitle(prefill.title)
    if (prefill.description) setDescription(prefill.description)
    if (prefill.brand) setBrand(prefill.brand)
    if (prefill.color) setColor(prefill.color)
  }, [isOpen, prefill])

  const reset = () => {
    setAnalyzed(false)
    setReportType('lost')
    setCategory('')
    setTitle('')
    setBrand('')
    setColor('')
    setBuilding('')
    setFloor('Ground')
    setSpot('')
    setWhen('')
    setDescription('')
    setAnonymous(false)
    setWarning(null)
    setSubmitted(false)
    setSubmitting(false)
    setError('')
  }

  const close = () => {
    reset()
    onClose()
  }

  const analyze = async () => {
    setSubmitting(true)
    setError('')
    try {
      const suggestion = await suggestReportDetails({
        source: 'photo',
        notes: [title, description, brand, color].filter(Boolean).join('. '),
        location: building || spot || undefined,
      })
      setAnalyzed(true)
      setCategory(suggestion.category || 'Other')
      setBrand(suggestion.brand || '')
      setColor(suggestion.color || '')
      setTitle(suggestion.title || 'Reported item')
      setDescription(suggestion.description || description)
      trackActivity('photo_analyzed')
    } catch (err: any) {
      setError(err?.message || 'AI analysis failed. You can still fill the report manually.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFinalSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const today = new Date().toISOString().split('T')[0]
      const locationStr = building ? `${building}, ${spot || floor}` : (spot || 'Campus Quad')
      
      const created = await createItem({
        type: reportType,
        category: category || 'Other',
        title: title || 'Reported item',
        description: description || 'No detailed description provided.',
        location: locationStr,
        date: when ? when.split('T')[0] : today,
        brand: brand || undefined,
        color: color || undefined,
        anonymous,
      })

      trackActivity('report_submitted', created.id, { category, title, type: reportType, building, floor })
      setSubmitted(true)
    } catch (err: any) {
      const message = err?.message || 'Failed to submit report. Please try again.'
      console.error('Report submission failed:', err)
      setError(message)
      push({ title: 'Report could not be submitted', description: message })
    } finally {
      setSubmitting(false)
    }
  }

  const submit = () => {
    if (sensitive) {
      trackActivity('report_submitted', undefined, { category, title, status: 'warning_sensitive' })
      return setWarning('sensitive')
    }
    handleFinalSubmit()
  }

  return (
    <>
      <NeoModal
        isOpen={isOpen && !submitted}
        onClose={close}
        size="full"
        icon={<Camera size={18} />}
        title={prefill ? `Report ${prefill.type} item — ${prefill.building}` : 'Report an item'}
        subtitle="Add details manually or let AI draft the report"
        footer={
          <>
            <NeoButton variant="raised" onClick={close} disabled={submitting}>
              Cancel
            </NeoButton>
            <NeoButton variant="dark" disabled={!category || !title || submitting} onClick={submit}>
              {submitting ? 'Submitting…' : 'Submit report'}
            </NeoButton>
          </>
        }
      >
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-2xl lg:grid-cols-[minmax(280px,0.9fr)_minmax(420px,1.4fr)]">
          {error ? (
            <div className="rounded-neo border border-line bg-plate px-lg py-md text-xs font-medium text-ink shadow-carve-sm lg:col-span-2">
              ⚠️ {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-xl">
            <div className="flex flex-wrap items-center gap-md">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">Report type</span>
              <NeoPill active={reportType === 'lost'} onClick={() => setReportType('lost')}>
                Lost Item
              </NeoPill>
              <NeoPill active={reportType === 'found'} onClick={() => setReportType('found')}>
                Found Item
              </NeoPill>
            </div>

            <button
              type="button"
              onClick={analyze}
              disabled={submitting}
              className={`flex min-h-72 w-full cursor-pointer flex-col items-center justify-center gap-lg rounded-neo bg-plate px-2xl text-center disabled:opacity-60 ${analyzed ? 'shadow-carve' : 'shadow-extrude'}`}
            >
              {analyzed ? (
                <>
                  <Sparkles size={34} className="text-ink" />
                  <span className="text-sm font-black uppercase tracking-widest text-ink">AI drafted this report</span>
                  <span className="max-w-xs text-xs leading-relaxed text-ink-muted">Tap again to refresh the draft from the current text.</span>
                </>
              ) : (
                <>
                  <UploadCloud size={38} className="text-ink-muted" />
                  <span className="text-sm font-black uppercase tracking-widest text-ink">Analyze with AI</span>
                  <span className="max-w-xs text-xs leading-relaxed text-ink-muted">Use the current notes, location, or staff capture to fill category, title, and description.</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-xl">
            <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
              <Field label="Item name">
                <NeoInput value={title} onChange={setTitle} placeholder="e.g. Navy backpack" />
              </Field>
              <Field label="Category">
                <NeoSelect value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
              </Field>

              <Field label="Building">
                <NeoInput value={building} onChange={setBuilding} placeholder="e.g. A3 Building" />
              </Field>
              <Field label="Floor">
                <NeoSelect value={floor} onChange={setFloor} options={FLOOR_OPTIONS} />
              </Field>

              <Field label="Exact location">
                <NeoInput value={spot} onChange={setSpot} placeholder="e.g. near the printers" />
              </Field>
              <Field label="Date & time">
                <NeoInput type="datetime-local" value={when} onChange={setWhen} />
              </Field>

              <Field label="Brand">
                <NeoInput value={brand} onChange={setBrand} placeholder="e.g. Apple" />
              </Field>
              {isDevice ? (
                <Field label="Device colour">
                  <NeoInput value={color} onChange={setColor} placeholder="e.g. Space grey" />
                </Field>
              ) : null}
            </div>

            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Distinguishing marks, stickers, contents — anything that helps identify it."
                className="min-h-36 w-full resize-y rounded-neo bg-plate px-lg py-md text-sm text-ink shadow-carve placeholder:text-ink-muted focus:outline-none"
              />
            </Field>

            <div className="flex items-center justify-between gap-lg rounded-neo bg-plate p-lg shadow-carve-sm">
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">Report anonymously</p>
                <p className="text-xs text-ink-muted">Hide your name from other students.</p>
              </div>
              <NeoToggle checked={anonymous} onChange={setAnonymous} label="Report anonymously" />
            </div>
          </div>
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
