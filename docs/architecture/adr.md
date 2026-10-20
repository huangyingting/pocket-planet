# Architecture Decision Records — "Pocket Planet"

Pocket Planet is an original, kid-friendly 3D toy-globe web app whose *capabilities* are comparable to the
reference product studied in [exploration report](../research/exploration-report.md). No code, models, text, images, audio or data files
from the reference were copied; only publicly observable behaviour and open data sources were used.

Status legend: **Accepted** / Proposed / Superseded.

---

## ADR-001 — Single-page WebGL client built with Vite + TypeScript + Three.js
**Status:** Accepted

**Context.** The reference is a single HTML page with ~15 MB of hand-written, unbundled JS (Three.js r128
from a CDN, globals everywhere, data inlined into the scripts). It loads in two stages and takes a long time
to become interactive on low-end devices (observed: ~60–150 s under software rendering).

**Decision.** Use Vite (ES modules, code-splitting, hashed assets), strict TypeScript, and Three.js from npm.
Feature modules (globe, layers, games, quiz, photo, ride, dex, i18n, ui) are separate ES modules with
explicit imports. The curated catalogue and cities are typed TS modules (`src/shared/data/*`), so they are shared,
type-checked, by the client, the server (validation) and the static-page generator. The large country geometry
(`/data/countries-110m.json`) is fetched at start-up.

*Implementation note (2026-10):* the production bundle is ~716 KB JS / ~205 KB gzip, including Three.js and the catalogue.

**Consequences.** + Type-safety, tree-shaking, small initial bundle, testable pure logic.
− A build step is required (acceptable: CI and `npm run build`).

## ADR-002 — Procedural low-poly "toy" models instead of hand-authored meshes
**Status:** Accepted

**Context.** The reference hand-codes ~1,400 Three.js builder functions (one per landmark/animal/vehicle).
That is not reproducible, and copying it would infringe.

**Decision.** A small *model kit* (`src/client/models/kit.ts`) of ~57 parametric builders (e.g. `lattice`, `pyramid`,
`domed`, `suspension`, `pagoda`, `mountain`, `quad`, `penguin`, `whale`, `octopus`, `wreck`, `ship`, `plane`,
`train`, `balloon`) composes each catalogue entry from a compact recipe (`model: {kind, color, accent, …}`).
New content = new data, not new code.

**Consequences.** + Thousands of items possible from data. − Less bespoke detail per item (accepted for MVP).

## ADR-003 — Country geometry from Natural Earth (via `world-atlas` TopoJSON)
**Status:** Accepted

**Decision.** Use the public-domain Natural Earth 1:110m countries (`world-atlas/countries-110m.json`) decoded
with `topojson-client`. Countries are rendered into an equirectangular canvas texture (political colours,
borders, graticule) wrapped on a sphere; the same polygons drive point-in-country lookups for games.

**Consequences.** + Public domain, small (~100 KB). − Coarse coastlines at high zoom (acceptable for a toy look).

## ADR-004 — Labels drawn on a 2D overlay canvas with collision culling
**Status:** Accepted

**Decision.** Country, city, ocean and item labels are projected each frame and drawn on a 2D canvas above
the WebGL canvas, with back-face culling (dot product with the camera), zoom-tier filtering and a greedy
rectangle collision pass. This mirrors the observed UX (labels fade in with zoom) without per-label DOM nodes.

## ADR-005 — Local-first progress, optional account sync
**Status:** Accepted

**Context.** The reference requires sign-in (Supabase magic link / Google OAuth) for riding, the dex,
discoveries and games; anonymous users only explore. For a children's product, forcing sign-in adds
friction and collects personal data.

**Decision.** All progress (dex, discoveries, stickers, game/quiz stats, daily puzzle, photos, settings) is
stored locally first (localStorage + IndexedDB for photos). An *optional* account (email magic link) enables
cloud sync of progress, reactions (♥ like / ✓ visited counts) and a moderated guestbook.

**Consequences.** + Works offline and anonymously; COPPA/GDPR-K friendlier. − Sync conflict rules needed
(see ADR-007).

## ADR-006 — Backend: Node.js + Express + built-in `node:sqlite`
**Status:** Accepted

