import * as THREE from 'three';
import {
  type Builder, type Paint, type V3, num, mat, add, sweep as sweep0, slab, paintFaces, strut, g,
  shade, mix, fbm, worley, hash3, vnoise,
} from './prims.ts';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Organic animal miniatures sculpted like premium collectible figurines: lofted torsos with shoulder & haunch
// masses, jointed tapering limbs (elbow/knee/hock), paws/hooves/pads, species heads with glossy eyes, painted coat
// patterns (stripes, rosettes, patches, countershading) and slightly asymmetric poses. Front +z, feet on y=0.

/** Painted smooth ellipsoid whose geometry lives in model space (so coat patterns line up across parts). */
export function pblob(p: THREE.Object3D, c: string, x: number, y: number, z: number, rx: number, ry: number, rz: number,
  paint?: Paint, rot: V3 = [0, 0, 0], seg = 22, flat = false): THREE.Mesh {
  // "flat" requests (fur, foliage) render smooth but denser so per-face colour noise reads as texture
  const sg = flat ? Math.round(seg * 1.6) : seg;
  const geo = new THREE.SphereGeometry(1, sg, Math.round(sg * 0.7));
  geo.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2])), new THREE.Vector3(rx, ry, rz)));
  return add(p, paintFaces(geo, c, paint), mat('#ffffff', { flat: false, vc: true }), 0, 0, 0, 1, 1, 1);
}

/** Ellipsoid on a lighter cached sphere than prims.ellip — animals use hundreds of these (eyes, toes, claws). */
const ESEG = [[8, 6], [12, 8], [16, 11]];
const ellip = (p: THREE.Object3D, c: string, x: number, y: number, z: number, rx: number, ry = rx, rz = rx, roty = 0, rotx = 0, rotz = 0) => {
  const r = Math.max(rx, ry, rz), [a, b] = ESEG[r < 0.014 ? 0 : r < 0.035 ? 1 : 2];
  return add(p, g('an-esph' + a, () => new THREE.SphereGeometry(1, a, b)), mat(c, { flat: false }), x, y, z, rx, ry, rz, roty, rotx, rotz);
};

/** prims.sweep, always smooth-shaded: faceted normals + per-face paint read as a pixel checker on organic forms. */
function sweep(p: THREE.Object3D, st: Parameters<typeof sweep0>[1], c: string, o: Parameters<typeof sweep0>[3] = {}): THREE.Mesh {
  return sweep0(p, st, c, { ...o, flat: false });
}

/**
 * One continuous sculpted surface: an ellipsoid whose radius is pushed in/out by gaussian bumps around unit
 * directions [dir, amount, width] — domed skulls with brow bulges and temple hollows instead of stacked spheres.
 */
function sculpt(p: THREE.Object3D, c: string, ctr: V3, rad: V3, bumps: [V3, number, number][], paint?: Paint, seg = 30): THREE.Mesh {
  let geo: THREE.BufferGeometry = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75));
  geo.deleteAttribute('normal'); geo.deleteAttribute('uv');
  geo = mergeVertices(geo);
  const B = bumps.map(([d, a, w]) => { const l = Math.hypot(...d); return [d[0] / l, d[1] / l, d[2] / l, a, w] as const; });
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    let k = 1;
    for (const [bx, by, bz, a, w] of B) k += a * Math.exp(-(1 - (x * bx + y * by + z * bz)) / w);
    pos.setXYZ(i, ctr[0] + x * rad[0] * k, ctr[1] + y * rad[1] * k, ctr[2] + z * rad[2] * k);
  }
  geo.computeVertexNormals();
  return add(p, paintFaces(geo, c, paint), mat('#ffffff', { flat: false, vc: true }), 0, 0, 0, 1, 1, 1);
}

/** Tube with ball ends (prims.tube twin, but its end caps use the lighter local ellipsoid). */
function tube(p: THREE.Object3D, pts: V3[], r0: number, r1: number, c: string, o: Parameters<typeof sweep>[3] = {}): THREE.Mesh {
  const m = sweep(p, pts.map((pt, i) => ({ p: pt, w: r0 + (r1 - r0) * (i / Math.max(1, pts.length - 1)) })), c, { radial: 10, sub: 5, ...o });
  ellip(p, c, ...pts[0], r0 * 0.98);
  ellip(p, c, ...pts[pts.length - 1], r1 * 0.98);
  return m;
}

// ---- Fast sRGB colour math for per-face painters (avoids THREE.Color churn across 10k+ faces) ----
const RGB = new Map<string, number[]>();
function rgb(h: string): number[] {
  let v = RGB.get(h);
  if (!v) {
    let s = h.slice(1);
    if (s.length === 3) s = s.split('').map(ch => ch + ch).join('');
    const n = parseInt(s, 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    RGB.set(h, v);
  }
  return v;
}
const c8 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const hx = (r: number, gg: number, b: number) => '#' + ((1 << 24) | (c8(r) << 16) | (c8(gg) << 8) | c8(b)).toString(16).slice(1);
function mx(a: string, b: string, t: number): string {
  t = Math.round(t * 12) / 12; // quantised so paintFaces' colour cache stays small
  const A = rgb(a), B = rgb(b);
  return hx(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
function sh(a: string, f: number): string { const A = rgb(a); return hx(A[0] * f, A[1] * f, A[2] * f); }
const sst = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const speck = (c: string, x: number, y: number, z: number, n: number) =>
  (n ? sh(c, 1 + Math.round((vnoise(x * 34, y * 34, z * 34) - 0.5) * 8) / 4 * n * 1.1) : c);

/** Countershaded coat: belly gradient below, slightly darker dorsal line above, fine fur speckle. */
function coat(c: string, belly: string, o: { dorsal?: number; n?: number; hi?: number; lo?: number } = {}): Paint {
  const dk = sh(c, o.dorsal ?? 0.85), n = o.n ?? 0.05, hi = o.hi ?? -0.1, lo = o.lo ?? -0.72;
  return (x, y, z, _nx, ny) => {
    const t = sst(hi, lo, ny);
    const base = t > 0 ? mx(c, belly, t) : ny > 0.45 ? mx(c, dk, sst(0.45, 0.95, ny)) : c;
    return speck(base, x, y, z, n);
  };
}
const furNoise = (c: string, amt = 0.08): Paint => (x, y, z) => speck(c, x, y, z, amt);

// ---- Small sculpting helpers ----
const DROP = () => g('an-drop', () => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 7; i++) { const t = i / 7; pts.push(new THREE.Vector2(Math.max(1e-4, 0.5 * Math.sin(Math.PI * Math.pow(t, 0.62))), t)); }
  const lg = new THREE.LatheGeometry(pts, 7);
  lg.computeVertexNormals();
  return lg;
});
const _Y = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3();
/** Teardrop "lock" from base a to pointed tip b — mane locks, fur tufts, claws, horns, teeth, feathers. */
function drop(p: THREE.Object3D, c: string, a: V3, b: V3, r: number, rz = r): THREE.Mesh {
  _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const len = _d.length() || 1e-4;
  const m = add(p, DROP(), mat(c, { flat: false }), a[0], a[1], a[2], r * 2, len, rz * 2);
  m.quaternion.setFromUnitVectors(_Y, _d.normalize());
  return m;
}
/** Rounded fur clump: ellipsoid spanning a→b (soft sculpted locks for manes, ruffs, wool). */
function clump(p: THREE.Object3D, c: string, a: V3, b: V3, r: number, rz = r): THREE.Mesh {
  _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const len = _d.length() || 1e-4;
  const m = add(p, g('an-clump', () => new THREE.SphereGeometry(1, 10, 7)), mat(c, { flat: false }), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, r, len / 2, rz);
  m.quaternion.setFromUnitVectors(_Y, _d.normalize());
  return m;
}
type LS = [V3, number, number?];
/** Limb loft through joint stations [point, lateral half-width, front-back half-depth]. */
function limb(p: THREE.Object3D, c: string, st: LS[], paint?: Paint, radial = 14, flat = false): THREE.Mesh {
  return sweep(p, st.map(([pt, w, h]) => ({ p: pt, w, h: h ?? w })), c, { radial, sub: 5, paint, up: [0, 0, 1], flat });
}
function grp(p: THREE.Object3D, pos: V3, rot: V3 = [0, 0, 0], order: THREE.EulerOrder = 'YXZ'): THREE.Group {
  const gg = new THREE.Group();
  gg.position.set(pos[0], pos[1], pos[2]);
  gg.rotation.set(rot[0], rot[1], rot[2], order);
  p.add(gg);
  return gg;
}
const lit = (m: THREE.Mesh) => { m.material = mat('#ffffff', { emissive: '#ffffff' }); };

/** Glossy animal eye: dark rim, coloured iris, pupil, catch-light and a lid that gives the gaze some character. */
function aEye(p: THREE.Object3D, x: number, y: number, z: number, r: number, yaw: number, iris: string, lid?: string, slit = false): void {
  const e = grp(p, [x, y, z], [0, yaw, 0]);
  ellip(e, '#17110d', 0, 0, -r * 0.05, r * 1.16, r * 1.04, r * 0.7);
  ellip(e, iris, 0, 0, r * 0.1, r, r * 0.95, r * 0.6);
  ellip(e, '#070707', 0, 0, r * 0.36, slit ? r * 0.26 : r * 0.5, r * 0.56, r * 0.34);
  lit(ellip(e, '#ffffff', r * 0.34, r * 0.36, r * 0.6, r * 0.2));
  if (lid) ellip(e, lid, 0, r * 0.7, r * 0.02, r * 1.28, r * 0.5, r * 0.86, 0, -0.28);
}
/** Small glossy bead eye (bears, birds, reptiles). */
function bead(p: THREE.Object3D, x: number, y: number, z: number, r: number, c = '#111827'): void {
  ellip(p, c, x, y, z, r);
  lit(ellip(p, '#ffffff', x + r * 0.3, y + r * 0.35, z + r * 0.7, r * 0.28));
}
/** Leaf-shaped ear / fin slab placed and oriented in model space. */
function leaf(p: THREE.Object3D, c: string, x: number, y: number, z: number, w: number, h: number, rot: V3, d = 0.012, tip = 0.15): THREE.Mesh {
  const m = slab(p, [[-w, 0], [-w * 0.9, h * 0.45], [-w * tip, h], [w * tip, h], [w * 0.9, h * 0.45], [w, 0]], d, c, d * 0.35);
  m.position.set(x, y, z);
  m.rotation.set(rot[0], rot[1], rot[2]);
  return m;
}
/** Cupped ear: outer shell + recessed inner, in an oriented group (tip along local +y, opening toward +z). */
function cupEar(p: THREE.Object3D, pos: V3, rot: V3, w: number, h: number, outer: string, inner: string, pointed = false, rim?: string): THREE.Group {
  const e = grp(p, pos, rot, 'XYZ');
  if (pointed) {
    drop(e, outer, [0, -h * 0.05, 0], [0, h, 0], w, w * 0.45);
    drop(e, inner, [0, h * 0.08, w * 0.22], [0, h * 0.86, w * 0.26], w * 0.62, w * 0.18);
    if (rim) drop(e, rim, [0, h * 0.72, 0], [0, h * 1.02, 0], w * 0.36, w * 0.3);
  } else {
    ellip(e, outer, 0, h * 0.5, 0, w, h * 0.55, w * 0.42);
    ellip(e, inner, 0, h * 0.44, w * 0.24, w * 0.64, h * 0.38, w * 0.2);
    if (rim) ellip(e, rim, 0, h * 0.62, -w * 0.08, w * 0.9, h * 0.42, w * 0.36);
  }
  return e;
}
/** Cluster of fur locks fanning around a point (tail tufts, ear tufts, beards, manes). */
function tuft(p: THREE.Object3D, c: string, at: V3, dir: V3, len: number, r: number, n = 5, spread = 0.5, c2?: string): void {
  const dl = Math.hypot(...dir) || 1;
  const d: V3 = [dir[0] / dl, dir[1] / dl, dir[2] / dl];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, k = i === 0 ? 0 : spread;
    const ox = Math.cos(a) * k, oy = Math.sin(a) * k * 0.8, oz = Math.sin(a + 1) * k * 0.5;
    const L = len * (i === 0 ? 1.1 : 0.8 + hash3(i, at[0] * 50, at[2] * 50) * 0.3);
    drop(p, c2 && i % 2 ? c2 : c, [at[0] + ox * r * 0.6, at[1] + oy * r * 0.6, at[2] + oz * r * 0.6],
      [at[0] + (d[0] + ox * 0.6) * L, at[1] + (d[1] + oy * 0.6) * L, at[2] + (d[2] + oz * 0.6) * L], r);
  }
}

// ---- Coat pattern painters ----
/** Tiger: tapering forked black stripes across a countershaded orange coat, fading out on the white belly. */
function tigerP(c: string, white: string, axis: 'z' | 'y'): Paint {
  return (x, y, z, _nx, ny) => {
    const wt = sst(-0.12, -0.62, ny);
    if (wt > 0.9) return white;
    const base = wt > 0 ? mx(c, white, wt) : ny > 0.5 ? mx(c, sh(c, 0.86), sst(0.5, 0.95, ny)) : c;
    const w = fbm(x * 7 + 3, y * 7, z * 7);
    const v = axis === 'z' ? z * 46 + w * 7 + Math.abs(x) * 5 : y * 58 + w * 6 + z * 8;
    const thr = 0.3 + wt * 0.7 + (fbm(x * 15, y * 15 + 4, z * 15) - 0.5) * 0.9 + (axis === 'y' ? 0.2 : 0);
    return Math.sin(v) > thr ? '#1d1714' : speck(base, x, y, z, 0.04);
  };
}
function zebraP(axis: 'z' | 'y' | 'rump' | 'neck', k = 1): Paint {
  return (x, y, z, _nx, ny) => {
    if (axis === 'z' && ny < -0.8) return '#f4f2ec';
    const w = fbm(x * 8, y * 8, z * 8) * 2.6;
    const v = axis === 'z' ? z * 62 * k + (y - 0.4) * 12 : axis === 'y' ? y * 82 * k : axis === 'rump' ? Math.hypot(y - 0.25, z + 0.2) * 70 * k : (y - z * 0.55) * 74 * k;
    return Math.sin(v + w) > 0.08 ? '#151313' : '#f4f2ec';
  };
}
function giraffeP(s = 13, pale = '#f1e2c2'): Paint {
  return (x, y, z) => {
    const [f1, f2] = worley(x * s, y * s, z * s);
    if (f2 - f1 < 0.16) return pale;
    const h = hash3(Math.floor(x * s * 0.5), Math.floor(y * s * 0.5), 3);
    return f1 < 0.18 ? '#7a3a16' : h > 0.5 ? '#94471d' : '#a65a26';
  };
}
/** Jaguar / snow-leopard rosettes: broken dark rings around a slightly darker centre (+ solid spots on legs). */
function rosetteP(c: string, ring: string, fill: string | null, s = 21, belly = '#f5efe4', dots = false): Paint {
  return (x, y, z, _nx, ny) => {
    const bt = sst(-0.2, -0.65, ny);
    if (bt > 0.92) return hash3(Math.floor(x * 40), Math.floor(y * 40), Math.floor(z * 40)) > 0.85 ? ring : belly;
    const [f1, f2] = worley(x * s, y * s, z * s);
    if (dots) return f1 < 0.22 ? ring : speck(bt > 0 ? mx(c, belly, bt) : c, x, y, z, 0.04);
    const broken = fbm(x * s * 1.7, y * s * 1.7, z * s * 1.7) > 0.62;
    if (f1 > 0.2 && f1 < 0.36 && f2 - f1 > 0.06 && !broken) return ring;
    if (f1 <= 0.2 && fill) return fill;
    return speck(bt > 0 ? mx(c, belly, bt) : c, x, y, z, 0.04);
  };
}

