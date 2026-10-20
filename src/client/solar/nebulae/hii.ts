/** HII regions and dark nebulae: blister bowls, pillars, dusty lanes and silhouettes. */
import { gauss, rng } from '../cosmos-paint.ts';
import { NB, PAL, add, chaikin, clamp, crPoint, dot, hex, makeNoise3, mix, norm, perp, polySd, scale, smooth, sub, type C3, type P2, type V3 } from './core.ts';

type Noise = ReturnType<typeof makeNoise3>;
type Box = [number, number, number, number];

/** Ridged noise: ≈1 along thin filaments, lower in between. */
const ridge = (nz: Noise, x: number, y: number, z = 0.5) => 1 - Math.abs(2 * nz(x, y, z) - 1);

/** Distance from (x,y) to an open polyline. */
function lineD(P: P2[], x: number, y: number): number {
  let d = 1e9;
  for (let i = 1; i < P.length; i++) {
    const [ax, ay] = P[i - 1], [bx, by] = P[i], dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1));
    d = Math.min(d, Math.hypot(x - ax - dx * t, y - ay - dy * t));
  }
  return d;
}

/** Signed distance to a closed polygon (negative inside), pre-rasterised over `box` for fast rejection sampling. */
function gridSd(P: P2[], box: Box, res = 120) {
  const [x0, x1, y0, y1] = box, w = res + 1, G = new Float32Array(w * w);
  for (let j = 0; j <= res; j++) for (let i = 0; i <= res; i++) G[j * w + i] = polySd(P, x0 + (x1 - x0) * i / res, y0 + (y1 - y0) * j / res);
  return (x: number, y: number) => {
    const fx = (x - x0) / (x1 - x0) * res, fy = (y - y0) / (y1 - y0) * res;
    if (fx < 0 || fy < 0 || fx > res || fy > res) return 1;
    const i = Math.min(res - 1, Math.floor(fx)), j = Math.min(res - 1, Math.floor(fy)), tx = fx - i, ty = fy - j;
    return (G[j * w + i] * (1 - tx) + G[j * w + i + 1] * tx) * (1 - ty) + (G[(j + 1) * w + i] * (1 - tx) + G[(j + 1) * w + i + 1] * tx) * ty;
  };
}
const tangent = (pts: V3[], t: number) => norm(sub(crPoint(pts, Math.min(1, t + 0.01)), crPoint(pts, Math.max(0, t - 0.01))));

/**
 * A dusty column (pillar / elephant trunk) along `pts` with radius profile `rad(t)` (t = 0 base … 1 rounded tip), lit
 * from direction `L`: opaque dust shaded brown on the lit side, a bright rim of ionised gas on the surface facing the
 * stars (brightest at the tip), and a faint photo-evaporation flow streaming off the tip.
 */
function pillar(b: NB, nz: Noise, pts: V3[], rad: (t: number) => number, L: V3, n: number, rim: C3, rimI: number, ds = 0.03, tipCol: C3 = rim) {
  const r = b.r, N = b.n(n), cap = (t: number) => t > 0.84 ? Math.sqrt(Math.max(0, 1 - ((t - 0.84) / 0.16) ** 2)) : 1;
  const at = (t: number, a: number, k: number): [V3, V3] => {
    const c = crPoint(pts, t), [u, v] = perp(tangent(pts, t)), nr = add(scale(u, Math.cos(a)), v, Math.sin(a));
    const R = rad(t) * cap(t) * clamp(0.5 + (nz(c[0] * 9 + nr[0] * 1.4, c[1] * 9 + nr[1] * 1.4, c[2] * 9 + nr[2] * 1.4) - 0.3) * 2, 0.45, 1.4);
    return [add(c, nr, R * k), nr];
  };
  for (let i = 0; i < N; i++) {
    const t = r(), [p, nr] = at(t, r() * Math.PI * 2, Math.sqrt(r()) * 0.9), lit = clamp(dot(nr, L));
    b.dst(p, mix(PAL.dust, PAL.dustLit, lit * (0.2 + 0.8 * t)), 0.95, ds * (0.7 + r() * 0.6));
  }
  b.front(() => {
    for (let i = 0, M = Math.round(N * 0.8); i < M; i++) {
      // the ionised skin: brightest where it faces the stars, and on the limbs (the face towards us is mostly dark dust)
      const t = 1 - r() ** 1.6, [p, nr] = at(t, r() * Math.PI * 2, 1.08 + r() * 0.1), lit = clamp(dot(nr, L) * 0.5 + 0.5);
      if (lit < 0.1) continue;
      const tip = smooth(0.72, 1, t), face = nr[2] > 0.45 ? 0.15 : 1;
      b.glw(p, mix(rim, tipCol, tip), rimI * face * lit ** 2 * (0.3 + 1.2 * tip), ds * 0.75);
    }
    const tip = crPoint(pts, 0.97), tg = tangent(pts, 1);
    b.curve([tip, add(tip, norm(add(tg, L)), rad(1) * 1.6), add(tip, norm(add(tg, scale(L, 2))), rad(1) * 3)], n * 0.06, (t) => rad(1) * (0.5 + t),
      (p) => b.glw(p, tipCol, rimI * 0.05, ds * 1.4));
  });
}

/** Gaussian clump of dark dust. */
function dustBlob(b: NB, n: number, c: V3, s: V3, col: C3, alpha: number, size: number) {
  for (let i = 0, N = b.n(n); i < N; i++) b.dst([c[0] + b.g() * s[0], c[1] + b.g() * s[1], c[2] + b.g() * s[2]], col, alpha, size * (0.6 + b.r() * 0.8));
}

/** Haze quads scattered by a 2D density, placed at depth z(x,y). */
function hazeField(b: NB, n: number, box: Box, d: (x: number, y: number) => number, z: (x: number, y: number) => number, col: (x: number, y: number) => C3, I: number, size: number, rough = 0.85) {
  const r = b.r;
  for (let i = 0, k = 0; i < n && k < n * 300; k++) {
    const x = box[0] + (box[1] - box[0]) * r(), y = box[2] + (box[3] - box[2]) * r();
    if (r() < d(x, y)) { b.hz([x, y, z(x, y)], col(x, y), I * (0.6 + r() * 0.8), size * (0.6 + r() * 0.8), rough); i++; }
  }
}

