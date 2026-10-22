import { useMemo, useRef } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Color, MeshBasicMaterial, MeshStandardMaterial, type Group, type Mesh } from 'three'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { envState } from '../environment/dayNight'
import { FONTS } from '../fonts'
import { materials } from '../materials'

const BREW = new Color('#7dff6a')
const FIRE = new Color('#ff8a1f')
const BUBBLES = 6

// Module-level (one cauldron) so the frame loop can make the brew and fire glow and flicker.
// toneMapped=false lets them exceed 1, which the night bloom turns into a glow.
const ironMaterial = new MeshStandardMaterial({ color: '#2a2a33', roughness: 0.45, metalness: 0.6, flatShading: true })
const brewMaterial = new MeshBasicMaterial({ color: BREW.clone(), toneMapped: false })
const bubbleMaterial = new MeshBasicMaterial({ color: BREW.clone(), transparent: true, opacity: 0.85, toneMapped: false })
const fireMaterial = new MeshBasicMaterial({ color: FIRE.clone(), toneMapped: false })

/**
 * Halloween "Spooky Brew": a witch's cauldron on legs over a log fire, full of glowing green brew
 * with bubbles rising from it, plus a little hand-painted sign. Modelled in the Home Island
 * landmark's local units (the island scales it up). Faces +Z.
 */
export default function SpookyBrew({ position }: { position: [number, number, number] }) {
  const reducedMotion = useReducedMotion()
  const bubbles = useRef<(Mesh | null)[]>([])
  const flame = useRef<Group>(null)
  const seeds = useMemo(
    () => Array.from({ length: BUBBLES }, (_, i) => ({ x: Math.cos(i * 2.4) * 0.28, z: Math.sin(i * 2.4) * 0.28, offset: i / BUBBLES })),
    [],
  )

  useFrame((state) => {
    const n = envState.night
    const t = reducedMotion ? 0 : state.clock.elapsedTime
    const flicker = 0.85 + Math.sin(t * 11) * 0.08 + Math.sin(t * 17) * 0.06
    brewMaterial.color.copy(BREW).multiplyScalar(1.1 + n * 2 * flicker)
    bubbleMaterial.color.copy(BREW).multiplyScalar(1.2 + n * 2)
    fireMaterial.color.copy(FIRE).multiplyScalar(1.3 + n * 2.4 * flicker)
    if (flame.current) flame.current.scale.y = 0.85 + Math.sin(t * 13) * 0.15

    // Bubbles rise from the surface, swell, then pop and start again.
    seeds.forEach((s, i) => {
      const b = bubbles.current[i]
      if (!b) return
      const p = (t * 0.45 + s.offset) % 1
      b.position.set(s.x, 0.95 + p * 0.9, s.z)
      b.scale.setScalar(0.05 + p * 0.09)
      ;(b.material as MeshBasicMaterial).opacity = 0.9 * (1 - p)
    })
  })

  return (
    <group position={position}>
      {/* Log fire underneath */}
      {[0.5, -0.5].map((r) => (
        <mesh key={r} material={materials.darkWood} position-y={0.1} rotation={[0, r, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 1.1, 6]} />
        </mesh>
      ))}
      <group ref={flame} position-y={0.12}>
        <mesh material={fireMaterial} position-y={0.22}>
          <coneGeometry args={[0.28, 0.5, 6]} />
        </mesh>
      </group>

      {/* Three iron legs and the round-bellied pot */}
      {[0, 2.1, 4.2].map((a) => (
        <mesh key={a} material={ironMaterial} position={[Math.cos(a) * 0.45, 0.3, Math.sin(a) * 0.45]}>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 5]} />
        </mesh>
      ))}
      <mesh material={ironMaterial} position-y={0.85} scale={[1, 0.8, 1]}>
        {/* Open at the top: a sphere with the cap cut off */}
        <sphereGeometry args={[0.65, 16, 12, 0, Math.PI * 2, 0.55, Math.PI - 0.55]} />
      </mesh>
      <mesh material={ironMaterial} position-y={1.17} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.36, 0.07, 6, 18]} />
      </mesh>
      {/* The brew's glowing surface */}
      <mesh material={brewMaterial} position-y={1.12} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.36, 18]} />
      </mesh>
      {seeds.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            bubbles.current[i] = el
          }}
          material={bubbleMaterial}
        >
          <sphereGeometry args={[1, 8, 6]} />
        </mesh>
      ))}

      {/* "Spooky Brew" sign on a stake, beside the pot */}
      <group position={[1.15, 0, 0.25]} rotation-y={-0.25}>
        <mesh material={materials.darkWood} position-y={0.55}>
          <boxGeometry args={[0.08, 1.1, 0.08]} />
        </mesh>
        <mesh material={materials.signBoard} position-y={1.05} rotation-z={-0.06}>
          <boxGeometry args={[1.05, 0.42, 0.06]} />
        </mesh>
        <Text
          font={FONTS.heading}
          position={[0, 1.05, 0.04]}
          rotation-z={-0.06}
          fontSize={0.17}
          color="#ff9a3c"
          anchorX="center"
          anchorY="middle"
        >
          Spooky Brew
        </Text>
      </group>
    </group>
  )
}
