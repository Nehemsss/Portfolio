/**
 * Dock dimensions and positions, shared by the docks themselves and anything placed relative to
 * them (seasonal decorations, sea life that must keep clear of the docking rings).
 */
import { Vector3 } from 'three'
import { facingDock, type IslandLayout } from '../layout'

export const DECK_Y = 1.0 // top of the pier deck, just above the (calm, near-shore) waves
export const PIER_LENGTH = 4.5
export const PIER_WIDTH = 3.2
export const STAIR_WIDTH = 2.6
/** Docking ring on the water off the pier tip: about as wide as the whole dock (stairs + pier). */
export const RING_RADIUS = 5

/** Key distances along an island's local +Z axis (which points out toward its dock). */
export function dockLayout(island: IslandLayout) {
  const R = island.radius
  const stairsStart = R * 0.88 // on the grass, where the stepping-stone path ends
  const pierStart = R + 1.2 // stairs reach deck height here, just past the cliff
  const pierEnd = pierStart + PIER_LENGTH
  // Ring hugs the pier tip, so its near edge comes back toward the island (still on open water).
  const ringCenter = pierEnd + RING_RADIUS * 0.3
  const yaw = facingDock(island.dockAngle)

  /** Converts a point in the island's dock frame (local +Z = toward the dock) to world space. */
  const toWorld = (x: number, y: number, z: number, target = new Vector3()) => {
    const c = Math.cos(yaw)
    const s = Math.sin(yaw)
    // Rotation about Y by `yaw`, then translate to the island centre.
    return target.set(island.x + x * c + z * s, y, island.z - x * s + z * c)
  }

  return { R, stairsStart, pierStart, pierEnd, pierMid: (pierStart + pierEnd) / 2, ringCenter, yaw, toWorld }
}
