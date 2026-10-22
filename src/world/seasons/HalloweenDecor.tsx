import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Matrix4,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  type Group,
} from 'three'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useTimeOfDay } from '../../store/useAppStore'
import { envState } from '../environment/dayNight'
import { DECK_Y, PIER_WIDTH, RING_RADIUS, dockLayout } from '../islands/dockLayout'
import { GROUND_Y, ISLANDS, LANDMARK_SCALE, facingDock, islandById } from '../layout'
import { seededRandom } from '../models/geometry'
import InstancedProp from '../models/InstancedProp'
import { scenery } from '../scenery'
import GhostShip from './GhostShip'
import SpookyBrew from './SpookyBrew'

const home = islandById('home')

/*
 * Halloween decorations: pumpkins on every dock (plus little pumpkin patches), floating ghostly
 * lanterns, gravestones on the small islets and, at night, the Flying Dutchman.
 * (Bats replace seagulls via the theme's `birds: 'bats'`; orange/purple light and thick fog come
 * from the theme palette.)
 */

const LANTERN_GLOW = new Color('#a6ffbf')

// Module-level materials so the frame loop can light them up at night.
// Pumpkins glow from inside at night (jack-o'-lanterns); flat shading shows the ribs.
const pumpkinMaterial = new MeshStandardMaterial({
  color: '#ff8a1f',
  roughness: 0.7,
  flatShading: true,
  emissive: '#ff5a00',
  emissiveIntensity: 0,
})
const stemMaterial = new MeshStandardMaterial({ color: '#4d6b2a', flatShading: true })
const graveMaterial = new MeshStandardMaterial({ color: '#8f939c', roughness: 1, flatShading: true })
const lanternMaterial = new MeshBasicMaterial({ color: LANTERN_GLOW.clone(), transparent: true, opacity: 0.85, toneMapped: false })
const GHOST_GLOW = new Color('#e9fff4')
// Ghosts: pale, slightly see-through and softly glowing (bloom gives them a halo at night).
// fog: false so Halloween's thick night fog doesn't swallow them.
const ghostMaterial = new MeshBasicMaterial({ color: GHOST_GLOW.clone(), transparent: true, opacity: 0.85, side: DoubleSide, depthWrite: false, toneMapped: false, fog: false })
const faceMaterial = new MeshBasicMaterial({ color: '#1a1022' })

