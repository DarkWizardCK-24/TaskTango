export type Priority = 'low' | 'medium' | 'high'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  notes: string
  priority: Priority
  /** Local calendar date, YYYY-MM-DD */
  due: string | null
  /** Local time, HH:mm */
  time: string | null
  listId: string
  tags: string[]
  subtasks: Subtask[]
  completed: boolean
  completedAt: number | null
  createdAt: number
}

export interface TaskList {
  id: string
  name: string
  color: string
  builtin?: boolean
}

export interface AppData {
  version: 2
  tasks: Task[]
  lists: TaskList[]
}

export type SortKey = 'manual' | 'due' | 'priority' | 'created'
export type ThemePref = 'system' | 'light' | 'dark'

export interface Prefs {
  theme: ThemePref
  sort: SortKey
  notifications: boolean
  onboarded: boolean
}

export type View =
  | { kind: 'today' }
  | { kind: 'upcoming' }
  | { kind: 'all' }
  | { kind: 'completed' }
  | { kind: 'list'; id: string }
  | { kind: 'lists' }
  | { kind: 'stats' }

/** Warm palette only: reds, oranges, ambers and earthy browns. */
export const LIST_COLORS = [
  '#d4143a',
  '#ff5c47',
  '#ff8a1f',
  '#f2b01e',
  '#b8431a',
  '#c9694a',
  '#a8743f',
  '#8c2f1b',
] as const

export const DEFAULT_LISTS: TaskList[] = [
  { id: 'personal', name: 'Personal', color: '#ff5c47', builtin: true },
  { id: 'work', name: 'Work', color: '#d4143a', builtin: true },
  { id: 'study', name: 'Study', color: '#f2b01e', builtin: true },
  { id: 'health', name: 'Health', color: '#c9694a', builtin: true },
  { id: 'home', name: 'Home', color: '#ff8a1f', builtin: true },
]

export const DEFAULT_PREFS: Prefs = {
  theme: 'system',
  sort: 'manual',
  notifications: false,
  onboarded: false,
}

export const PRIORITIES: Priority[] = ['low', 'medium', 'high']
