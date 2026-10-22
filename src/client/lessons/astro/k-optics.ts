/**
 * Kit "optics": how telescopes work and what they see.
 * - `refractor`: starlight (parallel rays) through an objective lens to its focus, then an eyepiece.
 * - `reflector`: a Newtonian: a concave primary mirror at the back, a flat diagonal mirror sending the light out to
 *   the side. In both, lab sliders `D` (aperture, mm) and `f` (focal length, mm) reshape the telescope; the readout
 *   gives the light grasp against the eye (pupil 7 mm), the resolution (≈ 138″ / D in mm, green light) and the
 *   magnification with a 20 mm eyepiece; an inset shows a double star 1″ apart as the telescope would.
 * - `spectrum`: the electromagnetic spectrum from radio to gamma rays, how much of each the air blocks, and where
 *   telescopes must sit (`scopes`) to see it: on the ground under the windows, or in space.
 * - `dish`: FAST (中国天眼), the 500 m radio dish in a karst valley in Guizhou: radio waves focus on its feed cabin.
 * Diagrams are not to scale.
 */
import * as THREE from 'three';
import { C } from '../kit.ts';
import { Arrow, canvasTex, circlePts, clamp, dirLight, line, setLine, starfield } from './draw.ts';
import type { KitCtx, KitFactory, KitRun, Pair } from './types.ts';

export interface Opts {
  /** default `refractor` */
  view?: 'refractor' | 'reflector' | 'spectrum' | 'dish';
  /** aperture (mm) and focal length (mm) without lab sliders `D` / `f` (default 60 / 600) */
  D?: number; f?: number;
  /** spectrum: place famous telescopes */
  scopes?: boolean;
}

const RAY = '#ffe066';
const fmtN = (x: number) => (x >= 100 ? Math.round(x).toLocaleString('en-US') : x >= 10 ? x.toFixed(0) : x.toFixed(1));

const kit: KitFactory<Opts> = (ctx, o) => {
  const v = o.view ?? 'refractor';
  return v === 'spectrum' ? spectrum(ctx, o) : v === 'dish' ? dish(ctx) : scope(ctx, o, v === 'reflector');
};
export default kit;

/** Telescope numbers for aperture D and focal length f (mm). */
export function scopeNumbers(D: number, f: number) {
  return { light: (D / 7) ** 2, res: 138 / D, mag: f / 20 };
}

function glass(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: '#a5d8ff', emissive: '#1c4a6e', transparent: true, opacity: 0.5, roughness: 0.15, depthWrite: false });
}
const onTop = <T extends THREE.Object3D>(x: T, ro = 5) => { x.renderOrder = ro; return x; };

