import * as THREE from 'three';
import {
  type Builder, type Paint, type V3, num, mat, add, box, cyl, ellip, rbox, rod, skin, prism, slab, sweep, lathe, shade, hash3,
} from './prims.ts';

// Scale-model vehicles: lofted displacement hulls with sheer and flare, stepped deckhouses with glazing bands,
// raked funnels, swept-wing airliners with nacelles, streamlined train sets with bogies and pantographs, and a
// gored hot-air balloon. Front is +z, ~1 unit long, base at y=0.

export interface HullSpec { L: number; B: number; D: number; z0?: number; y0?: number; fine?: number; paint?: Paint; deck?: string; wl?: number }

/** Displacement hull: superellipse sections, bow flare & forefoot, sheer line, transom stern, separate flat deck. */
export function hull(p: THREE.Object3D, c: string, s: HullSpec): { deckY: (z: number) => number; halfB: (z: number) => number } {
  const { L, B, D } = s, z0 = s.z0 ?? 0, y0 = s.y0 ?? 0, fine = s.fine ?? 0.38;
  const NZ = 36, NS = 9;
  const halfB = (u: number) => {
    const bowStart = 1 - fine;
    if (u > bowStart) return (B / 2) * Math.max(0.012, Math.sqrt(Math.max(0, 1 - ((u - bowStart) / fine) ** 2)));
    if (u < 0.12) return (B / 2) * (0.84 + 0.16 * Math.sin((u / 0.12) * Math.PI / 2));
    return B / 2;
  };
  const sheer = (u: number) => D * (1 + 0.2 * Math.max(0, (u - 0.6) / 0.4) ** 2 + 0.05 * Math.max(0, (0.12 - u) / 0.12));
  const keel = (u: number) => (u > 0.86 ? D * 0.45 * ((u - 0.86) / 0.14) ** 2 : u < 0.1 ? D * 0.35 * ((0.1 - u) / 0.1) ** 1.5 : 0);
  const rings: V3[][] = [], deckL: V3[] = [], deckR: V3[] = [];
  for (let i = 0; i <= NZ; i++) {
    const u = i / NZ, z = z0 - L / 2 + u * L, w = halfB(u), top = sheer(u), kb = keel(u);
    const pw = 1.5 + 2.6 * (1 - Math.max(0, (u - 0.5) / 0.5));
    const side: V3[] = [];
    // Rows are distributed so one row lies exactly on the waterline (crisp boot-topping edge)
    const wl = Math.max(kb + 0.002, Math.min(s.wl ?? D * 0.3, top - 0.01)), K = 3;
    for (let k = 0; k <= NS; k++) {
      const t = k / NS, y = k <= K ? kb + (wl - kb) * (k / K) : wl + (top - wl) * ((k - K) / (NS - K));
      const flare = 1 + 0.08 * t * Math.max(0, (u - 0.7) / 0.3);
      side.push([w * flare * Math.pow(1 - Math.pow(1 - t, pw), 1 / pw), y0 + y, z]);
    }
    const ring: V3[] = [];
    for (let k = NS; k >= 1; k--) ring.push(side[k]);
    ring.push([0, side[0][1], z]);
    for (let k = 1; k <= NS; k++) ring.push([-side[k][0], side[k][1], z]);
    rings.push(ring);
    deckR.push(side[NS]); deckL.push([-side[NS][0], side[NS][1], z]);
  }
  skin(p, rings, c, { closed: false, caps: true, paint: s.paint, flat: false });
  // Flat deck with a slight camber, built as its own crisp surface
  const dk: V3[][] = deckR.map((r, i) => [r, [0, r[1] + D * 0.03, r[2]], deckL[i]]);
  const dp: number[] = [];
  for (let i = 0; i < dk.length - 1; i++) for (let j = 0; j < 2; j++) {
    const a = dk[i][j], b = dk[i][j + 1], c2 = dk[i + 1][j], d = dk[i + 1][j + 1];
    dp.push(...a, ...c2, ...b, ...b, ...c2, ...d);
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
  dg.computeVertexNormals();
  add(p, dg, mat(s.deck ?? '#b98b5e'), 0, 0, 0, 1, 1, 1);
  return {
    deckY: (z: number) => y0 + sheer(Math.min(1, Math.max(0, (z - z0 + L / 2) / L))),
    halfB: (z: number) => halfB(Math.min(1, Math.max(0, (z - z0 + L / 2) / L))),
  };
}

/** Rounded-front deckhouse tier with a dark glazing band. */
function deckhouse(p: THREE.Object3D, w: number, z0: number, z1: number, y: number, h: number, c: string, glass = '#1e3a5f', round = 0.6): void {
  const hw = w / 2, len = z1 - z0, nose = Math.min(len * 0.35, hw * round * 1.6);
  const plan: [number, number][] = [[-hw, z0], [hw, z0], [hw, z1 - nose], [hw * 0.72, z1 - nose * 0.25], [0, z1], [-hw * 0.72, z1 - nose * 0.25], [-hw, z1 - nose]];
  prism(p, plan, y, h, c, Math.min(0.004, h * 0.12), true);
  const gp = plan.map(([x, z]) => [x * 1.025, z0 + (z - z0) * 1.006 - len * 0.003] as [number, number]);
  prism(p, gp, y + h * 0.42, h * 0.32, glass, 0, true);
}

function funnel(p: THREE.Object3D, x: number, y: number, z: number, h: number, w: number, c: string, top = '#111827'): void {
  sweep(p, [
    { p: [x, y, z], w, h: w * 1.5 }, { p: [x, y + h * 0.5, z - h * 0.06], w: w * 0.98, h: w * 1.45 }, { p: [x, y + h, z - h * 0.14], w: w * 0.94, h: w * 1.38 },
  ], c, { radial: 18, sub: 3, up: [0, 0, 1], paint: (_x, py) => (py > y + h * 0.8 ? top : null) });
  ellip(p, '#0b0f17', x, y + h + 0.002, z - h * 0.14, w * 0.85, 0.004, w * 1.25);
}

const ship: Builder = (gp, r) => {
  const c = r.color!, a = r.accent ?? '#dc2626';
  const isContainer = !!r.containers, isFerry = c.toLowerCase() > '#e0e0e0';
  const L = 0.98, Bm = isContainer ? 0.2 : 0.19, D = 0.115;
  const boot = '#9b2c2c', wl = 0.034;
  const H = hull(gp, c, {
    L, B: Bm, D, wl, fine: isContainer ? 0.3 : 0.4, deck: isContainer ? '#7a4a3a' : '#c49a6c',
    paint: (_x, y) => (y < wl ? boot : null),
  });
  if (isContainer) {
    // Aft bridge block, then container bays stacked forward
    const zb = -0.36, dy = H.deckY(zb);
    rbox(gp, '#f8fafc', 0, dy, zb, 0.17, 0.2, 0.09, 0.006);
    box(gp, '#1e3a5f', 0, dy + 0.16, zb + 0.046, 0.172, 0.022, 0.004);
    box(gp, '#f8fafc', 0, dy + 0.2, zb, 0.22, 0.012, 0.05);
    funnel(gp, 0, dy, zb - 0.07, 0.17, 0.028, a);
    const pal = ['#c0392b', '#2563eb', '#e0a526', '#16803c', '#e2e8f0', '#0e7490', '#9a3412', '#475569'];
    for (let bay = 0; bay < 9; bay++) {
      const z = -0.26 + bay * 0.062, hw = H.halfB(z) * 0.92, cols = Math.max(2, Math.floor((hw * 2) / 0.034)), tiers = bay > 6 ? 2 : 3;
      for (let k = 0; k < cols; k++) for (let t = 0; t < tiers; t++) {
        const x = -hw + (k + 0.5) * ((hw * 2) / cols);
        const col = pal[Math.floor(hash3(bay, k, t) * pal.length)];
        rbox(gp, col, x, H.deckY(z) + t * 0.031, z, (hw * 2) / cols - 0.004, 0.029, 0.056, 0.003);
      }
    }
    rod(gp, [0, H.deckY(0.42), 0.42], [0, H.deckY(0.42) + 0.08, 0.42], 0.004, '#f8fafc');
    return;
  }
  // Cruise liner / ferry: stepped superstructure with glazing bands, lifeboats, funnel(s), mast, pool deck
  const tiers = isFerry ? 3 : 4;
  for (let t = 0; t < tiers; t++) {
    const w = Bm * (0.9 - t * 0.06), z0 = -0.3 + t * 0.03, z1 = 0.24 - t * 0.04;
    deckhouse(gp, w, z0, z1, H.deckY(0) + t * 0.034, 0.034, '#f8fafc', '#16324f');
  }
  const topY = H.deckY(0) + tiers * 0.034;
  // Bridge with wings
  box(gp, '#f8fafc', 0, topY, 0.12, Bm * 1.02, 0.018, 0.04);
  box(gp, '#0f2a44', 0, topY + 0.004, 0.141, Bm * 0.98, 0.009, 0.003);
  // Lifeboats along both sides of the first tier
  for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) {
    const z = -0.2 + i * 0.07;
    ellip(gp, '#f97316', sx * (Bm * 0.47), H.deckY(0) + 0.05, z, 0.012, 0.01, 0.026);
    box(gp, '#f8fafc', sx * (Bm * 0.47), H.deckY(0) + 0.058, z, 0.026, 0.004, 0.05);
  }
  // Aft pool deck
  if (!isFerry) {
    box(gp, '#38bdf8', 0, topY - 0.033, -0.33, 0.07, 0.004, 0.06).material = mat('#38bdf8', { emissive: '#0369a1' });
    for (const sx of [-1, 1]) box(gp, '#f8fafc', sx * 0.06, topY - 0.034, -0.33, 0.012, 0.012, 0.09);
  }
  funnel(gp, 0, topY, -0.12, isFerry ? 0.09 : 0.12, 0.034, a);
  rod(gp, [0, topY, 0.06], [0, topY + 0.1, 0.05], 0.004, '#e2e8f0');
  box(gp, '#e2e8f0', 0, topY + 0.07, 0.05, 0.05, 0.004, 0.004);
  ellip(gp, '#f8fafc', 0, topY + 0.02, 0.02, 0.016, 0.016, 0.016);
  if (isFerry) {
    // Bow visor & car-deck door line
    box(gp, '#334155', 0, 0.03, -0.49, 0.12, 0.05, 0.004);
  }
};

