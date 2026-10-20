/**
 * Local Group members: Andromeda, Triangulum, the Magellanic Clouds and the dwarf galaxies.
 * Frame: +Z towards Earth, +Y north, −X east; position angles and inclinations from the literature.
 */
import { PAL, add, hex, mix, type NB, type V3 } from '../nebulae/core.ts';
import { DEG, GC, O, dsph, elliptical, fluxI, irregular, mini, sky, skyToDisc, spiral } from './generic.ts';
import type { GalaxyDef } from './generic-models.ts';

/** A giant HII region: pink glow with a white-hot cluster of young stars in it. */
export function knot(b: NB, c: V3, s: number, F: number, col = GC.hii) {
  const r = b.r;
  b.blob(900, c, [s, s, s * 0.7], () => mix(col, GC.hii2, r() * 0.6), fluxI(F * 0.6, 900, s * 0.6), s * 0.6);
  b.blob(400, c, [s * 0.35, s * 0.35, s * 0.3], () => mix(GC.hii2, PAL.white, r() * 0.5), fluxI(F * 0.4, 400, s * 0.3), s * 0.3);
  b.cluster(b.n(40), c, s * 0.25, 0.45, 3, [PAL.starB, PAL.starB, PAL.starW]);
  b.hz(c, col, F * 0.25 / (4 * s * s), s * 2, 0.6);
}

/** Resolved giant stars sprinkled over a smooth elliptical (nearby dwarf ellipticals are part-resolved). */
function resolved(b: NB, n: number, pa: number, q: number, a: number, bright = 0.7) {
  dsph(b, { R: 1, pa, q, a, stars: n, F: 0.008, bright });
}

/** Dusty patches near the centre of a dwarf elliptical (NGC 185, M110). */
function patches(b: NB, n: number, R: number, k = 1) {
  const r = b.r, g = b.g;
  for (let p = 0; p < n; p++) {
    const c: V3 = [g() * R, g() * R, 0.02 + r() * 0.05], s = 0.02 + r() * 0.03;
    for (let i = 0, N = b.n(60 * k); i < N; i++) b.dst(add(c, [g() * s, g() * s * 0.6, g() * s * 0.3]), mix(GC.dust, GC.dust2, r()), 0.25 + r() * 0.2, 0.02);
  }
}

// ------------------------------------------------------------------ big spirals
function m31(b: NB) {
  // PA 38°, inclination 77°, NW side nearer; dusty star-forming ring at ~10 kpc; faint hints of M32 and M110
  spiral(b, {
    R: 0.93, pa: 38, inc: 77, near: -1, arms: 2, pitch: 8, wind: 1, phase: 30, r0: 0.18, armW: 0.05, floc: 6,
    bulge: 0.2, bulgeF: 0.15, bulgeQ: 0.7, discF: 0.3, armF: 0.13, h: 0.3, thick: 0.016,
    ring: [0.46, 0.035], ringF: 0.05, dust: 0.75, dustA: 0.45, hii: 120, young: 600, warp: 0.05, warpAng: 0, nucleus: 0.9,
  });
  mini(b, sky(172, 0.25, 0.06), 0.028, 'E', 170, 0, 1.6);
  mini(b, sky(318, 0.36, -0.08), 0.06, 'E', 170, 0, 0.45);
}

function m33(b: NB) {
  // PA 23°, inclination 54°; flocculent arms, almost no bulge, a bright nucleus and the giant HII region NGC 604
  const R = 0.95, pa = 23, inc = 54, near = 1;
  const X = spiral(b, {
    R, pa, inc, near, arms: 2, pitch: 30, wind: -1, phase: 200, r0: 0.1, armW: 0.075, floc: 24,
    bulge: 0.05, bulgeF: 0.015, discF: 0.2, armF: 0.24, h: 0.3, hii: 300, young: 900, dust: 0.35, dustA: 0.4, nucleus: 0.8,
  });
  const [dx, dy] = sky(51, 0.33);
  knot(b, X(skyToDisc(R, pa, inc, near, dx, dy)), 0.025, 0.0035);
}

