/**
 * Kit "compare": the Sun, the Earth and the Moon side by side. True sizes (a zoom out from the Earth to the whole
 * Sun), the Earth–Moon distance to scale, the 400× coincidence (same size in our sky), the Moon sliding over the Sun
 * as seen from the ground, and close-ups of the Moon's and the Sun's surfaces.
 * Unit: one Earth radius (6 371 km), except the close-ups and the sky view (one body radius).
 */
import * as THREE from 'three';
import { D2R, body, clamp, dirLight, ease, fade, glow, line, setLine, drawIn, lerp, ramp, rng, starfield, sunLight, canvasTex } from './draw.ts';
import type { KitCtx, KitFactory, Label, Pair, V3 } from './types.ts';

export interface Opts {
  /**
   * - `sizes`: Earth and Moon beside the Sun's edge, then a zoom out to the whole Sun (clock 0 → 1 drives the zoom;
   *   without a clock it plays once)
   * - `distance`: the Earth and the Moon to scale, ~30 Earths apart; with a clock (seconds, 0 → 1.28) a light pulse
   * - `coincidence`: the Moon 400× smaller and 400× closer than the Sun, so both fill the same angle (not to scale)
   * - `cover`: the sky seen from the ground, the Moon sliding over the Sun (clock −2.4 → 2.4 = Moon offset in Sun radii)
   * - `moon`: close-up of the Moon's near side (maria, craters, Apollo 11)
   * - `sun`: close-up of the Sun's surface (granulation, sunspots)
   */
  mode: 'sizes' | 'distance' | 'coincidence' | 'cover' | 'moon' | 'sun';
  /** `cover`: the Moon's apparent size over the Sun's (≥ 1 total, < 1 annular; default 1.05) */
  ratio?: number;
  /** `moon` / `coincidence`: no naming labels (for a quiz that the labels would give away) */
  bare?: boolean;
  /** `cover`: the Moon's path offset north of the Sun's centre, in Sun radii (a partial eclipse; default 0) */
  dy?: number;
}

type O = Opts & { clock?: { from: number; to: number } };

const KM = 6371;
const R_SUN = 696000 / KM, R_MOON = 1737.4 / KM, D_MOON = 384400 / KM;
const C = { gold: '#ffd24a', ice: '#a5d8ff', teal: '#3bc9db', white: '#f1f3f5', orange: '#ff922b', dim: '#9aa7b4' };
const nf = (zh: boolean) => new Intl.NumberFormat(zh ? 'zh-CN' : 'en-US');

/** A point on a body's surface (lat/lon, deg) in the body mesh's own frame (maps: lon 0 at +x, north +z). */
function surf(lat: number, lon: number, r = 1): THREE.Vector3 {
  // body() turns the sphere by +90° about x: undo it so the child sits on the textured point
  const c = Math.cos(lat * D2R);
  return new THREE.Vector3(c * Math.cos(lon * D2R), Math.sin(lat * D2R), -c * Math.sin(lon * D2R)).multiplyScalar(r);
}
/** An empty marker on a body's surface, for labels that turn with it. */
function pin(mesh: THREE.Object3D, lat: number, lon: number): THREE.Object3D {
  const o = new THREE.Object3D();
  o.position.copy(surf(lat, lon, 1.0));
  mesh.add(o);
  return o;
}

const SUN_VS = /* glsl */`
varying vec3 vP; varying vec3 vN; varying vec3 vV;
void main() {
  vP = normalize(position);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const SUN_FS = /* glsl */`
