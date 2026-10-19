import * as THREE from 'three';
import { type Builder, type Paint, g, add, mat, lathe, prism, paintFaces, fbm, vnoise, hash3, worley } from '../prims.ts';
import { type HFn, sstep } from '../nature.ts';
import { mergeVertices as mergeV } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Hero builders for: grandcanyon, niagara, victoriafalls, iguazu, reef.
// Keyed by catalogue item key (recipe.hero). Front faces +z, base at y=0, footprint radius ≈0.5.

// ---- local helpers ----------------------------------------------------------------------------------------
type P2 = [number, number];
const Y0 = 0.035;
const grp = (p: THREE.Object3D, x: number, y: number, z: number, ry = 0) => {
  const q = new THREE.Group(); q.position.set(x, y, z); q.rotation.y = ry; p.add(q); return q;
};

/** Translucent material that is never baked; depthWrite off by default so mist never punches holes. */
const tmats = new Map<string, THREE.Material>();
function tmat(opacity: number, o: { color?: string; vc?: boolean; basic?: boolean; double?: boolean; dw?: boolean; rough?: number } = {}): THREE.Material {
  const k = JSON.stringify([opacity, o]);
  let m = tmats.get(k);
  if (!m) {
    const p = { color: o.color ?? '#ffffff', vertexColors: !!o.vc, transparent: true, opacity, depthWrite: o.dw ?? false, side: o.double ? THREE.DoubleSide : THREE.FrontSide };
    m = o.basic ? new THREE.MeshBasicMaterial(p) : new THREE.MeshStandardMaterial({ ...p, roughness: o.rough ?? 0.35, metalness: 0.02 });
    tmats.set(k, m);
  }
  return m;
}

// Shared unit geometries for instanced-merge parts
const SPH = () => g('wt:sph', () => new THREE.SphereGeometry(1, 8, 6));
const SPH2 = () => g('wt:sph2', () => new THREE.SphereGeometry(1, 12, 8));
const SPHL = () => g('wt:sphl', () => new THREE.SphereGeometry(1, 6, 4));
const ICO = () => g('wt:ico', () => { const q = new THREE.IcosahedronGeometry(1, 0); q.deleteAttribute('uv'); q.deleteAttribute('normal'); return mergeV(q); });
const MIST = () => g('wt:mist', () => new THREE.SphereGeometry(1, 7, 5));
const CON = () => g('wt:con', () => new THREE.ConeGeometry(1, 1, 7));
const CYL = () => g('wt:cyl', () => new THREE.CylinderGeometry(1, 1, 1, 6));
const BOXG = () => g('wt:box', () => new THREE.BoxGeometry(1, 1, 1));

const colMemo = new Map<string, THREE.Color>();
/** Parsed colour cache (hex strings from paints are heavily repeated; Color.set parsing is otherwise a hotspot). */
const C = (hex: string): THREE.Color => {
  let c = colMemo.get(hex);
  if (!c) { c = new THREE.Color(hex); colMemo.set(hex, c); }
  return c;
};
/** Memoised colour mix / shade on hex strings (t quantised to 1/40 so the cache stays small). */
const mixMemo = new Map<string, string>();
const mx = (a: string, b: string, t: number): string => {
  const q = Math.round(Math.min(1, Math.max(0, t)) * 40), k = a + b + q;
  let r = mixMemo.get(k);
  if (!r) { r = '#' + C(a).clone().lerp(C(b), q / 40).getHexString(); mixMemo.set(k, r); }
  return r;
};
const sh = (a: string, f: number): string => {
  const q = Math.round(f * 40), k = a + '*' + q;
  let r = mixMemo.get(k);
  if (!r) { r = '#' + C(a).clone().multiplyScalar(q / 40).getHexString(); mixMemo.set(k, r); }
  return r;
};
/** `yo`: apply the rotation in YXZ order (local pitch/roll first, then yaw) instead of the default XYZ. */
interface Item { p: [number, number, number]; s: [number, number, number]; c: string; r?: [number, number, number]; yo?: boolean }
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _col = new THREE.Color();
/**
 * Merges transformed copies of a unit geometry into ONE vertex-coloured mesh (trees, rocks, foam, mist, fish, posts).
 * `jit` jitters vertices radially (position-hashed so seams stay closed) for lumpy rocks and puffs.
 */
