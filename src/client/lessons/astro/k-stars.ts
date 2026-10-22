/**
 * Kit "stars": the properties of stars. A row of stars from cool red to hot blue (colour ↔ temperature), light
 * spreading out with distance (the inverse-square law), stellar parallax from Earth's orbit, and a Hertzsprung–Russell
 * diagram of ~150 stars (the Sun can walk its evolution track on the clock).
 */
import * as THREE from 'three';
import { body, canvasTex, circlePts, clamp, drawIn, ease, glow, lerp, line, ramp, rng, setLine, star, starfield, sunLight, tempColor } from './draw.ts';
import { StarBall, dotTex, grainTex, pointScale, sizedPoints } from './k-life.ts';
import type { KitCtx, KitFactory, Pair } from './types.ts';

export interface Opts {
  /**
   * - `color`: a row of stars, 3 000 K to 30 000 K; with a clock (unit `x`, kelvin) one big star takes that temperature
   * - `bright`: light from a star spreads over 1, 4, 9 squares at 1, 2, 3 distances; the clock (1 → 3) moves a detector
   * - `parallax`: Earth orbits the Sun (clock in days) and a near star shifts against far ones
   * - `hr`: the Hertzsprung–Russell diagram (pickable: `sun`, `ms`, `giants`, `super`, `wd`)
   * - `cepheid`: two Cepheid variables, δ Cephei (5.4 days) and ℓ Carinae (35.6 days), pulsing while their light
   *   curves are drawn; the clock (unit `day`) is the time. Pickable: `short`, `long`
   */
  mode: 'color' | 'bright' | 'parallax' | 'hr' | 'cepheid';
  /** hr: the Sun moves along its evolution track; the clock is its age in billions of years (unit `gyr`, 0 … 13) */
  track?: boolean;
  /** hr: label a few famous stars */
  named?: boolean;
}

const kit: KitFactory<Opts> = (ctx, o) => {
  ctx.root.add(starfield(ctx.low ? 1500 : 2600, 900, 7, 1.3));
  switch (o.mode) {
    case 'bright': return bright(ctx);
    case 'parallax': return parallax(ctx);
    case 'hr': return hr(ctx, o);
    case 'cepheid': return cepheid(ctx);
    default: return colors(ctx);
  }
};
export default kit;

const fmtK = (T: number, zh: boolean) => `${Math.round(T).toLocaleString(zh ? 'zh-CN' : 'en-US').replace(/,/g, zh ? '' : ' ')} K`;

// ------------------------------------------------------------------------------------------------ colour and temperature

