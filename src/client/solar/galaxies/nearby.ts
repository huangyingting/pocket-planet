/**
 * Laniakea-scale objects: famous nearby galaxies (Sombrero, Whirlpool, Pinwheel, Centaurus A, M87), the galaxy
 * groups (M81, Leo Triplet, Sculptor, Maffei) and the nearby galaxy clusters (Virgo, Fornax, Norma, ...).
 * Frame: +Z towards Earth, +Y north, −X east. Group and cluster members are drawn larger than life (noted per object)
 * so they stay visible at the scale of the whole group.
 */
import { PAL, add, hex, mix, norm, sub, type C3, type NB, type V3 } from '../nebulae/core.ts';
import {
  DEG, GC, O, cluster, elliptical, fluxI, irregular, jet, mark, mini, sky, skyToDisc, skyXf, spiral, tint,
  type MiniType, type SpiralOpts,
} from './generic.ts';
import type { GalaxyDef } from './generic-models.ts';
import { knot } from './local.ts';

const v = (x: number, y: number, z = 0): V3 => [x, y, z];
/** Model-space normal of a disc with this orientation (light on its Earth side is drawn over its dust). */
const discNormal = (pa: number, inc: number, near = 1) => { const X = skyXf(O, 1, pa, inc, near); return norm(sub(X([0, 0, 1]), X(O))); };
/** Arm phase so that an arm passes through sky offset (dx, dy) of the disc centre. */
function armPhase(R: number, pa: number, inc: number, near: number, wind: number, pitch: number, r0: number, dx: number, dy: number) {
  const t = skyToDisc(R, pa, inc, near, dx, dy), Rt = Math.hypot(t[0], t[1]);
  return (Math.atan2(t[1], t[0]) - wind * Math.log(Rt / r0) / Math.tan(pitch * DEG)) / DEG;
}
/** Dark dust patches / filaments around `c` (size `s`), slightly in front of it. */
function dustPatch(b: NB, c: V3, s: V3, n: number, a = 0.55, size = 0.01) {
  const r = b.r, g = b.g;
  for (let i = 0, N = b.n(n); i < N; i++) b.dst(add(c, [g() * s[0], g() * s[1], g() * s[2]]), mix(GC.dust, GC.dust2, r()), a * (0.6 + r() * 0.6), size * (0.6 + r() * 0.8));
}
/** A big elliptical member of a group / cluster (cheap version). */
const bigE = (b: NB, c: V3, R: number, pa: number, q = 0.8, F = 0.14, gc = 0) =>
  elliptical(b, { c, R, pa, q, a: 0.1, F, n: 0.15, nucleus: Math.min(0.9, 0.3 + R * 8), halo: 0.6, gc, gcR: 0.5 });
/** A spiral member of a group / cluster (cheap version). */
const smallS = (b: NB, c: V3, R: number, pa: number, inc: number, o: Partial<SpiralOpts> = {}) =>
  spiral(b, { c, R, pa, inc, arms: 2, pitch: 18, phase: b.r() * 360, bulge: 0.12, bulgeF: 0.05, nucleus: Math.min(0.7, 0.2 + R * 6), n: 0.06, armF: 0.24, discF: 0.18, ...o });
/** Crowded Milky Way foreground stars (for objects seen through the plane of our galaxy). */
function foreground(b: NB, n: number) {
  const r = b.r, cols = [PAL.starW, PAL.starY, PAL.starB, PAL.starR, PAL.starY];
  for (let i = 0, N = b.n(n); i < N; i++) { const k = r() ** 5; const a = r() * Math.PI * 2, d = 1.1 * Math.sqrt(r()); b.star([Math.cos(a) * d, Math.sin(a) * d, 0.6 + r() * 0.4], cols[Math.floor(r() * 5)], 0.18 + k * 0.9, 2 + k * 4); }
}

