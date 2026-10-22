/**
 * Kit "air": the atmosphere in cross-section, for senior physical geography. Schematic: heights, flows and forces
 * are exaggerated so they read.
 * - `layers`: a column of air from the ground to 120 km beside its temperature–height curve; the troposphere is
 *   thickest over the equator (lab: altitude and latitude, with live temperature and pressure)
 * - `heating`: how the Sun heats the air: short-wave sunlight, how the air weakens it (absorbed, reflected,
 *   scattered), the ground's long-wave radiation and the air's counter-radiation (lab: cloud cover and elevation)
 * - `thermal`: thermal circulation in a slab of air over two surfaces (two patches, sea and land, a valley, a city):
 *   air rises over the warm side and sinks over the cool one, and the isobaric surfaces bend (lab: the temperatures)
 * - `wind`: a parcel of air between straight isobars, pushed by the pressure-gradient force and turned by the
 *   Coriolis effect and friction (lab: latitude and friction)
 */
import * as THREE from 'three';
import { Arrow, canvasTex, clamp, glow, lerp, line, ramp, rng, setLine } from './draw.ts';
import { glowTexture } from '../../sky/common.ts';
import type { KitCtx, KitFactory, KitRun, Label, Pair } from './types.ts';

export type Opts =
  /** params (or options) `alt` (km, 0–120; none: no cursor) and `lat` (0–90°) */
  | { mode: 'layers'; lat?: number; alt?: number }
  /** `flow`: the five energy flows in turn; `weaken`: absorbed, reflected, scattered; `lab`: params `cloud` (%) and `elev` (m) */
  | { mode: 'heating'; part: 'flow' | 'weaken' | 'lab' }
  /**
   * `plain`: patches A (left) and B (right); `sea`: sea (left) and land (right): params or options `left` / `right`
   * (°C), or for `sea` a clock in hours that warms and cools the land through the day. `valley`: a clock in hours
   * (or `hour`). `city`: param or option `heat` (°C warmer than the suburbs). `bare`: no pressure or wind labels
   * (for "pick it" questions).
   */
  | { mode: 'thermal'; scene: 'plain' | 'sea' | 'valley' | 'city'; left?: number; right?: number; hour?: number; heat?: number; bare?: boolean }
  /** params (or options) `lat` (−90 … 90) and `fric` (0 … 1) */
  | { mode: 'wind'; lat?: number; fric?: number };

type O<M> = Extract<Opts, { mode: M }> & { clock?: unknown };
const D2R = Math.PI / 180, TAU = Math.PI * 2;
const P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const num = (v: number, dp = 0) => { const r = Math.round(v * 10 ** dp) / 10 ** dp; return (r === 0 ? 0 : r).toFixed(dp).replace('-', '−'); };
const latTxt = (v: number): Pair => Math.abs(v) < 0.5 ? ['Equator', '赤道'] : [`${num(Math.abs(v))}°${v > 0 ? 'N' : 'S'}`, `${v > 0 ? '北纬' : '南纬'} ${num(Math.abs(v))}°`];

/** A label whose text is rewritten only when it changes. */
function live(l: Label): (t: Pair) => void {
  let last = '';
  return t => { const k = t[0] + t[1]; if (k !== last) { last = k; l.set(t); } };
}
const param = (ctx: KitCtx, id: string, def: number) => { const v = ctx.param(id); return Number.isNaN(v) ? def : v; };
function std(c: string, o: { opacity?: number; emissive?: string; rough?: number } = {}): THREE.MeshStandardMaterial {
  const see = o.opacity !== undefined;
  return new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? 0.85, metalness: 0, transparent: see, opacity: o.opacity ?? 1, depthWrite: !see, emissive: o.emissive ?? '#000000' });
}
/** An axis-aligned box from corner to corner. */
function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, m: THREE.Material): THREE.Mesh {
  const b = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), m);
  b.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  b.scale.set(x1 - x0, y1 - y0, Math.max(1e-3, z1 - z0));
  return b;
}
const setZ = (b: THREE.Object3D, z0: number, z1: number) => { b.position.z = (z0 + z1) / 2; b.scale.z = Math.max(1e-3, z1 - z0); };
function lights(root: THREE.Object3D, k = 1): { sun: THREE.DirectionalLight; hemi: THREE.HemisphereLight } {
  const hemi = new THREE.HemisphereLight('#dbe9ff', '#3a3226', 1.1 * k);
  hemi.position.set(0, 0, 1);
  const sun = new THREE.DirectionalLight('#ffffff', 1.6 * k);
  sun.position.set(-3, -6, 8);
  root.add(hemi, sun);
  return { sun, hemi };
}
/** Soft glowing particles (one shared texture: not disposed). */
function dots(n: number, size: number, color?: string): THREE.Points {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  const m = new THREE.PointsMaterial({ map: glowTexture(), size, sizeAttenuation: true, vertexColors: !color, color: color ?? '#ffffff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const p = new THREE.Points(g, m);
  p.userData.keepMap = true;
  p.frustumCulled = false;
  return p;
}
/** A puffy cloud of a few balls sharing one material. */
function cloud(seed: number, s: number, m: THREE.Material): THREE.Group {
  const R = rng(seed), g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry((0.2 + R() * 0.13) * s * (i === 2 || i === 3 ? 1.3 : 1), 18, 12), m);
    b.position.set((i - 2.5) * 0.19 * s, (R() - 0.5) * 0.3 * s, (i === 2 || i === 3 ? 0.1 : 0) * s + R() * 0.05 * s);
    g.add(b);
  }
  return g;
}
const cloudMat = () => new THREE.MeshStandardMaterial({ color: '#f8f9fa', roughness: 1, emissive: '#4a5560', transparent: true, opacity: 0.96 });

/** Points of a wave from a to b in the xz plane (long-wave radiation). */
function wavy(a: THREE.Vector3, b: THREE.Vector3, amp = 0.09, wl = 0.42): THREE.Vector3[] {
  const d = b.clone().sub(a), L = d.length(), n = Math.max(12, Math.ceil((L / wl) * 10));
  const u = d.clone().normalize(), perp = P(-u.z, 0, u.x);
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, w = Math.sin((t * L * TAU) / wl) * amp * Math.min(1, t * 8, (1 - t) * 8);
    return a.clone().addScaledVector(d, t).addScaledVector(perp, w);
  });
}

/** A flow arrow along a path: a glowing tube that draws itself in, an arrow head, and pulses running along it. */
class Stream extends THREE.Group {
  private curve: THREE.CatmullRomCurve3;
  private tube: THREE.Mesh;
  private head: THREE.Mesh;
  private pulses: THREE.Mesh[] = [];
  private tm: THREE.MeshStandardMaterial;
  private pm: THREE.MeshBasicMaterial;
  private n: number;
  constructor(pts: THREE.Vector3[], color: string, r = 0.05, npulse = 3) {
    super();
    this.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    this.tm = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, roughness: 0.6, transparent: true, opacity: 0.9, depthWrite: false });
    this.tube = new THREE.Mesh(new THREE.TubeGeometry(this.curve, Math.max(24, pts.length * 4), r, 8), this.tm);
    this.n = this.tube.geometry.index!.count;
    this.head = new THREE.Mesh(new THREE.ConeGeometry(r * 2.7, r * 7, 16), this.tm);
    this.pm = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.65), transparent: true, opacity: 0.95, depthWrite: false });
    for (let i = 0; i < npulse; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(r * 1.45, 10, 8), this.pm); this.pulses.push(p); this.add(p); }
    this.add(this.tube, this.head);
    this.renderOrder = 4;
  }
  /** `f`: drawn fraction (0 … 1); `a`: opacity; `el`: seconds, for the pulses. */
  update(f: number, a: number, el: number, speed = 0.4): void {
    this.visible = f > 0.002 && a > 0.01;
    if (!this.visible) return;
    this.tube.geometry.setDrawRange(0, Math.floor((this.n * f) / 6) * 6);
    const fe = Math.max(0.002, Math.min(f, 0.999));
    this.head.position.copy(this.curve.getPointAt(fe));
    this.head.quaternion.setFromUnitVectors(UP, this.curve.getTangentAt(fe));
    this.tm.opacity = 0.9 * a; this.pm.opacity = 0.95 * a;
    this.pulses.forEach((p, i) => { p.visible = f > 0.15; p.position.copy(this.curve.getPointAt((((el * speed + i / this.pulses.length) % 1) + 1) % 1 * fe)); });
  }
}
const UP = new THREE.Vector3(0, 1, 0);

