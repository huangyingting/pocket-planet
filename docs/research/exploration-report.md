# Exploration Report: myearthtoy.com (reference product)

**Date:** 2026-10-18
**Method:** Playwright (Chromium 1248) under Xvfb with SwiftShader WebGL. Viewports were desktop 1280×800 and mobile 390×844 (iPhone-like, touch, DPR 3).
**Access:** anonymous only. No `.cred` file was provided, so the sign-in-gated flows (dex collecting, ride, games for
non-free regions, guestbook posting) were observed only up to the sign-in dialog. Everything behind it was
documented from the public, unminified client bundles (`/js/s1.*.js`, `/js/s2.*.js`) and from network traces.
No content from the reference (models, text, images, data) is reused in Terrastra.

Artifacts (under `research/`; regenerate with `npm run research:crawl` / `research:explore`). The scripts are versioned. The captures (`data/`, `screenshots/`, `raw/`) hold third-party content, so they stay local and are git-ignored:

| Artifact | What it is |
|---|---|
| `scripts/crawl-static.mjs`, `data/static_pages.json`, `data/urls.txt`, `raw/sitemap.xml` | Static/SEO crawl: titles, headings, links, status codes, image counts |
| `screenshots/static/{desktop,mobile}_*.png` (30) | Screenshots of 15 static pages × 2 viewports |
| `scripts/probe-app-load.mjs`, `scripts/explore-app.mjs`, `data/run_desktop.log`, `data/explore_desktop.json` | Interactive globe exploration script, step log, open-panel text dumps, network |
| `screenshots/app/load_*.png` (12) | Load sequence (progress bar → globe) |
| `screenshots/app/desktopB_*.png` (22) | Interactive UI states (see index below) |
| `data/net_home.json` | Network requests of the home page |
| `data/state.json` | localStorage after exploration |
| `raw/s1.js`, `raw/s2.js`, `raw/*.html` | Reference bundles and page dumps (analysis only, never copied; git-ignored) |
| `scripts/webgl-check-*.mjs` | SwiftShader/ANGLE probes used to get WebGL working headless |

---

## 1. Route inventory

### 1.1 Crawlable pages (sitemap: 2,943 URLs)
| Route | Count | Notes |
|---|---|---|
| `/` | 1 | The globe app (single page, WebGL). Also hosts the SEO "about" copy |
| `/about`, `/ko/about`, `/ja/about`, `/zh/about` | 4 | Marketing / "30-second tour" / "what's inside" pages, 4-language switcher |
| `/privacy` | 1 | Privacy policy, KO/EN toggle buttons (`#b-ko`, `#b-en`), mailto contact |
| `/landmarks/`, `/ko/landmarks/` | 2 | Index grouped by continent → country (825 thumbnails) |
| `/landmarks/<slug>/` (+ `/ko/…`) | 824 × 2 | Item page: H1, "At a glance" facts, "Quick answers" FAQ (Where is…? When was… built?), photo with credit, "See it on the 3D globe →" link `/#<key>` |
| `/animals/`, `/animals/<slug>/` (+ ko) | 470 × 2 | Grouped by class (Mammals, Birds, Fish, Reptiles…) |
| `/discover/`, `/discover/<slug>/` (+ ko) | 172 × 2 | Grouped by kind (Shipwrecks, Mysteries, Legendary creatures…). Sections such as "What happened" and "How the wreck was found" |
| Any unknown path | n/a | **HTTP 404** with a friendly bilingual page ("This place isn't on the map" / "이 페이지는 지도에 없어요"), link back to `/` |
| `/landmarks/not-a-landmark/` | n/a | Same 404 page (no soft-404) |

### 1.2 In-app (hash) routes
| Hash | Behaviour |
|---|---|
| `#<key>` e.g. `#eiffel`, `#an_lion`, `#mi_titanic` | Fly to the item at zoom ×10 and open its info card |
| `#daily` | Opens the "Daily Earth" (오늘의 지구) intro dialog |
| `#ko` / `#en` / … | Set by the language switcher; the camera resets to ×1.0 on reload |

### 1.3 Network & third parties (home page)
* `three.js r128` + OrbitControls + Line2 from cdnjs/jsdelivr, `topojson-client 3.1.0`, Google Fonts (Jua, Nunito, Noto Sans KR, IBM Plex Mono).
* `s1.<hash>.js` (13.6 MB) and `s2.<hash>.js` (1.7 MB): all data and model builders are inlined.
* `GET /data/dex.json`, `GET /data/enc.json` (encyclopedia), textures `earth-bathymetry.jpg`, `earth-topology.png`, `earth-blue-marble.jpg`; `/data/flags.json` lazily for quizzes.
* Supabase: REST `layout?select=id,doc` (paged 1000), RPC `signup_count`, and auth / `profiles` / `dex_found` / `reactions` / `guestbook` / `guestbook_reports`, plus a realtime channel on `layout` (seen in the bundle).
* Cloudflare RUM beacon (`/cdn-cgi/rum`) and `/cdn-cgi/trace` (geo lookup used for a regional free pass).

