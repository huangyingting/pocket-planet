import * as THREE from 'three';
import type { CatalogueItem, Lang } from '../../shared/data/types.ts';
import { tr } from '../../shared/data/types.ts';
import { latLonToVec, vecToLatLon, slerpLatLon } from '../../shared/lib/geo.ts';
import { buildModel, mat } from '../models/kit.ts';
import type { CountryInfo } from './painter.ts';
import { CITIES } from '../../shared/data/cities.ts';

export interface Settings {
  terrain: boolean; names: boolean; borders: boolean; shadows: boolean;
  landmarks: boolean; animals: boolean; discoveries: boolean; vehicles: boolean; sfx: boolean; bgm: boolean;
}
export const DEFAULT_SETTINGS: Settings = { terrain: false, names: true, borders: true, shadows: true, landmarks: true, animals: true, discoveries: true, vehicles: true, sfx: true, bgm: false };

export const DEFAULT_H = 2.2;
export const MIN_H = 0.07;
export const MAX_H = 4.5;
export const TIER_ZOOM = [0, 0, 4.3, 5.3];
// zoom readout: ×4.0 at the default altitude, proportional to 1/altitude.
export const zoomFromH = (h: number) => (4 * DEFAULT_H) / h;
export const hFromZoom = (z: number) => (4 * DEFAULT_H) / z;

const LAYER_OF: Record<CatalogueItem['type'], keyof Settings> = { landmark: 'landmarks', animal: 'animals', discovery: 'discoveries', vehicle: 'vehicles' };
const OCEANS: [string, Record<Lang, string>, number, number][] = [
  ['pacific', { en: 'PACIFIC OCEAN', ko: '태평양', ja: '太平洋', zh: '太平洋' }, 0, -150],
  ['pacific2', { en: 'PACIFIC OCEAN', ko: '태평양', ja: '太平洋', zh: '太平洋' }, 15, 165],
  ['atlantic', { en: 'ATLANTIC OCEAN', ko: '대서양', ja: '大西洋', zh: '大西洋' }, 15, -40],
  ['atlantic2', { en: 'ATLANTIC OCEAN', ko: '대서양', ja: '大西洋', zh: '大西洋' }, -25, -15],
  ['indian', { en: 'INDIAN OCEAN', ko: '인도양', ja: 'インド洋', zh: '印度洋' }, -20, 78],
  ['arctic', { en: 'ARCTIC OCEAN', ko: '북극해', ja: '北極海', zh: '北冰洋' }, 82, 0],
  ['southern', { en: 'SOUTHERN OCEAN', ko: '남극해', ja: '南極海', zh: '南冰洋' }, -60, 60],
];

interface Placed { item: CatalogueItem; obj: THREE.Group; seg: number; t: number; pts: [number, number][]; heading: THREE.Vector3 }

export interface GlobeEvents {
  onPick?: (item: CatalogueItem | null) => void;
  onGlobeTap?: (lat: number, lon: number) => void;
  onView?: (zoom: number, lat: number, lon: number) => void;
  onFirst?: (what: 'drag' | 'zoom') => void;
}

export class Globe {
  renderer!: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  earth!: THREE.Mesh;
  private earthMat!: THREE.MeshStandardMaterial;
  private sun = new THREE.DirectionalLight(0xffffff, 2.2);
  private ambient = new THREE.HemisphereLight(0xdfe8ff, 0x445566, 0.9);
  private itemsRoot = new THREE.Group();
  private pinsRoot = new THREE.Group();
  private placed = new Map<string, Placed>();
  private labelsEl: HTMLDivElement;
  private labelPool: HTMLSpanElement[] = [];
  private countries: CountryInfo[] = [];
  private selRing: THREE.Mesh;
  private selected: string | null = null;

  lat = 25; lon = 40; h = DEFAULT_H;
  private vLat = 0; private vLon = 0;
  private fly: { from: [number, number, number]; to: [number, number, number]; t: number; dur: number } | null = null;
  ride: { key: string; yaw: number; dist: number; first: boolean } | null = null;
  settings: Settings = { ...DEFAULT_SETTINGS };
  lang: Lang = 'en';
  gameMode = false;
  private dirty = true;
  private last = performance.now();
  private lastLabel = 0;
  private clock = 0;