// ——— layers: the vertical structure of the atmosphere ———
/** Tropopause height (km): about 17–18 km over the equator, 8–9 km over the poles. */
const tropopause = (lat: number) => 8.5 + 9 * Math.cos(lat * D2R) ** 3;
const surfaceT = (lat: number) => 26 - 36 * (Math.abs(lat) / 90) ** 1.5;
/** An illustrative temperature profile (°C): −6 °C/km up to the tropopause, warming to the stratopause at 50 km. */
function airT(h: number, lat: number): number {
  const H = tropopause(lat), T0 = surfaceT(lat), Tp = T0 - 6 * H;
  if (h <= H) return T0 - 6 * h;
  if (h <= 50) return Tp + (-3 - Tp) * ((h - H) / (50 - H)) ** 1.6;
  if (h <= 85) return -3 - (h - 50) * (85 / 35);
  return -88 + (h - 85) * 3;
}
const airP = (h: number) => 1013 * Math.exp(-h / 7.5);
const layerOf = (h: number, lat: number): Pair => h <= tropopause(lat) ? ['troposphere', '对流层'] : h <= 50 ? ['stratosphere', '平流层'] : ['upper atmosphere', '高层大气'];

function layersMode(ctx: KitCtx, o: O<'layers'>): KitRun {
  const root = ctx.root;
  lights(root);
  const S = 0.075, Z = (h: number) => h * S;
  const X0 = -3.7, X1 = -0.7, XM = (X0 + X1) / 2, DY = 0.8;
  const G0 = 0.9, G1 = 5.6, TX = (t: number) => G0 + ((t + 100) / 140) * (G1 - G0);
  const front = -DY - 0.02;

  root.add(box(X0 - 0.35, X1 + 0.35, -DY - 0.25, DY + 0.25, -0.4, 0, std('#5f8a45')));
  const tropo = box(X0, X1, -DY, DY, 0, 1, std('#4dabf7', { opacity: 0.34, emissive: '#0b2a4a' }));
  const strato = box(X0, X1, -DY, DY, 0, 1, std('#38d9a9', { opacity: 0.2, emissive: '#06302a' }));
  const high = box(X0, X1, -DY, DY, Z(50), Z(120), std('#9775fa', { opacity: 0.14, emissive: '#1d1240' }));
  const ozone = box(X0 - 0.03, X1 + 0.03, -DY - 0.03, DY + 0.03, Z(20), Z(30), std('#ffd43b', { opacity: 0.22, emissive: '#5c4500' }));
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(X1 - X0, 2 * DY, Z(120))), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.25 }));
  frame.position.set(XM, 0, Z(60));
  root.add(tropo, strato, high, ozone, frame);

  // a mountain, a few clouds, an airliner, the aurora and the ionosphere
  const mtn = new THREE.Mesh(new THREE.ConeGeometry(0.75, Z(8.8), 6), std('#8c7a64'));
  mtn.rotation.x = Math.PI / 2; mtn.position.set(X0 + 0.85, 0.2, Z(4.4));
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.26, Z(3), 6), std('#f1f3f5'));
  cap.rotation.x = Math.PI / 2; cap.position.set(X0 + 0.85, 0.2, Z(7.3));
  root.add(mtn, cap);
  const cm = cloudMat();
  for (let i = 0; i < 3; i++) { const c = cloud(11 + i, 0.55, cm); c.position.set(X0 + 1.4 + i * 0.6, -0.2 + i * 0.25, Z(2.5 + i * 1.6)); root.add(c); }
  const plane = new THREE.Group();
  const pm = std('#e9ecef', { rough: 0.4 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.5, 12), pm);
  body.rotation.z = Math.PI / 2;
  plane.add(body, box(-0.06, 0.06, -0.24, 0.24, -0.008, 0.008, pm), box(-0.25, -0.19, -0.09, 0.09, -0.006, 0.006, pm), box(-0.25, -0.2, -0.006, 0.006, 0, 0.11, pm));
  root.add(plane);
  const aurTex = canvasTex(4, 128, c => {
    const g = c.createLinearGradient(0, 128, 0, 0);
    g.addColorStop(0, 'rgba(80,255,150,0.95)'); g.addColorStop(0.45, 'rgba(60,220,170,0.5)'); g.addColorStop(0.8, 'rgba(170,110,255,0.25)'); g.addColorStop(1, 'rgba(170,110,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 4, 128);
  });
  const aurora = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0 - 0.4, Z(20), 40, 1), new THREE.MeshBasicMaterial({ map: aurTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  aurora.rotation.x = Math.PI / 2; aurora.position.set(XM, 0, Z(108));
  root.add(aurora);
  const aPos = aurora.geometry.getAttribute('position') as THREE.BufferAttribute, aX = Array.from({ length: aPos.count }, (_, i) => aPos.getX(i));
  const ion = dots(ctx.low ? 70 : 140, 0.09, '#b197fc');
  const R = rng(5), ip = ion.geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < ip.count; i++) ip.setXYZ(i, lerp(X0 + 0.1, X1 - 0.1, R()), lerp(-DY, DY, R()), Z(lerp(80, 119, R())));
  (ion.material as THREE.PointsMaterial).opacity = 0.7;
  root.add(ion);
  const radio = new Stream([P(X0 + 0.35, -0.3, 0.05), P(XM - 0.6, -0.3, Z(55)), P(XM, -0.3, Z(85)), P(XM + 0.6, -0.3, Z(55)), P(X1 - 0.35, -0.3, 0.05)], '#e599f7', 0.03, 2);
  root.add(radio);

  // the chart: axes, grid and the temperature curve
  const axM = new THREE.MeshBasicMaterial({ color: '#dee2e6', transparent: true, opacity: 0.7 });
  root.add(box(G0 - 0.012, G0 + 0.012, -0.012, 0.012, 0, Z(124), axM), box(G0, G1, -0.012, 0.012, -0.012, 0.012, axM));
  for (let h = 20; h <= 120; h += 20) {
    root.add(line([[G0, 0, Z(h)], [G1, 0, Z(h)]], '#ffffff', { opacity: 0.1 }));
    ctx.label(P(G0, 0, Z(h)), String(h), { c: '#adb5bd', dx: -16 });
  }
  ctx.label(P(G0, 0, Z(124)), ['height (km)', '高度（千米）'], { c: '#adb5bd', dy: -12 });
  for (const t of [-80, -40, 0, 40]) {
    root.add(line([[TX(t), 0, 0], [TX(t), 0, Z(120)]], '#ffffff', { opacity: t === 0 ? 0.22 : 0.08 }));
    ctx.label(P(TX(t), 0, 0), `${num(t)}`, { c: '#adb5bd', dy: 14 });
  }
  ctx.label(P(G1, 0, 0), ['°C', '°C'], { c: '#adb5bd', dy: 14, dx: 18 });
  const curveM = std('#ff8787', { emissive: '#ff6b6b' });
  curveM.emissiveIntensity = 0.6;
  const curve = new THREE.Mesh(new THREE.BufferGeometry(), curveM);
  root.add(curve);
  const tLine = line([[X0, front, 0], [G1, front, 0]], '#74c0fc', { dashed: true, dash: 0.12, opacity: 0.9 });
  const sLine = line([[X0, front, Z(50)], [G1, front, Z(50)]], '#63e6be', { dashed: true, dash: 0.12, opacity: 0.8 });
  root.add(tLine, sLine);
  const tLab = ctx.label(P(G1, 0, 0), ['Tropopause', '对流层顶'], { c: '#74c0fc', dx: 44, t: 2.6 });
  ctx.label(P(G1, 0, Z(50)), ['Stratopause', '平流层顶'], { c: '#63e6be', dx: 44, t: 2.8 });

  // layer names, beside the column
  const nTro = ctx.label(P(X0, front, 0), ['Troposphere', '对流层'], { c: '#74c0fc', big: true, dx: -58, t: 0.4 });
  ctx.label(P(X0, front, Z(40)), ['Stratosphere', '平流层'], { c: '#63e6be', big: true, dx: -58, t: 1 });
  ctx.label(P(X0, front, Z(70)), ['Upper atmosphere', '高层大气'], { c: '#b197fc', big: true, dx: -66, t: 1.6 });
  ctx.label(P(X1, front, Z(30)), ['Ozone layer: absorbs UV', '臭氧层：吸收紫外线'], { c: '#ffd43b', dx: 4, dy: -12, t: 2.2 });
  ctx.label(P(XM, front, Z(92)), ['Ionosphere: reflects radio waves', '电离层：反射无线电波'], { c: '#e599f7', t: 2.6 });
  ctx.label(P(XM, front, Z(116)), ['Aurora', '极光'], { c: '#8ce99a', t: 3 });
  const pLab = ctx.label(plane, ['Airliners: smooth, level air', '飞机：气流平稳，利于飞行'], { c: '#e9ecef', dx: -40, dy: 14, t: 1.8 });
  ctx.label(P(X0 + 1.6, front, Z(5.5)), ['Clouds, rain: weather', '云、雨等天气现象'], { c: '#e9ecef', dx: 6, t: 0.8 });

  // the altitude cursor
  const curM = new THREE.MeshBasicMaterial({ color: '#ffd43b', transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide });
  const cur = box(X0 - 0.08, X1 + 0.08, -DY - 0.08, DY + 0.08, -0.01, 0.01, curM);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffd43b' }));
  const lead = line([[X1, 0, 0], [G0, 0, 0]], '#ffd43b', { dashed: true, dash: 0.1, opacity: 0.8 });
  root.add(cur, dot, lead);
  const read = live(ctx.label(dot, '', { c: '#ffe066', big: true, dy: -22 }));

  let lastLat = NaN;
  const build = (lat: number) => {
    const pts: THREE.Vector3[] = [];
    for (let h = 0; h <= 120; h += 1) pts.push(P(TX(airT(h, lat)), 0, Z(h)));
    curve.geometry.dispose();
    curve.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.035, 8);
    const H = tropopause(lat);
    setZ(tropo, 0, Z(H)); setZ(strato, Z(H), Z(50));
    setLine(tLine, [[X0, front, Z(H)], [G1, front, Z(H)]]);
    tLab.pos.set(G1, 0, Z(H));
    nTro.pos.set(X0, front, Z(H / 2));
    plane.position.set(X0 + 2.2, -0.1, Z(H + 1.2));
  };
  ctx.view([0, -1, 0.1], 15.5, [0.9, 0, Z(58)], true);

  return {
    update(_v, _dt, el) {
      const lat = clamp(param(ctx, 'lat', o.lat ?? 40), -90, 90);
      if (!(Math.abs(lat - lastLat) <= 0.05)) { build(lat); lastLat = lat; }
      const n = curve.geometry.index?.count ?? 0;
      curve.geometry.setDrawRange(0, Math.floor((n * ramp(el, 0.6, 2.4)) / 6) * 6);
      radio.update(ramp(el, 2.4, 1.6), 0.85, el, 0.3);
      for (let i = 0; i < aPos.count; i++) aPos.setZ(i, 0.12 * Math.sin(aX[i] * 2.4 + el * 1.3) + 0.05 * Math.sin(aX[i] * 6 - el * 2));
      aPos.needsUpdate = true;
      (aurora.material as THREE.MeshBasicMaterial).opacity = 0.75 + 0.25 * Math.sin(el * 1.7);
      pLab.on = el < 9;
      const alt = param(ctx, 'alt', o.alt ?? NaN);
      const on = Number.isFinite(alt);
      cur.visible = dot.visible = lead.visible = on;
      if (!on) { read(['', '']); return; }
      const h = clamp(alt, 0, 120), T = airT(h, lat), p = airP(h);
      cur.position.z = Z(h);
      dot.position.set(TX(T), 0, Z(h));
      setLine(lead, [[X1 + 0.08, 0, Z(h)], [TX(T), 0, Z(h)]]);
      const ps = p >= 100 ? num(p) : p >= 1 ? num(p, 1) : num(p, 3), L = layerOf(h, lat);
      read([`${num(h)} km · ${num(T)} °C · ${ps} hPa · ${L[0]}`, `${num(h)} 千米 · ${num(T)} °C · ${ps} 百帕 · ${L[1]}`]);
    },
  };
}

