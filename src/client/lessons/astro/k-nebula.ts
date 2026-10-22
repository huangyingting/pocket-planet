/**
 * Kit "nebula": how the Solar System formed (the nebular hypothesis). A slowly turning cloud of gas and dust
 * collapses; it spins faster and flattens into a disk around the protosun. Inside the frost line (~3 AU) only rock and
 * metal can condense; outside, ices too, so the cores there grow big enough to grab gas (the giants). Dust sticks into
 * planetesimals, which merge into planets, all on nearly flat orbits going the same way round.
 * The clock is millions of years (`myr`): ~0–1 collapse, ~1–10 disk, planetesimals and giants (the gas clears by
 * ~10), ~10–100 rocky planets. Distances: u = 2.2·AU^0.55 (squeezed so Mercury and Neptune both fit).
 * - `disk` (default): the story above.
 * - `hltau`: the young star HL Tau's dusty disk with its gaps, as ALMA imaged it in 2014 (a painted sketch).
 */
import * as THREE from 'three';
import { C } from '../kit.ts';
import { Arrow, D2R, ball, canvasTex, circlePts, clamp, ease, glow, line, rng, starfield, sunLight } from './draw.ts';
import type { KitCtx, KitFactory, KitRun, Label, Pair } from './types.ts';

export interface Opts {
  /** default `disk` */
  view?: 'disk' | 'hltau';
  /** draw the frost line (pick tag `frost`) */
  frost?: boolean;
  /** draw the planets' orbits with arrows (all the same way round) */
  orbits?: boolean;
  /** label the planets once they have formed */
  names?: boolean;
}

const U = (au: number) => 2.2 * au ** 0.55;
const FROST_AU = 3;
const PLANETS: { name: Pair; au: number; r: number; c: string; giant: boolean }[] = [
  { name: ['Mercury', '水星'], au: 0.39, r: 0.1, c: '#a8a29a', giant: false },
  { name: ['Venus', '金星'], au: 0.72, r: 0.16, c: '#e6c98f', giant: false },
  { name: ['Earth', '地球'], au: 1, r: 0.17, c: '#5b8fd9', giant: false },
  { name: ['Mars', '火星'], au: 1.52, r: 0.12, c: '#d0703c', giant: false },
  { name: ['Jupiter', '木星'], au: 5.2, r: 0.5, c: '#d9b38c', giant: true },
  { name: ['Saturn', '土星'], au: 9.58, r: 0.42, c: '#e8d29a', giant: true },
  { name: ['Uranus', '天王星'], au: 19.2, r: 0.3, c: '#9be3f0', giant: true },
  { name: ['Neptune', '海王星'], au: 30.1, r: 0.3, c: '#6f8fff', giant: true },
];
const BOUNDS = [0.3, 0.55, 0.86, 1.25, 2.1, 3.3, 7.2, 14, 25, 36, 48];
const ZONE = [0, 1, 2, 3, -1, 4, 5, 6, 7, -2];

const kit: KitFactory<Opts> = (ctx, o) => (o.view === 'hltau' ? hlTau(ctx) : disk(ctx, o));
export default kit;

