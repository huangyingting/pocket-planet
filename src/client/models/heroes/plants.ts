import { passerby } from '../human.ts';
import * as THREE from 'three';
import { type Builder, type Paint, type V3, g, add, mat, box, cyl, rod, slab, rbox, ball, ellip, gable, paintFaces, shade, mix, fbm, hash3, worley } from '../prims.ts';
import { type HFn, island, ripple, strataSide, EARTH, sstep } from '../nature.ts';

// Hero builders for the plants & forests collection (keys pl_*). Each is a small terrain diorama (radius ~0.5,
// base at y=0, front +z) with the signature plant dominating and tiny people/animals for scale.

const Y0 = 0.035;
const TAU = Math.PI * 2;

// ---- merged batches: hundreds of leaf clumps, culms, tulips or pebbles in one vertex-coloured mesh ----------
interface Tpl { pos: ArrayLike<number>; nor: ArrayLike<number> }
const TPLS = new Map<string, Tpl>();
function tpl(key: string, make: () => THREE.BufferGeometry): Tpl {
  let t = TPLS.get(key);
  if (!t) {
    let geo = make();
    if (geo.index) geo = geo.toNonIndexed();
    geo.computeVertexNormals();
    t = { pos: geo.getAttribute('position').array, nor: geo.getAttribute('normal').array };
    TPLS.set(key, t);
  }
  return t;
}
const ICO1 = () => tpl('pl:ico1', () => new THREE.IcosahedronGeometry(1, 1));
const ICO0 = () => tpl('pl:ico0', () => new THREE.IcosahedronGeometry(1, 0));
const CYL6 = () => tpl('pl:cyl6', () => new THREE.CylinderGeometry(1, 1, 1, 6, 1, true).translate(0, 0.5, 0));
const CONE6 = () => tpl('pl:cone6', () => new THREE.ConeGeometry(1, 1, 6, 1, true).translate(0, 0.5, 0));
const LEAF = () => tpl('pl:leaf', () => new THREE.SphereGeometry(1, 6, 3));
const OCT = () => tpl('pl:oct', () => new THREE.OctahedronGeometry(1, 0));

const COLS = new Map<string, THREE.Color>();
const col = (hex: string) => { let c = COLS.get(hex); if (!c) { c = new THREE.Color(hex); COLS.set(hex, c); } return c; };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const _n3 = new THREE.Matrix3(), _v = new THREE.Vector3(), _d = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);

class Batch {
  pos: number[] = []; nor: number[] = []; col: number[] = [];
  constructor(readonly t: Tpl, readonly vary = 0.12) {}
  put(m: THREE.Matrix4, c: string, seed = 0): void {
    _n3.getNormalMatrix(m);
    const { pos, nor } = this.t, bc = col(c), flip = m.determinant() < 0;
    for (let i = 0; i < pos.length; i += 9) {
      const f = 1 + (hash3(i * 0.37, seed, 7.1) - 0.5) * this.vary;
      for (let k = 0; k < 3; k++) {
        const j = i + (flip ? 2 - k : k) * 3;
        _v.set(pos[j], pos[j + 1], pos[j + 2]).applyMatrix4(m);
        this.pos.push(_v.x, _v.y, _v.z);
        _v.set(nor[j], nor[j + 1], nor[j + 2]).applyMatrix3(_n3).normalize();
        this.nor.push(_v.x, _v.y, _v.z);
        this.col.push(bc.r * f, bc.g * f, bc.b * f);
      }
    }
  }
  blob(x: number, y: number, z: number, sx: number, sy: number, sz: number, c: string, ry = 0, rx = 0, rz = 0, seed = 0): void {
    _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s.set(sx, sy, sz));
    this.put(_m, c, seed || x * 31 + z * 17);
  }
  /** Template (unit radius, 0..1 along y) stretched from a to b. */
  seg(a: V3, b: V3, r: number, c: string, rz = r): void {
    _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const len = _d.length() || 1e-4;
    _q.setFromUnitVectors(UP, _d.normalize());
    _m.compose(_p.set(a[0], a[1], a[2]), _q, _s.set(r, len, rz));
    this.put(_m, c, a[0] * 13 + a[2] * 7);
  }
  flush(gp: THREE.Object3D, flat = true, rough = 0.8): THREE.Mesh | null {
    if (!this.pos.length) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    return add(gp, geo, mat('#ffffff', { vc: true, flat, rough }), 0, 0, 0, 1, 1, 1);
  }
}

