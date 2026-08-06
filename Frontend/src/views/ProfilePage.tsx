import { useEffect, useState } from 'react'
import { Activity, ArrowLeft, Calendar, CheckCircle2, Clock, FileText, Layers, ShieldCheck, UserCheck } from 'lucide-react'
import { GlassCard, GlassPanel, NeoButton, NeoPill } from '../neo'
import { fetchUserActivity, fetchClaims, fetchItems } from '../api'
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
  const [activeTab, setActiveTab] = useState<'activity' | 'claims' | 'reports'>('activity')
  const [activities, setActivities] = useState<any[]>([])
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
        setActivities(acts || [])
        setUserClaims(claims || [])
        setUserReports(items || [])
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
      <div className="mx-auto flex max-w-4xl flex-col gap-2xl">
        {/* Back button */}
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-sm text-xs font-bold uppercase tracking-widest text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>

        {/* User Card Header */}
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

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-sm">
          <NeoPill
            active={activeTab === 'activity'}
            iconStart={<Activity size={14} />}
            onClick={() => setActiveTab('activity')}
          >
            Activity Logs ({activities.length})
          </NeoPill>
          <NeoPill
            active={activeTab === 'claims'}
            iconStart={<FileText size={14} />}
            onClick={() => setActiveTab('claims')}
          >
            My Claims ({userClaims.length})
          </NeoPill>
          <NeoPill
            active={activeTab === 'reports'}
            iconStart={<Layers size={14} />}
            onClick={() => setActiveTab('reports')}
          >
            My Reported Items ({userReports.length})
          </NeoPill>
        </div>

        {/* Tab Content */}
        {loading ? (
          <GlassPanel className="p-3xl text-center shadow-extrude">
            <p className="text-sm font-bold text-ink-muted animate-pulse">Loading profile information…</p>
          </GlassPanel>
        ) : activeTab === 'activity' ? (
          <GlassPanel className="flex flex-col gap-lg p-2xl shadow-float">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Recent Interaction History</h2>
            {activities.length === 0 ? (
              <p className="py-xl text-center text-xs text-ink-muted">No recent activity logged yet.</p>
            ) : (
              <div className="flex flex-col gap-md">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="flex flex-col justify-between gap-sm rounded-neo bg-plate p-lg shadow-carve-sm sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-md">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-neo-full bg-ink/10 text-ink">
                        <Clock size={14} />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-ink">
                          Action: <span className="font-mono text-xs uppercase tracking-wider">{act.action}</span>
                          {act.item_id ? <span className="ml-2 font-normal text-ink-muted">(Item: {act.item_id})</span> : null}
                        </p>
                        {act.metadata ? (
                          <p className="text-[11px] text-ink-muted">
                            {JSON.stringify(act.metadata).replace(/[{}"]/g, ' ')}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <span className="text-[10px] font-medium tabular-nums text-ink-muted">
                      {new Date(act.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        ) : activeTab === 'claims' ? (
          <GlassPanel className="flex flex-col gap-lg p-2xl shadow-float">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Submitted Claims Status</h2>
            {userClaims.length === 0 ? (
              <p className="py-xl text-center text-xs text-ink-muted">You haven’t submitted any item claims yet.</p>
            ) : (
              <div className="flex flex-col gap-lg">
                {userClaims.map((c) => (
                  <div key={c.id || c.itemId} className="flex flex-col gap-md rounded-neo bg-plate p-xl shadow-carve-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-ink">Item ID: {c.itemId}</p>
                      <span className="text-xs text-ink-muted font-medium">Role: {c.claimantRole}</span>
                    </div>
                    <WorkflowTracker stage={c.stage} />
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        ) : (
          <GlassPanel className="flex flex-col gap-lg p-2xl shadow-float">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Items Reported by You</h2>
            {userReports.length === 0 ? (
              <p className="py-xl text-center text-xs text-ink-muted">No items reported by you yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
                {userReports.map((item) => (
                  <div key={item.id} className="flex flex-col gap-xs rounded-neo bg-plate p-lg shadow-carve-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-ink">{item.title}</p>
                      <span className="rounded-neo-full border px-md py-px text-[9px] font-black uppercase tracking-widest text-ink">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted">{item.location}</p>
                    <p className="text-[11px] text-ink-soft line-clamp-2">{item.description}</p>
                    <div className="mt-xs flex items-center justify-between border-t border-line-soft pt-xs text-[10px] text-ink-muted">
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