function useHalloweenLayout() {
  return useMemo(() => {
    const rand = seededRandom(1031)
    const pumpkins: Matrix4[] = []
    const stems: Matrix4[] = []
    const addPumpkin = (x: number, y: number, z: number, size: number) => {
      const yaw = rand() * Math.PI * 2
      // Squashed sphere (wider than tall, like a pumpkin), sunk slightly into the ground.
      pumpkins.push(
        new Matrix4()
          .makeRotationY(yaw)
          .multiply(new Matrix4().makeScale(size, size * 0.72, size))
          .setPosition(x, y + size * 0.66, z),
      )
      stems.push(new Matrix4().makeRotationY(yaw).multiply(new Matrix4().makeScale(size, size, size)).setPosition(x, y + size * 1.4, z))
    }

    // Big pumpkins on each dock: two at the pier tip, one at the foot of the stairs.
    const lanterns: { x: number; y: number; z: number; phase: number }[] = []
    ISLANDS.forEach((island) => {
      const d = dockLayout(island)
      const p = (x: number, z: number, size: number) => {
        const w = d.toWorld(x, DECK_Y, z)
        addPumpkin(w.x, w.y, w.z, size)
      }
      p(-(PIER_WIDTH / 2 - 0.8), d.pierEnd - 1.2, 0.78)
      p(PIER_WIDTH / 2 - 0.75, d.pierEnd - 1.5, 0.68)
      p(PIER_WIDTH / 2 - 0.75, d.pierStart + 0.7, 0.62)
      // Two ghostly lanterns hovering either side of the docking ring.
      for (const side of [-1, 1]) {
        const w = d.toWorld(side * (RING_RADIUS + 1.2), 4, d.ringCenter)
        lanterns.push({ x: w.x, y: w.y, z: w.z, phase: rand() * Math.PI * 2 })
      }

      // A row of pumpkins along both sides of the stepping-stone path.
      for (let z = island.radius * 0.58; z < d.stairsStart - 0.6; z += 3.2) {
        for (const side of [-1, 1]) {
          const w = d.toWorld(side * 1.95, GROUND_Y, z)
          addPumpkin(w.x, w.y, w.z, 0.8 + rand() * 0.3)
        }
      }
    })

    // Pumpkin patches of big pumpkins on every reserved island spot.
    scenery.decorSpots
      .filter((s) => !s.islet)
      .forEach((spot) => {
        const count = 3 + Math.floor(rand() * 2)
        for (let k = 0; k < count; k++) {
          addPumpkin(spot.x + (rand() - 0.5) * 2.4, spot.y, spot.z + (rand() - 0.5) * 2.4, 0.9 + rand() * 0.6)
        }
      })

    // Gravestones on the islets' sand: rounded slabs, every third one a cross instead.
    const slabs: Matrix4[] = []
    const tops: Matrix4[] = []
    const crossV: Matrix4[] = []
    const crossH: Matrix4[] = []
    scenery.decorSpots
      .filter((s) => s.islet)
      .forEach((spot, i) => {
        // Slight random lean, like old graves.
        const base = new Matrix4()
          .makeRotationY(spot.yaw)
          .multiply(new Matrix4().makeRotationX((rand() - 0.5) * 0.25))
          .setPosition(spot.x, spot.y, spot.z)
        if (i % 3 === 2) {
          crossV.push(base.clone().multiply(new Matrix4().setPosition(0, 0.75, 0)))
          crossH.push(base.clone().multiply(new Matrix4().setPosition(0, 1.05, 0)))
        } else {
          slabs.push(base.clone().multiply(new Matrix4().setPosition(0, 0.5, 0)))
          tops.push(base.clone().multiply(new Matrix4().setPosition(0, 1.0, 0)))
        }
        // A pumpkin keeping each grave company.
        const side = rand() < 0.5 ? -1 : 1
        addPumpkin(spot.x + Math.cos(spot.yaw) * 0.9 * side, spot.y, spot.z - Math.sin(spot.yaw) * 0.9 * side, 0.6 + rand() * 0.2)
      })

    // Ghosts (night only): one circling each island just beyond its cliff edge (clear of the
    // lighthouse, buildings and pine groves), plus a couple drifting over open water.
    const ghosts: GhostPath[] = []
    ISLANDS.forEach((island) => {
      for (let k = 0; k < 1; k++) {
        ghosts.push({
          cx: island.x,
          cz: island.z,
          radius: island.radius * (1.12 + k * 0.22),
          // Bigger ghosts now hang ~3 units below their centre, so keep them well above the docks.
          height: GROUND_Y + 4.5 + k * 3,
          speed: (k ? -1 : 1) * (0.18 + rand() * 0.08),
          phase: rand() * Math.PI * 2,
        })
      }
    })
    ;[
      [-30, 40],
      [35, 48],
    ].forEach(([x, z]) => {
      ghosts.push({ cx: x, cz: z, radius: 6 + rand() * 4, height: 5 + rand() * 3, speed: 0.22 * (rand() < 0.5 ? -1 : 1), phase: rand() * 6 })
    })

    return { pumpkins, stems, lanterns, slabs, tops, crossV, crossH, ghosts }
  }, [])
}

interface GhostPath {
  cx: number
  cz: number
  radius: number
  height: number
  speed: number
  phase: number
}

/**
 * A classic sheet ghost: round head, a flared body with a wavy hem (little bumps round the bottom),
 * dark eyes and mouth. Circles slowly, bobbing and swaying. Forward is local +Z.
 */
function Ghost({ path }: { path: GhostPath }) {
  const g = useRef<Group>(null)
  const reducedMotion = useReducedMotion()
  useFrame((state) => {
    if (!g.current) return
    const t = reducedMotion ? 0 : state.clock.elapsedTime
    const a = path.phase + t * path.speed
    const dir = Math.sign(path.speed)
    g.current.position.set(
      path.cx + Math.cos(a) * path.radius,
      path.height + Math.sin(t * 1.3 + path.phase) * 0.6,
      path.cz + Math.sin(a) * path.radius,
    )
    g.current.rotation.set(Math.sin(t * 0.9 + path.phase) * 0.08, Math.atan2(-Math.sin(a) * dir, Math.cos(a) * dir), Math.sin(t * 1.1) * 0.1, 'YXZ')
  })
  return (
    // ~5 units tall: about the size of the boat, so they read clearly from the bird's-eye camera.
    <group ref={g} scale={2.4}>
      <mesh material={ghostMaterial} position-y={0.7}>
        <sphereGeometry args={[0.85, 14, 10]} />
      </mesh>
      <mesh material={ghostMaterial} position-y={-0.2}>
        <cylinderGeometry args={[0.85, 1.05, 1.6, 14, 1, true]} />
      </mesh>
      {/* Wavy hem */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <mesh key={i} material={ghostMaterial} position={[Math.cos(a) * 0.9, -1.0, Math.sin(a) * 0.9]}>
            <sphereGeometry args={[0.26, 8, 6]} />
          </mesh>
        )
      })}
      {/* Face */}
      {[-0.28, 0.28].map((x) => (
        <mesh key={x} material={faceMaterial} position={[x, 0.85, 0.74]} scale={[1, 1.4, 0.6]}>
          <sphereGeometry args={[0.13, 8, 6]} />
        </mesh>
      ))}
      <mesh material={faceMaterial} position={[0, 0.45, 0.8]} scale={[1, 1.3, 0.5]}>
        <sphereGeometry args={[0.12, 8, 6]} />
      </mesh>
    </group>
  )
}

