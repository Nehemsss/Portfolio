import { useEffect, useMemo } from 'react'
import type { Material } from 'three'
import { trophyCupGeometry } from '../../models/geometry'
import { materials } from '../../materials'

function Trophy({ material, position, scale = 1 }: { material: Material; position: [number, number, number]; scale?: number }) {
  const cup = useMemo(() => trophyCupGeometry(), [])
  useEffect(() => () => cup.dispose(), [cup])
  return (
    <group position={position} scale={scale}>
      <mesh material={materials.darkWood} position-y={0.15}>
        <boxGeometry args={[1.1, 0.3, 1.1]} />
      </mesh>
      <mesh geometry={cup} material={material} position-y={0.3} />
      {/* Handles */}
      {[-1, 1].map((side) => (
        // Half-torus arcs over +Y by default; rotating ∓90° about Z makes it bulge out to each side.
        <mesh key={side} material={material} position={[side * 0.5, 1.75, 0]} rotation-z={-side * (Math.PI / 2)}>
          <torusGeometry args={[0.22, 0.06, 6, 10, Math.PI]} />
        </mesh>
      ))}
    </group>
  )
}

// [x, podium height, trophy material, trophy scale]
const PODIUM: [number, number, Material, number][] = [
  [0, 1.2, materials.gold, 1],
  [-1.9, 0.8, materials.silver, 0.8],
  [1.9, 0.5, materials.bronze, 0.7],
]

/** Achievements & Certifications: a winners' podium with trophies and a stone monument behind. */
export default function AchievementsLandmark() {
  return (
    <>
      <group position={[0, 0, 1]}>
        {PODIUM.map(([x, h, mat, s]) => (
          <group key={x}>
            <mesh material={materials.stone} position={[x, h / 2, 0]}>
              <boxGeometry args={[1.8, h, 1.8]} />
            </mesh>
            <Trophy material={mat} position={[x, h, 0]} scale={s} />
          </group>
        ))}
      </group>

      {/* Obelisk monument */}
      <group position={[0, 0, -2.6]}>
        <mesh material={materials.stone} position-y={0.4}>
          <boxGeometry args={[2.4, 0.8, 2.4]} />
        </mesh>
        <mesh material={materials.white} position-y={4.3} rotation-y={Math.PI / 4}>
          <cylinderGeometry args={[0.45, 0.85, 7, 4]} />
        </mesh>
        <mesh material={materials.gold} position-y={8.15} rotation-y={Math.PI / 4}>
          <coneGeometry args={[0.45, 0.7, 4]} />
        </mesh>
      </group>
    </>
  )
}
