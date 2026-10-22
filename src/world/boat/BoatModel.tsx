import { useEffect, useMemo } from 'react'
import { ExtrudeGeometry, Shape } from 'three'
import { materials } from '../materials'

const HULL_DEPTH = 0.75

/** Hull: a pointed top-down outline extruded downward. Bow points along +Z. */
function hullGeometry() {
  const s = new Shape()
  // Outline in XY, with +Y as the bow direction (becomes +Z after rotation)
  s.moveTo(-0.85, -1.6)
  s.lineTo(0.85, -1.6)
  s.lineTo(0.9, 0.6)
  s.lineTo(0, 1.95)
  s.lineTo(-0.9, 0.6)
  s.closePath()
  const geo = new ExtrudeGeometry(s, { depth: HULL_DEPTH, bevelEnabled: false })
  // Rotate +90° about X: shape +Y → +Z (bow forward) and the extrusion (+Z) → -Y (downward).
  geo.rotateX(Math.PI / 2)
  return geo
}

/** Low-poly motorboat. Replace with a GLTF model here; keep the bow along +Z and the deck at y ≈ 0. */
export default function BoatModel() {
  const hull = useMemo(() => hullGeometry(), [])
  useEffect(() => () => hull.dispose(), [hull])

  return (
    <group>
      {/* ExtrudeGeometry has two material groups: [caps (deck + keel), sides] */}
      <mesh geometry={hull} material={[materials.wood, materials.red]} />
      {/* White trim along the gunwale */}
      <mesh material={materials.white} position={[0, 0.05, -0.2]}>
        <boxGeometry args={[1.85, 0.1, 2.9]} />
      </mesh>
      {/* Cabin */}
      <mesh material={materials.white} position={[0, 0.45, -0.45]}>
        <boxGeometry args={[1.2, 0.8, 1.2]} />
      </mesh>
      <mesh material={materials.window} position={[0, 0.6, 0.16]}>
        <boxGeometry args={[1.05, 0.4, 0.05]} />
      </mesh>
      <mesh material={materials.slate} position={[0, 0.9, -0.45]}>
        <boxGeometry args={[1.35, 0.1, 1.35]} />
      </mesh>
      {/* Little flag on a mast */}
      <mesh material={materials.metal} position={[0, 1.4, -0.9]}>
        <cylinderGeometry args={[0.03, 0.03, 1.1, 4]} />
      </mesh>
      <mesh material={materials.flag} position={[0, 1.75, -1.15]}>
        <boxGeometry args={[0.03, 0.3, 0.5]} />
      </mesh>
      {/* Outboard motor */}
      <mesh material={materials.slate} position={[0, -0.1, -1.75]}>
        <boxGeometry args={[0.4, 0.6, 0.35]} />
      </mesh>
    </group>
  )
}
