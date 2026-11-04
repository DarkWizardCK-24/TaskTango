import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { MIN_REGISTER_PASSWORD, passwordStrength, validateAuthForm, type AuthErrors, type AuthMode } from '../lib/authForm'

const inputCls =
  'w-full rounded-xl border border-line bg-bg2/60 px-3.5 py-3 text-base text-fg placeholder:text-muted/70 focus:border-coral/70 focus:outline-none focus:ring-2 focus:ring-coral/30 aria-[invalid=true]:border-[#d4143a]'

const BAR = ['bg-track', 'bg-[#d4143a]', 'bg-[#ff8a1f]', 'bg-[#f2b01e]', 'bg-[#ff5c47]']

export interface AuthFormProps {
  mode: AuthMode
  onModeChange: (m: AuthMode) => void
  busy?: boolean
  error?: string
  onSubmit: (email: string, password: string) => void
  onGoogle: () => void
  onForgot: (email: string) => void
}

export function AuthForm({ mode, onModeChange, busy, error, onSubmit, onGoogle, onForgot }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<AuthErrors>({})
  const strength = passwordStrength(password)

  const submit = () => {
    const e = validateAuthForm(mode, email, password)
    setErrors(e)
    if (e.email || e.password) return
    onSubmit(email.trim(), password)
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="space-y-4"
    >
      <div role="tablist" aria-label="Account" className="relative grid grid-cols-2 rounded-2xl bg-track p-1">
        {(['signin', 'register'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              onModeChange(m)
              setErrors({})
            }}
            className={`relative z-10 rounded-xl py-2 text-sm font-bold transition-colors ${mode === m ? 'text-white' : 'text-muted'}`}
          >
            {mode === m && (
              <motion.span
                layoutId="auth-tab"
                className="absolute inset-0 -z-10 rounded-xl bg-brand"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            {m === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="auth-email" className="block text-xs font-bold uppercase tracking-wide text-muted">
          Email
        </label>
        <input
          id="auth-email"
          data-autofocus
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'auth-email-err' : undefined}
          placeholder="you@example.com"
          className={inputCls}
        />
        {errors.email && (
          <p id="auth-email-err" role="alert" className="text-sm font-medium text-[#b40f30] dark:text-[#ff8a73]">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="auth-password" className="block text-xs font-bold uppercase tracking-wide text-muted">
          Password
        </label>
        <div className="relative">
          <input
            id="auth-password"
            type={show ? 'text' : 'password'}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'auth-password-err' : mode === 'register' ? 'auth-password-hint' : undefined}
            placeholder={mode === 'register' ? `At least ${MIN_REGISTER_PASSWORD} characters` : 'Your password'}
            className={`${inputCls} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
            className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-track"
          >
            {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
        {errors.password && (
          <p id="auth-password-err" role="alert" className="text-sm font-medium text-[#b40f30] dark:text-[#ff8a73]">
            {errors.password}
          </p>
        )}
        <AnimatePresence initial={false}>
          {mode === 'register' && (
            <motion.div
              key="strength"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-1.5 pt-1" aria-hidden="true">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${strength.score >= i ? BAR[strength.score] : 'bg-track'}`} />
                ))}
              </div>
              <p id="auth-password-hint" className="pt-1.5 text-xs text-muted" aria-live="polite">
                {password ? `${strength.label}. ` : ''}Use {MIN_REGISTER_PASSWORD}+ characters; a few words with numbers or symbols works well.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-[#d4143a]/10 p-3 text-sm font-medium text-[#b40f30] dark:text-[#ff8a73]">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl py-3 text-base font-bold">
        {busy && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
        {mode === 'signin' ? 'Sign in' : 'Create account'}
      </button>

      {mode === 'signin' && (
        <button
          type="button"
          onClick={() => onForgot(email)}
          className="block w-full text-center text-sm font-semibold text-[#b8431a] underline-offset-4 hover:underline dark:text-[#ffb36b]"
        >
          Forgot password?
        </button>
      )}

      <div className="flex items-center gap-3 text-xs font-semibold text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={onGoogle}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-bg2/60 py-3 text-base font-bold transition hover:border-coral/60"
      >
        <span
          aria-hidden="true"
          className="grid size-5 place-items-center rounded-full bg-fg text-[11px] font-extrabold leading-none text-bg"
        >
          G
        </span>
        Continue with Google
      </button>
    </form>
  )
}
