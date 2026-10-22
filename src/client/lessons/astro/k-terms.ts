/**
 * Kit "terms": the 24 solar terms (二十四节气). Seen from above the ecliptic, the Earth goes round the Sun; the orbit
 * is cut into 24 sectors of 15° of the Sun's longitude, one term at each mark. The Earth's axis keeps pointing the same
 * way all year (to Polaris), so the point where the Sun is overhead (the subsolar point) wanders between the tropics.
 * - `orbit`: the clock is a date (UTC ms); the Earth moves round, the current term lights up.
 * - `tilt`: a big Earth lit by the Sun of the clock date; lab sliders `tilt` (axial tilt, °) and `lat` (an observer's
 *   latitude) move the tropics, the polar circles and the noon Sun's height.
 * Not to scale: the Earth is drawn huge; the orbit is drawn as a circle (its eccentricity is only 0.017).
 */
import * as THREE from 'three';
import { C } from '../kit.ts';
import { Arrow, D2R, body, circlePts, clamp, dirLight, line, setLine, star, starfield, sunLight } from './draw.ts';
import type { KitCtx, KitFactory, KitRun, Label, Pair } from './types.ts';

export interface Opts {
  /** default `orbit` */
  view?: 'orbit' | 'tilt';
  /** orbit: which terms get a name: all 24 (default), the four key ones (二分二至), those plus the four starts (四立), or none */
  names?: 'all' | 'key' | 'eight' | 'none';
  /** orbit: colour the four seasons, each from its "start" term (立春, 立夏, 立秋, 立冬) */
  seasons?: boolean;
  /** orbit: draw the 24 sectors (15° each) from the Sun */
  sectors?: boolean;
  /** the axial tilt when there is no `tilt` slider (default 23.44°) */
  tilt?: number;
}

/** The 24 terms from 春分 (the Sun's ecliptic longitude 0°) in steps of 15°. */
export const TERMS: Pair[] = [
  ['Spring Equinox', '春分'], ['Clear and Bright', '清明'], ['Grain Rain', '谷雨'], ['Start of Summer', '立夏'], ['Grain Buds', '小满'], ['Grain in Ear', '芒种'],
  ['Summer Solstice', '夏至'], ['Minor Heat', '小暑'], ['Major Heat', '大暑'], ['Start of Autumn', '立秋'], ['End of Heat', '处暑'], ['White Dew', '白露'],
  ['Autumn Equinox', '秋分'], ['Cold Dew', '寒露'], ['Frost Descent', '霜降'], ['Start of Winter', '立冬'], ['Minor Snow', '小雪'], ['Major Snow', '大雪'],
  ['Winter Solstice', '冬至'], ['Minor Cold', '小寒'], ['Major Cold', '大寒'], ['Start of Spring', '立春'], ['Rain Water', '雨水'], ['Awakening of Insects', '惊蛰'],
];
const KEY = [0, 6, 12, 18], STARTS = [21, 3, 9, 15];
const KEY_TAG = ['chunfen', 'xiazhi', 'qiufen', 'dongzhi'];
const SEASON_C = ['#69db7c', '#ff8787', '#ffc078', '#74c0fc'];

/** The Sun's apparent ecliptic longitude (degrees, 0 … 360) at a UTC instant (low-precision formula, ±0.01°). */
export function sunLon(ms: number): number {
  const d = (ms - Date.UTC(2000, 0, 1, 12)) / 864e5;
  const g = (357.528 + 0.9856003 * d) * D2R;
  return (((280.46 + 0.9856474 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) % 360) + 360) % 360;
}
const latTxt = (v: number): Pair => {
  const a = Math.abs(v).toFixed(1);
  return Math.abs(v) < 0.05 ? ['0° (equator)', '0°（赤道）'] : v > 0 ? [`${a}°N`, `北纬 ${a}°`] : [`${a}°S`, `南纬 ${a}°`];
};

const kit: KitFactory<Opts> = (ctx, o) => (o.view === 'tilt' ? tiltView(ctx, o) : orbitView(ctx, o));
export default kit;

