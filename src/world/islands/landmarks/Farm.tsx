import { useEffect, useMemo } from 'react'
import { BoxGeometry, ConeGeometry, IcosahedronGeometry, Matrix4 } from 'three'
import { gableRoofGeometry } from '../../models/geometry'
import InstancedProp from '../../models/InstancedProp'
import { materials } from '../../materials'

/*
 * Farm pieces for the Home Island, each placed independently by the landmark.
 * Coordinates are in the landmark's local frame (unscaled; the island applies LANDMARK_SCALE),
 * with +Z facing the dock / default camera.
 */

type Vec3 = [number, number, number]

const FENCE_PAD = 0.25
const POST_SPACING = 0.7
const ROW_SPACING = 0.6
const PLANT_SPACING = 0.55
const GATE_HALF_WIDTH = 0.55

interface CropFieldProps {
  position?: Vec3
  /** Size along X (the long, "landscape" side facing the camera). */
  width?: number
  /** Size along Z. */
  depth?: number
}

/**
 * Fenced crop field. Rows run along X; tall wheat fills the back rows and low cabbages the front,
 * so nothing blocks the view from the default camera. Gate in the middle of the front fence.
 */
export function CropField({ position = [0, 0, 0], width = 6.4, depth = 3.2 }: CropFieldProps) {
  const geometries = useMemo(
    () => ({
      wheat: new ConeGeometry(0.13, 0.55, 5),
      cabbage: new IcosahedronGeometry(0.22, 0),
      post: new BoxGeometry(0.1, 0.6, 0.1),
    }),
    [],
  )
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries])

  const hw = width / 2
  const hd = depth / 2
  const fx = hw + FENCE_PAD // fence half-extents
  const fz = hd + FENCE_PAD

  const { wheat, cabbage, posts } = useMemo(() => {
    const wheatM: Matrix4[] = []
    const cabbageM: Matrix4[] = []
    const rowCount = Math.max(1, Math.floor(depth / ROW_SPACING))
    const firstRowZ = -((rowCount - 1) * ROW_SPACING) / 2
    for (let r = 0; r < rowCount; r++) {
      const z = firstRowZ + r * ROW_SPACING
      const isWheat = r < Math.ceil(rowCount * 0.4) // back ~40% of rows (most negative Z)
      for (let x = -hw + 0.3; x <= hw - 0.25; x += PLANT_SPACING) {
        if (Math.hypot(x, z) < 0.4) continue // leave room for the scarecrow at the centre
        if (isWheat) wheatM.push(new Matrix4().makeRotationY(x * 3).setPosition(x, 0.4, z))
        else cabbageM.push(new Matrix4().makeRotationY(x * 5 + r).setPosition(x, 0.27, z))
      }
    }

    // Posts all round, leaving a gap for the gate in the middle of the front (+Z) side.
    const postM: Matrix4[] = []
    for (let x = -fx; x <= fx + 1e-3; x += POST_SPACING) {
      postM.push(new Matrix4().setPosition(x, 0.3, -fz))
      if (Math.abs(x) > GATE_HALF_WIDTH) postM.push(new Matrix4().setPosition(x, 0.3, fz))
    }
    for (let z = -fz + POST_SPACING; z < fz - 1e-3; z += POST_SPACING) {
      postM.push(new Matrix4().setPosition(-fx, 0.3, z), new Matrix4().setPosition(fx, 0.3, z))
    }
    return { wheat: wheatM, cabbage: cabbageM, posts: postM }
  }, [hw, depth, fx, fz])

  const frontRail = fx - GATE_HALF_WIDTH // length of each front rail segment beside the gate

  return (
    <group position={position}>
      <mesh material={materials.soil} position-y={0.06}>
        <boxGeometry args={[width, 0.12, depth]} />
      </mesh>
      <InstancedProp geometry={geometries.wheat} material={materials.wheat} matrices={wheat} />
      <InstancedProp geometry={geometries.cabbage} material={materials.cabbage} matrices={cabbage} />

      {/* Fence: instanced posts plus two rails per side */}
      <InstancedProp geometry={geometries.post} material={materials.wood} matrices={posts} />
      {[0.22, 0.45].map((y) => (
        <group key={y}>
          <mesh material={materials.wood} position={[0, y, -fz]}>
            <boxGeometry args={[fx * 2, 0.06, 0.05]} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} material={materials.wood} position={[side * fx, y, 0]}>
              <boxGeometry args={[0.05, 0.06, fz * 2]} />
            </mesh>
          ))}
          {[-1, 1].map((side) => (
            <mesh key={`f${side}`} material={materials.wood} position={[side * (GATE_HALF_WIDTH + frontRail / 2), y, fz]}>
              <boxGeometry args={[frontRail, 0.06, 0.05]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Scarecrow standing in the middle of the field */}
      <group position={[0, 0, 0]}>
        <mesh material={materials.darkWood} position-y={0.75}>
          <boxGeometry args={[0.08, 1.5, 0.08]} />
        </mesh>
        <mesh material={materials.darkWood} position-y={1.1}>
          <boxGeometry args={[0.9, 0.07, 0.07]} />
        </mesh>
        <mesh material={materials.flag} position-y={1.05}>
          <boxGeometry args={[0.36, 0.45, 0.2]} />
        </mesh>
        <mesh material={materials.straw} position-y={1.45}>
          <sphereGeometry args={[0.16, 8, 6]} />
        </mesh>
        <mesh material={materials.straw} position-y={1.62}>
          <coneGeometry args={[0.28, 0.25, 8]} />
        </mesh>
      </group>
    </group>
  )
}

/** Red barn with a slate gable roof, white X-braced door and a hay-loft window. Door faces local +Z. */
export function Barn({ position = [0, 0, 0], yaw = 0 }: { position?: Vec3; yaw?: number }) {
  const roof = useMemo(() => gableRoofGeometry(3, 1.1, 2.6), [])
  useEffect(() => () => roof.dispose(), [roof])

  return (
    <group position={position} rotation-y={yaw}>
      <mesh material={materials.barnRed} position-y={0.85}>
        <boxGeometry args={[2.6, 1.7, 2.2]} />
      </mesh>
      <mesh geometry={roof} material={materials.slate} position-y={1.7} />
      <mesh material={materials.white} position={[0, 0.65, 1.11]}>
        <boxGeometry args={[1.1, 1.3, 0.04]} />
      </mesh>
      <mesh material={materials.barnRed} position={[0, 0.65, 1.13]}>
        <boxGeometry args={[0.9, 1.1, 0.04]} />
      </mesh>
      {[1, -1].map((dir) => (
        <mesh key={dir} material={materials.white} position={[0, 0.65, 1.16]} rotation-z={dir * 0.88}>
          <boxGeometry args={[1.35, 0.08, 0.03]} />
        </mesh>
      ))}
      {/* Hay-loft window on the roof's gable end (which overhangs the wall to z = 1.3) */}
      <mesh material={materials.window} position={[0, 2.05, 1.32]}>
        <boxGeometry args={[0.45, 0.4, 0.04]} />
      </mesh>
    </group>
  )
}

/** Three round hay bales: two on the ground, one stacked on top. */
export function HayBales({ position = [0, 0, 0], yaw = 0 }: { position?: Vec3; yaw?: number }) {
  const bales: Vec3[] = [
    [-0.38, 0.32, 0],
    [0.38, 0.32, 0],
    [0, 0.92, 0],
  ]
  return (
    <group position={position} rotation-y={yaw}>
      {bales.map((p, i) => (
        <mesh key={i} material={materials.hay} position={p} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.32, 0.32, 0.65, 10]} />
        </mesh>
      ))}
    </group>
  )
}

export function Chicken({ position, yaw = 0 }: { position: Vec3; yaw?: number }) {
  return (
    <group position={position} rotation-y={yaw}>
      <mesh material={materials.gull} position-y={0.2} scale={[0.18, 0.16, 0.24]}>
        <sphereGeometry args={[1, 8, 6]} />
      </mesh>
      <mesh material={materials.gull} position={[0, 0.38, 0.16]}>
        <sphereGeometry args={[0.1, 8, 6]} />
      </mesh>
      <mesh material={materials.red} position={[0, 0.49, 0.16]}>
        <boxGeometry args={[0.03, 0.06, 0.1]} />
      </mesh>
      <mesh material={materials.beak} position={[0, 0.37, 0.27]} rotation-x={Math.PI / 2}>
        <coneGeometry args={[0.035, 0.08, 4]} />
      </mesh>
    </group>
  )
}
