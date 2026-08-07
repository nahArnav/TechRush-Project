import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Moon, Sun, X } from 'lucide-react'

type Theme = 'light' | 'dark'
type ThemeCtx = { theme: Theme; toggle: () => void }
const ThemeContext = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = window.localStorage.getItem('neo-theme') as Theme | null
    if (stored) return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('neo-theme', theme)
  }, [theme])
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) return { theme: 'light' as Theme, toggle: () => {} }
  return ctx
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={`Switch to ${dark ? 'Light Titanium' : 'Dark Space Grey'}`}
      onClick={toggle}
      className="relative flex h-9 w-16 items-center rounded-neo-full bg-plate px-1 shadow-carve"
    >
      <Sun size={13} className="absolute left-2.5 text-ink-muted" />
      <Moon size={13} className="absolute right-2.5 text-ink-muted" />
      <motion.span
        layout
        transition={SPRING}
        className={`z-10 flex size-7 items-center justify-center rounded-neo-full bg-plate text-ink shadow-extrude-sm ${dark ? 'ml-auto' : ''}`}
      >
        {dark ? <Moon size={13} /> : <Sun size={13} />}
      </motion.span>
    </button>
  )
}

export const SPRING = { type: 'spring', stiffness: 420, damping: 30, mass: 0.9 } as const

export function Tooltip({
  label,
  side = 'bottom',
  children,
  className = '',
}: {
  label: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  children: ReactNode
  className?: string
}) {
  const pos: Record<string, string> = {
    top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
    bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
    left: 'right-full top-1/2 mr-2 -translate-y-1/2',
    right: 'left-full top-1/2 ml-2 -translate-y-1/2',
  }
  return (
    <span className={`group/tt relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-[110] whitespace-nowrap rounded-neo-full border border-line bg-plate px-md py-xs text-[11px] font-semibold tracking-wide text-ink opacity-0 shadow-float transition-opacity duration-150 ease-out group-hover/tt:opacity-100 ${pos[side]}`}
      >
        {label}
      </span>
    </span>
  )
}
const PRESS = { scale: 0.96 }
const LIFT = { scale: 1.03 }

export function GlassPanel({
  className = '',
  dark = false,
  children,
}: {
  className?: string
  dark?: boolean
  children: ReactNode
}) {
  return (
    <div className={`${dark ? 'glass-dark shadow-glass' : 'glass shadow-glass'} rounded-neo ${className}`}>
      {children}
    </div>
  )
}

export function GlassCard({
  className = '',
  dark = false,
  children,
}: {
  className?: string
  dark?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={`${dark ? 'glass-dark shadow-float' : 'glass shadow-glass-lg'} rounded-neo-lg ${className}`}
    >
      {children}
    </div>
  )
}

type NeoVariant = 'raised' | 'dark' | 'ghost'
type NeoSize = 'sm' | 'md' | 'lg'

const VARIANT: Record<NeoVariant, string> = {
  raised: 'bg-plate text-ink shadow-extrude active:shadow-carve',
  dark: 'glass-dark text-on-dark shadow-glass',
  ghost: 'text-ink-soft hover:text-ink',
}
const SIZE: Record<NeoSize, string> = {
  sm: 'h-9 px-lg text-xs',
  md: 'h-11 px-xl text-sm',
  lg: 'h-14 px-2xl text-base',
}

type NeoButtonProps = {
  variant?: NeoVariant
  size?: NeoSize
  iconStart?: ReactNode
  iconEnd?: ReactNode
  uppercase?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>

export function NeoButton({
  variant = 'raised',
  size = 'md',
  iconStart,
  iconEnd,
  uppercase = true,
  className = '',
  children,
  disabled,
  ...props
}: NeoButtonProps) {
  return (
    <motion.button
      whileTap={disabled ? undefined : PRESS}
      transition={SPRING}
      disabled={disabled}
      className={`inline-flex min-w-0 cursor-pointer items-center justify-center gap-md rounded-neo-full font-medium leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${uppercase ? 'tracking-widest uppercase' : ''} ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...(props as any)}
    >
      {iconStart}
      {children}
      {iconEnd}
    </motion.button>
  )
}

export function NeoIconButton({
  icon,
  size = 'md',
  dark = false,
  className = '',
  ...props
}: { icon: ReactNode; size?: NeoSize; dark?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const dim = size === 'lg' ? 'size-14' : size === 'sm' ? 'size-9' : 'size-11'
  return (
    <motion.button
      whileTap={PRESS}
      transition={SPRING}
      className={`inline-flex cursor-pointer items-center justify-center rounded-neo-full ${dim} ${dark ? 'glass-dark text-on-dark shadow-glass' : 'bg-plate text-ink shadow-extrude active:shadow-carve'} ${className}`}
      {...(props as any)}
    >
      {icon}
    </motion.button>
  )
}

export function NeoPill({
  active = false,
  iconStart,
  className = '',
  children,
  ...props
}: { active?: boolean; iconStart?: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      whileTap={PRESS}
      transition={SPRING}
      className={`inline-flex cursor-pointer items-center gap-sm rounded-neo-full bg-plate px-lg py-md text-xs font-medium tracking-wide text-ink transition-shadow ${active ? 'shadow-carve text-ink' : 'shadow-extrude-sm'} ${className}`}
      {...(props as any)}
    >
      {iconStart}
      {children}
    </motion.button>
  )
}

export function NeoInput({
  icon,
  onChange,
  className = '',
  ...props
}: { icon?: ReactNode; onChange?: (v: string) => void } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange'
>) {
  return (
    <span
      className={`flex items-center gap-md rounded-neo-full bg-plate px-xl shadow-carve ${className}`}
    >
      {icon ? <span className="text-ink-muted">{icon}</span> : null}
      <input
        onChange={(e) => onChange?.(e.target.value)}
        className="h-12 w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        {...props}
      />
    </span>
  )
}

export function NeoSelect({
  value,
  onChange,
  options,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  className?: string
}) {
  return (
    <div className={`relative flex items-center rounded-neo-full bg-plate shadow-carve ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full cursor-pointer appearance-none bg-transparent px-xl pr-2xl text-sm text-ink focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-xl text-ink-muted" />
    </div>
  )
}

export function NeoToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-neo-full bg-plate px-1 shadow-carve"
    >
      <motion.span
        layout
        transition={SPRING}
        className={`size-6 rounded-neo-full bg-plate shadow-extrude-sm ${checked ? 'ml-auto' : ''}`}
      >
        <span className={`block size-full rounded-neo-full ${checked ? 'bg-ink/85' : ''}`} />
      </motion.span>
    </button>
  )
}

