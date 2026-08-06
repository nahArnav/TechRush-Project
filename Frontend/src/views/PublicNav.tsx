import { Home, LifeBuoy } from 'lucide-react'
import { ThemeToggle } from '../neo'

/*
 * Minimal unauthenticated glass header. Lets visitors reach help before signing
 * in, and carries the Light/Dark switch (Task 3.1). Styling mirrors the signed-in
 * ProfileNav — blurred glass fill, balanced margins, clean text buttons.
 */
export type PublicRoute = 'home' | 'support'

const LINKS: { id: PublicRoute; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <Home size={14} /> },
  { id: 'support', label: 'Support & Help', icon: <LifeBuoy size={14} /> },
]

export default function PublicNav({
  active = 'home',
  onNavigate,
}: {
  active?: PublicRoute
  onNavigate: (route: PublicRoute) => void
}) {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-lg px-2xl py-lg">
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className="glass flex items-center gap-md rounded-neo-full px-md py-md shadow-glass"
      >
        <span className="flex size-9 items-center justify-center rounded-neo-full bg-ink text-base font-black lowercase text-on-ink">
          f
        </span>
        <span className="pr-md text-sm font-black tracking-[0.1em] text-ink">
          Find<span className="text-ink-muted">It</span>
        </span>
      </button>

      <div className="flex items-center gap-md">
        <nav className="glass flex items-center gap-xs rounded-neo-full p-1 shadow-glass">
          {LINKS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onNavigate(l.id)}
              className={`inline-flex items-center gap-sm rounded-neo-full px-lg py-md text-xs font-medium tracking-wide transition-shadow ${
                active === l.id ? 'bg-plate text-ink shadow-carve' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {l.icon}
              <span className="hidden sm:inline">{l.label}</span>
            </button>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  )
}
