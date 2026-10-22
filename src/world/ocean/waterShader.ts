/**
 * Stylized low-poly water.
 * - Vertex: displaces a flat grid by waveHeight() in world space.
 * - Fragment: faceted normals from screen-space derivatives, lighter shallows + animated foam
 *   rings near shores, cartoon "wave stroke" dashes drifting across open water, and sun glitter.
 * Uniforms like uSunDir/uSparkle/colours are driven by the day/night and season systems.
 */
import { Color, ShaderMaterial, UniformsLib, UniformsUtils, Vector3 } from 'three'
import { SHORES, wavesGLSL } from './waves'
import { SUN_DIRECTION } from '../environment/sun'

const vertexShader = /* glsl */ `
uniform float uTime;
varying vec3 vWorldPos;
#include <fog_pars_vertex>
${wavesGLSL}

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  worldPos.y += waveHeight(worldPos.xz, uTime);
  vWorldPos = worldPos.xyz;
  vec4 mvPosition = viewMatrix * worldPos;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uDeepColor;
uniform vec3 uShallowColor;
uniform vec3 uFoamColor;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uAmbient;
uniform float uSparkle;
uniform float uStrokes;
varying vec3 vWorldPos;
#include <fog_pars_fragment>
${wavesGLSL}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Smooth value noise in [0, 1].
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  // Per-triangle normal from derivatives of world position: the faceted look with no normal attribute.
  vec3 n = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
  if (n.y < 0.0) n = -n;
  vec2 p = vWorldPos.xz;
  // How many world units one pixel covers: used to fade fine detail before it aliases into noise.
  float pixelSize = length(fwidth(p));

  float shore = shoreDistance(p);
  vec3 col = mix(uDeepColor, uShallowColor, smoothstep(-0.6, 0.7, vWorldPos.y) * 0.35);
  col = mix(col, uShallowColor, 1.0 - smoothstep(0.0, 11.0, shore));

  // Shore foam: a solid rim at the waterline plus bands that drift toward the shore.
  float band = step(0.62, fract(shore * 0.3 + uTime * 0.5));
  float foam = (1.0 - smoothstep(0.5, 5.0, shore)) * band;
  foam = max(foam, 1.0 - smoothstep(0.0, 1.2, shore));
  // (No wave-crest foam: where several waves peak together it blurred into hazy white patches
  // from the high camera. The wave strokes below give the open water its texture instead.)

  // Cartoon wave strokes: thin stripes, warped by noise into curves, chopped into short dashes
  // by a second noise, drifting slowly. Kept away from shores, where the foam rings live.
  float warp = vnoise(p * 0.035 + uTime * 0.03) * 7.0;
  float stripe = sin(p.y * 0.42 + p.x * 0.1 + warp - uTime * 0.8);
  float aa = fwidth(stripe);
  float line = smoothstep(0.975 - aa, 0.99 + aa, stripe);
  float dash = smoothstep(0.66, 0.74, vnoise(p * vec2(0.11, 0.3) + vec2(uTime * 0.06, 0.0)));
  float strokes = line * dash * smoothstep(3.0, 9.0, shore) * (1.0 - smoothstep(0.25, 0.7, pixelSize));
  foam = max(foam, strokes * 0.4 * uStrokes);

  vec3 L = normalize(uSunDir);
  vec3 V = normalize(cameraPosition - vWorldPos);
  float diffuse = max(dot(n, L), 0.0);

  // Sun glint broken into twinkling glitter: the gentle waves alone would reflect the sun as one
  // broad smear. Instead, a few random grid cells (re-rolled 4x a second) each hold one small
  // soft round sparkle at a random spot inside the cell, so glints read as dots, not squares.
  float facing = max(dot(n, normalize(L + V)), 0.0);
  vec2 cell = floor(p * 0.8);
  float roll = floor(uTime * 4.0);
  float lit = step(0.95, hash(cell + roll));
  vec2 center = vec2(hash(cell + roll + 17.0), hash(cell + roll + 41.0)) * 0.6 + 0.2;
  float dotShape = 1.0 - smoothstep(0.06, 0.2, length(fract(p * 0.8) - center));
  float spec = pow(facing, 120.0) * lit * dotShape * 2.2 * uSparkle * (1.0 - smoothstep(0.12, 0.35, pixelSize));

  vec3 light = uAmbient + diffuse * uSunColor;
  vec3 color = mix(col * light, uFoamColor * light, foam) + spec * uSunColor;

  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`

export function createWaterMaterial() {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    fog: true,
    uniforms: UniformsUtils.merge([
      UniformsLib.fog,
      {
        uTime: { value: 0 },
        uShores: { value: SHORES.map(([x, z, r]) => new Vector3(x, z, r)) },
        uDeepColor: { value: new Color('#1386d0') },
        uShallowColor: { value: new Color('#45dcd6') },
        uFoamColor: { value: new Color('#f4fdff') },
        uSunDir: { value: SUN_DIRECTION.clone() },
        uSunColor: { value: new Color('#fff3d6') },
        uAmbient: { value: new Color('#5f86a8') },
        uSparkle: { value: 0.8 },
        /** 0–1 strength of the cartoon wave strokes (reduced-motion and seasons can tone it down). */
        uStrokes: { value: 1 },
      },
    ]),
  })
}

export type WaterMaterial = ReturnType<typeof createWaterMaterial>
