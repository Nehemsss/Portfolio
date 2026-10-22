import { useSyncExternalStore } from 'react'
import { useAppStore } from '../store/useAppStore'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

const getSnapshot = () => window.matchMedia(QUERY).matches

/** True when heavy motion should be skipped: the visitor's explicit setting wins, else the OS setting. */
export function useReducedMotion(): boolean {
  const preference = useAppStore((s) => s.motionPreference)
  const systemPrefersReduced = useSyncExternalStore(subscribe, getSnapshot, () => false)
  if (preference === 'reduced') return true
  if (preference === 'full') return false
  return systemPrefersReduced
}
