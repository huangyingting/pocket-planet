/**
 * Kit "sky": the starry sky of an observer at latitude φ. Real stars (the constellation figures' Hipparcos positions)
 * turn about the celestial pole with the sidereal time of the lesson clock.
 * - `dome`: standing on the ground, looking toward `look` (north: stars wheel around Polaris, star trails grow).
 * - `outside`: the celestial sphere seen from outside, the horizon disc with the observer at its centre, the pole
 *   tilted up by the latitude, the circumpolar zone and the stars' daily circles.
 * - `earth`: why Polaris' altitude equals the latitude: the Earth with an observer, the local horizon and the
 *   (parallel) lines of sight to Polaris.
 * The clock drives the instant (`date`: UTC ms; `hour`: hours after `t`) or the latitude (`lat`).
 */
import * as THREE from 'three';
import { CONSTELLATIONS } from '../../../shared/data/constellations.ts';
import { gmst } from '../../../shared/lib/astro/ephem.ts';
import { C } from '../kit.ts';
import { D2R, Arrow, ball, body, canvasTex, circlePts, clamp, dirLight, drawIn, line, ramp, ring, rng, setLine } from './draw.ts';
import type { AstroClock, KitCtx, KitFactory, KitRun, Label, Pair, V3 } from './types.ts';

export interface Opts {
  /** default `dome`; `chart`: a flat polar star chart (like the Suzhou stone chart of 1247), static */
  view?: 'dome' | 'outside' | 'earth' | 'chart';
  /** dome: look toward azimuth (0 = north, 90 = east) and altitude, degrees; default north, 35° up */
  look?: [az: number, alt: number];
  /** dome: vertical field of view (default 70°) */
  fov?: number;
  /** observer (default Beijing: 40° N, 116.4° E, UTC+8) */
  lat?: number; lon?: number; tz?: number;
  /** the instant (UTC ms) when the clock does not give it (default 2025-04-20, 20:00 Beijing time) */
  t?: number;
  /** constellation figures to draw (ids such as 'ori', 'uma', 'cas') */
  cons?: string[];
  /** name the drawn constellations */
  names?: boolean;
  /** draw the Big Dipper (北斗七星) in gold; `'names'` also labels its seven stars */
  dipper?: boolean | 'names';
  /** label these stars (English names from the catalogue, e.g. 'Vega', 'Sirius') */
  stars?: string[];
  /** a pointer line: Merak→Dubhe extended to Polaris, or the Southern Cross's long axis toward the south pole */
  pointer?: 'polaris' | 'crux';
  /** the Summer Triangle (Vega, Deneb, Altair) */
  triangle?: boolean;
  /** star trails since the start of the clock (dome: stars brighter than this magnitude, default 4) */
  trails?: boolean | number;
  /** outside: the circumpolar zone (never sets) and the never-rises zone */
  circumpolar?: boolean;
  /** outside: daily circles of a few bright stars */
  circles?: boolean;
  /** an arc from the horizon up to the celestial pole: its altitude = the latitude */
  arc?: boolean;
  /** an arrow along the Big Dipper's handle */
  handle?: boolean;
  /** outside: the celestial equator (default on) */
  equator?: boolean;
  /** dome / chart: the 28 lunar mansions (二十八宿) by their determinative stars (距星); `'names'` labels each */
  mansions?: boolean | 'names';
  /** dome / chart: the Four Symbols (四象), each mansion group in its colour */
  symbols?: boolean;
  /** chart: the Three Enclosures (三垣) */
  enclosures?: boolean;
  /** dome: the Milky Way band (it fades out under a bright sky) */
  milkyway?: boolean;
  /**
   * dome: limiting magnitude: fainter stars vanish and the sky glows as with light pollution. A lab slider `mag`
   * (`ctx.param('mag')`) overrides it.
   */
  limit?: number;
  /** dome: dark adaptation: the clock is minutes in the dark (unit `x`) and sets the limiting magnitude */
  adapt?: boolean;
  /** dome: a meteor shower streaking from this radiant (RA, Dec in degrees) */
  meteors?: { ra: number; dec: number; name?: Pair };
  /** dome / chart: marked points of the sky (RA, Dec in degrees) */
  marks?: { ra: number; dec: number; name: Pair; c?: string }[];
}

const H = 36e5, SID = 86164091;
const T_DEF = Date.UTC(2025, 3, 20, 12);
const DIPPER = [1, 2, 3, 0, 4, 5, 6];
const DIPPER_ZH: Record<number, Pair> = {
  1: ['Dubhe', '天枢'], 2: ['Merak', '天璇'], 3: ['Phecda', '天玑'], 0: ['Megrez', '天权'], 4: ['Alioth', '玉衡'], 5: ['Mizar', '开阳'], 6: ['Alkaid', '摇光'],
};
const DIPPER_LINES: [number, number][] = [[1, 2], [2, 3], [3, 0], [0, 1], [0, 4], [4, 5], [5, 6]];
const TINT: Record<string, string> = {
  Betelgeuse: '#ffb27a', Antares: '#ff9466', Aldebaran: '#ffbf8a', Arcturus: '#ffcf96', Pollux: '#ffd9a8', Kochab: '#ffd2a0',
  Dubhe: '#ffe2b4', Mira: '#ffa070', Rigel: '#bcd0ff', Spica: '#b8cbff', Vega: '#d4e2ff', Sirius: '#d8e6ff', Regulus: '#c9d9ff',
  Capella: '#fff0c8', Polaris: '#fff6e0', Deneb: '#eef3ff', Altair: '#f4f6ff', Acrux: '#c4d4ff', Gacrux: '#ffb88a', Canopus: '#f6f4ff',
};

/**
 * The 28 lunar mansions (二十八宿) and their determinative stars (距星), J2000 RA / Dec (degrees) and V magnitude:
 * 角 α Vir, 亢 κ Vir, 氐 α² Lib, 房 π Sco, 心 σ Sco, 尾 μ¹ Sco, 箕 γ² Sgr | 斗 φ Sgr, 牛 β Cap, 女 ε Aqr, 虚 β Aqr,
 * 危 α Aqr, 室 α Peg, 壁 γ Peg | 奎 ζ And, 娄 β Ari, 胃 35 Ari, 昴 17 Tau, 毕 ε Tau, 觜 λ Ori, 参 δ Ori |
 * 井 μ Gem, 鬼 θ Cnc, 柳 δ Hya, 星 α Hya, 张 υ¹ Hya, 翼 α Crt, 轸 γ Crv.
 */
