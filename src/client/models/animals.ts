import * as THREE from 'three';
import {
  type Builder, type Paint, type V3, num, mat, add, ellip, cyl, sweep, tube, slab, eye, paintFaces,
  shade, mix, fbm, worley, hash3,
} from './prims.ts';

// Organic animal miniatures: lofted torsos/necks/limbs, species heads, painted coat patterns (stripes,
// rosettes, giraffe patches, countershading), glossy cartoon eyes. Front is +z, feet on y=0, ~1 unit long.

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

/** Eye placed at (x,y,z) turned by yaw (side-facing eyes for grazers & birds). */
function eyeAt(p: THREE.Object3D, x: number, y: number, z: number, r: number, yaw = 0, iris = '#1f2937'): void {
  const e = new THREE.Group();
  e.position.set(x, y, z);
  e.rotation.y = yaw;
  p.add(e);
  eye(e, 0, 0, 0, r, iris);
}

/** Small glossy bead eye (bears, birds, reptiles). */
function bead(p: THREE.Object3D, x: number, y: number, z: number, r: number, c = '#111827'): void {
  ellip(p, c, x, y, z, r);
  ellip(p, '#ffffff', x + r * 0.3, y + r * 0.35, z + r * 0.7, r * 0.28).material = mat('#ffffff', { emissive: '#ffffff' });
}

/** Leaf-shaped ear / fin slab placed and oriented in model space. */
function leaf(p: THREE.Object3D, c: string, x: number, y: number, z: number, w: number, h: number, rot: V3, d = 0.012, tip = 0.15): THREE.Mesh {
  const m = slab(p, [[-w, 0], [-w * 0.9, h * 0.45], [-w * tip, h], [w * tip, h], [w * 0.9, h * 0.45], [w, 0]], d, c, d * 0.35);
  m.position.set(x, y, z);
  m.rotation.set(rot[0], rot[1], rot[2]);
  return m;
}

const BELLY = (c: string) => mix(c, '#fff7ea', 0.55);
const furNoise = (c: string, amt = 0.08): Paint => (x, y, z) => shade(c, 1 - amt + hash3(x * 91, y * 91, z * 91) * amt * 2);

// ---- Coat pattern painters ----
const counter = (belly: string, t = -0.42): Paint => (_x, _y, _z, _nx, ny) => (ny < t ? belly : null);

function tigerCoat(c: string, axis: 'z' | 'y'): Paint {
  return (x, y, z, _nx, ny) => {
    if (ny < -0.5) return '#f7efe1';
    const v = (axis === 'z' ? z * 46 : y * 52) + fbm(x * 9, y * 9, z * 9) * 6 + Math.abs(x) * 8;
    return Math.sin(v) > 0.5 ? '#1c1917' : ny < -0.25 ? mix(c, '#f7efe1', 0.5) : null;
  };
}
function zebraCoat(axis: 'z' | 'y' | 'n'): Paint {
  return (x, y, z) => {
    const v = axis === 'z' ? z * 58 + y * 10 : axis === 'y' ? y * 78 : (y - z * 0.6) * 66;
    return Math.sin(v + fbm(x * 8, y * 8, z * 8) * 3.2) > 0.05 ? '#141414' : null;
  };
}
function giraffeCoat(s = 13): Paint {
  return (x, y, z) => {
    const [f1, f2] = worley(x * s, y * s, z * s);
    return f2 - f1 < 0.17 ? '#f3e2bf' : (hash3(Math.floor(x * s), Math.floor(y * s), 3) > 0.5 ? '#9a4f22' : '#a85b28');
  };
}
function rosetteCoat(ring: string, fill: string | null, s = 21, belly = '#f5efe4'): Paint {
  return (x, y, z, _nx, ny) => {
    if (ny < -0.5) return belly;
    const [f1] = worley(x * s, y * s, z * s);
    if (f1 > 0.17 && f1 < 0.3) return ring;
    return f1 <= 0.17 && fill ? fill : null;
  };
}

// ---- Quadruped anatomy ----
type HeadKind = 'cat' | 'horse' | 'bovine' | 'hippo' | 'elephant' | 'bear' | 'fox' | 'deer' | 'camel' | 'llama';
interface QuadSpec {
  L: number; H: number; k: number; neck: number; neckA?: number; head: HeadKind; c: string;
  feet: 'paw' | 'hoof' | 'pad'; foot?: string; stride?: number;
  body?: Paint; leg?: Paint; neckP?: Paint; headP?: Paint; flat?: boolean; lr?: number; ll?: number;
}
interface QuadFrame { hp: V3; by: number; bh: number; bw: number; zf: number; zb: number; legLen: number }

