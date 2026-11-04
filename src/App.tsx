'use client'

import { useEffect, useMemo, useRef } from 'react'
import { MotionConfig, AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'sonner'
import { ArrowUpDown, CircleHelp, Flame, Plus, Search, Settings, Trash2, X } from 'lucide-react'
import { greeting, longDate, toISO } from './lib/dates'
import { useIsDesktop, useMediaQuery } from './lib/hooks'
import { buildSections, filterByView, matchesQuery } from './lib/selectors'
import { streak, todayProgress } from './lib/stats'
import { AuthProvider, useAuth } from './lib/auth'
import { StoreProvider, useStore } from './lib/store'
import { UiProvider, useUi } from './lib/ui'
import type { SortKey, View } from './lib/types'
import { AccountChip, AuthDialog, MigrateDialog } from './components/Account'
import { Composer, NewListDialog, SettingsDialog, ShortcutsHelp } from './components/Dialogs'
import { EmptyState, Welcome } from './components/EmptyState'
import { ListsView } from './components/ListsView'
import { BottomTabs, Sidebar, ThemeToggle, ViewIcon } from './components/Nav'
import { ProgressRing } from './components/ProgressRing'
import { QuickAdd } from './components/QuickAdd'
import { StatsView } from './components/StatsView'
import { TaskDialog } from './components/TaskDialog'
import { TaskListView } from './components/TaskList'

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'manual', label: 'Manual order' },
  { value: 'due', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'created', label: 'Newest first' },
]

function useViewTitle(view: View) {
  const { lists, now } = useStore()
  switch (view.kind) {
    case 'today':
      return { title: 'Today', sub: `${greeting(now)} · ${longDate(now)}` }
    case 'upcoming':
      return { title: 'Upcoming', sub: 'What is coming up next' }
    case 'all':
      return { title: 'All tasks', sub: 'Everything in one place' }
    case 'completed':
      return { title: 'Completed', sub: 'Your finished work' }
    case 'lists':
      return { title: 'Lists', sub: 'Organise by area of life' }
    case 'stats':
      return { title: 'Progress', sub: 'Streaks, rings and your week' }
    case 'list': {
      const l = lists.find((x) => x.id === view.id)
      return { title: l?.name ?? 'List', sub: 'Tasks in this list', color: l?.color }
    }
  }
}

function TodaySummary() {
  const { tasks, now } = useStore()
  const p = todayProgress(tasks, now)
  const st = streak(tasks, now)
  const today = toISO(now)
  const overdue = tasks.filter((t) => !t.completed && t.due !== null && t.due < today).length
  const headline =
    p.total === 0
      ? 'A clear day ahead'
      : p.done === p.total
        ? 'All done. Nicely played!'
        : `${p.total - p.done} ${p.total - p.done === 1 ? 'task' : 'tasks'} to go`
  return (
    <section className="card relative overflow-hidden rounded-3xl p-4 sm:p-5" aria-label="Today summary">
      <div className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-[#ff9a1f] opacity-[0.16] blur-2xl" aria-hidden="true" />
      <div className="relative flex items-center gap-4">
        <ProgressRing pct={p.pct} size={84} stroke={9} label="Today progress">
          <span className="font-display text-lg font-extrabold">{p.pct}%</span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-extrabold leading-tight sm:text-xl">{headline}</h2>
          <p className="text-sm text-muted">
            {p.done} of {p.total} done today
            {overdue > 0 && <span className="font-semibold text-[#b40f30] dark:text-[#ff8a73]">{` · ${overdue} overdue`}</span>}
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#ff9a1f]/15 px-2.5 py-1 text-xs font-bold text-[#a8541a] dark:text-[#ffb36b]">
            <Flame size={14} aria-hidden="true" />
            {st} day streak
          </p>
        </div>
      </div>
    </section>
  )
}

function Toolbar() {
  const { prefs, setPrefs } = useStore()
  const { query, setQuery, searchRef } = useUi()
  return (
    <div className="flex items-center gap-2">
      <div className="card relative flex min-w-0 flex-1 items-center rounded-2xl focus-within:border-coral/60 focus-within:ring-2 focus-within:ring-coral/30">
        <Search size={18} className="pointer-events-none absolute left-3.5 text-muted" aria-hidden="true" />
        <label htmlFor="search" className="sr-only">
          Search tasks
        </label>
        <input
          id="search"
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              if (query) setQuery('')
              else e.currentTarget.blur()
            }
          }}
          placeholder="Search tasks, notes, tags"
          className="w-full bg-transparent py-2.5 pl-10 pr-9 outline-none [&::-webkit-search-cancel-button]:hidden"
          style={{ outline: 'none' }}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery('')}
            className="absolute right-2 grid size-7 place-items-center rounded-full text-muted hover:bg-track"
          >
            <X size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="card relative flex shrink-0 items-center rounded-2xl">
        <ArrowUpDown size={16} className="pointer-events-none absolute left-3 text-muted" aria-hidden="true" />
        <label htmlFor="sort" className="sr-only">
          Sort tasks
        </label>
        <select
          id="sort"
          value={prefs.sort}
          onChange={(e) => setPrefs({ sort: e.target.value as SortKey })}
          className="w-11 cursor-pointer appearance-none rounded-2xl bg-transparent py-2.5 pl-9 pr-0 text-transparent outline-none sm:w-auto sm:pr-3 sm:text-fg"
          style={{ outline: 'none' }}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value} className="bg-solid text-fg">
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

