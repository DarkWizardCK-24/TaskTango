import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Check, Download, Monitor, Moon, Sun, Trash2, Upload } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { serializeExport, validateImport } from '../lib/schema'
import { useStore } from '../lib/store'
import { useUi } from '../lib/ui'
import { LIST_COLORS, type AppData, type ThemePref } from '../lib/types'
import { AccountSection } from './Account'
import { QuickAdd } from './QuickAdd'
import { Sheet } from './Sheet'

export function Composer() {
  const { composerOpen, setComposerOpen } = useUi()
  return (
    <Sheet open={composerOpen} onClose={() => setComposerOpen(false)} title="New task" description="Type naturally. Dates, priority and lists are picked up as you go.">
      <QuickAdd autoFocus large onAdded={() => setComposerOpen(false)} />
    </Sheet>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      width="440px"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" data-autofocus onClick={onClose} className="rounded-xl border border-line px-4 py-2.5 text-sm font-bold hover:bg-track">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="rounded-xl bg-[#b40f30] px-4 py-2.5 text-sm font-bold text-white hover:brightness-110"
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-muted">{message}</p>
    </Sheet>
  )
}

export function NewListDialog() {
  const { listDialogOpen, setListDialogOpen, setView } = useUi()
  const { addList, lists } = useStore()
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(LIST_COLORS[2])
  const [error, setError] = useState('')

  const close = () => {
    setListDialogOpen(false)
    setName('')
    setError('')
  }
  const submit = () => {
    const n = name.trim()
    if (!n) return setError('Name your list.')
    if (lists.some((l) => l.name.toLowerCase() === n.toLowerCase())) return setError('A list with that name already exists.')
    const l = addList(n, color)
    close()
    setView({ kind: 'list', id: l.id })
  }

  return (
    <Sheet open={listDialogOpen} onClose={close} title="New list" width="440px">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="space-y-1.5">
          <label htmlFor="list-name" className="block text-xs font-bold uppercase tracking-wide text-muted">
            Name
          </label>
          <input
            id="list-name"
            data-autofocus
            value={name}
            maxLength={30}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            placeholder="e.g. Side project"
            aria-invalid={!!error}
            className="w-full rounded-xl border border-line bg-bg2/60 px-3.5 py-2.5 text-base focus:border-coral/70 focus:outline-none focus:ring-2 focus:ring-coral/30"
          />
          {error && (
            <p role="alert" className="text-sm font-medium text-[#b40f30] dark:text-[#ff8a73]">
              {error}
            </p>
          )}
        </div>
        <fieldset>
          <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Colour</legend>
          <div role="radiogroup" aria-label="List colour" className="flex flex-wrap gap-3">
            {LIST_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={`Colour ${c}`}
                onClick={() => setColor(c)}
                className="grid size-9 place-items-center rounded-full ring-offset-2 ring-offset-[var(--solid)] transition"
                style={{ background: c, boxShadow: color === c ? `0 0 0 2px var(--solid), 0 0 0 4px ${c}` : undefined }}
              >
                {color === c && <Check size={16} className="text-white" strokeWidth={3} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="btn-brand w-full rounded-xl py-3 text-base font-bold">
          Create list
        </button>
      </form>
    </Sheet>
  )
}

const SHORTCUTS: [string[], string][] = [
  [['N'], 'New task (focus quick add)'],
  [['/'], 'New task (focus quick add)'],
  [['?'], 'Show this help'],
  [['Esc'], 'Close dialogs, clear quick add'],
  [['Ctrl', 'Z'], 'Undo last delete or complete (Cmd+Z on Mac)'],
  [['Enter'], 'Add the task in quick add'],
  [['Ctrl', 'Enter'], 'Save the task editor'],
]

export function ShortcutsHelp() {
  const { helpOpen, setHelpOpen } = useUi()
  return (
    <Sheet open={helpOpen} onClose={() => setHelpOpen(false)} title="Keyboard shortcuts" width="480px">
      <dl className="m-0 divide-y divide-line">
        {SHORTCUTS.map(([keys, label], i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-3">
            <dt className="text-sm">{label}</dt>
            <dd className="m-0 flex shrink-0 gap-1">
              {keys.map((k) => (
                <kbd
                  key={k}
                  className="min-w-7 rounded-lg border border-line bg-track px-2 py-1 text-center font-mono text-xs font-bold shadow-[0_2px_0_var(--line)]"
                >
                  {k}
                </kbd>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 rounded-2xl bg-bg2/70 p-4 text-sm text-muted">
        <p className="font-bold text-fg">Quick add syntax</p>
        <p className="mt-1">
          <code className="font-mono text-fg">Buy milk !high #home tomorrow at 5pm</code> sets priority, list, date and time. Use{' '}
          <code className="font-mono text-fg">mon</code>-<code className="font-mono text-fg">sun</code>,{' '}
          <code className="font-mono text-fg">in 3d</code>, <code className="font-mono text-fg">@tag</code> and{' '}
          <code className="font-mono text-fg">!low</code> / <code className="font-mono text-fg">!med</code> as well.
        </p>
      </div>
    </Sheet>
  )
}

const THEMES: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

interface Pending {
  data: AppData
  dropped: number
  fileName: string
}

export function SettingsDialog() {
  const { settingsOpen, setSettingsOpen, setHelpOpen } = useUi()
  const { prefs, setPrefs, getData, importData, resetAll, tasks } = useStore()
  const auth = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [mode, setMode] = useState<'merge' | 'replace'>('merge')
  const [importError, setImportError] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setImportError('')
    setPending(null)
    if (file.size > 5_000_000) return setImportError('That file is too large (limit 5 MB).')
    const res = validateImport(await file.text())
    if (!res.ok) return setImportError(res.error)
    setPending({ data: res.data, dropped: res.dropped, fileName: file.name })
  }

  const applyImport = () => {
    if (!pending) return
    importData(pending.data, mode)
    toast(`${mode === 'merge' ? 'Merged' : 'Imported'} ${pending.data.tasks.length} tasks`)
    setPending(null)
  }

  const toggleNotifications = async () => {
    if (prefs.notifications) return setPrefs({ notifications: false })
    if (!('Notification' in window)) return toast('This browser does not support notifications')
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
    if (perm === 'granted') {
      setPrefs({ notifications: true })
      toast('Reminders on', { description: 'You will get a nudge shortly before timed tasks are due while this tab is open.' })
    } else {
      toast('Notifications are blocked', { description: 'Allow them in your browser settings to turn reminders on.' })
    }
  }

  const close = () => {
    setSettingsOpen(false)
    setPending(null)
    setImportError('')
  }

  return (
    <>
      <Sheet open={settingsOpen} onClose={close} title="Settings" variant="drawer">
        <div className="space-y-7">
          <AccountSection />
          <section aria-labelledby="set-theme">
            <h3 id="set-theme" className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Appearance
            </h3>
            <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
              {THEMES.map((t) => {
                const Icon = t.icon
                const active = prefs.theme === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPrefs({ theme: t.value })}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                      active ? 'border-transparent bg-brand text-white' : 'border-line bg-bg2/60 hover:border-coral/50'
                    }`}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {t.label}
                  </button>
                )
              })}
            </div>
          </section>

          <section aria-labelledby="set-notify">
            <h3 id="set-notify" className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Reminders
            </h3>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-bg2/50 p-4">
              <div>
                <p className="font-semibold">Notify me when a task is due soon</p>
                <p className="text-sm text-muted">Only while Task Tango is open in a tab. Off by default.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.notifications}
                aria-label="Due soon notifications"
                onClick={toggleNotifications}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${prefs.notifications ? 'bg-brand' : 'bg-track'}`}
              >
                <span
                  className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${prefs.notifications ? 'left-6' : 'left-1'}`}
                />
              </button>
            </div>
          </section>

          <section aria-labelledby="set-data">
            <h3 id="set-data" className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Your data
            </h3>
            <p className="mb-3 text-sm text-muted">
              {auth.user
                ? 'Your tasks are saved to your private account and cached on this device for offline use. Export a backup any time, or import tasks (they sync to your account).'
                : 'Everything is stored on this device only. Export a backup any time, or bring tasks in from another device.'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  download(`tasktango-${new Date().toISOString().slice(0, 10)}.json`, serializeExport(getData()))
                  toast('Exported your tasks')
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-line bg-bg2/60 px-3 py-2.5 text-sm font-bold hover:border-coral/50"
              >
                <Download size={16} aria-hidden="true" />
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-xl border border-line bg-bg2/60 px-3 py-2.5 text-sm font-bold hover:border-coral/50"
              >
                <Upload size={16} aria-hidden="true" />
                Import JSON
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                aria-label="Import file"
                className="sr-only"
                onChange={(e) => {
                  void onFile(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </div>
            {importError && (
              <p role="alert" className="mt-3 rounded-xl bg-[#d4143a]/10 p-3 text-sm font-medium text-[#b40f30] dark:text-[#ff8a73]">
                {importError}
              </p>
            )}
            {pending && (
              <div className="mt-3 space-y-3 rounded-2xl border border-line bg-bg2/60 p-4" role="group" aria-label="Import options">
                <p className="text-sm">
                  <strong>{pending.fileName}</strong>: {pending.data.tasks.length} tasks
                  {pending.dropped > 0 && `, ${pending.dropped} skipped as invalid`}.
                </p>
                <div role="radiogroup" aria-label="Import mode" className="grid grid-cols-2 gap-2">
                  {(['merge', 'replace'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={mode === m}
                      onClick={() => setMode(m)}
                      className={`rounded-xl border px-3 py-2 text-sm font-bold capitalize transition ${
                        mode === m ? 'border-transparent bg-fg text-bg' : 'border-line hover:border-coral/50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted">
                  {mode === 'merge' ? 'Adds new tasks and keeps everything you already have.' : 'Replaces all current tasks and lists with the file contents.'}
                </p>
                <button type="button" onClick={applyImport} className="btn-brand w-full rounded-xl py-2.5 text-sm font-bold">
                  Import {pending.data.tasks.length} tasks
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d4143a]/35 px-3 py-2.5 text-sm font-bold text-[#b40f30] hover:bg-[#d4143a]/10 dark:text-[#ff8a73]"
            >
              <Trash2 size={16} aria-hidden="true" />
              Reset everything
            </button>
          </section>

          <section className="flex items-center justify-between rounded-2xl bg-bg2/60 p-4 text-sm">
            <span className="text-muted">{tasks.length} tasks {auth.user ? 'in your account' : 'stored locally'}</span>
            <button
              type="button"
              onClick={() => {
                close()
                setHelpOpen(true)
              }}
              className="font-bold text-[#b8431a] underline-offset-4 hover:underline dark:text-[#ffb36b]"
            >
              Keyboard shortcuts
            </button>
          </section>
          <p className="text-center text-xs text-muted">Task Tango 2.0 &middot; Built by DarkWizardCK</p>
        </div>
      </Sheet>
      <ConfirmDialog
        open={confirmReset}
        title="Reset everything?"
        message="This permanently deletes all tasks and custom lists on this device. Export a backup first if you might need them."
        confirmLabel="Delete all"
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetAll()
          close()
          toast('All tasks cleared')
        }}
      />
    </>
  )
}
