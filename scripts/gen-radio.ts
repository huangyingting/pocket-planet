/**
 * Builds the Earth radio station snapshot from the Radio-Browser community directory
 * (https://www.radio-browser.info, public-domain data) into public/data/radio/stations.json.
 * Keeps HTTPS streams only, drops adult content, spreads picks across countries, and pins stations
 * without coordinates around their country's capital. Re-run to refresh:
 *   node scripts/gen-radio.ts            (or: node scripts/gen-radio.ts /path/to/cached.json)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { CITIES } from '../src/shared/data/cities.ts';

const API = 'https://all.api.radio-browser.info/json/stations/search?limit=12000&hidebroken=true&order=votes&reverse=true&is_https=true';
const TOTAL = 3000;
let seed = 20251021;
/** mulberry32 */
const rand = () => { seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const PER_COUNTRY = 90;
const BLOCK = /sex|erot|adult|xxx|porn|18\+|nsfw|playboy|explicit|strip|fetish|hentai|onlyfans|casino|gambl|bet(ting)?\b/i;
const CODECS = new Set(['MP3', 'AAC', 'AAC+', 'OGG', 'UNKNOWN']);

interface Raw {
  stationuuid: string; name: string; url: string; url_resolved: string; homepage: string; tags: string; countrycode: string;
  geo_lat: number | null; geo_long: number | null; votes: number; codec: string; bitrate: number; hls: number;
}

const raw: Raw[] = process.argv[2]
  ? JSON.parse(readFileSync(process.argv[2], 'utf8'))
  : await (await fetch(API, { headers: { 'User-Agent': 'PocketPlanet-Builder/1.0' } })).json();

// fallback pins for stations without coordinates: the country's listed cities, capital first
const anchor = new Map<string, [number, number][]>();
for (const [, cc, lat, lon] of [...CITIES].sort((a, b) => Number(b[5]) - Number(a[5]) || b[4] - a[4])) {
  anchor.set(cc, [...(anchor.get(cc) ?? []), [lat, lon]]);
}

const stack = new Map<string, number>();
const seen = new Set<string>(), per = new Map<string, number>(), spread = new Map<string, number>();
const tagIx = new Map<string, number>(), tags: string[] = [];
const rows: unknown[] = [];
let pinned = 0;
for (const r of raw) {
  if (rows.length >= TOTAL) break;
  const url = (r.url_resolved || r.url || '').trim();
  const cc = (r.countrycode || '').toUpperCase();
  const name = r.name.replace(/\s+/g, ' ').trim();
  if (!url.startsWith('https://') || cc.length !== 2 || !name || name.length > 60) continue;
  if (BLOCK.test(name) || BLOCK.test(r.tags)) continue;
  if (!r.hls && !CODECS.has(r.codec.toUpperCase())) continue;
  const key = cc + '|' + name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  if (seen.has(key) || seen.has(url)) continue;
  if ((per.get(cc) ?? 0) >= PER_COUNTRY) continue;
  let lat = r.geo_lat ?? 0, lon = r.geo_long ?? 0;
  const exact = !!(lat || lon);
  if (!lat && !lon) {
    const cs = anchor.get(cc);
    if (!cs) continue;
    // round-robin over the cities, then scattered around each so pins don't stack
    const n = spread.get(cc) ?? 0;
    spread.set(cc, n + 1);
    const a = cs[n % cs.length], i = Math.floor(n / cs.length);
    // seeded scatter (the same file every run), wider the more stations share a city
    const rr = (0.12 + 0.5 * Math.sqrt(rand())) * Math.min(2.2, 0.6 + Math.sqrt(i) * 0.35), th = rand() * Math.PI * 2;
    lat = a[0] + rr * Math.sin(th);
    lon = a[1] + (rr * Math.cos(th)) / Math.max(0.3, Math.cos((a[0] * Math.PI) / 180));
    pinned++;
  }
  // stations sharing one address get nudged apart a little
  const at = lat.toFixed(2) + ',' + lon.toFixed(2), k = stack.get(at) ?? 0;
  stack.set(at, k + 1);
  if (k) { const rr = 0.04 + 0.08 * Math.sqrt(rand() * k), th = rand() * Math.PI * 2; lat += rr * Math.sin(th); lon += rr * Math.cos(th); }
  seen.add(key); seen.add(url);
  per.set(cc, (per.get(cc) ?? 0) + 1);
  const tg = r.tags.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length >= 2 && s.length <= 20).slice(0, 3).map(s => {
    let i = tagIx.get(s);
    if (i === undefined) { i = tags.length; tags.push(s); tagIx.set(s, i); }
    return i;
  });
  // [name, cc, lat, lon, url, flags (1 = HLS, 2 = approximate position), codec, kbps, tag indices]
  rows.push([name, cc, +lat.toFixed(3), +lon.toFixed(3), url, (r.hls ? 1 : 0) | (exact ? 0 : 2), r.codec.toUpperCase() === 'UNKNOWN' ? '' : r.codec.toUpperCase(), r.bitrate | 0, tg]);
}

mkdirSync('public/data/radio', { recursive: true });
const out = { v: 1, at: new Date().toISOString().slice(0, 10), source: 'radio-browser.info', tags, s: rows };
writeFileSync('public/data/radio/stations.json', JSON.stringify(out));
console.log(`${rows.length} stations (${pinned} pinned to a city) in ${per.size} countries, ${tags.length} tags`);
