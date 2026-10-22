import { Link } from 'react-router'
import { useAppStore, type ViewMode } from '../store/useAppStore'
import { setForce3D } from '../hooks/deviceSupport'
import { FEATURES } from '../features'
import { ROUTES } from '../routes'
import ComingSoonButton from './ComingSoonButton'

const VIEWS: { mode: ViewMode; to: string; label: string; icon: string; variant: string }[] = [
  { mode: '3d', to: ROUTES.world, label: 'Back to 3D', icon: '🏝️', variant: 'btn-coral' },
  { mode: '2d', to: ROUTES.twoD, label: 'Skip to 2D View', icon: '🗺️', variant: 'btn-sea' },
  { mode: 'text', to: ROUTES.resume, label: 'Text Only', icon: '📄', variant: 'btn-sun' },
]

interface Props {
  className?: string
  /** Views to leave out, e.g. 3D when the browser has no WebGL. */
  hide?: ViewMode[]
  /** Show exactly these views instead of "every view except the current one" (used by error pages). */
  only?: ViewMode[]
}

/** Links to the other two views. Shown in the 3D HUD, in the 2D navbar and on error pages. */
export default function ViewSwitcher({ className, hide, only }: Props) {
  const viewMode = useAppStore((s) => s.viewMode)
  const shown = only
    ? VIEWS.filter((v) => only.includes(v.mode))
    : VIEWS.filter((v) => v.mode !== viewMode && !hide?.includes(v.mode))

  return (
    <nav className={`view-switcher ${className ?? ''}`} aria-label="Switch view">
      {shown.map((v) => {
        const content = (
          <>
            <span className="btn-icon" aria-hidden="true">
              {v.icon}
            </span>
            {/* Visually hidden on narrow HUDs (icon-only), but still the accessible name. */}
            <span className="btn-label">{v.label}</span>
          </>
        )
        // Not released yet: a locked button that says "coming soon" instead of a link.
        if (v.mode === 'text' && !FEATURES.textOnlyResume) {
          return (
            <ComingSoonButton key={v.mode} className={`btn ${v.variant}`} align="end">
              {content}
            </ComingSoonButton>
          )
        }
        return (
          <Link
            key={v.mode}
            to={v.to}
            className={`btn ${v.variant}`}
            // Choosing 3D explicitly overrides the low-end device fallback for this session.
            onClick={v.mode === '3d' ? setForce3D : undefined}
          >
            {content}
          </Link>
        )
      })}
    </nav>
  )
}
