import { mergeData } from './schema'
import type { AppData, Task, TaskList } from './types'

export type UndoEntry =
  | { kind: 'delete'; task: Task; index: number }
  | { kind: 'toggle'; id: string; completed: boolean; completedAt: number | null }
  | { kind: 'clear'; removed: { task: Task; index: number }[] }

export interface State {
  tasks: Task[]
  lists: TaskList[]
  undo: UndoEntry[]
}

export type Action =
  | { type: 'add'; task: Task }
  | { type: 'update'; id: string; patch: Partial<Omit<Task, 'id'>> }
  | { type: 'toggle'; id: string; now: number }
  | { type: 'toggleSubtask'; id: string; subId: string }
  | { type: 'delete'; id: string }
  | { type: 'clearCompleted' }
  | { type: 'reorder'; activeId: string; overId: string }
  | { type: 'undo' }
  | { type: 'addList'; list: TaskList }
  | { type: 'deleteList'; id: string }
  | { type: 'hydrate'; data: AppData }
  | { type: 'sync'; tasks: Task[] }
  | { type: 'syncMeta'; lists: TaskList[] }
  | { type: 'replace'; data: AppData }
  | { type: 'merge'; data: AppData }
  | { type: 'reset'; data: AppData }

export const UNDO_LIMIT = 30

export const initialState = (data: AppData): State => ({
  tasks: data.tasks,
  lists: data.lists,
  undo: [],
})

const pushUndo = (undo: UndoEntry[], entry: UndoEntry): UndoEntry[] =>
  [...undo, entry].slice(-UNDO_LIMIT)

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add':
      // New tasks go to the end of the manual order.
      return { ...state, tasks: [...state.tasks, action.task] }

    case 'update':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
      }

    case 'toggle': {
      const task = state.tasks.find((t) => t.id === action.id)
      if (!task) return state
      const completed = !task.completed
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, completed, completedAt: completed ? action.now : null } : t,
        ),
        undo: pushUndo(state.undo, {
          kind: 'toggle',
          id: task.id,
          completed: task.completed,
          completedAt: task.completedAt,
        }),
      }
    }

    case 'toggleSubtask':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id
            ? {
                ...t,
                subtasks: t.subtasks.map((s) => (s.id === action.subId ? { ...s, done: !s.done } : s)),
              }
            : t,
        ),
      }

    case 'delete': {
      const index = state.tasks.findIndex((t) => t.id === action.id)
      if (index < 0) return state
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.id),
        undo: pushUndo(state.undo, { kind: 'delete', task: state.tasks[index], index }),
      }
    }

    case 'clearCompleted': {
      const removed = state.tasks
        .map((task, index) => ({ task, index }))
        .filter((x) => x.task.completed)
      if (removed.length === 0) return state
      return {
        ...state,
        tasks: state.tasks.filter((t) => !t.completed),
        undo: pushUndo(state.undo, { kind: 'clear', removed }),
      }
    }

    case 'reorder': {
      const from = state.tasks.findIndex((t) => t.id === action.activeId)
      const to = state.tasks.findIndex((t) => t.id === action.overId)
      if (from < 0 || to < 0 || from === to) return state
      const tasks = state.tasks.slice()
      const [moved] = tasks.splice(from, 1)
      tasks.splice(to, 0, moved)
      return { ...state, tasks }
    }

    case 'undo': {
      const entry = state.undo[state.undo.length - 1]
      if (!entry) return state
      const undo = state.undo.slice(0, -1)
      switch (entry.kind) {
        case 'delete': {
          if (state.tasks.some((t) => t.id === entry.task.id)) return { ...state, undo }
          const tasks = state.tasks.slice()
          tasks.splice(Math.min(entry.index, tasks.length), 0, entry.task)
          return { ...state, tasks, undo }
        }
        case 'toggle':
          return {
            ...state,
            tasks: state.tasks.map((t) =>
              t.id === entry.id ? { ...t, completed: entry.completed, completedAt: entry.completedAt } : t,
            ),
            undo,
          }
        case 'clear': {
          const tasks = state.tasks.slice()
          for (const { task, index } of entry.removed) {
            if (!tasks.some((t) => t.id === task.id)) tasks.splice(Math.min(index, tasks.length), 0, task)
          }
          return { ...state, tasks, undo }
        }
      }
      return { ...state, undo }
    }

    case 'addList':
      return { ...state, lists: [...state.lists, action.list] }

    case 'deleteList': {
      const list = state.lists.find((l) => l.id === action.id)
      if (!list || list.builtin) return state
      return {
        ...state,
        lists: state.lists.filter((l) => l.id !== action.id),
        tasks: state.tasks.map((t) => (t.listId === action.id ? { ...t, listId: 'personal' } : t)),
        undo: [],
      }
    }

    // Remote changes: keep the undo stack so a server echo does not wipe Ctrl+Z.
    case 'sync':
      return { ...state, tasks: action.tasks }

    case 'syncMeta':
      return { ...state, lists: action.lists }

    case 'hydrate':
    case 'replace':
    case 'reset':
      return { tasks: action.data.tasks, lists: action.data.lists, undo: [] }

    case 'merge': {
      const merged = mergeData({ version: 2, tasks: state.tasks, lists: state.lists }, action.data)
      return { tasks: merged.tasks, lists: merged.lists, undo: state.undo }
    }
  }
}
