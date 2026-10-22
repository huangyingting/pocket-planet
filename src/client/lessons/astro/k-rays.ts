/**
 * Kit "rays": sunlight geometry on the Earth. A cross-section with parallel sunrays and the noon Sun's altitude
 * H = 90° − |φ − δ|; two buildings and the winter-solstice shadow that sets their spacing L = h / tan H; and the Earth
 * lit by the Sun with its terminator, where a latitude circle splits into a day arc and a night arc
 * (cos H₀ = −tan φ · tan δ).
 */
import * as THREE from 'three';
import { Arrow, D2R, body, circlePts, clamp, dirLight, glow, line, ramp, setLine, starfield } from './draw.ts';
import { subsolar } from '../../../shared/lib/sun.ts';
import type { KitFactory, Label, Pair } from './types.ts';

export type Opts =
  /**
   * Noon sun altitude on a cross-section of the Earth. The clock sets one input: `date` → the Sun's declination δ
   * for that day, `deg` → δ directly (−23.44 … 23.44), `lat` → the observer's latitude φ. Otherwise `lat` / `dec`.
   */
  | { mode: 'noon'; lat?: number; dec?: number; /** the observer's place */ name?: Pair }
  /** Two buildings at noon on the winter solstice (or `dec`); the clock (`lat`) or `lat` sets the latitude. */
  | { mode: 'spacing'; lat?: number; dec?: number; /** a solar water heater facing the noon Sun */ heater?: boolean }
  /** The lit Earth with its terminator; `date` clock (or `dec`); latitude circles split into day and night arcs. */
  | { mode: 'daylen'; lats?: { lat: number; name: Pair }[]; dec?: number };

const OBLIQ = 23.44;
const fmt = (v: number, dp = 1) => (Math.round(v * 10 ** dp) / 10 ** dp).toFixed(dp);
const latTxt = (v: number, zh: boolean, dp = 1) => Math.abs(v) < 0.05 ? (zh ? '0°' : '0°') : zh ? `${v > 0 ? '北纬' : '南纬'} ${fmt(Math.abs(v), dp)}°` : `${fmt(Math.abs(v), dp)}°${v > 0 ? 'N' : 'S'}`;
const latPair = (v: number, dp = 1): Pair => [latTxt(v, false, dp), latTxt(v, true, dp)];
/** Day length in hours at latitude φ when the Sun's declination is δ (geometric, no refraction). */
export function dayHours(lat: number, dec: number): number {
  const c = -Math.tan(lat * D2R) * Math.tan(dec * D2R);
  return c >= 1 ? 0 : c <= -1 ? 24 : (2 * Math.acos(c)) / D2R / 15;
}
/** Overlay lines drawn on top of the globe. */
const over = <T extends THREE.Object3D>(o: T, order = 5): T => {
  o.traverse(x => { const m = (x as THREE.Mesh).material as THREE.Material | undefined; if (m) m.depthTest = false; x.renderOrder = order; });
  return o;
};
/** A label whose text is rewritten only when it changes. */
function live(l: Label): (t: Pair) => void {
  let last = '';
  return t => { const k = t[0] + t[1]; if (k !== last) { last = k; l.set(t); } };
}

type Ctx = Parameters<KitFactory<Opts>>[0];
type Run = ReturnType<KitFactory<Opts>>;
type O<M> = Extract<Opts, { mode: M }> & { clock?: { unit: string } };

/** A thin flat arc (angle marks) in the xz plane around `c`, from direction angle a0 to a1 (rad, from +x toward +z). */
function arcPts(c: THREE.Vector3, r: number, a0: number, a1: number, n = 32): THREE.Vector3[] {
  return Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return new THREE.Vector3(c.x + r * Math.cos(a), c.y, c.z + r * Math.sin(a)); });
}
/** A translucent angle wedge (filled) in the xz plane. */
function wedge(color: string, opacity = 0.28): THREE.Mesh {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(34 * 3), 3));
  g.setIndex(Array.from({ length: 32 }, (_, i) => [0, i + 1, i + 2]).flat());
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }));
}
function setWedge(m: THREE.Mesh, c: THREE.Vector3, r: number, a0: number, a1: number): void {
  const a = m.geometry.getAttribute('position') as THREE.BufferAttribute;
  a.setXYZ(0, c.x, c.y, c.z);
  arcPts(c, r, a0, a1).forEach((p, i) => a.setXYZ(i + 1, p.x, p.y, p.z));
  a.needsUpdate = true;
  m.geometry.computeBoundingSphere();
}

