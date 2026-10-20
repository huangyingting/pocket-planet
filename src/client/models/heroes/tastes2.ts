import * as THREE from 'three';
import { type Builder, type Paint, type V3, add, mat, shade, mix, fbm, hash3, paintFaces, g, strut, sweep } from '../prims.ts';

// Hero builders for the second "foods of the world" pack (fd_*): ceviche, arepas, bunny chow, khachapuri, plov,
// hummus, lamingtons, rendang, pierogi and jerk chicken. Each dish sits on a round table tile (radius 0.5),
// base at y=0, front +z. Mobile budget: low-segment shared geometry, ≤15k triangles per dish.

const TAU = Math.PI * 2;
let seed = 1;
const srand = (s: number) => { seed = s; };
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const rr = (a: number, b: number) => a + (b - a) * rnd();
const jit = (c: string, a = 0.08) => shade(c, 1 - a + rnd() * 2 * a);

const VC = (o: { metal?: number; rough?: number; flat?: boolean } = {}) => mat('#ffffff', { vc: true, flat: o.flat ?? false, metal: o.metal, rough: o.rough });
/** Glossy (sauce / glaze / glass) material swap. */
const glossy = <T extends THREE.Mesh>(m: T): T => {
  const old = m.material as THREE.MeshStandardMaterial;
  m.material = old.vertexColors ? mat('#ffffff', { vc: true, flat: false, metal: 0.3, rough: 0.3 })
    : mat('#' + old.color.getHexString(), { flat: false, metal: 0.3, rough: 0.3 });
  return m;
};
const SPH = (s: number) => g('t2:sph' + s, () => new THREE.SphereGeometry(1, s, Math.max(4, Math.round(s * 0.65))));
const CYLG = (s: number) => g('t2:cyl' + s, () => new THREE.CylinderGeometry(1, 1, 1, s));
const BOXG = () => g('t2:box', () => new THREE.BoxGeometry(1, 1, 1));

/** Low-poly smooth ellipsoid centred at (x,y,z). */
function ell(p: THREE.Object3D, c: string, x: number, y: number, z: number, rx: number, ry = rx, rz = rx, roty = 0, rotx = 0, rotz = 0, s = 8): THREE.Mesh {
  return add(p, SPH(s), mat(c, { flat: false }), x, y, z, rx, ry, rz, roty, rotx, rotz);
}
/** Box with its base at y. */
function cube(p: THREE.Object3D, c: string, x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0, rx = 0, rz = 0): THREE.Mesh {
  return add(p, BOXG(), mat(c), x, y + sy / 2, z, sx, sy, sz, ry, rx, rz);
}
/** Upright cylinder (radius r, height h) with its base at y. */
function disc(p: THREE.Object3D, c: string, x: number, y: number, z: number, r: number, h: number, s = 12, rx = 0, rz = 0): THREE.Mesh {
  return add(p, CYLG(s), mat(c, { flat: false }), x, y + h / 2, z, r, h, r, 0, rx, rz);
}
function grp(p: THREE.Object3D, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0): THREE.Group {
  const q = new THREE.Group(); q.position.set(x, y, z); q.rotation.set(rx, ry, rz); p.add(q); return q;
}
/** Lathe of a [r, y] profile with per-face paint. */
function plathe(p: THREE.Object3D, prof: [number, number][], c: string, paint?: Paint, x = 0, y = 0, z = 0, seg = 24): THREE.Mesh {
  const geo = new THREE.LatheGeometry(prof.map(([r, h]) => new THREE.Vector2(Math.max(1e-4, r), h)), seg);
  geo.computeVertexNormals();
  return add(p, paintFaces(geo, c, paint), VC(), x, y, z, 1, 1, 1);
}
/** Flat painted disc facing up. */
function pdisc(p: THREE.Object3D, R: number, c: string, paint?: Paint, x = 0, y = 0, z = 0, rings = 4, seg = 24): THREE.Mesh {
  const prof: [number, number][] = [];
  for (let i = rings; i >= 0; i--) prof.push([R * i / rings, 0]);
  return plathe(p, prof, c, paint, x, y, z, seg);
}
/** Noise-displaced painted sphere — organic food lumps (meat, rice, filling). */
function lump(p: THREE.Object3D, c: string, x: number, y: number, z: number, sx: number, sy: number, sz: number,
  o: { amp?: number; f?: number; paint?: Paint; seg?: number; ry?: number; rx?: number; rz?: number; s?: number; flatBottom?: boolean } = {}): THREE.Mesh {
  const seg = o.seg ?? 10;
  const geo = new THREE.SphereGeometry(1, seg, Math.max(5, Math.round(seg * 0.7)));
  const pos = geo.getAttribute('position');
  const amp = o.amp ?? 0.12, f = o.f ?? 2.2, s0 = o.s ?? 0;
  for (let i = 0; i < pos.count; i++) {
    let vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
    const d = 1 + (fbm(vx * f + s0, vy * f + 3.1, vz * f - s0, 3) - 0.5) * 2 * amp;
    vx *= d; vy *= d; vz *= d;
    if (o.flatBottom && vy < -0.2) vy = -0.2 - (vy + 0.2) * 0.1;
    pos.setXYZ(i, vx, vy, vz);
  }
  geo.computeVertexNormals();
  return add(p, paintFaces(geo, c, o.paint), VC(), x, y, z, sx, sy, sz, o.ry ?? 0, o.rx ?? 0, o.rz ?? 0);
}
/** Thin curved strip through points (onion slivers, chilli, carrot shreds). */
function strip(p: THREE.Object3D, pts: V3[], r: number, c: string): THREE.Mesh {
  return sweep(p, pts.map(q => ({ p: q, w: r, h: r * 0.6 })), c, { radial: 4, sub: 3, caps: true });
}

/** Flat-faced vertex-coloured triangle soup. */
class VB {
  pos: number[] = [];
  col: number[] = [];
  private cc = new Map<string, THREE.Color>();
  tri(a: V3, b: V3, c: V3, color: string): void {
    this.pos.push(...a, ...b, ...c);
    let q = this.cc.get(color);
    if (!q) { q = new THREE.Color(color); this.cc.set(color, q); }
    for (let k = 0; k < 3; k++) this.col.push(q.r, q.g, q.b);
  }
  quad(a: V3, b: V3, c: V3, d: V3, color: string): void { this.tri(a, b, c, color); this.tri(a, c, d, color); }
  mesh(p: THREE.Object3D, smoothN = false): THREE.Mesh | null {
    if (!this.pos.length) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    geo.computeVertexNormals();
    return add(p, geo, mat('#ffffff', { vc: true, flat: !smoothN }), 0, 0, 0, 1, 1, 1);
  }
}

/** Grid clipped to a circle/oval, painted per cell (table tops, leaves, sauces). */
function gridDisc(p: THREE.Object3D, R: number, y: number, n: number, paint: (x: number, z: number) => string,
  o: { cx?: number; cz?: number; h?: (x: number, z: number) => number; sz?: number } = {}): THREE.Mesh | null {
  const vb = new VB();
  const cx = o.cx ?? 0, cz = o.cz ?? 0, sz = o.sz ?? 1;
  const cl = (x: number, z: number): V3 => {
    const d = Math.hypot(x, z);
    const [px, pz] = d > R ? [x * R / d, z * R / d] : [x, z];
    return [cx + px, y + (o.h ? o.h(px, pz) : 0), cz + pz * sz];
  };
  const s = 2 * R / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x0 = -R + i * s, z0 = -R + j * s, x1 = x0 + s, z1 = z0 + s;
    if (Math.hypot(x0 + s / 2, z0 + s / 2) > R + s * 0.75) continue;
    const a = cl(x0, z0), b = cl(x1, z0), c = cl(x1, z1), d = cl(x0, z1);
    const col = paint(x0 + s / 2, z0 + s / 2);
    vb.tri(a, d, b, col); vb.tri(d, c, b, col);
  }
  return vb.mesh(p);
}

/** Round table tile (radius 0.5); returns the top height. */
function table(p: THREE.Object3D, style: 'wood' | 'teak' | 'dark' | 'cloth' | 'stone', cloth: [string, string] = ['#c83a3a', '#f4efe6']): number {
  const R = 0.5, H = 0.045;
  const edge = style === 'cloth' ? cloth[0] : style === 'dark' ? '#3a3633' : style === 'teak' ? '#7a4a2a' : style === 'stone' ? '#cfcac2' : '#a8784a';
  plathe(p, [[0, 0.004], [R - 0.012, 0.004], [R, 0.014], [R, H - 0.01], [R - 0.006, H]], shade(edge, 0.85),
    style === 'cloth' ? (x, _y, z) => (Math.floor((Math.atan2(z, x) / TAU) * 48) % 2 ? cloth[1] : null) : undefined, 0, 0, 0, 36);
  const W = 0.1;
  gridDisc(p, R - 0.006, H, 16, (x, z) => {
    if (style === 'cloth') {
      const a = Math.floor((x + R) / (2 * R / 8)) % 2, b = Math.floor((z + R) / (2 * R / 8)) % 2;
      return a && b ? cloth[0] : a || b ? mix(cloth[0], cloth[1], 0.55) : cloth[1];
    }
    if (style === 'dark') return shade('#46413c', 0.88 + fbm(x * 6, 1, z * 6) * 0.25);
    if (style === 'stone') {
      const v = Math.abs(Math.sin((x * 3 + z * 2 + fbm(x * 4, 2, z * 4) * 3) * 4));
      return v < 0.1 ? '#b9b3aa' : shade('#e9e5de', 0.96 + hash3(x * 50, 1, z * 50) * 0.05);
    }
    const k = Math.floor((x + R) / W);
    const base = style === 'teak' ? '#8a5532' : '#b8875a';
    const gg = 0.86 + hash3(k, 3, 7) * 0.16 + (fbm(x * 30, k, z * 4) - 0.5) * 0.18;
    return shade(base, ((x + R) % W) < 0.012 ? 0.7 : gg);
  });
  return H;
}

