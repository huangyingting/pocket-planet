/** 七下 · 我们生活的大洲——亚洲、我们邻近的地区和国家（日本、东南亚）、澳大利亚、极地地区. */
import { C, arrows, mk, par, type Fig, type LL, type Lesson, type Pair } from './kit.ts';
import { CITIES, arrowDef, svg, tx } from './figs.ts';
import { ASIA_EUROPE, BERING, REGIONS, RIVERS, SUEZ } from './geo.ts';

const regions = ['Continents and regions', '大洲和地区'] as const;
const poles = ['The polar regions', '极地地区'] as const;
const flow = (pts: LL[], t: number, c: string = C.blue) => ({ pts, c, t, w: 1.4, flow: true, arrow: true, dur: 1.6 });

// ------------------------------------------------------------------------------------------------ hand-traced lines (sketch)

/** Salween (Nu River upstream), Tibet to Mawlamyine. */
const SALWEEN: LL[] = [[32.3, 92.2], [31.4, 94.5], [30.6, 96.3], [29.0, 98.4], [27.5, 98.8], [25.8, 98.9], [23.6, 98.8], [22.0, 98.5], [20.0, 98.2], [18.2, 97.7], [16.5, 97.6]];
/** Red River (Yuan River upstream), Yunnan to the Gulf of Tonkin. */
const RED_RIVER: LL[] = [[25.2, 100.4], [24.2, 101.4], [23.6, 102.0], [22.5, 103.95], [21.7, 104.9], [21.3, 105.4], [21.03, 105.85], [20.3, 106.55]];
const AMU_DARYA: LL[] = [[37.1, 72.6], [37.3, 69.5], [37.2, 67.3], [38.2, 65.0], [39.1, 63.6], [40.5, 62.0], [41.55, 60.6], [42.6, 59.6], [43.7, 59.0]];
const SYR_DARYA: LL[] = [[40.9, 72.5], [40.8, 71.0], [40.3, 69.6], [41.3, 68.7], [42.3, 68.3], [43.6, 67.0], [44.8, 65.5], [45.6, 63.3], [46.1, 61.0]];
const JAPAN_TRENCH: LL[] = [[41.5, 144.6], [39.5, 144.3], [37.5, 143.4], [35.5, 142.5], [34.0, 141.9]];
const NANKAI: LL[] = [[34.6, 138.6], [33.6, 137.2], [32.9, 135.0], [32.2, 133.0], [31.3, 131.8]];
const JP_BELT: LL[] = [[36.3, 140.3], [36.0, 139.3], [35.3, 137.6], [35.1, 136.2], [34.95, 135.0], [34.6, 133.8], [34.2, 132.4], [34.1, 131.2], [33.95, 130.6], [33.55, 130.2], [33.45, 130.9], [33.9, 131.9], [33.85, 133.0], [34.05, 134.6], [34.2, 135.6], [34.55, 136.6], [34.65, 137.6], [34.85, 138.6], [35.0, 139.7], [35.4, 140.4]];
const JIANZHEN: LL[] = [[32.39, 119.41], [31.9, 120.9], [31.0, 125.0], [31.27, 130.2], [33.5, 130.5], [34.0, 133.0], [34.69, 135.8]];
const GREAT_DIVIDE: LL[] = [[-11.0, 142.7], [-16.0, 145.3], [-20.0, 146.5], [-24.0, 149.5], [-27.5, 151.8], [-31.0, 151.5], [-34.0, 150.0], [-36.5, 148.3], [-37.5, 146.0], [-37.2, 142.5]];
const ARTESIAN: LL[] = [[-12.5, 142.2], [-18.0, 141.0], [-21.0, 145.5], [-25.0, 149.0], [-28.5, 150.8], [-32.0, 149.2], [-33.0, 146.0], [-31.0, 140.0], [-29.0, 135.8], [-26.0, 134.2], [-22.0, 137.0], [-17.5, 139.2]];
const AU_WEST: LL[] = [[-10, 112], [-10, 135.5], [-15, 135.5], [-20, 137], [-26, 136], [-30, 135.5], [-33, 137], [-36, 137], [-36, 112]];
const AU_MID: LL[] = [[-10, 135.5], [-10, 142.5], [-17, 144], [-24, 147], [-30, 148.5], [-34, 146.5], [-38, 142], [-36, 137], [-33, 137], [-30, 135.5], [-26, 136], [-20, 137], [-15, 135.5]];
const AU_EAST: LL[] = [[-10, 142.5], [-10, 155], [-44, 155], [-44, 140], [-38, 142], [-34, 146.5], [-30, 148.5], [-24, 147], [-17, 144]];
const MURRAY: LL[] = [[-36.8, 148.0], [-36.08, 146.92], [-36.13, 144.75], [-35.34, 143.55], [-34.19, 142.16], [-34.17, 140.75], [-34.03, 139.67], [-35.12, 139.27], [-35.56, 138.88]];
const DARLING: LL[] = [[-28.6, 150.3], [-29.6, 148.6], [-30.09, 145.94], [-31.56, 143.38], [-32.39, 142.42], [-34.11, 141.92]];
const WHEAT_SE: LL[] = [[-26, 149], [-26.5, 151], [-31, 150], [-35, 147.8], [-36.5, 145], [-36.6, 141], [-34.5, 138.6], [-32.6, 137.9], [-33, 140.5], [-32, 144], [-29, 147]];
const WHEAT_SW: LL[] = [[-28.5, 114.9], [-29, 117.5], [-32.5, 119.5], [-33.8, 122.5], [-34.3, 118.5], [-33.4, 116.4], [-30.5, 115.4]];
const CATTLE_N: LL[] = [[-14, 125], [-12.5, 131], [-12, 136], [-16, 138], [-14, 142], [-19, 144], [-23, 146], [-24, 141], [-21, 133], [-19, 126], [-16, 123.5]];
const ZS_KL: LL[] = [[-69.37, 76.37], [-71.5, 76.8], [-73.86, 76.97], [-76.5, 77.0], [-78.8, 77.1], [-80.42, 77.12]];
const NSR: LL[] = [[31.2, 121.8], [34.3, 129.5], [38.5, 134.5], [41.6, 140.2], [45.5, 149], [52, 159], [60, 175], [64.5, -172], [66.0, -169.2], [69.5, -176.5], [70.6, 170], [72.6, 155], [74.6, 140], [76.6, 120], [77.8, 104], [76.0, 90], [73.5, 75], [70.4, 58], [69.9, 48], [70.5, 33], [71.2, 25.5], [70, 18.5], [64, 8], [58, 5], [51.95, 4.1]];

// ------------------------------------------------------------------------------------------------ figure helpers

