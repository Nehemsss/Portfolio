import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { MathUtils, type Group } from 'three'
import { BOAT_START, WORLD_RADIUS } from '../layout'
import { waveHeight } from '../ocean/waves'
import { useAppStore } from '../../store/useAppStore'
import BoatModel from './BoatModel'
import { BOAT_BODY_NAME, boatInput, boatState, boatTeleport } from './boatState'
import { useBoatControls } from './useBoatControls'

// Tuning (units per second / radians per second)
const MAX_SPEED = 16
const MAX_REVERSE = 5
const ACCELERATION = 9
const BRAKING = 16 // when throttling against the current direction
const WATER_DRAG = 0.25 // exponential decay rate while throttling
const COAST_DRAG = 0.7 // exponential decay rate with no throttle
const LATERAL_DRAG = 4 // how quickly sideways drift dies out (higher = grippier)
const TURN_RATE = 1.5
const FROZEN_DRAG = 4 // fast stop while a details modal is open
const BODY_Y = 0.35
/** Visual + collider scale, so the boat stays readable from the high bird's-eye camera. */
const BOAT_SCALE = 1.4

/** Frame-rate–independent damping factor for "move x% of the way per second" smoothing. */
const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt)

/**
 * Arcade boat. The physics body only moves on the XZ plane and only rotates around Y
 * (locked axes), so it can't capsize. We steer by setting velocities directly each frame,
 * derived from the *actual* velocity so collisions with islands still slow the boat down.
 * Bobbing and rocking are purely visual, applied to a child group.
 */
export default function Boat() {
  const body = useRef<RapierRigidBody>(null)
  const visual = useRef<Group>(null)
  // While an island's details modal is open the boat is frozen: input is ignored and it
  // glides to a quick stop (instead of drifting away from the dock).
  const frozen = useAppStore((s) => s.activeSection !== null)
  useBoatControls(!frozen)

  useFrame((state, rawDt) => {
    const rb = body.current
    const vis = visual.current
    if (!rb || !vis) return
    const dt = Math.min(rawDt, 1 / 20) // avoid huge jumps after a tab switch

    // Minimap quick travel: jump straight to the requested pose, at rest. The dock's sensor
    // then fires as usual and shows the Dock prompt.
    const jump = boatTeleport.pending
    if (jump) {
      boatTeleport.pending = null
      rb.setTranslation({ x: jump.x, y: BODY_Y, z: jump.z }, true)
      rb.setRotation({ x: 0, y: Math.sin(jump.yaw / 2), z: 0, w: Math.cos(jump.yaw / 2) }, true)
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true)
      boatTeleport.count += 1
    }

    // Yaw from the quaternion: valid because X/Z rotations are locked, so q = (0, sin(y/2), 0, cos(y/2)).
    const q = rb.rotation()
    const yaw = 2 * Math.atan2(q.y, q.w)
    const fx = Math.sin(yaw)
    const fz = Math.cos(yaw)

    // Split current velocity into forward and sideways parts.
    const v = rb.linvel()
    let forward = v.x * fx + v.z * fz
    let latX = v.x - fx * forward
    let latZ = v.z - fz * forward

    const { throttle, steer } = boatInput
    if (throttle !== 0) {
      const opposing = Math.sign(throttle) !== Math.sign(forward) && Math.abs(forward) > 0.1
      forward += throttle * (opposing ? BRAKING : ACCELERATION) * dt
    }
    forward *= Math.exp(-(frozen ? FROZEN_DRAG : throttle === 0 ? COAST_DRAG : WATER_DRAG) * dt)
    forward = MathUtils.clamp(forward, -MAX_REVERSE, MAX_SPEED)
    const lateralDecay = Math.exp(-(frozen ? FROZEN_DRAG : LATERAL_DRAG) * dt)
    latX *= lateralDecay
    latZ *= lateralDecay

    let vx = fx * forward + latX
    let vz = fz * forward + latZ

    // Soft world boundary: push back proportionally to how far past the edge the boat is.
    const p = rb.translation()
    const dist = Math.hypot(p.x, p.z)
    if (dist > WORLD_RADIUS) {
      const push = (dist - WORLD_RADIUS) * 2
      vx -= (p.x / dist) * push
      vz -= (p.z / dist) * push
    }
    rb.setLinvel({ x: vx, y: 0, z: vz }, true)

    // Steering needs some speed (like a real boat), but allow a slow pivot when nearly stopped.
    // Reversing flips the steering direction, as with a car.
    const speedFactor = MathUtils.clamp(forward / 5, -1, 1)
    const turnScale = (speedFactor < 0 ? -1 : 1) * Math.max(Math.abs(speedFactor), 0.35)
    rb.setAngvel({ x: 0, y: steer * TURN_RATE * turnScale, z: 0 }, true)

    boatState.position.set(p.x, 0, p.z)
    boatState.yaw = yaw
    boatState.speed = forward

    // --- Visual bobbing: sample the same wave function as the water shader ---
    const t = state.clock.elapsedTime
    const h = waveHeight(p.x, p.z, t)
    const hAhead = waveHeight(p.x + fx * 1.5, p.z + fz * 1.5, t)
    const hLeft = waveHeight(p.x + fz * 1.0, p.z - fx * 1.0, t) // local +X is the boat's left side
    const k = damp(8, dt)

    vis.position.y = MathUtils.lerp(vis.position.y, h * 0.9, k)
    // Positive X rotation dips the bow, so a wave ahead (or acceleration) lifts it with a negative angle.
    const pitch = -Math.atan((hAhead - h) / 1.5) - (throttle > 0 ? 0.04 * Math.abs(speedFactor) : 0)
    // Lean into turns, plus roll from the wave slope across the hull.
    const roll = Math.atan(hLeft - h) * 0.8 - steer * 0.12 * Math.abs(speedFactor)
    vis.rotation.x = MathUtils.lerp(vis.rotation.x, pitch, k)
    vis.rotation.z = MathUtils.lerp(vis.rotation.z, roll, k)
  })

  return (
    <RigidBody
      ref={body}
      name={BOAT_BODY_NAME} // lets dock trigger zones recognise the boat
      colliders={false}
      position={[BOAT_START.x, BODY_Y, BOAT_START.z]}
      rotation={[0, BOAT_START.yaw, 0]}
      enabledTranslations={[true, false, true]}
      enabledRotations={[false, true, false]}
      gravityScale={0}
      canSleep={false}
      restitution={0.2}
      friction={0.1}
    >
      <CuboidCollider args={[0.9 * BOAT_SCALE, 0.6, 1.8 * BOAT_SCALE]} position={[0, 0, 0.15 * BOAT_SCALE]} />
      <group ref={visual}>
        <group scale={BOAT_SCALE}>
          <BoatModel />
        </group>
      </group>
    </RigidBody>
  )
}
