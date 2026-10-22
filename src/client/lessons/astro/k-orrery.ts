/**
 * Kit "orrery": the Sun and the eight planets on their real (Keplerian) orbits, with distances compressed so the
 * whole system fits. Extras: terrestrial / giant / ice-giant colour groups, the asteroid and Kuiper belts, Ceres and
 * Pluto, a comet whose ion and dust tails point away from the Sun and grow near perihelion (with its dust stream),
 * the habitable zone, and the "lineup": the planets in a row at true relative size beside the Sun's limb.
 */
import * as THREE from 'three';
import { BODY, type BodyId } from '../../../shared/data/solar.ts';
import { C } from '../kit.ts';
import { D2R, body, circlePts, clamp, drawIn, fade, glow, keplerE, line, ramp, ring, rng, star, starfield, sunLight } from './draw.ts';
import type { KitFactory, Label, Pair } from './types.ts';

export type Planet = 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';
const PLANETS: Planet[] = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

export interface Opts {
  /** `orbits` (default): the system seen from above; `lineup`: the planets side by side at true relative size */
  mode?: 'orbits' | 'lineup';
  /** distance scale: `sqrt` (default, compressed) or `log` (squeezes the outer system more) */
  scale?: 'sqrt' | 'log';
  /** planets shown (default all eight) */
  planets?: Planet[];
  /** frame out to this distance from the Sun (AU); default: the outermost thing shown */
  extent?: number;
  /** name labels on the planets (default true) */
  labels?: boolean;
  /** colour the planets by group: terrestrial, gas giants, ice giants */
  groups?: boolean;
  /** the asteroid belt between Mars and Jupiter */
  belt?: boolean;
  /** the Kuiper belt beyond Neptune */
  kuiper?: boolean;
  /** the dwarf planets Ceres and Pluto */
  dwarfs?: boolean;
  /** a comet on an eccentric orbit, with ion and dust tails */
  comet?: 'encke' | 'halley';
  /** the comet's meteoroid stream along its orbit (a meteor shower where it meets Earth's orbit) */
  stream?: boolean;
  /** the habitable zone (green ring) */
  hz?: boolean;
  /** small chevrons showing that every planet goes round the same way */
  dir?: boolean;
  /** a line Sun → Earth marked "1 AU" */
  au?: boolean;
  /** the moment for clock-less steps and the start of `year` / `day` clocks (UTC ms; default 2025-01-01) */
  t0?: number;
  /** "not to scale" note under the system (default true) */
  note?: boolean;
}

const DAY = 864e5, YEAR = 365.25 * DAY, J2000 = Date.UTC(2000, 0, 1, 12);
const T0 = Date.UTC(2025, 0, 1);
const RE = 6371;

type Group = 'rock' | 'gas' | 'ice';
const GROUP: Record<Planet, Group> = { mercury: 'rock', venus: 'rock', earth: 'rock', mars: 'rock', jupiter: 'gas', saturn: 'gas', uranus: 'ice', neptune: 'ice' };
const GCOL: Record<Group, string> = { rock: C.orange, gas: C.gold, ice: C.teal };
const GNAME: Record<Group, Pair> = { rock: ['Terrestrial planets', '类地行星'], gas: ['Gas giants', '巨行星'], ice: ['Ice giants', '远日行星'] };
const PCOL: Record<string, string> = { mercury: '#b5aca3', venus: '#e8cf9c', earth: '#6ea8e8', mars: '#d9774b', jupiter: '#d8b48a', saturn: '#e6d29b', uranus: '#9fd8e0', neptune: '#5f7fe8', ceres: '#a8a29a', pluto: '#d8c8b0' };

interface CometEl { a: number; e: number; lp: number; tp: number; retro: boolean; name: Pair }
/** Comets: semi-major axis (AU), eccentricity, longitude of perihelion (deg), perihelion date; drawn in the ecliptic. */
const COMETS: Record<'encke' | 'halley', CometEl> = {
  encke: { a: 2.215, e: 0.848, lp: 161, tp: Date.UTC(2023, 9, 22), retro: false, name: ['Comet Encke', '恩克彗星'] },
  halley: { a: 17.83, e: 0.967, lp: 170, tp: Date.UTC(1986, 1, 9), retro: true, name: ['Halley’s Comet', '哈雷彗星'] },
};

