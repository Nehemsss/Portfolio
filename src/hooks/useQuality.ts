export type QualityTier = 'high' | 'low'

export interface QualitySettings {
  tier: QualityTier
  /** Canvas pixel-ratio range [min, max]. */
  dpr: [number, number]
  antialias: boolean
  /** Ocean grid resolution per side (the waves are vertex-displaced). */
  oceanSegments: number
  /** Multiplier on season particle counts (snow, hearts). */
  particleScale: number
  fish: number
  stingrays: number
  windTrails: number
  /** MSAA samples in the night bloom composer (0 = off). */
  bloomSamples: number
}

const SETTINGS: Record<QualityTier, Omit<QualitySettings, 'tier'>> = {
  high: { dpr: [1, 1.5], antialias: true, oceanSegments: 240, particleScale: 1, fish: 3, stingrays: 6, windTrails: 5, bloomSamples: 4 },
  low: { dpr: [1, 1.25], antialias: false, oceanSegments: 150, particleScale: 0.4, fish: 2, stingrays: 3, windTrails: 2, bloomSamples: 0 },
}

/**
 * "low" on touch-first devices, ≤4 GB RAM or ≤4 CPU cores (deviceMemory is Chromium-only, so it
 * may be missing). Add ?quality=low or ?quality=high to the URL to force a tier for testing.
 */
function detectTier(): QualityTier {
  const forced = new URLSearchParams(window.location.search).get('quality')
  if (forced === 'low' || forced === 'high') return forced
  const nav = navigator as Navigator & { deviceMemory?: number }
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const lowMemory = nav.deviceMemory !== undefined && nav.deviceMemory <= 4
  const fewCores = nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 4
  return coarse || lowMemory || fewCores ? 'low' : 'high'
}

let cached: QualitySettings | undefined

/**
 * Rendering quality for this device. Decided once per page load and never changes afterwards:
 * switching antialias or pixel ratio mid-session would mean rebuilding the WebGL context.
 */
export function useQuality(): QualitySettings {
  if (!cached) {
    const tier = detectTier()
    cached = { tier, ...SETTINGS[tier] }
  }
  return cached
}
