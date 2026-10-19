import * as THREE from 'three';
import {
  type Builder, type Paint, type V3, type SweepOpts, add, mat, shade, mix, fbm, hash3, paintFaces, cyl, rbox, rod, strut, skin,
  sweep, box, g as geoCache,
} from '../prims.ts';

// Hero builders for the "foods of the world" collection (keys fd_*). Each is a little food diorama:
// the dish on its typical plate / bowl / board / steamer / pan, standing on a round table tile (radius 0.5).
// Base at y=0, front faces +z, the dish dominates the frame so it reads both on the globe and in the preview.

const TAU = Math.PI * 2;

// ---- deterministic randomness ------------------------------------------------------------------------
let seed = 1;
const srand = (s: number) => { seed = s; };
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const rr = (a: number, b: number) => a + (b - a) * rnd();
const jit = (c: string, a = 0.08) => shade(c, 1 - a + rnd() * 2 * a);

// ---- materials -----------------------------------------------------------------------------------------
const VC = () => mat('#ffffff', { vc: true, flat: false });
/** Glossy (sauce / glaze / glass) — baked into the shiny bucket. */
const glossy = <T extends THREE.Mesh>(m: T): T => {
  const old = m.material as THREE.MeshStandardMaterial;
  m.material = old.vertexColors ? mat('#ffffff', { vc: true, flat: false, metal: 0.35, rough: 0.3 })
    : mat('#' + old.color.getHexString(), { flat: false, metal: 0.35, rough: 0.3 });
  return m;
};
const smooth = <T extends THREE.Mesh>(m: T): T => {
  const old = m.material as THREE.MeshStandardMaterial;
  if (!old.vertexColors) m.material = mat('#' + old.color.getHexString(), { flat: false });
  return m;
};

// ---- geometry helpers ----------------------------------------------------------------------------------

/** Low-poly smooth ellipsoid (food bits are small; the shared prims one is too dense for dozens of pieces). */
function ellip(p: THREE.Object3D, c: string, x: number, y: number, z: number, rx: number, ry = rx, rz = rx, roty = 0, rotx = 0, rotz = 0): THREE.Mesh {
  return add(p, geoCache('fd:sph', () => new THREE.SphereGeometry(1, 10, 7)), mat(c, { flat: false }), x, y, z, rx, ry, rz, roty, rotx, rotz);
}
/** Cheap flat box (julienne, chips, diced bits) — base at y, one shared geometry. */
function stick(p: THREE.Object3D, c: string, x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0, rz = 0): THREE.Mesh {
  return add(p, geoCache('fd:box', () => new THREE.BoxGeometry(1, 1, 1)), mat(c), x, y + sy / 2, z, sx, sy, sz, ry, 0, rz);
}
/** Capped smooth tube through points (noodles, strings, handles) without the extra end spheres. */
function tube(p: THREE.Object3D, pts: V3[], r0: number, r1: number, c: string, o: SweepOpts = {}): THREE.Mesh {
  return sweep(p, pts.map((pt, i) => ({ p: pt, w: r0 + (r1 - r0) * (i / Math.max(1, pts.length - 1)) })), c, { radial: 6, sub: 4, caps: true, ...o });
}

/** Lathe with per-face paint (bowls with glaze bands, sliced fruit, broth surfaces). Profile [r, y], outer wall upward. */
function plathe(p: THREE.Object3D, prof: [number, number][], c: string, paint?: Paint, x = 0, y = 0, z = 0, seg = 28): THREE.Mesh {
  const geo = new THREE.LatheGeometry(prof.map(([r, h]) => new THREE.Vector2(r, h)), seg);
  geo.computeVertexNormals();
  return add(p, paintFaces(geo, c, paint), VC(), x, y, z, 1, 1, 1);
}
/** Flat painted disc facing up (rings for radial detail). */
function pdisc(p: THREE.Object3D, R: number, c: string, paint?: Paint, x = 0, y = 0, z = 0, rings = 5, seg = 28): THREE.Mesh {
  const prof: [number, number][] = [];
  for (let i = rings; i >= 0; i--) prof.push([R * i / rings, 0]);
  return plathe(p, prof, c, paint, x, y, z, seg);
}
/** Unit sphere displaced by noise, painted, then placed — organic food lumps (patty, batter, rice, meat). */
function lump(p: THREE.Object3D, c: string, x: number, y: number, z: number, sx: number, sy: number, sz: number,
  o: { amp?: number; f?: number; paint?: Paint; seg?: number; ry?: number; rx?: number; rz?: number; s?: number; flatBottom?: boolean } = {}): THREE.Mesh {
  const seg = o.seg ?? 14;
  const geo = new THREE.SphereGeometry(1, seg, Math.max(6, Math.round(seg * 0.7)));
  const pos = geo.getAttribute('position');
  const amp = o.amp ?? 0.12, f = o.f ?? 2.2, s0 = o.s ?? 0;
  for (let i = 0; i < pos.count; i++) {
    let vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
    const d = 1 + (fbm(vx * f + s0, vy * f + 3.1, vz * f - s0) - 0.5) * 2 * amp;
    vx *= d; vy *= d; vz *= d;
    if (o.flatBottom && vy < -0.25) vy = -0.25 - (vy + 0.25) * 0.15;
    pos.setXYZ(i, vx, vy, vz);
  }
  geo.computeVertexNormals();
  return add(p, paintFaces(geo, c, o.paint), VC(), x, y, z, sx, sy, sz, o.ry ?? 0, o.rx ?? 0, o.rz ?? 0);
}

/** Small flat-faced vertex-coloured mesh builder for custom faceted parts. */
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
  /** Quad wound so its normal points away from `ctr`. */
  quadOut(a: V3, b: V3, c: V3, d: V3, ctr: V3, color: string): void {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const m = [(a[0] + c[0]) / 2 - ctr[0], (a[1] + c[1]) / 2 - ctr[1], (a[2] + c[2]) / 2 - ctr[2]];
    if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] >= 0) this.quad(a, b, c, d, color); else this.quad(a, d, c, b, color);
  }
  mesh(p: THREE.Object3D, gloss = false, smoothN = false): THREE.Mesh | null {
    if (!this.pos.length) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    geo.computeVertexNormals();
    const m = add(p, geo, mat('#ffffff', { vc: true, flat: !smoothN }), 0, 0, 0, 1, 1, 1);
    return gloss ? glossy(m) : m;
  }
}

/** Cartesian grid clipped to a circle (planks, gingham, injera, sauces) — paint per cell (x, z). */
function gridDisc(p: THREE.Object3D, R: number, y: number, n: number, paint: (x: number, z: number) => string,
  o: { cx?: number; cz?: number; h?: (x: number, z: number) => number; gloss?: boolean; sz?: number } = {}): THREE.Mesh | null {
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
  return vb.mesh(p, o.gloss);
}

/** Round table tile (radius R) — 'wood' planks, 'dark' slate, or gingham cloth colours. */
function table(p: THREE.Object3D, style: 'wood' | 'dark' | 'teak' | 'cloth' | 'marble', cloth: [string, string] = ['#c83a3a', '#f4efe6'], R = 0.5): number {
  const H = 0.045;
  const edge = style === 'cloth' ? cloth[0] : style === 'dark' ? '#3a3633' : style === 'teak' ? '#7a4a2a' : style === 'marble' ? '#d9d6d0' : '#a8784a';
  plathe(p, [[0, 0.004], [R - 0.012, 0.004], [R, 0.014], [R, H - 0.01], [R - 0.006, H]], shade(edge, 0.85),
    style === 'cloth' ? (x, y, z) => (Math.floor((Math.atan2(z, x) / TAU) * 64) % 2 ? cloth[1] : null) : undefined, 0, 0, 0, 40);
  const W = 0.1;
  gridDisc(p, R - 0.006, H, style === 'cloth' ? 16 : 20, (x, z) => {
    if (style === 'cloth') {
      const a = Math.floor((x + R) / (2 * R / 8)) % 2, b = Math.floor((z + R) / (2 * R / 8)) % 2;
      const base = a && b ? cloth[0] : a || b ? mix(cloth[0], cloth[1], 0.55) : cloth[1];
      return shade(base, 0.97 + fbm(x * 9, 0, z * 9) * 0.06);
    }
    if (style === 'dark') return shade('#46413c', 0.88 + fbm(x * 6, 1, z * 6) * 0.25);
    if (style === 'marble') {
      const v = Math.abs(Math.sin((x * 3 + z * 2 + fbm(x * 4, 2, z * 4) * 3) * 4));
      return v < 0.08 ? '#a9a6a2' : v < 0.16 ? '#cfccc6' : shade('#efede8', 0.97 + hash3(x * 50, 1, z * 50) * 0.04);
    }
    const k = Math.floor((x + R) / W);
    const base = style === 'teak' ? '#8a5532' : '#b8875a';
    const g = 0.86 + hash3(k, 3, 7) * 0.16 + (fbm(x * 30, k, z * 4) - 0.5) * 0.18;
    const seam = ((x + R) % W) < 0.01;
    return shade(base, seam ? 0.7 : g);
  });
  return H;
}

/** Shallow plate (rim, well); returns well height. sz squashes it into an oval. */
function plate(p: THREE.Object3D, R: number, c: string, x = 0, y = 0, z = 0, rim?: string, sz = 1, deep = 0.014): number {
  const prof: [number, number][] = [[0, 0.006], [R * 0.52, 0.006], [R * 0.55, 0], [R * 0.6, 0.004], [R * 0.9, 0.024 + deep * 0.3],
    [R, 0.032 + deep * 0.3], [R * 0.985, 0.038 + deep * 0.3], [R * 0.92, 0.033 + deep * 0.3], [R * 0.64, deep], [R * 0.3, deep], [0, deep]];
  const m = plathe(p, prof, c, rim ? (px, py, pz) => (Math.hypot(px, pz) > R * 0.9 && py > 0.03 ? rim : Math.hypot(px, pz) > R * 0.86 && Math.hypot(px, pz) < R * 0.88 ? rim : null) : undefined, x, y, z, 36);
  m.scale.z = sz;
  return y + deep;
}

/** Bowl of radius R and height H; returns inner radius at a given height. */
function bowl(p: THREE.Object3D, R: number, H: number, c: string, x = 0, y = 0, z = 0, paint?: Paint, seg = 32, foot = 0.5, gl = false): (h: number) => number {
  const t = Math.max(0.012, R * 0.05);
  const outer = (u: number) => R * (foot + (1 - foot) * Math.sin(u * Math.PI / 2));
  const prof: [number, number][] = [[0, 0.012], [R * foot * 0.85, 0.012], [R * foot * 0.88, 0], [R * foot, 0], [R * foot * 1.02, 0.014]];
  for (let i = 1; i <= 8; i++) { const u = i / 8; prof.push([outer(u), 0.014 + (H - 0.014) * u]); }
  prof.push([R - t * 0.5, H + t * 0.35]);
  for (let i = 8; i >= 1; i--) { const u = i / 8; prof.push([Math.max(0.001, outer(u) - t), 0.014 + t + (H - 0.014 - t) * u]); }
  prof.push([0, 0.014 + t]);
  const m = plathe(p, prof, c, paint, x, y, z, seg);
  if (gl) glossy(m);
  return (h: number) => { const u = Math.min(1, Math.max(0, (h - 0.014 - t) / (H - 0.014 - t))); return outer(u) - t; };
}

/** Thin flat leaf (basil, coriander, mint, lettuce flecks). */
function leaf(p: THREE.Object3D, c: string, x: number, y: number, z: number, len: number, ry: number, tilt = 0.15, w = 0.5): THREE.Mesh {
  return glossy(ellip(p, c, x, y, z, len, len * 0.12, len * w, ry, 0, tilt));
}
/** Tiny herb sprig scatter (coriander / scallion / dill bits). */
function herbs(p: THREE.Object3D, n: number, cx: number, cz: number, R: number, y: (x: number, z: number) => number, cols: string[], size = 0.018): void {
  for (let i = 0; i < n; i++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * R, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    const c = cols[i % cols.length];
    ellip(p, jit(c), x, y(x, z) + 0.003, z, size * rr(0.6, 1.1), size * 0.22, size * rr(0.4, 0.7), rnd() * TAU, rr(-0.3, 0.3), rr(-0.3, 0.3));
  }
}
/** Pair of chopsticks lying along direction ry. */
function chopsticks(p: THREE.Object3D, x: number, y: number, z: number, ry: number, len = 0.42, c = '#3b2a20', tip = '#d9c39a', dz = 0.025): void {
  for (const s of [-1, 1]) {
    const c0 = Math.cos(ry), s0 = Math.sin(ry);
    const ox = -s0 * dz * s * 0.5, oz = -c0 * dz * s * 0.5;
    const a: V3 = [x + ox - c0 * len / 2, y + 0.007, z + oz + s0 * len / 2], b: V3 = [x + ox * 0.6 + c0 * len / 2, y + 0.006, z + oz * 0.6 - s0 * len / 2];
    const m: V3 = [a[0] + (b[0] - a[0]) * 0.7, y + 0.0065, a[2] + (b[2] - a[2]) * 0.7];
    strut(p, a, m, 0.0075, 0.0065, c, 6);
    strut(p, m, b, 0.0065, 0.0045, tip, 6);
  }
}
/** Soft steam wisps (transparent, not baked). */
function steam(p: THREE.Object3D, x: number, y: number, z: number, n = 3, s = 1): void {
  const m = mat('#ffffff', { transparent: 0.28, flat: false });
  for (let i = 0; i < n; i++) {
    const h = y + 0.06 * s + i * 0.07 * s;
    const mesh = add(p, new THREE.SphereGeometry(1, 10, 7), m, x + Math.sin(i * 1.7) * 0.03 * s, h, z + Math.cos(i * 2.3) * 0.02 * s,
      0.035 * s * (1 + i * 0.25), 0.05 * s, 0.03 * s * (1 + i * 0.2));
    mesh.castShadow = false;
  }
}
/** Citrus wedge (lime / lemon): half-moon flesh face toward +z, peel behind. */
function wedge(p: THREE.Object3D, x: number, y: number, z: number, ry: number, r = 0.05, peel = '#5aa02c', flesh = '#cfe58a'): void {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g);
  const vb = new VB();
  const N = 10;
  const P = (a: number, k: number): V3 => [Math.cos(a) * r * 1.15 * k, Math.sin(a) * r * 0.85 * k, 0];
  const B = (a: number): V3 => [Math.cos(a) * r * 1.0, Math.sin(a) * r * 0.75, -r * 0.6];
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N;
    vb.tri([0, 0, 0.001], P(a0, 0.88), P(a1, 0.88), i % 2 ? flesh : shade(flesh, 0.9));
    vb.quad(P(a0, 0.88), P(a0, 1), P(a1, 1), P(a1, 0.88), '#f4f1d0');
    vb.quad(P(a0, 1), B(a0), B(a1), P(a1, 1), peel);
    vb.tri([0, 0, -r * 0.6], B(a1), B(a0), shade(peel, 0.8));
  }
  vb.quad([-r * 1.15, 0, 0], [-r * 1.0, 0, -r * 0.6], [r * 1.0, 0, -r * 0.6], [r * 1.15, 0, 0], shade(flesh, 0.85));
  const m = vb.mesh(g);
  if (m) glossy(m);
}
/** Bamboo steamer ring with woven bands; returns the floor height. */
function steamer(p: THREE.Object3D, R: number, H: number, x: number, y: number, z: number): number {
  const c = '#d6b47a';
  plathe(p, [[R - 0.012, 0], [R, 0.004], [R, H], [R - 0.004, H + 0.004], [R - 0.016, H], [R - 0.016, 0.02], [0, 0.02]], c,
    (px, py, pz) => {
      if (py < 0.012 || py > H - 0.012) return shade(c, 0.86);
      return Math.floor((Math.atan2(pz, px) + 4) * 30) % 2 ? shade(c, 1.04) : shade(c, 0.95);
    }, x, y, z, 40);
  plathe(p, [[R + 0.002, 0.01], [R + 0.006, 0.016], [R + 0.006, 0.03], [R + 0.002, 0.036]], shade(c, 0.82), undefined, x, y, z, 32);
  plathe(p, [[R + 0.002, H - 0.03], [R + 0.006, H - 0.024], [R + 0.006, H - 0.01], [R + 0.002, H - 0.004]], shade(c, 0.82), undefined, x, y, z, 32);
  return y + 0.02;
}
/** Small round dipping dish with a liquid; returns the liquid height. */
function dish(p: THREE.Object3D, R: number, x: number, y: number, z: number, c: string, liquid: string, h = 0.03): number {
  const ir = bowl(p, R, h, c, x, y, z, undefined, 24, 0.55);
  glossy(pdisc(p, ir(h * 0.75), liquid, (px, _py, pz) => (fbm(px * 40, 0, pz * 40) > 0.6 ? shade(liquid, 1.25) : null), x, y + h * 0.75, z, 2, 20));
  return y + h * 0.75;
}

// ---- 1. Pizza Margherita (Naples) ----------------------------------------------------------------------

