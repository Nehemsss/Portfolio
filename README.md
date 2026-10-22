# Island Portfolio

An interactive 3D portfolio: sail a little boat between cartoon islands, dock at each one, and read
about me in a pop-up panel. Every island is a section of the portfolio (About, Achievements,
Skills & Projects, Education), and the same content is also available as a regular 2D website.

Built with React 19, TypeScript, Vite 8, React Three Fiber, drei, Rapier physics and Zustand.

## Features

- **Sail and dock:** arcade boat physics, a docking ring and prompt at every pier, and a details
  panel that opens when you dock.
- **Day and night:** a sun/moon toggle (or Auto, following your local time), with glowing lamps,
  stars and night-only sea life.
- **Seasons:** Summer, Winter (Christmas), Halloween and Valentine's, each with its own colours,
  decorations and particles. Auto picks one from the date.
- **Minimap:** a sea chart that turns with the camera. Click an island to quick-travel there.
- **Touch support:** on-screen joystick, pinch to zoom, two-finger drag to rotate.
- **Accessible:** keyboard-only play, a screen-reader description of the scene, dock
  announcements, a Motion setting (Auto / Reduced / Full), and AA colour contrast.
- **Fast:** the 3D code is split into cacheable chunks the 2D page never downloads, and a
  quality tier lowers the detail on phones and low-end devices.

### The views

