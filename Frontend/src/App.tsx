import { lazy, Suspense, useEffect, useState } from 'react'
import { Home, Map, PlusCircle } from 'lucide-react'
import { ThemeProvider, ToastProvider, useToast } from './neo'
import { type Claim, type Item, type Role } from './types'
import type { ReportPrefill } from './views/ReportItemModal'
import LandingPage from './views/LandingPage'
import LoginPage from './views/LoginPage'
import SupportPage from './views/SupportPage'
import PublicNav, { type PublicRoute } from './views/PublicNav'
import ProfileNav from './views/ProfileNav'
import StudentDashboard from './views/StudentDashboard'
import StaffDashboard from './views/StaffDashboard'
import ReportItemModal from './views/ReportItemModal'
import ClaimModal from './views/ClaimModal'
import SafeChatPanel from './views/SafeChatPanel'
import CampusMapModal from './views/CampusMapModal'
import LiquidBlobs from './views/LiquidBlobs'
import GlassDock, { type DockItem } from './views/GlassDock'

// Seed one in-flight claim so the shape-only workflow stepper (Feature 8) is visible.
const SEED_CLAIMS: Claim[] = [{ itemId: 'LF-1043', stage: 'review' }]
// Charting is only needed by the admin role — keep recharts out of the main bundle.
const AdminDashboard = lazy(() => import('./views/AdminDashboard'))

function AppInner() {
  const { push } = useToast()
  // Unauthenticated routing: landing → sign-in portal, plus the public
  // Support & Help page reachable before signing in (Directives 6 & 7).
  const [publicRoute, setPublicRoute] = useState<PublicRoute>('home')
  const [loginRole, setLoginRole] = useState<Role | null>(null)
  const [signedIn, setSignedIn] = useState(false)
  const [userId, setUserId] = useState('')
  // `authRole` is what the account is permitted to see; `role` is the section
  // currently being viewed within that permission set.
  const [authRole, setAuthRole] = useState<Role>('student')
  const [role, setRole] = useState<Role>('student')
  const [supportOpen, setSupportOpen] = useState(false)
  const [claims, setClaims] = useState<Claim[]>(SEED_CLAIMS)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportPrefill, setReportPrefill] = useState<ReportPrefill | null>(null)
  const [claimItem, setClaimItem] = useState<Item | null>(null)
  const [chatItem, setChatItem] = useState<Item | null>(null)
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

  if (!signedIn) {
    const shell = (children: React.ReactNode) => (
      <div className="relative flex min-h-screen flex-col">
        <LiquidBlobs />
        <div className="pointer-events-none fixed inset-0 z-0 backdrop-blur-[80px] bg-white/20 dark:bg-black/10" />
        <div className="relative z-10 flex flex-1 flex-col">{children}</div>
      </div>
    )

    if (publicRoute !== 'home') {
      return shell(
        <>
          <PublicNav active={publicRoute} onNavigate={setPublicRoute} />
          <div className="pt-24">
            <SupportPage />
          </div>
        </>,
      )
    }

    if (loginRole) {
      return shell(
        <LoginPage
          initialRole={loginRole}
          onBack={() => setLoginRole(null)}
          onNavigate={setPublicRoute}
          onSignIn={(r, id) => {
            setAuthRole(r)
            setRole(r)
            setUserId(id)
            setSignedIn(true)
          }}
        />,
      )
    }

    return shell(<LandingPage onSelectRole={setLoginRole} onNavigate={setPublicRoute} />)
  }

  const dockItems: DockItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home size={20} />,
      onClick: () => {
        setSupportOpen(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      },
      active: !supportOpen,
    },
    {
      id: 'report',
      label: 'Report item',
      icon: <PlusCircle size={20} />,
      onClick: () => {
        setReportPrefill(null)
        setReportOpen(true)
      },
    },
    { id: 'map', label: 'Campus map', icon: <Map size={20} />, onClick: () => setMapOpen(true) },
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
          authRole={authRole}
          userId={userId}
          onRole={(r) => {
            setSupportOpen(false)
            setRole(r)
          }}
          offline={offline}
          onToggleOffline={() => setOffline((o) => !o)}
          onSupport={() => setSupportOpen((s) => !s)}
          onSignOut={() => {
            setSignedIn(false)
            setLoginRole(null)
            setUserId('')
            setSupportOpen(false)
            setPublicRoute('home')
          }}
        />

        {supportOpen ? (
          <SupportPage />
        ) : role === 'student' ? (
          <StudentDashboard claims={claims} onClaim={setClaimItem} onChat={setChatItem} />
        ) : role === 'staff' ? (
          <StaffDashboard />
        ) : (
          <Suspense
            fallback={
              <main className="flex-1 px-2xl py-3xl">
                <div className="mx-auto max-w-6xl rounded-neo bg-plate p-2xl text-sm font-bold text-ink shadow-carve">
                  Loading command center…
                </div>
              </main>
            }
          >
            <AdminDashboard />
          </Suspense>
        )}
      </div>

      {role === 'student' ? <GlassDock items={dockItems} /> : null}

      <ReportItemModal isOpen={reportOpen} prefill={reportPrefill} onClose={() => setReportOpen(false)} />
      <ClaimModal item={claimItem} onClose={() => setClaimItem(null)} onSubmit={submitClaim} />
      <SafeChatPanel item={chatItem} onClose={() => setChatItem(null)} />
      <CampusMapModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        onReportHere={(prefill) => {
          setMapOpen(false)
          setReportPrefill(prefill)
          setReportOpen(true)
        }}
      />
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
