import { useEffect, useRef, useState, type ComponentType, type MouseEvent as ReactMouseEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { portfolio } from '../../data/portfolio'
import type { SectionId } from '../../types/portfolio'
import { setForce3D, type FallbackReason } from '../../hooks/deviceSupport'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { islandInfo } from '../../hud/islandInfo'
import { ROUTES } from '../../routes'
import ComingSoonButton from '../../components/ComingSoonButton'
import MotionToggle from '../../components/MotionToggle'
import ViewSwitcher from '../../components/ViewSwitcher'
import { FEATURES } from '../../features'
import AboutContent from '../../components/sections/AboutContent'
import AchievementsContent from '../../components/sections/AchievementsContent'
import EducationContent from '../../components/sections/EducationContent'
import ExternalLink from '../../components/sections/ExternalLink'
import SkillsContent from '../../components/sections/SkillsContent'
import { LINK_ICONS } from '../../components/sections/linkIcons'
import SeasonDecor from './SeasonDecor'
import ThemeToggle from './ThemeToggle'
import { useActiveSection } from './useActiveSection'

const FALLBACK_MESSAGES: Record<FallbackReason, string> = {
  'no-webgl': "Your browser doesn't support WebGL, so you're seeing the 2D version of this portfolio.",
  'low-end': "We switched to the 2D version to keep things smooth on this device. You can still try 3D.",
}

// Same components the 3D details modal renders, so both views always show identical content.
const CONTENT: Record<SectionId, ComponentType> = {
  about: AboutContent,
  achievements: AchievementsContent,
  skills: SkillsContent,
  education: EducationContent,
}

const HOME_ID = 'home'
const MAIN_ID = 'main'
const MENU_ID = 'navbar-menu'
const FOOTER_ID = 'site-footer'

/**
 * The 2D portfolio: a regular scrolling site with no Three.js, for visitors who prefer it or whose
 * device can't run the 3D world. All content comes from portfolio.ts via the shared section components.
 */
export default function View2D() {
  const [params] = useSearchParams()
  const fallback = params.get('fallback') as FallbackReason | null
  const { personal, sections } = portfolio
  const reducedMotion = useReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const navbar = useRef<HTMLDivElement>(null)
  // "Back to 3D" is pointless without WebGL.
  const no3D = fallback === 'no-webgl'

  const navItems = [{ id: HOME_ID, label: 'Home' }, ...sections.map((s) => ({ id: s.id, label: s.shortLabel }))]
  const activeId = useActiveSection(
    navItems.map((item) => item.id),
    FOOTER_ID,
  )

  useEffect(() => {
    const previous = document.title
    document.title = `${personal.name} · Portfolio`
    return () => {
      document.title = previous
    }
  }, [personal.name])

  // Deep links like /2d#skills: the sections only exist after the first render, so jump here.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (id) document.getElementById(id)?.scrollIntoView()
  }, [])

  // The phone menu closes on Esc (handing focus back to its button) or a tap outside it.
  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setMenuOpen(false)
      menuButton.current?.focus()
    }
    const onPointerDown = (e: PointerEvent) => {
      if (!navbar.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [menuOpen])

  /** In-page link: scroll (smoothly unless motion is reduced) and move focus to the target. */
  const goTo = (e: ReactMouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id)
    if (!target) return
    e.preventDefault()
    setMenuOpen(false)
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
    // Focus follows so keyboard and screen-reader users continue reading from the section.
    target.focus({ preventScroll: true })
    // Keep the URL shareable; pass React Router's history state through untouched.
    window.history.replaceState(window.history.state, '', `#${id}`)
  }

  return (
    <div className="view-2d">
      <a className="skip-link" href={`#${MAIN_ID}`} onClick={(e) => goTo(e, MAIN_ID)}>
        Skip to content
      </a>
      <SeasonDecor />

      <header className="navbar">
        <div ref={navbar} className="navbar-inner">
          <a className="navbar-brand" href={`#${HOME_ID}`} onClick={(e) => goTo(e, HOME_ID)}>
            <span className="navbar-brand-mark" aria-hidden="true">
              {personal.name.charAt(0)}
            </span>
            {personal.name}
          </a>

          <button
            ref={menuButton}
            type="button"
            className="navbar-toggle"
            aria-expanded={menuOpen}
            aria-controls={MENU_ID}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="navbar-toggle-bars" aria-hidden="true" />
            Menu
          </button>

          <div id={MENU_ID} className={`navbar-menu ${menuOpen ? 'is-open' : ''}`}>
            <nav aria-label="Sections">
              <ul className="navbar-links">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <a
                      className="navbar-link"
                      href={`#${item.id}`}
                      aria-current={item.id === activeId ? 'true' : undefined}
                      onClick={(e) => goTo(e, item.id)}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="navbar-tools">
              <ThemeToggle />
              <MotionToggle className="theme-toggle motion-toggle" />
              <ViewSwitcher hide={no3D ? ['3d'] : undefined} />
            </div>
          </div>
        </div>
      </header>

      {fallback && FALLBACK_MESSAGES[fallback] && (
        <p className="fallback-banner" role="note">
          {FALLBACK_MESSAGES[fallback]}
        </p>
      )}

      <main id={MAIN_ID} className="view-2d-main" tabIndex={-1}>
        <section id={HOME_ID} className="hero" aria-labelledby="hero-title" tabIndex={-1}>
          {/* No photo set: fall back to the seasonal hero art (sun, snowman, pumpkin, heart). */}
          {!personal.avatar && <span className="hero-art" aria-hidden="true" />}
          <div className={`hero-inner ${personal.avatar ? 'has-photo' : ''}`}>
            {personal.avatar && (
              <img className="hero-photo" src={personal.avatar} alt={`Photo of ${personal.name}`} width={220} height={220} />
            )}
            <div className="hero-text">
              <p className="hero-eyebrow">Hi, I'm</p>
              <h1 id="hero-title" className="hero-title">
                {personal.name}
              </h1>
              <p className="hero-headline">{personal.headline}</p>
              <p className="hero-tagline">{personal.tagline}</p>
              <ul className="hero-actions">
                {personal.links.map((link, i) => (
                  <li key={link.url}>
                    <ExternalLink href={link.url} className={`btn ${i === 0 ? 'btn-coral' : ''}`}>
                      <span className="btn-icon" aria-hidden="true">
                        {LINK_ICONS[link.kind]}
                      </span>
                      {link.label}
                    </ExternalLink>
                  </li>
                ))}
                <li>
                  {FEATURES.textOnlyResume ? (
                    <Link to={ROUTES.resume} className="btn btn-sun">
                      <span className="btn-icon" aria-hidden="true">
                        📄
                      </span>
                      Résumé
                    </Link>
                  ) : (
                    <ComingSoonButton className="btn btn-sun" align="start">
                      <span className="btn-icon" aria-hidden="true">
                        📄
                      </span>
                      Résumé
                    </ComingSoonButton>
                  )}
                </li>
              </ul>
            </div>
          </div>
          <span className="hero-wave" aria-hidden="true" />
        </section>

        <div className="view-2d-sections">
          {sections.map((s) => {
            const Content = CONTENT[s.id]
            return (
              <section
                key={s.id}
                id={s.id}
                className="view-2d-section"
                aria-labelledby={`${s.id}-title`}
                tabIndex={-1}
              >
                <h2 id={`${s.id}-title`} className="view-2d-heading">
                  <span className="view-2d-heading-icon" aria-hidden="true">
                    {islandInfo(s.id).icon}
                  </span>
                  {s.title}
                </h2>
                <div className="view-2d-panel">
                  <Content />
                </div>
              </section>
            )
          })}
        </div>
      </main>

      <footer id={FOOTER_ID} className="view-2d-footer">
        <p>
          © {new Date().getFullYear()} {personal.name}
        </p>
        {FEATURES.textOnlyResume ? (
          <p>
            Prefer plain text? Read the <Link to={ROUTES.resume}>text-only résumé</Link>
            {!no3D && (
              <>
                , or{' '}
                <Link to={ROUTES.world} onClick={setForce3D}>
                  sail the 3D islands
                </Link>
              </>
            )}
            .
          </p>
        ) : (
          !no3D && (
            <p>
              Want the full experience?{' '}
              <Link to={ROUTES.world} onClick={setForce3D}>
                Sail the 3D islands
              </Link>
              .
            </p>
          )
        )}
      </footer>
    </div>
  )
}
