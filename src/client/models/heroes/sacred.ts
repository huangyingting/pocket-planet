import { passerby } from '../human.ts';
import * as THREE from 'three';
import {
  type Builder, type Paint, type V3, add, g, mat, box, cyl, cone, ball, CONE, rbox, rod, prism, gable, slab, tbox, skin,
  paintFaces, shade, mix, fbm, hash3, CYL, SPH,
} from '../prims.ts';
import { type HFn, island, sstep, ridged, ripple, strataSide, scatter, onGround, pine } from '../nature.ts';

// Hero builders for: basil, sagrada, neuschwanstein, kremlin, hagiasophia, windmill. Keyed by catalogue item key (recipe.hero).
// Scale-model dioramas: ~1 unit across, base y=0, front +z.

const TAU = Math.PI * 2;
const frac = (v: number) => v - Math.floor(v);
const GOLD = '#e0b245';

/** Regular n-gon prism (circumradius r) with a face — not a corner — towards +z. */
const ngon = (p: THREE.Object3D, c: string, x: number, y: number, z: number, r: number, h: number, n = 8) =>
  add(p, CYL(n), mat(c), x, y + h / 2, z, r * 2, h, r * 2, Math.PI / n);

/** Catmull-Rom smoothed 2D profile. */
function smooth(pts: [number, number][], n: number): [number, number][] {
  const c = new THREE.SplineCurve(pts.map(([a, b]) => new THREE.Vector2(a, b)));
  return c.getPoints(n).map(v => [Math.max(0, v.x), v.y]);
}

/** Lathe with per-face paint in local space (angle a = atan2(x, z), height y). */
function plathe(p: THREE.Object3D, pts: [number, number][], base: string, paint: Paint | undefined, x: number, y: number, z: number,
  seg = 24, flat = false, phi0 = 0, phiLen = TAU): THREE.Mesh {
  const geo = new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(r, h)), seg, phi0, phiLen);
  return add(p, paintFaces(geo, base, paint), mat('#ffffff', { flat, vc: true }), x, y, z, 1, 1, 1);
}

/** n-sided pyramid frustum; every face subdivided nu×nv so per-face paint can draw tile patterns. Faces centred at k/n·TAU. */
function tentGeo(n: number, r0: number, r1: number, h: number, nu: number, nv: number): THREE.BufferGeometry {
  const pos: number[] = [];
  const P = (k: number, u: number, v: number): V3 => {
    const a0 = ((k - 0.5) / n) * TAU, a1 = ((k + 0.5) / n) * TAU, r = r0 + (r1 - r0) * v;
    return [(Math.sin(a0) * (1 - u) + Math.sin(a1) * u) * r, v * h, (Math.cos(a0) * (1 - u) + Math.cos(a1) * u) * r];
  };
  for (let k = 0; k < n; k++) for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const A = P(k, i / nu, j / nv), B = P(k, (i + 1) / nu, j / nv), C = P(k, (i + 1) / nu, (j + 1) / nv), D = P(k, i / nu, (j + 1) / nv);
    pos.push(...A, ...B, ...C, ...A, ...C, ...D);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}
function tent(p: THREE.Object3D, n: number, r0: number, r1: number, h: number, base: string, paint: Paint | undefined,
  x: number, y: number, z: number, nu = 3, nv = 8): THREE.Mesh {
  return add(p, paintFaces(tentGeo(n, r0, r1, h, nu, nv), base, paint), mat('#ffffff', { vc: true }), x, y, z, 1, 1, 1);
}

/** Unit arch blank (x∈[-.5,.5], y∈[0,1]); round or Russian keel ("kokoshnik") head. Flat (window glazing) or solid (z∈[-.5,.5]). */
const archGeo = (keel: boolean, solid: boolean) => g(`sacred-arch:${keel}:${solid}`, () => {
  const s = new THREE.Shape();
  s.moveTo(-0.5, 0);
  if (keel) {
    s.lineTo(-0.5, 0.42);
    s.bezierCurveTo(-0.5, 0.84, -0.06, 0.74, 0, 1);
    s.bezierCurveTo(0.06, 0.74, 0.5, 0.84, 0.5, 0.42);
  } else {
    s.lineTo(-0.5, 0.5);
    s.absarc(0, 0.5, 0.5, Math.PI, 0, true);
  }
  s.lineTo(0.5, 0);
  s.closePath();
  const eg: THREE.BufferGeometry = solid
    ? new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 3 }).translate(0, 0, -0.5)
    : new THREE.ShapeGeometry(s, 4);
  eg.computeVertexNormals();
  return eg;
});
const arch = (p: THREE.Object3D, c: string, x: number, y: number, z: number, w: number, h: number, d: number, ry = 0, keel = false) =>
  add(p, archGeo(keel, d > 0), mat(c), x, y, z, w, h, d > 0 ? d : 1, ry);

/** Arched window on a wall whose outward normal is at yaw `ry`: light frame + dark glazing (flat decals). */
function win(p: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, ry: number, frame = '#efe9dc', glass = '#2a2e38', keel = false): void {
  const dx = Math.sin(ry), dz = Math.cos(ry);
  if (frame) arch(p, frame, x + dx * 0.0012, y - h * 0.08, z + dz * 0.0012, w * 1.5, h * 1.2, 0, ry, keel);
  arch(p, glass, x + dx * 0.0022, y, z + dz * 0.0022, w, h, 0, ry, keel);
}

/** Orthodox cross (with slanted foot bar). */
function oCross(p: THREE.Object3D, x: number, y: number, z: number, s: number, c = GOLD): void {
  box(p, c, x, y, z, s * 0.09, s, s * 0.09);
  box(p, c, x, y + s * 0.66, z, s * 0.5, s * 0.08, s * 0.08);
  box(p, c, x, y + s * 0.84, z, s * 0.26, s * 0.06, s * 0.06);
  box(p, c, x, y + s * 0.28, z, s * 0.34, s * 0.06, s * 0.06, 0, 0, 0.4);
}

