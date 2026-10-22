import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { FEATURES } from './features'
import { get3DFallbackReason } from './hooks/deviceSupport'
import { useReducedMotion } from './hooks/useReducedMotion'
import { ROUTES } from './routes'
import { useAppStore, useSeason, useTimeOfDay, type ViewMode } from './store/useAppStore'
import { themes } from './themes'
import LoadingScreen from './components/LoadingScreen'
import View2D from './views/View2D/View2D'
import Resume from './views/Resume/Resume'
import ErrorPage from './views/ErrorPage/ErrorPage'

// The 3D world (Three.js, Rapier WASM) is split into its own chunk so /2d and /resume never download it.
const WorldPage = lazy(() => import('./world/WorldPage'))

const viewModeForPath = (path: string): ViewMode =>
  path.startsWith(ROUTES.resume) ? 'text' : path.startsWith(ROUTES.twoD) ? '2d' : '3d'

/** Keeps the store's viewMode and the <html> theme attributes in sync with the route and settings. */
function AppSync() {
  const { pathname } = useLocation()
  const setViewMode = useAppStore((s) => s.setViewMode)
  const timeOfDay = useTimeOfDay()
  const season = useSeason()

  useEffect(() => setViewMode(viewModeForPath(pathname)), [pathname, setViewMode])

  // Re-check the local clock every minute so "Auto" day/night flips at 7pm / 6am.
  const refreshClock = useAppStore((s) => s.refreshClock)
  useEffect(() => {
    const id = window.setInterval(refreshClock, 60_000)
    return () => window.clearInterval(id)
  }, [refreshClock])

  // CSS animations key off <html data-motion> (not the media query alone), so the visitor's
  // Motion setting can override the OS preference either way.
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full'
  }, [reducedMotion])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = timeOfDay === 'night' ? 'dark' : 'light'
    root.dataset.season = season
    root.style.setProperty('--accent', themes[season].ui.accent)
    root.style.setProperty('--accent-contrast', themes[season].ui.accentContrast)
  }, [timeOfDay, season])

  return null
}

/** Sends visitors without WebGL (or on very low-end devices) to the 2D view. */
function WorldGate() {
  // Checked once per mount; creating a test WebGL context on every render would be wasteful.
  const [fallback] = useState(get3DFallbackReason)
  if (fallback) return <Navigate to={`${ROUTES.twoD}?fallback=${fallback}`} replace />
  return (
    <Suspense fallback={<LoadingScreen />}>
      <WorldPage />
    </Suspense>
  )
}

export default function App() {
  return (
    <>
      <AppSync />
      <Routes>
        <Route path={ROUTES.world} element={<WorldGate />} />
        <Route path={ROUTES.twoD} element={<View2D />} />
        <Route
          path={ROUTES.resume}
          element={
            FEATURES.textOnlyResume ? (
              <Resume />
            ) : (
              <ErrorPage
                code="Coming soon"
                title="This page isn't open yet"
                message="The text-only résumé is still being written. In the meantime, sail the 3D islands or browse the 2D view."
              />
            )
          }
        />
        <Route
          path="*"
          element={
            <ErrorPage
              code="404 · Page not found"
              title="Lost at sea!"
              message="There's no island at this address. It may have moved, or the link has a typo. Let's get you back on course."
              icon="🧭"
            />
          }
        />
      </Routes>
    </>
  )
}