uniform float uT, uF, uC;
uniform vec4 uSpot[3];
varying vec3 vP; varying vec3 vN; varying vec3 vV;
vec3 h3(vec3 p) { p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))); return fract(sin(p) * 43758.5453); }
vec2 worley(vec3 p) {
  vec3 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(float(x), float(y), float(z)), o = h3(i + g);
    o = 0.5 + 0.42 * sin(uT * 0.35 + 6.2831 * o);
    vec3 r = g + o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return vec2(sqrt(d1), sqrt(d2));
}
void main() {
  vec3 n = normalize(vP);
  float mu = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
  vec2 w = worley(n * uF);
  float g = 0.5 * smoothstep(0.0, 0.45, w.y - w.x) + 0.5 * (1.0 - smoothstep(0.1, 0.85, w.x));
  float b = 1.0 - uC + uC * g;
#ifndef LOW
  vec2 w2 = worley(n * uF * 0.21 + 7.0);
  b *= 0.9 + 0.1 * smoothstep(0.0, 0.6, w2.y - w2.x);
#endif
  for (int k = 0; k < 3; k++) {
    if (uSpot[k].w <= 0.0) continue;
    float d = acos(clamp(dot(n, uSpot[k].xyz), -1.0, 1.0)), r = uSpot[k].w * (1.0 + 0.25 * (w.x - 0.4));
    b *= mix(0.16, 1.0, smoothstep(r * 0.42, r * 0.52, d)) * mix(0.55, 1.0, smoothstep(r * 0.9, r * 1.08, d));
  }
  float limb = 0.32 + 0.68 * pow(mu, 0.55);
  float k = b * limb;
  vec3 c = mix(vec3(0.9, 0.36, 0.07), vec3(1.0, 0.88, 0.6), smoothstep(0.25, 1.0, k)) * (0.4 + 0.8 * k);
  gl_FragColor = vec4(c, 1.0);
}`;
/** A glowing Sun with live granulation, limb darkening and optional sunspots (unit directions + angular radius). */
function sunBall(r: number, freq: number, low: boolean, spots: [number, number, number][] = [], contrast = 0.3): THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> {
  const uSpot = [0, 1, 2].map(i => {
    const s = spots[i];
    if (!s) return new THREE.Vector4(0, 0, 1, 0);
    const v = surf(s[0], s[1]);
    return new THREE.Vector4(v.x, v.y, v.z, s[2]);
  });
  const m = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uF: { value: freq }, uC: { value: contrast }, uSpot: { value: uSpot } },
    vertexShader: SUN_VS, fragmentShader: SUN_FS, defines: low ? { LOW: 1 } : {},
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 96, 48), m);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

/** The faint corona streamers seen in totality. */
function corona(size: number): THREE.Sprite {
  const t = canvasTex(256, 256, c => {
    const R = rng(5), g = c.createRadialGradient(128, 128, 30, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.25, 'rgba(235,240,255,0.55)'); g.addColorStop(0.55, 'rgba(200,215,255,0.12)'); g.addColorStop(1, 'rgba(200,215,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 256, 256);
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const a = R() * Math.PI * 2, len = 60 + R() * 64, w = 0.05 + R() * 0.12;
      const s = c.createRadialGradient(128, 128, 30, 128, 128, len);
      s.addColorStop(0, 'rgba(240,244,255,0.35)'); s.addColorStop(1, 'rgba(240,244,255,0)');
      c.fillStyle = s;
      c.beginPath(); c.moveTo(128, 128); c.arc(128, 128, len, a - w, a + w); c.closePath(); c.fill();
    }
  });
  const m = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false, opacity: 0 });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(size);
  return s;
}

/** Fraction of a disc of radius 1 covered by a disc of radius r at centre distance d. */
function covered(r: number, d: number): number {
  if (d >= 1 + r) return 0;
  if (d <= Math.abs(1 - r)) return Math.min(1, r * r);
  const a = Math.acos(clamp((d * d + 1 - r * r) / (2 * d), -1, 1)), b = Math.acos(clamp((d * d + r * r - 1) / (2 * d * r), -1, 1));
  return (a + r * r * b - 0.5 * Math.sqrt(Math.max(0, (-d + 1 + r) * (d + 1 - r) * (d - 1 + r) * (d + 1 + r)))) / Math.PI;
}

/** Re-aim the camera along its current direction (so the user's turning survives a scripted zoom). */
function zoomTo(ctx: KitCtx, d: number, target: V3): void {
  const dir = ctx.camera.position.clone().sub(ctx.orbit.target).normalize();
  ctx.view(dir.toArray() as V3, d, target, true);
}

const kit: KitFactory<O> = (ctx, o) => {
  const zh = ctx.zh(), N = nf(zh);
  const root = ctx.root, low = ctx.low;
  const stars = starfield(low ? 1200 : 2500);
  root.add(stars);
  const spinUni: { value: number }[] = [];
  const tick: ((v: number, el: number) => void)[] = [];
  let readout: ((v: number) => Pair | string) | undefined;
  const hasClock = !!o.clock;

  if (o.mode === 'sizes') {
    const sun = sunBall(R_SUN, 320, low, [], 0.12);
    sun.position.set(-(R_SUN + 2.2), 0, 0);
    spinUni.push(sun.material.uniforms.uT);
    const halo = glow('#ffb347', R_SUN * 2.6, 0.55);
    halo.position.copy(sun.position);
    const earthG = new THREE.Group(), earth = body('earth', 1, '#4a78b8');
    earthG.rotation.z = 160 * D2R;
    earthG.add(earth);
    const moon = body('moon', R_MOON, '#9a9a9a');
    moon.position.set(2.1, 0, 0);
    root.add(sun, halo, earthG, moon, sunLight(sun.position.toArray() as V3, 2.6, 0.16));
    ctx.pickable(sun, 'sun'); ctx.pickable(earth, 'earth'); ctx.pickable(moon, 'moon');
    ctx.label(earth, ['Earth · 12,742 km', '地球 · 直径 12742 千米'], { c: C.ice, dy: -26 });
    ctx.label(moon, ['Moon · 3,474 km', '月球 · 直径 3474 千米'], { c: C.white, dy: 22 });
    const sunL = ctx.label(new THREE.Vector3(sun.position.x + R_SUN * Math.cos(25 * D2R), 0, R_SUN * Math.sin(25 * D2R)), ['Sun · 109 × Earth', '太阳 · 直径是地球的 109 倍'], { c: C.gold, big: true });
    const from: V3 = [0.12, -1, 0.16];
    ctx.view(from, 7.5, [0.6, 0, 0], true);
    let last = -1, d = 7.5;
    const zoom = (z: number) => {
      if (Math.abs(z - last) < 1e-4) return;
      last = z;
      const k = ease(z);
      d = Math.exp(lerp(Math.log(7.5), Math.log(300), k));
      // pull back before panning, so the camera never ends up inside the Sun
      const k3 = k * k * k;
      zoomTo(ctx, d, [lerp(0.6, sun.position.x * 0.5, k3), 0, lerp(0, R_SUN * 0.12, k3)]);
    };
    tick.push((v, el) => {
      const z = hasClock ? v : clamp((el - 2.5) / 7);
      zoom(z);
      sunL.pos.set(sun.position.x + R_SUN * Math.cos(lerp(5, 30, ease(z)) * D2R), 0, R_SUN * Math.sin(lerp(5, 30, ease(z)) * D2R));
    });
    readout = () => {
      // a 16:10 view at distance d is 2·d·tan(20°)·1.6 wide
      const km = Math.round((1.165 * d * KM) / 10000) * 10000;
      return zh ? `视野宽约 ${N.format(km / 10000)} 万千米` : `view ≈ ${N.format(km)} km across`;
    };
  } else if (o.mode === 'distance') {
    const earthG = new THREE.Group(), earth = body('earth', 1, '#4a78b8');
    earthG.rotation.z = 160 * D2R; earthG.add(earth);
    const moon = body('moon', R_MOON, '#9a9a9a');
    moon.position.set(D_MOON, 0, 0);
    root.add(earthG, moon, dirLight([0.4, -1, 0.5], 2.4, 0.18));
    ctx.pickable(earth, 'earth'); ctx.pickable(moon, 'moon');
    // 30 Earths in a row reach the Moon
    const ghosts = new THREE.Group();
    const circ = Array.from({ length: 65 }, (_, i) => { const a = (i / 64) * Math.PI * 2; return new THREE.Vector3(Math.cos(a), 0, Math.sin(a)); });
    for (let i = 1; i < 30; i++) { const l = line(circ, C.ice, { opacity: 0.4 }); l.position.x = 2 * i; ghosts.add(l); }
    root.add(ghosts);
    const dim = line([[0, 0, -2.4], [D_MOON, 0, -2.4]], C.gold, { opacity: 0.7 });
    const t0 = line([[0, 0, -2.0], [0, 0, -2.8]], C.gold, { opacity: 0.7 }), t1 = line([[D_MOON, 0, -2.0], [D_MOON, 0, -2.8]], C.gold, { opacity: 0.7 });
    root.add(dim, t0, t1);
    const pulse = glow('#fff3bf', 1.6, 1);
    root.add(pulse);
    ctx.label(earth, ['Earth', '地球'], { c: C.ice, dy: -24 });
    ctx.label(moon, ['Moon', '月球'], { c: C.white, dy: -18 });
    ctx.label(new THREE.Vector3(D_MOON / 2, 0, -2.4), ['384,400 km', '384400 千米'], { c: C.gold, big: true, dy: 16, t: 1.5 });
    ctx.label(new THREE.Vector3(D_MOON / 2, 0, 1.2), ['≈ 30 Earths side by side', '约能排下 30 个地球'], { c: C.ice, t: 3.5, dy: -16 });
    ctx.view([0, -1, 0.1], 56, [D_MOON / 2, 0, -0.4], true);
    tick.push((v, el) => {
      ghosts.children.forEach((g, i) => fade(g, ramp(el, 2 + i * 0.07, 0.3)));
      drawIn(dim, ramp(el, 0.6, 1.2));
      const s = hasClock ? clamp(v / 1.282) : ((el % 4) / 1.282);
      pulse.visible = s > 0 && s < 1;
      pulse.position.set(lerp(1, D_MOON - R_MOON, clamp(s)), 0, 0);
    });
    if (hasClock) readout = v => {
      const km = Math.round(Math.min(v, 1.2823) * 299792);
      return zh ? `光走了 ${N.format(km)} 千米` : `light has gone ${N.format(km)} km`;
    };
  } else if (o.mode === 'coincidence') {
    const eye = 0.35, dm = 8, ds = 40, a = 0.07;
    const earth = body('earth', eye, '#4a78b8');
    const moon = body('moon', dm * a, '#9a9a9a');
    moon.position.set(eye + dm, 0, 0);
    const sun = sunBall(ds * a, 9, low);
    sun.position.set(eye + ds, 0, 0);
    spinUni.push(sun.material.uniforms.uT);
    const halo = glow('#ffb347', ds * a * 5, 0.6);
    halo.position.copy(sun.position);
    root.add(earth, moon, sun, halo, sunLight(sun.position.toArray() as V3, 2.4, 0.2));
    ctx.pickable(sun, 'sun'); ctx.pickable(moon, 'moon'); ctx.pickable(earth, 'earth');
    const top = line([[eye, 0, 0], [eye + ds, 0, ds * a]], C.gold, { opacity: 0.55 }), bot = line([[eye, 0, 0], [eye + ds, 0, -ds * a]], C.gold, { opacity: 0.55 });
    root.add(top, bot);
    ctx.label(earth, ['You', '你'], { c: C.ice, dy: -22 });
    if (!o.bare) ctx.label(moon, ['Moon', '月球'], { c: C.white, dy: -30, t: 0.4 });
    if (!o.bare) ctx.label(new THREE.Vector3(eye + ds - 7, 0, ds * a + 1.4), ['Sun: ~400× wider and ~400× farther', '太阳：直径和距离都约是月球的 400 倍'], { c: C.gold, t: 1.2 });
    ctx.label(new THREE.Vector3(eye + dm * 0.5, 0, -0.9), ['Same size in our sky: ½°', '在天上看起来一样大：约 0.5°'], { c: C.gold, big: true, t: 2.6 });
    ctx.label(new THREE.Vector3(eye + ds * 0.55, 0, -3.2), ['not to scale', '未按比例'], { c: C.dim, t: 2.6 });
    ctx.view([0, -1, 0.08], 44, [eye + ds * 0.5 + 0.8, 0, 0.6], true);
    tick.push((_v, el) => { drawIn(top, ramp(el, 1.6, 1.4)); drawIn(bot, ramp(el, 1.6, 1.4)); });
  } else if (o.mode === 'cover') {
    const ratio = o.ratio ?? 1.05, dy = o.dy ?? 0;
    const sun = sunBall(1, 7, low);
    spinUni.push(sun.material.uniforms.uT);
    const halo = glow('#ffd9a0', 4.2, 0.55);
    const cor = corona(5.2);
    cor.renderOrder = 2;
    const moon = new THREE.Mesh(new THREE.CircleGeometry(ratio, 96), new THREE.MeshBasicMaterial({ color: '#0b0d12', transparent: true, depthTest: false, depthWrite: false }));
    moon.rotation.x = Math.PI / 2;
    moon.renderOrder = 10;
    root.add(sun, halo, cor, moon);
    ctx.pickable(sun, 'sun'); ctx.pickable(moon, 'moon');
    const sky = new THREE.Color(), day = new THREE.Color('#3f6fa6'), night = new THREE.Color('#02040a');
    ctx.scene.background = sky;
    const sL = ctx.label(new THREE.Vector3(0.7, 0, 0.85), ['Sun', '太阳'], { c: C.gold, dx: 30, dy: -20 });
    const mL = ctx.label(moon, ['Moon', '月球'], { c: C.white, dy: 0 });
    const tL = ctx.label(new THREE.Vector3(0, 0, -1.55), ['', ''], { c: C.gold, big: true });
    ctx.view([0, -1, 0], 6.5, [0, 0, 0], true);
    let cov = 0;
    tick.push((v, el) => {
      const x = hasClock ? v : lerp(-2.4, 2.4, ((el / 14) % 1));
      moon.position.set(x, -0.01, dy);
      cov = covered(ratio, Math.hypot(x, dy));
      const tot = ratio >= 1 && cov > 0.999, ann = ratio < 1 && Math.hypot(x, dy) < 1 - ratio;
      // the sky darkens only near the end: even a 90 % eclipse leaves a bright day
      const dark = tot ? 1 : clamp((cov - 0.75) / 0.25) ** 2 * 0.8;
      sky.copy(day).lerp(night, dark);
      fade(stars, tot ? 1 : clamp((dark - 0.5) * 2) * 0.6);
      (cor.material as THREE.SpriteMaterial).opacity = tot ? 0.95 : 0;
      (halo.material as THREE.SpriteMaterial).opacity = tot ? 0.05 : 0.55 * (1 - cov * 0.7);
      mL.on = Math.hypot(x, dy) > 1 + ratio * 0.6 || tot;
      sL.on = !tot;
      tL.set(tot ? ['Total eclipse: the corona shows', '日全食：看得见日冕'] : ann ? ['Annular eclipse: a ring of fire', '日环食：一圈“金环”'] : cov > 0.001 ? ['Partial eclipse', '日偏食'] : ['', '']);
      tL.on = cov > 0.001;
    });
    readout = () => (zh ? `太阳被遮住 ${Math.round(cov * 100)}%` : `${Math.round(cov * 100)}% of the Sun covered`);
  } else if (o.mode === 'moon') {
    const moon = body('moon', 1, '#9a9a9a', low ? 512 : 1024);
    const g = new THREE.Group();
    g.add(moon);
    root.add(g, dirLight([0.55, 0.85, 0.12], 2.6, 0.06));
    ctx.pickable(moon, 'moon');
    const marks: { o: THREE.Object3D; l: Label }[] = [];
    const add = (lat: number, lon: number, t: Pair, c: string, dl = 0) => { if (o.bare) return; const p = pin(moon, lat, lon); marks.push({ o: p, l: ctx.label(p, t, { c, dot: true, t: dl }) }); };
    add(33, -16, ['Sea of Rains: a lava plain', '雨海：熔岩平原'], C.ice, 0.6);
    add(-43.3, -11.2, ['Tycho crater', '第谷环形山'], C.gold, 1.4);
    add(9.6, -20.1, ['Copernicus crater', '哥白尼环形山'], C.gold, 2.0);
    add(0.67, 23.47, ['Apollo 11, 1969', '阿波罗 11 号着陆点（1969）'], C.teal, 2.8);
    ctx.view([1, -0.18, 0.12], 3.6, [0, 0, 0], true);
    const cam = new THREE.Vector3(), wp = new THREE.Vector3();
    tick.push((_v, el) => {
      g.rotation.z = Math.sin(el * 0.12) * 0.32 - 0.1;
      cam.copy(ctx.camera.position).normalize();
      for (const m of marks) { m.o.getWorldPosition(wp); m.l.on = wp.normalize().dot(cam) > 0.25; }
    });
  } else {
    const spots: [number, number, number][] = [[14, -18, 0.07], [9, -6, 0.045], [-12, 22, 0.055]];
    const sun = sunBall(1, 26, low, spots, 0.34);
    spinUni.push(sun.material.uniforms.uT);
    const g = new THREE.Group();
    g.add(sun);
    g.rotation.z = -90 * D2R;
    root.add(g, glow('#ffb347', 3.4, 0.75), glow('#ffe8c0', 2.35, 0.35));
    ctx.pickable(sun, 'sun');
    // the labels sit off the bright disc, with leader lines to the turning spots and to the surface
    const spot = new THREE.Object3D();
    spot.position.copy(surf(spots[0][0], spots[0][1]));
    sun.add(spot);
    const sAt = new THREE.Vector3(1.32, 0, 0.62), pAt = new THREE.Vector3(1.3, 0, -0.78), pOn = new THREE.Vector3(0.5, -0.72, -0.48).normalize();
    const sLine = line([sAt, sAt], C.white, { opacity: 0.75 }), pLine = line([pAt, pOn], C.gold, { opacity: 0.75 });
    root.add(sLine, pLine);
    const sl = ctx.label(sAt, ['Sunspots: cooler, ≈ 3,500 °C', '太阳黑子：温度较低，约 3500 °C'], { c: C.white, t: 1.2 });
    const pl = ctx.label(pAt, ['Surface (photosphere) ≈ 5,500 °C', '光球层（表面）：约 5500 °C'], { c: C.gold, t: 0.5 });
    ctx.label(new THREE.Vector3(-0.9, 0, 1.3), ['A star: a ball of hot glowing gas', '一颗恒星：炽热发光的气体球'], { c: C.gold, big: true, t: 2.2 });
    ctx.view([0, -1, 0.1], 4.6, [0.35, 0, 0], true);
    const cam = new THREE.Vector3(), wp = new THREE.Vector3(), seg = [sAt, wp];
    tick.push((_v, el) => {
      g.rotation.z = -90 * D2R + el * 0.015;
      cam.copy(ctx.camera.position).sub(ctx.orbit.target).normalize();
      spot.getWorldPosition(wp);
      const on = wp.dot(cam) > 0.3 && el > 1.2;
      sl.on = on; sLine.visible = on;
      if (on) setLine(sLine, seg);
      pl.on = pLine.visible = el > 0.5;
    });
  }

  return {
    update(v, _dt, el) {
      for (const u of spinUni) u.value = el;
      for (const f of tick) f(v, el);
    },
    readout,
  };
};
export default kit;
