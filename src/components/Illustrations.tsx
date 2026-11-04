import { useId } from 'react'

/** Shared confetti palette: reds, corals and ambers only. */
const CONFETTI = ['#d4143a', '#ff5c47', '#ff9a1f', '#f2b01e', '#b8431a']

export function Logo({ size = 36, className }: { size?: number; className?: string }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}t`} x1="40" y1="0" x2="470" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c70f38" />
          <stop offset="0.52" stopColor="#ff5c47" />
          <stop offset="1" stopColor="#ffa21f" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="118" fill={`url(#${id}t)`} />
      <path d="M84 404 C170 462 300 452 398 372" fill="none" stroke="#fff" strokeOpacity=".38" strokeWidth="20" strokeLinecap="round" />
      <path d="M330 192 C340 180 346 176 346 172 C376 130 418 84 458 98 C496 112 486 178 440 176 C402 174 398 122 436 110" fill="none" stroke="#fff6e8" strokeWidth="20" strokeLinecap="round" />
      <path d="M110 272 L196 358 L346 172" fill="none" stroke="#fff6e8" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M130 118 L141 146 L169 157 L141 168 L130 196 L119 168 L91 157 L119 146 Z" fill="#fff4d6" />
    </svg>
  )
}

/** Clipboard with a flowing ribbon and confetti, shown when a list has no tasks. */
export function EmptyIllustration({ className }: { className?: string }) {
  const id = useId()
  const g = `${id}g`
  return (
    <svg viewBox="0 0 260 220" className={className} role="img" aria-label="An empty clipboard with a ribbon and confetti">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d4143a" />
          <stop offset=".55" stopColor="#ff5c47" />
          <stop offset="1" stopColor="#ff9a1f" />
        </linearGradient>
      </defs>
      <ellipse cx="130" cy="204" rx="78" ry="9" fill="#b8431a" opacity=".12" />
      {/* ribbon behind board */}
      <path d="M26 150 C60 120 70 190 112 168 C150 148 150 96 196 108 C226 116 232 150 248 138" fill="none" stroke={`url(#${g})`} strokeWidth="9" strokeLinecap="round" opacity=".9" />
      {/* board */}
      <g transform="rotate(-4 130 110)">
        <rect x="64" y="34" width="132" height="158" rx="18" fill="var(--solid)" stroke="var(--line)" strokeWidth="2" />
        <rect x="64" y="34" width="132" height="158" rx="18" fill="none" stroke={`url(#${g})`} strokeWidth="3" opacity=".55" />
        <rect x="104" y="22" width="52" height="26" rx="10" fill={`url(#${g})`} />
        <circle cx="130" cy="30" r="4" fill="#fff6e8" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(0 ${i * 36})`}>
            <rect x="84" y="68" width="22" height="22" rx="7" fill={i === 0 ? `url(#${g})` : 'none'} stroke={i === 0 ? 'none' : 'var(--muted)'} strokeOpacity=".5" strokeWidth="2" />
            {i === 0 && <path d="M89 79 l5 5 l8 -10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
            <rect x="116" y="73" width={i === 0 ? 56 : 66 - i * 10} height="8" rx="4" fill="var(--muted)" opacity={i === 0 ? 0.35 : 0.25} />
            <rect x="116" y="85" width={34 - i * 4} height="6" rx="3" fill="var(--muted)" opacity=".15" />
          </g>
        ))}
      </g>
      {/* ribbon in front */}
      <path d="M196 156 C216 150 222 176 204 184 C186 192 176 170 192 164" fill="none" stroke="#ff9a1f" strokeWidth="6" strokeLinecap="round" />
      {/* spark */}
      <path d="M42 56 l5 14 l14 5 l-14 5 l-5 14 l-5 -14 l-14 -5 l14 -5 z" fill="#ff9a1f" />
      {/* confetti */}
      {[
        [212, 44, 10, 0], [236, 78, 8, 1], [30, 104, 8, 2], [58, 20, 7, 3], [226, 20, 6, 4],
        [20, 176, 7, 1], [242, 186, 7, 2], [92, 8, 6, 0],
      ].map(([x, y, s, c], i) => (
        <rect key={i} x={x} y={y} width={s} height={s * 0.55} rx="2" fill={CONFETTI[c]} transform={`rotate(${i * 37} ${x} ${y})`} />
      ))}
      {[[188, 12], [14, 140], [248, 110], [74, 196]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill={CONFETTI[(i + 2) % 5]} />
      ))}
    </svg>
  )
}

