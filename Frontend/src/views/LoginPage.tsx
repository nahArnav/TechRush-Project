import { useState } from 'react'
import { ArrowLeft, BadgeCheck, Eye, EyeOff, KeyRound, Lock, Shield, User, UserPlus } from 'lucide-react'
import { GlassCard, NeoButton, NeoInput, NeoPill } from '../neo'
import { ROLE_LABELS, type Role } from '../types'
import PublicNav, { type PublicRoute } from './PublicNav'
import { trackActivity } from '../trackActivity'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const DEMO_CREDENTIALS: Record<Role, { id: string; email: string }> = {
  student: { id: 'STU-2024-8891', email: 'student@pict.edu' },
  staff: { id: 'STF-102', email: 'staff@pict.edu' },
  admin: { id: 'ADM-001', email: 'admin@pict.edu' },
}

const roleIcon = (r: Role) =>
  r === 'student' ? <User size={16} /> : r === 'staff' ? <BadgeCheck size={16} /> : <Shield size={16} />

export default function LoginPage({
  initialRole = 'student',
  onSignIn,
  onBack,
  onNavigate,
}: {
  initialRole?: Role
  onSignIn: (role: Role, userId: string, token?: string) => void
  onBack?: () => void
  onNavigate: (route: PublicRoute) => void
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [role, setRole] = useState<Role>(initialRole)
  const [emailOrId, setEmailOrId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole)
    setError('')
  }

  const fillDemo = (demoRole: Role) => {
    setRole(demoRole)
    setEmailOrId(DEMO_CREDENTIALS[demoRole].email)
    setPassword('pict#2026')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailOrId.trim()) return setError('Please enter your Email or Campus ID.')
    if (!password.trim()) return setError('Please enter your password.')

    setError('')
    setIsLoading(true)

    const cleanInput = emailOrId.trim()
    const email = cleanInput.includes('@') ? cleanInput : `${cleanInput.toLowerCase()}@pict.edu`

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role: mode === 'register' ? role : undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const token = data.access_token
        const userRole = (data.role as Role) || role
        const displayId = data.email || cleanInput

        // Store token securely in localStorage (Requirement 4)
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user_email', data.email || email)
        localStorage.setItem('user_role', userRole)

        setIsLoading(false)
        trackActivity(mode === 'register' ? 'register' : 'login', undefined, { email, role: userRole })
        onSignIn(userRole, displayId, token)
        return
      }

      const errData = await response.json().catch(() => ({}))
      const msg =
        errData.detail ||
        (mode === 'register' ? 'Registration failed. Email may already be registered.' : 'Invalid email or password.')

      setError(msg)
    } catch {
      // Demo ID shortcut fallback (e.g. STU-2024-8891) if backend server is offline
      if (mode === 'login' && !cleanInput.includes('@')) {
        setIsLoading(false)
        trackActivity('login', undefined, { role, demo: true })
        onSignIn(role, cleanInput)
        return
      }
      setError('Unable to connect to authentication server.')
    } finally {
      setIsLoading(false)
    }
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

        <h1 className="mb-xs text-center text-3xl font-black tracking-tight text-ink">
          {mode === 'register' ? 'Create Account' : 'Portal Sign In'}
        </h1>
        <p className="mb-xl text-center text-xs uppercase tracking-widest text-ink-muted">
          {mode === 'register' ? 'Register your credentials' : 'Enter your email/ID and password to sign in'}
        </p>

        <GlassCard className="w-full p-2xl">
          {/* Sign In vs Register Mode Toggle */}
          <div className="mb-lg flex rounded-neo-full bg-plate p-1 shadow-carve">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError('')
              }}
              className={`flex-1 py-sm text-xs font-bold transition-all rounded-neo-full ${
                mode === 'login' ? 'bg-plate text-ink shadow-extrude-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setError('')
              }}
              className={`flex-1 py-sm text-xs font-bold transition-all rounded-neo-full ${
                mode === 'register' ? 'bg-plate text-ink shadow-extrude-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Register
            </button>
          </div>

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
                Email Address / Campus ID
              </label>
              <NeoInput
                icon={roleIcon(role)}
                value={emailOrId}
                onChange={(val) => {
                  setEmailOrId(val)
                  if (error) setError('')
                }}
                placeholder={mode === 'register' ? 'student@pict.edu' : 'student@pict.edu or STU-2024-8891'}
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
                ⚠️ {error}
              </div>
            ) : null}

            <NeoButton
              type="submit"
              variant="dark"
              size="lg"
              className="mt-xs w-full"
              disabled={isLoading}
              iconEnd={mode === 'register' ? <UserPlus size={18} /> : <KeyRound size={18} />}
            >
              {isLoading
                ? 'Connecting…'
                : mode === 'register'
                ? `Create ${ROLE_LABELS[role]} Account`
                : `Sign in as ${ROLE_LABELS[role]}`}
            </NeoButton>
          </form>

          {/* Quick demo autofill */}
          <div className="mt-2xl border-t border-line pt-xl">
            <p className="mb-md text-center text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">
              Quick test credentials
            </p>
            <div className="flex flex-wrap justify-center gap-xs">
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <NeoPill
                  key={r}
                  active={role === r && emailOrId === DEMO_CREDENTIALS[r].email}
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
