import { beforeEach, describe, expect, it } from 'vitest'
import { bucketFor, formatDue, isOverdue, nextWeekday, toISO } from './dates'
import { parseQuickAdd } from './parser'
import { initialState, reducer, type State } from './reducer'
import { emptyData, migrateLegacy, mergeData, serializeExport, validateImport } from './schema'
import { buildSections, filterByView, matchesQuery } from './selectors'
import { overallProgress, streak, todayProgress, weekCounts } from './stats'
import { DATA_KEY, LEGACY_KEY, loadData, saveData } from './storage'
import { DEFAULT_LISTS, type Task } from './types'

// Wednesday, 4 November 2026, 10:00 local time.
const NOW = new Date(2026, 10, 4, 10, 0)
const day = (offset: number, h = 12) => new Date(2026, 10, 4 + offset, h).getTime()

function task(over: Partial<Task> = {}): Task {
  return {
    id: over.id ?? Math.random().toString(36).slice(2),
    title: 'Task',
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

describe('date helpers', () => {
  it('buckets due dates relative to an injected now', () => {
    expect(bucketFor(null, NOW)).toBe('none')
    expect(bucketFor('2026-11-03', NOW)).toBe('overdue')
    expect(bucketFor('2026-11-04', NOW)).toBe('today')
    expect(bucketFor('2026-11-05', NOW)).toBe('tomorrow')
    expect(bucketFor('2026-11-06', NOW)).toBe('later')
  })

  it('handles month and year boundaries', () => {
    expect(bucketFor('2027-01-01', new Date(2026, 11, 31))).toBe('tomorrow')
    expect(bucketFor('2026-12-01', new Date(2026, 10, 30))).toBe('tomorrow')
  })

  it('flags overdue tasks including past times today', () => {
    expect(isOverdue({ due: '2026-11-04', time: '09:00', completed: false }, NOW)).toBe(true)
    expect(isOverdue({ due: '2026-11-04', time: '18:00', completed: false }, NOW)).toBe(false)
    expect(isOverdue({ due: '2026-11-03', time: null, completed: true }, NOW)).toBe(false)
  })

  it('finds the next weekday strictly after today', () => {
    expect(toISO(nextWeekday(NOW, 1))).toBe('2026-11-09')
    expect(toISO(nextWeekday(NOW, 3))).toBe('2026-11-11')
  })

  it('formats due labels', () => {
    expect(formatDue('2026-11-04', null, NOW)).toBe('Today')
    expect(formatDue('2026-11-05', '17:30', NOW)).toBe('Tomorrow, 5:30 PM')
    expect(formatDue('2026-11-20', null, NOW)).toBe('Nov 20')
  })
})

describe('quick-add parser', () => {
  const lists = DEFAULT_LISTS

  it('parses priority, list and tomorrow', () => {
    const p = parseQuickAdd('Buy milk !high #home tomorrow', NOW, lists)
    expect(p.title).toBe('Buy milk')
    expect(p.priority).toBe('high')
    expect(p.listId).toBe('home')
    expect(p.due).toBe('2026-11-05')
    expect(p.chips.map((c) => c.kind)).toEqual(['priority', 'list', 'due'])
  })

  it('parses weekdays, relative days and weeks', () => {
    expect(parseQuickAdd('Gym fri', NOW, lists).due).toBe('2026-11-06')
    expect(parseQuickAdd('Report in 3d', NOW, lists).due).toBe('2026-11-07')
    expect(parseQuickAdd('Review in 2 weeks', NOW, lists).due).toBe('2026-11-18')
    expect(parseQuickAdd('Ship today', NOW, lists).due).toBe('2026-11-04')
  })

  it('parses times and defaults the date to today', () => {
    const p = parseQuickAdd('Call mum at 5pm', NOW, lists)
    expect(p.title).toBe('Call mum')
    expect(p.time).toBe('17:00')
    expect(p.due).toBe('2026-11-04')
    expect(parseQuickAdd('Standup tomorrow 09:30', NOW, lists).time).toBe('09:30')
    expect(parseQuickAdd('Lunch 12am', NOW, lists).time).toBe('00:00')
  })

  it('treats unknown #names and @names as tags', () => {
    const p = parseQuickAdd('Plan trip #travel @fun', NOW, lists)
    expect(p.listId).toBeNull()
    expect(p.tags).toEqual(['travel', 'fun'])
    expect(p.title).toBe('Plan trip')
  })

  it('supports priority aliases and prefix list matching', () => {
    expect(parseQuickAdd('x !med', NOW, lists).priority).toBe('medium')
    expect(parseQuickAdd('x !low', NOW, lists).priority).toBe('low')
    expect(parseQuickAdd('x #wor', NOW, lists).listId).toBe('work')
  })

  it('leaves ordinary words alone and reports an empty title', () => {
    expect(parseQuickAdd('Read a book', NOW, lists).title).toBe('Read a book')
    expect(parseQuickAdd('  !high  ', NOW, lists).title).toBe('')
    expect(parseQuickAdd('Read !bogus', NOW, lists).title).toBe('Read !bogus')
  })
})

describe('reducer', () => {
  let state: State
  const a = task({ id: 'a', title: 'A' })
  const b = task({ id: 'b', title: 'B' })
  const c = task({ id: 'c', title: 'C' })

  beforeEach(() => {
    state = initialState({ version: 2, tasks: [a, b, c], lists: DEFAULT_LISTS })
  })

  it('adds, updates in place and keeps position', () => {
    let s = reducer(state, { type: 'add', task: task({ id: 'd' }) })
    expect(s.tasks.map((t) => t.id)).toEqual(['a', 'b', 'c', 'd'])
    s = reducer(s, { type: 'update', id: 'b', patch: { title: 'B2', priority: 'high' } })
    expect(s.tasks.map((t) => t.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(s.tasks[1]).toMatchObject({ title: 'B2', priority: 'high' })
  })

  it('does not mutate previous state', () => {
    const before = JSON.stringify(state)
    reducer(state, { type: 'delete', id: 'a' })
    reducer(state, { type: 'reorder', activeId: 'a', overId: 'c' })
    expect(JSON.stringify(state)).toBe(before)
  })

  it('deletes and restores at the original position', () => {
    let s = reducer(state, { type: 'delete', id: 'b' })
    expect(s.tasks.map((t) => t.id)).toEqual(['a', 'c'])
    s = reducer(s, { type: 'undo' })
    expect(s.tasks.map((t) => t.id)).toEqual(['a', 'b', 'c'])
    expect(s.undo).toHaveLength(0)
  })

  it('toggles completion with a timestamp and undoes it', () => {
    let s = reducer(state, { type: 'toggle', id: 'a', now: 123 })
    expect(s.tasks[0]).toMatchObject({ completed: true, completedAt: 123 })
    s = reducer(s, { type: 'toggle', id: 'a', now: 456 })
    expect(s.tasks[0]).toMatchObject({ completed: false, completedAt: null })
    s = reducer(s, { type: 'undo' })
    expect(s.tasks[0]).toMatchObject({ completed: true, completedAt: 123 })
  })

  it('reorders', () => {
    const s = reducer(state, { type: 'reorder', activeId: 'a', overId: 'c' })
    expect(s.tasks.map((t) => t.id)).toEqual(['b', 'c', 'a'])
  })

  it('clears completed and restores them on undo', () => {
    let s = reducer(state, { type: 'toggle', id: 'a', now: 1 })
    s = reducer(s, { type: 'toggle', id: 'c', now: 2 })
    s = reducer(s, { type: 'clearCompleted' })
    expect(s.tasks.map((t) => t.id)).toEqual(['b'])
    s = reducer(s, { type: 'undo' })
    expect(s.tasks.map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('toggles subtasks', () => {
    const t = task({ id: 's', subtasks: [{ id: 'x', title: 'one', done: false }] })
    let s = reducer(initialState({ version: 2, tasks: [t], lists: DEFAULT_LISTS }), {
      type: 'toggleSubtask',
      id: 's',
      subId: 'x',
    })
    expect(s.tasks[0].subtasks[0].done).toBe(true)
    s = reducer(s, { type: 'toggleSubtask', id: 's', subId: 'x' })
    expect(s.tasks[0].subtasks[0].done).toBe(false)
  })

  it('manages custom lists and protects built-ins', () => {
    let s = reducer(state, { type: 'addList', list: { id: 'trip', name: 'Trip', color: '#d4143a' } })
    s = reducer(s, { type: 'update', id: 'a', patch: { listId: 'trip' } })
    s = reducer(s, { type: 'deleteList', id: 'personal' })
    expect(s.lists.some((l) => l.id === 'personal')).toBe(true)
    s = reducer(s, { type: 'deleteList', id: 'trip' })
    expect(s.lists.some((l) => l.id === 'trip')).toBe(false)
    expect(s.tasks[0].listId).toBe('personal')
  })

  it('merges and replaces imported data', () => {
    const incoming = { version: 2 as const, tasks: [a, task({ id: 'z' })], lists: DEFAULT_LISTS }
    const merged = reducer(state, { type: 'merge', data: incoming })
    expect(merged.tasks.map((t) => t.id)).toEqual(['a', 'b', 'c', 'z'])
    const replaced = reducer(state, { type: 'replace', data: incoming })
    expect(replaced.tasks.map((t) => t.id)).toEqual(['a', 'z'])
  })

  it('ignores undo with an empty stack', () => {
    expect(reducer(state, { type: 'undo' })).toBe(state)
  })
})

describe('legacy migration and storage', () => {
  it('migrates the original { id, todo, isCompleted } format', () => {
    const data = migrateLegacy(
      [
        { id: 'x1', todo: 'Walk the dog', isCompleted: false },
        { id: 'x2', todo: '  Pay rent ', isCompleted: true },
        { id: 'x3', todo: '   ', isCompleted: false },
        'junk',
      ],
      1_000_000,
    )
    expect(data?.tasks).toHaveLength(2)
    expect(data?.tasks[0]).toMatchObject({ id: 'x1', title: 'Walk the dog', completed: false, listId: 'personal' })
    expect(data?.tasks[1]).toMatchObject({ title: 'Pay rent', completed: true, completedAt: 1_000_000 })
    expect(data?.lists.length).toBe(5)
    expect(migrateLegacy('nope')).toBeNull()
  })

  it('loads the legacy key when no v2 data exists, then prefers v2', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify([{ id: 'l1', todo: 'Old task', isCompleted: false }]))
    expect(loadData().tasks.map((t) => t.title)).toEqual(['Old task'])
    const data = loadData()
    saveData(data)
    expect(localStorage.getItem(DATA_KEY)).toBeTruthy()
    expect(localStorage.getItem(LEGACY_KEY)).toBeTruthy()
    localStorage.setItem(LEGACY_KEY, '[]')
    expect(loadData().tasks).toHaveLength(1)
  })

  it('survives corrupt storage', () => {
    localStorage.setItem(DATA_KEY, '{not json')
    expect(loadData().tasks).toEqual([])
  })
})

describe('import validation', () => {
  const good = () => serializeExport({ version: 2, tasks: [task({ id: 'q', title: 'Hello' })], lists: emptyData().lists })

  it('round-trips an export', () => {
    const res = validateImport(good())
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.data.tasks[0]).toMatchObject({ id: 'q', title: 'Hello' })
  })

  it('rejects bad input with a message', () => {
    expect(validateImport('nope')).toMatchObject({ ok: false })
    expect(validateImport('{"hello":1}')).toMatchObject({ ok: false })
    expect(validateImport('{"app":"other","tasks":[]}')).toMatchObject({ ok: false })
    expect(validateImport('{"version":9,"tasks":[]}')).toMatchObject({ ok: false })
    expect(validateImport('{"tasks":[{"nothing":true}]}')).toMatchObject({ ok: false })
  })

  it('sanitises fields and counts dropped tasks', () => {
    const res = validateImport(
      JSON.stringify({
        tasks: [
          { id: '1', title: 'ok', priority: 'urgent', due: 'not-a-date', listId: 'ghost', tags: ['A', 'a'] },
          { title: '' },
        ],
      }),
    )
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.dropped).toBe(1)
      expect(res.data.tasks[0]).toMatchObject({ priority: 'medium', due: null, listId: 'personal', tags: ['a'] })
    }
  })

  it('accepts a bare legacy array', () => {
    const res = validateImport(JSON.stringify([{ id: '1', todo: 'x', isCompleted: true }]))
    expect(res.ok && res.data.tasks[0].completed).toBe(true)
  })

  it('merges custom lists without duplicates', () => {
    const a = emptyData()
    const b = { ...emptyData(), lists: [...emptyData().lists, { id: 'trip', name: 'Trip', color: '#d4143a' }] }
    expect(mergeData(a, b).lists).toHaveLength(6)
    expect(mergeData(b, b).lists).toHaveLength(6)
  })
})

describe('selectors', () => {
  const tasks = [
    task({ id: 'o', due: '2026-11-02' }),
    task({ id: 't', due: '2026-11-04', title: 'Pay Rent', tags: ['bills'] }),
    task({ id: 'm', due: '2026-11-05' }),
    task({ id: 'l', due: '2026-11-20' }),
    task({ id: 'n' }),
    task({ id: 'd', completed: true, completedAt: day(0), due: '2026-11-04' }),
    task({ id: 'e', completed: true, completedAt: day(-3) }),
  ]

  it('builds the today view with overdue, today and done-today', () => {
    const secs = buildSections(filterByView(tasks, { kind: 'today' }, NOW), { kind: 'today' }, 'manual', NOW)
    expect(secs.map((s) => [s.key, s.tasks.map((t) => t.id)])).toEqual([
      ['overdue', ['o']],
      ['today', ['t']],
      ['done', ['d']],
    ])
  })

  it('builds upcoming and all views', () => {
    const up = buildSections(filterByView(tasks, { kind: 'upcoming' }, NOW), { kind: 'upcoming' }, 'manual', NOW)
    expect(up.map((s) => s.key)).toEqual(['tomorrow', 'later'])
    const all = buildSections(tasks, { kind: 'all' }, 'manual', NOW)
    expect(all.map((s) => s.key)).toEqual(['overdue', 'today', 'tomorrow', 'later', 'none', 'done'])
  })

  it('sorts by due date and priority', () => {
    const mixed = [task({ id: '1', due: '2026-11-09' }), task({ id: '2', due: '2026-11-08', priority: 'high' }), task({ id: '3' })]
    const byDue = buildSections(mixed, { kind: 'all' }, 'due', NOW)[0].tasks.map((t) => t.id)
    expect(byDue).toEqual(['2', '1']) // first section is 'later'
    const byPrio = buildSections(mixed, { kind: 'all' }, 'priority', NOW)[0].tasks.map((t) => t.id)
    expect(byPrio[0]).toBe('2')
  })

  it('matches search on title, notes and tags', () => {
    expect(matchesQuery(tasks[1], 'rent', DEFAULT_LISTS)).toBe(true)
    expect(matchesQuery(tasks[1], '#bills', DEFAULT_LISTS)).toBe(true)
    expect(matchesQuery(tasks[1], 'nothing', DEFAULT_LISTS)).toBe(false)
    expect(matchesQuery(task({ notes: 'call Dr Smith' }), 'smith', DEFAULT_LISTS)).toBe(true)
  })
})

describe('stats', () => {
  it('counts a streak of consecutive completion days', () => {
    const t = [
      task({ completed: true, completedAt: day(0) }),
      task({ completed: true, completedAt: day(-1) }),
      task({ completed: true, completedAt: day(-2, 23) }),
      task({ completed: true, completedAt: day(-4) }),
    ]
    expect(streak(t, NOW)).toBe(3)
  })

  it('keeps the streak alive through yesterday, and resets after a gap', () => {
    expect(streak([task({ completed: true, completedAt: day(-1) })], NOW)).toBe(1)
    expect(streak([task({ completed: true, completedAt: day(-2) })], NOW)).toBe(0)
    expect(streak([], NOW)).toBe(0)
  })

  it('builds seven daily counts', () => {
    const wk = weekCounts(
      [task({ completed: true, completedAt: day(0) }), task({ completed: true, completedAt: day(0, 8) }), task({ completed: true, completedAt: day(-6) })],
      NOW,
    )
    expect(wk).toHaveLength(7)
    expect(wk[6]).toMatchObject({ isToday: true, count: 2, label: 'Wed' })
    expect(wk[0].count).toBe(1)
  })

  it('computes progress', () => {
    const t = [
      task({ completed: true, completedAt: day(0) }),
      task({ due: '2026-11-04' }),
      task({ due: '2026-11-01' }),
      task({ due: '2026-11-09' }),
    ]
    expect(todayProgress(t, NOW)).toEqual({ done: 1, total: 3, pct: 33 })
    expect(overallProgress(t)).toEqual({ done: 1, total: 4, pct: 25 })
    expect(todayProgress([], NOW).pct).toBe(0)
  })
})
