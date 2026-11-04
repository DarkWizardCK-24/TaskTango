import { useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, CloudCheck, CloudOff, LogIn, LogOut, RefreshCw, Smartphone, Trash2 } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { friendlyAuthError, type AuthMode } from '../lib/authForm'
import { useStore } from '../lib/store'
import { useUi } from '../lib/ui'
import { AuthForm } from './AuthForm'
import { ConfirmDialog } from './Dialogs'
import { Sheet } from './Sheet'

const LABEL = {
  local: 'On this device',
  synced: 'Synced',
  syncing: 'Syncing',
  offline: 'Offline',
  error: 'Sync issue',
} as const

/** Accessible sync indicator (role=status, polite live region). */
export function SyncBadge({ compact = false }: { compact?: boolean }) {
  const { sync } = useStore()
  const Icon = sync === 'synced' ? CloudCheck : sync === 'offline' ? CloudOff : sync === 'error' ? AlertTriangle : sync === 'syncing' ? RefreshCw : Smartphone
  const tone =
    sync === 'synced'
      ? 'bg-[#ff9a1f]/15 text-[#a8541a] dark:text-[#ffb36b]'
      : sync === 'error' || sync === 'offline'
        ? 'bg-[#d4143a]/12 text-[#b40f30] dark:text-[#ff8a73]'
        : 'bg-track text-muted'
  return (
    <span
      role="status"
      aria-live="polite"
      data-sync={sync}
      title={LABEL[sync]}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold ${tone}`}
    >
      <Icon size={14} className={sync === 'syncing' ? 'animate-spin' : ''} aria-hidden="true" />
      <span className={compact ? 'sr-only min-[420px]:not-sr-only' : ''}>{LABEL[sync]}</span>
    </span>
  )
}

export function AccountChip() {
  const auth = useAuth()
  const { setAuthOpen, setSettingsOpen } = useUi()
  if (!auth.available) return null
  if (auth.status === 'loading') return <span className="size-9" aria-hidden="true" />
  if (!auth.user) {
    return (
      <button
        type="button"
        onClick={() => setAuthOpen(true)}
        className="btn-brand inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold"
      >
        <LogIn size={15} aria-hidden="true" />
        Sign in
      </button>
    )
  }
  return (
    <div className="flex items-center gap-1.5">
      <SyncBadge compact />
      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        aria-label={`Account: ${auth.user.email ?? 'signed in'}`}
        className="grid size-9 place-items-center rounded-full bg-brand text-sm font-extrabold text-white"
      >
        {(auth.user.email ?? '?')[0].toUpperCase()}
      </button>
    </div>
  )
}

export function AuthDialog() {
  const auth = useAuth()
  const { authOpen, setAuthOpen } = useUi()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const close = () => {
    setAuthOpen(false)
    setError('')
  }

  const run = async (fn: () => Promise<void>, after?: () => void) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      after?.()
    } catch (e) {
      setError(friendlyAuthError((e as { code?: string }).code))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={authOpen}
      onClose={close}
      title={mode === 'signin' ? 'Welcome back' : 'Create your account'}
      description="Sync your tasks across devices. Your data stays private to you."
      width="460px"
    >
      <AuthForm
        mode={mode}
        onModeChange={(m) => {
          setMode(m)
          setError('')
        }}
        busy={busy}
        error={error}
        onSubmit={(email, pw) =>
          run(
            () => (mode === 'signin' ? auth.signIn(email, pw) : auth.register(email, pw)),
            () => {
              close()
              toast(mode === 'signin' ? 'Signed in' : 'Account created')
            },
          )
        }
        onGoogle={() =>
          run(
            () => auth.google(),
            () => {
              close()
              toast('Signed in with Google')
            },
          )
        }
        onForgot={(email) => {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
            setError('Enter your email above, then tap Forgot password.')
            return
          }
          void run(
            () => auth.resetPassword(email),
            () => toast('Check your inbox', { description: 'If that address has an account, a reset link is on its way.' }),
          )
        }}
      />
    </Sheet>
  )
}

export function MigrateDialog() {
  const { migration, acceptMigration, declineMigration } = useStore()
  return (
    <Sheet
      open={!!migration}
      onClose={declineMigration}
      title="Bring your tasks along?"
      width="460px"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={declineMigration} className="rounded-xl border border-line px-4 py-2.5 text-sm font-bold hover:bg-track">
            Keep separate
          </button>
          <button type="button" data-autofocus onClick={acceptMigration} className="btn-brand rounded-xl px-5 py-2.5 text-sm font-bold">
            Move to my account
          </button>
        </div>
      }
    >
      <p className="text-muted">
        You have {migration?.count} {migration?.count === 1 ? 'task' : 'tasks'} saved on this device. Move them into your account so
        they sync everywhere. Choosing &ldquo;Keep separate&rdquo; leaves them here for guest mode.
      </p>
    </Sheet>
  )
}

export function AccountSection() {
  const auth = useAuth()
  const { deleteCloudData, sync } = useStore()
  const { setAuthOpen, setSettingsOpen } = useUi()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmOut, setConfirmOut] = useState(false)
  if (!auth.available) return null

  return (
    <section aria-labelledby="set-account">
      <h3 id="set-account" className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
        Account
      </h3>
      {auth.user ? (
        <div className="space-y-3 rounded-2xl border border-line bg-bg2/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold" data-testid="account-email">
                {auth.user.email}
              </p>
              <p className="text-sm text-muted">Private to you. Synced in real time.</p>
            </div>
            <SyncBadge />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setConfirmOut(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm font-bold hover:border-coral/50"
            >
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#d4143a]/35 px-3 py-2.5 text-sm font-bold text-[#b40f30] hover:bg-[#d4143a]/10 dark:text-[#ff8a73]"
            >
              <Trash2 size={16} aria-hidden="true" />
              Delete cloud data
            </button>
          </div>
          {sync === 'offline' && <p className="text-xs text-muted">You are offline. Changes are saved here and will sync when you reconnect.</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-bg2/50 p-4">
          <div>
            <p className="font-semibold">Guest mode</p>
            <p className="text-sm text-muted">Tasks are stored on this device only. Sign in to sync them.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSettingsOpen(false)
              setAuthOpen(true)
            }}
            className="btn-brand shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold"
          >
            Sign in
          </button>
        </div>
      )}
      <ConfirmDialog
        open={confirmOut}
        title="Sign out?"
        message="Your tasks stay safe in your account. This device returns to guest mode with its own local tasks."
        confirmLabel="Sign out"
        onClose={() => setConfirmOut(false)}
        onConfirm={() => {
          setSettingsOpen(false)
          void auth.signOut().then(() => toast('Signed out'))
        }}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete your cloud data?"
        message="This permanently deletes every task and list stored in your account, on all devices. Your account itself is kept."
        confirmLabel="Delete cloud data"
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void deleteCloudData().catch(() => toast('Could not delete cloud data. Try again.'))}
      />
    </section>
  )
}
