import { useState } from 'react'
import { ChevronRight, CheckCheck, Inbox, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { useUi } from '../lib/ui'
import { countsForList, countsForView } from '../lib/selectors'
import { ConfirmDialog } from './Dialogs'

export function ListsView() {
  const { tasks, lists, now, deleteList } = useStore()
  const { setView, setListDialogOpen } = useUi()
  const [toDelete, setToDelete] = useState<string | null>(null)
  const counts = countsForView(tasks, now)
  const target = lists.find((l) => l.id === toDelete)

  return (
    <div className="space-y-6">
      <section aria-labelledby="smart">
        <h2 id="smart" className="mb-2.5 px-1 text-sm font-bold uppercase tracking-wide text-muted">
          Everything
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setView({ kind: 'all' })} className="card flex items-center gap-3 rounded-2xl p-4 text-left">
            <span className="grid size-10 place-items-center rounded-xl bg-brand text-white">
              <Inbox size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="block font-bold">All tasks</span>
              <span className="text-sm text-muted">{counts.all} open</span>
            </span>
          </button>
          <button type="button" onClick={() => setView({ kind: 'completed' })} className="card flex items-center gap-3 rounded-2xl p-4 text-left">
            <span className="grid size-10 place-items-center rounded-xl bg-track text-fg">
              <CheckCheck size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="block font-bold">Completed</span>
              <span className="text-sm text-muted">{counts.completed} done</span>
            </span>
          </button>
        </div>
      </section>

      <section aria-labelledby="mine">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <h2 id="mine" className="text-sm font-bold uppercase tracking-wide text-muted">
            My lists
          </h2>
          <button
            type="button"
            onClick={() => setListDialogOpen(true)}
            className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white"
          >
            <Plus size={14} aria-hidden="true" />
            New list
          </button>
        </div>
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {lists.map((l) => {
            const open = countsForList(tasks, l.id)
            const total = tasks.filter((t) => t.listId === l.id).length
            const pct = total ? ((total - open) / total) * 100 : 0
            return (
              <li key={l.id} className="card relative overflow-hidden rounded-2xl">
                <button
                  type="button"
                  onClick={() => setView({ kind: 'list', id: l.id })}
                  className="flex w-full items-center gap-3 p-4 pr-12 text-left"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl text-lg font-extrabold text-white" style={{ background: l.color }} aria-hidden="true">
                    {l.name[0].toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{l.name}</span>
                    <span className="text-sm text-muted">
                      {open} open{total > open ? `, ${total - open} done` : ''}
                    </span>
                  </span>
                  <ChevronRight size={18} className="text-muted" aria-hidden="true" />
                </button>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-track" aria-hidden="true">
                  <div className="h-full" style={{ width: `${pct}%`, background: l.color }} />
                </div>
              </li>
            )
          })}
        </ul>
        {lists.some((l) => !l.builtin) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {lists
              .filter((l) => !l.builtin)
              .map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setToDelete(l.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-bold text-muted hover:border-[#d4143a]/50 hover:text-[#b40f30]"
                >
                  <Trash2 size={13} aria-hidden="true" />
                  Delete {l.name}
                </button>
              ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!target}
        title={`Delete "${target?.name ?? ''}"?`}
        message="Its tasks are kept and moved to Personal."
        confirmLabel="Delete list"
        onClose={() => setToDelete(null)}
        onConfirm={() => target && deleteList(target.id)}
      />
    </div>
  )
}
