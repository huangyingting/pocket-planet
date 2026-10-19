import * as THREE from 'three';
import {
  type Builder, type Paint, type V3, num, mat, add, sweep as sweep0, slab, paintFaces, strut, g,
  mix, fbm, worley, hash3, vnoise,
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

// ---- Smooth parametric surfaces with per-vertex paint (soft gradients instead of a per-triangle checker) ----
const VCOL = new Map<string, THREE.Color>();
function vc(h: string): THREE.Color {
  let c = VCOL.get(h);
  if (!c) { if (VCOL.size > 6000) VCOL.clear(); c = new THREE.Color(h); VCOL.set(h, c); }
  return c;
}
/** Re-colour an (unshared) mesh geometry per vertex. */
function vpaint<T extends THREE.Mesh>(m: T, base: string, paint?: Paint): T {
  const geo = m.geometry;
  if (!geo.getAttribute('normal')) geo.computeVertexNormals();
  const pos = geo.getAttribute('position'), nor = geo.getAttribute('normal');
  const cols = new Float32Array(pos.count * 3), bc = vc(base);
  for (let i = 0; i < pos.count; i++) {
    const h = paint ? paint(pos.getX(i), pos.getY(i), pos.getZ(i), nor.getX(i), nor.getY(i), nor.getZ(i)) : null;
    const c = h ? vc(h) : bc;
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  m.material = mat('#ffffff', { flat: false, vc: true });
  return m;
}
/** Smooth ellipsoid painted per vertex. */
function vblob(p: THREE.Object3D, c: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, paint?: Paint, rot: V3 = [0, 0, 0], seg = 22): THREE.Mesh {
  return vpaint(pblob(p, c, x, y, z, rx, ry, rz, undefined, rot, seg), c, paint);
}
/** Grid surface: rings along u∈[0,1], v∈[0,1) wrapping around, fan-capped ends; outward winding is auto-detected. */
function psurf(p: THREE.Object3D, nu: number, nv: number, f: (u: number, v: number) => V3, c: string, paint?: Paint,
  uvp?: (u: number, v: number, x: number, y: number, z: number) => string | null): THREE.Mesh {
  const pos: number[] = [];
  for (let i = 0; i <= nu; i++) for (let j = 0; j < nv; j++) pos.push(...f(i / nu, j / nv));
  const idx: number[] = [];
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = i * nv + j, b = i * nv + ((j + 1) % nv), c2 = (i + 1) * nv + j, d = (i + 1) * nv + ((j + 1) % nv);
    idx.push(a, b, c2, b, d, c2);
  }
  for (const [ring, sgn] of [[0, -1], [nu, 1]] as const) {
    const ctr = pos.length / 3;
    let cx = 0, cy = 0, cz = 0;
    for (let j = 0; j < nv; j++) { cx += pos[(ring * nv + j) * 3]; cy += pos[(ring * nv + j) * 3 + 1]; cz += pos[(ring * nv + j) * 3 + 2]; }
    pos.push(cx / nv, cy / nv, cz / nv);
    for (let j = 0; j < nv; j++) {
      const a = ring * nv + j, b = ring * nv + ((j + 1) % nv);
      if (sgn < 0) idx.push(ctr, b, a); else idx.push(ctr, a, b);
    }
  }
  // Winding check on the middle ring: the face normal should point away from the ring centre
  const mi = Math.floor(nu / 2) * nv, P = (k: number) => new THREE.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
  const cen = new THREE.Vector3();
  for (let j = 0; j < nv; j++) cen.add(P(mi + j));
  cen.multiplyScalar(1 / nv);
  const A = P(mi), B = P(mi + 1), C = P(mi + nv);
  const n = new THREE.Vector3().crossVectors(B.clone().sub(A), C.clone().sub(A));
  if (n.dot(A.clone().sub(cen)) < 0) for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = vpaint(add(p, geo, mat('#ffffff', { flat: false, vc: true }), 0, 0, 0, 1, 1, 1), c, paint);
  if (uvp) {
    // Surface-parameter paint (e.g. the sucker side of an arm) overrides the positional painter on the grid
    const col = geo.getAttribute('color') as THREE.BufferAttribute;
    for (let i = 0; i <= nu; i++) for (let j = 0; j < nv; j++) {
      const k = i * nv + j, h = uvp(i / nu, j / nv, pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
      if (h) { const cc = vc(h); col.setXYZ(k, cc.r, cc.g, cc.b); }
    }
  }
  return m;
}
interface SpSt { p: V3; w: number; h: number }
/**
 * Body lofted along a spine with elliptical sections; `shape(u, a)` may return a radial multiplier
 * (pleats, keels, flattened bellies). `side` is the fixed lateral axis used to build the frames.
 */
function spine(p: THREE.Object3D, st: SpSt[], c: string, paint?: Paint,
  o: { nu?: number; nv?: number; side?: V3; shape?: (u: number, a: number) => number; uvp?: (u: number, a: number, x: number, y: number, z: number) => string | null } = {}): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(st.map(s => new THREE.Vector3(...s.p)), false, 'centripetal');
  const nu = o.nu ?? (st.length - 1) * 8, nv = o.nv ?? 28;
  const side = new THREE.Vector3(...(o.side ?? [1, 0, 0]));
  const fr: { P: THREE.Vector3; S: THREE.Vector3; N: THREE.Vector3; w: number; h: number }[] = [];
  for (let i = 0; i <= nu; i++) {
    const u = i / nu, P = curve.getPoint(u), T = curve.getTangent(u);
    const N = new THREE.Vector3().crossVectors(T, side).normalize();
    const S = new THREE.Vector3().crossVectors(N, T).normalize();
    const f = u * (st.length - 1), k = Math.min(st.length - 2, Math.floor(f)), t = f - k, s = t * t * (3 - 2 * t);
    fr.push({ P, S, N, w: st[k].w + (st[k + 1].w - st[k].w) * s, h: st[k].h + (st[k + 1].h - st[k].h) * s });
  }
  return psurf(p, nu, nv, (u, v) => {
    const F = fr[Math.round(u * nu)], a = v * Math.PI * 2, m = o.shape ? o.shape(u, a) : 1;
    const ca = Math.cos(a) * F.w * m, sa = Math.sin(a) * F.h * m;
    return [F.P.x + F.S.x * ca + F.N.x * sa, F.P.y + F.S.y * ca + F.N.y * sa, F.P.z + F.S.z * ca + F.N.z * sa];
  }, c, paint, o.uvp ? (u, v, x, y, z) => o.uvp!(u, v * Math.PI * 2, x, y, z) : undefined);
}
/** Streamlined fin / fluke / flipper: span stations root→tip with leading & trailing edge points and thickness along `up`. */
function foil(p: THREE.Object3D, c: string, st: { le: V3; te: V3; t: number }[], up: V3, paint?: Paint, nu = 14, nv = 14): THREE.Mesh {
  const L = new THREE.CatmullRomCurve3(st.map(s => new THREE.Vector3(...s.le)), false, 'centripetal');
  const T = new THREE.CatmullRomCurve3(st.map(s => new THREE.Vector3(...s.te)), false, 'centripetal');
  const U = new THREE.Vector3(...up).normalize(), le = new THREE.Vector3(), te = new THREE.Vector3();
  return psurf(p, nu, nv, (u, v) => {
    L.getPoint(u, le); T.getPoint(u, te);
    const f = u * (st.length - 1), k = Math.min(st.length - 2, Math.floor(f)), th = st[k].t + (st[k + 1].t - st[k].t) * (f - k);
    const a = v * Math.PI * 2, ch = (1 - Math.cos(a)) / 2, thick = Math.sin(a) * th * Math.pow(Math.max(0, 1 - ch), 0.7) * Math.pow(ch + 0.02, 0.3) * 1.6;
    return [le.x + (te.x - le.x) * ch + U.x * thick, le.y + (te.y - le.y) * ch + U.y * thick, le.z + (te.z - le.z) * ch + U.z * thick];
  }, c, paint);
}
/** Mesh on a shared geometry, oriented so its local +y follows `dir`. */
function orient(p: THREE.Object3D, geo: THREE.BufferGeometry, c: string, at: V3, dir: V3, s: V3): THREE.Mesh {
  const m = add(p, geo, mat(c, { flat: false }), at[0], at[1], at[2], s[0], s[1], s[2]);
  _d.set(dir[0], dir[1], dir[2]).normalize();
  m.quaternion.setFromUnitVectors(_Y, _d);
  return m;
}
const nrm = (v: V3): V3 => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

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
/** Lighter teardrop for the many blades (hair locks, leaf lobes, feathers). */
const LOCK = () => g('an-lock', () => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push(new THREE.Vector2(Math.max(1e-4, 0.5 * Math.sin(Math.PI * Math.pow(t, 0.6))), t)); }
  const lg = new THREE.LatheGeometry(pts, 6);
  lg.computeVertexNormals();
  return lg;
});
/** Mane lock: broad soft teardrop whose tip curls back toward the surface (local −z), so overlapping rows read as hair, not scales. */
const MLOCK = () => g('an-mlock', () => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push(new THREE.Vector2(Math.max(1e-4, 0.5 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.04)), 0.6) * (1 - 0.45 * t)), t)); }
  const lg = new THREE.LatheGeometry(pts, 7);
  const ps = lg.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < ps.count; i++) { const y = ps.getY(i); ps.setZ(i, ps.getZ(i) - 0.65 * y * y); }
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
const _m4 = new THREE.Matrix4(), _bx = new THREE.Vector3(), _by = new THREE.Vector3(), _bz = new THREE.Vector3();
/** Flattened teardrop a→b whose flat face looks along `up` (leaf lobes, feathers, hair locks, claws). */
function blade(p: THREE.Object3D, c: string, a: V3, b: V3, w: number, t: number, up: V3, geo: THREE.BufferGeometry = LOCK()): THREE.Mesh {
  _by.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const len = _by.length() || 1e-4;
  _by.multiplyScalar(1 / len);
  _bz.set(up[0], up[1], up[2]).addScaledVector(_by, -(up[0] * _by.x + up[1] * _by.y + up[2] * _by.z));
  if (_bz.lengthSq() < 1e-8) _bz.set(_by.y, _by.z, _by.x);
  _bz.normalize();
  _bx.crossVectors(_by, _bz);
  const m = add(p, geo, mat(c, { flat: false }), a[0], a[1], a[2], w * 2, len, t * 2);
  m.quaternion.setFromRotationMatrix(_m4.makeBasis(_bx, _by, _bz));
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
  // Dry savanna patch with grass tufts and a flat rock
  const sav = '#c2a964';
  vblob(gp, sav, 0, -0.026, 0, 0.36, 0.03, 0.46, (x, _y, z) => mx(mx(sav, '#a48a4c', sst(0.45, 0.8, vnoise(x * 9, 1, z * 9)) * 0.6), '#dcc78c', sst(0.6, 0.85, vnoise(x * 28, 2, z * 28)) * 0.5), [0, 0, 0], 18);
  vblob(gp, '#857b6c', 0.25, 0.0, 0.2, 0.065, 0.032, 0.05, (x, y, z) => mx('#857b6c', '#5e564c', sst(0.4, 0.8, vnoise(x * 40, y * 40, z * 40)) * 0.6), [0, 0.6, 0], 12);
  for (let i = 0; i < 5; i++) {
    const a0 = i * 1.37 + 0.4, x0 = Math.cos(a0) * (0.27 + hash3(i, 1, 6) * 0.05), z0 = Math.sin(a0) * 0.36;
    for (let k = 0; k < 4; k++) {
      const a = k * 1.57 + i, l = 0.05 + hash3(i, k, 6) * 0.04;
      blade(gp, mx('#c9b36a', '#8f8a46', hash3(k, i, 6)), [x0, 0, z0], [x0 + Math.cos(a) * l * 0.4, l, z0 + Math.sin(a) * l * 0.4], 0.008, 0.003, [-Math.sin(a), 0, Math.cos(a)]);
    }
  }
  const F = quad(gp, {
    c, span: 0.44, leg: 0.22, bw: 0.1, bh: 0.108, R: 0.031, tuck: 0.3, withers: 0.012, feet: 'paw', pawK: 1.12,
    body, legP: coat(c, belly, { hi: 0.1, lo: -0.6 }), neck: 0.13, neckA: 0.5, neckW: 0.068, stride: 0.04, foot: sh(c, 0.97),
  });
  // Shaggy layered mane: a streaky base mass under overlapping rows of pointed locks, golden around the face,
  // darkening to brown-black over the shoulders, with a long chest fringe
  const gold = mx(mane, c, 0.55), dark = mx(sh(mane, 0.42), '#2a1a10', 0.3);
  const [, ny0, nz0] = F.n0, [, hy, hz] = F.hp;
  const ax: V3 = [0, hy - ny0, hz - nz0], al = Math.hypot(ax[1], ax[2]);
  const A: V3 = [0, ax[1] / al, ax[2] / al], U: V3 = [0, A[2], -A[1]];
  const mcol = (t: number, k: number) => mx(mx(gold, dark, Math.min(1, sst(1.05, -0.45, t) * 0.9)), k > 0.5 ? sh(gold, 1.12) : sh(dark, 0.8), Math.abs(k - 0.5) * 0.7);
  spine(gp, [
    { p: [0, ny0 - 0.035, nz0 - 0.16], w: 0.03, h: 0.03 },
    { p: [0, ny0 - 0.045, nz0 - 0.1], w: 0.1, h: 0.11 },
    { p: [0, ny0 + ax[1] * 0.2 - 0.012, nz0 + ax[2] * 0.2 - 0.02], w: 0.13, h: 0.145 },
    { p: [0, ny0 + ax[1] * 0.6, nz0 + ax[2] * 0.6], w: 0.138, h: 0.152 },
    { p: [0, hy - 0.004, hz - 0.025], w: 0.124, h: 0.138 },
    { p: [0, hy + 0.004, hz + 0.03], w: 0.04, h: 0.04 },
  ], dark, undefined, {
    nu: 38, nv: 40,
    // Soft lobed clumps running along the hair flow, fuller and lower under the chin
    shape: (u, a) => 1 + (vnoise(Math.cos(a) * 3 + 9, Math.sin(a) * 3, u * 3) - 0.5) * 0.2 + Math.abs(Math.sin(a * 6 + u * 2.5 + vnoise(u * 4 + Math.cos(a), Math.sin(a), 1) * 3)) ** 3 * 0.07
      + Math.max(0, -Math.sin(a)) * 0.14 * sst(0.2, 0.7, u),
    uvp: (u, a) => {
      const k = vnoise(Math.cos(a) * 16, Math.sin(a) * 16, u * 1.6);
      return mx(mcol(u * 1.3 - 0.4 + (k - 0.5) * 0.4, k), '#1e130b', sst(0.35, 0.2, k) * 0.35);
    },
  });
  for (let i = 0; i < 5; i++) {
    const t = -0.42 + i * 0.32, nphi = 14;
    for (let j = 0; j < nphi; j++) {
      const phi = (j / nphi) * Math.PI * 2 + i * 0.9 + (hash3(i, j, 2) - 0.5) * 0.4;
      const cs = Math.cos(phi), sn = Math.sin(phi), bot = sst(-0.2, -0.75, sn), topk = sst(0.2, 0.8, sn);
      const rad = 0.118 + bot * 0.03 + sst(0.6, 1.0, t) * 0.012;
      const tt = t + (hash3(j, i, 8) - 0.5) * 0.14;
      const b: V3 = [cs * rad, ny0 + A[1] * tt * al + U[1] * sn * rad, nz0 + A[2] * tt * al + U[2] * sn * rad];
      const len = (0.1 + hash3(i, j, 7) * 0.055) * (1 + bot * 0.4 + (t < 0 ? 0.12 : 0)) * (1 - topk * 0.25);
      const out: V3 = [cs, U[1] * sn, U[2] * sn], sw = (hash3(j, i, 5) - 0.5) * 0.5;
      // Lying along the mane: swept back over the neck, drooping on the sides, hanging from the chest
      const o = 0.22 + bot * 0.08, dn = 0.2 + (1 - topk) * 0.4 + bot * 0.8;
      const d = nrm([out[0] * o + sw * 0.3, out[1] * o - A[1] * (1 - bot * 0.6) - dn, out[2] * o - A[2] * (1 - bot * 0.6)]);
      const col = mcol(t + (hash3(j, i, 3) - 0.5) * 0.4, hash3(i, j, 9));
      blade(gp, col, b, [b[0] + d[0] * len, b[1] + d[1] * len, b[2] + d[2] * len], 0.048 + hash3(i, j, 4) * 0.012, 0.03, out, MLOCK());
    }
  }
  const h = headGroup(gp, F, -0.3, 0.12, 0.04);
  // Face ruff: broad locks framing the face, swept back and curling onto the mane, lighter near the face
  for (let k = 0; k < 2; k++) for (let j = 0; j < 13; j++) {
    const phi = (j / 13) * Math.PI * 2 + k * 0.24;
    const rad = 0.08 + k * 0.03, cs = Math.cos(phi), sn = Math.sin(phi), fl = sst(-0.3, -0.7, sn);
    const b: V3 = [cs * rad, -0.012 + sn * rad * 0.95, 0.02 - k * 0.04];
    const len = (0.08 + k * 0.025 + hash3(j, k, 1) * 0.03) * (1 + fl * 0.45);
    const col = mcol(1.15 - k * 0.4 + (hash3(j, 2, k) - 0.5) * 0.3, hash3(j, 5, k));
    blade(h, col, b, [b[0] + cs * len * (0.42 - fl * 0.12), b[1] + sn * len * 0.32 - len * (0.18 + fl * 0.55), b[2] - len * (0.85 - fl * 0.4)], 0.042, 0.026, [cs, sn, 0.35], MLOCK());
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

const barkP = (bark: string, k = 1): Paint => (x, y, z) => {
  const n = fbm(x * 46 * k, y * 7 * k, z * 46 * k, 3);
  return mx(bark, n > 0.5 ? '#a89276' : '#2e231a', Math.min(1, Math.abs(n - 0.5) * 1.7));
};
/** Cecropia-style palmate leaf: lobes fanning from the petiole tip, drooping at the ends. */
function palmLeaf(p: THREE.Object3D, at: V3, yaw: number, size: number, col: string, droop = 0.35, lobes = 7): void {
  for (let k = 0; k < lobes; k++) {
    const a = yaw + (k - (lobes - 1) / 2) * (Math.PI * 1.7 / lobes);
    const L = size * (1 - Math.abs(k - (lobes - 1) / 2) * 0.09);
    const d = nrm([Math.sin(a), -droop - Math.abs(k - (lobes - 1) / 2) * 0.05, Math.cos(a)]);
    blade(p, k % 2 ? col : sh(col, 0.9), at, [at[0] + d[0] * L, at[1] + d[1] * L, at[2] + d[2] * L], size * 0.2, size * 0.02, [-d[1] * d[0], 1, -d[1] * d[2]]);
  }
}

/** Brown-throated three-toed sloth hanging back-down beneath a rainforest branch, face turned to the viewer. */
function sloth(gp: THREE.Group, r: Rec): void {
  const c = r.color!, base = mx(c, '#655a46', 0.5), dark = '#2a1f16', cream = '#efe6cf', claw = '#d6c6a2';
  const fur: Paint = (x, y, z, _nx, ny) => {
    const s = fbm(x * 70 + 3, y * 10, z * 70, 3);
    const col = ny < -0.15 ? mx(base, '#6a7048', sst(-0.15, -0.8, ny) * 0.45) : mx(base, '#a3967a', sst(0.2, 0.9, ny) * 0.4);
    return mx(col, s > 0.5 ? '#c9bc9c' : '#3a2f22', Math.min(0.7, Math.abs(s - 0.5) * 1.8));
  };
  // Tree: buttressed trunk on mossy ground, a long horizontal limb, palmate leaf clusters
  const bark = '#6e5843', moss = '#5d6b3a';
  vblob(gp, moss, 0.33, -0.005, -0.06, 0.2, 0.04, 0.17, (x, y, z) => mx(moss, '#3f3a26', Math.min(1, fbm(x * 30, y * 30, z * 30) * 1.2 - 0.1)), [0, 0.4, 0], 26);
  vpaint(sweep(gp, [
    { p: [0.34, 0.0, -0.06], w: 0.075 }, { p: [0.34, 0.07, -0.06], w: 0.05 }, { p: [0.335, 0.45, -0.05], w: 0.042 },
    { p: [0.34, 0.8, -0.045], w: 0.036 }, { p: [0.33, 1.0, -0.035], w: 0.024 },
  ], bark, { radial: 16, sub: 6 }), bark, barkP(bark));
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3 + 0.4, ca = Math.cos(a), sa = Math.sin(a);
    tube(gp, [[0.34 + ca * 0.03, 0.08, -0.06 + sa * 0.03], [0.34 + ca * 0.08, 0.025, -0.06 + sa * 0.08], [0.34 + ca * 0.13, 0.008, -0.06 + sa * 0.13]], 0.02, 0.007, sh(bark, 0.92));
  }
  const limbSt: { p: V3; w: number }[] = [
    { p: [0.33, 0.79, -0.04], w: 0.034 }, { p: [0.15, 0.81, -0.012], w: 0.029 }, { p: [-0.05, 0.81, 0], w: 0.027 },
    { p: [-0.26, 0.815, 0.006], w: 0.024 }, { p: [-0.47, 0.86, 0.0], w: 0.013 },
  ];
  vpaint(sweep(gp, limbSt, bark, { radial: 14, sub: 8 }), bark, barkP(bark, 1.3));
  tube(gp, [[-0.3, 0.82, 0.005], [-0.36, 0.88, -0.05], [-0.4, 0.95, -0.08]], 0.011, 0.005, bark);
  tube(gp, [[0.33, 0.95, -0.035], [0.25, 1.02, 0.02], [0.2, 1.04, 0.06]], 0.013, 0.006, bark);
  const greens = ['#4f7f3f', '#5e8f46', '#46723a', '#6a9a50'];
  for (const [x, y, z, yaw, s] of [[-0.47, 0.87, 0.0, 0.5, 0.15], [-0.41, 0.96, -0.08, 3.2, 0.14], [-0.52, 0.91, 0.07, -1.4, 0.12],
    [0.2, 1.05, 0.06, 0.8, 0.15], [0.32, 1.02, -0.04, 2.6, 0.16], [0.38, 0.99, 0.05, -1.0, 0.14], [0.27, 1.07, -0.12, 4.0, 0.13], [0.42, 1.04, -0.1, 1.9, 0.12]] as const) {
    palmLeaf(gp, [x, y, z], yaw, s, greens[Math.floor(hash3(x * 9, y * 9, z * 9) * 4)]);
  }
  // Body hanging back-down: belly toward the branch, shaggy coat falling toward the ground
  spine(gp, [
    { p: [0.2, 0.61, 0], w: 0.035, h: 0.03 }, { p: [0.16, 0.6, 0], w: 0.09, h: 0.084 }, { p: [0.07, 0.592, 0], w: 0.112, h: 0.098 },
    { p: [-0.04, 0.596, 0.002], w: 0.108, h: 0.094 }, { p: [-0.13, 0.602, 0.008], w: 0.084, h: 0.078 },
    { p: [-0.19, 0.594, 0.018], w: 0.056, h: 0.056 }, { p: [-0.225, 0.588, 0.026], w: 0.04, h: 0.04 },
  ], base, fur, { side: [0, 0, 1], nv: 30, shape: (u, a) => 1 + (vnoise(Math.cos(a) * 6 + 2, Math.sin(a) * 6, u * 5) - 0.5) * 0.16 * sst(0.2, -0.9, Math.sin(a)) });
  for (let i = 0; i < 64; i++) {
    const x = 0.17 - (i / 63) * 0.36, k = Math.sin(Math.PI * Math.min(1, (0.2 - x) / 0.42)) * 0.95 + 0.1;
    const a = Math.PI * (1.1 + hash3(i, 3, 1) * 0.8), ca = Math.cos(a), sa = Math.sin(a);
    const b: V3 = [x, 0.596 + sa * 0.088 * k, ca * 0.1 * k];
    const len = 0.05 + hash3(i, 7, 2) * 0.04;
    const tipp: V3 = [b[0] + (hash3(i, 1, 9) - 0.5) * 0.03, b[1] - len, b[2] + ca * len * 0.5];
    blade(gp, sh(fur(...b, 0, sa, 0) ?? base, 0.9 + hash3(i, 4, 4) * 0.2), b, tipp, 0.015, 0.008, [0, 0, ca]);
  }
  vblob(gp, sh(base, 0.95), 0.215, 0.6, 0, 0.022, 0.018, 0.02, fur, [0, 0, 0], 12); // stubby tail
  // Long limbs reaching up, three hooked claws wrapping over the branch
  for (const [x0, hind] of [[-0.14, false], [0.12, true]] as const) {
    for (const sz of [-1, 1]) {
      const st = sz * (hind ? 1 : -1) * 0.012;
      const sh0: V3 = [x0, 0.625, sz * 0.068], el: V3 = [x0 + (hind ? 0.035 : -0.035) + st, 0.68, sz * 0.13], wr: V3 = [x0 + st * 1.5, 0.772, sz * 0.05];
      vpaint(limb(gp, base, [[sh0, 0.04, 0.04], [[(sh0[0] + el[0]) / 2, 0.655, sz * 0.105], 0.036, 0.034], [el, 0.03, 0.03], [[(el[0] + wr[0]) / 2, 0.73, sz * 0.1], 0.028, 0.028], [wr, 0.022, 0.022]], undefined, 14), base, fur);
      for (let i = 0; i < 4; i++) {
        const t = 0.25 + i * 0.2, q: V3 = [sh0[0] + (el[0] - sh0[0]) * t * 1.6, sh0[1] + (el[1] - sh0[1]) * t * 1.6, sh0[2] + (el[2] - sh0[2]) * t * 1.6];
        blade(gp, fur(...q, 0, -1, 0) ?? base, q, [q[0], q[1] - 0.04 - i * 0.004, q[2] + sz * 0.01], 0.018, 0.01, [0, 0, 1]);
      }
      vblob(gp, sh(base, 0.85), wr[0], 0.783, sz * 0.042, 0.026, 0.02, 0.022, fur, [0, 0, 0], 14);
      for (const k of [-1, 0, 1]) {
        const x = wr[0] + k * 0.013, pts: V3[] = [];
        for (let j = 0; j <= 5; j++) {
          const ph = -0.4 + j * 0.48;
          pts.push([x + k * j * 0.002, 0.81 + Math.sin(ph) * 0.037, sz * Math.cos(ph) * 0.037]);
        }
        vpaint(sweep(gp, pts.map((pt, j) => ({ p: pt, w: 0.0075 - j * 0.0012 })), claw, { radial: 8, sub: 4 }), claw,
          (_x, y) => (y > 0.845 ? '#8c7a5c' : null));
      }
    }
  }
  // Round head turned to the viewer: pale face mask, dark eye stripes, button nose, permanent smile
  const h = grp(gp, [-0.245, 0.583, 0.04], [0.18, -0.55, 0.1]);
  const headP: Paint = (x, y, z) => {
    const l = Math.hypot(x, y, z) || 1, lon = Math.atan2(Math.abs(x / l), z / l), lat = Math.asin(y / l);
    const sl = 0.1 - (lon - 0.45) * 0.28;
    if (lon > 0.26 && lon < 1.6 && Math.abs(lat - sl) < 0.15 - Math.max(0, lon - 1.0) * 0.12) return dark;
    if (lon < 1.3 && lat > -0.8 && lat < 0.9) return mx(cream, '#a99a7c', Math.min(1, sst(0.9, 1.3, lon) + sst(0.5, 0.9, lat) * 0.7));
    return lat < -0.45 ? '#6b4a2c' : fur(x, y, z, 0, 0, 0);
  };
  vblob(h, cream, 0, 0, 0, 0.064, 0.06, 0.056, headP, [0, 0, 0], 26);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    const b: V3 = [ca * 0.056, sa * 0.053, -0.016];
    blade(h, i % 3 ? sh(base, 1.1) : mx(base, cream, 0.35), b, [ca * 0.076, sa * 0.07 - 0.014, -0.034], 0.014, 0.007, [0, 0, 1]);
  }
  vblob(h, cream, 0, -0.018, 0.046, 0.027, 0.021, 0.018, (x, y) => (y < -0.03 ? '#e2d6b8' : null), [0, 0, 0], 16);
  ellip(h, '#1a1410', 0, -0.009, 0.064, 0.014, 0.0095, 0.008);
  lit(ellip(h, '#ffffff', 0.004, -0.004, 0.071, 0.0028));
  tube(h, [[-0.016, -0.028, 0.055], [0, -0.034, 0.061], [0.016, -0.028, 0.055]], 0.0016, 0.0016, '#2a1d14');
  for (const sx of [-1, 1]) {
    bead(h, sx * 0.026, 0.006, 0.05, 0.0072, '#0e0b09');
    ellip(h, sh(base, 0.8), sx * 0.058, 0.004, -0.008, 0.008, 0.01, 0.005);
  }
}

