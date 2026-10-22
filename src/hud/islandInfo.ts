import { portfolio } from '../data/portfolio'
import type { IslandId } from '../types/portfolio'

const ICONS: Record<IslandId, string> = {
  home: '🏝️',
  about: '🏡',
  achievements: '🏆',
  skills: '🛠️',
  education: '🎓',
}

/** Display title + icon for each dockable island (section titles come from portfolio.ts). */
export function islandInfo(id: IslandId) {
  const title = id === 'home' ? 'Home Island' : (portfolio.sections.find((s) => s.id === id)?.title ?? id)
  return { title, icon: ICONS[id] }
}
