import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, Vector3 } from 'three'
import { useAppStore } from '../../store/useAppStore'
import { boatState, boatTeleport } from './boatState'
import { cameraState } from './cameraState'

// Bird's-eye framing. Tweak these to change the look.
const ELEVATION = MathUtils.degToRad(36) // fixed angle above the horizon; rotation never changes it
const START_AZIMUTH = 0 // 0 = camera sits south (+Z) of the boat looking north, matching the start heading
const START_DISTANCE = 75 // from the look-at point
const MIN_DISTANCE = 40 // closest zoom
const MAX_DISTANCE = 140 // furthest zoom
const DOCKED_DISTANCE = 55 // gentle zoom-in while an island's details modal is open
const SPEED_ZOOM = 10 // extra distance at full speed
const LOOK_AHEAD = 10 // shift the view toward where the boat is heading, at full speed
const ROTATE_SPEED = 0.006 // radians per pixel of right-drag
const TOUCH_ROTATE_SPEED = 0.008 // radians per pixel of two-finger horizontal drag
const WHEEL_ZOOM_SPEED = 0.0012 // exponential, so each notch feels the same near and far
const KEY_ZOOM_STEP = 1.15
const KEY_ROTATE_STEP = 0.2 // radians per [ / ] press (holding the key repeats)
// The narrow field of view (diorama / near-isometric feel) is set on <Canvas camera> in World.tsx.

const clampDistance = (d: number) => MathUtils.clamp(d, MIN_DISTANCE, MAX_DISTANCE)

/**
 * Fixed-elevation bird's-eye camera.
 * - Follows the boat's position (plus a little look-ahead); never rotates with the boat.
 * - Mouse wheel / +,- keys zoom between MIN and MAX_DISTANCE.
 * - Holding the right mouse button and dragging (or the [ and ] keys) orbits horizontally only
 *   (elevation stays fixed).
 * - Touch: two-finger pinch zooms, two-finger horizontal drag orbits (one finger does nothing;
 *   the canvas has touch-action: none so the page never scrolls or zooms instead).
 * Both zoom and rotation ease toward their targets for smooth motion.
 */
export default function CameraRig() {
  const gl = useThree((s) => s.gl)
  const focus = useRef<Vector3 | null>(null)
  const target = useRef(new Vector3())
  const zoom = useRef(START_DISTANCE)
  const zoomTarget = useRef(START_DISTANCE)
  const azimuth = useRef(START_AZIMUTH)
  const azimuthTarget = useRef(START_AZIMUTH)
  const lastTeleport = useRef(boatTeleport.count)

  useEffect(() => {
    const el = gl.domElement
    let rotating = false

    // Active touch points; with exactly two down, `pinch` holds the last measured spread and midpoint.
    const touches = new Map<number, { x: number; y: number }>()
    let pinch: { dist: number; midX: number } | null = null
    const measurePinch = () => {
      const [a, b] = [...touches.values()]
      return { dist: Math.hypot(a.x - b.x, a.y - b.y), midX: (a.x + b.x) / 2 }
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
        pinch = touches.size === 2 ? measurePinch() : null
        return
      }
      if (e.button !== 2) return
      rotating = true
      el.setPointerCapture(e.pointerId) // keep receiving moves even if the cursor leaves the canvas
    }
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        if (!touches.has(e.pointerId)) return
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
        if (!pinch || touches.size !== 2) return
        const now = measurePinch()
        // Fingers spreading apart = zoom in (shorter distance), like pinch-zoom on a photo.
        if (now.dist > 0) zoomTarget.current = clampDistance((zoomTarget.current * pinch.dist) / now.dist)
        azimuthTarget.current -= (now.midX - pinch.midX) * TOUCH_ROTATE_SPEED
        pinch = now
        return
      }
      if (rotating) azimuthTarget.current -= e.movementX * ROTATE_SPEED
    }
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        touches.delete(e.pointerId)
        pinch = touches.size === 2 ? measurePinch() : null
        return
      }
      if (e.button !== 2) return
      rotating = false
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    }
    // Right-click is for rotating, so suppress the browser's context menu on the canvas.
    const onContextMenu = (e: MouseEvent) => e.preventDefault()
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoomTarget.current = clampDistance(zoomTarget.current * Math.exp(e.deltaY * WHEEL_ZOOM_SPEED))
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (e.key === '+' || e.key === '=') zoomTarget.current = clampDistance(zoomTarget.current / KEY_ZOOM_STEP)
      if (e.key === '-' || e.key === '_') zoomTarget.current = clampDistance(zoomTarget.current * KEY_ZOOM_STEP)
      // Keyboard equivalent of right-drag rotation (Q/E are taken: E docks).
      if (e.key === '[') azimuthTarget.current += KEY_ROTATE_STEP
      if (e.key === ']') azimuthTarget.current -= KEY_ROTATE_STEP
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
    el.addEventListener('contextmenu', onContextMenu)
    el.addEventListener('wheel', onWheel, { passive: false }) // passive:false so preventDefault stops page scroll
    window.addEventListener('keydown', onKeyDown)
    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
      el.removeEventListener('contextmenu', onContextMenu)
      el.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [gl])

  useFrame(({ camera }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const p = boatState.position
    const speed01 = MathUtils.clamp(Math.abs(boatState.speed) / 16, 0, 1)
    const ahead = Math.sign(boatState.speed) * speed01 * LOOK_AHEAD
    target.current.set(p.x + Math.sin(boatState.yaw) * ahead, 0, p.z + Math.cos(boatState.yaw) * ahead)

    // After a minimap quick travel, snap like on the first frame (the screen is faded out anyway).
    if (boatTeleport.count !== lastTeleport.current) {
      lastTeleport.current = boatTeleport.count
      focus.current = null
    }

    if (!focus.current) {
      // First frame: snap into place instead of flying in from the origin.
      focus.current = target.current.clone()
    } else {
      focus.current.lerp(target.current, 1 - Math.exp(-4 * dt))
    }
    // While an island's details modal is open, ease in a little closer (never further out).
    // Read via getState() so this per-frame check doesn't re-render the component.
    const docked = useAppStore.getState().activeSection !== null
    const wanted = docked ? Math.min(zoomTarget.current, DOCKED_DISTANCE) : zoomTarget.current
    zoom.current = MathUtils.lerp(zoom.current, wanted + speed01 * SPEED_ZOOM, 1 - Math.exp(-(docked ? 2.5 : 6) * dt))
    azimuth.current = MathUtils.lerp(azimuth.current, azimuthTarget.current, 1 - Math.exp(-12 * dt))
    cameraState.azimuth = azimuth.current

    // Spherical offset from the focus point: azimuth changes, elevation is fixed.
    const horizontal = Math.cos(ELEVATION) * zoom.current
    camera.position.set(
      focus.current.x + Math.sin(azimuth.current) * horizontal,
      Math.sin(ELEVATION) * zoom.current,
      focus.current.z + Math.cos(azimuth.current) * horizontal,
    )
    camera.lookAt(focus.current)
  })

  return null
}
