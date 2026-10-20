/** Supernova remnants and planetary nebulae: shells, rings, cages and filament nets. */
import { NB, PAL, add, clamp, hex, makeNoise3, mix, norm, perp, rot, scale, smooth, unitRand, type C3, type V3 } from './core.ts';

const DEG = Math.PI / 180;

/** Crab Nebula (M1): prolate cage of red/orange/yellow filaments round a blue-white synchrotron cloud, pulsar wind torus + jet. */
function crab(b: NB) {
  const r = b.r, xf = rot(0, 18, 34), A: V3 = [1, 0.66, 0.62];
  const fil = [hex('#ff3a26'), hex('#ff5a2a'), hex('#ff8a3a'), hex('#ffb24a'), hex('#ffd060'), hex('#e8e070')];
  // synchrotron nebula: blue-white haze filling the cage
  for (let i = 0; i < 30; i++) b.hz(xf([b.g() * 0.38, b.g() * 0.24, b.g() * 0.22]), mix(hex('#7f9cff'), hex('#c8d6ff'), r()), 0.028 + r() * 0.02, 0.3 + r() * 0.25, 0.7);
  b.blob(16000, [0, 0, 0], [0.42, 0.28, 0.26], () => mix(hex('#6f8cff'), hex('#c8d4ff'), r()), 0.012, 0.06);
  // filament cage: wandering strands on (and just inside) the ellipsoid surface, plus outward "fingers"
  const nF = 170, per = 56000 / nF;
  for (let f = 0; f < nF; f++) {
    const path = b.walk([b.g(), b.g(), b.g()], [b.g(), b.g(), b.g()], 10 + Math.floor(r() * 14), 0.1, 0.55);
    const rr = 0.74 + r() * 0.28, ci = Math.floor((1 - (rr - 0.74) / 0.28) * 3.2 + r() * 2.8), col = fil[Math.min(fil.length - 1, ci)], I = 0.07 + r() * 0.1;
    const pts = path.map((u) => xf([u[0] * A[0] * rr, u[1] * A[1] * rr, u[2] * A[2] * rr]));
    b.curve(pts, per, 0.004 + r() * 0.005, (p, t) => b.glw(p, mix(col, fil[0], r() * 0.25), I * (0.35 + Math.sin(t * 9 + f) ** 2), 0.016));
  }
  for (let f = 0; f < 46; f++) {
    const u = norm([b.g(), b.g(), b.g()]), r0 = 0.6 + r() * 0.25, r1 = r0 + 0.2 + r() * 0.15, col = fil[Math.floor(r() * 3)];
    const pts = [0, 0.5, 1].map((t): V3 => { const k = r0 + (r1 - r0) * t; return xf([u[0] * A[0] * k + b.g() * 0.02, u[1] * A[1] * k + b.g() * 0.02, u[2] * A[2] * k]); });
    b.curve(pts, 260, 0.006, (p) => b.glw(p, col, 0.08, 0.016));
  }
  // pulsar wind: inclined torus with wisps + SE jet (lower left), faint counter-jet
  const tx = rot(62, 0, -34);
  for (let i = 0, n = b.n(3600); i < n; i++) {
    const a = r() * Math.PI * 2, rr = 0.09 + b.g() * 0.018 + (r() < 0.35 ? 0.05 + r() * 0.06 : 0);
    b.glw(tx([Math.cos(a) * rr, b.g() * 0.012, Math.sin(a) * rr]), hex('#d8e4ff'), 0.035, 0.02);
  }
  const jet = norm(xf([-0.7, -0.2, 0.25]));
  b.curve([[0, 0, 0], scale(jet, 0.12), add(scale(jet, 0.24), [0.02, -0.02, 0])], 900, 0.007, (p) => b.glw(p, hex('#cfe0ff'), 0.055, 0.016));
  b.curve([[0, 0, 0], scale(jet, -0.1)], 250, 0.007, (p) => b.glw(p, hex('#cfe0ff'), 0.03, 0.016));
  b.star([0, 0, 0.02], hex('#eaf0ff'), 1.3, 26, 0.8, 30);
  b.star([0.035, 0.014, 0.02], PAL.starW, 0.5, 9);
  b.field_stars(60, 1.15, 0.55);
}

