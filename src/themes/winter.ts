import type { ThemeConfig } from '../types/theme'

/**
 * Winter / Christmas: snow-capped islands, icy water, frosted pines, falling snow, decorated trees
 * with stars, string lights on the docks, gift boxes and candy canes.
 */
export const winter: ThemeConfig = {
  id: 'winter',
  label: 'Winter',
  icon: '🎄',
  ui: { accent: '#3b82c4', accentContrast: '#ffffff' },
  day: {
    fog: '#d9e8f3',
    fogNear: 140,
    fogFar: 400,
    sunColor: '#f4f8ff',
    sunIntensity: 1.9,
    hemiSky: '#e4f0fb',
    hemiGround: '#8aa0b4',
    hemiIntensity: 1.0,
    water: { deep: '#2a6f9e', shallow: '#8fd3df', foam: '#ffffff', light: '#f4f8ff', ambient: '#7493ad', sparkle: 1.0 },
  },
  night: {
    fog: '#101d33',
    fogNear: 140,
    fogFar: 400,
    sunColor: '#b6c8ff',
    sunIntensity: 1.0,
    hemiSky: '#5a73b0',
    hemiGround: '#26324a',
    hemiIntensity: 0.85,
    water: { deep: '#0c2848', shallow: '#3a7f9c', foam: '#c9dcf0', light: '#e8efff', ambient: '#1e2f4c', sparkle: 1.5 },
  },
  terrain: {
    grass: '#f2f7fb', // snow
    rim: '#dfe8ef',
    sand: '#eef3f7',
    palmLeaf: '#9fc7b0',
    pineTint: '#d9ebe6', // frosted
    bushTint: '#dcebe6',
    flowerTint: '#ffffff',
    showFlowers: false,
  },
  birds: 'seagulls',
  decorations: () => import('../world/seasons/WinterDecor'),
}
