# Task Backlog: Pocket Planet

> Historical MVP backlog. For the current implementation baseline, verified issues and prioritized improvements, see [现状评估与分级改进路线图（2026-10）](improvement-roadmap-2026-10.md). Several open items below have since shipped or changed scope; the new roadmap includes a reconciliation table.

Legend: **P0** must, **P1** should, **P2** could · Size S/M/L · ✅ done in this release · ⏭ open.

## Done (this release)
| ID | Item | Pri | Size | Status |
|---|---|---|---|---|
| T-01 | Project scaffold (Vite, TS strict, Three, Express, node:sqlite, Vitest, Playwright) | P0 | S | ✅ |
| T-02 | Geo utils (haversine, bearing, 8-way arrow, lat/lon↔vector, km format) | P0 | S | ✅ |
| T-03 | Map painter: political/terrain, borders, graticule, label anchors (antimeridian-safe) | P0 | M | ✅ |
| T-04 | Globe camera + input + fly-to + keyboard | P0 | M | ✅ |
| T-05 | Label overlay with tiers + declutter | P0 | M | ✅ |
| T-06 | Original catalogue: 48 landmarks, 33 animals, 14 discoveries, 10 vehicles (en+ko) | P0 | L | ✅ |
| T-07 | Procedural model kit (~57 builders) | P0 | L | ✅ |
| T-08 | Vehicles on great-circle routes + ride mode | P1 | M | ✅ |
| T-09 | Top bar, hints, zoom buttons, fullscreen, zoom readout | P0 | S | ✅ |
| T-10 | Menu & persisted settings, reset | P0 | S | ✅ |
| T-11 | Info card / mobile bottom sheet, fact chips (incl. latitude), encyclopedia link, reactions | P0 | M | ✅ |
| T-12 | Deep links & hash router | P0 | S | ✅ |
| T-13 | Dex collect (×10), discovery log, stickers (12), collection hub | P0 | M | ✅ |
| T-14 | Photo mode + IndexedDB album (save/share/delete) | P1 | M | ✅ |
| T-15 | Place it! (4 difficulties, hints, scoring, records) | P0 | M | ✅ |
| T-16 | Quiz generator (13 templates, 5 sets, 3 levels) + 1–4 player UI + podium | P0 | M | ✅ |
| T-17 | Daily Planet (seeded pool, type-or-tap guesses, bands, hints, share, streaks) | P0 | M | ✅ |
| T-18 | Tutorial (7 steps) | P1 | S | ✅ |
| T-19 | i18n en/ko complete, ja/zh chrome | P1 | M | ✅ |
| T-20 | API: auth, me, profile, progress merge, reactions, guestbook, reports, rate limits, CSRF | P1 | L | ✅ |
| T-21 | Account UI + sync + guestbook UI + credits | P1 | M | ✅ |
| T-22 | Static encyclopedia pages + sitemap/robots/404 | P1 | M | ✅ |
| T-23 | Low-FX mode, reduced motion, WebGL failure screen | P1 | S | ✅ |
| T-24 | Unit tests (38) + e2e (13 desktop + 2 mobile) with screenshots | P0 | M | ✅ |

## Open
| ID | Item | Pri | Size | Notes |
|---|---|---|---|---|
| B-01 | Expand catalogue towards 200 landmarks / 150 animals / 50 discoveries | P1 | L | Data-only thanks to the model kit |
| B-02 | Full ja/zh translations of the catalogue and remaining UI keys | P1 | M | Add an i18n completeness test for ja/zh |
| B-03 | Dex filter tabs (Land / Sea / Birds / Found) like the reference | P2 | S | Currently grouped by `sub` headings |
| B-04 | Daily hint "show the 3D model" step (silhouette preview) | P2 | S | |
| B-05 | Background music toggle (`bgm` setting exists, no track) | P2 | S | Needs an original/CC0 track |
| B-06 | Real photos for encyclopedia pages (CC0/Public domain with credits) | P2 | M | |
| B-07 | City names in ko/ja/zh | P2 | M | |
| B-08 | Esc quits game HUDs (Place it!, Quiz, Daily pick) | P2 | S | ✕ works today |
| B-09 | Offline PWA (service worker, install) | P2 | M | |
| B-10 | Admin moderation view for guestbook (unhide/delete) | P1 | M | |
| B-11 | Google / Apple sign-in | P2 | M | |
| B-12 | Production mail transport for magic links (SMTP / provider API) | P0 for prod | S | `sendMail` hook already injected |
| B-13 | Content-Security-Policy header | P1 | S | No third-party origins are needed |
| B-14 | CI pipeline (typecheck, unit, build, e2e under xvfb) | P1 | S | Partly done: `pages.yml` runs typecheck, unit tests and build. e2e under xvfb is still to add |
| B-15 | Frame-time adaptive DPR | P2 | S | Done: ADR-015 (device tiers, adaptive DPR, model budget) |
| B-16 | Deployment (container, TLS proxy, backups of SQLite, proxy rate limits) | P1 | M | |
| B-17 | Code-split Three.js chunk / lazy-load games UI to cut initial JS | P2 | S | ~205 KB gz today |