// ——— heating: how the Sun heats the atmosphere ———
/** The heating lab: the day's high and the night's low (°C) under cloud cover `c` (0 … 1) at elevation `E` (km). */
function heatLab(c: number, E: number) {
  const R = (14 - 10 * c) * (1 + 0.12 * E), M = 22 - 4.5 * E - 2 * c;
  return { tmax: M + R / 2, tmin: M - R / 2, sun: (1 - 0.62 * c) * (0.8 + 0.04 * E), back: 0.35 + 0.65 * c - 0.05 * E };
}

function heatingMode(ctx: KitCtx, o: O<'heating'>): KitRun {
  const root = ctx.root, part = o.part;
  const { hemi } = lights(root);
  const TOP = 3.4, W = 6, DY = 1.1;
  // the ground (day half and night half), the air, the Sun, the Moon
  const dayM = std('#6f9a4c'), nightM = std('#3f5a33');
  const dayG = box(-W, 0, -DY, DY, -0.45, 0, dayM), nightG = box(0, W, -DY, DY, -0.45, 0, nightM);
  root.add(dayG, nightG);
  const sky = box(-W, 0, -DY, DY, 0, TOP, std('#74c0fc', { opacity: 0.16, emissive: '#16446e' }));
  const nsky = box(0, W, -DY, DY, 0, TOP, std('#364fc7', { opacity: 0.16, emissive: '#0b1440' }));
  root.add(sky, nsky);
  const edge = line([[-W, -DY, TOP], [W, -DY, TOP]], '#a5d8ff', { opacity: 0.5, dashed: true, dash: 0.15 });
  root.add(edge, line([[0, -DY, 0], [0, -DY, TOP + 1.6]], '#ffffff', { opacity: 0.18, dashed: true, dash: 0.12 }));
  const sunAt = P(-5.3, 0, 6.1);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 20), new THREE.MeshBasicMaterial({ color: '#ffe066' }));
  sun.position.copy(sunAt);
  const sg = glow('#ffd43b', 3.2, 0.8); sg.position.copy(sunAt);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.26, 28, 18), std('#dee2e6', { emissive: '#868e96' }));
  moon.position.set(4.9, 0, 5.4);
  root.add(sun, sg, moon);
  const st = dots(60, 0.07, '#ffffff'), sp = st.geometry.getAttribute('position') as THREE.BufferAttribute, R = rng(9);
  for (let i = 0; i < sp.count; i++) sp.setXYZ(i, lerp(0.4, W, R()), lerp(-1, 1, R()), lerp(TOP + 0.5, 6.6, R()));
  root.add(st);
  ctx.label(P(-3, -DY, TOP + 2.9), ['Day', '白天'], { c: '#ffe066', big: true });
  ctx.label(P(3, -DY, TOP + 2.9), ['Night', '夜晚'], { c: '#91a7ff', big: true });
  ctx.label(P(W, -DY, TOP), ['Top of the atmosphere', '大气上界'], { c: '#a5d8ff', dx: -70, dy: -12 });
  ctx.view([0, -1, 0.16], 15, [0, 0, 2.7], true);
  const els: { s: Stream; t0: number; dur: number; a?: () => number }[] = [];
  const add = (pts: THREE.Vector3[], c: string, t0: number, dur = 1.3, r = 0.06) => { const s = new Stream(pts, c, r); root.add(s); els.push({ s, t0, dur }); return s; };
  const lab = (at: THREE.Vector3, t: Pair, c: string, t0: number, o2: { dx?: number; dy?: number; big?: boolean } = {}) => ctx.label(at, t, { c, t: t0, ...o2 });
  const y0 = -0.2;

  if (part === 'flow') {
    add([sunAt.clone().add(P(0.35, y0, -0.35)), P(-3.1, y0, 0.06)], '#ffd43b', 0.3, 1.4, 0.08);
    lab(P(-4.1, y0, 3.2), ['① Solar radiation (short-wave)', '① 太阳辐射（短波）'], '#ffe066', 0.5, { dx: -20 });
    const warm = glow('#ff922b', 2.4, 0); warm.position.set(-3.0, 0, 0.05); warm.scale.set(3.2, 1.2, 1); root.add(warm);
    lab(P(-3.0, -DY, 0), ['② The ground absorbs it and warms', '② 地面吸收，增温'], '#ffa94d', 1.7, { dy: 18 });
    add(wavy(P(-2.5, y0, 0.08), P(-1.3, y0, 2.35)), '#ff6b6b', 2.6, 1.4);
    lab(P(-1.95, y0, 1.2), ['③ Ground radiation (long-wave)', '③ 地面辐射（长波）'], '#ff8787', 2.9, { dx: -86 });
    const airG = glow('#ff922b', 2.8, 0); airG.position.set(-0.4, 0, 2.5); airG.scale.set(4.2, 1.6, 1); root.add(airG);
    lab(P(-0.4, y0, 2.95), ['④ The air (vapour, CO₂) absorbs it and warms', '④ 大气（水汽、CO₂）吸收，增温'], '#ffc078', 4.1, { dy: -8 });
    add(wavy(P(0.9, y0, 2.35), P(2.1, y0, 0.08)), '#ff922b', 5.3, 1.4);
    add(wavy(P(-1.3, y0, 2.3), P(-2.3, y0, 0.1), 0.07), '#ff922b', 5.3, 1.4, 0.045);
    lab(P(1.5, y0, 1.2), ['⑤ Counter-radiation: keeps the ground warm', '⑤ 大气逆辐射：保温作用'], '#ffc078', 5.6, { dx: 96 });
    add(wavy(P(2.6, y0, 2.6), P(3.6, y0, 5.3)), '#e599f7', 6.8, 1.3, 0.05);
    lab(P(3.7, y0, 5.3), ['Lost to space', '射向宇宙空间'], '#e599f7', 7.3, { dx: 50 });
    return {
      update(_v, _dt, el) {
        for (const e of els) e.s.update(ramp(el, e.t0, e.dur), 1, el);
        warm.material.opacity = 0.75 * ramp(el, 1.5, 0.8);
        airG.material.opacity = 0.55 * ramp(el, 3.9, 0.8) * (0.85 + 0.15 * Math.sin(el * 2));
      },
    };
  }

  if (part === 'weaken') {
    const ozone = box(-W, 0, -DY, DY, TOP - 0.45, TOP - 0.15, std('#ffd43b', { opacity: 0.22, emissive: '#5c4500' }));
    const vapour = box(-W, 0, -DY, DY, 0, 1.2, std('#a5d8ff', { opacity: 0.14 }));
    root.add(ozone, vapour);
    const cm = cloudMat();
    const cl = cloud(4, 1.1, cm); cl.position.set(-2.2, 0, 2.2); root.add(cl);
    // absorbed: the ray thins as it crosses the ozone layer
    add([sunAt.clone().add(P(0.2, y0, -0.4)), P(-4.9, y0, TOP - 0.3)], '#ffd43b', 0.3, 0.9, 0.08);
    add([P(-4.9, y0, TOP - 0.3), P(-4.6, y0, 0.06)], '#ffd43b', 1.1, 1, 0.04);
    const ab = glow('#ffd43b', 1.6, 0); ab.position.set(-4.9, 0, TOP - 0.3); root.add(ab);
    lab(P(-5.3, y0, TOP - 0.3), ['Absorbed: ozone takes UV, vapour and CO₂ take infrared', '吸收：臭氧吸收紫外线，水汽、CO₂吸收红外线'], '#ffe066', 1.2, { dx: -10, dy: 28 });
    // reflected by the cloud
    add([sunAt.clone().add(P(0.4, y0, -0.25)), P(-2.2, y0, 2.6)], '#fff3bf', 1.8, 1.1, 0.07);
    add([P(-2.2, y0, 2.6), P(-0.6, y0, 5.6)], '#f8f9fa', 2.9, 1.1, 0.06);
    lab(P(-0.9, y0, 5.2), ['Reflected: by clouds (thicker clouds, more)', '反射：云层越厚，反射越强'], '#f8f9fa', 3.2, { dx: 120 });
    // scattered: blue light bounces in all directions
    add([sunAt.clone().add(P(0.35, y0, -0.35)), P(-3.6, y0, 1.6)], '#ffd43b', 3.8, 1, 0.06);
    const burst: Stream[] = [];
    for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + 0.3; burst.push(add([P(-3.6, y0, 1.6), P(-3.6 + 0.85 * Math.cos(a), y0, 1.6 + 0.85 * Math.sin(a))], '#4dabf7', 4.7, 0.6, 0.03)); }
    lab(P(-3.6, y0, 0.55), ['Scattered: blue light most → blue sky', '散射：蓝紫光最易被散射→晴空蔚蓝'], '#74c0fc', 5, { dx: -40 });
    // what is left reaches the ground
    add([sunAt.clone().add(P(0.42, y0, -0.2)), P(-0.9, y0, 0.06)], '#ffd43b', 6, 1.2, 0.07);
    const warm = glow('#ff922b', 2, 0); warm.position.set(-0.9, 0, 0.05); warm.scale.set(2.6, 1, 1); root.add(warm);
    lab(P(-0.9, -DY, 0), ['The rest reaches and heats the ground', '其余到达地面，使地面增温'], '#ffa94d', 6.8, { dy: 18 });
    return {
      update(_v, _dt, el) {
        for (const e of els) e.s.update(ramp(el, e.t0, e.dur), 1, el);
        ab.material.opacity = 0.7 * ramp(el, 1, 0.5) * (0.8 + 0.2 * Math.sin(el * 3));
        warm.material.opacity = 0.7 * ramp(el, 6.9, 0.8);
      },
    };
  }

  // the lab: cloud cover and elevation set the day's high and the night's low
  const cm = cloudMat();
  const clouds = Array.from({ length: 12 }, (_, i) => { const c = cloud(20 + i, 0.8, cm); c.position.set(-W + 0.6 + (i % 12) * 0.96, (i % 3 - 1) * 0.35, 2.55 + (i % 2) * 0.35); root.add(c); return c; });
  const order = [5, 6, 2, 9, 0, 11, 4, 7, 1, 10, 3, 8];
  const sunRay = new Stream([sunAt.clone().add(P(0.35, y0, -0.35)), P(-3, y0, 0.06)], '#ffd43b', 0.09);
  const groundRad = new Stream(wavy(P(1.6, y0, 0.08), P(2.4, y0, 2.4)), '#ff6b6b', 0.06);
  const back = new Stream(wavy(P(3.3, y0, 2.4), P(4.1, y0, 0.08)), '#ff922b', 0.06);
  const lost = new Stream(wavy(P(4.4, y0, 0.08), P(5.3, y0, 5.2)), '#e599f7', 0.05);
  root.add(sunRay, groundRad, back, lost);
  ctx.label(P(-3.4, y0, 1.6), ['Sunlight reaching the ground', '到达地面的太阳辐射'], { c: '#ffe066', dx: -70 });
  ctx.label(P(3.7, y0, 1.25), ['Counter-radiation', '大气逆辐射'], { c: '#ffc078', dx: 64 });
  ctx.label(P(5.1, y0, 4.6), ['Escapes to space', '散失到宇宙'], { c: '#e599f7', dx: 46 });
  // two thermometers: the day's high and the night's low
  const thermo = (x: number, c: string) => {
    const g = new THREE.Group();
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 2.4, 20, 1, true), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.22, roughness: 0.2, depthWrite: false, side: THREE.DoubleSide }));
    tube.rotation.x = Math.PI / 2; tube.position.z = 1.2;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), std(c, { emissive: c }));
    const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1, 16), std(c, { emissive: c }));
    fill.rotation.x = Math.PI / 2;
    g.add(tube, bulb, fill);
    g.position.set(x, -DY - 0.4, 0.25);
    root.add(g);
    return (T: number) => { const h = clamp((T + 20) / 55, 0.02, 1) * 2.3; fill.scale.y = h; fill.position.z = h / 2; };
  };
  const tDay = thermo(-W + 0.55, '#ff6b6b'), tNight = thermo(W - 0.55, '#4dabf7');
  const rDay = live(ctx.label(P(-W + 0.55, -DY - 0.4, 2.95), '', { c: '#ffa8a8', big: true }));
  const rNight = live(ctx.label(P(W - 0.55, -DY - 0.4, 2.95), '', { c: '#a5d8ff', big: true }));
  const rAll = live(ctx.label(P(0, -DY, -0.45), '', { c: '#ffe066', big: true, dy: 22 }));
  const lowG = '#6f9a4c', hiG = '#9c8466';
  return {
    update(_v, _dt, el) {
      const c = clamp(param(ctx, 'cloud', 50) / 100), E = clamp(param(ctx, 'elev', 0) / 1000, 0, 6), m = heatLab(c, E);
      const n = Math.round(c * 12);
      order.forEach((k, i) => { clouds[k].visible = i < n; });
      const gz = E * 0.25;
      setZ(dayG, -0.45, gz); setZ(nightG, -0.45, gz);
      dayM.color.set(lowG).lerp(new THREE.Color(hiG), clamp(E / 4)); nightM.color.copy(dayM.color).multiplyScalar(0.62);
      setZ(sky, gz, TOP); setZ(nsky, gz, TOP);
      sunRay.position.z = 0; sunRay.scale.set(1, 1, 1);
      sunRay.update(1, clamp(0.25 + m.sun * 0.75, 0.1, 1), el);
      groundRad.position.z = gz; groundRad.update(1, 0.9, el);
      back.position.z = gz * 0.5; back.update(1, clamp(0.2 + 0.8 * m.back, 0.12, 1), el, 0.25 + 0.4 * c);
      lost.position.z = gz * 0.5; lost.update(1, clamp(1 - 0.75 * c, 0.15, 1), el);
      hemi.intensity = 1.1;
      tDay(m.tmax); tNight(m.tmin);
      rDay([`High ${num(m.tmax)} °C`, `最高 ${num(m.tmax)} °C`]);
      rNight([`Low ${num(m.tmin)} °C`, `最低 ${num(m.tmin)} °C`]);
      rAll([`Day–night range ${num(m.tmax - m.tmin)} °C`, `昼夜温差 ${num(m.tmax - m.tmin)} °C`]);
    },
  };
}

