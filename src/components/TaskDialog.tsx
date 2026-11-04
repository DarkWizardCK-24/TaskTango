import { useState } from 'react'
import { ArrowDown, ArrowUp, Flame, Plus, Trash2 } from 'lucide-react'
import { addDays, nextWeekday, toISO } from '../lib/dates'
import { uid } from '../lib/id'
import { useStore } from '../lib/store'
import { useUi } from '../lib/ui'
import type { Priority, Subtask, Task } from '../lib/types'
import { Sheet } from './Sheet'
import { TaskCheck } from './TaskCheck'

const PRIORITY_OPTS: { value: Priority; label: string; icon: typeof Flame; on: string }[] = [
  { value: 'low', label: 'Low', icon: ArrowDown, on: 'bg-[#a8743f] text-white' },
  { value: 'medium', label: 'Medium', icon: ArrowUp, on: 'bg-[#ff9a1f] text-[#2b1a14]' },
  { value: 'high', label: 'High', icon: Flame, on: 'bg-[#d4143a] text-white' },
]

const inputCls =
  'w-full rounded-xl border border-line bg-bg2/60 px-3.5 py-2.5 text-base text-fg placeholder:text-muted/70 focus:border-coral/70 focus:outline-none focus:ring-2 focus:ring-coral/30'

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-bold uppercase tracking-wide text-muted">
        {label}
      </label>
      {children}
    </div>
  )
}

