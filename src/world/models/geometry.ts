/**
 * Procedural low-poly geometry built in code, so the world runs with no external assets.
 * To swap in a Blender/GLTF model later, replace the component that uses one of these
 * (e.g. Lighthouse, PalmTrees) with a `useGLTF` version; nothing else depends on them.
 */
import {
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  Shape,
  Vector2,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** Deterministic pseudo-random generator (mulberry32) so scenery is identical on every load. */
export function seededRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Triangular-prism roof with its ridge along local Z, base at y = 0. */
export function gableRoofGeometry(width: number, height: number, length: number) {
  const shape = new Shape()
  shape.moveTo(-width / 2, 0)
  shape.lineTo(width / 2, 0)
  shape.lineTo(0, height)
  shape.closePath()
  const geo = new ExtrudeGeometry(shape, { depth: length, bevelEnabled: false })
  geo.translate(0, 0, -length / 2)
  return geo
}

/** Trophy cup body: a lathe (revolved profile). Base at y = 0, rim at ~1.75. */
export function trophyCupGeometry() {
  const profile = [
    [0.0, 0.0], [0.5, 0.0], [0.5, 0.12], [0.18, 0.22], [0.12, 0.7],
    [0.22, 0.8], [0.55, 1.15], [0.6, 1.75], [0.52, 1.75], [0.45, 1.25], [0.0, 1.0],
  ].map(([x, y]) => new Vector2(x, y))
  return new LatheGeometry(profile, 12)
}

/** Short pine trunk, base at y = 0. */
export function pineTrunkGeometry() {
  const geo = new CylinderGeometry(0.22, 0.3, 1.2, 6)
  geo.translate(0, 0.6, 0)
  return geo
}

/** Three stacked, slightly offset cones: the classic low-poly pine. Base at y = 0. */
export function pineFoliageGeometry() {
  const tiers: [number, number, number][] = [
    // [radius, height, base y]
    [1.5, 2.0, 0.9],
    [1.15, 1.7, 2.1],
    [0.8, 1.5, 3.1],
  ]
  return mergeGeometries(
    tiers.map(([r, h, y], i) => {
      const cone = new ConeGeometry(r, h, 7)
      cone.rotateY(i * 0.4) // offset facets between tiers for a hand-made look
      cone.translate(0, y + h / 2, 0)
      return cone
    }),
  )!
}

/** Slightly curved palm trunk; returns the trunk geometry and where the crown sits. */
export function palmTrunkGeometry() {
  const segments = [0, 0.12, 0.35, 0.7] // cumulative lean in X per segment
  const parts: BufferGeometry[] = []
  for (let i = 0; i < 3; i++) {
    const seg = new CylinderGeometry(0.2 - i * 0.03, 0.26 - i * 0.03, 1.65, 6)
    seg.translate((segments[i] + segments[i + 1]) / 2, 0.8 + i * 1.6, 0)
    parts.push(seg)
  }
  return mergeGeometries(parts)!
}
export const PALM_CROWN = { x: 0.7, y: 4.8 }

/** Six flattened cones fanned out and drooping from the crown. */
export function palmLeavesGeometry() {
  const parts: BufferGeometry[] = []
  const count = 6
  for (let k = 0; k < count; k++) {
    const leaf = new ConeGeometry(0.45, 2.6, 3)
    leaf.rotateX(Math.PI / 2) // tip now points along +Z
    leaf.scale(1, 0.25, 1) // flatten into a frond
    leaf.translate(0, 0, 1.3) // base at the origin
    leaf.rotateX(0.45) // droop the tip downward
    leaf.rotateY((k / count) * Math.PI * 2 + 0.3)
    leaf.translate(PALM_CROWN.x, PALM_CROWN.y, 0)
    parts.push(leaf)
  }
  return mergeGeometries(parts)!
}
