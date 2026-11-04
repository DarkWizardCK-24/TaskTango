import { useState } from 'react'
import { motion } from 'framer-motion'

const DOTS = ['#d4143a', '#ff5c47', '#ff9a1f', '#f2b01e', '#d4143a', '#ff5c47', '#ff9a1f', '#f2b01e']

interface Props {
  checked: boolean
  onChange: () => void
  label: string
  size?: number
}

/** Animated checkbox with a tiny confetti burst when a task is completed. */
export function TaskCheck({ checked, onChange, label, size = 28 }: Props) {
  const [burst, setBurst] = useState(0)

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        if (!checked) setBurst((b) => b + 1)
        onChange()
      }}
      className="relative grid shrink-0 place-items-center rounded-[10px] transition-transform active:scale-90"
      style={{ width: size, height: size }}
    >
      <span
        className={`absolute inset-0 rounded-[10px] border-2 transition-colors duration-200 ${
          checked ? 'border-transparent bg-brand' : 'border-[var(--muted)]/55 bg-solid hover:border-coral'
        }`}
        aria-hidden="true"
      />
      <svg viewBox="0 0 24 24" className="relative size-[62%]" aria-hidden="true">
        <motion.path
          d="M5 12.5 L10 17.5 L19 7"
          fill="none"
          stroke="#fff"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        />
      </svg>
      {burst > 0 && checked && (
        <span key={burst} className="pointer-events-none absolute inset-0" aria-hidden="true">
          {DOTS.map((c, i) => {
            const a = (i / DOTS.length) * Math.PI * 2
            return (
              <span
                key={i}
                className="burst-dot"
                style={{
                  background: c,
                  ['--dx' as string]: `${Math.cos(a) * 22}px`,
                  ['--dy' as string]: `${Math.sin(a) * 22}px`,
                }}
              />
            )
          })}
        </span>
      )}
    </button>
  )
}
