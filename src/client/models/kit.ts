import * as THREE from 'three';
import type { ModelRecipe } from '../../shared/data/types.ts';

// Every model is built from architectural & sculptural primitives at runtime (~1 unit tall, base at y=0, front +z)
// and baked into vertex-colored BufferGeometries per material look so detailed 3D architecture draws in 1–2 calls.
const mats = new Map<string, THREE.MeshStandardMaterial>();
export function mat(color: string, opts: { emissive?: string; transparent?: number; metal?: number; flat?: boolean; rough?: number } = {}): THREE.MeshStandardMaterial {
  const k = color + JSON.stringify(opts);
  let m = mats.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.rough ?? 0.65,
      metalness: opts.metal ?? 0.08,
      flatShading: opts.flat ?? true,
    });
    if (opts.emissive) { m.emissive = new THREE.Color(opts.emissive); m.emissiveIntensity = 0.85; }
    if (opts.transparent !== undefined) { m.transparent = true; m.opacity = opts.transparent; }
    mats.set(k, m);
  }
  return m;
}

const geos = new Map<string, THREE.BufferGeometry>();
function g<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let x = geos.get(key) as T | undefined;
  if (!x) { x = make(); geos.set(key, x); }
  return x;
}
const BOX = () => g('box', () => new THREE.BoxGeometry(1, 1, 1));
const CYL = (s = 8) => g('cyl' + s, () => new THREE.CylinderGeometry(0.5, 0.5, 1, s));
const CONE = (s = 8) => g('cone' + s, () => new THREE.ConeGeometry(0.5, 1, s));
const SPH = (s = 12) => g('sph' + s, () => new THREE.SphereGeometry(0.5, s, Math.max(6, Math.round(s * 0.65))));

function add(grp: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0, rx = 0, rz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  grp.add(mesh);
  return mesh;
}
const box = (p: THREE.Object3D, c: string, x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0, rx = 0, rz = 0) =>
  add(p, BOX(), mat(c), x, y + sy / 2, z, sx, sy, sz, ry, rx, rz);
const cyl = (p: THREE.Object3D, c: string, x: number, y: number, z: number, r: number, h: number, s = 10) =>
  add(p, CYL(s), mat(c), x, y + h / 2, z, r * 2, h, r * 2);
const cone = (p: THREE.Object3D, c: string, x: number, y: number, z: number, r: number, h: number, s = 10, ry = 0) =>
  add(p, CONE(s), mat(c), x, y + h / 2, z, r * 2, h, r * 2, ry);
const ball = (p: THREE.Object3D, c: string, x: number, y: number, z: number, sx: number, sy = sx, sz = sx, ry = 0, rx = 0, rz = 0) =>
  add(p, SPH(), mat(c), x, y, z, sx, sy, sz, ry, rx, rz);

function shade(hex: string, f: number): string {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return '#' + c.getHexString();
}

// ---- Architectural CAD Primitives ----

/** Tapered / leaning 6-face frustum box: bottom w0×d0 at y, top w1×d1 shifted by (ox,oz) at y+h. */
function tbox(
  p: THREE.Object3D, w0: number, d0: number, w1: number, d1: number, h: number,
  c: string, x = 0, y = 0, z = 0, ox = 0, oz = 0, ry = 0
): THREE.Mesh {
  const hw0 = w0 / 2, hd0 = d0 / 2, hw1 = w1 / 2, hd1 = d1 / 2;
  const v = [
    [-hw0, 0, -hd0], [hw0, 0, -hd0], [hw0, 0, hd0], [-hw0, 0, hd0],
    [ox - hw1, h, oz - hd1], [ox + hw1, h, oz - hd1], [ox + hw1, h, oz + hd1], [ox - hw1, h, oz + hd1],
  ];
  const faces = [[0, 3, 2, 1], [4, 5, 6, 7], [3, 7, 6, 2], [1, 5, 4, 0], [2, 6, 5, 1], [0, 4, 7, 3]];
  const pos: number[] = [];
  for (const [a, b, d, e] of faces) {
    pos.push(...v[a], ...v[b], ...v[d], ...v[a], ...v[d], ...v[e]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return add(p, geo, mat(c), x, y, z, 1, 1, 1, ry);
}

/** Gable roof prism (ridge along X, triangular gable ends on ±X). */
function gable(p: THREE.Object3D, w: number, h: number, d: number, c: string, x = 0, y = 0, z = 0, ry = 0): THREE.Mesh {
  const hw = w / 2, hd = d / 2;
  const v = [[-hw, 0, -hd], [hw, 0, -hd], [hw, 0, hd], [-hw, 0, hd], [-hw, h, 0], [hw, h, 0]];
  const tris = [[0, 3, 2], [0, 2, 1], [3, 4, 5], [3, 5, 2], [1, 5, 4], [1, 4, 0], [0, 4, 3], [2, 5, 1]];
  const pos: number[] = [];
  for (const [a, b, e] of tris) pos.push(...v[a], ...v[b], ...v[e]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return add(p, geo, mat(c), x, y, z, 1, 1, 1, ry);
}

/** 2D arch cutout path (rounded Roman arch or pointed Gothic/Mughal iwan arch) for extruded walls. */
function archPath(cx: number, cy: number, w: number, h: number, pointed = false): THREE.Path {
  const hw = w / 2, r = Math.min(hw, h * 0.55);
  const path = new THREE.Path();
  path.moveTo(cx - hw, cy);
  path.lineTo(cx - hw, cy + h - r);
  if (pointed) {
    path.quadraticCurveTo(cx - hw, cy + h - r * 0.15, cx, cy + h);
    path.quadraticCurveTo(cx + hw, cy + h - r * 0.15, cx + hw, cy + h - r);
  } else {
    path.absarc(cx, cy + h - r, hw, Math.PI, 0, true);
  }
  path.lineTo(cx + hw, cy);
  path.closePath();
  return path;
}

/** Extruded architectural wall panel of width w, height h, thickness d with optional arch/window holes. */
function panel(
  p: THREE.Object3D, w: number, h: number, d: number, c: string,
  holes: THREE.Path[] = [], x = 0, y = 0, z = 0, ry = 0
): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(w / 2, 0);
  shape.lineTo(w / 2, h);
  shape.lineTo(-w / 2, h);
  shape.closePath();
  for (const hole of holes) shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false, curveSegments: 8 });
  geo.translate(0, 0, -d / 2);
  geo.computeVertexNormals();
  return add(p, geo, mat(c), x, y, z, 1, 1, 1, ry);
}

