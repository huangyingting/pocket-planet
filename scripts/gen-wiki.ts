/**
 * Resolves every catalogue item to its English Wikipedia article and the matching Chinese article (via langlinks)
 * and writes src/shared/data/wiki.ts, which the in-app reader uses. Re-run after adding content:
 *   node scripts/gen-wiki.ts            (prints items that need a `wiki` title or an override below)
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CATALOGUE } from '../src/shared/data/catalogue.ts';

/** English article titles for core items whose display name is not the article title. */
const OVERRIDES: Record<string, string> = {
  twelveapostles: 'The Twelve Apostles (Victoria)', fd_hotpot: 'Hot pot',
  redeemer: 'Christ the Redeemer (statue)', windmill: 'Zaanse Schans', rialto: 'Rialto Bridge', santorini: 'Oia, Greece',
  bagan: 'Bagan', lalibela: 'Rock-Hewn Churches, Lalibela', cn_zhangjiajie: 'Zhangjiajie National Forest Park',
  cn_guilin: 'Li River', cn_huangshan: 'Huangshan', cn_bund: 'The Bund', cn_danxia: 'Zhangye National Geopark',
  cn_yuanyang: 'Honghe Hani Rice Terraces', ca_preikestolen: 'Preikestolen', ca_sigiriya: 'Sigiriya',
  ca_elephant: 'Elephant Rock (Saudi Arabia)', cb_deadvlei: 'Deadvlei', cb_capitolio: 'El Capitolio', cb_penol: 'El Peñón de Guatapé',
  an_kiwi: 'Kiwi (bird)', dc_atlantis: 'Atlantis', dc_endurance: 'Endurance (1912 ship)', dc_kraken: 'Kraken',
  dc_lostcity: 'Lost City Hydrothermal Field', dc_snailfish: 'Snailfish', dc_antikythera: 'Antikythera wreck',
  dc_nanhai1: 'Nanhai One', vh_ferry: 'Ferry', vh_pacific: 'Airliner', vh_kangaroo: 'Kangaroo Route',
  vh_transsib: 'Trans-Siberian Railway', vh_bullet: 'Shinkansen', vh_ktx: 'Korea Train Express',
  fd_lanzhou: 'Lanzhou beef noodles', fd_waffle: 'Belgian waffle', fs_springfestival: 'Chinese New Year',
  fs_lantern: 'Lantern Festival', fs_harbin: 'Harbin International Ice and Snow Sculpture Festival', fs_holi: 'Holi',
  fs_diwali: 'Diwali', fs_songkran: 'Songkran (Thailand)', fs_hanami: 'Hanami',
  sp_fast: "Five-hundred-meter Aperture Spherical Telescope", sp_alma: 'Atacama Large Millimeter Array',
  sp_jodrell: 'Lovell Telescope', sp_cern: 'Large Hadron Collider', pl_kapok: 'Ceiba pentandra',
  pl_dragonblood: 'Dracaena cinnabari', pl_tulips: 'Tulip', pl_bamboo: 'Bamboo',
  pl_pando: 'Pando (tree)', pl_cocodemer: 'Lodoicea', sv_standrews: 'Old Course at St Andrews', sv_ventoux: 'Mont Ventoux',
  sv_holmenkollen: 'Holmenkollbakken', sv_fnb: 'FNB Stadium', sv_indy500: 'Indianapolis Motor Speedway',
  sv_sumo: 'Sumo', sv_shaolin: 'Shaolin Monastery', vo_tianchi: 'Heaven Lake', mg_humpback: 'Humpback whale',
  mg_wildebeest: 'Blue wildebeest', mg_tern: 'Arctic tern', mg_godwit: 'Bar-tailed godwit', mg_turtle: 'Green sea turtle',
  mg_caribou: 'Porcupine caribou', mg_redcrab: 'Christmas Island red crab', vy_zhenghe: 'Ming treasure voyages',
  vy_magellan: 'Magellan expedition', vy_silkroad: 'Silk Road', vy_polynesia: 'Polynesian navigation',
  vy_viking: 'Norse colonization of North America',
};

/** Chinese titles for items whose English article is generic but zh.wikipedia has a specific one. */
const ZH: Record<string, string> = { pl_bamboo: '蜀南竹海', fd_hotpot: '重庆火锅', an_manta: '蝠鲼属', ar_pakal: '巴加尔大帝' };

const UA = 'PocketPlanet/1.0 (https://github.com/huangyingting/pocket-planet; build script)';
const API = 'https://en.wikipedia.org/w/api.php';

interface Page { title: string; missing?: boolean; invalid?: boolean; pageprops?: { disambiguation?: string }; langlinks?: { lang: string; title: string }[] }
interface Res { query?: { pages?: Page[]; redirects?: { from: string; to: string }[]; normalized?: { from: string; to: string }[] } }

async function lookup(titles: string[]): Promise<Map<string, { en: string; zh?: string; bad?: string }>> {
  const q = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', redirects: '1', prop: 'pageprops|langlinks',
    ppprop: 'disambiguation', lllang: 'zh', lllimit: 'max', titles: titles.join('|') });
  const r = await fetch(`${API}?${q}`, { headers: { 'User-Agent': UA } });
  const j = await r.json() as Res;
  const follow = new Map<string, string>();
  for (const n of j.query?.normalized ?? []) follow.set(n.from, n.to);
  for (const n of j.query?.redirects ?? []) follow.set(n.from, n.to);
  const pages = new Map((j.query?.pages ?? []).map(p => [p.title, p]));
  const out = new Map<string, { en: string; zh?: string; bad?: string }>();
  for (const t of titles) {
    let cur = t;
    for (let i = 0; i < 3 && follow.has(cur); i++) cur = follow.get(cur)!;
    const p = pages.get(cur);
    if (!p || p.missing || p.invalid) out.set(t, { en: t, bad: 'missing' });
    else if (p.pageprops?.disambiguation !== undefined) out.set(t, { en: p.title, bad: 'disambiguation' });
    else out.set(t, { en: p.title, zh: p.langlinks?.find(l => l.lang === 'zh')?.title });
  }
  return out;
}

const want = CATALOGUE.map(it => ({ key: it.key, title: OVERRIDES[it.key] ?? it.wiki ?? it.name.en }));
const result = new Map<string, { en: string; zh?: string; bad?: string }>();
const titles = [...new Set(want.map(w => w.title))];
for (let i = 0; i < titles.length; i += 40) {
  const got = await lookup(titles.slice(i, i + 40));
  for (const [k, v] of got) result.set(k, v);
}

const lines: string[] = [];
const problems: string[] = [];
for (const w of want) {
  const r = result.get(w.title)!;
  if (r.bad) { problems.push(`${w.key}: "${w.title}" → ${r.bad}`); continue; }
  const zh = ZH[w.key] ?? r.zh;
  lines.push(`  ${w.key}: [${JSON.stringify(r.en)}${zh ? ', ' + JSON.stringify(zh) : ''}],`);
}
const out = fileURLToPath(new URL('../src/shared/data/wiki.ts', import.meta.url));
writeFileSync(out, `// Generated by scripts/gen-wiki.ts — do not edit by hand (add a \`wiki\` title to the item or an override there).
/** Item key → [English Wikipedia title, Chinese Wikipedia title?]. */
export const WIKI: Record<string, [en: string, zh?: string]> = {
${lines.join('\n')}
};
`);
console.log(`gen-wiki: ${lines.length}/${want.length} items mapped, ${lines.filter(l => l.includes('", "')).length} with Chinese`);
if (problems.length) console.log('Needs a title:\n' + problems.join('\n'));