const APE: Builder = (gp, r) => {
  const c = r.color!, sp = (r.sp as string) ?? 'gorilla';
  if (sp === 'sloth') return sloth(gp, r);
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
  const small = Boolean(r.small);
  const back = r.color!, belly = (r.belly as string) ?? '#f8fafc', acc = r.accent ?? '#f59e0b';
  if (small) {
    // Atlantic puffin on a lichen-spotted cliff-top rock with thrift grass and sea campion
    const rock = '#8d8a84';
    vblob(gp, rock, 0, -0.02, 0, 0.3, 0.15, 0.25, (x, y, z) => {
      const [f1, f2] = worley(x * 14, y * 14, z * 14), n = vnoise(x * 40, y * 40, z * 40);
      let col = mx(mx(rock, '#b9b6ae', sst(0.2, 0.0, f1) * 0.5), '#55524c', sst(0.12, 0.02, f2 - f1) * 0.6);
      col = mx(col, '#d9d6c8', sst(0.62, 0.8, n) * 0.6);
      return mx(col, '#d7a531', sst(0.72, 0.85, vnoise(x * 22 + 5, y * 22, z * 22)) * 0.8);
    }, [0, 0.3, 0], 30);
    for (const [x, z, rr] of [[-0.17, 0.1, 0.08], [0.19, -0.05, 0.07], [-0.04, -0.15, 0.06]] as const) {
      vblob(gp, '#6f8a46', x, 0.11 - Math.hypot(x, z) * 0.5, z, rr, rr * 0.35, rr * 0.8, (px, py, pz) => mx('#6f8a46', '#a2a560', sst(0.4, 0.8, vnoise(px * 50, py * 50, pz * 50))), [0, 0, 0], 14);
      for (let i = 0; i < 10; i++) {
        const a = i * 2.4, rr2 = rr * (0.3 + hash3(i, x * 9, 1) * 0.6), b: V3 = [x + Math.cos(a) * rr2, 0.13 - Math.hypot(x, z) * 0.5, z + Math.sin(a) * rr2 * 0.8];
        blade(gp, mx('#7c9a4a', '#c3b878', hash3(i, z * 9, 2)), b, [b[0] + Math.cos(a) * 0.02, b[1] + 0.06 + hash3(i, 3, x * 9) * 0.04, b[2] + Math.sin(a) * 0.02], 0.006, 0.002, [-Math.sin(a), 0, Math.cos(a)]);
        if (i % 3 === 0) vblob(gp, '#f4f1ea', b[0], b[1] + 0.035, b[2], 0.009, 0.007, 0.009, (_x, py) => (py < b[1] + 0.032 ? '#d9c9cf' : null), [0, 0, 0], 8);
      }
    }
    const P = grp(gp, [0.02, 0.098, 0.02], [0, 0.35, 0]);
    P.scale.setScalar(1.3);
    // Body: stocky, tilted forward; black back & collar, white belly, pale grey face disc
    const st: SpSt[] = [
      { p: [0, 0.07, -0.135], w: 0.012, h: 0.006 }, { p: [0, 0.085, -0.1], w: 0.045, h: 0.035 }, { p: [0, 0.1, -0.05], w: 0.08, h: 0.075 },
      { p: [0, 0.13, 0.0], w: 0.088, h: 0.088 }, { p: [0, 0.18, 0.03], w: 0.075, h: 0.075 }, { p: [0, 0.225, 0.04], w: 0.058, h: 0.058 },
      { p: [0, 0.26, 0.045], w: 0.058, h: 0.06 }, { p: [0, 0.295, 0.045], w: 0.048, h: 0.05 }, { p: [0, 0.312, 0.04], w: 0.012, h: 0.012 },
    ];
    const face = '#e7e6e2', fr = framer(st.map(s => s.p), [1, 0, 0]);
    spine(P, st, back, undefined, {
      nu: 64, nv: 36,
      uvp: (u, a, x, y, z) => {
        const s2 = Math.sin(a), c2 = Math.abs(Math.cos(a)), n = vnoise(x * 60, y * 60, z * 60) * 0.06;
        if (u > 0.68 && y > 0.238 && s2 < 0.45 && s2 > -0.55 && c2 > 0.6 - (y - 0.238) * 2) return mx(face, '#a9a9a6', sst(0.8, 0.95, u) * 0.4 + sst(0.3, -0.5, s2) * 0.25);
        if (y < 0.205 && s2 < -0.05 - Math.max(0, z - 0.03) * 3) return mx(belly, '#d8d6d0', sst(-0.05, -0.2, s2) * 0.15 + n);
        return mx(back, '#3d4048', sst(0.3, 1, s2) * 0.3 + n);
      },
    });
    // Eye with red ring and the dark triangular plates above and below
    for (const sx of [-1, 1]) {
      const at = fr(0.86).at(sx * 0.042, 0.012, 0.0);
      vblob(P, '#c43a2f', at[0], at[1], at[2], 0.008, 0.008, 0.008, undefined, [0, 0, 0], 10);
      bead(P, at[0] + sx * 0.004, at[1], at[2] + 0.002, 0.0055, '#0e0e10');
      drop(P, '#4a4c52', [at[0] + sx * 0.002, at[1] + 0.008, at[2]], [at[0] + sx * 0.002, at[1] + 0.02, at[2] - 0.004], 0.004, 0.0015);
      drop(P, '#4a4c52', [at[0] + sx * 0.002, at[1] - 0.007, at[2] - 0.003], [at[0] + sx * 0.001, at[1] - 0.016, at[2] - 0.014], 0.0035, 0.0015);
      vblob(P, '#f2c230', sx * 0.021, 0.262, 0.088, 0.008, 0.006, 0.007, undefined, [0, 0, 0], 8);
      // Folded wing on the flank
      foil(P, back, [
        { le: [sx * 0.076, 0.17, 0.035], te: [sx * 0.08, 0.15, 0.005], t: 0.01 },
        { le: [sx * 0.086, 0.13, -0.02], te: [sx * 0.085, 0.115, -0.045], t: 0.008 },
        { le: [sx * 0.06, 0.1, -0.105], te: [sx * 0.058, 0.094, -0.11], t: 0.003 },
      ], [sx, 0.1, 0], (_x, py, pz) => mx(back, '#1a1b1f', sst(0.12, 0.09, py + pz * 0.2) * 0.4), 14, 10);
      // Bright orange legs and webbed feet
      const hip: V3 = [sx * 0.035, 0.075, 0.0], ft: V3 = [sx * 0.04, 0.025, 0.02];
      tube(P, [hip, [sx * 0.04, 0.048, 0.008], ft], 0.01, 0.008, '#f47a2a');
      vblob(P, '#f47a2a', ft[0], ft[1], ft[2] + 0.022, 0.022, 0.004, 0.026, undefined, [0, sx * 0.15, 0], 12);
      for (const a of [-0.45, 0, 0.45]) drop(P, '#ff8c3a', [ft[0], ft[1] + 0.002, ft[2]], [ft[0] + Math.sin(a + sx * 0.15) * 0.05, ft[1], ft[2] + Math.cos(a + sx * 0.15) * 0.05], 0.004, 0.003);
    }
    // Tall, laterally flattened triangular beak: blue-grey base plate, yellow ridge, orange tip with grooves
    const b0 = fr(0.9).at(0, -0.006, 0.0);
    spine(P, [
      { p: [0, b0[1] - 0.003, b0[2] + 0.034], w: 0.021, h: 0.033 }, { p: [0, b0[1] - 0.006, b0[2] + 0.05], w: 0.017, h: 0.03 },
      { p: [0, b0[1] - 0.011, b0[2] + 0.07], w: 0.011, h: 0.022 }, { p: [0, b0[1] - 0.017, b0[2] + 0.086], w: 0.004, h: 0.008 },
    ], acc, undefined, {
      nu: 22, nv: 20,
      shape: (_u, a) => 1 - 0.25 * Math.abs(Math.cos(a)) ** 2,
      uvp: (u) => (u < 0.24 ? '#6b7e94' : u < 0.31 ? '#f6d23a' : u > 0.5 && u < 0.56 ? '#f5b25a' : u > 0.68 && u < 0.73 ? '#f5a050' : '#ea5a1c'),
    });
    tube(P, [[0, b0[1] - 0.015, b0[2] + 0.04], [0, b0[1] - 0.02, b0[2] + 0.075]], 0.0012, 0.0012, '#7a2c10');
    return;
  }
  // Emperor penguin standing on an ice floe
  vblob(gp, '#e9f2f8', 0, -0.04, 0, 0.36, 0.045, 0.32, (x, _y, z) => mx(mx('#eef5fa', '#bcd3e6', sst(0.45, 0.8, vnoise(x * 9, 2, z * 9)) * 0.6), '#ffffff', sst(0.6, 0.85, vnoise(x * 30, 1, z * 30)) * 0.5), [0, 0, 0], 30);
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3 + 0.5, rr = 0.22 + hash3(i, 1, 4) * 0.08;
    vblob(gp, '#f4f9fc', Math.cos(a) * rr, 0.006, Math.sin(a) * rr, 0.06 + hash3(i, 2, 4) * 0.04, 0.014, 0.035, (x, y) => mx('#f4f9fc', '#c5d9ea', sst(0.03, 0.0, y + x * 0.05) * 0.5), [0, a, 0], 12);
  }
  const blk = mx(back, '#111318', 0.5), slate = mx(back, '#55606e', 0.45), gold = mix(acc, '#ffb000', 0.4), cream = '#f6eccd';
  const st: SpSt[] = [
    { p: [0, 0.012, -0.01], w: 0.07, h: 0.07 }, { p: [0, 0.06, 0.0], w: 0.135, h: 0.128 }, { p: [0, 0.19, 0.012], w: 0.162, h: 0.15 },
    { p: [0, 0.34, 0.012], w: 0.152, h: 0.14 }, { p: [0, 0.48, 0.0], w: 0.116, h: 0.11 }, { p: [0, 0.585, 0.0], w: 0.082, h: 0.085 },
    { p: [0, 0.65, 0.016], w: 0.068, h: 0.074 }, { p: [0, 0.69, 0.024], w: 0.05, h: 0.05 },
  ];
  // Upper body leans slightly forward over the feet, pivoting at the base
  const B = grp(gp, [0, 0.01, 0], [0.14, 0, 0]);
  spine(B, st, back, undefined, {
    nu: 80, nv: 48, side: [-1, 0, 0],
    // Pot belly low on the front, gentle chest swell under the throat, faint feather ripple
    shape: (u, a) => 1 + Math.max(0, Math.sin(a)) * (0.075 * Math.exp(-(((u - 0.3) / 0.16) ** 2)) + 0.03 * Math.exp(-(((u - 0.7) / 0.08) ** 2)))
      + (vnoise(Math.cos(a) * 5, Math.sin(a) * 5, u * 14) - 0.5) * 0.02,
    // N = +z: sin(a) > 0 faces forward
    uvp: (_u, a, x, y, z) => {
      const s2 = Math.sin(a), c2 = Math.abs(Math.cos(a)), n = vnoise(x * 50, y * 50, z * 50) * 0.08;
      const edge = -0.32 + sst(0.45, 0.6, y) * 0.5;
      const dark = mx(mx(slate, blk, sst(edge - 0.3, edge, s2) + sst(0.45, 0.57, y) * 0.6), '#7d8896', sst(-0.6, -1, s2) * 0.25 + n);
      // Pale lemon wash on the upper breast deepening to golden-orange under the throat
      const yel = sst(0.33, 0.55, y) * sst(edge + 0.18, edge + 0.6, s2);
      const white = mx(mx(belly, '#e9ecef', sst(edge + 0.25, edge, s2) * 0.6 + n), mx(mx(cream, '#fbe08e', sst(0.4, 0.5, y)), gold, sst(0.48, 0.6, y) * 0.7), yel);
      let col = mx(dark, white, sst(edge - 0.05, edge + 0.05, s2));
      col = mx(col, mx(blk, '#22262e', n * 3), sst(0.575, 0.6, y));
      // Comma-shaped ear patch on the neck side, tapering down towards the pale-gold upper breast
      let e1 = 9;
      for (let t = 0; t <= 1; t += 0.2) e1 = Math.min(e1, Math.hypot((y - 0.622 + t * 0.04) / (0.028 - t * 0.012), (s2 + 0.15 - t * 0.6) / 0.3));
      const pw = sst(1, 0.6, e1) * sst(0.12, 0.35, c2);
      return mx(col, mx(gold, '#ffcf3a', sst(1, 0.3, e1) * 0.6), pw);
    },
  });
  vblob(B, blk, 0, 0.695, 0.03, 0.064, 0.066, 0.078, (x, y, z) => mx(blk, '#2c323c', sst(0.3, 0.9, vnoise(x * 40, y * 40, z * 40)) * 0.4 + sst(0.72, 0.76, y) * 0.2), [0.2, 0, 0], 26);
  // Long slender down-curved beak: black with a pink-orange lower mandible plate
  spine(B, [{ p: [0, 0.69, 0.07], w: 0.02, h: 0.018 }, { p: [0, 0.69, 0.12], w: 0.012, h: 0.011 }, { p: [0, 0.682, 0.16], w: 0.007, h: 0.007 }, { p: [0, 0.668, 0.19], w: 0.002, h: 0.002 }],
    blk, undefined, { nu: 20, nv: 14, uvp: (u, a) => (Math.sin(a) < -0.2 && u < 0.62 ? mix(acc, '#f08a5a', 0.4) : null) });
  for (const sx of [-1, 1]) {
    bead(B, sx * 0.05, 0.7, 0.054, 0.008, '#1a120c');
    // Flippers hanging along the flanks: dark outside with a pale trailing edge, white underside
    foil(B, blk, [
      { le: [sx * 0.08, 0.56, 0.03], te: [sx * 0.085, 0.56, -0.035], t: 0.012 },
      { le: [sx * 0.112, 0.51, 0.036], te: [sx * 0.117, 0.51, -0.04], t: 0.016 },
      { le: [sx * 0.155, 0.4, 0.035], te: [sx * 0.158, 0.4, -0.03], t: 0.012 },
      { le: [sx * 0.172, 0.27, 0.018], te: [sx * 0.168, 0.26, -0.02], t: 0.008 },
      { le: [sx * 0.168, 0.2, -0.008], te: [sx * 0.166, 0.195, -0.012], t: 0.003 },
    ], [sx, 0, 0], (px, _py, pz, nx) => (nx * sx < -0.3 ? '#eceff2' : pz < -0.012 + Math.abs(px) * 0 && nx * sx > 0.3 ? mx(slate, '#c8d0d8', 0.35) : mx(blk, slate, 0.25)), 20, 12);
    // Dark scaly feet with claws peeking from under the belly feathers
    const ft: V3 = [sx * 0.055, 0.012, 0.1];
    vblob(gp, '#34343a', ft[0], ft[1], ft[2], 0.032, 0.012, 0.034, undefined, [0, sx * 0.25, 0], 12);
    for (const a of [-0.45, 0, 0.45]) {
      const tp: V3 = [ft[0] + Math.sin(a + sx * 0.25) * 0.06, 0.006, ft[2] + Math.cos(a + sx * 0.25) * 0.06];
      drop(gp, '#3a3a40', [ft[0], 0.012, ft[2]], tp, 0.008, 0.006);
      drop(gp, '#18181b', tp, [tp[0] + Math.sin(a) * 0.012, 0.002, tp[2] + Math.cos(a) * 0.012], 0.0035, 0.0025);
    }
  }
  // Stiff short tail propping on the ice
  drop(gp, blk, [0, 0.07, -0.1], [0, 0.008, -0.16], 0.03, 0.012);
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