function colors(ctx: KitCtx) {
  const grain = grainTex();
  const row: [T: number, cls: string, r: number][] = [[3000, 'M', 0.42], [4300, 'K', 0.5], [5800, 'G', 0.58], [7000, 'F', 0.66], [9500, 'A', 0.76], [18000, 'B', 0.92], [30000, 'O', 1.1]];
  const X = (i: number) => -9 + i * 3;
  const balls: StarBall[] = [];
  row.forEach(([T, cls, r], i) => {
    const b = new StarBall(T, r, grain, 40);
    b.position.set(X(i), 0, 0);
    ctx.root.add(b); balls.push(b);
    if (cls === 'G') ctx.pickable(b.mesh, 'sun');
    if (i === 0) ctx.pickable(b.mesh, 'cool');
    if (i === row.length - 1) ctx.pickable(b.mesh, 'hot');
    const lab = ctx.label(new THREE.Vector3(X(i), 0, -1.55), '', { c: '#' + tempColor(T).getHexString(), t: 0.3 + i * 0.12 });
    lab.set([`${cls} · ${fmtK(T, false)}${cls === 'G' ? ' (Sun)' : ''}`, `${cls} 型 · ${fmtK(T, true)}${cls === 'G' ? '（太阳）' : ''}`]);
  });
  // a temperature bar under the row (log scale)
  const lo = Math.log(2800), hi = Math.log(32000);
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(20, 0.3), new THREE.MeshBasicMaterial({
    transparent: true, opacity: 0.9, depthWrite: false,
    map: canvasTex(512, 8, c => { for (let x = 0; x < 512; x++) { c.fillStyle = '#' + tempColor(Math.exp(lerp(lo, hi, x / 511))).getHexString(); c.fillRect(x, 0, 1, 8); } }),
  }));
  bar.rotation.x = Math.PI / 2; bar.position.set(0, 0, -2.4);
  ctx.root.add(bar);
  const xOf = (T: number) => -10 + (20 * (Math.log(T) - lo)) / (hi - lo);
  ctx.label(new THREE.Vector3(-10, 0, -3), ['← cooler, redder', '← 温度低，偏红'], { c: '#ff8a6b' });
  ctx.label(new THREE.Vector3(10, 0, -3), ['hotter, bluer →', '温度高，偏蓝 →'], { c: '#a5d8ff' });
  // the probe: one big star whose temperature follows the clock
  const probe = new StarBall(5800, 1.25, grain);
  probe.position.set(0, 0, 3.3);
  const tick = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 3), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  tick.rotation.x = -Math.PI / 2;
  const plab = ctx.label(new THREE.Vector3(0, 0, 5), '', { big: true });
  ctx.root.add(probe, tick);
  let has = false;
  ctx.view([0, -1, 0.1], 21, [0, 0, 0.7], true);
  return {
    update(v: number, _dt: number, el: number) {
      has = v > 0;
      probe.visible = tick.visible = plab.on = has;
      balls.forEach((b, i) => b.set(row[i][0], row[i][2], 1, el * 0.003));
      if (has) {
        probe.set(v, 1.25, 1, el * 0.003);
        tick.position.set(xOf(clamp(v, 2800, 32000)), 0, -2.0);
        plab.el.style.setProperty('--c', '#' + tempColor(v).getHexString());
        plab.set([fmtK(v, false), fmtK(v, true)]);
      }
    },
    readout(v: number): Pair | string {
      if (v <= 0) return '';
      const nm = 2.898e6 / v;
      const band: Pair = nm < 400 ? ['ultraviolet', '紫外'] : nm < 490 ? ['blue', '蓝光'] : nm < 570 ? ['green', '绿光'] : nm < 620 ? ['yellow–orange', '黄橙光'] : nm < 750 ? ['red', '红光'] : ['infrared', '红外'];
      return [`brightest at ${Math.round(nm)} nm (${band[0]})`, `辐射最强的波长约 ${Math.round(nm)} nm（${band[1]}）`];
    },
    dispose() { grain.dispose(); },
  };
}

// ------------------------------------------------------------------------------------------------ inverse-square law