function quadruped(gp: THREE.Group, q: QuadSpec): QuadFrame {
  const { L, H, k, c } = q;
  const legLen = (0.17 + H * 0.36) * (q.ll ?? 1);
  const bh = 0.115 * k * (0.82 + H * 0.3);
  const bw = 0.1 * k;
  const by = legLen + bh * 0.7;
  const Lb = 0.6 * L, zb = -Lb / 2, zf = Lb / 2;
  // Torso: rump → haunch → belly → ribcage → chest → withers
  sweep(gp, [
    { p: [0, by + bh * 0.08, zb - 0.045], w: bw * 0.34, h: bh * 0.38 },
    { p: [0, by + bh * 0.14, zb + 0.03], w: bw * 0.9, h: bh * 0.9 },
    { p: [0, by - bh * 0.02, zb + Lb * 0.32], w: bw * 0.96, h: bh * 0.94 },
    { p: [0, by + bh * 0.04, zb + Lb * 0.62], w: bw, h: bh },
    { p: [0, by + bh * 0.14, zf - 0.02], w: bw * 0.9, h: bh * 1.02 },
    { p: [0, by + bh * 0.34, zf + 0.05], w: bw * 0.42, h: bh * 0.5 },
  ], c, { radial: 30, sub: 9, paint: q.body, squash: 0.92 });

  // Neck
  const ang = q.neckA ?? Math.min(1.22, 0.42 + q.neck * 0.56);
  const len = 0.09 + q.neck * 0.34;
  const s0: V3 = [0, by + bh * 0.42, zf - 0.035];
  const hp: V3 = [0, s0[1] + Math.sin(ang) * len, s0[2] + Math.cos(ang) * len];
  const nw = 0.072 * k * (q.neck > 1 ? 0.62 : 1);
  sweep(gp, [
    { p: s0, w: bw * 0.82, h: bh * 0.78 },
    { p: [0, (s0[1] + hp[1]) / 2 + 0.005, (s0[2] + hp[2]) / 2], w: nw, h: nw * 1.15 },
    { p: hp, w: nw * 0.78, h: nw * 0.9 },
  ], c, { radial: 18, sub: 7, paint: q.neckP ?? q.body });

  // Legs with shoulder & thigh musculature
  const lx = bw * 0.6, legR = 0.03 * k * (0.86 + H * 0.2) * (q.lr ?? 1);
  const st = q.stride ?? 0.03;
  const zfl = zf - 0.07, zbl = zb + 0.09;
  for (const sx of [-1, 1]) {
    const fz = zfl + sx * st, bz = zbl - sx * st;
    pblob(gp, c, sx * lx * 0.78, by - bh * 0.12, zfl, legR * 1.45, bh * 0.66, legR * 1.9, q.body, [0, 0, 0], 20);
    tube(gp, [[sx * lx, by - bh * 0.2, zfl], [sx * lx, legLen * 0.52, (zfl + fz) / 2 + 0.01], [sx * lx, 0.045, fz]], legR * 1.3, legR * 0.72, c, { paint: q.leg });
    pblob(gp, c, sx * lx * 0.74, by - bh * 0.12, zbl + 0.02, legR * 1.7, bh * 0.82, legR * 2.5, q.body, [0, 0, 0], 20);
    tube(gp, [[sx * lx, by - bh * 0.2, zbl], [sx * lx, legLen * 0.6, bz + 0.05], [sx * lx, legLen * 0.27, bz - 0.025], [sx * lx, 0.045, bz]], legR * 1.5, legR * 0.72, c, { paint: q.leg });
    for (const z of [fz, bz]) {
      const fc = q.foot ?? shade(c, 0.6);
      if (q.feet === 'paw') pblob(gp, q.foot ?? c, sx * lx, legR * 0.62, z + legR * 0.5, legR * 1.12, legR * 0.66, legR * 1.45);
      else if (q.feet === 'hoof') { cyl(gp, fc, sx * lx, 0, z, legR * 0.82, 0.05, 12); }
      else {
        // Padded column foot with three toenails
        pblob(gp, shade(c, 0.92), sx * lx, 0.03, z + 0.004, legR * 1.12, 0.032, legR * 1.12, undefined, [0, 0, 0], 20);
        for (const a of [-0.6, 0, 0.6]) ellip(gp, '#ece6d8', sx * lx + Math.sin(a) * legR * 0.95, 0.018, z + Math.cos(a) * legR * 0.98, legR * 0.32, 0.018, legR * 0.22, a);
      }
    }
  }
  return { hp, by, bh, bw, zf, zb, legLen };
}

/** Tail as a tapering tube from the rump; `curl` lifts the tip (cats) and `len` scales it. */
function tail(gp: THREE.Group, f: QuadFrame, c: string, len = 1, r = 0.016, curl = 0.3, paint?: Paint): V3 {
  const z0 = f.zb - 0.03, y0 = f.by + f.bh * 0.45;
  const tip: V3 = [0.03, y0 - 0.24 * len + curl * 0.22 * len, z0 - 0.2 * len];
  tube(gp, [[0, y0, z0], [0, y0 - 0.06 * len, z0 - 0.09 * len], [0.015, y0 - 0.17 * len, z0 - 0.15 * len + curl * 0.02], tip], r, r * 0.6, c, { paint });
  return tip;
}

interface HeadOpts { muzzle?: string; nose?: string; iris?: string; ear?: string; earIn?: string; paint?: Paint; s?: number }

