/**
 * Kit "belts": the planetary pressure belts and wind belts on a globe (schematic; the heights of the cells are
 * hugely exaggerated).
 * - `cells`: the three-cell circulation in each hemisphere, drawn on the limb with flowing air, over the belts it
 *   makes (`single`: one big cell per hemisphere, as on a planet that did not spin and had a uniform surface)
 * - `belts`: the seven pressure belts as coloured bands and the six wind belts as flowing arrows; every band is
 *   pickable (`eq-low`, `subhigh-n`, `subhigh-s`, `sublow-n`, `sublow-s`, `polar-n`, `polar-s`, and the wind belts
 *   `trades-n`, `trades-s`, `west-n`, `west-s`, `east-n`, `east-s`)
 * - `season`: a clock in days of the year moves the overhead Sun and, about a month later, the belts (±5°)
 */
import * as THREE from 'three';
import { D2R, body, clamp, lerp, line, ramp, rng, setLine } from './draw.ts';
import { glowTexture } from '../../sky/common.ts';
import type { KitCtx, KitFactory, Pair } from './types.ts';

export interface Opts {
  mode: 'cells' | 'belts' | 'season';
  /** `cells`: one cell per hemisphere instead of three */
  single?: boolean;
  /** shift the belts north (+) or south (−), in degrees (overridden by a `season` clock) */
  shift?: number;
  /** hide the belt and wind names (for "pick it" questions) */
  bare?: boolean;
}

const R = 2, TAU = Math.PI * 2;
const FROM = new THREE.Vector3(0.25, -1, 0.12).normalize();
const AZ = Math.atan2(FROM.y, FROM.x) / D2R;
/** A point at latitude and longitude, with longitude counted from the meridian facing the camera. */
const geo = (lat: number, lon: number, r = R) => {
  const a = (lon + AZ) * D2R, c = Math.cos(lat * D2R);
  return new THREE.Vector3(c * Math.cos(a), c * Math.sin(a), Math.sin(lat * D2R)).multiplyScalar(r);
};
const LIMB = new THREE.Vector3(-FROM.y, FROM.x, 0).normalize();
/** A point on the right-hand limb (in the plane facing the camera): latitude and height above the ground. */
const limb = (lat: number, h: number) => LIMB.clone().multiplyScalar(Math.cos(lat * D2R)).add(new THREE.Vector3(0, 0, Math.sin(lat * D2R))).multiplyScalar(R + h);

