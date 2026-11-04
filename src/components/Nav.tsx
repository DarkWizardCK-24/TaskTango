import { motion } from 'framer-motion'
import {
  BarChart3,
  CalendarClock,
  CheckCheck,
  CircleHelp,
  Flame,
  Inbox,
  LayoutGrid,
  LogIn,
  ListTodo,
  Moon,
  Plus,
  Settings,
  Sun,
  Sunrise,
} from 'lucide-react'
import { useMediaQuery } from '../lib/hooks'
import { countsForList, countsForView } from '../lib/selectors'
import { streak, todayProgress } from '../lib/stats'
import { useStore } from '../lib/store'
import { useUi } from '../lib/ui'
import type { View } from '../lib/types'
import { useAuth } from '../lib/auth'
import { SyncBadge } from './Account'
import { Logo } from './Illustrations'
import { ProgressRing } from './ProgressRing'

function same(a: View, b: View): boolean {
  return a.kind === b.kind && (a.kind !== 'list' || (b.kind === 'list' && a.id === b.id))
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { prefs, setPrefs } = useStore()
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && systemDark)
  return (
    <button
      type="button"
      onClick={() => setPrefs({ theme: dark ? 'light' : 'dark' })}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`grid size-10 place-items-center rounded-full text-muted transition hover:bg-track hover:text-fg ${className}`}
    >
      {dark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
    </button>
  )
}