function inst(p: THREE.Object3D, base: THREE.BufferGeometry, items: Item[], o: { flat?: boolean; opacity?: number; jit?: number; dw?: boolean; rough?: number; basic?: boolean } = {}): THREE.Mesh | null {
  if (!items.length) return null;
  const bp = base.getAttribute('position'), bi = base.getIndex()!, bc = base.getAttribute('color');
  const nv = bp.count, ni = bi.count;
  const pos = new Float32Array(nv * items.length * 3), col = new Float32Array(nv * items.length * 3), idx = new Uint32Array(ni * items.length);
  items.forEach((it, k) => {
    _col.copy(C(it.c));
    const r = it.r ?? [0, 0, 0];
    _m4.compose(_v.set(...it.p), _q.setFromEuler(_e.set(r[0], r[1], r[2], it.yo ? 'YXZ' : 'XYZ')), _s.set(...it.s));
    const e = _m4.elements;
    for (let i = 0; i < nv; i++) {
      let x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i);
      if (o.jit) { const j = 1 + o.jit * (hash3(Math.round(x * 40) + k * 7.1, Math.round(y * 40), Math.round(z * 40)) - 0.5); x *= j; y *= j; z *= j; }
      const t = (k * nv + i) * 3;
      pos[t] = e[0] * x + e[4] * y + e[8] * z + e[12];
      pos[t + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
      pos[t + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
      if (bc) { col[t] = _col.r * bc.getX(i); col[t + 1] = _col.g * bc.getY(i); col[t + 2] = _col.b * bc.getZ(i); }
      else { col[t] = _col.r; col[t + 1] = _col.g; col[t + 2] = _col.b; }
    }
    for (let i = 0; i < ni; i++) idx[k * ni + i] = bi.getX(i) + k * nv;
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  const m = o.opacity !== undefined ? tmat(o.opacity, { vc: true, dw: o.dw, rough: o.rough, basic: o.basic }) : mat('#ffffff', { vc: true, flat: o.flat ?? false, rough: o.rough });
  return add(p, geo, m, 0, 0, 0, 1, 1, 1);
}

/** Catmull-Rom path through 2D control points, resampled to n+1 evenly spaced points. */
function path(ctrl: P2[], n: number): P2[] {
  if (ctrl.length === 2) return Array.from({ length: n + 1 }, (_, i) => [ctrl[0][0] + (ctrl[1][0] - ctrl[0][0]) * (i / n), ctrl[0][1] + (ctrl[1][1] - ctrl[0][1]) * (i / n)] as P2);
  const c = new THREE.CatmullRomCurve3(ctrl.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  return c.getSpacedPoints(n).map(v => [v.x, v.z] as P2);
}
/** Signed distance to a closed polygon (negative inside), tabulated on a grid and bilinearly sampled. */
const sdfMemo = new Map<string, (x: number, z: number) => number>();
function sdf(poly: P2[], N = 100, R = 0.52): (x: number, z: number) => number {
  const key = N + ':' + poly.map(q => q[0].toFixed(4) + ',' + q[1].toFixed(4)).join(';');
  const hit = sdfMemo.get(key);
  if (hit) return hit;
  const raw = (px: number, pz: number) => {
    let d = 1e9, inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [ax, az] = poly[j], [bx, bz] = poly[i];
      const ex = bx - ax, ez = bz - az, l = ex * ex + ez * ez || 1e-9;
      const t = Math.max(0, Math.min(1, ((px - ax) * ex + (pz - az) * ez) / l));
      const dx = px - ax - ex * t, dz = pz - az - ez * t;
      d = Math.min(d, dx * dx + dz * dz);
      if ((az > pz) !== (bz > pz) && px < ((bx - ax) * (pz - az)) / (bz - az) + ax) inside = !inside;
    }
    return inside ? -Math.sqrt(d) : Math.sqrt(d);
  };
  const tab = new Float32Array((N + 1) * (N + 1)), h = (2 * R) / N;
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) tab[j * (N + 1) + i] = raw(-R + i * h, -R + j * h);
  const fn = (x: number, z: number) => {
    const fx = Math.min(N - 1e-6, Math.max(0, (x + R) / h)), fz = Math.min(N - 1e-6, Math.max(0, (z + R) / h));
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = j * (N + 1) + i;
    return (tab[k] * (1 - u) + tab[k + 1] * u) * (1 - v) + (tab[k + N + 1] * (1 - u) + tab[k + N + 2] * u) * v;
  };
  sdfMemo.set(key, fn);
  return fn;
}

/**
 * Displaced terrain disc with a vertical cross-section skirt. The top is a square grid squeezed onto the disc
 * (elliptical grid mapping) so cliffs get even resolution everywhere; unlike nature.ts `island`, the skirt is cut
 * into horizontal bands at `bands` (absolute y) so geological strata read crisply in the diorama cut.
 */
function ground(gp: THREE.Object3D, h: HFn, base: string, paint: Paint, side: (y: number, x: number, z: number) => string,
  o: { n?: number; bands?: number[]; smooth?: boolean } = {}): void {
  const R = 0.5, N = o.n ?? 96;
  const pos: number[] = [];
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
    const u = -1 + (2 * i) / N, v = -1 + (2 * j) / N;
    const x = R * u * Math.sqrt(1 - (v * v) / 2), z = R * v * Math.sqrt(1 - (u * u) / 2);
    pos.push(x, Y0 + h(x, z), z);
  }
  const vi = (i: number, j: number) => j * (N + 1) + i;
  const idx: number[] = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const a = vi(i, j), b = vi(i + 1, j), c = vi(i, j + 1), d = vi(i + 1, j + 1);
    // Alternate the diagonal by quadrant so the mesh is symmetric (avoids a global sawtooth bias)
    if ((i < N / 2) === (j < N / 2)) idx.push(a, c, b, b, c, d); else idx.push(a, c, d, a, d, b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  if (o.smooth) {
    // Per-vertex colours: strata blend softly across cliff triangles instead of sawtoothing face by face
    const nor = geo.getAttribute('normal'), col = new Float32Array(pos.length), c = new THREE.Color();
    for (let k = 0; k < pos.length / 3; k++) {
      c.copy(C(paint(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2], nor.getX(k), nor.getY(k), nor.getZ(k)) ?? base));
      col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    add(gp, geo, mat('#ffffff', { flat: false, vc: true, rough: 0.85 }), 0, 0, 0, 1, 1, 1);
  } else add(gp, paintFaces(geo, base, paint), mat('#ffffff', { flat: false, vc: true, rough: 0.85 }), 0, 0, 0, 1, 1, 1);
  const rimIdx: number[] = [];
  for (let i = 0; i < N; i++) rimIdx.push(vi(i, 0));
  for (let j = 0; j < N; j++) rimIdx.push(vi(N, j));
  for (let i = N; i > 0; i--) rimIdx.push(vi(i, N));
  for (let j = N; j > 0; j--) rimIdx.push(vi(0, j));
  const segs = rimIdx.length;

  // Banded skirt: each column quad is clipped against the band planes so strata stay horizontal at cliffs
  const br = [0, ...(o.bands ?? Array.from({ length: 12 }, (_, i) => 0.012 + i * 0.03)).filter(b => b > 0).sort((a, b) => a - b), 9];
  const sp: number[] = [], sc: number[] = [];
  const c3 = new THREE.Color();
  const clip = (poly: P2[], yv: number, keepAbove: boolean): P2[] => {
    const out: P2[] = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const ia = keepAbove ? a[1] >= yv : a[1] <= yv, ib = keepAbove ? b[1] >= yv : b[1] <= yv;
      if (ia) out.push(a);
      if (ia !== ib) { const t = (yv - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, yv]); }
    }
    return out;
  };
  for (let j = 0; j < segs; j++) {
    const ka = rimIdx[j] * 3, kb = rimIdx[(j + 1) % segs] * 3;
    const ax = pos[ka], ay = pos[ka + 1], az = pos[ka + 2], bx = pos[kb], by = pos[kb + 1], bz = pos[kb + 2];
    const top = Math.max(ay, by);
    const quad: P2[] = [[0, 0], [1, 0], [1, by], [0, ay]];
    for (let k = 0; k < br.length - 1 && br[k] < top; k++) {
      const pl = clip(clip(quad, br[k], true), br[k + 1], false);
      if (pl.length < 3) continue;
      const ym = (br[k] + Math.min(br[k + 1], top)) / 2;
      c3.copy(C(side(ym, (ax + bx) / 2, (az + bz) / 2)));
      const P = (q: P2) => sp.push(ax + (bx - ax) * q[0], q[1], az + (bz - az) * q[0]);
      for (let t = 1; t < pl.length - 1; t++) {
        P(pl[0]); P(pl[t + 1]); P(pl[t]);
        for (let m = 0; m < 3; m++) sc.push(c3.r, c3.g, c3.b);
      }
    }
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
  sg.computeVertexNormals();
  add(gp, sg, mat('#ffffff', { flat: true, vc: true, rough: 0.9 }), 0, 0, 0, 1, 1, 1);
}

/** Smooth water tint with low-frequency variation and thin flowing highlight lines (no per-triangle speckle). */
const wcol = (c: string, x: number, z: number, k = 1, dir = 0.6, amp = 0.2): string => {
  const n = fbm(x * 7 * k, 3.1, z * 7 * k, 2);
  const l = sstep(0.75, 1, Math.sin((x * dir + z) * 45 * k + n * 9));
  return mx(sh(c, 0.9 + 0.2 * n), '#e8f7fb', l * amp);
};

/** Tiny standing figures (merged) for scale. */
function people(list: [number, number, number][], seed: number, cols = ['#dc2626', '#2563eb', '#f8fafc', '#f59e0b', '#16a34a', '#7c3aed']): Item[] {
  const out: Item[] = [];
  list.forEach(([x, y, z], i) => {
    const c = cols[Math.floor(hash3(i, seed, 1) * cols.length)];
    out.push({ p: [x, y + 0.006, z], s: [0.0035, 0.012, 0.0035], c });
  });
  return out;
}
function heads(list: [number, number, number][]): Item[] {
  return list.map(([x, y, z]) => ({ p: [x, y + 0.0145, z], s: [0.0032, 0.0032, 0.0032], c: '#e0b48a' }));
}

/** Conifer (ponderosa / pinyon) as merged parts: trunk + 3 stacked cones. */
function conifer(cones: Item[], trunks: Item[], x: number, y: number, z: number, s: number, c: string): void {
  trunks.push({ p: [x, y + s * 0.2, z], s: [s * 0.06, s * 0.4, s * 0.06], c: '#5b4030' });
  for (let k = 0; k < 3; k++) cones.push({ p: [x, y + s * (0.42 + k * 0.24), z], s: [s * (0.3 - k * 0.075), s * (0.42 - k * 0.06), s * (0.3 - k * 0.075)], c: sh(c, 1 + k * 0.08), r: [0, k, 0] });
}
/** Broadleaf canopy tree: trunk + 2–3 clustered puffs. */
function leafy(puffs: Item[], trunks: Item[], x: number, y: number, z: number, s: number, c: string, seed: number): void {
  trunks.push({ p: [x, y + s * 0.3, z], s: [s * 0.07, s * 0.6, s * 0.07], c: '#5a4030' });
  const n = 2 + Math.floor(hash3(seed, 1, 2) * 2);
  for (let k = 0; k < n; k++) {
    const a = hash3(seed, k, 3) * 6.28, d = k ? s * 0.22 : 0;
    puffs.push({ p: [x + Math.cos(a) * d, y + s * (0.72 + (k ? 0.04 : 0.1)), z + Math.sin(a) * d], s: [s * (0.38 - k * 0.05), s * (0.3 - k * 0.03), s * (0.38 - k * 0.05)], c: sh(c, 0.92 + hash3(seed, k, 4) * 0.22) });
  }
}

// ---- Falling water ------------------------------------------------------------------------------------------
interface FallOpts {
  lip: P2[];
  top: number;
  bot: number | ((x: number, z: number) => number);
  bow: number;
  /** Signed function, lower toward the plunge side (used to orient the curtain outward). */
  out: (x: number, z: number) => number;
  water: string;
  deep: string;
  seed: number;
  rows?: number;
  foam?: Item[];
  mist?: Item[];
  mistH?: number;
  white?: number;
  /** Mean spacing between white streak ribbons. */
  spacing?: number;
}
/**
 * Waterfall curtain along a lip polyline: a translucent tinted sheet (glassy at the lip, whitening as it falls)
 * plus a separate layer of white vertical streak ribbons in front of it, foam boulders at the base and mist puffs.
 */
function falls(p: THREE.Object3D, o: FallOpts): void {
  const lip = o.lip, n = lip.length, ny = o.rows ?? 9;
  const L: number[] = [0];
  for (let i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(lip[i][0] - lip[i - 1][0], lip[i][1] - lip[i - 1][1]));
  const nrm: P2[] = lip.map((pt, i) => {
    const a = lip[Math.max(0, i - 1)], b = lip[Math.min(n - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let nx = (b[1] - a[1]) / l, nz = -(b[0] - a[0]) / l;
    if (o.out(pt[0] + nx * 0.02, pt[1] + nz * 0.02) > o.out(pt[0] - nx * 0.02, pt[1] - nz * 0.02)) { nx = -nx; nz = -nz; }
    return [nx, nz];
  });
  const bot = (i: number) => (typeof o.bot === 'number' ? o.bot : o.bot(lip[i][0], lip[i][1]));
  const vs = Array.from({ length: ny + 1 }, (_, j) => (j / ny) ** 1.35);
  const P = (i: number, v: number, off: number): [number, number, number] => {
    const d = -0.004 + o.bow * Math.sqrt(v) * (1 - 0.3 * v) + off;
    const y = o.top + 0.003 - (o.top + 0.003 - bot(i)) * v;
    return [lip[i][0] + nrm[i][0] * d, y, lip[i][1] + nrm[i][1] * d];
  };
  const F = 70, wh = o.white ?? 0;
  const streak = (u: number, v: number, s: number) => vnoise(u * F, v * 2.2 + s, o.seed + s) * 0.7 + vnoise(u * F * 2.7, v * 4, o.seed + 9 + s) * 0.3;
  // Layer 1: translucent tinted sheet with smooth vertex colours
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  const cA = new THREE.Color(o.deep), cB = new THREE.Color(o.water), cW = new THREE.Color('#f2fbff'), cc = new THREE.Color();
  for (let i = 0; i < n; i++) for (let j = 0; j <= ny; j++) {
    const v = vs[j];
    pos.push(...P(i, v, 0));
    const s = streak(L[i], v, 0);
    cc.copy(cA).lerp(cB, sstep(0, 0.3, v)).lerp(cW, Math.min(1, sstep(0.45, 0.85, s * 0.7 + v * 0.55 + wh) * 0.9 + sstep(0.82, 1, v)));
    col.push(cc.r, cc.g, cc.b);
  }
  const V = (i: number, j: number) => i * (ny + 1) + j;
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < ny; j++) idx.push(V(i, j), V(i + 1, j), V(i, j + 1), V(i + 1, j), V(i + 1, j + 1), V(i, j + 1));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  add(p, geo, tmat(0.86, { vc: true, dw: true, double: true, rough: 0.2 }), 0, 0, 0, 1, 1, 1);
  // Layer 2: thin white streak ribbons hanging in front of the sheet, starting at random heights
  const PU = (u: number, v: number, off: number): [number, number, number] => {
    let i = 0;
    while (i < n - 2 && L[i + 1] < u) i++;
    const t = Math.min(1, Math.max(0, (u - L[i]) / (L[i + 1] - L[i] || 1))), A = P(i, v, off), B = P(i + 1, v, off);
    return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t];
  };
  const p2: number[] = [], c2: number[] = [], cS = new THREE.Color(), Lt = L[n - 1];
  const ns = Math.max(2, Math.round(Lt / (o.spacing ?? 0.0065)));
  for (let k = 0; k < ns; k++) {
    const h1 = hash3(k, o.seed, 31), h2 = hash3(k, o.seed, 32);
    const u = ((k + 0.2 + h1 * 0.6) / ns) * Lt, w = 0.0018 + h2 * 0.0042;
    const v0 = Math.max(0, hash3(k, o.seed, 33) * 0.5 - wh), j0 = vs.findIndex(v => v >= v0);
    for (let j = Math.max(0, j0); j < ny; j++) {
      const off = 0.0022 + h1 * 0.0015;
      const q = [PU(u - w / 2, vs[j], off), PU(u + w / 2, vs[j], off), PU(u - w * 0.7, vs[j + 1], off), PU(u + w * 0.7, vs[j + 1], off)];
      for (const m of [0, 1, 2, 1, 3, 2]) p2.push(...q[m]);
      const vm = (vs[j] + vs[j + 1]) / 2;
      cS.set('#ffffff').lerp(cB, 0.35 * (1 - vm) * (1 - h2));
      for (let m = 0; m < 6; m++) c2.push(cS.r, cS.g, cS.b);
    }
  }
  if (p2.length) {
    const g2 = new THREE.BufferGeometry();
    g2.setAttribute('position', new THREE.Float32BufferAttribute(p2, 3));
    g2.setAttribute('color', new THREE.Float32BufferAttribute(c2, 3));
    g2.computeVertexNormals();
    add(p, g2, tmat(0.74, { vc: true, dw: false, double: true, basic: true }), 0, 0, 0, 1, 1, 1);
  }
  // Foam churn and mist at the base
  for (let i = 0; i < n; i++) {
    const b = P(i, 1, 0), hh = hash3(i, o.seed, 5), h2 = hash3(i, o.seed, 6);
    for (let r = 0; r < 2; r++) {
      const d = 0.004 + (r ? 0.016 : 0) + h2 * 0.014, sz = (0.007 + hh * 0.01) * (r ? 0.8 : 1);
      if (r && h2 < 0.65) continue;
      o.foam?.push({ p: [b[0] + nrm[i][0] * d, b[1] + 0.001, b[2] + nrm[i][1] * d], s: [sz * 1.3, sz * 0.45, sz], c: hh > 0.5 ? '#ffffff' : '#e3f1f5', r: [0, hh * 6, 0] });
    }
    if (o.mist && i % 3 === 0) {
      const mh = o.mistH ?? 0.05;
      for (let r = 0; r < 2; r++) {
        const s = 0.018 + hash3(i, o.seed, 7 + r) * 0.03, d = 0.01 + r * 0.03;
        o.mist.push({ p: [b[0] + nrm[i][0] * d, b[1] + mh * (0.2 + hh * 0.6 + r * 0.5), b[2] + nrm[i][1] * d], s: [s * 1.4, s, s * 1.4], c: '#ffffff' });
      }
    }
  }
}

/** Rainbow: concentric translucent colour bands on a vertical arc. */
function rainbow(p: THREE.Object3D, x: number, y: number, z: number, R: number, w: number, ry: number, a0 = 0.15, a1 = Math.PI - 0.15): void {
  const cols = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6'];
  const seg = 28, pos: number[] = [], col: number[] = [];
  const c = new THREE.Color();
  cols.forEach((hex, k) => {
    c.set(hex);
    const r0 = R - (k * w) / cols.length, r1 = R - ((k + 1) * w) / cols.length;
    for (let i = 0; i < seg; i++) {
      const t0 = a0 + ((a1 - a0) * i) / seg, t1 = a0 + ((a1 - a0) * (i + 1)) / seg;
      const q = [[Math.cos(t0) * r0, Math.sin(t0) * r0], [Math.cos(t1) * r0, Math.sin(t1) * r0], [Math.cos(t0) * r1, Math.sin(t0) * r1], [Math.cos(t1) * r1, Math.sin(t1) * r1]];
      for (const m of [0, 2, 1, 1, 2, 3]) { pos.push(q[m][0], q[m][1], 0); col.push(c.r, c.g, c.b); }
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = add(p, geo, tmat(0.42, { vc: true, basic: true, double: true }), x, y, z, 1, 1, 1, ry);
  m.castShadow = false;
}

// =========================================================================================================
// Grand Canyon — stepped strata from Kaibab rim to Vishnu schist, temples, Colorado River, rim pines, overlook
const GC_LAYERS: [number, string][] = [
  [0.01, '#7a6250'], [0.07, '#56474c'], [0.077, '#7d5a44'], [0.088, '#8b8a66'], [0.098, '#9a7b5c'], [0.14, '#b4573a'],
  [0.15, '#a44e36'], [0.168, '#c26a43'], [0.175, '#a14a31'], [0.19, '#c4724a'], [0.212, '#963f2b'], [0.256, '#d9bf92'],
  [0.267, '#bf966e'], [0.31, '#c9b38f'],
];
const gcLayer = (hy: number) => { for (const [t, c] of GC_LAYERS) if (hy < t) return c; return '#cdbb98'; };
const GC_KNOTS: P2[] = [
  [0, 0.004], [0.07, 0.004], [0.085, 0.012], [0.16, 0.07], [0.33, 0.082], [0.38, 0.14], [0.46, 0.148], [0.48, 0.168],
  [0.55, 0.174], [0.57, 0.19], [0.64, 0.212], [0.69, 0.256], [0.78, 0.265], [0.81, 0.296], [1, 0.3],
];
const stair = (K: P2[], t: number) => {
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [t0, y0] = K[i - 1], [t1, y1] = K[i]; return y0 + ((y1 - y0) * (t - t0)) / (t1 - t0); }
  return K[K.length - 1][1];
};

const grandcanyon: Builder = gp => {
  // Canyon axis runs back-right → front-left so the cut skirt shows the stepped profile in cross-section
  const al = Math.hypot(-0.5, 0.87), ax = -0.5 / al, az = 0.87 / al, cx = az, cz = -ax;
  const c0 = (s: number) => 0.07 * Math.sin(s * 6.2 + 0.5) + 0.022 * Math.sin(s * 15 + 1);
  const W = 0.33;
  // Temples/buttes: [along, offset from river, radius, cap level]
  const temples: [number, number, number, number][] = [
    [-0.1, 0.17, 0.11, 0.76], [0.17, -0.16, 0.1, 0.72], [0.34, 0.17, 0.08, 0.66], [-0.34, -0.17, 0.08, 0.6], [0.06, 0.25, 0.06, 0.84],
  ];
  const field = (x: number, z: number) => {
    const s = x * ax + z * az, c = x * cx + z * cz, dc = c - c0(s), d = Math.abs(dc), side = dc > 0 ? 1 : -1;
    const nz = fbm(x * 6 + 3, 0.5, z * 6, 2);
    let t = d / W + 0.08 * (nz - 0.5);
    // Side canyons biting amphitheatres into the upper walls
    const trib = Math.abs(Math.cos(s * 8.5 + side * 1.9 + 1.6 * nz)) ** 7;
    t -= 0.3 * trib * sstep(0.3, 0.75, t) * (1 - sstep(1.0, 1.25, t));
    for (const [ts, tc, r, top] of temples) {
      const dd = Math.hypot(s - ts, dc - tc) / r;
      if (dd < 1.2) t = Math.max(t, Math.min(top, top * 1.3 * (1 - dd) + 0.05 * (nz - 0.5)));
    }
    return t;
  };
  const hf: HFn = (x, z) => {
    const t = field(x, z);
    return stair(GC_KNOTS, t) + (t > 0.98 ? 0.006 * fbm(x * 9, 2, z * 9, 2) * sstep(0.98, 1.1, t) : 0);
  };
  ground(gp, hf, '#b4573a', (x, y, z, _nx, ny) => {
    const hy = y - Y0;
    if (hy < 0.0072 && ny > 0.9) return wcol('#3f8a78', x, z, 1.4, -0.5);
    const n = fbm(x * 16, hy * 40, z * 16, 2);
    let c = gcLayer(hy + (n - 0.5) * 0.007);
    if (ny > 0.8) {
      if (hy > 0.294) return n > 0.6 ? '#5e6a3a' : n < 0.36 ? '#b6a47c' : '#a39a6c';
      if (hy > 0.068 && hy < 0.09) return n > 0.55 ? '#7d8758' : '#98946c';
      c = mx(c, '#a98c66', 0.28);
    } else if (hy < 0.07 && hy > 0.016 && vnoise((x - z) * 45, hy * 8, 1) > 0.72) c = '#8a6a68';
    return n > 0.62 ? sh(c, 1.07) : n < 0.36 ? sh(c, 0.9) : c;
  }, (y, x, z) => {
    const hy = y - Y0;
    if (y < Y0) return '#3d3238';
    const c = gcLayer(hy);
    return fbm(x * 9, hy * 20, z * 9, 2) > 0.58 ? sh(c, 1.06) : c;
  }, { n: 100, smooth: true, bands: [Y0, ...GC_LAYERS.map(([t]) => t + Y0)] });

  const gy = (x: number, z: number) => Y0 + hf(x, z);
  const along = (s: number, dc: number): P2 => { const c = c0(s) + dc; return [s * ax + c * cx, s * az + c * cz]; };
  // Rim forest: ponderosa pines and juniper puffs on the Kaibab plateau
  const cones: Item[] = [], trunks: Item[] = [], bush: Item[] = [];
  for (let i = 0; i < 170; i++) {
    const a = hash3(i, 3, 1) * Math.PI * 2, r = Math.sqrt(0.08 + hash3(i, 3, 2) * 0.92) * 0.47, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (field(x, z) < 1.08) continue;
    if (i % 3 === 0) bush.push({ p: [x, gy(x, z) + 0.004, z], s: [0.012, 0.008, 0.012], c: hash3(i, 3, 4) > 0.5 ? '#55663a' : '#6b7444' });
    else conifer(cones, trunks, x, gy(x, z) - 0.002, z, 0.05 + hash3(i, 3, 3) * 0.03, hash3(i, 3, 5) > 0.5 ? '#2f5a35' : '#3b6a3c');
  }
  // Scrub dotting the Tonto platform
  for (let i = 0; i < 70; i++) {
    const [x, z] = along(-0.45 + hash3(i, 4, 1) * 0.9, (hash3(i, 4, 2) > 0.5 ? 1 : -1) * W * (0.24 + hash3(i, 4, 3) * 0.1));
    if (Math.hypot(x, z) > 0.47) continue;
    const y = gy(x, z);
    if (y - Y0 > 0.068 && y - Y0 < 0.09) bush.push({ p: [x, y + 0.002, z], s: [0.006, 0.004, 0.006], c: '#5f6b3a' });
  }
  inst(gp, CON(), cones, { flat: true });
  inst(gp, CYL(), trunks, { flat: true });
  inst(gp, SPH(), bush, { flat: true, jit: 0.3 });

  /** First rim point (walking out from the river) near along-position s0 that lies safely inside the disc. */
  const rim = (s0: number, sg: number): P2 => {
    for (let k = 0; k < 12; k++) {
      const s = s0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.04;
      for (let dc = 0.15 * sg; Math.abs(dc) < 0.5; dc += 0.005 * sg) {
        const [x, z] = along(s, dc);
        if (field(x, z) > 1.0) { if (Math.hypot(...along(s, dc + 0.05 * sg)) < 0.46) return [s, dc]; break; }
      }
    }
    return [s0, 0.3 * sg];
  };
  // Overlook (Mather Point style): stone platform cantilevered at the south rim with a railing and visitors
  {
    const [s, dc] = rim(0.1, 1);
    const [px, pz] = along(s, dc - 0.01), ry = Math.atan2(cx, cz);
    const ov = grp(gp, px, Y0 + 0.298, pz, ry);
    const plan: P2[] = [];
    for (let k = 0; k <= 10; k++) { const a = Math.PI * (k / 10); plan.push([Math.cos(a) * 0.05, -Math.sin(a) * 0.035 + 0.02]); }
    prism(ov, plan, -0.012, 0.014, '#b7a789');
    prism(ov, [[-0.05, 0.02], [0.05, 0.02], [0.05, 0.05], [-0.05, 0.05]], -0.012, 0.014, '#a99a7c');
    const posts: Item[] = [], rails: Item[] = [];
    for (let k = 0; k <= 12; k++) {
      const a = Math.PI * (k / 12), x = Math.cos(a) * 0.047, z = -Math.sin(a) * 0.033 + 0.02;
      posts.push({ p: [x, 0.0085, z], s: [0.0012, 0.017, 0.0012], c: '#4b4b4b' });
      if (k < 12) {
        const a2 = Math.PI * ((k + 1) / 12), x2 = Math.cos(a2) * 0.047, z2 = -Math.sin(a2) * 0.033 + 0.02;
        for (const hh of [0.009, 0.017]) rails.push({ p: [(x + x2) / 2, hh, (z + z2) / 2], s: [Math.hypot(x2 - x, z2 - z) + 0.002, 0.0012, 0.0012], c: '#5a5a5a', r: [0, -Math.atan2(z2 - z, x2 - x), 0] });
      }
    }
    const fig: [number, number, number][] = [[-0.03, 0.002, 0.0], [-0.012, 0.002, -0.006], [0.012, 0.002, -0.004], [0.028, 0.002, 0.01], [0.0, 0.002, 0.03]];
    inst(ov, BOXG(), [...posts, ...rails, ...people(fig, 4)], { flat: true });
    inst(ov, SPH(), heads(fig));
  }
  // Desert View Watchtower on the opposite rim
  {
    const [s, dc] = rim(-0.2, -1);
    const [tx, tz] = along(s, dc - 0.035), ty = gy(tx, tz) - 0.003;
    lathe(gp, [[0, 0], [0.028, 0], [0.026, 0.03], [0.022, 0.085], [0.024, 0.088], [0.024, 0.094], [0, 0.094]], '#a8795a', tx, ty, tz, 12);
    lathe(gp, [[0, 0], [0.04, 0], [0.038, 0.02], [0, 0.02]], '#9a6c50', tx + 0.03, ty, tz + 0.01, 10);
    const win: Item[] = [];
    for (let k = 0; k < 6; k++) { const a = k * 1.05 + 0.3, yy = 0.03 + (k % 3) * 0.018; win.push({ p: [tx + Math.cos(a) * 0.024, ty + yy, tz + Math.sin(a) * 0.024], s: [0.004, 0.006, 0.004], c: '#3a2a22', r: [0, -a, 0] }); }
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; win.push({ p: [tx + Math.cos(a) * 0.022, ty + 0.098, tz + Math.sin(a) * 0.022], s: [0.007, 0.008, 0.006], c: '#a8795a', r: [0, -a, 0] }); }
    inst(gp, BOXG(), win, { flat: true });
  }
  // Rafts and rapids on the Colorado
  const raft: Item[] = [], foam: Item[] = [];
  for (const [s, k] of [[0.12, 0], [-0.2, 1]] as const) {
    const [x, z] = along(s, 0), ry = -Math.atan2(az, ax);
    raft.push({ p: [x, Y0 + 0.007, z], s: [0.022, 0.005, 0.009], c: k ? '#facc15' : '#f97316', r: [0, ry, 0] });
    raft.push({ p: [x, Y0 + 0.011, z], s: [0.003, 0.004, 0.003], c: '#2563eb' });
  }
  for (const s of [-0.38, -0.05, 0.28]) for (let k = 0; k < 4; k++) {
    const [x, z] = along(s + k * 0.012, (k - 1.5) * 0.008);
    foam.push({ p: [x, Y0 + 0.005, z], s: [0.008, 0.002, 0.005], c: '#e6f3ef' });
  }
  inst(gp, BOXG(), raft, { flat: true });
  inst(gp, SPH(), foam);
};

/** Railing (posts + two rails) along a polyline at heights given by `gy`; items pushed for one merged mesh. */
function railing(out: Item[], pts: P2[], gy: (x: number, z: number) => number, h = 0.012, c = '#4a4f55', every = 2): void {
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i], y = gy(x, z);
    if (i % every === 0) out.push({ p: [x, y + h / 2, z], s: [0.0014, h, 0.0014], c });
    if (i < pts.length - 1) {
      const [x2, z2] = pts[i + 1], y2 = gy(x2, z2), l = Math.hypot(x2 - x, z2 - z);
      out.push({ p: [(x + x2) / 2, (y + y2) / 2 + h, (z + z2) / 2], s: [l + 0.001, 0.0013, 0.0013], c, r: [0, -Math.atan2(z2 - z, x2 - x), Math.atan2(y2 - y, l)] });
    }
  }
}

