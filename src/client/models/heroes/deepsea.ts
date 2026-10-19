import * as THREE from 'three';
import type { Builder, Paint, V3 } from '../prims.ts';
import { add, g, mat, box, cyl, cone, rbox, rod, sweep, skin, slab, lathe, shade, mix, fbm, vnoise, hash3, paintFaces } from '../prims.ts';
import { type HFn, island, sstep, ridged, strataSide } from '../nature.ts';

// Underwater discovery dioramas: each sits on a sculpted sea-floor disc (radius 0.5) with its story subject,
// sea life, divers / submersibles for scale, drifting bubbles and glowing "marine snow". Front is +z.

const ISL = { rings: 34, segs: 84 };
const glow = (c: string) => mat(c, { emissive: c });
const SEABED_SIDE = strataSide(['#3f4a52', '#4a5660', '#36424b', '#55606a']);

const lowSph = (s: number) => g('ds-sph' + s, () => new THREE.SphereGeometry(1, s, Math.max(5, Math.round(s * 0.66))));
/** Cheap smooth ellipsoid (the shared prims.ellip is 22×15 segments — far too dense for dozens of small parts). */
function blob(p: THREE.Object3D, c: string, x: number, y: number, z: number, rx: number, ry = rx, rz = rx, roty = 0, rotx = 0, rotz = 0, s = 10): THREE.Mesh {
  return add(p, lowSph(s), mat(c, { flat: false }), x, y, z, rx, ry, rz, roty, rotx, rotz);
}

const M4 = (x: number, y: number, z: number, sx: number, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));