/** Species head attached at hp (back of skull), looking along +z with a slight downward muzzle. */
function head(gp: THREE.Group, kind: HeadKind, hp: V3, c: string, o: HeadOpts = {}): void {
  const [x, y, z] = hp;
  const s = o.s ?? 1;
  const muz = o.muzzle ?? mix(c, '#fff4e6', 0.45);
  const earIn = o.earIn ?? shade(c, 0.55);
  switch (kind) {
    case 'cat': {
      pblob(gp, c, x, y, z + 0.02 * s, 0.084 * s, 0.077 * s, 0.084 * s, o.paint);
      pblob(gp, c, x, y - 0.012 * s, z + 0.065 * s, 0.07 * s, 0.05 * s, 0.05 * s, o.paint);
      ellip(gp, muz, x, y - 0.034 * s, z + 0.09 * s, 0.05 * s, 0.035 * s, 0.04 * s);
      ellip(gp, muz, x, y - 0.058 * s, z + 0.075 * s, 0.03 * s, 0.018 * s, 0.03 * s);
      ellip(gp, o.nose ?? '#8b4a3c', x, y - 0.014 * s, z + 0.124 * s, 0.017 * s, 0.011 * s, 0.01 * s);
      for (const sx of [-1, 1]) {
        eyeAt(gp, x + sx * 0.037 * s, y + 0.018 * s, z + 0.083 * s, 0.0145 * s, sx * 0.3, o.iris ?? '#b7791f');
        ellip(gp, c, x + sx * 0.058 * s, y + 0.066 * s, z - 0.004 * s, 0.03 * s, 0.032 * s, 0.013 * s, 0, 0, -sx * 0.4);
        ellip(gp, earIn, x + sx * 0.058 * s, y + 0.064 * s, z + 0.006 * s, 0.019 * s, 0.021 * s, 0.008 * s, 0, 0, -sx * 0.4);
      }
      break;
    }
    case 'bear': {
      pblob(gp, c, x, y, z + 0.03 * s, 0.098 * s, 0.088 * s, 0.092 * s, o.paint);
      ellip(gp, muz, x, y - 0.03 * s, z + 0.105 * s, 0.047 * s, 0.04 * s, 0.05 * s);
      ellip(gp, o.nose ?? '#1c1917', x, y - 0.012 * s, z + 0.152 * s, 0.02 * s, 0.014 * s, 0.012 * s);
      for (const sx of [-1, 1]) {
        bead(gp, x + sx * 0.04 * s, y + 0.022 * s, z + 0.1 * s, 0.012 * s);
        ellip(gp, o.ear ?? c, x + sx * 0.07 * s, y + 0.075 * s, z + 0.005 * s, 0.032 * s, 0.03 * s, 0.018 * s);
        ellip(gp, earIn, x + sx * 0.07 * s, y + 0.074 * s, z + 0.016 * s, 0.018 * s, 0.017 * s, 0.008 * s);
      }
      break;
    }
    case 'fox': {
      pblob(gp, c, x, y, z + 0.02 * s, 0.078 * s, 0.068 * s, 0.072 * s, o.paint);
      ellip(gp, muz, x, y - 0.024 * s, z + 0.085 * s, 0.038 * s, 0.03 * s, 0.045 * s);
      ellip(gp, '#1c1917', x, y - 0.012 * s, z + 0.128 * s, 0.014 * s, 0.01 * s, 0.01 * s);
      for (const sx of [-1, 1]) {
        eyeAt(gp, x + sx * 0.034 * s, y + 0.016 * s, z + 0.075 * s, 0.013 * s, sx * 0.25, '#3b1d0e');
        ellip(gp, '#f8fafc', x + sx * 0.04 * s, y + 0.042 * s, z + 0.066 * s, 0.016 * s, 0.009 * s, 0.006 * s);
        leaf(gp, '#f8fafc', x + sx * 0.052 * s, y + 0.045 * s, z - 0.002 * s, 0.03 * s, 0.06 * s, [-0.15, 0, -sx * 0.45], 0.012 * s, 0.25);
        leaf(gp, c, x + sx * 0.052 * s, y + 0.05 * s, z + 0.003 * s, 0.022 * s, 0.045 * s, [-0.15, 0, -sx * 0.45], 0.012 * s, 0.25);
      }
      break;
    }
    case 'hippo': {
      pblob(gp, c, x, y, z, 0.1 * s, 0.085 * s, 0.1 * s, o.paint);
      pblob(gp, c, x, y - 0.035 * s, z + 0.11 * s, 0.112 * s, 0.07 * s, 0.085 * s, o.paint);
      ellip(gp, '#e8a0a0', x, y - 0.068 * s, z + 0.12 * s, 0.1 * s, 0.018 * s, 0.07 * s);
      for (const sx of [-1, 1]) {
        ellip(gp, shade(c, 0.85), x + sx * 0.04 * s, y + 0.03 * s, z + 0.17 * s, 0.022 * s, 0.016 * s, 0.018 * s);
        ellip(gp, '#1c1917', x + sx * 0.04 * s, y + 0.042 * s, z + 0.178 * s, 0.008 * s, 0.006 * s, 0.006 * s);
        ellip(gp, c, x + sx * 0.05 * s, y + 0.07 * s, z + 0.02 * s, 0.026 * s, 0.022 * s, 0.024 * s);
        bead(gp, x + sx * 0.05 * s, y + 0.078 * s, z + 0.038 * s, 0.011 * s);
        ellip(gp, c, x + sx * 0.075 * s, y + 0.085 * s, z - 0.03 * s, 0.014 * s, 0.018 * s, 0.01 * s);
        ellip(gp, '#fffbeb', x + sx * 0.06 * s, y - 0.06 * s, z + 0.18 * s, 0.008 * s, 0.016 * s, 0.008 * s);
      }
      break;
    }
    case 'elephant': {
      pblob(gp, c, x, y + 0.02 * s, z + 0.03 * s, 0.13 * s, 0.135 * s, 0.12 * s, o.paint);
      ellip(gp, c, x, y - 0.03 * s, z + 0.1 * s, 0.07 * s, 0.08 * s, 0.06 * s);
      const trunk: V3[] = [[x, y - 0.03 * s, z + 0.13 * s], [x, y - 0.16 * s, z + 0.18 * s], [x, y - 0.3 * s, z + 0.18 * s], [x, y - 0.4 * s, z + 0.22 * s], [x, y - 0.4 * s, z + 0.27 * s]];
      sweep(gp, trunk.map((p, i) => ({ p, w: (0.048 - i * 0.008) * s })), c, {
        radial: 14, sub: 6, paint: (_x, py) => (Math.sin(py * 260) > 0.6 ? shade(c, 0.86) : null),
      });
      for (const sx of [-1, 1]) {
        tube(gp, [[x + sx * 0.05 * s, y - 0.08 * s, z + 0.11 * s], [x + sx * 0.065 * s, y - 0.17 * s, z + 0.19 * s], [x + sx * 0.055 * s, y - 0.16 * s, z + 0.26 * s]], 0.015 * s, 0.006 * s, '#fffbeb');
        bead(gp, x + sx * 0.085 * s, y + 0.04 * s, z + 0.1 * s, 0.012 * s);
        const ear = slab(gp, [[0, 0.1], [0.1, 0.12], [0.17, 0.06], [0.18, -0.06], [0.12, -0.16], [0.03, -0.2], [0, -0.1]].map(([a, b]) => [a * s, b * s] as [number, number]), 0.014 * s, shade(c, 0.95), 0.004);
        ear.position.set(x + sx * 0.1 * s, y + 0.02 * s, z);
        ear.rotation.set(0, sx > 0 ? -0.55 : Math.PI + 0.55, 0);
      }
      break;
    }
    case 'bovine': {
      pblob(gp, c, x, y, z + 0.03 * s, 0.085 * s, 0.09 * s, 0.09 * s, o.paint, [0, 0, 0], 18, true);
      ellip(gp, shade(c, 0.6), x, y - 0.035 * s, z + 0.11 * s, 0.06 * s, 0.045 * s, 0.04 * s);
      pblob(gp, shade(c, 0.7), x, y - 0.09 * s, z + 0.06 * s, 0.045 * s, 0.06 * s, 0.04 * s, furNoise(shade(c, 0.7), 0.12), [0, 0, 0], 12, true);
      for (const sx of [-1, 1]) {
        tube(gp, [[x + sx * 0.07 * s, y + 0.05 * s, z + 0.02 * s], [x + sx * 0.12 * s, y + 0.06 * s, z + 0.03 * s], [x + sx * 0.125 * s, y + 0.11 * s, z + 0.05 * s]], 0.016 * s, 0.005 * s, '#292524');
        bead(gp, x + sx * 0.055 * s, y + 0.02 * s, z + 0.09 * s, 0.011 * s);
      }
      break;
    }
    case 'horse': case 'deer': case 'camel': case 'llama': {
      const long = kind === 'camel' ? 1.15 : 1;
      sweep(gp, [
        { p: [x, y + 0.012 * s, z - 0.03 * s], w: 0.044 * s, h: 0.052 * s },
        { p: [x, y + 0.004 * s, z + 0.035 * s], w: 0.046 * s, h: 0.052 * s },
        { p: [x, y - 0.03 * s, z + 0.1 * s * long], w: 0.034 * s, h: 0.038 * s },
        { p: [x, y - 0.045 * s, z + 0.14 * s * long], w: 0.031 * s, h: 0.033 * s },
      ], c, { radial: 16, sub: 6, paint: o.paint });
      ellip(gp, muz, x, y - 0.047 * s, z + 0.145 * s * long, 0.033 * s, 0.032 * s, 0.03 * s);
      if (kind === 'camel') ellip(gp, muz, x, y - 0.075 * s, z + 0.14 * s * long, 0.026 * s, 0.014 * s, 0.026 * s);
      for (const sx of [-1, 1]) {
        ellip(gp, '#1c1917', x + sx * 0.016 * s, y - 0.04 * s, z + 0.172 * s * long, 0.006 * s, 0.008 * s, 0.005 * s);
        eyeAt(gp, x + sx * 0.04 * s, y + 0.018 * s, z + 0.02 * s, 0.0125 * s, sx * 1.05, '#2b1a10');
        const eh = kind === 'llama' ? 0.075 : kind === 'camel' ? 0.03 : 0.055;
        leaf(gp, o.ear ?? c, x + sx * 0.03 * s, y + 0.05 * s, z - 0.035 * s, 0.016 * s, eh * s, [-0.25, sx * 0.3, -sx * (kind === 'llama' ? 0.12 : 0.45)], 0.01 * s, kind === 'llama' ? 0.35 : 0.12);
      }
      break;
    }
  }
}