function pizzaWedge(g: THREE.Object3D, R: number, a0: number, a1: number, s: number): void {
  const K = 9, prof: [number, number][] = [
    [0.004, 0], [R * 0.5, 0], [R * 0.92, 0], [R * 0.99, 0.008], [R * 1.01, 0.024], [R * 0.985, 0.04], [R * 0.93, 0.048], [R * 0.87, 0.036],
    [R * 0.82, 0.024], [R * 0.68, 0.021], [R * 0.52, 0.02], [R * 0.36, 0.02], [R * 0.2, 0.02], [0.004, 0.02]];
  const rings: V3[][] = [];
  for (let i = 0; i <= K; i++) {
    const a = a0 + (a1 - a0) * (i / K);
    const n = fbm(Math.cos(a) * 3 + s, 1.3, Math.sin(a) * 3);
    rings.push(prof.map(([r0, y0], j) => {
      const puff = j >= 3 && j <= 8 ? 1 + (n - 0.5) * 0.5 : 1;
      const r = j >= 3 && j <= 8 ? R * 0.8 + (r0 - R * 0.8) * puff : r0;
      return [Math.cos(a) * r, j >= 4 && j <= 7 ? y0 * (0.85 + n * 0.4) : y0, -Math.sin(a) * r] as V3;
    }));
  }
  skin(g, rings, '#e2b06a', {
    caps: true,
    paint: (x, y, z) => {
      const r = Math.hypot(x, z);
      if (y > 0.017 && r < R * 0.84) {
        const f = fbm(x * 22, 1, z * 22);
        return f > 0.62 ? '#d9482a' : f > 0.5 ? '#c4321c' : f < 0.36 ? '#a8261a' : '#b92c1a';
      }
      if (y < 0.004) return hash3(Math.floor(x * 90), 2, Math.floor(z * 90)) > 0.8 ? '#6a4126' : '#d6a060';
      const c = fbm(x * 38 + 5, y * 40, z * 38);
      return c > 0.66 ? '#3a2416' : c > 0.6 ? '#7a4a26' : c > 0.52 ? '#c88a4a' : y > 0.03 ? '#ecc47e' : '#e3b46c';
    },
  });
}
function cheeseBlob(g: THREE.Object3D, x: number, z: number, y: number, s: number): void {
  glossy(lump(g, '#fbf6ea', x, y, z, s, s * 0.22, s * rr(0.75, 1), {
    amp: 0.25, f: 1.8, s: rnd() * 9, ry: rnd() * TAU, flatBottom: true,
    paint: (px, py) => (py > 0.15 ? (hash3(px * 9, py, 1) > 0.85 ? '#f2d9a6' : '#fffaf0') : '#f4ecd8'),
  }));
}
function basil(g: THREE.Object3D, x: number, y: number, z: number, s: number, ry: number): void {
  glossy(lump(g, '#2f7d2c', x, y, z, s, s * 0.12, s * 0.55, {
    amp: 0.08, ry, rz: 0.12,
    paint: (px, py, pz) => (Math.abs(pz) < 0.08 && py > 0 ? '#5aa548' : px > 0.4 ? '#3c8c35' : null),
  }));
}
const fd_pizza: Builder = (gp) => {
  srand(11);
  const H = table(gp, 'cloth', ['#c8373a', '#f6f1e6']);
  // olive-wood serving board
  plathe(gp, [[0, 0], [0.44, 0], [0.452, 0.012], [0.448, 0.026], [0.436, 0.03], [0, 0.03]], '#b9824c',
    (x, _y, z) => shade('#b9824c', 0.85 + fbm(x * 5, 2, z * 30) * 0.3), 0, H, 0, 40);
  const R = 0.37, top = H + 0.03, N = 8;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * TAU + 0.012, a1 = ((i + 1) / N) * TAU - 0.012, am = (a0 + a1) / 2;
    const g = new THREE.Group();
    gp.add(g);
    const lifted = i === 6;
    if (lifted) {
      // one slice pulled out toward the viewer and tipped up
      g.position.set(Math.cos(am) * 0.07, top + 0.035, -Math.sin(am) * 0.07);
      g.rotateOnAxis(new THREE.Vector3(Math.sin(am), 0, Math.cos(am)), -0.2);
    } else g.position.y = top;
    pizzaWedge(g, R, a0, a1, i * 1.7);
    for (let k = 0; k < 2; k++) {
      const a = a0 + (a1 - a0) * (0.3 + 0.4 * rnd()), d = R * (k === 0 ? rr(0.25, 0.45) : rr(0.55, 0.72));
      cheeseBlob(g, Math.cos(a) * d, -Math.sin(a) * d, 0.022, rr(0.045, 0.06));
    }
    if (i % 2 === 0) {
      const a = am + rr(-0.1, 0.1), d = R * rr(0.45, 0.6);
      basil(g, Math.cos(a) * d, 0.034, -Math.sin(a) * d, 0.06, rnd() * TAU);
    }
    if (lifted) {
      // stretchy cheese strings back to the pie
      for (const k of [-0.25, 0.1, 0.35]) {
        const a = am + k * (a1 - a0);
        const ex = Math.cos(a) * R * 0.18, ez = -Math.sin(a) * R * 0.18;
        tube(gp, [[ex, top + 0.025, ez], [ex + Math.cos(am) * 0.03, top + 0.03, ez - Math.sin(am) * 0.03],
          [ex + Math.cos(am) * 0.07, top + 0.05, ez - Math.sin(am) * 0.07]], 0.006, 0.005, '#fbf3df', { radial: 6, sub: 3 });
      }
    }
  }
  basil(gp, 0.025, top + 0.034, -0.02, 0.065, 0.6);
  basil(gp, -0.035, top + 0.038, 0.02, 0.06, 2.2);
  basil(gp, 0.0, top + 0.042, 0.04, 0.05, 4.0);
};

// ---- 2. Sushi (Tokyo) ----------------------------------------------------------------------------------

function topping(g: THREE.Object3D, x: number, y: number, z: number, L: number, W: number, c: string, kind: 'salmon' | 'tuna' | 'ebi'): void {
  const rings: V3[][] = [];
  const K = 10;
  for (let i = 0; i <= K; i++) {
    const u = i / K * 2 - 1, px = x + u * L;
    const drop = -0.028 * u * u;
    const w = W * (kind === 'ebi' ? (u > 0.7 ? 0.7 : 1 - 0.15 * Math.abs(u)) : 1 - 0.1 * u * u);
    const th = 0.012;
    rings.push([
      [px, y + drop, z - w], [px, y + drop + th * 0.8, z - w * 0.9], [px, y + drop + th, z], [px, y + drop + th * 0.8, z + w * 0.9],
      [px, y + drop, z + w], [px, y + drop - 0.004, z],
    ]);
  }
  const paint: Paint = kind === 'salmon'
    ? (px, py, pz) => (Math.sin((px * 1.0 + pz * 0.8) * 140) > 0.55 && py > y - 0.03 ? '#fde0c8' : null)
    : kind === 'ebi'
      ? (px) => (Math.sin(px * 160) > 0.3 ? '#f7f1e6' : null)
      : (px, _py, pz) => (fbm(px * 40, 1, pz * 40) > 0.6 ? shade(c, 1.12) : null);
  glossy(skin(g, rings, c, { caps: true, paint }));
}
function nigiri(g: THREE.Object3D, x: number, y: number, z: number, kind: 'salmon' | 'tuna' | 'tamago' | 'ebi'): void {
  lump(g, '#f6f3ea', x, y + 0.03, z, 0.075, 0.034, 0.042, {
    amp: 0.06, f: 2, s: x * 10, flatBottom: true,
    paint: (px, py, pz) => (hash3(Math.floor(px * 7), Math.floor(py * 7), Math.floor(pz * 7)) > 0.6 ? '#ffffff' : '#ece8dc'),
  });
  const ty = y + 0.058;
  if (kind === 'tamago') {
    rbox(g, '#f3c94a', x, ty - 0.008, z, 0.15, 0.03, 0.08, 0.008);
    rbox(g, '#e2a93a', x, ty + 0.021, z, 0.148, 0.002, 0.078, 0.001);
    const belt: V3[][] = [];
    for (let i = 0; i <= 1; i++) {
      const bx = x - 0.016 + i * 0.032;
      belt.push([[bx, y + 0.005, z - 0.046], [bx, ty + 0.024, z - 0.044], [bx, ty + 0.026, z], [bx, ty + 0.024, z + 0.044], [bx, y + 0.005, z + 0.046], [bx, y + 0.002, z]]);
    }
    skin(g, belt, '#1f2a22', { caps: true });
    return;
  }
  if (kind === 'ebi') {
    topping(g, x, ty, z, 0.085, 0.04, '#f08a5a', 'ebi');
    for (const s of [-1, 1]) ellip(g, '#d8402a', x + 0.09, ty - 0.02, z + s * 0.016, 0.022, 0.006, 0.014, s * 0.5, 0, -0.5);
    return;
  }
  topping(g, x, ty, z, 0.082, 0.046, kind === 'salmon' ? '#f37f45' : '#bd2335', kind);
}
function maki(g: THREE.Object3D, x: number, y: number, z: number, fill: string, r = 0.044, h = 0.055): void {
  smooth(cyl(g, '#1c2620', x, y, z, r, h, 18));
  pdisc(g, r * 0.95, '#f6f3ea', (px, _py, pz) => {
    const d = Math.hypot(px, pz) / r;
    return d < 0.32 ? fill : d < 0.4 ? shade(fill, 0.8) : hash3(Math.floor(px * 400), 1, Math.floor(pz * 400)) > 0.7 ? '#e6e2d6' : null;
  }, x, y + h + 0.001, z, 6, 18);
}
const fd_sushi: Builder = (gp) => {
  srand(22);
  const H = table(gp, 'dark');
  const g = new THREE.Group(); g.rotation.y = -0.32; gp.add(g);
  // hinoki geta board on two feet
  const wood = '#dcbc8c';
  for (const fx of [-0.27, 0.27]) rbox(g, shade(wood, 0.85), fx, H, 0, 0.05, 0.035, 0.34, 0.006);
  rbox(g, wood, 0, H + 0.035, 0, 0.8, 0.035, 0.38, 0.01);
  for (let i = 0; i < 9; i++) box(g, shade(wood, 0.93), -0.38 + i * 0.095, H + 0.0705, 0, 0.002, 0.0005, 0.37);
  const y = H + 0.07;
  nigiri(g, -0.26, y, 0.08, 'salmon');
  nigiri(g, -0.08, y, 0.08, 'tuna');
  nigiri(g, 0.1, y, 0.08, 'ebi');
  nigiri(g, 0.27, y, 0.08, 'tamago');
  const fills = ['#f37f45', '#5fae4a', '#bd2335', '#f37f45'];
  for (let i = 0; i < 4; i++) maki(g, -0.3 + i * 0.095, y, -0.09, fills[i]);
  lump(g, '#93b83c', 0.12, y + 0.016, -0.09, 0.04, 0.026, 0.03, { amp: 0.25, f: 3, s: 4 });
  for (let i = 0; i < 5; i++) {
    glossy(ellip(g, i % 2 ? '#f5b9b0' : '#f8cbc2', 0.25 + rr(-0.02, 0.02), y + 0.008 + i * 0.006, -0.09 + rr(-0.02, 0.02),
      0.045, 0.006, 0.03, rnd() * TAU, rr(-0.3, 0.3), rr(-0.3, 0.3)));
  }
  dish(gp, 0.075, 0.3, H, 0.3, '#f2efe8', '#3a1d10', 0.026);
  rbox(gp, '#8fa3a8', -0.08, H, 0.33, 0.05, 0.016, 0.024, 0.006);
  chopsticks(gp, -0.08, H + 0.012, 0.33, 0.18, 0.46, '#2a1a14', '#b53a2a');
};

// ---- 3. Peking duck (Beijing) --------------------------------------------------------------------------

const duckSkin: Paint = (x, y, z) => {
  const f = fbm(x * 18, y * 18, z * 18);
  return f > 0.62 ? '#b4602c' : f > 0.52 ? '#9c4a1f' : f < 0.36 ? '#6a2c12' : '#86391a';
};
const fd_pekingduck: Builder = (gp) => {
  srand(33);
  const H = table(gp, 'teak');
  const py = plate(gp, 0.4, '#f6f4ee', 0, H, -0.05, '#2c5aa0', 0.68, 0.02);
  const d = new THREE.Group(); d.position.set(-0.03, py, -0.12); d.rotation.y = 0.12; gp.add(d);
  glossy(sweep(d, [
    { p: [-0.2, 0.05, 0], w: 0.03, h: 0.025 }, { p: [-0.15, 0.075, 0], w: 0.085, h: 0.062 }, { p: [-0.04, 0.09, 0], w: 0.118, h: 0.084 },
    { p: [0.08, 0.085, 0], w: 0.112, h: 0.08 }, { p: [0.16, 0.07, 0], w: 0.08, h: 0.06 }, { p: [0.2, 0.055, 0], w: 0.03, h: 0.03 },
  ], '#86391a', { radial: 18, sub: 5, paint: duckSkin }));
  for (const s of [-1, 1]) {
    glossy(lump(d, '#7c3517', -0.1, 0.055, s * 0.09, 0.065, 0.038, 0.038, { amp: 0.08, ry: s * 0.4, paint: duckSkin }));
    tube(d, [[-0.15, 0.05, s * 0.105], [-0.19, 0.045, s * 0.125]], 0.009, 0.007, '#4a2410');
  }
  for (const s of [-1, 1]) glossy(lump(d, '#7a3416', 0.04, 0.07, s * 0.105, 0.085, 0.033, 0.028, { amp: 0.06, s: 3, ry: s * -0.1, paint: duckSkin }));
  // neck curling round behind, head resting on the platter
  glossy(sweep(d, [{ p: [0.19, 0.055, 0], w: 0.03 }, { p: [0.25, 0.035, -0.03], w: 0.022 }, { p: [0.27, 0.025, -0.09], w: 0.02 }, { p: [0.22, 0.025, -0.13], w: 0.02 }],
    '#7a3416', { radial: 10, sub: 4, paint: duckSkin }));
  glossy(lump(d, '#6a2c12', 0.18, 0.03, -0.14, 0.035, 0.026, 0.03, { amp: 0.05, paint: duckSkin }));
  ellip(d, '#3a2010', 0.145, 0.026, -0.155, 0.03, 0.008, 0.013, 0.4);
  for (let i = 0; i < 4; i++) ellip(d, '#d8905a', -0.08 + i * 0.05, 0.172, rr(-0.03, 0.03), 0.03, 0.005, 0.01, rnd());
  // carved slices shingled along the front of the platter: crisp lacquered skin over white fat and pink meat
  for (let i = 0; i < 8; i++) {
    const x = -0.22 + i * 0.058, z = 0.1 + Math.sin(i * 0.45) * 0.02;
    const sg = new THREE.Group(); sg.position.set(x, py + 0.006 + (i % 2) * 0.004, z); sg.rotation.set(0, 0.5 + rr(-0.1, 0.1), 0.22); gp.add(sg);
    rbox(sg, '#e7b8a4', 0, 0, 0, 0.085, 0.008, 0.05, 0.003);
    rbox(sg, '#f6ecdc', 0, 0.007, 0, 0.084, 0.004, 0.049, 0.002);
    glossy(rbox(sg, i % 2 ? '#a24e20' : '#8a3d18', 0, 0.011, 0, 0.083, 0.005, 0.048, 0.002));
  }
  // garnish: cucumber fan + radish flower on the platter end
  for (let i = 0; i < 5; i++) rbox(gp, i % 2 ? '#4f8f3a' : '#6aa84a', 0.27 + i * 0.012, py, -0.08 + i * 0.03, 0.012, 0.01, 0.07, 0.003, 0.4);
  const p1 = plate(gp, 0.1, '#f6f4ee', -0.27, H, 0.3, '#2c5aa0');
  for (let i = 0; i < 6; i++) pdisc(gp, 0.075 - i * 0.001, i % 2 ? '#f3ead2' : '#efe2c4', (x, _y, z) => (fbm(x * 60, i, z * 60) > 0.66 ? '#d9c08f' : null), -0.27 + rr(-0.004, 0.004), p1 + 0.004 + i * 0.004, 0.3, 3, 20);
  dish(gp, 0.065, 0.0, H, 0.36, '#f6f4ee', '#4a1e10', 0.03);
  const p3 = plate(gp, 0.1, '#f6f4ee', 0.27, H, 0.3, '#2c5aa0');
  for (let i = 0; i < 6; i++) {
    const x = 0.21 + i * 0.022, z = 0.3 + rr(-0.02, 0.02);
    if (i % 2) {
      rod(gp, [x, p3 + 0.012, z - 0.05], [x, p3 + 0.012, z + 0.03], 0.007, '#ecf3dc');
      rod(gp, [x, p3 + 0.012, z + 0.03], [x, p3 + 0.012, z + 0.06], 0.0075, '#76b24a');
    } else { rbox(gp, '#4f8f3a', x, p3 + 0.004, z, 0.016, 0.014, 0.1, 0.004); box(gp, '#d6ecb4', x, p3 + 0.018, z, 0.012, 0.001, 0.096); }
  }
};

// ---- 4. Xiaolongbao (Shanghai) -------------------------------------------------------------------------

function soupDumpling(p: THREE.Object3D, x: number, y: number, z: number, R: number, Hh: number, s: number, folds = 18): void {
  const rings: V3[][] = [];
  const K = 12, n = folds * 2;
  for (let i = 0; i <= K; i++) {
    const t = i / K;
    // round sagging base, waist and a twisted top-knot
    const prof = t < 0.55 ? Math.sin((0.25 + t / 0.55 * 0.75) * Math.PI / 2) : 1 - Math.pow((t - 0.55) / 0.45, 1.4) * 0.9;
    const yy = t < 0.55 ? y + Hh * 0.62 * Math.sin(t / 0.55 * Math.PI / 2) : y + Hh * (0.62 + 0.38 * (t - 0.55) / 0.45);
    const pleat = t > 0.4 ? Math.min(1, (t - 0.4) / 0.25) : 0;
    const ring: V3[] = [];
    for (let j = 0; j < n; j++) {
      const a = j / n * TAU + t * 1.3 * pleat + s;
      const rad = R * Math.max(0.06, prof) * (1 + 0.09 * pleat * Math.cos(j / n * TAU * folds)) * (t === 0 ? 0.85 : 1);
      ring.push([x + Math.cos(a) * rad, yy, z + Math.sin(a) * rad]);
    }
    rings.push(ring);
  }
  skin(p, rings, '#f2e8d4', {
    caps: true,
    paint: (px, py, pz) => {
      const t = (py - y) / Hh;
      const a = Math.atan2(pz - z, px - x);
      const ridge = Math.cos(a * folds - s * folds) > 0.5;
      if (t > 0.5) return ridge ? '#fbf5e8' : '#e8dcc2';
      return t < 0.35 ? (fbm(px * 50, py * 50, pz * 50) > 0.58 ? '#e9d3a6' : '#efe2c6') : '#f4ead6';
    },
  });
  ellip(p, '#f6eedd', x, y + Hh * 1.0, z, R * 0.12, R * 0.1, R * 0.12);
}
const fd_xiaolongbao: Builder = (gp) => {
  srand(44);
  const H = table(gp, 'wood');
  const sx = -0.05, sz = -0.03, R = 0.33;
  const fl = steamer(gp, R, 0.12, sx, H, sz);
  pdisc(gp, R - 0.02, '#e7ecc6', (x, _y, z) => (Math.abs(Math.sin(Math.atan2(z, x) * 7)) < 0.12 ? '#f4f6e2' : fbm(x * 20, 0, z * 20) > 0.6 ? '#d6e0a8' : null), sx, fl + 0.002, sz, 6, 32);
  const pos: [number, number][] = [[0, 0]];
  for (let i = 0; i < 6; i++) pos.push([Math.cos(i / 6 * TAU + 0.3) * 0.19, Math.sin(i / 6 * TAU + 0.3) * 0.19]);
  pos.forEach(([dx, dz], i) => soupDumpling(gp, sx + dx, fl + 0.003, sz + dz, 0.088, 0.105, i * 0.7));
  const lid = new THREE.Group(); lid.position.set(0.2, H + 0.02, -0.33); lid.rotation.set(-1.1, 0.5, 0); gp.add(lid);
  plathe(lid, [[0, 0.03], [0.24, 0.02], [0.25, 0], [0.24, -0.004], [0, 0.022]], '#d2ad70',
    (x, _y, z) => (Math.floor(Math.hypot(x, z) * 60) % 2 ? '#c49a5c' : null), 0, 0, 0, 32);
  const vy = dish(gp, 0.075, 0.3, H, 0.27, '#f1efe8', '#2a140c', 0.028);
  for (let i = 0; i < 9; i++) box(gp, '#e9b24a', 0.3 + rr(-0.03, 0.03), vy, 0.27 + rr(-0.03, 0.03), 0.026, 0.004, 0.004, rnd() * TAU);
  const sp = new THREE.Group(); sp.position.set(0.04, H, 0.36); sp.rotation.y = 0.35; gp.add(sp);
  plathe(sp, [[0, 0], [0.05, 0.006], [0.062, 0.03], [0.058, 0.032], [0.045, 0.012], [0, 0.008]], '#f4f2ec', undefined, 0, 0, 0, 20).scale.set(1, 1, 0.8);
  rod(sp, [0.045, 0.03, 0], [0.13, 0.045, 0], 0.012, '#f4f2ec');
  soupDumpling(sp, 0, 0.01, 0, 0.042, 0.05, 0.3, 14);
  steam(gp, sx, fl + 0.1, sz, 3, 1.1);
};

