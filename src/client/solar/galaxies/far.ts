/**
 * Universe-scale objects: distant rich clusters (Coma, Phoenix, the Bullet Cluster, El Gordo), quasars (3C 273, TON 618)
 * and the youngest galaxies seen by JWST (GN-z11, JADES-GS-z14-0).
 * Frame: +Z towards Earth, +Y north, −X east. Cluster members are drawn larger than life so they stay visible.
 */
import { PAL, add, hex, makeNoise3, mix, smooth, unitRand, type C3, type NB, type V3 } from '../nebulae/core.ts';
import { DEG, GC, O, cluster, elliptical, fluxI, gas, mark, plummer, quasar, seed, sky, tint } from './generic.ts';
import type { GalaxyDef } from './generic-models.ts';

const v = (x: number, y: number, z = 0): V3 => [x, y, z];
const bcg = (b: NB, c: V3, R: number, pa: number, q: number, F: number, gc = 0) =>
  elliptical(b, { c, R, pa, q, a: 0.12, F, n: 0.2, nucleus: 0.5, halo: 1, gc, gcR: 0.5 });

// ------------------------------------------------------------------ rich clusters
function coma(b: NB) {
  // over 1000 galaxies, mostly ellipticals; the giant pair NGC 4889 (east) and NGC 4874 (west) at the centre, the NGC 4839 group falling in
  // from the SW, all bathed in hot X-ray gas. Galaxies ~4× real size. Radius 1 = 10 million ly
  bcg(b, v(-0.045, 0.01, 0.02), 0.045, 80, 0.7, 0.2, 60);
  bcg(b, v(0.04, -0.005, -0.02), 0.04, 150, 0.9, 0.18, 60);
  bcg(b, sky(225, 0.5, 0.05), 0.03, 60, 0.6, 0.16);
  cluster(b, {
    n: 550, size: 0.022, spirals: 0.12, subs: [{ c: O, w: 1, core: 0.18 }, { c: sky(225, 0.5), w: 0.12, core: 0.06 }],
    gasF: 0.06, gasSubs: [{ c: O, w: 1, core: 0.15 }, { c: sky(225, 0.5), w: 0.1, core: 0.06 }],
  });
}

function phoenix(b: NB) {
  // its central galaxy is forming hundreds of stars a year: blue-violet filaments around a bright active nucleus, inside a very
  // compact, cool-cored cloud of X-ray gas. Galaxies ~5× real size. Radius 1 = 5 million ly
  const r = b.r, g = b.g;
  bcg(b, O, 0.08, 20, 0.8, 0.22, 80);
  b.front(() => {
    for (let k = 0; k < 16; k++) {
      const a = r() * 360, L = 0.06 + r() * 0.12, z = g() * 0.03, bend = (r() - 0.5) * 40;
      const pts: V3[] = [sky(a, 0.008, z * 0.3), sky(a + bend * 0.5, L * 0.5, z * 0.7), sky(a + bend, L, z)];
      b.curve(pts, 500, (t) => 0.003 + t * 0.006, (p, t) => b.glw(p, mix(hex('#7a9cff'), hex('#c08cff'), r()), fluxI(0.0018, 500, 0.008) * (1 - t * 0.5), 0.008));
      b.blob(40, pts[1], [0.005, 0.005, 0.005], hex('#d0dcff'), fluxI(0.0002, 40, 0.006), 0.006);
    }
  });
  b.star(O, hex('#e8eeff'), 1.4, 26, 1);
  const m = mark(b);
  cluster(b, { n: 280, size: 0.028, spirals: 0.2, subs: [{ c: O, w: 1, core: 0.14 }], gasF: 0.05, gasSubs: [{ c: O, w: 1, core: 0.07 }], cols: { old: hex('#ffbf8a'), arm: hex('#c0b8ff') } });
  tint(b, m, [1, 0.9, 0.82]);
}

/** Points filling (thick > 0) or lining (thick ≈ 0) a paraboloid opening towards −X with its apex at `apex`. */
function paraboloid(b: NB, n: number, apex: V3, k: number, rho: number, depth: number, f: (p: V3, fade: number) => void) {
  const r = b.r;
  for (let i = 0, N = b.n(n); i < N; i++) {
    const s = rho * Math.sqrt(r()), a = r() * Math.PI * 2, y = s * Math.cos(a), z = s * Math.sin(a);
    f([apex[0] - k * s * s - r() * depth, apex[1] + y, apex[2] + z * 0.8], 1 - s / rho);
  }
}

