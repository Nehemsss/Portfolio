import { useLayoutEffect, useRef } from 'react'
import type { BufferGeometry, Color, InstancedMesh, Material, Matrix4 } from 'three'

interface Props {
  geometry: BufferGeometry
  material: Material
  matrices: Matrix4[]
  /** Optional per-instance colours (multiplied with the material colour, so use a white material). */
  colors?: Color[]
}

/** Draws many copies of one mesh in a single draw call. Use for any repeated static prop. */
export default function InstancedProp({ geometry, material, matrices, colors }: Props) {
  const ref = useRef<InstancedMesh>(null)

  // Layout effect: runs before R3F's next frame, so the shader compiles with instance colours enabled.
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
    if (colors) {
      colors.forEach((c, i) => mesh.setColorAt(i, c))
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    // Without this, frustum culling uses the base geometry's bounds and instances pop out of view.
    mesh.computeBoundingSphere()
  }, [matrices, colors])

  // Re-create the mesh when the instance count changes (InstancedMesh capacity is fixed).
  return <instancedMesh key={matrices.length} ref={ref} args={[geometry, material, matrices.length]} />
}