/** Shallow plate (rim + well); returns the well height. */
function plate(p: THREE.Object3D, R: number, c: string, x = 0, y = 0, z = 0, paint?: Paint, deep = 0.012, seg = 32): number {
  const prof: [number, number][] = [[0, 0.006], [R * 0.52, 0.006], [R * 0.55, 0], [R * 0.6, 0.004], [R * 0.75, deep * 0.7 + 0.008],
    [R * 0.9, 0.022 + deep * 0.3], [R, 0.03 + deep * 0.3], [R * 0.985, 0.036 + deep * 0.3], [R * 0.92, 0.031 + deep * 0.3],
    [R * 0.8, deep + 0.01], [R * 0.64, deep], [R * 0.3, deep], [0, deep]];
  plathe(p, prof, c, paint, x, y, z, seg);
  return y + deep;
}
/** Bowl of radius R / height H; returns the inner radius at height h (relative to the bowl base). */
function bowl(p: THREE.Object3D, R: number, H: number, c: string, x = 0, y = 0, z = 0, paint?: Paint, seg = 24, foot = 0.55): (h: number) => number {
  const t = Math.max(0.01, R * 0.06);
  const outer = (u: number) => R * (foot + (1 - foot) * Math.sin(u * Math.PI / 2));
  const prof: [number, number][] = [[0, 0.01], [R * foot * 0.85, 0.01], [R * foot * 0.88, 0], [R * foot, 0], [R * foot * 1.02, 0.012]];
  for (let i = 1; i <= 5; i++) { const u = i / 5; prof.push([outer(u), 0.012 + (H - 0.012) * u]); }
  prof.push([R - t * 0.5, H + t * 0.35]);
  for (let i = 5; i >= 1; i--) { const u = i / 5; prof.push([Math.max(0.001, outer(u) - t), 0.012 + t + (H - 0.012 - t) * u]); }
  prof.push([0, 0.012 + t]);
  plathe(p, prof, c, paint, x, y, z, seg);
  return (h: number) => { const u = Math.min(1, Math.max(0, (h - 0.012 - t) / (H - 0.012 - t))); return outer(u) - t; };
}
/** Scatter of tiny flat herb flecks. */
function herbs(p: THREE.Object3D, n: number, cx: number, cz: number, R: number, y: (x: number, z: number) => number, cols: string[], size = 0.016): void {
  for (let i = 0; i < n; i++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * R, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    ell(p, jit(cols[i % cols.length]), x, y(x, z) + 0.003, z, size * rr(0.6, 1.1), size * 0.22, size * rr(0.4, 0.7), rnd() * TAU, rr(-0.3, 0.3), rr(-0.3, 0.3), 6);
  }
}
/** Closed tube following a closed path (bread rims, pastry edges). rad(t) → [horizontal, vertical] radii. */
function ringTube(p: THREE.Object3D, N: number, M: number, path: (t: number) => V3, rad: (t: number) => [number, number], c: string, paint?: Paint): THREE.Mesh {
  const pos: number[] = [], idx: number[] = [];
  const P = new THREE.Vector3(), T = new THREE.Vector3(), S = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < N; i++) {
    const t = i / N;
    P.set(...path(t));
    T.set(...path(t + 1e-3)).sub(new THREE.Vector3(...path(t - 1e-3))).normalize();
    S.crossVectors(T, up).normalize();
    const [rw, rh] = rad(t);
    for (let j = 0; j < M; j++) {
      const f = (j / M) * TAU;
      pos.push(P.x + S.x * Math.cos(f) * rw, P.y + Math.sin(f) * rh, P.z + S.z * Math.cos(f) * rw);
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
    const a = i * M + j, b = i * M + (j + 1) % M, c2 = ((i + 1) % N) * M + j, d = ((i + 1) % N) * M + (j + 1) % M;
    idx.push(a, b, c2, b, d, c2);
  }
  // orientation probe: first face normal vs. outward direction from its ring centre
  const v = (k: number) => new THREE.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
  const A = v(idx[0]), B = v(idx[1]), C = v(idx[2]);
  const nrm = B.clone().sub(A).cross(C.clone().sub(A));
  P.set(...path(0));
  if (nrm.dot(A.clone().sub(P)) < 0) for (let k = 0; k < idx.length; k += 3) { const tmp = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = tmp; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return add(p, paintFaces(geo, c, paint), VC(), 0, 0, 0, 1, 1, 1);
}
/** Citrus half lying cut-side up, resting on y. */
function citrusHalf(p: THREE.Object3D, x: number, y: number, z: number, r: number, peel = '#5aa02c', flesh = '#d4e88a'): void {
  const h = r * 0.6;
  plathe(p, [[0, 0], [r * 0.5, 0.06 * r], [r * 0.85, 0.28 * r], [r, h]], peel, undefined, x, y, z, 14);
  plathe(p, [[r, h], [r * 0.9, h + 0.002], [0, h + 0.002]], flesh, (px, _py, pz) => {
    const a = Math.atan2(pz, px), d = Math.hypot(px, pz);
    return d > r * 0.9 ? '#f2f1d8' : Math.abs(((a / TAU) * 9 + 9) % 1 - 0.5) > 0.42 ? '#eef3c8' : null;
  }, x, y, z, 14);
}
/** Drinking glass: coloured drink inside a translucent tumbler. */
function glass(p: THREE.Object3D, x: number, y: number, z: number, r: number, h: number, drink: string, fill = 0.75): void {
  add(p, CYLG(14), mat(drink, { flat: false, rough: 0.3 }), x, y + 0.004 + h * fill / 2, z, r * 0.9, h * fill, r * 0.9).castShadow = false;
  const m = add(p, g('t2:glass', () => new THREE.LatheGeometry([[0, 0], [0.92, 0], [1, 1], [0.94, 1], [0.86, 0.04], [0, 0.04]].map(([a, b]) => new THREE.Vector2(a, b)), 16)),
    mat('#e8f2f8', { transparent: 0.35, flat: false, rough: 0.1, metal: 0.2 }), x, y, z, r, h, r);
  m.castShadow = false;
}
/** Translucent steam puffs (not baked). */
function steam(p: THREE.Object3D, x: number, y: number, z: number, n = 3, s = 1): void {
  const m = mat('#ffffff', { transparent: 0.28, flat: false });
  for (let i = 0; i < n; i++) {
    const h = y + 0.06 * s + i * 0.07 * s;
    add(p, SPH(8), m, x + Math.sin(i * 1.7) * 0.03 * s, h, z + Math.cos(i * 2.3) * 0.02 * s,
      0.035 * s * (1 + i * 0.25), 0.05 * s, 0.03 * s * (1 + i * 0.2)).castShadow = false;
  }
}
/** Rim paint: coloured band on the plate edge. */
const rimBand = (R: number, band: string, inner = 0.86): Paint => (x, _y, z) => (Math.hypot(x, z) > R * inner ? band : null);
/** Simple leaf: flat pointed ellipse with a midrib, lying at y. */
function leaf(p: THREE.Object3D, c: string, x: number, y: number, z: number, L: number, ry: number, W = 0.35, curl = 0.2): void {
  const vb = new VB();
  const N = 6, w = L * W;
  const pt = (u: number, s: number): V3 => {
    const hw = Math.sin(u * Math.PI) * w * 0.5 * s;
    return [u * L - L / 2, curl * L * (Math.abs(s) * 0.3 + u * (1 - u)) * 0.6, hw];
  };
  const tr = (q: V3): V3 => { const cr = Math.cos(ry), sr = Math.sin(ry); return [x + q[0] * cr + q[2] * sr, y + q[1], z - q[0] * sr + q[2] * cr]; };
  for (let i = 0; i < N; i++) {
    const u0 = i / N, u1 = (i + 1) / N;
    vb.quad(tr(pt(u0, 0)), tr(pt(u1, 0)), tr(pt(u1, 1)), tr(pt(u0, 1)), c);
    vb.quad(tr(pt(u0, -1)), tr(pt(u1, -1)), tr(pt(u1, 0)), tr(pt(u0, 0)), shade(c, 0.88));
  }
  vb.tri(tr(pt(0, 0)), tr(pt(0, 1)), tr(pt(0, -1)), c);
  vb.mesh(p, true);
}

// ───────────────────────────── Ceviche (Lima) ─────────────────────────────
const fd_ceviche: Builder = (gp) => {
  srand(301);
  const H = table(gp, 'teak');
  const px = -0.04, pz = 0.0, PR = 0.36;
  const fl = plate(gp, PR, '#f7f6f1', px, H, pz, rimBand(PR, '#2c6fb0', 0.9), 0.012, 40);
  // leche de tigre pool
  glossy(pdisc(gp, PR * 0.62, '#eeeedd', (x, _y, z) => (fbm(x * 20, 0, z * 20) > 0.62 ? '#e4e8c8' : null), px, fl + 0.002, pz, 4, 32));
  // lettuce bed under the mound
  for (let i = 0; i < 4; i++) leaf(gp, i % 2 ? '#7ab84a' : '#93c85a', px - 0.12 + i * 0.03, fl + 0.006, pz - 0.12 + rr(-0.02, 0.02), 0.13, -0.6 + i * 0.25, 0.55, 0.3);
  // fish cubes piled into a mound
  const fishG = g('t2:fish', () => {
    const b = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
    const pp = b.getAttribute('position');
    for (let i = 0; i < pp.count; i++) {
      const vx = pp.getX(i), vy = pp.getY(i), vz = pp.getZ(i);
      const k = 1 - 0.18 * (Math.abs(vx * vy) + Math.abs(vy * vz) + Math.abs(vx * vz));
      pp.setXYZ(i, vx * k, vy * k, vz * k);
    }
    b.computeVertexNormals();
    return paintFaces(b, '#fff6ec', (x, y, z) => (hash3(x * 9, y * 9, z * 9) > 0.7 ? '#fae2d8' : y > 0.4 ? '#ffffff' : null));
  });
  const fishM = mat('#ffffff', { vc: true, flat: false, rough: 0.35, metal: 0.0 });
  for (let i = 0; i < 42; i++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * 0.15, x = px + Math.cos(a) * d, z = pz + Math.sin(a) * d;
    const h = fl + 0.02 + (0.15 - d) * 0.85 + rnd() * 0.012;
    const s = rr(0.042, 0.054);
    add(gp, fishG, fishM, x, h, z, s, s * 0.85, s, rnd() * TAU, rr(-0.5, 0.5), rr(-0.5, 0.5));
  }
  // red onion slivers arcing over the fish
  for (let i = 0; i < 14; i++) {
    const a = rnd() * TAU, d = rr(0.0, 0.12), x = px + Math.cos(a) * d, z = pz + Math.sin(a) * d;
    const h = fl + 0.055 + (0.15 - d) * 0.85, b = rnd() * TAU, L = rr(0.045, 0.065);
    strip(gp, [[x - Math.cos(b) * L, h - 0.01, z - Math.sin(b) * L], [x, h + 0.012, z], [x + Math.cos(b + 0.6) * L, h - 0.008, z + Math.sin(b + 0.6) * L]],
      0.007, i % 3 ? '#b0306e' : '#ecc6de');
  }
  // ají limo slivers + cilantro
  for (let i = 0; i < 6; i++) {
    const a = rnd() * TAU, d = rr(0, 0.09), x = px + Math.cos(a) * d, z = pz + Math.sin(a) * d, b = rnd() * TAU;
    strip(gp, [[x, fl + 0.07 + (0.15 - d) * 0.85, z], [x + Math.cos(b) * 0.03, fl + 0.065 + (0.15 - d) * 0.85, z + Math.sin(b) * 0.03]], 0.005, i % 2 ? '#e8351e' : '#f5c320');
  }
  herbs(gp, 22, px, pz, 0.13, (x, z) => fl + 0.06 + (0.15 - Math.hypot(x - px, z - pz)) * 0.85, ['#2f8a34', '#4fae44'], 0.02);
  // sweet potato rounds (camote)
  for (const [a, d] of [[0.5, 0.22], [1.0, 0.24], [3.6, 0.22]]) {
    const x = px + Math.cos(a) * d, z = pz + Math.sin(a) * d;
    disc(gp, '#f0902a', x, fl + 0.002, z, 0.052, 0.018, 14);
    pdisc(gp, 0.05, '#f5a43a', (qx, _y, qz) => (Math.hypot(qx, qz) > 0.044 ? '#c96a1c' : null), x, fl + 0.0205, z, 2, 14);
  }
  // choclo cob segment and loose kernels
  const cz = pz + 0.22, cx = px - 0.12;
  const cob = grp(gp, cx, fl + 0.035, cz, 0.4, 0, Math.PI / 2);
  disc(cob, '#f2e2a2', 0, -0.06, 0, 0.022, 0.12, 8);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) {
    const a = k / 9 * TAU + r * 0.35;
    ell(cob, jit('#f3dc8c', 0.05), Math.cos(a) * 0.028, -0.045 + r * 0.03, Math.sin(a) * 0.028, 0.013, 0.014, 0.012, -a, 0, 0, 6);
  }
  for (let i = 0; i < 7; i++) {
    const a = 2.2 + i * 0.25, d = 0.26 + rr(-0.02, 0.02);
    ell(gp, jit('#c9a35a', 0.06), px + Math.cos(a) * d, fl + 0.011, pz + Math.sin(a) * d, 0.012, 0.009, 0.01, rnd() * TAU, 0, 0, 6);
  }
  citrusHalf(gp, px + 0.2, fl + 0.002, pz - 0.15, 0.05);
  citrusHalf(gp, 0.38, H, 0.3, 0.045);
  // glass of chicha morada
  glass(gp, 0.35, H, -0.3, 0.055, 0.15, '#5a1a4a');
};