function quadBuilder(gp: THREE.Group, r: Record<string, unknown> & { color?: string }): void {
  const c = r.color!, sp = (r.sp as string) ?? '';
  const L = num(r.L, 1), H = num(r.H, 0.6);
  const belly = BELLY(c);
  const plain = counter(belly);
  let q: QuadSpec = { L, H, k: r.chunky ? 1.35 : 1, neck: num(r.neck, 0.25), head: 'cat', c, feet: 'hoof', body: plain, leg: plain };
  switch (sp) {
    case 'lion': q = { ...q, lr: 1.15, feet: 'paw', foot: shade(c, 0.95) }; break;
    case 'tiger': q = { ...q, lr: 1.15, feet: 'paw', foot: '#f7efe1', body: tigerCoat(c, 'z'), leg: tigerCoat(c, 'y'), neckP: tigerCoat(c, 'y') }; break;
    case 'jaguar': q = { ...q, lr: 1.15, ll: 0.85, feet: 'paw', body: rosetteCoat('#2a1a10', shade(c, 0.82)), leg: rosetteCoat('#2a1a10', null, 26) }; break;
    case 'snowleopard': q = { ...q, feet: 'paw', H: 0.5, body: rosetteCoat('#5b5d63', shade(c, 0.9), 19, '#fbfaf7'), leg: rosetteCoat('#5b5d63', null, 26, '#fbfaf7') }; break;
    case 'zebra': q = { ...q, head: 'horse', neck: 0.55, body: zebraCoat('z'), leg: zebraCoat('y'), neckP: zebraCoat('n'), foot: '#1c1917' }; break;
    case 'giraffe': q = { ...q, head: 'horse', neck: 1.75, neckA: 1.12, L: 0.85, k: 0.95, body: giraffeCoat(), neckP: giraffeCoat(15),
      leg: (x, y, z, nx, ny, nz) => (y < 0.2 ? '#f3e2bf' : giraffeCoat(17)(x, y, z, nx, ny, nz)), foot: '#3f2a1d' }; break;
    case 'elephant': q = { ...q, head: 'elephant', k: 1.5, neck: 0.02, neckA: 0.3, feet: 'pad', stride: 0.02, lr: 1.45, body: furNoise(c, 0.05), leg: furNoise(c, 0.05) }; break;
    case 'hippo': q = { ...q, head: 'hippo', k: 1.55, H: 0.35, ll: 0.62, lr: 1.5, neck: 0.04, neckA: 0.25, feet: 'pad', stride: 0.01, body: counter(mix(c, '#e8a0a0', 0.4), -0.3) }; break;
    case 'camel': q = { ...q, head: 'camel', neck: 0.95, neckA: 0.75, feet: 'pad' }; break;
    case 'llama': q = { ...q, head: 'llama', neck: 1.05, neckA: 1.15, lr: 1.15, body: furNoise(c, 0.07), leg: furNoise(c, 0.07), neckP: furNoise(c, 0.07), foot: '#57534e' }; break;
    case 'bison': q = { ...q, head: 'bovine', k: 1.4, lr: 1.2, ll: 0.85, neck: 0.05, neckA: -0.2, body: furNoise(c, 0.1), leg: furNoise(shade(c, 0.8), 0.1), foot: '#1c1917' }; break;
    case 'reindeer': q = { ...q, head: 'deer', neck: 0.6, neckA: 0.95, neckP: (_x, y) => (y < 0.62 ? '#efe8dc' : null), foot: '#2a2420' }; break;
    case 'redpanda': q = { ...q, head: 'fox', feet: 'paw', foot: '#2a1a14', H: 0.42, neck: 0.15,
      body: (_x, _y, _z, _nx, ny) => (ny < -0.2 ? '#2a1a14' : null), leg: () => '#2a1a14' }; break;
  }
  const f = quadruped(gp, q);
  const [hx, hy, hz] = f.hp;
  switch (sp) {
    case 'lion': {
      const mane = (r.mane as string) ?? shade(c, 0.6);
      // Layered mane clumps framing the face plus a heavy back mass over the neck
      pblob(gp, mane, hx, hy - 0.02, hz - 0.04, 0.13, 0.14, 0.11, furNoise(mane, 0.1), [0, 0, 0], 14, true);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2, rr = 0.1 + (i % 2) * 0.012;
        pblob(gp, shade(mane, 0.92 + (i % 3) * 0.06), hx + Math.cos(a) * rr, hy + 0.005 + Math.sin(a) * rr * 1.05, hz + 0.02 - (i % 2) * 0.012,
          0.04, 0.045, 0.04, undefined, [0, 0, a], 10, true);
      }
      head(gp, 'cat', [hx, hy, hz + 0.03], c, { iris: '#b7791f' });
      const tip = tail(gp, f, c, 1.15, 0.014, 0.25);
      pblob(gp, mane, tip[0], tip[1], tip[2], 0.026, 0.034, 0.026, furNoise(mane, 0.1), [0, 0, 0], 10, true);
      break;
    }
    case 'tiger': case 'jaguar': case 'snowleopard': {
      const hp2 = q.head === 'cat' ? 1 : 1;
      head(gp, 'cat', f.hp, c, { s: hp2, paint: q.body, iris: sp === 'snowleopard' ? '#7aa2b8' : '#c08a1e' });
      const long = sp === 'snowleopard' ? 1.7 : 1.1;
      tail(gp, f, c, long, sp === 'snowleopard' ? 0.028 : 0.016, sp === 'snowleopard' ? 0.9 : 0.35,
        sp === 'tiger' ? (x, y, z) => (Math.sin(z * 70 + y * 50) > 0.45 ? '#1c1917' : null) : q.body);
      break;
    }
    case 'zebra': {
      head(gp, 'horse', f.hp, '#f8fafc', { paint: zebraCoat('y'), muzzle: '#1c1917', ear: '#f8fafc' });
      // Upright striped crest mane
      sweep(gp, [
        { p: [0, f.by + f.bh * 1.05, f.zf - 0.05], w: 0.012, h: 0.02 },
        { p: [0, (f.by + hy) / 2 + 0.06, (f.zf + hz) / 2 - 0.02], w: 0.012, h: 0.035 },
        { p: [0, hy + 0.07, hz - 0.03], w: 0.01, h: 0.025 },
      ], '#141414', { radial: 8, sub: 6, paint: (_x, y, z) => (Math.sin((y - z * 0.6) * 66) > 0.05 ? null : '#f8fafc') });
      tail(gp, f, '#f8fafc', 0.9, 0.012, 0, zebraCoat('y'));
      break;
    }
    case 'giraffe': {
      head(gp, 'horse', f.hp, '#d9a35b', { paint: giraffeCoat(22), muzzle: '#c89058', ear: '#d9a35b' });
      for (const sx of [-1, 1]) {
        tube(gp, [[hx + sx * 0.018, hy + 0.05, hz - 0.02], [hx + sx * 0.024, hy + 0.11, hz - 0.03]], 0.009, 0.008, '#c89058');
        ellip(gp, '#2a1d14', hx + sx * 0.024, hy + 0.118, hz - 0.03, 0.013);
      }
      sweep(gp, [
        { p: [0, f.by + f.bh * 1.05, f.zf - 0.04], w: 0.008, h: 0.014 },
        { p: [0, hy + 0.03, hz - 0.05], w: 0.008, h: 0.014 },
      ], '#7a4520', { radial: 6, sub: 10 });
      const tip = tail(gp, f, '#d9a35b', 1, 0.01, 0);
      pblob(gp, '#2a1d14', tip[0], tip[1] - 0.015, tip[2], 0.016, 0.03, 0.016, undefined, [0, 0, 0], 8, true);
      break;
    }
    case 'elephant': head(gp, 'elephant', f.hp, c, { paint: furNoise(c, 0.05) }); tail(gp, f, c, 0.8, 0.012, 0); break;
    case 'hippo': head(gp, 'hippo', f.hp, c, { paint: counter(mix(c, '#e8a0a0', 0.4), -0.3) }); tail(gp, f, c, 0.35, 0.014, 0.2); break;
    case 'camel': {
      pblob(gp, c, 0, f.by + f.bh * 0.9, f.zb + (f.zf - f.zb) * 0.5, 0.075, 0.11 * num(r.hump, 1), 0.12, plain);
      head(gp, 'camel', f.hp, c, { muzzle: shade(c, 1.08) });
      tail(gp, f, c, 0.7, 0.012, 0);
      break;
    }
    case 'llama': {
      head(gp, 'llama', f.hp, c, { paint: furNoise(c, 0.06), muzzle: shade(c, 0.9) });
      pblob(gp, c, 0, f.by + f.bh * 0.5, f.zb - 0.04, 0.035, 0.05, 0.04, furNoise(c, 0.1), [0.6, 0, 0], 10, true);
      break;
    }
    case 'bison': {
      const dark = shade(c, 0.62);
      // Shaggy shoulder hump & cape
      pblob(gp, dark, 0, f.by + f.bh * 0.55, f.zf - 0.06, f.bw * 1.12, f.bh * 1.25, 0.16, furNoise(dark, 0.14), [0, 0, 0], 16, true);
      pblob(gp, dark, 0, hy + 0.02, hz - 0.03, 0.1, 0.11, 0.08, furNoise(dark, 0.14), [0, 0, 0], 14, true);
      head(gp, 'bovine', [hx, hy, hz + 0.02], dark);
      const tip = tail(gp, f, c, 0.55, 0.01, 0);
      pblob(gp, dark, tip[0], tip[1], tip[2], 0.018, 0.03, 0.018, undefined, [0, 0, 0], 8, true);
      break;
    }
    case 'reindeer': {
      head(gp, 'deer', f.hp, c, { muzzle: '#3f342c' });
      const ant = '#d8c8a0';
      for (const sx of [-1, 1]) {
        const a: V3 = [hx + sx * 0.022, hy + 0.05, hz - 0.03], b: V3 = [hx + sx * 0.08, hy + 0.15, hz - 0.08], cc: V3 = [hx + sx * 0.1, hy + 0.27, hz - 0.03], d: V3 = [hx + sx * 0.07, hy + 0.34, hz + 0.04];
        tube(gp, [a, b, cc, d], 0.011, 0.006, ant);
        tube(gp, [b, [hx + sx * 0.05, hy + 0.2, hz + 0.02]], 0.007, 0.004, ant);
        tube(gp, [cc, [hx + sx * 0.16, hy + 0.32, hz - 0.06]], 0.007, 0.004, ant);
        tube(gp, [a, [hx + sx * 0.03, hy + 0.1, hz + 0.08]], 0.006, 0.004, ant);
      }
      tail(gp, f, '#efe8dc', 0.25, 0.018, 0.4);
      break;
    }
    case 'redpanda': {
      head(gp, 'fox', f.hp, c, { muzzle: '#fbf6ee' });
      const z0 = f.zb - 0.02, y0 = f.by + f.bh * 0.2;
      sweep(gp, [
        { p: [0, y0, z0], w: 0.035 }, { p: [0.02, y0 - 0.04, z0 - 0.12], w: 0.048 },
        { p: [0.05, y0 - 0.02, z0 - 0.26], w: 0.045 }, { p: [0.07, y0 + 0.05, z0 - 0.36], w: 0.03 }, { p: [0.08, y0 + 0.1, z0 - 0.38], w: 0.012 },
      ], c, { radial: 14, sub: 8, flat: true, paint: (_x, _y, z) => (Math.sin((z - z0) * 52) > 0.2 ? '#f0d0a8' : null) });
      break;
    }
    default: head(gp, q.head, f.hp, c); tail(gp, f, c, num(r.tail, 0.6));
  }
}

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
  const face = isGor ? '#3a3a40' : '#c08a6a';
  const fur = furNoise(c, 0.08);
  // Knuckle-walking torso: low rump, broad raised shoulders
  sweep(gp, [
    { p: [0, 0.3, -0.16], w: 0.08, h: 0.08 },
    { p: [0, 0.34, -0.1], w: 0.14, h: 0.13 },
    { p: [0, 0.43, 0.02], w: 0.17, h: 0.15 },
    { p: [0, 0.52, 0.1], w: 0.16, h: 0.13 },
    { p: [0, 0.57, 0.14], w: 0.08, h: 0.06 },
  ], c, { radial: 24, sub: 8, flat: true, paint: isGor ? (x, y, z, nx, ny) => (ny > 0.45 && z < 0.05 ? '#9ca3af' : fur(x, y, z, nx, ny, 0)) : fur });
  // Head: crest, brow ridge, face, muzzle
  const hy = 0.58, hz = 0.2;
  pblob(gp, c, 0, hy + 0.02, hz - 0.02, 0.085, 0.095, 0.085, fur, [0, 0, 0], 16, true);
  if (isGor) ellip(gp, c, 0, hy + 0.09, hz - 0.03, 0.05, 0.05, 0.06);
  ellip(gp, face, 0, hy, hz + 0.045, 0.07, 0.07, 0.04);
  ellip(gp, face, 0, hy + 0.035, hz + 0.065, 0.072, 0.02, 0.03);
  ellip(gp, shade(face, 1.1), 0, hy - 0.03, hz + 0.075, 0.048, 0.035, 0.035);
  for (const sx of [-1, 1]) {
    ellip(gp, '#1c1917', sx * 0.012, hy - 0.016, hz + 0.105, 0.009, 0.007, 0.005);
    bead(gp, sx * 0.028, hy + 0.018, hz + 0.082, 0.01, '#3b1d0e');
    ellip(gp, face, sx * 0.075, hy + 0.01, hz + 0.0, 0.016, 0.02, 0.01);
    if (!isGor) ellip(gp, shade(face, 0.95), sx * 0.07, hy - 0.005, hz + 0.04, 0.03, 0.05, 0.018);
  }
  const arm = isGor ? 1 : 1.18;
  for (const sx of [-1, 1]) {
    // Long arms down to knuckles
    tube(gp, [[sx * 0.16, 0.52, 0.1], [sx * 0.21, 0.3 * arm, 0.16], [sx * 0.2, 0.05, 0.2]], 0.055, 0.04, c, { paint: fur, flat: true });
    pblob(gp, face, sx * 0.2, 0.03, 0.21, 0.04, 0.03, 0.045);
    // Short bent legs
    tube(gp, [[sx * 0.1, 0.32, -0.12], [sx * 0.15, 0.2, -0.05], [sx * 0.13, 0.05, -0.12]], 0.06, 0.042, c, { paint: fur, flat: true });
    pblob(gp, face, sx * 0.13, 0.025, -0.1, 0.04, 0.025, 0.06);
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
  const L = sp === 'polarbear' ? 1.12 : 1;
  const panda = sp === 'panda';
  const blk = (r.patch as string) ?? '#1c1917';
  const pandaBody: Paint = (_x, _y, z) => (z > 0.07 && z < 0.2 ? blk : null);
  const body: Paint = panda ? pandaBody : sp === 'grizzly' ? furNoise(c, 0.08) : counter(shade(c, 0.94));
  const f = quadruped(gp, {
    L, H: 0.42, k: 1.42, neck: sp === 'polarbear' ? 0.35 : 0.12, neckA: 0.35, head: 'bear', c, feet: 'paw', stride: 0.025,
    body, leg: panda ? () => blk : body, foot: panda ? blk : shade(c, 0.7), flat: sp === 'grizzly',
  });
  if (sp === 'grizzly') pblob(gp, c, 0, f.by + f.bh * 0.7, f.zf - 0.06, 0.08, 0.08, 0.1, furNoise(c, 0.08), [0, 0, 0], 14, true);
  head(gp, 'bear', f.hp, c, { ear: panda ? blk : c, earIn: panda ? blk : shade(c, 0.6), muzzle: panda ? '#f5f5f4' : mix(c, '#d6c3a5', 0.35) });
  if (panda) {
    const [hx, hy, hz] = f.hp;
    for (const sx of [-1, 1]) {
      ellip(gp, blk, hx + sx * 0.04, hy + 0.02, hz + 0.105, 0.026, 0.02, 0.012, 0, 0, sx * 0.6);
      bead(gp, hx + sx * 0.04, hy + 0.024, hz + 0.115, 0.009, '#0f0f0f');
    }
    // Bamboo snack
    const bam = '#7cb342';
    tube(gp, [[hx - 0.12, hy - 0.08, hz + 0.18], [hx + 0.14, hy - 0.02, hz + 0.16]], 0.011, 0.011, bam, { paint: (x) => (Math.abs(Math.sin(x * 40)) < 0.12 ? '#558b2f' : null) });
    leaf(gp, '#8bc34a', hx + 0.14, hy - 0.02, hz + 0.16, 0.018, 0.08, [0, 0, -0.9], 0.004, 0.2);
  }
  ellip(gp, c, 0, f.by + f.bh * 0.3, f.zb - 0.04, 0.03, 0.03, 0.025);
};

