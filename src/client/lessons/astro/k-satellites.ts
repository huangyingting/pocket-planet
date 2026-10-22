/**
 * Kit "satellites": the Earth (turning) with satellite orbits at true scale (Earth radius = 1 unit; GEO at 6.6).
 * - `overview`: Tiangong (LEO), a polar orbit, a BeiDou MEO orbit and the geostationary ring: higher is slower.
 * - `leo`: the Tiangong space station, ~390 km up, once round in ~92 min (with its ground track if `track`).
 * - `polar`: a sun-synchronous polar orbit; its ground track shifts west each orbit as the Earth turns beneath.
 * - `geo`: geostationary satellites over the equator turn with the Earth and stay above the same place.
 * - `beidou`: the BeiDou-3 constellation: 24 MEO satellites in 3 planes, 3 GEO and 3 IGSO.
 * - `moon`: Chang'e's trip: parking orbit, Earth–Moon transfer orbit, lunar orbit (distances shrunk, see note).
 * - `mars`: Tianwen-1's transfer ellipse (Hohmann) from Earth to Mars around the Sun.
 * Clock: hours (`hour`) for Earth orbits, days (`day`) for the Moon and Mars trips. Pickable tags: 'geo', 'tiangong',
 * 'polar', 'meo'.
 */
import * as THREE from 'three';
import { body, D2R, dirLight, ellipsePts, glow, line, orbitPos, star, starfield, sunLight, circlePts } from './draw.ts';
import type { AstroClock, KitCtx, KitFactory, KitRun, Pair } from './types.ts';
import { C } from '../kit.ts';

export interface Opts {
  mode: 'overview' | 'leo' | 'polar' | 'geo' | 'beidou' | 'moon' | 'mars';
  /** draw the ground track (leo, polar) */
  track?: boolean;
  /** name the orbits (default true; off for "tap the …" questions) */
  labels?: boolean;
}

const LEAD = 0.9;
/** sidereal day (h) */
const SID = 23.934;
const RE = 6371;
/** circular period (h) at r Earth radii */
const period = (r: number) => 1.4056 * r ** 1.5;
const rOf = (altKm: number) => 1 + altKm / RE;
/** Earth's turn at time t (h): longitude 0 faces +x at t = 0 */
const earthAngle = (t: number) => (2 * Math.PI * t) / SID;

