import { sanitizeLists, sanitizeTask } from './schema'
import type { SortKey, Task, TaskList } from './types'

/** Shape of a task document stored at apps/tasktango/users/{uid}/tasks/{id}. */
export interface TaskDoc {
  title: string
  notes: string
  priority: Task['priority']
  due: string | null
  time: string | null
  listId: string
  tags: string[]
  subtasks: Task['subtasks']
  completed: boolean
  completedAt: number | null
  createdAt: number
  order: number
  updatedAt: number
}

export interface SyncedEntry {
  sig: string
  order: number
  updatedAt: number
}
/** What we believe the server holds, keyed by task id. */
export type SyncedMap = Map<string, SyncedEntry>

export type CanonTask = Omit<TaskDoc, 'updatedAt'>

/** Canonical, key-ordered view of a task (Firestore does not preserve key order). */
export function canon(task: Task, order: number): CanonTask {
  return {
    title: task.title,
    notes: task.notes,
    priority: task.priority,
    due: task.due,
    time: task.time,
    listId: task.listId,
    tags: [...task.tags],
    subtasks: task.subtasks.map((s) => ({ id: s.id, title: s.title, done: s.done })),
    completed: task.completed,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    order,
  }
}

export const sigOf = (task: Task, order: number): string => JSON.stringify(canon(task, order))

/**
 * Gives each task a sortable order value. Tasks that keep their relative position keep their
 * stored order, so deleting or inserting one task does not rewrite every other document.
 */
export function assignOrders(tasks: Task[], synced: SyncedMap): number[] {
  const known = (i: number) => synced.get(tasks[i].id)?.order
  const out: number[] = []
  for (let i = 0; i < tasks.length; i++) {
    const prev = i === 0 ? -1 : out[i - 1]
    const own = known(i)
    if (own !== undefined && own > prev) {
      out[i] = own
      continue
    }
    let next = Infinity
    for (let j = i + 1; j < tasks.length; j++) {
      const e = known(j)
      if (e !== undefined && e > prev) {
        next = e
        break
      }
    }
    out[i] = next === Infinity ? prev + 1024 : (prev + next) / 2
  }
  return out
}

export interface SyncPlan {
  upserts: { id: string; sig: string; doc: TaskDoc }[]
  deletes: string[]
}

/** Pure diff: local state versus what the server is known to hold -> writes and deletes. */
export function diffTasks(local: Task[], synced: SyncedMap, now: number): SyncPlan {
  const orders = assignOrders(local, synced)
  const upserts: SyncPlan['upserts'] = []
  const seen = new Set<string>()
  local.forEach((task, i) => {
    seen.add(task.id)
    const sig = sigOf(task, orders[i])
    if (synced.get(task.id)?.sig !== sig) {
      upserts.push({ id: task.id, sig, doc: { ...canon(task, orders[i]), updatedAt: now } })
    }
  })
  const deletes = [...synced.keys()].filter((id) => !seen.has(id))
  return { upserts, deletes }
}

export interface RemoteTask {
  id: string
  data: Record<string, unknown>
}

export function taskFromDoc(id: string, data: Record<string, unknown>): Task | null {
  const listId = typeof data.listId === 'string' ? data.listId : 'personal'
  return sanitizeTask({ ...data, id }, new Set([listId]))
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

export const tasksSig = (tasks: Task[]): string => JSON.stringify(tasks.map((t) => [t.id, canon(t, 0)]))

export interface MergeResult {
  tasks: Task[]
  synced: SyncedMap
}

/**
 * Applies a full remote snapshot to local state. Remote wins, except for local edits that
 * have not been pushed yet (those are newer by construction and are kept, then pushed).
 */
export function mergeRemote(local: Task[], synced: SyncedMap, remote: RemoteTask[]): MergeResult {
  const dirty = diffTasks(local, synced, 0)
  const dirtyUp = new Set(dirty.upserts.map((u) => u.id))
  const dirtyDel = new Set(dirty.deletes)
  const localById = new Map(local.map((t) => [t.id, t]))

  const parsed = remote
    .map((r) => ({ r, task: taskFromDoc(r.id, r.data), order: num(r.data.order), updatedAt: num(r.data.updatedAt) }))
    .filter((x): x is { r: RemoteTask; task: Task; order: number; updatedAt: number } => x.task !== null)
    .sort((a, b) => a.order - b.order || a.r.id.localeCompare(b.r.id))

  const nextSynced: SyncedMap = new Map()
  const tasks: Task[] = []
  const remoteIds = new Set<string>()
  for (const p of parsed) {
    const id = p.r.id
    remoteIds.add(id)
    nextSynced.set(id, { sig: sigOf(p.task, p.order), order: p.order, updatedAt: p.updatedAt })
    if (dirtyDel.has(id)) {
      const prev = synced.get(id)
      // Deleted here, but edited elsewhere since: the edit wins and the task comes back.
      if (prev && p.updatedAt > prev.updatedAt) tasks.push(p.task)
      continue
    }
    tasks.push(dirtyUp.has(id) ? (localById.get(id) as Task) : p.task)
  }
  for (const u of dirty.upserts) {
    if (!remoteIds.has(u.id)) tasks.push(localById.get(u.id) as Task)
  }
  return { tasks, synced: nextSynced }
}

/* ----------------------------- meta document ----------------------------- */

export interface MetaState {
  lists: TaskList[]
  sort: SortKey
}

export function canonLists(lists: TaskList[]) {
  return lists.map((l) => ({ id: l.id, name: l.name, color: l.color, builtin: !!l.builtin }))
}

export const metaSig = (m: MetaState): string => JSON.stringify({ lists: canonLists(m.lists), sort: m.sort })

export function metaFromDoc(data: Record<string, unknown>): MetaState {
  const sort = data.sort
  return {
    lists: sanitizeLists(data.lists),
    sort: sort === 'due' || sort === 'priority' || sort === 'created' ? sort : 'manual',
  }
}

/** Returns the meta write needed, or null when the server already has the same content. */
export function diffMeta(local: MetaState, syncedSig: string | null): { lists: ReturnType<typeof canonLists>; sort: SortKey } | null {
  return metaSig(local) === syncedSig ? null : { lists: canonLists(local.lists), sort: local.sort }
}
