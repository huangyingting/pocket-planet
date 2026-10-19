/** Generates crawlable static pages (encyclopedia, about, privacy, 404, sitemap) into dist/. */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BY_TYPE, CATALOGUE } from '../src/shared/data/catalogue.ts';
import { CONTINENT_NAMES } from '../src/shared/data/iso.ts';
import { WIKI } from '../src/shared/data/wiki.ts';
import { haversineKm } from '../src/shared/lib/geo.ts';
import { TYPE_META, TYPE_ORDER } from '../src/shared/data/typemeta.ts';
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
type Bi = { en: string; zh?: string };
/** Both languages live in the DOM (crawlable); CSS shows the one picked in the app (shared `pp.lang` key). */
const bi = (t: Bi, tag = 'span', cls = '') =>
  `<${tag} class="en${cls ? ' ' + cls : ''}">${esc(t.en)}</${tag}>` + (t.zh ? `<${tag} class="zh${cls ? ' ' + cls : ''}" lang="zh-CN">${esc(t.zh)}</${tag}>` : '');
const T = (en: string, zh: string): Bi => ({ en, zh });

const SECTIONS = TYPE_ORDER.filter(ty => TYPE_META[ty].section && BY_TYPE[ty].length)
  .map(ty => ({ ty, dir: TYPE_META[ty].section, title: TYPE_META[ty].many, one: TYPE_META[ty].one, hint: TYPE_META[ty].hint, items: BY_TYPE[ty], emoji: TYPE_META[ty].emoji, color: TYPE_META[ty].color }));
const SECTION_OF = new Map(SECTIONS.flatMap(s => s.items.map(it => [it.key, s] as const)));

const regions = { en: new Intl.DisplayNames(['en'], { type: 'region' }), zh: new Intl.DisplayNames(['zh-Hans'], { type: 'region' }) };
const country = (a2?: string): Bi | null => {
  if (!a2) return null;
  if (a2 === 'XK') return T('Kosovo', '科索沃');
  try { return { en: regions.en.of(a2) ?? a2, zh: regions.zh.of(a2) ?? a2 }; } catch { return { en: a2 }; }
};
const where = (it: CatalogueItem): Bi => {
  const c = country(it.country), k = CONTINENT_NAMES[it.continent];
  return { en: [c?.en, k?.en].filter(Boolean).join(' · '), zh: [c?.zh, k?.zh].filter(Boolean).join(' · ') };
};
const coord = (la: number, lo: number) => `${Math.abs(la).toFixed(2)}°${la >= 0 ? 'N' : 'S'}, ${Math.abs(lo).toFixed(2)}°${lo >= 0 ? 'E' : 'W'}`;
const wikiUrl = (l: 'en' | 'zh', title: string) => `https://${l}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}${l === 'zh' ? '?variant=zh-cn' : ''}`;

