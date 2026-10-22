import { Suspense, useEffect, useRef, useSyncExternalStore } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { useQuality } from '../hooks/useQuality'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { islandInfo } from '../hud/islandInfo'
import { ISLANDS } from './layout'
import { useSeason, useTimeOfDay } from '../store/useAppStore'
import { themes } from '../themes'
import SeasonController from './environment/SeasonController'
import SeasonDecorations from './seasons/SeasonDecorations'
import JumpingFish from './ambient/JumpingFish'
import Seagulls from './ambient/Seagulls'
import Stingrays from './ambient/Stingrays'
import Whale from './ambient/Whale'
import WindTrails from './ambient/WindTrails'
import Boat from './boat/Boat'
import BoatWake from './boat/BoatWake'
import CameraRig from './boat/CameraRig'
import DayNightController from './environment/DayNightController'
import NightEffects from './environment/NightEffects'
import SkyAndLighting from './environment/SkyAndLighting'
import Islands from './islands/Islands'
import Ocean from './ocean/Ocean'
import type { LoadStage } from './loadStages'

type OnStage = (stage: LoadStage) => void

/** Physics only renders its children once Rapier's WASM is initialised, so mounting = ready. */
function PhysicsSignal({ onStage }: { onStage: OnStage }) {
  useEffect(() => onStage('physics'), [onStage])
  return null
}

/** Mounts once the islands' sign fonts (drei <Text>) have loaded; then also waits for the HUD's CSS font. */
function FontsSignal({ onStage }: { onStage: OnStage }) {
  useEffect(() => {
    let cancelled = false
    document.fonts.ready.then(() => {
      if (!cancelled) onStage('fonts')
    })
    return () => {
      cancelled = true
    }
  }, [onStage])
  return null
}

/** Reports after the full scene has rendered twice (the first frame also compiles shaders). */
function FirstFrameSignal({ onStage }: { onStage: OnStage }) {
  const frames = useRef(0)
  useFrame(() => {
    frames.current += 1
    if (frames.current === 2) onStage('frame')
  })
  return null
}

interface Props {
  /** Called as each loading stage completes (see loadStages.ts). */
  onStage: OnStage
}

const subscribeVisibility = (onChange: () => void) => {
  document.addEventListener('visibilitychange', onChange)
  return () => document.removeEventListener('visibilitychange', onChange)
}

/** Screen-reader summary of the canvas, which is otherwise an opaque image. */
const SCENE_DESCRIPTION =
  `A cartoon 3D sea with islands to sail between: ${ISLANDS.map((i) => islandInfo(i.id).title).join(', ')}. ` +
  'Sail with W A S D or the arrow keys and press E at a glowing dock ring to open that island. ' +
  'The same content is available in the 2D view, linked at the top of the page.'

export default function World({ onStage }: Props) {
  const reducedMotion = useReducedMotion()
  const isNight = useTimeOfDay() === 'night'
  const season = useSeason()
  const quality = useQuality()
  // Stop rendering entirely while the tab is hidden, to save battery. (Boat and camera clamp
  // their frame time, so nothing jumps when the tab comes back.)
  const tabVisible = useSyncExternalStore(subscribeVisibility, () => document.visibilityState === 'visible', () => true)

  return (
    <Canvas
      // Pixel-ratio cap by quality tier: 2x+ screens cost 4x the pixels for little visible gain.
      dpr={quality.dpr}
      // Narrow FOV flattens perspective for the bird's-eye diorama look (framing lives in CameraRig).
      // far must exceed drei <Sky>'s 1000-unit dome.
      camera={{ fov: 35, near: 1, far: 1500 }}
      gl={{ antialias: quality.antialias, powerPreference: 'high-performance' }}
      frameloop={tabVisible ? 'always' : 'never'}
      role="img"
      aria-label={SCENE_DESCRIPTION}
    >
      {/* First child: its frame update runs before everything that reads the day/night state. */}
      <DayNightController />
      <SeasonController />
      <SkyAndLighting />
      <Ocean segments={quality.oceanSegments} />
      {/* Rapier's WASM loads in the outer boundary, the sign fonts in the inner one, so the
          loading screen can report them as separate stages. */}
      <Suspense fallback={null}>
        {/* Gravity off: the boat's height is locked, and islands are fixed bodies. */}
        <Physics gravity={[0, 0, 0]}>
          <PhysicsSignal onStage={onStage} />
          <Suspense fallback={null}>
            <Boat />
            <Islands />
            <FontsSignal onStage={onStage} />
            <FirstFrameSignal onStage={onStage} />
          </Suspense>
        </Physics>
      </Suspense>
      <BoatWake />
      {/* Season-only props and particles (lazy-loaded per season; nothing for Summer). */}
      <SeasonDecorations />
      {/* Purely decorative wildlife: skipped for visitors who prefer reduced motion.
          Day brings fish and seagulls (bats at Halloween); night brings the whale and stingrays. */}
      {!reducedMotion && (
        <>
          {isNight ? (
            <>
              <Whale />
              <Stingrays />
            </>
          ) : (
            <>
              <JumpingFish />
              <Seagulls variant={themes[season].birds} />
            </>
          )}
          <WindTrails />
        </>
      )}
      <CameraRig />
      <NightEffects />
    </Canvas>
  )
}