/** Brown kiwi foraging on the forest floor: pear-shaped shaggy body, long probing bill, stout scaly legs. */
const ROUNDBIRD: Builder = (gp, r) => {
  const c = r.color!, dk = '#43301f', lt = mx(c, '#c9a77a', 0.6);
  const plum: Paint = (x, y, z, _nx, ny) => {
    const s = fbm(x * 95 + 7, y * 95, z * 16, 3);
    const b = ny < -0.3 ? mx(c, '#9a8a74', sst(-0.3, -0.9, ny) * 0.5) : c;
    return s > 0.5 ? mx(b, lt, Math.min(0.85, (s - 0.5) * 2.4)) : mx(b, dk, Math.min(0.85, (0.5 - s) * 2.2));
  };
  // Forest floor with leaf litter, a fallen twig and a small fern
  const soil = '#4a3a2a';
  vblob(gp, soil, 0, -0.012, 0, 0.38, 0.03, 0.34, (x, y, z) => {
    const [f1, f2] = worley(x * 26, y * 26, z * 26);
    const h = hash3(Math.floor(x * 26 + f1), 0, Math.floor(z * 26));
    return f2 - f1 < 0.08 ? '#2f241a' : mx(h > 0.6 ? '#8a5a2a' : h > 0.3 ? '#6b4a2a' : '#5a4a30', soil, f1 * 0.8);
  }, [0, 0, 0], 40);
  const lc = ['#9a6a32', '#7a5228', '#b07a3a', '#6e6a3a'];
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4, rr = 0.18 + hash3(i, 2, 5) * 0.16, x = Math.cos(a) * rr, z = Math.sin(a) * rr * 0.9;
    blade(gp, lc[i % 4], [x, 0.016, z], [x + Math.cos(a * 3) * 0.06, 0.02, z + Math.sin(a * 3) * 0.06], 0.02, 0.003, [0, 1, 0]);
  }
  tube(gp, [[-0.36, 0.02, -0.12], [-0.15, 0.024, -0.22], [0.08, 0.02, -0.3]], 0.016, 0.01, '#5a4532');
  for (let f = 0; f < 3; f++) {
    const a = 2.3 + f * 0.55, base: V3 = [-0.25, 0.01, -0.2], pts: V3[] = [];
    for (let j = 0; j <= 4; j++) { const t = j / 4; pts.push([base[0] + Math.cos(a) * 0.22 * t, base[1] + 0.2 * Math.sin(t * 2.2) , base[2] - Math.sin(a) * 0.22 * t * 0.5 - 0.12 * t]); }
    tube(gp, pts, 0.005, 0.002, '#3f5a2a');
    for (let j = 1; j < 9; j++) {
      const t = j / 9, q = pts[Math.min(3, Math.floor(t * 4))], q2 = pts[Math.min(4, Math.floor(t * 4) + 1)], u = t * 4 - Math.floor(t * 4);
      const pt: V3 = [q[0] + (q2[0] - q[0]) * u, q[1] + (q2[1] - q[1]) * u, q[2] + (q2[2] - q[2]) * u];
      const d = nrm([q2[0] - q[0], q2[1] - q[1], q2[2] - q[2]]), sd = nrm([-d[2], 0, d[0]]), L = 0.055 * (1 - t * 0.6);
      for (const s of [-1, 1]) blade(gp, j % 2 ? '#4f7a32' : '#5d8a3a', pt, [pt[0] + sd[0] * s * L + d[0] * L * 0.4, pt[1] - L * 0.25, pt[2] + sd[2] * s * L + d[2] * L * 0.4], 0.011, 0.002, [0, 1, 0]);
    }
  }
  // Pear-shaped body, widest behind the legs, sloping into a small round head
  spine(gp, [
    { p: [0, 0.272, -0.268], w: 0.02, h: 0.02 }, { p: [0, 0.274, -0.252], w: 0.085, h: 0.085 }, { p: [0, 0.277, -0.215], w: 0.135, h: 0.132 }, { p: [0, 0.27, -0.11], w: 0.165, h: 0.16 },
    { p: [0, 0.262, 0.0], w: 0.16, h: 0.152 }, { p: [0, 0.27, 0.1], w: 0.128, h: 0.126 }, { p: [0, 0.295, 0.17], w: 0.086, h: 0.09 },
    { p: [0, 0.318, 0.205], w: 0.062, h: 0.064 }, { p: [0, 0.333, 0.235], w: 0.05, h: 0.05 }, { p: [0, 0.336, 0.262], w: 0.036, h: 0.035 },
  ], c, plum, { nv: 36, shape: (u, a) => 1 + (vnoise(Math.cos(a) * 11 + 4, Math.sin(a) * 11, u * 3) - 0.5) * 0.1 + Math.max(0, -Math.sin(a)) * (vnoise(Math.cos(a) * 20, 1, u * 9) - 0.5) * 0.1 });
  // Loose hair-like plumes along the flanks, rump and belly fringe
  for (let i = 0; i < 80; i++) {
    const u = 0.1 + hash3(i, 1, 4) * 0.74, a = Math.PI * (1.02 + hash3(i, 5, 2) * 0.96) + (i % 2 ? 0 : Math.PI * 0.04);
    const z = -0.25 + u * 0.43, rad = 0.158 * Math.sin(Math.PI * Math.min(1, (z + 0.26) / 0.5)) + 0.008;
    const ca = Math.cos(a), sa = Math.sin(a);
    const b: V3 = [ca * rad, 0.268 + sa * rad * 0.97, z];
    const rear = sst(-0.1, -0.24, z), len = (0.06 + hash3(i, 9, 9) * 0.05) * (1 - rear * 0.35);
    const tip: V3 = [b[0] + ca * len * 0.08, b[1] - len * (0.35 + rear * 0.6) + sa * len * 0.05, b[2] - len * (0.92 - rear * 0.75)];
    blade(gp, sh(plum(...b, ca, sa, 0) ?? c, 0.95 + hash3(i, 3, 3) * 0.2), b, tip, 0.007, 0.003, [ca, sa, 0]);
  }
  const h = grp(gp, [0, 0.338, 0.248], [0.45, 0, 0]);
  vblob(h, c, 0, 0, 0, 0.044, 0.043, 0.046, (x, y, z, nx, ny, nz) => (nz > 0.75 ? mx(c, '#a08c74', 0.3) : plum(x, y, z * 2, nx, ny, nz)), [0, 0, 0], 20);
  // Long, slightly decurved bill with nostrils at the very tip; whisker bristles at the gape
  const bill = '#e6d0b2';
  vpaint(sweep(h, [
    { p: [0, -0.008, 0.03], w: 0.017, h: 0.016 }, { p: [0, -0.014, 0.1], w: 0.0105, h: 0.01 },
    { p: [0, -0.024, 0.17], w: 0.0085, h: 0.008 }, { p: [0, -0.042, 0.235], w: 0.0075, h: 0.0072 }, { p: [0, -0.06, 0.262], w: 0.0062, h: 0.006 },
  ], bill, { radial: 12, sub: 6 }), bill, (_x, _y, z) => mx(bill, '#b39373', sst(0.12, 0.27, z)));
  ellip(h, '#b39373', 0, -0.061, 0.264, 0.0062);
  for (const sx of [-1, 1]) {
    ellip(h, '#3a2a1c', sx * 0.004, -0.057, 0.255, 0.0016, 0.0016, 0.004);
    bead(h, sx * 0.025, 0.01, 0.034, 0.005, '#0c0a08');
    for (let k = 0; k < 4; k++) tube(h, [[sx * 0.011, -0.004 - k * 0.004, 0.04], [sx * (0.04 + k * 0.006), -0.0 - k * 0.012, 0.068 + k * 0.004]], 0.0011, 0.0006, '#2a1e14');
  }
  // Stout scaly legs with thick toes and digging claws (one stepping forward)
  const leg = '#968272';
  const scales: Paint = (_x, y, z) => (Math.sin(y * 420 + z * 80) > 0.55 ? sh(leg, 0.8) : null);
  for (const [sx, dz] of [[-1, 0.05], [1, -0.03]] as const) {
    const hip: V3 = [sx * 0.07, 0.16, dz - 0.02], ank: V3 = [sx * 0.074, 0.03, dz + 0.02];
    vblob(gp, c, hip[0], 0.165, hip[2], 0.05, 0.05, 0.055, plum, [0, 0, 0], 14);
    vpaint(limb(gp, leg, [[hip, 0.026, 0.028], [[sx * 0.072, 0.09, dz], 0.021, 0.022], [ank, 0.019, 0.02]], undefined, 12), leg, scales);
    for (const a of [-0.45, 0, 0.45]) {
      const tp: V3 = [ank[0] + Math.sin(a) * 0.065, 0.008, ank[2] + Math.cos(a) * 0.065];
      vpaint(sweep(gp, [{ p: [ank[0], 0.022, ank[2]], w: 0.013 }, { p: [(ank[0] + tp[0]) / 2, 0.012, (ank[2] + tp[2]) / 2], w: 0.009 }, { p: tp, w: 0.007 }], leg, { radial: 10, sub: 3 }), leg, scales);
      blade(gp, '#2e2620', tp, [tp[0] + Math.sin(a) * 0.022, 0.002, tp[2] + Math.cos(a) * 0.022], 0.006, 0.004, [0, 1, 0]);
    }
    tube(gp, [[ank[0], 0.02, ank[2]], [ank[0], 0.01, ank[2] - 0.035]], 0.008, 0.005, leg);
  }
};

