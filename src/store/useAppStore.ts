import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { IslandId } from '../types/portfolio'
import type { SeasonId } from '../types/theme'
import { getSeasonForDate, isSeasonId } from '../themes'

export type TimeOfDay = 'day' | 'night'
export type TimePreference = TimeOfDay | 'auto'
export type SeasonPreference = SeasonId | 'auto'
export type ViewMode = '3d' | '2d' | 'text'
/** 'system' follows the OS prefers-reduced-motion setting. */
export type MotionPreference = 'system' | 'reduced' | 'full'

interface AppState {
  // Visitor preferences (saved to localStorage)
  timePreference: TimePreference
  seasonPreference: SeasonPreference
  motionPreference: MotionPreference

  // Session state
  /** Day/night according to the local clock; refreshed every minute so "Auto" mode follows it. */
  clockTimeOfDay: TimeOfDay
  viewMode: ViewMode
  /** Island whose details modal is open, or null while sailing. While set, the boat is frozen. */
  activeSection: IslandId | null
  /** Dock the boat is currently inside the trigger zone of. */
  nearbyDock: IslandId | null

  setTimePreference: (pref: TimePreference) => void
  toggleTimeOfDay: () => void
  refreshClock: () => void
  setSeasonPreference: (pref: SeasonPreference) => void
  setMotionPreference: (pref: MotionPreference) => void
  setViewMode: (mode: ViewMode) => void
  openSection: (id: IslandId) => void
  closeSection: () => void
  setNearbyDock: (id: IslandId | null) => void
}

/** Night between 7pm and 6am local time. */
export function getTimeOfDayForDate(date = new Date()): TimeOfDay {
  const hour = date.getHours()
  return hour >= 19 || hour < 6 ? 'night' : 'day'
}

export const resolveTimeOfDay = (pref: TimePreference, clock: TimeOfDay = getTimeOfDayForDate()): TimeOfDay =>
  pref === 'auto' ? clock : pref

// Unknown values (e.g. a season saved by an older version) fall back to Summer.
export const resolveSeason = (pref: SeasonPreference): SeasonId =>
  pref === 'auto' ? getSeasonForDate() : isSeasonId(pref) ? pref : 'summer'

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      timePreference: 'day',
      seasonPreference: 'summer',
      motionPreference: 'system',

      clockTimeOfDay: getTimeOfDayForDate(),
      viewMode: '3d',
      activeSection: null,
      nearbyDock: null,

      setTimePreference: (timePreference) => set({ timePreference }),
      // The HUD sun/moon button flips whatever is currently showing and leaves Auto mode.
      toggleTimeOfDay: () => {
        const { timePreference, clockTimeOfDay } = get()
        set({ timePreference: resolveTimeOfDay(timePreference, clockTimeOfDay) === 'day' ? 'night' : 'day' })
      },
      refreshClock: () => {
        const clockTimeOfDay = getTimeOfDayForDate()
        if (clockTimeOfDay !== get().clockTimeOfDay) set({ clockTimeOfDay })
      },
      setSeasonPreference: (seasonPreference) => set({ seasonPreference }),
      setMotionPreference: (motionPreference) => set({ motionPreference }),
      setViewMode: (viewMode) => set({ viewMode }),
      openSection: (activeSection) => set({ activeSection }),
      closeSection: () => set({ activeSection: null }),
      setNearbyDock: (nearbyDock) => set({ nearbyDock }),
    }),
    {
      name: 'island-portfolio-prefs',
      storage: createJSONStorage(() => localStorage),
      // Only persist preferences, never session state like the open panel.
      partialize: (s) => ({
        timePreference: s.timePreference,
        seasonPreference: s.seasonPreference,
        motionPreference: s.motionPreference,
      }),
    },
  ),
)

/** Resolved values (Auto modes applied). Use these in components instead of the raw preferences. */
export const useTimeOfDay = () =>
  resolveTimeOfDay(
    useAppStore((s) => s.timePreference),
    useAppStore((s) => s.clockTimeOfDay),
  )
export const useSeason = () => resolveSeason(useAppStore((s) => s.seasonPreference))
