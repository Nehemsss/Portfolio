import { materials } from '../../materials'

/** About Me: a cozy cottage with a mailbox (contact!) out front. */
export default function AboutLandmark() {
  return (
    <>
      <group position={[0, 0, -0.5]}>
        <mesh material={materials.plaster} position-y={1.5}>
          <boxGeometry args={[5, 3, 4]} />
        </mesh>
        {/* A 4-sided cone rotated 45° makes a hip roof */}
        <mesh material={materials.roof} position-y={4.1} rotation-y={Math.PI / 4}>
          <coneGeometry args={[3.9, 2.2, 4]} />
        </mesh>
        <mesh material={materials.brick} position={[1.4, 4.4, -0.8]}>
          <boxGeometry args={[0.6, 1.6, 0.6]} />
        </mesh>
        <mesh material={materials.darkWood} position={[0, 0.9, 2.01]}>
          <boxGeometry args={[0.9, 1.8, 0.1]} />
        </mesh>
        {[-1.6, 1.6].map((x) => (
          <mesh key={x} material={materials.window} position={[x, 1.7, 2.01]}>
            <boxGeometry args={[0.9, 0.8, 0.1]} />
          </mesh>
        ))}
        {[-1.2, 1.2].map((z) => (
          <mesh key={z} material={materials.window} position={[2.51, 1.7, z]}>
            <boxGeometry args={[0.1, 0.8, 0.8]} />
          </mesh>
        ))}
      </group>

      {/* Mailbox */}
      <group position={[2.6, 0, 3.6]}>
        <mesh material={materials.wood} position-y={0.55}>
          <boxGeometry args={[0.15, 1.1, 0.15]} />
        </mesh>
        <mesh material={materials.red} position-y={1.25}>
          <boxGeometry args={[0.45, 0.4, 0.7]} />
        </mesh>
      </group>
    </>
  )
}
