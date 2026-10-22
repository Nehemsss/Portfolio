import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshBasicMaterial, type Group, type Mesh } from 'three'
import { useQuality } from '../../hooks/useQuality'
import { boatState } from '../boat/boatState'
import { shoreDistance, waveHeight } from '../ocean/waves'
import { seededRandom } from '../models/geometry'
import { materials } from '../materials'

const JUMP_TIME = 1.1 // seconds airborne
const JUMP_LENGTH = 5
const JUMP_HEIGHT = 2.8
const SPLASH_TIME = 0.7

interface Jump {
  start: number // clock time the current jump starts (or will start)
  x: number
  z: number
  dirX: number
  dirZ: number
}

/** Pick a spot in open water within view of the boat, at least 3 units from any shore. */
function planJump(now: number, rand: () => number): Jump {
  for (let tries = 0; tries < 20; tries++) {
    const angle = rand() * Math.PI * 2
    const dist = 10 + rand() * 25
    const x = boatState.position.x + Math.cos(angle) * dist
    const z = boatState.position.z + Math.sin(angle) * dist
    if (shoreDistance(x, z) > 3) {
      const heading = rand() * Math.PI * 2
      return { start: now + 1 + rand() * 4, x, z, dirX: Math.cos(heading), dirZ: Math.sin(heading) }
    }
  }
  return { start: now + 2, x: 0, z: 9999, dirX: 1, dirZ: 0 } // nowhere suitable; try again later
}

function Fish({ seed }: { seed: number }) {
  const body = useRef<Group>(null)
  const splashIn = useRef<Mesh>(null)
  const splashOut = useRef<Mesh>(null)
  const rand = useRef<(() => number) | null>(null)
  const jump = useRef<Jump | null>(null)
  // Each splash ring fades on its own, so each needs its own material.
  const splashMats = useMemo(
    () => [0, 1].map(() => new MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false })),
    [],
  )
  useEffect(() => () => splashMats.forEach((m) => m.dispose()), [splashMats])

  useFrame((state) => {
    const now = state.clock.elapsedTime
    const fish = body.current
    if (!fish || !splashIn.current || !splashOut.current) return
    rand.current ??= seededRandom(seed * 9973)
    if (!jump.current) jump.current = planJump(now + seed, rand.current)
    const j = jump.current

    const t = (now - j.start) / JUMP_TIME
    fish.visible = t >= 0 && t <= 1
    if (fish.visible) {
      // Parabolic arc; pitch follows the arc's slope so the fish noses up, then dives.
      const x = j.x + j.dirX * JUMP_LENGTH * t
      const z = j.z + j.dirZ * JUMP_LENGTH * t
      const y = waveHeight(x, z, now) - 0.4 + 4 * JUMP_HEIGHT * t * (1 - t)
      fish.position.set(x, y, z)
      fish.rotation.set(0, Math.atan2(j.dirX, j.dirZ), 0)
      const slope = (4 * JUMP_HEIGHT * (1 - 2 * t)) / JUMP_LENGTH
      fish.rotateX(-Math.atan(slope))
      // Tail wiggle
      fish.children[1].rotation.y = Math.sin(now * 25) * 0.5
    }

    // Splash rings where the fish leaves and re-enters the water.
    const rings: [Mesh, number, number, number][] = [
      [splashIn.current, j.x, j.z, now - j.start],
      [splashOut.current, j.x + j.dirX * JUMP_LENGTH, j.z + j.dirZ * JUMP_LENGTH, now - j.start - JUMP_TIME],
    ]
    rings.forEach(([ring, x, z, age]) => {
      const a = age / SPLASH_TIME
      ring.visible = a >= 0 && a <= 1
      if (!ring.visible) return
      ring.position.set(x, waveHeight(x, z, now) + 0.12, z)
      ring.scale.setScalar(0.4 + a * 2)
      ;(ring.material as MeshBasicMaterial).opacity = (1 - a) * 0.9
    })

    if (now - j.start > JUMP_TIME + SPLASH_TIME) jump.current = planJump(now, rand.current)
  })

  return (
    <>
      <group ref={body} visible={false}>
        <mesh material={materials.fish} scale={[0.35, 0.4, 0.8]}>
          <sphereGeometry args={[1, 8, 6]} />
        </mesh>
        <group position-z={-0.75}>
          <mesh material={materials.fishFin} position-z={-0.3} rotation-x={Math.PI / 2} scale={[1, 1, 0.25]}>
            <coneGeometry args={[0.35, 0.6, 4]} />
          </mesh>
        </group>
        <mesh material={materials.fishFin} position={[0, 0.38, 0]} scale={[0.15, 0.6, 0.6]}>
          <coneGeometry args={[0.5, 0.6, 4]} />
        </mesh>
      </group>
      <mesh ref={splashIn} rotation-x={-Math.PI / 2} material={splashMats[0]} visible={false}>
        <ringGeometry args={[0.7, 1, 20]} />
      </mesh>
      <mesh ref={splashOut} rotation-x={-Math.PI / 2} material={splashMats[1]} visible={false}>
        <ringGeometry args={[0.7, 1, 20]} />
      </mesh>
    </>
  )
}

/** A few fish that take turns leaping out of the water near the boat (fewer on low-end devices). */
export default function JumpingFish() {
  const { fish } = useQuality()
  return (
    <>
      {Array.from({ length: fish }, (_, i) => (
        <Fish key={i} seed={i + 1} />
      ))}
    </>
  )
}
