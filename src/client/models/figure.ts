import * as THREE from 'three';
import { box, cyl, ellip, lathe, mat, shade, tube, add, g, type V3 } from './prims.ts';

/**
 * Shared "collectible figurine" for the famous-people packs: a stylised standing person (about 5 heads tall) built from
 * smooth lathes and tubes so every hero reads as one consistent toy line. Builders add their own props, scenery and base;
 * the returned anchors (hands, head) let them attach books, telescopes, brushes, flags...
 */
export type Outfit = 'robe' | 'dress' | 'coat' | 'suit' | 'tunic';
export type HairStyle = 'short' | 'long' | 'bun' | 'topknot' | 'bald' | 'curly' | 'wig' | 'bob' | 'braid' | 'wild';
export type Beard = 'none' | 'short' | 'long' | 'goatee' | 'moustache' | 'full';
export type Hat = 'none' | 'scholar' | 'futou' | 'tophat' | 'beret' | 'cap' | 'crown' | 'turban' | 'helmet' | 'bicorne' | 'wreath';

/** Arm pose in radians: `fwd` raises the arm forward, `side` lifts it outward, `bend` folds the elbow forward, `inward` brings the hand to the middle. */
export interface ArmPose { fwd?: number; side?: number; bend?: number; inward?: number }

export interface FigureOpts {
  /** total height incl. hair/hat, default 0.62 */
  h?: number;
  x?: number; y?: number; z?: number;
  /** facing (radians about Y), default 0 = +z */
  ry?: number;
  skin?: string;
  hair?: string;
  hairStyle?: HairStyle;
  beard?: Beard;
  beardColor?: string;
  outfit?: Outfit;
  /** main garment colour (robe / coat / jacket / dress) */
  top: string;
  /** trousers / under-skirt colour */
  bottom?: string;
  /** belt, sash, collar trim */
  accent?: string;
  /** shirt / inner collar colour (suit, coat) */
  shirt?: string;
  shoes?: string;
  /** wide hanging sleeves (Chinese / Japanese robes, academic gowns) */
  wideSleeves?: boolean;
  /** cape over the shoulders */
  cape?: string;
  hat?: Hat;
  hatColor?: string;
  glasses?: boolean;
  armL?: ArmPose;
  armR?: ArmPose;
  /** slight body lean forward (radians) */
  lean?: number;
}

export interface FigureAnchors {
  group: THREE.Group;
  /** wrist/hand centres in the builder's space (already offset by x/y/z and rotated by ry) */
  handL: V3;
  handR: V3;
  head: V3;
  headR: number;
  /** top of head (before hat) */
  top: V3;
  /** figure-local scale unit (= h) */
  u: number;
}

const SKIN = '#e9b993';

function armPath(sgn: number, P: ArmPose, sh: V3, up: number, lo: number): { elbow: V3; wrist: V3 } {
  const f = P.fwd ?? 0.12, s = P.side ?? 0.12, b = P.bend ?? 0.25, inw = P.inward ?? 0;
  const d1 = new THREE.Vector3(sgn * Math.sin(s) * Math.cos(f), -Math.cos(s) * Math.cos(f), Math.sin(f)).normalize();
  const fb = f + b;
  const d2 = new THREE.Vector3(sgn * Math.sin(s) * Math.cos(fb) - sgn * inw, -Math.cos(s) * Math.cos(fb), Math.sin(fb)).normalize();
  const e = new THREE.Vector3(...sh).addScaledVector(d1, up);
  const w = e.clone().addScaledVector(d2, lo);
  return { elbow: [e.x, e.y, e.z], wrist: [w.x, w.y, w.z] };
}