/** Small tour boat (Maid of the Mist style): hull, cabin, open upper deck crowded with ponchos, wake foam. */
function tourBoat(box: Item[], ball: Item[], x: number, y: number, z: number, ry: number, poncho: string, seed: number): void {
  const ca = Math.cos(ry), sa = Math.sin(ry);
  const at = (u: number, v: number, h: number, sx: number, sy: number, sz: number, c: string, tgt = box) =>
    tgt.push({ p: [x + u * ca + v * sa, y + h, z - u * sa + v * ca], s: [sx, sy, sz], c, r: [0, ry, 0] });
  at(0, 0, 0.003, 0.064, 0.008, 0.024, '#1e3a5f');
  at(0.002, 0, 0.0085, 0.062, 0.005, 0.023, '#f8fafc');
  at(0.034, 0, 0.0055, 0.012, 0.006, 0.016, '#f8fafc', box);
  at(0.004, 0, 0.0145, 0.044, 0.008, 0.019, '#e2e8f0');
  at(0.004, 0, 0.0185, 0.046, 0.0012, 0.021, '#334155');
  at(-0.012, 0, 0.024, 0.006, 0.01, 0.006, '#334155');
  for (let k = 0; k < 14; k++) {
    const u = -0.016 + (k % 7) * 0.0055, v = (Math.floor(k / 7) - 0.5) * 0.011 + (hash3(k, seed, 1) - 0.5) * 0.003;
    at(u, v, 0.0225, 0.0034, 0.007, 0.0034, poncho);
    at(u, v, 0.0275, 0.0026, 0.0026, 0.0026, sh(poncho, 1.15), ball);
  }
  for (let k = 0; k < 9; k++) {
    const u = -0.038 - k * 0.011, sp = 0.006 + k * 0.0022;
    for (const v of [-1, 1]) at(u, v * sp, 0.001, 0.012, 0.0025, 0.006 + k * 0.0006, k < 3 ? '#ffffff' : '#e5f3f1', ball);
  }
}