// ------------------------------------------------------------------ famous galaxies
function sombrero(b: NB) {
  // nearly edge-on (PA 90°, inclination 84°, south side nearer): huge glowing bulge and halo, a crisp ring of dust, ~1500 globular clusters
  const pa = 90, inc = 84, near = 1, R = 0.84, nrm = discNormal(pa, inc, near), r = b.r, g = b.g;
  const X = spiral(b, {
    R, pa, inc, near, arms: 2, pitch: 5, r0: 0.3, armW: 0.06, armF: 0.05, discF: 0.12, h: 0.45, bulge: 0, nucleus: 0, warm: 0.7,
    dust: 0.3, dustA: 0.5, hii: 15, young: 80, armCol: hex('#e8dccb'), armCol2: hex('#d8dcf0'), thick: 0.012,
  });
  elliptical(b, { R: 0.78, pa, q: 0.62, q3: 1, a: 0.11, F: 0.34, gc: 1500, gcR: 0.42, halo: 0, nucleus: 1.1, split: nrm, c1: hex('#ffdcae') });
  elliptical(b, { R: 1, pa, q: 0.7, q3: 1, a: 0.3, F: 0.11, n: 0.35, nucleus: 0, halo: 0, split: nrm, c0: GC.old2, c1: hex('#e8d2b8') });
  // the dust ring: dense and opaque near the rim, thinner inside
  for (let i = 0, N = b.n(14000); i < N; i++) {
    const outer = r() < 0.75, Rr = outer ? 0.86 + g() * 0.045 : 0.35 + r() * 0.5, phi = r() * Math.PI * 2;
    b.dst(X([Rr * Math.cos(phi), Rr * Math.sin(phi), g() * 0.006]), mix(GC.dust, GC.dust2, r() * 0.6), outer ? 0.95 : 0.45, (outer ? 0.03 : 0.025) * R);
  }
  // starlight rim just outside the dust ring
  b.front(() => {
    for (let i = 0, N = b.n(5000); i < N; i++) {
      const Rr = 0.96 + Math.abs(g()) * 0.05, phi = r() * Math.PI * 2;
      b.glw(X([Rr * Math.cos(phi), Rr * Math.sin(phi), g() * 0.006]), mix(GC.old2, hex('#dfe2f2'), r()), fluxI(0.012, 5000, 0.012), 0.012 * R);
    }
  });
}

function whirlpool(b: NB) {
  // M51: face-on grand-design spiral (arms wind clockwise outwards on the sky); NGC 5195 at the end of the northern arm, slightly behind
  const pa = 163, inc = 22, near = 1, R = 0.6, wind = -1, pitch = 19, r0 = 0.08, [tx, ty] = sky(15, 0.55);
  const phase = armPhase(R, pa, inc, near, wind, pitch, r0, tx, ty);
  const X = spiral(b, {
    R, pa, inc, near, arms: 2, pitch, wind, phase, r0, r1: 1, armW: 0.05, floc: 3, bulge: 0.09, bulgeF: 0.05, discF: 0.15, armF: 0.3,
    h: 0.3, hii: 520, young: 900, dust: 1.2, dustA: 0.6, nucleus: 0.9,
  });
  const c = sky(15, 0.7, -0.12), r = b.r;
  elliptical(b, { c, R: 0.22, pa: 80, q: 0.8, a: 0.16, F: 0.28, n: 0.4, c0: hex('#fff0d8'), c1: GC.amber, halo: 0.5, nucleus: 0.7, gc: 30 });
  dustPatch(b, add(c, [0.02, -0.03, 0.06]), [0.07, 0.025, 0.01], 900, 0.5, 0.012);
  // tidal bridge from the arm tip to the companion, and the faint plume beyond it
  const tip = X(skyToDisc(R, pa, inc, near, tx, ty));
  b.curve([tip, add(tip, sky(25, 0.06, -0.04)), c], 3000, (t) => 0.012 + t * 0.03, (p, t) => b.glw(p, mix(GC.arm2, GC.old2, t), fluxI(0.005, 3000, 0.02), 0.02));
  b.curve([c, add(c, sky(330, 0.15, -0.05)), add(c, sky(300, 0.28, -0.1))], 2500, (t) => 0.03 + t * 0.06, (p, t) => b.glw(p, mix(GC.old2, GC.old, r()), fluxI(0.004, 2500, 0.04) * (1 - t * 0.6), 0.04));
}

