import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody, type IntersectionEnterPayload } from '@react-three/rapier'
import { BoxGeometry, Color, CylinderGeometry, Matrix4, MeshBasicMaterial, type Mesh } from 'three'
import { envState } from '../environment/dayNight'
import { useAppStore } from '../../store/useAppStore'
import { GROUND_Y, type IslandLayout } from '../layout'
import InstancedProp from '../models/InstancedProp'
import { materials } from '../materials'
import { BOAT_BODY_NAME } from '../boat/boatState'
import { DECK_Y, PIER_LENGTH, PIER_WIDTH, RING_RADIUS, STAIR_WIDTH, dockLayout } from './dockLayout'

const RING_WIDTH = 0.7
const RING_COLOR = new Color('#ffd23f')
const PLANK_DEPTH = 0.5
const PLANK_GAP = 0.06
const STAIR_STEPS = 7
const POST_SPACING = 3

/**
 * A dock for one island, built in the island's local frame (local +Z points out toward the dock):
 * wooden stairs from the grass down the cliff, a plank pier on posts, lanterns at the tip,
 * a solid collider so the boat bumps the pier, and an invisible sensor zone that tells the
 * store the boat is close enough to dock ("Press E").
 */
export default function Dock({ island }: { island: IslandLayout }) {
  const setNearbyDock = useAppStore((s) => s.setNearbyDock)
  const marker = useRef<Mesh>(null)

  // Key distances along local +Z (shared with seasonal decorations via dockLayout).
  const { stairsStart, pierStart, pierEnd, pierMid, ringCenter, yaw } = dockLayout(island)
  // The docking zone spans from the stairs to beyond the ring.
  const zoneStart = pierStart - 2
  const zoneEnd = ringCenter + RING_RADIUS + 1.5

  const geometries = useMemo(
    () => ({
      plank: new BoxGeometry(PIER_WIDTH, 0.25, PLANK_DEPTH),
      step: new BoxGeometry(STAIR_WIDTH, 0.22, 1),
      post: new CylinderGeometry(0.18, 0.2, 1, 6),
    }),
    [],
  )
  // One material per dock so each marker ring can pulse and brighten independently.
  // toneMapped=false lets its colour exceed 1 at night, which the bloom pass turns into a glow.
  const markerMaterial = useMemo(
    () => new MeshBasicMaterial({ color: RING_COLOR, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false }),
    [],
  )
  useEffect(
    () => () => {
      Object.values(geometries).forEach((g) => g.dispose())
      markerMaterial.dispose()
    },
    [geometries, markerMaterial],
  )

  const { planks, steps, posts } = useMemo(() => {
    const plankM: Matrix4[] = []
    for (let z = pierStart + PLANK_DEPTH / 2; z < pierEnd; z += PLANK_DEPTH + PLANK_GAP) {
      plankM.push(new Matrix4().setPosition(0, DECK_Y - 0.125, z))
    }

    // Stairs: evenly spaced steps from grass level down to the deck.
    const stepM: Matrix4[] = []
    const run = (pierStart - stairsStart) / STAIR_STEPS
    for (let i = 0; i < STAIR_STEPS; i++) {
      const top = GROUND_Y - ((i + 1) * (GROUND_Y - DECK_Y)) / STAIR_STEPS
      const z = stairsStart + run * (i + 0.5)
      // Unit-depth step box stretched to the run length (slight overlap avoids gaps).
      stepM.push(new Matrix4().makeScale(1, 1, run + 0.06).setPosition(0, top - 0.11, z))
    }

    // Posts: pairs along both sides of the pier and under the lower stairs, sunk into the water.
    const postM: Matrix4[] = []
    const addPost = (x: number, z: number, top: number) => {
      const bottom = -2
      postM.push(new Matrix4().makeScale(1, top - bottom, 1).setPosition(x, (top + bottom) / 2, z))
    }
    for (let z = pierStart + 0.3; z <= pierEnd + 0.01; z += POST_SPACING) {
      addPost(-PIER_WIDTH / 2, z, DECK_Y + 0.35)
      addPost(PIER_WIDTH / 2, z, DECK_Y + 0.35)
    }
    addPost(-PIER_WIDTH / 2, pierEnd - 0.2, DECK_Y + 0.35)
    addPost(PIER_WIDTH / 2, pierEnd - 0.2, DECK_Y + 0.35)
    // Under the outer half of the stairs (the part hanging over the water)
    const outerStair = stairsStart + (pierStart - stairsStart) * 0.75
    addPost(-STAIR_WIDTH / 2, outerStair, DECK_Y + 0.6)
    addPost(STAIR_WIDTH / 2, outerStair, DECK_Y + 0.6)

    return { planks: plankM, steps: stepM, posts: postM }
  }, [pierStart, pierEnd, stairsStart])

  // Marker ring off the pier tip: gently pulses, and brightens when the boat is in range.
  useFrame((state) => {
    const m = marker.current
    if (!m) return
    const active = useAppStore.getState().nearbyDock === island.id
    const t = state.clock.elapsedTime
    m.scale.setScalar(1 + Math.sin(t * 2.5) * 0.06 + (active ? 0.12 : 0))
    const mat = m.material as MeshBasicMaterial
    mat.opacity = active ? 0.85 : 0.35 + Math.sin(t * 2.5) * 0.1
    // Brighter at night so docks are easy to find in the dark.
    mat.color.copy(RING_COLOR).multiplyScalar(1 + envState.night * 1.6)
  })

  const isBoat = (payload: IntersectionEnterPayload) => payload.other.rigidBodyObject?.name === BOAT_BODY_NAME

  return (
    <RigidBody type="fixed" colliders={false} position={[island.x, 0, island.z]} rotation={[0, yaw, 0]}>
      {/* Solid pier: the boat bumps into it rather than sailing through */}
      <CuboidCollider args={[PIER_WIDTH / 2, 1.5, PIER_LENGTH / 2]} position={[0, 0, pierMid]} />
      {/* Docking zone: covers the pier and the whole marker ring */}
      <CuboidCollider
        sensor
        args={[RING_RADIUS + 1.5, 2, (zoneEnd - zoneStart) / 2]}
        position={[0, 0, (zoneStart + zoneEnd) / 2]}
        onIntersectionEnter={(payload) => {
          if (isBoat(payload)) setNearbyDock(island.id)
        }}
        onIntersectionExit={(payload) => {
          // Only clear if we're still the registered dock (zones never overlap, but be safe).
          if (isBoat(payload) && useAppStore.getState().nearbyDock === island.id) setNearbyDock(null)
        }}
      />

      <InstancedProp geometry={geometries.plank} material={materials.wood} matrices={planks} />
      <InstancedProp geometry={geometries.step} material={materials.wood} matrices={steps} />
      <InstancedProp geometry={geometries.post} material={materials.darkWood} matrices={posts} />

      {/* Lantern posts at the pier tip; the shared lamp material glows at night (Phase 4) */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (PIER_WIDTH / 2 - 0.2), DECK_Y, pierEnd - 0.4]}>
          <mesh material={materials.darkWood} position-y={1.1}>
            <boxGeometry args={[0.16, 2.2, 0.16]} />
          </mesh>
          <mesh material={materials.lamp} position-y={2.35}>
            <boxGeometry args={[0.38, 0.45, 0.38]} />
          </mesh>
          <mesh material={materials.slate} position-y={2.65}>
            <coneGeometry args={[0.32, 0.25, 4]} />
          </mesh>
        </group>
      ))}

      <mesh ref={marker} material={markerMaterial} rotation-x={-Math.PI / 2} position={[0, 0.5, ringCenter]}>
        <ringGeometry args={[RING_RADIUS - RING_WIDTH, RING_RADIUS, 48]} />
      </mesh>
    </RigidBody>
  )
}