// ---- Quadruped anatomy ----
interface Quad {
  c: string; span: number; leg: number; bw: number; bh: number; R: number;
  withers?: number; rump?: number; tuck?: number; hind?: number; legX?: number; fore?: number;
  feet: 'paw' | 'hoof' | 'cloven' | 'pad'; foot?: string; claw?: string; pawK?: number; stride?: number;
  body?: Paint; legP?: Paint; neckP?: Paint; flat?: boolean;
  neck: number; neckA: number; neckW: number; neckH?: number; arch?: number;
}
interface Frame { by: number; bh: number; bw: number; zs: number; zr: number; hp: V3; n0: V3; tail0: V3; wd: number; rd: number }

function quad(gp: THREE.Group, q: Quad): Frame {
  const { c, span, leg, bw, bh, R } = q;
  const wd = q.withers ?? 0, rd = q.rump ?? 0, tk = q.tuck ?? 0.15, hk = q.hind ?? 1, fk = q.fore ?? 1;
  const by = leg + bh, zs = span / 2, zr = -span / 2;
  const P = q.body;
  const ring = (z: number, top: number, under: number, w: number) => ({ p: [0, (top + under) / 2, z] as V3, w, h: (top - under) / 2 });
  // Torso: tail-root → rump → haunch → flank (tucked) → ribcage → shoulders → brisket → neck root
  sweep(gp, [
    ring(zr - bh * 0.8, by + bh * 0.48 - rd, by - bh * 0.02 - rd * 0.5, bw * 0.32),
    ring(zr - bh * 0.42, by + bh * 0.92 - rd, by - bh * 0.6 - rd * 0.3, bw * 0.8),
    ring(zr + span * 0.1, by + bh * 0.98 - rd * 0.85, by - bh * (0.86 - tk * 0.5), bw * 0.88),
    ring(zr + span * 0.4, by + bh * 0.9 - rd * 0.45 + wd * 0.15, by - bh * (1 - tk * 1.3), bw * (0.9 - tk * 0.22)),
    ring(zr + span * 0.7, by + bh * 1.0 + wd * 0.5, by - bh * 1.04, bw),
    ring(zs, by + bh * 1.04 + wd, by - bh * 0.98, bw * 0.9),
    ring(zs + bh * 0.42, by + bh * 0.84 + wd * 0.85, by - bh * 0.72, bw * 0.68),
    ring(zs + bh * 0.66, by + bh * 0.52 + wd * 0.7, by - bh * 0.22, bw * 0.4),
  ], c, { radial: 26, sub: 6, paint: P, flat: q.flat });
  // Shoulder-blade and haunch muscle masses
  for (const sx of [-1, 1]) {
    pblob(gp, c, sx * bw * 0.5, by + bh * 0.22 + wd * 0.55, zs - bh * 0.18, bw * 0.44 * fk, bh * 0.84, bh * 0.6 * fk, P, [-0.32, 0, sx * 0.06], 20);
    pblob(gp, c, sx * bw * 0.5, by + bh * 0.05 - rd * 0.7, zr - bh * 0.02, bw * 0.48 * hk, bh * 0.98 * hk, bh * 0.82 * hk, P, [0.22, 0, 0], 20);
  }

  // Legs (diagonal walking gait: right fore & left hind advanced)
  const lp = q.legP ?? P;
  const st = q.stride ?? 0.03, lx = q.legX ?? 0.6;
  const hoofed = q.feet === 'hoof' || q.feet === 'cloven';
  const footY = hoofed ? R * 1.25 : q.feet === 'pad' ? R * 0.7 : R * 0.6;
  const fc = q.foot ?? sh(c, 0.6);
  for (const sx of [-1, 1]) {
    const xf = sx * bw * lx, xh = sx * bw * lx * 0.97;
    const ff = sx * st, hf = -sx * st;
    const fz = zs - bh * 0.08 + ff, hz = zr - bh * 0.22 + hf;
    if (hoofed) {
      limb(gp, c, [
        [[xf * 0.7, by + bh * 0.5 + wd * 0.4, zs - bh * 0.02], R * 1.2 * fk, R * 1.6 * fk],
        [[xf * 0.9, by + bh * 0.05 + wd * 0.2, zs - bh * 0.1], R * 1.6 * fk, R * 2.4 * fk],
        [[xf, leg + bh * 0.2, zs - bh * 0.25], R * 1.45 * fk, R * 2.0 * fk],
        [[xf * 0.98, leg * 0.66, fz - R * 0.2], R * 1.05, R * 1.2],
        [[xf * 0.97, leg * 0.42, fz], R * 0.86, R * 0.96],
        [[xf * 0.96, leg * 0.25, fz + R * 0.05], R * 0.58, R * 0.64],
        [[xf * 0.96, footY + R * 0.55, fz + R * 0.12], R * 0.72, R * 0.82],
        [[xf * 0.96, footY + R * 0.05, fz + R * 0.5], R * 0.62, R * 0.62],
      ], lp);
      limb(gp, c, [
        [[xh * 0.7, by + bh * 0.55 - rd, zr - bh * 0.05], R * 1.4 * hk, R * 1.9 * hk],
        [[xh * 0.92, by + bh * 0.1 - rd, zr + bh * 0.12], R * 1.85 * hk, R * 2.8 * hk],
        [[xh * 1.04, leg + bh * 0.25 - rd * 0.5, zr + bh * 0.55], R * 1.55 * hk, R * 2.1 * hk],
        [[xh, leg * 0.74, zr + bh * 0.02], R * 1.05, R * 1.45],
        [[xh * 0.98, leg * 0.5, zr - bh * 0.32], R * 0.78, R * 1.05],
        [[xh * 0.97, leg * 0.27, hz], R * 0.58, R * 0.66],
        [[xh * 0.96, footY + R * 0.55, hz + R * 0.12], R * 0.72, R * 0.82],
        [[xh * 0.96, footY + R * 0.05, hz + R * 0.5], R * 0.62, R * 0.62],
      ], lp);
      for (const [x, z] of [[xf * 0.96, fz + R * 0.58], [xh * 0.96, hz + R * 0.58]] as const) {
        if (q.feet === 'cloven') for (const k of [-1, 1]) strut(gp, [x + k * R * 0.32, 0, z + R * 0.12], [x + k * R * 0.2, footY + R * 0.1, z - R * 0.08], R * 0.42, R * 0.32, fc, 8);
        else strut(gp, [x, 0, z + R * 0.12], [x, footY + R * 0.1, z - R * 0.12], R * 0.84, R * 0.62, fc, 12);
      }
    } else if (q.feet === 'pad') {
      // Columnar graviportal legs (elephant, hippo)
      limb(gp, c, [
        [[xf * 0.85, by - bh * 0.05, zs - bh * 0.08], R * 1.3, R * 1.8],
        [[xf, leg + bh * 0.1, zs - bh * 0.12], R * 1.25, R * 1.45],
        [[xf * 0.99, leg * 0.52, fz + R * 0.05], R * 1.05, R * 1.12],
        [[xf * 0.98, leg * 0.2, fz], R * 0.98, R * 1.02],
        [[xf * 0.98, footY, fz + R * 0.05], R * 1.1, R * 1.12],
      ], lp, 16);
      limb(gp, c, [
        [[xh * 0.85, by - rd, zr + bh * 0.1], R * 1.45 * hk, R * 2.1 * hk],
        [[xh * 1.02, leg + bh * 0.05, zr + bh * 0.22], R * 1.35, R * 1.6],
        [[xh, leg * 0.5, zr - bh * 0.02 + hf * 0.5], R * 1.05, R * 1.15],
        [[xh * 0.99, leg * 0.2, hz + bh * 0.12], R * 0.98, R * 1.02],
        [[xh * 0.98, footY, hz + bh * 0.14], R * 1.1, R * 1.12],
      ], lp, 16);
      pblob(gp, c, xf * 0.97, leg + bh * 0.42, zs - bh * 0.12, R * 1.42, bh * 0.62, R * 1.7, lp, [0, 0, 0], 16);
      pblob(gp, c, xh * 0.98, leg + bh * 0.48 - rd * 0.5, zr + bh * 0.16, R * 1.55 * hk, bh * 0.7, R * 1.95 * hk, lp, [0.15, 0, 0], 16);
      for (const [x, z] of [[xf * 0.98, fz + R * 0.05], [xh * 0.98, hz + bh * 0.14]] as const) {
        pblob(gp, sh(c, 0.97), x, footY * 0.5, z, R * 1.13, footY * 0.55, R * 1.15, undefined, [0, 0, 0], 16);
        for (const a of [-0.7, -0.23, 0.23, 0.7]) ellip(gp, '#e9e1cf', x + Math.sin(a) * R * 1.02, R * 0.26, z + Math.cos(a) * R * 1.04, R * 0.3, R * 0.24, R * 0.18, a);
      }
    } else {
      const pk = q.pawK ?? 1;
      limb(gp, c, [
        [[xf * 0.7, by + bh * 0.5 + wd * 0.4, zs - bh * 0.02], R * 1.3 * fk, R * 1.7 * fk],
        [[xf * 0.9, by + bh * 0.05 + wd * 0.2, zs - bh * 0.12], R * 1.7 * fk, R * 2.5 * fk],
        [[xf, leg + bh * 0.15, zs - bh * 0.3], R * 1.5 * fk, R * 2.0 * fk],
        [[xf * 0.98, leg * 0.56, fz - R * 0.15], R * 1.16, R * 1.32],
        [[xf * 0.97, leg * 0.2, fz], R * 0.88, R * 0.95],
        [[xf * 0.96, footY + R * 0.25, fz + R * 0.45], R * 0.86 * pk, R * 0.9],
      ], lp);
      limb(gp, c, [
        [[xh * 0.7, by + bh * 0.55 - rd, zr - bh * 0.05], R * 1.5 * hk, R * 2.0 * hk],
        [[xh * 0.92, by + bh * 0.1 - rd, zr + bh * 0.12], R * 1.95 * hk, R * 2.9 * hk],
        [[xh * 1.04, leg + bh * 0.2 - rd * 0.5, zr + bh * 0.55], R * 1.6 * hk, R * 2.2 * hk],
        [[xh, leg * 0.62, zr], R * 1.15, R * 1.55],
        [[xh * 0.98, leg * 0.34, zr - bh * 0.34], R * 0.86, R * 1.05],
        [[xh * 0.97, leg * 0.14, hz], R * 0.8, R * 0.85],
        [[xh * 0.96, footY + R * 0.25, hz + R * 0.45], R * 0.86 * pk, R * 0.9],
      ], lp);
      paw(gp, fc, xf * 0.96, fz + R * 0.85, R * pk, q.claw);
      paw(gp, fc, xh * 0.96, hz + R * 0.85, R * pk, q.claw);
    }
  }

  // Neck: from inside the chest, slightly arched crest, up to the head pivot hp
  const n0: V3 = [0, by + bh * 0.42 + wd * 0.75, zs + bh * 0.28];
  const a = q.neckA, L = q.neck, nw = q.neckW, nh = q.neckH ?? 1, arch = q.arch ?? 0.06;
  const hp: V3 = [0, n0[1] + Math.sin(a) * L, n0[2] + Math.cos(a) * L];
  const mid: V3 = [0, (n0[1] + hp[1]) / 2 + L * arch * Math.cos(a), (n0[2] + hp[2]) / 2 - L * arch * Math.sin(a)];
  sweep(gp, [
    { p: [0, n0[1] - bh * 0.15, n0[2] - bh * 0.4], w: bw * 0.72, h: bh * 0.8 },
    { p: n0, w: nw * 1.22, h: nw * 1.5 * nh },
    { p: mid, w: nw, h: nw * 1.22 * nh },
    { p: hp, w: nw * 0.86, h: nw * 1.0 },
  ], c, { radial: 20, sub: 5, paint: q.neckP ?? P, flat: q.flat });
  return { by, bh, bw, zs, zr, hp, n0, wd, rd, tail0: [0, by + bh * 0.5 - rd, zr - bh * 0.7] };
}

/** Paw with four toe beans (and optional claws). */
function paw(gp: THREE.Object3D, c: string, x: number, z: number, r: number, claw?: string): void {
  pblob(gp, c, x, r * 0.55, z - r * 0.15, r * 1.06, r * 0.6, r * 1.25, undefined, [0, 0, 0], 14);
  for (let i = 0; i < 4; i++) {
    const a = (i - 1.5) * 0.38;
    const tx = x + Math.sin(a) * r * 0.82, tz = z + Math.cos(a) * r * 0.92 - (i === 0 || i === 3 ? r * 0.12 : 0);
    ellip(gp, c, tx, r * 0.36, tz, r * 0.33, r * 0.34, r * 0.38);
    if (claw) drop(gp, claw, [tx, r * 0.42, tz + r * 0.18], [tx, r * 0.06, tz + r * 0.62], r * 0.12);
  }
}