/** Builds a figurine into `p` (feet at y, facing +z unless ry). Returns anchors for props. */
export function figure(p: THREE.Object3D, o: FigureOpts): FigureAnchors {
  const H = o.h ?? 0.62, u = H / 1.0;
  const fig = new THREE.Group();
  fig.position.set(o.x ?? 0, o.y ?? 0, o.z ?? 0);
  fig.rotation.y = o.ry ?? 0;
  p.add(fig);
  const body = new THREE.Group();
  body.rotation.x = o.lean ?? 0;
  fig.add(body);

  const skin = o.skin ?? SKIN, hair = o.hair ?? '#3b2a20', outfit = o.outfit ?? 'tunic';
  const top = o.top, bottom = o.bottom ?? shade(top, -0.25), accent = o.accent ?? shade(top, 0.25);
  const shoes = o.shoes ?? '#2b211b', shirt = o.shirt ?? '#f1ece0';
  const S = (pts: [number, number][]) => pts.map(([r, y]) => [r * u, y * u] as [number, number]);
  const flat = (m: THREE.Mesh, k = 0.74) => { m.scale.z = k; return m; };

  // ---- lower body
  const long = outfit === 'robe' || outfit === 'dress';
  if (long) {
    // floor-length garment with a gentle flare and hem
    flat(lathe(body, S([[0, 0.012], [0.185, 0.012], [0.192, 0.03], [0.17, 0.14], [0.145, 0.3], [0.124, 0.44], [0.12, 0.5], [0, 0.5]]), top, 0, 0, 0, 22), 0.8);
    flat(lathe(body, S([[0.188, 0.012], [0.196, 0.012], [0.196, 0.036], [0.188, 0.036]]), accent, 0, 0, 0, 20), 0.8);
    // toes peeking out
    for (const sx of [-1, 1]) ellip(body, shoes, sx * 0.045 * u, 0.018 * u, 0.12 * u, 0.034 * u, 0.02 * u, 0.05 * u);
  } else {
    for (const sx of [-1, 1]) {
      tube(body, [[sx * 0.052 * u, 0.47 * u, 0], [sx * 0.055 * u, 0.26 * u, 0.006 * u], [sx * 0.056 * u, 0.06 * u, 0]], 0.05 * u, 0.04 * u, bottom, { radial: 10, sub: 4 });
      ellip(body, shoes, sx * 0.057 * u, 0.03 * u, 0.025 * u, 0.042 * u, 0.032 * u, 0.072 * u);
      ellip(body, shade(shoes, -0.2), sx * 0.057 * u, 0.008 * u, 0.025 * u, 0.044 * u, 0.01 * u, 0.074 * u);
    }
    if (outfit === 'coat') {
      // knee-length coat skirt
      flat(lathe(body, S([[0.145, 0.24], [0.152, 0.24], [0.136, 0.36], [0.12, 0.5], [0, 0.5]]), top, 0, 0, 0, 18), 0.78);
    } else if (outfit === 'tunic') {
      flat(lathe(body, S([[0.132, 0.34], [0.14, 0.34], [0.126, 0.42], [0.118, 0.5], [0, 0.5]]), top, 0, 0, 0, 18), 0.78);
    } else {
      // suit: hips
      flat(lathe(body, S([[0, 0.44], [0.112, 0.44], [0.118, 0.5], [0, 0.5]]), bottom, 0, 0, 0, 16), 0.74);
    }
  }

  // ---- torso
  const torsoC = top;
  flat(lathe(body, S([[0, 0.48], [0.118, 0.48], [0.112, 0.56], [0.118, 0.64], [0.134, 0.71], [0.128, 0.75], [0.08, 0.78], [0, 0.785]]), torsoC, 0, 0, 0, 18), 0.7);
  // belt / sash
  flat(lathe(body, S([[0.117, 0.505], [0.121, 0.505], [0.121, 0.54], [0.117, 0.54]]), accent, 0, 0, 0, 18), 0.72);
  // collar details
  const fz = 0.094 * u;
  if (outfit === 'suit' || outfit === 'coat') {
    box(body, shirt, 0, 0.74 * u, fz, 0.06 * u, 0.07 * u, 0.006 * u);
    if (outfit === 'suit') box(body, accent, 0, 0.69 * u, fz + 0.003 * u, 0.018 * u, 0.09 * u, 0.006 * u);
    for (const sx of [-1, 1]) box(body, shade(top, -0.18), sx * 0.034 * u, 0.715 * u, fz + 0.002 * u, 0.026 * u, 0.11 * u, 0.006 * u, 0, 0, sx * 0.32);
    if (outfit === 'coat') for (let i = 0; i < 4; i++) ellip(body, '#d6b25e', 0.022 * u, (0.6 - i * 0.05) * u, fz + 0.006 * u, 0.007 * u);
  } else if (outfit === 'robe') {
    // crossed collar (交领) in the trim colour
    box(body, accent, -0.018 * u, 0.715 * u, fz, 0.016 * u, 0.13 * u, 0.008 * u, 0, 0, 0.42);
    box(body, accent, 0.022 * u, 0.735 * u, fz - 0.002 * u, 0.016 * u, 0.09 * u, 0.008 * u, 0, 0, -0.42);
  } else {
    box(body, accent, 0, 0.775 * u, fz - 0.01 * u, 0.07 * u, 0.012 * u, 0.012 * u);
  }
  if (o.cape) {
    flat(lathe(body, S([[0.16, 0.2], [0.17, 0.2], [0.15, 0.45], [0.13, 0.7], [0.105, 0.79], [0, 0.8]]), o.cape, 0, -0.012 * u, -0.022 * u, 16), 0.7).scale.z = 0.62;
  }

  // ---- arms
  const shY = 0.735 * u, shX = 0.135 * u;
  const anchors: Partial<FigureAnchors> = {};
  for (const sgn of [-1, 1] as const) {
    const pose = (sgn < 0 ? o.armL : o.armR) ?? {};
    const sh: V3 = [sgn * shX, shY, 0];
    const { elbow, wrist } = armPath(sgn, pose, sh, 0.17 * u, 0.155 * u);
    ellip(body, top, sh[0], sh[1], sh[2], 0.05 * u, 0.047 * u, 0.047 * u);
    tube(body, [sh, elbow], 0.043 * u, 0.039 * u, top, { radial: 9, sub: 3 });
    if (o.wideSleeves) {
      // hanging sleeve: forearm tube that flares toward the cuff plus a drooping fold
      tube(body, [elbow, wrist], 0.044 * u, 0.066 * u, top, { radial: 10, sub: 3 });
      ellip(body, accent, wrist[0], wrist[1], wrist[2], 0.058 * u, 0.058 * u, 0.04 * u);
      ellip(body, top, wrist[0], wrist[1] - 0.05 * u, wrist[2] - 0.01 * u, 0.04 * u, 0.06 * u, 0.03 * u);
    } else {
      tube(body, [elbow, wrist], 0.039 * u, 0.034 * u, top, { radial: 9, sub: 3 });
      ellip(body, outfit === 'suit' || outfit === 'coat' ? shirt : shade(top, -0.12), wrist[0], wrist[1], wrist[2], 0.033 * u, 0.016 * u, 0.033 * u);
    }
    // hand slightly past the wrist along the forearm
    const dir = new THREE.Vector3(wrist[0] - elbow[0], wrist[1] - elbow[1], wrist[2] - elbow[2]).normalize();
    const hand: V3 = [wrist[0] + dir.x * 0.03 * u, wrist[1] + dir.y * 0.03 * u, wrist[2] + dir.z * 0.03 * u];
    ellip(body, skin, hand[0], hand[1], hand[2], 0.032 * u, 0.038 * u, 0.028 * u);
    if (sgn < 0) anchors.handL = hand; else anchors.handR = hand;
  }

  // ---- neck & head
  cyl(body, skin, 0, 0.775 * u, 0, 0.04 * u, 0.05 * u, 10);
  const hy = 0.9 * u, hr = 0.112 * u;
  ellip(body, skin, 0, hy, 0.004 * u, hr, hr * 1.12, hr * 1.02);
  ellip(body, skin, 0, hy - 0.05 * u, 0.025 * u, hr * 0.62, hr * 0.42, hr * 0.7); // jaw
  for (const sx of [-1, 1]) ellip(body, shade(skin, -0.06), sx * hr * 0.98, hy, 0, hr * 0.16, hr * 0.26, hr * 0.12); // ears
  for (const sx of [-1, 1]) {
    ellip(body, '#1c1917', sx * hr * 0.34, hy + hr * 0.04, hr * 0.93, hr * 0.095, hr * 0.13, hr * 0.06);
    ellip(body, '#ffffff', sx * hr * 0.34 + hr * 0.03, hy + hr * 0.09, hr * 0.97, hr * 0.03, hr * 0.03, hr * 0.02);
    box(body, shade(hair, -0.1), sx * hr * 0.34, hy + hr * 0.3, hr * 0.92, hr * 0.3, hr * 0.055, hr * 0.06, 0, 0, sx * -0.12);
    ellip(body, mix2(skin, '#f87171'), sx * hr * 0.58, hy - hr * 0.2, hr * 0.8, hr * 0.15, hr * 0.1, hr * 0.05); // cheeks
  }
  box(body, '#b4574a', 0, hy - hr * 0.36, hr * 0.93, hr * 0.26, hr * 0.045, hr * 0.05);
  if (o.glasses) {
    for (const sx of [-1, 1]) {
      const m = add(body, g('fig-ring', () => new THREE.TorusGeometry(1, 0.16, 6, 14)), mat('#3f3f46', { metal: 0.6 }), sx * hr * 0.34, hy + hr * 0.04, hr * 0.98, hr * 0.2, hr * 0.17, hr * 0.17);
      m.castShadow = false;
    }
    box(body, '#3f3f46', 0, hy + hr * 0.07, hr * 0.99, hr * 0.16, hr * 0.03, hr * 0.03);
  }
  hairFor(body, o.hairStyle ?? 'short', hair, hy, hr, u);
  beardFor(body, o.beard ?? 'none', o.beardColor ?? hair, hy, hr, u);
  const topY = hy + hr * 1.12;
  hatFor(body, o.hat ?? 'none', o.hatColor ?? '#1f2937', hy, hr, u);

  // anchors to builder space
  const toWorld = (v: V3): V3 => {
    const w = new THREE.Vector3(...v).applyEuler(body.rotation).applyEuler(fig.rotation).add(fig.position);
    return [w.x, w.y, w.z];
  };
  return {
    group: fig, handL: toWorld(anchors.handL!), handR: toWorld(anchors.handR!), head: toWorld([0, hy, 0]), headR: hr,
    top: toWorld([0, topY, 0]), u,
  };
}