**Decision.** A small Express 5 server (`src/server/`) serves the built SPA + static encyclopedia pages and a JSON
API under `/api/*`. Persistence uses Node's built-in `node:sqlite` (no native addon build). Auth: passwordless
email magic link; tokens are random 32-byte values stored hashed (SHA-256) with 15-min expiry; sessions are
httpOnly, `SameSite=Lax`, `Secure` (in production) cookies. Mail delivery is an injected `sendMail(to, link)` hook. Outside production
the link is logged with a masked address and also returned in the API response (`devLink`; forced on with
`DEV_LOGIN=1`, e.g. for e2e). A production mail transport (SMTP/API) is a backlog item (B-12).

**Consequences.** + Zero external services; one process; easy to host. − SQLite is single-node (fine for MVP;
swap to Postgres behind the same repository interface later).

## ADR-007 — Progress sync = per-field merge (union for collections, max for counters)
**Status:** Accepted

**Decision.** `PUT /api/progress` merges client and server documents: sets (dex, discoveries, stickers) are
unioned; numeric stats take the max; "best" maps take per-key max; daily puzzle history is unioned by day.
The merged document is returned and stored by the client. No destructive overwrite is possible.

## ADR-008 — Static, pre-rendered encyclopedia pages for SEO
**Status:** Accepted

**Context.** The reference ships ~2,940 crawlable pages (landmarks/animals/discover × en/ko) with facts,
quick answers, a quiz teaser, "nearby" links and a "See it on the 3D globe →" deep link (`/#<key>`).

**Decision.** A build script (`scripts/build-pages.ts`) renders the catalogue into static HTML pages
(`/landmarks/`, `/animals/`, `/discover/`, `/<section>/<slug>/`, localized under `/<lang>/…`), plus
`sitemap.xml`, `robots.txt` and a friendly 404. Deep links `/#<key>` fly the globe to the item and open its card.

## ADR-009 — i18n: 4 languages, dictionary objects, language resolution chain
**Status:** Accepted

**Decision.** UI strings live in `src/client/lib/i18n.ts` (en, ko complete; ja, zh partial). Language resolution:
saved choice (`localStorage`) → `navigator.language` → `en`. Missing keys fall back to English per key.
Catalogue names/descriptions are per-language maps (en + ko) with English fallback. Country names come from `Intl.DisplayNames`.

## ADR-010 — Testing strategy
**Status:** Accepted

**Decision.** Vitest for pure logic (geo math, scoring, quiz generation, daily puzzle, merge, i18n
resolution) and API tests (supertest-style with `fetch` against an ephemeral server). Playwright e2e against
the production build under Xvfb + SwiftShader, with `?lowfx=1` to reduce GPU cost in CI.

## ADR-011 — Performance budget & adaptive quality
**Status:** Accepted

**Decision.** Initial JS ≤ 300 KB gz (Three.js dominates). Render on demand: a frame is drawn only when the
camera/scene is dirty or something animates. DPR is capped at 2. Labels refresh at ~8 Hz. `?lowfx=1` (also the default
under `prefers-reduced-motion`) uses DPR 1, no MSAA, a 512 px map texture, fewer stars and 1 Hz labels.
Shadows and every item layer can be toggled. Device tiers and frame-time-adaptive DPR: see ADR-015.

## ADR-012: Daily puzzle is computed client-side and deterministically
**Status:** Accepted

**Context.** The reference stores the daily answer key in localStorage. A server-side puzzle would hide the
answer but would require the network and an account-less identity for streaks.

**Decision.** `dayIndex` (local calendar days since 2026-01-01) selects from a frozen, seeded pool of landmarks,
with consecutive days ≥ 1200 km apart. All players get the same puzzle on the same local date, and it works offline.
Guesses can be typed (accent-insensitive, any language alias) or picked by tapping the globe.

**Consequences.** + Offline, zero server cost, reproducible in tests. − A determined user can read the answer
from the bundle. That is acceptable for a kids' toy with no prizes or leaderboard.

## ADR-013: Reactions and reports keyed by an anonymous visitor cookie
**Status:** Accepted (supersedes the "auth" note in §4.6 of the architecture draft)

