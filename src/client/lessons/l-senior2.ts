/**
 * 高中地理 · 必修第一册 / 选择性必修1 (part B): the atmosphere (composition and layers, heating, thermal circulation,
 * horizontal motion), the planetary pressure and wind belts and the climates they make, weather systems, and the
 * properties and motion of sea water. The 3D scenes use the astro board's `air` and `belts` kits.
 */
import { C, arrows, mk, type Lesson, type LL, type Pair } from './kit.ts';
import type { Line } from './stage.ts';
import { arrowDef, svg, tx, type Lx } from './figs.ts';

const ATMOS = ['The atmosphere', '地球上的大气'] as const;
const MOTION = ['Motion of the atmosphere', '大气的运动'] as const;
const WATER = ['Water on Earth', '地球上的水'] as const;

// small copies of the kits' models, for the lab tasks (lesson data must not import kit code)
/** Tropopause height (km) in the `air` kit. */
const tropopause = (lat: number) => 8.5 + 9 * Math.cos((lat * Math.PI) / 180) ** 3;
/** The `air` kit's heating lab: the day's high and the night's low (°C). */
const heatLab = (cloud: number, elevM: number) => {
  const c = cloud / 100, E = elevM / 1000, R = (14 - 10 * c) * (1 + 0.12 * E), M = 22 - 4.5 * E - 2 * c;
  return { hi: M + R / 2, lo: M - R / 2 };
};

// ——— figures ———
const r1 = (v: number) => Math.round(v * 10) / 10;
const cloudSvg = (x: number, y: number, s = 1, extra = '') =>
  `<g class="fg-cloud"${extra}><ellipse cx="${x}" cy="${y}" rx="${16 * s}" ry="${7 * s}"/><circle cx="${r1(x - 6 * s)}" cy="${r1(y - 5 * s)}" r="${7 * s}"/><circle cx="${r1(x + 5 * s)}" cy="${r1(y - 7 * s)}" r="${8 * s}"/></g>`;
const rainSvg = (x0: number, x1: number, y0: number, y1: number, d = 0) => {
  let s = '';
  for (let x = x0; x <= x1; x += 9) s += `<line x1="${x}" y1="${y0 + ((x * 7) % 9)}" x2="${x - 3}" y2="${y1 - ((x * 5) % 11)}"/>`;
  return `<g class="fg-rain f-fade" style="--d:${d}s">${s}</g>`;
};
const COLD = 'rgba(77,171,247,.32)', WARM = 'rgba(255,135,135,.2)';

/** Cross-sections of a cold, warm or quasi-stationary front; `bare` hides the type and the labels that give it away. */
function frontFig(kind: 'cold' | 'warm' | 'still', bare = false): (L: Lx, id: string) => string {
  return (L, id) => {
    const W = 300, H = 160, G = 136;
    const defs = arrowDef(id + 'b', '#74c0fc') + arrowDef(id + 'r', '#ff8787') + arrowDef(id + 'w', '#e9ecef');
    let body = `<rect x="0" y="0" width="${W}" height="${G}" fill="${WARM}"/>`;
    let surf = '', rain = '', clouds = '', arr = '', labs = '';
    if (kind === 'cold') {
      surf = `M190 ${G} Q165 60 110 30`;
      body += `<path d="M0 ${G} L190 ${G} Q165 60 110 30 L0 30 Z" fill="${COLD}"/>`;
      clouds = cloudSvg(150, 40, 1.1) + cloudSvg(178, 56, 0.9) + cloudSvg(126, 30, 0.8);
      rain = rainSvg(132, 184, 52, G - 4, 0.6);
      arr = `<path d="M30 112 L120 112" class="fg-arrow" stroke="#74c0fc" stroke-width="2.4" marker-end="url(#${id}b)"/>` +
        `<path d="M285 118 L205 118 Q175 100 160 66 L140 40" fill="none" stroke="#ff8787" stroke-width="2" marker-end="url(#${id}r)"/>`;
      labs = tx(40, 98, L(['Cold air', '冷气团']), 'fg-label', 's', ' style="fill:#a5d8ff"') + tx(292, 104, L(['Warm air', '暖气团']), 'fg-label', 'e', ' style="fill:#ffa8a8"') +
        (bare ? '' : tx(150, 150, L(['Rain mostly behind the front', '雨区主要在锋后']), 'fg-sub', 'm'));
    } else if (kind === 'warm') {
      surf = `M80 ${G} Q190 128 295 46`;
      body += `<path d="M80 ${G} Q190 128 295 46 L300 46 L300 ${G} Z" fill="${COLD}"/>`;
      clouds = cloudSvg(118, 104, 0.8) + cloudSvg(160, 92, 1) + cloudSvg(205, 76, 1) + cloudSvg(250, 56, 0.9);
      rain = rainSvg(100, 186, 104, G - 4, 0.6);
      arr = `<path d="M14 124 L70 126 Q170 116 270 40" fill="none" stroke="#ff8787" stroke-width="2.2" marker-end="url(#${id}r)"/>` +
        `<path d="M240 126 L284 126" class="fg-arrow" stroke="#74c0fc" stroke-width="1.6" marker-end="url(#${id}b)"/>`;
      labs = tx(20, 70, L(['Warm air', '暖气团']), 'fg-label', 's', ' style="fill:#ffa8a8"') + tx(292, 100, L(['Cold air', '冷气团']), 'fg-label', 'e', ' style="fill:#a5d8ff"') +
        (bare ? '' : tx(150, 150, L(['Rain mostly ahead of the front: long and steady', '雨区主要在锋前，多连续性降水']), 'fg-sub', 'm'));
    } else {
      surf = `M200 ${G} Q140 120 50 40`;
      body += `<path d="M0 ${G} L200 ${G} Q140 120 50 40 L0 40 Z" fill="${COLD}"/>`;
      clouds = cloudSvg(95, 60, 1) + cloudSvg(138, 80, 1.1) + cloudSvg(178, 102, 0.85);
      rain = rainSvg(80, 192, 70, G - 4, 0.6);
      arr = `<path d="M20 124 L80 124" class="fg-arrow" stroke="#74c0fc" stroke-width="2" marker-end="url(#${id}b)"/>` +
        `<path d="M285 118 L215 118 Q165 100 120 80" fill="none" stroke="#ff8787" stroke-width="2" marker-end="url(#${id}r)"/>`;
      labs = tx(26, 98, L(['Cold air', '冷气团']), 'fg-label', 's', ' style="fill:#a5d8ff"') + tx(292, 100, L(['Warm air', '暖气团']), 'fg-label', 'e', ' style="fill:#ffa8a8"') +
        (bare ? '' : tx(150, 150, L(['Evenly matched: the front lingers, rain for weeks', '势均力敌，锋面摆动，阴雨持续']), 'fg-sub', 'm'));
    }
    const title: Pair = bare ? ['Front ?', '锋面 ？'] : kind === 'cold' ? ['Cold front', '冷锋'] : kind === 'warm' ? ['Warm front', '暖锋'] : ['Quasi-stationary front', '准静止锋'];
    const move = kind === 'still' ? '' : `<path d="M254 20 L290 20" class="fg-arrow" stroke="#e9ecef" marker-end="url(#${id}w)"/>` +
      (bare ? '' : tx(248, 23, L(['moving', '移动方向']), 'fg-tick', 'e'));
    return svg(W, H, defs + body +
      `<path d="${surf}" fill="none" stroke="#e9ecef" stroke-width="2.2" pathLength="1" class="f-draw"/>` +
      `<rect x="0" y="${G}" width="${W}" height="${H - G}" class="fg-landfill"/>` + clouds + rain + arr + labs + move +
      tx(8, 16, L(title), 'fg-title'), L(title));
  };
}

/** Plan views of a cyclone and an anticyclone in the northern hemisphere. */
const cycloneFig = (L: Lx, id: string) => {
  const one = (cx: number, low: boolean) => {
    let s = '';
    for (const r of [16, 32, 48]) s += `<circle cx="${cx}" cy="78" r="${r}" fill="none" stroke="rgba(255,255,255,.3)"/>`;
    for (let k = 0; k < 4; k++) {
      const a0 = (k * Math.PI) / 2 + 0.3, P = (r: number, a: number) => `${r1(cx + r * Math.cos(a))} ${r1(78 - r * Math.sin(a))}`;
      const [ra, rb, da] = low ? [58, 18, 1.15] : [14, 56, -1.15];
      s += `<path d="M${P(ra, a0)} Q${P((ra + rb) / 2 + 6, a0 + da / 2)} ${P(rb, a0 + da)}" fill="none" stroke="${low ? '#ff8787' : '#74c0fc'}" stroke-width="2" marker-end="url(#${id}${low ? 'r' : 'b'})"/>`;
    }
    return s + tx(cx, 83, L(low ? ['L', '低'] : ['H', '高']), 'fg-title', 'm', ` style="fill:${low ? '#ff8787' : '#74c0fc'}"`) +
      tx(cx, 146, L(low ? ['Cyclone: in, anticlockwise, rising: cloud, rain', '气旋：逆时针辐合，上升，阴雨'] : ['Anticyclone: out, clockwise, sinking: fine', '反气旋：顺时针辐散，下沉，晴朗']), 'fg-sub', 'm');
  };
  return svg(300, 156, arrowDef(id + 'r', '#ff8787') + arrowDef(id + 'b', '#74c0fc') + one(75, true) + one(225, false) + tx(150, 12, L(['Northern hemisphere, seen from above', '北半球（俯视）']), 'fg-sub', 'm'), L(['Cyclone and anticyclone', '气旋和反气旋']));
};

/** Isobars on a near-surface weather map (northern hemisphere); `wind` draws the pressure-gradient force and the wind at P. */
function isobarFig(wind: boolean): (L: Lx, id: string) => string {
  return (L, id) => {
    let s = arrowDef(id + 'g', '#ffd24a') + arrowDef(id + 't', '#63e6be') + arrowDef(id + 'n', '#ced4da');
    [1012, 1010, 1008, 1006].forEach((p, i) => {
      const y = 28 + i * 32;
      s += `<path d="M14 ${y} Q150 ${y + 10} 262 ${y}" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1.3"/>` + tx(266, y + 3, String(p), 'fg-tick');
    });
    s += `<path d="M285 40 L285 14" stroke="#ced4da" stroke-width="1.4" marker-end="url(#${id}n)"/>` + tx(285, 52, L(['N', '北']), 'fg-tick', 'm');
    s += `<circle cx="140" cy="76" r="4" fill="#fff"/>` + tx(130, 72, 'P', 'fg-label', 'e');
    if (wind) {
      const a = (35 * Math.PI) / 180;
      s += `<path d="M140 76 L140 124" stroke="#ffd24a" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#${id}g)"/>` + tx(146, 122, L(['pressure-gradient force', '水平气压梯度力']), 'fg-tick', 's', ' style="fill:#ffd24a"');
      s += `<path d="M140 76 L${r1(140 - 52 * Math.sin(a))} ${r1(76 + 52 * Math.cos(a))}" stroke="#63e6be" stroke-width="2.4" marker-end="url(#${id}t)" pathLength="1" class="f-draw"/>` +
        tx(r1(136 - 52 * Math.sin(a)), r1(84 + 52 * Math.cos(a)), L(['wind: turned right 30–45°', '风向：右偏 30°–45°']), 'fg-tick', 'e', ' style="fill:#63e6be"');
    }
    return svg(300, 150, s + tx(8, 146, L(['Near the ground, northern hemisphere (hPa)', '北半球近地面（单位：百帕）']), 'fg-sub'), L(['Isobars', '等压线']));
  };
}

/** The North Indian Ocean's monsoon currents: clockwise in summer, anticlockwise in winter. */
const indianFig = (L: Lx, id: string) => {
  const ring = (cx: number, cw: boolean, c: string) => {
    const pts = Array.from({ length: 4 }, (_, k) => {
      const a0 = (k * Math.PI) / 2 + 0.25, a1 = a0 + (cw ? -1 : 1) * 1.15, P = (a: number) => `${r1(cx + 44 * Math.cos(a))} ${r1(80 - 34 * Math.sin(a))}`;
      return `<path d="M${P(a0)} A44 34 0 0 ${cw ? 1 : 0} ${P(a1)}" fill="none" stroke="${c}" stroke-width="2.2" marker-end="url(#${id}${cw ? 'r' : 'b'})"/>`;
    });
    return pts.join('');
  };
  return svg(300, 160, arrowDef(id + 'r', '#ff8787') + arrowDef(id + 'b', '#74c0fc') + arrowDef(id + 'w', '#e9ecef') +
    ring(75, true, '#ff8787') + ring(225, false, '#74c0fc') +
    `<path d="M40 136 L70 112" class="fg-wind" marker-end="url(#${id}w)"/>` + `<path d="M262 30 L232 54" class="fg-wind" marker-end="url(#${id}w)"/>` +
    tx(75, 20, L(['Summer: SW monsoon', '夏季：西南季风']), 'fg-label', 'm') + tx(75, 84, L(['clockwise', '顺时针']), 'fg-sub', 'm') +
    tx(225, 20, L(['Winter: NE monsoon', '冬季：东北季风']), 'fg-label', 'm') + tx(225, 84, L(['anticlockwise', '逆时针']), 'fg-sub', 'm') +
    tx(150, 154, L(['North Indian Ocean: “clockwise in summer, anticlockwise in winter”', '北印度洋季风洋流：夏顺冬逆']), 'fg-sub', 'm'),
  L(['Monsoon currents of the North Indian Ocean', '北印度洋季风洋流']));
};

