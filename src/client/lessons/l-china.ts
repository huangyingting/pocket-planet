/** 八上 · 中国的自然环境: landforms and the three steps of terrain; climate (temperature, rainfall, monsoons) and rivers. */
import { C, T, arrows, mk, type Fig, type LL, type Lesson, type Pair } from './kit.ts';
import { svg, tx, type Lx } from './figs.ts';
import { CLIMATES } from './climate.ts';
import { MONSOON_LINE, MONSOON_REGION, QINLING_HUAIHE, REGIONS, STEP1, STEP2, STEP_POLYS } from './geo.ts';
import { QT_EDGE, NS_LINE, QT_POLY, SOUTH_POLY, YANGTZE, YZ, YELLOW, YR, LOESS_PLATEAU, NE_PLAINS } from './geo-cn.ts';
import { ALTAI, TIANSHAN, KUNLUN, TAIHANG, TW_RANGES, JUNGGAR, TARIM, TAKLIMAKAN } from './geo-cn2.ts';

const unit = ['China\'s natural environment', '中国的自然环境'] as const;
const CN = ['CN', 'TW'];

// ------------------------------------------------------------------------------------------------ landform sketches

const INNER_MONGOLIA: LL[] = [[50.3, 116.5], [50, 120], [47.5, 120], [44.5, 118.3], [42.5, 116.5], [41.6, 114.5], [41.2, 112], [41.0, 109.5], [40.7, 106.5],
  [40.0, 104.0], [40.0, 101.5], [41.3, 98.5], [42.6, 96.5], [45, 96], [46.5, 104], [47.5, 112], [49.5, 114]];
const YUNGUI: LL[] = [[27.5, 100.2], [28.3, 103.0], [28.6, 105.0], [28.4, 107.0], [28.0, 108.8], [27.0, 109.3], [25.8, 108.5], [24.8, 107.2], [23.8, 105.5],
  [23.4, 103.5], [23.6, 101.5], [24.8, 100.3], [26.2, 99.8]];
const QAIDAM: LL[] = [[38.3, 90.5], [38.6, 92.5], [38.4, 94.5], [37.8, 96.5], [37.3, 98.2], [36.6, 98.5], [36.0, 97.3], [36.1, 95.0], [36.6, 93.0], [37.3, 91.2]];
const YZ_PLAIN: LL[] = [[30.9, 111.6], [31.0, 113], [30.9, 114.5], [31.0, 116], [31.7, 117], [32.3, 118.5], [32.7, 119.8], [32.3, 121.0], [31.7, 121.9],
  [31.0, 121.9], [30.7, 121.0], [30.6, 120], [30.6, 118], [30.0, 117], [29.4, 116.6], [28.6, 116.2], [28.8, 115.7], [29.5, 115], [29.6, 114], [28.8, 113.2],
  [28.3, 112.6], [28.9, 112], [29.6, 112], [30.3, 111.4]];
const SHANDONG_HILLS: LL[] = [[37.6, 122.5], [37.3, 121], [36.9, 119.8], [36.9, 118.6], [36.6, 117], [36.1, 116.6], [35.4, 117.2], [35.0, 118.4], [35.6, 119.6],
  [36.3, 120.5], [36.9, 122.3]];
const LIAODONG_HILLS: LL[] = [[42.0, 124.0], [41.6, 125.5], [40.6, 124.6], [39.8, 123.2], [39.0, 121.8], [38.8, 121.2], [39.5, 121.4], [40.5, 122.3], [41.3, 123.2]];

/** Mountain ranges grouped by trend (sketch traces). */
const MTN = {
  yinshan: [[40.9, 106.6], [41.1, 108], [40.9, 109.8], [40.8, 111.5], [41.0, 113], [41.4, 114.5], [41.6, 116]],
  qinling: QINLING_HUAIHE.slice(0, 3),
  nanling: [[25.4, 110], [25.2, 111.5], [25.1, 113], [24.9, 114.5], [24.8, 115.5]],
  khingan: [[52.5, 122.5], [50.5, 121.5], [48, 120], [46, 119.3], [44, 118.5], [42.5, 117.4]],
  wushan: [[31.6, 109.8], [31.0, 110.2], [30.5, 110.0]],
  xuefeng: [[28.6, 111], [27.6, 110.6], [26.6, 110.3], [26, 110]],
  changbai: [[43.3, 129.3], [42.3, 128.1], [41.6, 127], [40.9, 125.8]],
  wuyi: [[28.4, 118], [27.5, 117.4], [26.6, 116.8], [25.6, 116.3]],
  helan: [[39.3, 106.1], [38.8, 105.9], [38.3, 105.8], [37.8, 105.7]],
  hengduan: [[31.5, 99.5], [30, 99.5], [28.5, 99], [27, 99], [25.5, 99.3]],
  qilian: [[39.6, 96.5], [39, 98.5], [38.4, 100], [37.6, 101.8], [37, 102.8]],
  himalaya: [[35.5, 74.6], [34, 76.5], [32.3, 78.6], [30.6, 80.8], [29.5, 82.6], [28.6, 84.3], [27.99, 86.93], [27.9, 88.5], [27.8, 90.5], [27.9, 92.2], [28.3, 94], [29.4, 95.5]],
} satisfies Record<string, LL[]>;
const TREND = { ew: C.gold, nesw: C.orange, ns: C.teal, nwse: C.pink, arc: C.white };
const ln = (pts: LL[], c: string, t = 0, w = 1.8) => ({ pts, c, t, w, dur: 1.2 });

// ------------------------------------------------------------------------------------------------ climate sketches

const ISO800: LL[] = [...[...QINLING_HUAIHE].reverse(), [32.5, 103.8], [30.5, 102.5], [29, 101.5], [27.8, 100.2], [28.0, 98.7], [28.6, 97.2], [29.2, 95.6], [28.6, 94.0], [27.9, 92.0]];
const ISO400: LL[] = [[52.5, 122], [49, 120.5], [46, 119.5], [43.5, 117.5], [41.5, 115.5], [40.8, 114.9], [40, 112], [38.3, 109.7], [37, 106], [36.06, 103.8],
  [36.4, 101.5], [35.3, 99.5], [33.5, 96], [31.8, 93], [29.8, 91.3], [28.9, 90.3], [28.0, 89.6]];
const ISO200: LL[] = [[44, 112.5], [43, 112], [41.6, 110], [41, 108.5], [39.5, 106.3], [38.2, 104], [38.6, 101], [38, 99], [36.4, 98.6], [34.5, 97.6], [33.4, 94],
  [32, 89], [31.2, 84], [30.8, 80.5]];
const rev = (p: LL[]) => [...p].reverse();
const WET: LL[] = [...ISO800, [26.5, 92], [20, 98], [15, 110], [15, 125], [34, 123]];
const WET_NE: LL[] = [[43.3, 128.5], [42.5, 130.6], [41, 126], [39.8, 124], [40.2, 123.2], [41.2, 124.2], [42.2, 126]];
const SEMIWET: LL[] = [...ISO400, ...rev(ISO800), [38, 123], [40, 125], [42.5, 131], [45, 135], [48.5, 135], [53.5, 124]];
const SEMIDRY: LL[] = [...ISO400, [28.5, 86], [29.5, 82], [30.8, 80.5], ...rev(ISO200), [45.5, 113], [47, 116], [49.8, 117.5], [53, 121]];
const DRY: LL[] = [...ISO200, [32, 78], [36, 74], [40, 73], [46, 80], [49.5, 87], [46, 96], [43, 105]];
const WATER = { wet: C.green, semiwet: C.lime, semidry: C.gold, dry: C.orange };

const WT_N: LL[] = [[40.6, 124.6], [40.9, 122.3], [40.6, 120], [40.6, 117.5], [40.7, 115.5], [40.3, 113.8], [39.4, 112], [38.4, 110.2], [37.5, 108], [36.8, 105.5], QT_EDGE[22]];
const WARM_T: LL[] = [...WT_N, QT_EDGE[23], ...NS_LINE, [35, 122.5], [38, 124], [40, 125.5]];
const COLD_EDGE: LL[] = [[53.3, 119], [51.6, 119.6], [50.4, 121.5], [50.3, 123.8], [51.3, 126.6], [53.5, 127]];
const COLD_T: LL[] = [[56, 115], ...COLD_EDGE, [56, 128]];
const MID_T: LL[] = [[56, 70], [56, 115], ...COLD_EDGE, [56, 128], [56, 136], [42, 136], [40.6, 126], ...WT_N, ...QT_EDGE.slice(0, 22).reverse(), [37, 70]];
const TROPIC_CN: LL[][] = [
  [[21.6, 109.5], [21.6, 110.5], [20.2, 111.5], [18, 110.5], [18, 108.5], [19.5, 108.5], [20.3, 109.6]],
  [[23, 120], [23, 121.6], [21.8, 121], [21.8, 120.6]],
  [[22.5, 99.5], [22.7, 101], [22, 102], [21.1, 101.6], [21.5, 100.2]],
];
const TZ = { cold: C.blue, mid: C.teal, warm: C.gold, sub: C.green, trop: C.red, plateau: C.violet };

// ------------------------------------------------------------------------------------------------ figures