// ---------------------------------------------------------------------------------------------------------
function wing(p: THREE.Object3D, side: number, rootZ: number, rootC: number, span: number, sweepZ: number, tipC: number, y: number, c: string, dih = 0.07, th = 0.014, winglet = true): void {
  const g = new THREE.Group();
  g.position.set(0, y, 0);
  g.rotation.z = side * dih;
  p.add(g);
  const x0 = 0.05, x1 = x0 + span;
  const out: [number, number][] = [[x0, -rootZ], [x1, -(rootZ - sweepZ)], [x1, -(rootZ - sweepZ - tipC)], [x0, -(rootZ - rootC)]];
  const m = slab(g, out.map(([x, zz]) => [side * x, zz] as [number, number]), th, c, th * 0.35, false);
  m.rotation.x = -Math.PI / 2;
  if (!winglet) return;
  // Blended winglet
  const wl = slab(g, [[0, 0], [-tipC * 0.25, 0.032], [-tipC * 0.55, 0.036], [-tipC * 0.8, 0]].map(([zz, yy]) => [zz, yy] as [number, number]), 0.006, c, 0.002, false);
  wl.rotation.y = -Math.PI / 2;
  wl.position.set(side * x1, 0, rootZ - sweepZ - tipC * 0.1);
}

function nacelle(p: THREE.Object3D, x: number, y: number, z: number, r: number, accent: string): void {
  const m = lathe(p, [[0, -0.005], [r * 0.82, 0], [r, 0.02], [r * 1.02, r * 1.6], [r * 0.82, r * 3.2], [r * 0.45, r * 3.6], [0, r * 3.7]], '#e5e7eb', 0, 0, 0, 18);
  m.position.set(x, y, z + r * 1.8);
  m.rotation.x = -Math.PI / 2;
  ellip(p, '#1f2937', x, y, z + r * 1.82, r * 0.82, r * 0.82, 0.004);
  cyl(p, accent, x, y - 0.002, z + r * 0.9, r * 1.04, 0.004, 14).rotation.x = Math.PI / 2;
}

