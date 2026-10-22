/**
 * Kit "tides": the Earth seen from above the North Pole with an exaggerated ocean shell, two bulges facing toward and
 * away from the Moon. Why there are two (differential pull arrows), the two high tides a day at one coast, and spring
 * and neap tides when the Sun's bulge adds to or works against the Moon's. Not to scale: distances and bulges are
 * exaggerated.
 */
import * as THREE from 'three';
import { Arrow, D2R, body, circlePts, dirLight, fade, line, ramp, setLine, starfield } from './draw.ts';
import type { KitFactory, Pair, V3 } from './types.ts';

export interface Opts {
  /**
   * - `why`: the Moon's pull on the near side, centre and far side, then what is left over (tidal arrows), then the bulges
   * - `daily`: the Earth turns under the bulges (clock in hours); a coastal town shows high and low tide
   * - `springneap`: a lunar month (clock in days): the Sun's bulge lines up with the Moon's (spring tides) or crosses it (neap)
   */
  mode: 'why' | 'daily' | 'springneap';
  /** `daily`: the town (default Shanghai) */
  place?: { name: Pair; lat: number; lon: number };
}

const C = { gold: '#ffd24a', ice: '#a5d8ff', teal: '#3bc9db', white: '#f1f3f5', orange: '#ff922b', blue: '#4dabf7', dim: '#9aa7b4' };
/** Earth turns 15.04°/h against the stars; the Moon goes round in 27.32 days; the Sun–Moon (synodic) month is 29.53 days. */
const SPIN = 15.041, MOON_H = 360 / (27.32 * 24), SYN = 29.53;
const DM = 5.5, RM = 0.2727, A = 0.2;

/** Unit point on the Earth (lat/lon) in the Earth group's frame (lon 0 at +x, north +z). */
const geo = (lat: number, lon: number, r = 1) => new THREE.Vector3(Math.cos(lat * D2R) * Math.cos(lon * D2R), Math.cos(lat * D2R) * Math.sin(lon * D2R), Math.sin(lat * D2R)).multiplyScalar(r);

function arrow(c: string, thick = 0.035): Arrow {
  const a = new Arrow(c, thick);
  a.traverse(x => { const m = (x as THREE.Mesh).material as THREE.Material | undefined; if (m) m.depthTest = false; x.renderOrder = 8; });
  return a;
}
/** An ellipse outline in the equatorial plane: semi-axes a (along angle `rot`) and b. */
function ellPts(a: number, b: number, rot: number, out: THREE.Vector3[]): THREE.Vector3[] {
  const c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < out.length; i++) { const t = (i / (out.length - 1)) * Math.PI * 2, x = a * Math.cos(t), y = b * Math.sin(t); out[i].set(x * c - y * s, x * s + y * c, 0.002); }
  return out;
}

