/** Aggregated sky events (eclipses, Moon phases, seasons, meteor showers, planetary events) over a time range. */
import { SHOWERS } from '../../data/showers.ts';
import type { SkyEvent, SkyEventKind } from './types.ts';
import { findLunarEclipses, findSolarEclipses } from './eclipses.ts';
import {
  type PlanetId, type PlanetGeo, angleBetween, centuries, findMin, findRoot, moonGeo, nextPhase, norm180, planetGeo, radec, sunGeo, SUN_KM, R2D,
} from './ephem.ts';

const DAY = 864e5, HOUR = 36e5, MIN = 6e4;
const SUPERMOON_KM = 361_000;
const PLANETS: PlanetId[] = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
const OUTER: PlanetId[] = ['mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
const BRIGHT: PlanetId[] = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];
const MOON_PAIRS: PlanetId[] = ['venus', 'mars', 'jupiter', 'saturn'];
const SEASONS = [['march', 'equinox'], ['june', 'solstice'], ['september', 'equinox'], ['december', 'solstice']] as const;

const ymd = (t: number) => new Date(t).toISOString().slice(0, 10);
const sepOf = (a: { lon: number; lat: number }, b: { lon: number; lat: number }) => angleBetween(radec(a.lon, a.lat), radec(b.lon, b.lat));

/** Time near `guess` when `lon(t)` reaches `target` (deg), for a longitude growing at about `rate` deg/day. */
function solveLon(lon: (t: number) => number, target: number, guess: number, rate: number): number {
  let t = guess;
  for (let i = 0; i < 8; i++) {
    const dt = (norm180(target - lon(t)) / rate) * DAY;
    t += dt;
    if (Math.abs(dt) < 1000) break;
  }
  return t;
}

/** Sun's geometric longitude referred to the J2000 equinox (meteor-shower convention). */
const sunLonJ2000 = (t: number) => { const T = centuries(t); return sunGeo(t).lon - (5029.0966 * T + 1.11113 * T * T) / 3600; };

/** Every sky event with its peak time in [fromMs, toMs], sorted by time. */
export function skyEvents(fromMs: number, toMs: number, opts?: { kinds?: SkyEventKind[] }): SkyEvent[] {
  const want = (k: SkyEventKind) => !opts?.kinds || opts.kinds.includes(k);
  const inRange = (t: number) => t >= fromMs && t <= toMs;
  const out: SkyEvent[] = [];

  if (want('solar-eclipse'))
    for (const e of findSolarEclipses(fromMs, toMs)) out.push({ id: `solar-eclipse-${ymd(e.t)}`, kind: 'solar-eclipse', t: e.t, bodies: ['sun', 'moon'], solar: e });
  if (want('lunar-eclipse'))
    for (const e of findLunarEclipses(fromMs, toMs)) out.push({ id: `lunar-eclipse-${ymd(e.t)}`, kind: 'lunar-eclipse', t: e.t, bodies: ['moon'], lunar: e });

  if (want('new-moon') || want('full-moon') || want('supermoon'))
    for (const phase of [0, 180]) {
      for (let t = nextPhase(fromMs, phase); t <= toMs; t = nextPhase(t + 20 * DAY, phase)) {
        const value = moonGeo(t).distKm, kind: SkyEventKind = phase === 0 ? 'new-moon' : value < SUPERMOON_KM ? 'supermoon' : 'full-moon';
        if (want(kind) && inRange(t)) out.push({ id: `${kind}-${ymd(t)}`, kind, t, bodies: ['moon'], value });
      }
    }

  const y0 = new Date(fromMs).getUTCFullYear(), y1 = new Date(toMs).getUTCFullYear();
  if (want('equinox') || want('solstice'))
    for (let y = y0; y <= y1; y++)
      SEASONS.forEach(([season, kind], i) => {
        if (!want(kind)) return;
        const t = solveLon((tt) => sunGeo(tt).lon, i * 90, Date.UTC(y, 2 + 3 * i, 21), 0.9856);
        if (inRange(t)) out.push({ id: `${kind}-${ymd(t)}`, kind, t, bodies: ['sun'], season });
      });

  if (want('meteor-shower'))
    for (let y = y0; y <= y1; y++)
      for (const s of SHOWERS) {
        let guess = Date.UTC(y, 2, 20) + (s.solarLon / 0.9856) * DAY;
        if (guess >= Date.UTC(y + 1, 0, 1)) guess -= 365.2422 * DAY;
        const t = solveLon(sunLonJ2000, s.solarLon, guess, 0.9856);
        if (inRange(t)) out.push({ id: `meteor-shower-${s.key}-${y}`, kind: 'meteor-shower', t, shower: s.key, bodies: ['earth'] });
      }

  const planetKinds = (['opposition', 'conjunction', 'elongation', 'transit'] as const).filter(want);
  if (planetKinds.length) out.push(...planetEvents(fromMs, toMs, new Set(planetKinds)));
  return out.filter((e) => inRange(e.t)).sort((a, b) => a.t - b.t);
}

