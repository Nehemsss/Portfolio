import { useEffect } from 'react'
import { boatInput } from './boatState'

const FORWARD = new Set(['KeyW', 'ArrowUp'])
const BACKWARD = new Set(['KeyS', 'ArrowDown'])
const LEFT = new Set(['KeyA', 'ArrowLeft'])
const RIGHT = new Set(['KeyD', 'ArrowRight'])
const ALL = new Set([...FORWARD, ...BACKWARD, ...LEFT, ...RIGHT])

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/**
 * Maps WASD / arrow keys onto boatInput. Tracks held keys in a Set so opposite keys
 * cancel out cleanly and releasing one doesn't drop the other.
 *
 * @param enabled When false (e.g. a panel is open) input is zeroed and keys are ignored.
 */
export function useBoatControls(enabled = true) {
  useEffect(() => {
    const held = new Set<string>()

    const update = () => {
      const has = (keys: Set<string>) => [...keys].some((k) => held.has(k))
      boatInput.throttle = (has(FORWARD) ? 1 : 0) - (has(BACKWARD) ? 1 : 0)
      boatInput.steer = (has(LEFT) ? 1 : 0) - (has(RIGHT) ? 1 : 0)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (!enabled || !ALL.has(e.code) || isTypingTarget(e.target)) return
      e.preventDefault() // stop arrow keys from scrolling the page
      held.add(e.code)
      update()
    }
    const onKeyUp = (e: KeyboardEvent) => {
      held.delete(e.code)
      update()
    }
    // Releasing keys while the tab is unfocused never fires keyup, so clear everything on blur.
    const onBlur = () => {
      held.clear()
      update()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      boatInput.throttle = 0
      boatInput.steer = 0
    }
  }, [enabled])
}
