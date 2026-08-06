import { useState } from 'react'
import { ArrowLeft, BadgeCheck, Eye, EyeOff, KeyRound, Lock, Shield, User } from 'lucide-react'
import { GlassCard, NeoButton, NeoInput, NeoPill } from '../neo'
import { ROLE_LABELS, type Role } from '../types'

const DEMO_CREDENTIALS: Record<Role, { id: string; name: string }> = {
  student: { id: 'STU-2024-8891', name: 'Student Demo' },
  staff: { id: 'STF-102', name: 'Staff Demo' },
  admin: { id: 'ADM-001', name: 'Admin Demo' },
}

export default function LoginPage({
  initialRole = 'student',
  onSignIn,
  onBack,
}: {
  initialRole?: Role
  onSignIn: (role: Role, userId: string) => void
  onBack?: () => void
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
    // Clear inputs when switching roles unless using demo fill
    if (userId.startsWith('STU-') || userId.startsWith('STF-') || userId.startsWith('ADM-')) {
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
    if (!userId.trim()) {
      setError('Please enter your Campus ID / PRN.')
      return
    }
    if (!password.trim()) {
      setError('Please enter your password.')
      return
    }

    setError('')
    setIsLoading(true)

    // Brief tactile spring loading delay before sign-in
    setTimeout(() => {
      setIsLoading(false)
      onSignIn(role, userId.trim())
    }, 400)
  }

  const getRoleIcon = (r: Role) => {
    switch (r) {
      case 'student':
        return <User size={16} />
      case 'staff':
        return <BadgeCheck size={16} />
      case 'admin':
        return <Shield size={16} />
    }
  }

  const getIdLabel = () => {
    switch (role) {
      case 'student':
        return 'Student PRN / Roll Number'
      case 'staff':
        return 'Staff Employee ID'
      case 'admin':
        return 'Admin Access ID'
    }
  }

  const getIdPlaceholder = () => {
    switch (role) {
      case 'student':
        return 'e.g. STU-2024-8891'
      case 'staff':
        return 'e.g. STF-102'
      case 'admin':
        return 'e.g. ADM-001'
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-2xl">
      {/* Ambient background blur elements */}
      <div className="pointer-events-none absolute -left-32 -top-24 size-[420px] rounded-neo-full bg-white/40 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 size-[460px] rounded-neo-full bg-black/10 blur-[130px]" />

      <div className="relative flex w-full max-w-[480px] flex-col items-center">
        {/* Back navigation button if available */}
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

        <h1 className="text-center text-ink text-3xl font-black tracking-tight mb-2">
          Portal Sign In
        </h1>
        <p className="text-center text-xs text-ink-muted uppercase tracking-widest mb-xl">
          Enter your ID and Password to access your dashboard
        </p>

        <GlassCard className="w-full p-2xl">
          {/* Role selection tab pills */}
          <div className="mb-xl">
            <label className="mb-xs block text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">
              Select Role
            </label>
            <div className="grid grid-cols-3 gap-xs rounded-neo-full bg-plate p-1 shadow-carve">
              {(['student', 'staff', 'admin'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleChange(r)}
                  className={`flex h-10 items-center justify-center gap-xs rounded-neo-full text-xs font-bold transition-all ${
                    role === r
                      ? 'bg-plate text-ink shadow-extrude-sm'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {getRoleIcon(r)}
                  <span>{ROLE_LABELS[r]}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
            {/* ID Input */}
            <div>
              <label className="mb-xs block text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">
                {getIdLabel()}
              </label>
              <NeoInput
                icon={getRoleIcon(role)}
                value={userId}
                onChange={(val) => {
                  setUserId(val)
                  if (error) setError('')
                }}
                placeholder={getIdPlaceholder()}
                autoFocus
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="mb-xs block text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">
                Password
              </label>
              <div className="relative flex items-center rounded-neo-full bg-plate px-xl shadow-carve">
                <Lock size={16} className="text-ink-muted mr-md shrink-0" />
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
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="p-xs text-ink-muted hover:text-ink transition-colors shrink-0"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error ? (
              <div className="rounded-neo bg-plate px-lg py-md text-xs font-medium text-ink border border-ink/10 shadow-carve-sm">
                ⚠️ {error}
              </div>
            ) : null}

            {/* Submit Button */}
            <NeoButton
              type="submit"
              variant="dark"
              size="lg"
              className="mt-xs w-full"
              disabled={isLoading}
              iconEnd={<KeyRound size={18} />}
            >
              {isLoading ? 'Authenticating...' : `Sign In as ${ROLE_LABELS[role]}`}
            </NeoButton>
          </form>

          {/* Quick Demo Autofill section for easy user testing */}
          <div className="mt-2xl border-t border-ink/10 pt-xl">
            <p className="mb-md text-center text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">
              Quick Test Credentials
            </p>
            <div className="flex flex-wrap justify-center gap-xs">
              {(['student', 'staff', 'admin'] as Role[]).map((r) => (
                <NeoPill
                  key={r}
                  active={role === r && userId === DEMO_CREDENTIALS[r].id}
                  onClick={() => fillDemo(r)}
                >
                  {r === 'student' ? '🎓' : r === 'staff' ? '🏷️' : '🛡️'} Fill {ROLE_LABELS[r]}
                </NeoPill>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
