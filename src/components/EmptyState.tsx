import { Plus, Sparkles } from 'lucide-react'
import { sampleTasks } from '../lib/samples'
import { useStore } from '../lib/store'
import { useUi } from '../lib/ui'
import { EmptyIllustration, HeroIllustration } from './Illustrations'

export function Welcome() {
  const { addTask, setPrefs, now } = useStore()
  const { setView } = useUi()
  return (
    <section className="card overflow-hidden rounded-3xl p-5 text-center sm:p-8" aria-labelledby="welcome-title">
      <HeroIllustration className="mx-auto w-full max-w-[340px]" />
      <h2 id="welcome-title" className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">
        Welcome to <span className="text-brand">Task Tango</span>
      </h2>
      <p className="mx-auto mt-2 max-w-md text-muted">
        Capture tasks as fast as you can type, plan your day and keep a streak going. Everything stays on your device.
      </p>
      <div className="mt-5 flex flex-col justify-center gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            sampleTasks(now).forEach((t) => addTask(t))
            setPrefs({ onboarded: true })
            setView({ kind: 'today' })
          }}
          className="btn-brand inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold"
        >
          <Sparkles size={18} aria-hidden="true" />
          Try with sample tasks
        </button>
        <button
          type="button"
          onClick={() => setPrefs({ onboarded: true })}
          className="rounded-2xl border border-line px-5 py-3 font-bold hover:bg-track"
        >
          Start fresh
        </button>
      </div>
    </section>
  )
}

export function EmptyState({ title, message, showAdd = true }: { title: string; message: string; showAdd?: boolean }) {
  const { focusQuickAdd } = useUi()
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <EmptyIllustration className="w-56 max-w-full sm:w-64" />
      <h2 className="mt-3 font-display text-xl font-extrabold">{title}</h2>
      <p className="mt-1 max-w-xs text-muted">{message}</p>
      {showAdd && (
        <button
          type="button"
          onClick={focusQuickAdd}
          className="btn-brand mt-5 inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-bold"
        >
          <Plus size={18} aria-hidden="true" />
          Add a task
        </button>
      )}
    </div>
  )
}