// ------------------------------------------------------------------------------------------------ Orion
/** M42: a blister HII region — a concave bowl on the face of the Orion molecular cloud, opening towards us. */
function orion(b: NB) {
  const r = b.r, nz = makeNoise3(42), T: V3 = [0.02, 0.1, -0.16];
  const bowl = (x: number, y: number) => -0.36 + 0.42 * ((x - T[0]) ** 2 + (y - T[1] + 0.05) ** 2);
  const wingL: P2[] = [[-0.02, 0.17], [-0.26, 0.15], [-0.48, 0.02], [-0.63, -0.25], [-0.7, -0.56], [-0.6, -0.86]];
  const wingR: P2[] = [[0.08, 0.11], [0.32, 0.04], [0.52, -0.15], [0.63, -0.44], [0.56, -0.76]];
  const dist = (x: number, y: number) => Math.hypot(x - T[0], (y - T[1]) * 1.1);
  const dens = (x: number, y: number) => {
    const dc = dist(x, y), rg = ridge(nz, x * 4.5, y * 4.5, 3) ** 3;
    let d = 0.6 * Math.exp(-((dc / 0.12) ** 2)) + 0.5 * Math.exp(-(((x - T[0]) / 0.3) ** 2 + ((y - T[1] + 0.12) / 0.36) ** 2));
    d += (0.45 * Math.exp(-((lineD(wingL, x, y) / 0.15) ** 2)) + 0.38 * Math.exp(-((lineD(wingR, x, y) / 0.13) ** 2))) * (0.45 + 0.9 * rg);
    d += 0.2 * Math.exp(-((x / 0.55) ** 2 + ((y + 0.35) / 0.5) ** 2)) * (0.6 + rg);
    d += 0.16 * Math.exp(-(((x + 0.05) / 0.45) ** 2 + ((y - 0.52) / 0.2) ** 2)) + 0.07 * Math.exp(-((x / 0.7) ** 2 + ((y - 0.4) / 0.35) ** 2));
    return clamp(d * (0.35 + nz(x * 3.2, y * 3.2) * 1.3) * (1 - smooth(0.85, 1.05, Math.hypot(x, y * 0.95))));
  };
  const col = (x: number, y: number): C3 => {
    const dc = dist(x, y), w = nz(x * 6 + 9, y * 6, 2);
    const dn = dc * (0.75 + 0.5 * w);
    const c = mix(mix(mix(hex('#f0fff8'), hex('#9ce8d8'), smooth(0.0, 0.08, dn)), hex('#ffd6e0'), smooth(0.07, 0.2, dn)), mix(PAL.pink, PAL.ha, smooth(0.3, 0.65, dn)), smooth(0.15, 0.35, dn));
    return mix(c, PAL.orange, clamp((w - 0.55) * 1.6) * smooth(0.12, 0.3, dc));
  };
  hazeField(b, 90, [-1, 1, -1, 0.75], dens, (x, y) => bowl(x, y) - 0.02, col, 0.035, 0.24);
  b.field(60000, [-1, 1, -1, 0.75], dens, (x, y, d) => b.glw([x, y, bowl(x, y) + b.g() * 0.035], col(x, y), 0.016 + 0.016 * d, 0.02 + r() * 0.025));
  // M43: comma-shaped, north across the dark lane, round its own star NU Ori
  const M: V3 = [-0.06, 0.6, -0.12];
  b.blob(4000, M, [0.06, 0.055, 0.04], (p) => mix(hex('#ffd8e0'), PAL.ha, clamp(Math.hypot(p[0] - M[0], p[1] - M[1]) / 0.11)), 0.03, 0.03);
  b.curve([M, [0.04, 0.64, -0.12], [0.12, 0.57, -0.1], [0.13, 0.47, -0.08]], 2200, 0.025, (p) => b.glw(p, PAL.ha, 0.03, 0.03));
  b.hz(M, PAL.pink, 0.08, 0.12, 0.5);
  // Orion Bar: the bowl's wall seen edge-on, SE of the Trapezium
  b.curve([[-0.32, 0.02, 0], [-0.2, -0.06, 0], [-0.08, -0.17, 0], [0.04, -0.26, 0], [0.12, -0.36, 0]], 4000, 0.022, (p) => {
    if (r() < smooth(0.4, 0.6, nz(p[0] * 9, p[1] * 9, 5))) b.glw([p[0], p[1], bowl(p[0], p[1]) + r() * 0.16], mix(PAL.gold, PAL.orange, r()), 0.022, 0.024);
  });
  for (const w of [wingL, wingR]) b.curve(w.map(([x, y]): V3 => [x * 1.06, y * 1.03 - 0.02, bowl(x, y) + 0.04]), 5000, 0.028, (p) => b.glw(p, mix(PAL.ha, PAL.orange, r() * 0.5), 0.02, 0.026));
  // the dark "Fish's Mouth" lane and Dark Bay: foreground dust of Orion's Veil
  const fish = gridSd(chaikin([[-0.95, 0.62], [-0.5, 0.57], [-0.25, 0.5], [0.04, 0.47], [0.2, 0.46], [0.06, 0.4], [-0.1, 0.33], [-0.16, 0.24], [-0.28, 0.2], [-0.45, 0.3], [-0.95, 0.36]], 2), [-1, 0.3, 0.1, 0.75]);
  b.field(8000, [-1, 0.25, 0.15, 0.72], (x, y) => smooth(0, 0.035, -fish(x, y) + (nz(x * 7, y * 7, 4) - 0.5) * 0.12) * (1 - smooth(-0.75, -1, x)), (x, y) => b.dst([x, y, 0.22 + b.g() * 0.04], mix(PAL.dust, PAL.dustLit, r() * 0.15), 0.92 * (1 - smooth(-0.6, -0.95, x) * 0.5), 0.03));
  // stars: the Trapezium (θ1 Ori C brightest), θ2 Ori A, NU Ori, the young cluster
  ([[0, 0, 1.8], [0.034, 0.02, 1.1], [0.012, 0.046, 0.9], [-0.03, 0.014, 0.8]] as const).forEach(([x, y, I]) => b.star([T[0] + x, T[1] + y, T[2]], hex('#dfe8ff'), I, 18 + I * 8, 0.7));
  b.star([-0.15, -0.22, T[2] + 0.06], hex('#dfe8ff'), 1.0, 20, 0.5);
  b.star([M[0], M[1], M[2] + 0.02], PAL.starW, 0.8, 14, 0.3);
  b.cluster(260, T, 0.11, 0.45, 6, [PAL.starR, PAL.starW, PAL.starY, PAL.starW]);
  b.field_stars(90, 1.1, 0.5);
}