function lmc(b: NB) {
  // PA 170°, inclination 34°, NE side nearer; off-centre bar, one dominant arm from the 30 Doradus end, Tarantula Nebula
  const R = 0.95, pa = 170, inc = 34, near = -1, [tx, ty] = sky(61, 0.26), t = skyToDisc(R, pa, inc, near, tx, ty), a = Math.atan2(t[1], t[0]) / DEG;
  const X = spiral(b, {
    R, pa, inc, near, segs: [{ a, r0: 0.3, r1: 0.95, w: 0.14, wt: 1 }], pitch: 30, wind: -1, floc: 5,
    bar: 0.4, barAng: -55, barOff: [-0.04, 0.06], bulge: 0, discF: 0.28, armF: 0.1, h: 0.32, thick: 0.04, hii: 220, young: 1100, dust: 0.12, dustA: 0.25, nucleus: 0,
    lop: 0.12, lopAng: a,
  });
  knot(b, X(t), 0.05, 0.012);
  for (const [p, d] of [[30, 0.5], [95, 0.55], [200, 0.45], [120, 0.18], [330, 0.4]] as const) knot(b, sky(p, d, b.g() * 0.04), 0.018, 0.0015);
}

function smc(b: NB) {
  // seen almost end-on (long axis along our line of sight), the Wing reaches east towards the LMC
  irregular(b, { R: 0.62, pa: 45, q: 0.62, q3: 1.55, clumps: 14, hii: 50, stars: 900, F: 0.14, oldF: 0.14, pink: 0.6 });
  irregular(b, { c: sky(112, 0.55, 0.12), R: 0.3, pa: 120, q: 0.5, q3: 0.6, clumps: 5, hii: 12, stars: 250, F: 0.03, oldF: 0.01 });
  const r = b.r;
  b.curve([sky(100, 0.4, 0.05), sky(110, 0.7, 0.15), sky(112, 1.0, 0.25)], 2500, 0.07, (p) => b.glw(p, mix(GC.arm, GC.arm2, r()), fluxI(0.004, 2500, 0.03), 0.03));
  knot(b, sky(20, 0.25, 0.2), 0.03, 0.002);
}

// ------------------------------------------------------------------ dwarf ellipticals
function m32(b: NB) {
  elliptical(b, { R: 1, pa: 170, q: 0.75, a: 0.06, F: 0.12, nucleus: 1.1, halo: 0.6 });
  resolved(b, 400, 170, 0.75, 0.25, 0.5);
}
function m110(b: NB) {
  elliptical(b, { R: 1, pa: 170, q: 0.5, a: 0.24, F: 0.16, gc: 8, gcR: 0.45, nucleus: 0.5, halo: 0 });
  resolved(b, 1400, 170, 0.5, 0.35);
  patches(b, 3, 0.08, 0.5);
  b.cluster(b.n(25), O, 0.08, 0.4, 3, [PAL.starB, PAL.starW]);
}
function ngc185(b: NB) {
  elliptical(b, { R: 1, pa: 35, q: 0.85, a: 0.22, F: 0.14, gc: 8, gcR: 0.5, nucleus: 0.4 });
  resolved(b, 1800, 35, 0.85, 0.32);
  patches(b, 2, 0.06, 0.5);
  b.cluster(b.n(20), O, 0.06, 0.4, 3, [PAL.starB, PAL.starW]);
}
function ngc147(b: NB) {
  elliptical(b, { R: 1, pa: 25, q: 0.6, a: 0.26, F: 0.12, gc: 10, gcR: 0.55, nucleus: 0.25, halo: 0 });
  resolved(b, 2200, 25, 0.6, 0.36);
}

