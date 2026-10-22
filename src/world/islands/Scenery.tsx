import { useEffect, useMemo } from 'react'
import { CircleGeometry, CylinderGeometry, DodecahedronGeometry, IcosahedronGeometry } from 'three'
import InstancedProp from '../models/InstancedProp'
import {
  palmLeavesGeometry,
  palmTrunkGeometry,
  pineFoliageGeometry,
  pineTrunkGeometry,
} from '../models/geometry'
import { materials } from '../materials'
import { scenery } from '../scenery'
import IslandTerrain from './IslandTerrain'

/** Island terrain plus every repeated prop in the world (each prop type is one instanced draw call). */
export default function Scenery() {
  const geometries = useMemo(
    () => ({
      pineTrunk: pineTrunkGeometry(),
      pineFoliage: pineFoliageGeometry(),
      palmTrunk: palmTrunkGeometry(),
      palmLeaves: palmLeavesGeometry(),
      bush: new IcosahedronGeometry(1, 1),
      flower: new IcosahedronGeometry(1, 0),
      rock: new DodecahedronGeometry(1, 0),
      stone: new CylinderGeometry(1, 1, 1, 7),
      pond: new CircleGeometry(1, 14).rotateX(-Math.PI / 2),
    }),
    [],
  )
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries])

  return (
    <>
      {scenery.shapes.map((shape, i) => (
        <IslandTerrain key={i} shape={shape} />
      ))}
      <InstancedProp geometry={geometries.pineTrunk} material={materials.palmTrunk} matrices={scenery.pineTrunks} />
      <InstancedProp geometry={geometries.pineFoliage} material={materials.pineFoliage} {...scenery.pineFoliage} />
      <InstancedProp geometry={geometries.palmTrunk} material={materials.palmTrunk} matrices={scenery.palms} />
      <InstancedProp geometry={geometries.palmLeaves} material={materials.palmLeaf} matrices={scenery.palms} />
      <InstancedProp geometry={geometries.bush} material={materials.bush} {...scenery.bushes} />
      <InstancedProp geometry={geometries.flower} material={materials.flower} {...scenery.flowers} />
      <InstancedProp geometry={geometries.rock} material={materials.tintable} {...scenery.rocks} />
      <InstancedProp geometry={geometries.stone} material={materials.pathStone} matrices={scenery.stones} />
      <InstancedProp geometry={geometries.pond} material={materials.pond} matrices={scenery.ponds} />
    </>
  )
}