// ——— noon: the noon Sun's altitude on a cross-section ———
function noonMode(ctx: Ctx, o: O<'noon'>): Run {
  const R = 3, unit = o.clock?.unit;
  ctx.root.add(starfield(ctx.low ? 1200 : 2500));
  const light = dirLight([-1, 0, 0], 2.6, 0.16);
  ctx.root.add(light);
  const sunL = light.children[0] as THREE.DirectionalLight;
  const earth = body('earth', R, '#3b6ea5', 1024);
  const spin = new THREE.Group();
  spin.add(earth);
  // turn China (≈ 110°E) toward the camera (−y)
  spin.rotation.z = (-90 - 110) * D2R;
  ctx.root.add(spin);
  // latitude chords: equator, tropics, polar circles (seen edge-on they read as straight lines across the disc)
  const par = (lat: number, c: string, dashed: boolean, lab?: Pair) => {
    const z = R * Math.sin(lat * D2R), x = R * Math.cos(lat * D2R);
    const l = over(line([[-x, -R * 0.02, z], [x, -R * 0.02, z]], c, { opacity: 0.75, dashed, dash: 0.18 }), 3);
    ctx.root.add(l);
    if (lab) ctx.label(new THREE.Vector3(x, 0, z), lab, { c, dx: 34 });
  };
  par(0, '#ffe066', false, ['Equator 0°', '赤道 0°']);
  par(OBLIQ, '#ff922b', true, ['Tropic of Cancer 23.44°N', '北回归线 23°26′N']);
  par(-OBLIQ, '#ff922b', true, ['Tropic of Capricorn 23.44°S', '南回归线 23°26′S']);
  par(90 - OBLIQ, '#74c0fc', true, ['Arctic Circle', '北极圈']);
  par(OBLIQ - 90, '#74c0fc', true);
  const axis = over(line([[0, -R * 0.02, -R * 1.25], [0, -R * 0.02, R * 1.25]], '#dee2e6', { opacity: 0.6, dashed: true, dash: 0.15 }), 3);
  ctx.root.add(axis);
  ctx.label(new THREE.Vector3(0, 0, R * 1.3), ['N', '北极'], { c: '#dee2e6' });
  ctx.label(new THREE.Vector3(0, 0, -R * 1.3), ['S', '南极'], { c: '#dee2e6' });

  // parallel sunrays from the left
  const NR = 11, FAR = 13;
  const rays = Array.from({ length: NR }, () => { const l = over(line([[0, 0, 0], [1, 0, 0]], '#ffd43b', { opacity: 0.55 }), 2); ctx.root.add(l); return l; });
  const sunRay = over(line([[0, 0, 0], [1, 0, 0]], '#fff3bf', { opacity: 1 }), 6);
  const subRay = over(line([[0, 0, 0], [1, 0, 0]], '#ff6b6b', { opacity: 0.95 }), 6);
  ctx.root.add(sunRay, subRay);
  const sunGlow = glow('#ffd43b', 5, 0.9);
  ctx.root.add(sunGlow);
  const subDot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 8), new THREE.MeshBasicMaterial({ color: '#ff6b6b' }));
  ctx.root.add(over(subDot, 7));
  ctx.pickable(subDot, 'subsolar');
  const subLab = ctx.label(subDot, ['Subsolar point (Sun overhead)', '太阳直射点'], { c: '#ff8787', dx: -70, dy: -18, t: 0.4 });

  // the observer: a pin, a local horizon and the zenith
  const obs = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 8), new THREE.MeshBasicMaterial({ color: '#69db7c' }));
  ctx.root.add(over(obs, 7));
  const horizon = over(line([[0, 0, 0], [1, 0, 0]], '#69db7c', { opacity: 0.95 }), 6);
  const zenith = over(line([[0, 0, 0], [1, 0, 0]], '#adb5bd', { opacity: 0.7, dashed: true, dash: 0.12 }), 6);
  const angArc = over(line(arcPts(new THREE.Vector3(), 1, 0, 1), '#ffffff', { opacity: 0.95 }), 8);
  const angFill = over(wedge('#ffe066', 0.35), 7);
  ctx.root.add(horizon, zenith, angArc, angFill);
  const hAt = new THREE.Object3D();
  ctx.root.add(hAt);
  const hLab = live(ctx.label(hAt, '', { c: '#fff3bf', big: true }));
  const obsLab = live(ctx.label(obs, '', { c: '#69db7c', dx: -64, dy: 14 }));
  const name = o.name;
  ctx.label(new THREE.Vector3(-FAR + 1.2, 0, R * 1.05), ['Sunlight (parallel rays)', '太阳光线（平行光）'], { c: '#ffd43b' });

  ctx.view([0, -1, 0], 15.5, [-2.2, 0, 0], true);
  let H = 0, lat = o.lat ?? 40, dec = o.dec ?? 0;
  return {
    update(v, _dt, el) {
      lat = unit === 'lat' ? v : o.lat ?? 40;
      dec = unit === 'date' ? subsolar(v)[0] : unit === 'deg' ? v : o.dec ?? 0;
      const d = new THREE.Vector3(Math.cos(dec * D2R), 0, -Math.sin(dec * D2R)); // the rays' direction of travel
      const perp = new THREE.Vector3(Math.sin(dec * D2R), 0, Math.cos(dec * D2R));
      sunL.position.copy(d).multiplyScalar(-10);
      const grow = ramp(el, 0.1, 1.2);
      rays.forEach((l, i) => {
        const b = (i / (NR - 1) - 0.5) * 2 * R * 1.25;
        const start = d.clone().multiplyScalar(-FAR).addScaledVector(perp, b);
        const end = Math.abs(b) < R ? d.clone().multiplyScalar(-Math.sqrt(R * R - b * b)).addScaledVector(perp, b) : d.clone().multiplyScalar(R * 1.6).addScaledVector(perp, b);
        setLine(l, [start, start.clone().lerp(end, grow)]);
      });
      sunGlow.position.copy(d).multiplyScalar(-FAR - 1).addScaledVector(perp, 0);
      // subsolar point
      const ss = new THREE.Vector3(-Math.cos(dec * D2R), 0, Math.sin(dec * D2R)).multiplyScalar(R);
      subDot.position.copy(ss).setY(-R * 0.05);
      setLine(subRay, [ss.clone().addScaledVector(d, -FAR * 0.55 * grow - 0.001), ss]);
      subLab.on = el > 0.4;
      // observer
      const n = new THREE.Vector3(-Math.cos(lat * D2R), 0, Math.sin(lat * D2R));
      const t = new THREE.Vector3(Math.sin(lat * D2R), 0, Math.cos(lat * D2R)); // along the surface, toward the north
      const P = n.clone().multiplyScalar(R).setY(-R * 0.05);
      obs.position.copy(P);
      H = 90 - Math.abs(lat - dec);
      const s = d.clone().negate(); // toward the Sun
      const north = dec > lat; // the noon Sun stands to the north of the observer
      const hd = north ? t : t.clone().negate();
      const HL = 2.1;
      setLine(horizon, [P.clone().addScaledVector(t, -HL), P.clone().addScaledVector(t, HL)]);
      setLine(zenith, [P, P.clone().addScaledVector(n, 1.8)]);
      setLine(sunRay, [P.clone().addScaledVector(s, 9 * grow + 0.001), P]);
      const a0 = Math.atan2(hd.z, hd.x), a1raw = Math.atan2(s.z, s.x);
      let a1 = a1raw;
      while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI;
      while (a0 - a1 > Math.PI) a1 += 2 * Math.PI;
      const show = ramp(el, 0.9, 0.8);
      const r = 1.05;
      setLine(angArc, arcPts(P, r, a0, a0 + (a1 - a0) * show));
      setWedge(angFill, P, r, a0, a0 + (a1 - a0) * show);
      const am = (a0 + a1) / 2;
      hAt.position.set(P.x + (r + 0.55) * Math.cos(am), P.y, P.z + (r + 0.55) * Math.sin(am));
      angArc.visible = angFill.visible = H > 0;
      hLab(H > 0 ? [`H = ${fmt(H)}°`, `H = ${fmt(H)}°`] : ['Sun below horizon', '太阳在地平线下']);
      obsLab(name ? [`${name[0]} ${latTxt(lat, false)}`, `${name[1]} ${latTxt(lat, true)}`] : latPair(lat));
    },
    readout() {
      const f = `90° − |${fmt(lat)}° − (${fmt(dec)}°)|`;
      return H > 0
        ? [`H = ${f} = ${fmt(H)}° · subsolar ${latTxt(dec, false)}`, `H = ${f} = ${fmt(H)}° · 直射点 ${latTxt(dec, true)}`]
        : ['Sun below the horizon at noon (polar night)', '正午太阳在地平线以下（极夜）'];
    },
  };
}