function Editor({ task, onClose }: { task: Task; onClose: () => void }) {
  const { lists, now, updateTask, deleteTask } = useStore()
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes)
  const [priority, setPriority] = useState<Priority>(task.priority)
  const [due, setDue] = useState(task.due ?? '')
  const [time, setTime] = useState(task.time ?? '')
  const [listId, setListId] = useState(task.listId)
  const [tags, setTags] = useState(task.tags.join(', '))
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks)
  const [newSub, setNewSub] = useState('')
  const [error, setError] = useState('')

  const today = toISO(now)
  const quick = [
    { label: 'Today', value: today },
    { label: 'Tomorrow', value: toISO(addDays(now, 1)) },
    { label: 'Next Mon', value: toISO(nextWeekday(now, 1)) },
    { label: 'No date', value: '' },
  ]

  const addSub = () => {
    const t = newSub.trim()
    if (!t) return
    setSubtasks((s) => [...s, { id: uid(), title: t, done: false }])
    setNewSub('')
  }

  const save = () => {
    const t = title.trim()
    if (!t) {
      setError('Give your task a title.')
      return
    }
    const pending = newSub.trim()
    const subs = pending ? [...subtasks, { id: uid(), title: pending, done: false }] : subtasks
    updateTask(task.id, {
      title: t,
      notes: notes.trim(),
      priority,
      due: due || null,
      time: due && time ? time : null,
      listId,
      tags: [...new Set(tags.split(/[\s,]+/).map((x) => x.replace(/^#/, '').toLowerCase()).filter(Boolean))].slice(0, 12),
      subtasks: subs.map((s) => ({ ...s, title: s.title.trim() })),
    })
    onClose()
  }

  return (
    <form
      id="task-form"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault()
          save()
        }
      }}
      className="space-y-5"
    >
      <Field label="Title" htmlFor="task-title">
        <input
          id="task-title"
          data-autofocus
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setError('')
          }}
          maxLength={300}
          aria-invalid={!!error}
          aria-describedby={error ? 'task-title-error' : undefined}
          placeholder="What needs doing?"
          className={inputCls}
        />
        {error && (
          <p id="task-title-error" role="alert" className="text-sm font-medium text-[#b40f30] dark:text-[#ff8a73]">
            {error}
          </p>
        )}
      </Field>

      <Field label="Notes" htmlFor="task-notes">
        <textarea
          id="task-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={5000}
          placeholder="Details, links, anything to remember"
          className={`${inputCls} resize-y`}
        />
      </Field>

      <fieldset className="space-y-1.5">
        <legend className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Priority</legend>
        <div role="radiogroup" aria-label="Priority" className="grid grid-cols-3 gap-2">
          {PRIORITY_OPTS.map((o) => {
            const Icon = o.icon
            const active = priority === o.value
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPriority(o.value)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                  active ? `${o.on} border-transparent shadow-sm` : 'border-line bg-bg2/60 text-fg hover:border-coral/50'
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                {o.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Due</legend>
        <div className="flex flex-wrap gap-2">
          {quick.map((q) => (
            <button
              key={q.label}
              type="button"
              aria-pressed={due === q.value}
              onClick={() => setDue(q.value)}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                due === q.value ? 'border-transparent bg-brand text-white' : 'border-line bg-bg2/60 hover:border-coral/50'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_9rem] gap-2">
          <input
            type="date"
            aria-label="Due date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className={inputCls}
          />
          <input
            type="time"
            aria-label="Due time"
            value={time}
            disabled={!due}
            onChange={(e) => setTime(e.target.value)}
            className={`${inputCls} disabled:opacity-50`}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">List</legend>
        <div role="radiogroup" aria-label="List" className="flex flex-wrap gap-2">
          {lists.map((l) => (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={listId === l.id}
              onClick={() => setListId(l.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                listId === l.id ? 'border-transparent bg-fg text-bg' : 'border-line bg-bg2/60 hover:border-coral/50'
              }`}
            >
              <span className="size-2.5 rounded-full" style={{ background: l.color }} aria-hidden="true" />
              {l.name}
            </button>
          ))}
        </div>
      </fieldset>

      <Field label="Tags" htmlFor="task-tags">
        <input
          id="task-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="errands, quick, deep-work"
          className={inputCls}
        />
      </Field>

      <fieldset>
        <legend className="mb-1.5 flex w-full items-center justify-between text-xs font-bold uppercase tracking-wide text-muted">
          <span>Subtasks</span>
          {subtasks.length > 0 && (
            <span className="normal-case tracking-normal">
              {subtasks.filter((s) => s.done).length}/{subtasks.length} done
            </span>
          )}
        </legend>
        <ul className="m-0 space-y-2 p-0">
          {subtasks.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <TaskCheck
                size={24}
                checked={s.done}
                label={`Mark subtask "${s.title}" as ${s.done ? 'not done' : 'done'}`}
                onChange={() => setSubtasks((all) => all.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)))}
              />
              <input
                aria-label={`Subtask: ${s.title}`}
                value={s.title}
                onChange={(e) => setSubtasks((all) => all.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)))}
                className={`${inputCls} !py-1.5 ${s.done ? 'text-muted line-through' : ''}`}
              />
              <button
                type="button"
                aria-label={`Remove subtask ${s.title}`}
                onClick={() => setSubtasks((all) => all.filter((x) => x.id !== s.id))}
                className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-[#d4143a]/10 hover:text-[#b40f30]"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <input
            aria-label="New subtask"
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.stopPropagation()
                addSub()
              }
            }}
            placeholder="Add a step"
            className={inputCls}
          />
          <button
            type="button"
            onClick={addSub}
            aria-label="Add subtask"
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-bg2/60 hover:border-coral/60"
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <button
          type="button"
          onClick={() => {
            onClose()
            deleteTask(task.id)
          }}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold text-[#b40f30] hover:bg-[#d4143a]/10 dark:text-[#ff8a73]"
        >
          <Trash2 size={16} aria-hidden="true" />
          Delete
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-bold hover:bg-track"
          >
            Cancel
          </button>
          <button type="submit" className="btn-brand rounded-xl px-5 py-2.5 text-sm font-bold">
            Save
          </button>
        </div>
      </div>
    </form>
  )
}

export function TaskDialog() {
  const { tasks } = useStore()
  const { editing, openEdit } = useUi()
  const task = editing ? tasks.find((t) => t.id === editing) : undefined
  return (
    <Sheet open={!!task} onClose={() => openEdit(null)} title="Edit task" variant="drawer">
      {task && <Editor key={task.id} task={task} onClose={() => openEdit(null)} />}
    </Sheet>
  )
}
