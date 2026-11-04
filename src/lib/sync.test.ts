import { describe, expect, it } from 'vitest'
import { assignOrders, canon, diffMeta, diffTasks, mergeRemote, metaFromDoc, metaSig, sigOf, type SyncedMap } from './sync'
import { DEFAULT_LISTS, type Task } from './types'

function task(id: string, over: Partial<Task> = {}): Task {
  return {
    id,
    title: `Task ${id}`,
    notes: '',
    priority: 'medium',
    due: null,
    time: null,
    listId: 'personal',
    tags: [],
    subtasks: [],
    completed: false,
    completedAt: null,
    createdAt: 1,
    ...over,
  }
}

/** Builds the synced map as if every task had been uploaded with the given orders. */
function syncedOf(tasks: Task[], orders: number[], updatedAt = 100): SyncedMap {
  return new Map(tasks.map((t, i) => [t.id, { sig: sigOf(t, orders[i]), order: orders[i], updatedAt }]))
}
const remoteOf = (t: Task, order: number, updatedAt = 100) => ({ id: t.id, data: { ...canon(t, order), updatedAt } })

describe('assignOrders', () => {
  it('gives increasing orders to brand new tasks', () => {
    const o = assignOrders([task('a'), task('b'), task('c')], new Map())
    expect(o[0]).toBeLessThan(o[1])
    expect(o[1]).toBeLessThan(o[2])
  })

  it('keeps stored orders for tasks that did not move', () => {
    const ts = [task('a'), task('b'), task('c')]
    expect(assignOrders(ts, syncedOf(ts, [10, 20, 30]))).toEqual([10, 20, 30])
    expect(assignOrders([ts[0], ts[2]], syncedOf(ts, [10, 20, 30]))).toEqual([10, 30])
  })

  it('slots a moved or inserted task between its neighbours', () => {
    const ts = [task('a'), task('b'), task('c')]
    const s = syncedOf(ts, [10, 20, 30])
    const moved = assignOrders([ts[1], ts[2], ts[0]], s) // a moved to the end
    expect(moved.slice(0, 2)).toEqual([20, 30])
    expect(moved[2]).toBeGreaterThan(30)
    const inserted = assignOrders([ts[0], task('new'), ts[1], ts[2]], s)
    expect(inserted[1]).toBeGreaterThan(10)
    expect(inserted[1]).toBeLessThan(20)
  })
})

describe('diffTasks', () => {
  it('uploads everything the first time', () => {
    const plan = diffTasks([task('a'), task('b')], new Map(), 555)
    expect(plan.upserts.map((u) => u.id)).toEqual(['a', 'b'])
    expect(plan.upserts[0].doc.updatedAt).toBe(555)
    expect(plan.deletes).toEqual([])
  })

  it('produces no writes when nothing changed', () => {
    const ts = [task('a'), task('b')]
    const plan = diffTasks(ts, syncedOf(ts, [1024, 2048]), 9)
    expect(plan).toEqual({ upserts: [], deletes: [] })
  })

  it('writes only the edited task and deletes removed ones without touching the rest', () => {
    const ts = [task('a'), task('b'), task('c')]
    const s = syncedOf(ts, [1024, 2048, 3072])
    const edited = diffTasks([ts[0], { ...ts[1], title: 'Changed' }, ts[2]], s, 9)
    expect(edited.upserts.map((u) => u.id)).toEqual(['b'])
    expect(edited.deletes).toEqual([])
    const removed = diffTasks([ts[0], ts[2]], s, 9)
    expect(removed).toMatchObject({ upserts: [], deletes: ['b'] })
  })

  it('rewrites only the moved task on reorder', () => {
    const ts = [task('a'), task('b'), task('c')]
    const plan = diffTasks([ts[1], ts[2], ts[0]], syncedOf(ts, [1024, 2048, 3072]), 9)
    expect(plan.upserts.map((u) => u.id)).toEqual(['a'])
  })

  it('stores subtasks and completion on the document', () => {
    const t = task('a', { completed: true, completedAt: 5, subtasks: [{ id: 's', title: 'x', done: true }] })
    const doc = diffTasks([t], new Map(), 1).upserts[0].doc
    expect(doc).toMatchObject({ completed: true, completedAt: 5, subtasks: [{ id: 's', title: 'x', done: true }] })
    expect(Object.keys(doc).sort()).toEqual(
      ['title', 'notes', 'priority', 'due', 'time', 'listId', 'tags', 'subtasks', 'completed', 'completedAt', 'createdAt', 'order', 'updatedAt'].sort(),
    )
  })
})