const CITIES: { lat: number; name: Pair }[] = [
  { lat: 18.3, name: ['Sanya', '三亚'] },
  { lat: 23.1, name: ['Guangzhou', '广州'] },
  { lat: 31.2, name: ['Shanghai', '上海'] },
  { lat: 39.9, name: ['Beijing', '北京'] },
  { lat: 45.8, name: ['Harbin', '哈尔滨'] },
];
const cityAt = (lat: number) => CITIES.find(c => Math.abs(c.lat - lat) < 0.8);

function building(w: number, h: number, dpt: number, color: string): THREE.Group {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, dpt, h), new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
  box.position.set(w / 2, 0, h / 2);
  g.add(box);
  // window rows
  const win = new THREE.MeshBasicMaterial({ color: '#ffe8a3', transparent: true, opacity: 0.55 });
  const floors = 6;
  for (let f = 0; f < floors; f++) for (let k = 0; k < 4; k++) {
    const q = new THREE.Mesh(new THREE.PlaneGeometry(dpt * 0.13, (h / floors) * 0.42), win);
    q.rotation.set(Math.PI / 2, -Math.PI / 2, 0);
    q.position.set(-0.01, -dpt * 0.36 + (k * dpt * 0.72) / 3, (f + 0.5) * (h / floors));
    g.add(q);
  }
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color: '#495057' }));
  edge.position.copy(box.position);
  g.add(edge);
  return g;
}