// ------------------------------------------------------------------------------------------------ Eagle
/** M16: the Pillars of Creation (≈4× enlarged for legibility) on the far wall of a cavity lit by NGC 6611 (upper right). */
function eagle(b: NB) {
  const r = b.r, nz = makeNoise3(16), C: V3 = [0.42, 0.45, 0.2], L = norm([0.4, 0.9, 0.12]);
  const dens = (x: number, y: number) => {
    const d = Math.hypot(x * 0.95, y * 1.02), rg = ridge(nz, x * 4, y * 4, 2) ** 3;
    return clamp((1 - smooth(0.6, 1.0, d)) * (0.25 + nz(x * 3, y * 3) * 1.2) * (0.45 + 0.5 * rg + 0.55 * Math.exp(-((x * 1.2) ** 2 + (y + 0.1) ** 2) / 0.25)));
  };
  const col = (x: number, y: number): C3 => {
    const c = Math.hypot(x - 0.05, y + 0.05);
    return mix(mix(hex('#86d8e0'), hex('#ffa0b4'), smooth(0.15, 0.5, c)), PAL.ha, smooth(0.45, 0.9, c));
  };
  const zb = (x: number, y: number) => -Math.sqrt(Math.max(0, 1 - x * x - y * y)) * 0.55 + 0.05;
  hazeField(b, 80, [-1, 1, -1, 1], dens, (x, y) => zb(x, y) - 0.05, col, 0.04, 0.26);
  b.field(42000, [-1, 1, -1, 1], dens, (x, y) => {
    const front = r() < 0.12, z = front ? -zb(x, y) * 0.8 + 0.1 : zb(x, y) + b.g() * 0.06;
    b.glw([x, y, z], front ? mix(PAL.ha, PAL.pink, r()) : col(x, y), front ? 0.016 : 0.032, 0.022 + r() * 0.025);
  });
  // the three pillars (left = tallest), the dusty base they rise from, and the Spire further left
  const head = (t: number, w: number) => w * Math.exp(-(((t - 0.86) / 0.08) ** 2));
  const rimC = hex('#ffb070'), tipC = hex('#ffe6b0');
  pillar(b, nz, [[-0.22, -0.8, -0.06], [-0.2, -0.5, -0.04], [-0.17, -0.24, 0.0], [-0.13, -0.04, 0.04], [-0.08, 0.06, 0.06]], (t) => 0.1 * (1 - 0.6 * t) + head(t, 0.04), L, 9000, rimC, 0.3, 0.028, tipC);
  pillar(b, nz, [[0.08, -0.8, -0.12], [0.09, -0.6, -0.1], [0.12, -0.45, -0.09], [0.15, -0.36, -0.08]], (t) => 0.078 * (1 - 0.55 * t) + head(t, 0.03), L, 5000, rimC, 0.3, 0.026, tipC);
  pillar(b, nz, [[0.32, -0.82, -0.16], [0.31, -0.7, -0.16], [0.29, -0.6, -0.15]], (t) => 0.05 * (1 - 0.45 * t) + head(t, 0.016), L, 2200, rimC, 0.3, 0.022, tipC);
  pillar(b, nz, [[-0.74, -0.7, -0.22], [-0.68, -0.44, -0.2], [-0.63, -0.22, -0.17], [-0.58, -0.08, -0.14]], (t) => 0.05 * (1 - 0.55 * t) + head(t, 0.012), L, 3000, rimC, 0.22, 0.024, tipC);
  const base = (x: number) => -0.84 + 0.05 * Math.sin(x * 7) + 0.08 * Math.exp(-(((x + 0.2) / 0.25) ** 2)) + 0.05 * Math.exp(-(((x - 0.12) / 0.15) ** 2));
  b.field(6000, [-0.75, 0.75, -1, -0.68], (x, y) => (y < base(x) ? 1 : 0) * (1 - smooth(0.5, 0.75, Math.abs(x + 0.05))) * smooth(-1, -0.9, y), (x, y) =>
    b.dst([x, y, -0.1 + b.g() * 0.05], mix(PAL.dust, PAL.dustLit, 0.5 * r() * smooth(-0.95, -0.75, y)), 0.95, 0.03));
  b.field(1500, [-0.75, 0.75, -0.95, -0.68], (x, y) => Math.exp(-(((y - base(x) - 0.01) / 0.012) ** 2)) * (1 - smooth(0.45, 0.75, Math.abs(x + 0.05))),
    (x, y) => b.front(() => b.glw([x, y, -0.04], rimC, 0.06, 0.02)));
  // NGC 6611
  b.cluster(70, C, 0.11, 0.9, 9, [PAL.starB, PAL.starB, PAL.starW]);
  for (let i = 0; i < 6; i++) b.star([C[0] + b.g() * 0.07, C[1] + b.g() * 0.07, C[2] + b.g() * 0.05], hex('#dce6ff'), 1.0, 18, 0.35);
  b.field_stars(110, 1.1, 0.5);
}