describe('mergeRemote', () => {
  it('adopts the remote state in remote order when nothing is pending', () => {
    const a = task('a')
    const b = task('b')
    const res = mergeRemote([a], syncedOf([a], [1024]), [remoteOf(b, 10), remoteOf(a, 20)])
    expect(res.tasks.map((t) => t.id)).toEqual(['b', 'a'])
    expect(res.synced.size).toBe(2)
    // Applying the result produces no further writes (no echo loop).
    expect(diffTasks(res.tasks, res.synced, 1)).toEqual({ upserts: [], deletes: [] })
  })

  it('removes tasks deleted on another device', () => {
    const a = task('a')
    const b = task('b')
    const res = mergeRemote([a, b], syncedOf([a, b], [10, 20]), [remoteOf(a, 10)])
    expect(res.tasks.map((t) => t.id)).toEqual(['a'])
  })

  it('keeps unsent local edits over the remote copy, and still plans to push them', () => {
    const a = task('a')
    const localEdit = { ...a, title: 'Local edit' }
    const res = mergeRemote([localEdit], syncedOf([a], [10]), [remoteOf({ ...a, title: 'Remote edit' }, 10, 200)])
    expect(res.tasks[0].title).toBe('Local edit')
    expect(diffTasks(res.tasks, res.synced, 1).upserts.map((u) => u.id)).toEqual(['a'])
  })

  it('keeps unsent local additions and local deletions pending', () => {
    const a = task('a')
    const fresh = task('fresh')
    const added = mergeRemote([a, fresh], syncedOf([a], [10]), [remoteOf(a, 10)])
    expect(added.tasks.map((t) => t.id)).toEqual(['a', 'fresh'])
    const deleted = mergeRemote([], syncedOf([a], [10], 100), [remoteOf(a, 10, 100)])
    expect(deleted.tasks).toEqual([])
    expect(diffTasks(deleted.tasks, deleted.synced, 1).deletes).toEqual(['a'])
  })

  it('lets a newer remote edit resurrect a task deleted locally', () => {
    const a = task('a')
    const res = mergeRemote([], syncedOf([a], [10], 100), [remoteOf({ ...a, title: 'Edited elsewhere' }, 10, 300)])
    expect(res.tasks.map((t) => t.title)).toEqual(['Edited elsewhere'])
  })

  it('ignores malformed remote documents', () => {
    const res = mergeRemote([], new Map(), [{ id: 'bad', data: { title: '' } }, { id: 'x', data: 'nope' as never }])
    expect(res.tasks).toEqual([])
  })
})

describe('meta document', () => {
  it('round-trips lists and sort and detects changes', () => {
    const meta = { lists: DEFAULT_LISTS, sort: 'due' as const }
    expect(diffMeta(meta, metaSig(meta))).toBeNull()
    expect(diffMeta(meta, null)).toMatchObject({ sort: 'due' })
    const back = metaFromDoc({ lists: [...DEFAULT_LISTS, { id: 'x', name: 'Trip', color: '#d4143a' }], sort: 'bogus' })
    expect(back.sort).toBe('manual')
    expect(back.lists.map((l) => l.id)).toContain('x')
    expect(diffMeta({ ...meta, sort: 'priority' }, metaSig(meta))).not.toBeNull()
  })
})