function pinwheel(b: NB) {
  // M101: face-on, lopsided towards the east, many arms full of giant pink HII regions
  const pa = 39, inc = 18, near = 1, R = 0.95;
  const X = spiral(b, {
    R, pa, inc, near, pitch: 24, wind: 1, r0: 0.07, armW: 0.05, floc: 12,
    segs: [{ a: 20, r0: 0.07, r1: 1, w: 0.05, wt: 1 }, { a: 200, r0: 0.07, r1: 0.9, w: 0.05, wt: 1 }, { a: 110, r0: 0.25, r1: 0.85, w: 0.045, wt: 0.7 },
      { a: 285, r0: 0.3, r1: 0.95, w: 0.045, wt: 0.7 }, { a: 340, r0: 0.45, r1: 0.85, w: 0.04, wt: 0.5 }],
    bulge: 0.05, bulgeF: 0.03, discF: 0.13, armF: 0.28, h: 0.32, hii: 520, young: 1300, dust: 0.8, dustA: 0.5, lop: 0.25, lopAng: 81, nucleus: 0.8,
  });
  for (const [p, d, s, F] of [[95, 0.86, 0.03, 0.003], [140, 0.5, 0.025, 0.0022], [133, 0.58, 0.02, 0.0018], [210, 0.55, 0.02, 0.0015], [170, 0.62, 0.018, 0.0012], [60, 0.7, 0.018, 0.0012]] as const) {
    const [dx, dy] = sky(p, d);
    knot(b, X(skyToDisc(R, pa, inc, near, dx, dy)), s, F);
  }
}

function centaurusA(b: NB) {
  // giant elliptical crossed by a warped dust band (PA ~120°) lined with young blue stars and pink nebulae; radio jets / lobes NE–SW
  const bpa = 120, binc = 76, near = 1, nrm = discNormal(bpa, binc, near), Xb = skyXf(O, 0.3, bpa, binc, near), r = b.r, g = b.g;
  elliptical(b, { R: 0.62, pa: 35, q: 0.9, a: 0.22, F: 0.32, gc: 500, gcR: 0.55, nucleus: 0.4, halo: 1, split: nrm, c0: hex('#fff0dc'), c1: hex('#f2d2a8') });
  elliptical(b, { R: 0.75, pa: 35, q: 0.9, a: 0.4, F: 0.14, n: 0.35, gc: 0, nucleus: 0, halo: 0, split: nrm, c0: hex('#f6e2c8'), c1: hex('#e0c4a0') });
  const warp = (R: number, phi: number) => 0.16 * R * R * Math.sin(phi - 0.6) + 0.05 * R * Math.sin(2 * phi);
  for (let i = 0, N = b.n(15000); i < N; i++) {
    const R = 0.08 + 0.95 * Math.sqrt(r()), phi = r() * Math.PI * 2;
    b.dst(Xb([R * Math.cos(phi), R * Math.sin(phi), warp(R, phi) + g() * 0.03]), mix(GC.dust, GC.dust2, r()), (0.75 + r() * 0.3) * Math.min(1, (1.05 - R) * 4), 0.03);
  }
  // young stars and HII along the band
  for (let i = 0, N = b.n(4000); i < N; i++) {
    const R = 0.3 + r() * 0.65, phi = r() * Math.PI * 2, p = Xb([R * Math.cos(phi), R * Math.sin(phi), warp(R, phi) + g() * 0.04]);
    const e = () => b.glw(p, mix(GC.arm, GC.arm2, r()), fluxI(0.01, 5000, 0.012), 0.012);
    if (r() < 0.5) b.front(e); else e();
  }
  for (let i = 0, N = b.n(30); i < N; i++) {
    const R = 0.3 + r() * 0.55, phi = r() * Math.PI * 2, p = Xb([R * Math.cos(phi), R * Math.sin(phi), warp(R, phi)]);
    b.front(() => b.blob(30, p, [0.006, 0.006, 0.006], GC.hii, fluxI(0.00012, 30, 0.008), 0.008));
  }
  // the radio jet (NE) and the two lobes, faint orange-pink plumes
  jet(b, O, { pa: 55, r0: 0.02, r1: 0.42, z: 0.1, knots: 4, F: 0.0025, col: hex('#ffc0a0'), width: 0.01, n: 3000 });
  const lobeCol = (): C3 => mix(hex('#ffb070'), hex('#ff8a9a'), r() * 0.6);
  for (const [p, d0, d1, k] of [[55, 0.38, 0.92, 1], [235, 0.3, 0.85, 0.75]] as const) {
    const pts: V3[] = [sky(p, d0, 0.05 * k), sky(p + 6, (d0 + d1) / 2, 0.08 * k), sky(p - 4, d1, 0.1 * k)];
    b.curve(pts, 9000, (t) => 0.04 + Math.sin(Math.PI * Math.min(1, t * 1.1)) * 0.11, (q) => b.glw(q, lobeCol(), fluxI(0.04 * k, 9000, 0.05), 0.05));
  }
}

