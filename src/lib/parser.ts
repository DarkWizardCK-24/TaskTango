import { addDays, formatDue, formatTime, nextWeekday, startOfDay, toISO } from './dates'
import type { Priority, TaskList } from './types'

export interface Chip {
  kind: 'priority' | 'list' | 'due' | 'tag'
  label: string
}

export interface ParsedQuickAdd {
  title: string
  priority: Priority | null
  listId: string | null
  due: string | null
  time: string | null
  tags: string[]
  chips: Chip[]
}

const PRIORITY_WORDS: Record<string, Priority> = {
  low: 'low',
  l: 'low',
  med: 'medium',
  medium: 'medium',
  m: 'medium',
  high: 'high',
  h: 'high',
  urgent: 'high',
}

const WEEKDAY_WORDS: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
}

function parseTime(token: string): string | null {
  const t = token.toLowerCase()
  let m = /^(\d{1,2})(?::(\d{2}))?(am|pm)$/.exec(t)
  if (m) {
    let h = Number(m[1])
    const min = Number(m[2] ?? 0)
    if (h < 1 || h > 12 || min > 59) return null
    if (m[3] === 'pm' && h !== 12) h += 12
    if (m[3] === 'am' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  }
  m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(t)
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`
  return null
}

function findList(name: string, lists: TaskList[]): TaskList | undefined {
  const n = name.toLowerCase()
  return (
    lists.find((l) => l.id === n || l.name.toLowerCase() === n) ??
    (n.length >= 2 ? lists.find((l) => l.name.toLowerCase().startsWith(n)) : undefined)
  )
}

/**
 * Parses natural quick-add input such as "Buy milk !high #home tomorrow 5pm".
 * Recognised tokens are removed from the title and reported as chips.
 */
export function parseQuickAdd(input: string, now: Date, lists: TaskList[]): ParsedQuickAdd {
  const tokens = input.trim().split(/\s+/).filter(Boolean)
  const out: ParsedQuickAdd = {
    title: '',
    priority: null,
    listId: null,
    due: null,
    time: null,
    tags: [],
    chips: [],
  }
  const rest: string[] = []
  const today = startOfDay(now)

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]
    const low = tok.toLowerCase()

    if (/^![a-z]+$/i.test(tok) && PRIORITY_WORDS[low.slice(1)]) {
      out.priority = PRIORITY_WORDS[low.slice(1)]
      continue
    }
    if (/^#[\w-]+$/.test(tok)) {
      const list = findList(low.slice(1), lists)
      if (list) out.listId = list.id
      else if (!out.tags.includes(low.slice(1))) out.tags.push(low.slice(1))
      continue
    }
    if (/^@[\w-]+$/.test(tok)) {
      const tag = low.slice(1)
      if (!out.tags.includes(tag)) out.tags.push(tag)
      continue
    }
    if (low === 'today' || low === 'tonight') {
      out.due = toISO(today)
      continue
    }
    if (low === 'tomorrow' || low === 'tmrw' || low === 'tmr') {
      out.due = toISO(addDays(today, 1))
      continue
    }
    if (low in WEEKDAY_WORDS) {
      out.due = toISO(nextWeekday(now, WEEKDAY_WORDS[low]))
      continue
    }
    if (low === 'in' && i + 1 < tokens.length) {
      const compact = /^(\d{1,3})([dw])$/.exec(tokens[i + 1].toLowerCase())
      if (compact) {
        const n = Number(compact[1]) * (compact[2] === 'w' ? 7 : 1)
        out.due = toISO(addDays(today, n))
        i += 1
        continue
      }
      const spaced = /^(\d{1,3})$/.exec(tokens[i + 1])
      const unit = tokens[i + 2]?.toLowerCase()
      if (spaced && unit && /^(day|days|week|weeks)$/.test(unit)) {
        const n = Number(spaced[1]) * (unit.startsWith('week') ? 7 : 1)
        out.due = toISO(addDays(today, n))
        i += 2
        continue
      }
    }
    if (low === 'at' && i + 1 < tokens.length && parseTime(tokens[i + 1])) {
      out.time = parseTime(tokens[i + 1])
      i += 1
      continue
    }
    const time = parseTime(tok)
    if (time) {
      out.time = time
      continue
    }
    rest.push(tok)
  }

  if (out.time && !out.due) out.due = toISO(today)
  out.title = rest.join(' ').trim()

  if (out.priority) {
    out.chips.push({ kind: 'priority', label: `${out.priority[0].toUpperCase()}${out.priority.slice(1)} priority` })
  }
  if (out.listId) {
    const l = lists.find((x) => x.id === out.listId)
    if (l) out.chips.push({ kind: 'list', label: l.name })
  }
  if (out.due) {
    out.chips.push({ kind: 'due', label: formatDue(out.due, out.time, now) })
  } else if (out.time) {
    out.chips.push({ kind: 'due', label: formatTime(out.time) })
  }
  for (const t of out.tags) out.chips.push({ kind: 'tag', label: `#${t}` })
  return out
}