/** Smooth sea patch with ripple rings spreading from `rings` centres and foam close to them (sits at y≈0). */
function water(gp: THREE.Group, rx: number, rz: number, rings: [number, number, number][] = [], c = '#2f7fb8'): void {
  vblob(gp, c, 0, -0.008, 0, rx, 0.026, rz, (x, _y, z) => {
    const e = Math.hypot(x / rx, z / rz);
    let col = mx(mx(c, '#1d5f95', sst(0.2, 1, e) * 0.5), '#4aa3d6', sst(0.5, 0.7, vnoise(x * 9, 3, z * 9)) * 0.35);
    for (const [cx, cz, cr] of rings) {
      const d = Math.hypot(x - cx, z - cz) / cr;
      if (d < 4) col = mx(col, '#cfeaff', Math.max(sst(1.1, 0.5, d) * 0.6, sst(0.7, 0.98, Math.sin(d * 7)) * 0.4 * (1 - d / 4)));
    }
    return col;
  }, [0, 0, 0], 40);
}
/** Foam crown and flying droplets where a body breaks the surface. */
function splash(gp: THREE.Group, x: number, z: number, r: number, k = 0): void {
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + hash3(i, k, 1), rr = r * (0.8 + hash3(i, k, 2) * 0.4), hgt = r * (0.5 + hash3(i, k, 3) * 0.9);
    drop(gp, '#eaf6ff', [x + Math.cos(a) * rr * 0.7, 0.008, z + Math.sin(a) * rr * 0.7], [x + Math.cos(a) * rr * 1.15, hgt, z + Math.sin(a) * rr * 1.15], r * 0.22);
    if (i % 2) vblob(gp, '#f4fbff', x + Math.cos(a) * rr * 1.4, hgt * 1.3, z + Math.sin(a) * rr * 1.4, r * 0.08, r * 0.08, r * 0.08, undefined, [0, 0, 0], 8);
  }
}
/** Moving frame along a centripetal Catmull-Rom spine (same convention as `spine`). */
function framer(pts: V3[], side: V3) {
  const cu = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'centripetal'), sd = new THREE.Vector3(...side);
  return (u: number) => {
    const P = cu.getPoint(u), T = cu.getTangent(u), N = new THREE.Vector3().crossVectors(T, sd).normalize(), S = new THREE.Vector3().crossVectors(N, T).normalize();
    /** Point offset by s along the side axis, n along the up normal and t along the tangent. */
    const at = (s0: number, n0: number, t0 = 0): V3 => [P.x + S.x * s0 + N.x * n0 + T.x * t0, P.y + S.y * s0 + N.y * n0 + T.y * t0, P.z + S.z * s0 + N.z * n0 + T.z * t0];
    return { P, T, N, S, at };
  };
}

