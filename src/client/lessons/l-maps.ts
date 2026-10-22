/** Lessons: maps. 七上 · 地球和地图 (2): scale, direction and legend; contour lines; plus map projections and time zones. */
import { C, T, arrows, mer, mk, par, type LL, type Lesson, type Pair } from './kit.ts';
import { arrowDef, svg, tx, type Lx } from './figs.ts';
import type { AstroClock } from './astro/types.ts';
import type { Opts as ProjOpts } from './astro/k-projection.ts';
import { RIVERS } from './geo.ts';
import type { Paint } from './stage.ts';

/** Map projection steps: the globe unrolls over a few seconds, and the user can scrub it. */
const UNROLL: AstroClock = { from: 0, to: 100, rate: 22, unit: 'x', once: true, fmt: ['Unrolled {v}%', '展开 {v}%'] };
const RESHAPE: AstroClock = { from: 0, to: 100, rate: 25, unit: 'x', once: true, fmt: ['Reshaped {v}%', '变换 {v}%'] };
type Region = NonNullable<ProjOpts['regions']>[number];
const GREENLAND: Region = { a2: ['GL'], c: C.ice, label: ['Greenland', '格陵兰岛'], at: [74, -40] };
const AFRICA: Region = { continent: 'africa', c: C.orange, label: ['Africa', '非洲'], at: [5, 20] };

const unit = ['The Earth and maps', '地球和地图'] as const;

/** A closed ring of radius `r`° around `c` (lon stretched so it looks round), its centre nudged east by `dx`°. */
const ring = (c: LL, r: number, dx = 0): LL[] => {
  const k = 1 / Math.cos((c[0] * Math.PI) / 180);
  return Array.from({ length: 41 }, (_, i) => {
    const a = (i / 40) * 2 * Math.PI;
    return [c[0] + r * Math.sin(a), c[1] + dx + r * k * Math.cos(a)] as LL;
  });
};
const FUJI: LL = [35.36, 138.73];
/** A sketch hill: contours bunched on the east side (steep), spread out on the west (gentle). */
const HILL: LL = [36, 133];

/** The 24 theoretical time zones, each 15° wide; the 12th is split in two by 180°. */
const ZONES: Paint[] = Array.from({ length: 24 }, (_, i) => {
  const z = i - 11; // −11 … +12
  const c = z === 0 ? C.gold : z === 8 ? C.red : i % 2 ? C.blue : C.violet;
  return z === 12 ? { fill: { k: 'strip', w: 172.5, e: -172.5, c }, t: i * 0.08, a: 0.32 } : { fill: { k: 'strip', w: z * 15 - 7.5, e: z * 15 + 7.5, c }, t: i * 0.08, a: 0.32 };
});
/** The International Date Line, simplified: it bends round Bering Strait, the Aleutians, Kiribati and Samoa–Tonga. */
const DATE_LINE: LL[] = [[89.9, 180], [75, 180], [68, -169], [65.5, -169], [52.5, 170], [48, 180], [5, 180], [4, -150], [-10, -150], [-11, -171], [-16, -171.5], [-45, -172.5], [-51, 180], [-89.9, 180]];

const BEIJING: LL = [39.9, 116.4], NEW_YORK: LL = [40.7, -74.0];
const TIANJIN: LL = [39.12, 117.2], HARBIN: LL = [45.8, 126.53], SHANGHAI: LL = [31.23, 121.47], CHENGDU: LL = [30.66, 104.07], ULAANBAATAR: LL = [47.92, 106.92];
const KUNMING: LL = [25.04, 102.71], QINGDAO: LL = [36.07, 120.38];

/* ---- figures: reading maps ---- */
const GOLD = '#ffd24a';
/** a scale bar of `n` alternate blocks, each `w` px wide and worth `v` units */
const bar = (x: number, y: number, n: number, w: number, v: number, unit: string) =>
  Array.from({ length: n }, (_, i) => `<rect x="${x + i * w}" y="${y}" width="${w}" height="5" class="${i % 2 ? 'fg-bw' : 'fg-bb'}"/>`).join('')
  + Array.from({ length: n + 1 }, (_, i) => tx(x + i * w, y + 14, String(i * v) + (i === n ? ' ' + unit : ''), 'fg-tick', i === n ? 's' : 'm')).join('');

/** Beijing → Tianjin measured on a 1 : 5 000 000 map */
const scaleCalcFig = (L: Lx, id: string) => {
  const ax = 40, ay = 50, bx = 118, by = 112; // 2.2 "cm" = 100 px apart
  const map = `<rect x="12" y="24" width="140" height="150" rx="4" class="fg-mapbox"/>`
    + `<path d="M${ax} ${ay} L${bx} ${by}" stroke="${GOLD}" stroke-width="1.6" stroke-dasharray="4 3" class="f-fade" style="--d:.3s"/>`
    + `<circle cx="${ax}" cy="${ay}" r="4" fill="#ff6b6b"/><circle cx="${bx}" cy="${by}" r="3.4" fill="#ffd24a"/>`
    + tx(ax + 7, ay - 3, L(['Beijing', '北京']), 'fg-label') + tx(bx - 6, by + 14, L(['Tianjin', '天津']), 'fg-label', 'm')
    + tx((ax + bx) / 2 + 10, (ay + by) / 2 - 4, L(['2.2 cm', '2.2 厘米']), 'fg-label', 's', ` style="fill:${GOLD}"`)
    + bar(22, 150, 2, 46, 50, 'km') + tx(82, 38, '1 : 5 000 000', 'fg-sub', 'm');
  const steps: Pair[] = [
    ['① 1 cm on the map = 5 000 000 cm', '① 图上 1 厘米 = 实地 5 000 000 厘米'],
    ['     = 50 000 m = 50 km', '     = 50 000 米 = 50 千米'],
    ['② measure: 2.2 cm', '② 量得图上距离 2.2 厘米'],
    ['③ 2.2 × 50 = 110 km', '③ 实地距离 = 2.2 × 50 = 110 千米'],
    ['or: ground = map ÷ scale', '或：实地距离 = 图上距离 ÷ 比例尺'],
    ['= 2.2 cm × 5 000 000 = 11 000 000 cm', '= 2.2 × 5 000 000 = 11 000 000 厘米'],
  ];
  const calc = steps.map((p, i) => `<g class="f-fade" style="--d:${(0.5 + i * 0.35).toFixed(2)}s">${tx(162, 46 + i * 20, L(p), i === 3 ? 'fg-label' : 'fg-sub', 's', i === 3 ? ` style="fill:${GOLD}"` : '')}</g>`).join('');
  return svg(320, 180, arrowDef(`${id}a`) + tx(160, 13, L(['Working out a real distance', '用比例尺计算实地距离']), 'fg-title', 'm') + map + calc, L(['Scale calculation', '比例尺计算']));
};

/** direction from the latitude–longitude grid: Qingdao is north-east of Kunming */
const gridFig = (L: Lx, id: string) => {
  const X = (lon: number) => 40 + (lon - 100) * 9, Y = (lat: number) => 160 - (lat - 20) * 6.5;
  const grid = [100, 105, 110, 115, 120, 125].map(o => `<line x1="${X(o)}" x2="${X(o)}" y1="${Y(42)}" y2="${Y(20)}" class="fg-grid"/>${tx(X(o), Y(20) + 11, o + '°E', 'fg-tick', 'm')}`).join('')
    + [20, 25, 30, 35, 40].map(a => `<line x1="${X(100)}" x2="${X(125)}" y1="${Y(a)}" y2="${Y(a)}" class="fg-grid"/>${tx(X(100) - 3, Y(a) + 3, a + '°N', 'fg-tick', 'e')}`).join('');
  const [ka, ko] = KUNMING, [qa, qo] = QINGDAO;
  const path = `<path d="M${X(ko)} ${Y(ka)} L${X(ko)} ${Y(qa)}" class="fg-note" stroke="#74c0fc" fill="none"/>`
    + `<path d="M${X(ko)} ${Y(qa)} L${X(qo)} ${Y(qa)}" class="fg-note" stroke="#ff8787" fill="none"/>`
    + `<path d="M${X(ko)} ${Y(ka)} L${X(qo) - 4} ${Y(qa) + 3}" stroke="${GOLD}" stroke-width="1.6" fill="none" marker-end="url(#${id}a)" class="f-draw" pathLength="1" style="--d:.8s"/>`;
  const dots = `<circle cx="${X(ko)}" cy="${Y(ka)}" r="3.5" fill="#63e6be"/><circle cx="${X(qo)}" cy="${Y(qa)}" r="3.5" fill="#ff6b6b"/>`
    + tx(X(ko) + 6, Y(ka) + 4, L(['A Kunming 25°N 103°E', 'A 昆明 25°N 103°E']), 'fg-label')
    + tx(X(qo), Y(qa) - 6, L(['B Qingdao 36°N 120°E', 'B 青岛 36°N 120°E']), 'fg-label', 'e')
    + tx(X(ko) - 4, (Y(ka) + Y(qa)) / 2, L(['higher lat: north', '纬度更高：偏北']), 'fg-sub', 'e', ' style="fill:#74c0fc"')
    + tx((X(ko) + X(qo)) / 2, Y(qa) - 6, L(['larger E long: east', '东经度数更大：偏东']), 'fg-sub', 'm', ' style="fill:#ff8787"');
  return svg(300, 182, arrowDef(`${id}a`, GOLD) + tx(150, 13, L(['B lies north-east of A', 'B 在 A 的东北方']), 'fg-title', 'm') + grid + path + dots, L(['Direction on a grid', '经纬网定向']));
};