interface Sat {
  r: number; inc: number; raan: number; u0: number; P: number;
  c: string; g: THREE.Group; trail?: THREE.Line; tlen: number;
}
const satPos = (s: Pick<Sat, 'r' | 'inc' | 'raan' | 'u0' | 'P'>, t: number, out: THREE.Vector3) => {
  const u = s.u0 + (2 * Math.PI * t) / s.P, ci = Math.cos(s.inc), si = Math.sin(s.inc);
  const x = s.r * Math.cos(u), y = s.r * Math.sin(u) * ci, z = s.r * Math.sin(u) * si;
  const cr = Math.cos(s.raan), sr = Math.sin(s.raan);
  return out.set(x * cr - y * sr, x * sr + y * cr, z);
};
function orbitLine(s: Pick<Sat, 'r' | 'inc' | 'raan'>, c: string, opacity: number, dashed = false): THREE.Line {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 160; i++) pts.push(satPos({ ...s, u0: 0, P: 160 }, i, new THREE.Vector3()));
  return line(pts, c, { opacity, dashed, dash: 0.08 * s.r });
}
function satMesh(size: number, c: string): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.SphereGeometry(size, 12, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  g.add(m, glow(c, size * 7, 0.95));
  return g;
}
/** a fading trail (additive: darker = more transparent) */
function trailLine(n: number, c: string): THREE.Line {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const col = new Float32Array(n * 3), cc = new THREE.Color(c);
  for (let i = 0; i < n; i++) { const f = (i / (n - 1)) ** 1.5; col.set([cc.r * f, cc.g * f, cc.b * f], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  l.frustumCulled = false;
  return l;
}

const kit: KitFactory<Opts & { clock?: AstroClock }> = (ctx, o) => {
  ctx.root.add(starfield(ctx.low ? 1200 : 2500));
  const c = !!o.clock;
  if (o.mode === 'moon') return moonTrip(ctx, c);
  if (o.mode === 'mars') return marsTrip(ctx, c);
  return earthOrbits(ctx, o, c);
};
export default kit;

// ------------------------------------------------------------------------------------------------ Earth orbits

function earthOrbits(ctx: KitCtx, o: Opts, clocked: boolean): KitRun {
  ctx.root.add(dirLight([1, -0.55, 0.35], 2.3, 0.2));
  const spin = new THREE.Group();
  const earth = body('earth', 1, '#4b77a8', ctx.low ? 512 : 1024);
  spin.add(earth);
  ctx.root.add(spin, glow('#6fb6ff', 2.6, 0.2));
  const sats: Sat[] = [];
  const close = o.mode === 'leo' || o.mode === 'polar';
  const size = close ? 0.022 : 0.06;
  const add = (r: number, incDeg: number, raanDeg: number, u0Deg: number, c: string, o2: { P?: number; trail?: number; orbit?: number; tag?: string } = {}) => {
    const s: Sat = { r, inc: incDeg * D2R, raan: raanDeg * D2R, u0: u0Deg * D2R, P: o2.P ?? period(r), c, g: satMesh(size, c), tlen: o2.trail ?? 0.18 };
    ctx.root.add(s.g);
    if (s.tlen > 0) { s.trail = trailLine(48, c); ctx.root.add(s.trail); }
    if (o2.orbit) ctx.root.add(orbitLine(s, c, o2.orbit));
    if (o2.tag) ctx.pickable(s.g.children[0], o2.tag);
    sats.push(s);
    return s;
  };
  const mk = (s: Sat, text: Pair, dy = -16, t = 0.6) => { if (o.labels !== false) ctx.label(s.g, text, { c: s.c, dy, t }); };
  const rTG = rOf(390), rSSO = rOf(700), rMEO = rOf(21528), rGEO = rOf(35786);
  /** ground track (Earth-fixed) of one satellite over the last `win` hours */
  let track: { s: Sat; l: THREE.Line; win: number } | null = null;
  const geoMarks: { s: Sat; l: THREE.Line }[] = [];

  switch (o.mode) {
    case 'overview': {
      const tg = add(rTG, 41.5, 20, 30, C.white, { orbit: 0.55, tag: 'tiangong', trail: 0.1 });
      const po = add(rSSO, 98, 100, 200, C.teal, { orbit: 0.45, tag: 'polar', trail: 0.1 });
      const meo = add(rMEO, 55, 150, 110, C.violet, { orbit: 0.5, tag: 'meo' });
      ctx.root.add(orbitLine({ r: rGEO, inc: 0, raan: 0 }, C.gold, 0.55));
      const geo = add(rGEO, 0, 0, 110, C.gold, { tag: 'geo', P: SID, trail: 0.06 });
      add(rGEO, 0, 0, 230, C.gold, { P: SID, trail: 0.06 });
      add(rGEO, 0, 0, 350, C.gold, { P: SID, trail: 0.06 });
      mk(tg, ['Tiangong · 400 km · 92 min', '天宫 · 400 千米 · 92 分钟'], 16, 0.5);
      mk(po, ['polar · 700 km · 99 min', '极地轨道 · 700 千米 · 99 分钟'], -16, 0.9);
      mk(meo, ['BeiDou MEO · 21 500 km · 12.9 h', '北斗中圆轨道 · 2.15 万千米 · 12.9 小时'], -16, 1.3);
      mk(geo, ['geostationary · 35 786 km · 24 h', '地球静止轨道 · 35 786 千米 · 24 小时'], -16, 1.7);
      ctx.view([0.35, -1, 0.42], 22, [0, 0, 0], true);
      break;
    }
    case 'leo': {
      const tg = add(rTG, 41.5, 30, 60, C.white, { orbit: 0.5, tag: 'tiangong', trail: 0.2 });
      mk(tg, ['Tiangong', '天宫空间站'], -14, 0.4);
      if (o.track) track = { s: tg, l: trailLine(500, C.gold), win: 6 };
      ctx.view([0.5, -1, 0.55], 4.6, [0, 0, 0], true);
      break;
    }
    case 'polar': {
      const po = add(rSSO, 98.2, 60, 0, C.teal, { orbit: 0.5, tag: 'polar', trail: 0.2 });
      mk(po, ['sun-synchronous polar orbit', '太阳同步轨道（极地轨道）'], -14, 0.4);
      track = { s: po, l: trailLine(600, C.gold), win: 5 };
      ctx.view([0.7, -1, 0.9], 4.8, [0, 0, 0], true);
      break;
    }
    case 'geo': {
      ctx.root.add(orbitLine({ r: rGEO, inc: 0, raan: 0 }, C.gold, 0.5));
      const lons = [80, 110.5, 140];
      for (const [i, lon] of lons.entries()) {
        const s = add(rGEO, 0, 0, lon, C.gold, { P: SID, trail: 0.05, tag: i === 1 ? 'geo' : undefined });
        // a line down to the point below it (turns with the Earth)
        const l = line([[0, 0, 0], [1, 0, 0]], C.gold, { opacity: 0.35, dashed: true, dash: 0.12 });
        ctx.root.add(l);
        geoMarks.push({ s, l });
      }
      const sub = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 6), new THREE.MeshBasicMaterial({ color: C.gold }));
      sub.position.set(Math.cos(110.5 * D2R) * 1.005, Math.sin(110.5 * D2R) * 1.005, 0);
      spin.add(sub);
      mk(geoMarks[1].s, ['geostationary · 35 786 km', '地球静止轨道 · 35 786 千米'], -16, 0.6);
      if (o.labels !== false) ctx.label(sub, ['always the same spot', '始终在同一地点上空'], { c: C.gold, dy: 16, t: 1.2 });
      const tg = add(rTG, 41.5, 30, 60, C.white, { orbit: 0.4, trail: 0.15, tag: 'tiangong' });
      mk(tg, ['Tiangong: 16 laps a day', '天宫：每天绕约 16 圈'], 16, 1.6);
      ctx.view([0.2, -1, 0.5], 21, [0, 0, 0], true);
      break;
    }
    case 'beidou': {
      for (let pl = 0; pl < 3; pl++) {
        ctx.root.add(orbitLine({ r: rMEO, inc: 55 * D2R, raan: pl * 120 * D2R }, C.teal, 0.3));
        for (let k = 0; k < 8; k++) add(rMEO, 55, pl * 120, k * 45 + pl * 15, C.teal, { trail: 0.06, tag: pl === 0 && k === 0 ? 'meo' : undefined });
      }
      ctx.root.add(orbitLine({ r: rGEO, inc: 0, raan: 0 }, C.gold, 0.4));
      for (const lon of [80, 110.5, 140]) add(rGEO, 0, 0, lon, C.gold, { P: SID, trail: 0.04, tag: lon === 110.5 ? 'geo' : undefined });
      for (let k = 0; k < 3; k++) {
        const s = add(rGEO, 55, 118 + k * 120, -k * 120, C.pink, { P: SID, trail: 0.06 });
        ctx.root.add(orbitLine(s, C.pink, 0.28));
      }
      const m0 = sats[0], g0 = sats[25], i0 = sats[27];
      mk(m0, ['MEO ×24 · 21 500 km', '中圆轨道 ×24 · 2.15 万千米'], -16, 0.6);
      mk(g0, ['GEO ×3', '地球静止轨道 ×3'], -16, 1);
      mk(i0, ['IGSO ×3', '倾斜地球同步轨道 ×3'], -16, 1.4);
      ctx.view([0.4, -1, 0.5], 23, [0, 0, 0], true);
      break;
    }
  }
  if (track) spin.add(track.l);
  const p = new THREE.Vector3(), q = new THREE.Vector3();
  const N = 48;
  return {
    update(v, _dt, el) {
      const t = clocked ? v : Math.max(0, el - LEAD) * 0.5;
      spin.rotation.z = earthAngle(t);
      for (const s of sats) {
        satPos(s, t, s.g.position);
        if (s.trail) {
          const a = s.trail.geometry.getAttribute('position') as THREE.BufferAttribute;
          for (let i = 0; i < N; i++) { satPos(s, t - ((N - 1 - i) / (N - 1)) * s.tlen * s.P, p); a.setXYZ(i, p.x, p.y, p.z); }
          a.needsUpdate = true;
        }
      }
      for (const g of geoMarks) {
        q.copy(g.s.g.position).setLength(1.01);
        const a = g.l.geometry.getAttribute('position') as THREE.BufferAttribute;
        a.setXYZ(0, q.x, q.y, q.z); a.setXYZ(1, g.s.g.position.x, g.s.g.position.y, g.s.g.position.z); a.needsUpdate = true;
        g.l.computeLineDistances();
      }
      if (track) {
        const a = track.l.geometry.getAttribute('position') as THREE.BufferAttribute, n = a.count;
        const t0 = Math.max(0, t - track.win);
        for (let i = 0; i < n; i++) {
          const ts = t0 + ((t - t0) * i) / (n - 1);
          satPos(track.s, ts, p);
          // into the Earth-fixed frame
          const ang = -earthAngle(ts), c = Math.cos(ang), s = Math.sin(ang);
          q.set(p.x * c - p.y * s, p.x * s + p.y * c, p.z).setLength(1.006);
          a.setXYZ(i, q.x, q.y, q.z);
        }
        a.needsUpdate = true;
      }
    },
    readout(v) {
      if (o.mode === 'geo' || o.mode === 'beidou' || o.mode === 'overview') {
        const deg = Math.round(((v / SID) * 360) % 360);
        return [`Earth has turned ${deg}°`, `地球已自转 ${deg}°`];
      }
      const n = (v / period(o.mode === 'leo' ? rTG : rSSO)).toFixed(1);
      return [`${n} orbits`, `已绕地球 ${n} 圈`];
    },
  };
}

