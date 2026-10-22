import type { ThemeConfig } from '../types/theme'

/**
 * Halloween: orange and purple light, thick fog, pumpkins on the docks, bats instead of seagulls,
 * ghostly lanterns, gravestones on the small islands and the Flying Dutchman at night.
 */
export const halloween: ThemeConfig = {
  id: 'halloween',
  label: 'Halloween',
  icon: '🎃',
  ui: { accent: '#f97316', accentContrast: '#1a0b00' },
  day: {
    fog: '#c9a2c9',
    fogNear: 70,
    fogFar: 260,
    sunColor: '#ffb066',
    sunIntensity: 1.8,
    hemiSky: '#c6a3e6',
    hemiGround: '#5b3a52',
    hemiIntensity: 0.9,
    water: { deep: '#2e4f7a', shallow: '#4f9e9a', foam: '#efe3ff', light: '#ffc27a', ambient: '#6b5a8a', sparkle: 0.7 },
  },
  night: {
    fog: '#1e1030',
    fogNear: 55,
    fogFar: 230,
    sunColor: '#b6ff9e', // eerie green moon
    sunIntensity: 0.7,
    hemiSky: '#6a3d8f',
    hemiGround: '#1a0f20',
    hemiIntensity: 0.7,
    water: { deep: '#160d2b', shallow: '#2f3f5a', foam: '#9a85c2', light: '#c8ffb0', ambient: '#21163a', sparkle: 1.2 },
  },
  terrain: {
    grass: '#8aa046',
    rim: '#d9c48f',
    sand: '#d9c48f',
    palmLeaf: '#5e8a3c',
    pineTint: '#9fb39a',
    bushTint: '#b9a37a',
    flowerTint: '#ff9a3c',
    showFlowers: true,
  },
  birds: 'bats',
  decorations: () => import('../world/seasons/HalloweenDecor'),
}
