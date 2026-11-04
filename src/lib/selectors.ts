import { bucketFor, sameDay, toISO } from './dates'
import type { Bucket } from './dates'
import type { SortKey, Task, TaskList, View } from './types'

export type SectionKey = Bucket | 'done'

export interface Section {
  key: SectionKey
  title: string
  tasks: Task[]
}

const SECTION_TITLES: Record<SectionKey, string> = {
  overdue: 'Overdue',
  today: 'Today',
  tomorrow: 'Tomorrow',
  later: 'Later',
  none: 'No date',
  done: 'Completed',
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const

export function matchesQuery(task: Task, query: string, lists: TaskList[]): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const listName = lists.find((l) => l.id === task.listId)?.name ?? ''
  return (
    task.title.toLowerCase().includes(q) ||
    task.notes.toLowerCase().includes(q) ||
    task.tags.some((t) => t.includes(q.replace(/^#/, ''))) ||
    task.subtasks.some((s) => s.title.toLowerCase().includes(q)) ||
    listName.toLowerCase().includes(q)
  )
}

export function filterByView(tasks: Task[], view: View, now: Date): Task[] {
  const today = toISO(now)
  switch (view.kind) {
    case 'today':
      return tasks.filter((t) =>
        t.completed
          ? t.completedAt !== null && sameDay(t.completedAt, now)
          : t.due !== null && t.due <= today,
      )
    case 'upcoming':
      return tasks.filter((t) => !t.completed && t.due !== null && t.due > today)
    case 'completed':
      return tasks.filter((t) => t.completed)
    case 'list':
      return tasks.filter((t) => t.listId === view.id)
    default:
      return tasks
  }
}

const dueStamp = (t: Task) => (t.due ? `${t.due}T${t.time ?? '99:99'}` : '9999')

export function sortTasks(tasks: Task[], sort: SortKey, completedView = false): Task[] {
  const copy = tasks.slice()
  if (sort === 'due') copy.sort((a, b) => dueStamp(a).localeCompare(dueStamp(b)))
  else if (sort === 'priority') copy.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
  else if (sort === 'created') copy.sort((a, b) => b.createdAt - a.createdAt)
  else if (completedView) copy.sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
  return copy
}

const ORDER_BY_VIEW: Record<string, SectionKey[]> = {
  today: ['overdue', 'today', 'done'],
  upcoming: ['tomorrow', 'later'],
  completed: ['done'],
  default: ['overdue', 'today', 'tomorrow', 'later', 'none', 'done'],
}

export function buildSections(tasks: Task[], view: View, sort: SortKey, now: Date, searching = false): Section[] {
  const order = ORDER_BY_VIEW[searching ? 'default' : view.kind] ?? ORDER_BY_VIEW.default
  const buckets = new Map<SectionKey, Task[]>(order.map((k) => [k, []]))
  for (const t of tasks) {
    const key: SectionKey = t.completed ? 'done' : bucketFor(t.due, now)
    buckets.get(key)?.push(t)
  }
  return order
    .map((key) => ({
      key,
      title: SECTION_TITLES[key],
      tasks: sortTasks(buckets.get(key) ?? [], sort, key === 'done'),
    }))
    .filter((s) => s.tasks.length > 0)
}

export function countsForView(tasks: Task[], now: Date) {
  const today = toISO(now)
  const open = tasks.filter((t) => !t.completed)
  return {
    today: open.filter((t) => t.due !== null && t.due <= today).length,
    upcoming: open.filter((t) => t.due !== null && t.due > today).length,
    all: open.length,
    completed: tasks.length - open.length,
  }
}

export function countsForList(tasks: Task[], listId: string): number {
  return tasks.filter((t) => t.listId === listId && !t.completed).length
}