type Belt = { tag: string; lat: number; w: number; high: boolean; name: Pair };
const BELTS: Belt[] = [
  { tag: 'polar-n', lat: 85, w: 10, high: true, name: ['Polar high', '极地高气压带'] },
  { tag: 'sublow-n', lat: 60, w: 10, high: false, name: ['Subpolar low', '副极地低气压带'] },
  { tag: 'subhigh-n', lat: 30, w: 10, high: true, name: ['Subtropical high', '副热带高气压带'] },
  { tag: 'eq-low', lat: 0, w: 10, high: false, name: ['Equatorial low', '赤道低气压带'] },
  { tag: 'subhigh-s', lat: -30, w: 10, high: true, name: ['Subtropical high', '副热带高气压带'] },
  { tag: 'sublow-s', lat: -60, w: 10, high: false, name: ['Subpolar low', '副极地低气压带'] },
  { tag: 'polar-s', lat: -85, w: 10, high: true, name: ['Polar high', '极地高气压带'] },
];
/** Wind belts: `e`, `n` = the direction the wind blows toward (east, north components). */
type Wind = { tag: string; lat: number; e: number; n: number; c: string; name: Pair };
const WINDS: Wind[] = [
  { tag: 'east-n', lat: 72, e: -0.85, n: -0.5, c: '#a5d8ff', name: ['Polar easterlies', '极地东风带'] },
  { tag: 'west-n', lat: 45, e: 0.85, n: 0.5, c: '#38d9a9', name: ['Westerlies', '盛行西风带'] },
  { tag: 'trades-n', lat: 15, e: -0.85, n: -0.5, c: '#ffd43b', name: ['NE trades', '东北信风带'] },
  { tag: 'trades-s', lat: -15, e: -0.85, n: 0.5, c: '#ffd43b', name: ['SE trades', '东南信风带'] },
  { tag: 'west-s', lat: -45, e: 0.85, n: -0.5, c: '#38d9a9', name: ['Westerlies', '盛行西风带'] },
  { tag: 'east-s', lat: -72, e: -0.85, n: 0.5, c: '#a5d8ff', name: ['Polar easterlies', '极地东风带'] },
];
const zone = (a: number, b: number, r: number) => {
  const lo = clamp(Math.min(a, b), -90, 90), hi = clamp(Math.max(a, b), -90, 90);
  const g = new THREE.SphereGeometry(r, 128, 6, 0, TAU, (90 - hi) * D2R, Math.max(0.01, hi - lo) * D2R);
  g.rotateX(Math.PI / 2);
  return g;
};
const MONTHS: Pair[] = [['Jan', '1月'], ['Feb', '2月'], ['Mar', '3月'], ['Apr', '4月'], ['May', '5月'], ['Jun', '6月'], ['Jul', '7月'], ['Aug', '8月'], ['Sep', '9月'], ['Oct', '10月'], ['Nov', '11月'], ['Dec', '12月']];
/** Days of the year → the overhead Sun's latitude, and the belts' shift (they lag the Sun by about a month). */
const subsolar = (d: number) => 23.44 * Math.sin((TAU * (d - 80)) / 365);
const beltShift = (d: number) => 5 * Math.sin((TAU * (d - 100)) / 365);

/** Arrow-shaped path along the sphere: from (lat, lon) toward (e, n), `len` degrees long. */
function windArrow(lat: number, lon: number, e: number, n: number, len: number, c: string): THREE.Group {
  const g = new THREE.Group(), pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = (i / 12 - 0.5) * len, la = lat + n * t;
    pts.push(geo(la, lon + (e * t) / Math.max(0.2, Math.cos(la * D2R)), R + 0.05));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.45, roughness: 0.5 });
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.026, 8), m));
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.2, 16), m);
  head.position.copy(curve.getPointAt(1));
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangentAt(1));
  g.add(head);
  return g;
}

function dots(n: number, size: number): THREE.Points {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ map: glowTexture(), size, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  p.userData.keepMap = true;
  p.frustumCulled = false;
  return p;
}
/** A closed loop of the circulation on the limb, sampled evenly. */
function cellLoop(c: [lat: number, h: number][]): { pts: THREE.Vector3[]; up: number[] } {
  const curve = new THREE.CatmullRomCurve3(c.map(([la, h]) => limb(la, h)), true, 'catmullrom', 0.15), n = 300;
  const pts: THREE.Vector3[] = [], up: number[] = [];
  for (let i = 0; i < n; i++) { const p = curve.getPointAt(i / n); pts.push(p); up.push(curve.getTangentAt(i / n).dot(p.clone().normalize())); }
  return { pts, up };
}