// ------------------------------------------------------------------ dwarf irregulars
function ic10(b: NB) {
  // the Local Group's starburst galaxy: crowded pink HII regions, reddened by the Milky Way's dust
  irregular(b, { R: 1, pa: 130, q: 0.75, q3: 0.5, clumps: 11, hii: 70, stars: 900, F: 0.16, oldF: 0.06, pink: 1.4, dust: 600, col: hex('#a8b4ff'), col2: hex('#f0d8e8') });
  for (const [p, d] of [[20, 0.25], [300, 0.3], [160, 0.15]] as const) knot(b, sky(p, d, b.g() * 0.1), 0.06, 0.004, GC.ha);
}
function ngc6822(b: NB) {
  // Barnard's Galaxy: a north–south bar of stars with bright HII regions (Hubble V, X) at its northern end
  irregular(b, { R: 1, pa: 10, q: 0.55, q3: 0.4, bar: 0.75, clumps: 10, hii: 40, stars: 1100, F: 0.14, oldF: 0.07, pink: 0.6 });
  for (const [p, d, s] of [[350, 0.42, 0.05], [5, 0.55, 0.035], [330, 0.62, 0.04], [20, 0.3, 0.025]] as const) knot(b, sky(p, d, b.g() * 0.08), s, 0.003);
}
function ic1613(b: NB) {
  irregular(b, { R: 1, pa: 58, q: 0.85, q3: 0.5, clumps: 9, hii: 30, stars: 1200, F: 0.09, oldF: 0.06, pink: 0.5 });
  for (const [p, d] of [[40, 0.35], [60, 0.45]] as const) knot(b, sky(p, d, 0), 0.05, 0.002);
}
function wlm(b: NB) {
  irregular(b, { R: 1, pa: 4, q: 0.35, q3: 0.3, clumps: 15, hii: 20, stars: 1000, F: 0.08, oldF: 0.06, pink: 0.4 });
}
function phoenix(b: NB) {
  // a transition dwarf: an old spheroid with a little young blue core, and a neutral gas cloud drifting to the south-west
  dsph(b, { R: 1, pa: 5, q: 0.75, a: 0.3, stars: 2600, F: 0.024, young: 0.15 });
  b.cluster(b.n(160), sky(60, 0.08), 0.07, 0.6, 3.5, [PAL.starB, PAL.starW, PAL.starB]);
  b.blob(2500, sky(60, 0.08), [0.09, 0.07, 0.07], () => mix(GC.arm, GC.arm2, b.r()), fluxI(0.006, 2500, 0.03), 0.03);
  b.blob(3000, sky(225, 0.55, -0.1), [0.25, 0.16, 0.2], hex('#6a8ad8'), fluxI(0.002, 3000, 0.07), 0.07);
}
function pegasus(b: NB) {
  irregular(b, { R: 1, pa: 122, q: 0.5, q3: 0.35, clumps: 6, hii: 6, stars: 900, F: 0.05, oldF: 0.06, pink: 0.2 });
}

// ------------------------------------------------------------------ dwarf spheroidals
const gcAt = (p: [number, number], s = 0.012, n = 120) => ({ p: [p[0], p[1], 0] as V3, s, n });
const leoI = (b: NB) => dsph(b, { R: 1, pa: 79, q: 0.79, a: 0.28, stars: 5000, F: 0.032 });
const leoII = (b: NB) => dsph(b, { R: 1, pa: 12, q: 0.93, a: 0.3, stars: 2600, F: 0.016 });
const sculptor = (b: NB) => dsph(b, { R: 1, pa: 99, q: 0.68, a: 0.33, stars: 4800, F: 0.024 });
const fornaxD = (b: NB) => dsph(b, {
  R: 1, pa: 41, q: 0.7, a: 0.36, stars: 8000, F: 0.04, young: 0.03,
  gcs: [gcAt([0.62, 0.45], 0.01, 70), gcAt([0.45, -0.42], 0.012, 100), gcAt([-0.05, -0.15], 0.014, 160), gcAt([0.12, 0.05], 0.012, 140), gcAt([-0.55, -0.35], 0.012, 110), gcAt([-0.2, 0.18], 0.01, 70)],
});
const draco = (b: NB) => dsph(b, { R: 1, pa: 89, q: 0.69, a: 0.28, stars: 3000, F: 0.012 });
function ursaMinor(b: NB) {
  dsph(b, { R: 1, pa: 50, q: 0.44, a: 0.32, stars: 2800, F: 0.012 });
  b.cluster(b.n(160), sky(230, 0.18), 0.05, 0.3, 2.5, [PAL.starY, PAL.starY, PAL.starR, PAL.starW]);
}
const carina = (b: NB) => dsph(b, { R: 1, pa: 65, q: 0.67, a: 0.3, stars: 2600, F: 0.01, young: 0.04 });
const sextans = (b: NB) => dsph(b, { R: 1, pa: 56, q: 0.65, a: 0.45, stars: 2600, F: 0.008, bright: 0.85 });
const andII = (b: NB) => dsph(b, { R: 1, pa: 34, q: 0.8, a: 0.32, stars: 3600, F: 0.016 });