/** Tail integrated from the root: droops, sways sideways and curls up toward the tip. Returns [tip, direction]. */
function tailOf(gp: THREE.Object3D, F: Frame, c: string, len: number, r: number,
  o: { droop?: number; curl?: number; side?: number; paint?: Paint; tip?: number; lift?: number; flat?: boolean } = {}): [V3, V3] {
  let [x, y, z] = F.tail0;
  let pitch = -(o.lift ?? 0.2), yaw = 0;
  const pts: V3[] = [[x, y, z]], n = 7, stp = len / n;
  let dir: V3 = [0, 0, -1];
  for (let i = 1; i <= n; i++) {
    pitch += (o.droop ?? 0.32) - (i > n * 0.55 ? (o.curl ?? 0.25) : 0);
    yaw += (o.side ?? 0.12);
    dir = [Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
    x += dir[0] * stp; y = Math.max(r * 1.2, y + dir[1] * stp); z += dir[2] * stp;
    pts.push([x, y, z]);
  }
  const tp = o.tip ?? 0.55;
  sweep(gp, pts.map((p, i) => ({ p, w: r * (1 - (1 - tp) * (i / n)) })), c, { radial: 12, sub: 4, paint: o.paint, flat: o.flat });
  ellip(gp, c, x, y, z, r * tp * 0.98);
  return [[x, y, z], dir];
}

// ---- Species heads (built in a local group: origin = head pivot, looking along +z) ----
interface CatO { s?: number; P?: Paint; cheekP?: Paint; muz?: string; nose?: string; iris?: string; earBack?: string; earIn?: string; long?: number; wide?: number; whisk?: boolean }
function catHead(h: THREE.Group, c: string, o: CatO = {}): void {
  const s = o.s ?? 1, L = o.long ?? 1, W = o.wide ?? 1, P = o.P;
  const muz = o.muz ?? mx(c, '#fbf4e8', 0.62), nose = o.nose ?? '#8a4a40';
  pblob(h, c, 0, 0.014 * s, 0.03 * s, 0.064 * s * W, 0.058 * s, 0.068 * s, P, [0, 0, 0], 20);
  pblob(h, c, 0, 0.034 * s, 0.075 * s, 0.05 * s * W, 0.02 * s, 0.03 * s, P, [0.25, 0, 0], 14);
  for (const sx of [-1, 1]) pblob(h, c, sx * 0.036 * s * W, -0.016 * s, 0.064 * s, 0.042 * s, 0.04 * s, 0.044 * s, o.cheekP ?? P, [0, 0, sx * 0.2], 16);
  const zn = (0.134 + 0.03 * (L - 1)) * s;
  sweep(h, [
    { p: [0, 0.034 * s, 0.07 * s], w: 0.03 * s, h: 0.018 * s },
    { p: [0, 0.02 * s, (zn + 0.07 * s) / 2 + 0.01 * s], w: 0.026 * s, h: 0.02 * s },
    { p: [0, 0.004 * s, zn - 0.006 * s], w: 0.024 * s, h: 0.02 * s },
  ], c, { radial: 14, sub: 4, paint: P });
  for (const sx of [-1, 1]) {
    pblob(h, muz, sx * 0.019 * s, -0.02 * s, zn - 0.012 * s, 0.024 * s, 0.021 * s, 0.022 * s, undefined, [0, 0, 0], 14);
    if (o.whisk !== false) for (let i = 0; i < 6; i++) {
      const wx = sx * (0.012 + (i % 3) * 0.009) * s, wy = (-0.012 - Math.floor(i / 3) * 0.009) * s;
      ellip(h, '#3a2a22', wx, wy, zn + 0.0065 * s - (i % 3) * 0.004 * s, 0.0022 * s);
    }
  }
  pblob(h, muz, 0, -0.045 * s, zn - 0.03 * s, 0.021 * s, 0.013 * s, 0.021 * s, undefined, [0, 0, 0], 12);
  ellip(h, nose, 0, 0.005 * s, zn + 0.009 * s, 0.015 * s, 0.009 * s, 0.009 * s);
  ellip(h, sh(nose, 0.55), 0, -0.012 * s, zn + 0.006 * s, 0.003 * s, 0.01 * s, 0.004 * s);
  ellip(h, '#2a1d18', 0, -0.035 * s, zn - 0.016 * s, 0.03 * s, 0.0028 * s, 0.014 * s);
  for (const sx of [-1, 1]) {
    aEye(h, sx * 0.03 * s * W, 0.021 * s, 0.093 * s, 0.0118 * s, sx * 0.32, o.iris ?? '#c08a1e', c);
    cupEar(h, [sx * 0.045 * s * W, 0.05 * s, 0.018 * s], [-0.15, sx * 0.35, -sx * 0.5], 0.024 * s, 0.046 * s, o.earBack ?? c, o.earIn ?? mx(c, '#4a3328', 0.45));
  }
}

/** Long-faced grazer head (horse, zebra, giraffe, deer, camel, llama). */
interface LongO { len?: number; wide?: number; P?: Paint; muz?: string; nostril?: string; earC?: string; earIn?: string; earH?: number; earW?: number; earRot?: V3; iris?: string; lid?: string; lip?: boolean; s?: number }
function longHead(h: THREE.Group, c: string, o: LongO = {}): { tip: number; ear: V3 } {
  const s = o.s ?? 1, L = (o.len ?? 1) * s, W = (o.wide ?? 1) * s, P = o.P;
  const muz = o.muz ?? sh(c, 0.75);
  // Cheek/jaw mass, forehead and tapering face
  pblob(h, c, 0, -0.022 * s, 0.035 * s, 0.042 * W, 0.054 * s, 0.058 * s, P, [0.3, 0, 0], 18);
  sweep(h, [
    { p: [0, 0.008 * s, -0.012 * s], w: 0.04 * W, h: 0.04 * s },
    { p: [0, 0.0, 0.07 * L], w: 0.034 * W, h: 0.037 * s },
    { p: [0, -0.01 * s, 0.14 * L], w: 0.027 * W, h: 0.03 * s },
    { p: [0, -0.02 * s, 0.185 * L], w: 0.029 * W, h: 0.031 * s },
  ], c, { radial: 18, sub: 6, paint: P });
  const zt = 0.19 * L;
  pblob(h, muz, 0, -0.024 * s, zt, 0.031 * W, 0.031 * s, 0.026 * s, undefined, [0, 0, 0], 16);
  if (o.lip) pblob(h, muz, 0, -0.052 * s, zt - 0.006 * s, 0.024 * W, 0.014 * s, 0.022 * s, undefined, [0, 0, 0], 12);
  ellip(h, sh(muz, 0.55), 0, -0.04 * s, zt + 0.014 * s, 0.024 * W, 0.0025 * s, 0.012 * s);
  for (const sx of [-1, 1]) {
    ellip(h, o.nostril ?? '#1a1412', sx * 0.016 * W, -0.012 * s, zt + 0.022 * s, 0.006 * s, 0.009 * s, 0.004 * s, 0, 0, sx * 0.4);
    pblob(h, c, sx * 0.032 * W, 0.016 * s, 0.03 * s, 0.014 * s, 0.012 * s, 0.018 * s, P, [0, 0, 0], 10);
    aEye(h, sx * 0.037 * W, 0.008 * s, 0.034 * s, 0.012 * s, sx * 1.05, o.iris ?? '#2b1a10', o.lid ?? c);
  }
  const eh = (o.earH ?? 0.06) * s, ew = (o.earW ?? 0.02) * s;
  for (const sx of [-1, 1]) cupEar(h, [sx * 0.028 * W, 0.03 * s, -0.018 * s], o.earRot ? [o.earRot[0], sx * o.earRot[1], sx * o.earRot[2]] : [-0.3, sx * 0.5, -sx * 0.42], ew, eh, o.earC ?? c, o.earIn ?? mx(c, '#3a2a22', 0.4), true);
  return { tip: zt, ear: [0.028 * W, 0.03 * s, -0.018 * s] };
}

/** Bear head: domed skull, tapering muzzle, leathery nose, small round ears. */
function bearHead(h: THREE.Group, c: string, o: { s?: number; muz?: string; ear?: string; earIn?: string; long?: number; P?: Paint; nose?: string; eyeC?: string } = {}): void {
  const s = o.s ?? 1, L = o.long ?? 1, muz = o.muz ?? mx(c, '#d9c4a2', 0.35);
  pblob(h, c, 0, 0.012 * s, 0.035 * s, 0.085 * s, 0.075 * s, 0.08 * s, o.P, [0, 0, 0], 20, true);
  for (const sx of [-1, 1]) pblob(h, c, sx * 0.045 * s, -0.018 * s, 0.06 * s, 0.05 * s, 0.05 * s, 0.05 * s, o.P, [0, 0, 0], 14, true);
  const zt = (0.13 + 0.05 * (L - 1)) * s;
  sweep(h, [
    { p: [0, 0.03 * s, 0.07 * s], w: 0.045 * s, h: 0.03 * s },
    { p: [0, 0.0, 0.1 * s * L], w: 0.04 * s, h: 0.035 * s },
    { p: [0, -0.012 * s, zt], w: 0.032 * s, h: 0.03 * s },
  ], muz, { radial: 16, sub: 5, paint: (x, y, z, _nx, ny) => (ny > 0.55 && z < zt - 0.03 * s ? c : null) });
  ellip(h, o.nose ?? '#1c1714', 0, -0.002 * s, zt + 0.018 * s, 0.021 * s, 0.014 * s, 0.013 * s);
  lit(ellip(h, '#ffffff', 0.006 * s, 0.006 * s, zt + 0.028 * s, 0.004 * s));
  ellip(h, '#2a201b', 0, -0.03 * s, zt + 0.004 * s, 0.022 * s, 0.0028 * s, 0.014 * s);
  for (const sx of [-1, 1]) {
    aEye(h, sx * 0.04 * s, 0.025 * s, 0.098 * s, 0.0098 * s, sx * 0.35, o.eyeC ?? '#3b2416', c);
    cupEar(h, [sx * 0.06 * s, 0.062 * s, 0.01 * s], [-0.1, sx * 0.3, -sx * 0.55], 0.028 * s, 0.042 * s, o.ear ?? c, o.earIn ?? sh(c, 0.6));
  }
}

function headGroup(gp: THREE.Group, F: Frame, yaw: number, pitch: number, roll = 0): THREE.Group {
  return grp(gp, F.hp, [pitch, yaw, roll]);
}

// ---- Species ----
type Rec = Record<string, unknown> & { color?: string };

function lion(gp: THREE.Group, r: Rec): void {
  const c = r.color!, mane = (r.mane as string) ?? '#8a5a2a';
  const belly = mx(c, '#f3e2c4', 0.72);
  const body = coat(c, belly, { dorsal: 0.88 });
  const F = quad(gp, {
    c, span: 0.44, leg: 0.22, bw: 0.1, bh: 0.108, R: 0.031, tuck: 0.3, withers: 0.012, feet: 'paw', pawK: 1.12,
    body, legP: coat(c, belly, { hi: 0.1, lo: -0.6 }), neck: 0.13, neckA: 0.5, neckW: 0.068, stride: 0.04, foot: sh(c, 0.97),
  });
  // Shaggy mane collar: golden near the face, darkening toward shoulders, long chest fringe beneath
  const gold = mx(mane, c, 0.45), dark = sh(mane, 0.72);
  const [, ny0, nz0] = F.n0, [, hy, hz] = F.hp;
  const ax: V3 = [0, hy - ny0, hz - nz0], al = Math.hypot(ax[1], ax[2]);
  const A: V3 = [0, ax[1] / al, ax[2] / al], U: V3 = [0, A[2], -A[1]];
  sweep(gp, [
    { p: [0, ny0 - 0.03, nz0 - 0.08], w: 0.1, h: 0.115 },
    { p: [0, ny0 + ax[1] * 0.5, nz0 + ax[2] * 0.5], w: 0.118, h: 0.135 },
    { p: [0, hy, hz - 0.02], w: 0.112, h: 0.125 },
  ], dark, { radial: 18, sub: 5, paint: furNoise(dark, 0.12) });
  for (let i = 0; i < 5; i++) {
    const t = -0.45 + i * 0.32;
    const nphi = 11;
    for (let j = 0; j < nphi; j++) {
      const phi = (j / nphi) * Math.PI * 2 + i * 0.4;
      const cs = Math.cos(phi), sn = Math.sin(phi);
      const rad = 0.06 + (sn < 0 ? -0.006 : 0.01);
      const b: V3 = [cs * rad, ny0 + A[1] * t * al + U[1] * sn * rad, nz0 + A[2] * t * al + U[2] * sn * rad];
      const down = sn < -0.3 ? 0.7 : 0.25;
      const len = (0.1 + hash3(i, j, 7) * 0.03) * (sn < -0.3 ? 1.3 : 1);
      const d: V3 = [cs, U[1] * sn - A[1] * 0.4 - down, U[2] * sn - A[2] * 0.4];
      const dl = Math.hypot(...d);
      const col = mx(gold, dark, Math.min(1, sst(1.1, -0.4, t) * 0.7 + hash3(j, i, 3) * 0.12));
      clump(gp, col, b, [b[0] + d[0] / dl * len, b[1] + d[1] / dl * len, b[2] + d[2] / dl * len], 0.042, 0.034);
    }
  }
  const h = headGroup(gp, F, -0.3, 0.12, 0.04);
  // Face ruff framing the face
  for (let k = 0; k < 2; k++) for (let j = 0; j < 13; j++) {
    const phi = (j / 13) * Math.PI * 2 + k * 0.24;
    const rad = 0.078 + k * 0.022, cs = Math.cos(phi), sn = Math.sin(phi);
    const b: V3 = [cs * rad, -0.008 + sn * rad * 0.95, 0.03 - k * 0.03];
    const len = 0.06 + k * 0.02 + hash3(j, k, 1) * 0.02;
    const col = k ? mx(gold, dark, 0.35 + hash3(j, 2, k) * 0.3) : mx(gold, c, 0.2 + hash3(j, 1, k) * 0.3);
    clump(h, col, b, [b[0] + cs * len * 0.8, b[1] + sn * len * 0.8 - len * 0.25, b[2] - len * 0.55], 0.032, 0.024);
  }
  catHead(h, c, { s: 1.12, long: 1.25, wide: 1.06, iris: '#c48a1c', nose: '#7d4036', earBack: sh(c, 0.75) });
  const [tip, dir] = tailOf(gp, F, c, 0.42, 0.014, { droop: 0.3, curl: 0.42, side: 0.1, paint: body });
  tuft(gp, sh(mane, 0.6), tip, dir, 0.05, 0.016, 6, 0.6, dark);
}

function bigcat(gp: THREE.Group, r: Rec, sp: string): void {
  const c = r.color!;
  const white = sp === 'snowleopard' ? '#f7f5ef' : '#f6efe2';
  let body: Paint, legP: Paint, neckP: Paint, headP: Paint, cheekP: Paint;
  let spec: Partial<Quad>;
  if (sp === 'tiger') {
    body = tigerP(c, white, 'z'); legP = tigerP(c, white, 'y'); neckP = tigerP(c, white, 'y');
    headP = (x, y, z, nx, ny, nz) => {
      if (nz > 0.2 && y > 0.026 && Math.abs(x) > 0.016 && Math.abs(x) < 0.05 && y < 0.05) return white;
      if (y > 0.03 && nz > -0.3) return Math.sin(y * 260 + Math.abs(x) * 160) > 0.55 && Math.abs(x) < 0.05 ? '#1d1714' : c;
      return tigerP(c, white, 'y')(x, y, z, nx, ny, nz);
    };
    cheekP = (x, y) => (Math.sin((y + Math.abs(x) * 0.8) * 200) > 0.72 ? '#1d1714' : white);
    spec = { span: 0.5, leg: 0.2, bw: 0.096, bh: 0.1, R: 0.03, tuck: 0.3 };
  } else if (sp === 'jaguar') {
    const fill = sh(c, 0.84);
    body = rosetteP(c, '#21160f', fill, 20, '#f5ecd8'); legP = rosetteP(c, '#21160f', null, 30, '#f5ecd8', true); neckP = rosetteP(c, '#21160f', null, 28, '#f5ecd8', true);
    headP = rosetteP(c, '#21160f', null, 46, '#f5ecd8', true); cheekP = (x, y, z, nx, ny, nz) => (ny < -0.2 ? '#f5ecd8' : headP(x, y, z, nx, ny, nz));
    spec = { span: 0.42, leg: 0.17, bw: 0.104, bh: 0.104, R: 0.033, tuck: 0.2, pawK: 1.12 };
  } else {
    body = rosetteP(c, '#4d5058', sh(c, 0.92), 18, white); legP = rosetteP(c, '#4d5058', null, 28, white, true); neckP = rosetteP(c, '#4d5058', null, 26, white, true);
    headP = rosetteP(c, '#4d5058', null, 44, white, true); cheekP = (x, y, z, nx, ny, nz) => (ny < -0.2 ? white : headP(x, y, z, nx, ny, nz));
    spec = { span: 0.38, leg: 0.16, bw: 0.088, bh: 0.094, R: 0.028, tuck: 0.22, pawK: 1.25, flat: true };
  }
  const F = quad(gp, { c, feet: 'paw', foot: sp === 'tiger' ? white : undefined, body, legP, neckP, neck: 0.12, neckA: 0.42, neckW: 0.058, stride: 0.045, ...spec } as Quad);
  const h = headGroup(gp, F, -0.32, 0.18, 0.03);
  catHead(h, c, {
    s: sp === 'snowleopard' ? 0.92 : 1, P: headP, cheekP, muz: white, iris: sp === 'snowleopard' ? '#9fb8c4' : sp === 'tiger' ? '#d39a2a' : '#c9a227',
    nose: sp === 'snowleopard' ? '#a77a72' : '#c47a6a', earBack: sp === 'tiger' ? '#1d1714' : sh(c, 0.7), wide: sp === 'tiger' ? 1.08 : 1,
  });
  if (sp === 'tiger') {
    for (const sx of [-1, 1]) {
      ellip(h, white, sx * 0.056, 0.074, 0.006, 0.008, 0.008, 0.004, 0, 0, 0);
      tuft(h, white, [sx * 0.06, -0.02, 0.04], [sx, -0.35, -0.5], 0.04, 0.016, 4, 0.5);
    }
  }
  const sn = sp === 'snowleopard';
  const tailP: Paint = sp === 'tiger'
    ? (x, y, z) => (z < F.zr - 0.38 ? '#1d1714' : Math.sin(Math.hypot(y - F.tail0[1], z - F.tail0[2]) * 75) > 0.3 ? '#1d1714' : c)
    : sn ? rosetteP(c, '#4d5058', null, 26, white, false) : rosetteP(c, '#21160f', null, 30, '#f5ecd8', true);
  tailOf(gp, F, c, sn ? 0.6 : 0.44, sn ? 0.03 : 0.016, { droop: sn ? 0.28 : 0.3, curl: sn ? 0.55 : 0.4, side: sn ? 0.18 : 0.08, paint: tailP, tip: sn ? 0.8 : 0.6, flat: sn });
}

function zebra(gp: THREE.Group, _r: Rec): void {
  const W = '#f4f2ec', B = '#151313';
  const F = quad(gp, {
    c: W, span: 0.38, leg: 0.3, bw: 0.092, bh: 0.11, R: 0.026, tuck: 0.12, feet: 'hoof', foot: '#1c1917',
    body: (x, y, z, nx, ny, nz) => (z < -0.12 ? zebraP('rump')(x, y, z, nx, ny, nz) : zebraP('z')(x, y, z, nx, ny, nz)),
    legP: zebraP('y'), neckP: zebraP('neck'), neck: 0.22, neckA: 0.95, neckW: 0.046, neckH: 1.35, arch: 0.1, stride: 0.035,
  });
  // Upright brush mane
  const [, ny0, nz0] = F.n0, [, hy, hz] = F.hp;
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, y = ny0 + 0.04 + (hy - ny0) * t + Math.sin(t * Math.PI) * 0.03, z = nz0 - 0.06 + (hz - nz0 + 0.04) * t;
    const col = i % 2 ? B : W;
    drop(gp, col, [0, y, z], [0, y + 0.05, z - 0.016], 0.011, 0.02);
  }
  const h = headGroup(gp, F, -0.28, 1.0);
  longHead(h, W, { P: (x, y, z) => (Math.sin(z * 120 + Math.abs(x) * 30) > 0.25 || Math.abs(x) < 0.006 && z > 0.06 ? B : W), muz: '#221d1b', earH: 0.07, earW: 0.024, earIn: '#e7e3da', len: 1.02 });
  drop(h, B, [0, 0.03, -0.02], [0, 0.04, 0.05], 0.014);
  const [tip, dir] = tailOf(gp, F, W, 0.3, 0.012, { droop: 0.55, curl: 0, side: 0.05, paint: zebraP('rump') });
  tuft(gp, B, tip, dir, 0.08, 0.014, 6, 0.3);
}

