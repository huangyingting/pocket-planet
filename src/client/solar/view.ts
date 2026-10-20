/**
 * The Solar System view: a second, lazily loaded renderer that takes over from the Earth globe when you zoom out
 * past it. Bodies sit at their real (JPL Keplerian) positions for the simulated date, with compressed display
 * distances/sizes (see orbits.ts). Surface maps are painted procedurally in a worker. See ADR-016.
 *
 * Scene graph per body: node (display position) → tilt (pole → +Y) → spin (rotation about the pole) → mesh.
 * Within `spin`, lat/lon map to directions exactly like the globe (`latLonToVec`), so features and the Earth line up.
 * Three.js axes from ecliptic ones: (x, y, z)₃ = (x, z, −y)ₑ — the ecliptic is the XZ plane and north is +Y.
 */
import * as THREE from 'three';
import { BODIES, BODY, type BodyId, type SolarBody, type SolarFeature } from '../../shared/data/solar.ts';
import { SOLAR_FEATURES } from '../../shared/data/solar-features.ts';
import { daysJ2000, displayMoonDist, displayOrbit, displayRadius, keplerPosition, poleOf, relativePosition, subSolarLon, type Vec3 } from '../../shared/lib/orbits.ts';
import { latLonToVec, vecToLatLon } from '../../shared/lib/geo.ts';
import { tr } from '../../shared/data/types.ts';
import { lang } from '../lib/i18n.ts';
import { AdaptiveResolution, type Quality } from '../globe/quality.ts';
import type { PaintReply, PaintRequest } from './solar.worker.ts';
import { SCALES, type DeepObject, type DeepScale, type ScaleId } from '../../shared/data/cosmos.ts';
import { eclToGal, galToEcl } from '../../shared/lib/sky.ts';
import { DeepStage } from './deep.ts';
import { SiteLayer, helioAU } from './sites.ts';
import type { SolarSite } from '../../shared/data/solar-sites.ts';

const D2R = Math.PI / 180;
/** Simulated seconds per real second for the time controls. */
export const SPEEDS = [0, 1, 3600, 86400, 2_592_000, 31_557_600] as const;
/** Visual spin is soft-capped at this many radians per real second (one turn a minute) so no world ever whirls. */
const SPIN_MAX_W = (2 * Math.PI) / 60;
/** Earth turns exactly with the clock (sun over the right longitude) up to this speed; faster it spins freely. */
const EARTH_EXACT = 600;
/** The camera turns with the focused world only this close (in radii) or while a surface spot is selected. */
const CO_ROTATE_R = 3.2;
/** Globe's widest view is 1 + MAX_H = 5.5 Earth radii; zooming in below this on Earth hands back to the globe. */
const EARTH_EXIT_R = 4.6;
const OVERVIEW_DIST = 112;
const MAX_DIST = 190;

const FEATURES_BY_BODY = new Map<BodyId, SolarFeature[]>();
for (const f of SOLAR_FEATURES) {
  const list = FEATURES_BY_BODY.get(f.body) ?? [];
  list.push(f);
  FEATURES_BY_BODY.set(f.body, list);
}
for (const list of FEATURES_BY_BODY.values()) list.sort((a, b) => (b.sizeKm ?? 0) - (a.sizeKm ?? 0));
export const featuresOf = (id: BodyId): SolarFeature[] => FEATURES_BY_BODY.get(id) ?? [];

const eclToThree = (v: Vec3, out = new THREE.Vector3()) => out.set(v[0], v[2], -v[1]);
const wrapPi = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const helioOrbit = (s: SolarSite, ms: number) => displayOrbit(helioAU(s, ms));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export type SolarSelection = { kind: 'body'; id: BodyId } | { kind: 'feature'; f: SolarFeature } | { kind: 'site'; s: SolarSite };

export interface SolarEvents {
  /** A body or feature was picked (tap, label or chip). */
  onSelect?: (sel: SolarSelection) => void;
  /** Focus body or zoom changed (for the breadcrumb); `near` = within a few radii of the focus body. */
  onView?: (focus: BodyId, near: boolean) => void;
  /** Zoomed into Earth: hand back to the globe, looking down at lat/lon. */
  onEnterEarth?: (lat: number, lon: number) => void;
  /** Simulated time (about four times a second). */
  onTime?: (ms: number) => void;
  /** A body's surface map arrived or got sharper. */
  onTexture?: (id: BodyId) => void;
  /** The scale changed (Solar System ↔ Milky Way ↔ Local Group ↔ Laniakea ↔ Universe). */
  onScale?: (s: ScaleId) => void;
  /** An object at a deep scale was picked (or the selection cleared). */
  onDeepSelect?: (o: DeepObject | null) => void;
}

interface Tex { map: THREE.Texture; bump: THREE.Texture | null; w: number }

interface BodyRT {
  b: SolarBody;
  R: number;
  node: THREE.Group;
  tilt: THREE.Group;
  spin: THREE.Group;
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial | THREE.ShaderMaterial;
  atmo: { mesh: THREE.Mesh; u: { uSun: { value: THREE.Vector3 } } } | null;
  rings: THREE.Mesh | null;
  orbit: THREE.Line | null;
  pole: THREE.Vector3;
  spinA: number;
  pos: THREE.Vector3;
  label: HTMLButtonElement;
  lo: Tex | null;
  hi: Tex | null;
}

interface Tween {
  t: number; dur: number;
  fromPos: THREE.Vector3; fromDist: number; toDist: number;
  fromAz: number; fromEl: number;
  /** Direction (in the focus body's spin frame) to end up looking from, or null to keep the current angles. */
  toLocal: THREE.Vector3 | null;
  toEl?: number;
}

