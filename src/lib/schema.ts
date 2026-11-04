import { isISODate, isTime } from './dates'
import { uid } from './id'
import {
  DEFAULT_LISTS,
  LIST_COLORS,
  PRIORITIES,
  type AppData,
  type Priority,
  type Subtask,
  type Task,
  type TaskList,
} from './types'

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const str = (v: unknown, max = 5000): string => (typeof v === 'string' ? v.slice(0, max) : '')

export function freshLists(): TaskList[] {
  return DEFAULT_LISTS.map((l) => ({ ...l }))
}

function sanitizeSubtasks(v: unknown): Subtask[] {
  if (!Array.isArray(v)) return []
  const out: Subtask[] = []
  for (const s of v) {
    if (!isObj(s)) continue
    const title = str(s.title, 300).trim()
    if (!title) continue
    out.push({ id: str(s.id, 80) || uid(), title, done: s.done === true })
  }
  return out
}

export function sanitizeTask(raw: unknown, knownLists: Set<string>): Task | null {
  if (!isObj(raw)) return null
  const title = str(raw.title, 300).trim()
  if (!title) return null
  const completed = raw.completed === true
  const priority: Priority = PRIORITIES.includes(raw.priority as Priority)
    ? (raw.priority as Priority)
    : 'medium'
  const listId = typeof raw.listId === 'string' && knownLists.has(raw.listId) ? raw.listId : 'personal'
  const tags = Array.isArray(raw.tags)
    ? [...new Set(raw.tags.map((t) => str(t, 40).trim().toLowerCase()).filter(Boolean))].slice(0, 12)
    : []
  const createdAt = typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now()
  const due = isISODate(raw.due) ? raw.due : null
  return {
    id: str(raw.id, 80) || uid(),
    title,
    notes: str(raw.notes, 5000),
    priority,
    due,
    time: due && isTime(raw.time) ? raw.time : null,
    listId,
    tags,
    subtasks: sanitizeSubtasks(raw.subtasks),
    completed,
    completedAt: completed
      ? typeof raw.completedAt === 'number' && Number.isFinite(raw.completedAt)
        ? raw.completedAt
        : createdAt
      : null,
    createdAt,
  }
}

export function sanitizeLists(v: unknown): TaskList[] {
  const lists = freshLists()
  if (!Array.isArray(v)) return lists
  const ids = new Set(lists.map((l) => l.id))
  for (const l of v) {
    if (!isObj(l)) continue
    const id = str(l.id, 80)
    const name = str(l.name, 40).trim()
    if (!id || !name || ids.has(id)) continue
    const color = typeof l.color === 'string' && /^#[0-9a-f]{6}$/i.test(l.color) ? l.color : LIST_COLORS[0]
    lists.push({ id, name, color })
    ids.add(id)
  }
  return lists
}

export interface SanitizeResult {
  data: AppData
  dropped: number
}

/** Coerces unknown data into a valid AppData. Returns null when the shape is unusable. */
export function sanitizeData(raw: unknown): SanitizeResult | null {
  if (!isObj(raw) || !Array.isArray(raw.tasks)) return null
  const lists = sanitizeLists(raw.lists)
  const known = new Set(lists.map((l) => l.id))
  const seen = new Set<string>()
  const tasks: Task[] = []
  let dropped = 0
  for (const t of raw.tasks) {
    const task = sanitizeTask(t, known)
    if (!task || seen.has(task.id)) {
      dropped++
      continue
    }
    seen.add(task.id)
    tasks.push(task)
  }
  return { data: { version: 2, tasks, lists }, dropped }
}

/** Migrates the original app's format: [{ id, todo, isCompleted }]. */
export function migrateLegacy(raw: unknown, now = Date.now()): AppData | null {
  if (!Array.isArray(raw)) return null
  const tasks: Task[] = []
  const seen = new Set<string>()
  raw.forEach((item, i) => {
    if (!isObj(item)) return
    const title = str(item.todo, 300).trim()
    if (!title) return
    let id = str(item.id, 80) || uid()
    if (seen.has(id)) id = uid()
    seen.add(id)
    const completed = item.isCompleted === true
    // Keep original ordering by spacing creation times one millisecond apart.
    const createdAt = now - (raw.length - i)
    tasks.push({
      id,
      title,
      notes: '',
      priority: 'medium',
      due: null,
      time: null,
      listId: 'personal',
      tags: [],
      subtasks: [],
      completed,
      completedAt: completed ? now : null,
      createdAt,
    })
  })
  return { version: 2, tasks, lists: freshLists() }
}

export function emptyData(): AppData {
  return { version: 2, tasks: [], lists: freshLists() }
}

export type ImportResult =
  | { ok: true; data: AppData; dropped: number }
  | { ok: false; error: string }

/** Validates the contents of an exported (or legacy) JSON file. */
export function validateImport(text: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }
  if (Array.isArray(parsed)) {
    const legacy = migrateLegacy(parsed)
    if (!legacy || (parsed.length > 0 && legacy.tasks.length === 0)) {
      return { ok: false, error: 'No tasks were found in that file.' }
    }
    return { ok: true, data: legacy, dropped: parsed.length - legacy.tasks.length }
  }
  if (!isObj(parsed) || !Array.isArray(parsed.tasks)) {
    return { ok: false, error: 'This does not look like a Task Tango export.' }
  }
  if (parsed.app !== undefined && parsed.app !== 'tasktango') {
    return { ok: false, error: 'This file was exported by a different app.' }
  }
  if (typeof parsed.version === 'number' && parsed.version > 2) {
    return { ok: false, error: 'This export comes from a newer version of Task Tango.' }
  }
  const res = sanitizeData(parsed)
  if (!res) return { ok: false, error: 'This does not look like a Task Tango export.' }
  if (parsed.tasks.length > 0 && res.data.tasks.length === 0) {
    return { ok: false, error: 'None of the tasks in that file were valid.' }
  }
  return { ok: true, data: res.data, dropped: res.dropped }
}

export function serializeExport(data: AppData, now = new Date()): string {
  return JSON.stringify(
    { app: 'tasktango', version: 2, exportedAt: now.toISOString(), tasks: data.tasks, lists: data.lists },
    null,
    2,
  )
}

/** Merges imported data into the current data. Existing items win on id clashes. */
export function mergeData(current: AppData, incoming: AppData): AppData {
  const taskIds = new Set(current.tasks.map((t) => t.id))
  const listIds = new Set(current.lists.map((l) => l.id))
  return {
    version: 2,
    tasks: [...current.tasks, ...incoming.tasks.filter((t) => !taskIds.has(t.id))],
    lists: [...current.lists, ...incoming.lists.filter((l) => !listIds.has(l.id))],
  }
}
