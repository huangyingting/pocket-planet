/**
 * The scales above the Solar System, drawn by the Solar view's renderer: the Milky Way, the Local Group, the
 * Laniakea Supercluster and the observable universe. Each level is its own scene in galactic coordinates
 * (three.js (x, z, −y), so the galactic plane is XZ) with its own unit, built on first visit. Everything is additive
 * light on black, so levels cross-fade simply by scaling their brightness. See ADR-017.
 */
import * as THREE from 'three';
import { DEEP_OBJECTS, type DeepObject, type DeepScale, type DeepKind } from '../../shared/data/cosmos.ts';
import { galVec, NCP_GAL } from '../../shared/lib/sky.ts';
import type { Vec3 } from '../../shared/lib/orbits.ts';
import { tr } from '../../shared/data/types.ts';
import { lang, t } from '../lib/i18n.ts';
import type { Quality } from '../globe/quality.ts';
import { MILKY_WAY, genericSpiral, gauss, glowCanvas, hashStr, paintBlob, paintCMB, paintDisc, paintNebula, rng, sampleDisc, type DiscDef, type StarCloud } from './cosmos-paint.ts';

const D2R = Math.PI / 180;
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

export interface LevelDef {
  /** Light-years per scene unit. */
  unit: number;
  /** Zooming in on the home spot below this distance (ly) goes down a scale; out past `upLy` goes up one. */
  downLy: number; upLy: number;
  /** Resting camera distance (ly) and elevation. */
  defLy: number; el: number;
}
export const LEVELS: Record<DeepScale, LevelDef> = {
  galaxy: { unit: 1e3, downLy: 260, upLy: 3.4e5, defLy: 1.25e5, el: 0.9 },
  group: { unit: 2e4, downLy: 2.3e5, upLy: 1.1e7, defLy: 6.2e6, el: 0.42 },
  laniakea: { unit: 1e6, downLy: 7e6, upLy: 1.6e9, defLy: 8.5e8, el: 0.5 },
  // We sit at the centre of our own observable universe: the camera stays inside the CMB shell (465 units), so it fills the sky.
  universe: { unit: 1e8, downLy: 1.1e9, upLy: 4.3e10, defLy: 3.3e10, el: 0.32 },
};
/** Distance (ly) from the Sun to the Galactic Centre (Sgr A*). */
export const GC_LY = 26_670;
const CMB_R = 465;
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/** Galactic (ly from the Sun) → three.js scene units for a level. */
export function scenePos(l: number, b: number, distLy: number, lv: DeepScale, out = new THREE.Vector3()): THREE.Vector3 {
  const g = galVec(l, b, distLy), u = LEVELS[lv].unit;
  out.set(g[0], g[2], -g[1]).divideScalar(u);
  // The Milky Way and Local Group scenes are centred on the Galactic Centre.
  if (lv === 'galaxy' || lv === 'group') out.x -= GC_LY / u;
  return out;
}
const galToThree = (v: Vec3) => new THREE.Vector3(v[0], v[2], -v[1]);

const KIND_COLOR: Record<DeepKind, string> = {
  blackhole: '#ffb86b', arm: '#7dd3fc', nebula: '#f9a8d4', remnant: '#fdba74', starcluster: '#93c5fd', globular: '#fde68a', star: '#fef3c7',
  galaxy: '#c4b5fd', dwarf: '#a5b4fc', group: '#a7f3d0', cluster: '#fcd34d', supercluster: '#fda4af', wall: '#f9a8d4', void: '#94a3b8',
  quasar: '#67e8f9', cmb: '#fca5a5', deepfield: '#e9d5ff',
};
export const kindColor = (k: DeepKind) => KIND_COLOR[k] ?? '#e5e7eb';

/** Known disc orientations: position angle and inclination (deg), matched against the object's key. */
const ORIENT: [RegExp, number, number][] = [
  [/m31|andromeda_galaxy|andromeda$/, 38, 77], [/m33|triangulum/, 23, 54], [/lmc|large_magellanic/, 170, 34], [/m81|bode/, 157, 59],
  [/m101|pinwheel/, 39, 18], [/m51|whirlpool/, 163, 22], [/sombrero|m104/, 90, 84], [/centaurus_a|ngc_?5128/, 35, 70], [/m82|cigar/, 65, 80],
];

