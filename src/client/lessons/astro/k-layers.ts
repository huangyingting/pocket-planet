/**
 * Kit "layers": the Earth's interior.
 * - `cutaway`: the Earth with a quarter cut away: crust, mantle, liquid outer core, solid inner core, the Moho and the
 *   Gutenberg discontinuity (the top layers drawn thicker than to scale); `litho` splits off the lithosphere and the
 *   asthenosphere. Layers are pickable: `crust`, `mantle`, `outer-core`, `inner-core` (+ `litho`, `asthenosphere`).
 * - `waves`: the cutaway at true scale beside the textbook graph of P- and S-wave speed against depth, the graph's
 *   depth axis lined up with the cut edge. Lab parameter `depth` (km) moves a probe down the radius.
 * - `crust`: a section from an ocean across a continent to a high plateau: oceanic and continental crust, the Moho,
 *   the top of the mantle and the asthenosphere. Lab parameters `x` (0 ocean … 100 plateau) and `depth` (km).
 */
import * as THREE from 'three';
import { bodyTexture } from '../../sky/common.ts';
import { clamp, dirLight, line, ramp, setLine, starfield } from './draw.ts';
import type { KitCtx, KitFactory, Pair } from './types.ts';

export interface Opts {
  mode: 'cutaway' | 'waves' | 'crust';
  /** `cutaway`: no labels (for "tap the layer" questions) */
  bare?: boolean;
  /** `cutaway`: split off the lithosphere and the asthenosphere */
  litho?: boolean;
}

const RE = 6371, MOHO = 33, CMB = 2900, ICB = 5150;
const R = 3;
const COL = { crust: '#c79c6c', crustIn: '#8f6a48', litho: '#80543f', astheno: '#ff7a3d', mantleTop: '#c2461f', mantleDeep: '#ff7b1c', outer: '#ffa53b', outerIn: '#ffc861', inner: '#fff1b8' };

/** Seismic speeds (km/s) by depth (km); a repeated depth is a jump. After PREM, rounded. */
const VP: [number, number][] = [[0, 5.8], [33, 6.8], [33, 8.1], [80, 8.1], [200, 7.9], [400, 8.9], [670, 10.1], [2900, 13.7], [2900, 8.0], [5150, 10.3], [5150, 11.0], [6371, 11.3]];
const VS: [number, number][] = [[0, 3.2], [33, 3.9], [33, 4.5], [80, 4.5], [200, 4.3], [400, 4.8], [670, 5.6], [2900, 7.3]];
function speed(tab: [number, number][], d: number): number | null {
  if (d > tab[tab.length - 1][0]) return null;
  for (let i = 1; i < tab.length; i++) if (d <= tab[i][0]) {
    const [x0, y0] = tab[i - 1], [x1, y1] = tab[i];
    return x1 === x0 ? y1 : y0 + ((y1 - y0) * (d - x0)) / (x1 - x0);
  }
  return null;
}
function layerAt(d: number): Pair {
  if (Math.abs(d - CMB) < 15) return ['Gutenberg discontinuity', '古登堡面'];
  if (d < MOHO) return ['crust', '地壳'];
  if (d >= 80 && d <= 400) return ['upper mantle: asthenosphere', '上地幔 · 软流层'];
  if (d < CMB) return ['mantle (solid rock)', '地幔（固态）'];
  if (d < ICB) return ['outer core (liquid)', '外核（液态）'];
  return ['inner core (solid)', '内核（固态）'];
}
const fmtV = (v: number | null): Pair => (v === null ? ['none', '无'] : [`${v.toFixed(1)} km/s`, `${v.toFixed(1)} 千米/秒`]);
const num = (ctx: KitCtx, id: string, d: number) => { const v = ctx.param(id); return Number.isFinite(v) ? v : d; };

