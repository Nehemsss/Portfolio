/**
 * Procedural island shapes and props, precomputed once.
 *
 * Each island is an organic disc in its own local frame (local +Z faces the dock):
 *   - an irregular outline (radius wobbles with a few sine waves), extruded into a dirt cliff
 *   - a grass cap inset from the edge, leaving a light rim around the top
 * Props (pines, palms, bushes, flowers, boulders, path stones) are stored as world matrices
 * so each type is ONE instanced draw call for the whole world.
 */
import { Color, Euler, Matrix4, Quaternion, Vector2, Vector3 } from 'three'
import { GROUND_Y, ISLANDS, ISLET_GROUND_Y, ISLETS, facingDock, type IslandId } from './layout'
import { seededRandom } from './models/geometry'

/** Radius around each island centre kept clear of props for its landmark (already × LANDMARK_SCALE). */
const LANDMARK_CLEARANCE: Record<IslandId, number> = {
  home: 14.6, // farm field reaches ~7.05 units out (× LANDMARK_SCALE 2)
  about: 9.8,
  achievements: 9.8,
  skills: 13.2,
  education: 11.2,
}

/** Islands that get a little pond (they have room beside their landmark). */
const HAS_POND: Partial<Record<IslandId, true>> = { about: true, achievements: true, education: true }

/** Half-width (radians) of the sector in front of each landmark kept clear for the path to the dock. */
const DOCK_PATH_HALF_ANGLE = 0.45
const FRONT = Math.PI / 2 // local +Z, in (cos φ, sin φ) → (x, z) polar terms

const PALETTE = {
  pine: ['#3f9a4a', '#4cab52', '#2f8a45', '#5bb85a'],
  bush: ['#5fae3c', '#6cbf45', '#4f9e36'],
  flower: ['#ff6b8b', '#ffd23f', '#ffffff', '#ff9f43', '#c56cf0'],
  rock: ['#9aa3ad', '#8a929c', '#aab2bb'],
}

export interface InstanceSet {
  matrices: Matrix4[]
  colors: Color[]
}

/** A free ground spot (world space) reserved for seasonal decorations. */
export interface DecorSpot {
  island: IslandId | null
  islet: boolean
  x: number
  y: number
  z: number
  /** Suggested facing (radians about Y); on islets it faces outward from the palm. */
  yaw: number
}

export interface IslandShape {
  x: number
  z: number
  yaw: number
  /** Irregular outline in the island's local XZ plane (as Vector2(x, z)). */
  outline: Vector2[]
  /** Height of the grass surface. */
  groundY: number
  /** Grass cap size relative to the outline (the rest of the top shows as a light rim). */
  capScale: number
  islet: boolean
}

const set = (): InstanceSet => ({ matrices: [], colors: [] })
const angleDiff = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))
const pick = <T,>(arr: T[], r: number) => arr[Math.floor(r * arr.length) % arr.length]

function localMatrix(frame: Matrix4, x: number, y: number, z: number, yaw = 0, sx = 1, sy = sx, sz = sx, tilt = 0) {
  return frame
    .clone()
    .multiply(
      new Matrix4().compose(
        new Vector3(x, y, z),
        new Quaternion().setFromEuler(new Euler(tilt, yaw, tilt * 0.6)),
        new Vector3(sx, sy, sz),
      ),
    )
}

/** Wobbly circle: a few low-frequency sine waves keep it organic without spikes. */
function makeOutline(radius: number, rand: () => number, points = 44): Vector2[] {
  const p1 = rand() * 6.28
  const p2 = rand() * 6.28
  const p3 = rand() * 6.28
  return Array.from({ length: points }, (_, i) => {
    const a = (i / points) * Math.PI * 2
    const wobble = 0.035 * Math.sin(3 * a + p1) + 0.02 * Math.sin(5 * a + p2) + 0.012 * Math.sin(8 * a + p3)
    // Stay inside the collision radius (0.93R–1.0R) so the boat never clips through the cliff.
    const r = radius * (0.965 + wobble)
    return new Vector2(Math.cos(a) * r, Math.sin(a) * r)
  })
}

