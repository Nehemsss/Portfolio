import { useRef, type ComponentRef } from 'react'
import { Sky } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Vector3, type DirectionalLight, type Fog, type HemisphereLight } from 'three'
import { SUN_DIRECTION } from './sun'
import { MOONLIGHT_DIRECTION, SUN_NIGHT_DIRECTION, envState } from './dayNight'
import NightSky from './NightSky'

const SUN_POSITION = SUN_DIRECTION.clone().multiplyScalar(100).toArray()
const LIGHT_DISTANCE = 100
const mix = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * Sky, fog and the two scene lights, blended between the current (season-aware) day and night
 * palettes by envState.night.
 * - Sun light becomes moonlight and swings to the moon's direction.
 * - drei <Sky>'s sun dips below the horizon (dusk colours mid-transition) and a navy night dome,
 *   stars and moon fade in on top (see NightSky).
 */
export default function SkyAndLighting() {
  const sky = useRef<ComponentRef<typeof Sky>>(null)
  const sun = useRef<DirectionalLight>(null)
  const hemi = useRef<HemisphereLight>(null)
  const scratch = useRef({ dir: new Vector3(), skySun: new Vector3() })

  useFrame(({ scene }) => {
    const n = envState.night
    const { day, night } = envState.palette
    const { dir, skySun } = scratch.current

    if (sun.current) {
      dir.lerpVectors(SUN_DIRECTION, MOONLIGHT_DIRECTION, n).normalize()
      sun.current.position.copy(dir).multiplyScalar(LIGHT_DISTANCE)
      sun.current.color.lerpColors(day.sunColor, night.sunColor, n)
      sun.current.intensity = mix(day.sunIntensity, night.sunIntensity, n)
    }
    if (hemi.current) {
      hemi.current.color.lerpColors(day.hemiSky, night.hemiSky, n)
      hemi.current.groundColor.lerpColors(day.hemiGround, night.hemiGround, n)
      hemi.current.intensity = mix(day.hemiIntensity, night.hemiIntensity, n)
    }
    const fog = scene.fog as Fog | null
    if (fog) {
      fog.color.lerpColors(day.fog, night.fog, n)
      fog.near = mix(day.fogNear, night.fogNear, n)
      fog.far = mix(day.fogFar, night.fogFar, n)
    }

    if (sky.current) {
      skySun.lerpVectors(SUN_DIRECTION, SUN_NIGHT_DIRECTION, n).normalize().multiplyScalar(100)
      sky.current.material.uniforms.sunPosition.value.copy(skySun)
    }
  })

  const initial = envState.palette.day
  return (
    <>
      <Sky ref={sky} sunPosition={SUN_POSITION} turbidity={2} rayleigh={0.6} mieCoefficient={0.003} mieDirectionalG={0.8} />
      <NightSky />
      <fog attach="fog" args={[initial.fog.getHex(), initial.fogNear, initial.fogFar]} />
      <hemisphereLight ref={hemi} args={[initial.hemiSky, initial.hemiGround, initial.hemiIntensity]} />
      <directionalLight ref={sun} position={SUN_POSITION} intensity={initial.sunIntensity} color={initial.sunColor} />
    </>
  )
}