function m87(b: NB) {
  // giant elliptical with thousands of globular clusters and a blue-white jet to the WNW (drawn ~3× longer than real so it shows)
  elliptical(b, { R: 1, pa: 160, q: 0.92, q3: 0.95, a: 0.1, F: 0.12, gc: 4000, gcR: 0.3, nucleus: 0.45, halo: 1.2, c1: hex('#f8d8b0') });
  jet(b, O, { pa: 290, r0: 0.004, r1: 0.23, z: 0.6, knots: 6, F: 0.016, col: hex('#a8c8ff'), width: 0.005, n: 4000 });
  // the black hole's glowing ring (the Event Horizon Telescope image), tiny
  const r = b.r;
  b.front(() => { for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; b.glw([Math.cos(a) * 0.004, Math.sin(a) * 0.004, 0], mix(hex('#ff9a40'), hex('#ffd080'), r()), 0.6, 0.002); } });
}

// ------------------------------------------------------------------ galaxy clusters
type Mem = [x: number, y: number, R: number, type: MiniType | 'E+' | 'S+', pa: number, inc?: number];
/** Named members: 'E+' / 'S+' get a fuller model than the generic mini-galaxies. */
function members(b: NB, list: Mem[], zSpread = 0.25) {
  const g = b.g;
  for (const [x, y, R, t, pa, inc = 50] of list) {
    const c = v(x, y, g() * zSpread);
    if (t === 'E+') bigE(b, c, R, pa, 0.85);
    else if (t === 'S+') smallS(b, c, R, pa, inc);
    else mini(b, c, R, t, pa, inc, 1.3);
  }
}

function virgo(b: NB) {
  // M87 at the heart; Markarian's Chain to the NW; M49 to the south. Galaxies ~5× real size. Radius 1 = 7.5 million ly (8°)
  bigE(b, O, 0.05, 160, 0.92, 0.18, 120);
  members(b, [
    [0.174, 0.063, 0.032, 'E+', 125], [0.14, 0.071, 0.036, 'E+', 130], [0.095, 0.088, 0.016, 'S0', 15, 60], [0.0915, 0.079, 0.02, 'S', 30, 75],
    [0.058, 0.106, 0.012, 'E', 0], [0.055, 0.1, 0.014, 'S0', 0, 70], [0.03, 0.131, 0.018, 'E', 100], [0.024, 0.156, 0.016, 'S0', 0, 30],
    [0.03, -0.548, 0.045, 'E+', 140], [-0.393, -0.104, 0.036, 'E+', 105], [-0.342, -0.092, 0.022, 'E', 165], [-0.149, 0.021, 0.024, 'E', 0],
    [-0.183, 0.098, 0.04, 'S+', 45, 64], [-0.21, -0.071, 0.034, 'S+', 85, 40], [-0.0366, 0.254, 0.04, 'S+', 136, 63], [-0.14, 0.265, 0.03, 'S+', 105, 50],
    [0.366, 0.254, 0.034, 'S+', 0, 20], [0.241, 0.429, 0.045, 'S+', 160, 28], [0.519, 0.315, 0.036, 'S+', 153, 78], [0.165, 0.725, 0.034, 'S0', 0, 30],
  ]);
  cluster(b, {
    n: 240, size: 0.03, spirals: 0.65, Rmax: 0.98, stretch: [1, 1.15, 0.8],
    subs: [{ c: O, w: 1, core: 0.16 }, { c: v(0.03, -0.55, 0), w: 0.35, core: 0.1 }, { c: v(0.15, 0.07, 0), w: 0.25, core: 0.07 }],
    gasF: 0.035, gasSubs: [{ c: O, w: 1, core: 0.12 }, { c: v(0.03, -0.55, 0), w: 0.25, core: 0.07 }],
  });
}