const kit: KitFactory<Opts> = (ctx, o) => {
  const root = ctx.root;
  root.add(starfield(ctx.low ? 1200 : 2500));
  // the Sun is far off along +x
  root.add(dirLight([1, 0, 0.05], 2.5, 0.2));

  const earthG = new THREE.Group(), earth = body('earth', 1, '#4a78b8');
  earthG.add(earth);
  const moon = body('moon', RM, '#9a9a9a');
  const orbit = line(circlePts(DM, 160), C.white, { opacity: 0.18 });
  root.add(earthG, moon, orbit);
  ctx.pickable(earth, 'earth'); ctx.pickable(moon, 'moon');

  // the ocean shell: an ellipsoid stretched along the Earth–Moon line (bulges far beyond the real ~0.5 m)
  const water = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 36), new THREE.MeshPhongMaterial({
    color: '#4dabf7', emissive: '#0b3d6e', specular: '#ffffff', shininess: 60, transparent: true, opacity: 0.62, depthWrite: false,
  }));
  water.renderOrder = 2;
  const outline = line(Array.from({ length: 129 }, () => new THREE.Vector3()), C.ice, { opacity: 0.85 });
  const shell = new THREE.Group();
  shell.add(water);
  root.add(shell, outline);
  const nearTip = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  const farTip = nearTip.clone();
  root.add(nearTip, farTip);
  ctx.pickable(nearTip, 'near-bulge'); ctx.pickable(farTip, 'far-bulge');
  const pts = Array.from({ length: 129 }, () => new THREE.Vector3());
  /** Point the bulges along `rot` (rad) with stretch `a`. */
  const bulge = (rot: number, a: number) => {
    shell.rotation.z = rot;
    water.scale.set(1 + a, 1 - a * 0.45, 1 - a * 0.45);
    setLine(outline, ellPts(1 + a, 1 - a * 0.45, rot, pts));
    nearTip.position.set(Math.cos(rot), Math.sin(rot), 0).multiplyScalar(1 + a);
    farTip.position.copy(nearTip.position).negate();
  };
  const upd: ((v: number, el: number) => void)[] = [];
  let readout: ((v: number) => Pair) | undefined;
  const view = (d: number, t: V3 = [0, 0, 0]) => ctx.view([0, -0.32, 1], d, t, true);

  if (o.mode === 'why') {
    moon.position.set(DM, 0, 0);
    earthG.rotation.z = 200 * D2R;
    const pull = [arrow(C.gold), arrow(C.gold), arrow(C.gold)];
    const tidal = [arrow(C.teal, 0.045), arrow(C.teal, 0.045), arrow(C.teal, 0.03), arrow(C.teal, 0.03)];
    root.add(...pull, ...tidal);
    // pull ∝ 1/d² (exaggerated by the short distance); what is left after the average (centre) pull
    const P: [V3, number][] = [[[1, 0, 0], 1.55], [[0, 0, 0], 1.0], [[-1, 0, 0], 0.66]];
    const T: [V3, V3][] = [[[1, 0, 0], [0.62, 0, 0]], [[-1, 0, 0], [-0.62, 0, 0]], [[0, 1, 0], [0, -0.3, 0]], [[0, -1, 0], [0, 0.3, 0]]];
    const l1 = ctx.label(new THREE.Vector3(1.9, 0.35, 0), ['Strongest pull (nearest)', '引力最大（离月球最近）'], { c: C.gold, t: 0.8 });
    const l2 = ctx.label(new THREE.Vector3(-0.7, 0.42, 0), ['Weakest pull (farthest)', '引力最小（离月球最远）'], { c: C.gold, t: 1.8 });
    ctx.label(moon, ['Moon', '月球'], { c: C.white, dy: -22 });
    const l3 = ctx.label(new THREE.Vector3(-2.1, -0.05, 0), ['Left behind: far bulge', '被“甩在后面”：背月一侧隆起'], { c: C.teal, t: 4.2 });
    const l4 = ctx.label(new THREE.Vector3(2.15, -0.25, 0), ['Pulled ahead: near bulge', '被拉得更多：向月一侧隆起'], { c: C.teal, t: 4.6 });
    view(9, [1.6, 0, 0]);
    upd.push((_v, el) => {
      const a1 = ramp(el, 0.5, 1.2), a2 = ramp(el, 3.8, 1.2), a3 = ramp(el, 6.2, 1.6);
      pull.forEach((p, i) => { p.set(P[i][0], [P[i][1] * ramp(el, 0.5 + i * 0.5, 1), 0, 0]); p.opacity = 1 - 0.75 * a2; p.visible = p.visible && a1 > 0; });
      tidal.forEach((p, i) => { p.set(T[i][0], new THREE.Vector3(...T[i][1]).multiplyScalar(Math.max(a2, 0.001))); p.visible = a2 > 0.01; });
      l1.on = l2.on = a2 < 0.6;
      l3.on = l4.on = a2 > 0.3;
      bulge(0, A * a3);
      fade(shell, a3); fade(outline, a3);
      earthG.rotation.z = 200 * D2R + el * 0.03;
    });
  } else if (o.mode === 'daily') {
    const pl = o.place ?? { name: ['Shanghai', '上海'] as Pair, lat: 31.2, lon: 121.5 };
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshBasicMaterial({ color: C.gold, depthTest: false }));
    dot.renderOrder = 9;
    dot.position.copy(geo(pl.lat, pl.lon, 1.01));
    earthG.add(dot);
    const pL = ctx.label(dot, pl.name, { c: C.gold, big: true, dx: 0, dy: -22 });
    ctx.label(moon, ['Moon', '月球'], { c: C.white, dy: -22 });
    const hiA = ctx.label(new THREE.Vector3(), ['High tide', '高潮'], { c: C.ice, t: 0.8 });
    const hiB = ctx.label(new THREE.Vector3(), ['High tide', '高潮'], { c: C.ice, t: 0.8 });
    view(13.5);
    // Shanghai faces the Moon at the start
    const m0 = 20, s0 = m0 - pl.lon - 25;
    let h = 0, rising = true;
    upd.push(v => {
      const th = (m0 + MOON_H * v) * D2R, sp = (s0 + SPIN * v) * D2R;
      moon.position.set(Math.cos(th) * DM, Math.sin(th) * DM, 0);
      earthG.rotation.z = sp;
      bulge(th, A);
      hiA.pos.set(Math.cos(th), Math.sin(th), 0).multiplyScalar(1 + A + 0.32);
      hiB.pos.copy(hiA.pos).negate();
      const rel = sp + pl.lon * D2R - th;
      h = Math.cos(2 * rel);
      rising = Math.sin(2 * rel) > 0;
      pL.set(h > 0.85 ? [`${pl.name[0]}: high tide`, `${pl.name[1]}：高潮`] : h < -0.85 ? [`${pl.name[0]}: low tide`, `${pl.name[1]}：低潮`] : rising ? [`${pl.name[0]}: rising`, `${pl.name[1]}：涨潮`] : [`${pl.name[0]}: falling`, `${pl.name[1]}：落潮`]);
    });
    readout = () => {
      const m = h.toFixed(1);
      return [`water ${h >= 0 ? '+' : ''}${m} m`, `水位 ${h >= 0 ? '+' : ''}${m} 米`];
    };
  } else {
    const sunA = [arrow(C.gold, 0.03), arrow(C.gold, 0.03), arrow(C.gold, 0.03)];
    sunA.forEach((a, i) => a.set([9.5, (i - 1) * 2.2, 0], [-1.6, 0, 0]));
    root.add(...sunA);
    ctx.label(new THREE.Vector3(9.2, 3.2, 0), ['To the Sun →', '太阳方向 →'], { c: C.gold });
    ctx.label(moon, ['Moon', '月球'], { c: C.white, dy: -22 });
    const mPts = Array.from({ length: 129 }, () => new THREE.Vector3()), sPts = Array.from({ length: 129 }, () => new THREE.Vector3());
    const mOut = line(mPts, C.blue, { opacity: 0.55, dashed: true, dash: 0.08 }), sOut = line(sPts, C.orange, { opacity: 0.7, dashed: true, dash: 0.08 });
    root.add(mOut, sOut);
    const lab = ctx.label(new THREE.Vector3(0, -2.2, 0), ['', ''], { c: C.ice, big: true });
    const sunBulge = 0.46;
    view(15.5, [2, 0, 0]);
    let amp = 1, phase = 0;
    upd.push((v, el) => {
      phase = ((v / SYN) % 1 + 1) % 1;
      const th = phase * 2 * Math.PI;
      moon.position.set(Math.cos(th) * DM, Math.sin(th) * DM, 0);
      // the two tidal stretches add like vectors at twice the angle
      const x = Math.cos(2 * th) + sunBulge, y = Math.sin(2 * th);
      amp = Math.hypot(x, y);
      bulge(Math.atan2(y, x) / 2, A * 0.72 * amp);
      setLine(mOut, ellPts(1 + A * 0.72, 1 - A * 0.72 * 0.45, th, mPts));
      setLine(sOut, ellPts(1 + A * 0.72 * sunBulge, 1 - A * 0.72 * sunBulge * 0.45, 0, sPts));
      earthG.rotation.z = el * 0.05;
      lab.set(amp > 1.25 ? ['Spring tide: big range', '大潮：潮差大'] : amp < 0.75 ? ['Neap tide: small range', '小潮：潮差小'] : ['', '']);
      lab.on = amp > 1.25 || amp < 0.75;
    });
    readout = () => {
      const i = Math.round(phase * 8) % 8;
      const P: Pair[] = [['new moon', '新月'], ['waxing crescent', '蛾眉月'], ['first quarter', '上弦月'], ['waxing gibbous', '凸月'], ['full moon', '满月'], ['waning gibbous', '凸月'], ['last quarter', '下弦月'], ['waning crescent', '残月']];
      return [`${P[i][0]} · range ${Math.round((amp / 1.46) * 100)}%`, `${P[i][1]} · 潮差 ${Math.round((amp / 1.46) * 100)}%`];
    };
  }

  return {
    update(v, _dt, el) { for (const f of upd) f(v, el); },
    readout,
  };
};
export default kit;