// ------------------------------------------------------------------------------------------------ to the Moon

function moonTrip(ctx: KitCtx, clocked: boolean): KitRun {
  // distances shrunk to half, the Earth and the Moon drawn ~2.4× too big, so the trip fits
  const D = 30, RP = 1.7, TLI = 0.5, FLY = 4.5, PP = 0.25, PL = 0.35;
  const A = (RP + D) / 2, E = (D - RP) / (D + RP);
  const W = (2 * Math.PI) / 27.32;
  ctx.root.add(dirLight([0.3, -1, 0.3], 2.4, 0.18));
  const earth = body('earth', 1.2, '#4b77a8');
  const moon = body('moon', 0.42, '#a0a0a0');
  ctx.root.add(earth, moon, glow('#6fb6ff', 3.2, 0.2));
  ctx.root.add(line(circlePts(D, 160), '#9aa7b4', { opacity: 0.25, dashed: true, dash: 0.6 }));
  const g = new THREE.Group();
  g.rotation.z = Math.PI;
  const xfer = line(ellipsePts(A, E, 200).slice(0, 101), C.gold, { opacity: 0.7 });
  g.add(xfer);
  ctx.root.add(g);
  ctx.root.add(line(circlePts(RP, 64), C.teal, { opacity: 0.5 }));
  const lunar = line(circlePts(0.8, 64), C.teal, { opacity: 0.6 });
  ctx.root.add(lunar);
  const probe = satMesh(0.09, '#fff3c4');
  ctx.root.add(probe);
  ctx.label(earth, ['Earth', '地球'], { c: '#8fc0ff', dy: 26 });
  ctx.label(moon, ['Moon', '月球'], { dy: 18 });
  ctx.label(probe, ['Chang’e', '嫦娥探测器'], { c: C.gold, dy: -14, t: 0.6 });
  ctx.label(new THREE.Vector3(D * 0.45, -9.4, 0), ['Earth–Moon transfer orbit', '地月转移轨道'], { c: C.gold, t: 1 });
  ctx.view([0, -0.55, 1], 44, [D * 0.45, 0, 0], true);
  const p = new THREE.Vector3();
  const tArr = TLI + FLY;
  return {
    update(v, _dt, el) {
      const t = clocked ? v : Math.max(0, el - LEAD) * 0.8;
      // the Moon reaches +x when the probe arrives
      const am = W * (t - tArr);
      moon.position.set(D * Math.cos(am), D * Math.sin(am), 0);
      moon.rotation.y = am;
      earth.rotation.y = t * 2 * Math.PI;
      lunar.position.copy(moon.position);
      if (t < TLI) {
        const a = Math.PI - (2 * Math.PI * (TLI - t)) / PP;
        probe.position.set(RP * Math.cos(a), RP * Math.sin(a), 0);
      } else if (t < tArr) {
        orbitPos(A, E, (0.5 * (t - TLI)) / FLY, p);
        probe.position.set(-p.x, -p.y, 0);
        if (probe.position.distanceTo(moon.position) < 0.8) probe.position.sub(moon.position).setLength(0.8).add(moon.position);
      } else {
        const a = Math.PI + (2 * Math.PI * (t - tArr)) / PL;
        probe.position.set(moon.position.x + 0.8 * Math.cos(a), moon.position.y + 0.8 * Math.sin(a), 0);
      }
    },
    readout(v) {
      const t = v;
      const km = t < TLI ? 0 : t < tArr ? Math.round((probe.position.length() / D) * 38.44) : 38;
      if (t < TLI) return ['parking orbit round the Earth', '环绕地球的停泊轨道'];
      if (t >= tArr) return ['in lunar orbit, 380 000 km from Earth', '进入环月轨道，距地球约 38 万千米'];
      return [`${km * 10 * 1000} km from Earth`.replace(/\B(?=(\d{3})+(?!\d))/g, ','), `距地球约 ${km} 万千米`];
    },
  };
}

