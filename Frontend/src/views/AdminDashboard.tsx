import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CheckCircle2, ClipboardList, PackageSearch } from 'lucide-react'
import { GlassPanel, LaneTitle } from '../neo'
import type { Claim, Item } from '../types'

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

export default function AdminDashboard({ items = [], claims = [] }: { items?: Item[]; claims?: Claim[] }) {
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
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">Claimed / in review</p>
            <p className="mt-sm text-3xl font-black text-ink">{claimedItems.length}</p>
          </GlassPanel>
          <GlassPanel className="p-xl shadow-carve-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">Open objects</p>
            <p className="mt-sm text-3xl font-black text-ink">{itemList.filter((item) => item.status === 'open').length}</p>
          </GlassPanel>
        </div>

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