function orbitView(ctx: KitCtx, o: Opts): KitRun {
  const root = ctx.root, Ro = 6, eps = (o.tilt ?? 23.44) * D2R;
  root.add(starfield(ctx.low ? 1200 : 2400), sunLight([0, 0, 0], 3, 0.16));
  root.add(star(0.9, '#ffd27a', 4.5));
  ctx.label(new THREE.Vector3(0, 0, 0), ['Sun', '太阳'], { c: C.gold, dy: -40 });
  root.add(line(circlePts(Ro, 240), C.white, { opacity: 0.35 }));
  /** Earth's position when the Sun stands at ecliptic longitude λ (degrees). */
  const at = (lam: number, r = Ro) => new THREE.Vector3(-Math.cos(lam * D2R) * r, -Math.sin(lam * D2R) * r, 0);

  if (o.seasons) {
    STARTS.forEach((k, i) => {
      const lam = k * 15;
      root.add(new THREE.Mesh(new THREE.RingGeometry(Ro - 0.32, Ro + 0.32, 48, 1, (lam + 180) * D2R, 90 * D2R),
        new THREE.MeshBasicMaterial({ color: SEASON_C[i], transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })));
      ctx.label(at(lam + 45, Ro - 1.3), ([['spring', '春'], ['summer', '夏'], ['autumn', '秋'], ['winter', '冬']] as Pair[])[i], { c: SEASON_C[i], big: true, t: 0.8 + i * 0.3 });
    });
  }
  const labels: { l: Label; k: number }[] = [];
  const names = o.names ?? 'all';
  for (let k = 0; k < 24; k++) {
    const lam = k * 15, key = KEY.includes(k), st = STARTS.includes(k);
    const c = key ? C.gold : st && (o.seasons || names === 'eight') ? '#c3fae8' : '#a5b4c8';
    root.add(line([at(lam, Ro - 0.22), at(lam, Ro + 0.22)], c, { opacity: key ? 1 : 0.75 }));
    if (o.sectors) root.add(line([at(lam, 0.95), at(lam, Ro - 0.3)], key ? C.gold : '#5c6b80', { opacity: key ? 0.5 : 0.28 }));
    if (key) {
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
      h.position.copy(at(lam));
      root.add(h);
      ctx.pickable(h, KEY_TAG[KEY.indexOf(k)]);
    }
    if (names === 'none' || !(names === 'all' || key || (names === 'eight' && st))) continue;
    const text: Pair = names === 'all' && !key ? [TERMS[k][0], TERMS[k][1]] : [`${TERMS[k][0]} ${lam}°`, `${TERMS[k][1]} ${lam}°`];
    labels.push({ l: ctx.label(at(lam, Ro + (key ? 1.2 : 0.9)), text, { c, big: key, t: 0.3 + ((k + 3) % 24) * 0.04 }), k });
  }
  if (o.sectors) ctx.label(at(7.5, Ro * 0.62), ['15°', '15°'], { c: C.gold, t: 1.2 });
  ctx.label(at(180, 2.6).setZ(0.3), ['to the vernal point', '春分点方向'], { c: '#a5b4c8', t: 1.5, dy: -14 });
  root.add(new Arrow('#a5b4c8', 0.02).set(at(180, 1.3), at(180, 2.2)));

  // the Earth, its axis fixed in space (tilted toward +y: the north pole leans to the Sun when the Earth is at −y)
  const earthT = new THREE.Group(), earthS = new THREE.Group(), earth = body('earth', 0.62, '#4a78b8');
  earthS.add(earth);
  earthT.add(earthS);
  earthT.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, Math.sin(eps), Math.cos(eps)));
  earthT.add(line([[0, 0, -1.05], [0, 0, 1.2]], C.gold, { opacity: 0.95 }));
  earthT.add(line(circlePts(0.635, 96), C.teal, { opacity: 0.75 }));
  for (const s of [1, -1]) earthT.add(line(circlePts(0.635 * Math.cos(eps), 96, [0, 0, 0.635 * Math.sin(eps) * s]), C.orange, { opacity: 0.8 }));
  root.add(earthT);
  ctx.pickable(earth, 'earth');
  const subs = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff3bf' }));
  const ray = line([[0, 0, 0], [0, 0, 0]], '#fff3bf', { opacity: 0.6 });
  root.add(subs, ray);
  const eL = ctx.label(earthT, '', { c: C.white, dy: 50 });
  ctx.view([0, -0.62, 1], 20, [0, 0.2, 0], true);

  const sunDir = new THREE.Vector3();
  return {
    update(v, dt) {
      const lam = sunLon(v), dec = Math.asin(Math.sin(eps) * Math.sin(lam * D2R)) / D2R;
      earthT.position.copy(at(lam));
      earthS.rotation.z += dt * 2.2;
      sunDir.copy(earthT.position).negate().normalize();
      subs.position.copy(earthT.position).addScaledVector(sunDir, 0.62);
      setLine(ray, [subs.position.clone().addScaledVector(sunDir, 2.6), subs.position]);
      const cur = Math.floor(lam / 15) % 24;
      for (const x of labels) x.l.el.style.opacity = x.k === cur ? '1' : '0.6';
      const t = latTxt(dec);
      eL.set([`Sun overhead: ${t[0]}`, `太阳直射 ${t[1]}`]);
    },
    readout(v) {
      const l = sunLon(v), k = Math.floor(l / 15) % 24, nx = (k + 1) % 24;
      const days = Math.max(1, Math.round(((nx * 15 - l + 360) % 360) / 0.9856));
      return [`${TERMS[nx][0]} in ${days} d`, `黄经 ${l.toFixed(0)}° · ${days} 天后${TERMS[nx][1]}`];
    },
  };
}