**Decision.** ♥/✓ reactions and guestbook reports use a random 128-bit `pp_vid` httpOnly cookie, not an account.
One reaction of each kind per visitor and item, and one report per visitor and entry. Posting to the guestbook still requires
sign-in, which gives accountability for the only user-generated text.

**Consequences.** + Kids can react without an account. − Counts can be inflated by clearing cookies (low
stakes; the item key is validated, and a reverse-proxy rate limit is recommended in production).

## ADR-014: Models are built in Web Workers, with a far level of detail and instanced plinths
**Status:** Accepted (extends ADR-011)

**Context.** Hero models are 20–40k triangles each and took 50–300 ms to build and AO-bake on the main thread. That
caused long tasks while the user flew around. The tour also drew ~6 draw calls and ~20k triangles per visible item,
even when an item was only a few pixels tall.

**Decision.**
- `models/build.worker.ts` builds and bakes models in a pool of up to 2 module workers. `models/pack.ts` ships the
  result as transferable typed arrays. `models/library.ts` is the only API the app uses: it keeps a prototype cache,
  hands out clones, and falls back to building on the main thread (lazy `kit.ts` chunk) when workers are unavailable.
- `bakeStaticMeshes` appends a far copy of every merged mesh. Each high-poly part is vertex-clustered (grid cell ×
  dominant normal). The simplification is area-guarded, so thin lattices are kept as they are. Tiny parts are
  dropped. Below ~60 px on screen an instance draws only that range (`setModelDetail`), which is ~27% of the
  triangles on average.
- All plinth shadows and rings are two `InstancedMesh`es. three.js is split into its own long-cached chunk.
- `tools/perf.mjs` measures load and tour metrics (long tasks, frame CPU, draw calls, triangles) on `dist`.

**Consequences.** + No model building on the main thread. Per visible item, ~3.5 draw calls and ~6.5k triangles
instead of ~6 and ~20k. + The main bundle no longer contains the builders. − Models must stay serialisable:
untextured MeshStandard/MeshBasic materials and plain BufferGeometry, otherwise they fall back to the main thread.

## ADR-015: Device quality tiers for phones, adaptive resolution and a visible-model budget
**Status:** Accepted (extends ADR-011 and ADR-014; closes backlog B-15)

**Context.** On an emulated mid-range phone (390×844 at DPR 3, 4× CPU throttling, `tools/perf.mjs --mobile`) the app
rendered a 780×1688 MSAA buffer, drew ~290 draw calls / ~510k triangles per frame and spent ~5.5 s of start-up
painting the 2048 px biome map on the main thread. Profiling `frame()` showed the JS work is ~1 ms; the cost is GPU
fill (pixels × MSAA × translucent layers) plus geometry.

**Decision.**
- `globe/quality.ts` picks a tier once at start-up: `high` (desktop), `medium` (phones/tablets: mobile UA or coarse
  pointer on a ≤1024 px screen, or ≤4 GB memory) and `low` (≤2 GB or ≤2 cores, or `?lowfx`). `?q=high|medium|low`
  overrides. Every resolution/detail knob lives in the tier table: DPR cap, MSAA, map / night / cloud texture sizes,
  sphere segments, aurora and star counts, far-LOD threshold, placement budget, visible-model budget and idle frame cap.
  `body.q-<tier>` lets CSS drop `backdrop-filter` (panels are ~90% opaque anyway) on phones.
- **Adaptive resolution.** `AdaptiveResolution` smooths the interval between rendered frames and steps the pixel ratio
  down by 0.25 after ~45 slow frames (> 36 ms) to the tier floor, and back up after ~300 fast ones; stalls > 250 ms and
  idle-capped frames are ignored. Off under reduced motion (frames are drawn on demand there).
- **Visible-model budget.** Every ~400 ms (or when the view changes) static models facing the camera are ranked by
  closeness to the view centre (+ a small tier-1 bonus); beyond the tier's budget (48 on phones) they are hidden.
  Moving items are hidden once they pass behind the horizon (they keep travelling), except orbiters.
  Moving items have their own cap (16 on phones), ranked from their current positions.