// ---- 5. Chongqing hotpot -------------------------------------------------------------------------------

/** true = spicy red half of the yin-yang pot. */
function yinYang(x: number, z: number, R: number): boolean {
  const r2 = R / 2;
  if (Math.hypot(x - r2, z) < r2) return true;
  if (Math.hypot(x + r2, z) < r2) return false;
  return z > 0;
}
const fd_hotpot: Builder = (gp) => {
  srand(55);
  const H = table(gp, 'dark');
  rbox(gp, '#24272b', 0, H, 0, 0.5, 0.04, 0.5, 0.02);
  const py = H + 0.04, R = 0.3, PH = 0.13;
  bowl(gp, R, PH, '#c7ccd1', 0, py, 0, (_x, y) => (y > PH - 0.01 ? '#e2e6ea' : y < 0.03 ? '#9aa1a8' : null), 40, 0.82);
  for (const s of [-1, 1]) tube(gp, [[s * 0.29, py + 0.1, -0.04], [s * 0.35, py + 0.11, -0.03], [s * 0.36, py + 0.11, 0.03], [s * 0.29, py + 0.1, 0.04]], 0.008, 0.008, '#b8bec5', { radial: 6 });
  const ly = py + PH - 0.025, LR = R - 0.02;
  gridDisc(gp, LR, ly, 28, (x, z) => {
    const f = fbm(x * 18, 3, z * 18);
    if (yinYang(x, z, LR)) return f > 0.62 ? '#e0581e' : f > 0.5 ? '#c8331a' : f < 0.38 ? '#8f1a10' : '#b02414';
    return f > 0.6 ? '#fbf3e0' : f < 0.4 ? '#e6d8bc' : '#f1e6cf';
  }, { gloss: true });
  // S-shaped divider wall
  const sp: V3[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const x = t < 0.5 ? LR / 2 - Math.cos(t * 2 * Math.PI) * LR / 2 : -LR / 2 + Math.cos((t - 0.5) * 2 * Math.PI) * LR / 2;
    const z = t < 0.5 ? -Math.sin(t * 2 * Math.PI) * LR / 2 : Math.sin((t - 0.5) * 2 * Math.PI) * LR / 2;
    sp.push([x, ly + 0.012, z]);
  }
  for (let i = 0; i < sp.length - 1; i++) rbox(gp, '#d5dade', (sp[i][0] + sp[i + 1][0]) / 2, ly - 0.01, (sp[i][2] + sp[i + 1][2]) / 2,
    Math.hypot(sp[i + 1][0] - sp[i][0], sp[i + 1][2] - sp[i][2]) + 0.004, 0.035, 0.007, 0.003, -Math.atan2(sp[i + 1][2] - sp[i][2], sp[i + 1][0] - sp[i][0]));
  // floating spice: dried chillies + peppercorns on red; goji, mushrooms, scallion on white
  for (let i = 0; i < 40; i++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * (LR - 0.03), x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.abs(Math.hypot(x - LR / 2, z) - LR / 2) < 0.02 || Math.abs(Math.hypot(x + LR / 2, z) - LR / 2) < 0.02) continue;
    if (yinYang(x, z, LR)) {
      if (i % 3 === 0) glossy(ellip(gp, '#7a0e0a', x, ly + 0.004, z, 0.006, 0.006, 0.006));
      else glossy(ellip(gp, i % 2 ? '#c41a12' : '#a5120c', x, ly + 0.006, z, 0.03, 0.009, 0.01, rnd() * TAU));
    } else if (i % 3 === 0) glossy(ellip(gp, '#d8301c', x, ly + 0.004, z, 0.009, 0.006, 0.007, rnd() * TAU));
    else if (i % 3 === 1) ellip(gp, '#7a5434', x, ly + 0.006, z, 0.024, 0.01, 0.024);
    else cyl(gp, '#8cc65a', x, ly, z, 0.008, 0.008, 8);
  }
  for (const [x, z] of [[0.1, 0.12], [0.18, -0.02]]) for (let k = 0; k < 8; k++) ellip(gp, '#5a2a14', x + Math.cos(k * TAU / 8) * 0.012, ly + 0.006, z + Math.sin(k * TAU / 8) * 0.012, 0.012, 0.005, 0.005, -k * TAU / 8);
  // side plates: marbled beef rolls, greens + tofu, dipping bowl, chopsticks
  const bp = plate(gp, 0.09, '#f3f1ea', -0.33, H, 0.27);
  for (let i = 0; i < 5; i++) {
    lump(gp, '#c43e4e', -0.36 + i * 0.016, bp + 0.006 + i * 0.004, 0.27 + rr(-0.01, 0.01), 0.05, 0.006, 0.034, {
      amp: 0.1, s: i * 3, ry: 0.5 + rr(-0.2, 0.2), rz: 0.15,
      paint: (x, y, z) => (fbm(x * 3 + i, y * 3, z * 3) > 0.56 ? '#f4dada' : y > 0 ? null : '#a8303e'),
    });
  }
  const gpz = plate(gp, 0.09, '#f3f1ea', 0.33, H, 0.27);
  for (let i = 0; i < 6; i++) leaf(gp, i % 2 ? '#3f8f3a' : '#59a84a', 0.33 + rr(-0.04, 0.04), gpz + 0.008 + i * 0.004, 0.27 + rr(-0.03, 0.03), 0.05, rnd() * TAU, 0.1, 0.45);
  for (let i = 0; i < 3; i++) rbox(gp, '#f4efe0', 0.3 + i * 0.025, gpz + 0.02, 0.3, 0.02, 0.02, 0.02, 0.003);
  dish(gp, 0.06, 0.0, H, 0.4, '#f1efe8', '#c9a253', 0.028);
  chopsticks(gp, 0.12, H, 0.4, 0.4, 0.34);
  steam(gp, 0.14, ly, 0.0, 3, 1.2);
  steam(gp, -0.14, ly, 0.0, 2, 1.0);
};

// ---- 6. Lanzhou beef noodles ---------------------------------------------------------------------------

const fd_lanzhou: Builder = (gp) => {
  srand(66);
  const H = table(gp, 'wood');
  const R = 0.38, BH = 0.18;
  const ir = bowl(gp, R, BH, '#f6f5f0', 0, H, 0, (_x, y) => (y > BH - 0.03 && y < BH - 0.02 ? '#2c5aa0' : y > BH - 0.045 && y < BH - 0.04 ? '#2c5aa0' : y < 0.04 && y > 0.02 ? '#2c5aa0' : null), 40, 0.45);
  const ly = H + BH - 0.035, LR = ir(BH - 0.035);
  glossy(pdisc(gp, LR, '#a06c3c', (x, _y, z) => {
    const f = fbm(x * 9 + 2, 0, z * 9);
    return f > 0.58 ? '#a3190c' : f > 0.55 ? '#b8301a' : fbm(x * 40, 1, z * 40) > 0.64 ? '#b98a58' : null;
  }, 0, ly, 0, 12, 48));
  for (let i = 0; i < 12; i++) {
    const a = rnd() * TAU, d = rr(0.05, LR - 0.06), x = Math.cos(a) * d, z = Math.sin(a) * d, b = rnd() * TAU;
    tube(gp, [[x - Math.cos(b) * 0.06, ly - 0.004, z - Math.sin(b) * 0.06], [x, ly + 0.003, z], [x + Math.cos(b + 0.6) * 0.06, ly - 0.004, z + Math.sin(b + 0.6) * 0.06]], 0.005, 0.005, '#f1dea4', { radial: 6, sub: 3 });
  }
  for (let i = 0; i < 6; i++) {
    const a = -1.4 + i * 0.32, d = LR * 0.7;
    rbox(gp, i % 2 ? '#f1eee2' : '#e8e6d6', Math.cos(a) * d, ly - 0.002, Math.sin(a) * d, 0.05, 0.006, 0.04, 0.003, rnd() * TAU);
  }
  for (let i = 0; i < 5; i++) {
    const a = 2.2 + i * 0.35, d = LR * rr(0.55, 0.75);
    lump(gp, '#7a4a32', Math.cos(a) * d, ly + 0.003, Math.sin(a) * d, 0.045, 0.007, 0.032, { amp: 0.1, ry: rnd() * TAU, paint: (x) => (Math.sin(x * 30) > 0.6 ? '#9a6648' : null) });
  }
  herbs(gp, 30, -0.06, 0.06, 0.14, () => ly + 0.002, ['#2f8a34', '#4fae44', '#3d9a3a'], 0.022);
  for (let i = 0; i < 10; i++) smooth(cyl(gp, i % 2 ? '#8fd06a' : '#cfeaa8', rr(0.02, 0.16), ly - 0.002, rr(-0.12, 0.04), 0.009, 0.006, 8));
  // noodles lifted high on chopsticks
  const tipY = H + 0.48, tx = -0.02, tz = 0.06;
  for (let i = 0; i < 9; i++) {
    const ox = (i - 4) * 0.009, ph = i * 0.9;
    const pts: V3[] = [];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      pts.push([tx + ox + Math.sin(ph + t * 4) * 0.012 * t + (1 - t) * 0.04 * Math.sin(ph), ly + (tipY - ly) * t, tz + Math.cos(ph + t * 3) * 0.01 + (1 - t) * 0.05 * Math.cos(ph)]);
    }
    tube(gp, pts, 0.0055, 0.0055, i % 2 ? '#f3e2ac' : '#ecd796', { radial: 6, sub: 3 });
  }
  for (const s of [-1, 1]) rod(gp, [tx - 0.03, tipY + 0.012 + s * 0.006, tz + s * 0.012], [tx + 0.32, tipY + 0.17, tz + 0.06 + s * 0.02], 0.007, '#3b2a20', 6);
  steam(gp, -0.15, ly, -0.1, 3, 1);
};

// ---- 7. Dim sum (Guangzhou) ----------------------------------------------------------------------------

function harGow(p: THREE.Object3D, x: number, y: number, z: number, ry: number): void {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g);
  const rings: V3[][] = [];
  const K = 10, n = 14;
  for (let i = 0; i <= K; i++) {
    const t = i / K, u = t * 2 - 1;
    const bend = 0.03 * (1 - u * u);
    const w = 0.045 * Math.sqrt(Math.max(0.03, 1 - u * u)), hh = 0.05 * Math.sqrt(Math.max(0.03, 1 - u * u));
    const ring: V3[] = [];
    for (let j = 0; j < n; j++) {
      const a = j / n * TAU;
      const top = Math.max(0, Math.sin(a));
      const pl = 1 + 0.12 * top * top * Math.cos(t * 26);
      ring.push([u * 0.065, Math.max(0, Math.sin(a) * hh * pl * (1 + top * 0.25)), bend + Math.cos(a) * w * (1 - top * 0.45)]);
    }
    rings.push(ring);
  }
  skin(g, rings, '#f3ece2', {
    caps: true,
    paint: (px, py) => (py > 0.045 ? (Math.cos(px * 400) > 0 ? '#fffaf2' : '#ebe2d4') : fbm(px * 60, py * 60, 1) > 0.55 ? '#f4c8b4' : '#efe2d6'),
  });
}
function siuMai(p: THREE.Object3D, x: number, y: number, z: number): void {
  const rings: V3[][] = [];
  const r = 0.042, h = 0.055, n = 24;
  for (let i = 0; i <= 6; i++) {
    const t = i / 6, ring: V3[] = [];
    for (let j = 0; j < n; j++) {
      const a = j / n * TAU;
      const rad = r * (t < 0.15 ? 0.85 + t : 1 - 0.1 * Math.sin(t * Math.PI)) * (1 + (t > 0.7 ? 0.08 * Math.cos(a * 8) : 0));
      ring.push([x + Math.cos(a) * rad, y + h * t, z + Math.sin(a) * rad]);
    }
    rings.push(ring);
  }
  skin(p, rings, '#f2d063', { caps: false, paint: (_x, py) => ((py - y) / h > 0.82 ? '#f7dd84' : null) });
  lump(p, '#d49a7e', x, y + h - 0.004, z, r * 0.92, 0.018, r * 0.92, { amp: 0.2, f: 3, s: x * 9, paint: (px, py, pz) => (fbm(px * 4, py * 4, pz * 4) > 0.55 ? '#b97a5e' : '#e6b49a') });
  glossy(ellip(p, '#f07418', x, y + h + 0.012, z, 0.01, 0.007, 0.01));
  ellip(p, '#e6c24a', x, y + 0.004, z, r * 0.9, 0.006, r * 0.9);
}
function teapot(p: THREE.Object3D, x: number, y: number, z: number, c: string, ry = 0): void {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g);
  const prof: [number, number][] = [[0, 0], [0.05, 0], [0.065, 0.02], [0.075, 0.05], [0.07, 0.08], [0.05, 0.1], [0.03, 0.105], [0, 0.105]];
  glossy(plathe(g, prof, c, (_px, py) => (py > 0.055 && py < 0.062 ? '#2c5aa0' : null), 0, 0, 0, 24));
  glossy(ellip(g, shade(c, 1.1), 0, 0.112, 0, 0.012, 0.01, 0.012));
  glossy(tube(g, [[0.06, 0.04, 0], [0.09, 0.07, 0], [0.11, 0.1, 0]], 0.012, 0.006, c, { radial: 8 }));
  glossy(tube(g, [[-0.06, 0.08, 0], [-0.1, 0.075, 0], [-0.1, 0.035, 0], [-0.065, 0.03, 0]], 0.007, 0.007, c, { radial: 6 }));
}
const fd_dimsum: Builder = (gp) => {
  srand(77);
  const H = table(gp, 'teak');
  const f1 = steamer(gp, 0.2, 0.08, -0.2, H, -0.05);
  pdisc(gp, 0.18, '#eef0d8', undefined, -0.2, f1 + 0.002, -0.05, 2, 24);
  [[-0.06, 0.06, 0.2], [0.06, 0.06, -0.3], [0, -0.06, 0.1], [-0.08, -0.06, 0.6]].forEach(([dx, dz, a]) => harGow(gp, -0.2 + dx, f1 + 0.004, -0.05 + dz, a));
  steamer(gp, 0.18, 0.07, 0.2, H, -0.12);
  const f2 = steamer(gp, 0.18, 0.08, 0.2, H + 0.07, -0.12);
  pdisc(gp, 0.16, '#eef0d8', undefined, 0.2, f2 + 0.002, -0.12, 2, 24);
  [[-0.055, -0.05], [0.055, -0.05], [-0.055, 0.055], [0.055, 0.055]].forEach(([dx, dz]) => siuMai(gp, 0.2 + dx, f2 + 0.004, -0.12 + dz));
  const lid = new THREE.Group(); lid.position.set(-0.1, H + 0.02, -0.36); lid.rotation.set(-1.2, 0.2, 0); gp.add(lid);
  plathe(lid, [[0, 0.025], [0.17, 0.016], [0.18, 0], [0.17, -0.004], [0, 0.018]], '#d2ad70', (x, _y, z) => (Math.floor(Math.hypot(x, z) * 60) % 2 ? '#c49a5c' : null), 0, 0, 0, 28);
  teapot(gp, 0.2, H, 0.24, '#f3f1ea', -0.5);
  for (const [x, z] of [[-0.06, 0.32], [0.04, 0.38]]) {
    const ir = bowl(gp, 0.04, 0.04, '#f3f1ea', x, H, z, (_px, py) => (py > 0.032 ? '#2c5aa0' : null), 18, 0.55);
    glossy(pdisc(gp, ir(0.03), '#b5782a', undefined, x, H + 0.03, z, 1, 16));
  }
  dish(gp, 0.06, -0.26, H, 0.24, '#f3f1ea', '#a8240f', 0.024);
  chopsticks(gp, -0.2, H, 0.36, -0.2, 0.36);
  steam(gp, 0.2, f2 + 0.06, -0.12, 2, 0.9);
  steam(gp, -0.2, f1 + 0.06, -0.05, 2, 0.8);
};

// ---- shared bits for the later dishes ------------------------------------------------------------------