/** Merge many copies of one small geometry into a single mesh (one draw call for transparent / emissive swarms). */
function merged(p: THREE.Object3D, base: THREE.BufferGeometry, xf: THREE.Matrix4[], m: THREE.Material): THREE.Mesh {
  const b = base.index ? base.toNonIndexed() : base;
  const bp = b.getAttribute('position'), bn = b.getAttribute('normal');
  const pos = new Float32Array(xf.length * bp.count * 3), nor = new Float32Array(xf.length * bp.count * 3);
  const v = new THREE.Vector3(), nm = new THREE.Matrix3();
  xf.forEach((mx, i) => {
    nm.getNormalMatrix(mx);
    for (let k = 0; k < bp.count; k++) {
      v.fromBufferAttribute(bp, k).applyMatrix4(mx); pos.set([v.x, v.y, v.z], (i * bp.count + k) * 3);
      v.fromBufferAttribute(bn, k).applyMatrix3(nm).normalize(); nor.set([v.x, v.y, v.z], (i * bp.count + k) * 3);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return add(p, geo, m, 0, 0, 0, 1, 1, 1);
}
const OCT = () => g('ds-oct', () => new THREE.OctahedronGeometry(1, 0));

/** Glowing specks: bioluminescence, lamps, marine snow (one emissive draw call). */
function specks(p: THREE.Object3D, pts: V3[], r: number, c: string): void {
  merged(p, OCT(), pts.map(q => M4(q[0], q[1], q[2], r)), glow(c));
}
/** Drifting "marine snow" in a cylinder of radius R between y0 and y1. */
function snow(p: THREE.Object3D, seed: number, n: number, R: number, y0: number, y1: number, c = '#cfe8f5', r = 0.004): void {
  specks(p, Array.from({ length: n }, (_, i) => {
    const a = hash3(i, seed, 1) * Math.PI * 2, d = Math.sqrt(hash3(i, seed, 2)) * R;
    return [Math.cos(a) * d, y0 + hash3(i, seed, 3) * (y1 - y0), Math.sin(a) * d] as V3;
  }), r, c);
}
/** Column of rising bubbles (one translucent draw call). */
function bubbles(p: THREE.Object3D, seed: number, cols: [number, number, number, number, number][]): void {
  const xf: THREE.Matrix4[] = [];
  cols.forEach(([x, z, y0, y1, n], c) => {
    for (let i = 0; i < n; i++) {
      const t = i / n, s = 0.006 + 0.008 * hash3(i, seed + c, 3) * (0.5 + t);
      xf.push(M4(x + Math.sin(t * 9 + c) * 0.015, y0 + (y1 - y0) * t, z + (hash3(i, seed + c, 2) - 0.5) * 0.02, s));
    }
  });
  merged(p, lowSph(7), xf, mat('#e6f6ff', { transparent: 0.5, flat: false, emissive: '#3a6a80' }));
}
/** Translucent cone of light from `from` along `dir` (lamps, torches, sun shafts). */
function beam(p: THREE.Object3D, from: V3, dir: V3, len: number, r: number, c: string, op = 0.14): void {
  const geo = g(`ds-beam${len.toFixed(3)}:${r.toFixed(3)}`, () => new THREE.ConeGeometry(r, len, 16, 1, true).translate(0, -len / 2, 0));
  const m = add(p, geo, mat(c, { transparent: op, emissive: c }), from[0], from[1], from[2], 1, 1, 1);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(...dir).normalize());
  m.castShadow = false;
}
/** Soft sun shafts slanting down through the water (shallow sites). */
function shafts(p: THREE.Object3D, seed: number, n: number, top: number, c = '#bfeeff'): void {
  for (let i = 0; i < n; i++) {
    const x = (hash3(i, seed, 1) - 0.5) * 0.6, z = (hash3(i, seed, 2) - 0.5) * 0.5, w = 0.03 + hash3(i, seed, 3) * 0.03;
    const geo = g(`ds-shaft${w.toFixed(3)}:${top.toFixed(2)}`, () => new THREE.CylinderGeometry(w * 0.6, w * 1.6, top * 0.75, 8, 1, true));
    const m = add(p, geo, mat(c, { transparent: 0.07, emissive: c }), x, top * 0.55, z, 1, 1, 1, 0, 0.12, -0.18);
    m.castShadow = false;
  }
}
/** Group spinning about the model's vertical axis (scene animates rotation.z of groups named "spin"). */
function ySpin(p: THREE.Object3D): THREE.Group {
  const s = new THREE.Group(); s.name = 'spin'; s.rotation.x = -Math.PI / 2; p.add(s);
  const inner = new THREE.Group(); inner.rotation.x = Math.PI / 2; s.add(inner);
  return inner;
}
function grp(p: THREE.Object3D, x: number, y: number, z: number, ry = 0, rx = 0, rz = 0, s = 1): THREE.Group {
  const q = new THREE.Group(); q.position.set(x, y, z); q.rotation.set(rx, ry, rz); q.scale.setScalar(s); p.add(q); return q;
}

/** Small reef fish facing +z. */
function fish(p: THREE.Object3D, x: number, y: number, z: number, s: number, ry: number, c: string, stripe?: string): void {
  const f = grp(p, x, y, z, ry);
  blob(f, c, 0, 0, 0, s * 0.3, s * 0.42, s, 0, 0, 0, 8);
  if (stripe) blob(f, stripe, 0, 0, s * 0.15, s * 0.31, s * 0.36, s * 0.18, 0, 0, 0, 8);
  const t = slab(f, [[0, 0], [-s * 0.5, s * 0.45], [-s * 0.42, 0], [-s * 0.5, -s * 0.45]], s * 0.06, shade(c, 0.85), 0, false);
  t.rotation.y = Math.PI / 2; t.position.z = -s * 0.85;
  blob(f, '#111827', s * 0.22, s * 0.1, s * 0.6, s * 0.07, s * 0.07, s * 0.07, 0, 0, 0, 6);
  blob(f, '#111827', -s * 0.22, s * 0.1, s * 0.6, s * 0.07, s * 0.07, s * 0.07, 0, 0, 0, 6);
}

/** Scuba diver swimming along +z: wetsuit, tank, fins, mask and an optional torch beam. */
function diver(p: THREE.Object3D, x: number, y: number, z: number, ry: number, s: number, suit = '#1f2937', accent = '#f59e0b', torch = true, pitch = 0.15): void {
  const d = grp(p, x, y, z, ry, pitch, 0, s);
  sweep(d, [{ p: [0, 0, -0.05], w: 0.011, h: 0.009 }, { p: [0, 0, -0.02], w: 0.016, h: 0.011 }, { p: [0, 0.002, 0.02], w: 0.019, h: 0.013 }, { p: [0, 0.003, 0.04], w: 0.012, h: 0.01 }], suit, { radial: 10, sub: 3 });
  blob(d, suit, 0, 0.008, 0.055, 0.011, 0.011, 0.012);
  blob(d, '#7dd3fc', 0, 0.004, 0.064, 0.008, 0.005, 0.004, 0, 0, 0, 8).material = mat('#7dd3fc', { metal: 0.6, rough: 0.2, flat: false });
  const tk = cyl(d, accent, 0, 0.012, -0.03, 0.0075, 0.06, 8); tk.rotation.x = Math.PI / 2; tk.position.set(0, 0.018, -0.005);
  rod(d, [0, 0.026, 0.026], [0.006, 0.014, 0.05], 0.0018, '#111827', 4);
  for (const sx of [-1, 1]) {
    rod(d, [sx * 0.007, 0, -0.048], [sx * 0.009, 0.004 + sx * 0.004, -0.085], 0.0055, suit, 6);
    rod(d, [sx * 0.009, 0.004 + sx * 0.004, -0.085], [sx * 0.008, -0.002 - sx * 0.003, -0.115], 0.0045, suit, 6);
    box(d, accent, sx * 0.008, -0.004 - sx * 0.003, -0.135, 0.016, 0.002, 0.04, 0, -0.2 * sx);
    rod(d, [sx * 0.017, 0, 0.03], [sx * 0.022, -0.008, 0.052], 0.0042, suit, 6);
    rod(d, [sx * 0.022, -0.008, 0.052], [sx * 0.012, -0.01, 0.075], 0.0036, suit, 6);
  }
  if (torch) {
    cyl(d, '#e5e7eb', 0.012, -0.012, 0.074, 0.004, 0.012, 6).rotation.x = Math.PI / 2;
    blob(d, '#fff7cc', 0.012, -0.012, 0.082, 0.004, 0.004, 0.003, 0, 0, 0, 6).material = glow('#fff7cc');
    beam(d, [0.012, -0.012, 0.084], [0, -0.25, 1], 0.2, 0.05, '#fff2b0', 0.12);
  }
}

/** Rocky blob with noisy surface (boulders, coral heads). */
function rock(p: THREE.Object3D, c: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, seed: number, paint?: Paint): void {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const a = geo.getAttribute('position');
  for (let i = 0; i < a.count; i++) {
    const vx = a.getX(i), vy = a.getY(i), vz = a.getZ(i), k = 0.75 + 0.5 * vnoise(vx * 2 + seed, vy * 2, vz * 2 + seed * 0.3);
    a.setXYZ(i, vx * rx * k + x, Math.max(vy * ry * k, -ry * 0.3) + y, vz * rz * k + z);
  }
  geo.computeVertexNormals();
  add(p, paintFaces(geo, c, paint), mat('#ffffff', { vc: true }), 0, 0, 0, 1, 1, 1);
}

// =========================================================================================================
// Lost City: white carbonate towers on the Atlantis Massif, warm-fluid "mirror pools" under the flanges, Alvin
// =========================================================================================================

/** Knobbly carbonate spire: noisy lofted rings that taper to a ragged tip, optionally leaning. */
function spire(p: THREE.Object3D, x: number, y: number, z: number, h: number, r0: number, seed: number, lean: [number, number] = [0, 0]): void {
  const R = 10, rows = Math.max(5, Math.round(h * 30)), rings: V3[][] = [];
  for (let i = 0; i <= rows; i++) {
    const t = i / rows, rad = r0 * (1 - 0.7 * Math.pow(t, 0.9)) * (0.8 + 0.45 * vnoise(seed, t * h * 22, 2)) * (i === rows ? 0.55 : 1);
    const ox = lean[0] * t * t * h, oz = lean[1] * t * t * h, ring: V3[] = [];
    for (let j = 0; j < R; j++) {
      const a = (j / R) * Math.PI * 2, k = 0.72 + 0.56 * vnoise(Math.cos(a) * 1.4 + seed, t * h * 16, Math.sin(a) * 1.4 + seed * 0.7);
      ring.push([x + ox + Math.cos(a) * rad * k, y + t * h, z + oz + Math.sin(a) * rad * k]);
    }
    rings.push(ring);
  }
  skin(p, rings, '#efebe0', {
    caps: true, flat: false, paint: (px, py, pz) => {
      const v = fbm(px * 40, py * 30, pz * 40);
      if (py - y > h * 0.86) return '#fbfaf4';
      if (v > 0.64) return '#cfc4a8';
      if (v < 0.36) return '#f6f3ea';
      return py - y < 0.03 ? '#c9c1aa' : null;
    },
  });
}

const lostcity: Builder = (gp) => {
  const hf: HFn = (x, z) => 0.02 + 0.11 * sstep(0.0, -0.5, z + x * 0.25) * (0.6 + 0.6 * ridged(x * 4 + 2, z * 4)) + 0.006 * fbm(x * 22, 0, z * 22)
    + 0.03 * Math.exp(-((x - 0.02) ** 2 + (z + 0.04) ** 2) / 0.02);
  island(gp, 0.5, hf, '#55655d', (x, y, z, _nx, ny) => {
    const v = fbm(x * 16, y * 12, z * 16), d = Math.hypot(x - 0.02, z + 0.04);
    if (d < 0.17 + 0.08 * v) return v > 0.5 ? '#e6e0cf' : '#d4cbb4';
    if (ny < 0.75) return v > 0.5 ? '#3d4a44' : '#48564f';
    return hash3(Math.floor(x * 70), 2, Math.floor(z * 70)) > 0.9 ? '#6f7d62' : mix('#5c6d63', '#46544d', v);
  }, { ...ISL, side: strataSide(['#3e4a45', '#4a5852', '#37433e', '#56645c']) });
  const gy = (x: number, z: number) => 0.035 + hf(x, z) - 0.006;
  // Poseidon: a fused cluster of tall pinnacles rising from a white mound, flanges with shimmering pools
  const cx = 0.02, cz = -0.04, base = gy(cx, cz);
  rock(gp, '#e3dccb', cx, base, cz, 0.15, 0.06, 0.11, 3, (px, py, pz) => (fbm(px * 40, py * 40, pz * 40) > 0.6 ? '#cbbf9f' : null));
  const tw: [number, number, number, number, number, number][] = [
    [0, 0, 0.6, 0.075, 0, 0], [-0.07, 0.02, 0.44, 0.05, -0.12, 0.05], [0.075, -0.01, 0.48, 0.055, 0.1, -0.04], [-0.035, -0.05, 0.36, 0.045, -0.05, -0.12],
    [0.04, 0.05, 0.3, 0.04, 0.05, 0.12], [-0.12, -0.02, 0.26, 0.04, -0.15, 0], [0.13, 0.03, 0.22, 0.035, 0.16, 0.06], [0.0, 0.07, 0.2, 0.035, 0, 0.1],
  ];
  tw.forEach(([dx, dz, h, r, lx, lz], i) => spire(gp, cx + dx, base + 0.02, cz + dz, h, r, i * 3.7 + 1, [lx, lz]));
  // Flanges: horizontal shelves with mirror-like pools of hot fluid trapped underneath
  for (const [dx, dy, dz, w, a] of [[0.07, 0.2, 0.03, 0.07, 0.3], [-0.08, 0.15, 0.04, 0.06, -0.5], [0.02, 0.32, 0.04, 0.05, 1.2], [0.11, 0.1, -0.02, 0.05, 0.8]] as const) {
    blob(gp, '#efeadf', cx + dx, base + dy, cz + dz, w, 0.012, w * 0.7, a, 0, 0, 10);
    blob(gp, '#9fe8ff', cx + dx, base + dy - 0.011, cz + dz, w * 0.82, 0.004, w * 0.56, a, 0, 0, 10).material = mat('#bdf3ff', { emissive: '#3fb7d9', metal: 0.8, rough: 0.1, flat: false });
  }
  // Outlying small chimneys and a toppled one
  for (const [x, z, h, s] of [[-0.3, 0.12, 0.16, 11], [-0.22, 0.24, 0.11, 12], [0.28, 0.16, 0.13, 13], [0.33, -0.08, 0.2, 14], [-0.28, -0.18, 0.22, 15], [0.18, 0.3, 0.08, 16], [-0.08, 0.3, 0.07, 17]] as const) {
    spire(gp, x, gy(x, z), z, h, 0.03, s, [(hash3(s, 1, 1) - 0.5) * 0.2, (hash3(s, 1, 2) - 0.5) * 0.2]);
  }
  const top = grp(gp, 0.2, gy(0.2, 0.18) + 0.015, 0.18, 0.7, 0, Math.PI / 2 - 0.08);
  spire(top, 0, -0.08, 0, 0.16, 0.022, 21);
  // Life: white snails, red crabs, a wreckfish, glowing microbes and marine snow
  for (let i = 0; i < 14; i++) {
    const a = hash3(i, 31, 1) * Math.PI * 2, d = 0.1 + hash3(i, 31, 2) * 0.12, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d * 0.8;
    blob(gp, '#f3efe4', x, gy(x, z) + 0.006, z, 0.006, 0.005, 0.006, 0, 0, 0, 6);
  }
  for (const [x, z, a] of [[0.17, 0.16, 0.6], [-0.16, 0.18, -0.4]] as const) {
    const c = grp(gp, x, gy(x, z) + 0.008, z, a);
    blob(c, '#d9542b', 0, 0, 0, 0.018, 0.008, 0.014);
    for (const sx of [-1, 1]) {
      for (let k = 0; k < 3; k++) rod(c, [sx * 0.012, 0, -0.008 + k * 0.007], [sx * 0.03, -0.008, -0.012 + k * 0.009], 0.0022, '#c2410c', 4);
      blob(c, '#e2622f', sx * 0.016, 0.002, 0.02, 0.007, 0.005, 0.009, 0, 0, 0, 6);
    }
  }
  const wf = grp(gp, -0.2, 0.36, 0.14, 0.9);
  sweep(wf, [{ p: [0, 0, -0.06], w: 0.004, h: 0.012 }, { p: [0, 0, -0.02], w: 0.013, h: 0.026 }, { p: [0, 0, 0.03], w: 0.014, h: 0.024 }, { p: [0, -0.002, 0.06], w: 0.006, h: 0.01 }], '#6b7280', {
    radial: 10, sub: 3, paint: (_x, y) => (y < -0.012 ? '#9ca3af' : null),
  });
  slab(wf, [[0, 0], [-0.02, 0.02], [-0.02, -0.02]], 0.004, '#4b5563', 0, false).rotation.y = Math.PI / 2;
  (wf.children[wf.children.length - 1] as THREE.Mesh).position.z = -0.062;
  specks(gp, Array.from({ length: 22 }, (_, i) => [cx + (hash3(i, 9, 1) - 0.5) * 0.35, base + 0.04 + hash3(i, 9, 2) * 0.5, cz + (hash3(i, 9, 3) - 0.5) * 0.3] as V3), 0.005, '#7ef0ff');
  snow(gp, 41, 40, 0.48, 0.12, 0.8);
  // Alvin: white hull, red sail, viewports, lights, manipulator arm and sample basket
  const al = grp(gp, -0.36, 0.4, 0.02, Math.PI / 2 + 0.2, 0.08);
  sweep(al, [{ p: [0, 0, -0.1], w: 0.012, h: 0.014 }, { p: [0, 0.004, -0.07], w: 0.04, h: 0.042 }, { p: [0, 0.004, 0.03], w: 0.044, h: 0.046 }, { p: [0, -0.004, 0.085], w: 0.032, h: 0.032 }, { p: [0, -0.01, 0.1], w: 0.01, h: 0.01 }], '#f8fafc', {
    radial: 16, sub: 4, paint: (_x, y) => (y < -0.03 ? '#e2e8f0' : null),
  });
  rbox(al, '#dc2626', 0, 0.036, -0.02, 0.012, 0.032, 0.05, 0.005);
  rbox(al, '#b91c1c', 0, 0.066, -0.018, 0.009, 0.005, 0.036, 0.002);
  box(al, '#f1f5f9', 0, -0.05, -0.02, 0.07, 0.008, 0.1);
  for (const sx of [-1, 1]) {
    cyl(al, '#334155', sx * 0.045, -0.03, -0.085, 0.009, 0.02, 8).rotation.x = Math.PI / 2;
    blob(al, '#1e293b', sx * 0.016, -0.008, 0.088, 0.006, 0.006, 0.004, 0, 0, 0, 6);
    blob(al, '#fff7cc', sx * 0.03, 0.02, 0.07, 0.006, 0.006, 0.004, 0, 0, 0, 6).material = glow('#fff7cc');
  }
  blob(al, '#0f172a', 0, -0.022, 0.09, 0.008, 0.008, 0.005, 0, 0, 0, 6);
  rod(al, [0.025, -0.045, 0.06], [0.04, -0.06, 0.11], 0.004, '#94a3b8', 6);
  rod(al, [0.04, -0.06, 0.11], [0.035, -0.08, 0.14], 0.0035, '#94a3b8', 6);
  box(al, '#facc15', 0, -0.07, 0.07, 0.06, 0.018, 0.03);
  beam(al, [0.03, 0.02, 0.075], [0.05, -0.45, 1], 0.26, 0.06, '#fff2b0', 0.08);
  beam(al, [-0.03, 0.02, 0.075], [-0.05, -0.4, 1], 0.26, 0.06, '#fff2b0', 0.08);
  bubbles(gp, 5, [[-0.31, 0.24, 0.5, 0.7, 6], [cx + 0.01, cz, base + 0.66, 0.85, 5]]);
};

// =========================================================================================================
// Deepest snailfish: hadal trench floor, baited camera lander with yellow floats, pale snailfish and amphipods
// =========================================================================================================

function snailfish(p: THREE.Object3D, x: number, y: number, z: number, ry: number, s: number, rz = 0): void {
  const f = grp(p, x, y, z, ry, 0, rz, s);
  sweep(f, [
    { p: [0, 0, 0.085], w: 0.011, h: 0.011 }, { p: [0, 0.003, 0.065], w: 0.024, h: 0.022 }, { p: [0, 0, 0.035], w: 0.025, h: 0.024 },
    { p: [0, 0.002, 0.0], w: 0.016, h: 0.018 }, { p: [0, 0.004, -0.04], w: 0.009, h: 0.012 }, { p: [0, 0.006, -0.08], w: 0.004, h: 0.007 }, { p: [0, 0.008, -0.105], w: 0.001, h: 0.002 },
  ], '#f2dcd6', {
    radial: 12, sub: 3, paint: (_x, py, pz) => (pz > 0.015 && py < -0.008 ? '#f0b9a6' : pz > 0.05 && py > 0.0 ? '#f6d2cc' : pz < -0.05 ? '#ece7e2' : null),
  });
  // Continuous dorsal + anal fin ribbons, broad pectoral "wings", tiny dark eyes
  for (const sy of [1, -1]) {
    const fin = slab(f, [[0.025, 0], [0.0, 0.009 * sy], [-0.06, 0.008 * sy], [-0.1, 0.003 * sy], [-0.1, 0], [-0.04, -0.004 * sy]], 0.0016, '#f3e2dd', 0, false);
    fin.rotation.y = -Math.PI / 2; fin.position.set(0, sy * 0.011 + 0.004, 0.0);
  }
  for (const sx of [-1, 1]) {
    const pf = slab(f, [[0, 0], [0.022, 0.006], [0.03, -0.008], [0.01, -0.016]], 0.0016, '#f7e4df', 0, true);
    pf.position.set(sx * 0.018, -0.008, 0.05); pf.rotation.set(Math.PI / 2, 0, sx > 0 ? -0.3 : Math.PI + 0.3);
    blob(f, '#1f2937', sx * 0.016, 0.009, 0.07, 0.0045, 0.0045, 0.0045, 0, 0, 0, 6);
  }
}

const snail: Builder = (gp) => {
  const hf: HFn = (x, z) => 0.015 + 0.24 * sstep(0.2, 0.5, Math.abs(x + z * 0.15)) * (0.6 + 0.6 * ridged(x * 5 + 1, z * 5)) + 0.01 * fbm(x * 18, 0, z * 18)
    + 0.04 * sstep(0.1, 0.5, -z);
  island(gp, 0.5, hf, '#6b6248', (x, y, z, _nx, ny) => {
    const v = fbm(x * 18, y * 14, z * 18), lit = Math.exp(-(x * x + (z - 0.05) ** 2) / 0.05);
    if (ny < 0.72) return v > 0.5 ? '#3a372f' : '#2e2c26';
    const c = hash3(Math.floor(x * 80), 3, Math.floor(z * 80)) > 0.92 ? '#4d4636' : mix('#5c543e', '#4a4433', v);
    return mix(c, '#a39461', lit * 0.55);
  }, { ...ISL, side: SEABED_SIDE });
  const gy = (x: number, z: number) => 0.035 + hf(x, z) - 0.005;
  // Lander: four legs, square frame, syntactic-foam floats, camera & lights, bait pole down to the bait bag
  const LS = 0.82, L = grp(gp, 0, 0, -0.14, 0, 0, 0, LS);
  const legs: [number, number][] = [[-0.12, -0.1], [0.12, -0.1], [-0.12, 0.1], [0.12, 0.1]];
  const fy = 0.36;
  for (const [x, z] of legs) {
    const y0 = gy(x * LS, z * LS - 0.14) / LS;
    rod(L, [x * 1.25, y0, z * 1.25], [x * 0.7, fy, z * 0.7], 0.007, '#9ca3af', 6);
    cyl(L, '#4b5563', x * 1.25, y0 - 0.002, z * 1.25, 0.02, 0.008, 8);
  }
  for (const [a, b] of [[0, 1], [1, 3], [3, 2], [2, 0]]) rod(L, [legs[a][0] * 0.7, fy, legs[a][1] * 0.7], [legs[b][0] * 0.7, fy, legs[b][1] * 0.7], 0.006, '#cbd5e1', 6);
  for (const [a, b] of [[0, 1], [1, 3], [3, 2], [2, 0]]) rod(L, [legs[a][0] * 1.0, 0.17, legs[a][1] * 1.0], [legs[b][0] * 1.0, 0.17, legs[b][1] * 1.0], 0.005, '#9ca3af', 6);
  for (const sx of [-1, 1]) {
    rbox(L, '#facc15', sx * 0.05, fy + 0.005, 0, 0.09, 0.08, 0.17, 0.02);
    box(L, '#111827', sx * 0.05, fy + 0.04, -0.086, 0.091, 0.014, 0.002);
    box(L, '#111827', sx * 0.05, fy + 0.04, 0.086, 0.091, 0.014, 0.002);
  }
  rbox(L, '#f97316', 0, fy + 0.085, 0, 0.03, 0.02, 0.03, 0.006);
  rod(L, [0, fy + 0.105, 0], [0, fy + 0.17, 0], 0.003, '#9ca3af', 4);
  blob(L, '#f97316', 0, fy + 0.175, 0, 0.012, 0.012, 0.012, 0, 0, 0, 8);
  const cam = cyl(L, '#64748b', 0, 0.24, 0.085, 0.022, 0.08, 12); cam.rotation.x = Math.PI / 2 + 0.6; cam.position.set(0, 0.26, 0.09);
  blob(L, '#1e3a8a', 0, 0.235, 0.125, 0.017, 0.017, 0.006, 0, 0.6, 0, 10).material = mat('#1e3a8a', { metal: 0.6, rough: 0.15, flat: false });
  rod(L, [0, 0.17, 0.1], [0, 0.24, 0.07], 0.004, '#9ca3af');
  for (const sx of [-1, 1]) {
    const lx = sx * 0.07;
    cyl(L, '#94a3b8', lx, 0.2, 0.1, 0.012, 0.03, 8).rotation.x = 0.6;
    blob(L, '#fffbe6', lx, 0.198, 0.118, 0.01, 0.01, 0.005, 0, 0.6, 0, 8).material = glow('#fffbe6');
    beam(L, [lx, 0.195, 0.12], [-sx * 0.3, -1, 0.9], 0.24, 0.07, '#fff3c4', 0.1);
  }
  const bx = 0, bz = 0.1, by = gy(bx, bz);
  rod(L, [0, 0.17, 0.1], [0, (by + 0.03) / LS, (bz + 0.14) / LS], 0.004, '#cbd5e1', 5);
  blob(gp, '#3f3b34', bx, by + 0.025, bz, 0.03, 0.03, 0.032, 0, 0, 0, 10);
  for (let i = 0; i < 5; i++) blob(gp, '#9aa3ad', bx + (hash3(i, 2, 1) - 0.5) * 0.04, by + 0.02 + hash3(i, 2, 2) * 0.03, bz + (hash3(i, 2, 3) - 0.5) * 0.04, 0.012, 0.006, 0.02, hash3(i, 2, 4) * 3, 0, 0, 8);
  // Colour-banded scale bar on the sea floor (as in the expedition footage)
  const pal = ['#ef4444', '#facc15', '#22c55e', '#3b82f6'];
  for (let i = 0; i < 8; i++) {
    const m = cyl(gp, pal[i % 4], -0.22 + i * 0.03, by + 0.006, 0.33, 0.006, 0.03, 6); m.rotation.z = Math.PI / 2; m.position.y = gy(-0.22 + i * 0.03, 0.33) + 0.006;
  }
  // Snailfish crowding the bait, a few cruising above
  for (const [a, d, s, dy, tw] of [[0.5, 0.15, 1.5, 0.0, 0.4], [1.5, 0.16, 1.4, 0.04, -0.5], [2.5, 0.15, 1.55, 0.0, 0.3], [3.6, 0.17, 1.3, 0.06, -0.7], [5.0, 0.15, 1.45, 0.01, 0.5]] as const) {
    const x = bx + Math.cos(a) * d, z = bz + Math.sin(a) * d;
    snailfish(gp, x, gy(x, z) + 0.016 + dy, z, Math.atan2(bx - x, bz - z) + tw, s, (hash3(a, 2, 1) - 0.5) * 0.4);
  }
  const sp = ySpin(gp);
  snailfish(sp, 0.32, 0.32, 0.0, Math.PI, 1.5, 0.1);
  snailfish(sp, -0.28, 0.44, 0.12, 0, 1.3);
  // Amphipods swarming the bait, marine snow
  const amph: THREE.Matrix4[] = [];
  for (let i = 0; i < 40; i++) {
    const a = hash3(i, 6, 1) * Math.PI * 2, d = 0.02 + hash3(i, 6, 2) * 0.09, x = bx + Math.cos(a) * d, z = bz + Math.sin(a) * d;
    amph.push(M4(x, gy(x, z) + 0.01 + hash3(i, 6, 3) * 0.06, z, 0.006, 0.004, 0.011, 0, a, 0));
  }
  merged(gp, lowSph(6), amph, mat('#f5efe1', { flat: false, emissive: '#3a3020' }));
  snow(gp, 51, 50, 0.48, 0.1, 0.75, '#e5e7eb', 0.0035);
};

// =========================================================================================================
// Great Blue Hole: cut-away limestone block — turquoise reef flat, deep-blue shaft, stalactites in the drowned cave
// =========================================================================================================

const bluehole: Builder = (gp) => {
  const H = 0.32, P0 = Math.PI / 4, PL = Math.PI * 1.5;
  // Profile [r, y] around the rock cross-section: base → outer wall → reef top → inner wall with cave → floor
  const top: [number, number][] = [];
  for (let i = 0; i <= 14; i++) {
    const r = 0.5 - (i / 14) * 0.29;
    top.push([r, H + (r < 0.27 ? 0.012 * Math.sin((r - 0.21) * 50) + 0.01 : r > 0.43 ? 0.012 : 0.0) + 0.003 * Math.sin(r * 120)]);
  }
  const inner: [number, number][] = [[0.2, H - 0.02], [0.198, H - 0.06], [0.21, 0.24], [0.255, 0.225], [0.27, 0.19], [0.255, 0.16], [0.22, 0.15], [0.19, 0.12], [0.18, 0.095], [0.165, 0.07], [0.13, 0.05]];
  const outer: [number, number][] = Array.from({ length: 12 }, (_, i) => [0.5, (i / 11) * (H - 0.004)]);
  const prof: [number, number][] = [[0.001, 0], ...outer, ...top, ...inner, [0.06, 0.045], [0.001, 0.05]];
  const strata = (y: number, r: number) => {
    const b = Math.floor(y * 40 + fbm(r * 10, y * 8, 1) * 1.5) % 4;
    return ['#d8cba8', '#c4b590', '#b5a582', '#cdbf9c'][b];
  };
  const rockPaint: Paint = (x, y, z, _nx, ny) => {
    const r = Math.hypot(x, z);
    if (y > H - 0.005 && ny > 0.5) {
      if (r < 0.28 || r > 0.44) return fbm(x * 30, 1, z * 30) > 0.5 ? '#8a7f55' : '#6f7a4a';
      return fbm(x * 14, 2, z * 14) > 0.58 ? '#c9d7a6' : '#efe7cc';
    }
    if (y < 0.06 && r < 0.17) return '#8a8f86';
    if (r < 0.3) return mix(strata(y, r), '#1d3f7a', 0.35 + 0.45 * (1 - y / H));
    return mix(strata(y, r), '#3b6f8f', 0.12 + 0.3 * (1 - y / H));
  };
  const lg = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 72, P0, PL);
  add(gp, paintFaces(lg, '#cfc4a6', rockPaint), mat('#ffffff', { vc: true, flat: true, rough: 0.9 }), 0, 0, 0, 1, 1, 1);
  // Cut faces (cross-section) at both ends of the 270° sweep, built as banded strips so the strata paint reads
  const rIn = (y: number) => {
    if (y <= 0.05) return 0;
    for (let i = 0; i < inner.length - 1; i++) {
      const [r0, y0] = inner[i], [r1, y1] = inner[i + 1];
      if (y <= y0 && y >= y1) return r0 + (r1 - r0) * ((y0 - y) / (y0 - y1 || 1));
    }
    return 0.13;
  };
  for (const [phi, sgn] of [[P0, -1], [P0 + PL, 1]] as const) {
    const pos: number[] = [], sx = Math.sin(phi), sz = Math.cos(phi), NB = 26, NR = 6;
    for (let i = 0; i < NB; i++) {
      const ya = (i / NB) * (H - 0.004), yb = ((i + 1) / NB) * (H - 0.004), ra = rIn(ya), rb = rIn(yb);
      for (let k = 0; k < NR; k++) {
        const u0 = k / NR, u1 = (k + 1) / NR;
        const q = [[ra + (0.5 - ra) * u0, ya], [ra + (0.5 - ra) * u1, ya], [rb + (0.5 - rb) * u1, yb], [rb + (0.5 - rb) * u0, yb]].map(([r, y]) => [r * sx, y, r * sz]);
        const tri = sgn < 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
        for (const t of tri) pos.push(...q[t]);
      }
    }
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    cg.computeVertexNormals();
    add(gp, paintFaces(cg, '#cfc4a6', (x, y, z) => {
      const r = Math.hypot(x, z);
      if (y > H - 0.02) return '#8a7f55';
      if (r < 0.3 && y > 0.14 && y < 0.25) return '#7d735a';
      return mix(strata(y, r), '#3b6f8f', 0.1 + 0.2 * (1 - y / H));
    }), mat('#ffffff', { vc: true, flat: true, rough: 0.9 }), 0, 0, 0, 1, 1, 1);
  }
  // Water: turquoise shallows over the reef flat and a deep-blue column filling the hole (lathes share the cut)
  const wl = H + 0.022;
  const water = (pr: [number, number][], c: string, op: number, em: string) => {
    const m = add(gp, new THREE.LatheGeometry(pr.map(([r, y]) => new THREE.Vector2(r, y)), 64, P0, PL), mat(c, { transparent: op, emissive: em, flat: false }), 0, 0, 0, 1, 1, 1);
    m.castShadow = false;
  };
  water([[0.5, wl], [0.2, wl]], '#38d3d0', 0.4, '#0e6f7a');
  water([[0.2, wl + 0.001], [0.001, wl + 0.001]], '#0a2a6b', 0.82, '#06163d');
  water([[0.001, 0.05], [0.06, 0.045], [0.13, 0.05], [0.165, 0.07], [0.19, 0.12], [0.197, 0.2], [0.197, wl]], '#0b3f9e', 0.35, '#071d4f');
  // Stalactites hanging from the drowned cave roof, stalagmites on its ledge
  for (let i = 0; i < 34; i++) {
    const a = P0 + (i / 34) * PL + hash3(i, 1, 1) * 0.08, r = 0.21 + hash3(i, 1, 2) * 0.04, l = 0.03 + hash3(i, 1, 3) * 0.05;
    const m = cone(gp, i % 3 ? '#d9cfb2' : '#c7b994', Math.sin(a) * r, 0.237 - l, Math.cos(a) * r, 0.007 + hash3(i, 1, 4) * 0.005, l, 6);
    m.rotation.x = Math.PI; m.position.y = 0.237 - l / 2;
  }
  for (let i = 0; i < 14; i++) {
    const a = P0 + (i / 14) * PL + 0.1, r = 0.235 + hash3(i, 2, 2) * 0.02, l = 0.015 + hash3(i, 2, 3) * 0.025;
    cone(gp, '#cbbd98', Math.sin(a) * r, 0.17, Math.cos(a) * r, 0.007, l, 6);
  }
  // Reef rim: coral heads, sea fans and sponges around the lip; boat with a wake on the surface
  for (let i = 0; i < 40; i++) {
    const a = P0 + hash3(i, 3, 1) * PL, r = 0.22 + hash3(i, 3, 2) * 0.06, x = Math.sin(a) * r, z = Math.cos(a) * r, s = 0.012 + hash3(i, 3, 3) * 0.018;
    const c = ['#a16207', '#7c8f4a', '#c084fc', '#e9d5a0', '#f97316'][i % 5];
    if (i % 5 === 2) { const f = slab(gp, [[0, 0], [-0.02, 0.03], [0, 0.045], [0.02, 0.03]], 0.002, c, 0, true); f.position.set(x, H + 0.01, z); f.rotation.y = a; }
    else blob(gp, c, x, H + 0.012, z, s, s * 0.7, s, 0, 0, 0, 7);
  }
  for (let i = 0; i < 16; i++) {
    const a = P0 + hash3(i, 4, 1) * PL, r = 0.44 + hash3(i, 4, 2) * 0.05, s = 0.01 + hash3(i, 4, 3) * 0.014;
    blob(gp, i % 2 ? '#9a8a5a' : '#6f7a4a', Math.sin(a) * r, H + 0.01, Math.cos(a) * r, s, s * 0.7, s, 0, 0, 0, 7);
  }
  const bt = grp(gp, -0.3, wl + 0.004, -0.2, -0.5);
  sweep(bt, [{ p: [0, 0.01, -0.05], w: 0.022, h: 0.012 }, { p: [0, 0.01, 0.0], w: 0.024, h: 0.013 }, { p: [0, 0.012, 0.045], w: 0.01, h: 0.01 }], '#f8fafc', { radial: 10, sub: 3, squash: 0.6 });
  rbox(bt, '#e2e8f0', 0, 0.02, -0.012, 0.03, 0.016, 0.04, 0.004);
  box(bt, '#1e3a8a', 0, 0.028, 0.01, 0.026, 0.008, 0.004);
  for (const sx of [-1, 1]) {
    const w = slab(bt, [[sx * 0.012, 0], [sx * 0.06, -0.16], [sx * 0.045, -0.16]], 0.001, '#f8fafc', 0, false);
    w.rotation.x = -Math.PI / 2; w.position.set(0, 0.002, -0.045); w.material = mat('#ffffff', { transparent: 0.6 });
  }
  // Reef sharks circling inside the shaft, a diver with torch at the stalactites, fish on the reef
  const sp = ySpin(gp);
  for (const [a, y] of [[0, 0.13], [Math.PI, 0.2]] as const) {
    const s = grp(sp, Math.cos(a) * 0.12, y, Math.sin(a) * 0.12, -a);
    sweep(s, [{ p: [0, 0, -0.06], w: 0.003, h: 0.004 }, { p: [0, 0, -0.03], w: 0.009, h: 0.011 }, { p: [0, 0, 0.02], w: 0.012, h: 0.014 }, { p: [0, -0.002, 0.055], w: 0.004, h: 0.005 }], '#7b8794', {
      radial: 10, sub: 3, paint: (_x, y2) => (y2 < -0.005 ? '#e5e7eb' : null),
    });
    const df = slab(s, [[0, 0], [-0.012, 0.022], [-0.018, 0]], 0.002, '#6b7280', 0, false); df.rotation.y = Math.PI / 2; df.position.set(0, 0.01, 0.0);
    const tf = slab(s, [[0, 0], [-0.025, 0.025], [-0.016, 0], [-0.022, -0.015]], 0.002, '#6b7280', 0, false); tf.rotation.y = Math.PI / 2; tf.position.set(0, 0, -0.055);
    for (const sx of [-1, 1]) { const pf = slab(s, [[0, 0], [0.02, -0.004], [0.004, -0.012]], 0.002, '#6b7280', 0, false); pf.rotation.set(-Math.PI / 2 + 0.3, 0, sx > 0 ? 0 : Math.PI); pf.position.set(sx * 0.01, -0.006, 0.015); }
  }
  diver(gp, 0.04, 0.2, 0.17, Math.PI * 0.85, 0.85, '#111827', '#facc15', true, 0.25);
  for (const [x, z, ry, c] of [[0.36, 0.1, 1.2, '#facc15'], [0.3, -0.3, 2.4, '#38bdf8'], [-0.38, 0.0, -0.6, '#f472b6'], [0.1, -0.4, 0.3, '#fb923c']] as const) fish(gp, x, H + 0.07, z, 0.016, ry, c, '#1e3a8a');
  bubbles(gp, 7, [[0.03, 0.2, 0.22, 0.34, 6]]);
};

// =========================================================================================================
// Yonaguni Monument: stepped sandstone terraces with sheer right-angled walls, twin megaliths, hammerheads
// =========================================================================================================

/** Sharp-edged stone block with slightly jittered corners; tops get algae / coralline paint, sides bedding lines. */
function block(p: THREE.Object3D, x: number, y: number, z: number, sx: number, sy: number, sz: number, ry: number, seed: number): void {
  const geo = new THREE.BoxGeometry(sx, sy, sz, Math.max(1, Math.round(sx * 16)), Math.max(1, Math.round(sy * 40)), Math.max(1, Math.round(sz * 16)));
  const a = geo.getAttribute('position');
  for (let i = 0; i < a.count; i++) {
    const vx = a.getX(i), vy = a.getY(i), vz = a.getZ(i), n = vnoise(vx * 30 + seed, vy * 30, vz * 30) - 0.5;
    a.setXYZ(i, vx + n * 0.006, vy + n * 0.004 + sy / 2, vz + n * 0.006);
  }
  geo.computeVertexNormals();
  const pg = paintFaces(geo, '#7c8a92', (px, py, pz, _nx, ny) => {
    const wx = px + x, wz = pz + z, v = fbm(wx * 9, py * 9 + seed, wz * 9);
    if (ny > 0.7) return v > 0.64 ? '#9b7aa8' : v > 0.5 ? '#86a070' : '#9aa8a4';
    if (Math.abs(Math.sin((py + y) * 120)) > 0.94) return '#5d6a74';
    return v > 0.62 ? '#6f7d86' : null;
  });
  pg.computeVertexNormals();
  add(p, pg, mat('#ffffff', { vc: true, flat: true }), x, y, z, 1, 1, 1, ry);
}

function hammerhead(p: THREE.Object3D, x: number, y: number, z: number, ry: number, s: number): void {
  const h = grp(p, x, y, z, ry, 0, 0, s);
  sweep(h, [{ p: [0, 0, -0.1], w: 0.003, h: 0.004 }, { p: [0, 0, -0.06], w: 0.009, h: 0.011 }, { p: [0, 0.002, 0.0], w: 0.016, h: 0.019 }, { p: [0, 0, 0.05], w: 0.012, h: 0.012 }, { p: [0, -0.002, 0.075], w: 0.008, h: 0.006 }], '#6f7f8f', {
    radial: 12, sub: 3, paint: (_x, py) => (py < -0.008 ? '#e2e8f0' : null),
  });
  // Cephalofoil: wide flat hammer with eyes at the tips
  const cf = slab(h, [[-0.05, 0.0], [-0.045, 0.014], [0, 0.02], [0.045, 0.014], [0.05, 0.0], [0.04, -0.008], [0, -0.006], [-0.04, -0.008]], 0.008, '#6f7f8f', 0.001, false);
  cf.rotation.x = -Math.PI / 2; cf.position.set(0, -0.002, 0.075);
  for (const sx of [-1, 1]) blob(h, '#0f172a', sx * 0.049, -0.002, 0.078, 0.004, 0.004, 0.004, 0, 0, 0, 6);
  const df = slab(h, [[0.02, 0], [-0.004, 0.045], [-0.014, 0.04], [-0.02, 0]], 0.003, '#5f6f7f', 0, false); df.rotation.y = -Math.PI / 2; df.position.set(0, 0.012, -0.0);
  const tf = slab(h, [[0, 0], [-0.04, 0.05], [-0.032, 0.0], [-0.03, -0.02]], 0.003, '#5f6f7f', 0, false); tf.rotation.y = -Math.PI / 2; tf.position.set(0, 0, -0.095);
  for (const sx of [-1, 1]) {
    const pf = slab(h, [[0, 0], [0.035, -0.012], [0.03, -0.02], [0.0, -0.016]], 0.003, '#5f6f7f', 0, false);
    pf.rotation.set(-Math.PI / 2, 0, sx > 0 ? -0.35 : Math.PI + 0.35); pf.position.set(sx * 0.012, -0.012, 0.025);
  }
}

const yonaguni: Builder = (gp) => {
  const hf: HFn = (x, z) => 0.015 + 0.012 * fbm(x * 9, 0, z * 9) + 0.004 * Math.sin(x * 60 + z * 25);
  island(gp, 0.5, hf, '#c9c3a6', (x, y, z) => {
    const v = fbm(x * 14, y * 9, z * 14);
    if (hash3(Math.floor(x * 70), 4, Math.floor(z * 70)) > 0.93) return '#8f9b7a';
    return Math.sin(x * 80 + Math.sin(z * 30) * 2) > 0.9 ? '#ddd7bd' : mix('#c4bea0', '#a8a58d', v);
  }, { ...ISL, side: SEABED_SIDE });
  const by = 0.03;
  const R = (rx: number, rz: number, a: number): [number, number] => [rx * Math.cos(a) + rz * Math.sin(a), -rx * Math.sin(a) + rz * Math.cos(a)];
  const mono = grp(gp, -0.02, by, -0.06, -0.35);
  // Main formation: big stepped mass rising to the back-left, terraces stepping down to the front-right
  const B: [number, number, number, number, number, number][] = [
    [0, 0, 0, 0.66, 0.1, 0.5], [-0.08, 0.1, -0.05, 0.48, 0.09, 0.38], [-0.14, 0.19, -0.1, 0.32, 0.1, 0.26], [-0.18, 0.29, -0.13, 0.2, 0.08, 0.18],
    [-0.21, 0.37, -0.15, 0.1, 0.05, 0.1],
    [0.12, 0.1, -0.08, 0.16, 0.05, 0.22], [0.2, 0.1, 0.08, 0.16, 0.025, 0.16],
  ];
  B.forEach(([x, y, z, sx, sy, sz], i) => block(mono, x, y, z, sx, sy, sz, 0, i * 3.1));
  // Staircase on the front face
  for (let k = 0; k < 4; k++) block(mono, -0.16 + k * 0.035, 0.1 - (k + 1) * 0.022, 0.22, 0.04, 0.022 * (4 - k), 0.1, 0, 20 + k);
  // Twin megaliths standing side by side, and a cut trench separating a detached block
  block(mono, 0.2, 0.1, -0.1, 0.05, 0.16, 0.06, 0.05, 31);
  block(mono, 0.27, 0.1, -0.1, 0.05, 0.14, 0.06, -0.05, 32);
  block(gp, 0.34, by, 0.2, 0.14, 0.09, 0.12, 0.3, 33);
  block(gp, 0.38, by, -0.24, 0.1, 0.06, 0.12, -0.6, 34);
  block(gp, -0.36, by, 0.22, 0.12, 0.05, 0.09, 0.8, 35);
  // Triangle pool cut into the first terrace
  const tri = slab(mono, [[0, 0], [0.07, 0], [0.035, 0.05]], 0.012, '#3b4a55', 0, false); tri.rotation.x = -Math.PI / 2; tri.position.set(0.04, 0.1 - 0.005, 0.12);
  // Sea life on the stone: coral tufts, purple coralline patches, sea fans, urchins
  for (let i = 0; i < 20; i++) {
    const [x, z] = R((hash3(i, 7, 1) - 0.5) * 0.6, (hash3(i, 7, 2) - 0.5) * 0.45, 0.35);
    const c = ['#c084fc', '#fb923c', '#facc15', '#86efac'][i % 4], wx = x - 0.02, wz = z - 0.06;
    let top = by;
    for (const [bx2, byy, bz2, sx, sy, sz] of B) { const [lx, lz] = R(wx + 0.02, wz + 0.06, -0.35); if (Math.abs(lx - bx2) < sx / 2 && Math.abs(lz - bz2) < sz / 2) top = Math.max(top, by + byy + sy); }
    blob(gp, c, wx, top + 0.006, wz, 0.012, 0.008, 0.012, 0, 0, 0, 7);
  }
  for (const [x, z, a] of [[-0.3, 0.05, 0.4], [0.24, 0.3, -0.5], [-0.2, 0.32, 1.2]] as const) {
    const f = slab(gp, [[0, 0], [-0.035, 0.05], [-0.02, 0.08], [0.02, 0.085], [0.04, 0.05]], 0.002, '#b45309', 0, true); f.position.set(x, hf(x, z) + 0.03, z); f.rotation.y = a;
  }
  for (const [x, z] of [[0.1, 0.33], [-0.05, 0.36], [0.3, 0.05]] as const) {
    blob(gp, '#111827', x, hf(x, z) + 0.04, z, 0.012, 0.009, 0.012, 0, 0, 0, 7);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; rod(gp, [x, hf(x, z) + 0.042, z], [x + Math.cos(a) * 0.024, hf(x, z) + 0.05 + (k % 2) * 0.01, z + Math.sin(a) * 0.024], 0.0012, '#111827', 3); }
  }
  // Hammerhead school circling overhead, two divers exploring the terraces, sun shafts
  const sp = ySpin(gp);
  for (const [a, r, y, s] of [[0, 0.36, 0.7, 1.25], [1.3, 0.34, 0.78, 1.05], [2.6, 0.38, 0.66, 1.15], [3.9, 0.33, 0.76, 1.0], [5.1, 0.37, 0.72, 1.2]] as const) {
    hammerhead(sp, Math.cos(a) * r, y, Math.sin(a) * r, -a + Math.PI, s);
  }
  diver(gp, 0.12, 0.36, 0.2, -2.3, 1.05, '#1e293b', '#ef4444', false, 0.1);
  diver(gp, -0.3, 0.42, 0.12, 2.6, 0.95, '#334155', '#facc15', false, -0.05);
  bubbles(gp, 9, [[0.12, 0.17, 0.4, 0.78, 7], [-0.3, 0.06, 0.46, 0.78, 6]]);
  for (const [x, y, z, ry, c] of [[0.3, 0.28, 0.25, 0.5, '#facc15'], [0.34, 0.3, 0.2, 0.6, '#facc15'], [-0.35, 0.3, -0.1, 2.2, '#60a5fa'], [0.0, 0.5, 0.3, -1.0, '#f472b6']] as const) fish(gp, x, y, z, 0.016, ry, c, '#ffffff');
  shafts(gp, 3, 4, 0.82);
};