/** Fade a group in without leaving solid meshes in the transparent pass. */
function appear(o: THREE.Object3D, a: number): void {
  o.visible = a > 0.005;
  o.traverse(x => {
    const mat = (x as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    for (const m of Array.isArray(mat) ? mat : mat ? [mat] : []) {
      m.userData.a0 ??= m.opacity;
      m.userData.t0 ??= m.transparent;
      m.transparent = (m.userData.t0 as boolean) || a < 0.999;
      m.opacity = (m.userData.a0 as number) * a;
    }
  });
}
/** Colours a geometry's vertices from their positions. */
function paint(g: THREE.BufferGeometry, f: (x: number, y: number, z: number, out: THREE.Color) => void): void {
  const p = g.getAttribute('position'), c = new Float32Array(p.count * 3), col = new THREE.Color();
  for (let i = 0; i < p.count; i++) { f(p.getX(i), p.getY(i), p.getZ(i), col); c.set([col.r, col.g, col.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
}
const hz = (a: number) => new THREE.Vector3(Math.cos(a), Math.sin(a), 0);

interface Cut { group: THREE.Group; layers: Record<string, THREE.Group>; mats: Record<string, THREE.MeshStandardMaterial[]>; anchor(r: number, face: 0 | 1, elev: number): THREE.Object3D }

/** The Earth with the wedge between azimuths `a0` and `a0 + 90°` removed; `rad` maps depth (km) to radius. */
function cutaway(ctx: KitCtx, a0: number, rad: (d: number) => number, litho: boolean): Cut {
  const group = new THREE.Group(), layers: Record<string, THREE.Group> = {}, mats: Record<string, THREE.MeshStandardMaterial[]> = {};
  const a1 = a0 + Math.PI / 2, seg = ctx.low ? 64 : 128;
  const ring = (d0: number, d1: number, cIn: string, cOut: string, key: string, emissive = '#000000', ei = 0) => {
    const g = new THREE.Group(), r0 = rad(d1), r1 = rad(d0), A = new THREE.Color(cIn), B = new THREE.Color(cOut);
    for (const a of [a0, a1]) {
      const geo = new THREE.RingGeometry(r0, r1, seg, 6, -Math.PI / 2, Math.PI);
      paint(geo, (x, y, _z, out) => out.copy(A).lerp(B, clamp((Math.hypot(x, y) - r0) / Math.max(1e-6, r1 - r0))));
      const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide, emissive, emissiveIntensity: ei, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
      m.userData.e0 = ei; m.userData.ec = emissive;
      const mesh = new THREE.Mesh(geo, m), h = hz(a);
      mesh.matrix.makeBasis(h, new THREE.Vector3(0, 0, 1), new THREE.Vector3().crossVectors(h, new THREE.Vector3(0, 0, 1)));
      mesh.matrixAutoUpdate = false;
      g.add(mesh);
      (mats[key] ??= []).push(m);
    }
    layers[key] = g;
    group.add(g);
  };
  ring(0, MOHO, COL.crustIn, COL.crust, 'crust');
  if (litho) {
    ring(MOHO, 80, COL.litho, '#9a6650', 'litho');
    ring(80, 400, '#ff9a5a', COL.astheno, 'asthenosphere', '#ff5a1f', 0.35);
    ring(400, CMB, COL.mantleDeep, '#d0552a', 'mantle');
  } else ring(MOHO, CMB, COL.mantleDeep, COL.mantleTop, 'mantle');
  ring(CMB, ICB, COL.outerIn, COL.outer, 'outer-core', '#ff8c00', 0.35);
  const icm = new THREE.MeshStandardMaterial({ color: COL.inner, emissive: '#ffc94d', emissiveIntensity: 0.55, roughness: 0.5 });
  icm.userData.e0 = 0.55; icm.userData.ec = '#ffc94d';
  const icg = new THREE.Group();
  icg.add(new THREE.Mesh(new THREE.SphereGeometry(rad(ICB), 48, 32), icm));
  group.add(icg); layers['inner-core'] = icg; mats['inner-core'] = [icm];
  // the surface: three quarters of a sphere with the Earth map (azimuth = phi + π after the rotation)
  const phi0 = a1 - Math.PI;
  const sg = new THREE.SphereGeometry(rad(0), seg, seg / 2, phi0, Math.PI * 1.5);
  sg.rotateX(Math.PI / 2);
  const uv = sg.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) uv.setX(i, phi0 / (2 * Math.PI) + 0.75 * uv.getX(i));
  const sm = new THREE.MeshStandardMaterial({ color: '#3f6fa8', roughness: 0.9, side: THREE.DoubleSide });
  const surf = new THREE.Mesh(sg, sm);
  surf.userData.keepMap = true;
  layers.crust.add(surf);
  bodyTexture('earth', ctx.low ? 512 : 1024).then(t => { sm.map = t; sm.color.set('#ffffff'); sm.needsUpdate = true; }, () => {});
  // the discontinuities: bright arcs on both faces
  const arc = (d: number, c: string, op = 0.95) => {
    for (const a of [a0, a1]) {
      const h = hz(a), r = rad(d), pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 96; i++) { const t = -Math.PI / 2 + (i / 96) * Math.PI; pts.push(h.clone().multiplyScalar(r * Math.cos(t) + 0.004).setZ(r * Math.sin(t))); }
      const l = line(pts, c, { opacity: op });
      l.renderOrder = 3;
      group.add(l);
    }
  };
  arc(MOHO, '#ffe8a3'); arc(CMB, '#ffffff'); arc(ICB, '#fff3bf', 0.5);
  const at = (r: number, face: 0 | 1, elev: number) => hz(face ? a1 : a0).multiplyScalar(r * Math.cos(elev)).setZ(r * Math.sin(elev));
  const anchor = (r: number, face: 0 | 1, elev: number) => {
    const o = new THREE.Object3D();
    o.position.copy(at(r, face, elev));
    group.add(o);
    return o;
  };
  // each layer's group sits at a point on its own face, so a pick flag (and a test tap) lands on it
  const centre = (key: string, p: THREE.Vector3) => {
    const g = layers[key];
    if (!g) return;
    g.position.copy(p);
    for (const c of g.children) {
      if (c.matrixAutoUpdate) c.position.sub(p);
      else c.matrix.premultiply(new THREE.Matrix4().makeTranslation(-p.x, -p.y, -p.z));
    }
  };
  const e = Math.PI / 180;
  centre('crust', new THREE.Vector3(Math.cos(a0 + 0.68 * Math.PI), Math.sin(a0 + 0.68 * Math.PI), 0).multiplyScalar(rad(0) * Math.cos(25 * e)).setZ(rad(0) * Math.sin(25 * e)));
  centre('litho', at((rad(MOHO) + rad(80)) / 2, 1, 40 * e));
  centre('asthenosphere', at((rad(80) + rad(400)) / 2, 1, 40 * e));
  centre('mantle', at(litho ? rad(1600) : rad(1400), 1, 35 * e));
  centre('outer-core', at((rad(CMB) + rad(ICB)) / 2, 1, 35 * e));
  ctx.root.add(group);
  return { group, layers, mats, anchor };
}

/** Piecewise-linear depth → radius (the top layers thickened so the crust shows). */
const knots = (k: [number, number][]) => (d: number) => {
  for (let i = 1; i < k.length; i++) if (d <= k[i][0]) return k[i - 1][1] + ((k[i][1] - k[i - 1][1]) * (d - k[i - 1][0])) / (k[i][0] - k[i - 1][0]);
  return 0;
};
const EXAG = knots([[0, R], [MOHO, R - 0.1], [80, R - 0.18], [400, R - 0.46], [CMB, R * (1 - CMB / RE)], [RE, 0]]);
const TRUE = (d: number) => R * (1 - d / RE);

const kit: KitFactory<Opts> = (ctx, o) => {
  ctx.root.add(starfield(ctx.low ? 800 : 1600, 900, 11));
  const upd: ((el: number) => void)[] = [];
  if (o.mode === 'cutaway') cutawayMode(ctx, o, upd);
  else if (o.mode === 'waves') wavesMode(ctx, upd);
  else crustMode(ctx, upd);
  return { update(_v, _dt, el) { for (const f of upd) f(el); } };
};
export default kit;

function cutawayMode(ctx: KitCtx, o: Opts, upd: ((el: number) => void)[]): void {
  const az = -60 * (Math.PI / 180);
  ctx.root.add(dirLight([Math.cos(az) * 1.3 - 0.5, Math.sin(az) * 1.3 - 0.6, 1.0], 2.2, 0.85));
  const cut = cutaway(ctx, az - Math.PI / 4, EXAG, !!o.litho);
  for (const [k, g] of Object.entries(cut.layers)) ctx.pickable(g, k);
  if (!o.bare) {
    const L = (r: number, f: 0 | 1, e: number, t: Pair, c: string, tt: number, big = false) => ctx.label(cut.anchor(r, f, e * (Math.PI / 180)), t, { c, t: tt, big });
    L(R - 0.04, 1, 58, ['Crust', '地壳'], COL.crust, 0.6, true);
    L(EXAG(1500), 1, 12, ['Mantle', '地幔'], '#ff9a6c', 1.0, true);
    L(EXAG(3800), 1, 58, ['Outer core: liquid', '外核（液态）'], COL.outerIn, 1.4, true);
    L(EXAG(ICB) * 0.5, 0, -30, ['Inner core: solid', '内核（固态）'], COL.inner, 1.8, true);
    L(EXAG(MOHO), 0, 66, ['Moho discontinuity', '莫霍面'], '#ffe8a3', 2.4);
    L(EXAG(CMB), 0, 30, ['Gutenberg discontinuity · 2900 km', '古登堡面 · 2900 千米'], '#ffffff', 2.8);
    if (o.litho) {
      L(EXAG(55), 0, 6, ['Lithosphere: crust + top of the mantle', '岩石圈：地壳 + 上地幔顶部'], '#f0cfb2', 3.2);
      L(EXAG(240), 0, -14, ['Asthenosphere: source of magma', '软流层：岩浆的发源地'], '#ffa070', 3.6);
    }
    ctx.label(new THREE.Vector3(0, 0, -R - 0.4), ['Top layers drawn thicker than to scale', '示意图：上部圈层已加厚'], { c: '#9aa7b4', t: 3 });
  }
  ctx.view([Math.cos(az), Math.sin(az), 0.55], 10.5, [0, 0, 0.1], true);
  upd.push(el => {
    appear(cut.group, ramp(el, 0, 0.8));
    cut.group.rotation.z = 0.14 * Math.sin(el * 0.3);
  });
}

function wavesMode(ctx: KitCtx, upd: ((el: number) => void)[]): void {
  const root = ctx.root, EX = -3.4, az = -Math.PI / 2;
  root.add(dirLight([0.7, -1.2, 0.9], 2.3, 0.55));
  const cut = cutaway(ctx, az - Math.PI / 4, TRUE, false);
  cut.group.position.x = EX;
  for (const [k, g] of Object.entries(cut.layers)) ctx.pickable(g, k);
  // the graph: depth down (lined up with the cut edge), speed across
  const X0 = EX + R + 1.1, W = 4.6, VMAX = 14, Z = (d: number) => R * (1 - d / RE), X = (v: number) => X0 + (v / VMAX) * W;
  const graph = new THREE.Group();
  const plane = (w: number, h: number, x: number, z: number, y: number, c: string, op: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = Math.PI / 2; m.position.set(x, y, z);
    graph.add(m);
  };
  plane(W + 0.6, R + 0.7, X0 + W / 2, R / 2 + 0.05, 0.03, '#0b1622', 0.8);
  for (const [d0, d1, c] of [[0, CMB, COL.mantleDeep], [CMB, ICB, COL.outer], [ICB, RE, COL.inner]] as [number, number, string][]) plane(W, Z(d0) - Z(d1), X0 + W / 2, (Z(d0) + Z(d1)) / 2, 0.02, c, 0.14);
  graph.add(line([[X0, 0, R], [X0 + W, 0, R]], '#ced4da', { opacity: 0.8 }), line([[X0, 0, R], [X0, 0, 0]], '#ced4da', { opacity: 0.8 }));
  for (const d of [CMB, ICB]) graph.add(line([[EX, 0, Z(d)], [X0 + W, 0, Z(d)]], '#ffffff', { opacity: 0.35, dashed: true, dash: 0.08 }));
  for (let v = 0; v <= 14; v += 2) graph.add(line([[X(v), 0, R], [X(v), 0, R + 0.08]], '#ced4da', { opacity: 0.8 }));
  for (const v of [0, 4, 8, 12]) ctx.label(new THREE.Vector3(X(v), 0, R + 0.26), String(v), { c: '#9aa7b4' });
  ctx.label(new THREE.Vector3(X0 + W / 2, 0, R + 0.62), ['Wave speed (km/s)', '地震波速度（千米/秒）'], { c: '#ced4da' });
  for (const [d, t] of [[0, ['0 km', '0 千米']], [CMB, ['2900 km', '2900 千米']], [ICB, ['5150 km', '5150 千米']], [RE, ['6371 km', '6371 千米']]] as [number, Pair][])
    ctx.label(new THREE.Vector3(X0 - 0.1, 0, Z(d)), t, { c: '#9aa7b4', dx: -36 });
  const tube = (tab: [number, number][], c: string) => {
    const path = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 1; i < tab.length; i++) path.add(new THREE.LineCurve3(new THREE.Vector3(X(tab[i - 1][1]), -0.02, Z(tab[i - 1][0])), new THREE.Vector3(X(tab[i][1]), -0.02, Z(tab[i][0]))));
    const m = new THREE.Mesh(new THREE.TubeGeometry(path, 700, 0.035, 6), new THREE.MeshBasicMaterial({ color: c }));
    graph.add(m);
    return m;
  };
  const pT = tube(VP, '#4dabf7'), sT = tube(VS, '#ff922b');
  ctx.label(new THREE.Vector3(X(12.4), 0, Z(1500)), ['P wave', '纵波（P 波）'], { c: '#74c0fc', t: 1.6, big: true });
  ctx.label(new THREE.Vector3(X(4.4), 0, Z(1250)), ['S wave', '横波（S 波）'], { c: '#ffa94d', t: 2.4, big: true });
  ctx.label(new THREE.Vector3(X(3.2), 0, Z(3500)), ['S waves stop: the outer core is liquid', '横波消失：外核为液态'], { c: '#ffa94d', t: 3 });
  root.add(graph);
  // the probe on the cut edge, its dots on the curves and the cursor between them
  const dot = (c: string, r: number) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshBasicMaterial({ color: c, depthTest: false })); m.renderOrder = 9; root.add(m); return m; };
  const probe = dot('#ffffff', 0.08), pDot = dot('#4dabf7', 0.085), sDot = dot('#ff922b', 0.085);
  const cursor = line([[EX, -0.05, R], [X0 + W, -0.05, R]], '#ffffff', { opacity: 0.85 });
  cursor.renderOrder = 8;
  root.add(cursor);
  const info = ctx.label(new THREE.Vector3(X0 + W / 2, 0, R + 1.05), '', { c: '#ffffff', big: true });
  let last = -1;
  upd.push(el => {
    appear(cut.group, ramp(el, 0, 0.8));
    const draw = (m: THREE.Mesh, f: number) => { const n = m.geometry.index!.count; m.geometry.setDrawRange(0, Math.round((n * f) / 3) * 3); };
    draw(pT, ramp(el, 0.4, 2)); draw(sT, ramp(el, 1.0, 2));
    const d = clamp(num(ctx, 'depth', 0), 0, RE), z = Z(d);
    probe.position.set(EX, -0.05, z);
    setLine(cursor, [[EX, -0.05, z], [X0 + W, -0.05, z]]);
    const vp = speed(VP, d), vs = speed(VS, d);
    pDot.position.set(X(vp ?? 0), -0.06, z); sDot.position.set(X(vs ?? 0), -0.06, z); sDot.visible = vs !== null;
    if (d === last) return;
    last = d;
    const ly = layerAt(d), P = fmtV(vp), S = fmtV(vs), km = Math.round(d);
    info.set([`${km} km · ${ly[0]} · P ${P[0]} · S ${S[0]}`, `${km} 千米 · ${ly[1]} · 纵波 ${P[1]} · 横波 ${S[1]}`]);
    const cur = d < MOHO ? 'crust' : d < CMB ? 'mantle' : d < ICB ? 'outer-core' : 'inner-core';
    for (const [k, ms] of Object.entries(cut.mats)) for (const m of ms) {
      if (k === cur) { m.emissive.set(k === 'inner-core' ? '#ffd43b' : '#ffb066'); m.emissiveIntensity = k === 'inner-core' ? 0.95 : 0.45; }
      else { m.emissive.set(m.userData.ec as string); m.emissiveIntensity = m.userData.e0 as number; }
    }
  });
  ctx.view([0.06, -1, 0.12], 11, [0.2, 0, 0.8], true);
}