const ATMO_VS = /* glsl */ `
varying vec3 vN; varying vec3 vW;
void main() {
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const ATMO_FS = /* glsl */ `
uniform vec3 uColor; uniform vec3 uSun; uniform float uK; uniform vec3 uC; uniform vec2 uR;
varying vec3 vN; varying vec3 vW;
void main() {
  vec3 v = normalize(cameraPosition - vW);
  float f = pow(1.0 - max(dot(normalize(vN), v), 0.0), uK);
  float lit = smoothstep(-0.3, 0.45, dot(normalize(vN), uSun));
  // Rays that miss the planet fade out with height, so close up the shell's edge never shows as a second rim.
  float hgt = length(cross(uC - cameraPosition, v));
  float halo = hgt > uR.x ? pow(clamp(1.0 - (hgt - uR.x) / (uR.y - uR.x), 0.0, 1.0), 2.0) : 1.0;
  float a = f * lit * halo;
  gl_FragColor = vec4(uColor * a, a);
  #include <colorspace_fragment>
}`;
const SUN_VS = /* glsl */ `
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main() {
  vUv = uv; vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const SUN_FS = /* glsl */ `
uniform sampler2D uMap; uniform float uTime;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main() {
  float mu = clamp(dot(normalize(vN), normalize(cameraPosition - vW)), 0.0, 1.0);
  vec3 c = texture2D(uMap, vUv).rgb;
  float flick = 0.97 + 0.03 * sin(uTime * 1.7 + vUv.x * 40.0) * sin(uTime * 1.3 + vUv.y * 33.0);
  c *= (0.42 + 0.58 * pow(mu, 0.5)) * 1.35 * flick;
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

export class SolarView {
  readonly root: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, 1, 0.01, 400);
  private labelsEl: HTMLDivElement;
  private featEl: HTMLDivElement;
  private rts = new Map<BodyId, BodyRT>();
  private stars!: THREE.Points;
  private sunU = { uMap: { value: new THREE.Texture() as THREE.Texture }, uTime: { value: 0 } };
  private geoLo: THREE.SphereGeometry;
  private geoHi: THREE.SphereGeometry;
  private worker: Worker | null = null;
  private queue: PaintRequest[] = [];
  private inflight: PaintRequest | null = null;
  private seq = 0;
  private hiOrder: BodyId[] = [];
  private earthCanvas: HTMLCanvasElement | null = null;
  private featLabels = new Map<string, HTMLButtonElement>();
  private adapt: AdaptiveResolution;
  private sites!: SiteLayer;

  simMs = Date.now();
  speed: number = SPEEDS[2];
  focusId: BodyId = 'sun';
  selFeature: SolarFeature | null = null;
  private az = 0.6; private el = 0.42; private dist = OVERVIEW_DIST;
  private vAz = 0; private vEl = 0;
  private tween: Tween | null = null;
  private active = false;
  private raf = 0;
  private last = 0;
  private lastTime = 0;
  private lastView = '';
  private exiting = false;
  private interacting = 0;
  private sized = { w: 0, h: 0 };
  /** The scale on screen; the levels above the Solar System are drawn by `deep`. */
  scale: ScaleId = 'solar';
  readonly deep: DeepStage;
  private xf: { from: ScaleId; to: ScaleId; t: number; dur: number } | null = null;
  private over = { v: 0, t: 0 };
  private veil = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, depthTest: false, depthWrite: false }));
  private veilScene = new THREE.Scene();
  private veilCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  constructor(container: HTMLElement, public ev: SolarEvents, readonly quality: Quality) {
    this.root = document.createElement('div');
    this.root.className = 'solar-stage';
    this.root.dataset.testid = 'solar-stage';
    this.renderer = new THREE.WebGLRenderer({ antialias: quality.msaa, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, quality.dprMax));
    this.adapt = new AdaptiveResolution(quality.dprMin, Math.min(devicePixelRatio || 1, quality.dprMax));
    this.renderer.setClearColor(0x020306);
    this.renderer.autoClear = false;
    this.veilScene.add(this.veil);
    const cv = this.renderer.domElement;
    cv.className = 'solar-canvas';
    cv.tabIndex = 0;
    this.labelsEl = document.createElement('div');
    this.labelsEl.className = 'solar-labels';
    this.featEl = document.createElement('div');
    this.featEl.className = 'solar-labels solar-feats';
    this.root.append(cv, this.featEl, this.labelsEl);
    container.append(this.root);

    const lo = quality.tier === 'low' ? [40, 20] : [64, 32];
    const hi = quality.tier === 'high' ? [160, 80] : [112, 56];
    this.geoLo = new THREE.SphereGeometry(1, lo[0], lo[1]);
    this.geoHi = new THREE.SphereGeometry(1, hi[0], hi[1]);
    this.deep = new DeepStage(this.root, quality, {
      onSelect: o => this.ev.onDeepSelect?.(o),
      onDown: () => this.goScale(SCALES[SCALES.indexOf(this.scale) + 1], 'down'),
      onUp: () => this.goScale(SCALES[SCALES.indexOf(this.scale) - 1], 'up'),
    });
    this.sites = new SiteLayer(this.scene, this.featEl, this.labelsEl, s => this.selectSite(s));
    this.build();
    this.bindInput(cv);
    addEventListener('resize', () => this.resize());
  }

  // ---------- scene ----------
  private build(): void {
    this.scene.add(new THREE.AmbientLight(0x8899bb, 0.1));
    // A soft light from the viewer so night sides stay readable (kids should still see the craters).
    const fill = new THREE.DirectionalLight(0xaabbdd, 0.32);
    fill.position.set(0, 0, 1);
    fill.target.position.set(0, 0, -1);
    this.camera.add(fill, fill.target);
    this.scene.add(this.camera);
    const sunLight = new THREE.PointLight(0xfff4e0, 3.1, 0, 0);
    this.scene.add(sunLight);
    this.buildStars();
    const d = daysJ2000(this.simMs);
    for (const b of BODIES) {
      const R = displayRadius(b.id);
      const node = new THREE.Group(), tilt = new THREE.Group(), spin = new THREE.Group();
      const pe = poleOf(b.id), pole = eclToThree(pe).normalize();
      tilt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pole);
      let mat: BodyRT['mat'];
      if (b.id === 'sun') {
        mat = new THREE.ShaderMaterial({ uniforms: this.sunU, vertexShader: SUN_VS, fragmentShader: SUN_FS });
        this.addSunGlow(node, R);
      } else {
        mat = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 1, metalness: 0 });
      }
      const mesh = new THREE.Mesh(this.geoLo, mat);
      mesh.scale.setScalar(R);
      mesh.rotation.y = -Math.PI / 2; // SphereGeometry's u = 0 seam onto lon −180 (−Z), as on the globe
      spin.add(mesh);
      tilt.add(spin);
      node.add(tilt);
      this.scene.add(node);
      let atmo: BodyRT['atmo'] = null;
      if (b.glow && b.id !== 'sun') {
        const u = { uColor: { value: new THREE.Color(b.glow) }, uSun: { value: new THREE.Vector3(1, 0, 0) }, uK: { value: b.id === 'venus' || b.id === 'titan' ? 1.8 : 3.0 },
          uC: { value: node.position }, uR: { value: new THREE.Vector2(R, R * (b.solid ? 1.025 : 1.04)) } };
        const am = new THREE.Mesh(this.geoLo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: ATMO_VS, fragmentShader: ATMO_FS,
          transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
        am.scale.setScalar(R * (b.solid ? 1.025 : 1.04));
        tilt.add(am);
        atmo = { mesh: am, u };
      }
      let rings: THREE.Mesh | null = null;
      if (b.rings) {
        const [ri, ro] = b.rings;
        const g = new THREE.RingGeometry(ri * R, ro * R, 160, 1);
        const pos = g.attributes.position, uv = g.attributes.uv;
        for (let i = 0; i < pos.count; i++) uv.setXY(i, (Math.hypot(pos.getX(i), pos.getY(i)) / R - ri) / (ro - ri), 0.5);
        g.rotateX(-Math.PI / 2);
        rings = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: 0.95, color: 0xdddddd }));
        rings.visible = false;
        tilt.add(rings);
      }
      const label = document.createElement('button');
      label.className = 'sb-label k-' + b.kind;
      label.dataset.testid = 'sb-' + b.id;
      label.onclick = () => this.select(b.id);
      this.labelsEl.append(label);
      const rt: BodyRT = { b, R, node, tilt, spin, mesh, mat, atmo, rings, orbit: null, pole, spinA: 0, pos: node.position, label, lo: null, hi: null };
      this.rts.set(b.id, rt);
      rt.orbit = this.buildOrbit(rt, d);
    }
    this.relabel();
    this.updateBodies(0);
  }

  private buildStars(): void {
    const n = this.quality.stars * 2;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    // Milky Way plane: the galactic pole is about 60° from the ecliptic pole.
    const gp = new THREE.Vector3(0.0, 0.5, -0.866).normalize();
    const v = new THREE.Vector3(), c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
      if (v.lengthSq() > 1 || v.lengthSq() < 1e-4) { i--; continue; }
      v.normalize();
      if (i % 5 < 2) { v.addScaledVector(gp, -v.dot(gp) * (0.86 + Math.random() * 0.14)).normalize(); }
      v.multiplyScalar(120);
      pos.set([v.x, v.y, v.z], i * 3);
      const tmp = Math.random();
      c.setHSL(tmp < 0.2 ? 0.6 : tmp < 0.35 ? 0.1 : 0.6, tmp < 0.35 ? 0.5 : 0.1, 0.55 + Math.random() * 0.4);
      const k = Math.pow(Math.random(), 2.2) * 0.85 + 0.15;
      col.set([c.r * k, c.g * k, c.b * k], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.stars = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.7, sizeAttenuation: false, vertexColors: true, depthTest: false, depthWrite: false }));
    this.stars.renderOrder = -10;
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);
  }

  private addSunGlow(node: THREE.Group, R: number): void {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const ctx = cv.getContext('2d')!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,236,190,1)');
    g.addColorStop(0.2, 'rgba(255,200,110,0.55)');
    g.addColorStop(0.45, 'rgba(255,150,60,0.16)');
    g.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    for (const [s, o] of [[R * 5.2, 0.9], [R * 14, 0.28]] as const) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: o }));
      sp.scale.setScalar(s);
      node.add(sp);
    }
  }

  private buildOrbit(rt: BodyRT, d: number): THREE.Line | null {
    const b = rt.b;
    const N = 256, pts: THREE.Vector3[] = [];
    if (b.kepler) {
      const a = b.kepler.a[0], P = 365.25 * Math.pow(a, 1.5);
      for (let k = 0; k < N; k++) {
        const p = keplerPosition(b.kepler, d + (k / N) * P), r = Math.hypot(p[0], p[1], p[2]);
        pts.push(eclToThree(p).multiplyScalar(displayOrbit(r) / r));
      }
    } else if (b.moon && b.parent) {
      const P = Math.abs(b.moon.periodD), dist = displayMoonDist(b.id);
      for (let k = 0; k < 128; k++) pts.push(eclToThree(relativePosition(b.id, d + (k / 128) * P)).normalize().multiplyScalar(dist));
    } else return null;
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: b.kind === 'dwarf' ? 0xa78bfa : b.kind === 'moon' ? 0x94a3b8 : 0x7dd3fc, transparent: true, opacity: 0.2, depthWrite: false }));
    if (b.kind === 'moon') this.rts.get(b.parent!)!.node.add(line);
    else this.scene.add(line);
    return line;
  }

  // ---------- textures ----------
  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./solar.worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (e: MessageEvent<PaintReply>) => { this.inflight = null; this.onPainted(e.data); this.pump(); };
      this.worker.onerror = () => { this.inflight = null; this.pump(); };
    }
    return this.worker;
  }

  private request(id: BodyId, w: number, front = false): void {
    if (id === 'earth' && this.earthCanvas) {
      const h = w / 2;
      this.onPainted({ seq: 0, id, w, h, ms: 0, color: new Uint8ClampedArray(w * h * 4), height: null, rings: null });
      return;
    }
    if (this.inflight?.id === id && this.inflight.w === w) return;
    const i = this.queue.findIndex(r => r.id === id && r.w === w);
    if (i >= 0) { if (!front) return; this.queue.splice(i, 1); }
    const req: PaintRequest = { seq: ++this.seq, id, w, rings: Boolean(BODY[id].rings) && !this.rts.get(id)!.lo };
    if (front) this.queue.unshift(req); else this.queue.push(req);
    this.pump();
  }

  private pump(): void {
    if (this.inflight || !this.queue.length) return;
    this.inflight = this.queue.shift()!;
    this.ensureWorker().postMessage(this.inflight);
  }

  private loTexW(): number { return this.quality.tier === 'high' ? 512 : 256; }
  private hiTexW(): number { return this.quality.tier === 'high' ? 2048 : 1024; }

  private onPainted(r: PaintReply): void {
    const rt = this.rts.get(r.id);
    if (!rt) return;
    const aniso = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    const toCanvas = (rgba: Uint8ClampedArray, w: number, h: number) => {
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d')!.putImageData(new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, w, h), 0, 0);
      return cv;
    };
    const mapCv = r.id === 'earth' && this.earthCanvas ? this.composeEarth(r.w, r.h) : toCanvas(r.color, r.w, r.h);
    const map = new THREE.CanvasTexture(mapCv);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = aniso;
    let bump: THREE.Texture | null = null;
    if (r.height) {
      const g = new Uint8ClampedArray(r.w * r.h * 4);
      for (let i = 0; i < r.height.length; i++) { const v = r.height[i]; g[i * 4] = g[i * 4 + 1] = g[i * 4 + 2] = v; g[i * 4 + 3] = 255; }
      bump = new THREE.CanvasTexture(toCanvas(g, r.w, r.h));
      bump.anisotropy = aniso;
    }
    if (r.rings && rt.rings) {
      const rc = toCanvas(r.rings, r.rings.length / 4, 1);
      const rtex = new THREE.CanvasTexture(rc);
      rtex.colorSpace = THREE.SRGBColorSpace;
      const m = rt.rings.material as THREE.MeshBasicMaterial;
      m.map = rtex; m.needsUpdate = true;
      rt.rings.visible = true;
    }
    const tex: Tex = { map, bump, w: r.w };
    if (r.w >= this.hiTexW()) {
      if (rt.hi) this.disposeTex(rt.hi);
      rt.hi = tex;
      this.hiOrder = [r.id, ...this.hiOrder.filter(x => x !== r.id)];
      for (const old of this.hiOrder.splice(3)) {
        const o = this.rts.get(old)!;
        if (o.hi) { this.disposeTex(o.hi); o.hi = null; this.applyTex(o); }
      }
    } else {
      if (rt.lo) this.disposeTex(rt.lo);
      rt.lo = tex;
    }
    this.applyTex(rt);
    this.ev.onTexture?.(r.id);
  }

  /** The best painted surface map so far (equirectangular), e.g. for the card. */
  mapImage(id: BodyId): HTMLCanvasElement | null {
    const rt = this.rts.get(id)!;
    return ((rt.hi ?? rt.lo)?.map.image as HTMLCanvasElement | undefined) ?? null;
  }

  /** Earth uses the globe's own painted land map over an ocean, so both views show the same planet. */
  private composeEarth(w: number, h: number): HTMLCanvasElement {
    const src = this.earthCanvas!;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, cv.height);
    g.addColorStop(0, '#2a5d8f'); g.addColorStop(0.5, '#0f4c86'); g.addColorStop(1, '#2a5d8f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.drawImage(src, 0, 0, cv.width, cv.height);
    return cv;
  }

  setEarthCanvas(cv: HTMLCanvasElement): void {
    this.earthCanvas = cv;
    const rt = this.rts.get('earth')!;
    if (rt.lo || rt.hi) { this.request('earth', this.loTexW()); if (rt.hi) this.request('earth', this.hiTexW()); }
  }

  private applyTex(rt: BodyRT): void {
    const t = rt.hi ?? rt.lo;
    if (!t) return;
    if (rt.b.id === 'sun') { this.sunU.uMap.value = t.map; return; }
    const m = rt.mat as THREE.MeshStandardMaterial;
    m.map = t.map;
    m.color.set(0xffffff);
    m.bumpMap = t.bump;
    m.bumpScale = t.bump ? (rt.hi ? 2.2 : 1.2) : 1;
    m.needsUpdate = true;
  }

  private disposeTex(t: Tex): void { t.map.dispose(); t.bump?.dispose(); }

  // ---------- simulation ----------
  private updateBodies(dtReal: number): void {
    const d = daysJ2000(this.simMs);
    const tmp = new THREE.Vector3(), q = new THREE.Quaternion();
    const simH = Math.abs(this.speed) / 3600; // simulated hours per real second
    for (const rt of this.rts.values()) {
      const b = rt.b;
      if (b.kepler) {
        const p = relativePosition(b.id, d), r = Math.hypot(p[0], p[1], p[2]);
        eclToThree(p, rt.pos).multiplyScalar(displayOrbit(r) / r);
      } else if (b.moon && b.parent) {
        const p = relativePosition(b.id, d);
        eclToThree(p, rt.pos).normalize().multiplyScalar(displayMoonDist(b.id)).add(this.rts.get(b.parent)!.pos);
      }
      // Spin about the pole: exact for Earth (sun over the right longitude) and tidally locked moons, else free.
      const prev = rt.spinA;
      q.copy(rt.tilt.quaternion).invert();
      let target: number | null = null;
      if (b.locked && b.parent) {
        tmp.copy(this.rts.get(b.parent)!.pos).sub(rt.pos).normalize().applyQuaternion(q);
        target = Math.atan2(tmp.x, tmp.z);
      } else if (b.id === 'earth' && Math.abs(this.speed) <= EARTH_EXACT) {
        tmp.copy(rt.pos).negate().normalize().applyQuaternion(q);
        target = Math.atan2(tmp.x, tmp.z) - subSolarLon(this.simMs) * D2R;
      }
      if (target !== null) rt.spinA = dtReal <= 0 ? target : rt.spinA + wrapPi(target - rt.spinA) * Math.min(1, dtReal / 0.25);
      else if (b.rotationH) {
        const w = (simH * 2 * Math.PI) / b.rotationH;
        rt.spinA += dtReal * SPIN_MAX_W * Math.tanh(w / SPIN_MAX_W);
      }
      rt.spinA = wrapPi(rt.spinA);
      rt.spin.rotation.y = rt.spinA;
      if (rt.atmo) rt.atmo.u.uSun.value.copy(rt.pos).negate().normalize();
      // Keep the camera fixed over the surface of the focused body while it turns.
      if (b.id === this.focusId && b.id !== 'sun' && !this.tween && dtReal > 0 && (this.selFeature?.body === b.id || this.dist < rt.R * CO_ROTATE_R)) {
        const off = this.offset();
        off.applyAxisAngle(rt.pole, wrapPi(rt.spinA - prev));
        this.setAngles(off);
      }
    }
  }

  private offset(): THREE.Vector3 {
    return new THREE.Vector3(Math.cos(this.el) * Math.sin(this.az), Math.sin(this.el), Math.cos(this.el) * Math.cos(this.az)).multiplyScalar(this.dist);
  }

  private setAngles(off: THREE.Vector3): void {
    const l = off.length() || 1;
    this.el = Math.asin(Math.max(-1, Math.min(1, off.y / l)));
    this.az = Math.atan2(off.x, off.z);
  }

  private updateCamera(dt: number): void {
    const rt = this.rts.get(this.focusId)!;
    const target = rt.pos.clone();
    if (this.tween) {
      const tw = this.tween;
      tw.t = Math.min(1, tw.t + dt / tw.dur);
      const e = ease(tw.t);
      target.lerpVectors(tw.fromPos, rt.pos, e);
      this.dist = Math.exp(Math.log(tw.fromDist) + (Math.log(tw.toDist) - Math.log(tw.fromDist)) * e);
      if (tw.toLocal) {
        rt.spin.updateWorldMatrix(true, false);
        const dir = tw.toLocal.clone().transformDirection(rt.spin.matrixWorld);
        const toAz = Math.atan2(dir.x, dir.z), toEl = Math.asin(Math.max(-1, Math.min(1, dir.y)));
        this.az = tw.fromAz + wrapPi(toAz - tw.fromAz) * e;
        this.el = tw.fromEl + (toEl - tw.fromEl) * e;
      } else if (tw.toEl !== undefined) {
        this.el = tw.fromEl + (tw.toEl - tw.fromEl) * e;
      }
      if (tw.t >= 1) this.tween = null;
    } else if (Math.abs(this.vAz) + Math.abs(this.vEl) > 1e-5) {
      this.az += this.vAz; this.el = Math.max(-1.5, Math.min(1.5, this.el + this.vEl));
      this.vAz *= 0.9; this.vEl *= 0.9;
    }
    this.camera.position.copy(target).add(this.offset());
    this.camera.lookAt(target);
    const surf = Math.max(1e-4, this.dist - rt.R);
    this.camera.near = Math.max(0.0004, Math.min(0.5, surf * 0.3));
    this.camera.far = this.dist + 260;
    this.camera.updateProjectionMatrix();
    this.stars.position.copy(this.camera.position);
  }

  // ---------- public API ----------
  /** Opens the view. `from` = the globe's current look-down point, so the zoom-out continues seamlessly. */
  show(opts: { from?: { lat: number; lon: number }; focus?: BodyId } = {}): void {
    this.active = true;
    this.exiting = false;
    this.root.classList.remove('hidden');
    this.resize();
    for (const id of this.rts.keys()) if (!this.rts.get(id)!.lo) this.request(id, this.loTexW());
    if (opts.from) {
      this.focusId = 'earth';
      this.selFeature = null;
      this.updateBodies(0);
      const rt = this.rts.get('earth')!;
      rt.spin.updateWorldMatrix(true, false);
      const local = new THREE.Vector3(...latLonToVec(opts.from.lat, opts.from.lon));
      this.setAngles(local.clone().transformDirection(rt.spin.matrixWorld));
      this.dist = rt.R * 5.5;
      this.tween = { t: 0, dur: 1700, fromPos: rt.pos.clone(), fromDist: this.dist, toDist: rt.R * 16, fromAz: this.az, fromEl: this.el, toLocal: local };
      this.request('earth', this.hiTexW(), true);
    } else if (opts.focus) {
      this.select(opts.focus);
    }
    this.last = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.loop());
    this.renderer.domElement.focus({ preventScroll: true });
  }

  hide(): void {
    this.active = false;
    cancelAnimationFrame(this.raf);
    this.root.classList.add('hidden');
  }

  get isActive(): boolean { return this.active; }

  /** Flies to a body (and shows its card via onSelect). */
  select(id: BodyId, emit = true): void {
    this.selFeature = null;
    this.sites.sel = null;
    this.focus(id);
    if (emit) this.ev.onSelect?.({ kind: 'body', id });
  }

  /** The whole system from above. */
  overview(): void {
    this.selFeature = null;
    this.sites.sel = null;
    this.focus('sun', OVERVIEW_DIST, 0.5);
  }

  /**
   * Moves to another scale with a cross-fade. `how`: 'up' = zooming out from the scale below, 'down' = zooming in
   * from the one above, 'jump' = straight there (scale rail, links).
   */
  goScale(to: ScaleId | undefined, how?: 'up' | 'down' | 'jump'): void {
    const from = this.scale;
    if (!to || to === from) return;
    const iF = SCALES.indexOf(from), iT = SCALES.indexOf(to);
    how ??= Math.abs(iF - iT) === 1 ? (iT < iF ? 'up' : 'down') : 'jump';
    if (to === 'solar') {
      if (from === 'galaxy' || how === 'down') this.setAngles(this.anglesVec(this.deep.az, this.deep.el, galToEcl, eclToGal, true));
      this.selFeature = null;
      this.focusId = 'sun';
      const rt = this.rts.get('sun')!;
      this.dist = how === 'down' ? MAX_DIST * 1.6 : OVERVIEW_DIST * 0.4;
      this.tween = { t: 0, dur: 2000, fromPos: rt.pos.clone(), fromDist: this.dist, toDist: OVERVIEW_DIST, fromAz: this.az, fromEl: this.el, toLocal: null, toEl: 0.5 };
      this.over.v = 0;
    } else {
      if (from === 'solar') {
        const off = this.anglesVec(this.az, this.el, eclToGal, galToEcl, false);
        this.deep.az = Math.atan2(off.x, off.z);
        this.deep.el = Math.asin(Math.max(-1, Math.min(1, off.y)));
      }
      this.deep.enter(to as DeepScale, how, from === 'solar' ? 600 : this.deep.distLy);
    }
    this.xf = { from, to, t: 0, dur: this.quality.tier === 'low' ? 700 : 1100 };
    this.scale = to;
    this.interacting = performance.now();
    this.ev.onScale?.(to);
  }

  /** The camera direction (az, el) re-expressed in the other frame (ecliptic ↔ galactic). */
  private anglesVec(az: number, el: number, conv: (v: Vec3) => Vec3, _inv: (v: Vec3) => Vec3, toSolar: boolean): THREE.Vector3 {
    const o = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
    const v = conv([o.x, -o.z, o.y]);
    const out = new THREE.Vector3(v[0], v[2], -v[1]);
    return toSolar ? out.multiplyScalar(this.dist || 1) : out;
  }

  selectDeep(key: string): boolean {
    const o = this.deep.objectsOf(this.scale as DeepScale).find(x => x.key === key);
    if (o) this.deep.select(o);
    return Boolean(o);
  }

  /** Flies to a lander / rover / orbiter (or shows a far spacecraft in the overview). */
  selectSite(s: SolarSite, emit = true): void {
    this.selFeature = null;
    this.sites.sel = s;
    if (s.helio) this.focus('sun', Math.max(OVERVIEW_DIST, helioOrbit(s, this.simMs) * 1.25), 0.45);
    else {
      const rt = this.rts.get(s.body)!;
      if (s.orbit) this.focus(s.body, rt.R * (3 + s.orbit.altR * 2.5), 0.35);
      else {
        // look from a little south of the site so the model is seen at an angle, not straight down
        const lat = s.lat > 60 ? s.lat - 7 : s.lat + (s.lat < -60 ? 7 : -6);
        this.focus(s.body, rt.R * 1.5, undefined, new THREE.Vector3(...latLonToVec(lat, s.lon)));
      }
    }
    if (emit) this.ev.onSelect?.({ kind: 'site', s });
  }

  selectFeature(f: SolarFeature, emit = true): void {
    const rt = this.rts.get(f.body)!;
    this.selFeature = f;
    this.sites.sel = null;
    this.focus(f.body, rt.R * 2.1, undefined, new THREE.Vector3(...latLonToVec(f.lat, f.lon)));
    if (emit) this.ev.onSelect?.({ kind: 'feature', f });
  }

  private focus(id: BodyId, dist?: number, el?: number, toLocal: THREE.Vector3 | null = null): void {
    const prev = this.rts.get(this.focusId)!, rt = this.rts.get(id)!;
    const fromPos = this.tween ? this.camera.position.clone().sub(this.offset()) : prev.pos.clone();
    const toDist = dist ?? (id === 'sun' ? rt.R * 4.5 : id === 'earth' ? rt.R * 12 : rt.R * 4.2);
    const hop = fromPos.distanceTo(rt.pos);
    this.tween = { t: 0, dur: Math.min(2200, 900 + hop * 18), fromPos, fromDist: this.dist, toDist, fromAz: this.az, fromEl: this.el, toLocal, toEl: el };
    this.focusId = id;
    this.vAz = this.vEl = 0;
    if (id !== 'sun' || dist === undefined) this.request(id, this.hiTexW(), true);
  }

  /** Where on Earth the camera looks down from (for handing back to the globe). */
  earthLatLon(): [number, number] {
    const rt = this.rts.get('earth')!;
    rt.spin.updateWorldMatrix(true, false);
    const inv = new THREE.Matrix4().copy(rt.spin.matrixWorld).invert();
    const dir = this.camera.position.clone().sub(rt.pos).normalize().transformDirection(inv);
    if (this.focusId !== 'earth') return [20, 0];
    return vecToLatLon(dir.x, dir.y, dir.z);
  }

  setSpeed(s: number): void { this.speed = s; }
  get selSite(): SolarSite | null { return this.sites.sel; }
  resetTime(): void { this.simMs = Date.now(); this.updateBodies(0); }

  relabel(): void {
    const l = lang();
    for (const rt of this.rts.values()) rt.label.textContent = tr(rt.b.name, l);
    for (const [key, el] of this.featLabels) {
      const f = SOLAR_FEATURES.find(x => x.key === key);
      if (f) el.querySelector('span')!.textContent = tr(f.name, l);
    }
    this.sites.relabel();
  }

  zoomBy(f: number): void {
    if (this.xf && this.xf.t < 0.7) return;
    if (this.scale !== 'solar') { this.deep.zoomBy(f); return; }
    const rt = this.rts.get(this.focusId)!;
    this.tween = null;
    const atMax = this.dist >= MAX_DIST - 1e-3;
    this.dist = Math.max(rt.R * 1.15, Math.min(MAX_DIST, rt.R + (this.dist - rt.R) * f));
    if (f < 1) this.checkEarthExit();
    // Keeping on zooming out at the widest view leaves the Solar System for the Milky Way.
    if (f > 1 && atMax) {
      const now = performance.now();
      this.over.v = (now - this.over.t < 800 ? this.over.v : 0) + Math.log(f);
      this.over.t = now;
      if (this.over.v > 0.4) { this.over.v = 0; this.goScale('galaxy', 'up'); }
    }
  }

  /** Straight back to the Solar System with no transition (re-entering from the globe). */
  resetScale(): void {
    if (this.scale === 'solar' && !this.xf) return;
    this.scale = 'solar';
    this.xf = null;
    this.deep.select(null, false);
    this.deep.labels(null);
  }

  /** Back to the resting view of the current scale. */
  home(): void {
    if (this.scale === 'solar') this.overview();
    else this.deep.overview();
  }

  private checkEarthExit(): void {
    const rt = this.rts.get('earth')!;
    if (this.focusId !== 'earth' || this.exiting || this.dist > rt.R * EARTH_EXIT_R) return;
    this.exiting = true;
    const [lat, lon] = this.earthLatLon();
    this.ev.onEnterEarth?.(lat, lon);
  }

  /** Screen-space pick: a hit inside a body's disc (nearest wins), else the closest centre within 16 px. */
  pickAt(x: number, y: number): BodyId | null {
    const W = this.sized.w, H = this.sized.h;
    const k = (H / 2) / Math.tan((this.camera.fov * D2R) / 2);
    let disc: [BodyId, number] | null = null, near: [BodyId, number] | null = null;
    const p = new THREE.Vector3();
    for (const rt of this.rts.values()) {
      const dc = this.camera.position.distanceTo(rt.pos);
      if (dc <= rt.R) continue;
      p.copy(rt.pos).project(this.camera);
      if (p.z > 1 || p.z < -1) continue;
      const sx = (p.x + 1) / 2 * W, sy = (1 - p.y) / 2 * H;
      const d = Math.hypot(sx - x, sy - y), pr = (rt.R / dc) * k;
      if (d <= pr) { if (!disc || dc < disc[1]) disc = [rt.b.id, dc]; }
      else if (d <= 16 && (!near || d < near[1])) near = [rt.b.id, d];
    }
    return disc?.[0] ?? near?.[0] ?? null;
  }

  // ---------- input ----------
  private bindInput(el: HTMLCanvasElement): void {
    const ptrs = new Map<number, { x: number; y: number }>();
    let down: { x: number; y: number; t: number } | null = null, moved = false, pinch0 = 0;
    el.addEventListener('pointerdown', e => {
      el.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) { down = { x: e.clientX, y: e.clientY, t: performance.now() }; moved = false; }
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); }
      this.vAz = this.vEl = 0;
      this.interacting = performance.now();
    });
    el.addEventListener('pointermove', e => {
      const prev = ptrs.get(e.pointerId);
      if (!prev) {
        const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        el.style.cursor = (this.scale === 'solar' ? this.pickAt(x, y) : this.deep.pickAt(x, y)) ? 'pointer' : 'grab';
        return;
      }
      const cur = { x: e.clientX, y: e.clientY };
      ptrs.set(e.pointerId, cur);
      this.interacting = performance.now();
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch0 > 0 && d > 0) { this.zoomBy(pinch0 / d); pinch0 = d; }
        moved = true;
        return;
      }
      if (down && Math.hypot(cur.x - down.x, cur.y - down.y) > 6) moved = true;
      if (!moved) return;
      if (this.scale !== 'solar') { this.deep.rotate(cur.x - prev.x, cur.y - prev.y); return; }
      this.tween = null;
      const rt = this.rts.get(this.focusId)!;
      const k = 0.0055 * Math.max(0.06, Math.min(1, ((this.dist - rt.R) / this.dist) * 1.3));
      const dx = cur.x - prev.x, dy = cur.y - prev.y;
      this.az -= dx * k;
      this.el = Math.max(-1.5, Math.min(1.5, this.el + dy * k));
      this.vAz = -dx * k; this.vEl = dy * k;
    });
    const up = (e: PointerEvent) => {
      ptrs.delete(e.pointerId);
      if (down && !moved && performance.now() - down.t < 600 && ptrs.size === 0) {
        const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        if (this.scale !== 'solar') {
          const hit = this.deep.pickAt(x, y);
          if (hit === 'home') this.goScale(SCALES[SCALES.indexOf(this.scale) + 1], 'down');
          else if (hit) this.deep.select(hit);
        } else {
          const id = this.pickAt(x, y);
          if (id) this.select(id);
        }
      }
      if (ptrs.size === 0) down = null;
      if (ptrs.size < 2) pinch0 = 0;
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); down = null; });
    // on the stage, not just the canvas: wheeling over a label must zoom too
    this.root.addEventListener('wheel', e => {
      e.preventDefault();
      this.interacting = performance.now();
      this.zoomBy(Math.exp(e.deltaY * 0.0015));
    }, { passive: false });
    el.addEventListener('keydown', e => {
      if (this.scale !== 'solar' && e.key.startsWith('Arrow')) {
        this.deep.rotate(e.key === 'ArrowLeft' ? 16 : e.key === 'ArrowRight' ? -16 : 0, e.key === 'ArrowUp' ? 16 : e.key === 'ArrowDown' ? -16 : 0);
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowLeft') this.az -= 0.08; else if (e.key === 'ArrowRight') this.az += 0.08;
      else if (e.key === 'ArrowUp') this.el = Math.min(1.5, this.el + 0.08); else if (e.key === 'ArrowDown') this.el = Math.max(-1.5, this.el - 0.08);
      else if (e.key === '+' || e.key === '=') this.zoomBy(0.8); else if (e.key === '-') this.zoomBy(1.25);
      else return;
      e.preventDefault();
    });
  }

  private resize(): void {
    const w = this.root.clientWidth || innerWidth, h = this.root.clientHeight || innerHeight;
    if (w === this.sized.w && h === this.sized.h) return;
    this.sized = { w, h };
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 58 : 45;
    this.camera.updateProjectionMatrix();
  }

  // ---------- frame ----------
  private loop(): void {
    if (!this.active) return;
    this.raf = requestAnimationFrame(() => this.loop());
    const now = performance.now();
    const busy = this.tween || this.xf || this.deep.busy || now - this.interacting < 400 || Math.abs(this.vAz) + Math.abs(this.vEl) > 1e-5;
    if (!busy && this.quality.idleFps && now - this.last < 1000 / this.quality.idleFps - 4) return;
    const dt = Math.min(100, now - this.last);
    const frameMs = now - this.last;
    this.last = now;
    this.simMs += dt * this.speed;
    this.resize();
    const xf = this.xf;
    let e = 1;
    if (xf) {
      xf.t = Math.min(1, xf.t + dt / xf.dur);
      e = ease(xf.t);
      // the level being left keeps moving the way you were zooming while it fades
      const up = SCALES.indexOf(xf.to) < SCALES.indexOf(xf.from), f = 1 + (up ? 1 : -0.6) * dt * 0.0016;
      if (xf.from === 'solar') this.dist *= f; else this.deep.drift(xf.from as DeepScale, f);
      if (xf.t >= 1) this.xf = null;
    }
    const weight = (s: ScaleId) => (!xf ? (s === this.scale ? 1 : 0) : s === xf.to ? e : s === xf.from ? 1 - e : 0);
    const primary: ScaleId = xf && e < 0.5 ? xf.from : this.scale;
    this.renderer.clear();
    const ws = weight('solar');
    if (ws > 0) {
      this.updateBodies(dt / 1000);
      this.updateCamera(dt);
      this.sunU.uTime.value = now / 1000;
      this.updateLOD();
      this.renderer.render(this.scene, this.camera);
      if (ws < 1) {
        (this.veil.material as THREE.MeshBasicMaterial).opacity = 1 - ws;
        this.renderer.render(this.veilScene, this.veilCam);
      }
    }
    this.deep.update(dt);
    this.deep.setScreen(this.sized.w, this.sized.h, this.renderer.getPixelRatio());
    for (const s of xf ? [xf.from, xf.to] : [this.scale]) if (s !== 'solar') this.deep.render(this.renderer, s, weight(s), this.camera.fov);
    this.labelsEl.hidden = this.featEl.hidden = primary !== 'solar';
    if (primary === 'solar') this.updateLabels();
    this.deep.labels(primary === 'solar' ? null : primary as DeepScale);
    const pr = this.adapt.sample(frameMs);
    if (pr !== null) this.renderer.setPixelRatio(pr);
    if (now - this.lastTime > 250) { this.lastTime = now; this.ev.onTime?.(this.simMs); }
    if (this.scale !== 'solar') return;
    const rt = this.rts.get(this.focusId)!;
    const view = this.focusId + (this.dist < rt.R * 30 ? ':near' : ':far');
    if (view !== this.lastView) { this.lastView = view; this.ev.onView?.(this.focusId, this.dist < rt.R * 30); }
  }

  /** Dense spheres and the big texture only for the body you are looking at. */
  private updateLOD(): void {
    for (const rt of this.rts.values()) {
      const close = rt.b.id === this.focusId || this.camera.position.distanceTo(rt.pos) < rt.R * 8;
      const g = close ? this.geoHi : this.geoLo;
      if (rt.mesh.geometry !== g) rt.mesh.geometry = g;
      if (rt.orbit) {
        const m = rt.orbit.material as THREE.LineBasicMaterial;
        m.opacity = rt.b.id === this.focusId || (rt.b.kind === 'moon' && (rt.b.parent === this.focusId || BODY[this.focusId].parent === rt.b.parent)) ? 0.5 : 0.2;
        // Moon orbits only near their planet; they'd just be clutter in the overview.
        if (rt.b.kind === 'moon') rt.orbit.visible = this.camera.position.distanceTo(this.rts.get(rt.b.parent!)!.pos) < 30;
      }
    }
  }

  private updateLabels(): void {
    const W = this.sized.w, H = this.sized.h;
    const k = (H / 2) / Math.tan((this.camera.fov * D2R) / 2);
    const cam = this.camera.position, focus = this.rts.get(this.focusId)!;
    const p = new THREE.Vector3();
    const occluded = (pt: THREE.Vector3, skip: BodyRT) => {
      if (skip === focus) return false;
      // Ray camera → pt against the focus body's sphere.
      const d = pt.clone().sub(cam), len = d.length();
      d.divideScalar(len);
      const oc = cam.clone().sub(focus.pos), b = oc.dot(d), c = oc.lengthSq() - focus.R * focus.R, disc = b * b - c;
      if (disc < 0) return false;
      const t0 = -b - Math.sqrt(disc);
      return t0 > 0 && t0 < len;
    };
    for (const rt of this.rts.values()) {
      const b = rt.b;
      const dc = cam.distanceTo(rt.pos);
      // Hide a body's name once its disc is big on screen (the card and breadcrumb already name it).
      let show = dc > rt.R * 3.2 && (rt.R / dc) * k < 70;
      if (b.kind === 'moon') {
        const par = this.rts.get(b.parent!)!;
        show &&= this.focusId === b.id || this.focusId === b.parent || BODY[this.focusId].parent === b.parent || cam.distanceTo(par.pos) < par.R * 18;
      }
      if (show) {
        p.copy(rt.pos).project(this.camera);
        show = p.z < 1 && p.z > -1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1 && !occluded(rt.pos, rt);
      }
      rt.label.hidden = !show;
      if (!show) continue;
      const sx = (p.x + 1) / 2 * W, sy = (1 - p.y) / 2 * H + Math.min(80, (rt.R / dc) * k) + 6;
      rt.label.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translateX(-50%)`;
      rt.label.classList.toggle('on', b.id === this.focusId);
    }
    const placed: [number, number][] = [];
    const f = this.rts.get(this.focusId)!;
    this.sites.sync(this.focusId !== 'sun' && this.dist < f.R * 9 ? { id: this.focusId, R: f.R, pos: f.pos, tilt: f.tilt, spin: f.spin } : null);
    this.sites.update(performance.now(), this.simMs, this.camera, W, H, { id: this.focusId, R: f.R, pos: f.pos, tilt: f.tilt, spin: f.spin },
      this.focusId === 'sun' && this.dist > 60 && !this.tween, placed);
    this.updateFeatureLabels(W, H, placed);
  }

  private updateFeatureLabels(W: number, H: number, placed: [number, number][]): void {
    const rt = this.rts.get(this.focusId)!;
    const list = featuresOf(this.focusId);
    const want = new Set<string>();
    const cam = this.camera.position;
    if (list.length && this.dist < rt.R * 7 && !this.tween) {
      const max = W < 700 ? 8 : 14;
      rt.spin.updateWorldMatrix(true, false);
      const toCam = cam.clone().sub(rt.pos);
      const dc = toCam.length();
      toCam.divideScalar(dc);
      const horizon = rt.R / dc;
      const n = new THREE.Vector3(), p = new THREE.Vector3();
      for (const f of list) {
        if (want.size >= max && f !== this.selFeature) continue;
        n.set(...latLonToVec(f.lat, f.lon)).transformDirection(rt.spin.matrixWorld);
        if (n.dot(toCam) < horizon + 0.12) continue;
        p.copy(n).multiplyScalar(rt.R).add(rt.pos).project(this.camera);
        if (p.z > 1) continue;
        const sx = (p.x + 1) / 2 * W, sy = (1 - p.y) / 2 * H;
        if (sx < 8 || sy < 8 || sx > W - 8 || sy > H - 8) continue;
        const sel = f === this.selFeature;
        // Simple de-clutter: skip labels too close to an already placed (bigger) one.
        if (!sel && placed.some(([x, y]) => Math.abs(x - sx) < 70 && Math.abs(y - sy) < 20)) continue;
        placed.push([sx, sy]);
        want.add(f.key);
        let el = this.featLabels.get(f.key);
        if (!el) {
          el = document.createElement('button');
          el.className = 'sf-label kind-' + f.kind;
          el.dataset.testid = f.key;
          el.innerHTML = '<i></i><span></span>';
          el.querySelector('span')!.textContent = tr(f.name, lang());
          el.onclick = () => this.selectFeature(f);
          this.featEl.append(el);
          this.featLabels.set(f.key, el);
        }
        el.classList.toggle('on', sel);
        el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
      }
    }
    for (const [key, el] of this.featLabels) el.hidden = !want.has(key);
  }
}
