import { CylinderCollider, RigidBody } from '@react-three/rapier'
import { ISLANDS, ISLETS } from '../layout'

/** One fixed body holding a cylinder collider per island/islet at its waterline radius. */
export default function IslandColliders() {
  const shapes = [...ISLANDS, ...ISLETS]
  return (
    <RigidBody type="fixed" colliders={false}>
      {shapes.map((s, i) => (
        // Tall enough to block the boat however it bobs.
        <CylinderCollider key={i} args={[3, s.radius]} position={[s.x, 0, s.z]} />
      ))}
    </RigidBody>
  )
}