// ───────────────────────────── Arepas (Caracas) ─────────────────────────────
const arepaG = () => g('t2:arepa', () => {
  const prof: [number, number][] = [];
  for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + i / 8 * Math.PI; prof.push([0.82 + Math.cos(a) * 0.18, 0.5 + Math.sin(a) * 0.5]); }
  const pts = [new THREE.Vector2(0.0001, 0), ...prof.map(([r, y]) => new THREE.Vector2(r, y)), new THREE.Vector2(0.0001, 1)];
  const geo = new THREE.LatheGeometry(pts, 20);
  geo.computeVertexNormals();
  return paintFaces(geo, '#efd9a0', (x, y, z) => {
    const f = fbm(x * 3.2, y * 2, z * 3.2, 3);
    if (Math.abs(y - 0.5) > 0.42 && f > 0.55) return f > 0.66 ? '#5a3a1a' : '#a4703a';
    return hash3(x * 30, y * 30, z * 30) > 0.85 ? '#e2c486' : null;
  });
});
function arepa(p: THREE.Object3D, x: number, y: number, z: number, r: number, h: number, ry = 0): void {
  add(p, arepaG(), VC(), x, y, z, r, h, r, ry);
}
/** Split arepa: bottom half, filling, top half lifted and tilted back. */
function splitArepa(p: THREE.Object3D, x: number, y: number, z: number, r: number, ry: number, fill: (q: THREE.Group, top: number) => void): void {
  const q = grp(p, x, y, z, ry);
  arepa(q, 0, 0, 0, r, 0.026);
  pdisc(q, r * 0.88, '#f6ecd0', (px, _y, pz) => (hash3(px * 60, 0, pz * 60) > 0.8 ? '#efe0b4' : null), 0, 0.0265, 0, 3, 18);
  fill(q, 0.028);
  const t = grp(q, 0, 0.06, -r * 0.6, 0, -0.6);
  arepa(t, 0, 0, 0, r, 0.026);
}
const fd_arepa: Builder = (gp) => {
  srand(302);
  const H = table(gp, 'wood');
  // budare (cast-iron griddle) at back-left with two arepas toasting
  const bx = -0.2, bz = -0.2;
  plathe(gp, [[0, 0], [0.2, 0], [0.205, 0.016], [0.198, 0.018], [0.19, 0.008], [0, 0.008]], '#2a2826', undefined, bx, H, bz, 28);
  cube(gp, '#2a2826', bx - 0.24, H + 0.004, bz - 0.04, 0.08, 0.01, 0.024, 0.3);
  arepa(gp, bx - 0.07, H + 0.008, bz + 0.03, 0.085, 0.042, 0.4);
  arepa(gp, bx + 0.08, H + 0.008, bz - 0.04, 0.085, 0.042, 1.2);
  // wooden board with split stuffed arepas
  const wx = 0.08, wz = 0.12;
  const board = grp(gp, wx, H, wz, -0.25);
  cube(board, '#c28d55', 0, 0, 0, 0.5, 0.022, 0.3);
  cube(board, '#a87240', 0.27, 0, 0, 0.06, 0.016, 0.04);
  // reina pepiada (chicken-avocado)
  splitArepa(board, -0.11, 0.022, 0.02, 0.1, 0.2, (q, t) => {
    lump(q, '#b4c86a', 0, t, 0.01, 0.075, 0.03, 0.075, { amp: 0.18, f: 3, s: 1,
      paint: (x, y, z) => (fbm(x * 4, y * 4, z * 4) > 0.55 ? '#e7dcae' : hash3(x * 20, y * 20, z * 20) > 0.85 ? '#7a9a3a' : null) });
  });
  // pabellón: black beans, shredded beef, white cheese, sweet plantain
  splitArepa(board, 0.12, 0.022, -0.01, 0.1, -0.3, (q, t) => {
    for (let i = 0; i < 16; i++) { const a = rnd() * TAU, d = rr(0, 0.05); ell(q, jit('#23181a', 0.1), Math.cos(a) * d - 0.02, t + 0.008, Math.sin(a) * d + 0.02, 0.009, 0.007, 0.007, rnd() * 3, 0, 0, 6); }
    for (let i = 0; i < 9; i++) { const a = rnd() * TAU, x = rr(-0.03, 0.04), z = rr(-0.03, 0.03); strip(q, [[x, t + 0.016, z], [x + Math.cos(a) * 0.035, t + 0.022, z + Math.sin(a) * 0.035]], 0.005, i % 2 ? '#8a4a2a' : '#a65a32'); }
    cube(q, '#f6f2e4', 0.02, t + 0.016, -0.03, 0.04, 0.012, 0.025, 0.4);
    lump(q, '#e9a038', 0.045, t + 0.018, 0.03, 0.04, 0.012, 0.018, { amp: 0.1, ry: 0.8, paint: (x, y) => (y > 0.3 ? '#b5641c' : null) });
  });
  // guasacaca bowl
  const gx = 0.3, gz = -0.18;
  const ir = bowl(gp, 0.075, 0.05, '#d5cfc4', gx, H, gz, (_x, y) => (y > 0.044 ? '#7a6a5a' : null), 18);
  glossy(lump(gp, '#6aa83a', gx, H + 0.04, gz, ir(0.04), 0.012, ir(0.04), { amp: 0.15, paint: (x, y, z) => (hash3(x * 20, y * 20, z * 20) > 0.8 ? '#3e7a24' : null) }));
  // fresh avocado halves and a jug of papelón con limón
  const av = grp(gp, -0.3, H, 0.2, 0.6);
  lump(av, '#3a5a1c', 0, 0.02, 0, 0.055, 0.025, 0.04, { amp: 0.05 });
  pdisc(av, 0.05, '#d8e48a', (x, _y, z) => (Math.hypot(x * 0.75, z) > 0.034 ? '#9ac04a' : null), 0, 0.04, 0, 3, 16).scale.set(1, 1, 0.75);
  ell(av, '#8a5a2a', 0.005, 0.042, 0, 0.018, 0.012, 0.016, 0, 0, 0, 8);
  // queso blanco
  const qb = grp(gp, -0.36, H, 0.0, 0.5);
  cube(qb, '#f8f6ec', 0, 0, 0, 0.09, 0.05, 0.07);
  cube(qb, '#f8f6ec', 0.0, 0, 0.065, 0.06, 0.03, 0.04, 0.3);
};