/** Helix (NGC 7293), after O'Dell's model: an inner disk/ring and an outer ring in a strongly inclined plane, cometary knots on the inner rim. */
function helix(b: NB) {
  const r = b.r, nz = makeNoise3(7293), inner = rot(24, 0, 35), outer = rot(0, 58, -48), o2: V3 = [0.03, -0.03, 0];
  // inner disk: blue-green [O III] glow
  for (let i = 0, N = b.n(9000); i < N; i++) {
    const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * 0.46;
    b.glw(inner([Math.cos(a) * rr, Math.sin(a) * rr, b.g() * 0.06]), mix(hex('#4cb8e8'), hex('#8ce8d0'), r()), 0.026, 0.045);
  }
  for (let i = 0; i < 18; i++) { const a = r() * Math.PI * 2, rr = r() * 0.3; b.hz(inner([Math.cos(a) * rr, Math.sin(a) * rr, 0]), hex('#3f9cd0'), 0.05, 0.2, 0.6); }
  // the inner ring: yellow-orange inner edge → red → deep red
  for (let i = 0, N = b.n(42000), k = 0; i < N && k < N * 20; k++) {
    const a = r() * Math.PI * 2, rr = 0.55 + b.g() * 0.075, p = inner([Math.cos(a) * rr, Math.sin(a) * rr, b.g() * 0.06]);
    const spoke = nz(Math.cos(a) * 22, Math.sin(a) * 22, rr * 2);
    if (r() > nz(p[0] * 5, p[1] * 5, p[2] * 5) * 1.2 + (spoke - 0.5) * 1.6 - 0.05 || rr < 0.36) continue;
    b.glw(p, mix(mix(hex('#ffc890'), PAL.ha, smooth(0.42, 0.52, rr)), PAL.nii, smooth(0.58, 0.72, rr)), 0.035, 0.03);
    i++;
  }
  for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2; b.hz(inner([Math.cos(a) * 0.56, Math.sin(a) * 0.56, 0]), PAL.ha, 0.04, 0.14, 0.9); }
  // cometary knots: bright heads on the inner rim, tails pointing away from the white dwarf
  for (let i = 0, N = b.n(2400); i < N; i++) {
    const a = r() * Math.PI * 2, rr = 0.4 + Math.abs(b.g()) * 0.08, h = inner([Math.cos(a) * rr, Math.sin(a) * rr, b.g() * 0.05]), d = norm(h), L = 0.05 + r() * 0.08;
    b.glw(h, hex('#fff0c8'), 0.14, 0.01);
    for (let k = 1; k <= 6; k++) b.glw(add(h, d, L * k / 6), mix(hex('#ffa070'), PAL.ha, k / 6), 0.07 * (1 - k / 7), 0.011);
  }
  // the outer ring, nearly perpendicular to the inner disk
  for (let i = 0, N = b.n(24000), k = 0; i < N && k < N * 20; k++) {
    const a = r() * Math.PI * 2, rr = 0.9 + b.g() * 0.05, p = add(outer([Math.cos(a) * rr, Math.sin(a) * rr, b.g() * 0.05]), o2);
    if (r() > nz(p[0] * 4, p[1] * 4, p[2] * 4) * 1.4 - 0.2) continue;
    b.glw(p, mix(PAL.ha, PAL.nii, r()), 0.028, 0.034);
    i++;
  }
  b.shell(3000, [1, 1, 1], 0.04, (p) => b.glw(p, PAL.nii, 0.01, 0.04));
  b.star([0, 0, 0], hex('#eef4ff'), 1.1, 14, 0.3);
  b.field_stars(140, 1.15, 0.5);
}

