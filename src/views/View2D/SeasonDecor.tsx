import type { CSSProperties } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

/** Hand-picked spread so the bits don't line up: x = left %, d = start offset (s), t = duration (s), s = size (rem). */
const BITS = [
  { x: 3, d: 0, t: 16, s: 1.1 },
  { x: 12, d: 7, t: 21, s: 0.8 },
  { x: 21, d: 3, t: 18, s: 1.3 },
  { x: 30, d: 11, t: 24, s: 0.9 },
  { x: 39, d: 5, t: 17, s: 1 },
  { x: 48, d: 14, t: 22, s: 1.2 },
  { x: 57, d: 2, t: 19, s: 0.85 },
  { x: 66, d: 9, t: 25, s: 1.1 },
  { x: 75, d: 6, t: 16, s: 0.95 },
  { x: 84, d: 12, t: 20, s: 1.25 },
  { x: 92, d: 4, t: 23, s: 0.9 },
  { x: 97, d: 15, t: 18, s: 1 },
]

/**
 * Drifting seasonal bits behind the 2D page: snowflakes in winter, hearts for Valentine's, bats
 * for Halloween, nothing in summer. What each bit looks like is pure CSS keyed off
 * <html data-season>. Purely decorative, and skipped entirely when motion is reduced.
 */
export default function SeasonDecor() {
  const reducedMotion = useReducedMotion()
  if (reducedMotion) return null

  return (
    <div className="decor" aria-hidden="true">
      {BITS.map((b, i) => (
        <span
          key={i}
          className="decor-bit"
          style={{ '--x': b.x, '--d': b.d, '--t': b.t, '--s': b.s } as CSSProperties}
        />
      ))}
    </div>
  )
}