const FONT = (f: string, file: string) => `@font-face{font-family:"${f}";src:url("/fonts/${file}") format("woff2");font-weight:100 900;font-display:swap}`;
const CSS = `${FONT('Geist', 'geist.woff2')}${FONT('Geist Mono', 'geist-mono.woff2')}
:root{--bg:#09090b;--panel:#111114;--panel2:rgba(255,255,255,.045);--hover:rgba(255,255,255,.08);--line:rgba(255,255,255,.08);--text:#fafafa;--text-2:#d4d4d8;--muted:#a1a1aa;--faint:#71717a;--accent:#7dd3fc;--amber:#fbbf24;
--font:"Geist","PingFang SC","Hiragino Sans","Noto Sans CJK SC","Microsoft YaHei",system-ui,-apple-system,"Segoe UI",sans-serif;--mono:"Geist Mono",ui-monospace,SFMono-Regular,Menlo,monospace}
*{box-sizing:border-box}html{color-scheme:dark}body{margin:0;font:15px/1.65 var(--font);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}
body::before{content:"";position:fixed;inset:0;z-index:-1;background:radial-gradient(900px 500px at 85% -10%,rgba(56,189,248,.12),transparent 70%),radial-gradient(700px 420px at -10% 0%,rgba(129,140,248,.08),transparent 70%)}
a{color:inherit}html[data-l=zh] .en,html:not([data-l=zh]) .zh{display:none!important}
.wrap{max-width:1120px;margin:0 auto;padding:0 24px}
.top{position:sticky;top:0;z-index:5;background:rgba(9,9,11,.78);backdrop-filter:blur(16px) saturate(140%);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;gap:18px;height:60px}
.brand{display:flex;align-items:center;gap:10px;font-weight:600;letter-spacing:-.02em;text-decoration:none;white-space:nowrap}
.mark{width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 34% 30%,#e0f2fe 0 8%,#38bdf8 30%,#0c4a6e 78%);box-shadow:0 0 0 1px rgba(255,255,255,.18) inset,0 0 18px rgba(56,189,248,.35)}
.top nav{flex:1;display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;mask-image:linear-gradient(90deg,#000 92%,transparent)}
.top nav a{padding:6px 10px;border-radius:8px;color:var(--muted);text-decoration:none;font-size:.84rem;white-space:nowrap}
.top nav a:hover{color:var(--text);background:var(--panel2)}.top nav a[aria-current]{color:var(--text);background:var(--hover)}
.lang{display:inline-flex;padding:2px;gap:2px;background:var(--panel2);border:1px solid var(--line);border-radius:9px}
.lang button{background:none;border:0;color:var(--muted);font:500 .76rem var(--font);padding:4px 10px;border-radius:7px;cursor:pointer}
html:not([data-l=zh]) .lang [data-set=en],html[data-l=zh] .lang [data-set=zh]{background:rgba(255,255,255,.1);color:var(--text)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--text);color:#09090b;font-weight:600;font-size:.88rem;padding:9px 16px;border-radius:10px;text-decoration:none;white-space:nowrap}
.btn:hover{background:#e4e4e7}.btn.ghost{background:var(--panel2);color:var(--text);border:1px solid var(--line)}.btn.ghost:hover{background:var(--hover)}
main{padding:40px 0 64px}
.eyebrow{margin:0 0 8px;color:var(--accent);font:500 .74rem var(--mono);letter-spacing:.08em;text-transform:uppercase}
h1{margin:0;font-size:clamp(2rem,4vw,3rem);line-height:1.08;font-weight:600;letter-spacing:-.035em}
h2{font-size:1.15rem;font-weight:600;letter-spacing:-.02em;margin:36px 0 12px}
.sub{color:var(--muted);font-size:1.02rem;max-width:62ch;margin:12px 0 0}
.crumbs{display:flex;gap:8px;align-items:center;color:var(--faint);font-size:.82rem;margin-bottom:22px}.crumbs a{color:var(--muted);text-decoration:none}.crumbs a:hover{color:var(--text)}
.search{margin:26px 0 18px;display:flex;align-items:center;gap:10px;max-width:420px;background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:0 14px}
.search input{flex:1;background:none;border:0;outline:0;color:var(--text);font:inherit;padding:11px 0}.search:focus-within{border-color:rgba(125,211,252,.4)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;padding:0;margin:0;list-style:none}
.card{display:flex;gap:14px;align-items:center;padding:14px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.02);text-decoration:none;transition:background .15s,border-color .15s;height:100%}
.card:hover{background:var(--panel2);border-color:rgba(255,255,255,.16)}
.tile{flex:none;display:grid;place-items:center;width:46px;height:46px;border-radius:12px;font-size:1.5rem;background:radial-gradient(circle at 50% 30%,color-mix(in srgb,var(--c) 26%,transparent),transparent 75%),#141418;border:1px solid var(--line)}
.card b{display:block;font-weight:500;font-size:.94rem;line-height:1.3}.card small{display:block;color:var(--faint);font-size:.78rem;margin-top:2px}
.hub .card{align-items:flex-start;padding:18px}.hub .card b{font-size:1.02rem}.count{font-family:var(--mono);color:var(--faint);font-size:.74rem}
.item{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:48px;align-items:start}
.hero{display:grid;place-items:center;height:240px;border-radius:20px;font-size:6.5rem;margin-bottom:28px;border:1px solid var(--line);background:radial-gradient(60% 80% at 50% 70%,color-mix(in srgb,var(--c) 24%,transparent),transparent 75%),linear-gradient(#141418,#0d0d10)}
.chip{display:inline-flex;align-items:center;gap:6px;font-size:.74rem;font-weight:500;color:var(--c);padding:2px 9px;border:1px solid var(--line);border-radius:7px;background:var(--panel2)}.chip::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.meta{display:flex;flex-wrap:wrap;gap:10px;align-items:center;color:var(--muted);font-size:.86rem;margin:0 0 10px}
.alt{color:var(--faint);margin:6px 0 0}.lead{font-size:1.1rem;line-height:1.75;color:var(--text-2);margin:22px 0 0;max-width:68ch}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden;margin:28px 0 0}
.stats div{background:var(--bg);padding:14px 16px}.stats dt{color:var(--faint);font-size:.76rem}.stats dd{margin:2px 0 0;font-weight:600;font-size:1.02rem;font-variant-numeric:tabular-nums}
.fun{margin:28px 0 0;padding:16px 18px;border-radius:14px;border:1px solid rgba(125,211,252,.18);background:rgba(125,211,252,.05);color:var(--text-2)}.fun b{display:block;color:var(--accent);font-size:.78rem;font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
.links{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
.side{position:sticky;top:84px;display:flex;flex-direction:column;gap:12px}
.panel{border:1px solid var(--line);border-radius:16px;background:rgba(17,17,20,.7);padding:18px}
.panel h3{margin:0 0 10px;font:500 .72rem var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
.panel .btn{width:100%}.mono{font-family:var(--mono);font-size:.86rem;color:var(--text-2)}
.near{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}.near a{display:flex;gap:10px;align-items:center;padding:7px 8px;margin:0 -8px;border-radius:9px;text-decoration:none;font-size:.88rem}.near a:hover{background:var(--panel2)}
.near i{margin-left:auto;font-style:normal;font-family:var(--mono);font-size:.72rem;color:var(--faint)}
.pager{display:flex;justify-content:space-between;gap:10px;margin-top:40px;padding-top:20px;border-top:1px solid var(--line)}.pager a{color:var(--muted);text-decoration:none;font-size:.88rem}.pager a:hover{color:var(--text)}
.prose{max-width:68ch}.prose p,.prose li{color:var(--text-2)}.prose ul{padding-left:1.2em}.prose li{margin:6px 0}
.empty{display:none;color:var(--muted);padding:20px 0}
footer{border-top:1px solid var(--line);color:var(--faint);font-size:.82rem}footer .wrap{display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;padding-top:22px;padding-bottom:28px}footer a{color:var(--muted);text-decoration:none;margin-left:14px}footer a:hover{color:var(--text)}
@media (max-width:860px){.item{grid-template-columns:1fr;gap:28px}.side{position:static}.top nav{display:none}.hero{height:180px;font-size:5rem}main{padding-top:28px}}
@media (max-width:520px){.wrap{padding:0 16px}.top .btn{display:none}}`;

