import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, ShaderMaterial, type Points } from 'three'
import { useQuality } from '../../hooks/useQuality'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { boatState } from '../boat/boatState'
import { envState } from '../environment/dayNight'
import { seededRandom } from '../models/geometry'

type Kind = 'snow' | 'hearts'

const SETTINGS: Record<Kind, { count: number; size: number; speed: number; drift: number; color: [number, number, number] }> = {
  // speed: units/s (negative = falling); size: pixels at 100 units distance
  snow: { count: 300, size: 9, speed: -3.2, drift: 1.2, color: [1, 1, 1] },
  hearts: { count: 100, size: 34, speed: 1.6, drift: 2.2, color: [1, 0.42, 0.62] },
}

const AREA = 130 // width/depth of the particle box around the boat
const HEIGHT = 45

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uSpeed;
uniform float uDrift;
uniform float uSize;
uniform vec2 uCenter;
attribute vec4 aSeed; // xyz = start position in the box, w = random phase
varying float vFade;

void main() {
  // Move in the shader and wrap around a box that follows the boat, so particles never run out
  // and there's zero per-frame CPU work.
  float y = mod(aSeed.y + uTime * uSpeed, ${HEIGHT.toFixed(1)});
  float sway = sin(uTime * 0.7 + aSeed.w * 6.283) * uDrift;
  vec2 xz = aSeed.xz + vec2(sway, cos(uTime * 0.5 + aSeed.w * 4.0) * uDrift * 0.6);
  xz = mod(xz - uCenter + ${(AREA / 2).toFixed(1)}, ${AREA.toFixed(1)}) - ${(AREA / 2).toFixed(1)} + uCenter;
  vec4 mv = viewMatrix * vec4(xz.x, y, xz.y, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (100.0 / -mv.z);
  // Fade in/out at the top and bottom of the box so the wrap isn't visible.
  vFade = smoothstep(0.0, 4.0, y) * (1.0 - smoothstep(${(HEIGHT - 6).toFixed(1)}, ${HEIGHT.toFixed(1)}, y));
}
`

const fragmentShader = (kind: Kind) => /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vFade;

void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  p.y = -p.y;
  float a;
  ${
    kind === 'snow'
      ? // Soft round flake
        'a = 1.0 - smoothstep(0.35, 1.0, length(p));'
      : // Heart: implicit curve (x² + y² − 1)³ − x²y³ ≤ 0, scaled to fit the point sprite
        `vec2 q = p * 1.25 + vec2(0.0, 0.25);
         float h = pow(q.x * q.x + q.y * q.y - 1.0, 3.0) - q.x * q.x * q.y * q.y * q.y;
         a = 1.0 - smoothstep(-0.02, 0.02, h);`
  }
  a *= vFade * uOpacity;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor, a);
}
`

/**
 * Season particles (falling snow or rising hearts) in a box that follows the boat.
 * Fewer particles on low-end devices (quality tier); hidden entirely for reduced motion.
 */
export default function SeasonParticles({ kind }: { kind: Kind }) {
  const reducedMotion = useReducedMotion()
  const points = useRef<Points>(null)
  const s = SETTINGS[kind]
  const { particleScale } = useQuality()

  const { geometry, material } = useMemo(() => {
    const count = Math.round(s.count * particleScale)
    const rand = seededRandom(kind === 'snow' ? 11 : 22)
    const seeds = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      seeds.set([(rand() - 0.5) * AREA, rand() * HEIGHT, (rand() - 0.5) * AREA, rand()], i * 4)
    }
    const geo = new BufferGeometry()
    geo.setAttribute('aSeed', new BufferAttribute(seeds, 4))
    // A dummy position attribute keeps three.js happy about the draw count.
    geo.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3))
    const mat = new ShaderMaterial({
      vertexShader,
      fragmentShader: fragmentShader(kind),
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: s.speed },
        uDrift: { value: s.drift },
        uSize: { value: s.size },
        uCenter: { value: [0, 0] },
        uColor: { value: s.color },
        uOpacity: { value: 1 },
      },
    })
    return { geometry: geo, material: mat }
  }, [kind, s, particleScale])
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame((state) => {
    if (!points.current) return
    const u = (points.current.material as ShaderMaterial).uniforms
    u.uTime.value = state.clock.elapsedTime
    // Update the existing array in place rather than allocating a new one every frame.
    u.uCenter.value[0] = boatState.position.x
    u.uCenter.value[1] = boatState.position.z
    // Slightly dimmer at night so it doesn't look like it's glowing on its own.
    u.uOpacity.value = kind === 'snow' ? 0.95 - envState.night * 0.3 : 0.9 - envState.night * 0.2
  })

  if (reducedMotion) return null
  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
}