/** looking down on the North Pole: meridians radiate, east is anticlockwise */
const polarFig = (L: Lx, id: string) => {
  const cx = 150, cy = 98, R = 72;
  const rings = [30, 60].map(a => `<circle cx="${cx}" cy="${cy}" r="${(R * (90 - a)) / 60}" class="fg-grid" fill="none"/>`).join('')
    + tx(cx + 3, cy + R / 2 + 2, '60°N', 'fg-tick') + tx(cx + 3, cy + R + 9, '30°N', 'fg-tick');
  // 0° at the bottom, 90°E to the right, 180° at the top, 90°W to the left
  const lab: [number, string, Pair][] = [[0, 'm', ['0°', '0°']], [90, 's', ['90°E', '90°E']], [180, 'm', ['180°', '180°']], [-90, 'e', ['90°W', '90°W']]];
  const mers = lab.map(([o, a, p]) => {
    const t = (o * Math.PI) / 180, x = cx + R * Math.sin(t), y = cy + R * Math.cos(t);
    return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#63e6be" stroke-width=".9"/>` + tx(x + (a === 's' ? 4 : a === 'e' ? -4 : 0), y + (o === 0 ? 11 : o === 180 ? -4 : 3), L(p), 'fg-label', a as 's' | 'm' | 'e');
  }).join('');
  const r = R * 0.75, a0 = 0.35, a1 = 1.2;
  const arc = `<path d="M${cx + r * Math.sin(a0)} ${cy + r * Math.cos(a0)} A${r} ${r} 0 0 0 ${cx + r * Math.sin(a1)} ${cy + r * Math.cos(a1)}" stroke="${GOLD}" stroke-width="1.8" fill="none" marker-end="url(#${id}a)" class="f-draw" pathLength="1" style="--d:.5s"/>`;
  const legend = tx(10, 40, L(['to the centre: north', '指向中心：北']), 'fg-sub') + tx(10, 52, L(['away from it: south', '背离中心：南']), 'fg-sub')
    + tx(232, 150, L(['anticlockwise: east', '逆时针：东']), 'fg-label', 's', ` style="fill:${GOLD}"`) + tx(232, 162, L(['clockwise: west', '顺时针：西']), 'fg-sub');
  return svg(300, 182, arrowDef(`${id}a`, GOLD) + tx(150, 13, L(['Over the North Pole', '北极上空俯视']), 'fg-title', 'm') + rings + mers + arc + `<circle cx="${cx}" cy="${cy}" r="3" fill="#ffd24a"/>` + legend, L(['Polar directions', '极地方向']));
};

/** a scale bar for the quiz: 1 cm (here 40 px) = 20 km */
const quizBarFig = (L: Lx) =>
  svg(300, 70, tx(150, 13, L(['Scale bar on a map', '某地图上的线段比例尺']), 'fg-title', 'm') + bar(70, 30, 3, 40, 20, 'km')
    + tx(70, 62, L(['each block is 1 cm long', '每一小段长 1 厘米']), 'fg-sub'), L(['Scale bar', '线段比例尺']));

