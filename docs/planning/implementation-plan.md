# Implementation Plan: Terrastra

> Historical MVP plan. For current priorities and status see [the 2026-10 roadmap](improvement-roadmap-2026-10.md).

Milestones are ordered by dependency. Each one ends with an automated check. Status reflects this release.

| # | Milestone | Deliverables | Exit check | Status |
|---|---|---|---|---|
| M0 | Research | Static crawl, interactive exploration, bundle analysis, screenshots | [exploration report](../research/exploration-report.md) | ✅ |
| M1 | Foundations | Vite + TS strict + Three; `src/shared/lib` (geo, rng) + `src/client/lib` (storage, i18n, sfx); data types; Natural Earth import | `tsc` clean; geo unit tests | ✅ |
| M2 | Globe core | Renderer, orbit camera, input (drag/inertia/wheel/pinch/keys), fly-to, map painter, labels overlay, stars, atmosphere, Low-FX, WebGL fallback | Smoke screenshot; e2e "home" | ✅ |
| M3 | Content | Original catalogue (48/33/14/10), 144 cities, model kit (~57 builders), tiers, vehicle routes | Catalogue integrity unit test | ✅ |
| M4 | Shell UX | Top bar, hints, zoom/fullscreen, menu & settings, info card / bottom sheet, deep links, Esc handling | e2e menu, info card, mobile | ✅ |
| M5 | Collection | Dex collect at ×10, discovery log, stickers engine, collection hub, ride mode, photo mode + album | e2e collect, ride, photo; sticker unit tests | ✅ |
| M6 | Games | Place it! logic+UI; quiz generator+UI (1–4 players); Daily pool/bands/hints/share/stats + UI (type or tap) | Logic unit tests; 3 e2e game flows | ✅ |
| M7 | Onboarding & i18n | 7-step tutorial; en+ko complete, ja/zh chrome | e2e tutorial; i18n completeness test | ✅ |
| M8 | Backend | Express app factory, SQLite schema, magic-link auth, sessions, profile, progress merge, reactions, guestbook + moderation, rate limits, CSRF, headers | `tests/unit/server.test.ts` | ✅ |
| M9 | Client ↔ server | Account modal, nickname, sync (on sign-in, debounced on change, manual), guestbook UI, credits | e2e account flow | ✅ |
| M10 | SEO pages | Build-time encyclopedia pages (en/ko), indexes, about, sitemap, robots, 404 | e2e encyclopedia; curl 404 | ✅ |
| M11 | Hardening & docs | Screenshot review fixes (antimeridian labels, FOV, model scale, toast stacking), quiz option-count fix, origin hardening, docs set | Full unit + e2e green | ✅ |
| M12 | Production readiness | Mail transport, CSP, adaptive DPR, CI pipeline, deployment | Backlog B-12…B-16 | ⏭ next |

## Working agreements
* Pure logic lives in `src/shared` (no DOM), so it can be unit-tested and reused by the server.
* Every UI flow gets a `data-testid` and an e2e test. Screenshots go to `docs/assets/screenshots/` for visual review.
* No reference assets: all models are procedural, all text is original, and art is emoji.

## Verification commands
```bash
cd app
npm run typecheck                 # client + server TS
npm test                          # Vitest: logic + API (in-memory SQLite)
npm run build                     # tsc + vite build + static pages
xvfb-run -a -s "-screen 0 1920x1080x24" npx playwright test   # e2e desktop + mobile (SwiftShader)
```