// ------------------------------------------------------------------------------------------------ Carina
/** NGC 3372: a giant cavity blown by Trumpler 14/16, a V of foreground dust, Eta Carinae + Homunculus, the Keyhole and the southern pillars. */
function carina(b: NB) {
  const r = b.r, nz = makeNoise3(3372), E: V3 = [-0.1, -0.02, 0.02], T14: V3 = [0.3, 0.2, 0.0];
  const dens = (x: number, y: number) => {
    const e = Math.hypot((x + 0.05) / 1.0, y / 0.68), rg = ridge(nz, x * 4, y * 4, 6) ** 3;
    const core = Math.exp(-(((x - E[0]) ** 2 + (y - E[1]) ** 2) / 0.09)) + 0.6 * Math.exp(-(((x - T14[0]) ** 2 + (y - T14[1]) ** 2) / 0.05));
    return clamp(((1 - smooth(0.55, 1.0, e)) * (0.35 + 0.5 * rg) + core * 0.45) * (0.2 + nz(x * 2.6, y * 2.6) * 1.5));
  };
  const col = (x: number, y: number): C3 => {
    const d = Math.min(Math.hypot(x - E[0], y - E[1]), Math.hypot(x - T14[0], y - T14[1]) * 1.2), w = nz(x * 5, y * 5, 3);
    return mix(mix(mix(hex('#e0f0ff'), PAL.teal, smooth(0.02, 0.15, d)), mix(PAL.orange, PAL.ha, w), smooth(0.12, 0.45, d)), PAL.nii, smooth(0.6, 1.0, Math.hypot(x, y / 0.7)));
  };
  const zs = (x: number, y: number, s: number) => s * Math.sqrt(Math.max(0, 1 - x * x - (y / 0.7) ** 2)) * 0.5;
  hazeField(b, 110, [-1, 1, -0.75, 0.75], dens, (x, y) => zs(x, y, -1), col, 0.04, 0.22);
  b.field(56000, [-1, 1, -0.75, 0.75], dens, (x, y) => b.glw([x, y, zs(x, y, r() < 0.7 ? -1 : 0.7) + b.g() * 0.05], col(x, y), 0.03, 0.022 + r() * 0.02));
  // the V-shaped dark lane (in front)
  const arms: P2[][] = [[[-0.02, -0.5], [-0.12, -0.2], [-0.3, 0.2], [-0.46, 0.62]], [[-0.02, -0.5], [0.12, -0.15], [0.16, 0.25], [0.12, 0.62]]];
  for (const a of arms) b.field(4000, [-0.7, 0.4, -0.65, 0.7], (x, y) => Math.exp(-((lineD(a, x, y) / (0.03 + 0.03 * nz(x * 5, y * 5, 8))) ** 2)) * smooth(0.3, 0.55, nz(x * 6, y * 6, 5)),
    (x, y) => b.dst([x, y, 0.28 + b.g() * 0.04], mix(PAL.dust, PAL.dustLit, r() * 0.18), 0.9, 0.024));
  // the Keyhole: dark knot with a bright rim, just beside Eta Car
  const K: V3 = [-0.03, 0.06, 0.12];
  dustBlob(b, 700, K, [0.028, 0.02, 0.018], PAL.dust, 0.95, 0.02);
  b.front(() => b.shell(900, [0.042, 0.032, 0.03], 0.08, (p) => b.glw(add(K, p), hex('#ffd2a0'), 0.06, 0.012)));
  // southern dust ridge with broad pillars (Mystic Mountain & co) rising from it, pointing at Eta Car
  const sr = rng(3373), sg = () => gauss(sr), ridgeY = (x: number) => -0.5 + 0.04 * Math.sin(x * 9) + 0.05 * nz(x * 4, 1.5, 3);
  b.field(5000, [-0.75, 0.8, -0.72, -0.4], (x, y) => (y < ridgeY(x) ? 1 : 0) * (1 - smooth(0.5, 0.8, Math.abs(x - 0.02))) * smooth(-0.72, -0.6, y),
    (x, y) => b.dst([x, y, 0.05 + b.g() * 0.05], mix(PAL.dust, PAL.dustLit, 0.3 * r() * smooth(-0.62, -0.5, y)), 0.95 * (1 - smooth(0.4, 0.8, Math.abs(x - 0.02))) + 0.05, 0.026));
  b.field(1200, [-0.7, 0.75, -0.62, -0.38], (x, y) => Math.exp(-(((y - ridgeY(x) - 0.008) / 0.012) ** 2)) * (1 - smooth(0.4, 0.75, Math.abs(x))), (x, y) => b.front(() => b.glw([x, y, 0.08], hex('#ffb070'), 0.05, 0.018)));
  for (const [x, h, w] of [[0.36, 0.22, 0.05], [0.5, 0.13, 0.035], [0.22, 0.12, 0.03], [-0.32, 0.2, 0.045], [-0.47, 0.12, 0.03], [-0.12, 0.1, 0.03]] as const) {
    const base: V3 = [x, ridgeY(x) - 0.04, 0.05 + sg() * 0.03], dir = norm(sub(E, base)), tip = add(base, dir, h), mid = add(add(base, dir, h * 0.5), [sg() * 0.02, sg() * 0.015, 0]);
    pillar(b, nz, [add(base, dir, -0.04), mid, tip], (t) => w * (1 - 0.65 * t) + w * 0.3 * Math.exp(-(((t - 0.86) / 0.08) ** 2)), dir, 1500, hex('#ffb070'), 0.24, 0.018, hex('#ffe0c0'));
  }
  // Eta Carinae with its bipolar Homunculus (enlarged), Trumpler 16 & 14
  const hx = norm([0.6, 0.7, 0.4]);
  b.shell(2400, [0.02, 0.02, 0.02], 0.15, (p, u) => b.glw(add(E, add(p, hx, 0.028 * (Math.sign(dot(u, hx)) || 1))), mix(hex('#ffb070'), hex('#ffe0b8'), r()), 0.07, 0.008));
  b.star(E, hex('#fff2dc'), 2.2, 34, 1.0);
  b.cluster(70, E, 0.07, 0.8, 8, [PAL.starB, PAL.starW]);
  b.cluster(60, T14, 0.035, 0.9, 8, [PAL.starB, PAL.starW]);
  for (let i = 0; i < 4; i++) b.star(add(T14, [b.g() * 0.02, b.g() * 0.02, 0]), hex('#dce6ff'), 1.1, 18, 0.4);
  b.field_stars(160, 1.1, 0.5);
}