const HOPPER: Builder = (gp, r) => {
  const c = r.color!, belly = mix(c, '#f5e6d3', 0.6);
  const paint: Paint = (_x, _y, _z, _nx, _ny, nz) => (nz > 0.45 ? belly : null);
  // Upright torso leaning forward
  sweep(gp, [
    { p: [0, 0.2, -0.08], w: 0.09, h: 0.09 }, { p: [0, 0.28, -0.03], w: 0.12, h: 0.12 },
    { p: [0, 0.44, 0.03], w: 0.095, h: 0.09 }, { p: [0, 0.58, 0.07], w: 0.06, h: 0.055 }, { p: [0, 0.64, 0.09], w: 0.045, h: 0.045 },
  ], c, { radial: 22, sub: 8, paint, up: [0, 0, 1] });
  // Joey peeking from the pouch
  pblob(gp, belly, 0, 0.29, 0.085, 0.07, 0.05, 0.03);
  pblob(gp, c, 0, 0.34, 0.1, 0.035, 0.032, 0.03);
  for (const sx of [-1, 1]) { bead(gp, sx * 0.014, 0.35, 0.128, 0.006); leaf(gp, c, sx * 0.022, 0.36, 0.09, 0.009, 0.03, [0, 0, -sx * 0.4], 0.006, 0.2); }
  // Head
  const hy = 0.68, hz = 0.12;
  sweep(gp, [{ p: [0, hy, hz - 0.04], w: 0.045, h: 0.05 }, { p: [0, hy - 0.005, hz + 0.03], w: 0.04, h: 0.042 }, { p: [0, hy - 0.025, hz + 0.1], w: 0.022, h: 0.024 }], c, { radial: 14, sub: 6 });
  ellip(gp, '#2a1d14', 0, hy - 0.02, hz + 0.115, 0.014, 0.01, 0.008);
  for (const sx of [-1, 1]) {
    eyeAt(gp, sx * 0.03, hy + 0.012, hz + 0.02, 0.011, sx * 0.7, '#2b1a10');
    leaf(gp, c, sx * 0.028, hy + 0.035, hz - 0.03, 0.018, 0.075, [-0.2, sx * 0.3, -sx * 0.25], 0.008, 0.2);
    // Big folded hind legs + long feet
    pblob(gp, c, sx * 0.09, 0.2, -0.02, 0.06, 0.12, 0.13, undefined, [0.5, 0, 0]);
    tube(gp, [[sx * 0.1, 0.14, 0.04], [sx * 0.1, 0.06, -0.06], [sx * 0.09, 0.02, -0.04]], 0.03, 0.022, c);
    tube(gp, [[sx * 0.09, 0.018, -0.06], [sx * 0.085, 0.015, 0.13]], 0.022, 0.016, shade(c, 0.85));
    // Small forearms
    tube(gp, [[sx * 0.07, 0.52, 0.08], [sx * 0.08, 0.44, 0.14], [sx * 0.05, 0.4, 0.15]], 0.016, 0.01, c);
  }
  // Thick balancing tail resting on the ground
  sweep(gp, [{ p: [0, 0.18, -0.11], w: 0.05 }, { p: [0, 0.07, -0.25], w: 0.04 }, { p: [0, 0.03, -0.42], w: 0.022 }, { p: [0, 0.03, -0.5], w: 0.01 }], c, { radial: 12, sub: 6 });
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
    if (!small && nz > -0.55 && ((Math.abs(x) / s - 0.07) / 0.04) ** 2 + ((fy - 0.62) / 0.075) ** 2 < 1) return mix(acc, '#fde68a', 0.3);
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
    eyeAt(gp, sx * 0.05 * s, hy + 0.02 * s, hz + 0.065 * s, 0.014 * s, sx * 0.5, small ? '#1c1917' : '#3b2a1e');
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
  const c = r.color!, dark = shade(c, 0.78);
  // Shallow lagoon
  pblob(gp, '#5fb3c9', 0, 0, 0, 0.3, 0.01, 0.26, undefined, [0, 0, 0], 24);
  const by = 0.62;
  const paint: Paint = (x, y, _z, _nx, ny) => (Math.abs(x) > 0.07 && ny > -0.1 && y > by - 0.02 ? (y < by + 0.03 && Math.abs(x) > 0.09 ? '#1c1917' : dark) : null);
  sweep(gp, [
    { p: [0, by + 0.04, -0.22], w: 0.015, h: 0.012 }, { p: [0, by + 0.02, -0.16], w: 0.07, h: 0.05 },
    { p: [0, by, -0.04], w: 0.11, h: 0.09 }, { p: [0, by + 0.02, 0.07], w: 0.09, h: 0.08 }, { p: [0, by + 0.05, 0.13], w: 0.04, h: 0.04 },
  ], c, { radial: 22, sub: 8, paint });
  // S-curved neck and down-bent beak
  sweep(gp, [
    { p: [0, by + 0.05, 0.12], w: 0.032 }, { p: [0, by + 0.18, 0.2], w: 0.022 }, { p: [0, by + 0.32, 0.12], w: 0.02 },
    { p: [0, by + 0.42, 0.08], w: 0.02 }, { p: [0, by + 0.5, 0.12], w: 0.024 },
  ], c, { radial: 12, sub: 8 });
  const hy = by + 0.51, hz = 0.14;
  pblob(gp, c, 0, hy, hz, 0.035, 0.034, 0.042);
  sweep(gp, [{ p: [0, hy - 0.005, hz + 0.03], w: 0.017 }, { p: [0, hy - 0.01, hz + 0.075], w: 0.014 }, { p: [0, hy - 0.05, hz + 0.09], w: 0.008 }],
    '#fde7ef', { radial: 10, sub: 5, paint: (_x, y) => (y < hy - 0.022 ? '#1c1917' : null) });
  for (const sx of [-1, 1]) bead(gp, sx * 0.026, hy + 0.01, hz + 0.018, 0.007, '#fbbf24');
  // Standing leg + tucked leg (classic one-legged pose)
  const leg = '#e86a8a';
  tube(gp, [[0.03, by - 0.06, -0.02], [0.03, 0.32, 0.0], [0.03, 0.01, 0.02]], 0.011, 0.009, leg);
  pblob(gp, leg, 0.03, 0.01, 0.05, 0.03, 0.006, 0.045);
  tube(gp, [[-0.03, by - 0.06, -0.02], [-0.035, 0.36, 0.0], [-0.035, 0.46, -0.16]], 0.011, 0.009, leg);
};