function buildScenery() {
  const shapes: IslandShape[] = []
  const pineTrunks: Matrix4[] = []
  const pineFoliage = set()
  const palms: Matrix4[] = []
  const bushes = set()
  const flowers = set()
  const rocks = set()
  const stones: Matrix4[] = []
  const ponds: Matrix4[] = []
  const decorSpots: DecorSpot[] = []

  const islands = [
    ...ISLANDS.map((isl) => ({ ...isl, islet: false })),
    ...ISLETS.map((isl, k) => ({ ...isl, id: null, dockAngle: k * 1.3, islet: true })),
  ]

  islands.forEach((island, idx) => {
    const rand = seededRandom(101 + idx * 7)
    const yaw = facingDock(island.dockAngle)
    const frame = new Matrix4().compose(
      new Vector3(island.x, 0, island.z),
      new Quaternion().setFromEuler(new Euler(0, yaw, 0)),
      new Vector3(1, 1, 1),
    )
    const R = island.radius
    const groundY = island.islet ? ISLET_GROUND_Y : GROUND_Y
    const capScale = island.islet ? 0.55 : 0.93
    shapes.push({ x: island.x, z: island.z, yaw, outline: makeOutline(R, rand), groundY, capScale, islet: island.islet })

    const clearance = island.id ? LANDMARK_CLEARANCE[island.id] : 0
    // Props stay on the grass cap, inside its edge.
    const maxR = R * capScale * 0.86
    const occupied: { x: number; z: number; r: number }[] = []
    const isFree = (x: number, z: number, r: number) => occupied.every((o) => Math.hypot(x - o.x, z - o.z) > o.r + r)

    const isValid = (x: number, z: number, radius: number, minD: number) => {
      const d = Math.hypot(x, z)
      if (d < minD || d > maxR) return false
      if (!island.islet && angleDiff(Math.atan2(z, x), FRONT) < DOCK_PATH_HALF_ANGLE) return false
      return isFree(x, z, radius)
    }

    /**
     * Random free spot on the grass, outside the landmark and the dock path.
     * With `near`, it searches a ring around that point instead, which grows props in clusters.
     */
    const spot = (
      radius: number,
      minD = clearance,
      tries = 30,
      near?: { x: number; z: number; gap: number },
    ): [number, number] | null => {
      for (let t = 0; t < tries; t++) {
        let x: number
        let z: number
        if (near) {
          const a = rand() * Math.PI * 2
          const r = near.gap * (1 + rand() * 0.6)
          x = near.x + Math.cos(a) * r
          z = near.z + Math.sin(a) * r
        } else {
          const phi = rand() * Math.PI * 2
          const d = minD + Math.sqrt(rand()) * Math.max(maxR - minD, 0.1)
          x = Math.cos(phi) * d
          z = Math.sin(phi) * d
        }
        if (isValid(x, z, radius, minD)) return [x, z]
      }
      return null
    }

    // Stepping-stone path from the landmark's front to the island edge (toward the dock).
    if (!island.islet) {
      for (let z = clearance * 0.8; z < R * 0.9; z += 2) {
        const x = (rand() - 0.5) * 1
        stones.push(localMatrix(frame, x, groundY + 0.03, z, rand() * 3, 0.95 + rand() * 0.25, 0.15, 0.8 + rand() * 0.25))
        occupied.push({ x, z, r: 1.3 })
      }
    }

    // Pond with a ring of pebbles.
    if (island.id && HAS_POND[island.id]) {
      const radius = 2.6
      const s = spot(radius + 1)
      if (s) {
        const [x, z] = s
        // Unit-circle pond mesh scaled to the pond radius.
        ponds.push(localMatrix(frame, x, groundY + 0.04, z, 0, radius, 1, radius))
        occupied.push({ x, z, r: radius + 0.8 })
        for (let k = 0; k < 13; k++) {
          const a = (k / 13) * Math.PI * 2 + rand() * 0.3
          rocks.matrices.push(
            localMatrix(frame, x + Math.cos(a) * (radius + 0.3), groundY, z + Math.sin(a) * (radius + 0.3), rand() * 6, 0.35 + rand() * 0.2, 0.25),
          )
          rocks.colors.push(new Color(pick(PALETTE.rock, rand())))
        }
      }
    }

    // Trees: pines on section islands (grown in tight clusters), palms on beach islets.
    const trees: { x: number; z: number }[] = []
    const treeCount = island.islet ? (R > 6 ? 2 : 1) : Math.round(R * 0.8)
    for (let k = 0; k < treeCount; k++) {
      const scale = 1.35 + rand() * 0.7
      const footprint = 1.1 * scale // trees may nearly touch: dense, compact groves
      let s: [number, number] | null
      if (island.islet) {
        s = [(rand() - 0.5) * 2, (rand() - 0.5) * 2]
      } else {
        // Most trees sprout next to an existing one; the rest seed new groves.
        const parent = trees.length && rand() < 0.7 ? pick(trees, rand()) : undefined
        s = spot(footprint, clearance, 30, parent && { ...parent, gap: footprint * 1.6 }) ?? spot(footprint)
      }
      if (!s) continue
      const [x, z] = s
      occupied.push({ x, z, r: footprint })
      trees.push({ x, z })
      if (island.islet) {
        palms.push(localMatrix(frame, x, groundY - 0.05, z, rand() * 6, 1.5 + rand() * 0.4))
      } else {
        pineTrunks.push(localMatrix(frame, x, groundY, z, rand() * 6, scale))
        pineFoliage.matrices.push(localMatrix(frame, x, groundY, z, rand() * 6, scale))
        pineFoliage.colors.push(new Color(pick(PALETTE.pine, rand())))
      }
    }

    // Bushes (hugging the groves), boulders on the grass, and flower clusters.
    if (!island.islet) {
      for (let k = 0; k < Math.round(R * 0.6); k++) {
        const sc = 0.9 + rand() * 0.6
        const parent = trees.length && rand() < 0.6 ? pick(trees, rand()) : undefined
        const s = spot(sc, clearance * 0.9, 30, parent && { ...parent, gap: 2.4 }) ?? spot(sc, clearance * 0.9)
        if (!s) continue
        const [x, z] = s
        occupied.push({ x, z, r: sc })
        bushes.matrices.push(localMatrix(frame, x, groundY + sc * 0.35, z, rand() * 6, sc, sc * 0.8, sc))
        bushes.colors.push(new Color(pick(PALETTE.bush, rand())))
      }
      for (let k = 0; k < 4; k++) {
        const sc = 0.8 + rand() * 0.6
        const s = spot(sc)
        if (!s) continue
        const [x, z] = s
        occupied.push({ x, z, r: sc })
        rocks.matrices.push(localMatrix(frame, x, groundY + 0.25, z, rand() * 6, sc, undefined, undefined, rand()))
        rocks.colors.push(new Color(pick(PALETTE.rock, rand())))
      }
      for (let k = 0; k < Math.round(R * 0.45); k++) {
        const s = spot(0.8, clearance * 0.8, 10)
        if (!s) continue
        const [x, z] = s
        const color = new Color(pick(PALETTE.flower, rand()))
        for (let f = 0; f < 5; f++) {
          flowers.matrices.push(localMatrix(frame, x + (rand() - 0.5) * 1.8, groundY + 0.2, z + (rand() - 0.5) * 1.8, rand() * 6, 0.28))
          flowers.colors.push(color)
        }
      }
    }

    // Boulders clustered around the base of the cliff, half in the water. Leave the dock side open.
    const boulderCount = island.islet ? 4 : Math.round(R * 0.7)
    for (let k = 0, tries = 0; k < boulderCount && tries < 80; tries++) {
      const phi = rand() * Math.PI * 2
      if (!island.islet && angleDiff(phi, FRONT) < DOCK_PATH_HALF_ANGLE + 0.25) continue
      const r = R * (0.95 + rand() * 0.12)
      const sc = 1.1 + rand() * 1.4
      rocks.matrices.push(localMatrix(frame, Math.cos(phi) * r, sc * 0.2, Math.sin(phi) * r, rand() * 6, sc, sc * 0.85, sc, rand()))
      rocks.colors.push(new Color(pick(PALETTE.rock, rand())))
      k++
    }

    // Free spots reserved for seasonal decorations (gifts, pumpkin patches, flower patches,
    // gravestones). Picked LAST so they never change where the everyday props above end up.
    const toWorld = (x: number, y: number, z: number) => new Vector3(x, y, z).applyMatrix4(frame)
    if (island.islet) {
      // Around the sand ring, beside the palm(s) in the middle.
      const sandY = groundY - 0.35
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + rand() * 0.6
        const r = R * 0.6
        const p = toWorld(Math.cos(a) * r, sandY, Math.sin(a) * r)
        decorSpots.push({ island: null, islet: true, x: p.x, y: p.y, z: p.z, yaw: yaw - a + Math.PI / 2 })
      }
    } else {
      for (let k = 0; k < 6; k++) {
        const s = spot(1.4)
        if (!s) continue
        const [x, z] = s
        occupied.push({ x, z, r: 1.4 })
        const p = toWorld(x, groundY, z)
        decorSpots.push({ island: island.id, islet: false, x: p.x, y: p.y, z: p.z, yaw: rand() * Math.PI * 2 })
      }
    }
  })

  return { shapes, pineTrunks, pineFoliage, palms, bushes, flowers, rocks, stones, ponds, decorSpots }
}

export const scenery = buildScenery()