function giraffe(gp: THREE.Group, _r: Rec): void {
  const base = '#d9a35b', pale = '#f1e2c2';
  const F = quad(gp, {
    c: base, span: 0.27, leg: 0.43, bw: 0.085, bh: 0.1, R: 0.022, tuck: 0.15, withers: 0.07, rump: 0.03, feet: 'hoof', foot: '#3a2a1f',
    body: giraffeP(14), neckP: giraffeP(17), legP: (x, y, z, nx, ny, nz) => (y < 0.2 ? speck(pale, x, y, z, 0.05) : giraffeP(19)(x, y, z, nx, ny, nz)),
    neck: 0.5, neckA: 1.12, neckW: 0.036, neckH: 1.45, arch: 0.04, stride: 0.035, hind: 0.9,
  });
  const [, ny0, nz0] = F.n0, [, hy, hz] = F.hp;
  for (let i = 0; i <= 18; i++) {
    const t = i / 18, y = ny0 + (hy - ny0) * t, z = nz0 - 0.05 + (hz - nz0 + 0.03) * t;
    drop(gp, i % 2 ? '#6b3a1a' : '#7d4520', [0, y + 0.02, z - 0.02], [0, y + 0.045, z - 0.04], 0.008, 0.012);
  }
  const h = headGroup(gp, F, -0.3, 0.95);
  longHead(h, base, { P: giraffeP(30), muz: '#c99a62', nostril: '#3a2a1f', earH: 0.06, earW: 0.02, earRot: [-0.9, 0.9, -1.1], earIn: pale, len: 1.05, wide: 0.92 });
  for (const sx of [-1, 1]) {
    tube(h, [[sx * 0.016, 0.03, -0.0], [sx * 0.022, 0.08, -0.02]], 0.008, 0.007, '#c58c4c');
    tuft(h, '#2a1d14', [sx * 0.022, 0.085, -0.02], [0, 1, 0], 0.012, 0.012, 4, 0.8);
  }
  const [tip, dir] = tailOf(gp, F, base, 0.3, 0.009, { droop: 0.55, curl: 0, side: 0.04, paint: giraffeP(22) });
  tuft(gp, '#1f1611', tip, dir, 0.07, 0.012, 6, 0.35);
}

function elephant(gp: THREE.Group, r: Rec): void {
  const c = r.color!;
  const skin: Paint = (x, y, z, _nx, ny) => {
    const m = Math.round(fbm(x * 9, y * 9, z * 9, 2) * 5) / 5;
    return sh(mx(c, '#a58f78', sst(0.3, 0.05, y) * 0.35), (0.95 + m * 0.08) * (ny > 0.6 ? 1.04 : 1));
  };
  const F = quad(gp, {
    c, span: 0.36, leg: 0.3, bw: 0.15, bh: 0.165, R: 0.052, tuck: 0.05, withers: 0.04, rump: 0.03, feet: 'pad', body: skin, legP: skin,
    neck: 0.05, neckA: 0.3, neckW: 0.12, stride: 0.03, legX: 0.55, flat: false,
  });
  const h = headGroup(gp, F, -0.25, 0.1);
  // Domed skull with twin bulges, sunken temples, cheek mass
  sculpt(h, c, [0, 0.045, 0.05], [0.122, 0.142, 0.128], [
    [[0.36, 0.62, 0.7], 0.075, 0.07], [[-0.36, 0.62, 0.7], 0.075, 0.07], // twin forehead domes
    [[0, 0.55, 0.83], -0.03, 0.025], // shallow midline groove between them
    [[0.88, 0.2, 0.42], -0.07, 0.06], [[-0.88, 0.2, 0.42], -0.07, 0.06], // temple hollows
    [[0, -0.5, 0.86], 0.3, 0.14], // tapering forward into the trunk root
    [[0.6, -0.55, 0.58], 0.06, 0.08], [[-0.6, -0.55, 0.58], 0.06, 0.08], // cheeks
    [[0, -0.2, -1], 0.12, 0.25], // back of skull flowing into the neck
  ], skin, 32);
  // Trunk hanging and curling forward at the tip
  const tr: V3[] = [[0, -0.01, 0.16], [0, -0.12, 0.2], [0, -0.25, 0.2], [0, -0.36, 0.2], [0.01, -0.44, 0.23], [0.015, -0.47, 0.28]];
  const tw = [0.06, 0.05, 0.04, 0.032, 0.026, 0.02];
  sweep(h, tr.map((p, i) => ({ p, w: tw[i], h: tw[i] * 0.9 })), c, { radial: 16, sub: 12, paint: (x, y, z) => sh(c, 0.9 + Math.round(Math.cos(y * 300) * 2) * 0.025 + Math.round((vnoise(x * 30, y * 30, z * 30) - 0.5) * 4) * 0.01) });
  ellip(h, sh(c, 0.6), 0.015, -0.47, 0.3, 0.016, 0.012, 0.006);
  for (const sx of [-1, 1]) {
    // Tusks curving forward and up
    tube(h, [[sx * 0.05, -0.06, 0.15], [sx * 0.065, -0.15, 0.2], [sx * 0.06, -0.19, 0.28], [sx * 0.045, -0.16, 0.34]], 0.016, 0.005, '#f4ecd8');
    pblob(h, c, sx * 0.05, -0.06, 0.15, 0.024, 0.03, 0.024, skin, [0, 0, 0], 10);
    aEye(h, sx * 0.1, 0.04, 0.12, 0.011, sx * 0.9, '#3a2416', sh(c, 0.85));
    // Huge Africa-shaped ears, swept slightly forward
    // Ear group: local +x runs outward from the skull, ear face toward local +z (forward)
    const eg = grp(h, [sx * 0.095, 0.07, 0.03], [0, sx > 0 ? -0.4 : Math.PI + 0.4, sx * 0.04]);
    const OUT: [number, number][] = [[0, 0.13], [0.09, 0.17], [0.19, 0.12], [0.23, 0.0], [0.2, -0.12], [0.14, -0.22], [0.08, -0.28], [0.03, -0.2], [0, -0.06]];
    const ear = slab(eg, OUT, 0.014, sh(c, 0.96), 0.007);
    ear.position.z = -0.007;
    slab(eg, [[0.02, 0.1], [0.09, 0.13], [0.17, 0.09], [0.19, -0.02], [0.13, -0.17], [0.06, -0.2], [0.02, -0.06]], 0.004, mx(c, '#c49a8a', 0.3), 0).position.z = 0.006;
    // Thick rolled rim along the top and outer edge, and a few raised veins
    tube(eg, [[0.01, 0.135, 0.004], [0.09, 0.172, 0.004], [0.19, 0.122, 0.004], [0.232, 0.0, 0.004], [0.2, -0.122, 0.004], [0.14, -0.222, 0.004], [0.08, -0.28, 0.004]], 0.011, 0.007, sh(c, 0.92));
    for (const [a1, b1] of [[0.12, 0.02], [0.09, -0.12], [0.14, 0.09]] as const) tube(eg, [[0.03, 0.0, 0.008], [a1 * 0.6, b1 * 0.6, 0.009], [a1, b1, 0.008]], 0.0045, 0.002, mx(c, '#c49a8a', 0.18));
  }
  const [tip, dir] = tailOf(gp, F, c, 0.26, 0.012, { droop: 0.6, curl: 0, side: 0.06 });
  tuft(gp, '#2b2622', tip, dir, 0.035, 0.009, 5, 0.4);
}

function hippo(gp: THREE.Group, r: Rec): void {
  const c = r.color!, pink = mx(c, '#e7a59a', 0.55);
  const body: Paint = (x, y, z, _nx, ny) => speck(ny < -0.2 ? mx(c, pink, sst(-0.2, -0.7, ny)) : ny > 0.5 ? sh(c, 0.9) : c, x, y, z, 0.04);
  const F = quad(gp, {
    c, span: 0.42, leg: 0.1, bw: 0.16, bh: 0.15, R: 0.048, tuck: 0.02, feet: 'pad', body, legP: body,
    neck: 0.06, neckA: 0.15, neckW: 0.13, stride: 0.02, legX: 0.62,
  });
  const h = headGroup(gp, F, -0.3, 0.08);
  pblob(h, c, 0, 0.0, 0.03, 0.11, 0.095, 0.1, body, [0, 0, 0], 22);
  pblob(h, c, 0, -0.035, 0.14, 0.125, 0.075, 0.09, body, [0, 0, 0], 22);
  pblob(h, pink, 0, -0.08, 0.13, 0.105, 0.03, 0.08, undefined, [0, 0, 0], 16);
  ellip(h, '#4a2f2f', 0, -0.062, 0.15, 0.12, 0.004, 0.08);
  for (const sx of [-1, 1]) {
    pblob(h, c, sx * 0.045, 0.03, 0.19, 0.03, 0.022, 0.025, body, [0, 0, 0], 12);
    ellip(h, '#1c1917', sx * 0.045, 0.048, 0.2, 0.01, 0.006, 0.008, 0, 0, sx * 0.4);
    pblob(h, c, sx * 0.055, 0.075, 0.035, 0.03, 0.026, 0.028, body, [0, 0, 0], 12);
    aEye(h, sx * 0.055, 0.085, 0.055, 0.011, sx * 0.4, '#3a2416', c);
    cupEar(h, [sx * 0.07, 0.09, -0.01], [-0.2, sx * 0.3, -sx * 0.6], 0.014, 0.024, c, pink);
    drop(h, '#f8f0dc', [sx * 0.07, -0.07, 0.19], [sx * 0.075, -0.035, 0.2], 0.009);
  }
  const [tip, dir] = tailOf(gp, F, c, 0.08, 0.016, { droop: 0.6, curl: 0, side: 0 });
  tuft(gp, sh(c, 0.6), tip, dir, 0.02, 0.008, 4, 0.5);
}

function camel(gp: THREE.Group, r: Rec): void {
  const c = r.color!;
  const body = coat(c, mx(c, '#f4e6cc', 0.45), { dorsal: 0.92, n: 0.06 });
  const F = quad(gp, {
    c, span: 0.34, leg: 0.31, bw: 0.1, bh: 0.115, R: 0.026, tuck: 0.22, withers: 0.0, feet: 'cloven', foot: sh(c, 0.72), body, legP: body, legX: 0.62,
    neck: 0.25, neckA: 0.22, neckW: 0.05, neckH: 1.45, arch: -0.14, stride: 0.04,
  });
  // Single dromedary hump
  const hk = num(r.hump, 1);
  pblob(gp, c, 0, F.by + F.bh * 0.85, (F.zs + F.zr) / 2 + 0.01, 0.08, 0.13 * hk, 0.14, body, [0.1, 0, 0], 22);
  // Upward-curving upper neck (S-neck)
  const [, hy, hz] = F.hp;
  sweep(gp, [{ p: [0, hy - 0.02, hz - 0.03], w: 0.036, h: 0.045 }, { p: [0, hy + 0.05, hz + 0.02], w: 0.032, h: 0.036 }, { p: [0, hy + 0.1, hz + 0.03], w: 0.03, h: 0.032 }], c, { radial: 16, sub: 5, paint: body });
  pblob(gp, c, 0, hy - 0.01, hz - 0.025, 0.045, 0.05, 0.05, body, [0, 0, 0], 14);
  const h = grp(gp, [0, hy + 0.1, hz + 0.03], [0.15, -0.3, 0]);
  longHead(h, c, { muz: mx(c, '#e8d4b4', 0.4), lip: true, earH: 0.025, earW: 0.016, len: 1.1, lid: sh(c, 0.8) });
  for (const sx of [-1, 1]) ellip(h, sh(c, 0.85), sx * 0.034, 0.024, 0.034, 0.016, 0.008, 0.016);
  const [tip, dir] = tailOf(gp, F, c, 0.24, 0.011, { droop: 0.6, curl: 0, side: 0.04 });
  tuft(gp, sh(c, 0.6), tip, dir, 0.04, 0.01, 4, 0.4);
  // Knee callosities
  for (const sx of [-1, 1]) ellip(gp, sh(c, 0.82), sx * F.bw * 0.62 * 0.97, 0.31 * 0.42, F.zs - F.bh * 0.08 + sx * 0.04 + 0.02, 0.017, 0.016, 0.007);
}

function llama(gp: THREE.Group, r: Rec): void {
  const c = r.color!;
  const wool: Paint = (x, y, z) => sh(c, 0.88 + fbm(x * 40, y * 40, z * 40) * 0.2);
  const F = quad(gp, {
    c, span: 0.3, leg: 0.3, bw: 0.092, bh: 0.11, R: 0.02, tuck: 0.05, feet: 'cloven', foot: '#4a4440', body: wool, legP: wool, neckP: wool, flat: true,
    neck: 0.3, neckA: 1.28, neckW: 0.042, neckH: 1.15, arch: 0.02, stride: 0.035,
  });
  const h = headGroup(gp, F, -0.35, 0.3);
  pblob(h, c, 0, 0.035, 0.0, 0.045, 0.035, 0.045, wool, [0, 0, 0], 14, true);
  longHead(h, mx(c, '#f8f4ec', 0.3), { len: 0.78, wide: 0.95, muz: sh(c, 0.85), nostril: '#3a302a', earH: 0.085, earW: 0.018, earRot: [-0.1, 0.25, -0.15], earIn: sh(c, 0.7), lip: true });
  // Woolly tuft tail
  const [tip, dir] = tailOf(gp, F, c, 0.12, 0.026, { droop: 0.25, curl: 0, side: 0, lift: -0.3, flat: true, paint: wool });
  tuft(gp, c, tip, dir, 0.03, 0.02, 4, 0.5);
}