/** Curled prawn lying on its side (shell on, head + feelers when `head`). */
function prawn(p: THREE.Object3D, x: number, y: number, z: number, ry: number, s = 1, head = true): void {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s); p.add(g);
  const st: { p: V3; w: number; h: number }[] = [];
  for (let k = 0; k <= 6; k++) {
    const a = -0.4 + k * 0.48, r = 0.042 - k * 0.002, w = 0.021 - k * 0.0022;
    st.push({ p: [Math.cos(a) * r, w * 0.9, Math.sin(a) * r], w, h: w * 0.95 });
  }
  glossy(sweep(g, st, '#ec6a3c', { radial: 10, sub: 3, caps: true,
    paint: (px, py, pz) => (Math.floor((Math.atan2(pz, px) + 4) * 4.2) % 2 ? (py > 0.02 ? '#f39a64' : '#f7c8a0') : py > 0.02 ? '#e2532c' : '#f4b68a') }));
  const ta = -0.4 + 6 * 0.48 + 0.2, tr = 0.028;
  for (const sg of [-1, 1]) glossy(ellip(g, '#d8462a', Math.cos(ta) * tr + sg * 0.006, 0.008, Math.sin(ta) * tr, 0.016, 0.004, 0.009, -ta + sg * 0.4));
  if (head) {
    const ha = -0.55;
    glossy(lump(g, '#e2532c', Math.cos(ha) * 0.044, 0.018, Math.sin(ha) * 0.044, 0.026, 0.019, 0.02, { ry: -ha + 1.2, amp: 0.1,
      paint: (_px, py) => (py > 0.4 ? '#c83a1e' : null) }));
    ellip(g, '#111111', Math.cos(ha) * 0.06, 0.028, Math.sin(ha) * 0.05, 0.004);
    for (const sg of [-1, 1]) {
      const b: V3 = [Math.cos(ha) * 0.06, 0.02, Math.sin(ha) * 0.06];
      tube(g, [b, [b[0] + 0.03, 0.05, b[2] - 0.05 + sg * 0.015], [b[0] + 0.09, 0.03, b[2] - 0.1 + sg * 0.04]], 0.0016, 0.001, '#c83a1e', { radial: 4, sub: 3 });
    }
  }
}
/** Open mussel: glossy blue-black shell with the orange meat showing. */
function mussel(p: THREE.Object3D, x: number, y: number, z: number, ry: number): void {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g);
  glossy(lump(g, '#1b1f2c', 0, 0.006, 0, 0.042, 0.012, 0.024, { amp: 0.05, paint: (px, py) => (py < 0 ? '#2c3348' : px > 0.6 ? '#3a4058' : null) }));
  plathe(g, [[0, 0.016], [0.9, 0.012], [1, 0.006]].map(([r, h]) => [r * 0.022, h]) as [number, number][], '#f1ead6', undefined, 0, 0, 0, 14).scale.set(1.75, 1, 1);
  glossy(lump(g, '#ec8a36', 0, 0.018, 0, 0.03, 0.009, 0.016, { amp: 0.15, paint: (px) => (px < -0.5 ? '#d8692a' : null) }));
  glossy(lump(g, '#1b1f2c', 0, 0.016, -0.02, 0.04, 0.01, 0.022, { rx: -1.1, amp: 0.05 }));
}
/** Café cup on a saucer with a glossy drink. */
function cup(p: THREE.Object3D, x: number, y: number, z: number, c: string, drink: string, ry = 0, R = 0.065, Hc = 0.07, band?: string): void {
  plate(p, R * 1.75, c, x, y, z, band);
  const ir = bowl(p, R, Hc, c, x, y + 0.008, z, band ? (_px, py) => (py > Hc - 0.012 && py < Hc - 0.006 ? band : null) : undefined, 24, 0.62, true);
  glossy(pdisc(p, ir(Hc - 0.012), drink, (px, _py, pz) => {
    const d = Math.hypot(px - x, pz - z);
    return d > ir(Hc - 0.012) * 0.75 ? shade(drink, 1.35) : fbm(px * 60, 0, pz * 60) > 0.6 ? shade(drink, 1.2) : null;
  }, x, y + 0.008 + Hc - 0.012, z, 2, 20));
  const c0 = Math.cos(ry), s0 = Math.sin(ry);
  const P = (u: number, h: number): V3 => [x + c0 * u, y + 0.008 + h, z - s0 * u];
  glossy(tube(p, [P(R * 0.95, Hc * 0.8), P(R * 1.45, Hc * 0.72), P(R * 1.45, Hc * 0.35), P(R * 0.92, Hc * 0.28)], 0.007, 0.007, c, { radial: 6, sub: 3 }));
}
/** Chinese-style ceramic soup spoon resting with its handle up. */
function soupSpoon(p: THREE.Object3D, x: number, y: number, z: number, ry: number, c = '#f3f1ea'): void {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g);
  sweep(g, [{ p: [0, 0.012, 0], w: 0.024, h: 0.01 }, { p: [0.035, 0.012, 0], w: 0.032, h: 0.012 }, { p: [0.07, 0.016, 0], w: 0.02, h: 0.009 },
    { p: [0.11, 0.04, 0], w: 0.009, h: 0.006 }, { p: [0.15, 0.06, 0], w: 0.011, h: 0.006 }], c, { radial: 10, sub: 3, caps: true });
}
/** Thin onion ring / chilli ring (torus). */
function ring(p: THREE.Object3D, c: string, x: number, y: number, z: number, r: number, t = 0.18, rx = Math.PI / 2, ry = 0): THREE.Mesh {
  const n = r > 0.05 ? 48 : 14;
  return add(p, geoCache(`fd:torus${t}:${n}`, () => new THREE.TorusGeometry(1, t, 4, n)), mat(c, { flat: false }), x, y, z, r, r, r, ry, rx, 0);
}

// ---- 8. Tacos (Mexico City) ----------------------------------------------------------------------------

function taco(p: THREE.Object3D, x: number, y: number, z: number, ry: number, meat: string, s = 1.5): void {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s); p.add(g);
  const L = 0.13, W = 0.06, Hh = 0.085, t = 0.007, K = 12, N = 9;
  const rings: V3[][] = [];
  for (let i = 0; i <= K; i++) {
    const u = -1 + 2 * i / K, X = u * L, f = Math.max(0.16, Math.sqrt(1 - u * u));
    const ring: V3[] = [];
    for (let j = 0; j <= N; j++) { const v = -1 + 2 * j / N; ring.push([X, Hh * f * v * v * 0.95 + 0.004, W * f * v]); }
    for (let j = N; j >= 0; j--) { const v = -1 + 2 * j / N; ring.push([X, Hh * f * v * v * 0.95 + 0.004 + t, W * f * v * (1 - t / (W * f + 0.001))]); }
    rings.push(ring);
  }
  skin(g, rings, '#ead08e', { caps: true, paint: (px, py, pz) => {
    const n = fbm(px * 40, py * 40 + 3, pz * 40);
    return n > 0.64 ? '#a8742e' : n > 0.58 ? '#c99a52' : hash3(px * 200, py * 200, pz * 200) > 0.93 ? '#d8b06a' : null;
  } });
  // filling: chopped al-pastor / carne with onion, coriander, pineapple
  for (let i = 0; i < 9; i++) {
    const u = rr(-0.75, 0.75);
    lump(g, jit(meat, 0.12), u * L, 0.045 + rr(0, 0.012), rr(-0.012, 0.012), 0.022, 0.016, 0.018, { amp: 0.25, s: i * 3.3, seg: 8,
      paint: (px, py, pz) => (fbm(px * 5, py * 5, pz * 5) > 0.58 ? shade(meat, 0.6) : py > 0.5 ? shade(meat, 1.15) : null) });
  }
  for (let i = 0; i < 9; i++) stick(g, i % 3 ? '#f6f3ea' : '#e9e2f0', rr(-0.1, 0.1), 0.066 + rr(0, 0.008), rr(-0.018, 0.018), 0.011, 0.007, 0.011, rnd() * TAU);
  herbs(g, 12, 0, 0, 0.09, () => 0.07, ['#2f8a34', '#4fae44'], 0.016);
  for (let i = 0; i < 3; i++) glossy(rbox(g, '#f2c63a', rr(-0.09, 0.09), 0.062, rr(-0.012, 0.012), 0.016, 0.011, 0.014, 0.003, rnd() * TAU));
}
function molcajete(p: THREE.Object3D, x: number, y: number, z: number, R: number, sauce: string): void {
  for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + 0.5; lump(p, '#4a4846', x + Math.cos(a) * R * 0.5, y, z + Math.sin(a) * R * 0.5, 0.016, 0.022, 0.016, { seg: 8 }); }
  const ir = bowl(p, R, R * 0.6, '#5a5755', x, y + 0.012, z, (px, py, pz) => (hash3(px * 300, py * 300, pz * 300) > 0.7 ? '#3e3c3a' : null), 22, 0.6);
  glossy(pdisc(p, ir(R * 0.48), sauce, (px, _py, pz) => (fbm(px * 50, 2, pz * 50) > 0.6 ? shade(sauce, 0.7) : hash3(px * 400, 1, pz * 400) > 0.9 ? '#f1e6c8' : null), x, y + 0.012 + R * 0.48, z, 3, 22));
}
const fd_tacos: Builder = (gp) => {
  srand(88);
  const H = table(gp, 'cloth', ['#e4572e', '#f6efe0']);
  // talavera-style plate: white with cobalt rim pattern
  const py = plate(gp, 0.38, '#f7f4ec', 0, H, 0.02, '#1f4fa0', 1.05);
  plathe(gp, [[0.26, 0.0205], [0.3, 0.0215]], '#2a5bb0', (px, _py, pz) => (Math.floor((Math.atan2(pz, px) + 4) * 8) % 2 ? '#e6b62e' : null), 0, H, 0.02, 32);
  taco(gp, -0.17, py, 0.05, 0.75, '#c4562a');
  taco(gp, 0.0, py, 0.0, 0.75, '#8a4a2a');
  taco(gp, 0.17, py, -0.05, 0.75, '#c4562a');
  wedge(gp, 0.24, py + 0.004, 0.2, -0.5, 0.05);
  wedge(gp, 0.04, py + 0.004, 0.27, 0.2, 0.05);
  molcajete(gp, -0.32, H, -0.28, 0.08, '#b8301e');
  molcajete(gp, 0.3, H, -0.31, 0.07, '#6a9a2e');
  bowl(gp, 0.055, 0.035, '#f3d27a', 0.38, H, 0.18, undefined, 18, 0.6);
  herbs(gp, 10, 0.38, 0.18, 0.035, () => H + 0.03, ['#2f8a34', '#4fae44'], 0.016);
  ellip(gp, '#c43a2a', -0.36, H + 0.012, 0.22, 0.014, 0.01, 0.04, 0.4);
  ellip(gp, '#3e8a2a', -0.36, H + 0.01, 0.17, 0.012, 0.009, 0.034, 0.7);
};

// ---- 9. Croissant (Paris) ------------------------------------------------------------------------------

function croissant(p: THREE.Object3D, x: number, y: number, z: number, ry: number, s = 1): void {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s); p.add(g);
  const K = 40, N = 14, rings: V3[][] = [];
  for (let i = 0; i <= K; i++) {
    const t = i / K, ph = (t - 0.5) * 2.3;
    const cx = Math.sin(ph) * 0.24, cz = -Math.cos(ph) * 0.15 + 0.1;
    const tx = Math.cos(ph) * 0.24, tz = Math.sin(ph) * 0.15, tl = Math.hypot(tx, tz);
    const sx = -tz / tl, sz = tx / tl;
    const env = 0.016 + 0.07 * Math.pow(Math.max(0, 1 - Math.pow(2 * t - 1, 2)), 0.8);
    const lobe = 1 - 0.16 * Math.pow(Math.abs(Math.cos(Math.PI * 3.5 * (2 * t - 1))), 10);
    const r = env * lobe;
    const ring: V3[] = [];
    for (let j = 0; j < N; j++) {
      const a = j / N * TAU, ca = Math.cos(a), sa = Math.sin(a);
      ring.push([cx + sx * ca * r * 1.12, Math.max(0.002, r * 0.85 + sa * r * 0.85), cz + sz * ca * r * 1.12]);
    }
    rings.push(ring);
  }
  skin(g, rings, '#c97a2c', { caps: true, paint: (px, py, pz) => {
    const n = fbm(px * 30, py * 30, pz * 30);
    if (py < 0.01) return '#b86a24';
    const tt = Math.atan2(px / 0.24, (0.1 - pz) / 0.15) / 2.3 + 0.5;
    const gro = Math.pow(Math.abs(Math.cos(Math.PI * 3.5 * (2 * tt - 1))), 10);
    if (gro > 0.5) return n > 0.5 ? '#e0a456' : '#d89a4a';
    return py > 0.1 ? (n > 0.55 ? '#a85a1c' : '#b9661f') : n > 0.6 ? '#d08a3a' : '#c47528';
  } });
  glossy(skin(g, rings.slice(3, K - 2).map(r => r.map(([a, b, c]) => [a, b + 0.0015, c] as V3).filter((_, j) => j >= 2 && j <= 6)), '#b86520', { caps: false, closed: false,
    paint: (_px, py) => (py > 0.12 ? '#a35418' : null) }));
}
const fd_croissant: Builder = (gp) => {
  srand(99);
  const H = table(gp, 'marble');
  const py = plate(gp, 0.31, '#fbfaf6', -0.06, H, 0.06, '#d4b25a');
  croissant(gp, -0.05, py, 0.06, -0.15, 1.08);
  for (let i = 0; i < 9; i++) ellip(gp, '#d99a4a', -0.06 + rr(-0.2, 0.2), py + 0.002, 0.06 + rr(-0.12, 0.2), 0.008, 0.002, 0.005, rnd() * TAU);
  cup(gp, 0.3, H, -0.2, '#fbfaf6', '#a8743a', 0.4, 0.07, 0.075, '#d4b25a');
  // butter pat and jam pot
  plate(gp, 0.06, '#fbfaf6', 0.32, H, 0.18);
  rbox(gp, '#f8e6a0', 0.32, H + 0.014, 0.18, 0.04, 0.018, 0.03, 0.004, 0.3);
  const jr = bowl(gp, 0.05, 0.055, '#f2f0ea', -0.33, H, -0.27, undefined, 20, 0.7, true);
  glossy(pdisc(gp, jr(0.05), '#a8182a', (px, _y, pz) => (fbm(px * 60, 0, pz * 60) > 0.6 ? '#d0283a' : null), -0.33, H + 0.05, -0.27, 2, 18));
  // newspaper fold behind
  const np = new THREE.Group(); np.position.set(0.0, H + 0.002, -0.36); np.rotation.y = 0.15; gp.add(np);
  rbox(np, '#ece8de', 0, 0, 0, 0.32, 0.006, 0.16, 0.002);
  for (let i = 0; i < 6; i++) rbox(np, i === 0 ? '#2a2a2a' : '#9a968e', -0.13 + (i === 0 ? 0.11 : (i % 2) * 0.14), 0.006, -0.05 + i * 0.018, i === 0 ? 0.26 : 0.12, 0.0015, i === 0 ? 0.022 : 0.008, 0.0005);
};

// ---- 10. Paella (Valencia) -----------------------------------------------------------------------------

const fd_paella: Builder = (gp) => {
  srand(110);
  const H = table(gp, 'wood');
  const R = 0.39;
  glossy(plathe(gp, [[0, 0], [R - 0.03, 0], [R, 0.03], [R + 0.018, 0.05], [R + 0.01, 0.052], [R - 0.008, 0.032], [R - 0.035, 0.008], [0, 0.008]], '#2b2b2e',
    (_x, py) => (py > 0.04 ? '#4a4a4e' : null), 0, H, 0, 44));
  for (const sg of [-1, 1]) {
    tube(gp, [[sg * (R + 0.005), H + 0.04, -0.04], [sg * (R + 0.06), H + 0.045, -0.035], [sg * (R + 0.075), H + 0.045, 0], [sg * (R + 0.06), H + 0.045, 0.035], [sg * (R + 0.005), H + 0.04, 0.04]],
      0.008, 0.008, '#b02a24', { radial: 6, sub: 3 });
  }
  const ry = H + 0.026, RR = R - 0.012;
  gridDisc(gp, RR, ry, 44, (x, z) => {
    const d = Math.hypot(x, z) / RR, n = fbm(x * 18, 0, z * 18), h = hash3(Math.floor(x * 140), 5, Math.floor(z * 140));
    if (d > 0.9 && n > 0.45) return n > 0.6 ? '#7a3e12' : '#a8601c';
    return h > 0.8 ? '#f2c452' : h < 0.15 ? '#dc9a28' : n > 0.6 ? '#e09a2a' : n < 0.38 ? '#f0b83c' : '#eaa832';
  }, { h: (x, z) => fbm(x * 12, 1, z * 12) * 0.012 - Math.max(0, Math.hypot(x, z) / RR - 0.85) * 0.06 });
  for (let i = 0; i < 6; i++) {
    const a = i * TAU / 6 + 0.3, d = 0.21;
    prawn(gp, Math.cos(a) * d, ry + 0.004, Math.sin(a) * d, -a + Math.PI * 0.5, 1.15);
  }
  for (let i = 0; i < 7; i++) {
    const a = i * TAU / 7 + 0.05, d = 0.31;
    mussel(gp, Math.cos(a) * d, ry + 0.004, Math.sin(a) * d, -a + 1.7);
  }
  for (let i = 0; i < 5; i++) {
    const a = rnd() * TAU, d = rr(0.05, 0.27);
    lump(gp, '#d9a46a', Math.cos(a) * d, ry + 0.01, Math.sin(a) * d, 0.032, 0.02, 0.026, { amp: 0.2, s: i * 2, ry: rnd() * TAU,
      paint: (px, py, pz) => (fbm(px * 4, py * 4, pz * 4) > 0.55 ? '#a8692e' : null) });
  }
  for (let i = 0; i < 10; i++) {
    const a = rnd() * TAU, d = rr(0.04, 0.3);
    glossy(rbox(gp, i % 2 ? '#cf2a1c' : '#4f8f2a', Math.cos(a) * d, ry + 0.008, Math.sin(a) * d, i % 2 ? 0.05 : 0.06, 0.007, 0.012, 0.003, rnd() * TAU));
  }
  for (let i = 0; i < 24; i++) { const a = rnd() * TAU, d = rr(0.03, 0.32); glossy(ellip(gp, '#6aac3a', Math.cos(a) * d, ry + 0.012, Math.sin(a) * d, 0.009)); }
  wedge(gp, 0.06, ry + 0.01, 0.04, 0.3, 0.055, '#f0cf2a', '#f8eb98');
  wedge(gp, -0.08, ry + 0.01, -0.06, 2.6, 0.055, '#f0cf2a', '#f8eb98');
  herbs(gp, 18, 0, 0, 0.3, () => ry + 0.012, ['#2f7d2c', '#4a9a3a'], 0.014);
  steam(gp, 0.05, ry, -0.12, 2, 1.1);
};

// ---- 11. Masala dosa (Chennai) -------------------------------------------------------------------------

