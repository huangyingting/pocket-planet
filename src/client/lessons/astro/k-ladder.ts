/**
 * Kit "ladder": sizes and distances in space.
 * - `cosmic` (default): a smooth logarithmic zoom-out through the hierarchy of celestial systems — Earth, the
 *   Earth–Moon system, the Solar System, the nearby stars, the Milky Way, the Local Group and the observable
 *   universe — with a live scale bar. The clock value is the stop index (0 … 6, fractional in between).
 * - `light`: a pulse of light leaving the Sun at true scale; the clock is minutes since it left, and the view widens
 *   as it travels. Planets light up as it passes them (Earth 8.3 min, Jupiter 43 min, Neptune 4.2 h).
 * - `model`: the Solar System shrunk so the Sun is a 30 cm ball: the clock is metres walked from the Sun past a
 *   football pitch (Earth 2.7 mm at 32 m … Neptune at 970 m).
 */
import * as THREE from 'three';
import { BODY } from '../../../shared/data/solar.ts';
import { C } from '../kit.ts';
import { D2R, body, canvasTex, circlePts, clamp, dirLight, ease, fade, glow, lerp, line, rng, starfield, tempColor } from './draw.ts';
import type { KitCtx, KitFactory, KitRun, Label, Pair } from './types.ts';

export interface Opts {
  mode?: 'cosmic' | 'light' | 'model';
  /** `cosmic` without a clock: the stop shown (0 Earth … 6 observable universe) */
  stop?: number;
}

const AU = 1.495978707e11, LY = 9.4607e15, KM = 1e3;
const LIGHT_MIN = 8.3167; // minutes for light to cross 1 AU

type Pl = 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';
const PL: Pl[] = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
const PCOL: Record<Pl, string> = { mercury: '#c9c0b6', venus: '#f0d9a8', earth: '#6ea8e8', mars: '#e0835a', jupiter: '#e0bf96', saturn: '#ecd9a4', uranus: '#a8e0e8', neptune: '#7090f0' };
const nm = (id: keyof typeof BODY): Pair => [BODY[id].name.en, BODY[id].name.zh ?? BODY[id].name.en];
const aAU = (id: Pl) => BODY[id].kepler!.a[0];

const kit: KitFactory<Opts> = (ctx, o) => {
  ctx.root.add(starfield(ctx.low ? 1200 : 2500));
  return o.mode === 'light' ? walk(ctx, 'light') : o.mode === 'model' ? walk(ctx, 'model') : cosmic(ctx, o);
};
export default kit;

/** A glow that keeps its size on screen (`px` ≈ diameter in pixels on an 800 px tall view). */
function marker(color: string | number, px: number, opacity = 1): THREE.Sprite {
  const s = glow(color, 1, opacity);
  (s.material as THREE.SpriteMaterial).sizeAttenuation = false;
  s.scale.setScalar((px / 800) * 0.73);
  return s;
}

function points(pos: Float32Array, col: Float32Array | string, size: number, additive = false): THREE.Points {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const vc = typeof col !== 'string';
  if (vc) g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: vc, color: vc ? 0xffffff : col, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false;
  return p;
}

