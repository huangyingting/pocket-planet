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
under `prefers-reduced-motion`) uses DPR 1, no MSAA, a 2048 px map texture, fewer stars and 1 Hz labels.
Shadows and every item layer can be toggled. *Deferred:* frame-time-adaptive DPR (backlog B-15).

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
