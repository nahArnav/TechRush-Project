import { useMemo, useState } from 'react'
import { Bookmark, Search } from 'lucide-react'
import { GlassPanel, LaneTitle, NeoIconButton, NeoInput, useToast } from '../neo'
import { ITEMS, type Claim, type Item } from '../types'
import NeoCard from './NeoCard'

/*
 * Dynamic Discovery feed (Module 2). No grids — horizontal scrolling lanes like
 * the App Store. Lane 1 "AI Matches" uses inverted dark-glass cards for contrast.
 */
function Lane({
  title,
  items,
  variant,
  claims,
  onClaim,
  onChat,
  dark = false,
}: {
  title: string
  items: Item[]
  variant?: 'default' | 'ai'
  claims: Claim[]
  onClaim: (i: Item) => void
  onChat: (i: Item) => void
  dark?: boolean
}) {
  if (!items.length) return null
  return (
    <section className="flex flex-col gap-lg">
      <LaneTitle dark={dark}>{title}</LaneTitle>
      <div className="no-scrollbar -mx-2xl flex gap-xl overflow-x-auto px-2xl pb-md">
        {items.map((item) => (
          <NeoCard
            key={item.id}
            item={item}
            variant={variant}
            claim={claims.find((c) => c.itemId === item.id)}
            onClaim={onClaim}
            onChat={onChat}
          />
        ))}
      </div>
    </section>
  )
}

export default function StudentDashboard({
  claims,
  onClaim,
  onChat,
}: {
  claims: Claim[]
  onClaim: (item: Item) => void
  onChat: (item: Item) => void
}) {
  const [query, setQuery] = useState('')
  const { push } = useToast()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ITEMS
    return ITEMS.filter((i) =>
      `${i.title} ${i.description} ${i.location} ${i.category}`.toLowerCase().includes(q),
    )
  }, [query])

  const aiMatches = [...results].filter((i) => i.matchScore >= 0.85).sort((a, b) => b.matchScore - a.matchScore)
  const found = results.filter((i) => i.type === 'found')
  const lost = results.filter((i) => i.type === 'lost')

  const saveSearch = () =>
    push({
      title: 'Search saved',
      description: query ? `We’ll alert you about “${query}”.` : 'We’ll alert you about new matches.',
    })

  return (
    <main className="flex-1 px-2xl py-3xl pb-32">
      <div className="mx-auto flex max-w-6xl flex-col gap-3xl">
        {/* Search row + saved searches (Feature 18) + CCTV request (Feature 24) */}
        <div className="flex flex-col gap-lg">
          <h1 className="text-3xl font-light tracking-tight text-ink">
            Lost it? <span className="font-black">We’ll find it.</span>
          </h1>
          <div className="flex flex-wrap items-center gap-md">
            <NeoInput
              className="min-w-64 flex-1"
              icon={<Search size={18} />}
              value={query}
              onChange={setQuery}
              placeholder="Search 'Black wallet lost near the canteen'"
            />
            <NeoIconButton icon={<Bookmark size={18} />} onClick={saveSearch} aria-label="Save this search" />
          </div>
          <p className="text-xs text-ink-muted">Use the dock below to report an item, open the campus map, or request CCTV.</p>
        </div>

        {/* Lane 1 — AI Matches on a dark glass shelf for maximum contrast */}
        {aiMatches.length ? (
          <GlassPanel dark className="p-2xl shadow-float">
            <Lane title="AI Matches" items={aiMatches} variant="ai" claims={claims} onClaim={onClaim} onChat={onChat} dark />
          </GlassPanel>
        ) : null}

        <Lane title="Recently found on campus" items={found} claims={claims} onClaim={onClaim} onChat={onChat} />
        <Lane title="Reported lost" items={lost} claims={claims} onClaim={onClaim} onChat={onChat} />

        {!results.length ? (
          <GlassPanel className="p-3xl text-center shadow-extrude">
            <p className="text-lg font-light text-ink">Nothing matches “{query}”.</p>
            <p className="mt-xs text-sm text-ink-muted">Try fewer words, or report the item so we watch for it.</p>
          </GlassPanel>
        ) : null}
      </div>
    </main>
  )
}