// ------------------------------------------------------------------------------------------------ Lagoon
/** M8: an elongated cloud split by a curving foreground dust lane; Hourglass + Herschel 36 on the bright west side, NGC 6530 to the east. */
function lagoon(b: NB) {
  const r = b.r, nz = makeNoise3(8), H: V3 = [0.3, 0.02, -0.05], CL: V3 = [-0.42, 0.0, 0.05];
  const dens = (x: number, y: number) => {
    const e = Math.hypot(x / 1.0, y / 0.56), rg = ridge(nz, x * 4, y * 4, 4) ** 3;
    return clamp(((1 - smooth(0.5, 1.0, e)) * (0.35 + 0.4 * rg) + 0.55 * Math.exp(-(((x - H[0]) / 0.28) ** 2 + ((y - H[1]) / 0.2) ** 2))) * (0.25 + nz(x * 3.4, y * 3.4) * 1.4));
  };
  const col = (x: number, y: number): C3 => {
    const d = Math.hypot(x - H[0], y - H[1]);
    return mix(mix(hex('#ffe8ec'), PAL.magenta, smooth(0.03, 0.2, d)), PAL.ha, smooth(0.3, 0.8, d));
  };
  const z0 = (x: number, y: number) => -0.2 * Math.sqrt(Math.max(0, 1 - x * x - (y / 0.6) ** 2));
  hazeField(b, 90, [-1, 1, -0.65, 0.65], dens, (x, y) => z0(x, y) - 0.05, col, 0.035, 0.22);
  b.field(58000, [-1, 1, -0.65, 0.65], dens, (x, y) => b.glw([x, y, z0(x, y) + b.g() * 0.12], col(x, y), 0.026, 0.022 + r() * 0.02));
  // the Hourglass: two tiny bright lobes around Herschel 36
  for (const s of [1, -1]) b.blob(2000, add(H, [0.006 * s, 0.022 * s, 0]), [0.012, 0.018, 0.012], () => mix(PAL.white, hex('#ffd0c0'), r()), 0.07, 0.012);
  // the lagoon: a winding foreground dust lane + Bok globules
  const lane: P2[] = [[-0.06, 0.5], [0.0, 0.3], [-0.04, 0.08], [0.04, -0.16], [0.18, -0.34], [0.38, -0.44], [0.58, -0.46]];
  b.field(7000, [-0.3, 0.75, -0.65, 0.65], (x, y) => Math.exp(-((lineD(lane, x, y) / (0.03 + 0.035 * nz(x * 4, y * 4))) ** 2)) * smooth(0.3, 0.5, nz(x * 7, y * 7, 9)) * (1 - smooth(0.45, 0.6, Math.abs(y))),
    (x, y) => b.dst([x, y, 0.2 + b.g() * 0.04], mix(PAL.dust, PAL.dustLit, r() * 0.18), 0.9, 0.022));
  const sr = rng(88);
  for (let i = 0; i < 14; i++) {
    const c: V3 = [-0.55 + sr() * 0.8, (sr() - 0.5) * 0.5, 0.12 + sr() * 0.1], s = 0.006 + sr() * 0.01;
    dustBlob(b, 120, c, [s, s * (1 + r()), s], PAL.dust, 0.95, s * 1.3);
    b.front(() => b.shell(120, [s * 1.3, s * 1.6, s * 1.3], 0.1, (p) => { if (p[0] > 0) b.glw(add(c, p), hex('#ffc0b0'), 0.05, 0.01); }));
  }
  b.star(H, PAL.starB, 1.2, 16, 0.4);
  b.star([0.06, 0.13, 0.05], PAL.starW, 1.3, 20, 0.5);
  b.cluster(110, CL, 0.14, 0.8, 8, [PAL.starB, PAL.starW, PAL.starB]);
  b.field_stars(170, 1.1, 0.5);
}