// ───────────────────────────── Bunny chow (Durban) ─────────────────────────────
const fd_bunnychow: Builder = (gp) => {
  srand(303);
  const H = table(gp, 'cloth', ['#e0a82a', '#f6efd8']);
  // paper wrapping under the loaf
  const pw = grp(gp, -0.02, H, 0.0, 0.3);
  cube(pw, '#efe6d0', 0, 0, 0, 0.42, 0.004, 0.4);
  // quarter loaf, scooped out from the cut face on top; crust outside, soft crumb on the cut faces (+y, +z)
  const L = grp(gp, -0.03, H + 0.005, -0.03, 0.35);
  const W = 0.27, D = 0.24, BH = 0.17;
  const crust = '#c47e34', crumb = '#f6ecd0';
  const loafG = (key: string, cutY: boolean, cutZ: boolean) => g('t2:loaf' + key, () => {
    const b = new THREE.BoxGeometry(1, 1, 1, 6, 6, 6);
    const pp = b.getAttribute('position');
    for (let i = 0; i < pp.count; i++) {
      const x = pp.getX(i) * 2, y = pp.getY(i) * 2, z = pp.getZ(i) * 2;
      const ex = 8;
      const k = 1 / Math.max(1e-4, Math.pow(Math.pow(Math.abs(x), ex) + Math.pow(Math.abs(y), ex) + Math.pow(Math.abs(z), ex), 1 / ex));
      pp.setXYZ(i, x * k * 0.5, y * k * 0.5, z * k * 0.5);
    }
    b.computeVertexNormals();
    return paintFaces(b, crust, (x, y, z, nx, ny, nz) => {
      const pore = hash3(x * 41, y * 41, z * 41);
      if ((cutY && ny > 0.75) || (cutZ && nz > 0.75)) return pore > 0.82 ? '#e6d6ae' : crumb;
      const f = fbm(x * 14, y * 14, z * 14, 2);
      return f > 0.66 ? '#a8692a' : f < 0.3 ? '#d08c40' : null;
    });
  });
  add(L, loafG('q', true, true), VC(), 0, BH / 2, 0, W, BH, D);
  // curry heaped into the hollow, glossy and overflowing
  const cy = BH - 0.006;
  glossy(lump(L, '#c8521c', -0.005, cy, -0.005, W / 2 - 0.03, 0.035, D / 2 - 0.03, { amp: 0.16, f: 2.5, seg: 14, flatBottom: true,
    paint: (x, y, z) => { const f = fbm(x * 4, y * 4, z * 4); return f > 0.6 ? '#a83a12' : f < 0.35 ? '#e0742a' : null; } }));
  // mutton chunks + potatoes poking out
  for (let i = 0; i < 9; i++) {
    const x = rr(-0.08, 0.08), z = rr(-0.07, 0.07);
    lump(L, i % 3 === 0 ? '#eebc5a' : '#7a3a1c', x, cy + 0.025, z, rr(0.024, 0.032), 0.02, rr(0.022, 0.03), { amp: 0.22, seg: 7, s: i * 3, ry: rnd() * 3,
      paint: i % 3 === 0 ? (_x, py) => (py > 0.4 ? '#d8a040' : null) : (qx, qy, qz) => (fbm(qx * 5, qy * 5, qz * 5) > 0.55 ? '#5a2a14' : null) });
  }
  herbs(L, 16, 0, 0, 0.09, () => cy + 0.035, ['#2f8a34', '#4fae44'], 0.016);
  // curry dribbling down the crumb face and over the crust
  for (const [x, len] of [[-0.07, 0.07], [0.0, 0.11], [0.08, 0.05]]) {
    glossy(sweep(L, [{ p: [x, BH + 0.006, D / 2 - 0.01], w: 0.014, h: 0.005 }, { p: [x, BH - 0.01, D / 2 + 0.003], w: 0.011, h: 0.004 }, { p: [x + 0.004, BH - len * 0.7, D / 2 + 0.002], w: 0.008, h: 0.004 }],
      '#d0601e', { radial: 6, sub: 3 }));
  }
  // the scooped-out bread plug rests against the loaf, ready for dipping
  const vg = grp(gp, 0.22, H + 0.04, 0.06, -0.5, 0, 0.9);
  add(vg, loafG('v', false, true), VC(), 0, 0, 0, 0.1, 0.08, 0.09);
  // sambals: grated carrot-chilli salad and onion-tomato
  const sx = 0.3, sz = 0.24;
  const ir = bowl(gp, 0.08, 0.04, '#f4f2ea', sx, H, sz, rimBand(0.08, '#2a7a6a', 0.9), 18);
  for (let i = 0; i < 22; i++) {
    const a = rnd() * TAU, d = rr(0, ir(0.03) * 0.8), x = sx + Math.cos(a) * d, z = sz + Math.sin(a) * d, b = rnd() * TAU;
    strip(gp, [[x, H + 0.032 + rnd() * 0.01, z], [x + Math.cos(b) * 0.03, H + 0.036 + rnd() * 0.01, z + Math.sin(b) * 0.03]], 0.0035, i % 5 ? '#f08a24' : '#e0281a');
  }
  const ox = 0.32, oz = -0.06;
  const ir2 = bowl(gp, 0.07, 0.04, '#f4f2ea', ox, H, oz, rimBand(0.07, '#2a7a6a', 0.9), 18);
  glossy(lump(gp, '#d8402a', ox, H + 0.03, oz, ir2(0.03), 0.01, ir2(0.03), { amp: 0.2, paint: (x, y, z) => (hash3(x * 15, y * 15, z * 15) > 0.7 ? '#f0e6e8' : null) }));
  // fork in the curry and a cold drink
  const fk = grp(gp, -0.3, H + 0.006, 0.26, -0.5);
  cube(fk, '#b8c0c8', 0, 0, 0, 0.18, 0.006, 0.014);
  for (let i = 0; i < 4; i++) cube(fk, '#b8c0c8', 0.11, 0, -0.012 + i * 0.008, 0.05, 0.005, 0.004);
  plathe(gp, [[0, 0], [0.045, 0], [0.048, 0.16], [0.044, 0.16], [0.04, 0.006], [0, 0.006]], '#c83a3a', (_x, y) => (y > 0.06 && y < 0.11 ? '#f6f2e6' : null), -0.32, H, -0.24, 18);
  steam(gp, -0.03, H + BH + 0.03, -0.03, 3, 1);
};

// ───────────────────────────── Adjarian khachapuri (Batumi) ─────────────────────────────
const fd_khachapuri: Builder = (gp) => {
  srand(304);
  const H = table(gp, 'dark');
  // wooden board
  plathe(gp, [[0, 0], [0.4, 0], [0.41, 0.016], [0.4, 0.024], [0, 0.024]], '#b47a44', (x, _y, z) => {
    const v = fbm(x * 30, 1, z * 4, 3); return v > 0.6 ? '#9a6234' : v < 0.35 ? '#c48a52' : null;
  }, 0, H, 0, 32);
  cube(gp, '#a86e3a', 0.38, H, -0.2, 0.12, 0.02, 0.05, 0.5);
  const by = H + 0.024;
  const K = grp(gp, -0.03, by, 0.0, 0.25);
  const Lx = 0.32, Wz = 0.15;
  const crust = '#d9993f';
  // bread underside (flattened ellipsoid)
  lump(K, crust, 0, 0.022, 0, Lx * 0.95, 0.03, Wz * 0.95, { amp: 0.05, seg: 16, flatBottom: true,
    paint: (x, y, z) => (y < -0.1 ? '#b8762a' : fbm(x * 5, y * 5, z * 5) > 0.6 ? '#c4782a' : null) });
  // braided rim of the boat: pointed lens outline, tips raised and twisted
  const path = (t: number): V3 => {
    const a = t * TAU, cx = Math.cos(a), sz = Math.sin(a);
    const z = sz * Wz * Math.pow(Math.abs(sz), 0.15) * (1 - 0.18 * cx * cx);
    const tip = Math.pow(Math.abs(cx), 6);
    return [cx * Lx, 0.05 + tip * 0.035, z];
  };
  ringTube(K, 64, 10, path, (t) => {
    const cx = Math.abs(Math.cos(t * TAU));
    const k = 1 - 0.55 * Math.pow(cx, 4);
    return [0.05 * k, 0.04 * k];
  }, crust, (x, y, z) => {
    const f = fbm(x * 12, y * 12, z * 12, 3);
    if (y > 0.075 && f > 0.48) return f > 0.6 ? '#8a4a1a' : '#b46a26';
    return f < 0.35 ? '#e8b05a' : null;
  });
  // twisted tip knobs
  for (const s of [-1, 1]) lump(K, crust, s * (Lx + 0.005), 0.085, 0, 0.03, 0.024, 0.022, { amp: 0.1, seg: 8, paint: (_x, y) => (y > 0.3 ? '#a85e22' : null) });
  // molten cheese pool, glossy, with browned blisters
  glossy(lump(K, '#f5d470', 0, 0.06, 0, Lx * 0.7, 0.018, Wz * 0.6, { amp: 0.1, seg: 18, f: 3,
    paint: (x, y, z) => { const f = fbm(x * 6, y * 6, z * 6); return f > 0.64 ? '#d89a3a' : f < 0.3 ? '#fbe8a4' : null; } }));
  // egg yolk + white, and a pat of butter melting beside it
  ell(K, '#fbf6e8', -0.03, 0.072, 0.0, 0.07, 0.008, 0.055, 0.2, 0, 0, 12);
  glossy(ell(K, '#f2a20e', -0.03, 0.078, 0.0, 0.035, 0.022, 0.035, 0, 0, 0, 12));
  glossy(cube(K, '#fbeaa0', 0.07, 0.068, -0.01, 0.045, 0.02, 0.035, 0.5, 0.06, 0));
  // fork and knife
  const fk = grp(gp, 0.15, H + 0.004, 0.32, -0.2);
  cube(fk, '#c0c6cc', 0, 0, 0, 0.2, 0.006, 0.014);
  for (let i = 0; i < 4; i++) cube(fk, '#c0c6cc', 0.12, 0, -0.012 + i * 0.008, 0.05, 0.005, 0.004);
  const kn = grp(gp, 0.18, H + 0.004, 0.37, -0.2);
  cube(kn, '#c0c6cc', 0, 0, 0, 0.22, 0.006, 0.018);
  // Georgian salad + glass of tarragon lemonade
  const sx = -0.3, sz = 0.3;
  const sp = plate(gp, 0.11, '#f4f2ea', sx, H, sz, rimBand(0.11, '#7a1f2a', 0.88), 0.01, 24);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU, x = sx + Math.cos(a) * 0.045, z = sz + Math.sin(a) * 0.045;
    plathe(gp, [[0, 0], [0.03, 0], [0.026, 0.01], [0, 0.014]], '#d83020', (qx, _y, qz) => (Math.hypot(qx, qz) < 0.018 ? '#f06a40' : null), x, sp, z, 12);
  }
  for (let i = 0; i < 6; i++) disc(gp, '#9ac86a', sx + rr(-0.04, 0.04), sp + 0.012, sz + rr(-0.04, 0.04), 0.018, 0.005, 10);
  herbs(gp, 10, sx, sz, 0.06, () => sp + 0.016, ['#2f8a34'], 0.014);
  glass(gp, 0.3, H, -0.3, 0.046, 0.15, '#8ad04a', 0.8);
  for (let i = 0; i < 3; i++) leaf(gp, '#3a8a2a', 0.3 + rr(-0.01, 0.01), H + 0.128 + i * 0.002, -0.3 + rr(-0.01, 0.01), 0.04, rnd() * TAU, 0.45, 0.3);
};

