import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import { MOON_GLINT_DIRECTION, envState } from '../environment/dayNight'
import { SUN_DIRECTION } from '../environment/sun'
import { createWaterMaterial, type WaterMaterial } from './waterShader'

interface Props {
  /** Side length of the water plane; fog hides the edge. */
  size?: number
  /** Grid resolution per side. Lower on mobile. */
  segments?: number
}

// Big enough that the edge stays hidden in fog even at maximum camera zoom-out.
export default function Ocean({ size = 900, segments = 240 }: Props) {
  const mesh = useRef<Mesh>(null)
  const material = useMemo(() => createWaterMaterial(), [])
  useEffect(() => () => material.dispose(), [material])

  useFrame((state) => {
    if (!mesh.current) return
    const u = (mesh.current.material as WaterMaterial).uniforms
    u.uTime.value = state.clock.elapsedTime

    // Day ↔ night (and the current season's tint): water colours come from the live palettes,
    // and the glitter follows the moon at night.
    const n = envState.night
    const day = envState.palette.day.water
    const night = envState.palette.night.water
    u.uDeepColor.value.lerpColors(day.deep, night.deep, n)
    u.uShallowColor.value.lerpColors(day.shallow, night.shallow, n)
    u.uFoamColor.value.lerpColors(day.foam, night.foam, n)
    u.uSunColor.value.lerpColors(day.light, night.light, n)
    u.uAmbient.value.lerpColors(day.ambient, night.ambient, n)
    u.uSunDir.value.lerpVectors(SUN_DIRECTION, MOON_GLINT_DIRECTION, n).normalize()
    u.uSparkle.value = day.sparkle + (night.sparkle - day.sparkle) * n
  })

  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} material={material} frustumCulled={false}>
      <planeGeometry args={[size, size, segments, segments]} />
    </mesh>
  )
}
