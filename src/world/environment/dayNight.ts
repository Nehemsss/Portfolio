/**
 * Shared day/night + season state for the 3D world.
 *
 * - `envState.night` is a single eased value: 0 = full day, 1 = full night (DayNightController).
 * - `envState.palette.day` / `.night` hold the CURRENT lighting/water colours for each time of day.
 *   SeasonController eases them toward the selected season's palettes, so season changes blend too.
 * Consumers (sky, lights, fog, water) mix palette.day → palette.night by envState.night.
 * Being plain mutable data, none of this triggers React re-renders.
 */
import { Color, Vector3 } from 'three'
import { summer } from '../../themes/summer'
import type { ScenePalette } from '../../types/theme'
import { SUN_DIRECTION } from './sun'

/** Live, blendable version of a ScenePalette (THREE colours instead of hex strings). */
export interface PaletteState {
  fog: Color
  fogNear: number
  fogFar: number
  sunColor: Color
  sunIntensity: number
  hemiSky: Color
  hemiGround: Color
  hemiIntensity: number
  water: { deep: Color; shallow: Color; foam: Color; light: Color; ambient: Color; sparkle: number }
}

export function createPaletteState(p: ScenePalette): PaletteState {
  const c = (hex: string) => new Color(hex)
  return {
    fog: c(p.fog),
    fogNear: p.fogNear,
    fogFar: p.fogFar,
    sunColor: c(p.sunColor),
    sunIntensity: p.sunIntensity,
    hemiSky: c(p.hemiSky),
    hemiGround: c(p.hemiGround),
    hemiIntensity: p.hemiIntensity,
    water: {
      deep: c(p.water.deep),
      shallow: c(p.water.shallow),
      foam: c(p.water.foam),
      light: c(p.water.light),
      ambient: c(p.water.ambient),
      sparkle: p.water.sparkle,
    },
  }
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t

/** Moves `state` a fraction `t` of the way toward `target` (both already as PaletteState). */
export function lerpPalette(state: PaletteState, target: PaletteState, t: number) {
  state.fog.lerp(target.fog, t)
  state.fogNear = mix(state.fogNear, target.fogNear, t)
  state.fogFar = mix(state.fogFar, target.fogFar, t)
  state.sunColor.lerp(target.sunColor, t)
  state.sunIntensity = mix(state.sunIntensity, target.sunIntensity, t)
  state.hemiSky.lerp(target.hemiSky, t)
  state.hemiGround.lerp(target.hemiGround, t)
  state.hemiIntensity = mix(state.hemiIntensity, target.hemiIntensity, t)
  const w = state.water
  const tw = target.water
  w.deep.lerp(tw.deep, t)
  w.shallow.lerp(tw.shallow, t)
  w.foam.lerp(tw.foam, t)
  w.light.lerp(tw.light, t)
  w.ambient.lerp(tw.ambient, t)
  w.sparkle = mix(w.sparkle, tw.sparkle, t)
}

export const envState = {
  /** Linear transition progress 0..1 (internal). */
  progress: 0,
  /** Eased night amount 0..1: use this for blending. */
  night: 0,
  /** Current (season-blended) palettes; start as Summer. */
  palette: {
    day: createPaletteState(summer.day),
    night: createPaletteState(summer.night),
  },
}

/** Seconds for a full day ↔ night transition. */
export const TRANSITION_SECONDS = 1.5

/** Moonlight on the scene: from behind-left of the default camera, so island fronts are softly lit. */
export const MOONLIGHT_DIRECTION = new Vector3(-0.4, 0.7, 0.35).normalize()
/**
 * Where the water's glint comes from at night: low in the north, ahead of the default camera,
 * so a shimmering moon path shows on the water near the top of the view.
 */
export const MOON_GLINT_DIRECTION = new Vector3(0.15, 0.35, -0.92).normalize()
/** Where the moon sits in the sky (same bearing as the glint). */
export const MOON_SKY_DIRECTION = MOON_GLINT_DIRECTION.clone()
/** Sun sinks below the horizon at night so drei's <Sky> darkens through dusk. */
export const SUN_NIGHT_DIRECTION = new Vector3(SUN_DIRECTION.x, -0.35, SUN_DIRECTION.z).normalize()

/** Smoothstep easing for the transition curve. */
export const ease = (t: number) => t * t * (3 - 2 * t)
