import * as THREE from 'three';
import type { CatalogueItem, Lang } from '../../shared/data/types.ts';
import { tr } from '../../shared/data/types.ts';
import { latLonToVec, vecToLatLon, slerpLatLon } from '../../shared/lib/geo.ts';
import { buildModel, mat } from '../models/kit.ts';
import { paintNightLights, type CountryInfo } from './painter.ts';
import { CITIES } from '../../shared/data/cities.ts';
import { TYPE_META, type LayerKey } from '../../shared/data/typemeta.ts';
import { GlobeLayers, RENDER_ORDER } from './layers.ts';

export type AuraPreset = 'waves' | 'aurora' | 'ember' | 'dusk' | 'sculpture';
export type SurfaceMode = 'realistic' | 'minimal' | 'political';

export const AURA_PRESETS: Record<AuraPreset, { label: string; colors: [string, string, string] }> = {
  waves: { label: 'Atmosphere', colors: ['#38bdf8', '#1d4ed8', '#7dd3fc'] },
  aurora: { label: 'Aurora', colors: ['#2dd4bf', '#0284c7', '#34d399'] },
  ember: { label: 'Solar', colors: ['#38bdf8', '#1e40af', '#fbbf24'] },
  dusk: { label: 'Magneto', colors: ['#60a5fa', '#3730a3', '#818cf8'] },
  sculpture: { label: 'Ionosphere', colors: ['#22d3ee', '#0369a1', '#67e8f9'] },
};

export type Settings = Record<LayerKey, boolean> & {
  terrain: boolean; names: boolean; borders: boolean; shadows: boolean; sfx: boolean; bgm: boolean;
  /** globe layers: plate boundaries, drifting clouds, polar aurora */
  tectonics: boolean; clouds: boolean; aurora: boolean;
  auraPreset?: AuraPreset;
  surfaceMode?: SurfaceMode;
};
export const DEFAULT_SETTINGS: Settings = {
  terrain: true, names: true, borders: true, shadows: true,
  landmarks: true, animals: true, discoveries: true, vehicles: true,
  dinos: true, foods: true, festivals: true, space: true, plants: true, sports: true, volcanoes: true, migrations: true, voyages: true,
  tectonics: false, clouds: true, aurora: true,
  sfx: true, bgm: false,
  auraPreset: 'waves', surfaceMode: 'realistic',
};

export const DEFAULT_H = 2.2;
export const MIN_H = 0.07;
export const MAX_H = 4.5;
export const TIER_ZOOM = [0, 0, 4.3, 5.3];
// zoom readout: ×4.0 at the default altitude, proportional to 1/altitude.
export const zoomFromH = (h: number) => (4 * DEFAULT_H) / h;
export const hFromZoom = (z: number) => (4 * DEFAULT_H) / z;

/** Altitude (in globe radii) at which route items travel, given their current model scale. */
export function routeAltitude(kind: NonNullable<CatalogueItem['route']>['kind'], s: number): number {
  if (kind === 'orbit') return 1.06 + s * 0.6;
  if (kind === 'plane' || kind === 'fly') return 1 + Math.max(0.01, s * 1.4);
  return 1.0;
}
const OCEANS: [string, Record<Lang, string>, number, number][] = [
  ['pacific', { en: 'PACIFIC OCEAN', zh: '太平洋' }, 0, -150],
  ['pacific2', { en: 'PACIFIC OCEAN', zh: '太平洋' }, 15, 165],
  ['atlantic', { en: 'ATLANTIC OCEAN', zh: '大西洋' }, 15, -40],
  ['atlantic2', { en: 'ATLANTIC OCEAN', zh: '大西洋' }, -25, -15],
  ['indian', { en: 'INDIAN OCEAN', zh: '印度洋' }, -20, 78],
  ['arctic', { en: 'ARCTIC OCEAN', zh: '北冰洋' }, 82, 0],
  ['southern', { en: 'SOUTHERN OCEAN', zh: '南冰洋' }, -60, 60],
];

