import { useMemo, useState, type RefObject } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, CalendarClock, Flag, Hash, ListTodo } from 'lucide-react'
import { toISO } from '../lib/dates'
import { parseQuickAdd, type Chip } from '../lib/parser'
import { useStore } from '../lib/store'
import { useUi } from '../lib/ui'

const HINTS = ['!high', '#work', 'tomorrow', 'fri', 'at 5pm', 'in 3d']

function ChipIcon({ kind }: { kind: Chip['kind'] }) {
  const p = { size: 13, 'aria-hidden': true } as const
  if (kind === 'priority') return <Flag {...p} />
  if (kind === 'due') return <CalendarClock {...p} />
  if (kind === 'list') return <ListTodo {...p} />
  return <Hash {...p} />
}

interface Props {
  inputRef?: RefObject<HTMLInputElement | null>
  autoFocus?: boolean
  onAdded?: () => void
  large?: boolean
}

export function QuickAdd({ inputRef, autoFocus, onAdded, large }: Props) {
  const { lists, now, addTask } = useStore()
  const { view } = useUi()
  const [text, setText] = useState('')
  const parsed = useMemo(() => parseQuickAdd(text, now, lists), [text, now, lists])
  const canAdd = parsed.title.length > 0

  const submit = () => {
    if (!canAdd) return
    const listId = parsed.listId ?? (view.kind === 'list' ? view.id : 'personal')
    const due = parsed.due ?? (view.kind === 'today' ? toISO(now) : null)
    addTask({
      title: parsed.title,
      priority: parsed.priority ?? 'medium',
      due,
      time: parsed.due ? parsed.time : null,
      listId,
      tags: parsed.tags,
    })
    setText('')
    onAdded?.()
  }

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div
        className={`card flex items-center gap-2 rounded-2xl pl-4 pr-2 focus-within:border-coral/60 focus-within:ring-2 focus-within:ring-coral/30 ${
          large ? 'py-2' : 'py-1.5'
        }`}
      >
        <label htmlFor="quick-add" className="sr-only">
          Quick add a task
        </label>
        <input
          id="quick-add"
          ref={inputRef}
          autoFocus={autoFocus}
          data-autofocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && text) {
              e.stopPropagation()
              setText('')
            } else if (e.key === 'Escape') {
              e.currentTarget.blur()
            }
          }}
          autoComplete="off"
          enterKeyHint="done"
          placeholder='Try "Call mum tomorrow 5pm !high #personal"'
          className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-muted/80"
          style={{ outline: 'none' }}
        />
        <button
          type="submit"
          disabled={!canAdd}
          aria-label="Add task"
          className="btn-brand grid size-10 shrink-0 place-items-center rounded-xl"
        >
          <ArrowUp size={20} strokeWidth={2.6} aria-hidden="true" />
        </button>
      </div>
      <div className="min-h-8 px-1 pt-2" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          {parsed.chips.length > 0 ? (
            <motion.div
              key="chips"
              className="flex flex-wrap items-center gap-1.5"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <span className="sr-only">Detected:</span>
              {parsed.chips.map((c) => (
                <motion.span
                  key={`${c.kind}-${c.label}`}
                  layout
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  data-chip={c.kind}
                  className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white shadow-sm"
                >
                  <ChipIcon kind={c.kind} />
                  {c.label}
                </motion.span>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="hints"
              className="flex flex-wrap items-center gap-1.5 text-xs text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span>Shortcuts:</span>
              {HINTS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    setText((t) => `${t}${t && !t.endsWith(' ') ? ' ' : ''}${h} `)
                    inputRef?.current?.focus()
                  }}
                  className="rounded-full border border-line bg-track/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-fg/80 transition hover:border-coral/60"
                >
                  {h}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </form>
  )
}

