import { useEffect, useState } from 'react'
import { Home, Map, PlusCircle, Video } from 'lucide-react'
import { NeoButton, NeoModal, ThemeProvider, ToastProvider, useToast } from './neo'
import { ROLE_LABELS, type Claim, type Item, type Role } from './types'
import LandingPage from './views/LandingPage'
import LoginPage from './views/LoginPage'
import ProfileNav from './views/ProfileNav'
import StudentDashboard from './views/StudentDashboard'
import StaffDashboard from './views/StaffDashboard'
import AdminDashboard from './views/AdminDashboard'
import ReportItemModal from './views/ReportItemModal'
import ClaimModal from './views/ClaimModal'
import SafeChatPanel from './views/SafeChatPanel'
import CampusMapModal from './views/CampusMapModal'
import LiquidBlobs from './views/LiquidBlobs'
import GlassDock, { type DockItem } from './views/GlassDock'

// Seed one in-flight claim so the shape-only workflow stepper (Feature 8) is visible.
const SEED_CLAIMS: Claim[] = [{ itemId: 'LF-1043', stage: 'review' }]

function AppInner() {
  const { push } = useToast()
  const [signedIn, setSignedIn] = useState(false)
  const [authView, setAuthView] = useState<'landing' | 'login'>('landing')
  const [role, setRole] = useState<Role>('student')
  const [userId, setUserId] = useState<string>('')
  const [claims, setClaims] = useState<Claim[]>(SEED_CLAIMS)
  const [reportOpen, setReportOpen] = useState(false)
  const [claimItem, setClaimItem] = useState<Item | null>(null)
  const [chatItem, setChatItem] = useState<Item | null>(null)
  const [cctvOpen, setCctvOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [offline, setOffline] = useState(false)

  // Offline support (Feature 27): dim the UI and prompt to save as a draft.
  // Depend only on `offline` — `push` is stable but keeping it out of deps makes
  // it impossible for this effect to re-fire in a loop when it pushes a toast.
  useEffect(() => {
    if (offline) push({ title: 'You’re offline', description: 'Saved as draft', action: { label: 'Save draft', onClick: () => {} } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline])

  const submitClaim = (item: Item) => {
    setClaims((prev) => (prev.some((c) => c.itemId === item.id) ? prev : [...prev, { itemId: item.id, stage: 'submitted' }]))
    setClaimItem(null)
    push({ title: 'Claim submitted', description: 'Verification is under review.' })
  }

  const handleSignIn = (r: Role, id: string) => {
    setRole(r)
    setUserId(id)
    setSignedIn(true)
    push({
      title: `Welcome, ${id}!`,
      description: `Signed in to ${ROLE_LABELS[r]} Dashboard.`,
    })
  }

  const handleSignOut = () => {
    setSignedIn(false)
    setAuthView('landing')
    push({ title: 'Signed out', description: 'You have been safely signed out.' })
  }

  if (!signedIn) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onSelectRole={(selectedRole) => {
            setRole(selectedRole)
            setAuthView('login')
          }}
        />
      )
    }

    return (
      <LoginPage
        initialRole={role}
        onSignIn={handleSignIn}
        onBack={() => setAuthView('landing')}
      />
    )
  }

  const dockItems: DockItem[] = [
    { id: 'home', label: 'Home', icon: <Home size={20} />, onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }), active: true },
    { id: 'report', label: 'Report item', icon: <PlusCircle size={20} />, onClick: () => setReportOpen(true) },
    { id: 'map', label: 'Campus map', icon: <Map size={20} />, onClick: () => setMapOpen(true) },
    { id: 'cctv', label: 'CCTV request', icon: <Video size={20} />, onClick: () => setCctvOpen(true) },
  ]

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* MARKER-MAKE-KIT-INVOKED */}
      {/* Module 1 — Diffused Liquid Glass: moving blobs (z-[-1]) behind a global frost (z-0) */}
      <LiquidBlobs />
      <div className="pointer-events-none fixed inset-0 z-0 backdrop-blur-[80px] bg-white/20 dark:bg-black/10" />
      <div className={`relative z-10 flex flex-1 flex-col transition-all duration-300 ${offline ? 'pointer-events-none grayscale-[0.4] opacity-60' : ''}`}>
        <ProfileNav
          role={role}
          userId={userId}
          onRole={setRole}
          offline={offline}
          onToggleOffline={() => setOffline((o) => !o)}
          onSignOut={handleSignOut}
        />

        {role === 'student' ? (
          <StudentDashboard claims={claims} onClaim={setClaimItem} onChat={setChatItem} />
        ) : role === 'staff' ? (
          <StaffDashboard />
        ) : (
          <AdminDashboard />
        )}
      </div>

      {role === 'student' ? <GlassDock items={dockItems} /> : null}

      <ReportItemModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
      <ClaimModal item={claimItem} onClose={() => setClaimItem(null)} onSubmit={submitClaim} />
      <SafeChatPanel item={chatItem} onClose={() => setChatItem(null)} />
      <CampusMapModal isOpen={mapOpen} onClose={() => setMapOpen(false)} />

      {/* CCTV request workflow to security (Feature 24) */}
      <NeoModal
        isOpen={cctvOpen}
        onClose={() => setCctvOpen(false)}
        icon={<Video size={24} />}
        title="Request CCTV review"
        footer={
          <>
            <NeoButton variant="raised" onClick={() => setCctvOpen(false)}>
              Cancel
            </NeoButton>
            <NeoButton
              variant="dark"
              onClick={() => {
                setCctvOpen(false)
                push({ title: 'Request sent to security', description: 'You’ll hear back within 24 hours.' })
              }}
            >
              Send request
            </NeoButton>
          </>
        }
      >
        <p className="text-center text-sm">
          Security will review footage from the time and place you lost your item, then follow up privately.
        </p>
      </NeoModal>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </ThemeProvider>
  )
}
