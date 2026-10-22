import { useEffect, useMemo } from 'react'
import { BoxGeometry, Matrix4 } from 'three'
import { gableRoofGeometry } from '../../models/geometry'
import InstancedProp from '../../models/InstancedProp'
import { materials } from '../../materials'

// Crate stacks beside the warehouse door: [x, z, layers]
const CRATE_STACKS: [number, number, number][] = [
  [-4.6, 2.6, 2],
  [-3.6, 3.4, 1],
  [4.4, 2.8, 3],
  [5.2, 1.6, 1],
]

/** Skills & Projects: a harbour warehouse/workshop with crates and a small crane. */
export default function SkillsLandmark() {
  const geometries = useMemo(
    () => ({ roof: gableRoofGeometry(6.2, 2, 8.8), crate: new BoxGeometry(1, 1, 1) }),
    [],
  )
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries])

  const crateMatrices = useMemo(
    () =>
      CRATE_STACKS.flatMap(([x, z, layers]) =>
        Array.from({ length: layers }, (_, i) =>
          new Matrix4().makeRotationY(i * 0.4 + x).setPosition(x, 0.5 + i, z),
        ),
      ),
    [],
  )

  return (
    <>
      <group position={[0, 0, -0.5]}>
        <mesh material={materials.warehouse} position-y={2}>
          <boxGeometry args={[8, 4, 5.5]} />
        </mesh>
        {/* Roof ridge runs along X, so rotate the Z-aligned prism 90° */}
        <mesh geometry={geometries.roof} material={materials.slate} position-y={4} rotation-y={Math.PI / 2} />
        {/* Big rolling door with horizontal slats */}
        {[0.4, 1.0, 1.6, 2.2, 2.8].map((y) => (
          <mesh key={y} material={y % 1.2 < 0.6 ? materials.metal : materials.slate} position={[0, y, 2.76]}>
            <boxGeometry args={[3, 0.58, 0.05]} />
          </mesh>
        ))}
        {[-3, 3].map((x) => (
          <mesh key={x} material={materials.window} position={[x, 2.6, 2.76]}>
            <boxGeometry args={[1.2, 0.8, 0.05]} />
          </mesh>
        ))}
      </group>

      <InstancedProp geometry={geometries.crate} material={materials.crate} matrices={crateMatrices} />

      {/* Crane: mast, jib and a dangling hook */}
      <group position={[-5.4, 0, -3.5]}>
        <mesh material={materials.red} position-y={3.5}>
          <boxGeometry args={[0.35, 7, 0.35]} />
        </mesh>
        <mesh material={materials.red} position={[1.6, 6.9, 0]}>
          <boxGeometry args={[4, 0.3, 0.3]} />
        </mesh>
        <mesh material={materials.metal} position={[3.3, 5.6, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 2.6, 4]} />
        </mesh>
        <mesh material={materials.crate} position={[3.3, 4, 0]}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
        </mesh>
      </group>
    </>
  )
}