const fd_dosa: Builder = (gp) => {
  srand(121);
  const H = table(gp, 'teak');
  // steel thali with a banana leaf
  glossy(plathe(gp, [[0, 0], [0.42, 0], [0.45, 0.022], [0.455, 0.03], [0.44, 0.03], [0.415, 0.008], [0, 0.008]], '#c9ced4',
    (px, py, pz) => (py < 0.009 && Math.hypot(px, pz) > 0.3 ? '#d8dde2' : null), 0, H, 0, 44));
  const fy = H + 0.009;
  gridDisc(gp, 0.4, fy, 16, (x, z) => (Math.abs(z * 0.9 + x * 0.1) < 0.006 ? '#9ac25a' : Math.floor((z * 0.9 + x * 0.1) * 70) % 2 ? '#3f8f2c' : '#4a9a34'),
    { h: (x) => 0.001 + Math.abs(x) * 0.004, sz: 0.85 });
  // the long golden roll, overhanging both sides
  const st: { p: V3; w: number; h: number }[] = [];
  for (let i = 0; i <= 8; i++) {
    const u = -1 + 2 * i / 8, w = 0.072 * (1 - 0.5 * Math.pow(Math.abs(u), 3)) * (u > 0 ? 1 - 0.2 * u : 1 + 0.1 * u);
    st.push({ p: [u * 0.52, fy + w * 0.75, -0.04 + u * 0.06], w, h: w * 0.78 });
  }
  sweep(gp, st, '#dea044', { radial: 20, sub: 5, caps: true, paint: (px, py, pz) => {
    const n = fbm(px * 26, py * 26, pz * 26), lace = hash3(Math.floor(px * 120), Math.floor(py * 120), Math.floor(pz * 120));
    if (py < fy + 0.012) return n > 0.5 ? '#ecc883' : '#f2d595';
    return n > 0.66 ? '#a8641e' : n > 0.58 ? '#c98a32' : lace > 0.88 ? '#f0cc7e' : n < 0.38 ? '#e9b45a' : '#dea044';
  } });
  // spiral seam along the top
  tube(gp, st.map(s0 => [s0.p[0], s0.p[1] + s0.h * 0.9, s0.p[2] + s0.w * 0.25] as V3).slice(1, 8), 0.004, 0.004, '#c08030', { radial: 5, sub: 3 });
  // potato masala peeking from the open end
  lump(gp, '#e8b83a', 0.47, fy + 0.03, 0.02, 0.04, 0.026, 0.035, { amp: 0.3, paint: (px, py, pz) => (hash3(px * 90, py * 90, pz * 90) > 0.82 ? '#3a2a1a' : fbm(px * 6, py * 6, pz * 6) > 0.6 ? '#f2d070' : null) });
  // chutneys + sambar in steel katoris
  const kat = (x: number, z: number, R: number, c: string, dots: string, gr = false) => {
    const ir = bowl(gp, R, 0.045, '#c4c9cf', x, fy, z, (_px, py) => (py > 0.04 ? '#e0e4e8' : null), 22, 0.75, true);
    glossy(pdisc(gp, ir(0.036), c, (px, _py, pz) => (hash3(px * 260, 2, pz * 260) > 0.88 ? dots : fbm(px * 40, 0, pz * 40) > 0.62 ? shade(c, 1.15) : null), x, fy + 0.036, z, 3, 22));
    if (gr) herbs(gp, 6, x, z, R * 0.5, () => fy + 0.037, ['#2f7d2c'], 0.012);
  };
  kat(-0.22, 0.2, 0.08, '#f1ecd8', '#2a2018', true);
  kat(-0.02, 0.26, 0.07, '#cc4a22', '#7a2410');
  kat(0.2, 0.2, 0.09, '#c8782c', '#e8c060', true);
  for (let i = 0; i < 4; i++) rbox(gp, i % 2 ? '#e88a3a' : '#8ab84a', 0.2 + rr(-0.04, 0.04), fy + 0.034, 0.2 + rr(-0.04, 0.04), 0.014, 0.008, 0.014, 0.002, rnd() * TAU);
  // a drumstick + green chilli for colour
  tube(gp, [[0.05, fy + 0.008, -0.27], [0.18, fy + 0.008, -0.24], [0.3, fy + 0.01, -0.21]], 0.007, 0.004, '#3f8f2c', { radial: 6, sub: 3 });
};

// ---- 12. Pad thai (Bangkok) ----------------------------------------------------------------------------

const fd_padthai: Builder = (gp) => {
  srand(132);
  const H = table(gp, 'teak');
  const py = plate(gp, 0.36, '#f3f1ea', 0, H, 0, '#2f7d4a', 1, 0.02);
  // banana leaf liner
  gridDisc(gp, 0.27, py + 0.001, 12, (x, z) => (Math.floor((z + x * 0.2) * 60) % 2 ? '#3f8f2c' : '#4a9a34'), { h: () => 0 });
  const my = py + 0.004;
  lump(gp, '#c98c4a', 0, my, -0.01, 0.2, 0.07, 0.17, { amp: 0.1, f: 2.4, flatBottom: true,
    paint: (px, py2, pz) => { const n = fbm(px * 9, py2 * 9, pz * 9); return n > 0.62 ? '#a8682a' : Math.sin((px * 3 + pz * 2) * 30 + n * 9) > 0.3 ? '#e4b472' : '#d29a56'; } });
  // loose noodle ribbons on the mound
  for (let i = 0; i < 60; i++) {
    const a = rnd() * TAU, d = rr(0.0, 0.21), x = Math.cos(a) * d, z = Math.sin(a) * d * 0.85 - 0.01, b = rnd() * TAU;
    const hy = (q: number) => my + 0.068 * Math.max(0, 1 - (q / 0.21) ** 2) + 0.004;
    const pts: V3[] = [];
    for (let k = 0; k < 5; k++) {
      const u = (k - 2) * 0.03, X = x + Math.cos(b + k * 0.25) * u, Z = z + Math.sin(b + k * 0.25) * u;
      pts.push([X, hy(Math.hypot(X, Z)) + Math.sin(k * 1.7 + i) * 0.008, Z]);
    }
    sweep(gp, pts.map(pt => ({ p: pt, w: 0.009, h: 0.003 })), i % 3 ? '#ecbd78' : '#d8a060', { radial: 6, sub: 3, caps: true });
  }
  for (let i = 0; i < 5; i++) {
    const a = i * TAU / 5 + 0.4, d = 0.1;
    prawn(gp, Math.cos(a) * d, my + 0.06, Math.sin(a) * d * 0.85 - 0.01, -a + 1.6, 0.95, false);
  }
  for (let i = 0; i < 10; i++) { const a = rnd() * TAU, d = rr(0, 0.16); lump(gp, '#f4cf4a', Math.cos(a) * d, my + 0.07 * (1 - d / 0.22) + 0.012, Math.sin(a) * d * 0.8, 0.016, 0.009, 0.014, { amp: 0.3, seg: 8, s: i, paint: (_x, y2) => (y2 > 0.3 ? '#f9e48a' : null) }); }
  for (let i = 0; i < 12; i++) {
    const a = rnd() * TAU, d = rr(0.02, 0.17), x = Math.cos(a) * d, z = Math.sin(a) * d * 0.8, b = rnd() * TAU, yy = my + 0.075 * (1 - (d / 0.22) ** 2) + 0.01;
    tube(gp, [[x, yy, z], [x + Math.cos(b) * 0.03, yy + 0.006, z + Math.sin(b) * 0.03], [x + Math.cos(b + 0.4) * 0.055, yy, z + Math.sin(b + 0.4) * 0.055]], 0.004, 0.0035, i % 2 ? '#f4f0dc' : '#3f9a3a', { radial: 5, sub: 2 });
  }
  for (let i = 0; i < 40; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * 0.12; ellip(gp, jit('#c99a5a', 0.15), Math.cos(a) * d, my + 0.075 * (1 - (d / 0.22) ** 2) + 0.012, Math.sin(a) * d * 0.8 - 0.01, 0.007, 0.004, 0.006, rnd() * TAU); }
  for (let i = 0; i < 14; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * 0.15; ellip(gp, '#b8200f', Math.cos(a) * d, my + 0.075 * (1 - (d / 0.22) ** 2) + 0.012, Math.sin(a) * d * 0.8, 0.004, 0.002, 0.003); }
  for (let i = 0; i < 6; i++) { const a = rnd() * TAU, d = rr(0.04, 0.15); rbox(gp, '#e8b45a', Math.cos(a) * d, my + 0.07 * (1 - (d / 0.22) ** 2), Math.sin(a) * d * 0.8, 0.026, 0.02, 0.026, 0.004, rnd() * TAU); }
  wedge(gp, 0.25, py + 0.004, 0.12, -0.6, 0.05);
  // side garnish: bean sprouts, chives, chilli flakes and sugar
  for (let i = 0; i < 10; i++) {
    const x = -0.24 + rr(-0.03, 0.03), z = 0.14 + rr(-0.03, 0.03), b = rnd() * TAU;
    tube(gp, [[x, py + 0.008, z], [x + Math.cos(b) * 0.04, py + 0.014, z + Math.sin(b) * 0.04], [x + Math.cos(b + 0.5) * 0.07, py + 0.008, z + Math.sin(b + 0.5) * 0.07]], 0.0045, 0.004, '#f6f2e0', { radial: 5, sub: 2 });
  }
  for (let i = 0; i < 4; i++) rbox(gp, '#3f9a3a', -0.25 + i * 0.012, py + 0.005, 0.04, 0.008, 0.008, 0.12, 0.003, 0.3);
  for (const [x, z, c] of [[-0.3, -0.33, '#b8200f'], [-0.14, -0.38, '#f6f2ea'], [0.02, -0.4, '#d8b07a']] as [number, number, string][]) {
    const ir = bowl(gp, 0.05, 0.035, '#f3f1ea', x, H, z, (_px, py2) => (py2 > 0.03 ? '#2f7d4a' : null), 18, 0.6);
    pdisc(gp, ir(0.026), c, (px, _y, pz) => (hash3(px * 300, 1, pz * 300) > 0.7 ? shade(c, 0.8) : null), x, H + 0.026, z, 2, 18);
  }
  chopsticks(gp, 0.32, H, -0.12, 1.25, 0.36);
};

// ---- 13. Phở (Hanoi) -----------------------------------------------------------------------------------

const fd_pho: Builder = (gp) => {
  srand(143);
  const H = table(gp, 'dark');
  const R = 0.31, BH = 0.17, bx = -0.06, bz = -0.03;
  const ir = bowl(gp, R, BH, '#f6f5f0', bx, H, bz, (px, py, pz) => {
    if (py > BH - 0.03 && py < BH - 0.015) return Math.floor((Math.atan2(pz - bz, px - bx) + 4) * 6) % 2 ? '#2a5aa8' : '#f6f5f0';
    return py > 0.03 && py < 0.04 ? '#2a5aa8' : null;
  }, 40, 0.42);
  const ly = H + BH - 0.035, LR = ir(BH - 0.035);
  glossy(pdisc(gp, LR, '#9c7a52', (x, _y, z) => (hash3(x * 200, 0, z * 200) > 0.92 ? '#c8a070' : fbm(x * 12, 0, z * 12) > 0.6 ? '#8a6a46' : null), bx, ly, bz, 10, 44));
  // noodles drifting in the broth
  for (let i = 0; i < 12; i++) {
    const a = rnd() * TAU, d = rr(0.04, LR - 0.05), x = bx + Math.cos(a) * d, z = bz + Math.sin(a) * d, b = rnd() * TAU;
    tube(gp, [[x - Math.cos(b) * 0.05, ly - 0.004, z - Math.sin(b) * 0.05], [x, ly + 0.002, z], [x + Math.cos(b + 0.7) * 0.05, ly - 0.004, z + Math.sin(b + 0.7) * 0.05]], 0.0055, 0.0055, '#f6f2e6', { radial: 6, sub: 3 });
  }
  // rare beef slices fanned on top
  for (let i = 0; i < 6; i++) {
    const a = -2.6 + i * 0.42, d = LR * 0.55, x = bx + Math.cos(a) * d, z = bz + Math.sin(a) * d;
    lump(gp, '#c4746c', x, ly + 0.002, z, 0.055, 0.005, 0.036, { amp: 0.12, s: i * 2, ry: -a + 1.5,
      paint: (px, py, pz) => (fbm(px * 3 + i, py, pz * 3) > 0.56 ? '#8a5a50' : hash3(px * 40, py, pz * 40) > 0.85 ? '#e8c0b0' : null) });
  }
  for (let i = 0; i < 7; i++) {
    const a = rnd() * TAU, d = rr(0.03, LR * 0.8);
    ring(gp, '#f2eefa', bx + Math.cos(a) * d, ly + 0.004, bz + Math.sin(a) * d, rr(0.016, 0.026), 0.12);
  }
  for (let i = 0; i < 14; i++) {
    const a = rnd() * TAU, d = rr(0.03, LR * 0.8);
    ring(gp, i % 2 ? '#4aa83a' : '#7ac85a', bx + Math.cos(a) * d, ly + 0.004, bz + Math.sin(a) * d, 0.007, 0.35);
  }
  herbs(gp, 22, bx + 0.05, bz + 0.03, 0.1, () => ly + 0.003, ['#2f8a34', '#4fae44', '#3d9a3a'], 0.02);
  for (let i = 0; i < 4; i++) ring(gp, '#d8241a', bx + 0.08 + i * 0.02, ly + 0.005, bz - 0.1 + rr(-0.02, 0.02), 0.009, 0.3);
  soupSpoon(gp, bx + 0.12, ly - 0.01, bz + 0.12, -0.9);
  chopsticks(gp, bx + 0.02, H + BH - 0.002, bz - 0.04, -0.3, 0.42);
  steam(gp, bx - 0.05, ly, bz - 0.05, 3, 1.1);
  // herb plate: Thai basil, sprouts, lime, chilli
  const sp = plate(gp, 0.13, '#f6f5f0', 0.3, H, 0.27, '#2a5aa8');
  for (let i = 0; i < 6; i++) leaf(gp, i % 2 ? '#2f7d2c' : '#3f9a3a', 0.3 + rr(-0.05, 0.05), sp + 0.006 + i * 0.003, 0.27 + rr(-0.04, 0.04), 0.045, rnd() * TAU, 0.15, 0.5);
  for (let i = 0; i < 6; i++) {
    const x = 0.26 + rr(-0.03, 0.03), z = 0.31 + rr(-0.02, 0.02), b = rnd() * TAU;
    tube(gp, [[x, sp + 0.016, z], [x + Math.cos(b) * 0.04, sp + 0.022, z + Math.sin(b) * 0.04]], 0.0045, 0.004, '#f6f2e0', { radial: 5, sub: 2 });
  }
  wedge(gp, 0.35, sp + 0.004, 0.33, -0.4, 0.04);
  wedge(gp, 0.38, sp + 0.004, 0.22, -1.6, 0.04);
  for (let i = 0; i < 4; i++) ring(gp, '#d8241a', 0.24 + i * 0.016, sp + 0.008, 0.2, 0.009, 0.3);
  // hoisin + sriracha
  for (const [x, z, c, cap] of [[0.33, -0.22, '#5a2a1a', '#2a7a3a'], [0.4, -0.08, '#c8281a', '#2a8a3a']] as [number, number, string, string][]) {
    glossy(plathe(gp, [[0, 0], [0.035, 0], [0.038, 0.01], [0.038, 0.11], [0.03, 0.14], [0.014, 0.16], [0, 0.16]], c, (_px, py) => (py > 0.05 && py < 0.09 ? '#f3efe2' : null), x, H, z, 16));
    cyl(gp, cap, x, H + 0.155, z, 0.015, 0.025, 10);
  }
};

// ---- 14. Bibimbap (Jeonju) -----------------------------------------------------------------------------

const fd_bibimbap: Builder = (gp) => {
  srand(154);
  const H = table(gp, 'wood');
  // wooden trivet + black stone dolsot
  plathe(gp, [[0, 0], [0.33, 0], [0.34, 0.01], [0.33, 0.025], [0, 0.025]], '#8a5a32', (x, _y, z) => shade('#8a5a32', 0.85 + fbm(x * 6, 1, z * 30) * 0.3), -0.04, H, -0.04, 36);
  const R = 0.3, BH = 0.16, bx = -0.04, bz = -0.04, by = H + 0.025;
  const ir = bowl(gp, R, BH, '#2e2b29', bx, by, bz, (px, py, pz) => (hash3(px * 200, py * 200, pz * 200) > 0.8 ? '#3e3a37' : null), 40, 0.6, true);
  const ry = by + BH - 0.03, RR = ir(BH - 0.03);
  pdisc(gp, RR, '#f4f0e6', (x, _y, z) => (hash3(x * 300, 1, z * 300) > 0.6 ? '#fbf8f0' : null), bx, ry, bz, 4, 40);
  const segs: [string, string, string][] = [
    ['spinach', '#2f6e26', '#3f8a32'], ['carrot', '#ee7a22', '#f59a3e'], ['sprouts', '#f2ead0', '#e8dca8'], ['mushroom', '#6a4630', '#8a5e40'],
    ['zucchini', '#9ccc5a', '#c8e090'], ['beef', '#5a3424', '#7a4a30'], ['radish', '#d8402a', '#f0e4d8'],
  ];
  segs.forEach(([kind, c1, c2], i) => {
    const a0 = i * TAU / segs.length, a1 = (i + 1) * TAU / segs.length;
    for (let k = 0; k < 30; k++) {
      const a = rr(a0 + 0.06, a1 - 0.06), d = rr(0.1, RR - 0.02), x = bx + Math.cos(a) * d, z = bz + Math.sin(a) * d, c = k % 2 ? c1 : c2;
      if (kind === 'mushroom' || kind === 'beef') lump(gp, c, x, ry + 0.01, z, 0.018, 0.008, 0.013, { seg: 7, amp: 0.25, ry: rnd() * TAU, s: k });
      else if (kind === 'spinach') leaf(gp, c, x, ry + 0.01 + rr(0, 0.008), z, 0.03, rnd() * TAU, 0.3, 0.4);
      else stick(gp, c, x, ry + 0.004 + rr(0, 0.01), z, 0.05, 0.007, 0.007, a + Math.PI / 2 + rr(-0.5, 0.5));
    }
  });
  // fried egg with a sunny yolk + gochujang dollop
  lump(gp, '#fbf8f0', bx, ry + 0.024, bz, 0.1, 0.009, 0.09, { amp: 0.2, f: 1.5, flatBottom: true, paint: (px) => (px > 0.85 ? '#e8c890' : null) });
  glossy(lump(gp, '#f6a81a', bx - 0.01, ry + 0.034, bz + 0.005, 0.04, 0.022, 0.04, { amp: 0.04, paint: (_x, y) => (y > 0.6 ? '#fbc23a' : null) }));
  glossy(lump(gp, '#c4201a', bx + 0.06, ry + 0.032, bz - 0.05, 0.03, 0.02, 0.026, { amp: 0.2 }));
  for (let i = 0; i < 20; i++) { const a = rnd() * TAU, d = rr(0.02, 0.2); ellip(gp, '#f6f0e0', bx + Math.cos(a) * d, ry + 0.03, bz + Math.sin(a) * d, 0.003, 0.002, 0.002); }
  // banchan: kimchi + steel spoon & chopsticks
  const kp = plate(gp, 0.09, '#f3f1ea', 0.34, H, 0.27, '#5a7a9a');
  for (let i = 0; i < 6; i++) lump(gp, i % 2 ? '#d8401e' : '#e8602a', 0.34 + rr(-0.04, 0.04), kp + 0.01, 0.27 + rr(-0.04, 0.04), 0.035, 0.012, 0.022, { amp: 0.3, s: i, ry: rnd() * TAU, seg: 10,
    paint: (px, py, pz) => (fbm(px * 4, py * 4, pz * 4) > 0.58 ? '#f2d8b0' : null) });
  const sp = new THREE.Group(); sp.position.set(-0.33, H + 0.004, 0.33); sp.rotation.y = 0.35; gp.add(sp);
  glossy(ellip(sp, '#c9ced4', 0, 0.006, 0, 0.04, 0.006, 0.028));
  glossy(rbox(sp, '#c9ced4', 0.15, 0, 0, 0.22, 0.005, 0.012, 0.002));
  chopsticks(gp, -0.22, H, 0.4, 0.35, 0.4, '#c9ced4', '#b8bec4', 0.03);
  steam(gp, bx, ry, bz, 2, 1);
};

