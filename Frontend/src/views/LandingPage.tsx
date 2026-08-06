import { KeyRound, ShieldCheck } from 'lucide-react'
import { GlassCard, NeoButton } from '../neo'
import { ROLE_LABELS, type Role } from '../types'
import PublicNav, { type PublicRoute } from './PublicNav'

/*
 * Monochrome Neo-Glass hero. Floating grayscale glass over the radial-gradient
 * canvas; hierarchy comes from weight (font-light vs font-black) and wide
 * uppercase tracking — never color. Picking a role routes to the sign-in portal.
 */
const ROLES: Role[] = ['student', 'staff', 'admin']

export default function LandingPage({
  onSelectRole,
  onNavigate,
}: {
  onSelectRole: (role: Role) => void
  onNavigate: (route: PublicRoute) => void
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-2xl pt-28">
      <PublicNav active="home" onNavigate={onNavigate} />

      {/* Ambient blurred glass orbs — pure grayscale */}
      <div className="pointer-events-none absolute -left-32 -top-24 size-[420px] rounded-neo-full bg-white/40 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 size-[460px] rounded-neo-full bg-black/10 blur-[130px]" />

      <div className="relative flex w-full max-w-[520px] flex-col items-center text-center">
        <span className="mb-2xl inline-flex items-center gap-md rounded-neo-full bg-plate px-lg py-md text-[11px] font-black uppercase tracking-[0.25em] text-ink shadow-extrude-sm">
          PICT Campus Lost &amp; Found
        </span>

        <h1 className="text-ink" style={{ fontSize: 52, lineHeight: 1.05 }}>
          <span className="font-light">Lost it on campus?</span>
          <br />
          <span className="font-black">We’ll find it.</span>
        </h1>

        <GlassCard className="mt-3xl w-full p-2xl text-left">
          <h2 className="text-xs font-black uppercase tracking-[0.25em] text-ink">Campus access portal</h2>
          <p className="mt-xs text-sm text-ink-muted">Select your role to sign in with your ID and password.</p>

          <div className="mt-xl flex flex-col gap-md">
            {ROLES.map((role) => (
              <NeoButton
                key={role}
                variant={role === 'student' ? 'dark' : 'raised'}
                uppercase={false}
                iconEnd={<KeyRound size={16} />}
                onClick={() => onSelectRole(role)}
                className="w-full justify-between"
              >
                Sign in as {ROLE_LABELS[role]} (ID &amp; password)
              </NeoButton>
            ))}
          </div>

          <p className="mt-xl flex items-center justify-center gap-sm text-xs text-ink-muted">
            <ShieldCheck size={14} />
            Secure platform restricted to verified students, staff, and admin
          </p>
        </GlassCard>
      </div>
    </div>
  )
}
