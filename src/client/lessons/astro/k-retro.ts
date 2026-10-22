/**
 * Kit "retro": Mars' retrograde loop around its January 2025 opposition, from real positions.
 * - `helio`: the Sun, Earth's and Mars' orbits, and sight lines from Earth through Mars to a band of background stars;
 *   Earth overtakes Mars on the inside track, so Mars seems to slide backwards against the stars.
 * - `geo`: what we see from Earth: Mars' path among the stars of Gemini and Cancer, a loop drawn day by day.
 * - `epicycle`: Ptolemy's model: Earth at the centre, Mars on an epicycle whose centre runs along a deferent. With the
 *   epicycle the size of Earth's orbit this reproduces the same loop.
 * - `venus`: Venus around the Sun with Earth, and how Venus looks from Earth: full phases and a big change in size,
 *   Galileo's evidence for the Sun-centred model.
 * The clock is a date (`date`) or days from the opposition (Mars, 16 Jan 2025) or the inferior conjunction (Venus, 23 Mar 2025).
 */
import * as THREE from 'three';
import { planetGeo, sunGeo, AU_KM, type PlanetId } from '../../../shared/lib/astro/ephem.ts';
import { C } from '../kit.ts';
import { D2R, body, canvasTex, clamp, glow, line, ramp, rng, setLine, star, sunLight } from './draw.ts';
import { catalogue, starPoints, type Star } from './k-sky.ts';
import type { AstroClock, KitFactory, KitRun, Label, Pair } from './types.ts';

export interface Opts {
  mode: 'helio' | 'geo' | 'epicycle' | 'venus';
  /** helio: sight lines every this many days (default 12) */
  every?: number;
}

const DAY = 864e5;
const OPP = Date.UTC(2025, 0, 16);
const VIC = Date.UTC(2025, 2, 23);
/** stretch of ecliptic latitude, so the loop's small up-and-down shows */
const LAT_X = 2.5;
const EPS = 23.44 * D2R;

/** Heliocentric ecliptic positions (AU) of Earth and a planet, from the apparent geocentric ones. */
function helio(id: PlanetId, ms: number, e: THREE.Vector3, p: THREE.Vector3): { lon: number; lat: number; dist: number } {
  const s = sunGeo(ms), r = s.distKm / AU_KM;
  e.set(-r * Math.cos(s.lon * D2R), -r * Math.sin(s.lon * D2R), 0);
  const g = planetGeo(id, ms), cb = Math.cos(g.lat * D2R);
  p.set(e.x + g.distAu * cb * Math.cos(g.lon * D2R), e.y + g.distAu * cb * Math.sin(g.lon * D2R), e.z + g.distAu * Math.sin(g.lat * D2R));
  return { lon: g.lon, lat: g.lat, dist: g.distAu };
}