// ---- organic tube with per-angle radius modulation (fluted trunks, ribbed cacti, buttress flares) ----------
interface RTOpts { radial?: number; sub?: number; fr?: (a: number, t: number) => number; paint?: Paint; cap?: number; flat?: boolean; rough?: number }
function rtube(p: THREE.Object3D, pts: V3[], radii: number[], c: string, o: RTOpts = {}): THREE.Mesh {
  const radial = o.radial ?? 16, sub = o.sub ?? 4;
  const curve = new THREE.CatmullRomCurve3(pts.map(v => new THREE.Vector3(...v)), false, 'centripetal');
  const n = Math.max(2, (pts.length - 1) * sub);
  const rAt = (t: number) => { const f = t * (radii.length - 1), i = Math.min(radii.length - 2, Math.floor(f)), u = f - i; return radii[i] + (radii[i + 1] - radii[i]) * u; };
  const P = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(1, 0, 0), B = new THREE.Vector3();
  const vs: number[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    curve.getPointAt(t, P); curve.getTangentAt(t, T);
    if (i === 0 && Math.abs(N.dot(T)) > 0.9) N.set(0, 0, 1);
    N.addScaledVector(T, -N.dot(T)).normalize();
    B.crossVectors(N, T).normalize();
    const r = rAt(t);
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * TAU, rr = r * (o.fr ? o.fr(a, t) : 1);
      vs.push(P.x + (N.x * Math.cos(a) + B.x * Math.sin(a)) * rr, P.y + (N.y * Math.cos(a) + B.y * Math.sin(a)) * rr, P.z + (N.z * Math.cos(a) + B.z * Math.sin(a)) * rr);
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < radial; j++) {
    const a = i * radial + j, b = i * radial + ((j + 1) % radial), c2 = a + radial, d = b + radial;
    idx.push(a, c2, b, b, c2, d);
  }
  if (o.cap !== undefined) {
    const tip = vs.length / 3;
    curve.getPointAt(1, P); curve.getTangentAt(1, T);
    vs.push(P.x + T.x * o.cap, P.y + T.y * o.cap, P.z + T.z * o.cap);
    for (let j = 0; j < radial; j++) idx.push(n * radial + j, tip, n * radial + ((j + 1) % radial));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vs, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return add(p, paintFaces(geo, c, o.paint), mat('#ffffff', { vc: true, flat: o.flat ?? false, rough: o.rough ?? 0.8 }), 0, 0, 0, 1, 1, 1);
}

/** Painted lathe (own geometry, so paint sees model coordinates); optional open wedge and vertex displacement. */
function plathe(p: THREE.Object3D, pts: [number, number][], c: string, paint: Paint | undefined, x: number, y: number, z: number, seg = 24, o: { gap?: number; rot?: number; disp?: (v: THREE.Vector3) => void; flat?: boolean; rough?: number } = {}): THREE.Mesh {
  const gap = o.gap ?? 0;
  const geo = new THREE.LatheGeometry(pts.map(([r, py]) => new THREE.Vector2(r, py)), seg, (o.rot ?? 0) + gap / 2, TAU - gap);
  const pa = geo.getAttribute('position') as THREE.BufferAttribute, v = new THREE.Vector3();
  for (let i = 0; i < pa.count; i++) {
    v.fromBufferAttribute(pa, i).add(_p.set(x, y, z));
    o.disp?.(v);
    pa.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return add(p, paintFaces(geo, c, paint), mat('#ffffff', { vc: true, flat: o.flat ?? false, rough: o.rough ?? 0.75 }), 0, 0, 0, 1, 1, 1);
}

const speck = (x: number, z: number, k: number, s = 0) => hash3(Math.floor(x * k), s, Math.floor(z * k));
/** Calm water: soft tonal patches and rare glints (ripple() is too busy for still pools). */
const calm = (c: string): Paint => (x, _y, z) => {
  if (speck(x, z, 90, 5) > 0.985) return mix(c, '#cfe6ee', 0.3);
  const n = fbm(x * 9, 7, z * 9, 2);
  return n > 0.62 ? shade(c, 1.12) : n < 0.38 ? shade(c, 0.9) : c;
};

/** Tiny visitor for scale (height ≈ 0.022·s), facing +z rotated by ry. */
function person(p: THREE.Object3D, x: number, y: number, z: number, shirt: string, s = 1, ry = 0, o: { hat?: string; pants?: string; skin?: string } = {}): void {
  passerby(p, x, y, z, 0.023 * s, 1, { top: shirt, ry, bottom: o.pants, skin: o.skin, hat: o.hat, hatStyle: 'brim' });
}

/** Leafy clump cluster around (cx,cy,cz): n flattened low-poly blobs with colour jitter. */
function clumps(b: Batch, cx: number, cy: number, cz: number, n: number, R: number, s: number, cs: string[], seed: number, flatY = 0.62): void {
  for (let i = 0; i < n; i++) {
    const a = hash3(seed, i, 1) * TAU, d = Math.sqrt(hash3(seed, i, 2)) * R, k = 0.7 + hash3(seed, i, 3) * 0.5;
    b.blob(cx + Math.cos(a) * d, cy + (hash3(seed, i, 4) - 0.35) * R * 0.5, cz + Math.sin(a) * d, s * k, s * k * flatY, s * k, cs[i % cs.length], a, 0, 0, seed * 11 + i);
  }
}

/** Fern / palm frond: leaflets along an arching rachis from p0 in direction (ang, elev). */
function frond(b: Batch, p0: V3, ang: number, elev: number, L: number, w: number, c: string, n = 9, droop = 1): void {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  let prev: V3 = p0;
  for (let i = 1; i <= n; i++) {
    const t = i / n, e = elev - droop * t * t * 1.3;
    const pt: V3 = [p0[0] + ca * L * t * Math.cos(elev * 0.5), p0[1] + Math.sin(e) * L * t * 0.8, p0[2] + sa * L * t * Math.cos(elev * 0.5)];
    b.seg(prev, pt, w * 0.08, shade(c, 0.8));
    const lw = w * (1 - t * 0.7);
    for (const sd of [-1, 1]) b.blob(pt[0] - sa * sd * lw * 0.7, pt[1] - lw * 0.15, pt[2] + ca * sd * lw * 0.7, lw * 0.75, lw * 0.08, lw * 0.25, c, -ang + sd * 0.5 + Math.PI / 2, 0, sd * 0.3);
    prev = pt;
  }
}

/** Low-poly goat / small hoofed animal for scale. */
function goat(p: THREE.Object3D, x: number, y: number, z: number, ry: number, c: string, s = 1): void {
  const b = new Batch(ICO1(), 0.08), q = new THREE.Group();
  q.position.set(x, y, z); q.rotation.y = ry; q.scale.setScalar(s); p.add(q);
  b.blob(0, 0.024, 0, 0.0085, 0.008, 0.015, c);
  b.blob(0, 0.031, 0.015, 0.004, 0.006, 0.004, c, 0, -0.6);
  b.blob(0, 0.035, 0.021, 0.0035, 0.0035, 0.0065, shade(c, 0.9), 0, 0.5);
  for (const sx of [-1, 1]) for (const fz of [-0.009, 0.009]) b.seg([sx * 0.0045, 0.02, fz], [sx * 0.0045, 0, fz], 0.0016, shade(c, 0.8));
  for (const sx of [-1, 1]) b.seg([sx * 0.002, 0.038, 0.019], [sx * 0.004, 0.045, 0.012], 0.0009, '#3b3027');
  b.blob(0, 0.03, -0.015, 0.0018, 0.004, 0.0018, c, 0, -0.6);
  b.flush(q, false);
}


// =========================================================================================================
// General Sherman — giant sequoia in the Giant Forest: fluted cinnamon trunk, crooked limbs, rounded crown
const sherman: Builder = gp => {
  const TX = 0, TZ = -0.04, H = 0.9;
  const pathX = (z: number) => 0.035 * Math.sin(z * 7 + 0.5);
  const onPath = (x: number, z: number) => (z > 0.1 && Math.abs(x - pathX(z)) < 0.045) || Math.hypot(x - TX, z - 0.12) < 0.075;
  const hf: HFn = (x, z) => {
    const r = Math.hypot(x - TX, z - TZ);
    let y = 0.012 * fbm(x * 7, 0, z * 7) + 0.03 * sstep(0.25, 0.5, Math.hypot(x, z + 0.1)) * fbm(x * 3, 2, z * 3) + 0.012 * Math.max(0, 1 - r / 0.16);
    if (onPath(x, z)) y = Math.min(y, 0.006);
    return y;
  };
  island(gp, 0.5, hf, '#7a5a3c', (x, y, z) => {
    if (onPath(x, z) && y < Y0 + 0.0075) return speck(x, z, 120, 3) > 0.85 ? '#a19d95' : '#8d8a84';
    const h = speck(x, z, 70, 1), n = fbm(x * 8, 4, z * 8);
    if (n > 0.6 && Math.hypot(x, z) > 0.2) return h > 0.5 ? '#5d6b3a' : '#6c7a42';
    return h > 0.86 ? '#9a7550' : h < 0.1 ? '#5e4430' : mix('#7a5a3c', '#8a6a46', n);
  }, { rings: 40, segs: 96, side: strataSide(EARTH) });

  // Trunk: huge flared root swell, deep vertical furrows, a blackened fire scar on the left
  const fur = (a: number, y: number) => Math.cos(a * 22 + Math.sin(y * 26) * 1.6 + Math.sin(a * 3) * 2);
  const tH = (t: number) => Y0 - 0.01 + t * H;
  rtube(gp, [[TX, Y0 - 0.01, TZ], [TX, Y0 + 0.2, TZ], [TX + 0.004, Y0 + 0.5, TZ - 0.003], [TX + 0.01, Y0 + 0.75, TZ - 0.006], [TX + 0.006, Y0 + H, TZ - 0.006]],
    [0.105, 0.068, 0.058, 0.052, 0.047, 0.041, 0.033, 0.022, 0.008], '#9a4f2e', {
      radial: 28, sub: 6, cap: 0.01,
      fr: (a, t) => 1 + 0.045 * fur(a, tH(t)) + 0.28 * Math.max(0, 1 - t / 0.07) ** 2 * (0.5 + 0.5 * Math.cos(5 * a + 1)),
      paint: (x, y, z) => {
        const a = Math.atan2(z - TZ, x - TX), f = fur(a, y), h = hash3(Math.floor(a * 30), Math.floor(y * 90), 2);
        if (y < Y0 + 0.13 && a > 2.0 && a < 2.9 + Math.sin(y * 40) * 0.2) return h > 0.5 ? '#2f2420' : '#3d2c24';
        const c = f > 0.45 ? '#bd6a3e' : f < -0.45 ? '#6e341f' : '#9a4f2e';
        return y > Y0 + 0.55 ? mix(c, '#7a4630', 0.25) : h > 0.92 ? shade(c, 1.12) : c;
      },
    });

  // Crooked limbs and the clumped yellow-green foliage of an old sequoia crown
  const leaves = new Batch(ICO1(), 0.22);
  const LC = ['#55702e', '#667f36', '#46602a', '#7a9040'];
  const limbs: [number, number, number][] = [[0.43, 0.3, 0.13], [0.48, 2.4, 0.15], [0.52, 4.3, 0.12], [0.56, 1.3, 0.14], [0.6, 3.4, 0.12], [0.64, 5.4, 0.11], [0.69, 0.6, 0.1], [0.73, 2.9, 0.1], [0.77, 4.9, 0.08]];
  limbs.forEach(([ly, a, L], i) => {
    const y = Y0 + ly * H, r0 = 0.04, ca = Math.cos(a), sa = Math.sin(a);
    const s: V3 = [TX + ca * r0 * 0.5, y, TZ + sa * r0 * 0.5];
    const m: V3 = [TX + ca * L * 0.55, y + 0.03 + hash3(i, 1, 1) * 0.02, TZ + sa * L * 0.55];
    const e: V3 = [TX + ca * L, y + 0.07 + hash3(i, 1, 2) * 0.03, TZ + sa * L];
    rtube(gp, [s, m, e], [0.014, 0.009, 0.004], '#8a4a2c', { radial: 7, sub: 3 });
    clumps(leaves, e[0], e[1] + 0.012, e[2], 6, 0.05, 0.034, LC, i + 3, 0.5);
    clumps(leaves, m[0], m[1] + 0.022, m[2], 3, 0.035, 0.028, LC, i + 40, 0.5);
  });
  for (let i = 0; i < 34; i++) {
    const t = i / 33, y = Y0 + H * (0.6 + t * 0.36), a = i * 2.4, rr = 0.1 * Math.sqrt(1 - t * t * 0.85) + 0.01;
    leaves.blob(TX + Math.cos(a) * rr, y, TZ + Math.sin(a) * rr, 0.04 * (1 - t * 0.3), 0.022, 0.04 * (1 - t * 0.3), t > 0.7 ? LC[i % 2 ? 3 : 1] : LC[i % 4], a, 0, 0, i);
  }

  // Neighbouring white firs and a young sequoia, plus a fallen giant with its root plate
  const firs = new Batch(CONE6(), 0.16), trunks = new Batch(CYL6(), 0.1);
  const fir = (x: number, z: number, h: number, c: string) => {
    const y = Y0 + hf(x, z) - 0.004;
    trunks.seg([x, y, z], [x, y + h * 0.35, z], h * 0.035, '#5b4030');
    for (let k = 0; k < 4; k++) firs.seg([x, y + h * (0.18 + k * 0.2), z], [x, y + h * (0.48 + k * 0.17), z], h * (0.2 - k * 0.04), shade(c, 1 + k * 0.06));
  };
  [[-0.36, -0.22, 0.34], [-0.2, -0.4, 0.38], [0.1, -0.43, 0.36], [0.33, -0.3, 0.3], [0.42, -0.06, 0.24], [-0.43, 0.02, 0.22], [0.38, 0.2, 0.17], [-0.4, 0.26, 0.15]]
    .forEach(([x, z, h], i) => fir(x, z, h, i % 2 ? '#2c4a3c' : '#34523f'));
  { // young sequoia: bright green cone on a red trunk
    const x = 0.24, z = -0.18, y = Y0 + hf(x, z) - 0.004;
    trunks.seg([x, y, z], [x, y + 0.34, z], 0.012, '#a0522d');
    for (let k = 0; k < 5; k++) firs.seg([x, y + 0.06 + k * 0.055, z], [x, y + 0.14 + k * 0.05, z], 0.06 - k * 0.01, '#5f7f34');
  }
  firs.flush(gp); trunks.flush(gp);
  rtube(gp, [[-0.42, Y0 + 0.02, 0.12], [-0.3, Y0 + 0.018, 0.0], [-0.18, Y0 + 0.016, -0.13]], [0.026, 0.022, 0.016], '#8f4a2c', {
    radial: 14, sub: 4, cap: 0.004, paint: (x, y, z) => (Math.cos(Math.atan2(y - Y0 - 0.02, x + z) * 18 + x * 30) > 0.3 ? '#a85c36' : null),
  });
  plathe(gp, [[0.001, -0.03], [0.04, -0.03], [0.05, 0], [0.04, 0.03], [0.001, 0.03]], '#6b4a30', (x, y, z) => (fbm(x * 60, y * 60, z * 60) > 0.55 ? '#5a3a24' : speck(x, y, 90, 5) > 0.8 ? '#8a6a4a' : null),
    0, 0, 0, 14, { disp: v => { const vx = v.x, vy = v.y; v.set(-0.43 + vy * 0.25, Y0 + 0.03 + vx * 0.9 + 0.02, 0.135 + vy * 0.9); } });

  // Split-rail fence around the base, wooden sign and visitors for scale
  const posts: V3[] = [];
  for (let i = 0; i <= 14; i++) {
    const a = -0.35 - (i / 14) * (TAU - 1.3), x = TX + Math.cos(a) * 0.15, z = TZ + Math.sin(a) * 0.15 * 1.1;
    posts.push([x, Y0 + hf(x, z) - 0.003, z]);
  }
  posts.forEach((pt, i) => {
    box(gp, '#7a5a3a', pt[0], pt[1], pt[2], 0.004, 0.018, 0.004);
    if (i) for (const hy of [0.008, 0.015]) rod(gp, [posts[i - 1][0], posts[i - 1][1] + hy, posts[i - 1][2]], [pt[0], pt[1] + hy, pt[2]], 0.0016, '#8a6a46', 4);
  });
  rbox(gp, '#9c6b3c', 0.07, Y0 + 0.004, 0.2, 0.06, 0.016, 0.008, 0.003, -0.3);
  box(gp, '#f1e4c8', 0.07 + 0.002, Y0 + 0.009, 0.2 + 0.0045, 0.042, 0.0035, 0.001, -0.3);
  person(gp, -0.02, Y0 + 0.004, 0.16, '#dc2626', 1, 0.2);
  person(gp, 0.025, Y0 + 0.004, 0.18, '#2563eb', 0.9, -0.4);
  person(gp, 0.0, Y0 + 0.004, 0.27, '#facc15', 0.75, 0.1);
  leaves.flush(gp);
};

// =========================================================================================================
// Amazon kapok (Ceiba) — plank buttresses, a tall pale trunk and an emergent umbrella crown above the canopy
const kapok: Builder = gp => {
  const TX = 0.0, TZ = -0.03;
  const riverZ = (x: number) => 0.3 + 0.04 * Math.sin(x * 6);
  const hf: HFn = (x, z) => {
    const rv = sstep(-0.02, 0.03, z - riverZ(x));
    return (0.016 + 0.012 * fbm(x * 6, 0, z * 6)) * (1 - rv) - 0.004 * rv;
  };
  island(gp, 0.5, hf, '#5b4a30', (x, y, z) => {
    if (y < Y0 + 0.001) return ripple('#9a7448')(x, y, z, 0, 1, 0);
    if (z > riverZ(x) - 0.04) return speck(x, z, 80, 2) > 0.6 ? '#a58a5c' : '#8f7650';
    const h = speck(x, z, 70, 4);
    return h > 0.82 ? '#7a5a2a' : h < 0.2 ? '#3f5a2a' : mix('#4f4026', '#5f6a34', fbm(x * 9, 1, z * 9));
  }, { rings: 40, segs: 96, side: strataSide(EARTH) });

  // Plank buttresses snaking out from the trunk foot
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + 0.3, L = 0.11 + hash3(i, 2, 1) * 0.05, h = 0.09 + hash3(i, 2, 2) * 0.04;
    const m = slab(gp, [[0.0, 0], [L, -0.004], [L * 0.75, h * 0.08], [L * 0.45, h * 0.25], [L * 0.2, h * 0.6], [0.01, h], [-0.005, h * 0.5]], 0.007, '#a39d8e', 0.002);
    m.position.set(TX, Y0 + 0.008, TZ); m.rotation.y = -a;
  }
  const TH = 0.66;
  rtube(gp, [[TX, Y0, TZ], [TX, Y0 + 0.25, TZ], [TX + 0.005, Y0 + 0.5, TZ], [TX + 0.004, Y0 + TH, TZ]], [0.04, 0.03, 0.027, 0.024, 0.02], '#a8a294', {
    radial: 16, sub: 5,
    paint: (x, y, z) => {
      const h = hash3(Math.floor(Math.atan2(z - TZ, x - TX) * 9), Math.floor(y * 120), 3);
      return h > 0.9 ? '#c9c4b5' : h < 0.08 ? '#7f8a62' : Math.sin(Math.atan2(z - TZ, x - TX) * 12 + y * 5) > 0.7 ? '#958f80' : null;
    },
  });

  // Near-horizontal limbs fanning into a flat-topped emergent crown
  const leaves = new Batch(ICO1(), 0.2), LC = ['#5e8a3a', '#6f9a42', '#4f7a32', '#7aa64a'];
  const lianas: V3[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + 0.5, L = 0.2 + hash3(i, 3, 1) * 0.1, ca = Math.cos(a), sa = Math.sin(a), y0 = Y0 + TH - 0.06 + hash3(i, 3, 2) * 0.05;
    const s: V3 = [TX + ca * 0.01, y0, TZ + sa * 0.01];
    const m: V3 = [TX + ca * L * 0.5, y0 + 0.05, TZ + sa * L * 0.5];
    const e: V3 = [TX + ca * L, y0 + 0.1, TZ + sa * L];
    rtube(gp, [s, m, e], [0.012, 0.008, 0.004], '#9a9486', { radial: 7, sub: 3 });
    for (const d of [-0.5, 0.5]) {
      const f: V3 = [m[0] + Math.cos(a + d) * L * 0.35, m[1] + 0.07, m[2] + Math.sin(a + d) * L * 0.35];
      rod(gp, m, f, 0.003, '#8f897a', 5);
      clumps(leaves, f[0], f[1] + 0.012, f[2], 3, 0.04, 0.05, LC, i * 7 + (d > 0 ? 1 : 2), 0.45);
    }
    clumps(leaves, e[0], e[1] + 0.012, e[2], 4, 0.05, 0.055, LC, i + 20, 0.45);
    if (i % 2 === 0) lianas.push(m);
  }
  clumps(leaves, TX, Y0 + TH + 0.07, TZ, 6, 0.06, 0.06, LC, 99, 0.45);
  for (const [k, m] of lianas.entries()) {
    const x = m[0] * 1.1, z = m[2] * 1.1;
    rtube(gp, [m, [x + 0.01, m[1] - 0.12, z], [x - 0.005, m[1] - 0.3, z + 0.01], [x + 0.004, Y0 + 0.24 + k * 0.03, z]], [0.0018, 0.0015], '#5a5a32', { radial: 5, sub: 3 });
  }

  // Lower rainforest canopy behind and at the sides (front kept open to show the buttresses)
  const under = new Batch(ICO1(), 0.22), ut = new Batch(CYL6(), 0.1), fl = new Batch(OCT(), 0.2);
  const UC = ['#2f6a35', '#3f7a3a', '#2a5a30', '#4a8a40', '#356f38'];
  for (let i = 0; i < 34; i++) {
    const a = Math.PI * (0.92 + (i / 33) * 1.16) + (hash3(i, 5, 1) - 0.5) * 0.2, d = 0.27 + hash3(i, 5, 2) * 0.19;
    const x = Math.cos(a) * d, z = Math.sin(a) * d * 0.9 - 0.02, h = 0.12 + hash3(i, 5, 3) * 0.12;
    if (z > riverZ(x) - 0.08) continue;
    ut.seg([x, Y0, z], [x, Y0 + h, z], 0.006, '#6b5a40');
    const flower = i === 9 ? '#e8c22a' : i === 24 ? '#d9799a' : '';
    clumps(under, x, Y0 + h, z, 4, 0.055, 0.066, flower ? [flower, shade(flower, 0.9)] : UC, i + 300, 0.75);
  }
  for (const [x, z] of [[0.36, 0.08], [-0.33, 0.12], [0.2, 0.2]] as [number, number][]) {
    const h = 0.26 + hash3(x * 9, 1, z) * 0.06, y = Y0 + hf(x, z);
    ut.seg([x, y, z], [x + 0.01, y + h, z], 0.004, '#8a8270');
    for (let k = 0; k < 8; k++) frond(fl, [x + 0.01, y + h, z], (k / 8) * TAU, 0.6, 0.07, 0.016, k % 2 ? '#4f8a3a' : '#5f9a42', 6);
  }
  for (let i = 0; i < 18; i++) {
    const a = hash3(i, 8, 1) * TAU, d = 0.08 + hash3(i, 8, 2) * 0.3, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z > riverZ(x) - 0.06 || Math.hypot(x - TX, z - TZ) < 0.12) continue;
    for (let k = 0; k < 4; k++) frond(fl, [x, Y0 + hf(x, z), z], (k / 4) * TAU + i, 0.9, 0.03, 0.009, k % 2 ? '#3f7a32' : '#55903f', 4);
  }
  under.flush(gp); ut.flush(gp); leaves.flush(gp); fl.flush(gp);

  // Dugout canoe on the muddy river, a scarlet macaw in the crown and an explorer at the buttresses
  const cx = -0.08, cz = 0.36;
  rtube(gp, [[cx - 0.06, Y0 + 0.002, cz + 0.01], [cx, Y0 - 0.002, cz], [cx + 0.06, Y0 + 0.002, cz - 0.01]], [0.004, 0.011, 0.004], '#6b4426', { radial: 10, sub: 3 });
  person(gp, cx + 0.02, Y0 - 0.008, cz - 0.003, '#f97316', 0.9, Math.PI / 2 - 0.15);
  rod(gp, [cx + 0.03, Y0 + 0.02, cz + 0.01], [cx + 0.035, Y0 - 0.002, cz + 0.02], 0.0012, '#a0703a', 4);
  person(gp, 0.1, Y0 + hf(0.1, 0.1) - 0.002, 0.1, '#16a34a', 1, -0.5, { hat: '#d6c08a' });
  const mb = new Batch(ICO1(), 0.05), mx = 0.12, my = Y0 + TH + 0.02, mz = 0.06;
  mb.blob(mx, my, mz, 0.006, 0.009, 0.006, '#dc2626');
  mb.blob(mx, my + 0.01, mz + 0.002, 0.0045, 0.0045, 0.0045, '#dc2626');
  mb.blob(mx, my + 0.009, mz + 0.006, 0.002, 0.002, 0.003, '#f1f5f9');
  for (const sx of [-1, 1]) mb.blob(mx + sx * 0.005, my + 0.001, mz - 0.002, 0.002, 0.007, 0.004, sx > 0 ? '#2563eb' : '#facc15', 0, 0.3);
  mb.seg([mx, my - 0.006, mz - 0.002], [mx, my - 0.03, mz - 0.008], 0.002, '#b91c1c');
  mb.flush(gp, false);
};

