import { emptyData, migrateLegacy, sanitizeData } from './schema'
import { DEFAULT_PREFS, type AppData, type Prefs } from './types'

export const DATA_KEY = 'tasktango:v2'
export const PREFS_KEY = 'tasktango:prefs'
/** Key used by the original app. Left untouched so nothing is ever lost. */
export const LEGACY_KEY = 'todos'

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? undefined : JSON.parse(raw)
  } catch {
    return undefined
  }
}

export function loadData(): AppData {
  const current = sanitizeData(read(DATA_KEY))
  if (current) return current.data
  const legacy = migrateLegacy(read(LEGACY_KEY))
  if (legacy) return legacy
  return emptyData()
}

export function saveData(data: AppData): void {
  try {
    const next = JSON.stringify(data)
    if (localStorage.getItem(DATA_KEY) !== next) localStorage.setItem(DATA_KEY, next)
  } catch {
    /* storage unavailable or full: keep working in memory */
  }
}

export function loadPrefs(): Prefs {
  const raw = read(PREFS_KEY)
  const p = { ...DEFAULT_PREFS }
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>
    if (r.theme === 'light' || r.theme === 'dark' || r.theme === 'system') p.theme = r.theme
    if (r.sort === 'manual' || r.sort === 'due' || r.sort === 'priority' || r.sort === 'created') p.sort = r.sort
    p.notifications = r.notifications === true
    p.onboarded = r.onboarded === true
  }
  return p
}

export function savePrefs(prefs: Prefs): void {
  try {
    const next = JSON.stringify(prefs)
    if (localStorage.getItem(PREFS_KEY) !== next) localStorage.setItem(PREFS_KEY, next)
  } catch {
    /* ignore */
  }
}

/** Calls back whenever another tab changes stored data or preferences. */
export function subscribeStorage(onData: (d: AppData) => void, onPrefs: (p: Prefs) => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === DATA_KEY || e.key === null) onData(loadData())
    if (e.key === PREFS_KEY || e.key === null) onPrefs(loadPrefs())
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
