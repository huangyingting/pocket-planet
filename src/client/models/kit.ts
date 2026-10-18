import * as THREE from 'three';
import type { ModelRecipe } from '../../shared/data/types.ts';

// Every model is built from primitives at runtime: ~1 unit tall, base at y=0, "front" facing +z.
const mats = new Map<string, THREE.MeshStandardMaterial>();
export function mat(color: string, opts: { emissive?: string; transparent?: number; metal?: number } = {}): THREE.MeshStandardMaterial {
  const k = color + JSON.stringify(opts);
  let m = mats.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: opts.metal ?? 0.05, flatShading: true });
    if (opts.emissive) { m.emissive = new THREE.Color(opts.emissive); m.emissiveIntensity = 0.8; }
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
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(gp, BOX(), mat(c), x * 0.17, 0.2, z * 0.17, 0.07, 0.45, 0.07, 0, z * 0.35, -x * 0.35);
    box(gp, c, 0, 0.36, 0, 0.36, 0.05, 0.36);
    add(gp, CONE(4), mat(c), 0, 0.62, 0, 0.3, 0.55, 0.3, Math.PI / 4);
    box(gp, shade(c, 1.1), 0, 0.6, 0, 0.14, 0.04, 0.14);
    cyl(gp, shade(c, 0.8), 0, 0.88, 0, 0.02, 0.14);
  },
  pyramid: (gp, r) => {
    const cnt = num(r.count, 3);
    const m = r.glass ? mat(r.color!, { transparent: 0.7, metal: 0.4 }) : mat(r.color!);
    const spots: [number, number, number][] = [[0, 0, 1], [0.42, 0.25, 0.75], [0.7, 0.55, 0.5]];
    for (let i = 0; i < cnt; i++) { const [x, z, s] = spots[i]; add(gp, CONE(4), m, x, 0.35 * s, z, 0.7 * s, 0.7 * s, 0.7 * s, Math.PI / 4); }
  },
  statue: (gp, r) => {
    const c = r.color!;
    box(gp, '#9a8f7a', 0, 0, 0, 0.3, 0.25, 0.3);
    cyl(gp, c, 0, 0.25, 0, 0.09, 0.45);
    ball(gp, c, 0, 0.78, 0, 0.12);
    if (r.arms) box(gp, c, 0, 0.58, 0, 0.6, 0.06, 0.06);
    if (r.torch) { add(gp, CYL(), mat(c), 0.12, 0.85, 0, 0.04, 0.3, 0.04, 0, 0, -0.2); ball(gp, '#ffcc33', 0.15, 1.02, 0, 0.07); (gp.children.at(-1) as THREE.Mesh).material = mat('#ffcc33', { emissive: '#ff9900' }); }
  },
  clocktower: (gp, r) => {
    box(gp, r.color!, 0, 0, 0, 0.22, 0.75, 0.22);
    box(gp, '#f5f0d8', 0, 0.62, 0.111, 0.16, 0.16, 0.01);
    add(gp, CONE(4), mat('#3f4a5a'), 0, 0.88, 0, 0.3, 0.28, 0.3, Math.PI / 4);
  },
  domed: (gp, r) => {
    const c = r.color!;
    box(gp, c, 0, 0, 0, 0.7, 0.08, 0.7);
    box(gp, c, 0, 0.08, 0, 0.42, 0.3, 0.42);
    add(gp, SPH(12), mat(c), 0, 0.42, 0, 0.36, 0.42, 0.36);
    cone(gp, '#d9c27a', 0, 0.6, 0, 0.03, 0.12);
    const mn = num(r.minarets, 4);
    for (let i = 0; i < mn; i++) { const a = (i / mn) * Math.PI * 2 + Math.PI / 4; cyl(gp, c, Math.cos(a) * 0.32, 0.08, Math.sin(a) * 0.32, 0.03, 0.55, 6); cone(gp, c, Math.cos(a) * 0.32, 0.63, Math.sin(a) * 0.32, 0.04, 0.08, 6); }
  },
  wall: (gp, r) => {
    for (let i = -3; i <= 3; i++) {
      const y = Math.sin(i * 0.9) * 0.08;
      box(gp, r.color!, i * 0.16, y, Math.cos(i) * 0.08, 0.17, 0.12, 0.07, Math.sin(i) * 0.4);
      if (i % 2 === 0) box(gp, shade(r.color!, 0.9), i * 0.16, y, Math.cos(i) * 0.08, 0.1, 0.22, 0.1);
    }
  },
  mountain: (gp, r) => {
    const peaks = num(r.peaks, 1), c = r.color!;
    const h = r.flat ? 0.6 : r.sharp ? 1.0 : 0.8;
    for (let i = 0; i < peaks; i++) {
      const s = i === 0 ? 1 : 0.65, x = i === 0 ? 0 : (i === 1 ? -0.35 : 0.33), z = i === 0 ? 0 : 0.15;
      const m = add(gp, CONE(r.sharp ? 5 : 7), mat(c), x, (h * s) / 2, z, 0.9 * s, h * s, 0.9 * s);
      if (r.flat) { m.scale.y *= 0.8; m.position.y = (h * s * 0.8) / 2; }
      if (r.snow) add(gp, CONE(r.sharp ? 5 : 7), mat('#ffffff'), x, h * s * (r.flat ? 0.65 : 0.82), z, 0.32 * s, h * s * 0.36, 0.32 * s);
    }
  },
  needle: (gp, r) => {
    const h = num(r.h, 1);
    cyl(gp, r.color!, 0, 0, 0, 0.04, 0.85 * h, 6);
    if (r.saucer) add(gp, CYL(12), mat('#e8a040'), 0, 0.7 * h, 0, 0.36, 0.06, 0.36); else ball(gp, r.color!, 0, 0.62 * h, 0, 0.16, 0.12, 0.16);
    cyl(gp, '#c03030', 0, 0.85 * h, 0, 0.012, 0.15 * h, 4);
    if (r.saucer) for (const a of [0, 2.1, 4.2]) add(gp, BOX(), mat(r.color!), Math.cos(a) * 0.08, 0.3, Math.sin(a) * 0.08, 0.03, 0.62, 0.03, 0, Math.sin(a) * 0.15, -Math.cos(a) * 0.15);
  },
  sails: (gp, r) => {
    box(gp, '#b89a7a', 0, 0, 0, 0.8, 0.08, 0.45);
    for (let i = 0; i < 4; i++) add(gp, SPH(8), mat(r.color!), -0.28 + i * 0.18, 0.08, 0, 0.22, 0.6 - i * 0.08, 0.28, 0, 0, -0.5);
  },
  arena: (gp, r) => {
    const m = add(gp, g('arena', () => new THREE.CylinderGeometry(0.45, 0.45, 0.35, 16, 1, true)), mat(r.color!), 0, 0.175, 0, 1, 1, 0.8);
    (m.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
    add(gp, CYL(16), mat('#b89060'), 0, 0.01, 0, 0.8, 0.02, 0.64);
  },
  onions: (gp, r) => {
    const cs = ['#c94a3a', '#3a8a5a', '#e0b030', '#3a6ac0', '#d07030'];
    box(gp, '#b04a3a', 0, 0, 0, 0.6, 0.25, 0.6);
    cs.forEach((c, i) => {
      const a = (i / 4) * Math.PI * 2, x = i === 4 ? 0 : Math.cos(a) * 0.2, z = i === 4 ? 0 : Math.sin(a) * 0.2, h = i === 4 ? 0.55 : 0.4;
      cyl(gp, '#e8dcc0', x, 0.25, z, 0.07, h - 0.1, 6);
      ball(gp, c, x, 0.25 + h, z, 0.18, 0.2, 0.18);
      cone(gp, c, x, 0.32 + h, z, 0.05, 0.12, 6);
    });
  },
  windmill: (gp, r) => {
    cone(gp, r.color!, 0, 0, 0, 0.22, 0.7, 8);
    const hub = new THREE.Group(); hub.position.set(0, 0.55, 0.15); hub.name = 'spin'; gp.add(hub);
    for (let i = 0; i < 4; i++) { const blade = add(hub, BOX(), mat('#f0e8d8'), 0, 0, 0, 0.07, 0.6, 0.01, 0, 0, (i * Math.PI) / 2); blade.geometry = g('bladeoff', () => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)); }
  },
  gate: (gp, r) => {
    const cols = num(r.columns, 6), c = r.color!;
    box(gp, c, 0, 0, 0, 0.9, 0.06, 0.4);
    for (let i = 0; i < cols; i++) cyl(gp, c, -0.38 + (i * 0.76) / (cols - 1), 0.06, 0, 0.035, 0.45, 6);
    box(gp, c, 0, 0.51, 0, 0.9, 0.08, 0.4);
    if (r.roof) add(gp, g('prism', () => new THREE.CylinderGeometry(0.5, 0.5, 1, 3)), mat(c), 0, 0.64, 0, 0.3, 0.9, 0.42, 0, 0, Math.PI / 2);
    else { box(gp, '#4a6a5a', 0, 0.59, 0, 0.2, 0.1, 0.12); }
  },
  spires: (gp, r) => {
    const cnt = num(r.count, 8), c = r.color!;
    box(gp, c, 0, 0, 0, 0.7, 0.25, 0.4);
    for (let i = 0; i < cnt; i++) { const x = -0.3 + (i * 0.6) / (cnt - 1); const h = 0.6 + Math.sin((i / (cnt - 1)) * Math.PI) * 0.4; add(gp, CONE(6), mat(c), x, 0.25 + h / 2, (i % 2) * 0.12 - 0.06, 0.1, h, 0.1); }
  },
  moai: (gp, r) => {
    box(gp, '#8a8072', 0, 0, 0, 1.0, 0.06, 0.25);
    for (let i = 0; i < num(r.count, 5); i++) {
      const x = -0.4 + i * 0.2;
      box(gp, r.color!, x, 0.06, 0, 0.12, 0.45, 0.12);
      box(gp, r.color!, x, 0.51, 0.02, 0.1, 0.12, 0.12);
      box(gp, shade(r.color!, 0.75), x, 0.37, 0.065, 0.03, 0.12, 0.04);
    }
  },
  suspension: (gp, r) => {
    const c = r.color!;
    box(gp, c, 0, 0.2, 0, 1.1, 0.04, 0.12);
    for (const x of [-0.3, 0.3]) { box(gp, c, x, 0, -0.05, 0.05, 0.75, 0.04); box(gp, c, x, 0, 0.05, 0.05, 0.75, 0.04); box(gp, c, x, 0.62, 0, 0.05, 0.04, 0.14); }
    for (const z of [-0.05, 0.05]) {
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.55, 0.24, z), new THREE.Vector3(-0.3, 0.75, z), new THREE.Vector3(0, 0.28, z), new THREE.Vector3(0.3, 0.75, z), new THREE.Vector3(0.55, 0.24, z)]);
      const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.012, 4), mat(c)); gp.add(m);
    }
  },
  ruins: (gp, r) => {
    for (let i = 0; i < 4; i++) box(gp, shade('#5a8a4a', 1 - i * 0.08), 0, i * 0.08, -i * 0.05, 0.9 - i * 0.15, 0.08, 0.6 - i * 0.1);
    for (let i = 0; i < 6; i++) box(gp, r.color!, -0.3 + (i % 3) * 0.3, 0.32, -0.1 + Math.floor(i / 3) * 0.2, 0.12, 0.12, 0.1);
    cone(gp, '#4a7a3a', 0.2, 0.3, -0.35, 0.18, 0.7, 5);
  },
  steppyramid: (gp, r) => {
    for (let i = 0; i < 5; i++) box(gp, shade(r.color!, 1 - i * 0.04), 0, i * 0.12, 0, 0.9 - i * 0.16, 0.12, 0.9 - i * 0.16);
    box(gp, shade(r.color!, 0.8), 0, 0.6, 0, 0.18, 0.14, 0.18);
    box(gp, shade(r.color!, 0.85), 0, 0, 0.3, 0.14, 0.4, 0.3);
  },
  temple: (gp, r) => {
    box(gp, r.color!, 0, 0, 0, 0.9, 0.12, 0.9);
    box(gp, shade(r.color!, 0.95), 0, 0.12, 0, 0.6, 0.15, 0.6);
    const pts: [number, number, number][] = [[0, 0, 0.6], [-0.25, -0.25, 0.4], [0.25, -0.25, 0.4], [-0.25, 0.25, 0.4], [0.25, 0.25, 0.4]];
    for (const [x, z, h] of pts) add(gp, SPH(6), mat(shade(r.color!, 0.9)), x, 0.27 + h / 2, z, 0.14, h, 0.14);
    add(gp, g('ring', () => new THREE.RingGeometry(0.55, 0.68, 4, 1).rotateX(-Math.PI / 2).rotateY(Math.PI / 4)), mat('#4a8ac0'), 0, 0.01, 0, 1, 1, 1);
  },
  leaning: (gp, r) => {
    const t = new THREE.Group(); t.rotation.z = 0.12; gp.add(t);
    for (let i = 0; i < 6; i++) add(t, CYL(12), mat(i % 2 ? shade(r.color!, 0.92) : r.color!), 0, 0.06 + i * 0.12, 0, 0.26, 0.12, 0.26);
    add(t, CYL(12), mat(r.color!), 0, 0.78, 0, 0.2, 0.08, 0.2);
  },
  stones: (gp, r) => {
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; box(gp, r.color!, Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35, 0.09, 0.3, 0.06, -a); }
    for (let i = 0; i < 10; i += 2) { const a = ((i + 0.5) / 10) * Math.PI * 2; box(gp, shade(r.color!, 0.9), Math.cos(a) * 0.35, 0.3, Math.sin(a) * 0.35, 0.26, 0.05, 0.07, -a + Math.PI / 2); }
  },
  skyscraper: (gp, r) => {
    const h = num(r.h, 1.4), c = r.color!;
    if (r.taper) { for (let i = 0; i < 5; i++) box(gp, shade(c, 1 + i * 0.03), 0, (i * h) / 6, 0, 0.32 - i * 0.055, h / 6 + 0.02, 0.32 - i * 0.055); cyl(gp, c, 0, (5 * h) / 6, 0, 0.02, h / 6, 4); }
    else { box(gp, c, 0, 0, 0, 0.3, h * 0.6, 0.3); box(gp, c, 0, h * 0.6, 0, 0.2, h * 0.15, 0.2); box(gp, c, 0, h * 0.75, 0, 0.12, h * 0.1, 0.12); cyl(gp, '#dddddd', 0, h * 0.85, 0, 0.015, h * 0.15, 4); }
    for (let i = 0; i < 6; i++) box(gp, '#ffe9a0', 0, 0.1 + i * h * 0.09, 0.151, 0.2, 0.02, 0.002);
  },
  pagodatower: (gp, r) => {
    box(gp, r.color!, 0, 0, 0, 0.3, 0.25, 0.3);
    for (let i = 0; i < 8; i++) add(gp, g('frust', () => new THREE.CylinderGeometry(0.5, 0.36, 1, 4)), mat(shade(r.color!, 1 + (i % 2) * 0.1)), 0, 0.3 + i * 0.1, 0, 0.36, 0.1, 0.36, Math.PI / 4);
    cyl(gp, r.color!, 0, 1.1, 0, 0.03, 0.2, 4);
  },
  twin: (gp, r) => {
    for (const x of [-0.16, 0.16]) { cyl(gp, r.color!, x, 0, 0, 0.1, 1.0, 8); cone(gp, r.color!, x, 1.0, 0, 0.06, 0.2, 8); }
    box(gp, '#8090a0', 0, 0.45, 0, 0.32, 0.04, 0.06);
  },
  castle: (gp, r) => {
    const roof = (r.roof as string) ?? '#4a6a9a', c = r.color!;
    box(gp, c, 0, 0, 0, 0.6, 0.35, 0.35);
    for (const [x, z, h] of [[-0.3, -0.17, 0.6], [0.3, -0.17, 0.5], [-0.3, 0.17, 0.45], [0.3, 0.17, 0.7], [0.05, 0, 0.8]] as const) { cyl(gp, c, x, 0, z, 0.08, h, 8); cone(gp, roof, x, h, z, 0.1, 0.22, 8); }
  },
  carved: (gp, r) => {
    box(gp, shade(r.color!, 0.8), 0, 0, -0.1, 1.0, 0.85, 0.3);
    box(gp, r.color!, 0, 0.05, 0.05, 0.55, 0.65, 0.05);
    for (let i = 0; i < 4; i++) cyl(gp, shade(r.color!, 1.1), -0.18 + i * 0.12, 0.05, 0.1, 0.025, 0.3, 6);
    add(gp, CONE(8), mat(shade(r.color!, 1.05)), 0, 0.52, 0.1, 0.16, 0.14, 0.06);
    cyl(gp, shade(r.color!, 1.05), 0, 0.38, 0.1, 0.06, 0.14, 8);
  },
  palace: (gp, r) => {
    const roof = (r.roof as string) ?? '#e0b23a';
    box(gp, '#d8d0c0', 0, 0, 0, 0.9, 0.06, 0.6);
    box(gp, r.color!, 0, 0.06, 0, 0.6, 0.2, 0.35);
    add(gp, g('hip', () => new THREE.CylinderGeometry(0.0, 0.7, 1, 4).rotateY(Math.PI / 4)), mat(roof), 0, 0.36, 0, 1.0, 0.2, 0.55);
    box(gp, r.color!, 0, 0.42, 0, 0.35, 0.1, 0.2);
    add(gp, g('hip', () => new THREE.CylinderGeometry(0.0, 0.7, 1, 4).rotateY(Math.PI / 4)), mat(roof), 0, 0.58, 0, 0.6, 0.16, 0.33);
  },
  bascule: (gp, r) => {
    const c = r.color!;
    for (const x of [-0.25, 0.25]) { box(gp, '#d8d0c0', x, 0, 0, 0.16, 0.6, 0.16); cone(gp, '#5a6a7a', x, 0.6, 0, 0.1, 0.15, 4); }
    box(gp, c, 0, 0.5, 0, 0.36, 0.04, 0.08);
    box(gp, c, -0.55, 0.12, 0, 0.45, 0.04, 0.14); box(gp, c, 0.55, 0.12, 0, 0.45, 0.04, 0.14); box(gp, c, 0, 0.12, 0, 0.34, 0.04, 0.14);
  },
  canyon: (gp, r) => {
    for (let i = 0; i < 4; i++) { box(gp, shade(r.color!, 1 - i * 0.07), -0.33, i * 0.08, 0, 0.36 - i * 0.03, 0.08, 0.8); box(gp, shade(r.color!, 1 - i * 0.07), 0.33, i * 0.08, 0, 0.36 - i * 0.03, 0.08, 0.8); }
    box(gp, '#3a8ac0', 0, 0, 0, 0.18, 0.02, 0.8);
  },
  waterfall: (gp, r) => {
    const w = r.wide ? 0.9 : 0.5;
    box(gp, '#6a7a5a', 0, 0, -0.25, w + 0.2, 0.5, 0.2);
    box(gp, r.color!, 0, 0.05, -0.14, w, 0.45, 0.03).material = mat(r.color!, { transparent: 0.85, emissive: '#204060' });
    add(gp, CYL(12), mat('#5aa0d0'), 0, 0.02, 0.1, w + 0.1, 0.04, 0.4);
    ball(gp, '#ffffff', 0, 0.08, -0.05, w * 0.6, 0.12, 0.2).material = mat('#ffffff', { transparent: 0.6 });
  },
  rock: (gp, r) => {
    add(gp, SPH(9), mat(r.color!), 0, 0.12, 0, 1.0, 0.36, 0.5);
  },
  reef: (gp, r) => {
    const cs = [r.color!, '#ffb347', '#d07ae0', '#ff5f7a', '#7ae0c0'];
    for (let i = 0; i < 9; i++) { const a = i * 2.4, d = 0.1 + (i % 3) * 0.12; ball(gp, cs[i % cs.length], Math.cos(a) * d, 0.08, Math.sin(a) * d, 0.18, 0.22, 0.18); }
    for (let i = 0; i < 4; i++) cyl(gp, cs[(i + 2) % cs.length], -0.2 + i * 0.13, 0, 0.2 - i * 0.1, 0.02, 0.3, 5);
  },
  pagoda: (gp, r) => {
    const fl = num(r.floors, 3);
    box(gp, '#8a7a6a', 0, 0, 0, 0.6, 0.05, 0.6);
    for (let i = 0; i < fl; i++) { box(gp, r.color!, 0, 0.05 + i * 0.22, 0, 0.4 - i * 0.06, 0.15, 0.4 - i * 0.06); add(gp, g('hip', () => new THREE.CylinderGeometry(0.0, 0.7, 1, 4).rotateY(Math.PI / 4)), mat('#3a3a3a'), 0, 0.24 + i * 0.22, 0, 0.75 - i * 0.1, 0.1, 0.75 - i * 0.1); }
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
