import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { ISLANDS } from '../layout'
import { materials } from '../materials'

export type BirdVariant = 'seagulls' | 'bats'

interface BirdConfig {
  cx: number
  cz: number
  radius: number
  height: number
  /** Radians per second; negative circles clockwise. */
  speed: number
  phase: number
}

// Two birds loosely circling each island at different heights, speeds and directions.
const BIRDS: BirdConfig[] = ISLANDS.flatMap((island, i) =>
  [0, 1].map((k) => ({
    cx: island.x + (k ? 4 : -3),
    cz: island.z + (k ? -3 : 2),
    radius: island.radius + 4 + k * 5,
    height: 16 + k * 4 + (i % 2) * 2,
    speed: (k ? -1 : 1) * (0.25 + i * 0.03),
    phase: i * 1.7 + k * 2.4,
  })),
)

function GullBody() {
  return (
    <>
      {/* Body (forward = +Z) */}
      <mesh material={materials.gull} scale={[0.35, 0.3, 0.9]}>
        <sphereGeometry args={[1, 8, 6]} />
      </mesh>
      <mesh material={materials.gull} position={[0, 0.2, 0.75]}>
        <sphereGeometry args={[0.28, 8, 6]} />
      </mesh>
      <mesh material={materials.beak} position={[0, 0.17, 1.1]} rotation-x={Math.PI / 2}>
        <coneGeometry args={[0.08, 0.3, 4]} />
      </mesh>
    </>
  )
}

function BatBody() {
  return (
    <>
      <mesh material={materials.bat} scale={[0.3, 0.28, 0.5]}>
        <sphereGeometry args={[1, 8, 6]} />
      </mesh>
      <mesh material={materials.bat} position={[0, 0.12, 0.45]}>
        <sphereGeometry args={[0.22, 8, 6]} />
      </mesh>
      {/* Pointy ears */}
      {[-1, 1].map((side) => (
        <mesh key={side} material={materials.bat} position={[side * 0.1, 0.36, 0.45]}>
          <coneGeometry args={[0.07, 0.2, 4]} />
        </mesh>
      ))}
    </>
  )
}

function Bird({ config, variant }: { config: BirdConfig; variant: BirdVariant }) {
  const root = useRef<Group>(null)
  const leftWing = useRef<Group>(null)
  const rightWing = useRef<Group>(null)
  const isBat = variant === 'bats'

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const g = root.current
    if (!g || !leftWing.current || !rightWing.current) return
    const { cx, cz, radius, height, speed, phase } = config
    // Bats flit faster and more erratically than gulls.
    const a = phase + t * speed * (isBat ? 1.6 : 1)
    const jitter = isBat ? Math.sin(t * 3.1 + phase) * 1.2 : 0
    g.position.set(cx + Math.cos(a) * (radius + jitter), height + Math.sin(t * (isBat ? 2.3 : 0.7) + phase) * 1.2, cz + Math.sin(a) * (radius + jitter))
    // Face along the circle's tangent; bank into the turn.
    const dir = Math.sign(speed)
    g.rotation.set(0, Math.atan2(-Math.sin(a) * dir, Math.cos(a) * dir), dir * 0.35, 'YXZ')

    // Gulls alternate flapping and gliding; bats beat their wings quickly and never glide.
    const flapping = isBat || Math.sin(t * 0.6 + phase * 3) > -0.2
    const flap = flapping ? Math.sin(t * (isBat ? 16 : 9) + phase) * (isBat ? 0.75 : 0.6) : 0.12
    leftWing.current.rotation.z = flap
    rightWing.current.rotation.z = -flap
  })

  const wingMaterial = isBat ? materials.batWing : materials.gullWing
  // Bat wings are shorter and broader, with a scalloped look from a second, offset panel.
  const wing: [number, number, number] = isBat ? [1.2, 0.04, 0.7] : [1.6, 0.05, 0.55]
  const half = wing[0] / 2

  return (
    <group ref={root} scale={0.9}>
      {isBat ? <BatBody /> : <GullBody />}
      {/* Wings pivot at the shoulder: the wing mesh is offset so its inner edge sits on the pivot. */}
      <group ref={leftWing} position={[0.25, 0.1, 0.05]}>
        <mesh material={wingMaterial} position-x={half}>
          <boxGeometry args={wing} />
        </mesh>
        {isBat && (
          <mesh material={wingMaterial} position={[half * 1.5, 0, -0.18]} rotation-y={0.5}>
            <boxGeometry args={[0.7, 0.04, 0.45]} />
          </mesh>
        )}
      </group>
      <group ref={rightWing} position={[-0.25, 0.1, 0.05]}>
        <mesh material={wingMaterial} position-x={-half}>
          <boxGeometry args={wing} />
        </mesh>
        {isBat && (
          <mesh material={wingMaterial} position={[-half * 1.5, 0, -0.18]} rotation-y={-0.5}>
            <boxGeometry args={[0.7, 0.04, 0.45]} />
          </mesh>
        )}
      </group>
    </group>
  )
}

/** Birds circling the islands by day: seagulls normally, bats at Halloween. */
export default function Seagulls({ variant = 'seagulls' }: { variant?: BirdVariant }) {
  return (
    <>
      {BIRDS.map((config, i) => (
        <Bird key={i} config={config} variant={variant} />
      ))}
    </>
  )
}
