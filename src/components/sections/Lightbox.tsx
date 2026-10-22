import { useEffect, useRef, useState, type KeyboardEvent, type SyntheticEvent } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const CLOSE_MS = 200

interface Props {
  title: string
  images: string[]
  /** Which image is showing, or null when closed. */
  index: number | null
  onNavigate: (index: number) => void
  onClose: () => void
}

/**
 * Full-screen screenshot viewer on the native <dialog> (showModal): Esc closes, Tab stays inside,
 * and focus returns to the thumbnail afterwards. ← / → and the arrow buttons flip through the
 * images. Opens with a zoom-in, crossfades between images, and fades out before closing (all
 * skipped when motion is reduced). Works on top of the 3D details panel too (dialogs stack).
 */
export default function Lightbox({ title, images, index, onNavigate, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [closing, setClosing] = useState(false)
  const closeTimer = useRef<number | undefined>(undefined)
  const reducedMotion = useReducedMotion()
  const count = images.length

  useEffect(() => {
    const d = dialog.current
    if (index !== null && d && !d.open) d.showModal()
  }, [index])

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  /** Play the fade-out, then actually close (which fires onClose via the dialog's close event). */
  const requestClose = () => {
    if (reducedMotion) {
      dialog.current?.close()
      return
    }
    setClosing(true)
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => {
      setClosing(false)
      dialog.current?.close()
    }, CLOSE_MS)
  }

  const step = (delta: number) => {
    if (index !== null) onNavigate((index + delta + count) % count)
  }

  // React re-dispatches dialog events up the component tree; stop them here so the 3D details
  // panel (itself a dialog) doesn't think *it* was closed.
  const stop = (e: SyntheticEvent) => e.stopPropagation()

  const onKeyDown = (e: KeyboardEvent) => {
    // Keep keys away from the 3D controls listening on window (arrows steer, [ ] rotate).
    e.stopPropagation()
    if (e.key === 'ArrowRight') step(1)
    if (e.key === 'ArrowLeft') step(-1)
  }

  return (
    <dialog
      ref={dialog}
      className={`lightbox ${closing ? 'is-closing' : ''}`}
      aria-label={`${title} screenshots`}
      onCancel={(e) => {
        stop(e)
        e.preventDefault() // Esc: animate out instead of vanishing
        requestClose()
      }}
      onClose={(e) => {
        stop(e)
        onClose()
      }}
      // A click on the dialog itself (not the image or buttons) is a click on the dark backdrop.
      onClick={(e) => {
        stop(e)
        if (e.target === dialog.current) requestClose()
      }}
      onKeyDown={onKeyDown}
    >
      {index !== null && (
        <>
          <figure className="lightbox-figure">
            {/* key: a new element per image, so each one plays the crossfade-in */}
            <img key={index} className="lightbox-img" src={images[index]} alt={`${title} screenshot ${index + 1}`} />
            <figcaption className="lightbox-caption">
              {title}
              {count > 1 && ` · ${index + 1} / ${count}`}
            </figcaption>
          </figure>
          <button type="button" className="lightbox-close" aria-label="Close viewer" onClick={requestClose} autoFocus>
            ✕
          </button>
          {count > 1 && (
            <>
              <button type="button" className="lightbox-nav lightbox-prev" aria-label="Previous screenshot" onClick={() => step(-1)}>
                ‹
              </button>
              <button type="button" className="lightbox-nav lightbox-next" aria-label="Next screenshot" onClick={() => step(1)}>
                ›
              </button>
            </>
          )}
        </>
      )}
    </dialog>
  )
}