function bright(ctx: KitCtx) {
  const root = ctx.root, D = 3.2, s0 = 0.9;
  const sun = star(0.35, '#fff1d6', 5);
  root.add(sun);
  ctx.label(sun, ['Star', '恒星'], { c: '#ffd24a', dy: -26 });
  const far = 3 * D, hs = (3 * s0) / 2;
  // rays from the star to the corners of the farthest square
  for (const [y, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) root.add(line([[0, 0, 0], [far, y * hs, z * hs]], '#ffe8a3', { opacity: 0.4 }));
  const grids: THREE.Group[] = [];
  const texts: Pair[] = [['1 square: full brightness', '1 格：亮度为 1'], ['4 squares: ¼ as bright', '4 格：亮度为 1/4'], ['9 squares: ⅑ as bright', '9 格：亮度为 1/9']];
  for (let k = 1; k <= 3; k++) {
    const g = new THREE.Group(), h = (k * s0) / 2, x = k * D;
    for (let i = 0; i <= k; i++) {
      const u = -h + i * s0;
      g.add(line([[x, u, -h], [x, u, h]], '#a5d8ff', { opacity: 0.75 }), line([[x, -h, u], [x, h, u]], '#a5d8ff', { opacity: 0.75 }));
    }
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(k * s0, k * s0), new THREE.MeshBasicMaterial({ color: '#ffe8a3', transparent: true, opacity: 0.32 / (k * k), side: THREE.DoubleSide, depthWrite: false }));
    fill.position.set(x, 0, 0); fill.rotation.y = Math.PI / 2;
    g.add(fill);
    root.add(g); grids.push(g);
    ctx.label(new THREE.Vector3(x, 0, -h - 0.45), texts[k - 1], { c: '#a5d8ff', t: 0.4 + k * 0.5 });
    ctx.label(new THREE.Vector3(x, 0, h + 0.45), k === 1 ? ['d', 'd'] : [`${k}d`, `${k}d`], { c: '#ced4da', t: 0.4 + k * 0.5 });
  }
  // the detector: one square's worth of area; the light it catches falls as 1/d²
  const det = new THREE.Mesh(new THREE.PlaneGeometry(s0, s0), new THREE.MeshBasicMaterial({ color: '#ffd24a', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
  det.rotation.y = Math.PI / 2;
  const edge = line([[0, -s0 / 2, -s0 / 2], [0, s0 / 2, -s0 / 2], [0, s0 / 2, s0 / 2], [0, -s0 / 2, s0 / 2], [0, -s0 / 2, -s0 / 2]], '#ffffff', { opacity: 0.9 });
  const detG = new THREE.Group(); detG.add(det, edge);
  root.add(detG);
  ctx.view([0.55, -1, 0.5], 17, [5, 0, 0], true);
  return {
    update(v: number, _dt: number, el: number) {
      grids.forEach((g, i) => { g.visible = ramp(el, 0.4 + (i + 1) * 0.5, 0.4) > 0.02; });
      const d = clamp(v || 1, 1, 3);
      detG.visible = v > 0;
      detG.position.set(d * D + 0.02, 0, 0);
      det.material.opacity = 0.9 / (d * d);
    },
    readout(v: number): Pair | string {
      if (!v) return '';
      const b = 1 / (v * v);
      return [`distance ${v.toFixed(1)}× → brightness ${b.toFixed(2)}× (1/d²)`, `距离 ${v.toFixed(1)} 倍 → 亮度 ${b.toFixed(2)} 倍（1/d²）`];
    },
  };
}

// ------------------------------------------------------------------------------------------------ parallax

function parallax(ctx: KitCtx) {
  const root = ctx.root, A = 3, YS = 13, YW = 34;
  root.add(sunLight([0, 0, 0], 2.8, 0.15));
  const sun = star(0.6, '#ffd27a', 4);
  const earth = body('earth', 0.32, '#4a7fc1');
  root.add(sun, earth, line(circlePts(A, 160), '#4dabf7', { opacity: 0.45 }));
  // the background: far-away stars on a distant "wall"
  const R = rng(17), n = ctx.low ? 260 : 500, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos.set([(R() - 0.5) * 44, YW + R() * 4, (R() - 0.5) * 18], i * 3);
    const c = tempColor(3500 + R() * 12000), b = 0.35 + 0.65 * R() ** 2;
    col.set([c.r * b, c.g * b, c.b * b], i * 3); sz[i] = 0.25 + R() * 0.35;
  }
  const tex = dotTex();
  const wall = sizedPoints(pos, col, sz, tex);
  root.add(wall);
  const near = new StarBall(3100, 0.3, grainTex(), 24);
  near.set(3100, 0.3, 1.4);
  near.position.set(0, YS, 0);
  root.add(near);
  ctx.pickable(near.mesh, 'star');
  // where the near star appears against the far ones, now and at the two ends of the year
  const ghost = glow('#ff9a7a', 1.3, 0.95);
  const ends = [-1, 1].map(s => { const g = glow('#ff9a7a', 0.9, 0.45); g.position.set(-s * A * (YW - YS) / YS, YW, 0); return g; });
  root.add(ghost, ...ends);
  const sight = line([[0, 0, 0], [0, YW, 0]], '#ffa94d', { opacity: 0.75 });
  root.add(sight);
  // the parallax angle p at the star: between the lines to the Sun and to Earth at one end of its orbit
  root.add(line([[0, 0, 0], [0, YS, 0]], '#ced4da', { opacity: 0.4, dashed: true, dash: 0.4 }));
  root.add(line([[A, 0, 0], [0, YS, 0]], '#ffd24a', { opacity: 0.6 }), line([[-A, 0, 0], [0, YS, 0]], '#ffd24a', { opacity: 0.35, dashed: true, dash: 0.4 }));
  root.add(line([[0, 0, 0], [A, 0, 0]], '#ffd24a', { opacity: 0.8 }));
  const arc: THREE.Vector3[] = [];
  const a1 = Math.atan2(-YS, A), a0 = -Math.PI / 2;
  for (let i = 0; i <= 16; i++) { const a = lerp(a0, a1, i / 16); arc.push(new THREE.Vector3(Math.cos(a) * 3.2, YS + Math.sin(a) * 3.2, 0)); }
  root.add(line(arc, '#ffd24a', { opacity: 0.95 }));
  ctx.label(new THREE.Vector3(0.75, YS - 3.6, 0), 'p', { c: '#ffd24a', big: true });
  ctx.label(new THREE.Vector3(A / 2, 0, -0.5), ['1 AU', '1 天文单位'], { c: '#ffd24a' });
  ctx.label(new THREE.Vector3(-0.3, YS / 2, 0), 'd', { c: '#ced4da', big: true, dx: -10 });
  ctx.label(sun, ['Sun', '太阳'], { c: '#ffd24a', dy: 22 });
  ctx.label(earth, ['Earth', '地球'], { c: '#74c0fc', dy: -18 });
  ctx.label(near, ['Nearby star', '近处的恒星'], { c: '#ff9a7a', dx: 70 });
  ctx.label(new THREE.Vector3(0, YW + 2, 9.5), ['Distant stars (they hardly move)', '遥远的恒星（几乎不动）'], { c: '#ced4da' });
  ctx.label(new THREE.Vector3(0, YS, -4), ['d (parsecs) = 1 / p (arcseconds)', 'd（秒差距）= 1 / p（角秒）'], { c: '#ffd24a', big: true, t: 1 });
  const ep = new THREE.Vector3(), sp = new THREE.Vector3();
  ctx.view([-0.45, -1, 1.25], 46, [0, 15, 0], true);
  return {
    update(v: number, _dt: number, el: number) {
      pointScale(ctx, wall);
      const a = (v / 365.25) * Math.PI * 2;
      ep.set(A * Math.cos(a), A * Math.sin(a), 0);
      earth.position.copy(ep); earth.rotation.y = el * 0.5;
      const t = (YW - ep.y) / (YS - ep.y);
      sp.set(ep.x + (0 - ep.x) * t, YW, 0);
      ghost.position.copy(sp);
      setLine(sight, [ep, sp]);
      near.set(3100, 0.3, 1.4, el * 0.004);
    },
    dispose() { tex.dispose(); },
  };
}

// ------------------------------------------------------------------------------------------------ the HR diagram

/** x from temperature (hot on the left), z from luminosity (Sun = 1). */
const TX = (T: number) => -10 + (20 * (Math.log10(40000) - Math.log10(clamp(T, 2400, 40000)))) / (Math.log10(40000) - Math.log10(2400));
const LZ = (L: number) => -6 + (12 * (Math.log10(clamp(L, 1e-4, 1e6)) + 4)) / 10;
/** The Sun's evolution: [age (Gyr), T (K), L (Sun = 1)]. */
const SUN_TRACK: [number, number, number][] = [
  [0, 5600, 0.7], [4.6, 5772, 1], [9, 5900, 1.8], [10.3, 5000, 2.4], [11.2, 4600, 12], [11.9, 3800, 300], [12.15, 3100, 2700],
  [12.17, 4700, 45], [12.25, 4500, 60], [12.32, 3000, 4000], [12.34, 12000, 4500], [12.37, 40000, 3500], [12.45, 40000, 80],
  [12.7, 25000, 0.06], [13, 12000, 0.003],
];
const trackAt = (age: number): [number, number] => {
  const k = SUN_TRACK.findIndex(p => p[0] > age);
  if (k <= 0) { const p = SUN_TRACK[k < 0 ? SUN_TRACK.length - 1 : 0]; return [p[1], p[2]]; }
  const a = SUN_TRACK[k - 1], b = SUN_TRACK[k], f = (age - a[0]) / (b[0] - a[0]);
  return [Math.exp(lerp(Math.log(a[1]), Math.log(b[1]), f)), Math.exp(lerp(Math.log(a[2]), Math.log(b[2]), f))];
};
const sunStage = (age: number): Pair =>
  age < 0.05 ? ['newborn', '刚诞生'] : age < 10.3 ? ['main sequence', '主序星阶段'] : age < 11.3 ? ['subgiant', '亚巨星'] : age < 12.16 ? ['red giant', '红巨星'] :
  age < 12.26 ? ['helium burning', '氦燃烧阶段'] : age < 12.33 ? ['red giant again (AGB)', '再次成为红巨星（渐近巨星支）'] : age < 12.46 ? ['planetary nebula', '行星状星云'] : ['white dwarf, cooling', '白矮星，逐渐冷却'];

function hr(ctx: KitCtx, o: Opts) {
  const root = ctx.root, R = rng(29), tex = dotTex(), grain = grainTex();
  const stars: [T: number, L: number, s: number][] = [];
  const g = () => (R() + R() + R() - 1.5) / 1.5;
  for (let i = 0; i < 92; i++) {
    const M = Math.exp(lerp(Math.log(0.12), Math.log(40), R() ** 1.35));
    const T = 5772 * (M < 1 ? M ** 0.35 : M ** 0.6) * 10 ** (g() * 0.02);
    const L = (M < 0.43 ? 0.23 * M ** 2.3 : M ** 3.5) * 10 ** (g() * 0.18);
    stars.push([T, L, 0.24 + 0.09 * clamp(Math.log10(L) + 2, 0, 6) / 2]);
  }
  for (let i = 0; i < 24; i++) { const u = R(); stars.push([lerp(5200, 3400, u) * 10 ** (g() * 0.02), 10 ** (lerp(1.2, 3.1, u) + g() * 0.25), 0.55 + 0.25 * u]); }
  for (let i = 0; i < 14; i++) stars.push([Math.exp(lerp(Math.log(3300), Math.log(32000), R())), 10 ** (4.3 + R() * 1.5), 0.85 + R() * 0.25]);
  for (let i = 0; i < 18; i++) { const T = Math.exp(lerp(Math.log(5500), Math.log(32000), R())); stars.push([T, 0.012 ** 2 * (T / 5772) ** 4 * 10 ** (g() * 0.3), 0.2]); }
  const n = stars.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n);
  stars.forEach(([T, L, s], i) => { pos.set([TX(T), 0, LZ(L)], i * 3); const c = tempColor(T); col.set([c.r, c.g, c.b], i * 3); sz[i] = s; });
  const pts = sizedPoints(pos, col, sz, tex);
  const pts2 = sizedPoints(pos, col.map(x => x * 0.25), sz.map(x => x * 3.2), tex);
  root.add(pts2, pts);
  // axes, grid and ticks
  const X0 = -10.6, Z0 = -6.5;
  root.add(line([[X0, 0, Z0], [10.4, 0, Z0]], '#ced4da', { opacity: 0.7 }), line([[X0, 0, Z0], [X0, 0, 6.4]], '#ced4da', { opacity: 0.7 }));
  for (let e = -4; e <= 6; e += 2) {
    root.add(line([[X0, 0.01, LZ(10 ** e)], [10.4, 0.01, LZ(10 ** e)]], '#ffffff', { opacity: 0.07 }));
    ctx.label(new THREE.Vector3(X0 - 0.2, 0, LZ(10 ** e)), e === 0 ? '1' : `10${sup(e)}`, { c: '#9aa7b4', dx: -16 });
  }
  for (const T of [30000, 10000, 6000, 3000]) {
    root.add(line([[TX(T), 0.01, Z0], [TX(T), 0.01, 6.4]], '#ffffff', { opacity: 0.07 }));
    const l = ctx.label(new THREE.Vector3(TX(T), 0, Z0), '', { c: '#9aa7b4', dy: 14 });
    l.set([fmtK(T, false), fmtK(T, true)]);
  }
  ctx.label(new THREE.Vector3(0, 0, Z0 - 1.25), ['Surface temperature (hotter ←)', '表面温度（← 越热）'], { c: '#ced4da' });
  ctx.label(new THREE.Vector3(X0 - 1.6, 0, 7.0), ['Luminosity (Sun = 1)', '光度（太阳 = 1）'], { c: '#ced4da' });
  // regions
  const region = (x: number, z: number, w: number, h: number, tag: string, text: Pair, c: string, lx: number, lz: number, t: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = Math.PI / 2; m.position.set(x, -0.02, z);
    root.add(m); ctx.pickable(m, tag);
    ctx.label(new THREE.Vector3(lx, 0, lz), text, { c, t });
  };
  region(TX(9000), LZ(30), 3, 3, 'ms', ['Main sequence', '主序星'], '#ffd24a', TX(14000) - 1.3, LZ(60), 0.6);
  region(TX(4300), LZ(300), 3.5, 3, 'giants', ['Red giants', '红巨星'], '#ff8a6b', TX(4300), LZ(3000), 0.9);
  region(TX(9000), LZ(1e5), 12, 2.5, 'super', ['Supergiants', '超巨星'], '#ffa8a8', TX(9000), LZ(1e6) + 0.2, 1.2);
  region(TX(14000), LZ(1e-3), 5, 3, 'wd', ['White dwarfs', '白矮星'], '#e7f5ff', TX(14000), LZ(1e-3) - 1.5, 1.5);
  // the Sun (or, with a track, the Sun moving along it)
  const sun = new StarBall(5772, 0.32, grain, 32);
  sun.set(5772, 0.32, 1.2);
  sun.position.set(TX(5772), -0.05, LZ(1));
  const ringM = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.58, 48), new THREE.MeshBasicMaterial({ color: '#ffd24a', side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
  ringM.rotation.x = Math.PI / 2;
  sun.add(ringM);
  root.add(sun);
  ctx.pickable(sun.mesh, 'sun');
  const sl = ctx.label(sun, ['Sun', '太阳'], { c: '#ffd24a', dx: 34 });
  if (o.named) {
    const named: [T: number, L: number, n: Pair][] = [[3600, 1.2e5, ['Betelgeuse', '参宿四']], [12100, 1.2e5, ['Rigel', '参宿七']], [9940, 25, ['Sirius A', '天狼星 A']], [25000, 0.056, ['Sirius B', '天狼星 B']], [3040, 0.0017, ['Proxima Cen', '比邻星']]];
    for (const [T, L, nm] of named) ctx.label(new THREE.Vector3(TX(T), 0, LZ(L)), nm, { c: '#ced4da', dot: true, t: 1.8 });
  }
  let trail: THREE.Line | null = null;
  if (o.track) {
    const P = SUN_TRACK.map(([, T, L]) => new THREE.Vector3(TX(T), -0.03, LZ(L)));
    trail = line(P, '#ffd24a', { opacity: 0.5, dashed: true, dash: 0.25 });
    root.add(trail);
  }
  ctx.view([0, -1, 0.04], 25, [-0.4, 0, 0.2], true);
  return {
    update(v: number, _dt: number, el: number) {
      pointScale(ctx, pts, pts2);
      ringM.material.opacity = 0.55 + 0.35 * Math.sin(el * 3);
      if (o.track) {
        const [T, L] = trackAt(v);
        const r = clamp(0.32 * (L ** 0.5 * (5772 / T) ** 2) ** 0.25, 0.12, 1.1);
        sun.set(T, r, 1.2, el * 0.004);
        sun.position.set(TX(T), -0.05, LZ(L));
        ringM.scale.setScalar(Math.max(1, r / 0.4));
      } else sun.set(5772, 0.32, 1.2, el * 0.004);
      sl.on = ease(el / 0.5) > 0.5;
    },
    readout(v: number): Pair | string {
      if (!o.track) return '';
      const [T, L] = trackAt(v), s = sunStage(v);
      const Ls = L >= 10 ? Math.round(L).toLocaleString('en-US') : L >= 0.1 ? L.toFixed(1) : L.toPrecision(1);
      return [`Sun: ${s[0]} · ${fmtK(T, false)} · ${Ls} L☉`, `太阳：${s[1]} · ${fmtK(T, true)} · ${Ls} 倍太阳光度`];
    },
    dispose() { tex.dispose(); grain.dispose(); },
  };
}

// ------------------------------------------------------------------------------------------------ Cepheid variables

/** Light-curve shape of a classical Cepheid: a quick rise (20 % of the cycle) and a slow fall; 0 = faintest, 1 = brightest. */
const cephShape = (ph: number) => { const p = ((ph % 1) + 1) % 1; return p < 0.2 ? 0.5 - 0.5 * Math.cos((Math.PI * p) / 0.2) : 0.5 + 0.5 * Math.cos((Math.PI * (p - 0.2)) / 0.8); };

function cepheid(ctx: KitCtx) {
  const root = ctx.root, grain = grainTex();
  const DAYS = 36, NS = 480, X0 = -4.6, X1 = 10.4, H = 2.1, xOf = (d: number) => X0 + ((X1 - X0) * d) / DAYS;
  // Leavitt's law (V band): M = −2.43 (log P − 1) − 4.05; L/L☉ = 10^(0.4 (4.83 − M))
  const rows: { P: number; z: number; r: number; T: number; tag: string; name: Pair; c: string }[] = [
    { P: 35.56, z: 2.3, r: 1.05, T: 5100, tag: 'long', name: ['ℓ Carinae', '船底座 ℓ'], c: '#ffc078' },
    { P: 5.366, z: -3.1, r: 0.6, T: 5900, tag: 'short', name: ['δ Cephei', '造父一（仙王座 δ）'], c: '#ffe8a3' },
  ];
  const lum = (P: number) => 10 ** (0.4 * (4.83 + 2.43 * (Math.log10(P) - 1) + 4.05));
  const balls: StarBall[] = [], curves: THREE.Line[] = [], heads: THREE.Sprite[] = [];
  for (const rw of rows) {
    const b = new StarBall(rw.T, rw.r, grain, 40);
    b.position.set(-7.6, 0, rw.z);
    root.add(b); balls.push(b);
    ctx.pickable(b.mesh, rw.tag);
    const base = rw.z - H / 2;
    root.add(line([[X0, 0, base], [X1, 0, base]], '#ced4da', { opacity: 0.45 }), line([[X0, 0, base], [X0, 0, base + H]], '#ced4da', { opacity: 0.45 }));
    for (let d = 0; d <= DAYS; d += 5) root.add(line([[xOf(d), 0, base], [xOf(d), 0, base - 0.15]], '#ced4da', { opacity: 0.6 }));
    // one full cycle marked with a bracket
    const yb = base + H + 0.3;
    root.add(line([[xOf(0.2 * rw.P), 0, yb - 0.2], [xOf(0.2 * rw.P), 0, yb], [xOf(Math.min(DAYS, 1.2 * rw.P)), 0, yb], [xOf(Math.min(DAYS, 1.2 * rw.P)), 0, yb - 0.2]], rw.c, { opacity: 0.8 }));
    const Ls = Math.round(lum(rw.P) / 100) * 100;
    const per: Pair = [`period ${rw.P.toFixed(1)} days`, `周期 ${rw.P.toFixed(1)} 天`];
    ctx.label(new THREE.Vector3(xOf(Math.min(DAYS - 3, 0.7 * rw.P)), 0, yb), per, { c: rw.c, dy: -12, t: 1 });
    ctx.label(b, [`${rw.name[0]} · ≈ ${Ls.toLocaleString('en-US')} L☉`, `${rw.name[1]} · 约 ${Ls} 倍太阳光度`], { c: rw.c, dy: rw.r * 60 + 26, t: 0.4 });
    const full: THREE.Vector3[] = [];
    for (let i = 0; i <= NS; i++) { const d = (i / NS) * DAYS; full.push(new THREE.Vector3(xOf(d), 0, base + 0.15 + (H - 0.3) * cephShape(d / rw.P))); }
    const cv = line(full, rw.c, { opacity: 0.95 });
    root.add(cv); curves.push(cv);
    const hd = glow(rw.c, 0.55, 0.95);
    root.add(hd); heads.push(hd);
  }
  for (let d = 0; d <= DAYS; d += 10) ctx.label(new THREE.Vector3(xOf(d), 0, rows[1].z - H / 2), [`${d} d`, `${d} 天`], { c: '#9aa7b4', dy: 16 });
  ctx.label(new THREE.Vector3(X0 - 0.5, 0, rows[0].z), ['brightness', '亮度'], { c: '#9aa7b4', dx: -10 });
  ctx.label(new THREE.Vector3(xOf(DAYS / 2), 0, 5.3), ['Longer period → more luminous (Leavitt’s law, 1912)', '周期越长，光度越大（勒维特定律，1912 年）'], { c: '#ffd24a', big: true, t: 1.6 });
  ctx.view([0, -1, 0.04], 24, [0.6, 0, 0.6], true);
  return {
    update(v: number, _dt: number, el: number) {
      const t = clamp(v, 0, DAYS);
      rows.forEach((rw, k) => {
        const b = cephShape(t / rw.P);
        // hotter and slightly larger near maximum light
        balls[k].set(rw.T + 900 * (b - 0.5), rw.r * (1 + 0.08 * (b - 0.5)), 0.7 + 0.9 * b, el * 0.004);
        drawIn(curves[k], (Math.floor((t / DAYS) * NS) + 1) / (NS + 1));
        heads[k].position.set(xOf(t), 0, rw.z - H / 2 + 0.15 + (H - 0.3) * b);
      });
    },
    readout(v: number): Pair | string {
      const d = Math.floor(clamp(v, 0, DAYS));
      return [`day ${d} · measure the period → know the luminosity → compare with the brightness → distance`, `第 ${d} 天 · 测周期 → 得光度 → 与视亮度比较 → 求距离`];
    },
    dispose() { grain.dispose(); },
  };
}

function sup(e: number): string {
  const m: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  return String(e).split('').map(ch => m[ch] ?? ch).join('');
}