// ——— spacing: winter-solstice noon shadows set the gap between buildings ———
function spacingMode(ctx: Ctx, o: O<'spacing'>): Run {
  const h = 4, w = 2.2, dpt = 5, M = 5; // 4 units = 20 m
  const unit = o.clock?.unit;
  const dec = o.dec ?? -OBLIQ;
  ctx.root.add(new THREE.HemisphereLight('#dbe4ff', '#495057', 0.9));
  const light = dirLight([-1, 0, 1], 2.0, 0.25);
  ctx.root.add(light);
  const sunL = light.children[0] as THREE.DirectionalLight;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(80, 32, 16), new THREE.MeshBasicMaterial({ color: '#1b2a41', side: THREE.BackSide }));
  ctx.root.add(sky);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshStandardMaterial({ color: '#5c6b4f', roughness: 1 }));
  ground.position.set(8, 0, 0);
  ctx.root.add(ground);
  const front = building(w, h, dpt, '#ced4da'), back = building(w, h, dpt, '#a5d8ff');
  front.position.x = -w;
  ctx.root.add(front, back);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, dpt), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.5, depthWrite: false }));
  shadow.position.z = 0.01;
  ctx.root.add(shadow);
  // the ray grazing the front roof, the angle at the shadow's tip, dimensions
  const ray = over(line([[0, 0, 0], [1, 0, 0]], '#ffd43b'), 6);
  const rays = Array.from({ length: 5 }, () => over(line([[0, 0, 0], [1, 0, 0]], '#ffd43b', { opacity: 0.35 }), 5));
  const arc = over(line(arcPts(new THREE.Vector3(), 1, 0, 1), '#ffffff'), 8);
  const fill = over(wedge('#ffe066', 0.35), 7);
  const dimL = new Arrow('#ff8787', 0.035), dimL2 = new Arrow('#ff8787', 0.035), dimH = new Arrow('#74c0fc', 0.035), dimH2 = new Arrow('#74c0fc', 0.035);
  for (const a of [dimL, dimL2, dimH, dimH2]) over(a, 9);
  ctx.root.add(ray, ...rays, arc, fill, dimL, dimL2, dimH, dimH2);
  const sunGlow = glow('#ffd43b', 4, 0.95);
  ctx.root.add(sunGlow);
  const yF = -dpt / 2 - 0.05;
  dimH.set([-w - 0.5, yF, h / 2], [0, 0, h / 2]); dimH2.set([-w - 0.5, yF, h / 2], [0, 0, -h / 2]);
  ctx.label(new THREE.Vector3(-w - 0.5, yF, h / 2), ['h = 20 m', 'h = 20 米'], { c: '#74c0fc', dx: -40 });
  ctx.label(new THREE.Vector3(-w / 2, 0, h + 0.4), ['Front (south) building', '前楼（南）'], { c: '#dee2e6' });
  const backLab = ctx.label(back, ['Back (north) building', '后楼（北）'], { c: '#a5d8ff', dy: -70 });
  const lAt = new THREE.Object3D(), hAt = new THREE.Object3D();
  ctx.root.add(lAt, hAt);
  const lLab = live(ctx.label(lAt, '', { c: '#ff8787' }));
  const hLab = live(ctx.label(hAt, '', { c: '#fff3bf', big: true }));
  ctx.label(new THREE.Vector3(-M - 1.5, 0, 0.2), ['S 南', 'S 南'], { c: '#adb5bd' });
  const nLab = ctx.label(new THREE.Vector3(14, 0, 0.2), ['N 北', 'N 北'], { c: '#adb5bd' });
  ctx.label(new THREE.Vector3(1.5, 0, 0.1), ['Shadow at noon', '正午影子'], { c: '#ced4da', dy: 26, t: 0.6 });
  let heater: THREE.Group | null = null, heaterLab: ((t: Pair) => void) | null = null;
  if (o.heater) {
    heater = new THREE.Group();
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, dpt * 0.6, 0.06), new THREE.MeshStandardMaterial({ color: '#1c3d6e', metalness: 0.3, roughness: 0.4, emissive: '#0b1e3a' }));
    panel.position.x = 0.7;
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, dpt * 0.6, 16), new THREE.MeshStandardMaterial({ color: '#dee2e6' }));
    tank.position.x = 1.45;
    heater.add(panel, tank);
    ctx.root.add(heater);
    heaterLab = live(ctx.label(panel, '', { c: '#74c0fc', dy: -34, dx: 20 }));
  }
  ctx.view([0.05, -1, 0.22], 20, [5.2, 0, 2.6], true);
  let lat = 40, H = 30, L = 0;
  return {
    update(v, _dt, el) {
      lat = unit === 'lat' ? v : o.lat ?? 40;
      H = 90 - Math.abs(lat - dec);
      const t = Math.tan(clamp(H, 3, 89) * D2R);
      L = h / t;
      const s = new THREE.Vector3(-Math.cos(H * D2R), 0, Math.sin(H * D2R)); // toward the Sun (south)
      sunL.position.copy(s).multiplyScalar(10);
      back.position.x = L;
      backLab.pos.set(L + w / 2, 0, h);
      nLab.pos.set(Math.max(L + w + 2.5, 12), 0, 0.2);
      shadow.scale.x = Math.max(L, 0.001); shadow.position.x = L / 2;
      const grow = ramp(el, 0.1, 1);
      const tip = new THREE.Vector3(L, yF, 0), top = new THREE.Vector3(0, yF, h);
      const src = top.clone().addScaledVector(s, 9);
      setLine(ray, [src, src.clone().lerp(tip, grow)]);
      rays.forEach((l, i) => { const off = (i - 1.5) * 1.6; const a = src.clone().add(new THREE.Vector3(off * Math.sin(H * D2R), 0, off * Math.cos(H * D2R))), b = a.clone().addScaledVector(s, -6 * grow); setLine(l, [a, b]); });
      sunGlow.position.copy(top).addScaledVector(s, 11).setY(0);
      const show = ramp(el, 0.8, 0.8), r = Math.min(1.4, L * 0.5 + 0.5);
      setLine(arc, arcPts(tip, r, Math.PI, Math.PI - H * D2R * show));
      setWedge(fill, tip, r, Math.PI, Math.PI - H * D2R * show);
      hAt.position.set(tip.x - (r + 0.6) * Math.cos(H * D2R / 2), yF, (r + 0.6) * Math.sin(H * D2R / 2));
      hLab([`H = ${fmt(H)}°`, `H = ${fmt(H)}°`]);
      dimL.set([L / 2, yF, 0.15], [L / 2, 0, 0]); dimL2.set([L / 2, yF, 0.15], [-L / 2, 0, 0]);
      lAt.position.set(L / 2, yF, 0.15);
      lLab([`L = h / tan H ≈ ${Math.round(L * 5)} m`, `L = h / tan H ≈ ${Math.round(L * 5)} 米`]);
      if (heater && heaterLab) {
        const tilt = 90 - H; // panel faces the Sun: its tilt from the horizontal is 90° − H
        heater.position.set(L + 0.4, 0, h + 0.05);
        heater.rotation.y = -tilt * D2R;
        heaterLab([`Heater tilt 90° − H = ${fmt(tilt)}°`, `热水器倾角 90° − H = ${fmt(tilt)}°`]);
      }
    },
    readout() {
      const c = cityAt(lat);
      const where: Pair = c ? [`${c.name[0]} (${latTxt(lat, false)})`, `${c.name[1]}（${latTxt(lat, true)}）`] : latPair(lat);
      return [`${where[0]} · noon H = ${fmt(H)}° · gap ≥ ${fmt(L / h, 2)} × h`, `${where[1]} · 正午 H = ${fmt(H)}° · 楼间距 ≥ ${fmt(L / h, 2)} × 楼高`];
    },
  };
}

