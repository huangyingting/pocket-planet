/**
 * Kit "galaxy": the Milky Way as a barred spiral of tens of thousands of stars (seen from above, or edge-on to show
 * why it is a band across our sky), the Local Group with Andromeda and the Magellanic Clouds, and a deep field of
 * galaxies. Scene units: 1 = 1 000 light-years (Local Group: 1 = 10 000 ly).
 */
import * as THREE from 'three';
import { Arrow, canvasTex, circlePts, clamp, glow, lerp, line, ramp, rng, starfield, tempColor } from './draw.ts';
import { dotTex, pointScale, sizedPoints } from './k-life.ts';
import type { KitCtx, KitFactory, Pair } from './types.ts';

export interface Opts {
  /**
   * - `top` (default): the Milky Way from above, the Sun 26 000 ly from the centre; a clock in `myr` turns it
   *   (one galactic year ≈ 230 million years). Pickable: `sun`, `centre`.
   * - `side`: edge-on: a thin disc and a bulge; lines of sight from the Sun along and out of the disc
   * - `local`: zooms out from the Milky Way to the Local Group (Andromeda 2.5 million ly away). Pickable: `andromeda`, `lmc`, `mw`.
   * - `universe`: a deep field of galaxies
   */
  mode?: 'top' | 'side' | 'local' | 'universe';
  /** top: name the main spiral arms */
  arms?: boolean;
  /** top: frame the Sun's neighbourhood with a 10 000 ly bar (light years at galaxy scale) */
  near?: boolean;
}

type P = THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
const SUN_R = 26;
const PITCH_K = 1 / Math.tan((12.5 * Math.PI) / 180);
const armAngle = (th0: number, r: number) => th0 + PITCH_K * Math.log(r / 12);
/** Arms: start angle at r = 12 (the bar ends), weight, name. Sun lies between Sagittarius (inside) and Perseus (outside). */
const ARMS: [th0: number, w: number, name: Pair][] = [
  [0, 1, ['Scutum–Centaurus Arm', '盾牌—半人马臂']],
  [Math.PI, 1, ['Perseus Arm', '英仙臂']],
  [Math.PI / 2, 0.45, ['Norma Arm', '矩尺臂']],
  [(3 * Math.PI) / 2, 0.45, ['Sagittarius Arm', '人马臂']],
];
/** The Sun's angle in the disc: on the Perseus arm's inner side, about 4 000 ly inside it. */
const SUN_TH = armAngle(Math.PI, 31);

interface GalOpts { n: number; seed: number; R: number; bar: boolean; arms: [number, number][]; spur?: boolean; thick?: number; bulge?: number; scale?: number; size?: number }