// =========================================================================================================
// Niagara Falls — Horseshoe Falls arc, American + Bridal Veil Falls over talus, Goat Island, Maid of the Mist,
// Rainbow Bridge across the gorge, Canadian parkway with Table Rock and the Skylon Tower.
const niagara: Builder = gp => {
  const LAND = 0.165, RIVER = 0.153, GW = 0.012;
  const amLip: P2[] = [[-0.4, -0.075], [-0.3, -0.066], [-0.19, -0.06]];
  const bvLip: P2[] = [[-0.165, -0.057], [-0.135, -0.055]];
  const hsCtrl: P2[] = [[0.03, -0.07], [0.045, -0.16], [0.1, -0.245], [0.2, -0.285], [0.29, -0.255], [0.35, -0.175], [0.38, -0.08], [0.405, 0.0]];
  const hsLip = path(hsCtrl, 54);
  const leftBank: P2[] = path([[-0.3, 0.6], [-0.31, 0.36], [-0.36, 0.2], [-0.42, 0.05], [-0.4, -0.075]], 16);
  const rightBank = path([[0.405, 0.0], [0.385, 0.12], [0.31, 0.26], [0.25, 0.4], [0.22, 0.6]], 16);
  const gorgePoly: P2[] = [...leftBank, ...path(amLip, 8).slice(1), [-0.178, -0.058], ...bvLip, [0.03, -0.07], ...hsLip.slice(1), ...rightBank.slice(1)];
  const gor = sdf(gorgePoly, 110);
  const up = sdf([[-0.4, -0.04], [-0.44, -0.2], [-0.32, -0.36], [-0.08, -0.53], [0.25, -0.55], [0.44, -0.32], [0.435, -0.05], [0.41, 0.03], [0.0, 0.01], [-0.2, -0.02]], 90);
  const goat = sdf([[-0.135, -0.05], [0.03, -0.068], [0.042, -0.16], [0.03, -0.3], [-0.03, -0.42], [-0.11, -0.37], [-0.15, -0.22], [-0.15, -0.08]], 80);
  const isl = (x: number, z: number) => Math.min(goat(x, z), Math.hypot(x + 0.177, z + 0.064) - 0.012,
    Math.hypot(x - 0.075, z + 0.3) - 0.018, Math.hypot(x - 0.105, z + 0.345) - 0.014);
  const river = (x: number, z: number) => Math.max(up(x, z), -isl(x, z));
  const hf: HFn = (x, z) => {
    const m = river(x, z), dG = gor(x, z);
    let h = LAND + 0.004 * (fbm(x * 9, 1, z * 9, 2) - 0.5);
    if (m < 0.012) h = h + (RIVER - h) * sstep(0.012, 0.0, m);
    if (dG < 0.002) h = h + (GW - h) * sstep(0.002, -0.016, dG);
    return h;
  };
  ground(gp, hf, '#6f9a4f', (x, y, z, _nx, ny) => {
    const hy = y - Y0, dG = gor(x, z), n = fbm(x * 14, hy * 30, z * 14, 2);
    if (hy < GW + 0.002 && ny > 0.8) {
      const fo = (1 - sstep(-0.01, -0.1, dG)) * (1 - sstep(-0.05, 0.1, z));
      return mx(wcol('#3b8a7c', x, z, 1.3, 0.3), '#eef8f5', Math.min(0.85, fo * (0.4 + n)));
    }
    if (ny < 0.75) {
      const c = hy > LAND - 0.03 ? '#9a958a' : hy > 0.09 ? '#7d6f63' : hy > 0.05 ? '#8a7466' : '#6e6a64';
      return n > 0.6 ? sh(c, 1.08) : n < 0.38 ? sh(c, 0.9) : c;
    }
    const m = river(x, z);
    if (m < -0.001 && hy < RIVER + 0.002) {
      const c = wcol('#5aa595', x, z, 1.2, -0.2), rap = sstep(0.09, 0.0, dG) * sstep(0.35, 0.8, vnoise(x * 40, z * 12, 3));
      return mx(c, '#f1faf7', rap * 0.75);
    }
    if (m < 0.01) return n > 0.5 ? '#8f8b7c' : '#7d7a6a';
    if (x > 0.2 && dG > 0.024 && dG < 0.038 && z > -0.1) return '#6b6f73';
    if (x > 0.2 && dG > 0.006 && dG < 0.016 && z > -0.1) return '#c9c2b0';
    return n > 0.62 ? '#5f8c43' : n < 0.38 ? '#7aa356' : '#6c9a4c';
  }, (y, x, z) => {
    const hy = y - Y0;
    if (y < Y0) return '#3d3a38';
    if (gor(x, z) < -0.004) return hy < GW * 0.5 ? '#2c6a5e' : '#3b8a7c';
    if (hy > LAND - 0.022) return '#9a958a';
    return hy > 0.09 ? '#7d6f63' : hy > 0.05 ? '#8a7466' : '#6e6a64';
  }, { n: 88, smooth: true, bands: [Y0, Y0 + GW, Y0 + 0.05, Y0 + 0.09, Y0 + LAND - 0.022] });
  const gy = (x: number, z: number) => Y0 + hf(x, z);

  // The falls: Horseshoe (thick green core), American (thin, white, broken by talus) and Bridal Veil
  const foam: Item[] = [], mist: Item[] = [], spray: Item[] = [];
  falls(gp, { lip: hsLip, top: Y0 + RIVER, bot: Y0 + GW, bow: 0.03, out: gor, water: '#5fae94', deep: '#2f7d68', seed: 3, rows: 11, foam, mist, mistH: 0.07, spacing: 0.009 });
  const TAL = Y0 + 0.06;
  falls(gp, { lip: path(amLip, 22), top: Y0 + RIVER, bot: TAL, bow: 0.012, out: gor, water: '#9fd3c4', deep: '#5aa595', seed: 5, rows: 8, foam, white: 0.4, spacing: 0.008 });
  falls(gp, { lip: path(bvLip, 3), top: Y0 + RIVER, bot: TAL, bow: 0.01, out: gor, water: '#8cc9b8', deep: '#4f9c8a', seed: 7, rows: 6, white: 0.3 });
  // Talus boulders heaped under the American Falls with white water spilling between them
  const rocks: Item[] = [];
  for (const [i, pt] of path([[-0.4, -0.04], [-0.3, -0.03], [-0.19, -0.025], [-0.13, -0.022]], 40).entries()) {
    for (let k = 0; k < 2; k++) {
      const h = hash3(i, k, 11), d = 0.006 + k * 0.016 + h * 0.008, y = TAL - 0.006 - k * 0.018;
      const r = 0.009 + hash3(i, k, 12) * 0.008;
      rocks.push({ p: [pt[0] + (h - 0.5) * 0.01, y, pt[1] + d], s: [r * 1.2, r * 0.8, r], c: h > 0.6 ? '#9d978c' : h > 0.3 ? '#857f76' : '#6f6a63', r: [0, h * 3, 0] });
      if (hash3(i, k, 13) > 0.45) foam.push({ p: [pt[0], y + r * 0.6, pt[1] + d + 0.004], s: [0.008, 0.004, 0.006], c: '#f8fbfc' });
    }
  }
  inst(gp, SPHL(), rocks, { flat: true, jit: 0.35 });
  // Spray column rising out of the Horseshoe basin
  for (let i = 0; i < 40; i++) {
    const t = 0.1 + hash3(i, 21, 1) * 0.8, k = Math.floor(t * (hsLip.length - 1)), [lx, lz] = hsLip[k];
    const cx = 0.215, cz = -0.12, f = 0.3 + hash3(i, 21, 2) * 0.5;
    const x = lx + (cx - lx) * f, z = lz + (cz - lz) * f, y = Y0 + 0.05 + hash3(i, 21, 3) * 0.22, s = 0.035 + hash3(i, 21, 4) * 0.035;
    spray.push({ p: [x, y, z], s: [s * 1.25, s, s * 1.25], c: '#ffffff' });
  }
  inst(gp, ICO(), foam, { flat: true, jit: 0.3 });
  inst(gp, MIST(), mist, { opacity: 0.16, basic: true });
  inst(gp, MIST(), spray, { opacity: 0.13, basic: true });
  rainbow(gp, 0.12, Y0 + GW, 0.06, 0.12, 0.022, -0.35, 0.35, Math.PI - 0.6);

  // Boats: Maid of the Mist nosing into the Horseshoe, a second boat by the American Falls
  const bx: Item[] = [], bb: Item[] = [];
  tourBoat(bx, bb, 0.17, Y0 + GW, -0.02, Math.PI / 2 + 0.25, '#2563eb', 1);
  tourBoat(bx, bb, -0.2, Y0 + GW, 0.13, Math.PI / 2 - 0.5, '#dc2626', 2);
  // Rainbow Bridge: steel deck on a hingeless arch spanning the gorge downstream
  const BZ = 0.33, xl = -0.335, xr = 0.285, dy = Y0 + LAND + 0.004, ay = Y0 + 0.05;
  bx.push({ p: [(xl + xr) / 2, dy, BZ], s: [xr - xl, 0.006, 0.03], c: '#76807c' });
  for (const s of [-1, 1]) bx.push({ p: [(xl + xr) / 2, dy + 0.006, BZ + s * 0.014], s: [xr - xl, 0.004, 0.0016], c: '#5f6966' });
  const aL = -0.31, aR = 0.262, apex = dy - 0.012, A = (u: number) => ay + (apex - ay) * (1 - (2 * u - 1) ** 2);
  for (let k = 0; k < 24; k++) {
    const u0 = k / 24, u1 = (k + 1) / 24, x0 = aL + (aR - aL) * u0, x1 = aL + (aR - aL) * u1, y0 = A(u0), y1 = A(u1);
    for (const s of [-1, 1]) bx.push({ p: [(x0 + x1) / 2, (y0 + y1) / 2, BZ + s * 0.01], s: [Math.hypot(x1 - x0, y1 - y0) + 0.002, 0.008, 0.004], c: '#86918d', r: [0, 0, Math.atan2(y1 - y0, x1 - x0)] });
    if (k % 2 === 0 && k > 0) for (const s of [-1, 1]) bx.push({ p: [x0, (y0 + dy) / 2, BZ + s * 0.01], s: [0.0025, dy - y0, 0.0025], c: '#7b8682' });
  }
  for (const xa of [xl + 0.02, xr - 0.02]) bx.push({ p: [xa, (ay + dy) / 2 - 0.02, BZ], s: [0.03, dy - ay + 0.02, 0.034], c: '#8f8a80' });
  // Canadian side: Table Rock welcome centre, railings with visitors, Skylon Tower
  bx.push({ p: [0.455, gy(0.455, 0.08) + 0.012, 0.08], s: [0.05, 0.024, 0.04], c: '#e5ded0', r: [0, -0.3, 0] });
  bx.push({ p: [0.455, gy(0.455, 0.08) + 0.026, 0.08], s: [0.054, 0.004, 0.044], c: '#8b5a3c', r: [0, -0.3, 0] });
  const railPts = rightBank.slice(0, 11).map(([x, z]) => [x + 0.009, z + 0.002] as P2);
  railing(bx, [[0.425, -0.08], [0.418, -0.04], ...railPts.slice(0, 1).map(([x, z]) => [x + 0.004, z] as P2), ...railPts.slice(1)], gy);
  const fig: [number, number, number][] = [];
  for (let k = 0; k < 9; k++) { const [x, z] = railPts[Math.min(railPts.length - 1, k)]; fig.push([x + 0.008, gy(x + 0.008, z), z + (hash3(k, 4, 1) - 0.5) * 0.01]); }
  bx.push(...people(fig, 6));
  bb.push(...heads(fig));
  const tx = 0.36, tz = 0.27, ty = gy(tx, tz);
  lathe(gp, [[0, 0], [0.016, 0], [0.011, 0.02], [0.008, 0.2], [0, 0.2]], '#d8d4cc', tx, ty, tz, 10);
  lathe(gp, [[0, 0], [0.012, 0], [0.03, 0.014], [0.032, 0.026], [0.024, 0.036], [0.026, 0.042], [0.012, 0.05], [0.006, 0.07], [0, 0.07]], '#e7e3da', tx, ty + 0.185, tz, 14);
  for (const a of [0.4, 2.5, 4.6]) bx.push({ p: [tx + Math.cos(a) * 0.009, ty + 0.1, tz + Math.sin(a) * 0.009], s: [0.006, 0.17, 0.006], c: '#f2c94c', r: [0, -a, 0] });
  inst(gp, BOXG(), bx, { flat: true });
  inst(gp, SPHL(), bb);

  // Trees: Goat Island woods, Prospect Park (US), Queen Victoria Park (CA)
  const puffs: Item[] = [], trunks: Item[] = [];
  for (let i = 0; i < 200; i++) {
    const a = hash3(i, 9, 1) * Math.PI * 2, r = Math.sqrt(hash3(i, 9, 2)) * 0.48, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (river(x, z) < 0.012 || gor(x, z) < 0.02) continue;
    if (x > 0.2 && gor(x, z) < 0.05) continue;
    if (Math.hypot(x - tx, z - tz) < 0.04 || Math.hypot(x - 0.455, z - 0.08) < 0.05) continue;
    if (Math.abs(z - BZ) < 0.03 && x < -0.25) continue;
    const sc = 0.03 + hash3(i, 9, 3) * 0.02, c = ['#3f7a3a', '#4c8a3e', '#5a9244', '#2f6a35'][Math.floor(hash3(i, 9, 4) * 4)];
    leafy(puffs, trunks, x, gy(x, z) - 0.002, z, sc, c, i);
  }
  inst(gp, SPHL(), puffs, { jit: 0.3 });
  inst(gp, CYL(), trunks, { flat: true });
};

/** Steel deck-arch bridge in local coords (x along span, centred), pushed as box items. */
function archBridge(out: Item[], o: { x: number; y: number; z: number; ry: number; span: number; deckY: number; springY: number; w: number; c: string }): void {
  const ca = Math.cos(o.ry), sa = Math.sin(o.ry);
  const at = (u: number, y: number, v: number, sx: number, sy: number, sz: number, c: string, rz = 0) =>
    out.push({ p: [o.x + u * ca + v * sa, y, o.z - u * sa + v * ca], s: [sx, sy, sz], c, r: [0, o.ry, rz] });
  const L = o.span, apex = o.deckY - 0.01, A = (t: number) => o.springY + (apex - o.springY) * (1 - (2 * t - 1) ** 2);
  at(0, o.deckY, 0, L + 0.06, 0.006, o.w, o.c);
  for (const s of [-1, 1]) at(0, o.deckY + 0.006, s * o.w * 0.45, L + 0.06, 0.004, 0.0015, sh(o.c, 0.8));
  const n = 18;
  for (let k = 0; k < n; k++) {
    const t0 = k / n, t1 = (k + 1) / n, u0 = -L / 2 + L * t0, u1 = -L / 2 + L * t1, y0 = A(t0), y1 = A(t1);
    for (const s of [-1, 1]) at((u0 + u1) / 2, (y0 + y1) / 2, s * o.w * 0.33, Math.hypot(u1 - u0, y1 - y0) + 0.002, 0.007, 0.004, sh(o.c, 1.1), Math.atan2(y1 - y0, u1 - u0));
    if (k % 2 === 0 && k > 0) for (const s of [-1, 1]) at(u0, (y0 + o.deckY) / 2, s * o.w * 0.33, 0.0022, o.deckY - y0, 0.0022, o.c);
  }
}

