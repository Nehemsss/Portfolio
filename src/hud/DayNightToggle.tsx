import { useAppStore, useTimeOfDay } from '../store/useAppStore'

/**
 * Day/night controls: one button flips between day and night (leaving Auto), the other follows
 * the visitor's local clock (night 7pm–6am). The choice is remembered between visits.
 */
export default function DayNightToggle() {
  const timeOfDay = useTimeOfDay()
  const timePreference = useAppStore((s) => s.timePreference)
  const toggleTimeOfDay = useAppStore((s) => s.toggleTimeOfDay)
  const setTimePreference = useAppStore((s) => s.setTimePreference)
  const isNight = timeOfDay === 'night'
  const isAuto = timePreference === 'auto'

  return (
    <div className="daynight" role="group" aria-label="Time of day">
      <button
        type="button"
        className={`btn ${isNight ? 'btn-night' : 'btn-sun'}`}
        onClick={toggleTimeOfDay}
        aria-label={isNight ? 'Night. Switch to day' : 'Day. Switch to night'}
      >
        <span className="btn-icon" aria-hidden="true">
          {isNight ? '🌙' : '☀️'}
        </span>
        <span className="btn-label">{isNight ? 'Night' : 'Day'}</span>
      </button>
      <button
        type="button"
        className={`btn btn-small daynight-auto ${isAuto ? 'is-on' : ''}`}
        onClick={() => setTimePreference(isAuto ? timeOfDay : 'auto')}
        aria-pressed={isAuto}
        title="Follow your local time (night from 7pm to 6am)"
      >
        <span className="btn-icon" aria-hidden="true">
          🕒
        </span>
        <span className="btn-label">Auto</span>
      </button>
    </div>
  )
}