// =========================================================================================================
// Antikythera: Roman-era wreck under the island cliff — amphorae, ship ribs, the bronze gear mechanism, a helmet diver
// =========================================================================================================

/** Toothed bronze wheel in the XY plane (thickness along z) with 4 spokes — the mechanism's signature look. */
function gear(p: THREE.Object3D, x: number, y: number, z: number, R: number, teeth: number, c: string, spokes = 4, th = 0.01): THREE.Group {
  const gg = grp(p, x, y, z);
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2, da = (Math.PI * 2) / teeth;
    for (const [f, r] of [[0, R], [0.18, R * 1.06], [0.5, R * 1.06], [0.68, R]] as const) pts.push(new THREE.Vector2(Math.cos(a0 + f * da) * r, Math.sin(a0 + f * da) * r));
  }
  const shape = new THREE.Shape(pts), rim = R * 0.8;
  const hole = new THREE.Path(); hole.absarc(0, 0, rim, 0, Math.PI * 2, true); shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: th, bevelEnabled: false, curveSegments: 18 }).translate(0, 0, -th / 2);
  add(gg, paintFaces(geo, c, (px, py, pz) => (fbm(px * 60, py * 60, pz * 60 + 3) > 0.62 ? '#4f7f5f' : null)), mat('#ffffff', { vc: true, metal: 0.4, rough: 0.5 }), 0, 0, 0, 1, 1, 1);
  for (let k = 0; k < spokes; k++) box(gg, c, 0, -th * 0.4, 0, R * 0.16, th * 0.8, rim * 2, 0, Math.PI / 2, (k / spokes) * Math.PI + 0.3);
  cyl(gg, shade(c, 0.8), 0, -th, 0, R * 0.14, th * 2, 10).rotation.x = Math.PI / 2;
  return gg;
}