/** Larger hero artwork for the first-run welcome card. */
export function HeroIllustration({ className }: { className?: string }) {
  const id = useId()
  const g = `${id}g`
  const rows = [
    { w: 118, done: true, tag: '#d4143a' },
    { w: 96, done: true, tag: '#ff8a1f' },
    { w: 130, done: false, tag: '#f2b01e' },
  ]
  return (
    <svg viewBox="0 0 340 240" className={className} role="img" aria-label="Task cards with a check mark, ribbon and confetti">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d4143a" />
          <stop offset=".55" stopColor="#ff5c47" />
          <stop offset="1" stopColor="#ff9a1f" />
        </linearGradient>
        <filter id={`${id}s`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#a8321a" floodOpacity=".22" />
        </filter>
      </defs>
      <path d="M12 190 C60 120 100 230 160 190 C220 150 232 70 300 96 C326 106 330 140 322 160" fill="none" stroke={`url(#${g})`} strokeWidth="10" strokeLinecap="round" opacity=".9" />
      <g filter={`url(#${id}s)`}>
        <g transform="rotate(5 220 150)">
          <rect x="150" y="96" width="158" height="92" rx="18" fill="var(--solid)" stroke="var(--line)" />
          <rect x="168" y="118" width="22" height="22" rx="7" fill="none" stroke="var(--muted)" strokeOpacity=".5" strokeWidth="2" />
          <rect x="200" y="122" width="76" height="8" rx="4" fill="var(--muted)" opacity=".3" />
          <rect x="200" y="136" width="44" height="6" rx="3" fill="var(--muted)" opacity=".16" />
          <rect x="168" y="154" width="64" height="18" rx="9" fill="#ff9a1f" opacity=".2" />
        </g>
        <g transform="rotate(-3 130 100)">
          <rect x="40" y="44" width="200" height="132" rx="22" fill="var(--solid)" stroke="var(--line)" />
          {rows.map((r, i) => (
            <g key={i} transform={`translate(0 ${i * 36})`}>
              <rect x="62" y="64" width="24" height="24" rx="8" fill={r.done ? `url(#${g})` : 'none'} stroke={r.done ? 'none' : 'var(--muted)'} strokeOpacity=".5" strokeWidth="2" />
              {r.done && <path d="M68 76 l6 6 l9 -12" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />}
              <rect x="98" y="68" width={r.w} height="9" rx="4.5" fill="var(--fg)" opacity={r.done ? 0.28 : 0.7} />
              <rect x="98" y="82" width="38" height="7" rx="3.5" fill={r.tag} opacity=".55" />
            </g>
          ))}
        </g>
      </g>
      <path d="M262 28 l7 19 l19 7 l-19 7 l-7 19 l-7 -19 l-19 -7 l19 -7 z" fill="#ff9a1f" />
      {[
        [30, 30, 12, 0], [86, 14, 9, 2], [300, 190, 11, 1], [316, 40, 8, 3], [18, 120, 9, 4], [190, 18, 8, 1], [248, 214, 9, 0], [60, 214, 8, 2],
      ].map(([x, y, s, c], i) => (
        <rect key={i} x={x} y={y} width={s} height={s * 0.55} rx="2.5" fill={CONFETTI[c]} transform={`rotate(${i * 41} ${x} ${y})`} />
      ))}
      {[[130, 8], [322, 110], [8, 70], [160, 226]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill={CONFETTI[(i + 1) % 5]} />
      ))}
    </svg>
  )
}