// ------------------------------------------------------------------------------------------------ Horsehead
/** Barnard 33: a dusty pillar rising from the edge of L1630 in front of the glowing IC 434 sheet, lit from above by σ Orionis. */
function horsehead(b: NB) {
  const r = b.r, nz = makeNoise3(33), L = norm([0.15, 1, 0.2]);
  const edge = (x: number) => -0.42 + 0.05 * Math.sin(x * 5 + 1) + 0.06 * (nz(x * 4, 0.5) - 0.5);
  const fade = (x: number, y: number) => (1 - smooth(0.7, 1.05, Math.abs(x))) * (1 - smooth(0.75, 1.05, y));
  const dens = (x: number, y: number) => clamp((0.3 + 0.7 * smooth(-0.6, 0.95, y)) * (0.25 + 0.9 * ridge(nz, x * 7, y * 0.7, 1) ** 3) * (0.5 + 0.7 * nz(x * 3, y * 3, 4)) * fade(x, y));
  const col = (x: number, y: number): C3 => mix(PAL.nii, mix(PAL.ha, hex('#ff7a8a'), smooth(0.2, 0.9, y)), 0.35 + 0.65 * nz(x * 6, y * 2, 7));
  // IC 434: a red sheet behind, brightest towards σ Ori (top), with vertical striations
  hazeField(b, 60, [-1.05, 1.05, -0.9, 1.05], dens, () => -0.42, col, 0.04, 0.24, 0.9);
  b.field(40000, [-1.05, 1.05, -0.9, 1.05], dens, (x, y) => b.glw([x, y, -0.4 + b.g() * 0.06], col(x, y), 0.044, 0.022 + r() * 0.018));
  // L1630 dark cloud (front) and the horse's head (a pillar ~0.25 thick)
  b.field(9000, [-1.1, 1.1, -1.1, -0.25], (x, y) => (y < edge(x) ? 1 : 0) * (1 - smooth(0.9, 1.1, Math.abs(x))), (x, y) => {
    const dz = smooth(0, 0.3, edge(x) - y), f = (1 - smooth(0.6, 1.05, Math.abs(x))) * smooth(-1.1, -0.75, y);
    b.dst([x, y, -0.15 + r() * (0.15 + dz * 0.35)], mix(PAL.dust, PAL.dustLit, (1 - dz) * 0.3 * r()), 0.2 + 0.75 * f, 0.06);
  });
  // chess-knight profile facing left: neck, throat, jaw, blunt muzzle (lower left), forehead, ears/forelock (top), mane sloping down right
  const head = gridSd(chaikin([[-0.13, -0.52], [-0.08, -0.4], [-0.08, -0.3], [-0.11, -0.21], [-0.2, -0.22], [-0.29, -0.27], [-0.37, -0.31], [-0.45, -0.28], [-0.5, -0.19],
    [-0.5, -0.09], [-0.43, 0.01], [-0.34, 0.09], [-0.25, 0.19], [-0.17, 0.3], [-0.09, 0.38], [-0.03, 0.45], [0.02, 0.4], [0.07, 0.45], [0.12, 0.38], [0.15, 0.28], [0.14, 0.16],
    [0.12, 0.04], [0.16, -0.1], [0.25, -0.26], [0.38, -0.4], [0.5, -0.52]], 2), [-0.58, 0.58, -0.6, 0.55]);
  // the glowing ionisation front along the cloud edge
  b.field(5000, [-1.05, 1.05, -0.65, -0.25], (x, y) => Math.exp(-(((y - edge(x) - 0.015) / 0.025) ** 2)) * 0.8 * fade(x, 0) * smooth(0.0, 0.04, head(x, y)), (x, y) => b.front(() => b.glw([x, y, -0.12 + r() * 0.2], mix(PAL.ha, hex('#ff8a9a'), r()), 0.05, 0.022)));
  b.field(9000, [-0.55, 0.52, -0.55, 0.48], (x, y) => head(x, y) < 0 ? 1 : 0, (x, y) => {
    const th = Math.sqrt(clamp(-head(x, y) / 0.12)) * 0.13;
    b.dst([x, y, -0.04 + b.g() * th], mix(PAL.dust, PAL.dustLit, clamp(0.4 * (y + 0.2)) * r()), 0.95, 0.026);
  });
  // rim light on the head's upper edges (towards σ Ori)
  b.field(4000, [-0.57, 0.4, -0.36, 0.5], (x, y) => { const s = head(x, y); return s > 0 && s < 0.018 ? 1 : 0; }, (x, y) => {
    const e = 0.01, gx = head(x + e, y) - head(x - e, y), gy = head(x, y + e) - head(x, y - e), lit = clamp(dot(norm([gx, gy, 0.2]), L));
    if (lit > 0.1) b.front(() => b.glw([x, y, 0.02 + b.g() * 0.04], mix(PAL.ha, hex('#ffb0b8'), lit), 0.08 * lit, 0.016));
  });
  // NGC 2023: blue reflection nebula on the cloud's surface, and its star; σ Ori above
  const R: V3 = [-0.55, -0.72, 0.36];
  b.front(() => b.blob(5000, R, [0.1, 0.08, 0.04], (p) => mix(hex('#e8f0ff'), PAL.refl, clamp(Math.hypot(p[0] - R[0], p[1] - R[1]) / 0.12)), 0.03, 0.03));
  b.hz(R, PAL.refl, 0.25, 0.22, 0.6);
  b.star(add(R, [0, 0, 0.02]), hex('#e8eeff'), 1.0, 16, 0.4);
  b.star([0.32, 0.96, -0.3], hex('#dce6ff'), 2.0, 34, 1.0);
  b.field_stars(120, 1.1, 0.45);
}