const WHALE: Builder = (gp, r) => {
  const c = r.color!;
  if (r.fin) {
    // Bottlenose dolphin leaping in an arc: melon & short beak, falcate dorsal fin, dark cape over grey flanks, pale belly
    water(gp, 0.36, 0.5, [[0, -0.36, 0.06]]);
    const dk = mx(c, '#2f3a46', 0.7), belly = '#eef1f3';
    const tab: [number, number, number][] = [[0, 0.007, 0.011], [0.08, 0.014, 0.03], [0.2, 0.03, 0.05], [0.35, 0.056, 0.068], [0.5, 0.07, 0.078],
      [0.65, 0.072, 0.076], [0.78, 0.062, 0.066], [0.86, 0.05, 0.054], [0.905, 0.036, 0.034], [0.925, 0.025, 0.022], [0.96, 0.019, 0.016], [1, 0.007, 0.007]];
    const wh = (u: number): [number, number] => {
      let k = 0;
      while (k < tab.length - 2 && tab[k + 1][0] < u) k++;
      const t = Math.min(1, Math.max(0, (u - tab[k][0]) / (tab[k + 1][0] - tab[k][0])));
      return [tab[k][1] + (tab[k + 1][1] - tab[k][1]) * t, tab[k][2] + (tab[k + 1][2] - tab[k][2]) * t];
    };
    const NS = 28, pts: V3[] = [], st: SpSt[] = [];
    for (let k = 0; k <= NS; k++) {
      const u = k / NS, th = -1.2 + u * 1.95, R = 0.4 + Math.max(0, u - 0.88) * 0.4;
      const p: V3 = [0, -0.04 + R * Math.cos(th), R * Math.sin(th)];
      const [w, h] = wh(u);
      pts.push(p); st.push({ p, w, h });
    }
    const F = framer(pts, [1, 0, 0]);
    const dolphinP = (u: number, a: number) => {
      const s2 = Math.sin(a), cape = 0.42 - 0.3 * Math.exp(-(((u - 0.6) / 0.12) ** 2)) + (u > 0.85 ? -0.15 : 0);
      const lo = -0.32 + 0.08 * Math.sin(u * 6);
      return s2 > cape ? mx(c, dk, sst(cape, cape + 0.25, s2)) : s2 < lo ? mx(c, belly, sst(lo, lo - 0.25, s2)) : c;
    };
    spine(gp, st, c, undefined, {
      nu: 84, nv: 30,
      shape: (u, a) => 1 + Math.max(0, Math.sin(a)) * 0.22 * Math.exp(-(((u - 0.86) / 0.04) ** 2)),
      uvp: (u, a) => dolphinP(u, a),
    });
    // Falcate dorsal fin, flippers and flukes
    const top = (u: number) => F(u).at(0, wh(u)[1] * 0.9);
    const fd = (u: number, n: number, t: number) => { const f = F(u), b = top(u); return [b[0] + f.N.x * n + f.T.x * t, b[1] + f.N.y * n + f.T.y * t, b[2] + f.N.z * n + f.T.z * t] as V3; };
    const fs = F(0.52).S;
    foil(gp, dk, [
      { le: fd(0.6, 0, 0), te: fd(0.44, 0, 0), t: 0.012 }, { le: fd(0.56, 0.045, -0.01), te: fd(0.47, 0.035, -0.015), t: 0.008 },
      { le: fd(0.52, 0.075, -0.03), te: fd(0.49, 0.065, -0.04), t: 0.004 }, { le: fd(0.49, 0.088, -0.055), te: fd(0.485, 0.084, -0.058), t: 0.002 },
    ], [fs.x, fs.y, fs.z], undefined, 12, 12);
    for (const sx of [-1, 1]) {
      const f = F(0.76), [w, h] = wh(0.76), b = f.at(sx * w * 0.8, -h * 0.55);
      const o = (s0: number, n0: number, t0: number): V3 => [b[0] + f.S.x * s0 + f.N.x * n0 + f.T.x * t0, b[1] + f.S.y * s0 + f.N.y * n0 + f.T.y * t0, b[2] + f.S.z * s0 + f.N.z * n0 + f.T.z * t0];
      foil(gp, dk, [{ le: o(0, 0, 0.025), te: o(0, 0, -0.025), t: 0.01 }, { le: o(sx * 0.045, -0.035, -0.02), te: o(sx * 0.04, -0.03, -0.05), t: 0.006 }, { le: o(sx * 0.075, -0.06, -0.07), te: o(sx * 0.072, -0.058, -0.08), t: 0.002 }],
        [f.N.x, f.N.y, f.N.z], undefined, 10, 10);
      const ft = F(0.01), q = (s0: number, t0: number, n0 = 0): V3 => ft.at(s0, n0, t0);
      foil(gp, dk, [{ le: q(0, 0.015), te: q(0, -0.03), t: 0.011 }, { le: q(sx * 0.05, -0.005, 0.003), te: q(sx * 0.042, -0.045, 0.003), t: 0.007 },
        { le: q(sx * 0.095, -0.04, 0.008), te: q(sx * 0.088, -0.06, 0.008), t: 0.003 }, { le: q(sx * 0.115, -0.07, 0.01), te: q(sx * 0.112, -0.074, 0.01), t: 0.0015 }], [ft.N.x, ft.N.y, ft.N.z], undefined, 10, 10);
      // Eye with a dark eye patch, mouth line along the beak
      const fe = F(0.875), [we, he] = wh(0.875);
      bead(gp, ...fe.at(sx * we * 0.93, -he * 0.1, 0), 0.007, '#0b0f14');
      const m1 = F(0.99).at(sx * 0.005, -0.003), m2 = F(0.93).at(sx * 0.02, -0.006), m3 = F(0.9).at(sx * 0.03, -0.012);
      tube(gp, [m1, m2, m3], 0.0018, 0.0018, '#3a4450');
    }
    splash(gp, 0, -0.36, 0.05, 1);
    for (let i = 0; i < 7; i++) { const f = F(0.02 + i * 0.04); vblob(gp, '#eaf6ff', f.P.x + (hash3(i, 2, 2) - 0.5) * 0.06, f.P.y * (0.3 + i * 0.1), f.P.z - 0.02, 0.008, 0.008, 0.008, undefined, [0, 0, 0], 8); }
    return;
  }
  // Blue whale cruising at the surface: very long slender mottled body, flat U-shaped head with a splash guard,
  // ventral throat pleats, tiny dorsal fin far back, slender pale-edged flippers and broad notched flukes, columnar spout
  const roll = -0.3, base = mx(c, '#7b8c9c', 0.35), pale = mx(base, '#c9d4de', 0.55);
  water(gp, 0.38, 0.6, [[0.02, 0.32, 0.12], [0, -0.1, 0.13], [0, -0.5, 0.08]]);
  const wg = grp(gp, [0, 0.105, 0], [0, 0, roll]);
  const S0: [number, number, number, number][] = [[-0.5, 0.025, 0.011, 0.011], [-0.47, 0.022, 0.015, 0.026], [-0.39, 0.015, 0.03, 0.048], [-0.27, 0.007, 0.058, 0.068],
    [-0.13, 0.002, 0.088, 0.086], [0.01, 0, 0.104, 0.096], [0.14, 0, 0.105, 0.09], [0.26, 0.002, 0.096, 0.074], [0.36, 0, 0.082, 0.054], [0.44, -0.005, 0.068, 0.036], [0.485, -0.008, 0.042, 0.024], [0.5, -0.009, 0.012, 0.01]];
  const st: SpSt[] = S0.map(([z, y, w, h]) => ({ p: [0, y, z], w, h }));
  const tg = grp(wg, [0, 0.03, -0.45], [0, 0, -roll * 1.1]);
  const mott: Paint = (x, y, z) => {
    const [f1] = worley(x * 34 + 3, y * 34, z * 34), n = vnoise(x * 14, y * 14 + 2, z * 14);
    return mx(mx(base, '#9fb0c0', sst(0.3, 0.05, f1) * 0.35), sh(base, 0.72), sst(0.45, 0.8, n) * 0.4);
  };
  spine(wg, st, base, undefined, {
    nu: 70, nv: 88,
    shape: (u, a) => {
      const s2 = Math.sin(a), zone = sst(0.42, 0.52, u) * (1 - sst(0.88, 0.95, u)), ven = sst(-0.25, -0.5, s2);
      return 1 - 0.035 * zone * ven * Math.pow(0.5 + 0.5 * Math.cos(a * 24), 3) + Math.max(0, s2) * 0.05 * sst(0.75, 0.9, u) * Math.exp(-((Math.cos(a) / 0.25) ** 2));
    },
    uvp: (u, a, x, y, z) => {
      const s2 = Math.sin(a), zone = sst(0.42, 0.52, u) * (1 - sst(0.88, 0.95, u)), ven = sst(-0.2, -0.55, s2);
      const m = mott(x, y, z, 0, 0, 0) ?? base;
      if (ven * zone > 0.05) return mx(mx(m, pale, ven * 0.6), '#7d8a99', zone * ven * Math.pow(0.5 + 0.5 * Math.cos(a * 24), 3) * 0.8);
      return s2 < -0.3 ? mx(m, pale, sst(-0.3, -0.8, s2) * 0.45) : m;
    },
  });
  // Splash guard ridge and paired blowholes; mouth line; small eye behind the gape
  vblob(wg, base, 0, 0.074, 0.305, 0.03, 0.012, 0.03, mott, [0, 0, 0], 14);
  for (const sx of [-1, 1]) {
    pblob(wg, '#23303d', sx * 0.009, 0.08, 0.282, 0.005, 0.003, 0.016, undefined, [0, sx * 0.25, 0], 10);
    tube(wg, [[sx * 0.019, -0.004, 0.488], [sx * 0.047, -0.01, 0.45], [sx * 0.073, -0.016, 0.37], [sx * 0.086, -0.022, 0.3]], 0.0022, 0.0022, '#2c3a48');
    bead(wg, sx * 0.089, -0.012, 0.28, 0.0065, '#0b1118');
    foil(wg, base, [
      { le: [sx * 0.085, -0.045, 0.2], te: [sx * 0.085, -0.05, 0.145], t: 0.013 }, { le: [sx * 0.155, -0.07, 0.14], te: [sx * 0.15, -0.075, 0.105], t: 0.009 },
      { le: [sx * 0.225, -0.095, 0.05], te: [sx * 0.222, -0.097, 0.04], t: 0.003 },
    ], [sx * 0.35, 1, 0], (_x, _y, _z, _nx, ny) => (ny < 0 ? pale : base), 12, 12);
    foil(tg, base, [
      { le: [0, 0.006, 0.03], te: [0, -0.012, -0.05], t: 0.016 }, { le: [sx * 0.08, 0.004, 0.0], te: [sx * 0.07, -0.014, -0.08], t: 0.011 },
      { le: [sx * 0.15, 0.002, -0.04], te: [sx * 0.135, -0.008, -0.09], t: 0.006 }, { le: [sx * 0.2, 0.0, -0.085], te: [sx * 0.195, -0.004, -0.102], t: 0.002 },
    ], [0, 1, 0.3], mott, 12, 12);
  }
  foil(wg, base, [
    { le: [0, 0.055, -0.22], te: [0, 0.05, -0.3], t: 0.009 }, { le: [0, 0.075, -0.265], te: [0, 0.07, -0.3], t: 0.006 }, { le: [0, 0.088, -0.295], te: [0, 0.085, -0.305], t: 0.002 },
  ], [1, 0, 0], mott, 10, 10);
  // Misty V-shaped blow from the paired blowholes: puffs that grow, spread and fade with height
  const bh: V3 = [-0.08 * Math.sin(roll), 0.105 + 0.08 * Math.cos(roll), 0.285];
  for (const sx of [-1, 1]) for (let i = 0; i < 12; i++) {
    const t = i / 11, hgt = 0.015 + t * 0.26, sp = 0.008 + t * 0.07, r0 = 0.01 + t * 0.036;
    for (let k = 0; k < (i < 4 ? 1 : 3); k++) {
      const jx = (hash3(i, k, sx + 3) - 0.5) * r0 * 1.4, jz = (hash3(k, i, sx + 5) - 0.5) * r0 * 1.4;
      const m = pblob(gp, '#f4faff', bh[0] + sx * sp + jx, bh[1] + hgt + (hash3(i, k, 7) - 0.5) * 0.03, bh[2] - t * 0.03 + jz, r0, r0 * 0.85, r0, undefined, [0, 0, 0], 10);
      const mm = mat('#eef6fc', { transparent: Math.round((0.42 - t * 0.3) * 10) / 10, flat: false, emissive: '#b8cfe0' });
      mm.depthWrite = false;
      m.material = mm;
    }
  }
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
  // Green sea turtle gliding over a sandy reef patch: domed teardrop carapace with radiating scutes and pale seams,
  // pale plastron, scaly head with a pale-edged polygon pattern, long paddle fore-flippers and short hind flippers
  const c = r.color!, shell = mx(c, '#6b4a26', 0.65), sLt = mx(shell, '#c08a48', 0.6), sDk = sh(shell, 0.55), seam = '#b9a06c';
  seabed(gp, 0.48, 0.5, '#e2d3a8');
  // Brain corals with meandering grooves and a little branching coral
  for (const [x, z, rr, col] of [[-0.31, -0.24, 0.075, '#c9b27a'], [0.33, 0.26, 0.06, '#c79a86'], [-0.3, 0.3, 0.05, '#b5ad78']] as const) {
    vblob(gp, col, x, 0.015, z, rr, rr * 0.75, rr, (px, py, pz) => mx(col, sh(col, 0.62), sst(0.55, 0.85, Math.abs(Math.sin(vnoise(px * 30, py * 30, pz * 30) * 14)))), [0, 0, 0], 22);
  }
  for (let i = 0; i < 6; i++) {
    const a = i * 1.1, b: V3 = [0.34 + Math.cos(a) * 0.015, 0.0, -0.2 + Math.sin(a) * 0.015];
    tube(gp, [b, [b[0] + Math.cos(a) * 0.03, 0.05, b[2] + Math.sin(a) * 0.03], [b[0] + Math.cos(a) * 0.05, 0.09 + (i % 3) * 0.015, b[2] + Math.sin(a) * 0.05]], 0.009, 0.006, '#e08a6e');
  }
  const y0 = 0.27;
  const scale = (base: string, k = 30): Paint => (x, y, z) => {
    const [f1, f2] = worley(x * k, y * k, z * k);
    return mx(mx(base, '#24180e', 0.25 + f1 * 0.35), '#d8c08e', sst(0.14, 0.04, f2 - f1) * 0.75);
  };
  const skin = mx(c, '#5a4428', 0.55);
  // Carapace: segment grid (vertebral / costal / marginal rows) evaluated in loft parameters
  const scute = (u: number, a: number): string => {
    const s2 = Math.sin(a);
    if (s2 < -0.08) return mx('#e9dcae', '#d6c48c', sst(-0.1, -0.9, s2) * 0.4);
    const ang = Math.abs(Math.atan2(Math.cos(a), Math.max(1e-3, s2)));
    const [n, a0, a1, u0, u1] = ang < 0.5 ? [5, 0, 0.5, 0.1, 0.92] : ang < 1.22 ? [4, 0.5, 1.22, 0.12, 0.88] : [11, 1.22, 1.62, 0.02, 0.98];
    const fu = Math.min(0.999, Math.max(0, (u - u0) / (u1 - u0))) * n, iu = Math.floor(fu), lu = fu - iu, la = (ang - a0) / (a1 - a0);
    if (u < u0 || u > u1 || lu < 0.035 || lu > 0.965 || la < 0.03 || la > 0.97) return seam;
    const th = Math.atan2(la - 0.5, lu - 0.5), d = Math.hypot(la - 0.5, lu - 0.5);
    const streak = 0.5 + 0.5 * Math.sin(th * 7 + hash3(iu, n, 3) * 6) * Math.min(1, d * 2.2);
    return mx(mx(sDk, sLt, 0.25 + streak * 0.6), shell, hash3(iu, n, 5) * 0.4);
  };
  const tg = grp(gp, [0, y0, 0], [0.06, 0, 0.05]);
  spine(tg, [
    { p: [0, 0.0, -0.31], w: 0.012, h: 0.01 }, { p: [0, 0, -0.27], w: 0.075, h: 0.04 }, { p: [0, 0, -0.18], w: 0.155, h: 0.085 }, { p: [0, 0, -0.06], w: 0.2, h: 0.108 },
    { p: [0, 0, 0.06], w: 0.208, h: 0.112 }, { p: [0, 0, 0.16], w: 0.178, h: 0.098 }, { p: [0, 0, 0.22], w: 0.12, h: 0.07 }, { p: [0, 0, 0.25], w: 0.04, h: 0.03 },
  ], shell, undefined, {
    nu: 64, nv: 60,
    shape: (_u, a) => { const s2 = Math.sin(a); return s2 < 0 ? 1 - 0.62 * sst(0, 1, -s2) : 1 + 0.03 * Math.exp(-((s2 / 0.12) ** 2)); },
    uvp: (u, a) => scute(u, a),
  });
  // Head & neck
  const hd = grp(tg, [0, 0.0, 0.25], [0.12, 0, 0]);
  spine(hd, [{ p: [0, 0, -0.05], w: 0.05, h: 0.04 }, { p: [0, 0.004, 0.0], w: 0.046, h: 0.038 }, { p: [0, 0.014, 0.05], w: 0.058, h: 0.05 },
    { p: [0, 0.014, 0.095], w: 0.05, h: 0.045 }, { p: [0, 0.0, 0.125], w: 0.026, h: 0.024 }], skin, (x, y, z, nx, ny, nz) => (ny < -0.35 ? mx('#e9dcae', skin, 0.25) : scale(skin, 42)(x, y, z, nx, ny, nz)), { nv: 30, nu: 40 });
  for (const sx of [-1, 1]) {
    vblob(hd, '#e9dcae', sx * 0.042, 0.02, 0.07, 0.014, 0.012, 0.013, undefined, [0, 0, 0], 12);
    bead(hd, sx * 0.048, 0.021, 0.074, 0.009, '#0d0b09');
    tube(hd, [[sx * 0.014, -0.012, 0.122], [sx * 0.032, -0.014, 0.095], [sx * 0.044, -0.008, 0.07]], 0.0018, 0.0018, '#2a1e14');
  }
  // Flippers: long fore-flippers mid-stroke, short rounded hind flippers
  for (const sx of [-1, 1]) {
    foil(tg, skin, [
      { le: [sx * 0.15, -0.01, 0.17], te: [sx * 0.15, -0.015, 0.08], t: 0.024 },
      { le: [sx * 0.27, 0.0, 0.12], te: [sx * 0.26, -0.01, 0.05], t: 0.016 },
      { le: [sx * 0.38, -0.01, 0.03], te: [sx * 0.35, -0.018, -0.01], t: 0.01 },
      { le: [sx * 0.44, -0.03, -0.07], te: [sx * 0.42, -0.03, -0.075], t: 0.004 },
    ], [-sx * 0.2, 1, 0], scale(skin, 32), 26, 16);
    foil(tg, skin, [
      { le: [sx * 0.08, -0.02, -0.22], te: [sx * 0.07, -0.02, -0.27], t: 0.016 },
      { le: [sx * 0.14, -0.022, -0.27], te: [sx * 0.11, -0.022, -0.33], t: 0.01 },
      { le: [sx * 0.165, -0.025, -0.33], te: [sx * 0.15, -0.025, -0.35], t: 0.004 },
    ], [0, 1, 0], scale(skin, 32), 12, 12);
  }
  tube(tg, [[0, -0.01, -0.29], [0, -0.016, -0.33]], 0.012, 0.004, skin);
};