// =========================================================================================================
// Dragon blood trees of Socotra — dense upturned-umbrella crowns on forking grey limbs, goats on a stony plateau
function dragonTree(gp: THREE.Object3D, br: Batch, x: number, y: number, z: number, TH: number, R: number, seed: number): void {
  const lean = (hash3(seed, 1, 1) - 0.5) * 0.03;
  const top: V3 = [x + lean, y + TH, z];
  rtube(gp, [[x, y - 0.005, z], [x + lean * 0.4, y + TH * 0.5, z], top], [R * 0.13, R * 0.11, R * 0.1], '#b8b0a0', {
    radial: 12, sub: 3, fr: (a, t) => 1 + 0.12 * Math.max(0, 1 - t / 0.15) * Math.cos(4 * a),
    paint: (px, py, pz) => (hash3(Math.floor(Math.atan2(pz - z, px - x) * 5), Math.floor(py * 80), seed) > 0.8 ? '#9c9484' : py - y < 0.02 ? '#8f8778' : null),
  });
  // Dichotomous fork: each limb splits in two, three times, fanning up and out to the crown's underside
  const crownY = top[1] + R * 0.55, uy = (rr: number) => crownY - R * (0.13 + 0.06 * (rr / R)) + 0.006;
  const grow = (s: V3, a: number, spread: number, lvl: number, rad: number) => {
    const rr = R * [0.28, 0.52, 0.76, 0.94][lvl];
    const e: V3 = [top[0] + Math.cos(a) * rr, lvl === 3 ? uy(rr) : s[1] + (uy(rr) - s[1]) * (0.45 + lvl * 0.12), top[2] + Math.sin(a) * rr];
    br.seg(s, e, rad, lvl < 2 ? '#a9a191' : '#968e7e');
    if (lvl < 3) for (const d of [-1, 1]) grow(e, a + d * spread, spread * 0.55, lvl + 1, rad * 0.7);
  };
  const n = 3 + (seed % 2);
  for (let i = 0; i < n; i++) grow(top, (i / n) * TAU + seed, 0.55, 0, R * 0.07);
  // Umbrella crown: dark underside lathe + a dome of tufted leaf rosettes on top
  const dome = (u: number) => crownY + R * 0.06 - R * 0.2 * u * u;
  plathe(gp, [[0.001, crownY - R * 0.12], [R * 0.35, crownY - R * 0.14], [R * 0.75, crownY - R * 0.18], [R * 0.97, crownY - R * 0.2], [R * 1.0, dome(1) - R * 0.04],
    [R * 0.7, dome(0.7) - R * 0.04], [R * 0.35, dome(0.35) - R * 0.04], [0.001, dome(0) - R * 0.04]], '#4a5f2a', (px, _py, pz, _nx, ny) => {
    if (ny < -0.3) return speck(px, pz, 160, seed) > 0.6 ? '#5a5634' : '#454a2a';
    return null;
  }, x + lean, 0, z, 28);
  const tf = new Batch(ICO1(), 0.16), TC = ['#4f6e2c', '#5d7c33', '#3f5c26', '#6b8a3a'];
  const nT = Math.round(70 * R / 0.3 + 10);
  for (let i = 0; i < nT; i++) {
    const u = Math.sqrt((i + 0.5) / nT) * 0.97, rr = u * R, a = i * 2.39996 + seed;
    const sz = R * (0.13 + 0.045 * hash3(i, seed, 4));
    tf.blob(x + lean + Math.cos(a) * rr, dome(u) - sz * 0.15, z + Math.sin(a) * rr, sz, sz * 0.5, sz, TC[i % 4], a, 0, 0, i);
  }
  tf.flush(gp);
}
const dragonblood: Builder = gp => {
  const hf: HFn = (x, z) => 0.02 + 0.02 * fbm(x * 5, 0, z * 5) + 0.025 * sstep(0.15, 0.5, -z) * fbm(x * 4, 1, z * 4);
  island(gp, 0.5, hf, '#8f9a5a', (x, y, z) => {
    const h = speck(x, z, 90, 2), n = fbm(x * 12, 0, z * 12);
    if (h > 0.8) return n > 0.5 ? '#c8bfae' : '#a39a8a';
    return n > 0.62 ? '#9aa45e' : n < 0.4 ? '#7d8a4c' : h < 0.1 ? '#8a7a5a' : null;
  }, { rings: 40, segs: 96, side: strataSide(['#b8ae98', '#a39882', '#8f8570']) });
  const br = new Batch(CYL6(), 0.1);
  dragonTree(gp, br, -0.04, Y0 + hf(-0.04, 0.02), 0.02, 0.24, 0.29, 1);
  dragonTree(gp, br, 0.3, Y0 + hf(0.3, -0.22), -0.22, 0.2, 0.17, 2);
  dragonTree(gp, br, -0.33, Y0 + hf(-0.33, -0.2), -0.2, 0.17, 0.15, 3);
  dragonTree(gp, br, 0.32, Y0 + hf(0.32, 0.18), 0.18, 0.08, 0.08, 4);
  br.flush(gp, false);
  // Limestone rubble, a dry-stone wall and grazing goats
  const st = new Batch(ICO0(), 0.25);
  for (let i = 0; i < 110; i++) {
    const a = hash3(i, 9, 1) * TAU, d = Math.sqrt(hash3(i, 9, 2)) * 0.47, x = Math.cos(a) * d, z = Math.sin(a) * d, s = 0.006 + hash3(i, 9, 3) * 0.012;
    st.blob(x, Y0 + hf(x, z) + s * 0.2, z, s, s * 0.55, s * 0.8, i % 3 ? '#c4bcaa' : '#a39a8a', a);
  }
  for (let i = 0; i < 18; i++) {
    const t = i / 17, x = -0.44 + t * 0.32, z = 0.12 + t * 0.2;
    for (let k = 0; k < 2; k++) st.blob(x + k * 0.006, Y0 + hf(x, z) + 0.006 + k * 0.01, z, 0.012, 0.007, 0.01, k ? '#b5ad9c' : '#9c9484', i);
  }
  st.flush(gp);
  goat(gp, -0.2, Y0 + hf(-0.2, 0.3), 0.3, 0.9, '#7a3b22', 1);
  goat(gp, 0.17, Y0 + hf(0.17, 0.3), 0.3, -1.1, '#1f1f22', 1);
  goat(gp, 0.12, Y0 + hf(0.12, 0.4), 0.4, 2.6, '#e8e2d4', 0.8);
};

// =========================================================================================================
// Rafflesia arnoldii — the giant five-lobed corpse flower on the Sumatran rainforest floor
function petalGeo(R: number, W: number, T: number, seed: number): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 20, 12);
  const pa = geo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pa.count; i++) {
    let x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
    const u = (x + 1) / 2, wave = 1 + 0.08 * Math.sin(Math.atan2(z, x) * 6 + seed);
    x = x * R * 0.5 * wave + R * 0.5;
    z = z * W * (0.75 + 0.35 * Math.sin(u * Math.PI * 0.9)) * wave;
    y = y * T * (y > 0 ? 1.2 : 0.6) + T * 0.6 * Math.sin(u * Math.PI) - u * u * T * 1.2;
    pa.setXYZ(i, x, y, z);
  }
  return geo;
}
function rafflesiaFlower(gp: THREE.Object3D, x: number, y: number, z: number, s: number, seed: number): void {
  const RED = '#a8361f', WART = '#ecd6b4';
  const spots: Paint = (px, py, pz, _nx, ny) => {
    if (ny < -0.2) return '#7a2a18';
    const [f1] = worley(px / s * 34, py / s * 34, pz / s * 34);
    return f1 < 0.3 ? WART : f1 < 0.38 ? '#d9a88a' : null;
  };
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + seed;
    const geo = petalGeo(0.21 * s, 0.11 * s, 0.022 * s, i + seed);
    geo.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x + Math.cos(a) * 0.07 * s, y + 0.02 * s, z + Math.sin(a) * 0.07 * s),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -a, -0.06)), new THREE.Vector3(1, 1, 1)));
    geo.computeVertexNormals();
    add(gp, paintFaces(geo, RED, spots), mat('#ffffff', { vc: true, flat: false, rough: 0.7 }), 0, 0, 0, 1, 1, 1);
  }
  // Central perigone tube with a warty rim (diaphragm) around the dark opening
  plathe(gp, [[0.11 * s, 0], [0.12 * s, 0.05 * s], [0.115 * s, 0.085 * s], [0.095 * s, 0.1 * s], [0.07 * s, 0.098 * s], [0.06 * s, 0.085 * s], [0.06 * s, 0.03 * s], [0.001, 0.03 * s]], '#e2a273',
    (px, py, pz, _nx, ny) => {
      const ry = py - y;
      if (ry < 0.08 * s && Math.hypot(px - x, pz - z) < 0.064 * s) return ry < 0.035 * s ? '#3a1410' : '#4a1a12';
      const [f1] = worley(px / s * 40, py / s * 40, pz / s * 40);
      if (ry > 0.08 * s && ny > 0.3) return f1 < 0.3 ? '#f2e2c8' : '#b8502e';
      return f1 < 0.26 ? '#f5e3c2' : null;
    }, x, y + 0.02 * s, z, 28);
  const spikes = new Batch(CONE6(), 0.1);
  for (let i = 0; i < 22; i++) {
    const a = i * 2.4, d = Math.sqrt((i + 0.5) / 22) * 0.045 * s;
    spikes.seg([x + Math.cos(a) * d, y + 0.05 * s, z + Math.sin(a) * d], [x + Math.cos(a) * d * 1.2, y + 0.075 * s, z + Math.sin(a) * d * 1.2], 0.004 * s, '#e8b070');
  }
  spikes.flush(gp, false);
}
const rafflesia: Builder = gp => {
  const hf: HFn = (x, z) => 0.012 + 0.016 * fbm(x * 6, 0, z * 6) + 0.05 * sstep(0.15, 0.5, -z) * fbm(x * 3, 2, z * 3);
  island(gp, 0.5, hf, '#4a3a28', (x, _y, z) => {
    const h = speck(x, z, 110, 1), n = fbm(x * 14, 3, z * 14);
    if (h > 0.84) return n > 0.5 ? '#9a5a2a' : '#b07a3a';
    if (h < 0.12) return '#6a5a2a';
    return n > 0.6 ? '#3f5a28' : mix('#4a3a28', '#5c4630', n);
  }, { rings: 40, segs: 96, side: strataSide(EARTH) });
  rafflesiaFlower(gp, 0.02, Y0 + hf(0.02, 0.06) - 0.004, 0.06, 1.3, 0.2);
  rafflesiaFlower(gp, 0.32, Y0 + hf(0.32, -0.22) - 0.004, -0.22, 0.5, 1.3);
  // Host vine (Tetrastigma) snaking over the floor, buds like dark cabbages
  rtube(gp, [[-0.48, Y0 + 0.012, -0.05], [-0.3, Y0 + 0.02, -0.08], [-0.2, Y0 + 0.012, 0.1], [-0.05, Y0 + 0.01, 0.24], [0.2, Y0 + 0.014, 0.18], [0.36, Y0 + 0.016, 0.0], [0.42, Y0 + 0.03, -0.25], [0.38, Y0 + 0.35, -0.3]],
    [0.012, 0.011, 0.01, 0.009, 0.01, 0.011], '#6b4a30', { radial: 8, sub: 5, paint: (px, py, pz) => (Math.sin((px + pz) * 160 + py * 50) > 0.6 ? '#7d5a3a' : null) });
  for (const [bx, bz, bs] of [[-0.21, 0.14, 0.03], [0.2, 0.22, 0.024], [-0.32, -0.06, 0.02]] as [number, number, number][]) {
    const by = Y0 + hf(bx, bz);
    plathe(gp, [[0.001, 0], [bs * 0.9, 0.002], [bs, bs * 0.5], [bs * 0.75, bs * 1.1], [0.001, bs * 1.4]], '#4a2a1c', (px, py) => (Math.floor(py * 300) % 3 === 0 ? '#6b3a24' : null), bx, by, bz, 14);
  }
  // Ferns, saplings and buttressed trunks behind; flies and a butterfly for scale
  const lv = new Batch(OCT(), 0.2), tr = new Batch(CYL6(), 0.1), cl = new Batch(ICO1(), 0.2);
  for (let i = 0; i < 12; i++) {
    const a = Math.PI * (1.05 + (i / 11) * 0.9), d = 0.33 + hash3(i, 4, 1) * 0.12, x = Math.cos(a) * d, z = Math.sin(a) * d, y = Y0 + hf(x, z);
    for (let k = 0; k < 5; k++) frond(lv, [x, y, z], (k / 5) * TAU + i, 0.8, 0.075, 0.017, k % 2 ? '#3f7a32' : '#4f8a3a', 6);
  }
  // Two buttressed giants rising into a closed canopy band, with a dense undergrowth wall hiding their feet
  for (const [x, z, h, r] of [[-0.22, -0.38, 0.36, 0.028], [0.2, -0.4, 0.4, 0.03]] as number[][]) {
    const y = Y0 + hf(x, z) - 0.004;
    rtube(gp, [[x, y, z], [x, y + h * 0.5, z], [x + 0.01, y + h, z]], [r * 1.7, r, r * 0.8], '#6f6458', { radial: 10, sub: 3, fr: (a, t) => 1 + 0.6 * Math.max(0, 1 - t / 0.14) * Math.max(0, Math.cos(3 * a)),
      paint: (px, py, pz) => (fbm(px * 60, py * 20, pz * 60) > 0.6 ? '#8a8270' : hash3(Math.floor(px * 200), Math.floor(py * 90), Math.floor(pz * 200)) > 0.85 ? '#5f7a3a' : null) });
  }
  for (const [x, z, h] of [[-0.22, -0.38, 0.36], [0.2, -0.4, 0.4]]) clumps(cl, x, Y0 + h + 0.03, z + 0.02, 14, 0.15, 0.07, ['#2f6a35', '#3f7a3a', '#2a5a30', '#356f38'], Math.round(x * 100) + 70, 0.55);
  for (let i = 0; i < 24; i++) {
    const a = Math.PI * (0.95 + (i / 23) * 1.1), d = 0.37 + hash3(i, 8, 1) * 0.09, x = Math.cos(a) * d, z = Math.sin(a) * d;
    clumps(cl, x, Y0 + hf(x, z) + 0.03 + hash3(i, 8, 2) * 0.05, z, 4, 0.05, 0.052, ['#2f6a35', '#3f7a3a', '#4a8a40', '#2a5a30', i % 9 === 3 ? '#c2410c' : '#356f38'], i + 120, 0.8);
  }
  for (let i = 0; i < 10; i++) {
    const a = hash3(i, 6, 1) * TAU, d = 0.25 + hash3(i, 6, 2) * 0.2, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z < -0.25) continue;
    const y = Y0 + hf(x, z);
    tr.seg([x, y, z], [x, y + 0.06, z], 0.0015, '#5a4a30');
    for (let k = 0; k < 5; k++) lv.blob(x + Math.cos(k * 1.3) * 0.012, y + 0.04 + k * 0.006, z + Math.sin(k * 1.3) * 0.012, 0.013, 0.002, 0.006, k % 2 ? '#4f8a3a' : '#5f9a42', k * 1.3);
  }
  lv.flush(gp, false); tr.flush(gp); cl.flush(gp);
  const bug = new Batch(ICO1(), 0.05);
  for (const [fx, fy, fz] of [[0.0, 0.16, 0.05], [0.05, 0.19, 0.02], [-0.06, 0.14, 0.12], [0.18, 0.065, 0.14]]) {
    bug.blob(fx, fy, fz, 0.004, 0.003, 0.006, '#1f2a1a');
    for (const sx of [-1, 1]) bug.blob(fx + sx * 0.005, fy + 0.002, fz, 0.005, 0.001, 0.003, '#c8d4dc', sx * 0.4);
  }
  for (const sx of [-1, 1]) bug.blob(-0.2 + sx * 0.012, 0.24, 0.2, 0.012, 0.0015, 0.01, '#2563eb', sx * 0.4, 0, sx * 0.5);
  bug.blob(-0.2, 0.24, 0.2, 0.002, 0.002, 0.008, '#111827');
  bug.flush(gp, false);
};