/** Merge a detached group's meshes into one vertex-coloured mesh (keeps animated groups to a single draw call). */
function mergeGroup(src: THREE.Object3D, flat = true): THREE.Mesh {
  src.updateMatrixWorld(true);
  const pos: number[] = [], nor: number[] = [], col: number[] = [];
  const v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3(), cc = new THREE.Color();
  src.traverse(o => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const gg = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry;
    const pa = gg.getAttribute('position'), na = gg.getAttribute('normal'), ca = gg.getAttribute('color');
    const mc = (m.material as THREE.MeshStandardMaterial).color;
    nm.getNormalMatrix(m.matrixWorld);
    const flip = m.matrixWorld.determinant() < 0;
    for (let i = 0; i < pa.count; i++) {
      const vi = flip ? i - (i % 3) + (2 - (i % 3)) : i;
      v.fromBufferAttribute(pa, vi).applyMatrix4(m.matrixWorld);
      n.fromBufferAttribute(na, vi).applyMatrix3(nm).normalize();
      if (ca) cc.fromBufferAttribute(ca as THREE.BufferAttribute, vi).multiply(mc); else cc.copy(mc);
      pos.push(v.x, v.y, v.z); nor.push(n.x, n.y, n.z); col.push(cc.r, cc.g, cc.b);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const mesh = new THREE.Mesh(geo, mat('#ffffff', { vc: true, flat }));
  mesh.castShadow = true;
  return mesh;
}

/** Tiny person for scale. */
function person(p: THREE.Object3D, x: number, y: number, z: number, s: number, c: string): void {
  passerby(p, x, y, z, s, 1, { top: c });
}

/** Hip roof over a convex plan: walls' top ring rising to an inset ring. */
function hipRoof(p: THREE.Object3D, plan: [number, number][], y: number, h: number, inset: number, c: string): void {
  let cx = 0, cz = 0;
  for (const [x, z] of plan) { cx += x; cz += z; }
  cx /= plan.length; cz /= plan.length;
  const top = plan.map(([x, z]) => [cx + (x - cx) * inset, y + h, cz + (z - cz) * inset] as V3);
  skin(p, [plan.map(([x, z]) => [x, y, z] as V3), top], c, { caps: true, flat: true });
}

/** Windows spaced along a straight wall P→Q; outward normal is (−dz, dx) — e.g. a +z wall runs from −x to +x. */
function wallWindows(p: THREE.Object3D, P: [number, number], Q: [number, number], ys: number[], step: number, w: number, h: number,
  frame: string, glass: string, keel = false, out = 1): void {
  const dx = Q[0] - P[0], dz = Q[1] - P[1], L = Math.hypot(dx, dz), n = Math.max(1, Math.floor(L / step));
  const nx = (-dz / L) * out, nz = (dx / L) * out, ry = Math.atan2(nx, nz);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    for (const y of ys) win(p, P[0] + dx * t + nx * 0.001, y, P[1] + dz * t + nz * 0.001, w, h, ry, frame, glass, keel);
  }
}

// =========================================================================================================
// St. Basil's Cathedral — nine chapels on one podklet, each onion painted differently, Red Square cobbles
// =========================================================================================================
type Pat = (u: number, t: number) => string;
const spiralP = (n: number, tw: number, cs: string[]): Pat => (u, t) => cs[Math.floor(frac(u * n + t * tw) * cs.length)];
const chevronP = (n: number, k: number, c1: string, c2: string): Pat => (u, t) =>
  (Math.floor(t * k + Math.abs(frac(u * n) - 0.5) * 1.4) % 2 ? c1 : c2);
const diamondP = (n: number, k: number, c1: string, c2: string, c3?: string): Pat => (u, t) => {
  const A = Math.floor(u * n + t * k), B = Math.floor(u * n - t * k);
  return (A + B) & 1 ? c1 : c3 && A & 1 ? c3 : c2;
};
const ONION: [number, number][] = [[0.55, 0], [0.84, 0.07], [1, 0.22], [0.96, 0.38], [0.78, 0.53], [0.5, 0.67], [0.27, 0.79], [0.12, 0.9], [0.05, 0.97], [0, 1]];

function onion(p: THREE.Object3D, x: number, y: number, z: number, r: number, h: number, pat: Pat, seg = 22): void {
  const pts = smooth(ONION.map(([a, b]) => [a * r, b * h] as [number, number]), 12);
  plathe(p, pts, '#ffffff', (px, py, pz) => pat(frac(Math.atan2(px, pz) / TAU), py / h), x, y, z, seg, true);
}

const basil: Builder = (gp, r) => {
  const BR = r.color ?? '#c94a3a', WH = '#f1ebdd', GRN = '#2f7d5a', G = 0.022;
  // Red Square: granite-sett cobbles with a pale kerb ring
  island(gp, 0.5, (x, z) => 0.0015 * fbm(x * 40, 0, z * 40), '#77736e', (x, y, z) => {
    const rr = Math.hypot(x, z);
    if (rr > 0.475) return '#b7afa2';
    const q = hash3(Math.floor(x * 80 + Math.sin(z * 30)), 0, Math.floor(z * 80));
    return q > 0.66 ? '#7c7872' : q > 0.33 ? '#74706b' : '#78746f';
  }, { rings: 22, segs: 64, base: 0.02, side: () => '#5f5a54' });

  // Podklet (raised base) — chamfered square plan, arcaded red brick, white cornice, green gallery roof
  const oct = (s: number, ch: number): [number, number][] => [[-s + ch, -s], [s - ch, -s], [s, -s + ch], [s, s - ch], [s - ch, s], [-s + ch, s], [-s, s - ch], [-s, -s + ch]];
  const PY = G + 0.1;
  prism(gp, oct(0.29, 0.09), G, 0.1, BR, 0.003);
  prism(gp, oct(0.297, 0.092), G, 0.012, shade(BR, 0.7));
  prism(gp, oct(0.3, 0.093), PY - 0.012, 0.012, WH, 0.002);
  hipRoof(gp, oct(0.285, 0.088), PY, 0.035, 0.7, GRN);
  const P8 = oct(0.29, 0.09);
  for (let i = 0; i < 8; i++) {
    const A = P8[i], B = P8[(i + 1) % 8];
    wallWindows(gp, B, A, [G + 0.028], 0.042, 0.02, 0.038, WH, '#3a1f1a');
  }
  // Front staircase with two green-tented porches
  for (let s = 0; s < 6; s++) box(gp, '#d9d1c2', 0, G + s * 0.016, 0.29 + 0.07 - s * 0.012, 0.09, 0.016, 0.024);
  for (const sx of [-1, 1]) {
    const x = sx * 0.075, z = 0.31;
    box(gp, BR, x, G, z, 0.05, 0.13, 0.05);
    box(gp, WH, x, G + 0.13, z, 0.058, 0.01, 0.058);
    win(gp, x, G + 0.06, z + 0.0255, 0.018, 0.04, 0, WH, '#3a1f1a');
    tent(gp, 4, 0.04, 0.004, 0.08, GRN, (px, py) => (frac(py * 60) < 0.25 ? '#e9e2cf' : null), x, G + 0.14, z, 2, 6).rotation.y = Math.PI / 4;
    cyl(gp, GOLD, x, G + 0.215, z, 0.005, 0.02, 6);
  }

  // A chapel: octagonal brick drum, white pilasters & cornices, arched windows, kokoshnik crown, arcaded neck, onion
  const chapel = (cx: number, cz: number, R: number, H: number, dr: number, dh: number, oR: number, oH: number, pat: Pat, body = BR) => {
    const ap = R * Math.cos(Math.PI / 8);
    ngon(gp, body, cx, PY, cz, R, H);
    for (let k = 0; k < 8; k++) {
      const a = ((k + 0.5) / 8) * TAU;
      box(gp, WH, cx + Math.sin(a) * R * 0.97, PY, cz + Math.cos(a) * R * 0.97, 0.007, H, 0.007, a);
      const th = (k / 8) * TAU;
      win(gp, cx + Math.sin(th) * ap, PY + H * 0.5, cz + Math.cos(th) * ap, R * 0.28, H * 0.2, th, WH, '#2a1d1b');
      if (H > 0.2) win(gp, cx + Math.sin(th) * ap, PY + H * 0.18, cz + Math.cos(th) * ap, R * 0.22, H * 0.12, th, '', '#2a1d1b');
      // Kokoshnik crown: white keel gable with a brick inner face
      arch(gp, WH, cx + Math.sin(th) * ap * 0.98, PY + H - 0.004, cz + Math.cos(th) * ap * 0.98, R * 0.78, R * 0.62, 0.006, th, true);
      arch(gp, body, cx + Math.sin(th) * (ap * 0.98 + 0.0034), PY + H + 0.002, cz + Math.cos(th) * (ap * 0.98 + 0.0034), R * 0.58, R * 0.44, 0, th, true);
    }
    ngon(gp, WH, cx, PY + H * 0.38, cz, R * 1.05, 0.008);
    ngon(gp, WH, cx, PY + H - 0.012, cz, R * 1.07, 0.012);
    ngon(gp, GRN, cx, PY + H, cz, R * 0.92, 0.012);
    // Arcaded neck drum
    const ny = PY + H + 0.008;
    ngon(gp, shade(body, 1.04), cx, ny, cz, dr, dh);
    for (let k = 0; k < 8; k++) {
      const th = (k / 8) * TAU, da = dr * Math.cos(Math.PI / 8);
      win(gp, cx + Math.sin(th) * da, ny + dh * 0.25, cz + Math.cos(th) * da, dr * 0.3, dh * 0.5, th, '', '#3a2420');
    }
    ngon(gp, WH, cx, ny + dh * 0.12, cz, dr * 1.08, 0.006);
    ngon(gp, WH, cx, ny + dh - 0.006, cz, dr * 1.12, 0.008);
    onion(gp, cx, ny + dh, cz, oR, oH, pat);
    cyl(gp, GOLD, cx, ny + dh + oH * 0.97, cz, oR * 0.09, oH * 0.12, 6);
    oCross(gp, cx, ny + dh + oH * 1.05, cz, oH * 0.5);
  };

  const RW = '#c8392f', W2 = '#f4f0e6', G1 = '#2f8a4e', G2 = '#9ccc3c', Y1 = '#e9b830', B1 = '#2e6fb5', O1 = '#e5732a';
  // Cardinal chapels (larger) — front (+z) is the famous red-and-white zigzag
  chapel(0, 0.2, 0.066, 0.25, 0.042, 0.04, 0.072, 0.13, chevronP(10, 9, RW, W2));
  chapel(0.2, 0, 0.066, 0.24, 0.042, 0.04, 0.07, 0.125, spiralP(9, 1.7, [G1, Y1]));
  chapel(0, -0.2, 0.066, 0.24, 0.042, 0.04, 0.07, 0.125, spiralP(10, -1.8, [B1, W2]));
  chapel(-0.2, 0, 0.066, 0.25, 0.042, 0.04, 0.072, 0.13, diamondP(8, 6, RW, G1, Y1));
  // Diagonal chapels (smaller)
  chapel(0.135, 0.135, 0.046, 0.18, 0.03, 0.03, 0.05, 0.09, diamondP(10, 7, G2, '#c8a02a'));
  chapel(-0.135, 0.135, 0.046, 0.19, 0.03, 0.03, 0.05, 0.09, spiralP(8, 1.4, [G1, O1, Y1]));
  chapel(-0.135, -0.135, 0.046, 0.17, 0.03, 0.03, 0.05, 0.09, diamondP(9, 6, '#1f9c8c', Y1, RW));
  chapel(0.135, -0.135, 0.046, 0.18, 0.03, 0.03, 0.05, 0.09, spiralP(8, -1.5, [RW, Y1, G1]));

  // Central church of the Intercession: tall octagonal body, three kokoshnik tiers, patterned tented spire, gold cupola
  const CR = 0.082, CH = 0.29;
  chapel(0, 0, CR, CH, 0.06, 0.02, 0.001, 0.001, () => GOLD);
  const ty = PY + CH + 0.03;
  for (let tier = 0; tier < 2; tier++) {
    const rr = 0.07 - tier * 0.012, yy = ty + tier * 0.026;
    ngon(gp, BR, 0, yy - 0.004, 0, rr, 0.03);
    for (let k = 0; k < 8; k++) {
      const th = ((k + tier * 0.5) / 8) * TAU, ap = rr * 0.95;
      arch(gp, WH, Math.sin(th) * ap, yy, Math.cos(th) * ap, rr * 0.7, 0.036, 0.006, th, true);
      arch(gp, '#e07a3a', Math.sin(th) * (ap + 0.0034), yy + 0.004, Math.cos(th) * (ap + 0.0034), rr * 0.5, 0.026, 0, th, true);
    }
  }
  const tb = ty + 0.05, TH = 0.25;
  const m4 = (v: number) => ((v % 4) + 4) % 4;
  tent(gp, 8, 0.058, 0.014, TH, '#e0743a', (x, y, z) => {
    const a = frac(Math.atan2(x, z) / TAU * 8 + 0.5), i = Math.floor(a * 4), j = Math.floor((y / TH) * 20);
    if (a < 0.03 || a > 0.97) return WH;
    const A = m4(i + j), B = m4(i - j);
    return A === 0 || B === 0 ? '#f4efe2' : A === 2 && B === 2 ? '#3f9a5c' : null;
  }, 0, tb, 0, 4, 20);
  ngon(gp, WH, 0, tb + TH, 0, 0.018, 0.008);
  ngon(gp, '#3f9a5c', 0, tb + TH + 0.008, 0, 0.016, 0.03);
  ngon(gp, WH, 0, tb + TH + 0.036, 0, 0.019, 0.005);
  onion(gp, 0, tb + TH + 0.04, 0, 0.032, 0.06, () => GOLD, 20);
  oCross(gp, 0, tb + TH + 0.1, 0, 0.05);

  // Bell tower (belfry) at the south-east corner: brick base, open arcade, green tiled tent
  const bx = -0.3, bz = -0.25;
  box(gp, BR, bx, G, bz, 0.1, 0.19, 0.1);
  box(gp, WH, bx, G + 0.19, bz, 0.108, 0.012, 0.108);
  for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) win(gp, bx + nx * 0.05, G + 0.1, bz + nz * 0.05, 0.03, 0.05, Math.atan2(nx, nz), WH, '#3a1f1a');
  const by = G + 0.202;
  for (let k = 0; k < 8; k++) { const a = ((k + 0.5) / 8) * TAU; box(gp, WH, bx + Math.sin(a) * 0.04, by, bz + Math.cos(a) * 0.04, 0.009, 0.06, 0.009, a); }
  ngon(gp, '#3a2a24', bx, by, bz, 0.03, 0.055);
  cyl(gp, '#a07a2a', bx, by + 0.02, bz, 0.016, 0.02, 8);
  ngon(gp, WH, bx, by + 0.06, bz, 0.046, 0.01);
  tent(gp, 8, 0.043, 0.008, 0.13, '#2f7d5a', (x, y, z) => {
    const a = frac(Math.atan2(x, z) / TAU * 8 + 0.5);
    return a < 0.06 || a > 0.94 ? WH : frac(y * 70) < 0.2 ? '#f0ead8' : null;
  }, bx, by + 0.07, bz, 2, 10);
  onion(gp, bx, by + 0.2, bz, 0.016, 0.03, () => '#3f9a5c', 14);
  oCross(gp, bx, by + 0.228, bz, 0.03);

  // Minin & Pozharsky monument + people on the square
  rbox(gp, '#8d8a85', -0.3, G, 0.31, 0.06, 0.06, 0.04, 0.004);
  rbox(gp, '#a8a49d', -0.3, G + 0.06, 0.31, 0.065, 0.008, 0.045, 0.002);
  const BZ = '#3f4436';
  box(gp, BZ, -0.312, G + 0.068, 0.31, 0.014, 0.022, 0.016);
  add(gp, SPH(8), mat(BZ), -0.312, G + 0.098, 0.31, 0.012, 0.024, 0.012);
  add(gp, SPH(6), mat(BZ), -0.312, G + 0.115, 0.31, 0.009, 0.009, 0.009);
  box(gp, BZ, -0.29, G + 0.068, 0.312, 0.012, 0.036, 0.01);
  add(gp, SPH(8), mat(BZ), -0.29, G + 0.108, 0.312, 0.012, 0.03, 0.012);
  add(gp, SPH(6), mat(BZ), -0.29, G + 0.128, 0.312, 0.009, 0.009, 0.009);
  rod(gp, [-0.284, G + 0.115, 0.312], [-0.27, G + 0.14, 0.318], 0.0025, BZ, 4);
  const cols = ['#1e3a8a', '#7f1d1d', '#334155', '#f8fafc', '#166534', '#0f172a'];
  for (let i = 0; i < 14; i++) {
    const a = hash3(i, 3, 7) * TAU, rr = 0.34 + hash3(i, 4, 1) * 0.11;
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    if (Math.abs(x + 0.3) < 0.05 && Math.abs(z - 0.31) < 0.05) continue;
    person(gp, x, G, z, 0.028, cols[i % cols.length]);
  }
};