function fornaxCl(b: NB) {
  // NGC 1399 (with its swarm of globulars) at the centre, NGC 1404 beside it, barred spiral NGC 1365 to the SW, Fornax A (NGC 1316) further SW
  elliptical(b, { R: 0.13, pa: 110, q: 0.9, a: 0.05, F: 0.18, n: 0.25, gc: 600, gcR: 0.45, nucleus: 0.7, halo: 1 });
  bigE(b, sky(120, 0.045, 0.02), 0.025, 160, 0.85);
  spiral(b, { c: sky(235, 0.33, 0.05), R: 0.1, pa: 32, inc: 50, arms: 2, pitch: 22, wind: 1, phase: 90, bar: 0.45, barAng: 60, r0: 0.4, bulge: 0.08, n: 0.16, discF: 0.12, armF: 0.3, dust: 1.2, hii: 40, nucleus: 0.6 });
  bigE(b, sky(225, 0.85, -0.1), 0.07, 50, 0.7, 0.16);
  dustPatch(b, add(sky(225, 0.85, -0.1), [0, 0, 0.03]), [0.025, 0.012, 0.005], 300, 0.45, 0.008);
  irregular(b, { c: sky(200, 0.2, 0.06), R: 0.035, pa: 60, q: 0.6, n: 0.1, clumps: 5, hii: 6, stars: 60, F: 0.14 });
  cluster(b, { n: 150, size: 0.035, spirals: 0.3, subs: [{ c: O, w: 1, core: 0.12 }], gasF: 0.012, gasR: 0.8 });
}

function normaCl(b: NB) {
  // the Great Attractor's rich cluster, seen through the Milky Way: reddened, dimmed and crowded with foreground stars
  const m = mark(b);
  bigE(b, O, 0.055, 120, 0.85, 0.18);
  bigE(b, sky(300, 0.12, 0.05), 0.03, 30, 0.8);
  // ESO 137-001: a "jellyfish" spiral trailing a long tail of stripped gas, away from the cluster centre
  const j = sky(150, 0.3, 0.05);
  smallS(b, j, 0.035, 60, 40);
  b.curve([j, add(j, sky(150, 0.12, 0)), add(j, sky(145, 0.28, -0.02))], 3000, (t) => 0.008 + t * 0.03, (p, t) => b.glw(p, mix(hex('#8aa8ff'), hex('#c08aff'), t), fluxI(0.004, 3000, 0.02) * (1 - t * 0.6), 0.02));
  cluster(b, { n: 330, size: 0.03, spirals: 0.3, subs: [{ c: O, w: 1, core: 0.17 }], gasF: 0.05, stretch: [1.1, 0.9, 1] });
  tint(b, m, [1, 0.62, 0.42]);
  foreground(b, 2600);
}

function centaurusCl(b: NB) {
  // NGC 4696 (with its curling dust filaments) at the centre, the Cen 45 subgroup around NGC 4709 to the east
  bigE(b, O, 0.06, 95, 0.75, 0.18, 80);
  const r = b.r, g = b.g;
  for (let k = 0; k < 3; k++) {
    const a0 = r() * Math.PI * 2, pts: V3[] = Array.from({ length: 5 }, (_, i) => v(Math.cos(a0 + i * 0.7) * (0.004 + i * 0.006), Math.sin(a0 + i * 0.7) * (0.004 + i * 0.006), 0.015 + g() * 0.003));
    b.curve(pts, 260, 0.0025, (p) => b.dst(p, GC.dust, 0.6, 0.006));
  }
  bigE(b, sky(90, 0.38, 0.05), 0.04, 110, 0.85, 0.16);
  smallS(b, sky(230, 0.25, -0.05), 0.04, 30, 55);
  cluster(b, {
    n: 290, size: 0.03, spirals: 0.35, subs: [{ c: O, w: 1, core: 0.15 }, { c: sky(90, 0.38), w: 0.4, core: 0.09 }],
    gasF: 0.045, gasSubs: [{ c: O, w: 1, core: 0.12 }, { c: sky(90, 0.38), w: 0.3, core: 0.08 }],
  });
}

function hydraCl(b: NB) {
  // the central pair NGC 3311 + NGC 3309, spiral NGC 3312 nearby
  bigE(b, O, 0.06, 30, 0.9, 0.18, 120);
  bigE(b, sky(70, 0.04, 0.03), 0.04, 50, 0.85, 0.16);
  smallS(b, sky(160, 0.1, 0.05), 0.045, 172, 72, { dust: 1.6 });
  cluster(b, { n: 270, size: 0.03, spirals: 0.4, subs: [{ c: O, w: 1, core: 0.16 }], gasF: 0.04 });
}

