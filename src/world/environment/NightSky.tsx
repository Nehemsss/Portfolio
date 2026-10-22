import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  MeshBasicMaterial,
  PointsMaterial,
  ShaderMaterial,
  type Group,
  type Mesh,
  type Points,
} from 'three'
import { seededRandom } from '../models/geometry'
import { MOON_SKY_DIRECTION, envState } from './dayNight'

const DOME_RADIUS = 800
const STAR_RADIUS = 700
const STAR_COUNT = 1400
const MOON_DISTANCE = 650

/**
 * Night-only sky layers, faded in by envState.night: a navy gradient dome over drei's <Sky>,
 * a starfield and a glowing moon. Hidden entirely during the day (no draw cost).
 * Note: the bird's-eye camera mostly looks down at the sea, so these show at the horizon/top edge
 * and in reflections of the scene's mood rather than as a big visible sky.
 */
export default function NightSky() {
  const group = useRef<Group>(null)
  const dome = useRef<Mesh>(null)
  const stars = useRef<Points>(null)
  const moon = useRef<Mesh>(null)

  const { domeMaterial, starGeometry, starMaterial, moonMaterial } = useMemo(() => {
    const dome = new ShaderMaterial({
      side: BackSide,
      transparent: true,
      depthWrite: false,
      fog: false,
      uniforms: {
        uOpacity: { value: 0 },
        uTop: { value: new Color('#050d24') },
        uHorizon: { value: new Color('#1d3a6e') },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        uniform vec3 uTop;
        uniform vec3 uHorizon;
        varying vec3 vDir;
        void main() {
          float t = smoothstep(-0.05, 0.6, vDir.y);
          gl_FragColor = vec4(mix(uHorizon, uTop, t), uOpacity);
          #include <colorspace_fragment>
        }
      `,
    })

    // Stars scattered over the upper hemisphere (deterministic so they don't reshuffle).
    const rand = seededRandom(7)
    const positions = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = rand() * Math.PI * 2
      const y = 0.05 + rand() * 0.95 // above the horizon
      const r = Math.sqrt(1 - y * y)
      positions.set([Math.cos(theta) * r * STAR_RADIUS, y * STAR_RADIUS, Math.sin(theta) * r * STAR_RADIUS], i * 3)
    }
    const stars = new BufferGeometry()
    stars.setAttribute('position', new BufferAttribute(positions, 3))
    const starMat = new PointsMaterial({
      color: '#ffffff',
      size: 2.2,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
      blending: AdditiveBlending,
    })

    // toneMapped=false + colour above 1 → the bloom pass makes the moon glow.
    const moon = new MeshBasicMaterial({ color: new Color(1.6, 1.55, 1.35), transparent: true, opacity: 0, fog: false, toneMapped: false })

    return { domeMaterial: dome, starGeometry: stars, starMaterial: starMat, moonMaterial: moon }
  }, [])

  useEffect(
    () => () => {
      domeMaterial.dispose()
      starGeometry.dispose()
      starMaterial.dispose()
      moonMaterial.dispose()
    },
    [domeMaterial, starGeometry, starMaterial, moonMaterial],
  )

  useFrame(({ camera, clock }) => {
    const g = group.current
    if (!g || !dome.current || !stars.current || !moon.current) return
    const n = envState.night
    g.visible = n > 0.001
    if (!g.visible) return
    // Keep the sky layers centred on the camera so they always surround it.
    g.position.copy(camera.position)
    ;(dome.current.material as ShaderMaterial).uniforms.uOpacity.value = n
    ;(moon.current.material as MeshBasicMaterial).opacity = n
    // Gentle overall twinkle.
    ;(stars.current.material as PointsMaterial).opacity = n * (0.85 + Math.sin(clock.elapsedTime * 1.7) * 0.15)
  })

  return (
    <group ref={group} visible={false}>
      <mesh ref={dome} material={domeMaterial} renderOrder={-1}>
        <sphereGeometry args={[DOME_RADIUS, 32, 16]} />
      </mesh>
      <points ref={stars} geometry={starGeometry} material={starMaterial} renderOrder={-1} />
      <mesh ref={moon} material={moonMaterial} position={MOON_SKY_DIRECTION.clone().multiplyScalar(MOON_DISTANCE).toArray()}>
        <sphereGeometry args={[22, 24, 16]} />
      </mesh>
    </group>
  )
}