// =========================================================================================================
// Zaanse Schans smock mill — octagonal green body, thatched cap, stelling, lattice sails (spin), canal & Zaan house
// =========================================================================================================
const windmill: Builder = (gp, r) => {
  const c = r.color ?? '#3f6b4e';
  const CZ = 0.2, CW = 0.2; // canal from z=CZ to CZ+CW
  const hf: HFn = (x, z) => {
    const d = Math.min(z - CZ, CZ + CW - z);
    const grass = 0.014 + 0.003 * fbm(x * 20, 0, z * 20);
    return d > 0.015 ? 0.001 : d > 0 ? 0.001 + (grass - 0.001) * (1 - d / 0.015) : grass;
  };
  island(gp, 0.5, hf, '#5f8f3e', (x, y, z, _nx, ny) => {
    if (y < 0.0375 && ny > 0.95) return ripple('#3d6f8e')(x, y, z, 0, 1, 0);
    if (ny < 0.9) return '#6b5a3c';
    if (z < CZ && x > 0.12 && x < 0.2) return '#b9ad95';
    const f = fbm(x * 12, 0, z * 12);
    return Math.floor((x + f * 0.05) * 22) % 2 ? (f > 0.55 ? '#6a9a45' : '#5f8f3e') : '#679540';
  }, { rings: 34, segs: 96, side: strataSide(['#5b4636', '#4f3c2e', '#6b4f3a']) });
  const gy = onGround(hf);
  // Timber quay boarding along both banks
  for (const zz of [CZ - 0.002, CZ + CW + 0.002]) {
    for (let i = 0; i < 22; i++) {
      const x = -0.46 + i * 0.044;
      if (Math.hypot(x, zz) > 0.47) continue;
      cyl(gp, '#5a4634', x, 0.03, zz, 0.004, 0.024, 5);
    }
    box(gp, '#6d5640', 0, 0.044, zz, Math.sqrt(0.47 ** 2 - zz ** 2) * 2, 0.008, 0.005);
  }
  // Reeds on the far bank, rowing boat in the canal
  scatter(26, 9, (x, z) => {
    if (z < CZ + CW - 0.01 || z > CZ + CW + 0.04) return;
    for (let k = 0; k < 4; k++) rod(gp, [x + k * 0.004, 0.04, z], [x + k * 0.006 - 0.004, 0.08 + hash3(x, k, z) * 0.03, z + 0.004], 0.0018, k % 2 ? '#8aa04a' : '#a8b25a', 3);
  }, 0.48);
  const bt = new THREE.Group(); bt.position.set(0.16, 0.036, CZ + 0.1); bt.rotation.y = 0.2; gp.add(bt);
  skin(bt, [-1, -0.6, 0, 0.6, 1].map(t => {
    const w = 0.026 * Math.sqrt(1 - t * t * 0.9) + 0.002, L = 0.07;
    return [[-w, 0.012, t * L], [-w * 0.8, 0, t * L], [w * 0.8, 0, t * L], [w, 0.012, t * L]] as V3[];
  }), '#2f5d7a', { closed: true, flat: true });
  box(bt, '#c9a46a', 0, 0.006, 0, 0.044, 0.004, 0.012);

  // ---- Mill ----
  const mx = 0.02, mz = -0.05, B0 = 0.045;
  const ap = (R: number) => R * Math.cos(Math.PI / 8);
  // Brick base storey
  ngon(gp, '#7a3b2a', mx, B0 - 0.01, mz, 0.17, 0.07);
  ngon(gp, '#e8e2d2', mx, B0 + 0.06, mz, 0.172, 0.006);
  for (let k = 0; k < 8; k++) {
    const th = (k / 8) * TAU;
    if (k === 0) { box(gp, '#2f5d3c', mx, B0, mz + ap(0.17) + 0.002, 0.032, 0.05, 0.006); box(gp, '#f1ece0', mx, B0 + 0.05, mz + ap(0.17) + 0.002, 0.04, 0.006, 0.007); continue; }
    if (k % 2) win(gp, mx + Math.sin(th) * ap(0.17), B0 + 0.018, mz + Math.cos(th) * ap(0.17), 0.016, 0.022, th, '#f1ece0', '#26323a');
  }
  // Tapered octagonal weather-boarded body
  const BY = B0 + 0.066, BH = 0.45, R0 = 0.155, R1 = 0.088;
  tent(gp, 8, R0, R1, BH, c, (_x, y, _z, nx, _ny, nz) => {
    const a = frac(Math.atan2(nx, nz) / TAU * 8 + 0.5);
    if (a < 0.05 || a > 0.95) return shade(c, 0.75);
    return frac(y * 70) < 0.18 ? shade(c, 0.82) : null;
  }, mx, BY, mz, 2, 30);
  for (let k = 0; k < 8; k++) {
    const th = (k / 8) * TAU;
    for (const t of k % 2 ? [0.55] : [0.25, 0.72]) {
      const R = R0 + (R1 - R0) * t, y = BY + BH * t;
      if (k === 0 && t < 0.3) continue;
      const m = box(gp, '#f1ece0', mx + Math.sin(th) * ap(R), y, mz + Math.cos(th) * ap(R), 0.026, 0.024, 0.006, th);
      m.rotation.x = 0;
      box(gp, '#25303a', mx + Math.sin(th) * (ap(R) + 0.002), y + 0.004, mz + Math.cos(th) * (ap(R) + 0.002), 0.018, 0.016, 0.006, th);
    }
  }
  // Stage door
  const SY = 0.18;
  { const R = R0 + (R1 - R0) * ((SY - BY) / BH); box(gp, '#2a4a36', mx, SY, mz + ap(R) + 0.002, 0.034, 0.055, 0.008); box(gp, '#f1ece0', mx, SY + 0.055, mz + ap(R) + 0.002, 0.042, 0.006, 0.009); }
  // Stelling: octagonal plank deck, braces, railing
  const SR = 0.28;
  const ring = (R: number): [number, number][] => Array.from({ length: 8 }, (_, k) => {
    const a = ((k + 0.5) / 8) * TAU; return [mx + Math.sin(a) * R, -(mz + Math.cos(a) * R)] as [number, number];
  });
  prism(gp, ring(SR).map(([x, z]) => [x, -z] as [number, number]), SY - 0.012, 0.012, '#8a6a4a');
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * TAU;
    rod(gp, [mx + Math.sin(a) * 0.12, SY - 0.012, mz + Math.cos(a) * 0.12], [mx + Math.sin(a) * SR * 0.92, SY - 0.012, mz + Math.cos(a) * SR * 0.92], 0.004, '#5e4632', 4);
  }
  for (let k = 0; k < 8; k++) {
    const a = ((k + 0.5) / 8) * TAU, a2 = ((k + 1.5) / 8) * TAU;
    const P0: V3 = [mx + Math.sin(a) * SR * 0.97, SY, mz + Math.cos(a) * SR * 0.97], P1: V3 = [mx + Math.sin(a2) * SR * 0.97, SY, mz + Math.cos(a2) * SR * 0.97];
    rod(gp, [P0[0], SY - 0.012, P0[2]], [mx + Math.sin(a) * 0.17, B0 + 0.02, mz + Math.cos(a) * 0.17], 0.005, '#5e4632', 4);
    rod(gp, P0, [P0[0], SY + 0.03, P0[2]], 0.003, '#4a3a2c', 4);
    const mid: V3 = [(P0[0] + P1[0]) / 2, SY, (P0[2] + P1[2]) / 2];
    rod(gp, mid, [mid[0], SY + 0.03, mid[2]], 0.0025, '#4a3a2c', 4);
    rod(gp, [P0[0], SY + 0.03, P0[2]], [P1[0], SY + 0.03, P1[2]], 0.0028, '#4a3a2c', 4);
    rod(gp, [P0[0], SY + 0.016, P0[2]], [P1[0], SY + 0.016, P1[2]], 0.002, '#4a3a2c', 4);
  }
  // Thatched cap (boat-shaped) with weather boards at the front
  const TY = BY + BH;
  ngon(gp, '#5a4634', mx, TY - 0.004, mz, R1 + 0.012, 0.012);
  const cap = plathe(gp, smooth([[0.11, 0], [0.112, 0.025], [0.1, 0.055], [0.072, 0.085], [0.035, 0.103], [0, 0.11]], 10), '#7a6648',
    (x, y, z) => { const s = hash3(Math.floor(Math.atan2(x, z) * 30), Math.floor(y * 90), 1); return s > 0.7 ? '#8c7752' : s < 0.2 ? '#665438' : null; },
    mx, TY + 0.008, mz, 24);
  cap.scale.set(1, 1, 1.25);
  box(gp, '#e8e2d2', mx, TY + 0.008, mz + 0.115, 0.15, 0.04, 0.012);
  box(gp, '#2f5d3c', mx, TY + 0.048, mz + 0.112, 0.1, 0.012, 0.012);
  // Tail pole & capstan wheel down to the stage
  const tail0: V3 = [mx, TY + 0.03, mz - 0.13], tail1: V3 = [mx, SY + 0.02, mz - SR - 0.03];
  rod(gp, tail0, tail1, 0.006, '#4a3a2c', 5);
  rod(gp, [mx - 0.05, TY + 0.015, mz - 0.1], tail1, 0.004, '#4a3a2c', 4);
  rod(gp, [mx + 0.05, TY + 0.015, mz - 0.1], tail1, 0.004, '#4a3a2c', 4);
  const wheel = add(gp, g('sacred-torus', () => new THREE.TorusGeometry(0.5, 0.08, 5, 18)), mat('#5e4632'), mx, SY + 0.05, mz - SR - 0.03, 0.07, 0.07, 0.07, Math.PI / 2);
  wheel.castShadow = true;
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI; rod(gp, [mx, SY + 0.05 + Math.sin(a) * 0.035, mz - SR - 0.03 + Math.cos(a) * 0.035], [mx, SY + 0.05 - Math.sin(a) * 0.035, mz - SR - 0.03 - Math.cos(a) * 0.035], 0.002, '#5e4632', 3); }

  // Windshaft + sails (single merged mesh inside the 'spin' group so it can rotate)
  const tilt = new THREE.Group(); tilt.position.set(mx, TY + 0.055, mz + 0.13); tilt.rotation.x = -0.14; gp.add(tilt);
  add(tilt, CYL(10), mat('#3b3530'), 0, 0, -0.05, 0.03, 0.1, 0.03, 0, Math.PI / 2);
  const sails = new THREE.Group();
  const STOCK = '#f4f1e8', LAT = '#3d342c', CLOTH = '#efe6d0';
  add(sails, CYL(10), mat('#2f2b27'), 0, 0, 0.012, 0.05, 0.04, 0.05, 0, Math.PI / 2);
  add(sails, CYL(10), mat('#e8e2d2'), 0, 0, 0.034, 0.03, 0.01, 0.03, 0, Math.PI / 2);
  const L = 0.41;
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Group(); s.rotation.z = (i * Math.PI) / 2 + Math.PI / 4; sails.add(s);
    box(s, STOCK, 0, 0, 0.022, 0.014, L, 0.012);
    box(s, i % 2 ? '#b91c1c' : '#2f5d3c', 0, L - 0.035, 0.022, 0.016, 0.035, 0.014);
    box(s, STOCK, -0.016, 0.08, 0.02, 0.016, L - 0.085, 0.004);
    box(s, LAT, 0.078, 0.07, 0.02, 0.006, L - 0.07, 0.008);
    for (let k = 0; k <= 15; k++) box(s, LAT, 0.042, 0.075 + k * 0.022, 0.02, 0.078, 0.004, 0.005);
    for (const xx of [0.03, 0.054]) box(s, LAT, xx, 0.07, 0.024, 0.0025, L - 0.075, 0.003);
    if (i % 2 === 0) box(s, CLOTH, 0.043, 0.085, 0.016, 0.066, L - 0.1, 0.002);
    else cyl(s, CLOTH, 0.012, 0.08, 0.026, 0.006, L - 0.1, 6);
  }
  const spin = new THREE.Group(); spin.name = 'spin'; tilt.add(spin);
  spin.add(mergeGroup(sails));

  // ---- Zaan house: green weather-boarded walls, white trim, bell gable, glazed pantile roof ----
  const hx = -0.27, hz = 0.06;
  const HW = 0.15, HD = 0.11, HH = 0.075, hy = gy(hx, hz);
  box(gp, '#2f5f45', hx, hy, hz, HW, HH, HD);
  for (let k = 0; k < 6; k++) box(gp, '#285240', hx, hy + 0.008 + k * 0.012, hz, HW + 0.002, 0.002, HD + 0.002);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) box(gp, '#f1ece0', hx + sx * HW / 2, hy, hz + sz * HD / 2, 0.006, HH, 0.006);
  for (const dx of [-0.045, 0.045]) {
    box(gp, '#f1ece0', hx + dx, hy + 0.025, hz + HD / 2 + 0.001, 0.03, 0.034, 0.004);
    box(gp, '#26323a', hx + dx, hy + 0.028, hz + HD / 2 + 0.003, 0.022, 0.026, 0.004);
    box(gp, '#2f5d3c', hx + dx - 0.022, hy + 0.025, hz + HD / 2 + 0.002, 0.008, 0.034, 0.003);
  }
  box(gp, '#f1ece0', hx, hy, hz + HD / 2 + 0.001, 0.034, 0.055, 0.004);
  box(gp, '#2a4a36', hx, hy, hz + HD / 2 + 0.003, 0.026, 0.05, 0.004);
  gable(gp, HD + 0.02, 0.07, HW + 0.02, '#2a2f3a', hx, hy + HH, hz, Math.PI / 2);
  // Bell gable on the canal-facing end
  slab(gp, [[-0.05, 0], [0.05, 0], [0.044, 0.03], [0.03, 0.05], [0.016, 0.062], [0.012, 0.08], [-0.012, 0.08], [-0.016, 0.062], [-0.03, 0.05], [-0.044, 0.03]], 0.008, '#2f5f45', 0, false)
    .position.set(hx, hy + HH, hz + HD / 2 + 0.006);
  slab(gp, [[-0.054, -0.004], [0.054, -0.004], [0.048, 0.03], [0.034, 0.052], [0.02, 0.066], [0.016, 0.086], [-0.016, 0.086], [-0.02, 0.066], [-0.034, 0.052], [-0.048, 0.03]], 0.006, '#f1ece0', 0, false)
    .position.set(hx, hy + HH, hz + HD / 2 + 0.002);
  box(gp, '#26323a', hx, hy + HH + 0.022, hz + HD / 2 + 0.011, 0.016, 0.022, 0.003);
  box(gp, '#7a3b2a', hx + 0.04, hy + HH + 0.03, hz - 0.02, 0.016, 0.05, 0.016);
  // Garden: pollard willows, fence, Dutch flag
  for (const [x, z] of [[-0.38, -0.12], [-0.16, 0.14], [0.3, 0.12], [0.36, -0.2], [-0.2, -0.32]] as const) {
    const y = gy(x, z);
    cyl(gp, '#6b5340', x, y, z, 0.01, 0.05, 6);
    ball(gp, '#7d9a4a', x, y + 0.075, z, 0.07, 0.06, 0.07);
    ball(gp, '#8fae58', x + 0.01, y + 0.09, z + 0.008, 0.044);
  }
  for (let i = 0; i < 9; i++) { const x = -0.44 + i * 0.03; cyl(gp, '#f1ece0', x, gy(x, -0.12), -0.12, 0.003, 0.028, 4); }
  box(gp, '#f1ece0', -0.32, gy(-0.32, -0.12) + 0.02, -0.12, 0.24, 0.004, 0.004);
  const fx = 0.3, fz = -0.02, fy = gy(fx, fz);
  rod(gp, [fx, fy, fz], [fx, fy + 0.2, fz], 0.0025, '#e5e7eb', 5);
  box(gp, '#ae1c28', fx + 0.025, fy + 0.18, fz, 0.05, 0.012, 0.002);
  box(gp, '#f8fafc', fx + 0.025, fy + 0.168, fz, 0.05, 0.012, 0.002);
  box(gp, '#21468b', fx + 0.025, fy + 0.156, fz, 0.05, 0.012, 0.002);
  person(gp, 0.18, gy(0.18, 0.08), 0.08, 0.03, '#1e3a8a');
  person(gp, 0.21, gy(0.21, 0.1), 0.1, 0.028, '#b91c1c');
};

