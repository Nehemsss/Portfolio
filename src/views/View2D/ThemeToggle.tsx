import { useAppStore, useTimeOfDay } from '../../store/useAppStore'

/**
 * Light/dark mode switch for the 2D navbar. It flips the same day/night preference the 3D HUD
 * uses (day = light, night = dark), so the choice carries over between views.
 */
export default function ThemeToggle() {
  const isDark = useTimeOfDay() === 'night'
  const toggleTimeOfDay = useAppStore((s) => s.toggleTimeOfDay)

  return (
    <button type="button" className="theme-toggle" onClick={toggleTimeOfDay}>
      <span className="theme-toggle-icon" aria-hidden="true">
        {isDark ? '☀️' : '🌙'}
      </span>
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  )
}
