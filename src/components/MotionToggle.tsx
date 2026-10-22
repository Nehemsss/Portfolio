import { useAppStore, type MotionPreference } from '../store/useAppStore'

const OPTIONS: Record<MotionPreference, { icon: string; label: string }> = {
  system: { icon: '🖥️', label: 'Auto' },
  reduced: { icon: '🐢', label: 'Reduced' },
  full: { icon: '✨', label: 'Full' },
}

const NEXT: Record<MotionPreference, MotionPreference> = { system: 'reduced', reduced: 'full', full: 'system' }

interface Props {
  className?: string
}

/**
 * Animation level, cycling Auto → Reduced → Full. "Auto" follows the device's reduced-motion
 * setting. Reduced hides wildlife, drifting decorations and smooth scrolling (see useReducedMotion)
 * and stops CSS animations (via <html data-motion>, set in App).
 */
export default function MotionToggle({ className = 'btn btn-small' }: Props) {
  const preference = useAppStore((s) => s.motionPreference)
  const setMotionPreference = useAppStore((s) => s.setMotionPreference)
  const current = OPTIONS[preference]
  const next = OPTIONS[NEXT[preference]]

  return (
    <button
      type="button"
      className={className}
      onClick={() => setMotionPreference(NEXT[preference])}
      // Starts with the visible text, so voice-control users can say what they see.
      aria-label={`Motion: ${current.label}. Switch to ${next.label}`}
      title="Animation level. Auto follows your device's reduced-motion setting."
    >
      <span className="btn-icon" aria-hidden="true">
        {current.icon}
      </span>
      <span className="btn-label">Motion: {current.label}</span>
    </button>
  )
}
