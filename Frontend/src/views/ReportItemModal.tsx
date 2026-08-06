import { useEffect, useState } from 'react'
import { AlertTriangle, Camera, Check, Sparkles, UploadCloud } from 'lucide-react'
import { NeoButton, NeoInput, NeoModal, NeoSelect, NeoToggle } from '../neo'
import { CATEGORY_NAMES, ITEMS, isSensitive } from '../types'
import { trackActivity } from '../trackActivity'

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

  const isDevice = category === 'Electronics' || category === 'Phone'
  const sensitive = isSensitive(category)

  // Prefill building / floor / coordinates when opened from the map hotspot menu.
  useEffect(() => {
    if (!isOpen || !prefill) return
    setBuilding(prefill.building)
    // The map labels floors "1st Floor"; the select stores the bare "1st".
    setFloor(FLOOR_OPTIONS.find((f) => prefill.floor.startsWith(f.value))?.value ?? 'Ground')
    setSpot(prefill.coordinates)
  }, [isOpen, prefill])

  const reset = () => {
    setAnalyzed(false)
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
    trackActivity('photo_analyzed')
  }

  const submit = () => {
    if (sensitive) {
      trackActivity('report_submitted', undefined, { category, title, status: 'warning_sensitive' })
      return setWarning('sensitive')
    }
    const dup = ITEMS.some((i) => i.category === category && i.type === 'found')
    if (dup) {
      trackActivity('report_submitted', undefined, { category, title, status: 'warning_duplicate' })
      return setWarning('duplicate')
    }
    trackActivity('report_submitted', undefined, { category, title, building, floor, anonymous })
    setSubmitted(true)
  }

  return (
    <>
      <NeoModal
        isOpen={isOpen && !submitted}
        onClose={close}
        size="full"
        icon={<Camera size={18} />}
        title={prefill ? `Report ${prefill.type} item — ${prefill.building}` : 'Report an item'}
        subtitle="Add a photo and we’ll auto-detect the details"
        footer={
          <>
            <NeoButton variant="raised" onClick={close}>
              Cancel
            </NeoButton>
            <NeoButton variant="dark" disabled={!category || !title} onClick={submit}>
              Submit report
            </NeoButton>
          </>
        }
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-xl">
          {/* Drop zone — fills the container at a fixed height so it can never
              compress into a thin vertical strip. */}
          <button
            type="button"
            onClick={analyze}
            className={`flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-md rounded-neo bg-plate px-2xl text-center ${analyzed ? 'shadow-carve' : 'shadow-extrude'}`}
          >
            {analyzed ? (
              <>
                <Sparkles size={26} className="text-ink" />
                <span className="text-xs font-black uppercase tracking-widest text-ink">
                  AI filled category &amp; brand
                </span>
                <span className="text-xs text-ink-muted">Tap to replace the photo</span>
              </>
            ) : (
              <>
                <UploadCloud size={30} className="text-ink-muted" />
                <span className="text-xs font-black uppercase tracking-widest text-ink">
                  Drag &amp; drop a photo
                </span>
                <span className="text-xs text-ink-muted">or click to browse — we’ll auto-detect the details</span>
              </>
            )}
          </button>

          {/* Two-column responsive field grid */}
          <div className="grid grid-cols-1 gap-lg sm:grid-cols-2">
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
            {/* Dynamic field (Feature 1) */}
            {isDevice ? (
              <Field label="Device colour">
                <NeoInput value={color} onChange={setColor} placeholder="e.g. Space grey" />
              </Field>
            ) : null}
          </div>

          {/* Full-width description */}
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Distinguishing marks, stickers, contents — anything that helps identify it."
              className="min-h-28 w-full resize-y rounded-neo bg-plate px-lg py-md text-sm text-ink shadow-carve placeholder:text-ink-muted focus:outline-none"
            />
          </Field>

          {/* Inline anonymous toggle — space-between, never wraps */}
          <div className="flex items-center justify-between gap-lg rounded-neo bg-plate p-lg shadow-carve-sm">
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">Report anonymously</p>
              <p className="text-xs text-ink-muted">Hide your name from other students.</p>
            </div>
            <NeoToggle checked={anonymous} onChange={setAnonymous} label="Report anonymously" />
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