// ───────────────────────────── Plov (Tashkent) ─────────────────────────────
/** Round flatbread (non) with a thick rim and a stamped, seeded centre. */
function nonBread(p: THREE.Object3D, x: number, y: number, z: number, R: number, ry = 0, rx = 0): void {
  const q = grp(p, x, y, z, ry, rx);
  plathe(q, [[0, 0.008], [R * 0.6, 0.008], [R * 0.64, 0.004], [R * 0.7, 0], [R * 0.92, 0.002], [R, 0.016], [R * 0.95, 0.034], [R * 0.82, 0.036],
    [R * 0.68, 0.022], [R * 0.6, 0.016], [0, 0.016]], '#c88038', (px, py, pz) => {
    const d = Math.hypot(px, pz);
    if (py < 0.006 && d < R * 0.9) return '#e8c48a';
    if (d < R * 0.58) {
      const a = Math.atan2(pz, px);
      if (Math.abs(((a / TAU) * 12 + 12) % 1 - 0.5) > 0.44 || Math.abs(d - R * 0.3) < R * 0.03) return '#a4602a';
      return hash3(px * 90, 1, pz * 90) > 0.86 ? '#f4ecd8' : '#d49a54';
    }
    return fbm(px * 20, py * 20, pz * 20) > 0.58 ? '#a8622a' : null;
  }, 0, 0, 0, 28);
}
const fd_plov: Builder = (gp) => {
  srand(305);
  const H = table(gp, 'teak');
  // lagan: big blue-and-white Rishtan-style platter
  const px = -0.06, pz = -0.04, PR = 0.34;
  const fl = plate(gp, PR, '#f4f6fa', px, H, pz, (x, _y, z) => {
    const d = Math.hypot(x, z), a = Math.atan2(z, x);
    if (d > PR * 0.97) return '#1d4f9a';
    if (d > PR * 0.78) {
      const m = Math.abs(Math.sin(a * 12));
      return m > 0.8 && d > PR * 0.84 && d < PR * 0.93 ? '#1d4f9a' : m < 0.25 && d > PR * 0.86 ? '#3a8ac8' : d < PR * 0.8 ? '#1d4f9a' : null;
    }
    return null;
  }, 0.016, 44);
  // golden rice mound
  const RR = 0.23, RH = 0.11;
  const rh = (x: number, z: number) => { const d = Math.hypot(x - px, z - pz) / RR; return d >= 1 ? 0 : RH * Math.sqrt(1 - d * d); };
  lump(gp, '#eab866', px, fl + 0.004, pz, RR, RH, RR, { amp: 0.03, f: 7, seg: 28, flatBottom: true,
    paint: (x, y, z) => { const h = hash3(x * 60, y * 60, z * 60); return h > 0.75 ? '#f4d494' : h < 0.2 ? '#dca050' : null; } });
  // rice grains scattered on the surface for texture
  const grain = mat('#f6dfa8', { flat: false });
  for (let i = 0; i < 70; i++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * RR * 0.95, x = px + Math.cos(a) * d, z = pz + Math.sin(a) * d;
    add(gp, SPH(5), grain, x, fl + rh(x, z) + 0.004, z, 0.009, 0.004, 0.004, rnd() * TAU);
  }
  // yellow + orange carrot batons fanned over the rice
  for (let i = 0; i < 34; i++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * RR * 0.85, x = px + Math.cos(a) * d, z = pz + Math.sin(a) * d;
    const y = fl + rh(x, z) + 0.006, b = rnd() * TAU, L = rr(0.04, 0.06);
    add(gp, BOXG(), mat(i % 3 ? '#f07a1c' : '#f4b830', { flat: false }), x, y, z, L, 0.01, 0.01, b, 0, -Math.atan2(rh(x + 0.01, z) - rh(x, z), 0.01) * 0.5);
  }
  // lamb chunks on top
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * TAU + 0.3, d = 0.09 + rr(-0.02, 0.02), x = px + Math.cos(a) * d, z = pz + Math.sin(a) * d;
    lump(gp, '#7a4424', x, fl + rh(x, z) + 0.008, z, 0.03, 0.022, 0.026, { amp: 0.2, seg: 8, s: i * 1.7, ry: a,
      paint: (qx, qy, qz) => (fbm(qx * 4, qy * 4, qz * 4) > 0.56 ? '#4a2412' : qy > 0.5 ? '#9a5a30' : null) });
  }
  // whole garlic head crowning the mound
  const gx = px, gz = pz, gy = fl + RH + 0.01;
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU;
    ell(gp, '#f2e6d4', gx + Math.cos(a) * 0.016, gy + 0.02, gz + Math.sin(a) * 0.016, 0.016, 0.026, 0.014, -a, 0, Math.cos(a) * 0.3, 8);
  }
  ell(gp, '#e4d2b8', gx, gy + 0.024, gz, 0.026, 0.028, 0.026, 0, 0, 0, 10);
  disc(gp, '#c8b08a', gx, gy + 0.045, gz, 0.004, 0.012, 6);
  // chickpeas, raisins, quail eggs
  for (let i = 0; i < 14; i++) {
    const a = rnd() * TAU, d = rr(0.06, RR * 0.9), x = px + Math.cos(a) * d, z = pz + Math.sin(a) * d;
    ell(gp, i % 2 ? '#e6c47a' : '#2a1820', x, fl + rh(x, z) + 0.006, z, i % 2 ? 0.011 : 0.008, i % 2 ? 0.01 : 0.006, i % 2 ? 0.011 : 0.007, rnd() * 3, 0, 0, 6);
  }
  for (let i = 0; i < 5; i++) {
    const a = 0.4 + i * 1.25, d = RR + 0.035, x = px + Math.cos(a) * d, z = pz + Math.sin(a) * d;
    ell(gp, '#fbf8f0', x, fl + 0.006, z, 0.024, 0.014, 0.018, -a, 0, 0, 10);
    ell(gp, '#f4b42a', x, fl + 0.014, z, 0.011, 0.006, 0.009, -a, 0, 0, 8);
  }
  // non bread leaning at the back + tea bowl (piala) and teapot spout hint
  nonBread(gp, 0.3, H, 0.3, 0.15, 0.4, 0);
  const cx = 0.36, cz = -0.3;
  bowl(gp, 0.055, 0.045, '#f4f6fa', cx, H, cz, (x, y, z) => {
    const a = Math.atan2(z - cz, x - cx);
    if (y > 0.036) return '#1d4f9a';
    return y > 0.012 && Math.abs(Math.sin(a * 5)) > 0.85 ? '#3a8ac8' : null;
  }, 18);
  disc(gp, '#a8682a', cx, H + 0.02, cz, 0.044, 0.016, 16);
  const tp = grp(gp, -0.33, H, -0.3, 0.6);
  plathe(tp, [[0, 0], [0.05, 0], [0.07, 0.03], [0.072, 0.06], [0.05, 0.1], [0.022, 0.11], [0.03, 0.12], [0, 0.125]], '#f4f6fa', (_x, y) => (y > 0.04 && y < 0.07 ? '#1d4f9a' : null), 0, 0, 0, 18);
  strut(tp, [0.06, 0.05, 0], [0.11, 0.1, 0], 0.012, 0.006, '#f4f6fa', 8);
  sweep(tp, [{ p: [-0.06, 0.09, 0], w: 0.007 }, { p: [-0.1, 0.075, 0], w: 0.007 }, { p: [-0.075, 0.035, 0], w: 0.007 }], '#1d4f9a', { radial: 6, sub: 3 });
  steam(gp, px, fl + RH, pz, 3, 1.1);
};