const mix2 = (a: string, b: string) => {
  const ca = new THREE.Color(a), cb = new THREE.Color(b);
  return '#' + ca.lerp(cb, 0.28).getHexString();
};

function hairFor(p: THREE.Object3D, s: HairStyle, c: string, hy: number, hr: number, u: number): void {
  if (s === 'bald') { ellip(p, c, 0, hy - hr * 0.1, -hr * 0.3, hr * 1.02, hr * 0.6, hr * 0.8); return; }
  // skull cap shared by most styles (pushed back so the face stays visible)
  ellip(p, c, 0, hy + hr * 0.22, -hr * 0.1, hr * 1.06, hr * 0.98, hr * 1.04);
  ellip(p, shade(c, 0.08), 0, hy + hr * 0.62, hr * 0.38, hr * 0.78, hr * 0.32, hr * 0.5); // fringe line
  switch (s) {
    case 'long':
      ellip(p, c, 0, hy - hr * 0.7, -hr * 0.55, hr * 1.0, hr * 1.5, hr * 0.5);
      for (const sx of [-1, 1]) ellip(p, c, sx * hr * 0.92, hy - hr * 0.5, -hr * 0.05, hr * 0.26, hr * 1.1, hr * 0.5);
      break;
    case 'bob':
      ellip(p, c, 0, hy - hr * 0.2, -hr * 0.2, hr * 1.14, hr * 0.95, hr * 1.0);
      break;
    case 'bun':
      ellip(p, c, 0, hy + hr * 0.5, -hr * 1.05, hr * 0.42, hr * 0.42, hr * 0.38);
      break;
    case 'topknot':
      ellip(p, c, 0, hy + hr * 1.18, -hr * 0.1, hr * 0.32, hr * 0.32, hr * 0.32);
      box(p, '#d6b25e', 0, hy + hr * 1.2, -hr * 0.1, hr * 1.0, hr * 0.06, hr * 0.06);
      break;
    case 'braid':
      ellip(p, c, 0, hy - hr * 0.1, -hr * 0.7, hr * 0.5, hr * 0.7, hr * 0.4);
      tube(p, [[0, hy - hr * 0.4, -hr * 0.95], [0, hy - hr * 1.6, -hr * 1.15], [0, hy - hr * 2.8, -hr * 1.05]], hr * 0.18, hr * 0.12, c, { radial: 8, sub: 3 });
      break;
    case 'curly':
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2, rr = hr * 0.98;
        ellip(p, shade(c, (i % 3) * 0.05), Math.cos(a) * rr * 0.9, hy + hr * 0.35 + Math.sin(i * 2.1) * hr * 0.15, Math.sin(a) * rr * 0.75 - hr * 0.15, hr * 0.3);
      }
      break;
    case 'wig':
      // 18th-century powdered wig: side rolls + ribbon-tied tail
      for (const sx of [-1, 1]) for (let k = 0; k < 2; k++)
        add(p, g('fig-roll', () => new THREE.CylinderGeometry(1, 1, 1, 12)), mat(c), sx * hr * 0.98, hy - hr * (0.05 + k * 0.32), -hr * 0.1, hr * 0.17, hr * 0.5, hr * 0.17, 0, Math.PI / 2, 0);
      ellip(p, c, 0, hy - hr * 0.5, -hr * 0.95, hr * 0.3, hr * 0.5, hr * 0.3);
      box(p, '#1f2937', 0, hy - hr * 0.2, -hr * 1.08, hr * 0.5, hr * 0.14, hr * 0.12);
      break;
    case 'wild':
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        ellip(p, shade(c, (i % 4) * 0.04), Math.cos(a) * hr * 1.05, hy + hr * 0.25 + Math.sin(i * 1.7) * hr * 0.25, Math.sin(a) * hr * 0.85 - hr * 0.2, hr * 0.34, hr * 0.28, hr * 0.3);
      }
      break;
    default:
      for (const sx of [-1, 1]) ellip(p, c, sx * hr * 0.88, hy + hr * 0.05, -hr * 0.1, hr * 0.22, hr * 0.5, hr * 0.6);
  }
}