function Content() {
  const auth = useAuth()
  const { tasks, lists, now, prefs, toggleTask, deleteTask, reorder, clearCompleted } = useStore()
  const { view, query, openEdit } = useUi()
  const searching = query.trim().length > 0

  const sections = useMemo(() => {
    const base = searching
      ? tasks.filter((t) => matchesQuery(t, query, lists))
      : filterByView(tasks, view, now)
    return buildSections(base, view, prefs.sort, now, searching)
  }, [tasks, lists, view, query, searching, now, prefs.sort])

  if (view.kind === 'stats') return <StatsView />
  if (view.kind === 'lists' && !searching) return <ListsView />

  const showWelcome = tasks.length === 0 && !prefs.onboarded && !searching && (auth.status === 'guest' || auth.status === 'disabled')
  if (showWelcome) return <Welcome />

  const empty: Record<string, { title: string; message: string }> = {
    today: { title: 'Nothing due today', message: 'Enjoy the calm, or add something to get ahead.' },
    upcoming: { title: 'Nothing coming up', message: 'Plan ahead by giving a task a due date.' },
    completed: { title: 'No finished tasks yet', message: 'Complete a task and it will show up here.' },
    all: { title: 'No tasks yet', message: 'Add your first task with the bar above, try "Pay rent fri !high".' },
    list: { title: 'This list is empty', message: 'Tasks you add here will stay neatly grouped.' },
    lists: { title: 'No matches', message: 'Try a different word.' },
  }

  const hasCompleted = tasks.some((t) => t.completed)

  return (
    <div className="space-y-4">
      {view.kind === 'today' && !searching && tasks.length > 0 && <TodaySummary />}
      {view.kind === 'completed' && hasCompleted && !searching && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={clearCompleted}
            className="inline-flex items-center gap-2 rounded-xl border border-line px-3.5 py-2 text-sm font-bold text-[#b40f30] hover:bg-[#d4143a]/10 dark:text-[#ff8a73]"
          >
            <Trash2 size={16} aria-hidden="true" />
            Clear completed
          </button>
        </div>
      )}
      {sections.length === 0 ? (
        searching ? (
          <EmptyState title="No matches" message={`Nothing found for “${query.trim()}”. Check the spelling or try another word.`} showAdd={false} />
        ) : (
          <EmptyState {...(empty[view.kind] ?? empty.all)} showAdd={view.kind !== 'completed'} />
        )
      ) : (
        <TaskListView
          sections={sections}
          lists={lists}
          now={now}
          reorderable={prefs.sort === 'manual' && !searching}
          onToggle={toggleTask}
          onOpen={openEdit}
          onDelete={deleteTask}
          onReorder={reorder}
        />
      )}
    </div>
  )
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