// ---- AuraFM Custom GLSL Earth Surface Shaders ----
const EARTH_VERT = `
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const EARTH_FRAG = `
  uniform sampler2D uLandTex;
  uniform sampler2D uNightTex;
  uniform vec3 uSunDir;
  uniform float uLandMix;
  uniform float uNightMix;
  uniform vec3 uOceanDeep;
  uniform vec3 uOceanMid;
  uniform vec3 uRimColor;
  uniform vec3 uAuraColor;
  uniform vec3 uStationPos;
  uniform float uTime;
  uniform float uAudioBass;
  uniform float uAudioMid;

  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vWorldPos;

  void main() {
    vec3 N = normalize(vNormalWorld);
    vec3 V = normalize(cameraPosition - vWorldPos);
    float facing = max(dot(N, V), 0.0);

    vec4 landSample = texture2D(uLandTex, vUv);
    float landMask = smoothstep(0.08, 0.55, landSample.a);

    vec3 ocean = mix(uOceanDeep, uOceanMid, 0.55 + 0.45 * facing);
    vec3 minimalLand = mix(vec3(0.09, 0.21, 0.36), vec3(0.15, 0.31, 0.50), facing);
    vec3 realisticLand = landSample.rgb * 1.18 + vec3(0.02, 0.04, 0.07);
    vec3 landColor = mix(minimalLand, realisticLand, uLandMix);

    vec3 base = mix(ocean, landColor, landMask);

    float sunDot = dot(N, normalize(uSunDir));
    float day = mix(1.0, smoothstep(-0.12, 0.18, sunDot), uNightMix);
    float diffuse = max(sunDot, 0.0);

    float viewLight = 0.68 + 0.32 * facing;
    float solarBoost = mix(1.0, 0.88 + 0.24 * day + 0.12 * diffuse, uNightMix);
    vec3 lit = base * viewLight * solarBoost;

    // Warm city lights on the night hemisphere (masked to landmasses)
    float lights = texture2D(uNightTex, vUv).r;
    lights *= lights; // keep bright city cores, drop the faint haze between them
    float lightPulse = 1.0 + uAudioMid * 0.35;
    vec3 nightGlow = vec3(1.0, 0.78, 0.46) * lights * landMask * lightPulse * (1.0 - day) * uNightMix * max(0.35, uLandMix) * 0.7;
    lit += nightGlow;

    // Concentric geodesic wave rings radiating from active landmark/object
    if (length(uStationPos) > 0.5) {
      vec3 stDir = normalize(uStationPos);
      float geoDist = acos(clamp(dot(N, stDir), -1.0, 1.0));
      float wave = sin(geoDist * 42.0 - uTime * 3.4) * 0.5 + 0.5;
      float ring = smoothstep(0.84, 0.99, wave) * exp(-geoDist * 4.5);
      float core = exp(-geoDist * 20.0) * 0.38;
      float amp = 0.26 + uAudioBass * 0.48 + uAudioMid * 0.28;
      lit += uAuraColor * (ring + core) * amp;
    }

    // Subtle atmospheric Fresnel rim + preset-tinted edge glow
    float rim = pow(1.0 - facing, 2.6);
    float edgeGlow = pow(1.0 - facing, 4.8);
    lit += uRimColor * rim * (0.28 + 0.24 * day);
    lit += uAuraColor * edgeGlow * (0.24 + uAudioBass * 0.22);

    gl_FragColor = vec4(lit, 1.0);
  }
`;

// ---- AuraFM Outer Planetary Aura / Multi-Layer Atmosphere Shaders ----
const ATMOS_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOS_FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uCameraDist;
  uniform float uAudioBass;
  uniform float uAudioMid;
  uniform float uAudioHigh;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

  void main() {
    float r = length(vUv);
    float angle = atan(vUv.y, vUv.x);

    // Exact perspective silhouette radius of the unit sphere at camera distance
    float c2 = max(0.18, uCameraDist * uCameraDist - 1.0);
    float rLimb = uCameraDist / sqrt(c2);

    // Smoothly attenuate outer billboard when zooming very close to the surface
    float zoomFade = smoothstep(1.18, 1.55, uCameraDist);

    // Distance outward from the Earth's 3D limb
    float d = max(0.0, r - rLimb * 0.995);

    // 1. Dense Rayleigh Horizon Rim
    float rayleigh = exp(-d * 18.0) * (0.48 + uAudioBass * 0.22);

    // 2. Stratosphere Swell
    float breath = 1.0 + 0.04 * sin(uTime * 0.7) + uAudioBass * 0.14;
    float strato = exp(-d * (6.2 / breath)) * (0.26 + uAudioBass * 0.18);

    // 3. Silky Ionosphere Aurora Veil (low-order harmonic waves)
    float w1 = sin(angle * 2.0 + uTime * 0.22);
    float w2 = cos(angle * 3.0 - uTime * 0.17);
    float w3 = sin(angle * 4.0 + uTime * 0.11);
    float harmonic = (w1 * 0.45 + w2 * 0.35 + w3 * 0.20) * 0.5 + 0.5;
    float veil = exp(-pow((d - 0.045 - harmonic * 0.055) / 0.13, 2.0))
               * (0.14 + harmonic * 0.14)
               * (0.75 + uAudioMid * 0.45);

    // 4. Wide Exosphere Deep-Space Halo
    float exo = exp(-d * 2.2) * (0.09 + uAudioHigh * 0.07);

    vec3 col = uColorA * (rayleigh + strato * 0.75)
             + mix(uColorB, uColorC, harmonic) * (veil + strato * 0.35)
             + uColorB * exo;

    float outerFade = 1.0 - smoothstep(1.35, 2.35, r);
    col *= outerFade * zoomFade;

    // Smooth filmic tone mapping
    col = col / (1.0 + col * 0.65);

    float alpha = clamp((rayleigh + strato + veil + exo) * outerFade * zoomFade, 0.0, 0.88);
    gl_FragColor = vec4(col, alpha);
  }
`;

