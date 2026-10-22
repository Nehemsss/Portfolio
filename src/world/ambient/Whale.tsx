import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, Color, Matrix4, MeshBasicMaterial, SphereGeometry, Vector3, type Group, type Mesh } from 'three'
import InstancedProp from '../models/InstancedProp'
import { envState } from '../environment/dayNight'
import { waveHeight } from '../ocean/waves'
import { materials } from '../materials'
import { OUTER_ROUTE } from './routes'

const ROUTE = OUTER_ROUTE
const SPEED = 4.5 // units per second along the route
const DIVE_CYCLE = 24 // seconds: surfaced for most of it, then a dive and resurface
const SURFACED_Y = -1 // body centre while surfaced (its back breaks the water)
const DIVED_Y = -4.5 // deep enough that the opaque water hides it
const DOT_COLOR = new Color('#7ff6ff')
const SPOUT_TIME = 1.6
const SPOUT_BASE_Y = 1.4

// There is only ever one whale, so its glow material and per-frame scratch vectors live at module
// level (like the shared materials), which lets the frame loop update them freely.
// toneMapped=false so the dots can exceed 1 at night and bloom.
const dotMaterial = new MeshBasicMaterial({ color: DOT_COLOR.clone(), toneMapped: false })
const tmpPoint = new Vector3()
const tmpTangent = new Vector3()

/** Bioluminescent spots: rows along the back (on the body ellipsoid's upper surface). */
function dotMatrices() {
  const rx = 2.2
  const ry = 1.5
  const rz = 6.5
  const m: Matrix4[] = []
  for (let i = 0; i < 9; i++) {
    const z = 4.6 - i * 1.25
    for (const x of [-0.75, 0.75, ...(i % 2 ? [0] : [])]) {
      const inside = 1 - (x / rx) ** 2 - (z / rz) ** 2
      if (inside <= 0) continue
      const y = ry * Math.sqrt(inside) + 0.02
      const s = x === 0 ? 0.14 : 0.18
      m.push(new Matrix4().makeScale(s, s * 0.6, s).setPosition(x, y, z))
    }
  }
  return m
}

/**
 * One gentle whale swimming the loop, surfacing (with a spout) and diving in a slow cycle.
 * Rows of glowing spots on its back are faint by day and bright at night (bloom gives them a halo).
 * Forward is local +Z.
 */
export default function Whale() {
  const root = useRef<Group>(null)
  const tail = useRef<Group>(null)
  const spout = useRef<Mesh>(null)
  const progress = useRef(0)
  const lastSurface = useRef(0)
  const spoutStart = useRef(-10)

  const { curve, length, dotGeometry, spoutMaterial, dots } = useMemo(() => {
    const c = new CatmullRomCurve3(ROUTE.map(([x, z]) => new Vector3(x, 0, z)), true, 'centripetal')
    return {
      curve: c,
      length: c.getLength(),
      dotGeometry: new SphereGeometry(1, 8, 6),
      spoutMaterial: new MeshBasicMaterial({ color: '#eaf8ff', transparent: true, opacity: 0, depthWrite: false }),
      dots: dotMatrices(),
    }
  }, [])
  useEffect(
    () => () => {
      dotGeometry.dispose()
      spoutMaterial.dispose()
    },
    [dotGeometry, spoutMaterial],
  )

  useFrame((state, rawDt) => {
    const g = root.current
    if (!g) return
    const dt = Math.min(rawDt, 0.25)
    const time = state.clock.elapsedTime
    const scratch = { p: tmpPoint, t: tmpTangent }

    progress.current = (progress.current + (SPEED * dt) / length) % 1
    curve.getPointAt(progress.current, scratch.p)
    curve.getTangentAt(progress.current, scratch.t)

    // Surface amount: up for most of the cycle, then a smooth dive and resurface.
    const phase = (time % DIVE_CYCLE) / DIVE_CYCLE
    const smooth = (a: number, b: number, x: number) => {
      const k = Math.min(Math.max((x - a) / (b - a), 0), 1)
      return k * k * (3 - 2 * k)
    }
    const surfaced = smooth(0, 0.1, phase) * (1 - smooth(0.62, 0.75, phase))

    // Blow a spout each time it comes up.
    if (surfaced > 0.9 && lastSurface.current <= 0.9) spoutStart.current = time
    lastSurface.current = surfaced

    const water = waveHeight(scratch.p.x, scratch.p.z, time)
    g.position.set(scratch.p.x, water + DIVED_Y + (SURFACED_Y - DIVED_Y) * surfaced, scratch.p.z)
    // Face along the route; nose dips while diving and lifts while surfacing.
    const diving = phase > 0.6 && phase < 0.78
    const rising = phase < 0.12
    g.rotation.set(diving ? 0.18 : rising ? -0.12 : 0, Math.atan2(scratch.t.x, scratch.t.z), Math.sin(time * 0.4) * 0.04, 'YXZ')

    if (tail.current) tail.current.rotation.x = Math.sin(time * 1.3) * 0.28

    // Glowing spots: faint by day, bright (bloomed) at night.
    dotMaterial.color.copy(DOT_COLOR).multiplyScalar(0.7 + envState.night * 2.6)

    // Spout: a white column that shoots up and fades.
    if (spout.current) {
      const a = (time - spoutStart.current) / SPOUT_TIME
      spout.current.visible = a >= 0 && a <= 1
      if (spout.current.visible) {
        const height = 0.3 + Math.sin(Math.min(a * 2, 1) * Math.PI * 0.5) * 3.2
        spout.current.scale.set(0.5 + a * 0.6, height, 0.5 + a * 0.6)
        // The unit cone is centred on its origin, so lift it by half its height to grow upward.
        spout.current.position.y = SPOUT_BASE_Y + height / 2
        ;(spout.current.material as MeshBasicMaterial).opacity = (1 - a) * 0.75
      }
    }
  })

  return (
    <group ref={root}>
      {/* Body + head */}
      <mesh material={materials.whale} scale={[2.2, 1.5, 6.5]}>
        <sphereGeometry args={[1, 14, 10]} />
      </mesh>
      {/* Pectoral fins */}
      {[-1, 1].map((side) => (
        <mesh key={side} material={materials.whaleFin} position={[side * 2.1, -0.7, 2]} rotation={[0, side * 0.5, side * -0.35]} scale={[1.8, 0.15, 0.7]}>
          <sphereGeometry args={[1, 10, 6]} />
        </mesh>
      ))}
      {/* Tail: a tapering stock with flukes, waving from a pivot behind the body */}
      <group ref={tail} position-z={-5.2}>
        <mesh material={materials.whale} position-z={-2.2} rotation-x={-Math.PI / 2}>
          <coneGeometry args={[1.25, 4.6, 10]} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} material={materials.whaleFin} position={[side * 1.5, 0, -4.6]} rotation-y={side * -0.45} scale={[2.1, 0.18, 0.85]}>
            <sphereGeometry args={[1, 10, 6]} />
          </mesh>
        ))}
      </group>
      {/* Glowing spots along the back */}
      <InstancedProp geometry={dotGeometry} material={dotMaterial} matrices={dots} />
      {/* Blowhole spout: an upside-down open cone, so the spray widens as it rises */}
      <mesh ref={spout} material={spoutMaterial} position={[0, SPOUT_BASE_Y, 3.6]} rotation-x={Math.PI} visible={false}>
        <coneGeometry args={[0.6, 1, 8, 1, true]} />
      </mesh>
    </group>
  )
}
