import { useRef } from 'react'
import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { FONTS } from '../fonts'

interface Props {
  text: string
  /** Island centre and radius in world space. */
  x: number
  z: number
  radius: number
}

const HEIGHT = 6 // above the water, roughly level with the cliff top
const MARGIN = 3 // how far out from the shore the nameplate floats

/**
 * Floating section nameplate.
 * Each frame it slides to the island's shore nearest the camera, so from the high bird's-eye view
 * it sits just "below" the island on screen instead of drifting off the top edge, and it follows
 * when the camera orbits. <Billboard> keeps the text upright and facing the camera, and depth
 * testing is off (drawn last) so trees and buildings never hide it.
 */
export default function IslandLabel({ text, x, z, radius }: Props) {
  const group = useRef<Group>(null)

  useFrame(({ camera }) => {
    const g = group.current
    if (!g) return
    const dx = camera.position.x - x
    const dz = camera.position.z - z
    const len = Math.hypot(dx, dz) || 1
    g.position.set(x + (dx / len) * (radius + MARGIN), HEIGHT, z + (dz / len) * (radius + MARGIN))
  })

  return (
    <group ref={group}>
      <Billboard>
        <Text
          font={FONTS.heading}
          fontSize={3.4}
          color="#ffffff"
          outlineWidth={0.22}
          outlineColor="#1d3557"
          anchorX="center"
          anchorY="middle"
          renderOrder={10}
          material-depthTest={false}
          material-depthWrite={false}
        >
          {text}
        </Text>
      </Billboard>
    </group>
  )
}
