import { useFrame } from '@react-three/fiber'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useTimeOfDay } from '../../store/useAppStore'
import { materials } from '../materials'
import { TRANSITION_SECONDS, ease, envState } from './dayNight'

/**
 * Drives envState.night toward the current time of day, and updates the shared glowing materials
 * (windows, lamps) from it. Mount it FIRST inside <Canvas> so its frame callback runs before the
 * components that read envState.
 */
export default function DayNightController() {
  const target = useTimeOfDay() === 'night' ? 1 : 0
  const reducedMotion = useReducedMotion()

  useFrame((_, rawDt) => {
    // Use real elapsed time (only capping huge gaps, e.g. after a tab switch) so the transition
    // takes ~1.5s of wall-clock time even on slow devices with low frame rates.
    const dt = Math.min(rawDt, 0.25)
    if (reducedMotion) {
      envState.progress = target
    } else {
      // Move linearly at a constant rate, then ease, so the transition always takes the same time.
      const step = dt / TRANSITION_SECONDS
      envState.progress += Math.max(-step, Math.min(step, target - envState.progress))
    }
    const n = ease(envState.progress)
    envState.night = n

    // Emissive intensities above ~1 are what the night bloom picks up as glow.
    materials.window.emissiveIntensity = n * 2.6
    materials.lamp.emissiveIntensity = 0.3 + n * 4.5
  })

  return null
}
