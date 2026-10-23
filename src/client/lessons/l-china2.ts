/** 八上 · 从世界看中国、中国的自然资源、中国的经济发展; 八下 · 北方、南方、西北和青藏地区 (overview lessons). */
import { C, arrows, mk, par, type Fig, type Lesson, type LL, type Pair } from './kit.ts';
import type { Line, Mark } from './stage.ts';
import { svg, tx, arrowDef, CITIES, type Lx, fade, dot } from './figs.ts';
import { REGIONS } from './geo.ts';
import {
  QT_EDGE, NW_LINE, NS_LINE, QT_POLY, NW_POLY, NORTH_POLY, SOUTH_POLY, YANGTZE, YZ, DONGTING, POYANG, YELLOW, YR,
  NINGXIA_PLAIN, HETAO_PLAIN, LOESS_PLATEAU, QT_RIVERS, SANJIANGYUAN_AREA, QT_RAIL, NE_PLAINS, NE_MOUNTAINS,
} from './geo-cn.ts';

const land = ['China\'s land and people', '从世界看中国'] as const;
const regions = ['Regions of China', '中国的地理差异与区域'] as const;
const CN = ['CN', 'TW'];
const NEIGHBOURS = ['KP', 'RU', 'MN', 'KZ', 'KG', 'TJ', 'AF', 'PK', 'IN', 'NP', 'BT', 'MM', 'LA', 'VN'];
const REGION_C = { north: C.gold, south: C.green, nw: C.orange, qt: C.violet };

// ------------------------------------------------------------------------------------------------ shapes

/** Hu Huanyong line: Heihe (Heilongjiang) to Tengchong (Yunnan). */
const HU_LINE: LL[] = [[50.25, 127.5], [25.02, 98.5]];
const HU_EAST: LL[] = [[54, 122], [54, 136], [17, 125], [17, 98], [25.02, 98.5], [50.25, 127.5], [53.5, 125]];
/** Roughly the 400 mm rainfall line, from the Greater Khingan to the southern edge of the Tibetan plateau. */
const FARM_PASTURE: LL[] = [[51, 122.5], [47, 120.5], [43, 117.5], [41, 114], [39.5, 110], [37.5, 106], [36, 103.5], [34, 101], [32, 98], [30.5, 94], [29, 90.5], [28.5, 87]];
/** South–North Water Diversion. East Route: Jiangdu pumping station, up the Grand Canal through Hongze, Luoma,
 * Nansi and Dongping lakes, under the Yellow River, on to Dezhou and (emergency supply) Tianjin. */
const SNWD_EAST: LL[] = [[32.42, 119.55], [32.8, 119.42], [33.35, 118.9], [33.75, 118.35], [34.15, 118.15], [34.6, 117.5], [35.0, 116.9], [35.5, 116.55], [35.97, 116.2], [36.45, 116.0], [36.84, 115.7], [37.45, 116.3]];
const SNWD_EAST_TJ: LL[] = [[37.45, 116.3], [38.3, 116.85], [39.1, 117.2]];
/** East Route, Jiaodong branch: Dongping Lake to Jinan, Weifang and Yantai–Weihai. */
const SNWD_EAST_SD: LL[] = [[35.97, 116.2], [36.3, 116.6], [36.67, 117.0], [36.9, 118.0], [37.0, 119.0], [37.3, 120.0], [37.5, 121.4], [37.5, 122.1]];
/** Middle Route: Taocha intake at Danjiangkou Reservoir, along the foot of the Funiu and Taihang mountains, under the
 * Yellow River west of Zhengzhou, to Tuancheng Lake in Beijing; a branch to Tianjin. */
const SNWD_MIDDLE: LL[] = [[32.67, 111.71], [33.0, 112.5], [33.7, 113.2], [34.6, 113.3], [34.95, 113.3], [35.25, 113.25], [36.1, 114.3], [37.0, 114.5], [38.0, 114.45], [38.9, 115.45], [39.6, 116.0], [39.98, 116.27]];
const SNWD_MIDDLE_TJ: LL[] = [[39.05, 115.55], [39.1, 116.4], [39.13, 117.2]];
/** Luan River to Tianjin (1983): Panjiakou Reservoir to the city. */
const LUAN_TJ: LL[] = [[40.42, 118.28], [40.05, 118.0], [39.6, 117.6], [39.13, 117.2]];
const TARIM_RIVER: LL[] = [[40.55, 81.3], [40.9, 82.6], [41.05, 84.0], [41.0, 85.5], [40.75, 86.8], [40.6, 87.7], [40.0, 88.1], [39.5, 88.3]];
const BJ_SH: LL[] = [[39.9, 116.4], [39.13, 117.2], [36.67, 117.0], [34.26, 117.18], [32.92, 117.39], [32.05, 118.8], [31.3, 120.6], [31.2, 121.45]];
const BJ_GZ: LL[] = [[39.9, 116.4], [38.04, 114.5], [34.75, 113.65], [30.6, 114.3], [28.2, 113.0], [23.13, 113.26]];
/** Daqin railway: coal from Datong to the port of Qinhuangdao (653 km). */
const DAQIN: LL[] = [[40.08, 113.3], [40.35, 114.6], [40.45, 115.97], [40.32, 116.63], [40.14, 117.12], [40.04, 117.9], [39.95, 118.7], [39.93, 119.6]];
/** West–East Gas Pipeline (line 1, 2004): Lunnan in the Tarim Basin to Shanghai. */
const GAS_PIPE: LL[] = [[41.78, 84.25], [41.75, 86.15], [42.95, 89.2], [42.8, 93.5], [41.1, 95.4], [39.73, 98.49], [38.93, 100.45], [37.93, 102.64], [37.5, 105.2], [37.6, 108.8], [36.1, 111.5], [34.75, 113.65], [32.6, 117.0], [32.05, 118.8], [31.8, 119.95], [31.2, 121.45]];
/** The Taihang Mountains, which split Shandong ("east of the mountains") from Shanxi ("west of the mountains"). */
const TAIHANG: LL[] = [[40.3, 115.5], [39.3, 114.4], [38.2, 113.8], [37.2, 113.6], [36.2, 113.5], [35.4, 113.0], [35.1, 112.4]];
const YRD: LL[] = [[32.6, 119.3], [32.3, 121.0], [31.8, 121.9], [30.8, 122.0], [30.2, 121.3], [29.9, 120.2], [30.6, 119.4], [31.6, 119.2]];
const PRD: LL[] = [[23.5, 113.0], [23.3, 114.1], [22.6, 114.4], [22.1, 113.6], [22.2, 112.8], [22.9, 112.5]];
const KARST: LL[] = [[29, 103], [28.5, 109], [25.5, 111.5], [23, 110], [23, 104], [25, 102.5]];
const lead = (from: LL, to: LL, t = 0, c: string = C.white): Line => ({ pts: [from, to], c, t, w: 0.7, dur: 0.4 });
const pin = (ll: LL, c: string, t = 0): Mark => ({ ll, dot: true, c, t });
const fourRegions = (a = 0.42, t = 0) => [
  { fill: { k: 'poly' as const, pts: NORTH_POLY, c: REGION_C.north, clip: CN }, a, t },
  { fill: { k: 'poly' as const, pts: SOUTH_POLY, c: REGION_C.south, clip: CN }, a, t: t + 0.5 },
  { fill: { k: 'poly' as const, pts: NW_POLY, c: REGION_C.nw, clip: CN }, a, t: t + 1 },
  { fill: { k: 'poly' as const, pts: QT_POLY, c: REGION_C.qt, clip: CN }, a, t: t + 1.5 },
];

// ------------------------------------------------------------------------------------------------ figure helpers

