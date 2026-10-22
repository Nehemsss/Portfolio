import { useEffect, useRef, useState } from 'react'
import { useCoarsePointer } from '../hooks/useCoarsePointer'
import { useAppStore } from '../store/useAppStore'
import { islandInfo } from './islandInfo'

/** Minimum gap between screen-reader announcements, so skirting a zone's edge doesn't spam. */
const ANNOUNCE_THROTTLE_MS = 1500
const NBSP = String.fromCharCode(0xa0)

/**
 * "Press E to dock" prompt, shown while the boat is inside a dock's trigger zone and no modal
 * is open. The button works for mouse and touch; the E key works from anywhere on the page.
 * A separate, always-present live region tells screen-reader users which dock they're near.
 */
export default function DockPrompt() {
  const nearbyDock = useAppStore((s) => s.nearbyDock)
  const activeSection = useAppStore((s) => s.activeSection)
  const openSection = useAppStore((s) => s.openSection)
  // Touch devices have no E key, so the button just says what tapping it does.
  const isTouch = useCoarsePointer()
  const visible = nearbyDock !== null && activeSection === null
  const [announcement, setAnnouncement] = useState('')
  const lastAnnounced = useRef(0)

  useEffect(() => {
    if (!visible || !nearbyDock) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' || e.repeat) return
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      e.preventDefault()
      openSection(nearbyDock)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [visible, nearbyDock, openSection])

  // Announce arrivals, throttled. If the dock changes again within the window, only the latest is read.
  useEffect(() => {
    if (!visible || !nearbyDock) return
    const text = `Near ${islandInfo(nearbyDock).title} dock. ${isTouch ? 'Tap the Dock button' : 'Press E'} to dock.`
    const wait = Math.max(0, lastAnnounced.current + ANNOUNCE_THROTTLE_MS - Date.now())
    const timer = window.setTimeout(() => {
      lastAnnounced.current = Date.now()
      // Live regions only speak when the text changes; a trailing no-break space makes a repeat count.
      setAnnouncement((prev) => (prev === text ? text + NBSP : text))
    }, wait)
    return () => window.clearTimeout(timer)
  }, [visible, nearbyDock, isTouch])

  const info = visible && nearbyDock ? islandInfo(nearbyDock) : null

  return (
    <>
      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>
      {info && nearbyDock && (
        <div className="dock-prompt">
          <span className="dock-prompt-text">
            <span aria-hidden="true">{info.icon}</span> {info.title}
          </span>
          <button type="button" className="btn btn-sun" onClick={() => openSection(nearbyDock)}>
            {isTouch ? (
              'Click to dock'
            ) : (
              <>
                <kbd aria-hidden="true">E</kbd>
                Dock
              </>
            )}
          </button>
        </div>
      )}
    </>
  )
}