/** Plan view of a northern-hemisphere frontal cyclone: cold front trailing south-west, warm front to the east, rain bands. */
const frontalFig = (L: Lx, id: string) => {
  type P2 = [number, number];
  const q = (a: P2, c: P2, b: P2, t: number): { p: P2; n: P2 } => {
    const p: P2 = [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
    const dx = 2 * (1 - t) * (c[0] - a[0]) + 2 * t * (b[0] - c[0]), dy = 2 * (1 - t) * (c[1] - a[1]) + 2 * t * (b[1] - c[1]), m = Math.hypot(dx, dy);
    return { p, n: [dy / m, -dx / m] };
  };
  const O: P2 = [140, 60], cc: P2 = [118, 100], ce: P2 = [76, 138], wc: P2 = [192, 76], we: P2 = [262, 90];
  let sym = '';
  for (const t of [0.22, 0.45, 0.68, 0.9]) {
    const { p, n } = q(O, cc, ce, t), tx_ = -n[1], ty_ = n[0];
    sym += `<path d="M${r1(p[0] - 5 * tx_)} ${r1(p[1] - 5 * ty_)} L${r1(p[0] + 5 * tx_)} ${r1(p[1] + 5 * ty_)} L${r1(p[0] + 7 * n[0])} ${r1(p[1] + 7 * n[1])} Z" fill="#4dabf7"/>`;
  }
  for (const t of [0.22, 0.45, 0.68, 0.9]) {
    const { p, n } = q(O, wc, we, t), tx_ = -n[1], ty_ = n[0];
    sym += `<path d="M${r1(p[0] - 5 * tx_)} ${r1(p[1] - 5 * ty_)} A5 5 0 0 1 ${r1(p[0] + 5 * tx_)} ${r1(p[1] + 5 * ty_)} Z" fill="#ff8787"/>`;
  }
  const inflow = [[56, 38, 96, 22, 132, 30], [236, 34, 214, 16, 168, 26], [214, 128, 188, 104, 168, 82]].map(([x0, y0, cx, cy, x1, y1]) =>
    `<path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}" fill="none" stroke="#e9ecef" stroke-width="1.4" marker-end="url(#${id}w)"/>`).join('');
  return svg(300, 172, arrowDef(id + 'w', '#e9ecef') +
    `<rect x="0" y="0" width="300" height="160" fill="${COLD}" opacity=".55"/>` +
    `<path d="M140 60 Q192 76 262 90 L300 92 L300 160 L60 160 L76 138 Q118 100 140 60 Z" fill="${WARM}"/>` +
    [38, 62].map((r, i) => `<ellipse cx="140" cy="64" rx="${r * 1.5}" ry="${r}" fill="none" stroke="rgba(255,255,255,.22)" stroke-dasharray="${i ? '4 4' : ''}"/>`).join('') +
    `<path d="M131 54 Q109 94 67 132" fill="none" stroke="rgba(105,219,124,.38)" stroke-width="12" stroke-linecap="round"/>` +
    `<path d="M140 44 Q194 58 262 70" fill="none" stroke="rgba(105,219,124,.38)" stroke-width="26" stroke-linecap="round"/>` +
    `<path d="M140 60 Q118 100 76 138" fill="none" stroke="#4dabf7" stroke-width="2.4"/><path d="M140 60 Q192 76 262 90" fill="none" stroke="#ff8787" stroke-width="2.4"/>` +
    sym + inflow + tx(140, 65, L(['L', '低']), 'fg-title', 'm', ' style="fill:#ff8787"') +
    tx(60, 118, L(['cold front', '冷锋']), 'fg-label', 'e', ' style="fill:#a5d8ff"') + tx(236, 106, L(['warm front', '暖锋']), 'fg-label', 'm', ' style="fill:#ffa8a8"') +
    tx(170, 140, L(['warm sector', '暖区']), 'fg-sub', 'm') + tx(12, 150, L(['cold air', '冷气团']), 'fg-sub', 's') +
    `<path d="M252 14 L288 14" class="fg-arrow" stroke="#e9ecef" marker-end="url(#${id}w)"/>` + tx(248, 17, L(['moving east', '向东移动']), 'fg-tick', 'e') +
    `<rect x="8" y="161" width="14" height="8" fill="rgba(105,219,124,.5)"/>` + tx(26, 169, L(['rain: narrow band behind the cold front, wide band ahead of the warm front', '雨区：冷锋锋后窄，暖锋锋前宽']), 'fg-tick', 's'),
  L(['Frontal cyclone (northern hemisphere)', '锋面气旋（北半球）']));
};

// ——— globe helpers ———
/** A rough ellipse around a centre (degrees of latitude and longitude), for pressure centres. */
const blob = (lat: number, lon: number, rl: number, rn: number): LL[] => Array.from({ length: 24 }, (_, i) => [r1(lat + rl * Math.sin((i / 24) * 2 * Math.PI)), r1(lon + rn * Math.cos((i / 24) * 2 * Math.PI))] as LL);
/** Spiral arms around a centre: `inward` + `ccw` for a northern cyclone, outward and clockwise for an anticyclone. */
function spiral(c: LL, r0: number, r1_: number, ccw: boolean, color: string, t = 0): Line[] {
  return [0, 1, 2, 3].map(k => {
    const pts: LL[] = [];
    for (let i = 0; i <= 10; i++) {
      const f = i / 10, r = r0 + (r1_ - r0) * f, a = (k * Math.PI) / 2 + (ccw ? 1 : -1) * f * 1.6;
      const lat = c[0] + r * Math.sin(a);
      pts.push([r1(lat), r1(c[1] + (r * Math.cos(a)) / Math.cos((lat * Math.PI) / 180))]);
    }
    return { pts, c: color, t: t + k * 0.2, flow: true, arrow: true, w: 1.8, dur: 1.4 };
  });
}
/** An ocean current: warm (red) or cold (blue), flowing. */
const cur = (pts: LL[], warm: boolean, t = 0): Line => ({ pts, c: warm ? C.red : C.blue, t, flow: true, arrow: true, w: 2, dur: 1.6 });

export const SENIOR_B: Lesson[] = [
  // ——— 1. composition and layers ———
  {
    id: 'h-atmos', strand: 'climate', grade: 'h1', tracks: [], unit: ATMOS, icon: 'aurora', minutes: 14,
    title: ['Composition and layers of the atmosphere', '大气的组成和垂直分层'],
    blurb: ['What air is made of, and why it gets colder, then warmer, then colder again as you climb to 120 km.', '大气由什么组成？从地面升到 120 千米，气温为什么先降、再升、又降？'],
    keys: [
      ['Dry clean air is mostly nitrogen (78%) and oxygen (21%); CO₂ keeps the surface warm, ozone absorbs ultraviolet light, and water vapour and dust make clouds and rain.', '干洁空气主要是氮（78%）和氧（21%）；二氧化碳使气温升高，臭氧吸收紫外线，水汽和杂质是成云致雨的必要条件。'],
      ['Troposphere: heated from the ground, so it cools about 0.6 °C every 100 m; strong convection, all the weather; 17–18 km thick at low latitudes, 8–9 km at high latitudes.', '对流层：热量来自地面，气温随高度增加而递减（约 0.6 °C/100 米）；对流运动显著，天气现象复杂多变；低纬厚 17–18 千米，高纬 8–9 千米。'],
      ['Stratosphere: ozone absorbs UV, so it warms with height; the air is stable and moves mostly horizontally, which suits high-altitude flight.', '平流层：臭氧吸收紫外线，气温随高度增加而升高；大气稳定，以水平运动为主，有利于高空飞行。'],
      ['Upper atmosphere: the ionosphere reflects radio waves for long-distance communication; aurorae glow there.', '高层大气：电离层能反射无线电波，对无线电通信有重要作用；极光也出现在这里。'],
      ['People change the air: CO₂ has risen from about 280 to 420 ppm, and CFCs thinned the ozone layer (the Antarctic ozone hole), now slowly healing.', '人类活动改变大气组成：二氧化碳浓度由约 280 ppm 升至约 420 ppm；氟氯烃破坏臭氧层（南极臭氧空洞），目前正缓慢恢复。'],
    ],
    steps: [
      {
        title: ['What air is made of', '大气的组成'], astro: { kit: 'air', mode: 'layers' },
        fig: { k: 'pie', title: ['Dry clean air near the ground (by volume)', '低层大气中干洁空气的成分（体积分数）'], parts: [
          { name: ['Nitrogen N₂', '氮气 N₂'], v: 78, c: '#4dabf7' }, { name: ['Oxygen O₂', '氧气 O₂'], v: 21, c: '#63e6be' },
          { name: ['Argon, CO₂ and others', '氩、二氧化碳等'], v: 1, c: '#ffd43b' }] },
        body: ['The air near the ground is a mixture of dry clean air, water vapour and solid impurities. Nitrogen (78%) is a basic element of living things; oxygen (21%) is what we breathe. Carbon dioxide is only about 0.04%, yet it feeds photosynthesis and absorbs the ground\'s heat, warming the air. Ozone is rarer still, but it absorbs the Sun\'s ultraviolet light, a shield for life. Water vapour and dust (the nuclei that droplets form on) are what clouds and rain need.',
          '低层大气由干洁空气、水汽和杂质组成。氮（78%）是生物体的基本元素；氧（21%）是人类和其他生物维持生命活动所必需的。二氧化碳只占约 0.04%，却是植物光合作用的原料，还能吸收地面辐射，使气温升高。臭氧含量更少，但能吸收太阳紫外线，被誉为“地球生命的保护伞”。水汽和杂质（作为凝结核）是成云致雨的必要条件。'],
      },
      {
        title: ['Troposphere: where the weather is', '对流层：天气现象发生的地方'], astro: { kit: 'air', mode: 'layers', alt: 6 },
        body: ['The air is heated mainly by the ground, not by the Sun directly, so the higher you go the colder it gets: about 0.6 °C for every 100 m. Warm air below and cold air above makes convection strong. Almost all the water vapour and dust is here, so clouds, rain and snow happen here. The layer is 17–18 km thick over the tropics, where heating and convection are strongest, and only 8–9 km over the poles.',
          '对流层大气的热量主要直接来自地面，所以离地面越高，气温越低：海拔每升高 100 米，气温约下降 0.6 °C。下热上冷，对流运动显著。几乎全部的水汽和杂质都集中在这一层，云、雨、雪等天气现象都发生在这里。低纬度地区受热多、对流旺盛，对流层厚 17–18 千米；高纬度地区只有 8–9 千米。'],
      },
      {
        title: ['Stratosphere: warmer as you climb', '平流层：气温随高度增加而升高'], astro: { kit: 'air', mode: 'layers', alt: 30 },
        body: ['Above the tropopause the temperature first stays level, then rises: the ozone layer (about 20–30 km) absorbs ultraviolet light and warms this layer from within. Warm air above cold air is stable, so the air moves mostly sideways, and with almost no vapour there are no clouds: smooth, clear skies that suit airliners flying high.',
          '对流层顶以上，气温先基本不变，随后随高度增加而升高：臭氧层（约 20–30 千米高处）吸收太阳紫外线，使这一层增温。上热下冷，大气稳定，以水平运动为主；水汽、杂质极少，云雨现象近于绝迹，天气晴朗，有利于高空飞行。'],
      },
      {
        title: ['The upper atmosphere', '高层大气'], astro: { kit: 'air', mode: 'layers', alt: 100 },
        body: ['Above 50 km the air is extremely thin. The temperature falls again, then rises once more as the gas absorbs the Sun\'s hardest radiation. Between about 80 and 500 km some of the gas is ionised: this ionosphere reflects radio waves, so short-wave radio can travel around the curve of the Earth. Charged particles from the Sun make the aurora glow here, and most meteors burn up on the way down.',
          '平流层顶以上是高层大气，空气极其稀薄。气温先随高度增加而降低，后又升高。在 80–500 千米高空有若干电离层，能反射无线电波，对无线电短波通信有重要作用。来自太阳的带电粒子在这里形成极光，大多数流星体也在高层大气中燃烧殆尽。'],
      },
      {
        title: ['People change the air', '人类活动对大气的影响'], cam: [-72, 30, 3.4], wide: true, sketch: true,
        paint: [{ fill: { k: 'band', s: -90, n: -63, c: C.violet }, a: 0.4, t: 0.4 }],
        marks: [mk([-78, 30], 'Ozone hole: each September–October', '臭氧空洞：每年 9—10 月', { big: true, c: C.violet, t: 0.8 })],
        fig: {
          k: 'line', title: ['Carbon dioxide in the air (Mauna Loa, Hawaii)', '大气中二氧化碳浓度（夏威夷冒纳罗亚观测站）'], unit: ['ppm · year', 'ppm · 年'],
          x: [1960, 1970, 1980, 1990, 2000, 2010, 2020, 2023], min: 300, max: 430,
          series: [{ name: ['CO₂', '二氧化碳'], c: C.gold, y: [317, 326, 339, 354, 370, 390, 414, 421] }],
          notes: [{ x: 1960, text: ['Before 1800: about 280 ppm', '工业革命前约 280 ppm'] }],
        },
        body: ['People are changing what the air is made of. Burning coal, oil and gas and clearing forests have raised carbon dioxide from about 280 ppm (parts per million) before 1800 to about 420 ppm today, strengthening the greenhouse effect. Chlorofluorocarbons (CFCs), once used in fridges and sprays, drifted up to the stratosphere and destroyed ozone: since the 1980s an "ozone hole" has opened over Antarctica every spring (September–October), often larger than North America. The 1987 Montreal Protocol phased CFCs out, and the ozone layer is slowly healing; over Antarctica it should be back to its 1980 state around 2066.',
          '人类活动正在改变大气的组成。燃烧煤、石油、天然气和毁林，使大气中二氧化碳浓度从工业革命前的约 280 ppm（百万分之一）升至如今的约 420 ppm，温室效应增强。冰箱、喷雾剂中曾大量使用的氟氯烃进入平流层，破坏臭氧：20 世纪 80 年代以来，每年南半球春季（9—10 月），南极上空都会出现“臭氧空洞”，面积常超过北美洲。1987 年《蒙特利尔议定书》逐步淘汰了氟氯烃，臭氧层正在缓慢恢复，南极上空预计在 2066 年前后恢复到 1980 年的水平。'],
      },
      {
        title: ['Lab: climb through the atmosphere', '实验：穿越大气层'],
        astro: {
          kit: 'air', mode: 'layers',
          params: [
            { id: 'alt', name: ['Altitude', '高度'], min: 0, max: 120, value: 0, step: 0.5, fmt: ['{v} km', '{v} 千米'], dp: 1 },
            { id: 'lat', name: ['Latitude', '纬度'], min: 0, max: 90, value: 40, step: 1, fmt: ['{v}°', '{v}°'] },
          ],
          tasks: [
            { text: ['Find the tropopause over the equator (latitude 0–10°).', '找到赤道上空（纬度 0–10°）的对流层顶。'], done: p => p.lat <= 10 && Math.abs(p.alt - tropopause(p.lat)) <= 1.2 },
            { text: ['Find the tropopause over a polar region (latitude 70° or more).', '找到极地上空（纬度 70° 以上）的对流层顶。'], done: p => p.lat >= 70 && Math.abs(p.alt - tropopause(p.lat)) <= 1.2 },
            { text: ['Find the warmest point of the stratosphere.', '找到平流层中气温最高的位置。'], done: p => p.alt >= 48 && p.alt <= 52 },
          ],
        },
        task: ['Drag the altitude and watch the temperature and pressure. Then change the latitude: how does the troposphere\'s thickness change?', '拖动高度，观察气温和气压的变化；再改变纬度，看看对流层的厚度怎样变化。'],
        body: ['The readout shows the temperature, the pressure and the layer at your height. Pressure halves roughly every 5 km: at 50 km only about a thousandth of the air is left above you. The tropopause is where the temperature stops falling; it is higher over warm low latitudes.',
          '读数显示所在高度的气温、气压和所属的层。气压大约每升高 5 千米减少一半：到 50 千米高处，头顶上的空气只剩约千分之一。气温停止下降的高度就是对流层顶，低纬度地区的对流层顶更高。'],
      },
    ],
    quiz: [
      {
        q: ['The ground is 26 °C. At about 0.6 °C per 100 m, what is the temperature 3,000 m up in the troposphere?', '地面气温 26 °C。按每升高 100 米气温下降约 0.6 °C 计算，对流层中 3000 米高处的气温约是多少？'],
        num: { answer: 8, tol: 0.6, unit: ['°C', '°C'] },
        why: ['3,000 m is 30 × 100 m, so it is 30 × 0.6 = 18 °C colder: 26 − 18 = 8 °C.', '3000 米是 30 个 100 米，气温下降 30 × 0.6 = 18 °C，26 − 18 = 8 °C。'],
      },
      {
        q: ['A mountain top is 12 °C colder than its foot. About how much higher is it (in metres)?', '某山山顶气温比山麓低 12 °C，山顶比山麓约高多少米？'],
        num: { answer: 2000, tol: 100, unit: ['m', '米'] },
        why: ['12 ÷ 0.6 = 20 lots of 100 m, so about 2,000 m.', '12 ÷ 0.6 = 20，即 20 个 100 米，约 2000 米。'],
      },
      {
        q: ['Put these in order from the lowest to the highest.', '按高度从低到高排序。'],
        order: [['Summit of Mount Everest', '珠穆朗玛峰峰顶'], ['Tropopause over the equator', '赤道上空的对流层顶'], ['Ozone layer', '臭氧层'], ['Ionosphere', '电离层']],
        why: ['Everest is 8.8 km; the equatorial tropopause is at 17–18 km; the ozone layer is about 20–30 km up; the ionosphere starts around 80 km.', '珠峰高 8.8 千米；赤道上空的对流层顶高 17–18 千米；臭氧层约在 20–30 千米；电离层在约 80 千米以上。'],
      },
      {
        q: ['Match each part of the air with its role.', '把大气成分与它的作用连起来。'],
        match: [
          [['Nitrogen', '氮'], ['A basic element of living things', '生物体内蛋白质的重要组成部分']],
          [['Carbon dioxide', '二氧化碳'], ['Raw material of photosynthesis; warms the air', '光合作用的原料；使气温升高']],
          [['Ozone', '臭氧'], ['Absorbs ultraviolet light', '吸收紫外线']],
          [['Dust and other impurities', '杂质'], ['Nuclei for cloud droplets', '作为凝结核，成云致雨']],
        ],
        why: ['Each component matters out of all proportion to its share: CO₂ and ozone are tiny fractions of the air.', '各成分的作用与含量并不成比例：二氧化碳和臭氧含量都很少，作用却很大。'],
      },
      {
        q: ['Why does the temperature fall with height in the troposphere?', '对流层气温为什么随高度增加而递减？'],
        options: [['The ground is the direct heat source of the air near it', '地面是对流层大气的直接热源'], ['The Sun is farther away at height', '高处离太阳更远'], ['Ozone cools the air', '臭氧使空气降温'], ['Clouds block the sunlight', '云层阻挡了阳光']],
        answer: 0,
        why: ['The air absorbs little sunlight directly; it is heated by the ground\'s radiation, so the farther from the ground, the colder.', '大气直接吸收的太阳辐射很少，主要靠吸收地面辐射增温，所以离地面越远，气温越低。'],
      },
      {
        q: ['Which are true of the stratosphere? Choose all.', '下列关于平流层的说法，正确的有（多选）'],
        options: [['It warms with height', '气温随高度增加而升高'], ['Its air moves mostly horizontally', '大气以水平运动为主'], ['It suits high-altitude flight', '有利于高空飞行'], ['Clouds and rain are common there', '云雨现象多'], ['It reflects radio waves', '能反射无线电波']],
        multi: [0, 1, 2],
        why: ['Ozone warms it from within, so it is stable and clear. Clouds belong to the troposphere; radio waves bounce off the ionosphere.', '臭氧吸收紫外线使其增温，大气稳定、天气晴朗。云雨发生在对流层；反射无线电波的是高层大气中的电离层。'],
      },
      {
        q: ['What mainly made the ozone hole over Antarctica?', '南极上空出现“臭氧空洞”，主要原因是'],
        options: [['CFCs from fridges and sprays destroying stratospheric ozone', '人类排放的氟氯烃破坏了平流层中的臭氧'], ['Carbon dioxide from burning coal', '燃煤排放的二氧化碳'], ['Volcanic ash blocking sunlight', '火山灰遮挡了阳光'], ['Too little water vapour over Antarctica', '南极上空水汽太少']],
        answer: 0,
        why: ['CFCs release chlorine in the cold Antarctic stratosphere each spring, which breaks ozone apart; CO₂ affects the greenhouse effect, not the ozone layer.', '氟氯烃在南极平流层释放出氯原子，破坏臭氧；二氧化碳增多增强的是温室效应，而不是破坏臭氧层。'],
      },
    ],
  },
  // ——— 2. how the atmosphere is heated ———
  {
    id: 'h-heating', strand: 'climate', grade: 'h1', tracks: [], unit: ATMOS, icon: 'sun', minutes: 15,
    title: ['How the atmosphere is heated', '大气的受热过程'],
    blurb: ['Sunlight warms the ground, the ground warms the air, the air sends warmth back: why clear nights are frosty and Tibet is sunny but cold.', '太阳暖大地，大地暖大气，大气还大地：为什么晴朗的夜晚多霜冻，青藏高原阳光强却气温低？'],
    keys: [
      ['Short-wave sunlight passes through the air and warms the ground; the ground gives off long-wave radiation, which the air (water vapour, CO₂) absorbs: the ground is the air\'s direct heat source.', '太阳短波辐射大部分透过大气到达地面，使地面增温；地面以长波辐射的形式向大气传递热量，大气中的水汽、二氧化碳强烈吸收，地面是近地面大气主要的直接热源。'],
      ['The air weakens sunlight by absorbing (ozone: UV; vapour, CO₂: infrared), reflecting (clouds) and scattering (blue light: blue sky).', '大气对太阳辐射有削弱作用：吸收（臭氧吸收紫外线，水汽、二氧化碳吸收红外线）、反射（云层）、散射（蓝紫光，晴空蔚蓝）。'],
      ['The air\'s counter-radiation returns heat to the ground and keeps it warm.', '大气逆辐射把热量还给地面，对地面起保温作用。'],
      ['Clear skies: strong sunshine by day, weak counter-radiation at night, so a big day–night range and frosts on clear nights; clouds do the opposite.', '晴天白天削弱作用弱、夜晚保温作用弱，昼夜温差大，霜冻多出现在晴朗的夜晚；多云则相反。'],
      ['More greenhouse gases strengthen the counter-radiation: the world is about 1.1 °C warmer than in 1850–1900.', '温室气体增多，大气逆辐射增强，全球气候变暖：2011—2020 年全球平均气温比 1850—1900 年升高约 1.1 °C。'],
    ],
    steps: [
      {
        title: ['Sun → ground → air → ground', '太阳暖大地，大地暖大气，大气还大地'], astro: { kit: 'air', mode: 'heating', part: 'flow' },
        body: ['The Sun is very hot, so it shines in short waves, which the air lets through easily: most sunlight reaches and warms the ground ①②. The warm ground radiates in long waves ③, and these the air\'s water vapour and CO₂ absorb strongly ④: the air is heated from below. The warmed air radiates too; the part aimed back down is the counter-radiation ⑤, which returns heat to the ground and keeps it warm.',
          '太阳温度很高，以短波辐射为主，大气直接吸收得很少，大部分太阳辐射透过大气射到地面，使地面增温①②。地面增温后以长波辐射的形式向外传递热量③，近地面大气中的水汽和二氧化碳强烈吸收地面辐射而增温④：地面是近地面大气主要的直接热源。大气增温后也向外辐射，其中射向地面的部分叫大气逆辐射⑤，它把热量还给地面，对地面起保温作用。'],
      },
      {
        title: ['How the air weakens sunlight', '大气对太阳辐射的削弱作用'], astro: { kit: 'air', mode: 'heating', part: 'weaken' },
        body: ['On its way down, sunlight is weakened three ways. Absorption is selective: ozone takes the ultraviolet high up, vapour and CO₂ take infrared, and little visible light is absorbed. Reflection is not selective: clouds, especially thick low ones, bounce light back to space. Scattering by air molecules works best on short blue and violet light, which is why a clear sky is blue.',
          '太阳辐射穿过大气时受到三种削弱作用。吸收具有选择性：平流层中的臭氧吸收紫外线，对流层中的水汽和二氧化碳吸收红外线，对可见光吸收很少。反射没有选择性：云层越厚、云量越多，反射越强。散射：空气分子对波长较短的蓝紫光散射最强，所以晴朗的天空呈蔚蓝色。'],
      },
      {
        title: ['Clear skies, big swings', '晴天昼夜温差大'], cam: [18, 30, 3.2], wide: true, sketch: true,
        paint: [{ fill: { k: 'climate', only: ['desert', 'rainforest'] }, a: 0.75 }],
        marks: [
          mk([24, 10], 'Sahara: clear sky, day 40 °C, night 15 °C', '撒哈拉：晴空，白天 40 °C，夜晚 15 °C', { dot: true, c: C.gold, t: 0.4 }),
          mk([0, 22], 'Congo Basin: cloudy, day 31 °C, night 22 °C', '刚果盆地：多云，白天 31 °C，夜晚 22 °C', { dot: true, c: C.green, t: 0.9 }),
        ],
        fig: { k: 'dia', id: 'greenhouse' },
        body: ['In the clear, dry desert little sunlight is weakened by day, so the ground gets very hot; at night, with few clouds and little vapour, counter-radiation is weak and the heat escapes to space. Under the cloudy rainforest sky the clouds reflect sunlight by day and send heat back at night, so the day–night range is small. The same reason makes frost most likely on clear, still nights, and farmers light smoky fires to add CO₂ and soot and protect their crops.',
          '沙漠地区晴朗干燥，白天大气对太阳辐射的削弱作用弱，地面增温快、气温高；夜晚云少、水汽少，大气逆辐射弱，保温作用弱，气温降得很低。热带雨林地区多云，白天云层反射强，夜晚逆辐射强，所以昼夜温差小。同样的道理，霜冻多出现在晴朗无风的夜晚；农民在寒潮来临前燃烧柴草制造烟雾，增加二氧化碳和烟尘，增强大气逆辐射，防御霜冻。'],
      },
      {
        title: ['The Tibetan Plateau: sunny but cold', '青藏高原：太阳辐射强，气温却低'], cam: [31, 90, 2.4], wide: true,
        marks: [mk([29.65, 91.1], 'Lhasa, 3,650 m: “City of Sunlight”', '拉萨（海拔 3650 米）：“日光城”', { dot: true, c: C.gold, t: 0.4 })],
        fig: { k: 'climo', city: 'lhasa' },
        body: ['The plateau is over 4,000 m high. The air above it is thin, clean and dry, so it weakens sunlight little: the sunshine is the strongest in China, and Lhasa gets about 3,000 hours of it a year. But thin air holds little vapour and CO₂, so it absorbs little of the ground\'s radiation and gives back little counter-radiation. The plateau stays cold, with big swings between day and night.',
          '青藏高原平均海拔 4000 米以上，空气稀薄、洁净、水汽少，大气对太阳辐射的削弱作用弱，太阳辐射强，是我国太阳辐射最强的地区，拉萨年日照时数约 3000 小时。但空气稀薄，水汽和二氧化碳少，大气吸收的地面辐射少，大气逆辐射弱，保温作用弱，所以气温低，昼夜温差大。'],
      },
      {
        title: ['A thicker blanket: global warming', '保温作用增强：全球变暖'], astro: { kit: 'air', mode: 'heating', part: 'flow' },
        fig: {
          k: 'line', title: ['Global surface temperature (NASA, compared with 1951–1980)', '全球地表平均气温距平（NASA，相对 1951—1980 年）'], unit: ['°C · year', '°C · 年'],
          x: [1880, 1900, 1920, 1940, 1960, 1980, 2000, 2010, 2020, 2023], min: -0.4, max: 1.3,
          series: [{ name: ['Temperature anomaly', '气温距平'], c: C.red, y: [-0.16, -0.07, -0.27, 0.12, -0.03, 0.26, 0.39, 0.72, 1.01, 1.17] }],
        },
        body: ['The keeping-warm effect is natural and vital: without the counter-radiation from water vapour and CO₂ the Earth\'s surface would average about −18 °C instead of about 15 °C. Adding greenhouse gases thickens this blanket: the air absorbs more of the ground\'s long-wave radiation ④ and sends more back as counter-radiation ⑤, so the surface warms. In 2011–2020 the world was about 1.1 °C warmer than in 1850–1900; glaciers are shrinking and the sea has risen about 20 cm since 1900. Cutting emissions and planting forests, which take up CO₂, are the main answers.',
          '大气的保温作用是自然的，也是必需的：如果没有水汽和二氧化碳的大气逆辐射，地表平均气温将是约 −18 °C，而不是现在的约 15 °C。温室气体增多，相当于给地球“加厚了棉被”：大气吸收的地面长波辐射④增多，大气逆辐射⑤增强，地表增温。2011—2020 年全球平均气温比 1850—1900 年升高约 1.1 °C，冰川退缩，1900 年以来海平面上升了约 20 厘米。减少温室气体排放、植树造林增加碳吸收，是应对全球变暖的主要措施。'],
      },
      {
        title: ['Lab: clouds and height', '实验：云量与海拔'],
        astro: {
          kit: 'air', mode: 'heating', part: 'lab',
          params: [
            { id: 'cloud', name: ['Cloud cover', '云量'], min: 0, max: 100, value: 50, step: 5, fmt: ['{v}%', '{v}%'] },
            { id: 'elev', name: ['Elevation', '海拔'], min: 0, max: 5000, value: 0, step: 100, fmt: ['{v} m', '{v} 米'] },
          ],
          tasks: [
            { text: ['Make the day–night range at least 20 °C.', '让昼夜温差达到 20 °C 以上。'], done: p => { const m = heatLab(p.cloud, p.elev); return m.hi - m.lo >= 20; } },
            { text: ['Make the night as warm as you can: a low of 17.5 °C or more.', '让夜晚尽量暖和：最低气温不低于 17.5 °C。'], done: p => heatLab(p.cloud, p.elev).lo >= 17.5 },
          ],
        },
        task: ['Change the cloud cover and the elevation, and read the two thermometers.', '改变云量和海拔，读一读两支温度计。'],
        body: ['Clouds cut the sunshine reaching the ground by day and strengthen the counter-radiation at night. Climbing higher thins the air: sunshine gets stronger, but the air keeps less heat. A greenhouse works like extra-thick air: short-wave sunlight passes through the plastic, while the long-wave heat from the soil is kept in, so vegetables grow in winter.',
          '白天云层削弱到达地面的太阳辐射，夜晚云层增强大气逆辐射。海拔越高，空气越稀薄：太阳辐射越强，但大气的保温作用越弱。温室大棚的道理相似：太阳短波辐射可以透过塑料薄膜，而地面长波辐射却很难透出，热量被保留在棚内，冬季也能种植蔬菜。'],
      },
    ],
    quiz: [
      {
        q: ['Put the heating of the atmosphere in order.', '把大气的受热过程排序。'],
        order: [['Sunlight passes through the air', '太阳辐射透过大气'], ['The ground absorbs it and warms', '地面吸收太阳辐射而增温'], ['The ground gives off long-wave radiation', '地面辐射'], ['The air absorbs it and warms', '大气吸收地面辐射而增温'], ['Counter-radiation returns heat to the ground', '大气逆辐射把热量还给地面']],
        why: ['Sun warms the ground, the ground warms the air, and the air gives some heat back to the ground.', '太阳暖大地，大地暖大气，大气还大地。'],
      },
      {
        q: ['Match each observation with its cause.', '把现象与原因连起来。'],
        match: [
          [['A clear sky is blue', '晴朗的天空呈蔚蓝色'], ['Scattering of blue light', '大气对蓝紫光的散射']],
          [['Cloudy days are not very hot', '多云的白天气温不太高'], ['Clouds reflect sunlight', '云层的反射作用']],
          [['Frost forms on clear nights', '霜冻多出现在晴朗的夜晚'], ['Weak counter-radiation', '大气逆辐射弱']],
          [['Strong sunshine on the Tibetan Plateau', '青藏高原太阳辐射强'], ['Thin air weakens sunlight little', '空气稀薄，削弱作用弱']],
        ],
        why: ['Each one is part of the same process: what the air does to sunlight on the way down, and to the ground\'s heat on the way up.', '都可以用大气的受热过程解释：大气对太阳辐射的削弱作用，以及对地面的保温作用。'],
      },
      {
        q: ['Lhasa has some of the strongest sunshine in China, yet it is cool. Why?', '拉萨太阳辐射很强，气温却较低，主要原因是'],
        options: [['Thin air absorbs little ground radiation and keeps little heat', '空气稀薄，大气吸收的地面辐射少，保温作用弱'], ['Lhasa gets less sunshine than the plains', '拉萨获得的太阳辐射少'], ['The plateau reflects all the sunlight', '高原地面把阳光全部反射'], ['Lhasa is at a high latitude', '拉萨纬度高']],
        answer: 0,
        why: ['High up, the air is too thin to absorb the ground\'s long-wave radiation and return it, so the heat escapes.', '海拔高，空气稀薄，大气吸收的地面辐射少，大气逆辐射弱，热量容易散失。'],
      },
      {
        q: ['Which would make a winter night warmer? Choose all.', '下列做法或现象，能使冬季夜晚气温不致过低的有（多选）'],
        options: [['A cloudy sky', '天空多云'], ['Burning damp straw to make smoke', '燃烧柴草制造烟雾'], ['Covering the field with plastic film', '覆盖塑料薄膜'], ['A clear, dry sky', '天气晴朗干燥'], ['A strong cold, dry wind', '干冷的大风']],
        multi: [0, 1, 2],
        why: ['Clouds, smoke (CO₂ and soot) and plastic film all keep the ground\'s heat in; clear dry air lets it escape.', '云、烟雾（二氧化碳和烟尘）、薄膜都能增强保温作用；晴朗干燥则保温作用弱。'],
      },
      {
        q: ['What is the direct heat source of the air near the ground?', '近地面大气主要的直接热源是'],
        options: [['Ground radiation', '地面辐射'], ['Solar radiation', '太阳辐射'], ['Counter-radiation', '大气逆辐射'], ['The Earth\'s interior', '地球内部的热量']],
        answer: 0,
        why: ['The air absorbs little short-wave sunlight but most of the ground\'s long-wave radiation.', '大气对太阳短波辐射吸收很少，对地面长波辐射吸收很多。'],
      },
      {
        q: ['Why is a plastic greenhouse warm in winter?', '冬季温室大棚内温度较高，是因为'],
        options: [['Short-wave sunlight gets in; long-wave heat cannot get out', '太阳短波辐射可以透入，地面长波辐射难以透出'], ['The plastic produces heat', '塑料薄膜本身能产生热量'], ['The plastic blocks the sunlight', '薄膜阻挡了太阳辐射'], ['Plants give off heat at night', '植物夜间放出大量热量']],
        answer: 0,
        why: ['Like thick air, the film lets short waves in and keeps long waves in.', '薄膜像大气一样，让短波辐射进来，把长波辐射留住。'],
      },
      {
        q: ['A plain at 500 m averages 16 °C. If the air simply cooled 0.6 °C per 100 m, what would Lhasa, at 3,650 m, average?', '某平原海拔 500 米，年均温 16 °C。若只按每升高 100 米降温 0.6 °C 计算，海拔 3650 米的拉萨年均温应约为多少？'],
        num: { answer: -2.9, tol: 0.5, unit: ['°C', '°C'] },
        why: ['3,650 − 500 = 3,150 m, so 31.5 × 0.6 ≈ 18.9 °C colder: 16 − 18.9 ≈ −2.9 °C. Lhasa really averages about 8 °C, because the high plateau surface itself heats the thin air above it.', '高差 3650 − 500 = 3150 米，降温 31.5 × 0.6 ≈ 18.9 °C，16 − 18.9 ≈ −2.9 °C。拉萨实际年均温约 8 °C，因为高原地面本身就是其上空大气的直接热源。'],
      },
    ],
  },
  // ——— 3. thermal circulation ———
  {
    id: 'h-thermal', strand: 'climate', grade: 'h1', tracks: [], unit: ATMOS, icon: 'sail', minutes: 15,
    title: ['Thermal circulation', '热力环流'],
    blurb: ['Warm air rises, cool air sinks, and the wind blows between them: sea breezes, valley breezes and the city\'s own wind.', '受热上升，冷却下沉，水平方向由高压流向低压：海陆风、山谷风和城市风。'],
    keys: [
      ['Uneven heating → air rises over the warm place and sinks over the cool one → pressure differs along the same level → air flows from high to low pressure: a thermal circulation.', '地面冷热不均→空气垂直运动（热上升、冷下沉）→同一水平面上产生气压差异→空气水平运动（由高压流向低压），形成热力环流。'],
      ['Near the ground the warm place has low pressure and the cool place high pressure; aloft it is the other way round.', '近地面受热处形成低压、冷却处形成高压；高空则相反。'],
      ['Isobaric surfaces bulge up over high pressure and dip over low pressure.', '等压面向上凸处为高压，向下凹处为低压。'],
      ['Sea breeze by day, land breeze at night; valley breeze by day, mountain breeze at night; the urban breeze blows from suburbs into the city.', '白天吹海风、夜晚吹陆风；白天吹谷风、夜晚吹山风；城市风在近地面由郊区吹向城市。'],
    ],
    steps: [
      {
        title: ['Warm air rises, cool air sinks', '热上升，冷下沉'], astro: { kit: 'air', mode: 'thermal', scene: 'plain', left: 30, right: 14 },
        body: ['Ground A is heated more than ground B. Over A the air expands and rises; it piles up aloft, so pressure aloft is high while pressure near the ground drops. Over B the air cools, shrinks and sinks: near the ground it piles up into high pressure, and aloft the pressure is low. Along each level the air then flows from high to low pressure: near the ground from B to A, aloft from A to B. That loop is a thermal circulation, the simplest form of air motion.',
          'A 地受热多，近地面空气膨胀上升，在高空堆积，高空形成高压，近地面形成低压；B 地冷却，空气收缩下沉，近地面堆积形成高压，高空形成低压。同一水平面上，空气由高压流向低压：近地面由 B 流向 A，高空由 A 流向 B，于是形成热力环流。这是大气运动最简单的形式。'],
      },
      {
        title: ['Reading isobaric surfaces', '等压面的弯曲'], astro: { kit: 'air', mode: 'thermal', scene: 'plain', left: 14, right: 30 },
        body: ['An isobaric surface joins points of equal pressure. Where the pressure is high it bulges upwards; where it is low it dips. Now B is the warm one: near the ground the surface dips over B (low pressure) and bulges over A (high); aloft it is reversed. The rule "warm: low below, high above" also tells you which way the wind blows at each level.',
          '等压面是气压相等的各点连成的面。气压高处等压面向上凸，气压低处向下凹。现在 B 地受热：近地面 B 处等压面下凹（低压），A 处上凸（高压）；高空正好相反。“热低冷高”（指近地面）的规律能帮你判断各层风向。'],
      },
      {
        title: ['Sea and land breezes', '海陆风'], astro: { kit: 'air', mode: 'thermal', scene: 'sea', clock: { from: 0, to: 24, rate: 1.2, unit: 'hour', at: 10 / 24 } },
        body: ['Land heats up and cools down much faster than water. By day the land is warmer, so the air rises over it and a sea breeze blows from the sea onto the land, bringing cool, moist air to the coast. At night the land is the cooler one, the circulation reverses, and a land breeze blows out to sea. Watch the clock: the switch comes in the morning and the evening.',
          '陆地比海洋升温快、降温也快。白天陆地气温高，空气上升，近地面形成低压，风从海洋吹向陆地，形成海风，给沿海带来凉爽湿润的空气；夜晚陆地降温快，气温比海洋低，环流方向反过来，风从陆地吹向海洋，形成陆风。看看时钟：早晨和傍晚风向发生转换。'],
      },
      {
        title: ['Lab: make the breeze', '实验：制造海风和陆风'],
        astro: {
          kit: 'air', mode: 'thermal', scene: 'sea',
          params: [
            { id: 'left', name: ['Sea temperature', '海洋气温'], min: 0, max: 40, value: 20, step: 1, fmt: ['{v} °C', '{v} °C'] },
            { id: 'right', name: ['Land temperature', '陆地气温'], min: 0, max: 40, value: 20, step: 1, fmt: ['{v} °C', '{v} °C'] },
          ],
          tasks: [
            { text: ['Make a sea breeze (as on a sunny afternoon).', '制造海风（像晴朗的午后）。'], done: p => p.right - p.left >= 4 },
            { text: ['Reverse it: make a land breeze (as on a clear night).', '让环流反转：制造陆风（像晴朗的夜晚）。'], done: p => p.left - p.right >= 4 },
          ],
        },
        task: ['Set the two temperatures. Watch where the air rises and which way the surface wind blows.', '设置两边的气温，观察空气在哪里上升、近地面风向怎样。'],
        body: ['With the same temperature on both sides nothing moves. The bigger the difference, the faster the circulation. The air always rises over the warmer side, so near the ground the wind blows towards it.',
          '两边气温相同时，空气不会形成环流。温差越大，环流越强。空气总在较热的一侧上升，所以近地面的风总是吹向较热的一侧。'],
      },
      {
        title: ['Valley and mountain breezes', '山谷风'], astro: { kit: 'air', mode: 'thermal', scene: 'valley', clock: { from: 0, to: 24, rate: 1.2, unit: 'hour', at: 13 / 24 } },
        body: ['By day the slopes warm faster than the air at the same height over the valley, so air climbs the slopes: a valley breeze. At night the slopes cool faster; the cold air slides down into the valley as a mountain breeze and lifts the warmer valley air, which is why valleys and basins (the Sichuan Basin, the Yarlung Zangbo valley) get much of their rain at night.',
          '白天山坡增温快，山坡上的空气比同高度谷地上空的空气温度高，空气沿山坡上升，风从谷地吹向山坡，形成谷风。夜晚山坡降温快，冷空气沿山坡下滑流入谷地，形成山风，并把谷地中较暖的空气抬升，容易成云致雨，所以四川盆地、雅鲁藏布江谷地等地多夜雨。'],
      },
      {
        title: ['The urban heat island', '城市热岛环流'], astro: { kit: 'air', mode: 'thermal', scene: 'city', heat: 3 },
        body: ['Factories, cars, air conditioners and dark roofs make a city warmer than its suburbs: a heat island. Air rises over the city and an urban breeze blows in from the suburbs near the ground. Planners put green belts inside the loop, where the air sinks back to the ground, to cool and clean the air flowing into the city, and put polluting factories and satellite towns beyond it, so their smoke is not carried into the centre.',
          '城市中工厂、汽车、空调排放大量废热，加上建筑和路面吸热多，城市气温比郊区高，形成城市热岛。城市空气上升，近地面风从郊区吹向城市，形成城市风。绿化带布局在气流下沉处（环流以内），可以净化和冷却流入城市的空气；有污染的工厂和卫星城应布局在城市风环流之外，以免污染物被吹进市区。'],
      },
    ],
    quiz: [
      {
        q: ['A is 32 °C and B is 18 °C. Tap where the pressure near the ground is highest.', 'A 地 32 °C，B 地 18 °C。点出近地面气压最高的位置。'],
        astro: { kit: 'air', mode: 'thermal', scene: 'plain', left: 32, right: 18, bare: true }, pick: 'sfc-right',
        why: ['The cooler place has sinking air piling up near the ground: high pressure near the ground over B.', '较冷的 B 地空气下沉，在近地面堆积，形成高压。'],
      },
      {
        q: ['Now B is the warmer one. Tap where the pressure aloft is highest.', '现在 B 地较热。点出高空气压最高的位置。'],
        astro: { kit: 'air', mode: 'thermal', scene: 'plain', left: 16, right: 30, bare: true }, pick: 'up-right',
        why: ['Air rises over warm B and piles up aloft: high pressure above B.', '受热的 B 地空气上升，在高空堆积，高空形成高压。'],
      },
      {
        q: ['Put the formation of a thermal circulation in order.', '把热力环流的形成过程排序。'],
        order: [['The ground is heated unevenly', '地面冷热不均'], ['Air rises in one place and sinks in another', '空气垂直运动（上升或下沉）'], ['Pressure differs along the same level', '同一水平面上产生气压差异'], ['Air flows sideways from high to low pressure', '空气水平运动，由高压流向低压']],
        why: ['Heating comes first; the vertical motion makes the pressure differences; those drive the wind.', '冷热不均是根本原因，垂直运动产生气压差，气压差推动水平运动。'],
      },
      {
        q: ['Match each breeze with when and where it blows.', '把风与它出现的时间和方向连起来。'],
        match: [
          [['Sea breeze', '海风'], ['By day, from sea to land', '白天，由海洋吹向陆地']],
          [['Land breeze', '陆风'], ['At night, from land to sea', '夜晚，由陆地吹向海洋']],
          [['Valley breeze', '谷风'], ['By day, up the slopes', '白天，由谷地吹向山坡']],
          [['Mountain breeze', '山风'], ['At night, down into the valley', '夜晚，由山坡吹向谷地']],
        ],
        why: ['In each case the wind near the ground blows towards whichever side is warmer at the time.', '近地面的风总是吹向当时较热的一侧。'],
      },
      {
        q: ['Where should a polluting factory go, relative to a city\'s heat-island circulation?', '有大气污染的工厂应布局在'],
        options: [['Beyond the circulation, where the urban breeze cannot carry smoke into the city', '城市风环流之外'], ['Where the air sinks inside the loop', '城市风环流的下沉处'], ['In the city centre', '市中心'], ['Anywhere upwind in the suburbs', '郊区任意位置']],
        answer: 0,
        why: ['Inside the loop the urban breeze would carry its smoke straight into the city; the sinking zone is for green belts.', '在环流以内，城市风会把污染物带进市区；环流下沉处适合布局绿化带。'],
      },
      {
        q: ['Which are true near the ground over a place that has been heated? Choose all.', '近地面受热的地方（多选）'],
        options: [['The air rises', '空气上升'], ['The isobaric surface dips', '等压面向下凹'], ['The pressure is low', '形成低压'], ['The air sinks', '空气下沉'], ['The pressure is high', '形成高压']],
        multi: [0, 1, 2],
        why: ['Heated air rises, leaving low pressure near the ground, where the isobaric surface dips down.', '受热处空气上升，近地面形成低压，等压面向下凹。'],
      },
    ],
  },
  // ——— 4. horizontal motion: wind ———
  {
    id: 'h-wind', strand: 'climate', grade: 'h1', tracks: [], unit: ATMOS, icon: 'compass', minutes: 14,
    title: ['Horizontal motion of the air: wind', '大气的水平运动——风'],
    blurb: ['Three forces steer the wind: the pressure gradient pushes, the Earth\'s spin turns it, friction slows it.', '三个力决定风向：气压梯度力推动，地转偏向力使它偏转，摩擦力使它减速。'],
    keys: [
      ['The horizontal pressure-gradient force is the direct cause of wind: perpendicular to the isobars, from high to low pressure; the closer the isobars, the stronger.', '水平气压梯度力是形成风的直接原因：垂直于等压线，由高压指向低压；等压线越密集，风力越大。'],
      ['The Coriolis effect is always perpendicular to the wind: it turns winds right in the northern hemisphere, left in the southern, not at all on the equator; it changes direction, not speed.', '地转偏向力始终与风向垂直，北半球向右偏、南半球向左偏、赤道上不偏；只改变风向，不改变风速。'],
      ['High up, the pressure-gradient force and Coriolis effect balance: the wind blows parallel to the isobars.', '高空的风：水平气压梯度力与地转偏向力平衡，风向与等压线平行。'],
      ['Near the ground friction also acts: the wind crosses the isobars at an angle and is slower; the rougher the surface, the bigger the angle.', '近地面的风：受三个力共同作用，风向与等压线斜交，风速较小；地面越粗糙，夹角越大。'],
    ],
    steps: [
      {
        title: ['The push: pressure-gradient force', '水平气压梯度力'], astro: { kit: 'air', mode: 'wind', lat: 0, fric: 0 },
        body: ['Where pressure differs along a level, a horizontal pressure-gradient force pushes the air from high to low pressure, at right angles to the isobars. It is what starts every wind: the closer together the isobars, the steeper the gradient and the stronger the wind. On the equator nothing turns the air, so it goes straight across the isobars.',
          '同一水平面上存在气压差异，就产生了促使大气由高压流向低压的力，叫水平气压梯度力。它垂直于等压线，由高压指向低压，是形成风的直接原因。等压线越密集，气压梯度越大，风力越大。在赤道上，风不发生偏转，沿垂直于等压线的方向吹。'],
      },
      {
        title: ['High above: parallel to the isobars', '高空的风：与等压线平行'], astro: { kit: 'air', mode: 'wind', lat: 40, fric: 0 },
        body: ['Away from the equator the Earth\'s rotation adds the Coriolis effect: always at right angles to the wind, turning it to the right in the northern hemisphere. It turns the air but never speeds it up. High in the air, where friction is negligible, the wind keeps turning until the Coriolis effect exactly balances the pressure-gradient force; then it blows parallel to the isobars, with low pressure on its left.',
          '在赤道以外，地球自转产生地转偏向力，它始终与风向垂直，北半球使风向右偏，只改变风向，不改变风速。高空大气受摩擦力影响很小，风向不断右偏，直到地转偏向力与水平气压梯度力大小相等、方向相反，风向最终与等压线平行（北半球背风而立，低压在左）。'],
      },
      {
        title: ['Near the ground: friction', '近地面的风：摩擦力'], astro: { kit: 'air', mode: 'wind', lat: 40, fric: 0.6 },
        body: ['Near the ground, friction with the surface acts against the wind and slows it. A slower wind is turned less, so the three forces balance with the wind crossing the isobars at an angle, still blowing from high towards low pressure. Over the smooth sea the angle is small (about 15–30°); over rough land it is larger (35–45° or more).',
          '近地面的风还受到摩擦力的作用，摩擦力与风向相反，使风速减小，地转偏向力也随之减小。三个力达到平衡时，风向与等压线斜交，仍由高压一侧吹向低压一侧。海面摩擦力小，夹角较小；陆地摩擦力大，夹角较大。'],
      },
      {
        title: ['The southern hemisphere: turning left', '南半球：向左偏'], astro: { kit: 'air', mode: 'wind', lat: -35, fric: 0.6 },
        body: ['South of the equator the Coriolis effect works the other way: winds turn to the left. The forces are the same; only the direction of the turn is mirrored. The rule to remember: "northern hemisphere right, southern left, equator none".',
          '在南半球，地转偏向力使风向左偏。三个力的性质不变，只是偏转方向相反。记住：“北右南左赤道不偏”。'],
      },
      {
        title: ['Lab: steer the wind', '实验：控制风向'],
        astro: {
          kit: 'air', mode: 'wind',
          params: [
            { id: 'lat', name: ['Latitude', '纬度'], min: -90, max: 90, value: 30, step: 1, fmt: ['{v}°', '{v}°'] },
            { id: 'fric', name: ['Friction', '摩擦力'], min: 0, max: 1, value: 0.6, step: 0.05, dp: 2 },
          ],
          tasks: [
            { text: ['Make the wind blow parallel to the isobars, as high in the air.', '让风与等压线平行（像在高空）。'], done: p => p.fric <= 0.05 && Math.abs(p.lat) >= 10 },
            { text: ['Show a wind turning to the left.', '让风向左偏。'], done: p => p.lat <= -10 },
            { text: ['Make the wind cross the isobars at right angles.', '让风垂直于等压线吹。'], done: p => Math.abs(p.lat) < 1 },
          ],
        },
        task: ['Move the latitude and the friction and watch the parcel\'s path and the forces on it.', '改变纬度和摩擦力，观察空气的运动路径和受力。'],
        body: ['The gold arrow is the pressure-gradient force, violet the Coriolis effect, grey friction, green the wind. The Coriolis effect grows with latitude (it is zero on the equator, strongest at the poles), and friction pulls the wind back across the isobars.',
          '金色箭头表示水平气压梯度力，紫色表示地转偏向力，灰色表示摩擦力，绿色表示风向。地转偏向力随纬度增高而增大（赤道上为零，两极最大）；摩擦力使风斜穿等压线。'],
      },
      {
        title: ['Reading a weather map', '在等压线图上判断风向'], cam: [42, 112, 2.6], sketch: true,
        paint: [{ fill: { k: 'poly', pts: blob(48, 100, 9, 16), c: C.blue }, a: 0.35 }],
        marks: [mk([48, 100], 'Mongolia–Siberian high (winter)', '蒙古—西伯利亚高压（冬季）', { big: true, c: C.ice, t: 0.3 })],
        lines: arrows([[[46, 104], [38, 112], [32, 116]], [[44, 116], [37, 121], [31, 122]], [[50, 120], [44, 126], [38, 128]]], C.ice, 0.6, 2),
        fig: { k: 'svg', draw: isobarFig(true) },
        body: ['To find the wind at a point: draw the pressure-gradient force at right angles to the isobars, from high to low; then turn it 30–45° to the right in the northern hemisphere (left in the southern) for a surface wind, or 90° for a wind high up. In winter the cold Mongolia–Siberian high sends air out to the south-east; turned right, it reaches northern China as a north-west wind.',
          '判断某点风向：先画出垂直于等压线、由高压指向低压的水平气压梯度力；近地面北半球再向右偏 30°–45°（南半球向左），高空则偏转 90°。冬季，蒙古—西伯利亚高压的气流向东南流出，在地转偏向力作用下右偏，我国北方吹西北风。'],
      },
    ],
    quiz: [
      {
        q: ['Near the ground in the northern hemisphere: which wind blows at P?', '北半球近地面，P 点的风向是'],
        fig: { k: 'svg', draw: isobarFig(false) },
        options: [['North-east wind', '东北风'], ['North-west wind', '西北风'], ['South-east wind', '东南风'], ['North wind', '北风']],
        answer: 0,
        why: ['The gradient force points south (high to low); turned right 30–45° it blows towards the south-west, so it comes from the north-east.', '水平气压梯度力由北指向南，北半球近地面向右偏 30°–45°，风吹向西南方，即东北风。'],
      },
      {
        q: ['Match each force or wind with its description.', '把力或风与它的特点连起来。'],
        match: [
          [['Pressure-gradient force', '水平气压梯度力'], ['At right angles to isobars, from high to low', '垂直于等压线，由高压指向低压']],
          [['Coriolis effect', '地转偏向力'], ['At right angles to the wind; changes only its direction', '与风向垂直，只改变风向']],
          [['Friction', '摩擦力'], ['Opposite to the wind; slows it', '与风向相反，减小风速']],
          [['Wind high in the air', '高空的风'], ['Parallel to the isobars', '与等压线平行']],
        ],
        why: ['The first force makes the wind; the other two only steer and slow it.', '水平气压梯度力是风的原动力，另两个力只影响风向和风速。'],
      },
      {
        q: ['Which are true of the Coriolis effect? Choose all.', '关于地转偏向力，正确的有（多选）'],
        options: [['It turns winds right in the northern hemisphere', '北半球使风向右偏'], ['It is zero on the equator', '赤道上为零'], ['It is perpendicular to the wind', '与风向垂直'], ['It speeds the wind up', '使风速增大'], ['It is strongest at low latitudes', '低纬度最大']],
        multi: [0, 1, 2],
        why: ['It grows with latitude and only changes the wind\'s direction.', '地转偏向力随纬度增高而增大，只改变风向，不改变风速。'],
      },
      {
        q: ['Where does the wind cross the isobars at the biggest angle?', '风向与等压线夹角最大的是'],
        options: [['Near the ground over rough land', '粗糙陆地的近地面'], ['Near the sea surface', '海面上'], ['High in the air', '高空'], ['It is the same everywhere', '各处相同']],
        answer: 0,
        why: ['More friction slows the wind more, so it is turned less and crosses the isobars more steeply.', '摩擦力越大，风速越小，偏转越少，风向与等压线的夹角越大。'],
      },
      {
        q: ['Put the steps for drawing a surface wind on a map in order.', '把在等压线图上画近地面风向的步骤排序。'],
        order: [['Find which side is high and which is low', '判断高压和低压'], ['Draw the gradient force at right angles to the isobars', '画垂直于等压线、由高压指向低压的气压梯度力'], ['Decide the hemisphere: right in the north, left in the south', '判断半球：北半球右偏，南半球左偏'], ['Turn it 30–45° to get the wind', '偏转 30°–45°，画出风向']],
        why: ['Start from the push, then let the Earth\'s spin and friction turn it.', '先确定原动力，再考虑偏转。'],
      },
      {
        q: ['High in the air, by how many degrees has the wind turned away from the pressure-gradient force?', '高空的风，风向与水平气压梯度力的夹角是多少度？'],
        num: { answer: 90, tol: 1, unit: ['°', '°'] },
        why: ['It ends up parallel to the isobars, which are at right angles to the gradient force.', '高空风向最终与等压线平行，而气压梯度力垂直于等压线，所以夹角是 90°。'],
      },
    ],
  },
  // ——— 5. pressure belts and wind belts ———
  {
    id: 'h-circulation', strand: 'climate', grade: 'h2', tracks: [], unit: MOTION, icon: 'globe', minutes: 16,
    title: ['Pressure belts and wind belts', '气压带和风带'],
    blurb: ['Three cells of rising and sinking air wrap each hemisphere, laying down seven pressure belts and six wind belts that follow the Sun.', '每个半球有三圈环流，形成七个气压带和六个风带，并随太阳直射点季节移动。'],
    keys: [
      ['Three cells in each hemisphere (low-, mid- and high-latitude) make seven pressure belts, highs and lows alternating, with six wind belts between them.', '每个半球形成低纬、中纬、高纬三圈环流，全球形成七个高低相间的气压带和六个风带。'],
      ['The equatorial low and polar highs are thermal (heating, cooling); the subtropical highs and subpolar lows are dynamic (air piling up and sinking, or being lifted).', '赤道低气压带和极地高气压带由热力原因形成；副热带高气压带和副极地低气压带由动力原因形成。'],
      ['Trade winds blow towards the equator (NE in the north, SE in the south); westerlies blow polewards between 30° and 60°; polar easterlies blow out from the poles.', '信风带吹向赤道（北半球东北信风、南半球东南信风）；盛行西风带位于 30°–60°；极地东风带由极地吹出。'],
      ['The belts follow the overhead Sun: north in the northern summer, south in its winter.', '气压带和风带随太阳直射点的移动而季节移动：北半球夏季北移，冬季南移。'],
      ['Land and sea break the belts into pressure centres: the Asian high in January; the Asian (Indian) low in July.', '海陆分布使气压带被分裂成气压中心：1 月亚洲高压切断副极地低气压带，7 月亚洲低压（印度低压）切断副热带高气压带。'],
    ],
    steps: [
      {
        title: ['If the Earth did not spin', '单圈环流'], astro: { kit: 'belts', mode: 'cells', single: true },
        body: ['Imagine an Earth that does not rotate, with a uniform surface. The equator is heated most, so air rises there, flows towards the poles high up, cools and sinks over the poles, and returns to the equator along the ground. Each hemisphere would have one big thermal cell, with low pressure at the equator and high pressure at the poles.',
          '假设地球不自转、地表均匀。赤道受热多，空气膨胀上升，在高空流向两极；两极冷却，空气下沉，在近地面流回赤道。每个半球形成一个闭合的单圈环流，赤道附近近地面为低压，两极为高压。'],
      },
      {
        title: ['Three cells', '三圈环流'], astro: { kit: 'belts', mode: 'cells' },
        body: ['The real Earth spins, so the Coriolis effect turns the poleward flow aloft until, near 30°, it blows from the west and piles up; the air sinks, making the subtropical high. Near the ground, part returns to the equator (the trade winds: low-latitude cell) and part flows polewards (the westerlies). Near 60° the westerlies meet cold air from the pole and are lifted: the subpolar low. The mid- and high-latitude cells close the loops.',
          '地球自转产生地转偏向力，高空由赤道流向两极的气流不断右偏（北半球），到北纬 30° 附近几乎与纬线平行，气流堆积下沉，形成副热带高气压带。近地面，一部分气流流回赤道，形成低纬环流（信风）；一部分流向高纬，形成西风。西风在 60° 附近与极地来的冷空气相遇，暖空气被抬升，形成副极地低气压带，并形成中纬环流和高纬环流。'],
      },
      {
        title: ['Seven pressure belts, six wind belts', '七个气压带和六个风带'], astro: { kit: 'belts', mode: 'belts' },
        body: ['From the equator outwards: the equatorial low (hot, rising), the subtropical highs near 30°, the subpolar lows near 60°, and the polar highs. Between them: the north-east and south-east trades, blowing towards the equator; the prevailing westerlies (south-west winds in the north, north-west in the south); and the polar easterlies. Every wind blows from a high into a low and is turned by the Earth\'s spin.',
          '由赤道向两极依次为：赤道低气压带、副热带高气压带（约 30°）、副极地低气压带（约 60°）、极地高气压带。气压带之间是风带：东北信风带和东南信风带吹向赤道；盛行西风带（北半球西南风、南半球西北风）；极地东风带。风都由高压吹向低压，并在地转偏向力作用下偏转。'],
      },
      {
        title: ['The belts on the map', '地图上的气压带和风带'], cam: [8, 20, 4.8], wide: true, sketch: true, graticule: true,
        paint: [
          { fill: { k: 'band', s: -5, n: 5, c: C.red }, a: 0.35, t: 0.2 },
          { fill: { k: 'band', s: 25, n: 35, c: C.blue }, a: 0.35, t: 0.5 }, { fill: { k: 'band', s: -35, n: -25, c: C.blue }, a: 0.35, t: 0.5 },
          { fill: { k: 'band', s: 55, n: 65, c: C.red }, a: 0.35, t: 0.8 }, { fill: { k: 'band', s: -65, n: -55, c: C.red }, a: 0.35, t: 0.8 },
          { fill: { k: 'band', s: 80, n: 90, c: C.blue }, a: 0.35, t: 1.1 }, { fill: { k: 'band', s: -90, n: -80, c: C.blue }, a: 0.35, t: 1.1 },
        ],
        lines: [
          ...arrows([-20, 20, 60].map(lo => [[26, lo + 10], [8, lo - 4]] as LL[]), C.gold, 1.4),
          ...arrows([-20, 20, 60].map(lo => [[-26, lo + 10], [-8, lo - 4]] as LL[]), C.gold, 1.6),
          ...arrows([-20, 20, 60].map(lo => [[36, lo - 10], [52, lo + 8]] as LL[]), C.teal, 1.8),
          ...arrows([-20, 20, 60].map(lo => [[-36, lo - 10], [-52, lo + 8]] as LL[]), C.teal, 2),
        ],
        marks: [
          mk([0, -10], 'Equatorial low', '赤道低气压带', { c: C.red, t: 0.3 }), mk([30, -10], 'Subtropical high', '副热带高气压带', { c: C.blue, t: 0.6 }),
          mk([-30, -10], 'Subtropical high', '副热带高气压带', { c: C.blue, t: 0.6 }), mk([60, -10], 'Subpolar low', '副极地低气压带', { c: C.red, t: 0.9 }),
          mk([-60, -10], 'Subpolar low', '副极地低气压带', { c: C.red, t: 0.9 }),
          mk([16, 40], 'NE trades', '东北信风', { c: C.gold, t: 1.6 }), mk([-16, 40], 'SE trades', '东南信风', { c: C.gold, t: 1.8 }),
          mk([45, 40], 'Westerlies', '盛行西风', { c: C.teal, t: 2 }), mk([-45, 40], 'Westerlies', '盛行西风', { c: C.teal, t: 2.2 }),
        ],
        body: ['Laid flat on the map, the belts are neat stripes around the globe: red lows where air rises (cloudy and wet), blue highs where it sinks (dry and clear). Notice that the real world is not so tidy: in the northern hemisphere, with its big continents, the belts are broken up.',
          '展开在地图上，气压带像一条条环绕地球的色带：红色的低压带空气上升，多阴雨；蓝色的高压带空气下沉，晴朗干燥。不过真实世界没有这么整齐：在大陆面积广大的北半球，气压带常被切断。'],
      },
      {
        title: ['The belts move with the seasons', '气压带和风带的季节移动'], astro: { kit: 'belts', mode: 'season', clock: { from: 0, to: 365, rate: 30, unit: 'day' } },
        body: ['The belts are made by the Sun\'s heating, so they follow the overhead Sun. In the northern summer they move north; in its winter, south, by roughly 5–10°. They lag the Sun by about a month, because land and water take time to warm and cool. Places near the edge of a belt therefore spend part of the year under one belt and part under the next.',
          '气压带和风带是太阳辐射引起的，所以随太阳直射点的移动而移动：就北半球而言，大致夏季北移，冬季南移，移动幅度约 5°–10°。由于海陆升温降温需要时间，它们的移动比太阳直射点晚约一个月。位于两个气压带、风带交界处的地方，一年中会交替受不同气压带、风带控制。'],
      },
      {
        title: ['January: the Asian high', '1 月：亚洲高压'], cam: [80, 120, 4.2], wide: true, sketch: true,
        paint: [
          { fill: { k: 'poly', pts: blob(50, 100, 10, 26), c: C.blue }, a: 0.45, t: 0.3 },
          { fill: { k: 'poly', pts: blob(52, -165, 7, 12), c: C.red }, a: 0.45, t: 0.8 },
          { fill: { k: 'poly', pts: blob(62, -28, 6, 15), c: C.red }, a: 0.45, t: 1.1 },
        ],
        marks: [
          mk([50, 100], 'Asian (Mongolia–Siberian) high', '亚洲高压（蒙古—西伯利亚高压）', { big: true, c: C.ice, t: 0.4 }),
          mk([52, -165], 'Aleutian low', '阿留申低压', { c: C.red, t: 0.9 }), mk([62, -28], 'Icelandic low', '冰岛低压', { c: C.red, t: 1.2 }),
        ],
        body: ['Land cools much faster than the sea. In January the vast cold continent of Asia builds a high-pressure centre, the Asian high, which breaks the subpolar low belt; the belt survives only over the warmer oceans, as the Aleutian low in the North Pacific and the Icelandic low in the North Atlantic.',
          '陆地比海洋降温快。1 月，亚欧大陆冷却，形成强大的冷高压——亚洲高压（蒙古—西伯利亚高压），切断了副极地低气压带，使它只保留在海洋上，形成北太平洋上的阿留申低压和北大西洋上的冰岛低压。'],
      },
      {
        title: ['July: the Asian low', '7 月：亚洲低压'], cam: [72, 100, 4.2], wide: true, sketch: true,
        paint: [
          { fill: { k: 'poly', pts: blob(30, 70, 9, 22), c: C.red }, a: 0.45, t: 0.3 },
          { fill: { k: 'poly', pts: blob(32, -150, 8, 20), c: C.blue }, a: 0.45, t: 0.8 },
          { fill: { k: 'poly', pts: blob(35, -35, 7, 18), c: C.blue }, a: 0.45, t: 1.1 },
        ],
        marks: [
          mk([30, 70], 'Asian (Indian) low', '亚洲低压（印度低压）', { big: true, c: C.red, t: 0.4 }),
          mk([32, -150], 'Hawaiian high', '夏威夷高压', { c: C.ice, t: 0.9 }), mk([35, -35], 'Azores high', '亚速尔高压', { c: C.ice, t: 1.2 }),
        ],
        body: ['In July the land is hotter than the sea. A thermal low, the Asian (Indian) low, sits over southern Asia and cuts the subtropical high belt; the belt survives over the cooler oceans as the Hawaiian high in the North Pacific and the Azores high in the North Atlantic. These centres steer the monsoons of the next lesson.',
          '7 月陆地比海洋热，亚欧大陆形成热低压——亚洲低压（印度低压），切断了副热带高气压带，使它只保留在海洋上，形成北太平洋上的夏威夷高压和北大西洋上的亚速尔高压。这些气压中心决定了季风的方向。'],
      },
    ],
    quiz: [
      {
        q: ['Tap the subtropical high-pressure belt of the southern hemisphere.', '点出南半球的副热带高气压带。'],
        astro: { kit: 'belts', mode: 'belts', bare: true }, pick: 'subhigh-s',
        why: ['It lies near 30°S, where air from the low-latitude cell sinks.', '它位于南纬 30° 附近，是低纬环流的下沉气流形成的。'],
      },
      {
        q: ['Tap the wind belt that blows from the south-west in the northern hemisphere.', '点出北半球吹西南风的风带。'],
        astro: { kit: 'belts', mode: 'belts', bare: true }, pick: 'west-n',
        why: ['The northern westerlies blow from the subtropical high towards the subpolar low, turned right into south-west winds.', '北半球盛行西风由副热带高气压带吹向副极地低气压带，右偏成西南风。'],
      },
      {
        q: ['Match each pressure belt with how it forms.', '把气压带与它的成因连起来。'],
        match: [
          [['Equatorial low', '赤道低气压带'], ['Heated air rises (thermal)', '受热上升（热力原因）']],
          [['Polar high', '极地高气压带'], ['Cold air sinks (thermal)', '冷却下沉（热力原因）']],
          [['Subtropical high', '副热带高气压带'], ['Air piles up aloft and sinks (dynamic)', '气流堆积下沉（动力原因）']],
          [['Subpolar low', '副极地低气压带'], ['Warm air lifted over cold air (dynamic)', '冷暖气流相遇，暖气流被抬升（动力原因）']],
        ],
        why: ['The belts at the equator and the poles come from heating and cooling; the two in between come from the motion of the cells.', '赤道和极地的气压带由冷热差异形成；中间两个由大气运动形成。'],
      },
      {
        q: ['Put the belts in order from the equator to the North Pole.', '把北半球的气压带和风带从赤道到北极排序。'],
        order: [['Equatorial low', '赤道低气压带'], ['NE trades', '东北信风带'], ['Subtropical high', '副热带高气压带'], ['Westerlies', '盛行西风带'], ['Subpolar low', '副极地低气压带'], ['Polar easterlies', '极地东风带'], ['Polar high', '极地高气压带']],
        why: ['Lows and highs alternate, with a wind belt between each pair.', '高低气压带相间分布，每两个气压带之间是一个风带。'],
      },
      {
        q: ['In July, what cuts the subtropical high belt over the northern continents?', '7 月，切断北半球副热带高气压带的是'],
        options: [['The Asian (Indian) low', '亚洲低压（印度低压）'], ['The Asian high', '亚洲高压'], ['The Aleutian low', '阿留申低压'], ['The Hawaiian high', '夏威夷高压']],
        answer: 0,
        why: ['In summer the hot land builds a thermal low over southern Asia.', '夏季陆地增温快，在亚洲南部形成热低压。'],
      },
      {
        q: ['Which happen in the northern summer? Choose all.', '北半球夏季（多选）'],
        options: [['The belts move north', '气压带和风带北移'], ['A low sits over southern Asia', '亚洲南部形成低压'], ['The Hawaiian high is strong', '夏威夷高压势力强'], ['The Asian high is at its strongest', '亚洲高压最强'], ['The Aleutian low is at its strongest', '阿留申低压最强']],
        multi: [0, 1, 2],
        why: ['The Asian high and the Aleutian low are winter centres.', '亚洲高压和阿留申低压是冬季（1 月）的气压中心。'],
      },
      {
        q: ['The overhead Sun is farthest north on about 22 June, and the belts lag it by about a month. In which month are the belts farthest north? (Give the month number.)', '太阳直射点 6 月 22 日前后到达最北，气压带风带的移动约滞后一个月。气压带风带位置最偏北的大约是几月？（填月份数字）'],
        num: { answer: 7, tol: 0.4, unit: ['(month)', '月'] },
        why: ['Land and sea take about a month to warm up fully, so the belts reach their northernmost in July (and southernmost in January).', '海陆增温需要时间，气压带风带约滞后一个月，大约 7 月位置最北（1 月最南）。'],
      },
    ],
  },
  // ——— 6. how the belts make climates; monsoons ———
  {
    id: 'h-monsoon-climate', strand: 'climate', grade: 'h2', tracks: [], unit: MOTION, icon: 'leaf', minutes: 16,
    title: ['Pressure and wind belts shape climate', '气压带和风带对气候的影响'],
    blurb: ['Why rainforests sit on the equator, deserts near the tropics and Mediterranean summers are dry, and how monsoons form.', '为什么雨林在赤道、沙漠在回归线附近、地中海夏季干燥？季风是怎样形成的？'],
    keys: [
      ['Lows bring rain (rising air), highs bring drought (sinking air); winds from the sea are wet, winds from the land are dry.', '低气压带盛行上升气流，多雨；高气压带盛行下沉气流，少雨；来自海洋的风湿润，来自陆地的风干燥。'],
      ['Rainforest: equatorial low all year. Desert: subtropical high or trade winds from land. Savanna: the equatorial low and trades alternate. Mediterranean: subtropical high in summer, westerlies in winter. Maritime: westerlies from the sea all year.', '热带雨林：全年受赤道低气压带控制；热带沙漠：受副热带高气压带或信风带控制；热带草原：赤道低压与信风交替；地中海：夏季受副高控制、冬季受西风带控制；温带海洋性：全年受西风影响。'],
      ['The East Asian monsoon comes mainly from the different heating of land and sea: north-west in winter, south-east in summer.', '东亚季风主要由海陆热力性质差异形成：冬季吹西北风，夏季吹东南风。'],
      ['The South Asian summer monsoon also comes from the belts\' shift: the SE trades cross the equator, turn right and become the SW monsoon.', '南亚的夏季风还与气压带风带的季节移动有关：东南信风越过赤道后向右偏转，成为西南季风。'],
    ],
    steps: [
      {
        title: ['Rising air, sinking air', '赤道低压与副热带高压'], cam: [10, 20, 3.8], wide: true, sketch: true,
        paint: [{ fill: { k: 'climate', only: ['rainforest', 'savanna', 'desert'] }, a: 0.8 }],
        marks: [
          mk([1, 20], 'Equatorial low all year: hot and wet', '全年受赤道低压控制：高温多雨', { c: C.green, t: 0.4 }),
          mk([24, 12], 'Subtropical high / trades from land: hot and dry', '副高或来自陆地的信风控制：炎热干燥', { c: C.gold, t: 0.8 }),
          mk([-12, 26], 'Equatorial low ↔ trades: wet season, dry season', '赤道低压与信风交替：干湿季', { c: C.lime, t: 1.2 }),
        ],
        fig: { k: 'climo', city: 'singapore', b: 'cairo' },
        body: ['Under the equatorial low, hot moist air rises every day: tropical rainforest, hot and wet all year. Near the tropics the subtropical high (sinking air) and the trade winds, blowing off the land, keep the sky clear: the great hot deserts. In between, the belts\' seasonal shift brings the equatorial low in summer (a wet season) and the dry trades in winter (a dry season): savanna.',
          '赤道低气压带控制下，湿热空气每天对流上升，形成全年高温多雨的热带雨林气候。回归线附近受副热带高气压带的下沉气流或来自大陆的信风控制，降水稀少，形成热带沙漠气候。二者之间，气压带风带季节移动：夏季受赤道低气压带控制，形成湿季；冬季受信风带控制，形成干季，这就是热带草原气候。'],
      },
      {
        title: ['Mediterranean: two belts in turn', '地中海气候：两个气压带、风带交替控制'], cam: [38, 14, 2.8],
        paint: [{ fill: { k: 'climate', only: ['med'] }, a: 0.85 }],
        lines: arrows([[[40, -22], [41, -8]], [[44, -18], [44, -4]], [[36, -20], [37, -7]]], C.teal, 0.8, 1.8),
        marks: [
          mk([41.9, 12.5], 'Rome', '罗马', { dot: true, t: 0.3 }),
          mk([33, 5], 'Summer: subtropical high, hot and dry', '夏季：副高控制，炎热干燥', { c: C.gold, t: 0.6 }),
          mk([46, -14], 'Winter: westerlies, mild and wet', '冬季：西风带控制，温和多雨', { c: C.teal, t: 1 }),
        ],
        fig: { k: 'climo', city: 'rome' },
        body: ['On the west sides of continents between about 30° and 40°, the belts\' shift changes everything. In summer the subtropical high moves over them: sinking air, sunshine, drought. In winter it retreats and the westerlies bring Atlantic storms: mild and wet. Rain in winter and drought in summer is unusual; it is why olives and grapes, not rice, grow around the Mediterranean.',
          '30°–40° 的大陆西岸，气压带风带的季节移动带来鲜明对比：夏季受副热带高气压带控制，盛行下沉气流，炎热干燥；冬季副高南移，受西风带控制，西风从海洋带来水汽，温和多雨。雨热不同期在气候中很少见，所以地中海沿岸种植油橄榄、葡萄等耐旱作物。'],
      },
      {
        title: ['Maritime: westerlies all year', '温带海洋性气候：全年受西风影响'], cam: [52, 2, 2.8],
        paint: [{ fill: { k: 'climate', only: ['maritime'] }, a: 0.85 }],
        lines: arrows([[[48, -30], [52, -8]], [[54, -28], [57, -6]], [[44, -26], [47, -6]]], C.teal, 0.6, 2),
        marks: [mk([51.5, -0.1], 'London', '伦敦', { dot: true, t: 0.3 }), mk([56, -22], 'Westerlies off the Atlantic', '来自大西洋的西风', { c: C.teal, t: 0.8 })],
        fig: { k: 'climo', city: 'london' },
        body: ['Between about 40° and 60° on west coasts, the westerlies blow in from the ocean all year round, with the warm North Atlantic Drift beneath them. Winters are mild, summers cool, and rain falls evenly through the year. In western Europe there are no north–south mountains to stop the sea air, so this climate reaches far inland.',
          '40°–60° 的大陆西岸，终年受西风带控制，西风从海洋带来温暖湿润的空气（沿岸还有北大西洋暖流），冬季温和、夏季凉爽，全年降水均匀。西欧没有南北走向的高大山脉阻挡，海洋气流可以深入内陆，所以这种气候分布面积广。'],
      },
      {
        title: ['January: winter monsoons', '1 月：冬季风'], cam: [30, 102, 3], sketch: true,
        paint: [{ fill: { k: 'poly', pts: blob(50, 100, 10, 26), c: C.blue }, a: 0.3 }, { fill: { k: 'climate', only: ['tmonsoon', 'smonsoon', 'tmonsoon2'] }, a: 0.55 }],
        lines: [
          ...arrows([[[47, 106], [40, 114], [33, 118]], [[45, 118], [38, 123], [31, 123]], [[42, 96], [34, 106], [27, 112]]], C.ice, 0.5, 2.2),
          ...arrows([[[27, 92], [20, 84], [13, 77]], [[25, 102], [17, 94], [10, 88]]], C.ice, 1.3, 2.2),
        ],
        marks: [
          mk([50, 100], 'Asian high', '亚洲高压', { big: true, c: C.ice, t: 0.3 }),
          mk([36, 112], 'NW winter monsoon: cold, dry', '西北季风：寒冷干燥', { c: C.ice, t: 0.9 }),
          mk([18, 80], 'NE monsoon', '东北季风', { c: C.ice, t: 1.5 }),
        ],
        fig: { k: 'key', set: 'climate', only: ['tmonsoon', 'smonsoon', 'tmonsoon2'] },
        body: ['Asia is the largest continent next to the largest ocean, so the contrast between land and sea is greatest here. In winter the cold Asian high blows air out to sea: north-west winds over East Asia, cold and dry, and north-east winds over South Asia. That is why winters in northern China are cold and dry.',
          '亚洲位于世界最大的大陆——亚欧大陆东部，濒临最大的大洋——太平洋，海陆热力性质差异最显著。冬季，亚洲高压的气流吹向海洋：东亚吹西北风，寒冷干燥；南亚吹东北风。所以我国北方冬季寒冷干燥。'],
      },
      {
        title: ['July: summer monsoons', '7 月：夏季风'], cam: [22, 102, 3], sketch: true,
        paint: [{ fill: { k: 'poly', pts: blob(30, 70, 9, 22), c: C.red }, a: 0.3 }, { fill: { k: 'climate', only: ['tmonsoon', 'smonsoon', 'tmonsoon2'] }, a: 0.55 }],
        lines: [
          ...arrows([[[18, 138], [25, 127], [32, 118]], [[24, 144], [32, 132], [40, 122]]], C.orange, 0.5, 2.2),
          ...arrows([[[-14, 72], [-6, 62], [3, 58], [12, 64], [20, 74]], [[-12, 86], [-4, 76], [5, 74], [14, 84], [22, 90]]], C.orange, 1.2, 2.2),
        ],
        marks: [
          mk([30, 70], 'Asian (Indian) low', '亚洲低压（印度低压）', { big: true, c: C.red, t: 0.3 }),
          mk([26, 140], 'SE monsoon off the Pacific', '东南季风：来自太平洋', { c: C.orange, t: 0.9 }),
          mk([-8, 62], 'SE trades cross the equator', '东南信风越过赤道', { c: C.gold, t: 1.4 }),
          mk([10, 64], 'SW monsoon', '西南季风', { c: C.orange, t: 1.8 }),
        ],
        fig: { k: 'climo', city: 'mumbai', b: 'shanghai' },
        body: ['In summer the land is hot and the Asian low pulls in air from the oceans. Over East Asia the south-east monsoon blows in from the Pacific (the Hawaiian high), warm and wet: the land–sea contrast at work. South Asia\'s south-west monsoon has a second cause: as the belts move north, the south-east trades of the southern hemisphere cross the equator, are turned right by the Coriolis effect and arrive as south-west winds, bringing Mumbai its torrential rains.',
          '夏季陆地热，亚洲低压从海洋吸入气流。东亚吹东南季风，来自太平洋上的夏威夷高压，温暖湿润，这主要是海陆热力性质差异造成的。南亚的西南季风还有另一个原因：随着气压带风带北移，南半球的东南信风越过赤道，在地转偏向力作用下向右偏转，变成西南风，给孟买带来大量降水。'],
      },
      {
        title: ['Up the west coast', '沿大陆西岸看气候'], cam: [18, 2, 4.4], wide: true, sketch: true,
        paint: [{ fill: { k: 'climate', only: ['rainforest', 'savanna', 'desert', 'med', 'maritime'] }, a: 0.85 }],
        marks: [
          mk([4, 9], 'Rainforest', '热带雨林', { c: C.green, t: 0.3 }), mk([12, -12], 'Savanna', '热带草原', { c: C.lime, t: 0.6 }),
          mk([22, -16], 'Desert', '热带沙漠', { c: C.gold, t: 0.9 }), mk([36, -12], 'Mediterranean', '地中海气候', { c: C.orange, t: 1.2 }),
          mk([50, -12], 'Maritime', '温带海洋性', { c: C.teal, t: 1.5 }),
        ],
        fig: { k: 'key', set: 'climate', only: ['rainforest', 'savanna', 'desert', 'med', 'maritime'] },
        body: ['Travel north along the west coast of Africa and Europe and the climates come in the order of the belts: equatorial low (rainforest), low and trades in turn (savanna), subtropical high and trades (desert), high and westerlies in turn (Mediterranean), westerlies (maritime). Where the land is broad and the monsoons strong, as on the east coasts of Asia, this tidy pattern breaks down.',
          '沿非洲和欧洲西海岸向北，气候类型按气压带风带依次排列：赤道低压控制（热带雨林）→ 赤道低压与信风交替（热带草原）→ 副高与信风控制（热带沙漠）→ 副高与西风交替（地中海气候）→ 西风控制（温带海洋性气候）。在亚洲东部等季风强盛的大陆东岸，这种规律被打破。'],
      },
    ],
    quiz: [
      {
        q: ['Which belts control this place?', '此地主要受什么气压带或风带控制？'],
        fig: { k: 'climo', city: 'cairo', blind: true },
        options: [['The subtropical high or trades all year', '全年受副高或信风控制'], ['The equatorial low all year', '全年受赤道低压控制'], ['Westerlies all year', '全年受西风控制'], ['The subtropical high and westerlies in turn', '副高与西风交替控制']],
        answer: 0,
        why: ['Hot with almost no rain all year: a tropical desert under sinking air.', '全年高温、几乎无雨，是受下沉气流控制的热带沙漠气候。'],
      },
      {
        q: ['Which belts control this place?', '此地主要受什么气压带或风带控制？'],
        fig: { k: 'climo', city: 'rome', blind: true },
        options: [['The subtropical high in summer, westerlies in winter', '夏季受副高控制，冬季受西风控制'], ['The equatorial low in summer, trades in winter', '夏季受赤道低压控制，冬季受信风控制'], ['Westerlies all year', '全年受西风控制'], ['Monsoons', '季风']],
        answer: 0,
        why: ['Hot dry summers and mild wet winters: a Mediterranean climate.', '夏季炎热干燥，冬季温和多雨，是地中海气候。'],
      },
      {
        q: ['Match each climate with its cause.', '把气候类型与成因连起来。'],
        match: [
          [['Tropical rainforest', '热带雨林气候'], ['Equatorial low all year', '全年受赤道低气压带控制']],
          [['Savanna', '热带草原气候'], ['Equatorial low and trades in turn', '赤道低气压带与信风带交替控制']],
          [['Tropical desert', '热带沙漠气候'], ['Subtropical high or trades from land', '受副高或来自陆地的信风控制']],
          [['Temperate maritime', '温带海洋性气候'], ['Westerlies from the sea all year', '全年受来自海洋的西风影响']],
        ],
        why: ['Lows and onshore winds bring rain; highs and offshore winds bring drought.', '低压和来自海洋的风带来降水；高压和来自陆地的风带来干旱。'],
      },
      {
        q: ['What causes South Asia\'s south-west summer monsoon? Choose all.', '南亚西南季风的成因有（多选）'],
        options: [['The SE trades cross the equator and turn right', '东南信风越过赤道后向右偏转'], ['The Asian (Indian) low in summer', '夏季的亚洲低压（印度低压）'], ['The different heating of land and sea', '海陆热力性质差异'], ['The Asian high', '亚洲高压'], ['The westerlies moving south', '西风带南移']],
        multi: [0, 1, 2],
        why: ['Both the belts\' shift and the land–sea contrast are at work; the Asian high is a winter feature.', '气压带风带的季节移动和海陆热力性质差异共同作用；亚洲高压是冬季的气压中心。'],
      },
      {
        q: ['What mainly causes the East Asian monsoon?', '东亚季风的主要成因是'],
        options: [['The different heating of land and sea', '海陆热力性质差异'], ['The seasonal shift of the belts alone', '仅由气压带风带的季节移动'], ['Ocean currents', '洋流'], ['The Tibetan Plateau\'s glaciers', '青藏高原的冰川']],
        answer: 0,
        why: ['Asia next to the Pacific has the world\'s biggest land–sea contrast: high over land in winter, low in summer.', '亚欧大陆与太平洋之间海陆热力性质差异最大：冬季陆地为高压，夏季为低压。'],
      },
      {
        q: ['Place each climate on the globe.', '在地球仪上标出下列气候的典型地区。'],
        place: [
          { text: ['Mediterranean: Rome', '地中海气候：罗马'], at: [41.9, 12.5], tolKm: 800 },
          { text: ['Temperate maritime: London', '温带海洋性气候：伦敦'], at: [51.5, -0.1], tolKm: 800 },
          { text: ['Tropical desert: Sahara', '热带沙漠气候：撒哈拉'], at: [23, 10], tolKm: 1000 },
        ],
        why: ['From north to south along Europe and Africa: maritime, Mediterranean, desert, following the belts.', '在欧洲和非洲由北向南依次是温带海洋性、地中海和热带沙漠气候，与气压带风带的分布一致。'],
      },
    ],
  },
  // ——— 7. fronts, cyclones and anticyclones ———
  {
    id: 'h-fronts', strand: 'climate', grade: 'h2', tracks: [], unit: MOTION, icon: 'cloud', minutes: 16,
    title: ['Common weather systems', '常见天气系统'],
    blurb: ['Cold fronts, warm fronts, the plum rains, typhoons and the long dry spells of high summer.', '冷锋、暖锋、梅雨、台风和伏旱，都是怎样形成的？'],
    keys: [
      ['A front is where a cold and a warm air mass meet; the warm air always rises over the cold, cools and makes cloud and rain.', '锋面是冷、暖气团的交界面；暖气团总是沿锋面抬升，冷却凝结，形成云雨。'],
      ['Cold front: cold air advances, rain mostly behind the front, then colder, higher pressure and clear skies (cold waves; summer storms in the north). Warm front: warm air advances, steady rain ahead of the front, then warmer and clearer.', '冷锋：冷气团主动移动，降水多在锋后；过境后气温下降、气压升高、天气转晴（寒潮、北方夏季暴雨）。暖锋：暖气团主动移动，降水多在锋前，多连续性降水；过境后气温升高、天气转晴。'],
      ['Quasi-stationary front: the two air masses are evenly matched and the front stays put, bringing long rains (the Jianghuai plum rains, the Kunming front).', '准静止锋：冷暖气团势均力敌，锋面移动很慢，形成持续阴雨（江淮准静止锋——梅雨、昆明准静止锋）。'],
      ['A frontal cyclone: in the northern hemisphere the cold front trails south-west of the low and the warm front runs east of it, with the warm sector between.', '锋面气旋：北半球低压中心的西南方为冷锋、东（南）方为暖锋，两者之间为暖区。'],
      ['In the northern hemisphere a cyclone (low) turns anticlockwise, converges and rises: cloud and rain (typhoons). An anticyclone (high) turns clockwise, diverges and sinks: fine weather (the summer drought under the subtropical high).', '北半球气旋（低压）呈逆时针辐合、中心气流上升，多阴雨（台风）；反气旋（高压）呈顺时针辐散、中心气流下沉，多晴朗（副高控制下的伏旱）。'],
    ],
    steps: [
      {
        title: ['Air masses meet', '气团与锋面'], cam: [38, 112, 2.4], wide: true, sketch: true,
        paint: [{ fill: { k: 'poly', pts: blob(50, 105, 9, 20), c: C.blue }, a: 0.32 }, { fill: { k: 'poly', pts: blob(22, 130, 8, 16), c: C.red }, a: 0.28, t: 0.4 }],
        lines: [
          { pts: [[38, 92], [36, 102], [33, 112], [31, 122]], c: C.violet, t: 0.9, dur: 1.6, w: 2.4 },
          ...arrows([[[48, 108], [40, 114]], [[22, 124], [29, 118]]], C.ice, 1.4, 1.6),
        ],
        marks: [
          mk([52, 104], 'Cold, dry air mass', '冷气团：寒冷干燥', { c: C.ice, t: 0.3 }),
          mk([20, 132], 'Warm, moist air mass', '暖气团：温暖湿润', { c: C.red, t: 0.6 }),
          mk([35, 104], 'Front', '锋', { c: C.violet, t: 1.1 }),
        ],
        body: ['A large body of air with much the same temperature and humidity is an air mass: cold and dry over Siberia, warm and moist over the western Pacific. Where two meet they do not mix easily; the sloping boundary between them is a front. Warm air is lighter, so it always lies above the cold air and is lifted along the slope: it cools, its water vapour condenses, and cloud and rain form near the front.',
          '温度、湿度等性质比较均匀的大范围空气叫气团：西伯利亚的气团寒冷干燥，西太平洋的气团温暖湿润。冷暖气团相遇时不易混合，二者之间倾斜的交界面就是锋面。暖空气密度小，总是位于冷空气上方，沿锋面被抬升，冷却后水汽凝结，因此锋面附近常形成云雨天气。'],
      },
      {
        title: ['Cold front', '冷锋'], cam: [41, 106, 1.5], wide: true, sketch: true,
        lines: [
          { pts: [[50, 102], [44, 108], [38, 113], [33, 116]], c: C.blue, t: 0.3, dur: 1.4, w: 2.6 },
          ...arrows([[[50, 96], [44, 104]], [[46, 94], [40, 104]], [[44, 92], [36, 104]]], C.ice, 0.8, 1.8),
        ],
        marks: [mk([44, 112], 'Cold front moving south-east', '冷锋向东南移动', { c: C.blue, t: 0.6 }), mk([40, 100], 'Cold wave: wind, cooling, frost', '寒潮：大风、降温、霜冻', { c: C.ice, t: 1.3 })],
        fig: { k: 'svg', draw: frontFig('cold') },
        body: ['When the cold air mass pushes forward, it wedges under the warm air and forces it up steeply. The rain is short and heavy and falls mostly behind the front line. After the front passes, the cold air takes over: temperature drops, pressure rises, and the sky clears. Cold waves sweeping south in winter and spring, sandstorms in the north, and many summer downpours in northern China are cold-front weather.',
          '冷气团主动向暖气团一侧移动，像楔子一样插入暖空气下方，迫使暖空气急剧抬升。降水历时短、强度大，多出现在锋后。锋面过境后，受单一冷气团控制，气温下降、气压升高、天气转晴。冬春季节南下的寒潮、北方的沙尘暴、我国北方夏季的许多暴雨，都与冷锋有关。'],
      },
      {
        title: ['Warm front', '暖锋'], cam: [33, 115, 1.5], wide: true, sketch: true,
        lines: [
          { pts: [[30, 108], [34, 114], [37, 120], [40, 126]], c: C.red, t: 0.3, dur: 1.4, w: 2.6 },
          ...arrows([[[24, 112], [31, 116]], [[26, 120], [33, 123]]], C.orange, 0.8, 1.8),
        ],
        marks: [mk([38, 112], 'Wide belt of steady rain ahead', '锋前：大范围连续性降水', { c: C.teal, t: 1 })],
        fig: { k: 'svg', draw: frontFig('warm') },
        body: ['When the warm air mass is the one advancing, it climbs gently up over the retreating cold air. The slope is shallow, so cloud and steady rain spread over a wide area ahead of the front, often for a day or more. After the front passes, the warm air takes over: temperature rises, pressure falls and the weather clears.',
          '暖气团主动向冷气团一侧移动，沿冷气团缓缓爬升。锋面坡度小，云雨区范围宽，多形成连续性降水，降水主要在锋前。暖锋过境后，受暖气团控制，气温升高、气压降低、天气转晴。'],
      },
      {
        title: ['Fronts that stay put', '准静止锋'], cam: [29, 111, 1.4], wide: true, sketch: true,
        lines: [
          { pts: [[31, 106], [31.5, 112], [32, 117], [32.3, 122]], c: C.violet, t: 0.3, dur: 1.4, w: 2.6 },
          { pts: [[27.5, 103], [26, 104.5], [24.5, 106]], c: C.violet, t: 1, dur: 1, w: 2.6 },
        ],
        marks: [
          mk([33.5, 116], 'Jianghuai front: plum rains (June–July)', '江淮准静止锋：梅雨（6—7 月）', { c: C.violet, t: 0.6 }),
          mk([25, 102.7], 'Kunming: sunny, dry', '昆明：晴朗温暖', { dot: true, c: C.gold, t: 1.3 }),
          mk([26.6, 106.7], 'Guiyang: overcast, drizzle', '贵阳：阴雨', { dot: true, c: C.teal, t: 1.5 }),
        ],
        fig: { k: 'svg', draw: frontFig('still') },
        body: ['When the two air masses are evenly matched, the front hardly moves and the rain goes on for days or weeks. Every June and July the warm summer monsoon meets cold air over the Yangtze and Huai valleys: the Jianghuai front brings the "plum rains" (meiyu). In winter, cold air from the north is held up by the Yunnan–Guizhou Plateau: the Kunming front leaves Guiyang under weeks of drizzle while Kunming stays sunny.',
          '冷暖气团势均力敌，锋面很少移动，形成持续时间长的阴雨天气。每年 6—7 月，夏季风与北方冷空气在长江中下游和江淮地区相持，形成江淮准静止锋，带来梅雨。冬半年，南下的冷空气受云贵高原阻挡，形成昆明准静止锋：锋面东侧的贵阳阴雨连绵（“天无三日晴”），西侧的昆明则温暖晴朗。'],
      },
      {
        title: ['Cyclone: a typhoon', '气旋：台风'], cam: [23, 124, 1.5], wide: true, sketch: true,
        paint: [{ fill: { k: 'poly', pts: blob(22, 126, 3, 3.3), c: C.violet }, a: 0.3 }],
        lines: spiral([22, 126], 10, 1.5, true, C.red, 0.3),
        marks: [mk([22, 126], 'Typhoon (low)', '台风（低压中心）', { big: true, c: C.red, t: 0.2 }), mk([27, 118], 'Taiwan and Fujian: gales and rainstorms', '台湾、福建：狂风暴雨', { c: C.orange, t: 1.4 })],
        fig: { k: 'svg', draw: cycloneFig },
        body: ['A low-pressure centre is a cyclone. Air flows in from all sides; in the northern hemisphere the Coriolis effect turns it to the right, so it spirals in anticlockwise (clockwise in the southern hemisphere). The converging air has nowhere to go but up: it cools, and thick cloud and rain form. A typhoon is a violent tropical cyclone that forms over warm seas in summer and autumn, bringing gales, torrential rain and storm surges to the coasts of south-east China.',
          '中心气压低于四周的是低压，水平气流呈逆时针方向（南半球顺时针）向中心辐合，称为气旋。辐合的气流在中心被迫上升，冷却凝结，多阴雨天气。台风是在热带洋面上形成的强烈的热带气旋，夏秋季节常给我国东南沿海带来狂风、暴雨和风暴潮。'],
      },
      {
        title: ['Fronts and lows together: the frontal cyclone', '锋面气旋'], cam: [43, 118, 1.9], wide: true, sketch: true,
        lines: [
          ...spiral([46, 118], 7, 1.5, true, C.white, 0.2),
          { pts: [[46, 118], [43, 114], [40.5, 110.5], [38, 108]], c: C.blue, t: 0.9, dur: 1.2, w: 2.6 },
          { pts: [[46, 118], [45, 122.5], [43.5, 127], [42, 131]], c: C.red, t: 1.2, dur: 1.2, w: 2.6 },
        ],
        marks: [
          mk([46, 118], 'Low', '低压中心', { big: true, c: C.red, t: 0.2 }),
          mk([40, 108.5], 'Cold front', '冷锋', { c: C.blue, t: 1.2 }),
          mk([42.4, 129.5], 'Warm front', '暖锋', { c: C.red, t: 1.5 }),
          mk([40, 121], 'Warm sector', '暖区', { c: C.orange, t: 1.8 }),
        ],
        fig: { k: 'svg', draw: frontalFig },
        body: ['Fronts and lows often come together. In the middle latitudes a low often forms on a front: warm air from the south and cold air from the north spiral in towards it, anticlockwise in the northern hemisphere, so a cold front trails to the south-west of the centre and a warm front runs to the east, with the warm sector between them. Rain falls in a narrow band behind the cold front and a wide band ahead of the warm front. The whole system drifts east with the westerlies, so a place usually gets warm-front rain first, then the mild warm sector, then the cold front. Frontal cyclones bring the changeable spring weather of northern China and most of western Europe\'s rain.',
          '锋面和低压常常结合在一起。中纬度地区，锋面上常形成低压：南面的暖空气和北面的冷空气向低压中心辐合，北半球呈逆时针旋转，于是在低压中心的西南方形成冷锋、东（南）方形成暖锋，两者之间是暖区，这就是锋面气旋。冷锋锋后有狭窄的雨带，暖锋锋前有宽阔的雨带。整个系统在西风带中自西向东移动，所以某地一般先迎来暖锋降水，再受暖区控制，最后冷锋过境。锋面气旋常给我国北方春季带来多变的天气，也带来西欧的大部分降水。'],
      },
      {
        title: ['Anticyclone: fine weather and summer drought', '反气旋：晴朗与伏旱'], cam: [28, 128, 2.4], wide: true, sketch: true,
        paint: [{ fill: { k: 'poly', pts: blob(27, 140, 9, 14), c: C.gold }, a: 0.25 }],
        lines: spiral([27, 140], 2, 11, false, C.blue, 0.3),
        marks: [
          mk([27, 140], 'Subtropical high (anticyclone)', '副热带高压（反气旋）', { big: true, c: C.gold, t: 0.2 }),
          mk([30, 114], 'July–August: hot dry spell', '7—8 月：伏旱', { dot: true, c: C.orange, t: 1.4 }),
          mk([40, 116], 'Autumn: crisp clear skies', '秋高气爽', { c: C.teal, t: 1.8 }),
        ],
        fig: { k: 'svg', draw: cycloneFig },
        body: ['A high-pressure centre is an anticyclone: air sinks in the middle and spreads out, clockwise in the northern hemisphere. Sinking air warms and dries, so the weather is fine. When the subtropical high sits over the middle and lower Yangtze in July and August, the region bakes in a long "summer drought"; when a cold high settles over northern China in autumn, the skies are crisp and clear.',
          '中心气压高于四周的是高压，中心气流下沉，向四周辐散，北半球呈顺时针方向，称为反气旋。下沉气流增温变干，多晴朗天气。7—8 月，长江中下游地区受副热带高压控制，形成伏旱；秋季我国北方受冷高压控制，天高云淡，秋高气爽。'],
      },
    ],
    quiz: [
      {
        q: ['Which front is this, and where is the rain?', '图示锋面是什么类型？降水主要在哪里？'],
        fig: { k: 'svg', draw: frontFig('cold', true) },
        options: [['Cold front; rain mostly behind it', '冷锋，降水多在锋后'], ['Warm front; rain ahead of it', '暖锋，降水多在锋前'], ['Cold front; rain ahead of it', '冷锋，降水多在锋前'], ['Warm front; rain behind it', '暖锋，降水多在锋后']],
        answer: 0,
        why: ['The cold air is moving and wedging under the warm air: a cold front, with its rain on the cold side, behind the front.', '冷气团主动推进，插入暖气团下方，是冷锋，降水主要出现在锋后（冷气团一侧）。'],
      },
      {
        q: ['After this front has passed, the weather is…', '这种锋面过境后，天气变化是'],
        fig: { k: 'svg', draw: frontFig('warm', true) },
        options: [['Warmer, lower pressure, clearing', '气温升高，气压降低，天气转晴'], ['Colder, higher pressure, clearing', '气温下降，气压升高，天气转晴'], ['Colder, lower pressure, rainy', '气温下降，气压降低，阴雨'], ['No change', '没有变化']],
        answer: 0,
        why: ['The warm air is climbing over the cold: a warm front. Once it passes, warm air takes over.', '暖气团沿冷气团爬升，是暖锋；过境后受暖气团控制，气温升高、气压降低、天气转晴。'],
      },
      {
        q: ['Match each kind of weather with its system.', '把天气现象与天气系统连起来。'],
        match: [
          [['Cold wave', '寒潮'], ['Cold front', '冷锋']],
          [['Plum rains', '梅雨'], ['Jianghuai quasi-stationary front', '江淮准静止锋']],
          [['Typhoon', '台风'], ['Cyclone (low)', '气旋（低压）']],
          [['Summer drought on the Yangtze', '长江中下游伏旱'], ['Subtropical high (anticyclone)', '副热带高压（反气旋）']],
        ],
        why: ['Fronts, lows and highs each bring their own weather.', '锋面、气旋和反气旋各有典型的天气。'],
      },
      {
        q: ['A northern-hemisphere cyclone… Choose all.', '北半球的气旋（多选）'],
        options: [['Turns anticlockwise', '呈逆时针旋转'], ['Has rising air in the centre', '中心气流上升'], ['Usually brings cloud and rain', '多阴雨天气'], ['Has the highest pressure in the centre', '中心气压最高'], ['Spreads air outward', '气流向外辐散']],
        multi: [0, 1, 2],
        why: ['A cyclone is a low: air converges anticlockwise (NH), rises and makes cloud.', '气旋是低压，北半球气流逆时针辐合上升，多阴雨。'],
      },
      {
        q: ['Put the weather in order as a cold front passes.', '把冷锋过境前后的天气按顺序排列。'],
        order: [
          ['Before: warm, low pressure, fine', '过境前：受暖气团控制，气温较高，气压较低，天气晴朗'],
          ['During: wind, cloud, rain, cooling', '过境时：大风、阴天、降水、降温'],
          ['After: cold, high pressure, clear', '过境后：受冷气团控制，气温下降，气压升高，天气转晴'],
        ],
        why: ['The rain comes with and just behind the front; then the cold air brings clear skies.', '降水出现在锋面附近和锋后；之后受冷气团控制，天气转晴。'],
      },
      {
        q: ['Tap the region of the plum rains.', '在地球仪上点出梅雨的主要地区。'],
        at: [31, 117], tolKm: 450,
        why: ['The Jianghuai front stalls over the middle and lower Yangtze in June and July.', '6—7 月江淮准静止锋停留在长江中下游地区，形成梅雨。'],
      },
      {
        q: ['In a northern-hemisphere frontal cyclone, where is the cold front?', '北半球的锋面气旋中，冷锋位于'],
        options: [['Trailing south-west of the low', '低压中心的西南方'], ['East of the low', '低压中心的东方'], ['North of the low', '低压中心的北方'], ['Right over the centre', '低压中心正上方']],
        answer: 0,
        why: ['Air spirals in anticlockwise: cold northerly air sweeps round the west side into a cold front to the south-west; warm southerly air rides north-east into a warm front to the east.', '北半球气流逆时针辐合：西侧南下的冷空气形成西南方的冷锋，东侧北上的暖空气形成东方的暖锋。'],
      },
    ],
  },
  // ——— 8. properties and motion of sea water ———
  {
    id: 'h-ocean', strand: 'climate', grade: 'h1', tracks: [], unit: WATER, icon: 'ship', minutes: 18,
    title: ['Properties and motion of sea water', '海水的性质和运动'],
    blurb: ['Why the Red Sea is the saltiest sea, why a desert lies beside the Pacific, and where the great fishing grounds are.', '红海为什么最咸？太平洋边上为什么有沙漠？世界大渔场分布在哪里？'],
    keys: [
      ['Sea-surface temperature falls from the equator to the poles; below about 1000 m the water is cold (2–4 °C) everywhere.', '表层海水温度由低纬向高纬递减；海水温度随深度增加而降低，1000 米以下变化很小。'],
      ['Salinity is highest in the subtropics (more evaporation than rain) and lower at the equator, in the high latitudes and near river mouths: the Red Sea is the saltiest, the Baltic among the freshest.', '表层海水盐度由副热带海区向南北两侧递减：副热带海区蒸发旺盛、降水少，盐度最高；红海盐度最高，波罗的海盐度最低（降水多、径流注入多、蒸发弱）。'],
      ['Wind drives the surface currents; compensation currents (including upwelling) fill the gaps. In the low and middle latitudes, gyres turn clockwise in the north and anticlockwise in the south; the North Indian Ocean follows the monsoon: clockwise in summer, anticlockwise in winter.', '洋流按成因有风海流、补偿流等。中低纬海区形成以副热带为中心的大洋环流，北半球呈顺时针、南半球呈逆时针；北印度洋为季风洋流，“夏顺冬逆”。'],
      ['Warm currents warm and moisten the coast; cold currents cool and dry it (the Peru and Namib deserts). Upwelling and the meeting of warm and cold water make the great fishing grounds; currents also spread pollution and speed or slow ships.', '暖流增温增湿，寒流降温减湿（秘鲁、纳米布沙漠）；上升流和寒暖流交汇处形成大渔场（秘鲁渔场、北海道渔场）；洋流还能加快污染物扩散、影响航行速度。'],
    ],
    steps: [
      {
        title: ['Sea temperature', '海水温度'], cam: [10, 160, 3.6], wide: true,
        paint: [
          { fill: { k: 'band', s: -23.4, n: 23.4, c: C.red }, a: 0.22 },
          { fill: { k: 'band', s: 23.4, n: 66.6, c: C.gold }, a: 0.16, t: 0.3 }, { fill: { k: 'band', s: -66.6, n: -23.4, c: C.gold }, a: 0.16, t: 0.3 },
          { fill: { k: 'band', s: 66.6, n: 90, c: C.blue }, a: 0.25, t: 0.6 }, { fill: { k: 'band', s: -90, n: -66.6, c: C.blue }, a: 0.25, t: 0.6 },
        ],
        marks: [mk([0, 170], 'About 28 °C', '约 28 °C', { c: C.red, t: 0.4 }), mk([45, 170], 'About 10 °C', '约 10 °C', { c: C.gold, t: 0.7 }), mk([-60, 170], 'About 0 °C', '约 0 °C', { c: C.ice, t: 1 })],
        fig: {
          k: 'line', title: ['Sea temperature with depth', '海水温度随深度的变化'], unit: ['°C · depth (m)', '°C · 深度（米）'],
          x: [0, 250, 500, 750, 1000, 1500, 2000, 3000],
          series: [{ name: ['Low latitudes', '低纬海区'], c: C.red, y: [27, 18, 10, 7, 5, 4, 3, 2] }, { name: ['High latitudes', '高纬海区'], c: C.blue, y: [3, 3, 2.5, 2.5, 2, 2, 2, 1.5] }],
          notes: [{ x: 1000, text: ['Below 1000 m: cold everywhere', '1000 米以下：普遍低温'] }],
        },
        body: ['The sea is heated by sunshine from above, so the surface follows the Sun: about 28 °C in the tropics, falling towards the poles where it is near freezing. In summer the surface is warmer than in winter. Sunlight only warms the top few hundred metres, so temperature falls quickly with depth; below about 1000 m the water is a steady 2–4 °C everywhere, even under the equator.',
          '海水的热量主要来自太阳辐射。表层海水温度由低纬向高纬递减：热带海区约 28 °C，极地海区接近 0 °C；同一海区夏季水温高于冬季。太阳辐射只能加热表层，因此海水温度随深度增加而降低，1000 米以下的深层海水普遍保持在 2—4 °C，即使在赤道也一样。'],
      },
      {
        title: ['Salinity and density', '海水的盐度和密度'], cam: [30, 25, 2.8], sketch: true,
        marks: [
          mk([20, 38.5], 'Red Sea: above 40‰', '红海：超过 40‰', { dot: true, c: C.orange, t: 0.4 }),
          mk([58, 20], 'Baltic Sea: 7–8‰', '波罗的海：7—8‰', { dot: true, c: C.teal, t: 0.8 }),
          mk([35, 18], 'Mediterranean: about 38‰', '地中海：约 38‰', { c: C.gold, t: 1.2 }),
        ],
        fig: {
          k: 'line', title: ['Surface salinity by latitude', '表层海水盐度随纬度的变化'], unit: ['‰ · latitude', '‰ · 纬度'],
          x: [-60, -40, -20, 0, 20, 40, 60], min: 33, max: 36,
          series: [{ name: ['Salinity', '盐度'], c: C.gold, y: [33.9, 34.6, 35.6, 34.8, 35.6, 34.8, 33.2] }],
          notes: [{ x: 20, text: ['Subtropics: highest', '副热带：最高'] }],
        },
        body: ['Salinity is the salt in each kilogram of sea water, about 35‰ on average. It is set by the balance of evaporation, rain and fresh water from rivers and ice. The subtropics, under sinking dry air, evaporate more than it rains: highest salinity. The rainy equator and the cool high latitudes are fresher. The Red Sea, hot, almost rainless, with no rivers flowing in, is above 40‰; the Baltic, cool, rainy, fed by many rivers and nearly closed off, is only 7–8‰. Colder and saltier water is denser; dense polar water sinks and creeps along the ocean floor.',
          '盐度是每千克海水中所含盐类物质的克数，平均约 35‰，主要受蒸发量与降水量的对比、河流径流、结冰融冰等影响。副热带海区受下沉气流控制，蒸发量大于降水量，盐度最高；赤道附近降水多，高纬度海区蒸发弱，盐度较低。红海地处副热带，炎热少雨，几乎没有河流注入，盐度超过 40‰；波罗的海纬度高、蒸发弱，降水较多，又有众多河流注入，海域封闭，盐度只有 7—8‰。温度越低、盐度越高，海水密度越大；极地高密度的海水下沉，沿洋底流动。'],
      },
      {
        title: ['Waves and tides', '海浪与潮汐'],
        astro: { kit: 'tides', mode: 'daily', place: { name: ['Qiantang estuary', '钱塘江口'], lat: 30.3, lon: 120.6 }, clock: { from: 0, to: 50, rate: 2, unit: 'hour' } },
        body: ['Waves are made by the wind blowing over the water; storms raise storm surges that flood low coasts, and undersea earthquakes set off tsunamis. Tides are the slow rise and fall of the sea, twice a day, caused by the Moon\'s and the Sun\'s pull. In funnel-shaped bays the tide piles up: the bore of the Qiantang River near Hangzhou, especially around the Mid-Autumn Festival, is one of the world\'s most famous. Tides are used for fishing, salt-making, ports and tidal power.',
          '海浪是在风的作用下海水的起伏运动；风暴潮会使沿海水位猛涨，淹没低地；海底地震可引发海啸。潮汐是海水在月球和太阳引力作用下发生的周期性涨落，一般一天两次。在喇叭形的河口，潮水被挤压抬高，形成壮观的涌潮，钱塘江大潮在农历八月十八前后最为壮观。人们利用潮汐赶海、晒盐、进出港口和发电。'],
      },
      {
        title: ['Currents: the Pacific gyres', '洋流：太平洋的大洋环流'], cam: [8, -170, 3.6], wide: true, sketch: true,
        lines: [
          cur([[12, -110], [13, -140], [14, -170], [14, 160], [13, 135]], true, 0.2),
          cur([[13, 128], [22, 124], [30, 130], [35, 141]], true, 0.5),
          cur([[37, 145], [42, 170], [45, -160], [47, -135]], true, 0.8),
          cur([[45, -128], [35, -123], [25, -115], [15, -110]], false, 1.1),
          cur([[55, 165], [48, 153], [42, 145]], false, 1.4),
          cur([[-8, -85], [-10, -120], [-12, -160], [-14, 165], [-15, 150]], true, 1.7),
          cur([[-15, 154], [-25, 155], [-35, 153]], true, 2),
          cur([[-45, 160], [-48, -170], [-50, -130], [-52, -90]], false, 2.3),
          cur([[-45, -77], [-30, -74], [-15, -78], [-5, -83]], false, 2.6),
        ],
        marks: [
          mk([25, 130], 'Kuroshio (warm)', '日本暖流', { c: C.red, t: 0.6 }),
          mk([47, -155], 'N Pacific Current', '北太平洋暖流', { c: C.red, t: 0.9 }),
          mk([30, -126], 'California Current (cold)', '加利福尼亚寒流', { c: C.blue, t: 1.2 }),
          mk([52, 158], 'Oyashio (cold)', '千岛寒流', { c: C.blue, t: 1.5 }),
          mk([16, -150], 'N Equatorial Current (warm)', '北赤道暖流', { c: C.red, t: 0.3 }),
          mk([-10, -140], 'S Equatorial Current (warm)', '南赤道暖流', { c: C.red, t: 1.8 }),
          mk([-29, 158], 'E Australian Current (warm)', '东澳大利亚暖流', { c: C.red, t: 2.1 }),
          mk([-50, -150], 'West Wind Drift (cold)', '西风漂流', { c: C.blue, t: 2.4 }),
          mk([-22, -86], 'Peru Current (cold)', '秘鲁寒流', { c: C.blue, t: 2.7 }),
        ],
        fig: { k: 'key', set: 'custom', title: ['Ocean currents', '洋流'], items: [{ c: C.red, name: ['Warm current', '暖流'] }, { c: C.blue, name: ['Cold current', '寒流'] }] },
        body: ['The steady winds push the surface water along: these are wind-driven currents. The trade winds drive the equatorial currents west; at the continents they turn poleward, the westerlies drive them east, and they return towards the equator along the eastern sides of the oceans. Water that leaves a place is replaced by compensation currents. The result is a great gyre centred on each subtropical high: clockwise in the north Pacific, anticlockwise in the south. Currents flowing from warmer to colder seas are warm currents (red); from colder to warmer, cold currents (blue).',
          '盛行风吹拂海面，推动海水运动，形成风海流。信风推动赤道附近的海水向西流（南、北赤道暖流），遇到大陆后向高纬流去，在西风的吹送下向东流，再沿大洋东岸流回低纬。海水流走的地方，由相邻海区的海水补充，形成补偿流。于是在中低纬海区形成以副热带为中心的大洋环流：北半球呈顺时针方向，南半球呈逆时针方向。从水温高的海区流向水温低的海区的是暖流（红色），反之是寒流（蓝色）。'],
      },
      {
        title: ['Atlantic and Indian Oceans', '大西洋和印度洋的洋流'], cam: [0, 10, 3.8], wide: true, sketch: true,
        lines: [
          cur([[24, -80], [33, -77], [40, -65]], true, 0.2),
          cur([[42, -50], [48, -35], [55, -15], [62, 0], [68, 12]], true, 0.5),
          cur([[42, -15], [32, -15], [22, -19]], false, 0.8),
          cur([[62, -58], [52, -53], [45, -52]], false, 1.1),
          cur([[15, -20], [15, -40], [16, -60]], true, 1.4),
          cur([[-5, 5], [-7, -20], [-8, -33]], true, 1.4),
          cur([[-10, -35], [-22, -40], [-35, -50]], true, 1.7),
          cur([[-35, 15], [-25, 12], [-15, 10]], false, 2),
          cur([[-12, 100], [-14, 75], [-15, 50]], true, 2.3),
          cur([[-15, 42], [-25, 38], [-35, 25]], true, 2.6),
          cur([[-40, 112], [-30, 112], [-20, 108]], false, 2.9),
          cur([[-45, -60], [-48, -20], [-45, 15]], false, 3.2),
          cur([[-42, 20], [-45, 60], [-45, 100], [-45, 140]], false, 3.4),
        ],
        marks: [
          mk([33, -70], 'Gulf Stream', '墨西哥湾暖流', { c: C.red, t: 0.4 }),
          mk([55, -28], 'N Atlantic Drift', '北大西洋暖流', { c: C.red, t: 0.7 }),
          mk([30, -24], 'Canary', '加那利寒流', { c: C.blue, t: 1 }),
          mk([-27, 5], 'Benguela', '本格拉寒流', { c: C.blue, t: 2.1 }),
          mk([-25, 45], 'Mozambique', '莫桑比克暖流', { c: C.red, t: 2.7 }),
          mk([56, -56], 'Labrador', '拉布拉多寒流', { c: C.blue, t: 1.2 }),
          mk([-22, -37], 'Brazil', '巴西暖流', { c: C.red, t: 1.8 }),
          mk([-50, 40], 'West Wind Drift', '西风漂流', { c: C.blue, t: 3.4 }),
        ],
        fig: { k: 'key', set: 'custom', title: ['Ocean currents', '洋流'], items: [{ c: C.red, name: ['Warm current', '暖流'] }, { c: C.blue, name: ['Cold current', '寒流'] }] },
        body: ['The Atlantic repeats the pattern: the Gulf Stream carries tropical water north-east, and the North Atlantic Drift takes its warmth all the way to Norway; the Canary and Benguela currents flow towards the equator along Africa\'s west coast. In the southern oceans there is no land to stop the westerlies, so the cold West Wind Drift flows right round Antarctica, linking the three oceans. Notice that on the east side of each ocean (the west coast of a continent) the low-latitude current is cold, while on the west side it is warm.',
          '大西洋的洋流分布规律与太平洋相似：墨西哥湾暖流把热带海水送往东北方，北大西洋暖流把温暖一直带到挪威沿岸；加那利寒流、本格拉寒流沿非洲西岸流向赤道。南半球中高纬海区没有陆地阻挡，西风漂流环绕南极洲流动，把三大洋连在一起。注意：中低纬海区，大洋东岸（大陆西岸）是寒流，大洋西岸（大陆东岸）是暖流。'],
      },
      {
        title: ['North Indian Ocean: currents follow the monsoon', '北印度洋：季风洋流'], cam: [10, 72, 2.5], sketch: true,
        lines: [
          ...arrows([[[-8, 60], [2, 52], [12, 60]], [[1, 64], [8, 69], [15, 73]]], C.orange, 0.2, 1.4),
          cur([[0, 45], [8, 52], [12, 57]], true, 0.8),
          cur([[12, 60], [8, 70], [4.5, 80], [5, 88], [6, 94]], true, 1.2),
        ],
        marks: [mk([14, 66], 'Summer: SW monsoon', '夏季：西南季风', { c: C.orange, t: 0.4 }), mk([3, 76], 'Clockwise in summer', '夏季顺时针', { c: C.red, t: 1.4 })],
        fig: { k: 'svg', draw: indianFig },
        body: ['North of the equator the Indian Ocean is small and enclosed by Asia, so its currents follow the monsoon rather than the trades. In summer the south-west monsoon drives the water clockwise: north along Somalia and east past India. In winter the north-east monsoon reverses it to anticlockwise. Chinese textbooks sum it up as "clockwise in summer, anticlockwise in winter". Sailing ships of Zheng He\'s fleet timed their voyages to these winds and currents.',
          '北印度洋被亚洲大陆包围，受季风影响显著，形成季风洋流。夏季盛行西南季风，洋流沿索马里沿岸北上、经印度南部向东流，呈顺时针方向；冬季盛行东北季风，洋流呈逆时针方向，简称“夏顺冬逆”。郑和下西洋时就利用了季风和洋流：冬季顺东北季风出发，夏季顺西南季风返航。'],
      },
      {
        title: ['Currents and climate', '洋流对气候的影响'], cam: [25, -5, 3.8], wide: true, sketch: true,
        paint: [{ fill: { k: 'climate', only: ['maritime', 'desert'] }, a: 0.55 }],
        lines: [
          cur([[42, -50], [48, -35], [55, -15], [62, 0], [68, 12], [71, 30]], true, 0.2),
          cur([[42, -15], [32, -15], [22, -19]], false, 0.6),
          cur([[-35, 15], [-25, 12], [-15, 10]], false, 1),
        ],
        marks: [
          mk([69, 33], 'Murmansk: ice-free port', '摩尔曼斯克：终年不冻港', { dot: true, c: C.red, t: 0.6 }),
          mk([50, 5], 'Western Europe: mild, wet', '西欧：温和湿润', { c: C.teal, t: 0.9 }),
          mk([24, -14], 'Sahara coast: fog, dry', '撒哈拉西岸：多雾干燥', { c: C.gold, t: 1.2 }),
          mk([-23, 15], 'Namib Desert', '纳米布沙漠', { dot: true, c: C.gold, t: 1.5 }),
        ],
        body: ['Currents carry heat. The North Atlantic Drift keeps western Europe far milder than places at the same latitude in Canada, and Murmansk, inside the Arctic Circle, stays ice-free all winter. Warm currents warm and moisten the air above them. Cold currents chill the air from below, making it stable: little rises, so there is little rain. Beside the Benguela Current lies the Namib Desert, where fog rolls in but rain almost never falls; the Atacama beside the Peru Current is the driest place on Earth.',
          '洋流能调节全球热量分布。北大西洋暖流使西欧比同纬度的加拿大温暖得多，位于北极圈内的摩尔曼斯克成为终年不冻港。暖流对沿岸气候有增温增湿作用；寒流使近地面空气冷却，大气层结稳定，不易形成降水，有降温减湿作用。本格拉寒流沿岸的纳米布沙漠多雾少雨，秘鲁寒流沿岸的阿塔卡马沙漠是世界最干燥的地方之一。'],
      },
      {
        title: ['Fisheries, pollution and shipping', '洋流对渔场、污染和航行的影响'], cam: [-14, -78, 2.6], sketch: true,
        paint: [{ fill: { k: 'poly', pts: blob(-10, -81, 7, 3), c: C.teal }, a: 0.35, t: 0.8 }],
        lines: [
          cur([[-45, -77], [-30, -74], [-15, -79], [-5, -83]], false, 0.2),
          ...arrows([[[-25, -95], [-18, -82]], [[-15, -98], [-10, -85]]], C.gold, 0.5, 1.4),
        ],
        marks: [
          mk([-10, -82], 'Peru fishery: upwelling', '秘鲁渔场：上升补偿流', { c: C.teal, t: 1 }),
          mk([-24, -69.5], 'Atacama Desert', '阿塔卡马沙漠', { dot: true, c: C.gold, t: 1.4 }),
          mk([-20, -95], 'SE trades push water offshore', '东南信风把表层海水吹离海岸', { c: C.gold, t: 0.6 }),
        ],
        body: ['Off Peru the south-east trades blow the surface water away from the coast, and cold water rises from the depths to replace it (an upwelling). It carries nutrients up into the sunlight; plankton bloom and anchovies swarm: the Peru fishery. The other great fishing grounds lie where warm and cold currents meet and stir the water, as off Hokkaido (Kuroshio meets Oyashio), Newfoundland and in the North Sea. Currents also spread oil spills and plastic far and wide but dilute them faster, and ships save time and fuel by sailing with them.',
          '秘鲁沿岸，东南信风把表层海水吹离海岸，深层冷海水上泛补充，形成上升补偿流，把海底的营养盐类带到表层，浮游生物大量繁殖，鱼类丰富，形成秘鲁渔场。寒暖流交汇处海水受到扰动，也易形成大渔场，如北海道渔场（日本暖流与千岛寒流交汇）、纽芬兰渔场和北海渔场。洋流能把污染物扩散到更大范围，加快净化速度，但也扩大了污染范围；海轮顺洋流航行可以节省时间和燃料。'],
      },
    ],
    quiz: [
      {
        q: ['Label these currents on the globe.', '在地球仪上标出下列洋流。'],
        place: [
          { text: ['Kuroshio (warm)', '日本暖流'], at: [28, 128], tolKm: 900 },
          { text: ['Peru Current (cold)', '秘鲁寒流'], at: [-20, -77], tolKm: 900 },
          { text: ['Benguela Current (cold)', '本格拉寒流'], at: [-25, 12], tolKm: 900 },
          { text: ['North Atlantic Drift (warm)', '北大西洋暖流'], at: [55, -20], tolKm: 900 },
        ],
        why: ['Warm currents run poleward on the west sides of oceans; cold currents run equatorward on the east sides.', '中低纬大洋西岸为暖流、东岸为寒流；北大西洋暖流流向西北欧。'],
      },
      {
        q: ['Match each current with its effect.', '把洋流与它的影响连起来。'],
        match: [
          [['North Atlantic Drift', '北大西洋暖流'], ['Murmansk stays ice-free', '摩尔曼斯克成为不冻港']],
          [['Benguela Current', '本格拉寒流'], ['The Namib Desert', '纳米布沙漠的形成']],
          [['Peru upwelling', '秘鲁沿岸上升流'], ['The Peru fishery', '秘鲁渔场']],
          [['Kuroshio meets Oyashio', '日本暖流与千岛寒流交汇'], ['The Hokkaido fishery', '北海道渔场']],
          [['Summer monsoon current', '北印度洋夏季季风洋流'], ['Clockwise in summer', '夏季呈顺时针方向']],
        ],
        why: ['Warm currents warm and moisten, cold currents cool and dry; upwelling and meeting currents feed fish.', '暖流增温增湿，寒流降温减湿；上升流和寒暖流交汇处多大渔场。'],
      },
      {
        q: ['Why is the Red Sea the saltiest sea?', '红海盐度最高的主要原因是'],
        options: [['Hot and dry, strong evaporation, almost no rivers flowing in', '炎热干燥，蒸发旺盛，几乎没有河流注入'], ['Many rivers bring salt from the land', '众多河流从陆地带来盐分'], ['It is at a high latitude and evaporation is weak', '纬度高，蒸发弱'], ['A cold current flows into it', '有寒流流入']],
        answer: 0,
        why: ['Under the subtropical high it evaporates far more than it rains, and no rivers dilute it.', '红海位于副热带，蒸发量远大于降水量，又几乎没有河流注入稀释。'],
      },
      {
        q: ['Which are true of sea temperature? Choose all.', '关于海水温度，正确的是（多选）'],
        options: [['Surface temperature falls from the equator to the poles', '表层水温由低纬向高纬递减'], ['It falls with depth', '水温随深度增加而降低'], ['Below about 1000 m it changes little', '1000 米以下水温变化很小'], ['The deep sea is warmest at the equator', '深海水温在赤道最高'], ['Winter surface water is warmer than summer', '同一海区冬季表层水温高于夏季']],
        multi: [0, 1, 2],
        why: ['The Sun heats only the surface; the deep ocean is cold everywhere.', '太阳辐射只加热表层，深层海水普遍低温。'],
      },
      {
        q: ['Put the North Pacific gyre in the order the water flows (starting near the equator).', '按海水流动方向排列北太平洋环流（从赤道附近开始）。'],
        order: [['North Equatorial Current', '北赤道暖流'], ['Kuroshio', '日本暖流'], ['North Pacific Current', '北太平洋暖流'], ['California Current', '加利福尼亚寒流']],
        why: ['West with the trades, north along Asia, east with the westerlies, south along America: clockwise.', '随信风向西，沿亚洲向北，随西风向东，沿美洲向南，呈顺时针方向。'],
      },
      {
        q: ['In summer, the North Indian Ocean current flows…', '夏季北印度洋的洋流'],
        options: [['Clockwise', '呈顺时针方向'], ['Anticlockwise', '呈逆时针方向'], ['Straight west', '一直向西流'], ['It stops', '停止流动']],
        answer: 0,
        why: ['The SW monsoon drives it clockwise: "clockwise in summer, anticlockwise in winter".', '夏季盛行西南季风，洋流呈顺时针方向，即“夏顺冬逆”。'],
      },
    ],
  },
];