interface Placed { item: CatalogueItem; obj: THREE.Group; seg: number; t: number; pts: [number, number][]; heading: THREE.Vector3 }

export interface GlobeEvents {
  onPick?: (item: CatalogueItem | null) => void;
  onHover?: (item: CatalogueItem | null, screen: { x: number; y: number } | null) => void;
  onGlobeTap?: (lat: number, lon: number) => void;
  onView?: (zoom: number, lat: number, lon: number) => void;
  onFirst?: (what: 'drag' | 'zoom') => void;
}

export class Globe {
  renderer!: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  earth!: THREE.Mesh;
  private earthMat!: THREE.ShaderMaterial;
  private earthUniforms!: {
    uLandTex: { value: THREE.Texture };
    uNightTex: { value: THREE.Texture };
    uSunDir: { value: THREE.Vector3 };
    uLandMix: { value: number };
    uNightMix: { value: number };
    uOceanDeep: { value: THREE.Color };
    uOceanMid: { value: THREE.Color };
    uRimColor: { value: THREE.Color };
    uAuraColor: { value: THREE.Color };
    uStationPos: { value: THREE.Vector3 };
    uTime: { value: number };
    uAudioBass: { value: number };
    uAudioMid: { value: number };
  };
  private atmosMesh!: THREE.Mesh;
  private atmosUniforms!: {
    uTime: { value: number };
    uCameraDist: { value: number };
    uAudioBass: { value: number };
    uAudioMid: { value: number };
    uAudioHigh: { value: number };
    uColorA: { value: THREE.Color };
    uColorB: { value: THREE.Color };
    uColorC: { value: THREE.Color };
  };
  private borderLines: THREE.LineSegments | null = null;
  private borderMat = new THREE.LineBasicMaterial({ color: '#5fa4e6', transparent: true, opacity: 0.32, depthWrite: false });
  private sun = new THREE.DirectionalLight(0xfffbeb, 2.55);
  private fillLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
  private ambient = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 1.15);
  private shadowTex: THREE.CanvasTexture | null = null;
  private itemsRoot = new THREE.Group();
  private pinsRoot = new THREE.Group();
  private flightArcGroup = new THREE.Group();
  private placed = new Map<string, Placed>();
  /** Items whose models are still waiting to be built — drained a few per frame so startup never blocks. */
  private pending = new Map<string, CatalogueItem>();
  private labelsEl: HTMLDivElement;
  private labelPool: HTMLSpanElement[] = [];
  private countries: CountryInfo[] = [];
  private selRing: THREE.Group;
  private selOuterMat: THREE.MeshBasicMaterial;
  private selInnerMat: THREE.MeshBasicMaterial;
  private selected: string | null = null;
  private hoveredKey: string | null = null;
  private targetColorA = new THREE.Color('#38bdf8');
  private targetColorB = new THREE.Color('#1d4ed8');
  private targetColorC = new THREE.Color('#7dd3fc');

  lat = 25; lon = 40; h = DEFAULT_H;
  private vLat = 0; private vLon = 0;
  private fly: { from: [number, number, number]; to: [number, number, number]; t: number; dur: number } | null = null;
  ride: { key: string; yaw: number; dist: number; first: boolean } | null = null;
  settings: Settings = { ...DEFAULT_SETTINGS };
  lang: Lang = 'en';
  gameMode = false;
  /** Optional extra visibility predicate (e.g. the time machine); selected/ridden items always stay visible. */
  private itemFilter: ((it: CatalogueItem) => boolean) | null = null;
  setItemFilter(fn: ((it: CatalogueItem) => boolean) | null): void { this.itemFilter = fn; this.dirty = true; }
  private layers: GlobeLayers | null = null;
  private dirty = true;
  private last = performance.now();
  private lastLabel = 0;
  private clock = 0;

  constructor(private container: HTMLElement, public ev: GlobeEvents, private lowfx = false) {
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.005, 100);
    this.labelsEl = document.createElement('div');
    this.labelsEl.className = 'labels';

    // AuraFM dual-layer glowing selection beacon
    this.selRing = new THREE.Group();
    this.selOuterMat = new THREE.MeshBasicMaterial({ color: '#22d3ee', transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
    this.selInnerMat = new THREE.MeshBasicMaterial({ color: '#67e8f9', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
    const outer = new THREE.Mesh(new THREE.RingGeometry(0.78, 0.98, 40).rotateX(-Math.PI / 2), this.selOuterMat);
    outer.name = 'outer';
    const pulse = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.08, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }));
    pulse.name = 'pulse';
    const inner = new THREE.Mesh(new THREE.CircleGeometry(0.76, 32).rotateX(-Math.PI / 2), this.selInnerMat);
    inner.position.y = -0.002;
    this.selRing.add(inner, outer, pulse);
    this.selRing.visible = false;
  }

  /** Returns false if WebGL is unavailable. */
  init(earthCanvas: HTMLCanvasElement, countries: CountryInfo[], items: CatalogueItem[], borderPositions?: Float32Array): boolean {
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
    // AuraFM slate-950 deep orbital space background
    this.scene.background = new THREE.Color('#020617');

    const landTex = new THREE.CanvasTexture(earthCanvas);
    landTex.colorSpace = THREE.SRGBColorSpace;
    landTex.anisotropy = r.capabilities.getMaxAnisotropy();

    const nightCanvas = paintNightLights(countries, this.lowfx ? 1024 : 2048);
    const nightTex = new THREE.CanvasTexture(nightCanvas);
    nightTex.anisotropy = r.capabilities.getMaxAnisotropy();

    this.earthUniforms = {
      uLandTex: { value: landTex },
      uNightTex: { value: nightTex },
      uSunDir: { value: new THREE.Vector3(1, 0.2, 0.5).normalize() },
      uLandMix: { value: this.settings.surfaceMode === 'minimal' ? 0.0 : 1.0 },
      uNightMix: { value: this.settings.shadows ? 1.0 : 0.0 },
      uOceanDeep: { value: new THREE.Color('#0c2340') },
      uOceanMid: { value: new THREE.Color('#163a63') },
      uRimColor: { value: new THREE.Color('#3d6fae') },
      uAuraColor: { value: new THREE.Color('#38bdf8') },
      uStationPos: { value: new THREE.Vector3(0, 0, 0) },
      uTime: { value: 0 },
      uAudioBass: { value: 0.12 },
      uAudioMid: { value: 0.1 },
    };

    this.earthMat = new THREE.ShaderMaterial({
      vertexShader: EARTH_VERT,
      fragmentShader: EARTH_FRAG,
      uniforms: this.earthUniforms,
    });

    this.earth = new THREE.Mesh(new THREE.SphereGeometry(1, this.lowfx ? 64 : 96, this.lowfx ? 48 : 96), this.earthMat);
    // Our lat/lon convention puts lon=0 on +Z; SphereGeometry's u=0 seam is at -X, so rotate by -90°.
    this.earth.rotation.y = -Math.PI / 2;
    this.earth.renderOrder = RENDER_ORDER.earth;

    if (borderPositions) this.setBorderPositions(borderPositions);

    this.scene.add(this.earth, this.itemsRoot, this.pinsRoot, this.flightArcGroup, this.sun, this.sun.target, this.fillLight, this.fillLight.target, this.ambient, this.selRing);
    this.addAtmosphere();
    this.addStars();
    this.layers = new GlobeLayers(r, this.scene, items, this.earthUniforms.uSunDir.value, this.lowfx);
    this.queuePlacement(items);
    this.applySettings(this.settings);
    this.resize();
    new ResizeObserver(() => this.resize()).observe(this.container);
    this.bindInput(r.domElement);
    const loop = () => { this.frame(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    return true;
  }

  setBorderPositions(pos: Float32Array): void {
    if (this.borderLines) {
      this.scene.remove(this.borderLines);
      this.borderLines.geometry.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.borderLines = new THREE.LineSegments(geo, this.borderMat);
    this.borderLines.visible = this.settings.borders;
    this.scene.add(this.borderLines);
    this.dirty = true;
  }

  setEarthTexture(cv: HTMLCanvasElement): void {
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.earthUniforms.uLandTex.value?.dispose();
    this.earthUniforms.uLandTex.value = tex;
    this.dirty = true;
  }

  private addAtmosphere(): void {
    this.atmosUniforms = {
      uTime: { value: 0 },
      uCameraDist: { value: 3.2 },
      uAudioBass: { value: 0.12 },
      uAudioMid: { value: 0.1 },
      uAudioHigh: { value: 0.08 },
      uColorA: { value: new THREE.Color('#38bdf8') },
      uColorB: { value: new THREE.Color('#1d4ed8') },
      uColorC: { value: new THREE.Color('#7dd3fc') },
    };
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      vertexShader: ATMOS_VERT,
      fragmentShader: ATMOS_FRAG,
      uniforms: this.atmosUniforms,
    });
    this.atmosMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 4.8), m);
    this.scene.add(this.atmosMesh);
  }

  private addStars(): void {
    const n = this.lowfx ? 400 : 1400;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 14 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.scene.add(new THREE.Points(g, new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 1.5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.55,
    })));
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

  private getShadowTexture(): THREE.CanvasTexture {
    if (this.shadowTex) return this.shadowTex;
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const ctx = cv.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    grad.addColorStop(0, 'rgba(2, 6, 23, 0.65)');
    grad.addColorStop(0.55, 'rgba(2, 6, 23, 0.28)');
    grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    this.shadowTex = new THREE.CanvasTexture(cv);
    return this.shadowTex;
  }

  /** Builds a soft ground contact shadow and subtle micro-collar under each 3D miniature on the globe. */
  private buildPlinth(item: CatalogueItem): THREE.Group | null {
    const meta = TYPE_META[item.type];
    if (item.route || !meta.plinth) return null;
    const g = new THREE.Group();
    const rimColor = meta.color;
    const r = meta.plinth;
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(r * 2.5, r * 2.5).rotateX(-Math.PI / 2).translate(0, 0.004, 0),
      new THREE.MeshBasicMaterial({ map: this.getShadowTexture(), transparent: true, depthWrite: false })
    );
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r * 0.92, r * 1.0, 28).rotateX(-Math.PI / 2).translate(0, 0.006, 0),
      new THREE.MeshBasicMaterial({ color: rimColor, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })
    );
    g.add(shadow, ring);
    return g;
  }

  private queuePlacement(items: CatalogueItem[]): void {
    // Nearest-to-camera first so the visible hemisphere fills in before the far side.
    const cam = new THREE.Vector3(...latLonToVec(this.lat, this.lon));
    const d = (it: CatalogueItem) => -cam.dot(new THREE.Vector3(...latLonToVec(it.lat, it.lon)));
    for (const it of [...items].sort((a, b) => d(a) - d(b))) this.pending.set(it.key, it);
  }

  private drainPlacement(budgetMs: number): void {
    const t0 = performance.now();
    for (const [key, it] of this.pending) {
      this.pending.delete(key);
      this.place(it);
      this.dirty = true;
      if (performance.now() - t0 > budgetMs) break;
    }
  }

  /** Builds an item's model immediately if it is still queued (used when the UI targets it directly). */
  private ensurePlaced(key: string | null): Placed | null {
    if (!key) return null;
    const it = this.pending.get(key);
    if (it) { this.pending.delete(key); this.place(it); }
    return this.placed.get(key) ?? null;
  }

  private place(item: CatalogueItem): void {
    const obj = buildModel(item.model);
    obj.userData.key = item.key;
    const wrap = new THREE.Group();
    const plinth = this.buildPlinth(item);
    if (plinth) wrap.add(plinth);
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
    this.settings = { ...DEFAULT_SETTINGS, ...s };
    this.sun.intensity = this.settings.shadows ? 2.4 : 0.9;
    this.ambient.intensity = this.settings.shadows ? 0.75 : 2.1;
    this.labelsEl.style.display = this.settings.names ? '' : 'none';
    if (this.borderLines) {
      this.borderLines.visible = this.settings.borders;
      const isMinimal = this.settings.surfaceMode === 'minimal';
      this.borderMat.color.set(isMinimal ? '#38bdf8' : '#5fa4e6');
      this.borderMat.opacity = isMinimal ? 0.52 : 0.32;
    }
    const preset = AURA_PRESETS[this.settings.auraPreset ?? 'waves'] ?? AURA_PRESETS.waves;
    this.targetColorA.set(preset.colors[0]);
    this.targetColorB.set(preset.colors[1]);
    this.targetColorC.set(preset.colors[2]);
    this.dirty = true;
  }

  /** Draws an AuraFM-style glowing orbital telemetry arc between two coordinates. */
  showFlightArc(from: [number, number], to: [number, number]): void {
    this.flightArcGroup.clear();
    const dist = this.angDist(from, to);
    if (dist < 0.03) return;
    const pts: THREE.Vector3[] = [];
    const n = 64;
    const peak = Math.min(0.28, (dist / Math.PI) * 0.28);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const [la, lo] = slerpLatLon(from, to, t);
      const r = 1.003 + Math.sin(Math.PI * t) * peak;
      pts.push(new THREE.Vector3(...latLonToVec(la, lo, r)));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.65, depthWrite: false }));
    this.flightArcGroup.add(line);
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
      if (!prev) {
        if (!this.gameMode && !this.ride) {
          const rect = el.getBoundingClientRect();
          const hit = this.pickAt(e.clientX - rect.left, e.clientY - rect.top);
          const nextKey = hit?.key ?? null;
          if (nextKey !== this.hoveredKey) {
            this.hoveredKey = nextKey;
            el.style.cursor = hit ? 'pointer' : 'grab';
            this.ev.onHover?.(hit, hit ? this.itemScreen(hit.key) : null);
            this.dirty = true;
          } else if (hit) {
            this.ev.onHover?.(hit, this.itemScreen(hit.key));
          }
        }
        return;
      }
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
      if (this.hoveredKey) {
        this.hoveredKey = null;
        this.ev.onHover?.(null, null);
      }
      if (this.ride) { this.ride.yaw -= dx * 0.008; this.dirty = true; return; }
      const k = this.degPerPx();
      this.lon -= dx * k / Math.max(0.2, Math.cos((this.lat * Math.PI) / 180));
      this.lat = Math.max(-85, Math.min(85, this.lat + dy * k));
      this.vLon = -dx * k; this.vLat = dy * k;
      this.dirty = true;
      this.ev.onFirst?.('drag');
    });
    el.addEventListener('pointerleave', () => {
      if (this.hoveredKey) {
        this.hoveredKey = null;
        el.style.cursor = '';
        this.ev.onHover?.(null, null);
      }
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
    const p = this.ensurePlaced(key);
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
    const prev = this.selected ? this.placed.get(this.selected) : null;
    const next = this.ensurePlaced(key);
    if (prev && next && prev.item.key !== next.item.key) {
      this.showFlightArc([prev.item.lat, prev.item.lon], [next.item.lat, next.item.lon]);
    } else if (!key) {
      this.flightArcGroup.clear();
    }
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
    const p = this.ensurePlaced(key);
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
    const base = TYPE_META[item.type].scale;
    return base * Math.max(0.06, Math.min(1.12, Math.pow(this.h / DEFAULT_H, 0.72)));
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
      this.camera.updateMatrixWorld();
      return;
    }
    this.camera.near = Math.max(0.0008, this.h * 0.05);
    this.camera.updateProjectionMatrix();

    const T = new THREE.Vector3(...latLonToVec(this.lat, this.lon));
    const N = T.clone();
    const north = this.northAt(this.lat, this.lon);
    // Smoothly pitch toward the horizon as the user zooms in from orbital view.
    const z = this.zoom;
    const tilt = z <= 4.15 ? 0 : Math.min(0.86, Math.pow(Math.min(1, (z - 4.15) / 8.5), 0.72) * 0.86);
    const dir = N.clone().multiplyScalar(Math.cos(tilt)).add(north.clone().multiplyScalar(-Math.sin(tilt)));
    this.camera.position.copy(T).add(dir.multiplyScalar(this.h));
    this.camera.up.copy(north.clone().multiplyScalar(Math.cos(tilt)).add(N.clone().multiplyScalar(Math.sin(tilt))));
    this.camera.lookAt(T);
    this.camera.updateMatrixWorld();
  }

  private updateItems(dt: number): void {
    const z = this.zoom;
    for (const p of this.placed.values()) {
      const it = p.item;
      const layerOn = this.settings[TYPE_META[it.type].layer];
      const focus = this.selected === it.key || this.ride?.key === it.key;
      const tierOk = z >= TIER_ZOOM[it.tier] || focus;
      const filterOk = !this.itemFilter || this.itemFilter(it) || focus;
      p.obj.visible = layerOn && tierOk && filterOk && !this.gameMode;
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
        const alt = routeAltitude(r.kind, s);
        this.orientAt(p.obj, la, lo, alt, p.heading);
      }
      const inner = p.obj.children[p.obj.children.length - 1];
      if (it.type === 'animal' && !this.lowfx) inner.position.y = Math.abs(Math.sin(this.clock * 0.003 + it.lat)) * 0.06;
      else if (this.layers?.festivals.has(it.key) && !this.lowfx) inner.position.y = (0.5 + 0.5 * Math.sin(this.clock * 0.0024 + it.lon)) * 0.09;
      const isHovered = this.hoveredKey === it.key;
      inner.scale.setScalar(isHovered ? 1.14 : 1.0);
      inner.traverse(o => {
        if (o.name === 'spin') o.rotation.z += dt * 0.002;
        if (o.name === 'flap') o.rotation.z = Math.sin(this.clock * 0.004) * 0.2;
      });
    }
    const sel = this.selected ? this.placed.get(this.selected) : null;
    this.selRing.visible = !!sel?.obj.visible;
    if (sel) {
      this.selRing.position.copy(sel.obj.position).multiplyScalar(1.0008);
      this.selRing.quaternion.copy(sel.obj.quaternion);
      const s = this.modelScale(sel.item) * (1.05 + Math.sin(this.clock * 0.005) * 0.09);
      this.selRing.scale.setScalar(s);
      this.selOuterMat.color.copy(this.targetColorA);
      this.selInnerMat.color.copy(this.targetColorC);
      this.earthUniforms.uStationPos.value.copy(sel.obj.position).normalize();
    } else if (this.hoveredKey) {
      const hov = this.placed.get(this.hoveredKey);
      if (hov?.obj.visible) this.earthUniforms.uStationPos.value.copy(hov.obj.position).normalize();
      else this.earthUniforms.uStationPos.value.set(0, 0, 0);
    } else {
      this.earthUniforms.uStationPos.value.set(0, 0, 0);
    }
  }

  private updateSun(): void {
    // Sub-solar point from current UTC time with equation of time (AuraFM solar ephemeris)
    const now = new Date();
    const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 0);
    const doy = (now.getTime() - startOfYear) / 864e5;
    const gamma = ((2 * Math.PI) / 365) * (doy - 1);
    const decl =
      0.006918 -
      0.399912 * Math.cos(gamma) +
      0.070257 * Math.sin(gamma) -
      0.006758 * Math.cos(2 * gamma) +
      0.000907 * Math.sin(2 * gamma);
    const eqTime =
      229.18 *
      (0.000075 +
        0.001868 * Math.cos(gamma) -
        0.032077 * Math.sin(gamma) -
        0.014615 * Math.cos(2 * gamma) -
        0.040849 * Math.sin(2 * gamma));
    const utcMins = now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60;
    const subSolarLon = (720 - utcMins - eqTime) / 4;
    const subSolarLat = (decl * 180) / Math.PI;
    const real = new THREE.Vector3(...latLonToVec(subSolarLat, subSolarLon));
    const cam = this.camera.position.clone().normalize();
    // Blend real solar direction with a subtle camera offset so the day/night terminator sweeps across the visible limb
    const sunDir = real.clone().multiplyScalar(0.55).add(cam.clone().multiplyScalar(0.45)).normalize();
    this.earthUniforms.uSunDir.value.copy(sunDir);

    // Viewer-relative 3-point studio lighting for 3D miniatures on the globe
    const camUp = this.camera.up.clone().normalize();
    const camRight = new THREE.Vector3().crossVectors(camUp, cam).normalize();
    const keyDir = cam.clone().multiplyScalar(0.55).add(camRight.clone().multiplyScalar(0.58)).add(camUp.clone().multiplyScalar(0.60)).normalize();
    const fillDir = cam.clone().multiplyScalar(0.45).add(camRight.clone().multiplyScalar(-0.72)).add(camUp.clone().multiplyScalar(-0.35)).normalize();
    this.sun.position.copy(keyDir.multiplyScalar(10));
    this.fillLight.position.copy(fillDir.multiplyScalar(10));
    this.ambient.position.copy(camUp.multiplyScalar(10));

    // Update AuraFM Earth & Atmosphere shader uniforms
    const tSec = this.clock * 0.001;
    const activeBoost = this.selected ? 0.16 : this.hoveredKey ? 0.08 : 0.0;
    const bass = 0.14 + activeBoost + 0.07 * (Math.sin(tSec * 2.1) * 0.5 + 0.5);
    const mid = 0.12 + activeBoost * 0.8 + 0.06 * (Math.sin(tSec * 3.3 + 1.2) * 0.5 + 0.5);
    const high = 0.10 + activeBoost * 0.5 + 0.05 * (Math.cos(tSec * 4.5 + 0.7) * 0.5 + 0.5);

    this.earthUniforms.uTime.value = tSec;
    this.earthUniforms.uAudioBass.value = bass;
    this.earthUniforms.uAudioMid.value = mid;

    const targetLandMix = this.settings.surfaceMode === 'minimal' ? 0.0 : 1.0;
    this.earthUniforms.uLandMix.value += (targetLandMix - this.earthUniforms.uLandMix.value) * 0.12;

    const targetNightMix = this.settings.shadows ? 1.0 : 0.0;
    this.earthUniforms.uNightMix.value += (targetNightMix - this.earthUniforms.uNightMix.value) * 0.12;
    this.earthUniforms.uAuraColor.value.lerp(this.targetColorA, 0.08);

    if (this.atmosMesh) {
      this.atmosMesh.quaternion.copy(this.camera.quaternion);
      this.atmosUniforms.uTime.value = tSec;
      this.atmosUniforms.uCameraDist.value = this.camera.position.length();
      this.atmosUniforms.uAudioBass.value = bass;
      this.atmosUniforms.uAudioMid.value = mid;
      this.atmosUniforms.uAudioHigh.value = high;
      this.atmosUniforms.uColorA.value.lerp(this.targetColorA, 0.06);
      this.atmosUniforms.uColorB.value.lerp(this.targetColorB, 0.06);
      this.atmosUniforms.uColorC.value.lerp(this.targetColorC, 0.06);
    }
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

  itemName(key: string): string { const it = this.placed.get(key)?.item ?? this.pending.get(key); return it ? tr(it.name, this.lang) : ''; }

  private frame(): void {
    const now = performance.now();
    const dt = Math.min(100, now - this.last);
    this.last = now;
    this.clock += dt;
    const animate = !this.lowfx || now - this.lastLabel > 1000;
    this.updateCamera(dt);
    if (this.pending.size) this.drainPlacement(this.lowfx ? 6 : 10);
    if (!animate && !this.dirty) return;
    this.updateItems(dt);
    this.updateSun();
    if (this.layers) {
      this.layers.setVisible(this.settings, this.gameMode);
      this.layers.update(this.clock, dt, this.camera.position.length() - 1, this.routeState, this.orbitAlt, this.placedObj);
    }
    this.renderer.render(this.scene, this.camera);
    if (this.dirty || now - this.lastLabel > (this.lowfx ? 1000 : 120)) { this.updateLabels(); this.lastLabel = now; }
    if (this.dirty) this.ev.onView?.(this.zoom, this.lat, this.lon);
    this.dirty = false;
  }

  markDirty(): void { this.dirty = true; }

  // Bound once so the per-frame layer update does not allocate closures.
  private routeState = (it: CatalogueItem): 0 | 1 | 2 => {
    if (this.gameMode || !this.settings[TYPE_META[it.type].layer]) return 0;
    if (this.selected === it.key || this.ride?.key === it.key) return 2;
    return !this.itemFilter || this.itemFilter(it) ? 1 : 0;
  };
  private orbitAlt = (it: CatalogueItem): number => routeAltitude('orbit', this.modelScale(it));
  private placedObj = (key: string): THREE.Object3D | undefined => this.placed.get(key)?.obj;
}