function useKeyboardShortcuts() {
  const { undo, canUndo } = useStore()
  const { focusQuickAdd, setHelpOpen, anyDialogOpen } = useUi()
  const ref = useRef({ undo, canUndo, focusQuickAdd, setHelpOpen, anyDialogOpen })
  useEffect(() => {
    ref.current = { undo, canUndo, focusQuickAdd, setHelpOpen, anyDialogOpen }
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const r = ref.current
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (isTypingTarget(e.target) || !r.canUndo) return
        e.preventDefault()
        r.undo()
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target) || r.anyDialogOpen) return
      if (e.key === 'n' || e.key === 'N' || e.key === '/') {
        e.preventDefault()
        r.focusQuickAdd()
      } else if (e.key === '?') {
        e.preventDefault()
        r.setHelpOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
}

/** Opt-in reminders: a browser notification shortly before a timed task is due, while the tab is open. */
function useReminders() {
  const { tasks, prefs } = useStore()
  const notified = useRef(new Set<string>())
  const tasksRef = useRef(tasks)
  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])
  useEffect(() => {
    if (!prefs.notifications || !('Notification' in window) || Notification.permission !== 'granted') return
    const check = () => {
      const now = new Date()
      for (const t of tasksRef.current) {
        if (t.completed || !t.due || !t.time) continue
        const [y, m, d] = t.due.split('-').map(Number)
        const [hh, mm] = t.time.split(':').map(Number)
        const diff = new Date(y, m - 1, d, hh, mm).getTime() - now.getTime()
        const key = `${t.id}|${t.due}|${t.time}`
        if (diff <= 10 * 60_000 && diff > -60_000 && !notified.current.has(key)) {
          notified.current.add(key)
          new Notification(diff > 0 ? 'Due soon' : 'Due now', { body: t.title, icon: '/icons/icon-192.png', tag: key })
        }
      }
    }
    check()
    const id = window.setInterval(check, 30_000)
    return () => window.clearInterval(id)
  }, [prefs.notifications])
}

function Shell() {
  const { view, setView, quickAddRef, focusQuickAdd, anyDialogOpen, setSettingsOpen, setHelpOpen, query } = useUi()
  const { prefs, lists, tasks } = useStore()
  const desktop = useIsDesktop()
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && systemDark)
  const meta = useViewTitle(view)
  useKeyboardShortcuts()
  useReminders()

  // If the open list is deleted (here or in another tab), fall back to the lists page.
  useEffect(() => {
    if (view.kind === 'list' && !lists.some((l) => l.id === view.id)) setView({ kind: 'lists' })
  }, [view, lists, setView])

  const showTools = (!['stats', 'lists'].includes(view.kind) && tasks.length > 0) || query.length > 0
  const showAdd = view.kind !== 'stats' && view.kind !== 'completed'

  return (
    <div className="min-h-dvh lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-[760px] px-4 pb-36 pt-safe sm:px-6 lg:px-10 lg:pb-16">
          <header className="flex items-end justify-between gap-3 pb-4 pt-6 lg:pt-10">
            <div className="min-w-0">
              <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-muted">
                {'color' in meta && meta.color ? (
                  <span className="size-3 rounded-full" style={{ background: meta.color }} aria-hidden="true" />
                ) : (
                  <span className="text-coral">
                    <ViewIcon view={view} />
                  </span>
                )}
                <span className="truncate">{meta.sub}</span>
              </p>
              <h1 className="truncate font-display text-[2.4rem] font-extrabold leading-none tracking-tight sm:text-5xl">
                <span className="text-brand">{meta.title}</span>
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 lg:hidden">
              <AccountChip />
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                aria-label="Settings"
                className="grid size-10 place-items-center rounded-full text-muted transition hover:bg-track hover:text-fg"
              >
                <Settings size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="hidden shrink-0 items-center gap-2 lg:flex">
              <AccountChip />
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-bold text-muted transition hover:text-fg"
              >
                <CircleHelp size={14} aria-hidden="true" />
                Press <kbd className="rounded bg-track px-1.5 font-mono">?</kbd> for shortcuts
              </button>
            </div>
          </header>

          <div className="space-y-4">
            {desktop && showAdd && <QuickAdd inputRef={quickAddRef} />}
            {showTools && <Toolbar />}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${view.kind}-${view.kind === 'list' ? view.id : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <Content />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <BottomTabs />
      <AnimatePresence>
        {!desktop && !anyDialogOpen && showAdd && (
          <motion.button
            type="button"
            aria-label="New task"
            onClick={focusQuickAdd}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="btn-brand fixed right-4 z-40 grid size-14 place-items-center rounded-full shadow-[0_16px_32px_-10px_rgba(212,20,58,0.75)]"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}
          >
            <Plus size={28} strokeWidth={2.8} aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>

      <TaskDialog />
      <Composer />
      <NewListDialog />
      <SettingsDialog />
      <AuthDialog />
      <MigrateDialog />
      <ShortcutsHelp />
      <Toaster
        position={desktop ? 'bottom-right' : 'top-center'}
        theme={dark ? 'dark' : 'light'}
        visibleToasts={3}
        closeButton={false}
        offset={{ top: 'calc(env(safe-area-inset-top) + 12px)', bottom: 20 }}
        mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 8px)' }}
      />
    </div>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <StoreProvider>
          <UiProvider>
            <Shell />
          </UiProvider>
        </StoreProvider>
      </AuthProvider>
    </MotionConfig>
  )
}
