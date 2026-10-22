import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  Matrix4,
  MeshBasicMaterial,
  OctahedronGeometry,
  SphereGeometry,
  TorusGeometry,
  type InstancedMesh,
} from 'three'
import { envState } from '../environment/dayNight'
import { DECK_Y, PIER_WIDTH, STAIR_WIDTH, dockLayout } from '../islands/dockLayout'
import { GROUND_Y, ISLANDS } from '../layout'
import { materials } from '../materials'
import { seededRandom } from '../models/geometry'
import InstancedProp from '../models/InstancedProp'
import { scenery } from '../scenery'
import SeasonParticles from './SeasonParticles'

/*
 * Winter / Christmas decorations. Everything repeated is instanced (one draw call per kind).
 * Glowing bits (ornaments, star, string lights) use toneMapped=false materials whose colour is
 * pushed above 1 at night, so the night bloom makes them shine.
 */

const ORNAMENT_COLORS = ['#e63946', '#ffd166', '#4ea8de', '#e9ecef', '#2a9d8f'].map((c) => new Color(c))
const LIGHT_COLORS = ['#ff4d4d', '#3ddc84', '#ffd23f', '#4dabff'].map((c) => new Color(c))
const GIFT_COLORS = ['#e63946', '#2a9d8f', '#4361ee', '#f4a261', '#9b5de5'].map((c) => new Color(c))

// Module-level glow materials (one winter scene at a time) so the frame loop can brighten them.
const ornamentMaterial = new MeshBasicMaterial({ color: '#ffffff', toneMapped: false })
const starMaterial = new MeshBasicMaterial({ color: '#ffd84d', toneMapped: false })
const bulbMaterial = new MeshBasicMaterial({ color: '#ffffff', toneMapped: false })
const STAR_BASE = new Color('#ffd84d')

/** Pine foliage top sits at y = 4.6 in the pine's own (unscaled) frame; see pineFoliageGeometry. */
const PINE_TIP_Y = 4.6
/** Snowmen are modelled ~2.3 units tall and scaled up to read well from the bird's-eye camera. */
const SNOWMAN_SCALE = 2
const CANE_SCALE = 1.5

/**
 * Snowman parts in its own frame (base on the ground at the origin, facing +Z):
 * [geometry key, x, y, z, scaleX, scaleY, scaleZ, rotX, rotZ]
 */
type SnowmanPart = ['snow' | 'coal' | 'nose' | 'arm' | 'brim' | 'hat' | 'scarf', number, number, number, number, number, number, number, number]
const SNOWMAN_PARTS: SnowmanPart[] = [
  ['snow', 0, 0.5, 0, 0.55, 0.55, 0.55, 0, 0], // bottom
  ['snow', 0, 1.25, 0, 0.42, 0.42, 0.42, 0, 0], // middle
  ['snow', 0, 1.82, 0, 0.3, 0.3, 0.3, 0, 0], // head
  ['coal', -0.1, 1.88, 0.26, 0.045, 0.045, 0.045, 0, 0], // eyes
  ['coal', 0.1, 1.88, 0.26, 0.045, 0.045, 0.045, 0, 0],
  ['coal', 0, 1.42, 0.39, 0.05, 0.05, 0.05, 0, 0], // buttons
  ['coal', 0, 1.24, 0.42, 0.05, 0.05, 0.05, 0, 0],
  ['coal', 0, 1.06, 0.4, 0.05, 0.05, 0.05, 0, 0],
  ['nose', 0, 1.8, 0.42, 1, 1, 1, Math.PI / 2, 0], // carrot, pointing forward
  ['arm', -0.62, 1.38, 0, 1, 1, 1, 0, 1.0], // stick arms
  ['arm', 0.62, 1.38, 0, 1, 1, 1, 0, -1.0],
  ['brim', 0, 2.08, 0, 0.34, 0.05, 0.34, 0, 0], // top hat
  ['hat', 0, 2.3, 0, 0.21, 0.4, 0.21, 0, 0],
  ['scarf', 0, 1.6, 0, 1, 1, 1, Math.PI / 2, 0],
]