const FLYER: Builder = (gp, r) => {
  const c = r.color!, hd = (r.head as string) ?? '#ffffff';
  const bird = new THREE.Group(); bird.position.y = 0.5; bird.name = 'flap'; gp.add(bird);
  sweep(bird, [
    { p: [0, 0, -0.22], w: 0.03, h: 0.02 }, { p: [0, 0, -0.12], w: 0.075, h: 0.07 },
    { p: [0, 0.01, 0.04], w: 0.09, h: 0.085 }, { p: [0, 0.03, 0.15], w: 0.06, h: 0.06 }, { p: [0, 0.05, 0.2], w: 0.045, h: 0.045 },
  ], c, { radial: 20, sub: 7, paint: (_x, _y, z) => (z > 0.13 ? hd : null) });
  pblob(bird, hd, 0, 0.06, 0.22, 0.055, 0.05, 0.06);
  for (const sx of [-1, 1]) bead(bird, sx * 0.034, 0.075, 0.25, 0.009, '#fbbf24');
  ellip(bird, '#1c1917', 0, 0.075, 0.253, 0.04, 0.008, 0.005);
  // Hooked yellow beak
  sweep(bird, [{ p: [0, 0.06, 0.26], w: 0.018, h: 0.022 }, { p: [0, 0.06, 0.3], w: 0.012, h: 0.016 }, { p: [0, 0.035, 0.32], w: 0.004 }], '#f59e0b', { radial: 10, sub: 5 });
  // Fingered wings & white tail fan
  const wing: [number, number][] = [[0, 0.08], [0.18, 0.1], [0.36, 0.08], [0.5, 0.05], [0.56, 0.02], [0.52, 0.0], [0.57, -0.02], [0.52, -0.04], [0.56, -0.06], [0.48, -0.07], [0.5, -0.1], [0.4, -0.09], [0.3, -0.1], [0.15, -0.08], [0, -0.06]];
  for (const sx of [-1, 1]) {
    const w = slab(bird, wing.map(([a, b]) => [a * sx, b] as [number, number]), 0.016, c, 0.004);
    w.rotation.set(Math.PI / 2, 0, 0);
    w.position.set(sx * 0.06, 0.03, 0.02);
    w.rotation.y = sx * 0.12;
    const tip = slab(bird, [[0.4 * sx, 0.06], [0.56 * sx, 0.02], [0.57 * sx, -0.02], [0.56 * sx, -0.06], [0.5 * sx, -0.1], [0.4 * sx, -0.09]], 0.018, shade(c, 0.7), 0.004);
    tip.rotation.copy(w.rotation); tip.position.copy(w.position); tip.position.y += 0.002;
  }
  const tl = slab(bird, [[-0.02, 0], [0.02, 0], [0.07, -0.12], [0.03, -0.14], [0, -0.13], [-0.03, -0.14], [-0.07, -0.12]], 0.012, hd, 0.003);
  tl.rotation.set(Math.PI / 2, 0, 0); tl.position.set(0, 0, -0.2);
  for (const sx of [-1, 1]) tube(bird, [[sx * 0.03, -0.05, -0.04], [sx * 0.035, -0.08, -0.08]], 0.012, 0.01, '#f59e0b');
};