// =========================================================================================================
// Victoria Falls (Mosi-oa-Tunya) — a 1.7 km straight curtain plunging into a narrow basalt fissure, a towering
// spray cloud with rainbow, the island-studded Zambezi above, rainforest rim opposite and the zig-zag gorges.
const victoriafalls: Builder = gp => {
  const LIPH = 0.215, RIVER = 0.207, FRONT = 0.138, GW = 0.026;
  const lipZ = (x: number) => -0.06 + 0.007 * Math.sin(x * 13 + 0.4) + 0.004 * Math.sin(x * 31);
  const frZ = (x: number) => 0.052 + 0.006 * Math.sin(x * 9 + 1) + 0.004 * Math.sin(x * 23 + 2);
  const zig: P2[] = [[0.13, 0.03], [0.21, 0.16], [0.06, 0.27], [0.17, 0.39], [0.1, 0.56]];
  const segD = (x: number, z: number) => {
    let d = 1e9;
    for (let i = 0; i < zig.length - 1; i++) {
      const [ax, az] = zig[i], [bx, bz] = zig[i + 1], ex = bx - ax, ez = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez)));
      d = Math.min(d, Math.hypot(x - ax - ex * t, z - az - ez * t));
    }
    return d;
  };
  const gor = (x: number, z: number) => Math.min(Math.max(lipZ(x) - z, z - frZ(x)), segD(x, z) - 0.036);
  // Islands in the upper Zambezi: [x, z, rx, rz]; the first two sit on the lip (Cataract and Livingstone Islands)
  const isles: [number, number, number, number][] = [
    [-0.36, -0.1, 0.034, 0.05], [-0.05, -0.115, 0.042, 0.06], [-0.21, -0.29, 0.06, 0.03], [0.1, -0.27, 0.07, 0.035],
    [0.3, -0.2, 0.045, 0.06], [-0.4, -0.32, 0.04, 0.026], [-0.02, -0.42, 0.06, 0.03], [0.25, -0.38, 0.045, 0.028], [0.17, -0.12, 0.03, 0.02],
  ];
  const island = (x: number, z: number) => {
    let m = 1e9;
    for (const [ix, iz, rx, rz] of isles) m = Math.min(m, (Math.hypot((x - ix) / rx, (z - iz) / rz) - 1) * Math.min(rx, rz));
    return m + 0.006 * (fbm(x * 18, 2, z * 18, 2) - 0.5);
  };
  // Eastern Cataract: dry basalt shelf on the Zambian end of the lip (only thin strands fall in the dry season)
  const dry = (x: number, z: number) => sstep(0.29, 0.34, x) * sstep(-0.24, -0.16, z);
  const hf: HFn = (x, z) => {
    const dG = gor(x, z);
    let h: number;
    if (z < lipZ(x) + 0.03 && dG > -0.03 && segD(x, z) > 0.03 || z < lipZ(x)) {
      const il = island(x, z), dr = dry(x, z);
      h = RIVER + (LIPH + 0.004 - RIVER) * Math.max(sstep(0.004, -0.008, il), dr * sstep(0.35, 0.55, vnoise(x * 30, 1, z * 30)));
      if (il < 0) h += 0.006 * fbm(x * 20, 4, z * 20, 2);
    } else h = FRONT + 0.006 * (fbm(x * 9, 1, z * 9, 2) - 0.5);
    if (dG < 0.002) h = h + (GW - h) * sstep(0.002, -0.013, dG);
    return h;
  };
  const basalt = (x: number, hy: number, z: number) => {
    const j = vnoise((x + z) * 70, hy * 6, 5);
    return j > 0.7 ? '#4a413b' : j < 0.3 ? '#2b2624' : hy < 0.07 && vnoise(x * 30, hy * 20, z * 30) > 0.6 ? '#35502f' : '#383230';
  };
  ground(gp, hf, '#3f6f35', (x, y, z, _nx, ny) => {
    const hy = y - Y0, n = fbm(x * 14, hy * 30, z * 14, 2), dG = gor(x, z);
    if (hy < GW + 0.002 && ny > 0.8) {
      const fo = 1 - sstep(-0.004, -0.06, Math.max(lipZ(x) - z, segD(x, z) < 0.05 ? -1 : -1e-3 + lipZ(x) - z));
      return mx(wcol('#3c6e6c', x, z, 1.5, 4), '#eef6f5', Math.min(0.85, fo * (0.4 + n) * (z < frZ(x) + 0.01 ? 1 : 0)));
    }
    if (ny < 0.72) return basalt(x, hy, z);
    if (z < lipZ(x) + 0.003 && hy < RIVER + 0.0015 && island(x, z) > 0) {
      const rap = sstep(0.07, 0.0, lipZ(x) - z) * sstep(0.35, 0.8, vnoise(x * 60, z * 12, 7));
      return mx(wcol('#4f8aa0', x, z, 1.1, 0.15), '#eef7fa', rap * 0.7);
    }
    if (z < lipZ(x) + 0.003 && island(x, z) > 0) return n > 0.5 ? '#5d5650' : '#4b4541';
    if (z < lipZ(x)) return n > 0.55 ? '#365f2e' : '#2f5629';
    if (dG < 0.01) return '#55603a';
    if (dG < 0.02 && z > frZ(x)) return '#8a7656';
    return n > 0.62 ? '#2f5f2e' : n < 0.38 ? '#467a36' : '#3a6b32';
  }, (y, x, z) => {
    const hy = y - Y0;
    if (y < Y0) return '#2f2b2a';
    if (gor(x, z) < -0.004) return hy < GW * 0.5 ? '#2b5552' : '#3c6e6c';
    if (z < lipZ(x) && hy > RIVER - 0.006 && island(x, z) > 0.004) return '#4f8aa0';
    if (hy > FRONT - 0.012 && z > frZ(x)) return '#5b4a3a';
    return hy > 0.12 ? '#4a433e' : hy > 0.07 ? '#3d3734' : '#45403b';
  }, { n: 88, smooth: true, bands: [Y0, Y0 + GW, Y0 + 0.07, Y0 + 0.12, Y0 + FRONT - 0.01, Y0 + RIVER - 0.006] });
  const gy = (x: number, z: number) => Y0 + hf(x, z);

  // Curtain segments along the lip between islands; Main Falls thick, Rainbow Falls lighter, Eastern Cataract strands
  const foam: Item[] = [], mist: Item[] = [];
  const segs: [number, number, number, number][] = [
    [-0.49, -0.395, 0.3, 0.007], [-0.325, -0.095, 0.25, 0.0075], [-0.005, 0.27, 0.35, 0.007],
    [0.305, 0.32, 0.45, 0.004], [0.37, 0.383, 0.45, 0.004], [0.43, 0.445, 0.45, 0.004],
  ];
  segs.forEach(([x0, x1, wh, sp], k) => {
    const nn = Math.max(2, Math.round((x1 - x0) / 0.012));
    const lip = Array.from({ length: nn + 1 }, (_, i) => { const x = x0 + ((x1 - x0) * i) / nn; return [x, lipZ(x) - 0.002] as P2; });
    falls(gp, { lip, top: Y0 + RIVER, bot: Y0 + GW, bow: 0.018, out: gor, water: '#7fb6c4', deep: '#4f8aa0', seed: 11 + k, rows: 10, foam, mist: k < 3 ? mist : undefined, mistH: 0.1, white: wh, spacing: sp });
  });
  // "The smoke that thunders": spray columns boiling up out of the fissure, drifting high above the rims
  const spray: Item[] = [];
  for (let i = 0; i < 60; i++) {
    const x = -0.46 + hash3(i, 41, 1) * 0.76, z = (lipZ(x) + frZ(x)) / 2 + (hash3(i, 41, 2) - 0.5) * 0.06;
    const t = hash3(i, 41, 3) ** 1.3, y = Y0 + 0.1 + t * 0.3, s = 0.028 + t * 0.03 + hash3(i, 41, 4) * 0.02;
    spray.push({ p: [x + t * 0.03, y, z - t * 0.02], s: [s * 1.3, s, s * 1.3], c: '#ffffff' });
  }
  inst(gp, ICO(), foam, { flat: true, jit: 0.3 });
  inst(gp, MIST(), mist, { opacity: 0.15, basic: true });
  inst(gp, SPH(), spray, { opacity: 0.085, basic: true });
  rainbow(gp, -0.17, Y0 + GW + 0.01, 0.0, 0.15, 0.024, 0, 0.3, Math.PI - 0.3);

  // Rainforest on the Zimbabwean rim (fed by perpetual spray) and woods on the river islands
  const puffs: Item[] = [], trunks: Item[] = [], blob: Item[] = [], bx: Item[] = [], bb: Item[] = [];
  isles.forEach(([ix, iz, rx, rz], k) => {
    for (let m = 0; m < 3 + Math.round(rx * rz * 2500); m++) {
      const a = hash3(k, m, 47) * 6.28, rr = Math.sqrt(hash3(k, m, 48)) * 0.7, x = ix + Math.cos(a) * rx * rr, z = iz + Math.sin(a) * rz * rr;
      if (island(x, z) > -0.004 || z > lipZ(x) - 0.006 || Math.hypot(x, z) > 0.47) continue;
      const sc = 0.02 + hash3(k, m, 49) * 0.014, c = ['#2d6a2f', '#3b7a35', '#4a8a3a'][m % 3];
      blob.push({ p: [x, gy(x, z) + sc * 0.5, z], s: [sc * 0.5, sc * 0.42, sc * 0.5], c, r: [0, m, 0] });
    }
  });
  for (let i = 0; i < 330; i++) {
    const a = hash3(i, 43, 1) * Math.PI * 2, r = Math.sqrt(hash3(i, 43, 2)) * 0.48, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const dG = gor(x, z);
    if (dG < 0.022) continue;
    const front = z > frZ(x);
    if (!front && island(x, z) > -0.008) continue;
    if (front && dG > 0.1 && hash3(i, 43, 6) > 0.45) continue;
    const sc = ((front ? 0.032 : 0.026) + hash3(i, 43, 3) * 0.02) * (front ? 0.55 + 0.45 * sstep(0.03, 0.09, dG) : 1), c = ['#2d6a2f', '#3b7a35', '#24592a', '#4a8a3a', '#55913f'][Math.floor(hash3(i, 43, 4) * 5)];
    if (hash3(i, 43, 5) > 0.22) {
      const y = gy(x, z);
      blob.push({ p: [x, y + sc * 0.55, z], s: [sc * 0.5, sc * 0.42, sc * 0.5], c, r: [0, i, 0] });
      if (hash3(i, 43, 7) > 0.5) blob.push({ p: [x + sc * 0.3, y + sc * 0.8, z - sc * 0.2], s: [sc * 0.36, sc * 0.3, sc * 0.36], c: sh(c, 1.12), r: [0, i * 2, 0] });
    } else leafy(puffs, trunks, x, gy(x, z) - 0.002, z, sc, c, i);
  }
  // Visitors on the rim path (Danger Point) in rain ponchos
  const fig: [number, number, number][] = [];
  for (let k = 0; k < 7; k++) { const x = -0.3 + k * 0.022 + hash3(k, 44, 1) * 0.01, z = frZ(x) + 0.012; fig.push([x, gy(x, z), z]); }
  bx.push(...people(fig, 8, ['#facc15', '#ef4444', '#3b82f6', '#f8fafc']));
  bb.push(...heads(fig));
  // Victoria Falls Bridge spanning the second gorge
  const [ax, az] = zig[1], [bx2, bz] = zig[2];
  archBridge(bx, { x: (ax + bx2) / 2 + 0.01, y: 0, z: (az + bz) / 2 + 0.015, ry: -Math.atan2(-(ax - bx2), bz - az) + Math.PI / 2, span: 0.1, deckY: Y0 + FRONT + 0.004, springY: Y0 + 0.07, w: 0.022, c: '#7d7f7a' });
  inst(gp, SPHL(), puffs, { jit: 0.3 });
  inst(gp, ICO(), blob, { jit: 0.25 });
  inst(gp, CYL(), trunks, { flat: true });
  inst(gp, BOXG(), bx, { flat: true });
  inst(gp, SPHL(), bb);
};

/** Splits a polyline into maximal runs of consecutive points satisfying `ok` (each run ≥ minLen points). */
function runs(pts: P2[], ok: (p: P2, i: number) => boolean, minLen = 3): P2[][] {
  const out: P2[][] = [];
  let cur: P2[] = [];
  pts.forEach((p, i) => {
    if (ok(p, i)) cur.push(p);
    else { if (cur.length >= minLen) out.push(cur); cur = []; }
  });
  if (cur.length >= minLen) out.push(cur);
  return out;
}

/** Toucan perched at (x,y,z) facing ry: black body, white bib, big orange bill. */
function toucan(box: Item[], ball: Item[], x: number, y: number, z: number, ry: number): void {
  const ca = Math.cos(ry), sa = Math.sin(ry);
  const at = (u: number, h: number, sx: number, sy: number, sz: number, c: string, tgt: Item[], rz = 0) =>
    tgt.push({ p: [x + u * ca, y + h, z - u * sa], s: [sx, sy, sz], c, r: [0, ry, rz] });
  at(0, 0.006, 0.006, 0.009, 0.005, '#111111', ball, 0.4);
  at(0.003, 0.009, 0.0035, 0.0045, 0.0042, '#f8fafc', ball);
  at(0.004, 0.0125, 0.004, 0.004, 0.004, '#111111', ball);
  at(0.0095, 0.0125, 0.009, 0.0035, 0.0028, '#f97316', box, -0.15);
  at(-0.006, 0.002, 0.008, 0.002, 0.003, '#111111', box, 0.6);
}