/** Low cup with a rim and a central dimple (octopus sucker), +y out of the skin. */
const SUCKER = () => g('an-sucker', () => {
  const pr = [[0.001, 0.14], [0.34, 0.42], [0.46, 0.5], [0.5, 0.3], [0.48, 0]];
  const lg = new THREE.LatheGeometry(pr.map(([a, b]) => new THREE.Vector2(a, b)), 7);
  lg.computeVertexNormals();
  return lg;
});
/** Sandy seabed patch with ripples, pebbles and a shell. */
function seabed(gp: THREE.Group, rx: number, rz: number, sand = '#d9c49a'): void {
  vblob(gp, sand, 0, -0.012, 0, rx, 0.03, rz, (x, _y, z) => {
    const w = Math.sin(x * 38 + z * 12 + vnoise(x * 6, 0, z * 6) * 5);
    return mx(mx(sand, '#b9a274', sst(0.3, 1, w) * 0.55), '#ead8b0', sst(-0.4, -1, w) * 0.5);
  }, [0, 0, 0], 36);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.1 + 0.4, rr = 0.6 + hash3(i, 3, 1) * 0.3;
    vblob(gp, ['#8a8478', '#a39b8c', '#6f6a62'][i % 3], Math.cos(a) * rx * rr, 0.012, Math.sin(a) * rz * rr, 0.018 + hash3(i, 1, 1) * 0.014, 0.012, 0.016, undefined, [0, a, 0], 10);
  }
}
const OCTOPUS: Builder = (gp, r) => {
  const c = r.color!, dk = sh(c, 0.62), pale = mx(c, '#f6d6c6', 0.6), suck = '#f3d2c0';
  seabed(gp, 0.5, 0.46);
  const skin: Paint = (x, y, z) => {
    const [f1, f2] = worley(x * 22, y * 22, z * 22), n = vnoise(x * 9 + 2, y * 9, z * 9);
    let col = mx(c, f2 - f1 < 0.1 ? dk : sh(c, 1.08), f2 - f1 < 0.1 ? 0.45 : 0.3);
    col = mx(col, '#7a2a1e', sst(0.55, 0.8, n) * 0.4);
    return f1 < 0.12 ? mx(col, '#f2b8a0', 0.45) : col;
  };
  // Mantle: bulbous, wrinkled sac leaning back over a short head with the eyes
  spine(gp, [
    { p: [0, 0.15, 0.03], w: 0.115, h: 0.115 }, { p: [0, 0.24, 0.04], w: 0.12, h: 0.11 }, { p: [0, 0.32, 0.0], w: 0.11, h: 0.1 },
    { p: [0, 0.39, -0.07], w: 0.16, h: 0.15 }, { p: [0, 0.45, -0.16], w: 0.175, h: 0.16 }, { p: [0, 0.49, -0.25], w: 0.14, h: 0.125 },
    { p: [0, 0.505, -0.31], w: 0.05, h: 0.045 },
  ], c, skin, {
    nu: 50, nv: 36, side: [1, 0, 0],
    shape: (u, a) => 1 + (vnoise(Math.cos(a) * 5 + 1, Math.sin(a) * 5, u * 12) - 0.5) * 0.16 * sst(0.3, 0.6, u)
      + Math.max(0, Math.cos(a * 2)) * 0.06 * sst(0.1, 0.25, u) * (1 - sst(0.3, 0.42, u)),
  });
  // Eyes on raised turrets: golden ball with a horizontal slit pupil, papilla "horn" above
  for (const sx of [-1, 1]) {
    const e: V3 = [sx * 0.105, 0.3, 0.07];
    vblob(gp, c, e[0] * 0.92, e[1] + 0.005, e[2] - 0.005, 0.05, 0.048, 0.05, skin, [0, 0, 0], 18);
    const eg = grp(gp, e, [0, sx * 0.9, 0]);
    vblob(eg, '#e7cf7a', 0, 0, 0.022, 0.03, 0.03, 0.022, (_x, y) => mx('#e7cf7a', '#b98a3a', sst(0.01, -0.025, y)), [0, 0, 0], 16);
    pblob(eg, '#0e0b0a', 0, 0, 0.043, 0.02, 0.0065, 0.004, undefined, [0, 0, 0], 12);
    ellip(eg, '#ffffff', 0.008, 0.012, 0.042, 0.004, 0.003, 0.002);
    drop(gp, sh(c, 1.05), [e[0] * 0.98, e[1] + 0.035, e[2] - 0.01], [e[0] * 1.02, e[1] + 0.06, e[2] - 0.02], 0.009);
  }
  // Siphon tube on the right side
  tube(gp, [[0.11, 0.22, -0.02], [0.15, 0.2, 0.0], [0.17, 0.2, 0.02]], 0.022, 0.016, sh(c, 0.92));
  // Eight arms: spread over the sand from a webbed base, tips curling up (suckers on the outside of the spiral)
  const curls = [1.5, 0.7, 1.9, 1.1, 1.6, 0.6, 1.8, 1.0];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.39 + (hash3(i, 2, 7) - 0.5) * 0.25;
    const ra: V3 = [Math.cos(a), 0, Math.sin(a)], ta: V3 = [-Math.sin(a), 0, Math.cos(a)];
    const sway = (hash3(i, 9, 1) - 0.5) * 0.16, reach = 0.29 + hash3(i, 4, 4) * 0.07, R0 = 0.06 + hash3(i, 6, 3) * 0.035;
    const Phi = Math.PI * curls[i], q: [number, number][] = [[0.06, 0.2], [0.12, 0.11], [0.19, 0.045]];
    for (let k = 0; k <= 2; k++) q.push([0.19 + (reach - 0.19) * (k + 1) / 3, 0.038 - k * 0.002]);
    const yc = 0.034 + R0;
    for (let k = 1; k <= 9; k++) { const ph = (k / 9) * Phi, rho = R0 * (1 - 0.6 * k / 9); q.push([reach + rho * Math.sin(ph), yc - rho * Math.cos(ph)]); }
    const n = q.length, cx = 0, cz = 0.03;
    const pts: V3[] = q.map(([rr, y], k) => { const sw = sway * Math.sin((k / (n - 1)) * Math.PI) * rr * 2; return [cx + ra[0] * rr + ta[0] * sw, y, cz + ra[2] * rr + ta[2] * sw]; });
    const W = (u: number) => 0.041 * Math.pow(1 - u, 1.15) + 0.003;
    const st = pts.map((p, k) => { const w = W(k / (n - 1)); return { p, w, h: w * 0.82 }; });
    spine(gp, st, c, skin, {
      nu: 52, nv: 12, side: ta,
      uvp: (_u, ang, x, y, z) => { const s2 = Math.sin(ang); return s2 > 0.25 ? mx(pale, '#ffffff', 0.1) : s2 > -0.1 ? mx(skin(x, y, z, 0, 0, 0) ?? c, pale, 0.5) : null; },
    });
    // Two staggered rows of suckers along the underside, shrinking to the tip
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'centripetal');
    const side = new THREE.Vector3(...ta), P = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), S = new THREE.Vector3();
    for (let k = 0; k < 20; k++) {
      const u = 0.18 + (k / 20) * 0.78, w = W(u);
      curve.getPoint(u, P); curve.getTangent(u, T);
      N.crossVectors(T, side).normalize(); S.crossVectors(N, T).normalize();
      const ang = Math.PI / 2 + (k % 2 ? 0.5 : -0.5), ca = Math.cos(ang), sa = Math.sin(ang);
      const nn: V3 = nrm([S.x * ca + N.x * sa, S.y * ca + N.y * sa, S.z * ca + N.z * sa]);
      const at: V3 = [P.x + S.x * ca * w + N.x * sa * w * 0.82, P.y + S.y * ca * w + N.y * sa * w * 0.82, P.z + S.z * ca * w + N.z * sa * w * 0.82];
      if (at[1] < 0.012) continue;
      const d = w * 1.05;
      orient(gp, SUCKER(), suck, [at[0] - nn[0] * d * 0.05, at[1] - nn[1] * d * 0.05, at[2] - nn[2] * d * 0.05], nn, [d, d * 0.6, d]);
    }
  }
};

