import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, CheckCircle2, Mic, PauseCircle, PlayCircle, ShieldAlert, Sparkles } from 'lucide-react'
import { GlassPanel, LaneTitle, NeoButton, NeoSelect, SPRING } from '../neo'
import { suggestReportDetails } from '../api'
import type { ReportPrefill } from './ReportItemModal'
import { trackActivity } from '../trackActivity'

type CaptureMode = 'camera' | 'microphone'

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: any) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

const LANGUAGES = [
  { value: 'en-US', label: 'English' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'mr-IN', label: 'Marathi' },
  { value: 'ta-IN', label: 'Tamil' },
  { value: 'te-IN', label: 'Telugu' },
]

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

export default function StaffDashboard({
  onDraftReport,
}: {
  onDraftReport: (prefill: ReportPrefill) => void
}) {
  const [lang, setLang] = useState('en-US')
  const [status, setStatus] = useState('Ready to capture a found item.')
  const [busy, setBusy] = useState<CaptureMode | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(null)
  const [photoDataUrl, setPhotoDataUrl] = useState('')
  const [recording, setRecording] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const transcriptRef = useRef('')

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream
    }
  }, [cameraStream])

  useEffect(() => {
    return () => {
      stopStream(cameraStream)
      stopStream(microphoneStream)
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      recognitionRef.current?.stop()
    }
  }, [cameraStream, microphoneStream])

  const requestCamera = async () => {
    setBusy('camera')
    setStatus('Requesting camera access...')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      stopStream(cameraStream)
      setCameraStream(stream)
      setPhotoDataUrl('')
      setStatus('Camera ready. Frame the item and capture a photo.')
      trackActivity('camera_permission_granted')
    } catch (err: any) {
      setStatus(err?.name === 'NotAllowedError' ? 'Camera permission denied. Allow access and try again.' : 'Camera failed. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const requestMicrophone = async () => {
    setBusy('microphone')
    setStatus('Requesting microphone access...')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stopStream(microphoneStream)
      setMicrophoneStream(stream)
      setStatus('Microphone ready. Record the object description.')
      trackActivity('microphone_permission_granted')
    } catch (err: any) {
      setStatus(err?.name === 'NotAllowedError' ? 'Microphone permission denied. Allow access and try again.' : 'Microphone failed. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth) {
      setStatus('Camera preview is not ready yet.')
      return
    }
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    setPhotoDataUrl(canvas.toDataURL('image/jpeg', 0.82))
    stopStream(cameraStream)
    setCameraStream(null)
    setStatus('Photo captured. Create the draft when it looks clear.')
    trackActivity('staff_photo_captured')
  }

  const createDraft = async (source: CaptureMode, notes: string) => {
    setBusy(source)
    setStatus(source === 'camera' ? 'Reading photo details...' : 'Filling description from the voice note...')
    try {
      const suggestion = await suggestReportDetails({
        source,
        notes,
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
        coordinates: source === 'camera' ? 'Staff camera capture' : 'Staff voice recording',
        ...suggestion,
        description: suggestion.description || notes || 'Voice note captured by helping staff.',
      })
      setStatus('Draft ready. Review and submit the report.')
    } catch (err: any) {
      setStatus(err?.message || 'Capture failed. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const startRecording = () => {
    if (!microphoneStream) {
      requestMicrophone()
      return
    }
    const Recorder = window.MediaRecorder
    if (!Recorder) {
      setStatus('Voice recording is not supported in this browser.')
      return
    }
    transcriptRef.current = ''
    setVoiceText('')
    const recorder = new Recorder(microphoneStream)
    recorderRef.current = recorder
    recorder.onstop = () => {
      setRecording(false)
      const notes = transcriptRef.current.trim() || voiceText.trim() || 'Helping staff recorded a voice description of the found object.'
      setVoiceText(notes)
      createDraft('microphone', notes)
    }
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognitionCtor) {
      const recognition = new SpeechRecognitionCtor() as SpeechRecognitionLike
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = lang
      recognition.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((result: any) => result[0]?.transcript || '')
          .join(' ')
          .trim()
        transcriptRef.current = text
        setVoiceText(text)
      }
      recognition.onend = () => {
        if (recording) recognition.start()
      }
      recognitionRef.current = recognition
      recognition.start()
    }
    recorder.start()
    setRecording(true)
    setStatus('Recording voice description...')
    trackActivity('voice_recording_started')
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
  }

  const hasIssue = status.toLowerCase().includes('denied') || status.toLowerCase().includes('failed')

  return (
    <main className="flex-1 px-2xl py-3xl">
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-2xl">
        <div className="flex flex-wrap items-end justify-between gap-lg">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-ink">
              Log a <span className="font-black">found item</span>
            </h1>
            <p className="mt-xs text-sm text-ink-muted">Capture a photo or voice note, then review the generated report.</p>
          </div>
          <div className="w-full sm:w-64">
            <LaneTitle>Language</LaneTitle>
            <div className="mt-sm">
              <NeoSelect value={lang} onChange={setLang} options={LANGUAGES} />
            </div>
          </div>
        </div>

        <GlassPanel className="flex items-center gap-md p-lg shadow-carve-sm">
          {hasIssue ? <ShieldAlert size={18} className="text-ink-muted" /> : <CheckCircle2 size={18} className="text-status-found" />}
          <p className="text-sm font-medium text-ink">{status}</p>
        </GlassPanel>

        <div className="grid flex-1 gap-xl lg:grid-cols-2">
          <motion.section
            transition={SPRING}
            className="glass-dark flex min-h-[420px] min-w-0 flex-col gap-xl rounded-neo-lg p-xl text-on-dark shadow-float"
          >
            <div className="flex items-center justify-between gap-md">
              <div className="flex items-center gap-md">
                <span className="flex size-12 items-center justify-center rounded-neo-full bg-white/10">
                  <Camera size={24} />
                </span>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-widest">Take photo</h2>
                  <p className="text-xs text-on-dark-muted">Camera access, preview, capture, draft.</p>
                </div>
              </div>
              <NeoButton size="sm" variant="dark" disabled={busy !== null} onClick={requestCamera}>
                {cameraStream ? 'Reset' : 'Allow'}
              </NeoButton>
            </div>

            <div className="relative flex min-h-56 flex-1 items-center justify-center overflow-hidden rounded-neo bg-black/35">
              {cameraStream ? (
                <video ref={videoRef} autoPlay muted playsInline className="h-full min-h-56 w-full object-cover" />
              ) : photoDataUrl ? (
                <img src={photoDataUrl} alt="Captured found item" className="h-full min-h-56 w-full object-cover" />
              ) : (
                <Camera size={72} strokeWidth={1.2} className="text-white/70" />
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex flex-wrap gap-md">
              <NeoButton size="sm" variant="dark" disabled={!cameraStream || busy !== null} onClick={capturePhoto}>
                Capture
              </NeoButton>
              <NeoButton
                size="sm"
                variant="dark"
                disabled={!photoDataUrl || busy !== null}
                iconStart={<Sparkles size={14} />}
                onClick={() => createDraft('camera', 'Helping staff captured a photo of the found object at the campus help desk.')}
              >
                Create draft
              </NeoButton>
            </div>
          </motion.section>

          <motion.section
            transition={SPRING}
            className="flex min-h-[420px] min-w-0 flex-col gap-xl rounded-neo-lg bg-plate p-xl text-ink shadow-extrude"
          >
            <div className="flex items-center justify-between gap-md">
              <div className="flex items-center gap-md">
                <span className="flex size-12 items-center justify-center rounded-neo-full bg-plate shadow-extrude-sm">
                  <Mic size={24} />
                </span>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-widest">Voice record</h2>
                  <p className="text-xs text-ink-muted">Record details and auto-fill the description.</p>
                </div>
              </div>
              <NeoButton size="sm" disabled={busy !== null} onClick={requestMicrophone}>
                {microphoneStream ? 'Reset' : 'Allow'}
              </NeoButton>
            </div>

            <div className="flex min-h-56 flex-1 flex-col items-center justify-center gap-lg rounded-neo bg-plate p-xl text-center shadow-carve">
              <Mic size={72} strokeWidth={1.2} className={recording ? 'text-status-lost' : 'text-ink-muted'} />
              <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
                {voiceText || 'After microphone permission, record the object name, color, brand, marks, and where it was found.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-md">
              {recording ? (
                <NeoButton size="sm" iconStart={<PauseCircle size={14} />} disabled={busy !== null} onClick={stopRecording}>
                  Stop and fill
                </NeoButton>
              ) : (
                <NeoButton size="sm" iconStart={<PlayCircle size={14} />} disabled={busy !== null} onClick={startRecording}>
                  Start recording
                </NeoButton>
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  )
}