/** One floating lantern: a glowing body with dark caps, bobbing and swaying. */
function GhostLantern({ x, y, z, phase }: { x: number; y: number; z: number; phase: number }) {
  const g = useRef<Group>(null)
  const reducedMotion = useReducedMotion()
  useFrame((state) => {
    if (!g.current) return
    const t = reducedMotion ? 0 : state.clock.elapsedTime
    g.current.position.set(x + Math.sin(t * 0.4 + phase) * 0.6, y + Math.sin(t * 1.1 + phase) * 0.45, z)
    g.current.rotation.z = Math.sin(t * 0.9 + phase) * 0.12
  })
  return (
    <group ref={g}>
      <mesh material={lanternMaterial}>
        <cylinderGeometry args={[0.32, 0.32, 0.6, 6]} />
      </mesh>
      <mesh material={graveMaterial} position-y={0.36}>
        <coneGeometry args={[0.42, 0.25, 6]} />
      </mesh>
      <mesh material={graveMaterial} position-y={-0.34}>
        <cylinderGeometry args={[0.36, 0.36, 0.08, 6]} />
      </mesh>
    </group>
  )
}

export default function HalloweenDecor() {
  const layout = useHalloweenLayout()
  const isNight = useTimeOfDay() === 'night'
  const reducedMotion = useReducedMotion()

  const geometries = useMemo(
    () => ({
      // Low segment count + flat shading = visible pumpkin ribs.
      pumpkin: new SphereGeometry(1, 10, 7),
      stem: new CylinderGeometry(0.06, 0.09, 0.3, 5),
      slab: new BoxGeometry(0.9, 1, 0.22),
      top: new CylinderGeometry(0.45, 0.45, 0.22, 10).rotateX(Math.PI / 2),
      crossV: new BoxGeometry(0.2, 1.5, 0.2),
      crossH: new BoxGeometry(0.8, 0.2, 0.2),
    }),
    [],
  )
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries])

  useFrame((state) => {
    const n = envState.night
    const flicker = 0.9 + Math.sin(state.clock.elapsedTime * 9) * 0.06
    pumpkinMaterial.emissiveIntensity = n * 1.3 * flicker
    lanternMaterial.color.copy(LANTERN_GLOW).multiplyScalar(0.9 + n * 2.2 * flicker)
    ghostMaterial.color.copy(GHOST_GLOW).multiplyScalar(1 + n * 0.9)
  })

  return (
    <>
      <InstancedProp geometry={geometries.pumpkin} material={pumpkinMaterial} matrices={layout.pumpkins} />
      <InstancedProp geometry={geometries.stem} material={stemMaterial} matrices={layout.stems} />
      <InstancedProp geometry={geometries.slab} material={graveMaterial} matrices={layout.slabs} />
      <InstancedProp geometry={geometries.top} material={graveMaterial} matrices={layout.tops} />
      <InstancedProp geometry={geometries.crossV} material={graveMaterial} matrices={layout.crossV} />
      <InstancedProp geometry={geometries.crossH} material={graveMaterial} matrices={layout.crossH} />
      {layout.lanterns.map((l, i) => (
        <GhostLantern key={i} {...l} />
      ))}
      {/* Spooky Brew on the Home Island: in the gap between the welcome sign (local z ≈ -4.2) and
          the crop field's back fence (≈ -1.25), placed in the landmark's own frame and scale. */}
      <group position={[home.x, GROUND_Y, home.z]} rotation-y={facingDock(home.dockAngle)} scale={LANDMARK_SCALE}>
        <SpookyBrew position={[1.5, 0, -2.7]} />
      </group>
      {/* Ghosts haunt the islands only at night. */}
      {isNight && layout.ghosts.map((path, i) => <Ghost key={i} path={path} />)}
      {/* The Flying Dutchman only sails on Halloween nights (and not under reduced motion). */}
      {isNight && !reducedMotion && <GhostShip />}
    </>
  )
}
