import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, CheckCircle2, Mic, ShieldAlert, Square } from 'lucide-react'
import { GlassPanel, LaneTitle, NeoButton, NeoSelect, SPRING } from '../neo'
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
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState<'camera' | 'microphone' | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const speechRef = useRef<any>(null)
  const transcriptRef = useRef('')

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream
    }
  }, [cameraStream])

  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach((track) => track.stop())
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop())
      speechRef.current?.stop?.()
    }
  }, [cameraStream])

  const openDraft = async (source: 'camera' | 'microphone', notes: string, photos: string[] = []) => {
    setBusy(source)
    try {
      const suggestion = await suggestReportDetails({
        source,
        notes,
        location: 'Campus help desk',
        photos,
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
        photos,
        ...suggestion,
      })
      setStatus('Draft ready. Review and submit the report.')
    } catch (err: any) {
      setStatus(err?.message || 'Draft failed. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const startCamera = async () => {
    setBusy('camera')
    setStatus('Requesting camera access...')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setCameraStream(stream)
      setStatus('Camera ready. Point it at the item, then take the photo.')
    } catch (err: any) {
      setStatus(err?.name === 'NotAllowedError' ? 'Camera permission denied. Allow access and try again.' : 'Camera access failed. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const takePhoto = async () => {
    if (!cameraStream) {
      await startCamera()
      return
    }
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const photo = canvas.toDataURL('image/jpeg', 0.82)
    setStatus('Photo captured. Drafting report from image...')
    await openDraft('camera', 'Helping staff camera capture of a found object at campus desk.', [photo])
  }

  const startRecording = async () => {
    setBusy('microphone')
    setStatus('Requesting microphone access...')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      transcriptRef.current = ''
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.lang = lang === 'en' ? 'en-US' : lang
        recognition.continuous = true
        recognition.interimResults = true
        recognition.onresult = (event: any) => {
          transcriptRef.current = Array.from(event.results)
            .map((result: any) => result[0]?.transcript || '')
            .join(' ')
            .trim()
        }
        recognition.start()
        speechRef.current = recognition
      }
      const recorder = new MediaRecorder(stream)
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        speechRef.current?.stop?.()
        speechRef.current = null
        const spoken = transcriptRef.current || 'Voice recording captured by helping staff. Add details from the recording before submission.'
        setStatus('Voice captured. Drafting report from speech...')
        openDraft('microphone', spoken)
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
      setStatus('Recording. Click again to stop and draft the report.')
    } catch (err: any) {
      setStatus(err?.name === 'NotAllowedError' ? 'Microphone permission denied. Allow access and try again.' : 'Microphone access failed. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const toggleRecording = async () => {
    if (recording) {
      setRecording(false)
      recorderRef.current?.stop()
      recorderRef.current = null
      return
    }
    await startRecording()
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
          {status.toLowerCase().includes('denied') || status.toLowerCase().includes('failed') ? (
            <ShieldAlert size={18} className="text-ink-muted" />
          ) : (
            <CheckCircle2 size={18} className="text-status-found" />
          )}
          <p className="min-w-0 text-sm font-medium text-ink">{status}</p>
        </GlassPanel>

        <div className="grid flex-1 gap-xl lg:grid-cols-2">
          <motion.div
            transition={SPRING}
            className="glass-dark flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-neo-lg text-center text-on-dark shadow-float"
          >
            <div className="relative flex flex-1 items-center justify-center bg-black/30">
              {cameraStream ? (
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 size-full object-cover" />
              ) : (
                <div className="flex w-full flex-col items-center gap-xl p-2xl">
                  <Camera size={78} strokeWidth={1.25} />
                  <span className="w-full text-2xl font-black uppercase tracking-widest">Camera Preview</span>
                  <span className="w-full max-w-md text-sm leading-relaxed text-on-dark-muted">
                    Start the camera to see the item live, then capture one photo for the report.
                  </span>
                </div>
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-md p-xl sm:flex-row sm:items-center sm:justify-between">
              <div className="text-left">
                <p className="text-sm font-black uppercase tracking-widest">{cameraStream ? 'Camera active' : 'Camera off'}</p>
                <p className="text-xs text-on-dark-muted">{cameraStream ? 'Point at the item and capture.' : 'Permission is requested when started.'}</p>
              </div>
              <NeoButton variant="dark" disabled={busy !== null} iconStart={<Camera size={16} />} onClick={takePhoto}>
                {cameraStream ? 'Take Photo' : 'Start Camera'}
              </NeoButton>
            </div>
          </motion.div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            transition={SPRING}
            disabled={busy !== null}
            onClick={toggleRecording}
            className="flex min-h-[420px] min-w-0 flex-col items-center justify-center gap-xl rounded-neo-lg bg-plate p-2xl text-center text-ink shadow-extrude active:shadow-carve disabled:opacity-60"
          >
            {recording ? <Square size={78} strokeWidth={1.25} /> : <Mic size={78} strokeWidth={1.25} />}
            <span className="w-full text-2xl font-black uppercase tracking-widest">
              {recording ? 'Stop Recording' : busy === 'microphone' ? 'Preparing...' : 'Voice Record'}
            </span>
            <span className="w-full max-w-md text-sm leading-relaxed text-ink-muted">
              Click once to start recording, click again to stop. Speech is converted into report fields when supported by the browser.
            </span>
          </motion.button>
        </div>
      </div>
    </main>
  )
}
