import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useAppStore } from '../store/useAppStore'
import { boatState, boatTeleport } from '../world/boat/boatState'
import { cameraState } from '../world/boat/cameraState'
import { dockLayout } from '../world/islands/dockLayout'
import { ISLANDS, ISLETS, WORLD_RADIUS, islandById, type IslandId } from '../world/layout'
import { islandInfo } from './islandInfo'

/** Half-size of the chart in world units: the whole sailable area plus a little margin. */
const VIEW = WORLD_RADIUS + 10
const FADE_MS = 280
const DEG = 180 / Math.PI

/** Where quick travel drops the boat: in the island's docking ring, facing the pier (like the start). */
function quickTravelTarget(id: IslandId) {
  const dock = dockLayout(islandById(id))
  const p = dock.toWorld(0, 0, dock.ringCenter + 3)
  return { x: p.x, z: p.z, yaw: dock.yaw + Math.PI }
}

/**
 * Round "sea chart" in the bottom-right corner. It turns with the camera so "up" on the map is
 * "up" on screen, and the boat arrow follows the boat every frame without React re-renders
 * (a requestAnimationFrame loop writes the SVG/CSS directly). Clicking an island quick-travels there.
 *
 * Maths: the camera looks along (-sin a, -cos a) on the XZ plane, so a world point (x, z) lands at
 * screen (x cos a - z sin a, x sin a + z cos a), which is exactly SVG's rotate(a) with y = z.
 */
export default function Minimap() {
  const activeSection = useAppStore((s) => s.activeSection)
  const reducedMotion = useReducedMotion()
  // Start folded away on very small screens, where the chart would crowd the joystick.
  const [open, setOpen] = useState(() => !window.matchMedia('(max-width: 480px)').matches)
  const [fading, setFading] = useState(false)
  const chart = useRef<SVGGElement>(null)
  const boat = useRef<SVGGElement>(null)
  const pins = useRef<(HTMLButtonElement | null)[]>([])
  const timers = useRef<number[]>([])
  const bodyId = useId()

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  // Layout effect so the pins are placed before the first paint (no flash at the top-left corner).
  useLayoutEffect(() => {
    if (!open || activeSection) return
    let frame = 0
    let lastAzimuth = NaN

    const tick = () => {
      const a = cameraState.azimuth
      if (a !== lastAzimuth) {
        lastAzimuth = a
        chart.current?.setAttribute('transform', `rotate(${a * DEG})`)
        // The pins are HTML buttons (so they're focusable), placed at the rotated positions.
        const c = Math.cos(a)
        const s = Math.sin(a)
        ISLANDS.forEach((island, i) => {
          const pin = pins.current[i]
          if (!pin) return
          pin.style.left = `${50 + ((island.x * c - island.z * s) / VIEW) * 50}%`
          pin.style.top = `${50 + ((island.x * s + island.z * c) / VIEW) * 50}%`
        })
      }
      // The arrow is drawn pointing up (-y); rotate(π - yaw) turns it to the heading (sin yaw, cos yaw).
      const p = boatState.position
      boat.current?.setAttribute('transform', `translate(${p.x} ${p.z}) rotate(${(Math.PI - boatState.yaw) * DEG})`)
      frame = requestAnimationFrame(tick)
    }

    tick()
    return () => cancelAnimationFrame(frame)
  }, [open, activeSection])

  const travel = (id: IslandId) => {
    if (fading) return
    const jump = () => {
      boatTeleport.pending = quickTravelTarget(id)
    }
    if (reducedMotion) {
      jump()
      return
    }
    // Fade to the sea colour, jump while hidden, then fade back.
    setFading(true)
    timers.current.push(
      window.setTimeout(() => {
        jump()
        timers.current.push(window.setTimeout(() => setFading(false), 180))
      }, FADE_MS),
    )
  }

  // Hidden while the details modal is open.
  if (activeSection) return null

  return (
    <>
      <nav className={`minimap ${open ? 'is-open' : ''}`} aria-label="Quick travel map">
        <button
          type="button"
          className="btn btn-small minimap-toggle"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="btn-icon" aria-hidden="true">
            🧭
          </span>
          <span className="btn-label">{open ? 'Hide map' : 'Map'}</span>
        </button>

        {open && (
          <div id={bodyId} className="minimap-body">
            <svg className="minimap-chart" viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`} aria-hidden="true">
              <circle r={VIEW} className="minimap-sea" />
              <g ref={chart}>
                <circle r={WORLD_RADIUS} className="minimap-edge" />
                {ISLETS.map((islet) => (
                  <circle key={`${islet.x},${islet.z}`} cx={islet.x} cy={islet.z} r={islet.radius} className="minimap-islet" />
                ))}
                {ISLANDS.map((island) => (
                  <circle key={island.id} cx={island.x} cy={island.z} r={island.radius} className="minimap-island" />
                ))}
                <g ref={boat}>
                  <path d="M0 -11 L8 9 L0 4 L-8 9 Z" className="minimap-boat" />
                </g>
              </g>
            </svg>

            <ul className="minimap-pins">
              {ISLANDS.map((island, i) => {
                const { title, icon } = islandInfo(island.id)
                return (
                  <li key={island.id}>
                    <button
                      ref={(el) => {
                        pins.current[i] = el
                      }}
                      type="button"
                      className="minimap-pin"
                      aria-label={`Travel to ${title}`}
                      data-label={title}
                      disabled={fading}
                      onClick={() => travel(island.id)}
                    >
                      <span aria-hidden="true">{icon}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </nav>
      <div className={`travel-fade ${fading ? 'is-on' : ''}`} aria-hidden="true" />
    </>
  )
}