// ——— thermal: thermal circulation ———
/** A closed loop sampled evenly, for particles that run round it. */
class Loop {
  readonly pts: THREE.Vector3[] = [];
  readonly tan: THREE.Vector3[] = [];
  readonly nrm: THREE.Vector3[] = [];
  constructor(corners: THREE.Vector3[], readonly n = 360) {
    const c = new THREE.CatmullRomCurve3(corners, true, 'catmullrom', 0.12);
    for (let i = 0; i < n; i++) {
      const u = i / n, t = c.getTangentAt(u);
      this.pts.push(c.getPointAt(u)); this.tan.push(t); this.nrm.push(P(-t.z, 0, t.x));
    }
  }
  at(u: number): number { return ((Math.floor((((u % 1) + 1) % 1) * this.n) % this.n) + this.n) % this.n; }
}
const lsTemp = (h: number) => 20 + 8 * Math.sin((TAU * (h - 9)) / 24);
const ssTemp = (h: number) => 20 + 1.5 * Math.sin((TAU * (h - 11)) / 24);
/** A flat ribbon in the xz plane at depth y (a bendable isobaric surface seen edge-on). */
class Ribbon extends THREE.Mesh {
  private n: number;
  constructor(n: number, color: string, readonly y: number, readonly w = 0.035) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3));
    const idx: number[] = [];
    for (let i = 0; i < n - 1; i++) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
    g.setIndex(idx);
    super(g, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.95, depthWrite: false }));
    this.n = n;
    this.frustumCulled = false;
    this.renderOrder = 5;
  }
  set(xs: number[], zs: number[]): void {
    const a = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < this.n; i++) { a.setXYZ(2 * i, xs[i], this.y, zs[i] - this.w); a.setXYZ(2 * i + 1, xs[i], this.y, zs[i] + this.w); }
    a.needsUpdate = true;
  }
}

