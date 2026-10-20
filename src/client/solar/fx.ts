/**
 * Living-sky effects for the Solar System view, all GPU-driven and cheap (a handful of draw calls):
 * - the asteroid belt (with Kirkwood gaps), Jupiter's Trojans and the Kuiper belt, each rock on its own Kepler orbit;
 * - the Sun's corona streamers, prominence loops and the odd flare + coronal mass ejection;
 * - weather: zonal jets and storm vortices flowing on the giant planets, Venus's super-rotating clouds, Earth's
 *   cloud cover with cyclones, Martian dust storms, and aurorae on Earth, Jupiter and Saturn;
 * - Comet Encke (3.3-year orbit) whose ion and dust tails grow as it nears the Sun.
 */
import * as THREE from 'three';
import type { BodyId } from '../../shared/data/solar.ts';
import { displayOrbit } from '../../shared/lib/orbits.ts';
import type { Quality } from '../globe/quality.ts';

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;

/** Seeded PRNG (mulberry32). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOISE = /* glsl */ `
float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }
vec3 rotAbout(vec3 p, vec3 k, float a) { return p * cos(a) + cross(k, p) * sin(a) + k * dot(k, p) * (1.0 - cos(a)); }
`;

const additive = (o: Partial<THREE.ShaderMaterialParameters>) =>
  new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, ...o });

// ---------------------------------------------------------------------------------------------------------------
// Small bodies
// ---------------------------------------------------------------------------------------------------------------
const BELT_VS = /* glsl */ `
attribute vec4 aOrb;   // a (AU), phase (rad), inclination (rad), node (rad)
attribute vec2 aKind;  // kind (0 belt, 1 trojan, 2 kuiper), size
attribute vec3 aColor;
uniform float uDays; uniform float uJup; uniform float uScale; uniform float uPr;
varying vec3 vC;
void main() {
  float a = aOrb.x;
  float th = aKind.x == 1.0 ? uJup + aOrb.y : aOrb.y + uDays * 6.2831853 / (365.25 * a * sqrt(a));
  float r = 12.0 * sqrt(a);
  vec3 p = vec3(r * cos(th), r * sin(aOrb.z) * sin(th - aOrb.w), -r * sin(th));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float px = aKind.y * uScale / max(1e-4, -mv.z);
  gl_PointSize = clamp(px, 1.0 * uPr, 3.2 * uPr);
  vC = aColor * clamp(px / uPr + 0.35, 0.35, 1.0);
}`;
const BELT_FS = /* glsl */ `
varying vec3 vC;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float a = 1.0 - smoothstep(0.2, 0.5, length(d));
  gl_FragColor = vec4(vC * a, 1.0);
  #include <colorspace_fragment>
}`;

/** Main belt (2.1–3.3 AU, emptied at the Kirkwood gaps), Hildas, Jupiter's Trojans (±60°) and the Kuiper belt. */
class SmallBodies {
  readonly points: THREE.Points;
  private u = { uDays: { value: 0 }, uJup: { value: 0 }, uScale: { value: 1 }, uPr: { value: 1 } };