/** Heliocentric ecliptic position (AU) from the JPL mean elements at instant `ms` (mean anomaly shifted by `dM`). */
function helio(id: BodyId, ms: number, out: THREE.Vector3, dM = 0): THREE.Vector3 {
  const k = BODY[id].kepler!, T = (ms - J2000) / (36525 * DAY);
  const a = k.a[0] + k.a[1] * T, e = k.e[0] + k.e[1] * T, I = (k.i[0] + k.i[1] * T) * D2R;
  const L = k.L[0] + k.L[1] * T, wb = k.peri[0] + k.peri[1] * T, O = (k.node[0] + k.node[1] * T) * D2R;
  const w = wb * D2R - O, M = (L - wb) * D2R + dM;
  const E = keplerE(((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), e);
  const x = a * (Math.cos(E) - e), y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(I), sI = Math.sin(I);
  return out.set(
    (cw * cO - sw * sO * cI) * x + (-sw * cO - cw * sO * cI) * y,
    (cw * sO + sw * cO * cI) * x + (-sw * sO + cw * cO * cI) * y,
    sw * sI * x + cw * sI * y,
  );
}

type O = Opts & { clock?: { unit: string } };
const kit: KitFactory<O> = (ctx, o) => {
  ctx.root.add(starfield(ctx.low ? 1200 : 2500));
  return o.mode === 'lineup' ? lineup(ctx, o) : orbits(ctx, o);
};
export default kit;

// ------------------------------------------------------------------------------------------------ orbits

const orbits: KitFactory<O> = (ctx, o) => {
  const root = ctx.root, low = ctx.low;
  const S = 4;
  /** AU → display units (compressed) */
  const sc = o.scale === 'log' ? (r: number) => S * 1.6 * Math.log10(1 + r / 0.25) / Math.log10(5) : (r: number) => S * Math.sqrt(r);
  const map = (p: THREE.Vector3) => { const r = p.length(); return r > 1e-9 ? p.multiplyScalar(sc(r) / r) : p; };
  const ids = o.planets ?? PLANETS;
  const unit = o.clock?.unit;
  const t0 = o.t0 ?? T0;
  const at = (v: number) => unit === 'date' ? v : unit === 'year' ? t0 + v * YEAR : unit === 'day' ? t0 + v * DAY : t0;
  const ms0 = at(0);

  root.add(sunLight([0, 0, 0], 2.8, 0.16));
  const sun = star(0.62, '#ffd27a', 5);
  root.add(sun);
  ctx.pickable(sun, 'sun');

  // planets and their orbits
  const bodies: { id: BodyId; m: THREE.Object3D; spin: number; orbit: THREE.Line }[] = [];
  const rOf = (id: BodyId) => (BODY[id].kind === 'dwarf' ? 0.06 : 0.1 * (BODY[id].radiusKm / RE) ** 0.42);
  const groupsOn = !!o.groups;
  const objs: Partial<Record<BodyId, THREE.Group>> = {};
  const add = (id: BodyId, color: string, opacity: number) => {
    const rDisp = rOf(id);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 256; i++) pts.push(map(helio(id, ms0, new THREE.Vector3(), (i / 256) * 2 * Math.PI)));
    const orbit = line(pts, color, { opacity });
    root.add(orbit);
    const g = new THREE.Group();
    const m = body(id, rDisp, PCOL[id]);
    g.add(m);
    const b = BODY[id];
    if (b.rings) {
      const rg = ring(rDisp * b.rings[0], rDisp * b.rings[1], id === 'saturn' ? '#d9c7a0' : '#9fc6cc', id === 'saturn' ? 0.55 : 0.18, 96);
      rg.rotation.x = (id === 'saturn' ? 27 : 82) * D2R;
      g.add(rg);
    }
    root.add(g);
    ctx.pickable(g, id);
    bodies.push({ id, m, spin: 24 / Math.max(5, Math.abs(b.rotationH)), orbit });
    objs[id] = g;
  };
  for (const id of ids) add(id, groupsOn ? GCOL[GROUP[id]] : '#8fa6c8', groupsOn ? 0.55 : 0.32);
  if (o.dwarfs) for (const id of ['ceres', 'pluto'] as const) add(id, '#c9b8e8', 0.3);

  const labels: Label[] = [];
  if (o.labels !== false) {
    ctx.label(new THREE.Vector3(0, 0, 0), ['Sun', '太阳'], { c: C.gold, dy: 26 });
    for (const id of Object.keys(objs) as BodyId[]) {
      const n = BODY[id].name;
      const c = groupsOn && id in GROUP ? GCOL[GROUP[id as Planet]] : BODY[id].kind === 'dwarf' ? C.violet : undefined;
      labels.push(ctx.label(objs[id]!, [n.en, n.zh ?? n.en], { c, dy: -13 - rOf(id) * 30 }));
    }
  }

  // group names, on the outermost orbit of each group (toward the viewer)
  if (groupsOn) {
    for (const gname of ['rock', 'gas', 'ice'] as Group[]) {
      const outer = [...ids].reverse().find(id => GROUP[id] === gname);
      if (!outer) continue;
      const r = sc(BODY[outer].kepler!.a[0]);
      ctx.label(new THREE.Vector3(r * 0.42, -r * 0.91, 0), GNAME[gname], { c: GCOL[gname], big: true, t: 0.8, dy: 16 });
    }
  }

  // asteroid belt (2.1 – 3.3 AU), each rock on its own Kepler circle
  let belt: { pts: THREE.Points; a: Float32Array; ph: Float32Array; n: Float32Array; z: Float32Array } | null = null;
  if (o.belt) {
    const N = low ? 700 : 1800, R = rng(11);
    const a = new Float32Array(N), ph = new Float32Array(N), n = new Float32Array(N), z = new Float32Array(N), cl = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = R();
      a[i] = 2.1 + 1.2 * (u < 0.5 ? Math.sqrt(u * 0.5) : 1 - Math.sqrt((1 - u) * 0.5));
      ph[i] = R() * Math.PI * 2;
      n[i] = (2 * Math.PI) / a[i] ** 1.5;
      z[i] = (R() - 0.5) * 0.25;
      const b = 0.45 + 0.4 * R();
      cl.set([b, b * 0.9, b * 0.78], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(cl, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: low ? 2 : 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false }));
    pts.frustumCulled = false;
    root.add(pts);
    belt = { pts, a, ph, n, z };
    ctx.label(new THREE.Vector3(-sc(2.8) * 0.74, -sc(2.8) * 0.68, 0), ['Asteroid belt', '小行星带'], { c: '#d8c8a8', t: 0.8 });
  }

  // Kuiper belt (30 – 50 AU)
  let kuiper: THREE.Points | null = null;
  if (o.kuiper) {
    const N = low ? 900 : 2400, R = rng(23), p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = sc(30 + 20 * R() ** 0.8), t = R() * Math.PI * 2;
      p.set([r * Math.cos(t), r * Math.sin(t), (R() - 0.5) * 1.4], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    kuiper = new THREE.Points(g, new THREE.PointsMaterial({ color: '#9fb4d8', size: 1.5, sizeAttenuation: false, transparent: true, opacity: 0.6, depthWrite: false }));
    root.add(kuiper);
    ctx.label(new THREE.Vector3(-sc(42) * 0.62, -sc(42) * 0.78, 0), ['Kuiper belt', '柯伊伯带'], { c: '#b8c8e8', big: true, t: 0.8 });
  }

  // habitable zone (roughly 0.95 – 1.37 AU for the Sun)
  let hz: THREE.Group | null = null;
  if (o.hz) {
    hz = new THREE.Group();
    const band = ring(sc(0.95), sc(1.37), C.green, 0.2, 160);
    band.position.z = -0.01;
    hz.add(band, line(circlePts(sc(0.95), 160), C.green, { opacity: 0.5 }), line(circlePts(sc(1.37), 160), C.green, { opacity: 0.5 }));
    root.add(hz);
    ctx.label(new THREE.Vector3(sc(1.16) * 0.5, -sc(1.16) * 0.87, 0), ['Habitable zone', '宜居带'], { c: C.green, big: true, t: 0.6 });
  }

  // direction chevrons on each orbit
  const chevrons: THREE.Group[] = [];
  if (o.dir) {
    for (const b of bodies) {
      if (!(b.id in GROUP)) continue;
      const r = sc(BODY[b.id].kepler!.a[0]);
      for (let k = 0; k < 3; k++) {
        const ch = new THREE.Group(), s = 0.1 + r * 0.02;
        const th = (k / 3) * Math.PI * 2 + 0.6 + r * 0.3;
        // a ">" pointing along +y (the direction of motion at angle 0)
        ch.add(line([[-s, -s, 0], [0, 0, 0], [s, -s, 0]], C.white, { opacity: 0.6 }));
        ch.position.set(r * Math.cos(th), r * Math.sin(th), 0);
        ch.rotation.z = th;
        root.add(ch);
        chevrons.push(ch);
      }
    }
  }

  // Sun–Earth line: 1 AU
  let auLine: THREE.Line | null = null;
  const auMid = new THREE.Object3D();
  if (o.au && objs.earth) {
    auLine = line([[0, 0, 0], [1, 0, 0]], C.gold, { opacity: 0.9, dashed: true, dash: 0.15 });
    root.add(auLine, auMid);
    ctx.label(auMid, ['1 AU ≈ 150 million km', '1 天文单位 ≈ 1.5 亿千米'], { c: C.gold, dy: -14, t: 0.8 });
  }

  // comet
  let comet: ReturnType<typeof makeComet> | null = null;
  if (o.comet) {
    comet = makeComet(ctx.low, COMETS[o.comet], sc, !!o.stream);
    root.add(comet.group);
    ctx.label(comet.head, COMETS[o.comet].name, { c: C.ice, dy: 16 });
    if (o.stream) ctx.label(comet.streamAnchor, ['Dust left along its orbit', '沿轨道散布的尘埃'], { c: '#d8c49a', t: 1.2 });
  }

  // frame
  const ext = o.extent ?? Math.max(
    ...ids.map(id => BODY[id].kepler!.a[0] * (1 + BODY[id].kepler!.e[0])),
    o.belt ? 3.3 : 0, o.kuiper ? 50 : 0, o.dwarfs ? 40 : 0, o.comet ? COMETS[o.comet].a * (1 + COMETS[o.comet].e) : 0, o.hz ? 1.5 : 0);
  const R = sc(ext) + 0.5;
  ctx.view([0, -1, 0.75], R * 2.15, [0, -R * 0.06, 0], true);
  if (o.note !== false) {
    const n: Pair = o.scale === 'log' ? ['Distances on a log scale; planets enlarged', '距离按对数比例；行星已放大'] : ['Not to scale: distances compressed, planets enlarged', '未按比例：距离已压缩，行星已放大'];
    ctx.label(new THREE.Vector3(0, -R, 0), n, { c: '#8c98a8', dy: 26 });
  }

  const orbitLines = bodies.map(b => b.orbit);
  return {
    update(v, dt, el) {
      const ms = at(v);
      orbitLines.forEach((l, i) => drawIn(l, ramp(el, 0.1 + i * 0.08, 1.2)));
      for (const b of bodies) {
        map(helio(b.id, ms, b.m.parent!.position));
        b.m.rotation.y += dt * b.spin;
      }
      if (belt) {
        const pos = belt.pts.geometry.getAttribute('position') as THREE.BufferAttribute, arr = pos.array as Float32Array;
        const yrs = (ms - T0) / YEAR;
        for (let i = 0; i < belt.a.length; i++) {
          const th = belt.ph[i] + belt.n[i] * yrs, r = sc(belt.a[i]);
          arr[i * 3] = r * Math.cos(th); arr[i * 3 + 1] = r * Math.sin(th); arr[i * 3 + 2] = belt.z[i];
        }
        pos.needsUpdate = true;
        fade(belt.pts, ramp(el, 0.6, 1.2));
      }
      if (kuiper) { kuiper.rotation.z = ((ms - T0) / YEAR) * 0.02; fade(kuiper, ramp(el, 0.8, 1.5)); }
      if (hz) fade(hz, ramp(el, 0.4, 1.2));
      for (const c of chevrons) fade(c, ramp(el, 1.2, 1));
      if (auLine && objs.earth) {
        const e = objs.earth.position, a = auLine.geometry.getAttribute('position');
        a.setXYZ(1, e.x, e.y, e.z);
        a.needsUpdate = true;
        auLine.computeLineDistances();
        auMid.position.copy(e).multiplyScalar(0.5);
      }
      comet?.update(ms, el);
    },
    readout() {
      if (!o.comet || !comet) return '';
      const n = COMETS[o.comet].name, d = comet.r.toFixed(2);
      return [`${n[0]}: ${d} AU from the Sun`, `${n[1]}距太阳 ${d} 天文单位`];
    },
  };
};