export function NeoModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  tone = 'light',
  icon,
  size = 'md',
}: {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  tone?: 'light' | 'dark'
  icon?: ReactNode
  size?: 'md' | 'full'
}) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const dark = tone === 'dark'

  if (size === 'full') {
    return createPortal(
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed left-0 top-0 z-[999] flex h-[100dvh] w-screen items-stretch justify-center bg-scrim p-0 backdrop-blur-md sm:p-xl"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.98, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 16 }}
              transition={SPRING}
              className={`relative flex h-full w-full flex-col overflow-hidden rounded-none shadow-float sm:h-[92dvh] sm:w-[92vw] sm:min-w-[720px] sm:max-w-7xl sm:rounded-neo-lg ${dark ? 'glass-dark border-white/40 text-on-dark' : 'glass text-ink'}`}
            >
              <header className="flex shrink-0 items-center justify-between gap-lg border-b border-line-soft px-xl py-lg sm:px-2xl">
                <div className="flex items-center gap-md">
                  {icon ? (
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-neo-full ${dark ? 'border border-white/40 text-white' : 'bg-plate text-ink shadow-extrude-sm'}`}
                    >
                      {icon}
                    </span>
                  ) : null}
                  <div className="min-w-0">
                    {title ? (
                      <h2 className={`truncate text-lg font-black tracking-tight ${dark ? 'text-white' : 'text-ink'}`}>
                        {title}
                      </h2>
                    ) : null}
                    {subtitle ? <p className="truncate text-xs text-ink-muted">{subtitle}</p> : null}
                  </div>
                </div>
                <NeoIconButton size="sm" dark={dark} icon={<X size={18} />} onClick={onClose} aria-label="Close" />
              </header>

              <div className={`no-scrollbar flex w-full flex-1 overflow-y-auto px-xl py-xl sm:px-2xl ${dark ? 'text-on-dark-muted' : 'text-ink-soft'}`}>
                {children}
              </div>

              {footer ? (
                <div className="flex shrink-0 items-center justify-end gap-md border-t border-line-soft px-xl py-lg sm:px-2xl">
                  {footer}
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    )
  }

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed left-0 top-0 z-[999] flex h-screen w-screen items-center justify-center bg-scrim p-xl backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={SPRING}
            className={`relative w-full min-w-0 max-w-2xl rounded-neo-lg p-2xl shadow-float sm:min-w-[28rem] ${dark ? 'glass-dark border-2 border-white text-on-dark' : 'glass shadow-extrude text-ink'}`}
          >
            {icon ? (
              <div className="mb-lg flex justify-center">
                <span
                  className={`flex size-14 items-center justify-center rounded-neo-full ${dark ? 'border-2 border-white text-white' : 'bg-plate text-ink shadow-extrude'}`}
                >
                  {icon}
                </span>
              </div>
            ) : null}
            {title ? (
              <h2
                className={`mb-md text-center text-xl font-black tracking-tight ${dark ? 'text-white' : 'text-ink'}`}
              >
                {title}
              </h2>
            ) : null}
            <div className={dark ? 'text-on-dark-muted' : 'text-ink-soft'}>{children}</div>
            {footer ? <div className="mt-2xl flex justify-center gap-md">{footer}</div> : null}
            {!footer && !dark ? (
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 text-ink-muted hover:text-ink"
              >
                <X size={18} />
              </button>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

type Toast = { id: number; title: string; description?: string; action?: { label: string; onClick: () => void } }
type ToastCtx = { push: (t: Omit<Toast, 'id'>) => void }
const ToastContext = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200)
  }, [])

  const value = useMemo(() => ({ push }), [push])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-md px-xl">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ y: 40, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              transition={SPRING}
              className="pointer-events-auto flex items-center justify-between gap-lg rounded-neo bg-plate px-xl py-lg shadow-extrude"
            >
              <div>
                <p className="text-sm font-bold tracking-tight text-ink">{t.title}</p>
                {t.description ? <p className="text-xs text-ink-muted">{t.description}</p> : null}
              </div>
              {t.action ? (
                <NeoPill onClick={t.action.onClick}>{t.action.label}</NeoPill>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function LaneTitle({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <h2
      className={`text-xs font-black uppercase tracking-[0.25em] ${dark ? 'text-on-dark' : 'text-ink'}`}
    >
      {children}
    </h2>
  )
}
