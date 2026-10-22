/** Capability checks that decide whether the 3D world is offered or the visitor falls back to 2D. */

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/** Heuristic only: ≤2 GB RAM or ≤2 CPU cores. deviceMemory is Chromium-only, so it may be undefined. */
export function isLowEndDevice(): boolean {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const cores = navigator.hardwareConcurrency
  return (memory !== undefined && memory <= 2) || (cores !== undefined && cores <= 2)
}

const FORCE_3D_KEY = 'island-portfolio-force-3d'

/** Lets a visitor on a "low-end" device opt into 3D anyway for this tab session. */
export function setForce3D(): void {
  try {
    sessionStorage.setItem(FORCE_3D_KEY, '1')
  } catch {
    /* storage unavailable (private mode): the flag just won't stick */
  }
}

export function isForce3D(): boolean {
  try {
    return sessionStorage.getItem(FORCE_3D_KEY) === '1'
  } catch {
    return false
  }
}

export type FallbackReason = 'no-webgl' | 'low-end'

/** Returns why 3D should be skipped, or null if 3D is fine. */
export function get3DFallbackReason(): FallbackReason | null {
  if (!hasWebGL()) return 'no-webgl'
  if (isLowEndDevice() && !isForce3D()) return 'low-end'
  return null
}
