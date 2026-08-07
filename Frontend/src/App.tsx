import { lazy, Suspense, useEffect, useState, Component, type ReactNode } from 'react'
import { trackActivity } from './trackActivity'
import { Home, Map, PlusCircle, User } from 'lucide-react'
import { ThemeProvider, ToastProvider, useToast } from './neo'
import { type Claim, type Item, type Notification, type Role } from './types'
import type { ReportPrefill } from './views/ReportItemModal'
import LandingPage from './views/LandingPage'
import LoginPage from './views/LoginPage'
import SupportPage from './views/SupportPage'
import ProfilePage from './views/ProfilePage'
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
import { fetchItems, fetchClaims, fetchUserActivity } from './api'

const AdminDashboard = lazy(() => import('./views/AdminDashboard'))

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; errorText: string }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, errorText: '' }
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorText: error?.toString() || 'Unknown UI Error' }
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('UI Exception caught by ErrorBoundary:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-2xl text-center bg-[#0e1117]">
          <div className="rounded-neo bg-plate p-2xl shadow-float max-w-lg border border-line">
            <h2 className="text-xl font-black text-ink">Application Interface Error</h2>
            <p className="mt-sm text-xs text-ink-muted font-mono bg-ink/5 p-md rounded-neo text-left overflow-x-auto max-h-32">
              {this.state.errorText}
            </p>
            <div className="mt-lg flex flex-wrap justify-center gap-md">
              <button
                onClick={() => {
                  this.setState({ hasError: false, errorText: '' })
                }}
                className="rounded-neo bg-plate px-xl py-md text-xs font-bold text-ink shadow-extrude"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  localStorage.clear()
                  this.setState({ hasError: false, errorText: '' })
                  window.location.href = '/'
                }}
                className="rounded-neo bg-ink px-xl py-md text-xs font-bold text-on-ink shadow-float"
              >
                Reset Session &amp; Reload
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function AppInner() {
  const { push } = useToast()
  const [publicRoute, setPublicRoute] = useState<PublicRoute>('home')
  const [loginRole, setLoginRole] = useState<Role | null>(null)
  const [signedIn, setSignedIn] = useState(false)
  const [userId, setUserId] = useState('')
  const [authRole, setAuthRole] = useState<Role>('student')
  const [role, setRole] = useState<Role>('student')
  const [supportOpen, setSupportOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [ownReportIds, setOwnReportIds] = useState<Set<string>>(new Set())
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [reportOpen, setReportOpen] = useState(false)
  const [reportPrefill, setReportPrefill] = useState<ReportPrefill | null>(null)
  const [claimItem, setClaimItem] = useState<Item | null>(null)
  const [chatItem, setChatItem] = useState<Item | null>(null)
  const [mapOpen, setMapOpen] = useState(false)

  const loadBackendData = async () => {
    try {
      const [liveItems, liveClaims, activity] = await Promise.all([
        fetchItems(),
        fetchClaims(),
        fetchUserActivity(),
      ])
      setItems(liveItems || [])
      setClaims(liveClaims || [])
      const reports = new Set<string>()
      activity.forEach((entry: any) => {
        if (entry.action === 'report_submitted' && entry.item_id) reports.add(entry.item_id)
      })
      setOwnReportIds(reports)
      const realNotifications: Notification[] = []
      activity.slice(0, 20).forEach((entry: any) => {
        const item = liveItems.find((i) => i.id === entry.item_id)
        if (entry.action === 'report_submitted' && item) {
          realNotifications.push({ title: 'Report submitted', body: `${item.title} is now listed as ${item.type}.` })
        }
        if (entry.action === 'claim_submitted' && item) {
          realNotifications.push({ title: 'Claim submitted', body: `${item.title} is under review.` })
        }
        if (entry.action === 'save_search') {
          const query = entry.metadata?.query
          realNotifications.push({ title: 'Search saved', body: query ? `Alerts are active for "${query}".` : 'Alerts are active for new matches.' })
        }
      })
      setNotifications(realNotifications.slice(0, 6))
    } catch (err) {
      console.error('Failed to load data from backend:', err)
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    const savedEmail = localStorage.getItem('user_email')
    const savedRole = localStorage.getItem('user_role') as Role | null
    if (savedToken && savedEmail) {
      const userRole = savedRole || 'student'
      setAuthRole(userRole)
      setRole(userRole)
      setUserId(savedEmail)
      setSignedIn(true)
    }
  }, [])

  useEffect(() => {
    if (signedIn) {
      loadBackendData()
    }
  }, [signedIn])

  const submitClaim = (item: Item, proof: string) => {
    setClaimItem(null)
    trackActivity('claim_submitted', item.id, { category: item.category })
    push({ title: 'Claim submitted', description: 'Verification is under review.' })
    loadBackendData()
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
            trackActivity('login', undefined, { role: r })
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
        setProfileOpen(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        trackActivity('page_view', undefined, { page: 'home' })
      },
      active: !supportOpen && !profileOpen,
    },
    {
      id: 'report',
      label: 'Report item',
      icon: <PlusCircle size={20} />,
      onClick: () => {
        setReportPrefill(null)
        setReportOpen(true)
        trackActivity('report_opened')
      },
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: <User size={20} />,
      onClick: () => {
        setSupportOpen(false)
        setProfileOpen(true)
        trackActivity('page_view', undefined, { page: 'profile' })
      },
      active: profileOpen,
    },
    { id: 'map', label: 'Campus map', icon: <Map size={20} />, onClick: () => { setMapOpen(true); trackActivity('map_opened') } },
  ]

  return (
    <ErrorBoundary>
      <div className="relative flex min-h-screen flex-col">
        <LiquidBlobs />
        <div className="pointer-events-none fixed inset-0 z-0 backdrop-blur-[80px] bg-white/20 dark:bg-black/10" />
        <div className="relative z-10 flex flex-1 flex-col">
          <ProfileNav
            role={role}
            authRole={authRole}
            userId={userId}
            onProfile={() => {
              setSupportOpen(false)
              setProfileOpen((p) => !p)
            }}
            onSupport={() => {
              setProfileOpen(false)
              setSupportOpen((s) => !s)
              trackActivity('support_opened')
            }}
            onSignOut={() => {
              trackActivity('logout')
              localStorage.removeItem('auth_token')
              localStorage.removeItem('user_email')
              localStorage.removeItem('user_role')
              setSignedIn(false)
              setLoginRole(null)
              setUserId('')
              setSupportOpen(false)
              setProfileOpen(false)
              setPublicRoute('home')
              setOwnReportIds(new Set())
              setNotifications([])
            }}
            notifications={notifications}
          />

          {profileOpen ? (
            <ProfilePage userId={userId} role={role} onBack={() => setProfileOpen(false)} />
          ) : supportOpen ? (
            <SupportPage />
          ) : role === 'student' ? (
            <StudentDashboard items={items} claims={claims} ownReportIds={ownReportIds} onClaim={setClaimItem} onChat={setChatItem} />
          ) : role === 'staff' ? (
            <StaffDashboard
              onDraftReport={(prefill) => {
                setReportPrefill(prefill)
                setReportOpen(true)
              }}
            />
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
              <AdminDashboard items={items} claims={claims} onReviewComplete={loadBackendData} />
            </Suspense>
          )}
        </div>

        {role === 'student' ? <GlassDock items={dockItems} /> : null}

        <ReportItemModal
          isOpen={reportOpen}
          prefill={reportPrefill}
          onClose={() => {
            setReportOpen(false)
            loadBackendData()
          }}
        />
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
          onSelectItem={(item) => {
            if (!ownReportIds.has(item.id)) setClaimItem(item)
          }}
        />
      </div>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AppInner />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