const at = (m: Matrix4, x: number, y: number, z: number, s = 1) =>
  m.clone().multiply(new Matrix4().makeScale(s, s, s).setPosition(x, y, z))

function useWinterLayout() {
  return useMemo(() => {
    const rand = seededRandom(1225)

    // Snow caps on every pine tip; ornaments + star on roughly a third of them.
    const snowCaps: Matrix4[] = []
    const ornaments: Matrix4[] = []
    const ornamentColors: Color[] = []
    const stars: Matrix4[] = []
    // Ornament rings per foliage tier: [height, radius at that height, count]
    const tiers: [number, number, number][] = [
      [1.55, 1.12, 4],
      [2.75, 0.82, 3],
      [3.75, 0.5, 2],
    ]
    scenery.pineFoliage.matrices.forEach((pine, i) => {
      snowCaps.push(at(pine, 0, PINE_TIP_Y - 0.36, 0))
      if (i % 3 !== 0) return
      tiers.forEach(([y, r, n]) => {
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2 + rand() * 0.8
          ornaments.push(at(pine, Math.cos(a) * r, y, Math.sin(a) * r, 0.17))
          ornamentColors.push(ORNAMENT_COLORS[Math.floor(rand() * ORNAMENT_COLORS.length)])
        }
      })
      stars.push(at(pine, 0, PINE_TIP_Y + 0.25, 0, 0.32))
    })

    // String lights along both sides of every dock: down the stairs, then along the pier.
    const bulbs: Matrix4[] = []
    const bulbColors: Color[] = []
    ISLANDS.forEach((island) => {
      const d = dockLayout(island)
      const sides: [number, number][] = [
        [-1, STAIR_WIDTH / 2 + 0.05],
        [1, STAIR_WIDTH / 2 + 0.05],
      ]
      const addBulb = (x: number, y: number, z: number) => {
        bulbs.push(new Matrix4().makeScale(0.12, 0.12, 0.12).setPosition(d.toWorld(x, y, z)))
        bulbColors.push(LIGHT_COLORS[bulbs.length % LIGHT_COLORS.length])
      }
      sides.forEach(([side, half]) => {
        // Stairs: follow the slope from the grass down to the deck.
        for (let z = d.stairsStart; z < d.pierStart; z += 0.55) {
          const t = (z - d.stairsStart) / (d.pierStart - d.stairsStart)
          addBulb(side * half, GROUND_Y + (DECK_Y - GROUND_Y) * t + 0.45, z)
        }
        // Pier: along the deck edge with a gentle sag between posts.
        for (let z = d.pierStart; z <= d.pierEnd; z += 0.5) {
          const sag = Math.sin(((z - d.pierStart) / 1.5) * Math.PI) * 0.08
          addBulb(side * (PIER_WIDTH / 2), DECK_Y + 0.5 - Math.abs(sag), z)
        }
      })
    })

    // Reserved spots → gift piles and snowmen, on the section islands AND the small islets.
    //   Section islands (6 spots each): #3 and #4 snowmen, the rest gift piles.
    //   Islets (3 spots each): #0 snowman, #1 and #2 gift piles.
    const gifts: Matrix4[] = []
    const giftColors: Color[] = []
    const ribbons: Matrix4[] = []
    const bows: Matrix4[] = []
    const snowmen: Matrix4[] = []
    const addGiftPile = (x: number, y: number, z: number, spread: number) => {
      const count = 3 + Math.floor(rand() * 2)
      for (let g = 0; g < count; g++) {
        const size = 1.0 + rand() * 0.6
        const yaw = rand() * Math.PI
        const base = new Matrix4()
          .makeRotationY(yaw)
          .setPosition(x + (rand() - 0.5) * spread, y + size / 2, z + (rand() - 0.5) * spread)
        gifts.push(base.clone().multiply(new Matrix4().makeScale(size, size, size)))
        giftColors.push(GIFT_COLORS[Math.floor(rand() * GIFT_COLORS.length)])
        // Two ribbons crossing over the top, and a bow.
        ribbons.push(base.clone().multiply(new Matrix4().makeScale(size * 1.02, size * 1.02, size * 0.16)))
        ribbons.push(base.clone().multiply(new Matrix4().makeScale(size * 0.16, size * 1.02, size * 1.02)))
        bows.push(base.clone().multiply(new Matrix4().makeScale(size * 0.22, size * 0.15, size * 0.22).setPosition(0, size / 2 + size * 0.06, 0)))
      }
    }
    const isletSpots = scenery.decorSpots.filter((s) => s.islet)
    const islandSpotIndex = new Map<string, number>()
    scenery.decorSpots.forEach((spot) => {
      // Islet spots come in consecutive groups of 3 per islet; island spots are counted per island.
      let index: number
      if (spot.islet) {
        index = isletSpots.indexOf(spot) % 3
      } else {
        index = islandSpotIndex.get(spot.island ?? '') ?? 0
        islandSpotIndex.set(spot.island ?? '', index + 1)
      }

      const snowmanHere = spot.islet ? index === 0 : index === 3 || index === 4
      if (snowmanHere) {
        // Island snowmen face roughly toward the default camera (+Z); islet ones face out to sea.
        const yaw = spot.islet ? spot.yaw : (rand() - 0.5) * 1.2
        snowmen.push(new Matrix4().makeRotationY(yaw).multiply(new Matrix4().makeScale(SNOWMAN_SCALE, SNOWMAN_SCALE, SNOWMAN_SCALE)).setPosition(spot.x, spot.y, spot.z))
      } else {
        addGiftPile(spot.x, spot.y, spot.z, spot.islet ? 1.4 : 2.2)
      }
    })

    // Candy canes lining both sides of each stepping-stone path. Stripes are alternating
    // short red/white cylinder segments; the hook is a half torus.
    const redSegs: Matrix4[] = []
    const whiteSegs: Matrix4[] = []
    const hooks: Matrix4[] = []
    const SEG = 0.26
    const SEGMENTS = 8
    ISLANDS.forEach((island) => {
      const d = dockLayout(island)
      for (let z = island.radius * 0.58; z < d.stairsStart - 0.6; z += 3) {
        for (const side of [-1, 1]) {
          // The cane's hook curls toward its local +X. Island-local +X is world yaw `d.yaw`, so
          // canes on the +X side use d.yaw and those on the -X side turn round: hooks face outward.
          const base = new Matrix4()
            .makeRotationY(side > 0 ? d.yaw : d.yaw + Math.PI)
            .multiply(new Matrix4().makeScale(CANE_SCALE, CANE_SCALE, CANE_SCALE))
            .setPosition(d.toWorld(side * 2.3, GROUND_Y, z))
          for (let s = 0; s < SEGMENTS; s++) {
            const seg = base.clone().multiply(new Matrix4().setPosition(0, SEG * (s + 0.5), 0))
            ;(s % 2 ? whiteSegs : redSegs).push(seg)
          }
          hooks.push(base.clone().multiply(new Matrix4().setPosition(0.3, SEG * SEGMENTS, 0)))
        }
      }
    })

    return { snowCaps, ornaments, ornamentColors, stars, bulbs, bulbColors, gifts, giftColors, ribbons, bows, redSegs, whiteSegs, hooks, snowmen }
  }, [])
}