const plane: Builder = (gp, r) => {
  const c = r.color!, a = r.accent ?? '#2563eb', hump = !!r.hump;
  const Y = 0.12, R = 0.066;
  const st = [
    { p: [0, Y - 0.012, 0.5] as V3, w: 0.006, h: 0.006 },
    { p: [0, Y - 0.006, 0.475] as V3, w: R * 0.55, h: R * 0.5 },
    { p: [0, Y - 0.002, 0.43] as V3, w: R * 0.86, h: R * 0.84 },
    { p: [0, hump ? Y + 0.018 : Y, 0.35] as V3, w: R, h: hump ? R * 1.3 : R },
    { p: [0, hump ? Y + 0.016 : Y, 0.2] as V3, w: R, h: hump ? R * 1.26 : R },
    { p: [0, Y, 0.05] as V3, w: R, h: R },
    { p: [0, Y, -0.2] as V3, w: R, h: R },
    { p: [0, Y + 0.012, -0.34] as V3, w: R * 0.78, h: R * 0.78 },
    { p: [0, Y + 0.03, -0.45] as V3, w: R * 0.38, h: R * 0.42 },
    { p: [0, Y + 0.042, -0.5] as V3, w: 0.01, h: 0.012 },
  ];
  sweep(gp, st, c, {
    radial: 26, sub: 6,
    paint: (_x, y, z) => (y < Y - R * 0.55 ? '#cbd5e1' : (y > Y - R * 0.38 && y < Y - R * 0.24 && z < 0.44 && z > -0.42) ? a : null),
  });
  // Cockpit glazing & window rows (thin dark capsules hugging the cylinder)
  ellip(gp, '#0f172a', 0, Y + 0.02, 0.458, 0.026, 0.008, 0.013, 0, -0.55);
  for (const sx of [-1, 1]) {
    ellip(gp, '#1e293b', sx * R * 0.965, Y + 0.016, 0.03, 0.006, 0.0075, 0.33);
    box(gp, '#f8fafc', sx * R * 0.99, Y - 0.012, 0.35, 0.002, 0.03, 0.016);
    if (hump) ellip(gp, '#1e293b', sx * R * 0.86, Y + 0.068, 0.29, 0.006, 0.006, 0.07);
  }
  // Wings, tailplane & fin
  wing(gp, 1, 0.16, 0.24, 0.42, 0.28, 0.07, Y - 0.04, c);
  wing(gp, -1, 0.16, 0.24, 0.42, 0.28, 0.07, Y - 0.04, c);
  wing(gp, 1, -0.33, 0.12, 0.15, 0.11, 0.05, Y + 0.02, c, 0.1, 0.01, false);
  wing(gp, -1, -0.33, 0.12, 0.15, 0.11, 0.05, Y + 0.02, c, 0.1, 0.01, false);
  const fin = slab(gp, [[-0.3, 0], [-0.43, 0], [-0.52, 0.2], [-0.45, 0.2]].map(([zz, yy]) => [-zz, yy] as [number, number]), 0.012, a, 0.004, false);
  fin.rotation.y = Math.PI / 2;
  fin.position.set(0, Y + 0.04, 0);
  ellip(gp, shade(a, 1.25), 0, Y + 0.17, -0.47, 0.007, 0.03, 0.03);
  // Engines (four on the jumbo) on pylons
  const engines = hump ? [0.16, 0.3] : [0.18];
  for (const sx of [-1, 1]) for (const ex of engines) {
    const ez = 0.16 - ((ex - 0.05) / 0.42) * 0.28 + 0.05;
    nacelle(gp, sx * ex, Y - 0.075 + (ex * 0.07), ez - 0.02, 0.026, a);
    box(gp, c, sx * ex, Y - 0.06 + ex * 0.07, ez - 0.06, 0.008, 0.03, 0.08);
  }
  // Nav lights
  ellip(gp, '#ef4444', -0.47, Y - 0.005, -0.12, 0.007).material = mat('#ef4444', { emissive: '#ef4444' });
  ellip(gp, '#22c55e', 0.47, Y - 0.005, -0.12, 0.007).material = mat('#22c55e', { emissive: '#22c55e' });
};

