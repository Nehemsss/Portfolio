import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BoxGeometry,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Shape,
  type Group,
} from 'three'
import { envState } from '../environment/dayNight'

/*
 * Flight path: a wobbly loop around the Home Island through the middle of the map, passing over
 * the small islets and the near edges of the section islands, so it's usually on screen.
 * Radius 42–50 from the centre keeps it well clear of the lighthouse (Home) and every landmark,
 * and FLIGHT_HEIGHT clears the tallest pines/palms it passes over (~12.5 units).
 */
const LOOP_RADIUS = 46
const LOOP_WOBBLE = 4 // radius varies ±4 so it weaves rather than tracing a perfect circle
const FLIGHT_HEIGHT = 16
const SPEED = 6 // units per second (~50 s per lap)
const GLOW = new Color('#7dffb0')

// Module-level materials (one ghost ship) so the frame loop can pulse the glow freely.
// Hull and trim glow green from within at night; sails, rails and lantern are neon (toneMapped=false
// lets their colour go well above 1, which the night bloom turns into a strong halo).
// fog: false on the neon parts so Halloween's thick fog never dims the glow.
const hullMaterial = new MeshStandardMaterial({ color: '#23302a', roughness: 0.9, flatShading: true, emissive: '#2bff88', emissiveIntensity: 0 })
const trimMaterial = new MeshStandardMaterial({ color: '#2f3d36', roughness: 0.9, flatShading: true, emissive: '#2bff88', emissiveIntensity: 0 })
const sailMaterial = new MeshBasicMaterial({ color: GLOW.clone(), transparent: true, opacity: 0.8, side: DoubleSide, depthWrite: false, toneMapped: false, fog: false })
const neonMaterial = new MeshBasicMaterial({ color: GLOW.clone(), toneMapped: false, fog: false })

/** Hull: a pointed outline extruded down, bow along +Z (same trick as the player's boat). */
function hullGeometry() {
  const s = new Shape()
  s.moveTo(-1.6, -5)
  s.lineTo(1.6, -5)
  s.lineTo(1.8, 1.8)
  s.quadraticCurveTo(1.2, 4.6, 0, 5.6)
  s.quadraticCurveTo(-1.2, 4.6, -1.8, 1.8)
  s.closePath()
  const geo = new ExtrudeGeometry(s, { depth: 1.8, bevelEnabled: false })
  geo.rotateX(Math.PI / 2) // shape +Y → +Z (bow forward), extrusion → downward
  return geo
}

/** A tattered sail: a thin panel with a ragged bottom edge (alternating short/long strips). */
function Sail({ y, z, width, height }: { y: number; z: number; width: number; height: number }) {
  const strips = 5
  const w = width / strips
  return (
    <group position={[0, y, z]}>
      {Array.from({ length: strips }, (_, i) => {
        const h = height * (i % 2 ? 0.72 : 1) * (0.9 + ((i * 37) % 10) / 50)
        return (
          <mesh key={i} material={sailMaterial} position={[-width / 2 + w * (i + 0.5), -h / 2, 0]}>
            <boxGeometry args={[w * 0.92, h, 0.04]} />
          </mesh>
        )
      })}
    </group>
  )
}

/**
 * Halloween night only: the Flying Dutchman, a ghost ship with glowing, torn green sails, flying a
 * slow weaving loop through the middle of the map (see LOOP_RADIUS), bobbing and rolling eerily.
 */