export default function WinterDecor() {
  const layout = useWinterLayout()
  const bulbsRef = useRef<InstancedMesh>(null)

  const geometries = useMemo(
    () => ({
      snowCap: new ConeGeometry(0.46, 0.75, 7),
      ornament: new SphereGeometry(1, 8, 6),
      star: new OctahedronGeometry(1, 0),
      bulb: new SphereGeometry(1, 6, 4),
      gift: new BoxGeometry(1, 1, 1),
      bow: new SphereGeometry(1, 8, 6),
      caneSeg: new CylinderGeometry(0.09, 0.09, 0.26, 8),
      // Half torus arching up and over from the shaft top (left end sits at x = -0.3 → shaft).
      hook: new TorusGeometry(0.3, 0.09, 6, 12, Math.PI),
      // Snowman parts (unit shapes scaled per part, or fixed-size pieces)
      snow: new SphereGeometry(1, 14, 10),
      coal: new SphereGeometry(1, 6, 4),
      nose: new ConeGeometry(0.06, 0.34, 6),
      arm: new CylinderGeometry(0.025, 0.035, 0.85, 4),
      brim: new CylinderGeometry(1, 1, 1, 14),
      hat: new CylinderGeometry(1, 1, 1, 14),
      scarf: new TorusGeometry(0.31, 0.07, 6, 16),
    }),
    [],
  )
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries])

  // Expand every snowman into per-part matrices, grouped by part type (one instanced draw each).
  const snowmanParts = useMemo(() => {
    const groups: Record<SnowmanPart[0], Matrix4[]> = { snow: [], coal: [], nose: [], arm: [], brim: [], hat: [], scarf: [] }
    layout.snowmen.forEach((base) => {
      SNOWMAN_PARTS.forEach(([key, x, y, z, sx, sy, sz, rx, rz]) => {
        const local = new Matrix4()
          .makeRotationFromEuler(new Euler(rx, 0, rz))
          .multiply(new Matrix4().makeScale(sx, sy, sz))
          .setPosition(x, y, z)
        groups[key].push(base.clone().multiply(local))
      })
    })
    return groups
  }, [layout])

  // String light colours are set per instance once; the frame loop twinkles them.
  useLayoutEffect(() => {
    const mesh = bulbsRef.current
    if (!mesh) return
    layout.bulbs.forEach((m, i) => {
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, layout.bulbColors[i])
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [layout])

  useFrame((state) => {
    const n = envState.night
    ornamentMaterial.color.setScalar(1 + n * 1.6)
    starMaterial.color.copy(STAR_BASE).multiplyScalar(1.1 + n * 2.4)
    // Twinkle: the whole string pulses; individual colours come from the instance colours.
    const t = state.clock.elapsedTime
    bulbMaterial.color.setScalar((1 + n * 2.2) * (0.8 + Math.sin(t * 3) * 0.2))
  })

  return (
    <>
      <SeasonParticles kind="snow" />
      <InstancedProp geometry={geometries.snowCap} material={materials.white} matrices={layout.snowCaps} />
      <InstancedProp geometry={geometries.ornament} material={ornamentMaterial} matrices={layout.ornaments} colors={layout.ornamentColors} />
      <InstancedProp geometry={geometries.star} material={starMaterial} matrices={layout.stars} />
      <instancedMesh ref={bulbsRef} args={[geometries.bulb, bulbMaterial, layout.bulbs.length]} />
      <InstancedProp geometry={geometries.gift} material={materials.tintable} matrices={layout.gifts} colors={layout.giftColors} />
      <InstancedProp geometry={geometries.gift} material={materials.gold} matrices={layout.ribbons} />
      <InstancedProp geometry={geometries.bow} material={materials.gold} matrices={layout.bows} />
      <InstancedProp geometry={geometries.caneSeg} material={materials.red} matrices={layout.redSegs} />
      <InstancedProp geometry={geometries.caneSeg} material={materials.white} matrices={layout.whiteSegs} />
      <InstancedProp geometry={geometries.hook} material={materials.red} matrices={layout.hooks} />
      {/* Snowmen */}
      <InstancedProp geometry={geometries.snow} material={materials.white} matrices={snowmanParts.snow} />
      <InstancedProp geometry={geometries.coal} material={materials.bat} matrices={snowmanParts.coal} />
      <InstancedProp geometry={geometries.nose} material={materials.fish} matrices={snowmanParts.nose} />
      <InstancedProp geometry={geometries.arm} material={materials.darkWood} matrices={snowmanParts.arm} />
      <InstancedProp geometry={geometries.brim} material={materials.bat} matrices={snowmanParts.brim} />
      <InstancedProp geometry={geometries.hat} material={materials.bat} matrices={snowmanParts.hat} />
      <InstancedProp geometry={geometries.scarf} material={materials.red} matrices={snowmanParts.scarf} />
    </>
  )
}