const ROUNDBIRD: Builder = (gp, r) => {
  const c = r.color!;
  pblob(gp, c, 0, 0.26, -0.02, 0.2, 0.18, 0.24, (x, y, z) => shade(c, 0.86 + hash3(x * 60, y * 60, z * 60) * 0.28), [0, 0, 0], 22, true);
  pblob(gp, c, 0, 0.36, 0.17, 0.085, 0.08, 0.09, (x, y, z) => shade(c, 0.88 + hash3(x * 80, y * 80, z * 80) * 0.24), [0, 0, 0], 16, true);
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
  const c = r.color!;
  const paint: Paint = (x, _y, z, _nx, ny) => {
    if (ny < -0.15) return '#f8fafc';
    if (z > 0.17 && z < 0.27 && Math.abs(x) > 0.05 && Math.sin(z * 260) > 0.75) return shade(c, 0.6);
    return null;
  };
  sweep(gp, [
    { p: [0, 0.2, -0.46], w: 0.012, h: 0.02 }, { p: [0, 0.2, -0.34], w: 0.035, h: 0.05 }, { p: [0, 0.2, -0.1], w: 0.09, h: 0.11 },
    { p: [0, 0.2, 0.12], w: 0.1, h: 0.115 }, { p: [0, 0.19, 0.3], w: 0.07, h: 0.075 }, { p: [0, 0.18, 0.42], w: 0.025, h: 0.03 },
  ], c, { radial: 24, sub: 8, paint });
  leaf(gp, c, 0, 0.3, 0.02, 0.07, 0.17, [0, Math.PI / 2, 0.42], 0.016, 0.04);
  leaf(gp, c, 0, 0.27, -0.33, 0.02, 0.04, [0, Math.PI / 2, 0.5], 0.01, 0.05);
  const tl = slab(gp, [[0, 0.02], [0.06, 0.22], [0.09, 0.22], [0.03, 0.0], [0.06, -0.12], [0.03, -0.12], [0, -0.02]], 0.014, c, 0.004);
  tl.position.set(0, 0.2, -0.44); tl.rotation.set(0, -Math.PI / 2, -0.5);
  for (const sx of [-1, 1]) {
    leaf(gp, shade(c, 0.9), sx * 0.08, 0.14, 0.12, 0.035, 0.16, [-0.35, 0, sx * 2.0], 0.012, 0.15);
    bead(gp, sx * 0.055, 0.22, 0.31, 0.01);
  }
  ellip(gp, '#3f3f46', 0, 0.14, 0.31, 0.045, 0.008, 0.02);
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
    // Sprawling legs
    for (const [z, k] of [[0.14 * L, 1], [-0.15 * L, 1.15]] as const) {
      tube(gp, [[sx * 0.09, y0, z], [sx * 0.16 * k, y0 - 0.01, z + 0.02], [sx * 0.17 * k, 0.015, z + 0.05]], 0.026 * k, 0.018, c, { paint: scales });
      for (const a of [-0.6, 0, 0.6]) tube(gp, [[sx * 0.17 * k, 0.012, z + 0.05], [sx * 0.17 * k + Math.sin(a) * 0.035, 0.008, z + 0.05 + Math.cos(a) * 0.035]], 0.007, 0.004, shade(c, 0.8));
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