interface Track { d0: number; n: number; E: THREE.Vector3[]; P: THREE.Vector3[]; lon: number[]; lat: number[]; dist: number[] }
const cache = new Map<string, Track>();
/** Daily positions from day d0 to d1 around t0 (unwrapped geocentric longitude). */
function track(id: PlanetId, t0: number, d0: number, d1: number): Track {
  const key = `${id}|${t0}|${d0}|${d1}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const n = d1 - d0 + 1, t: Track = { d0, n, E: [], P: [], lon: [], lat: [], dist: [] };
  let prev = NaN;
  for (let i = 0; i < n; i++) {
    const e = new THREE.Vector3(), p = new THREE.Vector3(), g = helio(id, t0 + (d0 + i) * DAY, e, p);
    let lon = g.lon;
    if (!Number.isNaN(prev)) lon = prev + ((((lon - prev) % 360) + 540) % 360) - 180;
    prev = lon;
    t.E.push(e); t.P.push(p); t.lon.push(lon); t.lat.push(g.lat); t.dist.push(g.dist);
  }
  cache.set(key, t);
  return t;
}
/** Interpolated sample at day d. */
function at<T extends THREE.Vector3 | number>(arr: T[], tr: Track, d: number, out?: THREE.Vector3): T {
  const x = clamp(d - tr.d0, 0, tr.n - 1), i = Math.min(tr.n - 2, Math.floor(x)), f = x - i;
  const a = arr[i], b = arr[i + 1];
  if (typeof a === 'number') return (a + ((b as number) - a) * f) as T;
  return (out ?? new THREE.Vector3()).lerpVectors(a as THREE.Vector3, b as THREE.Vector3, f) as T;
}

/** The constellation stars in ecliptic coordinates. */
function eclStars(): { lon: number; lat: number; s: Star }[] {
  const ce = Math.cos(EPS), se = Math.sin(EPS);
  return catalogue().stars.map(s => {
    const y = s.p.y * ce + s.p.z * se, z = -s.p.y * se + s.p.z * ce;
    return { lon: ((Math.atan2(y, s.p.x) / D2R) + 360) % 360, lat: Math.asin(clamp(z, -1, 1)) / D2R, s };
  });
}

const PRO = new THREE.Color('#e9eef6'), RET = new THREE.Color(C.orange);

const kit: KitFactory<Opts & { clock?: AstroClock }> = (ctx, o) => {
  const venus = o.mode === 'venus';
  const t0 = venus ? VIC : OPP, id: PlanetId = venus ? 'venus' : 'mars';
  const toDay = (v: number) => o.clock?.unit === 'date' ? (v - t0) / DAY : v;
  const c0 = Math.floor(toDay(o.clock?.from ?? -150)), c1 = Math.ceil(toDay(o.clock?.to ?? 150));
  const tr = track(id, t0, Math.min(c0, -60) - 2, Math.max(c1, venus ? 600 : 700) + 2);
  const pr = Math.min(devicePixelRatio, ctx.low ? 1 : 2);
  // the opposition (conjunction) direction points up the screen
  const lonOpp = Math.atan2(tr.E[-tr.d0].y, tr.E[-tr.d0].x) / D2R;
  const turn = new THREE.Group();
  turn.rotation.z = (90 - lonOpp) * D2R;
  ctx.root.add(turn);
  const live: { l: Label; obj: THREE.Object3D }[] = [];
  const lbl = (obj: THREE.Object3D, text: Pair, c: string, o2: { big?: boolean; dy?: number; dx?: number; t?: number } = {}) => { const l = ctx.label(obj, text, { c, ...o2 }); live.push({ l, obj }); return l; };
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  const retroAt = (d: number) => at(tr.lon, tr, d + 0.5) < at(tr.lon, tr, d - 0.5);

  const run: KitRun = o.mode === 'geo' ? geoRun() : o.mode === 'epicycle' ? epiRun() : venus ? venusRun() : helioRun();
  return { update: (v, dt, el) => run.update(toDay(v), dt, el), readout: v => run.readout?.(toDay(v)) ?? '' };

  // ------------------------------------------------------------------ heliocentric: sight lines to the stars
  function helioRun() {
    const S = 2, Rs = 9.5;
    turn.add(sunLight([0, 0, 0], 2.8, 0.15), star(0.26, '#ffd27a', 5));
    const orbitE = line(tr.E.slice(-tr.d0, -tr.d0 + 366).map(p => p.clone().multiplyScalar(S)), C.blue, { opacity: 0.55 });
    const orbitM = line(tr.P.slice(-tr.d0, -tr.d0 + 688).map(p => p.clone().multiplyScalar(S)), C.red, { opacity: 0.5 });
    const earth = body('earth', 0.13, C.blue), mars = body('mars', 0.1, '#c1440e');
    turn.add(orbitE, orbitM, earth, mars);
    lbl(earth, ['Earth', '地球'], C.blue, { dy: -18 });
    lbl(mars, ['Mars', '火星'], C.red, { dy: -18 });
    const sunA = new THREE.Object3D(); turn.add(sunA);
    lbl(sunA, ['Sun', '太阳'], C.gold, { dy: 26 });
    // background stars on a far band, and a faint band to read as "the sky"
    const band = eclStars().filter(x => Math.abs(x.lat) < 9 && x.s.mag < 5).map(x => ({ ...x.s, p: new THREE.Vector3(Math.cos(x.lon * D2R) * Math.cos(x.lat * LAT_X * D2R), Math.sin(x.lon * D2R) * Math.cos(x.lat * LAT_X * D2R), Math.sin(x.lat * LAT_X * D2R)) }));
    const R2 = rng(9);
    for (let i = 0; i < (ctx.low ? 150 : 400); i++) {
      const lon = R2() * 360, lat = (R2() * 2 - 1) * 9 * LAT_X;
      band.push({ p: new THREE.Vector3(Math.cos(lon * D2R) * Math.cos(lat * D2R), Math.sin(lon * D2R) * Math.cos(lat * D2R), Math.sin(lat * D2R)), mag: 4.5 + R2() * 2, col: new THREE.Color('#fff6ea') });
    }
    turn.add(starPoints(band, Rs, 1, 1, pr));
    const strip = new THREE.Mesh(new THREE.CylinderGeometry(Rs * 1.01, Rs * 1.01, Rs * Math.sin(9 * LAT_X * D2R) * 2, 128, 1, true),
      new THREE.MeshBasicMaterial({ color: '#2a3d66', transparent: true, opacity: 0.18, side: THREE.BackSide, depthWrite: false }));
    strip.rotation.x = Math.PI / 2;
    turn.add(strip);
    const bandA = new THREE.Object3D();
    bandA.position.set(Rs * Math.cos((lonOpp + 32) * D2R), Rs * Math.sin((lonOpp + 32) * D2R), Rs * 0.33);
    turn.add(bandA);
    lbl(bandA, ['distant stars', '遥远的恒星背景'], C.ice);
    // sight lines (every few days, fading) and Mars' apparent path on the band
    const every = o.every ?? 12, nS = Math.floor((c1 - c0) / every) + 1;
    const hits: THREE.Vector3[] = [], marks: THREE.Vector3[] = [];
    const sightOf = (d: number, e: THREE.Vector3, h: THREE.Vector3) => {
      at(tr.E, tr, d, e).multiplyScalar(S);
      const p = at(tr.P, tr, d, tmp).multiplyScalar(S), dir = tmp2.subVectors(p, e).normalize();
      dir.z *= LAT_X; dir.normalize();
      const b = e.dot(dir), t = -b + Math.sqrt(b * b - e.lengthSq() + Rs * Rs);
      return h.copy(e).addScaledVector(dir, t);
    };
    for (let i = 0; i < nS; i++) { const e = new THREE.Vector3(), h = new THREE.Vector3(); sightOf(c0 + i * every, e, h); marks.push(e); hits.push(h); }
    const oldLines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(marks.flatMap((e, i) => [e, hits[i]])),
      new THREE.LineBasicMaterial({ color: '#9fb4d8', transparent: true, opacity: 0.22, depthWrite: false }));
    const pathCols = new Float32Array(nS * 3);
    for (let i = 0; i < nS; i++) (retroAt(c0 + i * every) ? RET : PRO).toArray(pathCols, i * 3);
    const path = line(hits, '#ffffff', { opacity: 0.95 });
    path.geometry.setAttribute('color', new THREE.BufferAttribute(pathCols, 3));
    (path.material as THREE.LineBasicMaterial).vertexColors = true;
    const dots = new THREE.Points(new THREE.BufferGeometry().setFromPoints(hits), new THREE.PointsMaterial({ color: C.orange, size: 4 * pr, sizeAttenuation: false, transparent: true, opacity: 0.9 }));
    const eDots = new THREE.Points(new THREE.BufferGeometry().setFromPoints(marks), new THREE.PointsMaterial({ color: C.blue, size: 3.5 * pr, sizeAttenuation: false, transparent: true, opacity: 0.8 }));
    const mDots = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: nS }, (_, i) => at(tr.P, tr, c0 + i * every).multiplyScalar(S))),
      new THREE.PointsMaterial({ color: C.red, size: 3.5 * pr, sizeAttenuation: false, transparent: true, opacity: 0.8 }));
    const sight = line([[0, 0, 0], [0, 0, 0]], C.gold, { opacity: 0.95 });
    const now = new THREE.Points(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3()]), new THREE.PointsMaterial({ color: C.gold, size: 9 * pr, sizeAttenuation: false, transparent: true }));
    const nowGlow = glow('#ffb36b', 0.9, 0.9);
    turn.add(oldLines, path, dots, eDots, mDots, sight, now, nowGlow);
    lbl(nowGlow, ['Mars seen here', '看到的火星位置'], C.gold, { dy: -20 });
    ctx.view([0, -0.95, 1.05], 13, [0, 4.2, 0], true);
    const e = new THREE.Vector3(), h = new THREE.Vector3();
    return {
      update(v: number, _dt: number, el: number) {
        at(tr.E, tr, v, earth.position).multiplyScalar(S);
        at(tr.P, tr, v, mars.position).multiplyScalar(S);
        earth.rotation.y = v * 0.3; mars.rotation.y = v * 0.3;
        sightOf(v, e, h);
        setLine(sight, [e, h]);
        (now.geometry.getAttribute('position') as THREE.BufferAttribute).setXYZ(0, h.x, h.y, h.z);
        now.geometry.getAttribute('position').needsUpdate = true;
        nowGlow.position.copy(h);
        const k = clamp(Math.floor((v - c0) / every) + 1, 0, nS), show = ramp(el, 0.3, 0.6) > 0 ? k : 0;
        oldLines.geometry.setDrawRange(0, show * 2);
        path.geometry.setDrawRange(0, show);
        dots.geometry.setDrawRange(0, show);
        eDots.geometry.setDrawRange(0, show);
        mDots.geometry.setDrawRange(0, show);
      },
      readout: (v: number): Pair => retroAt(v) ? ['Mars moves backwards (retrograde)', '火星逆行（向西）'] : ['Mars moves forwards (prograde)', '火星顺行（向东）'],
    };
  }

  // ------------------------------------------------------------------ geocentric: the loop among the stars
  function geoRun() {
    const k = 0.15, lon0 = tr.lon[-tr.d0], lat0 = 2.6;
    const X = (lon: number) => -(lon - lon0) * k, Z = (lat: number) => (lat - lat0) * LAT_X * k;
    const W = 54, Hh = 6.6;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(W * k, Hh * LAT_X * k), new THREE.MeshBasicMaterial({ color: '#0a1428', transparent: true, opacity: 0.55, depthWrite: false }));
    panel.rotation.x = Math.PI / 2;
    panel.position.y = 0.05;
    const g = new THREE.Group();
    ctx.root.add(g);
    g.add(panel);
    const st = eclStars();
    const near = st.filter(x => Math.abs(((x.lon - lon0 + 540) % 360) - 180) < W / 2 - 0.5 && Math.abs(x.lat - lat0) < Hh / 2 - 0.2);
    const R2 = rng(4), faint: Star[] = [];
    for (let i = 0; i < (ctx.low ? 120 : 320); i++) faint.push({ p: new THREE.Vector3((R2() - 0.5) * W * k, 0, (R2() - 0.5) * Hh * LAT_X * k), mag: 4.8 + R2() * 1.6, col: new THREE.Color('#fff4e6') });
    const brightS: Star[] = near.map(x => ({ ...x.s, p: new THREE.Vector3(X(lon0 + (((x.lon - lon0 + 540) % 360) - 180)), 0, Z(x.lat)) }));
    g.add(starPoints([...brightS, ...faint], 1, 1.1, 1, pr));
    for (const x of near) if (x.s.name && ['Pollux', 'Castor', 'Regulus', 'Alhena', 'Procyon'].includes(x.s.name.en)) {
      const a = new THREE.Object3D();
      a.position.set(X(lon0 + (((x.lon - lon0 + 540) % 360) - 180)), 0, Z(x.lat));
      g.add(a);
      lbl(a, [x.s.name.en, x.s.name.zh], C.ice, { dy: -14 });
    }
    // the ecliptic and the directions
    g.add(line([[X(lon0 + W / 2), 0.02, Z(0)], [X(lon0 - W / 2), 0.02, Z(0)]], C.gold, { opacity: 0.35, dashed: true, dash: 0.1 }));
    const eA = new THREE.Object3D(), wA = new THREE.Object3D(), ecA = new THREE.Object3D();
    eA.position.set(X(lon0 + W / 2 - 3), 0, Z(lat0 - Hh / 2 + 0.6)); wA.position.set(X(lon0 - W / 2 + 3), 0, Z(lat0 - Hh / 2 + 0.6));
    ecA.position.set(X(lon0 - W / 2 + 5), 0, Z(0));
    g.add(eA, wA, ecA);
    lbl(eA, ['← east', '← 东'], '#aab4c6'); lbl(wA, ['west →', '西 →'], '#aab4c6'); lbl(ecA, ['ecliptic', '黄道'], C.gold, { dy: 12 });
    // Mars' path: all of it faintly, the travelled part coloured (orange while retrograde)
    const n = c1 - c0 + 1, pts: THREE.Vector3[] = [], cols = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const d = c0 + i; pts.push(new THREE.Vector3(X(at(tr.lon, tr, d)), -0.01, Z(at(tr.lat, tr, d)))); (retroAt(d) ? RET : PRO).toArray(cols, i * 3); }
    const ghost = line(pts, '#7f8aa0', { opacity: 0.18 });
    const trail = line(pts, '#ffffff', { opacity: 1 });
    trail.geometry.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    (trail.material as THREE.LineBasicMaterial).vertexColors = true;
    const ticks = new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts.filter((_, i) => (c0 + i) % 15 === 0)),
      new THREE.PointsMaterial({ color: '#cfd8e6', size: 3.5 * pr, sizeAttenuation: false, transparent: true, opacity: 0.8 }));
    const marsG = new THREE.Group(), md = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 10), new THREE.MeshBasicMaterial({ color: '#ff8a5c' }));
    marsG.add(md, glow('#ff7a45', 0.6, 0.9));
    g.add(ghost, trail, ticks, marsG);
    lbl(marsG, ['Mars', '火星'], C.red, { dy: -20, big: true });
    // the stationary points and the opposition
    const notes: { d: number; text: Pair }[] = [{ d: 0, text: ['opposition 16 Jan 2025', '冲日 2025年1月16日'] }];
    for (let d = c0 + 1; d < c1; d++) if (retroAt(d) !== retroAt(d - 1)) notes.push({ d, text: retroAt(d) ? ['stationary: turns back', '留：开始逆行'] : ['stationary: forwards again', '留：恢复顺行'] });
    const noteL = notes.map(nt => {
      const a = new THREE.Object3D();
      a.position.set(X(at(tr.lon, tr, nt.d)), 0, Z(at(tr.lat, tr, nt.d)));
      g.add(a);
      return { ...nt, l: ctx.label(a, nt.text, { c: nt.d === 0 ? C.gold : C.orange, dy: nt.d === 0 ? 22 : -22 }) };
    });
    ctx.view([0, -1, 0.06], 7.2, [0, 0, 0.1], true);
    return {
      update(v: number) {
        const i = clamp(Math.floor(v - c0) + 1, 1, n);
        trail.geometry.setDrawRange(0, i);
        marsG.position.set(X(at(tr.lon, tr, v)), -0.02, Z(at(tr.lat, tr, v)));
        for (const nt of noteL) nt.l.on = v >= nt.d;
      },
      readout: (v: number): Pair => retroAt(v) ? ['retrograde (westward)', '逆行（向西）'] : ['prograde (eastward)', '顺行（向东）'],
    };
  }

  // ------------------------------------------------------------------ Ptolemy: deferent and epicycle
  function epiRun() {
    const S = 1.5;
    turn.add(sunLight([0, -6, 6], 1.6, 0.35));
    const earth = body('earth', 0.16, C.blue);
    turn.add(earth);
    lbl(earth, ['Earth (at rest, at the centre)', '地球（静止，在中心）'], C.blue, { dy: 26 });
    const def = line(tr.P.slice(-tr.d0, -tr.d0 + 688).map(p => p.clone().multiplyScalar(S)), C.gold, { opacity: 0.55, dashed: true, dash: 0.12 });
    const epi = line(Array.from({ length: 97 }, () => new THREE.Vector3()), C.violet, { opacity: 0.85 });
    const spoke = line([[0, 0, 0], [0, 0, 0]], C.violet, { opacity: 0.6 });
    const toC = line([[0, 0, 0], [0, 0, 0]], C.gold, { opacity: 0.35 });
    const sight = line([[0, 0, 0], [0, 0, 0]], '#cfd8e6', { opacity: 0.35, dashed: true, dash: 0.1 });
    const cen = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 8), new THREE.MeshBasicMaterial({ color: C.gold }));
    const mars = body('mars', 0.1, '#c1440e');
    const n = c1 - c0 + 1, pts: THREE.Vector3[] = [], cols = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const d = c0 + i; pts.push(at(tr.P, tr, d).sub(at(tr.E, tr, d, tmp)).multiplyScalar(S)); (retroAt(d) ? RET : PRO).toArray(cols, i * 3); }
    const trail = line(pts, '#ffffff');
    trail.geometry.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    (trail.material as THREE.LineBasicMaterial).vertexColors = true;
    turn.add(def, epi, spoke, toC, sight, cen, mars, trail);
    const defA = new THREE.Object3D();
    const dpos = tr.P[-tr.d0 + 170].clone().multiplyScalar(S);
    defA.position.copy(dpos);
    turn.add(defA);
    lbl(defA, ['deferent', '均轮'], C.gold);
    const epiA = new THREE.Object3D(); turn.add(epiA);
    lbl(epiA, ['epicycle', '本轮'], C.violet);
    lbl(mars, ['Mars', '火星'], C.red, { dy: -18 });
    ctx.view([0, -0.55, 1], 8.8, [0, 1.3, 0], true);
    const c = new THREE.Vector3(), e = new THREE.Vector3(), p = new THREE.Vector3();
    return {
      update(v: number) {
        at(tr.P, tr, v, c).multiplyScalar(S);
        at(tr.E, tr, v, e).multiplyScalar(S);
        p.copy(c).sub(e);
        const r = e.length();
        setLine(epi, Array.from({ length: 97 }, (_, i) => { const a = (i / 96) * Math.PI * 2; return new THREE.Vector3(c.x + r * Math.cos(a), c.y + r * Math.sin(a), c.z); }));
        setLine(spoke, [c, p]);
        setLine(toC, [[0, 0, 0], c]);
        setLine(sight, [[0, 0, 0], p.clone().multiplyScalar(1.6)]);
        cen.position.copy(c);
        mars.position.copy(p);
        epiA.position.copy(c).add(new THREE.Vector3(r * 0.75, -r * 0.75, 0));
        trail.geometry.setDrawRange(0, clamp(Math.floor(v - c0) + 1, 1, n));
      },
      readout: (v: number): Pair => retroAt(v) ? ['retrograde loop', '逆行（打圈）'] : ['prograde', '顺行'],
    };
  }

  // ------------------------------------------------------------------ Venus: phases and size seen from Earth
  function venusRun() {
    const S = 2.6;
    turn.add(sunLight([0, 0, 0], 3, 0.06), star(0.26, '#ffd27a', 5));
    const orbitE = line(tr.E.slice(-tr.d0, -tr.d0 + 366).map(q => q.clone().multiplyScalar(S)), C.blue, { opacity: 0.5 });
    const orbitV = line(tr.P.slice(-tr.d0, -tr.d0 + 226).map(q => q.clone().multiplyScalar(S)), C.gold, { opacity: 0.5 });
    const earth = body('earth', 0.13, C.blue), ven = body('venus', 0.12, '#e8d3a0');
    const sight = line([[0, 0, 0], [0, 0, 0]], '#cfd8e6', { opacity: 0.5, dashed: true, dash: 0.1 });
    turn.add(orbitE, orbitV, earth, ven, sight);
    lbl(earth, ['Earth', '地球'], C.blue, { dy: 22 });
    lbl(ven, ['Venus', '金星'], C.gold, { dy: -20 });
    const sunA = new THREE.Object3D(); turn.add(sunA);
    lbl(sunA, ['Sun', '太阳'], C.gold, { dy: 26 });
    // the view in a small telescope: a disc redrawn when the phase or size changes
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const tex = canvasTex(1, 1, () => {});
    tex.image = cv;
    const disc = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    const scope = new THREE.Group();
    scope.add(disc);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.98, 1, 96), new THREE.MeshBasicMaterial({ color: '#8fa3c4', transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }));
    scope.add(ring);
    ctx.root.add(scope);
    const scopeL = new THREE.Object3D(); scope.add(scopeL); scopeL.position.set(0, -1.3, 0);
    ctx.label(scopeL, ['seen from Earth (telescope)', '从地球上看（望远镜）'], { c: C.ice });
    let key = '';
    const paint = (k: number, litLeft: boolean, size: number) => {
      const g = cv.getContext('2d')!, c = 128, r = 120 * size;
      g.clearRect(0, 0, 256, 256);
      g.fillStyle = 'rgba(40,46,60,0.55)';
      g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill();
      // the limb on the lit side, then the terminator (a half-ellipse) back to the top
      const sL = litLeft ? -1 : 1, w = Math.abs(2 * k - 1) * r, sT = k > 0.5 ? -sL : sL;
      g.fillStyle = '#f4e7c4';
      g.beginPath();
      for (let i = 0; i <= 48; i++) { const a = -Math.PI / 2 + (i / 48) * Math.PI; g.lineTo(c + sL * r * Math.cos(a), c + r * Math.sin(a)); }
      for (let i = 0; i <= 48; i++) { const a = Math.PI / 2 - (i / 48) * Math.PI; g.lineTo(c + sT * w * Math.cos(a), c + r * Math.sin(a)); }
      g.closePath();
      g.fill();
      tex.needsUpdate = true;
    };
    const e = new THREE.Vector3(), q = new THREE.Vector3();
    let info = { k: 1, as: 10 };
    ctx.view([0, -0.6, 1], 10.5, [0, 0.9, 0], true);
    return {
      update(v: number) {
        at(tr.E, tr, v, e); at(tr.P, tr, v, q);
        earth.position.copy(e).multiplyScalar(S); ven.position.copy(q).multiplyScalar(S);
        setLine(sight, [earth.position, ven.position]);
        // phase angle at Venus between the Sun and Earth
        const toSun = q.clone().negate().normalize(), toEarth = e.clone().sub(q), d = toEarth.length();
        const ang = Math.acos(clamp(toSun.dot(toEarth.normalize()), -1, 1)), k = (1 + Math.cos(ang)) / 2;
        const as = 2 * Math.atan(6051.8 / (d * AU_KM)) / D2R * 3600;
        // Sun east of Venus on the sky (larger longitude) → lit limb on the east = left, as seen facing south
        const ve = q.clone().sub(e), cross = ve.x * -e.y - ve.y * -e.x;
        const size = clamp(as / 66, 0.14, 1);
        info = { k, as };
        const nk = `${Math.round(k * 60)}|${cross > 0}|${Math.round(size * 60)}`;
        if (nk !== key) { key = nk; paint(k, cross > 0, size); }
        // keep the telescope view in a fixed spot of the screen-ish world (upper right of the orbits)
        scope.position.set(4.2, 0, 3.6);
        scope.quaternion.copy(ctx.camera.quaternion);
        disc.scale.setScalar(2);
        ven.rotation.y = v * 0.05; earth.rotation.y = v * 0.3;
      },
      readout: (): Pair => [`lit ${Math.round(info.k * 100)}% · ${Math.round(info.as)}″ across`, `被照亮 ${Math.round(info.k * 100)}% · 视直径 ${Math.round(info.as)}″`],
    };
  }
};
export default kit;
