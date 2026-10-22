import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode, type BloomEffect } from 'postprocessing'
import { useQuality } from '../../hooks/useQuality'
import { envState } from './dayNight'

/** Mount the composer slightly before night shows and keep it until fully back to day (hysteresis). */
const ON_THRESHOLD = 0.01
const OFF_THRESHOLD = 0.002
const MAX_BLOOM = 1.3

/** Only the bloom pass and the tone mapping it needs. */
function NightComposer() {
  const bloom = useRef<BloomEffect>(null)
  const { bloomSamples } = useQuality()

  useFrame(() => {
    if (bloom.current) bloom.current.intensity = envState.night * MAX_BLOOM
  })

  return (
    // While mounted, the composer turns off the renderer's own tone mapping, so we re-apply the
    // same ACES curve as the last effect: the scene looks identical with or without the composer.
    <EffectComposer multisampling={bloomSamples}>
      <Bloom
        ref={bloom}
        mipmapBlur
        // Only HDR-bright pixels (emissive windows/lamps, the moon, the docking rings) glow;
        // ordinary white surfaces and text sit at ≤1 and stay crisp.
        luminanceThreshold={1}
        luminanceSmoothing={0.15}
        intensity={0}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}

/**
 * Night glow ("bloom"). The post-processing composer is mounted only while it is night or
 * transitioning, so the daytime scene pays nothing for it.
 */
export default function NightEffects() {
  const [active, setActive] = useState(false)
  const activeRef = useRef(false)

  useFrame(() => {
    const n = envState.night
    const next = activeRef.current ? n > OFF_THRESHOLD : n > ON_THRESHOLD
    if (next !== activeRef.current) {
      activeRef.current = next
      setActive(next) // rare: only at the start of dusk and the end of dawn
    }
  })

  return active ? <NightComposer /> : null
}