- **Idle frame cap.** On `medium`/`low`, when nothing is dragged, flown or ridden, ambient animation runs at 30 fps.
- **Faster map painting.** The procedural biome colour field is evaluated on a 2-px lattice (lazily, only next to land)
  and interpolated bilinearly: 3× faster, mean difference 0.08/255.

**Consequences.** Phone emulation: ready 8.7 s → 4.4 s, draw calls 287 → 170, triangles 512k → 303k, render buffer
1.3 M → 0.74 M pixels without MSAA. − Phones show fewer models at once when zoomed out (the nearest win; zooming in
reveals the rest). − Phone edges are slightly softer (no MSAA, DPR ≤ 1.5).

## ADR-016: The Solar System is a second, lazily loaded view with real orbits and compressed scales
**Status:** Accepted

**Context.** Kids asked to zoom out from the Earth to the other planets and see their landscapes and where they are.
Real scales do not fit on a screen (Neptune is ~4.5 billion km away; Earth would be under a pixel), the globe's camera,
picking and item pipeline are Earth-specific, and the extra code and textures must not slow the globe or phones.

**Decision.**
- **Separate view, loaded on demand.** `src/client/solar/` (view, UI, painter worker) is a dynamic-import chunk with its
  own `WebGLRenderer` and canvas. While it is up the globe is `paused` (its RAF does no work) and hidden; only one
  renderer draws at a time. Entry: wheel/pinch on past the globe's widest zoom (`Globe.ev.onBeyond`), the zoom-out button
  at max zoom, the toolbar planet button, or `#solar…` links. Exit: zooming into Earth below 4.6 R (the globe's widest
  view is 5.5 R), "Back to Earth" or "Land on Earth"; the globe then flies in to the same latitude/longitude.
- **Real positions, display scales.** `shared/lib/orbits.ts` (pure, unit-tested) computes heliocentric ecliptic
  positions from JPL's approximate Keplerian elements, the Moon from a short lunar series (correct phases) and other
  moons on circular orbits in their planet's equatorial plane. For display, orbit radii are compressed as `12·√AU` and
  body radii as `0.34·(R/R⊕)^0.45` (Sun fixed at 2.6); moon distances are monotonic in the real ones. Directions,
  order, eccentricity and inclinations stay real. Axial tilts and pole directions are applied; Earth's spin puts the
  sub-solar point over the right longitude, tidally locked moons keep the same face to their planet, others spin freely.
  Spin is capped at 2 simulated hours per real second so fast time does not whirl the planets.
- **Time.** A simulated clock (pause, real time, 1 hour/1 day/1 month/1 year per second, "now"); positions are recomputed
  each frame (20 bodies, microseconds).
- **Surfaces painted procedurally in a worker.** `paint.ts` (DOM-free) paints equirectangular colour maps with real named
  features at real coordinates, plus height maps used as bump maps for solid bodies, and ring profiles. Every body gets a
  small map up front (256 px, 512 on desktop); the focused body is repainted at 1024 px (2048 on desktop), at most three
  large maps are kept. Earth reuses the globe's own painted land map over an ocean.
- **Camera.** An orbit camera around the focus body (drag, wheel/pinch, inertia; distance measured from the surface).
  Near a body it co-rotates with the surface, so landforms stay put while day and night sweep across. Picking is
  screen-space against projected discs (plus a 16 px slop for tiny far bodies); names and features are HTML labels
  (feature labels only on the visible hemisphere of the focus body, de-cluttered, largest first).
- **Content.** `solar.ts` (physical data), `solar-text.ts` (card text) and `solar-features.ts` (named craters, maria,
  volcanoes, canyons, landing sites… with east-positive planetocentric coordinates) are bilingual; `gen-wiki` maps them
  to Wikipedia as `sb_<body>` / `sf_<body>_<slug>` so the same in-card reader works.

**Consequences.** + No cost to the globe until opened; the chunk is small and textures are painted, not downloaded.
+ Correct sky for any date (planet positions, Moon phase, seasons via Earth's tilt). − Distances and sizes are not to
scale (explained by the compressed display; facts in the card give real numbers). − Minor moons' positions along their
orbits are approximate.