/** Lofted surface through an array of 3D point rings (all rings have the same vertex count). */
function loft(p: THREE.Object3D, rings: [number, number, number][][], c: string, caps = true, x = 0, y = 0, z = 0, ry = 0): THREE.Mesh {
  const m = rings.length, n = rings[0].length;
  const pos: number[] = [];
  for (let j = 0; j < m - 1; j++) {
    const r0 = rings[j], r1 = rings[j + 1];
    for (let i = 0; i < n; i++) {
      const ni = (i + 1) % n;
      pos.push(...r0[i], ...r0[ni], ...r1[ni], ...r0[i], ...r1[ni], ...r1[i]);
    }
  }
  if (caps) {
    const [b, t] = [rings[0], rings[m - 1]];
    for (let i = 1; i < n - 1; i++) {
      pos.push(...b[0], ...b[i + 1], ...b[i]);
      pos.push(...t[0], ...t[i], ...t[i + 1]);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return add(p, geo, mat(c), x, y, z, 1, 1, 1, ry);
}

/** Revolved 2D [radius, height] profile around the Y axis (domes, spires, urns, robes). */
function lathe(p: THREE.Object3D, pts: [number, number][], c: string, x = 0, y = 0, z = 0, seg = 14): THREE.Mesh {
  const key = 'lathe:' + seg + ':' + pts.map(pt => pt[0].toFixed(3) + ',' + pt[1].toFixed(3)).join(';');
  const geo = g(key, () => {
    const lg = new THREE.LatheGeometry(pts.map(([r, py]) => new THREE.Vector2(r, py)), seg);
    lg.computeVertexNormals();
    return lg;
  });
  return add(p, geo, mat(c, { flat: seg <= 12 }), x, y, z, 1, 1, 1);
}

const _up = new THREE.Vector3(0, 1, 0);
const _va = new THREE.Vector3();
const _vb = new THREE.Vector3();
const _vd = new THREE.Vector3();

/** Tapered 3D structural strut / beam connecting point a=[x,y,z] to b=[x,y,z]. */
function strut(p: THREE.Object3D, a: [number, number, number], b: [number, number, number], ra: number, rb: number, c: string, seg = 6): THREE.Mesh {
  _va.set(a[0], a[1], a[2]);
  _vb.set(b[0], b[1], b[2]);
  _vd.subVectors(_vb, _va);
  const len = _vd.length() || 0.001;
  const key = `strut:${seg}:${(ra / Math.max(0.001, rb)).toFixed(2)}`;
  const geo = g(key, () => new THREE.CylinderGeometry(0.5, 0.5 * (ra / Math.max(0.001, rb)), 1, seg));
  const mesh = new THREE.Mesh(geo, mat(c));
  mesh.scale.set(rb * 2, len, rb * 2);
  mesh.position.addVectors(_va, _vb).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(_up, _vd.normalize());
  mesh.castShadow = true;
  p.add(mesh);
  return mesh;
}
const rod = (p: THREE.Object3D, a: [number, number, number], b: [number, number, number], r: number, c: string, seg = 6) =>
  strut(p, a, b, r, r, c, seg);

/** Architectural miniature tree (deciduous canopy or conifer pine). */
function tree(p: THREE.Object3D, x: number, y: number, z: number, s = 0.06, c = '#4d8a54', pine = false): void {
  cyl(p, '#6b4c35', x, y, z, s * 0.16, s * 0.5, 5);
  if (pine) {
    cone(p, c, x, y + s * 0.32, z, s * 0.56, s * 0.95, 6);
    cone(p, shade(c, 1.12), x, y + s * 0.72, z, s * 0.42, s * 0.75, 6);
  } else {
    ball(p, c, x, y + s * 0.78, z, s * 0.95, s * 0.85, s * 0.95);
  }
}

type Builder = (gp: THREE.Group, r: ModelRecipe) => void;
const num = (v: unknown, d: number) => (typeof v === 'number' ? v : d);

const B: Record<string, Builder> = {
  // ---------- landmarks ----------
  lattice: (gp, r) => {
    const c = r.color!;
    const dark = shade(c, 0.76);
    const light = shade(c, 1.18);
    const trim = shade(c, 0.9);
    // Champ de Mars landscaped plaza + corner lawns & trees
    box(gp, '#94a3b8', 0, 0, 0, 0.64, 0.022, 0.64);
    box(gp, '#cbd5e1', 0, 0.022, 0, 0.56, 0.014, 0.56);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      box(gp, '#4d7c5d', sx * 0.22, 0.023, sz * 0.22, 0.12, 0.01, 0.12);
      tree(gp, sx * 0.25, 0.032, sz * 0.25, 0.048, '#528a58');
    }
    // 4 masonry foundation shoes + inclined lattice piers (ground -> 1st deck y=0.38)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      tbox(gp, 0.11, 0.11, 0.09, 0.09, 0.045, '#b8a99a', sx * 0.20, 0.032, sz * 0.20, -sx * 0.01, -sz * 0.01);
      tbox(gp, 0.082, 0.082, 0.056, 0.056, 0.31, c, sx * 0.19, 0.075, sz * 0.19, -sx * 0.08, -sz * 0.08);
      // Corner chord struts + X-bracing diagonals on each lower leg
      const x0 = sx * 0.19, z0 = sz * 0.19, x1 = sx * 0.11, z1 = sz * 0.11;
      for (let k = 0; k < 4; k++) {
        const t0 = k / 4, t1 = (k + 1) / 4;
        const y0 = 0.075 + t0 * 0.31, y1 = 0.075 + t1 * 0.31;
        const ax = x0 + (x1 - x0) * t0, az = z0 + (z1 - z0) * t0;
        const bx = x0 + (x1 - x0) * t1, bz = z0 + (z1 - z0) * t1;
        rod(gp, [ax - 0.028, y0, az + sz * 0.028], [bx + 0.024, y1, bz + sz * 0.024], 0.0055, dark, 4);
        rod(gp, [ax + 0.028, y0, az + sz * 0.028], [bx - 0.024, y1, bz + sz * 0.024], 0.0055, dark, 4);
      }
      // Mid-section legs (1st deck y=0.43 -> 2nd deck y=0.72)
      tbox(gp, 0.052, 0.052, 0.038, 0.038, 0.29, c, sx * 0.105, 0.43, sz * 0.105, -sx * 0.05, -sz * 0.05);
    }
    // Parabolic decorative base arches on all 4 facades
    for (const ry of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const rg = new THREE.Group(); rg.rotation.y = ry; gp.add(rg);
      const N = 10;
      for (let i = 0; i < N; i++) {
        const a0 = (i / N) * Math.PI, a1 = ((i + 1) / N) * Math.PI;
        const p0: [number, number, number] = [-Math.cos(a0) * 0.15, 0.075 + Math.sin(a0) * 0.19, 0.165 - Math.sin(a0) * 0.035];
        const p1: [number, number, number] = [-Math.cos(a1) * 0.15, 0.075 + Math.sin(a1) * 0.19, 0.165 - Math.sin(a1) * 0.035];
        rod(rg, p0, p1, 0.009, dark, 5);
        rod(rg, [p0[0] * 0.92, p0[1] + 0.018, p0[2]], [p1[0] * 0.92, p1[1] + 0.018, p1[2]], 0.006, light, 5);
      }
    }
    // 1st observation deck + pavilion galleries
    tbox(gp, 0.34, 0.34, 0.38, 0.38, 0.028, dark, 0, 0.38, 0);
    box(gp, light, 0, 0.408, 0, 0.36, 0.024, 0.36);
    box(gp, '#fde68a', 0, 0.414, 0, 0.31, 0.012, 0.31);
    // Mid-section horizontal lacing girder & X-diagonals
    box(gp, trim, 0, 0.56, 0, 0.21, 0.02, 0.21);
    // 2nd double-tiered observation deck
    tbox(gp, 0.20, 0.20, 0.23, 0.23, 0.026, dark, 0, 0.71, 0);
    box(gp, light, 0, 0.736, 0, 0.21, 0.022, 0.21);
    box(gp, trim, 0, 0.758, 0, 0.17, 0.018, 0.17);
    // Upper tapered lattice spire shaft (y=0.776 -> 1.22) with 7 horizontal girder bands & cross-bracing
    tbox(gp, 0.135, 0.135, 0.064, 0.064, 0.44, c, 0, 0.776, 0);
    for (let i = 0; i < 6; i++) {
      const f0 = i / 6, f1 = (i + 1) / 6;
      const y0 = 0.78 + f0 * 0.42, y1 = 0.78 + f1 * 0.42;
      const w0 = 0.072 - f0 * 0.036, w1 = 0.072 - f1 * 0.036;
      box(gp, dark, 0, y0, 0, w0 * 2.08, 0.012, w0 * 2.08);
      for (const s of [-1, 1]) {
        rod(gp, [-w0, y0, s * w0], [w1, y1, s * w1], 0.0045, light, 4);
        rod(gp, [w0, y0, s * w0], [-w1, y1, s * w1], 0.0045, light, 4);
        rod(gp, [s * w0, y0, -w0], [s * w1, y1, w1], 0.0045, light, 4);
        rod(gp, [s * w0, y0, w0], [s * w1, y1, -w1], 0.0045, light, 4);
      }
    }
    // Summit observation lantern, cupola dome, and golden beacon antenna
    box(gp, light, 0, 1.215, 0, 0.095, 0.025, 0.095);
    lathe(gp, [[0.042, 0], [0.044, 0.03], [0.032, 0.065], [0.012, 0.085], [0, 0.09]], c, 0, 1.24, 0, 10);
    cyl(gp, '#f8fafc', 0, 1.325, 0, 0.009, 0.14, 6);
    ball(gp, '#fde047', 0, 1.47, 0, 0.038).material = mat('#fde047', { emissive: '#f59e0b' });
  },
  pyramid: (gp, r) => {
    const cnt = num(r.count, 3);
    if (r.glass) {
      // Louvre Pyramid: Cour Napoléon stone plaza + reflecting pools + steel lattice glass pyramid + 3 mini pyramids
      box(gp, '#cbd5e1', 0, 0, 0, 0.92, 0.026, 0.88);
      box(gp, '#38bdf8', -0.26, 0.027, 0.22, 0.28, 0.008, 0.24);
      box(gp, '#38bdf8', 0.26, 0.027, 0.22, 0.28, 0.008, 0.24);
      const glassMat = mat(r.color!, { transparent: 0.62, metal: 0.45, rough: 0.2 });
      add(gp, CONE(4), glassMat, 0, 0.24, -0.02, 0.60, 0.44, 0.60, Math.PI / 4);
      // Structural stainless-steel ridge & diamond lattice struts
      const hw = 0.212, top: [number, number, number] = [0, 0.46, -0.02];
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        rod(gp, [sx * hw, 0.026, -0.02 + sz * hw], top, 0.007, '#e2e8f0', 5);
      }
      for (let i = 1; i <= 3; i++) {
        const f = i / 4, w = hw * (1 - f) * 2, y = 0.026 + f * 0.43;
        box(gp, '#e2e8f0', 0, y, -0.02, w, 0.007, w);
      }
      for (const [x, z] of [[0, 0.31], [-0.34, -0.02], [0.34, -0.02]]) {
        add(gp, CONE(4), glassMat, x, 0.095, z, 0.18, 0.14, 0.18, Math.PI / 4);
      }
      return;
    }
    // Pyramids of Giza: desert plateau + stepped Khufu, cased Khafre, Menkaure, 3 Queen pyramids + Great Sphinx
    tbox(gp, 1.04, 0.86, 0.98, 0.80, 0.035, '#e2be7e', 0, 0, 0);
    const spots: [number, number, number, boolean][] = [
      [-0.14, -0.08, 1.0, false],
      [0.28, 0.14, 0.82, true],
      [-0.40, 0.24, 0.52, false],
    ];
    for (let i = 0; i < Math.min(cnt, spots.length); i++) {
      const [px, pz, s, smoothCap] = spots[i];
      const baseW = 0.50 * s, totalH = 0.56 * s, tiers = 9;
      for (let k = 0; k < tiers; k++) {
        const f0 = k / tiers, f1 = (k + 1) / tiers;
        const w0 = baseW * (1 - f0 * 0.92), w1 = baseW * (1 - f1 * 0.92);
        const col = k >= tiers - 2 && smoothCap ? shade(r.color!, 1.16) : shade(r.color!, 0.92 + (k % 2) * 0.08);
        tbox(gp, w0, w0, w1, w1, totalH / tiers + 0.003, col, px, 0.035 + f0 * totalH, pz);
      }
      tbox(gp, baseW * 0.1, baseW * 0.1, 0.005, 0.005, 0.05 * s, shade(r.color!, 1.22), px, 0.035 + totalH, pz);
    }
    // 3 Queen satellite pyramids
    for (let q = 0; q < 3; q++) {
      tbox(gp, 0.09, 0.09, 0.01, 0.01, 0.075, shade(r.color!, 0.88), -0.46 + q * 0.10, 0.035, 0.37);
    }
    // Great Sphinx of Giza in foreground
    const sx = 0.16, sz = 0.34, sc = shade(r.color!, 0.95);
    box(gp, sc, sx, 0.035, sz, 0.09, 0.065, 0.18);
    box(gp, sc, sx - 0.03, 0.035, sz + 0.11, 0.022, 0.028, 0.08);
    box(gp, sc, sx + 0.03, 0.035, sz + 0.11, 0.022, 0.028, 0.08);
    tbox(gp, 0.085, 0.08, 0.055, 0.06, 0.075, shade(sc, 1.08), sx, 0.095, sz + 0.05);
    ball(gp, sc, sx, 0.145, sz + 0.06, 0.06, 0.065, 0.06);
  },
  statue: (gp, r) => {
    const c = r.color!;
    if (r.torch) {
      // Statue of Liberty: Fort Wood 11-point star base + Richard Morris Hunt colonnade pedestal + Lady Liberty
      cyl(gp, '#4d7c5d', 0, 0, 0, 0.34, 0.025, 12);
      for (let i = 0; i < 8; i++) {
        box(gp, '#78716c', 0, 0.02, 0, 0.42, 0.045, 0.14, (i * Math.PI) / 8);
      }
      tbox(gp, 0.30, 0.30, 0.25, 0.25, 0.12, '#a8a29e', 0, 0.065, 0);
      // Pedestal with recessed colonnade niches on all 4 faces
      box(gp, '#d6d3d1', 0, 0.185, 0, 0.23, 0.24, 0.23);
      for (const ry of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        panel(gp, 0.232, 0.15, 0.018, '#b8b2a6', [archPath(0, 0.02, 0.11, 0.10)], 0, 0.22, 0.11, ry);
      }
      tbox(gp, 0.26, 0.26, 0.21, 0.21, 0.04, '#a8a29e', 0, 0.425, 0);
      // Flowing classical copper robe (lathe profile + diagonal toga folds)
      lathe(gp, [[0.105, 0], [0.098, 0.14], [0.085, 0.28], [0.092, 0.38], [0.070, 0.46], [0, 0.47]], c, 0, 0.465, 0, 12);
      tbox(gp, 0.15, 0.11, 0.11, 0.09, 0.36, shade(c, 0.92), 0, 0.50, 0.01, -0.01, 0, 0.25);
      // Head + 7-spike radiant crown
      ball(gp, c, 0, 0.96, 0.01, 0.095, 0.11, 0.095);
      cyl(gp, shade(c, 1.15), 0, 0.99, 0.01, 0.052, 0.022, 10);
      for (let i = -3; i <= 3; i++) {
        const a = i * 0.36;
        rod(gp, [Math.sin(a) * 0.04, 1.00, 0.01 + Math.cos(a) * 0.03], [Math.sin(a) * 0.095, 1.05 + Math.cos(a) * 0.03, 0.01 + Math.cos(a) * 0.06], 0.008, shade(c, 1.18), 4);
      }
      // Left arm holding tablet + raised right arm holding golden flame torch
      box(gp, shade(c, 0.82), -0.095, 0.72, 0.055, 0.055, 0.11, 0.025, 0.28, -0.2, 0.25);
      strut(gp, [0.065, 0.86, 0.01], [0.115, 1.12, 0.03], 0.028, 0.022, c, 7);
      cyl(gp, '#ca8a04', 0.115, 1.11, 0.03, 0.032, 0.022, 8);
      lathe(gp, [[0.005, 0], [0.032, 0.03], [0.024, 0.065], [0, 0.095]], '#fde047', 0.115, 1.13, 0.03, 8)
        .material = mat('#fde047', { emissive: '#f59e0b' });
      return;
    }
    // Christ the Redeemer: steep Corcovado granite peak + Art Deco octagonal pedestal + outstretched arms
    tbox(gp, 0.62, 0.56, 0.28, 0.26, 0.34, '#64748b', 0, 0, 0);
    tbox(gp, 0.52, 0.48, 0.24, 0.22, 0.22, '#4d7c5d', 0, 0.02, 0.04);
    for (const [tx, tz] of [[-0.22, 0.14], [0.22, 0.12], [-0.18, -0.16], [0.20, -0.14]]) tree(gp, tx, 0.14, tz, 0.065, '#3f6b4e');
    cyl(gp, '#94a3b8', 0, 0.34, 0, 0.14, 0.14, 8);
    tbox(gp, 0.19, 0.13, 0.17, 0.11, 0.50, c, 0, 0.48, 0);
    box(gp, shade(c, 0.92), 0, 0.50, 0.058, 0.06, 0.44, 0.015);
    // Outstretched arms + hands
    box(gp, c, 0, 0.84, 0, 0.78, 0.075, 0.075);
    box(gp, shade(c, 1.06), -0.41, 0.85, 0, 0.05, 0.045, 0.03);
    box(gp, shade(c, 1.06), 0.41, 0.85, 0, 0.05, 0.045, 0.03);
    // Slightly bowed head
    ball(gp, c, 0, 1.04, 0.015, 0.10, 0.12, 0.10, 0, 0.12);
  },
  clocktower: (gp, r) => {
    const c = r.color!;
    const dark = shade(c, 0.78);
    const roof = '#334155';
    // Thames embankment + Westminster gothic wing
    box(gp, '#64748b', -0.12, 0, 0, 0.68, 0.04, 0.38);
    box(gp, c, -0.24, 0.04, 0, 0.32, 0.22, 0.24);
    gable(gp, 0.33, 0.09, 0.25, roof, -0.24, 0.26, 0);
    for (let i = -3; i <= 0; i++) box(gp, dark, -0.24 + i * 0.045, 0.06, 0.122, 0.016, 0.17, 0.01);
    // Main Elizabeth Tower shaft with Gothic stone piers & vertical window flutes
    box(gp, dark, 0, 0.04, 0, 0.24, 0.10, 0.24);
    box(gp, c, 0, 0.14, 0, 0.20, 0.56, 0.20);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      box(gp, shade(c, 1.08), sx * 0.10, 0.14, sz * 0.10, 0.028, 0.58, 0.028);
    }
    for (const ry of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const fg = new THREE.Group(); fg.rotation.y = ry; gp.add(fg);
      for (let k = 0; k < 4; k++) {
        box(fg, '#475569', -0.05 + k * 0.033, 0.18, 0.101, 0.014, 0.48, 0.006);
      }
      for (const y of [0.30, 0.48, 0.66]) box(fg, shade(c, 1.12), 0, y, 0.103, 0.215, 0.018, 0.012);
    }
    // Cantilevered belfry clock stage + 4 Great Clock dials with gold frames & hands
    box(gp, shade(c, 1.08), 0, 0.70, 0, 0.25, 0.21, 0.25);
    for (const ry of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const dg = new THREE.Group(); dg.rotation.y = ry; gp.add(dg);
      box(dg, '#eab308', 0, 0.72, 0.126, 0.18, 0.17, 0.01);
      add(dg, CYL(16), mat('#fefce8', { emissive: '#fef08a' }), 0, 0.805, 0.132, 0.145, 0.012, 0.145, 0, Math.PI / 2);
      add(dg, g('clkRing', () => new THREE.RingGeometry(0.062, 0.074, 16)), mat('#ca8a04'), 0, 0.805, 0.139, 1, 1, 1);
      box(dg, '#1e293b', 0, 0.805, 0.141, 0.008, 0.052, 0.006);
      box(dg, '#1e293b', 0.018, 0.802, 0.141, 0.038, 0.008, 0.006);
    }
    // Belfry colonnade gallery + multi-stage Ayerst cast-iron spire
    tbox(gp, 0.25, 0.25, 0.17, 0.17, 0.12, roof, 0, 0.91, 0);
    box(gp, shade(c, 1.1), 0, 1.03, 0, 0.16, 0.06, 0.16);
    tbox(gp, 0.17, 0.17, 0.02, 0.02, 0.22, roof, 0, 1.09, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      cone(gp, '#eab308', sx * 0.11, 0.91, sz * 0.11, 0.016, 0.07, 4);
    }
    cyl(gp, '#eab308', 0, 1.31, 0, 0.01, 0.09, 6);
  },
  domed: (gp, r) => {
    const c = r.color!;
    const isHagia = c === '#d8a48a';
    if (isHagia) {
      // Hagia Sophia: Byzantine salmon-rose basilica + semi-domes + flying buttresses + 40-window central dome + 4 Ottoman minarets
      box(gp, '#cbd5e1', 0, 0, 0, 0.88, 0.04, 0.88);
      box(gp, c, 0, 0.04, 0, 0.52, 0.28, 0.48);
      // Flying buttresses on sides
      for (const s of [-1, 1]) {
        for (const z of [-0.14, 0.14]) tbox(gp, 0.10, 0.06, 0.04, 0.06, 0.24, shade(c, 0.86), s * 0.28, 0.04, z, -s * 0.03, 0);
        // East/West cascading semi-domes
        add(gp, SPH(12), mat('#64748b'), 0, 0.30, s * 0.20, 0.30, 0.22, 0.28);
      }
      // Central dome drum with clerestory window colonnade + pendentive lead dome
      cyl(gp, shade(c, 1.06), 0, 0.32, 0, 0.21, 0.07, 16);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        box(gp, '#1e293b', Math.cos(a) * 0.208, 0.335, Math.sin(a) * 0.208, 0.022, 0.035, 0.01, -a);
      }
      lathe(gp, [[0.21, 0], [0.20, 0.06], [0.15, 0.12], [0.06, 0.16], [0, 0.17]], '#64748b', 0, 0.39, 0, 16);
      cyl(gp, '#eab308', 0, 0.56, 0, 0.008, 0.06, 6);
      // 4 tall Ottoman stone minarets with pencil-cone lead roofs
      for (const [mx, mz] of [[-0.36, -0.34], [0.36, -0.34], [-0.36, 0.34], [0.36, 0.34]]) {
        box(gp, shade(c, 0.9), mx, 0.04, mz, 0.07, 0.10, 0.07);
        cyl(gp, '#e2d9c8', mx, 0.14, mz, 0.028, 0.52, 8);
        cyl(gp, '#f8fafc', mx, 0.50, mz, 0.042, 0.022, 8);
        cone(gp, '#475569', mx, 0.66, mz, 0.030, 0.15, 8);
      }
      return;
    }
    // Taj Mahal: Red sandstone base + white Makrana marble terrace + Charbagh reflecting pool + pierced iwan mausoleum
    box(gp, '#9a4a38', 0, 0, 0.05, 0.88, 0.035, 0.96);
    box(gp, shade(c, 0.95), 0, 0.035, -0.04, 0.78, 0.055, 0.76);
    // Charbagh reflecting pool + cypress trees
    box(gp, '#e2e8f0', 0, 0.036, 0.34, 0.16, 0.012, 0.34);
    box(gp, '#38bdf8', 0, 0.044, 0.34, 0.12, 0.008, 0.30);
    for (const sx of [-0.13, 0.13]) for (let k = 0; k < 3; k++) {
      tree(gp, sx, 0.035, 0.22 + k * 0.10, 0.05, '#2d6a4f', true);
    }
    // Main mausoleum body with real extruded pointed Mughal iwan arch portals on all 4 facades
    box(gp, shade(c, 0.65), 0, 0.09, -0.04, 0.38, 0.28, 0.38);
    for (const ry of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const fg = new THREE.Group(); fg.position.set(0, 0.09, -0.04); fg.rotation.y = ry; gp.add(fg);
      const holes = [
        archPath(0, 0, 0.13, 0.22, true),
        archPath(-0.125, 0.01, 0.05, 0.09, true),
        archPath(-0.125, 0.13, 0.05, 0.09, true),
        archPath(0.125, 0.01, 0.05, 0.09, true),
        archPath(0.125, 0.13, 0.05, 0.09, true),
      ];
      panel(fg, 0.42, 0.28, 0.032, c, holes, 0, 0, 0.195);
      // Taller central pishtaq portal frame + decorative finials
      panel(fg, 0.19, 0.33, 0.042, shade(c, 1.02), [archPath(0, 0, 0.13, 0.23, true)], 0, 0, 0.198);
      for (const px of [-0.092, 0.092]) cyl(fg, '#eab308', px, 0.33, 0.198, 0.008, 0.04, 6);
    }
    // Central high drum + lathe-sculpted bulbous lotus onion dome + golden kalasha finial
    cyl(gp, shade(c, 0.96), 0, 0.37, -0.04, 0.135, 0.10, 16);
    lathe(gp, [[0.135, 0], [0.165, 0.07], [0.155, 0.16], [0.10, 0.24], [0.03, 0.29], [0, 0.31]], c, 0, 0.47, -0.04, 18);
    cyl(gp, '#eab308', 0, 0.78, -0.04, 0.010, 0.09, 8);
    ball(gp, '#eab308', 0, 0.81, -0.04, 0.032);
    // 4 corner domed chhatri kiosks
    for (const [cx, cz] of [[-0.14, -0.18], [0.14, -0.18], [-0.14, 0.10], [0.14, 0.10]]) {
      cyl(gp, shade(c, 0.92), cx, 0.37, cz, 0.048, 0.055, 8);
      lathe(gp, [[0.048, 0], [0.056, 0.025], [0.035, 0.06], [0, 0.075]], c, cx, 0.425, cz, 10);
      cyl(gp, '#eab308', cx, 0.50, cz, 0.006, 0.035, 6);
    }
    // 4 corner three-tiered minarets
    const mn = num(r.minarets, 4);
    for (let i = 0; i < mn; i++) {
      const a = (i / mn) * Math.PI * 2 + Math.PI / 4;
      const mx = Math.cos(a) * 0.46, mz = -0.04 + Math.sin(a) * 0.44;
      cyl(gp, shade(c, 0.92), mx, 0.09, mz, 0.042, 0.03, 8);
      tbox(gp, 0.058, 0.058, 0.042, 0.042, 0.50, c, mx, 0.12, mz);
      for (const by of [0.28, 0.44, 0.60]) cyl(gp, shade(c, 0.88), mx, by, mz, 0.038, 0.018, 10);
      lathe(gp, [[0.032, 0], [0.038, 0.02], [0.022, 0.05], [0, 0.06]], c, mx, 0.63, mz, 8);
      cyl(gp, '#eab308', mx, 0.69, mz, 0.005, 0.04, 6);
    }
  },
  wall: (gp, r) => {
    const c = r.color!;
    const dark = shade(c, 0.82);
    // Undulating green mountain ridge + winding Ming crenellated wall + 3 watchtowers
    const pts: [number, number, number][] = [
      [-0.44, 0.08, 0.10], [-0.28, 0.16, -0.06], [-0.10, 0.12, 0.08],
      [0.10, 0.22, -0.04], [0.28, 0.15, 0.09], [0.44, 0.10, -0.05],
    ];
    for (let i = 0; i < pts.length; i++) {
      const [px, py, pz] = pts[i];
      cone(gp, i % 2 ? '#3f6b4e' : '#4d7c5d', px, 0, pz, 0.22, py + 0.06, 7);
      tree(gp, px + 0.08, py * 0.4, pz + 0.10, 0.055, '#2d6a4f', true);
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0, z0] = pts[i], [x1, y1, z1] = pts[i + 1];
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, mz = (z0 + z1) / 2;
      const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz), ry = -Math.atan2(dz, dx);
      box(gp, c, mx, my, mz, len + 0.03, 0.11, 0.075, ry);
      box(gp, shade(c, 1.12), mx, my + 0.11, mz, len + 0.03, 0.015, 0.082, ry);
      // Battlement merlons along both parapets
      for (let m = -1; m <= 1; m++) {
        box(gp, dark, mx + Math.cos(-ry) * m * 0.05, my + 0.125, mz + Math.sin(-ry) * m * 0.05, 0.028, 0.025, 0.082, ry);
      }
    }
    // 3 Ming watchtowers with arched windows & upturned grey-tiled hip roofs
    for (const idx of [0, 3, 5]) {
      const [tx, ty, tz] = pts[idx];
      tbox(gp, 0.15, 0.15, 0.13, 0.13, 0.22, dark, tx, ty, tz);
      panel(gp, 0.135, 0.09, 0.136, shade(c, 0.95), [archPath(-0.03, 0.02, 0.028, 0.045), archPath(0.03, 0.02, 0.028, 0.045)], tx, ty + 0.12, tz);
      tbox(gp, 0.17, 0.17, 0.08, 0.08, 0.055, '#334155', tx, ty + 0.22, tz);
    }
  },
  mountain: (gp, r) => {
    const peaks = num(r.peaks, 1), c = r.color!;
    if (r.sharp) {
      // Matterhorn: Iconic crooked 4-face pyramidal horn rising from alpine valley + Riffelsee lake
      box(gp, '#4d7c5d', 0, 0, 0, 0.88, 0.035, 0.78);
      box(gp, '#38bdf8', 0.16, 0.036, 0.22, 0.26, 0.008, 0.18);
      tbox(gp, 0.68, 0.62, 0.42, 0.36, 0.26, shade(c, 0.86), 0, 0.035, 0);
      tbox(gp, 0.42, 0.36, 0.18, 0.15, 0.44, c, 0, 0.295, 0, 0.05, -0.02);
      tbox(gp, 0.18, 0.15, 0.03, 0.02, 0.32, '#f8fafc', 0.05, 0.735, -0.02, 0.06, 0.01);
      for (const [tx, tz] of [[-0.32, 0.24], [-0.24, 0.28], [0.34, 0.18]]) tree(gp, tx, 0.035, tz, 0.06, '#2d6a4f', true);
      return;
    }
    if (r.flat && !r.snow) {
      // Table Mountain: Cape Town bay water + sheer flat-topped sandstone cliff mesa + Devil's Peak + Lion's Head + tablecloth cloud
      box(gp, '#0284c7', 0, 0, 0.22, 0.96, 0.025, 0.36);
      tbox(gp, 0.88, 0.56, 0.66, 0.34, 0.22, '#4d7c5d', 0, 0, -0.04);
      tbox(gp, 0.66, 0.34, 0.58, 0.26, 0.26, c, 0, 0.22, -0.04);
      // Vertical cliff buttress grooves
      for (let i = -3; i <= 3; i++) box(gp, shade(c, 0.84), i * 0.08, 0.22, 0.09, 0.035, 0.25, 0.03);
      cone(gp, shade(c, 0.9), -0.38, 0.02, 0.06, 0.16, 0.36, 6);
      cone(gp, shade(c, 0.92), 0.36, 0.02, 0.14, 0.13, 0.28, 6);
      // Floating "tablecloth" cloud over the flat rim
      for (let i = -2; i <= 2; i++) {
        ball(gp, '#f8fafc', i * 0.10, 0.49, -0.02 + (i % 2) * 0.03, 0.16, 0.055, 0.14).material = mat('#f8fafc', { transparent: 0.85 });
      }
      return;
    }
    if (r.flat && r.snow) {
      // Mount Kilimanjaro: Savanna foothills + broad Kibo volcanic dome + glacier snow cap + Mawenzi peak
      tbox(gp, 0.96, 0.78, 0.72, 0.58, 0.14, '#856d4d', 0, 0, 0);
      lathe(gp, [[0.38, 0], [0.30, 0.16], [0.21, 0.32], [0.16, 0.38], [0.11, 0.35], [0, 0.35]], c, -0.06, 0.14, 0, 14);
      lathe(gp, [[0.20, 0], [0.165, 0.07], [0.12, 0.05], [0, 0.05]], '#f8fafc', -0.06, 0.45, 0, 14);
      cone(gp, shade(c, 0.85), 0.28, 0.14, -0.04, 0.14, 0.26, 6);
      return;
    }
    if (peaks > 1) {
      // Mount Everest & Himalayan massif (Everest + Lhotse + Nuptse + Khumbu glacier)
      tbox(gp, 0.98, 0.82, 0.78, 0.66, 0.16, shade(c, 0.82), 0, 0, 0);
      const pk: [number, number, number, number][] = [[0, -0.04, 0.96, 0.38], [-0.28, 0.08, 0.72, 0.28], [0.28, 0.10, 0.66, 0.26]];
      for (const [px, pz, ph, pr] of pk) {
        cone(gp, c, px, 0.14, pz, pr, ph * 0.68, 6, 0.3);
        cone(gp, '#f8fafc', px, 0.14 + ph * 0.44, pz, pr * 0.56, ph * 0.42, 6, 0.3);
      }
      // Khumbu glacier river of ice
      tbox(gp, 0.18, 0.42, 0.10, 0.22, 0.18, '#e0f2fe', 0.02, 0.08, 0.20, 0, -0.08);
      return;
    }
    // Mount Fuji: Symmetrical concave volcanic stratocone + jagged snow cap + Lake Kawaguchi + Chureito Pagoda
    box(gp, '#38bdf8', 0, 0, 0.32, 0.76, 0.02, 0.24);
    lathe(gp, [[0.46, 0], [0.34, 0.18], [0.22, 0.38], [0.13, 0.58], [0.09, 0.68], [0.06, 0.64], [0, 0.64]], c, 0, 0.02, -0.04, 16);
    lathe(gp, [[0.18, 0], [0.13, 0.14], [0.09, 0.24], [0.06, 0.21], [0, 0.21]], '#f8fafc', 0, 0.46, -0.04, 16);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      cone(gp, '#f8fafc', Math.cos(a) * 0.15, 0.38, -0.04 + Math.sin(a) * 0.15, 0.038, 0.14, 4, a);
    }
  },
  needle: (gp, r) => {
    const h = num(r.h, 1);
    if (r.saucer) {
      // Seattle Space Needle: 3 curved tripod legs + central elevator core + multi-tier flying saucer + spire
      cyl(gp, '#64748b', 0, 0, 0, 0.28, 0.035, 16);
      cyl(gp, '#cbd5e1', 0, 0.035, 0, 0.045, 0.72, 8);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const p0: [number, number, number] = [Math.cos(a) * 0.22, 0.035, Math.sin(a) * 0.22];
        const p1: [number, number, number] = [Math.cos(a) * 0.065, 0.42, Math.sin(a) * 0.065];
        const p2: [number, number, number] = [Math.cos(a) * 0.14, 0.72, Math.sin(a) * 0.14];
        strut(gp, p0, p1, 0.018, 0.024, r.color!, 6);
        strut(gp, p1, p2, 0.016, 0.018, r.color!, 6);
      }
      // Saucer observation pod
      lathe(gp, [[0.06, 0], [0.22, 0.035], [0.24, 0.06], [0.19, 0.095], [0.09, 0.12], [0, 0.13]], '#f8fafc', 0, 0.70, 0, 18);
      add(gp, CYL(18), mat('#38bdf8', { emissive: '#0284c7' }), 0, 0.76, 0, 0.46, 0.022, 0.46);
      add(gp, CYL(18), mat('#f59e0b'), 0, 0.79, 0, 0.36, 0.024, 0.36);
      cyl(gp, '#e2e8f0', 0, 0.83, 0, 0.012, 0.22, 8);
      ball(gp, '#ef4444', 0, 1.06, 0, 0.03).material = mat('#ef4444', { emissive: '#dc2626' });
      return;
    }
    if (h > 1.2) {
      // CN Tower (Toronto): Y-shaped 3-wing tapered concrete buttresses + SkyPod + SpaceDeck + antenna
      cyl(gp, '#64748b', 0, 0, 0, 0.24, 0.035, 12);
      tbox(gp, 0.11, 0.11, 0.06, 0.06, 0.92, r.color!, 0, 0.035, 0);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        tbox(gp, 0.06, 0.18, 0.03, 0.05, 0.74, shade(r.color!, 0.92), Math.cos(a) * 0.07, 0.035, Math.sin(a) * 0.07, -Math.cos(a) * 0.04, -Math.sin(a) * 0.04, -a + Math.PI / 2);
      }
      // 7-story SkyPod observation deck
      lathe(gp, [[0.05, 0], [0.15, 0.03], [0.16, 0.075], [0.12, 0.11], [0.045, 0.125]], '#f8fafc', 0, 0.82, 0, 16);
      add(gp, CYL(16), mat('#38bdf8', { emissive: '#0284c7' }), 0, 0.88, 0, 0.325, 0.025, 0.325);
      add(gp, CYL(12), mat('#e2e8f0'), 0, 1.12, 0, 0.09, 0.04, 0.09);
      cyl(gp, '#ef4444', 0, 1.14, 0, 0.014, 0.28, 8);
      return;
    }
    // N Seoul Tower: Namsan green mountain hill + stone fortress terrace + observation pod + mast
    tbox(gp, 0.64, 0.56, 0.36, 0.32, 0.22, '#3f6b4e', 0, 0, 0);
    box(gp, '#94a3b8', 0, 0.22, 0, 0.30, 0.05, 0.24);
    cyl(gp, r.color!, 0, 0.27, 0, 0.048, 0.54, 12);
    cyl(gp, '#334155', 0, 0.66, 0, 0.12, 0.11, 16);
    add(gp, CYL(16), mat('#38bdf8', { emissive: '#0284c7' }), 0, 0.71, 0, 0.245, 0.035, 0.245);
    cyl(gp, '#cbd5e1', 0, 0.81, 0, 0.016, 0.26, 8);
    ball(gp, '#ef4444', 0, 1.08, 0, 0.028).material = mat('#ef4444', { emissive: '#dc2626' });
  },
  sails: (gp, r) => {
    const c = r.color!;
    // Sydney Opera House: Harbour water + stepped Bennelong Point granite podium + nested lofted parabolic shells
    box(gp, '#0284c7', 0, 0, 0, 0.98, 0.022, 0.64);
    box(gp, '#d6c7b2', 0, 0.022, 0, 0.84, 0.065, 0.50);
    box(gp, '#b8a68e', 0, 0.023, 0.26, 0.68, 0.04, 0.08);
    const makeShell = (x: number, z: number, w: number, h: number, d: number, tilt: number) => {
      const rings: [number, number, number][][] = [];
      const steps = 6, segs = 9;
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        const curW = w * (1 - t * 0.86);
        const curH = Math.sin(t * Math.PI * 0.5) * h;
        const curZ = z + t * d + Math.pow(t, 1.6) * tilt;
        const ring: [number, number, number][] = [];
        for (let i = 0; i <= segs; i++) {
          const u = (i / segs) * Math.PI;
          const px = x + Math.cos(u) * (curW / 2);
          const py = 0.087 + Math.sin(u) * curH * (1 - t * 0.12);
          ring.push([px, py, curZ]);
        }
        ring.push([x, 0.087, curZ]);
        rings.push(ring);
      }
      loft(gp, rings, c, true);
      // Bronze glass curtain wall inside shell mouth
      cone(gp, '#785a3c', x, 0.087, z + d * 0.72, w * 0.36, h * 0.62, 4);
    };
    // Concert Hall (left chain of 4 shells) + Joan Sutherland Theatre (right chain of 4 shells)
    for (const [zOff, w, h, d] of [[-0.18, 0.26, 0.42, 0.14], [-0.06, 0.24, 0.36, 0.13], [0.06, 0.20, 0.28, 0.12], [0.16, 0.15, 0.20, 0.09]] as const) {
      makeShell(-0.14, zOff, w, h, d, 0.04);
      makeShell(0.16, zOff + 0.02, w * 0.88, h * 0.86, d, 0.04);
    }
  },
  arena: (gp, r) => {
    const c = r.color!;
    const innerC = shade(c, 0.86);
    const brickC = shade(c, 0.72);
    // Roman travertine plaza + elliptical Colosseum built from 24 radial pierced-arch segments
    add(gp, CYL(24), mat('#94a3b8'), 0, 0.015, 0, 0.96, 0.03, 0.80);
    const N = 24, rx = 0.42, rz = 0.34, segW = 0.112;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const nx = Math.cos(a), nz = Math.sin(a);
      const ry = Math.atan2(nx, nz);
      // Surviving 4-story Northern outer wall (13 segments)
      if (i >= 2 && i <= 14) {
        const holes = [archPath(0, 0.01, 0.056, 0.085), archPath(0, 0.12, 0.056, 0.085), archPath(0, 0.23, 0.054, 0.08)];
        panel(gp, segW, 0.41, 0.032, c, holes, nx * rx, 0.03, nz * rz, ry);
        // Cornice bands & attic window
        for (const ly of [0.11, 0.22, 0.32, 0.41]) box(gp, shade(c, 1.12), nx * (rx + 0.012), 0.03 + ly, nz * (rz + 0.012), segW + 0.008, 0.012, 0.018, ry);
        if (i % 2 === 0) box(gp, '#1e293b', nx * (rx + 0.01), 0.36, nz * (rz + 0.01), 0.026, 0.032, 0.012, ry);
      }
      // Inner surviving 2-tier ring around full perimeter
      const inHoles = [archPath(0, 0.01, 0.05, 0.078), archPath(0, 0.11, 0.05, 0.075)];
      panel(gp, segW * 0.88, 0.25, 0.028, innerC, inHoles, nx * (rx * 0.84), 0.03, nz * (rz * 0.84), ry);
      // Sloping cavea seating wedges inside
      tbox(gp, segW * 0.78, 0.09, segW * 0.56, 0.02, 0.16, brickC, nx * (rx * 0.68), 0.03, nz * (rz * 0.68), 0, -0.03, ry);
    }
    // Elliptical arena floor + exposed underground hypogeum substructure walls
    add(gp, CYL(20), mat('#d4a373'), 0, 0.04, 0, 0.48, 0.025, 0.38);
    for (let k = -2; k <= 2; k++) box(gp, brickC, k * 0.042, 0.045, 0, 0.014, 0.028, 0.26 - Math.abs(k) * 0.04);
  },
  onions: (gp) => {
    // St. Basil's Cathedral: Red-brick Kremlin Square podium + central tented tower + 8 colorful lathe-sculpted onion domes
    box(gp, '#94a3b8', 0, 0, 0, 0.78, 0.03, 0.78);
    box(gp, '#b91c1c', 0, 0.03, 0, 0.56, 0.18, 0.56);
    box(gp, '#f8fafc', 0, 0.19, 0, 0.58, 0.025, 0.58);
    // White stone arched gallery portals on all 4 sides
    for (const ry of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      panel(gp, 0.36, 0.14, 0.03, '#f8fafc', [archPath(-0.08, 0.01, 0.06, 0.09), archPath(0.08, 0.01, 0.06, 0.09)], 0, 0.03, 0.285, ry);
    }
    // Central high octagonal tower + steep shatyor tent spire + golden onion cupola
    cyl(gp, '#b91c1c', 0, 0.21, 0, 0.11, 0.28, 8);
    cyl(gp, '#f8fafc', 0, 0.48, 0, 0.115, 0.03, 8);
    cone(gp, '#dc2626', 0, 0.51, 0, 0.105, 0.34, 8);
    lathe(gp, [[0.035, 0], [0.065, 0.04], [0.05, 0.09], [0.015, 0.13], [0, 0.15]], '#eab308', 0, 0.84, 0, 12);
    cyl(gp, '#eab308', 0, 0.99, 0, 0.006, 0.07, 6);
    // 8 surrounding chapel towers with brightly colored onion domes
    const domes: [number, number, number, string, string][] = [
      [0, 0.23, 0.30, '#ef4444', '#f8fafc'],
      [0.23, 0, 0.28, '#10b981', '#fde047'],
      [0, -0.23, 0.29, '#3b82f6', '#f8fafc'],
      [-0.23, 0, 0.27, '#f59e0b', '#dc2626'],
      [0.17, 0.17, 0.20, '#ec4899', '#f8fafc'],
      [-0.17, 0.17, 0.21, '#06b6d4', '#fde047'],
      [-0.17, -0.17, 0.19, '#8b5cf6', '#f8fafc'],
      [0.17, -0.17, 0.20, '#22c55e', '#eab308'],
    ];
    for (const [dx, dz, dh, dc, trimC] of domes) {
      cyl(gp, '#f8fafc', dx, 0.21, dz, 0.068, dh, 8);
      cyl(gp, trimC, dx, 0.21 + dh - 0.02, dz, 0.074, 0.025, 8);
      lathe(gp, [[0.058, 0], [0.098, 0.055], [0.088, 0.12], [0.035, 0.175], [0, 0.21]], dc, dx, 0.21 + dh, dz, 12);
      cyl(gp, '#eab308', dx, 0.21 + dh + 0.20, dz, 0.005, 0.05, 6);
    }
  },
  windmill: (gp, r) => {
    const c = r.color!;
    // Dutch canal + green polder dike + octagonal smock mill + wooden stelling stage + rotating lattice sails
    box(gp, '#0284c7', 0, 0, 0.22, 0.78, 0.022, 0.24);
    box(gp, '#4d7c5d', 0, 0, -0.06, 0.78, 0.04, 0.48);
    cyl(gp, '#9a3412', 0, 0.04, -0.02, 0.22, 0.16, 8);
    // Wooden stelling gallery balcony & struts
    cyl(gp, '#d6c7b2', 0, 0.19, -0.02, 0.28, 0.022, 8);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      rod(gp, [Math.cos(a) * 0.20, 0.08, -0.02 + Math.sin(a) * 0.20], [Math.cos(a) * 0.26, 0.19, -0.02 + Math.sin(a) * 0.26], 0.008, '#f8fafc', 4);
    }
    // Tapered green-timber octagonal tower + dark thatched rotating cap
    add(gp, g('wmBody', () => new THREE.CylinderGeometry(0.13, 0.20, 0.44, 8)), mat(c), 0, 0.42, -0.02, 1, 1, 1);
    lathe(gp, [[0.14, 0], [0.15, 0.06], [0.11, 0.13], [0, 0.16]], '#44403c', 0, 0.63, -0.02, 10);
    // Spinning 4-blade Dutch lattice wind-sails
    const hub = new THREE.Group(); hub.position.set(0, 0.69, 0.14); hub.name = 'spin'; gp.add(hub);
    cyl(hub, '#f8fafc', 0, -0.02, 0, 0.028, 0.06, 8).rotation.x = Math.PI / 2;
    for (let i = 0; i < 4; i++) {
      const bg = new THREE.Group(); bg.rotation.z = (i * Math.PI) / 2; hub.add(bg);
      box(bg, '#f8fafc', 0, 0.02, 0, 0.018, 0.48, 0.016);
      box(bg, '#b91c1c', 0.032, 0.10, 0.005, 0.05, 0.38, 0.006);
      for (let k = 0; k < 6; k++) box(bg, '#f8fafc', 0.028, 0.11 + k * 0.062, 0.008, 0.062, 0.008, 0.008);
    }
  },
  gate: (gp, r) => {
    const cols = num(r.columns, 6), c = r.color!;
    if (r.roof) {
      // Parthenon: Acropolis rocky hill + 3-step marble crepidoma + 8×6 Doric colonnade + inner cella + triangular pediment
      tbox(gp, 1.02, 0.68, 0.92, 0.56, 0.06, '#94a3b8', 0, 0, 0);
      for (let s = 0; s < 3; s++) box(gp, shade(c, 0.94 + s * 0.03), 0, 0.06 + s * 0.022, 0, 0.88 - s * 0.03, 0.022, 0.50 - s * 0.03);
      // Inner cella sanctuary walls
      box(gp, shade(c, 0.88), 0, 0.126, 0, 0.58, 0.32, 0.24);
      // Perimeter Doric columns (8 along X, 6 along Z) + capitals
      const nx = cols, nz = 6;
      for (let ix = 0; ix < nx; ix++) {
        for (let iz = 0; iz < nz; iz++) {
          if (ix > 0 && ix < nx - 1 && iz > 0 && iz < nz - 1) continue;
          const px = -0.37 + (ix * 0.74) / (nx - 1), pz = -0.18 + (iz * 0.36) / (nz - 1);
          cyl(gp, c, px, 0.126, pz, 0.026, 0.34, 10);
          box(gp, shade(c, 1.06), px, 0.466, pz, 0.062, 0.02, 0.062);
        }
      }
      // Architrave + triglyph frieze + sculpted triangular pediments
      box(gp, c, 0, 0.486, 0, 0.82, 0.055, 0.44);
      gable(gp, 0.84, 0.13, 0.46, shade(c, 1.05), 0, 0.54, 0);
      return;
    }
    // Brandenburg Gate: Pariser Platz paving + flanking guardhouses + 12 Doric columns + attic + bronze Quadriga chariot
    box(gp, '#94a3b8', 0, 0, 0, 0.98, 0.03, 0.48);
    for (const sx of [-0.41, 0.41]) {
      box(gp, shade(c, 0.92), sx, 0.03, 0, 0.12, 0.34, 0.34);
      gable(gp, 0.13, 0.06, 0.36, '#64748b', sx, 0.37, 0, Math.PI / 2);
    }
    const xs = [-0.31, -0.20, -0.09, 0.09, 0.20, 0.31];
    for (const px of xs) {
      for (const pz of [-0.11, 0.11]) {
        cyl(gp, c, px, 0.03, pz, 0.028, 0.42, 10);
        box(gp, shade(c, 1.08), px, 0.45, pz, 0.066, 0.022, 0.066);
      }
      box(gp, shade(c, 0.88), px, 0.03, 0, 0.036, 0.42, 0.20);
    }
    // Entablature + stepped attic crown
    box(gp, c, 0, 0.47, 0, 0.72, 0.08, 0.30);
    box(gp, shade(c, 1.05), 0, 0.55, 0, 0.56, 0.055, 0.24);
    box(gp, shade(c, 0.96), 0, 0.605, 0, 0.26, 0.04, 0.18);
    // Bronze Quadriga: chariot + Victoria goddess + 4 horses
    const qCol = '#2dd4bf';
    box(gp, qCol, 0, 0.645, -0.03, 0.10, 0.06, 0.06);
    cyl(gp, qCol, 0, 0.705, -0.03, 0.022, 0.09, 6);
    for (const hx of [-0.075, -0.025, 0.025, 0.075]) {
      box(gp, qCol, hx, 0.65, 0.03, 0.024, 0.055, 0.075);
      box(gp, qCol, hx, 0.69, 0.06, 0.02, 0.045, 0.025, 0, -0.3);
    }
  },
  spires: (gp, r) => {
    const c = r.color!;
    // Sagrada Família: Cruciform basilica nave + Gothic rose window facade + 8 perforated facade spires + 4 Evangelist towers + tall central Jesus tower
    box(gp, '#94a3b8', 0, 0, 0, 0.84, 0.03, 0.64);
    box(gp, shade(c, 0.92), 0, 0.03, 0, 0.64, 0.30, 0.42);
    gable(gp, 0.64, 0.12, 0.36, '#64748b', 0, 0.33, 0);
    // Carved Nativity & Passion portals on ±Z with rose windows
    for (const sz of [-1, 1]) {
      panel(gp, 0.44, 0.34, 0.04, c, [archPath(0, 0, 0.12, 0.16, true), archPath(-0.12, 0, 0.07, 0.12, true), archPath(0.12, 0, 0.07, 0.12, true)], 0, 0.03, sz * 0.22);
      add(gp, CYL(12), mat('#38bdf8', { emissive: '#0284c7' }), 0, 0.25, sz * 0.23, 0.09, 0.015, 0.09, 0, Math.PI / 2);
      // 4 parabolic perforated bell towers per facade
      for (let i = 0; i < 4; i++) {
        const tx = -0.18 + i * 0.12;
        const th = 0.56 + (i === 1 || i === 2 ? 0.12 : 0);
        lathe(gp, [[0.048, 0], [0.046, th * 0.5], [0.034, th * 0.85], [0.012, th], [0, th + 0.02]], shade(c, 1.04), tx, 0.24, sz * 0.19, 10);
        ball(gp, '#f59e0b', tx, 0.25 + th, sz * 0.19, 0.032);
      }
    }
    // 4 Evangelist towers + soaring central Tower of Jesus Christ + white/gold cross
    for (const [ex, ez] of [[-0.10, -0.07], [0.10, -0.07], [-0.10, 0.07], [0.10, 0.07]]) {
      lathe(gp, [[0.045, 0], [0.04, 0.36], [0.02, 0.52], [0, 0.55]], shade(c, 0.96), ex, 0.34, ez, 8);
      ball(gp, '#eab308', ex, 0.90, ez, 0.03);
    }
    lathe(gp, [[0.075, 0], [0.068, 0.42], [0.042, 0.68], [0.018, 0.78], [0, 0.80]], shade(c, 1.1), 0, 0.34, 0, 12);
    box(gp, '#f8fafc', 0, 1.14, 0, 0.024, 0.11, 0.024);
    box(gp, '#fde047', 0, 1.18, 0, 0.075, 0.024, 0.075);
  },
  moai: (gp, r) => {
    const c = r.color!;
    // Rapa Nui Ahu Tongariki volcanic stone platform + 5 sculpted Moai monoliths with brow ridges, noses, arms & red scoria pukao hats
    box(gp, '#4d7c5d', 0, 0, 0, 1.06, 0.03, 0.44);
    tbox(gp, 0.98, 0.28, 0.94, 0.24, 0.075, '#57534e', 0, 0.03, 0);
    const cnt = num(r.count, 5);
    for (let i = 0; i < cnt; i++) {
      const x = -0.36 + i * 0.18;
      const s = 0.88 + ((i * 3) % 3) * 0.10;
      const col = shade(c, 0.92 + (i % 2) * 0.1);
      // Torso with carved arms at waist
      tbox(gp, 0.125 * s, 0.10 * s, 0.105 * s, 0.085 * s, 0.24 * s, col, x, 0.105, 0);
      // Elongated angular head + overhanging brow + long nose + chin + ears
      tbox(gp, 0.10 * s, 0.10 * s, 0.088 * s, 0.085 * s, 0.22 * s, shade(col, 1.06), x, 0.105 + 0.24 * s, 0.008);
      box(gp, shade(col, 1.15), x, 0.105 + 0.41 * s, 0.052 * s, 0.092 * s, 0.026 * s, 0.03 * s);
      tbox(gp, 0.032 * s, 0.035 * s, 0.022 * s, 0.025 * s, 0.11 * s, shade(col, 0.82), x, 0.105 + 0.30 * s, 0.056 * s);
      for (const sx of [-1, 1]) box(gp, shade(col, 0.88), x + sx * 0.052 * s, 0.105 + 0.30 * s, 0, 0.015 * s, 0.11 * s, 0.04 * s);
      // Red scoria pukao topknot on alternating statues
      if (i % 2 === 1 || i === 2) {
        cyl(gp, '#b91c1c', x, 0.105 + 0.46 * s, 0.008, 0.044 * s, 0.065 * s, 10);
      }
    }
  },
  suspension: (gp, r) => {
    const c = r.color!;
    // Golden Gate Bridge: Bay water + Marin/SF headlands + Art Deco twin-leg portal towers + catenary cables + suspenders
    box(gp, '#0369a1', 0, 0, 0, 1.18, 0.025, 0.44);
    cone(gp, '#4d7c5d', -0.54, 0.02, -0.06, 0.14, 0.22, 6);
    cone(gp, '#4d7c5d', 0.54, 0.02, 0.06, 0.12, 0.18, 6);
    // Shore cable anchorages
    for (const sx of [-0.54, 0.54]) box(gp, '#cbd5e1', sx, 0.025, 0, 0.08, 0.19, 0.16);
    // Truss-stiffened roadway deck
    box(gp, c, 0, 0.195, 0, 1.14, 0.028, 0.14);
    box(gp, '#334155', 0, 0.223, 0, 1.14, 0.012, 0.12);
    // Art Deco stepped twin towers with 4 horizontal portal struts
    for (const tx of [-0.30, 0.30]) {
      cyl(gp, '#cbd5e1', tx, 0.025, 0, 0.075, 0.055, 10);
      for (const tz of [-0.052, 0.052]) {
        tbox(gp, 0.048, 0.036, 0.030, 0.026, 0.72, c, tx, 0.08, tz);
      }
      for (const py of [0.14, 0.34, 0.52, 0.66, 0.77]) {
        box(gp, shade(c, 1.08), tx, py, 0, 0.042, 0.026, 0.12);
      }
    }
    // Parabolic main suspension cables + vertical suspender ropes
    for (const z of [-0.052, 0.052]) {
      const spans: [number, number, number, number, number][] = [
        [-0.54, -0.30, 0.21, 0.79, 8],
        [-0.30, 0.30, 0.79, 0.79, 16],
        [0.30, 0.54, 0.79, 0.21, 8],
      ];
      for (const [x0, x1, y0, y1, n] of spans) {
        const isMain = x0 === -0.30;
        const pts: [number, number, number][] = [];
        for (let i = 0; i <= n; i++) {
          const u = i / n, x = x0 + (x1 - x0) * u;
          const sag = isMain ? 4 * u * (1 - u) * 0.52 : u * (1 - u) * 0.16;
          const y = y0 + (y1 - y0) * u - sag;
          pts.push([x, y, z]);
        }
        for (let i = 0; i < n; i++) rod(gp, pts[i], pts[i + 1], 0.011, shade(c, 1.1), 5);
        for (let i = 1; i < n; i += 2) {
          const [sx, sy] = pts[i];
          if (Math.abs(Math.abs(sx) - 0.30) < 0.03) continue;
          cyl(gp, '#cbd5e1', sx, 0.22, z, 0.0035, Math.max(0.02, sy - 0.22), 4);
        }
      }
    }
  },
  ruins: (gp, r) => {
    const c = r.color!;
    // Machu Picchu: Dramatic Huayna Picchu sugar-loaf peak + stepped green Andean agricultural terraces + Inca stone temples
    for (let i = 0; i < 6; i++) {
      const w = 0.92 - i * 0.11, d = 0.66 - i * 0.07, y = i * 0.055;
      box(gp, '#94a3b8', 0, y, 0.04, w + 0.02, 0.032, d + 0.02);
      box(gp, shade('#4d7c5d', 0.92 + (i % 2) * 0.08), 0, y + 0.032, 0.04, w, 0.026, d);
    }
    // Iconic steep Huayna Picchu peak in the background + secondary ridge
    tbox(gp, 0.38, 0.32, 0.08, 0.07, 0.68, '#3f6b4e', 0.14, 0.12, -0.22, -0.03, 0);
    cone(gp, '#2d6a4f', -0.26, 0.12, -0.20, 0.16, 0.44, 6);
    // Inca trapezoidal stone enclosures & Intihuatana ritual platform on upper terraces
    const houses: [number, number, number][] = [[-0.18, 0.33, 0.08], [0.0, 0.33, 0.12], [0.18, 0.33, 0.07], [-0.12, 0.275, 0.20], [0.12, 0.275, 0.20]];
    for (const [hx, hy, hz] of houses) {
      box(gp, c, hx, hy, hz, 0.11, 0.075, 0.085);
      gable(gp, 0.115, 0.045, 0.09, shade(c, 0.78), hx, hy + 0.075, hz);
    }
  },
  steppyramid: (gp, r) => {
    const c = r.color!;
    // Chichén Itzá (El Castillo): 9 stepped limestone terraces + 4 grand balustriga staircases + Temple of Kukulcán
    box(gp, '#4d7c5d', 0, 0, 0, 0.98, 0.025, 0.98);
    for (let i = 0; i < 9; i++) {
      const w = 0.84 - i * 0.072;
      tbox(gp, w, w, w - 0.03, w - 0.03, 0.062, shade(c, 1 - (i % 2) * 0.06), 0, 0.025 + i * 0.06, 0);
    }
    // 4 cardinal staircases with balustrades + serpent heads at base
    for (const ry of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const sg = new THREE.Group(); sg.rotation.y = ry; gp.add(sg);
      tbox(sg, 0.16, 0.08, 0.13, 0.06, 0.55, shade(c, 0.88), 0, 0.025, 0.41, 0, -0.25);
      for (const sx of [-0.075, 0.075]) {
        tbox(sg, 0.022, 0.08, 0.018, 0.05, 0.56, shade(c, 1.1), sx, 0.025, 0.415, 0, -0.25);
        box(sg, shade(c, 1.15), sx, 0.025, 0.455, 0.032, 0.042, 0.045);
      }
    }
    // Upper Temple of Kukulcán sanctuary
    box(gp, shade(c, 0.94), 0, 0.565, 0, 0.22, 0.11, 0.22);
    box(gp, shade(c, 1.12), 0, 0.675, 0, 0.24, 0.03, 0.24);
    for (const ry of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      panel(gp, 0.222, 0.09, 0.015, shade(c, 0.72), [archPath(0, 0, 0.06, 0.07)], 0, 0.565, 0.11, ry);
    }
  },
  temple: (gp, r) => {
    const c = r.color!;
    // Angkor Wat: Outer water moat + western Naga causeway + outer gallery wall + cruciform terraces + 5 lotus-bud prasat towers
    box(gp, '#0284c7', 0, 0, 0, 0.98, 0.022, 0.98);
    box(gp, '#4d7c5d', 0, 0.022, 0, 0.78, 0.02, 0.78);
    box(gp, shade(c, 1.05), 0, 0.018, 0.42, 0.12, 0.025, 0.20);
    // Outer gallery enclosure
    for (const s of [-0.34, 0.34]) {
      box(gp, shade(c, 0.88), 0, 0.042, s, 0.70, 0.065, 0.045);
      box(gp, shade(c, 0.88), s, 0.042, 0, 0.045, 0.065, 0.70);
    }
    // Raised 2nd & 3rd terraces
    box(gp, c, 0, 0.042, 0, 0.54, 0.09, 0.54);
    box(gp, shade(c, 0.94), 0, 0.132, 0, 0.38, 0.11, 0.38);
    // 5 ribbed lotus-bud towers (central Mount Meru spire + 4 corner towers)
    const towers: [number, number, number][] = [[0, 0, 0.52], [-0.15, -0.15, 0.34], [0.15, -0.15, 0.34], [-0.15, 0.15, 0.34], [0.15, 0.15, 0.34]];
    for (const [tx, tz, th] of towers) {
      box(gp, shade(c, 0.86), tx, 0.24, tz, 0.11, 0.08, 0.11);
      lathe(gp, [
        [0.068, 0], [0.062, th * 0.22], [0.070, th * 0.28], [0.052, th * 0.48],
        [0.058, th * 0.54], [0.038, th * 0.75], [0.018, th * 0.92], [0, th],
      ], shade(c, 1.06), tx, 0.32, tz, 10);
    }
  },
  leaning: (gp, r) => {
    const c = r.color!;
    // Piazza dei Miracoli emerald lawn + Leaning Tower of Pisa with 6 open colonnade galleries + belfry
    cyl(gp, '#4d7c5d', 0, 0, 0, 0.36, 0.025, 18);
    const t = new THREE.Group(); t.position.set(-0.03, 0.02, 0); t.rotation.z = -0.135; gp.add(t);
    // Solid ground floor with blind Romanesque arches
    cyl(t, shade(c, 0.92), 0, 0, 0, 0.155, 0.16, 16);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      box(t, c, Math.cos(a) * 0.156, 0.01, Math.sin(a) * 0.156, 0.016, 0.14, 0.016, -a);
    }
    // 6 open colonnade loggia floors (each with recessed inner wall + ring of 12 marble columns + cornice)
    for (let fl = 0; fl < 6; fl++) {
      const fy = 0.16 + fl * 0.11;
      cyl(t, shade(c, 0.78), 0, fy, 0, 0.125, 0.105, 14);
      cyl(t, shade(c, 1.06), 0, fy, 0, 0.162, 0.018, 18);
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2 + (fl % 2) * 0.12;
        cyl(t, c, Math.cos(a) * 0.148, fy + 0.018, Math.sin(a) * 0.148, 0.010, 0.088, 6);
      }
    }
    cyl(t, shade(c, 1.06), 0, 0.82, 0, 0.162, 0.022, 18);
    // 8th-floor smaller belfry chamber
    cyl(t, shade(c, 0.86), 0, 0.84, 0, 0.11, 0.11, 14);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      box(t, c, Math.cos(a) * 0.112, 0.84, Math.sin(a) * 0.112, 0.018, 0.10, 0.018, -a);
    }
    cyl(t, shade(c, 1.08), 0, 0.95, 0, 0.118, 0.02, 14);
  },
  stones: (gp, r) => {
    const c = r.color!;
    // Stonehenge: Salisbury Plain circular grass earthwork + outer sarsen lintel ring + inner 5 giant trilithons + bluestones
    cyl(gp, '#4d7c5d', 0, 0, 0, 0.48, 0.03, 20);
    add(gp, g('hengeDitch', () => new THREE.RingGeometry(0.42, 0.47, 24).rotateX(-Math.PI / 2)), mat('#65a30d'), 0, 0.032, 0, 1, 1, 1);
    // Outer sarsen circle with continuous lintels on surviving northeast arc
    const N = 14;
    for (let i = 0; i < N; i++) {
      if (i === 5 || i === 6 || i === 11) continue;
      const a = (i / N) * Math.PI * 2;
      tbox(gp, 0.075, 0.048, 0.068, 0.042, 0.25, shade(c, 0.92 + (i % 3) * 0.05), Math.cos(a) * 0.34, 0.03, Math.sin(a) * 0.34, 0, 0, -a + Math.PI / 2);
      if (i < 4 || (i >= 7 && i <= 9)) {
        const a2 = ((i + 0.5) / N) * Math.PI * 2;
        box(gp, shade(c, 1.06), Math.cos(a2) * 0.34, 0.28, Math.sin(a2) * 0.34, 0.165, 0.048, 0.055, -a2 + Math.PI / 2);
      }
    }
    // 5 giant central horseshoe trilithons
    for (let i = 0; i < 5; i++) {
      const a = -1.2 + (i / 4) * 2.4;
      const th = i === 2 ? 0.36 : 0.31;
      const cx = Math.cos(a) * 0.17, cz = Math.sin(a) * 0.17, ry = -a + Math.PI / 2;
      const g3 = new THREE.Group(); g3.position.set(cx, 0.03, cz); g3.rotation.y = ry; gp.add(g3);
      tbox(g3, 0.068, 0.055, 0.060, 0.048, th, shade(c, 0.86), -0.052, 0, 0);
      tbox(g3, 0.068, 0.055, 0.060, 0.048, th, shade(c, 0.86), 0.052, 0, 0);
      box(g3, shade(c, 1.04), 0, th, 0, 0.185, 0.052, 0.065);
    }
    // Central Altar Stone + distant Heel Stone
    box(gp, '#64748b', 0, 0.03, 0.02, 0.12, 0.025, 0.05, 0.3);
    tbox(gp, 0.055, 0.05, 0.035, 0.035, 0.16, shade(c, 0.9), 0.42, 0.03, 0.18, 0.02, 0);
  },
  skyscraper: (gp, r) => {
    const h = num(r.h, 1.4), c = r.color!;
    if (r.taper) {
      // Burj Khalifa: Dubai Fountain turquoise lake + Y-shaped 3-wing floorplan with 15 spiraling setback tiers + needle spire
      cyl(gp, '#0284c7', 0, 0, 0, 0.36, 0.022, 18);
      cyl(gp, '#cbd5e1', 0, 0.022, 0, 0.24, 0.02, 6);
      const totalH = 1.28;
      cyl(gp, shade(c, 1.08), 0, 0.04, 0, 0.055, totalH * 0.84, 12);
      for (let i = 0; i < 15; i++) {
        const wing = i % 3;
        const a = (wing * Math.PI * 2) / 3 + 0.2;
        const tierH = totalH * (0.14 + (14 - i) * 0.048);
        const reach = 0.05 + (14 - i) * 0.011;
        const wg = new THREE.Group(); wg.rotation.y = a; gp.add(wg);
        tbox(wg, 0.068, reach, 0.052, reach * 0.86, tierH, shade(c, 0.90 + (i % 3) * 0.08), 0, 0.04, reach * 0.55);
        cyl(wg, '#e2e8f0', 0, 0.04, reach * 0.95, 0.026, tierH, 8);
      }
      cyl(gp, '#e2e8f0', 0, 0.04 + totalH * 0.84, 0, 0.022, 0.18, 8);
      cyl(gp, '#f8fafc', 0, 0.04 + totalH * 0.84 + 0.18, 0, 0.008, 0.18, 6);
      return;
    }
    // Empire State Building: 5th Ave Art Deco podium + stepped Indiana limestone setbacks + window mullions + mooring mast
    box(gp, shade(c, 0.86), 0, 0, 0, 0.44, 0.14, 0.32);
    box(gp, shade(c, 0.92), 0, 0.14, 0, 0.34, 0.10, 0.26);
    box(gp, c, 0, 0.24, 0, 0.24, 0.58, 0.20);
    // Art Deco recessed corner notches & vertical window strips
    for (const sx of [-1, 1]) {
      box(gp, shade(c, 0.95), sx * 0.13, 0.24, 0, 0.04, 0.52, 0.14);
    }
    for (const sz of [-0.102, 0.102]) {
      for (let k = -2; k <= 2; k++) box(gp, '#334155', k * 0.036, 0.26, sz, 0.014, 0.54, 0.006);
    }
    // Upper setbacks (72nd, 81st, 86th floor observatory) + silver Art Deco mooring mast + broadcast spire
    box(gp, shade(c, 1.05), 0, 0.82, 0, 0.19, 0.11, 0.16);
    box(gp, shade(c, 1.10), 0, 0.93, 0, 0.14, 0.07, 0.12);
    cyl(gp, '#cbd5e1', 0, 1.00, 0, 0.048, 0.15, 12);
    lathe(gp, [[0.048, 0], [0.042, 0.04], [0.018, 0.07], [0, 0.08]], '#e2e8f0', 0, 1.15, 0, 12);
    cyl(gp, '#f8fafc', 0, 1.22, 0, 0.008, 0.22, 6);
    void h;
  },
  pagodatower: (gp, r) => {
    const c = r.color!;
    // Taipei 101: Tapered mall podium + 8 flared bamboo-box modules with ruyi medallions + pinnacle spire
    tbox(gp, 0.36, 0.36, 0.24, 0.24, 0.24, shade(c, 0.88), 0, 0, 0);
    for (let i = 0; i < 8; i++) {
      const y = 0.24 + i * 0.10;
      tbox(gp, 0.21, 0.21, 0.26, 0.26, 0.098, shade(c, 0.95 + (i % 2) * 0.08), 0, y, 0);
      box(gp, '#cbd5e1', 0, y + 0.094, 0, 0.268, 0.010, 0.268);
      // Traditional ruyi cloud ornament on all 4 faces
      for (const ry of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        box(gp, '#eab308', 0, y + 0.065, 0.132, 0.036, 0.026, 0.012, ry);
      }
    }
    tbox(gp, 0.15, 0.15, 0.10, 0.10, 0.11, shade(c, 1.1), 0, 1.04, 0);
    cyl(gp, '#e2e8f0', 0, 1.15, 0, 0.032, 0.09, 8);
    cyl(gp, '#fde047', 0, 1.24, 0, 0.010, 0.16, 6);
  },
  twin: (gp, r) => {
    const c = r.color!;
    // Petronas Twin Towers: KLCC base + 8-pointed Rub el Hizb star towers + 5 setbacks + Skybridge with V-struts
    box(gp, '#4d7c5d', 0, 0, 0, 0.68, 0.03, 0.42);
    for (const tx of [-0.17, 0.17]) {
      const tiers: [number, number, number][] = [[0.03, 0.56, 1.0], [0.59, 0.18, 0.84], [0.77, 0.14, 0.70], [0.91, 0.10, 0.54]];
      for (const [ty, th, s] of tiers) {
        // Rub el Hizb 8-pointed star: two overlapping rotated squares + 8 semi-circular flutes
        box(gp, c, tx, ty, 0, 0.17 * s, th, 0.17 * s, 0);
        box(gp, shade(c, 1.06), tx, ty, 0, 0.17 * s, th, 0.17 * s, Math.PI / 4);
        cyl(gp, '#e2e8f0', tx, ty + th - 0.015, 0, 0.115 * s, 0.016, 16);
      }
      lathe(gp, [[0.045, 0], [0.035, 0.08], [0.015, 0.18], [0, 0.24]], '#f8fafc', tx, 1.01, 0, 10);
      ball(gp, '#e2e8f0', tx, 1.14, 0, 0.032);
    }
    // Double-deck Skybridge + inclined V-support legs
    box(gp, '#e2e8f0', 0, 0.48, 0, 0.24, 0.036, 0.052);
    strut(gp, [-0.12, 0.36, 0], [0, 0.48, 0], 0.010, 0.010, '#cbd5e1', 6);
    strut(gp, [0.12, 0.36, 0], [0, 0.48, 0], 0.010, 0.010, '#cbd5e1', 6);
  },
  castle: (gp, r) => {
    const roof = (r.roof as string) ?? '#2563eb', c = r.color!;
    if (roof === '#3f6a4a') {
      // Moscow Kremlin: Red-brick swallowtail fortress wall + Spasskaya Clock Tower with green tent spire & ruby star + Cathedral domes
      box(gp, '#64748b', 0, 0, 0, 0.88, 0.03, 0.64);
      box(gp, c, 0, 0.03, 0.16, 0.82, 0.20, 0.08);
      for (let i = -5; i <= 5; i++) box(gp, shade(c, 0.9), i * 0.07, 0.23, 0.16, 0.042, 0.04, 0.082);
      // Spasskaya Savior Tower in foreground
      box(gp, shade(c, 0.94), 0, 0.03, 0.18, 0.22, 0.36, 0.22);
      box(gp, '#f8fafc', 0, 0.36, 0.18, 0.23, 0.04, 0.23);
      box(gp, c, 0, 0.40, 0.18, 0.17, 0.18, 0.17);
      // Black & gold Kremlin chimes on all 4 sides
      for (const ry of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        const cg = new THREE.Group(); cg.position.set(0, 0, 0.18); cg.rotation.y = ry; gp.add(cg);
        add(cg, CYL(12), mat('#1e293b'), 0, 0.49, 0.088, 0.09, 0.012, 0.09, 0, Math.PI / 2);
        add(cg, g('kRing', () => new THREE.RingGeometry(0.036, 0.046, 12)), mat('#eab308'), 0, 0.49, 0.095, 1, 1, 1);
      }
      cyl(gp, '#f8fafc', 0, 0.58, 0.18, 0.09, 0.08, 8);
      cone(gp, roof, 0, 0.66, 0.18, 0.088, 0.24, 8);
      ball(gp, '#ef4444', 0, 0.92, 0.18, 0.045).material = mat('#ef4444', { emissive: '#dc2626' });
      // Grand Kremlin Palace & golden cathedral domes behind wall
      box(gp, '#fef3c7', -0.16, 0.03, -0.08, 0.36, 0.26, 0.24);
      for (const dx of [-0.24, -0.16, -0.08]) ball(gp, '#eab308', dx, 0.33, -0.08, 0.065, 0.08, 0.065);
      cyl(gp, '#f8fafc', 0.22, 0.03, -0.08, 0.065, 0.46, 8);
      ball(gp, '#eab308', 0.22, 0.52, -0.08, 0.08, 0.10, 0.08);
      return;
    }
    // Neuschwanstein Castle: Alpine rocky ridge + red-brick gatehouse + white limestone Palas hall + fairy-tale blue-spired turrets
    tbox(gp, 0.92, 0.56, 0.78, 0.44, 0.14, '#64748b', 0, 0, 0);
    for (const [tx, tz] of [[-0.38, 0.18], [0.38, 0.16], [-0.34, -0.18]]) tree(gp, tx, 0.08, tz, 0.065, '#2d6a4f', true);
    // Red-brick Gatehouse on right (+X)
    box(gp, '#b91c1c', 0.28, 0.14, 0.04, 0.18, 0.20, 0.24);
    gable(gp, 0.19, 0.09, 0.25, '#334155', 0.28, 0.34, 0.04);
    // Creamy-white Romanesque Palas (main hall) with blue slate roof & rows of arched windows
    box(gp, c, -0.08, 0.14, -0.02, 0.44, 0.34, 0.24);
    gable(gp, 0.45, 0.16, 0.26, roof, -0.08, 0.48, -0.02);
    for (let fl = 0; fl < 3; fl++) {
      for (let w = 0; w < 5; w++) {
        box(gp, '#334155', -0.22 + w * 0.07, 0.18 + fl * 0.095, 0.102, 0.024, 0.055, 0.01);
      }
    }
    // Square watchtower + soaring circular fairy-tale turrets with conical blue spires
    box(gp, shade(c, 0.95), 0.08, 0.14, 0.10, 0.11, 0.48, 0.11);
    cone(gp, roof, 0.08, 0.62, 0.10, 0.085, 0.16, 4, Math.PI / 4);
    for (const [tx, tz, th, tr] of [[-0.28, -0.08, 0.68, 0.068], [-0.32, 0.10, 0.52, 0.052], [0.16, -0.12, 0.56, 0.055]] as const) {
      cyl(gp, c, tx, 0.14, tz, tr, th, 10);
      cyl(gp, shade(c, 1.06), tx, 0.14 + th - 0.06, tz, tr * 1.14, 0.06, 10);
      cone(gp, roof, tx, 0.14 + th, tz, tr * 1.22, 0.22, 10);
    }
  },
  carved: (gp, r) => {
    const c = r.color!;
    const cliff = shade(c, 0.72);
    const carve = shade(c, 1.12);
    // Petra (Al-Khazneh / The Treasury): Rose-red sandstone cliff massif + carved 6-column portico + pediment + upper tholos & urn
    tbox(gp, 0.96, 0.42, 0.88, 0.36, 0.92, cliff, 0, 0, -0.08);
    // Flanking Siq canyon cliff projections
    tbox(gp, 0.18, 0.44, 0.14, 0.38, 0.92, shade(cliff, 0.92), -0.39, 0, 0.02);
    tbox(gp, 0.18, 0.44, 0.14, 0.38, 0.92, shade(cliff, 0.92), 0.39, 0, 0.02);
    // Recessed dark portico shadow cavity
    box(gp, shade(c, 0.38), 0, 0.04, 0.08, 0.52, 0.76, 0.06);
    // Lower order: 6 Corinthian columns + entablature + triangular pediment
    box(gp, carve, 0, 0.0, 0.12, 0.56, 0.05, 0.12);
    for (let i = 0; i < 6; i++) {
      const cx = -0.22 + i * 0.088;
      cyl(gp, carve, cx, 0.05, 0.13, 0.022, 0.32, 10);
      box(gp, shade(carve, 1.08), cx, 0.37, 0.13, 0.048, 0.025, 0.048);
    }
    box(gp, c, 0, 0.395, 0.12, 0.54, 0.055, 0.08);
    gable(gp, 0.36, 0.08, 0.09, carve, 0, 0.45, 0.13);
    // Upper order: Broken-pediment flanking pavilions + central circular Tholos kiosk + conical roof & Pharaoh's Urn
    for (const sx of [-0.18, 0.18]) {
      box(gp, c, sx, 0.48, 0.11, 0.14, 0.22, 0.07);
      for (const ox of [-0.045, 0.045]) cyl(gp, carve, sx + ox, 0.48, 0.14, 0.018, 0.20, 8);
      tbox(gp, 0.15, 0.08, 0.12, 0.08, 0.05, carve, sx, 0.70, 0.12, -sx * 0.15, 0);
    }
    cyl(gp, c, 0, 0.48, 0.12, 0.078, 0.20, 12);
    for (let k = 0; k < 6; k++) {
      const a = -0.9 + (k / 5) * 1.8;
      cyl(gp, carve, Math.sin(a) * 0.082, 0.48, 0.12 + Math.cos(a) * 0.082, 0.014, 0.19, 8);
    }
    cone(gp, carve, 0, 0.68, 0.12, 0.092, 0.10, 12);
    lathe(gp, [[0.014, 0], [0.032, 0.035], [0.020, 0.07], [0, 0.085]], shade(carve, 1.1), 0, 0.78, 0.12, 10);
  },
  palace: (gp, r) => {
    const roof = (r.roof as string) ?? '#eab308', c = r.color!;
    // Forbidden City / Gyeongbokgung: 3-tier white marble Sumi terrace + triple dragon staircases + vermilion colonnade + double-eaved hip roof
    for (let t = 0; t < 3; t++) {
      const w = 0.96 - t * 0.08, d = 0.68 - t * 0.06, y = t * 0.048;
      box(gp, '#f1f5f9', 0, y, 0, w, 0.048, d);
      box(gp, '#cbd5e1', 0, y + 0.044, 0, w + 0.015, 0.014, d + 0.015);
    }
    // Triple imperial stone staircases on front (+Z) with carved central dragon ramp
    for (const sx of [-0.16, 0, 0.16]) {
      tbox(gp, sx === 0 ? 0.14 : 0.09, 0.06, sx === 0 ? 0.12 : 0.08, 0.04, 0.15, '#e2e8f0', sx, 0, 0.34, 0, -0.06);
    }
    // Vermilion throne hall + perimeter red columns + golden/emerald lintel beams
    box(gp, shade(c, 0.85), 0, 0.144, 0, 0.64, 0.20, 0.36);
    for (let ix = -4; ix <= 4; ix++) {
      for (const pz of [-0.19, 0.19]) cyl(gp, c, ix * 0.072, 0.144, pz, 0.016, 0.20, 8);
    }
    box(gp, '#10b981', 0, 0.32, 0, 0.68, 0.025, 0.40);
    // Lower upturned eave roof + upper story + grand hip-and-gable roof with golden ridge finials
    tbox(gp, 0.82, 0.52, 0.58, 0.34, 0.09, roof, 0, 0.34, 0);
    box(gp, c, 0, 0.42, 0, 0.50, 0.10, 0.28);
    box(gp, '#10b981', 0, 0.50, 0, 0.52, 0.02, 0.30);
    tbox(gp, 0.68, 0.42, 0.34, 0.04, 0.14, roof, 0, 0.52, 0);
    box(gp, '#eab308', 0, 0.655, 0, 0.38, 0.022, 0.028);
    for (const sx of [-0.18, 0.18]) box(gp, '#eab308', sx, 0.66, 0, 0.028, 0.04, 0.032);
  },
  bascule: (gp, r) => {
    const c = r.color!;
    const stone = '#d6d3d1';
    const slate = '#334155';
    // Tower Bridge (London): Thames river channel + boat piers + twin Victorian Gothic towers with pierced roadway arches + walkways + chains
    box(gp, '#0369a1', 0, 0, 0, 1.18, 0.025, 0.42);
    for (const tx of [-0.24, 0.24]) {
      // Massive boat-shaped masonry river pier
      cyl(gp, '#94a3b8', tx, 0.025, 0, 0.11, 0.10, 10);
      // Victorian Gothic tower with pierced pointed arch portal along X roadway
      panel(gp, 0.18, 0.54, 0.16, stone, [archPath(0, 0, 0.095, 0.16, true), archPath(0, 0.22, 0.06, 0.11, true), archPath(0, 0.37, 0.06, 0.10, true)], tx, 0.125, 0, Math.PI / 2);
      // 4 corner octagonal turrets + pointed slate spirelets
      for (const cx of [-0.078, 0.078]) for (const cz of [-0.078, 0.078]) {
        cyl(gp, shade(stone, 1.06), tx + cx, 0.125, cz, 0.024, 0.58, 8);
        cone(gp, slate, tx + cx, 0.705, cz, 0.030, 0.12, 8);
        cyl(gp, '#eab308', tx + cx, 0.825, cz, 0.004, 0.035, 6);
      }
      // Steep pyramidal slate roof between turrets
      tbox(gp, 0.16, 0.16, 0.04, 0.04, 0.15, slate, tx, 0.665, 0);
    }
    // Twin high-level horizontal steel lattice walkways
    for (const wz of [-0.055, 0.055]) {
      box(gp, '#cbd5e1', 0, 0.52, wz, 0.42, 0.038, 0.032);
      box(gp, c, 0, 0.515, wz, 0.42, 0.012, 0.038);
    }
    // Side suspension roadways + blue parabolic suspension chains + white vertical rods
    for (const sx of [-1, 1]) {
      box(gp, '#475569', sx * 0.42, 0.125, 0, 0.34, 0.028, 0.13);
      box(gp, c, sx * 0.42, 0.115, 0, 0.34, 0.022, 0.14);
      for (const cz of [-0.055, 0.055]) {
        const p0: [number, number, number] = [sx * 0.26, 0.52, cz];
        const p1: [number, number, number] = [sx * 0.41, 0.27, cz];
        const p2: [number, number, number] = [sx * 0.57, 0.14, cz];
        rod(gp, p0, p1, 0.014, c, 6);
        rod(gp, p1, p2, 0.014, c, 6);
        cyl(gp, '#f8fafc', sx * 0.35, 0.14, cz, 0.005, 0.22, 5);
        cyl(gp, '#f8fafc', sx * 0.45, 0.14, cz, 0.005, 0.11, 5);
      }
    }
    // Double-leaf bascule drawbridge slightly raised in center
    box(gp, c, -0.10, 0.155, 0, 0.17, 0.026, 0.12, 0, 0, 0.28);
    box(gp, c, 0.10, 0.155, 0, 0.17, 0.026, 0.12, 0, 0, -0.28);
  },
  canyon: (gp, r) => {
    const c = r.color!;
    // Grand Canyon: 6 stratified geological cliff layers + central eroded butte temple + winding turquoise Colorado River
    box(gp, '#0ea5e9', 0, 0, 0, 0.96, 0.028, 0.88);
    const strata = [shade(c, 0.72), '#b45309', c, '#d97706', shade(c, 1.15), '#fde68a'];
    for (let i = 0; i < 6; i++) {
      const y = 0.025 + i * 0.068, w = 0.38 - i * 0.032;
      tbox(gp, w, 0.86, w - 0.025, 0.82 - i * 0.02, 0.068, strata[i], -0.29 - i * 0.012, y, 0);
      tbox(gp, w, 0.86, w - 0.025, 0.82 - i * 0.02, 0.068, strata[i], 0.29 + i * 0.012, y, 0);
      if (i < 4) tbox(gp, 0.16 - i * 0.03, 0.22 - i * 0.03, 0.13 - i * 0.03, 0.18 - i * 0.03, 0.062, strata[i], 0.02, y, -0.12);
    }
  },
  waterfall: (gp, r) => {
    const w = r.wide ? 0.88 : 0.56;
    // Horseshoe / cliff gorge + upper river + forested rim + multi-sheet cascading falls + mist clouds + rainbow arc
    tbox(gp, w + 0.26, 0.34, w + 0.22, 0.30, 0.52, '#57534e', 0, 0, -0.20);
    box(gp, '#4d7c5d', 0, 0.52, -0.20, w + 0.22, 0.03, 0.30);
    box(gp, '#0284c7', 0, 0.525, -0.20, w, 0.028, 0.28);
    for (const sx of [-1, 1]) {
      tbox(gp, 0.18, 0.52, 0.14, 0.46, 0.52, '#57534e', sx * (w / 2 + 0.08), 0, -0.02);
      tree(gp, sx * (w / 2 + 0.06), 0.52, -0.10, 0.065, '#2d6a4f', true);
      tree(gp, sx * (w / 2 + 0.08), 0.52, 0.05, 0.055, '#3f6b4e');
    }
    // Cascading water sheets + foam ribs
    tbox(gp, w, 0.05, w * 1.04, 0.12, 0.50, r.color!, 0, 0.03, -0.06, 0, -0.04)
      .material = mat(r.color!, { transparent: 0.88, emissive: '#0284c7' });
    for (let i = -3; i <= 3; i++) {
      cyl(gp, '#f8fafc', i * (w * 0.13), 0.04, -0.04, 0.022, 0.49, 6);
    }
    // Plunge pool + billowing mist + translucent rainbow arc
    add(gp, CYL(18), mat('#0ea5e9'), 0, 0.02, 0.10, w + 0.20, 0.04, 0.48);
    for (let i = -2; i <= 2; i++) {
      ball(gp, '#f8fafc', i * (w * 0.16), 0.09, 0.02 + (i % 2) * 0.03, 0.18, 0.12, 0.16).material = mat('#f8fafc', { transparent: 0.72 });
    }
    add(gp, g('wfBow', () => new THREE.TorusGeometry(0.24, 0.014, 6, 18, Math.PI)), mat('#fbbf24', { emissive: '#f59e0b', transparent: 0.65 }), 0, 0.12, 0.12, 1, 1, 1, 0.25);
  },
  rock: (gp, r) => {
    const c = r.color!;
    // Uluru (Ayers Rock): Red Centre desert sand pad + spinifex scrub + fluted arkose sandstone monolith
    cyl(gp, '#d97706', 0, 0, 0, 0.56, 0.028, 20);
    tbox(gp, 0.92, 0.50, 0.76, 0.38, 0.24, c, 0, 0.028, 0);
    tbox(gp, 0.76, 0.38, 0.54, 0.26, 0.12, shade(c, 1.08), 0, 0.268, 0);
    // Characteristic vertical fluting ribs along the monolith flanks
    for (let i = -5; i <= 5; i++) {
      tbox(gp, 0.055, 0.48, 0.042, 0.34, 0.33, shade(c, 0.88 + (Math.abs(i) % 2) * 0.14), i * 0.072, 0.028, 0);
    }
    for (const [bx, bz] of [[-0.42, 0.22], [0.38, 0.24], [-0.36, -0.22], [0.40, -0.20]]) {
      ball(gp, '#65a30d', bx, 0.04, bz, 0.055, 0.035, 0.055);
    }
  },
  reef: (gp, r) => {
    // Great Barrier Reef: Sandy turquoise atoll seabed + table corals + staghorn corals + anemones + tropical fish
    cyl(gp, '#fde68a', 0, 0, 0, 0.52, 0.03, 20);
    cyl(gp, '#0ea5e9', 0, 0.015, 0, 0.56, 0.02, 20).material = mat('#0ea5e9', { transparent: 0.55 });
    const cs = [r.color!, '#f59e0b', '#c084fc', '#fb7185', '#2dd4bf', '#38bdf8'];
    // Tiered table corals & brain corals
    for (let i = 0; i < 12; i++) {
      const a = i * 2.399, d = 0.08 + (i % 4) * 0.095, col = cs[i % cs.length];
      const cx = Math.cos(a) * d, cz = Math.sin(a) * d;
      if (i % 3 === 0) {
        cyl(gp, shade(col, 0.8), cx, 0.03, cz, 0.03, 0.09 + (i % 2) * 0.05, 6);
        cyl(gp, col, cx, 0.11 + (i % 2) * 0.05, cz, 0.11, 0.025, 10);
      } else {
        ball(gp, col, cx, 0.09, cz, 0.15, 0.16 + (i % 3) * 0.04, 0.15);
      }
    }
    // Branching staghorn coral fingers
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      strut(gp, [Math.cos(a) * 0.08, 0.04, Math.sin(a) * 0.08], [Math.cos(a) * 0.22, 0.34, Math.sin(a) * 0.22], 0.018, 0.012, cs[(i + 1) % cs.length], 6);
    }
  },
  pagoda: (gp, r) => {
    const fl = num(r.floors, 3), c = r.color!;
    // Kinkaku-ji (Golden Pavilion): Kyoko-chi mirror pond + pine island + timber deck + 3 distinct stories with upturned irimoya roofs + golden phoenix
    box(gp, '#0369a1', 0, 0, 0, 0.92, 0.022, 0.82);
    box(gp, '#78716c', -0.04, 0.022, -0.04, 0.56, 0.045, 0.52);
    box(gp, '#92400e', -0.04, 0.067, 0.02, 0.52, 0.02, 0.48);
    // Pond island with Japanese pine
    ball(gp, '#57534e', 0.30, 0.03, 0.22, 0.18, 0.05, 0.14);
    tree(gp, 0.30, 0.045, 0.22, 0.08, '#2d6a4f', true);
    const roofC = '#334155';
    for (let i = 0; i < fl; i++) {
      const y = 0.087 + i * 0.21;
      const w = 0.42 - i * 0.065;
      const wallC = i === 0 ? '#f8fafc' : c;
      box(gp, wallC, -0.04, y, -0.04, w, 0.14, w);
      // Perimeter wooden posts & lattice windows
      for (const s of [-1, 1]) {
        box(gp, '#78350f', -0.04, y + 0.01, -0.04 + s * (w / 2 + 0.004), w + 0.02, 0.018, 0.015);
        for (let k = -2; k <= 2; k++) box(gp, '#451a03', -0.04 + k * (w * 0.18), y + 0.02, -0.04 + s * (w / 2 + 0.005), 0.014, 0.10, 0.01);
      }
      // Upturned Japanese tiled roof
      const rw = w + 0.22 - i * 0.02;
      tbox(gp, rw, rw, rw * 0.52, rw * 0.52, 0.075, roofC, -0.04, y + 0.135, -0.04);
      box(gp, c, -0.04, y + 0.132, -0.04, rw + 0.01, 0.012, rw + 0.01);
    }
    const topY = 0.087 + (fl - 1) * 0.21 + 0.21;
    tbox(gp, 0.32, 0.32, 0.03, 0.03, 0.11, roofC, -0.04, topY - 0.05, -0.04);
    // Golden Hōō (Phoenix) finial at apex
    box(gp, '#fde047', -0.04, topY + 0.06, -0.04, 0.045, 0.04, 0.045);
    ball(gp, '#fde047', -0.04, topY + 0.13, -0.04, 0.06, 0.08, 0.04).material = mat('#fde047', { emissive: '#eab308' });
  },
  // ---------- animals ----------
  quad: (gp, r) => {
    const L = num(r.L, 1), H = num(r.H, 0.6), c = r.color!;
    ball(gp, c, 0, H * 0.75, 0, 0.34, 0.28 * (r.chunky ? 1.32 : 1), L * 0.62);
    for (const [x, z] of [[-0.095, -0.2], [0.095, -0.2], [-0.095, 0.2], [0.095, 0.2]]) {
      cyl(gp, shade(c, 0.84), x, 0, z * L, 0.038, H * 0.68, 6);
      cyl(gp, '#292524', x, 0, z * L, 0.042, 0.04, 6);
    }
    const neck = num(r.neck, 0.2);
    add(gp, CYL(8), mat(c), 0, H * 0.8 + neck * 0.3, L * 0.28 + neck * 0.08, 0.11, neck * 0.7 + 0.1, 0.11, 0, 0.5);
    const hy = H * 0.82 + neck * 0.6, hz = L * 0.34 + neck * 0.18;
    ball(gp, c, 0, hy, hz, 0.18, 0.17, 0.23);
    // Eyes & ears
    for (const sx of [-1, 1]) {
      ball(gp, '#111827', sx * 0.065, hy + 0.02, hz + 0.075, 0.028);
      if (!r.trunk) ball(gp, shade(c, 0.85), sx * 0.08, hy + 0.08, hz - 0.02, 0.04, 0.07, 0.03);
    }
    if (r.mane) ball(gp, r.mane as string, 0, hy, L * 0.3 + neck * 0.18, 0.31, 0.31, 0.18);
    if (r.trunk) {
      add(gp, CYL(6), mat(c), 0, H * 0.54, L * 0.46, 0.065, 0.42, 0.065, 0, 0.22);
      for (const sx of [-1, 1]) {
        ball(gp, shade(c, 0.92), sx * 0.18, H * 0.85, L * 0.32, 0.045, 0.30, 0.24);
        add(gp, CONE(6), mat('#fefce8'), sx * 0.06, H * 0.66, L * 0.48, 0.03, 0.18, 0.03, 0, 1.15);
      }
    }
    if (r.hump) ball(gp, shade(c, 0.94), 0, H * 0.99, 0, 0.21, 0.19 * num(r.hump, 1), 0.25);
    if (r.antlers) for (const x of [-0.06, 0.06]) add(gp, CYL(5), mat('#d8c8a0'), x, H * 1.05 + neck * 0.6, L * 0.32, 0.022, 0.24, 0.022, 0, -0.4, x * 6);
    if (r.pattern === 'stripes') for (let i = -2; i <= 2; i++) box(gp, '#1e293b', 0, H * 0.62, i * L * 0.09, 0.35, 0.25, 0.026);
    if (r.pattern === 'spots') for (let i = 0; i < 6; i++) ball(gp, shade(c, 0.55), (i % 2 ? 1 : -1) * 0.15, H * 0.8, -0.15 + i * 0.06, 0.055);
    if (r.fluffy) ball(gp, shade(c, 1.06), 0, H * 0.8, 0, 0.37, 0.31, L * 0.63);
    add(gp, CYL(5), mat(shade(c, 0.85)), 0, H * 0.75, -L * 0.33, 0.03, num(r.tail, 0.3), 0.03, 0, 0.9);
  },
  ape: (gp, r) => {
    const c = r.color!;
    ball(gp, c, 0, 0.35, 0, 0.44, 0.46, 0.38);
    ball(gp, shade(c, 1.25), 0, 0.38, -0.04, 0.36, 0.32, 0.30);
    ball(gp, c, 0, 0.66, 0.04, 0.25);
    ball(gp, shade(c, 1.5), 0, 0.64, 0.145, 0.14, 0.11, 0.065);
    for (const sx of [-1, 1]) ball(gp, '#111827', sx * 0.045, 0.68, 0.15, 0.024);
    for (const x of [-0.24, 0.24]) add(gp, CYL(6), mat(c), x, 0.25, 0.04, 0.085, 0.46, 0.085, 0, 0, x * 0.6);
    for (const x of [-0.1, 0.1]) cyl(gp, c, x, 0, 0, 0.055, 0.18, 6);
  },
  bear: (gp, r) => {
    const s = r.small ? 0.78 : 1, c = r.color!, p = (r.patch as string) ?? shade(c, 0.85);
    ball(gp, c, 0, 0.32 * s, 0, 0.46 * s, 0.41 * s, 0.62 * s);
    ball(gp, c, 0, 0.51 * s, 0.30 * s, 0.31 * s);
    for (const x of [-0.10, 0.10]) ball(gp, p, x * s, 0.65 * s, 0.28 * s, 0.095 * s);
    if (r.patch) {
      ball(gp, p, 0, 0.36 * s, 0.12 * s, 0.47 * s, 0.32 * s, 0.22 * s);
      for (const x of [-0.065, 0.065]) ball(gp, p, x * s, 0.53 * s, 0.43 * s, 0.075 * s, 0.085 * s, 0.035 * s);
    }
    for (const x of [-0.055, 0.055]) ball(gp, '#111827', x * s, 0.53 * s, 0.445 * s, 0.025 * s);
    ball(gp, shade(c, 0.8), 0, 0.47 * s, 0.45 * s, 0.11 * s, 0.085 * s, 0.09 * s);
    ball(gp, '#111827', 0, 0.49 * s, 0.49 * s, 0.04 * s);
    for (const [x, z] of [[-0.13, -0.15], [0.13, -0.15], [-0.13, 0.15], [0.13, 0.15]]) cyl(gp, p, x * s, 0, z * s, 0.065 * s, 0.19 * s, 6);
  },
  hopper: (gp, r) => {
    const c = r.color!;
    add(gp, SPH(), mat(c), 0, 0.38, 0, 0.31, 0.46, 0.31, 0, 0.3);
    ball(gp, shade(c, 1.25), 0, 0.35, 0.08, 0.22, 0.32, 0.20);
    ball(gp, c, 0, 0.71, 0.12, 0.17, 0.17, 0.23);
    for (const x of [-0.05, 0.05]) {
      cone(gp, c, x, 0.77, 0.10, 0.032, 0.14, 5);
      ball(gp, '#111827', x, 0.73, 0.21, 0.024);
    }
    for (const x of [-0.1, 0.1]) ball(gp, shade(c, 0.9), x, 0.12, 0.05, 0.12, 0.21, 0.33);
    add(gp, CONE(6), mat(c), 0, 0.15, -0.3, 0.11, 0.52, 0.11, 0, -1.2);
  },
  penguin: (gp, r) => {
    const s = r.small ? 0.75 : 1;
    ball(gp, r.color!, 0, 0.35 * s, 0, 0.37 * s, 0.71 * s, 0.33 * s);
    ball(gp, (r.belly as string) ?? '#f8fafc', 0, 0.32 * s, 0.075 * s, 0.29 * s, 0.57 * s, 0.23 * s);
    ball(gp, r.color!, 0, 0.75 * s, 0.02 * s, 0.25 * s);
    for (const sx of [-0.055, 0.055]) ball(gp, '#f8fafc', sx * s, 0.77 * s, 0.12 * s, 0.032 * s);
    add(gp, CONE(6), mat(r.accent ?? '#f59e0b'), 0, 0.73 * s, 0.17 * s, 0.075 * s, 0.15 * s, 0.075 * s, 0, Math.PI / 2);
    for (const x of [-0.185, 0.185]) add(gp, SPH(), mat(r.color!), x * s, 0.40 * s, 0, 0.065 * s, 0.36 * s, 0.15 * s, 0, 0, x * 1.4);
    for (const x of [-0.08, 0.08]) box(gp, r.accent ?? '#f59e0b', x * s, 0, 0.06 * s, 0.08 * s, 0.03 * s, 0.14 * s);
  },
  wader: (gp, r) => {
    const c = r.color!;
    ball(gp, c, 0, 0.62, 0, 0.24, 0.21, 0.38);
    ball(gp, shade(c, 0.88), 0, 0.63, -0.02, 0.26, 0.16, 0.30);
    for (const lx of [-0.035, 0.035]) cyl(gp, '#e11d48', lx, 0, 0, 0.012, 0.56, 5);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.65, 0.12), new THREE.Vector3(0, 0.85, 0.22), new THREE.Vector3(0, 0.98, 0.08), new THREE.Vector3(0, 1.05, 0.16)]);
    gp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.026, 6), mat(c)));
    ball(gp, c, 0, 1.06, 0.18, 0.085);
    add(gp, CONE(5), mat('#1e293b'), 0, 1.03, 0.26, 0.042, 0.11, 0.042, 0, 2.2);
  },
  flyer: (gp, r) => {
    const c = r.color!;
    const body = new THREE.Group(); body.position.y = 0.5; body.name = 'flap'; gp.add(body);
    ball(body, c, 0, 0, 0, 0.19, 0.19, 0.46);
    ball(body, (r.head as string) ?? c, 0, 0.05, 0.25, 0.16);
    add(body, CONE(5), mat('#eab308'), 0, 0.03, 0.36, 0.055, 0.11, 0.055, 0, Math.PI / 2);
    for (const x of [-1, 1]) {
      add(body, BOX(), mat(shade(c, 0.9)), x * 0.35, 0.02, 0, 0.62, 0.032, 0.23, 0, 0, x * 0.15);
      add(body, BOX(), mat(shade(c, 0.78)), x * 0.58, 0.05, -0.02, 0.22, 0.024, 0.16, 0, 0, x * 0.25);
    }
  },
  roundbird: (gp, r) => {
    ball(gp, r.color!, 0, 0.30, 0, 0.50, 0.45, 0.55);
    ball(gp, shade(r.color!, 1.08), 0, 0.42, 0.16, 0.26);
    add(gp, CYL(6), mat('#d8c8a0'), 0, 0.32, 0.38, 0.022, 0.32, 0.022, 0, 1.3);
    for (const x of [-0.08, 0.08]) cyl(gp, '#d8c8a0', x, 0, 0, 0.024, 0.12, 5);
  },
  whale: (gp, r) => {
    const L = num(r.L, 1.5), c = r.color!;
    ball(gp, c, 0, 0.14, 0, 0.34 * Math.min(L, 1.2), 0.24, L * 0.62);
    add(gp, BOX(), mat(c), 0, 0.15, -L * 0.34, 0.38, 0.032, 0.14);
    for (const sx of [-1, 1]) add(gp, BOX(), mat(shade(c, 0.9)), sx * 0.22, 0.09, 0.08, 0.24, 0.025, 0.09, sx * 0.3, 0, -sx * 0.25);
    if (r.fin) add(gp, CONE(4), mat(c), 0, 0.32, -0.02, 0.045, 0.18, 0.15, 0, -0.3);
    ball(gp, shade(c, 1.45), 0, 0.08, 0.03, 0.27 * Math.min(L, 1.2), 0.11, L * 0.52);
  },
  shark: (gp, r) => {
    const c = r.color!;
    ball(gp, c, 0, 0.16, 0, 0.26, 0.25, 0.92);
    add(gp, CONE(4), mat(c), 0, 0.37, -0.02, 0.065, 0.28, 0.21, 0, -0.35);
    add(gp, CONE(4), mat(c), 0, 0.22, -0.49, 0.055, 0.32, 0.15, 0, -0.9);
    for (const sx of [-1, 1]) add(gp, CONE(4), mat(c), sx * 0.18, 0.11, 0.08, 0.04, 0.22, 0.12, 0, 0, -sx * 1.2);
    ball(gp, '#f8fafc', 0, 0.10, 0.05, 0.21, 0.11, 0.72);
  },
  turtle: (gp, r) => {
    const c = r.color!;
    add(gp, SPH(12), mat(shade(c, 0.85)), 0, 0.10, 0, 0.56, 0.24, 0.66);
    add(gp, SPH(10), mat(shade(c, 1.05)), 0, 0.13, 0, 0.46, 0.20, 0.54);
    ball(gp, '#9ab070', 0, 0.08, 0.39, 0.15, 0.13, 0.19);
    for (const [x, z, rz] of [[-0.31, 0.12, 0.3], [0.31, 0.12, -0.3], [-0.21, -0.22, 0.2], [0.21, -0.22, -0.2]] as const) add(gp, SPH(), mat('#9ab070'), x, 0.05, z, 0.32, 0.045, 0.13, 0, 0, rz);
  },
  octopus: (gp, r) => {
    const c = r.color!;
    ball(gp, c, 0, 0.42, 0, 0.38, 0.44, 0.38);
    for (const x of [-0.085, 0.085]) {
      ball(gp, '#f8fafc', x, 0.36, 0.165, 0.085);
      ball(gp, '#111827', x, 0.36, 0.195, 0.04);
    }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; add(gp, CONE(6), mat(c), Math.cos(a) * 0.19, 0.11, Math.sin(a) * 0.19, 0.085, 0.36, 0.085, 0, Math.sin(a) * 1.0, -Math.cos(a) * 1.0); }
  },
  croc: (gp, r) => {
    const c = r.color!, L = r.short ? 0.78 : 1;
    ball(gp, c, 0, 0.11, 0, 0.27, 0.16, 0.82 * L);
    box(gp, c, 0, 0.06, 0.50 * L, 0.15, 0.075, 0.32 * L);
    for (const sx of [-0.05, 0.05]) ball(gp, '#fde047', sx, 0.15, 0.32 * L, 0.035);
    add(gp, CONE(5), mat(c), 0, 0.09, -0.60 * L, 0.13, 0.46 * L, 0.07, 0, -Math.PI / 2);
    for (const [x, z] of [[-0.16, 0.2], [0.16, 0.2], [-0.16, -0.18], [0.16, -0.18]]) box(gp, shade(c, 0.85), x, 0, z * L, 0.075, 0.075, 0.075);
    for (let i = 0; i < 5; i++) cone(gp, shade(c, 0.78), 0, 0.17, (-0.3 + i * 0.13) * L, 0.028, 0.065, 4);
  },
  // ---------- discoveries ----------
  wreck: (gp, r) => {
    box(gp, '#d8c08a', 0, 0, 0, 0.96, 0.025, 1.04);
    const t = new THREE.Group(); t.rotation.set(0.16, 0, 0.22); gp.add(t);
    box(t, r.color!, 0, 0.02, 0, 0.30, 0.18, 0.88);
    add(t, CONE(4), mat(r.color!), 0, 0.11, 0.54, 0.30, 0.25, 0.25, Math.PI / 4, Math.PI / 2);
    box(t, '#f8fafc', 0, 0.20, -0.08, 0.22, 0.11, 0.42);
    for (const z of [-0.18, -0.04, 0.10]) {
      cyl(t, '#d97706', 0, 0.31, z, 0.042, 0.18, 8);
      cyl(t, '#1e293b', 0, 0.45, z, 0.044, 0.04, 8);
    }
  },
  mystery: (gp, r) => {
    const q = add(gp, g('torus', () => new THREE.TorusGeometry(0.22, 0.065, 8, 18, Math.PI * 1.4)), mat(r.color!, { emissive: r.color }), 0, 0.68, 0, 1, 1, 1, 0, 0, -0.6);
    q.name = 'spin';
    cyl(gp, r.color!, 0, 0.25, 0, 0.055, 0.21, 8).material = mat(r.color!, { emissive: r.color });
    ball(gp, r.color!, 0, 0.12, 0, 0.13).material = mat(r.color!, { emissive: r.color });
  },
  serpent: (gp, r) => {
    cyl(gp, '#0369a1', 0, 0, 0, 0.52, 0.025, 18).material = mat('#0369a1', { transparent: 0.65 });
    for (let i = 0; i < 4; i++) add(gp, g('hump', () => new THREE.TorusGeometry(0.12, 0.055, 8, 12, Math.PI)), mat(r.color!), -0.34 + i * 0.22, 0.02, 0, 1, 1 + (i === 0 ? 0.6 : 0), 1);
    ball(gp, r.color!, -0.42, 0.34, 0, 0.15, 0.13, 0.11);
    if (r.tentacles) for (let i = 0; i < 3; i++) add(gp, CONE(6), mat(r.color!), 0.20 + i * 0.12, 0.22, 0.10, 0.065, 0.46, 0.065, 0, 0, -0.3);
  },
  vent: (gp, r) => {
    cyl(gp, '#1e293b', 0, 0, 0, 0.46, 0.03, 14);
    for (let i = 0; i < 3; i++) cone(gp, '#334155', -0.24 + i * 0.24, 0.03, i * 0.05, 0.13, 0.36 + i * 0.12, 8);
    ball(gp, r.color!, 0, 0.62, 0.08, 0.20).material = mat(r.color!, { emissive: r.color, transparent: 0.72 });
  },
  footprints: (gp, r) => {
    cyl(gp, '#d6d3d1', 0, 0, 0, 0.48, 0.025, 16);
    for (let i = 0; i < 4; i++) add(gp, SPH(8), mat(r.color!), (i % 2 ? 0.10 : -0.10), 0.03, -0.36 + i * 0.24, 0.14, 0.04, 0.24);
    tree(gp, 0.32, 0.025, 0.18, 0.10, '#2d6a4f', true);
    tree(gp, -0.32, 0.025, -0.18, 0.11, '#2d6a4f', true);
  },
  sunkencity: (gp, r) => {
    cyl(gp, '#cbd5e1', 0, 0, 0, 0.48, 0.03, 16);
    for (let i = 0; i < 5; i++) cyl(gp, '#e2e8f0', -0.30 + i * 0.15, 0.03, 0, 0.042, 0.22 + ((i * 7) % 3) * 0.12, 8);
    box(gp, '#e2e8f0', -0.15, 0.35, 0, 0.36, 0.045, 0.11);
    ball(gp, r.color!, 0, 0.04, 0, 0.96, 0.12, 0.62).material = mat(r.color!, { transparent: 0.45 });
  },
  crater: (gp, r) => {
    add(gp, g('craterRing', () => new THREE.TorusGeometry(0.32, 0.10, 8, 18).rotateX(Math.PI / 2)), mat('#785a3c'), 0, 0.06, 0, 1, 1, 1);
    ball(gp, r.color!, 0, 0.04, 0, 0.50, 0.065, 0.50).material = mat(r.color!, { emissive: r.color });
    if (r.trees) for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; add(gp, CYL(5), mat('#5a4a3a'), Math.cos(a) * 0.54, 0.03, Math.sin(a) * 0.54, 0.03, 0.30, 0.03, -a, 0, Math.PI / 2); }
    else for (let i = 0; i < 4; i++) cone(gp, '#fde047', -0.12 + i * 0.08, 0.04, (i % 2) * 0.08, 0.045, 0.22, 6).material = mat('#fde047', { emissive: '#f59e0b' });
  },
  crystals: (gp, r) => {
    cyl(gp, '#475569', 0, 0, 0, 0.36, 0.04, 12);
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; add(gp, CONE(6), mat(r.color!, { emissive: shade(r.color!, 0.45), transparent: 0.86 }), Math.cos(a) * 0.15, 0.26, Math.sin(a) * 0.15, 0.12, 0.62 - (i % 3) * 0.1, 0.12, 0, Math.sin(a) * 0.5, -Math.cos(a) * 0.5); }
  },
  // ---------- vehicles ----------
  ship: (gp, r) => {
    const c = r.color!, a = r.accent ?? '#dc2626';
    box(gp, c, 0, 0, 0, 0.28, 0.13, 0.92);
    add(gp, CONE(4), mat(c), 0, 0.065, 0.52, 0.28, 0.22, 0.13, Math.PI / 4, Math.PI / 2);
    box(gp, '#f8fafc', 0, 0.13, -0.16, 0.24, 0.14, 0.38);
    box(gp, '#38bdf8', 0, 0.22, 0.035, 0.22, 0.035, 0.02);
    cyl(gp, a, 0, 0.27, -0.16, 0.052, 0.15, 10);
    if (r.containers) for (let i = 0; i < 6; i++) box(gp, ['#dc2626', '#2563eb', '#eab308', '#16a34a'][i % 4], 0, 0.13, 0.04 + i * 0.065, 0.23, 0.09, 0.055);
  },
  plane: (gp, r) => {
    const c = r.color!, a = r.accent ?? '#2563eb';
    add(gp, CYL(12), mat(c), 0, 0, 0, 0.13, 0.92, 0.13, 0, Math.PI / 2);
    add(gp, CONE(12), mat(c), 0, 0, 0.52, 0.13, 0.14, 0.13, 0, Math.PI / 2);
    box(gp, '#38bdf8', 0, 0.03, 0.44, 0.09, 0.03, 0.06);
    box(gp, c, 0, -0.01, 0.02, 0.94, 0.024, 0.19);
    box(gp, c, 0, -0.01, -0.40, 0.36, 0.022, 0.11);
    box(gp, a, 0, 0.09, -0.40, 0.024, 0.18, 0.14);
    for (const x of [-0.23, 0.23]) add(gp, CYL(8), mat('#94a3b8'), x, -0.065, 0.04, 0.065, 0.15, 0.065, 0, Math.PI / 2);
  },
  train: (gp, r) => {
    const cars = num(r.cars, 4), c = r.color!, a = r.accent ?? '#dc2626';
    for (let i = 0; i < cars; i++) {
      box(gp, c, 0, 0.02, -i * 0.26, 0.15, 0.14, 0.24);
      box(gp, a, 0, 0.08, -i * 0.26, 0.154, 0.032, 0.24);
      box(gp, '#38bdf8', 0, 0.115, -i * 0.26, 0.156, 0.028, 0.18);
    }
    if (r.nose) add(gp, SPH(10), mat(c), 0, 0.07, 0.16, 0.15, 0.13, 0.28);
  },
  balloon: (gp, r) => {
    add(gp, SPH(14), mat(r.color!), 0, 0.70, 0, 0.56, 0.66, 0.56);
    for (let i = 0; i < 4; i++) add(gp, SPH(14), mat(r.accent ?? '#fde047'), 0, 0.70, 0, 0.57, 0.67, 0.12, (i * Math.PI) / 4);
    box(gp, '#92400e', 0, 0.12, 0, 0.15, 0.11, 0.15);
    for (const [x, z] of [[-0.06, -0.06], [0.06, -0.06], [-0.06, 0.06], [0.06, 0.06]]) add(gp, CYL(4), mat('#475569'), x, 0.30, z, 0.008, 0.30, 0.008);
  },
};

