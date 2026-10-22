import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  LatheGeometry,
  Matrix4,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  type Group,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { dockLayout } from '../islands/dockLayout'
import { GROUND_Y, ISLANDS, ISLETS, ISLET_GROUND_Y } from '../layout'
import { materials } from '../materials'
import { seededRandom } from '../models/geometry'
import InstancedProp from '../models/InstancedProp'
import { scenery, type DecorSpot } from '../scenery'

/*
 * Valentine's decorations:
 * - section islands: big flower patches, heart-balloon bunches, heart sculptures on plinths, and a
 *   rose arch over each stepping-stone path;
 * - small islets: a heart-balloon bunch, a bench with hearts, a flower patch, and a pink hot-air
 *   balloon hovering above each one.
 * (The pink/rose tint and warm sunset light come from the theme palette, which also tints the
 * everyday flowers pink.)
 */

const PATCH_COLORS = ['#ff4d8d', '#ff85b3', '#ffffff', '#e0115f', '#ffb3cf', '#c9184a'].map((c) => new Color(c))
const BALLOON_COLORS = ['#ff2e63', '#ff7aa8', '#e0115f'].map((c) => new Color(c))
const ROSE_COLORS = ['#e0115f', '#ff4d8d', '#ffffff', '#ff85b3'].map((c) => new Color(c))
const HOT_AIR_COLORS = ['#ff85b3', '#ff5c93', '#ffa3c4', '#f472b6', '#ff7aa8'] // all pinks

const FLOWERS_PER_PATCH = 22
const PATCH_RADIUS = 1.9
const BALLOON_SCALE = 1.0
const SCULPTURE_SCALE = 1.6
const ARCH_RADIUS = 2.6
const BENCH_SCALE = 1.4

// Glossy pink for the big heart sculptures; red for the little hearts on benches.
const sculptureMaterial = new MeshStandardMaterial({ color: '#ff5c93', roughness: 0.4, metalness: 0.1 })
const benchHeartMaterial = new MeshStandardMaterial({ color: '#e0115f', roughness: 0.4 })
const benchMaterial = new MeshStandardMaterial({ color: '#fff0f5', roughness: 0.7, flatShading: true })

/** A plump 3D heart: two spheres for the lobes and a cone for the point. ~2 units tall, centred. */
function heartGeometry() {
  const lobeL = new SphereGeometry(0.55, 14, 10).translate(-0.38, 0.32, 0)
  const lobeR = new SphereGeometry(0.55, 14, 10).translate(0.38, 0.32, 0)
  const point = new ConeGeometry(0.86, 1.25, 16).rotateZ(Math.PI).translate(0, -0.42, 0)
  const merged = mergeGeometries([lobeL, lobeR, point] as BufferGeometry[])!
  merged.scale(1, 1, 0.62) // flatten front-to-back
  return merged
}

interface Balloon {
  x: number
  z: number
  baseY: number
  height: number
  phase: number
  color: Color
}

