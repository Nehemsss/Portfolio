import type { ThemeConfig } from '../types/theme'

/** Summer: the default look. Bright tropical day, cool moonlit night. No extra decorations. */
export const summer: ThemeConfig = {
  id: 'summer',
  label: 'Summer',
  icon: '🌴',
  ui: { accent: '#0ea5e9', accentContrast: '#ffffff' },
  day: {
    fog: '#b4d6ee',
    fogNear: 170,
    fogFar: 450,
    sunColor: '#fff3d6',
    sunIntensity: 2.2,
    hemiSky: '#d6ecff',
    hemiGround: '#5d7d5a',
    hemiIntensity: 0.9,
    water: { deep: '#1386d0', shallow: '#45dcd6', foam: '#f4fdff', light: '#fff3d6', ambient: '#5f86a8', sparkle: 0.8 },
  },
  night: {
    fog: '#0d1b36',
    fogNear: 170,
    fogFar: 450,
    sunColor: '#9db4ff',
    sunIntensity: 0.9,
    hemiSky: '#4763a8',
    hemiGround: '#1a2538',
    hemiIntensity: 0.75,
    water: { deep: '#0a2a52', shallow: '#1c6b8c', foam: '#a9c8e6', light: '#dfe8ff', ambient: '#1a2a47', sparkle: 1.4 },
  },
  terrain: {
    grass: '#a3cc4f',
    rim: '#f0e1aa',
    sand: '#f5dc9b',
    palmLeaf: '#3cc25a',
    pineTint: '#ffffff',
    bushTint: '#ffffff',
    flowerTint: '#ffffff',
    showFlowers: true,
  },
  birds: 'seagulls',
}