function bison(gp: THREE.Group, r: Rec): void {
  const c = r.color!, dark = sh(c, 0.6);
  const body: Paint = (x, y, z) => speck(z > -0.02 ? mx(c, dark, sst(-0.02, 0.12, z)) : c, x, y, z, 0.1);
  const F = quad(gp, {
    c, span: 0.4, leg: 0.21, bw: 0.12, bh: 0.14, R: 0.035, tuck: 0.15, withers: 0.1, rump: 0.02, feet: 'cloven', foot: '#1c1917',
    body, legP: (x, y, z) => speck(z > 0 ? dark : sh(c, 0.82), x, y, z, 0.1), hind: 0.85, fore: 1.15, flat: true,
    neck: 0.1, neckA: -0.35, neckW: 0.1, stride: 0.03,
  });
  // Shaggy shoulder hump & cape
  pblob(gp, dark, 0, F.by + F.bh * 0.9 + F.wd * 0.6, F.zs - 0.04, F.bw * 1.0, F.bh * 1.15, 0.17, furNoise(dark, 0.14), [0.2, 0, 0], 18, true);
  // Shaggy beard/dewlap mass hanging from the throat and chest
  pblob(gp, sh(dark, 0.92), 0, F.by - F.bh * 0.55, F.zs + 0.05, 0.075, 0.09, 0.07, furNoise(dark, 0.16), [0.25, 0, 0], 16, true);
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) drop(gp, sh(dark, 0.9 + i * 0.05), [sx * 0.08, 0.3 - i * 0.035, F.zs - 0.02 - i * 0.012], [sx * 0.09, 0.22 - i * 0.035, F.zs - 0.04 - i * 0.012], 0.034, 0.026);
  const h = headGroup(gp, F, -0.25, 0.25);
  pblob(h, dark, 0, 0.01, 0.04, 0.085, 0.09, 0.08, furNoise(dark, 0.14), [0, 0, 0], 16, true);
  pblob(h, sh(dark, 0.9), 0, 0.06, 0.06, 0.07, 0.05, 0.06, furNoise(dark, 0.18), [0, 0, 0], 12, true);
  sweep(h, [{ p: [0, 0.0, 0.07], w: 0.05, h: 0.05 }, { p: [0, -0.03, 0.12], w: 0.04, h: 0.04 }], sh(c, 0.55), { radial: 14, sub: 4 });
  pblob(h, '#2a2220', 0, -0.035, 0.135, 0.04, 0.032, 0.025, undefined, [0, 0, 0], 12);
  for (const sx of [-1, 1]) {
    ellip(h, '#0f0d0c', sx * 0.015, -0.03, 0.158, 0.007, 0.009, 0.004);
    aEye(h, sx * 0.05, 0.025, 0.09, 0.01, sx * 0.7, '#2a1a10');
    tube(h, [[sx * 0.06, 0.05, 0.04], [sx * 0.1, 0.06, 0.05], [sx * 0.105, 0.1, 0.07]], 0.014, 0.004, '#2a2420');
  }
  tuft(h, dark, [0, -0.07, 0.07], [0, -1, -0.2], 0.08, 0.025, 6, 0.4);
  const [tip, dir] = tailOf(gp, F, c, 0.16, 0.009, { droop: 0.6, curl: 0, side: 0.05 });
  tuft(gp, dark, tip, dir, 0.04, 0.012, 4, 0.4);
}

function reindeer(gp: THREE.Group, r: Rec): void {
  const c = r.color!, cream = '#efe8dc';
  const body = coat(c, mx(c, cream, 0.5), { dorsal: 0.82 });
  const F = quad(gp, {
    c, span: 0.34, leg: 0.3, bw: 0.088, bh: 0.1, R: 0.022, tuck: 0.16, feet: 'cloven', foot: '#2a2420', body,
    legP: (x, y, z) => speck(y < 0.1 ? cream : sh(c, 0.8), x, y, z, 0.05),
    neckP: (x, y, z, _nx, ny) => speck(ny < 0.2 ? cream : mx(c, cream, 0.35), x, y, z, 0.06), neck: 0.2, neckA: 0.82, neckW: 0.05, neckH: 1.25, stride: 0.03,
  });
  // White throat ruff
  const [, ny0, nz0] = F.n0, [, hy, hz] = F.hp;
  for (let i = 0; i < 10; i++) {
    const t = 0.2 + i * 0.07, y = ny0 + (hy - ny0) * t - 0.03, z = nz0 + (hz - nz0) * t + 0.035;
    drop(gp, i % 2 ? cream : '#f8f4ec', [((i % 3) - 1) * 0.02, y, z], [((i % 3) - 1) * 0.025, y - 0.07, z - 0.01], 0.022);
  }
  const h = headGroup(gp, F, -0.28, 0.7);
  longHead(h, c, { muz: '#3f342c', earH: 0.045, earW: 0.02, len: 0.9, wide: 1.05, earIn: cream });
  const ant = '#d8c8a0';
  for (const sx of [-1, 1]) {
    const a: V3 = [sx * 0.02, 0.035, 0.0], b: V3 = [sx * 0.07, 0.12, -0.06], cc: V3 = [sx * 0.1, 0.24, -0.02], d: V3 = [sx * 0.07, 0.31, 0.05];
    tube(h, [a, b, cc, d], 0.01, 0.005, ant);
    tube(h, [b, [sx * 0.04, 0.17, 0.03]], 0.006, 0.004, ant);
    tube(h, [cc, [sx * 0.15, 0.3, -0.05]], 0.006, 0.003, ant);
    tube(h, [cc, [sx * 0.12, 0.33, 0.0]], 0.005, 0.003, ant);
    tube(h, [[sx * 0.025, 0.05, -0.005], [sx * 0.025, 0.08, 0.06], [sx * 0.01, 0.07, 0.1]], 0.006, 0.004, ant);
  }
  const [tip, dir] = tailOf(gp, F, cream, 0.06, 0.018, { droop: 0.4, curl: 0, side: 0, lift: -0.4 });
  tuft(gp, cream, tip, dir, 0.02, 0.012, 3, 0.4);
}

function redpanda(gp: THREE.Group, r: Rec): void {
  const c = r.color!, dk = '#2a1a14', white = '#fbf6ee';
  const fur: Paint = (x, y, z, _nx, ny) => speck(ny < -0.25 ? dk : ny > 0.6 ? sh(c, 0.92) : c, x, y, z, 0.07);
  const F = quad(gp, {
    c, span: 0.3, leg: 0.11, bw: 0.072, bh: 0.078, R: 0.022, tuck: 0.1, feet: 'paw', foot: dk, body: fur, legP: () => dk, flat: true,
    neck: 0.08, neckA: 0.45, neckW: 0.05, stride: 0.03, pawK: 1.1,
  });
  const h = headGroup(gp, F, -0.35, 0.05);
  pblob(h, c, 0, 0.01, 0.035, 0.06, 0.054, 0.058, (x, y, z, nx, ny, nz) => (nz > 0.6 && y > 0.022 && Math.abs(x) > 0.012 && Math.abs(x) < 0.04 ? white : speck(c, x, y, z, 0.05)), [0, 0, 0], 18, true);
  for (const sx of [-1, 1]) {
    pblob(h, white, sx * 0.035, -0.012, 0.06, 0.032, 0.03, 0.03, undefined, [0, 0, 0], 12, true);
    tuft(h, white, [sx * 0.05, -0.02, 0.04], [sx, -0.5, -0.3], 0.03, 0.014, 3, 0.5);
    // Rust "tear" stripe from eye to mouth
    ellip(h, sh(c, 0.85), sx * 0.024, -0.012, 0.085, 0.008, 0.02, 0.006, 0, 0, sx * 0.3);
    aEye(h, sx * 0.024, 0.014, 0.08, 0.0095, sx * 0.3, '#2b160e', c);
    cupEar(h, [sx * 0.042, 0.05, 0.012], [-0.15, sx * 0.3, -sx * 0.55], 0.022, 0.04, white, '#3a2418', true);
  }
  sweep(h, [{ p: [0, -0.002, 0.07], w: 0.026, h: 0.022 }, { p: [0, -0.012, 0.1], w: 0.018, h: 0.016 }], white, { radial: 12, sub: 4 });
  ellip(h, dk, 0, -0.006, 0.112, 0.01, 0.007, 0.007);
  // Long bushy ringed tail
  const [x0, y0, z0] = F.tail0;
  sweep(gp, [
    { p: [x0, y0, z0], w: 0.032 }, { p: [0.02, y0 - 0.04, z0 - 0.1], w: 0.046 },
    { p: [0.06, y0 - 0.05, z0 - 0.22], w: 0.046 }, { p: [0.1, y0 - 0.02, z0 - 0.32], w: 0.036 }, { p: [0.12, y0 + 0.03, z0 - 0.37], w: 0.016 },
  ], c, { radial: 16, sub: 8, flat: true, paint: (x, y, z) => speck(Math.sin((z - z0) * 50 + x * 10) > 0.25 ? '#efcc9e' : sh(c, 0.92), x, y, z, 0.06) });
}

/** Bears share the quadruped engine with plantigrade paws and claws. */
function bear(gp: THREE.Group, r: Rec, sp: string): void {
  const c = r.color!;
  const panda = sp === 'panda', polar = sp === 'polarbear';
  const blk = (r.patch as string) ?? '#1c1917';
  const pandaP: Paint = (x, y, z, _nx, ny) => {
    // Black limbs joined by a saddle band over the shoulders
    const band = Math.abs(z - 0.13 + (y - 0.3) * 0.25) < 0.065;
    return band || (y < 0.2 && ny < 0.8) ? blk : speck(c, x, y, z, 0.03);
  };
  const body = panda ? pandaP : polar ? coat(c, sh(c, 0.93), { dorsal: 1.0, n: 0.04 }) : coat(c, sh(c, 0.85), { dorsal: 0.78, n: 0.1 });
  const F = quad(gp, {
    c, span: polar ? 0.44 : 0.4, leg: polar ? 0.2 : 0.17, bw: 0.125, bh: 0.13, R: 0.04, tuck: 0.05, rump: polar ? -0.03 : 0, withers: sp === 'grizzly' ? 0.035 : 0,
    feet: 'paw', foot: panda ? blk : sh(c, 0.8), claw: polar ? '#3a332c' : panda ? '#2a2a2a' : '#e9dcc4', pawK: 1.15, hind: 0.95,
    body, legP: panda ? () => blk : body, flat: sp === 'grizzly',
    neck: polar ? 0.17 : 0.1, neckA: polar ? 0.25 : 0.35, neckW: polar ? 0.07 : 0.085, stride: 0.035,
  });
  if (sp === 'grizzly') pblob(gp, c, 0, F.by + F.bh * 0.85, F.zs - 0.04, 0.085, 0.07, 0.1, furNoise(sh(c, 0.92), 0.1), [0, 0, 0], 14, true);
  const h = headGroup(gp, F, -0.3, polar ? 0.25 : 0.12);
  bearHead(h, c, {
    s: polar ? 0.92 : panda ? 1.12 : 1, long: polar ? 1.35 : panda ? 0.75 : 1.1,
    ear: panda ? blk : c, earIn: panda ? blk : sh(c, 0.7), muz: panda ? '#f5f5f4' : polar ? sh(c, 0.97) : mx(c, '#d6c3a5', 0.3),
    P: panda ? furNoise(c, 0.03) : furNoise(c, polar ? 0.04 : 0.08),
  });
  if (panda) {
    for (const sx of [-1, 1]) {
      ellip(h, blk, sx * 0.042, 0.027, 0.105, 0.025, 0.033, 0.016, 0, 0, sx * 0.7);
      bead(h, sx * 0.043, 0.03, 0.118, 0.0085, '#0f0f0f');
    }
    // Bamboo snack held in the mouth
    const bam = '#7cb342';
    tube(h, [[-0.13, -0.05, 0.14], [0.15, 0.0, 0.11]], 0.011, 0.011, bam, { paint: (x) => (Math.abs(Math.sin(x * 40)) < 0.14 ? '#558b2f' : null) });
    for (let i = 0; i < 3; i++) leaf(h, i % 2 ? '#8bc34a' : '#9ccc65', 0.15, 0.0, 0.11, 0.016, 0.07, [0.3 * i, 0, -0.9 - i * 0.5], 0.004, 0.2);
  }
  const [tip] = tailOf(gp, F, panda ? c : c, 0.05, 0.026, { droop: 0.5, curl: 0, side: 0, lift: -0.3 });
  ellip(gp, c, tip[0], tip[1], tip[2], 0.024);
}

const quadBuilder: Builder = (gp, r) => {
  const sp = (r.sp as string) ?? '';
  switch (sp) {
    case 'lion': return lion(gp, r);
    case 'tiger': case 'jaguar': case 'snowleopard': return bigcat(gp, r, sp);
    case 'zebra': return zebra(gp, r);
    case 'giraffe': return giraffe(gp, r);
    case 'elephant': return elephant(gp, r);
    case 'hippo': return hippo(gp, r);
    case 'camel': return camel(gp, r);
    case 'llama': return llama(gp, r);
    case 'bison': return bison(gp, r);
    case 'reindeer': return reindeer(gp, r);
    case 'redpanda': return redpanda(gp, r);
    default: return lion(gp, r);
  }
};

const BEAR: Builder = (gp, r) => {
  const c = r.color!, sp = (r.sp as string) ?? '';
  if (sp === 'koala') {
    // Koala hugging a eucalyptus trunk
    const wood = '#8b7355';
    tube(gp, [[0, 0, -0.05], [0.01, 0.5, -0.06], [-0.01, 1.0, -0.05]], 0.07, 0.055, wood, { paint: furNoise(wood, 0.1), flat: true });
    for (const [y, sx] of [[0.82, 1], [0.95, -1]] as const) {
      tube(gp, [[0, y, -0.05], [sx * 0.15, y + 0.08, -0.04], [sx * 0.24, y + 0.1, -0.02]], 0.018, 0.01, wood);
      for (let i = 0; i < 4; i++) leaf(gp, i % 2 ? '#6b9e7a' : '#7fb08c', sx * (0.14 + i * 0.03), y + 0.08 + (i % 2) * 0.02, -0.03, 0.025, 0.07, [0.3, 0, sx * (1.2 + i * 0.2)], 0.006, 0.2);
    }
    const fur = furNoise(c, 0.08);
    pblob(gp, c, 0, 0.42, 0.07, 0.13, 0.17, 0.11, (x, y, z, nx, ny, nz) => (nz > 0.5 && y < 0.48 ? '#e7e2da' : fur(x, y, z, nx, ny, nz)), [0, 0, 0], 18, true);
    pblob(gp, c, 0, 0.63, 0.1, 0.11, 0.095, 0.095, fur, [0, 0, 0], 18, true);
    ellip(gp, '#2a2420', 0, 0.615, 0.2, 0.03, 0.042, 0.025);
    for (const sx of [-1, 1]) {
      pblob(gp, c, sx * 0.11, 0.7, 0.08, 0.06, 0.06, 0.03, (_x, _y, _z, _nx, _ny, nz) => (nz > 0.3 ? '#f5f3ef' : null), [0, 0, 0], 14, true);
      bead(gp, sx * 0.045, 0.645, 0.18, 0.011);
      tube(gp, [[sx * 0.1, 0.5, 0.1], [sx * 0.11, 0.55, 0.0], [sx * 0.05, 0.56, -0.05]], 0.035, 0.028, c, { paint: fur, flat: true });
      tube(gp, [[sx * 0.09, 0.3, 0.08], [sx * 0.12, 0.3, 0.0], [sx * 0.05, 0.28, -0.04]], 0.04, 0.03, c, { paint: fur, flat: true });
    }
    return;
  }
  bear(gp, r, sp);
};

function branchPerch(gp: THREE.Group, y: number, len = 0.7): void {
  const wood = '#6b4c35';
  tube(gp, [[-len / 2, y, 0], [-len / 6, y + 0.02, 0.01], [len / 6, y - 0.01, -0.01], [len / 2, y + 0.02, 0]], 0.03, 0.022, wood, { paint: furNoise(wood, 0.12), flat: true });
  for (const sx of [-1, 1]) {
    tube(gp, [[sx * len * 0.42, 0, 0], [sx * len * 0.44, y * 0.5, 0.01], [sx * len * 0.45, y + 0.02, 0]], 0.04, 0.028, wood, { paint: furNoise(wood, 0.12), flat: true });
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1 + sx;
      pblob(gp, i % 2 ? '#4d8a54' : '#5f9d63', sx * len * 0.45 + Math.cos(a) * 0.05, y + 0.08 + i * 0.03, Math.sin(a) * 0.05, 0.075, 0.06, 0.075, undefined, [0, a, 0], 10, true);
    }
  }
}

