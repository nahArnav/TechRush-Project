import { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, CheckCircle2, Mic, ShieldAlert } from 'lucide-react'
import { GlassPanel, LaneTitle, NeoSelect, SPRING } from '../neo'
import { suggestReportDetails } from '../api'
import type { ReportPrefill } from './ReportItemModal'
import { trackActivity } from '../trackActivity'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'mr', label: 'मराठी (Marathi)' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
  { value: 'te', label: 'తెలుగు (Telugu)' },
]

export default function StaffDashboard({
  onDraftReport,
}: {
  onDraftReport: (prefill: ReportPrefill) => void
}) {
  const [lang, setLang] = useState('en')
  const [status, setStatus] = useState('Ready to capture a found item.')
  const [busy, setBusy] = useState<'camera' | 'microphone' | null>(null)

  const openDraft = async (source: 'camera' | 'microphone') => {
    setBusy(source)
    setStatus(source === 'camera' ? 'Requesting camera access...' : 'Requesting microphone access...')
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        source === 'camera' ? { video: true } : { audio: true },
      )
      setStatus(source === 'camera' ? 'Camera access granted. Reading item details...' : 'Microphone access granted. Listening for item details...')
      await new Promise((resolve) => window.setTimeout(resolve, 900))
      stream.getTracks().forEach((track) => track.stop())

      const suggestion = await suggestReportDetails({
        source,
        notes:
          source === 'camera'
            ? 'Helping staff camera capture of a found object at campus desk.'
            : 'Helping staff voice note describing a found object at campus desk.',
        location: 'Campus help desk',
      })

      trackActivity(source === 'camera' ? 'camera_report_drafted' : 'microphone_report_drafted', undefined, {
        language: lang,
        category: suggestion.category,
      } as any)

      onDraftReport({
        type: 'found',
        building: 'Campus help desk',
        floor: 'Ground',
        coordinates: source === 'camera' ? 'Staff camera capture' : 'Staff microphone capture',
        ...suggestion,
      })
      setStatus('Draft ready. Review and submit the report.')
    } catch (err: any) {
      setStatus(err?.name === 'NotAllowedError' ? 'Permission denied. Allow access and try again.' : 'Capture failed. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <main className="flex-1 px-2xl py-3xl">
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-2xl">
        <div className="flex flex-wrap items-end justify-between gap-lg">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-ink">
              Log a <span className="font-black">found item</span>
            </h1>
            <p className="mt-xs text-sm text-ink-muted">Grant access, capture details, then review the AI-generated report.</p>
          </div>
          <div className="w-full sm:w-64">
            <LaneTitle>Language</LaneTitle>
            <div className="mt-sm">
              <NeoSelect value={lang} onChange={setLang} options={LANGUAGES} />
            </div>
          </div>
        </div>

        <GlassPanel className="flex items-center gap-md p-lg shadow-carve-sm">
          {status.includes('denied') || status.includes('failed') ? (
            <ShieldAlert size={18} className="text-ink-muted" />
          ) : (
            <CheckCircle2 size={18} className="text-status-found" />
          )}
          <p className="text-sm font-medium text-ink">{status}</p>
        </GlassPanel>

        <div className="grid flex-1 gap-xl lg:grid-cols-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            transition={SPRING}
            disabled={busy !== null}
            onClick={() => openDraft('camera')}
            className="glass-dark flex min-h-[360px] flex-col items-center justify-center gap-xl rounded-neo-lg p-2xl text-center text-on-dark shadow-float disabled:opacity-60"
          >
            <Camera size={78} strokeWidth={1.25} />
            <span className="text-2xl font-black uppercase tracking-widest">{busy === 'camera' ? 'Capturing...' : 'Take Photo'}</span>
            <span className="max-w-sm text-sm leading-relaxed text-on-dark-muted">
              Requests camera permission, captures the context, and drafts a found-item report.
            </span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            transition={SPRING}
            disabled={busy !== null}
            onClick={() => openDraft('microphone')}
            className="flex min-h-[360px] flex-col items-center justify-center gap-xl rounded-neo-lg bg-plate p-2xl text-center text-ink shadow-extrude active:shadow-carve disabled:opacity-60"
          >
            <Mic size={78} strokeWidth={1.25} />
            <span className="text-2xl font-black uppercase tracking-widest">{busy === 'microphone' ? 'Listening...' : 'Voice Record'}</span>
            <span className="max-w-sm text-sm leading-relaxed text-ink-muted">
              Requests microphone permission and turns the spoken item details into a draft report.
            </span>
          </motion.button>
        </div>
      </div>
    </main>
  )
}
