# Island Portfolio: Claude Code prompts for the remaining phases

Phases 1–7 are done (setup, 3D world, docks + details modal, day/night, seasons, 2D view + résumé,
minimap + touch controls + staged loading + responsive HUD).
Each section below is a **self-contained prompt** for one phase. Start a Claude Code session in
`C:\React App\Portfolio`, paste **Shared context** first, then the prompt for the phase you want.
Run them in order (6 → 7 → 8), one phase per session, and review the result before moving on.

---

## Shared context (paste this before any phase prompt)

```text
You're continuing my 3D island-hopping portfolio (React 19 + Vite 8 + TypeScript, React Three Fiber 9,
drei 10, @react-three/rapier 2, @react-three/postprocessing 3, Zustand 5, React Router 8). Read the code
before changing it; match the existing style, naming and comment density.

Key facts about the codebase:
- ALL content comes from src/data/portfolio.ts (typed in src/types/portfolio.ts). Never hard-code content.
- Section content components already exist and are shared: src/components/sections/
  (HomeContent, AboutContent, AchievementsContent, SkillsContent, EducationContent, ExternalLink).
  The 3D details modal (src/hud/SectionModal.tsx) renders them; reuse them rather than duplicating markup.
- Routes: "/" = 3D world (lazy chunk src/world/WorldPage.tsx), "/2d" = src/views/View2D/View2D.tsx
  (done in Phase 6), "/resume" = src/views/Resume/Resume.tsx (done in Phase 6). Route constants in src/routes.ts.
  src/hooks/deviceSupport.ts sends no-WebGL / low-end devices to /2d?fallback=<reason>.
- Global state: src/store/useAppStore.ts. Use useTimeOfDay() and useSeason() (they apply Auto modes).
  activeSection / nearbyDock / openSection drive docking; motionPreference exists but has no UI yet.
- App.tsx (AppSync) sets <html data-theme="light|dark">, data-season and CSS vars --accent/--accent-contrast
  from the current season (src/themes/*.ts, registry in src/themes/index.ts).
- Styling is plain CSS in src/styles/global.css with tokens (--sun, --sea, --coral, --sand, --ink, chunky
  .btn variants: btn-sun/btn-sea/btn-coral/btn-night). Fredoka (bundled via @fontsource) is --font-display.
- 3D world: src/world/. layout.ts (ISLANDS, ISLETS, BOAT_START, WORLD_RADIUS, GROUND_Y), islands/dockLayout.ts
  (dock positions + toWorld helper), boat/boatState.ts (mutable boatInput {throttle, steer} and boatState
  {position, yaw, speed}; the joystick and keyboard both write boatInput), boat/Boat.tsx (Rapier body named
  "boat", velocity-based arcade steering, frozen while a modal is open), boat/CameraRig.tsx (fixed-elevation
  bird's-eye camera, wheel/+/- zoom, right-drag horizontal rotate), environment/dayNight.ts (envState.night
  0..1 and season palettes), seasons/ (lazy per-season decorations).

Lint rules that bite (eslint react-hooks + react-refresh):
- useMemo must get an inline arrow: useMemo(() => fn(), []), not useMemo(fn, []).
- Don't mutate objects returned from hooks/useMemo inside useFrame or effects. Mutate via refs
  (ref.current.material...) or keep per-frame-mutated materials/vectors at module level.
- Component files should only export components (put shared constants in plain .ts files).

Working rules:
- Do this ONE phase only. Propose a short plan first if anything is ambiguous, then build.
- When done, run: npm run lint, npm run typecheck, npm run build. All must pass.
- Do NOT launch headless browser tests unless I ask; I test manually on my own dev server (port 5173).
  If you ever need a dev server, use port 5174 and stop it when finished.
- Finish with a short summary of what changed, which files, and anything I should check by hand.
```

---

## Phase 6: 2D view and text-only résumé