const POINT_VS = /* glsl */ `
attribute float aSize; attribute vec3 aColor;
uniform float uScale; uniform float uFade; uniform float uMinPx; uniform float uPr; uniform float uGain; uniform float uMaxPx;
uniform float uTime;
#ifdef FLOW
attribute vec3 aEnd; attribute float aPhase;
#endif
varying vec3 vC;
void main() {
  vec3 p = position; float k = 1.0;
#ifdef FLOW
  float f = fract(uTime * 0.035 + aPhase);
  p = mix(position, aEnd, f * f * (3.0 - 2.0 * f) * 0.85 + f * 0.15);
  k = sin(3.14159 * f);
#endif
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
#ifdef SCREEN
  gl_PointSize = aSize * uPr;
#else
  float px = aSize * uScale / max(1e-6, -mv.z);
  float d = clamp(px / uMinPx, 0.0, 1.0);
  k *= d * d;
  // Big (close) sprites spread their light: dimmer per pixel, so a crowded disc doesn't burn out to white.
  k *= clamp(pow(2.2 * uPr / max(px, uMinPx), 1.6), 0.1, 1.0);
  gl_PointSize = clamp(px, uMinPx, uMaxPx * uPr);
#endif
#ifdef TWINKLE
  float h = fract(sin(dot(position, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  k *= 0.72 + 0.28 * sin(uTime * (1.2 + 2.6 * h) + h * 60.0);
#endif
  vC = aColor * uFade * uGain * k;
}`;
const POINT_FS = /* glsl */ `
varying vec3 vC;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float a = exp(-dot(d, d) * 14.0) - 0.03;
  if (a <= 0.0) discard;
  gl_FragColor = vec4(vC * a, 1.0);
  #include <colorspace_fragment>
}`;
const CMB_VS = /* glsl */ `
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main() { vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const CMB_FS = /* glsl */ `
uniform sampler2D uMap; uniform float uFade; uniform float uR;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main() {
  float mu = abs(dot(normalize(vN), normalize(cameraPosition - vW)));
  float inside = step(length(cameraPosition), uR);
  // From inside (where we really are) the CMB is the infinitely distant sky: sample by view direction, not by the shell.
  vec3 d = normalize(vW - cameraPosition);
  vec2 uv = inside > 0.5 ? vec2(atan(d.z, d.x) * 0.1591549 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.3183099 + 0.5) : vUv;
  float a = mix(0.02 + 0.3 * pow(1.0 - mu, 3.0), 0.11, inside);
  gl_FragColor = vec4(texture2D(uMap, uv).rgb * a * uFade, 1.0);
  #include <colorspace_fragment>
}`;

interface ObjRT { o: DeepObject; pos: THREE.Vector3; label: HTMLButtonElement; rank: number }
interface LevelRT {
  id: DeepScale;
  def: LevelDef;
  scene: THREE.Scene;
  labels: HTMLDivElement;
  objs: ObjRT[];
  homeLabel: HTMLButtonElement;
  home: THREE.Vector3;
  defTarget: THREE.Vector3;
  target: THREE.Vector3;
  dist: number;
  tween: { t: number; dur: number; fromT: THREE.Vector3; toT: THREE.Vector3; fromD: number; toD: number } | null;
  /** Point materials (fade + scale uniforms) and other materials with a base opacity. */
  pts: THREE.ShaderMaterial[];
  fades: [THREE.Material & { opacity: number }, number][];
  cmb?: THREE.ShaderMaterial;
  w: number;
  /** Everything that turns with the level's own rotation (galaxy level: the whole Milky Way about its centre). */
  root: THREE.Group;
  /** rad/s about +y for `root` (positions, home and camera target are carried along). */
  spin: number;
  /** Accumulated `spin` (rad). */
  angle: number;
  /** Objects spinning about their own local y (galaxy discs about their normals), rad/s. */
  spinners: [THREE.Object3D, number][];
  pulse?: THREE.Sprite;
}

export interface DeepEvents {
  onSelect?: (o: DeepObject | null) => void;
  /** Zoomed in on the home spot (go down one scale) / out past the level (go up one). */
  onDown?: () => void;
  onUp?: () => void;
}

const HOME_KEY: Record<DeepScale, RegExp> = {
  galaxy: /^$/,
  group: /milky_way|milkyway/,
  laniakea: /local_group/,
  universe: /laniakea/,
};

export class DeepStage {
  readonly camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
  private levels = new Map<DeepScale, LevelRT>();
  private layer: HTMLDivElement;
  level: DeepScale = 'galaxy';
  sel: DeepObject | null = null;
  az = 0.6; el = 0.6;
  private time = 0;
  private mwCloud: StarCloud | null = null;
  private mwTex: THREE.CanvasTexture | null = null;
  private screen = { w: 1, h: 1, pr: 1 };
  private placed: { o: DeepObject | 'home'; x: number; y: number }[] = [];

  constructor(root: HTMLElement, readonly quality: Quality, public ev: DeepEvents) {
    this.layer = document.createElement('div');
    this.layer.className = 'deep-labels';
    root.append(this.layer);
  }

  /** How far the Milky Way has turned (rad about +y): camera angles in galactic coordinates are relative to it. */
  get galSpin(): number { return this.levels.get('galaxy')?.angle ?? 0; }

  /** How far the current level's camera sits from its target, in light-years (≈ the width of the view). */
  spanLy(): number {
    const L = this.levels.get(this.level);
    return L ? L.dist * L.def.unit : 0;
  }

  private get n(): number { return this.quality.tier === 'high' ? 1 : this.quality.tier === 'medium' ? 0.42 : 0.28; }

  // ---------- building ----------
  private ensure(id: DeepScale): LevelRT {
    let L = this.levels.get(id);
    if (L) return L;
    const labels = document.createElement('div');
    labels.className = 'deep-level';
    labels.hidden = true;
    this.layer.append(labels);
    const homeLabel = document.createElement('button');
    homeLabel.className = 'dl-label home';
    homeLabel.dataset.testid = 'deep-home';
    homeLabel.onclick = () => this.ev.onDown?.();
    labels.append(homeLabel);
    L = { id, def: LEVELS[id], scene: new THREE.Scene(), labels, objs: [], homeLabel, home: new THREE.Vector3(), defTarget: new THREE.Vector3(),
      target: new THREE.Vector3(), dist: LEVELS[id].defLy / LEVELS[id].unit, tween: null, pts: [], fades: [], w: 0, root: new THREE.Group(), spin: 0, angle: 0, spinners: [] };
    L.scene.add(L.root);
    this.levels.set(id, L);
    if (id === 'galaxy') this.buildGalaxy(L);
    else if (id === 'group') this.buildGroup(L);
    else if (id === 'laniakea') this.buildLaniakea(L);
    else this.buildUniverse(L);
    for (const o of DEEP_OBJECTS) {
      if (o.scale !== id || HOME_KEY[id].test(o.key)) continue;
      const label = document.createElement('button');
      label.className = 'dl-label k-' + o.kind;
      label.dataset.testid = o.key;
      label.style.setProperty('--c', kindColor(o.kind));
      label.innerHTML = '<i></i><span></span>';
      label.onclick = () => this.select(o);
      labels.append(label);
      L.objs.push({ o, pos: scenePos(o.l, o.b, o.distLy, id), label, rank: o.rank ?? 1 });
    }
    this.addMarkers(L);
    L.target.copy(L.defTarget);
    this.relabel();
    return L;
  }

  private pointsMat(L: LevelRT, defines: Record<string, string> = {}): THREE.ShaderMaterial {
    const m = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 1 }, uFade: { value: 1 }, uMinPx: { value: 1.4 }, uPr: { value: 1 }, uGain: { value: 1 }, uMaxPx: { value: this.quality.tier === 'high' ? 40 : 22 }, uTime: { value: 0 } },
      vertexShader: POINT_VS, fragmentShader: POINT_FS, defines,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    });
    L.pts.push(m);
    return m;
  }

  private points(L: LevelRT, pos: Float32Array, col: Float32Array, size: Float32Array, n = size.length, defines: Record<string, string> = {}, extra?: (g: THREE.BufferGeometry) => void): THREE.Points {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, n * 3), 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col.subarray(0, n * 3), 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size.subarray(0, n), 1));
    extra?.(g);
    const p = new THREE.Points(g, this.pointsMat(L, defines));
    p.frustumCulled = false;
    L.root.add(p);
    return p;
  }

  private fadeMat<M extends THREE.Material & { opacity: number }>(L: LevelRT, m: M): M { L.fades.push([m, m.opacity]); return m; }

  /** Glowing textured disc (a galaxy seen in 3D) lying in the plane with the given normal. */
  private disc(L: LevelRT, tex: THREE.Texture, size: number, at: THREE.Vector3, normal: THREE.Vector3, opacity: number, spin = 0): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2),
      this.fadeMat(L, new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, side: THREE.DoubleSide })));
    m.position.copy(at);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal.clone().normalize());
    m.rotateY(spin);
    L.root.add(m);
    return m;
  }

  private sprite(L: LevelRT, tex: THREE.Texture, size: number, at: THREE.Vector3, color: string | number, opacity: number): THREE.Sprite {
    const s = new THREE.Sprite(this.fadeMat(L, new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false })));
    s.position.copy(at);
    s.scale.setScalar(size);
    L.root.add(s);
    return s;
  }

  private milkyWay(): { cloud: StarCloud; tex: THREE.CanvasTexture } {
    if (!this.mwCloud) {
      this.mwCloud = sampleDisc(MILKY_WAY, Math.round(90_000 * this.n), 42, 0.42);
      const S = this.quality.tier === 'low' ? 256 : 512;
      this.mwTex = new THREE.CanvasTexture(paintDisc(MILKY_WAY, this.mwCloud, S, 1.1));
      this.mwTex.colorSpace = THREE.SRGBColorSpace;
    }
    return { cloud: this.mwCloud, tex: this.mwTex! };
  }

  /** Disc → three (x, z, −y) in place, scaled. */
  private static discToThree(c: StarCloud, k: number): Float32Array {
    const out = new Float32Array(c.n * 3);
    for (let i = 0; i < c.n; i++) { out[i * 3] = c.pos[i * 3] * k; out[i * 3 + 1] = c.pos[i * 3 + 2] * k; out[i * 3 + 2] = -c.pos[i * 3 + 1] * k; }
    return out;
  }

  private buildGalaxy(L: LevelRT): void {
    const { cloud, tex } = this.milkyWay();
    this.disc(L, tex, MILKY_WAY.R * 2, new THREE.Vector3(), new THREE.Vector3(0, 1, 0), 0.45);
    gain(this.points(L, DeepStage.discToThree(cloud, 1), cloud.col, cloud.size, cloud.n, { TWINKLE: '' }), 0.3);
    // The whole Galaxy turns about its centre (clockwise seen from the north, the Sun heading for l = 90°);
    // sped up enormously: one turn every ~9 minutes instead of 230 million years.
    L.spin = -0.012;
    // Halo: old globular clusters and faint halo stars
    const r = rng(9), nh = Math.round(2400 * this.n);
    const hp = new Float32Array(nh * 3), hc = new Float32Array(nh * 3), hs = new Float32Array(nh);
    for (let i = 0; i < nh; i++) {
      const R = 6 + Math.abs(gauss(r)) * 32, th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1);
      hp.set([R * Math.sin(ph) * Math.cos(th), R * Math.cos(ph) * 0.8, R * Math.sin(ph) * Math.sin(th)], i * 3);
      const glob = i % 12 === 0;
      hc.set(glob ? [1, 0.85, 0.55] : [0.5, 0.48, 0.45], i * 3);
      hs[i] = glob ? 0.9 : 0.35;
    }
    this.points(L, hp, hc, hs, nh, { TWINKLE: '' });
    const sun = scenePos(0, 0, 0, 'galaxy');
    L.home.copy(sun);
    L.defTarget.set(0, 0, 0);
    // "You are here" glow around the Sun
    this.sprite(L, new THREE.CanvasTexture(glowCanvas()), 1.6, sun, '#ffe9a8', 0.9);
    // Sgr A*: a softly breathing glow at the very centre
    L.pulse = this.sprite(L, new THREE.CanvasTexture(glowCanvas()), 2.4, new THREE.Vector3(), '#ffb86b', 0.6);
    // Nebulae glow pink, remnants orange: a soft sprite under their markers
    const glow = new THREE.CanvasTexture(glowCanvas());
    for (const o of DEEP_OBJECTS) {
      if (o.scale !== 'galaxy' || (o.kind !== 'nebula' && o.kind !== 'remnant' && o.kind !== 'starcluster')) continue;
      this.sprite(L, glow, Math.max(0.35, Math.min(1.6, (o.sizeLy ?? 100) / 120)), scenePos(o.l, o.b, o.distLy, 'galaxy'), kindColor(o.kind), 0.5);
    }
  }

  private buildGroup(L: LevelRT): void {
    const u = L.def.unit;
    const { cloud, tex } = this.milkyWay();
    const k = 1e3 / u;
    const mw = this.disc(L, tex, MILKY_WAY.R * 2 * k, new THREE.Vector3(), new THREE.Vector3(0, 1, 0), 0.95);
    const sub = Math.min(cloud.n, Math.round(14_000 * this.n));
    const mwPts = this.points(L, DeepStage.discToThree(cloud, k), cloud.col, cloud.size.map(s => s * k * 2.2), sub);
    L.spinners.push([mw, -0.03], [mwPts, -0.03]);
    L.home.set(0, 0, 0);
    let m31: THREE.Vector3 | null = null;
    const r = rng(5);
    for (const o of DEEP_OBJECTS) {
      if (o.scale !== 'group' || HOME_KEY.group.test(o.key)) continue;
      const at = scenePos(o.l, o.b, o.distLy, 'group');
      if (/m31|andromeda_galaxy/.test(o.key) && !m31) m31 = at.clone();
      if (o.kind !== 'galaxy' && o.kind !== 'dwarf') {
        if (o.kind === 'nebula') this.sprite(L, new THREE.CanvasTexture(glowCanvas()), 0.5, at, kindColor('nebula'), 0.6);
        continue;
      }
      const size = Math.max(0.5, (o.sizeLy ?? 3000) / u);
      const seed = hashStr(o.key);
      if (o.morph === 'spiral' || o.morph === 'barred') {
        const def = genericSpiral(2, 13 + (seed % 9), o.morph === 'barred', seed);
        const c = sampleDisc(def, 9000, seed, 0.02);
        const tx = new THREE.CanvasTexture(paintDisc(def, c, 256, 1.3));
        tx.colorSpace = THREE.SRGBColorSpace;
        L.spinners.push([this.disc(L, tx, size, at, this.discNormal(o, r), 1, r() * 6), (seed % 2 ? 1 : -1) * (0.02 + (seed % 7) * 0.004)]);
      } else {
        const tx = new THREE.CanvasTexture(paintBlob(o.morph ?? 'dwarf', 128, seed));
        tx.colorSpace = THREE.SRGBColorSpace;
        if (o.morph === 'irregular') this.disc(L, tx, size, at, this.discNormal(o, r), 0.95, r() * 6);
        else this.sprite(L, tx, size, at, '#ffffff', o.morph === 'dwarf' ? 0.7 : 1);
      }
    }
    L.defTarget.copy(m31 ?? new THREE.Vector3(60, -40, -90)).multiplyScalar(0.42);
    this.backdrop(L, 2400, 1600, 0.9);
  }

  /** Disc normal from the sky position angle / inclination (or a seeded random one). */
  private discNormal(o: DeepObject, r: () => number): THREE.Vector3 {
    const hit = ORIENT.find(([re]) => re.test(o.key));
    if (!hit) return new THREE.Vector3(gauss(r), gauss(r), gauss(r)).normalize();
    const [, pa, inc] = hit;
    const p = new THREE.Vector3(...galVec(o.l, o.b));
    const ncp = new THREE.Vector3(...NCP_GAL);
    const north = ncp.clone().addScaledVector(p, -ncp.dot(p)).normalize();
    const east = ncp.clone().cross(p).normalize();
    const major = north.multiplyScalar(Math.cos(pa * D2R)).addScaledVector(east, Math.sin(pa * D2R));
    const minor = p.clone().cross(major).normalize();
    const n = p.multiplyScalar(Math.cos(inc * D2R)).addScaledVector(minor, Math.sin(inc * D2R));
    return galToThree([n.x, n.y, n.z]);
  }

  /** Faint, very distant galaxies all around (a sense of depth). */
  private backdrop(L: LevelRT, n: number, R: number, size: number): void {
    const r = rng(77 + n), N = Math.round(n * this.n);
    const p = new Float32Array(N * 3), c = new Float32Array(N * 3), s = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3(gauss(r), gauss(r), gauss(r)).normalize().multiplyScalar(R * (0.7 + r() * 0.6));
      p.set([v.x, v.y, v.z], i * 3);
      const w = 0.25 + r() * 0.35;
      c.set(r() < 0.5 ? [w, w * 0.92, w * 0.8] : [w * 0.8, w * 0.88, w], i * 3);
      s[i] = size * (0.6 + r() * 1.2);
    }
    this.points(L, p, c, s);
  }

  /**
   * A cosmic web: nodes (known clusters plus random ones) linked to their nearest neighbours, galaxies strung
   * along the links and piled up in the nodes.
   */
  private web(L: LevelRT, opts: { R: number; nodes: THREE.Vector3[]; extra: number; n: number; width: number; size: number; seed: number; centre?: THREE.Vector3; maxLink: number }): THREE.Vector3[] {
    const r = rng(opts.seed);
    const nodes = [...opts.nodes];
    const c0 = opts.centre ?? new THREE.Vector3();
    for (let i = 0; i < opts.extra; i++) {
      const v = new THREE.Vector3(gauss(r), gauss(r), gauss(r)).normalize().multiplyScalar(opts.R * Math.cbrt(r())).add(c0);
      nodes.push(v);
    }
    const links: [number, number][] = [];
    nodes.forEach((a, i) => {
      const near = nodes.map((b, j) => [j, a.distanceTo(b)] as const).filter(([j, d]) => j !== i && d < opts.maxLink).sort((x, y) => x[1] - y[1]).slice(0, 3);
      for (const [j] of near) if (!links.some(([x, y]) => (x === j && y === i))) links.push([i, j]);
    });
    const N = Math.round(opts.n * this.n);
    const p = new Float32Array(N * 3), c = new Float32Array(N * 3), s = new Float32Array(N);
    const tmp = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      let w = opts.width, bright = 0.35 + r() * 0.4;
      if (i % 4 === 0) { // node blobs
        tmp.copy(nodes[Math.floor(r() * nodes.length)]);
        w *= 1.6; bright *= 1.25;
      } else {
        const [a, b] = links[Math.floor(r() * links.length)] ?? [0, 0];
        tmp.lerpVectors(nodes[a], nodes[b], r());
      }
      tmp.x += gauss(r) * w; tmp.y += gauss(r) * w; tmp.z += gauss(r) * w;
      if (tmp.distanceTo(c0) > opts.R * 1.15) { i--; continue; }
      p.set([tmp.x, tmp.y, tmp.z], i * 3);
      const tt = r();
      const col = tt < 0.45 ? [1, 0.82, 0.6] : tt < 0.8 ? [0.75, 0.82, 1] : [1, 0.95, 0.9];
      c.set([col[0] * bright, col[1] * bright, col[2] * bright], i * 3);
      s[i] = opts.size * (0.6 + r() * 1.1);
    }
    gain(this.points(L, p, c, s), 0.4);
    return nodes;
  }

  private buildLaniakea(L: LevelRT): void {
    const known: THREE.Vector3[] = [];
    let ga: THREE.Vector3 | null = null;
    for (const o of DEEP_OBJECTS) {
      if (o.scale !== 'laniakea' || !['cluster', 'group', 'supercluster'].includes(o.kind)) continue;
      const v = scenePos(o.l, o.b, o.distLy, 'laniakea');
      known.push(v);
      if (/norma|great_attractor/.test(o.key) && !ga) ga = v.clone();
    }
    ga ??= scenePos(307, 9, 2.5e8, 'laniakea');
    const centre = ga.clone().multiplyScalar(0.8);
    this.web(L, { R: 420, nodes: known, extra: 150, n: 46_000, width: 7, size: 2.4, seed: 11, centre, maxLink: 170 });
    // Galaxies streaming toward the Great Attractor (the "immeasurable heaven" basin)
    const r = rng(3), N = Math.round(2600 * this.n);
    const p = new Float32Array(N * 3), c = new Float32Array(N * 3), s = new Float32Array(N), e = new Float32Array(N * 3), ph = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3(gauss(r), gauss(r) * 0.6, gauss(r)).normalize().multiplyScalar(265 * Math.cbrt(0.15 + r() * 0.85)).add(centre);
      p.set([v.x, v.y, v.z], i * 3);
      const end = v.clone().lerp(ga, 0.55 + r() * 0.25);
      e.set([end.x, end.y, end.z], i * 3);
      c.set([0.35, 0.75, 1], i * 3);
      s[i] = 2.6;
      ph[i] = r();
    }
    this.points(L, p, c, s, N, { FLOW: '' }, g => {
      g.setAttribute('aEnd', new THREE.BufferAttribute(e, 3));
      g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    });
    // The basin's edge: a faint, lumpy shell
    const NS = Math.round(1800 * this.n), sp = new Float32Array(NS * 3), sc = new Float32Array(NS * 3), ss = new Float32Array(NS);
    for (let i = 0; i < NS; i++) {
      const v = new THREE.Vector3(gauss(r), gauss(r), gauss(r)).normalize();
      const rad = 265 * (1 + 0.16 * Math.sin(v.x * 5 + 1) * Math.cos(v.z * 4) + 0.08 * Math.sin(v.y * 7));
      v.multiplyScalar(rad).add(centre);
      sp.set([v.x, v.y, v.z], i * 3);
      sc.set([0.25, 0.5, 0.75], i * 3);
      ss[i] = 3;
    }
    this.points(L, sp, sc, ss);
    L.home.set(0, 0, 0);
    L.defTarget.copy(centre).multiplyScalar(0.55);
    this.sprite(L, new THREE.CanvasTexture(glowCanvas()), 14, new THREE.Vector3(), '#a7f3d0', 0.8);
  }

  private buildUniverse(L: LevelRT): void {
    const known: THREE.Vector3[] = [];
    for (const o of DEEP_OBJECTS) {
      if (o.scale !== 'universe' || o.kind === 'cmb' || o.kind === 'void' || o.kind === 'deepfield' || o.distLy > 3e9) continue;
      known.push(scenePos(o.l, o.b, o.distLy, 'universe'));
    }
    // a finer web close to home (where the named superclusters are) inside the coarse web of the whole bubble
    this.web(L, { R: 40, nodes: known, extra: 90, n: 16_000, width: 0.55, size: 0.5, seed: 21, maxLink: 14 });
    this.web(L, { R: CMB_R * 0.97, nodes: [], extra: 520, n: 52_000, width: 3.2, size: 3.4, seed: 23, maxLink: 120 });
    const tex = new THREE.CanvasTexture(paintCMB(this.quality.tier === 'low' ? 512 : 1024));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = false; // no mip seam where the view-direction longitude wraps
    tex.minFilter = THREE.LinearFilter;
    const cmb = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: tex }, uFade: { value: 1 }, uR: { value: CMB_R } }, vertexShader: CMB_VS, fragmentShader: CMB_FS,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    L.cmb = cmb;
    L.scene.add(new THREE.Mesh(new THREE.SphereGeometry(CMB_R, 96, 48), cmb));
    L.home.set(0, 0, 0);
    L.defTarget.set(0, 0, 0);
    this.sprite(L, new THREE.CanvasTexture(glowCanvas()), 7, new THREE.Vector3(), '#a7f3d0', 0.9);
  }

  /** Bright screen-size markers on every named object. */
  private addMarkers(L: LevelRT): void {
    const n = L.objs.length + 1;
    const p = new Float32Array(n * 3), c = new Float32Array(n * 3), s = new Float32Array(n), col = new THREE.Color();
    L.objs.forEach((x, i) => {
      p.set([x.pos.x, x.pos.y, x.pos.z], i * 3);
      col.set(kindColor(x.o.kind));
      c.set([col.r, col.g, col.b], i * 3);
      s[i] = x.o.kind === 'cmb' || x.o.kind === 'void' ? 0 : 5 + x.rank * 2;
    });
    p.set([L.home.x, L.home.y, L.home.z], (n - 1) * 3);
    c.set([1, 0.95, 0.7], (n - 1) * 3);
    s[n - 1] = 10;
    this.points(L, p, c, s, n, { SCREEN: '' });
  }

  // ---------- camera ----------
  /** Puts level `id` in charge. `how`: arriving from the scale below (zooming out), above (zooming in), or a jump. */
  enter(id: DeepScale, how: 'up' | 'down' | 'jump', fromLy?: number): void {
    const L = this.ensure(id);
    this.level = id;
    this.sel = null;
    const def = L.def, toD = def.defLy / def.unit;
    if (how === 'up') {
      L.target.copy(L.home);
      L.dist = Math.max(def.downLy * 1.5, Math.min(def.defLy * 0.5, fromLy ?? def.downLy * 2)) / def.unit;
      this.tweenTo(L, L.defTarget, toD, 2600);
    } else if (how === 'down') {
      L.target.copy(L.home);
      L.dist = Math.min(def.upLy * 0.8, fromLy ?? def.upLy * 0.6) / def.unit;
      this.tweenTo(L, L.defTarget, toD, 2200);
    } else {
      L.target.copy(L.defTarget);
      L.dist = Math.min(toD * 2.2, def.upLy / def.unit);
      this.tweenTo(L, L.defTarget, toD, 1800);
      this.el = def.el * 0.8;
    }
    if (how !== 'jump') this.tweenEl = { from: this.el, to: def.el, t: 0 };
    this.relabel();
  }
  private tweenEl: { from: number; to: number; t: number } | null = null;

  private tweenTo(L: LevelRT, to: THREE.Vector3, toD: number, dur: number): void {
    L.tween = { t: 0, dur, fromT: L.target.clone(), toT: to.clone(), fromD: L.dist, toD };
  }

  get current(): LevelRT { return this.ensure(this.level); }
  /** Camera distance of the active level in light-years. */
  get distLy(): number { const L = this.current; return L.dist * L.def.unit; }
  get busy(): boolean { return Boolean(this.current.tween || this.tweenEl); }

  select(o: DeepObject | null, emit = true): void {
    const L = this.current;
    this.sel = o;
    if (o) {
      const x = L.objs.find(v => v.o === o);
      if (!x) return;
      const want = Math.max(L.def.downLy * 1.4, Math.min(L.def.defLy * 0.4, (o.sizeLy ?? L.def.defLy * 0.05) * 3.2)) / L.def.unit;
      this.tweenTo(L, x.pos, o.kind === 'cmb' ? L.def.defLy / L.def.unit : want, 1500);
    }
    if (emit) this.ev.onSelect?.(o);
  }

  /** Back to the level's resting view. */
  overview(): void {
    const L = this.current;
    this.sel = null;
    this.tweenTo(L, L.defTarget, L.def.defLy / L.def.unit, 1400);
  }

  /** Last user input (ms): after a while without any, the camera drifts round on its own. */
  private input = 0;

  rotate(dx: number, dy: number): void {
    this.input = performance.now();
    this.current.tween = null;
    this.az -= dx * 0.005;
    this.el = Math.max(-1.45, Math.min(1.45, this.el + dy * 0.005));
    this.tweenEl = null;
  }

  zoomBy(f: number): void {
    this.input = performance.now();
    const L = this.current, def = L.def;
    if (L.tween) { L.target.copy(L.tween.toT); L.tween = null; }
    if (f < 1 && !this.sel) L.target.lerp(L.home, Math.min(1, (1 - f) * 1.4));
    const nearHome = L.target.distanceTo(L.home) < L.dist * 0.25;
    L.dist *= f;
    const ly = L.dist * def.unit;
    if (f < 1 && ly < def.downLy) {
      if (nearHome && !this.sel) { this.ev.onDown?.(); return; }
      L.dist = def.downLy / def.unit;
    }
    if (f > 1 && ly > def.upLy) {
      if (this.level !== 'universe') { this.ev.onUp?.(); return; }
      L.dist = def.upLy / def.unit;
    }
  }

  /** Nearest label or marker within 18 px. */
  pickAt(x: number, y: number): DeepObject | 'home' | null {
    let best: DeepObject | 'home' | null = null, bd = 18;
    for (const p of this.placed) { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p.o; } }
    return best;
  }

  // ---------- frame ----------
  /** Advances tweens of every visible level (`dt` in ms). */
  update(dt: number): void {
    this.time += dt / 1000;
    const sec = dt / 1000;
    // Idle: a slow cinematic orbit, easing in.
    const idle = (performance.now() - this.input - 6000) / 4000;
    if (idle > 0 && !this.current.tween) this.az += sec * 0.022 * Math.min(1, idle);
    for (const L of this.levels.values()) {
      if (L.spin) {
        const q = new THREE.Quaternion().setFromAxisAngle(Y_AXIS, L.spin * sec);
        L.root.quaternion.premultiply(q);
        L.angle = (L.angle + L.spin * sec) % (Math.PI * 2);
        for (const x of L.objs) x.pos.applyQuaternion(q);
        for (const v of [L.home, L.target, L.defTarget]) v.applyQuaternion(q);
        if (L.tween) { L.tween.fromT.applyQuaternion(q); L.tween.toT.applyQuaternion(q); }
      }
      for (const [o, w] of L.spinners) o.rotateY(w * sec);
    }
    if (this.tweenEl) {
      this.tweenEl.t = Math.min(1, this.tweenEl.t + dt / 2200);
      this.el = this.tweenEl.from + (this.tweenEl.to - this.tweenEl.from) * ease(this.tweenEl.t);
      if (this.tweenEl.t >= 1) this.tweenEl = null;
    }
    for (const L of this.levels.values()) {
      const tw = L.tween;
      if (!tw) continue;
      tw.t = Math.min(1, tw.t + dt / tw.dur);
      const e = ease(tw.t);
      L.target.lerpVectors(tw.fromT, tw.toT, e);
      L.dist = Math.exp(Math.log(tw.fromD) + (Math.log(tw.toD) - Math.log(tw.fromD)) * e);
      if (tw.t >= 1) L.tween = null;
    }
  }

  /** Scales a fading-out level's camera with the zoom so it keeps "moving" while it fades. */
  drift(id: DeepScale, f: number): void { const L = this.levels.get(id); if (L) L.dist *= f; }

  setScreen(w: number, h: number, pr: number): void { this.screen = { w, h, pr }; }

  /** Draws level `id` at brightness `w` (0..1) over whatever is in the frame buffer. */
  render(renderer: THREE.WebGLRenderer, id: DeepScale, w: number, fov: number): void {
    const L = this.levels.get(id);
    if (!L || w <= 0.001) return;
    L.w = w;
    const cam = this.camera;
    cam.fov = fov;
    cam.aspect = this.screen.w / this.screen.h;
    const off = new THREE.Vector3(Math.cos(this.el) * Math.sin(this.az), Math.sin(this.el), Math.cos(this.el) * Math.cos(this.az)).multiplyScalar(L.dist);
    cam.position.copy(L.target).add(off);
    cam.lookAt(L.target);
    cam.near = Math.max(1e-3, L.dist * 0.002);
    cam.far = L.dist * 6 + 4000;
    cam.updateProjectionMatrix();
    const scale = (this.screen.h * this.screen.pr) / (2 * Math.tan((fov * D2R) / 2));
    for (const m of L.pts) {
      m.uniforms.uScale.value = scale;
      m.uniforms.uFade.value = w;
      m.uniforms.uPr.value = this.screen.pr;
      m.uniforms.uMinPx.value = 1.3 * this.screen.pr;
      m.uniforms.uTime.value = this.time;
    }
    for (const [m, base] of L.fades) m.opacity = base * w;
    if (L.cmb) L.cmb.uniforms.uFade.value = w * 0.9;
    if (L.pulse) (L.pulse.material as THREE.SpriteMaterial).opacity = w * (0.45 + 0.25 * Math.sin(this.time * 1.7));
    renderer.render(L.scene, cam);
  }

  /** Positions the labels of level `id` (call right after rendering it); hides every other level's labels. */
  labels(id: DeepScale | null): void {
    for (const L of this.levels.values()) L.labels.hidden = L.id !== id;
    this.placed = [];
    if (!id) return;
    const L = this.levels.get(id)!;
    this.render0(L);
    const W = this.screen.w, H = this.screen.h;
    const p = new THREE.Vector3();
    const boxes: [number, number, number, number][] = [];
    const max = W < 700 ? 12 : 22;
    const fits = (x: number, y: number, w: number) => !boxes.some(([bx, by, bw]) => Math.abs(bx - x) < (bw + w) / 2 + 6 && Math.abs(by - y) < 20);
    const show = (el: HTMLButtonElement, pos: THREE.Vector3, o: DeepObject | 'home', force: boolean): boolean => {
      p.copy(pos).project(this.camera);
      if (p.z > 1 || p.z < -1 || Math.abs(p.x) > 1.05 || Math.abs(p.y) > 1.05) return false;
      const x = (p.x + 1) / 2 * W, y = (1 - p.y) / 2 * H;
      const tw = (el.textContent?.length ?? 6) * 7 + 22;
      if (!force && (boxes.length >= max || !fits(x, y + 12, tw))) return false;
      boxes.push([x, y + 12, tw, 0]);
      this.placed.push({ o, x, y });
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      return true;
    };
    L.homeLabel.hidden = !show(L.homeLabel, L.home, 'home', true);
    const order = [...L.objs].sort((a, b) => (b.o === this.sel ? 1 : 0) - (a.o === this.sel ? 1 : 0) || b.rank - a.rank || a.pos.distanceTo(L.target) - b.pos.distanceTo(L.target));
    for (const x of order) {
      x.label.hidden = !show(x.label, x.pos, x.o, x.o === this.sel);
      x.label.classList.toggle('on', x.o === this.sel);
    }
  }

  /** Re-applies the camera of level L (labels project with it). */
  private render0(L: LevelRT): void {
    const off = new THREE.Vector3(Math.cos(this.el) * Math.sin(this.az), Math.sin(this.el), Math.cos(this.el) * Math.cos(this.az)).multiplyScalar(L.dist);
    this.camera.position.copy(L.target).add(off);
    this.camera.lookAt(L.target);
    this.camera.updateMatrixWorld();
  }

  relabel(): void {
    const l = lang();
    const HOME: Record<DeepScale, string> = { galaxy: 'youAreHere', group: 'sc_galaxy', laniakea: 'sc_group', universe: 'sc_laniakea' };
    for (const L of this.levels.values()) {
      L.homeLabel.textContent = t(HOME[L.id]);
      for (const x of L.objs) x.label.querySelector('span')!.textContent = tr(x.o.name, l);
    }
  }

  objectsOf(id: DeepScale): DeepObject[] { return DEEP_OBJECTS.filter(o => o.scale === id && !HOME_KEY[id].test(o.key)); }

  /** The Milky Way's painted disc (for card pictures). */
  milkyWayCanvas(): HTMLCanvasElement { return this.milkyWay().tex.image as HTMLCanvasElement; }
}

function gain(p: THREE.Points, g: number): THREE.Points { (p.material as THREE.ShaderMaterial).uniforms.uGain.value = g; return p; }

// ---------- card pictures ----------
const thumbCache = new Map<string, HTMLCanvasElement>();

/** A 2:1 picture for a deep object's card, drawn procedurally by kind / shape. */
export function deepThumb(o: DeepObject, mw: () => HTMLCanvasElement, W = 720, H = 360): HTMLCanvasElement {
  const hit = thumbCache.get(o.key);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!, seed = hashStr(o.key), r = rng(seed);
  ctx.fillStyle = '#05060b'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) { ctx.fillStyle = `rgba(255,255,255,${0.1 + r() * 0.5})`; ctx.fillRect(r() * W, r() * H, 1, 1); }
  ctx.globalCompositeOperation = 'lighter';
  const cx = W / 2, cy = H / 2, glow = glowCanvas();
  const blob = (x: number, y: number, s: number, color: string, a = 1) => { ctx.globalAlpha = a; ctx.drawImage(tint(glow, color), x - s / 2, y - s / 2, s, s); ctx.globalAlpha = 1; };
  const putDisc = (img: HTMLCanvasElement, s: number, tilt: number, rot: number) => {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(1, tilt); ctx.drawImage(img, -s / 2, -s / 2, s, s); ctx.restore();
  };
  switch (o.kind) {
    case 'galaxy': case 'dwarf': {
      if (/milky_way|milkyway/.test(o.key)) { putDisc(mw(), H * 1.05, 0.55, -0.3); break; }
      if (o.morph === 'spiral' || o.morph === 'barred') {
        const def: DiscDef = genericSpiral(2, 13 + (seed % 9), o.morph === 'barred', seed);
        putDisc(paintDisc(def, sampleDisc(def, 20000, seed, 0.02), 256, 1.3), H * 0.95, 0.35 + r() * 0.5, r() * 3);
      } else putDisc(paintBlob(o.morph ?? 'dwarf', 256, seed), H * 0.9, 1, 0);
      break;
    }
    case 'arm': putDisc(mw(), H * 1.05, 0.55, -0.3); break;
    case 'nebula': ctx.drawImage(paintNebula(256, seed, r() < 0.5 ? ['#ff5c8a', '#4fd1c5'] : ['#e05297', '#7aa2ff'], /ring|helix|cat|planetary/i.test(o.wiki)), cx - H / 2, 0, H, H); break;
    case 'remnant': ctx.drawImage(paintNebula(256, seed, ['#ff8a3d', '#5cc8ff'], true), cx - H / 2, 0, H, H); break;
    case 'starcluster': case 'globular': {
      const glob = o.kind === 'globular';
      for (let i = 0; i < (glob ? 1400 : 60); i++) {
        const rr = glob ? Math.abs(gauss(r)) * H * 0.16 : Math.abs(gauss(r)) * H * 0.22, a = r() * Math.PI * 2;
        blob(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, glob ? 3 + r() * 6 : 8 + r() * 26, glob ? '#ffe6a8' : '#a9c8ff', glob ? 0.6 : 0.9);
      }
      break;
    }
    case 'star': {
      const c = /betelgeuse|antares|uy_scuti|vy_|red/i.test(o.key + o.wiki) ? '#ff9a5c' : /rigel|vega|sirius|eta/i.test(o.key) ? '#bcd4ff' : '#fff1c4';
      blob(cx, cy, H * 0.9, c, 0.9); blob(cx, cy, H * 0.3, '#ffffff', 1);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - H * 0.6, cy); ctx.lineTo(cx + H * 0.6, cy); ctx.moveTo(cx, cy - H * 0.45); ctx.lineTo(cx, cy + H * 0.45); ctx.stroke();
      break;
    }
    case 'blackhole': case 'quasar': {
      const q = o.kind === 'quasar';
      if (q) { ctx.strokeStyle = 'rgba(120,220,255,0.55)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx - 40, cy + H * 0.48); ctx.lineTo(cx + 40, cy - H * 0.48); ctx.stroke(); }
      ctx.save(); ctx.translate(cx, cy); ctx.scale(1, q ? 0.35 : 0.85);
      const g = ctx.createRadialGradient(0, 0, H * 0.14, 0, 0, H * 0.4);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.15, 'rgba(255,190,90,1)'); g.addColorStop(0.45, 'rgba(255,110,30,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, H * 0.42, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy, H * (q ? 0.05 : 0.15), 0, Math.PI * 2); ctx.fill();
      if (q) { ctx.globalCompositeOperation = 'lighter'; blob(cx, cy, H * 0.35, '#e0f7ff', 1); }
      break;
    }
    case 'cmb': ctx.drawImage(paintCMB(512), 0, 0, W, H); break;
    case 'void': {
      for (let i = 0; i < 900; i++) { const a = r() * Math.PI * 2, rr = H * (0.42 + Math.abs(gauss(r)) * 0.18); blob(cx + Math.cos(a) * rr * 1.5, cy + Math.sin(a) * rr, 4 + r() * 6, '#ffd9a8', 0.5); }
      break;
    }
    default: { // group / cluster / supercluster / wall / deep field: lots of little galaxies
      const wall = o.kind === 'wall', field = o.kind === 'deepfield';
      for (let i = 0; i < (field ? 380 : 700); i++) {
        let x: number, y: number;
        if (field) { x = r() * W; y = r() * H; }
        else if (wall) { const u = r(); x = W * (0.08 + u * 0.84); y = cy + Math.sin(u * 7 + seed) * H * 0.18 + gauss(r) * H * 0.06; }
        else { const rr = Math.abs(gauss(r)) * H * (o.kind === 'supercluster' ? 0.32 : 0.2), a = r() * Math.PI * 2; x = cx + Math.cos(a) * rr * 1.5; y = cy + Math.sin(a) * rr; }
        const cc = r() < 0.5 ? '#ffd6a0' : r() < 0.5 ? '#bcd0ff' : '#ff9fc4';
        blob(x, y, (field ? 3 + r() * 12 : 3 + r() * 9) * (r() < 0.04 ? 2.5 : 1), cc, 0.85);
      }
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  thumbCache.set(o.key, cv);
  return cv;
}

const tintCache = new Map<string, HTMLCanvasElement>();
function tint(src: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const k = color;
  let c = tintCache.get(k);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const x = c.getContext('2d')!;
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  tintCache.set(k, c);
  return c;
}