// =========================================================================================================
// Iguazú Falls — the U-shaped Garganta del Diablo, a long arc of separate two-tier cascades through jungle on the
// Argentine side, Brazilian cliffs with the lower walkway and lookout tower, rust-brown water and boiling mist.
const iguazu: Builder = root => {
  // Laid out as seen from the Brazilian bank, then mirrored so the Argentine arc faces the default camera
  const gp = new THREE.Group();
  gp.scale.x = -1;
  root.add(gp);
  const UP = 0.222, UR = 0.207, LL = 0.138, LR = 0.126, BW = 0.03;
  const argB = path([[-0.13, 0.56], [-0.19, 0.33], [-0.26, 0.13], [-0.21, -0.02], [-0.125, -0.095]], 44);
  const thr = path([[-0.125, -0.095], [-0.085, -0.29], [0.0, -0.36], [0.075, -0.31], [0.105, -0.14]], 40);
  const braz = path([[0.105, -0.14], [0.18, -0.06], [0.22, 0.08], [0.18, 0.24], [0.12, 0.4], [0.1, 0.56]], 30);
  const chain: P2[] = [...argB, ...thr.slice(1), ...braz.slice(1)];
  const bas = sdf([...chain, [0.1, 0.62], [-0.13, 0.62]], 104);
  const wA = (x: number, z: number) => sstep(0.17, 0.27, Math.hypot(x, z + 0.24)) * sstep(0.0, -0.09, x);
  const LW = 0.08;
  const land = (x: number, z: number) => fbm(x * 7.5 + 3, 0.5, z * 7.5, 2) + 0.4 * sstep(0.1, 0.2, x)
    - 0.45 * sstep(0.17, 0.07, Math.abs(x + 0.01)) * sstep(-0.1, -0.2, z) - 0.06 + 0.25 * sstep(0.4, 0.5, Math.hypot(x, z))
    - 0.1 * sstep(0.0, -0.15, x) * sstep(0.44, 0.36, Math.hypot(x, z))
    + 0.4 * sstep(0.1, 0.3, wA(x, z)) * sstep(0.17, 0.05, bas(x, z)) * (0.45 - sstep(-0.3, 0.3, Math.sin(Math.atan2(z - 0.05, x - 0.05) * 24 + 1)));
  const isWater = (x: number, z: number) => land(x, z) < 0.45;
  const lvl = (x: number, z: number, wet: number, dryH: number) => {
    const q = land(x, z);
    return wet + (dryH - wet) * sstep(0.43, 0.48, q) + (q > 0.47 ? 0.008 * fbm(x * 22, 3, z * 22, 2) : 0);
  };
  const hf: HFn = (x, z) => {
    const dB = bas(x, z), L = LW * wA(x, z), kL = sstep(0.015, 0.035, L);
    let h = lvl(x, z, UR, UP);
    if (kL > 0 && dB < L + 0.002) h = h + (lvl(x, z, LR, LL) - h) * sstep(L + 0.002, L - 0.012, dB) * kL;
    if (dB < 0.002) h = h + (BW - h) * sstep(0.002, -0.013, dB);
    return h;
  };
  const upW = '#9a6a42', baW = '#86593a';
  ground(gp, hf, '#3f7a34', (x, y, z, _nx, ny) => {
    const hy = y - Y0, n = fbm(x * 14, hy * 30, z * 14, 2), dB = bas(x, z);
    if (hy < BW + 0.002 && ny > 0.8) {
      const fo = 1 - sstep(-0.004, -0.08, dB);
      return mx(wcol(baW, x, z, 1.4, 2, 0.1), '#f3ebe0', Math.min(0.8, fo * (0.35 + n)));
    }
    if (ny < 0.7) return n > 0.55 ? '#4b3a2e' : vnoise(x * 40, hy * 30, z * 40) > 0.6 ? '#3f5f2c' : '#3e3029';
    const wet = isWater(x, z);
    if (wet && (Math.abs(hy - UR) < 0.003 || Math.abs(hy - LR) < 0.003)) {
      const L = LW * wA(x, z), lip = Math.min(Math.abs(dB - L), Math.abs(dB));
      return mx(wcol(upW, x, z, 1.3, -0.4, 0.1), '#f3ebe0', sstep(0.05, 0.0, lip) * sstep(0.3, 0.8, vnoise(x * 50, z * 50, 9)) * 0.7);
    }
    if (land(x, z) < 0.5) return '#8e4a2c';
    return n > 0.62 ? '#2f6a2b' : n < 0.38 ? '#4b8a36' : '#3c7a31';
  }, (y, x, z) => {
    const hy = y - Y0;
    if (y < Y0) return '#2e2622';
    if (bas(x, z) < -0.004) return hy < BW * 0.5 ? '#6e472e' : baW;
    if (hy > UP - 0.016) return '#8e3f22';
    return hy > LL - 0.012 && hy < LL ? '#7a3a22' : hy > 0.07 ? '#4a3a32' : '#3f322c';
  }, { n: 84, smooth: true, bands: [Y0, Y0 + BW, Y0 + 0.07, Y0 + LL - 0.012, Y0 + LL, Y0 + UP - 0.016] });
  const gy = (x: number, z: number) => Y0 + hf(x, z);

  // Outward (away from the basin) normals along the chain
  const nOut = (i: number): P2 => {
    const a = chain[Math.max(0, i - 1)], b = chain[Math.min(chain.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let nx = (b[1] - a[1]) / l, nz = -(b[0] - a[0]) / l;
    const p = chain[i];
    if (bas(p[0] + nx * 0.02, p[1] + nz * 0.02) < bas(p[0] - nx * 0.02, p[1] - nz * 0.02)) { nx = -nx; nz = -nz; }
    return [nx, nz];
  };
  const foam: Item[] = [], mist: Item[] = [];
  const fcol = { water: '#d2ae84', deep: '#9a6a42' };
  const nArg = argB.length;
  // Garganta del Diablo: the whole U plus the Argentine tail where the ledge has pinched out
  const throatLip = chain.filter((p, i) => (i >= nArg - 1 && i < nArg + thr.length + 4) || (i < nArg && wA(p[0], p[1]) * LW < 0.02));
  falls(gp, { lip: throatLip, top: Y0 + UR, bot: Y0 + BW, bow: 0.025, out: bas, ...fcol, seed: 21, rows: 11, foam, mist, mistH: 0.1, white: 0.2, spacing: 0.006 });
  // Argentine arc: upper and lower tiers broken into separate cascades by jungle-clad outcrops
  const upA: P2[] = [], loB: P2[] = [];
  for (let i = 0; i < nArg; i++) {
    const p = chain[i], L = LW * wA(p[0], p[1]);
    if (L < 0.035) continue;
    const [nx, nz] = nOut(i);
    upA.push([p[0] + nx * (L - 0.004), p[1] + nz * (L - 0.004)]);
    loB.push([p[0] - nx * 0.002, p[1] - nz * 0.002]);
  }
  let seed = 30;
  for (const r of runs(upA, p => isWater(p[0] - 0.02 * Math.sign(p[0]), p[1]), 3))
    falls(gp, { lip: r, top: Y0 + UR, bot: Y0 + LR, bow: 0.012, out: (x, z) => bas(x, z) - LW * wA(x, z), ...fcol, seed: seed++, rows: 7, foam, white: 0.15, spacing: 0.006 });
  for (const r of runs(loB, p => isWater(p[0] - 0.012, p[1]), 3))
    falls(gp, { lip: r, top: Y0 + LR, bot: Y0 + BW, bow: 0.012, out: bas, ...fcol, seed: seed++, rows: 8, foam, mist, mistH: 0.05, white: 0.15, spacing: 0.006 });
  // Brazilian side: two slender cascades off the cliff
  for (const [a, b] of [[nArg + thr.length + 9, nArg + thr.length + 12], [nArg + thr.length + 16, nArg + thr.length + 18]]) {
    const lip = chain.slice(a, b + 1);
    falls(gp, { lip, top: Y0 + UP - 0.006, bot: Y0 + BW, bow: 0.01, out: bas, ...fcol, seed: seed++, rows: 8, foam, white: 0.35, spacing: 0.005 });
  }
  // Boiling mist out of the throat
  const spray: Item[] = [];
  for (let i = 0; i < 40; i++) {
    const a = -Math.PI * (0.1 + hash3(i, 51, 1) * 0.8), r = hash3(i, 51, 2) * 0.09, t = hash3(i, 51, 3);
    const s2 = 0.03 + t * 0.03 + hash3(i, 51, 4) * 0.02;
    spray.push({ p: [Math.cos(a) * r, Y0 + 0.06 + t * 0.28, -0.2 + Math.sin(a) * r * 0.8 + t * 0.03], s: [s2 * 1.3, s2, s2 * 1.3], c: '#ffffff' });
  }
  inst(gp, ICO(), foam, { flat: true, jit: 0.3 });
  inst(gp, MIST(), mist, { opacity: 0.15, basic: true });
  inst(gp, SPH(), spray, { opacity: 0.1, basic: true });
  rainbow(gp, 0.02, Y0 + BW, -0.05, 0.11, 0.02, 0.2, 0.35, Math.PI - 0.35);

  // Walkways: Garganta catwalk over the upper river; Brazilian lower walkway into the spray; lookout tower
  const bx: Item[] = [], bb: Item[] = [];
  const walk = (pts: P2[], y: number, post: number) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], l = Math.hypot(x1 - x0, z1 - z0), ry = -Math.atan2(z1 - z0, x1 - x0);
      bx.push({ p: [(x0 + x1) / 2, y, (z0 + z1) / 2], s: [l + 0.002, 0.003, 0.013], c: '#b9b3a6', r: [0, ry, 0] });
      for (const sgn of [-1, 1]) {
        const ox = -Math.sin(-ry) * 0.006 * sgn, oz = Math.cos(-ry) * 0.006 * sgn;
        bx.push({ p: [(x0 + x1) / 2 + ox, y + 0.007, (z0 + z1) / 2 + oz], s: [l + 0.002, 0.0012, 0.0012], c: '#5b6470', r: [0, ry, 0] });
        if (i % 2 === 0) bx.push({ p: [x0 + ox, y + 0.0035, z0 + oz], s: [0.0012, 0.007, 0.0012], c: '#5b6470' });
      }
      if (i % 3 === 0) bx.push({ p: [x0, (y + post) / 2, z0], s: [0.0025, y - post, 0.0025], c: '#8a857a' });
    }
  };
  const cat = path([[-0.33, -0.33], [-0.24, -0.27], [-0.16, -0.24], [-0.11, -0.2]], 12);
  walk(cat, Y0 + UR + 0.012, Y0 + UR - 0.01);
  bx.push({ p: [-0.1, Y0 + UR + 0.012, -0.195], s: [0.04, 0.003, 0.03], c: '#b9b3a6', r: [0, 0.6, 0] });
  const lw = path([[0.19, -0.04], [0.14, -0.07], [0.09, -0.09], [0.06, -0.09]], 10);
  walk(lw, Y0 + BW + 0.014, Y0);
  bx.push({ p: [0.065, Y0 + BW + 0.014, -0.09], s: [0.03, 0.003, 0.026], c: '#b9b3a6' });
  const ex = 0.205, ez = -0.035;
  bx.push({ p: [ex, Y0 + (BW + UP) / 2 + 0.01, ez], s: [0.022, UP - BW + 0.02, 0.022], c: '#d6d0c2' });
  bx.push({ p: [ex - 0.006, Y0 + UP + 0.022, ez], s: [0.04, 0.004, 0.03], c: '#7a4a32' });
  const fig: [number, number, number][] = [];
  for (let k = 0; k < 6; k++) fig.push([-0.112 + (k % 3) * 0.008, Y0 + UR + 0.0135, -0.2 + Math.floor(k / 3) * 0.009]);
  for (let k = 0; k < 4; k++) fig.push([0.06 + (k % 2) * 0.008, Y0 + BW + 0.0155, -0.095 + Math.floor(k / 2) * 0.009]);
  for (let k = 0; k < 5; k++) { const [x, z] = cat[2 + k * 2]; fig.push([x, Y0 + UR + 0.0135, z]); }
  bx.push(...people(fig, 12, ['#facc15', '#f97316', '#22c55e', '#3b82f6', '#f8fafc']));
  bb.push(...heads(fig));
  // Inflatable adventure boat nosing toward the throat
  bx.push({ p: [0.02, Y0 + BW + 0.003, -0.02], s: [0.045, 0.006, 0.018], c: '#374151', r: [0, 1.3, 0] });
  for (let k = 0; k < 6; k++) bb.push({ p: [0.02 + (k % 2 - 0.5) * 0.008 + Math.cos(1.3) * (Math.floor(k / 2) - 1) * 0.011, Y0 + BW + 0.009, -0.02 - Math.sin(1.3) * (Math.floor(k / 2) - 1) * 0.011], s: [0.0035, 0.0035, 0.0035], c: '#f59e0b' });
  // Jungle canopy: dense blobs on dry ground (upper plateau, ledges, Brazilian side) + a few emergent palms
  const blob: Item[] = [], fronds: Item[] = [], trunks: Item[] = [];
  for (let i = 0; i < 600; i++) {
    const a = hash3(i, 53, 1) * Math.PI * 2, r = Math.sqrt(hash3(i, 53, 2)) * 0.48, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const dB = bas(x, z), L = LW * wA(x, z);
    if (dB < 0.01 || land(x, z) < 0.5 || (L > 0.02 && Math.abs(dB - L) < 0.012)) continue;
    if (Math.hypot(x - ex, z - ez) < 0.03) continue;
    const y = gy(x, z), sc = 0.022 + hash3(i, 53, 3) * 0.018, c = ['#2b6a2b', '#3b7d31', '#24582a', '#4f8f38', '#5c9a3c'][Math.floor(hash3(i, 53, 4) * 5)];
    if (hash3(i, 53, 5) > 0.93) {
      const th = sc * 2.2;
      trunks.push({ p: [x, y + th / 2, z], s: [0.0022, th, 0.0022], c: '#7a6a52' });
      for (let k = 0; k < 5; k++) { const fa = k * 1.26 + i; fronds.push({ p: [x + Math.cos(fa) * 0.008, y + th, z + Math.sin(fa) * 0.008], s: [0.018, 0.002, 0.005], c: '#3f8a3a', r: [0, -fa, -0.35] }); }
    } else blob.push({ p: [x, y + sc * 0.4, z], s: [sc * 0.55, sc * 0.45, sc * 0.55], c, r: [0, i, 0] });
  }
  // Toucans and morpho butterflies
  toucan(bx, bb, -0.3, gy(-0.3, -0.42) + 0.03, -0.38, 0.5);
  toucan(bx, bb, 0.3, gy(0.3, 0.12) + 0.03, 0.12, 2.6);
  for (let k = 0; k < 6; k++) {
    const x = -0.15 + hash3(k, 55, 1) * 0.35, z = -0.1 + hash3(k, 55, 2) * 0.35;
    bx.push({ p: [x, Y0 + 0.1 + hash3(k, 55, 3) * 0.08, z], s: [0.008, 0.0008, 0.005], c: '#2f6fe8', r: [0.3, k, 0.4] });
  }
  inst(gp, ICO(), blob, { jit: 0.3 });
  inst(gp, BOXG(), [...fronds, ...trunks, ...bx], { flat: true });
  inst(gp, SPHL(), bb);
};

// =========================================================================================================
// Great Barrier Reef — half-water diorama: translucent turquoise sea over a coral garden (table, staghorn, brain,
// fan, massive & soft corals), reef flat with the Heart Reef, a vegetated sand cay, green turtle, fish, dive boat.
const BRAIN = () => g('wt:brain', () => {
  const q = new THREE.SphereGeometry(1, 26, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  q.deleteAttribute('uv'); q.deleteAttribute('normal');
  const m = mergeV(q), p = m.getAttribute('position'), col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    // Meandering ridges = contour lines of a low-frequency noise field
    const gr = 0.5 + 0.5 * Math.sin(fbm(x * 1.5 + 5, y * 1.5, z * 1.5, 2) * 22), k = 1 - 0.06 * (1 - gr) * Math.min(1, y * 5);
    p.setXYZ(i, x * k, y * k, z * k);
    const c = 0.66 + 0.34 * gr;
    col[i * 3] = c; col[i * 3 + 1] = c; col[i * 3 + 2] = c * 0.94;
  }
  m.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return m;
});
const TCYL = () => g('wt:tcyl', () => { const q = new THREE.CylinderGeometry(0.6, 1, 1, 5, 1, true); q.deleteAttribute('uv'); return q; });
const TABLE = () => g('wt:table', () => { const q = new THREE.CylinderGeometry(1, 0.75, 1, 14); q.deleteAttribute('uv'); return q; });
const TAIL = () => g('wt:tail', () => new THREE.ConeGeometry(1, 1, 3));

/** Green sea turtle (merged parts), heading along local +x rotated by yaw `a`. */
function turtle(sph2: Item[], sph: Item[], hex: Item[], x: number, y: number, z: number, a: number, s: number): void {
  const ca = Math.cos(a), sa = Math.sin(a);
  const L = (lx: number, ly: number, lz: number): [number, number, number] => [x + (lx * ca + lz * sa) * s, y + ly * s, z + (-lx * sa + lz * ca) * s];
  const S = (q: [number, number, number]): [number, number, number] => [q[0] * s, q[1] * s, q[2] * s];
  sph2.push({ p: L(0, 0, 0), s: S([0.05, 0.017, 0.039]), c: '#6a5432', r: [0, a, 0] });
  sph.push({ p: L(0.002, -0.006, 0), s: S([0.047, 0.009, 0.035]), c: '#d9c58f', r: [0, a, 0] });
  const sc: [number, number, number][] = [[-0.024, 0, 0.011], [0, 0, 0.012], [0.024, 0, 0.011], [-0.013, 0.02, 0.01], [0.013, 0.02, 0.01], [-0.013, -0.02, 0.01], [0.013, -0.02, 0.01]];
  for (const [lx, lz, w] of sc) {
    const yy = lz === 0 ? 0.0148 : 0.011, bank = lz * 18;
    hex.push({ p: L(lx, yy, lz), s: S([w, 0.003, w * 0.9]), c: lz === 0 ? '#93733f' : '#86683a', r: [bank, a, 0], yo: true });
  }
  const skin = '#7d7a4e';
  sph.push({ p: L(0.05, 0.001, 0), s: S([0.013, 0.009, 0.011]), c: skin, r: [0, a, 0] });
  sph.push({ p: L(0.066, 0.003, 0), s: S([0.017, 0.012, 0.0125]), c: '#8a8657', r: [0, a, 0] });
  for (const sd of [-1, 1]) {
    sph.push({ p: L(0.012, -0.002, sd * 0.052), s: S([0.012, 0.0035, 0.04]), c: skin, r: [sd * 0.3, a + sd * 0.55, 0], yo: true });
    sph.push({ p: L(-0.048, -0.003, sd * 0.02), s: S([0.017, 0.003, 0.009]), c: skin, r: [0, a - sd * 0.6, 0] });
    sph.push({ p: L(0.074, 0.006, sd * 0.009), s: S([0.0025, 0.0025, 0.0025]), c: '#1a1a14' });
  }
}