export const MAPS: Lesson[] = [
  {
    id: 'maps', strand: 'maps', grade: 'g7a', tracks: ['uk', 'us', 'ib', 'au'], unit, icon: 'compass', minutes: 8,
    title: ['Reading maps', '地图的阅读'],
    blurb: ['Scale, direction and legend: the three things you need to read any map.', '比例尺、方向和图例：读懂任何地图都离不开这三样。'],
    keys: [
      ['Scale = distance on the map ÷ distance on the ground; it can be a ratio, words or a scale bar.', '比例尺 = 图上距离 ÷ 实地距离，可以写成数字式、文字式或线段式。'],
      ['Larger scale: smaller area, more detail. Smaller scale: bigger area, less detail.', '比例尺越大，表示的范围越小，内容越详细；比例尺越小，范围越大，内容越简略。'],
      ['Real distance = map distance ÷ scale; change units at the end (1 km = 100 000 cm).', '实地距离 = 图上距离 ÷ 比例尺，最后换算单位（1 千米 = 100 000 厘米）。'],
      ['Directions: follow the north arrow, or the grid (meridians N–S, parallels E–W), or else up is north.', '定方向：有指向标看指向标，有经纬网看经纬网（经线指南北，纬线指东西），都没有时“上北下南，左西右东”。'],
      ['The legend explains each symbol; labels give names and numbers. Choose a map by purpose, area and detail.', '图例说明各种符号的含义，注记写明名称和数字；要根据用途、范围和详略选择地图。'],
    ],
    steps: [
      {
        title: ['A town plan: large scale', '城市图：大比例尺'], cam: [51.5, -0.1, 1.2], items: ['towerbridge', 'bigben', 'londoneye'], names: true,
        marks: [mk([51.5, -0.1], 'London', '伦敦', { dot: true, c: C.gold, big: true, t: 0.3 })],
        fig: { k: 'dia', id: 'scale' },
        task: ['Zoom in and out on London: notice how streets and buildings disappear as the area shown grows.', '在伦敦上空放大、缩小地图：注意范围变大时，街道和建筑是怎样消失的。'],
        body: ['A map shrinks the real world, and the scale tells you by how much: scale = distance on the map ÷ distance on the ground. It can be written three ways: as a ratio (1 : 100 000), in words ("1 cm on the map = 1 km on the ground") or as a scale bar you measure against. All three say the same thing here, because 1 km = 1 000 m = 100 000 cm. Zoomed in this close on London, a map can show single streets and buildings such as Tower Bridge.',
          '地图把真实世界缩小了，比例尺告诉我们缩小了多少：比例尺 = 图上距离 ÷ 实地距离。比例尺有三种表示方法：数字式（1 : 100 000）、文字式（“图上 1 厘米代表实地距离 1 千米”）和线段式（画一段刻度尺来量）。这里三种写法意思相同，因为 1 千米 = 1000 米 = 100 000 厘米。像这样放大到伦敦市区，地图上能画出一条条街道和塔桥这样的建筑。'],
      },
      {
        title: ['Using the scale: Beijing to Tianjin', '用比例尺算距离：北京到天津'], cam: [39.6, 116.8, 1.5], names: true, items: ['forbidden'],
        lines: [{ pts: [BEIJING, TIANJIN], c: C.gold, t: 0.5, dur: 1.4, w: 1.5 }],
        marks: [mk(BEIJING, 'Beijing', '北京', { dot: true, c: C.red, big: true, t: 0.3 }), mk(TIANJIN, 'Tianjin', '天津', { dot: true, c: C.gold, big: true, t: 0.6 }), mk([39.4, 116.15], '≈ 110 km', '≈ 110 千米', { c: C.gold, t: 1.8 })],
        fig: { k: 'svg', draw: scaleCalcFig },
        task: ['Follow the three steps on the diagram, then check the answer against the gold line between the two cities.', '按图中三步算一算，再对照两城之间的金色连线。'],
        body: ['On a map of China at 1 : 5 000 000, Beijing and Tianjin are 2.2 cm apart. First turn the scale into words: 1 cm stands for 5 000 000 cm, which is 50 km. Then multiply: 2.2 × 50 = 110 km, close to the real straight-line distance. Always change the units at the end (100 000 cm = 1 km), and remember that roads and railways are longer than the straight line.',
          '在比例尺为 1 : 5 000 000 的中国地图上，量得北京到天津的图上距离为 2.2 厘米。先把比例尺换成文字式：图上 1 厘米代表实地 5 000 000 厘米，即 50 千米；再相乘：2.2 × 50 = 110 千米，与两地实际直线距离很接近。计算时要注意单位换算（100 000 厘米 = 1 千米），而且公路、铁路的里程总比直线距离长。'],
      },
      {
        title: ['Zoom out: scale, area and detail', '缩小地图：比例尺与范围、详略'], cam: [50, 5, 3.2], names: true, borders: true,
        marks: [mk([51.5, -0.1], 'London', '伦敦', { dot: true, c: C.gold }), mk([48.86, 2.35], 'Paris', '巴黎', { dot: true, c: C.teal, t: 0.4 })],
        lines: [{ pts: [[51.5, -0.1], [48.86, 2.35]], c: C.gold, t: 0.8, dur: 1.2 }],
        fig: { k: 'key', set: 'custom', title: ['Same page size, different scales', '图幅相同，比例尺不同'], items: [{ c: C.red, name: ['Town plan 1 : 10 000: streets, buildings', '城市街道图 1 : 10 000：街道、建筑'] }, { c: C.gold, name: ['Country map 1 : 5 000 000: cities, rivers', '国家地图 1 : 5 000 000：城市、河流'] }, { c: C.teal, name: ['World map 1 : 100 000 000: continents', '世界地图 1 : 100 000 000：大洲、大洋'] }] },
        body: ['Zoom out and London shrinks to a dot, but now the whole of Britain, France and their neighbours fit on the screen. London to Paris is about 340 km in a straight line, so on a 1 : 10 000 000 map they would be only 3.4 cm apart. The rule: on maps of the same size, the larger the scale, the smaller the area shown and the more detailed the content; the smaller the scale, the larger the area and the simpler the content. A world map might use 1 : 100 000 000, where 1 cm stands for 1 000 km.',
          '把地图缩小，伦敦缩成了一个点，但整个英国、法国和周边国家都进入了画面。伦敦到巴黎直线距离约 340 千米，在 1 : 10 000 000 的地图上只有 3.4 厘米。规律是：图幅相同时，比例尺越大，表示的范围越小，内容越详细；比例尺越小，表示的范围越大，内容越简略。世界地图的比例尺可能是 1 : 100 000 000，图上 1 厘米代表实地 1000 千米。'],
      },
      {
        title: ['Which way is north?', '地图上的方向：一般定向法和指向标'], cam: [38, 114, 3.4], names: true,
        lines: [BEIJING, BEIJING, BEIJING, BEIJING].map((b, i) => ({ pts: [b, [HARBIN, SHANGHAI, CHENGDU, ULAANBAATAR][i]], c: [C.red, C.teal, C.gold, C.violet][i], t: 0.4 + i * 0.4, dur: 1.2, arrow: true })),
        marks: [mk(BEIJING, 'Beijing', '北京', { dot: true, c: C.red, big: true, t: 0.2 }), mk(HARBIN, 'Harbin: NE', '哈尔滨：东北', { dot: true, c: C.red, t: 1.4 }), mk(SHANGHAI, 'Shanghai: SE', '上海：东南', { dot: true, c: C.teal, t: 1.8 }), mk(CHENGDU, 'Chengdu: SW', '成都：西南', { dot: true, c: C.gold, t: 2.2 }), mk(ULAANBAATAR, 'Ulaanbaatar: NW', '乌兰巴托：西北', { dot: true, c: C.violet, t: 2.6 })],
        fig: { k: 'dia', id: 'compass' },
        task: ['From Beijing, read the direction of each city using "up north, right east" and the eight compass points.', '以北京为中心，按“上北下南，左西右东”说出每座城市在北京的什么方向。'],
        body: ['Maps use three ways to show direction. With no north arrow and no grid, use the general rule: up is north, down is south, left is west, right is east. If there is a north arrow, its tip points north whichever way the map is turned. With eight compass points, Harbin is north-east of Beijing, Shanghai south-east, Chengdu south-west and Ulaanbaatar north-west.',
          '地图上辨别方向有三种方法。没有指向标和经纬网时，用一般定向法：“上北下南，左西右东”。有指向标的地图，指向标的箭头指向北方，不管地图怎么摆放都按它定向。用八个方向来描述：哈尔滨在北京的东北方，上海在东南方，成都在西南方，乌兰巴托在西北方。'],
      },
      {
        title: ['Direction by the latitude–longitude grid', '经纬网定向'], cam: [31, 112, 3], graticule: true,
        lines: [par(QINGDAO[0], C.gold, 0.4, { w: 1.1 }), mer(KUNMING[1], C.teal, 0.2, { w: 1.1 }), { pts: [KUNMING, QINGDAO], c: C.red, t: 1, dur: 1.6, arrow: true, w: 1.5 }],
        marks: [mk(KUNMING, 'A Kunming', 'A 昆明', { dot: true, c: C.teal, big: true, t: 0.3 }), mk(QINGDAO, 'B Qingdao', 'B 青岛', { dot: true, c: C.red, big: true, t: 0.6 })],
        fig: { k: 'svg', draw: gridFig },
        body: ['On a map with a grid, meridians point north–south and parallels point east–west, even when they are curved. Compare latitudes for north or south: in the Northern Hemisphere a higher number is further north. Compare longitudes for east or west: a larger east longitude (or smaller west longitude) is further east. Qingdao (36°N, 120°E) is both north and east of Kunming (25°N, 103°E), so it lies to the north-east.',
          '在有经纬网的地图上，经线指示南北方向，纬线指示东西方向，即使经纬线是弯曲的也一样。先比纬度定南北：北半球纬度数值越大越偏北；再比经度定东西：东经度数越大越偏东（西经度数越大越偏西）。青岛（36°N，120°E）比昆明（25°N，103°E）纬度高、东经度数大，所以青岛在昆明的东北方。'],
      },
      {
        title: ['Directions near the pole', '极地附近的方向'], cam: [89, 0, 3.4], graticule: true,
        lines: [mer(0, C.teal, 0), mer(90, C.teal, 0.2), mer(180, C.teal, 0.4), mer(-90, C.teal, 0.6), par(70, C.gold, 0.8, { dur: 2.4 })],
        marks: [mk([89.9, 0], 'North Pole', '北极点', { dot: true, c: C.gold, big: true, t: 0.3 }), mk([66, 90], '90°E', '东经 90°', { c: C.teal, t: 1 }), mk([66, -90], '90°W', '西经 90°', { c: C.teal, t: 1 })],
        fig: { k: 'svg', draw: polarFig },
        task: ['Pick any point on the gold circle: trace the way to the centre (north), then the way along the circle that is east.', '在金色纬线圈上任选一点：指出朝圆心的方向（北），再指出沿纬线圈向东是哪个方向。'],
        body: ['Looking down on the North Pole, "up is north" no longer works, so use the grid. Every meridian leads to the pole: toward the centre is north, and away from it is south in every direction. Seen from above the North Pole the Earth turns anticlockwise, so east is anticlockwise round the circles and west is clockwise. Over the South Pole it is the other way round: the Earth turns clockwise, and the centre is south.',
          '从北极上空俯视时，“上北下南”就不管用了，要用经纬网判断。每条经线都通向北极点：朝中心是北，离开中心无论朝哪边都是南。从北极上空看，地球逆时针自转，所以沿纬线逆时针方向是东，顺时针方向是西。从南极上空看正好相反：地球顺时针自转，中心是南。'],
      },
      {
        title: ['Legend and labels', '图例和注记'], cam: [33, 105, 3.2], items: ['forbidden', 'greatwall', 'everest'],
        lines: [{ pts: RIVERS.yangtze, c: C.blue, t: 0.2, dur: 2.2 }, { pts: RIVERS.yellow, c: C.blue, t: 0.6, dur: 2.2 }],
        marks: [mk([39.9, 116.4], 'Beijing (capital)', '北京（首都）', { dot: true, c: C.red, t: 0.4 }), mk([31.23, 121.47], 'Shanghai', '上海', { dot: true, c: C.gold, t: 0.7 }), mk([28, 86.9], '▲ Everest 8,848.86 m', '▲ 珠穆朗玛峰 8848.86 米', { c: C.brown, t: 1 }), mk([30.5, 112], 'Yangtze River', '长江', { c: C.blue, t: 2.2 })],
        fig: { k: 'key', set: 'custom', title: ['Legend', '图例'], items: [{ c: C.red, name: ['Capital city', '首都'] }, { c: C.gold, name: ['Other city', '其他城市'] }, { c: C.blue, name: ['River', '河流'] }, { c: C.brown, name: ['▲ Mountain peak (altitude)', '▲ 山峰（海拔）'] }, { c: '#5fa4e6', name: ['National boundary', '国界'] }] },
        body: ['Maps use symbols and colours to stand for real things: a star or red dot for a capital, blue lines for rivers, a triangle for a peak, and fine lines for national boundaries. The legend (map key) explains these symbols, so always read it first. Labels are the words and numbers on the map: place names such as "Yangtze River", and figures such as 8,848.86 m, the altitude of Everest. A complete map has a title, scale, direction sign, legend and labels.',
          '地图用各种符号和颜色表示实际事物：首都用五角星或红点，河流用蓝色的线，山峰用三角形，国界用特定的线条。图例说明这些符号的含义，读图时要先看图例。注记是地图上的文字和数字：地名如“长江”，数字如珠穆朗玛峰的海拔 8848.86 米。一幅完整的地图通常有图名、比例尺、方向、图例和注记。'],
      },
      {
        title: ['Choosing the right map', '地图的选择和应用'], cam: [40.1, 116.4, 1.3], items: ['forbidden', 'greatwall'], names: true,
        marks: [mk(BEIJING, 'Tian\'anmen', '天安门', { dot: true, c: C.red, t: 0.3 }), mk([40.43, 116.57], 'Great Wall (Mutianyu)', '长城（慕田峪）', { dot: true, c: C.gold, t: 0.7 })],
        fig: { k: 'key', set: 'custom', title: ['Need → map', '需要 → 地图'], items: [{ c: C.red, name: ['Visit the Palace Museum → a tourist map', '游览故宫 → 导游图'] }, { c: C.gold, name: ['Get round the city → a town plan or metro map', '在城里找路 → 城市交通图、地铁图'] }, { c: C.teal, name: ['Hike to the Great Wall → a large-scale topographic map', '徒步长城 → 大比例尺地形图'] }, { c: C.blue, name: ['Compare provinces → a small-scale political map', '比较各省 → 小比例尺政区图'] }, { c: C.violet, name: ['Plan a trip today → a digital map with satellite navigation', '规划今天的行程 → 带卫星导航的电子地图'] }] },
        task: ['You have one day in Beijing: decide which map you need for the Palace Museum, the metro and a Great Wall hike.', '假如你在北京玩一天：游故宫、坐地铁、徒步长城，各需要哪种地图？'],
        body: ['There is no single best map: choose by purpose and by how much area and detail you need. A tourist map of the Palace Museum shows halls and exits, a metro map shows lines and stations, and a large-scale topographic map with contours suits a hike to the Great Wall. To compare provinces you need a small-scale map covering all of China. Today digital maps join satellite images (remote sensing) with positioning from China\'s BeiDou system, so they can zoom from country to street and plan a route live.',
          '没有“万能地图”，要根据用途，以及需要的范围大小和内容详略来选择地图。游览故宫用导游图，上面画着宫殿和出入口；坐地铁用地铁线路图；徒步去长城最好用带等高线的大比例尺地形图；比较各省份则要用表示全国范围的小比例尺地图。如今的电子地图结合了卫星遥感影像和我国北斗卫星导航系统的定位，能从全国一直放大到街道，并实时规划路线。'],
      },
    ],
    quiz: [
      { q: ['Which scale is the largest?', '下列比例尺中，最大的是'], options: [['1 : 10 000', '比例尺 1 : 10 000'], ['1 : 100 000', '比例尺 1 : 100 000'], ['1 : 1 000 000', '比例尺 1 : 1 000 000'], ['1 : 10 000 000', '比例尺 1 : 10 000 000']], answer: 0,
        why: ['1 : 10 000 is the biggest fraction (1/10 000), so it is the largest scale: small area, lots of detail.', '1 : 10 000 这个分数最大，所以比例尺最大：范围小，内容详细。'] },
      { q: ['On this map two villages are 4.5 cm apart. How far apart are they on the ground?', '在这幅地图上，两村相距 4.5 厘米，实地距离是多少千米？'], fig: { k: 'svg', draw: quizBarFig }, num: { answer: 90, tol: 0.5, unit: ['km', '千米'] },
        why: ['Each 1 cm block of the bar stands for 20 km, so 4.5 × 20 = 90 km. As a ratio the scale is 1 : 2 000 000.', '线段比例尺上每 1 厘米代表 20 千米，4.5 × 20 = 90 千米。写成数字式是 1 : 2 000 000。'] },
      { q: ['Point A is at 30°N, 100°E and point B at 40°N, 110°E. In which direction is B from A?', 'A 点位于 30°N、100°E，B 点位于 40°N、110°E。B 在 A 的什么方向？'], options: [['North-east', '东北方'], ['North-west', '西北方'], ['South-east', '东南方'], ['South-west', '西南方']], answer: 0,
        why: ['B has the higher north latitude, so it is further north; it has the larger east longitude, so it is further east. Together: north-east.', 'B 的北纬度数大，偏北；东经度数大，偏东。合起来，B 在 A 的东北方。'] },
      { q: ['A map has no north arrow and no grid. The top of the map is…', '一幅地图没有指向标和经纬网，地图的上方是'], options: [['North', '北方'], ['South', '南方'], ['East', '东方'], ['It cannot be told', '无法判断']], answer: 0,
        why: ['Then use the general rule "up is north, down is south, left is west, right is east".', '这时用一般定向法：“上北下南，左西右东”。'] },
      { q: ['Match each task to the most suitable map.', '把要做的事和最合适的地图连起来。'],
        match: [[['Find the exits of the Palace Museum', '找故宫的出口'], ['Tourist map', '导游图']], [['Change lines on the metro', '换乘地铁'], ['Metro map', '地铁线路图']], [['Choose a gentle path up a hill', '选一条坡缓的上山路'], ['Topographic (contour) map', '等高线地形图']], [['Compare the sizes of provinces', '比较各省区面积'], ['Small-scale political map', '小比例尺政区图']]],
        why: ['Pick a map by purpose: detail of one site, routes, relief, or a large area at a glance.', '要根据用途选择地图：看一处景点的细节、找交通路线、看地势起伏，还是看大范围的概况。'] },
      { q: ['Find Harbin, the city north-east of Beijing.', '在地球上点出位于北京东北方的哈尔滨。'], at: [45.8, 126.53], tolKm: 400,
        why: ['Harbin is in Heilongjiang, about 1,050 km north-east of Beijing.', '哈尔滨在黑龙江省，位于北京东北方约 1050 千米处。'] },
      { q: ['Maps drawn on the same size of paper: put them in order from the largest scale to the smallest.', '用同样大小的纸画地图，把它们按比例尺从大到小排序。'],
        order: [['A plan of your school', '学校平面图'], ['A town plan', '城市街道图'], ['A map of a country', '国家地图'], ['A world map', '世界地图']],
        why: ['On the same sheet, the smaller the area shown, the larger the scale. A school plan shows the least ground in the most detail; a world map the most ground in the least detail.', '图幅相同时，表示的范围越小，比例尺越大。学校平面图范围最小、内容最详细，世界地图范围最大、内容最简略。'] },
      { q: ['London and Paris are about 340 km apart. How many centimetres apart are they on a 1 : 10 000 000 map?', '伦敦和巴黎实地相距约 340 千米。在比例尺为 1 : 10 000 000 的地图上，两地相距多少厘米？'], num: { answer: 3.4, tol: 0.05, unit: ['cm', '厘米'] },
        why: ['340 km = 34 000 000 cm, and 34 000 000 ÷ 10 000 000 = 3.4 cm. (On this scale 1 cm stands for 100 km.)', '340 千米 = 34 000 000 厘米，34 000 000 ÷ 10 000 000 = 3.4 厘米。（这个比例尺上图上 1 厘米代表实地 100 千米。）'] },
    ],
  },
  {
    id: 'contours', strand: 'maps', grade: 'g7a', tracks: ['uk', 'ib', 'au'], unit, icon: 'mountain', minutes: 6,
    title: ['Contour lines and relief maps', '等高线地形图'],
    blurb: ['How a flat map shows hills and valleys: contours, colours and cross-sections.', '平面的地图怎样表示高低起伏：等高线、分层设色和地形剖面图。'],
    keys: [
      ['Altitude is height above sea level; relative height is the difference between two places.', '海拔是地面某点高出海平面的垂直距离；相对高度是两地之间的高度差。'],
      ['A contour line joins points of equal altitude; the contour interval is the height between lines.', '等高线是把海拔相同的点连成的线；相邻两条等高线的高度差叫等高距。'],
      ['Lines close together: steep slope; far apart: gentle slope; lines merging: a cliff.', '等高线密集，坡陡；稀疏，坡缓；几条等高线重合处是陡崖。'],
      ['Layered-colour maps: green for lowlands, yellow to brown for higher ground, white for snow and ice.', '分层设色地形图：绿色表示平原等低地，黄色到褐色表示较高的地区，白色表示冰雪。'],
    ],
    steps: [
      {
        title: ['How high is it?', '海拔和相对高度'], cam: [28, 86.9, 1.6], items: ['everest'],
        lines: [{ pts: [[26.5, 86.9], [28, 86.9]], c: C.gold, t: 0.4, dur: 1.4, arrow: true }],
        marks: [mk([28, 86.9], 'Everest: 8,849 m above sea level', '珠穆朗玛峰：海拔 8849 米', { dot: true, c: C.gold, big: true, t: 1.6 }), mk([29.6, 91.1], 'Lhasa ≈ 3,650 m', '拉萨 ≈ 3650 米', { dot: true, c: C.teal, t: 2.2 })],
        body: ['Altitude is how high a place is above sea level. Mount Everest is the highest mountain on Earth at about 8,849 m. Relative height is how much higher one place is than another: Everest is about 5,200 m higher than Lhasa.',
          '海拔是地面某个地点高出海平面的垂直距离。珠穆朗玛峰海拔约 8849 米，是世界最高峰。相对高度是两个地点之间的高度差：珠穆朗玛峰比拉萨高约 5200 米。'],
      },
      {
        title: ['Contour lines', '等高线'], cam: [35.4, 138.7, 1.7], items: ['fuji'], sketch: true,
        lines: [3, 2, 1.3, 0.7].map((r, i) => ({ pts: ring(FUJI, r), c: [C.green, C.lime, C.brown, C.white][i], t: 0.3 + i * 0.5, dur: 1.4, closed: true })),
        marks: [mk(FUJI, 'Mt Fuji 3,776 m', '富士山 3776 米', { dot: true, c: C.gold, big: true, t: 2.4 }), mk([35.36 - 3, 138.73], '1,000 m', '1000 米', { c: C.green, t: 0.6 }), mk([35.36 - 0.7, 138.73], '3,000 m', '3000 米', { c: C.white, t: 1.8 })],
        fig: { k: 'dia', id: 'contour' },
        task: ['Turn round Mount Fuji: see that the rings sit one inside another, with the highest in the middle.', '绕着富士山转一圈：看看这些闭合的圈一圈套一圈，海拔最高的在中间。'],
        body: ['Imagine slicing a mountain at every 1,000 m and drawing the edge of each slice from above: those rings are contour lines, each joining points of the same altitude. The height between two neighbouring lines is the contour interval. (The rings round Mount Fuji are drawn hugely enlarged.)',
          '想象把一座山每隔 1000 米切一刀，再从上往下把每一层的边缘画出来，这些圈就是等高线，每条线上各点的海拔都相同。相邻两条等高线的高度差叫等高距。（富士山周围的圈是放大很多倍画出的示意。）'],
      },
      {
        title: ['Steep or gentle?', '坡陡还是坡缓'], cam: [36, 133.5, 1.9], sketch: true,
        lines: [2.6, 2, 1.4, 0.8, 0.3].map((r, i) => ({ pts: ring(HILL, r, (2.6 - r) * 0.9), c: C.brown, t: 0.2 + i * 0.3, dur: 1.2, closed: true })),
        marks: [mk([36, 136.9], 'Lines close: steep', '等高线密集：坡陡', { c: C.red, t: 1.8 }), mk([36, 130], 'Far apart: gentle', '等高线稀疏：坡缓', { c: C.green, t: 2.1 })],
        fig: { k: 'dia', id: 'contour' },
        task: ['Compare the gaps between the rings on the east and west sides of the hill: which side would you choose to climb?', '比较这座山东西两侧等高线的间距：你会选哪一侧上山？'],
        body: ['Where contour lines crowd together, the ground climbs a lot in a short distance: the slope is steep. Where they are spread out, the slope is gentle. On this sketch hill the east side is steep and the west side is an easy walk up.',
          '等高线密集的地方，在很短的水平距离内高度变化很大，坡陡；等高线稀疏的地方，坡缓。在这座示意的山上，东坡陡峭，西坡平缓，从西边上山更省力。'],
      },
      {
        title: ['Peaks, ridges, valleys, saddles, cliffs', '山顶、山脊、山谷、鞍部、陡崖'], cam: [36.1, -112.1, 1.7], items: ['grandcanyon'], sketch: true,
        lines: [
          { pts: [[36.45, -113.9], [36.1, -112.1], [36.3, -111.6]], c: C.blue, t: 0.2, dur: 1.6 },
          { pts: [[36.75, -113.9], [36.4, -112.1], [36.6, -111.6]], c: C.brown, t: 1, dur: 1.4 }, { pts: [[36.8, -113.9], [36.45, -112.1], [36.65, -111.6]], c: C.brown, t: 1.2, dur: 1.4 },
          { pts: [[36.15, -113.9], [35.8, -112.1], [36, -111.6]], c: C.brown, t: 1, dur: 1.4 }, { pts: [[36.1, -113.9], [35.75, -112.1], [35.95, -111.6]], c: C.brown, t: 1.2, dur: 1.4 },
        ],
        marks: [mk([36.1, -112.1], 'Grand Canyon', '科罗拉多大峡谷', { dot: true, c: C.gold, big: true, t: 0.4 }), mk([36.6, -112.8], 'Cliff: lines merge', '陡崖：等高线重合', { c: C.red, t: 2 })],
        fig: { k: 'dia', id: 'valleys' },
        body: ['A peak is a closed ring with the highest value inside. Where contours bend toward lower ground you have a ridge; where they bend toward higher ground you have a valley, and rivers flow in valleys. A saddle is the low point between two peaks, and where several contours merge there is a cliff, like the walls of the Grand Canyon.',
          '等高线闭合、中间数值最大的是山顶。等高线向海拔低处凸出的是山脊，向海拔高处凸出的是山谷，河流往往发育在山谷中。两个山顶之间相对低的部位是鞍部。几条等高线重合的地方是陡崖，比如科罗拉多大峡谷的崖壁。'],
      },
      {
        title: ['Layered-colour relief maps', '分层设色地形图'], cam: [34, 105, 3.2], sketch: true,
        paint: [
          { fill: { k: 'poly', pts: [[36.5, 75], [37, 90], [36, 100], [33, 103], [28, 99], [27.5, 88], [30, 79], [33, 75]], c: C.brown, clip: ['CN', 'IN', 'NP', 'BT', 'PK'] }, t: 0.2, a: 0.6 },
          { fill: { k: 'poly', pts: [[40.5, 114.5], [40, 118.5], [37.5, 119], [34.5, 120.5], [32, 118], [32.5, 114], [35.5, 113.5], [38, 114]], c: C.green, clip: ['CN'] }, t: 0.8, a: 0.6 },
          { fill: { k: 'poly', pts: [[41.5, 105], [41.5, 113], [38, 113], [35, 112], [34.5, 107], [37, 104]], c: C.gold, clip: ['CN'] }, t: 1.4, a: 0.5 },
        ],
        marks: [mk([32.5, 88], 'Plateau: brown', '高原：褐色', { c: C.brown, t: 0.4 }), mk([36, 117], 'Plain: green', '平原：绿色', { c: C.green, t: 1 }), mk([38.5, 109], 'Higher land: yellow', '较高的地区：黄色', { c: C.gold, t: 1.6 })],
        fig: { k: 'key', set: 'custom', title: ['Layered colours (altitude)', '分层设色（海拔）'], items: [{ c: '#2f9e44', name: ['Below 200 m', '200 米以下'] }, { c: '#c0eb75', name: ['200–500 m', '200—500 米'] }, { c: '#ffd43b', name: ['500–1,000 m', '500—1000 米'] }, { c: '#d9a066', name: ['1,000–3,000 m', '1000—3000 米'] }, { c: '#9c6b3c', name: ['Over 3,000 m', '3000 米以上'] }, { c: '#4dabf7', name: ['Sea and lakes', '海洋和湖泊'] }] },
        body: ['Colour the land between contour lines and the relief jumps out. Usually green means low plains, yellow higher land, browns mountains and plateaus, and blue the sea, darker where deeper. On this sketch, the brown Tibetan Plateau towers over the green North China Plain.',
          '在等高线之间涂上不同的颜色，地势高低就一目了然，这就是分层设色地形图。一般用绿色表示平原，黄色表示较高的地区，褐色表示山地和高原，蓝色表示海洋，颜色越深海越深。在这幅示意图上，褐色的青藏高原远远高出绿色的华北平原。'],
      },
      {
        title: ['A cross-section', '地形剖面图'], cam: [29, 87, 2.4],
        lines: [{ pts: [[25.5, 85.5], [28, 86.9], [31.5, 88.5]], c: C.gold, t: 0.3, dur: 2, w: 1.4 }],
        marks: [mk([25.5, 85.5], 'A: Ganges Plain ≈ 50 m', 'A：恒河平原 ≈ 50 米', { dot: true, c: C.green, t: 0.4 }), mk([28, 86.9], 'Himalayas', '喜马拉雅山脉', { c: C.white, t: 1.4 }), mk([31.5, 88.5], 'B: Tibetan Plateau ≈ 4,500 m', 'B：青藏高原 ≈ 4500 米', { dot: true, c: C.brown, t: 2.2 })],
        fig: { k: 'dia', id: 'contour' },
        body: ['Draw a line across a contour map, note the height wherever it crosses a contour, then plot those heights above the line: you get a cross-section, a side view of the land. Along this line from A to B you would rise from the Ganges Plain, over the Himalayas, onto the high Tibetan Plateau.',
          '在等高线地形图上画一条线，记下它与每条等高线交点的海拔，再把这些高度画到图下方，就得到地形剖面图，即从侧面看到的地势起伏。沿着这条 A—B 线，地势从恒河平原升起，翻过喜马拉雅山脉，登上高高的青藏高原。'],
      },
    ],
    quiz: [
      { q: ['Where contour lines are close together, the slope is…', '等高线密集的地方，坡度'], options: [['Steep', '陡'], ['Gentle', '缓'], ['Flat', '平坦'], ['Underwater', '在水下']], answer: 0,
        why: ['Close lines mean a big rise over a short distance.', '等高线密集，说明在很短的水平距离内高度变化大，坡陡。'] },
      { q: ['On a map with a 100 m contour interval, neighbouring contour lines differ in height by…', '等高距为 100 米的地图上，相邻两条等高线的高度相差'], options: [['100 m', '100 米'], ['10 m', '10 米'], ['1,000 m', '1000 米'], ['It varies', '不一定']], answer: 0,
        why: ['That is what the contour interval means; on one map it stays the same.', '这就是等高距的含义，同一幅地图上的等高距是相同的。'] },
      { q: ['Several contour lines merge into one. This shows…', '几条等高线重合在一起，表示'], options: [['A cliff', '陡崖'], ['A saddle', '鞍部'], ['A plain', '平原'], ['A valley', '山谷']], answer: 0,
        why: ['Heights change almost straight up in no horizontal distance: a cliff.', '高度几乎垂直变化，水平距离近乎为零，是陡崖。'] },
      { q: ['On a layered-colour relief map, green usually shows…', '分层设色地形图上，绿色一般表示'], options: [['Low plains', '平原等低地'], ['High plateaus', '高原'], ['Deep sea', '深海'], ['Snow and ice', '冰雪']], answer: 0,
        why: ['Green for lowlands, yellow and brown for higher ground, blue for water, white for ice.', '绿色表示低地，黄色、褐色表示较高的地区，蓝色表示水域，白色表示冰雪。'] },
      { q: ['Find Mount Everest, the highest peak on Earth.', '在地球上点出世界最高峰——珠穆朗玛峰。'], at: [28, 86.9], tolKm: 500,
        why: ['Everest is in the Himalayas, on the border of China and Nepal.', '珠穆朗玛峰位于喜马拉雅山脉，在中国和尼泊尔边界上。'] },
      { q: ['Match each contour pattern to the landform it shows.', '把等高线的特点和它表示的地形部位连起来。'],
        match: [[['Closed rings, highest value in the middle', '等高线闭合，中间数值最大'], ['Peak', '山顶']], [['Contours bend out toward lower ground', '等高线向海拔低处凸出'], ['Ridge', '山脊']], [['Contours bend in toward higher ground', '等高线向海拔高处凸出'], ['Valley', '山谷']], [['The low point between two peaks', '两个山顶之间相对低的部位'], ['Saddle', '鞍部']]],
        why: ['A ridge pushes downhill, so its contours bulge toward lower values; a valley cuts uphill, so its contours bulge toward higher values. Rivers form in valleys, never on ridges.', '山脊向低处延伸，等高线向海拔低处凸出；山谷向高处深入，等高线向海拔高处凸出。河流发育在山谷中，不会在山脊上。'] },
      { q: ['Everest is about 8,849 m above sea level and Lhasa about 3,650 m. What is the relative height between them?', '珠穆朗玛峰海拔约 8849 米，拉萨海拔约 3650 米。两地的相对高度是多少米？'], num: { answer: 5199, tol: 5, unit: ['m', '米'] },
        why: ['Relative height is the difference in altitude: 8,849 − 3,650 = 5,199 m, about 5,200 m.', '相对高度是两地海拔之差：8849 − 3650 = 5199 米，约 5200 米。'] },
    ],
  },
  {
    id: 'projections', strand: 'maps', tracks: ['us', 'uk', 'ib'], unit, icon: 'globe', minutes: 8,
    title: ['Map projections', '地图投影'],
    blurb: ['Why every flat map stretches something, and why the globe tells the truth.', '为什么平面地图总会变形，为什么地球仪最真实。'],
    keys: [
      ['A round Earth cannot be laid flat without stretching or tearing, so every flat map distorts.', '球面无法不拉伸、不撕裂地展平，所以平面地图都有变形。'],
      ['Mercator keeps shapes and compass directions but blows up areas near the poles.', '墨卡托投影保持形状和方向，但越靠近两极，面积放大越多。'],
      ['Equal-area maps keep sizes true but squash shapes.', '等积投影地图面积准确，但形状被压扁拉长。'],
      ['The shortest route between two places is a great circle; on a flat map it often looks curved.', '两地之间的最短路线是大圆航线，在平面地图上往往是一条弯线。'],
    ],
    steps: [
      {
        title: ['Peeling an orange', '把橘子皮摊平'],
        astro: { kit: 'projection', to: 'plate', clock: UNROLL },
        task: ['Drag the slider back and forth to wrap and unroll the globe: watch which parts of the grid get stretched most.', '来回拖动滑块，把地球“套”上圆柱再展开：看看经纬网哪部分被拉伸得最厉害。'],
        body: ['Try to flatten an orange peel and it splits or stretches. The Earth\'s surface is the same: a sphere cannot be laid flat without distortion. Watch the globe wrap onto a cylinder and unroll: the meridians, which meet at the poles, end up side by side, so the polar regions are stretched sideways. A map projection is a way of drawing the round grid on a flat sheet, and each one chooses what to get wrong: area, shape, distance or direction.',
          '把橘子皮压平，它一定会裂开或被拉伸。地球表面也一样：球面无法不变形地展成平面。看地球先“套”上一个圆柱，再展开成平面：原本在两极汇聚的经线被拉成了平行线，所以越靠近两极，东西方向拉伸得越厉害。地图投影就是把球面上的经纬网画到平面上的方法，每种投影都要在面积、形状、距离或方向上做出取舍。'],
      },
      {
        title: ['Mercator: Greenland vs Africa', '墨卡托投影：格陵兰岛和非洲'],
        astro: { kit: 'projection', to: 'mercator', tissot: true, lon0: -10, regions: [GREENLAND, AFRICA], clock: UNROLL },
        task: ['Drag the slider slowly: compare the size of Greenland with Africa on the globe and again on the flat map.', '慢慢拖动滑块：比较格陵兰岛和非洲在地球上和在平面地图上的大小。'],
        fig: { k: 'bars', title: ['Real area (approx.)', '实际面积（约）'], unit: ['million km²', '百万平方千米'], rows: [{ name: ['Africa', '非洲'], v: 30.3, c: C.orange }, { name: ['South America', '南美洲'], v: 17.8, c: C.violet }, { name: ['Australia', '澳大利亚'], v: 7.7, c: C.teal }, { name: ['Greenland', '格陵兰岛'], v: 2.2, c: C.ice }] },
        body: ['On the globe the red circles are all the same size. Mercator spreads the parallels further and further apart toward the poles, so the circles swell: at 60° they are twice as wide and four times the area. Greenland ends up looking about as big as Africa, though Africa is about 14 times larger. Sailors still love it: shapes stay right and a constant compass course is a straight line.',
          '在地球上，这些红色小圆一样大。墨卡托投影越靠近两极，纬线间距拉得越大，小圆也被放大：在纬度 60° 处，小圆变宽到 2 倍，面积变成 4 倍。于是格陵兰岛看起来和非洲差不多大，而实际上非洲的面积约是它的 14 倍。不过航海者很喜欢这种地图：形状不走样，按固定方向航行的路线是一条直线。'],
      },
      {
        title: ['Equal-area maps', '等积投影'],
        astro: { kit: 'projection', from: 'mercator', to: 'peters', tissot: true, lon0: -10, regions: [GREENLAND, AFRICA], clock: RESHAPE },
        fig: { k: 'key', set: 'custom', title: ['What each one keeps true', '各自保持准确的是'], items: [{ c: C.blue, name: ['Mercator: shapes and directions', '墨卡托投影：形状和方向'] }, { c: C.orange, name: ['Equal-area: sizes', '等积投影：面积'] }, { c: C.green, name: ['Globe: all of them', '地球仪：全部'] }] },
        body: ['Now the Mercator map turns into the Gall–Peters map. Greenland shrinks back to its true size next to Africa, and every red circle covers the same area again. The price is shape: near the poles the circles are squashed flat, near the equator they are stretched tall. Equal-area maps are the right choice for comparing sizes, such as forests or farmland.',
          '现在墨卡托地图变成了高尔—彼得斯投影地图。格陵兰岛缩回了真实大小，和非洲一比就差得远了；每个红色小圆的面积又都一样了。代价是形状：靠近两极的小圆被压扁，赤道附近的被拉长。比较面积大小，例如森林、耕地的分布，要用这种等积投影地图。'],
      },
      {
        title: ['Mollweide: the whole world in an oval', '摩尔威德投影：椭圆形的世界地图'],
        astro: { kit: 'projection', to: 'mollweide', tissot: true, lon0: 10, clock: UNROLL },
        body: ['The Mollweide map is also equal-area, but it bends the meridians into curves, so the poles become points again and the world fits in an oval. Shapes near the edges are sheared, yet the overall look is closer to the globe. It is often used for world maps of population or climate.',
          '摩尔威德投影也是等积投影，它把经线画成弧线，两极又变回了点，整个世界装进一个椭圆里。边缘地区的形状会被扭斜，但整体看起来更接近地球仪。世界人口、气候等分布图常用这种投影。'],
      },
      {
        title: ['Seen from above the North Pole', '从北极上空看：极地方位投影'],
        astro: { kit: 'projection', to: 'polar', lon0: 110, clock: UNROLL },
        body: ['A polar azimuthal map opens the globe out from the North Pole like a flower. Distances and directions from the pole are true, and the parallels become circles around it. It shows how close North America, Europe and Asia are across the Arctic, which is why polar routes matter to airlines. The United Nations emblem uses this projection.',
          '极地方位投影把地球从北极点向四周“摊开”，像一朵花一样展开。从极点出发的距离和方向都是准确的，纬线变成以极点为中心的同心圆。在这种地图上能看出：隔着北冰洋，北美、欧洲和亚洲靠得很近，所以很多航线要飞越北极地区。联合国会徽用的就是这种投影。'],
      },
      {
        title: ['Beijing to New York over the Arctic', '从北京飞纽约，要飞越北冰洋'], cam: [70, 170, 4], items: ['forbidden', 'liberty'],
        lines: [
          { pts: [BEIJING, NEW_YORK], c: C.gold, t: 0.3, dur: 3, w: 1.5 },
          { pts: [BEIJING, [40.3, 180]], c: C.red, t: 1.8, dur: 1.4, rhumb: true }, { pts: [[40.3, -180], NEW_YORK], c: C.red, t: 3.2, dur: 1.6, rhumb: true },
        ],
        marks: [mk(BEIJING, 'Beijing', '北京', { dot: true, c: C.gold }), mk(NEW_YORK, 'New York', '纽约', { dot: true, c: C.gold }), mk([78, 160], 'Great circle ≈ 11,000 km', '大圆航线 ≈ 11000 千米', { c: C.gold, big: true, t: 2.4 }), mk([42, -160], 'Along 40°N ≈ 14,500 km', '沿北纬 40° ≈ 14500 千米', { c: C.red, t: 4 })],
        body: ['The shortest path between two places on a sphere follows a great circle, a circle whose centre is the Earth\'s centre. From Beijing to New York it runs north over Siberia and the Arctic: about 11,000 km. Flying due east along 40°N would be about 14,500 km. On a Mercator map the short route looks like a long curve.',
          '球面上两点之间的最短路线是沿着大圆（圆心就是地心的圆）走的，叫大圆航线。从北京到纽约的大圆航线向北经过西伯利亚和北冰洋上空，约 11000 千米；如果沿北纬 40° 一直向东飞，约 14500 千米。在墨卡托地图上，这条最短的航线反而像一条绕远的弯线。'],
      },
      {
        title: ['The globe is the truest map', '地球仪最真实'], cam: [20, 100, 4.6], graticule: true,
        paint: [{ fill: { k: 'continents' }, a: 0.35 }],
        lines: [par(0, C.gold, 0.2, { w: 1.3 })],
        body: ['Only a globe gets area, shape, distance and direction right all at once. But you can only see half of it at a time and it will not fit in your pocket, so we use flat maps and choose the projection that suits the job: navigation, comparing sizes, or flight planning.',
          '只有地球仪能同时准确地表示面积、形状、距离和方向。但它一次只能看到一半，也不方便携带，所以我们还要用平面地图，并根据用途选择投影：航海、比较面积，或者规划航线。'],
      },
    ],
    quiz: [
      { q: ['On a Mercator map Greenland looks as big as Africa. In reality Africa is about…', '在墨卡托地图上，格陵兰岛看起来和非洲差不多大。实际上非洲的面积约是格陵兰岛的'], options: [['14 times bigger', '14 倍'], ['The same size', '一样大'], ['Twice as big', '2 倍'], ['Half the size', '一半']], answer: 0,
        why: ['Africa ≈ 30 million km², Greenland ≈ 2.2 million km². Mercator inflates areas near the poles.', '非洲约 3000 万平方千米，格陵兰岛约 220 万平方千米。墨卡托投影会放大高纬度地区的面积。'] },
      { q: ['The red circles were all the same size on the globe. Which projection is this?', '这些红色小圆在地球上一样大。这是哪种投影？'],
        astro: { kit: 'projection', to: 'mercator', tissot: true, lon0: -10, regions: [GREENLAND] },
        options: [['Mercator', '墨卡托投影'], ['Gall–Peters (equal-area)', '高尔—彼得斯投影（等积）'], ['Polar azimuthal', '极地方位投影'], ['A globe', '地球仪']], answer: 0,
        why: ['The circles stay round but grow toward the poles: shapes are kept, areas are not. That is Mercator.', '小圆保持圆形，但越靠近两极越大：形状不变而面积放大，这是墨卡托投影。'] },
      { q: ['Which kind of map is best for comparing the sizes of countries?', '比较各国面积大小，最好用'], options: [['An equal-area map', '等积投影地图'], ['A Mercator map', '墨卡托投影地图'], ['A town plan', '城市街道图'], ['A weather map', '天气图']], answer: 0,
        why: ['Equal-area projections keep every area in the right proportion.', '等积投影地图上各地的面积比例都是准确的。'] },
      { q: ['Why do flights from Beijing to New York fly over the Arctic?', '从北京飞往纽约的航班为什么要飞越北冰洋上空？'], options: [['It is the great-circle route, the shortest way', '这是大圆航线，路程最短'], ['To avoid the equator', '为了避开赤道'], ['Planes must follow parallels', '飞机必须沿纬线飞'], ['The Pacific is closed to planes', '太平洋上空不能飞行']], answer: 0,
        why: ['On a sphere the shortest path is a great circle, which bends toward the pole between these two cities.', '在球面上，两点间最短路线是大圆航线，这两座城市之间的大圆航线偏向北极。'] },
      { q: ['Find Greenland, the island that Mercator maps make look enormous.', '在地球上点出在墨卡托地图上被“放大”的格陵兰岛。'], at: [72, -40], tolKm: 900,
        why: ['Greenland is the world\'s largest island, between the Arctic and Atlantic Oceans.', '格陵兰岛是世界最大的岛屿，位于北冰洋和大西洋之间。'] },
      { q: ['Match each map to what it keeps true.', '把地图和它保持准确的方面连起来。'],
        match: [[['Mercator', '墨卡托投影'], ['Shapes and compass directions', '形状和方向']], [['Gall–Peters', '高尔—彼得斯投影'], ['Areas', '面积']], [['Polar azimuthal', '极地方位投影'], ['Distance and direction from the pole', '从极点出发的距离和方向']], [['Globe', '地球仪'], ['Area, shape, distance and direction', '面积、形状、距离和方向']]],
        why: ['Every flat map gives something up. Mercator keeps shapes and bearings, equal-area maps keep sizes, polar azimuthal maps keep distances and directions from the centre; only the globe keeps everything.', '平面地图总要有所取舍：墨卡托投影保持形状和方向，等积投影保持面积，极地方位投影保持从中心出发的距离和方向；只有地球仪全都准确。'] },
      { q: ['On a Mercator map, at 60° latitude a small circle is drawn twice as wide and twice as tall. How many times its true area does it cover?', '在墨卡托地图上，纬度 60° 处的小圆被画得宽、高都是原来的 2 倍。它的面积被放大了多少倍？'], num: { answer: 4, tol: 0.05, unit: ['times', '倍'] },
        why: ['2 × 2 = 4: Mercator stretches both ways equally (so shapes stay right), and the area grows with the square of the stretch.', '2 × 2 = 4。墨卡托投影在东西和南北方向拉伸得一样多（所以形状不变），面积放大的倍数是拉伸倍数的平方。'] },
    ],
  },
  {
    id: 'timezones', strand: 'maps', tracks: ['us', 'uk', 'ib', 'au'], unit, icon: 'clock', minutes: 6,
    title: ['Time zones', '时区和日界线'],
    blurb: ['Why it is noon in Beijing and night in New York, and where each new day begins.', '为什么北京正午时纽约是深夜，新的一天又从哪里开始。'],
    keys: [
      ['The Earth turns 15° an hour, so the world has 24 time zones, each about 15° wide.', '地球每小时自转 15°，全球划分为 24 个时区，每个时区约跨经度 15°。'],
      ['Zone time starts from Greenwich (0°, UTC); go east and add hours, go west and subtract.', '区时以格林尼治（0°，协调世界时）为起点，向东加，向西减。'],
      ['Beijing Time is UTC+8, the time at 120°E, used across all of China.', '北京时间是东八区的区时，即东经 120° 的地方时，全国统一使用。'],
      ['Crossing the International Date Line westward, add a day; eastward, take a day off.', '向西越过国际日期变更线，日期加一天；向东越过，日期减一天。'],
    ],
    steps: [
      {
        title: ['Sun time is local time', '地方时'], cam: [20, 60, 4.4], night: true, sun: true,
        clock: { mode: 'day', start: T.marchNoonChina, rate: 1.5 },
        lines: [mer(120, C.gold, 0, { w: 1.2 }), mer(0, C.teal, 0.4)],
        marks: [mk([45, 120], '120°E: noon', '东经 120°：正午', { c: C.gold, t: 0.4 }), mk([45, 0], '0°: 4 a.m.', '0°：凌晨 4 时', { c: C.teal, t: 0.8 })],
        task: ['Watch the Sun marker: which way does noon travel round the Earth, east or west?', '看着太阳标记：正午是向东还是向西绕着地球移动的？'],
        body: ['When the Sun is highest it is noon, but only along one meridian at a time. The Earth turns 360° in 24 hours, 15° every hour, so places 15° further east have noon one hour earlier. Each place has its own local (sun) time, which would make train timetables chaos.',
          '太阳升到最高时是正午 12 时，但同一时刻只有一条经线上是正午。地球 24 小时自转 360°，每小时 15°，所以向东每隔 15°，正午就提前 1 小时。各地按太阳确定的时间叫地方时；如果各地都用自己的地方时，火车时刻表就乱套了。'],
      },
      {
        title: ['Twenty-four time zones', '24 个时区'], cam: [25, 30, 5.4], night: true, sketch: true,
        clock: { mode: 'day', start: T.marchNoonChina, rate: 2 },
        paint: ZONES,
        marks: [mk([60, 0], 'Zone 0', '中时区', { c: C.gold, t: 0.9 }), mk([60, 120], 'UTC+8', '东八区', { c: C.red, t: 1.6 }), mk([60, -75], 'UTC−5', '西五区', { c: C.blue, t: 0.6 })],
        body: ['So the world is cut into 24 time zones, each 15° of longitude wide and centred on a meridian that is a multiple of 15°. Everyone in a zone uses the same clock time, its zone time. Real zone borders zigzag to follow countries; these strips are the ideal zones.',
          '于是全球按经度划分为 24 个时区，每个时区跨经度 15°，以 15° 的整数倍经线为中央经线。同一时区内统一使用中央经线的地方时，叫区时。实际的时区界线常常沿国界弯曲，这里画的是理论上的时区。'],
      },
      {
        title: ['Greenwich and UTC', '格林尼治和协调世界时'], cam: [51.5, 0, 2.2], items: ['sp_greenwich', 'bigben'],
        paint: [{ fill: { k: 'strip', w: -7.5, e: 7.5, c: C.gold }, t: 0.2, a: 0.3 }],
        lines: [mer(0, C.gold, 0, { w: 1.4 })],
        marks: [mk([51.48, 0], 'Greenwich: 0°', '格林尼治：0°', { dot: true, c: C.gold, big: true, t: 0.6 }), mk([45, -7.5], '7.5°W', '西经 7.5°', { t: 1.2 }), mk([45, 7.5], '7.5°E', '东经 7.5°', { t: 1.2 })],
        body: ['The zones count from the prime meridian through the old Royal Observatory at Greenwich, London. The zone from 7.5°W to 7.5°E is zone 0, and its time is the world\'s reference clock, Coordinated Universal Time (UTC), based on Greenwich Mean Time. Every other zone is written as UTC plus or minus some hours.',
          '时区从经过伦敦格林尼治天文台旧址的本初子午线算起。西经 7.5° 到东经 7.5° 是中时区（零时区），它的时间是世界通用的标准，叫协调世界时（UTC），以格林尼治时间为基础。其他时区都写成 UTC 加上或减去几小时。'],
      },
      {
        title: ['Beijing Time', '北京时间'], cam: [33, 112, 3], items: ['forbidden'], night: true, sun: true,
        clock: { mode: 'day', start: T.marchNoonChina, rate: 0.4 },
        paint: [{ fill: { k: 'land', a2: ['CN'], c: C.gold }, a: 0.3 }, { fill: { k: 'strip', w: 112.5, e: 127.5, c: C.red }, t: 0.6, a: 0.3 }],
        lines: [mer(120, C.red, 0.4, { w: 1.4 })],
        marks: [mk([45, 120], '120°E · UTC+8', '东经 120° · 东八区', { c: C.red, big: true, t: 1 }), mk(BEIJING, 'Beijing', '北京', { dot: true, c: C.gold, t: 1.4 })],
        task: ['Watch the dawn line cross China: notice how much later the Sun rises in far western Xinjiang than on the east coast, though both use Beijing Time.', '看晨线扫过中国：同样用北京时间，新疆西部比东部沿海日出晚多少？'],
        body: ['China stretches from about 73°E to 135°E, across five time zones, but the whole country uses one clock: Beijing Time. It is the zone time of UTC+8, the local time at 120°E (Beijing itself is at about 116°E). So when it is 12:00 in Beijing it is 04:00 UTC.',
          '我国领土从约东经 73° 延伸到东经 135°，跨了五个时区，但全国统一使用北京时间。北京时间是东八区的区时，也就是东经 120° 的地方时（北京本身约在东经 116°）。所以北京时间 12 时，正是协调世界时 4 时。'],
      },
      {
        title: ['Working out the time', '区时的计算'], cam: [40, -10, 5.4], items: ['forbidden', 'bigben', 'liberty'],
        lines: [mer(120, C.red, 0), mer(0, C.gold, 0.3), mer(-75, C.blue, 0.6)],
        marks: [mk(BEIJING, 'Beijing UTC+8: 20:00', '北京 东八区：20 时', { dot: true, c: C.red, t: 0.6 }), mk([51.5, -0.1], 'London UTC+0: 12:00', '伦敦 中时区：12 时', { dot: true, c: C.gold, t: 1.2 }), mk(NEW_YORK, 'New York UTC−5: 07:00', '纽约 西五区：7 时', { dot: true, c: C.blue, t: 1.8 })],
        fig: { k: 'bars', title: ['Hours ahead of UTC (standard time)', '比协调世界时早几小时（标准时间）'], unit: ['hours', '小时'], rows: [{ name: ['Sydney', '悉尼'], v: 10, c: C.teal }, { name: ['Tokyo', '东京'], v: 9, c: C.violet }, { name: ['Beijing', '北京'], v: 8, c: C.red }, { name: ['New Delhi', '新德里'], v: 5.5, c: C.orange }, { name: ['Moscow', '莫斯科'], v: 3, c: C.blue }] },
        body: ['Count the zones between two places: that is the time difference in hours. Going east, add; going west, subtract. Beijing (UTC+8) is 8 hours ahead of London (UTC+0) and 13 hours ahead of New York (UTC−5). At 20:00 in Beijing it is 12:00 in London and 07:00 the same morning in New York (ignoring summer time).',
          '两地相差几个时区，区时就相差几小时，“东加西减”。北京（东八区）比伦敦（中时区）早 8 小时，比纽约（西五区）早 13 小时。北京时间 20 时，伦敦是 12 时，纽约是同一天早上 7 时（不考虑夏令时）。'],
      },
      {
        title: ['The International Date Line', '国际日期变更线'], cam: [10, -178, 3.6], sketch: true,
        paint: [{ fill: { k: 'strip', w: 172.5, e: -172.5, c: C.violet }, a: 0.25 }],
        lines: [{ pts: DATE_LINE, c: C.gold, t: 0.3, dur: 3, w: 1.4 }, ...arrows([[[30, 170], [30, 150]], [[30, -165], [30, -145]]], C.white, 3)],
        marks: [mk([20, 165], 'West side: Monday', '西侧：星期一', { c: C.gold, big: true, t: 2.4 }), mk([20, -160], 'East side: Sunday', '东侧：星期日', { c: C.teal, big: true, t: 2.6 }), mk([1.9, -157.4], 'Kiritimati (Kiribati)', '基里蒂马蒂岛（基里巴斯）', { dot: true, c: C.red, t: 3.2 })],
        body: ['Go round the world eastward adding an hour each zone and you gain a whole day, so the calendar must jump somewhere. That place is the International Date Line, roughly along 180°, bending round islands so no country is split. West of it is one day ahead: cross it going west, add a day; going east, take a day off. Kiribati is among the first places to see each new day.',
          '向东每过一个时区加 1 小时，绕地球一圈就多出一整天，所以日期必须在某处调整，这就是国际日期变更线。它大致沿 180° 经线，为了不把一个国家分开而有几处弯折。它的西侧比东侧早一天：向西越过时日期加一天，向东越过时日期减一天。基里巴斯是全世界最早迎来新一天的地方之一。'],
      },
    ],
    quiz: [
      { q: ['How many degrees of longitude make one hour of time difference?', '经度相差多少度，时间相差 1 小时？'], options: [['15°', '15 度'], ['1°', '1 度'], ['24°', '24 度'], ['30°', '30 度']], answer: 0,
        why: ['360° ÷ 24 hours = 15° per hour.', '360° ÷ 24 小时 = 每小时 15°。'] },
      { q: ['Beijing Time is the time of which zone?', '北京时间是哪个时区的区时？'], options: [['UTC+8 (120°E)', '东八区（东经 120°）'], ['UTC+0 (Greenwich)', '中时区（格林尼治）'], ['UTC+5 (75°E)', '东五区（东经 75°）'], ['UTC−8 (120°W)', '西八区（西经 120°）']], answer: 0,
        why: ['Beijing Time is UTC+8, the time at 120°E, used across all of China.', '北京时间是东八区的区时，即东经 120° 的地方时，全国统一使用。'] },
      { q: ['It is 16:00 Beijing Time (UTC+8). What time is it in London (UTC+0, no summer time)?', '北京时间（东八区）16 时，伦敦（中时区，不考虑夏令时）是几时？'], options: [['08:00', '8 时'], ['00:00', '0 时'], ['16:00', '16 时'], ['24:00', '24 时']], answer: 0,
        why: ['London is 8 zones west, so subtract 8 hours: 16 − 8 = 8:00.', '伦敦在北京以西 8 个时区，西减：16 − 8 = 8 时。'] },
      { q: ['It is 10:00 on 1 January in Beijing (UTC+8). What is the time in New York (UTC−5)?', '北京（东八区）1 月 1 日 10 时，纽约（西五区）是'], options: [['21:00 on 31 December', '12 月 31 日 21 时'], ['23:00 on 1 January', '1 月 1 日 23 时'], ['05:00 on 1 January', '1 月 1 日 5 时'], ['15:00 on 1 January', '1 月 1 日 15 时']], answer: 0,
        why: ['The difference is 8 + 5 = 13 hours, and New York is to the west: 10:00 − 13 h = 21:00 the day before.', '两地相差 8 + 5 = 13 小时，纽约在西边要减：10 时 − 13 小时 = 前一天 21 时。'] },
      { q: ['Find the Royal Observatory at Greenwich, where the 0° meridian runs.', '在地球上点出本初子午线经过的格林尼治天文台旧址。'], at: [51.48, 0], tolKm: 500,
        why: ['Greenwich is in south-east London, England.', '格林尼治位于英国伦敦东南部。'] },
      { q: ['Put these cities in order of their clock time at the same moment, furthest ahead first (standard time).', '同一时刻，把这些城市按区时从早到晚排序（最早的在前，不考虑夏令时）。'],
        order: [['Tokyo (UTC+9)', '东京（东九区）'], ['Beijing (UTC+8)', '北京（东八区）'], ['Moscow (UTC+3)', '莫斯科（东三区）'], ['London (UTC+0)', '伦敦（中时区）'], ['New York (UTC−5)', '纽约（西五区）']],
        why: ['The further east the zone, the further ahead its clock: Tokyo is an hour ahead of Beijing, and New York 14 hours behind Tokyo.', '时区越靠东，区时越早：东京比北京早 1 小时，纽约比东京晚 14 小时。'] },
      { q: ['A flight leaves Beijing at 13:00 Beijing Time and lands in London (UTC+0) 11 hours later. What is the local time in London when it lands? Give the hour (0–23).', '一架飞机北京时间 13 时从北京起飞，飞行 11 小时到达伦敦（中时区）。到达时伦敦当地时间是几时？（填 0—23）'], num: { answer: 16, tol: 0.1, unit: ['h', '时'] },
        why: ['It lands at 13 + 11 = 24:00 Beijing Time. London is 8 hours behind, so 24 − 8 = 16:00 local time, the same day.', '到达时是北京时间 13 + 11 = 24 时。伦敦比北京晚 8 小时，24 − 8 = 16 时，仍是同一天。'] },
    ],
  },
];
