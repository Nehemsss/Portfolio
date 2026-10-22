import { useEffect, useRef, type ComponentType } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { IslandId } from '../types/portfolio'
import AboutContent from '../components/sections/AboutContent'
import AchievementsContent from '../components/sections/AchievementsContent'
import EducationContent from '../components/sections/EducationContent'
import HomeContent from '../components/sections/HomeContent'
import SkillsContent from '../components/sections/SkillsContent'
import { islandInfo } from './islandInfo'

const CONTENT: Record<IslandId, ComponentType> = {
  home: HomeContent,
  about: AboutContent,
  achievements: AchievementsContent,
  skills: SkillsContent,
  education: EducationContent,
}

const TITLE_ID = 'section-modal-title'

/**
 * Island details modal, opened by docking. Built on the native <dialog> element with showModal():
 * the browser makes the rest of the page inert (no clicks/scroll reach the 3D canvas), traps Tab
 * inside, closes on Esc, and restores focus to where it was when the dialog closes.
 * While it is open the store's activeSection is set, which freezes the boat.
 */
export default function SectionModal() {
  const activeSection = useAppStore((s) => s.activeSection)
  const closeSection = useAppStore((s) => s.closeSection)
  const dialog = useRef<HTMLDialogElement>(null)

  // Keep the native dialog's open state in sync with the store.
  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (activeSection && !d.open) d.showModal()
    if (!activeSection && d.open) d.close()
  }, [activeSection])

  const info = activeSection ? islandInfo(activeSection) : null
  const Content = activeSection ? CONTENT[activeSection] : null

  return (
    <dialog
      ref={dialog}
      className="section-modal"
      aria-labelledby={TITLE_ID}
      // Fires for Esc, our close button and backdrop clicks alike, so the store always follows.
      // (Only our own close event: a nested dialog such as the screenshot viewer must not close the panel.)
      onClose={(e) => {
        if (e.target === dialog.current) closeSection()
      }}
      // The inner wrapper fills the dialog, so a click whose target is the dialog itself
      // can only have landed on the ::backdrop outside the panel.
      onClick={(e) => {
        if (e.target === dialog.current) dialog.current.close()
      }}
    >
      {info && Content && (
        <div className="section-modal-inner">
          <header className="section-modal-header">
            <span className="section-modal-icon" aria-hidden="true">
              {info.icon}
            </span>
            <h2 id={TITLE_ID} className="section-modal-title">
              {info.title}
            </h2>
            <button
              type="button"
              className="section-modal-close"
              aria-label="Close and keep sailing"
              onClick={() => dialog.current?.close()}
              autoFocus
            >
              ✕
            </button>
          </header>
          <div className="section-modal-body">
            <Content />
          </div>
          <footer className="section-modal-footer">
            <button type="button" className="btn btn-sea" onClick={() => dialog.current?.close()}>
              <span className="btn-icon" aria-hidden="true">
                ⛵
              </span>
              Keep sailing
            </button>
            <span className="section-modal-hint">
              or press <kbd>Esc</kbd>
            </span>
          </footer>
        </div>
      )}
    </dialog>
  )
}
