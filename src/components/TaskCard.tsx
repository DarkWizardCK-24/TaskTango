import { memo, type HTMLAttributes } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { ArrowDown, CalendarClock, Check, Flame, GripVertical, ListChecks, StickyNote, Trash2 } from 'lucide-react'
import { formatDue, isOverdue } from '../lib/dates'
import { useIsCoarse } from '../lib/hooks'
import type { Task, TaskList } from '../lib/types'
import { TaskCheck } from './TaskCheck'

interface Props {
  task: Task
  list?: TaskList
  now: Date
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  handleProps?: HTMLAttributes<HTMLButtonElement>
  showHandle: boolean
  dragging?: boolean
}

function Chip({ children, tone = 'plain' }: { children: React.ReactNode; tone?: 'plain' | 'danger' | 'warn' | 'soft' }) {
  const tones = {
    plain: 'bg-track text-muted',
    soft: 'bg-[#ff9a1f]/15 text-[#a8541a] dark:text-[#ffb36b]',
    warn: 'bg-[#f2b01e]/20 text-[#8a5a00] dark:text-[#ffd070]',
    danger: 'bg-[#d4143a]/12 text-[#b40f30] dark:bg-[#ff5c47]/18 dark:text-[#ff8a73]',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}

export const TaskCard = memo(function TaskCard({
  task,
  list,
  now,
  onToggle,
  onOpen,
  onDelete,
  handleProps,
  showHandle,
  dragging,
}: Props) {
  const coarse = useIsCoarse()
  const x = useMotionValue(0)
  const completeOpacity = useTransform(x, [0, 70], [0, 1])
  const deleteOpacity = useTransform(x, [0, -70], [0, 1])
  const overdue = isOverdue(task, now)
  const done = task.subtasks.filter((s) => s.done).length
  const total = task.subtasks.length

  const stripe =
    task.priority === 'high' ? 'bg-[#d4143a]' : task.priority === 'medium' ? 'bg-[#ff9a1f]' : 'bg-[var(--muted)]/40'

  return (
    <div className="relative">
      {coarse && (
        <>
          <motion.div
            style={{ opacity: completeOpacity }}
            className="absolute inset-0 flex items-center rounded-2xl bg-brand pl-5 text-white"
            aria-hidden="true"
          >
            <Check size={22} />
          </motion.div>
          <motion.div
            style={{ opacity: deleteOpacity }}
            className="absolute inset-0 flex items-center justify-end rounded-2xl bg-[#b40f30] pr-5 text-white"
            aria-hidden="true"
          >
            <Trash2 size={22} />
          </motion.div>
        </>
      )}
      <motion.div
        style={{ x, touchAction: 'pan-y' }}
        drag={coarse ? 'x' : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.55}
        onDragEnd={(_, info) => {
          if (info.offset.x > 90) onToggle(task.id)
          else if (info.offset.x < -90) onDelete(task.id)
        }}
        className={`card relative flex items-stretch gap-2 overflow-hidden rounded-2xl py-3 pl-3 pr-2 ${
          dragging ? 'shadow-pop ring-2 ring-coral/50' : ''
        } ${task.completed ? 'opacity-70' : ''}`}
      >
        <span className={`absolute inset-y-3 left-0 w-1 rounded-r-full ${task.completed ? 'bg-track' : stripe}`} aria-hidden="true" />
        {showHandle && (
          <button
            type="button"
            aria-label={`Reorder ${task.title}`}
            className="-ml-1.5 flex shrink-0 cursor-grab touch-none items-center rounded-md px-0.5 text-muted/70 hover:text-fg active:cursor-grabbing"
            {...handleProps}
          >
            <GripVertical size={18} aria-hidden="true" />
          </button>
        )}
        <div className="pt-0.5">
          <TaskCheck
            checked={task.completed}
            onChange={() => onToggle(task.id)}
            label={task.completed ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
          />
        </div>
        <button
          type="button"
          onClick={() => onOpen(task.id)}
          className="min-w-0 flex-1 rounded-lg px-1 text-left"
          aria-label={`Edit ${task.title}`}
        >
          <span
            className={`block break-words font-semibold leading-snug ${task.completed ? 'text-muted line-through decoration-2' : ''}`}
          >
            {task.title}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {task.due && (
              <Chip tone={overdue ? 'danger' : task.completed ? 'plain' : 'soft'}>
                <CalendarClock size={13} aria-hidden="true" />
                {overdue ? 'Overdue · ' : ''}
                {formatDue(task.due, task.time, now)}
              </Chip>
            )}
            {task.priority === 'high' && !task.completed && (
              <Chip tone="danger">
                <Flame size={13} aria-hidden="true" />
                High
              </Chip>
            )}
            {task.priority === 'low' && !task.completed && (
              <Chip>
                <ArrowDown size={13} aria-hidden="true" />
                Low
              </Chip>
            )}
            {list && (
              <Chip>
                <span className="size-2 rounded-full" style={{ background: list.color }} aria-hidden="true" />
                {list.name}
              </Chip>
            )}
            {total > 0 && (
              <Chip tone={done === total ? 'warn' : 'plain'}>
                <ListChecks size={13} aria-hidden="true" />
                {done}/{total}
              </Chip>
            )}
            {task.notes && (
              <span className="text-muted" title="Has notes">
                <StickyNote size={14} aria-label="Has notes" />
              </span>
            )}
            {task.tags.map((t) => (
              <span key={t} className="text-xs font-medium text-muted">
                #{t}
              </span>
            ))}
          </span>
          {total > 0 && (
            <span className="mt-2 block h-1 overflow-hidden rounded-full bg-track" aria-hidden="true">
              <span className="block h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${(done / total) * 100}%` }} />
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete ${task.title}`}
          className="grid size-9 shrink-0 place-items-center self-start rounded-full text-muted/70 transition hover:bg-[#d4143a]/10 hover:text-[#b40f30]"
        >
          <Trash2 size={17} aria-hidden="true" />
        </button>
      </motion.div>
    </div>
  )
})
