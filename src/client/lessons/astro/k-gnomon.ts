/**
 * Kit "gnomon": a vertical rod (表) on level ground and its shadow, the oldest way to measure the Sun and the year.
 * x points east, y north, z up. The Sun's position follows the latitude, the date (declination) and the solar time.
 * - `day`: the clock is the solar time (hours); the Sun crosses the sky, the shadow swings and the tip traces a
 *   curve; at noon the shadow points due north (or south, if the Sun is overhead to the north). Lab sliders `lat` and
 *   `day` (day of the year) override `lat` / `day`.
 * - `year`: the clock is a date; every day at noon the shadow falls on the measuring scale (圭) laid north of the rod:
 *   longest at the winter solstice, shortest at the summer solstice. `tower` draws the Dengfeng observatory (登封观星台)
 *   of Guo Shoujing: a 40-chi (12.6 m) high crossbeam over a 31.2 m stone scale.
 */
import * as THREE from 'three';
import { C } from '../kit.ts';
import { D2R, ball, circlePts, clamp, dirLight, line, setLine, star } from './draw.ts';
import type { KitFactory, Label, Pair, V3 } from './types.ts';

export interface Opts {
  /** default `day` */
  mode?: 'day' | 'year';
  /** latitude, ° (default 40); a lab slider `lat` overrides it */
  lat?: number;
  /** day of the year, 1 … 365 (default 172, the June solstice); a lab slider `day` overrides it */
  day?: number;
  /** year: the Dengfeng observatory instead of a plain rod (latitude 34.4°) */
  tower?: boolean;
}