// ───────────────────────────── Hummus (Beirut) ─────────────────────────────
const pitaG = () => g('t2:pita', () => {
  const sh = new THREE.Shape();
  const r = 0.012, pts: [number, number][] = [[0, 0.11], [-0.07, -0.02], [0.07, -0.02]];
  sh.moveTo(pts[0][0], pts[0][1] - r);
  for (let i = 0; i < 3; i++) { const b = pts[(i + 1) % 3]; sh.quadraticCurveTo(b[0] * 1.02, b[1] - (i === 0 ? r * 0.2 : 0), b[0], b[1]); }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.014, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 4 });
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return paintFaces(geo, '#e8c88a', (x, y, z, _nx, ny) => {
    if (Math.abs(ny) > 0.7) return fbm(x * 30, y * 30, z * 30) > 0.62 ? '#c08a4a' : hash3(x * 50, y, z * 50) > 0.85 ? '#f2dcae' : null;
    return '#f4e4c0';
  });
});
const fd_hummus: Builder = (gp) => {
  srand(306);
  const H = table(gp, 'teak');
  // glazed earthenware bowl
  const bx = -0.06, bz = -0.02, R = 0.27, BH = 0.07;
  const ir = bowl(gp, R, BH, '#c9a27a', bx, H, bz, (x, y, z) => {
    if (y > BH - 0.004) return '#8a5a34';
    const d = Math.hypot(x - bx, z - bz);
    return y > 0.02 && d > R * 0.8 && Math.abs(Math.sin(Math.atan2(z - bz, x - bx) * 16)) < 0.2 ? '#2a6aa0' : y > 0.02 ? '#3a7ab0' : null;
  }, 36, 0.6);
  // hummus surface: raised outer ridge and swirled valley
  const hy = H + BH - 0.025, IR = ir(BH - 0.025);
  const prof: [number, number][] = [];
  for (let i = 10; i >= 0; i--) {
    const u = i / 10;
    prof.push([IR * u, 0.006 + 0.022 * Math.exp(-Math.pow((u - 0.78) / 0.14, 2)) - 0.004 * (1 - u)]);
  }
  plathe(gp, prof, '#ead8b0', (x, y, z) => {
    const a = Math.atan2(z, x), d = Math.hypot(x, z) / IR;
    if (Math.abs(Math.sin(a * 3 + d * 9)) < 0.18 && d > 0.45) return '#d8c294';
    return hash3(x * 80, y * 80, z * 80) > 0.9 ? '#f4e6c4' : null;
  }, bx, hy, bz, 40);
  // olive oil pool in the valley
  glossy(plathe(gp, [[IR * 0.62, 0.006], [IR * 0.4, 0.009], [0, 0.009]], '#c6a82a', (x, _y, z) => (fbm(x * 30, 0, z * 30) > 0.62 ? '#d6c040' : null), bx, hy, bz, 32));
  // whole chickpeas, paprika and parsley
  for (let i = 0; i < 11; i++) {
    const a = rnd() * TAU, d = rr(0, IR * 0.35), x = bx + Math.cos(a) * d, z = bz + Math.sin(a) * d;
    lump(gp, '#e4c27a', x, hy + 0.016, z, 0.012, 0.011, 0.012, { amp: 0.18, seg: 7, s: i, paint: (qx, qy) => (qx > 0.5 && qy > 0 ? '#c8a056' : null) });
  }
  herbs(gp, 30, bx, bz, IR * 0.95, (x, z) => { const d = Math.hypot(x - bx, z - bz) / IR; return hy + 0.006 + 0.022 * Math.exp(-Math.pow((d - 0.78) / 0.14, 2)); },
    ['#c8301a', '#d8481e', '#2f8a34'], 0.012);
  // pita triangles fanned on a small plate
  const tx = 0.27, tz = 0.24;
  const tp = plate(gp, 0.16, '#f2efe6', tx, H, tz, rimBand(0.16, '#3a7ab0', 0.92), 0.01, 28);
  for (let i = 0; i < 5; i++) add(gp, pitaG(), VC(), tx - 0.03 + i * 0.015, tp + 0.008 + i * 0.016, tz + 0.04 - i * 0.015, 1.25, 1.25, 1.25, -0.5 + i * 0.4, 0, 0.08);
  // mezze dish: olives + pink pickled turnips
  const mx = 0.3, mz = -0.22;
  const mr = bowl(gp, 0.09, 0.035, '#3a7ab0', mx, H, mz, undefined, 20);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU, d = mr(0.02) * 0.55;
    glossy(ell(gp, i % 2 ? '#4a5a24' : '#2a1a24', mx + Math.cos(a) * d - 0.02, H + 0.03, mz + Math.sin(a) * d, 0.014, 0.012, 0.011, a, 0, 0, 8));
  }
  for (let i = 0; i < 4; i++) cube(gp, '#e04a8a', mx + 0.03 + rr(-0.01, 0.01), H + 0.026, mz + rr(-0.03, 0.03), 0.04, 0.008, 0.014, rnd() * 3, 0, rr(-0.3, 0.3));
  // falafel on the side
  const fp = plate(gp, 0.11, '#f2efe6', -0.3, H, 0.27, rimBand(0.11, '#3a7ab0', 0.9), 0.008, 24);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU;
    lump(gp, '#7a4a22', -0.3 + Math.cos(a) * 0.045, fp + 0.024 + (i === 4 ? 0.02 : 0), 0.27 + Math.sin(a) * 0.045, 0.03, 0.026, 0.03, { amp: 0.12, seg: 9, s: i * 5,
      paint: (x, y, z) => (hash3(x * 20, y * 20, z * 20) > 0.78 ? '#4a8a2a' : fbm(x * 4, y * 4, z * 4) > 0.55 ? '#5a3214' : null) });
  }
  for (let i = 0; i < 3; i++) leaf(gp, '#3a8a2a', -0.36 + i * 0.03, fp + 0.006, 0.2, 0.06, 0.5 + i, 0.4, 0.15);
  // olive oil cruet
  plathe(gp, [[0, 0], [0.045, 0], [0.05, 0.05], [0.04, 0.09], [0.014, 0.12], [0.012, 0.16], [0, 0.16]], '#c8b03a', undefined, -0.32, H, -0.28, 18);
};

// ───────────────────────────── Lamingtons (Brisbane) ─────────────────────────────
const lamG = (cut: boolean) => g('t2:lam' + (cut ? 'c' : ''), () => {
  const b = new THREE.BoxGeometry(1, 1, 1, 8, 8, 8);
  const pp = b.getAttribute('position');
  for (let i = 0; i < pp.count; i++) {
    let x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i);
    // rounded cube: push towards a superellipsoid
    const k = 0.5 / Math.max(1e-4, Math.pow(Math.pow(Math.abs(x * 2), 6) + Math.pow(Math.abs(y * 2), 6) + Math.pow(Math.abs(z * 2), 6), 1 / 6));
    const n = 1 + (fbm(x * 9, y * 9, z * 9, 2) - 0.5) * 0.06;
    x *= k * 2 * n; y *= k * 2 * n; z *= k * 2 * n;
    if (cut && z > 0.42) z = 0.42;
    pp.setXYZ(i, x, y, z);
  }
  b.computeVertexNormals();
  return paintFaces(b, '#5a3220', (x, y, z, _nx, _ny, nz) => {
    if (cut && nz > 0.9 && z > 0.41) {
      if (Math.abs(y) < 0.04) return '#c8202a';
      if (Math.abs(y - 0.06) < 0.03) return '#fbf6ee';
      return hash3(x * 40, y * 40, 1) > 0.8 ? '#f2d488' : '#f6dc96';
    }
    const h = hash3(x * 53, y * 53, z * 53);
    return h > 0.5 ? '#f8f2e8' : h > 0.25 ? '#dccbb8' : h > 0.12 ? '#8a5a42' : null;
  });
});
const fd_lamington: Builder = (gp) => {
  srand(307);
  const H = table(gp, 'cloth', ['#3a72c0', '#f6f6f2']);
  // white cake plate on a short stand
  const sx = -0.05, sz = -0.02;
  plathe(gp, [[0, 0], [0.1, 0], [0.09, 0.012], [0.04, 0.03], [0.035, 0.06], [0.26, 0.064], [0.27, 0.074], [0.26, 0.078], [0, 0.072]], '#f8f6f2', undefined, sx, H, sz, 36);
  const top = H + 0.074;
  const S = 0.1;
  const spots: [number, number, number, number][] = [[-0.11, -0.08, 0.2, 0], [0.0, -0.11, -0.15, 0], [0.11, -0.06, 0.4, 0], [-0.12, 0.05, -0.3, 0], [0.12, 0.06, 0.1, 0], [-0.06, -0.085, 0.6, 1]];
  for (const [x, z, ry, lvl] of spots) add(gp, lamG(false), VC(), sx + x, top + S / 2 + lvl * S * 0.98, sz + z, S, S, S, ry);
  // cut lamington in front showing sponge, jam and cream
  add(gp, lamG(true), VC(), sx + 0.02, top + S / 2, sz + 0.12, S, S, S, 0.15);
  add(gp, lamG(true), VC(), 0.28, H + S / 2 + 0.012, 0.3, S, S, S, Math.PI - 0.5, 0, 0);
  // tea: cup + saucer
  const tx = 0.3, tz = -0.24;
  plathe(gp, [[0, 0], [0.09, 0], [0.095, 0.01], [0.092, 0.014], [0.05, 0.008], [0, 0.008]], '#f8f6f2', (x, _y, z) => (Math.hypot(x, z) > 0.085 ? '#3a72c0' : null), tx, H, tz, 24);
  bowl(gp, 0.06, 0.065, '#f8f6f2', tx, H + 0.008, tz, (_x, y) => (y > 0.056 ? '#3a72c0' : null), 20, 0.6);
  disc(gp, '#9a5a2a', tx, H + 0.06, tz, 0.052, 0.004, 16);
  sweep(gp, [{ p: [tx + 0.055, H + 0.06, tz], w: 0.006 }, { p: [tx + 0.085, H + 0.05, tz], w: 0.006 }, { p: [tx + 0.07, H + 0.025, tz], w: 0.006 }, { p: [tx + 0.05, H + 0.022, tz], w: 0.006 }], '#f8f6f2', { radial: 6, sub: 3 });
  steam(gp, tx, H + 0.06, tz, 2, 0.8);
  // small plate with a fork and a crumbly half
  const px = -0.3, pz = 0.28;
  const pf = plate(gp, 0.12, '#f8f6f2', px, H, pz, rimBand(0.12, '#3a72c0', 0.9), 0.01, 24);
  for (let i = 0; i < 8; i++) ell(gp, i % 2 ? '#f6f2e8' : '#5a3220', px + rr(-0.05, 0.05), pf + 0.004, pz + rr(-0.05, 0.05), 0.006, 0.004, 0.006, 0, 0, 0, 6);
  const fk = grp(gp, px + 0.02, pf + 0.006, pz, -0.7);
  cube(fk, '#c0c6cc', 0, 0, 0, 0.16, 0.005, 0.012);
  for (let i = 0; i < 3; i++) cube(fk, '#c0c6cc', 0.1, 0, -0.008 + i * 0.008, 0.04, 0.004, 0.004);
  // bowls of desiccated coconut + chocolate icing being made
  const cx = -0.34, cz = -0.2;
  const ci = bowl(gp, 0.08, 0.045, '#d8e0ea', cx, H, cz, undefined, 18);
  lump(gp, '#fbf8f2', cx, H + 0.036, cz, ci(0.035), 0.016, ci(0.035), { amp: 0.25, f: 6, paint: (x, y, z) => (hash3(x * 30, y * 30, z * 30) > 0.6 ? '#ece6da' : null) });
  const ki = bowl(gp, 0.07, 0.04, '#d8e0ea', -0.2, H, -0.36, undefined, 18);
  glossy(pdisc(gp, ki(0.03), '#3a1e12', undefined, -0.2, H + 0.03, -0.36, 2, 18));
};