// --------------------------------------------------------------------------------------------- the crust section

const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
/** along the section (0 … 100): surface height (km above sea level), Moho and asthenosphere depth (km) */
const SURF = (x: number) => -4 + 4.5 * smooth(33, 46, x) + 4.2 * smooth(74, 88, x) + (x > 86 ? 0.3 * Math.sin(x * 1.4) * smooth(86, 90, x) : 0);
const MOHOX = (x: number) => 11 + 22 * smooth(34, 46, x) + 32 * smooth(74, 88, x);
const ASTH = (x: number) => 80 + 20 * smooth(36, 50, x);
const SHORE = (() => { let a = 30, b = 50; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (SURF(m) < 0) a = m; else b = m; } return a; })();

/** A section slab extruded toward the viewer: front face grid, top strip and end caps. `pos(s, t)` → (x, z). */
function slab(pos: (s: number, t: number) => [number, number], n: number, m: number, D: number, face: (s: number, t: number, out: THREE.Color) => void, top?: (s: number, out: THREE.Color) => void): THREE.BufferGeometry {
  const P: number[] = [], C: number[] = [], I: number[] = [], c = new THREE.Color();
  const v = (x: number, y: number, z: number) => { P.push(x, y, z); C.push(c.r, c.g, c.b); return P.length / 3 - 1; };
  const grid = (cols: number, rows: number, at: (i: number, j: number) => [number, number, number], colour: (i: number, j: number) => void) => {
    const b = P.length / 3;
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) { colour(i, j); v(...at(i, j)); }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const k = b + j * (cols + 1) + i, k2 = k + cols + 1; I.push(k, k2, k + 1, k + 1, k2, k2 + 1); }
  };
  grid(n, m, (i, j) => { const [x, z] = pos(i / n, j / m); return [x, -D / 2, z]; }, (i, j) => face(i / n, j / m, c));
  grid(n, 1, (i, j) => { const [x, z] = pos(i / n, 0); return [x, -D / 2 + j * D, z]; }, i => (top ? top(i / n, c) : face(i / n, 0, c)));
  for (const s of [0, 1]) grid(1, m, (i, j) => { const [x, z] = pos(s, j / m); return [x, -D / 2 + i * D, z]; }, (_i, j) => face(s, j / m, c));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setIndex(I);
  g.computeVertexNormals();
  return g;
}