// ---- 15. Fish and chips (England) ----------------------------------------------------------------------

const fd_fishchips: Builder = (gp) => {
  srand(165);
  const H = table(gp, 'dark');
  // newspaper sheet, slightly crumpled
  const np = gridDisc(gp, 0.42, H + 0.003, 24, (x, z) => {
    const row = Math.floor((z + 0.5) * 70), col = Math.floor((x + 0.5) * 5);
    if (Math.abs(x + z * 0.2) > 0.32) return '#ebe6da';
    if (row % 7 === 0 && col % 2 === 0) return '#3a3a3a';
    return row % 2 ? '#c8c4ba' : '#e2ddd0';
  }, { h: (x, z) => fbm(x * 6, 4, z * 6) * 0.012, sz: 0.9 });
  if (np) np.rotation.y = 0.5;
  const y0 = H + 0.01;
  // battered cod fillet
  lump(gp, '#d8962e', -0.02, y0 + 0.04, -0.04, 0.27, 0.055, 0.11, { amp: 0.09, f: 3, ry: 0.35, seg: 30, flatBottom: true,
    paint: (px, py, pz) => { const n = fbm(px * 5, py * 5, pz * 5); return n > 0.66 ? '#c07a22' : n > 0.58 ? '#cc8a2a' : n < 0.36 ? '#e4aa44' : null; } });
  // a bite broken open: flaky white fish
  lump(gp, '#fbf8f0', 0.23, y0 + 0.04, -0.14, 0.04, 0.035, 0.07, { ry: 0.35, amp: 0.2, paint: (px) => (Math.sin(px * 40) > 0.7 ? '#e8e2d6' : null) });
  // chips heaped in front
  for (let i = 0; i < 46; i++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * 0.16, x = -0.05 + Math.cos(a) * d * 1.3, z = 0.17 + Math.sin(a) * d * 0.7;
    const h = y0 + 0.008 + (1 - d / 0.16) * 0.05 + rr(0, 0.01);
    const c = jit(i % 4 ? '#ecbd5a' : '#d89a3a', 0.08);
    stick(gp, c, x, h, z, rr(0.09, 0.13), 0.02, 0.02, rnd() * TAU, rr(-0.25, 0.25));
  }
  // lemon wedge, mushy peas, tartare sauce, malt vinegar
  wedge(gp, 0.16, y0 + 0.004, 0.05, -0.8, 0.05, '#f0cf2a', '#f8eb98');
  for (const [x, z, c] of [[0.3, 0.25, '#6aa83a'], [0.33, -0.02, '#f2edd8']] as [number, number, string][]) {
    const ir = bowl(gp, 0.065, 0.045, '#f3f1ea', x, H, z, undefined, 20, 0.6);
    lump(gp, c, x, H + 0.04, z, ir(0.04), 0.015, ir(0.04), { amp: 0.25, f: 3, paint: (px, py, pz) => (hash3(px * 50, py * 50, pz * 50) > 0.8 ? shade(c, 0.8) : null) });
  }
  glossy(plathe(gp, [[0, 0], [0.04, 0], [0.042, 0.01], [0.042, 0.13], [0.03, 0.16], [0.015, 0.18], [0.015, 0.21], [0, 0.21]], '#5a3416',
    (_px, py) => (py > 0.05 && py < 0.1 ? '#e8dcc0' : null), -0.3, H, -0.28, 18));
  cyl(gp, '#c9ced4', -0.3, H + 0.205, -0.28, 0.017, 0.02, 10);
  // wooden chip fork
  const fk = new THREE.Group(); fk.position.set(-0.3, H + 0.006, 0.26); fk.rotation.y = 0.5; gp.add(fk);
  rbox(fk, '#d8b88a', 0, 0, 0, 0.1, 0.004, 0.014, 0.001);
  rbox(fk, '#d8b88a', 0.06, 0, -0.004, 0.025, 0.004, 0.005, 0.001);
  rbox(fk, '#d8b88a', 0.06, 0, 0.004, 0.025, 0.004, 0.005, 0.001);
  ellip(gp, '#f2ecd8', -0.2, y0 + 0.008, 0.02, 0.02, 0.006, 0.014);
};

// ---- 16. Tagine (Marrakesh) ----------------------------------------------------------------------------

const fd_tagine: Builder = (gp) => {
  srand(176);
  const H = table(gp, 'cloth', ['#1f5aa8', '#f4efe2']);
  const bx = -0.03, bz = 0.03, R = 0.31;
  // glazed terracotta base with painted rim
  plathe(gp, [[0, 0], [R * 0.7, 0], [R * 0.74, 0.012], [R, 0.05], [R + 0.01, 0.065], [R - 0.005, 0.068], [R - 0.02, 0.05], [R * 0.7, 0.02], [0, 0.02]], '#b5552a',
    (px, py, pz) => {
      const d = Math.hypot(px - bx, pz - bz);
      if (py > 0.035 && d > R - 0.03) return Math.floor((Math.atan2(pz - bz, px - bx) + 4) * 7) % 2 ? '#e8c24a' : '#1f6a8a';
      return py < 0.012 ? '#8a3a1c' : null;
    }, bx, H, bz, 40);
  const fy = H + 0.02;
  // the stew: sauce, chicken, olives, preserved lemon, apricots, prunes
  glossy(lump(gp, '#c4782a', bx, fy + 0.005, bz, R * 0.85, 0.02, R * 0.85, { amp: 0.1, flatBottom: true, paint: (px, py, pz) => (fbm(px * 5, py * 5, pz * 5) > 0.6 ? '#d89a3a' : null) }));
  for (let i = 0; i < 4; i++) {
    const a = i * TAU / 4 + 0.4, d = 0.1;
    glossy(lump(gp, '#c4844a', bx + Math.cos(a) * d, fy + 0.04, bz + Math.sin(a) * d, 0.07, 0.045, 0.05, { amp: 0.15, s: i * 2, ry: rnd() * TAU,
      paint: (px, py, pz) => (fbm(px * 4, py * 4, pz * 4) > 0.55 ? '#a8622e' : py > 0.5 ? '#e0a860' : null) }));
  }
  for (let i = 0; i < 12; i++) { const a = rnd() * TAU, d = rr(0.12, 0.24); glossy(ellip(gp, i % 3 ? '#7a8a2a' : '#5a6a1e', bx + Math.cos(a) * d, fy + 0.03, bz + Math.sin(a) * d, 0.018, 0.014, 0.014, rnd() * TAU)); }
  for (let i = 0; i < 6; i++) { const a = rnd() * TAU, d = rr(0.1, 0.22); glossy(lump(gp, i % 2 ? '#e8902a' : '#3a1e18', bx + Math.cos(a) * d, fy + 0.03, bz + Math.sin(a) * d, 0.024, 0.014, 0.02, { seg: 8, amp: 0.15 })); }
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1 + 1, d = 0.17, x = bx + Math.cos(a) * d, z = bz + Math.sin(a) * d;
    const g = new THREE.Group(); g.position.set(x, fy + 0.035, z); g.rotation.set(0.3, -a, 0); gp.add(g);
    plathe(g, [[0, 0], [0.035, 0], [0.035, 0.008], [0, 0.008]], '#f2d24a', (px, _py, pz) => (Math.hypot(px, pz) > 0.03 ? '#e0b82a' : Math.floor((Math.atan2(pz, px) + 4) * 1.6) % 2 ? '#f8e48a' : null), 0, 0, 0, 16);
  }
  herbs(gp, 24, bx, bz, 0.2, () => fy + 0.06, ['#2f8a34', '#4fae44'], 0.018);
  for (let i = 0; i < 20; i++) { const a = rnd() * TAU, d = rr(0.05, 0.22); ellip(gp, '#d8c060', bx + Math.cos(a) * d, fy + 0.055, bz + Math.sin(a) * d, 0.005, 0.003, 0.003, rnd() * TAU); }
  // conical lid tilted back against the base
  const lid = new THREE.Group(); lid.position.set(bx + 0.05, H + 0.07, bz - 0.33); lid.rotation.set(-0.75, 0.3, 0); lid.scale.setScalar(0.88); gp.add(lid);
  plathe(lid, [[R - 0.01, 0], [R - 0.03, 0.03], [0.17, 0.12], [0.08, 0.26], [0.045, 0.34], [0.05, 0.37], [0.03, 0.4], [0, 0.405],
    [0.001, 0.38], [0.03, 0.3], [0.06, 0.25], [0.15, 0.11], [R - 0.045, 0.02], [R - 0.03, 0]], '#b5552a', (px, py, pz) => {
    const a = Math.atan2(pz, px);
    if (py > 0.06 && py < 0.09) return Math.floor((a + 4) * 9) % 2 ? '#e8c24a' : '#1f6a8a';
    if (py > 0.2 && py < 0.22) return '#1f6a8a';
    if (py > 0.34) return '#e8c24a';
    return fbm(px * 10, py * 10, pz * 10) > 0.6 ? '#c4643a' : null;
  }, 0, 0, 0, 36);
  // mint tea glass and khobz bread
  const tx = 0.33, tz = 0.22;
  glossy(plathe(gp, [[0, 0], [0.03, 0], [0.03, 0.006], [0.025, 0.012], [0.032, 0.1], [0.028, 0.1], [0, 0.09]], '#b8742a',
    (_px, py) => (py > 0.07 && py < 0.08 ? '#e8c24a' : py > 0.085 ? '#d8c890' : null), tx, H, tz, 18));
  herbs(gp, 4, tx, tz, 0.012, () => H + 0.095, ['#3f9a3a'], 0.015);
  plathe(gp, [[0, 0], [0.12, 0], [0.13, 0.015], [0.12, 0.03], [0, 0.034]], '#d8a868', (px, _py, pz) => (fbm(px * 20, 1, pz * 20) > 0.6 ? '#b8823a' : hash3(px * 300, 1, pz * 300) > 0.9 ? '#f2e2b8' : null), -0.34, H, 0.26, 24);
};

// ---- 17. Jollof rice (Senegambia / West Africa) --------------------------------------------------------

const fd_jollof: Builder = (gp) => {
  srand(187);
  const H = table(gp, 'cloth', ['#e8a21a', '#2a7a3a']);
  const py = plate(gp, 0.38, '#f6f4ee', 0, H, 0, '#2a7a3a');
  // fluffy orange-red rice mound
  lump(gp, '#d85a2a', -0.08, py + 0.005, -0.05, 0.22, 0.085, 0.19, { amp: 0.05, f: 3, seg: 30, flatBottom: true,
    paint: (px, py2, pz) => (fbm(px * 4, py2 * 4, pz * 4) > 0.6 ? '#cc4e24' : null) });
  for (let i = 0; i < 160; i++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * 0.2, hh = py + 0.005 + 0.085 * Math.sqrt(Math.max(0, 1 - (d / 0.215) ** 2));
    stick(gp, i % 3 === 0 ? '#f2925a' : i % 3 === 1 ? '#e06a34' : '#c84a20', -0.08 + Math.cos(a) * d * 1.05, hh - 0.003, -0.05 + Math.sin(a) * d * 0.9, 0.013, 0.005, 0.005, rnd() * TAU, rr(-0.4, 0.4));
  }
  for (let i = 0; i < 8; i++) { const a = rnd() * TAU, d = rr(0.03, 0.15); glossy(ellip(gp, i % 2 ? '#e8a020' : '#6aac3a', -0.08 + Math.cos(a) * d, py + 0.08 * (1 - (d / 0.2) ** 2) + 0.01, -0.05 + Math.sin(a) * d * 0.85, 0.009)); }
  leaf(gp, '#5a6a2a', -0.05, py + 0.095, -0.06, 0.05, 0.6, 0.3, 0.35);
  // grilled chicken leg
  const cg = new THREE.Group(); cg.position.set(0.18, py + 0.04, -0.08); cg.rotation.y = -0.6; gp.add(cg);
  glossy(lump(cg, '#9a4a1a', 0, 0, 0, 0.1, 0.045, 0.06, { amp: 0.12, f: 3, paint: (px, py2, pz) => (fbm(px * 4, py2 * 4, pz * 4) > 0.58 ? '#5a2a10' : py2 > 0.5 ? '#c4642a' : null) }));
  tube(cg, [[0.08, -0.005, 0], [0.15, 0, 0]], 0.012, 0.01, '#f2e8d4');
  ellip(cg, '#f6eedc', 0.155, 0, 0, 0.016, 0.014, 0.018);
  // fried plantain (dodo) slices
  for (let i = 0; i < 7; i++) {
    const a = 0.9 + i * 0.22, x = 0.02 + Math.cos(a) * 0.12, z = 0.04 + Math.sin(a) * 0.16;
    glossy(lump(gp, '#e8902a', x, py + 0.012 + i * 0.003, z, 0.036, 0.012, 0.024, { amp: 0.1, ry: -a + rr(-0.2, 0.2), s: i,
      paint: (px, py2) => (py2 > 0.4 ? (Math.abs(px) > 0.5 ? '#8a3e12' : '#c8641e') : '#f2b24a') }));
  }
  // side salad: lettuce, tomato, onion, cucumber
  for (let i = 0; i < 5; i++) leaf(gp, i % 2 ? '#7ab84a' : '#9ccc5a', -0.2 + rr(-0.04, 0.04), py + 0.008 + i * 0.003, 0.18 + rr(-0.03, 0.03), 0.06, rnd() * TAU, 0.15, 0.6);
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group(); g.position.set(-0.25 + i * 0.045, py + 0.02, 0.2 + rr(-0.02, 0.02)); g.rotation.set(rr(-0.3, 0.3), rnd() * TAU, 0); gp.add(g);
    glossy(plathe(g, [[0, 0], [0.026, 0], [0.026, 0.008], [0, 0.008]], '#d8241a', (px, _py, pz) => (Math.hypot(px, pz) < 0.016 ? (Math.floor((Math.atan2(pz, px) + 4) * 1.3) % 2 ? '#f0603a' : '#e8d080') : null), 0, 0, 0, 14));
  }
  for (let i = 0; i < 3; i++) ring(gp, '#f2e8f0', -0.15 + i * 0.03, py + 0.016, 0.24, 0.02, 0.12);
  for (let i = 0; i < 3; i++) plathe(gp, [[0, 0], [0.024, 0], [0.024, 0.006], [0, 0.006]], '#3f7a2a', (px, _py, pz) => (Math.hypot(px, pz) < 0.02 ? '#d8e8a8' : null), -0.3 + i * 0.03, py + 0.01 + i * 0.002, 0.11, 14);
  // pepper sauce
  const ir = bowl(gp, 0.06, 0.04, '#f6f4ee', 0.33, H, -0.3, (_px, py2) => (py2 > 0.034 ? '#2a7a3a' : null), 18, 0.6);
  glossy(pdisc(gp, ir(0.03), '#b8200f', (px, _y, pz) => (hash3(px * 300, 1, pz * 300) > 0.85 ? '#f0a01a' : null), 0.33, H + 0.03, -0.3, 2, 18));
  steam(gp, -0.1, py + 0.08, -0.06, 2, 1);
};

// ---- 18. Baklava (Gaziantep) ---------------------------------------------------------------------------

function baklavaTray(p: THREE.Object3D, R: number, y: number, h: number, dx: number, dz: number, cx = 0, cz = 0): void {
  const vb = new VB();
  const layers = ['#e8c47a', '#f2dca0', '#d8a850', '#f4e2b0', '#e0b464', '#c48c3a'];
  for (let i = -8; i <= 8; i++) for (let j = -8; j <= 8; j++) {
    const x = cx + (i + (j % 2 ? 0.5 : 0)) * dx, z = cz + j * dz * 0.5;
    if (Math.hypot(x - cx, z - cz) > R - Math.max(dx, dz) * 0.45) continue;
    const g = 0.004, hx = dx / 2 - g, hz = dz / 2 - g;
    const pts = (yy: number, k = 1): V3[] => [[x - hx * k, yy, z], [x, yy, z + hz * k], [x + hx * k, yy, z], [x, yy, z - hz * k]];
    const top = pts(y + h), ctr: V3 = [x, y + h / 2, z];
    vb.quadOut(top[0], top[1], top[2], top[3], [x, y, z], '#c8862a');
    const inner = pts(y + h + 0.002, 0.3);
    vb.quadOut(inner[0], inner[1], inner[2], inner[3], [x, y, z], '#5f9a2c');
    for (let k = 0; k < 4; k++) {
      const k2 = (k + 1) % 4;
      vb.quadOut(top[k], top[k2], inner[k2], inner[k], [x, y - 0.5, z], k % 2 ? '#b8762a' : '#d0902e');
      for (let l = 0; l < layers.length; l++) {
        const y0 = y + h * l / layers.length, y1 = y + h * (l + 1) / layers.length;
        const a = pts(y0), b = pts(y1);
        vb.quadOut(a[k], a[k2], b[k2], b[k], ctr, layers[l]);
      }
    }
  }
  const m = vb.mesh(p, true);
  if (m) m.material = mat('#ffffff', { vc: true, flat: true, metal: 0.35, rough: 0.3 });
}
const fd_baklava: Builder = (gp) => {
  srand(198);
  const H = table(gp, 'dark');
  const R = 0.36, tx = -0.04, tz = -0.04;
  // round copper tepsi
  glossy(plathe(gp, [[0, 0], [R, 0], [R + 0.01, 0.006], [R + 0.012, 0.05], [R + 0.004, 0.054], [R, 0.05], [R - 0.002, 0.008], [0, 0.008]], '#b8642e',
    (px, py, pz) => (py > 0.045 ? '#d8884a' : fbm(px * 8, py * 8, pz * 8) > 0.6 ? '#9a4e22' : null), tx, H, tz, 44));
  baklavaTray(gp, R, H + 0.008, 0.035, 0.1, 0.13, tx, tz);
  // a couple of pieces served on a small plate with a tulip glass of tea
  const sp = plate(gp, 0.1, '#f6f4ee', 0.3, H, 0.27, '#c8862a');
  baklavaTray(gp, 0.095, sp, 0.035, 0.1, 0.13, 0.3, 0.27);
  const gx = -0.32, gz = 0.28;
  plate(gp, 0.06, '#f3f1ea', gx, H, gz, '#c4202a');
  glossy(plathe(gp, [[0, 0], [0.022, 0], [0.02, 0.01], [0.03, 0.05], [0.022, 0.08], [0.03, 0.12], [0.026, 0.12], [0, 0.11]], '#a8241a',
    (_px, py) => (py > 0.1 ? '#e8d8c8' : null), gx, H + 0.01, gz, 18));
  for (let i = 0; i < 2; i++) rbox(gp, '#fbf8f0', gx + 0.07, H + 0.002, gz - 0.02 + i * 0.022, 0.016, 0.016, 0.016, 0.002, 0.3);
};