function amphora(p: THREE.Object3D, x: number, y: number, z: number, s: number, rx: number, ry: number, c: string): void {
  const a = grp(p, x, y, z, ry, rx, 0, s);
  lathe(a, [[0, 0], [0.008, 0.006], [0.02, 0.03], [0.026, 0.06], [0.022, 0.085], [0.009, 0.1], [0.008, 0.125], [0.011, 0.13], [0, 0.131]], c, 0, 0, 0, 9);
  for (const sx of [-1, 1]) rod(a, [sx * 0.008, 0.124, 0], [sx * 0.022, 0.1, 0], 0.003, shade(c, 0.9), 4);
}

const antikythera: Builder = (gp) => {
  const hf: HFn = (x, z) => 0.015 + 0.28 * Math.pow(sstep(-0.05, -0.48, z + x * 0.35), 1.4) * (0.6 + 0.6 * ridged(x * 4 + 3, z * 4)) + 0.01 * fbm(x * 18, 0, z * 18);
  island(gp, 0.5, hf, '#cdbf98', (x, y, z, _nx, ny) => {
    const v = fbm(x * 16, y * 12, z * 16);
    if (ny < 0.8 || y > 0.09) return v > 0.62 ? '#5f7a4a' : v > 0.48 ? '#8f8a7a' : v < 0.3 ? '#b27a8a' : '#a39d8c';
    return hash3(Math.floor(x * 70), 5, Math.floor(z * 70)) > 0.92 ? '#a8986f' : mix('#d4c7a2', '#bfb08a', v);
  }, { ...ISL, side: strataSide(['#9a8f78', '#887e69', '#a89c84', '#7a705d']) });
  const gy = (x: number, z: number) => 0.035 + hf(x, z) - 0.004;
  // Ship remains: keel and curved ribs half buried, a few planks
  const sh = grp(gp, -0.06, gy(-0.06, 0.08) - 0.01, 0.08, 0.5);
  rod(sh, [0, 0, -0.26], [0, 0.006, 0.26], 0.012, '#3b2a1e', 6);
  for (let k = 0; k < 9; k++) {
    const z = -0.22 + k * 0.055, hgt = 0.05 + 0.03 * Math.sin((k / 8) * Math.PI);
    for (const sx of [-1, 1]) if (hash3(k, sx, 1) > 0.25) rod(sh, [sx * 0.01, 0.004, z], [sx * 0.075, hgt * (0.6 + 0.6 * hash3(k, sx, 2)), z + 0.004], 0.008, '#5a3f2c', 5);
  }
  for (let k = 0; k < 4; k++) box(sh, '#5b4030', 0.05 * (k % 2 ? 1 : -1), 0.004, -0.1 + k * 0.07, 0.02, 0.006, 0.12, 0.2 * k);
  // Amphorae: some still stacked in rows, others scattered down the slope
  const terr = ['#b5623a', '#a5532f', '#c47a4c', '#9a4a2c'];
  for (let i = 0; i < 6; i++) amphora(sh, -0.04 + (i % 3) * 0.035, 0.03, -0.18 + Math.floor(i / 3) * 0.06, 0.8, Math.PI / 2, 0.1, terr[i % 4]);
  for (const [x, z, rx, ry, k] of [[0.22, 0.22, 1.4, 0.4, 0], [0.3, 0.06, 1.5, 2.0, 1], [-0.28, 0.26, 1.3, -0.8, 2], [0.12, 0.34, 1.57, 1.1, 3], [-0.18, 0.36, 0.3, 0.2, 0], [0.36, 0.22, 0, 0, 2]] as const) amphora(gp, x, gy(x, z), z, 0.9, rx, ry, terr[k]);
  // The mechanism: corroded main wheel (4 spokes) propped up in front, smaller gear train & the broken wooden case
  const mx = 0.1, mz = 0.12, my = gy(mx, mz);
  const cs = grp(gp, mx, my, mz - 0.03, -0.3);
  slab(cs, [[-0.12, 0], [0.12, 0], [0.12, 0.07], [0.06, 0.1], [0.02, 0.06], [-0.05, 0.12], [-0.12, 0.09]], 0.012, '#5b4030', 0, false).position.z = -0.04;
  box(cs, '#4a3426', -0.12, 0, -0.07, 0.012, 0.08, 0.07);
  box(cs, '#4a3426', 0, 0, -0.07, 0.24, 0.012, 0.07);
  const g1 = gear(cs, 0, 0.125, 0.012, 0.11, 56, '#6f9e7c', 4, 0.016);
  g1.rotation.x = -0.12;
  g1.rotation.z = 0.15;
  const g2 = gear(cs, 0.115, 0.17, -0.02, 0.04, 24, '#8fb08a', 3, 0.01); g2.rotation.z = 0.4;
  gear(cs, 0.12, 0.07, -0.02, 0.03, 18, '#a3b98d', 3, 0.01);
  gear(cs, -0.1, 0.2, -0.022, 0.03, 16, '#6f9a78', 3, 0.01);
  rbox(cs, '#5c7a5e', -0.15, 0.0, 0.04, 0.07, 0.05, 0.04, 0.01);
  specks(gp, [[mx + 0.02, my + 0.13, mz + 0.02], [mx - 0.05, my + 0.2, mz], [mx + 0.08, my + 0.18, mz - 0.02], [mx + 0.0, my + 0.24, mz - 0.01]], 0.006, '#fde68a');
  // Sponge diver of 1900 in a copper helmet and canvas suit, air hose rising to the surface
  const dv = grp(gp, -0.2, gy(-0.2, 0.08), 0.08, 0.7);
  for (const sx of [-1, 1]) {
    rod(dv, [sx * 0.018, 0.012, 0], [sx * 0.02, 0.08, 0], 0.013, '#8b7d68', 7);
    rbox(dv, '#374151', sx * 0.02, 0, 0.006, 0.03, 0.016, 0.045, 0.004);
  }
  sweep(dv, [{ p: [0, 0.08, 0], w: 0.034, h: 0.028 }, { p: [0, 0.13, 0], w: 0.038, h: 0.03 }, { p: [0, 0.165, 0], w: 0.03, h: 0.026 }], '#9a8b72', { radial: 12, sub: 3, up: [0, 0, 1] });
  rbox(dv, '#374151', 0, 0.075, 0, 0.075, 0.016, 0.06, 0.005);
  box(dv, '#b87333', 0, 0.165, 0, 0.08, 0.012, 0.06);
  blob(dv, '#c27c3a', 0, 0.2, 0, 0.036, 0.038, 0.036, 0, 0, 0, 14).material = mat('#c27c3a', { metal: 0.7, rough: 0.35, flat: false });
  for (const [px, pz, ry] of [[0, 0.035, 0], [0.033, 0.006, Math.PI / 2], [-0.033, 0.006, -Math.PI / 2]] as const) {
    const w = cyl(dv, '#d6a35a', px, 0.2, pz, 0.014, 0.008, 10); w.rotation.set(Math.PI / 2, 0, ry); w.position.set(px, 0.2, pz);
    blob(dv, '#1e3a5f', px * 1.12, 0.2, pz * 1.12, 0.01, 0.01, 0.004, ry, 0, 0, 8);
  }
  for (const sx of [-1, 1]) {
    rod(dv, [sx * 0.04, 0.15, 0], [sx * 0.05, 0.11, 0.03], 0.01, '#9a8b72', 6);
    rod(dv, [sx * 0.05, 0.11, 0.03], [sx * 0.04, 0.09, 0.06], 0.009, '#9a8b72', 6);
    blob(dv, '#6b5a45', sx * 0.04, 0.088, 0.065, 0.011, 0.011, 0.011, 0, 0, 0, 8);
  }
  // Net bag of sponges in one hand, hose curling up
  const nb = grp(dv, 0.045, 0.04, 0.07);
  for (let k = 0; k < 5; k++) blob(nb, ['#d6a85a', '#c99a4a', '#e0b56a'][k % 3], (hash3(k, 3, 1) - 0.5) * 0.03, (hash3(k, 3, 2)) * 0.03, (hash3(k, 3, 3) - 0.5) * 0.03, 0.014, 0.012, 0.014, 0, 0, 0, 8);
  rod(dv, [0.04, 0.09, 0.065], [0.045, 0.06, 0.07], 0.002, '#4b5563', 3);
  sweep(dv, [{ p: [0, 0.23, -0.02], w: 0.006 }, { p: [0.0, 0.32, -0.08], w: 0.006 }, { p: [0.06, 0.45, -0.1], w: 0.006 }, { p: [0.1, 0.62, -0.05], w: 0.006 }, { p: [0.08, 0.75, 0.0], w: 0.006 }], '#2f2f2f', { radial: 6, sub: 4, caps: false });
  // Mediterranean life: posidonia seagrass, sea urchins, a red starfish, an octopus peeking from an amphora, sea bream
  for (let i = 0; i < 26; i++) {
    const a = hash3(i, 8, 1) * Math.PI * 2, d = 0.25 + hash3(i, 8, 2) * 0.2, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z < -0.05) continue;
    for (let k = 0; k < 3; k++) { const l = 0.04 + hash3(i, k, 3) * 0.04; rod(gp, [x + k * 0.006, gy(x, z), z], [x + k * 0.006 + (hash3(i, k, 4) - 0.5) * 0.03, gy(x, z) + l, z + 0.01], 0.003, k % 2 ? '#4d7c3a' : '#5f8f46', 3); }
  }
  for (const [x, z] of [[0.0, 0.3], [0.28, 0.32], [-0.36, 0.1]] as const) {
    blob(gp, '#1f1a2e', x, gy(x, z) + 0.01, z, 0.014, 0.01, 0.014, 0, 0, 0, 7);
    for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; rod(gp, [x, gy(x, z) + 0.012, z], [x + Math.cos(a) * 0.026, gy(x, z) + 0.014 + (k % 3) * 0.008, z + Math.sin(a) * 0.026], 0.0012, '#1f1a2e', 3); }
  }
  const sf = grp(gp, 0.2, gy(0.2, 0.36) + 0.003, 0.36, 0.4);
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; rod(sf, [0, 0.003, 0], [Math.cos(a) * 0.028, 0.002, Math.sin(a) * 0.028], 0.006, '#dc2626', 5); }
  const ox = 0.36, oz = 0.22, oy = gy(ox, oz);
  blob(gp, '#c2410c', ox, oy + 0.06, oz + 0.02, 0.016, 0.018, 0.016, 0, 0, 0, 8);
  for (let k = 0; k < 4; k++) rod(gp, [ox, oy + 0.05, oz + 0.025], [ox + (k - 1.5) * 0.02, oy + 0.01, oz + 0.06], 0.004, '#c2410c', 4);
  for (const [x, y, z, ry] of [[-0.3, 0.42, -0.1, 0.8], [-0.26, 0.46, -0.04, 0.9], [0.3, 0.5, 0.1, -2.0]] as const) fish(gp, x, y, z, 0.02, ry, '#cbd5e1', '#94a3b8');
  bubbles(gp, 11, [[-0.2, 0.08, 0.32, 0.6, 5]]);
  shafts(gp, 5, 3, 0.8);
};