function crustMode(ctx: KitCtx, upd: ((el: number) => void)[]): void {
  const root = ctx.root, D = 2.4, N = ctx.low ? 100 : 180;
  root.add(dirLight([0.5, -1, 1.2], 2.2, 0.55));
  const X = (x: number) => (x - 50) * 0.1, Zd = (d: number) => -d * 0.04, Ze = (e: number) => (e > 0 ? e * 0.12 : e * 0.04);
  const group = new THREE.Group();
  root.add(group);
  const band = (top: (x: number) => number, bot: (x: number) => number, x0: number, x1: number, face: (x: number, t: number, out: THREE.Color) => void, topc?: (x: number, out: THREE.Color) => void, o: THREE.MeshStandardMaterialParameters = {}) => {
    const xs = (s: number) => x0 + (x1 - x0) * s;
    const g = slab((s, t) => { const x = xs(s); return [X(x), top(x) + (bot(x) - top(x)) * t]; }, N, 8, D, (s, t, out) => face(xs(s), t, out), topc && ((s, out) => topc(xs(s), out)));
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide, ...o }));
    group.add(m);
    return m;
  };
  const oc = new THREE.Color('#6c7a89'), cc = new THREE.Color('#e0bb85'), cl = new THREE.Color('#c0935f'), grass = new THREE.Color('#6f9f4f'), rock = new THREE.Color('#9c8f7a'), snow = new THREE.Color('#eef2f6');
  band(x => Ze(SURF(x)), x => Zd(MOHOX(x)), 0, 100,
    (x, t, out) => out.copy(oc).lerp(cc.clone().lerp(cl, t), smooth(36, 46, x)).multiplyScalar(1 - 0.15 * t),
    (x, out) => { const h = SURF(x); if (h < 0) out.copy(oc).multiplyScalar(0.8); else out.copy(grass).lerp(rock, smooth(2.5, 3.8, h)).lerp(snow, smooth(4.2, 4.6, h)); });
  band(x => Zd(MOHOX(x)), x => Zd(ASTH(x)), 0, 100, (_x, t, out) => out.set('#8f4636').lerp(new THREE.Color('#6a2f24'), t));
  band(x => Zd(ASTH(x)), () => Zd(125), 0, 100, (_x, t, out) => out.set('#e8590c').lerp(new THREE.Color('#ffa94d'), t), undefined, { emissive: '#ff5a1f', emissiveIntensity: 0.25 });
  band(() => 0, x => Ze(SURF(x)), 0, SHORE, (_x, t, out) => out.set('#4dabf7').lerp(new THREE.Color('#1864ab'), t), (_x, out) => out.set('#5fb3f5'), { transparent: true, opacity: 0.6, depthWrite: false, roughness: 0.25 });
  // the Moho and the base of the lithosphere, on the front face
  const front = -D / 2 - 0.015;
  const curve = (f: (x: number) => number) => Array.from({ length: N + 1 }, (_, i) => new THREE.Vector3(X((100 * i) / N), front, Zd(f((100 * i) / N))));
  const moho = line(curve(MOHOX), '#ffe066'), base = line(curve(ASTH), '#ffffff', { opacity: 0.7, dashed: true, dash: 0.12 });
  root.add(moho, base);
  const lab = (x: number, d: number, t: Pair, c: string, tt: number, big = false) => ctx.label(new THREE.Vector3(X(x), front, Zd(d)), t, { c, t: tt, big });
  lab(14, -1.6, ['Ocean', '海洋'], '#a5d8ff', 0.3, true);
  lab(15, 7.5, ['Oceanic crust: thin', '大洋地壳：薄'], '#e9ecef', 0.6);
  lab(60, 16, ['Continental crust: thick', '大陆地壳：厚'], '#ffe8cc', 0.9);
  lab(91, 30, ['Under high plateaus: 60–70 km', '高原下：可达 60～70 千米'], '#ffe8cc', 1.2);
  lab(58, 38, ['Moho', '莫霍面'], '#ffe066', 1.5, true);
  lab(22, 45, ['Top of the upper mantle', '上地幔顶部'], '#f0cfb2', 1.8);
  lab(30, 108, ['Asthenosphere: soft, magma forms here', '软流层：岩浆的发源地'], '#ffd8a8', 2.1, true);
  const bx = X(100) + 0.35;
  root.add(line([[bx - 0.12, front, Ze(SURF(100))], [bx, front, Ze(SURF(100))], [bx, front, Zd(ASTH(100))], [bx - 0.12, front, Zd(ASTH(100))]], '#f0cfb2'));
  ctx.label(new THREE.Vector3(bx, front, Zd(50)), ['Lithosphere', '岩石圈'], { c: '#f0cfb2', big: true, t: 2.4, dx: 44 });
  ctx.label(new THREE.Vector3(X(0), front, Zd(125)), ['Vertical scale exaggerated', '垂直比例已放大'], { c: '#9aa7b4', t: 2.6, dx: 70, dy: 16 });
  // the probe: a drill string with a glowing tip
  const drill = line([[0, front, 0], [0, front, -1]], '#ffffff', { opacity: 0.95 });
  drill.renderOrder = 8;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffffff', depthTest: false }));
  tip.renderOrder = 9;
  root.add(drill, tip);
  const info = ctx.label(new THREE.Vector3(X(50), front, Ze(4.6) + 0.9), '', { c: '#ffffff', big: true });
  let last = '';
  upd.push(el => {
    appear(group, ramp(el, 0, 0.8));
    moho.visible = el > 1.2; base.visible = el > 1.8;
    const x = clamp(num(ctx, 'x', 60), 0, 100), d = clamp(num(ctx, 'depth', 5), 0, 125);
    const zt = SURF(x) > 0 ? Ze(SURF(x)) : 0;
    setLine(drill, [[X(x), front - 0.01, zt + 0.3], [X(x), front - 0.01, Zd(d)]]);
    tip.position.set(X(x), front - 0.02, Zd(d));
    const key = `${x}|${d}`;
    if (key === last) return;
    last = key;
    const sf = SURF(x), mo = MOHOX(x), as = ASTH(x);
    let where: Pair, vp: number, vs: number | null;
    if (sf < 0 && d < -sf) { where = ['sea water', '海水']; vp = 1.5; vs = null; }
    else if (d < mo) { where = x < 40 ? ['oceanic crust', '大洋地壳'] : ['continental crust', '大陆地壳']; vp = 6 + 0.8 * (d / mo); vs = 3.4 + 0.4 * (d / mo); }
    else if (d < as) { where = ['top of the mantle', '上地幔顶部']; vp = 8.1; vs = 4.5; }
    else { where = ['asthenosphere', '软流层']; vp = 7.9; vs = 4.3; }
    const at: Pair = Math.abs(d - mo) <= 2 ? [' · at the Moho', ' · 到达莫霍面'] : ['', ''];
    const S = fmtV(vs);
    info.set([`${Math.round(d)} km · ${where[0]}${at[0]} · P ${vp.toFixed(1)} · S ${S[0]}`, `${Math.round(d)} 千米 · ${where[1]}${at[1]} · 纵波 ${vp.toFixed(1)} · 横波 ${S[1]}`]);
  });
  ctx.view([0.15, -1, 0.42], 13.5, [0.3, 0, -2.0], true);
}