function planetEvents(fromMs: number, toMs: number, kinds: Set<SkyEventKind>): SkyEvent[] {
  const out: SkyEvent[] = [];
  const t0 = Math.floor(fromMs / DAY) * DAY - 2 * DAY, n = Math.ceil((toMs - t0) / DAY) + 3;
  const pos = new Map<PlanetId, PlanetGeo[]>(PLANETS.map((id) => [id, []]));
  for (let i = 0; i < n; i++) for (const id of PLANETS) pos.get(id)!.push(planetGeo(id, t0 + i * DAY));
  const at = (i: number) => t0 + i * DAY;

  /** Each sign change of `f(i)` between grid days (only where |f| stays below `lim`, skipping wrap-arounds). */
  const crossings = (f: (i: number) => number, lim: number, dir?: -1 | 1) => {
    const r: number[] = [];
    for (let i = 0; i + 1 < n; i++) {
      const a = f(i), b = f(i + 1);
      if (Math.abs(a) < lim && Math.abs(b) < lim && a !== 0 && (a < 0) !== (b < 0) && (!dir || Math.sign(b - a) === dir)) r.push(i);
    }
    return r;
  };
  /** Grid days where `f` has a local minimum. */
  const minima = (f: (i: number) => number, below: number) => {
    const r: number[] = [];
    for (let i = 1; i + 1 < n; i++) { const v = f(i); if (v < below && v <= f(i - 1) && v < f(i + 1)) r.push(i); }
    return r;
  };

  if (kinds.has('opposition'))
    for (const id of OUTER) {
      const p = pos.get(id)!, f = (t: number) => norm180(planetGeo(id, t).lon - sunGeo(t).lon - 180);
      for (const i of crossings((j) => norm180(p[j].lon - sunGeo(at(j)).lon - 180), 20)) {
        const t = findRoot(f, at(i), at(i + 1), MIN);
        out.push({ id: `opposition-${id}-${ymd(t)}`, kind: 'opposition', t, bodies: [id] });
      }
    }

  for (const id of ['mercury', 'venus'] as const) {
    const p = pos.get(id)!;
    if (kinds.has('elongation'))
      for (const s of [1, -1]) {
        for (const i of minima((j) => -s * p[j].elong, -10)) {
          const t = findMin((tt) => -s * planetGeo(id, tt).elong, at(i - 1), at(i + 1), MIN), value = Math.abs(planetGeo(id, t).elong);
          out.push({ id: `elongation-${id}-${ymd(t)}`, kind: 'elongation', t, bodies: [id], value, side: s > 0 ? 'east' : 'west' });
        }
      }
    if (kinds.has('transit'))
      // Inferior conjunction: the planet passes from the evening sky (east) to the morning sky (west).
      for (const i of crossings((j) => p[j].elong, 10, -1)) {
        const sep = (t: number) => { const s = sunGeo(t); return sepOf(planetGeo(id, t), s); };
        const t = findMin(sep, at(i) - DAY, at(i + 1) + DAY, 10_000), s = sunGeo(t), d = sep(t);
        if (d < Math.asin(SUN_KM / s.distKm) * R2D) out.push({ id: `transit-${id}-${ymd(t)}`, kind: 'transit', t, bodies: [id, 'sun'], value: d });
      }
  }

  if (kinds.has('conjunction')) {
    for (let a = 0; a < BRIGHT.length; a++)
      for (let b = a + 1; b < BRIGHT.length; b++) {
        const A = BRIGHT[a], B = BRIGHT[b], pa = pos.get(A)!, pb = pos.get(B)!;
        for (const i of minima((j) => sepOf(pa[j], pb[j]), 3)) {
          const sep = (t: number) => sepOf(planetGeo(A, t), planetGeo(B, t)), t = findMin(sep, at(i - 1), at(i + 1), MIN), value = sep(t);
          if (value < 1.5) out.push({ id: `conjunction-${A}-${B}-${ymd(t)}`, kind: 'conjunction', t, bodies: [A, B], value });
        }
      }
    // Moon–planet: a 6-hour grid for the Moon, planets interpolated from the daily grid.
    const step = 6 * HOUR, m = Math.floor(((n - 1) * DAY) / step), moon = Array.from({ length: m + 1 }, (_, k) => moonGeo(t0 + k * step));
    for (const id of MOON_PAIRS) {
      const p = pos.get(id)!;
      const sepAt = (k: number) => {
        const x = (k * step) / DAY, i = Math.min(n - 2, Math.floor(x)), f = x - i;
        return sepOf(moon[k], { lon: p[i].lon + norm180(p[i + 1].lon - p[i].lon) * f, lat: p[i].lat + (p[i + 1].lat - p[i].lat) * f });
      };
      for (let k = 1; k < m; k++) {
        const v = sepAt(k);
        if (v > 4 || v > sepAt(k - 1) || v >= sepAt(k + 1)) continue;
        const sep = (t: number) => sepOf(moonGeo(t), planetGeo(id, t)), t = findMin(sep, t0 + (k - 1) * step, t0 + (k + 1) * step, MIN), value = sep(t);
        if (value < 2) out.push({ id: `conjunction-moon-${id}-${ymd(t)}`, kind: 'conjunction', t, bodies: ['moon', id], value });
      }
    }
  }
  return out;
}