const FALLBACK: Builder = (gp, r) => { cyl(gp, r.color ?? '#ffcc33', 0, 0, 0, 0.12, 0.5); ball(gp, r.color ?? '#ffcc33', 0, 0.6, 0, 0.3); };

export const KINDS = Object.keys(B);

// Vertex-colored shared materials for baked static meshes
const bakedMatStd = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.08, flatShading: true });

interface Bucket { pos: number[]; norm: number[]; col: number[] }

/**
 * Merges static standard child meshes of a built model group into a single vertex-colored BufferGeometry mesh,
 * while preserving any animated sub-groups (`spin`, `flap`) or special emissive/transparent meshes.
 */
function bakeStaticMeshes(gp: THREE.Group): void {
  gp.updateMatrixWorld(true);
  const std: Bucket = { pos: [], norm: [], col: [] };
  const toRemove: THREE.Mesh[] = [];
  const tmpV = new THREE.Vector3();
  const tmpN = new THREE.Vector3();
  const normMat = new THREE.Matrix3();

  const walk = (obj: THREE.Object3D, animated: boolean) => {
    const isAnim = animated || obj.name === 'spin' || obj.name === 'flap';
    if (!isAnim && (obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      const m = mesh.material as THREE.MeshStandardMaterial;
      if (m && !m.transparent && (!m.emissive || m.emissive.getHex() === 0)) {
        const g0 = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry;
        const pAttr = g0.getAttribute('position');
        let nAttr = g0.getAttribute('normal');
        if (!nAttr) {
          g0.computeVertexNormals();
          nAttr = g0.getAttribute('normal');
        }
        if (pAttr && nAttr) {
          normMat.getNormalMatrix(mesh.matrixWorld);
          const cr = m.color.r, cg = m.color.g, cb = m.color.b;
          for (let i = 0; i < pAttr.count; i++) {
            tmpV.fromBufferAttribute(pAttr, i).applyMatrix4(mesh.matrixWorld);
            tmpN.fromBufferAttribute(nAttr, i).applyMatrix3(normMat).normalize();
            std.pos.push(tmpV.x, tmpV.y, tmpV.z);
            std.norm.push(tmpN.x, tmpN.y, tmpN.z);
            std.col.push(cr, cg, cb);
          }
          toRemove.push(mesh);
        }
      }
    }
    for (const ch of obj.children) walk(ch, isAnim);
  };
  walk(gp, false);

  for (const m of toRemove) m.parent?.remove(m);

  if (std.pos.length > 0) {
    const mergedGeo = new THREE.BufferGeometry();
    mergedGeo.setAttribute('position', new THREE.Float32BufferAttribute(std.pos, 3));
    mergedGeo.setAttribute('normal', new THREE.Float32BufferAttribute(std.norm, 3));
    mergedGeo.setAttribute('color', new THREE.Float32BufferAttribute(std.col, 3));
    const bakedMesh = new THREE.Mesh(mergedGeo, bakedMatStd);
    bakedMesh.castShadow = true;
    bakedMesh.receiveShadow = true;
    gp.add(bakedMesh);
  }
}

const modelProtoCache = new Map<string, THREE.Group>();

export function buildModel(recipe: ModelRecipe): THREE.Group {
  const key = JSON.stringify(recipe);
  let proto = modelProtoCache.get(key);
  if (!proto) {
    proto = new THREE.Group();
    (B[recipe.kind] ?? FALLBACK)(proto, { color: '#cccccc', ...recipe });
    bakeStaticMeshes(proto);
    modelProtoCache.set(key, proto);
  }
  return proto.clone(true);
}