// =========================================================================================================
// Sagrada Família — Nativity & Passion façades with perforated spindle spires, central Jesus/Mary/Evangelist towers
// =========================================================================================================
const MOSAIC = ['#c0392b', '#d4a72c', '#f4efe4', '#e67e22', '#b03a2e', '#f5d76e'];

/** Gaudí apostle spire: square foot, parabolic perforated spindle, Venetian-mosaic bishop finial. */
function apostleSpire(p: THREE.Object3D, x: number, y: number, z: number, H: number, r0: number, c: string): void {
  box(p, c, x, y, z, r0 * 1.7, H * 0.16, r0 * 1.9);
  const SH = H * 0.86, pts: [number, number][] = [];
  for (let i = 0; i <= 20; i++) { const t = (i / 20) * 0.97; pts.push([r0 * Math.pow(1 - Math.pow(t, 2.3), 0.55) + 0.003, t * SH]); }
  const dark = shade(c, 0.45);
  plathe(p, pts, c, (px, py, pz) => {
    const t = py / SH, a = frac(Math.atan2(px, pz) / TAU), row = Math.floor(t * 10);
    if (t < 0.12 || t > 0.86) return frac(t * 40) < 0.3 ? shade(c, 0.9) : null;
    return frac(t * 10) < 0.62 && frac(a * 7 + row * 0.5) < 0.42 ? dark : null;
  }, x, y + H * 0.12, z, 14, true);
  const fy = y + H * 0.12 + SH * 0.97;
  plathe(p, [[0.006, 0], [0.011, 0.006], [0.011, 0.03], [0.014, 0.034], [0.006, 0.04]], '#ffffff', (px, py, pz) =>
    MOSAIC[Math.floor(hash3(Math.floor(Math.atan2(px, pz) * 3), Math.floor(py * 300), 3) * MOSAIC.length)], x, fy, z, 6, true);
  add(p, SPH(8), mat('#c0392b'), x, fy + 0.05, z, 0.024, 0.028, 0.024);
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU + 0.4;
    rod(p, [x, fy + 0.055, z], [x + Math.sin(a) * 0.016, fy + 0.066, z + Math.cos(a) * 0.016], 0.0025, '#d4a72c', 4);
    add(p, SPH(6), mat('#f4efe4'), x + Math.sin(a) * 0.017, fy + 0.067, z + Math.cos(a) * 0.017, 0.008, 0.008, 0.008);
  }
  add(p, SPH(6), mat('#f4efe4'), x, fy + 0.074, z, 0.01, 0.01, 0.01);
}

/** Ribbed parabolic central tower (Jesus / Mary / Evangelists). */
function centralTower(p: THREE.Object3D, x: number, y: number, z: number, H: number, r0: number, c: string): number {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 16; i++) { const t = (i / 16) * 0.96; pts.push([r0 * Math.pow(1 - Math.pow(t, 2.6), 0.6) + 0.004, t * H]); }
  plathe(p, pts, c, (px, py, pz) => {
    const t = py / H, a = frac(Math.atan2(px, pz) / TAU);
    if (frac(a * 8) < 0.16) return shade(c, 1.06);
    return frac(t * 9) < 0.55 && frac(a * 8) > 0.4 && frac(a * 8) < 0.76 && t > 0.08 && t < 0.85 ? '#5b5f66' : null;
  }, x, y, z, 16, true);
  return y + H * 0.96;
}

