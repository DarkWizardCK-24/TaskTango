import { useId, type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Props {
  pct: number
  size?: number
  stroke?: number
  label: string
  children?: ReactNode
}

export function ProgressRing({ pct, size = 96, stroke = 10, label, children }: Props) {
  const id = useId()
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${clamped}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d4143a" />
            <stop offset="0.55" stopColor="#ff5c47" />
            <stop offset="1" stopColor="#ff9a1f" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped / 100) }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}