---

## 2. Screen-by-screen observations (index of screenshots)

| # | Screenshot | State | Observations |
|---|---|---|---|
| L0–L11 | `load_*.png` | Loading | A full-screen loader with progress and a counts line ("825 LANDMARKS · … "). Under software GL it takes 60–150 s to become interactive |
| 01 | `desktopB_01_welcome.png` | Welcome / tutorial | First visit shows a multi-step tutorial (Skip/Next, dots). Persisted as `tutorial=skip|done` |
| 02 | `desktopB_02_help_hint.png` | Help hints | Bottom-left pills: "Drag spin the globe", "Wheel / pinch zoom in for more cities", "Click a landmark photo & info", "🎓 Show the tutorial again". The `?` toggles them (`hint-open`) |
| 03 | `desktopB_03_menu_open.png` | Globe at ×4.0 | Political pastel colours, relief shading, country labels (uppercase, letter-spaced), cities with population, ocean labels in italic blue, graticule with tropic lines, star field, atmosphere glow. Top bar: logo + EARLY ACCESS badge, Photo, Collection, Game (red dot), Menu, Support. Bottom right: fullscreen, +, − |
| 04 | `desktopB_04_collection.png` | Collection hub | 4 big cards: Animal dex (470 species, land·sea·birds, 0/470), Discovery dex (107 places, 8 kinds), Stickers (dex·games·quiz), Photo album (0 photos) |
| 07 | `desktopB_07_game_card_1.png` | Animal dex | Grid of numbered silhouettes ("No.001 ???"), tabs All / Land / Sea / Birds, "✓ Found" filter, progress bar |
| 11–13 | `desktopB_11..13_photo_*.png` | Photo mode | Viewfinder overlay, "PHOTO MODE", zoom readout, shutter. The album says "Photos are kept only in this browser on this device. Use [Save]…" |
| 14 | `desktopB_14_hash_eiffel.png` | Deep link `#eiffel` | Zoom ×10, side info card: photo, title, "Paris, France", 1–2 sentence description, chips (Height 330 m, Built 1887–1889, Continent, Country, Latitude 48.9°N · Northern Hemisphere), "More on Wikipedia", "📖 Read more" |
| 15 | `desktopB_15_encyclopedia_panel.png` | Encyclopedia panel | Right drawer with long article, secondary-language name, photo credit (public domain, source link). Detailed 3D models visible at ×10 (Eiffel, Mont-Saint-Michel, Louvre) with soft shadows |
| 16 | `desktopB_16_hash_an_lion.png` | `#an_lion` | Animal card; collecting requires sign-in and zoom |
| 18–19 | `desktopB_18/19` | Zoomed / canvas tap | Tapping empty globe does nothing; tapping a model opens its card |
| 20 | `desktopB_20_lang_ko.png` | Korean | Whole UI and country/city labels switch to Korean (나의 지구 장난감) |
| 21 | `desktopB_21_credits.png` | Credits | Data and photo credits |
| 22 | `desktopB_22_account_dialog.png` | Menu + sign-in | Menu sections: **Map** (Real terrain, Place names, Borders & grid, Shadows), **On the globe** (Landmarks, Animals, Explore & discover, Other objects, Vehicles), **Settings** (SFX, BGM, Language, Reset layout, Account, Community/Discord). Sign-in dialog: "Continue with Google", or email magic link ("No password. Email is only used for login and signup counts"), privacy consent link |
| 23 | `desktopB_23_daily.png` | Daily Earth intro | "#3 · Oct 18 (Sun)". Same puzzle for everyone once a day. Tap the globe to choose a place; within 200 km is correct; 6 tries. Wrong guesses give distance + direction arrow, coloured 3,000 km+ / 1,000 km+ / <1,000 km / correct. Hints unlock one by one: continent → 3D model → country → photo → name |

Static pages: `research/screenshots/static/*` cover about (4 languages), privacy, the three indexes, three item pages (en and ko), and the 404 page in both viewports. The mobile layouts are single-column, with sticky header and language links.

---

## 3. Feature & behaviour catalogue (observed + bundle-derived)