const sagrada: Builder = (gp, r) => {
  const ST = r.color ?? '#c8b08a', OLD = '#a8977d', NEW = '#dcd6ca', G = 0.022;
  // Eixample chamfered block, streets with zebra crossings, the Plaça de Gaudí pond in front of the Nativity façade
  // Paint in polar cells aligned with the island mesh (ring step R/22, sector step TAU/64) so every boundary is a clean edge
  const RS = 0.5 / 22, AS = TAU / 64;
  island(gp, 0.5, () => 0.001, '#6b6e72', (x, _y, z) => {
    const rr = Math.hypot(x, z), a = frac(Math.atan2(z, x) / TAU) * TAU, ring = Math.floor(rr / RS), sec = Math.floor(a / AS);
    if (ring < 15) return hash3(ring, 0, sec) > 0.5 ? '#d8ccb2' : '#d0c3a8';
    if (ring < 17) return '#c9c1b2';
    if (ring >= 19 && sec >= 11 && sec < 21) return ripple('#3f8fb0')(x, 0, z, 0, 1, 0);
    if (ring >= 18 && sec >= 10 && sec < 22) return '#c9c1b2';
    return '#6b6e72';
  }, { rings: 22, segs: 64, base: 0.02, side: () => '#55585c' });

  const CX = 0.03;
  // ---- Body: Latin-cross plan — transept (z) crossing the five-aisle nave (+x), apse (−x) ----
  box(gp, ST, CX, G, 0, 0.2, 0.2, 0.4);                         // transept
  gable(gp, 0.4, 0.07, 0.2, shade(ST, 0.92), CX, G + 0.2, 0, Math.PI / 2);
  box(gp, ST, 0.22, G, 0, 0.18, 0.2, 0.12);                     // nave
  gable(gp, 0.18, 0.06, 0.12, shade(ST, 0.92), 0.22, G + 0.2, 0);
  for (const sz of [-1, 1]) {
    box(gp, shade(ST, 0.96), 0.22, G, sz * 0.09, 0.18, 0.13, 0.06);  // aisles
    wallWindows(gp, sz > 0 ? [0.13, 0.12] : [0.31, -0.12], sz > 0 ? [0.31, 0.12] : [0.13, -0.12], [G + 0.03], 0.036, 0.016, 0.07, shade(ST, 1.08), '#3d3a36', true);
    wallWindows(gp, sz > 0 ? [0.13, 0.06] : [0.31, -0.06], sz > 0 ? [0.31, 0.06] : [0.13, -0.06], [G + 0.14], 0.036, 0.014, 0.045, shade(ST, 1.08), '#3d3a36', true);
    // Buttress pinnacles crowned with mosaic fruit baskets
    for (let i = 0; i < 5; i++) {
      const x = 0.14 + i * 0.042, z = sz * 0.122;
      plathe(gp, [[0.009, 0], [0.008, 0.1], [0.005, 0.15], [0.001, 0.18]], ST, undefined, x, G + 0.06, z, 6, true);
      for (let k = 0; k < 3; k++) add(gp, SPH(6), mat(MOSAIC[(i + k) % MOSAIC.length]), x + (k - 1) * 0.005, G + 0.23 + (k % 2) * 0.006, z, 0.01, 0.01, 0.01);
    }
  }
  // Apse: semicircular chevet ringed by slim chapel pinnacles
  box(gp, ST, -0.1, G, 0, 0.06, 0.2, 0.2);
  cyl(gp, ST, -0.13, G, 0, 0.1, 0.2, 16);
  for (let k = 0; k < 7; k++) {
    const a = Math.PI / 2 + (k / 6) * Math.PI, x = -0.13 + Math.sin(a) * 0.11, z = Math.cos(a) * 0.11;
    plathe(gp, [[0.012, 0], [0.011, 0.14], [0.007, 0.22], [0.001, 0.27]], ST, (_x, y) => (frac(y * 40) < 0.3 ? shade(ST, 0.85) : null), x, G, z, 6, true);
    add(gp, SPH(6), mat(MOSAIC[k % MOSAIC.length]), x, G + 0.275, z, 0.012, 0.012, 0.012);
    win(gp, -0.13 + Math.sin(a) * 0.1, G + 0.08, Math.cos(a) * 0.1, 0.018, 0.08, a, '', '#3d3a36', true);
  }
  // Glory façade (+x): massive porch still under construction
  box(gp, shade(ST, 1.03), 0.33, G, 0, 0.04, 0.17, 0.2);
  for (const dz of [-0.06, 0, 0.06]) arch(gp, '#3d3a36', 0.351, G, dz, 0.035, 0.12, 0, Math.PI / 2, true);
  for (const dz of [-0.075, -0.025, 0.025, 0.075]) cyl(gp, shade(ST, 1.06), 0.335, G + 0.17, dz, 0.02, 0.07, 10);

  // ---- Nativity façade (+z, weathered) & Passion façade (−z) ----
  for (const sz of [1, -1]) {
    const c = sz > 0 ? OLD : mix(ST, '#ffffff', 0.1), zf = sz * 0.215;
    box(gp, c, CX, G, sz * 0.2, 0.3, 0.24, 0.03);
    const xs = [-0.12, -0.045, 0.045, 0.12];
    xs.forEach((dx, i) => apostleSpire(gp, CX + dx, G, zf, i === 1 || i === 2 ? 0.6 : 0.54, 0.03, c));
    for (const yb of [0.3, 0.4]) for (const dx of [-0.07, 0.07]) box(gp, c, CX + dx, G + yb, zf, 0.05, 0.01, 0.012);
    const ry = sz > 0 ? 0 : Math.PI;
    arch(gp, '#2e2a26', CX, G, sz * 0.216, 0.05, 0.19, 0, ry, true);
    for (const dx of [-0.07, 0.07]) arch(gp, '#2e2a26', CX + dx, G, sz * 0.216, 0.03, 0.13, 0, ry, true);
    if (sz > 0) {
      // Organic "melting" sculpture over the portals, dripping stalactites and the cypress tree with doves
      for (let k = 0; k < 14; k++) {
        const dx = (hash3(k, 1, 2) - 0.5) * 0.2, yy = G + 0.2 + hash3(k, 2, 3) * 0.1;
        add(gp, SPH(8), mat(shade(OLD, 0.85 + hash3(k, 4, 1) * 0.25)), CX + dx, yy, 0.222 + hash3(k, 5, 5) * 0.01, 0.03 + hash3(k, 3, 3) * 0.02, 0.026, 0.016);
      }
      for (let k = 0; k < 9; k++) add(gp, CONE(5), mat(shade(OLD, 0.9)), CX - 0.1 + k * 0.025, G + 0.185, 0.226, 0.008, 0.03, 0.008, 0, Math.PI);
      plathe(gp, smooth([[0.022, 0], [0.026, 0.02], [0.02, 0.06], [0.01, 0.1], [0, 0.12]], 8), '#47704f', (x, y, z) => (hash3(Math.floor(Math.atan2(x, z) * 4), Math.floor(y * 80), 2) > 0.7 ? '#5b8a5f' : null), CX, G + 0.3, 0.23, 10, true);
      for (let k = 0; k < 6; k++) { const a = k * 1.1; add(gp, SPH(6), mat('#f8fafc'), CX + Math.sin(a) * 0.022, G + 0.33 + k * 0.012, 0.23 + Math.cos(a) * 0.022, 0.008, 0.006, 0.01); }
    } else {
      // Passion portico: six leaning bone columns under a slanted canopy
      for (let k = 0; k < 6; k++) {
        const dx = -0.1 + k * 0.04;
        rod(gp, [CX + dx, G, -0.27], [CX + dx * 0.8, G + 0.13, -0.235], 0.009, shade(c, 1.04), 6);
      }
      tbox(gp, 0.24, 0.07, 0.24, 0.04, 0.03, shade(c, 0.95), CX, G + 0.13, -0.25);
      box(gp, '#4a4238', CX, G + 0.16, -0.245, 0.006, 0.07, 0.006);
      box(gp, '#4a4238', CX, G + 0.21, -0.245, 0.04, 0.006, 0.006);
    }
  }

  // ---- Central towers: Jesus (crossing) with the cross, four Evangelists, Mary over the apse with her star ----
  const RY = G + 0.2;
  const jt = centralTower(gp, CX, RY, 0, 0.66, 0.06, NEW);
  box(gp, '#f4f2ec', CX, jt, 0, 0.012, 0.09, 0.012);
  box(gp, '#f4f2ec', CX, jt + 0.05, 0, 0.06, 0.012, 0.012);
  box(gp, '#f4f2ec', CX, jt + 0.05, 0, 0.012, 0.012, 0.06);
  add(gp, SPH(8), mat('#bfe3ff', { emissive: '#7cc4ff' }), CX, jt + 0.056, 0, 0.022, 0.022, 0.022);
  for (const [dx, dz, sym] of [[-0.075, 0.075, '#f4f2ec'], [0.075, 0.075, '#d4a72c'], [-0.075, -0.075, '#c0392b'], [0.075, -0.075, '#f4f2ec']] as const) {
    const t = centralTower(gp, CX + dx, RY, dz, 0.48, 0.032, NEW);
    add(gp, SPH(8), mat(sym), CX + dx, t + 0.012, dz, 0.026, 0.03, 0.026);
  }
  const mt = centralTower(gp, -0.13, RY, 0, 0.5, 0.045, NEW);
  const star = new THREE.Group(); star.position.set(-0.13, mt + 0.03, 0); gp.add(star);
  add(star, SPH(8), mat('#e0f2ff', { emissive: '#bae6fd' }), 0, 0, 0, 0.022, 0.022, 0.022);
  // 12-pointed star: spikes along the icosahedron's vertex directions
  const ico = new THREE.IcosahedronGeometry(1, 0).getAttribute('position');
  const seen = new Set<string>(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < ico.count; i++) {
    const d = new THREE.Vector3().fromBufferAttribute(ico, i).normalize(), key = d.toArray().map(v => v.toFixed(2)).join();
    if (seen.has(key)) continue;
    seen.add(key);
    const m = add(star, CONE(5), mat('#e0f2ff', { emissive: '#bae6fd' }), d.x * 0.03, d.y * 0.03, d.z * 0.03, 0.012, 0.04, 0.012);
    m.quaternion.setFromUnitVectors(up, d);
  }

  // ---- Tower crane over the Glory side ----
  const kx = 0.3, kz = -0.27, KH = 0.86, Y = '#e8b730', s2 = 0.014;
  for (const [ox, oz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) rod(gp, [kx + ox * s2, G, kz + oz * s2], [kx + ox * s2, G + KH, kz + oz * s2], 0.0022, Y, 4);
  for (let i = 0; i < 13; i++) {
    const y0 = G + i * (KH / 13), y1 = y0 + KH / 13;
    rod(gp, [kx - s2, y0, kz + s2], [kx + s2, y1, kz + s2], 0.0014, Y, 3);
    rod(gp, [kx - s2, y0, kz - s2], [kx - s2, y1, kz + s2], 0.0014, Y, 3);
  }
  box(gp, '#3f3f46', kx, G + KH, kz, 0.04, 0.03, 0.04);
  rod(gp, [kx + 0.06, G + KH + 0.03, kz], [kx - 0.42, G + KH + 0.03, kz], 0.004, Y, 4);
  rod(gp, [kx + 0.06, G + KH + 0.01, kz], [kx - 0.42, G + KH + 0.03, kz], 0.0025, Y, 4);
  rod(gp, [kx, G + KH + 0.08, kz], [kx - 0.3, G + KH + 0.03, kz], 0.0012, '#52525b', 3);
  rod(gp, [kx, G + KH + 0.08, kz], [kx + 0.08, G + KH + 0.03, kz], 0.0012, '#52525b', 3);
  rod(gp, [kx, G + KH + 0.015, kz], [kx, G + KH + 0.08, kz], 0.003, Y, 4);
  box(gp, '#9ca3af', kx + 0.08, G + KH + 0.005, kz, 0.04, 0.025, 0.03);
  // Trolley on the jib, hoist cable and hook block
  box(gp, '#3f3f46', kx - 0.22, G + KH + 0.018, kz, 0.018, 0.01, 0.014);
  rod(gp, [kx - 0.222, G + KH + 0.02, kz], [kx - 0.222, G + KH - 0.1, kz], 0.0028, '#3f3f46', 4);
  rod(gp, [kx - 0.218, G + KH + 0.02, kz], [kx - 0.218, G + KH - 0.1, kz], 0.0028, '#3f3f46', 4);
  box(gp, '#e8b730', kx - 0.22, G + KH - 0.11, kz, 0.014, 0.012, 0.01);
  rod(gp, [kx - 0.22, G + KH - 0.11, kz], [kx - 0.22, G + KH - 0.125, kz], 0.002, '#27272a', 4);

  // Street trees, people
  for (const [x, z] of [[-0.3, 0.3], [-0.36, 0.1], [0.36, 0.2], [0.38, -0.05], [-0.36, -0.2], [-0.2, -0.38], [0.15, -0.4], [-0.15, 0.4], [0.3, 0.4]] as const) {
    if (Math.hypot(x, z) > 0.47) continue;
    cyl(gp, '#6b5340', x, G, z, 0.005, 0.04, 5);
    add(gp, SPH(8), mat('#5d8a3f'), x, G + 0.055, z, 0.05, 0.04, 0.05);
  }
  for (let i = 0; i < 10; i++) {
    const x = -0.25 + hash3(i, 2, 9) * 0.5, z = 0.27 + hash3(i, 7, 1) * 0.08;
    person(gp, x, G, z, 0.026, ['#1e3a8a', '#b91c1c', '#f8fafc', '#166534', '#334155'][i % 5]);
  }
};

// =========================================================================================================
// Hagia Sophia — shallow 40-window dome, cascading semi-domes, buttresses, ochre plaster, four pencil minarets
// =========================================================================================================
/** Half dome bulging towards yaw (outward), radius R, height H. */
function halfDome(p: THREE.Object3D, c: string, x: number, y: number, z: number, R: number, H: number, yaw: number): void {
  const geo = g('sacred-halfdome', () => new THREE.SphereGeometry(1, 14, 6, 0, Math.PI, 0, Math.PI / 2));
  add(p, geo, mat(c), x, y, z, R, H, R, yaw);
}

function minaret(p: THREE.Object3D, x: number, z: number, r0: number, top: number, balc: number[], low: string, high: string, G: number): void {
  const STN = '#ece6da', LEAD = '#7d848c';
  box(p, STN, x, G, z, r0 * 3, 0.05, r0 * 3);
  box(p, shade(STN, 0.92), x, G + 0.05, z, r0 * 3.2, 0.008, r0 * 3.2);
  let y = G + 0.058;
  const capY = top - 0.1;
  balc.forEach((b, i) => {
    const rr = r0 * (1 - i * 0.12);
    ngon(p, i === 0 ? low : high, x, y, z, rr, b - y, 16);
    add(p, CONE(12), mat(STN), x, b - 0.008, z, rr * 3.4, 0.016, rr * 3.4, 0, Math.PI);
    cyl(p, STN, x, b, z, rr * 1.75, 0.005, 12);
    cyl(p, shade(STN, 1.03), x, b + 0.005, z, rr * 1.65, 0.01, 12);
    y = b + 0.015;
  });
  const rr = r0 * (1 - balc.length * 0.12);
  ngon(p, high, x, y, z, rr, capY - y, 16);
  cyl(p, STN, x, capY - 0.004, z, rr * 1.15, 0.006, 12);
  cone(p, LEAD, x, capY, z, rr * 1.12, 0.1, 12);
  rod(p, [x, top - 0.005, z], [x, top + 0.02, z], 0.0018, GOLD, 4);
  add(p, SPH(6), mat(GOLD), x, top + 0.008, z, 0.006, 0.006, 0.006);
}

const hagiasophia: Builder = (gp, r) => {
  const PL = r.color ?? '#d8a48a', PL2 = shade(PL, 0.9), LEAD = '#8e959c', STN = '#ebe3d4', G = 0.022;
  // Sultanahmet plaza: stone paving, garden lawns, cypresses
  island(gp, 0.5, () => 0.001, '#d6cdbd', (x, _y, z) => {
    const rr = Math.hypot(x, z);
    if (rr > 0.34 && fbm(x * 6, 1, z * 6) > 0.5) return hash3(Math.floor(x * 50), 1, Math.floor(z * 50)) > 0.5 ? '#6f9a50' : '#65904a';
    return (Math.floor(x * 30) + Math.floor(z * 30)) % 2 ? '#dbd2c2' : '#d2c8b6';
  }, { rings: 22, segs: 64, base: 0.02, side: () => '#9a8f7e' });

  // Outer mass, narthex & exonarthex (west), lead aisle roofs
  const BH = 0.13;
  box(gp, PL, -0.01, G, 0, 0.5, BH, 0.44);
  box(gp, STN, -0.01, G + BH - 0.006, 0, 0.505, 0.008, 0.445);
  hipRoof(gp, [[-0.25, -0.21], [0.23, -0.21], [0.23, 0.21], [-0.25, 0.21]], G + BH, 0.025, 0.8, LEAD);
  box(gp, PL2, -0.29, G, 0, 0.06, 0.1, 0.42);
  hipRoof(gp, [[-0.32, -0.21], [-0.26, -0.21], [-0.26, 0.21], [-0.32, 0.21]], G + 0.1, 0.018, 0.6, LEAD);
  box(gp, PL, -0.34, G, 0, 0.04, 0.065, 0.4);
  for (const sz of [1, -1]) {
    wallWindows(gp, sz > 0 ? [-0.26, 0.22] : [0.24, -0.22], sz > 0 ? [0.24, 0.22] : [-0.26, -0.22], [G + 0.025, G + 0.08], 0.034, 0.014, 0.028, STN, '#3a3530');
  }
  wallWindows(gp, [0.24, 0.22], [0.24, -0.22], [G + 0.03, G + 0.08], 0.04, 0.014, 0.028, STN, '#3a3530');
  wallWindows(gp, [-0.36, -0.2], [-0.36, 0.2], [G + 0.02], 0.04, 0.014, 0.03, STN, '#3a3530');

  // Central square tower with great tympanum arches (north & south) full of windows
  const CB = 0.25;
  box(gp, PL, 0, G, 0, 0.24, CB, 0.24);
  for (const sz of [1, -1]) {
    const ry = sz > 0 ? 0 : Math.PI;
    arch(gp, PL, 0, G + 0.09, sz * 0.125, 0.25, 0.25, 0.02, ry);
    arch(gp, '#c8643c', 0, G + 0.11, sz * 0.1355, 0.2, 0.21, 0, ry);
    for (let row = 0; row < 3; row++) for (let i = 0; i < 7 - row * 2; i++) {
      const x = (i - (6 - row * 2) / 2) * 0.026, y = G + 0.15 + row * 0.05;
      win(gp, x, y, sz * 0.1357, 0.014, 0.03, ry, '', '#2f2a26');
    }
  }
  // Massive north/south buttress towers
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    tbox(gp, 0.07, 0.13, 0.055, 0.05, 0.27, PL2, sx * 0.13, G, sz * 0.25, 0, -sz * 0.045);
    box(gp, STN, sx * 0.13, G + 0.27, sz * 0.205, 0.058, 0.008, 0.055);
  }
  // Semi-domes cascading east & west, with exedrae and the apse
  for (const sx of [-1, 1]) {
    const yaw = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
    box(gp, PL, sx * 0.16, G, 0, 0.08, 0.2, 0.24);
    halfDome(gp, LEAD, sx * 0.12, G + 0.2, 0, 0.12, 0.08, yaw);
    cyl(gp, PL, sx * 0.12, G + 0.19, 0, 0.122, 0.012, 20);
    for (const dz of [-1, 1]) {
      const ex = sx * 0.19, ez = dz * 0.07, ey = yaw + dz * sx * -Math.PI / 4;
      cyl(gp, PL, ex, G + 0.12, ez, 0.055, 0.05, 12);
      halfDome(gp, LEAD, ex, G + 0.17, ez, 0.055, 0.04, ey);
    }
  }
  cyl(gp, PL, 0.25, G, 0, 0.05, 0.13, 12);
  halfDome(gp, LEAD, 0.25, G + 0.13, 0, 0.05, 0.035, Math.PI / 2);
  // Corner domes
  for (const [x, z] of [[-0.2, 0.16], [0.18, 0.16], [-0.2, -0.16], [0.18, -0.16]] as const) {
    cyl(gp, PL, x, G + BH, z, 0.035, 0.02, 10);
    plathe(gp, [[0.037, 0], [0.032, 0.015], [0.018, 0.026], [0, 0.03]], LEAD, undefined, x, G + BH + 0.02, z, 12, true);
  }
  // Drum: ring of 40 windows between buttress piers, shallow ribbed lead dome
  const DY = G + CB;
  cyl(gp, STN, 0, DY, 0, 0.132, 0.008, 40);
  cyl(gp, '#2f3238', 0, DY + 0.008, 0, 0.122, 0.03, 40);
  for (let k = 0; k < 40; k++) {
    const a = (k / 40) * TAU;
    box(gp, PL, Math.sin(a) * 0.124, DY + 0.008, Math.cos(a) * 0.124, 0.009, 0.032, 0.012, a);
  }
  cyl(gp, PL, 0, DY + 0.038, 0, 0.13, 0.006, 40);
  const dpts: [number, number][] = [];
  for (let i = 0; i <= 8; i++) { const t = (i / 8) * Math.PI / 2; dpts.push([0.128 * Math.cos(t), 0.08 * Math.sin(t)]); }
  plathe(gp, dpts, LEAD, (_x, y) => (y > 0.074 ? '#a3aab2' : null), 0, DY + 0.044, 0, 40, true);
  rod(gp, [0, DY + 0.12, 0], [0, DY + 0.15, 0], 0.003, GOLD, 4);
  add(gp, SPH(6), mat(GOLD), 0, DY + 0.135, 0, 0.012, 0.012, 0.012);

  // Four minarets: Sinan's twin west towers, Mehmed II's red-brick SE, Bayezid II's slender NE
  minaret(gp, -0.36, 0.27, 0.021, G + 0.56, [G + 0.36, G + 0.46], STN, STN, G);
  minaret(gp, -0.36, -0.27, 0.021, G + 0.56, [G + 0.36, G + 0.46], STN, STN, G);
  minaret(gp, 0.31, 0.26, 0.017, G + 0.53, [G + 0.42], '#a8583a', STN, G);
  minaret(gp, 0.31, -0.26, 0.015, G + 0.5, [G + 0.4], STN, STN, G);

  // Ottoman tombs & ablution fountain to the south, cypresses, visitors
  for (const [x, rr] of [[0.06, 0.04], [0.17, 0.035]] as const) {
    ngon(gp, STN, x, G, 0.34, rr, 0.06, 8);
    cyl(gp, PL2, x, G + 0.06, 0.34, rr * 0.8, 0.012, 8);
    plathe(gp, [[rr * 0.82, 0], [rr * 0.7, rr * 0.4], [rr * 0.4, rr * 0.7], [0, rr * 0.8]], LEAD, undefined, x, G + 0.072, 0.34, 12, true);
  }
  ngon(gp, STN, -0.17, G, 0.33, 0.03, 0.04, 8);
  plathe(gp, [[0.05, 0], [0.03, 0.02], [0, 0.026]], LEAD, undefined, -0.17, G + 0.04, 0.33, 8, true);
  for (const [x, z] of [[-0.42, 0.1], [-0.44, -0.08], [0.42, 0.05], [0.4, -0.12], [-0.08, 0.42], [0.3, 0.36], [-0.3, -0.38], [0.1, -0.42]] as const) {
    cyl(gp, '#5b4a3a', x, G, z, 0.004, 0.015, 5);
    plathe(gp, [[0.012, 0], [0.016, 0.03], [0.012, 0.07], [0.005, 0.1], [0, 0.11]], '#2f5a3a', undefined, x, G + 0.012, z, 7, true);
  }
  for (let i = 0; i < 12; i++) {
    const a = hash3(i, 9, 2) * TAU, rr = 0.36 + hash3(i, 1, 4) * 0.08;
    person(gp, Math.cos(a) * rr, G, Math.sin(a) * rr, 0.026, ['#1e3a8a', '#b91c1c', '#f8fafc', '#166534', '#334155'][i % 5]);
  }
};