function scope(ctx: KitCtx, o: Opts, reflector: boolean): KitRun {
  const root = ctx.root;
  root.add(starfield(ctx.low ? 900 : 1800), dirLight([-1, -2, 2], 2, 0.5));
  const DOf = () => { const p = ctx.param('D'); return Number.isFinite(p) ? p : o.D ?? 60; };
  const fOf = () => { const p = ctx.param('f'); return Number.isFinite(p) ? p : o.f ?? 600; };
  // scene sizes: aperture radius and focal length, squeezed (not to scale)
  const rS = (D: number) => 1.6 * Math.sqrt(D / 1000);
  const fS = (f: number) => 2.5 + 4.2 * ((f - 200) / 4800);

  const tubeM = new THREE.MeshStandardMaterial({ color: '#5c7cfa', transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 48, 1, true), tubeM);
  tube.rotation.z = Math.PI / 2;
  const rimA = line(circlePts(1, 64), '#91a7ff', { opacity: 0.7 }), rimB = line(circlePts(1, 64), '#91a7ff', { opacity: 0.7 });
  rimA.rotation.y = rimB.rotation.y = Math.PI / 2;
  root.add(tube, rimA, rimB);
  // rays: a bundle on two rings plus the centre
  const starts: [number, number][] = [];
  const ringN = ctx.low ? 6 : 8;
  for (const [k, n] of [[0.92, ringN], [0.55, ringN / 2]] as [number, number][]) for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + (k < 0.6 ? Math.PI / n : 0) + 0.2; starts.push([k * Math.cos(a), k * Math.sin(a)]); }
  if (!reflector) starts.push([0, 0]);
  const rays = starts.map(() => onTop(line(Array.from({ length: 5 }, () => new THREE.Vector3()), RAY, { opacity: 0.85 })));
  root.add(...rays);
  const focus = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff3bf' }));
  root.add(focus);
  ctx.pickable(focus, 'focus');
  const aD = new THREE.Object3D(), aF = new THREE.Object3D(), aStar = new THREE.Object3D();
  root.add(aD, aF, aStar);
  const lD = ctx.label(aD, '', { c: C.ice, dx: -12 }), lF = ctx.label(aF, '', { c: C.gold, dy: 22 });
  const fLine = line([[0, 0, 0], [1, 0, 0]], C.gold, { opacity: 0.7, dashed: true, dash: 0.12 });
  root.add(fLine);
  ctx.label(focus, ['focus', '焦点'], { c: '#fff3bf', dy: -18 });
  ctx.label(aStar, ['starlight: parallel rays', '星光：平行光'], { c: RAY });

  // the optics
  const lens = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), glass());
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), glass());
  const primary = new THREE.Mesh(new THREE.LatheGeometry(Array.from({ length: 17 }, (_, i) => new THREE.Vector2(i / 16, 0)), 64),
    new THREE.MeshStandardMaterial({ color: '#dee2e6', metalness: 0.8, roughness: 0.2, side: THREE.DoubleSide }));
  const secondary = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ color: '#e9ecef', metalness: 0.8, roughness: 0.2, side: THREE.DoubleSide }));
  const focuser = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1, 20, 1, true), new THREE.MeshStandardMaterial({ color: '#868e96', side: THREE.DoubleSide }));
  const aObj = new THREE.Object3D(), aEye = new THREE.Object3D(), aSec = new THREE.Object3D();
  root.add(aObj, aEye, aSec);
  if (reflector) {
    root.add(primary, secondary, focuser, eyeL);
    ctx.pickable(primary, 'primary'); ctx.pickable(secondary, 'secondary');
    ctx.label(aObj, ['primary mirror (concave)', '主镜（凹面镜）'], { c: C.white, dx: 40, dy: 30 });
    ctx.label(aSec, ['flat diagonal mirror', '平面副镜'], { c: C.white, dx: -70, dy: -6 });
  } else {
    root.add(lens, eyeL);
    ctx.pickable(lens, 'objective');
    ctx.label(aObj, ['objective lens', '物镜（凸透镜）'], { c: C.white, dy: 28 });
  }
  ctx.pickable(eyeL, 'eyepiece');
  ctx.label(aEye, ['eyepiece', '目镜'], { c: C.white, dx: reflector ? 0 : -28, dy: reflector ? -16 : 28 });

  // the inset: a double star 1″ apart as this telescope shows it
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const insetT = new THREE.CanvasTexture(cv);
  insetT.colorSpace = THREE.SRGBColorSpace;
  const inset = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: insetT }));
  inset.rotation.x = Math.PI / 2;
  const insetRim = line(circlePts(1, 64), '#adb5bd', { opacity: 0.8 });
  insetRim.rotation.x = Math.PI / 2;
  const insetG = new THREE.Group();
  insetG.add(inset, insetRim);
  root.add(insetG);
  const lIn = ctx.label(insetG, '', { c: '#ced4da', dy: 70 });
  const paintInset = (res: number) => {
    const c = cv.getContext('2d')!, img = c.createImageData(128, 128), px = 30; // 1″ = 30 px
    const s = Math.max(1.2, (res * px) / 2.355);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const r = Math.hypot(x - 64, y - 64), j = (y * 128 + x) * 4;
      const b = r > 63 ? 0 : Math.exp(-((x - 64 + px / 2) ** 2 + (y - 64) ** 2) / (2 * s * s)) + 0.8 * Math.exp(-((x - 64 - px / 2) ** 2 + (y - 64) ** 2) / (2 * s * s));
      const k = clamp(b * (3.2 / Math.max(1, s / 3)));
      img.data[j] = 20 + 235 * k; img.data[j + 1] = 24 + 226 * k; img.data[j + 2] = 40 + 200 * k; img.data[j + 3] = r > 63 ? 0 : 255;
    }
    c.putImageData(img, 0, 0);
    insetT.needsUpdate = true;
  };
  (inset.material as THREE.MeshBasicMaterial).transparent = true;
  ctx.view([0.22, -1, 0.3], 14.5, [4, 0, 0.6], true);

  let key = '';
  const P = new THREE.Vector3(), Q = new THREE.Vector3(), F = new THREE.Vector3();
  return {
    update() {
      const D = DOf(), f = fOf(), k2 = `${D}|${f}`;
      if (k2 === key) return;
      key = k2;
      const r = rS(D), fs = fS(f), fe = 0.55, x0 = -2.6;
      const n = scopeNumbers(D, f);
      if (!reflector) {
        const L = fs + fe;
        tube.scale.set(r * 1.08, L, r * 1.08); tube.position.set(L / 2, 0, 0);
        rimA.scale.setScalar(r * 1.08); rimB.scale.setScalar(r * 1.08); rimA.position.set(0, 0, 0); rimB.position.set(L, 0, 0);
        lens.scale.set(0.06 + r * 0.12, r, r);
        eyeL.scale.set(0.05, 0.22, 0.22); eyeL.position.set(L, 0, 0);
        focus.position.set(fs, 0, 0);
        starts.forEach(([a, b], i) => {
          const y = a * r, z = b * r, e = -fe / fs;
          setLine(rays[i], [[x0, y, z], [0, y, z], [fs, 0, 0], [L, y * e, z * e], [L + 1.4, y * e, z * e]]);
        });
        aObj.position.set(0, 0, -r); aEye.position.set(L, 0, -0.25);
        setLine(fLine, [[0, 0, -r - 0.35], [fs, 0, -r - 0.35]]);
        insetG.position.set(L + 3, 0, 0.8);
      } else {
        // drawn focal length: fast, wide mirrors are stretched so the diagonal still catches the whole cone
        const fd = Math.max(fs, 2.2 * r + 0.7);
        const L = fd + 0.7, s = Math.min(r * 1.08 + 0.5, fd * 0.75), xs = L - fd + s;
        tube.scale.set(r * 1.08, L, r * 1.08); tube.position.set(L / 2, 0, 0);
        rimA.scale.setScalar(r * 1.08); rimB.scale.setScalar(r * 1.08); rimA.position.set(0, 0, 0); rimB.position.set(L, 0, 0);
        // a paraboloid x = L − ρ²/(4 fd), built around y then turned to face −x
        primary.geometry.dispose();
        primary.geometry = new THREE.LatheGeometry(Array.from({ length: 17 }, (_, i) => { const p = (i / 16) * r; return new THREE.Vector2(p, -(p * p) / (4 * fd)); }), 64);
        primary.rotation.z = Math.PI / 2; primary.position.set(L, 0, 0);
        F.set(L - fd, 0, 0);
        const cone = (2 * r * s) / fd;
        secondary.scale.set(cone * Math.SQRT2 * 1.1, cone * 1.1, 1);
        secondary.rotation.set(0, Math.PI / 4, 0);
        secondary.position.set(xs, 0, 0);
        focuser.scale.set(1, 0.6, 1); focuser.rotation.set(Math.PI / 2, 0, 0); focuser.position.set(xs, 0, r * 1.08 + 0.25);
        const Fp = new THREE.Vector3(xs, 0, s), ze = s + 0.5;
        eyeL.scale.set(0.22, 0.22, 0.05); eyeL.position.set(xs, 0, ze);
        focus.position.copy(Fp);
        starts.forEach(([a, b], i) => {
          const y = a * r, z = b * r, rho2 = y * y + z * z;
          P.set(L - rho2 / (4 * fd), y, z);
          // to the diagonal mirror x + z = xs, then up through the focus F′ to the eyepiece
          const d = F.clone().sub(P), t = (xs - P.x - P.z) / (d.x + d.z);
          Q.copy(P).addScaledVector(d, t);
          const d2 = Fp.clone().sub(Q), u = (ze - Q.z) / d2.z, E = Q.clone().addScaledVector(d2, u);
          setLine(rays[i], [[x0, y, z], P, Q, E, [E.x, E.y, ze + 1.3]]);
        });
        aObj.position.set(L, 0, -r); aEye.position.set(xs + 0.3, 0, ze); aSec.position.set(xs, 0, -0.1);
        setLine(fLine, [[L, 0, -r - 0.4], [L - fd, 0, -r - 0.4]]);
        insetG.position.set(L + 2.6, 0, 1.2);
      }
      aD.position.set(-0.1, 0, r * 1.08 + 0.25);
      // keep the starlight label clear above the aperture label as the tube widens
      aStar.position.set(-3.2, 0, Math.max(1.2, r * 1.08 + 0.75));
      lD.set([`aperture D = ${D} mm (light ×${fmtN(n.light)} the eye)`, `口径 D = ${D} 毫米（集光力为人眼的 ${fmtN(n.light)} 倍）`]);
      aF.position.set(reflector ? 0.7 + Math.max(fs, 2.2 * r + 0.7) / 2 : fs / 2, 0, -r - 0.35);
      lF.set([`focal length f = ${f} mm`, `焦距 f = ${f} 毫米`]);
      paintInset(n.res);
      lIn.set([`resolution ${n.res.toFixed(2)}″ · a double star 1″ apart: ${n.res <= 1 ? 'split' : 'one blur'}`, `分辨率 ${n.res.toFixed(2)}″ · 相距 1″ 的双星：${n.res <= 1 ? '分得开' : '糊成一团'}`]);
    },
    readout() {
      const n = scopeNumbers(DOf(), fOf());
      return [`${fmtN(n.mag)}× with a 20 mm eyepiece`, `配 20 毫米目镜放大 ${fmtN(n.mag)} 倍`];
    },
  };
}