/** A spiral galaxy as points in the xy plane, radius 1. */
function spiral(n: number, seed: number, arms = 2, bar = 0.25): THREE.Points {
  const R = rng(seed), pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = R();
    let x: number, y: number, z: number, c: THREE.Color;
    if (u < 0.22) {
      // bulge and bar
      const r = 0.22 * Math.sqrt(-Math.log(1 - R() * 0.98)) * 0.5, t = R() * Math.PI * 2;
      x = r * Math.cos(t) * (1 + bar * 1.5); y = r * Math.sin(t) * (1 - bar); z = (R() - 0.5) * r * 0.6;
      c = new THREE.Color(1, 0.86, 0.62);
    } else {
      const arm = Math.floor(R() * arms * 2), major = arm < arms;
      const r = 0.12 + 0.88 * Math.sqrt(R());
      const th = (arm % arms) * ((2 * Math.PI) / arms) + (major ? 0 : Math.PI / arms) + Math.log(r / 0.12) / Math.tan(13 * D2R);
      const sp = (major ? 0.06 : 0.1) + 0.05 * r;
      x = r * Math.cos(th) + (R() - 0.5) * sp * 2; y = r * Math.sin(th) + (R() - 0.5) * sp * 2; z = (R() - 0.5) * 0.03;
      c = R() < 0.25 ? new THREE.Color(0.7, 0.8, 1) : R() < 0.1 ? new THREE.Color(1, 0.55, 0.65) : new THREE.Color(0.95, 0.93, 0.9);
    }
    const b = 0.35 + 0.65 * R();
    pos.set([x, y, z], i * 3);
    col.set([c.r * b, c.g * b, c.b * b], i * 3);
  }
  return points(pos, col, 1.6, true);
}

/** A fuzzy blob of points (irregular / dwarf galaxies), radius 1. */
function blob(n: number, seed: number, color: string, flat = 0.6): THREE.Points {
  const R = rng(seed), pos = new Float32Array(n * 3), c = new THREE.Color(color), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt(-Math.log(1 - R() * 0.95)) * 0.5, t = R() * Math.PI * 2, z = R() * 2 - 1, s = Math.sqrt(1 - z * z);
    pos.set([r * s * Math.cos(t), r * s * Math.sin(t) * flat, r * z * flat], i * 3);
    const b = 0.4 + 0.6 * R();
    col.set([c.r * b, c.g * b, c.b * b], i * 3);
  }
  return points(pos, col, 1.5, true);
}

// ------------------------------------------------------------------------------------------------ cosmic ladder

type V = [number, number, number];
interface Stop { name: Pair; logW: number; c: V }
interface Layer { g: THREE.Group; unit: number; c: V; win: [number, number, number, number] }

/** Big numbers in words: en "2.5 million", zh "250 万". */
function big(v: number, zh: boolean): string {
  const r = (x: number) => (x >= 100 ? Math.round(x) : x >= 10 ? Math.round(x * 10) / 10 : Math.round(x * 100) / 100).toLocaleString(zh ? 'zh-CN' : 'en-US');
  if (zh) return v >= 1e8 ? `${r(v / 1e8)} 亿` : v >= 1e4 ? `${r(v / 1e4)} 万` : r(v);
  return v >= 1e9 ? `${r(v / 1e9)} billion` : v >= 1e6 ? `${r(v / 1e6)} million` : r(v);
}
/** A distance in metres, in the unit a textbook would use. */
function dist(m: number, zh: boolean): string {
  if (m < 2e12) return zh ? `${big(m / KM, true)}千米` : `${big(m / KM, false)} km`;
  if (m < 3e15) return zh ? `${big(m / AU, true)} 天文单位` : `${big(m / AU, false)} AU`;
  return zh ? `${big(m / LY, true)} 光年` : `${big(m / LY, false)} light-years`;
}
/** A round length (1, 2 or 5 × 10ⁿ in the display unit) of about `target` metres. */
function roundLen(target: number): number {
  const u = target < 2e12 ? KM : target < 3e15 ? AU : LY, x = target / u;
  const p = 10 ** Math.floor(Math.log10(x)), f = x / p;
  return (f >= 5 ? 5 : f >= 2 ? 2 : 1) * p * u;
}

