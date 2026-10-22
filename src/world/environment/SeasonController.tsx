import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color } from 'three'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useSeason } from '../../store/useAppStore'
import { themes } from '../../themes'
import { materials } from '../materials'
import { createPaletteState, envState, lerpPalette } from './dayNight'

/** Rate for easing toward a newly picked season (≈95% of the way in ~1.5s). */
const BLEND_RATE = 2

/**
 * Blends the world toward the selected season: the day/night lighting + water palettes in envState,
 * and the island materials (grass, rim, sand, palm leaves, and tints on pines/bushes/flowers).
 * Snaps on the first frame so a saved season doesn't fade in from Summer on page load.
 */
export default function SeasonController() {
  const theme = themes[useSeason()]
  const reducedMotion = useReducedMotion()
  const first = useRef(true)

  const targets = useMemo(() => {
    const t = theme.terrain
    return {
      day: createPaletteState(theme.day),
      night: createPaletteState(theme.night),
      grass: new Color(t.grass),
      rim: new Color(t.rim),
      sand: new Color(t.sand),
      palmLeaf: new Color(t.palmLeaf),
      pineTint: new Color(t.pineTint),
      bushTint: new Color(t.bushTint),
      flowerTint: new Color(t.flowerTint),
      showFlowers: t.showFlowers,
    }
  }, [theme])

  useFrame((_, rawDt) => {
    const k = first.current || reducedMotion ? 1 : 1 - Math.exp(-BLEND_RATE * Math.min(rawDt, 0.25))
    first.current = false

    lerpPalette(envState.palette.day, targets.day, k)
    lerpPalette(envState.palette.night, targets.night, k)

    materials.grass.color.lerp(targets.grass, k)
    materials.rim.color.lerp(targets.rim, k)
    materials.sand.color.lerp(targets.sand, k)
    materials.palmLeaf.color.lerp(targets.palmLeaf, k)
    materials.pineFoliage.color.lerp(targets.pineTint, k)
    materials.bush.color.lerp(targets.bushTint, k)
    materials.flower.color.lerp(targets.flowerTint, k)
    materials.flower.visible = targets.showFlowers
  })

  return null
}