// ---------------------------------------------------------------------------------------------------------
/** Rounded-rect car section (superellipse) — w half-width, h height, base y. */
function carRing(z: number, w: number, h: number, y: number, n = 28, e = 4.5, dropTop = 0): V3[] {
  const ring: V3[] = [];
  for (let j = 0; j < n; j++) {
    const t = (j / n) * Math.PI * 2, ct = Math.cos(t), st = Math.sin(t);
    const x = Math.sign(ct) * Math.pow(Math.abs(ct), 2 / e) * w;
    const yy = Math.sign(st) * Math.pow(Math.abs(st), 2 / e);
    ring.push([x, y + h / 2 + yy * (h / 2) - (yy > 0 ? dropTop * yy : 0), z]);
  }
  return ring;
}

function bogie(p: THREE.Object3D, z: number, w: number): void {
  box(p, '#1f2937', 0, 0.012, z, w * 1.5, 0.022, 0.06);
  for (const dz of [-0.02, 0.02]) for (const sx of [-1, 1]) {
    const wh = cyl(p, '#374151', sx * w * 0.8, 0.012, z + dz, 0.012, 0.008, 10);
    wh.rotation.z = Math.PI / 2;
    wh.position.y = 0.012;
  }
}

const train: Builder = (gp, r) => {
  const cars = num(r.cars, 4), c = r.color!, a = r.accent ?? '#dc2626', bullet = !!r.nose;
  const W = 0.072, Hh = bullet ? 0.115 : 0.135, Y0 = 0.03, CL = bullet ? 0.25 : 0.22, GAP = 0.012;
  const stripe: Paint = (_x, y, _z, nx) => {
    const t = (y - Y0) / Hh;
    if (Math.abs(nx) > 0.5 && t > 0.48 && t < 0.66) return '#0f172a';
    if (Math.abs(nx) > 0.5 && t > 0.3 && t < 0.4) return a;
    if (t < 0.12) return shade(c, 0.6);
    return null;
  };
  for (let i = 0; i < cars; i++) {
    const zf = 0.5 - i * (CL + GAP), zb = zf - CL;
    const rings: V3[][] = [];
    const lead = i === 0;
    if (lead && bullet) {
      // Long duck-bill nose: height collapses faster than width
      const NL = 0.15;
      for (let k = 0; k <= 10; k++) {
        const u = k / 10, z = zb + (CL - NL) + u * NL;
        const hs = Math.max(0.12, 1 - u ** 1.7), ws = Math.max(0.16, Math.sqrt(1 - u ** 2.6));
        rings.push(carRing(z, W * ws, Hh * hs, Y0, 28, 4.5 - u * 2));
      }
      rings.unshift(carRing(zb, W, Hh, Y0));
    } else if (lead) {
      rings.push(carRing(zb, W, Hh, Y0), carRing(zf - 0.03, W, Hh, Y0), carRing(zf - 0.008, W * 0.98, Hh * 0.97, Y0, 28, 4), carRing(zf, W * 0.93, Hh * 0.9, Y0, 28, 3.6));
    } else {
      rings.push(carRing(zb, W * 0.97, Hh * 0.97, Y0), carRing(zb + 0.006, W, Hh, Y0), carRing(zf - 0.006, W, Hh, Y0), carRing(zf, W * 0.97, Hh * 0.97, Y0));
    }
    skin(gp, rings, c, { caps: true, paint: stripe });
    // Bogies, gangway bellows, roof gear
    bogie(gp, zb + 0.045, W);
    bogie(gp, zf - 0.045, W);
    if (i < cars - 1) box(gp, '#1f2937', 0, Y0 + 0.01, zb - GAP / 2, W * 1.4, Hh * 0.85, GAP + 0.004);
    if (bullet) {
      if (i % 2 === 1) {
        // Pantograph
        box(gp, '#64748b', 0, Y0 + Hh, zb + CL / 2, 0.03, 0.006, 0.03);
        rod(gp, [0, Y0 + Hh + 0.006, zb + CL / 2], [0, Y0 + Hh + 0.04, zb + CL / 2 - 0.02], 0.0025, '#94a3b8', 4);
        box(gp, '#94a3b8', 0, Y0 + Hh + 0.04, zb + CL / 2 - 0.02, 0.05, 0.003, 0.004);
      }
    } else if (!lead) {
      for (let k = 0; k < 4; k++) box(gp, shade(c, 0.8), 0, Y0 + Hh - 0.004, zb + 0.03 + k * 0.05, 0.03, 0.008, 0.016);
    }
    // Doors
    for (const sx of [-1, 1]) for (const dz of (lead && bullet ? [0.02] : [0.02, CL - 0.03])) box(gp, shade(c, 0.82), sx * W * 1.0, Y0 + 0.02, zb + dz, 0.003, Hh * 0.7, 0.018);
  }
  // Lead-car glazing & headlights
  const zf = 0.5;
  if (bullet) {
    ellip(gp, '#0f172a', 0, Y0 + Hh * 0.62, zf - 0.115, W * 0.5, Hh * 0.1, 0.03, 0, -0.32);
    for (const sx of [-1, 1]) ellip(gp, '#fef9c3', sx * W * 0.45, Y0 + Hh * 0.3, zf - 0.06, 0.012, 0.006, 0.012).material = mat('#fef9c3', { emissive: '#fde68a' });
  } else {
    box(gp, '#0f172a', 0, Y0 + Hh * 0.6, zf - 0.004, W * 1.5, Hh * 0.22, 0.006);
    box(gp, a, 0, Y0 + Hh * 0.2, zf - 0.002, W * 1.6, Hh * 0.14, 0.006);
    ellip(gp, '#fef9c3', 0, Y0 + Hh * 0.93, zf - 0.004, 0.012, 0.012, 0.006).material = mat('#fef9c3', { emissive: '#fde68a' });
    box(gp, '#334155', 0, 0, zf - 0.005, W * 1.6, 0.02, 0.03);
  }
};