// =========================================================================================================
// Giant water lily (Victoria amazonica) — tray-rimmed pads on a dark jungle river, white & pink flowers, a child sitting on a pad
function lilyPad(gp: THREE.Object3D, x: number, y: number, z: number, R: number, rot: number, seed: number): void {
  const RIM = R * 0.16;
  plathe(gp, [[0.001, 0.003], [R * 0.6, 0.003], [R * 0.97, 0.004], [R * 1.0, RIM * 0.4], [R * 1.03, RIM], [R * 1.05, RIM * 0.9], [R * 1.02, 0.0], [0.001, -0.002]], '#5f8f3a',
    (px, py, pz, _nx, ny) => {
      const lx = px - x, lz = pz - z, r = Math.hypot(lx, lz), a = Math.atan2(lz, lx);
      if (r > R * 0.985 || ny < -0.2) return hash3(Math.floor(a * 60), Math.floor(py * 600), seed) > 0.6 ? '#7a2436' : '#962f45';
      const vein = Math.abs(Math.sin(a * 13 + seed)) < 0.12 || Math.abs(Math.sin(r / R * 18)) < 0.1;
      if (vein) return '#7aa54a';
      return hash3(Math.floor(a * 26), Math.floor(r / R * 18), seed) > 0.7 ? '#4f7f30' : null;
    }, x, y, z, 40, { gap: 0.09, rot });
}
function lilyFlower(gp: THREE.Object3D, x: number, y: number, z: number, s: number, c: string, inner: string): void {
  const pb = new Batch(LEAF(), 0.1);
  const rings: [number, number, number, number, number][] = [[14, 0.05, 0.25, 0.042, 0.015], [12, 0.035, 0.55, 0.036, 0.022], [10, 0.022, 0.9, 0.028, 0.028], [8, 0.01, 1.25, 0.02, 0.034]];
  rings.forEach(([n, r, tilt, L, h], k) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + k * 0.3, ca = Math.cos(a), sa = Math.sin(a);
      const cx = x + ca * (r + L * 0.5 * Math.cos(tilt)) * s, cz = z + sa * (r + L * 0.5 * Math.cos(tilt)) * s;
      pb.blob(cx, y + (h + L * 0.4 * Math.sin(tilt)) * s * 0.6, cz, L * 0.5 * s, 0.003 * s, L * 0.2 * s, k > 1 ? inner : c, -a, 0, -tilt, k * 100 + i);
    }
  });
  pb.blob(x, y + 0.035 * s, z, 0.012 * s, 0.01 * s, 0.012 * s, '#f5d78a');
  pb.flush(gp, false);
}
const victoria: Builder = gp => {
  const bank = (x: number, z: number) => -z - 0.24 + 0.05 * Math.sin(x * 7) + 0.02 * fbm(x * 9, 0, z * 9);
  const hf: HFn = (x, z) => { const b = bank(x, z); return b > 0 ? 0.01 + 0.05 * sstep(0, 0.12, b) + 0.015 * fbm(x * 8, 1, z * 8) : -0.006; };
  island(gp, 0.5, hf, '#3a4a2a', (x, y, z) => {
    if (y < Y0) return calm('#24392e')(x, y, z, 0, 1, 0);
    const b = bank(x, z);
    if (b < 0.03) return speck(x, z, 80, 1) > 0.5 ? '#6b5a3a' : '#5a4a30';
    return speck(x, z, 70, 2) > 0.8 ? '#4f7a32' : mix('#3a5a2a', '#4a6a30', fbm(x * 10, 0, z * 10));
  }, { rings: 40, segs: 96, side: strataSide(EARTH) });
  const wy = Y0 - 0.004;
  lilyPad(gp, -0.04, wy, 0.1, 0.19, 0.6, 1);
  lilyPad(gp, 0.27, wy, -0.02, 0.14, 2.2, 2);
  lilyPad(gp, -0.3, wy, -0.05, 0.12, 4.0, 3);
  lilyPad(gp, 0.22, wy, 0.3, 0.1, 1.2, 4);
  lilyPad(gp, -0.3, wy, 0.27, 0.085, 5.0, 5);
  lilyPad(gp, 0.04, wy, -0.17, 0.07, 3.3, 6);
  lilyFlower(gp, 0.15, wy, 0.17, 1.15, '#fbfaf5', '#f3e9e4');
  lilyFlower(gp, -0.17, wy, 0.16, 1.0, '#e58fb0', '#c9577f');
  // Spiny bud
  plathe(gp, [[0.001, 0], [0.018, 0.012], [0.02, 0.03], [0.01, 0.05], [0.001, 0.056]], '#6b3a3a', (_px, py) => (Math.floor(py * 400) % 2 ? '#7d4a3a' : null), 0.1, wy, -0.08, 10);
  // Child sitting cross-legged on the biggest pad, a wattled jacana walking on another
  const kx = -0.06, ky = wy + 0.005, kz = 0.07;
  for (const sx of [-1, 1]) rod(gp, [kx + sx * 0.012, ky + 0.003, kz + 0.008], [kx - sx * 0.002, ky + 0.003, kz + 0.012], 0.0035, '#2563eb', 6);
  rbox(gp, '#facc15', kx, ky + 0.002, kz, 0.018, 0.02, 0.012, 0.004);
  for (const sx of [-1, 1]) rod(gp, [kx + sx * 0.01, ky + 0.018, kz], [kx + sx * 0.012, ky + 0.008, kz + 0.008], 0.0024, '#e2b48c', 5);
  add(gp, g('pl:head', () => new THREE.SphereGeometry(1, 10, 7)), mat('#e2b48c', { flat: false }), kx, ky + 0.03, kz, 0.0075, 0.008, 0.0075);
  add(gp, g('pl:head', () => new THREE.SphereGeometry(1, 10, 7)), mat('#3b2a20', { flat: false }), kx, ky + 0.033, kz - 0.002, 0.0078, 0.007, 0.0076);
  const jb = new Batch(ICO1(), 0.05), jx = 0.28, jz = 0.0, jy = wy + 0.004;
  jb.blob(jx, jy + 0.022, jz, 0.006, 0.006, 0.01, '#5a2a1a');
  jb.blob(jx, jy + 0.03, jz + 0.009, 0.004, 0.004, 0.004, '#111827');
  jb.blob(jx, jy + 0.029, jz + 0.015, 0.0015, 0.0015, 0.004, '#facc15');
  for (const sx of [-1, 1]) jb.seg([jx + sx * 0.002, jy + 0.018, jz], [jx + sx * 0.004, jy, jz + sx * 0.004], 0.0011, '#8a9a5a');
  jb.flush(gp, false);
  // Riverbank jungle: palms, reeds and a few broad trees along the back
  const fr = new Batch(OCT(), 0.2), tr = new Batch(CYL6(), 0.1), cl = new Batch(ICO1(), 0.2);
  for (let i = 0; i < 13; i++) {
    const t = i / 12, a = Math.PI * (1.06 + t * 0.88), d = 0.36 + hash3(i, 3, 1) * 0.1, x = Math.cos(a) * d, z = Math.sin(a) * d;
    const y = Y0 + hf(x, z) - 0.004, h = 0.08 + hash3(i, 3, 2) * 0.1;
    if (i % 4 === 1) {
      tr.seg([x, y, z], [x + 0.01, y + h + 0.08, z], 0.004, '#8a8270');
      for (let k = 0; k < 8; k++) frond(fr, [x + 0.01, y + h + 0.08, z], (k / 8) * TAU, 0.5, 0.07, 0.016, k % 2 ? '#4f8a3a' : '#5f9a42', 6);
    } else {
      tr.seg([x, y, z], [x, y + h, z], 0.007, '#6b5a40');
      clumps(cl, x, y + h + 0.03, z, 7, 0.07, 0.06, ['#2f6a35', '#3f7a3a', '#2a5a30', '#4a8a40'], i + 50, 0.75);
    }
  }
  for (let i = 0; i < 40; i++) {
    const x = -0.45 + hash3(i, 7, 1) * 0.9, z = -0.2 - 0.05 * Math.sin(x * 7) + (hash3(i, 7, 2) - 0.5) * 0.04;
    if (Math.hypot(x, z) > 0.48) continue;
    tr.seg([x, Y0 - 0.005, z], [x + (hash3(i, 7, 3) - 0.5) * 0.02, Y0 + 0.03 + hash3(i, 7, 4) * 0.04, z + 0.005], 0.0012, i % 3 ? '#7a9a45' : '#8faa55');
  }
  fr.flush(gp, false); tr.flush(gp); cl.flush(gp);
};