export default function GhostShip() {
  const root = useRef<Group>(null)
  // Start due south of Home (+Z), near where the boat starts, so it shows up quickly.
  const angle = useRef(Math.PI / 2)

  const hull = useMemo(() => hullGeometry(), [])
  useEffect(() => () => hull.dispose(), [hull])
  const deck = useMemo(() => new BoxGeometry(3.2, 0.2, 9.4), [])
  useEffect(() => () => deck.dispose(), [deck])

  useFrame((state, rawDt) => {
    const g = root.current
    if (!g) return
    const dt = Math.min(rawDt, 0.25)
    const t = state.clock.elapsedTime

    // Polar loop: r(a) = R + W·sin(3a). Advance the angle so ground speed stays ≈ SPEED.
    const a = angle.current
    const r = LOOP_RADIUS + LOOP_WOBBLE * Math.sin(3 * a)
    angle.current = (a + (SPEED * dt) / r) % (Math.PI * 2)
    // Heading = derivative of the position with respect to the angle.
    const dr = 3 * LOOP_WOBBLE * Math.cos(3 * a)
    const dx = -Math.sin(a) * r + Math.cos(a) * dr
    const dz = Math.cos(a) * r + Math.sin(a) * dr

    g.position.set(Math.cos(a) * r, FLIGHT_HEIGHT + Math.sin(t * 0.8) * 0.6, Math.sin(a) * r)
    // Face along the path, bank into the (counter-clockwise) turn, and pitch gently as it bobs.
    g.rotation.set(Math.sin(t * 0.8) * 0.05, Math.atan2(dx, dz), 0.12 + Math.sin(t * 0.5) * 0.05, 'YXZ')

    const n = envState.night
    const flicker = 0.88 + Math.sin(t * 7) * 0.07 + Math.sin(t * 13) * 0.05
    hullMaterial.emissiveIntensity = n * 0.55 * flicker
    trimMaterial.emissiveIntensity = n * 0.8 * flicker
    sailMaterial.color.copy(GLOW).multiplyScalar(1.4 + n * 3 * flicker)
    sailMaterial.opacity = 0.6 + n * 0.3
    neonMaterial.color.copy(GLOW).multiplyScalar(1.6 + n * 4 * flicker)
  })

  return (
    <group ref={root}>
      <mesh geometry={hull} material={hullMaterial} />
      <mesh geometry={deck} material={trimMaterial} position-y={0.1} position-z={0.2} />
      {/* Raised stern castle */}
      <mesh material={hullMaterial} position={[0, 0.8, -3.8]}>
        <boxGeometry args={[3, 1.4, 2.2]} />
      </mesh>
      {/* Bowsprit */}
      <mesh material={trimMaterial} position={[0, 0.6, 6.3]} rotation-x={-1.2}>
        <cylinderGeometry args={[0.08, 0.12, 2.8, 5]} />
      </mesh>
      {/* Masts with yards and torn glowing sails */}
      {(
        [
          [2.2, 7.5, 2.6],
          [-0.6, 8.5, 3],
          [-3.2, 6, 2.2],
        ] as [number, number, number][]
      ).map(([z, h, w]) => (
        <group key={z}>
          <mesh material={trimMaterial} position={[0, h / 2, z]}>
            <cylinderGeometry args={[0.1, 0.14, h, 6]} />
          </mesh>
          <mesh material={trimMaterial} position={[0, h - 0.6, z]}>
            <boxGeometry args={[w + 0.6, 0.12, 0.12]} />
          </mesh>
          <Sail y={h - 0.7} z={z + 0.06} width={w} height={h * 0.55} />
        </group>
      ))}
      {/* Neon rails along both deck edges, and round the stern castle */}
      {[-1, 1].map((side) => (
        <mesh key={side} material={neonMaterial} position={[side * 1.55, 0.55, 0.6]}>
          <boxGeometry args={[0.08, 0.08, 8.4]} />
        </mesh>
      ))}
      <mesh material={neonMaterial} position={[0, 1.55, -2.7]}>
        <boxGeometry args={[3.05, 0.08, 0.08]} />
      </mesh>
      {/* Stern lantern and a bow lantern */}
      <mesh material={neonMaterial} position={[0, 2, -4.95]}>
        <boxGeometry args={[0.5, 0.6, 0.5]} />
      </mesh>
      <mesh material={neonMaterial} position={[0, 1.2, 5.3]}>
        <boxGeometry args={[0.35, 0.45, 0.35]} />
      </mesh>
    </group>
  )
}
