# Research: reference product exploration

These are artifacts from exploring [myearthtoy.com](https://myearthtoy.com/) anonymously with Playwright. They are analysed in [`docs/research/exploration-report.md`](../docs/research/exploration-report.md). Nothing here is used by the Terrastra build.

```
research/
├── scripts/       Playwright exploration scripts (run from this folder; they write to data/ and screenshots/)
│   ├── crawl-static.mjs          static/SEO page crawl, 2 viewports      → data/static_pages.json, screenshots/static/
│   ├── probe-app-load.mjs        globe load sequence + network + storage → data/net_home.json, data/state.json
│   ├── explore-app.mjs [desktop|mobile]  interactive UI walk-through     → data/explore_<vp>.json, screenshots/app/
│   └── webgl-check-*.mjs         SwiftShader/ANGLE flag probes for headless WebGL
├── data/          captured observations (JSON logs incl. reference page text, URL list, run log)
├── screenshots/   static/ (30 page shots) and app/ (load sequence + UI states)
└── raw/           HTML dumps, sitemap and JS bundles
```

`data/`, `screenshots/` and `raw/` contain third-party content, so they are **git-ignored** and exist only on the machine that ran the scripts. Re-run the scripts to regenerate them.

Run them from the repo root (Playwright comes from the root dev dependencies):
```bash
npm run research:crawl
xvfb-run -a -s "-screen 0 1920x1080x24" npm run research:explore -- desktop   # WebGL needs a display
```