/** Ring Nebula (M57): a barrel (prolate shell) seen near its axis; red outside, yellow-green then blue inside, a faint petalled halo. */
function ring(b: NB) {
  const r = b.r, nz = makeNoise3(57), xf = rot(16, 0, -30), W = 0.52, E = 0.74;
  for (let i = 0, N = b.n(46000), k = 0; i < N && k < N * 20; k++) {
    const zeta = clamp(b.g() * 0.3, -1, 1), rho = W * (1 - 0.35 * zeta * zeta), dr = b.g() * 0.05, a = r() * Math.PI * 2;
    const p = xf([Math.cos(a) * (rho + dr), Math.sin(a) * (rho + dr) * E, zeta * 0.6]);
    if (r() > 0.35 + nz(p[0] * 9, p[1] * 9, p[2] * 9) * 1.1) continue;
    const c = dr < -0.045 ? mix(hex('#3ab8e0'), hex('#7ee8b0'), smooth(-0.09, -0.045, dr)) : dr < 0 ? mix(hex('#b8f080'), hex('#ffd860'), smooth(-0.045, 0, dr)) : mix(PAL.orange, PAL.ha, smooth(0, 0.05, dr));
    b.glw(p, c, 0.05 * (1 - Math.abs(zeta) * 0.8), 0.032);
    i++;
  }
  // blue [O III] caps fill the middle (the barrel's ends, towards and away from us)
  for (const s of [1, -1]) b.field(4500, [-0.45, 0.45, -0.45, 0.45], (x, y) => clamp(1 - (x * x + (y / E) ** 2) / (W * W * 0.8)), (x, y, d) => {
    const p = xf([x, y, s * (0.32 * Math.sqrt(d) + b.g() * 0.03)]);
    b.glw(p, mix(hex('#2a70d8'), hex('#48c8e0'), 1 - d), 0.015, 0.05);
  });
  for (let i = 0; i < 10; i++) b.hz(xf([b.g() * 0.15, b.g() * 0.1, 0]), hex('#2f68c8'), 0.035, 0.24, 0.4);
  // dusty knots in the outer ring
  for (let i = 0, N = b.n(900); i < N; i++) {
    const a = r() * Math.PI * 2, rr = W + 0.04 + Math.abs(b.g()) * 0.03;
    b.dst(xf([Math.cos(a) * rr, Math.sin(a) * rr * E, b.g() * 0.1]), PAL.dust, 0.35, 0.02);
  }
  // JWST halo: a faint red envelope with ~18 loops ("petals") just outside the ring, and faint concentric arcs further out
  b.shell(7000, [0.74, 0.62, 0.6], 0.07, (p) => b.glw(xf(p), mix(PAL.nii, PAL.ha, r()), 0.014, 0.05));
  for (let k = 0; k < 18; k++) {
    const t = (k + r() * 0.6) / 18 * Math.PI * 2, d = 0.07 + r() * 0.05, R1 = 0.72 + r() * 0.12;
    const at = (a: number, rr: number): V3 => { const p = xf([Math.cos(a) * rr, Math.sin(a) * rr * 0.85, 0]); return [p[0], p[1], p[2] * 0.5 + b.g() * 0.05]; };
    b.curve([at(t - d, 0.6), at(t - d * 0.7, R1 * 0.93), at(t, R1), at(t + d * 0.7, R1 * 0.93), at(t + d, 0.6)], 900, 0.016, (p) => b.glw(p, mix(PAL.ha, hex('#ff8a70'), r()), 0.009, 0.03));
  }
  for (let k = 0; k < 6; k++) b.shell(1600, [0.88 + k * 0.025, 0.8 + k * 0.025, 0.8], 0.006, (p, u) => { if (Math.abs(u[2]) < 0.4 && r() < 0.6) b.glw(xf(p), PAL.nii, 0.012, 0.03); });
  b.star([0, 0, 0], hex('#f0f4ff'), 0.7, 10, 0.1);
  b.field_stars(70, 1.15, 0.5);
}