// ───────────────────────────── Rendang (Padang) ─────────────────────────────
/** Ketupat: rice cake in a woven palm-leaf diamond, corner up, with leaf tails. */
const ketupatG = () => g('t2:ketupat', () => {
  const b = new THREE.BoxGeometry(1, 1, 1, 4, 4, 4);
  b.rotateX(Math.PI / 4); b.rotateZ(Math.PI / 4);
  b.computeVertexNormals();
  return paintFaces(b, '#b8cc62', (x, y, z) => {
    const u = Math.floor((x + y) * 5 + 20), v = Math.floor((z - y) * 5 + 20);
    return (u + v) % 2 ? '#d4dc84' : '#8aa440';
  });
});
function ketupat(p: THREE.Object3D, x: number, y: number, z: number, s: number, ry: number): void {
  const q = grp(p, x, y + s * 0.62, z, ry, 0.15, 0.1);
  add(q, ketupatG(), VC({ flat: true }), 0, 0, 0, s, s, s * 0.8);
  strut(q, [0, s * 0.7, 0], [s * 0.5, s * 1.4, s * 0.1], s * 0.08, s * 0.04, '#9ab84a', 4);
  strut(q, [0, s * 0.7, 0], [-s * 0.35, s * 1.3, -s * 0.2], s * 0.07, s * 0.035, '#9ab84a', 4);
}
const fd_rendang: Builder = (gp) => {
  srand(308);
  const H = table(gp, 'teak');
  // woven rattan plate lined with a banana leaf
  const px = -0.03, pz = 0.0, PR = 0.37;
  plathe(gp, [[0, 0.004], [PR * 0.8, 0.004], [PR, 0.03], [PR * 1.02, 0.036], [PR * 0.97, 0.034], [PR * 0.8, 0.012], [0, 0.012]], '#c89a5a', (x, y, z) => {
    const a = Math.atan2(z, x), d = Math.hypot(x, z);
    return (Math.floor(a * 18) + Math.floor(d * 60)) % 2 ? '#a87a3e' : null;
  }, px, H, pz, 40);
  const ly = H + 0.016;
  const leafG = gridDisc(gp, PR * 0.86, ly, 30, (x, z) => {
    if (Math.abs(z + x * 0.15) < 0.012) return '#a8c86a';
    return Math.abs(Math.sin((x - Math.abs(z) * 0.35) * 26)) < 0.3 ? '#246a20' : shade('#2e7a2a', 0.88 + fbm(x * 10, 0, z * 10) * 0.25);
  }, { cx: px, cz: pz, h: (x, z) => 0.012 * Math.pow(Math.hypot(x, z) / (PR * 0.86), 2) });
  if (leafG) glossy(leafG);
  // white rice dome (pressed in a bowl)
  const rx = px - 0.12, rz = pz - 0.06;
  lump(gp, '#f8f6ee', rx, ly + 0.004, rz, 0.11, 0.09, 0.11, { amp: 0.04, f: 8, seg: 16, flatBottom: true,
    paint: (x, y, z) => (hash3(x * 70, y * 70, z * 70) > 0.75 ? '#ecebe0' : null) });
  // dark caramelised beef chunks with clingy spice paste
  for (let i = 0; i < 12; i++) {
    const a = i * 2.4, d = i < 7 ? 0.1 : 0.045, x = px + 0.1 + Math.cos(a) * d, z = pz + 0.07 + Math.sin(a) * d;
    glossy(lump(gp, '#4a2010', x, ly + 0.026 + (i < 7 ? 0 : 0.03), z, rr(0.05, 0.06), 0.036, rr(0.04, 0.05), { amp: 0.24, f: 2.6, seg: 9, s: i * 2.3, ry: rnd() * 3,
      paint: (qx, qy, qz) => { const f = fbm(qx * 4, qy * 4, qz * 4); return f > 0.6 ? '#2a0e06' : f < 0.35 ? '#7a3a14' : null; } }));
  }
  // rendang spice crumbs (kerisik)
  for (let i = 0; i < 30; i++) {
    const a = rnd() * TAU, d = rr(0.06, 0.24), x = px + 0.06 + Math.cos(a) * d * 0.8, z = pz + 0.06 + Math.sin(a) * d * 0.7;
    ell(gp, i % 3 ? '#6a3014' : '#8a4a1c', x, ly + 0.006, z, rr(0.006, 0.012), 0.005, rr(0.006, 0.01), rnd() * 3, 0, 0, 6);
  }
  // red chillies and a lime leaf / turmeric leaf
  for (let i = 0; i < 3; i++) {
    const x = px + 0.12 + i * 0.03, z = pz - 0.18 + i * 0.02;
    glossy(sweep(gp, [{ p: [x - 0.05, ly + 0.012, z], w: 0.011 }, { p: [x, ly + 0.014, z + 0.01], w: 0.012 }, { p: [x + 0.05, ly + 0.01, z + 0.03], w: 0.004 }], '#d8201a', { radial: 7, sub: 3 }));
    strut(gp, [x - 0.05, ly + 0.012, z], [x - 0.07, ly + 0.018, z - 0.005], 0.004, 0.003, '#3a7a2a', 4);
  }
  leaf(gp, '#2f7a2a', px + 0.02, ly + 0.03, pz + 0.03, 0.09, 0.8, 0.35, 0.2);
  // ketupat (woven rice cakes)
  ketupat(gp, 0.33, H, 0.27, 0.075, 0.4);
  ketupat(gp, 0.2, H, 0.37, 0.065, 1.1);
  // sambal dish + glass of teh talua
  const sxx = 0.32, szz = -0.24;
  const si = bowl(gp, 0.065, 0.035, '#f4f2ea', sxx, H, szz, undefined, 18);
  glossy(lump(gp, '#c8281a', sxx, H + 0.026, szz, si(0.026), 0.01, si(0.026), { amp: 0.2, paint: (x, y, z) => (hash3(x * 20, y * 20, z * 20) > 0.7 ? '#e85a2a' : null) }));
  glass(gp, -0.33, H, -0.27, 0.046, 0.14, '#c8782a', 0.62);
  disc(gp, '#f4e2bc', -0.33, H + 0.004 + 0.14 * 0.62, -0.27, 0.042, 0.03, 14);
};

// ───────────────────────────── Pierogi (Kraków) ─────────────────────────────
/** Half-moon dumpling: flattened sphere cut on one side, with a crimped seam. Local +z is the straight edge. */
const pierogG = () => g('t2:pierog', () => {
  const geo = new THREE.SphereGeometry(1, 18, 10);
  const pp = geo.getAttribute('position');
  for (let i = 0; i < pp.count; i++) {
    const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i);
    // half-moon: the +z hemisphere folds flat into a straight seam, height tapers toward every edge
    const zn = z < 0 ? z : z * 0.1;
    const taper = Math.min(1, Math.max(0.1, (0.1 - zn) / 0.5));
    const rim = Math.abs(y) < 0.3 ? 1 + 0.06 * Math.sin(Math.atan2(zn, x) * 22) * (1 - Math.abs(y) / 0.3) : 1;
    pp.setXYZ(i, x * rim, y * 0.42 * taper, (zn + 0.45) * rim);
  }
  geo.computeVertexNormals();
  return paintFaces(geo, '#f4e6c4', (x, y, z) => {
    const f = fbm(x * 3, y * 3, z * 3, 3);
    if (y > 0.12 && f > 0.55) return f > 0.66 ? '#b47a34' : '#d8a85a';
    return Math.abs(y) < 0.05 ? '#ecd8ae' : null;
  });
});
const fd_pierogi: Builder = (gp) => {
  srand(309);
  const H = table(gp, 'wood');
  // Bolesławiec-style stoneware plate: cobalt with white-dot "peacock eyes"
  const px = -0.03, pz = 0.0, PR = 0.36;
  const fl = plate(gp, PR, '#f4f2ec', px, H, pz, (x, _y, z) => {
    const d = Math.hypot(x, z), a = Math.atan2(z, x);
    if (d > PR * 0.82) {
      const k = ((a / TAU) * 18 + 18) % 1, rd = (d - PR * 0.91) / (PR * 0.08);
      const e = Math.hypot((k - 0.5) * 2.4, rd);
      return e < 0.22 ? '#f4f2ec' : e < 0.4 ? '#2a8a6a' : '#1a3f8f';
    }
    if (d < PR * 0.16) return Math.abs(Math.sin(a * 4)) > 0.5 && d > PR * 0.05 ? '#1a3f8f' : '#2a8a6a';
    return d > PR * 0.75 ? '#1a3f8f' : null;
  }, 0.012, 72);
  const pg = pierogG();
  const PM = mat('#ffffff', { vc: true, flat: false, rough: 0.45, metal: 0.1 });
  const spots: [number, number, number, number][] = [];
  for (let i = 0; i < 6; i++) spots.push([0.18, i / 6 * TAU + 0.2, 0, 0]);
  for (let i = 0; i < 3; i++) spots.push([0.07, i / 3 * TAU + 0.9, 0.018, 1]);
  for (const [d, a, lift, lvl] of spots) {
    const x = px + Math.cos(a) * d, z = pz + Math.sin(a) * d;
    add(gp, pg, PM, x, fl + 0.022 + lift, z, 0.085, 0.07, 0.07, -a + Math.PI / 2 + rr(-0.3, 0.3), lvl ? 0.25 : 0, rr(-0.08, 0.08));
  }
  // golden fried onions and bacon bits (skwarki)
  for (let i = 0; i < 28; i++) {
    const a = rnd() * TAU, d = rr(0, 0.22), x = px + Math.cos(a) * d, z = pz + Math.sin(a) * d, b = rnd() * TAU;
    if (i % 3) strip(gp, [[x, fl + 0.05, z], [x + Math.cos(b) * 0.018, fl + 0.055, z + Math.sin(b) * 0.018], [x + Math.cos(b + 1) * 0.03, fl + 0.05, z + Math.sin(b + 1) * 0.03]], 0.004, i % 2 ? '#c8862a' : '#a8641a');
    else cube(gp, '#8a3a1e', x, fl + 0.046, z, 0.012, 0.009, 0.012, b);
  }
  herbs(gp, 22, px, pz, 0.22, () => fl + 0.06, ['#3a8a2a', '#4fa83a'], 0.013);
  // sour cream dollop
  lump(gp, '#fbfaf4', px + 0.2, fl + 0.004, pz + 0.17, 0.05, 0.03, 0.05, { amp: 0.15, seg: 12, flatBottom: true });
  herbs(gp, 5, px + 0.2, pz + 0.17, 0.02, () => fl + 0.034, ['#3a8a2a'], 0.012);
  // small bowl of barszcz (beet soup) and a dill sprig
  const bx = 0.3, bz = -0.26;
  const bi = bowl(gp, 0.08, 0.05, '#f4f2ec', bx, H, bz, (x, y, z) => (y > 0.044 ? '#1a3f8f' : y > 0.02 && hash3(Math.floor(Math.atan2(z - bz, x - bx) * 4), 1, 1) > 0.5 && y < 0.03 ? '#1a3f8f' : null), 20);
  glossy(pdisc(gp, bi(0.04), '#9a1030', undefined, bx, H + 0.04, bz, 2, 20));
  // pickled cucumber + rye bread
  const cx = -0.33, cz = -0.26;
  glossy(sweep(gp, [{ p: [cx - 0.05, H + 0.02, cz], w: 0.016 }, { p: [cx, H + 0.022, cz + 0.01], w: 0.02 }, { p: [cx + 0.05, H + 0.02, cz], w: 0.016 }], '#5a7a2a', { radial: 8, sub: 3,
    paint: (x, y, z) => (hash3(x * 60, y * 60, z * 60) > 0.75 ? '#8aa848' : null) }));
  const rb = grp(gp, -0.34, H, 0.26, 0.4);
  cube(rb, '#5a3a22', 0, 0, 0, 0.14, 0.02, 0.1);
  cube(rb, '#8a6a4a', 0, 0.02, 0, 0.13, 0.001, 0.09);
  // fork
  const fk = grp(gp, 0.26, H + 0.004, 0.3, -0.9);
  cube(fk, '#c0c6cc', 0, 0, 0, 0.18, 0.006, 0.014);
  for (let i = 0; i < 4; i++) cube(fk, '#c0c6cc', 0.11, 0, -0.012 + i * 0.008, 0.05, 0.005, 0.004);
  steam(gp, px, fl + 0.04, pz, 3, 1);
};