const CROC: Builder = (gp, r) => {
  // Nile crocodile basking on a wet mud bank (armoured osteoderm rows, double tail crest, long toothy snout, raised eyes)
  // or, with `short`, a Komodo dragon on dry sand (heavy beaded body, long neck, upright sprawl, forked yellow tongue)
  const c = r.color!, kom = Boolean(r.short);
  const st: SpSt[] = kom ? [
    { p: [-0.22, 0.022, -0.5], w: 0.007, h: 0.008 }, { p: [-0.19, 0.03, -0.41], w: 0.02, h: 0.022 }, { p: [-0.11, 0.045, -0.3], w: 0.038, h: 0.04 },
    { p: [-0.03, 0.078, -0.17], w: 0.072, h: 0.068 }, { p: [0, 0.1, -0.05], w: 0.104, h: 0.082 }, { p: [0, 0.108, 0.06], w: 0.118, h: 0.088 },
    { p: [0, 0.116, 0.16], w: 0.096, h: 0.08 }, { p: [0.008, 0.13, 0.24], w: 0.064, h: 0.062 }, { p: [0.02, 0.142, 0.3], w: 0.058, h: 0.056 },
    { p: [0.034, 0.148, 0.35], w: 0.057, h: 0.05 }, { p: [0.048, 0.142, 0.405], w: 0.046, h: 0.038 }, { p: [0.058, 0.13, 0.45], w: 0.034, h: 0.028 },
    { p: [0.062, 0.125, 0.468], w: 0.011, h: 0.011 },
  ] : [
    { p: [0.2, 0.03, -0.56], w: 0.005, h: 0.01 }, { p: [0.17, 0.034, -0.47], w: 0.016, h: 0.028 }, { p: [0.1, 0.042, -0.35], w: 0.03, h: 0.04 },
    { p: [0.03, 0.052, -0.21], w: 0.056, h: 0.05 }, { p: [0, 0.06, -0.08], w: 0.098, h: 0.056 }, { p: [0, 0.063, 0.04], w: 0.12, h: 0.06 },
    { p: [0, 0.062, 0.14], w: 0.1, h: 0.056 }, { p: [0, 0.06, 0.21], w: 0.066, h: 0.044 }, { p: [0, 0.06, 0.26], w: 0.068, h: 0.04 },
    { p: [0, 0.054, 0.32], w: 0.056, h: 0.03 }, { p: [0, 0.046, 0.38], w: 0.04, h: 0.021 }, { p: [0, 0.041, 0.44], w: 0.031, h: 0.017 },
    { p: [0, 0.039, 0.48], w: 0.036, h: 0.018 }, { p: [0, 0.037, 0.503], w: 0.012, h: 0.01 },
  ];
  const n = st.length, pts = st.map(s => s.p), fr = framer(pts, [1, 0, 0]);
  const WH = (u: number): [number, number] => {
    const f = u * (n - 1), k = Math.min(n - 2, Math.floor(f)), t = f - k, s = t * t * (3 - 2 * t);
    return [st[k].w + (st[k + 1].w - st[k].w) * s, st[k].h + (st[k + 1].h - st[k].h) * s];
  };
  // Arc length table (tail tip → snout) so scales keep a constant size along the loft
  const NU = 128, sT: number[] = [0];
  for (let i = 1; i <= NU; i++) sT.push(sT[i - 1] + fr(i / NU).P.distanceTo(fr((i - 1) / NU).P));
  const sAt = (u: number) => sT[Math.round(u * NU)];
  const uAtS = (s: number) => { let i = 0; while (i < NU && sT[i] < s) i++; return i / NU; };
  const uSt = (k: number) => k / (n - 1);
  const sHip = sAt(uSt(4)), sSh = sAt(uSt(6)), sHead = sAt(uSt(8)), sEnd = sT[NU];
  const ang = (a: number) => { let d = a - Math.PI / 2; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
  /** Scale cell (crocodile): returns 0 in the middle of a scute → 1 in the crevice, plus the scute id. */
  const cell = (u: number, a: number): [number, number, number] => {
    const s = sAt(u), d = ang(a);
    if (s > sHead - 0.01) return [0, 0, 0];
    const back = Math.abs(d) < 0.95 ? 1 : 0, rw = back ? 0.27 : 0.42, cl = s < sHip ? 0.034 : back ? 0.036 : 0.022;
    const fa = d / rw + (back ? 0.5 : 0), ra = Math.round(fa), fc = s / cl + (back ? 0 : (ra % 2) * 0.5), rc = Math.round(fc);
    const e = Math.max(Math.abs(fa - ra) * 2, Math.abs(fc - rc) * 2);
    return [e, ra * 31 + rc, back];
  };
  const mud = '#6a5640', ground = kom ? '#cdb184' : mud;
  if (kom) {
    vblob(gp, ground, 0, -0.03, 0.0, 0.5, 0.032, 0.56, (x, _y, z) => mx(mx(ground, '#a88b62', sst(0.45, 0.8, vnoise(x * 8, 1, z * 8)) * 0.6), '#e2cda0', sst(0.6, 0.85, vnoise(x * 30, 2, z * 30)) * 0.4), [0, 0, 0], 36);
    for (let i = 0; i < 6; i++) {
      const a = i * 1.9 + 0.3, rr = 0.33 + hash3(i, 5, 2) * 0.12;
      vblob(gp, ['#9a8a74', '#b2a28a', '#857664'][i % 3], Math.cos(a) * rr, 0.008, Math.sin(a) * rr * 1.05, 0.014 + hash3(i, 2, 2) * 0.012, 0.01, 0.012, undefined, [0, a, 0], 10);
    }
    tube(gp, [[0.3, 0.01, -0.32], [0.18, 0.016, -0.26], [0.05, 0.012, -0.3]], 0.008, 0.005, '#6d5338');
    tube(gp, [[0.18, 0.016, -0.26], [0.2, 0.05, -0.2], [0.22, 0.075, -0.16]], 0.005, 0.003, '#6d5338');
    for (let i = 0; i < 14; i++) {
      const x = -0.32 + hash3(i, 1, 9) * 0.1 + (i > 6 ? 0.55 : 0), z = 0.2 + hash3(i, 3, 9) * 0.25 - (i > 6 ? 0.55 : 0), a = hash3(i, 4, 9) * 6;
      blade(gp, mx('#b49a62', '#8a7448', hash3(i, 5, 9)), [x, 0.005, z], [x + Math.cos(a) * 0.03, 0.06 + hash3(i, 6, 9) * 0.04, z + Math.sin(a) * 0.03], 0.006, 0.002, [Math.sin(a), 0, -Math.cos(a)]);
    }
  } else {
    water(grp(gp, [0, -0.03, 0]), 0.56, 0.58, [[-0.3, 0.42, 0.05]], '#4f6f5c');
    vblob(gp, mud, 0.04, -0.045, -0.05, 0.46, 0.05, 0.52, (x, _y, z) => {
      const e = Math.hypot((x - 0.04) / 0.46, (z + 0.05) / 0.52);
      return mx(mx(mud, '#8a7458', sst(0.4, 0.75, vnoise(x * 10, 0, z * 10)) * 0.5), '#3e3226', sst(0.7, 0.95, e) * 0.7);
    }, [0, 0, 0], 36);
  }
  // Body, neck, head & tail as one loft
  const top = kom ? mx(c, '#5e5442', 0.4) : mx(c, '#45463a', 0.6), flank = kom ? mx(c, '#8a7c62', 0.35) : mx(c, '#9c9a78', 0.45);
  const belly = kom ? mx(c, '#b4a68a', 0.6) : '#d8d1a2', crev = kom ? '#3a342a' : '#23251a';
  const komP = (x: number, y: number, z: number, s2: number, head: number): string => {
    const [f1, f2] = worley(x * 64, y * 64, z * 64), m = vnoise(x * 11, y * 11, z * 11);
    let col = s2 < -0.2 ? mx(flank, belly, sst(-0.2, -0.7, s2)) : mx(top, flank, sst(0.6, -0.1, s2));
    col = mx(col, '#a8946e', sst(0.5, 0.8, m) * 0.5 * Math.max(0, s2));
    col = mx(col, '#6f7d86', head * 0.35);
    return mx(mx(col, crev, sst(0.12, 0.02, f2 - f1) * 0.55), sh(col, 1.18), sst(0.25, 0.05, f1) * 0.5);
  };
  spine(gp, st, c, undefined, {
    nu: NU, nv: 44,
    shape: (u, a) => {
      const s2 = Math.sin(a), s = sAt(u), d = ang(a);
      let m = s2 < 0 ? 1 - (kom ? 0.18 : 0.34) * sst(0, 1, -s2) * (s < sHead ? 1 : 0.5) : 1;
      if (kom) {
        if (s > sSh && s < sHead + 0.06) m += 0.12 * sst(-0.3, -0.9, s2) * Math.sin(Math.PI * (s - sSh) / (sHead + 0.06 - sSh));
        return m + (vnoise(Math.cos(a) * 9, Math.sin(a) * 9, s * 40) - 0.5) * 0.04;
      }
      if (s > sHead - 0.01) {
        if (Math.abs(s2 + 0.12) < 0.08 && s < sEnd - 0.03) m -= 0.05;
        return m + (vnoise(Math.cos(a) * 14, Math.sin(a) * 14, s * 70) - 0.5) * 0.05 * sst(0.0, 0.6, s2);
      }
      const [e, , back] = cell(u, a), bump = Math.max(0, 1 - e * e);
      const nuchal = s > sSh + 0.02 && s < sHead - 0.02 && Math.abs(d) < 0.6 ? 0.14 : 0;
      return m + bump * (back ? 0.07 + nuchal : 0.025) + (back ? 0.04 * bump * bump * bump : 0);
    },
    uvp: (u, a, x, y, z) => {
      const s2 = Math.sin(a), s = sAt(u);
      const head = sst(sHead - 0.04, sHead + 0.02, s);
      if (kom) return komP(x, y, z, s2, head);
      const m = vnoise(x * 12 + 3, y * 12, z * 12);
      let col = s2 < -0.25 ? mx(flank, belly, sst(-0.25, -0.75, s2)) : mx(top, flank, sst(0.5, -0.15, s2));
      col = mx(col, '#1f2318', sst(0.55, 0.8, m) * 0.55 * sst(-0.4, 0.2, s2));
      if (s < sHip) col = mx(col, '#262a1c', sst(0.3, 0.7, Math.sin((s / 0.085) * Math.PI * 2)) * 0.5 * sst(-0.5, 0.0, s2));
      if (head > 0.5) {
        const [f1, f2] = worley(x * 80, y * 80, z * 80);
        col = mx(mx(col, crev, sst(0.1, 0.02, f2 - f1) * 0.5), s2 < -0.12 ? '#c9c095' : col, sst(-0.12, -0.3, s2) * 0.7);
        if (Math.abs(s2 + 0.12) < 0.06 && s < sEnd - 0.02) col = '#2b231b';
        return col;
      }
      const [e, id] = cell(u, a);
      col = mx(col, sh(col, 0.82 + hash3(id, 1, 7) * 0.3), 0.6);
      return mx(col, crev, sst(0.55, 0.95, e) * (s2 < -0.25 ? 0.35 : 0.8));
    },
  });
  // Eyes, nostrils, teeth / tongue
  const uE = uAtS(sHead + (kom ? 0.045 : 0.05)), FE = fr(uE), [we, he] = WH(uE);
  for (const sx of [-1, 1]) {
    if (kom) {
      const at = FE.at(sx * we * 0.84, he * 0.42);
      vblob(gp, top, at[0] - sx * 0.003, at[1] + 0.004, at[2], 0.014, 0.012, 0.016, undefined, [0, 0, 0], 12);
      aEye(gp, at[0] + sx * 0.006, at[1], at[2], 0.0085, sx * 1.3 + 0.18, '#5a3a1e', mx(top, '#c8b48e', 0.3));
    } else {
      const at = FE.at(sx * we * 0.42, he * 0.95);
      vblob(gp, top, at[0], at[1] - 0.004, at[2], 0.018, 0.016, 0.022, (x, y, z) => mx(top, crev, sst(0.2, 0.05, worley(x * 90, y * 90, z * 90)[0]) * 0.3), [0, 0, 0], 14);
      const eg = grp(gp, [at[0] + sx * 0.008, at[1] + 0.006, at[2] + 0.002], [0, sx * 1.05, 0]);
      eg.rotateX(-0.45);
      aEye(eg, 0, 0, 0, 0.0095, 0, '#b59a3c', undefined, true);
    }
  }
  const uT = uAtS(sEnd - (kom ? 0.012 : 0.02)), FT = fr(uT), [wt, ht] = WH(uT);
  if (kom) {
    for (const sx of [-1, 1]) bead(gp, ...FT.at(sx * wt * 0.55, ht * 0.35, -0.004), 0.004, '#1a1612');
    // Long forked tongue flicking down-forward
    const t0 = FT.at(0, -ht * 0.35, -0.004), t1: V3 = [t0[0] + 0.004, t0[1] - 0.01, t0[2] + 0.03], t2: V3 = [t1[0] + 0.002, t1[1] - 0.02, t1[2] + 0.02];
    tube(gp, [t0, t1, t2], 0.0065, 0.005, '#e9cf7a');
    for (const sx of [-1, 1]) tube(gp, [t2, [t2[0] + sx * 0.008, t2[1] - 0.012, t2[2] + 0.012], [t2[0] + sx * 0.013, t2[1] - 0.024, t2[2] + 0.014]], 0.0042, 0.0014, '#e9cf7a');
    // Lip scales and a pale chin
    for (const sx of [-1, 1]) for (let i = 0; i < 9; i++) {
      const u = uAtS(sEnd - 0.012 - i * 0.012), F = fr(u), [w, h] = WH(u);
      vblob(gp, mx(top, '#c0b090', 0.5), ...F.at(sx * w * 0.93, -h * 0.28), 0.006, 0.004, 0.007, undefined, [0, 0, 0], 8);
    }
  } else {
    vblob(gp, top, ...FT.at(0, ht * 0.75, -0.004), 0.022, 0.012, 0.018, (x, y, z) => mx(top, crev, sst(0.2, 0.05, worley(x * 90, y * 90, z * 90)[0]) * 0.3), [0, 0, 0], 14);
    for (const sx of [-1, 1]) bead(gp, ...FT.at(sx * 0.008, ht * 1.32, -0.002), 0.0045, '#100d0a');
    // Interlocking teeth along the wavy mouth line; the big 4th lower tooth sits in a notch
    for (const sx of [-1, 1]) for (let i = 0; i < 15; i++) {
      const s = sEnd - 0.02 - i * 0.0125, u = uAtS(s), F = fr(u), [w, h] = WH(u);
      const up = i % 2 === 0, big = i === 2 || i === 8, L = (big ? 0.022 : 0.012 + hash3(i, sx, 4) * 0.006) * (i > 11 ? 0.7 : 1);
      const b = F.at(sx * w * 0.96, -h * 0.12 + (up ? -0.003 : 0.003));
      drop(gp, '#efe6c8', b, [b[0] + sx * 0.002, b[1] + (up ? L : -L), b[2] + 0.002], big ? 0.0034 : 0.0026);
    }
  }
  // Tail crest: double row of upright scutes merging into a single row
  if (!kom) for (let i = 0; i < 26; i++) {
    const s = sHip - 0.03 - i * 0.026; if (s < 0.03) break;
    const u = uAtS(s), F = fr(u), [w, h] = WH(u), dbl = i < 15, k = 0.6 + 0.4 * Math.min(1, s / 0.5);
    for (const sx of dbl ? [-1, 1] : [0]) {
      const b = F.at(sx * w * 0.42, h * 0.86), hh = 0.026 * k + (dbl ? 0 : 0.004);
      blade(gp, top, [b[0], b[1] - 0.004, b[2] + 0.006], [b[0] + F.N.x * hh, b[1] + F.N.y * hh, b[2] - 0.006], 0.026 * k, 0.008, [F.S.x, F.S.y, F.S.z]);
    }
  }
  // Sprawling legs with splayed clawed toes (rear feet longer, webbed on the crocodile)
  const legP: Paint = (x, y, z) => {
    if (kom) return komP(x, y, z, Math.max(-1, Math.min(1, (y - 0.04) * 12)), 0);
    const [f1, f2] = worley(x * 70, y * 70, z * 70);
    return mx(mx(top, flank, sst(0.07, 0.01, y) * 0.8), crev, sst(0.1, 0.02, f2 - f1) * 0.6);
  };
  // [arc position, size, foot heading, elbow/knee z offset, out-reach]
  const legs: [number, number, number, number, number][] = kom ? [[sSh - 0.02, 1, 0.35, -0.012, 0.055], [sHip + 0.02, 1.12, 0.75, 0.01, 0.06]] : [[sSh - 0.03, 1, 0.6, -0.012, 0.05], [sHip + 0.02, 1.15, 2.4, 0.004, 0.06]];
  for (const [s, k, fd, zo, out] of legs) for (const sx of [-1, 1]) {
    const u = uAtS(s), F = fr(u), [w, h] = WH(u), sh0 = F.at(sx * w * 0.62, -h * 0.15), th0 = sx * fd;
    const el: V3 = [F.P.x + sx * (w + out * 0.6), sh0[1] + (kom ? -0.004 : 0.004), sh0[2] + zo];
    const wr: V3 = [F.P.x + sx * (w + out * (kom ? 0.75 : 0.95)), 0.018, el[2] - zo * 0.4 + Math.cos(th0) * 0.004];
    const fc: V3 = [wr[0] + Math.sin(th0) * 0.014, 0.008, wr[2] + Math.cos(th0) * 0.014];
    const tk = kom ? 1.4 : 1.15;
    spine(gp, [{ p: sh0, w: 0.036 * k * tk, h: 0.034 * k * tk }, { p: el, w: 0.024 * k * tk, h: 0.024 * k * tk }, { p: wr, w: 0.017 * k * tk, h: 0.017 * k * tk }, { p: fc, w: 0.019 * k * tk, h: 0.008 * k * tk }], top, legP, { nu: 24, nv: 14, side: [0, 0, 1] });
    const nt = kom || fd < 1 ? 5 : 4;
    for (let t = 0; t < nt; t++) {
      const th = th0 + (t / (nt - 1) - 0.5) * (kom ? 1.4 : 1.6), L = (fd > 1 ? 0.05 : 0.036) * k * (t === 0 || t === nt - 1 ? 0.75 : 1);
      const tip: V3 = [fc[0] + Math.sin(th) * L, 0.006, fc[2] + Math.cos(th) * L];
      drop(gp, mx(top, flank, 0.3), [fc[0], 0.009, fc[2]], tip, 0.0062 * k * (kom ? 1.25 : 1), 0.0042 * k * (kom ? 1.25 : 1));
      const cl = kom ? 0.02 : 0.01;
      drop(gp, kom ? '#2a2724' : '#3a3428', [tip[0] - Math.sin(th) * 0.003, 0.007, tip[2] - Math.cos(th) * 0.003], [tip[0] + Math.sin(th) * cl, 0.001, tip[2] + Math.cos(th) * cl], kom ? 0.0032 : 0.0024, kom ? 0.0024 : 0.0018);
    }
    if (!kom && fd > 1) vblob(gp, mx(top, flank, 0.5), fc[0] + Math.sin(th0) * 0.026 * k, 0.005, fc[2] + Math.cos(th0) * 0.026 * k, 0.026 * k, 0.003, 0.02 * k, undefined, [0, th0, 0], 12);
  }
};

export const ANIMAL_BUILDERS: Record<string, Builder> = {
  quad: quadBuilder, ape: APE, bear: BEAR, hopper: HOPPER, penguin: PENGUIN, wader: WADER, flyer: FLYER,
  roundbird: ROUNDBIRD, whale: WHALE, shark: SHARK, turtle: TURTLE, octopus: OCTOPUS, croc: CROC,
};
