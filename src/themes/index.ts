import type { SeasonId, ThemeConfig } from '../types/theme'
import { halloween } from './halloween'
import { summer } from './summer'
import { valentines } from './valentines'
import { winter } from './winter'

/** Registry of all seasons. Order here is the order shown in the season picker. */
export const themes: Record<SeasonId, ThemeConfig> = { summer, winter, halloween, valentines }

export const seasonIds = Object.keys(themes) as SeasonId[]

export const isSeasonId = (value: unknown): value is SeasonId => typeof value === 'string' && value in themes

/** Picks a season from the calendar for the "Auto" season mode. */
export function getSeasonForDate(date = new Date()): SeasonId {
  const month = date.getMonth() + 1 // 1–12
  const day = date.getDate()
  if (month === 2 && day <= 15) return 'valentines'
  if (month === 10) return 'halloween'
  if (month === 12 || month === 1) return 'winter'
  return 'summer'
}
