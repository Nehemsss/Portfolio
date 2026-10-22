import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, ShaderMaterial, type Mesh } from 'three'
import { waveHeight } from '../ocean/waves'
import { envState } from '../environment/dayNight'
import { boatState, boatTeleport } from './boatState'

const SAMPLES = 48
const SAMPLE_INTERVAL = 0.06 // seconds between committed trail points
const LIFE = SAMPLES * SAMPLE_INTERVAL // ≈ 2.9s
const MAX_SPEED = 16
const STERN_OFFSET = 2.5 // distance behind the boat's centre where the wake starts
const START_HALF_WIDTH = 1.1
const SPREAD = 2.4 // units per second the V widens

interface Sample {
  x: number
  z: number
  yaw: number
  t: number
  strength: number
}

/**
 * Foam wake: a ribbon trailing the stern, built from a ring of recent positions.
 * Each sample spreads sideways as it ages, so the ribbon opens into a V. The shader draws
 * bright foam lines along both edges plus churned water near the boat, all fading with age.
 */
export default function BoatWake() {
  const { geometry, material } = useMemo(() => {
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(new Float32Array(SAMPLES * 2 * 3), 3))
    // side: -1 / +1 across the ribbon; age: 0 (new) → 1 (gone); strength: boat speed when laid down
    const side = new Float32Array(SAMPLES * 2)
    for (let i = 0; i < SAMPLES; i++) {
      side[i * 2] = -1
      side[i * 2 + 1] = 1
    }
    geo.setAttribute('aSide', new BufferAttribute(side, 1))
    geo.setAttribute('aAge', new BufferAttribute(new Float32Array(SAMPLES * 2), 1))
    geo.setAttribute('aStrength', new BufferAttribute(new Float32Array(SAMPLES * 2), 1))
    const index: number[] = []
    for (let i = 0; i < SAMPLES - 1; i++) {
      const a = i * 2
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    geo.setIndex(index)

    const mat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        attribute float aSide;
        attribute float aAge;
        attribute float aStrength;
        varying float vSide;
        varying float vAge;
        varying float vStrength;
        varying vec2 vWorld;
        void main() {
          vSide = aSide;
          vAge = aAge;
          vStrength = aStrength;
          vec4 world = modelMatrix * vec4(position, 1.0);
          vWorld = world.xz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      uniforms: { uNight: { value: 0 } },
      fragmentShader: /* glsl */ `
        uniform float uNight;
        varying float vSide;
        varying float vAge;
        varying float vStrength;
        varying vec2 vWorld;
        void main() {
          float across = abs(vSide);
          // Two bright edge lines that form the V.
          float edges = smoothstep(0.4, 0.75, across) * (1.0 - smoothstep(0.95, 1.0, across));
          // Churned water close behind the stern.
          float churn = (1.0 - across * 0.6) * pow(1.0 - vAge, 2.0);
          // Break both up with a cheap ripple pattern so the wake isn't a flat stripe.
          float ripple = 0.75 + 0.25 * sin(vWorld.x * 2.3 + vWorld.y * 1.7) * sin(vWorld.y * 2.9 - vWorld.x * 1.1);
          float alpha = max(edges, churn) * ripple * (1.0 - vAge) * vStrength;
          if (alpha < 0.01) discard;
          // Moonlit blue-grey at night instead of bright white.
          vec3 color = mix(vec3(0.97, 0.99, 1.0), vec3(0.55, 0.68, 0.85), uNight);
          gl_FragColor = vec4(color, min(alpha * 1.2, 1.0) * (1.0 - uNight * 0.3));
        }
      `,
    })

    return { geometry: geo, material: mat }
  }, [])
  const mesh = useRef<Mesh>(null)
  // Ring buffer of trail points; index 0 is always the live stern position. Created on first frame.
  const samplesRef = useRef<Sample[] | null>(null)
  const lastTeleport = useRef(boatTeleport.count)

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame((state) => {
    if (!mesh.current) return
    ;(mesh.current.material as ShaderMaterial).uniforms.uNight.value = envState.night
    const geo = mesh.current.geometry
    samplesRef.current ??= Array.from({ length: SAMPLES }, () => ({ x: 0, z: 0, yaw: 0, t: -LIFE, strength: 0 }))
    const samples = samplesRef.current
    const now = state.clock.elapsedTime
    const { position: p, yaw, speed } = boatState

    // Start the wake fresh (all old points expired, at the boat) when the trail would otherwise
    // stretch: after a minimap quick travel (old points are back where the boat used to be), or
    // after a long gap between frames, e.g. returning to a hidden tab, where rendering was paused.
    const teleported = boatTeleport.count !== lastTeleport.current
    const resumed = now - samples[0].t > LIFE
    if (teleported || resumed) {
      lastTeleport.current = boatTeleport.count
      for (const s of samples) {
        s.x = p.x
        s.z = p.z
        s.t = now - LIFE
        s.strength = 0
      }
    }

    // Commit the head as a permanent point every SAMPLE_INTERVAL by shifting the buffer back.
    if (now - samples[1].t >= SAMPLE_INTERVAL) {
      for (let i = SAMPLES - 1; i > 0; i--) Object.assign(samples[i], samples[i - 1])
    }
    // The live head: the current stern position (written in place, no per-frame allocation).
    const head = samples[0]
    head.x = p.x - Math.sin(yaw) * STERN_OFFSET
    head.z = p.z - Math.cos(yaw) * STERN_OFFSET
    head.yaw = yaw
    head.t = now
    head.strength = Math.min(Math.max(speed, 0) / (MAX_SPEED * 0.4), 1)

    const pos = geo.attributes.position as BufferAttribute
    const age = geo.attributes.aAge as BufferAttribute
    const strength = geo.attributes.aStrength as BufferAttribute
    for (let i = 0; i < SAMPLES; i++) {
      const s = samples[i]
      // Age is capped at LIFE: an expired point stays at its final width instead of growing forever.
      const elapsed = Math.min(now - s.t, LIFE)
      const a = elapsed / LIFE
      const half = START_HALF_WIDTH + elapsed * SPREAD
      // Boat's left vector is (cos yaw, 0, -sin yaw).
      const lx = Math.cos(s.yaw) * half
      const lz = -Math.sin(s.yaw) * half
      for (let side = 0; side < 2; side++) {
        const sign = side === 0 ? -1 : 1
        const x = s.x + lx * sign
        const z = s.z + lz * sign
        // Sit just above the animated water surface so waves don't swallow the foam.
        pos.setXYZ(i * 2 + side, x, waveHeight(x, z, now) + 0.15, z)
        age.setX(i * 2 + side, a)
        strength.setX(i * 2 + side, s.strength)
      }
    }
    pos.needsUpdate = true
    age.needsUpdate = true
    strength.needsUpdate = true
  })

  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} renderOrder={1} />
}
