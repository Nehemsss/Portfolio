/**
 * World layout: where every island sits. Shared by the 3D scene and (later) the minimap.
 * Coordinates are on the ocean's XZ plane; Y is up. One unit ≈ one metre.
 */
import type { IslandId, SectionId } from '../types/portfolio'

export type { IslandId }

export interface IslandLayout {
  id: IslandId
  /** Centre on the XZ plane. */
  x: number
  z: number
  /** Radius of the island at the waterline; also the collision radius. */
  radius: number
  /**
   * Angle (radians, measured like Math.atan2(dz, dx)) from the island centre toward its dock.
   * Section docks face the Home Island so they are easy to find; Home's dock faces the start point.
   */
  dockAngle: number
}

export interface IsletLayout {
  x: number
  z: number
  radius: number
}

const faceOrigin = (x: number, z: number) => Math.atan2(-z, -x)

const sectionIsland = (id: SectionId, x: number, z: number, radius: number): IslandLayout => ({
  id,
  x,
  z,
  radius,
  dockAngle: faceOrigin(x, z),
})

// Islands sit ~20 units of water apart, so neighbours are usually on screen from the bird's-eye camera.
export const ISLANDS: IslandLayout[] = [
  { id: 'home', x: 0, z: 0, radius: 21, dockAngle: Math.PI / 2 }, // dock on the +Z side, toward the start
  sectionIsland('about', -57, -18, 18),
  sectionIsland('achievements', -27, -64, 18),
  sectionIsland('skills', 29, -64, 20),
  sectionIsland('education', 58, -18, 18),
]

export const islandById = (id: IslandId) => ISLANDS.find((i) => i.id === id)!

/** Small decorative islets with no section, just scenery. */
export const ISLETS: IsletLayout[] = [
  { x: -36, z: 36, radius: 6 },
  { x: 40, z: 34, radius: 7 },
  { x: 0, z: -98, radius: 7 },
  { x: -92, z: -62, radius: 6 },
  { x: 92, z: -62, radius: 6 },
]

/** The boat starts in the Home Island's docking ring, facing the pier (heading -Z). */
export const BOAT_START = { x: 0, z: 31.5, yaw: Math.PI }

/** Soft boundary: past this distance from the origin, the boat is pushed back. */
export const WORLD_RADIUS = 125

/** Height of the grass surface on section islands (top of the cliff), so props can sit on it. */
export const GROUND_Y = 3
/** Height of the grass surface on the small beach islets. */
export const ISLET_GROUND_Y = 1.5

/** Landmarks are modelled at 1 unit ≈ 1 m and scaled up for a chunky, toy-like look. */
export const LANDMARK_SCALE = 2

/** Rotation that turns an island's local +Z (the "front" of its landmark) toward its dock. */
export const facingDock = (dockAngle: number) => Math.PI / 2 - dockAngle