  constructor(scene: THREE.Scene, q: Quality) {
    const k = q.tier === 'high' ? 1 : q.tier === 'medium' ? 0.55 : 0.32;
    const nBelt = Math.round(7000 * k), nHilda = Math.round(500 * k), nTro = Math.round(1400 * k), nKui = Math.round(4200 * k);
    const n = nBelt + nHilda + nTro + nKui;
    const orb = new Float32Array(n * 4), kind = new Float32Array(n * 2), col = new Float32Array(n * 3);
    const r = rng(2024);
    const gauss = () => { let s = 0; for (let i = 0; i < 4; i++) s += r(); return (s - 2) / 0.577; };
    const gaps = [2.502, 2.825, 2.958, 3.279];
    let i = 0;
    const put = (a: number, ph: number, inc: number, kd: number, size: number, c: [number, number, number]) => {
      orb.set([a, ph, inc, r() * TAU], i * 4);
      kind.set([kd, size], i * 2);
      col.set(c, i * 3);
      i++;
    };
    while (i < nBelt) {
      const a = 2.1 + Math.pow(r(), 0.85) * 1.2;
      if (gaps.some(g => Math.abs(a - g) < 0.022 * (0.4 + r()))) continue;
      // inner belt is stony (S-type, tan), outer carbonaceous (C-type, grey)
      const t = (a - 2.1) / 1.2, b = 0.32 + r() * 0.3;
      put(a, r() * TAU, Math.abs(gauss()) * 0.12, 0, 0.05 + r() * 0.05, [b * (1.05 - 0.25 * t), b * (0.9 - 0.1 * t), b * (0.72 + 0.1 * t)]);
    }
    for (let j = 0; j < nHilda; j++) put(3.97 + gauss() * 0.04, r() * TAU, Math.abs(gauss()) * 0.1, 0, 0.05, [0.3, 0.27, 0.24]);
    for (let j = 0; j < nTro; j++) {
      const lead = j % 2 ? 1 : -1;
      put(5.2 + gauss() * 0.06, lead * 60 * D2R + gauss() * 0.22, Math.abs(gauss()) * 0.2, 1, 0.06, [0.36, 0.3, 0.26]);
    }
    for (let j = 0; j < nKui; j++) {
      const a = 39.4 + (r() < 0.25 ? gauss() * 0.4 : 3 + r() * 5.5); // plutinos at 39.4 AU, the classical belt 42–48 AU
      const b = 0.2 + r() * 0.22;
      put(a, r() * TAU, Math.abs(gauss()) * 0.17, 2, 0.16, [b * 0.8, b * 0.88, b * 1.05]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aOrb', new THREE.BufferAttribute(orb, 4));
    g.setAttribute('aKind', new THREE.BufferAttribute(kind, 2));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    this.points = new THREE.Points(g, additive({ uniforms: this.u, vertexShader: BELT_VS, fragmentShader: BELT_FS }));
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  update(days: number, jupAngle: number, scale: number, pr: number): void {
    this.u.uDays.value = days;
    this.u.uJup.value = jupAngle;
    this.u.uScale.value = scale;
    this.u.uPr.value = pr;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// The Sun
// ---------------------------------------------------------------------------------------------------------------
const CORONA_VS = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const CORONA_FS = /* glsl */ `
uniform float uT; uniform float uBoost; uniform float uSpan;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * 2.0 * uSpan;          // in solar radii
  float r = length(p), a = atan(p.y, p.x);
  if (r < 0.98) discard;
  float s = 0.5 + 0.5 * sin(a * 5.0 + uT * 0.05) * sin(a * 11.0 - uT * 0.031 + 1.3);
  s = 0.35 + 0.65 * s * (0.6 + 0.4 * sin(a * 23.0 + uT * 0.08 + 2.0 * sin(a * 3.0)));
  float rays = s * pow(1.0 / r, 1.7) * smoothstep(uSpan, uSpan * 0.4, r);
  float inner = pow(1.0 / r, 6.0);
  float k = (0.55 * inner + 0.5 * rays) * smoothstep(0.98, 1.06, r) * (1.0 + uBoost);
  gl_FragColor = vec4(vec3(1.0, 0.86, 0.62) * k * 0.9, 1.0);
  #include <colorspace_fragment>
}`;

const PROM_VS = /* glsl */ `
attribute vec3 aBase; attribute vec3 aLoop; // s along loop, period, offset
uniform float uT;
varying float vS; varying float vI; varying vec3 vN; varying vec3 vV; varying float vId;
void main() {
  float life = fract(uT / aLoop.y + aLoop.z);
  float g = 0.45 + 0.55 * smoothstep(0.0, 0.6, life);
  vec3 p = aBase + (position - aBase) * g;
  vec4 w = modelMatrix * vec4(p, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - w.xyz);
  vS = aLoop.x; vId = aLoop.z * 31.0;
  vI = pow(sin(3.14159 * life), 1.4);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const PROM_FS = /* glsl */ `
uniform float uT;
varying float vS; varying float vI; varying vec3 vN; varying vec3 vV; varying float vId;
void main() {
  float flow = 0.5 + 0.5 * sin(vS * 34.0 - uT * 2.4 + vId);
  float rim = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
  vec3 c = mix(vec3(0.9, 0.16, 0.04), vec3(1.0, 0.55, 0.22), flow * 0.6);
  gl_FragColor = vec4(c * (0.6 + 0.6 * flow), vI * rim * 0.85);
  #include <colorspace_fragment>
}`;

const CME_VS = /* glsl */ `
attribute vec3 aDir; attribute vec2 aSeed;
uniform float uT; uniform float uR; uniform float uPr; uniform float uScale;
varying vec3 vC;
void main() {
  float f = uT / 7.0;
  float d = uR * (1.02 + aSeed.x * f * 5.5 + aSeed.y * 0.15);
  vec4 mv = modelViewMatrix * vec4(aDir * d, 1.0);
  gl_Position = projectionMatrix * mv;
  float px = uR * 0.035 * uScale / max(1e-4, -mv.z);
  gl_PointSize = clamp(px, 1.2 * uPr, 4.0 * uPr);
  float fade = (1.0 - f) * (1.0 - f) * smoothstep(0.0, 0.04, f);
  vC = mix(vec3(1.0, 0.8, 0.55), vec3(1.0, 0.32, 0.1), clamp(f * 1.6, 0.0, 1.0)) * fade * (0.15 + 0.3 * aSeed.y);
}`;

/** Corona, prominences and flares, parented to the Sun's node (prominences turn with its surface). */
class SunFX {
  private corona: THREE.Mesh;
  private cu = { uT: { value: 0 }, uBoost: { value: 0 }, uSpan: { value: 4.6 } };
  private pu = { uT: { value: 0 } };
  private eu = { uT: { value: 99 }, uR: { value: 1 }, uPr: { value: 1 }, uScale: { value: 1 } };
  private cme: THREE.Points;
  private flash: THREE.Sprite;
  private next = 6;
  private sinceFlare = 99;
  private r = rng(7);

  constructor(node: THREE.Object3D, spin: THREE.Object3D, private R: number, q: Quality) {
    this.corona = new THREE.Mesh(new THREE.PlaneGeometry(2 * R * 4.6, 2 * R * 4.6),
      additive({ uniforms: this.cu, vertexShader: CORONA_VS, fragmentShader: CORONA_FS }));
    node.add(this.corona);
    spin.add(this.prominences(q.tier === 'high' ? 9 : q.tier === 'medium' ? 6 : 4));
    // Coronal mass ejection: a cone of plasma blobs that flies out and fades.
    const n = q.tier === 'high' ? 900 : q.tier === 'medium' ? 500 : 280;
    const dir = new Float32Array(n * 3), seed = new Float32Array(n * 2), v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const th = this.r() * TAU, sp = Math.pow(this.r(), 0.7) * 0.55;
      v.set(Math.sin(sp) * Math.cos(th), Math.cos(sp), Math.sin(sp) * Math.sin(th));
      dir.set([v.x, v.y, v.z], i * 3);
      seed.set([0.5 + this.r() * 0.7 * (1 - sp), this.r()], i * 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 2));
    this.eu.uR.value = R;
    this.cme = new THREE.Points(g, additive({ uniforms: this.eu, vertexShader: CME_VS, fragmentShader: BELT_FS }));
    this.cme.frustumCulled = false;
    this.cme.visible = false;
    node.add(this.cme);
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const ctx = cv.getContext('2d')!, gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,240,200,0.7)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
    this.flash.visible = false;
    node.add(this.flash);
  }

  /** Magnetic loops of glowing plasma standing on the surface, each growing and fading on its own cycle. */
  private prominences(n: number): THREE.Mesh {
    const R = this.R, SEG = 40, RING = 6;
    const pos: number[] = [], nor: number[] = [], base: number[] = [], loop: number[] = [], idx: number[] = [];
    const c = new THREE.Vector3(), t = new THREE.Vector3(), ax = new THREE.Vector3(), d = new THREE.Vector3(), T = new THREE.Vector3();
    const N1 = new THREE.Vector3(), N2 = new THREE.Vector3(), P = new THREE.Vector3(), Pn = new THREE.Vector3(), o = new THREE.Vector3();
    for (let k = 0; k < n; k++) {
      const lat = (this.r() * 2 - 1) * 35 * D2R, lon = this.r() * TAU;
      c.set(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon));
      t.set(this.r() - 0.5, this.r() - 0.5, this.r() - 0.5).cross(c).normalize();
      ax.crossVectors(c, t).normalize();
      const sep = (6 + this.r() * 10) * D2R, H = R * (0.14 + this.r() * 0.32), w0 = R * (0.006 + this.r() * 0.006);
      const period = 16 + this.r() * 22, off = this.r();
      const v0 = pos.length / 3;
      const at = (s: number, out: THREE.Vector3, dir: THREE.Vector3) => {
        dir.copy(c).applyAxisAngle(ax, (s - 0.5) * sep);
        return out.copy(dir).multiplyScalar(R * 0.995 + H * Math.sin(Math.PI * s));
      };
      for (let i = 0; i <= SEG; i++) {
        const s = i / SEG;
        at(s, P, d);
        at(Math.min(1, s + 0.01), Pn, o);
        if (i === SEG) { at(s - 0.01, Pn, o); T.subVectors(P, Pn).normalize(); } else T.subVectors(Pn, P).normalize();
        N1.copy(d).addScaledVector(T, -d.dot(T)).normalize();
        N2.crossVectors(T, N1);
        const w = w0 * (0.7 + 0.6 * Math.sin(Math.PI * s));
        for (let j = 0; j < RING; j++) {
          const a = (j / RING) * TAU;
          o.copy(N1).multiplyScalar(Math.cos(a)).addScaledVector(N2, Math.sin(a));
          pos.push(P.x + o.x * w, P.y + o.y * w, P.z + o.z * w);
          nor.push(o.x, o.y, o.z);
          base.push(d.x * R, d.y * R, d.z * R);
          loop.push(s, period, off);
        }
      }
      for (let i = 0; i < SEG; i++) for (let j = 0; j < RING; j++) {
        const a = v0 + i * RING + j, b = v0 + i * RING + ((j + 1) % RING), c2 = a + RING, d2 = b + RING;
        idx.push(a, c2, b, b, c2, d2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aBase', new THREE.Float32BufferAttribute(base, 3));
    g.setAttribute('aLoop', new THREE.Float32BufferAttribute(loop, 3));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, additive({ uniforms: this.pu, vertexShader: PROM_VS, fragmentShader: PROM_FS, side: THREE.DoubleSide, blending: THREE.NormalBlending }));
    m.frustumCulled = false;
    return m;
  }

  update(t: number, dt: number, camera: THREE.Camera, node: THREE.Object3D, scale: number, pr: number): void {
    this.corona.quaternion.copy(camera.quaternion);
    if (node.parent) this.corona.quaternion.premultiply(node.parent.getWorldQuaternion(new THREE.Quaternion()).invert());
    this.cu.uT.value = t;
    this.pu.uT.value = t;
    this.eu.uPr.value = pr;
    this.eu.uScale.value = scale;
    this.next -= dt;
    this.sinceFlare += dt;
    if (this.next <= 0) this.erupt(camera, node);
    const f = this.sinceFlare;
    this.eu.uT.value = f;
    this.cme.visible = f < 7;
    this.flash.visible = f < 3;
    if (this.flash.visible) {
      const k = f < 0.25 ? f / 0.25 : Math.exp(-(f - 0.25) * 1.6);
      (this.flash.material as THREE.SpriteMaterial).opacity = k;
      this.flash.scale.setScalar(this.R * (0.6 + 1.4 * k));
    }
    this.cu.uBoost.value = f < 4 ? 0.6 * Math.exp(-f) : 0;
  }

  /** A flare at a random spot, biased towards the limb so its ejection is seen against space. */
  private erupt(camera: THREE.Camera, node: THREE.Object3D): void {
    this.next = 14 + this.r() * 16;
    this.sinceFlare = 0;
    const view = node.getWorldPosition(new THREE.Vector3()).sub(camera.position).normalize();
    const n = new THREE.Vector3(this.r() - 0.5, (this.r() - 0.5) * 0.6, this.r() - 0.5).normalize();
    n.addScaledVector(view, -n.dot(view) * 0.85).normalize();
    this.cme.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    this.flash.position.copy(n).multiplyScalar(this.R * 1.01);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Weather
// ---------------------------------------------------------------------------------------------------------------
/** Zonal jets (uv-x displacement per flow cycle, as GLSL of `lat` in radians) and storm vortices [lat, lon, radius (uv), spin]. */
const FLOW: Partial<Record<BodyId, { jets: string; storms: [number, number, number, number][] }>> = {
  jupiter: { jets: '0.0045 * cos(lat * 13.0) * (1.0 - smoothstep(1.05, 1.35, abs(lat))) + 0.004 * exp(-lat * lat / 0.02)',
    storms: [[-22, -60, 0.05, 0.5], [-33, 40, 0.018, 0.6], [24, 150, 0.02, -0.5]] },
  saturn: { jets: '0.007 * exp(-lat * lat / 0.25) + 0.0016 * cos(lat * 10.0)', storms: [[89, 0, 0.06, 0.4], [-89, 0, 0.05, -0.4]] },
  uranus: { jets: '-0.002 * cos(lat) * cos(lat) + 0.002 * exp(-pow(abs(lat) - 1.0, 2.0) / 0.06)', storms: [[28, 120, 0.02, 0.4]] },
  neptune: { jets: '-0.005 * cos(lat) * cos(lat) + 0.003 * exp(-pow(abs(lat) - 1.15, 2.0) / 0.04)',
    storms: [[-20, -30, 0.04, 0.5], [-55, 60, 0.015, 0.6]] },
};
export const FLOW_BODIES = new Set<BodyId>([...Object.keys(FLOW) as BodyId[], 'venus']);

/**
 * Makes the clouds on a giant planet flow: the map is sampled twice along a flow field (jets + vortices) with
 * staggered phases and cross-faded (the classic flow-map trick), so the bands shear and storms turn forever without
 * smearing. Venus just slides its whole cloud deck around (it laps the planet every four days).
 */
export function patchFlow(id: BodyId, mat: THREE.MeshStandardMaterial, uFlow: { value: number }): void {
  const f = FLOW[id];
  if (!f && id !== 'venus') return;
  mat.customProgramCacheKey = () => 'flow-' + id;
  mat.onBeforeCompile = sh => {
    sh.uniforms.uFlow = uFlow;
    sh.fragmentShader = 'uniform float uFlow;\n' + sh.fragmentShader.replace('#include <map_fragment>', id === 'venus' ? /* glsl */ `
#ifdef USE_MAP
  diffuseColor *= texture2D(map, vMapUv - vec2(uFlow * 0.012, 0.0));
#endif` : /* glsl */ `
#ifdef USE_MAP
  vec2 uv0 = vMapUv;
  float lat = (uv0.y - 0.5) * 3.14159;
  float cl = max(cos(lat), 0.08);
  vec2 fl = vec2(${f!.jets}, 0.0);
  ${f!.storms.map(([la, lo, rad, spin]) => /* glsl */ `{
    vec2 d = vec2((fract(uv0.x - ${((lo + 180) / 360).toFixed(4)} + 0.5) - 0.5) * 2.0 * cl, uv0.y - ${((la + 90) / 180).toFixed(4)});
    float e = exp(-dot(d, d) / ${(rad * rad).toFixed(6)});
    fl += vec2(-d.y / (2.0 * cl), d.x) * e * ${spin.toFixed(3)};
  }`).join('\n')}
  float p0 = fract(uFlow), p1 = fract(uFlow + 0.5);
  vec4 c0 = texture2D(map, uv0 - fl * p0), c1 = texture2D(map, uv0 - fl * p1);
  diffuseColor *= mix(c0, c1, abs(1.0 - 2.0 * p0));
#endif`);
  };
}

const SHELL_VS = /* glsl */ `
varying vec3 vP; varying vec3 vN; varying vec3 vW;
void main() {
  vP = normalize(position);
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const CLOUDS_FS = /* glsl */ `
uniform float uT; uniform vec3 uSun;
varying vec3 vP; varying vec3 vN; varying vec3 vW;
${NOISE}
void main() {
  vec3 p = rotAbout(vP, vec3(0.0, 1.0, 0.0), uT * 0.004);
  float lat = asin(clamp(vP.y, -1.0, 1.0));
  // Cyclones: spiral the noise around a few drifting storm centres (anticlockwise in the north, clockwise south).
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float clat = (fi < 2.0 ? 1.0 : -1.0) * (0.3 + 0.35 * fract(fi * 0.37 + 0.2));
    float clon = fi * 1.9 - uT * 0.012 * (1.0 + 0.3 * fi);
    vec3 c = vec3(cos(clat) * cos(clon), sin(clat), cos(clat) * sin(clon));
    float e = exp(-pow(distance(p, c), 2.0) / 0.018);
    p = rotAbout(p, c, sign(clat) * e * 4.5);
  }
  float n = fbm(p * 3.2 + vec3(0.0, uT * 0.006, 0.0));
  // Wet tropics and storm tracks, dry subtropics
  float band = 0.12 * exp(-lat * lat / 0.02) - 0.1 * exp(-pow(abs(lat) - 0.45, 2.0) / 0.02) + 0.08 * exp(-pow(abs(lat) - 0.95, 2.0) / 0.05);
  float cover = smoothstep(0.52, 0.78, n + band);
  float lit = smoothstep(-0.12, 0.35, dot(normalize(vN), uSun));
  gl_FragColor = vec4(vec3(0.97, 0.98, 1.0) * (0.18 + 0.82 * lit), cover * (0.25 + 0.6 * lit));
  #include <colorspace_fragment>
}`;
const DUST_FS = /* glsl */ `
uniform float uT; uniform vec3 uSun;
varying vec3 vP; varying vec3 vN; varying vec3 vW;
${NOISE}
void main() {
  float k = floor(uT / 75.0), life = fract(uT / 75.0);
  float grow = smoothstep(0.0, 0.45, life) * (1.0 - smoothstep(0.78, 1.0, life));
  float clat = -0.2 - 0.6 * h3(vec3(k, 1.0, 2.0)), clon = 6.2831 * h3(vec3(k, 7.0, 3.0));
  vec3 c = vec3(cos(clat) * cos(clon), sin(clat), cos(clat) * sin(clon));
  float reach = 0.2 + 1.1 * grow;
  float mask = 1.0 - smoothstep(reach * 0.55, reach, distance(vP, c));
  float n = fbm(vP * 4.5 + vec3(uT * 0.02, 0.0, uT * 0.013));
  float dust = smoothstep(0.38, 0.7, n) * mask * grow;
  float lit = smoothstep(-0.1, 0.4, dot(normalize(vN), uSun));
  gl_FragColor = vec4(vec3(0.82, 0.58, 0.38) * (0.15 + 0.85 * lit), dust * 0.85);
  #include <colorspace_fragment>
}`;
const AURORA_VS = /* glsl */ `
attribute float aH;
varying vec2 vUv; varying float vH;
void main() { vUv = uv; vH = aH; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const AURORA_FS = /* glsl */ `
uniform float uT; uniform vec3 uLow; uniform vec3 uHigh; uniform float uK;
varying vec2 vUv; varying float vH;
void main() {
  float x = vUv.x * 6.2831853;
  float ripple = pow(0.5 + 0.5 * sin(x * 14.0 + uT * 1.3 + 2.0 * sin(x * 3.0 - uT * 0.4)) * sin(x * 5.0 - uT * 0.7), 2.0);
  float rays = 0.45 + 0.55 * pow(0.5 + 0.5 * sin(x * 160.0 + 3.0 * sin(x * 21.0 + uT * 0.9)), 3.0);
  float curtain = pow(1.0 - vH, 2.2) * smoothstep(0.0, 0.08, vH);
  vec3 c = mix(uLow, uHigh, vH);
  gl_FragColor = vec4(c * curtain * ripple * rays * uK * 0.6, 1.0);
  #include <colorspace_fragment>
}`;

/** Two open curtains of light around the magnetic poles (at ±lat), parented to the pole-aligned tilt group. */
function aurora(R: number, lat: number, hFrac: number, low: string, high: string, k: number, u: { uT: { value: number } }): THREE.Mesh {
  const N = 128, pos: number[] = [], uv: number[] = [], hh: number[] = [], idx: number[] = [];
  for (const sgn of [1, -1]) {
    const v0 = pos.length / 3;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * TAU, la = (lat + 2.5 * Math.sin(a * 3 + sgn)) * D2R;
      const x = Math.cos(la) * Math.cos(a), y = sgn * Math.sin(la), z = Math.cos(la) * Math.sin(a);
      for (const h of [0, 1]) {
        const s = R * (1.01 + h * hFrac);
        pos.push(x * s, y * s, z * s);
        uv.push(i / N, h);
        hh.push(h);
      }
    }
    for (let i = 0; i < N; i++) { const a = v0 + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aH', new THREE.Float32BufferAttribute(hh, 1));
  g.setIndex(idx);
  return new THREE.Mesh(g, additive({
    uniforms: { uT: u.uT, uLow: { value: new THREE.Color(low) }, uHigh: { value: new THREE.Color(high) }, uK: { value: k } },
    vertexShader: AURORA_VS, fragmentShader: AURORA_FS, side: THREE.DoubleSide,
  }));
}

// ---------------------------------------------------------------------------------------------------------------
// Comet Encke
// ---------------------------------------------------------------------------------------------------------------
/** 2P/Encke (JPL): a, e, i, Ω, ω, perihelion (ms). The shortest-period bright comet: back every 3.3 years. */
const ENCKE = { a: 2.2178, e: 0.8471, i: 11.35, node: 334.19, peri: 187.27, tp: Date.UTC(2023, 9, 22, 12) };
export const COMET_NAME = { en: 'Comet Encke', zh: '恩克彗星' };

/** Heliocentric ecliptic position (AU) of Encke at time `ms`. */
export function enckeAU(ms: number): [number, number, number] {
  const { a, e } = ENCKE, P = 365.25 * Math.pow(a, 1.5);
  let M = (((ms - ENCKE.tp) / 864e5) / P) * TAU;
  M = Math.atan2(Math.sin(M), Math.cos(M));
  let E = e > 0.8 ? Math.PI * Math.sign(M) : M;
  for (let k = 0; k < 30; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const x = a * (Math.cos(E) - e), y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const w = ENCKE.peri * D2R, O = ENCKE.node * D2R, i = ENCKE.i * D2R;
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), ci = Math.cos(i), si = Math.sin(i);
  return [x * (cw * cO - sw * sO * ci) - y * (sw * cO + cw * sO * ci), x * (cw * sO + sw * cO * ci) + y * (cw * cO * ci - sw * sO), x * sw * si + y * cw * si];
}

const TAIL_VS = /* glsl */ `
attribute vec3 aT; // kind (0 ion, 1 dust), phase, spread
uniform float uT; uniform vec3 uAnti; uniform vec3 uBack; uniform float uLen; uniform float uK; uniform float uScale; uniform float uPr;
varying vec3 vC;
void main() {
  float f = fract(uT * (aT.x < 0.5 ? 0.22 : 0.09) + aT.y);
  vec3 side = normalize(cross(uAnti, uBack + vec3(0.0, 0.001, 0.0)));
  vec3 up = normalize(cross(side, uAnti));
  float sp = aT.z - 0.5, sq = fract(aT.y * 7.31) - 0.5;
  vec3 p;
  if (aT.x < 0.5) p = uAnti * uLen * f + (side * sp + up * sq) * uLen * 0.07 * (0.3 + f);
  else {
    vec3 dir = normalize(uAnti + uBack * f * 0.9);
    p = dir * uLen * 0.7 * f + (side * sp + up * sq) * uLen * 0.12 * f;
  }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(uLen * 0.03 * uScale / max(1e-4, -mv.z), 1.2 * uPr, 6.0 * uPr);
  vec3 c = aT.x < 0.5 ? vec3(0.45, 0.72, 1.0) : vec3(1.0, 0.92, 0.75);
  vC = c * uK * (1.0 - f) * (1.0 - f) * (aT.x < 0.5 ? 0.22 : 0.14);
}`;

class Comet {
  readonly group = new THREE.Group();
  private u = { uT: { value: 0 }, uAnti: { value: new THREE.Vector3(1, 0, 0) }, uBack: { value: new THREE.Vector3(0, 0, 1) }, uLen: { value: 1 }, uK: { value: 0 },
    uScale: { value: 1 }, uPr: { value: 1 } };
  private coma: THREE.Sprite;
  private orbit: THREE.Line;
  readonly pos = new THREE.Vector3();

  constructor(scene: THREE.Scene, q: Quality, now: number) {
    const n = q.tier === 'high' ? 1400 : q.tier === 'medium' ? 800 : 450;
    const at = new Float32Array(n * 3), r = rng(31);
    for (let i = 0; i < n; i++) at.set([i % 3 === 0 ? 1 : 0, r(), r()], i * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aT', new THREE.BufferAttribute(at, 3));
    const tails = new THREE.Points(g, additive({ uniforms: this.u, vertexShader: TAIL_VS, fragmentShader: BELT_FS }));
    tails.frustumCulled = false;
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const ctx = cv.getContext('2d')!, gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(235,250,255,1)'); gr.addColorStop(0.2, 'rgba(160,220,255,0.55)'); gr.addColorStop(1, 'rgba(120,200,255,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.coma = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    this.group.add(tails, this.coma);
    scene.add(this.group);
    // Its (display-compressed) orbit, a faint ellipse
    const P = 365.25 * Math.pow(ENCKE.a, 1.5) * 864e5, pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 256; i++) {
      const p = enckeAU(now + (i / 256) * P), rr = Math.hypot(...p);
      pts.push(new THREE.Vector3(p[0], p[2], -p[1]).multiplyScalar(displayOrbit(rr) / rr));
    }
    this.orbit = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.14, depthWrite: false }));
    scene.add(this.orbit);
  }

  update(ms: number, t: number, scale: number, pr: number): void {
    const p = enckeAU(ms), r = Math.hypot(...p);
    this.pos.set(p[0], p[2], -p[1]).multiplyScalar(displayOrbit(r) / r);
    this.group.position.copy(this.pos);
    const p2 = enckeAU(ms + 864e5), back = new THREE.Vector3(p2[0], p2[2], -p2[1]).multiplyScalar(displayOrbit(Math.hypot(...p2)) / Math.hypot(...p2)).sub(this.pos).normalize().negate();
    const k = Math.max(0, Math.min(1, (3.2 - r) / 2.6));
    this.u.uAnti.value.copy(this.pos).normalize();
    this.u.uBack.value.copy(back);
    this.u.uLen.value = 1 + 6 * k * k;
    this.u.uK.value = 0.15 + 0.85 * k;
    this.u.uT.value = t;
    this.u.uScale.value = scale;
    this.u.uPr.value = pr;
    this.coma.scale.setScalar(0.35 + 1.1 * k);
    (this.coma.material as THREE.SpriteMaterial).opacity = 0.55 + 0.45 * k;
  }
}

// ---------------------------------------------------------------------------------------------------------------
export interface FxBody { id: BodyId; R: number; tilt: THREE.Object3D; spin: THREE.Object3D; node: THREE.Object3D; mat: THREE.Material; geo: THREE.BufferGeometry }

/** All of the above, driven once per frame by the Solar System view. */
export class SolarFX {
  private belts: SmallBodies;
  private sun: SunFX | null = null;
  private sunNode: THREE.Object3D | null = null;
  readonly comet: Comet;
  private uFlow = new Map<BodyId, { value: number }>();
  private wu = { uT: { value: 0 } };
  private shells: { u: { uT: { value: number }; uSun: { value: THREE.Vector3 } }; node: THREE.Object3D }[] = [];
  private t = 0;

  constructor(scene: THREE.Scene, bodies: FxBody[], q: Quality, now: number) {
    this.belts = new SmallBodies(scene, q);
    this.comet = new Comet(scene, q, now);
    for (const b of bodies) {
      if (b.id === 'sun') { this.sun = new SunFX(b.node, b.spin, b.R, q); this.sunNode = b.node; continue; }
      if (FLOW_BODIES.has(b.id)) {
        const u = { value: 0 };
        this.uFlow.set(b.id, u);
        patchFlow(b.id, b.mat as THREE.MeshStandardMaterial, u);
      }
      if (b.id === 'earth') this.shell(b, 1.012, CLOUDS_FS);
      if (b.id === 'mars') this.shell(b, 1.006, DUST_FS);
      const au = b.id === 'earth' ? ['#4ade80', '#c084fc', 67, 0.07, 0.9] : b.id === 'jupiter' ? ['#a78bfa', '#60a5fa', 74, 0.05, 1.1]
        : b.id === 'saturn' ? ['#f472b6', '#a78bfa', 75, 0.05, 0.9] : null;
      if (au) b.tilt.add(aurora(b.R, au[2] as number, au[3] as number, au[0] as string, au[1] as string, au[4] as number, this.wu));
    }
  }

  private shell(b: FxBody, k: number, fs: string): void {
    const u = { uT: this.wu.uT, uSun: { value: new THREE.Vector3(1, 0, 0) } };
    const m = new THREE.Mesh(b.geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: SHELL_VS, fragmentShader: fs, transparent: true, depthWrite: false }));
    m.scale.setScalar(b.R * k);
    b.spin.add(m);
    this.shells.push({ u, node: b.node });
  }

  /**
   * `dt` real seconds (0 while paused), `days` since J2000, `jup` Jupiter's heliocentric angle in the XZ plane,
   * `scale` = pixels per unit at distance 1 (for point sizes).
   */
  update(f: { dt: number; ms: number; days: number; jup: number; camera: THREE.Camera; scale: number; pr: number }): void {
    this.t += f.dt;
    this.belts.update(f.days, f.jup, f.scale, f.pr);
    this.wu.uT.value = this.t;
    for (const [id, u] of this.uFlow) u.value = this.t / (id === 'venus' ? 1 : 9);
    for (const s of this.shells) s.u.uSun.value.copy(s.node.position).negate().normalize();
    if (this.sun && this.sunNode) this.sun.update(this.t, f.dt, f.camera, this.sunNode, f.scale, f.pr);
    this.comet.update(f.ms, this.t, f.scale, f.pr);
  }
}