| URL | View |
| --- | --- |
| `/` | The 3D world. Devices without WebGL (or very low-end ones) are sent to `/2d` automatically. |
| `/2d` | A standard responsive website with the same content, light/dark mode and seasonal touches. |
| `/resume` | A plain, printable text résumé. **Currently locked**: see [Feature switches](#feature-switches). |

Unknown URLs show a friendly 404 page.

## Getting started

You need **Node.js 20.19 or newer** (22 LTS recommended).

```bash
npm install
npm run dev         # start the dev server at http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Type-check, then build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally, to test the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no output |

## Editing your content

**All** text and links live in one file: [`src/data/portfolio.ts`](src/data/portfolio.ts). The 3D
panels, the 2D site and the résumé all read from it, so you edit things once. Every placeholder is
marked `// TODO: replace`.

| Field | What it controls |
| --- | --- |
| `sections` | The four section islands: `title` (panel headings, 2D section titles) and `shortLabel` (2D navbar). Keep the `id`s. The order here is the 2D navbar order. |
| `welcomeSign` | The big sign on the Home Island, the first thing visitors see. |
| `personal.name`, `headline`, `tagline` | Your name and one-liners, shown in the 2D hero, the About panel and the résumé. |
| `personal.bio` | The About Me text: a list of strings, one per paragraph. |
| `personal.location`, `interests` | Shown in the About Me section. |
| `personal.email`, `phone` | Contact details (`phone` is optional). |
| `personal.links` | Contact buttons. `kind` (`email`, `github`, `linkedin`, `website`, `other`) picks the icon. |
| `personal.avatar` | Optional photo path, e.g. `"/images/avatar.jpg"`. Without it, your initial is shown. |
| `achievements` | Awards and certifications: `title`, `issuer`, `date` (`"2025-03"` shows as "Mar 2025"), `kind`, optional `description` and `credentialUrl`. |
| `skills` | Skill groups: a `category` and its list of `skills`. |
| `projects` | `title`, `description`, `tech`, optional `liveUrl` and `repoUrl`, and `screenshots`. |
| `education` | Most recent first: `school`, `credential`, `location`, `startYear`, `endYear` (`"Present"` for ongoing), `honors`. |

**Images:** put files in [`public/images/`](public/) and reference them from the site root, e.g.
`screenshots: ['/images/my-app.png']` or `avatar: '/images/avatar.jpg'`. Screenshots appear in the
3D panel and the 2D site, never in the text résumé.

## Feature switches

[`src/features.ts`](src/features.ts) turns unfinished parts on and off:

- `textOnlyResume` (`false` now): while off, every "Text Only" / "Résumé" button shows a
  "coming soon" bubble, and `/resume` shows a "coming soon" page. Set it to `true` to publish the
  résumé ([`src/views/Resume/Resume.tsx`](src/views/Resume/Resume.tsx), already built).

## Adding a season

1. Create `src/themes/<id>.ts` exporting a `ThemeConfig` (see [`src/types/theme.ts`](src/types/theme.ts);
   copy [`summer.ts`](src/themes/summer.ts) as a starting point). It holds:
   - `label`, `icon` (emoji for the season picker), and `ui.accent` (accent colour for the HUD and 2D view);
   - `day` / `night` palettes (fog, sun or moon light, sky, water colours);
   - `terrain` colours (grass, cliff rim, sand, tree tints, whether everyday flowers show);
   - `birds`: `'seagulls'` or `'bats'`;
   - optional `decorations`: a lazy import of a component, e.g.
     `decorations: () => import('../world/seasons/MyDecor')`. Put season props and particles in
     `src/world/seasons/`; they download only when the season is first picked.
2. Add the id to the `SeasonId` union in [`src/types/theme.ts`](src/types/theme.ts).
3. Register it in [`src/themes/index.ts`](src/themes/index.ts). The order there is the picker's order.
4. To have **Auto** pick it, add a date rule to `getSeasonForDate` in the same file.
5. Optionally add its button colours (`.season-<id>`) next to the others in
   [`src/styles/global.css`](src/styles/global.css).

## Swapping in 3D models (GLTF)

Everything 3D is built from simple procedural shapes, so there are no model files to download. To
replace a piece with a real model:

| What | Where |
| --- | --- |
| The boat | [`src/world/boat/BoatModel.tsx`](src/world/boat/BoatModel.tsx) |
| Island landmarks (cottage, trophy, workshop, school, lighthouse, farm) | [`src/world/islands/landmarks/`](src/world/islands/landmarks/) |
| Shared shapes (palms, pines, roofs…) | [`src/world/models/geometry.ts`](src/world/models/geometry.ts) |

1. Export the model as `.glb` and put it in `public/models/`, e.g. `public/models/boat.glb`.
2. In the component, load it with drei's `useGLTF` and render the scene:

   ```tsx
   import { useGLTF } from '@react-three/drei'

   export default function BoatModel() {
     const { scene } = useGLTF('/models/boat.glb')
     return <primitive object={scene} />
   }
   useGLTF.preload('/models/boat.glb')
   ```

3. Adjust `scale` / `position` / `rotation` on a wrapping `<group>` to fit. The boat's collider is
   set separately in `Boat.tsx`. The loading screen tracks GLTF downloads automatically.

## Controls

| Action | Keyboard | Mouse | Touch |
| --- | --- | --- | --- |
| Sail | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or arrow keys | | Joystick (bottom left) |
| Dock | <kbd>E</kbd> near a glowing ring | Dock button | Dock button |
| Close a panel | <kbd>Esc</kbd> | ✕ or click outside | ✕ |
| Rotate the view | <kbd>[</kbd> <kbd>]</kbd> | Right-drag | Two-finger drag |
| Zoom | <kbd>+</kbd> <kbd>-</kbd> | Scroll wheel | Pinch |
| Quick travel | Tab to a map island, <kbd>Enter</kbd> | Click an island on the map | Tap an island on the map |

Add `?quality=low` or `?quality=high` to the URL to force a rendering quality tier (normally
detected from the device).

## Deploying

The project is a static site: `npm run build` produces `dist/`. Both hosts below need a rewrite so
that routes like `/2d` serve `index.html`, and **both config files are already included**.

**Vercel:** import the GitHub repository at [vercel.com/new](https://vercel.com/new). The Vite
preset is detected (build `npm run build`, output `dist`). [`vercel.json`](vercel.json) adds the
SPA rewrite.

**Netlify:** "Add new site" → "Import an existing project" → pick the repository.
[`netlify.toml`](netlify.toml) already sets the build command, the `dist` folder and the SPA
redirect.

Every push to the main branch then redeploys automatically.

## Project structure

```text
src/
  data/portfolio.ts      ← all content (edit this)
  features.ts            ← feature switches
  types/                 Content and theme types
  themes/                One file per season + registry
  store/useAppStore.ts   Global state (day/night, season, motion, docking) via Zustand
  hooks/                 Device checks, quality tier, reduced motion, touch detection
  utils/format.ts        Date formatting
  components/            Shared UI: section content, view switcher, loading screen, motion toggle
  hud/                   3D overlay: dock prompt, details panel, minimap, joystick, pickers
  views/                 Non-3D pages: View2D, Resume, ErrorPage
  world/                 The 3D scene (lazy-loaded chunk)
    WorldPage.tsx, World.tsx   Page + <Canvas>
    layout.ts                  Island positions, world size
    boat/                      Boat physics, model, wake, camera rig, shared boat/camera state
    islands/                   Terrain, docks, scenery, landmarks, signs
    ocean/                     Water shader and wave function
    environment/               Day/night, sky, lighting, bloom, season colours
    ambient/                   Fish, seagulls, whale, stingrays, wind trails
    seasons/                   Lazy per-season decorations
  styles/global.css      All styles, in labelled sections
```
