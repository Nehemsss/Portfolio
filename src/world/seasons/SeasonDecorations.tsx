import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { useSeason } from '../../store/useAppStore'
import { seasonIds, themes } from '../../themes'
import type { SeasonId } from '../../types/theme'

/**
 * Lazy components for every season that has decorations. Each season's props and particles live in
 * their own chunk, downloaded only the first time that season is picked.
 */
const DECORATIONS: Partial<Record<SeasonId, LazyExoticComponent<ComponentType>>> = Object.fromEntries(
  seasonIds.flatMap((id) => {
    const load = themes[id].decorations
    return load ? [[id, lazy(load)]] : []
  }),
)

/** Renders the current season's decorations (nothing for Summer). */
export default function SeasonDecorations() {
  const Decor = DECORATIONS[useSeason()]
  if (!Decor) return null
  return (
    // Fallback null: the world stays as-is for the split second the chunk takes to arrive.
    <Suspense fallback={null}>
      <Decor />
    </Suspense>
  )
}