/** A spiral galaxy as point clouds: stars (additive), star-forming knots, and dust (darkening) lanes. */
function spiral(o: GalOpts, tex: THREE.Texture): { g: THREE.Group; pts: P[] } {
  const r = rng(o.seed), s = o.scale ?? 1, sz = o.size ?? 1, R = o.R, th = o.thick ?? 0.35;
  const gauss = () => { let x = 0; for (let k = 0; k < 4; k++) x += r(); return (x - 2) / 0.58; };
  const n = o.n, nd = Math.round(n * 0.16), nk = Math.round(n * 0.025);
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), siz = new Float32Array(n);
  const dpos = new Float32Array(nd * 3), dcol = new Float32Array(nd * 3), dsiz = new Float32Array(nd);
  const kpos = new Float32Array(nk * 3), kcol = new Float32Array(nk * 3), ksiz = new Float32Array(nk);
  const wsum = o.arms.reduce((a, b) => a + b[1], 0);
  const pickArm = () => { let u = r() * wsum; for (const a of o.arms) { if ((u -= a[1]) <= 0) return a[0]; } return o.arms[0][0]; };
  const c = new THREE.Color();
  const put = (arr: Float32Array, i: number, x: number, y: number, z: number) => { arr[i * 3] = x * s; arr[i * 3 + 1] = y * s; arr[i * 3 + 2] = z * s; };
  const armPoint = (spread: number, rmin: number, inner = 0): [number, number, number] => {
    const rad = rmin + (R - rmin) * (r() ** 1.15);
    const a = armAngle(pickArm(), rad) + inner / rad;
    const w = spread * (0.6 + rad / R);
    return [rad * Math.cos(a) + gauss() * w, rad * Math.sin(a) + gauss() * w, rad];
  };
  const bulge = o.bulge ?? 1;
  for (let i = 0; i < n; i++) {
    const u = r();
    let x: number, y: number, z: number, T: number, b: number;
    if (u < 0.14 * bulge) { // bulge
      x = gauss() * 4; y = gauss() * 4; z = gauss() * 2.6;
      T = 3800 + r() * 1400; b = 0.16 + 0.12 * r(); siz[i] = 0.5;
    } else if (u < 0.22 * bulge && o.bar) { // bar
      const L = (r() * 2 - 1) * 13 * (r() ** 0.5);
      x = L + gauss() * 1.2; y = gauss() * 2.2; z = gauss() * 1.2;
      T = 4000 + r() * 1500; b = 0.16 + 0.12 * r(); siz[i] = 0.5;
    } else if (u < 0.5) { // smooth disc, exponential
      const rad = Math.min(R * 1.05, -Math.log(1 - r() * 0.985) * R * 0.3 + 2), a = r() * Math.PI * 2;
      x = rad * Math.cos(a); y = rad * Math.sin(a); z = gauss() * th * (1 + rad / R);
      T = 4200 + r() * 3000; b = 0.1 + 0.12 * r(); siz[i] = 0.45;
    } else { // arms: young, blue-white
      const [ax, ay, rad] = armPoint(1.1, 10);
      x = ax; y = ay; z = gauss() * th * 0.7;
      T = 6000 + r() ** 2 * 18000; b = (0.14 + 0.2 * r()) * (1 - 0.35 * rad / R); siz[i] = 0.45 + r() * 0.25;
    }
    c.copy(tempColor(T));
    put(pos, i, x, y, z); col.set([c.r * b, c.g * b, c.b * b], i * 3); siz[i] *= sz * s;
  }
  if (o.spur) for (let i = Math.round(n * 0.97); i < n; i++) { // the Orion spur, through the Sun
    const rad = lerp(SUN_R - 5, SUN_R + 6, r()), a = SUN_TH - 0.08 + PITCH_K * Math.log(rad / SUN_R) * 0.7;
    put(pos, i, rad * Math.cos(a) + gauss() * 0.8, rad * Math.sin(a) + gauss() * 0.8, gauss() * th * 0.6);
    c.copy(tempColor(7000 + r() * 12000)); const b = 0.18 + 0.12 * r(); col.set([c.r * b, c.g * b, c.b * b], i * 3);
  }
  for (let i = 0; i < nk; i++) { // pink star-forming nebulae along the arms
    const [ax, ay] = armPoint(0.8, 12);
    put(kpos, i, ax, ay, gauss() * th * 0.4);
    const b = 0.35 + 0.3 * r(); kcol.set([1 * b, 0.32 * b, 0.48 * b], i * 3); ksiz[i] = (0.9 + r() * 1.1) * sz * s;
  }
  for (let i = 0; i < nd; i++) { // dust lanes on the inner edge of the arms, and in the inner disc
    if (r() < 0.8) { const [ax, ay] = armPoint(0.7, 9, -2.2); put(dpos, i, ax, ay, gauss() * th * 0.35); }
    else { const rad = 5 + r() * 12, a = r() * Math.PI * 2; put(dpos, i, rad * Math.cos(a), rad * Math.sin(a), gauss() * 0.25); }
    dcol.set([0.035, 0.025, 0.02], i * 3); dsiz[i] = (1.2 + r() * 1.2) * sz * s;
  }
  const g = new THREE.Group();
  const stars = sizedPoints(pos, col, siz, tex), knots = sizedPoints(kpos, kcol, ksiz, tex), dust = sizedPoints(dpos, dcol, dsiz, tex, { additive: false, opacity: 0.42 });
  dust.renderOrder = 2; knots.renderOrder = 1;
  g.add(stars, knots, dust);
  const core = glow('#ffe2b0', 22 * s, 0.55);
  g.add(core);
  return { g, pts: [stars, knots, dust] };
}

