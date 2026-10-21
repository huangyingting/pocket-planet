/**
 * Optional offline use (F07). Reads Vite's manifest and writes, into dist/:
 *  - offline.json: the app shell and the optional packs (Solar System & deep space, sky theatre, 3D models), with sizes
 *  - sw.js: a versioned service worker that precaches only the shell; packs are saved on request from the menu
 *  - manifest.webmanifest: so the app can be installed
 * Nothing is downloaded until a user turns offline use on.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, process.argv[2] ?? 'dist');
const BASE = ('/' + (process.env.BASE_PATH ?? '/') + '/').replace(/\/+/g, '/');

interface Chunk { file: string; imports?: string[]; dynamicImports?: string[]; css?: string[]; assets?: string[] }
const man = JSON.parse(readFileSync(join(dist, '.vite/manifest.json'), 'utf8')) as Record<string, Chunk>;
const text = (f: string) => readFileSync(join(dist, f), 'utf8');
const size = (f: string) => statSync(join(dist, f)).size;

/** Static imports of an emitted JS file that the manifest does not describe (worker graphs): `from"./x.js"`, `import"./x.js"`. */
function fileClosure(file: string, out: Set<string>, dynamic = false): void {
  if (out.has(file) || !file.endsWith('.js')) { out.add(file); return; }
  out.add(file);
  const src = text(file), dir = file.slice(0, file.lastIndexOf('/') + 1);
  const re = dynamic ? /(?:from|import)\s*\(?\s*["'`]\.\/([\w.-]+\.js)["'`]/g : /(?:from|import)\s*["'`]\.\/([\w.-]+\.js)["'`]/g;
  for (const m of src.matchAll(re)) fileClosure(dir + m[1], out, dynamic);
}

/** A manifest entry with everything it needs at load time (and, with `dynamic`, everything it may load later). */
function closure(keys: string[], dynamic = false, out = new Set<string>(), seen = new Set<string>()): Set<string> {
  for (const k of keys) {
    if (seen.has(k)) continue;
    seen.add(k);
    const c = man[k];
    if (!c) throw new Error('build-offline: no manifest entry ' + k);
    out.add(c.file);
    c.css?.forEach(f => out.add(f));
    // workers are emitted as assets; follow their own imports
    c.assets?.forEach(f => fileClosure(f, out, dynamic));
    closure(c.imports ?? [], dynamic, out, seen);
    if (dynamic) closure(c.dynamicImports ?? [], dynamic, out, seen);
  }
  return out;
}

const key = (path: string) => Object.keys(man).find(k => k === path) ?? (() => { throw new Error('build-offline: missing ' + path); })();
// The Earth and the small tools you can use without the internet. Radio, the Wikipedia reader and accounts are left out.
const shell = closure([key('index.html'),
  ...['src/shared/data/greetings.ts', 'src/shared/data/plates.ts', 'src/client/ui/photo.ts', 'src/client/ui/bookmarks.ts', 'src/client/ui/tours.ts',
    'src/client/ui/collection.ts', 'src/client/ui/passport.ts', 'src/client/ui/games.ts', 'src/client/ui/backup.ts'].map(key)]);
for (const f of ['', 'offline.json', 'manifest.webmanifest', 'favicon.svg', 'icon-192.png', 'icon-512.png', 'data/countries-110m.json',
  ...readdirSync(join(dist, 'fonts')).filter(f => f.endsWith('.woff2')).map(f => 'fonts/' + f)]) shell.add(f);

const minus = (s: Set<string>) => [...s].filter(f => !shell.has(f)).sort();
const heroes = Object.keys(man).filter(k => k.startsWith('src/client/models/heroes/'));
const modelWorker = [...shell].find(f => /build\.worker-/.test(f));
const workerHeroes = new Set<string>();
if (modelWorker) fileClosure(modelWorker, workerHeroes, true);
const packs = {
  space: minus(closure([key('src/client/solar/ui.ts'), key('src/client/solar/space-index.ts')])),
  sky: minus(closure([key('src/client/sky/index.ts')])),
  models: minus(new Set([...closure([...heroes, key('src/client/models/kit.ts')]), ...workerHeroes])),
};

writeFileSync(join(dist, 'manifest.webmanifest'), JSON.stringify({
  name: 'Pocket Planet', short_name: 'Pocket Planet', start_url: BASE, scope: BASE, display: 'standalone',
  background_color: '#05070d', theme_color: '#09090b',
  description: 'A 3D toy globe, Solar System and night sky for curious kids.',
  icons: [
    { src: BASE + 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: BASE + 'icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: BASE + 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
  ],
}));

const files = [...shell].filter(f => f && f !== 'offline.json' && existsSync(join(dist, f)));
const missing = [...shell].filter(f => f && f !== 'offline.json' && !existsSync(join(dist, f)));
if (missing.length) throw new Error('build-offline: shell files missing from dist: ' + missing.join(', '));
const hash = createHash('sha1');
for (const f of [...files, ...Object.values(packs).flat()].sort()) hash.update(f).update(readFileSync(join(dist, f)));
const version = hash.digest('hex').slice(0, 10);
const bytes = (l: string[]) => l.reduce((a, f) => a + (f ? size(f) : 0), 0);

writeFileSync(join(dist, 'offline.json'), JSON.stringify({
  version,
  shell: { files: [...shell].sort(), bytes: bytes(files) },
  packs: Object.fromEntries(Object.entries(packs).map(([id, l]) => [id, { files: l, bytes: bytes(l) }])),
}));

const sw = `/* Pocket Planet offline worker ${version}: generated by scripts/build-offline.ts */
const V = ${JSON.stringify(version)}, BASE = ${JSON.stringify(BASE)};
const SHELL = ${JSON.stringify([...shell].sort().map(f => BASE + f))};
const SHELL_C = 'pp-shell-' + V, RUN_C = 'pp-run-' + V;
self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL_C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
let off = false;
self.addEventListener('message', e => { if (e.data === 'off') off = true; });
self.addEventListener('activate', e => {
  // a new build replaces every older cache (shell, saved packs and things picked up while browsing)
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('pp-') && !k.endsWith('-' + V)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const fromCache = r => caches.match(r, { ignoreSearch: true });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin || !u.pathname.startsWith(BASE)) return;
  const p = u.pathname.slice(BASE.length);
  // live content always needs the network
  if (p.startsWith('api/') || p.startsWith('data/radio/')) return;
  if (r.mode === 'navigate') {
    if (p === '' || p === 'index.html') e.respondWith(fetch(r).catch(() => caches.match(BASE)));
    return;
  }
  if (p === 'offline.json' || p === 'manifest.webmanifest') { e.respondWith(fetch(r).catch(() => fromCache(r))); return; }
  if (/^(assets|fonts|data)\\//.test(p) || p.endsWith('.svg') || p.endsWith('.png')) {
    e.respondWith(fromCache(r).then(hit => hit || fetch(r).then(res => {
      // hashed files never change: keep what this visit loaded so the same scenes open offline later
      // (but not after offline use was turned off: this worker keeps the open page until it reloads)
      if (res.ok && !off && p.startsWith('assets/')) { const copy = res.clone(); caches.open(RUN_C).then(c => c.put(r, copy)); }
      return res;
    })));
  }
});
`;
writeFileSync(join(dist, 'sw.js'), sw);
const mb = (n: number) => (n / 1e6).toFixed(1) + ' MB';
console.log(`build-offline: ${version} shell ${mb(bytes(files))}, ` + Object.entries(packs).map(([id, l]) => `${id} ${mb(bytes(l))}`).join(', '));