function thermalMode(ctx: KitCtx, o: O<'thermal'>): KitRun {
  const root = ctx.root, sc = o.scene, bare = !!o.bare, clocked = !!o.clock;
  const { hemi, sun: dl } = lights(root);
  const W = 5.5, DY = 1.2, TOP = sc === 'valley' ? 4.4 : 3.6, FY = -DY - 0.03;
  const terr = (x: number) => sc === 'valley' ? 2.2 * (Math.abs(x) / 5) ** 1.3 : 0;
  // the ground
  const gm = (c: string) => std(c);
  const patches: { m: THREE.MeshStandardMaterial; base: THREE.Color }[] = [];
  const patch = (x0: number, x1: number, c: string) => { const m = gm(c); root.add(box(x0, x1, -DY, DY, -0.4, 0, m)); patches.push({ m, base: new THREE.Color(c) }); return m; };
  if (sc === 'valley') {
    const n = 80, shape = new THREE.Shape();
    shape.moveTo(-W, -0.4);
    for (let i = 0; i <= n; i++) { const x = -W + (2 * W * i) / n; shape.lineTo(x, terr(x)); }
    shape.lineTo(W, -0.4); shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 2 * DY, bevelEnabled: false, curveSegments: 4 });
    g.rotateX(Math.PI / 2); g.translate(0, DY, 0);
    const m = gm('#6a8f4e'); patches.push({ m, base: new THREE.Color('#6a8f4e') });
    root.add(new THREE.Mesh(g, m));
    const R = rng(3), tm = std('#2f6b3a');
    for (let i = 0; i < 26; i++) {
      const x = (R() < 0.5 ? -1 : 1) * lerp(1.2, 4.6, R()), y = lerp(-DY + 0.2, DY - 0.2, R());
      const t = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.42, 8), tm);
      t.rotation.x = Math.PI / 2; t.position.set(x, y, terr(x) + 0.2); root.add(t);
    }
  } else if (sc === 'sea') {
    patch(0, W, '#8a9a5b');
    const water = box(-W, 0, -DY, DY, -0.4, -0.02, new THREE.MeshStandardMaterial({ color: '#1c7ed6', roughness: 0.25, metalness: 0.1, emissive: '#0b3d6e' }));
    root.add(water);
    patches.unshift({ m: water.material as THREE.MeshStandardMaterial, base: new THREE.Color('#1c7ed6') });
  } else if (sc === 'city') {
    patch(-W, W, '#7c9a55');
    const R = rng(8), bm = std('#adb5bd', { rough: 0.5 }), bm2 = std('#868e96', { rough: 0.5 });
    for (let i = 0; i < 22; i++) {
      const x = lerp(-1.5, 1.5, R()), y = lerp(-0.9, 0.9, R()), h = 0.3 + R() * 1.1 * (1 - Math.abs(x) / 2.2);
      root.add(box(x - 0.14, x + 0.14, y - 0.14, y + 0.14, 0, h, i % 2 ? bm : bm2));
    }
    const tm = std('#2b8a3e');
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
      const t = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), tm);
      t.position.set(s * (3 + (i % 2) * 0.3), -0.9 + i * 0.36, 0.2); root.add(t);
    }
    const fm = std('#495057');
    for (const s of [-1, 1]) {
      root.add(box(s * 5.1 - 0.3, s * 5.1 + 0.3, -0.5, 0.2, 0, 0.35, fm));
      const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.8, 12), fm);
      ch.rotation.x = Math.PI / 2; ch.position.set(s * 5.25, 0.05, 0.6); root.add(ch);
    }
    if (!bare) {
      ctx.label(P(0, FY, 1.3), ['City', '城市'], { c: '#f8f9fa', big: true });
      ctx.label(P(3.15, FY, 0.1), ['Green belt', '绿化带'], { c: '#8ce99a', dy: 16 });
      ctx.label(P(5.1, FY, 0.2), ['Factory: outside the loop', '工厂：布局在环流之外'], { c: '#ced4da', dy: 16, dx: -40 });
    }
  } else {
    patch(-W, -0.25, '#9c7b56'); patch(0.25, W, '#6f8f52');
  }
  const air = box(-W, W, -DY, DY, 0, TOP, std('#a5d8ff', { opacity: 0.1, emissive: '#0d2a45' }));
  root.add(air);
  root.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2 * W, 2 * DY, TOP)), new THREE.LineBasicMaterial({ color: '#a5d8ff', transparent: true, opacity: 0.22 })).translateZ(TOP / 2));

  // the loops
  const loops: { L: Loop; flip: number }[] = [];
  const zb = 0.4, zt = TOP - 0.55;
  if (sc === 'valley') {
    for (const s of [1, -1]) {
      const xs = [0.55, 2.0, 3.4, 4.3];
      const surf = xs.map(x => P(s * x, 0, terr(x) + 0.35));
      loops.push({ L: new Loop([...surf, P(s * 4.3, 0, zt), P(s * 2.4, 0, zt), P(s * 0.55, 0, zt), P(s * 0.55, 0, 1.4)]), flip: 1 });
    }
  } else if (sc === 'city') {
    for (const s of [1, -1]) loops.push({ L: new Loop([P(s * 4.3, 0, zb), P(s * 2.4, 0, zb), P(s * 0.6, 0, zb), P(s * 0.6, 0, zt * 0.55), P(s * 0.6, 0, zt), P(s * 2.4, 0, zt), P(s * 4.3, 0, zt), P(s * 4.3, 0, zt * 0.55)]), flip: 1 });
  } else {
    loops.push({ L: new Loop([P(3.7, 0, zb), P(0, 0, zb), P(-3.7, 0, zb), P(-3.7, 0, (zb + zt) / 2), P(-3.7, 0, zt), P(0, 0, zt), P(3.7, 0, zt), P(3.7, 0, (zb + zt) / 2)]), flip: 1 });
  }
  const N = ctx.low ? 220 : 480, R = rng(13);
  const pp = dots(N, 0.2), pa = pp.geometry.getAttribute('position') as THREE.BufferAttribute, pc = pp.geometry.getAttribute('color') as THREE.BufferAttribute;
  const pu = Float32Array.from({ length: N }, () => R()), py = Float32Array.from({ length: N }, () => lerp(-DY + 0.15, DY - 0.15, R()));
  const po = Float32Array.from({ length: N }, () => (R() - 0.5) * 0.5), pv = Float32Array.from({ length: N }, () => 0.8 + R() * 0.4);
  root.add(pp);
  const cones: { m: THREE.Mesh; L: Loop; u: number }[] = [];
  const coneM = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.35, transparent: true, opacity: 0.95 });
  for (const { L } of loops) for (const u of [0.07, 0.25, 0.43, 0.57, 0.75, 0.93]) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.42, 18), coneM.clone());
    root.add(m); cones.push({ m, L, u });
  }
  // the isobaric surfaces (drawn on the front face)
  const NX = 90, xs = Array.from({ length: NX }, (_, i) => -W + 0.2 + ((2 * W - 0.4) * i) / (NX - 1));
  const iso = [new Ribbon(NX, '#ffe066', FY), new Ribbon(NX, '#ffe066', FY)];
  if (sc !== 'valley') { root.add(...iso); if (!bare) ctx.label(P(-W + 0.2, FY, 2.6), ['Isobaric surfaces', '等压面'], { c: '#ffe066', dx: -56 }); }
  // high and low pressure: labels and pickable spots
  const spots: { tag: string; at: THREE.Vector3; up: boolean; side: number; l?: (t: Pair) => void }[] = [];
  if (sc !== 'valley') {
    const xL = sc === 'city' ? 0 : -3.4, xR = sc === 'city' ? 4.2 : 3.4;
    for (const [tag, x, z, up, side] of [['sfc-left', xL, 0.55, false, -1], ['sfc-right', xR, 0.55, false, 1], ['up-left', xL, zt + 0.2, true, -1], ['up-right', xR, zt + 0.2, true, 1]] as const) {
      const at = P(x, FY, z), s = { tag, at, up, side, l: undefined as ((t: Pair) => void) | undefined };
      const hit = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.copy(at); root.add(hit); ctx.pickable(hit, tag);
      if (!bare) s.l = live(ctx.label(at, '', { big: true, c: '#ffffff' }));
      spots.push(s);
    }
  }
  // temperatures of the two sides, and the wind's name
  const tl = sc !== 'valley' && sc !== 'city' ? live(ctx.label(P(-3, FY, 0), '', { c: '#ffc078', dy: 18 })) : null;
  const tr = sc !== 'valley' && sc !== 'city' ? live(ctx.label(P(3, FY, 0), '', { c: '#ffc078', dy: 18 })) : null;
  const name = bare ? null : live(ctx.label(P(0, FY, TOP + 0.35), '', { c: '#ffe066', big: true }));
  const sunG = glow('#ffd43b', 1.6, 0), moon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), std('#dee2e6', { emissive: '#868e96' }));
  if (clocked || o.hour !== undefined) root.add(sunG, moon);
  const rain = sc === 'valley' ? cloud(31, 1.2, cloudMat()) : null;
  if (rain) { rain.position.set(0, 0, 1.75); root.add(rain); }
  const rainLab = rain && !bare ? ctx.label(rain, ['Night rain in the valley', '谷地夜雨'], { c: '#a5d8ff', dy: -26 }) : null;
  ctx.view([0, -1, 0.22], 12, [0, 0, TOP / 2 + 0.2], true);

  let s = 0, hour = 12, ta = 0, tb = 0;
  const tcol = (T: number) => new THREE.Color('#4dabf7').lerp(new THREE.Color('#ff6b6b'), clamp((T - 10) / 25));
  return {
    update(v, dt, el) {
      // the strength and sense of the circulation: s > 0 rises on the left (or at the centre, or up the slopes)
      if (sc === 'valley') {
        hour = clocked ? v : o.hour ?? 13;
        s = Math.sin((TAU * (hour - 8)) / 24);
      } else if (sc === 'city') {
        const h = param(ctx, 'heat', o.heat ?? 3);
        s = clamp(h / 4, 0, 1.2);
      } else {
        if (sc === 'sea' && clocked) { hour = v; ta = ssTemp(v); tb = lsTemp(v); }
        else { ta = param(ctx, 'left', o.left ?? 20); tb = param(ctx, 'right', o.right ?? 20); }
        s = clamp((ta - tb) / 12, -1.2, 1.2);
        patches[0].m.emissive.copy(tcol(ta)).multiplyScalar(0.28);
        patches[patches.length - 1].m.emissive.copy(tcol(tb)).multiplyScalar(0.28);
      }
      if (sc === 'valley') patches[0].m.emissive.set(s > 0 ? '#5c2b00' : '#001a3a').multiplyScalar(Math.abs(s) * 0.8);
      if (sc === 'city') patches[0].m.emissive.set('#3a1a00').multiplyScalar(s * 0.4);
      // day and night
      if (clocked || o.hour !== undefined) {
        const a = (TAU * (hour - 6)) / 24, day = Math.sin(a);
        sunG.position.set(-Math.cos(a) * 4.6, 0, TOP + 0.4 + 1.1 * Math.max(0, day));
        sunG.material.opacity = clamp(day * 3 + 0.2);
        moon.visible = day < 0.05;
        moon.position.set(Math.cos(a) * 4.6, 0, TOP + 0.4 - 1.1 * Math.min(0, day));
        const k = 0.45 + 0.55 * clamp(day * 2 + 0.3);
        hemi.intensity = 1.1 * k; dl.intensity = 1.6 * k;
      }
      // particles
      const sp = clamp(Math.abs(s) * 1.6, 0, 1.4), sg = Math.sign(s), per = N / loops.length;
      const up = new THREE.Color('#ff922b'), dn = new THREE.Color('#4dabf7'), flat = new THREE.Color('#f1f3f5'), c = new THREE.Color();
      for (let i = 0; i < N; i++) {
        const lp = loops[Math.min(loops.length - 1, Math.floor(i / per))].L;
        pu[i] = (pu[i] + sg * sp * pv[i] * dt * 0.055 + 1) % 1;
        const k = lp.at(pu[i]), p = lp.pts[k], nn = lp.nrm[k], t = lp.tan[k];
        pa.setXYZ(i, p.x + nn.x * po[i], py[i], p.z + nn.z * po[i]);
        const vz = t.z * sg, bright = 0.25 + 0.75 * clamp(sp * 1.5);
        c.copy(flat).lerp(vz > 0 ? up : dn, clamp(Math.abs(vz) * 1.4)).multiplyScalar(bright);
        pc.setXYZ(i, c.r, c.g, c.b);
      }
      pa.needsUpdate = true; pc.needsUpdate = true;
      for (const cn of cones) {
        const k = cn.L.at(cn.u), t = cn.L.tan[k].clone().multiplyScalar(sg || 1);
        cn.m.position.copy(cn.L.pts[k]).setY(FY + 0.05);
        cn.m.quaternion.setFromUnitVectors(UP, t);
        const a = clamp(Math.abs(s) * 3) * ramp(el, 0.3, 0.8);
        cn.m.visible = a > 0.02; (cn.m.material as THREE.MeshStandardMaterial).opacity = a;
        const vz = t.z;
        (cn.m.material as THREE.MeshStandardMaterial).color.copy(flat).lerp(vz > 0 ? up : dn, clamp(Math.abs(vz) * 1.4));
        (cn.m.material as THREE.MeshStandardMaterial).emissive.copy((cn.m.material as THREE.MeshStandardMaterial).color);
      }
      // isobaric surfaces: near the ground they dip over the warm side, aloft they bulge up over it
      if (sc !== 'valley') {
        const bend = (x: number) => sc === 'city' ? Math.exp(-(x * x) / 3) - 0.35 : -Math.tanh(x / 1.8);
        iso[0].set(xs, xs.map(x => 1.05 - 0.32 * s * bend(x)));
        iso[1].set(xs, xs.map(x => 2.45 + 0.32 * s * bend(x)));
      }
      // H and L: the warm side is low near the ground and high aloft
      for (const sp2 of spots) {
        if (!sp2.l) continue;
        if (Math.abs(s) < 0.04) { sp2.l(['', '']); continue; }
        const warm = sc === 'city' ? sp2.side < 0 : (s > 0) === (sp2.side < 0);
        const high = warm === sp2.up;
        sp2.l(high ? ['High', '高压'] : ['Low', '低压']);
      }
      if (tl && tr) {
        const A: Pair = sc === 'sea' ? ['Sea', '海洋'] : ['A', 'A 地'], B: Pair = sc === 'sea' ? ['Land', '陆地'] : ['B', 'B 地'];
        tl([`${A[0]} ${num(ta, 1)} °C`, `${A[1]} ${num(ta, 1)} °C`]);
        tr([`${B[0]} ${num(tb, 1)} °C`, `${B[1]} ${num(tb, 1)} °C`]);
      }
      if (rain) { const a = clamp((-s - 0.3) * 2.5); rain.visible = a > 0.02; rain.scale.setScalar(0.4 + 0.6 * a); if (rainLab) rainLab.on = a > 0.5; }
      if (name) {
        const calm = Math.abs(s) < 0.04;
        name(calm ? ['Same temperature: no circulation', '冷热均匀：没有热力环流']
          : sc === 'sea' ? (s < 0 ? ['Sea breeze: from the sea onto the land', '海风：由海洋吹向陆地'] : ['Land breeze: from the land out to sea', '陆风：由陆地吹向海洋'])
          : sc === 'valley' ? (s > 0 ? ['Valley breeze: up the slopes by day', '谷风：白天由谷地吹向山坡'] : ['Mountain breeze: down the slopes at night', '山风：夜晚由山坡吹向谷地'])
          : sc === 'city' ? ['Urban breeze: from the suburbs into the city', '城市风：近地面由郊区吹向城市']
          : s > 0 ? ['A is warmer: air rises over A', 'A 地受热，空气上升'] : ['B is warmer: air rises over B', 'B 地受热，空气上升']);
      }
    },
    readout: clocked && sc === 'sea' ? () => [`sea ${num(ta, 1)} °C · land ${num(tb, 1)} °C`, `海洋 ${num(ta, 1)} °C · 陆地 ${num(tb, 1)} °C`] : undefined,
  };
}