const fade = (d: number, s: string) => `<g class="f-fade" style="--d:${d}s">${s}</g>`;
const pts = (p: [number, number][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/** West–east profile at about 36°N, from the Kunlun to the Yellow Sea, with the three steps shaded. `blind` swaps names for letters (quiz). */
const profile36 = (blind = false): Fig => ({
  k: 'svg', draw: (L: Lx) => {
    const X = (lon: number) => 34 + ((lon - 78) / (122 - 78)) * 280, Y = (e: number) => 136 - (e / 6000) * 92;
    const prof: [number, number][] = [[78, 4500], [80, 5200], [82, 5000], [84, 5400], [86, 4900], [88, 4800], [90, 4700], [92, 3800], [93.5, 2900], [95, 2800],
      [96.5, 2900], [98, 3800], [99.5, 3500], [101, 3200], [102, 2800], [102.8, 2200], [103.5, 1900], [104.5, 1800], [106, 1700], [107.5, 1400], [109, 1200],
      [110.5, 900], [111.5, 1300], [112.5, 1000], [113.3, 1800], [113.8, 1200], [114.4, 100], [116, 40], [117.1, 800], [118, 300], [119, 150], [120, 60], [120.4, 0]];
    const xy = prof.map(([l, e]) => [X(l), Y(e)] as [number, number]);
    const band = (a: number, b: number, c: string) => `<rect x="${X(a).toFixed(1)}" y="${Y(6000)}" width="${(X(b) - X(a)).toFixed(1)}" height="${Y(0) - Y(6000)}" fill="${c}" opacity=".13"/>`;
    let o = tx(4, 12, L(['A west–east profile of China at about 36°N', '我国地势剖面示意（约北纬 36°）']), 'fg-title');
    o += tx(4, 23, L(['heights much exaggerated', '垂直比例尺放大']), 'fg-sub');
    o += band(78, 102.8, C.violet) + band(102.8, 113.8, C.brown) + band(113.8, 122, C.green);
    for (const e of [0, 2000, 4000, 6000]) o += `<line x1="34" x2="314" y1="${Y(e)}" y2="${Y(e)}" class="fg-grid"/>` + tx(31, Y(e) + 3, String(e), 'fg-tick', 'e');
    o += tx(31, Y(6000) - 5, 'm', 'fg-tick', 'e');
    o += `<polygon points="${pts([[X(78), Y(0)], ...xy, [X(120.4), Y(0)]])}" class="fg-landfill"/>`;
    o += `<polyline points="${pts(xy)}" class="fg-profile f-draw" pathLength="1"/>`;
    o += `<rect x="${X(120.4)}" y="${Y(0) - 1.5}" width="${X(122) - X(120.4)}" height="4" class="fg-sea"/>`;
    for (const l of [102.8, 113.8]) o += fade(0.8, `<line x1="${X(l)}" x2="${X(l)}" y1="${Y(6000)}" y2="${Y(0)}" class="fg-guide"/>`);
    o += fade(1.0, tx(X(90), Y(6000) + 9, L(['Step 1', '第一级阶梯']), 'fg-label', 'm') + tx(X(108.3), Y(6000) + 9, L(['Step 2', '第二级阶梯']), 'fg-label', 'm')
      + tx(X(118), Y(6000) + 9, L(['Step 3', '第三级']), 'fg-label', 'm'));
    const lab = (lon: number, e: number, a: Pair, letter: string) => blind
      ? `<circle cx="${X(lon).toFixed(1)}" cy="${(Y(e) - 3).toFixed(1)}" r="6" fill="#1b1f27" stroke="${C.gold}" stroke-width="1.2"/>` + tx(X(lon), Y(e), letter, 'fg-label', 'm')
      : tx(X(lon), Y(e), L(a), 'fg-tick', 'm');
    // names that do not fit beside the line sit higher up, with a thin leader down to the place
    const lead = (lon: number, e0: number, e1: number) => `<line x1="${X(lon).toFixed(1)}" x2="${X(lon).toFixed(1)}" y1="${(Y(e0) + 2).toFixed(1)}" y2="${Y(e1).toFixed(1)}" class="fg-guide"/>`;
    o += fade(1.4, lab(86.5, 3900, ['Kunlun Mts', '昆仑山'], 'D') + lab(95.2, blind ? 3300 : 1900, ['Qaidam Basin', '柴达木盆地'], 'A')
      + lab(106.2, 2400, ['Loess Plateau', '黄土高原'], 'B')
      + (blind ? lab(115.1, 700, ['', ''], 'C')
        : lead(116, 3900, 150) + lab(116, 4000, ['N. China Plain', '华北平原'], '') + lab(112.2, 2600, ['Taihang', '太行山'], '')
          + lead(118.3, 2900, 900) + tx(316, Y(3000), L(['Shandong hills', '山东丘陵']), 'fg-tick', 'e') + tx(X(122), Y(0) - 5, L(['Yellow Sea', '黄海']), 'fg-tick', 'e')));
    for (const l of [80, 90, 100, 110, 120]) o += tx(X(l), 148, `${l}°E`, 'fg-tick', 'm');
    return svg(320, 154, o, L(['Elevation profile of China at 36°N, falling in three steps', '北纬 36° 地势剖面：三级阶梯']));
  },
});

const LANDFORM_PIE: Fig = { k: 'pie', title: ['China\'s land by landform type (approx.)', '我国各类地形面积比例（约）'], parts: [
  { name: ['Mountains', '山地'], v: 33.3, c: C.brown }, { name: ['Plateaus', '高原'], v: 26.0, c: C.violet }, { name: ['Basins', '盆地'], v: 18.8, c: C.gold },
  { name: ['Plains', '平原'], v: 12.0, c: C.green }, { name: ['Hills', '丘陵'], v: 9.9, c: C.lime }] };

const GZ_T = [13.6, 14.9, 17.9, 22.0, 25.5, 27.6, 28.8, 28.7, 27.6, 24.9, 20.6, 15.5];
const GZ_P = [53, 51, 97, 184, 292, 342, 260, 268, 189, 62, 38, 33];
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const HARBIN_T = [-17.6, -12.6, -3.3, 7.3, 15.1, 21.1, 23.5, 21.8, 15.4, 6.1, -5.1, -14.6];
const BEIJING_T = [-3.1, 0.3, 6.7, 14.8, 20.8, 24.9, 26.7, 25.5, 20.8, 13.7, 5.0, -0.9];
const TEMP_LINE: Fig = { k: 'line', title: ['Monthly mean temperature, north to south (month 1–12)', '各月平均气温：从北到南（1—12 月）'], unit: ['°C', '℃'], x: MONTHS, min: -20, max: 30,
  series: [{ name: ['Harbin', '哈尔滨'], c: C.blue, y: HARBIN_T }, { name: ['Beijing', '北京'], c: C.gold, y: BEIJING_T },
    { name: ['Guangzhou', '广州'], c: C.red, y: GZ_T }] };
const RAIN_BARS: Fig = { k: 'bars', title: ['Average yearly rainfall, south-east to north-west (approx.)', '年平均降水量：从东南到西北（约）'], unit: ['mm', '毫米'], rows: [
  { name: ['Guangzhou', '广州'], v: 1870, c: C.green }, { name: ['Shanghai', '上海'], v: 1250, c: C.green }, { name: ['Beijing', '北京'], v: 580, c: C.lime },
  { name: ['Lanzhou', '兰州'], v: 320, c: C.gold }, { name: ['Ürümqi', '乌鲁木齐'], v: 260, c: C.gold }, { name: ['Toksun', '托克逊'], v: 7, c: C.orange }] };
const RAIN_BELT: Fig = { k: 'line', title: ['Monthly rainfall: the peak moves north (month 1–12, approx.)', '各月降水量：雨季高峰自南向北推迟（1—12 月，约）'], unit: ['mm', '毫米'], x: MONTHS, min: 0, max: 350,
  series: [{ name: ['Guangzhou', '广州'], c: C.red, y: GZ_P }, { name: ['Shanghai', '上海'], c: C.green, y: [75, 63, 103, 90, 103, 192, 149, 214, 105, 58, 55, 44] },
    { name: ['Beijing', '北京'], c: C.gold, y: [3, 6, 9, 26, 35, 78, 185, 160, 46, 22, 10, 3] }] };
const MTN_KEY: Fig = { k: 'key', set: 'custom', title: ['Mountain ranges by trend (sketch)', '山脉走向（示意）'], items: [
  { c: TREND.ew, name: ['East–west: Tianshan, Yinshan, Kunlun, Qinling, Nanling', '东西走向：天山、阴山、昆仑山、秦岭、南岭'] },
  { c: TREND.nesw, name: ['NE–SW: Greater Khingan, Taihang, Wushan, Xuefeng, Changbai, Wuyi, Taiwan', '东北—西南走向：大兴安岭、太行山、巫山、雪峰山、长白山、武夷山、台湾山脉'] },
  { c: TREND.ns, name: ['North–south: Helan, Hengduan', '南北走向：贺兰山、横断山脉'] },
  { c: TREND.nwse, name: ['NW–SE: Altai, Qilian', '西北—东南走向：阿尔泰山、祁连山'] },
  { c: TREND.arc, name: ['Arc: Himalayas', '弧形：喜马拉雅山脉'] }] };
const PLATEAU_KEY: Fig = { k: 'key', set: 'custom', title: ['The four great plateaus (sketch)', '四大高原（示意）'], items: [
  { c: C.violet, name: ['Qinghai–Tibet: highest; snowy peaks, glaciers', '青藏高原：最高，雪山连绵，冰川广布'] },
  { c: C.lime, name: ['Inner Mongolia: flat, wide and open', '内蒙古高原：地面坦荡，一望无际'] },
  { c: C.gold, name: ['Loess: thick loess cut into gullies', '黄土高原：黄土深厚，千沟万壑'] },
  { c: C.teal, name: ['Yunnan–Guizhou: rugged, karst', '云贵高原：地形崎岖，喀斯特广布'] }] };
const BASIN_BARS: Fig = { k: 'bars', title: ['The four great basins by area (approx.)', '四大盆地面积（约）'], unit: ['thousand km²', '千平方千米'], rows: [
  { name: ['Tarim', '塔里木盆地'], v: 530, c: C.orange }, { name: ['Junggar', '准噶尔盆地'], v: 380, c: C.gold },
  { name: ['Sichuan', '四川盆地'], v: 260, c: C.red }, { name: ['Qaidam', '柴达木盆地'], v: 250, c: C.violet }] };
const PLAIN_KEY: Fig = { k: 'key', set: 'custom', title: ['Plains and hills of the east (sketch)', '东部的平原和丘陵（示意）'], items: [
  { c: C.green, name: ['Northeast Plain: largest, black soil', '东北平原：面积最大，黑土肥沃'] },
  { c: C.teal, name: ['North China Plain: flat, built by the Yellow River', '华北平原：地势平坦，黄河冲积'] },
  { c: C.blue, name: ['Middle–lower Yangtze Plain: low, many lakes', '长江中下游平原：地势低平，河湖众多'] },
  { c: C.lime, name: ['Hills: Liaodong, Shandong, Southeast', '丘陵：辽东、山东、东南丘陵'] }] };
const TZ_KEY: Fig = { k: 'key', set: 'custom', title: ['Temperature zones (by days ≥10 ℃ and their heat; sketch)', '温度带（按 ≥10 ℃ 积温划分，示意）'], items: [
  { c: TZ.cold, name: ['Cold temperate: <1,600 ℃·d, one crop a year', '寒温带：<1600 ℃，一年一熟'] },
  { c: TZ.mid, name: ['Middle temperate: 1,600–3,400 ℃·d, one crop a year', '中温带：1600—3400 ℃，一年一熟'] },
  { c: TZ.warm, name: ['Warm temperate: 3,400–4,500 ℃·d, 3 crops in 2 years', '暖温带：3400—4500 ℃，两年三熟或一年两熟'] },
  { c: TZ.sub, name: ['Subtropical: 4,500–8,000 ℃·d, 2–3 crops a year', '亚热带：4500—8000 ℃，一年两熟到三熟'] },
  { c: TZ.trop, name: ['Tropical: >8,000 ℃·d, 3 crops a year', '热带：>8000 ℃，一年三熟'] },
  { c: TZ.plateau, name: ['Qinghai–Tibet Plateau zone: high and cool', '青藏高原区：海拔高，气温低'] }] };

export const CHINA: Lesson[] = [
  {
    id: 'steps', strand: 'china', tracks: ['uk',  'us'], grade: 'g8a', unit, icon: 'mountain', minutes: 11,
    title: ['Landforms and the three steps', '地形多样，地势西高东低'],
    blurb: ['Mountains, plateaus, basins and plains, falling in three big steps from the roof of the world to the sea.', '山地、高原、盆地、平原和丘陵，从世界屋脊到大海分三级阶梯逐级下降。'],
    keys: [
      ['China has all five landform types; mountain areas (mountains, rugged plateaus and hills) cover about two-thirds of the land.', '我国地形复杂多样，五种基本地形齐全，山区面积广大，约占全国面积的 2/3。'],
      ['Mountain ranges form the skeleton: four great plateaus, four great basins and three great plains sit between them.', '山脉构成地形的骨架，四大高原、四大盆地和三大平原分布其间。'],
      ['The land is high in the west and low in the east, in three steps divided by Kunlun–Qilian–Hengduan and Greater Khingan–Taihang–Wushan–Xuefeng.', '地势西高东低，呈三级阶梯：昆仑山—祁连山—横断山和大兴安岭—太行山—巫山—雪峰山是阶梯分界线。'],
      ['The slope lets sea air reach inland and big rivers flow east; rivers dropping between steps give huge hydropower.', '地势西高东低，有利于海洋湿润气流深入内地，使大河东流、沟通东西交通；阶梯交界处落差大，水能丰富。'],
      ['Mountain areas offer forests, minerals, water power and scenery, but transport is hard and landslides are a risk: use them to suit local conditions.', '山区林矿、水能和旅游资源丰富，但交通不便、易发滑坡泥石流，开发要因地制宜。'],
    ],
    steps: [
      {
        title: ['Five landform types, mostly mountains', '地形复杂多样，山区面积广大'], cam: [34, 104, 3.2], items: ['everest', 'cn_guilin'],
        paint: [{ fill: { k: 'land', a2: CN, c: C.brown }, a: 0.32 }],
        marks: [mk([27.99, 86.93], 'Everest 8,848.86 m: highest', '珠穆朗玛峰 8848.86 米：最高', { dot: true, c: C.white, t: 0.6 }),
          mk([42.65, 89.27], 'Aydingkol Lake −154 m: lowest', '艾丁湖 −154 米：最低', { dot: true, c: C.gold, t: 1.2 })],
        fig: LANDFORM_PIE,
        task: ['Find China\'s highest and lowest points: how far apart are they in height?', '找到我国陆地的最高点和最低点：两者高差约多少米？'],
        body: ['China has all five basic landform types. Mountains cover about 33% of the land, plateaus 26%, basins 19%, plains 12% and hills 10%. Counting rugged plateaus and hills, "mountain areas" make up about two-thirds of the country. The highest point is Mount Everest (8,848.86 m, measured in 2020) on the China–Nepal border; the lowest is Aydingkol Lake in the Turpan Basin, about 154 m below sea level, more than 9,000 m lower.',
          '我国五种基本地形齐全：山地约占 33%，高原约占 26%，盆地约占 19%，平原约占 12%，丘陵约占 10%。把崎岖的高原和丘陵算在内，山区面积约占全国面积的 2/3。陆地最高点是中尼边境上的珠穆朗玛峰（8848.86 米，2020 年测定），最低点是吐鲁番盆地的艾丁湖，约低于海平面 154 米，两者相差 9000 多米。'],
      },
      {
        title: ['Mountain ranges: the skeleton', '山脉：地形的骨架'], cam: [36, 104, 3.2], sketch: true, items: ['vo_tianchi'],
        lines: [...[TIANSHAN, MTN.yinshan, KUNLUN, MTN.qinling, MTN.nanling].map((p, i) => ln(p, TREND.ew, i * 0.2)),
          ...[MTN.khingan, TAIHANG, MTN.wushan, MTN.xuefeng, MTN.changbai, MTN.wuyi, TW_RANGES.central].map((p, i) => ln(p, TREND.nesw, 1.2 + i * 0.15)),
          ...[MTN.helan, MTN.hengduan].map((p, i) => ln(p, TREND.ns, 2.4 + i * 0.2)), ...[ALTAI, MTN.qilian].map((p, i) => ln(p, TREND.nwse, 2.8 + i * 0.2)),
          ln(MTN.himalaya, TREND.arc, 3.2, 2.2)],
        marks: [mk([43.6, 84], 'Tianshan', '天山', { c: TREND.ew, t: 0.4 }), mk([35.3, 82], 'Kunlun', '昆仑山', { c: TREND.ew, t: 0.6 }),
          mk([34.4, 108.6], 'Qinling', '秦岭', { c: TREND.ew, t: 0.8 }), mk([48, 119.5], 'Greater Khingan', '大兴安岭', { c: TREND.nesw, t: 1.4 }),
          mk([27.5, 98.6], 'Hengduan', '横断山脉', { c: TREND.ns, t: 2.6 }), mk([38.4, 99.6], 'Qilian', '祁连山', { c: TREND.nwse, t: 3 }),
          mk([28.6, 86.5], 'Himalayas', '喜马拉雅山脉', { c: TREND.arc, t: 3.4 })],
        fig: MTN_KEY,
        task: ['Name one east–west range and one north-east–south-west range, then find the only big north–south range in the south-west.', '说出一条东西走向和一条东北—西南走向的山脉，再找出西南部唯一的大型南北走向山脉。'],
        body: ['Long mountain ranges criss-cross China and act as the skeleton of its terrain. East–west ranges include the Tianshan, Yinshan, Kunlun, Qinling and Nanling; north-east–south-west ranges include the Greater Khingan, Taihang, Wushan, Xuefeng, Changbai, Wuyi and Taiwan ranges. The Helan and Hengduan run north–south, the Altai and Qilian north-west–south-east, and the Himalayas curve in a great arc. Plateaus, basins and plains fill the spaces between them.',
          '我国山脉纵横交错，构成地形的骨架。东西走向的有天山、阴山、昆仑山、秦岭、南岭；东北—西南走向的有大兴安岭、太行山、巫山、雪峰山、长白山、武夷山和台湾山脉；南北走向的有贺兰山、横断山脉；西北—东南走向的有阿尔泰山、祁连山；喜马拉雅山脉呈弧形。高原、盆地和平原就镶嵌在这些山脉之间。'],
      },
      {
        title: ['Four great plateaus', '四大高原'], cam: [35, 101, 3.1], sketch: true, items: ['potala', 'an_yak', 'cn_yuanyang'],
        paint: [{ fill: { k: 'poly', pts: REGIONS.tibet, c: C.violet, clip: CN }, a: 0.55 }, { fill: { k: 'poly', pts: INNER_MONGOLIA, c: C.lime, clip: CN }, t: 0.6, a: 0.5 },
          { fill: { k: 'poly', pts: LOESS_PLATEAU, c: C.gold, clip: CN }, t: 1.2, a: 0.6 }, { fill: { k: 'poly', pts: YUNGUI, c: C.teal, clip: CN }, t: 1.8, a: 0.55 }],
        marks: [mk([33, 87], 'Qinghai–Tibet Plateau', '青藏高原', { big: true, c: C.violet, t: 0.3 }), mk([44.5, 110], 'Inner Mongolia Plateau', '内蒙古高原', { big: true, c: C.lime, t: 0.9 }),
          mk([37, 107.5], 'Loess Plateau', '黄土高原', { big: true, c: C.gold, t: 1.5 }), mk([25.6, 104.5], 'Yunnan–Guizhou Plateau', '云贵高原', { big: true, c: C.teal, t: 2.1 })],
        fig: PLATEAU_KEY,
        body: ['The Qinghai–Tibet Plateau is the highest and biggest, about 2.5 million km² and mostly over 4,000 m: the "roof of the world", with snowy peaks and glaciers where yaks graze. The Inner Mongolia Plateau, about 1,000–1,500 m, is flat and open grassland. The Loess Plateau is covered by loose yellow soil tens of metres thick, cut by rain into thousands of gullies. The Yunnan–Guizhou Plateau is rugged, with limestone (karst) hills, gorges and small basins; on its southern slopes the Hani people carved the Yuanyang rice terraces.',
          '青藏高原是我国面积最大、海拔最高的高原，面积约 250 万平方千米，平均海拔 4000 米以上，雪山连绵、冰川广布，被称为“世界屋脊”，野牦牛在这里生活。内蒙古高原海拔约 1000—1500 米，地面坦荡，一望无际。黄土高原覆盖着厚达数十米的疏松黄土，被流水切割得千沟万壑、支离破碎。云贵高原地形崎岖，喀斯特地貌广布，多峡谷和山间小盆地；哈尼族在其南部山坡上开垦出元阳梯田。'],
      },
      {
        title: ['Four great basins', '四大盆地'], cam: [38, 95, 3.1], sketch: true, items: ['leshan'],
        paint: [{ fill: { k: 'poly', pts: REGIONS.tarim, c: C.orange, clip: CN }, a: 0.5 }, { fill: { k: 'poly', pts: TAKLIMAKAN, c: C.white, clip: CN }, t: 0.5, a: 0.25 },
          { fill: { k: 'poly', pts: JUNGGAR, c: C.gold, clip: CN }, t: 0.8, a: 0.55 }, { fill: { k: 'poly', pts: QAIDAM, c: C.violet, clip: CN }, t: 1.4, a: 0.6 },
          { fill: { k: 'poly', pts: REGIONS.sichuan, c: C.red, clip: CN }, t: 2, a: 0.5 }],
        lines: [{ pts: TARIM, c: C.blue, w: 1.4, flow: true, dur: 1.4, t: 0.4 }],
        marks: [mk([39.3, 82.5], 'Tarim Basin · Taklimakan Desert', '塔里木盆地 · 塔克拉玛干沙漠', { big: true, c: C.orange, t: 0.3 }),
          mk([45.6, 87.2], 'Junggar Basin', '准噶尔盆地', { big: true, c: C.gold, t: 0.9 }), mk([37.3, 94.8], 'Qaidam Basin: highest', '柴达木盆地：海拔最高', { big: true, c: C.violet, t: 1.5 }),
          mk([30.2, 105.5], 'Sichuan Basin: "purple basin"', '四川盆地：“紫色盆地”', { big: true, c: C.red, t: 2.1 })],
        fig: BASIN_BARS,
        body: ['The Tarim Basin is the largest, about 530,000 km²; its centre is the Taklimakan, China\'s biggest desert, and the Tarim River rings it. The Junggar Basin to the north is the second largest, with oases and the Karamay oilfield. The Qaidam Basin sits on the Qinghai–Tibet Plateau at about 2,600–3,000 m, the highest of the four, and is called a "treasure bowl" for its salt lakes, oil and gas. The Sichuan Basin has fertile purple soil and a mild, wet climate: the "Land of Abundance", where the Leshan Giant Buddha looks over three rivers.',
          '塔里木盆地是我国面积最大的盆地，约 53 万平方千米，中部是我国最大的沙漠——塔克拉玛干沙漠，塔里木河在其边缘流过。北面的准噶尔盆地面积居第二，有绿洲和克拉玛依油田。柴达木盆地位于青藏高原上，海拔约 2600—3000 米，是四大盆地中海拔最高的，盐湖、石油和天然气丰富，被称为“聚宝盆”。四川盆地多紫色土，气候温和湿润，被称为“紫色盆地”和“天府之国”，乐山大佛就在这里。'],
      },
      {
        title: ['Three great plains and the hills', '三大平原和三大丘陵'], cam: [36, 118, 2.7], sketch: true, items: ['cn_taishan', 'cn_huangshan'],
        paint: [...Object.values(NE_PLAINS).map(p => ({ fill: { k: 'poly' as const, pts: p, c: C.green, clip: CN }, a: 0.55 })),
          { fill: { k: 'poly', pts: REGIONS.northChinaPlain, c: C.teal, clip: CN }, t: 0.7, a: 0.55 }, { fill: { k: 'poly', pts: YZ_PLAIN, c: C.blue, clip: CN }, t: 1.4, a: 0.55 },
          ...[LIAODONG_HILLS, SHANDONG_HILLS, REGIONS.southeastHills].map(p => ({ fill: { k: 'poly' as const, pts: p, c: C.lime, clip: CN }, t: 2.1, a: 0.5 }))],
        marks: [mk([46, 126], 'Northeast Plain', '东北平原', { big: true, c: C.green, t: 0.3 }), mk([37.3, 116], 'North China Plain', '华北平原', { big: true, c: C.teal, t: 1 }),
          mk([31.2, 116.4], 'Middle–lower Yangtze Plain', '长江中下游平原', { big: true, c: C.blue, t: 1.7 }), mk([40.9, 123.6], 'Liaodong hills', '辽东丘陵', { c: C.lime, t: 2.3 }),
          mk([36.3, 118.8], 'Shandong hills', '山东丘陵', { c: C.lime, t: 2.4 }), mk([27, 114], 'Southeast hills', '东南丘陵', { c: C.lime, t: 2.5 })],
        fig: PLAIN_KEY,
        body: ['The three great plains all lie in the east, on the lowest step. The Northeast Plain is the largest, about 350,000 km², with rich black soil. The North China Plain was built by mud from the Yellow, Huai and Hai rivers; most of it is below 50 m. The Middle–lower Yangtze Plain is low and flat, dotted with lakes such as Poyang and Dongting: the "land of fish and rice". Hills sit beside them: the Liaodong and Shandong hills (Mount Tai rises to 1,545 m) and the wide Southeast hills, with red soil and peaks like Huangshan.',
          '三大平原都分布在东部第三级阶梯上。东北平原面积最大，约 35 万平方千米，黑土肥沃。华北平原主要由黄河、淮河、海河带来的泥沙冲积而成，大部分海拔在 50 米以下。长江中下游平原地势低平，鄱阳湖、洞庭湖等河湖众多，被称为“鱼米之乡”。平原周围分布着丘陵：辽东丘陵、山东丘陵（泰山海拔 1545 米）和面积广大的东南丘陵，东南丘陵多红壤，黄山就在这里。'],
      },
      {
        title: ['High in the west, low in the east: three steps', '地势西高东低，呈三级阶梯'], cam: [34, 103, 3.1], sketch: true, items: ['potala', 'cn_bund'],
        task: ['Trace the two gold lines from north to south and name the ranges on each, then read the profile from west to east.', '从北到南描一遍两条分界线，说出线上的山脉；再从西向东读一读剖面图。'],
        paint: [{ fill: { k: 'poly', pts: STEP_POLYS[0], c: C.violet, clip: CN }, a: 0.5 }, { fill: { k: 'poly', pts: STEP_POLYS[1], c: C.brown, clip: CN }, t: 0.8, a: 0.5 },
          { fill: { k: 'poly', pts: STEP_POLYS[2], c: C.green, clip: CN }, t: 1.6, a: 0.5 }],
        lines: [{ pts: STEP1, c: C.gold, w: 2, dur: 1.6 }, { pts: STEP2, c: C.orange, w: 2, dur: 1.6, t: 1.2 }],
        marks: [mk([32.5, 86], 'Step 1: over 4,000 m', '第一级：4000 米以上', { big: true, c: C.violet, t: 0.4 }), mk([39.5, 108], 'Step 2: 1,000–2,000 m', '第二级：1000—2000 米', { big: true, c: C.brown, t: 1.2 }),
          mk([29, 116.5], 'Step 3: mostly under 500 m', '第三级：多在 500 米以下', { big: true, c: C.green, t: 2 }),
          mk([37.5, 97.5], 'Kunlun–Qilian–Hengduan', '昆仑山—祁连山—横断山', { c: C.gold, t: 2.4 }), mk([44, 116.5], 'Greater Khingan–Taihang–Wushan–Xuefeng', '大兴安岭—太行山—巫山—雪峰山', { c: C.orange, t: 2.8 })],
        fig: profile36(),
        body: ['China\'s land is high in the west and low in the east and falls in three steps. Step 1 is the Qinghai–Tibet Plateau, mostly over 4,000 m; its edge runs along the Kunlun, Qilian and Hengduan mountains. Step 2, at 1,000–2,000 m, holds the Inner Mongolia, Loess and Yunnan–Guizhou plateaus and the Tarim, Junggar and Sichuan basins; it ends at the Greater Khingan, Taihang, Wushan and Xuefeng mountains. Step 3 is plains and hills mostly under 500 m, and beyond the coast the shallow continental shelf continues under the sea.',
          '我国地势西高东低，呈三级阶梯状分布。第一级阶梯是青藏高原，平均海拔 4000 米以上，以昆仑山—祁连山—横断山一线为界。第二级阶梯海拔 1000—2000 米，分布着内蒙古高原、黄土高原、云贵高原和塔里木、准噶尔、四川盆地，以大兴安岭—太行山—巫山—雪峰山一线为界。第三级阶梯以平原和丘陵为主，海拔多在 500 米以下；再向东是浅海大陆架。'],
      },
      {
        title: ['How the slope helps China', '地势对河流、气候和水能的影响'], cam: [31, 108, 3], sketch: true, items: ['cn_yellowcrane'],
        lines: [{ pts: YANGTZE, c: C.blue, w: 1.7, flow: true, arrow: true, dur: 2.4 }, { pts: YELLOW, c: C.gold, w: 1.7, flow: true, arrow: true, dur: 2.4, t: 0.4 },
          { pts: STEP1, c: C.white, w: 1, dur: 0.8, t: 1.6 }, { pts: STEP2, c: C.white, w: 1, dur: 0.8, t: 1.8 },
          ...arrows([[[18, 128], [27, 116]], [[20, 135], [31, 121]], [[24, 125], [33, 113]]], C.teal, 2.6, 2)],
        marks: [mk([30.82, 111.0], 'Three Gorges 22.5 GW', '三峡 2250 万千瓦', { dot: true, c: C.teal, t: 2 }), mk([27.22, 102.9], 'Baihetan 16 GW', '白鹤滩 1600 万千瓦', { dot: true, c: C.teal, t: 2.2 }),
          mk([28.26, 103.65], 'Xiluodu 13.9 GW', '溪洛渡 1386 万千瓦', { dot: true, c: C.teal, t: 2.4 }), mk([25, 121], 'Moist sea air flows inland', '海洋湿润气流深入内地', { c: C.teal, t: 3 })],
        body: ['Because the land slopes down towards the Pacific, warm wet summer winds from the sea can push far inland and bring rain. Most big rivers, like the Yangtze and the Yellow River, flow from west to east, linking inland and coast; the Yangtze is the "golden waterway". Where rivers drop from one step to the next they rush through gorges, so the step edges hold huge hydropower: Baihetan (16 GW) and Xiluodu on the Jinsha River at the edge of Step 1, and the Three Gorges Dam (22.5 GW, the world\'s largest) where the Yangtze leaves Step 2.',
          '地势西高东低、面向海洋，有利于来自海洋的暖湿气流深入内地，形成降水。长江、黄河等大河自西向东流，沟通了东西交通，长江被称为“黄金水道”。河流从一级阶梯流向下一级阶梯时，落差大，水流急，蕴藏着巨大的水能：金沙江上的白鹤滩（1600 万千瓦）、溪洛渡水电站位于第一、二级阶梯交界处，世界最大的三峡水电站（2250 万千瓦）位于长江流出第二级阶梯的地方。'],
      },
      {
        title: ['Living with mountain areas', '山区的利与弊'], cam: [27, 108, 2.6], items: ['cn_yuanyang', 'cn_zhangjiajie', 'cn_huangshan'],
        paint: [{ fill: { k: 'poly', pts: YUNGUI, c: C.teal, clip: CN }, a: 0.35 }, { fill: { k: 'poly', pts: REGIONS.southeastHills, c: C.lime, clip: CN }, a: 0.3, t: 0.4 }],
        marks: [mk([23.1, 102.75], 'Terraces: farming steep slopes', '梯田：在陡坡上耕作', { dot: true, c: C.lime, t: 0.6 }), mk([29.35, 110.47], 'Tourism: Zhangjiajie', '旅游：张家界', { dot: true, c: C.gold, t: 1.2 }),
          mk([30.13, 118.17], 'Forests and scenery: Huangshan', '林业与风景：黄山', { dot: true, c: C.green, t: 1.8 })],
        task: ['Look at the three places: how has each mountain area turned its terrain into a resource?', '看看这三个地方：它们怎样把山区地形变成了资源？'],
        body: ['Mountain areas are rich in forests, minerals, water power and wildlife, and their scenery draws tourists, as at Zhangjiajie\'s 3,000 sandstone pillars and Huangshan. But steep, rugged land makes roads and railways hard to build, leaves little flat farmland, and brings landslides and debris flows after heavy rain. So mountain areas should be developed to suit local conditions: forestry, herding, tourism and specialty crops, and terraces like Yuanyang\'s, which hold soil and water on slopes, while protecting the environment.',
          '山区森林、矿产、水能和动植物资源丰富，风景优美，张家界的 3000 多座石英砂岩峰柱和黄山都吸引着大量游客。但山区地形崎岖，交通建设困难，耕地少，暴雨后容易发生滑坡和泥石流。因此山区开发要因地制宜，发展林业、畜牧业、旅游业和特色农业，像元阳梯田那样修筑梯田保持水土，同时注意保护生态环境。'],
      },
    ],
    quiz: [
      { q: ['China\'s land is…', '我国地势的特点是'], options: [['High in the west, low in the east, in three steps', '西高东低，呈阶梯状分布'], ['High in the east, low in the west', '东高西低'], ['High in the middle', '中部高、四周低'], ['Flat everywhere', '到处平坦']], answer: 0,
        why: ['It drops in three steps from the Qinghai–Tibet Plateau (over 4,000 m) to the eastern plains (mostly under 500 m).', '从平均海拔 4000 米以上的青藏高原，到海拔多在 500 米以下的东部平原，分三级阶梯逐级下降。'] },
      { q: ['The line between Step 2 and Step 3 is…', '第二、三级阶梯的分界线是'], options: [['Greater Khingan–Taihang–Wushan–Xuefeng', '大兴安岭—太行山—巫山—雪峰山'], ['Kunlun–Qilian–Hengduan', '昆仑山—祁连山—横断山'], ['Qinling–Huaihe', '秦岭—淮河'], ['The Great Wall', '长城']], answer: 0,
        why: ['Kunlun–Qilian–Hengduan divides Steps 1 and 2; Qinling–Huaihe divides north and south.', '昆仑山—祁连山—横断山是第一、二级阶梯的分界线；秦岭—淮河是南北方的分界线。'] },
      { q: ['Match each plateau to its landscape.', '把高原和它的地表特征连起来。'],
        match: [[['Qinghai–Tibet Plateau', '青藏高原'], ['Snowy peaks and glaciers', '雪山连绵，冰川广布']], [['Inner Mongolia Plateau', '内蒙古高原'], ['Flat and open as far as the eye can see', '地面坦荡，一望无际']],
          [['Loess Plateau', '黄土高原'], ['Cut into countless gullies', '千沟万壑，支离破碎']], [['Yunnan–Guizhou Plateau', '云贵高原'], ['Rugged, with karst', '地形崎岖，喀斯特广布']]],
        why: ['The Qinghai–Tibet Plateau is the highest; Inner Mongolia is flat grassland; loose loess is easily cut by rain; Yunnan–Guizhou has limestone karst.', '青藏高原海拔最高，多雪山冰川；内蒙古高原地面坦荡；黄土高原土质疏松，被流水切割；云贵高原石灰岩广布，形成喀斯特地貌。'] },
      { q: ['Label these mountain ranges, which mark the edges of the steps.', '在地球上标出这些作为阶梯分界线的山脉。'],
        place: [{ text: ['Kunlun Mountains', '昆仑山脉'], at: [36, 86], tolKm: 450 }, { text: ['Hengduan Mountains', '横断山脉'], at: [28, 99], tolKm: 400 }, { text: ['Greater Khingan', '大兴安岭'], at: [48, 121], tolKm: 400 }, { text: ['Taihang Mountains', '太行山脉'], at: [37, 113.5], tolKm: 350 }],
        why: ['Kunlun, Qilian and Hengduan mark the edge of Step 1; Greater Khingan, Taihang, Wushan and Xuefeng mark the edge of Step 2.', '昆仑山脉—祁连山脉—横断山脉是第一、二级阶梯的分界线；大兴安岭—太行山脉—巫山—雪峰山是第二、三级阶梯的分界线。'] },
      { q: ['Find the Three Gorges.', '在地球上点出三峡。'], at: [30.8, 111], tolKm: 400,
        why: ['On the Yangtze where it leaves Step 2 near Yichang.', '在长江流出第二级阶梯的地方，宜昌附近。'] },
      { q: ['How many metres higher is the top of Everest (8,848.86 m) than Aydingkol Lake (−154 m)? Round to the nearest metre.', '珠穆朗玛峰（8848.86 米）比艾丁湖（−154 米）高多少米？（取整数）'], num: { answer: 9003, tol: 2, unit: ['m', '米'] },
        why: ['8,848.86 − (−154) = 9,002.86 ≈ 9,003 m.', '8848.86 −（−154）= 9002.86 ≈ 9003 米。'] },
      { q: ['On this profile, which letter is a basin that still lies on Step 1?', '在这幅剖面图上，哪个字母所在的盆地位于第一级阶梯？'], fig: profile36(true),
        options: [['A', 'A'], ['B', 'B'], ['C', 'C'], ['D', 'D']], answer: 0,
        why: ['A is the Qaidam Basin: lower than the Kunlun around it, but still at about 2,800 m on the Qinghai–Tibet Plateau, west of the Step 1 edge. B is the Loess Plateau (Step 2), C the North China Plain (Step 3), D the Kunlun Mountains.', 'A 是柴达木盆地：比周围的昆仑山等山地低，但仍在青藏高原上，海拔约 2800 米，位于第一级阶梯。B 是黄土高原（第二级），C 是华北平原（第三级），D 是昆仑山。'] },
      { q: ['How does "high in the west, low in the east" help China? Pick all that apply.', '我国地势西高东低，带来的有利影响有（多选）'],
        options: [['Moist sea air can reach far inland', '有利于海洋上的湿润气流深入内地'], ['Big rivers flow east, linking west and east', '大河东流，沟通东西交通'], ['Rivers dropping between steps give hydropower', '河流在阶梯交界处落差大，水能丰富'], ['Most rivers flow north to the Arctic', '大多数河流向北流入北冰洋'], ['It makes the whole country dry', '使全国气候干旱']], multi: [0, 1, 2],
        why: ['The land opens to the Pacific, so summer monsoon rain reaches inland; rivers like the Yangtze flow east as transport links; where they drop between steps, as at Baihetan and the Three Gorges, they yield hydropower.', '地势西高东低、面向海洋，有利于夏季风深入内地带来降水；长江等大河滚滚东流，沟通东西交通；河流在阶梯交界处落差大，如白鹤滩、三峡，蕴藏着丰富的水能。'] },
    ],
  },
  {
    id: 'china-climate', strand: 'china', tracks: ['uk',  'us'], grade: 'g8a', unit, icon: 'cloud', minutes: 12,
    title: ['China\'s climate and rivers', '中国的气候和河流'],
    blurb: ['Winter and summer temperatures, rain belts and monsoons, the Qinling–Huaihe line, and the Yangtze and Yellow Rivers.', '冬夏气温、雨带和季风、秦岭—淮河一线，以及长江和黄河。'],
    keys: [
      ['Winters are cold with a huge north–south gap (the 0 ℃ January line follows Qinling–Huaihe); summers are hot almost everywhere except the high Qinghai–Tibet Plateau.', '冬季南北温差大，1 月 0 ℃ 等温线大致沿秦岭—淮河一线；夏季除青藏高原外普遍高温，南北温差小。'],
      ['By accumulated warmth, China has five temperature zones plus the Qinghai–Tibet Plateau zone; most land is temperate or subtropical.', '按积温划分，我国有五个温度带和一个青藏高原区，大部分地区位于温带和亚热带。'],
      ['Rainfall falls from the south-east coast to the north-west interior; the 800, 400 and 200 mm lines divide humid, semi-humid, semi-arid and arid regions.', '年降水量从东南沿海向西北内陆递减；800、400、200 毫米等降水量线把全国分为湿润区、半湿润区、半干旱区和干旱区。'],
      ['Monsoons dominate: the summer rain belt moves north from May to August, and an unstable monsoon brings floods and droughts.', '季风气候显著：夏季雨带 5—8 月自南向北推移，季风不稳定导致水旱灾害多发。'],
      ['The climate is complex and diverse; heat and rain come together in summer, which suits crops.', '我国气候复杂多样，雨热同期，有利于农作物生长。'],
      ['The Yangtze (about 6,300 km) is divided at Yichang and Hukou; the Yellow River (5,464 km) at Hekou and Taohuayu.', '长江全长约 6300 千米，以宜昌、湖口分上中下游；黄河全长 5464 千米，以河口镇、桃花峪分上中下游。'],
    ],
    steps: [
      {
        title: ['Winter: a huge north–south gap', '冬季：南北温差大'], cam: [34, 112, 3.3], sketch: true,
        clock: { mode: 'year', start: T.janChina, rate: 0 }, paint: [{ fill: { k: 'temp' }, a: 0.55 }],
        lines: [{ pts: QINLING_HUAIHE, c: C.white, w: 2, dur: 1.6, t: 0.4 }],
        marks: [mk([52.97, 122.53], 'Mohe ≈ −28 ℃', '漠河约 −28 ℃', { dot: true, c: C.white, t: 0.6 }), mk([45.75, 126.63], 'Harbin −17.6 ℃', '哈尔滨 −17.6 ℃', { dot: true, t: 0.9 }),
          mk([39.9, 116.4], 'Beijing −3.1 ℃', '北京 −3.1 ℃', { dot: true, t: 1.2 }), mk([31.23, 121.47], 'Shanghai 4.8 ℃', '上海 4.8 ℃', { dot: true, t: 1.5 }),
          mk([23.13, 113.26], 'Guangzhou 13.6 ℃', '广州 13.6 ℃', { dot: true, t: 1.8 }), mk([18.25, 109.5], 'Sanya ≈ 21.6 ℃', '三亚约 21.6 ℃', { dot: true, c: C.red, t: 2.1 }),
          mk([33.4, 108.5], 'January 0 ℃ line ≈ Qinling–Huaihe', '1 月 0 ℃ 等温线 ≈ 秦岭—淮河', { c: C.white, t: 2.4 })],
        fig: TEMP_LINE,
        task: ['Read the graph: how big is the Harbin–Guangzhou gap in January, and in July?', '读图：哈尔滨和广州 1 月相差多少摄氏度？7 月呢？'],
        body: ['January averages fall from about 21 ℃ at Sanya on Hainan to about −28 ℃ at Mohe in the far north: a gap of almost 50 ℃. Two causes add up: the north gets a lower winter Sun and shorter days, and it is the first to be hit by cold, dry winter winds from Siberia and Mongolia. The January 0 ℃ isotherm runs roughly along the Qinling Mountains and the Huaihe River; north of it rivers freeze, south of it they flow all winter.',
          '1 月平均气温从海南三亚的约 21 ℃ 降到最北端漠河的约 −28 ℃，南北相差近 50 ℃。原因有两点：北方冬季太阳高度小、白昼短，获得的热量少；又最先受到来自西伯利亚、蒙古的寒冷干燥的冬季风影响。1 月 0 ℃ 等温线大致沿秦岭—淮河一线分布，以北河流冬季结冰，以南河流终年不冻。'],
      },
      {
        title: ['Summer: hot almost everywhere', '夏季：普遍高温'], cam: [36, 102, 3.3], sketch: true, items: ['potala'],
        clock: { mode: 'year', start: T.julChina, rate: 0 }, paint: [{ fill: { k: 'temp' }, a: 0.55 }],
        marks: [mk([42.95, 89.19], 'Turpan: July > 32 ℃', '吐鲁番：7 月 > 32 ℃', { dot: true, c: C.red, t: 0.6 }), mk([45.75, 126.63], 'Harbin 23.5 ℃', '哈尔滨 23.5 ℃', { dot: true, t: 0.9 }),
          mk([23.13, 113.26], 'Guangzhou 28.8 ℃', '广州 28.8 ℃', { dot: true, t: 1.2 }), mk([29.65, 91.13], 'Lhasa 16.3 ℃', '拉萨 16.3 ℃', { dot: true, c: C.ice, t: 1.5 }),
          mk([34, 86], 'Qinghai–Tibet: cool summer', '青藏高原：夏季凉爽', { big: true, c: C.ice, t: 1.9 })],
        fig: { k: 'climo', city: 'lhasa', b: 'beijing' },
        body: ['In July the Sun is high over the whole country and northern days are long, so most places are hot and the north–south gap shrinks: Harbin averages 23.5 ℃ and Guangzhou 28.8 ℃, only about 5 ℃ apart. The hottest place is the Turpan Basin, sunk below sea level, with July averages above 32 ℃. The big exception is the Qinghai–Tibet Plateau: air cools about 0.6 ℃ for every 100 m of height, so Lhasa, at 3,650 m and further south than Beijing, averages only 16 ℃ in July.',
          '7 月全国太阳高度都较大，北方白昼又长，所以除青藏高原外普遍高温，南北温差小：哈尔滨 7 月平均气温 23.5 ℃，广州 28.8 ℃，只相差约 5 ℃。最热的是低于海平面的吐鲁番盆地，7 月平均气温在 32 ℃ 以上。青藏高原是个例外：海拔每升高 100 米，气温约下降 0.6 ℃，拉萨海拔约 3650 米，纬度比北京低，7 月平均气温却只有 16 ℃ 左右。'],
      },
      {
        title: ['Temperature zones', '温度带的划分'], cam: [35, 106, 3.2], sketch: true,
        paint: [{ fill: { k: 'poly', pts: MID_T, c: TZ.mid, clip: CN }, a: 0.5 }, { fill: { k: 'poly', pts: COLD_T, c: TZ.cold, clip: CN }, a: 0.6, t: 0.3 },
          { fill: { k: 'poly', pts: WARM_T, c: TZ.warm, clip: CN }, a: 0.5, t: 0.6 }, { fill: { k: 'poly', pts: REGIONS.tarim, c: TZ.warm, clip: CN }, a: 0.6, t: 0.6 },
          { fill: { k: 'poly', pts: SOUTH_POLY, c: TZ.sub, clip: CN }, a: 0.5, t: 0.9 }, ...TROPIC_CN.map(p => ({ fill: { k: 'poly' as const, pts: p, c: TZ.trop, clip: CN }, a: 0.7, t: 1.2 })),
          { fill: { k: 'poly', pts: QT_POLY, c: TZ.plateau, clip: CN }, a: 0.5, t: 1.5 }],
        marks: [mk([52.2, 123.2], 'Cold temperate', '寒温带', { c: TZ.cold, t: 0.4 }), mk([45, 112], 'Middle temperate', '中温带', { big: true, c: TZ.mid, t: 0.5 }),
          mk([37.2, 115], 'Warm temperate', '暖温带', { big: true, c: TZ.warm, t: 0.8 }), mk([27, 112], 'Subtropical', '亚热带', { big: true, c: TZ.sub, t: 1.1 }),
          mk([19.2, 109.7], 'Tropical', '热带', { c: TZ.trop, t: 1.4 }), mk([33, 88], 'Qinghai–Tibet Plateau zone', '青藏高原区', { big: true, c: TZ.plateau, t: 1.7 })],
        fig: TZ_KEY,
        body: ['Geographers add up the daily mean temperatures of all days at or above 10 ℃, when most crops grow. This "accumulated temperature" rises from under 1,600 ℃ in the far north to over 8,000 ℃ on Hainan, and divides China into cold temperate, middle temperate, warm temperate, subtropical and tropical zones, plus the cold Qinghai–Tibet Plateau zone. More heat means more harvests: one crop a year in the Northeast, three crops in two years on the North China Plain, two to three on Hainan. The warm temperate–subtropical boundary follows Qinling–Huaihe.',
          '把一年中日平均气温 ≥10 ℃ 的各天气温相加，就得到积温，它反映了农作物生长期间获得的热量。积温从最北端的不足 1600 ℃ 增加到海南的 8000 ℃ 以上，据此把我国划分为寒温带、中温带、暖温带、亚热带、热带五个温度带，以及一个特殊的青藏高原区。热量越多，熟制越多：东北一年一熟，华北平原两年三熟，海南可一年三熟。暖温带和亚热带的分界线就是秦岭—淮河。'],
      },
      {
        title: ['Rainfall: from wet south-east to dry north-west', '降水：从东南沿海向西北内陆递减'], cam: [36, 104, 3.2], sketch: true,
        paint: [{ fill: { k: 'poly', pts: DRY, c: WATER.dry, clip: CN }, a: 0.5 }, { fill: { k: 'poly', pts: SEMIDRY, c: WATER.semidry, clip: CN }, a: 0.5, t: 0.4 },
          { fill: { k: 'poly', pts: SEMIWET, c: WATER.semiwet, clip: CN }, a: 0.5, t: 0.8 }, { fill: { k: 'poly', pts: WET, c: WATER.wet, clip: CN }, a: 0.5, t: 1.2 },
          { fill: { k: 'poly', pts: WET_NE, c: WATER.wet, clip: CN }, a: 0.7, t: 1.2 }],
        lines: [{ pts: ISO800, c: C.white, w: 1.5, dur: 1.2, t: 1.6 }, { pts: ISO400, c: C.white, w: 1.5, dur: 1.2, t: 1.9 }, { pts: ISO200, c: C.white, w: 1.5, dur: 1.2, t: 2.2 }],
        marks: [mk([27, 113], 'Humid', '湿润区', { big: true, c: WATER.wet, t: 1.3 }), mk([37.8, 113.5], 'Semi-humid', '半湿润区', { big: true, c: WATER.semiwet, t: 0.9 }),
          mk([43.4, 115], 'Semi-arid', '半干旱区', { big: true, c: WATER.semidry, t: 0.5 }), mk([41, 88], 'Arid', '干旱区', { big: true, c: WATER.dry, t: 0.2 }),
          mk([32.8, 116], '800 mm', '800 毫米', { c: C.white, t: 1.8 }), mk([38.3, 109.7], '400 mm', '400 毫米', { c: C.white, t: 2.1 }), mk([39.5, 106.3], '200 mm', '200 毫米', { c: C.white, t: 2.4 }),
          mk([25.05, 121.75], 'Huoshaoliao > 6,000 mm', '火烧寮 > 6000 毫米', { dot: true, c: C.blue, t: 2.6 }), mk([42.79, 88.65], 'Toksun < 10 mm', '托克逊 < 10 毫米', { dot: true, c: C.orange, t: 2.8 })],
        fig: RAIN_BARS,
        body: ['Rain comes mainly from summer sea winds, so yearly rainfall falls from the south-east coast to the north-west interior: Huoshaoliao in north-east Taiwan gets over 6,000 mm a year, while Toksun in the Turpan Basin gets under 10 mm. Comparing rainfall with evaporation gives four dry–wet regions. East of the 800 mm line (about Qinling–Huaihe) is humid, with forests and paddy fields; 400–800 mm is semi-humid, with dry farmland; 200–400 mm is semi-arid grassland for herding; under 200 mm is arid desert with oases. The 400 mm line also roughly divides farming land from herding land.',
          '我国降水主要来自夏季风带来的海洋水汽，因此年降水量从东南沿海向西北内陆递减：台湾东北部的火烧寮年降水量在 6000 毫米以上，吐鲁番盆地的托克逊不足 10 毫米。根据降水量与蒸发量的对比，全国分为四类干湿地区：800 毫米等降水量线（大致沿秦岭—淮河）以东以南为湿润区，多森林和水田；400—800 毫米为半湿润区，多旱地；200—400 毫米为半干旱区，以草原和畜牧业为主；200 毫米以下为干旱区，多荒漠和绿洲。400 毫米等降水量线也大致是农耕区与畜牧区的分界线。'],
      },
      {
        title: ['Summer and winter monsoons', '夏季风和冬季风'], cam: [36, 108, 3.3], sketch: true,
        paint: [{ fill: { k: 'poly', pts: MONSOON_REGION, c: C.teal, clip: CN }, a: 0.35, t: 3 }],
        lines: [...arrows([[[15, 125], [26, 118]], [[18, 135], [30, 124]], [[12, 92], [24, 100]]], C.teal, 0, 2.2),
          ...arrows([[[52, 95], [42, 108]], [[55, 110], [44, 118]], [[45, 125], [36, 120]]], C.ice, 1.5, 2.2), { pts: MONSOON_LINE, c: C.gold, w: 1.8, dur: 2, t: 3 }],
        marks: [mk([20, 130], 'Summer: warm, wet sea winds', '夏季风：温暖湿润', { c: C.teal, t: 0.8 }), mk([50, 103], 'Winter: cold, dry land winds', '冬季风：寒冷干燥', { c: C.ice, t: 2.3 }),
          mk([30, 112], 'Monsoon area', '季风区', { big: true, c: C.teal, t: 3.4 }), mk([41.5, 88], 'Non-monsoon area', '非季风区', { big: true, c: C.orange, t: 3.6 })],
        fig: { k: 'climo', city: 'shanghai', b: 'urumqi' },
        body: ['China lies on the east side of the biggest continent, facing the biggest ocean, so land and sea heat up and cool down very differently. In winter, cold dry winds pour out of Siberia and Mongolia, bringing cold waves. In summer, warm wet south-east winds from the Pacific and south-west winds from the Indian Ocean bring most of the year\'s rain. The summer monsoon rarely crosses the Greater Khingan–Yinshan–Helan–Bayan Har–Gangdise line: south-east of it is the monsoon area, north-west of it the dry non-monsoon area, as Shanghai\'s and Ürümqi\'s graphs show.',
          '我国位于世界最大的大陆——亚欧大陆东部，面临最大的大洋——太平洋，海陆热力性质差异大，季风显著。冬季，来自西伯利亚、蒙古一带的冬季风寒冷干燥，常带来寒潮；夏季，来自太平洋的东南季风和来自印度洋的西南季风温暖湿润，带来一年中的大部分降水。夏季风很难越过大兴安岭—阴山—贺兰山—巴颜喀拉山—冈底斯山一线：线的东南是季风区，西北是干燥的非季风区，比较上海和乌鲁木齐的气候图就能看出来。'],
      },
      {
        title: ['The rain belt moves north', '雨带的推移'], cam: [31, 114, 2.9], sketch: true,
        paint: [{ fill: { k: 'poly', pts: [[26, 104], [26, 123], [20.5, 123], [20.5, 104]], c: C.red, clip: CN }, a: 0.45 },
          { fill: { k: 'poly', pts: [[33.5, 104], [33.5, 123], [28, 123], [28, 104]], c: C.green, clip: CN }, a: 0.45, t: 1 },
          { fill: { k: 'poly', pts: [[47, 112], [47, 132], [35, 125], [35, 108]], c: C.gold, clip: CN }, a: 0.45, t: 2 }],
        lines: arrows([[[24, 112], [30, 113]], [[31, 116], [37, 116]]], C.white, 0.8, 2.2),
        marks: [mk([23.2, 110], 'May–June: South China', '5—6 月：华南', { big: true, c: C.red, t: 0.3 }), mk([30.8, 108], 'June–July: plum rains, Yangtze', '6—7 月：长江流域梅雨', { big: true, c: C.green, t: 1.3 }),
          mk([41, 117], 'July–August: North China, Northeast', '7—8 月：华北、东北', { big: true, c: C.gold, t: 2.3 }), mk([21, 116], 'September: retreats south', '9 月：雨带南撤', { c: C.white, t: 3 })],
        fig: RAIN_BELT,
        task: ['Read the graph: in which month does rain peak at Guangzhou, Shanghai and Beijing?', '读图：广州、上海、北京分别在哪个月降水最多？'],
        body: ['As the summer monsoon strengthens, the main rain belt marches north. It soaks South China in May and June, sits over the Yangtze valley from mid-June to mid-July as the long drizzly "plum rains" (meiyu), and reaches North China and the Northeast in July and August. In September it retreats quickly south. The monsoon is unstable: if it is weak and the belt lingers in the south, the south floods while the north suffers drought, as in the 1998 Yangtze floods; if it is strong, the pattern reverses.',
          '随着夏季风增强，主要雨带自南向北推移：5—6 月在华南；6 月中旬到 7 月中旬在长江中下游，连绵阴雨，正值梅子成熟，称为“梅雨”；7—8 月推进到华北和东北。9 月雨带迅速南撤。夏季风很不稳定：如果夏季风弱，雨带长期滞留南方，就会出现“南涝北旱”，如 1998 年长江流域大洪水；如果夏季风强，则会“北涝南旱”。'],
      },
      {
        title: ['A complex climate and the Qinling–Huaihe line', '气候复杂多样与秦岭—淮河一线'], cam: [35, 106, 3.2], sketch: true, items: ['cn_huangshan'],
        paint: [{ fill: { k: 'land', a2: CN, c: CLIMATES.continental.c }, a: 0.55 }, { fill: { k: 'poly', pts: MONSOON_REGION, c: CLIMATES.tmonsoon2.c, clip: CN }, a: 0.55, t: 0.2 },
          { fill: { k: 'poly', pts: SOUTH_POLY, c: CLIMATES.smonsoon.c, clip: CN }, a: 0.6, t: 0.4 }, ...TROPIC_CN.map(p => ({ fill: { k: 'poly' as const, pts: p, c: CLIMATES.tmonsoon.c, clip: CN }, a: 0.7, t: 0.6 })),
          { fill: { k: 'poly', pts: QT_POLY, c: CLIMATES.highland.c, clip: CN }, a: 0.6, t: 0.8 }],
        lines: [{ pts: QINLING_HUAIHE, c: C.gold, w: 2.2, dur: 1.6, t: 0.8 }],
        marks: [mk([36, 112.5], 'North: 0 ℃ in Jan below · <800 mm · warm temperate · semi-humid', '北：1 月 <0 ℃ · <800 毫米 · 暖温带 · 半湿润', { c: C.ice, t: 1.6 }),
          mk([30.5, 112.5], 'South: >0 ℃ · >800 mm · subtropical · humid', '南：1 月 >0 ℃ · >800 毫米 · 亚热带 · 湿润', { c: C.green, t: 2 })],
        fig: { k: 'key', set: 'climate', only: ['tmonsoon', 'smonsoon', 'tmonsoon2', 'continental', 'highland'] },
        body: ['Put temperature and rain together and China has five main climate types: tropical monsoon in the far south, subtropical monsoon south of Qinling–Huaihe, temperate monsoon in the north and north-east, temperate continental in the dry north-west, and highland climate on the Qinghai–Tibet Plateau. Monsoon climates bring heat and rain in the same season, ideal for rice and maize. The Qinling–Huaihe line sums it all up: it follows the 0 ℃ January isotherm and the 800 mm line and separates warm temperate from subtropical, semi-humid from humid, and temperate from subtropical monsoon.',
          '把气温和降水结合起来，我国主要有五种气候类型：最南部的热带季风气候，秦岭—淮河以南的亚热带季风气候，北方和东北的温带季风气候，西北干旱的温带大陆性气候，以及青藏高原的高原山地气候。季风气候雨热同期，有利于水稻、玉米等农作物生长。秦岭—淮河一线集中体现了南北差异：它大致与 1 月 0 ℃ 等温线和 800 毫米年等降水量线一致，是暖温带与亚热带、半湿润区与湿润区、温带季风气候与亚热带季风气候的分界线。'],
      },
      {
        title: ['Rivers: the Yangtze and the Yellow River', '河流：长江与黄河'], cam: [34, 105, 3], sketch: true, items: ['cn_yellowcrane', 'leshan'],
        paint: [{ fill: { k: 'poly', pts: LOESS_PLATEAU, c: C.brown, clip: CN }, a: 0.4, t: 2 }],
        lines: [{ pts: YANGTZE.slice(0, YZ.yichang + 1), c: C.blue, w: 1.8, flow: true, dur: 1.8 }, { pts: YANGTZE.slice(YZ.yichang, YZ.hukou + 1), c: C.teal, w: 1.8, flow: true, t: 1.6, dur: 0.8 },
          { pts: YANGTZE.slice(YZ.hukou), c: C.green, w: 1.8, flow: true, arrow: true, t: 2.2, dur: 0.8 },
          { pts: YELLOW.slice(0, YR.hekou + 1), c: C.gold, w: 1.8, flow: true, dur: 1.8, t: 0.3 }, { pts: YELLOW.slice(YR.hekou, YR.taohuayu + 1), c: C.brown, w: 2.2, flow: true, t: 1.9, dur: 0.8 },
          { pts: YELLOW.slice(YR.taohuayu), c: C.orange, w: 1.8, flow: true, arrow: true, t: 2.5, dur: 0.8 }, { pts: TARIM, c: C.ice, w: 1.4, flow: true, t: 3, dur: 1 }],
        marks: [mk(YANGTZE[YZ.yichang], 'Yichang', '宜昌', { dot: true, c: C.white, t: 1.7 }), mk(YANGTZE[YZ.hukou], 'Hukou', '湖口', { dot: true, c: C.white, t: 2.3 }),
          mk(YELLOW[YR.hekou], 'Hekou town', '河口镇', { dot: true, c: C.white, t: 2 }), mk(YELLOW[YR.taohuayu], 'Taohuayu', '桃花峪', { dot: true, c: C.white, t: 2.6 }),
          mk([37, 108.3], 'Loess Plateau: mud', '黄土高原：泥沙', { c: C.brown, t: 2.2 }), mk([41.3, 84.5], 'Tarim: longest inland river', '塔里木河：最长内流河', { c: C.ice, t: 3.2 })],
        body: ['Rivers in the wet monsoon area mostly flow out to the sea and swell in summer; in the dry north-west, inland rivers such as the Tarim (about 2,100 km, China\'s longest) are fed by melting snow and die out in the desert. The Yangtze, about 6,300 km, is China\'s longest river and carries the most water: its upper course ends at Yichang, its middle at Hukou, and it is a "golden waterway" rich in hydropower. The Yellow River (5,464 km) is divided at Hekou and Taohuayu; crossing the Loess Plateau it picks up so much mud that its lower bed is built up above the plain, a "river above the ground".',
          '季风区的河流多为外流河，夏季水量大；西北干旱区多内流河，如我国最长的内流河塔里木河（约 2100 千米），靠高山冰雪融水补给，最后消失在沙漠中。长江全长约 6300 千米，是我国第一长河，水量最大：宜昌以上为上游，宜昌至湖口为中游，湖口以下为下游，被誉为“黄金水道”，水能丰富。黄河全长 5464 千米，以内蒙古河口镇和河南郑州桃花峪为界分上、中、下游；中游流经黄土高原，带走大量泥沙，下游泥沙淤积，河床高出两岸地面，成为“地上河”。'],
      },
    ],
    quiz: [
      { q: ['The Qinling–Huaihe line roughly follows…', '秦岭—淮河一线大致与哪条线一致'], options: [['The 0 °C January isotherm', '1 月 0 ℃ 等温线'], ['The Tropic of Cancer', '北回归线'], ['The 400 mm rainfall line', '400 毫米年等降水量线'], ['The Great Wall', '长城']], answer: 0,
        why: ['And the 800 mm rainfall line; the 400 mm line runs much further north-west.', '也与 800 毫米年等降水量线大致一致；400 毫米等降水量线在更西北的位置。'] },
      { q: ['Which describe the land NORTH of the Qinling–Huaihe line? Pick all that apply.', '下列描述中，属于秦岭—淮河以北地区的有（多选）'],
        options: [['January average below 0 °C', '1 月平均气温低于 0 °C'], ['Dry fields growing wheat', '耕地以旱地为主，种植小麦'], ['Rivers freeze in winter', '冬季河流结冰'], ['Paddy fields growing rice', '耕地以水田为主，种植水稻'], ['Rivers stay ice-free all year', '河流终年不结冰']], multi: [0, 1, 2],
        why: ['The line roughly follows the 0 °C January isotherm and the 800 mm rainfall line: to the north winters freeze and farming is in dry fields; to the south paddy rice grows.', '秦岭—淮河一线大致与 1 月 0 °C 等温线和 800 毫米年等降水量线一致：以北冬季河流结冰，以旱地为主；以南以水田为主，种植水稻。'] },
      { q: ['Harbin\'s January average is −17.6 ℃ and Guangzhou\'s is 13.6 ℃. How many degrees apart are they?', '哈尔滨 1 月平均气温 −17.6 ℃，广州 13.6 ℃，两地相差多少摄氏度？'], num: { answer: 31.2, tol: 0.3, unit: ['℃', '℃'] },
        why: ['13.6 − (−17.6) = 31.2 ℃. In July they differ by only about 5 ℃: the winter gap is far larger.', '13.6 −（−17.6）= 31.2 ℃。而 7 月两地只相差约 5 ℃：冬季南北温差远大于夏季。'] },
      { q: ['Match each dry–wet region to its typical landscape.', '把干湿地区和它典型的景观连起来。'],
        match: [[['Humid (>800 mm)', '湿润区（>800 毫米）'], ['Forests and paddy fields', '森林、水田']], [['Semi-humid (400–800 mm)', '半湿润区（400—800 毫米）'], ['Dry farmland, wheat and maize', '旱地，小麦、玉米']],
          [['Semi-arid (200–400 mm)', '半干旱区（200—400 毫米）'], ['Grassland and herding', '草原、畜牧业']], [['Arid (<200 mm)', '干旱区（<200 毫米）'], ['Desert and oases', '荒漠、绿洲']]],
        why: ['Less water means fewer trees: forest gives way to dry farmland, then grassland, then desert where only irrigated oases can farm.', '水分越少，植被越稀疏：从森林到旱作农田，再到草原，最后是荒漠，只有绿洲可以灌溉耕作。'] },
      { q: ['This climograph is from a city at about 30°N. Which climate does it show?', '这幅气候图来自约北纬 30° 的一座城市，它是哪种气候？'], fig: { k: 'climo', city: 'lhasa', blind: true },
        options: [['Highland (Qinghai–Tibet)', '高原山地气候'], ['Subtropical monsoon', '亚热带季风气候'], ['Temperate continental', '温带大陆性气候'], ['Tropical monsoon', '热带季风气候']], answer: 0,
        why: ['At 30°N a lowland city would be about 28 ℃ in July, but this one peaks at only 16 ℃, so it must be very high: Lhasa at 3,650 m. Its summer rain comes from the south-west monsoon.', '北纬 30° 的低地城市 7 月气温约 28 ℃，这里最热月只有 16 ℃ 左右，说明海拔很高：这是海拔约 3650 米的拉萨，夏季的雨水来自西南季风。'] },
      { q: ['One summer the monsoon is weak and the rain belt stays over the Yangtze and South China far into July. What is most likely?', '某年夏季风偏弱，雨带到 7 月下旬仍滞留在长江以南。最可能出现'],
        options: [['Floods in the south, drought in the north', '南涝北旱'], ['Floods in the north, drought in the south', '北涝南旱'], ['Heavy snow in South China', '华南大雪'], ['Rain everywhere at once', '全国同时多雨']], answer: 0,
        why: ['The rain that should move north keeps falling on the south (floods), while North China waits for rain that never comes (drought), as in 1998.', '本该北移的雨带滞留南方，南方降水过多形成洪涝，北方迟迟等不到雨带，出现干旱，1998 年就是这样。'] },
      { q: ['Put the summer rain belt in order through the year.', '按时间顺序排列夏季雨带的推移。'],
        order: [['South China (May–June)', '华南（5—6 月）'], ['Yangtze valley plum rains (June–July)', '长江中下游梅雨（6—7 月）'], ['North China and the Northeast (July–August)', '华北、东北（7—8 月）'], ['Retreats to the south (September)', '迅速南撤（9 月）']],
        why: ['The rain belt advances north with the summer monsoon, then retreats quickly south in September as winter winds return.', '雨带随夏季风的增强自南向北推移，9 月冬季风来临，雨带迅速南撤。'] },
      { q: ['Label the points that divide the courses of the two great rivers.', '在地球上标出长江、黄河上中下游的分界点。'],
        place: [{ text: ['Yichang (Yangtze: upper | middle)', '宜昌（长江上游 | 中游）'], at: YANGTZE[YZ.yichang], tolKm: 300 }, { text: ['Hukou (Yangtze: middle | lower)', '湖口（长江中游 | 下游）'], at: YANGTZE[YZ.hukou], tolKm: 300 },
          { text: ['Hekou (Yellow R.: upper | middle)', '河口镇（黄河上游 | 中游）'], at: YELLOW[YR.hekou], tolKm: 300 }, { text: ['Taohuayu (Yellow R.: middle | lower)', '桃花峪（黄河中游 | 下游）'], at: YELLOW[YR.taohuayu], tolKm: 300 }],
        why: ['Yichang and Hukou divide the Yangtze; Hekou in Inner Mongolia and Taohuayu near Zhengzhou divide the Yellow River (older books use Jiumengjin, just to the west).', '长江以宜昌、湖口为界分上、中、下游；黄河以内蒙古河口镇、河南郑州桃花峪为界分上、中、下游（旧版教材以旧孟津为界，在桃花峪以西不远）。'] },
    ],
  },
];