function beardFor(p: THREE.Object3D, s: Beard, c: string, hy: number, hr: number, u: number): void {
  if (s === 'none') return;
  if (s === 'moustache' || s === 'goatee' || s === 'full' || s === 'long')
    for (const sx of [-1, 1]) ellip(p, c, sx * hr * 0.2, hy - hr * 0.3, hr * 0.95, hr * 0.26, hr * 0.08, hr * 0.1, 0, 0, sx * -0.3);
  if (s === 'goatee') ellip(p, c, 0, hy - hr * 0.72, hr * 0.62, hr * 0.2, hr * 0.28, hr * 0.18);
  if (s === 'short' || s === 'full') ellip(p, c, 0, hy - hr * 0.5, hr * 0.38, hr * 0.82, hr * 0.62, hr * 0.62);
  if (s === 'full') ellip(p, c, 0, hy - hr * 0.95, hr * 0.42, hr * 0.55, hr * 0.5, hr * 0.42);
  if (s === 'long') {
    ellip(p, c, 0, hy - hr * 0.55, hr * 0.42, hr * 0.78, hr * 0.55, hr * 0.55);
    tube(p, [[0, hy - hr * 0.7, hr * 0.7], [0, hy - hr * 1.4, hr * 0.85], [0, hy - hr * 2.1, hr * 0.78]], hr * 0.4, hr * 0.08, c, { radial: 10, sub: 4 });
  }
  void u;
}