// =========================================================================================================
// Thonis-Heracleion: colossal red-granite Hapi, a fallen black-granite queen, the decree stela, sphinx, diver
// =========================================================================================================

const speck = (base: string, dark: string, light: string): Paint => (x, y, z) => {
  const h = hash3(Math.floor(x * 260), Math.floor(y * 260), Math.floor(z * 260));
  return h > 0.86 ? dark : h < 0.1 ? light : base;
};

/** Standing Egyptian colossus (left foot forward, back pillar, kilt, wig and papyrus crown), ~0.6 tall. */
function colossus(p: THREE.Object3D, x: number, y: number, z: number, ry: number, c: string): void {
  const k = grp(p, x, y, z, ry);
  const pt = speck(c, shade(c, 0.85), mix(c, '#f5e6d8', 0.15));
  rbox(k, shade(c, 0.9), 0, 0, -0.01, 0.16, 0.04, 0.2, 0.006);
  rbox(k, shade(c, 0.9), 0, 0.04, -0.06, 0.05, 0.4, 0.035, 0.006);
  for (const [sx, dz] of [[-1, 0.04], [1, -0.005]] as const) {
    sweep(k, [{ p: [sx * 0.03, 0.045, dz], w: 0.018, h: 0.02 }, { p: [sx * 0.03, 0.12, dz * 0.6], w: 0.02, h: 0.022 }, { p: [sx * 0.032, 0.22, 0], w: 0.03, h: 0.03 }], c, { radial: 10, sub: 3, up: [0, 0, 1], paint: pt });
    rbox(k, c, sx * 0.03, 0.04, dz + 0.012, 0.032, 0.014, 0.06, 0.006);
  }
  box(k, shade(c, 0.85), 0, 0.045, -0.035, 0.04, 0.17, 0.04);
  // Kilt with belt, rounded belly, broad chest, arms down at the sides
  sweep(k, [{ p: [0, 0.2, 0.0], w: 0.07, h: 0.045 }, { p: [0, 0.27, 0.0], w: 0.064, h: 0.045 }], shade(c, 1.05), { radial: 14, sub: 2, up: [0, 0, 1], paint: (_x, py) => (py > 0.262 ? shade(c, 0.8) : null) });
  sweep(k, [{ p: [0, 0.27, 0.0], w: 0.062, h: 0.045 }, { p: [0, 0.31, 0.012], w: 0.066, h: 0.054 }, { p: [0, 0.37, 0.004], w: 0.07, h: 0.044 }, { p: [0, 0.42, 0], w: 0.08, h: 0.04 }], c, { radial: 14, sub: 3, up: [0, 0, 1], paint: pt });
  for (const sx of [-1, 1]) {
    rod(k, [sx * 0.085, 0.41, 0], [sx * 0.09, 0.33, 0.005], 0.017, c);
    rod(k, [sx * 0.09, 0.33, 0.005], [sx * 0.082, 0.25, 0.02], 0.015, c);
    blob(k, c, sx * 0.08, 0.24, 0.024, 0.016, 0.02, 0.016, 0, 0, 0, 8);
    blob(k, c, sx * 0.03, 0.39, 0.04, 0.022, 0.018, 0.012, 0, 0, 0, 8);
  }
  // Head: tripartite wig falling to the shoulders, face, beard, and the papyrus-clump crown
  rod(k, [0, 0.42, 0], [0, 0.45, 0.004], 0.024, c);
  rbox(k, shade(c, 0.85), 0, 0.43, -0.012, 0.09, 0.09, 0.06, 0.02);
  for (const sx of [-1, 1]) rbox(k, shade(c, 0.85), sx * 0.034, 0.4, 0.022, 0.024, 0.08, 0.02, 0.008);
  blob(k, c, 0, 0.485, 0.022, 0.033, 0.042, 0.032, 0, 0, 0, 12);
  blob(k, shade(c, 0.8), 0, 0.48, 0.055, 0.007, 0.01, 0.006, 0, 0, 0, 6);
  for (const sx of [-1, 1]) blob(k, '#3a1a12', sx * 0.013, 0.495, 0.05, 0.006, 0.003, 0.003, 0, 0, 0, 6);
  rbox(k, shade(c, 0.9), 0, 0.43, 0.048, 0.016, 0.03, 0.012, 0.005);
  for (let i = 0; i < 7; i++) {
    const a = (i / 6 - 0.5) * 1.6;
    const st = rod(k, [0, 0.52, 0.01], [Math.sin(a) * 0.05, 0.6, 0.01 + Math.cos(a) * 0.005], 0.004, c, 5);
    st.userData.k = i;
    blob(k, shade(c, 1.05), Math.sin(a) * 0.055, 0.61, 0.012, 0.014, 0.01, 0.01, 0, 0, a, 8);
  }
}