// ---- 19. Feijoada (Rio de Janeiro) ---------------------------------------------------------------------

function orangeSlice(p: THREE.Object3D, x: number, y: number, z: number, R: number, ry = 0, rx = 0): void {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.set(rx, ry, 0); p.add(g);
  glossy(plathe(g, [[0, 0], [R, 0], [R, 0.01], [0, 0.01]], '#f6a03a', (px, py, pz) => {
    const d = Math.hypot(px, pz), a = Math.atan2(pz, px);
    if (d > R * 0.92 || py < 0.004) return '#ee8a1a';
    if (d > R * 0.84) return '#fbeed8';
    return Math.abs(Math.sin(a * 5)) < 0.12 || d < R * 0.1 ? '#fbe0b0' : '#f8a83e';
  }, 0, 0, 0, 20));
}
const fd_feijoada: Builder = (gp) => {
  srand(209);
  const H = table(gp, 'teak');
  // black clay pot of bean stew
  const bx = -0.1, bz = -0.08, R = 0.24, BH = 0.16;
  const ir = bowl(gp, R, BH, '#2a2220', bx, H, bz, (px, py, pz) => (fbm(px * 20, py * 20, pz * 20) > 0.6 ? '#3a302c' : null), 36, 0.65);
  for (const sg of [-1, 1]) lump(gp, '#2a2220', bx + sg * (R + 0.01), H + BH - 0.03, bz, 0.035, 0.014, 0.028, { amp: 0.05 });
  const ly = H + BH - 0.03, LR = ir(BH - 0.03);
  gridDisc(gp, LR, ly, 22, (x, z) => (hash3(x * 200, 3, z * 200) > 0.55 ? '#2a1418' : fbm(x * 30, 0, z * 30) > 0.55 ? '#4a2620' : '#1e0e10'), { cx: bx, cz: bz, gloss: true, h: (x, z) => fbm(x * 30, 1, z * 30) * 0.01 });
  for (let i = 0; i < 30; i++) { const a = rnd() * TAU, d = rr(0.01, LR - 0.02); glossy(ellip(gp, i % 2 ? '#24101a' : '#3a1a20', bx + Math.cos(a) * d, ly + 0.008, bz + Math.sin(a) * d, 0.013, 0.008, 0.009, rnd() * TAU)); }
  for (let i = 0; i < 6; i++) {
    const a = rnd() * TAU, d = rr(0.03, LR - 0.05), x = bx + Math.cos(a) * d, z = bz + Math.sin(a) * d;
    const g = new THREE.Group(); g.position.set(x, ly + 0.008, z); g.rotation.set(rr(-0.4, 0.4), 0, rr(-0.4, 0.4)); gp.add(g);
    glossy(plathe(g, [[0, 0], [0.026, 0], [0.028, 0.006], [0.026, 0.012], [0, 0.012]], '#8a3a2a', (px, _py, pz) => (Math.hypot(px, pz) < 0.022 ? (hash3(px * 400, 1, pz * 400) > 0.7 ? '#e8b0a0' : '#c45a48') : null), 0, 0, 0, 14));
  }
  for (let i = 0; i < 4; i++) { const a = rnd() * TAU, d = rr(0.03, LR - 0.06); glossy(lump(gp, '#7a4a3a', bx + Math.cos(a) * d, ly + 0.012, bz + Math.sin(a) * d, 0.04, 0.018, 0.028, { amp: 0.2, s: i, ry: rnd() * TAU, paint: (px, py, pz) => (fbm(px * 4, py * 4, pz * 4) > 0.55 ? '#f0dcc8' : null) })); }
  leaf(gp, '#4a5a2a', bx + 0.04, ly + 0.02, bz - 0.05, 0.05, 0.7, 0.2, 0.35);
  // wooden ladle
  tube(gp, [[bx + 0.1, ly + 0.01, bz + 0.05], [bx + 0.22, H + BH + 0.05, bz + 0.12], [bx + 0.36, H + BH + 0.11, bz + 0.18]], 0.012, 0.01, '#a8784a', { radial: 6, sub: 3 });
  // white rice, couve, farofa, orange slices
  const rbz = 0.25, rbx = -0.24;
  const rir = bowl(gp, 0.11, 0.07, '#f6f4ee', rbx, H, rbz, undefined, 24, 0.55);
  lump(gp, '#fbf8f0', rbx, H + 0.06, rbz, rir(0.06), 0.035, rir(0.06), { amp: 0.15, f: 4, paint: (px, py, pz) => (hash3(px * 80, py * 80, pz * 80) > 0.7 ? '#ece6da' : null) });
  const cp = plate(gp, 0.1, '#f6f4ee', 0.02, H, 0.33);
  for (let i = 0; i < 26; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * 0.07; stick(gp, i % 3 ? '#2f6a26' : '#3f8a32', 0.02 + Math.cos(a) * d, cp + 0.004 + rr(0, 0.01), 0.33 + Math.sin(a) * d, 0.04, 0.004, 0.006, rnd() * TAU); }
  const fir = bowl(gp, 0.08, 0.05, '#a8784a', 0.27, H, 0.22, undefined, 22, 0.6);
  lump(gp, '#e8cc8a', 0.27, H + 0.044, 0.22, fir(0.044), 0.014, fir(0.044), { amp: 0.2, f: 5, paint: (px, py, pz) => (hash3(px * 200, py * 200, pz * 200) > 0.75 ? '#c8a060' : null) });
  const op = plate(gp, 0.11, '#f6f4ee', 0.28, H, -0.15);
  orangeSlice(gp, 0.25, op + 0.002, -0.17, 0.045);
  orangeSlice(gp, 0.31, op + 0.008, -0.13, 0.045, 0.5, 0.15);
  orangeSlice(gp, 0.27, op + 0.016, -0.1, 0.045, 1.0, -0.12);
  steam(gp, bx, ly, bz, 3, 1);
};

// ---- 20. Poutine (Quebec) ------------------------------------------------------------------------------

const fd_poutine: Builder = (gp) => {
  srand(220);
  const H = table(gp, 'wood');
  // red-and-white paper boat
  const bx = -0.02, bz = 0.0;
  const boat = plathe(gp, [[0, 0], [0.24, 0], [0.26, 0.01], [0.3, 0.09], [0.295, 0.095], [0.255, 0.012], [0, 0.012]], '#f4f0e6',
    (px, py, pz) => (py > 0.015 && Math.floor((Math.atan2(pz - bz, px - bx) + 4) * 5) % 2 ? '#c8202a' : null), bx, H, bz, 4);
  boat.rotation.y = Math.PI / 4; boat.scale.set(1.2, 1, 0.8);
  const fy = H + 0.012;
  for (let i = 0; i < 70; i++) {
    const x = bx + rr(-0.17, 0.17), z = bz + rr(-0.1, 0.1), e = 1 - Math.max(Math.abs(x - bx) / 0.2, Math.abs(z - bz) / 0.13);
    stick(gp, jit(i % 4 ? '#e8b452' : '#d29438', 0.08), x, fy + 0.005 + e * 0.07 + rr(0, 0.02), z, rr(0.09, 0.13), 0.022, 0.022, rr(-0.6, 0.6) + (i % 3 ? 0 : 1.2), rr(-0.3, 0.3));
  }
  // gravy blanket and drips
  glossy(lump(gp, '#6a3a1a', bx, fy + 0.075, bz, 0.12, 0.03, 0.075, { amp: 0.35, f: 3.5, seg: 22, paint: (px, py, pz) => (fbm(px * 4, py * 4, pz * 4) > 0.58 ? '#8a5228' : py < 0 ? '#4a2810' : null) }));
  for (let i = 0; i < 8; i++) {
    const a = rnd() * TAU, d = rr(0.06, 0.12);
    glossy(lump(gp, '#5e3216', bx + Math.cos(a) * d * 1.3, fy + 0.06 + rr(0, 0.02), bz + Math.sin(a) * d * 0.8, 0.04, 0.01, 0.025, { amp: 0.25, s: i, ry: rnd() * TAU, seg: 10 }));
  }
  // squeaky cheese curds
  for (let i = 0; i < 16; i++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * 0.17;
    lump(gp, '#f6eed6', bx + Math.cos(a) * d * 1.2, fy + 0.085 * (1 - d / 0.2) + 0.03, bz + Math.sin(a) * d * 0.75, 0.028, 0.022, 0.024, { amp: 0.35, f: 2.5, s: i * 1.3, seg: 9,
      paint: (px, py, pz) => (fbm(px * 3 + i, py * 3, pz * 3) > 0.6 ? '#e8dcb4' : null) });
  }
  // fork + maple-leaf flag
  const fk = new THREE.Group(); fk.position.set(0.3, H + 0.004, 0.27); fk.rotation.y = 0.6; gp.add(fk);
  glossy(rbox(fk, '#c9ced4', 0, 0, 0, 0.16, 0.005, 0.016, 0.002));
  for (let k = 0; k < 4; k++) glossy(stick(fk, '#c9ced4', 0.1, 0, -0.009 + k * 0.006, 0.05, 0.004, 0.003));
  rod(gp, [bx + 0.05, fy + 0.04, bz], [bx + 0.05, fy + 0.25, bz], 0.004, '#e8d8b0', 6);
  const fl = new THREE.Group(); fl.position.set(bx + 0.05, fy + 0.21, bz); gp.add(fl);
  stick(fl, '#c8202a', 0.012, 0, 0, 0.02, 0.05, 0.004);
  stick(fl, '#f6f2ea', 0.042, 0, 0, 0.04, 0.05, 0.0045);
  stick(fl, '#c8202a', 0.072, 0, 0, 0.02, 0.05, 0.004);
  ellip(fl, '#c8202a', 0.042, 0.025, 0.003, 0.009, 0.012, 0.002);
};

// ---- 21. Hamburger (USA) -------------------------------------------------------------------------------

const fd_hamburger: Builder = (gp) => {
  srand(231);
  const H = table(gp, 'cloth', ['#c8202a', '#f6f1e6']);
  // wooden board
  rbox(gp, '#b8824a', -0.02, H, -0.02, 0.62, 0.03, 0.5, 0.012, 0.2);
  const by = H + 0.03, cx = -0.06, cz = -0.04, R = 0.16;
  // bottom bun
  plathe(gp, [[0, 0], [R * 0.9, 0], [R, 0.015], [R * 1.01, 0.035], [R * 0.95, 0.045], [0, 0.046]], '#d8963a', (_px, py) => (py > 0.04 ? '#f2dcae' : null), cx, by, cz, 32);
  let y = by + 0.045;
  // frilly lettuce
  const N = 40, lr: V3[][] = [];
  for (const [r, dy, w] of [[R * 0.6, 0, 0], [R * 1.22, -0.004, 1], [R * 0.6, 0.008, 0]] as [number, number, number][]) {
    lr.push(Array.from({ length: N }, (_, j) => { const a = j / N * TAU; return [cx + Math.cos(a) * r * (1 + w * 0.05 * Math.sin(a * 11)), y + dy + w * 0.014 * Math.sin(a * 7), cz + Math.sin(a) * r * (1 + w * 0.05 * Math.sin(a * 11))] as V3; }));
  }
  glossy(skin(gp, lr, '#6ab83a', { closed: true, paint: (px, _py, pz) => (Math.hypot(px - cx, pz - cz) > R * 1.05 ? '#8ccc4a' : null) }));
  y += 0.008;
  // beef patty
  lump(gp, '#5a3220', cx, y + 0.03, cz, R * 1.05, 0.03, R * 1.05, { amp: 0.1, f: 4, seg: 22,
    paint: (px, py, pz) => (fbm(px * 6, py * 6, pz * 6) > 0.58 ? '#3a1e12' : py > 0.7 && Math.sin(px * 30) > 0.85 ? '#2a140a' : hash3(px * 40, py * 40, pz * 40) > 0.8 ? '#7a4a2e' : null) });
  y += 0.055;
  // melting cheese slice (square, corners drooping)
  const cvb = new VB(), S = R * 0.92, n = 8;
  const ch = (u: number, v: number): V3 => { const r = Math.hypot(u, v); return [cx + u, y + 0.004 - Math.max(0, r - R * 0.9) * 0.55, cz + v]; };
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const u0 = -S + 2 * S * i / n, u1 = -S + 2 * S * (i + 1) / n, v0 = -S + 2 * S * j / n, v1 = -S + 2 * S * (j + 1) / n;
    cvb.quadOut(ch(u0, v0), ch(u0, v1), ch(u1, v1), ch(u1, v0), [cx, y - 0.5, cz], '#f6b81a');
    cvb.quadOut(ch(u0, v0), ch(u0, v1), ch(u1, v1), ch(u1, v0), [cx, y + 0.5, cz], '#e8a010');
  }
  const cm = cvb.mesh(gp, true, true);
  if (cm) cm.rotation.y = 0;
  y += 0.006;
  // tomato slices + onion ring + pickles
  for (let i = 0; i < 3; i++) {
    const a = i * TAU / 3 + 0.3, x = cx + Math.cos(a) * 0.07, z = cz + Math.sin(a) * 0.07;
    glossy(plathe(gp, [[0, 0], [0.065, 0], [0.065, 0.012], [0, 0.012]], '#d8241a', (px, _py, pz) => {
      const d = Math.hypot(px - x, pz - z), an = Math.atan2(pz - z, px - x);
      return d > 0.056 ? null : d < 0.02 ? '#f0603a' : Math.abs(Math.sin(an * 2.5)) < 0.25 ? '#e8402a' : '#f8a080';
    }, x, y, z, 18));
  }
  ring(gp, '#f2e8f0', cx + 0.02, y + 0.014, cz, 0.08, 0.1);
  for (let i = 0; i < 3; i++) plathe(gp, [[0, 0], [0.03, 0], [0.03, 0.006], [0, 0.006]], '#6a8a2a', (px, _py, pz) => (Math.hypot(px - cx, pz - cz) > 0 && hash3(px * 300, 1, pz * 300) > 0.7 ? '#c8d890' : null), cx - 0.05 + i * 0.05, y + 0.016, cz + 0.05 - i * 0.04, 12);
  y += 0.02;
  // sesame top bun
  const top = plathe(gp, [[R * 1.0, 0], [R * 1.04, 0.02], [R * 0.95, 0.07], [R * 0.7, 0.11], [R * 0.35, 0.13], [0, 0.135], [0, 0]], '#d8902e',
    (_px, py) => (py < 0.004 ? '#f2dcae' : py > 0.09 ? '#c47a24' : null), cx, y, cz, 36);
  smooth(top);
  for (let i = 0; i < 34; i++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * R * 0.85, hh = 0.135 * (1 - Math.pow(d / (R * 1.04), 2.2));
    ellip(gp, '#f6eedc', cx + Math.cos(a) * d, y + hh + 0.001, cz + Math.sin(a) * d, 0.007, 0.0035, 0.004, rnd() * TAU, 0, 0.3);
  }
  // cocktail stick with a little flag
  rod(gp, [cx, y + 0.1, cz], [cx, y + 0.24, cz], 0.004, '#e8d8b0', 6);
  stick(gp, '#2a4aa8', cx + 0.03, y + 0.2, cz, 0.06, 0.035, 0.004);
  // fries in a red cup + ketchup
  const fx = 0.24, fz = -0.2;
  plathe(gp, [[0, 0], [0.07, 0], [0.09, 0.15], [0.085, 0.152], [0.065, 0.004], [0, 0.004]], '#c8202a', (_px, py) => (py > 0.06 && py < 0.09 ? '#f6c81a' : null), fx, by, fz, 18);
  for (let i = 0; i < 18; i++) {
    const a = rnd() * TAU, d = rr(0, 0.06), x = fx + Math.cos(a) * d, z = fz + Math.sin(a) * d;
    const g = stick(gp, jit('#ecbd5a', 0.08), x, by + 0.08, z, 0.02, rr(0.13, 0.2), 0.02, rnd() * TAU);
    g.rotation.x = Math.sin(a) * 0.3; g.rotation.z = -Math.cos(a) * 0.3;
  }
  const kx = 0.26, kz = 0.17;
  const kir = bowl(gp, 0.05, 0.03, '#f6f4ee', kx, by, kz, undefined, 18, 0.6);
  glossy(pdisc(gp, kir(0.024), '#c41a12', undefined, kx, by + 0.024, kz, 2, 18));
};

// ---- 22. Belgian waffle (Liège / Brussels) -------------------------------------------------------------

