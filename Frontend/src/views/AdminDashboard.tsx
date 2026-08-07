import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CheckCircle2, ClipboardList, PackageSearch, ShieldCheck, XCircle } from 'lucide-react'
import { GlassPanel, LaneTitle, useToast } from '../neo'
import { fetchAdminClaims, reviewAdminClaim } from '../api'
import type { AdminClaim, Claim, Item } from '../types'

function ObjectList({
  title,
  icon,
  items,
  empty,
}: {
  title: string
  icon: ReactNode
  items: Item[]
  empty: string
}) {
  return (
    <GlassPanel className="flex min-h-[320px] flex-col gap-lg p-2xl shadow-extrude">
      <LaneTitle>
        <span className="inline-flex items-center gap-sm">{icon}{title}</span>
      </LaneTitle>
      {items.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-center text-xs text-ink-muted">{empty}</p>
      ) : (
        <div className="no-scrollbar flex max-h-[420px] flex-col gap-md overflow-y-auto pr-sm">
          {items.map((item) => (
            <div key={item.id} className="rounded-neo bg-plate p-lg shadow-carve-sm">
              <div className="flex flex-wrap items-center justify-between gap-md">
                <p className="text-sm font-black text-ink">{item.title}</p>
                <span className="rounded-neo-full border border-line px-md py-xs text-[10px] font-black uppercase tracking-widest text-ink-muted">
                  {item.status}
                </span>
              </div>
              <p className="mt-xs text-xs text-ink-muted">{item.id} · {item.category} · {item.location}</p>
              <p className="mt-sm line-clamp-2 text-xs leading-relaxed text-ink-soft">{item.description}</p>
              {item.photos?.length ? (
                <div className="mt-md grid grid-cols-5 gap-xs">
                  {item.photos.slice(0, 5).map((photo, index) => (
                    <img key={`${item.id}-admin-photo-${index}`} src={photo} alt={`${item.title} reference ${index + 1}`} className="aspect-square rounded-neo object-cover shadow-carve-sm" />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  )
}

export default function AdminDashboard({ items = [], claims = [], onReviewComplete }: { items?: Item[]; claims?: Claim[]; onReviewComplete?: () => void }) {
  const { push } = useToast()
  const [pendingClaims, setPendingClaims] = useState<AdminClaim[]>([])
  const [loadingClaims, setLoadingClaims] = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const loadPendingClaims = async () => {
    setLoadingClaims(true)
    try {
      setPendingClaims(await fetchAdminClaims('pending'))
    } catch (error) {
      console.error('Failed to load pending claims:', error)
      push({ title: 'Claims unavailable', description: 'Could not load the approval queue.' })
    } finally {
      setLoadingClaims(false)
    }
  }

  useEffect(() => { loadPendingClaims() }, [])

  const reviewClaim = async (claim: AdminClaim, decision: 'approved' | 'rejected') => {
    const itemName = claim.item?.title || claim.itemId
    if (!window.confirm(`${decision === 'approved' ? 'Accept' : 'Reject'} this claim for ${itemName}?`)) return
    setReviewingId(claim.id)
    try {
      await reviewAdminClaim(claim.id, decision)
      setPendingClaims((current) => current.filter((entry) => entry.id !== claim.id))
      push({ title: `Claim ${decision}`, description: `${itemName} has been marked ${decision}.` })
      onReviewComplete?.()
    } catch (error: any) {
      push({ title: 'Review failed', description: error?.message || 'Please try again.' })
    } finally {
      setReviewingId(null)
    }
  }

  const itemList = items
  const claimedItemIds = new Set(claims.map((claim) => claim.itemId))
  const claimedItems = itemList.filter((item) => claimedItemIds.has(item.id) || item.status === 'closed' || item.status === 'in_review')

  const byCategory = useMemo(() => {
    const counts = new Map<string, number>()
    itemList.forEach((i) => counts.set(i.category, (counts.get(i.category) ?? 0) + 1))
    return [...counts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [itemList])

  return (
    <main className="flex-1 px-2xl py-3xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3xl">
        <div className="flex flex-col gap-xs">
          <h1 className="text-3xl font-light tracking-tight text-ink">
            Command <span className="font-black">Center</span>
          </h1>
          <p className="text-sm text-ink-muted">Admin-only overview of reports, claims, and campus object categories.</p>
        </div>

        <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
          <GlassPanel className="p-xl shadow-carve-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">Total reports</p>
            <p className="mt-sm text-3xl font-black text-ink">{itemList.length}</p>
          </GlassPanel>
          <GlassPanel className="p-xl shadow-carve-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">Pending approvals</p>
            <p className="mt-sm text-3xl font-black text-ink">{pendingClaims.length}</p>
          </GlassPanel>
          <GlassPanel className="p-xl shadow-carve-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">Open objects</p>
            <p className="mt-sm text-3xl font-black text-ink">{itemList.filter((item) => item.status === 'open').length}</p>
          </GlassPanel>
        </div>

        <GlassPanel className="flex flex-col gap-lg p-2xl shadow-extrude">
          <div className="flex flex-wrap items-center justify-between gap-md">
            <div>
              <LaneTitle><span className="inline-flex items-center gap-sm"><ShieldCheck size={15} />Claim Approval Queue</span></LaneTitle>
              <p className="mt-xs text-xs text-ink-muted">Compare the item, claimant, and proof of ownership before making a decision.</p>
            </div>
            <button type="button" onClick={loadPendingClaims} className="rounded-neo border border-line px-md py-sm text-[10px] font-black uppercase tracking-widest text-ink shadow-extrude-sm">Refresh</button>
          </div>
          {loadingClaims ? (
            <p className="py-xl text-center text-xs font-bold text-ink-muted">Loading pending claims...</p>
          ) : pendingClaims.length === 0 ? (
            <p className="py-xl text-center text-xs text-ink-muted">No claims are waiting for approval.</p>
          ) : (
            <div className="flex flex-col gap-md">
              {pendingClaims.map((claim) => {
                const busy = reviewingId === claim.id
                return (
                  <article key={claim.id} className="rounded-neo bg-plate p-lg shadow-carve-sm">
                    <div className="grid gap-lg lg:grid-cols-[1fr_1fr_1.4fr_auto] lg:items-center">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted">Item</p>
                        <p className="mt-xs text-sm font-black text-ink">{claim.item?.title || claim.itemId}</p>
                        <p className="mt-xs text-xs text-ink-muted">{claim.item?.category || 'Item ID'} · {claim.item?.location || claim.itemId}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted">Claimer</p>
                        <p className="mt-xs break-all text-sm font-bold text-ink">{claim.claimerEmail || claim.claimerId || 'Unknown user'}</p>
                        <p className="mt-xs text-xs uppercase text-ink-muted">{claim.claimantRole}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted">Proof of ownership</p>
                        <p className="mt-xs text-xs leading-relaxed text-ink-soft">{claim.proofDescription || 'No proof description supplied.'}</p>
                      </div>
                      <div className="flex flex-wrap gap-sm lg:flex-col">
                        <button disabled={busy} type="button" onClick={() => reviewClaim(claim, 'approved')} className="inline-flex items-center justify-center gap-xs rounded-neo bg-ink px-lg py-md text-[10px] font-black uppercase tracking-widest text-on-ink shadow-float disabled:opacity-50"><CheckCircle2 size={14} />Accept</button>
                        <button disabled={busy} type="button" onClick={() => reviewClaim(claim, 'rejected')} className="inline-flex items-center justify-center gap-xs rounded-neo border border-line px-lg py-md text-[10px] font-black uppercase tracking-widest text-ink shadow-extrude-sm disabled:opacity-50"><XCircle size={14} />Reject</button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </GlassPanel>

        <GlassPanel className="p-2xl shadow-extrude">
          <LaneTitle>Most commonly reported categories</LaneTitle>
          <ResponsiveContainer width="100%" height={260} className="mt-lg">
            <BarChart data={byCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="category" tick={{ fill: 'var(--ink-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'var(--ink-muted)', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ background: 'var(--plate)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--ink)' }}
              />
              <Bar dataKey="count" fill="var(--ink)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassPanel>

        <div className="grid grid-cols-1 gap-2xl lg:grid-cols-2">
          <ObjectList
            title="Reported Objects"
            icon={<ClipboardList size={14} />}
            items={itemList}
            empty="No reported objects yet."
          />
          <ObjectList
            title="Claimed Objects"
            icon={<CheckCircle2 size={14} />}
            items={claimedItems}
            empty="No objects have claims yet."
          />
        </div>

        <GlassPanel className="flex items-center gap-md p-lg text-xs text-ink-muted shadow-carve-sm">
          <PackageSearch size={16} />
          QR tagging and suspicious-claim detection have been removed from the admin interface.
        </GlassPanel>
      </div>
    </main>
  )
}