// ---------------------------------------------------------------------------------------------------------
const balloon: Builder = (gp, r) => {
  const c = r.color!, a = r.accent ?? '#fde047';
  // Classic inverted-teardrop envelope profile (radius, height)
  const prof: [number, number][] = [];
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    const y = 0.36 + t * 0.66;
    const rad = t < 0.62
      ? 0.07 + 0.29 * Math.sin((t / 0.62) * Math.PI / 2) ** 0.85
      : 0.36 * Math.sqrt(Math.max(0, 1 - ((t - 0.62) / 0.38) ** 2.2));
    prof.push([Math.max(0.0005, rad), y]);
  }
  const geo = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 72);
  geo.computeVertexNormals();
  const gores = 12;
  add(gp, paintGores(geo, c, a, gores), mat('#ffffff', { flat: false, vc: true, rough: 0.5 }), 0, 0, 0, 1, 1, 1);
  // Skirt (scoop) & load tapes converge to the burner frame
  lathe(gp, [[0.07, 0.36], [0.064, 0.3], [0.058, 0.27]], shade(c, 0.7), 0, 0, 0, 18);
  for (let i = 0; i < 6; i++) {
    const t = (i / 6) * Math.PI * 2;
    rod(gp, [Math.cos(t) * 0.058, 0.27, Math.sin(t) * 0.058], [Math.cos(t) * 0.05, 0.18, Math.sin(t) * 0.05], 0.0018, '#334155', 3);
  }
  // Burner with flame
  cyl(gp, '#9ca3af', 0, 0.17, 0, 0.026, 0.02, 10);
  lathe(gp, [[0.0, 0.19], [0.016, 0.2], [0.012, 0.24], [0, 0.27]], '#fde047', 0, 0, 0, 10).material = mat('#fbbf24', { emissive: '#f59e0b' });
  // Wicker basket with padded rim
  const bg = new THREE.BoxGeometry(0.1, 0.075, 0.1, 6, 4, 6);
  add(gp, paintFaces2(bg), mat('#ffffff', { vc: true, rough: 0.95 }), 0, 0.0375, 0, 1, 1, 1);
  for (const [x, z, w, d] of [[0, 0.05, 0.106, 0.012], [0, -0.05, 0.106, 0.012], [0.05, 0, 0.012, 0.106], [-0.05, 0, 0.012, 0.106]] as const) rbox(gp, '#5b3a1e', x, 0.07, z, w, 0.012, d, 0.005);
  for (const [x, z] of [[-0.045, -0.045], [0.045, -0.045], [-0.045, 0.045], [0.045, 0.045]] as const) rod(gp, [x, 0.08, z], [x * 0.5, 0.17, z * 0.5], 0.002, '#78350f', 3);
};

