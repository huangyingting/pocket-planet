/** Generates crawlable static pages (encyclopedia, about, privacy, 404, sitemap) into dist/. */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANDMARKS, ANIMALS, DISCOVERIES } from '../src/shared/data/catalogue.ts';
import type { CatalogueItem } from '../src/shared/data/types.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, process.argv[2] ?? 'dist');
const SITE = (process.env.BASE_URL ?? 'https://pocket-planet.example').replace(/\/$/, '');
// Path prefix when hosted below the domain root (GitHub Pages project site: "/<repo>/").
const BASE = ('/' + (process.env.BASE_PATH ?? '/') + '/').replace(/\/+/g, '/');
const STATIC = process.env.VITE_STATIC === '1';
const withBase = (html: string) => html.replace(/\b(href|src)="\/(?!\/)/g, `$1="${BASE}`);
if (!existsSync(out)) mkdirSync(out, { recursive: true });

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const SECTIONS = [
  { dir: 'landmarks', title: 'Landmarks', items: LANDMARKS, emoji: '🏛️' },
  { dir: 'animals', title: 'Animals', items: ANIMALS, emoji: '🦁' },
  { dir: 'discover', title: 'Discoveries', items: DISCOVERIES, emoji: '🔍' },
] as const;

const CSS = `body{margin:0;font-family:"Nunito","Segoe UI",system-ui,sans-serif;background:#071224;color:#f2f6ff;line-height:1.6}
a{color:#ffd24a}header,main,footer{max-width:900px;margin:auto;padding:16px 20px}header{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
header .logo{font-size:1.5rem;font-weight:800;text-decoration:none}nav a{margin-right:12px}.cta{display:inline-block;background:#ffd24a;color:#2a1d00;padding:10px 20px;border-radius:999px;font-weight:800;text-decoration:none}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;padding:0;list-style:none}.grid a{display:block;background:#16294a;border-radius:14px;padding:12px;text-decoration:none;color:#f2f6ff}
.hero{font-size:4rem}.facts{display:flex;flex-wrap:wrap;gap:8px;padding:0;list-style:none}.facts li{background:#16294a;border-radius:10px;padding:4px 10px}
.fun{border-left:4px solid #ffd24a;background:#2a2a10;padding:8px 12px;border-radius:8px}footer{color:#9fb0cf;font-size:.9rem}`;

function page(path: string, title: string, desc: string, body: string, jsonld?: object): void {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${SITE}${path}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><link rel="icon" href="/favicon.svg">
<style>${CSS}</style>${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}</head>
<body><header><a class="logo" href="/">🌍 Pocket Planet</a><nav>${SECTIONS.map(s => `<a href="/${s.dir}/">${s.title}</a>`).join('')}<a href="/about/">About</a></nav></header>
<main>${body}</main><footer><p>Pocket Planet — an original 3D toy globe for curious kids. <a href="/privacy/">Privacy</a> · <a href="/about/">About</a></p></footer></body></html>`;
  const file = join(out, path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, withBase(html));
}

const factList = (it: CatalogueItem) => {
  const f = it.facts ?? {};
  const li: string[] = [];
  if (f.built !== undefined) li.push(`Built: ${f.built < 0 ? `${-f.built} BCE` : f.built}`);
  if (f.heightM) li.push(`Height: ${f.heightM.toLocaleString('en')} m`);
  if (f.lengthM) li.push(`Length: ${f.lengthM.toLocaleString('en')} m`);
  if (f.weightKg) li.push(`Weight: ${f.weightKg.toLocaleString('en')} kg`);
  if (f.speedKmh) li.push(`Top speed: ${f.speedKmh} km/h`);
  if (f.lifespanY) li.push(`Lifespan: ${f.lifespanY} years`);
  if (f.depthM) li.push(`Depth: ${f.depthM.toLocaleString('en')} m`);
  if (f.year) li.push(`Year: ${f.year}`);
  if (it.diet) li.push(`Diet: ${it.diet}`);
  if (it.habitat) li.push(`Lives in: ${it.habitat.en}`);
  return li.length ? `<ul class="facts">${li.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
};

const urls: string[] = ['/', '/about/', '/privacy/'];
for (const s of SECTIONS) {
  page(`/${s.dir}/`, `${s.title} — Pocket Planet`, `Explore ${s.items.length} ${s.title.toLowerCase()} on a friendly 3D globe for kids.`,
    `<h1>${s.emoji} ${s.title}</h1><p>${s.items.length} entries. Tap any card to read more, then open it on the 3D globe.</p>
<ul class="grid">${s.items.map(it => `<li><a href="/${s.dir}/${it.slug}/"><span aria-hidden="true">${it.emoji}</span> ${esc(it.name.en)}</a></li>`).join('')}</ul>`);
  urls.push(`/${s.dir}/`);
  for (const it of s.items) {
    const path = `/${s.dir}/${it.slug}/`;
    urls.push(path);
    const alt = [it.name.ko, it.name.ja, it.name.zh].filter(Boolean).join(' · ');
    page(path, `${it.name.en} — Pocket Planet`, it.desc.en,
      `<p><a href="/${s.dir}/">← ${s.title}</a></p><div class="hero" aria-hidden="true">${it.emoji}</div><h1>${esc(it.name.en)}</h1>
<p lang="mul">${esc(alt)}</p><p>${esc(it.desc.en)}</p>${it.desc.ko ? `<p lang="ko">${esc(it.desc.ko)}</p>` : ''}${factList(it)}
${it.funFact ? `<p class="fun">💡 ${esc(it.funFact.en)}</p>` : ''}<p><a class="cta" href="/#${it.key}">🌍 See it on the globe</a></p>
<p>Location: ${it.lat.toFixed(2)}°, ${it.lon.toFixed(2)}°</p>`,
      { '@context': 'https://schema.org', '@type': it.type === 'landmark' ? 'LandmarksOrHistoricalBuildings' : 'Thing', name: it.name.en, description: it.desc.en,
        ...(it.type === 'landmark' ? { geo: { '@type': 'GeoCoordinates', latitude: it.lat, longitude: it.lon } } : {}) });
  }
}

page('/about/', 'About — Pocket Planet', 'What Pocket Planet is and how to use it.', `<h1>About Pocket Planet</h1>
<p>Pocket Planet is a free 3D toy globe for curious kids and the grown-ups who explore with them. Spin the Earth, zoom in to find
landmarks, animals, ships, planes and trains, collect animals in your dex, take photos and play three map games: a daily mystery place,
<em>Place it!</em> and a multiple-choice quiz for up to four players.</p>${STATIC
  ? '<p>This edition runs entirely in your browser: your collection, photos and game records stay on this device.</p>'
  : '<p>Everything works without an account. Signing in with an email link simply keeps your collection in sync across devices.</p>'}<p><a class="cta" href="/">Open the globe</a></p>`);
page('/privacy/', 'Privacy — Pocket Planet', 'How Pocket Planet handles data.', `<h1>Privacy</h1>
<ul><li>Progress, settings and photos are stored on your device (localStorage and IndexedDB). Photos never leave your device.</li>
${STATIC ? '<li>This edition has no server: there are no accounts, cookies or uploads. Clearing site data removes everything.</li>' : `<li>If you choose to sign in, we store your email address, an optional nickname and a copy of your progress so it can sync.</li>
<li>Likes and “I’ve been here” use an anonymous random cookie so each device counts once.</li>
<li>Guestbook messages are public, limited to 200 characters, filtered for links and unkind words, and hidden after reports.</li>
<li>You can delete your account and server data any time from the Account panel.</li>`}<li>No ads, no third-party trackers.</li></ul>`);
page('/404/', 'Not found — Pocket Planet', 'Page not found.', `<h1>🧭 Lost at sea?</h1><p>We couldn’t find that page.</p><p><a class="cta" href="/">Back to the globe</a></p>`);
writeFileSync(join(out, '404.html'), (await import('node:fs')).readFileSync(join(out, '404', 'index.html'), 'utf8'));

writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\n${STATIC ? '' : 'Disallow: /api/\n'}Sitemap: ${SITE}/sitemap.xml\n`);
console.log(`build-pages: wrote ${urls.length} URLs to ${out}`);