// =========================================================================================================
// Neuschwanstein — white Romanesque Revival palace on a forested crag, slender slate-capped towers, brick gatehouse
// =========================================================================================================
/** Triangular gable wall (unit: base 1 wide, apex 1 high, 1 thick), faces ±z before rotation. */
const gableWallGeo = () => g('sacred-gablewall', () => {
  const s = new THREE.Shape([new THREE.Vector2(-0.5, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 1)]);
  const eg = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5);
  eg.computeVertexNormals();
  return eg;
});
const gableWall = (p: THREE.Object3D, c: string, x: number, y: number, z: number, w: number, h: number, t: number, ry = 0) =>
  add(p, gableWallGeo(), mat(c), x, y, z, w, h, t, ry);

/** Crenellation: merlons along P→Q. */
function crenel(p: THREE.Object3D, c: string, P: [number, number], Q: [number, number], y: number, h: number, t: number, step: number): void {
  const dx = Q[0] - P[0], dz = Q[1] - P[1], L = Math.hypot(dx, dz), n = Math.max(1, Math.round(L / step)), ry = Math.atan2(dx, dz) - Math.PI / 2;
  for (let i = 0; i < n; i++) {
    const t0 = (i + 0.5) / n;
    box(p, c, P[0] + dx * t0, y, P[1] + dz * t0, (L / n) * 0.55, h, t, ry);
  }
}

/** Round castle turret: shaft, corbelled gallery, windows, slender slate cone with gilt finial. */
function turret(p: THREE.Object3D, x: number, y: number, z: number, r: number, h: number, rh: number, wall: string, roof: string, win0 = 2): number {
  cyl(p, wall, x, y, z, r, h, 12);
  cyl(p, shade(wall, 0.93), x, y + h - 0.012, z, r * 1.18, 0.012, 12);
  cyl(p, wall, x, y + h, z, r * 1.18, 0.014, 12);
  for (let k = 0; k < win0; k++) {
    const a = 0.6 + (k / win0) * TAU;
    win(p, x + Math.sin(a) * r * 1.18, y + h + 0.002, z + Math.cos(a) * r * 1.18, r * 0.45, 0.01, a, '', '#3a3f4a');
  }
  for (let k = 0; k < 2; k++) {
    const a = 0.6 + (k + 0.5) * Math.PI;
    win(p, x + Math.sin(a) * r, y + h * 0.55, z + Math.cos(a) * r, r * 0.4, Math.min(0.025, h * 0.15), a, '', '#3a3f4a');
  }
  const top = y + h + 0.014;
  cone(p, roof, x, top, z, r * 1.25, rh, 12);
  rod(p, [x, top + rh - 0.005, z], [x, top + rh + 0.022, z], 0.0016, GOLD, 4);
  return top + rh;
}

const neuschwanstein: Builder = (gp, r) => {
  const WH = r.color ?? '#eae4d6', WH2 = shade(WH, 0.9), SL = mix(String(r.roof ?? '#4a6a9a'), '#8794a3', 0.5), BR = '#b86a4e';
  const FR = '#cfc6b4', GL = '#3a3f4a', TOP = 0.16, B0 = 0.02, GY = B0 + TOP;
  const sq = (x: number, z: number) => Math.pow(Math.pow(Math.abs(x) / 0.4, 4) + Math.pow(Math.abs(z) / 0.19, 4), 0.25);
  const lake = (x: number, z: number) => Math.hypot((x + 0.24) / 1.3, z - 0.36) < 0.13;
  const h: HFn = (x, z) => {
    if (lake(x, z)) return -0.004;
    const d = sq(x, z), crag = TOP * (1 - sstep(0.9, 1.6, d));
    const rough = d > 0.92 ? (fbm(x * 9, 3, z * 9) - 0.5) * 0.05 * Math.min(1, (d - 0.92) * 4) : 0;
    const alps = 0.3 * sstep(-0.24, -0.46, z) * (0.55 + 0.45 * ridged(x * 4 + 3, z * 4, 3)) * sstep(0.95, 1.2, d);
    return Math.max(0, crag + rough + alps);
  };
  island(gp, 0.5, h, '#4a7a3e', (x, y, z, _nx, ny) => {
    if (lake(x, z) && y < B0 + 0.004) return ripple('#3f86ad')(x, y, z, 0, 1, 0);
    if (z < -0.22 && y > B0 + 0.24) return ny > 0.55 ? '#f4f6f8' : '#dfe5ea';
    if (sq(x, z) < 0.92) return (Math.floor(x * 40) + Math.floor(z * 40)) % 2 ? '#bdb6a8' : '#b3ab9c';
    if (ny < 0.7) return hash3(Math.floor(x * 50), Math.floor(y * 50), Math.floor(z * 50)) > 0.5 ? '#8c857a' : '#7b746a';
    if (z < -0.22 && y > B0 + 0.15) return '#8a8f86';
    return fbm(x * 12, 2, z * 12) > 0.5 ? '#3f6e38' : '#4f8245';
  }, { rings: 40, segs: 96, base: B0, side: strataSide(['#7b746a', '#6b655c', '#857e72']) });

  // Forest on the slopes (spruce), a few deciduous blobs
  const on = onGround(h, B0);
  scatter(150, 7, (x, z, i) => {
    const d = sq(x, z), y = on(x, z);
    if (d < 1.0 || lake(x, z) || Math.hypot(x, z) > 0.47 || y > B0 + 0.2 || (z < -0.24 && y > B0 + 0.12)) return;
    if (i % 4 === 0) add(gp, SPH(6), mat(i % 8 ? '#4f8a3f' : '#6d9a45'), x, y + 0.03, z, 0.05, 0.05, 0.05);
    else pine(gp, x, y, z, 0.05 + hash3(i, 3, 3) * 0.03, i % 3 ? '#2f5e3f' : '#36694a');
  }, 0.48);

  // Rock podium under the whole castle (masonry plinth growing out of the crag)
  box(gp, '#a39b8d', -0.12, GY - 0.05, 0, 0.42, 0.05, 0.2);
  box(gp, '#a39b8d', 0.24, GY - 0.05, 0, 0.16, 0.05, 0.2);

  // ---- Palas: five-storey white block, steep slate roof, west gable with oriel turrets ----
  const PX0 = -0.31, PX1 = -0.07, PZ = 0.07, PH = 0.27;
  box(gp, WH, (PX0 + PX1) / 2, GY, 0, PX1 - PX0, PH, PZ * 2);
  box(gp, WH2, (PX0 + PX1) / 2, GY, 0, PX1 - PX0 + 0.006, 0.03, PZ * 2 + 0.006);
  for (const yy of [0.1, 0.19]) box(gp, FR, (PX0 + PX1) / 2, GY + yy, 0, PX1 - PX0 + 0.004, 0.004, PZ * 2 + 0.004);
  box(gp, FR, (PX0 + PX1) / 2, GY + PH - 0.006, 0, PX1 - PX0 + 0.008, 0.006, PZ * 2 + 0.008);
  const ys = [GY + 0.04, GY + 0.075, GY + 0.12, GY + 0.155, GY + 0.205, GY + 0.235];
  for (const sz of [1, -1]) {
    const P: [number, number] = sz > 0 ? [PX0, PZ] : [PX1, -PZ], Q: [number, number] = sz > 0 ? [PX1, PZ] : [PX0, -PZ];
    wallWindows(gp, P, Q, ys, 0.024, 0.008, 0.02, FR, GL);
  }
  wallWindows(gp, [PX0, -PZ], [PX0, PZ], ys, 0.028, 0.008, 0.02, FR, GL);
  // Singers' hall balcony on the front
  box(gp, FR, -0.19, GY + 0.19, PZ + 0.008, 0.1, 0.004, 0.016);
  for (let i = 0; i <= 8; i++) box(gp, FR, -0.24 + i * 0.0125, GY + 0.194, PZ + 0.015, 0.002, 0.012, 0.002);
  // Steep roof with dormers and stepped west gable
  const RH = 0.13, RY = GY + PH;
  gable(gp, PX1 - PX0 - 0.004, RH, PZ * 2 + 0.012, SL, (PX0 + PX1) / 2 + 0.002, RY, 0);
  gableWall(gp, WH, PX0 + 0.004, RY, 0, PZ * 2, RH + 0.01, 0.012, Math.PI / 2);
  win(gp, PX0 - 0.003, RY + 0.02, 0, 0.02, 0.04, -Math.PI / 2, FR, GL);
  box(gp, WH, PX0 + 0.004, RY + RH + 0.005, 0, 0.012, 0.03, 0.012);
  add(gp, SPH(6), mat(GOLD), PX0 + 0.004, RY + RH + 0.04, 0, 0.012, 0.016, 0.012);
  gableWall(gp, WH, PX1 - 0.004, RY, 0, PZ * 2, RH, 0.01, Math.PI / 2);
  for (const sz of [1, -1]) for (let i = 0; i < 4; i++) {
    const x = PX0 + 0.04 + i * 0.05, z = sz * (PZ - 0.012), ry = sz > 0 ? 0 : Math.PI;
    box(gp, WH, x, RY, z, 0.022, 0.035, 0.024);
    gable(gp, 0.026, 0.02, 0.028, SL, x, RY + 0.035, z, Math.PI / 2);
    win(gp, x, RY + 0.008, z + sz * 0.0125, 0.01, 0.018, ry, '', GL);
  }
  // Oriel turrets on the palas corners & the slender front spire tower rising from the roof
  turret(gp, PX0 + 0.004, GY + 0.12, PZ, 0.018, 0.2, 0.07, WH, SL);
  turret(gp, PX1 - 0.01, GY + 0.16, PZ + 0.002, 0.016, 0.17, 0.06, WH, SL);
  turret(gp, -0.17, GY + 0.22, PZ - 0.004, 0.02, 0.19, 0.1, WH, SL);
  // North (stair) tower: tallest, at the back-west corner
  turret(gp, -0.25, GY, -PZ - 0.03, 0.032, 0.46, 0.15, WH, SL, 4);
  for (const yy of [0.1, 0.2, 0.3, 0.38]) win(gp, -0.25 + 0.032 * Math.sin(-0.9), GY + yy, -PZ - 0.03 + 0.032 * Math.cos(-0.9), 0.009, 0.022, -0.9, '', GL);

  // ---- Connecting building & Knights' House (lower, east of the palas) ----
  box(gp, WH, 0.03, GY, -0.01, 0.2, 0.19, 0.11);
  box(gp, WH2, 0.03, GY, -0.01, 0.204, 0.03, 0.114);
  gable(gp, 0.2, 0.08, 0.12, SL, 0.03, GY + 0.19, -0.01);
  wallWindows(gp, [-0.07, 0.045], [0.13, 0.045], [GY + 0.05, GY + 0.1, GY + 0.145], 0.026, 0.008, 0.022, FR, GL);
  for (let i = 0; i < 3; i++) {
    const x = -0.03 + i * 0.05;
    box(gp, WH, x, GY + 0.19, 0.036, 0.022, 0.03, 0.02);
    gable(gp, 0.024, 0.018, 0.026, SL, x, GY + 0.22, 0.036, Math.PI / 2);
    win(gp, x, GY + 0.196, 0.0465, 0.01, 0.016, 0, '', GL);
  }
  // Square tower (Viereckturm) with octagonal crenellated top
  const SX = 0.15, SZ = -0.03;
  box(gp, WH, SX, GY, SZ, 0.065, 0.32, 0.065);
  box(gp, FR, SX, GY + 0.32, SZ, 0.072, 0.008, 0.072);
  ngon(gp, WH, SX, GY + 0.328, SZ, 0.04, 0.055, 8);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU;
    win(gp, SX + Math.sin(a) * 0.037, GY + 0.34, SZ + Math.cos(a) * 0.037, 0.009, 0.022, a, '', GL);
    box(gp, WH, SX + Math.sin(a) * 0.036, GY + 0.383, SZ + Math.cos(a) * 0.036, 0.016, 0.012, 0.008, a);
  }
  cone(gp, SL, SX, GY + 0.383, SZ, 0.028, 0.08, 8);
  rod(gp, [SX, GY + 0.46, SZ], [SX, GY + 0.48, SZ], 0.0016, GOLD, 4);
  wallWindows(gp, [SX - 0.0325, SZ + 0.0325], [SX + 0.0325, SZ + 0.0325], [GY + 0.06, GY + 0.13, GY + 0.2, GY + 0.27], 0.03, 0.009, 0.024, FR, GL);
  wallWindows(gp, [SX - 0.0325, SZ - 0.0325], [SX - 0.0325, SZ + 0.0325], [GY + 0.13, GY + 0.2, GY + 0.27], 0.03, 0.009, 0.024, FR, GL);

  // ---- Lower courtyard walls & red-brick gatehouse with white corner turrets ----
  for (const sz of [1, -1]) {
    box(gp, WH2, 0.2, GY, sz * 0.085, 0.1, 0.07, 0.016);
    crenel(gp, WH2, [0.15, sz * 0.085], [0.25, sz * 0.085], GY + 0.07, 0.014, 0.016, 0.014);
  }
  const GX = 0.29;
  box(gp, BR, GX, GY, 0, 0.1, 0.15, 0.17);
  box(gp, WH, GX, GY, 0, 0.104, 0.025, 0.174);
  for (const yy of [0.06, 0.1]) wallWindows(gp, [GX - 0.05, 0.085], [GX + 0.05, 0.085], [GY + yy], 0.025, 0.008, 0.018, WH, GL);
  gable(gp, 0.1, 0.06, 0.172, SL, GX, GY + 0.15, 0, 0);
  box(gp, BR, GX - 0.03, GY + 0.15, 0, 0.04, 0.04, 0.05);
  gable(gp, 0.042, 0.03, 0.052, SL, GX - 0.03, GY + 0.19, 0, Math.PI / 2);
  arch(gp, '#2b2622', GX + 0.051, GY, 0, 0.04, 0.07, 0, Math.PI / 2);
  for (const sz of [1, -1]) {
    const tx = GX + 0.045, tz = sz * 0.08;
    cyl(gp, WH, tx, GY, tz, 0.022, 0.2, 12);
    cyl(gp, WH, tx, GY + 0.2, tz, 0.026, 0.02, 12);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      box(gp, WH, tx + Math.sin(a) * 0.023, GY + 0.22, tz + Math.cos(a) * 0.023, 0.009, 0.012, 0.006, a);
    }
    for (const yy of [0.07, 0.14]) win(gp, tx + 0.022, GY + yy, tz, 0.007, 0.018, Math.PI / 2, '', GL);
  }
  // Flag on the palas
  rod(gp, [PX1 - 0.02, RY + RH - 0.01, 0], [PX1 - 0.02, RY + RH + 0.06, 0], 0.0018, '#d4d4d8', 4);
  box(gp, '#2563eb', PX1 - 0.002, RY + RH + 0.04, 0, 0.034, 0.02, 0.002);
  box(gp, '#f8fafc', PX1 - 0.002, RY + RH + 0.04, 0.0012, 0.034, 0.006, 0.001);
};