const kit: KitFactory<Opts> = (ctx: KitCtx, o) => {
  const root = ctx.root, mode = o.mode, bare = !!o.bare;
  const clock = (o as { clock?: unknown }).clock !== undefined && mode === 'season';
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.position.copy(FROM).add(new THREE.Vector3(-0.5, 0, 0.5)).multiplyScalar(10);
  root.add(sun, new THREE.AmbientLight('#ffffff', 0.55));
  const earthG = new THREE.Group(), earth = body('earth', R, '#4a78b8');
  earthG.add(earth);
  earthG.rotation.z = (AZ - 20) * D2R;
  root.add(earthG);
  for (const la of [0, 30, -30, 60, -60]) {
    const pts = Array.from({ length: 181 }, (_, i) => geo(la, i * 2, R + 0.006));
    root.add(line(pts, '#ffffff', { opacity: la === 0 ? 0.35 : 0.18, dashed: la !== 0, dash: 0.08 }));
  }
  // pressure belts
  const bands = BELTS.map(b => {
    const m = new THREE.MeshBasicMaterial({ color: b.high ? '#4dabf7' : '#ff6b6b', transparent: true, opacity: 0, depthWrite: false, side: THREE.FrontSide });
    const mesh = new THREE.Mesh(zone(b.lat - b.w / 2, b.lat + b.w / 2, R + 0.012), m);
    mesh.renderOrder = 2;
    root.add(mesh);
    ctx.pickable(mesh, b.tag);
    const lab = bare ? null : ctx.label(LIMB.clone().multiplyScalar(-Math.cos(b.lat * D2R) * (R + 0.05)).setZ(Math.sin(b.lat * D2R) * (R + 0.05)), b.name, { c: b.high ? '#74c0fc' : '#ff8787', dx: -62, t: mode === 'cells' ? 3 : 0.4 });
    return { b, mesh, m, lab };
  });
  // wind belts: invisible pick zones, arrows and flowing particles
  const winds = WINDS.map(w => {
    const hit = new THREE.Mesh(zone(w.lat - 9, w.lat + 9, R + 0.02), new THREE.MeshBasicMaterial({ visible: false }));
    root.add(hit); ctx.pickable(hit, w.tag);
    const lab = bare || mode === 'cells' ? null : ctx.label(geo(w.lat, 12, R + 0.06), w.name, { c: w.c, t: 1 });
    return { w, hit, lab, arrows: new THREE.Group() };
  });
  winds.forEach(x => root.add(x.arrows));
  const NP = ctx.low ? 14 : 30, fl = dots(NP * WINDS.length, 0.16), R1 = rng(4);
  const fa = fl.geometry.getAttribute('position') as THREE.BufferAttribute, fc = fl.geometry.getAttribute('color') as THREE.BufferAttribute;
  const pLon = Float32Array.from({ length: NP * WINDS.length }, () => lerp(-75, 75, R1()));
  const pLat = Float32Array.from({ length: NP * WINDS.length }, () => lerp(-6, 6, R1()));
  WINDS.forEach((w, j) => { const c = new THREE.Color(w.c); for (let i = 0; i < NP; i++) fc.setXYZ(j * NP + i, c.r, c.g, c.b); });
  root.add(fl);

  // the cells, on the right-hand limb
  const top = (la: number) => 0.62 - 0.22 * (Math.abs(la) / 90), lo = 0.07;
  const cellDefs: { c: [number, number][]; name?: Pair; at: number }[] = [];
  if (mode === 'cells') {
    for (const s of [1, -1]) {
      if (o.single) cellDefs.push({ c: [[88 * s, lo], [45 * s, lo], [2 * s, lo], [2 * s, top(2) * 0.75], [2 * s, top(2)], [45 * s, top(45)], [88 * s, top(88)], [88 * s, top(88) * 0.6]], name: s > 0 ? ['One cell per hemisphere', '单圈环流'] : undefined, at: 45 * s });
      else {
        cellDefs.push({ c: [[28 * s, lo], [15 * s, lo], [2 * s, lo], [2 * s, top(2) * 0.6], [2 * s, top(2)], [15 * s, top(15)], [28 * s, top(28)], [28 * s, top(28) * 0.6]], name: s > 0 ? ['Low-latitude cell', '低纬环流'] : undefined, at: 15 * s });
        cellDefs.push({ c: [[32 * s, lo], [45 * s, lo], [58 * s, lo], [58 * s, top(58) * 0.6], [58 * s, top(58)], [45 * s, top(45)], [32 * s, top(32)], [32 * s, top(32) * 0.6]], name: s > 0 ? ['Mid-latitude cell', '中纬环流'] : undefined, at: 45 * s });
        cellDefs.push({ c: [[88 * s, lo], [75 * s, lo], [62 * s, lo], [62 * s, top(62) * 0.6], [62 * s, top(62)], [75 * s, top(75)], [88 * s, top(88)], [88 * s, top(88) * 0.6]], name: s > 0 ? ['High-latitude cell', '高纬环流'] : undefined, at: 75 * s });
      }
    }
  }
  const cells = cellDefs.map(d => ({ ...cellLoop(d.c), d }));
  const NC = cells.length ? (ctx.low ? 50 : 110) : 0;
  const cp = dots(Math.max(1, NC * cells.length), 0.13), ca = cp.geometry.getAttribute('position') as THREE.BufferAttribute, cc = cp.geometry.getAttribute('color') as THREE.BufferAttribute;
  const cu = Float32Array.from({ length: NC * cells.length }, () => R1()), cj = Float32Array.from({ length: NC * cells.length * 2 }, () => R1() - 0.5);
  if (NC) root.add(cp);
  const coneM = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.4 });
  for (const c of cells) {
    for (const u of [0.1, 0.4, 0.6, 0.9]) {
      const k = Math.floor(u * c.pts.length), p = c.pts[k], t = c.pts[(k + 2) % c.pts.length].clone().sub(c.pts[(k - 2 + c.pts.length) % c.pts.length]).normalize();
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 14), coneM);
      m.position.copy(p); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), t); root.add(m);
    }
    root.add(line(c.pts, '#a5d8ff', { opacity: 0.6, closed: true }));
    if (c.d.name) ctx.label(limb(c.d.at, top(c.d.at) + 0.05), c.d.name, { c: '#ffe066', dx: 58, t: 1 });
  }
  if (mode === 'cells' && !o.single) {
    ctx.label(limb(0, 0.02), ['rises', '上升'], { c: '#ffa94d', dx: 22, dy: 14, t: 1.6 });
    ctx.label(limb(30, top(30) * 0.5), ['sinks', '下沉'], { c: '#74c0fc', dx: 30, t: 1.6 });
    ctx.label(limb(60, top(60) * 0.5), ['rises', '上升'], { c: '#ffa94d', dx: 30, t: 1.6 });
  }
  if (mode === 'cells' && o.single) ctx.label(limb(0, 0.3), ['heated: rises', '受热上升'], { c: '#ffa94d', dx: 44, t: 1 });
  if (mode === 'cells' && o.single) ctx.label(limb(88, 0.3), ['cold: sinks', '冷却下沉'], { c: '#74c0fc', dx: 44, t: 1 });

  // the overhead Sun (season)
  const ss = line(Array.from({ length: 181 }, (_, i) => geo(0, i * 2, R + 0.02)), '#ffd43b', { opacity: 0.95 });
  const ssLab = mode === 'season' ? ctx.label(geo(0, -30, R + 0.03), ['Overhead Sun', '太阳直射点'], { c: '#ffe066', dot: true }) : null;
  if (mode === 'season') root.add(ss);

  ctx.view([FROM.x, FROM.y, FROM.z], mode === 'cells' ? 8.0 : 7.4, [mode === 'cells' ? 0.25 : -0.2, 0, 0], true);
  let shift = NaN, aShift = NaN, day = 0;
  const build = (s: number) => {
    for (const x of bands) { x.mesh.geometry.dispose(); x.mesh.geometry = zone(x.b.lat - x.b.w / 2 + s, x.b.lat + x.b.w / 2 + s, R + 0.012); x.lab?.pos.copy(LIMB.clone().multiplyScalar(-Math.cos((x.b.lat + s) * D2R) * (R + 0.05)).setZ(Math.sin((x.b.lat + s) * D2R) * (R + 0.05))); }
    for (const x of winds) { x.hit.geometry.dispose(); x.hit.geometry = zone(x.w.lat - 9 + s, x.w.lat + 9 + s, R + 0.02); x.lab?.pos.copy(geo(x.w.lat + s, 12, R + 0.06)); }
  };
  const buildArrows = (s: number) => {
    for (const x of winds) {
      x.arrows.children.slice().forEach(c => { x.arrows.remove(c); c.traverse(m => { if (m instanceof THREE.Mesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); } }); });
      for (const lon of [-52, -22, 46]) x.arrows.add(windArrow(x.w.lat + s, lon, x.w.e, x.w.n, Math.abs(x.w.lat) > 60 ? 16 : 13, x.w.c));
    }
  };
  return {
    update(v, dt, el) {
      day = clock ? v : 172;
      const s = clock ? beltShift(v) : o.shift ?? 0;
      if (!(Math.abs(s - shift) <= 0.04)) { shift = s; build(s); }
      if (!(Math.abs(s - aShift) <= 0.5)) { aShift = s; buildArrows(s); }
      const a = ramp(el, 0.2, 1.2) * (mode === 'cells' ? 0.4 : 0.6);
      for (const x of bands) x.m.opacity = a;
      const aw = ramp(el, 0.8, 1);
      for (const x of winds) x.arrows.visible = aw > 0.02;
      (fl.material as THREE.PointsMaterial).opacity = aw;
      // wind particles
      WINDS.forEach((w, j) => {
        for (let i = 0; i < NP; i++) {
          const k = j * NP + i, la = w.lat + s + pLat[k];
          pLon[k] += (w.e * 9 * dt) / Math.max(0.25, Math.cos(la * D2R));
          pLat[k] += w.n * 2.5 * dt;
          if (pLon[k] > 78) pLon[k] -= 156; else if (pLon[k] < -78) pLon[k] += 156;
          if (pLat[k] > 7) pLat[k] -= 14; else if (pLat[k] < -7) pLat[k] += 14;
          const p = geo(w.lat + s + pLat[k], pLon[k], R + 0.06);
          fa.setXYZ(k, p.x, p.y, p.z);
        }
      });
      fa.needsUpdate = true; fc.needsUpdate = true;
      // cell particles: orange rising, blue sinking
      if (NC) {
        const up = new THREE.Color('#ff922b'), dn = new THREE.Color('#4dabf7'), fl2 = new THREE.Color('#f1f3f5'), c = new THREE.Color(), op = ramp(el, 0.6, 1);
        cells.forEach((cl, j) => {
          for (let i = 0; i < NC; i++) {
            const k = j * NC + i;
            cu[k] = (cu[k] + dt * 0.06) % 1;
            const q = Math.floor(cu[k] * cl.pts.length) % cl.pts.length, p = cl.pts[q];
            const r = p.clone().normalize();
            ca.setXYZ(k, p.x + r.x * cj[2 * k] * 0.07 + FROM.x * cj[2 * k + 1] * 0.25, p.y + r.y * cj[2 * k] * 0.07 + FROM.y * cj[2 * k + 1] * 0.25, p.z + r.z * cj[2 * k] * 0.07);
            c.copy(fl2).lerp(cl.up[q] > 0 ? up : dn, clamp(Math.abs(cl.up[q]) * 1.5)).multiplyScalar(op);
            cc.setXYZ(k, c.r, c.g, c.b);
          }
        });
        ca.needsUpdate = true; cc.needsUpdate = true;
      }
      if (mode === 'season') {
        const d = subsolar(day);
        setLine(ss, Array.from({ length: 181 }, (_, i) => geo(d, i * 2, R + 0.02)));
        ssLab?.pos.copy(geo(d, -30, R + 0.03));
      }
    },
    readout: clock ? v => {
      const m = MONTHS[clamp(Math.floor((v / 365) * 12), 0, 11)], s = beltShift(v), dir: Pair = Math.abs(s) < 0.5 ? ['near their mean', '位于平均位置附近'] : s > 0 ? [`${s.toFixed(1)}° north`, `北移 ${s.toFixed(1)}°`] : [`${(-s).toFixed(1)}° south`, `南移 ${(-s).toFixed(1)}°`];
      return [`${m[0]} · belts ${dir[0]}`, `${m[1]} · 气压带风带${dir[1]}`];
    } : undefined,
  };
};
export default kit;