function disk(ctx: KitCtx, o: Opts): KitRun {
  const root = ctx.root;
  root.add(starfield(ctx.low ? 1000 : 2200));
  root.add(sunLight([0, 0, 0], 2.4, 0.25));
  const N = ctx.low ? 2600 : 9000, R = rng(42);
  // per particle: cloud position, disk radius/height, zone (planet index, -1 asteroid belt, -2 Kuiper belt),
  // planetesimal slot, gas or dust, and whether it falls into the protosun
  const cloud = new Float32Array(N * 3), rad = new Float32Array(N), hgt = new Float32Array(N), ang = new Float32Array(N);
  const zone = new Int8Array(N), slot = new Float32Array(N), gas = new Uint8Array(N), inSun = new Uint8Array(N), br = new Float32Array(N);
  const gauss = () => (R() + R() + R() + R() - 2) * 1.73;
  for (let i = 0; i < N; i++) {
    const z = R() * 2 - 1, a = R() * Math.PI * 2, s = Math.sqrt(1 - z * z), rr = 15 * Math.cbrt(R());
    // a lumpy, slightly flattened cloud
    const lump = 1 + 0.18 * Math.sin(a * 3 + z * 4) * Math.cos(a * 2 - z * 3);
    cloud.set([rr * s * Math.cos(a) * lump, rr * s * Math.sin(a) * lump, rr * z * 0.8 * lump], i * 3);
    ang[i] = a;
    inSun[i] = R() < 0.22 ? 1 : 0;
    gas[i] = R() < 0.55 ? 1 : 0;
    const au = 0.3 * (48 / 0.3) ** (R() ** 1.15);
    let k = 0;
    while (k < BOUNDS.length - 2 && au > BOUNDS[k + 1]) k++;
    zone[i] = ZONE[k];
    rad[i] = U(au);
    hgt[i] = gauss() * (0.04 + 0.035 * rad[i]);
    slot[i] = Math.floor(R() * 10);
    br[i] = 0.5 + R() * 0.5;
  }
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const dot = canvasTex(32, 32, c => {
    const gr = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gr; c.fillRect(0, 0, 32, 32);
  });
  const mat = new THREE.PointsMaterial({ size: ctx.low ? 0.42 : 0.3, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  root.add(pts);

  // the protosun and the planets
  const sunG = new THREE.Group(), core = ball(0.5, '#ffcf70', { emissive: '#ff9a3c' }), halo = glow('#ffb347', 4, 0.9);
  core.material.emissiveIntensity = 1.4;
  sunG.add(core, halo);
  root.add(sunG);
  const sunL = ctx.label(sunG, '', { c: C.gold, dy: -36 });
  const planets = PLANETS.map(p => { const m = ball(p.r, p.c, { seg: 24 }); m.material.emissive.set(p.c); m.material.emissiveIntensity = 0.25; root.add(m); return m; });
  const pLabels: Label[] = o.names ? PLANETS.map((p, i) => ctx.label(planets[i], p.name, { c: p.giant ? C.ice : C.orange, dy: -18 })) : [];
  const ph0 = PLANETS.map(() => R() * Math.PI * 2);
  const orbitsG = new THREE.Group();
  if (o.orbits) {
    PLANETS.forEach((p, i) => {
      orbitsG.add(line(circlePts(U(p.au), 160), p.giant ? '#74c0fc' : '#ffa94d', { opacity: 0.35 }));
      const a = ph0[i] + 1.2, r0 = U(p.au), ar = new Arrow(p.giant ? '#74c0fc' : '#ffa94d', 0.035);
      ar.set([r0 * Math.cos(a), r0 * Math.sin(a), 0], [-Math.sin(a) * 0.9, Math.cos(a) * 0.9, 0]);
      orbitsG.add(ar);
    });
    root.add(orbitsG);
  }
  // the frost line
  const frostG = new THREE.Group();
  if (o.frost) {
    const rf = U(FROST_AU), ringM = new THREE.Mesh(new THREE.RingGeometry(rf - 0.1, rf + 0.1, 160, 1), new THREE.MeshBasicMaterial({ color: '#a5d8ff', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
    frostG.add(ringM, line(circlePts(rf, 160), '#e7f5ff', { opacity: 0.9, dashed: true, dash: 0.2 }));
    ctx.pickable(ringM, 'frost');
    root.add(frostG);
    ctx.label(new THREE.Vector3(rf * 0.72, -rf * 0.72, 0.2), ['frost line (~3 AU)', '冰线（约 3 天文单位）'], { c: C.ice, big: true, t: 0.5, dx: 30 });
    ctx.label(new THREE.Vector3(-U(1) * 0.25, -U(1) * 1.05, 0), ['inside: too warm for ice → rock and metal', '冰线以内：太热，只有岩石和金属'], { c: C.orange, t: 1.2, dy: 28 });
    ctx.label(new THREE.Vector3(-U(12) * 0.75, U(12) * 0.75, 0), ['outside: ices too → big cores grab gas', '冰线以外：还有冰，大内核吸积气体'], { c: C.ice, t: 1.8 });
  }
  const stageL = ctx.label(new THREE.Vector3(0, 0, 9.5), '', { c: C.white, big: true });
  ctx.view([0, -1, 0.62], 34, [0, 0, 0], true);

  const warm = new THREE.Color('#ffb070'), icy = new THREE.Color('#b8d8ff'), dusty = new THREE.Color('#c58fb8'), gasC = new THREE.Color('#ff7aa8'), tmp = new THREE.Color();
  const spin = new Float32Array(N);
  let spinP = 0;
  return {
    update(v, dt) {
      const c = ease(v / 1.0), flat = ease(v / 0.75);
      const gasA = 1 - ease((v - 2.5) / 7.5);
      // giants: planetesimals 1–4 Myr, then cores grab gas by ~8 Myr; rocky planets: planetesimals 2–10, planets 10–90
      const q1g = ease((v - 1) / 3), q2g = ease((v - 2.5) / 6), q1t = ease((v - 2) / 8), q2t = ease((v - 10) / 80);
      spinP += dt;
      for (let i = 0; i < N; i++) {
        const cx = cloud[i * 3], cy = cloud[i * 3 + 1], cz = cloud[i * 3 + 2];
        const rc = Math.hypot(cx, cy), target = inSun[i] ? 0.15 : rad[i];
        const r = rc + (target - rc) * c;
        // spin up as it shrinks (angular momentum), then Keplerian in the disk
        spin[i] += dt * 0.55 * Math.min(3, (Math.max(r, 0.6) / 4) ** -1.5);
        let a = ang[i] + spin[i], x = r * Math.cos(a), y = r * Math.sin(a), z = cz * (1 - flat) + (inSun[i] ? 0 : hgt[i]) * flat;
        let alpha = br[i], cc = gas[i] ? gasC : dusty;
        if (inSun[i]) alpha *= 1 - ease((c - 0.6) / 0.4);
        else if (c > 0.3) {
          // in the disk: colour by temperature, then clump
          tmp.copy(rad[i] < U(FROST_AU) ? warm : icy);
          cc = tmp.lerp(gas[i] ? gasC : tmp, gas[i] ? 0.35 : 0);
          const zn = zone[i];
          if (gas[i]) {
            const toGiant = zn >= 4 ? q2g : 0;
            alpha *= gasA * (1 - toGiant) + (zn >= 4 ? toGiant * 0.15 : 0);
            if (zn >= 4 && toGiant > 0) {
              const pa = ph0[zn] + spinP * 0.55 * Math.min(3, (U(PLANETS[zn].au) / 4) ** -1.5), pr = U(PLANETS[zn].au);
              x += (pr * Math.cos(pa) - x) * toGiant; y += (pr * Math.sin(pa) - y) * toGiant; z *= 1 - toGiant;
            }
          } else if (zn >= 0) {
            const giant = PLANETS[zn].giant, q1 = giant ? q1g : q1t, q2 = giant ? q2g : q2t, pr = U(PLANETS[zn].au);
            const w = 0.55 * Math.min(3, (pr / 4) ** -1.5);
            // the particle's planetesimal: one of ten clumps around the zone, then the planet itself
            const sa = ph0[zn] + spinP * w + (slot[i] / 10) * Math.PI * 2 + 0.3, sr = r * 0.6 + pr * 0.4;
            x += (sr * Math.cos(sa) - x) * q1 * 0.9; y += (sr * Math.sin(sa) - y) * q1 * 0.9; z *= 1 - q1 * 0.8;
            const pa = ph0[zn] + spinP * w;
            x += (pr * Math.cos(pa) - x) * q2; y += (pr * Math.sin(pa) - y) * q2; z *= 1 - q2;
            alpha *= 1 - 0.7 * q2;
          } else alpha *= 0.75;
        }
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
        const s = alpha * (gas[i] ? 0.55 : 0.8);
        col[i * 3] = cc.r * s; col[i * 3 + 1] = cc.g * s; col[i * 3 + 2] = cc.b * s;
      }
      g.attributes.position.needsUpdate = true;
      g.attributes.color.needsUpdate = true;
      // the protosun grows during the collapse and ignites (hydrogen fusion) at ~50 Myr
      const sc = 0.15 + 0.85 * c, lit = ease((v - 30) / 25);
      sunG.scale.setScalar(sc);
      halo.material.opacity = 0.35 + 0.6 * c;
      core.material.emissive.set(lit > 0.5 ? '#ffd27a' : '#ff7a3c');
      sunG.visible = c > 0.05;
      sunL.set(v < 50 ? ['protosun', '原始太阳'] : ['Sun (fusion has begun)', '太阳（核聚变已点燃）']);
      sunL.on = c > 0.5;
      PLANETS.forEach((p, i) => {
        const q = p.giant ? q2g : q2t, w = 0.55 * Math.min(3, (U(p.au) / 4) ** -1.5), a = ph0[i] + spinP * w;
        planets[i].position.set(U(p.au) * Math.cos(a), U(p.au) * Math.sin(a), 0);
        planets[i].scale.setScalar(Math.max(0.01, q ** 0.5));
        planets[i].visible = q > 0.05;
        if (pLabels[i]) pLabels[i].on = q > 0.6;
      });
      orbitsG.visible = q2t > 0.3 || v > 60;
      frostG.visible = c > 0.85;
      stageL.set(v < 0.25 ? ['a cold cloud of gas and dust, turning slowly', '缓慢旋转的冷气体尘埃云'] : v < 0.9 ? ['gravity pulls it in: it spins faster and flattens', '引力收缩：越转越快、越来越扁'] : v < 3 ? ['a protoplanetary disk: dust sticks into planetesimals', '原行星盘：尘埃粘合成星子'] : v < 10 ? ['giant cores grab gas; the gas disk clears', '巨行星核吸积气体，气体盘逐渐消散'] : ['planetesimals merge into planets', '星子碰撞合并成行星']);
    },
    readout(v) {
      return v < 0.9 ? ['the cloud collapses', '星云收缩'] : v < 10 ? ['gas disk: a few million years', '气体盘仅存几百万年'] : v < 50 ? ['rocky planets still growing', '类地行星仍在长大'] : ['planets nearly complete', '行星基本形成'];
    },
  };
}

/** HL Tau: a ~1-million-year-old star in Taurus (~450 light-years) and its ringed dust disk, as ALMA saw it. */
function hlTau(ctx: KitCtx): KitRun {
  const root = ctx.root;
  root.add(starfield(ctx.low ? 1000 : 2200));
  const gaps = [0.14, 0.27, 0.36, 0.44, 0.53, 0.62, 0.71, 0.8, 0.86];
  const tex = canvasTex(512, 512, c => {
    const img = c.createImageData(512, 512);
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
      const r = Math.hypot(x - 256, y - 256) / 256;
      let b = r < 1 ? Math.exp(-r * 2.6) * 1.15 + 0.08 * (1 - r) : 0;
      for (const [k, gp] of gaps.entries()) b *= 1 - (k % 2 === 0 ? 0.78 : 0.45) * Math.exp(-(((r - gp) / 0.018) ** 2));
      b = clamp(b * 1.25);
      const j = (y * 512 + x) * 4;
      img.data[j] = 255 * clamp(b * 1.3); img.data[j + 1] = 255 * clamp(b * 0.85) ** 1.3; img.data[j + 2] = 255 * clamp(b * 0.4) ** 1.6; img.data[j + 3] = 255 * clamp(b * 3);
    }
    c.putImageData(img, 0, 0);
  });
  const diskM = new THREE.Mesh(new THREE.CircleGeometry(6, 128), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  diskM.rotation.x = 47 * D2R;
  root.add(diskM, glow('#ffe0a0', 2.2, 0.9));
  // a hidden ring on one of the bright gaps (pick tag `gap`)
  const gapR = new THREE.Mesh(new THREE.RingGeometry(6 * 0.25, 6 * 0.29, 96), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
  gapR.rotation.x = 47 * D2R;
  root.add(gapR);
  ctx.pickable(gapR, 'gap');
  ctx.label(new THREE.Vector3(0, 0, 0), ['HL Tau: a star about 1 million years old', '金牛座 HL：年龄约 100 万年的年轻恒星'], { c: C.gold, dy: -30 });
  const q = new THREE.Vector3(6 * 0.36, 0, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), 47 * D2R);
  ctx.label(q, ['dark gaps: young planets clearing their paths?', '暗环缝：可能是年轻行星清扫出的轨道'], { c: C.ice, dot: true, t: 0.8, dx: 40 });
  ctx.label(new THREE.Vector3(0, 0, -4.6), ['ALMA, 2014 · dust disk ~ 200 AU across (sketch)', 'ALMA 望远镜 2014 年拍摄 · 尘埃盘直径约 200 天文单位（示意）'], { c: '#a5b4c8' });
  ctx.view([0, -1, 0.05], 15, [0, 0, 0], true);
  return { update(_v, dt) { diskM.rotation.z += dt * 0.02; gapR.rotation.z = diskM.rotation.z; } };
}