/** Cat's Eye (NGC 6543): overlapping elliptical bubbles with polar jets and red FLIERs, inside ~11 concentric spherical shells and a clumpy halo. */
function catsEye(b: NB) {
  const r = b.r, nz = makeNoise3(6543), ax = rot(25, 0, -20);
  for (let k = 0; k < 11; k++) {
    const R = 0.5 + k * 0.034;
    b.shell(6000, [R, R * 0.97, R], 0.005, (p, u) => {
      if (r() > nz(u[0] * 2 + k, u[1] * 2, u[2] * 2) * 2 - 0.3) return;
      b.glw(p, mix(hex('#ff7058'), hex('#ffb090'), r()), 0.07 * (1 - k * 0.05), 0.03);
    });
  }
  // the broken outer halo (ionised knots) out to the edge
  b.shell(6000, [0.94, 0.94, 0.94], 0.07, (p, u) => { if (r() < nz(u[0] * 5, u[1] * 5, u[2] * 5) * 2 - 0.9) b.glw(p, mix(PAL.nii, PAL.ha, r()), 0.025, 0.03); });
  const bub = (radii: V3, f: (v: V3) => V3, n: number, c0: C3, c1: C3, I: number) => b.shell(n, radii, 0.04, (p) => b.glw(f(p), mix(c0, c1, r()), I, 0.018));
  bub([0.12, 0.26, 0.12], ax, 8000, hex('#7af0c8'), hex('#d8fff0'), 0.06);
  bub([0.2, 0.4, 0.17], (p) => ax(rot(15, 0, 32)(p)), 8000, hex('#50e0b8'), hex('#c8f0a0'), 0.045);
  bub([0.2, 0.4, 0.17], (p) => ax(rot(-15, 0, -32)(p)), 8000, hex('#50e0b8'), hex('#c8f0a0'), 0.045);
  bub([0.3, 0.47, 0.26], ax, 7000, hex('#ff9070'), hex('#ffb070'), 0.035);
  b.blob(5000, [0, 0, 0], [0.1, 0.18, 0.1], () => mix(hex('#40d0b0'), hex('#a0f0d0'), r()), 0.02, 0.06);
  for (let i = 0; i < 8; i++) b.hz(ax([b.g() * 0.08, b.g() * 0.15, 0]), hex('#3fd0b0'), 0.06, 0.2, 0.3);
  // polar jets ending in red FLIER knots
  const J = norm(ax([0, 1, 0.35]));
  for (const s of [1, -1]) {
    const k = scale(J, 0.56 * s);
    b.blob(1200, k, [0.022, 0.022, 0.022], () => mix(PAL.orange, PAL.ha, r()), 0.09, 0.016);
    b.curve([scale(J, 0.26 * s), scale(J, 0.4 * s), add(k, [0.01 * s, 0, 0])], 1200, 0.007, (p) => b.glw(p, hex('#ff7a5a'), 0.05, 0.014));
  }
  b.star([0, 0, 0], hex('#f4f8ff'), 1.2, 14, 0.3);
  b.field_stars(90, 1.15, 0.5);
}

