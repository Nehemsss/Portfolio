import type { ComponentType } from 'react'

/**
 * Season themes. Each season is one ThemeConfig object in src/themes/<id>.ts.
 * To add a season: create the file, add its id here, and register it in src/themes/index.ts.
 */
export type SeasonId = 'summer' | 'winter' | 'halloween' | 'valentines'

/** Lighting, fog and water colours for one time of day. Colours are CSS hex strings. */
export interface ScenePalette {
  fog: string
  fogNear: number
  fogFar: number
  /** Sun by day, moon by night. */
  sunColor: string
  sunIntensity: number
  hemiSky: string
  hemiGround: string
  hemiIntensity: number
  water: {
    deep: string
    shallow: string
    foam: string
    /** Colour of the light glinting on the water. */
    light: string
    ambient: string
    sparkle: number
  }
}

/** Island surface colours. Tints multiply the per-instance colours of trees/bushes/flowers. */
export interface TerrainPalette {
  grass: string
  /** Light rim around the top edge of the island cliffs. */
  rim: string
  /** Sand on the beach islets. */
  sand: string
  palmLeaf: string
  pineTint: string
  bushTint: string
  flowerTint: string
  /** Hide the everyday flower clusters (e.g. under winter snow). */
  showFlowers: boolean
}

export interface ThemeConfig {
  id: SeasonId
  label: string
  /** Emoji shown in the season picker. */
  icon: string
  /** Accent colours used by the HUD and the 2D view (CSS variables). */
  ui: {
    accent: string
    accentContrast: string
  }
  day: ScenePalette
  night: ScenePalette
  terrain: TerrainPalette
  /** Which birds circle the islands by day. */
  birds: 'seagulls' | 'bats'
  /**
   * Season-only props and particles, lazy-loaded so they're only downloaded when the season is picked.
   * Omit for a season with no extra decorations.
   */
  decorations?: () => Promise<{ default: ComponentType }>
  /** Optional looping ambient sound under /public/audio (not wired up yet). */
  sound?: string
}
