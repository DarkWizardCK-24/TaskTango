import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import { hadSession, useAuth } from './auth'
import type { CloudSync, SyncStatus } from './cloud'
import { firebaseConfigured } from './env'
import { uid as newId } from './id'
import { useNow } from './hooks'
import { initialState, reducer } from './reducer'
import { emptyData } from './schema'
import { loadData, loadPrefs, saveData, savePrefs, subscribeStorage } from './storage'
import type { AppData, Prefs, Task, TaskList } from './types'

export type NewTask = Partial<Omit<Task, 'id' | 'createdAt'>> & { title: string }

export type StoreSync = SyncStatus | 'local'

interface Store {
  tasks: Task[]
  lists: TaskList[]
  now: Date
  canUndo: boolean
  prefs: Prefs
  /** 'local' in guest mode, otherwise the cloud sync state. */
  sync: StoreSync
  /** Set when a guest store with tasks could be merged into the account that just signed in. */
  migration: { count: number } | null
  acceptMigration: () => void
  declineMigration: () => void
  deleteCloudData: () => Promise<void>
  setPrefs: (patch: Partial<Prefs>) => void
  addTask: (input: NewTask) => Task
  updateTask: (id: string, patch: Partial<Omit<Task, 'id'>>) => void
  toggleTask: (id: string) => void
  toggleSubtask: (id: string, subId: string) => void
  deleteTask: (id: string) => void
  clearCompleted: () => void
  reorder: (activeId: string, overId: string) => void
  undo: () => void
  addList: (name: string, color: string) => TaskList
  deleteList: (id: string) => void
  importData: (data: AppData, mode: 'merge' | 'replace') => void
  resetAll: () => void
  getData: () => AppData
}

const Ctx = createContext<Store | null>(null)

export function useStore(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used inside <StoreProvider>')
  return v
}

export function makeTask(input: NewTask, now = Date.now()): Task {
  return {
    id: newId(),
    title: input.title.trim(),
    notes: input.notes ?? '',
    priority: input.priority ?? 'medium',
    due: input.due ?? null,
    time: input.due ? (input.time ?? null) : null,
    listId: input.listId ?? 'personal',
    tags: input.tags ?? [],
    subtasks: input.subtasks ?? [],
    completed: false,
    completedAt: null,
    createdAt: now,
  }
}

function applyTheme(theme: Prefs['theme']) {
  const dark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? '#17100d' : '#fff8f1')
}

const migratedKey = (uid: string) => `tasktango:migrated:${uid}`