  constructor(private container: HTMLElement, public ev: GlobeEvents, private lowfx = false) {
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.005, 100);
    this.labelsEl = document.createElement('div');
    this.labelsEl.className = 'labels';
    this.selRing = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.95, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    this.selRing.visible = false;
  }

  /** Returns false if WebGL is unavailable. */
  init(earthCanvas: HTMLCanvasElement, countries: CountryInfo[], items: CatalogueItem[]): boolean {
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: !this.lowfx, alpha: false, powerPreference: 'high-performance' });
    } catch { return false; }
    this.countries = countries;
    const r = this.renderer;
    r.setPixelRatio(this.lowfx ? 1 : Math.min(2, devicePixelRatio));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.domElement.className = 'globe-canvas';
    r.domElement.setAttribute('aria-label', 'Interactive 3D globe');
    r.domElement.tabIndex = 0;
    this.container.append(r.domElement, this.labelsEl);
    this.scene.background = new THREE.Color('#050b1a');

    const tex = new THREE.CanvasTexture(earthCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = r.capabilities.getMaxAnisotropy();
    this.earthMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0 });
    this.earth = new THREE.Mesh(new THREE.SphereGeometry(1, this.lowfx ? 64 : 128, this.lowfx ? 32 : 64), this.earthMat);
    // Our lat/lon convention puts lon=0 on +Z; SphereGeometry's u=0 seam is at -X, so rotate by -90°.
    this.earth.rotation.y = -Math.PI / 2;
    this.scene.add(this.earth, this.itemsRoot, this.pinsRoot, this.sun, this.sun.target, this.ambient, this.selRing);
    this.addAtmosphere();
    this.addStars();
    for (const it of items) this.place(it);
    this.applySettings(this.settings);
    this.resize();
    new ResizeObserver(() => this.resize()).observe(this.container);
    this.bindInput(r.domElement);
    const loop = () => { this.frame(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    return true;
  }

  setEarthTexture(cv: HTMLCanvasElement): void {
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.earthMat.map?.dispose();
    this.earthMat.map = tex;
    this.earthMat.needsUpdate = true;
    this.dirty = true;
  }

  private addAtmosphere(): void {
    const m = new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
      fragmentShader: 'varying vec3 vN; void main(){ float i = pow(0.75 - dot(vN, vec3(0,0,1.0)), 3.0); gl_FragColor = vec4(0.35,0.65,1.0,1.0)*i; }',
    });
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.12, 48, 24), m));
  }

  private addStars(): void {
    const n = this.lowfx ? 300 : 1500, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(40 + Math.random() * 10);
      pos.set([v.x, v.y, v.z], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, sizeAttenuation: true })));
  }

  private orientAt(obj: THREE.Object3D, lat: number, lon: number, r: number, heading?: THREE.Vector3): void {
    const N = new THREE.Vector3(...latLonToVec(lat, lon));
    obj.position.copy(N).multiplyScalar(r);
    let z: THREE.Vector3;
    if (heading && heading.lengthSq() > 1e-12) z = heading.clone().sub(N.clone().multiplyScalar(heading.dot(N))).normalize();
    else { const north = this.northAt(lat, lon); z = north.negate(); }
    const x = new THREE.Vector3().crossVectors(N, z).normalize();
    obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, N, z));
  }

  private northAt(lat: number, lon: number): THREE.Vector3 {
    const p = (lat * Math.PI) / 180, l = (lon * Math.PI) / 180;
    return new THREE.Vector3(-Math.sin(p) * Math.sin(l), Math.cos(p), -Math.sin(p) * Math.cos(l));
  }

  private place(item: CatalogueItem): void {
    const obj = buildModel(item.model);
    obj.userData.key = item.key;
    const wrap = new THREE.Group();
    wrap.add(obj);
    const p: Placed = { item, obj: wrap, seg: 0, t: 0, pts: item.route ? item.route.pts.map(x => [x[0], x[1]] as [number, number]) : [], heading: new THREE.Vector3() };
    if (item.route) {
      // Spread vehicles along their routes deterministically.
      const h = [...item.key].reduce((a, c) => a + c.charCodeAt(0), 0);
      p.seg = h % Math.max(1, item.route.pts.length - 1);
      p.t = (h % 97) / 97;
    }
    this.orientAt(wrap, item.lat, item.lon, 1.0);
    this.itemsRoot.add(wrap);
    this.placed.set(item.key, p);
  }

  applySettings(s: Settings): void {
    this.settings = { ...s };
    this.sun.intensity = s.shadows ? 2.4 : 0;
    this.ambient.intensity = s.shadows ? 0.55 : 2.2;
    this.labelsEl.style.display = s.names ? '' : 'none';
    this.dirty = true;
  }

  get zoom(): number { return zoomFromH(this.h); }

  // ---------- input ----------
  private bindInput(el: HTMLCanvasElement): void {
    const ptrs = new Map<number, { x: number; y: number }>();
    let down: { x: number; y: number; t: number } | null = null;
    let pinch0 = 0, h0 = this.h, moved = false;
    el.addEventListener('pointerdown', e => {
      el.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) { down = { x: e.clientX, y: e.clientY, t: performance.now() }; moved = false; }
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); h0 = this.h; }
      this.vLat = this.vLon = 0; this.fly = null;
    });
    el.addEventListener('pointermove', e => {
      const prev = ptrs.get(e.pointerId);
      if (!prev) return;
      const cur = { x: e.clientX, y: e.clientY };
      ptrs.set(e.pointerId, cur);
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch0 > 0) this.setH(h0 * (pinch0 / d));
        moved = true;
        this.ev.onFirst?.('zoom');
        return;
      }
      const dx = cur.x - prev.x, dy = cur.y - prev.y;
      if (down && Math.hypot(cur.x - down.x, cur.y - down.y) > 6) moved = true;
      if (!moved) return;
      if (this.ride) { this.ride.yaw -= dx * 0.008; this.dirty = true; return; }
      const k = this.degPerPx();
      this.lon -= dx * k / Math.max(0.2, Math.cos((this.lat * Math.PI) / 180));
      this.lat = Math.max(-85, Math.min(85, this.lat + dy * k));
      this.vLon = -dx * k; this.vLat = dy * k;
      this.dirty = true;
      this.ev.onFirst?.('drag');
    });
    const up = (e: PointerEvent) => {
      ptrs.delete(e.pointerId);
      if (down && !moved && performance.now() - down.t < 600 && ptrs.size === 0) this.tap(e.clientX, e.clientY);
      if (ptrs.size === 0) down = null;
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); down = null; });
    el.addEventListener('wheel', e => {
      e.preventDefault();
      if (this.ride) { this.ride.dist = Math.max(0.5, Math.min(6, this.ride.dist * Math.exp(e.deltaY * 0.0015))); this.dirty = true; return; }
      this.setH(this.h * Math.exp(e.deltaY * 0.0015));
      this.ev.onFirst?.('zoom');
    }, { passive: false });
    el.addEventListener('keydown', e => {
      const k = this.degPerPx() * 40;
      if (e.key === 'ArrowLeft') this.lon -= k; else if (e.key === 'ArrowRight') this.lon += k;
      else if (e.key === 'ArrowUp') this.lat = Math.min(85, this.lat + k); else if (e.key === 'ArrowDown') this.lat = Math.max(-85, this.lat - k);
      else if (e.key === '+' || e.key === '=') this.zoomBy(1.25); else if (e.key === '-') this.zoomBy(0.8);
      else return;
      e.preventDefault(); this.dirty = true;
    });
  }

  private degPerPx(): number {
    const H = this.renderer.domElement.clientHeight || 800;
    return ((this.h * 2 * Math.tan((this.camera.fov * Math.PI) / 360)) / H) * (180 / Math.PI) * 0.9;
  }

  setH(h: number): void { this.h = Math.max(MIN_H, Math.min(MAX_H, h)); this.dirty = true; }
  zoomBy(f: number): void { this.flyTo(this.lat, this.lon, this.h / f, 350); }

  flyTo(lat: number, lon: number, h = this.h, dur = 1200): void {
    let dl = ((lon - this.lon + 540) % 360) - 180;
    this.fly = { from: [this.lat, this.lon, this.h], to: [lat, this.lon + dl, Math.max(MIN_H, Math.min(MAX_H, h))], t: 0, dur };
    this.vLat = this.vLon = 0;
    this.dirty = true;
  }

  private tap(cx: number, cy: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = cx - rect.left, y = cy - rect.top;
    if (this.gameMode) {
      const ll = this.screenToLatLon(x, y);
      if (ll) this.ev.onGlobeTap?.(ll[0], ll[1]);
      return;
    }
    const hit = this.pickAt(x, y);
    this.ev.onPick?.(hit);
  }

  screenToLatLon(x: number, y: number): [number, number] | null {
    const el = this.renderer.domElement;
    const ndc = new THREE.Vector2((x / el.clientWidth) * 2 - 1, -(y / el.clientHeight) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const p = new THREE.Vector3();
    if (!ray.ray.intersectSphere(new THREE.Sphere(new THREE.Vector3(), 1), p)) return null;
    return vecToLatLon(p.x, p.y, p.z);
  }

  /** Screen position of a world point, or null if behind the globe / off-screen. */
  project(v: THREE.Vector3): { x: number; y: number } | null {
    const camDir = this.camera.position.clone().sub(v);
    const N = v.clone().normalize();
    if (N.dot(camDir.normalize()) < 0.05) return null;
    const p = v.clone().project(this.camera);
    if (p.z > 1) return null;
    const el = this.renderer.domElement;
    return { x: ((p.x + 1) / 2) * el.clientWidth, y: ((1 - p.y) / 2) * el.clientHeight };
  }

  itemScreen(key: string): { x: number; y: number } | null {
    const p = this.placed.get(key);
    if (!p || !p.obj.visible) return null;
    const c = p.obj.position.clone().add(p.obj.position.clone().normalize().multiplyScalar(this.modelScale(p.item) * 0.4));
    return this.project(c);
  }

  pickAt(x: number, y: number): CatalogueItem | null {
    let best: CatalogueItem | null = null, bd = Infinity;
    for (const p of this.placed.values()) {
      if (!p.obj.visible) continue;
      const s = this.itemScreen(p.item.key);
      if (!s) continue;
      const d = Math.hypot(s.x - x, s.y - y);
      if (d < 34 && d < bd) { bd = d; best = p.item; }
    }
    return best;
  }

  select(key: string | null): void {
    this.selected = key;
    this.dirty = true;
  }

  // ---------- pins / arcs for games ----------
  clearPins(): void { this.pinsRoot.clear(); this.dirty = true; }
  addPin(lat: number, lon: number, color: string): void {
    const g = new THREE.Group();
    const s = Math.max(0.006, this.h * 0.02);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 6).translate(0, 0.5, 0), mat('#eeeeee'));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), mat(color, { emissive: color }));
    head.position.y = 1.05;
    g.add(stick, head);
    g.scale.setScalar(s * 1.8);
    this.orientAt(g, lat, lon, 1.0);
    this.pinsRoot.add(g);
    this.dirty = true;
  }
  addArc(a: [number, number], b: [number, number], color = '#ffd24a'): void {
    const pts: THREE.Vector3[] = [];
    const n = 64;
    for (let i = 0; i <= n; i++) {
      const t = i / n, [la, lo] = slerpLatLon(a, b, t);
      const lift = 1.002 + Math.sin(Math.PI * t) * Math.min(0.15, this.angDist(a, b) * 0.12);
      pts.push(new THREE.Vector3(...latLonToVec(la, lo, lift)));
    }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, Math.max(0.0015, this.h * 0.0025), 5);
    this.pinsRoot.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color })));
    this.dirty = true;
  }
  private angDist(a: [number, number], b: [number, number]): number {
    const va = new THREE.Vector3(...latLonToVec(a[0], a[1])), vb = new THREE.Vector3(...latLonToVec(b[0], b[1]));
    return va.angleTo(vb);
  }

  // ---------- ride ----------
  startRide(key: string): boolean {
    const p = this.placed.get(key);
    if (!p?.item.route) return false;
    this.ride = { key, yaw: 0, dist: 2, first: false };
    this.select(null);
    this.dirty = true;
    return true;
  }
  setRideView(first: boolean): void { if (this.ride) { this.ride.first = first; this.dirty = true; } }
  stopRide(): void {
    if (!this.ride) return;
    const p = this.placed.get(this.ride.key);
    this.ride = null;
    if (p) { const [la, lo] = vecToLatLon(p.obj.position.x, p.obj.position.y, p.obj.position.z); this.lat = la; this.lon = lo; this.h = 0.5; }
    this.dirty = true;
  }

  // ---------- photo ----------
  capture(type = 'image/jpeg'): string {
    const labels = this.labelsEl.style.visibility;
    this.renderer.render(this.scene, this.camera);
    const url = this.renderer.domElement.toDataURL(type, 0.9);
    this.labelsEl.style.visibility = labels;
    return url;
  }

  // ---------- frame ----------
  private resize(): void {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = w + 'px';
    this.renderer.domElement.style.height = h + 'px';
    this.camera.aspect = w / h;
    // Keep the globe fully visible on portrait screens.
    this.camera.fov = w < h ? 35 * Math.min(1.6, h / w) : 35;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  private modelScale(item: CatalogueItem): number {
    const base = item.type === 'vehicle' ? 0.045 : item.type === 'animal' ? 0.05 : 0.065;
    return base * Math.max(0.05, Math.min(1.15, this.h / DEFAULT_H)) * 1;
  }

  private updateCamera(dt: number): void {
    if (this.fly) {
      this.fly.t = Math.min(1, this.fly.t + dt / this.fly.dur);
      const e = this.fly.t < 0.5 ? 2 * this.fly.t ** 2 : 1 - (-2 * this.fly.t + 2) ** 2 / 2;
      const [a, b] = [this.fly.from, this.fly.to];
      this.lat = a[0] + (b[0] - a[0]) * e;
      this.lon = a[1] + (b[1] - a[1]) * e;
      // Zoom out a little mid-flight for long hops.
      const hop = Math.min(1.2, Math.hypot(b[0] - a[0], b[1] - a[1]) / 120);
      this.h = Math.exp(Math.log(a[2]) + (Math.log(b[2]) - Math.log(a[2])) * e) + Math.sin(Math.PI * e) * hop;
      if (this.fly.t >= 1) this.fly = null;
      this.dirty = true;
    } else if (Math.abs(this.vLat) + Math.abs(this.vLon) > 1e-4) {
      this.lon += this.vLon / Math.max(0.2, Math.cos((this.lat * Math.PI) / 180));
      this.lat = Math.max(-85, Math.min(85, this.lat + this.vLat));
      this.vLat *= 0.9; this.vLon *= 0.9;
      this.dirty = true;
    }
    this.lon = ((this.lon + 540) % 360) - 180;

    if (this.ride) {
      const p = this.placed.get(this.ride.key)!;
      const pos = p.obj.position.clone();
      const N = pos.clone().normalize();
      const fwd = p.heading.clone().normalize();
      const right = new THREE.Vector3().crossVectors(fwd, N).normalize();
      const s = this.modelScale(p.item);
      const yawed = fwd.clone().multiplyScalar(Math.cos(this.ride.yaw)).add(right.clone().multiplyScalar(Math.sin(this.ride.yaw)));
      if (this.ride.first) {
        this.camera.position.copy(pos).add(N.clone().multiplyScalar(s * 0.5)).add(yawed.clone().multiplyScalar(s * 0.5));
        this.camera.up.copy(N);
        this.camera.lookAt(this.camera.position.clone().add(yawed).add(N.clone().multiplyScalar(-0.05)));
      } else {
        const d = s * 6 * this.ride.dist;
        this.camera.position.copy(pos).add(yawed.clone().multiplyScalar(-d)).add(N.clone().multiplyScalar(d * 0.45));
        this.camera.up.copy(N);
        this.camera.lookAt(pos.clone().add(N.clone().multiplyScalar(s * 0.5)));
      }
      this.camera.near = 0.0005;
      this.camera.updateProjectionMatrix();
      return;
    }
    this.camera.near = Math.max(0.0008, this.h * 0.05);
    this.camera.updateProjectionMatrix();

    const T = new THREE.Vector3(...latLonToVec(this.lat, this.lon));
    const N = T.clone();
    const north = this.northAt(this.lat, this.lon);
    // Tilt toward the horizon when zoomed in close.
    const z = this.zoom;
    const tilt = z <= 8 ? 0 : Math.min(0.9, ((z - 8) / 40) * 0.9);
    const dir = N.clone().multiplyScalar(Math.cos(tilt)).add(north.clone().multiplyScalar(-Math.sin(tilt)));
    this.camera.position.copy(T).add(dir.multiplyScalar(this.h));
    this.camera.up.copy(north.clone().multiplyScalar(Math.cos(tilt)).add(N.clone().multiplyScalar(Math.sin(tilt))));
    this.camera.lookAt(T);
  }

  private updateItems(dt: number): void {
    const z = this.zoom;
    for (const p of this.placed.values()) {
      const it = p.item;
      const layerOn = this.settings[LAYER_OF[it.type]] as boolean;
      const tierOk = z >= TIER_ZOOM[it.tier] || this.selected === it.key || this.ride?.key === it.key;
      p.obj.visible = layerOn && tierOk && !this.gameMode;
      if (!p.obj.visible) continue;
      const s = this.modelScale(it);
      p.obj.scale.setScalar(s);
      if (it.route) {
        const r = it.route, pts = p.pts;
        const a = pts[p.seg], b = pts[Math.min(pts.length - 1, p.seg + 1)] ?? pts[0];
        const seg = this.angDist(a, b) * (180 / Math.PI) || 1;
        p.t += (r.speed * dt) / 1000 / seg;
        if (p.t >= 1) {
          p.t = 0;
          if (r.mode === 'loop') p.seg = (p.seg + 1) % pts.length;
          else { p.seg += 1; if (p.seg >= pts.length - 1) { pts.reverse(); p.seg = 0; } }
        }
        const nb = pts[(p.seg + 1) % pts.length];
        const [la, lo] = slerpLatLon(pts[p.seg], nb, p.t);
        const [la2, lo2] = slerpLatLon(pts[p.seg], nb, Math.min(1, p.t + 0.01));
        const v1 = new THREE.Vector3(...latLonToVec(la, lo)), v2 = new THREE.Vector3(...latLonToVec(la2, lo2));
        const hd = v2.sub(v1);
        if (hd.lengthSq() > 1e-14) p.heading.copy(hd);
        const alt = r.kind === 'plane' ? 1 + Math.max(0.01, s * 1.4) : 1.0;
        this.orientAt(p.obj, la, lo, alt, p.heading);
      }
      const inner = p.obj.children[0];
      if (it.type === 'animal' && !this.lowfx) inner.position.y = Math.abs(Math.sin(this.clock * 0.003 + it.lat)) * 0.06;
      inner.traverse(o => {
        if (o.name === 'spin') o.rotation.z += dt * 0.002;
        if (o.name === 'flap') o.rotation.z = Math.sin(this.clock * 0.004) * 0.2;
      });
    }
    const sel = this.selected ? this.placed.get(this.selected) : null;
    this.selRing.visible = !!sel?.obj.visible;
    if (sel) {
      this.selRing.position.copy(sel.obj.position).multiplyScalar(1.0005);
      this.selRing.quaternion.copy(sel.obj.quaternion);
      const s = this.modelScale(sel.item) * (1 + Math.sin(this.clock * 0.005) * 0.08);
      this.selRing.scale.setScalar(s);
    }
  }

  private updateSun(): void {
    // Sub-solar point from current UTC time (approximate, ignores equation of time).
    const now = new Date();
    const doy = (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.UTC(now.getUTCFullYear(), 0, 0)) / 864e5;
    const decl = -23.44 * Math.cos(((2 * Math.PI) / 365) * (doy + 10));
    const lon = 180 - ((now.getUTCHours() + now.getUTCMinutes() / 60) / 24) * 360;
    // Keep the camera side lit enough for kids: blend real sun with a camera-side key light.
    const real = new THREE.Vector3(...latLonToVec(decl, lon));
    const cam = this.camera.position.clone().normalize();
    this.sun.position.copy(real.multiplyScalar(0.35).add(cam.multiplyScalar(0.65)).normalize().multiplyScalar(10));
  }

  private updateLabels(): void {
    if (!this.settings.names || this.ride) { for (const s of this.labelPool) s.style.display = 'none'; return; }
    const z = this.zoom;
    type L = { text: string; cls: string; x: number; y: number; pri: number };
    const out: L[] = [];
    const push = (text: string, cls: string, lat: number, lon: number, pri: number) => {
      const s = this.project(new THREE.Vector3(...latLonToVec(lat, lon, 1.002)));
      if (s) out.push({ text, cls, x: s.x, y: s.y, pri });
    };
    if (!this.gameMode || z > 0) {
      for (const c of this.countries) {
        if (!c.a2 || c.area * z * z < 900) continue;
        push(this.countryLabel(c), 'lb-country', c.lat, c.lon, 1000 + c.area);
      }
      if (!this.gameMode) {
        const minPop = z < 3 ? Infinity : z < 5 ? 12 : z < 8 ? 4 : z < 15 ? 1.2 : 0;
        for (const [name, , la, lo, pop, cap] of CITIES) {
          if (pop < minPop && !(cap && z >= 6)) continue;
          push(name, cap ? 'lb-city lb-cap' : 'lb-city', la, lo, pop + (cap ? 5 : 0));
        }
      }
      if (z < 12) for (const [, n, la, lo] of OCEANS) push(n[this.lang] ?? n.en, 'lb-ocean', la, lo, 2000);
    }
    out.sort((a, b) => b.pri - a.pri);
    const boxes: [number, number, number, number][] = [];
    let used = 0;
    for (const l of out) {
      const w = l.text.length * (l.cls === 'lb-country' ? 8 : 6.5) + 10, h = 16;
      const bx: [number, number, number, number] = [l.x - w / 2, l.y - h / 2, l.x + w / 2, l.y + h / 2];
      if (boxes.some(b => bx[0] < b[2] && bx[2] > b[0] && bx[1] < b[3] && bx[3] > b[1])) continue;
      boxes.push(bx);
      let el = this.labelPool[used];
      if (!el) { el = document.createElement('span'); this.labelsEl.append(el); this.labelPool.push(el); }
      if (el.textContent !== l.text) el.textContent = l.text;
      if (el.className !== l.cls) el.className = l.cls;
      el.style.display = '';
      el.style.transform = `translate(${l.x.toFixed(1)}px,${l.y.toFixed(1)}px) translate(-50%,-50%)`;
      used++;
      if (used > 140) break;
    }
    for (let i = used; i < this.labelPool.length; i++) this.labelPool[i].style.display = 'none';
  }

  private names = new Map<string, string>();
  private countryLabel(c: CountryInfo): string {
    const k = this.lang + c.a2;
    let s = this.names.get(k);
    if (!s) {
      try { s = new Intl.DisplayNames([this.lang], { type: 'region' }).of(c.a2) ?? c.name; } catch { s = c.name; }
      if (c.a2 === 'XK') s = c.name;
      if (this.lang === 'en') s = s.toUpperCase();
      this.names.set(k, s);
    }
    return s;
  }

  itemName(key: string): string { const p = this.placed.get(key); return p ? tr(p.item.name, this.lang) : ''; }

  private frame(): void {
    const now = performance.now();
    const dt = Math.min(100, now - this.last);
    this.last = now;
    this.clock += dt;
    const animate = !this.lowfx || now - this.lastLabel > 1000;
    this.updateCamera(dt);
    if (!animate && !this.dirty) return;
    this.updateItems(dt);
    this.updateSun();
    this.renderer.render(this.scene, this.camera);
    if (this.dirty || now - this.lastLabel > (this.lowfx ? 1000 : 120)) { this.updateLabels(); this.lastLabel = now; }
    if (this.dirty) this.ev.onView?.(this.zoom, this.lat, this.lon);
    this.dirty = false;
  }

  markDirty(): void { this.dirty = true; }
}