export const MANSIONS: [zh: string, py: string, ra: number, dec: number, mag: number][] = [
  ['角', 'Jiao', 201.298, -11.161, 0.97], ['亢', 'Kang', 213.224, -10.274, 4.18], ['氐', 'Di', 222.720, -16.042, 2.75], ['房', 'Fang', 239.713, -26.114, 2.89],
  ['心', 'Xin', 245.297, -25.593, 2.89], ['尾', 'Wei', 252.968, -38.047, 3.0], ['箕', 'Ji', 271.452, -30.424, 2.99],
  ['斗', 'Dou', 281.414, -26.991, 3.17], ['牛', 'Niu', 305.253, -14.781, 3.08], ['女', 'Nü', 311.919, -9.496, 3.77], ['虚', 'Xu', 322.890, -5.571, 2.87],
  ['危', 'Wei', 331.446, -0.320, 2.94], ['室', 'Shi', 346.190, 15.205, 2.48], ['壁', 'Bi', 3.309, 15.184, 2.83],
  ['奎', 'Kui', 11.835, 24.267, 4.06], ['娄', 'Lou', 28.660, 20.808, 2.64], ['胃', 'Wei', 40.863, 27.707, 4.66], ['昴', 'Mao', 56.219, 24.113, 3.70],
  ['毕', 'Bi', 67.154, 19.180, 3.53], ['觜', 'Zi', 83.784, 9.934, 3.39], ['参', 'Shen', 83.002, -0.299, 2.23],
  ['井', 'Jing', 95.740, 22.514, 2.87], ['鬼', 'Gui', 127.899, 18.094, 5.33], ['柳', 'Liu', 129.414, 5.704, 4.16], ['星', 'Xing', 141.897, -8.659, 1.98],
  ['张', 'Zhang', 147.870, -14.846, 4.11], ['翼', 'Yi', 164.944, -18.299, 4.07], ['轸', 'Zhen', 183.952, -17.542, 2.58],
];
/** The Four Symbols (四象), seven mansions each, in mansion order; `tag` is their pick name. */
const SYMBOLS: { name: Pair; c: string; tag: string }[] = [
  { name: ['Azure Dragon of the East', '东方苍龙'], c: '#63e6be', tag: 'dragon' },
  { name: ['Black Tortoise of the North', '北方玄武'], c: '#91a7ff', tag: 'tortoise' },
  { name: ['White Tiger of the West', '西方白虎'], c: '#f1f3f5', tag: 'tiger' },
  { name: ['Vermilion Bird of the South', '南方朱雀'], c: '#ff8787', tag: 'bird' },
];
/** The Three Enclosures (三垣), sketched as circles: centre RA / Dec and radius (degrees). */
const ENCLOSURES: { name: Pair; ra: number; dec: number; r: number }[] = [
  { name: ['Purple Forbidden Enclosure', '紫微垣'], ra: 0, dec: 90, r: 30 },
  { name: ['Supreme Palace Enclosure', '太微垣'], ra: 176, dec: 7, r: 14 },
  { name: ['Heavenly Market Enclosure', '天市垣'], ra: 260, dec: 8, r: 19 },
];
/** Galactic (l, b) → equatorial unit vector (J2000). */
function galactic(l: number, b: number): THREE.Vector3 {
  const x = Math.cos(b * D2R) * Math.cos(l * D2R), y = Math.cos(b * D2R) * Math.sin(l * D2R), z = Math.sin(b * D2R);
  return new THREE.Vector3(
    -0.0548755604 * x + 0.4941094279 * y - 0.8676661490 * z,
    -0.8734370902 * x - 0.4448296300 * y - 0.1980763734 * z,
    -0.4838350155 * x + 0.7469822445 * y + 0.4559837762 * z);
}
/** Naked-eye stars brighter than magnitude m over the whole sky (approximate counts). */
function starsBrighter(m: number): number {
  const T: [number, number][] = [[0, 0.6], [1, 1.2], [2, 1.72], [3, 2.23], [4, 2.71], [5, 3.2], [6, 3.69], [7, 4.18]];
  const i = Math.max(0, Math.min(T.length - 2, Math.floor(m)));
  const [m0, a] = T[i], [, b] = T[i + 1];
  return 10 ** (a + (b - a) * (m - m0));
}
/** Bortle dark-sky class for a naked-eye limiting magnitude. */
const bortle = (m: number) => m >= 7.6 ? 1 : m >= 7.1 ? 2 : m >= 6.6 ? 3 : m >= 6.1 ? 4 : m >= 5.6 ? 5 : m >= 5.1 ? 6 : m >= 4.6 ? 7 : m >= 4.1 ? 8 : 9;
/** Limiting magnitude after `t` minutes in the dark: pupils open in seconds, the rods take 20–30 minutes. */
const adaptLim = (t: number) => 3.2 + 3.3 * (1 - Math.exp(-Math.max(0, t) / 8));

export interface Star { p: THREE.Vector3; mag: number; name?: { en: string; zh: string }; col: THREE.Color }
let CAT: { stars: Star[]; idx: Record<string, number[]>; byName: Record<string, number> } | null = null;
const eq = (ra: number, dec: number) =>
  new THREE.Vector3(Math.cos(dec * D2R) * Math.cos(ra * D2R), Math.cos(dec * D2R) * Math.sin(ra * D2R), Math.sin(dec * D2R));

/** The constellation stars, once each (stars shared by two figures appear once). */
export function catalogue() {
  if (CAT) return CAT;
  const stars: Star[] = [], idx: Record<string, number[]> = {}, byName: Record<string, number> = {}, seen = new Map<string, number>();
  const R = rng(11);
  for (const c of CONSTELLATIONS) {
    idx[c.id] = c.stars.map(([ra, dec, mag], i) => {
      const key = `${ra.toFixed(1)},${dec.toFixed(1)}`, name = c.named?.[i];
      let k = seen.get(key);
      if (k === undefined) {
        const t = R();
        const col = new THREE.Color(name && TINT[name.en] ? TINT[name.en] : t < 0.18 ? '#d6e2ff' : t > 0.85 ? '#ffe4c2' : '#fff8ee');
        k = stars.push({ p: eq(ra, dec), mag, col, name }) - 1;
        seen.set(key, k);
      } else if (name && !stars[k].name) stars[k].name = name;
      if (name) byName[name.en] = k;
      return k;
    });
  }
  CAT = { stars, idx, byName };
  return CAT;
}

const VS = /* glsl */ `
attribute float aMag;
attribute vec3 aCol;
uniform float uPr, uK, uBelow, uHz, uLim;
varying vec3 vC;
varying float vA;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * viewMatrix * w;
  vA = clamp(1.25 - 0.16 * aMag, 0.18, 1.0) * mix(1.0, uBelow, step(w.z, uHz)) * (1.0 - smoothstep(uLim - 0.12, uLim + 0.12, aMag));
  vC = aCol;
  gl_PointSize = clamp(uK * (5.4 - 0.75 * aMag), 1.4, 10.0) * uPr;
}`;
const MW_VS = /* glsl */ `
attribute float aB;
attribute float aS;
uniform float uPr, uA, uHz;
varying float vA;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * viewMatrix * w;
  vA = aB * uA * step(uHz, w.z);
  gl_PointSize = aS * uPr;
}`;
const MW_FS = /* glsl */ `
varying float vA;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r = dot(q, q);
  if (r > 1.0) discard;
  gl_FragColor = vec4(vec3(0.55, 0.6, 0.72) * exp(-r * 3.0) * vA * 0.11, 1.0);
}`;
const FS = /* glsl */ `
varying vec3 vC;
varying float vA;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r = dot(q, q);
  if (r > 1.0) discard;
  float a = exp(-r * 4.0) + 0.25 * exp(-r * 1.2);
  gl_FragColor = vec4(vC * a * vA, 1.0);
}`;

export function starPoints(list: Star[], R: number, k: number, below: number, pr: number): THREE.Points {
  const n = list.length, pos = new Float32Array(n * 3), mag = new Float32Array(n), colr = new Float32Array(n * 3);
  list.forEach((s, i) => { pos.set([s.p.x * R, s.p.y * R, s.p.z * R], i * 3); mag[i] = s.mag; colr.set([s.col.r, s.col.g, s.col.b], i * 3); });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aMag', new THREE.BufferAttribute(mag, 1));
  g.setAttribute('aCol', new THREE.BufferAttribute(colr, 3));
  const m = new THREE.ShaderMaterial({
    vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uPr: { value: pr }, uK: { value: k }, uBelow: { value: below }, uHz: { value: 0 }, uLim: { value: 99 } },
  });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false;
  return p;
}