// =========================================================================================================
// Welwitschia mirabilis — two endless strap leaves shredded into ribbons, a woody crown and cones, on Namib gravel
/** Flat leathery strap lying along pts (thin slab with crinkled edges), tips fading to dry brown. */
function ribbon(gp: THREE.Object3D, pts: V3[], w: number, seed: number): void {
  const curve = new THREE.CatmullRomCurve3(pts.map(v => new THREE.Vector3(...v)), false, 'centripetal');
  const n = 24, th = w * 0.08, P = new THREE.Vector3(), T = new THREE.Vector3(), S = new THREE.Vector3(), U = new THREE.Vector3();
  const vs: number[] = [], idx: number[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    curve.getPointAt(t, P); curve.getTangentAt(t, T);
    S.set(-T.z, 0, T.x).normalize(); U.crossVectors(T, S).normalize();
    if (U.y < 0) U.negate();
    const ww = w * (1 - 0.35 * t) * (0.92 + 0.16 * hash3(i, seed, 2)), tw = Math.sin(t * 5 + seed) * 0.35 * t;
    for (const [sx, ux] of [[-1, 1], [1, 1], [1, -1], [-1, -1]]) {
      const crinkle = Math.sin(t * 40 + seed + sx) * w * 0.12 * t;
      const ox = sx * ww, oy = ux * th + sx * ww * tw + crinkle;
      vs.push(P.x + S.x * ox + U.x * oy, P.y + S.y * ox + U.y * oy, P.z + S.z * ox + U.z * oy);
    }
  }
  for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) {
    const a = i * 4 + k, b = i * 4 + ((k + 1) % 4), c = a + 4, d = b + 4;
    idx.push(a, b, c, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vs, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const p0 = pts[0], pe = pts[pts.length - 1], L = Math.hypot(pe[0] - p0[0], pe[2] - p0[2]);
  add(gp, paintFaces(geo, '#6f8a5a', (px, _py, pz, _nx, ny) => {
    const t = Math.hypot(px - p0[0], pz - p0[2]) / (L + 1e-4), stripe = Math.sin((px * 3 + pz * 3) * 260 + seed) > 0.5;
    if (ny < -0.2) return '#4a4a38';
    if (t > 0.72) return hash3(Math.floor(px * 300), seed, Math.floor(pz * 300)) > 0.5 ? '#9a7a50' : '#7d6040';
    if (t > 0.52) return stripe ? '#8f8a5a' : '#a08a5a';
    return stripe ? '#5f7a4c' : t < 0.2 ? '#7d9a66' : null;
  }), mat('#ffffff', { vc: true, flat: true, rough: 0.8 }), 0, 0, 0, 1, 1, 1);
}
function welwitschiaPlant(gp: THREE.Object3D, x: number, y: number, z: number, s: number, rot: number, seed: number): void {
  // Woody, cracked two-lobed crown (concave on top)
  for (const sd of [-1, 1]) {
    const cx = x + Math.cos(rot) * sd * 0.045 * s, cz = z - Math.sin(rot) * sd * 0.045 * s;
    plathe(gp, [[0.001, 0.045 * s], [0.035 * s, 0.05 * s], [0.06 * s, 0.062 * s], [0.07 * s, 0.05 * s], [0.072 * s, 0.01 * s], [0.06 * s, -0.01 * s]], '#5a5048',
      (px, py, pz) => (worley(px / s * 70, py / s * 70, pz / s * 70)[1] - worley(px / s * 70, py / s * 70, pz / s * 70)[0] < 0.08 ? '#3a322c' : fbm(px * 90, py * 90, pz * 90) > 0.55 ? '#6e655a' : null),
      cx, y, cz, 18, { disp: v => { v.x = cx + (v.x - cx) * 0.75; } });
  }
  // Two leaves torn into ribbons, sprawling and curling out to both sides
  for (const sd of [-1, 1]) for (let k = 0; k < 8; k++) {
    const a = rot + (sd > 0 ? 0 : Math.PI) + (k - 3.5) * 0.24 + (hash3(seed, k, sd) - 0.5) * 0.2;
    const L = (0.2 + hash3(seed, k, 3 + sd) * 0.12) * s, ca = Math.cos(a), sa = -Math.sin(a), curl = (hash3(seed, k, 9 + sd) - 0.5) * 2.4;
    const pts: V3[] = [];
    for (let i = 0; i <= 5; i++) {
      const t = i / 5, bend = curl * t * t;
      const px = x + ca * (0.05 * s + L * t) - sa * L * bend * 0.4, pz = z + sa * (0.05 * s + L * t) + ca * L * bend * 0.4;
      pts.push([px, y + (0.05 * s) * (1 - t) ** 2 + 0.025 * s * Math.sin(t * Math.PI) * (1 - t) + 0.004 + (k % 3) * 0.0025 * (1 - t * 0.5), pz]);
    }
    ribbon(gp, pts, (0.02 + hash3(seed, k, 5) * 0.01) * s, seed * 10 + k);
  }
  // Cones on short stalks at the crown rim
  const cb = new Batch(ICO1(), 0.12);
  for (let i = 0; i < 9; i++) {
    const a = rot + Math.PI / 2 + (i % 2 ? Math.PI : 0) + (i - 4) * 0.12, r = 0.05 * s;
    const bx = x + Math.cos(a) * r, bz = z + Math.sin(a) * r, by = y + 0.05 * s;
    const tx = bx + Math.cos(a) * 0.025 * s, tz = bz + Math.sin(a) * 0.025 * s, ty = by + 0.03 * s + (i % 3) * 0.006 * s;
    cb.seg([bx, by, bz], [tx, ty, tz], 0.0015 * s, '#8a6a40');
    cb.blob(tx, ty + 0.006 * s, tz, 0.0065 * s, 0.011 * s, 0.0065 * s, seed % 2 ? '#c8553a' : '#7d9a6a', a, 0.4);
  }
  cb.flush(gp, false);
}
const welwitschia: Builder = gp => {
  const hf: HFn = (x, z) => {
    const dune = sstep(-0.2, -0.48, z + 0.06 * Math.sin(x * 5)) * (0.08 + 0.03 * Math.sin(x * 6 + 1));
    return 0.008 + 0.006 * fbm(x * 9, 0, z * 9) + dune;
  };
  island(gp, 0.5, hf, '#cdb592', (x, y, z) => {
    if (y > Y0 + 0.045) return mix('#c88a5a', '#d49a68', fbm(x * 12, y * 20, z * 12));
    if (y > Y0 + 0.02) return mix('#cdb592', '#c88a5a', sstep(Y0 + 0.02, Y0 + 0.045, y));
    const h = speck(x, z, 140, 3);
    return h > 0.86 ? '#8a7a68' : h < 0.1 ? '#e8d8b8' : h > 0.75 ? '#a89478' : null;
  }, { rings: 40, segs: 96, side: strataSide(['#c8a878', '#b89468', '#d8b888']) });
  welwitschiaPlant(gp, 0.0, Y0 + hf(0, 0.06) - 0.004, 0.06, 1.0, 0.2, 1);
  welwitschiaPlant(gp, -0.28, Y0 + hf(-0.28, -0.16) - 0.004, -0.16, 0.45, 1.9, 2);
  const st = new Batch(ICO0(), 0.2);
  for (let i = 0; i < 60; i++) {
    const a = hash3(i, 4, 1) * TAU, d = 0.15 + Math.sqrt(hash3(i, 4, 2)) * 0.32, x = Math.cos(a) * d, z = Math.sin(a) * d, s = 0.004 + hash3(i, 4, 3) * 0.008;
    if (z < -0.3) continue;
    st.blob(x, Y0 + hf(x, z) + s * 0.2, z, s, s * 0.6, s, i % 3 ? '#8a7a68' : '#5a4a40', a);
  }
  st.flush(gp);
  // Gemsbok on the dune and a tok-tokkie beetle beside the plant
  const ob = new Batch(ICO1(), 0.06), ox = 0.24, oz = -0.3, oy = Y0 + hf(ox, oz) - 0.002, q = new THREE.Group();
  q.position.set(ox, oy, oz); q.rotation.y = -0.9; gp.add(q);
  ob.blob(0, 0.05, 0, 0.014, 0.014, 0.03, '#a89a8a');
  ob.blob(0, 0.044, 0, 0.0145, 0.005, 0.028, '#2a2420');
  ob.blob(0, 0.068, 0.03, 0.006, 0.012, 0.007, '#a89a8a', 0, -0.5);
  ob.blob(0, 0.076, 0.042, 0.005, 0.005, 0.009, '#f1ece4', 0, 0.4);
  ob.blob(0, 0.076, 0.044, 0.0052, 0.0025, 0.007, '#1f1a18', 0, 0.4);
  for (const sx of [-1, 1]) {
    ob.seg([sx * 0.003, 0.08, 0.04], [sx * 0.006, 0.12, 0.018], 0.0012, '#1f1a18');
    for (const fz of [-0.022, 0.022]) ob.seg([sx * 0.008, 0.042, fz], [sx * 0.008, 0, fz], 0.0028, fz > 0 ? '#a89a8a' : '#2a2420');
  }
  ob.seg([0, 0.052, -0.03], [0, 0.03, -0.038], 0.002, '#1f1a18');
  ob.flush(q, false);
  const bt = new Batch(ICO1(), 0.05);
  bt.blob(0.14, Y0 + hf(0.14, 0.28) + 0.004, 0.28, 0.006, 0.004, 0.008, '#151515', 0.6);
  bt.flush(gp, false);
};

// =========================================================================================================
// Saguaro cacti — fluted green giants with upturned arms, white crown flowers, in a Sonoran desert below the Rincons
const BOXT = () => tpl('pl:boxt', () => new THREE.BoxGeometry(2, 1, 2).translate(0, 0.5, 0));
function saguaroPlant(gp: THREE.Object3D, fl: Batch, x: number, y: number, z: number, H: number, R: number, arms: [number, number, number][], seed: number): void {
  const ribs = (a: number) => 0.92 + 0.14 * Math.pow(Math.abs(Math.cos(7 * a)), 0.7);
  const paint: Paint = (px, py, pz) => {
    const h = hash3(Math.floor(px * 420), Math.floor(py * 420), Math.floor(pz * 420) + seed);
    return h > 0.93 ? '#cfc79a' : h < 0.06 ? '#3f6636' : fbm(px * 40, py * 30, pz * 40) > 0.62 ? '#5c8a4c' : py - y < 0.012 ? '#6a7a4a' : null;
  };
  const lean = (hash3(seed, 2, 2) - 0.5) * 0.01;
  rtube(gp, [[x, y - 0.01, z], [x, y + H * 0.45, z], [x + lean, y + H, z], [x + lean, y + H + R * 0.55, z], [x + lean, y + H + R * 0.85, z]], [R * 1.02, R, R * 0.97, R * 0.8, R * 0.42],
    '#4f7a43', { radial: 28, sub: 4, cap: R * 0.12, fr: ribs, paint });
  const crown = (cx: number, cy: number, cz: number, r: number) => {
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05 + seed, d = r * (0.35 + 0.25 * (i % 2));
      fl.blob(cx + Math.cos(a) * d, cy, cz + Math.sin(a) * d, r * 0.24, r * 0.16, r * 0.24, i % 3 ? '#f7f3e6' : '#9ab85a', a);
      if (i % 3) fl.blob(cx + Math.cos(a) * d, cy + r * 0.12, cz + Math.sin(a) * d, r * 0.09, r * 0.06, r * 0.09, '#f2c94c', a);
    }
  };
  crown(x + lean, y + H + R * 0.9, z, R);
  for (const [th, hf, lf] of arms) {
    const c = Math.cos(th), s = Math.sin(th), h0 = y + H * hf, r = R * 0.72, L = H * lf;
    const o = (d: number, dy: number): V3 => [x + c * d, h0 + dy, z + s * d];
    rtube(gp, [o(R * 0.3, 0), o(R + r * 0.9, r * 0.25), o(R + r * 2.0, r * 1.2), o(R + r * 2.2, r * 2.6), o(R + r * 2.2, L), o(R + r * 2.2, L + r * 0.6)],
      [r * 0.95, r, r, r * 0.98, r * 0.9, r * 0.5], '#4f7a43', { radial: 28, sub: 3, cap: r * 0.15, fr: ribs, paint });
    crown(x + c * (R + r * 2.2), h0 + L + r * 0.75, z + s * (R + r * 2.2), r);
  }
}
const saguaro: Builder = gp => {
  const hf: HFn = (x, z) => {
    const ridge = sstep(-0.18, -0.48, z + 0.05 * Math.sin(x * 7)) * (0.12 + 0.07 * fbm(x * 4, 3, 0) + 0.03 * Math.sin(x * 9));
    return 0.008 + 0.01 * fbm(x * 7, 0, z * 7) + ridge;
  };
  island(gp, 0.5, hf, '#c9a27a', (x, y, z) => {
    const h = speck(x, z, 120, 4), n = fbm(x * 10, y * 30, z * 10);
    if (y > Y0 + 0.05) return h > 0.88 ? '#6f7f4a' : n > 0.55 ? '#9a6a5a' : n < 0.4 ? '#7a5a52' : '#8a6458';
    if (y > Y0 + 0.03) return mix('#b88a6a', '#8a6458', n);
    return h > 0.9 ? '#9a6a4a' : h < 0.08 ? '#e6d2b0' : h > 0.82 ? '#8f9a5a' : n > 0.6 ? '#d2ae84' : null;
  }, { rings: 40, segs: 96, side: strataSide(['#b8805a', '#a06a4a', '#c8946a', '#8f5f44']) });
  const fl = new Batch(ICO1(), 0.08);
  saguaroPlant(gp, fl, 0.0, Y0 + hf(0, 0.02), 0.02, 0.34, 0.034, [[Math.PI * 0.97, 0.38, 0.3], [0.12, 0.47, 0.26], [-Math.PI * 0.62, 0.56, 0.2], [Math.PI * 0.42, 0.62, 0.16]], 1);
  saguaroPlant(gp, fl, -0.27, Y0 + hf(-0.27, -0.14), -0.14, 0.24, 0.024, [[0.3, 0.5, 0.25], [Math.PI * 1.1, 0.6, 0.2]], 2);
  saguaroPlant(gp, fl, 0.29, Y0 + hf(0.29, -0.16), -0.16, 0.2, 0.021, [[Math.PI * 0.9, 0.55, 0.28]], 3);
  saguaroPlant(gp, fl, 0.04, Y0 + hf(0.04, -0.3), -0.3, 0.17, 0.018, [[0.2, 0.5, 0.3], [Math.PI, 0.45, 0.25]], 4);
  saguaroPlant(gp, fl, -0.34, Y0 + hf(-0.34, 0.2), 0.2, 0.09, 0.016, [], 5);
  saguaroPlant(gp, fl, 0.36, Y0 + hf(0.36, 0.14), 0.14, 0.05, 0.013, [], 6);
  // Gila woodpecker hole on the big one
  fl.blob(0.0, Y0 + 0.23, 0.02 + 0.035, 0.006, 0.008, 0.003, '#2a1f14');
  // Prickly pear pads with magenta fruit, teddy-bear cholla, ocotillo whips, brittlebush, red boulders
  const pd = new Batch(ICO1(), 0.12), sb = new Batch(ICO0(), 0.2), wh = new Batch(CYL6(), 0.1);
  for (const [cx, cz, sd] of [[0.17, 0.2, 1], [-0.17, 0.3, 2], [0.38, -0.02, 3], [-0.12, -0.2, 4]]) {
    const cy = Y0 + hf(cx, cz);
    for (let i = 0; i < 9; i++) {
      const a = hash3(sd, i, 1) * TAU, lvl = i < 4 ? 0 : i < 7 ? 1 : 2, d = (0.022 - lvl * 0.006) * (0.6 + hash3(sd, i, 2) * 0.6);
      const px = cx + Math.cos(a) * d, pz = cz + Math.sin(a) * d, py = cy + 0.014 + lvl * 0.02;
      pd.blob(px, py, pz, 0.014, 0.018, 0.0045, i % 2 ? '#6f8f4a' : '#7d9a5a', a + Math.PI / 2, 0, (hash3(sd, i, 3) - 0.5) * 0.7, sd * 10 + i);
      if (lvl === 2 || i === 5) for (let k = 0; k < 3; k++) pd.blob(px + (k - 1) * 0.006 * Math.cos(a + Math.PI / 2), py + 0.018, pz + (k - 1) * 0.006 * Math.sin(a + Math.PI / 2), 0.0035, 0.004, 0.0035, '#b0306a');
    }
  }
  for (const [cx, cz] of [[-0.2, 0.1], [0.24, 0.32], [0.18, -0.06]]) {
    const cy = Y0 + hf(cx, cz);
    wh.seg([cx, cy, cz], [cx, cy + 0.03, cz], 0.004, '#4a3a2a');
    for (let i = 0; i < 6; i++) {
      const a = i * 1.1 + cx * 9, ex = cx + Math.cos(a) * 0.016, ez = cz + Math.sin(a) * 0.016, ey = cy + 0.03 + (i % 3) * 0.008;
      pd.seg([cx, cy + 0.024 + (i % 2) * 0.006, cz], [ex, ey, ez], 0.0065, i % 2 ? '#d8cf9a' : '#e6dcae');
      pd.blob(ex, ey, ez, 0.0068, 0.0068, 0.0068, '#d8cf9a');
    }
  }
  for (const [cx, cz, n] of [[-0.36, -0.02, 13], [0.14, -0.38, 10]]) {
    const cy = Y0 + hf(cx, cz);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + hash3(i, cx * 10, 1), sp = 0.18 + hash3(i, 2, cx * 10) * 0.25, L = 0.13 + hash3(i, 3, cx * 10) * 0.06;
      const mid: V3 = [cx + Math.cos(a) * sp * L * 0.5, cy + L * 0.5, cz + Math.sin(a) * sp * L * 0.5], tip: V3 = [cx + Math.cos(a) * sp * L * 1.1, cy + L, cz + Math.sin(a) * sp * L * 1.1];
      wh.seg([cx, cy, cz], mid, 0.0022, '#6b6a4a'); wh.seg(mid, tip, 0.0016, '#6b6a4a');
      sb.blob(tip[0], tip[1] + 0.006, tip[2], 0.003, 0.009, 0.003, '#e0442a');
    }
  }
  for (let i = 0; i < 26; i++) {
    const a = hash3(i, 11, 1) * TAU, d = 0.12 + Math.sqrt(hash3(i, 11, 2)) * 0.34, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z < -0.2) continue;
    const y = Y0 + hf(x, z);
    clumps(sb, x, y + 0.008, z, 3, 0.012, 0.011, ['#9aa58a', '#a9b49a'], i + 200, 0.75);
    if (i % 2) clumps(sb, x, y + 0.017, z, 3, 0.012, 0.0045, ['#f2c94c', '#e8b72e'], i + 300, 0.8);
  }
  for (let i = 0; i < 40; i++) {
    const a = hash3(i, 12, 1) * TAU, d = 0.08 + Math.sqrt(hash3(i, 12, 2)) * 0.4, x = Math.cos(a) * d, z = Math.sin(a) * d, s = 0.006 + hash3(i, 12, 3) * (i < 8 ? 0.03 : 0.012);
    sb.blob(x, Y0 + hf(x, z) + s * 0.25, z, s, s * 0.7, s * 0.9, i % 3 ? '#a8644a' : '#8a5040', a);
  }
  pd.flush(gp, false); sb.flush(gp); wh.flush(gp);
  // Hiker in a sun hat looking up, and a roadrunner dashing past
  person(gp, 0.1, Y0 + hf(0.1, 0.17), 0.17, '#2f7fb8', 1.35, -2.6, { hat: '#d9c49a', pants: '#8a7a5a' });
  const rr = new Batch(ICO1(), 0.05), rx = -0.06, rz = 0.3, ry = Y0 + hf(rx, rz);
  rr.blob(rx, ry + 0.016, rz, 0.005, 0.005, 0.011, '#6b5a48', 0.3, 0.2);
  rr.blob(rx + 0.003, ry + 0.023, rz + 0.01, 0.0035, 0.0035, 0.004, '#4a3a2a', 0.3);
  rr.blob(rx + 0.0045, ry + 0.027, rz + 0.008, 0.0012, 0.004, 0.003, '#2a2420', 0.3, -0.4);
  rr.seg([rx + 0.004, ry + 0.023, rz + 0.013], [rx + 0.007, ry + 0.022, rz + 0.02], 0.0012, '#2a2420');
  rr.seg([rx - 0.002, ry + 0.017, rz - 0.009], [rx - 0.006, ry + 0.024, rz - 0.024], 0.0022, '#3a3028');
  for (const sx of [-1, 1]) rr.seg([rx + sx * 0.002, ry + 0.012, rz], [rx + sx * 0.003, ry, rz + sx * 0.006], 0.0009, '#6b5a48');
  rr.flush(gp, false);
};

// =========================================================================================================
// Dutch tulip fields — ruler-straight colour bands between polder ditches, a windmill, farmhouse, poplars and a cyclist
const tulips: Builder = gp => {
  const TH = 0.3, ct = Math.cos(TH), st = Math.sin(TH);
  const U = (x: number, z: number) => x * ct + z * st, V = (x: number, z: number) => -x * st + z * ct;
  const ditch = (u: number) => Math.abs((((u + 0.1) % 0.2) + 0.2) % 0.2 - 0.1);
  const hf: HFn = (x, z) => {
    const u = U(x, z), v = V(x, z);
    if (v > -0.2 && ditch(u) < 0.012) return -0.007;
    return 0.006 + 0.002 * fbm(x * 9, 0, z * 9);
  };
  const BANDS = ['#d4202a', '#f2c018', '#f07aa0', '#7a3a9a', '#f4f0e8', '#f08a1a', '#e0245e', '#f7d038', '#8e44ad', '#ff8a3d'];
  const bandOf = (u: number) => Math.floor((u + 0.5) / 0.1);
  island(gp, 0.5, hf, '#5f8a3a', (x, y, z) => {
    if (y < Y0) return calm('#46707a')(x, y, z, 0, 1, 0);
    const u = U(x, z), v = V(x, z);
    if (v < -0.2) {
      if (v > -0.235) return speck(x, z, 160, 2) > 0.85 ? '#6f6a64' : '#8a857e';
      return speck(x, z, 80, 3) > 0.85 ? '#7aa04a' : fbm(x * 9, 1, z * 9) > 0.6 ? '#6a9a3e' : null;
    }
    if (ditch(u) < 0.02) return '#6a9a3e';
    if (Math.abs(u - 0.08) < 0.01) return '#9a8a78';
    return Math.sin(u * TAU / 0.02) > 0.3 ? '#6a5040' : '#3f6a2a';
  }, { rings: 40, segs: 96, side: strataSide(['#5a4636', '#6b5444', '#4f3c2e', '#7a6a58']) });
  // Raised rows of tulips: a green leaf ridge topped with bobbing flower heads
  const ridge = new Batch(BOXT(), 0.08), heads = new Batch(OCT(), 0.22);
  for (let u = -0.47; u < 0.47; u += 0.02) {
    if (ditch(u) < 0.022 || Math.abs(u - 0.08) < 0.016) continue;
    const vmax = Math.sqrt(Math.max(0, 0.46 * 0.46 - u * u)) - 0.01, vmin = -0.185;
    if (vmax <= vmin + 0.02) continue;
    const p = (v: number): V3 => [u * ct - v * st, 0, u * st + v * ct];
    const a = p(vmin), b = p(vmax);
    a[1] = b[1] = Y0 + 0.006;
    ridge.seg(a, b, 0.0055, '#3f7a2e', 0.0055);
    const c = BANDS[bandOf(u) % BANDS.length];
    for (let v = vmin + 0.006; v < vmax; v += 0.011) {
      const q = p(v + (hash3(u * 100, v * 100, 1) - 0.5) * 0.003);
      heads.blob(q[0], Y0 + 0.012 + hash3(u * 100, v * 100, 2) * 0.002, q[2], 0.0055, 0.0075, 0.0055, c, hash3(u, v, 3) * TAU);
    }
  }
  // Bike path along a ditch, poplars along the back road
  const tr = new Batch(ICO1(), 0.15), wd = new Batch(CYL6(), 0.1);
  for (let i = 0; i < 10; i++) {
    const u = -0.4 + i * 0.09, v = -0.255, x = u * ct - v * st, z = u * st + v * ct;
    if (Math.hypot(x, z) > 0.45 || (u > -0.33 && u < -0.12)) continue;
    wd.seg([x, Y0, z], [x, Y0 + 0.04, z], 0.003, '#5a4a3a');
    tr.blob(x, Y0 + 0.1, z, 0.017, 0.07, 0.017, i % 2 ? '#3f6a2e' : '#4a7a34', i);
  }
  // Windmill (tower mill: tapered octagonal body, stage, thatched cap, four lattice sails)
  const mx = -0.2, mz = -0.34, my = Y0 + hf(mx, mz);
  plathe(gp, [[0.048, 0], [0.046, 0.03], [0.038, 0.09], [0.03, 0.15], [0.001, 0.15]], '#5a524a', (_px, py, _pz, _nx, ny) => (py < my + 0.03 ? '#8a3a2a' : ny > 0.9 ? null : Math.floor((py - my) * 220) % 2 ? '#4f4842' : null), mx, my, mz, 8);
  cyl(gp, '#6b5a48', mx, my + 0.05, mz, 0.062, 0.004, 16);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; wd.seg([mx + Math.cos(a) * 0.06, my + 0.052, mz + Math.sin(a) * 0.06], [mx + Math.cos(a) * 0.06, my + 0.062, mz + Math.sin(a) * 0.06], 0.0008, '#e8e2d4'); }
  ellip(gp, '#3a3530', mx, my + 0.152, mz, 0.034, 0.024, 0.036);
  box(gp, '#f1ece4', mx, my + 0.11, mz + 0.034, 0.012, 0.016, 0.004);
  box(gp, '#2f6a3a', mx, my + 0.02, mz + 0.045, 0.014, 0.022, 0.004);
  const hub = new THREE.Group(); hub.position.set(mx, my + 0.15, mz + 0.04); hub.rotation.z = 0.35; gp.add(hub);
  cyl(hub, '#2a2420', 0, 0, 0, 0.005, 0.01, 8).rotation.x = Math.PI / 2;
  for (let k = 0; k < 4; k++) {
    const arm = new THREE.Group(); arm.rotation.z = (k * Math.PI) / 2; hub.add(arm);
    box(arm, '#3a2a20', 0, 0.065, 0, 0.003, 0.13, 0.003);
    box(arm, '#e8e0d0', 0.009, 0.075, 0.001, 0.014, 0.1, 0.0012);
    for (let j = 0; j < 6; j++) box(arm, '#5a4a3a', 0.009, 0.03 + j * 0.018, 0.002, 0.016, 0.0012, 0.0012);
    box(arm, '#5a4a3a', 0.016, 0.075, 0.002, 0.0012, 0.1, 0.0012);
  }
  // Farmhouse with a steep roof and white-framed windows, plus a barn
  const fh = new THREE.Group(), fx = 0.2, fz = -0.35; fh.position.set(fx, Y0 + hf(fx, fz), fz); fh.rotation.y = -TH; gp.add(fh);
  rbox(fh, '#9a3a2a', 0, 0.018, 0, 0.08, 0.036, 0.045, 0.002);
  gable(fh, 0.086, 0.045, 0.052, '#3f3a38', 0, 0.036, 0);
  rbox(fh, '#7a6a5a', 0.075, 0.016, -0.004, 0.07, 0.032, 0.05, 0.002);
  gable(fh, 0.076, 0.035, 0.056, '#4a5a4a', 0.075, 0.032, -0.004);
  for (const wx of [-0.026, -0.008, 0.012, 0.03]) { box(fh, '#f1ece4', wx, 0.02, 0.0228, 0.01, 0.012, 0.001); box(fh, '#38506a', wx, 0.02, 0.0234, 0.007, 0.009, 0.001); }
  box(fh, '#2f6a3a', 0.075, 0.012, 0.0215, 0.02, 0.024, 0.002);
  box(fh, '#f1ece4', -0.04, 0.05, 0, 0.002, 0.012, 0.004);
  // Cyclist on the dyke path with a bicycle, and a grey heron fishing in a ditch
  const cu = 0.08, cv = 0.24, cx = cu * ct - cv * st, cz = cu * st + cv * ct, cy = Y0 + hf(cx, cz);
  const bk = new THREE.Group(); bk.position.set(cx, cy, cz); bk.rotation.y = -TH - Math.PI / 2; gp.add(bk);
  for (const wx of [-0.011, 0.011]) add(bk, g('pl:wheel', () => new THREE.TorusGeometry(1, 0.13, 5, 16)), mat('#1f2937'), wx, 0.0085, 0, 0.0085, 0.0085, 0.0085);
  rod(bk, [-0.011, 0.0085, 0], [0.0, 0.017, 0], 0.0008, '#c0392b', 4); rod(bk, [0.0, 0.017, 0], [0.011, 0.0085, 0], 0.0008, '#c0392b', 4);
  rod(bk, [-0.011, 0.0085, 0], [0.001, 0.0085, 0], 0.0008, '#c0392b', 4); rod(bk, [0.009, 0.019, 0], [0.011, 0.0085, 0], 0.0008, '#c0392b', 4);
  rod(bk, [0.008, 0.02, -0.005], [0.008, 0.02, 0.005], 0.0007, '#2a2420', 4);
  box(bk, '#f2c018', -0.006, 0.019, 0, 0.012, 0.004, 0.007);
  person(gp, cx - st * 0.0, cy, cz + 0.012, '#f08a1a', 1.2, -TH - Math.PI / 2, { pants: '#1f3a6a' });
  const hu = 0.1, hv = 0.05, hx = hu * ct - hv * st, hz = hu * st + hv * ct;
  tr.blob(hx, Y0 + 0.018, hz, 0.005, 0.006, 0.011, '#9aa2a8', 0.5, 0.3);
  tr.seg([hx + 0.002, Y0 + 0.022, hz + 0.007], [hx + 0.003, Y0 + 0.034, hz + 0.01], 0.0018, '#c8ccd0');
  tr.seg([hx + 0.003, Y0 + 0.034, hz + 0.01], [hx + 0.005, Y0 + 0.032, hz + 0.02], 0.0009, '#e0a030');
  for (const s of [-1, 1]) tr.seg([hx + s * 0.002, Y0 + 0.014, hz], [hx + s * 0.002, Y0 - 0.006, hz], 0.0008, '#6b6a5a');
  ridge.flush(gp); heads.flush(gp); tr.flush(gp); wd.flush(gp);
};