// ——— wind: the horizontal motion of the air ———
/** The wind's path from rest: it starts down the pressure gradient (−y) and turns towards its steady direction. */
function windPath(f: number, k: number): { pts: THREE.Vector3[]; th: number[] } {
  const th0 = -Math.PI / 2, teq = th0 - Math.atan2(f, k), pts: THREE.Vector3[] = [], th: number[] = [];
  let x = 0, y = 0;
  const dt = 0.02;
  for (let t = 0; t <= 8; t += dt) {
    const a = teq + (th0 - teq) * Math.exp(-t / 1.1), v = 1 - Math.exp(-t / 0.5);
    pts.push(P(x, y, 0)); th.push(a);
    x += Math.cos(a) * v * dt; y += Math.sin(a) * v * dt;
  }
  return { pts, th };
}

function windMode(ctx: KitCtx, o: O<'wind'>): KitRun {
  const root = ctx.root;
  lights(root, 0.9);
  const W = 5.2, H = 3.4;
  const grad = canvasTex(4, 256, c => {
    const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#2b4c7e'); g.addColorStop(1, '#5a2d44');
    c.fillStyle = g; c.fillRect(0, 0, 4, 256);
  });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(2 * W, 2 * H), new THREE.MeshStandardMaterial({ map: grad, roughness: 0.9, transparent: true, opacity: 0.92 }));
  panel.position.z = -0.03;
  root.add(panel);
  root.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(2 * W, 2 * H)), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.3 })));
  const isoM = new THREE.MeshBasicMaterial({ color: '#e9ecef', transparent: true, opacity: 0.75 });
  for (let i = 0; i < 5; i++) {
    const y = 2.8 - i * 1.4;
    root.add(box(-W, W, y - 0.018, y + 0.018, -0.01, 0.005, isoM));
    ctx.label(P(-W, y, 0), `${1008 - 2 * i} hPa`, { c: '#ced4da', dx: -36 });
  }
  ctx.label(P(0, H, 0), ['High pressure', '高压'], { c: '#74c0fc', big: true, dy: -14 });
  ctx.label(P(0, -H, 0), ['Low pressure', '低压'], { c: '#ff8787', big: true, dy: 14 });
  const nArrow = new Arrow('#ced4da', 0.03).set([W + 0.55, -0.6, 0], [0, 1.2, 0]);
  root.add(nArrow);
  ctx.label(P(W + 0.55, 0.85, 0), ['N', '北'], { c: '#ced4da' });
  // the parcel, its trail and the forces on it
  const parcel = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), std('#ffffff', { emissive: '#63e6be', rough: 0.3 }));
  (parcel.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
  root.add(parcel);
  const trailM = new THREE.MeshStandardMaterial({ color: '#63e6be', emissive: '#20c997', emissiveIntensity: 0.6, transparent: true, opacity: 0.9 });
  const trail = new THREE.Mesh(new THREE.BufferGeometry(), trailM);
  root.add(trail);
  const aP = new Arrow('#ffd43b', 0.045), aC = new Arrow('#b197fc', 0.045), aF = new Arrow('#adb5bd', 0.045), aV = new Arrow('#63e6be', 0.045);
  root.add(aP, aC, aF, aV);
  const lP = ctx.label(P(0, 0, 0), ['Pressure-gradient force', '水平气压梯度力'], { c: '#ffe066' });
  const lC = ctx.label(P(0, 0, 0), ['Coriolis effect', '地转偏向力'], { c: '#d0bfff' });
  const lF = ctx.label(P(0, 0, 0), ['Friction', '摩擦力'], { c: '#ced4da' });
  const lV = ctx.label(P(0, 0, 0), ['Wind', '风向'], { c: '#96f2d7' });
  const info = live(ctx.label(P(0, H + 0.9, 0), '', { c: '#ffe066', big: true }));
  ctx.view([0, -0.9, 1], 13.5, [0.4, -0.2, 0], true);

  let key = '', path: THREE.Vector3[] = [], th: number[] = [], f = 0, k = 0;
  const build = () => {
    const w = windPath(f, k);
    const b = new THREE.Box3().setFromPoints(w.pts), sz = b.getSize(new THREE.Vector3());
    const sc = Math.min((2 * W - 2.2) / Math.max(sz.x, 0.01), (2 * H - 1.2) / Math.max(sz.y, 0.01));
    const ctr = b.getCenter(new THREE.Vector3());
    path = w.pts.map(p => p.clone().sub(ctr).multiplyScalar(sc).setZ(0.12));
    th = w.th;
    trail.geometry.dispose();
    trail.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path.filter((_, i) => i % 4 === 0)), 300, 0.05, 8);
  };
  return {
    update(_v, _dt, el) {
      const lat = clamp(param(ctx, 'lat', o.lat ?? 30), -90, 90), fr = clamp(param(ctx, 'fric', o.fric ?? 0.6), 0, 1.5);
      const kk = `${lat.toFixed(1)}|${fr.toFixed(3)}`;
      if (kk !== key) { key = kk; f = Math.sin(lat * D2R); k = fr; build(); }
      const T = 7, u = clamp(((el % (T + 1.2)) / T)), i = Math.min(path.length - 1, Math.floor(u * (path.length - 1)));
      const n = trail.geometry.index?.count ?? 0;
      trail.geometry.setDrawRange(0, Math.floor((n * u) / 6) * 6);
      const p = path[i], a = th[i], hy = Math.hypot(f, k), sp = 1 - Math.exp(-((u * 8) / 0.5));
      parcel.position.copy(p);
      const dir = P(Math.cos(a), Math.sin(a), 0), right = P(dir.y, -dir.x, 0), L = 1.25;
      const at = p.clone().setZ(0.2);
      aP.set(at, [0, -L, 0]);
      aV.set(at, dir.clone().multiplyScalar(L * 0.95));
      const cm = hy > 1e-3 ? (L * Math.abs(f) * sp) / hy : 0, fm = hy > 1e-3 ? (L * k * sp) / hy : 0;
      aC.set(at, right.clone().multiplyScalar(Math.sign(f) * cm)); aC.visible = cm > 0.05;
      aF.set(at, dir.clone().multiplyScalar(-fm)); aF.visible = fm > 0.05;
      const tip = (v: THREE.Vector3) => at.clone().add(v.clone().multiplyScalar(1.12));
      lP.pos.copy(tip(P(0, -L, 0))); lV.pos.copy(tip(dir.clone().multiplyScalar(L * 0.95)));
      // wind along the gradient (equator): move the force label aside so the two do not overlap
      if (dir.y < -0.8) lP.pos.x -= 1.9;
      lC.pos.copy(tip(right.clone().multiplyScalar(Math.sign(f) * cm))); lC.on = cm > 0.05;
      lF.pos.copy(tip(dir.clone().multiplyScalar(-fm))); lF.on = fm > 0.05;
      const ang = 90 - Math.atan2(Math.abs(f), k) / D2R, lt = latTxt(lat);
      const side: Pair = Math.abs(lat) < 0.5 ? ['no deflection', '不偏转'] : lat > 0 ? ['turns right', '向右偏'] : ['turns left', '向左偏'];
      info([`${lt[0]} · ${side[0]} · ${num(ang)}° to the isobars`, `${lt[1]} · ${side[1]} · 风向与等压线夹角 ${num(ang)}°`]);
    },
  };
}

const kit: KitFactory<Opts> = (ctx, o) => {
  switch (o.mode) {
    case 'layers': return layersMode(ctx, o);
    case 'heating': return heatingMode(ctx, o);
    case 'thermal': return thermalMode(ctx, o);
    default: return windMode(ctx, o);
  }
};
export default kit;