```text
Phase 6: build the real 2D site (/2d) and the printable résumé (/resume), replacing the stubs.

2D view (src/views/View2D/):
- A clean, responsive, standard portfolio site with NO WebGL/Three.js imports (keep the 3D chunk out of
  this route).
- Sticky navbar: name/brand, links to the sections (Home/hero, About, Achievements, Skills & Projects,
  Education) with smooth scrolling and an active-section highlight as you scroll (IntersectionObserver).
  Collapses to a menu button on phones.
- Hero: name, headline, tagline from portfolio.ts, plus primary contact links.
- Sections reuse the existing shared components in src/components/sections/ (AboutContent, etc.) so the
  2D view and the 3D modal always show identical content. Wrap them in 2D-appropriate section layouts.
- Keep ViewSwitcher in the navbar ("Back to 3D" / "Text Only"). Keep the existing fallback banner logic
  (no-webgl hides "Back to 3D"; low-end shows the banner but allows 3D).
- Follows the theme: light/dark from day/night (data-theme), accent colour from the season (--accent), and
  small CSS-only seasonal touches keyed off <html data-season> (e.g. a few drifting snowflakes in winter,
  hearts for valentines, a pumpkin/bat accent for halloween, sunny wave divider for summer). Decorations must
  be aria-hidden and respect prefers-reduced-motion.
- A small day/night + season control in the navbar (reuse the store actions; it can be simpler than the
  3D HUD versions).
- Semantic HTML: one h1, landmark elements, labelled nav, visible focus styles, sufficient contrast in both
  light and dark.

Text-only résumé (src/views/Resume/):
- Plain, single-column, semantic HTML, black text on white, no images, no animations, no theme colours.
- Sections in this order: Personal Information (name, headline, location, email, phone if present, links
  written out as full URLs), Educational Background, Skills (grouped), Projects (title, description, tech,
  links as text), Achievements & Certifications (title, issuer, date, credential URL).
- ATS- and screen-reader-friendly: real headings (h1 name, h2 sections), lists, no tables for layout,
  no icons/emoji in content.
- "Print / Save as PDF" button calling window.print(), plus print CSS: hide the toolbar/buttons, A4/Letter
  friendly margins, avoid breaking an entry across pages (break-inside: avoid), show link URLs.
- Toolbar keeps links back to 3D and 2D (plain styled, no chunky buttons).

Also: reuse formatDate/formatYears from src/utils/format.ts. Move any 2D/résumé styles into clearly
labelled sections of global.css (or a separate CSS file per view if cleaner), and delete the old stub styles.
```

---

## Phase 7: HUD polish, minimap and mobile controls

```text
Phase 7: HUD polish, minimap with quick travel, mobile controls and a real loading progress bar.

Minimap (src/hud/Minimap.tsx):
- Small round "sea chart" in a corner (SVG), rotated to match the camera's current azimuth so "up" on the
  map matches "up" on screen (expose the camera azimuth from CameraRig via a small mutable module, like
  boatState).
- Shows every island (from ISLANDS/ISLETS in src/world/layout.ts) with its icon/short label
  (src/hud/islandInfo.ts), and the boat as an arrow updated every frame without React re-renders
  (requestAnimationFrame + refs, reading boatState).
- Clicking/tapping an island = quick travel: fade the screen briefly, teleport the boat into that island's
  docking ring facing the pier (use dockLayout(island).toWorld(0, y, ringCenter) and the island's yaw),
  zero its velocity, then fade back. Implement teleport in Boat.tsx via a request in boatState or the store
  (RigidBody setTranslation/setRotation/setLinvel). The existing sensor will then show the Dock prompt.
- Keyboard accessible (buttons with aria-labels like "Travel to About Me"), collapsible on small screens,
  hidden while the details modal is open.

Mobile / touch controls:
- Detect touch with matchMedia('(pointer: coarse)').
- On-screen virtual joystick (bottom-left) writing boatInput.throttle/steer (-1..1), with a dead zone and
  pointer capture; releasing resets to 0. Big enough for thumbs, semi-transparent, safe-area aware.
- The Dock prompt button already exists; make sure it's comfortably tappable on phones.
- Touch camera gestures in CameraRig: two-finger pinch = zoom, two-finger horizontal drag = rotate
  (elevation stays fixed, like right-drag on desktop). One-finger touches on the canvas must not
  scroll/zoom the page (touch-action: none on the canvas).
- The bottom hint shows touch instructions on touch devices instead of WASD.

Loading screen:
- Replace the indeterminate bar with real staged progress: 3D chunk loaded, physics (Rapier) ready, fonts
  ready, first frame rendered. drei useProgress only tracks three.js loaders, so drive the bar from these
  stages (plus useProgress for any GLTFs later). Keep the existing summer design and the controls card.

Responsive HUD:
- At phone widths the top bar must not overflow: fold the view switcher into a compact menu or icon-only
  buttons with aria-labels, keep day/night + season reachable, respect safe-area insets. Check 360px,
  390px and 768px widths.
```