// =========================================================================================================
// Moscow Kremlin — swallow-tail brick walls, Spasskaya clock tower with ruby star, Senate dome, golden Cathedral Square
// =========================================================================================================
const merlonGeo = () => g('sacred-merlon', () => {
  const s = new THREE.Shape([[-0.5, 0], [0.5, 0], [0.5, 1], [0, 0.62], [-0.5, 1]].map(([a, b]) => new THREE.Vector2(a, b)));
  const eg = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5);
  eg.computeVertexNormals();
  return eg;
});
const starGeo = () => g('sacred-star5', () => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, rr = i % 2 ? 0.2 : 0.5; pts.push(new THREE.Vector2(Math.sin(a) * rr, Math.cos(a) * rr)); }
  const eg = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 0.18, bevelEnabled: false }).translate(0, 0, -0.09);
  eg.computeVertexNormals();
  return eg;
});
const discGeo = () => g('sacred-disc', () => new THREE.CircleGeometry(0.5, 16));

/** Ruby Kremlin star (two crossed glowing stars so it reads from any side). */
function rubyStar(p: THREE.Object3D, x: number, y: number, z: number, s: number): void {
  for (const ry of [0, Math.PI / 2]) add(p, starGeo(), mat('#e0244a', { emissive: '#b3122e' }), x, y, z, s, s, s, ry);
  add(p, CONE(6), mat(GOLD), x, y - s * 0.55, z, s * 0.25, s * 0.25, s * 0.25);
}