function antliaCl(b: NB) {
  // two dominant ellipticals, NGC 3268 (NE) and NGC 3258 (SW), each with its own subcluster
  const a = sky(40, 0.2), c = sky(220, 0.2, -0.05);
  bigE(b, a, 0.07, 70, 0.8, 0.17, 60);
  bigE(b, c, 0.06, 75, 0.85, 0.17, 50);
  cluster(b, { n: 150, size: 0.05, spirals: 0.35, subs: [{ c: a, w: 1, core: 0.12 }, { c, w: 0.8, core: 0.1 }], gasF: 0.018 });
}

function eridanusCl(b: NB) {
  // a loose, spiral-rich cluster still assembling from groups (around NGC 1407, NGC 1395 and NGC 1332)
  const g1 = sky(300, 0.4, 0.05), g2 = sky(130, 0.4, -0.08);
  bigE(b, g1, 0.05, 40, 0.95, 0.16);
  bigE(b, O, 0.045, 105, 0.85, 0.15);
  spiral(b, { c: g2, R: 0.05, pa: 115, inc: 78, arms: 2, pitch: 12, armF: 0.05, discF: 0.2, bulge: 0.18, bulgeF: 0.1, warm: 1, n: 0.06, hii: 0, young: 0, dust: 0.4 });
  for (const [p, d, R, pa2, inc] of [[60, 0.25, 0.05, 20, 45], [180, 0.35, 0.045, 140, 60], [250, 0.7, 0.04, 70, 35], [20, 0.6, 0.045, 100, 25]] as const) smallS(b, sky(p, d, b.g() * 0.2), R, pa2, inc);
  cluster(b, {
    n: 170, size: 0.045, spirals: 0.85, subs: [{ c: g1, w: 1, core: 0.12 }, { c: O, w: 0.8, core: 0.12 }, { c: g2, w: 0.7, core: 0.1 }], gasF: 0.008,
  });
}

// ------------------------------------------------------------------ galaxy groups
function m81Group(b: NB) {
  // M81 (big spiral), M82 (edge-on starburst blowing red hydrogen out of its poles) and NGC 3077, linked by streamers of gas.
  // True positions and sizes; radius 1 = 170,000 ly (50′)
  const r = b.r, m81 = v(0.414, -0.17, 0.02), m82 = v(0.382, 0.57, -0.06), n3077 = v(-0.414, -0.57, 0.04);
  spiral(b, {
    c: m81, R: 0.27, pa: 157, inc: 59, near: -1, arms: 2, pitch: 14, wind: 1, phase: 60, r0: 0.25, armW: 0.04, bulge: 0.2, bulgeF: 0.12,
    discF: 0.16, armF: 0.24, hii: 120, young: 400, dust: 0.9, dustA: 0.5, n: 0.55, nucleus: 0.9,
  });
  spiral(b, {
    c: m82, R: 0.11, pa: 65, inc: 80, arms: 2, pitch: 20, r0: 0.1, armF: 0.2, discF: 0.55, h: 0.35, bulge: 0.1, bulgeF: 0.06, warm: 0.1,
    dust: 1.6, dustA: 0.6, hii: 60, young: 120, n: 0.3, nucleus: 0, armCol: hex('#c8d4ff'), hiiCol: GC.ha, thick: 0.05,
  });
  // the starburst wind: red hydrogen filaments fanning out of both faces of M82
  b.front(() => {
    for (let k = 0; k < 28; k++) {
      const s = k % 2 ? 1 : -1, ang = 155 + (r() - 0.5) * 70, len = 0.06 + r() * 0.08, z = (r() - 0.5) * 0.06;
      const pts: V3[] = [add(m82, sky(ang, 0.006 * s, z * 0.2)), add(m82, sky(ang + (r() - 0.5) * 15, len * 0.5 * s, z * 0.6)), add(m82, sky(ang + (r() - 0.5) * 25, len * s, z))];
      b.curve(pts, 300, (t) => 0.002 + t * 0.006, (p, t) => b.glw(p, mix(GC.ha, hex('#ff7a8a'), r() * 0.5), fluxI(0.0001, 300, 0.008) * (1 - t * 0.6), 0.008));
    }
  });
  elliptical(b, { c: n3077, R: 0.055, pa: 45, q: 0.85, a: 0.15, F: 0.14, n: 0.12, nucleus: 0.4, halo: 0.5 });
  dustPatch(b, add(n3077, [0.005, -0.004, 0.03]), [0.012, 0.008, 0.004], 200, 0.4, 0.006);
  b.cluster(b.n(25), n3077, 0.012, 0.35, 2.5, [PAL.starB, PAL.starW]);
  // neutral-hydrogen streamers (shown as a faint blue haze) and a tidal dwarf along them
  const hi = (): C3 => mix(hex('#5a7ad8'), hex('#7ab0e0'), r());
  b.curve([m81, add(m81, v(0.1, 0.2, -0.05)), add(m82, v(0.08, -0.12, -0.03)), m82], 6000, 0.05, (p) => b.glw(p, hi(), fluxI(0.012, 6000, 0.05), 0.05));
  b.curve([m81, add(m81, v(-0.3, -0.05, 0.04)), add(n3077, v(0.2, 0.15, 0)), n3077], 7000, 0.06, (p) => b.glw(p, hi(), fluxI(0.014, 7000, 0.05), 0.05));
  b.curve([add(m81, v(0.25, -0.15, 0)), add(m81, v(0.15, -0.38, 0.02)), add(m81, v(-0.1, -0.42, 0.04))], 3000, 0.05, (p) => b.glw(p, hi(), fluxI(0.006, 3000, 0.05), 0.05));
  irregular(b, { c: add(m81, v(0.04, 0.17, 0)), R: 0.03, pa: 0, q: 0.7, n: 0.06, clumps: 4, hii: 3, stars: 40, F: 0.1 });
}

