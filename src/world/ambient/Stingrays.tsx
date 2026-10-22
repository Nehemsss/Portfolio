import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Color,
  DoubleSide,
  Matrix4,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  type Group,
} from 'three'
import { useQuality } from '../../hooks/useQuality'
import { envState } from '../environment/dayNight'
import { dockLayout } from '../islands/dockLayout'
import { ISLANDS } from '../layout'
import { seededRandom } from '../models/geometry'
import InstancedProp from '../models/InstancedProp'
import { shoreDistance, waveHeight } from '../ocean/waves'

/** Paths planned up front; the quality tier decides how many are actually swum. */
const COUNT = 6
const GLOW = new Color('#38f3ff')
const SPOT = new Color('#a8fdff')

interface RayPath {
  cx: number
  cz: number
  radius: number
  /** Radians per second; the sign sets the circling direction. */
  speed: number
  phase: number
  size: number
}

/** Where each dock's marker ring sits on the water. */
const DOCK_RINGS = ISLANDS.map((i) => {
  const d = dockLayout(i)
  return d.toWorld(0, 0, d.ringCenter)
})

/** Deterministic circling paths in open water, clear of shores, docks and each other. */
function planPaths(): RayPath[] {
  const rand = seededRandom(5151)
  const out: RayPath[] = []
  for (let tries = 0; out.length < COUNT && tries < 3000; tries++) {
    const angle = rand() * Math.PI * 2
    const dist = 32 + rand() * 78
    const cx = Math.cos(angle) * dist
    const cz = Math.sin(angle) * dist
    const radius = 6 + rand() * 5
    // The whole loop must stay in open water.
    if (shoreDistance(cx, cz) < radius + 7) continue
    if (DOCK_RINGS.some((d) => Math.hypot(cx - d.x, cz - d.z) < radius + 9)) continue
    if (out.some((p) => Math.hypot(cx - p.cx, cz - p.cz) < radius + p.radius + 4)) continue
    out.push({
      cx,
      cz,
      radius,
      speed: (0.16 + rand() * 0.08) * (rand() < 0.5 ? -1 : 1),
      phase: rand() * Math.PI * 2,
      size: 1 + rand() * 0.4,
    })
  }
  return out
}

const PATHS = planPaths()

/**
 * One wing seen from above, built flat in XY then laid on the water (nose toward +Z, normal up).
 * `side` = 1 for the right wing, -1 for the mirrored left wing.
 */
function wingGeometry(side: 1 | -1, scale = 1) {
  const s = new Shape()
  const x = (v: number) => v * side * scale
  const y = (v: number) => -v * scale // negated so the nose ends up at +Z after rotateX(-π/2)
  s.moveTo(x(0), y(1.9))
  s.quadraticCurveTo(x(1.3), y(1.25), x(2.8), y(-0.1))
  s.quadraticCurveTo(x(1.5), y(-0.45), x(0.25), y(-1.35))
  s.lineTo(x(0), y(-1.35))
  s.closePath()
  const geo = new ShapeGeometry(s, 10)
  geo.rotateX(-Math.PI / 2)
  return geo
}

/** Glowing spots on one wing (local to that wing's pivot). */
function spotMatrices(side: 1 | -1) {
  const spots: [number, number, number][] = [
    [0.7, 0.6, 0.11],
    [1.3, 0.1, 0.13],
    [0.9, -0.4, 0.1],
    [1.9, -0.05, 0.09],
    [0.45, -0.85, 0.08],
  ]
  return spots.map(([sx, sz, r]) => new Matrix4().makeScale(r, r * 0.4, r).setPosition(sx * side, 0.05, sz))
}

// Module-level materials (one school of rays) so the frame loop can fade them freely.
// toneMapped=false lets the glow exceed 1 at night, which the bloom pass turns into a halo.
const bodyMaterial = new MeshStandardMaterial({ color: '#1b2a48', roughness: 0.6, flatShading: true, side: DoubleSide })
const rimMaterial = new MeshBasicMaterial({ color: GLOW.clone(), transparent: true, opacity: 0, side: DoubleSide, toneMapped: false })
const spotMaterial = new MeshBasicMaterial({ color: SPOT.clone(), transparent: true, opacity: 0, toneMapped: false })

