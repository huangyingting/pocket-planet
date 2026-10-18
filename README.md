# Pocket Planet

An original 3D toy globe for curious kids. Spin the Earth, tap landmarks, animals and discoveries, and collect them in a dex. You can also ride ships, planes and trains, take photos, and play three geography games: Place it!, Quiz and Daily Planet.

Product, architecture and planning docs are in [`docs/`](docs/README.md). Research on the reference product is in [`research/`](research/README.md).

## Stack
* **Client**: TypeScript, Vite, three.js. All 3D models are procedural, built from primitives in `src/client/models/kit.ts`. The country map is painted at runtime from Natural Earth TopoJSON.
* **Server**: Node 24 (native TS execution), Express 5 and the built-in `node:sqlite`. It provides magic-link auth, progress sync, reactions and the guestbook, and also serves the built SPA and the static encyclopedia pages.
* **Tests**: Vitest for logic and the API; Playwright for desktop and mobile e2e.

## Quick start
```bash
nvm use                # Node 24 (.nvmrc)
npm install
cp .env.example .env   # optional; loaded by npm start / dev:server
npm run build          # typecheck + vite build + static encyclopedia pages → dist/
npm start              # http://localhost:8787  (serves dist/ + /api)
```

Development with hot reload uses two terminals:
```bash
npm run dev:server     # API on :8787 (watch mode)
npm run dev            # Vite on :5173, proxies /api → :8787
```

The game works fully without an account; progress is stored in `localStorage` and IndexedDB. Signing in only adds cloud sync, a nickname and the guestbook. Outside production, requesting a magic link returns `devLink`, and the account panel shows it as a clickable "dev sign-in" link.

## URL flags
| Flag | Effect |
|---|---|
| `?lowfx=1` | low-power rendering (DPR 1, no antialiasing, 2048 px map texture); also on when `prefers-reduced-motion` is set (`lowfx=0` overrides) |
| `?notut` | skip the first-visit tutorial |
| `#<key>` | deep link to an item, e.g. `/#eiffel`, `/#an_lion` |
| `#daily` | open Daily Planet |

## Environment variables (server)
Set these in `.env` (template: [`.env.example`](.env.example)) or export them.

| Var | Default | Meaning |
|---|---|---|
| `PORT` | `8787` | HTTP port |
| `DB_PATH` | `data/pocket-planet.db` | SQLite file |
| `NODE_ENV` | — | `production` enables secure cookies and disables dev login |
| `DEV_LOGIN` | — | `1` returns magic links in the API response, even in production (testing only!) |
| `BASE_URL` | `http://localhost:$PORT` | origin used in magic links and the CSRF origin check |
| `INSECURE_COOKIES` | — | `1` drops the `Secure` cookie flag in production (plain-HTTP staging) |

## Tests
```bash
npm run typecheck
npm test                                           # 38 unit + API tests
npx playwright install chromium                    # first time only
xvfb-run -a -s "-screen 0 1920x1080x24" npm run test:e2e   # 13 scenarios, desktop + mobile
```
The e2e config builds nothing. It starts `node src/server/index.ts` on port 8790 with a temporary DB and `DEV_LOGIN=1`, so run `npm run build` first. On machines without a GPU, Chromium uses SwiftShader. The tests pass `?lowfx=1`, and a full run takes about 3 minutes. Screenshots are written to [`docs/assets/screenshots/`](docs/assets/screenshots/). `npm run test:all` runs typecheck, unit tests, build and e2e in sequence.

## Project layout
```
.
├── src/
│   ├── client/                 browser app (Vite entry: index.html → src/client/main.ts)
│   │   ├── main.ts             boot: globe, labels, shell, hash routing, tutorial
│   │   ├── store.ts            progress + settings + session state, debounced sync
│   │   ├── styles.css
│   │   ├── globe/              scene.ts (three.js globe, controls, picking, LOD, rides), painter.ts (map texture)
│   │   ├── models/kit.ts       procedural low-poly model builders
│   │   ├── ui/                 shell (top bar, menu, info card), collection, photo, games, account, tutorial, dom helpers
│   │   └── lib/                api client, i18n (en/ko full, ja/zh partial), storage, sfx
│   ├── server/                 index.ts (env/boot), app.ts (Express routes), db.ts (SQLite schema)
│   └── shared/                 pure TS used by client, server and build script (no DOM)
│       ├── data/               catalogue (landmarks/animals/discoveries/vehicles), cities, ISO names, types
│       ├── games/              placeit.ts, quiz.ts, daily.ts
│       └── lib/                geo, rng, progress (merge), stickers
├── public/                     static assets copied as-is (favicon, Natural Earth TopoJSON)
├── scripts/build-pages.ts      static /landmarks, /animals, /discover pages + sitemap.xml, robots.txt, 404.html
├── tests/
│   ├── unit/                   Vitest: game logic, i18n, catalogue, API (logic.test.ts, server.test.ts)
│   └── e2e/                    Playwright specs + helpers
├── docs/                       product, architecture, planning, research report, screenshots
├── research/                   reference-site exploration scripts, data and screenshots (raw/ is git-ignored)
├── index.html                  SPA shell
└── package.json · tsconfig.json (client) · tsconfig.server.json (server, shared, scripts, tests) · vite/vitest/playwright configs
```
Import rule: `client` and `server` may import from `shared`; `shared` imports nothing outside itself.

## Deployment
### GitHub Pages (static edition)
[`.github/workflows/pages.yml`](.github/workflows/pages.yml) runs typecheck and unit tests on every push and PR. On `main` it also builds and deploys to GitHub Pages (repo **Settings → Pages → Source: GitHub Actions**). The Pages build sets:

| Build var | Value on Pages | Effect |
|---|---|---|
| `VITE_STATIC` | `1` | backend-less edition: no `/api` calls; account, sync and guestbook are hidden, and likes stay on the device; about/privacy copy adjusted |
| `BASE_PATH` | `/<repo>/` | Vite `base` + prefix for every link in the static encyclopedia pages |
| `BASE_URL` | `https://<owner>.github.io/<repo>` | canonical URLs and sitemap |

To try it locally:
```bash
VITE_STATIC=1 BASE_PATH=/pocket-planet/ npm run build
mkdir -p /tmp/site && ln -sfn "$PWD/dist" /tmp/site/pocket-planet && python3 -m http.server -d /tmp/site 8080
# → http://localhost:8080/pocket-planet/
```

### Full edition (Node server)
`npm run build && npm start` serves the SPA, the static pages and the API from one process.

## Production notes
* **Mail**: `createApp({ sendMail })` is the hook for delivering magic links. `src/server/index.ts` only logs the link (with a masked email) in development and is a no-op in production (backlog B-12), so production sign-in needs an SMTP or provider implementation.
* Put the server behind TLS and keep `NODE_ENV=production`. Back up the SQLite file (B-16). Add a CSP header (B-13).
* Cookies: the session cookie is `httpOnly` and `SameSite=Lax`; the visitor cookie is used only for anonymous reactions.