function cosmic(ctx: KitCtx, o: Opts & { clock?: unknown }): KitRun {
  const root = ctx.root, low = ctx.low;
  const D = 10; // display width of the view (units)
  const SUN: V = [-AU, 0, 0];
  const GC: V = [SUN[0] + 26000 * LY, 0, 0];
  const M31: V = [GC[0] + 2.5e6 * LY * 0.6, 2.5e6 * LY * 0.8, 0];
  const LGC: V = [lerp(GC[0], M31[0], 0.45), lerp(GC[1], M31[1], 0.45), 0];
  const stops: Stop[] = [
    { name: ['Earth', '地球'], logW: Math.log10(4.2e7), c: [0, 0, 0] },
    { name: ['Earth–Moon system', '地月系'], logW: Math.log10(1.15e9), c: [0, 0, 0] },
    { name: ['Solar System', '太阳系'], logW: Math.log10(85 * AU), c: SUN },
    { name: ['Nearby stars', '太阳附近的恒星'], logW: Math.log10(30 * LY), c: SUN },
    { name: ['Milky Way', '银河系'], logW: Math.log10(1.7e5 * LY), c: GC },
    { name: ['Local Group', '本星系群'], logW: Math.log10(7.5e6 * LY), c: LGC },
    { name: ['Observable universe', '可观测宇宙'], logW: Math.log10(1.15e11 * LY), c: [0, 0, 0] },
  ];
  const layers: Layer[] = [];
  const layer = (unit: number, c: V, win: [number, number, number, number]) => {
    const g = new THREE.Group();
    root.add(g);
    layers.push({ g, unit, c, win });
    return g;
  };
  const labelsBy: { l: Label; layer: Layer; from: number; to: number }[] = [];
  const tag = (lay: Layer, at: V, text: Pair, from: number, to: number, c?: string, dy = -14) => {
    const a = new THREE.Object3D();
    a.position.set(...at);
    lay.g.add(a);
    labelsBy.push({ l: ctx.label(a, text, { c, dy }), layer: lay, from, to });
  };
  root.add(dirLight([-1, -0.3, 0.25], 2.4, 0.08));

  // Earth and Moon (unit: Earth radius)
  const em = layer(6.371e6, [0, 0, 0], [-99, -98, 10.7, 11.4]);
  const earth = body('earth', 1, '#4a7ab8');
  earth.rotation.y = 2.2;
  const moonR = 384400 / 6371;
  const moon = body('moon', 1737.4 / 6371, '#9a9a9a');
  moon.position.set(moonR * Math.cos(1.1), moonR * Math.sin(1.1), 0);
  em.add(earth, moon, line(circlePts(moonR, 160), '#8fa6c8', { opacity: 0.35 }));
  const emL = layers[0];
  tag(emL, [0, 0, 0], nm('earth'), 8.2, 10.4, C.blue, -26);
  tag(emL, [moon.position.x, moon.position.y, 0], nm('moon'), 8.6, 10.4, '#c8c8c8');

  // Solar System (unit: AU, centred on the Sun)
  const ss = layer(AU, SUN, [10.3, 11.1, 14.8, 15.7]);
  const ssL = layers[1];
  ss.add(marker('#ffd27a', 26));
  PL.forEach((id, i) => {
    const a = aAU(id), th = id === 'earth' ? 0 : (i * 2.39 + 0.7) % (Math.PI * 2);
    ss.add(line(circlePts(a, 160), '#8fa6c8', { opacity: 0.3 }));
    const m = marker(PCOL[id], 9);
    m.position.set(a * Math.cos(th), a * Math.sin(th), 0);
    ss.add(m);
    if (id === 'earth' || id === 'jupiter' || id === 'neptune') tag(ssL, [m.position.x, m.position.y, 0], nm(id), 11.4, 13.8, PCOL[id]);
  });
  {
    const N = low ? 600 : 1500, R = rng(31), p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const r = 30 + 20 * R(), t = R() * Math.PI * 2; p.set([r * Math.cos(t), r * Math.sin(t), (R() - 0.5) * 3], i * 3); }
    ss.add(points(p, '#7f93b8', 1.3));
  }
  tag(ssL, [0, 0, 0], nm('sun'), 11.4, 14.6, C.gold);

  // nearby stars (unit: light-year, centred on the Sun); equatorial RA/Dec and distance
  const st = layer(LY, SUN, [15.2, 16.2, 18.9, 19.8]);
  const stL = layers[2];
  const near: [string, Pair | null, number, number, number, number][] = [
    ['acen', ['α Centauri (4.2 ly)', '半人马座α（4.2 光年）'], 219.9, -60.8, 4.3, 5600],
    ['barnard', null, 269.5, 4.7, 5.96, 3100], ['wolf359', null, 164.1, 7.0, 7.9, 2800], ['lalande', null, 165.8, 36.0, 8.3, 3500],
    ['sirius', ['Sirius', '天狼星'], 101.3, -16.7, 8.6, 9900], ['luyten', null, 24.8, -18.0, 8.7, 2700], ['ross154', null, 282.5, -23.8, 9.7, 3100],
    ['eeri', null, 53.2, -9.5, 10.5, 5000], ['procyon', ['Procyon', '南河三'], 114.8, 5.2, 11.5, 6500], ['61cyg', null, 316.7, 38.7, 11.4, 4400],
    ['tauceti', null, 26.0, -15.9, 11.9, 5300], ['eind', null, 330.8, -56.8, 11.9, 4600], ['altair', ['Altair', '牛郎星'], 297.7, 8.9, 16.7, 7700],
  ];
  st.add(marker('#ffd27a', 18));
  tag(stL, [0, 0, 0], nm('sun'), 15.6, 18.4, C.gold);
  for (const [, label, ra, de, d, T] of near) {
    const x = d * Math.cos(de * D2R) * Math.cos(ra * D2R), y = d * Math.cos(de * D2R) * Math.sin(ra * D2R), z = d * Math.sin(de * D2R) * 0.5;
    const m = marker(tempColor(T).getHex(), T > 7000 ? 16 : 11);
    m.position.set(x, y, z);
    st.add(m);
    if (label) tag(stL, [x, y, z], label, 15.9, 18.3, '#d8e2f0');
  }
  {
    const N = low ? 50 : 110, R = rng(41), p = new Float32Array(N * 3), c = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 6 + 14 * Math.cbrt(R()), z = R() * 2 - 1, t = R() * Math.PI * 2, s = Math.sqrt(1 - z * z);
      p.set([r * s * Math.cos(t), r * s * Math.sin(t), r * z * 0.5], i * 3);
      const k = tempColor(2800 + 3000 * R() ** 2), b = 0.5 + 0.5 * R();
      c.set([k.r * b, k.g * b, k.b * b], i * 3);
    }
    st.add(points(p, c, 2.4));
  }

  // the Milky Way (unit: light-year, centred on the galactic centre)
  const mw = layer(LY, GC, [19.3, 20.3, 24.4, 25.0]);
  const mwL = layers[3];
  const disk = spiral(low ? 4000 : 10000, 3, 2, 0.3);
  disk.scale.setScalar(50000);
  disk.rotation.z = 0.4;
  const core = glow('#ffd9a0', 30000, 0.55);
  mw.add(disk, core);
  const here = marker('#ffe066', 12);
  here.position.set(-26000, 0, 0);
  mw.add(here);
  tag(mwL, [-26000, 0, 0], ['Sun is here', '太阳在这里'], 19.6, 21.8, C.gold, 16);
  tag(mwL, [0, 0, 0], ['Milky Way', '银河系'], 22.1, 23.6, '#d8e2f0', 18);

  // the Local Group (unit: light-year)
  const lg = layer(LY, LGC, [21.8, 22.5, 25.0, 25.6]);
  const lgL = layers[4];
  const off = (p: V): V => [p[0] - LGC[0], p[1] - LGC[1], p[2] - LGC[2]];
  const m31 = spiral(low ? 3000 : 7000, 8, 2, 0.15);
  m31.scale.setScalar(110000);
  m31.rotation.set(1.35, 0.2, 0.6);
  m31.position.set(...off(M31));
  const m31g = glow('#ffe0b0', 60000, 0.5);
  m31g.position.copy(m31.position);
  lg.add(m31, m31g);
  tag(lgL, off(M31), ['Andromeda Galaxy', '仙女星系'], 21.9, 24.6, '#f0d8c0', -20);
  const M33: V = [M31[0] - 0.6e6 * LY, M31[1] - 0.5e6 * LY, 0];
  const m33 = spiral(low ? 900 : 2200, 13, 2, 0);
  m33.scale.setScalar(30000);
  m33.rotation.set(0.9, 0.4, 0);
  m33.position.set(...off(M33));
  lg.add(m33);
  tag(lgL, off(M33), ['Triangulum Galaxy', '三角星系'], 22.3, 23.6, '#c8d0e0', 14);
  for (const [dx, dy, r, n, s] of [[-160000, -20000, 9000, 500, 4], [-190000, 40000, 5000, 300, 6]] as [number, number, number, number, number][]) {
    const b = blob(low ? n / 2 : n, s, '#cfd8ff');
    b.scale.setScalar(r);
    b.position.set(GC[0] - LGC[0] + dx * 0.6, GC[1] - LGC[1] + dy, 0);
    lg.add(b);
  }
  {
    const N = 46, R = rng(59), g = new THREE.Group();
    for (let i = 0; i < N; i++) {
      const host = R() < 0.5 ? GC : M31, r = 1.5e5 + 1.1e6 * R() ** 1.5, t = R() * Math.PI * 2, z = (R() - 0.5) * 2;
      const b = marker('#c8d4f0', 3 + R() * 3, 0.7);
      b.position.set(host[0] - LGC[0] + r * Math.cos(t), host[1] - LGC[1] + r * Math.sin(t), r * z * 0.4);
      g.add(b);
    }
    lg.add(g);
  }
  tag(lgL, [GC[0] - LGC[0], GC[1] - LGC[1], 0], ['Milky Way', '银河系'], 23.6, 24.6, '#d8e2f0', 18);

  // the observable universe (unit: billion light-years, centred on us)
  const GLY = 1e9 * LY;
  const uni = layer(GLY, [0, 0, 0], [24.4, 25.5, 99, 99]);
  const uniL = layers[5];
  {
    const R = rng(77), nodes: THREE.Vector3[] = [];
    for (let i = 0; i < (low ? 80 : 150); i++) {
      const r = 46 * Math.cbrt(R()), z = R() * 2 - 1, t = R() * Math.PI * 2, s = Math.sqrt(1 - z * z);
      nodes.push(new THREE.Vector3(r * s * Math.cos(t), r * s * Math.sin(t), r * z));
    }
    const N = low ? 4000 : 11000, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), q = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const a = nodes[Math.floor(R() * nodes.length)];
      if (R() < 0.35) q.copy(a).addScaledVector(new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5), 2.2);
      else {
        // along a filament to one of its near neighbours
        let best = a, bd = 1e9;
        for (let k = 0; k < 6; k++) { const b = nodes[Math.floor(R() * nodes.length)], d = b.distanceTo(a); if (b !== a && d < bd) { bd = d; best = b; } }
        q.copy(a).lerp(best, R()).add(new THREE.Vector3((R() - 0.5) * 1.2, (R() - 0.5) * 1.2, (R() - 0.5) * 1.2));
      }
      if (q.length() > 46.5) q.setLength(46 * R());
      pos.set([q.x, q.y, q.z], i * 3);
      const b = 0.35 + 0.65 * R(), w = R() < 0.3;
      col.set([b * (w ? 1 : 0.75), b * (w ? 0.85 : 0.8), b], i * 3);
    }
    uni.add(points(pos, col, 1.4, true));
    // the edge: the cosmic microwave background, as a soft ring facing the camera
    const tex = canvasTex(256, 256, c => {
      const gr = c.createRadialGradient(128, 128, 96, 128, 128, 128);
      gr.addColorStop(0, 'rgba(255,140,90,0)'); gr.addColorStop(0.55, 'rgba(255,150,100,0.55)'); gr.addColorStop(0.8, 'rgba(255,120,80,0.25)'); gr.addColorStop(1, 'rgba(255,120,80,0)');
      c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
    });
    const edge = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    edge.scale.setScalar(46.5 * 2 * 1.33);
    uni.add(edge);
    const me = marker('#ffe066', 8);
    uni.add(me);
  }
  tag(uniL, [0, 0, 0], ['We are here', '我们在这里'], 25.2, 99, C.gold, 16);
  tag(uniL, [0, 46.5, 0], ['Cosmic microwave background (edge)', '宇宙微波背景（边缘）'], 25.6, 99, '#ffb08a', -10);

  // title and live scale bar (display coordinates)
  const title = ctx.label(new THREE.Vector3(0, 4.6, 0), '', { big: true, c: '#e9ecef' });
  const bar = new THREE.Group();
  const barLine = line([[0, 0, 0], [1, 0, 0]], '#e9ecef', { opacity: 0.85 });
  const tickA = line([[0, -0.12, 0], [0, 0.12, 0]], '#e9ecef', { opacity: 0.85 }), tickB = tickA.clone();
  bar.add(barLine, tickA, tickB);
  bar.position.set(-4.6, -4.4, 0);
  root.add(bar);
  const barMid = new THREE.Object3D();
  bar.add(barMid);
  const barLabel = ctx.label(barMid, '', { c: '#e9ecef', dy: 14 });

  const hasClock = !!o.clock;
  const state = { logW: stops[0].logW, idx: 0 };
  const F = new THREE.Vector3();
  let lastTitle = -1, lastBar = '';
  ctx.view([0, -1, 0.75], 12.5, [0, -0.3, 0], true);
  return {
    update(v, dt) {
      const s = clamp(hasClock ? v : o.stop ?? 0, 0, stops.length - 1);
      const i = Math.min(stops.length - 2, Math.floor(s)), f = ease(s - i);
      const a = stops[i], b = stops[i + 1];
      const logW = lerp(a.logW, b.logW, f), W = 10 ** logW;
      state.logW = logW;
      // the focus slides between system centres in step with the width, so it never jumps
      const wa = 10 ** a.logW, wb = 10 ** b.logW, u = clamp((W - wa) / (wb - wa));
      F.set(lerp(a.c[0], b.c[0], u), lerp(a.c[1], b.c[1], u), lerp(a.c[2], b.c[2], u));
      const k = D / W;
      for (const L of layers) {
        const [i0, i1, o0, o1] = L.win;
        const al = clamp((logW - i0) / (i1 - i0)) * clamp((o1 - logW) / (o1 - o0));
        fade(L.g, al);
        if (!L.g.visible) continue;
        L.g.scale.setScalar(L.unit * k);
        L.g.position.set((L.c[0] - F.x) * k, (L.c[1] - F.y) * k, (L.c[2] - F.z) * k);
      }
      earth.rotation.y += dt * 0.08;
      for (const t of labelsBy) t.l.on = t.layer.g.visible && logW >= t.from && logW <= t.to;
      // title: the nearest stop
      const near = Math.round(s);
      if (near !== lastTitle) { lastTitle = near; title.set(stops[near].name); state.idx = near; }
      title.on = Math.abs(s - near) < 0.3;
      // scale bar about a third of the view
      const len = roundLen(W * 0.3), Ld = len * k;
      barLine.scale.x = Ld;
      tickB.position.x = Ld;
      barMid.position.x = Ld / 2;
      const txt = dist(len, ctx.zh());
      if (txt !== lastBar) { lastBar = txt; barLabel.set(txt); }
    },
    readout() {
      const W = 10 ** state.logW;
      return [`view about ${dist(W, false)} across`, `视野宽约 ${dist(W, true)}`];
    },
  };
}