const fig = (draw: (L: Lx, id: string) => string): Fig => ({ k: 'svg', draw });
const pts = (p: [number, number][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const hline = (x1: number, x2: number, y: number, c = 'fg-grid') => `<line x1="${x1}" x2="${x2}" y1="${y}" y2="${y}" class="${c}"/>`;
const vline = (x: number, y1: number, y2: number, c = 'fg-note') => `<line x1="${x}" x2="${x}" y1="${y1}" y2="${y2}" class="${c}"/>`;
const head = (L: Lx, a: Pair, b?: Pair) => tx(4, 12, L(a), 'fg-title') + (b ? tx(4, 23, L(b), 'fg-sub') : '');
const r1 = (v: number) => Math.round(v * 10) / 10;

/** A climate graph for a city that is not in the shared table (same look as the built-in ones). */
interface Clim { name: Pair; type: Pair; T: number[]; P: number[] }
const climoFig = (c: Clim, blind = false): Fig => fig(L => {
  const x0 = 26, x1 = 294, y0 = 40, y1 = 136, mw = (x1 - x0) / 12;
  const tmin = Math.min(-10, Math.floor(Math.min(...c.T) / 10) * 10), tmax = Math.max(30, Math.ceil(Math.max(...c.T) / 10) * 10);
  const pmax = Math.max(100, Math.ceil(Math.max(...c.P) / 100) * 100);
  const ty = (t: number) => y1 - ((t - tmin) / (tmax - tmin)) * (y1 - y0), py = (p: number) => y1 - (p / pmax) * (y1 - y0);
  let o = '';
  for (let t = tmin; t <= tmax; t += 10) o += hline(x0, x1, r1(ty(t)), t === 0 ? 'fg-zero' : 'fg-grid') + tx(x0 - 3, ty(t) + 3, String(t), 'fg-tick', 'e');
  for (let k = 0; k <= 4; k++) o += tx(x1 + 3, py((pmax * k) / 4) + 3, String((pmax * k) / 4), 'fg-tick fg-p', 's');
  c.P.forEach((p, m) => { const y = py(p); o += `<rect x="${r1(x0 + m * mw + mw * 0.15)}" y="${r1(y)}" width="${r1(mw * 0.7)}" height="${r1(y1 - y)}" class="fg-bar f-grow" style="--d:${m * 0.04}s"/>`; });
  o += `<polyline points="${c.T.map((t, m) => `${r1(x0 + (m + 0.5) * mw)},${r1(ty(t))}`).join(' ')}" class="fg-temp f-draw" pathLength="1"/>`;
  c.T.forEach((t, m) => { o += `<circle cx="${r1(x0 + (m + 0.5) * mw)}" cy="${r1(ty(t))}" r="1.8" class="fg-tdot f-fade" style="--d:${0.6 + m * 0.05}s"/>`; });
  for (let m = 0; m < 12; m++) o += tx(x0 + (m + 0.5) * mw, y1 + 10, String(m + 1), 'fg-tick', 'm');
  o += tx(x0 - 3, y0 - 5, '°C', 'fg-tick fg-t', 'e') + tx(x1 + 3, y0 - 5, 'mm', 'fg-tick fg-p', 's');
  const mean = c.T.reduce((a, b) => a + b, 0) / 12, sum = Math.round(c.P.reduce((a, b) => a + b, 0));
  o += tx(6, 12, blind ? L(['Mystery place', '某地']) : `${L(c.name)} · ${L(c.type)}`, 'fg-title');
  o += tx(6, 23, L([`mean ${r1(mean)} °C · ${sum.toLocaleString('en-US')} mm a year`, `年均温 ${r1(mean)} °C · 年降水 ${sum} 毫米`]), 'fg-sub');
  return svg(320, 152, o, L(['Climate graph', '气候资料图']));
});
const GUANGZHOU: Clim = { name: ['Guangzhou', '广州'], type: ['Subtropical monsoon', '亚热带季风气候'],
  T: CITIES.guangzhou.T, P: CITIES.guangzhou.P };
const KUNMING: Clim = { name: ['Kunming', '昆明'], type: ['Subtropical monsoon, on a plateau', '亚热带季风气候（高原）'],
  T: [8.9, 11.1, 14.5, 17.6, 19.6, 20.0, 19.9, 19.6, 18.4, 15.9, 12.3, 9.2], P: [16, 16, 20, 24, 97, 181, 216, 198, 117, 79, 37, 13] };
const ZHENGZHOU: Clim = { name: ['Zhengzhou', '郑州'], type: ['Temperate monsoon', '温带季风气候'],
  T: [0.9, 4.4, 10.1, 16.6, 22.2, 26.9, 27.8, 26.4, 22.2, 16.6, 9.5, 3.0], P: [11, 14, 27, 39, 63, 72, 155, 126, 69, 41, 26, 9] };
const TURPAN: Clim = { name: ['Turpan', '吐鲁番'], type: ['Temperate continental (desert)', '温带大陆性气候（荒漠）'],
  T: [-7.6, -1.2, 8.7, 18.1, 24.8, 30.0, 32.2, 30.2, 23.0, 12.9, 2.9, -5.4], P: [1.0, 0.4, 1.0, 0.8, 1.2, 3.0, 3.0, 2.8, 1.5, 0.6, 0.3, 0.6] };

/** China's span of latitude, with January mean temperatures from Zengmu Ansha to Mohe. */
const latFig = fig(L => {
  const X = (lat: number) => 24 + (lat / 60) * 284;
  let o = head(L, ['China from south to north', '我国南北跨纬度'], ['about 4°N to 53.5°N: nearly 50° of latitude, about 5,500 km', '约北纬 4° 至北纬 53.5°，跨近 50 个纬度，约 5500 千米']);
  o += `<rect x="${X(0)}" y="54" width="${r1(X(23.44) - X(0))}" height="11" fill="${C.orange}" opacity=".3"/><rect x="${r1(X(23.44))}" y="54" width="${r1(X(60) - X(23.44))}" height="11" fill="${C.green}" opacity=".25"/>`;
  o += tx((X(0) + X(23.44)) / 2, 62.5, L(['tropics', '热带']), 'fg-tick', 'm') + tx((X(23.44) + X(60)) / 2, 62.5, L(['north temperate zone', '北温带']), 'fg-tick', 'm');
  for (const l of [0, 10, 20, 30, 40, 50, 60]) o += vline(X(l), 52, 80, 'fg-grid') + tx(X(l), 88, `${l}°N`, 'fg-tick', 'm');
  o += `<rect x="${r1(X(3.97))}" y="68" width="${r1(X(53.55) - X(3.97))}" height="8" rx="2" fill="${C.red}" opacity=".85" class="f-growx"/>`;
  const cities: [number, Pair, string][] = [[3.97, ['Zengmu Ansha', '曾母暗沙'], '≈27'], [18.25, ['Sanya', '三亚'], '21.6'], [23.13, ['Guangzhou', '广州'], '13.6'],
    [31.2, ['Shanghai', '上海'], '4.8'], [39.9, ['Beijing', '北京'], '−3.1'], [45.75, ['Harbin', '哈尔滨'], '−17.6'], [52.97, ['Mohe', '漠河'], '≈−28']];
  cities.forEach(([lat, n, t], i) => {
    const x = X(lat), y = i % 2 ? 46 : 37;
    o += fade(0.4 + i * 0.12, vline(x, y + 2, 70, 'fg-guide') + dot(x, 72, C.white, 1.8) + tx(x, y, L(n), 'fg-tick', 'm') + tx(x, i % 2 ? 112 : 103, `${t}°`, 'fg-label', 'm'));
  });
  o += tx(4, 124, L(['January mean temperature (°C): a difference of over 45 °C', '1 月平均气温（°C）：南北相差 45 °C 以上']), 'fg-sub');
  return svg(320, 130, o, L(['China\'s span of latitude and January temperatures', '我国南北跨纬度与 1 月平均气温']));
});
/** The Pearl River (Xi Jiang branch), from eastern Yunnan to the delta (sketch). */
const PEARL: LL[] = [[25.6, 103.8], [24.9, 104.4], [24.9, 105.5], [25.0, 106.6], [24.4, 107.6], [23.8, 108.7], [23.4, 109.5], [23.4, 110.2], [23.48, 111.3], [23.1, 112.0], [23.05, 112.47], [22.8, 113.1], [22.4, 113.5]];

const regionKey: Fig = { k: 'key', set: 'custom', title: ['Share of China (approx.): land · people', '约占全国：面积 · 人口'], items: [
  { c: REGION_C.north, name: ['Northern region: 20% · 40%', '北方地区：20% · 40%'] }, { c: REGION_C.south, name: ['Southern region: 25% · 55%', '南方地区：25% · 55%'] },
  { c: REGION_C.nw, name: ['Northwest region: 30% · 4%', '西北地区：30% · 4%'] }, { c: REGION_C.qt, name: ['Qinghai–Tibet region: 25% · under 1%', '青藏地区：25% · 不足 1%'] }] };

/** South–North Water Diversion: the East Route is pumped uphill, the Middle Route flows downhill. */
const snwdFig = fig((L, id) => {
  const Y = (e: number) => 136 - (e / 160) * 92;
  const panel = (x0: number, w: number, prof: [number, number][], c: string) => {
    const xy = prof.map(([f, e]) => [x0 + f * w, Y(e)] as [number, number]);
    return `<polygon points="${pts([[x0, Y(0)], ...xy, [x0 + w, Y(0)]])}" class="fg-landfill"/>` + `<polyline points="${pts(xy)}" fill="none" stroke="${c}" stroke-width="2.2" stroke-linejoin="round" class="f-draw" pathLength="1"/>`;
  };
  let o = arrowDef(id + 'a', C.gold) + head(L, ['Water levels along the routes (sketch)', '东线、中线输水水位示意'], ['height above sea level, not to scale along the route', '纵轴为海拔，横向不按比例']);
  for (const e of [0, 50, 100, 150]) o += hline(26, 314, Y(e)) + tx(23, Y(e) + 3, String(e), 'fg-tick', 'e');
  o += tx(23, Y(160) - 3, 'm', 'fg-tick', 'e');
  const east: [number, number][] = [[0, 3], [0.08, 3], [0.08, 12], [0.24, 12], [0.24, 23], [0.42, 23], [0.42, 33], [0.58, 33], [0.58, 40], [0.74, 40], [0.86, 25], [1, 3]];
  o += panel(30, 128, east, C.teal) + panel(174, 136, [[0, 147], [0.3, 138], [0.52, 118], [0.78, 78], [1, 50]], C.green);
  o += fade(0.6, [0.08, 0.24, 0.42, 0.58].map(f => `<line x1="${30 + f * 128 - 5}" x2="${30 + f * 128 - 5}" y1="${Y(2)}" y2="${Y(30)}" class="fg-arrow" marker-end="url(#${id}a)"/>`).join(''));
  o += fade(0.9, tx(30, 30 + 9, L(['East Route', '东线']), 'fg-label') + tx(30, 48, L(['13 pumping stages, ≈65 m of lift', '13 级泵站，提水约 65 米']), 'fg-sub')
    + tx(32, Y(3) + 9, L(['Yangtze', '长江']), 'fg-tick') + tx(30 + 0.66 * 128, Y(40) - 4, L(['Dongping L. ≈40 m', '东平湖约 40 米']), 'fg-tick', 'm') + tx(156, Y(3) + 9, L(['Tianjin', '天津']), 'fg-tick', 'e'));
  o += fade(1.2, tx(178, 39, L(['Middle Route', '中线']), 'fg-label') + tx(178, 48, L(['1,432 km, all by gravity', '全长 1432 千米，全程自流']), 'fg-sub')
    + tx(180, Y(140) + 12, L(['Danjiangkou ≈147 m', '丹江口约 147 米']), 'fg-tick') + tx(310, Y(50) - 4, L(['Beijing ≈50 m', '北京约 50 米']), 'fg-tick', 'e')
    + dot(174 + 0.52 * 136, Y(0) - 3, C.gold, 2.6) + tx(174 + 0.52 * 136, Y(0) + 9, L(['tunnel under the Yellow R.', '穿黄隧洞']), 'fg-tick', 'm'));
  o += fade(1.3, dot(30 + 0.8 * 128, Y(0) - 3, C.gold, 2.6) + tx(30 + 0.8 * 128 + 4, Y(0) + 9, L(['under the Yellow R.', '穿黄河']), 'fg-tick', 'e'));
  return svg(320, 152, o, L(['Water levels along the East and Middle routes', '南水北调东线和中线的水位变化']));
});

/** The five ways of moving goods and people. */
const transportFig = fig(L => {
  const cols = [4, 52, 100, 146, 190];
  const headRow: Pair[] = [['Mode', '方式'], ['Speed', '速度'], ['Cost', '运价'], ['Load', '运量'], ['Best for', '适宜运送']];
  const rows: [string, Pair[]][] = [
    [C.gold, [['Rail', '铁路'], ['fairly fast', '较快'], ['low', '较低'], ['large', '大'], ['bulk goods, long trips', '大宗货物、长途']]],
    [C.orange, [['Road', '公路'], ['flexible', '灵活'], ['higher', '较高'], ['small', '小'], ['door to door, short trips', '短途、门到门']]],
    [C.blue, [['Water', '水运'], ['slowest', '最慢'], ['lowest', '最低'], ['largest', '最大'], ['heavy goods, no hurry', '笨重、不急的大宗货物']]],
    [C.pink, [['Air', '航空'], ['fastest', '最快'], ['highest', '最高'], ['smallest', '最小'], ['urgent, valuable, fresh', '急需、贵重、鲜活']]],
    [C.teal, [['Pipeline', '管道'], ['non-stop', '连续'], ['low', '低'], ['large', '大'], ['oil and gas', '石油、天然气']]],
  ];
  let o = head(L, ['Choosing a way to transport', '交通运输方式的选择']);
  headRow.forEach((p, i) => { o += tx(cols[i], 32, L(p), 'fg-label'); });
  o += hline(4, 316, 36);
  rows.forEach(([c, cells], r) => {
    const y = 50 + r * 19;
    o += fade(0.2 + r * 0.15, `<rect x="2" y="${y - 10}" width="3" height="13" fill="${c}"/>` + cells.map((p, i) => tx(cols[i] + (i ? 0 : 6), y, L(p), i ? 'fg-tick' : 'fg-label')).join(''));
  });
  o += tx(4, 146, L(['Per tonne-km, water is cheapest and air dearest.', '按每吨千米计，水运最便宜，航空最贵。']), 'fg-sub');
  return svg(320, 152, o, L(['Comparing five modes of transport', '五种交通运输方式的比较']));
});

/** Dujiangyan: the Fish Mouth splits the Min River, the Flying Sand Weir spills floods and sand, the Bottle-Neck feeds the plain. */
const dujiangyanFig = fig((L, id) => {
  let o = arrowDef(id + 'w', '#74c0fc') + arrowDef(id + 's', C.brown) + head(L, ['Dujiangyan, Sichuan (sketch, from above)', '都江堰水利工程（示意，俯视）'], ['Built in 256 BC under Li Bing; still in use', '公元前 256 年李冰主持修建，沿用至今']);
  o += `<polyline points="80,30 92,48 100,62" class="fg-river-l"/>`;
  o += `<polyline points="100,62 88,86 76,112 66,142" class="fg-river-l f-draw" pathLength="1"/>`;
  o += `<polyline points="100,62 126,82 150,98 168,112" class="fg-river-l f-draw" pathLength="1" style="stroke:#74c0fc"/>`;
  o += fade(0.8, ['178,112 220,104 260,96 300,90', '178,114 224,118 266,122 306,126', '176,118 210,132 250,142 290,148'].map(p => `<polyline points="${p}" fill="none" stroke="#74c0fc" stroke-width="1.2" stroke-dasharray="3 2"/>`).join(''));
  o += `<polygon points="100,58 106,66 100,74 94,66" fill="${C.gold}"/>`;
  o += `<rect x="164" y="104" width="10" height="16" rx="1" fill="#868e96"/>`;
  o += `<line x1="128" x2="140" y1="96" y2="104" stroke="${C.brown}" stroke-width="3"/>`;
  o += fade(1.2, `<path d="M134 96 Q118 104 98 108" fill="none" stroke="${C.brown}" stroke-width="1.3" stroke-dasharray="3 2" marker-end="url(#${id}s)"/>`);
  o += fade(0.4, tx(108, 60, L(['Fish Mouth: splits the river', '鱼嘴：分水']), 'fg-label') + tx(58, 120, L(['outer river', '外江']), 'fg-tick', 'e') + tx(58, 129, L(['(main flow)', '（主流）']), 'fg-sub', 'e')
    + tx(122, 76, L(['inner river', '内江']), 'fg-tick', 'e'));
  o += fade(1.0, tx(144, 94, L(['Flying Sand Weir: floods and', '飞沙堰：洪水和泥沙']), 'fg-tick') + tx(144, 103, L(['sand spill back out', '溢回外江']), 'fg-tick'));
  o += fade(1.4, tx(178, 130, L(['Bottle-Neck Channel', '宝瓶口：引水入']), 'fg-label', 's') + tx(180, 140, L(['into the Chengdu Plain', '成都平原']), 'fg-sub', 's'));
  o += fade(1.6, tx(316, 36, L(['dry season: ≈60% into inner river', '枯水期：约六成水入内江']), 'fg-tick', 'e') + tx(316, 46, L(['flood season: ≈60% to outer river', '洪水期：约六成水走外江']), 'fg-tick', 'e')
    + tx(316, 58, L(['("inner six, outer four")', '（“分四六，平潦旱”）']), 'fg-sub', 'e'));
  o += tx(80, 26, L(['Min River', '岷江']), 'fg-tick', 'm');
  return svg(320, 152, o, L(['How the Dujiangyan irrigation system works', '都江堰水利工程示意']));
});

/** An oasis at the foot of the mountains, fed by meltwater and karez. */
const oasisFig = fig((L, id) => {
  let o = arrowDef(id + 'w', '#74c0fc') + head(L, ['Mountains, oasis and desert (sketch)', '山地—绿洲—荒漠剖面（示意）']);
  o += `<polygon points="4,124 4,40 22,30 44,46 66,84 100,108 150,118 316,122 316,140 4,140" class="fg-landfill"/>`;
  o += `<polyline points="4,40 22,30 44,46 66,84 100,108 150,118 316,122" class="fg-profile f-draw" pathLength="1"/>`;
  o += `<polygon points="12,35 22,30 34,37 28,40 18,40" class="fg-ice"/>`;
  o += fade(0.6, `<path d="M36 46 Q52 70 70 92" fill="none" stroke="#74c0fc" stroke-width="1.6" stroke-dasharray="4 3" marker-end="url(#${id}w)"/>`);
  o += fade(0.8, `<polyline points="66,100 120,118 176,124" fill="none" stroke="#74c0fc" stroke-width="1.1" stroke-dasharray="2 2"/>`);
  o += fade(1.0, `<polyline points="96,116 132,122 180,124" fill="none" stroke="#4dabf7" stroke-width="2"/>` + [104, 116, 128, 140, 152, 164].map(x => vline(x, 108 + (x - 96) * 0.2, 118 + (x - 96) * 0.14, '').replace('class=""', 'stroke="#ced4da" stroke-width="1"')).join(''));
  o += fade(1.3, [186, 198, 210, 222, 234].map((x, i) => `<circle cx="${x}" cy="${115 - (i % 2) * 2}" r="5" fill="${C.green}" opacity=".85"/>`).join(''));
  o += fade(1.5, [256, 280, 304].map(x => `<path d="M${x - 12} 122 Q${x} 110 ${x + 12} 122" fill="${C.gold}" opacity=".45"/>`).join(''));
  o += fade(0.4, tx(40, 26, L(['snow and glaciers', '冰雪']), 'fg-tick'));
  o += fade(0.7, tx(74, 70, L(['meltwater sinks into', '融水渗入山麓']), 'fg-tick') + tx(74, 79, L(['the gravel fan', '冲积扇砾石层']), 'fg-tick'));
  o += fade(1.1, tx(132, 136, L(['karez: shafts + underground channel', '坎儿井：竖井 + 暗渠']), 'fg-tick', 'm'));
  o += fade(1.4, tx(210, 94, L(['oasis', '绿洲']), 'fg-label', 'm') + tx(210, 103, L(['cotton, grapes, melons', '棉花、葡萄、瓜果']), 'fg-sub', 'm'));
  o += fade(1.6, tx(282, 104, L(['desert', '荒漠']), 'fg-label', 'm'));
  return svg(320, 146, o, L(['How an oasis is watered', '绿洲的水源']));
});

// ------------------------------------------------------------------------------------------------ lessons

export const CHINA_B: Lesson[] = [
  {
    id: 'china-place', strand: 'china', tracks: ['us', 'ib'], grade: 'g8a', unit: land, icon: 'flag', minutes: 10,
    title: ['China\'s territory and divisions', '疆域与行政区划'],
    blurb: ['Where China is, how big it is, its neighbours, seas and islands, and its 34 provincial-level divisions.', '我国的位置、面积、邻国、海域与岛屿，以及 34 个省级行政区。'],
    keys: [
      ['China is in the east of Asia, on the west coast of the Pacific: a land-and-sea country, mostly in the north temperate zone.', '我国位于亚洲东部、太平洋西岸，海陆兼备，大部分位于北温带。'],
      ['Its land area is about 9.6 million km², third in the world; it spans about 50° of latitude and 62° of longitude.', '陆地面积约 960 万平方千米，居世界第三位；南北跨约 50 个纬度，东西跨约 62 个经度。'],
      ['It has 14 land neighbours and 6 neighbours across the sea, and borders the Bohai, Yellow, East China and South China seas.', '陆上邻国 14 个，隔海相望的国家 6 个；濒临渤海、黄海、东海和南海。'],
      ['Taiwan and Hainan are the two largest islands; the Bohai Sea is China\'s inland sea.', '台湾岛、海南岛是我国最大的两个岛屿；渤海是我国的内海。'],
      ['There are 34 provincial-level divisions: 23 provinces, 5 autonomous regions, 4 municipalities and 2 SARs, each with a short name.', '全国共有 34 个省级行政区：23 个省、5 个自治区、4 个直辖市、2 个特别行政区，各有简称。'],
    ],
    steps: [
      {
        title: ['Where in the world?', '从世界看中国的位置'], cam: [27, 88, 5.4], wide: true,
        task: ['Follow the 30°N line west from the Yangtze valley to Arabia: why is one green and the other desert?', '沿北纬 30° 从长江流域向西看到阿拉伯半岛：为什么一边青绿、一边是沙漠？'],
        paint: [{ fill: { k: 'land', a2: CN, c: C.red }, t: 0.4, a: 0.55 }],
        lines: [par(0, C.white, 0.2, { w: 1.1 }), par(23.44, C.gold, 0.6, { w: 1.1 }), par(30, C.lime, 1.6, { w: 0.9 }), par(66.56, C.ice, 1, { w: 1.1 }),
          ...arrows([[[18, 135], [24, 124], [28, 117]], [[12, 92], [20, 100], [25, 104]]], C.teal, 2.6, 1.8)],
        marks: [mk([12, 148], 'Pacific Ocean', '太平洋', { big: true, c: C.blue, t: 1.2 }), mk([48, 92], 'Asia', '亚洲', { big: true, c: C.gold, t: 1.4 }), mk([23.44, 70], 'Tropic of Cancer', '北回归线', { c: C.gold, t: 0.8 }),
          mk([30.6, 114.3], '30°N: Yangtze valley, green and wet', '北纬 30°：长江流域，湿润青绿', { dot: true, c: C.lime, t: 2 }), mk([27, 45], '30°N: Arabian Desert', '北纬 30°附近：阿拉伯沙漠', { dot: true, c: C.orange, t: 2.3 }),
          mk([20, 128], 'Summer monsoon', '夏季风', { c: C.teal, t: 3 })],
        body: ['China lies in both the Northern and the Eastern Hemispheres, in the east of Asia and on the west coast of the Pacific Ocean. That makes it a land-and-sea country: a huge continent behind it, a long coast in front. Moist summer monsoon winds blow in from the Pacific and the Indian Ocean, so at about 30°N the Yangtze valley is green and rainy while the Arabian Desert at the same latitude is bare. Most of China is in the mid-latitudes and the north temperate zone; a small part in the south is tropical, and none is in the frigid zone.',
          '我国位于北半球和东半球，地处亚洲东部、太平洋西岸，背靠亚欧大陆，面向浩瀚的太平洋，是一个海陆兼备的国家。来自太平洋和印度洋的湿润夏季风带来丰沛降水，所以同在北纬 30° 附近，长江流域青山绿水，阿拉伯半岛却是一片沙漠。我国大部分位于中纬度地区，属于北温带，南部少数地区位于热带，没有寒带。'],
      },
      {
        title: ['From the tropics to the far north', '南北跨纬度广'], cam: [32, 112, 4.6],
        task: ['Turn from Sanya on Hainan north to Mohe on the Heilong River: compare their January temperatures in the chart.', '从海南三亚向北转到黑龙江畔的漠河，在图中比较两地的 1 月平均气温。'],
        paint: [{ fill: { k: 'land', a2: CN, c: C.red }, a: 0.35 }, { fill: { k: 'band', s: 3.9, n: 23.44, c: C.orange }, a: 0.12, t: 0.6 }],
        lines: [par(23.44, C.gold, 0.4, { w: 1.1 }), { pts: [[18.25, 109.5], [52.97, 122.53]], c: C.white, w: 1.2, dur: 1.8, t: 1 }],
        marks: [mk([18.25, 109.5], 'Sanya: January 21.6 °C', '三亚：1 月 21.6 °C', { dot: true, c: C.orange, t: 0.8 }), mk([52.97, 122.53], 'Mohe: January about −28 °C', '漠河：1 月约 −28 °C', { dot: true, c: C.ice, t: 2.2 }),
          mk([45.75, 126.65], 'Harbin −17.6 °C', '哈尔滨 −17.6 °C', { dot: true, c: C.ice, t: 1.8 }), mk([31.2, 121.47], 'Shanghai 4.8 °C', '上海 4.8 °C', { dot: true, c: C.white, t: 1.4 })],
        fig: latFig,
        body: ['From Zengmu Ansha near 4°N to the Heilong River near 53.5°N, China spans almost 50° of latitude, about 5,500 km. That makes a huge difference in heat. In January, Sanya on Hainan averages about 21.6 °C and farmers grow winter vegetables, while Mohe averages about −28 °C and the rivers are frozen solid. Warm south, cold north: this north–south contrast shapes where crops grow, how many harvests there are and how people live.',
          '我国领土从北纬 4° 附近的曾母暗沙一直延伸到北纬 53.5° 附近的黑龙江，南北跨近 50 个纬度，约 5500 千米，各地热量差异很大。1 月，海南三亚平均气温约 21.6 °C，田里种着冬季瓜菜；漠河平均气温约 −28 °C，江河冰封。南热北冷的差异，影响着农作物的种类、熟制和人们的生活方式。'],
      },
      {
        title: ['A big country', '辽阔的疆域'], cam: [45, 100, 5.4], wide: true,
        paint: [{ fill: { k: 'land', a2: ['RU'], c: C.violet }, a: 0.4 }, { fill: { k: 'land', a2: ['CA'], c: C.teal }, a: 0.4, t: 0.4 }, { fill: { k: 'land', a2: ['US'], c: C.blue }, a: 0.35, t: 0.6 }, { fill: { k: 'land', a2: CN, c: C.red }, a: 0.6, t: 0.8 }],
        marks: [mk([60, 95], 'Russia 17.1', '俄罗斯 1710 万', { c: C.violet, t: 0.6 }), mk([34, 103], 'China 9.6 million km²', '中国 960 万平方千米', { big: true, c: C.red, t: 1.2 }), mk([15, 116], 'About 3 million km² of seas', '约 300 万平方千米管辖海域', { c: C.blue, t: 1.8 })],
        fig: { k: 'bars', title: ['Largest countries by area (approx.)', '面积最大的国家（约）'], unit: ['million km²', '百万平方千米'], rows: [
          { name: ['Russia', '俄罗斯'], v: 17.1, c: C.violet }, { name: ['Canada', '加拿大'], v: 10.0, c: C.teal }, { name: ['China', '中国'], v: 9.6, c: C.red }, { name: ['USA', '美国'], v: 9.4, c: C.blue }, { name: ['Brazil', '巴西'], v: 8.5, c: C.green }] },
        body: ['China\'s land area is about 9.6 million km², the third largest in the world after Russia and Canada and about 6.4% of all the land on Earth. It is almost as big as the whole of Europe. On top of that, China has about 3 million km² of seas under its jurisdiction. Such a large territory holds every kind of landform and many climates, which gives China a wide range of natural resources.',
          '我国陆地面积约 960 万平方千米，仅次于俄罗斯和加拿大，居世界第三位，约占世界陆地总面积的 6.4%，与整个欧洲的面积差不多。此外，我国还有约 300 万平方千米的管辖海域。辽阔的疆域使我国地形多样、气候复杂，自然资源种类丰富。'],
      },
      {
        title: ['From end to end', '四至点'], cam: [32, 104, 4.4],
        task: ['Find the four extreme points in turn: north, south, west and east. Which pair is farthest apart?', '依次找到我国领土的最北端、最南端、最西端和最东端。哪两点相距最远？'],
        paint: [{ fill: { k: 'land', a2: CN, c: C.red }, a: 0.3 }],
        lines: [{ pts: [[53.55, 123.27], [3.97, 112.28]], c: C.gold, w: 1.4, dur: 2, t: 0.6 }, { pts: [[39.3, 73.55], [48.45, 135.08]], c: C.orange, w: 1.4, dur: 2, t: 2.2 }],
        marks: [mk([53.55, 123.27], 'North: Heilong River, north of Mohe (53°33′N)', '最北：漠河以北黑龙江主航道（53°33′N）', { dot: true, c: C.ice, t: 0.2 }), mk([3.97, 112.28], 'South: Zengmu Ansha (about 4°N)', '最南：曾母暗沙（约 4°N）', { dot: true, c: C.green, t: 1.2 }),
          mk([39.3, 73.55], 'West: Pamirs, Wuqia County (about 73°40′E)', '最西：帕米尔高原，乌恰县（约 73°40′E）', { dot: true, c: C.brown, t: 2 }), mk([48.45, 135.08], 'East: Heilong–Wusuli confluence (about 135°05′E)', '最东：黑龙江与乌苏里江汇合处（约 135°05′E）', { dot: true, c: C.orange, t: 2.8 })],
        body: ['China\'s northern tip is on the main channel of the Heilong River north of Mohe (53°33′N); its southern tip is Zengmu Ansha in the South China Sea, about 5,500 km away. From the Pamirs in Xinjiang (about 73°40′E) to where the Heilong and Wusuli rivers meet (about 135°05′E) is about 5,200 km and some 62° of longitude. The Earth turns 15° an hour, so sunrise over the Wusuli River comes about 4 hours before sunrise in the Pamirs. The whole country still keeps one clock, Beijing Time (UTC+8).',
          '我国最北端在漠河以北的黑龙江主航道中心线上（北纬 53°33′），最南端是南海的曾母暗沙，南北相距约 5500 千米。最西端在新疆帕米尔高原（约东经 73°40′），最东端在黑龙江与乌苏里江主航道中心线的相交处（约东经 135°05′），东西相距约 5200 千米，跨经度约 62°。地球每小时自转 15°，乌苏里江上旭日东升时，帕米尔高原上还是满天星斗，时间相差 4 小时以上。全国统一使用北京时间（东八区）。'],
      },
      {
        title: ['Neighbours on land and across the sea', '陆上邻国和隔海相望的国家'], cam: [34, 104, 5],
        task: ['Go round China\'s land border clockwise from North Korea: can you name all 14 land neighbours?', '从朝鲜开始沿陆地边界顺时针绕一圈：你能说出全部 14 个陆上邻国吗？'],
        paint: [{ fill: { k: 'land', a2: NEIGHBOURS, c: C.orange }, a: 0.42 }, { fill: { k: 'land', a2: CN, c: C.red }, a: 0.55, t: 0.4 }, { fill: { k: 'land', a2: ['KR', 'JP', 'PH', 'MY', 'BN', 'ID'], c: C.teal }, a: 0.38, t: 2.2 }],
        marks: [mk([40.2, 127], 'North Korea', '朝鲜', { c: C.orange, t: 0.6 }), mk([56, 110], 'Russia', '俄罗斯', { c: C.orange, t: 0.8 }), mk([46.5, 103], 'Mongolia', '蒙古', { c: C.orange, t: 1 }), mk([48, 70], 'Kazakhstan', '哈萨克斯坦', { c: C.orange, t: 1.2 }),
          mk([22, 79], 'India', '印度', { c: C.orange, t: 1.4 }), mk([21.5, 96], 'Myanmar', '缅甸', { c: C.orange, t: 1.6 }), mk([16.5, 106.5], 'Vietnam', '越南', { c: C.orange, t: 1.8 }),
          mk([36.5, 138], 'Japan', '日本', { c: C.teal, t: 2.4 }), mk([12.5, 122.5], 'Philippines', '菲律宾', { c: C.teal, t: 2.6 })],
        body: ['China\'s land border is over 22,000 km long, and it has 14 land neighbours: North Korea, Russia, Mongolia, Kazakhstan, Kyrgyzstan, Tajikistan, Afghanistan, Pakistan, India, Nepal, Bhutan, Myanmar, Laos and Vietnam. Across the sea lie six more: South Korea, Japan, the Philippines, Malaysia, Brunei and Indonesia. The mainland coastline is over 18,000 km long. So many neighbours make trade and exchange easy, but also mean China must keep many borders peaceful.',
          '我国陆地边界长 2 万多千米，与 14 个国家接壤：朝鲜、俄罗斯、蒙古、哈萨克斯坦、吉尔吉斯斯坦、塔吉克斯坦、阿富汗、巴基斯坦、印度、尼泊尔、不丹、缅甸、老挝、越南。隔海相望的国家有 6 个：韩国、日本、菲律宾、马来西亚、文莱和印度尼西亚。我国大陆海岸线长 1.8 万多千米。邻国众多，便于开展对外交流与合作，也需要维护边境的和平与稳定。'],
      },
      {
        title: ['Seas, straits and islands', '海域、海峡与岛屿'], cam: [24, 118, 4.2],
        task: ['Follow the coast from the Bohai Sea south to the South China Sea, then find the three straits.', '从渤海沿海岸向南到南海，再找出三个海峡。'],
        paint: [{ fill: { k: 'land', a2: CN, c: C.red }, a: 0.32 }],
        marks: [mk([38.9, 119.6], 'Bohai Sea (inland sea)', '渤海（内海）', { c: C.blue, t: 0.4 }), mk([35.5, 123.4], 'Yellow Sea', '黄海', { c: C.gold, t: 0.6 }), mk([29.2, 125.2], 'East China Sea', '东海', { c: C.teal, t: 0.8 }), mk([14.5, 114.5], 'South China Sea', '南海', { big: true, c: C.blue, t: 1 }),
          mk([38.25, 121.0], 'Bohai Strait', '渤海海峡', { c: C.white, t: 1.4 }), mk([24.4, 119.4], 'Taiwan Strait', '台湾海峡', { c: C.white, t: 1.6 }), mk([20.2, 110.2], 'Qiongzhou Strait', '琼州海峡', { c: C.white, t: 1.8 }),
          mk([23.7, 121.0], 'Taiwan Island', '台湾岛', { dot: true, c: C.red, t: 2.2 }), mk([19.2, 109.7], 'Hainan Island', '海南岛', { dot: true, c: C.red, t: 2.4 }), mk([31.6, 121.6], 'Chongming Island', '崇明岛', { dot: true, c: C.red, t: 2.6 }),
          mk([25.75, 123.47], 'Diaoyu Dao', '钓鱼岛', { dot: true, c: C.pink, t: 2.8 }), mk([20.7, 116.75], 'Dongsha Is.', '东沙群岛', { dot: true, c: C.pink, t: 3 }), mk([16.5, 112.0], 'Xisha Is.', '西沙群岛', { dot: true, c: C.pink, t: 3.1 }),
          mk([15.6, 114.6], 'Zhongsha Is.', '中沙群岛', { dot: true, c: C.pink, t: 3.2 }), mk([10.0, 114.2], 'Nansha Is.', '南沙群岛', { dot: true, c: C.pink, t: 3.3 })],
        body: ['From north to south China borders the Bohai, Yellow, East China and South China seas. The Bohai is almost enclosed by the Liaodong and Shandong peninsulas, so it is China\'s inland sea; the South China Sea is the largest and deepest. Three straits link them: the Bohai Strait, the Taiwan Strait and the Qiongzhou Strait. Taiwan Island (about 36,000 km² with its islets) is China\'s largest island, Hainan (about 34,000 km²) the second and Chongming, built of Yangtze mud, the third. Far out in the South China Sea lie the Dongsha, Xisha, Zhongsha and Nansha islands, and Diaoyu Dao belongs to Taiwan.',
          '我国濒临的海从北到南依次是渤海、黄海、东海和南海。渤海被辽东半岛和山东半岛环抱，是我国的内海；南海面积最大、最深。渤海海峡、台湾海峡、琼州海峡是重要的海上通道。台湾岛面积约 3.6 万平方千米（含附属岛屿），是我国第一大岛；海南岛约 3.4 万平方千米，是第二大岛；由长江泥沙冲积而成的崇明岛是第三大岛。南海中还有东沙、西沙、中沙、南沙群岛，钓鱼岛是台湾的附属岛屿。'],
      },
      {
        title: ['34 provincial-level divisions', '34 个省级行政区'], cam: [33, 106, 4.2],
        task: ['Find the four municipalities (gold), the five autonomous-region capitals (green) and the two SARs (pink).', '找出 4 个直辖市（金色）、5 个自治区的首府（绿色）和 2 个特别行政区（粉色）。'],
        paint: [{ fill: { k: 'land', a2: CN, c: C.white }, a: 0.16 }],
        lines: [lead([39.13, 117.2], [36.9, 122.4], 0.6, C.gold), lead([40.84, 111.75], [43.2, 106.6], 1.4, C.green), lead([22.3, 114.17], [20.6, 116.4], 2.6, C.pink), lead([22.19, 113.54], [20.6, 116.4], 2.6, C.pink)],
        marks: [mk([39.9, 116.4], 'Beijing (Jing) · capital', '北京（京）· 首都', { dot: true, c: C.red, big: true, t: 0.2 }), pin([39.13, 117.2], C.gold, 0.5), mk([36.9, 122.4], 'Tianjin (Jin)', '天津（津）', { c: C.gold, t: 0.7 }),
          mk([31.2, 121.47], 'Shanghai (Hu)', '上海（沪）', { dot: true, c: C.gold, t: 0.9 }), mk([29.56, 106.55], 'Chongqing (Yu)', '重庆（渝）', { dot: true, c: C.gold, t: 1.1 }),
          pin([40.84, 111.75], C.green, 1.4), mk([43.2, 106.6], 'Inner Mongolia · Hohhot', '内蒙古 · 呼和浩特', { c: C.green, t: 1.5 }), mk([43.83, 87.62], 'Xinjiang · Ürümqi', '新疆 · 乌鲁木齐', { dot: true, c: C.green, t: 1.6 }),
          mk([38.47, 106.27], 'Ningxia · Yinchuan', '宁夏 · 银川', { dot: true, c: C.green, t: 1.8 }), mk([29.65, 91.1], 'Xizang · Lhasa', '西藏 · 拉萨', { dot: true, c: C.green, t: 2 }), mk([22.82, 108.37], 'Guangxi · Nanning', '广西 · 南宁', { dot: true, c: C.green, t: 2.2 }),
          pin([22.3, 114.17], C.pink, 2.5), pin([22.19, 113.54], C.pink, 2.5), mk([20.6, 116.4], 'Hong Kong · Macao SARs', '香港 · 澳门特别行政区', { c: C.pink, t: 2.8 }), mk([25.03, 121.56], 'Taiwan · Taipei', '台湾 · 台北', { dot: true, c: C.white, t: 3 })],
        fig: { k: 'pie', title: ['The 34 provincial-level divisions', '34 个省级行政区'], parts: [
          { name: ['Provinces', '省'], v: 23, c: C.blue }, { name: ['Autonomous regions', '自治区'], v: 5, c: C.green }, { name: ['Municipalities', '直辖市'], v: 4, c: C.gold }, { name: ['Special administrative regions', '特别行政区'], v: 2, c: C.pink }] },
        body: ['China\'s administrative divisions have three basic levels: province, county and township. At the top there are 34 provincial-level divisions: 23 provinces, 5 autonomous regions, 4 municipalities directly under the central government (Beijing, Tianjin, Shanghai, Chongqing) and 2 special administrative regions (Hong Kong, Macao). Beijing is the capital. Xinjiang is the largest by area (about 1.66 million km²), Guangdong has the most people (about 127 million) and Macao is the smallest (about 33 km²).',
          '我国的行政区划基本上分为省级、县级和乡级三级。全国共有 34 个省级行政区，包括 23 个省、5 个自治区、4 个直辖市（北京、天津、上海、重庆）和 2 个特别行政区（香港、澳门）。北京是我国的首都。面积最大的省级行政区是新疆（约 166 万平方千米），人口最多的是广东（约 1.27 亿），面积最小的是澳门（约 33 平方千米）。'],
      },
      {
        title: ['Short names and where names come from', '简称与名称由来'], cam: [33, 113, 2.8], sketch: true,
        task: ['Find the Yellow River, Dongting Lake and the Taihang Mountains: which pairs of provinces are named after them?', '找到黄河、洞庭湖和太行山：哪几对省份的名称与它们有关？'],
        lines: [{ pts: YELLOW.slice(YR.tongguan), c: C.gold, w: 2, flow: true, arrow: true, dur: 1.6, t: 0.2 }, { pts: DONGTING, c: C.blue, w: 1.8, dur: 1, t: 1.2 }, { pts: TAIHANG, c: C.brown, w: 2.4, dur: 1.4, t: 2.2 }],
        marks: [mk([38.3, 115.6], 'Hebei (Ji): north of the river', '河北（冀）：黄河以北', { c: C.gold, t: 0.8 }), mk([33.7, 113.6], 'Henan (Yu): south of the river', '河南（豫）：黄河以南', { c: C.gold, t: 1 }),
          mk([31.1, 112.6], 'Hubei (E): north of the lake', '湖北（鄂）：洞庭湖以北', { c: C.blue, t: 1.6 }), mk([27.4, 111.8], 'Hunan (Xiang): south of the lake', '湖南（湘）：洞庭湖以南', { c: C.blue, t: 1.8 }),
          mk([36.3, 118.3], 'Shandong (Lu): east of the Taihang', '山东（鲁）：太行山以东', { c: C.brown, t: 2.6 }), mk([37.6, 112.0], 'Shanxi (Jin): west of the Taihang', '山西（晋）：太行山以西', { c: C.brown, t: 2.8 })],
        body: ['Many names describe the land. Henan and Hebei lie south and north of the Yellow River (he); Hunan and Hubei lie south and north of Dongting Lake (hu); Shandong and Shanxi lie east and west of the Taihang Mountains (shan). Short names often come from ancient states or rivers: Lu and Jin were states 2,500 years ago, Xiang is the main river of Hunan and Gan the main river of Jiangxi. On car number plates, the short name tells you where the car is registered.',
          '许多省级行政区的名称与自然地理有关：河南、河北分别位于黄河以南和以北；湖南、湖北分别位于洞庭湖以南和以北；山东、山西分别位于太行山以东和以西。简称多来自古代的国名或境内的河流，如山东简称“鲁”、山西简称“晋”源于春秋时的鲁国、晋国，湖南简称“湘”、江西简称“赣”源于湘江、赣江。汽车牌照上的第一个字就是省级行政区的简称。'],
      },
    ],
    quiz: [
      { q: ['China\'s land area is about…', '我国陆地面积约为'], options: [['9.6 million km²', '960 万平方千米'], ['3 million km²', '300 万平方千米'], ['17 million km²', '1700 万平方千米'], ['6 million km²', '600 万平方千米']], answer: 0,
        why: ['Third in the world, after Russia and Canada; the 3 million km² is China\'s sea area.', '居世界第三位，仅次于俄罗斯和加拿大；300 万平方千米是我国管辖海域的面积。'] },
      { q: ['China spans about 62° of longitude. The Earth turns 15° an hour. About how many hours apart are sunrise at its eastern and western ends?', '我国东西跨经度约 62°，地球每小时自转 15°。我国最东端和最西端日出时间约相差几小时？'], num: { answer: 4.1, tol: 0.3, unit: ['hours', '小时'] },
        why: ['62 ÷ 15 ≈ 4.1 hours: the Sun rises over the Wusuli River about four hours before it rises over the Pamirs.', '62 ÷ 15 ≈ 4.1 小时：乌苏里江上日出后约 4 小时，帕米尔高原才迎来日出。'] },
      { q: ['Put China\'s seas in order from north to south.', '把我国濒临的海按从北到南的顺序排列。'], order: [['Bohai Sea', '渤海'], ['Yellow Sea', '黄海'], ['East China Sea', '东海'], ['South China Sea', '南海']],
        why: ['The Bohai is the inland sea in the north; the South China Sea is the southernmost, largest and deepest.', '渤海是北部的内海；南海位置最南，面积最大，也最深。'] },
      { q: ['Label China\'s three main straits.', '在地球上标出我国的三个主要海峡。'],
        place: [{ text: ['Bohai Strait', '渤海海峡'], at: [38.25, 121.0], tolKm: 250 }, { text: ['Taiwan Strait', '台湾海峡'], at: [24.4, 119.4], tolKm: 300 }, { text: ['Qiongzhou Strait', '琼州海峡'], at: [20.2, 110.2], tolKm: 250 }],
        why: ['The Bohai Strait joins the Bohai and Yellow seas; the Taiwan Strait lies between Fujian and Taiwan; the Qiongzhou Strait separates the Leizhou Peninsula from Hainan.', '渤海海峡连接渤海与黄海；台湾海峡在福建与台湾之间；琼州海峡隔开雷州半岛和海南岛。'] },
      { q: ['Match each province to its short name.', '把省级行政区和它的简称连起来。'],
        match: [[['Hunan', '湖南省'], ['Xiang', '湘']], [['Shanxi', '山西省'], ['Jin', '晋']], [['Guangdong', '广东省'], ['Yue', '粤']], [['Henan', '河南省'], ['Yu', '豫']], [['Guizhou', '贵州省'], ['Qian or Gui', '黔或贵']]],
        why: ['Xiang comes from the Xiang River and Jin from the ancient state of Jin; Yue, Yu and Qian are old names for those lands.', '“湘”来自湘江，“晋”来自古代晋国；“粤”“豫”“黔”都是这些地区古老的名称。'] },
      { q: ['Find China\'s easternmost point.', '在地球上点出我国领土的最东端。'], at: [48.45, 135.08], tolKm: 350,
        why: ['Where the main channels of the Heilong and Wusuli rivers meet, near 135°05′E.', '在黑龙江与乌苏里江主航道中心线的相交处，约东经 135°05′。'] },
      { q: ['Which of these are China\'s land neighbours? Pick all that apply.', '下列国家中，与我国陆上接壤的有（多选）'],
        options: [['Russia', '俄罗斯'], ['Vietnam', '越南'], ['Japan', '日本'], ['Kazakhstan', '哈萨克斯坦'], ['The Philippines', '菲律宾'], ['Nepal', '尼泊尔']], multi: [0, 1, 3, 5],
        why: ['Japan and the Philippines face China across the sea; Russia, Vietnam, Kazakhstan and Nepal share a land border.', '日本、菲律宾与我国隔海相望；俄罗斯、越南、哈萨克斯坦、尼泊尔与我国陆上接壤。'] },
      { q: ['The middle and lower Yangtze lies at the same latitude as the Arabian Desert, yet it is green and wet. What is the main reason?', '长江中下游与阿拉伯沙漠纬度相近，却湿润青绿。主要原因是'],
        options: [['China lies on the east coast of Asia, so the summer monsoon brings rain from the ocean', '我国位于亚洲东部、太平洋西岸，夏季风从海洋带来降水'], ['The Yangtze valley is higher above sea level', '长江流域海拔更高'], ['It is closer to the Equator', '更靠近赤道'], ['The Yangtze valley gets more sunshine', '长江流域日照更多']], answer: 0,
        why: ['Its sea–land position matters more than latitude here: between the biggest continent and the biggest ocean, China gets strong monsoon rain in summer.', '这里起主要作用的是海陆位置而不是纬度：我国位于最大的大陆和最大的大洋之间，夏季风带来丰沛降水。'] },
    ],
  },
  {
    id: 'china-people', strand: 'china', tracks: ['uk', 'us'], grade: 'g8a', unit: land, icon: 'user', minutes: 10,
    title: ['Population and ethnic groups', '人口与民族'],
    blurb: ['1.41 billion people, an ageing population, a crowded east and a sparse west, and 56 ethnic groups.', '14.1 亿人口、老龄化、东密西疏的人口分布，以及 56 个民族组成的大家庭。'],
    keys: [
      ['China has about 1.41 billion people (2023); births now fall short of deaths and the population is ageing fast.', '我国人口约 14.1 亿（2023 年）；出生人口已少于死亡人口，人口老龄化加快。'],
      ['The average density is about 147 people per km², but very uneven.', '我国平均人口密度约每平方千米 147 人，分布很不均匀。'],
      ['The Heihe–Tengchong line splits a crowded southeast (about 94% of people) from a sparse northwest, following climate and terrain.', '黑河—腾冲一线东南人口稠密（约占 94%），西北稀疏，这与气候、地形密切相关。'],
      ['About two-thirds of people now live in towns and cities; hundreds of millions have moved for work.', '我国城镇人口已约占三分之二，数以亿计的人口为就业而流动。'],
      ['There are 56 ethnic groups, "large mixed, small concentrated", with regional ethnic autonomy where minorities live together.', '我国有 56 个民族，分布“大杂居、小聚居”，在少数民族聚居的地方实行民族区域自治。'],
    ],
    steps: [
      {
        title: ['A huge population', '人口众多'], cam: [33, 106, 4],
        paint: [{ fill: { k: 'land', a2: CN, c: C.red }, a: 0.5 }],
        marks: [mk([34, 104], 'About 1.41 billion people (2023)', '约 14.1 亿人（2023 年）', { big: true, c: C.gold, t: 0.6 }), mk([22, 79], 'India: the most populous since 2023', '印度：2023 年起人口居世界第一', { c: C.orange, t: 1.6 })],
        fig: { k: 'line', title: ['China\'s population (approx.)', '我国人口（约）'], unit: ['100 million people', '亿人'], x: [1949, 1964, 1982, 1990, 2000, 2010, 2023], min: 0, max: 16,
          series: [{ name: ['Population', '人口'], c: C.gold, y: [5.42, 6.95, 10.08, 11.43, 12.67, 13.41, 14.10] }], notes: [{ x: 1982, text: ['Family planning a basic policy', '计划生育成为基本国策'] }] },
        body: ['At the end of 2023, China had about 1.41 billion people, roughly one person in every six on Earth. The population grew from about 540 million in 1949 to over a billion by 1982. Because the base is so large, even slow growth once added more than 10 million people a year. In 2022 the population fell for the first time in sixty years, and in 2023 India became the world\'s most populous country.',
          '2023 年末，我国人口约 14.1 亿，约占世界人口的六分之一。我国人口从 1949 年的约 5.4 亿增长到 1982 年的 10 亿以上。由于人口基数大，即使增长率不高，过去每年也会净增 1000 多万人。2022 年，我国人口出现六十多年来的首次负增长；2023 年，印度人口超过我国，居世界第一。'],
      },
      {
        title: ['Births, deaths and policy', '人口增长与人口政策'], cam: [33, 106, 4],
        paint: [{ fill: { k: 'land', a2: CN, c: C.violet }, a: 0.35 }],
        marks: [mk([36, 112], 'Births 2023: 9.02 million', '2023 年出生：902 万人', { c: C.green, t: 0.6 }), mk([31, 104], 'Deaths 2023: 11.10 million', '2023 年死亡：1110 万人', { c: C.red, t: 1.2 })],
        fig: { k: 'line', title: ['Births and deaths a year (approx.)', '每年出生与死亡人口（约）'], unit: ['million', '百万人'], x: [2000, 2010, 2016, 2019, 2021, 2022, 2023], min: 0, max: 20,
          series: [{ name: ['Births', '出生'], c: C.green, y: [17.71, 15.92, 17.86, 14.65, 10.62, 9.56, 9.02] }, { name: ['Deaths', '死亡'], c: C.red, y: [8.14, 9.51, 9.77, 9.98, 10.14, 10.41, 11.10] }],
          notes: [{ x: 2016, text: ['Two-child policy', '全面二孩'] }, { x: 2021, text: ['Three-child policy', '三孩政策'] }] },
        body: ['Natural growth is the birth rate minus the death rate. In 2023 the birth rate was 6.39‰ and the death rate 7.87‰, so natural growth was −1.48‰. Family planning, a basic national policy from 1982, slowed the fast growth of earlier decades. As births kept falling, China allowed two children per couple in 2016 and three in 2021, and now offers childcare subsidies and longer parental leave. Policy follows the population: first slowing growth, now supporting births.',
          '人口自然增长率等于出生率减去死亡率。2023 年我国出生率为 6.39‰，死亡率为 7.87‰，自然增长率为 −1.48‰。1982 年计划生育被确定为基本国策，有效控制了过快的人口增长。随着出生人口持续减少，国家 2016 年实施全面二孩政策，2021 年实施三孩政策，并出台育儿补贴、延长育儿假等配套措施。人口政策随人口形势变化而调整。'],
      },
      {
        title: ['Getting older', '人口老龄化'], cam: [36, 108, 4],
        paint: [{ fill: { k: 'land', a2: CN, c: C.violet }, a: 0.3 }, { fill: { k: 'land', a2: ['JP'], c: C.pink }, a: 0.35, t: 1.4 }],
        marks: [mk([41.8, 123.4], 'Liaoning: 17% aged 65+ (2020), the oldest', '辽宁：65 岁以上约占 17%（2020 年），全国最高', { dot: true, c: C.violet, t: 0.6 }), mk([30.5, 89], 'Xizang: under 6% aged 65+, the youngest', '西藏：65 岁以上不足 6%，全国最低', { dot: true, c: C.green, t: 1 }),
          mk([36.5, 139.5], 'Japan: about 29% aged 65+', '日本：65 岁以上约占 29%', { c: C.pink, t: 1.6 })],
        fig: { k: 'pyramid', a: 'china', b: 'japan' },
        body: ['At the end of 2023, 297 million Chinese (21.1%) were aged 60 or over and 217 million (15.4%) were 65 or over. China\'s pyramid is now narrow at the bottom and wide in the middle; as the big middle-aged groups grow old, it will look more like Japan\'s. Fewer young workers will support more pensioners, and demand for care and health services rises. From 2025 the retirement age is being raised step by step, and cities are building community elderly care.',
          '2023 年末，我国 60 岁及以上人口约 2.97 亿，占 21.1%；65 岁及以上人口约 2.17 亿，占 15.4%。我国人口金字塔底部收窄、中部宽大，随着中年人口步入老年，形状将越来越像日本。劳动年龄人口减少，养老负担加重，对养老和医疗服务的需求增加。我国从 2025 年起逐步延迟法定退休年龄，并大力发展社区居家养老服务。'],
      },
      {
        title: ['Crowded east, empty west: the Hu line', '东密西疏：胡焕庸线'], cam: [36, 108, 4],
        task: ['Find Heihe in the north-east and Tengchong in the south-west, then compare how crowded the two sides of the line are.', '找到东北的黑河和西南的腾冲，比较这条线两侧人口的疏密。'],
        paint: [{ fill: { k: 'poly', pts: HU_EAST, c: C.orange, clip: CN }, a: 0.45, t: 2 }],
        lines: [{ pts: HU_LINE, c: C.gold, w: 2, dur: 2.4 }],
        marks: [mk([50.25, 127.5], 'Heihe', '黑河', { dot: true, c: C.gold, t: 0.2 }), mk([25.02, 98.5], 'Tengchong', '腾冲', { dot: true, c: C.gold, t: 2.2 }), mk([31, 114], 'Southeast: about 94% of people on 44% of the land', '东南部：约 44% 的面积，约 94% 的人口', { c: C.orange, t: 2.6 }),
          mk([39, 88], 'Northwest: about 6% of people on 56% of the land', '西北部：约 56% 的面积，约 6% 的人口', { c: C.ice, t: 3 })],
        fig: { k: 'pie', title: ['Share of China\'s people (approx.)', '人口分布（约）'], parts: [{ name: ['Southeast of the line', '线东南'], v: 94, c: C.orange }, { name: ['Northwest of the line', '线西北'], v: 6, c: C.ice }] },
        body: ['In 1935 the geographer Hu Huanyong drew a line on the map from Heihe in Heilongjiang to Tengchong in Yunnan. Southeast of it, on about 44% of the land, live about 94% of the people; northwest of it, the land is vast but people are few. Nearly 90 years later, with roughly three times as many people, the split has barely moved. In short, China\'s population is dense in the east and south and sparse in the west and north.',
          '1935 年，地理学家胡焕庸在地图上画出一条从黑龙江黑河到云南腾冲的直线。这条线东南部的面积约占全国的 44%，人口却约占 94%；西北部地域辽阔，人口稀少。近 90 年过去，我国人口增加了好几倍，这条分界线两侧的人口比例却几乎没有变化。我国人口分布的总特点是东多西少、东南稠密、西北稀疏。'],
      },
      {
        title: ['Why the line is there', '人口分布为什么东密西疏'], cam: [36, 106, 4], sketch: true,
        task: ['Compare the Hu line (gold) with the 400 mm rainfall line (blue): how close are they?', '比较胡焕庸线（金色）和 400 毫米年等降水量线（蓝色）：两条线有多接近？'],
        paint: [{ fill: { k: 'land', a2: CN, c: C.white }, a: 0.12 }],
        lines: [{ pts: HU_LINE, c: C.gold, w: 1.8, dur: 1.6 }, { pts: FARM_PASTURE, c: C.blue, w: 1.8, dur: 2.2, t: 1 }],
        marks: [mk([31.2, 121.47], 'Shanghai ≈ 3,900 per km²', '上海 ≈ 3900 人/平方千米', { dot: true, c: C.orange, t: 2 }), mk([32.5, 119], 'Jiangsu 795', '江苏 795', { c: C.orange, t: 2.2 }), mk([23.5, 113.5], 'Guangdong 707', '广东 707', { c: C.orange, t: 2.4 }),
          mk([35.5, 96], 'Qinghai 8', '青海 8', { c: C.ice, t: 2.6 }), mk([31.5, 87], 'Xizang 3', '西藏 3', { c: C.ice, t: 2.8 }), mk([45.5, 92], '400 mm line', '400 毫米等降水量线', { c: C.blue, t: 3 })],
        fig: { k: 'bars', title: ['People per km², 2023 (approx.)', '人口密度，2023 年（约）'], unit: ['people per km²', '人/平方千米'], rows: [
          { name: ['Jiangsu', '江苏'], v: 795, c: C.orange }, { name: ['Guangdong', '广东'], v: 707, c: C.orange }, { name: ['Henan', '河南'], v: 588, c: C.orange }, { name: ['China', '全国'], v: 147, c: C.gold },
          { name: ['World', '世界'], v: 60, c: C.white }, { name: ['Qinghai', '青海'], v: 8, c: C.ice }, { name: ['Xizang', '西藏'], v: 3, c: C.ice }] },
        body: ['China\'s average density is about 147 people per km² (1.41 billion ÷ 9.6 million km²), more than twice the world average, but the average hides huge differences. The Hu line runs close to the 400 mm rainfall line and the edge of the high western plateaus. To the southeast, monsoon rain, warmth, plains and long farming history feed many people, and cities, industry and jobs grew there. To the northwest, deserts, high mountains and cold, dry climates support few. So natural conditions set the pattern and the economy reinforced it.',
          '我国平均人口密度约为每平方千米 147 人（14.1 亿 ÷ 960 万平方千米），是世界平均水平的两倍多，但各地差别极大。胡焕庸线与 400 毫米年等降水量线以及西部高原的边缘大体一致。东南部受季风影响，降水丰沛、热量充足，平原广阔，农耕历史悠久，能养活众多人口，城市、工业和就业机会也集中在这里；西北部多沙漠、高山，气候干旱或高寒，人口稀少。自然条件奠定了人口分布的格局，经济发展又强化了它。'],
      },
      {
        title: ['Moving to towns and cities', '城镇化与人口迁移'], cam: [31, 113, 3.2],
        task: ['Follow the arrows: from which provinces do many workers move, and to which city regions?', '沿箭头看：许多务工人员从哪些省份流出，流向哪些城市群？'],
        paint: [{ fill: { k: 'poly', pts: YRD, c: C.orange, clip: CN }, a: 0.6 }, { fill: { k: 'poly', pts: PRD, c: C.orange, clip: CN }, a: 0.6 }],
        lines: [...arrows([[[33.8, 113.6], [28, 113.5], [23.6, 113.4]], [[30.5, 104.5], [27.5, 109], [23.5, 112.8]], [[31.8, 117.2], [31.4, 119.6]], [[33.8, 113.6], [34.5, 117.5], [31.8, 120.3]], [[28.2, 112.9], [25.2, 113.2], [23.6, 113.4]], [[36.5, 114.6], [39.2, 116.2]]], C.gold, 0.6, 1.8)],
        marks: [mk([33.8, 113.6], 'Henan', '河南', { c: C.white, t: 0.4 }), mk([30.5, 104.5], 'Sichuan', '四川', { c: C.white, t: 0.5 }), mk([28.2, 112.9], 'Hunan', '湖南', { c: C.white, t: 0.6 }), mk([31.9, 117.0], 'Anhui', '安徽', { c: C.white, t: 0.7 }),
          mk([22.6, 114.4], 'Pearl River Delta', '珠江三角洲', { dot: true, c: C.orange, t: 2 }), mk([31.2, 121.47], 'Yangtze River Delta', '长江三角洲', { dot: true, c: C.orange, t: 2.2 }), mk([39.9, 116.4], 'Beijing–Tianjin', '京津', { dot: true, c: C.orange, t: 2.4 })],
        fig: { k: 'line', title: ['Share of people living in towns (urbanisation)', '城镇人口比重（城镇化率）'], unit: ['%', '%'], x: [1949, 1978, 1990, 2000, 2010, 2023], min: 0, max: 100,
          series: [{ name: ['Urban share', '城镇化率'], c: C.orange, y: [10.6, 17.9, 26.4, 36.2, 49.9, 66.2] }], notes: [{ x: 1978, text: ['Reform and opening-up', '改革开放'] }] },
        body: ['In 1978 fewer than one Chinese in five lived in a town; by 2023 the share was 66.2%. Since reform and opening-up, factories and services along the coast drew workers from farming provinces such as Henan, Sichuan, Anhui and Hunan. The 2020 census counted about 376 million people living away from their registered home. Many now find work closer to home, in fast-growing inland cities such as Chengdu, Chongqing, Wuhan and Zhengzhou.',
          '1978 年，我国城镇人口还不到总人口的五分之一；到 2023 年，城镇化率已达 66.2%。改革开放以来，东部沿海的工厂和服务业吸引了河南、四川、安徽、湖南等农业大省的大量劳动力。2020 年第七次人口普查时，我国流动人口约 3.76 亿。现在，越来越多的人选择在离家较近的中西部城市就业，如成都、重庆、武汉、郑州等。'],
      },
      {
        title: ['56 ethnic groups', '56 个民族'], cam: [33, 104, 4], items: ['potala', 'fs_springfestival'],
        paint: [{ fill: { k: 'land', a2: CN, c: C.gold }, a: 0.3 }],
        marks: [mk([22.0, 100.8], 'Dai: Water-Splashing Festival', '傣族：泼水节', { dot: true, c: C.teal, t: 0.6 }), mk([27.9, 102.27], 'Yi: Torch Festival', '彝族：火把节', { dot: true, c: C.orange, t: 0.9 }),
          mk([43.9, 116.1], 'Mongol: Naadam', '蒙古族：那达慕大会', { dot: true, c: C.lime, t: 1.2 }), mk([29.65, 91.1], 'Zang: Tibetan New Year', '藏族：藏历年', { dot: true, c: C.violet, t: 1.5 }), mk([39.47, 75.99], 'Uygur: Corban Festival', '维吾尔族：古尔邦节', { dot: true, c: C.gold, t: 1.8 })],
        fig: { k: 'pie', title: ['Ethnic groups, 2020 census (approx.)', '民族构成，2020 年人口普查（约）'], parts: [{ name: ['Han', '汉族'], v: 91.1, c: C.red }, { name: ['55 minority groups', '55 个少数民族'], v: 8.9, c: C.gold }] },
        body: ['China is a united country of 56 ethnic groups. In the 2020 census the Han made up 91.1% of the people; the 55 other groups together numbered about 125 million. Each has its own festivals, dress, food, music and often language: the Dai splash water to welcome the new year, the Yi light torches in summer and Mongols race horses at the Naadam. All groups are equal and together form the Chinese nation.',
          '我国是一个统一的多民族国家，共有 56 个民族。2020 年人口普查时，汉族人口占 91.1%，55 个少数民族人口合计约 1.25 亿。各民族都有自己的节日、服饰、饮食、歌舞，许多民族还有自己的语言：傣族泼水节、彝族火把节、蒙古族那达慕大会、藏族藏历年、维吾尔族古尔邦节等都很有名。各民族一律平等，共同组成中华民族大家庭。'],
      },
      {
        title: ['Where groups live', '民族的分布与民族区域自治'], cam: [36, 104, 4.2], sketch: true,
        task: ['Turn the globe from Guangxi round to Xinjiang and the Northeast: where does each group mainly live?', '从广西转到新疆再到东北：每个标出的少数民族主要分布在哪里？'],
        paint: [{ fill: { k: 'land', a2: CN, c: C.white }, a: 0.15 }],
        marks: [mk([23.5, 108.3], 'Zhuang · Guangxi', '壮族 · 广西', { dot: true, c: C.gold, t: 0.3 }), mk([41.5, 85], 'Uygur · Xinjiang', '维吾尔族 · 新疆', { dot: true, c: C.gold, t: 0.6 }), mk([37.3, 106.2], 'Hui · Ningxia', '回族 · 宁夏', { dot: true, c: C.gold, t: 0.9 }),
          mk([43.5, 113], 'Mongol · Inner Mongolia', '蒙古族 · 内蒙古', { dot: true, c: C.gold, t: 1.2 }), mk([31, 88], 'Zang · Xizang', '藏族 · 西藏', { dot: true, c: C.gold, t: 1.5 }), mk([42.9, 129.5], 'Korean · Yanbian, Jilin', '朝鲜族 · 吉林延边', { dot: true, c: C.gold, t: 1.8 }),
          mk([26.6, 107.9], 'Miao · Guizhou', '苗族 · 贵州', { dot: true, c: C.gold, t: 2.1 }), mk([25.0, 101.5], 'Yunnan: 25 minority groups', '云南：25 个世居少数民族', { c: C.lime, t: 2.4 })],
        fig: { k: 'bars', title: ['Largest minorities, 2020 census', '人口较多的少数民族，2020 年'], unit: ['million people', '百万人'], rows: [
          { name: ['Zhuang', '壮族'], v: 19.6, c: C.gold }, { name: ['Uygur', '维吾尔族'], v: 11.8 }, { name: ['Hui', '回族'], v: 11.4 }, { name: ['Miao', '苗族'], v: 11.1 }, { name: ['Manchu', '满族'], v: 10.4 }] },
        body: ['The Han live all over China, mostly in the east and centre; minorities live mainly in the southwest, northwest and northeast, and Yunnan has the most groups. Groups are mixed across the country yet also gather in their own communities: "large mixed, small concentrated". Where minorities live together, China practises regional ethnic autonomy: there are 155 autonomous areas, namely 5 autonomous regions, 30 autonomous prefectures and 120 autonomous counties or banners. The Zhuang, about 19.6 million, are the largest minority.',
          '汉族分布遍及全国，主要集中在东部和中部；少数民族主要分布在西南、西北和东北地区，云南省是我国民族最多的省。各民族交错杂居，又相对集中地聚居，形成“大杂居、小聚居”的分布特点。在少数民族聚居的地方，我国实行民族区域自治，全国共有 155 个民族自治地方，包括 5 个自治区、30 个自治州和 120 个自治县（旗）。壮族约 1960 万人，是我国人口最多的少数民族。'],
      },
    ],
    quiz: [
      { q: ['Label the two ends of the Hu Huanyong line.', '在地球上标出胡焕庸线的两端。'],
        place: [{ text: ['Heihe', '黑河'], at: [50.25, 127.5], tolKm: 350 }, { text: ['Tengchong', '腾冲'], at: [25.02, 98.5], tolKm: 350 }],
        why: ['Heihe is on the Heilong River in Heilongjiang; Tengchong is in western Yunnan, near Myanmar.', '黑河在黑龙江省的黑龙江畔；腾冲在云南省西部，靠近缅甸。'] },
      { q: ['China had about 1,410 million people on about 9.6 million km² of land. About how many people is that per km²?', '我国约有 14.1 亿人，陆地面积约 960 万平方千米。平均每平方千米约有多少人？'], num: { answer: 147, tol: 6, unit: ['people per km²', '人/平方千米'] },
        why: ['1,410 ÷ 9.6 ≈ 147 people per km², more than twice the world average of about 60.', '14.1 亿 ÷ 960 万 ≈ 147 人/平方千米，是世界平均水平（约 60 人）的两倍多。'] },
      { q: ['Compare China\'s pyramid with Japan\'s. What does China\'s narrow base and wide middle tell you?', '比较我国和日本的人口金字塔。我国金字塔底部窄、中部宽，说明了什么？'], fig: { k: 'pyramid', a: 'china', b: 'japan' },
        options: [['Fewer children are born, and the large middle-aged groups will soon make the population older', '出生人口减少，庞大的中年人口将使老龄化加快'], ['The population is very young and growing fast', '人口很年轻，增长很快'], ['Most people die young', '大多数人寿命很短'], ['China is already older than Japan', '我国老龄化程度已超过日本']], answer: 0,
        why: ['A narrow base means falling births; the bulge in the middle moves up as people age, so China is heading towards a shape like Japan\'s.', '底部收窄说明出生人口减少；中部的“凸起”随时间上移，我国人口结构正向日本那样的形状发展。'] },
      { q: ['Put these population policies in time order.', '把下列人口政策按时间先后排序。'],
        order: [['Family planning becomes a basic national policy', '计划生育成为基本国策'], ['Two-child policy for all couples', '全面二孩政策'], ['Three-child policy', '三孩政策'], ['Retirement age raised step by step', '逐步延迟法定退休年龄']],
        why: ['1982, 2016, 2021 and from 2025: policy moved from slowing growth to supporting births and coping with ageing.', '1982 年、2016 年、2021 年、2025 年起：政策从控制人口过快增长转向鼓励生育、应对老龄化。'] },
      { q: ['Match each ethnic group to the autonomous region where many of its people live.', '把民族和它主要聚居的自治区连起来。'],
        match: [[['Zhuang', '壮族'], ['Guangxi', '广西壮族自治区']], [['Uygur', '维吾尔族'], ['Xinjiang', '新疆维吾尔自治区']], [['Hui', '回族'], ['Ningxia', '宁夏回族自治区']], [['Mongol', '蒙古族'], ['Inner Mongolia', '内蒙古自治区']], [['Zang (Tibetan)', '藏族'], ['Xizang', '西藏自治区']]],
        why: ['Each of the five autonomous regions is named after a main group living there, although many groups live mixed together.', '我国五个自治区都以当地主要聚居的少数民族命名；同时，各民族又交错杂居。'] },
      { q: ['Which measures help China cope with an ageing population? Pick all that apply.', '下列措施中，有利于应对人口老龄化的有（多选）'],
        options: [['Raising the retirement age step by step', '逐步延迟法定退休年龄'], ['Building community and home elderly care', '发展社区居家养老服务'], ['Childcare subsidies and longer parental leave', '发放育儿补贴、延长育儿假'], ['Stopping people from moving to cities', '禁止人口进城'], ['Closing kindergartens', '关闭幼儿园']], multi: [0, 1, 2],
        why: ['Working longer, caring for the old and making it easier to raise children all help; stopping migration or closing kindergartens would not.', '延迟退休、发展养老服务、支持家庭养育子女都有帮助；禁止人口流动、关闭幼儿园无助于解决问题。'] },
      { q: ['"Large mixed, small concentrated" describes…', '“大杂居、小聚居”描述的是'], options: [['How China\'s ethnic groups are distributed', '我国民族的分布特点'], ['How China\'s cities grew', '我国城市的发展特点'], ['China\'s terrain', '我国的地势特点'], ['Where China\'s rivers flow', '我国河流的流向']], answer: 0,
        why: ['Groups are mixed across the whole country but also have communities of their own, which is why there are autonomous regions, prefectures and counties.', '各民族交错杂居，又各自相对聚居，因此设立了自治区、自治州、自治县。'] },
      { q: ['China\'s population has risen several times since 1935, yet the Hu line still divides it in nearly the same proportions. What best explains this?', '1935 年以来我国人口增长了好几倍，但胡焕庸线两侧的人口比例几乎不变。最能解释这一现象的是'],
        options: [['Climate and terrain: the northwest is too dry, cold or high to feed many people', '气候和地形：西北部干旱、高寒，难以承载大量人口'], ['People in the northwest are not allowed to have children', '西北部不允许生育'], ['The line follows a provincial border', '这条线是省界'], ['The northwest has no cities at all', '西北部完全没有城市']], answer: 0,
        why: ['The line runs close to the 400 mm rainfall line and the edge of the high plateaus; water and warmth limit how many people the land can support.', '这条线与 400 毫米年等降水量线和西部高原边缘大体一致，水分和热量条件限制了土地能承载的人口。'] },
    ],
  },
  {
    id: 'china-water', strand: 'china', tracks: ['uk', 'ib'], grade: 'g8a', unit: ['China\'s natural resources', '中国的自然资源'], icon: 'leaf', minutes: 10,
    title: ['Land and water resources', '土地资源与水资源'],
    blurb: ['Rich in total but poor per person; farmland to guard; water uneven in place and time, moved south to north.', '总量丰富、人均不足；守住耕地红线；水资源时空分布不均与南水北调。'],
    keys: [
      ['China\'s resources are large in total but small per person.', '我国自然资源总量丰富，人均占有量少。'],
      ['Farmland is mainly in the humid east; grassland mainly in the dry west; forests in the Northeast and Southwest.', '耕地主要分布在东部湿润、半湿润区，草地主要分布在西部干旱、半干旱区，林地主要分布在东北和西南。'],
      ['China protects at least 1.8 billion mu (120 million ha) of farmland: the "red line".', '我国坚守 18 亿亩耕地红线。'],
      ['Water: more in the south than the north, more in summer than winter, and very variable from year to year.', '水资源南多北少，夏秋多、冬春少，年际变化大。'],
      ['Reservoirs and the South–North Water Diversion even it out; saving and reusing water matters just as much.', '修建水库、跨流域调水能缓解缺水，节约用水、防治污染同样重要。'],
    ],
    steps: [
      {
        title: ['Rich in total, poor per person', '总量丰富，人均不足'], cam: [33, 105, 3.8],
        paint: [{ fill: { k: 'land', a2: CN, c: C.green }, a: 0.4 }],
        marks: [mk([34, 104], 'Water: about 2.8 trillion m³ a year, 6th in the world', '水资源总量约 2.8 万亿立方米，居世界第六位', { c: C.blue, t: 0.6 }), mk([30, 112], 'But about 2,000 m³ per person', '但人均仅约 2000 立方米', { c: C.ice, t: 1.4 })],
        fig: { k: 'bars', title: ['Per person, as % of world average (approx.)', '人均占有量为世界人均的百分比（约）'], unit: ['%', '%'], rows: [
          { name: ['World average', '世界人均'], v: 100, c: C.white }, { name: ['Farmland', '耕地'], v: 45, c: C.lime }, { name: ['Water', '水资源'], v: 30, c: C.blue }, { name: ['Forest', '森林'], v: 30, c: C.green }] },
        body: ['China has a lot of land, water, forests and minerals; in total, many rank among the top in the world. Its rivers and groundwater renew about 2.8 trillion m³ of water a year, sixth in the world. Shared among 1.41 billion people, though, that is only about 2,000 m³ each, roughly a quarter to a third of the world average, and farmland per person is less than half the average. So we must use resources wisely, save them and protect them.',
          '我国自然资源总量丰富，土地、水、森林、矿产等许多资源的总量居世界前列。我国多年平均水资源总量约 2.8 万亿立方米，居世界第六位。但我国人口约 14.1 亿，人均水资源量只有约 2000 立方米，仅为世界人均水平的四分之一到三分之一；人均耕地也不到世界人均的一半。因此必须合理利用、节约和保护自然资源。'],
      },
      {
        title: ['How the land is used', '土地利用类型多样'], cam: [35, 104, 4],
        paint: [{ fill: { k: 'land', a2: CN, c: C.lime }, a: 0.25 }],
        marks: [mk([33, 114], 'Farmland 13%', '耕地 13%', { c: C.lime, t: 0.6 }), mk([47, 126], 'Forest 30%', '林地 30%', { c: C.green, t: 0.9 }), mk([40, 100], 'Hard to use: desert, Gobi, bare rock, ice', '难利用土地：沙漠、戈壁、裸岩、冰川', { c: C.brown, t: 1.4 })],
        fig: { k: 'pie', title: ['Land use, Third National Land Survey 2019 (approx. %)', '土地利用构成，第三次全国国土调查（2019 年，约 %）'], parts: [
          { name: ['Forest', '林地'], v: 29.6, c: C.green }, { name: ['Grassland', '草地'], v: 27.6, c: C.gold }, { name: ['Farmland', '耕地'], v: 13.3, c: C.lime }, { name: ['Water and wetland', '水域与湿地'], v: 6.2, c: C.blue },
          { name: ['Built-up and roads', '建设与交通用地'], v: 4.7, c: C.red }, { name: ['Orchards', '园地'], v: 2.1, c: C.pink }, { name: ['Other (desert, rock…)', '其他（沙漠、裸岩等）'], v: 16.5, c: C.brown }] },
        body: ['China\'s land has every kind of use: farmland, forest, grassland, water, towns and roads. The Third National Land Survey (2019) found about 30% forest, 28% grassland and only about 13% farmland. Almost a fifth is hard to use at all: desert, Gobi, bare rock and glaciers, mostly in the dry and high west. Mountains and plateaus also make large areas hard to farm, so good flat farmland is scarce.',
          '我国土地利用类型齐全，耕地、林地、草地、水域、建设用地等都有。第三次全国国土调查（2019 年）显示，林地约占 30%，草地约占 28%，耕地只约占 13%。沙漠、戈壁、裸岩、冰川等难利用土地将近五分之一，主要分布在干旱和高寒的西部。我国山地多、平地少，适宜耕作的平坦土地十分有限。'],
      },
      {
        title: ['Where farmland, grass and forest are', '土地资源的分布'], cam: [36, 105, 3.6], sketch: true,
        task: ['Find the four great pastoral areas and the two main forest areas on the globe.', '在地球上找出四大牧区和两大林区。'],
        paint: [{ fill: { k: 'poly', pts: [[48, 124], [48, 134], [30, 123], [22, 116], [22, 108], [28, 104], [34, 104], [40, 113], [44, 122]], c: C.lime, clip: CN }, a: 0.5 },
          { fill: { k: 'poly', pts: [[44, 106], [50, 116], [53.5, 121], [47, 122], [42, 117], [41, 112], [38, 106], [36, 103], [36, 80], [42, 74], [48, 82], [45, 95]], c: C.gold, clip: CN }, a: 0.45, t: 1 },
          { fill: { k: 'poly', pts: REGIONS.tibet, c: C.gold, clip: CN }, a: 0.3, t: 1 },
          { fill: { k: 'poly', pts: [[53.5, 120], [53.5, 127], [47, 130], [42, 128], [46, 122]], c: C.green, clip: CN }, a: 0.6, t: 2 },
          { fill: { k: 'poly', pts: [[29, 97.5], [29, 102], [23, 102], [22, 99]], c: C.green, clip: CN }, a: 0.6, t: 2 }],
        lines: [{ pts: FARM_PASTURE, c: C.white, w: 1.4, dur: 2, t: 0.6 }],
        marks: [mk([33, 114], 'Farmland: humid east', '耕地：东部湿润、半湿润区', { c: C.lime, t: 0.4 }), mk([43.5, 113], 'Inner Mongolia', '内蒙古牧区', { dot: true, c: C.gold, t: 1.2 }), mk([44, 86], 'Xinjiang', '新疆牧区', { dot: true, c: C.gold, t: 1.3 }),
          mk([35.5, 97], 'Qinghai', '青海牧区', { dot: true, c: C.gold, t: 1.4 }), mk([31.5, 88], 'Xizang', '西藏牧区', { dot: true, c: C.gold, t: 1.5 }), mk([50.5, 124], 'Forest: Greater and Lesser Khingan, Changbai', '林地：大、小兴安岭和长白山', { c: C.green, t: 2.2 }),
          mk([25, 99.5], 'Forest: Southwest, Hengduan Mts', '林地：西南横断山区', { c: C.green, t: 2.4 })],
        fig: { k: 'key', set: 'custom', title: ['Main land uses (sketch)', '主要土地利用类型（示意）'], items: [{ c: C.lime, name: ['Farmland', '耕地'] }, { c: C.gold, name: ['Grassland', '草地'] }, { c: C.green, name: ['Forest', '林地'] }, { c: C.white, name: ['Farming–herding boundary', '农牧交错带'] }] },
        body: ['Farmland lies mostly in the humid and semi-humid plains and basins of the east: the Northeast Plain, North China Plain, Middle–Lower Yangtze Plain and Sichuan Basin. Grassland covers the dry west; Inner Mongolia, Xinjiang, Qinghai and Xizang are the four great pastoral areas. Forests grow mainly in the Northeast (Greater and Lesser Khingan, Changbai Mountains) and the Southwest. The white line marks where farming gives way to herding, close to the 400 mm rainfall line.',
          '耕地主要分布在东部季风区湿润、半湿润地区的平原和盆地，如东北平原、华北平原、长江中下游平原和四川盆地；草地主要分布在西部干旱、半干旱地区，内蒙古、新疆、青海、西藏是我国四大牧区；林地主要分布在东北的大、小兴安岭和长白山，以及西南的横断山区等地。白线是农牧交错带，大致与 400 毫米年等降水量线一致。'],
      },
      {
        title: ['Guarding the farmland red line', '守住耕地红线'], cam: [35, 115, 2.8],
        paint: [{ fill: { k: 'poly', pts: NE_PLAINS.songnen, c: C.lime, clip: CN }, a: 0.55 }, { fill: { k: 'poly', pts: NE_PLAINS.sanjiang, c: C.lime, clip: CN }, a: 0.55 }, { fill: { k: 'poly', pts: NE_PLAINS.liaohe, c: C.lime, clip: CN }, a: 0.55 }],
        marks: [mk([46.6, 126.9], 'Black soil, Northeast Plain', '东北黑土地', { dot: true, c: C.lime, t: 0.6 }), mk([35.5, 116], 'North China Plain', '华北平原', { c: C.lime, t: 0.9 }),
          mk([22.7, 114.0], 'Shenzhen: towns spread over farmland', '深圳：城镇扩张占用耕地', { dot: true, c: C.red, t: 1.4 }), mk([38.5, 108], 'Grain for Green: steep fields back to forest', '退耕还林还草：陡坡耕地还林还草', { c: C.green, t: 1.8 })],
        fig: { k: 'bars', title: ['China\'s farmland (approx.)', '我国耕地面积（约）'], unit: ['100 million mu', '亿亩'], rows: [
          { name: ['2019 survey', '2019 年调查'], v: 19.18, c: C.lime }, { name: ['2023', '2023 年'], v: 19.29, c: C.lime }, { name: ['Red line', '耕地红线'], v: 18, c: C.red }] },
        body: ['China feeds about a fifth of the world\'s people with under a tenth of its farmland. In 2023 it had about 1.93 billion mu (about 129 million ha) of farmland, and the law sets a red line of at least 1.8 billion mu that must never be crossed. Towns, roads and factories eat into good farmland, and soil erosion and salinity damage it. China builds "high-standard farmland", protects the Northeast\'s black soil and has turned steep slope fields back into forest and grass.',
          '我国用不到世界 10% 的耕地养活了世界近五分之一的人口。2023 年我国耕地约 19.29 亿亩，国家坚守“18 亿亩耕地红线”，绝不能突破。城镇、道路和工厂建设占用优质耕地，水土流失、土地盐碱化等也会破坏耕地。为此，我国大力建设高标准农田、保护东北黑土地，并在陡坡地区退耕还林还草。“十分珍惜、合理利用土地和切实保护耕地”是我国的基本国策。'],
      },
      {
        title: ['More water in the south', '水资源南多北少'], cam: [32, 112, 3.4],
        paint: [{ fill: { k: 'poly', pts: SOUTH_POLY, c: C.blue, clip: CN }, a: 0.45, t: 1 }, { fill: { k: 'poly', pts: NORTH_POLY, c: C.brown, clip: CN }, a: 0.4, t: 1.4 }],
        lines: [{ pts: NS_LINE, c: C.gold, w: 2, dur: 1.6 }, { pts: YANGTZE, c: C.blue, w: 1.3, dur: 1.4, t: 0.4 }, { pts: YELLOW, c: C.gold, w: 1.1, dur: 1.4, t: 0.6 }],
        marks: [mk([28, 114], 'South: much water, less farmland', '南方：水多地少', { big: true, c: C.blue, t: 1.8 }), mk([38, 116], 'North: little water, much farmland', '北方：水少地多', { big: true, c: C.brown, t: 2.2 }), mk([33.9, 108.5], 'Qinling–Huaihe line', '秦岭—淮河一线', { c: C.gold, t: 2.6 })],
        fig: { k: 'bars', title: ['Shares of China\'s total (approx.)', '占全国的比重（约）'], unit: ['%', '%'], rows: [
          { name: ['South: water', '南方水资源'], v: 81, c: C.blue }, { name: ['South: farmland', '南方耕地'], v: 36, c: C.lime }, { name: ['North: water', '北方水资源'], v: 19, c: C.blue }, { name: ['North: farmland', '北方耕地'], v: 64, c: C.lime }] },
        body: ['Rain comes from summer monsoon winds off the sea, so it falls more heavily in the south and east and less towards the north and west. South of the Qinling–Huaihe line there is about 81% of China\'s water but only about 36% of the farmland. The north has nearly two-thirds of the farmland but less than a fifth of the water, and the Hai and Yellow river basins are among the driest per person. This mismatch of water and land is the main reason for moving water from south to north.',
          '我国降水主要来自夏季风从海洋带来的水汽，因此大致从东南沿海向西北内陆递减。秦岭—淮河以南的南方地区，水资源约占全国的 81%，耕地却只约占 36%；北方地区耕地占全国的近三分之二，水资源却不到五分之一，海河、黄河流域人均水资源尤其少。水土资源配合不协调，是“南水北调”的重要原因。'],
      },
      {
        title: ['More water in summer', '水资源夏秋多、冬春少'], cam: [34, 113, 2.8],
        task: ['Find the Three Gorges Dam and Miyun Reservoir: how do reservoirs help with the monsoon?', '找到三峡大坝和密云水库：水库怎样应对季风带来的旱涝？'],
        lines: [{ pts: YANGTZE.slice(YZ.yibin, YZ.hukou + 1), c: C.blue, w: 1.8, flow: true, arrow: true, dur: 1.8 }],
        marks: [mk([30.82, 111.0], 'Three Gorges Dam', '三峡大坝', { dot: true, c: C.teal, big: true, t: 1.2 }), mk([40.5, 116.9], 'Miyun Reservoir, Beijing', '北京密云水库', { dot: true, c: C.teal, t: 1.6 }),
          mk([32.7, 111.6], 'Danjiangkou Reservoir', '丹江口水库', { dot: true, c: C.teal, t: 2 })],
        fig: { k: 'climo', city: 'beijing' },
        body: ['Because of the monsoon, most rain falls in summer and autumn: Beijing gets about three-quarters of its year\'s rain from June to September, while winter and spring are dry. Wet and dry years also differ a lot, so floods and droughts follow. Reservoirs store floodwater for the dry season: the Three Gorges Dam (completed 2006, 2,309 m long) holds about 39 billion m³, controls Yangtze floods, makes huge amounts of electricity and lets big ships reach Chongqing. Miyun Reservoir stores water for Beijing.',
          '受季风影响，我国降水集中在夏秋季节：北京一年的降水约四分之三集中在 6—9 月，冬春季节干旱少雨。降水的年际变化也很大，容易发生旱涝灾害。修建水库可以把雨季多余的水储存起来供旱季使用。长江三峡大坝（2006 年建成，坝长 2309 米）水库总库容约 393 亿立方米，具有防洪、发电、航运等巨大效益；密云水库则是北京的重要水源地。'],
      },
      {
        title: ['South–North Water Diversion', '南水北调'], cam: [35, 115, 2.6], sketch: true,
        task: ['Follow the routes north from the Yangtze: find where the East and Middle routes start and where they end.', '从长江出发向北追踪调水线路：找到东线和中线的起点和终点。'],
        lines: [{ pts: YANGTZE.slice(YZ.yichang), c: C.blue, w: 1.2, dur: 1 }, { pts: YELLOW.slice(YR.tongguan), c: C.gold, w: 1.2, dur: 1 },
          { pts: SNWD_EAST, c: C.teal, w: 2, flow: true, arrow: true, dur: 2, t: 0.8 }, { pts: SNWD_EAST_TJ, c: C.teal, w: 1.6, flow: true, arrow: true, dur: 0.8, t: 2.6 }, { pts: SNWD_EAST_SD, c: C.teal, w: 1.6, flow: true, arrow: true, dur: 1.2, t: 2.4 },
          { pts: SNWD_MIDDLE, c: C.green, w: 2, flow: true, arrow: true, dur: 2, t: 1.6 }, { pts: SNWD_MIDDLE_TJ, c: C.green, w: 1.6, flow: true, arrow: true, dur: 0.8, t: 3.4 }],
        marks: [mk([32.42, 119.55], 'East Route: Jiangdu, Yangzhou', '东线起点：扬州江都', { dot: true, c: C.teal, t: 1 }), mk([35.95, 116.2], 'Dongping Lake', '东平湖', { dot: true, c: C.teal, t: 2 }),
          mk([32.67, 111.71], 'Middle Route: Taocha, Danjiangkou', '中线起点：丹江口陶岔', { dot: true, c: C.green, t: 1.8 }),
          mk([39.9, 116.4], 'Beijing', '北京', { dot: true, c: C.white, t: 3 }), mk([39.13, 117.2], 'Tianjin', '天津', { dot: true, c: C.white, t: 3.1 }), mk([37.5, 121.4], 'Yantai, Weihai', '烟台、威海', { c: C.teal, t: 3.2 })],
        fig: snwdFig,
        body: ['The South–North Water Diversion moves Yangtze water to the dry north. The East Route (first stage opened in 2013) lifts water from Jiangdu near Yangzhou through 13 levels of pumping stations, using the Grand Canal and lakes such as Hongze and Dongping, to Shandong; a branch even reaches the Jiaodong Peninsula. The Middle Route (opened in December 2014) starts at Taocha on the Danjiangkou Reservoir and flows by gravity for 1,432 km to Beijing and Tianjin, crossing under the Yellow River in a tunnel. By 2024 the two routes had delivered over 76 billion m³ of water, benefiting about 185 million people; a West Route is still being planned.',
          '南水北调工程把长江水调往缺水的北方。东线一期工程 2013 年通水，从扬州江都抽引长江水，经 13 级泵站逐级提水，利用京杭运河及洪泽湖、东平湖等北送山东，并有支线通往胶东半岛。中线一期工程 2014 年 12 月通水，从丹江口水库的陶岔渠首引水，全程自流 1432 千米到北京、天津，在郑州附近以隧洞从黄河下方穿过。到 2024 年，东、中线累计调水超过 760 亿立方米，直接受益人口约 1.85 亿；西线工程仍在规划中。'],
      },
      {
        title: ['Saving and protecting water', '节约用水，保护水资源'], cam: [37.5, 116, 2.4],
        task: ['Find the North China Plain\'s groundwater funnels and the Luan–Tianjin channel.', '找到华北平原的地下水漏斗区和引滦入津工程。'],
        paint: [{ fill: { k: 'poly', pts: [[39.4, 115.2], [39.2, 116.8], [37.8, 117.2], [36.5, 116.4], [36.8, 114.8], [38.2, 114.6]], c: C.red, clip: CN }, a: 0.35 }],
        lines: [{ pts: LUAN_TJ, c: C.teal, w: 1.8, flow: true, arrow: true, dur: 1.4, t: 1.2 }],
        marks: [mk([37.7, 115.7], 'Hengshui: groundwater funnel', '衡水：地下水漏斗', { dot: true, c: C.red, t: 0.4 }), mk([39.13, 117.2], 'Tianjin', '天津', { dot: true, c: C.white, t: 1 }), mk([40.42, 118.28], 'Panjiakou Reservoir, Luan River', '滦河潘家口水库', { dot: true, c: C.teal, t: 1.4 })],
        fig: { k: 'pie', title: ['How China used water, 2023 (approx.)', '我国用水构成，2023 年（约）'], parts: [
          { name: ['Farming', '农业'], v: 62.2, c: C.lime }, { name: ['Industry', '工业'], v: 16.4, c: C.orange }, { name: ['Homes and services', '生活'], v: 15.4, c: C.blue }, { name: ['Environment', '生态环境补水'], v: 6.0, c: C.green }] },
        body: ['Farming uses over three-fifths of China\'s water, so the biggest savings come from sprinkler and drip irrigation in place of flooding fields. For decades the North China Plain pumped more groundwater than rain could refill, leaving huge underground "funnels" and sinking land; since the Middle Route arrived, pumping has been cut and water tables have begun to rise. Factories reuse cooling water, cities treat and reuse waste water, and the 1983 Luan–Tianjin project still supplies Tianjin. Saving water, stopping pollution and transferring water must all work together.',
          '农业用水占我国用水总量的五分之三以上，推广喷灌、滴灌，取代大水漫灌，节水潜力最大。华北平原长期超采地下水，形成大面积地下水漏斗，引起地面沉降；南水北调中线通水后，各地压减地下水开采，地下水位开始回升。工业提高用水重复利用率，城市处理和回用污水，1983 年建成的引滦入津工程至今仍为天津供水。解决缺水问题，要开源与节流并重，同时防治水污染。'],
      },
    ],
    quiz: [
      { q: ['China\'s water per person is about … of the world average.', '我国人均水资源量约为世界人均的'], options: [['A quarter to a third', '四分之一到三分之一'], ['Twice', '两倍'], ['About the same', '大致相当'], ['One twentieth', '二十分之一']], answer: 0,
        why: ['The total is among the world\'s largest, but 1.41 billion people share it.', '总量居世界前列，但要由 14 亿多人分享，人均很少。'] },
      { q: ['China\'s total water resources are about 2.8 trillion m³, shared by about 1.41 billion people. About how much water is that per person?', '我国水资源总量约 2.8 万亿立方米，人口约 14.1 亿。人均水资源量约是多少？'], num: { answer: 1990, tol: 80, unit: ['m³', '立方米'] },
        why: ['2,800,000,000,000 ÷ 1,410,000,000 ≈ 1,990 m³ per person.', '28000 亿 ÷ 14.1 亿 ≈ 1990 立方米。'] },
      { q: ['Put these land uses in order, from the largest share of China\'s land to the smallest.', '把下列土地利用类型按占全国面积的比重从大到小排序。'],
        order: [['Forest', '林地'], ['Grassland', '草地'], ['Farmland', '耕地'], ['Built-up land', '建设用地']],
        why: ['About 30%, 28%, 13% and under 5% (Third National Land Survey).', '约 30%、28%、13% 和不到 5%（第三次全国国土调查）。'] },
      { q: ['Label the two sources of the South–North Water Diversion.', '在地球上标出南水北调东线和中线的水源地。'],
        place: [{ text: ['East Route: Jiangdu, Yangzhou', '东线：扬州江都'], at: [32.42, 119.55], tolKm: 300 }, { text: ['Middle Route: Danjiangkou Reservoir', '中线：丹江口水库'], at: [32.67, 111.6], tolKm: 300 }],
        why: ['Jiangdu is on the lower Yangtze; Danjiangkou is on the Han River where Hubei meets Henan.', '江都位于长江下游；丹江口水库位于湖北、河南交界的汉江上。'] },
      { q: ['Match each project to its feature.', '把工程和它的特点连起来。'],
        match: [[['East Route', '东线工程'], ['Pumped uphill along the Grand Canal', '利用京杭运河，逐级泵站提水']], [['Middle Route', '中线工程'], ['Flows north by gravity from Danjiangkou', '从丹江口水库自流北上']],
          [['West Route', '西线工程'], ['Planned to link the upper Yangtze and Yellow rivers', '规划连通长江上游与黄河上游']], [['Three Gorges Dam', '三峡大坝'], ['Controls Yangtze floods and makes power', '长江防洪、发电']]],
        why: ['Each project solves the uneven spread of water in a different way.', '这些工程用不同方式解决水资源时空分布不均的问题。'] },
      { q: ['Look at Beijing\'s climate graph. Why does north China often run short of water in spring?', '读北京气候图。华北地区春季为什么常常缺水？'], fig: { k: 'climo', city: 'beijing' },
        options: [['Rain falls mostly in summer; spring is dry while fields need water', '降水集中在夏季，春季少雨而农田需水多'], ['Spring is the rainiest season', '春季降水最多'], ['Rivers flow backwards in spring', '春季河流倒流'], ['It snows all spring', '春季一直下雪']], answer: 0,
        why: ['The bars are tall only in June–September; spring sowing needs water when there is little rain.', '图中只有 6—9 月降水柱高；春播需水时恰逢少雨。'] },
      { q: ['Which of these help solve the water shortage in north China? Pick all that apply.', '下列措施中，有利于解决我国北方缺水问题的有（多选）'],
        options: [['Transferring water from the south', '跨流域调水'], ['Drip and sprinkler irrigation', '推广喷灌、滴灌'], ['Treating and reusing waste water', '污水处理后再利用'], ['Pumping out more and more groundwater', '大量开采地下水'], ['Flood irrigation of fields', '大水漫灌']], multi: [0, 1, 2],
        why: ['Moving water, saving water and reusing it all help. Over-pumping groundwater makes the land sink, and flood irrigation wastes water.', '跨流域调水、节约用水、污水再利用都有帮助；过量开采地下水会引起地面沉降，大水漫灌则浪费水资源。'] },
      { q: ['The Middle Route flows all the way to Beijing by gravity, but the East Route needs 13 levels of pumping stations. Why?', '中线可以全程自流到北京，东线却需要 13 级泵站提水。原因是'],
        options: [['Danjiangkou is about 100 m higher than Beijing, but the East Route starts near sea level and must climb northwards to the Yellow River', '丹江口水库比北京高约 100 米；东线起点海拔很低，向北地势逐渐升高'], ['The East Route is longer', '东线更长'], ['The Middle Route carries less water', '中线输水量少'], ['Pumps clean the water', '泵站用来净化水']], answer: 0,
        why: ['Water flows downhill: the Middle Route falls from about 147 m to 50 m, while the East Route must be pumped up from near sea level to about 40 m at Dongping Lake before it can flow on.', '水往低处流：中线从约 147 米降到约 50 米；东线要从接近海平面逐级提水到约 40 米高的东平湖一带，才能继续北送。'] },
    ],
  },
  {
    id: 'china-economy', strand: 'china', tracks: ['uk', 'us'], grade: 'g8a', unit: ['China\'s economy and culture', '中国的经济发展'], icon: 'ship', minutes: 10,
    title: ['Farming, industry, transport and culture', '农业、工业、交通与地域文化'],
    blurb: ['Rice in the south, wheat in the north, factories on the coast, fast trains and giant ports, and houses that fit the land.', '南稻北麦、东耕西牧，沿海工业密集，高铁与大港连通内外，民居与环境相适应。'],
    keys: [
      ['Farming in the east, herding in the west; north of Qinling–Huaihe dryland wheat, south paddy rice.', '东部以种植业为主，西部以畜牧业为主；秦岭—淮河以北多旱地、种小麦，以南多水田、种水稻。'],
      ['Farming depends on climate, land, water and markets: cotton in sunny Xinjiang, rubber in tropical Hainan.', '农业分布受气候、地形、水源和市场等因素影响，如新疆光照足产棉，海南热带产橡胶。'],
      ['Industry clusters on the coast and along rivers and railways; high-tech grows near universities.', '工业主要分布在沿海、沿江和铁路沿线；高新技术产业多依托高校和科研机构。'],
      ['Each mode of transport suits different goods; high-speed rail and big ports link the country and the world.', '各种交通运输方式各有特点；高速铁路和大型港口把全国与世界连接起来。'],
      ['Houses, food and customs reflect local climate and land.', '民居、饮食和风俗体现了当地的气候与地形特点。'],
    ],
    steps: [
      {
        title: ['Farming east, herding west', '东耕西牧'], cam: [37, 104, 3.6], sketch: true, items: ['an_yak'],
        task: ['Find the four great pastoral areas in the west: Inner Mongolia, Xinjiang, Qinghai and Xizang.', '在西部找到四大牧区：内蒙古、新疆、青海和西藏。'],
        paint: [{ fill: { k: 'land', a2: CN, c: C.gold }, a: 0.35 }, { fill: { k: 'poly', pts: [[54, 122.5], [54, 136], [17, 125], [17, 97], ...[...FARM_PASTURE].reverse()], c: C.lime, clip: CN }, a: 0.5, t: 1.6 }],
        lines: [{ pts: FARM_PASTURE, c: C.white, w: 1.6, dur: 2.2 }],
        marks: [mk([32, 113], 'Crop farming, forestry, fishing', '种植业、林业、渔业', { big: true, c: C.lime, t: 2 }), mk([43.5, 113], 'Inner Mongolia pastures', '内蒙古牧区', { c: C.gold, t: 2.4 }), mk([44, 86], 'Xinjiang pastures', '新疆牧区', { c: C.gold, t: 2.6 }), mk([36, 97], 'Qinghai pastures', '青海牧区', { c: C.gold, t: 2.8 }), mk([31.5, 88], 'Xizang pastures', '西藏牧区', { c: C.gold, t: 3 }),
          mk([29.9, 122.2], 'Zhoushan fishing ground', '舟山渔场', { dot: true, c: C.blue, t: 3.2 })],
        body: ['Farming (agriculture) includes crop growing, forestry, herding, fishing and side-lines. Roughly along the 400 mm rainfall line, China\'s farming changes. To the east, the humid plains grow crops, the mountains have forestry, and fishing thrives on the coast and lakes; Zhoushan is China\'s biggest fishing ground. To the west it is too dry or cold for most crops, so people raise sheep, cattle, horses and yaks on grassland, moving with the seasons.',
          '农业包括种植业、林业、畜牧业、渔业等。大致以 400 毫米年等降水量线为界，东部季风区以种植业为主，山区发展林业，沿海和湖区发展渔业，舟山渔场是我国最大的渔场；西部干旱、高寒，大多不适宜种植，以畜牧业为主，饲养牛、羊、马、牦牛等，牧民逐水草而居，按季节转场。'],
      },
      {
        title: ['Wheat in the north, rice in the south', '南稻北麦'], cam: [30, 110, 3.6], items: ['cn_yuanyang'],
        task: ['Find where China\'s cotton, sugar cane, rubber and tea come from, and think about the climate in each place.', '找到棉花、甘蔗、橡胶和茶叶的主要产区，想一想各地的气候特点。'],
        paint: [{ fill: { k: 'poly', pts: NORTH_POLY, c: C.gold, clip: CN }, a: 0.4, t: 0.8 }, { fill: { k: 'poly', pts: SOUTH_POLY, c: C.green, clip: CN }, a: 0.4, t: 1.2 }],
        lines: [{ pts: NS_LINE, c: C.white, w: 2, dur: 1.6 }],
        marks: [mk([36.5, 115.5], 'Dry fields: wheat, corn', '旱地：小麦、玉米', { c: C.gold, t: 1.6 }), mk([29, 115], 'Paddy fields: rice, rapeseed', '水田：水稻、油菜', { c: C.green, t: 2 }),
          mk([41.2, 82], 'Xinjiang: cotton', '新疆：棉花', { dot: true, c: C.white, t: 2.4 }), mk([23.0, 108.4], 'Guangxi: sugar cane', '广西：甘蔗', { dot: true, c: C.lime, t: 2.7 }),
          mk([19.2, 109.6], 'Hainan: rubber', '海南：橡胶', { dot: true, c: C.teal, t: 3 }), mk([22.0, 100.8], 'Xishuangbanna: rubber, tea', '西双版纳：橡胶、茶叶', { dot: true, c: C.teal, t: 3.2 }), mk([27.0, 118.0], 'Fujian hills: tea', '福建丘陵：茶叶', { dot: true, c: C.lime, t: 3.4 })],
        fig: { k: 'key', set: 'custom', title: ['Farming on each side of Qinling–Huaihe', '秦岭—淮河两侧的农业'], items: [{ c: C.gold, name: ['North: dry fields, wheat, 1–2 crops a year', '北方：旱地，小麦，一年一熟至两年三熟'] }, { c: C.green, name: ['South: paddy fields, rice, 2–3 crops a year', '南方：水田，水稻，一年两熟至三熟'] }] },
        body: ['The Qinling–Huaihe line divides farming too. The north has dry fields growing wheat and corn, which is why noodles and steamed buns are common there. The warm, wet south has paddy fields of rice, with rapeseed and tea on the hills: "rice in the south, wheat in the north". Cash crops follow the climate: sunny, dry Xinjiang grows about 91% of China\'s cotton (2023), Guangxi grows about two-thirds of its sugar cane, and rubber needs the frost-free tropics of Hainan and Xishuangbanna.',
          '秦岭—淮河一线也是农业的分界线。北方耕地以旱地为主，主要种植小麦、玉米等，面食较多；南方温暖湿润，耕地以水田为主，主要种植水稻，丘陵上多茶园和油菜，形成“南稻北麦”的格局。经济作物的分布也与气候密切相关：新疆光照充足、昼夜温差大，棉花产量约占全国的 91%（2023 年）；广西甘蔗产量约占全国的三分之二；橡胶需要终年无霜的热带环境，主要产于海南和云南西双版纳。'],
      },
      {
        title: ['Feeding 1.4 billion people', '端牢中国饭碗'], cam: [40, 120, 2.8],
        paint: [{ fill: { k: 'poly', pts: NE_PLAINS.sanjiang, c: C.gold, clip: CN }, a: 0.6 }, { fill: { k: 'poly', pts: NE_PLAINS.songnen, c: C.gold, clip: CN }, a: 0.6 }],
        marks: [mk([47.3, 132.2], 'Sanjiang Plain', '三江平原', { c: C.gold, t: 0.4 }), mk([46.6, 125.5], 'Songnen Plain', '松嫩平原', { c: C.gold, t: 0.6 }),
          mk([35.5, 116], 'North China Plain: wheat', '华北平原：小麦', { dot: true, c: C.gold, t: 1 }), mk([30.4, 104.1], 'Chengdu Plain', '成都平原', { dot: true, c: C.green, t: 1.4 }), mk([29.0, 114.5], 'Middle Yangtze: rice', '长江中游：水稻', { dot: true, c: C.green, t: 1.6 })],
        fig: { k: 'line', title: ['China\'s grain harvest (approx.)', '我国粮食产量（约）'], unit: ['million tonnes', '百万吨'], x: [1949, 1978, 1996, 2010, 2015, 2020, 2023], min: 0, max: 800,
          series: [{ name: ['Grain', '粮食'], c: C.gold, y: [113, 305, 505, 546, 661, 669, 695] }], notes: [{ x: 1978, text: ['Household contract system', '家庭联产承包责任制'] }] },
        body: ['China\'s grain harvest is now about six times that of 1949: 695 million tonnes in 2023, around 493 kg per person, above the 400 kg food-security line. Better seeds (such as Yuan Longping\'s hybrid rice), irrigation, machines and fertiliser all helped. Heilongjiang, with the Sanjiang and Songnen plains, grew about 78 million tonnes, the most of any province. The main commodity-grain bases are on the big plains: the Northeast, the North China Plain, the middle and lower Yangtze and the Chengdu Plain.',
          '2023 年我国粮食产量约 6.95 亿吨，是 1949 年的 6 倍多，人均约 493 千克，高于 400 千克的国际粮食安全线。优良品种（如袁隆平的杂交水稻）、灌溉、农业机械和化肥等都起了重要作用。黑龙江拥有三江平原和松嫩平原，2023 年粮食产量约 7800 万吨，居全国第一。我国的商品粮基地主要分布在东北平原、华北平原、长江中下游平原和成都平原等地。'],
      },
      {
        title: ['Where industry is', '工业的分布'], cam: [33, 113, 3.2], sketch: true, items: ['cn_bund'],
        paint: [{ fill: { k: 'poly', pts: [[42.5, 121], [42.5, 125], [38.8, 122.5], [40, 120.5]], c: C.orange, clip: CN }, a: 0.6, t: 0.4 },
          { fill: { k: 'poly', pts: [[40.6, 115.8], [40.6, 118.8], [38.8, 118.8], [38.8, 116.6]], c: C.orange, clip: CN }, a: 0.6, t: 0.8 },
          { fill: { k: 'poly', pts: YRD, c: C.orange, clip: CN }, a: 0.6, t: 1.2 }, { fill: { k: 'poly', pts: PRD, c: C.orange, clip: CN }, a: 0.6, t: 1.6 }],
        lines: [{ pts: YANGTZE.slice(YZ.yibin), c: C.blue, w: 1.4, dur: 1.4, t: 2 }, { pts: BJ_GZ, c: C.white, w: 1.2, dur: 1.6, t: 2.4 }],
        marks: [mk([41.2, 122.8], 'Central & southern Liaoning', '辽中南', { c: C.orange, t: 0.5 }), mk([39.7, 117.5], 'Beijing–Tianjin–Tangshan', '京津唐', { c: C.orange, t: 0.9 }), mk([31.3, 120.5], 'Shanghai–Nanjing–Hangzhou', '沪宁杭', { c: C.orange, t: 1.3 }), mk([22.8, 113.5], 'Pearl River Delta', '珠江三角洲', { c: C.orange, t: 1.7 }),
          mk([30.6, 114.3], 'Wuhan', '武汉', { dot: true, c: C.gold, t: 2.6 }), mk([30.1, 105.3], 'Chengdu–Chongqing', '成渝', { dot: true, c: C.gold, t: 2.8 }), mk([34.27, 108.94], 'Xi\'an', '西安', { dot: true, c: C.gold, t: 3 })],
        body: ['China\'s industry is concentrated in the east, especially along the coast, along the Yangtze and beside main railways, where transport, workers, capital and markets are close. The four big industrial bases are central and southern Liaoning (steel and machinery, near coal and iron ore), Beijing–Tianjin–Tangshan, Shanghai–Nanjing–Hangzhou (the largest) and the Pearl River Delta (which grew fast after reform and opening-up). Inland centres such as Wuhan, Chengdu–Chongqing and Xi\'an are growing as factories move west. Today China makes about 30% of the world\'s manufactured goods.',
          '我国工业主要集中在东部，尤其是沿海、沿江和铁路沿线地带，那里交通便利，劳动力、资金和市场条件好。四大工业基地是辽中南（钢铁、机械，靠近煤、铁资源）、京津唐、沪宁杭（规模最大）和珠江三角洲（改革开放后迅速发展）。随着产业向中西部转移，武汉、成渝、西安等内陆工业中心发展迅速。目前我国制造业增加值约占世界的 30%，是世界第一制造业大国。'],
      },
      {
        title: ['High-tech industry', '高新技术产业'], cam: [30, 116, 3],
        paint: [{ fill: { k: 'land', a2: CN, c: C.violet }, a: 0.2 }],
        marks: [mk([39.98, 116.31], 'Zhongguancun, Beijing', '北京中关村', { dot: true, c: C.violet, t: 0.4 }), mk([31.2, 121.6], 'Zhangjiang, Shanghai: chips, medicine', '上海张江：芯片、生物医药', { dot: true, c: C.violet, t: 0.8 }),
          mk([22.54, 114.06], 'Shenzhen: phones, drones, electric cars', '深圳：手机、无人机、电动汽车', { dot: true, c: C.violet, t: 1.2 }), pin([31.82, 117.23], C.violet, 1.6), mk([34.4, 118.6], 'Hefei: displays, electric cars', '合肥：显示屏、新能源汽车', { c: C.violet, t: 1.7 }),
          mk([30.5, 114.4], 'Wuhan: optics valley', '武汉：光谷', { dot: true, c: C.violet, t: 2 })],
        lines: [lead([31.82, 117.23], [34.4, 118.6], 1.6, C.violet)],
        fig: { k: 'line', title: ['New-energy vehicles made in China (approx.)', '我国新能源汽车产量（约）'], unit: ['million', '百万辆'], x: [2015, 2018, 2020, 2021, 2022, 2023], min: 0, max: 10,
          series: [{ name: ['NEVs', '新能源汽车'], c: C.green, y: [0.34, 1.27, 1.37, 3.55, 7.06, 9.59] }] },
        body: ['High-tech industry needs knowledge more than raw materials, so it grows near universities, research institutes and skilled workers, not near mines. Zhongguancun in Beijing, beside Peking and Tsinghua universities, was China\'s first high-tech zone; Shenzhen grew from a small town in 1980 into a city of phones, drones and electric cars. In 2023 China made about 9.6 million new-energy vehicles, about 60% of the world total. Products are small, light and valuable, so they can even travel by air.',
          '高新技术产业依赖知识和技术，而不是原料，因此多分布在高校、科研机构集中、人才密集的地方，而不是矿区。北京中关村紧邻北京大学、清华大学，是我国第一个国家级高新技术产业开发区；深圳从 1980 年的小镇发展为手机、无人机、电动汽车的产业高地。2023 年我国新能源汽车产量约 959 万辆，约占世界的六成。高新技术产品体积小、价值高，适合空运。'],
      },
      {
        title: ['Choosing a way to move goods', '交通运输方式的选择'], cam: [36, 108, 3.6],
        task: ['Trace the coal railway, the Yangtze waterway and the gas pipeline: what does each carry?', '追踪运煤铁路、长江航道和天然气管道：它们各运送什么？'],
        lines: [{ pts: DAQIN, c: C.gold, w: 2.2, flow: true, arrow: true, dur: 1.4 }, { pts: YANGTZE.slice(YZ.yibin), c: C.blue, w: 2, flow: true, arrow: true, dur: 2, t: 0.8 },
          { pts: GAS_PIPE, c: C.teal, w: 1.8, flow: true, arrow: true, dur: 2.6, t: 1.6 },
          lead([39.93, 119.6], [41.6, 120.6], 1.2, C.gold), lead([41.78, 84.25], [44.4, 82.0], 2.2, C.teal)],
        marks: [mk([40.08, 113.3], 'Datong: coal', '大同：煤炭', { dot: true, c: C.gold, t: 0.4 }), pin([39.93, 119.6], C.gold, 1.2), mk([41.6, 120.6], 'Qinhuangdao port', '秦皇岛港', { c: C.gold, t: 1.3 }),
          mk([30.6, 114.3], 'Yangtze: "golden waterway"', '长江“黄金水道”', { c: C.blue, t: 1.6 }), pin([41.78, 84.25], C.teal, 2.2), mk([44.4, 82.0], 'Lunnan, Tarim Basin: gas', '塔里木盆地轮南：天然气', { c: C.teal, t: 2.3 }), mk([37.6, 102], 'West–East Gas Pipeline', '西气东输管道', { c: C.teal, t: 2.8 })],
        fig: transportFig,
        body: ['Rail, road, water, air and pipelines each have strengths. The Datong–Qinhuangdao railway, built for heavy trains, carries about 400 million tonnes of Shanxi and Inner Mongolia coal a year to the port of Qinhuangdao. The Yangtze, the world\'s busiest inland waterway, carried almost 4 billion tonnes of cargo in 2023 at the lowest cost. The West–East Gas Pipeline (2004) sends gas about 4,000 km from the Tarim Basin to Shanghai. To choose, weigh the goods\' value, weight, freshness and urgency against cost and distance.',
          '铁路、公路、水运、航空、管道各有优缺点。大秦铁路是重载运煤专线，每年把约 4 亿吨山西、内蒙古的煤炭运到秦皇岛港；长江是世界上运量最大的内河航道，2023 年干线货物通过量近 40 亿吨，运费最低；西气东输管道（2004 年投产）把塔里木盆地的天然气向东输送约 4000 千米到上海。选择运输方式，要综合考虑货物的价值、重量、是否鲜活、是否急需，以及运费和距离。'],
      },
      {
        title: ['Fast trains and big ports', '高铁与港口'], cam: [31, 115, 3],
        task: ['Follow the Beijing–Shanghai and Beijing–Guangzhou high-speed lines south from Beijing, then find the big ports.', '从北京出发，沿京沪高铁和京广高铁向南追踪，再找出大港口。'],
        lines: [{ pts: BJ_SH, c: C.gold, w: 2, dur: 1.6, flow: true }, { pts: BJ_GZ, c: C.orange, w: 2, dur: 1.8, t: 0.6, flow: true }, lead([29.9, 121.9], [28.4, 123.4], 2.4, C.teal)],
        marks: [mk([33.1, 118.3], 'Beijing–Shanghai HSR, 1,318 km', '京沪高铁，1318 千米', { c: C.gold, t: 1 }), mk([27.5, 113.6], 'Beijing–Guangzhou HSR', '京广高铁', { c: C.orange, t: 1.6 }),
          mk([30.63, 122.06], 'Shanghai Port (Yangshan)', '上海港（洋山）', { dot: true, c: C.teal, t: 2.2 }), pin([29.9, 121.9], C.teal, 2.4), mk([28.4, 123.4], 'Ningbo–Zhoushan', '宁波舟山港', { c: C.teal, t: 2.5 }), mk([36.07, 120.3], 'Qingdao', '青岛港', { dot: true, c: C.teal, t: 2.6 }), mk([22.5, 113.9], 'Shenzhen', '深圳港', { dot: true, c: C.teal, t: 2.8 })],
        fig: { k: 'bars', title: ['World\'s busiest container ports, 2023 (approx.)', '世界集装箱吞吐量最大的港口，2023 年（约）'], unit: ['million TEU', '百万标准箱'], rows: [
          { name: ['Shanghai', '上海'], v: 49.2, c: C.teal }, { name: ['Singapore', '新加坡'], v: 39.0, c: C.white }, { name: ['Ningbo–Zhoushan', '宁波舟山'], v: 35.3, c: C.teal }, { name: ['Shenzhen', '深圳'], v: 29.9, c: C.teal },
          { name: ['Qingdao', '青岛'], v: 28.8, c: C.teal }, { name: ['Guangzhou', '广州'], v: 25.4, c: C.teal }] },
        body: ['Railways are the backbone of China\'s transport. Since the Beijing–Tianjin line opened in 2008, China has built about 45,000 km of high-speed railway (2023), more than the rest of the world together; the fastest trains cover the 1,318 km Beijing–Shanghai line in about 4 hours 20 minutes. Seaports link China to world trade: in 2023 Shanghai was the world\'s busiest container port for the 14th year running, and Chinese ports took most of the top ten places.',
          '铁路是我国最重要的交通运输方式。2008 年京津城际铁路开通以来，到 2023 年我国已建成高速铁路约 4.5 万千米，超过世界其他国家的总和；全长 1318 千米的京沪高铁，最快约 4 小时 20 分钟可从北京到上海。港口把我国和世界贸易连接起来：2023 年上海港集装箱吞吐量连续 14 年居世界第一，世界前十大集装箱港口中我国港口占多数。'],
      },
      {
        title: ['Regional cultures', '地域文化'], cam: [32, 110, 3.6], items: ['fd_pekingduck', 'fd_lanzhou', 'fd_hotpot', 'fd_dimsum'],
        marks: [mk([39.9, 116.4], 'Courtyard houses (siheyuan)', '四合院', { dot: true, c: C.gold, t: 0.3 }), mk([36.6, 109.5], 'Cave dwellings (yaodong)', '窑洞', { dot: true, c: C.brown, t: 0.7 }), mk([44, 116], 'Mongolian yurts', '蒙古包', { dot: true, c: C.white, t: 1.1 }),
          mk([24.6, 117.0], 'Earth buildings (tulou)', '土楼', { dot: true, c: C.orange, t: 1.5 }), mk([26.6, 108.2], 'Stilt houses', '吊脚楼', { dot: true, c: C.green, t: 1.9 }), mk([30.84, 120.9], 'Water-town houses', '水乡民居', { dot: true, c: C.teal, t: 2.3 }),
          mk([29.65, 91.1], 'Flat-roofed stone houses', '平顶碉房', { dot: true, c: C.violet, t: 2.6 })],
        body: ['Different land and climate shaped different ways of life. Beijing\'s courtyard houses face south with thick walls against the cold north wind; cave dwellings dug into the Loess Plateau are warm in winter and cool in summer; herders use yurts they can pack up and move. In the wet south, stilt houses stay dry and airy, steep roofs shed rain, and Fujian\'s round earth buildings shelter whole clans. In dry, sunny Xizang, stone houses have flat roofs and thick walls. Food changes too: wheat noodles in the north, rice and spicy hotpot in damp Sichuan.',
          '不同的自然环境孕育了不同的地域文化。北京的四合院坐北朝南、墙体厚实，利于防寒避风；黄土高原上的窑洞冬暖夏凉；草原牧民住便于拆装搬迁的蒙古包；南方湿热多雨，吊脚楼通风防潮，屋顶坡度大利于排水，福建土楼聚族而居；西藏降水少、日照强，碉房多为平顶、厚墙。饮食也各具特色：北方多面食，南方多米饭，潮湿的四川盆地爱吃麻辣火锅。'],
      },
    ],
    quiz: [
      { q: ['Paddy rice is the main crop…', '水稻主要种植在'], options: [['South of the Qinling–Huaihe line', '秦岭—淮河以南'], ['North of the Qinling–Huaihe line', '秦岭—淮河以北'], ['On the Qinghai–Tibet Plateau', '青藏高原'], ['In the Tarim Basin', '塔里木盆地']], answer: 0,
        why: ['The south is warm and wet, good for paddy fields.', '南方温暖湿润，适合水田种水稻。'] },
      { q: ['Label China\'s four big industrial bases.', '在地球上标出我国的四大工业基地。'],
        place: [{ text: ['Central & southern Liaoning', '辽中南'], at: [41.2, 122.8], tolKm: 300 }, { text: ['Beijing–Tianjin–Tangshan', '京津唐'], at: [39.7, 117.5], tolKm: 300 }, { text: ['Shanghai–Nanjing–Hangzhou', '沪宁杭'], at: [31.3, 120.5], tolKm: 350 }, { text: ['Pearl River Delta', '珠江三角洲'], at: [22.8, 113.5], tolKm: 300 }],
        why: ['All four lie in the east, near the coast and big ports, where transport, markets and skilled workers are close at hand.', '四大工业基地都分布在东部沿海地区，靠近港口，交通便利，市场广阔，技术力量雄厚。'] },
      { q: ['Which helped the coast become China\'s main industrial area? Pick all that apply.', '我国东部沿海成为工业集中地区的有利条件有（多选）'],
        options: [['Ports and easy transport', '有港口，交通便利'], ['Many workers and big markets', '劳动力充足，市场广阔'], ['Opened early to foreign trade and investment', '对外开放早，便于引进资金和技术'], ['Rich deposits of coal everywhere', '处处都有丰富的煤炭'], ['Cold, dry climate', '气候寒冷干燥']], multi: [0, 1, 2],
        why: ['Transport, labour, markets and opening-up drew industry to the coast; the coast is neither especially rich in coal nor cold and dry.', '交通、劳动力、市场和对外开放吸引工业集中于沿海；沿海并非处处多煤，气候也不寒冷干燥。'] },
      { q: ['Match each cargo to the best way to move it.', '把货物和最合适的运输方式连起来。'],
        match: [[['1 million tonnes of coal, Shanxi to Shanghai', '100 万吨煤炭，山西运往上海'], ['Rail, then sea', '铁路转海运']], [['Fresh lychees, Guangzhou to Beijing, fast', '鲜荔枝，广州急运北京'], ['Air', '航空']],
          [['Natural gas, Xinjiang to Shanghai', '天然气，新疆运往上海'], ['Pipeline', '管道']], [['A sofa across town', '一张沙发，同城配送'], ['Road', '公路']]],
        why: ['Bulky, cheap goods go by rail or water; urgent, fresh goods by air; gas by pipeline; short door-to-door trips by road.', '大宗、价廉货物选铁路或水运；鲜活、急需货物选航空；天然气用管道；短途门到门运输选公路。'] },
      { q: ['The Beijing–Shanghai high-speed railway is 1,318 km long. At an average of 300 km/h, about how many hours does the trip take?', '京沪高铁全长 1318 千米。若平均时速 300 千米，全程约需多少小时？'], num: { answer: 4.4, tol: 0.15, unit: ['hours', '小时'] },
        why: ['1,318 ÷ 300 ≈ 4.4 hours; the fastest real trains, running at up to 350 km/h, take about 4 hours 20 minutes.', '1318 ÷ 300 ≈ 4.4 小时；实际最快车次时速可达 350 千米，约需 4 小时 20 分钟。'] },
      { q: ['Order these modes by cost per tonne-km, cheapest first.', '把下列运输方式按每吨千米运费从低到高排序。'],
        order: [['Water', '水运'], ['Rail', '铁路'], ['Road', '公路'], ['Air', '航空']],
        why: ['Ships carry the most for the least fuel; planes carry little at high cost.', '船舶运量大、能耗低，运费最低；飞机运量小、成本高，运费最高。'] },
      { q: ['Which house type belongs to the Loess Plateau?', '黄土高原上的传统民居是'], options: [['Cave dwellings', '窑洞'], ['Stilt houses', '吊脚楼'], ['Yurts', '蒙古包'], ['Earth buildings (tulou)', '土楼']], answer: 0,
        why: ['Thick loess is easy to dig and keeps warm in winter, cool in summer.', '黄土深厚易挖，窑洞冬暖夏凉。'] },
      { q: ['Xinjiang gets less than 200 mm of rain a year, yet it grows about nine-tenths of China\'s cotton. What best explains this?', '新疆年降水量不足 200 毫米，棉花产量却约占全国的九成。最合理的解释是'],
        options: [['Long sunny days, big day–night temperature range, and oasis irrigation from meltwater', '光照充足、昼夜温差大，并有冰雪融水灌溉绿洲'], ['Heavy summer monsoon rain', '夏季风带来大量降水'], ['Cotton needs no water at all', '棉花完全不需要水'], ['It is near the biggest seaports', '靠近大海港']], answer: 0,
        why: ['Sunshine and warm days ripen cotton with long, white fibres; irrigation (now often drip irrigation) supplies the water that rain does not.', '光照足、热量充足，棉花纤维长、品质好；降水不足靠冰雪融水灌溉，如今多采用膜下滴灌。'] },
    ],
  },
  {
    id: 'china-north', strand: 'china', tracks: [], grade: 'g8b', unit: regions, icon: 'landmark', minutes: 10,
    title: ['The northern region', '北方地区'],
    blurb: ['Black soil, the wheat lands of the North China Plain, spring drought, coal on the Loess Plateau and the ancient capitals.', '黑土地、华北平原的麦田与春旱、黄土高原的煤炭，以及黄河流域的古都。'],
    keys: [
      ['The north lies north of Qinling–Huaihe and east of the Greater Khingan and Wushaoling: about 20% of the land and 40% of the people.', '北方地区位于秦岭—淮河以北、大兴安岭和乌鞘岭以东，面积约占全国的 20%，人口约占 40%。'],
      ['It has a temperate monsoon climate: hot, rainy summers and cold, dry winters below 0 °C; landforms are mainly plains and plateaus.', '属温带季风气候，夏季高温多雨，冬季寒冷干燥、气温在 0 °C 以下；地形以平原和高原为主。'],
      ['The Northeast grows one crop a year on black soil; the North China Plain grows winter wheat, two crops a year or three in two.', '东北平原黑土肥沃，一年一熟；华北平原以冬小麦为主，一年两熟或两年三熟。'],
      ['Spring drought, salty soil and too little water are the North China Plain\'s main farming problems.', '春旱、土地盐碱化和水资源不足是华北平原农业生产面临的主要问题。'],
      ['The Loess Plateau is rich in coal; the Yellow River valley was the cradle of Chinese civilisation, with many ancient capitals.', '黄土高原煤炭资源丰富；黄河流域是中华文明的发祥地，古都众多。'],
    ],
    steps: [
      {
        title: ['Where is the north?', '北方地区的范围'], cam: [36, 108, 4], sketch: true,
        task: ['Trace the north\'s borders: the Qinling–Huaihe line to the south, and the Greater Khingan, Great Wall and Wushaoling to the west.', '描出北方地区的边界：南面是秦岭—淮河一线，西面是大兴安岭、长城和乌鞘岭。'],
        paint: [...fourRegions(0.25), { fill: { k: 'poly', pts: NORTH_POLY, c: REGION_C.north, clip: CN }, a: 0.55, t: 0.6 }],
        lines: [{ pts: NS_LINE, c: C.white, w: 1.8, dur: 1.6 }, { pts: NW_LINE, c: C.white, w: 1.6, dur: 1.6, t: 0.6 }],
        marks: [mk([42, 124], 'Northern region', '北方地区', { big: true, c: C.gold, t: 0.6 }), mk([33.5, 110], 'Qinling–Huaihe', '秦岭—淮河', { c: C.white, t: 1.4 }),
          mk([37.2, 102.9], 'Wushaoling', '乌鞘岭', { dot: true, c: C.white, t: 1.8 }), mk([49, 121.3], 'Greater Khingan', '大兴安岭', { c: C.white, t: 2 }), mk([38.5, 121], 'Bohai Sea', '渤海', { c: C.blue, t: 2.2 })],
        fig: regionKey,
        body: ['Geographers divide China into four regions by location, climate and landforms. The northern region lies north of the Qinling–Huaihe line, east of the Greater Khingan Range and Wushaoling, and south of the Inner Mongolian Plateau, roughly along the Great Wall; it faces the Bohai and Yellow seas. It covers about a fifth of China\'s land but has about two-fifths of its people. It includes the three northeastern provinces, the North China Plain, the Loess Plateau and Beijing and Tianjin.',
          '根据地理位置、自然条件和人文特点，我国可划分为四大地理区域。北方地区位于秦岭—淮河以北，大兴安岭、乌鞘岭以东，内蒙古高原以南（大致以长城为界），东临渤海和黄海。北方地区面积约占全国的五分之一，人口却约占五分之二，包括东北三省、华北平原、黄土高原以及北京、天津等地。'],
      },
      {
        title: ['Plains and plateaus', '平原与高原'], cam: [38, 115, 3.2],
        paint: [{ fill: { k: 'poly', pts: NE_PLAINS.songnen, c: C.lime, clip: CN }, a: 0.55 }, { fill: { k: 'poly', pts: NE_PLAINS.sanjiang, c: C.lime, clip: CN }, a: 0.55 }, { fill: { k: 'poly', pts: NE_PLAINS.liaohe, c: C.lime, clip: CN }, a: 0.55 },
          { fill: { k: 'poly', pts: REGIONS.northChinaPlain, c: C.lime, clip: CN }, a: 0.55, t: 0.6 }, { fill: { k: 'poly', pts: LOESS_PLATEAU, c: C.brown, clip: CN }, a: 0.55, t: 1.2 }],
        lines: [{ pts: YELLOW.slice(YR.lanzhou), c: C.gold, w: 1.8, flow: true, arrow: true, dur: 2, t: 0.4 }, { pts: TAIHANG, c: C.brown, w: 2.2, dur: 1, t: 1.6 }],
        marks: [mk([46.5, 126], 'Northeast Plain', '东北平原', { big: true, c: C.lime, t: 0.4 }), mk([34.2, 115.4], 'North China Plain', '华北平原', { big: true, c: C.lime, t: 0.8 }), mk([37.3, 108], 'Loess Plateau', '黄土高原', { big: true, c: C.brown, t: 1.2 }),
          mk([38.2, 113.4], 'Taihang Mts', '太行山', { c: C.brown, t: 1.8 }), mk([36.25, 117.1], 'Mount Tai', '泰山', { dot: true, c: C.white, t: 2 })],
        body: ['The north is a land of wide plains and plateaus. The Northeast Plain (about 350,000 km²) is China\'s largest plain, ringed by the Greater and Lesser Khingan and Changbai mountains. The North China Plain (about 300,000 km²), the second largest, was built from mud laid down by the Yellow, Huai and Hai rivers. West of the Taihang Mountains rises the Loess Plateau, and the Yellow River crosses it all on its way to the Bohai Sea.',
          '北方地区以平原和高原为主。东北平原面积约 35 万平方千米，是我国面积最大的平原，被大、小兴安岭和长白山环绕；华北平原面积约 30 万平方千米，居第二位，主要由黄河、淮河、海河带来的泥沙沉积而成。太行山以西是黄土高原。黄河自西向东流经北方地区，注入渤海。'],
      },
      {
        title: ['A temperate monsoon climate', '温带季风气候'], cam: [38, 114, 3.6], items: ['fs_harbin'],
        paint: [{ fill: { k: 'poly', pts: NORTH_POLY, c: C.ice, clip: CN }, a: 0.35 }],
        lines: [{ pts: NS_LINE, c: C.white, w: 1.8, dur: 1.4 }, lead([45.8, 126.6], [43.4, 128.4], 1.4, C.ice)],
        marks: [mk([33.3, 112], 'January 0 °C line', '1 月 0 °C 等温线', { c: C.white, t: 0.6 }), mk([39.9, 116.4], 'Beijing: Jan −3 °C', '北京：1 月 −3 °C', { dot: true, c: C.gold, t: 1 }),
          pin([45.8, 126.6], C.ice, 1.4), mk([43.4, 128.4], 'Harbin: Jan −18 °C', '哈尔滨：1 月 −18 °C', { c: C.ice, t: 1.5 }), mk([47.5, 131.5], 'Rivers freeze for months', '河流冬季结冰期长', { c: C.ice, t: 1.8 })],
        fig: { k: 'climo', city: 'beijing', b: 'harbin' },
        body: ['The north has a temperate monsoon climate. Summer winds from the sea bring heat and rain, so July is hot and wet; winter winds from Mongolia and Siberia are cold and dry, and January averages below 0 °C everywhere north of the Qinling–Huaihe line. The further north, the colder and shorter the growing season: Harbin\'s January is about 15 °C colder than Beijing\'s. Rivers freeze in winter, and annual rain falls from about 800 mm near Qinling to about 400 mm in the northwest.',
          '北方地区属于温带季风气候。夏季风从海洋带来热量和水汽，7 月高温多雨；冬季风来自蒙古、西伯利亚，寒冷干燥，秦岭—淮河以北 1 月平均气温都在 0 °C 以下。越往北，冬季越冷，生长期越短：哈尔滨 1 月均温比北京低约 15 °C。北方河流冬季有结冰期，年降水量从秦岭附近的 800 毫米左右向西北减少到 400 毫米左右。'],
      },
      {
        title: ['The Northeast: black soil', '东北三省：黑土地'], cam: [45.5, 127, 2.6], items: ['vo_tianchi'],
        task: ['Find the Northeast Plain ringed by mountains: the Greater Khingan to the west, the Lesser Khingan to the north and the Changbai Mountains to the east.', '找到被群山环绕的东北平原：西面是大兴安岭，北面是小兴安岭，东面是长白山。'],
        paint: [{ fill: { k: 'poly', pts: NE_PLAINS.songnen, c: C.brown, clip: CN }, a: 0.65 }, { fill: { k: 'poly', pts: NE_PLAINS.sanjiang, c: C.brown, clip: CN }, a: 0.65 }, { fill: { k: 'poly', pts: NE_PLAINS.liaohe, c: C.brown, clip: CN }, a: 0.65 }],
        lines: [{ pts: NE_MOUNTAINS.greaterKhingan, c: C.green, w: 2.2, dur: 1, t: 0.6 }, { pts: NE_MOUNTAINS.lesserKhingan, c: C.green, w: 2.2, dur: 0.8, t: 0.9 }, { pts: NE_MOUNTAINS.changbai, c: C.green, w: 2.2, dur: 1, t: 1.2 }],
        marks: [mk([46.5, 125.8], 'Songnen Plain', '松嫩平原', { c: C.brown, t: 0.4 }), mk([47.2, 132.4], 'Sanjiang Plain', '三江平原', { c: C.brown, t: 0.5 }), mk([42.4, 122.9], 'Liaohe Plain', '辽河平原', { c: C.brown, t: 0.6 }),
          mk([49.8, 121.0], 'Greater Khingan', '大兴安岭', { c: C.green, t: 1 }), mk([48.8, 128.8], 'Lesser Khingan', '小兴安岭', { c: C.green, t: 1.2 }), mk([43.0, 129.4], 'Changbai Mts', '长白山', { c: C.green, t: 1.4 })],
        fig: { k: 'climo', city: 'harbin' },
        body: ['The Northeast Plain has deep, fertile black soil, built up over thousands of years as dead grass rotted slowly in the long, cold winters. Summers are short but warm and wet with long days, so crops ripen once a year: corn, soybeans, spring wheat and high-quality rice. It is China\'s biggest commodity-grain base, while forests cover the mountains around it. Black soil is precious and thinning, so it is now protected by law (2022).',
          '东北平原土壤以黑土为主，深厚肥沃。这是因为冬季漫长寒冷，植物残体分解缓慢，有机质逐年积累。这里夏季短促，但温暖湿润、日照长，农作物一年一熟，主要有玉米、大豆、春小麦和优质水稻，是我国最大的商品粮基地；周围山地森林茂密。黑土地十分珍贵，正在变薄，2022 年我国专门制定了《黑土地保护法》。'],
      },
      {
        title: ['The North China Plain: wheat and spring drought', '华北平原：小麦与春旱'], cam: [36, 116, 2.6], items: ['cn_taishan', 'sv_shaolin'],
        paint: [{ fill: { k: 'poly', pts: REGIONS.northChinaPlain, c: C.lime, clip: CN }, a: 0.6 }],
        lines: [{ pts: YELLOW.slice(YR.taohuayu), c: C.gold, w: 1.8, flow: true, arrow: true, dur: 1.6, t: 0.6 }, lead([34.75, 113.65], [35.9, 113.0], 0.4)],
        marks: [pin([34.75, 113.65], C.white, 0.4), mk([35.9, 113.0], 'Zhengzhou', '郑州', { t: 0.5 }), mk([33.8, 114.5], 'Henan: about a quarter of China\'s wheat', '河南：小麦约占全国四分之一', { c: C.lime, t: 0.8 }),
          mk([35.3, 118.9], 'Shandong: wheat, corn, vegetables', '山东：小麦、玉米、蔬菜', { c: C.lime, t: 1.2 }), mk([38.0, 114.5], 'Shijiazhuang', '石家庄', { dot: true, c: C.white, t: 1.6 })],
        fig: climoFig(ZHENGZHOU),
        body: ['The flat, fertile North China Plain is China\'s main wheat area: Henan and Shandong together grow nearly half of China\'s wheat. Winter wheat is sown in October, survives the winter and is harvested in early June, after which corn is planted, giving two crops a year or three in two years. But spring brings drought: the summer monsoon has not yet arrived, little rain falls, the temperature rises quickly and dry winds drive strong evaporation, just as the wheat turns green and needs water most.',
          '华北平原地势平坦、土壤肥沃，是我国最大的小麦产区，河南、山东两省的小麦产量合计接近全国的一半。冬小麦 10 月播种，越冬后于次年 6 月初收获，随后种植玉米，一年两熟或两年三熟。但这里春旱严重：春季夏季风尚未到来，降水少，气温回升快，多大风，蒸发旺盛，而此时正值小麦返青拔节，需水量大。'],
      },
      {
        title: ['Salty soil and scarce water', '盐碱地与缺水'], cam: [37.5, 117.5, 2.2],
        task: ['Find the Yellow River delta: why does low, flat land near the sea turn salty?', '找到黄河三角洲：为什么地势低平、靠近海洋的土地容易盐碱化？'],
        paint: [{ fill: { k: 'poly', pts: [[38.1, 118.4], [38.0, 119.2], [37.5, 119.3], [37.2, 118.9], [37.3, 118.2], [37.7, 118.0]], c: C.white, clip: CN }, a: 0.5 },
          { fill: { k: 'poly', pts: [[39.4, 115.2], [39.2, 116.8], [37.8, 117.2], [36.5, 116.4], [36.8, 114.8], [38.2, 114.6]], c: C.red, clip: CN }, a: 0.25, t: 1.4 }],
        lines: [{ pts: YELLOW.slice(YR.taohuayu), c: C.gold, w: 1.8, flow: true, arrow: true, dur: 1.4 }, lead([37.7, 115.7], [36.2, 113.2], 1.6, C.red)],
        marks: [mk([37.6, 118.6], 'Yellow River delta (Dongying): saline land', '黄河三角洲（东营）：盐碱地', { dot: true, c: C.white, t: 0.6 }),
          pin([37.7, 115.7], C.red, 1.6), mk([36.2, 113.2], 'Hengshui: groundwater funnel', '衡水：地下水漏斗', { c: C.red, t: 1.7 }), mk([38.85, 115.95], 'Xiong\'an, Baiyangdian', '雄安新区 · 白洋淀', { dot: true, c: C.teal, t: 2 })],
        body: ['In spring, strong evaporation draws groundwater up through the soil, and when it evaporates its salt is left behind as a white crust; poor drainage on low, flat land and flood irrigation make it worse. Farmers fight back with drainage ditches, flushing with fresh water, deep ploughing, planting trees and growing salt-tolerant crops, and the Yellow River delta now grows rice and salt-tolerant soybeans. Water is the deeper problem: the plain has much farmland but little water, so it saves water, uses water from the South–North Diversion and limits groundwater pumping.',
          '春季蒸发旺盛，地下水沿土壤上升，水分蒸发后盐分留在地表，形成白色盐霜；地势低平、排水不畅和大水漫灌会加重盐碱化。治理措施包括开挖排水沟、引淡水冲洗、深翻改土、植树造林和种植耐盐作物等，黄河三角洲如今已能种植水稻和耐盐大豆。更根本的问题是缺水：华北平原耕地多而水资源少，要发展节水农业，利用南水北调来水，并压减地下水开采。'],
      },
      {
        title: ['The Loess Plateau: coal and erosion', '黄土高原：煤炭与水土流失'], cam: [37.5, 110.5, 2.6], sketch: true,
        paint: [{ fill: { k: 'poly', pts: LOESS_PLATEAU, c: C.brown, clip: CN }, a: 0.55 }],
        lines: [{ pts: YELLOW.slice(YR.hekou, YR.tongguan + 1), c: C.gold, w: 2, flow: true, arrow: true, dur: 2, t: 0.6 }, lead([37.87, 112.55], [38.3, 113.2], 0.4)],
        marks: [pin([37.87, 112.55], C.white, 0.4), mk([38.3, 113.2], 'Taiyuan', '太原', { t: 0.5 }), mk([40.08, 113.3], 'Datong: coal', '大同：煤炭', { dot: true, c: C.gold, t: 0.7 }), mk([39.6, 109.8], 'Ordos: coal', '鄂尔多斯：煤炭', { dot: true, c: C.gold, t: 1 }),
          mk([38.3, 109.7], 'Yulin: coal', '榆林：煤炭', { dot: true, c: C.gold, t: 1.3 }), mk([36.6, 109.5], 'Gullies, terraces, check dams', '沟壑纵横 · 梯田 · 淤地坝', { c: C.lime, t: 1.8 })],
        fig: { k: 'bars', title: ['Coal mined, 2023 (approx.)', '原煤产量，2023 年（约）'], unit: ['100 million tonnes', '亿吨'], rows: [
          { name: ['Shanxi', '山西'], v: 13.78, c: C.gold }, { name: ['Inner Mongolia', '内蒙古'], v: 12.1, c: C.gold }, { name: ['Shaanxi', '陕西'], v: 7.6, c: C.gold }, { name: ['Xinjiang', '新疆'], v: 4.6, c: C.orange }] },
        body: ['The Loess Plateau is the largest loess area in the world, and under it lie huge coal seams. Shanxi mined about 1.38 billion tonnes in 2023, about 29% of China\'s coal, and with Inner Mongolia and Shaanxi it forms China\'s main coal base, sending coal and power east by rail and high-voltage lines. Loose loess, summer rainstorms and centuries of clearing caused serious soil erosion; terraces, check dams and returning steep fields to forest and grass have since cut the mud entering the Yellow River sharply. Shanxi is also moving from coal to cleaner energy and new industries.',
          '黄土高原是世界上面积最大的黄土分布区，地下蕴藏着丰富的煤炭。2023 年山西原煤产量约 13.8 亿吨，约占全国的 29%，与内蒙古、陕西共同构成我国最重要的煤炭基地，通过铁路和特高压输电线路实现“北煤南运”“西电东送”。黄土疏松、夏季多暴雨，加上长期不合理的开垦，水土流失严重；修梯田、建淤地坝、退耕还林还草后，进入黄河的泥沙已大大减少。山西也在推动能源转型，发展清洁能源和新兴产业。'],
      },
      {
        title: ['Cradle of civilisation, ancient capitals', '文明摇篮与古都'], cam: [36, 112, 2.6], items: ['terracotta', 'forbidden', 'greatwall'],
        task: ['Follow the Yellow River and find the ancient capitals along it, from Xi\'an to Kaifeng.', '沿黄河找出沿岸的古都，从西安到开封。'],
        lines: [{ pts: YELLOW.slice(YR.lanzhou), c: C.gold, w: 1.6, dur: 2 }, lead([36.1, 114.39], [37.0, 112.0], 0.4, C.gold), lead([34.27, 108.94], [33.1, 108.0], 0.8, C.gold), lead([39.9, 116.4], [41.4, 118.2], 2.4, C.red)],
        marks: [pin([36.1, 114.39], C.gold, 0.4), mk([37.0, 112.0], 'Anyang: Shang capital Yin', '安阳：商都殷', { c: C.gold, t: 0.5 }), pin([34.27, 108.94], C.gold, 0.8), mk([33.1, 108.0], 'Xi\'an: Chang\'an', '西安：长安', { c: C.gold, t: 0.9 }),
          mk([34.62, 112.45], 'Luoyang', '洛阳', { dot: true, c: C.gold, t: 1.2 }), mk([34.8, 114.31], 'Kaifeng: Northern Song', '开封：北宋都城', { dot: true, c: C.gold, t: 1.6 }),
          mk([35.6, 116.99], 'Qufu: Confucius', '曲阜：孔子故里', { dot: true, c: C.white, t: 2 }), pin([39.9, 116.4], C.red, 2.4), mk([41.4, 118.2], 'Beijing: Yuan, Ming, Qing', '北京：元明清都城', { c: C.red, t: 2.5 })],
        body: ['Fertile loess that was easy to dig with simple tools, and the Yellow River\'s water, made this the cradle of Chinese civilisation. Many dynasties built their capitals here: Anyang was the Shang capital Yin, where oracle-bone script was found; Xi\'an (Chang\'an) served the Zhou, Qin, Han and Tang; Luoyang and Kaifeng also served as capitals, and Qufu is the home of Confucius. Beijing, the capital of the Yuan, Ming and Qing and of China today, keeps the Forbidden City and Great Wall.',
          '黄土疏松肥沃，便于用简单工具耕作，又有黄河水灌溉，黄河流域成为中华文明的发祥地。许多朝代在这里建都：安阳是商朝都城殷所在地，出土了甲骨文；西安（长安）是周、秦、汉、唐等朝代的都城；洛阳、开封也是著名古都，曲阜是孔子故里。北京是元、明、清的都城，也是今天的首都，有故宫、长城等世界文化遗产。'],
      },
    ],
    quiz: [
      { q: ['This mystery climate graph is from a city in the northern region. Which city is it most likely to be?', '下面是北方地区某城市的气候资料图。它最可能是'], fig: climoFig({ name: CITIES.harbin.name, type: ['Temperate monsoon', '温带季风气候'], T: CITIES.harbin.T, P: CITIES.harbin.P }, true),
        options: [['Harbin', '哈尔滨'], ['Zhengzhou', '郑州'], ['Guangzhou', '广州'], ['Lhasa', '拉萨']], answer: 0,
        why: ['January is about −18 °C and rain peaks in summer: a cold temperate monsoon city far north, like Harbin.', '1 月均温约 −18 °C，降水集中在夏季：纬度很高的温带季风气候城市，应是哈尔滨。'] },
      { q: ['Match each region of the north to its farming.', '把北方的地区和它的农业特点连起来。'],
        match: [[['Northeast Plain', '东北平原'], ['Black soil; corn, soybeans and rice, one crop a year', '黑土肥沃；玉米、大豆、水稻，一年一熟']], [['North China Plain', '华北平原'], ['Winter wheat; two crops a year or three in two years', '冬小麦；一年两熟或两年三熟']], [['Loess Plateau', '黄土高原'], ['Terraces and check dams to hold the soil', '修梯田、打淤地坝，保持水土']]],
        why: ['The cold Northeast has a short growing season; the warmer North China Plain fits two crops; on the Loess Plateau, farming must first stop soil being washed away.', '东北纬度高，生长期短，一年一熟；华北平原热量较多，一年两熟或两年三熟；黄土高原首先要治理水土流失。'] },
      { q: ['Label these places in the northern region.', '在地球上标出北方地区的这些地方。'],
        place: [{ text: ['Northeast Plain', '东北平原'], at: [46, 125], tolKm: 450 }, { text: ['North China Plain', '华北平原'], at: [36, 116], tolKm: 400 }, { text: ['Loess Plateau', '黄土高原'], at: [37, 108], tolKm: 400 }],
        why: ['The Northeast Plain is China\'s largest plain; the North China Plain lies along the lower Yellow River; the Loess Plateau is in its middle course.', '东北平原是我国面积最大的平原；华北平原位于黄河下游；黄土高原位于黄河中游。'] },
      { q: ['Why is spring drought serious on the North China Plain? Pick all that apply.', '华北平原春旱严重的原因有（多选）'],
        options: [['The summer monsoon has not arrived, so little rain falls', '夏季风尚未到来，降水少'], ['Temperatures rise fast and winds are strong, so evaporation is high', '气温回升快，多大风，蒸发旺盛'], ['Winter wheat needs much water as it turns green', '冬小麦返青需水量大'], ['Typhoons bring too much rain', '台风带来过多降水'], ['Plum rains last all spring', '梅雨持续整个春季']], multi: [0, 1, 2],
        why: ['Low supply (little rain) meets high demand (evaporation and growing wheat). Typhoons and plum rains belong to the south and to summer.', '降水少，而蒸发和作物需水多，供需矛盾突出。台风、梅雨主要影响南方，且出现在夏季。'] },
      { q: ['Shanxi mined about 1.378 billion tonnes of coal in 2023, out of China\'s 4.71 billion tonnes. About what percentage is that?', '2023 年山西原煤产量约 13.78 亿吨，全国约 47.1 亿吨。山西约占全国的百分之几？'], num: { answer: 29, tol: 1.5, unit: ['%', '%'] },
        why: ['1.378 ÷ 4.71 ≈ 0.29, so about 29%.', '13.78 ÷ 47.1 ≈ 0.29，约占 29%。'] },
      { q: ['Put these capitals in time order, from the earliest dynasty to the latest.', '把下列都城按所属朝代的先后排序。'],
        order: [['Yin (Anyang), Shang', '殷（安阳），商'], ['Chang\'an (Xi\'an), Western Han', '长安（西安），西汉'], ['Bianjing (Kaifeng), Northern Song', '汴京（开封），北宋'], ['Beijing, Ming and Qing', '北京，明、清']],
        why: ['Shang (c. 1300 BC), Western Han (from 202 BC), Northern Song (960–1127) and Ming–Qing (from 1421 to 1912).', '商（约公元前 1300 年迁殷）、西汉（公元前 202 年起）、北宋（960—1127 年）、明清（1421—1912 年）。'] },
      { q: ['Crops on the Northeast Plain ripen…', '东北平原的农作物熟制是'], options: [['Once a year', '一年一熟'], ['Twice a year', '一年两熟'], ['Three times a year', '一年三熟'], ['Three times in two years', '两年三熟']], answer: 0,
        why: ['It lies far north, so summers and the frost-free season are short.', '纬度高，夏季短，无霜期短。'] },
      { q: ['A farmer on the low, flat land near the Yellow River mouth floods his fields every spring with river water and never digs drains. What will most likely happen, and why?', '黄河入海口附近地势低平，某农户每年春季大水漫灌，却从不开挖排水沟。最可能出现什么问题？为什么？'],
        options: [['The soil turns salty: the water table rises, then evaporation leaves salt at the surface', '土地盐碱化：地下水位上升，水分蒸发后盐分留在地表'], ['The soil turns black and richer', '土壤变黑变肥'], ['The land becomes a desert of sand dunes', '变成沙丘'], ['Rice will grow better every year with no change', '水稻年年增产，没有任何问题']], answer: 0,
        why: ['Flooding without drainage raises the salty groundwater; spring evaporation pulls it up and leaves salt behind. Drains and careful irrigation keep the water table low.', '只灌不排会抬高含盐的地下水位，春季强烈蒸发把盐分带到地表。开沟排水、科学灌溉可以降低地下水位。'] },
    ],
  },
  {
    id: 'china-south', strand: 'china', tracks: [], grade: 'g8b', unit: regions, icon: 'sail', minutes: 10,
    title: ['The southern region', '南方地区'],
    blurb: ['Rivers, lakes and paddy fields, plum rains and typhoons, the Sichuan Basin, karst hills, two great deltas and two big islands.', '河湖与水田、梅雨与台风、四川盆地、喀斯特山地、两大三角洲和两大岛屿。'],
    keys: [
      ['The south lies south of Qinling–Huaihe and east of the Qinghai–Tibet Plateau: about 25% of the land and 55% of the people.', '南方地区位于秦岭—淮河以南、青藏高原以东，面积约占全国的 25%，人口约占 55%。'],
      ['It is warm and wet (subtropical and tropical monsoon), with dense rivers and lakes, and paddy rice 2–3 crops a year.', '南方地区温暖湿润（亚热带、热带季风气候），河湖众多，以水田、水稻为主，一年两熟到三熟。'],
      ['Landforms include the Middle–Lower Yangtze Plain, Sichuan Basin, Yunnan–Guizhou Plateau and southeast hills; karst is widespread in the southwest.', '地形有长江中下游平原、四川盆地、云贵高原和东南丘陵等，西南地区喀斯特地貌广布。'],
      ['The Yangtze and Pearl River deltas are China\'s richest city regions; Hong Kong and Macao are special administrative regions.', '长江三角洲和珠江三角洲是我国经济最发达的地区；香港、澳门是特别行政区。'],
      ['Taiwan is China\'s largest island and Hainan the second.', '台湾岛是我国第一大岛，海南岛是第二大岛。'],
    ],
    steps: [
      {
        title: ['Where is the south?', '南方地区的范围'], cam: [27, 110, 3.6], sketch: true,
        paint: [...fourRegions(0.25), { fill: { k: 'poly', pts: SOUTH_POLY, c: REGION_C.south, clip: CN }, a: 0.55, t: 0.6 }],
        lines: [{ pts: NS_LINE, c: C.white, w: 1.8, dur: 1.6 }, { pts: QT_EDGE.slice(24), c: C.white, w: 1.4, dur: 1, t: 0.8 }],
        marks: [mk([27, 113], 'Southern region', '南方地区', { big: true, c: C.green, t: 0.6 }), mk([33.5, 110], 'Qinling–Huaihe', '秦岭—淮河', { c: C.white, t: 1.2 }),
          mk([28.5, 124.5], 'East China Sea', '东海', { c: C.blue, t: 1.6 }), mk([17.5, 114.5], 'South China Sea', '南海', { c: C.blue, t: 1.8 })],
        fig: regionKey,
        body: ['The southern region lies south of the Qinling–Huaihe line and east of the Qinghai–Tibet Plateau, facing the East and South China seas. It covers about a quarter of China\'s land yet holds over half of its people, because warmth, rain and fertile lowlands support dense farming and many cities. January stays above 0 °C, more than 800 mm of rain falls a year, rivers do not freeze, and many carry ships all year.',
          '南方地区位于秦岭—淮河以南、青藏高原以东，东部和南部濒临东海和南海。南方地区面积约占全国的四分之一，人口却超过全国的一半，这是因为这里热量充足、降水丰沛、低地肥沃，适宜精耕细作，城市众多。南方地区 1 月平均气温在 0 °C 以上，年降水量在 800 毫米以上，河流冬季不结冰，许多河流终年可以通航。'],
      },
      {
        title: ['Plains, basins, plateaus, hills', '平原、盆地、高原与丘陵'], cam: [28, 111, 3],
        paint: [{ fill: { k: 'poly', pts: REGIONS.sichuan, c: C.violet, clip: CN }, a: 0.5 }, { fill: { k: 'poly', pts: REGIONS.southeastHills, c: C.lime, clip: CN }, a: 0.35, t: 0.6 }],
        lines: [{ pts: YANGTZE.slice(YZ.yibin), c: C.blue, w: 2, flow: true, arrow: true, dur: 2 }, { pts: PEARL, c: C.blue, w: 1.6, flow: true, arrow: true, dur: 1.6, t: 0.6 },
          { pts: [...POYANG, POYANG[0]], c: C.teal, w: 1.6, dur: 0.6, t: 1.2 }, { pts: [...DONGTING, DONGTING[0]], c: C.teal, w: 1.6, dur: 0.6, t: 1.3 }],
        marks: [mk([30.4, 105.5], 'Sichuan Basin', '四川盆地', { big: true, c: C.violet, t: 0.4 }), mk([26.3, 104.8], 'Yunnan–Guizhou Plateau', '云贵高原', { c: C.violet, t: 0.7 }),
          mk([30.8, 115.5], 'Middle–Lower Yangtze Plain', '长江中下游平原', { c: C.lime, t: 1 }), mk([26.5, 116.5], 'Southeast hills', '东南丘陵', { c: C.lime, t: 1.2 }),
          mk([29.1, 116.3], 'Poyang Lake', '鄱阳湖', { c: C.teal, t: 1.6 }), mk([29.0, 112.5], 'Dongting Lake', '洞庭湖', { c: C.teal, t: 1.8 }), mk([23.2, 110.5], 'Pearl River', '珠江', { c: C.blue, t: 2 })],
        body: ['The south has every kind of landform. The Middle–Lower Yangtze Plain is low and flat, dotted with lakes such as Poyang, China\'s largest freshwater lake, and Dongting. To the west lie the Sichuan Basin, ringed by mountains, and the rugged Yunnan–Guizhou Plateau, and the southeast is a sea of low hills. The Yangtze, China\'s longest river, and the Pearl River, the largest in the far south, carry more water than any northern river.',
          '南方地区地形类型多样。长江中下游平原地势低平，湖泊众多，有我国最大的淡水湖鄱阳湖和洞庭湖等；西部有四周群山环绕的四川盆地和地形崎岖的云贵高原；东南部丘陵广布。长江是我国最长的河流，珠江是华南最大的河流，它们的水量都比北方河流大得多。'],
      },
      {
        title: ['Plum rains and typhoons', '梅雨与台风'], cam: [27, 116, 3],
        task: ['Follow the summer rain belt as it moves north, then the typhoon tracks coming in from the Pacific.', '跟随夏季雨带向北推移，再看从太平洋袭来的台风路径。'],
        paint: [{ fill: { k: 'poly', pts: [[32.6, 106], [32.6, 122.5], [28.4, 122.5], [28.4, 106]], c: C.blue, clip: CN }, a: 0.3, t: 0.4 }],
        lines: [...arrows([[[18, 132], [20.5, 124], [22.6, 116.5]], [[17, 128], [19.5, 117], [20.2, 110.6]], [[20, 133], [24.5, 125], [27.5, 120.6]]], C.red, 1.6, 2)],
        marks: [mk([30.6, 114.3], 'Plum rains, mid-June to mid-July', '梅雨期：6 月中旬到 7 月中旬', { c: C.blue, t: 0.6 }), mk([23.13, 113.26], 'Guangzhou', '广州', { dot: true, c: C.white, t: 1 }),
          mk([21, 127], 'Typhoons, summer and autumn', '台风：夏秋季节', { c: C.red, t: 2.2 })],
        fig: climoFig(GUANGZHOU),
        body: ['Warm, wet summer monsoon winds give the south long, hot summers and plenty of rain: Guangzhou gets about 1,850 mm a year. In early summer the rain belt stalls over the middle and lower Yangtze for about a month, bringing the "plum rains" as plums ripen; if it lingers there may be floods, and if it moves on too fast, drought. In summer and autumn typhoons from the Pacific strike Guangdong, Fujian, Zhejiang, Hainan and Taiwan with storm winds and heavy rain, but they also end summer droughts.',
          '南方受夏季风影响时间长，夏季高温多雨：广州年降水量约 1850 毫米。初夏，雨带在长江中下游地区停留约一个月，正值梅子成熟，称为“梅雨”；雨带停留过久会引发洪涝，过早北移则会出现干旱。夏秋季节，来自太平洋的台风常登陆广东、福建、浙江、海南和台湾等地，带来狂风暴雨，但也能缓解伏旱。'],
      },
      {
        title: ['Land of fish and rice', '鱼米之乡'], cam: [28, 115, 2.6], items: ['cn_westlake'],
        task: ['Find the lake plains around Dongting and Poyang, then the tea hills and fish ponds.', '找到洞庭湖、鄱阳湖周围的平原，再找茶园和桑基鱼塘。'],
        paint: [{ fill: { k: 'poly', pts: SOUTH_POLY, c: C.green, clip: CN }, a: 0.25 }],
        lines: [{ pts: [...POYANG, POYANG[0]], c: C.teal, w: 1.6, dur: 0.6 }, { pts: [...DONGTING, DONGTING[0]], c: C.teal, w: 1.6, dur: 0.6, t: 0.1 },
          lead([29.0, 112.5], [27.6, 111.0], 0.4, C.lime), lead([31.2, 120.2], [32.1, 121.0], 0.8, C.lime), lead([30.25, 120.1], [29.9, 122.0], 1.2, C.green), lead([30.87, 120.1], [31.0, 122.0], 1.8, C.teal)],
        marks: [pin([29.0, 112.5], C.lime, 0.4), mk([27.6, 111.0], 'Dongting plain: rice', '洞庭湖平原：水稻', { c: C.lime, t: 0.5 }), mk([28.7, 116.4], 'Poyang plain: rice', '鄱阳湖平原：水稻', { dot: true, c: C.lime, t: 0.6 }),
          pin([31.2, 120.2], C.lime, 0.8), mk([32.1, 121.0], 'Taihu plain', '太湖平原', { c: C.lime, t: 0.9 }), pin([30.25, 120.1], C.green, 1.2), mk([29.9, 122.0], 'Hangzhou: Longjing tea', '杭州：龙井茶', { c: C.green, t: 1.3 }),
          mk([27.7, 118.0], 'Wuyi Mts: tea', '武夷山：茶叶', { dot: true, c: C.green, t: 1.4 }), pin([30.87, 120.1], C.teal, 1.8), mk([31.0, 122.0], 'Huzhou: mulberry dykes, fish ponds', '湖州：桑基鱼塘', { c: C.teal, t: 1.9 }), mk([22.84, 113.25], 'Shunde', '顺德', { dot: true, c: C.teal, t: 2 })],
        fig: { k: 'key', set: 'custom', title: ['Southern farming (sketch)', '南方农业（示意）'], items: [{ c: C.lime, name: ['Lake plains: double-crop rice, rapeseed', '湖区平原：双季稻、油菜'] }, { c: C.green, name: ['Hills: tea, citrus, bamboo, timber', '丘陵：茶叶、柑橘、竹、木材'] }, { c: C.teal, name: ['Deltas: fish ponds, mulberry and silk', '三角洲：鱼塘、桑蚕'] }] },
        body: ['Rice needs heat, plenty of water and flat land, so it fills the lake plains around Dongting, Poyang and Taihu, often two crops a year (early and late rice) with rapeseed in winter. Hillsides grow tea, citrus, bamboo and timber. In the deltas, farmers dug fish ponds and piled the mud into dykes planted with mulberry: silkworms eat the leaves, their droppings feed the fish, and pond mud fertilises the mulberry, an old circular system still seen in Huzhou. This rich farming earned the region the name "land of fish and rice".',
          '水稻生长需要充足的热量、大量的水和平坦的土地，因此洞庭湖平原、鄱阳湖平原和太湖平原等地大面积种植水稻，多为双季稻，冬季种油菜。丘陵山地种植茶叶、柑橘、竹子和林木。三角洲上，人们挖塘养鱼，把塘泥堆成塘基种桑：桑叶养蚕，蚕沙喂鱼，塘泥肥桑，形成循环，湖州的桑基鱼塘至今仍在使用。因此南方被誉为“鱼米之乡”。'],
      },
      {
        title: ['The Sichuan Basin and Dujiangyan', '四川盆地与都江堰'], cam: [30.5, 104.5, 2], items: ['an_panda'],
        task: ['Find Dujiangyan where the Min River leaves the mountains, and the Chengdu Plain it waters.', '找到岷江出山口的都江堰，以及它灌溉的成都平原。'],
        paint: [{ fill: { k: 'poly', pts: REGIONS.sichuan, c: C.violet, clip: CN }, a: 0.45 }, { fill: { k: 'poly', pts: [[31.2, 103.6], [31.2, 104.4], [30.6, 104.6], [30.2, 104.1], [30.4, 103.5]], c: C.lime, clip: CN }, a: 0.6, t: 1.2 }],
        lines: [{ pts: [[33.1, 103.7], [32.6, 103.6], [31.7, 103.85], [31.0, 103.62], [30.4, 103.8], [29.57, 103.76]], c: C.blue, w: 1.8, flow: true, arrow: true, dur: 1.4 }, lead([31.0, 103.62], [32.4, 104.6], 0.6, C.gold)],
        marks: [pin([31.0, 103.62], C.gold, 0.6), mk([32.4, 104.6], 'Dujiangyan', '都江堰', { big: true, c: C.gold, t: 0.7 }), mk([30.66, 104.07], 'Chengdu', '成都', { dot: true, c: C.white, t: 1 }), mk([29.56, 106.55], 'Chongqing', '重庆', { dot: true, c: C.white, t: 1.2 }),
          mk([31.4, 105.3], 'Chengdu Plain: "Land of Abundance"', '成都平原：“天府之国”', { c: C.lime, t: 1.6 })],
        fig: dujiangyanFig,
        body: ['The Sichuan Basin is ringed by mountains that block cold winter winds, so winters are mild and the purple soil is fertile. Its floor, the Chengdu Plain, owes its wealth to Dujiangyan, built in 256 BC under Li Bing. The Fish Mouth splits the Min River, the Flying Sand Weir spills floods and sand back to the outer river, and the Bottle-Neck Channel feeds the plain; with no dam it still waters over 10 million mu (about 7,500 km²). The surrounding mountains are home to the giant panda.',
          '四川盆地四周群山环绕，阻挡了冬季寒冷的北风，冬季温和，紫色土肥沃。盆地西部的成都平原能成为“天府之国”，离不开公元前 256 年李冰主持修建的都江堰。鱼嘴把岷江分为内江和外江，飞沙堰把洪水和泥沙排入外江，宝瓶口把水引入成都平原。这项无坝引水工程沿用至今，灌溉面积超过 1000 万亩（约 7500 平方千米）。盆地周围的山地是大熊猫的家园。'],
      },
      {
        title: ['Karst, terraces and FAST', '喀斯特、梯田与“中国天眼”'], cam: [25, 106, 2.4], items: ['cn_guilin', 'cn_yuanyang', 'sp_fast'],
        task: ['Find Guilin, Kunming, the Yuanyang terraces and the FAST telescope on the karst plateau.', '在喀斯特高原上找到桂林、昆明、元阳梯田和“中国天眼”。'],
        paint: [{ fill: { k: 'poly', pts: KARST, c: C.violet, clip: CN }, a: 0.4 }],
        marks: [mk([26.6, 106.7], 'Guiyang', '贵阳', { dot: true, c: C.white, t: 0.3 }), pin([25.27, 110.29], C.green, 0.6), mk([26.5, 111.4], 'Guilin', '桂林', { c: C.green, t: 0.7 }), mk([25.04, 102.71], 'Kunming: "spring city"', '昆明：“春城”', { dot: true, c: C.white, t: 0.9 }),
          pin([23.1, 102.75], C.lime, 1.2), mk([22.0, 103.8], 'Yuanyang (Hani) terraces', '元阳哈尼梯田', { c: C.lime, t: 1.3 }), pin([25.65, 106.86], C.gold, 1.5), mk([24.1, 105.4], 'FAST, Pingtang', '平塘“中国天眼”', { c: C.gold, t: 1.6 })],
        fig: climoFig(KUNMING),
        body: ['On the Yunnan–Guizhou Plateau and in Guangxi, rainwater slowly dissolved limestone into karst: steep peaks, caves, sinkholes and underground rivers, like the hills along the Li River at Guilin. The soil is thin and water drains away underground, so where forests were cleared the rock was laid bare ("rocky desertification"), now being reversed by replanting. Kunming, high (about 1,890 m) and near the tropics, is mild all year. The Hani of Yuanyang carved mountainsides into rice terraces over 1,300 years ago, and the 500 m FAST radio telescope fills a round karst hollow in Guizhou.',
          '云贵高原和广西一带石灰岩广布，在流水溶蚀作用下形成喀斯特地貌，奇峰林立，溶洞、天坑、地下河众多，桂林漓江山水就是典型代表。这里土层薄、地表水易渗漏，森林被砍伐后容易岩石裸露，形成“石漠化”，如今正通过植树造林逐步治理。昆明海拔约 1890 米、纬度低，四季如春。云南元阳的哈尼族在 1300 多年前就开垦梯田种植水稻；口径 500 米的“中国天眼”（FAST）就建在贵州平塘的喀斯特洼地中。'],
      },
      {
        title: ['Two great deltas', '两大三角洲'], cam: [27, 117, 2.6], items: ['cn_bund', 'fd_dimsum'],
        paint: [{ fill: { k: 'poly', pts: YRD, c: C.teal, clip: CN }, a: 0.55 }, { fill: { k: 'poly', pts: PRD, c: C.orange, clip: CN }, a: 0.55, t: 0.6 }],
        lines: [{ pts: [[22.28, 113.94], [22.25, 113.6]], c: C.gold, w: 1.6, dur: 1, t: 1.8 }, lead([31.2, 121.47], [32.3, 122.6], 0.4, C.gold),
          lead([23.13, 113.26], [24.2, 112.4], 1), lead([22.54, 114.06], [23.4, 115.4], 1.1), lead([22.3, 114.17], [21.6, 115.2], 1.3, C.pink), lead([22.19, 113.54], [20.7, 110.6], 1.5, C.pink)],
        marks: [pin([31.2, 121.47], C.gold, 0.4), mk([32.3, 122.6], 'Shanghai', '上海', { big: true, c: C.gold, t: 0.5 }), mk([32.05, 118.8], 'Nanjing', '南京', { dot: true, c: C.white, t: 0.6 }), mk([30.25, 120.15], 'Hangzhou', '杭州', { dot: true, c: C.white, t: 0.7 }),
          pin([23.13, 113.26], C.white, 1), mk([24.2, 112.4], 'Guangzhou', '广州', { t: 1.1 }), pin([22.54, 114.06], C.white, 1.1), mk([23.4, 115.4], 'Shenzhen', '深圳', { t: 1.2 }),
          pin([22.3, 114.17], C.pink, 1.3), mk([21.6, 115.2], 'Hong Kong SAR', '香港特别行政区', { c: C.pink, t: 1.4 }), pin([22.19, 113.54], C.pink, 1.5), mk([20.7, 110.6], 'Macao SAR', '澳门特别行政区', { c: C.pink, t: 1.6 })],
        body: ['The Yangtze River Delta, a flat land of rivers, canals and water towns, is centred on Shanghai; its city cluster produces about a quarter of China\'s GDP. The Pearl River Delta grew fast after reform and opening-up, and Shenzhen rose from a small town into a city of over 17 million. China resumed sovereignty over Hong Kong in 1997 and Macao in 1999; both are special administrative regions under "one country, two systems". The 55 km Hong Kong–Zhuhai–Macao Bridge (2018) ties them into the Guangdong–Hong Kong–Macao Greater Bay Area.',
          '长江三角洲地势低平，河网密布，水乡古镇众多，以上海为中心的长三角城市群约占全国经济总量的四分之一。珠江三角洲在改革开放后迅速发展，深圳由小镇发展为常住人口超过 1700 万的大城市。我国分别于 1997 年和 1999 年对香港、澳门恢复行使主权，设立特别行政区，实行“一国两制”。全长 55 千米的港珠澳大桥（2018 年通车）把它们紧密连接在粤港澳大湾区中。'],
      },
      {
        title: ['Taiwan and Hainan', '台湾岛与海南岛'], cam: [21.5, 115.5, 2.6], items: ['taipei101', 'sp_wenchang'],
        task: ['Find China\'s two largest islands; which one does the Tropic of Cancer cross?', '找到我国的两个最大岛屿：北回归线穿过哪一个？'],
        paint: [{ fill: { k: 'land', a2: ['TW'], c: C.green }, a: 0.5 }],
        lines: [par(23.44, C.gold, 0.4, { w: 1 }), lead([25.03, 121.56], [25.9, 122.6], 0.6), lead([23.47, 120.96], [23.0, 122.3], 0.9, C.green), lead([23.86, 120.92], [24.3, 122.4], 1.1, C.teal), lead([20.04, 110.34], [19.3, 108.0], 1.6)],
        marks: [pin([25.03, 121.56], C.white, 0.6), mk([25.9, 122.6], 'Taipei', '台北', { t: 0.7 }), pin([23.47, 120.96], C.green, 0.9), mk([23.0, 122.3], 'Yushan 3,952 m', '玉山 3952 米', { c: C.green, t: 1 }),
          pin([23.86, 120.92], C.teal, 1.1), mk([24.3, 122.4], 'Sun Moon Lake', '日月潭', { c: C.teal, t: 1.2 }),
          mk([24.5, 119.4], 'Taiwan Strait', '台湾海峡', { c: C.blue, t: 1.3 }), pin([20.04, 110.34], C.white, 1.6), mk([19.3, 108.0], 'Haikou', '海口', { t: 1.7 }), mk([18.25, 109.5], 'Sanya', '三亚', { dot: true, c: C.white, t: 1.8 }),
          mk([20.25, 111.0], 'Qiongzhou Strait', '琼州海峡', { c: C.blue, t: 2 }), mk([22.9, 111.0], 'Tropic of Cancer', '北回归线', { c: C.gold, t: 2.2 })],
        body: ['Taiwan Province is an inseparable part of China\'s territory, across the Taiwan Strait from Fujian. Taiwan Island (about 36,000 km²), China\'s largest, has high mountains in the east, topped by Yushan at 3,952 m, and plains in the west; the Tropic of Cancer crosses it and it is known as a "treasure island" for its rice, sugar cane, tea and fruit. Hainan Island (about 34,000 km²), the second largest, lies across the Qiongzhou Strait; it is tropical, grows rubber, coconuts and winter vegetables, is building a free trade port and launches rockets from Wenchang.',
          '台湾省是我国领土不可分割的一部分，隔台湾海峡与福建省相望。台湾岛面积约 3.6 万平方千米，是我国第一大岛，东部多高山，玉山海拔 3952 米，西部多平原；北回归线穿过岛的中部，盛产稻米、甘蔗、茶叶和水果，被誉为“宝岛”。海南岛面积约 3.4 万平方千米，是我国第二大岛，隔琼州海峡与雷州半岛相望，属热带季风气候，盛产橡胶、椰子和冬季瓜菜，正在建设自由贸易港，文昌航天发射场也在这里。'],
      },
    ],
    quiz: [
      { q: ['China\'s biggest economic hub, centred on Shanghai, is…', '以上海为中心、我国最大的经济核心区是'], options: [['The Yangtze River Delta', '长江三角洲'], ['The Pearl River Delta', '珠江三角洲'], ['The North China Plain', '华北平原'], ['The Sichuan Basin', '四川盆地']], answer: 0,
        why: ['Shanghai is the leading city of the Yangtze River Delta.', '上海是长江三角洲的核心城市。'] },
      { q: ['Which city\'s climate graph is this?', '这是哪个城市的气候资料图？'], fig: climoFig(GUANGZHOU, true),
        options: [['Guangzhou', '广州'], ['Beijing', '北京'], ['Harbin', '哈尔滨'], ['Turpan', '吐鲁番']], answer: 0,
        why: ['Warm all year (January about 14 °C) with about 1,850 mm of rain peaking in early summer: a subtropical monsoon city in the far south.', '全年温暖（1 月约 14 °C），年降水约 1850 毫米，夏初最多：华南的亚热带季风气候城市。'] },
      { q: ['Match each area to its feature.', '把地区和它的特点连起来。'],
        match: [[['Sichuan Basin', '四川盆地'], ['Purple soil, "Land of Abundance"', '紫色土，“天府之国”']], [['Yunnan–Guizhou Plateau', '云贵高原'], ['Karst peaks and caves', '喀斯特地貌广布']],
          [['Middle–Lower Yangtze Plain', '长江中下游平原'], ['Lakes and paddy fields: "land of fish and rice"', '湖泊众多，“鱼米之乡”']], [['Pearl River Delta', '珠江三角洲'], ['Greater Bay Area with Hong Kong and Macao', '与港澳共建粤港澳大湾区']]],
        why: ['Each landform shapes a different way of life in the south.', '不同的地形区形成了南方各具特色的生产生活方式。'] },
      { q: ['Which describe the southern region? Pick all that apply.', '下列描述中，符合南方地区特征的有（多选）'],
        options: [['Warm and wet, mostly subtropical monsoon', '温暖湿润，以亚热带季风气候为主'], ['Paddy fields growing rice', '耕地以水田为主，种植水稻'], ['Many rivers and lakes', '河湖众多'], ['Rivers freeze in winter', '冬季河流结冰'], ['Dry fields of winter wheat', '以旱地为主，种植冬小麦']], multi: [0, 1, 2],
        why: ['South of the Qinling–Huaihe line, winters stay above 0 °C, rain is plentiful, and the land is laced with rivers, lakes and paddy fields.', '秦岭—淮河以南，1 月平均气温在 0 °C 以上，降水丰富，河湖众多，以水田为主。'] },
      { q: ['Label these places in the southern region.', '在地球上标出南方地区的这些地方。'],
        place: [{ text: ['Yangtze River Delta', '长江三角洲'], at: [31, 120.5], tolKm: 350 }, { text: ['Pearl River Delta', '珠江三角洲'], at: [22.8, 113.5], tolKm: 300 }, { text: ['Sichuan Basin', '四川盆地'], at: [30.4, 105.5], tolKm: 350 }, { text: ['Hainan Island', '海南岛'], at: [19.2, 109.7], tolKm: 250 }],
        why: ['The two great deltas are on the coast; the Sichuan Basin is in the upper Yangtze; Hainan lies across the Qiongzhou Strait.', '两大三角洲位于沿海；四川盆地位于长江上游；海南岛隔琼州海峡与大陆相望。'] },
      { q: ['Dujiangyan was built in 256 BC. About how many years had it been working by AD 2025?', '都江堰建于公元前 256 年。到公元 2025 年，它已经使用了大约多少年？'], num: { answer: 2280, tol: 10, unit: ['years', '年'] },
        why: ['256 + 2025 − 1 = 2,280 years (there is no year 0), and it still waters the Chengdu Plain.', '256 + 2025 − 1 = 2280 年（没有公元 0 年），它至今仍在灌溉成都平原。'] },
      { q: ['Put these Yangtze cities in order, from upstream to the sea.', '把下列长江沿岸城市按从上游到入海口的顺序排列。'],
        order: [['Chongqing', '重庆'], ['Wuhan', '武汉'], ['Nanjing', '南京'], ['Shanghai', '上海']],
        why: ['Chongqing is at the head of the Three Gorges, Wuhan in the middle course, Nanjing on the lower course and Shanghai at the mouth.', '重庆位于三峡上游，武汉在中游，南京在下游，上海在长江入海口。'] },
      { q: ['Why did China build the 500 m FAST radio telescope in a karst hollow in Guizhou?', '为什么“中国天眼”FAST 建在贵州的喀斯特洼地中？'],
        options: [['The round hollow is a ready-made bowl, rain drains away through the limestone, and the remote hills block radio noise', '圆形洼地天然像一口“锅”，雨水可经石灰岩渗漏排走，偏远山区无线电干扰少'], ['Guizhou has the flattest land in China', '贵州是我国地势最平坦的地方'], ['It never rains in Guizhou', '贵州从不下雨'], ['It is next to a big city for visitors', '靠近大城市，方便游客']], answer: 0,
        why: ['Karst gave a natural dish shape, good underground drainage and a quiet, sparsely populated setting; little earth had to be moved.', '喀斯特洼地提供了天然的碗形地形、良好的地下排水条件和人烟稀少、电磁环境安静的环境，大大减少了开挖量。'] },
    ],
  },
  {
    id: 'china-west', strand: 'china', tracks: [], grade: 'g8b', unit: regions, icon: 'mountain', minutes: 11,
    title: ['The northwest and the Qinghai–Tibet region', '西北地区和青藏地区'],
    blurb: ['Grassland, oases and deserts in the dry northwest; energy and green walls; the high, cold roof of the world.', '干旱的西北：草原、绿洲与荒漠，能源与防沙治沙；高寒的青藏：世界屋脊与江河之源。'],
    keys: [
      ['The northwest (about 30% of the land, 4% of the people) is dry; from east to west grassland turns to desert grassland and desert.', '西北地区面积约占全国的 30%，人口约占 4%，气候干旱；自东向西由草原过渡到荒漠草原和荒漠。'],
      ['Herding is the main farming on the grasslands; oasis and irrigated farming use mountain meltwater or the Yellow River.', '草原以畜牧业为主；绿洲农业和河套、宁夏平原的灌溉农业依靠高山冰雪融水或黄河水。'],
      ['Overgrazing, over-cultivation and water misuse spread desert; shelterbelts, straw grids and grazing limits fight back.', '过度放牧、过度开垦和不合理利用水资源导致土地荒漠化，可通过营造防护林、草方格固沙和以草定畜等治理。'],
      ['The Qinghai–Tibet region (about 25% of the land, under 1% of the people) is high and cold: the "roof of the world".', '青藏地区面积约占全国的 25%，人口不足 1%，突出的自然特征是高寒，被称为“世界屋脊”。'],
      ['Sanjiangyuan is the source of the Yangtze, Yellow and Lancang rivers and must be protected.', '三江源是长江、黄河、澜沧江的发源地，生态保护十分重要。'],
    ],
    steps: [
      {
        title: ['Two vast, empty regions', '地广人稀的两大区域'], cam: [37, 95, 4], sketch: true,
        paint: [...fourRegions(0.2), { fill: { k: 'poly', pts: NW_POLY, c: REGION_C.nw, clip: CN }, a: 0.55, t: 0.4 }, { fill: { k: 'poly', pts: QT_POLY, c: REGION_C.qt, clip: CN }, a: 0.55, t: 0.9 }],
        lines: [{ pts: NW_LINE, c: C.white, w: 1.6, dur: 1.6 }, { pts: QT_EDGE, c: C.white, w: 1.6, dur: 2, t: 0.6 }],
        marks: [mk([42.5, 95], 'Northwest region', '西北地区', { big: true, c: C.orange, t: 0.6 }), mk([32.5, 88], 'Qinghai–Tibet region', '青藏地区', { big: true, c: C.violet, t: 1.1 }),
          mk([39.4, 98.5], 'Kunlun–Altun–Qilian', '昆仑山—阿尔金山—祁连山', { c: C.white, t: 1.6 }), mk([37.2, 102.9], 'Wushaoling', '乌鞘岭', { dot: true, c: C.white, t: 1.8 })],
        fig: regionKey,
        body: ['West of the Greater Khingan and north of the Great Wall and the Kunlun–Altun–Qilian mountains lies the northwest region: about 30% of China\'s land but only about 4% of its people. South of those mountains and west of the Hengduan Mountains rises the Qinghai–Tibet region: about a quarter of the land, yet fewer than one person in a hundred lives there. One is dry, the other high and cold; both are huge and thinly peopled, but rich in energy, minerals and scenery.',
          '大兴安岭以西、长城和昆仑山—阿尔金山—祁连山以北是西北地区，面积约占全国的 30%，人口只约占 4%。昆仑山—阿尔金山—祁连山以南、横断山脉以西是青藏地区，面积约占全国的四分之一，人口却不到全国的 1%。前者干旱，后者高寒，两地都地广人稀，但能源、矿产和旅游资源丰富。'],
      },
      {
        title: ['Drier and drier towards the west', '自东向西愈加干旱'], cam: [42, 98, 3.4], sketch: true,
        task: ['Travel west from Inner Mongolia into Xinjiang: watch grassland give way to desert grassland and then desert.', '从内蒙古向西到新疆：观察草原怎样逐渐变为荒漠草原，再变为荒漠。'],
        paint: [{ fill: { k: 'poly', pts: NW_POLY, c: C.gold, clip: CN }, a: 0.2 },
          { fill: { k: 'poly', pts: [[50, 112], [50, 122.5], [47.5, 120], [43.5, 118], [41.5, 113.5], [42, 112]], c: C.lime, clip: CN }, a: 0.55, t: 0.6 },
          { fill: { k: 'poly', pts: [[45, 104], [50, 112], [42, 112], [41.5, 113.5], [41, 109.5], [39.5, 106.5], [38, 105.5], [40, 104]], c: C.brown, clip: CN }, a: 0.5, t: 1.2 },
          { fill: { k: 'poly', pts: [[50, 73], [45, 104], [40, 104], [38, 105.5], [37.5, 101.5], [38.5, 98.5], [37.5, 96], [36.3, 92], [36.3, 88], [35.8, 84], [36, 80], [36, 76.5], [37.5, 73]], c: C.orange, clip: CN }, a: 0.5, t: 1.8 }],
        lines: [...arrows([[[44, 118], [43, 110]], [[43, 108], [42, 98]], [[42, 96], [41, 86]]], C.white, 2.4, 1.6)],
        marks: [mk([45, 116], 'Grassland', '草原', { c: C.lime, t: 0.8 }), mk([42, 107], 'Desert grassland', '荒漠草原', { c: C.brown, t: 1.4 }), mk([39, 84], 'Desert', '荒漠', { big: true, c: C.orange, t: 2 }), mk([47, 95], 'Rain decreases →', '降水减少 →', { c: C.white, t: 2.6 })],
        fig: { k: 'bars', title: ['Yearly rainfall (approx.)', '年降水量（约）'], unit: ['mm', '毫米'], rows: [
          { name: ['Hohhot', '呼和浩特'], v: 400, c: C.lime }, { name: ['Baotou', '包头'], v: 300, c: C.lime }, { name: ['Yinchuan', '银川'], v: 190, c: C.brown }, { name: ['Kashgar', '喀什'], v: 65, c: C.orange }, { name: ['Turpan', '吐鲁番'], v: 16, c: C.orange }] },
        body: ['The northwest lies deep inside Eurasia, thousands of kilometres from the sea, and mountains block the moist summer monsoon. So it is dry, and gets drier from east to west: from about 400 mm of rain at Hohhot to only about 16 mm at Turpan. The landscape changes with it, from the grasslands of eastern Inner Mongolia to desert grassland and then to the deserts of the Tarim Basin. With little cloud to hold heat, summers are hot, winters cold and days much warmer than nights.',
          '西北地区深居亚欧大陆内部，距海遥远，加上山地阻挡，湿润的夏季风难以到达，气候干旱。降水自东向西递减，从呼和浩特的约 400 毫米减少到吐鲁番的约 16 毫米。景观也随之变化，由内蒙古东部的草原逐渐过渡为荒漠草原，再到塔里木盆地的荒漠。这里云量少，夏季炎热、冬季寒冷，气温日较差大。'],
      },
      {
        title: ['Grassland herding', '草原牧业'], cam: [45, 113, 2.8], items: ['an_yak'],
        task: ['Find the Hulunbuir and Xilingol grasslands and the Ili valley.', '找到呼伦贝尔草原、锡林郭勒草原和伊犁河谷。'],
        paint: [{ fill: { k: 'poly', pts: [[50, 112], [50, 122.5], [47.5, 120], [43.5, 118], [41.5, 113.5], [42, 112]], c: C.lime, clip: CN }, a: 0.5 }],
        marks: [mk([49.2, 119.7], 'Hulunbuir: Sanhe cattle and horses', '呼伦贝尔：三河牛、三河马', { dot: true, c: C.lime, t: 0.4 }), mk([43.9, 116.1], 'Xilingol grassland', '锡林郭勒草原', { dot: true, c: C.lime, t: 0.8 }),
          mk([43.9, 81.3], 'Ili valley: Ili horses', '伊犁河谷：伊犁马', { dot: true, c: C.lime, t: 1.2 }), mk([40.8, 111.7], 'Hohhot: dairy', '呼和浩特：乳业', { dot: true, c: C.white, t: 1.6 })],
        body: ['Grassland is the northwest\'s main resource. The meadows of Hulunbuir and Xilingol, and the Ili valley in Xinjiang, raise famous breeds of cattle, horses and sheep, and Inner Mongolia produces about a fifth of China\'s milk. Too many animals strip the grass, so the soil dries out and blows away. Herders now limit herds to what the grass can feed, rest pastures in turn, fence and reseed degraded land and keep animals in sheds in winter, with state subsidies for protecting grassland.',
          '草原是西北地区最重要的资源。内蒙古的呼伦贝尔、锡林郭勒草原和新疆的伊犁河谷，培育了三河牛、三河马、伊犁马等优良畜种，内蒙古的牛奶产量约占全国的五分之一。牲畜过多会把草啃光，土壤变干后被风吹走。如今牧民实行以草定畜、划区轮牧、围栏封育、补播牧草和冬季舍饲圈养，国家还发放草原生态保护补助奖励。'],
      },
      {
        title: ['Oases and irrigated plains', '绿洲农业与灌溉农业'], cam: [40, 96, 3], items: ['cn_mogao', 'vy_silkroad'],
        task: ['Find the oases of the Hexi Corridor, the Tarim River, Turpan, and the Hetao and Ningxia plains on the Yellow River.', '找到河西走廊的绿洲、塔里木河、吐鲁番，以及黄河沿岸的河套平原和宁夏平原。'],
        paint: [{ fill: { k: 'poly', pts: REGIONS.tarim, c: C.orange, clip: CN }, a: 0.4 }, { fill: { k: 'poly', pts: HETAO_PLAIN, c: C.green, clip: CN }, a: 0.7, t: 1.6 }, { fill: { k: 'poly', pts: NINGXIA_PLAIN, c: C.green, clip: CN }, a: 0.7, t: 1.8 }],
        lines: [{ pts: TARIM_RIVER, c: C.blue, w: 1.8, flow: true, arrow: true, dur: 1.8, t: 0.4 }, { pts: YELLOW.slice(YR.lanzhou, YR.hekou + 1), c: C.gold, w: 1.6, flow: true, arrow: true, dur: 1.6, t: 1.4 }],
        marks: [mk([39, 83.5], 'Taklimakan Desert', '塔克拉玛干沙漠', { big: true, c: C.orange, t: 0.3 }), mk([41.0, 85.3], 'Tarim River', '塔里木河', { c: C.blue, t: 0.8 }), mk([42.95, 89.19], 'Turpan', '吐鲁番', { dot: true, c: C.green, t: 1 }),
          mk([40.14, 94.66], 'Dunhuang', '敦煌', { dot: true, c: C.green, t: 1.1 }), mk([39.73, 98.49], 'Jiuquan', '酒泉', { dot: true, c: C.green, t: 1.2 }), mk([38.93, 100.45], 'Zhangye', '张掖', { dot: true, c: C.green, t: 1.3 }), mk([37.93, 102.64], 'Wuwei', '武威', { dot: true, c: C.green, t: 1.4 }),
          mk([40.9, 108.4], 'Hetao Plain', '河套平原', { c: C.green, t: 1.8 }), mk([38.47, 106.27], 'Ningxia Plain', '宁夏平原', { c: C.green, t: 2 })],
        fig: oasisFig,
        body: ['Where meltwater from the snows of the Tianshan, Kunlun and Qilian mountains reaches the desert edge, it soaks into gravel fans and springs up again as oases, strung like beads along the Hexi Corridor and around the Tarim Basin. The Tarim, China\'s longest inland river, skirts the Taklimakan, China\'s largest desert. In Turpan, karez wells and tunnels carry water underground so that little is lost to evaporation. Along the Yellow River, canals turn the Hetao and Ningxia plains into green farmland, "a southern land beyond the Great Wall".',
          '天山、昆仑山、祁连山的冰雪融水流到山麓，渗入洪积—冲积扇的砾石层，又在扇缘以泉水形式出露，形成绿洲，像串珠一样分布在河西走廊和塔里木盆地边缘。塔里木河是我国最长的内流河，流经我国最大的沙漠——塔克拉玛干沙漠的北缘。吐鲁番的坎儿井由竖井和暗渠组成，在地下输水，减少了蒸发。黄河沿岸的河套平原和宁夏平原引黄灌溉，被誉为“塞上江南”。'],
      },
      {
        title: ['Holding back the desert', '防治荒漠化'], cam: [40, 106, 2.8],
        task: ['Find Shapotou, Kubuqi and Mu Us: how did people stop the sand here?', '找到沙坡头、库布齐和毛乌素：人们是怎样在这里治沙的？'],
        paint: [{ fill: { k: 'poly', pts: [[40.7, 107.2], [40.6, 110.3], [40.0, 111.3], [39.9, 109.0], [40.1, 107.6]], c: C.green, clip: CN }, a: 0.55 }, { fill: { k: 'poly', pts: [[39.4, 108.2], [39.3, 110.3], [38.0, 110.0], [37.5, 108.5], [38.3, 107.6]], c: C.green, clip: CN }, a: 0.55, t: 0.4 }],
        lines: [{ pts: FARM_PASTURE.slice(2, 7), c: C.lime, w: 3, dur: 1.6, t: 1 }],
        marks: [mk([40.3, 108.7], 'Kubuqi Desert', '库布齐沙漠', { c: C.green, t: 0.4 }), mk([38.5, 109.2], 'Mu Us Sandy Land', '毛乌素沙地', { c: C.green, t: 0.7 }),
          mk([37.46, 104.97], 'Shapotou: straw grids since the 1950s', '沙坡头：20 世纪 50 年代起草方格固沙', { dot: true, c: C.gold, t: 1.2 }), mk([39.5, 84], 'Taklimakan: green belt closed 2024', '塔克拉玛干：2024 年绿色阻沙带合龙', { c: C.lime, t: 1.8 })],
        fig: { k: 'bars', title: ['Forest cover in the Three-North Shelterbelt area', '“三北”工程区森林覆盖率'], unit: ['%', '%'], rows: [
          { name: ['1977, before the project', '1977 年（工程前）'], v: 5.05, c: C.brown }, { name: ['2017', '2017 年'], v: 13.84, c: C.green }] },
        body: ['Desertification is good land turning into desert. A dry, windy climate makes the northwest vulnerable, but people made it worse by overgrazing, ploughing up grassland and wasting river water. Since 1978 the Three-North Shelterbelt has planted belts of trees and shrubs across the north, raising forest cover in its area from 5% to nearly 14%. At Shapotou, grids of straw pressed into the dunes have protected the Baotou–Lanzhou railway since the 1950s, the Mu Us sandy land has largely turned green, and in 2024 a 3,046 km ring of plants was closed around the Taklimakan.',
          '土地荒漠化是指土地退化为类似荒漠的景观。西北地区气候干旱、多大风，生态环境脆弱，过度放牧、过度开垦和不合理利用水资源又加剧了荒漠化。1978 年起，我国实施“三北”防护林体系建设工程，工程区森林覆盖率从约 5% 提高到近 14%。宁夏沙坡头自 20 世纪 50 年代起用麦草方格固沙，保护包兰铁路畅通；毛乌素沙地大部分已披上绿装；2024 年，环绕塔克拉玛干沙漠、长 3046 千米的绿色阻沙防护带全面合龙。'],
      },
      {
        title: ['Energy and minerals', '能源与矿产'], cam: [39, 92, 3], items: ['sp_jiuquan'],
        task: ['Find the oil and gas fields, the Qaidam salt lakes and the solar parks, then follow the pipeline east.', '找到油气田、柴达木盆地的盐湖和光伏电站，再沿着管道向东追踪。'],
        lines: [{ pts: GAS_PIPE, c: C.teal, w: 1.8, flow: true, arrow: true, dur: 2.6, t: 1.4 }],
        marks: [mk([45.6, 84.9], 'Karamay oilfield', '克拉玛依油田', { dot: true, c: C.gold, t: 0.3 }), mk([41.78, 84.25], 'Tarim oil and gas', '塔里木油气田', { dot: true, c: C.gold, t: 0.6 }),
          mk([36.8, 95.0], 'Qarhan Salt Lake: potash', '察尔汗盐湖：钾盐', { dot: true, c: C.white, t: 0.9 }), mk([36.4, 94.9], 'Golmud', '格尔木', { dot: true, c: C.white, t: 1.1 }), mk([37.5, 94.5], 'Qaidam Basin: "treasure basin"', '柴达木盆地：“聚宝盆”', { c: C.gold, t: 1.2 }),
          mk([36.1, 100.6], 'Talatan solar park', '塔拉滩光伏电站', { dot: true, c: C.orange, t: 1.6 }), mk([41.0, 104.0], 'Wind and solar bases', '风电、光伏基地', { c: C.orange, t: 2 })],
        body: ['The dry northwest is rich in energy. Karamay was New China\'s first big oilfield, the Tarim and Junggar basins hold oil and gas, and Xinjiang and Inner Mongolia mine huge amounts of coal. The Qaidam Basin is called a "treasure basin": Qarhan Salt Lake supplies most of China\'s potash fertiliser. Clear skies and strong winds now power vast solar and wind parks such as Talatan in Qinghai, where panels shade the ground so grass grows back and sheep graze beneath them. Pipelines and power lines send this energy to the east.',
          '干旱的西北地区能源丰富。克拉玛依是新中国成立后开发的第一个大油田，塔里木盆地和准噶尔盆地蕴藏着丰富的石油和天然气，新疆、内蒙古煤炭产量巨大。柴达木盆地被称为“聚宝盆”，察尔汗盐湖是我国最大的钾肥生产基地。这里晴天多、风力强，建起了大型光伏和风电基地，如青海塔拉滩光伏电站，光伏板遮阴减少蒸发，板下牧草重新生长，可以放羊。“西气东输”“西电东送”把这些能源输往东部。'],
      },
      {
        title: ['The roof of the world', '世界屋脊'], cam: [31, 90, 2.8], items: ['everest', 'potala'],
        paint: [{ fill: { k: 'poly', pts: QT_POLY, c: C.violet, clip: CN }, a: 0.4 }],
        lines: [{ pts: QT_RIVERS.yarlung, c: C.blue, w: 1.8, flow: true, arrow: true, dur: 1.8, t: 0.8 }, { pts: QT_RIVERS.lhasa, c: C.blue, w: 1.3, flow: true, dur: 1, t: 1.2 }],
        marks: [mk([34, 88], 'Over 4,000 m on average', '平均海拔 4000 米以上', { big: true, c: C.violet, t: 0.4 }), mk([27.99, 86.93], 'Qomolangma 8,848.86 m', '珠穆朗玛峰 8848.86 米', { dot: true, c: C.white, t: 1 }),
          mk([29.65, 91.1], 'Lhasa ≈3,650 m', '拉萨约 3650 米', { dot: true, c: C.gold, t: 1.4 }), mk([29.3, 88.88], 'Shigatse', '日喀则', { dot: true, c: C.white, t: 1.6 }), mk([29.0, 93.5], 'Yarlung Zangbo valley: highland barley', '雅鲁藏布江谷地：青稞', { c: C.lime, t: 2 })],
        fig: { k: 'climo', city: 'lhasa', b: 'shanghai' },
        body: ['The Qinghai–Tibet Plateau averages over 4,000 m, topped by Qomolangma (Everest), 8,848.86 m (2020 survey). Its key feature is "high and cold": air cools by about 0.6 °C for every 100 m, so Lhasa, at about the latitude of Shanghai, is far cooler in summer. The air is thin and clear, so sunshine is fierce (about 3,000 hours a year in Lhasa, the "city of sunlight"), but the thin air keeps little heat. Crops grow only in warm, sheltered valleys like the Yarlung Zangbo, where highland barley grows; elsewhere herders raise yaks, the "boat of the plateau".',
          '青藏高原平均海拔 4000 米以上，最高峰珠穆朗玛峰海拔 8848.86 米（2020 年测定）。“高寒”是青藏地区最突出的自然特征：海拔每升高 100 米，气温约下降 0.6 °C，因此与上海纬度相近的拉萨，夏季要凉爽得多。这里空气稀薄、洁净，太阳辐射强，拉萨年日照约 3000 小时，被称为“日光城”，但稀薄的空气保温能力差。种植业主要分布在雅鲁藏布江谷地等河谷地区，主要作物是青稞；其他地区以畜牧业为主，牦牛被称为“高原之舟”。'],
      },
      {
        title: ['Asia\'s water tower and the sky railway', '亚洲水塔与青藏铁路'], cam: [33.5, 95, 2.6], sketch: true, items: ['vh_qinghaitibet'],
        task: ['Find Sanjiangyuan, where the Yangtze, the Yellow River and the Lancang begin, then follow the railway to Lhasa.', '找到长江、黄河、澜沧江的发源地——三江源，再沿铁路前往拉萨。'],
        paint: [{ fill: { k: 'poly', pts: SANJIANGYUAN_AREA, c: C.teal, clip: CN }, a: 0.4 }],
        lines: [{ pts: QT_RIVERS.tuotuo, c: C.blue, w: 2, flow: true, arrow: true, dur: 1, t: 0.4 }, { pts: YANGTZE.slice(2, 8), c: C.blue, w: 2, flow: true, arrow: true, dur: 1.4, t: 0.8 }, { pts: QT_RIVERS.yellowSource, c: C.gold, w: 2, flow: true, arrow: true, dur: 1.2, t: 1 },
          { pts: QT_RIVERS.lancang, c: C.green, w: 2, flow: true, arrow: true, dur: 1.4, t: 1.2 }, { pts: QT_RAIL, c: C.violet, w: 2.2, dur: 2.6, flow: true, t: 1.8 }],
        marks: [mk([34.6, 97.5], 'Sanjiangyuan National Park', '三江源国家公园', { big: true, c: C.teal, t: 0.2 }), mk([33.2, 91.6], 'Yangtze source', '长江源', { c: C.blue, t: 1 }), mk([35.25, 96.8], 'Yellow River source', '黄河源', { c: C.gold, t: 1.2 }),
          mk([32.4, 96.6], 'Lancang source', '澜沧江源', { c: C.green, t: 1.4 }), mk([36.62, 101.78], 'Xining', '西宁', { dot: true, c: C.white, t: 1.8 }), mk([32.9, 91.9], 'Tanggula Pass 5,072 m', '唐古拉山口 5072 米', { dot: true, c: C.ice, t: 2.6 }),
          mk([35.3, 92.0], 'Hoh Xil: Tibetan antelope', '可可西里：藏羚羊', { c: C.green, t: 3 })],
        body: ['Glaciers and snowfields make the plateau "Asia\'s water tower". In Qinghai, Sanjiangyuan ("source of three rivers") feeds the Yangtze, the Yellow River and the Lancang; its fragile grassland and wetlands, harmed by overgrazing and warming, became one of China\'s first national parks in 2021. The Qinghai–Tibet Railway runs about 1,956 km from Xining to Lhasa and crosses the Tanggula Pass at 5,072 m; builders overcame frozen ground, thin air and a fragile environment and left passages for migrating Tibetan antelope, whose numbers in the Hoh Xil area have since recovered strongly.',
          '青藏高原冰川广布，被称为“亚洲水塔”。青海的三江源是长江、黄河、澜沧江的发源地，这里的草地和湿地生态脆弱，过度放牧和气候变暖都会对其造成破坏，2021 年设立为我国首批国家公园之一。青藏铁路从西宁到拉萨全长约 1956 千米，在唐古拉山口海拔 5072 米，是世界上海拔最高的铁路。建设者克服了多年冻土、高寒缺氧和生态脆弱三大难题，还为藏羚羊修建了迁徙通道；如今可可西里一带的藏羚羊数量已明显回升。'],
      },
    ],
    quiz: [
      { q: ['Why is the northwest so dry?', '西北地区气候干旱的主要原因是'], options: [['It is far from the sea and mountains block moist winds', '深居内陆，距海远，山地阻挡湿润气流'], ['It is too high', '海拔太高'], ['It is near the Equator', '靠近赤道'], ['It has too many people', '人口太多']], answer: 0,
        why: ['The summer monsoon hardly reaches it.', '夏季风很难到达。'] },
      { q: ['Going west from the east of Inner Mongolia into Xinjiang, in what order does the land change?', '从内蒙古东部向西到新疆，景观依次变为'],
        order: [['Grassland', '草原'], ['Desert grassland', '荒漠草原'], ['Desert', '荒漠']],
        why: ['The further from the sea, the less rain falls, so the landscape changes from grassland to desert grassland to desert.', '距海越远，降水越少，景观由草原逐渐过渡为荒漠草原，再到荒漠。'] },
      { q: ['Which place does this mystery climate graph show?', '这幅气候资料图最可能是哪个地方的？'], fig: climoFig(TURPAN, true),
        options: [['Turpan', '吐鲁番'], ['Lhasa', '拉萨'], ['Guangzhou', '广州'], ['Harbin', '哈尔滨']], answer: 0,
        why: ['Hardly any rain (about 16 mm a year) and July above 30 °C: an oasis in a hot, dry basin.', '全年降水只有约 16 毫米，7 月均温超过 30 °C：炎热干燥盆地中的绿洲。'] },
      { q: ['Label these places in western China.', '在地球上标出我国西部的这些地方。'],
        place: [{ text: ['Turpan', '吐鲁番'], at: [42.95, 89.2], tolKm: 350 }, { text: ['Dunhuang', '敦煌'], at: [40.1, 94.7], tolKm: 350 }, { text: ['Sanjiangyuan', '三江源'], at: [34.2, 95.5], tolKm: 400 }, { text: ['Lhasa', '拉萨'], at: [29.65, 91.1], tolKm: 350 }],
        why: ['Turpan and Dunhuang are oases on the old Silk Road; Sanjiangyuan is on the Qinghai–Tibet Plateau; Lhasa lies in a river valley in Xizang.', '吐鲁番和敦煌是古丝绸之路上的绿洲；三江源在青藏高原上；拉萨位于西藏的河谷中。'] },
      { q: ['Air cools by about 0.6 °C for every 100 m you climb. Lhasa is about 3,650 m high. About how many degrees colder does its height alone make it?', '海拔每升高 100 米，气温约下降 0.6 °C。拉萨海拔约 3650 米，仅因海拔，它的气温比海平面约低多少摄氏度？'], num: { answer: 22, tol: 1.5, unit: ['°C', '°C'] },
        why: ['3,650 ÷ 100 × 0.6 ≈ 22 °C. That is why Lhasa\'s July is about 12 °C cooler than Shanghai\'s, though they lie at similar latitudes.', '3650 ÷ 100 × 0.6 ≈ 22 °C。所以拉萨与上海纬度相近，7 月均温却比上海低约 12 °C。'] },
      { q: ['Match each place to what it is known for.', '把地方和它的特色连起来。'],
        match: [[['Turpan', '吐鲁番'], ['Karez and sweet grapes', '坎儿井、葡萄']], [['Qarhan Salt Lake', '察尔汗盐湖'], ['Potash for fertiliser', '钾盐、钾肥']], [['Shapotou', '沙坡头'], ['Straw grids that hold the dunes', '草方格固沙']],
          [['Hoh Xil', '可可西里'], ['Tibetan antelope', '藏羚羊']], [['Yarlung Zangbo valley', '雅鲁藏布江谷地'], ['Highland barley', '青稞']]],
        why: ['Each place uses or protects its environment in its own way.', '各地因地制宜，利用和保护自然环境的方式各不相同。'] },
      { q: ['Which help stop land turning to desert in the northwest? Pick all that apply.', '下列措施中，有利于防治西北地区土地荒漠化的有（多选）'],
        options: [['Planting shelterbelts of trees and shrubs', '营造防风固沙林'], ['Straw grids on the dunes', '设置草方格沙障'], ['Keeping herds to what the grass can feed', '以草定畜，合理放牧'], ['Ploughing up more grassland for crops', '开垦更多草原种粮'], ['Pumping more river water to new farms', '大量引河水开垦新农田']], multi: [0, 1, 2],
        why: ['Plants and straw grids hold sand and grazing limits let grass recover; ploughing grassland and overusing rivers spread desert.', '植树种草、草方格固沙和以草定畜都有助于防沙治沙；开垦草原、过度用水会加剧荒漠化。'] },
      { q: ['Lhasa has some of the strongest sunshine in China, yet its summers are cool. What best explains this?', '拉萨太阳辐射强，夏季却很凉爽。最合理的解释是'],
        options: [['The thin, clear air lets sunlight through but holds little heat', '空气稀薄洁净，太阳辐射强，但大气保温作用弱'], ['Lhasa is close to the Arctic Circle', '拉萨靠近北极圈'], ['Heavy rain cools it all summer', '夏季终日大雨降温'], ['It has very short days in summer', '夏季白昼很短']], answer: 0,
        why: ['Height means thin air: strong sunlight reaches the ground, but there is little air (and water vapour) to keep the warmth, so temperatures stay low.', '海拔高、空气稀薄：太阳辐射容易到达地面，但大气中空气和水汽少，保温作用弱，所以气温低。'] },
    ],
  },
];