/** Cygnus Loop / Veil: a broken bubble whose shock fronts glow where we see them edge-on; [O III] teal braided with Hα red. */
function cygnusLoop(b: NB) {
  const r = b.r, nz = makeNoise3(1784), A: V3 = [0.86, 1.0, 0.86];
  const rad = (lon: number, lat: number) => 1 + (nz(lon * 0.02 + 3, lat * 0.02, 1) - 0.5) * 0.18;
  const sph = (lon: number, lat: number, k = 1): V3 => { const R = rad(lon, lat) * k; return [Math.cos(lat * DEG) * Math.sin(lon * DEG) * A[0] * R, Math.sin(lat * DEG) * A[1] * R, Math.cos(lat * DEG) * Math.cos(lon * DEG) * A[2] * R]; };
  const strandCol = (o3: boolean) => o3 ? mix(PAL.oiii, hex('#7ff0e0'), r() * 0.4) : mix(PAL.ha, PAL.pink, r() * 0.35);
  /** A bundle of braided strands following lon(lat) between two latitudes, spread over `spread` degrees and ±dk in radius. */
  const bundle = (lon: (lat: number) => number, lat0: number, lat1: number, strands: number, n: number, spread: number, I: number, k = 1, dk = 0.03) => {
    for (let s = 0; s < strands; s++) {
      const off = b.g() * spread, kR = k * (1 + b.g() * dk), o3 = r() < 0.45, ph = r() * 6, l0 = lat0 + b.g() * 4, l1 = lat1 + b.g() * 4, Ii = I * (0.4 + r());
      const pts = Array.from({ length: 12 }, (_, j) => { const la = l0 + (l1 - l0) * j / 11; return sph(lon(la) + off + Math.sin(j * 0.9 + ph) * spread * 0.3, la, kR); });
      b.braid(pts, 2, n / strands, 0.008, 3, 0.004, (p, t) => b.glw(p, strandCol(o3), Ii * (0.2 + 0.8 * Math.sin(Math.PI * t) ** 0.6), 0.014));
    }
  };
  // Eastern Veil (NGC 6992/6995): a thick bright braid on the east (left) side, its south end hooking west
  bundle((la) => -70 - 14 * Math.cos(la * DEG * 1.8) + (la < -20 ? (la + 20) * -0.9 : 0), 42, -58, 44, 36000, 7, 0.11);
  // Western Veil (NGC 6960, the Witch's Broom) through 52 Cygni: on a smaller inner front so it sits inside the outline
  bundle((la) => 76 - la * 0.25, 40, -62, 16, 13000, 2.5, 0.06, 0.82);
  bundle((la) => 70 + (la + 20) * 0.6, -20, -45, 8, 4000, 5, 0.05, 0.82);
  b.star(sph(80, -24, 0.86), hex('#ffd9a8'), 1.7, 26, 0.7);
  // Pickering's Triangle: a wedge of fine parallel filaments on the front face, north of centre
  for (let s = 0; s < 34; s++) {
    const f = r(), lo0 = -40 + f * 46, la0 = 62 - f * 10, lo1 = -16 + f * 10 + b.g() * 3, la1 = 8 + f * 30 + b.g() * 4;
    b.braid([sph(lo0, la0), sph((lo0 + lo1) / 2 + b.g() * 2, (la0 + la1) / 2), sph(lo1, la1)], 2, 450, 0.004, 2, 0.003, (p) => b.glw(p, strandCol(r() < 0.45), 0.05, 0.012));
  }
  b.field(1500, [-0.55, 0, 0.1, 0.85], (x, y) => clamp(1 - Math.abs(x + 0.2 - (y - 0.5) * 0.4) * 4) * smooth(0.1, 0.4, y), (x, y) => b.glw([x, y, 0.5], mix(PAL.ha, PAL.oiii, r()), 0.012, 0.05));
  // northern arcs (NGC 6974/6979) and the faint, open southern blowout
  bundle((la) => -45 + (la - 55) * 3, 55, 68, 10, 5000, 4, 0.05);
  bundle((la) => 35 - (la - 52) * 2, 52, 66, 6, 3000, 4, 0.035);
  for (let s = 0; s < 10; s++) {
    const a0 = -60 + r() * 120, pts = Array.from({ length: 8 }, (_, j) => sph(a0 + (j - 4) * 9, -66 - Math.abs(j - 4) * 4 + b.g() * 2, 1.08));
    b.braid(pts, 2, 1000, 0.006, 2, 0.003, (p) => b.glw(p, strandCol(r() < 0.4), 0.02, 0.012));
  }
  // faint filaments all over the bubble, bright only where seen edge-on
  for (let f = 0; f < 90; f++) {
    const path = b.walk(unitRand(r), unitRand(r), 8 + Math.floor(r() * 10), 0.08, 0.3), o3 = r() < 0.4;
    const pts = path.map((u): V3 => { const R = 0.9 + r() * 0.1; return [u[0] * A[0] * R, u[1] * A[1] * R, u[2] * A[2] * R]; });
    b.curve(pts, 260, 0.004, (p) => { const e = 1 - Math.abs(p[2]) / A[2]; b.glw(p, strandCol(o3), 0.05 * e ** 2, 0.012); });
  }
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2, k = 0.4 + r() * 0.45;
    b.hz([Math.cos(a) * 0.86 * k, Math.sin(a) * k, b.g() * 0.3], r() < 0.5 ? PAL.oiii : PAL.ha, 0.01, 0.22, 0.9);
  }
  b.field_stars(460, 1.15, 0.45);
}

