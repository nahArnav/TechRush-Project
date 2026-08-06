import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { QrCode, ShieldAlert } from 'lucide-react'
import { GlassPanel, LaneTitle, NeoButton, NeoToggle } from '../neo'
import { ITEMS, type Item } from '../types'

/*
 * Admin command center (Module 4). Suspicious-claim detection (F24) and QR
 * tagging (F15) — all strictly grayscale.
 */

// A deterministic monochrome code plate (stylised QR for physical tagging).
function QrPlate({ seed }: { seed: string }) {
  const n = 11
  const base = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 7)
  const cells = Array.from({ length: n * n }, (_, i) => {
    const x = i % n
    const y = Math.floor(i / n)
    // solid finder squares in three corners
    const finder = (fx: number, fy: number) => x >= fx && x < fx + 3 && y >= fy && y < fy + 3
    if (finder(0, 0) || finder(n - 3, 0) || finder(0, n - 3)) return (x + y) % 2 === 0
    return ((base * (x + 1) * (y + 3)) >> 2) % 3 === 0
  })
  // Directive 4B: the code itself is always black-on-white, so it sits inside a
  // solid white, rounded, padded wrapper — otherwise it loses contrast against
  // the dark glass card in Dark Space Grey.
  return (
    <div className="shrink-0 rounded-neo bg-white p-lg shadow-carve">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, width: 132 }}>
        {cells.map((on, i) => (
          <span key={i} className={`aspect-square ${on ? 'bg-black' : 'bg-transparent'}`} />
        ))}
      </div>
    </div>
  )
}

const DEFAULT_TAG_ITEM: Item = {
  id: 'LF-1001',
  type: 'found',
  category: 'Electronics',
  title: 'Sample Tag Item',
  description: 'Physical tag sample item',
  location: 'Security Office',
  date: '2026-08-06',
  status: 'secured',
  matchScore: 0.95,
}

export default function AdminDashboard({ items = [] }: { items?: Item[] }) {
  const itemList = items.length ? items : [DEFAULT_TAG_ITEM]
  const [suspicious, setSuspicious] = useState(true)
  const [tagItem, setTagItem] = useState<Item>(itemList[0] || DEFAULT_TAG_ITEM)

  const byCategory = useMemo(() => {
    const counts = new Map<string, number>()
    itemList.forEach((i) => counts.set(i.category, (counts.get(i.category) ?? 0) + 1))
    return [...counts.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count).slice(0, 6)
  }, [itemList])

  return (
    <main className="flex-1 px-2xl py-3xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3xl">
        <div className="flex flex-col gap-xs">
          <h1 className="text-3xl font-light tracking-tight text-ink">
            Command <span className="font-black">Center</span>
          </h1>
          <p className="text-sm text-ink-muted">Trust &amp; analytics across campus</p>
        </div>

        <div className="grid gap-2xl lg:grid-cols-3">
          {/* Analytics */}
          <GlassPanel className="p-2xl shadow-extrude lg:col-span-2">
            <LaneTitle>Most commonly lost items</LaneTitle>
            <ResponsiveContainer width="100%" height={240} className="mt-lg">
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

          {/* Suspicious-claim detection (Feature 24) + QR tagging (Feature 15) */}
          <div className="flex flex-col gap-2xl">
            <GlassPanel className="p-2xl shadow-extrude">
              <LaneTitle>Trust</LaneTitle>
              <div className="mt-lg flex items-start justify-between gap-lg">
                <div>
                  <p className="flex items-center gap-sm text-sm font-bold text-ink">
                    <ShieldAlert size={15} /> Suspicious-claim detection
                  </p>
                  <p className="mt-xs text-xs text-ink-muted">Auto-flag users with anomalous claim patterns.</p>
                </div>
                <NeoToggle checked={suspicious} onChange={setSuspicious} label="Suspicious-claim detection" />
              </div>
            </GlassPanel>

            <GlassPanel className="p-2xl shadow-extrude">
              <LaneTitle>Physical tag</LaneTitle>
              <div className="mt-lg flex items-center gap-lg">
                <QrPlate seed={tagItem.id} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{tagItem.title}</p>
                  <p className="text-xs text-ink-muted">ID · {tagItem.id.toUpperCase()}</p>
                  <NeoButton
                    size="sm"
                    className="mt-md"
                    iconStart={<QrCode size={14} />}
                    onClick={() => setTagItem(itemList[Math.floor(Math.random() * itemList.length)] || DEFAULT_TAG_ITEM)}
                  >
                    New tag
                  </NeoButton>
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </main>
  )
}