interface RayProps {
  path: RayPath
  geometries: {
    rightWing: ShapeGeometry
    leftWing: ShapeGeometry
    rightRim: ShapeGeometry
    leftRim: ShapeGeometry
    body: SphereGeometry
    spot: SphereGeometry
  }
  spots: { right: Matrix4[]; left: Matrix4[] }
}

function Ray({ path, geometries, spots }: RayProps) {
  const root = useRef<Group>(null)
  const left = useRef<Group>(null)
  const right = useRef<Group>(null)

  useFrame((state) => {
    const g = root.current
    if (!g || !left.current || !right.current) return
    const t = state.clock.elapsedTime
    const a = path.phase + t * path.speed
    const x = path.cx + Math.cos(a) * path.radius
    const z = path.cz + Math.sin(a) * path.radius
    g.position.set(x, waveHeight(x, z, t) + 0.12, z)
    // Face along the circle's tangent and bank gently into the turn.
    const dir = Math.sign(path.speed)
    g.rotation.set(0, Math.atan2(-Math.sin(a) * dir, Math.cos(a) * dir), dir * 0.12, 'YXZ')
    // Slow, graceful wing beats.
    const flap = Math.sin(t * 1.8 + path.phase) * 0.32
    right.current.rotation.z = flap
    left.current.rotation.z = -flap
  })

  return (
    <group ref={root} scale={path.size}>
      <mesh geometry={geometries.body} material={bodyMaterial} scale={[0.55, 0.2, 1.3]} position-z={0.15} />
      {/* Whip tail */}
      <mesh material={bodyMaterial} position-z={-2.6} rotation-x={-Math.PI / 2}>
        <coneGeometry args={[0.07, 2.8, 5]} />
      </mesh>
      {/* Wings pivot along the spine so they can flap; each has a glowing rim and spots */}
      <group ref={right}>
        <mesh geometry={geometries.rightRim} material={rimMaterial} position-y={-0.02} />
        <mesh geometry={geometries.rightWing} material={bodyMaterial} />
        <InstancedProp geometry={geometries.spot} material={spotMaterial} matrices={spots.right} />
      </group>
      <group ref={left}>
        <mesh geometry={geometries.leftRim} material={rimMaterial} position-y={-0.02} />
        <mesh geometry={geometries.leftWing} material={bodyMaterial} />
        <InstancedProp geometry={geometries.spot} material={spotMaterial} matrices={spots.left} />
      </group>
    </group>
  )
}

/**
 * Night-only school of glowing stingrays gliding in slow loops at the surface of open water.
 * Their glow (outline rim and spots) fades in with the night amount.
 */
export default function Stingrays() {
  const count = useQuality().stingrays
  const geometries = useMemo(
    () => ({
      rightWing: wingGeometry(1),
      leftWing: wingGeometry(-1),
      // Slightly larger copies drawn underneath read as a glowing outline.
      rightRim: wingGeometry(1, 1.1),
      leftRim: wingGeometry(-1, 1.1),
      body: new SphereGeometry(1, 10, 6),
      spot: new SphereGeometry(1, 8, 6),
    }),
    [],
  )
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries])
  const spots = useMemo(() => ({ right: spotMatrices(1), left: spotMatrices(-1) }), [])

  useFrame(() => {
    const n = envState.night
    rimMaterial.color.copy(GLOW).multiplyScalar(1 + n * 1.6)
    rimMaterial.opacity = n * 0.9
    spotMaterial.color.copy(SPOT).multiplyScalar(1 + n * 1.8)
    spotMaterial.opacity = n
  })

  return (
    <>
      {PATHS.slice(0, count).map((path, i) => (
        <Ray key={i} path={path} geometries={geometries} spots={spots} />
      ))}
    </>
  )
}
