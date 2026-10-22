import { useEffect, useRef, type PointerEvent } from 'react'
import { boatInput } from '../world/boat/boatState'

/** How far the knob can travel from the centre, as a fraction of the stick's width (it's smaller on
 *  phones); full deflection = full throttle/steer. */
const TRAVEL = 1 / 3
/** Ignore tiny thumb wobble near the centre (fraction of the travel). */
const DEAD_ZONE = 0.18

/** Rescales past the dead zone so output still reaches 0..1 smoothly. */
const applyDeadZone = (v: number) =>
  Math.abs(v) < DEAD_ZONE ? 0 : (v - Math.sign(v) * DEAD_ZONE) / (1 - DEAD_ZONE)

/**
 * On-screen thumb stick for touch devices (bottom-left). Writes boatInput like the keyboard does:
 * up = forward, down = reverse, left/right = turn. Pointer capture keeps tracking the thumb even if
 * it slides off the stick; releasing recentres it and stops the input. The knob moves via a ref, so
 * dragging never re-renders React.
 */
export default function Joystick() {
  const base = useRef<HTMLDivElement>(null)
  const knob = useRef<HTMLDivElement>(null)
  const pointerId = useRef<number | null>(null)

  const release = () => {
    pointerId.current = null
    if (knob.current) knob.current.style.transform = ''
    boatInput.throttle = 0
    boatInput.steer = 0
  }

  // Unmounting (e.g. a details modal opens) must not leave the boat sailing on its own.
  useEffect(
    () => () => {
      boatInput.throttle = 0
      boatInput.steer = 0
    },
    [],
  )

  const track = (e: PointerEvent<HTMLDivElement>) => {
    const rect = base.current?.getBoundingClientRect()
    if (!rect) return
    const radius = rect.width * TRAVEL
    let dx = e.clientX - (rect.left + rect.width / 2)
    let dy = e.clientY - (rect.top + rect.height / 2)
    const length = Math.hypot(dx, dy)
    if (length > radius) {
      dx *= radius / length
      dy *= radius / length
    }
    if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`
    boatInput.throttle = applyDeadZone(-dy / radius)
    boatInput.steer = applyDeadZone(-dx / radius) // +1 = turn left
  }

  return (
    // Touch-only control; keyboard users have WASD, so it's hidden from assistive tech.
    <div
      ref={base}
      className="joystick"
      aria-hidden="true"
      onPointerDown={(e) => {
        if (pointerId.current !== null) return
        pointerId.current = e.pointerId
        e.currentTarget.setPointerCapture(e.pointerId)
        track(e)
      }}
      onPointerMove={(e) => {
        if (e.pointerId === pointerId.current) track(e)
      }}
      onPointerUp={(e) => {
        if (e.pointerId === pointerId.current) release()
      }}
      onPointerCancel={(e) => {
        if (e.pointerId === pointerId.current) release()
      }}
    >
      <div ref={knob} className="joystick-knob" />
    </div>
  )
}
