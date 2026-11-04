import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { X } from 'lucide-react'
import { useIsDesktop } from '../lib/hooks'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  /** Desktop presentation: centered modal or right-hand drawer. Phones always get a bottom sheet. */
  variant?: 'modal' | 'drawer'
  children: ReactNode
  footer?: ReactNode
  width?: string
}

const stack: symbol[] = []

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function Sheet({ open, onClose, title, description, variant = 'modal', children, footer, width }: SheetProps) {
  const desktop = useIsDesktop()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  const titleId = useId()
  const descId = useId()
  const controls = useDragControls()

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const token = Symbol('sheet')
    stack.push(token)
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== token) return
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        closeRef.current()
        return
      }
      if (e.key === 'Tab' && panelRef.current) {
        const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null,
        )
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey, true)

    const t = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panelRef.current
      target?.focus({ preventScroll: true })
    }, 60)

    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey, true)
      const i = stack.indexOf(token)
      if (i >= 0) stack.splice(i, 1)
      document.body.style.overflow = overflow
      previous?.focus?.({ preventScroll: true })
    }
  }, [open])

  const drawer = desktop && variant === 'drawer'
  const centered = desktop && variant === 'modal'

  const panelAnim = drawer
    ? { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } }
    : centered
      ? { initial: { opacity: 0, scale: 0.96, y: 12 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.97, y: 8 } }
      : { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }

  const panelClass = drawer
    ? 'absolute right-0 top-0 h-full w-[min(100vw,480px)] rounded-l-[28px]'
    : centered
      ? 'relative m-auto max-h-[88dvh] w-[min(92vw,var(--sheet-w,520px))] rounded-[28px]'
      : 'absolute inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[28px]'

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex" style={{ ['--sheet-w' as string]: width }}>
          <motion.div
            className="absolute inset-0 bg-[rgba(43,20,10,0.52)] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => closeRef.current()}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            className={`${panelClass} flex flex-col overflow-hidden border border-line bg-solid shadow-pop outline-none`}
            {...panelAnim}
            transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.9 }}
            drag={!desktop ? 'y' : false}
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) closeRef.current()
            }}
          >
            {!desktop && (
              <div
                className="flex shrink-0 cursor-grab touch-none justify-center pb-1 pt-2.5"
                onPointerDown={(e) => controls.start(e)}
                aria-hidden="true"
              >
                <span className="h-1.5 w-11 rounded-full bg-track" />
              </div>
            )}
            <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-2 pt-3 lg:pt-5">
              <div className="min-w-0">
                <h2 id={titleId} className="font-display text-xl font-extrabold">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-0.5 text-sm text-muted">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => closeRef.current()}
                aria-label="Close"
                className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-track hover:text-fg"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-1">{children}</div>
            {footer && <div className="pb-safe shrink-0 border-t border-line bg-solid px-5 py-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