// ------------------------------------------------------------------------------------------------ North America & Pelican
/** NGC 7000 + IC 5070: one glowing HII region; the continent's coasts are the edges of the foreground dust cloud LDN 935. */
function northAmerica(b: NB) {
  const r = b.r, nz = makeNoise3(7000), box: Box = [-1, 1, -1, 1];
  // the bright "continent": east coast, Florida, Gulf coast, Mexico and Central America (map orientation, north up)
  const land = gridSd(chaikin([[-0.95, 0.5], [-0.72, 0.78], [-0.36, 0.88], [-0.02, 0.86], [0.17, 0.72], [0.22, 0.54], [0.15, 0.4], [0.12, 0.24], [0.08, 0.08], [0.14, -0.06],
    [0.17, -0.24], [0.12, -0.31], [0.05, -0.2], [0.01, -0.08], [-0.08, -0.03], [-0.2, -0.05], [-0.28, -0.12], [-0.28, -0.28], [-0.19, -0.44], [-0.08, -0.57], [0.02, -0.7],
    [0.12, -0.8], [0.12, -0.92], [-0.08, -0.86], [-0.34, -0.66], [-0.6, -0.45], [-0.82, -0.15], [-0.96, 0.18]], 2), box);
  // LDN 935: the dark "Atlantic" and "Gulf of Mexico" between the continent and the Pelican
  const sea = gridSd(chaikin([[0.3, 1.05], [0.32, 0.72], [0.26, 0.52], [0.18, 0.38], [0.15, 0.22], [0.13, 0.1], [0.22, -0.06], [0.24, -0.26], [0.17, -0.37], [0.07, -0.29],
    [0.01, -0.14], [-0.08, -0.08], [-0.2, -0.1], [-0.25, -0.16], [-0.25, -0.28], [-0.16, -0.42], [-0.05, -0.55], [0.05, -0.68], [0.15, -0.79], [0.2, -1.05],
    [0.52, -1.05], [0.5, -0.66], [0.43, -0.36], [0.4, -0.12], [0.43, 0.08], [0.5, 0.22], [0.62, 0.26], [0.52, 0.34], [0.46, 0.5], [0.44, 0.74], [0.42, 1.05]], 2), [-0.4, 0.8, -1.1, 1.1]);
  const wall: P2[] = [[-0.3, -0.2], [-0.31, -0.3], [-0.23, -0.45], [-0.12, -0.58], [-0.02, -0.71], [0.08, -0.82]];
  const pel: P2[] = [[0.47, -0.5], [0.45, -0.25], [0.45, -0.05], [0.5, 0.14], [0.62, 0.2], [0.7, 0.32], [0.62, 0.42]];
  const dens = (x: number, y: number) => {
    const s = land(x, y), rg = ridge(nz, x * 4, y * 4, 6) ** 3, R = Math.hypot(x * 0.95, y);
    let d = (1 - smooth(-0.1, 0.06, s)) * (0.6 + 0.35 * rg) + 0.12 * (1 - smooth(0.7, 1.05, R)) * (0.5 + rg);
    d += 1.2 * Math.exp(-((lineD(wall, x, y) / 0.045) ** 2)) + 0.3 * Math.exp(-((lineD(wall, x, y) / 0.15) ** 2));
    d += 0.4 * Math.exp(-((x - 0.78) ** 2 / 0.05 + (y + 0.05) ** 2 / 0.25)) * (0.6 + rg) + 0.7 * Math.exp(-((lineD(pel, x, y) / 0.035) ** 2));
    return clamp(d * (0.35 + nz(x * 3, y * 3) * 1.3) * (1 - smooth(0.92, 1.05, R)));
  };
  const col = (x: number, y: number): C3 => {
    const w = Math.min(lineD(wall, x, y), lineD(pel, x, y));
    return mix(mix(hex('#ff8098'), PAL.ha, smooth(0.0, 0.08, w)), PAL.nii, smooth(0.3, 0.8, nz(x * 5, y * 5, 2)) * 0.6);
  };
  const zs = (x: number, y: number) => -0.25 + 0.12 * (x * x + y * y);
  hazeField(b, 90, box, (x, y) => dens(x, y) * (sea(x, y) < 0 ? 0.2 : 1), (x, y) => zs(x, y) - 0.03, col, 0.035, 0.22);
  b.field(62000, box, dens, (x, y) => b.glw([x, y, zs(x, y) + b.g() * 0.05], col(x, y), 0.03, 0.022 + r() * 0.02));
  b.field(14000, [-0.35, 0.75, -1.05, 1.05], (x, y) => clamp(-sea(x, y) / 0.025) * (0.75 + 0.25 * nz(x * 7, y * 7, 9)) * (1 - smooth(0.8, 1.05, Math.abs(y))), (x, y) =>
    b.dst([x, y, 0.06 + r() * 0.16], mix(PAL.dust, PAL.dustLit, r() * 0.12), 0.93, 0.026));
  // the hidden ionising star behind the dust (seen only when orbiting)
  b.star([0.3, -0.1, -0.12], PAL.starB, 1.4, 18, 0.4);
  b.field_stars(320, 1.1, 0.45);
}

// ------------------------------------------------------------------------------------------------ Rosette
/** NGC 2237: a thick torus-like shell round a hollow blown by NGC 2244, with dark globules on its inner edge. */
function rosette(b: NB) {
  const r = b.r, nz = makeNoise3(2237), sr = rng(2238), sg = () => gauss(sr);
  const col = (rr: number, w: number): C3 => mix(mix(mix(hex('#ffd8c8'), hex('#ff9a7a'), smooth(0.28, 0.4, rr)), PAL.ha, smooth(0.38, 0.6, rr)), PAL.nii, smooth(0.7, 1.0, rr) * 0.8 + w * 0.2);
  for (let i = 0, N = b.n(66000), k = 0; i < N && k < N * 50; k++) {
    const rr = 0.3 + Math.abs(b.g()) * 0.24 + r() * 0.32, a = r() * Math.PI * 2, z = b.g() * 0.36 * (1 - 0.4 * smooth(0.3, 1, rr));
    const p: V3 = [Math.cos(a) * rr, Math.sin(a) * rr * 0.95, z], n = nz(p[0] * 3.5, p[1] * 3.5, p[2] * 3.5), rg = ridge(nz, p[0] * 6, p[1] * 6, p[2] * 6 + 3) ** 3;
    // radial "petal" lanes: noise stretched along the radius
    const pet = smooth(0.3, 0.6, nz(Math.cos(a) * 3.2 + 7, Math.sin(a) * 3.2, rr * 1.2));
    if (r() > clamp((n - 0.3) * 2 + rg * 0.4) * (0.35 + 0.65 * pet) * (1 - smooth(0.8, 1.0, rr))) continue;
    b.glw(p, col(rr, n), 0.026 + 0.02 * (1 - smooth(0.3, 0.6, rr)), 0.022 + r() * 0.02);
    i++;
  }
  for (let i = 0; i < 80; i++) {
    const a = sr() * Math.PI * 2, rr = 0.4 + sr() * 0.4;
    b.hz([Math.cos(a) * rr, Math.sin(a) * rr, sg() * 0.15], col(rr, sr()), 0.03, 0.2 + sr() * 0.12);
  }
  b.blob(3000, [0, 0, 0], [0.2, 0.2, 0.15], () => mix(PAL.ha, hex('#ffb090'), r()), 0.03, 0.05);
  // elephant trunks / globules on the inner rim (mostly NW), pointing at the cluster
  for (let i = 0; i < 12; i++) {
    const a = sr() < 0.7 ? 0.4 + sr() * 1.2 : sr() * Math.PI * 2, rr = 0.34 + sr() * 0.14, base: V3 = [Math.cos(a) * rr, Math.sin(a) * rr, sg() * 0.1];
    const dir = norm(scale(base, -1)), h = 0.03 + sr() * 0.05, w = 0.016 + sr() * 0.012;
    pillar(b, nz, [add(base, dir, -0.03), add(add(base, dir, h * 0.5), [sg() * 0.012, sg() * 0.012, 0]), add(base, dir, h)], (t) => w * (1 - 0.6 * t) + w * 0.35 * Math.exp(-(((t - 0.85) / 0.1) ** 2)), dir, 300, hex('#ffc090'), 0.4, 0.022, hex('#fff0d0'));
  }
  // thin dark lanes crossing the NW part of the shell (front)
  for (let i = 0; i < 3; i++) {
    const a = 0.4 + sr() * 1.3, rr = 0.55 + sr() * 0.2, c: V3 = [Math.cos(a) * rr, Math.sin(a) * rr, 0.3];
    const d = norm([-Math.sin(a) + sg() * 0.5, Math.cos(a) + sg() * 0.5, 0]), m = add(c, [sg() * 0.04, sg() * 0.04, 0]);
    b.curve([add(c, d, -0.14), m, add(c, d, 0.14)], 600, (t) => 0.003 + 0.008 * Math.sin(Math.PI * t), (p) => b.dst(p, PAL.dust, 0.6, 0.014));
  }
  b.cluster(70, [0, 0, 0], 0.11, 0.9, 9, [PAL.starB, PAL.starB, PAL.starW]);
  for (let i = 0; i < 7; i++) b.star([sg() * 0.09, sg() * 0.09, sg() * 0.05], hex('#dce6ff'), 1.0, 17, 0.35);
  b.field_stars(160, 1.1, 0.5);
}