const heracleion: Builder = (gp, r) => {
  const c = r.color ?? '#c24a32';
  const hf: HFn = (x, z) => 0.015 + 0.02 * fbm(x * 6 + 2, 0, z * 6) + 0.004 * Math.sin(x * 70 + Math.sin(z * 20) * 2);
  island(gp, 0.5, hf, '#b9b08c', (x, y, z) => {
    const v = fbm(x * 14, y * 9, z * 14);
    if (hash3(Math.floor(x * 70), 6, Math.floor(z * 70)) > 0.94) return '#8f8a6a';
    return Math.sin(x * 85 + Math.sin(z * 30) * 2) > 0.92 ? '#cdc4a0' : mix('#b9b08c', '#9f9a7a', v);
  }, { ...ISL, side: SEABED_SIDE });
  const gy = (x: number, z: number) => 0.035 + hf(x, z) - 0.004;
  colossus(gp, -0.05, gy(-0.05, -0.1), -0.1, 0.25, c);
  // Fallen black-granite queen (as Isis), half sunk in the sand
  const q = grp(gp, -0.24, gy(-0.24, 0.17) + 0.02, 0.17, -0.7, 0, Math.PI / 2 - 0.15);
  const qp = speck('#2d2b2e', '#1a191b', '#55525a');
  sweep(q, [{ p: [0, 0.0, 0], w: 0.026, h: 0.02 }, { p: [0, 0.12, 0], w: 0.034, h: 0.024 }, { p: [0, 0.2, 0], w: 0.044, h: 0.028 }, { p: [0, 0.24, 0], w: 0.03, h: 0.022 }], '#2d2b2e', { radial: 12, sub: 3, up: [0, 0, 1], paint: qp });
  blob(q, '#2d2b2e', 0, 0.27, 0.004, 0.024, 0.03, 0.024, 0, 0, 0, 10);
  rbox(q, '#232124', 0, 0.255, -0.01, 0.06, 0.05, 0.04, 0.012);
  cyl(q, '#2d2b2e', 0, 0.3, 0, 0.022, 0.012, 10);
  // Decree stela: dark granite slab with rounded top and rows of carved signs
  const sx0 = 0.2, sz0 = -0.12, sy0 = gy(sx0, sz0);
  const st = grp(gp, sx0, sy0, sz0, -0.5, 0.06);
  slab(st, [[-0.06, 0], [0.06, 0], [0.06, 0.24], [0.04, 0.275], [0, 0.285], [-0.04, 0.275], [-0.06, 0.24]], 0.025, '#2a2a2e', 0.002, false);
  for (let row = 0; row < 9; row++) for (let col = 0; col < 7; col++) if (hash3(row, col, 5) > 0.25) box(st, '#4a4a52', -0.045 + col * 0.015, 0.03 + row * 0.022, 0.013, 0.009, 0.01, 0.003);
  box(st, '#4a4a52', 0, 0.24, 0.013, 0.07, 0.004, 0.003);
  ellipDisc(st, 0, 0.255, 0.014, 0.02, '#4a4a52');
  rbox(gp, '#5a5560', sx0, sy0 - 0.01, sz0, 0.16, 0.025, 0.07, 0.005, -0.5);
  // Small sphinx and temple blocks / column drums scattered on the sea floor
  const sp = grp(gp, 0.26, gy(0.26, 0.18), 0.18, -0.9);
  const lp = speck('#8f8576', '#6f6658', '#b0a796');
  rbox(sp, '#857b6c', 0, 0, 0, 0.07, 0.025, 0.15, 0.006);
  sweep(sp, [{ p: [0, 0.035, -0.06], w: 0.026, h: 0.018 }, { p: [0, 0.045, 0.02], w: 0.03, h: 0.022 }], '#8f8576', { radial: 10, sub: 2, paint: lp });
  for (const sxx of [-1, 1]) rbox(sp, '#8f8576', sxx * 0.016, 0.025, 0.05, 0.016, 0.014, 0.05, 0.004);
  rbox(sp, '#7d7466', 0, 0.06, 0.05, 0.05, 0.05, 0.035, 0.01);
  blob(sp, '#8f8576', 0, 0.09, 0.062, 0.018, 0.022, 0.016, 0, 0, 0, 8);
  for (const [x, z, a, k] of [[0.08, 0.12, 0.3, 0], [0.12, 0.3, 1.4, 1], [-0.32, -0.12, 0.8, 0], [0.34, -0.02, 2.0, 1], [-0.1, 0.34, 0.2, 0]] as const) {
    if (k) { const m = cyl(gp, '#d9cfb8', x, gy(x, z) + 0.022, z, 0.022, 0.07, 12); m.rotation.set(0, a, Math.PI / 2); m.position.y = gy(x, z) + 0.02; }
    else rbox(gp, hash3(x * 9, z * 9, 1) > 0.5 ? '#cfc4a8' : '#b8ad92', x, gy(x, z) - 0.005, z, 0.08, 0.04, 0.05, 0.006, a);
  }
  for (const [x, z, rx, ry] of [[0.18, 0.08, 1.4, 0.8], [-0.36, 0.06, 1.5, -0.4], [0.02, 0.24, 1.45, 2.4]] as const) amphora(gp, x, gy(x, z) + 0.012, z, 0.75, rx, ry, '#b5623a');
  // Gold coins glinting, diver measuring the colossus, fish and sea grass
  specks(gp, [[0.06, gy(0.06, 0.05) + 0.006, 0.05], [0.09, gy(0.09, 0.03) + 0.006, 0.03], [0.05, gy(0.05, 0.0) + 0.006, 0.0]], 0.007, '#fbbf24');
  diver(gp, 0.14, 0.33, 0.1, -2.0, 1.15, '#0f172a', '#facc15', true, 0.35);
  for (let i = 0; i < 18; i++) {
    const a = hash3(i, 12, 1) * Math.PI * 2, d = 0.3 + hash3(i, 12, 2) * 0.17, x = Math.cos(a) * d, z = Math.sin(a) * d, l = 0.04 + hash3(i, 12, 3) * 0.05;
    rod(gp, [x, gy(x, z), z], [x + (hash3(i, 12, 4) - 0.5) * 0.03, gy(x, z) + l, z], 0.003, '#6b8f4a', 3);
  }
  for (const [x, y, z, ry, cc] of [[-0.3, 0.45, 0.0, 1.2, '#fbbf24'], [-0.26, 0.48, 0.05, 1.3, '#fbbf24'], [0.3, 0.4, 0.25, -2.4, '#94a3b8']] as const) fish(gp, x, y, z, 0.018, ry, cc, '#475569');
  bubbles(gp, 13, [[0.15, 0.17, 0.36, 0.72, 6]]);
  shafts(gp, 7, 3, 0.8, '#d8f3dc');
};

