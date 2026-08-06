import { useEffect, useState } from 'react'
import { ArrowLeft, Calendar, FileText, Layers, ShieldCheck, UserCheck } from 'lucide-react'
import { GlassCard, GlassPanel, NeoPill } from '../neo'
import { fetchClaims, fetchItems, fetchUserActivity } from '../api'
import { ROLE_LABELS, type Claim, type Item, type Role } from '../types'
import WorkflowTracker from './WorkflowTracker'

export default function ProfilePage({
  userId,
  role,
  onBack,
}: {
  userId: string
  role: Role
  onBack: () => void
}) {
  const [activeTab, setActiveTab] = useState<'claims' | 'reports'>('reports')
  const [userClaims, setUserClaims] = useState<Claim[]>([])
  const [userReports, setUserReports] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfileData() {
      setLoading(true)
      try {
        const [acts, claims, items] = await Promise.all([
          fetchUserActivity(),
          fetchClaims(),
          fetchItems(),
        ])
        const reportIds = new Set(
          (acts || [])
            .filter((act: any) => act.action === 'report_submitted' && act.item_id)
            .map((act: any) => act.item_id),
        )
        const claimIds = new Set(
          (acts || [])
            .filter((act: any) => act.action === 'claim_submitted' && act.item_id)
            .map((act: any) => act.item_id),
        )
        setUserReports((items || []).filter((item) => reportIds.has(item.id)))
        setUserClaims((claims || []).filter((claim) => claimIds.has(claim.itemId)))
      } catch (err) {
        console.error('Failed to load profile data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfileData()
  }, [])

  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  return (
    <main className="flex-1 px-2xl py-3xl pb-32">
      <div className="mx-auto flex max-w-5xl flex-col gap-2xl">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-sm text-xs font-bold uppercase tracking-widest text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <GlassCard className="flex flex-col gap-xl p-2xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-xl">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-neo-full bg-ink text-2xl font-black uppercase text-on-ink shadow-float">
              {userId.charAt(0).toUpperCase()}
            </span>
            <div className="flex flex-col gap-xs">
              <div className="flex flex-wrap items-center gap-sm">
                <h1 className="text-2xl font-black tracking-tight text-ink">{userId}</h1>
                <span className="flex items-center gap-xs rounded-neo-full bg-plate px-md py-xs text-[10px] font-bold uppercase tracking-widest text-ink shadow-extrude-sm">
                  <UserCheck size={12} /> {ROLE_LABELS[role]}
                </span>
              </div>
              <p className="flex items-center gap-sm text-xs text-ink-muted">
                <ShieldCheck size={14} className="text-status-found" /> Verified Campus Account
                <span className="text-ink-muted/40">•</span>
                <Calendar size={13} /> Member since {formattedDate}
              </p>
            </div>
          </div>
        </GlassCard>

        <div className="flex flex-wrap gap-sm">
          <NeoPill
            active={activeTab === 'reports'}
            iconStart={<Layers size={14} />}
            onClick={() => setActiveTab('reports')}
          >
            My Reports ({userReports.length})
          </NeoPill>
          <NeoPill
            active={activeTab === 'claims'}
            iconStart={<FileText size={14} />}
            onClick={() => setActiveTab('claims')}
          >
            My Claims ({userClaims.length})
          </NeoPill>
        </div>

        {loading ? (
          <GlassPanel className="p-3xl text-center shadow-extrude">
            <p className="animate-pulse text-sm font-bold text-ink-muted">Loading profile information...</p>
          </GlassPanel>
        ) : activeTab === 'claims' ? (
          <GlassPanel className="flex flex-col gap-lg p-2xl shadow-float">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Claims Made By You</h2>
            {userClaims.length === 0 ? (
              <p className="py-xl text-center text-xs text-ink-muted">You have not submitted any item claims yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
                {userClaims.map((claim) => (
                  <div key={claim.id || claim.itemId} className="flex flex-col gap-md rounded-neo bg-plate p-xl shadow-carve-sm">
                    <div className="flex flex-wrap items-center justify-between gap-md">
                      <p className="text-sm font-bold text-ink">Item ID: {claim.itemId}</p>
                      <span className="rounded-neo-full border border-line px-md py-xs text-[10px] font-black uppercase tracking-widest text-ink-muted">
                        {claim.claimantRole}
                      </span>
                    </div>
                    <WorkflowTracker stage={claim.stage} />
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        ) : (
          <GlassPanel className="flex flex-col gap-lg p-2xl shadow-float">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Reports Made By You</h2>
            {userReports.length === 0 ? (
              <p className="py-xl text-center text-xs text-ink-muted">No items reported by you yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
                {userReports.map((item) => (
                  <div key={item.id} className="flex flex-col gap-md rounded-neo bg-plate p-xl shadow-carve-sm">
                    <div className="flex flex-wrap items-center justify-between gap-md">
                      <p className="text-sm font-bold text-ink">{item.title}</p>
                      <span className="rounded-neo-full border border-line px-md py-xs text-[10px] font-black uppercase tracking-widest text-ink">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted">{item.location}</p>
                    <p className="text-xs leading-relaxed text-ink-soft">{item.description}</p>
                    <div className="flex flex-wrap items-center justify-between gap-sm border-t border-line-soft pt-md text-[10px] text-ink-muted">
                      <span>Status: {item.status}</span>
                      <span>Date: {item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        )}
      </div>
    </main>
  )
}