/** A faint glow over the disc, in its plane (fills the gaps between points). */
function discHaze(R: number, color: string, opacity: number): THREE.Mesh {
  const t = canvasTex(256, 256, c => {
    const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,235,200,1)'); g.addColorStop(0.18, 'rgba(255,225,190,.5)'); g.addColorStop(0.55, 'rgba(170,190,255,.18)'); g.addColorStop(1, 'rgba(150,170,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 256, 256);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(R * 2.2, R * 2.2), new THREE.MeshBasicMaterial({ map: t, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
}

/** A scale bar with end ticks. */
function scaleBar(a: THREE.Vector3, b: THREE.Vector3, tick: number, color = '#ced4da'): THREE.Group {
  const g = new THREE.Group(), up = new THREE.Vector3(0, 0, tick);
  g.add(line([a, b], color, { opacity: 0.85 }), line([a.clone().sub(up), a.clone().add(up)], color, { opacity: 0.85 }), line([b.clone().sub(up), b.clone().add(up)], color, { opacity: 0.85 }));
  return g;
}

const kit: KitFactory<Opts> = (ctx, o) => {
  const tex = dotTex();
  ctx.root.add(starfield(ctx.low ? 1500 : 3000, 9000, 7, 1.3));
  const run = o.mode === 'local' ? local(ctx, tex) : o.mode === 'universe' ? universe(ctx) : milkyWay(ctx, o, tex);
  return { ...run, dispose() { tex.dispose(); } };
};
export default kit;

function milkyWay(ctx: KitCtx, o: Opts, tex: THREE.Texture) {
  const side = o.mode === 'side';
  const { g, pts } = spiral({ n: ctx.low ? 22000 : 52000, seed: 3, R: 52, bar: true, arms: ARMS.map(a => [a[0], a[1]]), spur: true }, tex);
  const gal = new THREE.Group();
  gal.add(g, discHaze(52, '#ffffff', side ? 0.12 : 0.22));
  // turn the disc so the Sun starts on the -x side (left of the centre in every view)
  const base = Math.PI - SUN_TH;
  ctx.root.add(gal);
  const sunPos = new THREE.Vector3(SUN_R * Math.cos(SUN_TH), SUN_R * Math.sin(SUN_TH), 0);
  const sun = glow('#ffe066', 3.2, 1);
  const sunDot = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 8), new THREE.MeshBasicMaterial({ color: '#fff3bf', depthTest: false }));
  sunDot.renderOrder = 5; sun.renderOrder = 5;
  (sun.material as THREE.SpriteMaterial).depthTest = false;
  sunDot.position.copy(sunPos); sun.position.copy(sunPos);
  gal.add(sun, sunDot);
  ctx.pickable(sunDot, 'sun');
  const centre = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  gal.add(centre);
  ctx.pickable(centre, 'centre');
  const sunL = ctx.label(sunDot, ['Sun (you are here)', '太阳（我们在这里）'], { c: '#ffd24a', dot: true, big: true, t: 0.8 });
  sunL.on = true;
  if (side) {
    ctx.label(new THREE.Vector3(0, 0, 9), ['Bulge', '核球'], { c: '#ffe8a3', t: 0.6 });
    ctx.label(new THREE.Vector3(40, 0, -3.5), ['Disc: ~1 000 ly thick', '银盘：厚约 1000 光年'], { c: '#a5d8ff', t: 1 });
    const al = new Arrow('#3bc9db', 0.22), ar = new Arrow('#3bc9db', 0.22), au = new Arrow('#ff922b', 0.22);
    const sp = new THREE.Vector3(-SUN_R, 0, 0);
    al.set([sp.x - 1.5, -1, 0.0], [-17, 0, 0]); ar.set([sp.x + 1.5, -1, 0.0], [17, 0, 0]); au.set([sp.x, -1, 1.5], [0, 0, 13]);
    ctx.root.add(al, ar, au);
    ctx.label(new THREE.Vector3(sp.x - 10, -1, -3.2), ['Along the disc: countless stars → the Milky Way band', '沿着银盘看：恒星密密麻麻 → 天上的银河'], { c: '#3bc9db', t: 1.6 });
    ctx.label(new THREE.Vector3(sp.x, -1, 16), ['Out of the disc: few stars, dark sky', '朝银盘外看：恒星稀少'], { c: '#ff922b', t: 2.2 });
    for (const a of [al, ar, au]) a.visible = false;
    ctx.view([0, -1, 0.05], 118, [-6, 0, 2], true);
    return {
      update(_v: number, _dt: number, el: number) {
        pointScale(ctx, ...pts);
        gal.rotation.z = base;
        al.visible = ar.visible = el > 1.4; au.visible = el > 2;
        al.opacity = ar.opacity = ramp(el, 1.4, 0.5); au.opacity = ramp(el, 2, 0.5);
      },
    };
  }
  // top view
  const orbit = line(circlePts(SUN_R, 180), '#ffd24a', { opacity: 0.22, dashed: true, dash: 1.2 });
  const radius = line([[0, 0, 0], sunPos], '#ffd24a', { opacity: 0.55, dashed: true, dash: 0.8 });
  gal.add(radius);
  ctx.root.add(orbit);
  const mid = new THREE.Object3D(); mid.position.copy(sunPos).multiplyScalar(0.5); gal.add(mid);
  ctx.label(centre, ['Galactic centre', '银河系中心'], { c: '#ffe8a3', dy: -26, t: 0.4 });
  ctx.label(mid, ['26 000 ly', '2.6 万光年'], { c: '#ffd24a', t: 1.2, dy: 14 });
  const bar = scaleBar(new THREE.Vector3(-50, -60, 0), new THREE.Vector3(50, -60, 0), 2);
  ctx.root.add(bar);
  ctx.label(new THREE.Vector3(0, -60, -3), ['100 000 light-years', '10 万光年'], { c: '#ced4da', t: 0.3 });
  const orion = new THREE.Object3D();
  orion.position.set((SUN_R + 4) * Math.cos(SUN_TH - 0.13), (SUN_R + 4) * Math.sin(SUN_TH - 0.13), 0);
  gal.add(orion);
  ctx.label(orion, ['Orion Arm', '猎户臂'], { c: '#a5d8ff', t: 1.6, dy: 10 });
  if (o.arms) for (const [th0, , nm] of ARMS) {
    if (nm[0].startsWith('Norma')) continue;
    const rad = th0 === Math.PI ? 41 : 44, a = armAngle(th0, rad), m = new THREE.Object3D();
    m.position.set(rad * Math.cos(a), rad * Math.sin(a), 0); gal.add(m);
    ctx.label(m, nm, { c: '#8fb3d9', t: 2 });
  }
  if (o.near) {
    const nb = scaleBar(new THREE.Vector3(-SUN_R, -4, 0), new THREE.Vector3(-SUN_R + 10, -4, 0), 0.6, '#ffd24a');
    ctx.root.add(nb);
    ctx.label(new THREE.Vector3(-SUN_R + 5, -4, 0), ['10 000 ly', '1 万光年'], { c: '#ffd24a', dy: 16 });
    ctx.view([0, -0.5, 1], 58, [-22, 0, 0], true);
  } else ctx.view([0, -0.55, 1], 150, [0, -4, 0], true);
  return {
    update(v: number, _dt: number, _el: number) {
      pointScale(ctx, ...pts);
      // the Milky Way turns clockwise seen from the north galactic pole (+z); one turn of the Sun ≈ 230 Myr
      gal.rotation.z = base - (v / 230) * Math.PI * 2;
    },
    readout(v: number): Pair | string {
      if (!v) return '';
      const f = v / 230;
      return [`the Sun has gone ${f.toFixed(2)} of the way round`, `太阳绕银河系中心转了 ${f.toFixed(2)} 圈`];
    },
  };
}

/** Milky Way → Local Group. 1 unit = 10 000 ly. */
function local(ctx: KitCtx, tex: THREE.Texture) {
  const root = ctx.root, low = ctx.low;
  const mw = spiral({ n: low ? 9000 : 22000, seed: 3, R: 52, bar: true, arms: ARMS.map(a => [a[0], a[1]]), scale: 0.1, size: 3.2 }, tex);
  mw.g.rotation.z = Math.PI - SUN_TH;
  const m31 = spiral({ n: low ? 9000 : 22000, seed: 8, R: 105, bar: false, arms: [[0.3, 1], [Math.PI + 0.3, 1]], scale: 0.1, size: 4.5, thick: 0.6, bulge: 1.6 }, tex);
  const M31 = new THREE.Vector3(250, 0, 0);
  m31.g.position.copy(M31); m31.g.rotation.set(1.35, 0.25, 0.6);
  const m33 = spiral({ n: low ? 2500 : 6000, seed: 15, R: 30, bar: false, arms: [[0, 1], [Math.PI, 1]], scale: 0.1, size: 3, bulge: 0.4 }, tex);
  m33.g.position.set(258, 72, -25); m33.g.rotation.set(0.9, 0.3, 0);
  root.add(mw.g, m31.g, m33.g);
  // the Magellanic Clouds: irregular swarms below the Milky Way's disc
  const cloud = (n: number, at: THREE.Vector3, sig: number, seed: number) => {
    const r = rng(seed), pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n);
    const gs = () => (r() + r() + r() - 1.5) / 1.5;
    for (let i = 0; i < n; i++) {
      pos.set([at.x + gs() * sig * 1.4, at.y + gs() * sig, at.z + gs() * sig * 0.8], i * 3);
      const c = tempColor(5000 + r() * 12000), b = 0.25 + 0.3 * r(); col.set([c.r * b, c.g * b, c.b * b], i * 3); sz[i] = 0.3 + r() * 0.2;
    }
    return sizedPoints(pos, col, sz, tex);
  };
  const LMC = new THREE.Vector3(3, -6, -15), SMC = new THREE.Vector3(6, -2, -19);
  const lmc = cloud(low ? 600 : 1400, LMC, 0.9, 31), smc = cloud(low ? 300 : 700, SMC, 0.55, 37);
  root.add(lmc, smc);
  const pick = (at: THREE.Vector3, r: number, tag: string) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    m.position.copy(at); root.add(m); ctx.pickable(m, tag); return m;
  };
  pick(new THREE.Vector3(), 5, 'mw'); pick(M31, 9, 'andromeda'); pick(LMC, 1.5, 'lmc');
  const span = line([[0, 0, 0], M31], '#ffd24a', { opacity: 0.4, dashed: true, dash: 3 });
  root.add(span);
  const L = [
    ctx.label(new THREE.Vector3(0, 0, 6), ['Milky Way', '银河系'], { c: '#ffe8a3', big: true }),
    ctx.label(new THREE.Vector3(4.5, -4, -17), ['Magellanic Clouds', '大、小麦哲伦云'], { c: '#a5d8ff', dx: 70 }),
  ];
  const wide = [
    ctx.label(M31.clone().add(new THREE.Vector3(0, 0, 14)), ['Andromeda Galaxy (M31)', '仙女星系（M31）'], { c: '#ffe8a3', big: true }),
    ctx.label(new THREE.Vector3(258, 72, -16), ['Triangulum (M33)', '三角座星系（M33）'], { c: '#ced4da' }),
    ctx.label(new THREE.Vector3(125, 0, 0), ['2.5 million light-years', '250 万光年'], { c: '#ffd24a', dy: -14 }),
  ];
  const bar = scaleBar(new THREE.Vector3(75, 0, -45), new THREE.Vector3(175, 0, -45), 2.5);
  root.add(bar);
  wide.push(ctx.label(new THREE.Vector3(125, 0, -49), ['1 million ly', '100 万光年'], { c: '#ced4da' }));
  const wl = ctx.label(new THREE.Vector3(0, 0, -9), ['100 000 ly across', '直径约 10 万光年'], { c: '#ced4da' });
  ctx.view([0.15, -1, 0.45], 62, [0, 0, -4], true);
  let zoomed = false;
  const tgt = new THREE.Vector3();
  return {
    update(_v: number, _dt: number, el: number) {
      pointScale(ctx, ...mw.pts, ...m31.pts, ...m33.pts, lmc, smc);
      const z = ramp(el, 3, 3.2);
      if (!zoomed && el > 3) { zoomed = true; ctx.view([0.15, -1, 0.42], 330, [125, 0, -8]); }
      if (zoomed && z < 1) { tgt.set(lerp(0, 125, z), 0, lerp(-4, -8, z)); ctx.orbit.target.copy(tgt); }
      for (const l of wide) l.on = z > 0.8;
      L[1].on = z < 0.4; wl.on = z < 0.4;
      span.visible = bar.visible = z > 0.6;
      mw.g.rotation.z = Math.PI - SUN_TH - el * 0.01;
    },
  };
}

