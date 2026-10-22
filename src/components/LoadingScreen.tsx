import { useCoarsePointer } from '../hooks/useCoarsePointer'

type Control = { keys: string[]; label: string }

const KEY_CONTROLS: Control[] = [
  { keys: ['W', 'A', 'S', 'D'], label: 'Sail' },
  { keys: ['E'], label: 'Dock at an island' },
  { keys: ['Esc'], label: 'Close & keep sailing' },
  { keys: ['[', ']'], label: 'Rotate view (or right-drag)' },
  { keys: ['+', '-'], label: 'Zoom (or scroll)' },
  { keys: ['Map'], label: 'Quick travel' },
]

const TOUCH_CONTROLS: Control[] = [
  { keys: ['Joystick'], label: 'Sail' },
  { keys: ['Dock'], label: 'Tap to dock at an island' },
  { keys: ['Pinch'], label: 'Zoom' },
  { keys: ['2-finger drag'], label: 'Rotate view' },
  { keys: ['Map'], label: 'Quick travel' },
]

interface Props {
  /** 0–100, driven by the world's loading stages (see world/loadStages.ts). */
  progress?: number
  /** What is loading right now. */
  label?: string
}

/**
 * Summer-themed loading screen: sun, drifting clouds, a little boat bobbing on looping waves.
 * All decoration is CSS/SVG (no images) and stops animating under prefers-reduced-motion.
 * Also shown (at 0%) by App's Suspense while the 3D chunk itself downloads.
 */
export default function LoadingScreen({ progress = 0, label = 'Downloading the 3D world' }: Props) {
  const controls = useCoarsePointer() ? TOUCH_CONTROLS : KEY_CONTROLS
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="ls-sky" aria-hidden="true">
        <div className="ls-cloud ls-cloud-1" />
        <div className="ls-cloud ls-cloud-2" />
        <div className="ls-cloud ls-cloud-3" />
        <svg className="ls-gull ls-gull-1" viewBox="0 0 40 16">
          <path d="M2 12 Q 10 2 20 10 Q 30 2 38 12" />
        </svg>
        <svg className="ls-gull ls-gull-2" viewBox="0 0 40 16">
          <path d="M2 12 Q 10 2 20 10 Q 30 2 38 12" />
        </svg>
      </div>

      <div className="ls-content">
        <h1 className="ls-title">Setting sail…</h1>
        <p className="ls-subtitle">{label}…</p>
        <div
          className="ls-bar"
          role="progressbar"
          aria-label="Loading the 3D world"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-valuetext={`${progress}%: ${label}`}
        >
          <div className="ls-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="ls-controls">
          <h2 className="ls-controls-title">How to sail</h2>
          <ul className="ls-controls-list">
            {controls.map(({ keys, label }) => (
              <li key={label}>
                <span className="ls-controls-keys">
                  {keys.map((k) => (
                    <kbd key={k}>{k}</kbd>
                  ))}
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="ls-sea" aria-hidden="true">
        <svg className="ls-island" viewBox="0 0 200 130">
          {/* White-sand island: a rounded mound with a shaded underside, so it sits in the waves */}
          <path className="ls-sand-shade" d="M8 122 Q 34 86 100 82 Q 166 86 192 122 Z" />
          <path className="ls-sand" d="M14 118 Q 40 84 100 80 Q 160 84 186 118 Q 100 108 14 118 Z" />
          <ellipse className="ls-sand-highlight" cx="86" cy="90" rx="34" ry="5" />
          {/* Palm: curved trunk rooted in the sand, fronds fanning out from the crown */}
          <path className="ls-trunk" d="M98 88 Q 88 58 104 26" />
          <path className="ls-frond" d="M104 26 Q 76 12 54 32 Q 78 22 104 26 Z" />
          <path className="ls-frond" d="M104 26 Q 130 8 154 28 Q 128 20 104 26 Z" />
          <path className="ls-frond" d="M104 26 Q 92 2 70 4 Q 92 12 104 26 Z" />
          <path className="ls-frond" d="M104 26 Q 124 0 146 8 Q 122 10 104 26 Z" />
          <circle className="ls-coconut" cx="101" cy="30" r="3.2" />
          <circle className="ls-coconut" cx="107" cy="31" r="3" />
        </svg>
        <svg className="ls-boat" viewBox="0 0 120 80">
          <rect className="ls-boat-flag" x="58" y="6" width="22" height="12" rx="2" />
          <rect className="ls-boat-mast" x="56" y="6" width="3" height="34" />
          <rect className="ls-boat-cabin" x="36" y="30" width="40" height="20" rx="5" />
          <rect className="ls-boat-window" x="44" y="35" width="10" height="8" rx="2" />
          <rect className="ls-boat-window" x="58" y="35" width="10" height="8" rx="2" />
          <path className="ls-boat-hull" d="M8 50 H 112 L 96 72 H 24 Z" />
          <rect className="ls-boat-trim" x="8" y="48" width="104" height="6" rx="3" />
        </svg>
        <svg className="ls-wave ls-wave-back" viewBox="0 0 400 100" preserveAspectRatio="none">
          <path d="M0 40 Q 50 20 100 40 T 200 40 T 300 40 T 400 40 V 100 H 0 Z" />
        </svg>
        <svg className="ls-wave ls-wave-front" viewBox="0 0 400 100" preserveAspectRatio="none">
          <path d="M0 50 Q 50 30 100 50 T 200 50 T 300 50 T 400 50 V 100 H 0 Z" />
        </svg>
      </div>
    </div>
  )
}