const r1 = (v: number) => Math.round(v * 10) / 10;
const fade = (d: number, s: string) => `<g class="f-fade" style="--d:${d}s">${s}</g>`;
const pts = (p: [number, number][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const hline = (x1: number, x2: number, y: number, c = 'fg-grid') => `<line x1="${x1}" x2="${x2}" y1="${r1(y)}" y2="${r1(y)}" class="${c}"/>`;
const dot = (x: number, y: number, c: string = C.white, r = 2.2) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${c}"/>`;

interface Clim { name: Pair; type: Pair; T: number[]; P: number[] }
/** One or two climate graphs on a shared scale (temperature line, rainfall bars), like the built-in `climo`.
 * `heads` replaces the titles, for "which place is this?" questions. Normals are approximate 1991–2020 means. */
const climo = (a: Clim, b?: Clim, heads?: [Pair, Pair?]): Fig => ({ k: 'svg', draw: L => {
  const all = b ? [a, b] : [a];
  const Ts = all.flatMap(c => c.T), Ps = all.flatMap(c => c.P);
  const tmin = Math.min(-10, Math.floor(Math.min(...Ts) / 10) * 10), tmax = Math.max(30, Math.ceil(Math.max(...Ts) / 10) * 10);
  const pmax = Math.max(100, Math.ceil(Math.max(...Ps) / 100) * 100), tstep = tmax - tmin > 60 ? 20 : 10;
  const panel = (c: Clim, ox: number, w: number, head?: Pair) => {
    const compact = !!b, x0 = ox + 26, x1 = ox + w - 26, y0 = 40, y1 = 136, mw = (x1 - x0) / 12;
    const ty = (t: number) => y1 - ((t - tmin) / (tmax - tmin)) * (y1 - y0), py = (p: number) => y1 - (p / pmax) * (y1 - y0);
    let o = '';
    for (let t = Math.ceil(tmin / tstep) * tstep; t <= tmax; t += tstep) o += hline(x0, x1, ty(t), t === 0 ? 'fg-zero' : 'fg-grid') + tx(x0 - 3, ty(t) + 3, String(t), 'fg-tick', 'e');
    for (let k = 0; k <= 4; k++) o += tx(x1 + 3, py((pmax * k) / 4) + 3, String((pmax * k) / 4), 'fg-tick fg-p', 's');
    c.P.forEach((p, m) => { o += `<rect x="${r1(x0 + m * mw + mw * 0.15)}" y="${r1(py(p))}" width="${r1(mw * 0.7)}" height="${r1(y1 - py(p))}" class="fg-bar f-grow" style="--d:${m * 0.04}s"/>`; });
    o += `<polyline points="${c.T.map((t, m) => `${r1(x0 + (m + 0.5) * mw)},${r1(ty(t))}`).join(' ')}" class="fg-temp f-draw" pathLength="1"/>`;
    c.T.forEach((t, m) => { o += `<circle cx="${r1(x0 + (m + 0.5) * mw)}" cy="${r1(ty(t))}" r="1.8" class="fg-tdot f-fade" style="--d:${0.6 + m * 0.05}s"/>`; });
    for (let m = 0; m < 12; m++) if (!compact || m % 2 === 0) o += tx(x0 + (m + 0.5) * mw, y1 + 10, String(m + 1), 'fg-tick', 'm');
    o += tx(x0 - 3, y0 - 5, '°C', 'fg-tick fg-t', 'e') + tx(x1 + 3, y0 - 5, 'mm', 'fg-tick fg-p', 's');
    const mean = c.T.reduce((s, v) => s + v, 0) / 12, sum = Math.round(c.P.reduce((s, v) => s + v, 0));
    o += tx(ox + (compact ? 4 : 6), 12, head ? L(head) : `${L(c.name)} · ${L(c.type)}`, 'fg-title');
    o += tx(ox + (compact ? 4 : 6), 23, L([`mean ${r1(mean)} °C · ${sum.toLocaleString('en-US')} mm a year`, `年均温 ${r1(mean)} °C · 年降水 ${sum} 毫米`]), 'fg-sub');
    return o;
  };
  if (!b) return svg(320, 152, panel(a, 0, 320, heads?.[0]), L(['Climate graph', '气候资料图']));
  return svg(340, 152, panel(a, 0, 170, heads?.[0]) + panel(b, 170, 170, heads?.[1]), L(['Climate graphs', '气候资料图']));
} });
const fromCity = (id: keyof typeof CITIES, type: Pair): Clim => ({ name: CITIES[id].name, type, T: CITIES[id].T, P: CITIES[id].P });

// Climate normals (approximate 1991–2020 means; JMA, TMD, BoM).
const TOKYO: Clim = { name: ['Tokyo', '东京'], type: ['Pacific side', '太平洋一侧'], T: [5.4, 6.1, 9.4, 14.3, 18.8, 21.9, 25.7, 26.9, 23.3, 18.0, 12.5, 7.7], P: [60, 57, 116, 134, 140, 168, 156, 155, 225, 235, 96, 58] };
const KANAZAWA: Clim = { name: ['Kanazawa', '金泽'], type: ['Sea of Japan side', '日本海一侧'], T: [4.0, 4.4, 7.6, 12.8, 17.8, 21.7, 25.9, 27.3, 23.3, 17.8, 12.0, 6.7], P: [256, 163, 157, 144, 139, 170, 233, 179, 232, 177, 251, 301] };
const BANGKOK: Clim = { name: ['Bangkok', '曼谷'], type: ['Tropical monsoon', '热带季风气候'], T: [27.0, 28.3, 29.5, 30.5, 30.0, 29.5, 29.0, 28.8, 28.3, 28.1, 27.8, 26.3], P: [13, 20, 42, 92, 248, 157, 176, 220, 334, 292, 49, 6] };
const SINGAPORE = fromCity('singapore', ['Tropical rainforest', '热带雨林气候']);
const ALICE: Clim = { name: ['Alice Springs', '艾丽斯斯普林斯'], type: ['Hot desert', '热带沙漠气候'], T: [29.2, 28.0, 25.2, 20.5, 15.6, 12.4, 11.8, 14.5, 19.3, 23.2, 26.3, 28.2], P: [40, 44, 33, 17, 18, 14, 13, 9, 9, 22, 29, 40] };
const DARWIN = fromCity('darwin', ['Tropical savanna', '热带草原气候']);
const VOSTOK: Clim = { name: ['Vostok', '东方站'], type: ['Ice cap', '极地冰原气候'], T: [-32.0, -44.3, -57.9, -64.7, -65.6, -65.2, -66.9, -67.5, -66.0, -57.0, -43.3, -32.4], P: [1, 1, 1, 1, 2, 1, 2, 2, 2, 2, 1, 1] };
const UTQIAGVIK: Clim = { ...fromCity('utqiagvik', ['Tundra', '极地苔原气候']), name: ['Utqiaġvik, Alaska', '乌特恰维克'] };

/** Asia's land along about 30–32°N, from the Mediterranean to the East China Sea. */
const asiaProfile: Fig = { k: 'svg', draw: L => {
  const X = (lon: number) => 30 + ((lon - 34) / (123 - 34)) * 284, Y = (e: number) => 128 - ((e + 500) / 6500) * 92;
  const prof: [number, number][] = [[34, 0], [34.8, 750], [35.5, -430], [36.2, 900], [38, 700], [40, 500], [42, 250], [44.5, 40], [47, 10], [48.5, 400], [50, 2700], [52, 2200],
    [54, 1300], [56, 1500], [58.5, 400], [61, 600], [64, 1000], [67, 1700], [69.8, 2800], [71, 200], [74, 220], [76, 450], [77.3, 4500], [79, 4600], [82, 5000], [85, 4800],
    [88, 4800], [92, 4600], [95, 4500], [98, 4200], [100.5, 4000], [102.3, 3000], [103.3, 1200], [104, 500], [106, 350], [108, 1000], [109.6, 1600], [110.6, 800], [111.5, 100],
    [114, 30], [118, 15], [121.5, 3], [122, 0]];
  const xy = prof.map(([l, e]) => [X(l), Y(e)] as [number, number]);
  let o = tx(4, 12, L(['Asia from west to east, about 30–32°N', '亚洲沿约 30°N—32°N 的地形剖面']), 'fg-title') + tx(4, 23, L(['heights greatly exaggerated', '垂直比例尺放大']), 'fg-sub');
  for (const e of [0, 2000, 4000, 6000]) o += hline(30, 314, Y(e), e === 0 ? 'fg-zero' : 'fg-grid') + tx(27, Y(e) + 3, String(e), 'fg-tick', 'e');
  o += tx(27, Y(6000) - 6, 'm', 'fg-tick', 'e');
  o += `<polygon points="${pts([[X(34), Y(-500)], ...xy, [X(122), Y(-500)]])}" class="fg-landfill"/>`;
  o += `<rect x="${X(122)}" y="${r1(Y(0))}" width="${r1(X(123) - X(122))}" height="${r1(Y(-500) - Y(0))}" class="fg-sea"/>`;
  o += `<polyline points="${pts(xy)}" class="fg-profile f-draw" pathLength="1"/>`;
  for (const l of [40, 60, 80, 100, 120]) o += tx(X(l), 137, `${l}°E`, 'fg-tick', 'm');
  o += fade(0.9, dot(X(35.5), Y(-430), C.ice) + tx(X(34), 147, L(['Dead Sea −430 m', '死海 −430 米']), 'fg-label'));
  o += fade(1.1, tx(X(45.5), 156, L(['Mesopotamian Plain', '美索不达米亚平原']), 'fg-tick', 'm'));
  o += fade(1.3, tx(X(54), Y(2700) - 5, L(['Iranian Plateau', '伊朗高原']), 'fg-tick', 'm'));
  o += fade(1.5, tx(X(72.5), 147, L(['Indus Plain', '印度河平原']), 'fg-tick', 'm'));
  o += fade(1.7, tx(X(88), Y(5000) - 5, L(['Qinghai–Tibet Plateau >4,000 m', '青藏高原 海拔 4000 米以上']), 'fg-label', 'm'));
  o += fade(1.9, tx(X(105), 156, L(['Sichuan Basin', '四川盆地']), 'fg-tick', 'm'));
  o += fade(2.1, tx(316, 147, L(['Yangtze plains', '长江中下游平原']), 'fg-tick', 'e'));
  return svg(320, 160, o, L(['Elevation profile of Asia along 30°N', '亚洲沿 30°N 地形剖面']));
} };

/** Rivers radiate from the high middle. */
const radialFig: Fig = { k: 'svg', draw: (L, id) => {
  const cx = 160, cy = 82;
  let o = arrowDef(`${id}a`, C.blue) + tx(4, 12, L(['Why Asia\'s rivers radiate outward', '亚洲河流呈放射状分布']), 'fg-title') + tx(4, 23, L(['sketch', '示意图']), 'fg-sub');
  o += `<ellipse cx="${cx}" cy="${cy}" rx="60" ry="27" fill="#7a5c43" opacity=".9"/>` + `<ellipse cx="${cx}" cy="${cy}" rx="40" ry="16" fill="#9c7653" opacity=".9"/>`;
  o += tx(cx, cy - 3, L(['High middle', '中部高原山地']), 'fg-label', 'm') + tx(cx, cy + 10, L(['Tibet · Pamirs · Mongolia', '青藏 · 帕米尔 · 蒙古']), 'fg-tick', 'm');
  const arr = (x1: number, y1: number, x2: number, y2: number, d: number) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.blue}" stroke-width="2" marker-end="url(#${id}a)" class="f-fade" style="--d:${d}s"/>`;
  o += arr(cx, cy - 28, cx, 36, 0.4) + fade(0.5, tx(cx + 6, 34, L(['Arctic Ocean: Ob, Yenisei, Lena', '北冰洋：鄂毕河、叶尼塞河、勒拿河']), 'fg-sub'));
  o += arr(cx + 61, cy, 262, cy, 0.8) + fade(0.9, tx(266, cy - 6, L(['Pacific:', '太平洋：']), 'fg-label') + tx(266, cy + 4, L(['Yellow River,', '黄河、长江、']), 'fg-sub') + tx(266, cy + 13, L(['Yangtze, Mekong', '湄公河']), 'fg-sub'));
  o += arr(cx, cy + 28, cx, 128, 1.2) + fade(1.3, tx(cx + 6, 138, L(['Indian Ocean: Ganges, Indus, Irrawaddy', '印度洋：恒河、印度河、伊洛瓦底江']), 'fg-sub', 'm'));
  o += `<line x1="${cx - 61}" y1="${cy}" x2="58" y2="${cy}" stroke="${C.orange}" stroke-width="2" stroke-dasharray="4 2" class="f-fade" style="--d:1.6s"/>` + `<circle cx="52" cy="${cy}" r="6" fill="${C.orange}" opacity=".7"/>`;
  o += fade(1.7, tx(6, cy - 14, L(['Inland: Amu Darya,', '内流河：阿姆河、']), 'fg-sub') + tx(6, cy + 18, L(['Syr Darya → Aral Sea', '锡尔河 → 咸海']), 'fg-sub'));
  return svg(320, 146, o, L(['Diagram of Asia\'s radial river pattern', '亚洲放射状水系示意图']));
} };

const asiaPop: Fig = { k: 'bars', title: ['Asia\'s most populous countries (2024)', '亚洲人口最多的国家（2024 年）'], unit: ['million people (UN, China: NBS)', '百万人'], rows: [
  { name: ['India', '印度'], v: 1451, c: C.orange }, { name: ['China', '中国'], v: 1408, c: C.red }, { name: ['Indonesia', '印度尼西亚'], v: 283, c: C.green },
  { name: ['Pakistan', '巴基斯坦'], v: 251, c: C.orange }, { name: ['Bangladesh', '孟加拉国'], v: 173, c: C.orange }, { name: ['Japan', '日本'], v: 124, c: C.gold },
  { name: ['Philippines', '菲律宾'], v: 116, c: C.green }, { name: ['Vietnam', '越南'], v: 101, c: C.green }] };
const asiaGdp: Fig = { k: 'bars', title: ['GDP per person, 2023', '人均国内生产总值（2023 年）'], unit: ['thousand US$ (IMF, approx.)', '千美元（约数）'], rows: [
  { name: ['Singapore', '新加坡'], v: 84.7, c: C.teal }, { name: ['Japan', '日本'], v: 33.8, c: C.teal }, { name: ['South Korea', '韩国'], v: 33.1, c: C.teal },
  { name: ['China', '中国'], v: 12.6, c: C.gold }, { name: ['Indonesia', '印度尼西亚'], v: 4.9, c: C.orange }, { name: ['India', '印度'], v: 2.5, c: C.orange }, { name: ['Nepal', '尼泊尔'], v: 1.4, c: C.orange }] };
const REG = { e: C.gold, se: C.green, s: C.orange, w: C.pink, c: C.lime, n: C.violet };
const regionKey: Fig = { k: 'key', set: 'custom', title: ['The six regions of Asia', '亚洲的六个地区'], items: [
  { c: REG.e, name: ['East Asia', '东亚'] }, { c: REG.se, name: ['Southeast Asia', '东南亚'] }, { c: REG.s, name: ['South Asia', '南亚'] },
  { c: REG.w, name: ['West Asia', '西亚'] }, { c: REG.c, name: ['Central Asia', '中亚'] }, { c: REG.n, name: ['North Asia', '北亚'] }] };

const jpImports: Fig = { k: 'bars', title: ['How much Japan imports (share of supply)', '日本主要资源的进口依存度'], unit: ['% imported, about 2022', '进口所占比重（%），约 2022 年'], rows: [
  { name: ['Iron ore', '铁矿石'], v: 100, c: C.brown }, { name: ['Crude oil', '原油'], v: 99.7, c: C.orange }, { name: ['Coal', '煤炭'], v: 99.6, c: C.white },
  { name: ['Natural gas', '天然气'], v: 97.8, c: C.teal }, { name: ['Soybeans', '大豆'], v: 94, c: C.lime }, { name: ['Wheat', '小麦'], v: 85, c: C.gold }] };

/** Mountains and rivers alternate across the Indochina Peninsula. */
const indochinaFig: Fig = { k: 'svg', draw: L => {
  const base = 118;
  // x, height (px above base) for a west–east section
  const prof: [number, number][] = [[4, 0], [18, 4], [34, 52], [46, 30], [62, 6], [74, 2], [86, 8], [100, 46], [118, 52], [134, 40], [146, 4], [158, 40], [172, 46], [186, 10],
    [198, 4], [210, 12], [222, 44], [236, 10], [248, 3], [262, 18], [280, 64], [298, 26], [310, 0]];
  const xy = prof.map(([x, h]) => [x, base - h] as [number, number]);
  let o = tx(4, 12, L(['Mountains and rivers alternate, running north–south', '山河相间，纵列分布']), 'fg-title') + tx(4, 23, L(['west–east section across the Indochina Peninsula, sketch', '中南半岛东西向剖面示意']), 'fg-sub');
  o += `<polygon points="${pts([[4, base], ...xy, [310, base]])}" class="fg-landfill"/><polyline points="${pts(xy)}" class="fg-profile f-draw" pathLength="1"/>`;
  o += `<rect x="0" y="${base - 2}" width="8" height="8" class="fg-sea"/><rect x="306" y="${base - 2}" width="14" height="8" class="fg-sea"/>`;
  const mt = (x: number, y: number, p: Pair, d: number) => fade(d, tx(x, y, L(p), 'fg-tick', 'm'));
  o += mt(34, base - 58, ['Arakan Mts', '若开山脉'], 0.6) + mt(110, base - 58, ['Shan Plateau', '掸邦高原'], 0.8) + mt(172, base - 52, ['Thai highlands', '泰国北部山地'], 1.0)
    + mt(222, base - 50, ['hills', '山地'], 1.1) + mt(280, base - 70, ['Annamite Range', '长山山脉'], 1.2);
  const riv = (x: number, p: Pair, row: number, d: number) => fade(d, dot(x, base - 3, C.blue, 3) + `<line x1="${x}" x2="${x}" y1="${base + 2}" y2="${base + 6 + row * 10}" class="fg-guide"/>` + tx(x, base + 13 + row * 10, L(p), 'fg-label', 'm'));
  o += riv(70, ['Irrawaddy', '伊洛瓦底江'], 0, 1.5) + riv(146, ['Salween', '萨尔温江'], 1, 1.7) + riv(198, ['Chao Phraya', '湄南河'], 0, 1.9) + riv(248, ['Mekong', '湄公河'], 1, 2.1);
  o += tx(6, base + 36, L(['W', '西']), 'fg-tick') + tx(314, base + 36, L(['E', '东']), 'fg-tick', 'e');
  return svg(320, base + 40, o, L(['Sketch section across the Indochina Peninsula', '中南半岛地形剖面示意图']));
} };

/** Australia from west to east, about 25–28°S. */
const auProfile: Fig = { k: 'svg', draw: L => {
  const X = (lon: number) => 30 + ((lon - 113) / (154 - 113)) * 284, Y = (e: number) => 120 - ((e + 100) / 1300) * 80;
  const prof: [number, number][] = [[113.5, 0], [114.5, 150], [116, 300], [118, 450], [121, 500], [124, 450], [127, 520], [129, 600], [130.6, 600], [131.0, 863], [131.3, 560],
    [133, 600], [135, 300], [136.5, 100], [137.3, -15], [138.5, 50], [141, 150], [144, 250], [147, 350], [149, 450], [150.5, 700], [151.7, 1000], [152.4, 600], [153.2, 0]];
  const xy = prof.map(([l, e]) => [X(l), Y(e)] as [number, number]);
  let o = tx(4, 12, L(['Australia from west to east, about 25–28°S', '澳大利亚东西向地形剖面（约 25°S—28°S）']), 'fg-title') + tx(4, 23, L(['heights greatly exaggerated, sketch', '垂直比例尺放大，示意']), 'fg-sub');
  for (const e of [0, 500, 1000]) o += hline(30, 314, Y(e), e === 0 ? 'fg-zero' : 'fg-grid') + tx(27, Y(e) + 3, String(e), 'fg-tick', 'e');
  o += tx(27, Y(1200) - 2, 'm', 'fg-tick', 'e');
  o += `<polygon points="${pts([[X(113.5), Y(-100)], ...xy, [X(153.2), Y(-100)]])}" class="fg-landfill"/>`;
  o += `<rect x="${X(112.6)}" y="${r1(Y(0))}" width="${r1(X(113.5) - X(112.6))}" height="${r1(Y(-100) - Y(0))}" class="fg-sea"/><rect x="${X(153.2)}" y="${r1(Y(0))}" width="${r1(X(154) - X(153.2))}" height="${r1(Y(-100) - Y(0))}" class="fg-sea"/>`;
  o += `<polyline points="${pts(xy)}" class="fg-profile f-draw" pathLength="1"/>`;
  o += `<rect x="${X(113.5)}" y="126" width="${r1(X(135) - X(113.5))}" height="4" fill="${C.brown}" opacity=".8"/><rect x="${X(135)}" y="126" width="${r1(X(149) - X(135))}" height="4" fill="${C.lime}" opacity=".8"/><rect x="${X(149)}" y="126" width="${r1(X(153.2) - X(149))}" height="4" fill="${C.green}" opacity=".8"/>`;
  o += fade(0.8, tx(X(121), 141, L(['Western Plateau', '西部高原']), 'fg-label', 'm') + tx(X(142), 141, L(['Central Lowlands', '中部平原']), 'fg-label', 'm') + tx(X(151.5), 141, L(['Eastern Highlands', '东部山地']), 'fg-label', 'm'));
  o += fade(1.2, dot(X(131), Y(863), C.orange) + tx(X(131), Y(863) - 5, L(['Uluru 863 m', '乌鲁鲁 863 米']), 'fg-tick', 'm'));
  o += fade(1.4, dot(X(137.3), Y(-15), C.ice) + tx(X(137.3), Y(-15) - 8, L(['Lake Eyre −15 m', '北艾尔湖 −15 米']), 'fg-tick', 'm'));
  o += fade(1.6, tx(X(151.7), Y(1000) - 5, L(['Great Dividing Range', '大分水岭']), 'fg-tick', 'e'));
  o += fade(1.8, tx(X(113.5), 36, L(['← Indian Ocean', '← 印度洋']), 'fg-tick') + tx(316, 36, L(['Pacific →', '太平洋 →']), 'fg-tick', 'e'));
  return svg(320, 148, o, L(['Elevation profile of Australia', '澳大利亚地形剖面']));
} };

/** Australia leaves Gondwana (sketch). */
const driftFig: Fig = { k: 'svg', draw: (L, id) => {
  const blob = (x: number, y: number, rx: number, ry: number, c: string, p: Pair, rot = 0) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" opacity=".75" transform="rotate(${rot} ${x} ${y})"/>` + tx(x, y + 3, L(p), 'fg-tick', 'm', ' style="fill:#14181d;font-weight:600"');
  const AN = '#dee2e6', AU = C.orange;
  let o = arrowDef(`${id}a`, C.red) + tx(4, 12, L(['Australia drifts away alone', '澳大利亚大陆的漂移']), 'fg-title') + tx(4, 23, L(['sketch, not to scale', '示意图，未按比例']), 'fg-sub');
  const p1 = 4, p2 = 110, p3 = 216;
  o += fade(0.2, blob(p1 + 34, 60, 22, 16, '#bb6bd9', ['S. Am.', '南美']) + blob(p1 + 66, 52, 20, 18, C.gold, ['Africa', '非洲']) + blob(p1 + 76, 80, 10, 8, C.pink, ['India', '印度'])
    + blob(p1 + 52, 92, 26, 12, AN, ['Antarctica', '南极洲']) + blob(p1 + 82, 104, 16, 9, AU, ['Aus.', '澳']));
  o += fade(0.2, tx(p1 + 50, 134, L(['~200 million years ago:', '约 2 亿年前：']), 'fg-label', 'm') + tx(p1 + 50, 144, L(['Gondwana', '冈瓦纳古陆']), 'fg-sub', 'm'));
  o += fade(0.8, blob(p2 + 50, 100, 30, 12, AN, ['Antarctica', '南极洲']) + blob(p2 + 62, 66, 20, 11, AU, ['Australia', '澳大利亚'], -10)
    + `<path d="M${p2 + 30} 84 Q${p2 + 60} 80 ${p2 + 92} 84" fill="none" stroke="${C.blue}" stroke-width="1.4" stroke-dasharray="3 2"/>`);
  o += fade(0.8, tx(p2 + 50, 134, L(['85–35 million years ago:', '约 8500 万—3500 万年前：']), 'fg-label', 'm') + tx(p2 + 50, 144, L(['splits from Antarctica', '与南极洲分离']), 'fg-sub', 'm'));
  o += fade(1.4, blob(p3 + 50, 112, 30, 10, AN, ['Antarctica', '南极洲']) + blob(p3 + 54, 52, 22, 13, AU, ['Australia', '澳大利亚'], -8)
    + `<line x1="${p3 + 54}" y1="96" x2="${p3 + 54}" y2="70" stroke="${C.red}" stroke-width="1.8" marker-end="url(#${id}a)"/>`);
  o += fade(1.4, tx(p3 + 50, 134, L(['Today:', '现在：']), 'fg-label', 'm') + tx(p3 + 50, 144, L(['north ~7 cm a year', '每年向北约 7 厘米']), 'fg-sub', 'm'));
  return svg(320, 150, o, L(['Sketch of Australia separating from Gondwana', '澳大利亚大陆与冈瓦纳古陆分离示意']));
} };
const ironOre: Fig = { k: 'bars', title: ['Iron ore mined, 2023', '铁矿石产量（2023 年）'], unit: ['million tonnes of usable ore (USGS, approx.)', '百万吨（可用矿石，约数）'], rows: [
  { name: ['Australia', '澳大利亚'], v: 960, c: C.orange }, { name: ['Brazil', '巴西'], v: 440 }, { name: ['China', '中国'], v: 280 }, { name: ['India', '印度'], v: 270 }, { name: ['Russia', '俄罗斯'], v: 88 }, { name: ['Iran', '伊朗'], v: 81 }] };
const auCities: Fig = { k: 'bars', title: ['Australia\'s largest cities (2023)', '澳大利亚的主要城市（2023 年）'], unit: ['million people, greater city area (ABS)', '百万人（城市区域）'], rows: [
  { name: ['Sydney', '悉尼'], v: 5.45, c: C.gold }, { name: ['Melbourne', '墨尔本'], v: 5.21, c: C.gold }, { name: ['Brisbane', '布里斯班'], v: 2.71, c: C.gold }, { name: ['Perth', '珀斯'], v: 2.31, c: C.gold },
  { name: ['Adelaide', '阿德莱德'], v: 1.43, c: C.gold }, { name: ['Canberra', '堪培拉'], v: 0.47, c: C.violet }, { name: ['Darwin', '达尔文'], v: 0.15, c: C.gold }] };

/** Directions on polar maps. */
const polarViews: Fig = { k: 'svg', draw: (L, id) => {
  const R = 44;
  const view = (cx: number, cy: number, north: boolean, d: number) => {
    let o = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="rgba(77,171,247,.12)" stroke="${C.ice}" stroke-width="1"/>` + `<circle cx="${cx}" cy="${cy}" r="${R * 0.5}" fill="none" class="fg-guide"/>`;
    const spokes: [number, Pair][] = north ? [[90, ['0°', '0°']], [0, ['90°E', '90°E']], [-90, ['180°', '180°']], [180, ['90°W', '90°W']]]
      : [[-90, ['0°', '0°']], [0, ['90°E', '90°E']], [90, ['180°', '180°']], [180, ['90°W', '90°W']]];
    for (const [a, p] of spokes) {
      const c = Math.cos((a * Math.PI) / 180), s = Math.sin((a * Math.PI) / 180);
      o += `<line x1="${cx}" y1="${cy}" x2="${r1(cx + R * c)}" y2="${r1(cy + R * s)}" class="fg-guide"/>` + tx(cx + (R + 9) * c, cy + (R + 9) * s + 3, L(p), 'fg-tick', 'm');
    }
    // the turning Earth: anticlockwise over the North Pole, clockwise over the South Pole
    const a0 = north ? 40 : -40, a1 = -a0, rr = R * 0.78;
    const P = (a: number) => `${r1(cx + rr * Math.cos((a * Math.PI) / 180))} ${r1(cy + rr * Math.sin((a * Math.PI) / 180))}`;
    o += `<path d="M${P(a0 + 180)} A${rr} ${rr} 0 0 ${north ? 0 : 1} ${P(a1 + 180)}" fill="none" stroke="${C.gold}" stroke-width="1.6" marker-end="url(#${id}a)"/>`;
    o += `<path d="M${P(a0)} A${rr} ${rr} 0 0 ${north ? 0 : 1} ${P(a1)}" fill="none" stroke="${C.gold}" stroke-width="1.6" marker-end="url(#${id}a)"/>`;
    o += dot(cx, cy, C.white, 2.6) + tx(cx, cy - 5, north ? 'N' : 'S', 'fg-label', 'm');
    return fade(d, o);
  };
  let o = arrowDef(`${id}a`, C.gold) + tx(4, 12, L(['Reading directions on polar maps', '在极地地图上辨别方向']), 'fg-title');
  o += view(80, 82, true, 0.2) + view(240, 82, false, 0.7);
  o += tx(80, 150, L(['Over the North Pole: turns anticlockwise', '北极上空看：逆时针转']), 'fg-sub', 'm') + tx(80, 160, L(['every way out from N is south', '北极点四周都是南方']), 'fg-label', 'm');
  o += tx(240, 150, L(['Over the South Pole: turns clockwise', '南极上空看：顺时针转']), 'fg-sub', 'm') + tx(240, 160, L(['every way out from S is north', '南极点四周都是北方']), 'fg-label', 'm');
  return svg(320, 166, o, L(['North- and south-polar views with the direction of rotation', '北极、南极俯视图与地球自转方向']));
} };

/** The ice sheet from Zhongshan Station to Kunlun Station. */
const iceProfile: Fig = { k: 'svg', draw: L => {
  const X = (km: number) => 34 + (km / 1250) * 276, Y = (e: number) => 132 - ((e + 500) / 5000) * 100;
  const ice: [number, number][] = [[0, 0], [40, 600], [100, 1500], [200, 2050], [300, 2300], [520, 2620], [700, 3000], [850, 3350], [1000, 3700], [1150, 3980], [1230, 4090], [1250, 4093]];
  const bed: [number, number][] = [[0, 0], [60, -150], [150, 300], [300, 600], [450, 1100], [520, 900], [650, 1400], [800, 800], [950, 1700], [1050, 2300], [1150, 1600], [1250, 1000]];
  const I = ice.map(([k, e]) => [X(k), Y(e)] as [number, number]), B = bed.map(([k, e]) => [X(k), Y(e)] as [number, number]);
  let o = tx(4, 12, L(['Across the ice sheet: Zhongshan → Kunlun', '冰盖剖面：中山站 → 昆仑站']), 'fg-title') + tx(4, 23, L(['about 1,250 km inland; bedrock is a sketch', '向内陆约 1250 千米；冰下基岩为示意']), 'fg-sub');
  for (const e of [0, 2000, 4000]) o += hline(34, 310, Y(e), e === 0 ? 'fg-zero' : 'fg-grid') + tx(31, Y(e) + 3, String(e), 'fg-tick', 'e');
  o += tx(31, Y(4500) - 2, 'm', 'fg-tick', 'e');
  o += `<polygon points="${pts([...I, ...[...B].reverse()])}" class="fg-ice f-fade"/>`;
  o += `<polygon points="${pts([[X(0), Y(-500)], ...B, [X(1250), Y(-500)]])}" class="fg-rock" opacity=".85"/>`;
  o += `<rect x="4" y="${r1(Y(0))}" width="${r1(X(0) - 4)}" height="${r1(Y(-500) - Y(0))}" class="fg-sea"/>`;
  o += `<polyline points="${pts(I)}" fill="none" stroke="${C.ice}" stroke-width="1.6" class="f-draw" pathLength="1"/>`;
  const st = (km: number, e: number, p: Pair, a: 's' | 'm' | 'e', d: number, dy = -6) => fade(d, dot(X(km), Y(e), C.gold, 2.6) + tx(X(km), Y(e) + dy, L(p), 'fg-label', a));
  o += st(0, 0, ['Zhongshan', '中山站'], 's', 0.8, -6) + st(520, 2620, ['Taishan 2,621 m', '泰山站 2621 米'], 'm', 1.1) + st(1230, 4090, ['Kunlun 4,087 m (Dome A)', '昆仑站 4087 米（冰穹 A）'], 'e', 1.4);
  o += fade(1.8, tx(X(1150), Y(2800), L(['ice ≈3,100 m thick', '冰厚约 3100 米']), 'fg-tick', 'm') + tx(X(900), Y(-250), L(['Gamburtsev Mts under the ice', '冰下的甘布尔采夫山脉']), 'fg-tick', 'm'));
  for (const k of [0, 500, 1000]) o += tx(X(k), 144, `${k} km`, 'fg-tick', 'm');
  return svg(320, 150, o, L(['Cross-section of the East Antarctic ice sheet', '南极冰盖剖面示意']));
} };

/** The Antarctic and the Arctic compared. */
const poleTable: Fig = { k: 'svg', draw: L => {
  const rows: [Pair, Pair, Pair][] = [
    [['Mainly', '主体'], ['A continent under ice', '冰雪覆盖的大陆'], ['An ocean with sea ice', '被海冰覆盖的大洋']],
    [['Around it', '周围'], ['Pacific, Atlantic, Indian Oceans', '太平洋、大西洋、印度洋'], ['Asia, Europe, N. America', '亚洲、欧洲、北美洲']],
    [['Height', '海拔'], ['Mean ≈2,350 m', '平均约 2350 米'], ['Sea level', '海平面']],
    [['Winter at the pole', '极点冬季'], ['≈ −60 °C', '约 −60 °C'], ['≈ −34 °C', '约 −34 °C']],
    [['Animals', '动物'], ['Penguins, seals, krill', '企鹅、海豹、磷虾'], ['Polar bears, walruses', '北极熊、海象']],
    [['People', '居民'], ['No native people', '无定居居民'], ['Inuit and others', '因纽特人等']],
    [['Rules', '规则'], ['Antarctic Treaty', '《南极条约》'], ['8 Arctic countries', '环北极八国']],
  ];
  const y0 = 30, rh = 16, cx = [4, 82, 204];
  let o = tx(4, 12, L(['The Antarctic and the Arctic', '南极地区与北极地区比较']), 'fg-title');
  o += `<rect x="${cx[1] - 3}" y="${y0 - 11}" width="120" height="${rh * rows.length + 15}" rx="3" fill="${C.ice}" opacity=".12"/>`;
  o += `<rect x="${cx[2] - 3}" y="${y0 - 11}" width="117" height="${rh * rows.length + 15}" rx="3" fill="${C.blue}" opacity=".14"/>`;
  o += tx(cx[1], y0, L(['Antarctic', '南极地区']), 'fg-label') + tx(cx[2], y0, L(['Arctic', '北极地区']), 'fg-label');
  rows.forEach(([h, a, b], i) => {
    const y = y0 + (i + 1) * rh;
    o += hline(4, 316, y - 11);
    o += fade(0.12 * i, tx(cx[0], y, L(h), 'fg-label') + tx(cx[1], y, L(a), 'fg-sub') + tx(cx[2], y, L(b), 'fg-sub'));
  });
  return svg(320, y0 + rh * rows.length + 8, o, L(['Table comparing the Antarctic and the Arctic', '南北极地区比较表']));
} };

/** Hours of daylight through the year (geometric, mid-month). */
const D2R = Math.PI / 180;
const dayLength = (lat: number, n: number) => {
  const dec = -23.44 * Math.cos((2 * Math.PI * (n + 10)) / 365) * D2R, x = -Math.tan(lat * D2R) * Math.tan(dec);
  return x <= -1 ? 24 : x >= 1 ? 0 : r1((2 * Math.acos(x)) / D2R / 15);
};
const MIDS = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349];
const daylight: Fig = { k: 'line', title: ['Hours of daylight, middle of each month', '每月中旬的昼长'], unit: ['hours (month 1–12)', '小时（横轴：1—12 月）'], x: MIDS.map((_, i) => i + 1), min: 0, max: 24,
  series: [{ name: ['Kunlun 80°S', '昆仑站 80°S'], c: C.gold, y: MIDS.map(n => dayLength(-80.42, n)) }, { name: ['Zhongshan 69°S', '中山站 69°S'], c: C.teal, y: MIDS.map(n => dayLength(-69.37, n)) },
    { name: ['Beijing 40°N', '北京 40°N'], c: C.red, y: MIDS.map(n => dayLength(39.9, n)) }] };
const iceCores: Fig = { k: 'bars', title: ['How far back ice cores reach', '冰芯记录的年代'], unit: ['thousand years', '千年'], rows: [
  { name: ['NGRIP, Greenland', '格陵兰 NGRIP'], v: 123, c: C.blue }, { name: ['Vostok', '东方站'], v: 420, c: C.ice }, { name: ['Dome Fuji', '富士冰穹'], v: 720, c: C.ice },
  { name: ['EPICA Dome C', 'EPICA 冰穹 C'], v: 800, c: C.ice }, { name: ['Beyond EPICA (2025)', '“超越 EPICA”（2025）'], v: 1200, c: C.teal }] };
const seaIce: Fig = { k: 'line', title: ['Arctic sea ice in September (the yearly minimum)', '北极 9 月海冰面积（全年最小值）'], unit: ['million km² (NSIDC)', '百万平方千米'], min: 0, max: 8,
  x: [1979, 1985, 1990, 1995, 2000, 2005, 2007, 2010, 2012, 2015, 2020, 2024], series: [{ name: ['Sea ice', '海冰'], c: C.ice, y: [7.05, 6.93, 6.24, 6.13, 6.25, 5.57, 4.27, 4.87, 3.57, 4.62, 3.92, 4.38] }],
  notes: [{ x: 2012, text: ['record low', '最低纪录'] }] };

const asiaLand = (a2: string[], c: string, t: number): { fill: { k: 'land'; a2: string[]; c: string }; t: number; a: number } => ({ fill: { k: 'land', a2, c }, t, a: 0.55 });
const EAST = ['CN', 'TW', 'MN', 'KP', 'KR', 'JP'], SEA = ['VN', 'LA', 'KH', 'TH', 'MM', 'MY', 'SG', 'ID', 'PH', 'BN', 'TL'], SOUTH = ['IN', 'PK', 'BD', 'NP', 'BT', 'LK', 'MV'];
const WEST = ['AF', 'IR', 'IQ', 'SA', 'YE', 'OM', 'AE', 'QA', 'BH', 'KW', 'JO', 'SY', 'LB', 'IL', 'PS', 'TR', 'CY', 'GE', 'AM', 'AZ'], CENTRAL = ['KZ', 'UZ', 'TM', 'KG', 'TJ'];
const sea = (ll: LL, en: string, zh: string, t: number) => mk(ll, en, zh, { c: C.ice, t });

export const REGIONS_L: Lesson[] = [
  {
    id: 'asia', strand: 'world', tracks: ['uk', 'us', 'ib'], grade: 'g7b', unit: regions, icon: 'mountain', minutes: 10,
    title: ['Asia', '亚洲'],
    blurb: ['The continent we live on: the biggest and most crowded, high in the middle, ringed by rivers and ruled by the monsoon.', '我们生活的大洲：面积最大、人口最多，中部高四周低，河流放射状，季风显著。'],
    keys: [
      ['Asia is the largest continent (about 44 million km², nearly 30% of the land) and spans the frigid, temperate and tropical zones; the Urals, Caspian, Caucasus, Suez Canal and Bering Strait mark its edges.', '亚洲是面积最大的大洲（约 4400 万平方千米，约占陆地的 30%），跨寒、温、热三带；以乌拉尔山脉、里海、大高加索山脉、苏伊士运河、白令海峡等与其他大洲分界。'],
      ['Six regions: East, Southeast, South, West, Central and North Asia; China, in East Asia, borders all five of the others.', '亚洲分为东亚、东南亚、南亚、西亚、中亚和北亚六个地区；中国位于东亚，与其他五个地区都相邻。'],
      ['The land is high in the middle and low around the edges, from Everest (8,848.86 m) to the Dead Sea shore (about −430 m), so the big rivers radiate outward to three oceans.', '地势中部高、四周低，既有世界最高峰珠穆朗玛峰（8848.86 米），也有陆地最低处死海（约 −430 米）；大河从中部向四周呈放射状流向三大洋。'],
      ['Climates are complex, continental climates cover the most land, and monsoons are the strongest on Earth: wet summers in the east and south, dry winters.', '气候复杂多样，大陆性气候分布广，季风气候显著：东部和南部夏季多雨、冬季干燥。'],
      ['About 4.8 billion people (about 59% of humanity) live here, mostly on the monsoon plains; three early civilisations and three world religions began in Asia.', '亚洲约有 48 亿人，约占世界人口的 59%，多分布在东部和南部的季风区平原；亚洲有三大古代文明发源地，也是三大宗教的发源地。'],
    ],
    steps: [
      {
        title: ['The largest continent', '面积最大的大洲'], cam: [42, 95, 4.5], wide: true, graticule: true,
        task: ['Turn the globe to each edge of Asia: find the four extreme capes, then the lines where Asia meets Europe, Africa and North America.', '转动地球，找到亚洲最北、最南、最东、最西的四个端点，再找出亚洲与欧洲、非洲、北美洲的分界线。'],
        paint: [{ fill: { k: 'continents', only: ['asia'] }, a: 0.5 }],
        lines: [{ pts: ASIA_EUROPE, c: C.gold, t: 0.6, w: 1.6, dur: 1.6 }, { pts: SUEZ, c: C.gold, t: 1, w: 2 }, { pts: BERING, c: C.gold, t: 1.2, w: 2 }, par(0, C.red, 0.2, { w: 0.8 })],
        marks: [mk([50, 95], 'Asia: about 44 million km²', '亚洲：约 4400 万平方千米', { big: true, t: 0.4 }),
          mk([77.72, 104.25], 'Cape Chelyuskin (N)', '切柳斯金角（最北）', { dot: true, t: 0.8 }), mk([66.08, -169.65], 'Cape Dezhnev (E)', '杰日尼奥夫角（最东）', { dot: true, t: 0.9 }),
          mk([39.48, 26.07], 'Cape Baba (W)', '巴巴角（最西）', { dot: true, t: 1 }), mk([1.27, 103.51], 'Tanjung Piai (S)', '皮艾角（最南）', { dot: true, t: 1.1 }),
          mk([58, 62], 'Urals', '乌拉尔山脉', { c: C.gold, t: 1.3 }), mk([30.6, 32.4], 'Suez Canal', '苏伊士运河', { c: C.gold, t: 1.4 }), mk([62.5, -174], 'Bering Strait', '白令海峡', { c: C.gold, t: 1.5 }),
          sea([80, 80], 'Arctic Ocean', '北冰洋', 1.6), sea([30, 150], 'Pacific Ocean', '太平洋', 1.7), sea([5, 80], 'Indian Ocean', '印度洋', 1.8)],
        body: ['Asia covers about 44 million km², nearly 30% of all the land on Earth, more than Europe and Oceania together. Its mainland runs from Cape Chelyuskin (77.7°N) to Tanjung Piai (1.3°N) at the tip of the Malay Peninsula, and its islands reach from about 11°S to 81°N, so it spans the frigid, temperate and tropical zones. East to west it stretches about 140° of longitude, from Cape Baba (26°E) to Cape Dezhnev (170°W). Three oceans wash its shores: the Arctic, the Pacific and the Indian. The Ural Mountains, Ural River, Caspian Sea, Greater Caucasus, Black Sea and Turkish Straits divide it from Europe; the Suez Canal from Africa; and the Bering Strait from North America.',
          '亚洲面积约 4400 万平方千米，约占世界陆地总面积的 30%，比欧洲和大洋洲加起来还大。大陆部分从最北的切柳斯金角（77.7°N）到马来半岛南端的皮艾角（1.3°N），加上岛屿则大约从 11°S 延伸到 81°N，跨寒、温、热三带。东西从巴巴角（26°E）到杰日尼奥夫角（170°W），跨经度约 140°。亚洲北临北冰洋，东临太平洋，南临印度洋。它与欧洲以乌拉尔山脉、乌拉尔河、里海、大高加索山脉、黑海和土耳其海峡为界，与非洲以苏伊士运河为界，与北美洲隔白令海峡相望。'],
      },
      {
        title: ['Six regions', '六个地区'], cam: [38, 88, 4.5], wide: true,
        fig: regionKey,
        task: ['Find China in the gold East Asia block, then trace its border: name a neighbour in each of the other five colours.', '在金色的东亚中找到中国，沿着中国的边界走一圈：在其他五种颜色的地区里各找出一个中国的邻国。'],
        paint: [asiaLand(EAST, REG.e, 0.2), asiaLand(SEA, REG.se, 0.5), asiaLand(SOUTH, REG.s, 0.8), asiaLand(WEST, REG.w, 1.1), asiaLand(CENTRAL, REG.c, 1.4),
          { fill: { k: 'poly', pts: [[82, 60], [82, 179.9], [40, 179.9], [40, 60]], c: REG.n, clip: ['RU'] }, t: 1.7, a: 0.55 }],
        marks: [mk([40, 110], 'East Asia', '东亚', { big: true, c: REG.e, t: 0.3 }), mk([8, 112], 'Southeast Asia', '东南亚', { big: true, c: REG.se, t: 0.6 }), mk([20, 78], 'South Asia', '南亚', { big: true, c: REG.s, t: 0.9 }),
          mk([28, 48], 'West Asia', '西亚', { big: true, c: REG.w, t: 1.2 }), mk([44, 66], 'Central Asia', '中亚', { big: true, c: REG.c, t: 1.5 }), mk([63, 105], 'North Asia', '北亚', { big: true, c: REG.n, t: 1.8 })],
        body: ['Asia has 48 countries, which geographers group into six regions by position. East Asia (China, Mongolia, the two Koreas, Japan) faces the Pacific; Southeast Asia (11 countries) lies between the Pacific and the Indian Ocean; South Asia is the Indian subcontinent south of the Himalayas. West Asia stretches from Afghanistan and Iran to Türkiye and Arabia; Central Asia is five landlocked countries around the Kazakh steppe; North Asia is Siberia, the Asian part of Russia. China touches all five other regions: Vietnam, Laos and Myanmar (Southeast), India, Nepal, Bhutan and Pakistan (South), Afghanistan (West), Kazakhstan, Kyrgyzstan and Tajikistan (Central) and Russia (North).',
          '亚洲共有 48 个国家，按地理位置可分为六个地区。东亚（中国、蒙古、朝鲜、韩国、日本）濒临太平洋；东南亚（11 个国家）位于太平洋和印度洋之间；南亚是喜马拉雅山脉以南的南亚次大陆。西亚从阿富汗、伊朗一直延伸到土耳其和阿拉伯半岛；中亚是哈萨克草原一带的五个内陆国；北亚指西伯利亚，即俄罗斯的亚洲部分。中国与其他五个地区都相邻：越南、老挝、缅甸（东南亚），印度、尼泊尔、不丹、巴基斯坦（南亚），阿富汗（西亚），哈萨克斯坦、吉尔吉斯斯坦、塔吉克斯坦（中亚），以及俄罗斯（北亚）。'],
      },
      {
        title: ['High in the middle, low at the edges', '中部高、四周低'], cam: [36, 82, 4.2], items: ['everest', 'an_snowleopard'],
        fig: asiaProfile,
        task: ['Read the profile from left to right, then find each named plain, plateau and basin on the globe.', '从左到右读剖面图，再在地球上找出图中的平原、高原和盆地。'],
        paint: [{ fill: { k: 'continents', only: ['asia'] }, a: 0.25 }, { fill: { k: 'poly', pts: REGIONS.asiaHigh, c: C.brown }, t: 0.4, a: 0.6 }],
        marks: [mk([33, 88], 'Qinghai–Tibet Plateau', '青藏高原', { big: true, c: C.brown, t: 0.6 }), mk([27.99, 86.93], 'Everest 8,848.86 m', '珠穆朗玛峰 8848.86 米', { dot: true, t: 0.9 }),
          mk([31.5, 35.5], 'Dead Sea ≈ −430 m', '死海 约 −430 米', { dot: true, c: C.ice, t: 1.1 }), mk([32, 55], 'Iranian Plateau', '伊朗高原', { c: C.brown, t: 1.3 }),
          mk([47, 103], 'Mongolian Plateau', '蒙古高原', { c: C.brown, t: 1.4 }), mk([62, 75], 'West Siberian Plain', '西西伯利亚平原', { c: C.green, t: 1.6 }),
          mk([26, 82], 'Indo-Gangetic Plain', '印度河—恒河平原', { c: C.green, t: 1.7 }), mk([33, 44.5], 'Mesopotamian Plain', '美索不达米亚平原', { c: C.green, t: 1.8 }), mk([36, 117], 'North China Plain', '华北平原', { c: C.green, t: 1.9 })],
        body: ['Plateaus and mountains cover about three quarters of Asia, and its average height, about 950 m, is the greatest of any continent except ice-capped Antarctica. The highest land is in the middle: the Qinghai–Tibet Plateau averages over 4,000 m, and the Himalayas on its southern edge hold Everest, 8,848.86 m, the highest peak on Earth. Around this core lie lower plateaus (Iranian, Mongolian, Deccan) and, at the edges, great plains: the West Siberian, Indo-Gangetic, Mesopotamian and North China plains. The Dead Sea shore, about 430 m below sea level, is the lowest dry land on Earth, so Asia holds both extremes. The profile along 30°N shows the shape: low in the west, a huge step up to Tibet, then down towards the East China Sea.',
          '亚洲高原、山地约占全洲面积的 3/4，平均海拔约 950 米，是除南极洲以外平均海拔最高的大洲。地势中部最高：青藏高原平均海拔 4000 米以上，其南缘的喜马拉雅山脉上有世界最高峰珠穆朗玛峰（8848.86 米）。中部高原山地的外围是较低的高原（伊朗高原、蒙古高原、德干高原），边缘则分布着广阔的平原：西西伯利亚平原、印度河—恒河平原、美索不达米亚平原、华北平原。死海湖岸低于海平面约 430 米，是陆地最低处，世界陆地的最高点和最低点都在亚洲。沿 30°N 的剖面清楚地显示出“中部高、四周低”：西部较低，向东陡升到青藏高原，再逐级降到东海之滨。'],
      },
      {
        title: ['Rivers radiate outward', '河流呈放射状流向四周'], cam: [42, 92, 4.5], wide: true,
        fig: radialFig,
        task: ['Follow each river from the high centre to its mouth: which ocean does it reach? Which two never reach the sea?', '沿每条河从中部高地追到河口：它注入哪个大洋？哪两条河最终没有流入海洋？'],
        paint: [{ fill: { k: 'poly', pts: REGIONS.asiaHigh, c: C.brown }, a: 0.4 }],
        lines: [flow(RIVERS.ob, 0.2), flow(RIVERS.yenisei, 0.35), flow(RIVERS.lena, 0.5), flow(RIVERS.yellow, 0.8), flow(RIVERS.yangtze, 0.95), flow(RIVERS.mekong, 1.1),
          flow(RIVERS.ganges, 1.4), flow(RIVERS.indus, 1.55), flow(RIVERS.irrawaddy, 1.7), flow(AMU_DARYA, 2, C.orange), flow(SYR_DARYA, 2.15, C.orange)],
        marks: [mk([66.5, 70], 'Ob', '鄂毕河', { c: C.blue, t: 1.5 }), mk([69, 87], 'Yenisei', '叶尼塞河', { c: C.blue, t: 1.6 }), mk([68, 124], 'Lena', '勒拿河', { c: C.blue, t: 1.7 }),
          mk([31, 115], 'Yangtze 6,300 km → Pacific', '长江 6300 千米 → 太平洋', { c: C.blue, t: 1.9 }), mk([15, 105.5], 'Mekong', '湄公河', { c: C.blue, t: 2 }),
          mk([24.5, 87.5], 'Ganges → Indian Ocean', '恒河 → 印度洋', { c: C.blue, t: 2.2 }), mk([45, 59.5], 'Aral Sea', '咸海', { c: C.orange, t: 2.4 }), mk([42, 50.5], 'Caspian Sea', '里海', { c: C.ice, t: 2.5 }),
          mk([53.5, 108], 'Lake Baikal', '贝加尔湖', { c: C.ice, t: 2.6 })],
        body: ['Because the middle is high, Asia\'s great rivers rise on the central plateaus and mountains and run outward in every direction, like the spokes of a wheel. The Ob, Yenisei and Lena flow north across Siberia to the Arctic Ocean; their upper courses thaw first in spring, so ice jams in the still-frozen lower reaches cause floods. The Yellow River, the Yangtze (6,300 km, Asia\'s longest) and the Mekong flow east and south-east to the Pacific; the Mekong passes China, Myanmar, Laos, Thailand, Cambodia and Vietnam. The Ganges, Indus and Irrawaddy flow south to the Indian Ocean. In the dry interior the Amu Darya and Syr Darya never reach the sea: they end in the Aral Sea, and the Caspian Sea is the largest lake on Earth.',
          '由于地势中部高、四周低，亚洲的大河多发源于中部的高原山地，像车轮的辐条一样呈放射状流向四周。鄂毕河、叶尼塞河、勒拿河向北流经西伯利亚注入北冰洋；春季上游先解冻，下游仍在封冻，冰块堵塞河道，容易形成凌汛。黄河、长江（6300 千米，亚洲最长）和湄公河向东、东南注入太平洋；湄公河流经中国、缅甸、老挝、泰国、柬埔寨、越南六国。恒河、印度河、伊洛瓦底江向南注入印度洋。干旱的内陆地区，阿姆河和锡尔河最终流入咸海，属于内流河；里海则是世界上面积最大的湖泊。'],
      },
      {
        title: ['Complex climates', '气候复杂多样'], cam: [35, 90, 4.5], wide: true,
        fig: { k: 'key', set: 'climate' },
        task: ['Compare the east coast with the interior at the same latitude: which side is wetter?', '比较同纬度的东部沿海和内陆：哪里更湿润？'],
        paint: [{ fill: { k: 'climate' }, a: 0.75 }],
        marks: [mk([1.3, 103.8], 'Singapore: rainforest', '新加坡：热带雨林气候', { dot: true, t: 0.6 }), mk([19.1, 72.9], 'Mumbai: tropical monsoon', '孟买：热带季风气候', { dot: true, t: 0.8 }),
          mk([31.2, 121.5], 'Shanghai: subtropical monsoon', '上海：亚热带季风气候', { dot: true, t: 1 }), mk([39.9, 116.4], 'Beijing: temperate monsoon', '北京：温带季风气候', { dot: true, t: 1.2 }),
          mk([24.7, 46.7], 'Riyadh: hot desert', '利雅得：热带沙漠气候', { dot: true, t: 1.4 }), mk([51.2, 71.4], 'Astana: temperate continental', '阿斯塔纳：温带大陆性气候', { dot: true, t: 1.6 }),
          mk([62.0, 129.7], 'Yakutsk: subarctic', '雅库茨克：亚寒带针叶林气候', { dot: true, t: 1.8 }), mk([29.65, 91.1], 'Lhasa: highland', '拉萨：高原山地气候', { dot: true, t: 2 })],
        body: ['Asia spans about 90° of latitude, rises from sea level to over 8,000 m and reaches inland more than 2,500 km from the sea, so its climates are complex and varied. The equatorial islands are hot and wet all year (tropical rainforest), and the north coast is tundra. The east and south are monsoon lands; the vast interior, far from any ocean, has continental and desert climates, which cover the largest share of Asia; Arabia is one of the driest deserts on Earth; and Tibet has a cold highland climate. The temperate maritime climate typical of western Europe is almost absent from Asia, because the westerlies reach Asia only after crossing a whole continent.',
          '亚洲南北跨纬度约 90°，海拔从海平面到 8000 米以上，内陆距海可达 2500 千米以上，因此气候复杂多样。赤道附近的岛屿全年高温多雨（热带雨林气候），北冰洋沿岸是苔原气候。东部和南部是季风气候区；广大内陆远离海洋，形成温带大陆性气候和沙漠气候，大陆性气候分布范围最广；阿拉伯半岛是世界上最干燥的地区之一；青藏高原则是寒冷的高原山地气候。亚洲几乎没有温带海洋性气候，因为西风吹到亚洲之前要先越过整个欧洲大陆。'],
      },
      {
        title: ['The strongest monsoons on Earth', '季风气候显著'], cam: [28, 102, 4.4], sketch: true, items: ['halong'],
        fig: climo(fromCity('mumbai', ['Tropical monsoon', '热带季风气候']), fromCity('shanghai', ['Subtropical monsoon', '亚热带季风气候'])),
        task: ['Teal arrows are summer winds from the sea, ice-blue arrows winter winds from the land. Then on the graphs, find the months when Mumbai gets its rain.', '青色箭头是夏季从海洋吹来的风，浅蓝色箭头是冬季从大陆吹来的风。再在图中找出孟买降水集中的月份。'],
        lines: [...arrows([[[-2, 62], [10, 68], [18, 74]], [[2, 84], [12, 87], [21, 89]], [[8, 132], [20, 124], [30, 117]], [[16, 142], [28, 132], [36, 125]]], C.teal, 0.2, 2),
          ...arrows([[[50, 102], [40, 114], [30, 119]], [[48, 112], [42, 125], [36, 130]], [[30, 86], [22, 82], [12, 78]]], C.ice, 1.4, 1.6)],
        marks: [mk([49, 100], 'Winter: Mongolia–Siberia High', '冬季：蒙古—西伯利亚高压', { c: C.ice, t: 1.8 }), mk([15, 128], 'Summer: wet winds from the sea', '夏季：海洋吹来的湿润气流', { c: C.teal, t: 0.8 }),
          mk([10, 66], 'South-west monsoon', '西南季风', { c: C.teal, t: 1 })],
        body: ['Asia is the biggest landmass beside the biggest ocean, so the difference between land and sea is greatest here. In winter the land cools much faster than the sea: cold dense air piles up as the Mongolia–Siberia High and blows out as dry north-west and north-east winds. In summer the land heats faster, pressure falls over the interior, and warm wet air flows in from the Pacific and the Indian Ocean; the South Asian monsoon is also pushed by the shift of the global wind belts. So rain falls mainly in summer: Mumbai gets over 90% of its 2,400 mm in June–September. When the monsoon is late or weak, droughts follow; when it is too strong, floods.',
          '亚洲是世界上最大的大陆，又濒临最大的大洋，海陆热力性质差异最为显著。冬季陆地降温比海洋快，大陆上冷空气堆积形成蒙古—西伯利亚高压，吹出寒冷干燥的西北风和东北风；夏季陆地升温快，内陆气压降低，暖湿气流从太平洋和印度洋吹向陆地；南亚的西南季风还与气压带、风带的季节移动有关。因此降水集中在夏季：孟买全年约 2400 毫米降水，90% 以上降在 6—9 月。季风来得晚或偏弱，就会发生旱灾；季风过强，则易发生洪涝。'],
      },
      {
        title: ['More than half of humanity', '世界人口最多的大洲'], cam: [28, 100, 4.5], wide: true, night: true,
        fig: asiaPop,
        task: ['Look at the night lights: where are people crowded, and where are there almost none?', '看夜间灯光：哪里人口稠密？哪里几乎无人居住？'],
        clock: { mode: 'day', start: Date.UTC(2025, 2, 20, 16), rate: 0 },
        marks: [mk([35.68, 139.69], 'Tokyo', '东京', { dot: true, t: 0.4 }), mk([28.61, 77.21], 'Delhi', '德里', { dot: true, t: 0.5 }), mk([31.23, 121.47], 'Shanghai', '上海', { dot: true, t: 0.6 }),
          mk([23.81, 90.41], 'Dhaka', '达卡', { dot: true, t: 0.7 }), mk([19.08, 72.88], 'Mumbai', '孟买', { dot: true, t: 0.8 }), mk([-6.2, 106.85], 'Jakarta', '雅加达', { dot: true, t: 0.9 }),
          mk([14.6, 120.98], 'Manila', '马尼拉', { dot: true, t: 1 }), mk([62, 100], 'Siberia: almost empty', '西伯利亚：人烟稀少', { c: C.ice, t: 1.4 }), mk([33, 86], 'Tibet: few people', '青藏高原：人口稀少', { c: C.ice, t: 1.5 })],
        body: ['About 4.8 billion people live in Asia, roughly 59% of the world\'s population, and India (about 1.45 billion) and China (1.41 billion) are the two most populous countries on Earth. They are packed onto the warm, wet monsoon plains and river deltas of East, Southeast and South Asia, where rice farming has fed dense populations for thousands of years; Bangladesh has over 1,100 people per km². Siberia, the Tibetan Plateau and the deserts of the interior are almost empty: too cold, too high or too dry. Asia\'s population is still growing, mostly in South and West Asia, while Japan, South Korea and China are ageing.',
          '亚洲约有 48 亿人，约占世界人口的 59%，印度（约 14.5 亿）和中国（约 14.1 亿）是世界上人口最多的两个国家。人口集中在东亚、东南亚和南亚温暖湿润的季风区平原和河口三角洲，这里种植水稻已有几千年，养活了稠密的人口；孟加拉国每平方千米超过 1100 人。西伯利亚、青藏高原和内陆沙漠则人烟稀少：或太冷，或太高，或太干。亚洲人口仍在增长，增长主要在南亚和西亚，而日本、韩国和中国则正在老龄化。'],
      },
      {
        title: ['Cradles of civilisation and faith', '古老文明与宗教的发源地'], cam: [30, 75, 4.2], items: ['ar_mohenjodaro'],
        fig: asiaGdp,
        lines: [flow(RIVERS.indus, 0.2), flow(RIVERS.yellow, 0.3), flow(RIVERS.ganges, 0.4)],
        marks: [mk([32.54, 44.42], 'Babylon · Mesopotamia', '巴比伦 · 两河流域', { dot: true, c: C.gold, t: 0.5 }), mk([27.33, 68.14], 'Mohenjo-daro · Indus', '摩亨佐—达罗 · 印度河流域', { dot: true, c: C.gold, t: 0.7 }),
          mk([36.13, 114.31], 'Yinxu · Yellow River', '殷墟 · 黄河流域', { dot: true, c: C.gold, t: 0.9 }), mk([24.7, 84.99], 'Bodh Gaya: Buddhism', '菩提伽耶：佛教', { dot: true, c: C.violet, t: 1.2 }),
          mk([31.78, 35.23], 'Christianity', '基督教', { dot: true, c: C.violet, t: 1.4 }), mk([21.42, 39.83], 'Mecca: Islam', '麦加：伊斯兰教', { dot: true, c: C.violet, t: 1.6 })],
        body: ['Three of the world\'s earliest civilisations grew on Asian river plains: Mesopotamia between the Tigris and Euphrates (writing by about 3200 BCE), the Indus valley (cities like Mohenjo-daro by about 2600 BCE) and the Yellow River (oracle-bone script at Yinxu, about 1300 BCE). Buddhism began in north India around the 5th century BCE, Christianity in Palestine in the 1st century CE and Islam in Arabia in the 7th century; all three spread worldwide. Today Asian economies differ enormously: Japan, South Korea and Singapore are rich, China is the world\'s second-largest economy, and many South Asian countries are still poor, as the GDP chart shows.',
          '亚洲的大河平原孕育了世界上最早的几个文明：底格里斯河、幼发拉底河之间的两河流域（约公元前 3200 年出现文字）、印度河流域（约公元前 2600 年出现摩亨佐—达罗等城市）和黄河流域（殷墟甲骨文，约公元前 1300 年）。佛教约公元前 5 世纪起源于印度北部，基督教 1 世纪起源于巴勒斯坦地区，伊斯兰教 7 世纪起源于阿拉伯半岛，后来都传播到世界各地。今天亚洲各国经济差异很大：日本、韩国、新加坡是发达国家，中国是世界第二大经济体，许多南亚国家仍较贫困，从人均国内生产总值图中可以看出这种差距。'],
      },
    ],
    quiz: [
      { q: ['Why does East Asia\'s winter wind blow from the north-west, cold and dry?', '东亚冬季为什么盛行寒冷干燥的西北风？'],
        options: [['The land cools faster than the sea, building high pressure over Mongolia and Siberia', '冬季陆地降温快，蒙古—西伯利亚形成高压，气流吹向海洋'], ['The sea is colder than the land in winter', '冬季海洋比陆地更冷'], ['Air always flows from west to east', '空气总是从西向东流动'], ['The Himalayas push the air north-west', '喜马拉雅山把空气推向西北']], answer: 0,
        why: ['Land has a lower heat capacity than water, so in winter it becomes much colder; cold dense air piles up as a high over Mongolia–Siberia and flows out towards the warmer, lower-pressure ocean.', '陆地比热容小，冬季降温比海洋快得多；冷空气在蒙古—西伯利亚堆积形成高压，吹向气压较低的海洋，形成西北季风。'] },
      { q: ['Which of these rivers flow into the Pacific Ocean? Pick all that apply.', '下列河流中，注入太平洋的有（多选）'],
        options: [['Yangtze', '长江'], ['Yellow River', '黄河'], ['Mekong', '湄公河'], ['Ob', '鄂毕河'], ['Ganges', '恒河'], ['Amu Darya', '阿姆河']], multi: [0, 1, 2],
        why: ['Rivers flowing east from the high centre reach the Pacific; the Ob flows north to the Arctic Ocean, the Ganges south to the Indian Ocean, and the Amu Darya ends inland in the Aral Sea.', '从中部高地向东流的河流注入太平洋；鄂毕河向北注入北冰洋，恒河向南注入印度洋，阿姆河则流入内陆的咸海。'] },
      { q: ['Label where these rivers reach the sea.', '在地球上标出这些河流的入海口。'],
        place: [{ text: ['Ob', '鄂毕河'], at: [66.5, 72], tolKm: 500 }, { text: ['Yangtze', '长江'], at: [31.4, 121.8], tolKm: 500 }, { text: ['Ganges', '恒河'], at: [22, 90], tolKm: 500 }, { text: ['Mekong', '湄公河'], at: [10, 106.5], tolKm: 500 }],
        why: ['The mouths face north, east and south: the river pattern spreads outward from the high middle.', '这些河口分别朝北、朝东、朝南，说明亚洲河流从中部高地呈放射状流向四周。'] },
      { q: ['Asia covers about 44 million km² of the world\'s 149 million km² of land. About what percentage is that?', '亚洲面积约 4400 万平方千米，世界陆地总面积约 1.49 亿平方千米。亚洲约占世界陆地面积的百分之几？'], num: { answer: 29.5, tol: 1, unit: ['%', '%'] },
        why: ['44 ÷ 149 ≈ 0.295, so almost 30%: nearly a third of all the land on Earth.', '44 ÷ 149 ≈ 0.295，约占 29.5%，接近世界陆地面积的三分之一。'] },
      { q: ['Match each country to its region of Asia.', '将国家与它所在的亚洲地区连线。'],
        match: [[['Mongolia', '蒙古'], ['East Asia', '东亚']], [['Laos', '老挝'], ['Southeast Asia', '东南亚']], [['Bangladesh', '孟加拉国'], ['South Asia', '南亚']], [['Saudi Arabia', '沙特阿拉伯'], ['West Asia', '西亚']], [['Kazakhstan', '哈萨克斯坦'], ['Central Asia', '中亚']]],
        why: ['Mongolia faces China in the east; Laos is on the Indochina Peninsula; Bangladesh is on the Ganges delta; Saudi Arabia fills Arabia; Kazakhstan is the biggest Central Asian country.', '蒙古位于东亚；老挝在中南半岛；孟加拉国在恒河三角洲；沙特阿拉伯占据阿拉伯半岛大部分；哈萨克斯坦是中亚面积最大的国家。'] },
      { q: ['Walk east along about 30°N. Put these landforms in the order you meet them.', '沿约 30°N 自西向东走，按经过的先后排列这些地形区。'],
        order: [['Mesopotamian Plain', '美索不达米亚平原'], ['Iranian Plateau', '伊朗高原'], ['Qinghai–Tibet Plateau', '青藏高原'], ['Sichuan Basin', '四川盆地'], ['Middle–lower Yangtze Plain', '长江中下游平原']],
        why: ['Low in the west, up across Iran, highest in Tibet, then stepping down through the Sichuan Basin to the Yangtze plains: high in the middle, low at the edges.', '西部低，经伊朗高原升高，青藏高原最高，再经四川盆地降到长江中下游平原，体现了“中部高、四周低”。'] },
      { q: ['This graph is from a mystery city in Asia. Which climate is it?', '这是亚洲某城市的气候资料图。它属于哪种气候？'], fig: climo(fromCity('mumbai', ['', '']), undefined, [['Mystery city', '某城市']]),
        options: [['Tropical monsoon', '热带季风气候'], ['Tropical rainforest', '热带雨林气候'], ['Subtropical monsoon', '亚热带季风气候'], ['Hot desert', '热带沙漠气候']], answer: 0,
        why: ['Hot all year (every month above 24 °C) with a very wet summer and a long dry season: a tropical monsoon climate. It is Mumbai.', '全年高温（各月均在 24 °C 以上），夏季降水极多，其余月份干燥，是热带季风气候。这是孟买。'] },
      { q: ['Tap the lowest dry land on Earth.', '在地球上点出陆地最低处。'], at: [31.5, 35.5], tolKm: 300,
        why: ['The Dead Sea shore, on the border of Jordan and Israel/Palestine in West Asia, is about 430 m below sea level.', '陆地最低处是西亚的死海湖岸，低于海平面约 430 米。'] },
    ],
  },
  {
    id: 'neighbours', strand: 'world', tracks: ['us', 'ib', 'au'], grade: 'g7b', unit: regions, icon: 'volcano', minutes: 10,
    title: ['Japan and Southeast Asia', '日本和东南亚'],
    blurb: ['An island country on shaky ground that lives by trade, and the crossroads between two oceans.', '多火山地震、靠加工贸易发展的岛国，和两大洋之间的“十字路口”。'],
    keys: [
      ['Japan is a mountainous island country of about 14,000 islands and 124 million people, with a monsoon climate softened by the sea.', '日本是由约 1.4 万个岛屿组成的多山岛国，人口约 1.24 亿，属季风气候，海洋性特征明显。'],
      ['Japan lies where the Pacific and Philippine Sea plates sink under Asia, so it has 111 active volcanoes and about a fifth of the world\'s strong earthquakes.', '日本位于太平洋板块、菲律宾海板块与亚欧板块交界处，有 111 座活火山，世界约 1/5 的强震发生在这里。'],
      ['Lacking resources, Japan imports raw materials and exports manufactured goods; its industry crowds onto the Pacific coast and the Seto Inland Sea.', '日本资源贫乏，进口原料、出口工业制成品，发展加工贸易经济；工业集中在太平洋沿岸和濑户内海沿岸。'],
      ['Southeast Asia is the crossroads of Asia and Oceania, the Pacific and the Indian Ocean; the Strait of Malacca is one of the world\'s busiest sea lanes.', '东南亚地处亚洲与大洋洲、太平洋与印度洋之间的“十字路口”，马六甲海峡是世界上最繁忙的海峡之一。'],
      ['On the Indochina Peninsula mountains and rivers alternate north–south and cities grow on the rivers; the hot, wet climate makes the region a great exporter of rice, palm oil and rubber.', '中南半岛山河相间、纵列分布，城市多分布在河流沿岸；湿热的气候使东南亚成为稻米、棕榈油、天然橡胶的重要产区。'],
    ],
    steps: [
      {
        title: ['Japan: an island country', '日本：多山的岛国'], cam: [37, 138, 2.6], items: ['fuji'],
        fig: climo(KANAZAWA, TOKYO),
        task: ['Compare the two graphs: why does Kanazawa get so much more snow and rain in winter than Tokyo?', '比较两幅图：为什么金泽冬季的降水（降雪）比东京多得多？'],
        paint: [{ fill: { k: 'land', a2: ['JP'], c: C.gold }, a: 0.45 }],
        lines: arrows([[[44, 128], [40, 133], [37.3, 136.4]]], C.ice, 1.2, 2),
        marks: [mk([43.4, 142.8], 'Hokkaido', '北海道', { c: C.gold, t: 0.3 }), mk([37.4, 139.7], 'Honshu', '本州', { c: C.gold, t: 0.4 }), mk([33.7, 133.4], 'Shikoku', '四国', { c: C.gold, t: 0.5 }),
          mk([32.6, 130.8], 'Kyushu', '九州', { c: C.gold, t: 0.6 }), mk([35.68, 139.69], 'Tokyo', '东京', { dot: true, t: 0.8 }), mk([36.56, 136.65], 'Kanazawa', '金泽', { dot: true, t: 0.9 }),
          mk([40, 133], 'NW winter monsoon picks up moisture', '冬季风经日本海增湿', { c: C.ice, t: 1.5 }), sea([30, 145], 'Pacific Ocean', '太平洋', 1.7), sea([38.3, 134.2], 'Sea of Japan', '日本海', 1.8)],
        body: ['Japan is an island country off the east coast of Asia: four large islands (Hokkaido, Honshu, Shikoku and Kyushu) and over 14,000 smaller ones, about 378,000 km² in all. Mountains and hills cover about three quarters of the land, so its 124 million people crowd onto small coastal plains, about 330 people per km². The climate is monsoonal but softened by the sea all round. In winter the north-west monsoon crosses the warm Sea of Japan, picks up moisture and dumps it as heavy snow on the western side of the mountains: Kanazawa gets its most precipitation in December–January, while sunny Tokyo, on the Pacific side, is dry then and wettest in the typhoon months of September–October.',
          '日本是位于亚洲东部的岛国，由北海道、本州、四国、九州四个大岛和 1.4 万多个小岛组成，面积约 37.8 万平方千米。山地、丘陵约占全国面积的 3/4，1.24 亿人口集中在狭小的沿海平原上，每平方千米约 330 人。日本属季风气候，四面环海，海洋性特征明显。冬季西北季风经过温暖的日本海，带来大量水汽，在山地西侧形成大雪：金泽 12 月和 1 月降水最多；而太平洋一侧的东京冬季晴朗干燥，9—10 月台风季节降水最多。'],
      },
      {
        title: ['Volcanoes and earthquakes', '多火山、地震'], cam: [36, 140, 2.8], tectonics: true, items: ['fuji', 'vo_sakurajima'],
        task: ['Find the two trenches east of Japan: they mark where ocean plates sink under the islands.', '找到日本以东的两条海沟：那里是海洋板块俯冲到岛屿下方的地方。'],
        lines: [{ pts: JAPAN_TRENCH, c: C.red, t: 0.4, w: 2, dur: 1.4 }, { pts: NANKAI, c: C.red, t: 0.7, w: 2, dur: 1.4 }],
        marks: [mk([38.3, 142.37], '2011 M9.0 earthquake', '2011 年 9.0 级地震', { dot: true, c: C.red, t: 1 }), mk([37.42, 141.03], 'Fukushima nuclear plant', '福岛核电站', { dot: true, c: C.orange, t: 1.2 }),
          mk([35.36, 138.73], 'Mt Fuji 3,776 m', '富士山 3776 米', { dot: true, t: 1.4 }), mk([39, 145.3], 'Japan Trench', '日本海沟', { c: C.red, t: 0.6 }), mk([32.2, 134.5], 'Nankai Trough', '南海海槽', { c: C.red, t: 0.9 }),
          mk([33, 147], 'Pacific Plate', '太平洋板块', { c: C.white, t: 1.6 }), mk([28, 136], 'Philippine Sea Plate', '菲律宾海板块', { c: C.white, t: 1.7 }), mk([41, 128], 'Eurasian Plate', '亚欧板块', { c: C.white, t: 1.8 })],
        body: ['Japan sits on the Pacific Ring of Fire, where the Pacific Plate and the Philippine Sea Plate dive under the edge of Asia along deep trenches. As the plates slide down they melt, feeding 111 active volcanoes, about 7% of all those on land, and the plates\' sudden jerks cause about a fifth of the world\'s earthquakes of magnitude 6 or more. Mount Fuji, 3,776 m, is a volcano that last erupted in 1707. On 11 March 2011 a magnitude 9.0 earthquake off north-east Japan raised a tsunami up to about 40 m high; about 18,000 people died or went missing, and the Fukushima nuclear plant melted down. Japan therefore builds earthquake-resistant buildings, runs early-warning systems and holds disaster drills every 1 September.',
          '日本位于环太平洋火山地震带上，太平洋板块和菲律宾海板块沿深海沟俯冲到亚欧板块之下。俯冲的板块熔融形成岩浆，使日本有 111 座活火山，约占世界陆上活火山的 7%；板块突然错动引发地震，世界上 6 级以上的地震约 1/5 发生在日本及其附近。富士山海拔 3776 米，是一座火山，最近一次喷发在 1707 年。2011 年 3 月 11 日，日本东北部海域发生 9.0 级地震，引发的海啸最高约 40 米，约 1.8 万人死亡或失踪，福岛核电站发生核泄漏事故。因此日本建造抗震建筑，建立地震预警系统，每年 9 月 1 日举行防灾演练。'],
      },
      {
        title: ['A processing-trade economy', '加工贸易为主的经济'], cam: [33, 136, 3.4], items: ['skytree', 'vh_bullet'],
        fig: jpImports,
        task: ['Find the four industrial areas along the red belt, then follow the import and export arrows.', '找到红色工业带上的四个工业区，再沿着进口和出口的箭头看一看。'],
        paint: [{ fill: { k: 'poly', pts: JP_BELT, c: C.red }, t: 0.4, a: 0.6 }],
        lines: [...arrows([[[12, 128], [22, 130], [31, 133]], [[22, 119], [28, 126], [32.5, 131.5]]], C.teal, 1, 1.8), ...arrows([[[34.5, 140.5], [33, 148], [31, 155]]], C.gold, 1.6, 1.8)],
        marks: [{ ll: [35.6, 139.7], dot: true, t: 0.6 }, { ll: [35.18, 136.91], dot: true, t: 0.7 }, { ll: [34.69, 135.5], dot: true, t: 0.8 },
          mk([36.2, 140.3], 'Tokyo · Yokohama (Keihin)', '东京 · 横滨（京滨）', { t: 0.6 }), mk([34.0, 137.4], 'Nagoya (Chūkyō)', '名古屋（中京）', { t: 0.7 }),
          mk([32.7, 135.0], 'Osaka · Kobe (Hanshin)', '大阪 · 神户（阪神）', { t: 0.8 }), { ll: [33.88, 130.88], dot: true, t: 0.9 }, mk([32.9, 128.2], 'Kitakyushu', '北九州', { t: 0.9 }),
          mk([16, 130], 'Imports: ore, coal, oil, gas', '进口：矿石、煤、石油、天然气', { c: C.teal, t: 1.4 }), mk([30, 152], 'Exports: cars, machines, electronics', '出口：汽车、机械、电子产品', { c: C.gold, t: 2 })],
        body: ['Japan has almost no iron ore, oil or coal of its own: it imports nearly all of them, mostly from Australia, the Middle East and Southeast Asia, plus much of its food. After 1950 it built an economy on processing trade: import raw materials, make high-value cars, ships, machines and electronics, and export them worldwide; by 1968 it was the world\'s second-largest economy, and it is still one of the biggest. Industry crowds along the Pacific coast and the Seto Inland Sea, from Tokyo–Yokohama (Keihin) through Nagoya and Osaka–Kobe to Kitakyushu: deep harbours receive the ore ships, the coastal plains have flat land, and the big cities supply workers and markets. Since the 1980s many Japanese firms have built factories in China and Southeast Asia, where land and labour are cheaper and the customers closer.',
          '日本矿产资源贫乏，铁矿石、石油、煤炭几乎全部依赖进口，主要来自澳大利亚、中东和东南亚，很多粮食也需进口。20 世纪 50 年代以后，日本发展以加工贸易为主的经济：进口原料和燃料，加工成汽车、船舶、机械、电子产品等高附加值的工业制成品，再出口到世界各地；1968 年日本成为世界第二大经济体，今天仍是世界主要经济体之一。日本的工业主要集中在太平洋沿岸和濑户内海沿岸，从东京—横滨（京滨）经名古屋、大阪—神户到北九州：这里港湾深阔，便于海运原料和产品；沿海平原地势平坦；大城市集中，劳动力和市场充足。20 世纪 80 年代以来，许多日本企业把工厂建到中国和东南亚，这些地方土地和劳动力更便宜，也更靠近市场。'],
      },
      {
        title: ['East meets West, and an ageing people', '东西方交融的文化与老龄化'], cam: [33, 127, 3.2], items: ['kinkakuji', 'vy_jianzhen', 'itsukushima', 'fd_sushi'],
        fig: { k: 'pyramid', a: 'japan', b: 'china' },
        task: ['Follow Jianzhen\'s route from Yangzhou to Nara, then compare the shapes of the two population pyramids.', '沿鉴真东渡的航线从扬州到奈良，再比较两个人口金字塔的形状。'],
        lines: [{ pts: JIANZHEN, c: C.gold, t: 0.3, w: 1.8, dur: 2.2, arrow: true }],
        marks: [mk([32.39, 119.41], 'Yangzhou', '扬州', { dot: true, t: 0.4 }), mk([34.34, 108.94], 'Chang\'an (Xi\'an)', '长安（西安）', { dot: true, t: 0.6 }),
          { ll: [34.69, 135.8], dot: true, c: C.gold, t: 1.6 }, mk([33.6, 136.2], 'Nara: Tōshōdai-ji (759)', '奈良：唐招提寺（759 年）', { c: C.gold, t: 1.6 }), mk([35.01, 135.77], 'Kyoto', '京都', { dot: true, t: 1.8 })],
        body: ['Japanese culture mixes old Chinese influence with modern Western ways. During the Tang dynasty Japan sent more than a dozen missions of envoys and students to Chang\'an to learn its laws, writing, Buddhism and city planning; Nara and Kyoto were laid out on a grid modelled on Chang\'an, and Japanese writing still uses Chinese characters (kanji) beside kana derived from them. The monk Jianzhen failed five times to cross the sea, went blind on the way, and finally reached Japan in 753, where he founded Tōshōdai-ji in Nara. After 1868 Japan took in Western science and industry. Today it has one of the world\'s longest life expectancies and very few births: about 29% of people are 65 or over, so its pyramid is narrow at the bottom and the population has been falling since 2008.',
          '日本文化是东西方文化融合的产物。唐朝时，日本先后派出十几次遣唐使和留学生到长安，学习典章制度、文字、佛教和城市规划；奈良和京都仿照长安的棋盘式格局建造，日文至今仍使用汉字，并有由汉字演变来的假名。鉴真和尚五次东渡失败，途中双目失明，终于在 753 年到达日本，后在奈良创建唐招提寺。1868 年明治维新以后，日本大量吸收西方的科学技术，发展近代工业。今天日本人均寿命位居世界前列，出生人数很少：65 岁及以上人口约占 29%，人口金字塔底部窄小，总人口自 2008 年以来持续减少。'],
      },
      {
        title: ['Southeast Asia: a crossroads', '东南亚：十字路口'], cam: [6, 110, 3.8], items: ['vy_zhenghe', 'marinabay', 'petronas'],
        task: ['Trace a ship from the Indian Ocean through the Strait of Malacca into the South China Sea: where is the narrowest point?', '画出一艘船从印度洋穿过马六甲海峡进入南海的航线：海峡最窄处在哪里？'],
        paint: [{ fill: { k: 'land', a2: SEA, c: C.green }, a: 0.45 }],
        lines: [{ pts: [[6, 80], [5.8, 95], [4.5, 99], [2.5, 101.5], [1.2, 103.8], [1.6, 104.6], [6, 107], [15, 113], [22, 117]], c: C.gold, t: 0.4, w: 2, dur: 2.4, arrow: true, flow: true }],
        marks: [mk([3, 100.7], 'Strait of Malacca', '马六甲海峡', { big: true, c: C.gold, t: 1 }), mk([1.29, 103.85], 'Singapore', '新加坡', { dot: true, t: 1.4 }),
          mk([16, 102], 'Indochina Peninsula', '中南半岛', { big: true, c: C.green, t: 1.6 }), mk([-2, 118], 'Malay Archipelago', '马来群岛', { big: true, c: C.green, t: 1.8 }),
          sea([12, 114], 'South China Sea', '南海', 2), sea([5, 88], 'Indian Ocean', '印度洋', 2.1), sea([10, 135], 'Pacific Ocean', '太平洋', 2.2)],
        body: ['Southeast Asia has 11 countries on the Indochina Peninsula and the Malay Archipelago. It lies between Asia and Oceania and between the Pacific and the Indian Ocean, so it is a crossroads for ships, people and ideas. The Strait of Malacca, about 900 km long and only 2.8 km wide in its narrowest channel near Singapore, carries more than 80,000 ships a year and about four-fifths of China\'s oil imports; Singapore grew rich as the port at its gate. Between 1405 and 1433 Zheng He\'s fleets sailed through it seven times. Since then many Chinese have settled here, and Southeast Asia is home to the largest overseas Chinese communities in the world.',
          '东南亚有 11 个国家，包括中南半岛和马来群岛两部分。它位于亚洲与大洋洲、太平洋与印度洋之间，是船只、人员和文化往来的“十字路口”。马六甲海峡长约 900 千米，新加坡附近的最窄航道只有约 2.8 千米宽，每年通过的船舶超过 8 万艘，我国进口石油约 4/5 经过这里；新加坡作为扼守海峡的港口发展成为富裕的国家。1405—1433 年，郑和船队七下西洋，多次经过马六甲海峡。此后许多中国人移居这里，东南亚成为世界上华人、华侨最集中的地区。'],
      },
      {
        title: ['Indochina: mountains and rivers side by side', '中南半岛：山河相间'], cam: [18, 101, 3.2], items: ['angkor', 'bagan', 'watarun', 'shwedagon', 'halong'],
        fig: indochinaFig,
        task: ['Follow each river downstream: notice that the big cities sit on the rivers and deltas.', '沿每条河向下游看：注意大城市都分布在河流沿岸和河口三角洲上。'],
        lines: [flow(RIVERS.irrawaddy, 0.2), flow(SALWEEN, 0.4), flow(RIVERS.chaophraya, 0.6), flow(RIVERS.mekong, 0.8), flow(RED_RIVER, 1)],
        marks: [mk([21.97, 96.08], 'Mandalay', '曼德勒', { dot: true, t: 1.2 }), mk([16.84, 96.17], 'Yangon', '仰光', { dot: true, t: 1.3 }), mk([13.75, 100.5], 'Bangkok', '曼谷', { dot: true, t: 1.4 }),
          mk([17.97, 102.6], 'Vientiane', '万象', { dot: true, t: 1.5 }), mk([11.56, 104.92], 'Phnom Penh', '金边', { dot: true, t: 1.6 }), mk([21.03, 105.85], 'Hanoi', '河内', { dot: true, t: 1.7 }),
          mk([19.5, 95.3], 'Irrawaddy', '伊洛瓦底江', { c: C.blue, t: 1.9 }), mk([20.5, 98.6], 'Salween', '萨尔温江', { c: C.blue, t: 2 }), mk([15.5, 100.1], 'Chao Phraya', '湄南河', { c: C.blue, t: 2.1 }),
          mk([15.2, 105.8], 'Mekong', '湄公河', { c: C.blue, t: 2.2 }), mk([22.5, 104.4], 'Red River', '红河', { c: C.blue, t: 2.3 })],
        body: ['The mountains of the Indochina Peninsula are the southern end of the Hengduan Mountains, so ranges and rivers run north–south side by side. Rivers rising in China — the Nu becomes the Salween, the Lancang the Mekong, the Yuan the Red River — flow south through deep valleys, then spread into wide plains and deltas before reaching the sea. People and rice fields crowd onto these flat, fertile, well-watered lowlands, so almost every big city stands on a river: Mandalay and Yangon on the Irrawaddy, Bangkok on the Chao Phraya, Vientiane and Phnom Penh on the Mekong, Hanoi on the Red River. The Mekong is called the "Danube of the East" because it links six countries.',
          '中南半岛的山脉是横断山脉的南延部分，山脉和河流大致南北走向、相间分布，地势北高南低。许多河流发源于我国：怒江流出国境称萨尔温江，澜沧江称湄公河，元江称红河；它们先在深谷中向南奔流，下游形成广阔的平原和三角洲，再流入海洋。这些平原地势平坦、土壤肥沃、水源充足，人口和稻田集中，大城市几乎都分布在河流沿岸：曼德勒、仰光在伊洛瓦底江畔，曼谷在湄南河畔，万象、金边在湄公河畔，河内在红河畔。湄公河流经六个国家，被称为“东方多瑙河”。'],
      },
      {
        title: ['The Malay Archipelago: islands of fire', '马来群岛：火山之岛'], cam: [-2, 115, 3.6], tectonics: true, items: ['vo_krakatoa', 'vo_pinatubo', 'vo_mayon', 'vo_tambora', 'borobudur', 'an_orangutan', 'an_komodo'],
        task: ['Find the four labelled volcanoes, then compare the size of Java with how many people live there.', '找到图上的四座火山，再比较爪哇岛的面积和人口。'],
        paint: [{ fill: { k: 'land', a2: ['ID', 'PH', 'BN', 'TL', 'MY'], c: C.green }, a: 0.35 }],
        marks: [mk([-8.25, 118], 'Tambora 1815', '坦博拉火山 1815 年', { dot: true, c: C.red, t: 0.5 }), mk([-6.1, 105.42], 'Krakatoa 1883', '喀拉喀托火山 1883 年', { dot: true, c: C.red, t: 0.7 }),
          mk([15.14, 120.35], 'Pinatubo 1991', '皮纳图博火山 1991 年', { dot: true, c: C.red, t: 0.9 }), mk([13.26, 123.69], 'Mayon', '马荣火山', { dot: true, c: C.red, t: 1.1 }),
          mk([-9.4, 108], 'Java: 150+ million people', '爪哇岛：1.5 亿多人', { big: true, c: C.gold, t: 1.4 }), mk([0.5, 114], 'Borneo (Kalimantan)', '加里曼丹岛', { c: C.green, t: 1.6 }), mk([0, 101.5], 'Sumatra', '苏门答腊岛', { c: C.green, t: 1.7 })],
        body: ['The Malay Archipelago is the largest group of islands on Earth, with more than 20,000 islands: Indonesia alone has about 17,000 and the Philippines over 7,600. It lies where the Eurasian, Indo-Australian and Pacific plates meet, so volcanoes and earthquakes are frequent. Tambora\'s eruption in 1815 was the largest in recorded history and caused a "year without a summer" in 1816; Krakatoa in 1883 raised tsunamis that killed about 36,000 people; and Pinatubo in 1991 cooled the whole world by about 0.5 °C for a year. Yet volcanic ash weathers into rich soil: Java, about the size of Fujian, feeds more than 150 million people, over half of Indonesia.',
          '马来群岛是世界上最大的群岛，共有 2 万多个岛屿：印度尼西亚约有 1.7 万个岛屿，菲律宾有 7600 多个。这里位于亚欧板块、印度洋板块和太平洋板块交界处，多火山、地震。1815 年坦博拉火山喷发是有记录以来最大的火山喷发，造成 1816 年的“无夏之年”；1883 年喀拉喀托火山喷发引发海啸，约 3.6 万人遇难；1991 年皮纳图博火山喷发使全球气温在一年内下降约 0.5 °C。但火山灰风化后形成肥沃的土壤：爪哇岛面积与福建省相当，却养活了 1.5 亿多人，超过印度尼西亚人口的一半。'],
      },
      {
        title: ['Hot and wet: rice, palm oil and rubber', '湿热的气候与热带经济作物'], cam: [8, 110, 3.0], items: ['an_orangutan'],
        fig: climo(BANGKOK, SINGAPORE),
        task: ['Compare the two graphs: which place has a dry season, and which is wet all year?', '比较两幅图：哪里有明显的旱季？哪里全年多雨？'],
        paint: [{ fill: { k: 'climate', only: ['tmonsoon', 'rainforest'] }, a: 0.7 }],
        marks: [mk([13.75, 100.5], 'Bangkok: dry and wet seasons', '曼谷：旱雨季分明', { dot: true, t: 0.6 }), mk([1.29, 103.85], 'Singapore: wet all year', '新加坡：全年多雨', { dot: true, t: 0.8 }),
          mk([10.3, 105.6], 'Mekong delta: rice', '湄公河三角洲：稻米', { c: C.lime, t: 1.2 }), mk([5.3, 117.5], 'Oil palm (Sabah)', '油棕（沙巴）', { c: C.orange, t: 1.4 }),
          mk([7, 100.5], 'Rubber', '橡胶', { c: C.white, t: 1.5 }), mk([9.3, 126.3], 'Abaca (Manila hemp), coconut', '蕉麻、椰子', { c: C.gold, t: 1.6 })],
        body: ['Most of the Indochina Peninsula and the northern Philippines have a tropical monsoon climate: hot all year, with a rainy season from May to October when the south-west monsoon blows from the Indian Ocean and a dry season in winter. Most of the Malay Archipelago, straddling the equator, has a tropical rainforest climate: hot and wet every month. These climates suit rice: Thailand, Vietnam and India are the world\'s largest rice exporters, and the Mekong and Chao Phraya deltas are their rice bowls. Tropical cash crops grow on plantations too: Indonesia and Malaysia produce about 85% of the world\'s palm oil, Thailand leads in natural rubber, and the Philippines in abaca (Manila hemp). Clearing rainforest for oil palm, however, threatens animals such as the orangutan.',
          '中南半岛大部分和菲律宾群岛北部属热带季风气候：全年高温，5—10 月西南季风从印度洋带来大量降水，为雨季；冬季为旱季。赤道附近的马来群岛大部分属热带雨林气候：全年高温多雨。湿热的气候适宜种植水稻：泰国、越南和印度是世界上最大的稻米出口国，湄公河三角洲和湄南河平原是重要的“粮仓”。种植园里还种植热带经济作物：印度尼西亚和马来西亚生产的棕榈油约占世界的 85%，泰国的天然橡胶产量居世界首位，菲律宾的蕉麻产量世界第一。但砍伐雨林种植油棕，威胁着猩猩等野生动物的生存。'],
      },
    ],
    quiz: [
      { q: ['Why is most of Japan\'s industry on the Pacific coast and the Seto Inland Sea?', '日本的工业为什么主要分布在太平洋沿岸和濑户内海沿岸？'],
        options: [['Good harbours for importing raw materials and exporting goods, flat coastal land and big cities', '港湾多，便于进口原料、出口产品；沿海平原地势平坦；大城市集中'], ['That is where Japan\'s iron and coal mines are', '这里有丰富的铁矿和煤矿'], ['It is the coldest part of Japan', '这里是日本最冷的地方'], ['There are no earthquakes there', '这里没有地震']], answer: 0,
        why: ['Japan imports nearly all its raw materials and exports its products by sea, so industry sits by the ports, on the scarce flat land and near the cities that supply workers and buyers.', '日本原料几乎全部进口、产品大量出口，都依靠海运，因此工业靠近港口，分布在稀少的沿海平原上，并靠近劳动力和市场集中的大城市。'] },
      { q: ['Match each volcano to what it is known for.', '将火山与它的特点连线。'],
        match: [[['Mt Fuji', '富士山'], ['Japan\'s highest peak, 3,776 m', '日本最高峰，3776 米']], [['Tambora', '坦博拉火山'], ['Largest eruption on record, 1815', '有记录以来最大的喷发（1815 年）']],
          [['Krakatoa', '喀拉喀托火山'], ['1883 eruption and deadly tsunamis', '1883 年喷发引发致命海啸']], [['Pinatubo', '皮纳图博火山'], ['1991 eruption cooled the world by ~0.5 °C', '1991 年喷发使全球降温约 0.5 °C']]],
        why: ['All four lie on plate boundaries around the Pacific and the Malay Archipelago.', '这四座火山都位于环太平洋和马来群岛一带的板块交界处。'] },
      { q: ['Label these countries on the globe.', '在地球上标出这些国家。'],
        place: [{ text: ['Japan', '日本'], at: [36.5, 138.5], tolKm: 600 }, { text: ['Vietnam', '越南'], at: [16, 107], tolKm: 500 }, { text: ['Thailand', '泰国'], at: [15, 101], tolKm: 450 }, { text: ['Indonesia', '印度尼西亚'], at: [-2, 115], tolKm: 900 }, { text: ['Philippines', '菲律宾'], at: [12, 122.5], tolKm: 600 }],
        why: ['Japan is off East Asia; Vietnam and Thailand are on the Indochina Peninsula; Indonesia and the Philippines are in the Malay Archipelago.', '日本位于东亚东部海上；越南、泰国在中南半岛；印度尼西亚和菲律宾在马来群岛。'] },
      { q: ['Which countries are on the Indochina Peninsula? Pick all that apply.', '下列国家中，位于中南半岛的有（多选）'],
        options: [['Myanmar', '缅甸'], ['Laos', '老挝'], ['Cambodia', '柬埔寨'], ['Vietnam', '越南'], ['Indonesia', '印度尼西亚'], ['Philippines', '菲律宾']], multi: [0, 1, 2, 3],
        why: ['Myanmar, Thailand, Laos, Cambodia, Vietnam and western Malaysia are on the peninsula; Indonesia and the Philippines are island countries in the Malay Archipelago.', '中南半岛上有缅甸、泰国、老挝、柬埔寨、越南和马来西亚西部；印度尼西亚和菲律宾是马来群岛上的岛国。'] },
      { q: ['One graph is Tokyo (Pacific side), the other Kanazawa (Sea of Japan side). Which is Kanazawa, and why?', '下面两幅图一幅是东京（太平洋一侧），一幅是金泽（日本海一侧）。哪幅是金泽？为什么？'],
        fig: climo(KANAZAWA, TOKYO, [['A', 'A'], ['B', 'B']]),
        options: [['A: the NW winter monsoon gathers moisture over the Sea of Japan and drops it as snow', 'A：冬季西北风经过日本海增湿，在西侧形成大量降雪'], ['B: the Pacific makes the winters wetter', 'B：太平洋使冬季更湿润'], ['A: typhoons hit it every winter', 'A：冬季台风频繁'], ['B: it is farther north, so it snows more', 'B：它更靠北，所以降雪多']], answer: 0,
        why: ['A peaks in December–January: winter monsoon snow on the Sea of Japan side. B is dry in winter and wettest in the typhoon season: Tokyo, sheltered from the winter wind by the mountains.', 'A 的降水高峰在 12 月和 1 月，是冬季风在日本海一侧带来的降雪；B 冬季干燥、台风季节降水最多，是背风的东京。'] },
      { q: ['Order these rivers from west to east.', '把这些河流自西向东排列。'],
        order: [['Irrawaddy', '伊洛瓦底江'], ['Salween', '萨尔温江'], ['Chao Phraya', '湄南河'], ['Mekong', '湄公河'], ['Red River', '红河']],
        why: ['Ranges and rivers alternate across the peninsula: Irrawaddy and Salween in Myanmar, Chao Phraya in Thailand, Mekong through Laos and Cambodia, Red River in northern Vietnam.', '中南半岛山河相间：伊洛瓦底江、萨尔温江在缅甸，湄南河在泰国，湄公河流经老挝和柬埔寨，红河在越南北部。'] },
      { q: ['Japan has about 124 million people on 378,000 km². About how many people per km² is that?', '日本人口约 1.24 亿，面积约 37.8 万平方千米。平均每平方千米约有多少人？'], num: { answer: 328, tol: 15, unit: ['people/km²', '人/平方千米'] },
        why: ['124,000,000 ÷ 378,000 ≈ 328, about 2¼ times China\'s average (about 147), and most people crowd onto the narrow coastal plains.', '124000000 ÷ 378000 ≈ 328，约为我国平均人口密度（约 147）的 2.2 倍，而且人口集中在狭小的沿海平原。'] },
      { q: ['Tap the Strait of Malacca.', '在地球上点出马六甲海峡。'], at: [2.5, 101.3], tolKm: 350,
        why: ['It runs between the Malay Peninsula and Sumatra, linking the Indian Ocean with the South China Sea and the Pacific.', '它位于马来半岛和苏门答腊岛之间，沟通印度洋和南海、太平洋。'] },
    ],
  },
  {
    id: 'australia', strand: 'world', tracks: ['au', 'us'], grade: 'g7b', unit: regions, icon: 'paw', minutes: 10,
    title: ['Australia', '澳大利亚'],
    blurb: ['A whole continent for one country: ancient animals, a dry red heart, and a nation that rode on the sheep\'s back and the mine cart.', '独占一块大陆的国家：古老的生物、干旱的“红色中心”，“骑在羊背上”和“坐在矿车上”的国家。'],
    keys: [
      ['Australia is the only country that fills a whole continent (7.69 million km²); it lies in the southern and eastern hemispheres, so its seasons are the reverse of China\'s.', '澳大利亚是世界上唯一独占一块大陆的国家（769 万平方千米），位于南半球和东半球，季节与我国相反。'],
      ['Cut off from other continents for some 35 million years, it kept ancient animals such as marsupials (kangaroo, koala) and egg-laying mammals (platypus).', '澳大利亚大陆与其他大陆分离约 3500 万年，保存了袋鼠、考拉等有袋类动物和鸭嘴兽等卵生哺乳动物等古老生物。'],
      ['Three landform belts: the Western Plateau, the Central Lowlands (Great Artesian Basin) and the Eastern Highlands (Great Dividing Range).', '地形分三大区：西部高原、中部平原（大自流盆地）和东部山地（大分水岭）。'],
      ['About 70% of the land is arid or semi-arid, and climate zones ring the desert core; farming follows the rainfall: cattle in the north, sheep inland, wheat–sheep belts, dairy on the wet coast.', '约 70% 的土地是干旱、半干旱区，气候类型围绕中部沙漠呈半环状分布；农牧业随降水而分布：北部养牛，内陆牧羊，东南和西南为小麦—牧羊带，沿海湿润区发展乳畜业。'],
      ['Australia leads the world in iron ore, exports huge amounts of coal, gas and lithium, and its 27 million people live mostly in south-eastern coastal cities.', '澳大利亚铁矿石产量居世界首位，煤炭、天然气、锂大量出口；2700 万人口主要分布在东南沿海的城市中。'],
    ],
    steps: [
      {
        title: ['A country that fills a continent', '独占一块大陆的国家'], cam: [-26, 134, 3.6], graticule: true,
        task: ['Find the Tropic of Capricorn: which part of Australia is in the tropics? Then find Canberra.', '找到南回归线：澳大利亚哪一部分位于热带？再找出首都堪培拉。'],
        paint: [{ fill: { k: 'land', a2: ['AU'], c: C.orange }, a: 0.45 }],
        lines: [par(-23.44, C.red, 0.4, { w: 1.2 })],
        marks: [mk([-24, 128], 'Tropic of Capricorn', '南回归线', { c: C.red, t: 0.8 }), mk([-35.28, 149.13], 'Canberra (capital)', '堪培拉（首都）', { dot: true, c: C.gold, t: 1 }),
          mk([-10.69, 142.53], 'Cape York', '约克角', { dot: true, t: 1.2 }), mk([-42, 146.6], 'Tasmania', '塔斯马尼亚岛', { c: C.orange, t: 1.3 }),
          sea([-25, 104], 'Indian Ocean', '印度洋', 1.5), sea([-28, 162], 'Pacific Ocean', '太平洋', 1.6), sea([-8, 135], 'Arafura Sea', '阿拉弗拉海', 1.7)],
        body: ['Australia covers 7.69 million km², about four-fifths of China, and it is the only country that occupies a whole continent; with New Zealand and the Pacific islands it makes up Oceania. It lies between the Indian Ocean and the Pacific, entirely in the southern and eastern hemispheres, from Cape York at about 10.7°S to Tasmania at 43.6°S. The Tropic of Capricorn crosses its middle, so the north is tropical and the south temperate. Because it is south of the equator, its seasons are the reverse of China\'s: January is midsummer, and Christmas is a beach holiday. The capital is Canberra, built between rivals Sydney and Melbourne.',
          '澳大利亚面积 769 万平方千米，约为我国的 4/5，是世界上唯一独占一块大陆的国家；它和新西兰及太平洋上的岛屿组成大洋洲。澳大利亚位于印度洋和太平洋之间，完全在南半球和东半球，从约克角（约 10.7°S）延伸到塔斯马尼亚岛（43.6°S）。南回归线穿过大陆中部，北部属热带，南部属温带。由于位于南半球，季节与我国相反：1 月是盛夏，圣诞节可以去海滩度假。首都堪培拉建在两座争当首都的城市悉尼和墨尔本之间。'],
      },
      {
        title: ['A continent adrift', '漂移的大陆'], cam: [-48, 130, 4.4], sketch: true,
        fig: driftFig,
        task: ['Follow the arrow: where is Australia heading, and what is left behind to the south?', '沿箭头看：澳大利亚正向哪里移动？它的南面留下了哪块大陆？'],
        paint: [{ fill: { k: 'land', a2: ['AU'], c: C.orange }, a: 0.5 }, { fill: { k: 'continents', only: ['antarctica'] }, a: 0.4, t: 0.3 }],
        lines: [{ pts: [[-36, 134], [-25, 134], [-14, 134]], c: C.red, t: 0.6, w: 2.4, arrow: true, dur: 1.4 }, { pts: [[-62, 100], [-58, 120], [-55, 140], [-56, 158]], c: C.blue, t: 1, w: 1.6, dur: 1.6 }],
        marks: [mk([-25, 138], 'About 7 cm north a year', '每年向北移动约 7 厘米', { c: C.red, t: 1 }), mk([-55, 128], 'Southern Ocean opened as they split', '两块大陆分离，南大洋打开', { c: C.ice, t: 1.4 }),
          mk([-72, 130], 'Antarctica', '南极洲', { big: true, c: C.white, t: 1.6 })],
        body: ['About 200 million years ago Australia was part of the southern supercontinent Gondwana, joined to Antarctica, South America, Africa and India. Starting about 85 million years ago it pulled away from Antarctica, and by about 35 million years ago a deep ocean separated them. Since then it has been an island continent, drifting north about 7 cm a year, about as fast as fingernails grow, towards Asia. Isolated for so long, its animals and plants evolved on their own, without competition from the mammals that spread over the other continents.',
          '约 2 亿年前，澳大利亚是南方超级大陆冈瓦纳古陆的一部分，与南极洲、南美洲、非洲和印度连在一起。约 8500 万年前，它开始与南极洲分离，约 3500 万年前两者之间形成了深海。此后澳大利亚成为一块孤立的大陆，每年向北（向亚洲）漂移约 7 厘米，和指甲生长的速度差不多。长期与其他大陆隔绝，这里的动植物独自演化，没有受到其他大陆上高等哺乳动物的竞争。'],
      },
      {
        title: ['A living museum of ancient life', '古老生物的“博物馆”'], cam: [-28, 140, 3.2], items: ['an_kangaroo', 'an_koala', 'an_platypus', 'an_tasdevil', 'an_quokka', 'an_croc'],
        task: ['Tap the animals on the globe: which ones carry their young in a pouch, and which one lays eggs?', '点击地球上的动物：哪些用育儿袋养育幼崽？哪一种是下蛋的哺乳动物？'],
        marks: [mk([-25, 135], 'Marsupials: kangaroo, koala, wombat', '有袋类：袋鼠、考拉、袋熊', { c: C.orange, t: 0.5 }), mk([-35, 148.5], 'Egg-laying mammals: platypus, echidna', '卵生哺乳动物：鸭嘴兽、针鼹', { c: C.pink, t: 0.8 }),
          mk([-31, 120], 'Emu', '鸸鹋', { c: C.gold, t: 1.1 }), mk([-37, 145], 'Eucalyptus forests', '桉树林', { c: C.green, t: 1.3 })],
        body: ['Because it was cut off for so long, Australia is full of ancient life found nowhere else: about 87% of its mammals and 93% of its reptiles are endemic. Most of its native mammals are marsupials, which give birth to tiny young and raise them in a pouch, such as kangaroos, koalas, wombats and the Tasmanian devil. The platypus and echidna are monotremes, mammals that lay eggs, one of the most primitive kinds of mammal alive. Emus are flightless birds up to 1.9 m tall, and over 800 species of eucalyptus, the koala\'s only food, dominate the forests. Animals brought in from outside, like the European rabbit released in 1859, have spread out of control, showing how fragile isolated ecosystems are.',
          '由于长期与其他大陆隔绝，澳大利亚保存了大量世界上其他地方没有的古老生物：约 87% 的哺乳动物和 93% 的爬行动物是这里特有的。本地哺乳动物大多是有袋类，它们的幼崽出生时很小，在母亲的育儿袋中长大，如袋鼠、考拉（树袋熊）、袋熊和袋獾。鸭嘴兽和针鼹是单孔类，是会下蛋的哺乳动物，是现存最原始的哺乳动物之一。鸸鹋是不会飞的大鸟，高可达 1.9 米；800 多种桉树构成了这里的森林，桉树叶是考拉唯一的食物。外来物种（如 1859 年引入的欧洲野兔）在这里泛滥成灾，说明孤立的生态系统十分脆弱。'],
      },
      {
        title: ['Three landform belts', '三大地形区'], cam: [-26, 136, 3.4], items: ['uluru', 'reef'],
        fig: auProfile,
        task: ['Move from west to east across the three coloured belts, and find Uluru, Lake Eyre and the Great Dividing Range.', '自西向东穿过三个颜色带，找出乌鲁鲁、北艾尔湖和大分水岭。'],
        paint: [{ fill: { k: 'poly', pts: AU_WEST, c: C.brown, clip: ['AU'] }, t: 0.2, a: 0.55 }, { fill: { k: 'poly', pts: AU_MID, c: C.lime, clip: ['AU'] }, t: 0.6, a: 0.5 },
          { fill: { k: 'poly', pts: AU_EAST, c: C.green, clip: ['AU'] }, t: 1, a: 0.55 }, { fill: { k: 'poly', pts: ARTESIAN, c: C.blue }, t: 1.4, a: 0.3 }],
        lines: [{ pts: GREAT_DIVIDE, c: C.brown, t: 1.2, w: 2.4, dur: 1.6 }],
        marks: [mk([-26, 122], 'Western Plateau', '西部高原', { big: true, c: C.brown, t: 0.4 }), mk([-20, 141.5], 'Central Lowlands', '中部平原', { big: true, c: C.lime, t: 0.8 }),
          mk([-25.34, 131.04], 'Uluru', '乌鲁鲁', { dot: true, t: 1 }), mk([-28.4, 137.3], 'Lake Eyre −15 m', '北艾尔湖 −15 米', { dot: true, c: C.ice, t: 1.2 }),
          mk([-24, 145], 'Great Artesian Basin', '大自流盆地', { c: C.blue, t: 1.5 }), mk([-31, 152.6], 'Great Dividing Range', '大分水岭', { c: C.brown, t: 1.6 }),
          mk([-36.46, 148.26], 'Kosciuszko 2,228 m', '科修斯科山 2228 米', { dot: true, t: 1.8 }), mk([-17, 147.5], 'Great Barrier Reef', '大堡礁', { c: C.teal, t: 2 })],
        body: ['Australia is the flattest continent, and from west to east it has three belts. The Western Plateau, about two-thirds of the land, is an ancient shield mostly 300–600 m high, covered by deserts; Uluru, a sandstone monolith, rises 348 m above the plain to 863 m. The Central Lowlands include Lake Eyre, 15 m below sea level and usually a dry salt pan, and the Great Artesian Basin, about 1.7 million km², where rain soaked in on the eastern hills flows underground and gushes up in bores. The Eastern Highlands are the Great Dividing Range, about 3,500 km long, topped by Mount Kosciuszko (2,228 m). Off the north-east coast the Great Barrier Reef stretches about 2,300 km, the largest coral reef system on Earth.',
          '澳大利亚是地势最平坦的大陆，自西向东可分为三大地形区。西部高原约占大陆面积的 2/3，是古老的地块，海拔多在 300—600 米，大部分是沙漠；乌鲁鲁是一块巨大的砂岩，高出周围平原 348 米，海拔 863 米。中部平原有北艾尔湖（低于海平面 15 米，常年是干涸的盐湖），还有面积约 170 万平方千米的大自流盆地：东部山地的雨水渗入地下，沿岩层流到盆地，打井后地下水能自流涌出。东部山地即大分水岭，长约 3500 千米，最高峰科修斯科山海拔 2228 米。东北沿海的大堡礁绵延约 2300 千米，是世界上最大的珊瑚礁群。'],
      },
      {
        title: ['The driest inhabited continent', '最干燥的有人居住的大陆'], cam: [-26, 134, 3.6],
        fig: climo(ALICE, DARWIN),
        task: ['See how the climate colours form rings around the desert centre, then compare Alice Springs with Darwin.', '看气候类型如何围绕中部沙漠呈半环状分布，再比较艾丽斯斯普林斯和达尔文的气候。'],
        paint: [{ fill: { k: 'climate' }, a: 0.75 }],
        lines: [...arrows([[[-22, 172], [-24, 162], [-26, 154]], [[-30, 172], [-31, 162], [-31.5, 154]]], C.teal, 0.6, 1.8), { pts: [[-36, 113.5], [-30, 112.7], [-24, 112.2], [-18, 116]], c: C.ice, t: 1.2, w: 1.8, arrow: true, dur: 1.4 }],
        marks: [mk([-23.7, 133.88], 'Alice Springs: 280 mm', '艾丽斯斯普林斯：约 280 毫米', { dot: true, t: 0.4 }), mk([-12.46, 130.84], 'Darwin: wet summers', '达尔文：夏季多雨', { dot: true, t: 0.6 }),
          mk([-25.5, 160], 'SE trade winds', '东南信风', { c: C.teal, t: 1 }), mk([-30.5, 153], 'Rain on the east slopes', '东坡迎风多雨', { c: C.teal, t: 1.4 }), mk([-27, 110.5], 'Cold West Australian Current', '西澳大利亚寒流', { c: C.ice, t: 1.6 })],
        body: ['About 70% of Australia is arid or semi-arid, and only Antarctica is drier. Four things work together. The Tropic of Capricorn crosses the middle, under the subtropical high, where sinking air stops clouds forming. The moist south-east trade winds from the Pacific drop their rain on the eastern slopes of the Great Dividing Range, leaving the inland in a rain shadow. The coastline is smooth, with few bays to let the sea reach inland. And the cold West Australian Current chills the air off the west coast. So the climate zones form rings around a desert core: tropical savanna and rainforest in the north, Mediterranean in the south-west and south, and humid subtropical and temperate maritime in the east and south-east.',
          '澳大利亚约 70% 的土地是干旱、半干旱区，干燥程度仅次于南极洲。原因有四：南回归线穿过大陆中部，常年受副热带高气压带控制，盛行下沉气流，难以成云致雨；来自太平洋的东南信风在大分水岭东坡形成大量降水，内陆处于背风坡；海岸线平直，缺少深入内陆的海湾，海洋影响难以深入；西海岸有西澳大利亚寒流经过，对沿岸气候有降温减湿作用。因此澳大利亚的气候类型以中部沙漠为中心呈半环状分布：北部是热带草原气候和热带雨林气候，西南和南部是地中海气候，东部和东南部是亚热带湿润气候和温带海洋性气候。'],
      },
      {
        title: ['Riding on the sheep\'s back', '“骑在羊背上的国家”'], cam: [-28, 140, 3.4], items: ['vh_ghan'],
        task: ['Compare the farming belts with the rainfall on the last step: why are sheep inland and dairy cows on the coast?', '把农牧业分布与上一步的降水比较：为什么羊群在内陆，奶牛在沿海？'],
        paint: [{ fill: { k: 'poly', pts: CATTLE_N, c: C.red, clip: ['AU'] }, t: 0.3, a: 0.45 }, { fill: { k: 'poly', pts: WHEAT_SE, c: C.gold, clip: ['AU'] }, t: 0.7, a: 0.55 },
          { fill: { k: 'poly', pts: WHEAT_SW, c: C.gold, clip: ['AU'] }, t: 0.9, a: 0.55 }],
        lines: [flow(MURRAY, 1.2), flow(DARLING, 1.3)],
        marks: [mk([-18.5, 135], 'Beef cattle (tropical north)', '牧牛（北部热带）', { c: C.red, t: 0.4 }), mk([-31.5, 144], 'Wheat–sheep belt', '小麦—牧羊带', { c: C.gold, t: 0.8 }),
          mk([-31.5, 117.5], 'Wheat–sheep belt (south-west)', '小麦—牧羊带（西南）', { c: C.gold, t: 1 }), mk([-35.3, 140.5], 'Murray–Darling Basin', '墨累—达令盆地', { c: C.blue, t: 1.4 }),
          mk([-27.5, 129.5], 'Sheep and cattle stations on dry inland pasture', '内陆干旱草场：大牧场', { c: C.white, t: 1.6 }), mk([-17, 146], 'Sugar cane', '甘蔗', { c: C.lime, t: 1.8 }), mk([-38.3, 146], 'Dairy', '乳畜业', { c: C.white, t: 1.9 })],
        body: ['For about 150 years wool made Australia rich, so it was called the country "riding on the sheep\'s back". Today it has about 70–80 million sheep, mostly fine-wool Merinos, and is the world\'s largest wool exporter, as well as a top exporter of beef and wheat. Farming follows the rainfall: beef cattle graze the tropical grasslands of the north; sheep and cattle roam huge stations on the dry inland pastures, drinking from artesian bores; the wheat–sheep belts curve through the south-east and south-west where 300–600 mm of rain falls; and dairy farms and sugar cane fill the wet coastal strip. The Murray–Darling Basin alone produces about 40% of the country\'s farm output, but irrigation has made its rivers too salty and too low in drought years.',
          '大约 150 年间，羊毛使澳大利亚富裕起来，因此它被称为“骑在羊背上的国家”。今天澳大利亚有约 7000 万—8000 万只羊，以细毛美利奴羊为主，是世界上最大的羊毛出口国，也是牛肉和小麦的重要出口国。农牧业分布与降水密切相关：北部热带草原放养肉牛；内陆干旱草场上是大牧场，牛羊饮用自流井的地下水；东南部和西南部年降水 300—600 毫米的地区形成小麦—牧羊带；东部和东南部沿海湿润地带发展乳畜业和甘蔗种植。墨累—达令盆地的农业产值约占全国的 40%，但大量引水灌溉造成河水盐化，干旱年份河流水量过少。'],
      },
      {
        title: ['Riding on the mine cart', '“坐在矿车上的国家”'], cam: [-22, 132, 3.8],
        fig: ironOre,
        task: ['Find the mines and ports in the Pilbara, then follow the arrow: where does most of the ore go?', '找到皮尔巴拉的矿山和港口，再沿箭头看：大部分矿石运往哪里？'],
        paint: [{ fill: { k: 'land', a2: ['AU'], c: C.orange }, a: 0.25 }],
        lines: [{ pts: [[-20.3, 118.6], [-10, 117], [2, 113]], c: C.gold, t: 1.4, w: 2.2, arrow: true, flow: true, dur: 1.6 }],
        marks: [mk([-23.36, 119.73], 'Newman: iron ore', '纽曼：铁矿', { dot: true, c: C.brown, t: 0.3 }), mk([-20.31, 118.6], 'Port Hedland', '黑德兰港', { dot: true, t: 0.5 }),
          { ll: [-20.66, 116.7], dot: true, t: 0.6 }, mk([-21.3, 114.2], 'Dampier', '丹皮尔', { t: 0.6 }), mk([-22.5, 148.5], 'Bowen Basin: coal', '鲍文盆地：煤', { dot: true, c: C.white, t: 0.7 }),
          mk([-32.93, 151.78], 'Newcastle: coal port', '纽卡斯尔：煤港', { dot: true, t: 0.8 }), mk([-12.63, 141.88], 'Weipa: bauxite', '韦帕：铝土矿', { dot: true, c: C.pink, t: 0.9 }),
          mk([-30.75, 121.47], 'Kalgoorlie: gold', '卡尔古利：金矿', { dot: true, c: C.gold, t: 1 }), mk([-33.86, 116.06], 'Greenbushes: lithium', '格林布什：锂矿', { dot: true, c: C.teal, t: 1.1 }),
          mk([2, 116], 'To China', '运往中国', { c: C.gold, t: 2 })],
        body: ['Australia is just as famous as the country "riding on the mine cart". It mines more iron ore than any other country, about 960 million tonnes in 2023, more than a third of the world total, mostly from huge open pits in the Pilbara that send ore by long trains to Port Hedland and Dampier. It is also one of the biggest exporters of coal (from the Bowen Basin through Newcastle), liquefied natural gas and gold, the largest producer of lithium (Greenbushes) and a leading producer of bauxite (Weipa). Most of these minerals are shipped to Asia: China buys about four-fifths of Australia\'s iron ore, and Japan and South Korea are big buyers of its coal and gas. Mining employs few people but brings in most export earnings.',
          '澳大利亚还被称为“坐在矿车上的国家”。它的铁矿石产量居世界首位，2023 年约 9.6 亿吨，占世界总产量的 1/3 以上，主要来自西北部皮尔巴拉地区的大型露天矿，用长长的火车运到黑德兰港和丹皮尔港。澳大利亚还是世界上重要的煤炭（产自鲍文盆地，经纽卡斯尔港出口）、液化天然气和黄金出口国，锂产量居世界第一（格林布什），铝土矿产量也居世界前列（韦帕）。这些矿产大多运往亚洲：澳大利亚出口的铁矿石约 4/5 卖给中国，日本、韩国大量购买它的煤炭和天然气。采矿业雇用的人不多，却带来了大部分出口收入。'],
      },
      {
        title: ['People and cities', '人口与城市'], cam: [-30, 140, 3.6], items: ['opera', 'harbourbridge', 'twelveapostles'],
        fig: auCities,
        task: ['Find the five largest cities: what do almost all of them have in common?', '找出五座最大的城市：它们几乎都有什么共同点？'],
        night: true, clock: { mode: 'day', start: Date.UTC(2025, 5, 21, 11), rate: 0 },
        marks: [mk([-33.87, 151.21], 'Sydney 5.5 M', '悉尼 550 万', { dot: true, c: C.gold, t: 0.3 }), mk([-37.81, 144.96], 'Melbourne 5.2 M', '墨尔本 520 万', { dot: true, c: C.gold, t: 0.4 }),
          mk([-27.47, 153.03], 'Brisbane', '布里斯班', { dot: true, c: C.gold, t: 0.5 }), mk([-31.95, 115.86], 'Perth', '珀斯', { dot: true, c: C.gold, t: 0.6 }), mk([-34.93, 138.6], 'Adelaide', '阿德莱德', { dot: true, c: C.gold, t: 0.7 }),
          mk([-35.28, 149.13], 'Canberra', '堪培拉', { dot: true, c: C.violet, t: 0.8 }), mk([-12.46, 130.84], 'Darwin', '达尔文', { dot: true, c: C.gold, t: 0.9 }), mk([-24, 131], 'Few people inland', '内陆人烟稀少', { c: C.ice, t: 1.2 })],
        body: ['About 27 million people live in Australia, only about 3.5 per km², but they are far from evenly spread: over 85% live in cities, mostly in the mild, wetter south-east and along the coasts, while the dry interior is almost empty. Sydney and Melbourne each have over 5 million people. Aboriginal and Torres Strait Islander peoples have lived here for at least 65,000 years, one of the oldest continuous cultures on Earth, and make up about 3.8% of the population today. Britain made Australia a colony from 1788, and most Australians speak English, but it is a nation of immigrants: about 30% of residents were born overseas, with China and India among the largest sources.',
          '澳大利亚约有 2700 万人，平均每平方千米只有约 3.5 人，而且分布极不均匀：85% 以上的人口居住在城市，主要集中在气候温和湿润的东南部和沿海地区，干旱的内陆几乎无人居住。悉尼和墨尔本人口都超过 500 万。原住民（土著人和托雷斯海峡岛民）在这里生活了至少 6.5 万年，拥有世界上延续最久的文化之一，今天约占总人口的 3.8%。1788 年起澳大利亚成为英国殖民地，居民多讲英语，但它是一个移民国家：约 30% 的居民出生在海外，中国和印度是重要的移民来源国。'],
      },
    ],
    quiz: [
      { q: ['Why does Australia have so many animals found nowhere else, such as kangaroos and platypuses?', '澳大利亚为什么有袋鼠、鸭嘴兽等许多其他地方没有的动物？'],
        options: [['It was cut off from other continents for a very long time, so its animals evolved on their own', '它长期与其他大陆隔绝，动物独自演化'], ['It is the hottest continent', '它是最热的大陆'], ['People brought them from Asia', '人们从亚洲带来了它们'], ['It is the largest continent', '它是最大的大陆']], answer: 0,
        why: ['Australia separated from Antarctica about 85–35 million years ago and has drifted alone ever since, so ancient marsupials and egg-laying mammals survived without competition.', '澳大利亚约 8500 万—3500 万年前与南极洲分离，此后一直孤立，古老的有袋类和卵生哺乳动物在缺少竞争的环境中保存下来。'] },
      { q: ['Why was Australia called the country "riding on the sheep\'s back"?', '澳大利亚为什么被称为“骑在羊背上的国家”？'],
        options: [['Its wealth was built on sheep and wool, and it is the largest wool exporter', '它靠养羊和羊毛致富，是世界上最大的羊毛出口国'], ['Sheep are its national animal', '羊是它的国兽'], ['People travel on sheep', '人们骑羊出行'], ['It has more sheep than any other animal on Earth', '它的羊比地球上任何动物都多']], answer: 0,
        why: ['Wool was Australia\'s main export for about 150 years; today it still has 70–80 million sheep and leads the world in wool exports.', '大约 150 年里羊毛是澳大利亚最主要的出口产品；今天它仍有 7000 万—8000 万只羊，羊毛出口量居世界首位。'] },
      { q: ['Tap Uluru.', '在地球上点出乌鲁鲁。'], at: [-25.34, 131.04], tolKm: 400,
        why: ['Uluru is in the dry centre of the Western Plateau, about 340 km south-west of Alice Springs.', '乌鲁鲁位于西部高原干旱的中部，在艾丽斯斯普林斯西南约 340 千米处。'] },
      { q: ['Match each landform belt to a feature in it.', '将地形区与它的典型地物连线。'],
        match: [[['Western Plateau', '西部高原'], ['Uluru', '乌鲁鲁']], [['Central Lowlands', '中部平原'], ['Great Artesian Basin', '大自流盆地']], [['Eastern Highlands', '东部山地'], ['Mount Kosciuszko', '科修斯科山']], [['Coral Sea coast', '珊瑚海沿岸'], ['Great Barrier Reef', '大堡礁']]],
        why: ['Uluru rises from the plateau desert; the artesian basin lies under the central lowlands; Kosciuszko tops the Great Dividing Range; the reef lines the north-east coast.', '乌鲁鲁耸立在西部高原的荒漠中；大自流盆地位于中部平原；科修斯科山是大分水岭的最高峰；大堡礁分布在东北沿海。'] },
      { q: ['Australia has about 27 million people on 7.69 million km². About how many people per km² is that?', '澳大利亚约有 2700 万人，面积 769 万平方千米。平均每平方千米约有多少人？'], num: { answer: 3.5, tol: 0.3, unit: ['people/km²', '人/平方千米'] },
        why: ['27 ÷ 7.69 ≈ 3.5 people per km², about one-fortieth of China\'s density, and most of them live on the south-east coast.', '27 ÷ 7.69 ≈ 3.5 人/平方千米，约为我国人口密度的 1/40，而且人口主要集中在东南沿海。'] },
      { q: ['Label these cities on the globe.', '在地球上标出这些城市。'],
        place: [{ text: ['Sydney', '悉尼'], at: [-33.87, 151.21], tolKm: 350 }, { text: ['Perth', '珀斯'], at: [-31.95, 115.86], tolKm: 400 }, { text: ['Darwin', '达尔文'], at: [-12.46, 130.84], tolKm: 400 }, { text: ['Canberra', '堪培拉'], at: [-35.28, 149.13], tolKm: 250 }],
        why: ['Sydney on the south-east coast, Canberra inland between Sydney and Melbourne, Perth in the south-west, Darwin on the tropical north coast.', '悉尼在东南沿海，堪培拉在悉尼和墨尔本之间的内陆，珀斯在西南部，达尔文在北部热带沿海。'] },
      { q: ['This graph is from a town in central Australia. Which climate is it?', '这是澳大利亚中部某城镇的气候资料图。它属于哪种气候？'], fig: climo(ALICE, undefined, [['Mystery town', '某城镇']]),
        options: [['Hot desert', '热带沙漠气候'], ['Tropical savanna', '热带草原气候'], ['Mediterranean', '地中海气候'], ['Humid subtropical', '亚热带湿润气候']], answer: 0,
        why: ['Under 300 mm of rain a year with hot summers (December–February, the southern summer): a hot desert. It is Alice Springs.', '年降水量不足 300 毫米，夏季（南半球的 12—2 月）炎热，是热带沙漠气候。这里是艾丽斯斯普林斯。'] },
      { q: ['Why is the interior of Australia so dry? Pick all that apply.', '澳大利亚内陆干旱的原因有（多选）'],
        options: [['The subtropical high brings sinking air', '受副热带高气压带控制，盛行下沉气流'], ['The Great Dividing Range blocks the moist south-east trade winds', '大分水岭阻挡了来自海洋的湿润东南信风'], ['A cold current runs along the west coast', '西海岸有寒流经过'],
          ['The smooth coastline has few deep bays', '海岸线平直，缺少深入内陆的海湾'], ['It lies on the equator', '位于赤道上'], ['It is covered by ice', '被冰雪覆盖']], multi: [0, 1, 2, 3],
        why: ['Sinking air, a rain shadow, a cold current and a compact shape all work together; Australia is not on the equator, where rising air brings rain.', '下沉气流、背风坡、寒流和平直的海岸线共同造成内陆干旱；澳大利亚并不在多雨的赤道上。'] },
    ],
  },
  {
    id: 'polar', strand: 'world', tracks: ['uk', 'us', 'ib', 'au'], grade: 'g7b', unit: poles, icon: 'aurora', minutes: 10,
    title: ['The polar regions', '极地地区'],
    blurb: ['An ice-buried continent and a frozen ocean: the coldest, windiest places on Earth, now the frontier of science.', '冰雪覆盖的大陆和冰封的海洋：地球上最冷、风最大的地方，也是科学考察的前沿。'],
    keys: [
      ['On polar maps meridians are radii and parallels are circles; from the North Pole every direction is south, from the South Pole every direction is north.', '在极地地图上，经线呈放射状，纬线是同心圆；北极点四周都是南方，南极点四周都是北方。'],
      ['Antarctica is an ice-buried continent (about 14 million km², ice about 2,000 m thick on average, about 90% of the world\'s ice); the Arctic is mainly an ocean ringed by Eurasia and North America.', '南极地区以冰雪覆盖的大陆为主（约 1400 万平方千米，冰层平均厚约 2000 米，约占世界冰量的 90%）；北极地区以北冰洋为主，被亚欧大陆和北美大陆环绕。'],
      ['Antarctica is the coldest (−89.2 °C at Vostok), windiest and driest continent, because it is high, icy and a continent; the Arctic is milder because the ocean stores heat.', '南极洲是最冷（东方站 −89.2 °C）、风最大、最干燥的大陆，因为它海拔高、冰雪反射强、是大陆；北极地区有海洋储热，相对温和。'],
      ['Polar day and night come from the tilted axis; expeditions go in each region\'s summer (Antarctica November–March, the Arctic June–September).', '极昼、极夜是地轴倾斜造成的；科学考察选在各自的夏季（南极 11 月—次年 3 月，北极 6—9 月）。'],
      ['China has five Antarctic stations (Great Wall, Zhongshan, Kunlun, Taishan, Qinling) and Arctic stations; the Antarctic Treaty keeps Antarctica peaceful and for science, and melting Arctic ice opens new sea routes.', '我国在南极建有长城站、中山站、昆仑站、泰山站、秦岭站，在北极建有黄河站等；《南极条约》规定南极只用于和平与科学目的，北极海冰减少正打开新的航道。'],
    ],
    steps: [
      {
        title: ['Directions on polar maps', '极地地图上的方向'], cam: [82, 40, 3.4], graticule: true,
        fig: polarViews,
        task: ['Follow the gold arrow: seen from above the North Pole, which way does the Earth turn? Then tap a meridian and follow it to the pole.', '沿金色箭头看：从北极上空看，地球怎样旋转？再沿一条经线走到北极点。'],
        lines: [par(66.56, C.blue, 0.2, { w: 1.2 }), { pts: [[74, 0], [74, 40], [74, 80], [74, 120]], c: C.gold, t: 0.8, w: 2.2, rhumb: true, arrow: true, dur: 1.8 }],
        marks: [mk([90, 0], 'North Pole', '北极点', { dot: true, c: C.white, t: 0.4 }), mk([67.5, -40], 'Arctic Circle 66.5°N', '北极圈 66.5°N', { c: C.blue, t: 0.6 }),
          mk([76, 70], 'Eastward = anticlockwise', '自西向东 = 逆时针', { c: C.gold, t: 1.6 })],
        body: ['The polar regions are the areas inside the Arctic and Antarctic Circles, at about 66.5°N and 66.5°S. They are best seen on polar maps centred on a pole: the meridians run out from the centre like spokes, and the parallels are rings. At the North Pole every direction is south; at the South Pole every direction is north, so east and west go round the rings. Because the Earth turns west to east, seen from above the North Pole it turns anticlockwise, and seen from above the South Pole clockwise. To find a direction on such a map, follow the meridian outward (away from the North Pole is south) or round the ring (anticlockwise on a north-polar map is east).',
          '极地地区是指北极圈（约 66.5°N）以北和南极圈（约 66.5°S）以南的地区。观察极地最好用以极点为中心的极地地图：经线从中心呈放射状伸出，纬线是一个个同心圆。北极点四周都是南方，南极点四周都是北方，东西方向则沿纬线圈环绕。地球自西向东自转，从北极上空看呈逆时针方向，从南极上空看呈顺时针方向。在极地地图上判断方向：沿经线离开北极点是向南；在以北极为中心的地图上，沿纬线逆时针方向是向东。'],
      },
      {
        title: ['A continent buried in ice', '冰雪覆盖的大陆'], cam: [-78, 75, 3.4], wide: true, items: ['vo_erebus', 'dc_bloodfalls'],
        fig: iceProfile,
        task: ['Follow the gold line inland from Zhongshan to Kunlun, and read on the profile how the ice rises.', '沿金色线从中山站向内陆走到昆仑站，在剖面图上看冰盖如何升高。'],
        paint: [{ fill: { k: 'continents', only: ['antarctica'] }, a: 0.35 }],
        lines: [{ pts: ZS_KL, c: C.gold, t: 0.4, w: 2, dur: 1.8 }, par(-66.56, C.blue, 0.2, { w: 1 })],
        marks: [mk([-80.37, 77.35], 'Dome A 4,093 m', '冰穹 A 4093 米', { dot: true, c: C.gold, t: 1 }), mk([-78.53, -85.62], 'Vinson Massif 4,892 m', '文森山 4892 米', { dot: true, t: 1.2 }),
          mk([-77.53, 167.15], 'Mt Erebus (active volcano)', '埃里伯斯火山（活火山）', { dot: true, c: C.red, t: 1.4 }), mk([-69.37, 76.37], 'Zhongshan', '中山站', { dot: true, t: 0.6 }),
          mk([-82, 20], 'East Antarctic Ice Sheet', '东南极冰盖', { big: true, c: C.ice, t: 1.6 })],
        body: ['Antarctica covers about 14 million km², nearly one and a half times China, and about 98% of it lies under ice. The ice sheet is about 2,000 m thick on average and up to about 4,800 m, so the continent is the highest on Earth, averaging about 2,350 m above sea level. It holds about 90% of the world\'s ice and 70% of its fresh water: if it all melted, the sea would rise by about 58 m. The ice rises from the coast to Dome A (4,093 m), the highest point of the ice sheet, where China\'s Kunlun Station stands on ice about 3,100 m thick; the highest rock peak is the Vinson Massif (4,892 m). Under its weight the bedrock has sunk, and parts of West Antarctica lie below sea level.',
          '南极洲面积约 1400 万平方千米，约为我国面积的 1.5 倍，约 98% 的面积被冰雪覆盖。冰层平均厚度约 2000 米，最厚处约 4800 米，因此南极洲是平均海拔最高的大洲，平均海拔约 2350 米。这里的冰约占世界冰总量的 90%、淡水总量的 70%，如果全部融化，海平面将上升约 58 米。冰盖从沿海向内陆逐渐升高，最高处是冰穹 A（4093 米），我国昆仑站就建在这里，脚下的冰厚约 3100 米；最高的山峰是文森山（4892 米）。在冰盖的重压下，基岩下沉，西南极部分地区的基岩甚至低于海平面。'],
      },
      {
        title: ['Coldest, windiest, driest', '酷寒、烈风、干燥'], cam: [-76, 110, 3.4],
        fig: climo(VOSTOK, UTQIAGVIK),
        task: ['Follow the ice-blue arrows: cold air slides downhill from the high middle to the coast.', '沿浅蓝色箭头看：冷空气从高高的内陆冰盖顺坡滑向沿海。'],
        paint: [{ fill: { k: 'continents', only: ['antarctica'] }, a: 0.3 }],
        lines: arrows([[[-80, 60], [-74, 66], [-68, 72]], [[-80, 110], [-74, 118], [-67.5, 125]], [[-78, 140], [-72, 142], [-67, 142.7]], [[-82, 20], [-76, 18], [-70, 14]], [[-82, -100], [-77, -110], [-73, -118]]], C.ice, 0.3, 1.8),
        marks: [mk([-78.46, 106.84], 'Vostok −89.2 °C (1983)', '东方站 −89.2 °C（1983 年）', { dot: true, c: C.ice, t: 0.8 }), mk([-67.0, 142.66], 'Commonwealth Bay: gales average ~80 km/h', '联邦湾：年均风速约 80 千米/时', { dot: true, c: C.white, t: 1.2 }),
          mk([-86, 60], 'Under 50 mm of snow a year', '年降水量不足 50 毫米', { c: C.gold, t: 1.6 })],
        body: ['Antarctica is the coldest continent: on 21 July 1983 Russia\'s Vostok Station measured −89.2 °C, the lowest air temperature ever recorded, and the South Pole averages about −49 °C. It is so cold because it is high, because the white ice reflects about 80% of the sunlight, and because there is no ocean water underneath to give off heat. Dense, freezing air slides off the ice dome towards the coast as katabatic winds, often above 100 km/h; at Commonwealth Bay the wind averages about 80 km/h for the whole year, and storms over 300 km/h have been recorded. Very cold air holds almost no water vapour, so the interior gets less than 50 mm of snow a year: Antarctica is also the largest desert on Earth.',
          '南极洲是世界上最冷的大陆：1983 年 7 月 21 日，俄罗斯东方站测得 −89.2 °C，是有记录以来的最低气温；南极点年平均气温约 −49 °C。这里如此寒冷，是因为海拔高，白色冰雪反射约 80% 的太阳光，而且下面是陆地，没有海水放出热量。内陆冰盖上又冷又重的空气沿冰坡向沿海倾泻，形成下降风，风速常超过 100 千米/时；联邦湾全年平均风速约 80 千米/时，曾记录到超过 300 千米/时的暴风，被称为“暴风雪之家”。极冷的空气几乎不含水汽，内陆年降水量不足 50 毫米，南极洲也是世界上面积最大的“荒漠”。'],
      },
      {
        title: ['The Arctic: a frozen ocean', '北极地区：冰封的海洋'], cam: [80, -30, 3.4], wide: true, items: ['an_polarbear', 'an_walrus', 'an_narwhal', 'mg_tern'],
        fig: poleTable,
        task: ['Turn the globe around the Arctic Ocean: which continents surround it, and through which strait does it meet the Pacific?', '绕北冰洋转动地球：哪些大陆环绕着它？它通过哪个海峡与太平洋相连？'],
        paint: [{ fill: { k: 'oceans', only: ['arctic'] }, a: 0.45 }],
        lines: [par(66.56, C.blue, 0.2, { w: 1 }), { pts: BERING, c: C.gold, t: 0.8, w: 2 }],
        marks: [mk([90, 0], 'North Pole', '北极点', { dot: true, t: 0.4 }), mk([72, -40], 'Greenland', '格陵兰岛', { big: true, c: C.white, t: 0.8 }),
          mk([66, -170], 'Bering Strait', '白令海峡', { c: C.gold, t: 1 }), mk([69, -100], 'Inuit homeland', '因纽特人', { c: C.gold, t: 1.2 }), mk([68, 60], 'Nenets reindeer herders', '涅涅茨人（牧驯鹿）', { c: C.gold, t: 1.4 }),
          mk([69, 22], 'Sámi', '萨米人', { c: C.gold, t: 1.5 })],
        body: ['The Arctic is the opposite of the Antarctic: its centre is the Arctic Ocean, about 14.75 million km², the smallest and shallowest ocean, covered by drifting sea ice a few metres thick, and the sea under the North Pole is about 4,261 m deep. Eurasia and North America ring it, with Greenland, the largest island on Earth, at its edge. The water under the ice stores heat, so the North Pole averages about −34 °C in winter and 0 °C in summer, far milder than the South Pole (about −60 °C and −28 °C). About 4 million people live in the Arctic, including the Inuit, who traditionally hunted seals and travelled by dog sled; polar bears, walruses, narwhals and Arctic terns live there too.',
          '北极地区与南极地区正好相反：它的中心是北冰洋，面积约 1475 万平方千米，是面积最小、最浅的大洋，海面上漂浮着几米厚的海冰，北极点下的海深约 4261 米。北冰洋被亚欧大陆和北美大陆环绕，边缘有世界第一大岛格陵兰岛。冰下的海水储存热量，北极点冬季平均气温约 −34 °C，夏季约 0 °C，比南极点（约 −60 °C 和 −28 °C）温和得多。北极地区约有 400 万居民，其中的因纽特人传统上以猎海豹为生、乘狗拉雪橇出行；这里还生活着北极熊、海象、独角鲸和北极燕鸥。'],
      },
      {
        title: ['Polar day and polar night', '极昼和极夜'], cam: [-72, 75, 3.6], night: true, sun: true,
        clock: { mode: 'year', start: Date.UTC(2025, 8, 23, 4), rate: 20, span: 365 },
        fig: daylight,
        task: ['Let the year run: watch Zhongshan and Kunlun move into the light and out again. Which station stays in the dark longer?', '让时间流逝：看中山站和昆仑站怎样进入白昼又进入黑夜。哪个站的极夜更长？'],
        lines: [par(-66.56, C.blue, 0.2, { w: 1 })],
        marks: [mk([-69.37, 76.37], 'Zhongshan 69°S', '中山站 69°S', { dot: true, c: C.teal, t: 0.4 }), mk([-80.42, 77.12], 'Kunlun 80°S', '昆仑站 80°S', { dot: true, c: C.gold, t: 0.6 }),
          mk([-65, 40], 'Antarctic Circle', '南极圈', { c: C.blue, t: 0.8 })],
        body: ['Because the Earth\'s axis is tilted 23.5°, places inside the polar circles have days when the Sun never sets (polar day) and days when it never rises (polar night). The nearer the pole, the longer they last: at Zhongshan Station (69°S) polar day lasts about two months around December, while at Kunlun Station (80°S) the Sun stays up for more than four months; at the poles themselves the year is one day and one night of about six months each. When it is polar day in the south, it is polar night in the north. So scientists visit Antarctica in its summer, about November to March (Chinese expeditions leave Shanghai in October or November), and the Arctic from June to September.',
          '由于地轴倾斜 23.5°，极圈以内的地区会出现太阳整天不落的极昼和整天不升的极夜。越靠近极点，极昼、极夜持续的时间越长：中山站（69°S）在 12 月前后有约两个月的极昼，昆仑站（80°S）的极昼超过四个月；在极点上，一年中大约半年是白天、半年是黑夜。南极出现极昼时，北极正是极夜。因此科学家在南极的夏季（约 11 月至次年 3 月）去南极考察，我国南极考察队一般在 10 月或 11 月从上海出发；北极考察则在 6—9 月进行。'],
      },
      {
        title: ['A laboratory and a storehouse', '天然实验室与资源宝库'], cam: [-78, 60, 2.8], wide: true,
        fig: iceCores,
        task: ['Find the ice-core sites and the Grove Mountains: what does each place tell scientists?', '找到冰芯钻探点和格罗夫山：每个地方能告诉科学家什么？'],
        paint: [{ fill: { k: 'continents', only: ['antarctica'] }, a: 0.3 }],
        marks: [mk([-78.46, 106.84], 'Vostok', '东方站', { dot: true, c: C.ice, t: 0.3 }), mk([-75.1, 123.35], 'Dome C', '冰穹 C', { dot: true, c: C.ice, t: 0.5 }),
          mk([-77.32, 39.7], 'Dome Fuji', '富士冰穹', { dot: true, c: C.ice, t: 0.7 }), mk([-75.58, -26.66], 'Halley: ozone hole found, 1985', '哈雷站：1985 年发现臭氧洞', { dot: true, c: C.violet, t: 0.9 }),
          mk([-72.9, 75], 'Grove Mountains: meteorites', '格罗夫山：陨石', { dot: true, c: C.orange, t: 1.1 }), mk([-80.42, 77.12], 'Kunlun', '昆仑站', { dot: true, c: C.gold, t: 1.3 }),
          mk([-77.5, 161], 'Transantarctic Mts: coal', '横贯南极山脉：煤', { c: C.brown, t: 1.6 }), mk([-62, -40], 'Krill in the Southern Ocean', '南大洋：磷虾', { c: C.pink, t: 1.8 })],
        body: ['The polar ice is a frozen record of the past. Each year\'s snow traps tiny bubbles of air, so ice cores drilled through the sheet reveal temperatures and greenhouse gases going back 800,000 years at Dome C and, from a 2025 core, over 1.2 million years. British scientists at Halley Station discovered the ozone hole over Antarctica in 1985. The cold, dry, still air over Dome A gives some of the clearest skies on Earth for telescopes, and blue ice fields preserve rocks from space: Chinese teams have collected over 12,000 meteorites, most of them in the Grove Mountains. Antarctica also has coal and iron ore, and the Southern Ocean has hundreds of millions of tonnes of krill, but mining is banned to protect the fragile environment.',
          '极地冰盖是记录过去的“档案馆”。每年的降雪都封存了微小的气泡，钻取冰芯就能了解过去的气温和温室气体：冰穹 C 的冰芯记录了 80 万年，2025 年钻取的新冰芯超过 120 万年。1985 年，英国科学家在哈雷站发现了南极上空的臭氧洞。冰穹 A 上空寒冷、干燥、大气稳定，是地球上观测星空最好的地方之一；蓝冰区保存了大量来自太空的陨石，我国科考队已收集陨石 1.2 万多块，大部分来自格罗夫山。南极洲还有煤、铁等矿产，南大洋有数亿吨磷虾，但为了保护脆弱的环境，南极禁止开采矿产。'],
      },
      {
        title: ['China\'s polar stations', '我国的极地科学考察站'], cam: [-82, 60, 2.8], wide: true, items: ['vh_icebreaker'],
        task: ['Find all five stations, oldest first. Which one is on an island off the Antarctic Peninsula?', '按建站先后找出五个考察站。哪个站建在南极半岛附近的岛上？'],
        paint: [{ fill: { k: 'continents', only: ['antarctica'] }, a: 0.3 }],
        lines: [{ pts: ZS_KL, c: C.gold, t: 1.2, w: 2, dur: 1.6 }],
        marks: [mk([-62.22, -58.96], 'Great Wall 1985', '长城站 1985 年', { dot: true, c: C.red, t: 0.3 }), mk([-69.37, 76.37], 'Zhongshan 1989', '中山站 1989 年', { dot: true, c: C.red, t: 0.6 }),
          mk([-80.42, 77.12], 'Kunlun 2009 · 4,087 m', '昆仑站 2009 年 · 4087 米', { dot: true, c: C.red, t: 0.9 }), mk([-73.86, 76.97], 'Taishan 2014', '泰山站 2014 年', { dot: true, c: C.red, t: 1.2 }),
          mk([-74.94, 163.7], 'Qinling 2024', '秦岭站 2024 年', { dot: true, c: C.red, t: 1.5 }), mk([-90, 0], 'South Pole', '南极点', { dot: true, c: C.white, t: 1.8 })],
        body: ['China began Antarctic research in 1984 and opened its first station, Great Wall, on King George Island off the Antarctic Peninsula in 1985. Zhongshan Station followed in 1989 on the Larsemann Hills of East Antarctica, the base for traverses about 1,250 km inland. In 2009 Kunlun Station was built at Dome A, 4,087 m up, the highest station on the continent; Taishan (2014, 2,621 m) is a summer station on the way; and Qinling Station on Inexpressible Island in the Ross Sea opened in 2024. Supplies come on the icebreaker Xuelong and, since 2019, Xuelong 2, China\'s first home-built polar icebreaker, which can break ice 1.5 m thick moving forward or backward.',
          '我国 1984 年开始南极考察，1985 年在南极半岛附近的乔治王岛建成第一个考察站——长城站。1989 年在东南极拉斯曼丘陵建成中山站，它是向内陆约 1250 千米冰盖考察的出发基地。2009 年在海拔 4087 米的冰穹 A 建成昆仑站，是南极大陆海拔最高的考察站；泰山站（2014 年，海拔 2621 米）是通往昆仑站途中的夏季站；2024 年在罗斯海恩克斯堡岛建成秦岭站。物资由“雪龙”号和 2019 年投入使用的“雪龙 2”号运送，“雪龙 2”号是我国自主建造的第一艘极地破冰船，能双向破 1.5 米厚的冰。'],
      },
      {
        title: ['Protecting the poles, and a melting Arctic', '保护极地与北极的变化'], cam: [74, 100, 4.5], wide: true,
        fig: seaIce,
        task: ['Follow the gold route from Shanghai to Rotterdam along Russia\'s Arctic coast, then read on the chart how the summer ice has shrunk.', '沿金色航线从上海经俄罗斯北冰洋沿岸到鹿特丹，再在图中看夏季海冰是怎样减少的。'],
        paint: [{ fill: { k: 'oceans', only: ['arctic'] }, a: 0.3 }],
        lines: [{ pts: NSR, c: C.gold, t: 0.4, w: 2, dur: 3, arrow: true, flow: true }],
        marks: [mk([31.23, 121.47], 'Shanghai', '上海', { dot: true, t: 0.4 }), mk([51.95, 4.1], 'Rotterdam', '鹿特丹', { dot: true, t: 0.6 }), mk([75.5, 125], 'Northern Sea Route', '北方航道', { c: C.gold, t: 1.8 }),
          mk([78.92, 11.93], 'Yellow River Station 2004', '黄河站 2004 年', { dot: true, c: C.red, t: 2 }), mk([65.7, -17.4], 'China–Iceland observatory 2018', '中冰北极科学考察站 2018 年', { dot: true, c: C.red, t: 2.2 }),
          mk([71.27, 72.07], 'Yamal LNG', '亚马尔液化天然气', { dot: true, c: C.teal, t: 2.4 })],
        body: ['In 1959 twelve countries signed the Antarctic Treaty: Antarctica may be used only for peace and science, territorial claims are frozen, and research results are shared. China joined in 1983; a 1991 protocol bans all mining there and requires every visitor to protect the environment and take waste home. The Arctic is warming nearly four times faster than the world as a whole, and the September sea ice now covers about 40% less than in 1979. That threatens polar bears and Inuit hunting, but it also opens the Northern Sea Route along Russia\'s coast, about a quarter shorter than via the Suez Canal from Shanghai to Rotterdam, and gas fields such as Yamal. China, a "near-Arctic state", runs the Yellow River Station in Svalbard (2004) and joins Arctic research and shipping while respecting the Arctic countries\' rights.',
          '1959 年，12 个国家签订了《南极条约》：南极只用于和平目的和科学研究，冻结各国的领土要求，科研成果共享。我国 1983 年加入《南极条约》；1991 年签订的议定书禁止在南极开采矿产，要求所有考察者保护环境、把垃圾带走。北极变暖的速度接近全球平均的 4 倍，9 月的海冰面积比 1979 年减少了约 40%。这威胁着北极熊的生存和因纽特人的狩猎，但也使沿俄罗斯北冰洋沿岸的北方航道逐渐开通：从上海到鹿特丹，走北方航道比经苏伊士运河近约 1/4；亚马尔等天然气田也得到开发。我国是“近北极国家”，2004 年在斯瓦尔巴群岛建成黄河站，在尊重北极国家主权的前提下参与北极科研和航运。'],
      },
    ],
    quiz: [
      { q: ['Why is the Antarctic much colder than the Arctic?', '为什么南极地区比北极地区冷得多？'],
        options: [['It is a high, ice-covered continent; the Arctic is an ocean whose water stores and releases heat', '南极是海拔高、冰雪覆盖的大陆；北极以海洋为主，海水能储存和释放热量'], ['It is farther from the Sun', '它离太阳更远'], ['It has polar night all year', '它全年都是极夜'], ['It gets more snow', '它的降雪更多']], answer: 0,
        why: ['Height (about 2,350 m on average), strong reflection by the ice and the lack of ocean heat make Antarctica far colder; both poles get the same sunlight over a year.', '南极洲平均海拔约 2350 米，冰雪反射强，又缺少海洋热量，因此比北极冷得多；一年中两极得到的太阳光差不多。'] },
      { q: ['Which are rules of the Antarctic Treaty system? Pick all that apply.', '下列属于《南极条约》体系规定的有（多选）'],
        options: [['Antarctica is used only for peaceful purposes', '南极只用于和平目的'], ['Scientists may research freely and share results', '科学考察自由，成果共享'], ['Mining of minerals is banned', '禁止开采矿产资源'],
          ['The land is divided among the 12 first signers', '南极领土由 12 个最初签约国瓜分'], ['Military bases are allowed', '可以建立军事基地']], multi: [0, 1, 2],
        why: ['The 1959 treaty bans military use and freezes territorial claims, and the 1991 protocol bans mining; no country owns Antarctica.', '1959 年的条约禁止军事活动、冻结领土要求，1991 年的议定书禁止开采矿产；南极不属于任何国家。'] },
      { q: ['Put China\'s polar stations in the order they were built.', '按建站时间先后排列我国的极地考察站。'],
        order: [['Great Wall', '长城站'], ['Zhongshan', '中山站'], ['Yellow River', '黄河站'], ['Kunlun', '昆仑站'], ['Taishan', '泰山站'], ['Qinling', '秦岭站']],
        why: ['Great Wall 1985, Zhongshan 1989, Yellow River (Arctic) 2004, Kunlun 2009, Taishan 2014, Qinling 2024.', '长城站 1985 年，中山站 1989 年，黄河站（北极）2004 年，昆仑站 2009 年，泰山站 2014 年，秦岭站 2024 年。'] },
      { q: ['Label China\'s Antarctic stations.', '在地球上标出我国的南极考察站。'],
        place: [{ text: ['Great Wall', '长城站'], at: [-62.22, -58.96], tolKm: 500 }, { text: ['Zhongshan', '中山站'], at: [-69.37, 76.37], tolKm: 400 }, { text: ['Kunlun', '昆仑站'], at: [-80.42, 77.12], tolKm: 400 }, { text: ['Qinling', '秦岭站'], at: [-74.94, 163.7], tolKm: 500 }],
        why: ['Great Wall is off the Antarctic Peninsula, Zhongshan on the East Antarctic coast south of India, Kunlun at Dome A straight inland from it, and Qinling on the Ross Sea south of New Zealand.', '长城站在南极半岛附近，中山站在印度以南的东南极沿岸，昆仑站在它正南方内陆的冰穹 A，秦岭站在新西兰以南的罗斯海沿岸。'] },
      { q: ['An explorer stands at the South Pole. In which direction is the Great Wall Station?', '一位探险者站在南极点上，长城站在他的什么方向？'],
        options: [['North', '北方'], ['South', '南方'], ['West', '西方'], ['East', '东方']], answer: 0,
        why: ['From the South Pole every direction is north, whichever way you face.', '在南极点上，无论面向哪里，四周都是北方。'] },
      { q: ['Using the chart, by about what percentage did the September Arctic sea ice shrink from 1979 to 2024?', '根据图表，1979—2024 年北极 9 月海冰面积约减少了百分之几？'], fig: seaIce, num: { answer: 38, tol: 3, unit: ['%', '%'] },
        why: ['(7.05 − 4.38) ÷ 7.05 ≈ 0.38: about 38% less, in only 45 years.', '(7.05 − 4.38) ÷ 7.05 ≈ 0.38，仅 45 年就减少了约 38%。'] },
      { q: ['Match each polar place to its record.', '将极地地点与它的“之最”连线。'],
        match: [[['Vostok Station', '东方站'], ['Lowest temperature measured, −89.2 °C', '测得最低气温 −89.2 °C']], [['Dome A', '冰穹 A'], ['Highest point of the ice sheet, 4,093 m', '冰盖最高点，4093 米']],
          [['Commonwealth Bay', '联邦湾'], ['Windiest place at sea level', '海平面上风最大的地方']], [['Greenland', '格陵兰岛'], ['Largest island on Earth', '世界第一大岛']], [['North Pole', '北极点'], ['Sea about 4,261 m deep', '海深约 4261 米']]],
        why: ['Antarctica holds the cold, height and wind records; Greenland and the deep ocean under the North Pole belong to the Arctic.', '最冷、最高、风最大的纪录都在南极；格陵兰岛和北极点下的深海属于北极地区。'] },
      { q: ['Chinese Antarctic expeditions usually leave Shanghai in October or November. Why then?', '我国南极考察队一般在 10 月或 11 月从上海出发，为什么？'],
        options: [['They arrive in the Antarctic summer, with polar day and the mildest weather', '到达时正值南极的夏季，有极昼，天气最温和'], ['It is winter in Antarctica, so the ice is thickest and safest', '南极正值冬季，冰最厚最安全'], ['The Sun never shines in Antarctica then', '那时南极没有阳光'], ['Ships cannot sail in Chinese summer', '我国夏季不能航行']], answer: 0,
        why: ['The southern summer runs from about November to March: long polar days, the least sea ice and the warmest temperatures for work.', '南半球夏季约为 11 月至次年 3 月：白昼长、海冰少、气温较高，最适合考察。'] },
    ],
  },
];
