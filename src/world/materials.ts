/**
 * Shared materials. Reusing one material instance across many meshes keeps draw-state changes low,
 * and lets the day/night system (Phase 4) brighten every window or lantern by tweaking one object.
 * Palette: bright, saturated "toy diorama" colours.
 */
import { MeshStandardMaterial, type MeshStandardMaterialParameters } from 'three'

const flat = (color: string, extra: MeshStandardMaterialParameters = {}) =>
  new MeshStandardMaterial({ color, flatShading: true, roughness: 0.8, ...extra })

/** Smooth-shaded variant for rounded shapes (tile caps), where facets would look broken. */
const smooth = (color: string, extra: MeshStandardMaterialParameters = {}) =>
  new MeshStandardMaterial({ color, roughness: 0.75, ...extra })

export const materials = {
  /** Island terrain */
  grass: smooth('#a3cc4f'),
  rim: flat('#f0e1aa'),
  dirt: flat('#9a6440'),
  sand: flat('#f5dc9b'),
  pathStone: flat('#d9d4c7'),
  pond: smooth('#5ccbe6', { roughness: 0.15, metalness: 0.1 }),
  /** Rocks and other per-instance–coloured props. */
  tintable: flat('#ffffff'),
  /**
   * Per-instance–coloured vegetation, each with its own material so a season can tint it
   * (the material colour multiplies the instance colours, e.g. a pale tint = frosted pines).
   */
  pineFoliage: flat('#ffffff'),
  bush: flat('#ffffff'),
  flower: flat('#ffffff'),
  rock: flat('#9aa3ad'),
  wood: flat('#b07a4a'),
  darkWood: flat('#7a4b2c'),
  white: flat('#fbf8f1'),
  red: flat('#ef5a4f'),
  roof: flat('#e8674f'),
  stone: flat('#d8d2c4'),
  gold: flat('#ffc83d', { metalness: 0.5, roughness: 0.35 }),
  silver: flat('#d3dae3', { metalness: 0.5, roughness: 0.35 }),
  bronze: flat('#d48a4a', { metalness: 0.5, roughness: 0.4 }),
  palmTrunk: flat('#c08a55'),
  palmLeaf: flat('#3cc25a'),
  crate: flat('#e0a35c'),
  signBoard: flat('#8a5a34'),
  metal: flat('#6b7787', { metalness: 0.3, roughness: 0.5 }),
  plaster: flat('#ffe4b8'),
  brick: flat('#e0785a'),
  warehouse: flat('#5fa8d3'),
  slate: flat('#46566e'),
  cream: flat('#fff6e0'),
  flag: flat('#2f8cff'),
  bookRed: flat('#ef4f5f'),
  bookBlue: flat('#3a8dde'),
  bookGreen: flat('#3fbf6f'),
  /** Window glass: dark by day; Phase 4 raises emissiveIntensity at night. */
  window: flat('#9fd4f5', { emissive: '#ffcf70', emissiveIntensity: 0, roughness: 0.3 }),
  /** Lighthouse lamp and dock lanterns: same idea as windows. */
  lamp: flat('#fff4c2', { emissive: '#ffd966', emissiveIntensity: 0.3 }),
  /** Farm */
  barnRed: flat('#c8423b'),
  soil: flat('#7a4e2e'),
  wheat: flat('#f2c14e'),
  cabbage: flat('#7cc45a'),
  hay: flat('#e8c35a'),
  straw: flat('#d9a441'),
  /** Sea life */
  whale: flat('#2f4a74'),
  whaleFin: flat('#273e63'),
  /** Wildlife */
  fish: flat('#ff8a3d'),
  fishFin: flat('#ffd23f'),
  gull: flat('#ffffff'),
  bat: flat('#231a2b'),
  batWing: flat('#3a2847'),
  gullWing: flat('#c9d3de'),
  beak: flat('#ffb020'),
}