function leoTriplet(b: NB) {
  // M65, M66 and the edge-on "Hamburger" NGC 3628 with its long tidal tail to the east. True positions; radius 1 = 306,000 ly (30′)
  const r = b.r, c65 = v(0.533, -0.4, 0.05), c66 = v(-0.1, -0.6, -0.05), c3628 = v(-0.147, 0.6, 0);
  spiral(b, {
    c: c65, R: 0.165, pa: 174, inc: 76, near: -1, arms: 2, pitch: 9, r0: 0.25, armF: 0.12, discF: 0.24, bulge: 0.18, bulgeF: 0.1, warm: 0.7, h: 0.3,
    dust: 1.3, dustA: 0.6, hii: 15, young: 60, n: 0.3, nucleus: 0.7,
  });
  spiral(b, {
    c: c66, R: 0.15, pa: 173, inc: 65, arms: 2, pitch: 18, wind: 1, phase: 100, r0: 0.18, armW: 0.06, bulge: 0.15, bulgeF: 0.08, discF: 0.16, armF: 0.28,
    hii: 120, young: 200, dust: 1.3, dustA: 0.6, lop: 0.3, lopAng: 20, n: 0.3, nucleus: 0.8,
  });
  spiral(b, {
    c: c3628, R: 0.25, pa: 104, inc: 87, arms: 2, pitch: 15, r0: 0.2, armF: 0.14, discF: 0.26, h: 0.35, bulge: 0.14, bulgeF: 0.07, bulgeQ: 0.9, thick: 0.03,
    dust: 2.6, dustA: 0.85, hii: 30, young: 80, n: 0.35, nucleus: 0, warp: 0.04, warpAng: 90,
  });
  // tidal tail
  const t0 = add(c3628, sky(104, 0.22)), tail: V3[] = [t0, add(t0, sky(95, 0.15, 0.02)), add(t0, sky(85, 0.33, 0.05)), add(t0, sky(80, 0.5, 0.08))];
  b.curve(tail, 6000, (t) => 0.02 + t * 0.03, (p, t) => b.glw(p, mix(GC.arm2, GC.old2, r()), fluxI(0.005, 6000, 0.03) * (1 - t * 0.5), 0.03));
  b.curve(tail, 120, 0.03, (p) => b.star(p, PAL.starB, 0.3 + r() * 0.3, 2.5));
}

