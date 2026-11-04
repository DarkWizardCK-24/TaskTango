import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
import type { Section } from '../lib/selectors'
import type { Task, TaskList as TList } from '../lib/types'
import { TaskCard } from './TaskCard'

interface Props {
  sections: Section[]
  lists: TList[]
  now: Date
  reorderable: boolean
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onReorder: (activeId: string, overId: string) => void
}

function SortableTask({
  task,
  list,
  now,
  reorderable,
  onToggle,
  onOpen,
  onDelete,
}: { task: Task; list?: TList; now: Date; reorderable: boolean } & Pick<Props, 'onToggle' | 'onOpen' | 'onDelete'>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !reorderable,
  })
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -40, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      className="list-none"
    >
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Translate.toString(transform),
          transition,
          zIndex: isDragging ? 20 : undefined,
          position: 'relative',
        }}
      >
        <TaskCard
          task={task}
          list={list}
          now={now}
          onToggle={onToggle}
          onOpen={onOpen}
          onDelete={onDelete}
          showHandle={reorderable}
          handleProps={reorderable ? { ...attributes, ...listeners } : undefined}
          dragging={isDragging}
        />
      </div>
    </motion.li>
  )
}

export function TaskListView({ sections, lists, now, reorderable, onToggle, onOpen, onDelete, onReorder }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const ids = sections.flatMap((s) => s.tasks.map((t) => t.id))

  const onDragEnd = (e: DragEndEvent) => {
    if (e.over && e.active.id !== e.over.id) onReorder(String(e.active.id), String(e.over.id))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.key} aria-labelledby={`sec-${section.key}`}>
              <h2
                id={`sec-${section.key}`}
                className="mb-2.5 flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-wide text-muted"
              >
                <span className={section.key === 'overdue' ? 'text-[#b40f30] dark:text-[#ff8a73]' : ''}>{section.title}</span>
                <span className="rounded-full bg-track px-2 py-0.5 text-xs font-bold normal-case tracking-normal text-muted">
                  {section.tasks.length}
                </span>
              </h2>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                <AnimatePresence initial={false}>
                  {section.tasks.map((task) => (
                    <SortableTask
                      key={task.id}
                      task={task}
                      list={lists.find((l) => l.id === task.listId)}
                      now={now}
                      reorderable={reorderable}
                      onToggle={onToggle}
                      onOpen={onOpen}
                      onDelete={onDelete}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