/** The tilt lab: a big Earth, the tropics and polar circles following the axial tilt, and the noon Sun at a latitude. */
function tiltView(ctx: KitCtx, o: Opts): KitRun {
  const root = ctx.root, R = 2;
  root.add(starfield(ctx.low ? 1000 : 2000));
  const light = dirLight([1, 0, 0], 2.6, 0.14);
  root.add(light);
  const dl = light.children[0] as THREE.DirectionalLight;
  const tiltG = new THREE.Group(), spinG = new THREE.Group(), earth = body('earth', R, '#4a78b8');
  spinG.add(earth);
  tiltG.add(spinG);
  root.add(tiltG);
  const onTop = <T extends THREE.Object3D>(x: T, ro = 6) => { x.traverse(y => { const m = (y as THREE.Mesh).material as THREE.Material | undefined; if (m) m.depthTest = false; y.renderOrder = ro; }); return x; };
  tiltG.add(line([[0, 0, -R * 1.45], [0, 0, R * 1.45]], C.gold, { opacity: 0.95 }));
  tiltG.add(line(circlePts(R * 1.006, 128), C.teal, { opacity: 0.85 }));
  const mk = (c: string, dashed = false) => { const l = line(circlePts(R, 128), c, { opacity: 0.95, dashed, dash: 0.1 }); tiltG.add(l); return l; };
  const tropN = mk(C.orange), tropS = mk(C.orange), polN = mk(C.ice, true), polS = mk(C.ice, true), obsL = mk(C.pink);
  const setRing = (l: THREE.Line, lat: number) => {
    const r = R * 1.006 * Math.cos(lat * D2R), z = R * 1.006 * Math.sin(lat * D2R);
    setLine(l, circlePts(Math.max(r, 1e-4), 128, [0, 0, z]));
  };
  const aTN = new THREE.Object3D(), aTS = new THREE.Object3D(), aPN = new THREE.Object3D(), aEq = new THREE.Object3D();
  tiltG.add(aTN, aTS, aPN, aEq);
  const lTN = ctx.label(aTN, '', { c: C.orange, dx: -80 }), lTS = ctx.label(aTS, '', { c: C.orange, dx: -80 });
  const lPN = ctx.label(aPN, '', { c: C.ice, dx: -70 });
  ctx.label(aEq, ['equator', '赤道'], { c: C.teal, dx: -50 });
  const aN = new THREE.Object3D();
  aN.position.set(0, 0, R * 1.6);
  tiltG.add(aN);
  ctx.label(aN, ['N', '北'], { c: C.gold, big: true });
  // sunlight: parallel arrows coming in from the Sun
  const rays = [0, 1, 2, 3, 4].map(() => onTop(new Arrow('#ffe066', 0.022)));
  root.add(...rays);
  const aSun = new THREE.Object3D();
  root.add(aSun);
  ctx.label(aSun, ['sunlight', '太阳光'], { c: '#ffe066' });
  // the observer at noon: horizon, sun ray, altitude arc
  const obs = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshBasicMaterial({ color: C.pink }));
  const hor = line([[0, 0, 0], [0, 0, 0]], '#9be3b4'), sray = line([[0, 0, 0], [0, 0, 0]], '#ffe066'), arc = line(Array.from({ length: 25 }, () => new THREE.Vector3()), C.pink);
  root.add(onTop(obs, 7), onTop(hor), onTop(sray), onTop(arc));
  const aH = new THREE.Object3D();
  root.add(aH);
  const lH = ctx.label(aH, '', { c: C.pink, big: true, dx: 10 });
  const sub = onTop(new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff3bf' })), 7);
  root.add(sub);
  ctx.view([0.08, -1, 0.1], 12.5, [1.2, 0, 0], true);

  const P = new THREE.Vector3(), T = new THREE.Vector3(), S = new THREE.Vector3(), ax = new THREE.Vector3(), M = new THREE.Vector3(), side = new THREE.Vector3();
  const tiltOf = () => { const t = ctx.param('tilt'); return Number.isFinite(t) ? t : o.tilt ?? 23.44; };
  const latOf = () => { const l = ctx.param('lat'); return Number.isFinite(l) ? l : 40; };
  let lastKey = '';
  return {
    update(v, dt) {
      const e = tiltOf(), phi = latOf(), lam = sunLon(v);
      spinG.rotation.z += dt * 0.6;
      // the axis leans toward +x; the Sun is at +x at the June solstice (λ = 90°)
      ax.set(Math.sin(e * D2R), 0, Math.cos(e * D2R));
      tiltG.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), ax);
      S.set(Math.sin(lam * D2R), -Math.cos(lam * D2R), 0);
      dl.position.copy(S).multiplyScalar(10);
      const key = `${e.toFixed(2)}|${phi.toFixed(2)}`;
      if (key !== lastKey) {
        lastKey = key;
        setRing(tropN, e); setRing(tropS, -e); setRing(polN, 90 - e); setRing(polS, e - 90); setRing(obsL, phi);
        tropN.visible = tropS.visible = e > 0.3;
        polN.visible = polS.visible = e > 0.3 && e < 89.7;
        aTN.position.set(-R * Math.cos(e * D2R), 0, R * Math.sin(e * D2R));
        aTS.position.set(-R * Math.cos(e * D2R), 0, -R * Math.sin(e * D2R));
        aPN.position.set(-R * Math.cos((90 - e) * D2R), 0, R * Math.sin((90 - e) * D2R));
        aEq.position.set(-R, 0, 0);
        lTN.set([`Tropic of Cancer ${e.toFixed(1)}°N`, `北回归线 ${e.toFixed(1)}°N`]); lTS.set([`Tropic of Capricorn ${e.toFixed(1)}°S`, `南回归线 ${e.toFixed(1)}°S`]);
        lPN.set([`Arctic Circle ${(90 - e).toFixed(1)}°N`, `北极圈 ${(90 - e).toFixed(1)}°N`]);
        lTN.on = lTS.on = e > 0.3; lPN.on = e > 0.3 && e < 89.7;
      }
      // the noon meridian: the half-plane through the axis that faces the Sun
      M.copy(S).addScaledVector(ax, -S.dot(ax));
      if (M.lengthSq() < 1e-6) M.set(1, 0, 0).addScaledVector(ax, -ax.x);
      M.normalize();
      P.copy(M).multiplyScalar(Math.cos(phi * D2R)).addScaledVector(ax, Math.sin(phi * D2R)).normalize();
      obs.position.copy(P).multiplyScalar(R * 1.01);
      const sd = S.dot(P), h = Math.asin(clamp(sd, -1, 1)) / D2R;
      T.copy(S).addScaledVector(P, -sd);
      if (T.lengthSq() < 1e-8) T.copy(ax).addScaledVector(P, -ax.dot(P));
      T.normalize();
      const o0 = obs.position;
      setLine(hor, [o0.clone().addScaledVector(T, -0.9), o0.clone().addScaledVector(T, 0.9)]);
      setLine(sray, [o0, o0.clone().addScaledVector(S, 1.3)]);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.max(h, 0) * D2R; pts.push(o0.clone().addScaledVector(T, 0.55 * Math.cos(a)).addScaledVector(P, 0.55 * Math.sin(a))); }
      setLine(arc, pts);
      aH.position.copy(o0).addScaledVector(T, 0.7).addScaledVector(P, 0.4);
      {
        const e = tiltOf(), hs = 90 - Math.abs(phi - e), hw = 90 - Math.abs(phi + e), f = (x: number) => (x > 0 ? `${x.toFixed(1)}°` : '—');
        const now: Pair = h > 0 ? [`noon Sun ${h.toFixed(1)}°`, `正午太阳高度 ${h.toFixed(1)}°`] : ['polar night: no sunrise', '极夜：太阳不升起'];
        lH.set([`${now[0]} (June solstice ${f(hs)}, December ${f(hw)})`, `${now[1]}（夏至 ${f(hs)}，冬至 ${f(hw)}）`]);
      }
      sray.visible = arc.visible = h > 0;
      sub.position.copy(S).multiplyScalar(R * 1.01);
      side.set(0, 0, 1);
      for (let i = 0; i < rays.length; i++) {
        const off = (i - 2) * 0.7, from = S.clone().multiplyScalar(R * 3.4).addScaledVector(side, off);
        rays[i].set(from, S.clone().multiplyScalar(-(R * 3.4 - Math.sqrt(Math.max(0, R * R - off * off)) - 0.04)));
      }
      aSun.position.copy(S).multiplyScalar(R * 3.5).setZ(R * 1.75);
    },
    readout(v) {
      const e = tiltOf(), dec = Math.asin(Math.sin(e * D2R) * Math.sin(sunLon(v) * D2R)) / D2R, t = latTxt(dec);
      return [`Sun overhead ${t[0]}`, `太阳直射 ${t[1]}`];
    },
  };
}
