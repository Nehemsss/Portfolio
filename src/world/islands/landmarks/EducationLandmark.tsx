import type { Material } from 'three'
import { materials } from '../../materials'

// Giant book stack sculpture: [material, y, rotation]
const BOOKS: [Material, number, number][] = [
  [materials.bookRed, 0.2, 0],
  [materials.bookBlue, 0.6, 0.25],
  [materials.bookGreen, 1.0, -0.15],
]

/** Educational Background: a schoolhouse with a clock/bell tower, flagpole and a stack of books. */
export default function EducationLandmark() {
  return (
    <>
      <group position={[0, 0, -0.8]}>
        <mesh material={materials.brick} position-y={1.75}>
          <boxGeometry args={[7, 3.5, 4.5]} />
        </mesh>
        <mesh material={materials.slate} position-y={4.3} rotation-y={Math.PI / 4}>
          <coneGeometry args={[5.4, 1.6, 4]} />
        </mesh>
        {/* Windows: two rows either side of the door */}
        {[-2.5, -1.4, 1.4, 2.5].flatMap((x) =>
          [1.2, 2.6].map((y) => (
            <mesh key={`${x}-${y}`} material={materials.window} position={[x, y, 2.26]}>
              <boxGeometry args={[0.7, 0.8, 0.05]} />
            </mesh>
          )),
        )}
        <mesh material={materials.darkWood} position={[0, 1, 2.26]}>
          <boxGeometry args={[1.2, 2, 0.05]} />
        </mesh>
        {/* Front steps */}
        {[0, 1].map((i) => (
          <mesh key={i} material={materials.stone} position={[0, 0.1 + i * 0.2, 2.75 - i * 0.3]}>
            <boxGeometry args={[2 - i * 0.4, 0.2, 0.6]} />
          </mesh>
        ))}

        {/* Clock/bell tower on the roof */}
        <group position-y={3.5}>
          <mesh material={materials.white} position-y={1.6}>
            <boxGeometry args={[1.6, 3.2, 1.6]} />
          </mesh>
          <mesh material={materials.cream} position={[0, 2.2, 0.81]}>
            <circleGeometry args={[0.55, 12]} />
          </mesh>
          <mesh material={materials.slate} position={[0, 2.35, 0.83]}>
            <boxGeometry args={[0.06, 0.4, 0.02]} />
          </mesh>
          <mesh material={materials.slate} position={[0.12, 2.2, 0.83]}>
            <boxGeometry args={[0.28, 0.06, 0.02]} />
          </mesh>
          <mesh material={materials.gold} position-y={3.5}>
            <cylinderGeometry args={[0.2, 0.35, 0.5, 8]} />
          </mesh>
          <mesh material={materials.roof} position-y={4.3} rotation-y={Math.PI / 4}>
            <coneGeometry args={[1.35, 1.6, 4]} />
          </mesh>
        </group>
      </group>

      {/* Flagpole */}
      <group position={[-4, 0, 3]}>
        <mesh material={materials.metal} position-y={3}>
          <cylinderGeometry args={[0.06, 0.08, 6, 6]} />
        </mesh>
        <mesh material={materials.flag} position={[0.7, 5.4, 0]}>
          <boxGeometry args={[1.3, 0.8, 0.04]} />
        </mesh>
      </group>

      {/* Book stack */}
      <group position={[4, 0, 3]}>
        {BOOKS.map(([mat, y, rot]) => (
          <group key={y} position-y={y} rotation-y={rot}>
            <mesh material={mat}>
              <boxGeometry args={[1.8, 0.4, 1.3]} />
            </mesh>
            {/* Page edges */}
            <mesh material={materials.cream} position-x={0.06}>
              <boxGeometry args={[1.72, 0.32, 1.32]} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  )
}