function bullet(b: NB) {
  // two clusters that collided ~150 million years ago. The galaxies (and the invisible dark matter, blue) passed through; the hot gas
  // (pink, X-rays) was slowed, and the small cluster's gas forms a bullet with a bow shock ahead of it, moving west.
  // Radius 1 = 3 million ly; galaxies ~3× real size
  const r = b.r, g = b.g, main = v(-0.36, 0.02, 0), sub = v(0.42, -0.02, 0.02);
  const m = mark(b);
  bcg(b, add(main, v(-0.02, 0.03, 0)), 0.04, 120, 0.75, 0.16);
  bcg(b, sub, 0.035, 90, 0.85, 0.16);
  cluster(b, { n: 380, size: 0.025, spirals: 0.25, Rmax: 0.98, subs: [{ c: main, w: 1, core: 0.13 }, { c: sub, w: 0.5, core: 0.07 }], cols: { old: hex('#ffd2a0') } });
  tint(b, m, [1, 0.95, 0.9]);
  // dark matter (from gravitational lensing), centred on the galaxies
  gas(b, [{ c: main, w: 1, core: 0.17 }, { c: sub, w: 0.55, core: 0.11 }], 0.05, GC.dm, 1);
  // the main cluster's hot gas, lagging between the two
  const pink = (): C3 => mix(GC.xpink, hex('#ff9ad8'), r() * 0.6);
  gas(b, [{ c: v(-0.08, 0.02, 0), w: 1, core: 0.12 }], 0.045, GC.xpink, 1);
  b.blob(3000, v(-0.1, 0.03, 0), [0.11, 0.09, 0.09], pink, fluxI(0.012, 3000, 0.04), 0.04);
  // the bullet (dense cool gas) and its bow shock
  paraboloid(b, 5000, v(0.33, -0.01, 0), 4, 0.1, 0.08, (p, f) => b.glw(p, mix(hex('#ffd0ee'), GC.xpink, 1 - f), fluxI(0.016, 5000, 0.015) * (0.5 + f), 0.015));
  paraboloid(b, 4000, v(0.385, -0.01, 0), 2.6, 0.28, 0.01, (p, f) => b.glw(p, pink(), fluxI(0.006, 4000, 0.02) * f, 0.02));
  b.blob(1500, v(0.12, -0.01, 0), [0.14, 0.07, 0.07], pink, fluxI(0.006, 1500, 0.04), 0.04);
  for (let i = 0, N = b.n(400); i < N; i++) b.glw(v(0.34 + g() * 0.006, -0.01 + g() * 0.01, g() * 0.01), hex('#fff0fa'), fluxI(0.002, 400, 0.008), 0.008);
}

function elGordo(b: NB) {
  // "the fat one": a huge young cluster made of two merging clumps (NW and SE). Its X-ray gas is shaped like a comet with a bright
  // head in the SE and a twin tail towards the NW; giant radio relics (orange arcs) mark shock waves at both ends.
  // Radius 1 = 5 million ly; galaxies ~4× real size
  const r = b.r, g = b.g, se = sky(135, 0.28, 0.03), nw = sky(315, 0.3, -0.03);
  const m = mark(b);
  bcg(b, se, 0.04, 140, 0.7, 0.17);
  bcg(b, nw, 0.035, 120, 0.8, 0.15);
  cluster(b, { n: 380, size: 0.024, spirals: 0.15, Rmax: 0.98, subs: [{ c: se, w: 0.8, core: 0.11 }, { c: nw, w: 1, core: 0.14 }], cols: { old: hex('#ffbe8a') } });
  tint(b, m, [1, 0.88, 0.78]);
  gas(b, [{ c: se, w: 0.7, core: 0.13 }, { c: nw, w: 1, core: 0.16 }], 0.025, GC.dm, 1);
  // comet-shaped X-ray gas
  const head = sky(135, 0.2), tailDir = sky(315, 1);
  b.blob(2500, head, [0.06, 0.06, 0.06], () => mix(hex('#ffc0e8'), GC.xpink, r()), fluxI(0.012, 2500, 0.03), 0.03);
  for (const side of [-1, 1]) {
    const perp = sky(45, 0.07 * side);
    const pts: V3[] = [head, add(add(head, tailDir, 0.2), perp, 0.6), add(add(head, tailDir, 0.45), perp, 1.1)];
    b.curve(pts, 3500, (t) => 0.04 + t * 0.05, (p, t) => b.glw(p, mix(GC.xpink, GC.xray, t), fluxI(0.01, 3500, 0.04) * (1 - t * 0.6), 0.04));
  }
  gas(b, [{ c: sky(135, 0.05), w: 1, core: 0.13 }], 0.03, mix(GC.xpink, GC.xray, 0.5), 1);
  // radio relics: thin arcs perpendicular to the merger axis, at both ends
  for (const [a, d, L, F] of [[135, 0.78, 0.55, 0.012], [315, 0.72, 0.35, 0.007]] as const) {
    const c = sky(a, d), along = sky(a + 90, 1), out = sky(a, 1), pts: V3[] = [];
    for (let i = 0; i <= 6; i++) { const t = i / 6 - 0.5; pts.push(add(add(c, along, t * L), out, -((t * L) ** 2) * 0.9 + g() * 0.01)); }
    b.curve(pts, 4000, 0.018, (p) => b.glw(p, mix(hex('#ff9a50'), hex('#ffc070'), r()), fluxI(F, 4000, 0.02), 0.02));
  }
}