/** A comet: nucleus, coma, an ion tail straight away from the Sun and a broader, curved dust tail. */
function makeComet(low: boolean, el: CometEl, sc: (r: number) => number, withStream: boolean) {
  const group = new THREE.Group();
  const head = new THREE.Group();
  const coma = glow('#bfe4ff', 0.6, 0.8);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), new THREE.MeshBasicMaterial({ color: '#e8f4ff' })), coma);
  group.add(head);
  const P = el.a ** 1.5 * YEAR, b = el.a * Math.sqrt(1 - el.e * el.e), lp = el.lp * D2R;
  const cl = Math.cos(lp), sl = Math.sin(lp);
  const posAt = (ms: number, out: THREE.Vector3) => {
    let M = (((ms - el.tp) / P) % 1) * 2 * Math.PI;
    if (M < 0) M += 2 * Math.PI;
    const E = keplerE(M, el.e);
    const x = el.a * (Math.cos(E) - el.e), y = b * Math.sin(E) * (el.retro ? -1 : 1);
    out.set(x * cl - y * sl, x * sl + y * cl, 0);
    out.z = out.y * 0.12; // a slight tilt so the orbit reads as 3D
    return out;
  };
  const map = (p: THREE.Vector3) => { const r = p.length(); return r > 1e-9 ? p.multiplyScalar(sc(r) / r) : p; };
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 360; i++) {
    // sample evenly in eccentric anomaly so the perihelion end is smooth
    const E = (i / 360) * 2 * Math.PI, M = E - el.e * Math.sin(E);
    pts.push(map(posAt(el.tp + (M / (2 * Math.PI)) * P, new THREE.Vector3())));
  }
  group.add(line(pts, C.ice, { opacity: 0.32 }));
  // meteoroid stream: dust scattered along the orbit
  const streamAnchor = new THREE.Object3D();
  if (withStream) {
    const N = low ? 900 : 2400, R = rng(5), p = new Float32Array(N * 3), q = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const E = R() * 2 * Math.PI;
      posAt(el.tp + ((E - el.e * Math.sin(E)) / (2 * Math.PI)) * P, q);
      map(q);
      const s = 0.08 + q.length() * 0.02;
      p.set([q.x + (R() - 0.5) * s, q.y + (R() - 0.5) * s, q.z + (R() - 0.5) * s * 0.5], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    group.add(new THREE.Points(g, new THREE.PointsMaterial({ color: '#d8c49a', size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.5, depthWrite: false })));
    map(posAt(el.tp + P * 0.5, streamAnchor.position));
    group.add(streamAnchor);
  }
  // tails: particles streaming out of the head
  const NI = low ? 160 : 420, ND = low ? 220 : 600, N = NI + ND, R = rng(9);
  const seed = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) seed.set([R(), R() - 0.5, R() - 0.5], i * 3);
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const tails = new THREE.Points(g, new THREE.PointsMaterial({ size: low ? 2.4 : 2, sizeAttenuation: false, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  tails.frustumCulled = false;
  group.add(tails);
  const anti = new THREE.Vector3(), back = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3(), nx = new THREE.Vector3(), d = new THREE.Vector3();
  const Z = new THREE.Vector3(0, 0, 1);
  const api = {
    group, head, streamAnchor, r: 0,
    update(ms: number, t: number) {
      const h = posAt(ms, head.position);
      api.r = h.length();
      map(h);
      posAt(ms + DAY * 3, nx);
      map(nx);
      back.copy(head.position).sub(nx).normalize();
      anti.copy(head.position).normalize();
      side.crossVectors(anti, Z).normalize();
      up.crossVectors(side, anti).normalize();
      // activity rises steeply inside ~3 AU
      const k = clamp((3 - api.r) / 2.6) ** 1.5;
      const L = 0.2 + 3.4 * k;
      coma.scale.setScalar(0.22 + 0.9 * k);
      (coma.material as THREE.SpriteMaterial).opacity = 0.45 + 0.5 * k;
      for (let i = 0; i < N; i++) {
        const ion = i < NI, s1 = seed[i * 3 + 1], s2 = seed[i * 3 + 2];
        const f = (seed[i * 3] + t * (ion ? 0.35 : 0.16)) % 1;
        if (ion) {
          const w = L * 0.045 * (0.3 + f);
          d.copy(anti).multiplyScalar(L * 1.15 * f).addScaledVector(side, s1 * w).addScaledVector(up, s2 * w);
        } else {
          nx.copy(anti).addScaledVector(back, f * 0.8).normalize();
          d.copy(nx).multiplyScalar(L * 0.75 * f).addScaledVector(side, s1 * L * 0.16 * f).addScaledVector(up, s2 * L * 0.06 * f);
        }
        pos[i * 3] = head.position.x + d.x; pos[i * 3 + 1] = head.position.y + d.y; pos[i * 3 + 2] = head.position.z + d.z;
        const a = (1 - f) * (0.25 + 0.75 * k);
        if (ion) { col[i * 3] = 0.45 * a; col[i * 3 + 1] = 0.7 * a; col[i * 3 + 2] = a; }
        else { col[i * 3] = 0.85 * a; col[i * 3 + 1] = 0.75 * a; col[i * 3 + 2] = 0.55 * a; }
      }
      g.getAttribute('position').needsUpdate = true;
      g.getAttribute('color').needsUpdate = true;
    },
  };
  return api;
}

// ------------------------------------------------------------------------------------------------ lineup

const lineup: KitFactory<O> = (ctx, o) => {
  const root = ctx.root;
  const ids = o.planets ?? PLANETS;
  root.add(sunLight([-60, -40, 20], 2.6, 0.22));
  // Jupiter's radius = 1 unit
  const RJ = BODY.jupiter.radiusKm, rs = BODY.sun.radiusKm / RJ, gap = 0.3;
  let x = 0.3;
  const pos: number[] = [];
  for (const id of ids) {
    const b = BODY[id], r = b.radiusKm / RJ, w = b.rings ? r * (id === 'saturn' ? 2.1 : 1.3) : r;
    x += w;
    pos.push(x);
    x += w + gap;
  }
  const end = x - gap;
  // the Sun's limb: a huge glowing ball just off the left
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(rs, 128, 64), new THREE.MeshBasicMaterial({ color: '#ffcf70' }));
  sunBall.position.set(-rs, 0, 0);
  const halo = glow('#ffb347', rs * 2.4, 0.6);
  halo.position.copy(sunBall.position);
  root.add(halo, sunBall);
  ctx.pickable(sunBall, 'sun');
  ctx.label(new THREE.Vector3(-0.5, 0, 1.9), ['Sun (edge)', '太阳（边缘）'], { c: C.gold, dx: -30 });
  const meshes: THREE.Mesh[] = [];
  ids.forEach((id, i) => {
    const b = BODY[id], r = b.radiusKm / RJ;
    const g = new THREE.Group();
    g.position.set(pos[i], 0, 0);
    const m = body(id, r, PCOL[id]);
    g.add(m);
    if (b.rings) {
      const rg = ring(r * b.rings[0], r * b.rings[1], id === 'saturn' ? '#d9c7a0' : '#9fc6cc', id === 'saturn' ? 0.6 : 0.2, 96);
      rg.rotation.x = (id === 'saturn' ? 74 : 10) * D2R;
      rg.rotation.y = (id === 'saturn' ? -10 : 0) * D2R;
      g.add(rg);
    }
    root.add(g);
    ctx.pickable(g, id);
    meshes.push(m);
    if (o.labels !== false) {
      const big = r > 0.2;
      const c = o.groups ? GCOL[GROUP[id]] : undefined;
      ctx.label(new THREE.Vector3(pos[i], 0, -(big ? r : 0.1) - 0.1), [b.name.en, b.name.zh ?? b.name.en], { c, dy: 12 + (big ? 0 : (i % 2) * 18), t: 0.3 + i * 0.12 });
    }
  });
  const mid = end / 2;
  ctx.view([0, -1, 0.06], end * 0.6 + 1.5, [mid - 0.3, 0, -0.1], true);
  ctx.label(new THREE.Vector3(mid, 0, -1.3), ['Sizes to scale (distances not)', '大小按比例（距离不按比例）'], { c: '#8c98a8', dy: 40, t: 1.5 });
  return {
    update(_v, dt, el) {
      meshes.forEach((m, i) => {
        m.rotation.y += dt * (0.12 + 0.04 * i);
        m.parent!.scale.setScalar(0.001 + 0.999 * ramp(el, 0.2 + i * 0.12, 0.8));
      });
    },
  };
};