// ------------------------------------------------------------------------------------------------ to Mars

function marsTrip(ctx: KitCtx, clocked: boolean): KitRun {
  const AU = 4, aE = 1, aM = 1.524, a = (aE + aM) / 2, e = (aM - aE) / (aM + aE);
  const HALF = 0.5 * a ** 1.5 * 365.25; // ≈ 259 days
  ctx.root.add(star(0.32, '#ffd27a', 5), sunLight([0, 0, 0], 2.8, 0.15));
  ctx.label(new THREE.Vector3(), ['Sun', '太阳'], { c: C.gold, dy: 24 });
  ctx.root.add(line(circlePts(aE * AU, 160), '#6fa8ff', { opacity: 0.5 }), line(circlePts(aM * AU, 160), '#e07a52', { opacity: 0.5 }));
  const xfer = line(ellipsePts(a * AU, e, 200).slice(0, 101), C.gold, { opacity: 0.85, dashed: true, dash: 0.25 });
  const trail = line(ellipsePts(a * AU, e, 200).slice(0, 101), C.gold, { opacity: 0.95 });
  ctx.root.add(xfer, trail);
  const earth = body('earth', 0.22, '#4b77a8'), mars = body('mars', 0.17, '#c1440e');
  const probe = satMesh(0.05, '#fff3c4');
  ctx.root.add(earth, mars, probe);
  ctx.label(earth, ['Earth', '地球'], { c: '#8fc0ff', dy: 18 });
  ctx.label(mars, ['Mars', '火星'], { c: '#ff9a72', dy: 18 });
  ctx.label(probe, ['Tianwen-1', '天问一号'], { c: C.gold, dy: -16, t: 0.6 });
  ctx.label(new THREE.Vector3(aE * AU, 0, 0), ['launch', '发射'], { dy: -16, dx: 30, t: 1 });
  ctx.label(new THREE.Vector3(-aM * AU, 0, 0), ['arrival', '到达'], { dy: -16, dx: -30, t: 1.2 });
  ctx.view([0, -0.5, 1], 19, [-0.5, 0, 0], true);
  const p = new THREE.Vector3();
  return {
    update(v, _dt, el) {
      const t = clocked ? v : Math.max(0, el - LEAD) * 25;
      const ae = (2 * Math.PI * t) / 365.25, am = Math.PI - (2 * Math.PI * (HALF - t)) / 687;
      earth.position.set(aE * AU * Math.cos(ae), aE * AU * Math.sin(ae), 0);
      mars.position.set(aM * AU * Math.cos(am), aM * AU * Math.sin(am), 0);
      earth.rotation.y = t * 0.5; mars.rotation.y = t * 0.5;
      const f = Math.min(1, t / HALF);
      if (t >= HALF) probe.position.copy(mars.position).add(p.set(0.22, 0, 0.12));
      else probe.position.copy(orbitPos(a * AU, e, f * 0.5, p));
      trail.geometry.setDrawRange(0, Math.round(101 * f));
    },
    readout(v) {
      if (v >= HALF) return ['arrived at Mars', '到达火星'];
      const d = orbitPos(a, e, Math.max(0, v / HALF) * 0.5, p).length().toFixed(2);
      return [`${d} AU from the Sun`, `距太阳 ${d} 天文单位`];
    },
  };
}