function ellipDisc(p: THREE.Object3D, x: number, y: number, z: number, r: number, c: string): void {
  const m = cyl(p, c, x, y, z, r, 0.004, 12); m.rotation.x = Math.PI / 2; m.position.set(x, y, z);
}

// =========================================================================================================
// Nanhai No. 1: Southern-Song merchant junk on the silty floor — bulkhead holds stacked with porcelain & iron pots
// =========================================================================================================

const nanhai1: Builder = (gp, r) => {
  const wood = r.color ?? '#6b4a2a';
  const RY = -0.5, L = 0.86, B = 0.33, D = 0.14;
  const hullHalf = (u: number) => (B / 2) * (u > 0.75 ? 0.45 + 0.55 * Math.cos(((u - 0.75) / 0.25) * Math.PI / 2) ** 0.8 : u < 0.12 ? 0.78 + 0.22 * (u / 0.12) : 1);
  const hf: HFn = (x, z) => {
    const lx = x * Math.cos(RY) - z * Math.sin(RY), lz = x * Math.sin(RY) + z * Math.cos(RY);
    const e = Math.max(Math.abs(lx) / (B / 2 + 0.05), Math.abs(lz) / (L / 2 + 0.05));
    return 0.015 + 0.03 * Math.exp(-((e - 1.0) ** 2) / 0.03) * (0.7 + 0.5 * fbm(x * 12, 1, z * 12)) + 0.012 * fbm(x * 9, 0, z * 9);
  };
  island(gp, 0.5, hf, '#7d7a63', (x, y, z) => {
    const v = fbm(x * 14, y * 9, z * 14);
    if (hash3(Math.floor(x * 70), 7, Math.floor(z * 70)) > 0.94) return '#5f5d4a';
    return mix('#8a866c', '#6b6954', v);
  }, { ...ISL, side: SEABED_SIDE });
  const sh = grp(gp, 0, 0.005, 0, RY);
  // Hull: V-bottomed Fujian junk, outer planking + inner lining, broken uneven sheer
  const NZ = 22, NS = 7;
  const ring = (i: number, inset: number): V3[] => {
    const u = i / NZ, z = -L / 2 + u * L, w = hullHalf(u) - inset, top = D * (0.75 + 0.35 * u ** 3 + 0.25 * (1 - u) ** 4) * (0.8 + 0.25 * vnoise(i * 0.7, 3, 1)) - inset;
    const pts: V3[] = [];
    for (let k = 0; k <= NS * 2; k++) {
      const t = k / NS - 1, ax = Math.abs(t), yy = inset + (top - inset) * Math.pow(ax, 1.6);
      pts.push([Math.sign(t) * w * Math.pow(ax, 0.55), yy, z]);
    }
    return pts;
  };
  const plank: Paint = (_x, y, z) => (Math.abs(Math.sin(y * 260)) > 0.85 ? shade(wood, 0.7) : fbm(_x * 40, y * 40, z * 40) > 0.62 ? shade(wood, 0.82) : null);
  skin(sh, Array.from({ length: NZ + 1 }, (_, i) => ring(i, 0)), wood, { closed: false, caps: false, paint: plank, flat: true });
  skin(sh, Array.from({ length: NZ + 1 }, (_, i) => ring(i, 0.008)), shade(wood, 1.15), { closed: false, caps: false, inward: true, paint: (_x, y) => (Math.abs(Math.sin(y * 260)) > 0.88 ? shade(wood, 0.9) : null), flat: true });
  // Transom stern and bow boards, bulkheads dividing the cargo holds
  const xsec = (i: number, inset: number) => ring(i, inset).map(([x, y]) => [x, y] as [number, number]);
  for (let b = 0; b <= 11; b++) {
    const i = Math.round(1 + (b / 11) * (NZ - 2)), pts = xsec(i, 0.006), z = -L / 2 + (i / NZ) * L;
    const top = Math.max(...pts.map(q => q[1])) * (b === 0 || b === 11 ? 1 : 0.88);
    const bh = slab(sh, pts.map(([x, y]) => [x, Math.min(y, top)] as [number, number]), 0.006, shade(wood, b === 0 || b === 11 ? 0.85 : 1.1), 0, false);
    bh.position.z = z;
  }
  // Cargo: porcelain bowl stacks (celadon, white, blue-and-white) and rusted iron pot stacks between the bulkheads
  const stackGeo = g('ds-bowlstack', () => {
    const pr: THREE.Vector2[] = [new THREE.Vector2(0, 0)];
    for (let k = 0; k < 3; k++) { pr.push(new THREE.Vector2(0.007, k * 0.011 + 0.001), new THREE.Vector2(0.0135, k * 0.011 + 0.01)); }
    pr.push(new THREE.Vector2(0.008, 0.034), new THREE.Vector2(0, 0.032));
    return new THREE.LatheGeometry(pr, 8);
  });
  const porc = ['#8fc29a', '#f1f3ec', '#6fb3a3', '#5b8fd6', '#b9d8a8'];
  for (let i = 1; i < NZ - 1; i++) {
    const z = -L / 2 + ((i + 0.5) / NZ) * L, u = (i + 0.5) / NZ, w = hullHalf(u) * 0.75;
    const rows = Math.max(2, Math.round((w * 2) / 0.03));
    for (let k = 0; k < rows; k++) {
      const x = -w + (k + 0.5) * ((w * 2) / rows), t = Math.abs(x) / (hullHalf(u) || 1), yb = Math.max(0.012 + D * 0.9 * Math.pow(t, 1.6), 0.026 + hf(x * Math.cos(RY) + z * Math.sin(RY), -x * Math.sin(RY) + z * Math.cos(RY)));
      if (hash3(i, k, 9) < 0.12) continue;
      const iron = hash3(i, k, 8) > 0.86;
      const col = iron ? '#6b3a22' : porc[Math.floor(hash3(i, k, 7) * porc.length)];
      add(sh, stackGeo, mat(col, { flat: false, rough: 0.35 }), x, yb, z, 1, 1 + (iron ? 0.3 : hash3(i, k, 6) * 0.6), 1);
      if (!iron && hash3(i, k, 5) > 0.7) add(sh, stackGeo, mat('#dfe6ee', { flat: false, rough: 0.35 }), x, yb + 0.04, z, 0.95, 0.8, 0.95);
    }
  }
  // Stump of the mainmast, big stern rudder, spilled bowls, a lacquer box and a glint of gold
  rod(sh, [0, 0.02, 0.05], [0.0, 0.2, 0.06], 0.014, shade(wood, 0.8), 8);
  rod(sh, [0, 0.2, 0.06], [0.04, 0.22, 0.07], 0.01, shade(wood, 0.75), 6);
  const rd = slab(sh, [[0, 0], [0.1, 0], [0.12, -0.08], [0.02, -0.1]], 0.012, shade(wood, 0.75), 0, false);
  rd.rotation.y = -Math.PI / 2; rd.position.set(0, D * 1.2, -L / 2 - 0.005);
  rod(sh, [0, D * 1.3, -L / 2 - 0.01], [0, 0.01, -L / 2 - 0.03], 0.008, shade(wood, 0.7), 6);
  for (let i = 0; i < 9; i++) {
    const x = 0.22 + (hash3(i, 3, 1) - 0.5) * 0.18, z = 0.1 + (hash3(i, 3, 2) - 0.5) * 0.25;
    const b = lathe(gp, [[0, 0], [0.012, 0.002], [0.02, 0.012], [0.019, 0.013], [0.01, 0.004], [0, 0.004]], porc[i % 5], x, hf(x, z) + 0.03, z, 10);
    b.rotation.set((hash3(i, 3, 3) - 0.5) * 2.5, 0, (hash3(i, 3, 4) - 0.5) * 2.5);
  }
  rbox(gp, '#7f1d1d', -0.28, hf(-0.28, 0.2) + 0.03, 0.2, 0.05, 0.03, 0.04, 0.006, 0.4);
  box(gp, '#fbbf24', -0.28, hf(-0.28, 0.2) + 0.06, 0.2, 0.052, 0.004, 0.006, 0.4);
  specks(gp, [[-0.2, hf(-0.2, 0.28) + 0.04, 0.28], [-0.17, hf(-0.17, 0.3) + 0.04, 0.3]], 0.008, '#fcd34d');
  // Diver with lamp, a pair of yellow-striped fish, grouper, silt bubbles
  diver(gp, 0.26, 0.32, 0.18, -2.2, 1.15, '#111827', '#f97316', true, 0.4);
  for (const [x, y, z, ry, cc, st] of [[-0.3, 0.3, -0.18, 1.0, '#fde047', '#1e3a8a'], [-0.27, 0.33, -0.14, 1.1, '#fde047', '#1e3a8a'], [0.32, 0.22, -0.2, -2.5, '#a16207', '#78350f']] as const) fish(gp, x, y, z, 0.02, ry, cc, st);
  for (let i = 0; i < 6; i++) { const x = -0.38 + i * 0.02, z = -0.25 + (i % 2) * 0.02; rod(gp, [x, hf(x, z) + 0.03, z], [x + 0.01, hf(x, z) + 0.1, z + 0.01], 0.006, '#c2410c', 4); }
  bubbles(gp, 17, [[0.26, 0.24, 0.36, 0.7, 6]]);
  snow(gp, 61, 25, 0.48, 0.15, 0.7, '#e2e8d8', 0.0035);
};

export const H_DEEPSEA: Record<string, Builder> = {
  dc_lostcity: lostcity,
  dc_snailfish: snail,
  dc_bluehole: bluehole,
  dc_yonaguni: yonaguni,
  dc_antikythera: antikythera,
  dc_heracleion: heracleion,
  dc_nanhai1: nanhai1,
};