function waffle(p: THREE.Object3D, x: number, y: number, z: number, ry: number, W: number, D: number, nx: number, nz: number, h: number): void {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g);
  const vb = new VB(), sub = 4, NX = nx * sub, NZ = nz * sub;
  const ht = (i: number, j: number) => {
    const ci = i % sub, cj = j % sub, edge = i === 0 || j === 0 || i === NX || j === NZ;
    return edge || ci === 0 || cj === 0 ? h : h * 0.25;
  };
  const P = (i: number, j: number): V3 => [-W / 2 + W * i / NX, ht(i, j), -D / 2 + D * j / NZ];
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
    const a = P(i, j), b = P(i, j + 1), c = P(i + 1, j + 1), d = P(i + 1, j);
    const ridge = Math.max(a[1], b[1], c[1], d[1]) > h * 0.9;
    const xx = a[0], zz = a[2], n = fbm(xx * 20, 0, zz * 20);
    let col = ridge ? (n > 0.55 ? '#e0a448' : '#ecb85a') : n > 0.6 ? '#a8641a' : '#bc7826';
    if (ridge && hash3(xx * 300, 1, zz * 300) > 0.5 && Math.hypot(xx, zz) < W * 0.4) col = '#fbf8f2';
    vb.quadOut(a, b, c, d, [a[0], -1, a[2]], col);
  }
  const ctr: V3 = [0, h / 2, 0];
  const side = (a: V3, b: V3) => vb.quadOut([a[0], 0, a[2]], [b[0], 0, b[2]], b, a, ctr, '#c47a24');
  for (let i = 0; i < NX; i++) { side(P(i, 0), P(i + 1, 0)); side(P(i, NZ), P(i + 1, NZ)); }
  for (let j = 0; j < NZ; j++) { side(P(0, j), P(0, j + 1)); side(P(NX, j), P(NX, j + 1)); }
  vb.quadOut([-W / 2, 0, -D / 2], [W / 2, 0, -D / 2], [W / 2, 0, D / 2], [-W / 2, 0, D / 2], [0, 1, 0], '#b8701e');
  vb.mesh(g);
}
function strawberryHalf(p: THREE.Object3D, x: number, y: number, z: number, ry: number, s = 1): void {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.set(0, ry, 0); g.scale.setScalar(s); p.add(g);
  glossy(lump(g, '#d8202a', 0, 0.012, 0, 0.026, 0.018, 0.034, { amp: 0.05, rx: 0, paint: (px, py, pz) => {
    if (py > 0.55) return Math.abs(px) < 0.45 && pz < 0.6 ? (Math.abs(px) < 0.15 ? '#fbe0d8' : '#f05a5a') : '#e8404a';
    return hash3(px * 9, py * 9, pz * 9) > 0.85 ? '#f6d860' : pz < -0.85 ? '#3a8a2a' : null;
  } }));
}
const fd_waffle: Builder = (gp) => {
  srand(242);
  const H = table(gp, 'marble');
  const py = plate(gp, 0.37, '#fbfaf6', 0, H, 0.0, '#2a3a6a');
  waffle(gp, -0.04, py, -0.02, 0.25, 0.46, 0.34, 5, 4, 0.06);
  // whipped cream rosette, strawberries, chocolate drizzle, powdered sugar dusting
  const cx = 0.03, cz = 0.0, cy = py + 0.06;
  plathe(gp, [[0.085, 0], [0.09, 0.016], [0.07, 0.05], [0.042, 0.085], [0.016, 0.11], [0, 0.12], [0, 0]], '#fbf8f0',
    (px, py2, pz) => (Math.sin(Math.atan2(pz - cz, px - cx) * 8 + py2 * 60) > 0.6 ? '#ece6da' : null), cx, cy, cz, 32);
  strawberryHalf(gp, -0.08, cy, 0.04, 0.4, 1.2);
  strawberryHalf(gp, -0.12, cy, -0.06, 2.0, 1.2);
  strawberryHalf(gp, 0.1, cy, 0.08, -0.8, 1.2);
  strawberryHalf(gp, 0.25, py, 0.18, 1.2, 1.3);
  glossy(tube(gp, [[-0.2, cy + 0.006, -0.06], [-0.1, cy + 0.008, 0.1], [0.0, cy + 0.008, -0.12], [0.1, cy + 0.008, 0.06], [0.16, cy + 0.006, -0.1]], 0.006, 0.006, '#3a1e12', { radial: 6, sub: 5 }));
  ellip(gp, '#3a2a8a', -0.2, cy + 0.01, 0.06, 0.016);
  ellip(gp, '#3a2a8a', 0.16, cy + 0.01, -0.03, 0.016);
  leaf(gp, '#3f9a3a', 0.04, cy + 0.12, 0.0, 0.03, 0.4, 0.2, 0.5);
  // sugar shaker
  plathe(gp, [[0, 0], [0.04, 0], [0.042, 0.1], [0.036, 0.12], [0.02, 0.14], [0, 0.145]], '#d8dce2', (_px, py2) => (py2 < 0.1 ? '#f2f2f2' : null), -0.32, H, -0.28, 18);
  cup(gp, 0.32, H, -0.28, '#fbfaf6', '#5a3418', 0.5, 0.06, 0.06);
};

// ---- 23. Pavlova (Wellington) --------------------------------------------------------------------------

function kiwiSlice(p: THREE.Object3D, x: number, y: number, z: number, r: number, rx = 0, ry = 0): void {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.set(rx, ry, 0); p.add(g);
  glossy(plathe(g, [[0, 0], [r, 0], [r, 0.008], [0, 0.008]], '#5aa02a', (px, py, pz) => {
    const d = Math.hypot(px, pz) / r, a = Math.atan2(pz, px);
    if (d > 0.93 || py < 0.004) return '#7a5a2a';
    if (d < 0.25) return '#f2f2c8';
    if (d < 0.42 && Math.floor((a + 4) * 3.5) % 2) return '#1a1a10';
    return d < 0.5 ? '#b8d860' : null;
  }, 0, 0, 0, 18));
}
const fd_pavlova: Builder = (gp) => {
  srand(253);
  const H = table(gp, 'wood');
  const py = plate(gp, 0.38, '#f6f8fa', 0, H, 0, '#8ab8d8');
  // crisp meringue shell with ridged sides
  const R = 0.27, MH = 0.11, K = 6, N = 48, rings: V3[][] = [];
  for (let i = 0; i <= K; i++) {
    const t = i / K, rad = R * (0.9 + 0.1 * Math.sin(t * Math.PI * 0.8)) * (t === K ? 0.93 : 1), yy = py + MH * t;
    rings.push(Array.from({ length: N }, (_, j) => { const a = j / N * TAU, rd = rad * (1 + 0.04 * Math.cos(a * 16) * Math.sin(t * Math.PI)); return [Math.cos(a) * rd, yy, Math.sin(a) * rd] as V3; }));
  }
  skin(gp, rings, '#fbf3e4', { caps: true, paint: (px, py2, pz) => {
    const n = fbm(px * 12, py2 * 12, pz * 12);
    if (py2 < py + 0.012) return '#e8d4b0';
    return n > 0.62 ? '#f2e2c4' : '#fbf6ea';
  } });
  // pillowy cream top
  const ty = py + MH;
  lump(gp, '#fffdf8', 0, ty, 0, R * 0.86, 0.045, R * 0.86, { amp: 0.25, f: 3, seg: 24, flatBottom: true, paint: (px, py2, pz) => (fbm(px * 4, py2 * 4, pz * 4) > 0.6 ? '#f2ece0' : null) });
  // fruit: strawberries, kiwi, blueberries, passionfruit, mint
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + 0.2, d = 0.16; strawberryHalf(gp, Math.cos(a) * d, ty + 0.02, Math.sin(a) * d, -a, 1.25); }
  for (let i = 0; i < 5; i++) { const a = i * TAU / 5 + 0.7, d = 0.09; kiwiSlice(gp, Math.cos(a) * d, ty + 0.035, Math.sin(a) * d, 0.042, rr(-0.3, 0.3), rnd() * TAU); }
  for (let i = 0; i < 12; i++) { const a = rnd() * TAU, d = rr(0.05, 0.2); glossy(ellip(gp, '#2a2a6a', Math.cos(a) * d, ty + 0.04, Math.sin(a) * d, 0.014)); }
  glossy(lump(gp, '#f0b81a', 0.01, ty + 0.05, -0.01, 0.06, 0.008, 0.05, { amp: 0.3, paint: (px, py2, pz) => (hash3(px * 30, py2 * 30, pz * 30) > 0.8 ? '#1a1410' : null) }));
  for (let i = 0; i < 3; i++) leaf(gp, '#3f9a3a', rr(-0.03, 0.04), ty + 0.07, rr(-0.03, 0.03), 0.03, rnd() * TAU, 0.3, 0.55);
  // half passionfruit on the side
  const hx = 0.3, hz = 0.24;
  plathe(gp, [[0, 0], [0.04, 0.012], [0.05, 0.04], [0.046, 0.046], [0, 0.046]], '#5a2a4a', (px, py2, pz) => (py2 > 0.044 ? (hash3(px * 200, 1, pz * 200) > 0.75 ? '#1a1410' : Math.hypot(px - hx, pz - hz) < 0.04 ? '#f2b81a' : '#f2e8c0') : null), hx, py, hz, 18);
  for (let i = 0; i < 4; i++) glossy(ellip(gp, '#2a2a6a', -0.3 + i * 0.025, py + 0.012, 0.22 + (i % 2) * 0.02, 0.013));
};

// ---- 24. Injera with wats (Addis Ababa) ----------------------------------------------------------------

const fd_injera: Builder = (gp) => {
  srand(264);
  const H = table(gp, 'teak');
  // woven mesob-style tray rim
  plathe(gp, [[0, 0], [0.43, 0], [0.45, 0.02], [0.45, 0.045], [0.43, 0.05], [0.42, 0.012], [0, 0.012]], '#c8a060',
    (px, py, pz) => (py > 0.015 ? (Math.floor((Math.atan2(pz, px) + 4) * 10 + py * 200) % 3 === 0 ? '#c8202a' : Math.floor((Math.atan2(pz, px) + 4) * 10) % 3 === 1 ? '#2a7a3a' : '#e8c890') : null), 0, H, 0, 44);
  const iy = H + 0.012;
  // spongy injera with its "eyes"
  gridDisc(gp, 0.41, iy + 0.004, 44, (x, z) => {
    const h = hash3(Math.floor(x * 160), 2, Math.floor(z * 160));
    return h > 0.86 ? '#a8987a' : h > 0.74 ? '#bcab88' : fbm(x * 9, 1, z * 9) > 0.58 ? '#d0be98' : '#c8b48e';
  }, { h: (x, z) => fbm(x * 8, 2, z * 8) * 0.008 + Math.max(0, Math.hypot(x, z) - 0.36) * 0.25 });
  const wat = (x: number, z: number, r: number, c: string, kind: 'wat' | 'greens' | 'cheese' | 'veg') => {
    if (kind === 'greens') {
      for (let i = 0; i < 18; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * r; stick(gp, i % 2 ? '#2f5a20' : '#3f7a2a', x + Math.cos(a) * d, iy + 0.008 + rr(0, 0.015), z + Math.sin(a) * d, 0.04, 0.005, 0.01, rnd() * TAU); }
      return;
    }
    if (kind === 'cheese') { for (let i = 0; i < 8; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * r; lump(gp, '#fbf8ee', x + Math.cos(a) * d, iy + 0.016, z + Math.sin(a) * d, 0.022, 0.014, 0.02, { seg: 8, amp: 0.3, s: i }); } return; }
    if (kind === 'veg') {
      for (let i = 0; i < 14; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * r; stick(gp, i % 3 ? '#f2d060' : '#ee8a2a', x + Math.cos(a) * d, iy + 0.008 + rr(0, 0.012), z + Math.sin(a) * d, 0.03, 0.01, 0.012, rnd() * TAU); }
      return;
    }
    glossy(lump(gp, c, x, iy + 0.01, z, r, 0.022, r, { amp: 0.2, f: 3, s: x * 9, flatBottom: true, paint: (px, py, pz) => (fbm(px * 4, py * 4, pz * 4) > 0.6 ? shade(c, 0.75) : py > 0.5 && hash3(px * 9, py * 9, pz * 9) > 0.8 ? shade(c, 1.25) : null) }));
  };
  // doro wat in the centre with a boiled egg
  wat(0, 0, 0.1, '#7a2414', 'wat');
  glossy(lump(gp, '#5a1a10', 0.03, iy + 0.035, -0.01, 0.045, 0.035, 0.04, { amp: 0.12 }));
  ellip(gp, '#fbf8f0', -0.035, iy + 0.035, 0.02, 0.03, 0.022, 0.024, 0.3);
  ellip(gp, '#f2c42a', -0.035, iy + 0.05, 0.02, 0.013, 0.006, 0.012);
  const ringW: [string, 'wat' | 'greens' | 'cheese' | 'veg'][] = [['#d8501e', 'wat'], ['', 'greens'], ['#e8a030', 'wat'], ['', 'cheese'], ['#b8401a', 'wat'], ['', 'veg'], ['#8a6a2a', 'wat']];
  ringW.forEach(([c, k], i) => { const a = i * TAU / ringW.length + 0.3; wat(Math.cos(a) * 0.25, Math.sin(a) * 0.25, 0.07, c, k); });
  // rolled injera on the side
  for (let i = 0; i < 3; i++) {
    const z = 0.36 + i * 0.045, x0 = -0.32 + i * 0.02;
    sweep(gp, [{ p: [x0, H + 0.03, z], w: 0.022 }, { p: [x0 + 0.15, H + 0.03, z - 0.04], w: 0.024 }, { p: [x0 + 0.3, H + 0.03, z - 0.08], w: 0.022 }], '#c8b48c',
      { radial: 10, sub: 4, caps: true, paint: (px, py, pz) => (hash3(Math.floor(px * 160), Math.floor(py * 160), Math.floor(pz * 160)) > 0.78 ? '#9a8a6a' : null) }).rotation.y = 0;
  }
  // clay jebena coffee pot
  const jx = 0.36, jz = -0.3;
  plathe(gp, [[0, 0], [0.03, 0], [0.055, 0.03], [0.06, 0.06], [0.045, 0.09], [0.018, 0.11], [0.016, 0.18], [0.024, 0.2], [0, 0.2]], '#2a2220', (px, py, pz) => (py > 0.05 && py < 0.06 ? '#c8a060' : fbm(px * 20, py * 20, pz * 20) > 0.62 ? '#3a302c' : null), jx, H, jz, 18);
  tube(gp, [[jx - 0.016, H + 0.17, jz], [jx - 0.06, H + 0.15, jz], [jx - 0.06, H + 0.08, jz], [jx - 0.045, H + 0.06, jz]], 0.007, 0.007, '#2a2220', { radial: 6, sub: 3 });
};

// ---- 25. Borscht (Kyiv) --------------------------------------------------------------------------------

const fd_borscht: Builder = (gp) => {
  srand(275);
  const H = table(gp, 'wood');
  // embroidered rushnyk cloth
  const cl = gridDisc(gp, 0.5, H + 0.002, 20, (x, z) => {
    if (Math.abs(z) > 0.22) return '#f6f2ea';
    const e = Math.abs(Math.abs(z) - 0.18);
    if (e < 0.03) return (Math.floor(x * 40) + Math.floor(z * 40)) % 2 ? '#c41a1a' : '#1a1a1a';
    return '#f8f5ee';
  }, { h: () => 0, sz: 1 });
  if (cl) cl.scale.set(1, 1, 1);
  const bx = -0.05, bz = -0.03, R = 0.3;
  // deep soup plate
  plathe(gp, [[0, 0], [R * 0.45, 0], [R * 0.48, 0.008], [R * 0.75, 0.05], [R, 0.07], [R * 1.02, 0.078], [R * 0.98, 0.08], [R * 0.75, 0.064], [R * 0.6, 0.03], [0, 0.022]], '#fbfaf6',
    undefined, bx, H + 0.004, bz, 40);
  ring(gp, '#2a4aa8', bx, H + 0.083, bz, R * 0.995, 0.014);
  const ly = H + 0.054, LR = R * 0.68;
  glossy(pdisc(gp, LR, '#9a1428', (x, _y, z) => {
    const f = fbm(x * 14, 0, z * 14);
    return f > 0.62 ? '#c42a3a' : f < 0.36 ? '#7a0e20' : hash3(x * 200, 1, z * 200) > 0.93 ? '#e86a3a' : null;
  }, bx, ly, bz, 8, 40));
  for (let i = 0; i < 26; i++) { const a = rnd() * TAU, d = rr(0.03, LR - 0.03); stick(gp, i % 4 ? '#8a1020' : '#e88a3a', bx + Math.cos(a) * d, ly - 0.002, bz + Math.sin(a) * d, 0.035, 0.005, 0.006, rnd() * TAU); }
  // sour cream dollop and dill
  lump(gp, '#fdfbf6', bx + 0.02, ly, bz, 0.07, 0.03, 0.065, { amp: 0.25, f: 2.5, paint: (px, py, pz) => (fbm(px * 4, py * 4, pz * 4) > 0.62 ? '#f0ece0' : null) });
  for (let i = 0; i < 16; i++) {
    const a = rnd() * TAU, d = rr(0.0, 0.1), x = bx + 0.02 + Math.cos(a) * d, z = bz + Math.sin(a) * d, b = rnd() * TAU;
    tube(gp, [[x, ly + 0.03 - d * 0.2, z], [x + Math.cos(b) * 0.025, ly + 0.034 - d * 0.2, z + Math.sin(b) * 0.025]], 0.0025, 0.002, i % 2 ? '#3f8a2a' : '#5aa83a', { radial: 4, sub: 2 });
  }
  // dark rye bread + garlic pampushky
  const bp = plate(gp, 0.12, '#fbfaf6', 0.3, H + 0.002, 0.27);
  for (let i = 0; i < 2; i++) {
    const g = new THREE.Group(); g.position.set(0.28 + i * 0.04, bp + 0.004 + i * 0.012, 0.27 - i * 0.02); g.rotation.set(0, 0.4 + i * 0.3, i * 0.06); gp.add(g);
    rbox(g, '#3a2418', 0, 0, 0, 0.13, 0.014, 0.09, 0.008);
    rbox(g, '#5a3a26', 0, 0.002, 0, 0.12, 0.013, 0.08, 0.004);
  }
  for (let i = 0; i < 4; i++) {
    const a = i * TAU / 4, x = 0.3 + Math.cos(a) * 0.05, z = -0.22 + Math.sin(a) * 0.05;
    glossy(lump(gp, '#d88a2a', x, H + 0.04, z, 0.042, 0.036, 0.042, { amp: 0.06, paint: (px, py, pz) => (py > 0.4 && hash3(px * 40, py * 40, pz * 40) > 0.7 ? '#3f8a2a' : py < -0.3 ? '#f2d08a' : null) }));
  }
  // spoon
  const sp = new THREE.Group(); sp.position.set(-0.36, H + 0.006, 0.2); sp.rotation.y = 1.1; gp.add(sp);
  glossy(ellip(sp, '#c9ced4', 0, 0.006, 0, 0.026, 0.006, 0.036));
  glossy(rbox(sp, '#c9ced4', 0, 0, 0.12, 0.014, 0.005, 0.18, 0.002));
  steam(gp, bx, ly, bz - 0.06, 3, 1);
};

export const H_FOODS: Record<string, Builder> = {
  fd_pizza, fd_sushi, fd_pekingduck, fd_xiaolongbao, fd_hotpot, fd_lanzhou, fd_dimsum,
  fd_tacos, fd_croissant, fd_paella, fd_dosa, fd_padthai, fd_pho,
  fd_bibimbap, fd_fishchips, fd_tagine, fd_jollof, fd_baklava, fd_feijoada,
  fd_poutine, fd_hamburger, fd_waffle, fd_pavlova, fd_injera, fd_borscht,
};
