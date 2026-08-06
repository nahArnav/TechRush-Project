import { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Mic } from 'lucide-react'
import { LaneTitle, NeoSelect, SPRING } from '../neo'

/*
 * Helping-staff view — radically stripped back and high contrast. Two enormous
 * touch targets (Feature 10 & 26) and a language selector. No feed, no lanes.
 */
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'mr', label: 'मराठी (Marathi)' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
  { value: 'te', label: 'తెలుగు (Telugu)' },
]

export default function StaffDashboard() {
  const [lang, setLang] = useState('en')

  return (
    <main className="flex-1 px-2xl py-3xl">
      <div className="mx-auto flex h-full max-w-4xl flex-col gap-2xl">
        <div className="flex flex-wrap items-end justify-between gap-lg">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-ink">
              Log a <span className="font-black">found item</span>
            </h1>
            <p className="mt-xs text-sm text-ink-muted">Pick one. That’s it.</p>
          </div>
          <div className="w-56">
            <LaneTitle>Language</LaneTitle>
            <div className="mt-sm">
              <NeoSelect value={lang} onChange={setLang} options={LANGUAGES} />
            </div>
          </div>
        </div>

        <div className="grid flex-1 gap-xl sm:grid-cols-2">
          {/* Full-bleed touch panels — deliberately larger than any NeoButton pill */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={SPRING}
            className="glass-dark flex min-h-[340px] flex-col items-center justify-center gap-xl rounded-neo-lg p-2xl text-on-dark shadow-float"
          >
            <Camera size={72} strokeWidth={1.25} />
            <span className="text-2xl font-black uppercase tracking-widest">Take Photo</span>
            <span className="text-sm text-on-dark-muted">Snap the item — we handle the rest</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={SPRING}
            className="flex min-h-[340px] flex-col items-center justify-center gap-xl rounded-neo-lg bg-plate p-2xl text-ink shadow-extrude active:shadow-carve"
          >
            <Mic size={72} strokeWidth={1.25} />
            <span className="text-2xl font-black uppercase tracking-widest">Voice Record</span>
            <span className="text-sm text-ink-muted">Just say what you found</span>
          </motion.button>
        </div>
      </div>
    </main>
  )
}