export function StoreProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const uid = auth.user?.uid ?? null

  // While a previous session is being restored we show an empty store instead of guest data.
  const guestReady = useRef<boolean | null>(null)
  if (guestReady.current === null) guestReady.current = !hadSession()
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    initialState(guestReady.current ? loadData() : emptyData()),
  )
  const [prefs, setPrefsState] = useState<Prefs>(loadPrefs)
  const [sync, setSync] = useState<SyncStatus>('syncing')
  const [migration, setMigration] = useState<{ count: number } | null>(null)
  const now = useNow()
  const stateRef = useRef(state)
  const prefsRef = useRef(prefs)
  const uidRef = useRef(uid)
  const syncRef = useRef<CloudSync | null>(null)
  useEffect(() => {
    stateRef.current = state
    prefsRef.current = prefs
    uidRef.current = uid
  })

  // Guest persistence. Never runs while signed in, so cloud data cannot leak into the local store.
  useEffect(() => {
    if (!guestReady.current || uidRef.current || auth.status === 'loading') return
    saveData({ version: 2, tasks: state.tasks, lists: state.lists })
  }, [state.tasks, state.lists, auth.status])
  useEffect(() => {
    savePrefs(prefs)
  }, [prefs])

  // Switch between the guest store and the account when the user signs in or out.
  useEffect(() => {
    if (auth.status === 'loading') return
    if (uid) {
      if (guestReady.current) {
        guestReady.current = false
        dispatch({ type: 'reset', data: emptyData() })
      }
      setPrefsState((p) => (p.onboarded ? p : { ...p, onboarded: true }))
      const guest = loadData()
      let decided = false
      try {
        decided = !!localStorage.getItem(migratedKey(uid))
      } catch {
        /* ignore */
      }
      setMigration(guest.tasks.length > 0 && !decided ? { count: guest.tasks.length } : null)
    } else {
      setMigration(null)
      if (!guestReady.current) {
        dispatch({ type: 'replace', data: loadData() })
        guestReady.current = true
      }
    }
  }, [uid, auth.status])

  // Real-time cloud sync while signed in.
  useEffect(() => {
    if (!uid || !firebaseConfigured) return
    let cancelled = false
    let handle: CloudSync | null = null
    void import('./cloud').then((m) => {
      if (cancelled) return
      handle = m.startCloudSync(uid, {
        getTasks: () => stateRef.current.tasks,
        getMeta: () => ({ lists: stateRef.current.lists, sort: prefsRef.current.sort }),
        applyTasks: (tasks) => dispatch({ type: 'sync', tasks }),
        applyMeta: (lists, sort) => {
          dispatch({ type: 'syncMeta', lists })
          setPrefsState((p) => (p.sort === sort ? p : { ...p, sort }))
        },
        onStatus: setSync,
        onError: (message) => toast(message, { id: 'sync-error' }),
      })
      syncRef.current = handle
    })
    return () => {
      cancelled = true
      handle?.stop()
      syncRef.current = null
      setSync('syncing')
    }
  }, [uid])
  useEffect(() => {
    syncRef.current?.notify()
  }, [state.tasks, state.lists, prefs.sort])

  // Keep multiple guest tabs in sync (cloud mode uses Firestore listeners instead).
  useEffect(
    () =>
      subscribeStorage(
        (data) => {
          if (guestReady.current && !uidRef.current) dispatch({ type: 'hydrate', data })
        },
        (p) => setPrefsState(p),
      ),
    [],
  )

  // Theme.
  useEffect(() => {
    applyTheme(prefs.theme)
    if (prefs.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [prefs.theme])

  const undo = useCallback(() => {
    if (stateRef.current.undo.length === 0) return
    dispatch({ type: 'undo' })
    toast.dismiss()
  }, [])

  const value = useMemo<Store>(
    () => ({
      tasks: state.tasks,
      lists: state.lists,
      now,
      canUndo: state.undo.length > 0,
      prefs,
      sync: uid ? sync : 'local',
      migration,
      acceptMigration: () => {
        const guest = loadData()
        dispatch({ type: 'merge', data: guest })
        // The tasks now live in the account; empty the guest store so they are not duplicated.
        saveData(emptyData())
        if (uid) {
          try {
            localStorage.setItem(migratedKey(uid), '1')
          } catch {
            /* ignore */
          }
        }
        setMigration(null)
        toast(`Moved ${guest.tasks.length} ${guest.tasks.length === 1 ? 'task' : 'tasks'} into your account`)
      },
      declineMigration: () => {
        if (uid) {
          try {
            localStorage.setItem(migratedKey(uid), '1')
          } catch {
            /* ignore */
          }
        }
        setMigration(null)
      },
      deleteCloudData: async () => {
        if (!uid) return
        const { deleteAllCloudData } = await import('./cloud')
        const n = await deleteAllCloudData(uid)
        toast(`Deleted ${n} ${n === 1 ? 'task' : 'tasks'} from the cloud`)
      },
      setPrefs: (patch) => setPrefsState((p) => ({ ...p, ...patch })),
      addTask: (input) => {
        const task = makeTask(input)
        dispatch({ type: 'add', task })
        return task
      },
      updateTask: (id, patch) => dispatch({ type: 'update', id, patch }),
      toggleTask: (id) => {
        const t = stateRef.current.tasks.find((x) => x.id === id)
        if (!t) return
        dispatch({ type: 'toggle', id, now: Date.now() })
        if (!t.completed) {
          toast('Task completed', {
            description: t.title,
            duration: 3500,
            action: { label: 'Undo', onClick: undo },
          })
        }
      },
      toggleSubtask: (id, subId) => dispatch({ type: 'toggleSubtask', id, subId }),
      deleteTask: (id) => {
        const t = stateRef.current.tasks.find((x) => x.id === id)
        if (!t) return
        dispatch({ type: 'delete', id })
        toast('Task deleted', {
          description: t.title,
          duration: 6000,
          action: { label: 'Undo', onClick: undo },
        })
      },
      clearCompleted: () => {
        const n = stateRef.current.tasks.filter((t) => t.completed).length
        if (n === 0) return
        dispatch({ type: 'clearCompleted' })
        toast(`Cleared ${n} completed ${n === 1 ? 'task' : 'tasks'}`, {
          duration: 6000,
          action: { label: 'Undo', onClick: undo },
        })
      },
      reorder: (activeId, overId) => dispatch({ type: 'reorder', activeId, overId }),
      undo,
      addList: (name, color) => {
        const list: TaskList = { id: `l-${newId().slice(0, 8)}`, name: name.trim(), color }
        dispatch({ type: 'addList', list })
        return list
      },
      deleteList: (id) => dispatch({ type: 'deleteList', id }),
      importData: (data, mode) => dispatch({ type: mode === 'merge' ? 'merge' : 'replace', data }),
      resetAll: () => dispatch({ type: 'reset', data: emptyData() }),
      getData: () => ({ version: 2, tasks: stateRef.current.tasks, lists: stateRef.current.lists }),
    }),
    [state.tasks, state.lists, state.undo.length, now, prefs, undo, uid, sync, migration],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