const APE: Builder = (gp, r) => {
  const c = r.color!, sp = (r.sp as string) ?? 'gorilla';
  if (sp === 'sloth') {
    // Three-toed sloth hanging beneath a branch
    branchPerch(gp, 0.82, 0.8);
    const fur = furNoise(c, 0.1);
    pblob(gp, c, 0, 0.6, 0, 0.13, 0.11, 0.17, fur, [0.1, 0, 0], 18, true);
    pblob(gp, c, 0, 0.6, 0.18, 0.075, 0.07, 0.07, fur, [0, 0, 0], 16, true);
    ellip(gp, '#efe4cf', 0, 0.59, 0.235, 0.055, 0.05, 0.03);
    for (const sx of [-1, 1]) {
      ellip(gp, '#3b2a1e', sx * 0.022, 0.6, 0.26, 0.022, 0.011, 0.008, 0, 0, sx * 0.25);
      bead(gp, sx * 0.022, 0.602, 0.265, 0.007);
      for (const zz of [0.1, -0.12]) {
        tube(gp, [[sx * 0.09, 0.62, zz], [sx * 0.08, 0.72, zz + 0.02], [sx * 0.05, 0.8, zz + 0.02]], 0.03, 0.022, c, { paint: fur, flat: true });
        for (const k of [-1, 0, 1]) tube(gp, [[sx * 0.05 + k * 0.01, 0.8, zz + 0.02], [sx * 0.04 + k * 0.01, 0.86, zz + 0.04], [sx * 0.03 + k * 0.01, 0.84, zz + 0.06]], 0.005, 0.003, '#e7dccb');
      }
    }
    ellip(gp, '#1c1917', 0, 0.585, 0.268, 0.012, 0.009, 0.006);
    return;
  }
  const isGor = sp === 'gorilla';
  const face = isGor ? '#2b2a2e' : '#9a6a50';
  const fur = furNoise(c, isGor ? 0.07 : 0.1);
  const silver = '#a7a9ad';
  const P: Paint = isGor
    ? (x, y, z, nx, ny, nz) => (ny > 0.25 && z < 0.02 && z > -0.2 && y > 0.36 ? speck(mx(c, silver, sst(0.3, 0.75, ny) * sst(0.04, -0.06, z) * sst(-0.2, -0.1, z) * sst(0.12, 0.05, Math.abs(x)) * 0.65), x, y, z, 0.08) : fur(x, y, z, nx, ny, nz))
    : (x, y, z) => speck(sh(c, 0.9 + Math.round(vnoise(x * 16, y * 4, z * 16) * 6) * 0.03), x, y, z, 0.05);
  // Knuckle-walking torso: low rump rising to a massive chest and shoulder hump
  sweep(gp, [
    { p: [0, 0.34, -0.2], w: 0.07, h: 0.07 },
    { p: [0, 0.37, -0.14], w: 0.13, h: 0.12 },
    { p: [0, 0.42, -0.04], w: 0.16, h: 0.15 },
    { p: [0, 0.48, 0.06], w: 0.19, h: 0.17 },
    { p: [0, 0.5, 0.14], w: 0.16, h: 0.14 },
    { p: [0, 0.5, 0.19], w: 0.08, h: 0.08 },
  ], c, { radial: 24, sub: 6, paint: P });
  // Trapezius hump behind the head, pecs and deltoids
  pblob(gp, c, 0, 0.6, 0.11, 0.12, 0.08, 0.1, P, [0.3, 0, 0], 18);
  pblob(gp, c, 0, 0.36, -0.17, 0.11, 0.1, 0.075, P, [0.3, 0, 0], 16); // rounded rump
  const arm = isGor ? 1 : 1.12;
  for (const sx of [-1, 1]) {
    const k = sx > 0 ? 1 : 0.94; // slight weight shift
    pblob(gp, c, sx * 0.17, 0.5, 0.13, 0.09, 0.1, 0.095, P, [0, 0, sx * 0.3], 18);
    pblob(gp, sh(c, 0.92), sx * 0.08, 0.4, 0.21, 0.08, 0.07, 0.04, P, [0.3, 0, 0], 14);
    // Arm: deltoid → thick biceps → narrow elbow → bulging forearm → wrist → knuckle-walking fist
    const sy = (y: number) => 0.08 + (y - 0.08) * arm;
    const wr: V3 = [sx * 0.232, 0.085, 0.205 + 0.03 * k];
    limb(gp, c, [
      [[sx * 0.185, 0.51, 0.13], 0.05, 0.055],
      [[sx * 0.222, sy(0.45), 0.138], 0.07, 0.076],
      [[sx * 0.242, sy(0.38), 0.146], 0.06, 0.064],
      [[sx * 0.25, sy(0.315), 0.155 + 0.01 * k], 0.046, 0.05],
      [[sx * 0.252, sy(0.25), 0.168 + 0.02 * k], 0.06, 0.064],
      [[sx * 0.248, sy(0.18), 0.183 + 0.025 * k], 0.054, 0.056],
      [[sx * 0.24, sy(0.12), 0.196 + 0.03 * k], 0.04, 0.042],
      [wr, 0.034, 0.036],
    ], P, 18);
    pblob(gp, c, sx * 0.258, sy(0.315), 0.128 + 0.01 * k, 0.036, 0.04, 0.03, P, [0, 0, 0], 12); // elbow point
    if (!isGor) for (let i = 0; i < 4; i++) clump(gp, sh(c, 0.85 + i * 0.05), [sx * 0.27, 0.42 - i * 0.07, 0.14], [sx * 0.29, 0.34 - i * 0.07, 0.11], 0.03, 0.02);
    // Fist resting on the middle finger segments, knuckles forward
    pblob(gp, face, wr[0], 0.045, wr[2] + 0.012, 0.044, 0.04, 0.042, undefined, [0.2, 0, 0], 16);
    for (let i = 0; i < 4; i++) pblob(gp, sh(face, 1.12), wr[0] + (i - 1.5) * 0.02 * sx, 0.022, wr[2] + 0.042 - Math.abs(i - 1.5) * 0.004, 0.012, 0.018, 0.014, undefined, [0.3, 0, 0], 10);
    pblob(gp, sh(face, 1.05), wr[0] - sx * 0.036, 0.05, wr[2] + 0.02, 0.012, 0.022, 0.013, undefined, [0.4, 0, sx * 0.3], 10); // thumb
    // Short, heavily muscled legs with flat-footed stance
    const hip: V3 = [sx * 0.12, 0.36, -0.14], kn: V3 = [sx * 0.17, 0.22, -0.05 - 0.03 * k], an: V3 = [sx * 0.15, 0.06, -0.15];
    pblob(gp, c, sx * 0.12, 0.35, -0.13, 0.085, 0.1, 0.105, P, [0, 0, 0], 18);
    limb(gp, c, [[hip, 0.072, 0.082], [[sx * 0.15, 0.29, -0.08], 0.068, 0.07], [kn, 0.055, 0.056], [[sx * 0.168, 0.15, -0.1], 0.054, 0.056], [[sx * 0.158, 0.09, -0.135], 0.04, 0.042], [an, 0.036, 0.038]], P, 16);
    pblob(gp, face, an[0], 0.03, an[2] + 0.03, 0.045, 0.03, 0.075, undefined, [0, sx * 0.15, 0], 14);
  }
  // Head jutting forward from the shoulders
  const h = grp(gp, [0, 0.58, 0.24], [0.12, -0.32, 0.05]);
  pblob(h, c, 0, 0.0, -0.01, 0.08, 0.08, 0.075, P, [0, 0, 0], 18);
  if (isGor) pblob(h, c, 0, 0.07, -0.04, 0.045, 0.07, 0.07, P, [-0.4, 0, 0], 16); // sagittal crest
  else for (const sx of [-1, 1]) pblob(h, sh(face, 0.9), sx * 0.075, -0.01, 0.03, 0.05, 0.075, 0.022, undefined, [0, sx * 0.3, 0], 14); // cheek flanges
  pblob(h, face, 0, -0.012, 0.05, 0.062, 0.062, 0.04, undefined, [0, 0, 0], 16);
  pblob(h, sh(face, 0.85), 0, 0.03, 0.068, 0.068, 0.02, 0.03, undefined, [0.2, 0, 0], 14); // brow ridge
  pblob(h, sh(face, 1.08), 0, -0.042, 0.075, 0.05, 0.035, 0.035, undefined, [0, 0, 0], 14); // muzzle
  ellip(h, sh(face, 1.2), 0, 0.0, 0.098, 0.026, 0.02, 0.012); // broad nose
  for (const sx of [-1, 1]) {
    ellip(h, '#0d0c0c', sx * 0.011, -0.006, 0.106, 0.008, 0.006, 0.004, 0, 0, sx * 0.4);
    aEye(h, sx * 0.027, 0.014, 0.083, 0.0085, sx * 0.3, '#3b1d0e', sh(face, 0.85));
    ellip(h, face, sx * 0.07, 0.0, 0.0, 0.014, 0.02, 0.01, sx * 0.4);
  }
  ellip(h, '#141212', 0, -0.06, 0.098, 0.03, 0.003, 0.012);
};

const HOPPER: Builder = (gp, r) => {
  const c = r.color!, belly = mx(c, '#f3e3cc', 0.62);
  const body = coat(c, belly, { dorsal: 0.86, hi: 0.25, lo: -0.4, n: 0.05 });
  const front: Paint = (x, y, z, nx, ny, nz) => (nz > 0.35 && y > 0.16 && y < 0.56 ? speck(mx(c, belly, sst(0.35, 0.7, nz)), x, y, z, 0.04) : body(x, y, z, nx, ny, nz));
  // Upright torso leaning forward: pear-shaped, heavy hips, narrow chest
  sweep(gp, [
    { p: [0, 0.16, -0.08], w: 0.07, h: 0.07 },
    { p: [0, 0.24, -0.04], w: 0.11, h: 0.11 },
    { p: [0, 0.36, 0.01], w: 0.1, h: 0.1 },
    { p: [0, 0.48, 0.05], w: 0.075, h: 0.072 },
    { p: [0, 0.58, 0.08], w: 0.048, h: 0.05 },
    { p: [0, 0.64, 0.1], w: 0.038, h: 0.04 },
  ], c, { radial: 22, sub: 6, paint: front, up: [0, 0, 1] });
  // Joey peeking from the pouch
  pblob(gp, belly, 0, 0.27, 0.085, 0.07, 0.05, 0.032, undefined, [0, 0, 0], 14);
  const jh = grp(gp, [0.005, 0.325, 0.1], [0.2, -0.3, 0.1]);
  pblob(jh, c, 0, 0, 0, 0.03, 0.028, 0.03, body, [0, 0, 0], 12);
  pblob(jh, c, 0, -0.006, 0.03, 0.016, 0.014, 0.022, body, [0, 0, 0], 10);
  ellip(jh, '#2a1d14', 0, -0.002, 0.051, 0.006, 0.005, 0.004);
  for (const sx of [-1, 1]) { bead(jh, sx * 0.014, 0.008, 0.024, 0.005); drop(jh, c, [sx * 0.014, 0.02, -0.006], [sx * 0.024, 0.055, -0.012], 0.01, 0.005); }
  const fc = sh(c, 0.6);
  for (const sx of [-1, 1]) {
    const k = sx > 0 ? 1 : 0.96;
    // Massive thigh, reverse-angled shin, long hind foot
    pblob(gp, c, sx * 0.08, 0.2, -0.01, 0.06, 0.1, 0.13, body, [0.55, 0, 0], 16);
    limb(gp, c, [
      [[sx * 0.09, 0.15, 0.07 * k], 0.045, 0.05],
      [[sx * 0.095, 0.09, -0.01], 0.03, 0.032],
      [[sx * 0.09, 0.04, -0.08], 0.024, 0.026],
    ], body, 12);
    limb(gp, sh(c, 0.92), [
      [[sx * 0.088, 0.03, -0.09], 0.026, 0.024],
      [[sx * 0.085, 0.022, 0.0], 0.026, 0.02],
      [[sx * 0.082, 0.016, 0.09 * k], 0.02, 0.014],
      [[sx * 0.08, 0.012, 0.14 * k], 0.012, 0.008],
    ], body, 10);
    drop(gp, fc, [sx * 0.08, 0.012, 0.13 * k], [sx * 0.08, 0.004, 0.165 * k], 0.008);
    // Short forearms held in front, little hands
    limb(gp, c, [[[sx * 0.065, 0.52, 0.08], 0.022, 0.024], [[sx * 0.08, 0.44, 0.13], 0.016, 0.017], [[sx * 0.06, 0.41 + (k - 1) * 0.3, 0.16], 0.011, 0.011]], front, 10);
    pblob(gp, fc, sx * 0.058, 0.405 + (k - 1) * 0.3, 0.165, 0.014, 0.01, 0.014, undefined, [0, 0, 0], 10);
  }
  // Thick muscular tail sweeping back to the ground
  sweep(gp, [{ p: [0, 0.17, -0.1], w: 0.05 }, { p: [0, 0.08, -0.2], w: 0.038 }, { p: [0.02, 0.025, -0.34], w: 0.025 }, { p: [0.04, 0.018, -0.46], w: 0.012 }], c,
    { radial: 12, sub: 5, paint: body });
  // Head: deer-like face, big mobile ears
  const h = grp(gp, [0, 0.66, 0.11], [0.15, -0.35, 0.06]);
  pblob(h, c, 0, 0.0, 0.0, 0.042, 0.04, 0.048, body, [0, 0, 0], 14);
  const hl = longHead(h, c, { s: 0.85, len: 0.82, wide: 1.05, P: body, muz: sh(c, 0.85), nostril: '#2a1d14', earH: 0.11, earW: 0.028, earRot: [-0.15, 0.3, -0.35], earIn: belly, iris: '#2b1a10' });
  ellip(h, '#3a2a20', 0, -0.012, hl.tip + 0.026, 0.018, 0.012, 0.008);
};

const PENGUIN: Builder = (gp, r) => {
  const small = Boolean(r.small), s = small ? 0.78 : 1;
  const back = r.color!, belly = (r.belly as string) ?? '#f8fafc', acc = r.accent ?? '#f59e0b';
  if (small) {
    // Puffin on a sea-cliff rock
    pblob(gp, '#78716c', 0, 0.04, 0, 0.26, 0.09, 0.22, furNoise('#78716c', 0.12), [0, 0.4, 0], 12, true);
  }
  const by = small ? 0.11 : 0;
  const paint: Paint = (x, y, z, _nx, _ny, nz) => {
    const fy = (y - by) / s;
    if (small && fy > 0.5 && nz > -0.2 && Math.abs(x) > 0.02) return '#f5f5f4';
    if (!small && nz > -0.45 && ((Math.abs(x) / s - 0.075) / 0.028) ** 2 + ((fy - 0.665) / 0.045) ** 2 < 1) return mix(acc, '#fde68a', 0.3);
    if (nz > 0.18 && fy < (small ? 0.48 : 0.62)) return !small && fy > 0.5 ? mix(belly, acc, 0.35) : belly;
    return null;
  };
  sweep(gp, [
    { p: [0, by + 0.03 * s, -0.02 * s], w: 0.08 * s, h: 0.07 * s },
    { p: [0, by + 0.16 * s, 0], w: 0.16 * s, h: 0.14 * s },
    { p: [0, by + 0.36 * s, 0.01 * s], w: 0.15 * s, h: 0.13 * s },
    { p: [0, by + 0.55 * s, 0.02 * s], w: 0.105 * s, h: 0.1 * s },
    { p: [0, by + 0.68 * s, 0.03 * s], w: 0.095 * s, h: 0.095 * s },
    { p: [0, by + 0.78 * s, 0.03 * s], w: 0.06 * s, h: 0.06 * s },
  ], back, { radial: 44, sub: 12, paint, up: [0, 0, 1] });
  const hy = by + 0.7 * s, hz = 0.03 * s;
  pblob(gp, back, 0, by + 0.735 * s, 0.03 * s, 0.085 * s, 0.075 * s, 0.09 * s, paint, [0, 0, 0], 34);
  for (const sx of [-1, 1]) {
    bead(gp, sx * 0.052 * s, hy + 0.022 * s, hz + 0.062 * s, 0.011 * s, small ? '#1c1917' : '#2b1d14');
    if (small) ellip(gp, '#e11d48', sx * 0.052 * s, hy + 0.022 * s, hz + 0.058 * s, 0.015 * s, 0.015 * s, 0.006 * s);
    // Tapered flipper hanging from the shoulder
    sweep(gp, [
      { p: [sx * 0.125 * s, by + 0.56 * s, 0.0], w: 0.045 * s, h: 0.02 * s },
      { p: [sx * 0.165 * s, by + 0.4 * s, -0.01 * s], w: 0.05 * s, h: 0.016 * s },
      { p: [sx * 0.185 * s, by + 0.24 * s, -0.03 * s], w: 0.032 * s, h: 0.011 * s },
      { p: [sx * 0.19 * s, by + 0.16 * s, -0.045 * s], w: 0.01 * s, h: 0.006 * s },
    ], back, { radial: 14, sub: 6, up: [0, 0, 1], paint: (_x, _y, _z, nx) => (nx * sx < -0.4 ? belly : null) });
    pblob(gp, acc, sx * 0.055 * s, by + 0.012, 0.05 * s, 0.04 * s, 0.014, 0.065 * s, undefined, [0, sx * 0.25, 0], 12);
  }
  if (small) {
    // Puffin's tall striped triangular beak
    sweep(gp, [{ p: [0, hy - 0.01, hz + 0.07], w: 0.022, h: 0.05 }, { p: [0, hy - 0.02, hz + 0.12], w: 0.014, h: 0.035 }, { p: [0, hy - 0.03, hz + 0.16], w: 0.004, h: 0.01 }],
      '#ef6c00', { radial: 10, sub: 5, paint: (_x, _y, z) => (z < hz + 0.085 ? '#64748b' : z < hz + 0.095 ? '#fde047' : null) });
  } else {
    sweep(gp, [{ p: [0, hy, hz + 0.08], w: 0.02, h: 0.016 }, { p: [0, hy - 0.015, hz + 0.15], w: 0.01, h: 0.009 }, { p: [0, hy - 0.03, hz + 0.19], w: 0.002 }],
      '#1c1917', { radial: 10, sub: 5, paint: (_x, y) => (y < hy - 0.006 ? acc : null) });
  }
};