// ------------------------------------------------------------------------------------------------ light / walk

/**
 * The planets in a line from the Sun at true distances; a front (a light pulse, or a walker on the 30 cm-Sun model)
 * moves out and the view widens to keep it in sight.
 */
function walk(ctx: KitCtx, kind: 'light' | 'model'): KitRun {
  const root = ctx.root, light = kind === 'light';
  const D = 10, X0 = -5;
  // distances: AU (light) or metres (model: Sun = 30 cm ball)
  const MODEL = 0.3 / (2 * BODY.sun.radiusKm * KM); // metres of model per metre of space
  const dOf = (id: Pl) => (light ? aAU(id) : aAU(id) * AU * MODEL);
  const W0 = light ? 2 : 62;
  const toFront = (v: number) => (light ? v / LIGHT_MIN : v);
  const width = (front: number) => Math.hypot(W0, front * 1.18);

  const sunM = marker('#ffd27a', light ? 46 : 30);
  root.add(sunM);
  ctx.label(sunM, light ? nm('sun') : ['Sun: a 30 cm ball', '太阳：30 厘米的球'], { c: C.gold, dy: -22 });
  const axis = line([[0, 0, 0], [1, 0, 0]], '#8fa6c8', { opacity: 0.35 });
  root.add(axis);

  const pl = PL.map((id, i) => {
    const m = marker(PCOL[id], 12);
    root.add(m);
    const arc = line(Array.from({ length: 41 }, (_, k) => { const t = (k / 40 - 0.5) * 0.5; return new THREE.Vector3(Math.cos(t), Math.sin(t), 0); }), '#8fa6c8', { opacity: 0.25 });
    root.add(arc);
    const d = dOf(id);
    const sizeMm = 2 * BODY[id].radiusKm * KM * MODEL * 1000;
    const sz = sizeMm >= 10 ? `${(sizeMm / 10).toFixed(1)} cm` : `${sizeMm.toFixed(1)} mm`;
    const szZh = sizeMm >= 10 ? `${(sizeMm / 10).toFixed(1)} 厘米` : `${sizeMm.toFixed(1)} 毫米`;
    const t = aAU(id) * LIGHT_MIN;
    const tm: Pair = t < 60 ? [`${t.toFixed(1)} min`, `${t.toFixed(1)} 分钟`] : [`${Math.floor(t / 60)} h ${Math.round(t % 60)} min`, `${Math.floor(t / 60)} 小时 ${Math.round(t % 60)} 分`];
    const base = nm(id);
    const full: Pair = light ? [`${base[0]} · ${tm[0]}`, `${base[1]} · ${tm[1]}`]
      : [`${base[0]} · ${sz} · ${Math.round(d)} m`, `${base[1]} · ${szZh} · ${Math.round(d)} 米`];
    const l = ctx.label(m, light ? base : full, { c: PCOL[id], dy: i % 2 ? 18 : -18 });
    return { id, m, arc, d, l, base, full, tm, lit: false };
  });

  // light: the pulse front and the lit path; model: a walker
  const frontArc = line(Array.from({ length: 61 }, (_, k) => { const t = (k / 60 - 0.5) * 0.9; return new THREE.Vector3(Math.cos(t), Math.sin(t), 0); }), light ? '#fff3b0' : '#ffffff', { opacity: 0.9 });
  const frontGlow = marker(light ? '#fff3b0' : '#ffffff', light ? 30 : 16, 0.9);
  const lit = line([[0, 0, 0], [1, 0, 0]], C.gold, { opacity: 0.75 });
  root.add(lit, frontGlow);
  if (light) root.add(frontArc);

  // model: a football pitch at the Sun's end (105 × 68 m) and distance ticks
  const pitch = new THREE.Group();
  const ticks: { minor: THREE.LineSegments; major: THREE.LineSegments } | null = light ? null : (() => {
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(105, 68), new THREE.MeshBasicMaterial({ color: '#2f6b3a', transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }));
    fill.position.set(52.5, 0, -0.05);
    pitch.add(fill,
      line([[0, -34, 0], [105, -34, 0], [105, 34, 0], [0, 34, 0], [0, -34, 0]], '#e9ecef', { opacity: 0.45 }),
      line([[52.5, -34, 0], [52.5, 34, 0]], '#e9ecef', { opacity: 0.45 }),
      line(circlePts(9.15, 64, [52.5, 0, 0]), '#e9ecef', { opacity: 0.45 }),
      line([[0, -20.15, 0], [16.5, -20.15, 0], [16.5, 20.15, 0], [0, 20.15, 0]], '#e9ecef', { opacity: 0.45 }),
      line([[105, -20.15, 0], [88.5, -20.15, 0], [88.5, 20.15, 0], [105, 20.15, 0]], '#e9ecef', { opacity: 0.45 }));
    root.add(pitch);
    const pl2 = new THREE.Object3D();
    pl2.position.set(52.5, -34, 0);
    pitch.add(pl2);
    ctx.label(pl2, ['Football pitch, 105 m', '足球场，长 105 米'], { c: '#9fd89f', dy: 16 });
    const mk = (n: number) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 6), 3)); return g; };
    const minor = new THREE.LineSegments(mk(101), new THREE.LineBasicMaterial({ color: '#c8d0e0', transparent: true, opacity: 0.4, depthWrite: false }));
    const major = new THREE.LineSegments(mk(11), new THREE.LineBasicMaterial({ color: '#e9ecef', transparent: true, opacity: 0.7, depthWrite: false }));
    minor.frustumCulled = major.frustumCulled = false;
    root.add(minor, major);
    return { minor, major };
  })();

  ctx.view([0, -1, light ? 0.55 : 0.75], 11.8, [0, -0.2, 0], true);
  const state = { front: 0 };
  return {
    update(v) {
      const front = toFront(Math.max(0, v)), W = width(front), k = D / W;
      state.front = front;
      const xs = (d: number) => X0 + d * k;
      axis.scale.x = D * 1.1; axis.position.x = X0;
      // labels: drop inner ones that would crowd their outer neighbour
      let lastX = 1e9;
      for (let i = pl.length - 1; i >= 0; i--) {
        const p = pl[i], x = xs(p.d);
        p.m.position.set(x, 0, 0);
        p.arc.position.set(X0, 0, 0);
        p.arc.scale.setScalar(Math.max(1e-4, p.d * k));
        p.m.visible = p.arc.visible = x < X0 + D * 1.15;
        const show = p.m.visible && lastX - x > 0.75;
        p.l.on = show;
        if (show) lastX = x;
        const isLit = front >= p.d;
        if (isLit !== p.lit) { p.lit = isLit; if (light) p.l.set(isLit ? p.full : p.base); }
        (p.m.material as THREE.SpriteMaterial).opacity = light ? (isLit ? 1 : 0.55) : 1;
      }
      sunM.position.set(X0, 0, 0);
      const fx = xs(front);
      frontGlow.position.set(fx, 0, light ? 0 : 0.02);
      frontGlow.visible = front > 0;
      lit.position.x = X0; lit.scale.x = Math.max(1e-4, front * k);
      if (light) { frontArc.position.set(X0, 0, 0); frontArc.scale.setScalar(Math.max(1e-4, front * k)); frontArc.visible = front > 0; }
      if (ticks) {
        pitch.position.x = X0; pitch.scale.setScalar(k);
        const set = (ls: THREE.LineSegments, step: number, h: number) => {
          const a = ls.geometry.getAttribute('position') as THREE.BufferAttribute;
          for (let i = 0; i < a.count / 2; i++) { const x = xs(i * step); a.setXYZ(i * 2, x, -h, 0.01); a.setXYZ(i * 2 + 1, x, h, 0.01); }
          a.needsUpdate = true;
        };
        set(ticks.minor, 10, 0.1); set(ticks.major, 100, 0.22);
        fade(ticks.minor, clamp((260 - W) / 120));
      }
    },
    readout() {
      const passed = [...pl].reverse().find(p => state.front >= p.d);
      if (light) return passed ? [`light has passed ${passed.base[0]} (${passed.tm[0]})`, `光已越过${passed.base[1]}（${passed.tm[1]}）`] : ['light leaves the Sun', '光离开太阳'];
      return passed ? [`walked past ${passed.base[0]} (${Math.round(passed.d)} m)`, `已走过${passed.base[1]}（${Math.round(passed.d)} 米）`] : ['start at the Sun', '从太阳出发'];
    },
  };
}
