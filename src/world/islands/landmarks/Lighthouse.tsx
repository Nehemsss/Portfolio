import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, ConeGeometry, DoubleSide, ShaderMaterial, type Group, type Mesh } from 'three'
import { useReducedMotion } from '../../../hooks/useReducedMotion'
import { envState } from '../../environment/dayNight'
import { materials } from '../../materials'

/** Height of the lamp room centre above the island ground; the night beam pivots here. */
export const LIGHTHOUSE_LAMP_Y = 10.9

// Tower is stacked tapered bands, alternating white and red. [bottomRadius, topRadius, height]
const BANDS: [number, number, number][] = [
  [1.35, 1.2, 2.4],
  [1.2, 1.05, 2.4],
  [1.05, 0.92, 2.4],
  [0.92, 0.8, 2.4],
]
// Centre height of each band; bands start on top of the 0.6-tall stone base.
const BAND_CENTERS = BANDS.map((_, i) => 0.6 + BANDS.slice(0, i).reduce((sum, b) => sum + b[2], 0) + BANDS[i][2] / 2)

const BEAM_LENGTH = 28 // local units (the landmark is scaled ×2 on the island)
const BEAM_RADIUS = 4.5
const BEAM_SPEED = 0.55 // radians per second
const BEAM_TILT = 0.06 // slight downward angle so the light grazes the sea

/**
 * Night-time light beams: two soft additive cones pointing opposite ways from the lamp, sweeping
 * round. Brightest at the lamp and fading toward the far end. Invisible by day.
 */
function Beam() {
  const pivot = useRef<Group>(null)
  const cone = useRef<Mesh>(null)
  const reducedMotion = useReducedMotion()

  const { geometry, material } = useMemo(() => {
    const geo = new ConeGeometry(BEAM_RADIUS, BEAM_LENGTH, 24, 1, true)
    // Put the tip at the origin (the lamp), then lay the cone on its side pointing along +X.
    geo.translate(0, -BEAM_LENGTH / 2, 0)
    geo.rotateZ(Math.PI / 2 - BEAM_TILT)
    const mat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      uniforms: { uOpacity: { value: 0 } },
      vertexShader: /* glsl */ `
        varying float vAlong;
        void main() {
          vAlong = uv.y; // ConeGeometry: uv.y = 1 at the tip (lamp), 0 at the open end
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        varying float vAlong;
        void main() {
          float a = pow(vAlong, 1.6) * uOpacity;
          gl_FragColor = vec4(vec3(1.0, 0.94, 0.7) * a, a);
        }
      `,
    })
    return { geometry: geo, material: mat }
  }, [])
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame((_, dt) => {
    const p = pivot.current
    if (!p) return
    const n = envState.night
    p.visible = n > 0.01
    if (!p.visible) return
    if (!reducedMotion) p.rotation.y += BEAM_SPEED * Math.min(dt, 1 / 20)
    // Both cones share the material, so one write fades both.
    if (cone.current) (cone.current.material as ShaderMaterial).uniforms.uOpacity.value = n * 0.32
  })

  return (
    <group ref={pivot} position-y={LIGHTHOUSE_LAMP_Y} visible={false}>
      <mesh ref={cone} geometry={geometry} material={material} />
      <mesh geometry={geometry} material={material} rotation-y={Math.PI} />
    </group>
  )
}

export default function Lighthouse(props: { position?: [number, number, number] }) {
  return (
    <group {...props}>
      <mesh material={materials.stone} position-y={0.3}>
        <cylinderGeometry args={[1.7, 1.9, 0.6, 8]} />
      </mesh>
      {BANDS.map(([rb, rt, h], i) => (
        <mesh key={i} material={i % 2 ? materials.red : materials.white} position-y={BAND_CENTERS[i]}>
          <cylinderGeometry args={[rt, rb, h, 10]} />
        </mesh>
      ))}
      {/* Gallery deck and railing ring */}
      <mesh material={materials.slate} position-y={10.2}>
        <cylinderGeometry args={[1.25, 1.25, 0.2, 10]} />
      </mesh>
      <mesh material={materials.slate} position-y={10.55}>
        <torusGeometry args={[1.15, 0.05, 4, 16]} />
      </mesh>
      {/* Lamp room: glows at night via the shared lamp material */}
      <mesh material={materials.lamp} position-y={LIGHTHOUSE_LAMP_Y}>
        <cylinderGeometry args={[0.65, 0.65, 1.2, 8]} />
      </mesh>
      <mesh material={materials.red} position-y={12.0}>
        <coneGeometry args={[0.95, 1.1, 8]} />
      </mesh>
      {/* Door */}
      <mesh material={materials.darkWood} position={[0, 1.4, 1.3]}>
        <boxGeometry args={[0.7, 1.4, 0.2]} />
      </mesh>
      <Beam />
    </group>
  )
}