const WADER: Builder = (gp, r) => {
  const c = r.color!, deep = mx(c, '#e0446a', 0.45), pale = mx(c, '#ffe4ea', 0.4);
  // Shallow lagoon with ripple rings around the standing leg
  pblob(gp, '#5fb3c9', 0, 0, 0, 0.3, 0.01, 0.26, (x, _y, z) => (Math.sin(Math.hypot(x - 0.03, z - 0.02) * 70) > 0.85 ? '#9ad7e6' : null), [0, 0, 0], 24);
  const by = 0.6;
  // Body: plump teardrop, pinker on the back; wing coverts rimmed deep pink, black primaries folded at the rear
  const body: Paint = (x, y, z, _nx, ny) => {
    const side = Math.abs(x) > 0.06 && ny > -0.25 && y > by - 0.04;
    if (side && z < -0.06 && y < by + 0.04) return '#1c1917';
    if (side) return speck(mx(c, deep, sst(0.0, -0.12, z) * 0.6 + 0.3), x, y, z, 0.05);
    return ny < -0.3 ? pale : speck(c, x, y, z, 0.03);
  };
  sweep(gp, [
    { p: [0, by + 0.05, -0.24], w: 0.012, h: 0.01 }, { p: [0, by + 0.035, -0.17], w: 0.06, h: 0.04 },
    { p: [0, by + 0.01, -0.06], w: 0.105, h: 0.085 }, { p: [0, by + 0.02, 0.05], w: 0.095, h: 0.085 }, { p: [0, by + 0.06, 0.12], w: 0.05, h: 0.05 },
  ], c, { radial: 20, sub: 6, paint: body });
  // Layered scapular feathers fanning over the rump
  for (let i = 0; i < 7; i++) {
    const sx = i % 2 ? 1 : -1, t = Math.floor(i / 2);
    clump(gp, mx(c, deep, 0.25 + t * 0.12), [sx * (0.04 + t * 0.01), by + 0.07, -0.02 - t * 0.04], [sx * (0.05 + t * 0.012), by + 0.06, -0.1 - t * 0.045], 0.03, 0.012);
  }
  // Long S-curved neck
  sweep(gp, [
    { p: [0, by + 0.05, 0.11], w: 0.032 }, { p: [0, by + 0.15, 0.19], w: 0.022 }, { p: [0, by + 0.27, 0.15], w: 0.019 },
    { p: [0, by + 0.38, 0.07], w: 0.019 }, { p: [0, by + 0.47, 0.08], w: 0.021 }, { p: [0, by + 0.52, 0.12], w: 0.026 },
  ], c, { radial: 12, sub: 6, paint: (x, y, z) => speck(c, x, y, z, 0.03) });
  // Head turned slightly, bent banana beak with pale base and black tip
  const h = grp(gp, [0, by + 0.53, 0.13], [0.1, -0.35, 0]);
  pblob(h, c, 0, 0, 0, 0.032, 0.03, 0.04, undefined, [0, 0, 0], 14);
  sweep(h, [{ p: [0, 0.0, 0.03], w: 0.017, h: 0.016 }, { p: [0, -0.004, 0.07], w: 0.015, h: 0.018 }, { p: [0, -0.03, 0.095], w: 0.011, h: 0.012 }, { p: [0, -0.058, 0.09], w: 0.004, h: 0.005 }],
    '#fde7ef', { radial: 10, sub: 5, paint: (_x, y, z) => (y < -0.022 || (z > 0.085 && y < -0.01) ? '#1c1917' : null) });
  for (const sx of [-1, 1]) { bead(h, sx * 0.024, 0.008, 0.016, 0.0065, '#fbbf24'); ellip(h, '#111', sx * 0.0255, 0.008, 0.019, 0.003); }
  // Standing leg: thigh hidden in body, backward-bending ankle joint, long tarsus, webbed foot
  const leg = '#e86a8a', jnt = sh(leg, 0.85);
  limb(gp, leg, [[[0.03, by - 0.04, -0.01], 0.016, 0.018], [[0.03, 0.34, 0.01], 0.0095, 0.0095], [[0.03, 0.31, 0.0], 0.0125, 0.0135], [[0.03, 0.16, 0.0], 0.009, 0.009], [[0.03, 0.015, 0.015], 0.008, 0.008]], undefined, 8);
  ellip(gp, jnt, 0.03, 0.315, 0.004, 0.014, 0.016, 0.014);
  for (const a of [-0.5, 0, 0.5]) drop(gp, leg, [0.03, 0.01, 0.02], [0.03 + Math.sin(a) * 0.05, 0.006, 0.02 + Math.cos(a) * 0.05], 0.009, 0.004);
  pblob(gp, mx(leg, '#fde7ef', 0.2), 0.03, 0.007, 0.045, 0.034, 0.004, 0.032, undefined, [0, 0, 0], 10);
  // Tucked leg folded up under the body
  limb(gp, leg, [[[-0.03, by - 0.04, -0.01], 0.014, 0.016], [[-0.035, 0.42, 0.02], 0.009, 0.009], [[-0.035, 0.47, -0.12], 0.008, 0.008]], undefined, 8);
  ellip(gp, jnt, -0.035, 0.42, 0.02, 0.013, 0.014, 0.013);
};

const FLYER: Builder = (gp, r) => {
  const c = r.color!, hd = (r.head as string) ?? '#ffffff', beak = '#f5b20b';
  const bird = new THREE.Group(); bird.position.y = 0.5; bird.name = 'flap'; gp.add(bird);
  const plumage = (x: number, y: number, z: number) => speck(c, x, y, z, 0.07);
  // Streamlined body, white head and neck ruff blending into the dark mantle
  sweep(bird, [
    { p: [0, 0, -0.2], w: 0.035, h: 0.02 }, { p: [0, 0, -0.12], w: 0.07, h: 0.06 },
    { p: [0, 0.01, 0.0], w: 0.085, h: 0.08 }, { p: [0, 0.03, 0.12], w: 0.065, h: 0.065 }, { p: [0, 0.05, 0.18], w: 0.05, h: 0.05 },
  ], c, { radial: 18, sub: 6, paint: (x, y, z) => (z > 0.13 + hash3(x * 50, y * 50, 1) * 0.03 ? hd : plumage(x, y, z)) });
  const h = grp(bird, [0, 0.06, 0.2], [0.05, -0.3, 0.08]);
  pblob(h, hd, 0, 0, 0, 0.052, 0.048, 0.06, (x, y, z) => speck(hd, x, y, z, 0.03), [0, 0, 0], 16);
  pblob(h, hd, 0, 0.018, 0.035, 0.045, 0.018, 0.03, undefined, [0.2, 0, 0], 12); // heavy brow
  // Hooked yellow beak with cere
  sweep(h, [{ p: [0, 0.0, 0.04], w: 0.02, h: 0.024 }, { p: [0, 0.002, 0.07], w: 0.015, h: 0.022 }, { p: [0, -0.008, 0.095], w: 0.01, h: 0.016 }, { p: [0, -0.03, 0.1], w: 0.004, h: 0.005 }],
    beak, { radial: 10, sub: 5 });
  ellip(h, sh(beak, 0.9), 0, -0.012, 0.06, 0.016, 0.006, 0.026);
  for (const sx of [-1, 1]) {
    aEye(h, sx * 0.034, 0.01, 0.038, 0.0095, sx * 0.85, '#f2c230', hd);
    ellip(h, sh(beak, 0.75), sx * 0.012, 0.005, 0.075, 0.003, 0.002, 0.004);
  }
  // Broad wings: arm/hand loft with trailing secondaries and splayed primary "fingers"
  for (const sx of [-1, 1]) {
    sweep(bird, [
      { p: [sx * 0.04, 0.03, -0.01], w: 0.1, h: 0.028 }, { p: [sx * 0.2, 0.06, 0.0], w: 0.1, h: 0.018 },
      { p: [sx * 0.34, 0.08, 0.0], w: 0.075, h: 0.012 }, { p: [sx * 0.42, 0.085, -0.01], w: 0.045, h: 0.008 },
    ], c, { radial: 12, sub: 5, paint: (x, y, z) => (z < -0.05 && Math.sin(x * 140) > 0.5 ? sh(c, 0.78) : z > 0.06 ? sh(c, 1.18) : plumage(x, y, z)) });
    for (let i = 0; i < 9; i++) {
      const x = sx * (0.06 + i * 0.038);
      drop(bird, sh(c, 0.8 + (i % 2) * 0.08), [x, 0.035 + i * 0.005, -0.06], [x + sx * 0.012, 0.03 + i * 0.005, -0.14 + i * 0.004], 0.024, 0.006);
    }
    for (let i = 0; i < 6; i++) {
      const a = -0.35 + i * 0.16;
      const b0: V3 = [sx * 0.4, 0.085, -0.01 - i * 0.01];
      drop(bird, sh(c, 0.62 + i * 0.03), b0, [b0[0] + sx * Math.cos(a) * 0.15, 0.1 + i * 0.006, b0[2] + Math.sin(a) * 0.15], 0.006, 0.017);
    }
    // Yellow feet tucked under the tail, black talons
    limb(bird, beak, [[[sx * 0.035, -0.04, -0.06], 0.012, 0.012], [[sx * 0.035, -0.06, -0.1], 0.01, 0.01]], undefined, 8);
    for (const a of [-0.4, 0, 0.4]) drop(bird, '#1c1917', [sx * 0.035, -0.062, -0.1], [sx * 0.035 + Math.sin(a) * 0.02, -0.075, -0.1 - Math.cos(a) * 0.015], 0.004);
  }
  // White fanned tail
  for (let i = 0; i < 7; i++) {
    const a = (i - 3) * 0.13;
    drop(bird, mx(hd, '#e5e7eb', (i % 2) * 0.5), [Math.sin(a) * 0.01, 0.0, -0.17], [Math.sin(a) * 0.1, -0.008, -0.17 - Math.cos(a) * 0.13], 0.024, 0.006);
  }
};

const ROUNDBIRD: Builder = (gp, r) => {
  const c = r.color!;
  pblob(gp, c, 0, 0.26, -0.02, 0.2, 0.18, 0.24, (x, y, z) => speck(c, x * 1.6, y * 1.6, z * 1.6, 0.12), [0, 0, 0], 22);
  pblob(gp, c, 0, 0.36, 0.17, 0.085, 0.08, 0.09, (x, y, z) => speck(c, x * 1.6, y * 1.6, z * 1.6, 0.1), [0, 0, 0], 16);
  for (const sx of [-1, 1]) bead(gp, sx * 0.05, 0.38, 0.235, 0.009);
  sweep(gp, [{ p: [0, 0.35, 0.25], w: 0.014 }, { p: [0, 0.31, 0.36], w: 0.01 }, { p: [0, 0.22, 0.45], w: 0.005 }], '#e6d5b0', { radial: 10, sub: 6 });
  for (const sx of [-1, 1]) {
    tube(gp, [[sx * 0.07, 0.12, 0], [sx * 0.08, 0.04, 0.02], [sx * 0.08, 0.012, 0.03]], 0.02, 0.012, '#d6c39a');
    for (const a of [-0.5, 0, 0.5]) tube(gp, [[sx * 0.08, 0.008, 0.03], [sx * 0.08 + Math.sin(a) * 0.05, 0.008, 0.03 + Math.cos(a) * 0.05]], 0.007, 0.005, '#d6c39a');
  }
};

/** Opaque stylised water patch with ripple rings (sits at y≈0). */
function water(gp: THREE.Group, rx: number, rz: number, c = '#2f7fb8'): void {
  pblob(gp, c, 0, 0, 0, rx, 0.018, rz, (x, _y, z) => {
    const d = Math.hypot(x / rx, z / rz);
    return Math.sin(d * 34) > 0.82 ? mix(c, '#bfe6ff', 0.45) : d > 0.9 ? shade(c, 1.15) : null;
  }, [0, 0, 0], 40);
}
function splash(gp: THREE.Group, x: number, z: number, r: number): void {
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    ellip(gp, '#e0f2fe', x + Math.cos(a) * r, 0.02 + (i % 3) * 0.008, z + Math.sin(a) * r, r * 0.35, r * 0.25, r * 0.35);
  }
}