/** The point `k` times the angle from unit a to unit b along their great circle (k > 1 goes beyond b). */
function along(a: THREE.Vector3, b: THREE.Vector3, k: number): THREE.Vector3 {
  const n = new THREE.Vector3().crossVectors(a, b).normalize(), w = Math.acos(clamp(a.dot(b), -1, 1));
  return a.clone().applyAxisAngle(n, w * k);
}
function arcPts(a: THREE.Vector3, b: THREE.Vector3, k0: number, k1: number, R: number, n = 64): THREE.Vector3[] {
  return Array.from({ length: n + 1 }, (_, i) => along(a, b, k0 + (k1 - k0) * (i / n)).multiplyScalar(R));
}
/** A circle of declination `dec` (deg) on a sphere of radius R, in the equatorial frame. */
function decCircle(dec: number, R: number, n = 128): THREE.Vector3[] {
  const c = Math.cos(dec * D2R) * R, z = Math.sin(dec * D2R) * R;
  return Array.from({ length: n + 1 }, (_, i) => { const a = (i / n) * Math.PI * 2; return new THREE.Vector3(c * Math.cos(a), c * Math.sin(a), z); });
}
/** Hour-angle frame (x: meridian, y: east, z: pole) → horizon frame (x east, y north, z up) for latitude φ. */
function tiltBasis(lat: number, m: THREE.Matrix4): THREE.Matrix4 {
  const s = Math.sin(lat * D2R), c = Math.cos(lat * D2R);
  return m.makeBasis(new THREE.Vector3(0, -s, c), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, c, s));
}
const hidden = () => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });

function season(ms: number, tz: number, south: boolean): Pair {
  const m = new Date(ms + tz * H).getUTCMonth();
  const s = m >= 2 && m <= 4 ? 0 : m >= 5 && m <= 7 ? 1 : m >= 8 && m <= 10 ? 2 : 3;
  return ([['spring', '春季'], ['summer', '夏季'], ['autumn', '秋季'], ['winter', '冬季']] as Pair[])[south ? (s + 2) % 4 : s];
}
const hhmm = (ms: number, tz: number) => { const d = new Date(ms + tz * H); return `${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };

const kit: KitFactory<Opts & { clock?: AstroClock }> = (ctx, o) => {
  const view = o.view ?? 'dome';
  const unit = o.clock?.unit;
  const lon = o.lon ?? 116.4, tz = o.tz ?? 8;
  const at = (v: number) => unit === 'date' ? v : unit === 'hour' ? (o.t ?? T_DEF) + v * H : o.t ?? T_DEF;
  const latAt = (v: number) => unit === 'lat' ? v : o.lat ?? 40;
  if (view === 'earth') return earthKit(ctx, latAt);
  if (view === 'chart') return chartKit(ctx, o);
  const ms0 = o.clock ? at(o.clock.from) : at(0);
  // over a long date span keep the clock time fixed: the sky only creeps ~1°/day (Earth's orbit)
  const yearly = unit === 'date' && !!o.clock && Math.abs(o.clock.to - o.clock.from) > 20 * 864e5;

  const dome = view === 'dome';
  const R = dome ? 1000 : 4;
  const cat = catalogue();
  const pr = Math.min(devicePixelRatio, ctx.low ? 1 : 2);
  const labels: { l: Label; obj: THREE.Object3D; min: number }[] = [];
  const wp = new THREE.Vector3();

  // frames: sky (follows the camera in the dome) > tilt (hour-angle frame) > spin (equatorial frame); hz: horizon frame
  const sky = new THREE.Group(), tilt = new THREE.Group(), spin = new THREE.Group(), hz = new THREE.Group();
  tilt.matrixAutoUpdate = false;
  sky.add(tilt); tilt.add(spin);
  ctx.root.add(sky, hz);

  // stars
  const bright = cat.stars.filter(s => s.mag < (dome ? 6 : 4.6));
  spin.add(starPoints(bright, R, dome ? 1 : 0.85, dome ? 0 : 0.28, pr));
  if (dome) {
    const n = ctx.low ? 700 : 1800, Rn = rng(5), faint: Star[] = [];
    for (let i = 0; i < n; i++) {
      const z = Rn() * 2 - 1, a = Rn() * Math.PI * 2, s = Math.sqrt(1 - z * z);
      faint.push({ p: new THREE.Vector3(s * Math.cos(a), s * Math.sin(a), z), mag: 4.6 + Rn() * 1.8, col: new THREE.Color(Rn() < 0.2 ? '#d8e4ff' : '#fff6ea') });
    }
    spin.add(starPoints(faint, R * 1.01, 0.9, 0, pr));
  }
  const starMats = spin.children.filter((c): c is THREE.Points => c instanceof THREE.Points).map(p => p.material as THREE.ShaderMaterial);

  const anchor = (p: THREE.Vector3, parent: THREE.Object3D) => { const a = new THREE.Object3D(); a.position.copy(p); parent.add(a); return a; };
  const addLabel = (p: THREE.Vector3, text: Pair, c: string, opt: { big?: boolean; dot?: boolean; t?: number; dy?: number; dx?: number; min?: number } = {}, parent: THREE.Object3D = spin) => {
    const obj = anchor(p, parent);
    const l = ctx.label(obj, text, { c, big: opt.big, dot: opt.dot, t: opt.t, dy: opt.dy, dx: opt.dx });
    labels.push({ l, obj, min: opt.min ?? (dome ? 1.5 : -90) });
    return obj;
  };
  const centroid = (ids: number[]) => ids.reduce((s, k) => s.add(cat.stars[k].p), new THREE.Vector3()).normalize();

  // constellation figures
  const segs: THREE.Vector3[] = [];
  for (const id of o.cons ?? []) {
    const c = CONSTELLATIONS.find(x => x.id === id);
    if (!c) continue;
    const ix = cat.idx[id];
    for (const [a, b] of c.lines) {
      if (o.dipper && id === 'uma' && DIPPER_LINES.some(([p, q]) => (p === a && q === b) || (p === b && q === a))) continue;
      segs.push(cat.stars[ix[a]].p.clone().multiplyScalar(R * 0.999), cat.stars[ix[b]].p.clone().multiplyScalar(R * 0.999));
    }
    if (o.names) addLabel(centroid(ix).multiplyScalar(R), [c.name.en, c.name.zh], C.ice, { dy: 20, min: dome ? 4 : -90, t: 0.6 });
  }
  const conLines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs),
    new THREE.LineBasicMaterial({ color: '#8fb4e8', transparent: true, opacity: dome ? 0.5 : 0.4, depthWrite: false }));
  spin.add(conLines);

  // the Big Dipper
  const uma = cat.idx.uma, dp = (i: number) => cat.stars[uma[i]].p;
  const dipC = centroid(DIPPER.map(i => uma[i])).multiplyScalar(R);
  let dipLines: THREE.LineSegments | null = null;
  if (o.dipper) {
    const ps = DIPPER_LINES.flatMap(([a, b]) => [dp(a).clone().multiplyScalar(R * 0.999), dp(b).clone().multiplyScalar(R * 0.999)]);
    dipLines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ps), new THREE.LineBasicMaterial({ color: C.gold, transparent: true, opacity: 0.85, depthWrite: false }));
    spin.add(dipLines);
    if (o.dipper === 'names') for (const i of DIPPER) addLabel(dp(i).clone().multiplyScalar(R), DIPPER_ZH[i], C.gold, { dy: -15, t: 0.8 + DIPPER.indexOf(i) * 0.15 });
    else addLabel(dipC, ['Big Dipper', '北斗七星'], C.gold, { dy: dome ? 40 : 16, t: 0.5 });
  }
  // pickable: the Big Dipper (its seven stars) and Polaris
  {
    const g = new THREE.Group();
    g.position.copy(dipC);
    for (const i of DIPPER) { const m = new THREE.Mesh(new THREE.SphereGeometry(R * 0.035, 8, 6), hidden()); m.position.copy(dp(i)).multiplyScalar(R).sub(dipC); g.add(m); }
    spin.add(g);
    ctx.pickable(g, 'dipper');
  }
  const polP = cat.stars[cat.byName.Polaris].p;
  const pol = new THREE.Mesh(new THREE.SphereGeometry(R * 0.045, 10, 8), hidden());
  pol.position.copy(polP).multiplyScalar(R);
  spin.add(pol);
  ctx.pickable(pol, 'polaris');

  // named stars
  for (const n of o.stars ?? []) {
    const s = cat.stars[cat.byName[n]];
    if (s?.name) addLabel(s.p.clone().multiplyScalar(R), [s.name.en, s.name.zh], n === 'Polaris' ? C.gold : C.white, { dy: -15, t: 0.6 });
  }

  // pointer lines and the Summer Triangle (drawn in one after another)
  const draws: THREE.Line[] = [];
  const dash = { opacity: 0.85, dashed: true, dash: R * 0.012 };
  if (o.pointer === 'polaris') {
    const a = dp(2), b = dp(1);
    draws.push(line(arcPts(a, b, 0, 1, R * 0.998, 8), C.orange), line(arcPts(a, b, 1, 5.75, R * 0.998), C.orange, dash));
    addLabel(along(a, b, 3.4).multiplyScalar(R), ['× 5', '约 5 倍'], C.orange, { t: 2.4, dx: 30 });
    if (!(o.stars ?? []).includes('Polaris')) addLabel(polP.clone().multiplyScalar(R), ['Polaris', '北极星'], C.gold, { dy: -18, t: 2.8, big: true });
  } else if (o.pointer === 'crux') {
    const cru = cat.idx.cru, a = cat.stars[cru[3]].p, b = cat.stars[cru[2]].p;
    draws.push(line(arcPts(a, b, 0, 1, R * 0.998, 8), C.orange), line(arcPts(a, b, 1, 5.3, R * 0.998), C.orange, dash));
    addLabel(new THREE.Vector3(0, 0, -R), ['south celestial pole: no bright star', '南天极：附近没有亮星'], C.gold, { dot: true, t: 2.6, min: -90 });
  }
  if (o.triangle) {
    const [v, d, a] = ['Vega', 'Deneb', 'Altair'].map(n => cat.stars[cat.byName[n]].p);
    for (const [p, q] of [[v, d], [d, a], [a, v]]) draws.push(line(arcPts(p, q, 0, 1, R * 0.998, 24), C.teal, { opacity: 0.8 }));
    addLabel(new THREE.Vector3().add(v).add(d).add(a).normalize().multiplyScalar(R), ['Summer Triangle', '夏季大三角'], C.teal, { t: 1.6 });
  }
  for (const l of draws) spin.add(l);
  const handle = o.handle ? new Arrow(C.orange, dome ? R * 0.004 : 0.02) : null;
  if (handle) { sky.add(handle); handle.opacity = 0.9; }

  // star trails, in the hour-angle frame (they stay while the stars move on)
  const trailMax = typeof o.trails === 'number' ? o.trails : ctx.low ? 3.2 : 4;
  const trailStars = !o.trails ? [] : dome ? bright.filter(s => s.mag < trailMax) : ['Dubhe', 'Kochab', 'Capella', 'Vega', 'Betelgeuse', 'Sirius', 'Antares'].map(n => cat.stars[cat.byName[n]]);
  const NT = dome ? 48 : 96;
  let trails: THREE.LineSegments | null = null;
  if (trailStars.length) {
    const nv = trailStars.length * NT * 2, colr = new Float32Array(nv * 3);
    trailStars.forEach((s, i) => {
      const b = dome ? clamp(1.1 - 0.17 * s.mag, 0.25, 1) : 1;
      for (let k = 0; k < NT; k++) for (let e = 0; e < 2; e++) {
        const f = (k + e) / NT, j = ((i * NT + k) * 2 + e) * 3, a = b * (0.1 + 0.9 * f * f);
        colr[j] = s.col.r * a; colr[j + 1] = s.col.g * a; colr[j + 2] = s.col.b * a;
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(colr, 3));
    trails = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: dome ? 0.85 : 1, blending: THREE.AdditiveBlending, depthWrite: false }));
    trails.frustumCulled = false;
    tilt.add(trails);
  }
  let trailKey = '';
  const setTrails = (th: number, dth: number) => {
    const key = `${th.toFixed(4)}|${dth.toFixed(4)}`;
    if (!trails || key === trailKey) return;
    trailKey = key;
    const attr = trails.geometry.getAttribute('position') as THREE.BufferAttribute, arr = attr.array as Float32Array;
    const span = Math.min(dth, 359.9);
    trailStars.forEach((s, i) => {
      const r = Math.hypot(s.p.x, s.p.y) * R, z = s.p.z * R, a0 = Math.atan2(s.p.y, s.p.x);
      for (let k = 0; k < NT; k++) for (let e = 0; e < 2; e++) {
        const ang = a0 - (th - span * (1 - (k + e) / NT)) * D2R, j = ((i * NT + k) * 2 + e) * 3;
        arr[j] = r * Math.cos(ang); arr[j + 1] = r * Math.sin(ang); arr[j + 2] = z;
      }
    });
    attr.needsUpdate = true;
  };

  // the 28 lunar mansions and the Four Symbols
  const mans = o.mansions || o.symbols ? MANSIONS.map(([zh, py, ra, dec, mag]) => ({ zh, py, p: eq(ra, dec), mag })) : [];
  if (mans.length) {
    // determinative stars missing from the constellation figures
    const extra = mans.filter(m => !cat.stars.some(s => s.p.dot(m.p) > Math.cos(0.15 * D2R)))
      .map(m => ({ p: m.p, mag: m.mag, col: new THREE.Color('#fff4e0') }));
    if (extra.length) { const pts = starPoints(extra, R * 0.999, dome ? 1 : 0.85, dome ? 0 : 0.28, pr); spin.add(pts); starMats.push(pts.material as THREE.ShaderMaterial); }
    SYMBOLS.forEach((sy, k) => {
      const seven = mans.slice(k * 7, k * 7 + 7);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < 6; i++) pts.push(...arcPts(seven[i].p, seven[i + 1].p, 0, 1, R * 0.998, 12));
      const chain = line(pts, sy.c, { opacity: 0.75 });
      spin.add(chain);
      draws.push(chain);
      for (const m of seven) {
        // a small ring around each determinative star
        const a = new THREE.Vector3(0, 0, 1).cross(m.p).normalize(), b = m.p.clone().cross(a), rr = 1.3 * D2R;
        spin.add(line(Array.from({ length: 25 }, (_, i) => { const t = (i / 24) * Math.PI * 2; return m.p.clone().addScaledVector(a, rr * Math.cos(t)).addScaledVector(b, rr * Math.sin(t)).normalize().multiplyScalar(R * 0.998); }), sy.c, { opacity: 0.9 }));
        if (o.mansions === 'names') addLabel(m.p.clone().multiplyScalar(R), [m.py, `${m.zh}宿`], sy.c, { dy: 16, t: 1 + k * 0.4 });
      }
      const g = new THREE.Group(), cen = seven.reduce((s2, m) => s2.add(m.p), new THREE.Vector3()).normalize().multiplyScalar(R);
      g.position.copy(cen);
      for (const m of seven) { const h = new THREE.Mesh(new THREE.SphereGeometry(R * 0.04, 8, 6), hidden()); h.position.copy(m.p).multiplyScalar(R).sub(cen); g.add(h); }
      spin.add(g);
      ctx.pickable(g, sy.tag);
      if (o.symbols) addLabel(cen, sy.name, sy.c, { big: true, dy: -34, t: 0.8 + k * 0.4 });
    });
  }
  for (const m of o.marks ?? []) addLabel(eq(m.ra, m.dec).multiplyScalar(R), m.name, m.c ?? C.pink, { dot: true, t: 1 });

  // the Milky Way: soft points along the galactic plane, brightest toward the centre in Sagittarius
  let mwMat: THREE.ShaderMaterial | null = null;
  if (dome && o.milkyway) {
    const n = ctx.low ? 5000 : 14000, Rn = rng(21), pos = new Float32Array(n * 3), br = new Float32Array(n), sz = new Float32Array(n);
    const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += Rn(); return (u - 2) * 1.7; };
    for (let i = 0; i < n; i++) {
      const l = Rn() * 360, dl = Math.min(l, 360 - l), core = Math.exp(-((dl / 38) ** 2));
      let b = gauss() * (3.2 + 5 * core);
      // the Great Rift: dark dust from Cygnus to Sagittarius, just north of the plane
      const rift = l < 70 || l > 340 ? Math.exp(-(((b - 1.2) / 1.6) ** 2)) * 0.75 : 0;
      if (Rn() < 0.08) b *= 2.2;
      const p = galactic(l, b).multiplyScalar(R * 1.02);
      pos.set([p.x, p.y, p.z], i * 3);
      br[i] = (0.35 + 0.9 * core) * (1 - rift) * (0.5 + Rn() * 0.7);
      sz[i] = 7 + Rn() * 16;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aB', new THREE.BufferAttribute(br, 1));
    g.setAttribute('aS', new THREE.BufferAttribute(sz, 1));
    mwMat = new THREE.ShaderMaterial({
      vertexShader: MW_VS, fragmentShader: MW_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uPr: { value: pr }, uA: { value: 1 }, uHz: { value: 0 } },
    });
    const mw = new THREE.Points(g, mwMat);
    mw.frustumCulled = false;
    spin.add(mw);
  }

  // a meteor shower: streaks shooting out of the radiant
  const NM = ctx.low ? 6 : 12;
  let meteors: THREE.LineSegments | null = null;
  const met: { a: THREE.Vector3; b: THREE.Vector3; t0: number; dur: number }[] = [];
  if (dome && o.meteors) {
    const rad = eq(o.meteors.ra, o.meteors.dec), Rn = rng(8);
    for (let i = 0; i < NM; i++) {
      // a start point 10–55° from the radiant, flying straight away from it
      const ax = new THREE.Vector3(Rn() - 0.5, Rn() - 0.5, Rn() - 0.5).cross(rad).normalize();
      const a = rad.clone().applyAxisAngle(ax, (10 + Rn() * 45) * D2R);
      met.push({ a, b: along(rad, a, 1 + (0.15 + Rn() * 0.25)), t0: Rn() * 4, dur: 0.5 + Rn() * 0.6 });
    }
    const g = new THREE.BufferGeometry(), colr = new Float32Array(NM * 6);
    for (let i = 0; i < NM; i++) colr.set([0, 0, 0, 1, 0.97, 0.85], i * 6);
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NM * 6), 3));
    g.setAttribute('color', new THREE.BufferAttribute(colr, 3));
    meteors = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    meteors.frustumCulled = false;
    spin.add(meteors);
    addLabel(rad.clone().multiplyScalar(R), o.meteors.name ?? ['radiant', '辐射点'], C.orange, { dot: true, t: 0.6 });
  }

  // light pollution / dark adaptation: a limiting magnitude
  const limOf = (v: number) => { const m = ctx.param('mag'); return Number.isFinite(m) ? m : o.adapt ? adaptLim(v) : o.limit ?? NaN; };
  let glowMat: THREE.MeshBasicMaterial | null = null;
  if (dome && (o.limit !== undefined || Number.isFinite(ctx.param('mag')))) {
    const tex = canvasTex(4, 256, c => {
      const gr = c.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, 'rgb(22,30,48)'); gr.addColorStop(0.36, 'rgb(48,52,66)'); gr.addColorStop(0.47, 'rgb(150,112,72)');
      gr.addColorStop(0.5, 'rgb(190,135,80)'); gr.addColorStop(1, 'rgb(40,30,20)');
      c.fillStyle = gr; c.fillRect(0, 0, 4, 256);
    });
    glowMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending, opacity: 0 });
    const sph = new THREE.Mesh(new THREE.SphereGeometry(R * 0.97, 48, 24), glowMat);
    sph.rotation.x = Math.PI / 2;
    sph.renderOrder = -1;
    hz.add(sph);
  }

  // ---- the observer's world
  const cards: [Pair, V3][] = [[['N', '北'], [0, 1, 0]], [['E', '东'], [1, 0, 0]], [['S', '南'], [0, -1, 0]], [['W', '西'], [-1, 0, 0]]];
  if (dome) {
    // ground, a dark skyline of hills and trees, and a faint glow over the horizon
    const ground = new THREE.Mesh(new THREE.CircleGeometry(R * 1.5, 64), new THREE.MeshBasicMaterial({ color: '#030508' }));
    ground.position.z = -2;
    const Rn = rng(3), N = 360, Rs = R * 0.9, verts: number[] = [], idx: number[] = [];
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      let h = 0.9 + 0.8 * Math.sin(a * 3 + 1) + 0.5 * Math.sin(a * 7 + 2) + 0.35 * Math.sin(a * 13);
      if (Rn() < 0.22) h += 0.5 + Rn() * 1.2;
      h = Math.max(0.25, i === N ? 0.9 + 0.8 * Math.sin(1) + 0.5 * Math.sin(2) : h) * D2R;
      verts.push(Rs * Math.cos(a), Rs * Math.sin(a), -Rs * 0.1, Rs * Math.cos(a), Rs * Math.sin(a), Rs * Math.tan(h));
      if (i < N) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    sg.setIndex(idx);
    const skyline = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ color: '#05080d', side: THREE.DoubleSide }));
    const cv = document.createElement('canvas');
    cv.width = 4; cv.height = 64;
    const g2 = cv.getContext('2d')!, gr = g2.createLinearGradient(0, 0, 0, 64);
    gr.addColorStop(0, 'rgba(70,100,150,0)'); gr.addColorStop(1, 'rgba(70,100,150,0.32)');
    g2.fillStyle = gr; g2.fillRect(0, 0, 4, 64);
    const glowBand = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 0.95, R * 0.95 * Math.tan(14 * D2R), 64, 1, true),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending }));
    glowBand.rotation.x = Math.PI / 2;
    glowBand.position.z = R * 0.95 * Math.tan(7 * D2R);
    hz.add(glowBand, ground, skyline);
    for (const [t, d] of cards) addLabel(new THREE.Vector3(...d).multiplyScalar(R * 0.88).setZ(-R * 0.88 * Math.tan(1.5 * D2R)), t, C.gold, { big: true, min: -90 }, hz);
  } else {
    // horizon disc with the observer, the celestial sphere, the axis and the equator
    const disc = new THREE.Mesh(new THREE.CircleGeometry(R, 96), new THREE.MeshBasicMaterial({ color: '#2a4a3a', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
    const shell = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 32), new THREE.MeshBasicMaterial({ color: '#4a6fa5', transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide }));
    const person = new THREE.Group(), torso = ball(0.07, '#e8e2d0', { seg: 16 }), head = ball(0.055, '#e8e2d0', { seg: 16 });
    torso.scale.set(1, 1, 2.2); torso.position.z = 0.16; head.position.z = 0.38;
    person.add(torso, head);
    hz.add(shell, disc, line(circlePts(R, 128), '#7fbf9a', { opacity: 0.7 }), person, dirLight([1, -2, 3], 2, 0.5));
    for (const [t, d] of cards) addLabel(new THREE.Vector3(...d).multiplyScalar(R * 1.1), t, C.gold, { big: true, min: -90 }, hz);
    tilt.add(line([[0, 0, -R * 1.3], [0, 0, R * 1.3]], C.gold, { opacity: 0.75 }));
    if (o.equator !== false) {
      tilt.add(line(decCircle(0, R), C.teal, { opacity: 0.55 }));
      addLabel(new THREE.Vector3(R * Math.cos(-0.6), R * Math.sin(-0.6), 0), ['celestial equator', '天赤道'], C.teal, { t: 1, dy: 14 }, tilt);
    }
  }
  const south = latAt(o.clock?.from ?? 0) < 0;
  if (!dome || o.arc) {
    addLabel(new THREE.Vector3(0, 0, (south ? -1 : 1) * (dome ? R : R * 1.3)),
      south ? ['south celestial pole', '南天极'] : dome ? ['north celestial pole', '北天极'] : ['north celestial pole (Polaris)', '北天极（北极星）'], C.gold, { dy: -18, t: 0.4, min: -90 }, tilt);
  }

  // circumpolar zone and daily circles (outside)
  let cpLine: THREE.Line | null = null, cpDisc: THREE.Mesh | null = null, neverLine: THREE.Line | null = null, cpAnchor: THREE.Object3D | null = null, nvAnchor: THREE.Object3D | null = null;
  if (!dome && o.circumpolar) {
    cpLine = line(decCircle(50, R), C.gold, { opacity: 0.95 });
    cpDisc = new THREE.Mesh(new THREE.CircleGeometry(1, 96), new THREE.MeshBasicMaterial({ color: C.gold, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
    neverLine = line(decCircle(-50, R), '#8a94a6', { opacity: 0.6, dashed: true, dash: 0.12 });
    tilt.add(cpLine, cpDisc, neverLine);
    cpAnchor = addLabel(new THREE.Vector3(), ['circumpolar stars: never set', '拱极星：永不落下'], C.gold, { t: 1.4 }, tilt);
    nvAnchor = addLabel(new THREE.Vector3(), ['never rise', '永不升起'], '#aab4c6', { t: 1.8 }, tilt);
  }
  if (!dome && o.circles) {
    for (const n of ['Dubhe', 'Capella', 'Betelgeuse', 'Sirius', 'Antares']) {
      const s = cat.stars[cat.byName[n]];
      tilt.add(line(decCircle(Math.asin(s.p.z) / D2R, R * 1.001), '#c9d6ea', { opacity: 0.22 }));
    }
  }
  let arcLine: THREE.Line | null = null, arcLabel: Label | null = null, arcAnchor: THREE.Object3D | null = null, horiz: THREE.Line | null = null;
  if (o.arc) {
    arcLine = line(Array.from({ length: 49 }, () => new THREE.Vector3()), C.orange, { opacity: 0.95 });
    hz.add(arcLine);
    arcAnchor = anchor(new THREE.Vector3(), hz);
    arcLabel = ctx.label(arcAnchor, '', { c: C.orange, big: true, dx: dome ? 0 : 34 });
    if (!dome) { horiz = line([[0, 0, 0], [0, R, 0]], C.orange, { opacity: 0.6 }); hz.add(horiz); }
  }

  // ---- camera
  const fov0 = ctx.camera.fov;
  if (dome) {
    const [az, alt] = o.look ?? [0, 35];
    const d = new THREE.Vector3(Math.sin(az * D2R) * Math.cos(alt * D2R), Math.cos(az * D2R) * Math.cos(alt * D2R), Math.sin(alt * D2R));
    ctx.camera.fov = o.fov ?? 70;
    ctx.camera.updateProjectionMatrix();
    ctx.view(d.clone().negate().toArray() as V3, 10, d.clone().multiplyScalar(10).toArray() as V3, true);
  } else ctx.view([1.0, -1.75, 0.8], R * 2.9, [0, R * 0.05, R * 0.15], true);

  const a1 = new THREE.Vector3(), a2 = new THREE.Vector3(), hv = new THREE.Vector3(), up = new THREE.Vector3(0, 0, 1), tiltM = new THREE.Matrix4();
  let lastLat = NaN;
  return {
    update(v, _dt, el) {
      const ms = at(v), lat = latAt(v);
      if (dome) {
        sky.position.copy(ctx.camera.position); hz.position.copy(ctx.camera.position);
        for (const m of starMats) m.uniforms.uHz.value = ctx.camera.position.z - 1;
        if (mwMat) mwMat.uniforms.uHz.value = ctx.camera.position.z - 1;
      }
      const lim = limOf(v);
      if (Number.isFinite(lim)) {
        for (const m of starMats) m.uniforms.uLim.value = lim;
        if (mwMat) mwMat.uniforms.uA.value = clamp((lim - 4.6) / 1.5);
        if (glowMat) glowMat.opacity = 0.55 * clamp((6.6 - lim) / 4.5) ** 0.8;
      }
      if (meteors) {
        const attr = meteors.geometry.getAttribute('position') as THREE.BufferAttribute;
        met.forEach((m, i) => {
          const f = ((el - m.t0) % 4.5 + 4.5) % 4.5 / m.dur;
          const on = el >= m.t0 && f <= 1;
          const head = along(m.a, m.b, on ? clamp(f * 1.2) : 0).multiplyScalar(R * 0.995);
          const tail = along(m.a, m.b, on ? clamp(f * 1.2 - 0.45) : 0).multiplyScalar(R * 0.995);
          attr.setXYZ(i * 2, tail.x, tail.y, tail.z); attr.setXYZ(i * 2 + 1, head.x, head.y, head.z);
        });
        attr.needsUpdate = true;
      }
      if (lat !== lastLat) {
        lastLat = lat;
        tilt.matrix.copy(tiltBasis(lat, tiltM));
        tilt.matrixWorldNeedsUpdate = true;
        const cp = 90 - Math.abs(lat), sg = lat >= 0 ? 1 : -1;
        if (cpLine && cpDisc && neverLine && cpAnchor && nvAnchor) {
          setLine(cpLine, decCircle(sg * cp, R));
          setLine(neverLine, decCircle(-sg * cp, R));
          cpDisc.scale.setScalar(Math.max(1e-3, R * Math.cos(cp * D2R)));
          cpDisc.position.z = sg * R * Math.sin(cp * D2R);
          cpAnchor.position.set(-R * Math.cos(cp * D2R) * 0.2, 0, sg * R * Math.sin(cp * D2R));
          nvAnchor.position.set(0, 0, -sg * R * Math.sin(cp * D2R));
          cpLine.visible = neverLine.visible = cpDisc.visible = Math.abs(lat) > 0.5;
        }
        if (arcLine && arcLabel && arcAnchor) {
          const r = dome ? R * 0.97 : R * 0.5, a = Math.abs(lat), ys = lat >= 0 ? 1 : -1;
          setLine(arcLine, Array.from({ length: 49 }, (_, i) => { const t = (i / 48) * a * D2R; return new THREE.Vector3(0, ys * r * Math.cos(t), r * Math.sin(t)); }));
          if (horiz) setLine(horiz, [[0, 0, 0], [0, ys * R, 0]]);
          const m = (a / 2) * D2R;
          arcAnchor.position.set(0, ys * r * Math.cos(m), r * Math.sin(m));
          arcLabel.set([`${Math.round(a)}°`, `${Math.round(a)}°`]);
        }
      }
      const th = yearly ? gmst(ms0) + lon + (360 / 365.2422) * ((ms - ms0) / 864e5) : gmst(ms) + lon;
      spin.rotation.z = -th * D2R;
      if (trails) setTrails(th, Math.max(0, ((ms - ms0) / SID) * 360));
      for (const [i, l] of draws.entries()) drawIn(l, ramp(el, 0.6 + i * 0.9, o.pointer && i === 1 ? 1.6 : 0.8));
      if (dipLines) drawIn(dipLines, ramp(el, 0.2, 1.4));
      if (handle) {
        spin.updateMatrixWorld(true);
        a1.copy(dp(4)).multiplyScalar(R).applyMatrix4(spin.matrixWorld).sub(sky.position);
        a2.copy(dp(6)).multiplyScalar(R).applyMatrix4(spin.matrixWorld).sub(sky.position);
        hv.subVectors(a2, a1);
        a2.addScaledVector(hv, 0.25).add(sky.position);
        handle.set(a2, hv.multiplyScalar(0.9));
        handle.visible = ramp(el, 1.2, 0.3) > 0;
      }
      // hide labels below the horizon
      for (const x of labels) {
        x.obj.getWorldPosition(wp).sub(sky.position);
        x.l.on = x.min <= -90 || wp.normalize().dot(up) > Math.sin(x.min * D2R);
      }
    },
    readout(v) {
      const ms = at(v), lat = latAt(v), lim = limOf(v);
      if (Number.isFinite(lim)) {
        const n = starsBrighter(lim) / 2, nr = n < 100 ? Math.round(n / 5) * 5 : Math.round(n / 50) * 50;
        const m = lim.toFixed(1), bt = bortle(lim);
        return o.adapt ? [`limit ${m} · ~${nr} stars`, `极限 ${m} 等 · 约 ${nr} 颗星`]
          : [`Bortle ${bt} · ~${nr} stars`, `波特尔 ${bt} 级 · 约 ${nr} 颗星`];
      }
      if (unit === 'lat') return [`pole altitude ${Math.round(Math.abs(lat))}°`, `${lat >= 0 ? '北极星' : '南天极'}高度 ${Math.round(Math.abs(lat))}°`];
      if (unit === 'date') {
        const s = season(ms, tz, lat < 0);
        return yearly ? [`${s[0]} · ${hhmm(ms0, tz)} every evening`, `${s[1]} · 每晚 ${hhmm(ms0, tz)}`] : [`local time ${hhmm(ms, tz)}`, `当地时间 ${hhmm(ms, tz)}`];
      }
      if (unit === 'hour') return [`local time ${hhmm(ms, tz)}`, `当地时间 ${hhmm(ms, tz)}`];
      return '';
    },
    dispose() { ctx.camera.fov = fov0; ctx.camera.updateProjectionMatrix(); },
  };
};
export default kit;

/** The Earth, an observer at latitude φ with their horizon, and the parallel sight lines to the far-away Polaris. */
function earthKit(ctx: KitCtx, latAt: (v: number) => number): KitRun {
  const g = ctx.root;
  g.add(dirLight([1.2, -1.6, 0.6], 2.4, 0.3));
  const spinG = new THREE.Group(), earth = body('earth', 1, '#4a6a8a');
  spinG.rotation.z = -1.2;
  spinG.add(earth);
  g.add(spinG);
  const onTop = <T extends THREE.Line>(l: T) => { (l.material as THREE.Material).depthTest = false; l.renderOrder = 5; return l; };
  g.add(line([[0, 0, -1.35], [0, 0, 1]], C.gold, { opacity: 0.5 }));
  g.add(line([[0, 0, 1], [0, 0, 3.3]], C.gold, { opacity: 0.85, dashed: true, dash: 0.08 }));
  g.add(line(circlePts(1.004, 128), C.teal, { opacity: 0.8 }));
  ctx.label(new THREE.Vector3(0, 0, 3.45), ['to Polaris (very far away)', '射向北极星（极其遥远）'], { c: C.gold, big: true });
  ctx.label(new THREE.Vector3(-1, -0.2, -0.02), ['equator', '赤道'], { c: C.teal, dx: -30 });
  // observer: horizon plane and a little person, turned so their "up" is the local vertical
  const obs = new THREE.Group();
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshBasicMaterial({ color: '#5fae7e', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  const person = new THREE.Group(), torso = ball(0.035, '#f1e6c8', { seg: 12 }), head = ball(0.028, '#f1e6c8', { seg: 12 });
  torso.scale.set(1, 1, 2.2); torso.position.z = 0.08; head.position.z = 0.19;
  person.add(torso, head);
  obs.add(plane, person);
  g.add(obs);
  const horizon = onTop(line([[0, 0, 0], [0, 0, 0]], '#9be3b4', { opacity: 0.9 }));
  const sight = line([[0, 0, 0], [0, 0, 1]], C.gold, { opacity: 0.95, dashed: true, dash: 0.08 });
  const arcP = onTop(line(Array.from({ length: 33 }, () => new THREE.Vector3()), C.orange));
  const radius = onTop(line([[0, 0, 0], [1, 0, 0]], '#ffffff', { opacity: 0.6 }));
  const eqR = onTop(line([[0, 0, 0], [1, 0, 0]], '#ffffff', { opacity: 0.6 }));
  const arcO = onTop(line(Array.from({ length: 33 }, () => new THREE.Vector3()), C.orange));
  g.add(horizon, sight, arcP, radius, eqR, arcO);
  const aP = new THREE.Object3D(), aO = new THREE.Object3D(), aH = new THREE.Object3D();
  g.add(aP, aO, aH);
  const lP = ctx.label(aP, '', { c: C.orange, big: true }), lO = ctx.label(aO, '', { c: C.orange });
  ctx.label(aH, ['horizon (north)', '地平面（向北）'], { c: '#9be3b4', dy: 14 });
  ctx.view([0.12, -1, 0.18], 7.2, [0.35, 0, 1.0], true);
  const P = new THREE.Vector3(), T = new THREE.Vector3(), z = new THREE.Vector3(0, 0, 1);
  let last = NaN;
  return {
    update(v) {
      const lat = clamp(latAt(v), 0, 90);
      if (lat === last) return;
      last = lat;
      const f = lat * D2R;
      P.set(Math.cos(f), 0, Math.sin(f));
      T.set(-Math.sin(f), 0, Math.cos(f));
      obs.position.copy(P).multiplyScalar(1.005);
      obs.quaternion.setFromUnitVectors(z, P);
      setLine(horizon, [P.clone().addScaledVector(T, -0.7), P.clone().addScaledVector(T, 0.8)]);
      setLine(sight, [P, P.clone().addScaledVector(z, 2.4)]);
      const r = 0.42;
      setLine(arcP, Array.from({ length: 33 }, (_, i) => { const a = (90 + (i / 32) * lat) * D2R; return P.clone().add(new THREE.Vector3(r * Math.cos(a), 0, r * Math.sin(a))); }));
      const am = (90 + lat / 2) * D2R;
      aP.position.copy(P).add(new THREE.Vector3(r * 1.5 * Math.cos(am), 0, r * 1.5 * Math.sin(am)));
      aH.position.copy(P).addScaledVector(T, 0.85);
      setLine(radius, [[0, 0, 0], P]);
      setLine(arcO, Array.from({ length: 33 }, (_, i) => { const a = (i / 32) * f; return new THREE.Vector3(0.35 * Math.cos(a), 0, 0.35 * Math.sin(a)); }));
      aO.position.set(0.5 * Math.cos(f / 2), 0, 0.5 * Math.sin(f / 2));
      lP.set([`Polaris altitude ${Math.round(lat)}°`, `北极星高度 ${Math.round(lat)}°`]);
      lO.set([`latitude ${Math.round(lat)}°`, `纬度 ${Math.round(lat)}°`]);
    },
    readout(v) { const l = Math.round(clamp(latAt(v), 0, 90)); return [`Polaris altitude = latitude = ${l}°`, `北极星高度 = 纬度 = ${l}°`]; },
  };
}

/**
 * A flat polar star chart in the old Chinese style (the Suzhou stone chart of 1247): the north celestial pole in the
 * centre, declination +90° … −55° outward, seen from below (as the sky looks overhead), with the inner circle of
 * always-visible stars (内规), the equator, the ecliptic, the 28 mansions' hour-lines through their determinative
 * stars, the Four Symbols around the rim and the Three Enclosures.
 */
function chartKit(ctx: KitCtx, o: Opts): KitRun {
  const Rc = 5, DMIN = -55;
  const g = new THREE.Group();
  g.rotation.x = Math.PI / 2;
  ctx.root.add(g);
  // the Vermilion Bird (south) at the bottom, the Azure Dragon (east) on the left, as overhead when facing south
  const th = (ra: number) => (50 - ra) * D2R;
  const rad = (dec: number) => ((90 - dec) / (90 - DMIN)) * Rc;
  const xy = (ra: number, dec: number, z = 0) => { const r = rad(dec), t = th(ra); return new THREE.Vector3(r * Math.cos(t), r * Math.sin(t), z); };
  const fromVec = (p: THREE.Vector3, z = 0) => xy(Math.atan2(p.y, p.x) / D2R, Math.asin(clamp(p.z, -1, 1)) / D2R, z);
  const lab = (p: THREE.Vector3, text: Pair, c: string, opt: { big?: boolean; dot?: boolean; t?: number; dy?: number; dx?: number } = {}) => {
    const a = new THREE.Object3D(); a.position.copy(p); g.add(a); return ctx.label(a, text, { c, ...opt });
  };

  const disc = new THREE.Mesh(new THREE.CircleGeometry(Rc * 1.0, 128), new THREE.MeshBasicMaterial({ color: '#0b1424' }));
  disc.position.z = -0.02;
  g.add(disc, ring(Rc, Rc * 1.012, '#c9b07a', 0.9));
  // inner circle: stars that never set at the old capitals (~35° N)
  g.add(line(circlePts(rad(55), 128), '#c9b07a', { opacity: 0.55, dashed: true, dash: 0.08 }));
  g.add(line(circlePts(rad(0), 160), C.teal, { opacity: 0.55 }));
  const eps = 23.44 * D2R;
  const ecl = Array.from({ length: 181 }, (_, i) => {
    const l = (i / 180) * Math.PI * 2;
    return xy(Math.atan2(Math.sin(l) * Math.cos(eps), Math.cos(l)) / D2R, Math.asin(Math.sin(eps) * Math.sin(l)) / D2R, 0.002);
  });
  g.add(line(ecl, C.gold, { opacity: 0.55, dashed: true, dash: 0.1 }));
  lab(xy(30, 0), ['celestial equator', '天赤道'], C.teal, { dy: 12, t: 0.8 });
  lab(xy(132, 21.5), ['ecliptic', '黄道'], C.gold, { dy: -12, t: 1 });
  lab(xy(140, 55), ['inner circle: stars that never set', '内规：恒显圈'], '#c9b07a', { t: 1.2, dy: 12 });
  // the pole is a small cross (Polaris, 0.7° away, carries the dot); its label sits just below
  const pc = Rc * 0.025;
  g.add(line([[-pc, 0, 0.006], [pc, 0, 0.006]], C.gold, { opacity: 0.9 }), line([[0, -pc, 0.006], [0, pc, 0.006]], C.gold, { opacity: 0.9 }));
  lab(new THREE.Vector3(0, 0, 0), ['north celestial pole', '北天极'], C.gold, { dy: 18 });

  // stars
  const cat = catalogue(), pr = Math.min(devicePixelRatio, ctx.low ? 1 : 2);
  const flat = cat.stars.filter(s => s.p.z > Math.sin(DMIN * D2R) && s.mag < 5).map(s => ({ ...s, p: fromVec(s.p, 0.01) }));
  const mansionStars = MANSIONS.map(([, , ra, dec, mag]) => ({ p: xy(ra, dec, 0.012), mag: Math.min(mag, 4.2), col: new THREE.Color('#fff4e0') }));
  g.add(starPoints([...flat, ...mansionStars], 1, 0.85, 1, pr));

  // the Big Dipper
  const uma = cat.idx.uma, dp = (i: number) => fromVec(cat.stars[uma[i]].p, 0.005);
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(DIPPER_LINES.flatMap(([a, b]) => [dp(a), dp(b)])),
    new THREE.LineBasicMaterial({ color: C.gold, transparent: true, opacity: 0.85, depthWrite: false })));
  lab(dp(0).clone().lerp(dp(4), 0.5), ['Big Dipper (Beidou)', '北斗'], C.gold, { dy: -14, t: 0.6 });

  // the Three Enclosures
  if (o.enclosures) {
    const encC = '#e599f7';
    ENCLOSURES.forEach((e, k) => {
      const c = eq(e.ra, e.dec), a = new THREE.Vector3(0, 0, 1).cross(c), b = new THREE.Vector3();
      if (a.lengthSq() < 1e-6) a.set(1, 0, 0);
      a.normalize(); b.crossVectors(c, a);
      const pts = Array.from({ length: 73 }, (_, i) => { const t = (i / 72) * Math.PI * 2, r = e.r * D2R; return fromVec(c.clone().multiplyScalar(Math.cos(r)).addScaledVector(a, Math.sin(r) * Math.cos(t)).addScaledVector(b, Math.sin(r) * Math.sin(t)), 0.004); });
      const l = line(pts, encC, { opacity: 0.85, dashed: true, dash: 0.07 });
      g.add(l);
      const lp = k === 0 ? xy(250, 58) : xy(e.ra, e.dec + e.r * 0.15);
      lab(lp, e.name, encC, { big: true, t: 0.8 + k * 0.4 });
    });
  }

  // the 28 mansions: hour-lines from the pole through each determinative star, names in the rim band
  const showM = !!o.mansions;
  MANSIONS.forEach(([zh, py, ra], i) => {
    const sy = SYMBOLS[Math.floor(i / 7)];
    if (showM) {
      g.add(line([xy(ra, 55, 0.003), xy(ra, DMIN, 0.003)], sy.c, { opacity: 0.38 }));
      const next = MANSIONS[(i + 1) % 28][2];
      let w = (next - ra + 360) % 360;
      if (w > 180) w = 0;
      const tiny = w < 3, mid = tiny ? ra : ra + w / 2;
      if (o.mansions === 'names') lab(xy(mid, tiny ? -30 : -45), [py, zh], sy.c, { t: 0.4 + i * 0.05, dx: tiny ? -10 : 0 });
    }
  });
  // the Four Symbols: arcs around the rim, each a pick target
  if (o.symbols) {
    SYMBOLS.forEach((sy, k) => {
      const ra0 = MANSIONS[k * 7][2], ra1 = MANSIONS[(k * 7 + 7) % 28][2], span = (ra1 - ra0 + 360) % 360;
      const t0 = th(ra0 + span), arc = new THREE.Mesh(new THREE.RingGeometry(Rc * 1.03, Rc * 1.1, 48, 1, t0, span * D2R),
        new THREE.MeshBasicMaterial({ color: sy.c, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
      arc.scale.setScalar(0.999);
      g.add(arc);
      ctx.pickable(arc, sy.tag);
      const m = ra0 + span / 2;
      lab(xy(m, DMIN).multiplyScalar(1.2), sy.name, sy.c, { big: true, t: 0.6 + k * 0.3 });
    });
  }
  for (const m of o.marks ?? []) lab(xy(m.ra, m.dec, 0.01), m.name, m.c ?? C.pink, { dot: true, t: 1 });
  ctx.view([0, -1, 0], 15.5, [0, 0, 0], true);
  return { update() { /* static */ } };
}