// =========================================================================================================
// Shunan Bamboo Sea — misty hills of feathery moso bamboo, a hexagonal pavilion, flagstone path, stream and raft
const CULM = () => tpl('pl:culm', () => {
  const geo = new THREE.CylinderGeometry(1, 1, 1, 5, 8, true).translate(0, 0.5, 0);
  const pa = geo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pa.count; i++) { const k = Math.round(pa.getY(i) * 8); if (k % 2 === 0 && k > 0 && k < 8) { pa.setX(i, pa.getX(i) * 1.22); pa.setZ(i, pa.getZ(i) * 1.22); } }
  return geo;
});
const bamboo: Builder = gp => {
  const zs = (x: number) => 0.27 + 0.06 * Math.sin(x * 6 + 0.5);
  const hf: HFn = (x, z) => {
    const w = Math.abs(z - zs(x));
    if (w < 0.045) return -0.007;
    const hill = sstep(0.0, -0.45, z) * (0.12 + 0.08 * fbm(x * 3, 5, z * 3)) + 0.04 * sstep(0.1, 0.45, Math.abs(x)) * sstep(0.2, -0.1, z);
    return 0.006 + 0.012 * fbm(x * 8, 0, z * 8) + hill * sstep(0.045, 0.1, w);
  };
  island(gp, 0.5, hf, '#7a8a3a', (x, y, z) => {
    if (y < Y0) return calm('#3f6a5a')(x, y, z, 0, 1, 0);
    const w = Math.abs(z - zs(x)), h = speck(x, z, 120, 6), n = fbm(x * 12, y * 20, z * 12);
    if (w < 0.06) return h > 0.6 ? '#8a8270' : '#a09a88';
    return h > 0.86 ? '#c8b25a' : h < 0.12 ? '#5a6a2a' : n > 0.6 ? '#8a9a42' : n < 0.38 ? '#6b7a32' : null;
  }, { rings: 40, segs: 96, side: strataSide(['#6a5038', '#7a5c40', '#5a4430', '#8a6a4a']) });
  const path = (t: number): [number, number] => [-0.06 - t * 0.16 + 0.04 * Math.sin(t * 4), 0.22 - t * 0.27];
  const nearPath = (x: number, z: number) => { for (let t = 0; t <= 1; t += 0.05) { const [px, pz] = path(t); if (Math.hypot(x - px, z - pz) < 0.045) return true; } return false; };
  const PV: [number, number] = [-0.22, -0.06];
  const cu = new Batch(CULM(), 0.12), lf = new Batch(OCT(), 0.25), cn = new Batch(ICO1(), 0.18);
  const CC = ['#7a9a3a', '#8aa848', '#6b8a30', '#9ab04f', '#5f7f2a'], LC = ['#7fa83a', '#93b84a', '#6b9a32', '#a6c25a'];
  let n = 0;
  for (let i = 0; i < 700 && n < 150; i++) {
    const x = (hash3(i, 21, 1) - 0.5) * 0.94, z = (hash3(i, 21, 2) - 0.5) * 0.94;
    if (Math.hypot(x, z) > 0.46 || z > zs(x) - 0.06 || nearPath(x, z) || Math.hypot(x - PV[0], z - PV[1]) < 0.085 || (Math.abs(x - PV[0]) < 0.08 && z > PV[1])) continue;
    n++;
    const y = Y0 + hf(x, z) - 0.003, H = 0.17 + hash3(i, 21, 3) * 0.12, lx = (hash3(i, 21, 4) - 0.5) * 0.05 + x * 0.04, lz = (hash3(i, 21, 5) - 0.5) * 0.05;
    const top: V3 = [x + lx, y + H, z + lz];
    cu.seg([x, y, z], top, 0.0042, CC[i % 5]);
    for (let k = 0; k < 9; k++) {
      const t = 0.5 + k * 0.058, a = k * 2.1 + i, px = x + lx * t, py = y + H * t, pz = z + lz * t, L = 0.016 + 0.008 * (1 - Math.abs(t - 0.75) * 2);
      lf.blob(px + Math.cos(a) * L * 0.8, py - 0.004, pz + Math.sin(a) * L * 0.8, L, 0.003, 0.006, LC[(i + k) % 4], -a, 0, -0.45);
    }
    lf.blob(top[0], top[1] + 0.006, top[2], 0.004, 0.014, 0.004, LC[i % 4]);
  }
  // Young shoots by the path
  for (let i = 0; i < 6; i++) {
    const t = 0.15 + i * 0.13, [px, pz] = path(t), x = px + (i % 2 ? 0.035 : -0.035), z = pz;
    cn.seg([x, Y0 + hf(x, z) - 0.002, z], [x, Y0 + hf(x, z) + 0.018, z], 0.004, '#8a6a3a');
  }
  cu.flush(gp); lf.flush(gp); cn.flush(gp);
  // Flagstone path climbing to the pavilion
  const fs = new Batch(ICO0(), 0.18);
  for (let t = 0; t <= 1.001; t += 0.045) {
    const [x, z] = path(t);
    for (const o of [-0.012, 0.012]) fs.blob(x + o * Math.cos(t * 3), Y0 + hf(x, z) - 0.001, z + o * Math.sin(t * 3) * 0.5, 0.012, 0.004, 0.009, o > 0 ? '#a8a29a' : '#968f86', t * 7);
  }
  for (let i = 0; i < 30; i++) {
    const x = -0.45 + i * 0.031, z = zs(x) + (i % 2 ? 0.05 : -0.05) + (hash3(i, 3, 3) - 0.5) * 0.02;
    if (Math.hypot(x, z) > 0.47) continue;
    fs.blob(x, Y0 + Math.max(0, hf(x, z)) + 0.002, z, 0.01, 0.006, 0.008, i % 3 ? '#8a8a80' : '#6f6f68', i);
  }
  // Red-inscribed boulder (stele) by the stream
  fs.blob(0.17, Y0 + hf(0.17, 0.14) + 0.02, 0.14, 0.05, 0.035, 0.03, '#8a8278', 0.3);
  fs.flush(gp);
  box(gp, '#b8201a', 0.17 + 0.006, Y0 + hf(0.17, 0.14) + 0.03, 0.14 + 0.03, 0.04, 0.022, 0.002, 0.3);
  for (let k = 0; k < 4; k++) box(gp, '#f2d8b0', 0.17 - 0.012 + k * 0.009, Y0 + hf(0.17, 0.14) + 0.03, 0.14 + 0.0325, 0.005, 0.014, 0.0012, 0.3);
  // Hexagonal pavilion with red columns and upturned grey-tiled eaves
  const py = Y0 + hf(PV[0], PV[1]);
  plathe(gp, [[0.001, 0.0], [0.05, 0.0], [0.05, 0.008], [0.001, 0.008]], '#a8a29a', undefined, PV[0], py - 0.002, PV[1], 6, { flat: true });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + Math.PI / 6; cyl(gp, '#a52a1a', PV[0] + Math.cos(a) * 0.04, py + 0.03, PV[1] + Math.sin(a) * 0.04, 0.0032, 0.045, 6); }
  plathe(gp, [[0.001, 0.05], [0.04, 0.05], [0.062, 0.06], [0.056, 0.058], [0.04, 0.064], [0.022, 0.078], [0.008, 0.094], [0.001, 0.096]], '#3f4448',
    (_px, py2, _pz, _nx, ny) => (ny < -0.2 ? '#a52a1a' : Math.floor((py2 - py) * 300) % 3 === 0 ? '#2f3438' : null), PV[0], py, PV[1], 6, { flat: true, rot: 0 });
  ball(gp, '#c8a040', PV[0], py + 0.1, PV[1], 0.008);
  // Bamboo raft on the stream with a boatman poling
  const rx = 0.0, rz = zs(0) + 0.005, ryy = Y0 - 0.004;
  const raft = new Batch(CYL6(), 0.12);
  for (let k = 0; k < 6; k++) raft.seg([rx - 0.045, ryy, rz - 0.012 + k * 0.0048], [rx + 0.045, ryy + 0.002, rz - 0.012 + k * 0.0048], 0.0026, k % 2 ? '#c8b060' : '#b8a050');
  raft.seg([rx + 0.012, ryy, rz + 0.004], [rx - 0.03, ryy + 0.07, rz - 0.01], 0.0011, '#8a7a40');
  raft.flush(gp);
  person(gp, rx + 0.012, ryy + 0.003, rz + 0.004, '#3b82f6', 1.25, 0.4, { hat: '#d9c49a', pants: '#2a2a2a' });
};

// =========================================================================================================
// Pando — one giant quaking-aspen clone: a hillside of white trunks with golden autumn crowns, roots shown in the cut
function deer(p: THREE.Object3D, x: number, y: number, z: number, ry: number, s = 1): void {
  const b = new Batch(ICO1(), 0.08), q = new THREE.Group(), c = '#8a6a50';
  q.position.set(x, y, z); q.rotation.y = ry; q.scale.setScalar(s); p.add(q);
  b.blob(0, 0.03, 0, 0.008, 0.0085, 0.016, c);
  b.blob(0, 0.03, -0.016, 0.004, 0.005, 0.003, '#f1ece4');
  b.blob(0, 0.04, 0.015, 0.0038, 0.0075, 0.004, c, 0, -0.5);
  b.blob(0, 0.047, 0.021, 0.0034, 0.0036, 0.0065, shade(c, 0.9), 0, 0.4);
  b.blob(0, 0.046, 0.027, 0.0014, 0.0014, 0.0016, '#1f1a18');
  for (const sx of [-1, 1]) {
    b.blob(sx * 0.0045, 0.051, 0.018, 0.0045, 0.0018, 0.0025, c, sx * 0.4, 0, sx * 0.5);
    b.seg([sx * 0.0015, 0.05, 0.019], [sx * 0.006, 0.062, 0.017], 0.0007, '#d8cdb8');
    b.seg([sx * 0.006, 0.062, 0.017], [sx * 0.009, 0.068, 0.02], 0.0006, '#d8cdb8');
    b.seg([sx * 0.006, 0.062, 0.017], [sx * 0.005, 0.07, 0.013], 0.0006, '#d8cdb8');
    for (const fz of [-0.011, 0.011]) b.seg([sx * 0.0045, 0.026, fz], [sx * 0.0045, 0, fz], 0.0014, shade(c, 0.8));
  }
  b.flush(q, false);
}
const pando: Builder = gp => {
  const lake = (x: number, z: number) => ((x + 0.2) / 0.22) ** 2 + ((z - 0.25) / 0.16) ** 2;
  const hf: HFn = (x, z) => {
    if (lake(x, z) < 1) return -0.007;
    return 0.008 + 0.012 * fbm(x * 7, 0, z * 7) + 0.14 * sstep(0.25, -0.45, z) * (0.8 + 0.3 * fbm(x * 3, 2, 0)) + 0.012 * sstep(1, 1.6, lake(x, z)) - 0.012;
  };
  const inGrove = (x: number, z: number) => z < 0.1 - 0.12 * Math.sin(x * 4 + 1) * 0.5 && lake(x, z) > 1.3;
  island(gp, 0.5, hf, '#9a9a5a', (x, y, z) => {
    if (y < Y0) return calm('#3a6a8a')(x, y, z, 0, 1, 0);
    const h = speck(x, z, 130, 8), n = fbm(x * 11, y * 20, z * 11);
    if (lake(x, z) < 1.35) return h > 0.5 ? '#8a7a5a' : '#a09070';
    if (inGrove(x, z)) return h > 0.8 ? '#e0b030' : h < 0.15 ? '#7a6a3a' : n > 0.55 ? '#c89a38' : '#a8843a';
    return h > 0.86 ? '#c8b060' : h < 0.1 ? '#6a7a3a' : n > 0.6 ? '#a8a060' : null;
  }, {
    rings: 40, segs: 96, side: (y, x, z) => {
      const [f1, f2] = worley(x * 16, y * 34, z * 16);
      if (f2 - f1 < 0.08 && y > 0.004) return f2 - f1 < 0.04 ? '#efe2b8' : '#d8c696';
      return ['#6b4f3a', '#5a4130', '#7a5a40'][Math.abs(Math.floor(y * 30 + fbm(x * 9, y * 3, z * 9) * 1.4)) % 3];
    },
  });
  const tk = new Batch(CYL6(), 0.06), mk = new Batch(OCT(), 0.1), cr = new Batch(ICO1(), 0.16), sg = new Batch(ICO0(), 0.15);
  const GOLD = ['#f0c63a', '#e8b52a', '#f4d04a', '#dca020'], ODD = ['#e0782a', '#8aa03a', '#c8a030'];
  let n = 0;
  for (let i = 0; i < 400 && n < 78; i++) {
    const x = (hash3(i, 31, 1) - 0.5) * 0.94, z = (hash3(i, 31, 2) - 0.5) * 0.94;
    if (Math.hypot(x, z) > 0.46 || !inGrove(x, z)) continue;
    n++;
    const y = Y0 + hf(x, z) - 0.003, H = 0.12 + hash3(i, 31, 3) * 0.1, r = 0.0035 + hash3(i, 31, 4) * 0.0018, lean = (hash3(i, 31, 5) - 0.5) * 0.015;
    const top: V3 = [x + lean, y + H, z];
    tk.seg([x, y, z], top, r, i % 3 ? '#ebe9e0' : '#dcdad0');
    for (let k = 0; k < 4; k++) mk.blob(x + lean * (0.15 + k * 0.15) + Math.cos(i + k) * r, y + H * (0.12 + k * 0.15), z + Math.sin(i + k) * r, r * 0.9, r * 0.45, r * 0.9, '#2a2a28', i + k);
    mk.blob(x, y + 0.004, z, r * 1.4, 0.006, r * 1.4, '#3a3a34');
    const cs = hash3(i, 31, 6) > 0.9 ? ODD : GOLD;
    for (let k = 0; k < 3; k++) {
      const t = 0.62 + k * 0.17, sz = 0.026 - k * 0.005 + r;
      cr.blob(x + lean * t + (hash3(i, k, 7) - 0.5) * 0.01, y + H * t + 0.012, z + (hash3(i, k, 8) - 0.5) * 0.01, sz, sz * 1.3, sz, cs[(i + k) % cs.length], i + k, 0, 0, i * 3 + k);
    }
  }
  // Young suckers sprouting from the shared roots at the grove edge
  for (let i = 0; i < 20; i++) {
    const a = hash3(i, 33, 1) * TAU, d = Math.sqrt(hash3(i, 33, 2)) * 0.45, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (inGrove(x, z) || lake(x, z) < 1.4 || z < 0.0) continue;
    const y = Y0 + hf(x, z);
    tk.seg([x, y, z], [x, y + 0.03, z], 0.0015, '#d8d6c8');
    cr.blob(x, y + 0.034, z, 0.007, 0.009, 0.007, i % 2 ? '#f0c63a' : '#a8b040');
  }
  for (let i = 0; i < 40; i++) {
    const a = hash3(i, 34, 1) * TAU, d = Math.sqrt(hash3(i, 34, 2)) * 0.46, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (inGrove(x, z) || lake(x, z) < 1.3) continue;
    clumps(sg, x, Y0 + hf(x, z) + 0.006, z, 3, 0.01, 0.01, ['#8a9a80', '#9aa890', '#7a8a70'], i + 400, 0.7);
  }
  tk.flush(gp, false); mk.flush(gp); cr.flush(gp); sg.flush(gp);
  deer(gp, 0.2, Y0 + hf(0.2, 0.26), 0.26, -0.7, 1.3);
  deer(gp, 0.3, Y0 + hf(0.3, 0.15), 0.15, -1.6, 1.0);
  person(gp, 0.05, Y0 + hf(0.05, 0.3), 0.3, '#c0392b', 1.25, 2.6, { hat: '#3a3a3a' });
};

