import { useEffect, useMemo } from 'react'
import { ExtrudeGeometry, Shape, type Vector2 } from 'three'
import { materials } from '../materials'
import type { IslandShape } from '../scenery'

/** How far below the waterline the cliff extends (hidden by the water, avoids a visible bottom). */
const CLIFF_BOTTOM_Y = -2.5
/** The cliff top sits slightly below the grass, leaving a light rim visible around the cap. */
const RIM_DROP = 0.35
const CAP_DEPTH = 0.2
const CAP_BEVEL = 0.14

/**
 * Builds a flat-topped extrusion from an outline in the local XZ plane.
 * ExtrudeGeometry extrudes a 2D shape along +Z; rotating +90° about X turns the shape's Y into
 * world Z and the extrusion direction into -Y (downward), so the top face lands at y = 0.
 */
function extrude(outline: Vector2[], scale: number, depth: number, bevel = 0) {
  const shape = new Shape(outline.map((p) => p.clone().multiplyScalar(scale)))
  const geo = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
  })
  geo.rotateX(Math.PI / 2)
  return geo
}

/** One organic island: dirt cliff with a light top rim, and an inset grass cap with a soft edge. */
export default function IslandTerrain({ shape }: { shape: IslandShape }) {
  const { outline, groundY, capScale, islet } = shape

  const geometries = useMemo(() => {
    const cliffTop = groundY - RIM_DROP
    const cliff = extrude(outline, 1, cliffTop - CLIFF_BOTTOM_Y)
    cliff.translate(0, cliffTop, 0)
    const cap = extrude(outline, capScale, CAP_DEPTH, CAP_BEVEL)
    // The bevel adds CAP_BEVEL above the shape's top face, so shift down to put the surface at groundY.
    cap.translate(0, groundY - CAP_BEVEL, 0)
    return { cliff, cap }
  }, [outline, groundY, capScale])
  useEffect(
    () => () => {
      geometries.cliff.dispose()
      geometries.cap.dispose()
    },
    [geometries],
  )

  return (
    <group position={[shape.x, 0, shape.z]} rotation-y={shape.yaw}>
      {/* ExtrudeGeometry material groups: [caps (top/bottom), sides] */}
      <mesh geometry={geometries.cliff} material={[islet ? materials.sand : materials.rim, materials.dirt]} />
      <mesh geometry={geometries.cap} material={materials.grass} />
    </group>
  )
}
