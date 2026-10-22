import { useCallback, useState } from 'react'
import { useProgress } from '@react-three/drei'
import ViewSwitcher from '../components/ViewSwitcher'
import LoadingScreen from '../components/LoadingScreen'
import MotionToggle from '../components/MotionToggle'
import { useCoarsePointer } from '../hooks/useCoarsePointer'
import DayNightToggle from '../hud/DayNightToggle'
import DockPrompt from '../hud/DockPrompt'
import Joystick from '../hud/Joystick'
import Minimap from '../hud/Minimap'
import SeasonPicker from '../hud/SeasonPicker'
import SectionModal from '../hud/SectionModal'
import { useAppStore } from '../store/useAppStore'
import { LOAD_STAGES, type LoadStage } from './loadStages'
import World from './World'

export default function WorldPage() {
  // This module running at all means the 3D chunk has downloaded.
  const [doneStages, setDoneStages] = useState<LoadStage[]>(['chunk'])
  const markStage = useCallback(
    (stage: LoadStage) => setDoneStages((done) => (done.includes(stage) ? done : [...done, stage])),
    [],
  )
  const ready = doneStages.length === LOAD_STAGES.length
  const nextStage = LOAD_STAGES.find((s) => !doneStages.includes(s.id))
  // drei only tracks three.js loaders (GLTFs, textures). There are none yet, but any added later
  // fill the bar smoothly within the current stage.
  const { active, progress: assetProgress } = useProgress()
  const progress = Math.round(((doneStages.length + (active ? assetProgress / 100 : 0)) / LOAD_STAGES.length) * 100)

  const isTouch = useCoarsePointer()
  const sailing = useAppStore((s) => s.activeSection === null)
  // Dismissable, but only for this visit: it comes back whenever the 3D page is entered again.
  const [hintOpen, setHintOpen] = useState(true)

  return (
    <div className={`world-page ${isTouch ? 'is-touch' : ''}`}>
      <World onStage={markStage} />
      {ready ? (
        <>
          <div className="hud-top">
            <div className="hud-left">
              <DayNightToggle />
              <MotionToggle />
            </div>
            <div className="hud-center">
              <SeasonPicker />
            </div>
            <ViewSwitcher />
          </div>
          <DockPrompt />
          <Minimap />
          {isTouch && sailing && <Joystick />}
          {hintOpen && (
            <div className="hud-hint">
              {isTouch ? (
                <p className="hud-hint-text">
                  Joystick sail <span className="hud-hint-sep">·</span> Tap Dock{' '}
                  <span className="hud-hint-sep">·</span> Pinch zoom <span className="hud-hint-sep">·</span> Drag
                  rotate
                </p>
              ) : (
                <p className="hud-hint-text">
                  <kbd>W</kbd>
                  <kbd>A</kbd>
                  <kbd>S</kbd>
                  <kbd>D</kbd> sail <span className="hud-hint-sep">·</span> <kbd>E</kbd> dock{' '}
                  <span className="hud-hint-sep">·</span> Right-drag or <kbd>[</kbd>
                  <kbd>]</kbd> rotate <span className="hud-hint-sep">·</span> Scroll or <kbd>+</kbd>
                  <kbd>-</kbd> zoom
                </p>
              )}
              <button
                type="button"
                className="hud-hint-close"
                aria-label="Hide controls hint"
                onClick={() => setHintOpen(false)}
              >
                ✕
              </button>
            </div>
          )}
          <SectionModal />
        </>
      ) : (
        <LoadingScreen progress={progress} label={nextStage?.label} />
      )}
    </div>
  )
}