const kremlin: Builder = (gp, r) => {
  const RED = r.color ?? '#b5473a', RD2 = shade(RED, 0.85), GRN = String(r.roof ?? '#3f6a4a'), WS = '#efe9dc', G = 0.022, B0 = 0.02;
  const A: [number, number] = [-0.36, 0.25], B: [number, number] = [0.34, 0.25], E: [number, number] = [0.1, -0.32], C: [number, number] = [-0.36, -0.36];
  const PLAN = [A, B, E, C];
  const inside = (x: number, z: number) => {
    for (let i = 0; i < 4; i++) {
      const [px, pz] = PLAN[i], [qx, qz] = PLAN[(i + 1) % 4];
      if ((qx - px) * (z - pz) - (qz - pz) * (x - px) > 0) return false;
    }
    return true;
  };
  // Ground: Red Square cobbles (front), Moskva embankment & river (left), lawns and paving inside
  island(gp, 0.5, () => 0.001, '#7b746c', (x, _y, z) => {
    if (x < -0.42) return ripple('#3b7ea6')(x, 0, z, 0, 1, 0);
    if (x < -0.395) return '#c9c2b4';
    if (x < -0.385) return '#55585c';
    if (inside(x, z)) {
      if (fbm(x * 8, 4, z * 8) > 0.52) return hash3(Math.floor(x * 50), 2, Math.floor(z * 50)) > 0.5 ? '#5f8f45' : '#6a9a4c';
      return (Math.floor(x * 36) + Math.floor(z * 36)) % 2 ? '#d8d0c0' : '#cfc6b4';
    }
    if (z > 0.27) return (Math.floor(x * 60) + Math.floor(z * 60)) % 2 ? '#6f6760' : '#7e756c';
    return hash3(Math.floor(x * 40), 3, Math.floor(z * 40)) > 0.5 ? '#5a8a42' : '#64944a';
  }, { rings: 24, segs: 72, base: B0, side: () => '#6b655c' });

  // ---- Walls with swallow-tail merlons ----
  const WH = 0.075, WT = 0.022;
  for (let i = 0; i < 4; i++) {
    const P = PLAN[i], Q = PLAN[(i + 1) % 4], dx = Q[0] - P[0], dz = Q[1] - P[1], L = Math.hypot(dx, dz), ry = Math.atan2(dx, dz) - Math.PI / 2;
    const cx = (P[0] + Q[0]) / 2, cz = (P[1] + Q[1]) / 2;
    box(gp, RED, cx, G, cz, L, WH, WT, ry);
    box(gp, RD2, cx, G, cz, L + 0.004, 0.012, WT + 0.006, ry);
    const n = Math.round(L / 0.021);
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      add(gp, merlonGeo(), mat(RED), P[0] + dx * t, G + WH, P[1] + dz * t, 0.012, 0.022, WT * 0.8, ry);
    }
    // Loophole slits on the outer face
    const nx = dz / L, nz = -dx / L;
    for (let k = 1; k < n / 3; k++) {
      const t = k / (n / 3);
      box(gp, '#5a2620', P[0] + dx * t + nx * 0.0115, G + 0.04, P[1] + dz * t + nz * 0.0115, 0.004, 0.012, 0.001, ry);
    }
  }

  /** Square wall tower: brick shaft, white-stone trims, machicolation, stepped upper tiers, green tent, optional star. */
  const sqTower = (x: number, z: number, w: number, h: number, ry: number, up: number, th: number, star: boolean, gate = false) => {
    box(gp, RED, x, G, z, w, h, w, ry);
    box(gp, WS, x, G + h * 0.55, z, w + 0.004, 0.005, w + 0.004, ry);
    box(gp, RD2, x, G + h, z, w + 0.01, 0.012, w + 0.01, ry);
    for (let k = 0; k < 4; k++) {
      const a = ry + (k / 4) * TAU, dx = Math.sin(a), dz = Math.cos(a);
      for (const o of [-0.3, 0, 0.3]) add(gp, merlonGeo(), mat(RED), x + dx * (w / 2 + 0.003) + dz * o * w, G + h + 0.012, z + dz * (w / 2 + 0.003) - dx * o * w, 0.01, 0.016, 0.006, a);
      win(gp, x + dx * (w / 2), G + h * 0.72, z + dz * (w / 2), w * 0.18, h * 0.12, a, WS, '#2f1d1a');
      if (gate && k % 2 === 0) win(gp, x + dx * (w / 2), G, z + dz * (w / 2), w * 0.4, h * 0.3, a, WS, '#231815');
    }
    let y = G + h + 0.012;
    box(gp, RED, x, y, z, w * 0.72, up, w * 0.72, ry);
    box(gp, WS, x, y + up, z, w * 0.76, 0.005, w * 0.76, ry);
    y += up + 0.005;
    add(gp, CONE(4), mat(GRN), x, y + th / 2, z, w * 0.72 * 1.42, th, w * 0.72 * 1.42, ry + Math.PI / 4);
    y += th;
    if (star) rubyStar(gp, x, y + 0.03, z, 0.04);
    else { rod(gp, [x, y - 0.01, z], [x, y + 0.025, z], 0.0018, GOLD, 4); add(gp, SPH(6), mat(GOLD), x, y + 0.012, z, 0.008, 0.008, 0.008); }
  };
  /** Round corner tower: battered drum, machicolated crown, octagonal lantern, green tent. */
  const rTower = (x: number, z: number, rr: number, h: number, th: number, star: boolean) => {
    plathe(gp, [[rr * 1.12, 0], [rr, h * 0.25], [rr, h]], RED, (_x, y) => (Math.abs(y - h * 0.25) < 0.004 ? WS : null), x, G, z, 16, true);
    cyl(gp, RD2, x, G + h, z, rr * 1.12, 0.014, 16);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU;
      add(gp, merlonGeo(), mat(RED), x + Math.sin(a) * rr * 1.05, G + h + 0.014, z + Math.cos(a) * rr * 1.05, 0.012, 0.018, 0.006, a);
    }
    for (const yy of [0.3, 0.55, 0.8]) for (const a of [0.2, -1.2, 1.6]) win(gp, x + Math.sin(a) * rr, G + h * yy, z + Math.cos(a) * rr, 0.008, 0.016, a, '', '#2f1d1a');
    let y = G + h + 0.014;
    ngon(gp, RED, x, y, z, rr * 0.7, 0.05, 8);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; win(gp, x + Math.sin(a) * rr * 0.65, y + 0.012, z + Math.cos(a) * rr * 0.65, 0.008, 0.02, a, WS, '#2f1d1a'); }
    y += 0.05;
    cyl(gp, WS, x, y, z, rr * 0.74, 0.005, 8);
    tent(gp, 8, rr * 0.7, 0.002, th, GRN, (_x, py) => (frac(py * 60) < 0.18 ? shade(GRN, 1.25) : null), x, y + 0.005, z, 1, 6);
    y += th + 0.005;
    if (star) rubyStar(gp, x, y + 0.03, z, 0.04);
    else { rod(gp, [x, y - 0.01, z], [x, y + 0.025, z], 0.0018, GOLD, 4); add(gp, SPH(6), mat(GOLD), x, y + 0.012, z, 0.008, 0.008, 0.008); }
  };

  // Corner towers
  rTower(A[0], A[1], 0.04, 0.17, 0.12, false);   // Beklemishevskaya
  rTower(B[0], B[1], 0.045, 0.16, 0.1, false);   // Corner Arsenal
  rTower(C[0], C[1], 0.045, 0.17, 0.11, true);   // Vodovzvodnaya
  sqTower(E[0], E[1], 0.06, 0.13, Math.atan2(E[0] - B[0], E[1] - B[1]), 0.05, 0.1, true); // Borovitskaya
  // Red Square wall: Senate & Nikolskaya towers
  sqTower(0.12, 0.25, 0.045, 0.1, 0, 0.03, 0.08, false);
  sqTower(0.25, 0.25, 0.055, 0.14, 0, 0.06, 0.12, true, true);
  // River wall towers
  sqTower(-0.36, 0.06, 0.05, 0.11, 0, 0.035, 0.08, false, true);
  sqTower(-0.36, -0.14, 0.045, 0.1, 0, 0.03, 0.08, false);
  // Troitskaya (back)
  const tx = (B[0] + E[0]) / 2, tz = (B[1] + E[1]) / 2;
  sqTower(tx, tz, 0.065, 0.17, Math.atan2(E[0] - B[0], E[1] - B[1]), 0.07, 0.14, true, true);
  sqTower((E[0] + C[0]) / 2, (E[1] + C[1]) / 2, 0.045, 0.1, Math.atan2(C[0] - E[0], C[1] - E[1]), 0.03, 0.08, false);

  // ---- Spasskaya Tower: gate base, clock tier with four dials, octagonal belfry, tent & ruby star ----
  const SX = -0.07, SZ = 0.255;
  box(gp, RED, SX, G, SZ, 0.09, 0.2, 0.09);
  box(gp, WS, SX, G + 0.2, SZ, 0.096, 0.008, 0.096);
  box(gp, WS, SX, G + 0.13, SZ, 0.094, 0.005, 0.094);
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU, dx = Math.sin(a), dz = Math.cos(a);
    if (k % 2 === 0) win(gp, SX + dx * 0.045, G, SZ + dz * 0.045, 0.032, 0.07, a, WS, '#231815');
    win(gp, SX + dx * 0.045, G + 0.15, SZ + dz * 0.045, 0.012, 0.03, a, WS, '#2f1d1a');
  }
  for (const [ox, oz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    cyl(gp, WS, SX + ox * 0.042, G + 0.2, SZ + oz * 0.042, 0.007, 0.03, 6);
    cone(gp, GRN, SX + ox * 0.042, G + 0.23, SZ + oz * 0.042, 0.008, 0.035, 6);
    add(gp, SPH(6), mat(GOLD), SX + ox * 0.042, G + 0.268, SZ + oz * 0.042, 0.007, 0.007, 0.007);
  }
  const CY = G + 0.208;
  box(gp, RED, SX, CY, SZ, 0.068, 0.1, 0.068);
  box(gp, WS, SX, CY + 0.1, SZ, 0.074, 0.008, 0.074);
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU, dx = Math.sin(a), dz = Math.cos(a), cx = SX + dx * 0.0345, cz = SZ + dz * 0.0345, y = CY + 0.05;
    add(gp, discGeo(), mat(GOLD), cx, y, cz, 0.056, 0.056, 1, a);
    add(gp, discGeo(), mat('#1d2230'), cx + dx * 0.0008, y, cz + dz * 0.0008, 0.046, 0.046, 1, a);
    box(gp, GOLD, cx + dx * 0.0016, y, cz + dz * 0.0016, 0.003, 0.018, 0.001, a);
    box(gp, GOLD, cx + dx * 0.0016 + Math.cos(a) * 0.005, y - 0.003, cz + dz * 0.0016 - Math.sin(a) * 0.005, 0.012, 0.0025, 0.001, a);
  }
  for (const [ox, oz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    cone(gp, WS, SX + ox * 0.03, CY + 0.108, SZ + oz * 0.03, 0.006, 0.03, 6);
    add(gp, SPH(6), mat(GOLD), SX + ox * 0.03, CY + 0.14, SZ + oz * 0.03, 0.006, 0.006, 0.006);
  }
  let y = CY + 0.108;
  ngon(gp, RED, SX, y, SZ, 0.03, 0.055, 8);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU;
    win(gp, SX + Math.sin(a) * 0.028, y + 0.01, SZ + Math.cos(a) * 0.028, 0.012, 0.035, a, WS, '#2a1c19');
  }
  y += 0.055;
  cyl(gp, WS, SX, y, SZ, 0.033, 0.006, 8);
  ngon(gp, RED, SX, y + 0.006, SZ, 0.024, 0.03, 8);
  cyl(gp, WS, SX, y + 0.036, SZ, 0.027, 0.005, 8);
  y += 0.041;
  tent(gp, 8, 0.025, 0.003, 0.13, '#3c7a52', (px, py, pz) => {
    const u = frac(Math.atan2(px, pz) / TAU * 8);
    return frac(py * 50) < 0.2 ? '#e7dfc8' : u < 0.12 || u > 0.88 ? GOLD : null;
  }, SX, y, SZ, 2, 8);
  y += 0.13;
  add(gp, SPH(8), mat(GOLD), SX, y + 0.006, SZ, 0.014, 0.014, 0.014);
  rubyStar(gp, SX, y + 0.042, SZ, 0.055);

  // ---- Senate: triangular yellow palace, green roof, white rotunda with green dome & flag ----
  const SY2 = '#e9d79a';
  const tri: [number, number][] = [[0.0, 0.16], [0.24, 0.16], [0.16, -0.06]];
  prism(gp, tri, G, 0.075, SY2);
  box(gp, WS, 0.12, G + 0.073, 0.16, 0.24, 0.004, 0.004);
  hipRoof(gp, tri, G + 0.075, 0.03, 0.55, GRN);
  wallWindows(gp, [0.0, 0.16], [0.24, 0.16], [G + 0.02, G + 0.05], 0.02, 0.008, 0.016, WS, '#3b3a3a');
  cyl(gp, SY2, 0.12, G, 0.15, 0.032, 0.13, 16);
  for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; cyl(gp, WS, 0.12 + Math.sin(a) * 0.033, G + 0.075, 0.15 + Math.cos(a) * 0.033, 0.0035, 0.045, 5); }
  plathe(gp, smooth([[0.035, 0], [0.03, 0.018], [0.018, 0.03], [0, 0.034]], 6), GRN, undefined, 0.12, G + 0.13, 0.15, 16, true);
  rod(gp, [0.12, G + 0.16, 0.15], [0.12, G + 0.24, 0.15], 0.0016, '#d4d4d8', 4);
  for (const [c, dy] of [['#f8fafc', 0.012], ['#1d4ed8', 0], ['#dc2626', -0.012]] as const) box(gp, c, 0.143, G + 0.214 + dy, 0.15, 0.044, 0.012, 0.002);

  // ---- Grand Kremlin Palace above the river ----
  const PC = '#efe3c2';
  box(gp, PC, -0.26, G, -0.08, 0.1, 0.12, 0.26);
  box(gp, WS, -0.26, G + 0.055, -0.08, 0.104, 0.005, 0.264);
  hipRoof(gp, [[-0.31, -0.21], [-0.21, -0.21], [-0.21, 0.05], [-0.31, 0.05]], G + 0.12, 0.03, 0.6, '#4f8a6a');
  wallWindows(gp, [-0.31, 0.05], [-0.31, -0.21], [G + 0.025, G + 0.075, G + 0.098], 0.02, 0.009, 0.018, WS, '#3b3a3a');
  wallWindows(gp, [-0.21, 0.05], [-0.31, 0.05], [G + 0.025, G + 0.075, G + 0.098], 0.02, 0.009, 0.018, WS, '#3b3a3a');
  cyl(gp, PC, -0.26, G + 0.12, -0.08, 0.03, 0.02, 12);
  plathe(gp, [[0.032, 0], [0.028, 0.02], [0.015, 0.032], [0, 0.036]], '#4f8a6a', undefined, -0.26, G + 0.14, -0.08, 12, true);
  add(gp, SPH(8), mat(GOLD), -0.26, G + 0.185, -0.08, 0.018, 0.022, 0.018);

  // ---- Cathedral Square: Ivan the Great bell tower, Assumption & Annunciation cathedrals ----
  const IX = -0.08, IZ = -0.12;
  let iy = G;
  for (const [rr, hh] of [[0.04, 0.12], [0.034, 0.09], [0.028, 0.08], [0.022, 0.06]] as const) {
    ngon(gp, WS, IX, iy, IZ, rr, hh, 8);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; win(gp, IX + Math.sin(a) * rr * 0.92, iy + hh * 0.35, IZ + Math.cos(a) * rr * 0.92, rr * 0.4, hh * 0.45, a, '', '#3d3a36'); }
    cyl(gp, '#ddd5c2', IX, iy + hh, IZ, rr * 1.12, 0.006, 8);
    iy += hh + 0.006;
  }
  cyl(gp, WS, IX, iy, IZ, 0.017, 0.03, 12);
  onion(gp, IX, iy + 0.03, IZ, 0.024, 0.06, () => GOLD, 14);
  box(gp, GOLD, IX, iy + 0.088, IZ, 0.003, 0.03, 0.003);
  box(gp, GOLD, IX, iy + 0.106, IZ, 0.016, 0.003, 0.003);
  box(gp, WS, IX + 0.05, G, IZ, 0.05, 0.13, 0.04);
  ngon(gp, WS, IX + 0.05, G + 0.13, IZ, 0.014, 0.025, 8);
  onion(gp, IX + 0.05, G + 0.155, IZ, 0.017, 0.04, () => GOLD, 12);
  const cathedral = (x: number, z: number, w: number, h: number, domes: [number, number, number][], dc: (u: number, t: number) => string) => {
    box(gp, WS, x, G, z, w, h, w * 0.85);
    for (const ox of [-1, 0, 1]) {
      const ax = x + ox * w * 0.33;
      for (const sz of [1, -1]) {
        arch(gp, WS, ax, G + h - 0.004, z + sz * w * 0.425, w * 0.33, 0.03, 0.006, 0);
        win(gp, ax, G + h * 0.45, z + sz * w * 0.425, w * 0.08, h * 0.3, sz > 0 ? 0 : Math.PI, '', '#3d3a36');
      }
    }
    hipRoof(gp, [[x - w / 2, z - w * 0.425], [x + w / 2, z - w * 0.425], [x + w / 2, z + w * 0.425], [x - w / 2, z + w * 0.425]], G + h, 0.012, 0.7, '#9aa3ab');
    for (const [ox, oz, s] of domes) {
      cyl(gp, WS, x + ox, G + h + 0.006, z + oz, 0.012 * s, 0.035 * s, 10);
      onion(gp, x + ox, G + h + 0.006 + 0.035 * s, z + oz, 0.016 * s, 0.038 * s, dc, 12);
      box(gp, GOLD, x + ox, G + h + 0.006 + 0.073 * s, z + oz, 0.002, 0.018 * s, 0.002);
    }
  };
  const five = (d: number): [number, number, number][] => [[0, 0, 1.3], [-d, -d, 0.9], [d, -d, 0.9], [-d, d, 0.9], [d, d, 0.9]];
  cathedral(-0.11, 0.06, 0.1, 0.1, five(0.03), () => GOLD);                      // Assumption
  cathedral(-0.16, -0.04, 0.06, 0.08, [[0, 0, 1], [-0.018, -0.018, 0.7], [0.018, 0.018, 0.7]], () => GOLD); // Annunciation
  cathedral(0.0, 0.03, 0.08, 0.09, five(0.024), (_u, t) => (t > 0.5 ? GOLD : '#c9ced4')); // Archangel

  // ---- Red Square: Lenin's Mausoleum, firs along the wall; embankment road ----
  const MX = 0.0, MZ = 0.33;
  for (const [w, d, hh, c] of [[0.11, 0.06, 0.016, '#5a2622'], [0.08, 0.045, 0.012, '#2f2a2b'], [0.06, 0.035, 0.01, '#5a2622'], [0.04, 0.025, 0.012, '#2f2a2b']] as const) {
    let yy = G;
    for (const [w2] of [[0.11], [0.08], [0.06]] as const) if (w2 > w) yy += w2 === 0.11 ? 0.016 : w2 === 0.08 ? 0.012 : 0.01;
    box(gp, c, MX, yy, MZ, w, hh, d);
  }
  for (let i = 0; i < 9; i++) {
    const x = -0.3 + i * 0.075;
    if (Math.abs(x - SX) < 0.06 || Math.abs(x - 0.25) < 0.04) continue;
    cyl(gp, '#5b4030', x, G, 0.285, 0.004, 0.02, 5);
    cone(gp, '#2f5a46', x, G + 0.01, 0.285, 0.016, 0.06, 7);
  }
  for (let i = 0; i < 12; i++) {
    const x = -0.3 + hash3(i, 4, 1) * 0.6, z = 0.3 + hash3(i, 5, 2) * 0.12;
    if (Math.hypot(x, z) > 0.46 || (Math.abs(x - MX) < 0.07 && Math.abs(z - MZ) < 0.045)) continue;
    person(gp, x, G, z, 0.024, ['#1e3a8a', '#b91c1c', '#f8fafc', '#166534', '#334155'][i % 5]);
  }
  // Trees inside the walls (Taynitsky garden)
  scatter(40, 11, (x, z, i) => {
    if (!inside(x, z) || Math.hypot(x - 0.12, z - 0.05) < 0.16 || Math.hypot(x + 0.1, z + 0.02) < 0.15 || (x < -0.2 && z > -0.22 && z < 0.06)) return;
    const dIn = Math.min(...PLAN.map((P, k) => { const Q = PLAN[(k + 1) % 4]; const dx = Q[0] - P[0], dz = Q[1] - P[1], L = Math.hypot(dx, dz); return Math.abs(dz * (x - P[0]) - dx * (z - P[1])) / L; }));
    if (dIn < 0.04) return;
    add(gp, SPH(6), mat(i % 3 ? '#4f8a3f' : '#5f9a48'), x, G + 0.03, z, 0.045, 0.045, 0.045);
    cyl(gp, '#6b5340', x, G, z, 0.004, 0.015, 5);
  }, 0.36);
  // Cars on the embankment
  for (let i = 0; i < 4; i++) box(gp, ['#e5e7eb', '#1f2937', '#b91c1c', '#2563eb'][i], -0.405, G - 0.001, -0.25 + i * 0.13, 0.008, 0.007, 0.018);
};

export const SACRED: Record<string, Builder> = { basil, windmill, sagrada, hagiasophia, neuschwanstein, kremlin };