/** A deep field: hundreds of galaxies of every shape, in every direction. */
function universe(ctx: KitCtx) {
  const root = ctx.root, r = rng(41), W = ctx.low ? 128 : 256;
  const paint = (kind: number, seed: number) => canvasTex(W, W, c => {
    const R = rng(seed), h = W / 2;
    const g = c.createRadialGradient(h, h, 0, h, h, h);
    if (kind === 0) { // elliptical
      g.addColorStop(0, 'rgba(255,240,215,1)'); g.addColorStop(0.2, 'rgba(255,215,170,.55)'); g.addColorStop(1, 'rgba(255,200,150,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, W); return;
    }
    g.addColorStop(0, 'rgba(255,240,210,1)'); g.addColorStop(0.12, 'rgba(255,225,190,.6)'); g.addColorStop(0.5, 'rgba(160,190,255,.12)'); g.addColorStop(1, 'rgba(150,180,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, W);
    const arms = kind === 2 ? 3 : 2, pk = 1 / Math.tan((14 + R() * 10) * Math.PI / 180);
    for (let i = 0; i < W * 14; i++) {
      const rad = (0.08 + 0.85 * R() ** 0.8) * h, a = (Math.floor(R() * arms) * Math.PI * 2) / arms + pk * Math.log(rad / (0.08 * h)) * 0.5 + (R() - 0.5) * 0.5;
      const x = h + rad * Math.cos(a), y = h + rad * Math.sin(a), b = 0.5 * (1 - rad / h);
      c.fillStyle = R() < 0.1 ? `rgba(255,140,190,${b})` : `rgba(190,210,255,${b})`;
      c.fillRect(x, y, 1.5, 1.5);
    }
  });
  const texs = [paint(0, 1), paint(1, 2), paint(2, 3), paint(1, 4)];
  const mats = texs.map(t => new THREE.MeshBasicMaterial({ map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  const geo = new THREE.PlaneGeometry(1, 1);
  const n = ctx.low ? 260 : 520, field = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, mats[Math.floor(r() * mats.length)].clone());
    const z = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - z * z), d = 40 + r() ** 0.6 * 360;
    m.position.set(d * s * Math.cos(a), d * s * Math.sin(a), d * z);
    m.rotation.set(r() * Math.PI, r() * Math.PI, r() * Math.PI);
    const k = (2.5 + r() ** 2 * 9) * (m.material.map === texs[0] ? 0.7 : 1);
    m.scale.set(k, k * (m.material.map === texs[0] ? 0.55 + r() * 0.45 : 1), 1);
    const red = clamp(d / 400);
    m.material.color.setRGB(1, lerp(1, 0.75, red), lerp(1, 0.6, red)).multiplyScalar(lerp(1, 0.5, red));
    field.add(m);
  }
  // our galaxy, close by
  const home = new THREE.Mesh(geo, mats[1].clone());
  home.scale.setScalar(14); home.rotation.set(-1.1, 0, 0.4);
  field.add(home);
  root.add(field);
  ctx.pickable(home, 'mw');
  ctx.label(home, ['Milky Way', '银河系'], { c: '#ffe8a3', big: true, dy: -40 });
  ctx.label(new THREE.Vector3(55, -30, 30), ['every smudge is a galaxy', '每个光斑都是一个星系'], { c: '#ced4da', t: 1.5 });
  ctx.view([0.2, -1, 0.3], 60, [0, 0, 0], true);
  return {
    update(_v: number, _dt: number, el: number) {
      field.rotation.z = el * 0.012;
      field.rotation.x = Math.sin(el * 0.05) * 0.05;
    },
  };
}