function sculptorGroup(b: NB) {
  // NGC 253, NGC 300, NGC 55, NGC 247 and NGC 7793 strung along our line of sight. Galaxies drawn 5× real size,
  // depth compressed; radius 1 = 2 million ly
  const P = (x: number, y: number, z: number): V3 => [(x - 0.47) / 2, (y - 0.54) / 2, (z - 0.1) * 0.25];
  spiral(b, { c: P(-0.68, 1.16, -0.9), R: 0.12, pa: 52, inc: 78, arms: 2, pitch: 16, r0: 0.2, bulge: 0.1, bulgeF: 0.06, discF: 0.22, armF: 0.16, warm: 0.35, dust: 2.2, dustA: 0.75, hii: 60, n: 0.22, nucleus: 0.6 });
  spiral(b, { c: P(-0.47, -0.7, 1.75), R: 0.12, pa: 111, inc: 40, arms: 2, pitch: 22, floc: 10, bulge: 0.04, bulgeF: 0.015, discF: 0.14, armF: 0.26, dust: 0.5, hii: 80, n: 0.2, nucleus: 0.5 });
  irregular(b, { c: P(0.387, -0.917, 1.55), R: 0.1, pa: 108, inc: 0, q: 0.2, q3: 0.5, bar: 0.6, clumps: 8, hii: 14, stars: 200, F: 0.14, n: 0.35, dust: 150 });
  spiral(b, { c: P(-0.66, 2.0, -0.75), R: 0.1, pa: 174, inc: 75, arms: 2, pitch: 20, floc: 6, bulge: 0.04, bulgeF: 0.015, discF: 0.13, armF: 0.2, hii: 40, lop: 0.2, lopAng: 180, n: 0.16, nucleus: 0.4 });
  spiral(b, { c: P(1.62, -0.33, -1.55), R: 0.07, pa: 98, inc: 50, arms: 2, pitch: 24, floc: 10, bulge: 0.04, bulgeF: 0.015, discF: 0.14, armF: 0.26, hii: 40, n: 0.14, nucleus: 0.4 });
  const r = b.r;
  for (let i = 0; i < 6; i++) mini(b, v((r() - 0.5) * 1.6, (r() - 0.5) * 1.6, (r() - 0.5) * 0.6), 0.02 + r() * 0.015, 'Irr', r() * 180, 30, 1.2);
}

function maffeiGroup(b: NB) {
  // Maffei 1 (elliptical), Maffei 2 (spiral), IC 342 (face-on spiral) and Dwingeloo 1, hidden behind the Milky Way's
  // dusty disc: reddened and dimmed, with crowded foreground stars. Galaxies ~2.5× real size; radius 1 = 1 million ly
  const m = mark(b);
  elliptical(b, { c: v(0.67, -0.67, 0.2), R: 0.12, pa: 85, q: 0.75, a: 0.2, F: 0.32, n: 0.3, nucleus: 0.6, halo: 0.8 });
  spiral(b, { c: v(0.552, -0.68, -0.25), R: 0.09, pa: 26, inc: 67, arms: 2, pitch: 20, bar: 0.25, bulge: 0.1, discF: 0.16, armF: 0.26, hii: 50, n: 0.22, nucleus: 0.5 });
  spiral(b, { c: v(0.22, -0.8, 0.05), R: 0.06, pa: 112, inc: 50, arms: 2, pitch: 22, bar: 0.3, bulge: 0.06, n: 0.1, nucleus: 0.3 });
  spiral(b, { c: v(-0.67, 0.8, 0), R: 0.15, pa: 0, inc: 31, arms: 2, pitch: 22, floc: 12, wind: 1, bulge: 0.06, bulgeF: 0.03, discF: 0.15, armF: 0.27, hii: 140, n: 0.35, nucleus: 0.8 });
  tint(b, m, [0.95, 0.5, 0.32]);
  foreground(b, 2200);
}

export const NEARBY: Record<string, GalaxyDef> = {
  dp_sombrero_galaxy: { f: sombrero, ext: 1e5 },
  dp_whirlpool_galaxy: { f: whirlpool, ext: 8.8e4 },
  dp_pinwheel_galaxy: { f: pinwheel, ext: 1.8e5 },
  dp_centaurus_a: { f: centaurusA, ext: 1.8e5 },
  dp_m87_black_hole: { f: m87, ext: 1.5e5 },
  dp_virgo_cluster: { f: virgo, ext: 1.5e7 },
  dp_fornax_cluster: { f: fornaxCl, ext: 8e6 },
  dp_norma_cluster: { f: normaCl, ext: 1e7 },
  dp_centaurus_cluster: { f: centaurusCl, ext: 1e7 },
  dp_hydra_cluster: { f: hydraCl, ext: 1e7 },
  dp_antlia_cluster: { f: antliaCl, ext: 4e6 },
  dp_eridanus_cluster: { f: eridanusCl, ext: 8e6 },
  dp_m81_group: { f: m81Group, ext: 3.4e5 },
  dp_leo_triplet: { f: leoTriplet, ext: 6.1e5 },
  dp_sculptor_group: { f: sculptorGroup, ext: 4e6 },
  dp_maffei_group: { f: maffeiGroup, ext: 2e6 },
};