function hatFor(p: THREE.Object3D, s: Hat, c: string, hy: number, hr: number, u: number): void {
  const ty = hy + hr * 0.95;
  switch (s) {
    case 'scholar': // small square cap with a hairpin (ancient Chinese scholar)
      box(p, c, 0, ty + hr * 0.25, -hr * 0.05, hr * 0.7, hr * 0.5, hr * 0.8);
      box(p, '#d6b25e', 0, ty + hr * 0.25, -hr * 0.05, hr * 1.5, hr * 0.06, hr * 0.06);
      break;
    case 'futou': // Tang/Song soft hat with two side wings
      ellip(p, c, 0, ty + hr * 0.15, -hr * 0.12, hr * 0.9, hr * 0.6, hr * 0.9);
      ellip(p, c, 0, ty + hr * 0.5, -hr * 0.3, hr * 0.5, hr * 0.45, hr * 0.5);
      for (const sx of [-1, 1]) box(p, c, sx * hr * 1.6, ty + hr * 0.05, -hr * 0.4, hr * 1.4, hr * 0.12, hr * 0.03);
      break;
    case 'tophat':
      cyl(p, c, 0, ty - hr * 0.05, 0, hr * 1.35, hr * 0.06, 20);
      cyl(p, c, 0, ty + hr * 0.6, 0, hr * 0.82, hr * 1.3, 20);
      cyl(p, '#7f1d1d', 0, ty + hr * 0.12, 0, hr * 0.84, hr * 0.18, 20);
      break;
    case 'beret':
      ellip(p, c, hr * 0.15, ty + hr * 0.05, 0, hr * 1.12, hr * 0.32, hr * 1.05, 0, 0, -0.15);
      break;
    case 'cap':
      ellip(p, c, 0, ty - hr * 0.05, -hr * 0.05, hr * 1.04, hr * 0.6, hr * 1.04);
      box(p, shade(c, -0.15), 0, ty - hr * 0.25, hr * 0.95, hr * 1.1, hr * 0.06, hr * 0.6);
      break;
    case 'crown':
      cyl(p, '#e0b23c', 0, ty + hr * 0.1, 0, hr * 0.9, hr * 0.4, 16);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ellip(p, i % 2 ? '#dc2626' : '#e0b23c', Math.cos(a) * hr * 0.9, ty + hr * 0.42, Math.sin(a) * hr * 0.9, hr * 0.12);
      }
      break;
    case 'turban':
      ellip(p, c, 0, ty - hr * 0.05, -hr * 0.05, hr * 1.12, hr * 0.62, hr * 1.1);
      ellip(p, shade(c, 0.1), 0, ty + hr * 0.25, -hr * 0.1, hr * 0.85, hr * 0.42, hr * 0.85);
      ellip(p, '#e0b23c', 0, ty + hr * 0.05, hr * 1.0, hr * 0.14);
      break;
    case 'helmet':
      ellip(p, c, 0, ty - hr * 0.15, -hr * 0.05, hr * 1.12, hr * 0.85, hr * 1.12);
      cyl(p, shade(c, -0.15), 0, ty - hr * 0.55, 0, hr * 1.2, hr * 0.08, 20);
      break;
    case 'bicorne':
      ellip(p, c, 0, ty + hr * 0.2, -hr * 0.05, hr * 1.7, hr * 0.62, hr * 0.42);
      ellip(p, '#dc2626', hr * 0.4, ty + hr * 0.45, hr * 0.25, hr * 0.16);
      break;
    case 'wreath':
      for (let i = 0; i < 14; i++) {
        const a = Math.PI * 0.15 + (i / 13) * Math.PI * 0.7 + Math.PI;
        ellip(p, i % 2 ? '#65a30d' : '#4d7c0f', Math.cos(a) * hr * 1.0, ty - hr * 0.25, Math.sin(-a) * hr * -1.0, hr * 0.2, hr * 0.1, hr * 0.12, a);
      }
      break;
    default:
  }
  void u;
}

/** Round collectible base: bevelled disc with a lighter top and a thin rim. Returns the top height. */
export function figureBase(p: THREE.Object3D, top = '#d8cbb3', side = '#8b7355', R = 0.46): number {
  lathe(p, [[0, 0], [R, 0], [R + 0.01, 0.012], [R + 0.01, 0.05], [R, 0.062], [0, 0.062]], side, 0, 0, 0, 40);
  lathe(p, [[0, 0.06], [R - 0.012, 0.06], [R - 0.012, 0.07], [0, 0.07]], top, 0, 0, 0, 40);
  return 0.07;
}
