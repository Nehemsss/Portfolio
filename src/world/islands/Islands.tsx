import type { ComponentType } from 'react'
import { portfolio } from '../../data/portfolio'
import { GROUND_Y, ISLANDS, LANDMARK_SCALE, facingDock, type IslandId } from '../layout'
import Dock from './Dock'
import IslandColliders from './IslandColliders'
import IslandLabel from './IslandLabel'
import Scenery from './Scenery'
import HomeLandmark from './landmarks/HomeLandmark'
import AboutLandmark from './landmarks/AboutLandmark'
import AchievementsLandmark from './landmarks/AchievementsLandmark'
import SkillsLandmark from './landmarks/SkillsLandmark'
import EducationLandmark from './landmarks/EducationLandmark'

/** Each island's signature building(s). Built facing local +Z, which is rotated to face the dock. */
const LANDMARKS: Record<IslandId, ComponentType> = {
  home: HomeLandmark,
  about: AboutLandmark,
  achievements: AchievementsLandmark,
  skills: SkillsLandmark,
  education: EducationLandmark,
}

const labelFor = (id: IslandId) => portfolio.sections.find((s) => s.id === id)?.shortLabel

export default function Islands() {
  return (
    <>
      <IslandColliders />
      <Scenery />
      {ISLANDS.map((island) => {
        const Landmark = LANDMARKS[island.id]
        const label = labelFor(island.id)
        return (
          <group key={island.id}>
            <group position={[island.x, GROUND_Y, island.z]} rotation-y={facingDock(island.dockAngle)}>
              <group scale={LANDMARK_SCALE}>
                <Landmark />
              </group>
            </group>
            <Dock island={island} />
            {/* World-space nameplate that tracks the camera-facing shore */}
            {label && <IslandLabel text={label} x={island.x} z={island.z} radius={island.radius} />}
          </group>
        )
      })}
    </>
  )
}