1. **Globe**: drag to rotate with inertia; wheel/pinch zoom (readout ×1.0 → ×40); +/− buttons; fullscreen; level-of-detail tiers by zoom (more cities and smaller items appear as you zoom). Political or real-terrain (blue-marble) map styles.
2. **Layers**: landmarks, animals, discoveries ("mysteries"), mini objects, vehicles (ships/planes/trains on routes), plus names, borders/grid and shadows toggles. All are persisted in localStorage.
3. **Info card**: photo, localized name, place, description, fact chips, Wikipedia link, encyclopedia drawer, ♥ like / ✓ visited reactions with counts (Supabase), and collect / ride actions.
4. **Collection**: the Animal dex (collect by zooming close and tapping, sign-in required), Discovery dex (tap to log), stickers earned from dex, games and quiz, and a photo album (IndexedDB `met-photos`).
5. **Ride**: hop onto a ship/plane/train; the camera follows it; exit button.
6. **Games**: a chooser with cards. "Place it!" (find the landmark on a blank globe, 10 rounds, difficulties); Quiz (question sets, levels with 2/3/5 options, 1–4 players pass-and-play, podium); Daily Earth (see 23).
7. **Photo mode**: viewfinder, shutter (flash + sound), album with save, share and delete.
8. **i18n**: 4 UI languages (ko, en, ja, zh); place labels in 20+ languages via an inlined dictionary.
9. **Accounts**: Supabase email OTP or Google OAuth; profile nickname; account deletion RPC; guestbook with reports; signup counter.
10. **Admin**: an in-browser layout editor; edits stream to visitors via realtime (`layout` table).

## 4. Data flows (reference)
1. **Boot**: HTML → CDN libs → s1 (data + builders) → s2 (systems) → fetch dex/enc JSON + textures → Supabase `layout` (paged) → bake models → hide loader → apply hash → tutorial.
2. **Tap item**: raycast → card → (signed-in) `reactions` select/insert; `dex_found` upsert on collect.
3. **Daily**: local seeded pick of a landmark key; state stored in localStorage `daily` (includes the answer key, so it is visible to a curious user). Stats: played, wins, streak, max, distribution.
4. **Sign-in**: `signInWithOtp(email)` → magic link → session in localStorage (supabase-js) → profile fetch → dex sync.

## 5. Edge, error & quality observations
* **No WebGL**: a fallback message is shown (code path in s1).
* **Unknown routes**: proper 404 status, friendly copy, link home.
* **Heavy runtime**: ~15 MB JS. Under software rendering, many clicks timed out (15 s) because the main thread was saturated. One screenshot (`#mi_titanic`) exceeded 150 s. This motivated ADR-001 and ADR-011.
* **Gating**: anonymous users can explore, but collecting, riding and most games show the sign-in dialog (or a regional free pass via `/cdn-cgi/trace`).
* **Accessibility**: icon buttons have text labels; the canvas has no keyboard alternative; modal focus is not trapped.
* **Persistence keys** (observed in `state.json`): `globe-lang`, `hint-open`, `tutorial`, `daily` (+ more from the bundle: `names`, `grid`, `shadows`, `landmarks`, `animals`, `myst`, `minis`, `vehicles`, `sfx`, `bgm`, `mapStyle`, `dex`, `discFound`, `gameStats`, `quizStats`, `stkSort`, `gbnick`).

## 6. Coverage summary
| Area | Desktop | Mobile | Method |
|---|---|---|---|
| Static/SEO pages (15 representative of 2,943) | ✅ | ✅ | crawl + screenshots |
| 404 / invalid slug | ✅ | ✅ | crawl |
| Loader, tutorial, hints | ✅ | ✅ (static) | interactive |
| Globe render, zoom, labels | ✅ | n/a | interactive |
| Menu & all toggles, language | ✅ | n/a | interactive |
| Collection hub, Animal dex | ✅ | n/a | interactive |
| Photo mode & album | ✅ | n/a | interactive |
| Deep links (landmark, animal, discovery) & encyclopedia | ✅ | n/a | interactive |
| Game chooser, Daily intro | ✅ | n/a | interactive |
| Place it!, Quiz rounds | ⚠️ bundle | n/a | sign-in gated → bundle analysis |
| Ride, collecting, reactions, guestbook | ⚠️ bundle | n/a | sign-in gated → bundle analysis |
| Account sign-in dialog | ✅ | n/a | interactive (no credentials) |

Mobile in-app exploration of the reference was not practical: the 15 MB bundle under SwiftShader exceeded timeouts. The mobile layout of **Terrastra** is covered by e2e tests instead.
