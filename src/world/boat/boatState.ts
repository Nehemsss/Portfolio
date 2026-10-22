import { Vector3 } from 'three'
import { BOAT_START } from '../layout'

/**
 * Mutable, non-React state shared between the boat, camera, minimap and mobile joystick.
 * Updated every frame, so it lives outside Zustand to avoid triggering React re-renders at 60fps.
 */

/** Name given to the boat's RigidBody so dock trigger zones can recognise it. */
export const BOAT_BODY_NAME = 'boat'

/** Steering input in the range -1..1. Written by the keyboard hook and the mobile joystick. */
export const boatInput = {
  /** +1 forward, -1 reverse. */
  throttle: 0,
  /** +1 turns left, -1 turns right. */
  steer: 0,
}

/** Latest boat pose, written by the Boat component each frame. */
export const boatState = {
  position: new Vector3(BOAT_START.x, 0, BOAT_START.z),
  /** Heading in radians; forward is (sin yaw, 0, cos yaw). */
  yaw: BOAT_START.yaw,
  /** Signed forward speed in units per second. */
  speed: 0,
}

/** Quick-travel request from the minimap. Boat applies it on its next frame. */
export const boatTeleport = {
  pending: null as { x: number; z: number; yaw: number } | null,
  /** Bumped after each teleport so the camera can snap there instead of gliding across the map. */
  count: 0,
}