// ───────────────────────────── Jerk chicken (Boston Bay, Portland) ─────────────────────────────
const fd_jerk: Builder = (gp) => {
  srand(310);
  const H = table(gp, 'dark');
  // oil-drum grill: half-drum barrel on legs, lid hinged open behind
  const D = grp(gp, -0.04, H, -0.04, 0.0);
  const R = 0.16, Lg = 0.46, top = 0.2;
  const drumCol = '#2a2a2c';
  const half = (inner: boolean) => {
    const geo = new THREE.CylinderGeometry(R, R, Lg, 16, 1, false, Math.PI / 2, Math.PI);
    if (inner) { const ix = geo.getIndex()!; const a = ix.array as Uint16Array; for (let k = 0; k < a.length; k += 3) { const t = a[k + 1]; a[k + 1] = a[k + 2]; a[k + 2] = t; } }
    geo.computeVertexNormals();
    return paintFaces(geo, inner ? '#3a3330' : drumCol, inner ? (x, y, z) => (fbm(x * 9, y * 9, z * 9) > 0.55 ? '#4a2a1a' : null)
      : (x, y, z) => { const f = fbm(x * 6, y * 3, z * 6); return Math.abs(y) > Lg / 2 - 0.02 || Math.abs(Math.abs(y) - 0.12) < 0.008 ? '#3a3a3e' : f > 0.62 ? '#7a3a1c' : f > 0.56 ? '#5a2a18' : null; });
  };
  // bottom half (bowl facing up): cylinder axis along x
  const outer = half(false), inner = half(true);
  add(D, outer, VC(), 0, top, 0, 1, 1, 1).rotation.set(-Math.PI / 2, 0, Math.PI / 2);
  add(D, inner, VC(), 0, top, 0, 0.97, 0.995, 0.97).rotation.set(-Math.PI / 2, 0, Math.PI / 2);
  // lid: the other half of the drum, swung up and back on a rear hinge
  const lid = grp(D, 0, top, -R, 0, -1.95);
  add(lid, outer, VC(), 0, 0, R, 1, 1, 1).rotation.set(Math.PI / 2, 0, Math.PI / 2);
  add(lid, inner, VC(), 0, 0, R, 0.97, 0.995, 0.97).rotation.set(Math.PI / 2, 0, Math.PI / 2);
  strut(lid, [-0.1, 0.02, R * 2 + 0.02], [0.1, 0.02, R * 2 + 0.02], 0.008, 0.008, '#8a5a2a', 6);
  for (const sx of [-0.1, 0.1]) strut(lid, [sx, 0, R * 2 - 0.005], [sx, 0.02, R * 2 + 0.02], 0.004, 0.004, '#3a3a3a', 4);
  // legs (rebar)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) strut(D, [sx * (Lg / 2 - 0.04), 0, sz * 0.12], [sx * (Lg / 2 - 0.07), top - R * 0.75, sz * 0.08], 0.008, 0.008, '#3a3a3a', 5);
  // glowing coals + pimento wood
  for (let i = 0; i < 14; i++) {
    const x = rr(-0.18, 0.18), z = rr(-0.07, 0.07);
    ell(D, i % 3 ? '#2a2420' : '#e8501a', x, top - 0.1 + rnd() * 0.02, z, 0.026, 0.018, 0.022, rnd() * 3, 0, 0, 6);
  }
  add(D, SPH(6), mat('#ff6a1a', { emissive: '#ff4a10', flat: true }), 0, top - 0.11, 0, 0.17, 0.025, 0.07);
  for (let i = 0; i < 5; i++) strut(D, [-0.16 + i * 0.08, top - 0.06, -0.1], [-0.15 + i * 0.075, top - 0.05, 0.1], 0.008, 0.008, i % 2 ? '#a07a5a' : '#8a6a4a', 5);
  // grate
  for (let i = 0; i < 7; i++) strut(D, [-Lg / 2 + 0.02, top + 0.003, -0.13 + i * 0.043], [Lg / 2 - 0.02, top + 0.003, -0.13 + i * 0.043], 0.003, 0.003, '#6a6a6a', 4);
  // charred, glossy jerk chicken quarters
  for (let i = 0; i < 6; i++) {
    const x = -0.14 + (i % 3) * 0.14, z = i < 3 ? -0.055 : 0.065;
    glossy(lump(D, '#7a2a12', x, top + 0.02, z, 0.06, 0.024, 0.045, { amp: 0.22, f: 2.4, seg: 10, s: i * 3, ry: rr(-0.4, 0.4), flatBottom: true,
      paint: (qx, qy, qz) => { const f = fbm(qx * 4, qy * 4, qz * 4); return f > 0.6 ? '#1a0a06' : f > 0.52 ? '#3a1408' : qy > 0.3 && f < 0.35 ? '#a8461a' : null; } }));
  }
  // smoke
  const sm = mat('#d8d8d8', { transparent: 0.35, flat: false });
  for (let i = 0; i < 3; i++) add(D, SPH(8), sm, -0.06 + i * 0.05, top + 0.1 + i * 0.07, -0.04 + Math.sin(i) * 0.03, 0.035 + i * 0.012, 0.03 + i * 0.01, 0.032 + i * 0.012).castShadow = false;
  // side plate: festival dumplings, scotch bonnets, hard-dough bread
  const sx = 0.26, sz = 0.3;
  const sp = plate(gp, 0.14, '#f4f2ea', sx, H, sz, rimBand(0.14, '#1a8a3a', 0.9), 0.01, 24);
  for (let i = 0; i < 3; i++) lump(gp, '#d89a3a', sx - 0.05 + i * 0.04, sp + 0.016, sz - 0.02 + i * 0.03, 0.05, 0.018, 0.02, { amp: 0.06, ry: 0.5 + i * 0.2, paint: (x, y, z) => (fbm(x * 4, y * 4, z * 4) > 0.58 ? '#a86a22' : null) });
  glossy(lump(gp, '#7a2a12', sx + 0.04, sp + 0.02, sz + 0.05, 0.05, 0.02, 0.035, { amp: 0.2, s: 9 }));
  for (const [x, z, c] of [[-0.3, 0.3, '#f4c020'], [-0.24, 0.34, '#e8301a'], [-0.34, 0.22, '#f08020']] as [number, number, string][]) {
    glossy(lump(gp, c, x, H + 0.022, z, 0.026, 0.02, 0.026, { amp: 0.22, f: 3, seg: 9 }));
    strut(gp, [x, H + 0.04, z], [x + 0.01, H + 0.05, z], 0.004, 0.003, '#3a7a2a', 4);
  }
  // a cold drink in a glass bottle
  plathe(gp, [[0, 0], [0.034, 0], [0.036, 0.1], [0.016, 0.14], [0.012, 0.18], [0, 0.18]], '#3a7a3a', (_x, y) => (y > 0.03 && y < 0.07 ? '#f4c020' : null), 0.35, H, -0.3, 14);
};

export const H_TASTES2: Record<string, Builder> = {
  fd_ceviche, fd_arepa, fd_bunnychow, fd_khachapuri, fd_plov, fd_hummus, fd_lamington, fd_rendang, fd_pierogi, fd_jerk,
};