const WHALE: Builder = (gp, r) => {
  const c = r.color!, L = num(r.L, 1.5);
  const light = mix(c, '#e2e8f0', 0.6);
  if (r.fin) {
    // Dolphin leaping in an arc out of the sea
    water(gp, 0.42, 0.34);
    const ctr: V3 = [0, 0.04, 0];
    const paint: Paint = (x, y, z, nx, ny, nz) => {
      const dx = ctr[0] - x, dy = ctr[1] - y, dz = ctr[2] - z, dl = Math.hypot(dx, dy, dz) || 1;
      return (nx * dx + ny * dy + nz * dz) / dl > 0.35 ? light : null;
    };
    const pts: V3[] = [[0, 0.02, -0.3], [0, 0.2, -0.24], [0, 0.34, -0.08], [0, 0.36, 0.08], [0, 0.26, 0.22], [0, 0.14, 0.3], [0, 0.1, 0.32]];
    const ws = [0.012, 0.035, 0.065, 0.068, 0.05, 0.022, 0.012];
    sweep(gp, pts.map((p, i) => ({ p, w: ws[i] * 0.95, h: ws[i] })), c, { radial: 20, sub: 8, paint });
    leaf(gp, c, 0, 0.405, -0.02, 0.035, 0.08, [0, Math.PI / 2, 0.55], 0.012, 0.05);
    for (const sx of [-1, 1]) {
      leaf(gp, shade(c, 0.9), sx * 0.05, 0.27, 0.12, 0.018, 0.07, [0.6, 0, sx * 2.2], 0.008, 0.2);
      bead(gp, sx * 0.034, 0.24, 0.22, 0.009);
    }
    const fl = slab(gp, [[0, 0.02], [0.07, -0.02], [0.09, -0.05], [0.04, -0.035], [0, -0.02], [-0.04, -0.035], [-0.09, -0.05], [-0.07, -0.02]], 0.01, c, 0.003);
    fl.position.set(0, 0.03, -0.3); fl.rotation.set(Math.PI / 2 + 0.9, 0, 0);
    splash(gp, 0, -0.29, 0.06); splash(gp, 0, 0.32, 0.05);
    return;
  }
  // Blue whale surfacing, mottled back, pleated throat, spout
  water(gp, 0.38 * L * 0.5 + 0.12, 0.36 * L * 0.5 + 0.12);
  const lw = 0.5 * L;
  const mottled: Paint = (x, y, z, _nx, ny) => {
    if (ny < -0.25) return Math.sin(x * 170) > 0.2 ? '#cbd5e1' : '#e2e8f0';
    return hash3(Math.floor(x * 40), Math.floor(y * 40), Math.floor(z * 40)) > 0.82 ? mix(c, '#e2e8f0', 0.35) : null;
  };
  const u = (t: number) => t * lw;
  sweep(gp, [
    { p: [0, 0.06, u(-0.5)], w: 0.02, h: 0.016 }, { p: [0, 0.07, u(-0.38)], w: 0.05, h: 0.045 },
    { p: [0, 0.07, u(-0.15)], w: 0.1, h: 0.08 }, { p: [0, 0.06, u(0.1)], w: 0.12, h: 0.088 },
    { p: [0, 0.05, u(0.32)], w: 0.11, h: 0.07 }, { p: [0, 0.045, u(0.46)], w: 0.075, h: 0.045 }, { p: [0, 0.045, u(0.5)], w: 0.03, h: 0.02 },
  ], c, { radial: 26, sub: 8, paint: mottled, squash: 1.1 });
  const fl = slab(gp, [[0, 0.02], [0.1, -0.02], [0.17, -0.08], [0.1, -0.07], [0, -0.04], [-0.1, -0.07], [-0.17, -0.08], [-0.1, -0.02]], 0.014, c, 0.004);
  fl.position.set(0, 0.07, u(-0.48)); fl.rotation.set(Math.PI / 2 - 0.15, 0, 0);
  leaf(gp, c, 0, 0.13, u(-0.25), 0.02, 0.035, [0, Math.PI / 2, 0.6], 0.01, 0.05);
  for (const sx of [-1, 1]) {
    leaf(gp, shade(c, 0.9), sx * 0.1, 0.03, u(0.22), 0.025, 0.16, [Math.PI / 2, 0, -sx * 2.0], 0.01, 0.25);
    bead(gp, sx * 0.1, 0.05, u(0.36), 0.008);
  }
  for (let i = 0; i < 6; i++) ellip(gp, '#f0f9ff', (i % 2 ? 0.01 : -0.01), 0.16 + i * 0.035, u(0.36) - i * 0.006, 0.022 + i * 0.005, 0.02, 0.022 + i * 0.004);
};

const SHARK: Builder = (gp, r) => {
  const c = r.color!, belly = '#f4f6f8', dk = sh(c, 0.62);
  // Ragged countershading line, faint dorsal darkening, slight swimming S-curve
  const paint: Paint = (x, y, z, _nx, ny) => {
    const edge = -0.05 + Math.sin(z * 45) * 0.08 + Math.sin(z * 17 + 1) * 0.06;
    if (ny < edge) return belly;
    return speck(ny > 0.6 ? sh(c, 0.9) : c, x, y, z, 0.035);
  };
  const S = (z: number) => Math.sin(z * 5) * 0.025;
  const st: [number, number, number, number][] = [[-0.47, 0.012, 0.022, 0.2], [-0.36, 0.03, 0.05, 0.2], [-0.12, 0.085, 0.105, 0.2], [0.1, 0.1, 0.12, 0.2], [0.27, 0.075, 0.085, 0.195], [0.38, 0.042, 0.05, 0.19], [0.44, 0.018, 0.022, 0.185]];
  sweep(gp, st.map(([z, w, hh, y]) => ({ p: [S(z), y, z] as V3, w, h: hh })), c, { radial: 22, sub: 6, paint });
  // Tall triangular dorsal fin, swept back; second dorsal; crescent tail with a long upper lobe
  sweep(gp, [{ p: [S(0.04), 0.3, 0.04], w: 0.012, h: 0.08 }, { p: [S(0.0), 0.37, -0.02], w: 0.008, h: 0.04 }, { p: [S(-0.06), 0.43, -0.08], w: 0.003, h: 0.008 }], c, { radial: 10, sub: 4, up: [0, 0, 1] });
  leaf(gp, c, S(-0.33), 0.27, -0.33, 0.02, 0.04, [0, Math.PI / 2, 0.5], 0.01, 0.05);
  const tl = slab(gp, [[0, 0.03], [0.08, 0.2], [0.115, 0.215], [0.06, 0.02], [0.08, -0.11], [0.05, -0.12], [0, -0.02]], 0.014, c, 0.005);
  tl.position.set(S(-0.44), 0.2, -0.44); tl.rotation.set(0, -Math.PI / 2 + 0.25, -0.45);
  for (const sx of [-1, 1]) {
    // Long pectoral fins angled down, small pelvic fins
    leaf(gp, sh(c, 0.92), sx * 0.085, 0.14, 0.1, 0.04, 0.18, [-0.4, 0, sx * 2.05], 0.012, 0.12);
    leaf(gp, sh(c, 0.92), sx * 0.04, 0.12, -0.24, 0.018, 0.05, [-0.6, 0, sx * 2.4], 0.008, 0.1);
    // Five gill slits, black eyes, grinning mouth line with a hint of teeth
    for (let i = 0; i < 5; i++) ellip(gp, dk, sx * (0.09 + i * 0.0015), 0.195, 0.21 - i * 0.022, 0.006, 0.036 - i * 0.002, 0.004);
    bead(gp, sx * 0.05, 0.225, 0.33, 0.009, '#0a0a0a');
  }
  pblob(gp, '#5b3a3f', S(0.31), 0.13, 0.31, 0.04, 0.009, 0.03, undefined, [0, 0, 0], 14);
  for (let i = 0; i < 9; i++) {
    const a = (i - 4) * 0.32;
    drop(gp, '#fffdf5', [S(0.31) + Math.sin(a) * 0.036, 0.137, 0.31 + Math.cos(a) * 0.026], [S(0.31) + Math.sin(a) * 0.036, 0.124, 0.31 + Math.cos(a) * 0.028], 0.005);
  }
  ellip(gp, sh(c, 0.7), S(0.44), 0.19, 0.445, 0.006, 0.004, 0.003);
};

const TURTLE: Builder = (gp, r) => {
  const c = r.color!;
  const skin = mix(c, '#c2d59a', 0.6);
  const scale: Paint = (x, y, z) => { const [a, b] = worley(x * 40, y * 40, z * 40); return b - a < 0.12 ? shade(skin, 0.75) : null; };
  pblob(gp, '#e9dfb8', 0, 0.09, 0, 0.26, 0.04, 0.32);
  pblob(gp, c, 0, 0.1, 0, 0.27, 0.15, 0.33, (x, y, z, _nx, ny) => {
    if (ny < 0.05) return '#e9dfb8';
    const [f1, f2] = worley(x * 6.5, y * 3, z * 6.5);
    return f2 - f1 < 0.04 ? '#3f3a26' : mix(shade(c, 1.15), '#8a6a3a', Math.min(1, f1 * 1.6) * 0.55);
  }, [0, 0, 0], 52);
  sweep(gp, [{ p: [0, 0.1, 0.28], w: 0.06, h: 0.05 }, { p: [0, 0.12, 0.38], w: 0.06, h: 0.055 }, { p: [0, 0.125, 0.44], w: 0.05, h: 0.048 }, { p: [0, 0.115, 0.48], w: 0.02 }], skin, { radial: 16, sub: 6, paint: scale });
  for (const sx of [-1, 1]) {
    bead(gp, sx * 0.042, 0.14, 0.43, 0.012);
    const ff = slab(gp, [[0, 0.03], [0.12, 0.04], [0.3, -0.02], [0.32, -0.06], [0.15, -0.04], [0, -0.03]].map(([a, b]) => [a * sx, b] as [number, number]), 0.02, skin, 0.006);
    ff.position.set(sx * 0.2, 0.08, 0.16); ff.rotation.set(Math.PI / 2, 0, sx * 0.5);
    const bf = slab(gp, [[0, 0.03], [0.1, 0.02], [0.13, -0.03], [0, -0.03]].map(([a, b]) => [a * sx, b] as [number, number]), 0.016, skin, 0.005);
    bf.position.set(sx * 0.17, 0.08, -0.26); bf.rotation.set(Math.PI / 2, 0, -sx * 0.6);
  }
};

const OCTOPUS: Builder = (gp, r) => {
  const c = r.color!, under = mix(c, '#ffe4e6', 0.55);
  pblob(gp, c, 0, 0.46, -0.06, 0.17, 0.21, 0.19, (x, y, z) => (hash3(Math.floor(x * 50), Math.floor(y * 50), Math.floor(z * 50)) > 0.85 ? shade(c, 1.2) : null), [-0.45, 0, 0], 28);
  pblob(gp, c, 0, 0.27, 0.04, 0.15, 0.1, 0.14);
  for (const sx of [-1, 1]) {
    ellip(gp, c, sx * 0.09, 0.33, 0.12, 0.05);
    ellip(gp, '#fef3c7', sx * 0.1, 0.335, 0.155, 0.032, 0.03, 0.02);
    ellip(gp, '#111827', sx * 0.1, 0.335, 0.172, 0.022, 0.007, 0.006);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const ca = Math.cos(a), sa = Math.sin(a);
    const curl = i % 2 ? 1 : -1;
    const pts: V3[] = [
      [ca * 0.08, 0.22, sa * 0.08 + 0.03], [ca * 0.2, 0.08, sa * 0.2 + 0.03], [ca * 0.32, 0.03, sa * 0.32 + 0.03],
      [ca * 0.42 - sa * 0.05 * curl, 0.05, sa * 0.42 + ca * 0.05 * curl + 0.03], [ca * 0.42 - sa * 0.1 * curl, 0.11, sa * 0.42 + ca * 0.1 * curl + 0.03],
      [ca * 0.37 - sa * 0.1 * curl, 0.13, sa * 0.37 + ca * 0.1 * curl + 0.03],
    ];
    sweep(gp, pts.map((p, k) => ({ p, w: 0.05 * (1 - k / 6) + 0.006 })), c, {
      radial: 12, sub: 7, paint: (x, y, z, _nx, ny) => (ny < -0.2 ? (hash3(Math.floor(x * 70), Math.floor(y * 70), Math.floor(z * 70)) > 0.55 ? '#fff1f2' : under) : null),
    });
  }
};

const CROC: Builder = (gp, r) => {
  const c = r.color!, short = Boolean(r.short), L = short ? 0.82 : 1;
  const belly = mix(c, '#e7e5b8', 0.55);
  const scales: Paint = (x, y, z, _nx, ny) => {
    if (ny < -0.3) return belly;
    if (short) return hash3(Math.floor(x * 90), Math.floor(y * 90), Math.floor(z * 90)) > 0.7 ? shade(c, 0.8) : null;
    return Math.sin(z * 70) > 0.6 ? shade(c, 0.78) : null;
  };
  const y0 = short ? 0.1 : 0.075;
  sweep(gp, [
    { p: [0, y0 - 0.03, -0.62 * L], w: 0.008, h: 0.012 }, { p: [0, y0 - 0.01, -0.42 * L], w: 0.04, h: 0.045 },
    { p: [0, y0, -0.2 * L], w: 0.085, h: 0.06 }, { p: [0, y0 + 0.01, 0.0], w: 0.12, h: 0.07 },
    { p: [0, y0 + 0.01, 0.18 * L], w: 0.1, h: 0.065 }, { p: [0, y0 + (short ? 0.04 : 0.01), 0.3 * L], w: short ? 0.06 : 0.07, h: 0.05 },
  ], c, { radial: 22, sub: 8, paint: scales, squash: 0.6 });
  // Head & snout
  const hz = 0.3 * L, hy = y0 + (short ? 0.04 : 0.01);
  const snoutL = short ? 0.14 : 0.24;
  sweep(gp, [
    { p: [0, hy, hz], w: short ? 0.055 : 0.065, h: 0.045 }, { p: [0, hy - 0.005, hz + 0.08], w: short ? 0.045 : 0.05, h: 0.032 },
    { p: [0, hy - 0.012, hz + snoutL], w: short ? 0.032 : 0.03, h: 0.022 }, { p: [0, hy - 0.014, hz + snoutL + 0.015], w: 0.012, h: 0.01 },
  ], c, { radial: 16, sub: 6, paint: scales, squash: 0.7 });
  for (const sx of [-1, 1]) {
    ellip(gp, c, sx * 0.03, hy + 0.035, hz + 0.04, 0.022, 0.018, 0.024);
    bead(gp, sx * 0.032, hy + 0.044, hz + 0.054, 0.01, '#d4a017');
    if (!short) for (let i = 0; i < 6; i++) {
      const tz = hz + 0.05 + i * 0.03, tw = 0.05 - i * 0.004;
      add(gp, g0Cone(), mat('#fffbeb'), sx * tw, hy - 0.03, tz, 0.008, 0.018, 0.008, 0, Math.PI, 0);
    }
    // Sprawling legs: upper limb out sideways, elbow, forearm down to a splayed clawed foot
    for (const [z, k] of [[0.14 * L, 1], [-0.15 * L, 1.15]] as const) {
      const el: V3 = [sx * 0.15 * k, y0 + 0.005, z - 0.01], ft: V3 = [sx * 0.17 * k, 0.014, z + 0.04];
      sweep(gp, [{ p: [sx * 0.07, y0, z], w: 0.034 * k, h: 0.03 * k }, { p: el, w: 0.024 * k, h: 0.022 * k }, { p: ft, w: 0.02 * k, h: 0.014 * k }], c, { radial: 10, sub: 4, paint: scales });
      pblob(gp, sh(c, 0.92), ft[0], 0.01, ft[2] + 0.012, 0.024 * k, 0.009, 0.026 * k, undefined, [0, 0, 0], 10);
      for (const a of [-0.8, -0.3, 0.2, 0.7]) {
        const tp: V3 = [ft[0] + Math.sin(a) * sx * 0.045 * k, 0.006, ft[2] + Math.cos(a) * 0.045 * k];
        drop(gp, c, [ft[0], 0.01, ft[2] + 0.01], tp, 0.008);
        drop(gp, '#2a2620', tp, [tp[0] + Math.sin(a) * sx * 0.012, 0.002, tp[2] + Math.cos(a) * 0.012], 0.003);
      }
    }
  }
  if (short) {
    // Komodo forked tongue
    tube(gp, [[0, hy - 0.02, hz + snoutL], [0, hy - 0.025, hz + snoutL + 0.05]], 0.005, 0.004, '#f43f5e');
    for (const sx of [-1, 1]) tube(gp, [[0, hy - 0.025, hz + snoutL + 0.05], [sx * 0.012, hy - 0.026, hz + snoutL + 0.075]], 0.004, 0.002, '#f43f5e');
  } else {
    // Armoured dorsal scute rows along back and tail
    for (let i = 0; i < 14; i++) {
      const z = 0.22 * L - i * 0.06 * L, w = Math.max(0.01, 0.07 - Math.max(0, -z) * 0.11);
      const yy = y0 + 0.055 - Math.max(0, -z - 0.2) * 0.12;
      for (const sx of i * 0.06 * L < 0.45 * L ? [-1, 1] : [0]) add(gp, g0Cone(), mat(shade(c, 0.72)), sx * w * 0.5, yy, z, 0.022, 0.028, 0.03, 0, 0, 0);
    }
  }
};
const g0Cone = () => new THREE.ConeGeometry(0.5, 1, 4);

export const ANIMAL_BUILDERS: Record<string, Builder> = {
  quad: quadBuilder, ape: APE, bear: BEAR, hopper: HOPPER, penguin: PENGUIN, wader: WADER, flyer: FLYER,
  roundbird: ROUNDBIRD, whale: WHALE, shark: SHARK, turtle: TURTLE, octopus: OCTOPUS, croc: CROC,
};