// ------------------------------------------------------------------------------------------------ Tarantula
/** 30 Doradus: intersecting wind-blown bubbles round R136 whose limb-brightened rims make the arcs and "legs". */
function tarantula(b: NB) {
  const r = b.r, nz = makeNoise3(30), sr = rng(31), sg = () => gauss(sr), R: V3 = [0.06, 0.02, 0];
  const colAt = (p: V3): C3 => {
    const d = Math.hypot(p[0] - R[0], p[1] - R[1], p[2] - R[2]);
    return mix(mix(hex('#f0fff8'), hex('#a8e8d8'), smooth(0.02, 0.12, d)), mix(PAL.pink, PAL.ha, nz(p[0] * 4, p[1] * 4, 1)), smooth(0.08, 0.35, d));
  };
  // cavity bubbles: their limb-brightened walls give the bright loops and arcs
  for (let k = 0; k < 9; k++) {
    const u = norm([sg(), sg(), sg() * 0.6]), off = 0.15 + sr() * 0.35, rad = 0.16 + sr() * 0.28, c = add(R, u, off);
    b.shell(5000, [rad, rad, rad], 0.03, (p) => {
      const q = add(c, p), n = nz(q[0] * 5, q[1] * 5, q[2] * 5), d = Math.hypot(q[0] - R[0], q[1] - R[1]);
      if (r() > clamp((n - 0.38) * 2.5) || Math.hypot(...q) > 1) return;
      b.glw(q, colAt(q), 0.03 * (0.5 + 1.0 / (1 + d * 4)), 0.026);
    });
  }
  // the legs: broad, knotty, braided ridges of gas wandering outwards from the core
  for (let k = 0; k < 9; k++) {
    let a = (k + sr() * 0.6) / 9 * Math.PI * 2, d = 0.1 + sr() * 0.08;
    const bend = sg() * 0.3, pts: V3[] = [], m = 4 + Math.floor(sr() * 3);
    for (let j = 0; j < m; j++) { pts.push([R[0] + Math.cos(a) * d, R[1] + Math.sin(a) * d, sg() * 0.12]); a += bend + sg() * 0.22; d += 0.1 + sr() * 0.08; }
    const I = 0.03 + sr() * 0.025;
    b.braid(pts, 5, 3000 + m * 300, 0.03, 1.4, 0.014, (p, t) => { if (r() < 0.25 + 0.75 * smooth(0.35, 0.6, nz(p[0] * 8, p[1] * 8, p[2] * 8))) b.glw(p, colAt(p), I * (1 - t * 0.5), 0.024); });
  }
  hazeField(b, 90, [-1, 1, -1, 1], (x, y) => Math.exp(-((x - R[0]) ** 2 + (y - R[1]) ** 2) / 0.3), () => b.g() * 0.2, (x, y) => colAt([x, y, 0]), 0.035, 0.22);
  b.field(22000, [-1, 1, -1, 1], (x, y) => Math.exp(-((x - R[0]) ** 2 + (y - R[1]) ** 2) / 0.3) * (0.15 + 0.85 * ridge(nz, x * 5, y * 5, 7) ** 4), (x, y) => b.glw([x, y, b.g() * 0.2], colAt([x, y, 0]), 0.02, 0.03));
  b.blob(4000, R, [0.08, 0.08, 0.08], colAt, 0.025, 0.03);
  // dark dust patches in front (lower left and upper right)
  b.field(9000, [-1, 1, -1, 1], (x, y) => {
    const lanes = Math.exp(-(((y + 0.42 + 0.25 * x) / 0.11) ** 2)) * smooth(0.1, -0.3, x) + Math.exp(-(((y - 0.42 + 0.5 * (x - 0.6)) / 0.08) ** 2)) * smooth(0.25, 0.5, x);
    return clamp(lanes * smooth(0.4, 0.6, nz(x * 5, y * 5, 2)) * 1.4) * (1 - smooth(0.8, 1, Math.hypot(x, y)));
  }, (x, y) => b.dst([x, y, 0.3 + b.g() * 0.04], mix(PAL.dust, PAL.dustLit, r() * 0.15), 0.85, 0.026));
  // R136 and the older Hodge 301
  b.star(R, hex('#eef2ff'), 2.6, 42, 1.0);
  b.cluster(120, R, 0.025, 1.0, 8, [PAL.starB, PAL.starB, PAL.starW]);
  b.cluster(40, [-0.22, 0.14, 0.05], 0.04, 0.6, 7, [PAL.starY, PAL.starR, PAL.starW]);
  b.field_stars(220, 1.1, 0.45);
}

export const HII: Record<string, (b: NB) => void> = {
  dp_orion_nebula: orion,
  dp_eagle_nebula: eagle,
  dp_carina_nebula: carina,
  dp_lagoon_nebula: lagoon,
  dp_horsehead_nebula: horsehead,
  dp_north_america_nebula: northAmerica,
  dp_rosette_nebula: rosette,
  dp_tarantula_nebula: tarantula,
};