function sagittarius(b: NB) {
  // tidally stretched body behind the Milky Way's bulge, stars streaming off both ends, M54 at its heart
  const r = b.r, pa = 104;
  dsph(b, { R: 0.45, pa, q: 0.32, q3: 0.5, a: 0.4, stars: 4000, F: 0.02, gcs: [{ p: O, s: 0.01, n: 400 }, gcAt([0.5, 0.1]), gcAt([-0.35, -0.05]), gcAt([0.7, -0.08])] });
  const cols = [PAL.starY, PAL.starY, PAL.starR, PAL.starW];
  for (const s of [1, -1]) {
    const pts: V3[] = [sky(pa, 0.4 * s), sky(pa + 8 * s, 0.65 * s, 0.12 * s), sky(pa + 18 * s, 0.85 * s, 0.32 * s), sky(pa + 30 * s, 0.95 * s, 0.6 * s)];
    b.curve(pts, 1800, (t) => 0.03 + t * 0.06, (p, t) => b.star(p, cols[Math.floor(r() * 4)], (0.2 + r() ** 5 * 0.7) * (1 - t * 0.5), 2 + r() ** 5 * 3));
    b.curve(pts, 2500, (t) => 0.04 + t * 0.08, (p, t) => b.glw(p, mix(GC.old2, GC.old, r()), fluxI(0.0025, 2500, 0.06) * (1 - t * 0.7), 0.06));
  }
  b.blob(600, O, [0.006, 0.006, 0.006], GC.old2, fluxI(0.0015, 600, 0.008), 0.008);
}
function canisMajor(b: NB) {
  // a diffuse overdensity of old stars lost in the Milky Way's disc, with its globular clusters
  dsph(b, {
    R: 1, pa: 75, q: 0.5, q3: 0.45, a: 0.45, stars: 3600, F: 0.016, bright: 0.85,
    gcs: [gcAt([0.35, 0.1], 0.012, 120), gcAt([-0.4, 0.15], 0.012, 110), gcAt([0.15, -0.3], 0.01, 80), gcAt([-0.1, 0.32], 0.014, 160)],
  });
  const r = b.r;
  for (let i = 0, N = b.n(600); i < N; i++) b.star([(r() * 2 - 1) * 1.05, (r() * 2 - 1) * 0.7, (r() * 2 - 1) * 0.8], [PAL.starW, PAL.starB, PAL.starY][Math.floor(r() * 3)], 0.15 + r() ** 4 * 0.5, 2 + r() ** 4 * 3);
}

export const LOCAL: Record<string, GalaxyDef> = {
  dp_m31: { f: m31, ext: 1.7e5 },
  dp_m33: { f: m33, ext: 6.4e4 },
  dp_lmc: { f: lmc, ext: 3.4e4 },
  dp_smc: { f: smc, ext: 2.5e4 },
  dp_m32: { f: m32, ext: 6.5e3 },
  dp_m110: { f: m110, ext: 1.7e4 },
  dp_ngc_185: { f: ngc185, ext: 8e3 },
  dp_ngc_147: { f: ngc147, ext: 1e4 },
  dp_ic_10: { f: ic10, ext: 5e3 },
  dp_ngc_6822: { f: ngc6822, ext: 7e3 },
  dp_ic_1613: { f: ic1613, ext: 1.1e4 },
  dp_wlm: { f: wlm, ext: 1.1e4 },
  dp_phoenix_dwarf: { f: phoenix, ext: 4e3 },
  dp_pegasus_dwarf: { f: pegasus, ext: 5e3 },
  dp_leo_i: { f: leoI, ext: 3e3 },
  dp_leo_ii: { f: leoII, ext: 1.8e3 },
  dp_sculptor_dwarf: { f: sculptor, ext: 5e3 },
  dp_fornax_dwarf: { f: fornaxD, ext: 1e4 },
  dp_draco_dwarf: { f: draco, ext: 3.5e3 },
  dp_ursa_minor_dwarf: { f: ursaMinor, ext: 3.5e3 },
  dp_carina_dwarf: { f: carina, ext: 3e3 },
  dp_sextans_dwarf: { f: sextans, ext: 8e3 },
  dp_andromeda_ii: { f: andII, ext: 4e3 },
  dp_sagittarius_dwarf: { f: sagittarius, ext: 6e4 },
  dp_canis_major_dwarf: { f: canisMajor, ext: 2e4 },
};