const LANG_JS = `(function(){var d=document.documentElement,k='pp.lang',l;try{l=JSON.parse(localStorage.getItem(k))}catch(e){}if(l!=='en'&&l!=='zh')l=(navigator.language||'').slice(0,2)==='zh'?'zh':'en';d.dataset.l=l;
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-set]');if(!b)return;d.dataset.l=b.dataset.set;try{localStorage.setItem(k,JSON.stringify(b.dataset.set))}catch(e){}});})();`;
const FILTER_JS = `(function(){var q=document.getElementById('q');if(!q)return;var cs=[].slice.call(document.querySelectorAll('[data-q]')),em=document.querySelector('.empty');
q.addEventListener('input',function(){var v=q.value.trim().toLowerCase(),n=0;cs.forEach(function(c){var on=!v||c.dataset.q.indexOf(v)>=0;c.hidden=!on;n+=on?1:0});em.style.display=n?'none':'block'})})();`;

function page(path: string, title: string, desc: string, body: string, opts: { jsonld?: object; current?: string; script?: string } = {}): void {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${SITE}${path}"><meta name="theme-color" content="#09090b">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><link rel="icon" href="/favicon.svg">
<link rel="preload" href="/fonts/geist.woff2" as="font" type="font/woff2" crossorigin><script>${LANG_JS}</script>
<style>${CSS}</style>${opts.jsonld ? `<script type="application/ld+json">${JSON.stringify(opts.jsonld).replace(/</g, '\\u003c')}</script>` : ''}</head>
<body><header class="top"><div class="wrap"><a class="brand" href="/"><span class="mark" aria-hidden="true"></span>Pocket Planet</a>
<nav aria-label="Encyclopedia"><a href="/encyclopedia/"${opts.current === 'hub' ? ' aria-current="page"' : ''}>${bi(T('All', '全部'))}</a>${SECTIONS.map(s => `<a href="/${s.dir}/"${opts.current === s.dir ? ' aria-current="page"' : ''}>${bi(s.title)}</a>`).join('')}</nav>
<div class="lang" role="group" aria-label="Language"><button data-set="en">EN</button><button data-set="zh">中文</button></div>
<a class="btn" href="/">${bi(T('Open globe', '打开地球'))}</a></div></header>
<main><div class="wrap">${body}</div></main>
<footer><div class="wrap"><span>${bi(T('Pocket Planet — an original 3D toy globe for curious kids.', '口袋星球——为好奇的孩子打造的原创 3D 地球玩具。'))}</span>
<span><a href="/encyclopedia/">${bi(T('Encyclopedia', '百科'))}</a><a href="/about/">${bi(T('About', '关于'))}</a><a href="/privacy/">${bi(T('Privacy', '隐私'))}</a></span></div></footer>
${opts.script ? `<script>${opts.script}</script>` : ''}</body></html>`;
  const file = join(out, path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, withBase(html));
}

const num = (n: number) => n.toLocaleString('en');
const era = (y: number): Bi => y < 0 ? T(`${num(-y)} BCE`, `公元前 ${num(-y)} 年`) : T(String(y), `${y} 年`);
const DIET: Record<string, Bi> = { carnivore: T('Meat-eater', '吃肉'), herbivore: T('Plant-eater', '吃植物'), omnivore: T('Eats everything', '什么都吃') };
function stats(it: CatalogueItem): string {
  const f = it.facts ?? {};
  const row: [Bi, Bi][] = [];
  if (f.built !== undefined) row.push([T('Built', '建成'), era(f.built)]);
  if (f.year !== undefined) row.push([T('Year', '年份'), era(f.year)]);
  if (f.born !== undefined) row.push([T('Born', '出生'), era(f.born)]);
  if (f.died !== undefined) row.push([T('Died', '逝世'), era(f.died)]);
  if (f.mya !== undefined) row.push([T('Lived', '生活年代'), T(`${num(f.mya)} million years ago`, `${num(f.mya * 100)} 万年前`)]);
  if (f.heightM) row.push([T('Height', '高度'), T(`${num(f.heightM)} m`, `${num(f.heightM)} 米`)]);
  if (f.lengthM) row.push([T('Length', '长度'), f.lengthM >= 10000 ? T(`${num(Math.round(f.lengthM / 1000))} km`, `${num(Math.round(f.lengthM / 1000))} 千米`) : T(`${num(f.lengthM)} m`, `${num(f.lengthM)} 米`)]);
  if (f.depthM) row.push([T('Depth', '深度'), T(`${num(f.depthM)} m`, `${num(f.depthM)} 米`)]);
  if (f.weightKg) row.push([T('Weight', '重量'), f.weightKg >= 1000 ? T(`${num(Math.round(f.weightKg / 100) / 10)} t`, `${num(Math.round(f.weightKg / 100) / 10)} 吨`) : T(`${num(f.weightKg)} kg`, `${num(f.weightKg)} 千克`)]);
  if (f.speedKmh) row.push([T('Top speed', '最高速度'), T(`${num(f.speedKmh)} km/h`, `${num(f.speedKmh)} 千米/时`)]);
  if (f.lifespanY) row.push([T('Lifespan', '寿命'), T(`${num(f.lifespanY)} years`, `${num(f.lifespanY)} 年`)]);
  if (it.diet) row.push([T('Diet', '食性'), DIET[it.diet] ?? T(it.diet, it.diet)]);
  if (it.habitat) row.push([T('Lives in', '栖息地'), it.habitat]);
  return row.length ? `<dl class="stats">${row.map(([k, v]) => `<div><dt>${bi(k)}</dt><dd>${bi(v)}</dd></div>`).join('')}</dl>` : '';
}

const searchKey = (it: CatalogueItem) => esc([it.name.en, it.name.zh, where(it).en, where(it).zh].filter(Boolean).join(' ').toLowerCase());
const card = (it: CatalogueItem, dir: string, color: string) => `<li data-q="${searchKey(it)}"><a class="card" href="/${dir}/${it.slug}/" style="--c:${color}">
<span class="tile" aria-hidden="true">${it.emoji}</span><span><b>${bi(it.name)}</b><small>${bi(where(it))}</small></span></a></li>`;

const urls: string[] = ['/', '/encyclopedia/', '/about/', '/privacy/'];
const total = SECTIONS.reduce((n, s) => n + s.items.length, 0);
page('/encyclopedia/', 'Encyclopedia — Pocket Planet', `Explore ${total} places, animals and wonders on a friendly 3D globe for kids.`,
  `<p class="eyebrow">${bi(T('Encyclopedia', '百科'))}</p><h1>${bi(T('Explore the planet', '探索地球'))}</h1>
<p class="sub">${bi(T(`${total} places, animals and wonders — each one has a 3D model waiting on the globe.`, `${total} 个地点、动物和奇观——每一个都在地球上有一个 3D 模型等你发现。`))}</p>
<h2>${bi(T('Sections', '分类'))}</h2><ul class="cards hub">${SECTIONS.map(s => `<li><a class="card" href="/${s.dir}/" style="--c:${s.color}"><span class="tile" aria-hidden="true">${s.emoji}</span>
<span><b>${bi(s.title)}</b><small>${bi(s.hint)}</small><small class="count">${s.items.length}</small></span></a></li>`).join('')}</ul>`, { current: 'hub' });

for (const s of SECTIONS) {
  page(`/${s.dir}/`, `${s.title.en} — Pocket Planet`, `Explore ${s.items.length} ${s.title.en.toLowerCase()} on a friendly 3D globe for kids.`,
    `<nav class="crumbs"><a href="/encyclopedia/">${bi(T('Encyclopedia', '百科'))}</a><span>/</span></nav>
<p class="eyebrow">${s.items.length} ${bi(T('entries', '个条目'))}</p><h1>${bi(s.title)}</h1><p class="sub">${bi(s.hint)}</p>
<label class="search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg><input id="q" type="search" placeholder="Search · 搜索" aria-label="Search"></label>
<ul class="cards">${s.items.map(it => card(it, s.dir, s.color)).join('')}</ul><p class="empty">${bi(T('Nothing found', '没有找到'))}</p>`,
    { current: s.dir, script: FILTER_JS });
  urls.push(`/${s.dir}/`);
  s.items.forEach((it, i) => {
    const path = `/${s.dir}/${it.slug}/`;
    urls.push(path);
    const w = WIKI[it.key];
    const near = s.items.length && !it.route ? CATALOGUE.filter(o => o.key !== it.key && !o.route && SECTION_OF.has(o.key))
      .map(o => ({ o, d: haversineKm(it.lat, it.lon, o.lat, o.lon) })).sort((a, b) => a.d - b.d).slice(0, 6) : [];
    const prev = s.items[(i - 1 + s.items.length) % s.items.length], next = s.items[(i + 1) % s.items.length];
    const wh = where(it);
    page(path, `${it.name.en} — Pocket Planet`, it.desc.en,
      `<nav class="crumbs"><a href="/encyclopedia/">${bi(T('Encyclopedia', '百科'))}</a><span>/</span><a href="/${s.dir}/">${bi(s.title)}</a></nav>
<div class="item" style="--c:${s.color}"><article>
<div class="hero" aria-hidden="true">${it.emoji}</div>
<p class="meta"><span class="chip">${bi(s.one)}</span>${wh.en ? bi(wh) : ''}</p>
<h1>${bi(it.name)}</h1><p class="alt"><span class="zh">${esc(it.name.en)}</span>${it.name.zh ? `<span class="en" lang="zh-CN">${esc(it.name.zh)}</span>` : ''}</p>
${bi(it.desc, 'p', 'lead')}${stats(it)}
${it.funFact ? `<div class="fun"><b>${bi(T('Fun fact', '趣味知识'))}</b>${bi(it.funFact, 'span')}</div>` : ''}
${w ? `<h2>${bi(T('Read more', '延伸阅读'))}</h2><div class="links"><a class="card" href="${wikiUrl('en', w[0])}" rel="noopener"><span class="tile" aria-hidden="true">W</span><span><b>Wikipedia</b><small>${esc(w[0])}</small></span></a>
${w[1] ? `<a class="card" href="${wikiUrl('zh', w[1])}" rel="noopener" lang="zh-CN"><span class="tile" aria-hidden="true">维</span><span><b>维基百科</b><small>${esc(w[1])}</small></span></a>` : ''}</div>` : ''}
<nav class="pager"><a href="/${s.dir}/${prev.slug}/">← ${bi(prev.name)}</a><a href="/${s.dir}/${next.slug}/">${bi(next.name)} →</a></nav>
</article><aside class="side">
<div class="panel"><a class="btn" href="/#${it.key}">🌍 ${bi(T('See it on the 3D globe', '在 3D 地球上查看'))}</a></div>
${it.route ? '' : `<div class="panel"><h3>${bi(T('Location', '位置'))}</h3><p class="mono" style="margin:0">${coord(it.lat, it.lon)}</p></div>`}
${near.length ? `<div class="panel"><h3>${bi(T('Nearby', '附近'))}</h3><ul class="near">${near.map(({ o, d }) => `<li><a href="/${SECTION_OF.get(o.key)!.dir}/${o.slug}/"><span aria-hidden="true">${o.emoji}</span>${bi(o.name)}<i>${num(Math.round(d))} km</i></a></li>`).join('')}</ul></div>` : ''}
</aside></div>`,
      { current: s.dir, jsonld: { '@context': 'https://schema.org', '@type': it.type === 'landmark' ? 'LandmarksOrHistoricalBuildings' : 'Thing', name: it.name.en, alternateName: it.name.zh, description: it.desc.en,
        ...(w ? { sameAs: [wikiUrl('en', w[0])] } : {}),
        ...(it.type === 'landmark' ? { geo: { '@type': 'GeoCoordinates', latitude: it.lat, longitude: it.lon } } : {}) } });
  });
}

page('/about/', 'About — Pocket Planet', 'What Pocket Planet is and how to use it.', `<div class="prose"><p class="eyebrow">${bi(T('About', '关于'))}</p><h1>${bi(T('About Pocket Planet', '关于口袋星球'))}</h1>
${bi(T('Pocket Planet is a free 3D toy globe for curious kids and the grown-ups who explore with them. Spin the Earth, zoom in to find landmarks, animals, ships, planes and trains, collect them in your passport, take photos and play map games.',
  '口袋星球是一个免费的 3D 地球玩具，送给好奇的孩子和陪他们一起探索的大人。转动地球、放大寻找地标、动物、轮船、飞机和火车，把它们收集进护照，拍照并玩地图游戏。'), 'p', 'lead')}
${STATIC ? bi(T('This edition runs entirely in your browser: your collection, photos and game records stay on this device.', '这个版本完全在浏览器中运行：你的收藏、照片和游戏记录都保存在这台设备上。'), 'p')
  : bi(T('Everything works without an account. Signing in with an email link simply keeps your collection in sync across devices.', '不登录也能使用全部功能。用邮箱链接登录只是为了在多台设备之间同步收藏。'), 'p')}
${bi(T('Longer articles come from Wikipedia, the free encyclopedia, under the CC BY-SA licence.', '长篇文章来自自由的百科全书维基百科，遵循 CC BY-SA 许可协议。'), 'p')}
<p><a class="btn" href="/">${bi(T('Open the globe', '打开地球'))}</a> <a class="btn ghost" href="/encyclopedia/">${bi(T('Browse the encyclopedia', '浏览百科'))}</a></p></div>`);
const li = (en: string, zh: string) => `<li>${bi(T(en, zh))}</li>`;
page('/privacy/', 'Privacy — Pocket Planet', 'How Pocket Planet handles data.', `<div class="prose"><p class="eyebrow">${bi(T('Privacy', '隐私'))}</p><h1>${bi(T('Privacy', '隐私说明'))}</h1><ul>
${li('Progress, settings and photos are stored on your device (localStorage and IndexedDB). Photos never leave your device.', '进度、设置和照片保存在你的设备上（localStorage 和 IndexedDB）。照片永远不会离开你的设备。')}
${STATIC ? li('This edition has no server: there are no accounts, cookies or uploads. Clearing site data removes everything.', '这个版本没有服务器：没有账户、Cookie 或上传。清除网站数据即可删除一切。')
  : li('If you choose to sign in, we store your email address, an optional nickname and a copy of your progress so it can sync.', '如果你选择登录，我们会保存你的邮箱、可选的昵称以及进度副本，以便同步。')
  + li('Likes and “I’ve been here” use an anonymous random cookie so each device counts once.', '“喜欢”和“我去过”使用匿名随机 Cookie，每台设备只计一次。')
  + li('Guestbook messages are public, limited to 200 characters, filtered for links and unkind words, and hidden after reports.', '留言板消息是公开的，最多 200 字，会过滤链接和不友善的词语，被举报后会隐藏。')
  + li('You can delete your account and server data any time from the Account panel.', '你可以随时在账户面板中删除账户和服务器数据。')}
${li('Reading an article in the app loads it directly from Wikipedia (wikipedia.org), which sees your IP address like any website.', '在应用中阅读文章时会直接从维基百科（wikipedia.org）加载，维基百科会像任何网站一样看到你的 IP 地址。')}
${li('No ads, no third-party trackers.', '没有广告，没有第三方追踪。')}</ul></div>`);
page('/404/', 'Not found — Pocket Planet', 'Page not found.', `<div class="prose" style="padding:40px 0"><p class="eyebrow">404</p><h1>${bi(T('Lost at sea?', '迷路了吗？'))}</h1>
${bi(T('We couldn’t find that page.', '我们找不到这个页面。'), 'p', 'lead')}<p><a class="btn" href="/">${bi(T('Back to the globe', '回到地球'))}</a></p></div>`);
writeFileSync(join(out, '404.html'), (await import('node:fs')).readFileSync(join(out, '404', 'index.html'), 'utf8'));

writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\n${STATIC ? '' : 'Disallow: /api/\n'}Sitemap: ${SITE}/sitemap.xml\n`);
console.log(`build-pages: wrote ${urls.length} URLs to ${out}`);