// ------------------------------------------------------------------ quasars
function q3c273(b: NB) {
  // the first quasar ever identified: a brilliant point (drawn with diffraction spikes) in a faint elliptical host, with a straight
  // one-sided jet to the SW. Radius 1 = 220,000 ly
  quasar(b, { I: 2.6, px: 70, host: 0.25, hostF: 0.2, jet: { pa: 222, r0: 0.54, r1: 0.9, z: 0.15, knots: 6, F: 0.0035, col: hex('#b0c4ff'), width: 0.008, n: 5000 } });
  // wide, faint diffraction cross (as in Hubble images)
  b.star(O, hex('#dce6ff'), 0.8, 260, 1.2);
}

function ton618(b: NB) {
  // one of the most massive black holes known (66 billion Suns), its quasar lighting up a giant glowing nebula of hydrogen
  // (Lyman-alpha) fed by cold gas streams. Radius 1 = 175,000 ly
  const r = b.r, g = b.g, nz = makeNoise3(seed(b));
  const col = (p: V3): C3 => mix(hex('#6f7cff'), hex('#5ec8d8'), smooth(0.35, 0.65, nz(p[0] * 2 + 5, p[1] * 2, p[2] * 2, 3)));
  for (let i = 0, N = b.n(26000), t = 0; i < N && t < N * 6; t++) {
    const d = plummer(r(), 0.26), u = unitRand(r), p: V3 = [u[0] * d, u[1] * d * 0.85, u[2] * d * 0.9];
    if (d > 0.95) continue;
    const k = smooth(0.42, 0.62, nz(p[0] * 3.2, p[1] * 3.2, p[2] * 3.2, 4));
    if (r() > 0.15 + k) continue;
    b.glw(p, col(p), fluxI(0.08, 26000, 0.03) * (0.3 + k), 0.03);
    i++;
  }
  for (let k = 0; k < 5; k++) {
    const a = k * 72 + g() * 20, z = g() * 0.3, sw = (r() < 0.5 ? 1 : -1) * (20 + r() * 25);
    const pts: V3[] = [sky(a, 0.95, z), sky(a + sw * 0.5, 0.65, z * 0.6), sky(a + sw, 0.4, z * 0.3), sky(a + sw * 1.3, 0.2, 0)];
    b.curve(pts, 2500, (t) => 0.035 - t * 0.015, (p, t) => b.glw(p, col(p), fluxI(0.0022, 2500, 0.03) * (0.3 + t * 0.7), 0.03));
  }
  b.hz(O, hex('#7a86ff'), 0.25, 0.4, 0.4);
  quasar(b, { I: 3, px: 56, host: 0.12, hostF: 0.015 });
}

// ------------------------------------------------------------------ the first galaxies (JWST)
function infant(b: NB, q: number, pa: number, clumps: number, R: number) {
  // tiny, dense and clumpy, glowing orange-red (its blue light stretched to infrared by the expansion of the universe)
  const r = b.r, g = b.g, ca = Math.cos(pa * DEG), sa = Math.sin(pa * DEG);
  const P = (x: number, y: number, z: number): V3 => [-sa * x - ca * y, ca * x - sa * y, z];
  const cols = (): C3 => mix(hex('#ff9a5a'), hex('#ffcf8a'), r() * r());
  for (let i = 0, N = b.n(16000); i < N; i++) {
    const d = plummer(r(), 0.11 * R), u = unitRand(r);
    if (d > 0.95) { i--; continue; }
    b.glw(P(u[0] * d, u[1] * d * q, u[2] * d * q), cols(), fluxI(0.12, 16000, 0.03), 0.03);
  }
  for (let k = 0; k < clumps; k++) {
    const x = g() * 0.2 * R, y = g() * 0.2 * R * q, z = g() * 0.15 * R * q, c = P(x, y, z), s = (0.035 + r() * 0.045) * R;
    b.blob(1500, c, [s, s, s], () => mix(hex('#ffb070'), hex('#ffe0b0'), r()), fluxI(0.02 + r() * 0.02, 1500, 0.02), 0.02);
    b.front(() => b.star(c, mix(hex('#ffd8a8'), PAL.white, 0.4), 0.45 + r() * 0.35, 3 + r() * 3, 0));
  }
  b.hz(O, hex('#ff8a50'), 0.06, 0.5 * R, 0.25);
  b.star(O, hex('#ffe2c0'), 0.7, 6, 0);
}

export const FAR: Record<string, GalaxyDef> = {
  dp_coma_cluster: { f: coma, ext: 2e7 },
  dp_phoenix_cluster: { f: phoenix, ext: 1e7 },
  dp_bullet_cluster: { f: bullet, ext: 6e6 },
  dp_el_gordo: { f: elGordo, ext: 1e7 },
  dp_3c_273: { f: q3c273, ext: 4.4e5 },
  dp_ton_618: { f: ton618, ext: 3.5e5 },
  dp_gn_z11: { f: (b) => infant(b, 0.75, 30, 4, 1), ext: 4e3 },
  dp_jades_gs_z14_0: { f: (b) => infant(b, 0.45, 100, 3, 1), ext: 3e3 },
};
