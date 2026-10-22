import type { ThemeConfig } from '../types/theme'

/** Valentine's: pink and rose tint, warm sunset light, floating hearts and flower patches. */
export const valentines: ThemeConfig = {
  id: 'valentines',
  label: "Valentine's",
  icon: '💗',
  ui: { accent: '#e11d74', accentContrast: '#ffffff' },
  day: {
    fog: '#f6c6d6',
    fogNear: 150,
    fogFar: 420,
    sunColor: '#ffbf9e', // warm sunset light
    sunIntensity: 2.0,
    hemiSky: '#ffd6e6',
    hemiGround: '#8a5a6a',
    hemiIntensity: 0.95,
    water: { deep: '#3a7cc0', shallow: '#7fd6dc', foam: '#fff0f6', light: '#ffc9b0', ambient: '#a07a96', sparkle: 0.9 },
  },
  night: {
    fog: '#2a1230',
    fogNear: 150,
    fogFar: 420,
    sunColor: '#ffb6d9',
    sunIntensity: 0.85,
    hemiSky: '#8a4a8f',
    hemiGround: '#2a1528',
    hemiIntensity: 0.75,
    water: { deep: '#1d1645', shallow: '#4a4f8a', foam: '#e3b8d9', light: '#ffd0e8', ambient: '#2c1f40', sparkle: 1.4 },
  },
  terrain: {
    grass: '#a9cf5e',
    rim: '#f6dfd0',
    sand: '#f8dccb',
    palmLeaf: '#47c26a',
    pineTint: '#ffffff',
    bushTint: '#ffd9e6',
    flowerTint: '#ffb3cf',
    showFlowers: true,
  },
  birds: 'seagulls',
  decorations: () => import('../world/seasons/ValentinesDecor'),
}