// ——— daylen: the terminator, and how much of each latitude circle is in daylight ———
const SHELL_V = /* glsl */ `
varying vec3 vLoc; varying vec3 vWn;
void main() { vLoc = normalize(position); vWn = normalize(mat3(modelMatrix) * position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SHELL_F = /* glsl */ `
uniform vec3 uSun; uniform float uDec; uniform float uCaps;
varying vec3 vLoc; varying vec3 vWn;
void main() {
  float lit = dot(normalize(vWn), uSun);
  float night = smoothstep(0.015, -0.015, lit) * 0.5;
  float lat = degrees(asin(clamp(vLoc.z, -1.0, 1.0)));
  float lim = 90.0 - abs(uDec);
  float north = step(lim, lat), south = step(lat, -lim);
  float pday = uDec > 0.0 ? north : south, pnight = uDec > 0.0 ? south : north;
  pday *= step(0.3, abs(uDec)) * uCaps; pnight *= step(0.3, abs(uDec)) * uCaps;
  vec3 c = vec3(0.01, 0.02, 0.08);
  float a = night;
  c = mix(c, vec3(1.0, 0.78, 0.25), pday); a = mix(a, 0.42, pday);
  c = mix(c, vec3(0.15, 0.3, 0.85), pnight); a = mix(a, 0.62, pnight);
  gl_FragColor = vec4(c, a);
}`;
const DEF_LATS: { lat: number; name: Pair }[] = [
  { lat: 45.8, name: ['Harbin', '哈尔滨'] },
  { lat: 39.9, name: ['Beijing', '北京'] },
  { lat: 23.1, name: ['Guangzhou', '广州'] },
];
const hm = (h: number, zh: boolean) => { const m = Math.round(h * 60); const H = Math.floor(m / 60), M = m % 60; return zh ? `${H} 小时 ${M} 分` : `${H} h ${String(M).padStart(2, '0')} min`; };

function daylenMode(ctx: Ctx, o: O<'daylen'>): Run {
  const R = 3, NA = 96, unit = o.clock?.unit;
  const lats = o.lats ?? DEF_LATS;
  ctx.root.add(starfield(ctx.low ? 1200 : 2500));
  ctx.root.add(dirLight([-1, 0, 0], 2.6, 0.2));
  const sunGlow = glow('#ffd43b', 9, 0.9);
  sunGlow.position.set(-30, 0, 0);
  ctx.root.add(sunGlow);
  for (let i = 0; i < 7; i++) { const z = (i - 3) * 1.15; const l = line([[-24, 0, z], [-R * 1.6, 0, z]], '#ffd43b', { opacity: 0.35 }); ctx.root.add(l); }
  ctx.label(new THREE.Vector3(-9, 0, R * 1.3), ['Sunlight', '太阳光'], { c: '#ffd43b' });
  const tilt = new THREE.Group(), spin = new THREE.Group();
  ctx.root.add(tilt);
  tilt.add(spin);
  spin.add(body('earth', R, '#3b6ea5', 1024));
  const shellU = { uSun: { value: new THREE.Vector3(-1, 0, 0) }, uDec: { value: 0 }, uCaps: { value: 1 } };
  const shell = new THREE.Mesh(new THREE.SphereGeometry(R * 1.004, 96, 48), new THREE.ShaderMaterial({ uniforms: shellU, vertexShader: SHELL_V, fragmentShader: SHELL_F, transparent: true, depthWrite: false }));
  tilt.add(shell);
  // the axis
  const axis = line([[0, 0, -R * 1.35], [0, 0, R * 1.35]], '#dee2e6', { opacity: 0.8 });
  tilt.add(axis);
  const np = new THREE.Object3D(); np.position.set(0, 0, R * 1.42); tilt.add(np);
  ctx.label(np, ['N', '北极'], { c: '#dee2e6' });
  // tropics, polar circles, equator (faint)
  const circ = (lat: number, c: string, op: number, dashed = true) => {
    const r = R * Math.cos(lat * D2R) * 1.006, z = R * Math.sin(lat * D2R) * 1.006;
    const l = line(circlePts(r, 128, [0, 0, z]), c, { opacity: op, dashed, dash: 0.15 });
    tilt.add(l);
    return l;
  };
  circ(0, '#ffe066', 0.45, false);
  circ(90 - OBLIQ, '#74c0fc', 0.7); circ(OBLIQ - 90, '#74c0fc', 0.7);
  circ(OBLIQ, '#ff922b', 0.4); circ(-OBLIQ, '#ff922b', 0.4);
  const acAt = new THREE.Object3D(); acAt.position.set(R * Math.cos((90 - OBLIQ) * D2R) * 1.02, 0, R * Math.sin((90 - OBLIQ) * D2R)); tilt.add(acAt);
  ctx.label(acAt, ['Arctic Circle', '北极圈'], { c: '#74c0fc', dx: 46, t: 0.8 });
  // the terminator: a great circle across the Sun's line, fixed in space
  const term = line(Array.from({ length: 129 }, (_, i) => { const a = (i / 128) * Math.PI * 2; return new THREE.Vector3(0, R * 1.012 * Math.cos(a), R * 1.012 * Math.sin(a)); }), '#fff3bf', { opacity: 0.95 });
  const termB = over(line(Array.from({ length: 129 }, (_, i) => { const a = (i / 128) * Math.PI * 2; return new THREE.Vector3(0, R * 1.012 * Math.cos(a), R * 1.012 * Math.sin(a)); }), '#fff3bf', { opacity: 0.22, dashed: true, dash: 0.12 }), 2);
  ctx.root.add(term, termB);
  const tAt = new THREE.Object3D(); tAt.position.set(0, -R * 0.72, -R * 0.72); ctx.root.add(tAt);
  ctx.label(tAt, ['Terminator (day/night line)', '晨昏线'], { c: '#fff3bf', dx: 48, dy: 20, t: 0.4 });
  ctx.label(new THREE.Vector3(-R * 0.9, -R * 0.2, -R * 0.5), ['Day', '昼半球'], { c: '#ffe066', t: 0.6 });
  ctx.label(new THREE.Vector3(R * 0.9, -R * 0.2, -R * 0.5), ['Night', '夜半球'], { c: '#91a7ff', t: 0.6 });
  // polar day / night markers (pickable)
  const capN = new THREE.Mesh(new THREE.SphereGeometry(R * 1.02, 32, 6, 0, Math.PI * 2, 0, OBLIQ * D2R), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  capN.rotation.x = Math.PI / 2;
  const capS = new THREE.Mesh(capN.geometry.clone(), capN.material.clone());
  tilt.add(capN, capS);
  ctx.pickable(capN, 'polarday');
  ctx.pickable(capS, 'polarnight');
  const pnAt = new THREE.Object3D(); pnAt.position.set(-R * 0.25, 0, R * 1.02); tilt.add(pnAt);
  const psAt = new THREE.Object3D(); psAt.position.set(-R * 0.25, 0, -R * 1.02); tilt.add(psAt);
  const pnLab = ctx.label(pnAt, '', { c: '#ffd43b', dx: -60, dy: -10 });
  const psLab = ctx.label(psAt, '', { c: '#91a7ff', dx: -60, dy: 10 });
  // the highlighted latitude circles: a gold day arc and a blue night arc
  const arcs = lats.map(q => {
    const day = line(Array.from({ length: NA + 1 }, () => new THREE.Vector3()), '#ffd43b');
    const night = line(Array.from({ length: NA + 1 }, () => new THREE.Vector3()), '#4dabf7');
    const dayB = over(line(Array.from({ length: NA + 1 }, () => new THREE.Vector3()), '#ffd43b', { opacity: 0.3 }), 1);
    const nightB = over(line(Array.from({ length: NA + 1 }, () => new THREE.Vector3()), '#4dabf7', { opacity: 0.3 }), 1);
    tilt.add(day, night, dayB, nightB);
    const at = new THREE.Object3D(); at.position.set(-R * Math.cos(q.lat * D2R) * 1.01, 0, R * Math.sin(q.lat * D2R)); tilt.add(at);
    const lab = live(ctx.label(at, '', { c: '#ffe8a3', dx: -86 }));
    return { q, day, night, dayB, nightB, lab };
  });
  ctx.view([-0.25, -1, 0.32], 13.5, [0, 0, 0], true);
  let dec = 0;
  const pts = (r: number, z: number, a0: number, a1: number) => Array.from({ length: NA + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / NA; return new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), z); });
  return {
    update(v, dt, el) {
      dec = unit === 'date' ? subsolar(v)[0] : unit === 'deg' ? v : o.dec ?? 0;
      tilt.rotation.y = -dec * D2R;
      spin.rotation.z += dt * 0.12;
      shellU.uDec.value = dec;
      shellU.uCaps.value = ramp(el, 0.5, 0.8);
      const f = ramp(el, 0.3, 1);
      for (const A of arcs) {
        const phi = A.q.lat, h = dayHours(phi, dec), H0 = (h / 24) * Math.PI; // half the day arc (rad)
        const r = R * Math.cos(phi * D2R) * 1.012, z = R * Math.sin(phi * D2R) * 1.012;
        // noon faces the Sun (−x of the tilted frame): the day arc is centred on angle π
        const dP = pts(r, z, Math.PI - H0 * f, Math.PI + H0 * f), nP = pts(r, z, Math.PI + H0, Math.PI + H0 + (2 * Math.PI - 2 * H0) * f);
        setLine(A.day, dP); setLine(A.dayB, dP); setLine(A.night, nP); setLine(A.nightB, nP);
        A.day.visible = A.dayB.visible = h > 0.01; A.night.visible = A.nightB.visible = h < 23.99;
        A.lab([`${A.q.name[0]} ${hm(h, false)}`, `${A.q.name[1]} 昼长 ${hm(h, true)}`]);
      }
      const big = Math.abs(dec) > 0.3, pd = dec > 0;
      // the 'polarday' cap sits on whichever pole is in polar day
      capN.rotation.x = pd ? Math.PI / 2 : -Math.PI / 2;
      capS.rotation.x = -capN.rotation.x;
      capN.visible = capS.visible = big;
      pnLab.on = psLab.on = big && el > 0.8;
      pnLab.set(pd ? ['Polar day', '极昼'] : ['Polar night', '极夜']);
      psLab.set(pd ? ['Polar night', '极夜'] : ['Polar day', '极昼']);
      pnLab.el.style.color = pd ? '#ffd43b' : '#91a7ff';
      psLab.el.style.color = pd ? '#91a7ff' : '#ffd43b';
    },
    readout() {
      const ss = latTxt(dec, false), sz = latTxt(dec, true);
      if (Math.abs(dec) < 0.3) return [`Sun overhead at the Equator · day = night = 12 h everywhere`, `直射点在赤道 · 全球昼夜等长（12 小时）`];
      return [`Sun overhead at ${ss} · Equator 12 h · north of ${fmt(90 - Math.abs(dec))}°${dec >= 0 ? 'N' : 'S'}: polar day`, `直射点 ${sz} · 赤道昼长 12 小时 · ${dec >= 0 ? '北' : '南'}纬 ${fmt(90 - Math.abs(dec))}° 以${dec >= 0 ? '北' : '南'}极昼`];
    },
  };
}

const kit: KitFactory<Opts & { clock?: { unit: string } }> = (ctx, o) => {
  switch (o.mode) {
    case 'spacing': return spacingMode(ctx, o);
    case 'daylen': return daylenMode(ctx, o);
    default: return noonMode(ctx, o);
  }
};
export default kit;
