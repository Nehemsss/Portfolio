/**
 * Ocean surface height, mirrored exactly in the water vertex shader (see waterShader.ts)
 * so the boat can bob on the same surface the visitor sees.
 *
 * Height = sum of a few directional sine waves, damped near shores so waves never wash over beaches.
 */
import { ISLANDS, ISLETS } from '../layout'

// [dirX, dirZ, frequency, speed, amplitude]
export const WAVES: [number, number, number, number, number][] = [
  [1.0, 0.0, 0.08, 0.9, 0.3],
  [0.0, 1.0, 0.11, -1.1, 0.2],
  [0.707, 0.707, 0.05, 0.6, 0.35],
  [0.573, -0.819, 0.17, 1.7, 0.1],
]

/** Every landmass as [x, z, radius]: section islands first, then islets. */
export const SHORES: [number, number, number][] = [
  ...ISLANDS.map((i) => [i.x, i.z, i.radius] as [number, number, number]),
  ...ISLETS.map((i) => [i.x, i.z, i.radius] as [number, number, number]),
]

/** Distance to the nearest shoreline (negative inside an island). */
export function shoreDistance(x: number, z: number): number {
  let d = Infinity
  for (const [sx, sz, r] of SHORES) d = Math.min(d, Math.hypot(x - sx, z - sz) - r)
  return d
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

export function waveHeight(x: number, z: number, t: number): number {
  let h = 0
  for (const [dx, dz, freq, speed, amp] of WAVES) {
    h += Math.sin((x * dx + z * dz) * freq + t * speed) * amp
  }
  // Calm water close to land: 25% amplitude at the shore, full amplitude 14 units out.
  return h * (0.25 + 0.75 * smoothstep(0, 14, shoreDistance(x, z)))
}

const f = (n: number) => n.toFixed(3)

/** GLSL versions, generated from the same tables so the shader and the boat can't drift apart. */
export const wavesGLSL = /* glsl */ `
#define SHORE_COUNT ${SHORES.length}
uniform vec3 uShores[SHORE_COUNT]; // x, z, radius

float shoreDistance(vec2 p) {
  float d = 1e5;
  for (int i = 0; i < SHORE_COUNT; i++) d = min(d, length(p - uShores[i].xy) - uShores[i].z);
  return d;
}

float waveHeight(vec2 p, float t) {
  float h = 0.0;
${WAVES.map(([dx, dz, fr, s, a]) => `  h += sin(dot(p, vec2(${f(dx)}, ${f(dz)})) * ${f(fr)} + t * ${f(s)}) * ${f(a)};`).join('\n')}
  return h * (0.25 + 0.75 * smoothstep(0.0, 14.0, shoreDistance(p)));
}
`
