import * as THREE from 'three';
import type { ModelRecipe } from '../../shared/data/types.ts';

// Every model is built from primitives at runtime: ~1 unit tall, base at y=0, "front" facing +z.
const mats = new Map<string, THREE.MeshStandardMaterial>();
export function mat(color: string, opts: { emissive?: string; transparent?: number; metal?: number; flat?: boolean; rough?: number } = {}): THREE.MeshStandardMaterial {
  const k = color + JSON.stringify(opts);
  let m = mats.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.rough ?? 0.72,
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
const SPH = (s = 10) => g('sph' + s, () => new THREE.SphereGeometry(0.5, s, Math.max(4, s * 0.6)));

function add(grp: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0, rx = 0, rz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  grp.add(mesh);
  return mesh;
}
const box = (p: THREE.Object3D, c: string, x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0) => add(p, BOX(), mat(c), x, y + sy / 2, z, sx, sy, sz, ry);
const cyl = (p: THREE.Object3D, c: string, x: number, y: number, z: number, r: number, h: number, s = 8) => add(p, CYL(s), mat(c), x, y + h / 2, z, r * 2, h, r * 2);
const cone = (p: THREE.Object3D, c: string, x: number, y: number, z: number, r: number, h: number, s = 8) => add(p, CONE(s), mat(c), x, y + h / 2, z, r * 2, h, r * 2);
const ball = (p: THREE.Object3D, c: string, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) => add(p, SPH(), mat(c), x, y, z, sx, sy, sz);

function shade(hex: string, f: number): string {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return '#' + c.getHexString();
}

type Builder = (gp: THREE.Group, r: ModelRecipe) => void;
const num = (v: unknown, d: number) => (typeof v === 'number' ? v : d);

const B: Record<string, Builder> = {
  // ---------- landmarks ----------
  lattice: (gp, r) => {
    const c = r.color!;
    const dark = shade(c, 0.78);
    const light = shade(c, 1.15);
    // 4 corner footings + inclined lower legs
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      box(gp, dark, x * 0.24, 0, z * 0.24, 0.09, 0.04, 0.09);
      add(gp, BOX(), mat(c), x * 0.18, 0.2, z * 0.18, 0.065, 0.42, 0.065, 0, z * 0.32, -x * 0.32);
      add(gp, BOX(), mat(c), x * 0.10, 0.5, z * 0.10, 0.05, 0.26, 0.05, 0, z * 0.2, -x * 0.2);
    }
    // Decorative base arches on all 4 sides
    for (const ry of [0, Math.PI / 2]) {
      for (const s of [-0.19, 0.19]) {
        const arch = add(gp, g('latArch', () => new THREE.TorusGeometry(0.11, 0.016, 6, 12, Math.PI)), mat(dark), 0, 0.04, s, 1, 1.15, 1, ry);
        void arch;
      }
    }
    // 1st observation deck
    box(gp, light, 0, 0.36, 0, 0.38, 0.045, 0.38);
    box(gp, dark, 0, 0.405, 0, 0.34, 0.02, 0.34);
    // 2nd observation deck
    box(gp, light, 0, 0.60, 0, 0.24, 0.04, 0.24);
    // Upper tapered spire shaft + cross-bracing rings
    add(gp, CONE(4), mat(c), 0, 0.84, 0, 0.22, 0.48, 0.22, Math.PI / 4);
    for (let i = 0; i < 4; i++) {
      const s = 0.18 - i * 0.032;
      box(gp, dark, 0, 0.68 + i * 0.09, 0, s, 0.015, s);
    }
    // Top cupola + golden beacon
    box(gp, light, 0, 1.06, 0, 0.09, 0.04, 0.09);
    cyl(gp, '#e2e8f0', 0, 1.10, 0, 0.014, 0.16);
    ball(gp, '#fde047', 0, 1.27, 0, 0.045).material = mat('#fde047', { emissive: '#f59e0b' });
  },
  pyramid: (gp, r) => {
    const cnt = num(r.count, 3);
    const m = r.glass ? mat(r.color!, { transparent: 0.72, metal: 0.45 }) : mat(r.color!);
    if (r.glass) {
      // Louvre courtyard fountains + main glass pyramid + 3 mini pyramids
      box(gp, '#cbd5e1', 0, 0, 0, 0.92, 0.025, 0.92);
      add(gp, CONE(4), m, 0, 0.24, 0, 0.62, 0.46, 0.62, Math.PI / 4);
      for (const [x, z] of [[0, 0.38], [-0.36, 0], [0.36, 0]]) {
        add(gp, CONE(4), m, x, 0.09, z, 0.2, 0.16, 0.2, Math.PI / 4);
      }
      return;
    }
    const spots: [number, number, number][] = [[-0.08, -0.05, 1.05], [0.36, 0.22, 0.78], [-0.42, 0.32, 0.52]];
    for (let i = 0; i < cnt; i++) {
      const [x, z, s] = spots[i];
      add(gp, CONE(4), m, x, 0.35 * s, z, 0.72 * s, 0.7 * s, 0.72 * s, Math.PI / 4);
      // Golden limestone capstone highlight
      add(gp, CONE(4), mat(shade(r.color!, 1.18)), x, 0.62 * s, z, 0.18 * s, 0.16 * s, 0.18 * s, Math.PI / 4);
    }
  },
  statue: (gp, r) => {
    const c = r.color!;
    // Stepped star/stone pedestal
    add(gp, CYL(8), mat('#78716c'), 0, 0.03, 0, 0.44, 0.06, 0.44);
    box(gp, '#a8a29e', 0, 0.06, 0, 0.3, 0.14, 0.3);
    box(gp, '#d6d3d1', 0, 0.20, 0, 0.24, 0.14, 0.24);
    // Draped figure
    cyl(gp, c, 0, 0.34, 0, 0.095, 0.46, 8);
    add(gp, CONE(7), mat(shade(c, 0.92)), 0, 0.52, 0, 0.22, 0.36, 0.18);
    ball(gp, c, 0, 0.86, 0, 0.12);
    if (r.arms) {
      box(gp, c, 0, 0.68, 0, 0.68, 0.065, 0.065);
    }
    if (r.torch) {
      // Crown spikes
      for (let i = -3; i <= 3; i++) {
        add(gp, CONE(4), mat(shade(c, 1.12)), Math.sin(i * 0.4) * 0.06, 0.94, 0.02, 0.02, 0.07, 0.02, 0, 0, -i * 0.35);
      }
      // Tablet in left hand + raised torch in right hand
      box(gp, shade(c, 0.85), -0.11, 0.62, 0.06, 0.06, 0.11, 0.03, 0.3);
      add(gp, CYL(6), mat(c), 0.12, 0.92, 0, 0.04, 0.3, 0.04, 0, 0, -0.2);
      ball(gp, '#fde047', 0.16, 1.10, 0, 0.075).material = mat('#fde047', { emissive: '#f59e0b' });
    }
  },
  clocktower: (gp, r) => {
    const c = r.color!;
    box(gp, shade(c, 0.88), 0, 0, 0, 0.28, 0.12, 0.28);
    box(gp, c, 0, 0.12, 0, 0.22, 0.52, 0.22);
    // Belfry clock stage
    box(gp, shade(c, 1.08), 0, 0.64, 0, 0.26, 0.2, 0.26);
    // Clock faces on all 4 sides
    for (const [x, z, sx, sz] of [[0, 0.132, 0.15, 0.01], [0, -0.132, 0.15, 0.01], [0.132, 0, 0.01, 0.15], [-0.132, 0, 0.01, 0.15]] as const) {
      add(gp, CYL(12), mat('#fefce8', { emissive: '#fef08a' }), x, 0.74, z, sx || 0.14, 0.015, sz || 0.14, 0, sx ? Math.PI / 2 : 0, sz ? Math.PI / 2 : 0);
    }
    // Steeply pitched dark slate spire + golden finial
    add(gp, CONE(4), mat('#334155'), 0, 0.98, 0, 0.28, 0.28, 0.28, Math.PI / 4);
    cyl(gp, '#eab308', 0, 1.12, 0, 0.012, 0.1, 6);
  },
  domed: (gp, r) => {
    const c = r.color!;
    // Raised marble terrace + reflecting pool in front
    box(gp, shade(c, 0.94), 0, 0, 0, 0.78, 0.07, 0.78);
    box(gp, '#38bdf8', 0, 0.071, 0.28, 0.12, 0.008, 0.22);
    // Main mausoleum cube with chamfered corners & arched iwan niches
    box(gp, c, 0, 0.07, 0, 0.44, 0.30, 0.44);
    for (const [x, z, sx, sz] of [[0, 0.222, 0.16, 0.01], [0, -0.222, 0.16, 0.01], [0.222, 0, 0.01, 0.16], [-0.222, 0, 0.01, 0.16]] as const) {
      box(gp, shade(c, 0.72), x, 0.09, z, sx, 0.2, sz);
    }
    // Central onion dome + 4 corner chhatris + golden finial
    cyl(gp, shade(c, 0.96), 0, 0.37, 0, 0.15, 0.08, 12);
    add(gp, SPH(14), mat(c), 0, 0.52, 0, 0.34, 0.38, 0.34);
    cone(gp, '#eab308', 0, 0.70, 0, 0.025, 0.12);
    for (const [x, z] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) {
      add(gp, SPH(8), mat(c), x, 0.41, z, 0.1, 0.12, 0.1);
    }
    const mn = num(r.minarets, 4);
    for (let i = 0; i < mn; i++) {
      const a = (i / mn) * Math.PI * 2 + Math.PI / 4;
      const mx = Math.cos(a) * 0.36, mz = Math.sin(a) * 0.36;
      cyl(gp, c, mx, 0.07, mz, 0.032, 0.56, 8);
      cyl(gp, shade(c, 0.88), mx, 0.42, mz, 0.044, 0.02, 8);
      add(gp, SPH(8), mat(c), mx, 0.65, mz, 0.07, 0.08, 0.07);
      cone(gp, '#eab308', mx, 0.69, mz, 0.015, 0.06, 6);
    }
  },
  wall: (gp, r) => {
    const c = r.color!;
    for (let i = -3; i <= 3; i++) {
      const y = Math.sin(i * 0.9) * 0.08 + 0.06;
      const x = i * 0.15, z = Math.cos(i) * 0.09;
      // Mountain ridge beneath the wall
      cone(gp, '#4d7c5d', x, 0, z, 0.16, y + 0.04, 6);
      box(gp, c, x, y, z, 0.17, 0.13, 0.08, Math.sin(i) * 0.38);
      if (i % 2 === 0) {
        box(gp, shade(c, 0.86), x, y, z, 0.11, 0.25, 0.11);
        box(gp, '#475569', x, y + 0.25, z, 0.13, 0.04, 0.13);
      }
    }
  },
  mountain: (gp, r) => {
    const peaks = num(r.peaks, 1), c = r.color!;
    const h = r.flat ? 0.62 : r.sharp ? 1.05 : 0.85;
    for (let i = 0; i < peaks; i++) {
      const s = i === 0 ? 1 : 0.68, x = i === 0 ? 0 : (i === 1 ? -0.34 : 0.32), z = i === 0 ? 0 : 0.15;
      const m = add(gp, CONE(r.sharp ? 5 : 8), mat(c), x, (h * s) / 2, z, 0.92 * s, h * s, 0.92 * s);
      if (r.flat) { m.scale.y *= 0.78; m.position.y = (h * s * 0.78) / 2; }
      if (r.snow) add(gp, CONE(r.sharp ? 5 : 8), mat('#f8fafc'), x, h * s * (r.flat ? 0.65 : 0.80), z, 0.36 * s, h * s * 0.38, 0.36 * s);
    }
  },
  needle: (gp, r) => {
    const h = num(r.h, 1);
    cyl(gp, shade(r.color!, 0.85), 0, 0, 0, 0.12, 0.06, 8);
    cyl(gp, r.color!, 0, 0.06, 0, 0.045, 0.82 * h, 8);
    if (r.saucer) {
      add(gp, CYL(16), mat('#f59e0b'), 0, 0.72 * h, 0, 0.38, 0.055, 0.38);
      add(gp, CYL(16), mat('#e2e8f0'), 0, 0.68 * h, 0, 0.32, 0.04, 0.32);
    } else {
      add(gp, CYL(14), mat(r.color!), 0, 0.64 * h, 0, 0.22, 0.08, 0.22);
      add(gp, CYL(14), mat('#38bdf8', { emissive: '#0284c7' }), 0, 0.64 * h, 0, 0.23, 0.03, 0.23);
    }
    cyl(gp, '#ef4444', 0, 0.86 * h, 0, 0.012, 0.18 * h, 6);
    if (r.saucer) for (const a of [0, 2.1, 4.2]) add(gp, BOX(), mat(r.color!), Math.cos(a) * 0.08, 0.32, Math.sin(a) * 0.08, 0.03, 0.64, 0.03, 0, Math.sin(a) * 0.15, -Math.cos(a) * 0.15);
  },
  sails: (gp, r) => {
    // Bennelong Point stepped granite podium over Sydney Harbour water
    box(gp, '#0ea5e9', 0, 0, 0, 0.92, 0.02, 0.56);
    box(gp, '#d6c7b2', 0, 0.02, 0, 0.82, 0.07, 0.46);
    for (let i = 0; i < 4; i++) {
      const x = -0.26 + i * 0.17, h = 0.56 - i * 0.065;
      add(gp, SPH(10), mat(r.color!), x, 0.09, -0.03, 0.20, h, 0.28, 0.15, 0, -0.45);
      add(gp, SPH(8), mat('#94a3b8'), x + 0.03, 0.09, 0.02, 0.14, h * 0.72, 0.20, 0.15, 0, -0.35);
    }
  },
  arena: (gp, r) => {
    const c = r.color!;
    // Multi-tiered Colosseum wall with higher surviving northern outer ring
    const outer = add(gp, g('arenaOuter', () => new THREE.CylinderGeometry(0.46, 0.46, 0.36, 20, 1, true, 0, Math.PI * 1.25)), mat(c), 0, 0.18, 0, 1, 1, 0.82);
    (outer.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
    const inner = add(gp, g('arenaInner', () => new THREE.CylinderGeometry(0.41, 0.41, 0.26, 20, 1, true)), mat(shade(c, 0.9)), 0, 0.13, 0, 1, 1, 0.82);
    (inner.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
    // Cornice bands
    for (const y of [0.12, 0.24]) {
      add(gp, g('arenaBand', () => new THREE.TorusGeometry(0.455, 0.012, 6, 20).rotateX(Math.PI / 2)), mat(shade(c, 1.1)), 0, y, 0, 1, 1, 0.82);
    }
    // Arena sand floor
    add(gp, CYL(20), mat('#d4a373'), 0, 0.02, 0, 0.78, 0.03, 0.64);
  },
  onions: (gp) => {
    const cs = ['#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];
    box(gp, '#b91c1c', 0, 0, 0, 0.62, 0.24, 0.62);
    box(gp, '#f8fafc', 0, 0.22, 0, 0.64, 0.03, 0.64);
    cs.forEach((c, i) => {
      const a = (i / 4) * Math.PI * 2, x = i === 4 ? 0 : Math.cos(a) * 0.21, z = i === 4 ? 0 : Math.sin(a) * 0.21, h = i === 4 ? 0.58 : 0.40;
      cyl(gp, '#f1f5f9', x, 0.24, z, 0.075, h - 0.1, 8);
      ball(gp, c, x, 0.24 + h, z, 0.19, 0.21, 0.19);
      cone(gp, '#eab308', x, 0.32 + h, z, 0.045, 0.14, 8);
    });
  },
  windmill: (gp, r) => {
    cyl(gp, '#78716c', 0, 0, 0, 0.25, 0.12, 8);
    cone(gp, r.color!, 0, 0.12, 0, 0.22, 0.58, 8);
    add(gp, SPH(8), mat('#44403c'), 0, 0.68, 0, 0.26, 0.18, 0.26);
    const hub = new THREE.Group(); hub.position.set(0, 0.62, 0.16); hub.name = 'spin'; gp.add(hub);
    for (let i = 0; i < 4; i++) {
      const blade = add(hub, BOX(), mat('#f8fafc'), 0, 0, 0, 0.075, 0.58, 0.012, 0, 0, (i * Math.PI) / 2);
      blade.geometry = g('bladeoff', () => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0));
    }
  },
  gate: (gp, r) => {
    const cols = num(r.columns, 6), c = r.color!;
    box(gp, shade(c, 0.9), 0, 0, 0, 0.94, 0.05, 0.44);
    box(gp, c, 0, 0.05, 0, 0.88, 0.04, 0.38);
    for (let i = 0; i < cols; i++) {
      const x = -0.38 + (i * 0.76) / (cols - 1);
      cyl(gp, c, x, 0.09, 0.12, 0.034, 0.42, 8);
      cyl(gp, c, x, 0.09, -0.12, 0.034, 0.42, 8);
    }
    box(gp, c, 0, 0.51, 0, 0.9, 0.08, 0.4);
    if (r.roof) add(gp, g('prism', () => new THREE.CylinderGeometry(0.5, 0.5, 1, 3)), mat(shade(c, 1.05)), 0, 0.64, 0, 0.3, 0.9, 0.42, 0, 0, Math.PI / 2);
    else { box(gp, '#10b981', 0, 0.59, 0, 0.22, 0.11, 0.12); }
  },
  spires: (gp, r) => {
    const cnt = num(r.count, 8), c = r.color!;
    box(gp, c, 0, 0, 0, 0.72, 0.28, 0.44);
    for (let i = 0; i < cnt; i++) {
      const x = -0.3 + (i * 0.6) / (cnt - 1);
      const h = 0.62 + Math.sin((i / (cnt - 1)) * Math.PI) * 0.42;
      const z = (i % 2) * 0.12 - 0.06;
      add(gp, CONE(8), mat(c), x, 0.25 + h / 2, z, 0.11, h, 0.11);
      ball(gp, '#f59e0b', x, 0.25 + h, z, 0.04);
    }
  },
  moai: (gp, r) => {
    box(gp, '#78716c', 0, 0, 0, 1.02, 0.07, 0.28);
    for (let i = 0; i < num(r.count, 5); i++) {
      const x = -0.4 + i * 0.2;
      box(gp, r.color!, x, 0.07, 0, 0.12, 0.42, 0.12);
      box(gp, r.color!, x, 0.49, 0.02, 0.10, 0.13, 0.12);
      box(gp, shade(r.color!, 0.72), x, 0.37, 0.065, 0.035, 0.12, 0.04);
      if (i % 2 === 1) cyl(gp, '#b91c1c', x, 0.62, 0.01, 0.048, 0.06, 8);
    }
  },
  suspension: (gp, r) => {
    const c = r.color!;
    // Water channel beneath the Golden Gate Bridge
    box(gp, '#0284c7', 0, 0, 0, 1.12, 0.02, 0.42);
    // Roadway deck
    box(gp, '#334155', 0, 0.22, 0, 1.12, 0.025, 0.13);
    box(gp, c, 0, 0.20, 0, 1.12, 0.03, 0.14);
    // Art-deco twin towers with cross-struts
    for (const x of [-0.32, 0.32]) {
      box(gp, '#94a3b8', x, 0.02, 0, 0.09, 0.06, 0.18);
      box(gp, c, x, 0.08, -0.055, 0.05, 0.72, 0.04);
      box(gp, c, x, 0.08, 0.055, 0.05, 0.72, 0.04);
      for (const y of [0.36, 0.54, 0.72]) box(gp, c, x, y, 0, 0.045, 0.03, 0.14);
    }
    // Main suspension cables + vertical suspenders
    for (const z of [-0.055, 0.055]) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.56, 0.24, z),
        new THREE.Vector3(-0.32, 0.79, z),
        new THREE.Vector3(0, 0.28, z),
        new THREE.Vector3(0.32, 0.79, z),
        new THREE.Vector3(0.56, 0.24, z),
      ]);
      gp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.013, 5), mat(c)));
      for (let sx = -0.48; sx <= 0.48; sx += 0.08) {
        if (Math.abs(Math.abs(sx) - 0.32) < 0.04) continue;
        const u = (sx + 0.56) / 1.12;
        const pt = curve.getPoint(u);
        cyl(gp, shade(c, 0.85), sx, 0.23, z, 0.004, Math.max(0.02, pt.y - 0.23), 4);
      }
    }
  },
  ruins: (gp, r) => {
    for (let i = 0; i < 4; i++) box(gp, shade('#4d7c5d', 1 - i * 0.07), 0, i * 0.08, -i * 0.05, 0.92 - i * 0.14, 0.08, 0.62 - i * 0.1);
    for (let i = 0; i < 6; i++) box(gp, r.color!, -0.3 + (i % 3) * 0.3, 0.32, -0.1 + Math.floor(i / 3) * 0.2, 0.12, 0.13, 0.1);
    cone(gp, '#3f624d', 0.2, 0.3, -0.35, 0.20, 0.72, 6);
    cone(gp, '#4d7c5d', -0.28, 0.24, -0.28, 0.14, 0.45, 5);
  },
  steppyramid: (gp, r) => {
    for (let i = 0; i < 6; i++) box(gp, shade(r.color!, 1 - i * 0.04), 0, i * 0.10, 0, 0.92 - i * 0.13, 0.10, 0.92 - i * 0.13);
    box(gp, shade(r.color!, 0.82), 0, 0.60, 0, 0.22, 0.14, 0.22);
    // 4-sided ceremonial staircases (El Castillo)
    for (const [x, z, sx, sz] of [[0, 0.28, 0.14, 0.36], [0, -0.28, 0.14, 0.36], [0.28, 0, 0.36, 0.14], [-0.28, 0, 0.36, 0.14]] as const) {
      box(gp, shade(r.color!, 0.88), x, 0, z, sx, 0.44, sz);
    }
  },
  temple: (gp, r) => {
    box(gp, r.color!, 0, 0, 0, 0.92, 0.12, 0.92);
    box(gp, shade(r.color!, 0.95), 0, 0.12, 0, 0.62, 0.15, 0.62);
    const pts: [number, number, number][] = [[0, 0, 0.64], [-0.25, -0.25, 0.42], [0.25, -0.25, 0.42], [-0.25, 0.25, 0.42], [0.25, 0.25, 0.42]];
    for (const [x, z, h] of pts) {
      add(gp, SPH(8), mat(shade(r.color!, 0.9)), x, 0.27 + h / 2, z, 0.15, h, 0.15);
      cone(gp, shade(r.color!, 1.1), x, 0.27 + h * 0.85, z, 0.035, 0.1, 6);
    }
    add(gp, g('ring', () => new THREE.RingGeometry(0.54, 0.70, 4, 1).rotateX(-Math.PI / 2).rotateY(Math.PI / 4)), mat('#38bdf8'), 0, 0.015, 0, 1, 1, 1);
  },
  leaning: (gp, r) => {
    const t = new THREE.Group(); t.rotation.z = 0.13; gp.add(t);
    for (let i = 0; i < 7; i++) {
      add(t, CYL(14), mat(i % 2 ? shade(r.color!, 0.92) : r.color!), 0, 0.055 + i * 0.11, 0, 0.26, 0.11, 0.26);
      add(t, CYL(14), mat(shade(r.color!, 1.08)), 0, 0.105 + i * 0.11, 0, 0.28, 0.018, 0.28);
    }
    add(t, CYL(12), mat(r.color!), 0, 0.82, 0, 0.2, 0.09, 0.2);
  },
  stones: (gp, r) => {
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; box(gp, r.color!, Math.cos(a) * 0.36, 0, Math.sin(a) * 0.36, 0.095, 0.32, 0.065, -a); }
    for (let i = 0; i < 10; i += 2) { const a = ((i + 0.5) / 10) * Math.PI * 2; box(gp, shade(r.color!, 0.9), Math.cos(a) * 0.36, 0.32, Math.sin(a) * 0.36, 0.27, 0.055, 0.075, -a + Math.PI / 2); }
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 1.4 - 0.7; box(gp, shade(r.color!, 0.85), Math.cos(a) * 0.16, 0, Math.sin(a) * 0.16, 0.12, 0.38, 0.07, -a); }
  },
  skyscraper: (gp, r) => {
    const h = num(r.h, 1.4), c = r.color!;
    if (r.taper) {
      for (let i = 0; i < 6; i++) box(gp, shade(c, 1 + i * 0.03), 0, (i * h) / 7, 0, 0.34 - i * 0.05, h / 7 + 0.02, 0.34 - i * 0.05);
      cyl(gp, '#e2e8f0', 0, (6 * h) / 7, 0, 0.018, h / 6, 6);
    } else {
      box(gp, c, 0, 0, 0, 0.3, h * 0.6, 0.3);
      box(gp, c, 0, h * 0.6, 0, 0.2, h * 0.15, 0.2);
      box(gp, c, 0, h * 0.75, 0, 0.12, h * 0.1, 0.12);
      cyl(gp, '#e2e8f0', 0, h * 0.85, 0, 0.015, h * 0.16, 6);
    }
    for (let i = 0; i < 6; i++) box(gp, '#fde047', 0, 0.1 + i * h * 0.09, 0.152, 0.2, 0.02, 0.004);
  },
  pagodatower: (gp, r) => {
    box(gp, r.color!, 0, 0, 0, 0.32, 0.25, 0.32);
    for (let i = 0; i < 8; i++) add(gp, g('frust', () => new THREE.CylinderGeometry(0.5, 0.36, 1, 4)), mat(shade(r.color!, 1 + (i % 2) * 0.1)), 0, 0.3 + i * 0.1, 0, 0.36, 0.1, 0.36, Math.PI / 4);
    cyl(gp, '#eab308', 0, 1.1, 0, 0.028, 0.22, 6);
  },
  twin: (gp, r) => {
    for (const x of [-0.17, 0.17]) {
      cyl(gp, r.color!, x, 0, 0, 0.105, 0.78, 8);
      cyl(gp, shade(r.color!, 1.1), x, 0.78, 0, 0.075, 0.22, 8);
      cone(gp, '#e2e8f0', x, 1.0, 0, 0.055, 0.22, 8);
    }
    box(gp, '#94a3b8', 0, 0.46, 0, 0.34, 0.04, 0.06);
  },
  castle: (gp, r) => {
    const roof = (r.roof as string) ?? '#2563eb', c = r.color!;
    box(gp, '#64748b', 0, 0, 0, 0.68, 0.08, 0.42);
    box(gp, c, 0, 0.08, 0, 0.58, 0.32, 0.34);
    add(gp, g('hip', () => new THREE.CylinderGeometry(0.0, 0.7, 1, 4).rotateY(Math.PI / 4)), mat(roof), 0, 0.46, 0, 0.64, 0.16, 0.4);
    for (const [x, z, h] of [[-0.3, -0.17, 0.64], [0.3, -0.17, 0.54], [-0.3, 0.17, 0.48], [0.3, 0.17, 0.74], [0.05, 0, 0.86]] as const) {
      cyl(gp, c, x, 0.06, z, 0.075, h, 8);
      cone(gp, roof, x, h + 0.06, z, 0.095, 0.24, 8);
    }
  },
  carved: (gp, r) => {
    box(gp, shade(r.color!, 0.78), 0, 0, -0.1, 1.0, 0.86, 0.32);
    box(gp, r.color!, 0, 0.05, 0.06, 0.58, 0.68, 0.06);
    for (let i = 0; i < 4; i++) cyl(gp, shade(r.color!, 1.12), -0.18 + i * 0.12, 0.05, 0.11, 0.026, 0.32, 8);
    add(gp, CONE(8), mat(shade(r.color!, 1.08)), 0, 0.54, 0.11, 0.18, 0.14, 0.07);
    cyl(gp, shade(r.color!, 1.08), 0, 0.38, 0.11, 0.065, 0.15, 8);
  },
  palace: (gp, r) => {
    const roof = (r.roof as string) ?? '#eab308';
    box(gp, '#e2e8f0', 0, 0, 0, 0.92, 0.07, 0.62);
    box(gp, r.color!, 0, 0.07, 0, 0.62, 0.21, 0.36);
    add(gp, g('hip', () => new THREE.CylinderGeometry(0.0, 0.7, 1, 4).rotateY(Math.PI / 4)), mat(roof), 0, 0.37, 0, 1.02, 0.2, 0.56);
    box(gp, r.color!, 0, 0.43, 0, 0.36, 0.11, 0.22);
    add(gp, g('hip', () => new THREE.CylinderGeometry(0.0, 0.7, 1, 4).rotateY(Math.PI / 4)), mat(roof), 0, 0.59, 0, 0.62, 0.16, 0.35);
  },
  bascule: (gp, r) => {
    const c = r.color!;
    box(gp, '#0284c7', 0, 0, 0, 1.12, 0.02, 0.38);
    for (const x of [-0.25, 0.25]) {
      box(gp, '#d6d3d1', x, 0.02, 0, 0.16, 0.62, 0.16);
      cone(gp, '#475569', x, 0.64, 0, 0.11, 0.18, 4);
    }
    box(gp, c, 0, 0.52, 0, 0.38, 0.045, 0.09);
    box(gp, c, -0.55, 0.14, 0, 0.45, 0.04, 0.14);
    box(gp, c, 0.55, 0.14, 0, 0.45, 0.04, 0.14);
    box(gp, c, 0, 0.14, 0, 0.34, 0.04, 0.14);
  },
  canyon: (gp, r) => {
    for (let i = 0; i < 4; i++) {
      box(gp, shade(r.color!, 1 - i * 0.07), -0.33, i * 0.085, 0, 0.36 - i * 0.03, 0.085, 0.82);
      box(gp, shade(r.color!, 1 - i * 0.07), 0.33, i * 0.085, 0, 0.36 - i * 0.03, 0.085, 0.82);
    }
    box(gp, '#0ea5e9', 0, 0.01, 0, 0.18, 0.025, 0.82);
  },
  waterfall: (gp, r) => {
    const w = r.wide ? 0.9 : 0.52;
    box(gp, '#4d7c5d', 0, 0, -0.25, w + 0.22, 0.52, 0.22);
    box(gp, r.color!, 0, 0.05, -0.13, w, 0.46, 0.035).material = mat(r.color!, { transparent: 0.88, emissive: '#0284c7' });
    add(gp, CYL(14), mat('#38bdf8'), 0, 0.02, 0.1, w + 0.12, 0.04, 0.42);
    ball(gp, '#ffffff', 0, 0.09, -0.04, w * 0.65, 0.14, 0.22).material = mat('#ffffff', { transparent: 0.68 });
  },
  rock: (gp, r) => {
    add(gp, SPH(12), mat(r.color!), 0, 0.14, 0, 1.02, 0.38, 0.54);
    add(gp, SPH(10), mat(shade(r.color!, 0.9)), 0.12, 0.16, 0.04, 0.68, 0.34, 0.42);
  },
  reef: (gp, r) => {
    const cs = [r.color!, '#f59e0b', '#c084fc', '#fb7185', '#2dd4bf'];
    for (let i = 0; i < 10; i++) { const a = i * 2.4, d = 0.1 + (i % 3) * 0.12; ball(gp, cs[i % cs.length], Math.cos(a) * d, 0.09, Math.sin(a) * d, 0.18, 0.22, 0.18); }
    for (let i = 0; i < 4; i++) cyl(gp, cs[(i + 2) % cs.length], -0.2 + i * 0.13, 0, 0.2 - i * 0.1, 0.022, 0.32, 6);
  },
  pagoda: (gp, r) => {
    const fl = num(r.floors, 3);
    box(gp, '#78716c', 0, 0, 0, 0.62, 0.06, 0.62);
    for (let i = 0; i < fl; i++) {
      box(gp, r.color!, 0, 0.06 + i * 0.22, 0, 0.42 - i * 0.06, 0.15, 0.42 - i * 0.06);
      add(gp, g('hip', () => new THREE.CylinderGeometry(0.0, 0.7, 1, 4).rotateY(Math.PI / 4)), mat('#334155'), 0, 0.25 + i * 0.22, 0, 0.76 - i * 0.1, 0.1, 0.76 - i * 0.1);
    }
    cyl(gp, r.color!, 0, 0.05 + fl * 0.22, 0, 0.015, 0.14, 4);
  },
  // ---------- animals ----------
  quad: (gp, r) => {
    const L = num(r.L, 1), H = num(r.H, 0.6), c = r.color!;
    const body = ball(gp, c, 0, H * 0.75, 0, 0.32, 0.26 * (r.chunky ? 1.3 : 1), L * 0.6);
    void body;
    for (const [x, z] of [[-0.09, -0.2], [0.09, -0.2], [-0.09, 0.2], [0.09, 0.2]]) cyl(gp, shade(c, 0.85), x, 0, z * L, 0.035, H * 0.68, 5);
    const neck = num(r.neck, 0.2);
    add(gp, CYL(6), mat(c), 0, H * 0.8 + neck * 0.3, L * 0.28 + neck * 0.08, 0.1, neck * 0.7 + 0.1, 0.1, 0, 0.5);
    ball(gp, c, 0, H * 0.82 + neck * 0.6, L * 0.34 + neck * 0.18, 0.17, 0.16, 0.22);
    if (r.mane) ball(gp, r.mane as string, 0, H * 0.82 + neck * 0.6, L * 0.3 + neck * 0.18, 0.3, 0.3, 0.16);
    if (r.trunk) add(gp, CYL(6), mat(c), 0, H * 0.55, L * 0.46, 0.06, 0.4, 0.06, 0, 0.2);
    if (r.trunk) for (const x of [-0.17, 0.17]) ball(gp, c, x, H * 0.85, L * 0.32, 0.04, 0.28, 0.22);
    if (r.hump) ball(gp, shade(c, 0.95), 0, H * 0.98, 0, 0.2, 0.18 * num(r.hump, 1), 0.24);
    if (r.antlers) for (const x of [-0.06, 0.06]) add(gp, CYL(4), mat('#d8c8a0'), x, H * 1.05 + neck * 0.6, L * 0.32, 0.02, 0.22, 0.02, 0, -0.4, x * 6);
    if (r.pattern === 'stripes') for (let i = -2; i <= 2; i++) box(gp, '#222222', 0, H * 0.6, i * L * 0.09, 0.33, 0.24, 0.025);
    if (r.pattern === 'spots') for (let i = 0; i < 6; i++) ball(gp, shade(c, 0.55), (i % 2 ? 1 : -1) * 0.15, H * 0.8, -0.15 + i * 0.06, 0.05);
    if (r.fluffy) ball(gp, shade(c, 1.05), 0, H * 0.8, 0, 0.36, 0.3, L * 0.62);
    add(gp, CYL(4), mat(c), 0, H * 0.75, -L * 0.33, 0.03, num(r.tail, 0.3), 0.03, 0, 0.9);
  },
  ape: (gp, r) => {
    const c = r.color!;
    ball(gp, c, 0, 0.35, 0, 0.42, 0.45, 0.36);
    ball(gp, c, 0, 0.65, 0.04, 0.24);
    ball(gp, shade(c, 1.5), 0, 0.63, 0.14, 0.13, 0.1, 0.06);
    for (const x of [-0.24, 0.24]) add(gp, CYL(5), mat(c), x, 0.25, 0.04, 0.08, 0.45, 0.08, 0, 0, x * 0.6);
    for (const x of [-0.1, 0.1]) cyl(gp, c, x, 0, 0, 0.05, 0.18, 5);
  },
  bear: (gp, r) => {
    const s = r.small ? 0.75 : 1, c = r.color!, p = (r.patch as string) ?? shade(c, 0.85);
    ball(gp, c, 0, 0.32 * s, 0, 0.45 * s, 0.4 * s, 0.6 * s);
    ball(gp, c, 0, 0.5 * s, 0.3 * s, 0.3 * s);
    for (const x of [-0.1, 0.1]) ball(gp, p, x * s, 0.64 * s, 0.28 * s, 0.09 * s);
    if (r.patch) for (const x of [-0.06, 0.06]) ball(gp, p, x * s, 0.52 * s, 0.43 * s, 0.07 * s, 0.08 * s, 0.03 * s);
    ball(gp, shade(c, 0.8), 0, 0.46 * s, 0.45 * s, 0.1 * s, 0.08 * s, 0.08 * s);
    for (const [x, z] of [[-0.13, -0.15], [0.13, -0.15], [-0.13, 0.15], [0.13, 0.15]]) cyl(gp, p, x * s, 0, z * s, 0.06 * s, 0.18 * s, 6);
  },
  hopper: (gp, r) => {
    const c = r.color!;
    add(gp, SPH(), mat(c), 0, 0.38, 0, 0.3, 0.45, 0.3, 0, 0.3);
    ball(gp, c, 0, 0.7, 0.12, 0.16, 0.16, 0.22);
    for (const x of [-0.05, 0.05]) cone(gp, c, x, 0.76, 0.1, 0.03, 0.12, 4);
    for (const x of [-0.1, 0.1]) ball(gp, shade(c, 0.9), x, 0.12, 0.05, 0.12, 0.2, 0.32);
    add(gp, CONE(5), mat(c), 0, 0.15, -0.3, 0.1, 0.5, 0.1, 0, -1.2);
  },
  penguin: (gp, r) => {
    const s = r.small ? 0.7 : 1;
    ball(gp, r.color!, 0, 0.35 * s, 0, 0.36 * s, 0.7 * s, 0.32 * s);
    ball(gp, (r.belly as string) ?? '#fff', 0, 0.32 * s, 0.07 * s, 0.28 * s, 0.56 * s, 0.22 * s);
    ball(gp, r.color!, 0, 0.75 * s, 0.02 * s, 0.24 * s);
    add(gp, CONE(5), mat(r.accent ?? '#f0b030'), 0, 0.73 * s, 0.17 * s, 0.07 * s, 0.14 * s, 0.07 * s, 0, Math.PI / 2);
    for (const x of [-0.18, 0.18]) add(gp, SPH(), mat(r.color!), x * s, 0.4 * s, 0, 0.06 * s, 0.35 * s, 0.14 * s, 0, 0, x * 1.4);
  },
  wader: (gp, r) => {
    const c = r.color!;
    ball(gp, c, 0, 0.62, 0, 0.22, 0.2, 0.36);
    cyl(gp, '#d07080', 0.0, 0, 0, 0.012, 0.55, 4);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.65, 0.12), new THREE.Vector3(0, 0.85, 0.22), new THREE.Vector3(0, 0.98, 0.08), new THREE.Vector3(0, 1.05, 0.16)]);
    gp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.025, 5), mat(c)));
    ball(gp, c, 0, 1.06, 0.18, 0.08);
    add(gp, CONE(4), mat('#222'), 0, 1.03, 0.26, 0.04, 0.1, 0.04, 0, 2.2);
  },
  flyer: (gp, r) => {
    const c = r.color!;
    const body = new THREE.Group(); body.position.y = 0.5; body.name = 'flap'; gp.add(body);
    ball(body, c, 0, 0, 0, 0.18, 0.18, 0.45);
    ball(body, (r.head as string) ?? c, 0, 0.05, 0.25, 0.15);
    add(body, CONE(4), mat('#e0b030'), 0, 0.03, 0.35, 0.05, 0.1, 0.05, 0, Math.PI / 2);
    for (const x of [-1, 1]) add(body, BOX(), mat(shade(c, 0.9)), x * 0.35, 0.02, 0, 0.6, 0.03, 0.22, 0, 0, x * 0.15);
  },
  roundbird: (gp, r) => {
    ball(gp, r.color!, 0, 0.3, 0, 0.5, 0.45, 0.55);
    add(gp, CYL(5), mat('#d8c8a0'), 0, 0.3, 0.38, 0.02, 0.3, 0.02, 0, 1.3);
    for (const x of [-0.08, 0.08]) cyl(gp, '#d8c8a0', x, 0, 0, 0.02, 0.1, 4);
  },
  whale: (gp, r) => {
    const L = num(r.L, 1.5), c = r.color!;
    ball(gp, c, 0, 0.12, 0, 0.32 * Math.min(L, 1.2), 0.22, L * 0.6);
    add(gp, BOX(), mat(c), 0, 0.14, -L * 0.33, 0.35, 0.03, 0.12);
    if (r.fin) add(gp, CONE(3), mat(c), 0, 0.3, 0, 0.04, 0.16, 0.14, 0, -0.3);
    ball(gp, shade(c, 1.4), 0, 0.06, 0.02, 0.26 * Math.min(L, 1.2), 0.1, L * 0.5);
  },
  shark: (gp, r) => {
    const c = r.color!;
    ball(gp, c, 0, 0.14, 0, 0.24, 0.24, 0.9);
    add(gp, CONE(3), mat(c), 0, 0.36, -0.02, 0.06, 0.26, 0.2, 0, -0.35);
    add(gp, CONE(3), mat(c), 0, 0.2, -0.48, 0.05, 0.3, 0.14, 0, -0.9);
    ball(gp, '#f0f0f0', 0, 0.08, 0.05, 0.2, 0.1, 0.7);
  },
  turtle: (gp, r) => {
    const c = r.color!;
    add(gp, SPH(10), mat(shade(c, 0.85)), 0, 0.08, 0, 0.55, 0.22, 0.65);
    ball(gp, '#9ab070', 0, 0.06, 0.38, 0.14, 0.12, 0.18);
    for (const [x, z, rz] of [[-0.3, 0.12, 0.3], [0.3, 0.12, -0.3], [-0.2, -0.22, 0.2], [0.2, -0.22, -0.2]] as const) add(gp, SPH(), mat('#9ab070'), x, 0.04, z, 0.3, 0.04, 0.12, 0, 0, rz);
  },
  octopus: (gp, r) => {
    const c = r.color!;
    ball(gp, c, 0, 0.42, 0, 0.36, 0.42, 0.36);
    for (const x of [-0.08, 0.08]) ball(gp, '#fff', x, 0.36, 0.16, 0.08);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; add(gp, CONE(5), mat(c), Math.cos(a) * 0.18, 0.1, Math.sin(a) * 0.18, 0.08, 0.35, 0.08, 0, Math.sin(a) * 1.0, -Math.cos(a) * 1.0); }
  },
  croc: (gp, r) => {
    const c = r.color!, L = r.short ? 0.75 : 1;
    ball(gp, c, 0, 0.1, 0, 0.26, 0.15, 0.8 * L);
    box(gp, c, 0, 0.05, 0.5 * L, 0.14, 0.07, 0.3 * L);
    add(gp, CONE(4), mat(c), 0, 0.08, -0.6 * L, 0.12, 0.45 * L, 0.06, 0, -Math.PI / 2);
    for (const [x, z] of [[-0.16, 0.2], [0.16, 0.2], [-0.16, -0.18], [0.16, -0.18]]) box(gp, shade(c, 0.85), x, 0, z * L, 0.07, 0.07, 0.07);
    for (let i = 0; i < 5; i++) cone(gp, shade(c, 0.8), 0, 0.16, (-0.3 + i * 0.13) * L, 0.025, 0.06, 4);
  },
  // ---------- discoveries ----------
  wreck: (gp, r) => {
    const t = new THREE.Group(); t.rotation.set(0.15, 0, 0.2); gp.add(t);
    box(t, r.color!, 0, 0, 0, 0.3, 0.18, 0.9);
    add(t, CONE(4), mat(r.color!), 0, 0.09, 0.55, 0.3, 0.25, 0.25, Math.PI / 4, Math.PI / 2);
    box(t, '#7a6a5a', 0, 0.18, -0.1, 0.18, 0.1, 0.3);
    cyl(t, '#3a2a2a', 0, 0.28, 0.05, 0.05, 0.18, 6);
    box(gp, '#d8c08a', 0, 0, 0, 1.0, 0.02, 1.1);
  },
  mystery: (gp, r) => {
    const q = add(gp, g('torus', () => new THREE.TorusGeometry(0.22, 0.06, 6, 14, Math.PI * 1.4)), mat(r.color!, { emissive: r.color }), 0, 0.68, 0, 1, 1, 1, 0, 0, -0.6);
    q.name = 'spin';
    cyl(gp, r.color!, 0, 0.25, 0, 0.05, 0.2, 6).material = mat(r.color!, { emissive: r.color });
    ball(gp, r.color!, 0, 0.12, 0, 0.12).material = mat(r.color!, { emissive: r.color });
  },
  serpent: (gp, r) => {
    for (let i = 0; i < 4; i++) add(gp, g('hump', () => new THREE.TorusGeometry(0.12, 0.05, 6, 10, Math.PI)), mat(r.color!), -0.36 + i * 0.22, 0, 0, 1, 1 + (i === 0 ? 0.6 : 0), 1);
    ball(gp, r.color!, -0.42, 0.32, 0, 0.14, 0.12, 0.1);
    if (r.tentacles) for (let i = 0; i < 3; i++) add(gp, CONE(5), mat(r.color!), 0.2 + i * 0.12, 0.2, 0.1, 0.06, 0.45, 0.06, 0, 0, -0.3);
  },
  vent: (gp, r) => {
    for (let i = 0; i < 3; i++) cone(gp, '#3a3a4a', -0.25 + i * 0.25, 0, i * 0.05, 0.12, 0.35 + i * 0.12, 6);
    ball(gp, r.color!, 0, 0.6, 0.1, 0.18).material = mat(r.color!, { emissive: r.color, transparent: 0.7 });
  },
  footprints: (gp, r) => {
    for (let i = 0; i < 4; i++) add(gp, SPH(6), mat(r.color!), (i % 2 ? 0.1 : -0.1), 0.02, -0.4 + i * 0.26, 0.14, 0.04, 0.24);
    cone(gp, '#2f6a3a', 0.35, 0, 0.2, 0.15, 0.6, 6); cone(gp, '#2f6a3a', -0.35, 0, -0.2, 0.15, 0.7, 6);
  },
  sunkencity: (gp, r) => {
    for (let i = 0; i < 5; i++) cyl(gp, '#d8d0c0', -0.3 + i * 0.15, 0, 0, 0.04, 0.2 + ((i * 7) % 3) * 0.12, 6);
    box(gp, '#d8d0c0', -0.15, 0.32, 0, 0.35, 0.04, 0.1);
    ball(gp, r.color!, 0, 0.0, 0, 1.0, 0.1, 0.6).material = mat(r.color!, { transparent: 0.45 });
  },
  crater: (gp, r) => {
    const m = add(gp, g('craterRing', () => new THREE.TorusGeometry(0.32, 0.1, 6, 14).rotateX(Math.PI / 2)), mat('#8a6a4a'), 0, 0.05, 0, 1, 1, 1);
    void m;
    ball(gp, r.color!, 0, 0.04, 0, 0.5, 0.06, 0.5).material = mat(r.color!, { emissive: r.color });
    if (r.trees) for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; add(gp, CYL(4), mat('#5a4a3a'), Math.cos(a) * 0.55, 0.03, Math.sin(a) * 0.55, 0.03, 0.3, 0.03, -a, 0, Math.PI / 2); }
    else for (let i = 0; i < 4; i++) cone(gp, '#ffcc33', -0.12 + i * 0.08, 0.04, (i % 2) * 0.08, 0.04, 0.2, 5).material = mat('#ffcc33', { emissive: '#ff8800' });
  },
  crystals: (gp, r) => {
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; add(gp, CONE(5), mat(r.color!, { emissive: shade(r.color!, 0.4), transparent: 0.85 }), Math.cos(a) * 0.15, 0.25, Math.sin(a) * 0.15, 0.12, 0.6 - (i % 3) * 0.1, 0.12, 0, Math.sin(a) * 0.5, -Math.cos(a) * 0.5); }
  },
  // ---------- vehicles ----------
  ship: (gp, r) => {
    const c = r.color!, a = r.accent ?? '#c0302a';
    box(gp, c, 0, 0, 0, 0.26, 0.12, 0.9);
    add(gp, CONE(4), mat(c), 0, 0.06, 0.5, 0.26, 0.2, 0.12, Math.PI / 4, Math.PI / 2);
    box(gp, '#f4f4f4', 0, 0.12, -0.15, 0.22, 0.12, 0.35);
    cyl(gp, a, 0, 0.24, -0.15, 0.05, 0.14, 8);
    if (r.containers) for (let i = 0; i < 6; i++) box(gp, ['#c04a3a', '#3a7ac0', '#e0b030', '#3a9a5a'][i % 4], 0, 0.12, 0.05 + i * 0.06 - 0.05, 0.22, 0.08, 0.05);
  },
  plane: (gp, r) => {
    const c = r.color!, a = r.accent ?? '#2a5ac0';
    add(gp, CYL(8), mat(c), 0, 0, 0, 0.12, 0.9, 0.12, 0, Math.PI / 2);
    add(gp, CONE(8), mat(c), 0, 0, 0.5, 0.12, 0.12, 0.12, 0, Math.PI / 2);
    box(gp, c, 0, -0.01, 0.0, 0.9, 0.02, 0.18);
    box(gp, c, 0, -0.01, -0.4, 0.34, 0.02, 0.1);
    box(gp, a, 0, 0.0, -0.4, 0.02, 0.16, 0.12);
    for (const x of [-0.22, 0.22]) add(gp, CYL(6), mat('#9aa0a8'), x, -0.06, 0.04, 0.06, 0.14, 0.06, 0, Math.PI / 2);
  },
  train: (gp, r) => {
    const cars = num(r.cars, 4), c = r.color!, a = r.accent ?? '#c0302a';
    for (let i = 0; i < cars; i++) { box(gp, c, 0, 0, -i * 0.26, 0.14, 0.14, 0.24); box(gp, a, 0, 0.07, -i * 0.26 + 0.0, 0.142, 0.03, 0.24); }
    if (r.nose) add(gp, SPH(8), mat(c), 0, 0.06, 0.15, 0.14, 0.13, 0.26);
  },
  balloon: (gp, r) => {
    const env = add(gp, SPH(10), mat(r.color!), 0, 0.7, 0, 0.55, 0.65, 0.55);
    void env;
    for (let i = 0; i < 4; i++) add(gp, SPH(10), mat(r.accent ?? '#f0c030'), 0, 0.7, 0, 0.56, 0.66, 0.1, (i * Math.PI) / 4);
    box(gp, '#8a5a3a', 0, 0.12, 0, 0.14, 0.1, 0.14);
    for (const [x, z] of [[-0.06, -0.06], [0.06, -0.06], [-0.06, 0.06], [0.06, 0.06]]) add(gp, CYL(3), mat('#444'), x, 0.3, z, 0.008, 0.3, 0.008);
  },
};

const FALLBACK: Builder = (gp, r) => { cyl(gp, r.color ?? '#ffcc33', 0, 0, 0, 0.12, 0.5); ball(gp, r.color ?? '#ffcc33', 0, 0.6, 0, 0.3); };

export const KINDS = Object.keys(B);

export function buildModel(recipe: ModelRecipe): THREE.Group {
  const gp = new THREE.Group();
  (B[recipe.kind] ?? FALLBACK)(gp, { color: '#cccccc', ...recipe });
  return gp;
}