/** Cassiopeia A: a clumpy shell of ejecta knots arranged in ring-like bubble rims, a faint outer shock, a NE jet and the neutron star. */
function casA(b: NB) {
  const r = b.r, nz = makeNoise3(1680), R0 = 0.58;
  const rings = Array.from({ length: 10 }, () => ({ c: unitRand(r), a: (14 + r() * 22) * DEG }));
  const cols = [hex('#ffd060'), hex('#ff5a3a'), hex('#7cf07a'), hex('#6aa0ff'), hex('#ff9a4a'), hex('#ff80c0')];
  const knot = (u: V3, rad: number, I: number, m = 7) => {
    const n = nz(u[0] * 2.2, u[1] * 2.2, u[2] * 2.2), ci = n < 0.38 ? 0 : n < 0.46 ? 4 : n < 0.54 ? 1 : n < 0.6 ? 5 : n < 0.66 ? 2 : 3, c = scale(u, rad), s = 0.006 + r() * 0.01;
    for (let k = 0; k < m; k++) b.glw(add(c, [b.g() * s, b.g() * s, b.g() * s]), mix(cols[ci], PAL.white, r() * 0.3), I, 0.016);
  };
  for (let i = 0, N = b.n(7000); i < N; i++) {
    let u: V3;
    if (r() < 0.6) {
      const g = rings[Math.floor(r() * rings.length)], [p, q] = perp(g.c), t = r() * Math.PI * 2, a = g.a + b.g() * 1.6 * DEG;
      u = norm(add(scale(g.c, Math.cos(a)), add(scale(p, Math.cos(t)), q, Math.sin(t)), Math.sin(a)));
    } else u = unitRand(r);
    knot(u, R0 * (1 + b.g() * 0.07), 0.11 * (1 + 0.5 * u[1] - 0.3 * u[0]) * (0.4 + r()));
  }
  // diffuse X-ray-like glow of the shocked shell + faint blue forward shock
  b.shell(9000, [R0, R0, R0], 0.1, (p) => b.glw(p, mix(hex('#ff7040'), hex('#8090ff'), r()), 0.012, 0.05));
  b.shell(10000, [0.95, 0.95, 0.95], 0.012, (p, u) => { if (r() < nz(u[0] * 6, u[1] * 6, u[2] * 6) * 1.6 - 0.35) b.glw(p, hex('#6aa8ff'), 0.03, 0.018); });
  for (let i = 0; i < 16; i++) b.hz(scale(unitRand(r), 0.5 * r()), hex('#6a80ff'), 0.02, 0.3, 0.8);
  // JWST's "Green Monster": a holey green curtain in front of the centre
  b.field(5000, [-0.32, 0.32, -0.32, 0.32], (x, y) => Math.exp(-(x * x + y * y) / 0.035) * clamp((nz(x * 14, y * 14, 4) - 0.4) * 4), (x, y) => b.glw([x + 0.04, y - 0.02, 0.4 + b.g() * 0.02], hex('#58e070'), 0.035, 0.02));
  // NE jet and fainter SW counter-jet
  const J = norm([-0.85, 0.5, 0.15]), [jp, jq] = perp(J);
  for (const [s, n, ln] of [[1, 900, 0.42], [-1, 300, 0.22]] as const) for (let i = 0, N = b.n(n); i < N; i++) {
    const t = R0 + r() * ln, d = norm(add(add(scale(J, s), jp, b.g() * 0.06), jq, b.g() * 0.06));
    knot(d, t, 0.09 * (1 - (t - R0) / ln * 0.6), 5);
  }
  b.star([0.03, -0.04, 0], hex('#e0eaff'), 0.7, 8);
  b.field_stars(150, 1.15, 0.5);
}

export const SHELLS: Record<string, (b: NB) => void> = {
  dp_crab_nebula: crab,
  dp_helix_nebula: helix,
  dp_ring_nebula: ring,
  dp_cats_eye_nebula: catsEye,
  dp_cygnus_loop: cygnusLoop,
  dp_cassiopeia_a: casA,
};
