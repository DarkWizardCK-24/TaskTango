import { addDays, sameDay, shortWeekday, startOfDay, toISO, fromISO } from './dates'
import type { Task } from './types'

export function completedDays(tasks: Task[]): Set<string> {
  const days = new Set<string>()
  for (const t of tasks) {
    if (t.completed && t.completedAt !== null) days.add(toISO(new Date(t.completedAt)))
  }
  return days
}

/**
 * Consecutive days with at least one completed task, ending today.
 * If nothing is done yet today, the streak is still alive through yesterday.
 */
export function streak(tasks: Task[], now: Date): number {
  const days = completedDays(tasks)
  let cursor = startOfDay(now)
  if (!days.has(toISO(cursor))) cursor = addDays(cursor, -1)
  let count = 0
  while (days.has(toISO(cursor))) {
    count++
    cursor = addDays(cursor, -1)
  }
  return count
}

export interface DayCount {
  date: string
  label: string
  count: number
  isToday: boolean
}

/** Completed-task counts for the last 7 days, oldest first. */
export function weekCounts(tasks: Task[], now: Date): DayCount[] {
  const today = startOfDay(now)
  const out: DayCount[] = []
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i)
    const iso = toISO(d)
    out.push({
      date: iso,
      label: shortWeekday(fromISO(iso)),
      count: tasks.filter((t) => t.completed && t.completedAt !== null && toISO(new Date(t.completedAt)) === iso).length,
      isToday: i === 0,
    })
  }
  return out
}

export interface Progress {
  done: number
  total: number
  pct: number
}

const pct = (done: number, total: number) => (total === 0 ? 0 : Math.round((done / total) * 100))

/** Today's plan: tasks done today plus anything still open that is due today or overdue. */
export function todayProgress(tasks: Task[], now: Date): Progress {
  const today = toISO(now)
  const done = tasks.filter((t) => t.completed && t.completedAt !== null && sameDay(t.completedAt, now)).length
  const remaining = tasks.filter((t) => !t.completed && t.due !== null && t.due <= today).length
  const total = done + remaining
  return { done, total, pct: pct(done, total) }
}

export function overallProgress(tasks: Task[]): Progress {
  const done = tasks.filter((t) => t.completed).length
  return { done, total: tasks.length, pct: pct(done, tasks.length) }
}