function paintGores(geo: THREE.BufferGeometry, c: string, a: string, gores: number): THREE.BufferGeometry {
  const ng = geo.index ? geo.toNonIndexed() : geo;
  const P = ng.getAttribute('position'), cols = new Float32Array(P.count * 3);
  const cc = new THREE.Color(c), ca = new THREE.Color(a), cw = new THREE.Color('#f8fafc'), cd = new THREE.Color(shade(c, 0.55));
  for (let i = 0; i < P.count; i += 3) {
    const x = (P.getX(i) + P.getX(i + 1) + P.getX(i + 2)) / 3, y = (P.getY(i) + P.getY(i + 1) + P.getY(i + 2)) / 3, z = (P.getZ(i) + P.getZ(i + 1) + P.getZ(i + 2)) / 3;
    const ang = (Math.atan2(z, x) / (Math.PI * 2) + 1) % 1, gi = Math.floor(ang * gores), fr = ang * gores - gi;
    const zig = 0.62 + 0.035 * Math.abs(((fr * 2) % 1) * 2 - 1);
    let col = gi % 2 ? ca : cc;
    if (Math.abs(y - zig) < 0.03) col = gi % 2 ? cc : cw;
    if (y > 0.985) col = cd;
    for (let k = 0; k < 3; k++) { cols[(i + k) * 3] = col.r; cols[(i + k) * 3 + 1] = col.g; cols[(i + k) * 3 + 2] = col.b; }
  }
  ng.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  return ng;
}

/** Wicker weave: alternating light/dark cells on a subdivided box. */
function paintFaces2(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const ng = geo.toNonIndexed(), P = ng.getAttribute('position'), cols = new Float32Array(P.count * 3);
  const l = new THREE.Color('#b07a3e'), d = new THREE.Color('#8a5a2b');
  for (let i = 0; i < P.count; i += 6) {
    const x = P.getX(i) + P.getZ(i), y = P.getY(i);
    const col = (Math.floor((x + 1) * 60) + Math.floor((y + 1) * 53)) % 2 ? l : d;
    for (let k = 0; k < 6 && i + k < P.count; k++) { cols[(i + k) * 3] = col.r; cols[(i + k) * 3 + 1] = col.g; cols[(i + k) * 3 + 2] = col.b; }
  }
  ng.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  return ng;
}

export const VEHICLE_BUILDERS: Record<string, Builder> = { ship, plane, train, balloon };
