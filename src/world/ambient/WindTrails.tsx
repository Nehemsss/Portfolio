import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, ShaderMaterial, Vector3, type Mesh } from 'three'
import { useQuality } from '../../hooks/useQuality'
import { boatState } from '../boat/boatState'
import { envState } from '../environment/dayNight'

const SEGMENTS = 90
const LENGTH = 36
const HALF_WIDTH = 0.32 // wide enough to read from the high bird's-eye camera
const DRAW_TIME = 3.2 // seconds for the head to travel the whole curve
const VISIBLE_FRACTION = 0.42 // how much of the curve is visible at once
/** Prevailing wind direction (unit vector on XZ). */
const WIND = new Vector3(1, 0, -0.35).normalize()
const SIDE = new Vector3(-WIND.z, 0, WIND.x) // perpendicular on XZ
// Scratch vectors reused on every respawn, so the frame loop never allocates.
const scratchOrigin = new Vector3()
const scratchPoint = new Vector3()

const vertexShader = /* glsl */ `
  attribute float aS;
  varying float vS;
  void main() {
    vS = aS;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Only the stretch of curve between (head - length) and head is drawn, tapered at both ends,
// so the trail appears to "draw itself" across the sky and then vanish.
const fragmentShader = /* glsl */ `
  uniform float uHead;
  uniform float uLength;
  uniform float uFade;
  varying float vS;
  void main() {
    float tail = uHead - uLength;
    float alpha = smoothstep(tail, tail + uLength * 0.5, vS) * (1.0 - smoothstep(uHead - 0.04, uHead, vS));
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.9 * uFade);
  }
`

/**
 * Writes one trail's curve into its ribbon geometry: a gentle sideways wiggle along the wind,
 * with a single vertical curl loop partway through (the classic cartoon "whoosh").
 */
function writeCurve(geo: BufferGeometry, origin: Vector3, seed: number) {
  const pos = geo.attributes.position as BufferAttribute
  const wiggle = 1.5 + (seed % 1) * 2
  const loopAt = 0.4 + (seed * 7.13 % 1) * 0.25
  const loopRadius = 2.2 + (seed * 3.7 % 1) * 1.2
  const p = scratchPoint
  for (let i = 0; i <= SEGMENTS; i++) {
    const s = i / SEGMENTS
    // Curl: inside a short window, go round a full circle. The circle lies mostly flat (sideways)
    // so it reads as a loop from the high bird's-eye camera, with a slight lift for depth.
    const loop = Math.min(Math.max((s - loopAt) / 0.14, 0), 1)
    const angle = loop * Math.PI * 2
    const along = s * LENGTH - Math.sin(angle) * loopRadius
    const up = (1 - Math.cos(angle)) * loopRadius * 0.3
    const sideways = Math.sin(s * Math.PI * 2) * wiggle + (1 - Math.cos(angle)) * loopRadius
    p.copy(origin).addScaledVector(WIND, along).addScaledVector(SIDE, sideways)
    p.y += up
    // Flat ribbon facing up: the bird's-eye camera sees it clearly.
    pos.setXYZ(i * 2, p.x + SIDE.x * HALF_WIDTH, p.y, p.z + SIDE.z * HALF_WIDTH)
    pos.setXYZ(i * 2 + 1, p.x - SIDE.x * HALF_WIDTH, p.y, p.z - SIDE.z * HALF_WIDTH)
  }
  pos.needsUpdate = true
  geo.computeBoundingSphere()
}

function Trail({ index }: { index: number }) {
  const mesh = useRef<Mesh>(null)
  const startTime = useRef<number | null>(null)
  const seed = useRef(index * 0.37 + 0.11)

  const { geometry, material } = useMemo(() => {
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(new Float32Array((SEGMENTS + 1) * 2 * 3), 3))
    const s = new Float32Array((SEGMENTS + 1) * 2)
    for (let i = 0; i <= SEGMENTS; i++) s[i * 2] = s[i * 2 + 1] = i / SEGMENTS
    geo.setAttribute('aS', new BufferAttribute(s, 1))
    const index: number[] = []
    for (let i = 0; i < SEGMENTS; i++) {
      const a = i * 2
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    geo.setIndex(index)
    const mat = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: { uHead: { value: -1 }, uLength: { value: VISIBLE_FRACTION }, uFade: { value: 1 } },
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

  useFrame((state) => {
    const m = mesh.current
    if (!m) return
    const now = state.clock.elapsedTime
    const progress = startTime.current === null ? Infinity : (now - startTime.current) / DRAW_TIME
    if (progress > 1 + VISIBLE_FRACTION) {
      // Respawn upwind of the boat at a random spot so trails blow across the view.
      seed.current = (seed.current * 9.31 + 0.217) % 1
      const r = seed.current
      const origin = scratchOrigin
        .copy(boatState.position)
        .addScaledVector(WIND, -LENGTH * 0.6 + (r - 0.5) * 20)
        .addScaledVector(SIDE, (((r * 13.7) % 1) - 0.5) * 50)
      origin.y = 9 + r * 6
      writeCurve(m.geometry, origin, r)
      // First spawn is staggered by index so trails don't all appear together.
      startTime.current = now + (startTime.current === null ? index * 1.3 : 0.5 + r * 2.5)
      ;(m.material as ShaderMaterial).uniforms.uHead.value = -1
      return
    }
    const u = (m.material as ShaderMaterial).uniforms
    u.uHead.value = progress
    u.uFade.value = 1 - envState.night * 0.9 // barely visible at night (white streaks look odd in the dark)
  })

  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} renderOrder={2} />
}

/** Stylized wind streaks with a curl, drifting across the scene near the boat (fewer on low-end devices). */
export default function WindTrails() {
  const { windTrails } = useQuality()
  return (
    <>
      {Array.from({ length: windTrails }, (_, i) => (
        <Trail key={i} index={i} />
      ))}
    </>
  )
}
