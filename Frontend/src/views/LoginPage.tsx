import { useState } from 'react'
import { ArrowLeft, BadgeCheck, Eye, EyeOff, KeyRound, Lock, Shield, User } from 'lucide-react'
import { GlassCard, NeoButton, NeoInput, NeoPill } from '../neo'
import { ROLE_LABELS, type Role } from '../types'
import PublicNav, { type PublicRoute } from './PublicNav'

/*
 * Campus portal sign-in. ID + password per role, with quick demo autofill for
 * testing. Carries the unauthenticated glass header (Directive 7) so visitors can
 * reach Support & Help or Contact without an account.
 */
const DEMO_CREDENTIALS: Record<Role, { id: string; name: string }> = {
  student: { id: 'STU-2024-8891', name: 'Student Demo' },
  staff: { id: 'STF-102', name: 'Staff Demo' },
  admin: { id: 'ADM-001', name: 'Admin Demo' },
}

const roleIcon = (r: Role) =>
  r === 'student' ? <User size={16} /> : r === 'staff' ? <BadgeCheck size={16} /> : <Shield size={16} />

const ID_LABEL: Record<Role, string> = {
  student: 'Student PRN / Roll Number',
  staff: 'Staff Employee ID',
  admin: 'Admin Access ID',
}
const ID_PLACEHOLDER: Record<Role, string> = {
  student: 'e.g. STU-2024-8891',
  staff: 'e.g. STF-102',
  admin: 'e.g. ADM-001',
}

export default function LoginPage({
  initialRole = 'student',
  onSignIn,
  onBack,
  onNavigate,
}: {
  initialRole?: Role
  onSignIn: (role: Role, userId: string) => void
  onBack?: () => void
  onNavigate: (route: PublicRoute) => void
}) {
  const [role, setRole] = useState<Role>(initialRole)
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole)
    setError('')
    // Clear demo-filled inputs when switching roles so IDs never mismatch.
    if (/^(STU|STF|ADM)-/.test(userId)) {
      setUserId('')
      setPassword('')
    }
  }

  const fillDemo = (demoRole: Role) => {
    setRole(demoRole)
    setUserId(DEMO_CREDENTIALS[demoRole].id)
    setPassword('pict#2026')
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId.trim()) return setError('Please enter your Campus ID / PRN.')
    if (!password.trim()) return setError('Please enter your password.')

    setError('')
    setIsLoading(true)
    // Brief tactile delay so the spring press reads before the view swaps.
    setTimeout(() => {
      setIsLoading(false)
      onSignIn(role, userId.trim())
    }, 400)
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-2xl pt-28">
      <PublicNav active="home" onNavigate={onNavigate} />

      {/* Ambient background blur elements */}
      <div className="pointer-events-none absolute -left-32 -top-24 size-[420px] rounded-neo-full bg-white/40 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 size-[460px] rounded-neo-full bg-black/10 blur-[130px]" />

      <div className="relative flex w-full max-w-[480px] flex-col items-center">
        {onBack ? (
          <div className="mb-lg flex w-full justify-start">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-sm text-xs font-bold uppercase tracking-widest text-ink-muted transition-colors hover:text-ink"
            >
              <ArrowLeft size={16} /> Back to Home
            </button>
          </div>
        ) : null}

        <span className="mb-lg inline-flex items-center gap-md rounded-neo-full bg-plate px-lg py-md text-[11px] font-black uppercase tracking-[0.25em] text-ink shadow-extrude-sm">
          PICT Campus Portal
        </span>

        <h1 className="mb-xs text-center text-3xl font-black tracking-tight text-ink">Portal Sign In</h1>
        <p className="mb-xl text-center text-xs uppercase tracking-widest text-ink-muted">
          Enter your ID and password to access your dashboard
        </p>

        <GlassCard className="w-full p-2xl">
          {/* Role selection tab pills */}
          <div className="mb-xl">
            <label className="mb-xs block text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">
              Select role
            </label>
            <div className="grid grid-cols-3 gap-xs rounded-neo-full bg-plate p-1 shadow-carve">
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleChange(r)}
                  className={`flex h-10 items-center justify-center gap-xs rounded-neo-full text-xs font-bold transition-all ${
                    role === r ? 'bg-plate text-ink shadow-extrude-sm' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {roleIcon(r)}
                  <span>{ROLE_LABELS[r]}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
            <div>
              <label className="mb-xs block text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">
                {ID_LABEL[role]}
              </label>
              <NeoInput
                icon={roleIcon(role)}
                value={userId}
                onChange={(val) => {
                  setUserId(val)
                  if (error) setError('')
                }}
                placeholder={ID_PLACEHOLDER[role]}
                autoFocus
              />
            </div>

            <div>
              <label className="mb-xs block text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">
                Password
              </label>
              <div className="relative flex items-center rounded-neo-full bg-plate px-xl shadow-carve">
                <Lock size={16} className="mr-md shrink-0 text-ink-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="••••••••••••"
                  className="h-12 w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="shrink-0 p-xs text-ink-muted transition-colors hover:text-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error ? (
              <div
                role="alert"
                className="rounded-neo border border-line bg-plate px-lg py-md text-xs font-medium text-ink shadow-carve-sm"
              >
                {error}
              </div>
            ) : null}

            <NeoButton
              type="submit"
              variant="dark"
              size="lg"
              className="mt-xs w-full"
              disabled={isLoading}
              iconEnd={<KeyRound size={18} />}
            >
              {isLoading ? 'Authenticating…' : `Sign in as ${ROLE_LABELS[role]}`}
            </NeoButton>
          </form>

          {/* Quick demo autofill for testing */}
          <div className="mt-2xl border-t border-line pt-xl">
            <p className="mb-md text-center text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">
              Quick test credentials
            </p>
            <div className="flex flex-wrap justify-center gap-xs">
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <NeoPill
                  key={r}
                  active={role === r && userId === DEMO_CREDENTIALS[r].id}
                  iconStart={roleIcon(r)}
                  onClick={() => fillDemo(r)}
                >
                  Fill {ROLE_LABELS[r]}
                </NeoPill>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
