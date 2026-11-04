const pad = (n: number) => String(n).padStart(2, '0')

export const toISO = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function fromISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const startOfDay = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate())

export const addDays = (d: Date, n: number): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

export const isISODate = (s: unknown): s is string =>
  typeof s === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  toISO(fromISO(s)) === s

export const isTime = (s: unknown): s is string =>
  typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s)

export type Bucket = 'overdue' | 'today' | 'tomorrow' | 'later' | 'none'

export function bucketFor(due: string | null, now: Date): Bucket {
  if (!due) return 'none'
  const today = toISO(now)
  if (due < today) return 'overdue'
  if (due === today) return 'today'
  if (due === toISO(addDays(now, 1))) return 'tomorrow'
  return 'later'
}

/** A task is overdue if its date has passed, or it is due today at a time that has passed. */
export function isOverdue(
  t: { due: string | null; time: string | null; completed: boolean },
  now: Date,
): boolean {
  if (t.completed || !t.due) return false
  const today = toISO(now)
  if (t.due < today) return true
  if (t.due === today && t.time) {
    return t.time < `${pad(now.getHours())}:${pad(now.getMinutes())}`
  }
  return false
}

export const sameDay = (ts: number, now: Date): boolean =>
  toISO(new Date(ts)) === toISO(now)

/** Next occurrence of a weekday (0 = Sunday) strictly after today. */
export function nextWeekday(now: Date, dow: number): Date {
  const today = startOfDay(now)
  const diff = ((dow - today.getDay() + 7) % 7) || 7
  return addDays(today, diff)
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${pad(m)} ${suffix}`
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatDue(due: string, time: string | null, now: Date): string {
  const d = fromISO(due)
  const today = startOfDay(now)
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000)
  let label: string
  if (diff === 0) label = 'Today'
  else if (diff === 1) label = 'Tomorrow'
  else if (diff === -1) label = 'Yesterday'
  else if (diff > 1 && diff < 7) label = WEEKDAYS[d.getDay()]
  else if (d.getFullYear() === today.getFullYear()) label = `${MONTHS[d.getMonth()]} ${d.getDate()}`
  else label = `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  return time ? `${label}, ${formatTime(time)}` : label
}

export const shortWeekday = (d: Date): string => WEEKDAYS[d.getDay()]

export function greeting(now: Date): string {
  const h = now.getHours()
  if (h < 5) return 'Still up?'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function longDate(now: Date): string {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return `${names[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`
}
