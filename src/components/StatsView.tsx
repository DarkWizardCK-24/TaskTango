import { useId } from 'react'
import { motion } from 'framer-motion'
import { CalendarCheck, CheckCheck, Flame, Target } from 'lucide-react'
import { overallProgress, streak, todayProgress, weekCounts, type DayCount } from '../lib/stats'
import { useStore } from '../lib/store'
import { ProgressRing } from './ProgressRing'

export function WeekChart({ days }: { days: DayCount[] }) {
  const id = useId()
  const max = Math.max(3, ...days.map((d) => d.count))
  const W = 320
  const H = 150
  const top = 22
  const base = 124
  const bw = 28
  const gap = (W - bw * 7) / 8
  const summary = days.map((d) => `${d.label} ${d.count}`).join(', ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Tasks completed per day this week: ${summary}`}>
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9a1f" />
          <stop offset="0.5" stopColor="#ff5c47" />
          <stop offset="1" stopColor="#d4143a" />
        </linearGradient>
        <linearGradient id={`${id}o`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb347" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ff8a3d" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <line x1="0" x2={W} y1={base + 0.5} y2={base + 0.5} stroke="var(--line)" />
      {days.map((d, i) => {
        const x = gap + i * (bw + gap)
        const h = d.count === 0 ? 4 : Math.max(8, ((base - top) * d.count) / max)
        return (
          <g key={d.date}>
            <rect x={x} y={top} width={bw} height={base - top} rx="9" fill="var(--track)" opacity="0.5" />
            <motion.rect
              x={x}
              width={bw}
              rx="9"
              fill={d.count === 0 ? 'var(--track)' : d.isToday ? `url(#${id}t)` : `url(#${id}o)`}
              initial={{ y: base, height: 0 }}
              animate={{ y: base - h, height: h }}
              transition={{ type: 'spring', stiffness: 120, damping: 16, delay: i * 0.04 }}
            />
            {d.count > 0 && (
              <text x={x + bw / 2} y={base - h - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--fg)">
                {d.count}
              </text>
            )}
            <text
              x={x + bw / 2}
              y={H - 8}
              textAnchor="middle"
              fontSize="11"
              fontWeight={d.isToday ? 800 : 600}
              fill={d.isToday ? 'var(--fg)' : 'var(--muted)'}
            >
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="card flex items-center gap-3 rounded-2xl p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-white">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
        <p className="font-display text-2xl font-extrabold leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
    </div>
  )
}

export function StatsView() {
  const { tasks, lists, now } = useStore()
  const today = todayProgress(tasks, now)
  const overall = overallProgress(tasks)
  const days = weekCounts(tasks, now)
  const weekTotal = days.reduce((n, d) => n + d.count, 0)
  const st = streak(tasks, now)
  const best = days.reduce((a, b) => (b.count > a.count ? b : a), days[0])
  const open = tasks.filter((t) => !t.completed)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="card flex flex-col items-center gap-2 rounded-3xl p-5 text-center">
          <ProgressRing pct={today.pct} size={112} stroke={11} label="Today progress">
            <div>
              <div className="font-display text-2xl font-extrabold">{today.pct}%</div>
            </div>
          </ProgressRing>
          <p className="font-bold">Today</p>
          <p className="text-xs text-muted">
            {today.done} of {today.total} done
          </p>
        </div>
        <div className="card flex flex-col items-center gap-2 rounded-3xl p-5 text-center">
          <ProgressRing pct={overall.pct} size={112} stroke={11} label="Overall progress">
            <div>
              <div className="font-display text-2xl font-extrabold">{overall.pct}%</div>
            </div>
          </ProgressRing>
          <p className="font-bold">Overall</p>
          <p className="text-xs text-muted">
            {overall.done} of {overall.total} done
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat
          icon={<Flame size={22} aria-hidden="true" />}
          label="Streak"
          value={`${st} ${st === 1 ? 'day' : 'days'}`}
          sub={st > 0 ? 'Keep it going, finish one today.' : 'Complete a task to start a streak.'}
        />
        <Stat
          icon={<CheckCheck size={22} aria-hidden="true" />}
          label="This week"
          value={weekTotal}
          sub={weekTotal > 0 ? `Best day: ${best.label} (${best.count})` : 'Nothing completed yet'}
        />
      </div>

      <section className="card rounded-3xl p-5" aria-labelledby="wk">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="wk" className="flex items-center gap-2 font-display text-lg font-extrabold">
            <CalendarCheck size={18} className="text-coral" aria-hidden="true" />
            Completed this week
          </h2>
          <span className="rounded-full bg-track px-2.5 py-0.5 text-xs font-bold text-muted">{weekTotal} total</span>
        </div>
        <WeekChart days={days} />
      </section>

      <section className="card rounded-3xl p-5" aria-labelledby="bylist">
        <h2 id="bylist" className="mb-3 flex items-center gap-2 font-display text-lg font-extrabold">
          <Target size={18} className="text-coral" aria-hidden="true" />
          Open tasks by list
        </h2>
        <ul className="m-0 space-y-3 p-0">
          {lists.map((l) => {
            const n = open.filter((t) => t.listId === l.id).length
            return (
              <li key={l.id} className="list-none">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="size-2.5 rounded-full" style={{ background: l.color }} aria-hidden="true" />
                    {l.name}
                  </span>
                  <span className="text-muted">{n}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-track">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: l.color }}
                    initial={{ width: 0 }}
                    animate={{ width: open.length ? `${(n / open.length) * 100}%` : 0 }}
                    transition={{ type: 'spring', stiffness: 90, damping: 18 }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