function NavItem({
  active,
  onClick,
  icon,
  label,
  count,
  dot,
}: {
  active: boolean
  onClick: () => void
  icon?: React.ReactNode
  label: string
  count?: number
  dot?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
        active ? 'text-white' : 'text-fg/85 hover:bg-track'
      }`}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-xl bg-brand shadow-[0_8px_20px_-8px_rgba(212,20,58,0.6)]"
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        />
      )}
      <span className="relative grid size-5 place-items-center" aria-hidden="true">
        {dot ? <span className="size-3 rounded-full" style={{ background: dot }} /> : icon}
      </span>
      <span className="relative flex-1 truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`relative rounded-full px-2 py-0.5 text-xs font-bold ${active ? 'bg-white/25 text-white' : 'bg-track text-muted'}`}>
          {count}
        </span>
      )}
    </button>
  )
}

function SidebarAccount() {
  const auth = useAuth()
  const { setAuthOpen, setSettingsOpen } = useUi()
  if (!auth.available || auth.status === 'loading') return null
  if (!auth.user) {
    return (
      <button type="button" onClick={() => setAuthOpen(true)} className="card flex w-full items-center gap-3 rounded-2xl p-3 text-left">
        <span className="grid size-9 place-items-center rounded-full bg-brand text-white">
          <LogIn size={16} aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold">Sign in to sync</span>
          <span className="block text-xs text-muted">Guest mode, saved on this device</span>
        </span>
      </button>
    )
  }
  return (
    <button type="button" onClick={() => setSettingsOpen(true)} aria-label="Account settings" className="card flex w-full items-center gap-3 rounded-2xl p-3 text-left">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-extrabold text-white">
        {(auth.user.email ?? '?')[0].toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{auth.user.email}</span>
        <span className="mt-0.5 block">
          <SyncBadge />
        </span>
      </span>
    </button>
  )
}

export function Sidebar() {
  const { tasks, lists, now } = useStore()
  const { view, setView, setListDialogOpen, setSettingsOpen, setHelpOpen } = useUi()
  const c = countsForView(tasks, now)
  const p = todayProgress(tasks, now)
  const st = streak(tasks, now)
  const go = (v: View) => () => setView(v)

  return (
    <aside className="sticky top-0 hidden h-dvh w-[280px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-line bg-surface/60 px-4 py-6 backdrop-blur-xl lg:flex" aria-label="Sidebar">
      <div className="flex items-center gap-3 px-2">
        <Logo size={40} />
        <span className="font-display text-xl font-extrabold tracking-tight">
          Task <span className="text-brand">Tango</span>
        </span>
      </div>

      <nav aria-label="Views" className="space-y-1">
        <NavItem active={same(view, { kind: 'today' })} onClick={go({ kind: 'today' })} icon={<Sunrise size={18} />} label="Today" count={c.today} />
        <NavItem active={same(view, { kind: 'upcoming' })} onClick={go({ kind: 'upcoming' })} icon={<CalendarClock size={18} />} label="Upcoming" count={c.upcoming} />
        <NavItem active={same(view, { kind: 'all' })} onClick={go({ kind: 'all' })} icon={<Inbox size={18} />} label="All tasks" count={c.all} />
        <NavItem active={same(view, { kind: 'completed' })} onClick={go({ kind: 'completed' })} icon={<CheckCheck size={18} />} label="Completed" />
        <NavItem active={same(view, { kind: 'stats' })} onClick={go({ kind: 'stats' })} icon={<BarChart3 size={18} />} label="Stats" />
      </nav>

      <nav aria-label="Lists" className="min-h-0 space-y-1">
        <div className="flex items-center justify-between px-3 pb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Lists</h2>
          <button
            type="button"
            onClick={() => setListDialogOpen(true)}
            aria-label="New list"
            className="grid size-7 place-items-center rounded-full text-muted hover:bg-track hover:text-fg"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
        {lists.map((l) => (
          <NavItem
            key={l.id}
            active={same(view, { kind: 'list', id: l.id })}
            onClick={go({ kind: 'list', id: l.id })}
            label={l.name}
            dot={l.color}
            count={countsForList(tasks, l.id)}
          />
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <SidebarAccount />
        <div className="card flex items-center gap-4 rounded-2xl p-4">
          <ProgressRing pct={p.pct} size={64} stroke={7} label="Today progress">
            <span className="font-display text-sm font-extrabold">{p.pct}%</span>
          </ProgressRing>
          <div className="min-w-0">
            <p className="text-sm font-bold">Today</p>
            <p className="text-xs text-muted">
              {p.done} of {p.total} done
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#b8431a] dark:text-[#ffb36b]">
              <Flame size={13} aria-hidden="true" />
              {st} day streak
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between px-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            aria-label="Keyboard shortcuts"
            className="grid size-10 place-items-center rounded-full text-muted hover:bg-track hover:text-fg"
          >
            <CircleHelp size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            className="grid size-10 place-items-center rounded-full text-muted hover:bg-track hover:text-fg"
          >
            <Settings size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  )
}

export function BottomTabs() {
  const { view, setView } = useUi()
  const tabs = [
    { label: 'Today', icon: Sunrise, active: view.kind === 'today', go: { kind: 'today' } as View },
    { label: 'Upcoming', icon: CalendarClock, active: view.kind === 'upcoming', go: { kind: 'upcoming' } as View },
    { label: 'Lists', icon: LayoutGrid, active: ['lists', 'all', 'completed', 'list'].includes(view.kind), go: { kind: 'lists' } as View },
    { label: 'Stats', icon: BarChart3, active: view.kind === 'stats', go: { kind: 'stats' } as View },
  ]
  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[var(--solid)]/88 backdrop-blur-xl lg:hidden"
    >
      <ul className="m-0 mx-auto grid max-w-md list-none grid-cols-4 gap-1 px-2 pb-1.5 pt-1.5">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <li key={t.label}>
              <button
                type="button"
                onClick={() => setView(t.go)}
                aria-current={t.active ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-bold transition ${
                  t.active ? 'text-fg' : 'text-muted'
                }`}
              >
                <span
                  className={`grid h-8 w-14 place-items-center rounded-full transition ${t.active ? 'bg-brand text-white shadow-[0_8px_18px_-8px_rgba(212,20,58,0.7)]' : ''}`}
                >
                  <Icon size={20} strokeWidth={t.active ? 2.4 : 2} aria-hidden="true" />
                </span>
                {t.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function ViewIcon({ view }: { view: View }) {
  const p = { size: 22, 'aria-hidden': true } as const
  if (view.kind === 'today') return <Sunrise {...p} />
  if (view.kind === 'upcoming') return <CalendarClock {...p} />
  if (view.kind === 'completed') return <CheckCheck {...p} />
  if (view.kind === 'stats') return <BarChart3 {...p} />
  if (view.kind === 'lists') return <LayoutGrid {...p} />
  if (view.kind === 'list') return <ListTodo {...p} />
  return <Inbox {...p} />
}