/** The Sun's declination (°) on day `d` of 2025 (1 = 1 January), at noon in China. */
export function declination(d: number): number {
  const n = Date.UTC(2025, 0, 1, 4) + (d - 1) * 864e5;
  return decAt(n);
}
function decAt(ms: number): number {
  const d = (ms - Date.UTC(2000, 0, 1, 12)) / 864e5, g = (357.528 + 0.9856003 * d) * D2R;
  const lam = (280.46 + 0.9856474 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * D2R;
  return Math.asin(Math.sin(23.44 * D2R) * Math.sin(lam)) / D2R;
}
/** Unit vector to the Sun (x east, y north, z up) at latitude φ, declination δ, solar time t (hours). */
function sunVec(phi: number, dec: number, t: number, out = new THREE.Vector3()): THREE.Vector3 {
  const f = phi * D2R, d = dec * D2R, H = (t - 12) * 15 * D2R;
  return out.set(-Math.cos(d) * Math.sin(H), Math.cos(f) * Math.sin(d) - Math.sin(f) * Math.cos(d) * Math.cos(H), Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(H));
}
const dateTxt = (d: number): Pair => {
  const t = new Date(Date.UTC(2025, 0, 1) + (Math.round(d) - 1) * 864e5), m = t.getUTCMonth(), dd = t.getUTCDate();
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return [`${dd} ${M[m]}`, `${m + 1}月${dd}日`];
};
const f1 = (x: number) => x.toFixed(1), f2 = (x: number) => (x < 10 ? x.toFixed(2) : x.toFixed(1));

const kit: KitFactory<Opts> = (ctx, o) => {
  const root = ctx.root, mode = o.mode ?? 'day', tower = mode === 'year' && !!o.tower;
  const G = tower ? 9 : 6.2, h = tower ? 3 : 1, Rs = tower ? 11 : 7.5;
  // the real height the scene's rod stands for (m)
  const hReal = tower ? 12.6 : 1;
  const latOf = () => { const p = ctx.param('lat'); return Number.isFinite(p) ? p : tower ? 34.4 : o.lat ?? 40; };
  const dayOf = () => { const p = ctx.param('day'); return Number.isFinite(p) ? p : o.day ?? 172; };

  ctx.scene.background = new THREE.Color('#0d1726');
  const light = dirLight([0, -1, 1], 2.2, 0.35);
  root.add(light);
  const dl = light.children[0] as THREE.DirectionalLight;
  root.add(new THREE.HemisphereLight('#9fc3ff', '#2a2a1e', 0.35));
  // ground
  const ground = new THREE.Mesh(new THREE.CircleGeometry(G, 96), new THREE.MeshStandardMaterial({ color: '#4a5a40', roughness: 1 }));
  root.add(ground, line(circlePts(G, 128, [0, 0, 0.005]), '#8fa37f', { opacity: 0.6 }));
  const cards: [Pair, V3][] = [[['N', '北'], [0, 1, 0]], [['E', '东'], [1, 0, 0]], [['S', '南'], [0, -1, 0]], [['W', '西'], [-1, 0, 0]]];
  for (const [t, d] of cards) ctx.label(new THREE.Vector3(...d).multiplyScalar(G + 0.45), t, { c: C.gold, big: true });
  root.add(line([[0, -G, 0.01], [0, G, 0.01]], '#c9d6b8', { opacity: 0.35 }), line([[-G, 0, 0.01], [G, 0, 0.01]], '#c9d6b8', { opacity: 0.2 }));

  // the measuring scale (圭) running north, with a tick every metre (every 0.5 in rod heights)
  const guiLen = tower ? 31.19 * (h / hReal) : 4.6;
  const gui = new THREE.Mesh(new THREE.BoxGeometry(tower ? 0.55 : 0.32, guiLen, tower ? 0.12 : 0.04), new THREE.MeshStandardMaterial({ color: '#cfc6b0', roughness: 0.9 }));
  gui.position.set(0, guiLen / 2, tower ? 0.06 : 0.02);
  root.add(gui);
  const zt = tower ? 0.125 : 0.045, step = tower ? 5 : 0.5;
  for (let m = step; m * (h / hReal) <= guiLen + 1e-6; m += step) {
    const y = m * (h / hReal), big = Math.abs(m % (step * 2)) < 1e-6;
    root.add(line([[-(tower ? 0.27 : 0.16), y, zt], [tower ? 0.27 : 0.16, y, zt]], '#5c4a2a', { opacity: 0.9 }));
    if (big) ctx.label(new THREE.Vector3(tower ? 0.6 : 0.35, y, zt), [`${m} m`, `${m} 米`], { c: '#e9dfc7' });
  }
  ctx.label(new THREE.Vector3(0, guiLen + (tower ? 0.5 : 0.3), zt), tower ? ['stone scale (gui) 31.2 m', '量天尺（石圭）31.2 米'] : ['scale (gui)', '圭（量影尺）'], { c: '#e9dfc7', dx: tower ? 30 : 16, dy: tower ? 42 : 0 });

  // the gnomon
  let tip = new THREE.Vector3(0, 0, h);
  let rodL: Label | null = null;
  if (tower) {
    // a square frustum platform south of the scale with a slot in its north face, two huts on top and the crossbeam
    const sq = (top: number, bot: number, hh: number, c: string) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(top / Math.SQRT2, bot / Math.SQRT2, hh, 4, 1), new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, flatShading: true }));
      m.rotation.x = Math.PI / 2; m.rotation.y = Math.PI / 4; return m;
    };
    const k = h / hReal, base = sq(8 * k, 16.7 * k, 9.46 * k, '#a8805c');
    base.position.set(0, -8.35 * k, 4.73 * k);
    const hut1 = new THREE.Mesh(new THREE.BoxGeometry(2.4 * k, 2.4 * k, 3.1 * k), new THREE.MeshStandardMaterial({ color: '#8c6448', roughness: 0.9 }));
    const hut2 = hut1.clone();
    hut1.position.set(-1.9 * k, -6.5 * k, (9.46 + 1.55) * k); hut2.position.set(1.9 * k, -6.5 * k, (9.46 + 1.55) * k);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(1.6 * k, 2.2 * k, 9.5 * k), new THREE.MeshBasicMaterial({ color: '#1d140c' }));
    slot.position.set(0, -0.9 * k, 4.73 * k);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 12), new THREE.MeshStandardMaterial({ color: '#ffe8a8', emissive: '#5a4a10' }));
    beam.rotation.z = Math.PI / 2;
    beam.position.set(0, 0, h);
    root.add(base, hut1, hut2, slot, beam, line([[0, 0, 0], [0, 0, h]], '#ffe8a8', { opacity: 0.35, dashed: true, dash: 0.12 }));
    ctx.label(new THREE.Vector3(0.7, 0, h), ['crossbeam 12.6 m up (40 chi)', '横梁：高 40 尺（约 12.6 米）'], { c: C.gold, dx: 40 });
    ctx.label(new THREE.Vector3(-1.6, -3.2, 2.3), ['Dengfeng Observatory, 1276', '登封观星台（1276 年）'], { c: C.white, big: true });
    ctx.pickable(beam, 'beam');
  } else {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, h, 12), new THREE.MeshStandardMaterial({ color: '#f1e3c0', roughness: 0.6 }));
    rod.rotation.x = Math.PI / 2; rod.position.z = h / 2;
    const knob = ball(0.05, '#ffe8a8', { seg: 12 });
    knob.position.z = h;
    root.add(rod, knob);
    rodL = ctx.label(knob, ['rod (biao) 1 m', '表（高 1 米）'], { c: C.white, dx: -40, dy: -10 });
    ctx.pickable(rod, 'rod');
    tip = knob.position;
  }

  // the shadow: a dark strip from the foot of the rod to the tip of its shadow
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#0b0f0a', transparent: true, opacity: 0.78, depthWrite: false }));
  shadow.renderOrder = 2;
  root.add(shadow);
  const tipDot = new THREE.Mesh(new THREE.SphereGeometry(tower ? 0.08 : 0.045, 12, 8), new THREE.MeshBasicMaterial({ color: C.orange }));
  root.add(tipDot);
  ctx.pickable(tipDot, 'shadow');
  const ray = line([[0, 0, 0], [0, 0, 0], [0, 0, 0]], '#ffe066', { opacity: 0.75 });
  const angArc = line(Array.from({ length: 17 }, () => new THREE.Vector3()), C.orange);
  root.add(ray, angArc);
  const aAng = new THREE.Object3D();
  root.add(aAng);
  const lAng = ctx.label(aAng, '', { c: C.orange, dx: 8 });
  const lLen = ctx.label(tipDot, '', { c: C.white, big: true, dy: 26 });
  const sun = star(tower ? 0.45 : 0.3, '#ffd27a', 4);
  root.add(sun);

  // the Sun's path through the day and the shadow-tip curve (day), or the solstice marks on the scale (year)
  const path = line(Array.from({ length: 97 }, () => new THREE.Vector3()), '#ffd27a', { opacity: 0.4, dashed: true, dash: 0.15 });
  const trace = line(Array.from({ length: 97 }, () => new THREE.Vector3()), C.orange, { opacity: 0.85, dashed: true, dash: 0.06 });
  root.add(path, trace);
  const marks: { y: number; a: THREE.Object3D; m: THREE.Line }[] = [];
  if (mode === 'year') {
    for (const [i, name] of ([[0, ['summer solstice', '夏至']], [1, ['equinoxes', '春分 / 秋分']], [2, ['winter solstice', '冬至']]] as [number, Pair][])) {
      const m = line([[-0.45, 0, zt + 0.01], [0.45, 0, zt + 0.01]], [C.red, C.green, C.blue][i]);
      root.add(m);
      const a = new THREE.Object3D();
      root.add(a);
      // summer below the scale, the others above it, so the close marks don't collide
      ctx.label(a, name, { c: [C.red, C.green, C.blue][i], dx: i === 0 ? 36 : 0, dy: i === 0 ? 14 : -4 });
      marks.push({ y: 0, a, m });
    }
  }
  if (tower) ctx.view([1, -0.55, 0.62], 22, [0, 2.5, 1.2], true);
  else ctx.view([1, -0.9, 0.85], 13.5, [0, 0.9, 0.4], true);

  const S = new THREE.Vector3(), T = new THREE.Vector3(), q = new THREE.Vector3();
  let lastKey = '';
  /** Shadow tip on the ground for a sun direction (null if the Sun is down). */
  const shadowTip = (s: THREE.Vector3, out: THREE.Vector3) => (s.z <= 0.01 ? null : out.set(-h * s.x / s.z, -h * s.y / s.z, 0));
  const state = { alt: 0, len: 0, noonAlt: 0, noonLen: 0 };
  const place = (s: THREE.Vector3) => {
    sun.visible = s.z > -0.02;
    // on the tower the beam is far off the ground: centre the Sun on the beam so its ray meets the disc
    sun.position.copy(s).multiplyScalar(Rs);
    if (tower) sun.position.add(tip);
    dl.position.copy(s).multiplyScalar(10);
    dl.intensity = 2.2 * clamp(s.z * 4);
    const t = shadowTip(s, T);
    state.alt = Math.asin(clamp(s.z, -1, 1)) / D2R;
    state.len = t ? Math.hypot(t.x, t.y) * (hReal / h) : Infinity;
    shadow.visible = tipDot.visible = ray.visible = angArc.visible = !!t;
    lAng.on = lLen.on = !!t;
    if (!t) return;
    let L = Math.hypot(t.x, t.y);
    const Lmax = tower ? guiLen + 0.3 : G - 0.1;
    if (L > Lmax) { t.multiplyScalar(Lmax / L); L = Lmax; }
    const ang = Math.atan2(t.y, t.x);
    shadow.position.set(t.x / 2, t.y / 2, tower ? 0.13 : 0.05);
    shadow.rotation.set(0, 0, ang);
    shadow.scale.set(Math.max(L, 1e-3), tower ? 0.16 : 0.06, 1);
    tipDot.position.set(t.x, t.y, tower ? 0.13 : 0.05);
    setLine(ray, [q.copy(s).multiplyScalar(Rs * 0.97).add(tip), tip, tipDot.position]);
    // the altitude angle at the shadow tip, between the ground and the ray to the top of the rod
    const back = new THREE.Vector3(-t.x, -t.y, 0).normalize(), r = tower ? 0.9 : 0.42, a = state.alt * D2R;
    setLine(angArc, Array.from({ length: 17 }, (_, i) => { const u = (i / 16) * a; return tipDot.position.clone().addScaledVector(back, r * Math.cos(u)).setZ(tipDot.position.z + r * Math.sin(u)); }));
    aAng.position.copy(tipDot.position).addScaledVector(back, r * 1.25 * Math.cos(a / 2)).setZ(r * 1.25 * Math.sin(a / 2) + 0.05);
    lAng.set([`${f1(state.alt)}°`, `${f1(state.alt)}°`]);
    lLen.set(state.len > 99 ? ['very long shadow', '影子很长'] : [`${f2(state.len)} m`, `${f2(state.len)} 米`]);
  };

  return {
    update(v) {
      const phi = latOf();
      if (mode === 'day') {
        const d = dayOf(), dec = declination(d);
        const key = `${phi}|${d}`;
        if (key !== lastKey) {
          lastKey = key;
          const dt = dateTxt(d);
          rodL?.set([`rod 1 m · ${f1(phi)}°N · ${dt[0]}`, `表高 1 米 · 北纬 ${f1(phi)}° · ${dt[1]}`]);
          const pp: THREE.Vector3[] = [], tp: THREE.Vector3[] = [];
          for (let i = 0; i <= 96; i++) {
            const s = sunVec(phi, dec, i / 4, new THREE.Vector3());
            pp.push(s.z > 0 ? s.clone().multiplyScalar(Rs) : s.clone().setZ(0).normalize().multiplyScalar(Rs));
            const t = shadowTip(s, new THREE.Vector3());
            tp.push(t && Math.hypot(t.x, t.y) < G - 0.1 ? t.setZ(0.03) : tp[tp.length - 1] ?? new THREE.Vector3(0, 0, 0.03));
          }
          setLine(path, pp); setLine(trace, tp);
          const n = sunVec(phi, dec, 12, S);
          state.noonAlt = Math.asin(n.z) / D2R;
          state.noonLen = n.z > 0.01 ? (hReal / Math.tan(state.noonAlt * D2R)) * Math.sign(phi - dec || 1) : Infinity;
        }
        place(sunVec(phi, dec, v, S));
      } else {
        const dec = decAt(v);
        const key = `${phi}`;
        if (key !== lastKey) {
          lastKey = key;
          // the noon shadow is h·tan(φ − δ) long, pointing north (south when negative)
          [phi - 23.44, phi, phi + 23.44].forEach((z, i) => {
            const y = h * Math.tan(z * D2R);
            marks[i].m.position.y = y;
            marks[i].a.position.set((i === 0 ? 1 : -1) * (tower ? 1.1 : 0.55), y, zt);
            marks[i].y = y;
          });
          // the yearly range of the noon shadow tip on the scale
          const ys = marks.map(m => m.y);
          setLine(trace, Array.from({ length: 97 }, (_, i) => new THREE.Vector3(0.22, ys[0] + (ys[2] - ys[0]) * (i / 96), zt + 0.01)));
        }
        place(sunVec(phi, dec, 12, S));
        path.visible = false;
        state.noonAlt = state.alt; state.noonLen = state.len;
      }
    },
    readout(v) {
      const len = (x: number) => (x > 99 ? '—' : f2(Math.abs(x)));
      const south: Pair = state.noonLen < -1e-3 ? [' (south)', '（向南）'] : ['', ''];
      const noon: Pair = state.noonAlt > 0 ? [`noon ${f1(state.noonAlt)}°, shadow ${len(state.noonLen)} m${south[0]}`, `正午 ${f1(state.noonAlt)}°，影长 ${len(state.noonLen)} 米${south[1]}`] : ['no sun at noon', '正午太阳不升起'];
      if (mode === 'day') {
        const hh = Math.floor(v), mm = Math.round((v - hh) * 60) % 60, t = `${hh + (Math.round((v - hh) * 60) === 60 ? 1 : 0)}:${String(mm).padStart(2, '0')}`;
        return [`${t} · ${noon[0]}`, `${t} · ${noon[1]}`];
      }
      return tower ? [noon[0].replace('shadow', 'beam shadow'), noon[1]] : noon;
    },
  };
};
export default kit;
