import { useEffect, useRef, useState, type ReactNode } from 'react'

const SHOW_MS = 2800

interface Props {
  className?: string
  children: ReactNode
  message?: string
  /** Which edge of the button the bubble lines up with, so it stays on screen. */
  align?: 'start' | 'center' | 'end'
}

/**
 * Stand-in for a link to something not released yet: looks like the real button with a lock
 * badge, and clicking it pops a short "coming soon" bubble. The bubble is a live region, so
 * screen readers announce the message too.
 */
export default function ComingSoonButton({
  className,
  children,
  message = 'The text-only résumé will be available soon!',
  align = 'center',
}: Props) {
  const [open, setOpen] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const show = () => {
    setOpen(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(false), SHOW_MS)
  }

  return (
    <span className={`coming-soon coming-soon-${align}`}>
      <button type="button" className={`${className ?? ''} is-locked`} aria-disabled="true" onClick={show}>
        {children}
        <span className="lock-badge" aria-hidden="true">
          🔒
        </span>
        <span className="visually-hidden"> (coming soon)</span>
      </button>
      {/* Always rendered (empty when closed) so the announcement isn't missed. */}
      <span className="coming-soon-bubble" role="status">
        {open ? message : ''}
      </span>
    </span>
  )
}