// =========================================================================================================
// Coco de mer — Vallée de Mai palm forest: pleated giant fans, the famous double nut, granite boulders, a black parrot
const FAN = () => tpl('pl:fan', () => {
  const N = 18, pos: number[] = [], A = 1.25;
  const pt = (j: number, r: number): number[] => { const a = -A + (j / N) * 2 * A, pl = (j % 2 ? 1 : -1) * 0.07 * r; return [Math.cos(a) * r, pl - 0.12 * r * r, Math.sin(a) * r]; };
  for (let j = 0; j < N; j++) {
    const c = [0, 0, 0], a0 = pt(j, 0.5), a1 = pt(j + 1, 0.5), b0 = pt(j, 1), b1 = pt(j + 1, 1);
    for (const [p, q, r] of [[c, a1, a0], [a0, a1, b1], [a0, b1, b0]]) { pos.push(...p, ...q, ...r); pos.push(...p, ...r, ...q); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return geo;
});
function fanPalm(gp: THREE.Object3D, tk: Batch, fn: Batch, nb: Batch, x: number, y: number, z: number, H: number, seed: number, female: boolean): void {
  const lean = [(hash3(seed, 1, 1) - 0.5) * 0.02, (hash3(seed, 1, 2) - 0.5) * 0.02];
  const top: V3 = [x + lean[0], y + H, z + lean[1]];
  rtube(gp, [[x, y - 0.005, z], [x + lean[0] * 0.5, y + H * 0.5, z + lean[1] * 0.5], top], [0.014, 0.011, 0.01], '#8a8580', {
    radial: 8, sub: 4, paint: (_px, py) => (Math.floor(py * 260) % 3 === 0 ? '#6f6a64' : Math.floor(py * 260) % 3 === 1 ? '#9a958e' : null),
  });
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * TAU + seed, el = k % 3 === 0 ? 0.25 : 0.65 + hash3(seed, k, 3) * 0.3, L = 0.05 + hash3(seed, k, 4) * 0.02;
    const e: V3 = [top[0] + Math.cos(a) * L * Math.cos(el), top[1] + Math.sin(el) * L, top[2] + Math.sin(a) * L * Math.cos(el)];
    tk.seg(top, e, 0.0025, '#6b7a3a');
    const s = 0.075 + hash3(seed, k, 5) * 0.025;
    fn.blob(e[0], e[1], e[2], s, s, s, k % 2 ? '#3f7a32' : '#4a8a3a', -a, (hash3(seed, k, 6) - 0.5) * 0.6, el * 0.55, seed * 10 + k);
  }
  for (let k = 0; k < 2; k++) {
    const a = seed * 2 + k * 2.6;
    tk.seg(top, [top[0] + Math.cos(a) * 0.02, top[1] - 0.04, top[2] + Math.sin(a) * 0.02], 0.002, '#8a6a40');
    fn.blob(top[0] + Math.cos(a) * 0.02, top[1] - 0.04, top[2] + Math.sin(a) * 0.02, 0.05, 0.05, 0.05, '#9a7a48', -a, 0, -1.2, seed * 7 + k);
  }
  if (female) for (let k = 0; k < 4; k++) {
    const a = seed + k * 1.6, d = 0.022, hx = top[0] + Math.cos(a) * d, hz = top[2] + Math.sin(a) * d, hy = top[1] - 0.02 - (k % 2) * 0.01;
    tk.seg(top, [hx, hy, hz], 0.0015, '#5a4a30');
    for (const sd of [-1, 1]) nb.blob(hx + Math.cos(a + 1.57) * sd * 0.006, hy - 0.008, hz + Math.sin(a + 1.57) * sd * 0.006, 0.0075, 0.011, 0.0075, '#3f4a24', a);
  } else {
    for (let k = 0; k < 3; k++) { const a = seed + k * 2.1; tk.seg([top[0], top[1] - 0.005, top[2]], [top[0] + Math.cos(a) * 0.03, top[1] - 0.06, top[2] + Math.sin(a) * 0.03], 0.0045, '#7a5a3a'); }
  }
}
const cocodemer: Builder = gp => {
  const sz = (x: number) => 0.18 + 0.08 * Math.sin(x * 5 + 1);
  const hf: HFn = (x, z) => {
    const w = z - sz(x);
    if (w > 0 && w < 0.07 && x < 0.15) return -0.007;
    return 0.008 + 0.015 * fbm(x * 6, 0, z * 6) + 0.05 * sstep(0.1, -0.45, z);
  };
  island(gp, 0.5, hf, '#5a4a32', (x, y, z) => {
    if (y < Y0) return calm('#2a4038')(x, y, z, 0, 1, 0);
    const h = speck(x, z, 110, 9), n = fbm(x * 12, y * 20, z * 12);
    return h > 0.85 ? '#8a6a3a' : h < 0.1 ? '#3f5a28' : n > 0.6 ? '#6b5638' : n < 0.38 ? '#4a3c2a' : null;
  }, { rings: 40, segs: 96, side: strataSide(['#8a5a3a', '#7a4a30', '#9a6a44']) });
  const tk = new Batch(CYL6(), 0.1), fn = new Batch(FAN(), 0.14), nb = new Batch(ICO1(), 0.08), rk = new Batch(ICO1(), 0.14);
  fanPalm(gp, tk, fn, nb, -0.04, Y0 + hf(-0.04, -0.02), -0.02, 0.4, 1, true);
  fanPalm(gp, tk, fn, nb, 0.2, Y0 + hf(0.2, -0.2), -0.2, 0.34, 2, false);
  fanPalm(gp, tk, fn, nb, -0.25, Y0 + hf(-0.25, -0.22), -0.22, 0.3, 3, true);
  fanPalm(gp, tk, fn, nb, 0.3, Y0 + hf(0.3, 0.06), 0.06, 0.22, 4, true);
  fanPalm(gp, tk, fn, nb, -0.34, Y0 + hf(-0.34, 0.04), 0.04, 0.17, 5, false);
  // Juvenile palms: fans springing straight from the forest floor
  for (const [x, z, k] of [[0.08, 0.1, 3], [-0.16, 0.08, 4], [0.36, -0.12, 3], [0.0, -0.3, 4], [0.24, 0.28, 3]]) {
    const y = Y0 + hf(x, z);
    for (let j = 0; j < k; j++) {
      const a = j * 2.3 + x * 10, e: V3 = [x + Math.cos(a) * 0.02, y + 0.05, z + Math.sin(a) * 0.02];
      tk.seg([x, y, z], e, 0.0018, '#6b7a3a');
      fn.blob(e[0], e[1], e[2], 0.05, 0.05, 0.05, j % 2 ? '#4a8a3a' : '#3f7a32', -a, 0.2, 0.9, j);
    }
  }
  // Granite boulders, the giant fallen double nut and a black parrot
  for (const [x, z, s, c] of [[-0.3, 0.32, 0.07, '#a89a90'], [0.36, 0.22, 0.05, '#9a8f88'], [0.4, -0.25, 0.08, '#a09088'], [-0.42, -0.12, 0.06, '#9a8f88']] as [number, number, number, string][]) {
    rk.blob(x, Y0 + hf(x, z) + s * 0.25, z, s, s * 0.65, s * 0.85, c, x * 5);
    rk.blob(x + s * 0.5, Y0 + hf(x, z) + s * 0.1, z + s * 0.3, s * 0.5, s * 0.4, s * 0.45, shade(c, 0.92), x * 7);
  }
  const nx = 0.13, nz = 0.3, ny = Y0 + hf(nx, nz);
  for (const sd of [-1, 1]) nb.blob(nx + sd * 0.021, ny + 0.022, nz, 0.025, 0.022, 0.03, '#5a3a24', sd * 0.15);
  nb.blob(nx, ny + 0.016, nz + 0.018, 0.01, 0.01, 0.01, '#4a2e1c');
  const bx = 0.36, bz = 0.22, by = Y0 + hf(bx, bz) + 0.045;
  nb.blob(bx, by + 0.008, bz, 0.006, 0.008, 0.007, '#2f2a26', 0.5, 0.3);
  nb.blob(bx + 0.002, by + 0.016, bz + 0.004, 0.0045, 0.0045, 0.0045, '#3a332e');
  nb.blob(bx + 0.003, by + 0.015, bz + 0.009, 0.002, 0.002, 0.003, '#c8b8a0');
  tk.seg([bx - 0.002, by + 0.004, bz - 0.006], [bx - 0.006, by - 0.008, bz - 0.016], 0.0025, '#2f2a26');
  tk.flush(gp); fn.flush(gp); nb.flush(gp, false); rk.flush(gp, false);
  person(gp, 0.06, ny, 0.31, '#16a34a', 1.3, 0.6, { hat: '#e8dcc0' });
  const fb = new Batch(OCT(), 0.2);
  for (let i = 0; i < 14; i++) {
    const a = Math.PI * (1.0 + (i / 13) * 1.0), d = 0.38 + hash3(i, 8, 1) * 0.08, x = Math.cos(a) * d, z = Math.sin(a) * d;
    for (let k = 0; k < 5; k++) frond(fb, [x, Y0 + hf(x, z), z], (k / 5) * TAU + i, 0.8, 0.05, 0.012, k % 2 ? '#3f7a32' : '#4f8a3a', 6);
  }
  fb.flush(gp, false);
};

// =========================================================================================================
// Rainbow eucalyptus — tall trunks streaked green, blue, purple, orange and maroon, above a lush Mindanao understory
function rainbowTree(gp: THREE.Object3D, cr: Batch, br: Batch, x: number, y: number, z: number, H: number, R: number, seed: number): void {
  const PAL = ['#6cc04a', '#2fa08a', '#4a86d0', '#9a5ac0', '#f0902b', '#c0502a', '#e0d050', '#8a3a5a'];
  const sw = [(hash3(seed, 1, 1) - 0.5) * 0.03, (hash3(seed, 1, 2) - 0.5) * 0.03];
  const pts: V3[] = [[x, y - 0.006, z], [x + sw[0] * 0.3, y + H * 0.3, z + sw[1] * 0.3], [x - sw[0] * 0.2, y + H * 0.65, z - sw[1] * 0.2], [x + sw[0], y + H, z + sw[1]]];
  rtube(gp, pts, [R * 1.35, R, R * 0.85, R * 0.6], '#5aa04a', {
    radial: 16, sub: 7, fr: (a, t) => 1 + 0.25 * Math.max(0, 1 - t / 0.08) * Math.max(0, Math.cos(4 * a)),
    paint: (px, py, pz) => {
      const ang = Math.atan2(pz - z, px - x), n = fbm(Math.cos(ang) * 2.2 + seed, py * 5, Math.sin(ang) * 2.2 + seed * 3, 3);
      return PAL[Math.abs(Math.floor(n * 14 + hash3(Math.floor(ang * 6), seed, 0) * 2)) % PAL.length];
    },
  });
  const top = pts[3];
  for (let k = 0; k < 5; k++) {
    const a = k * 1.3 + seed, L = 0.06 + hash3(seed, k, 2) * 0.04, s: V3 = [x + sw[0] * 0.8, y + H * (0.78 + k * 0.05), z + sw[1] * 0.8];
    const e: V3 = [s[0] + Math.cos(a) * L, s[1] + L * 0.7, s[2] + Math.sin(a) * L];
    br.seg(s, e, R * 0.28, k % 2 ? '#7a6a9a' : '#5a8a5a');
    clumps(cr, e[0], e[1] + 0.008, e[2], 5, 0.045, 0.028, ['#5f8f42', '#72a04e', '#4f7a3a', '#86b45a'], seed * 10 + k, 0.5);
  }
  clumps(cr, top[0], top[1] + 0.015, top[2], 6, 0.05, 0.03, ['#5f8f42', '#72a04e', '#4f7a3a', '#86b45a'], seed * 31, 0.5);
}
const rainbow: Builder = gp => {
  const path = (z: number) => 0.06 + 0.1 * Math.sin(z * 4 + 0.5);
  const hf: HFn = (x, z) => 0.008 + 0.018 * fbm(x * 6, 0, z * 6) + 0.03 * sstep(0.0, -0.45, z) - (Math.abs(x - path(z)) < 0.03 ? 0.003 : 0);
  island(gp, 0.5, hf, '#3f6a2a', (x, y, z) => {
    const h = speck(x, z, 120, 10), n = fbm(x * 11, y * 20, z * 11);
    if (Math.abs(x - path(z)) < 0.035) return h > 0.7 ? '#9a5a3a' : '#b06a42';
    return h > 0.86 ? '#5a8a32' : h < 0.1 ? '#8a5a3a' : n > 0.6 ? '#4a7a30' : n < 0.38 ? '#33582a' : null;
  }, { rings: 40, segs: 96, side: strataSide(['#9a4a2a', '#8a3f24', '#a85a34']) });
  const cr = new Batch(ICO1(), 0.18), br = new Batch(CYL6(), 0.1), lf = new Batch(LEAF(), 0.16), fb = new Batch(OCT(), 0.2), hb = new Batch(ICO0(), 0.1);
  rainbowTree(gp, cr, br, -0.08, Y0 + hf(-0.08, -0.02), -0.02, 0.42, 0.034, 1);
  rainbowTree(gp, cr, br, 0.24, Y0 + hf(0.24, -0.16), -0.16, 0.38, 0.024, 2);
  rainbowTree(gp, cr, br, -0.3, Y0 + hf(-0.3, -0.2), -0.2, 0.36, 0.022, 3);
  rainbowTree(gp, cr, br, 0.05, Y0 + hf(0.05, -0.34), -0.34, 0.33, 0.02, 4);
  // Bananas, heliconia "lobster claws", ferns and ginger along the clay path
  for (const [x, z, k] of [[-0.3, 0.12, 6], [0.3, 0.12, 5], [-0.4, -0.04, 5]]) {
    const y = Y0 + hf(x, z);
    br.seg([x, y, z], [x, y + 0.06, z], 0.007, '#7a8a4a');
    for (let j = 0; j < k; j++) {
      const a = (j / k) * TAU + x * 7, L = 0.045;
      lf.blob(x + Math.cos(a) * L * 0.8, y + 0.07 - 0.005 * (j % 2), z + Math.sin(a) * L * 0.8, L, 0.003, 0.016, j % 2 ? '#5aa03a' : '#6bb444', -a, 0, -0.35);
    }
  }
  for (const [x, z] of [[0.18, 0.2], [-0.2, 0.28], [0.36, -0.02], [-0.16, 0.06]]) {
    const y = Y0 + hf(x, z);
    for (let j = 0; j < 4; j++) {
      const a = j * 1.6 + x * 10, top: V3 = [x + Math.cos(a) * 0.012, y + 0.05 + (j % 2) * 0.01, z + Math.sin(a) * 0.012];
      br.seg([x, y, z], top, 0.0018, '#4a7a30');
      lf.blob(top[0] + Math.cos(a) * 0.01, top[1] - 0.012, top[2] + Math.sin(a) * 0.01, 0.022, 0.003, 0.008, '#3f8a3a', -a, 0, -0.6);
      for (let b = 0; b < 4; b++) hb.blob(top[0] + (b % 2 ? 0.004 : -0.004), top[1] - b * 0.007, top[2], 0.0035, 0.002, 0.007, b % 2 ? '#e0302a' : '#d4202a', a, 0.3);
      hb.blob(top[0], top[1] - 0.03, top[2], 0.003, 0.004, 0.003, '#f2c018');
    }
  }
  for (let i = 0; i < 15; i++) {
    const a = hash3(i, 41, 1) * TAU, d = 0.2 + Math.sqrt(hash3(i, 41, 2)) * 0.27, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.abs(x - path(z)) < 0.06) continue;
    for (let k = 0; k < 5; k++) frond(fb, [x, Y0 + hf(x, z), z], (k / 5) * TAU + i, 0.8, 0.045, 0.011, k % 2 ? '#3f7a32' : '#55903f', 5);
  }
  for (let i = 0; i < 16; i++) {
    const a = Math.PI * (1.0 + (i / 15) * 1.0), d = 0.4 + hash3(i, 42, 1) * 0.06, x = Math.cos(a) * d, z = Math.sin(a) * d;
    clumps(cr, x, Y0 + hf(x, z) + 0.04 + hash3(i, 42, 2) * 0.04, z, 4, 0.04, 0.045, ['#2f6a35', '#3f7a3a', '#2a5a30', '#4a8a40'], i + 500, 0.75);
  }
  cr.flush(gp); br.flush(gp); lf.flush(gp, false); fb.flush(gp, false); hb.flush(gp);
  person(gp, path(0.12) - 0.01, Y0 + hf(path(0.12), 0.12), 0.12, '#f59e0b', 1.35, 3.0, { pants: '#1e3a8a' });
  person(gp, path(0.3) + 0.01, Y0 + hf(path(0.3), 0.3), 0.3, '#ec4899', 1.0, 3.3, { pants: '#334155' });
};