/** A bunch of heart balloons on strings, gently bobbing and swaying (static with reduced motion). */
function BalloonBunch({ spot, balloons, geometry }: { spot: DecorSpot; balloons: Balloon[]; geometry: BufferGeometry }) {
  const groups = useRef<(Group | null)[]>([])
  const reducedMotion = useReducedMotion()
  useFrame((state) => {
    const t = reducedMotion ? 0 : state.clock.elapsedTime
    balloons.forEach((b, i) => {
      const g = groups.current[i]
      if (!g) return
      g.position.y = b.baseY + b.height + Math.sin(t * 1.2 + b.phase) * 0.3
      g.rotation.z = Math.sin(t * 0.8 + b.phase) * 0.08
      g.rotation.y = Math.sin(t * 0.5 + b.phase) * 0.4
    })
  })
  return (
    <group>
      {/* Little weight on the ground the strings are tied to */}
      <mesh material={materials.stone} position={[spot.x, spot.y + 0.2, spot.z]}>
        <cylinderGeometry args={[0.32, 0.4, 0.4, 8]} />
      </mesh>
      {balloons.map((b, i) => (
        <group key={i}>
          {/* String from the weight up to the balloon */}
          <mesh material={materials.white} position={[(spot.x + b.x) / 2, b.baseY + b.height / 2, (spot.z + b.z) / 2]}>
            <cylinderGeometry args={[0.025, 0.025, b.height, 3]} />
          </mesh>
          <group
            ref={(el) => {
              groups.current[i] = el
            }}
            position={[b.x, b.baseY + b.height, b.z]}
          >
            {/* Each balloon gets its own small glossy material in its colour. */}
            <mesh geometry={geometry} scale={BALLOON_SCALE} position-y={BALLOON_SCALE}>
              <meshStandardMaterial attach="material" color={b.color} roughness={0.3} metalness={0.05} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

/**
 * Classic teardrop hot-air balloon envelope (a revolved profile), from the narrow mouth at y = 0
 * up to the rounded crown at ~6.3. Flat shading shows the fabric gores.
 */
function envelopeGeometry() {
  const profile = [
    [0.4, 0], [0.55, 0.3], [1.0, 1.0], [1.6, 2.0], [2.15, 3.2], [2.35, 4.2],
    [2.2, 5.1], [1.7, 5.8], [0.9, 6.2], [0, 6.35],
  ].map(([r, y]) => new Vector2(r, y))
  return new LatheGeometry(profile, 14)
}

/**
 * Pink hot-air balloon: teardrop envelope, ropes and a wicker basket, hovering above an islet and
 * slowly drifting round it.
 */
function HotAirBalloon({ x, z, height, color, phase, geometry }: { x: number; z: number; height: number; color: string; phase: number; geometry: BufferGeometry }) {
  const g = useRef<Group>(null)
  const reducedMotion = useReducedMotion()
  useFrame((state) => {
    if (!g.current) return
    const t = reducedMotion ? 0 : state.clock.elapsedTime
    const a = phase + t * 0.12
    g.current.position.set(x + Math.cos(a) * 2.5, height + Math.sin(t * 0.7 + phase) * 0.8, z + Math.sin(a) * 2.5)
    g.current.rotation.y = phase + t * 0.15
  })
  return (
    <group ref={g}>
      {/* Envelope mouth sits just above the ropes */}
      <mesh geometry={geometry} position-y={0.2}>
        <meshStandardMaterial attach="material" color={color} roughness={0.45} flatShading />
      </mesh>
      {/* A lighter band around the widest part */}
      <mesh position-y={4.2}>
        <cylinderGeometry args={[2.37, 2.37, 0.5, 14, 1, true]} />
        <meshStandardMaterial attach="material" color="#ffe3ee" roughness={0.45} flatShading />
      </mesh>
      {/* Ropes from the basket corners up to the envelope's mouth */}
      {[
        [-0.5, -0.5],
        [0.5, -0.5],
        [-0.5, 0.5],
        [0.5, 0.5],
      ].map(([rx, rz], i) => (
        <mesh key={i} material={materials.darkWood} position={[rx * 0.7, -0.9, rz * 0.7]} rotation={[rz * -0.35, 0, rx * 0.35]}>
          <cylinderGeometry args={[0.03, 0.03, 2.2, 3]} />
        </mesh>
      ))}
      {/* Wicker basket */}
      <mesh material={materials.wood} position-y={-2.3}>
        <boxGeometry args={[1.4, 1, 1.4]} />
      </mesh>
      <mesh material={materials.darkWood} position-y={-1.78}>
        <boxGeometry args={[1.5, 0.12, 1.5]} />
      </mesh>
    </group>
  )
}

/** Park bench with little red hearts along the backrest. Faces local +Z. */
function HeartBench({ spot, heart }: { spot: DecorSpot; heart: BufferGeometry }) {
  return (
    <group position={[spot.x, spot.y, spot.z]} rotation-y={spot.yaw} scale={BENCH_SCALE}>
      <mesh material={benchMaterial} position-y={0.5}>
        <boxGeometry args={[2.2, 0.12, 0.65]} />
      </mesh>
      <mesh material={benchMaterial} position={[0, 0.95, -0.3]}>
        <boxGeometry args={[2.2, 0.55, 0.1]} />
      </mesh>
      {[-0.95, 0.95].map((x) => (
        <mesh key={x} material={materials.darkWood} position={[x, 0.25, 0]}>
          <boxGeometry args={[0.12, 0.5, 0.6]} />
        </mesh>
      ))}
      {[-0.7, 0, 0.7].map((x, i) => (
        <mesh key={x} geometry={heart} material={benchHeartMaterial} position={[x, 1.42 + (i === 1 ? 0.08 : 0), -0.3]} scale={i === 1 ? 0.28 : 0.22} />
      ))}
    </group>
  )
}

export default function ValentinesDecor() {
  const geometries = useMemo(
    () => ({
      flower: new IcosahedronGeometry(1, 0),
      heart: heartGeometry(),
      plinth: new CylinderGeometry(0.75, 0.9, 0.7, 10),
      // Half torus standing upright = an arch over the path (spans x = ±ARCH_RADIUS).
      arch: new TorusGeometry(ARCH_RADIUS, 0.16, 6, 28, Math.PI),
      envelope: envelopeGeometry(),
    }),
    [],
  )
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries])

  const layout = useMemo(() => {
    const rand = seededRandom(214)
    const flowers: Matrix4[] = []
    const flowerColors: Color[] = []
    const sculptures: Matrix4[] = []
    const plinths: Matrix4[] = []
    const bunches: { spot: DecorSpot; balloons: Balloon[] }[] = []
    const benches: DecorSpot[] = []

    const addFlowerPatch = (spot: DecorSpot, radius: number, count: number) => {
      for (let k = 0; k < count; k++) {
        // Uniform scatter inside a small disc.
        const a = rand() * Math.PI * 2
        const r = Math.sqrt(rand()) * radius
        const s = 0.3 + rand() * 0.15
        flowers.push(new Matrix4().makeScale(s, s, s).setPosition(spot.x + Math.cos(a) * r, spot.y + 0.28, spot.z + Math.sin(a) * r))
        flowerColors.push(PATCH_COLORS[Math.floor(rand() * PATCH_COLORS.length)])
      }
    }
    const addBunch = (spot: DecorSpot) => {
      bunches.push({
        spot,
        balloons: BALLOON_COLORS.map((color, k) => ({
          x: spot.x + (k - 1) * 1.0,
          z: spot.z + (rand() - 0.5) * 0.8,
          baseY: spot.y,
          height: 4.5 + k * 0.7 + rand() * 0.5,
          phase: rand() * Math.PI * 2,
          color,
        })),
      })
    }

    // Section islands: #3 balloons, #4 heart sculpture, the rest flower patches.
    // Islets: #0 balloons, #1 bench with hearts, #2 a small flower patch.
    const isletSpots = scenery.decorSpots.filter((s) => s.islet)
    const islandSpotIndex = new Map<string, number>()
    scenery.decorSpots.forEach((spot) => {
      if (spot.islet) {
        const index = isletSpots.indexOf(spot) % 3
        if (index === 0) addBunch(spot)
        else if (index === 1) benches.push(spot)
        else addFlowerPatch(spot, 1.1, 12)
        return
      }
      const index = islandSpotIndex.get(spot.island ?? '') ?? 0
      islandSpotIndex.set(spot.island ?? '', index + 1)
      if (index === 3) {
        addBunch(spot)
      } else if (index === 4) {
        const ps = SCULPTURE_SCALE * 0.9
        plinths.push(new Matrix4().makeScale(ps, ps, ps).setPosition(spot.x, spot.y + 0.35 * ps, spot.z))
        sculptures.push(
          new Matrix4()
            .makeRotationY(spot.yaw)
            .multiply(new Matrix4().makeScale(SCULPTURE_SCALE, SCULPTURE_SCALE, SCULPTURE_SCALE))
            .setPosition(spot.x, spot.y + 0.7 * ps + SCULPTURE_SCALE, spot.z),
        )
      } else {
        addFlowerPatch(spot, PATCH_RADIUS, FLOWERS_PER_PATCH)
      }
    })

    // A rose arch over each stepping-stone path, near where it meets the dock stairs.
    const arches: Matrix4[] = []
    const roses: Matrix4[] = []
    const roseColors: Color[] = []
    ISLANDS.forEach((island) => {
      const d = dockLayout(island)
      const z = d.stairsStart - 1.8
      const base = new Matrix4().makeRotationY(d.yaw).setPosition(d.toWorld(0, GROUND_Y, z))
      arches.push(base.clone().multiply(new Matrix4().makeScale(1, 1.25, 1)))
      // Roses scattered along the arch (half circle of ARCH_RADIUS, stretched 1.25× vertically).
      for (let k = 0; k <= 26; k++) {
        const a = (k / 26) * Math.PI + (rand() - 0.5) * 0.08
        const s = 0.26 + rand() * 0.14
        roses.push(
          base.clone().multiply(new Matrix4().makeScale(s, s, s).setPosition(Math.cos(a) * ARCH_RADIUS, Math.sin(a) * ARCH_RADIUS * 1.25, (rand() - 0.5) * 0.3)),
        )
        roseColors.push(ROSE_COLORS[Math.floor(rand() * ROSE_COLORS.length)])
      }
    })

    // A pink hot-air balloon hovering above every islet.
    const hotAir = ISLETS.map((islet, i) => ({
      x: islet.x,
      z: islet.z,
      height: ISLET_GROUND_Y + 13 + (i % 3) * 2.5,
      color: HOT_AIR_COLORS[i % HOT_AIR_COLORS.length],
      phase: rand() * Math.PI * 2,
    }))

    return { flowers, flowerColors, sculptures, plinths, bunches, benches, arches, roses, roseColors, hotAir }
  }, [])

  return (
    <>
      {/* Uses the shared rocks/props material (white base), not the theme-tinted flower material,
          so these patches keep their own true colours. */}
      <InstancedProp geometry={geometries.flower} material={materials.tintable} matrices={layout.flowers} colors={layout.flowerColors} />
      <InstancedProp geometry={geometries.plinth} material={materials.stone} matrices={layout.plinths} />
      <InstancedProp geometry={geometries.heart} material={sculptureMaterial} matrices={layout.sculptures} />
      <InstancedProp geometry={geometries.arch} material={materials.white} matrices={layout.arches} />
      <InstancedProp geometry={geometries.flower} material={materials.tintable} matrices={layout.roses} colors={layout.roseColors} />
      {layout.bunches.map((b, i) => (
        <BalloonBunch key={i} spot={b.spot} balloons={b.balloons} geometry={geometries.heart} />
      ))}
      {layout.benches.map((spot, i) => (
        <HeartBench key={i} spot={spot} heart={geometries.heart} />
      ))}
      {layout.hotAir.map((b, i) => (
        <HotAirBalloon key={i} {...b} geometry={geometries.envelope} />
      ))}
    </>
  )
}