/** The electromagnetic spectrum, the air's absorption and where telescopes have to be. */
function spectrum(ctx: KitCtx, o: Opts): KitRun {
  const root = ctx.root, X0 = -9, X1 = 9, HB = 4.2;
  ctx.scene.background = new THREE.Color('#081120');
  // bands from long waves (left) to short (right): x ranges
  const B: { n: Pair; x0: number; x1: number; c: string; wl: Pair }[] = [
    { n: ['radio', '无线电波'], x0: -9, x1: -3.6, c: '#c92a2a', wl: ['> 1 mm', '> 1 毫米'] },
    { n: ['infrared', '红外线'], x0: -3.6, x1: -0.7, c: '#e8590c', wl: ['0.7 µm – 1 mm', '0.7 微米 – 1 毫米'] },
    { n: ['visible', '可见光'], x0: -0.7, x1: 0.7, c: '#ffffff', wl: ['0.4 – 0.7 µm', '0.4 – 0.7 微米'] },
    { n: ['ultraviolet', '紫外线'], x0: 0.7, x1: 3.2, c: '#7048e8', wl: ['10 – 400 nm', '10 – 400 纳米'] },
    { n: ['X-rays', 'X 射线'], x0: 3.2, x1: 6, c: '#4dabf7', wl: ['0.01 – 10 nm', '0.01 – 10 纳米'] },
    { n: ['gamma rays', 'γ 射线'], x0: 6, x1: 9, c: '#da77f2', wl: ['< 0.01 nm', '< 0.01 纳米'] },
  ];
  const strip = canvasTex(1024, 8, c => {
    for (let i = 0; i < 1024; i++) {
      const x = X0 + ((X1 - X0) * i) / 1023, b = B.find(q => x >= q.x0 && x <= q.x1) ?? B[0];
      // red (long) on the left to violet (short) on the right
      if (b.n[0] === 'visible') c.fillStyle = `hsl(${Math.round(((x - b.x0) / (b.x1 - b.x0)) * 270)},100%,55%)`;
      else c.fillStyle = b.c;
      c.globalAlpha = b.n[0] === 'visible' ? 1 : 0.75;
      c.fillRect(i, 0, 1, 8);
    }
  });
  const band = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, 0.6), new THREE.MeshBasicMaterial({ map: strip }));
  band.rotation.x = Math.PI / 2;
  band.position.set(0, 0, -0.45);
  root.add(band);
  B.forEach((b, i) => {
    ctx.label(new THREE.Vector3((b.x0 + b.x1) / 2, 0, -0.45), b.n, { c: '#ffffff', big: true, t: 0.2 + i * 0.12 });
    // the visible band is narrow: drop its wavelength label a row so it doesn't run into its neighbours
    ctx.label(new THREE.Vector3((b.x0 + b.x1) / 2, 0, -1.05), b.wl, { c: '#a5b4c8', dy: b.n[0] === 'visible' ? 20 : 0, t: 0.3 + i * 0.12 });
    if (i) root.add(line([[b.x0, 0, -0.75], [b.x0, 0, -0.15]], '#0b1424', { opacity: 1 }));
  });
  // the wave: longer on the left, shorter on the right
  const wv: THREE.Vector3[] = [];
  let ph = 0;
  for (let i = 0; i <= 900; i++) { const x = X0 + ((X1 - X0) * i) / 900, k = 1.2 * Math.exp((x - X0) * 0.31); ph += k * ((X1 - X0) / 900); wv.push(new THREE.Vector3(x, 0, -1.65 + 0.22 * Math.sin(ph))); }
  root.add(line(wv, '#ced4da', { opacity: 0.6 }));
  ctx.label(new THREE.Vector3(X0 + 0.1, 0, -2.1), ['long waves, low energy', '波长长、能量低'], { c: '#a5b4c8', dx: 60 });
  ctx.label(new THREE.Vector3(X1 - 0.1, 0, -2.1), ['short waves, high energy', '波长短、能量高'], { c: '#a5b4c8', dx: -60 });

  // the air's opacity (0 … 1) along the strip: radio and visible windows
  const opac = (x: number) => {
    if (x < -8.4) return 1; // the ionosphere reflects the longest radio waves
    if (x < -4.4) return 0.04;
    if (x < -3.6) return clamp((x + 4.4) / 0.6) * 0.95;
    if (x < -0.7) { const t = (x + 3.6) / 2.9; return clamp(0.95 - 0.55 * Math.exp(-(((t - 0.62) / 0.07) ** 2)) - 0.7 * Math.exp(-(((t - 0.9) / 0.08) ** 2)) - 0.85 * ramp1(t, 0.93)); }
    if (x < 0.75) return 0.03;
    return clamp((x - 0.75) / 0.5);
  };
  const shape = new THREE.Shape();
  shape.moveTo(X0, 0);
  for (let i = 0; i <= 360; i++) { const x = X0 + ((X1 - X0) * i) / 360; shape.lineTo(x, opac(x) * HB); }
  shape.lineTo(X1, 0);
  const wall = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: '#4c6ef5', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  wall.rotation.x = Math.PI / 2;
  root.add(wall);
  const top: THREE.Vector3[] = [];
  for (let i = 0; i <= 360; i++) { const x = X0 + ((X1 - X0) * i) / 360; top.push(new THREE.Vector3(x, 0, opac(x) * HB)); }
  root.add(line(top, '#91a7ff', { opacity: 0.9 }), line([[X0, 0, 0], [X1, 0, 0]], '#69db7c', { opacity: 0.8 }), line([[X0, 0, HB], [X1, 0, HB]], '#91a7ff', { opacity: 0.3, dashed: true, dash: 0.15 }));
  ctx.label(new THREE.Vector3(4.6, 0, HB * 0.55), ['the air blocks these', '被大气挡住'], { c: '#dbe4ff', big: true, t: 0.8 });
  ctx.label(new THREE.Vector3(-6.4, 0, 0.6), ['radio window', '射电窗口'], { c: '#69db7c', big: true, t: 1.2, dy: -30 });
  ctx.label(new THREE.Vector3(0, 0, 0.6), ['optical window', '光学窗口'], { c: '#69db7c', big: true, t: 1.2, dy: -30 });
  ctx.label(new THREE.Vector3(X0 - 0.2, 0, 0), ['ground', '地面'], { c: '#69db7c', dx: -30 });
  ctx.label(new THREE.Vector3(X0 - 0.2, 0, HB), ['space', '太空'], { c: '#91a7ff', dx: -30 });
  // telescopes: on the ground under the windows, or in space
  if (o.scopes) {
    const S: { n: Pair; x: number; z: number; c: string }[] = [
      { n: ['FAST (China, 500 m)', '中国天眼 FAST'], x: -6.4, z: 0.05, c: '#ffd43b' },
      { n: ['LAMOST', '郭守敬望远镜 LAMOST'], x: 0.15, z: 0.05, c: '#ffd43b' },
      { n: ['JWST (infrared)', '韦布望远镜（红外）'], x: -2.2, z: HB + 0.9, c: '#ffa94d' },
      { n: ['Hubble', '哈勃望远镜'], x: 0.5, z: HB + 1.9, c: '#ffffff' },
      { n: ['CSST (Xuntian)', '巡天空间望远镜 CSST'], x: 1.6, z: HB + 0.8, c: '#e599f7' },
      { n: ['Insight-HXMT (X-ray)', '慧眼 HXMT（X 射线）'], x: 4.6, z: HB + 1.6, c: '#74c0fc' },
      { n: ['Fermi (gamma)', '费米（γ 射线）'], x: 7.4, z: HB + 0.8, c: '#e599f7' },
    ];
    S.forEach((s, i) => {
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshBasicMaterial({ color: s.c }));
      m.position.set(s.x, -0.05, s.z);
      root.add(m);
      ctx.label(m, s.n, { c: s.c, dy: s.z < 1 ? -14 : -20, t: 1.4 + i * 0.25 });
    });
  }
  ctx.view([0, -1, 0.05], 21.5, [0, 0, 1.2], true);
  return { update() { /* static */ } };
}
const ramp1 = (t: number, t0: number) => clamp((t - t0) / (1 - t0));