// =========================================================================================================
// Venus flytrap — macro view of a rosette in a Carolina bog: toothed red traps (one snapped shut), pitcher plants, a ladybird
const LOBE = (part: 'in' | 'rim' | 'out') => tpl('pl:lobe-' + part, () => {
  const NA = 12, NB = part === 'rim' ? 1 : 5, TM = 1.0, pos: number[] = [];
  const b0 = part === 'rim' ? 0.82 : 0, b1 = part === 'in' ? 0.82 : 1;
  const P = (a: number, b: number): number[] => {
    const x = 2 * a - 1, hw = 0.85 * Math.pow(Math.max(0, 1 - x * x), 0.6), th = b * TM;
    return [x, (hw * (1 - Math.cos(th))) / Math.sin(TM), (hw * Math.sin(th)) / Math.sin(TM)];
  };
  for (let i = 0; i < NA; i++) for (let j = 0; j < NB; j++) {
    const ba = b0 + ((b1 - b0) * j) / NB, bb = b0 + ((b1 - b0) * (j + 1)) / NB;
    const p00 = P(i / NA, ba), p10 = P((i + 1) / NA, ba), p01 = P(i / NA, bb), p11 = P((i + 1) / NA, bb);
    const tris = part === 'out' ? [[p00, p10, p01], [p10, p11, p01]] : [[p00, p01, p10], [p10, p01, p11]];
    for (const t of tris) for (const v of t) pos.push(...v);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return geo;
});
function trap(lobes: { in: Batch; rim: Batch; out: Batch }, teeth: Batch, base: V3, ang: number, tilt: number, open: number, s: number): V3 {
  const _r = new THREE.Matrix4(), cil = new THREE.Vector3(), cil2 = new THREE.Vector3();
  for (const sd of [1, -1]) {
    const m = new THREE.Matrix4().makeTranslation(base[0], base[1], base[2])
      .multiply(_r.makeRotationY(-ang)).multiply(new THREE.Matrix4().makeRotationZ(tilt))
      .multiply(new THREE.Matrix4().makeTranslation(s, 0, 0))
      .multiply(new THREE.Matrix4().makeRotationX(-sd * open)).multiply(new THREE.Matrix4().makeScale(s, s, sd * s));
    lobes.in.put(m, '#c8202a'); lobes.rim.put(m, '#b8c84a'); lobes.out.put(m, '#7aa83a');
    for (let i = 1; i < 16; i++) {
      const x = -1 + (i / 16) * 2, hw = 0.85 * Math.pow(Math.max(0, 1 - x * x), 0.6);
      cil.set(x, (hw * (1 - Math.cos(1))) / Math.sin(1), hw).applyMatrix4(m);
      cil2.set(x * 1.05, (hw * (1 - Math.cos(1))) / Math.sin(1) + 0.42 * Math.sin(1.1), hw + 0.42 * Math.cos(1.1)).applyMatrix4(m);
      teeth.seg([cil.x, cil.y, cil.z], [cil2.x, cil2.y, cil2.z], 0.022 * s, '#c8d86a');
    }
  }
  return [base[0] + Math.cos(ang) * s * 2 * Math.cos(tilt), base[1] + s * 2 * Math.sin(tilt), base[2] + Math.sin(ang) * s * 2 * Math.cos(tilt)];
}
const flytrap: Builder = gp => {
  const hf: HFn = (x, z) => 0.01 + 0.012 * fbm(x * 9, 0, z * 9) + 0.02 * sstep(0.1, -0.45, z) * fbm(x * 4, 2, z * 4);
  island(gp, 0.5, hf, '#7a9a3a', (x, y, z) => {
    const h = speck(x, z, 150, 12), n = fbm(x * 14, y * 20, z * 14);
    if (n > 0.66) return h > 0.5 ? '#b0603a' : '#9a4a30';
    return h > 0.86 ? '#c8d070' : h < 0.1 ? '#4a6a2a' : n > 0.55 ? '#8aa83a' : n < 0.36 ? '#6b8a30' : null;
  }, { rings: 40, segs: 96, side: strataSide(['#3a2a20', '#4a3628', '#2f241c', '#5a4430']) });
  const lobes = { in: new Batch(LOBE('in'), 0.1), rim: new Batch(LOBE('rim'), 0.08), out: new Batch(LOBE('out'), 0.1) };
  const teeth = new Batch(CONE6(), 0.08), lf = new Batch(LEAF(), 0.1), ms = new Batch(ICO0(), 0.22), bug = new Batch(ICO1(), 0.05);
  const mids: V3[] = [], pets: V3[] = [];
  const rosette = (cx: number, cz: number, n: number, s: number, seed: number, closed: number) => {
    const cy = Y0 + hf(cx, cz) + 0.002;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + seed, pl = s * 1.6, el = 0.18;
      const b: V3 = [cx + Math.cos(a) * pl * Math.cos(el), cy + pl * Math.sin(el), cz + Math.sin(a) * pl * Math.cos(el)];
      lf.blob(cx + Math.cos(a) * pl * 0.52, cy + pl * Math.sin(el) * 0.5, cz + Math.sin(a) * pl * 0.52, pl * 0.52, s * 0.04, s * 0.32, k % 2 ? '#7aa83a' : '#8ab84a', -a, 0, el);
      trap(lobes, teeth, b, a, 0.3, k === closed ? 1.07 : 0.15 + hash3(seed, k, 1) * 0.15, s);
      mids.push([b[0] + Math.cos(a) * s * Math.cos(0.3), b[1] + s * Math.sin(0.3), b[2] + Math.sin(a) * s * Math.cos(0.3)]);
      pets.push([cx + Math.cos(a) * pl * 0.55, cy + pl * Math.sin(el) * 0.55, cz + Math.sin(a) * pl * 0.55]);
    }
    return cy;
  };
  const cy = rosette(0.0, 0.04, 8, 0.062, 0.3, 2);
  rosette(-0.33, -0.06, 6, 0.032, 1.7, -1);
  rosette(0.31, 0.22, 5, 0.028, 2.9, 1);
  // Fly in the closed trap (wings poking out), another fly landing on an open one, a ladybird on a petiole
  const ca = (2 / 8) * TAU + 0.3, [cpx, cpy, cpz] = mids[2];
  for (const sd of [-1, 1]) bug.blob(cpx + Math.cos(ca + 1.57) * sd * 0.006, cpy + 0.05, cpz + Math.sin(ca + 1.57) * sd * 0.006, 0.012, 0.0015, 0.005, '#c8d4dc', -ca, 0, sd * 0.6);
  const fa = (5 / 8) * TAU + 0.3, [fx0, fy0, fz0] = mids[5], fx = fx0 + Math.cos(fa) * 0.02, fz = fz0 + Math.sin(fa) * 0.02, fy = fy0 + 0.035;
  bug.blob(fx, fy, fz, 0.007, 0.006, 0.011, '#2a2e2a', -fa);
  bug.blob(fx + Math.cos(fa) * 0.011, fy + 0.001, fz + Math.sin(fa) * 0.011, 0.005, 0.005, 0.005, '#8a2a1a');
  for (const sd of [-1, 1]) bug.blob(fx + Math.cos(fa + 1.57) * sd * 0.01, fy + 0.005, fz + Math.sin(fa + 1.57) * sd * 0.01, 0.011, 0.0015, 0.006, '#c8d4dc', -fa, 0, sd * 0.3);
  const la = (7 / 8) * TAU + 0.3, [lx, ly0, lz] = pets[7], ly = ly0 + 0.008;
  bug.blob(lx, ly, lz, 0.011, 0.008, 0.013, '#d4202a', -la);
  bug.blob(lx + Math.cos(la) * 0.012, ly - 0.001, lz + Math.sin(la) * 0.012, 0.006, 0.005, 0.005, '#111111');
  for (const [ox, oz] of [[0.005, 0.004], [-0.005, 0.004], [0.005, -0.005], [-0.005, -0.005], [0, 0.0]]) bug.blob(lx + ox, ly + 0.007, lz + oz, 0.0026, 0.0014, 0.0026, '#111111');
  // Tall flower stalk with white blossoms
  const sx = 0.012, sz2 = 0.03;
  teeth.seg([sx, cy, sz2], [sx + 0.01, cy + 0.3, sz2 - 0.01], 0.003, '#6b9a3a');
  for (let k = 0; k < 4; k++) {
    const a = k * 1.7, fx2 = sx + 0.01 + Math.cos(a) * 0.022, fz2 = sz2 - 0.01 + Math.sin(a) * 0.022, fy2 = cy + 0.3 + (k % 2) * 0.012;
    teeth.seg([sx + 0.01, cy + 0.295, sz2 - 0.01], [fx2, fy2, fz2], 0.0015, '#6b9a3a');
    for (let p = 0; p < 5; p++) { const pa = (p / 5) * TAU; bug.blob(fx2 + Math.cos(pa) * 0.008, fy2 + 0.003, fz2 + Math.sin(pa) * 0.008, 0.008, 0.002, 0.005, '#fbfaf5', -pa); }
    bug.blob(fx2, fy2 + 0.005, fz2, 0.004, 0.003, 0.004, '#9ab84a');
  }
  // Yellow pitcher plants (Sarracenia) with red throats and hoods at the back
  for (const [px, pz, h, a] of [[-0.12, -0.3, 0.26, 0.1], [-0.05, -0.36, 0.3, -0.2], [0.04, -0.31, 0.24, 0.3], [0.13, -0.36, 0.28, 0.0], [0.2, -0.28, 0.2, 0.4], [-0.2, -0.25, 0.2, -0.3]]) {
    const py = Y0 + hf(px, pz) - 0.003, R = 0.022 * h / 0.28;
    plathe(gp, [[0.001, 0], [R * 0.3, 0.004], [R * 0.4, h * 0.25], [R * 0.6, h * 0.6], [R, h * 0.97], [R * 0.86, h], [R * 0.5, h * 0.8], [0.001, h * 0.6]], '#b8c84a',
      (qx, qy, qz) => { const an = Math.atan2(qz - pz, qx - px); return qy - py > h * 0.7 && Math.sin(an * 18) > 0.6 ? '#a0302a' : qy - py > h * 0.85 ? '#d8d060' : qy - py < h * 0.2 ? '#8aa040' : null; }, px, py, pz, 14);
    ellip(gp, '#b8c84a', px + Math.sin(a) * R * 0.3, py + h + R * 0.55, pz - R * 0.85, R * 0.85, R * 0.1, R * 1.1, a, 1.25);
  }
  // Sphagnum hummocks, wiregrass and pine needles
  for (let i = 0; i < 120; i++) {
    const a = hash3(i, 51, 1) * TAU, d = Math.sqrt(hash3(i, 51, 2)) * 0.47, x = Math.cos(a) * d, z = Math.sin(a) * d, s = 0.006 + hash3(i, 51, 3) * 0.01;
    ms.blob(x, Y0 + hf(x, z) + s * 0.2, z, s, s * 0.6, s, i % 4 ? (i % 3 ? '#8ab03a' : '#9aba4a') : '#b0603a', a);
  }
  for (let i = 0; i < 70; i++) {
    const a = hash3(i, 52, 1) * TAU, d = 0.18 + Math.sqrt(hash3(i, 52, 2)) * 0.3, x = Math.cos(a) * d, z = Math.sin(a) * d, y = Y0 + hf(x, z);
    teeth.seg([x, y, z], [x + (hash3(i, 52, 3) - 0.5) * 0.04, y + 0.05 + hash3(i, 52, 4) * 0.05, z + (hash3(i, 52, 5) - 0.5) * 0.04], 0.0016, i % 3 ? '#9aa850' : '#b8b060');
  }
  lobes.in.flush(gp, false); lobes.rim.flush(gp, false); lobes.out.flush(gp, false); teeth.flush(gp, false); lf.flush(gp, false); ms.flush(gp); bug.flush(gp, false);
};

export const H_PLANTS: Record<string, Builder> = {
  pl_sherman: sherman,
  pl_kapok: kapok,
  pl_dragonblood: dragonblood,
  pl_rafflesia: rafflesia,
  pl_victoria: victoria,
  pl_welwitschia: welwitschia,
  pl_saguaro: saguaro,
  pl_tulips: tulips,
  pl_bamboo: bamboo,
  pl_pando: pando,
  pl_cocodemer: cocodemer,
  pl_rainbow: rainbow,
  pl_flytrap: flytrap,
};