---

## Phase 8: performance, accessibility and README

```text
Phase 8: performance pass, accessibility pass, and a real README.

Performance:
- The 3D chunk (src/world/WorldPage) is ~2.5 MB / ~940 KB gzip, mostly @react-three/rapier's inlined WASM.
  Split it sensibly (e.g. Vite/rolldown manual chunking for three, drei, rapier, postprocessing) so the
  browser can cache vendor chunks, and confirm /2d and /resume still don't download any 3D code.
- Add a quality tier (src/hooks/useQuality.ts or similar): "low" on coarse pointers / low deviceMemory /
  hardwareConcurrency ≤ 4. Low tier: fewer ocean segments (Ocean `segments` prop), smaller dpr cap, fewer
  particles and wildlife, no antialias, bloom multisampling 0 or bloom off.
- Pause rendering when the tab is hidden (frameloop="demand" or stop the clock) to save battery.
- Check for per-frame allocations in useFrame callbacks (new Vector3/Color/Matrix4) and hoist them.
- Dispose everything created in useMemo on unmount (most already do; audit).
- Report bundle sizes before/after.

Accessibility:
- Add a motion setting in the HUD and the 2D navbar wired to store.motionPreference
  ('system' | 'reduced' | 'full'); useReducedMotion() already reads it.
- Keyboard pass: everything in the HUD reachable in a sensible tab order; visible focus rings; the dock
  prompt, modal (native <dialog>), minimap and pickers all operable by keyboard.
- Screen readers: the canvas gets an accessible description (role="img" + aria-label summarising the scene
  and pointing to the 2D/Text views); live region announces "Near About Me dock. Press E to dock." when
  nearbyDock changes (throttled).
- Contrast check for HUD buttons, modal and 2D view in light + dark and every season accent; fix any
  failures (WCAG AA).
- Make sure no feature is mouse-only (right-drag rotate has +/- style keyboard equivalents: add Q/E-free
  keys for rotation, e.g. [ and ], since E is dock).

README.md (replace the Vite template):
- What the project is, with a short feature list and the three views.
- Getting started: Node version, npm install, npm run dev / build / preview / lint / typecheck.
- Editing content: walk through src/data/portfolio.ts field by field (welcome sign, personal, links,
  achievements, skills, projects + screenshots in /public/images, education).
- Adding a season: create src/themes/<id>.ts (ThemeConfig: day/night palettes, terrain, birds,
  optional lazy decorations in src/world/seasons/), register it in src/themes/index.ts and the SeasonId
  union in src/types/theme.ts, and update getSeasonForDate if it should be picked automatically.
- Swapping in GLTF models: where the procedural models live (boat/BoatModel.tsx, islands/landmarks/*,
  models/geometry.ts) and how to replace one with useGLTF from /public/models.
- Deploying to Vercel and Netlify (vercel.json and netlify.toml SPA rewrites already exist).
- Project structure overview and the main controls (keyboard, mouse, touch).
```