/** FAST: a 500 m spherical dish in a karst hollow; at any moment a 300 m patch is pulled into a paraboloid. */
function dish(ctx: KitCtx): KitRun {
  const root = ctx.root, k = 1 / 50; // 1 unit = 50 m
  const Rc = 300 * k, half = Math.asin(250 / 300), rimZ = Rc * (1 - Math.cos(half));
  ctx.scene.background = new THREE.Color('#0d1726');
  root.add(dirLight([1, -1.5, 2], 2.2, 0.45), new THREE.HemisphereLight('#bcd4ff', '#2b3a22', 0.5));
  const cap = new THREE.Mesh(new THREE.SphereGeometry(Rc, 96, 32, 0, Math.PI * 2, Math.PI - half, half),
    new THREE.MeshStandardMaterial({ color: '#c8cdd3', metalness: 0.55, roughness: 0.35, side: THREE.DoubleSide }));
  cap.rotation.x = Math.PI / 2;
  cap.position.z = Rc;
  const grid = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(Rc * 0.999, ctx.low ? 36 : 60, 14, 0, Math.PI * 2, Math.PI - half, half)),
    new THREE.LineBasicMaterial({ color: '#6c7a89', transparent: true, opacity: 0.35 }));
  grid.rotation.x = Math.PI / 2;
  grid.position.z = Rc;
  root.add(cap, grid);
  ctx.pickable(cap, 'dish');
  // the 300 m patch in use
  const act = Math.asin(150 / 300);
  const patch = new THREE.Mesh(new THREE.SphereGeometry(Rc * 0.995, 64, 12, 0, Math.PI * 2, Math.PI - act, act), new THREE.MeshBasicMaterial({ color: '#ffd43b', transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }));
  patch.rotation.x = Math.PI / 2;
  patch.position.z = Rc;
  root.add(patch);
  // karst hills around
  const ground = new THREE.Mesh(new THREE.RingGeometry(250 * k, 900 * k, 96, 1), new THREE.MeshStandardMaterial({ color: '#3d5a32', roughness: 1, side: THREE.DoubleSide }));
  ground.position.z = rimZ;
  root.add(ground);
  const hillM = new THREE.MeshStandardMaterial({ color: '#4f7a3e', roughness: 1, flatShading: true });
  for (let i = 0; i < (ctx.low ? 9 : 16); i++) {
    const a = (i / (ctx.low ? 9 : 16)) * Math.PI * 2 + 0.3 * Math.sin(i * 7), r = 380 * k + 200 * k * ((i * 37) % 10) / 10, hh = (90 + 70 * ((i * 53) % 7) / 7) * k;
    const h = new THREE.Mesh(new THREE.ConeGeometry(110 * k, hh, 7), hillM);
    h.rotation.x = Math.PI / 2;
    h.position.set(r * Math.cos(a), r * Math.sin(a), rimZ + hh / 2);
    root.add(h);
  }
  // six towers, cables and the 30-tonne feed cabin about 140 m above the dish
  const cabinZ = 0.4611 * 300 * k;
  const cabin = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.25, 24), new THREE.MeshStandardMaterial({ color: '#f1f3f5', metalness: 0.4, roughness: 0.4 }));
  cabin.rotation.x = Math.PI / 2;
  cabin.position.z = cabinZ;
  root.add(cabin);
  ctx.pickable(cabin, 'cabin');
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.25, r = 280 * k, top = rimZ + 150 * k;
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, top - rimZ + 0.4, 8), new THREE.MeshStandardMaterial({ color: '#adb5bd' }));
    t.rotation.x = Math.PI / 2;
    t.position.set(r * Math.cos(a), r * Math.sin(a), (top + rimZ - 0.4) / 2);
    root.add(t, line([[r * Math.cos(a), r * Math.sin(a), top], [0.28 * Math.cos(a), 0.28 * Math.sin(a), cabinZ + 0.1]], '#dee2e6', { opacity: 0.7 }));
  }
  // radio waves from a distant source come in parallel and reflect to the cabin
  const rays: THREE.Line[] = [];
  for (let i = -3; i <= 3; i++) {
    const x = (i / 3) * 140 * k, zS = Rc - Math.sqrt(Rc * Rc - x * x);
    rays.push(onTop(line([[x, 0, 9], [x, 0, zS], [0, 0, cabinZ]], '#ff8787', { opacity: 0.85 }), 4));
  }
  root.add(...rays);
  for (const x of [-2, 0, 2]) root.add(new Arrow('#ff8787', 0.04).set([x * 1.2, 0, 10.2], [0, 0, -1]));
  ctx.label(new THREE.Vector3(0, 0, 10.6), ['radio waves from deep space', '来自宇宙深处的射电波'], { c: '#ff8787', big: true });
  ctx.label(cabin, ['feed cabin (receiver)', '馈源舱（接收机）'], { c: C.white, dx: 80, dy: -8 });
  ctx.label(new THREE.Vector3(-250 * k, 0, rimZ), ['500 m across', '口径 500 米'], { c: C.gold, big: true, dx: -40 });
  ctx.label(new THREE.Vector3(120 * k, -60 * k, 0.6), ['300 m patch pulled into a paraboloid', '300 米区域被拉成抛物面'], { c: '#ffd43b', dx: 40, dy: 40 });
  ctx.label(new THREE.Vector3(-560 * k, 300 * k, rimZ + 2), ['karst hollow, Pingtang, Guizhou', '贵州平塘的喀斯特洼地'], { c: '#b2f2bb' });
  root.add(line([[-250 * k, 0, rimZ + 0.05], [250 * k, 0, rimZ + 0.05]], C.gold, { opacity: 0.7, dashed: true, dash: 0.2 }));
  ctx.view([0.55, -1, 0.62], 30, [0, 0, 3.2], true);
  let t = 0;
  return {
    update(_v, dt) {
      t += dt;
      // the cabin and patch follow a source drifting across the sky
      const off = Math.sin(t * 0.25) * 0.6;
      cabin.position.x = off * 1.2;
      patch.rotation.y = off * 0.25;
      rays.forEach(r => { const a = r.geometry.getAttribute('position') as THREE.BufferAttribute; a.setX(2, cabin.position.x); a.needsUpdate = true; });
    },
    readout() { return ['500 m · 4,450 panels', '口径 500 米 · 4450 块面板']; },
  };
}