const reef: Builder = gp => {
  const WS = 0.25, WY = Y0 + WS;
  // Heart Reef: a heart-shaped coral ring just breaking the surface in the open lagoon, turned to face the viewer
  const HX = -0.2, HZ = -0.03, HS = 0.1;
  const heartD = sdf(Array.from({ length: 72 }, (_, i) => {
    const t = (i / 72) * Math.PI * 2, u = (16 * Math.sin(t) ** 3) / 17, v = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.15;
    return [HX + HS * (u * 0.83 + v * 0.56), HZ + HS * (u * 0.56 - v * 0.83)] as P2;
  }), 110);
  const heart = (x: number, z: number, k: number) => (k === 1 ? sstep(0.03, 0, heartD(x, z)) : sstep(-0.024, -0.034, heartD(x, z)));
  const CX = 0.22, CZ = -0.29;
  const cayD = (x: number, z: number) => Math.hypot((x - CX) / 0.13, (z - CZ) / 0.075);
  // Bommies: [x, z, radius, height]
  const BOM: [number, number, number, number][] = [[0.04, 0.24, 0.11, 0.1], [0.3, 0.04, 0.06, 0.055], [-0.35, 0.22, 0.05, 0.035]];
  const platT = (x: number, z: number, n: number) => sstep(0.06, -0.06, z + 0.09 + 0.03 * Math.sin(x * 13 + n * 4) + 0.025 * Math.sin(x * 5 + 1));
  const H: HFn = (x, z) => {
    const n = fbm(x * 6, 1.3, z * 6, 3);
    let h = 0.045 + 0.02 * (n - 0.5) - 0.02 * sstep(0.05, 0.35, -x * 0.6 + z * 0.8);
    const pl = platT(x, z, n);
    h += (0.212 + 0.012 * (n - 0.5) - h) * pl;
    const ho = heart(x, z, 1);
    const hm = sstep(0.26, 0.1, Math.hypot(x - HX, z - HZ));
    if (hm > 0) {
      const base = 0.05 + (WS - 0.13) * hm + 0.012 * (n - 0.5);
      h = Math.max(h, base + (WS + 0.005 - base) * ho - 0.036 * heart(x, z, 0.55));
    }
    for (const [bx, bz, r, top] of BOM) {
      const d = Math.hypot(x - bx, (z - bz) * 1.1) / r;
      if (d < 1.3) h = Math.max(h, 0.035 + top * sstep(1.25, 0.2, d) + 0.014 * (n - 0.5));
    }
    const dc = cayD(x, z);
    if (dc < 1.6) h = Math.max(h, 0.19 + 0.095 * sstep(1.5, 0.35, dc));
    return h;
  };
  const gy = (x: number, z: number) => Y0 + H(x, z);
  ground(gp, H, '#e6d9ae', (x, y, z, _nx, ny) => {
    const h = y - Y0, n = fbm(x * 14, 2.2, z * 14, 2);
    const dc = cayD(x, z);
    if (h > WS - 0.004 && dc < 1.6) return dc < 0.8 ? mx('#6f8a44', '#93a05a', n) : mx('#f6ecce', '#eadcb2', n);
    if (h > 0.15 && heartD(x, z) < 0.006) return heart(x, z, 0.55) > 0.5 ? mx('#e0d3a6', '#a88a5a', sstep(0.6, 0.75, n)) : mx('#5e4a30', '#857446', n);
    if (h > 0.18) {
      const m = fbm(x * 11 + 3, 0.7, z * 11, 3);
      return mx(mx('#78603f', '#968a50', n), '#dccfa4', sstep(0.5, 0.58, m));
    }
    if (ny < 0.8) return mx('#8b765c', '#86688a', sstep(0.4, 0.62, n));
    const [f1, f2] = worley(x * 15, 0.3, z * 15);
    return mx(mx('#e3d5a8', '#cbb98c', sstep(0.55, 0.7, n)), '#fff8dc', 0.55 * sstep(0.2, 0.03, f2 - f1));
  }, y => (y < Y0 ? '#4d4436' : y < Y0 + 0.03 ? '#b9a27a' : y < Y0 + 0.08 ? '#dccb9f' : y < Y0 + 0.15 ? '#a68d6a' : y < Y0 + 0.215 ? '#8f7a6a' : '#e9dcb4'),
  { n: 74, smooth: true, bands: [Y0, Y0 + 0.03, Y0 + 0.08, Y0 + 0.15, Y0 + 0.215] });

  // ---- Sea: surface sheet tinted by depth (shallow flats glow turquoise like the aerial view) + side wall
  {
    const N = 36, pos: number[] = [], col: number[] = [], idx: number[] = [], c = new THREE.Color();
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      const u = -1 + (2 * i) / N, v = -1 + (2 * j) / N;
      const x = 0.5 * u * Math.sqrt(1 - (v * v) / 2), z = 0.5 * v * Math.sqrt(1 - (u * u) / 2);
      const d = WS - H(x, z);
      pos.push(x, WY + 0.0015 * Math.sin(x * 62 + z * 23) * Math.sin(z * 41 - x * 9), z);
      c.copy(C(wcol(mx('#a6f0e2', '#1c8fc4', sstep(0.012, 0.16, d)), x, z, 1, 0.35, 0.22)));
      col.push(c.r, c.g, c.b);
    }
    const vi = (i: number, j: number) => j * (N + 1) + i;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const a = vi(i, j), b = vi(i + 1, j), cc = vi(i, j + 1), dd = vi(i + 1, j + 1);
      if ((i < N / 2) === (j < N / 2)) idx.push(a, cc, b, b, cc, dd); else idx.push(a, cc, dd, a, dd, b);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    add(gp, geo, tmat(0.46, { vc: true, rough: 0.08 }), 0, 0, 0, 1, 1, 1);
    const M = 128, rows = [0, 0.55, 0.93, 1], wp: number[] = [], wc: number[] = [], wi: number[] = [];
    const rc = ['#0560a8', '#0a8ccc', '#22c0e0', '#d8fcff'];
    for (let i = 0; i <= M; i++) {
      const a = (i / M) * Math.PI * 2, x = Math.cos(a) * 0.5005, z = Math.sin(a) * 0.5005, b = Math.min(WY, gy(x * 0.998, z * 0.998));
      rows.forEach((r, k) => { wp.push(x, b + (WY - b) * r, z); c.copy(C(rc[k])); wc.push(c.r, c.g, c.b); });
    }
    const R = rows.length;
    for (let i = 0; i < M; i++) for (let k = 0; k < R - 1; k++) {
      const a = i * R + k, b = (i + 1) * R + k;
      wi.push(a, a + 1, b, b, a + 1, b + 1);
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
    wg.setAttribute('color', new THREE.Float32BufferAttribute(wc, 3));
    wg.setIndex(wi);
    wg.computeVertexNormals();
    add(gp, wg, tmat(0.36, { vc: true, basic: true }), 0, 0, 0, 1, 1, 1);
  }

  // ---- Corals
  const tab: Item[] = [], cylI: Item[] = [], br: Item[] = [], lump: Item[] = [], brain: Item[] = [], box: Item[] = [], sphL: Item[] = [], sph: Item[] = [], sph2: Item[] = [], fishB: Item[] = [], tails: Item[] = [], foam: Item[] = [], blob: Item[] = [];
  const TC = ['#ea7350', '#d8506a', '#f2a052', '#b86ad2', '#f0c46a', '#7ab8e8', '#e88aa8'];
  const table = (x: number, y: number, z: number, r: number, c: string, st: number, seed: number) => {
    cylI.push({ p: [x, y + st / 2, z], s: [r * 0.1, st, r * 0.1], c: sh(c, 0.7) });
    const tl: [number, number, number] = [(hash3(seed, 1, 1) - 0.5) * 0.16, hash3(seed, 1, 2) * 6, (hash3(seed, 1, 3) - 0.5) * 0.16];
    tab.push({ p: [x, y + st, z], s: [r, 0.007, r], c: mx(c, '#fff1e2', 0.55), r: tl });
    tab.push({ p: [x, y + st + 0.0035, z], s: [r * 0.88, 0.005, r * 0.88], c, r: tl });
  };
  const stag = (x: number, y: number, z: number, s: number, c: string, tip: string, seed: number, nb0 = 8) => {
    const nb = nb0 + Math.floor(hash3(seed, 2, 1) * 5);
    const branch = (bx: number, by: number, bz: number, a: number, t: number, L: number, w: number) => {
      const dx = -Math.sin(t) * Math.cos(a), dy = Math.cos(t), dz = Math.sin(t) * Math.sin(a);
      br.push({ p: [bx + (dx * L) / 2, by + (dy * L) / 2, bz + (dz * L) / 2], s: [w, L, w], c, r: [0, a, t] });
      br.push({ p: [bx + dx * (L + w * 1.2), by + dy * (L + w * 1.2), bz + dz * (L + w * 1.2)], s: [w * 0.85, w * 2.6, w * 0.85], c: tip, r: [0, a, t] });
      return [bx + dx * L * 0.55, by + dy * L * 0.55, bz + dz * L * 0.55];
    };
    for (let k = 0; k < nb; k++) {
      const a = hash3(seed, k, 3) * 6.283, t = 0.15 + hash3(seed, k, 4) * 0.75, L = s * (0.55 + hash3(seed, k, 5) * 0.5), w = s * 0.055;
      const ro = s * 0.18 * hash3(seed, k, 6);
      const m = branch(x + Math.cos(a) * ro, y, z - Math.sin(a) * ro, a, t, L, w);
      if (hash3(seed, k, 7) > (nb0 < 8 ? 0.7 : 0.35)) branch(m[0], m[1], m[2], a + (hash3(seed, k, 8) - 0.5) * 1.6, Math.min(1.2, t + 0.45), L * 0.5, w * 0.85);
    }
  };
  const fan = (x: number, y: number, z: number, s: number, a: number, c: string, seed: number) => {
    const ca = Math.cos(a), sa = Math.sin(a);
    const W = (lx: number, ly: number): [number, number, number] => [x + lx * ca, y + ly, z - lx * sa];
    for (let k = 0; k < 7; k++) {
      const b = -1 + (k / 6) * 2 + (hash3(seed, k, 1) - 0.5) * 0.15, L = s * (0.85 + hash3(seed, k, 2) * 0.25);
      box.push({ p: W((Math.sin(b) * L) / 2, (Math.cos(b) * L) / 2), s: [0.0022, L, 0.0016], c, r: [0, a, -b] });
    }
    for (const rr of [0.5, 0.88]) for (let k = 0; k < 7; k++) {
      const b0 = -1 + (k / 7) * 2, b1 = -1 + ((k + 1) / 7) * 2, bm = (b0 + b1) / 2, R = rr * s;
      box.push({ p: W(Math.sin(bm) * R, Math.cos(bm) * R), s: [0.0016, R * (b1 - b0) * 1.05, 0.0013], c: sh(c, 1.1), r: [0, a, -(bm + Math.PI / 2)] });
    }
  };
  const massive = (x: number, y: number, z: number, r: number, c: string) => lump.push({ p: [x, y + r * 0.25, z], s: [r, r * 0.7, r], c, r: [0, x * 40, 0] });
  const brainC = (x: number, y: number, z: number, r: number, c: string) => brain.push({ p: [x, y - r * 0.08, z], s: [r, r * 0.78, r], c, r: [0, z * 50, 0] });
  const soft = (x: number, y: number, z: number, r: number, c: string) => {
    cylI.push({ p: [x, y + r * 0.4, z], s: [r * 0.35, r * 0.8, r * 0.35], c: sh(c, 0.85) });
    sphL.push({ p: [x, y + r * 0.85, z], s: [r, r * 0.3, r], c });
  };

  // Hero bommie (front-centre): tiered table corals over a lumpy massive-coral pedestal, like Flynn Reef outcrops
  const [bxc, bzc] = [BOM[0][0], BOM[0][1]], top = gy(bxc, bzc);
  table(bxc - 0.01, top - 0.006, bzc - 0.01, 0.07, TC[0], 0.03, 1);
  table(bxc + 0.075, top - 0.05, bzc + 0.045, 0.055, TC[1], 0.04, 2);
  table(bxc - 0.08, top - 0.05, bzc + 0.05, 0.05, TC[2], 0.035, 3);
  table(bxc + 0.04, top - 0.02, bzc - 0.07, 0.045, TC[4], 0.045, 4);
  table(bxc - 0.06, top - 0.07, bzc - 0.06, 0.045, TC[3], 0.05, 5);
  stag(bxc + 0.005, top + 0.03, bzc, 0.05, '#c98a62', '#f6dcc4', 11);
  stag(bxc + 0.09, gy(bxc + 0.09, bzc - 0.02), bzc - 0.02, 0.04, '#9a7cc8', '#e9dcff', 12);
  stag(bxc - 0.1, gy(bxc - 0.1, bzc - 0.01), bzc - 0.01, 0.04, '#c07a52', '#f4d6b8', 13);
  brainC(bxc - 0.03, gy(bxc - 0.03, bzc + 0.09), bzc + 0.09, 0.03, '#c9a65e');
  massive(bxc + 0.03, gy(bxc + 0.03, bzc + 0.08), bzc + 0.08, 0.026, '#b07ad0');
  massive(bxc - 0.11, gy(bxc - 0.11, bzc + 0.08), bzc + 0.08, 0.022, '#d9a35a');
  fan(bxc + 0.12, gy(bxc + 0.12, bzc + 0.06), bzc + 0.06, 0.06, 0.6, '#c2386a', 21);
  fan(bxc - 0.13, gy(bxc - 0.13, bzc - 0.03), bzc - 0.03, 0.055, -0.4, '#e0742a', 22);
  soft(bxc + 0.07, gy(bxc + 0.07, bzc + 0.11), bzc + 0.11, 0.016, '#d9c44a');
  // Anemone with clownfish on the front flank
  {
    const ax = bxc - 0.07, az = bzc + 0.12, ay = gy(ax, az);
    cylI.push({ p: [ax, ay + 0.004, az], s: [0.02, 0.008, 0.02], c: '#c76a96' });
    for (let k = 0; k < 22; k++) {
      const a = hash3(k, 61, 1) * 6.283, r = 0.004 + hash3(k, 61, 2) * 0.014, t = 0.2 + r * 30;
      br.push({ p: [ax + Math.cos(a) * r, ay + 0.013, az - Math.sin(a) * r], s: [0.0022, 0.014, 0.0022], c: '#f2cbe0', r: [0, a, t] });
    }
    for (const [ox, oy, oz, fa] of [[0.012, 0.03, 0.01, 2.5], [-0.01, 0.024, 0.016, 0.4]]) {
      const fx = ax + ox, fy = ay + oy, fz = az + oz;
      fishB.push({ p: [fx, fy, fz], s: [0.009, 0.0055, 0.0032], c: '#f26a1b', r: [0, fa, 0] });
      for (const d of [0.004, -0.002]) box.push({ p: [fx + Math.cos(fa) * d, fy, fz - Math.sin(fa) * d], s: [0.0013, 0.0105, 0.0066], c: '#ffffff', r: [0, fa, 0] });
      tails.push({ p: [fx - Math.cos(fa) * 0.01, fy, fz + Math.sin(fa) * 0.01], s: [0.004, 0.004, 0.0012], c: '#f26a1b', r: [0, fa, -Math.PI / 2] });
    }
  }
  // Giant clam (blue mantle) and blue starfish on the sand
  {
    const x = 0.15, z = 0.37, y = gy(x, z);
    sphL.push({ p: [x, y + 0.006, z + 0.006], s: [0.022, 0.012, 0.008], c: '#d6cdb8', r: [0.5, 0.3, 0] });
    sphL.push({ p: [x, y + 0.006, z - 0.006], s: [0.022, 0.012, 0.008], c: '#d6cdb8', r: [-0.5, 0.3, 0] });
    sphL.push({ p: [x, y + 0.012, z], s: [0.02, 0.004, 0.007], c: '#2f6ad8', r: [0, 0.3, 0] });
  }
  for (const [x, z, a] of [[0.31, 0.27, 0.3], [-0.2, 0.4, 1.1], [0.36, -0.06, 2]]) {
    const y = gy(x, z) + 0.002;
    for (let k = 0; k < 5; k++) { const b = a + (k * 6.283) / 5; box.push({ p: [x + Math.cos(b) * 0.008, y, z - Math.sin(b) * 0.008], s: [0.016, 0.0025, 0.0035], c: '#2f6de0', r: [0, b, 0] }); }
  }

  // Scattered coral garden: dense on the reef flat and its spur-and-groove edge, sparser on the lagoon sand
  const placed: [number, number, number][] = [[bxc, bzc, 0.15], [CX, CZ, 0.16], [HX, HZ, 0.11]];
  const cnt = [0, 0, 0];
  for (let i = 0; i < 520; i++) {
    const a = hash3(i, 71, 1) * 6.283, rr = Math.sqrt(hash3(i, 71, 2)) * 0.47, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    const h = H(x, z), flat = h > 0.18, kind = hash3(i, 71, 3), sz = hash3(i, 71, 4);
    if (h > WS - 0.03 || hash3(i, 71, 5) > (flat ? 0.5 : 0.85)) continue;
    const r = flat ? 0.014 + sz * 0.022 : 0.018 + sz * 0.03;
    if (placed.some(([px, pz, pr]) => Math.hypot(x - px, z - pz) < (pr + r) * 0.75)) continue;
    placed.push([x, z, r]);
    const y = Y0 + h, c = TC[Math.floor(hash3(i, 71, 6) * TC.length)];
    if (kind < 0.24) table(x, y, z, r * 1.3, c, 0.01 + sz * 0.025, i);
    else if (kind < 0.46 && cnt[0]++ < 20) stag(x, y, z, r * 1.2, ['#c98a62', '#a07fc8', '#d9a35c', '#7fa6d8'][i % 4], ['#f6dcc4', '#efe2ff', '#fff0c8', '#e0f2ff'][i % 4], i, 5);
    else if (kind < 0.62) massive(x, y, z, r * 0.9, ['#d9a35a', '#b07ad0', '#e0b860', '#d07f68'][i % 4]);
    else if (kind < 0.74 && cnt[1]++ < 6) brainC(x, y, z, r * 0.75, ['#c9a65e', '#9fb35e', '#b98e8a'][i % 3]);
    else if (kind < 0.86) soft(x, y, z, r * 0.7, ['#d9c44a', '#9cc06a', '#e4a6c6'][i % 3]);
    else if (!flat && kind >= 0.86 && cnt[2]++ < 9) fan(x, y, z, r * 1.8, kind * 20, ['#c2386a', '#e0742a', '#8a3fb0'][i % 3], i);
    else massive(x, y, z, r * 0.8, '#9a7a5a');
  }

  // ---- Life: green turtle, fish schools, parrotfish
  turtle(sph2, sph, cylI, -0.2, Y0 + 0.13, 0.31, -0.35, 1.25);
  const fish = (x: number, y: number, z: number, a: number, len: number, c: string, tc: string) => {
    fishB.push({ p: [x, y, z], s: [len * 0.5, len * 0.22, len * 0.12], c, r: [0, a, 0] });
    tails.push({ p: [x - Math.cos(a) * len * 0.55, y, z + Math.sin(a) * len * 0.55], s: [len * 0.24, len * 0.26, len * 0.04], c: tc, r: [0, a, -Math.PI / 2] });
  };
  const school = (cx: number, cy: number, cz: number, R: number, n: number, a: number, len: number, c: string, tc: string, seed: number) => {
    for (let k = 0; k < n; k++) {
      const u = hash3(k, seed, 1) - 0.5, v = hash3(k, seed, 2) - 0.5, w = hash3(k, seed, 3) - 0.5;
      fish(cx + u * R * 2, cy + v * R * 0.7, cz + w * R * 1.4, a + (hash3(k, seed, 4) - 0.5) * 0.3, len * (0.85 + hash3(k, seed, 5) * 0.3), c, tc);
    }
  };
  school(0.22, Y0 + 0.19, 0.2, 0.06, 20, 2.7, 0.022, '#3b7fe0', '#facc15', 81);
  school(-0.3, Y0 + 0.1, 0.12, 0.045, 14, -0.4, 0.017, '#facc15', '#f8fafc', 82);
  school(0.02, Y0 + 0.235, 0.12, 0.05, 14, 1.2, 0.012, '#7dd3fc', '#bae6fd', 83);
  fish(0.2, Y0 + 0.1, 0.27, 2.9, 0.04, '#2fb39a', '#e07aa0');
  fish(-0.3, Y0 + 0.1, 0.24, 0.3, 0.036, '#39a0c8', '#f2a65a');
  fish(0.1, Y0 + 0.08, 0.33, 3.4, 0.026, '#f4d03f', '#1f2937');

  // ---- Sand cay: beach, pisonia/palm vegetation, research hut, seabirds; surf ring + reef-crest breakers
  for (let i = 0; i < 60; i++) {
    const a = hash3(i, 91, 1) * 6.283, d = Math.sqrt(hash3(i, 91, 2)) * 0.72;
    const x = CX + Math.cos(a) * d * 0.13, z = CZ + Math.sin(a) * d * 0.075, y = gy(x, z), s = 0.016 + hash3(i, 91, 3) * 0.012;
    if (Math.hypot(x - CX - 0.045, z - CZ - 0.02) < 0.022) continue;
    blob.push({ p: [x, y + s * 0.45, z], s: [s * 0.62, s * 0.5, s * 0.62], c: ['#3f7f35', '#4f8f3a', '#2f6a2d', '#5f9a44'][i % 4], r: [0, i, 0] });
  }
  for (const [x, z, k] of [[CX - 0.1, CZ + 0.035, 0], [CX - 0.085, CZ - 0.03, 1], [CX + 0.1, CZ + 0.03, 2]]) {
    const y = gy(x, z), th = 0.05 + k * 0.006, lean = 0.25 * (k - 1);
    box.push({ p: [x + lean * th * 0.5, y + th / 2, z], s: [0.003, th, 0.003], c: '#8a7656', r: [0, 0, -lean] });
    for (let f = 0; f < 6; f++) { const fa = f * 1.05 + k; box.push({ p: [x + lean * th + Math.cos(fa) * 0.01, y + th, z - Math.sin(fa) * 0.01], s: [0.022, 0.0022, 0.006], c: '#3f8a3a', r: [0, fa, -0.4] }); }
  }
  {
    const x = CX + 0.045, z = CZ + 0.02, y = gy(x, z);
    box.push({ p: [x, y + 0.008, z], s: [0.03, 0.016, 0.02], c: '#f4f1ea' });
    box.push({ p: [x, y + 0.019, z], s: [0.034, 0.005, 0.024], c: '#b6463a', r: [0, 0, 0.0] });
    box.push({ p: [x + 0.004, y + 0.0225, z], s: [0.016, 0.0012, 0.012], c: '#1e3a8a', r: [0.25, 0, 0] });
  }
  for (let k = 0; k < 7; k++) box.push({ p: [CX - 0.08 + hash3(k, 93, 1) * 0.2, WY + 0.09 + hash3(k, 93, 2) * 0.06, CZ + 0.05 + hash3(k, 93, 3) * 0.08], s: [0.012, 0.001, 0.0025], c: '#f8fafc', r: [0, hash3(k, 93, 4) * 6, (k % 2 ? 0.25 : -0.25)] });
  for (let k = 0; k < 44; k++) {
    const a = (k / 44) * 6.283;
    let d = 0.4;
    while (d < 1.6 && 0.19 + 0.095 * sstep(1.5, 0.35, d) > WS) d += 0.03;
    const x = CX + Math.cos(a) * d * 0.13, z = CZ + Math.sin(a) * d * 0.075, s = 0.008 + hash3(k, 95, 1) * 0.006;
    if (Math.hypot(x, z) < 0.49) foam.push({ p: [x, WY + 0.001, z], s: [s * 1.6, s * 0.25, s], c: '#ffffff', r: [0, a, 0] });
  }
  for (let k = 0; k < 30; k++) {
    const a = Math.PI + 0.25 + (k / 29) * (Math.PI - 0.5), r = 0.465 + hash3(k, 97, 1) * 0.02, s = 0.012 + hash3(k, 97, 2) * 0.01;
    foam.push({ p: [Math.cos(a) * r, WY + 0.0015, Math.sin(a) * r], s: [s * 1.8, s * 0.22, s * 0.8], c: hash3(k, 97, 3) > 0.5 ? '#ffffff' : '#e3f6f8', r: [0, -a + Math.PI / 2, 0] });
  }

  // ---- Dive boat on the surface with a diver and bubbles below
  {
    const x = 0.27, z = 0.22, a = 0.9, ca = Math.cos(a), sa = Math.sin(a);
    const L = (lx: number, ly: number, lz: number): [number, number, number] => [x + lx * ca + lz * sa, WY + ly, z - lx * sa + lz * ca];
    box.push({ p: L(0, 0.003, 0), s: [0.1, 0.016, 0.034], c: '#f8fafc', r: [0, a, 0] });
    sphL.push({ p: L(0.05, 0.003, 0), s: [0.018, 0.008, 0.017], c: '#f8fafc', r: [0, a, 0] });
    box.push({ p: L(0, 0.0115, 0), s: [0.101, 0.003, 0.035], c: '#1d4ed8', r: [0, a, 0] });
    box.push({ p: L(-0.012, 0.021, 0), s: [0.04, 0.016, 0.028], c: '#e5e7eb', r: [0, a, 0] });
    box.push({ p: L(-0.012, 0.03, 0), s: [0.046, 0.003, 0.032], c: '#0f766e', r: [0, a, 0] });
    box.push({ p: L(-0.04, 0.035, 0), s: [0.0015, 0.03, 0.0015], c: '#d1d5db', r: [0, a, 0] });
    box.push({ p: L(-0.033, 0.045, 0), s: [0.014, 0.009, 0.001], c: '#dc2626', r: [0, a, 0] });
    box.push({ p: L(-0.033, 0.045, 0), s: [0.016, 0.0018, 0.0012], c: '#ffffff', r: [0, a, 0] }); 
    const fig: [number, number, number][] = [L(0.025, 0.011, 0.008), L(-0.03, 0.011, -0.008)];
    box.push(...people(fig, 7, ['#f59e0b', '#111827']));
    sphL.push(...heads(fig));
    const dx = 0.3, dy = Y0 + 0.12, dz = 0.29, da = 2.4;
    box.push({ p: [dx, dy, dz], s: [0.032, 0.008, 0.01], c: '#111827', r: [0, da, 0.1] });
    box.push({ p: [dx + 0.002, dy + 0.007, dz], s: [0.016, 0.006, 0.006], c: '#facc15', r: [0, da, 0.1] });
    sphL.push({ p: [dx + Math.cos(da) * 0.02, dy + 0.002, dz - Math.sin(da) * 0.02], s: [0.0055, 0.0055, 0.0055], c: '#111827' });
    for (const sd of [-1, 1]) box.push({ p: [dx - Math.cos(da) * 0.025 + Math.sin(da) * sd * 0.004, dy - 0.002, dz + Math.sin(da) * 0.025 + Math.cos(da) * sd * 0.004], s: [0.014, 0.001, 0.005], c: '#0ea5e9', r: [0, da, 0.2] });
    for (let k = 0; k < 9; k++) foam.push({ p: [dx + Math.cos(da) * 0.02 + (hash3(k, 99, 1) - 0.5) * 0.008, dy + 0.012 + k * 0.012, dz - Math.sin(da) * 0.02 + (hash3(k, 99, 2) - 0.5) * 0.008], s: [0.002 + k * 0.0002, 0.002 + k * 0.0002, 0.002 + k * 0.0002], c: '#e0faff' });
  }

  inst(gp, TABLE(), tab, { jit: 0.12 });
  inst(gp, TCYL(), br);
  inst(gp, CYL(), cylI);
  inst(gp, SPHL(), lump, { jit: 0.3 });
  inst(gp, ICO(), blob, { jit: 0.35 });
  inst(gp, BRAIN(), brain);
  inst(gp, BOXG(), box, { flat: true });
  inst(gp, SPHL(), sphL);
  inst(gp, SPH(), sph);
  inst(gp, SPH2(), sph2);
  inst(gp, ICO(), fishB);
  inst(gp, TAIL(), tails, { flat: true });
  inst(gp, ICO(), foam, { opacity: 0.85 });
};

export const WATERS: Record<string, Builder> = { grandcanyon, niagara, victoriafalls, iguazu, reef };
