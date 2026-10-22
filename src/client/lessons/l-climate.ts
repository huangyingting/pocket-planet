/** 七上 · 天气与气候: weather, the world's climate types, biomes and climate change. */
import { C, T, arrows, mk, par, type Lesson, type Pair } from './kit.ts';
import type { Line } from './stage.ts';
import { svg, tx, type Lx } from './figs.ts';

const unit = ['Weather and climate', '天气与气候'] as const;
const r1 = (v: number) => Math.round(v * 10) / 10;

/** A schematic satellite cloud image: green land and blue sea where the sky is clear, white cloud (the whiter, the thicker) and a northern typhoon. */
const satFig = (L: Lx) => {
  const cx = 222, cy = 76;
  let arms = '';
  for (let k = 0; k < 3; k++) {
    let d = '';
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, a = (k * 2 * Math.PI) / 3 - t * 3.6, r = 10 + 46 * t;
      d += `${i ? 'L' : 'M'}${r1(cx + r * Math.cos(a))} ${r1(cy - r * 0.85 * Math.sin(a))}`;
    }
    arms += `<path d="${d}" fill="none" stroke="#f1f3f5" stroke-width="${7 - k}" stroke-linecap="round" opacity=".82"/>`;
  }
  const sw = (y: number, c: string, s: Pair) => `<rect x="10" y="${y - 8}" width="10" height="10" rx="2" fill="${c}" stroke="rgba(255,255,255,.4)"/>` + tx(26, y + 1, L(s), 'fg-label');
  return svg(300, 202,
    `<rect width="300" height="146" fill="#1d4e89"/>` +
    `<path d="M0 0 H128 Q112 34 124 58 Q100 86 116 112 Q100 130 92 146 H0 Z" fill="#4c7a3a"/>` +
    `<path d="M0 30 Q50 10 104 32 Q140 46 168 22 L176 36 Q140 66 100 48 Q50 28 0 52 Z" fill="#f8f9fa"/>` +
    `<ellipse cx="56" cy="112" rx="32" ry="9" fill="#f1f3f5" opacity=".38"/>` + arms +
    `<circle cx="${cx}" cy="${cy}" r="14" fill="#f8f9fa"/><circle cx="${cx}" cy="${cy}" r="3.5" fill="#1d4e89"/>` +
    tx(cx, 140, L(['Typhoon: spiral of thick cloud, clear "eye"', '台风：螺旋状厚云，中心是晴空的台风眼']), 'fg-sub', 'm') +
    sw(162, '#f8f9fa', ['White: cloud (the whiter, the thicker: rain likely)', '白色：云区，越白云层越厚，越可能下雨']) +
    sw(178, '#4c7a3a', ['Green: land under a clear sky', '绿色：陆地，晴']) +
    sw(194, '#1d4e89', ['Blue: sea under a clear sky', '蓝色：海洋，晴']),
  L(['Satellite cloud image (sketch)', '卫星云图（示意）']));
};

/** How to name a climate from its graph: temperature sets the zone, rainfall sets the type (rules of thumb). */
const climKeyFig = (L: Lx) => {
  const box = (x: number, y: number, s: Pair, c: string) => `<rect x="${x}" y="${y}" width="140" height="22" rx="4" fill="${c}" fill-opacity=".22" stroke="${c}" stroke-opacity=".7"/>` + tx(x + 70, y + 14.5, L(s), 'fg-tick', 'm', ' style="fill:#f1f3f5"');
  const left: [Pair, string][] = [
    [['Coldest month above 15 °C → tropical', '最冷月 >15 °C → 热带'], '#fd7e14'],
    [['Coldest month 0–15 °C → subtropical', '最冷月 0–15 °C → 亚热带'], '#12b886'],
    [['Coldest month below 0 °C → temperate', '最冷月 <0 °C → 温带'], '#4dabf7'],
    [['Warmest month below 10 °C → polar', '最热月 <10 °C → 寒带'], '#99e9f2'],
  ];
  const right: [Pair, string][] = [
    [['Wet all year → rainforest, maritime', '全年多雨 → 雨林、海洋性'], '#2fb344'],
    [['Wet summer, dry winter → monsoon, savanna', '夏雨冬干 → 季风、草原'], '#a9e34b'],
    [['Wet winter, dry summer → Mediterranean', '冬雨夏干 → 地中海'], '#e64980'],
    [['Dry all year → desert, continental', '全年少雨 → 沙漠、大陆性'], '#e9c46a'],
  ];
  let s = tx(150, 13, L(['Naming a climate from its graph', '根据气候图判断气候类型']), 'fg-title', 'm') +
    tx(78, 32, L(['① Temperature sets the zone', '① 以温定带']), 'fg-label', 'm') + tx(222, 32, L(['② Rainfall sets the type', '② 以水定型']), 'fg-label', 'm');
  left.forEach(([p, c], i) => { s += box(8, 40 + i * 27, p, c); });
  right.forEach(([p, c], i) => { s += box(152, 40 + i * 27, p, c); });
  s += `<path d="M148 92 L152 92" stroke="#e9ecef"/>` +
    tx(150, 160, L(['Exceptions: temperate maritime stays above 0 °C in winter; Cairo (14 °C) is still a hot desert.', '例外：温带海洋性气候最冷月也在 0 °C 以上；开罗最冷月 14 °C，仍属热带沙漠气候。']), 'fg-sub', 'm');
  return svg(300, 168, s, L(['Naming a climate from its graph', '根据气候图判断气候类型']));
};

/** Kilimanjaro's vertical zones, 3° south of the equator (heights approximate). */
const kiliFig = (L: Lx) => {
  const y = (h: number) => r1(150 - ((h - 800) / 5095) * 132), hw = (yy: number) => ((yy - 18) / 132) * 95;
  const zones: [number, number, string, Pair][] = [
    [800, 1800, '#e9c46a', ['Savanna and farms, 800–1,800 m', '热带草原和农田 800–1800 米']],
    [1800, 2800, '#2b9348', ['Mountain rainforest, 1,800–2,800 m', '山地雨林 1800–2800 米']],
    [2800, 4000, '#a3b18a', ['Heath and moorland, 2,800–4,000 m', '高山灌丛和草甸 2800–4000 米']],
    [4000, 5000, '#b08968', ['Alpine desert, 4,000–5,000 m', '高山荒漠 4000–5000 米']],
    [5000, 5895, '#f8f9fa', ['Ice and snow, above 5,000 m', '冰雪带 5000 米以上']],
  ];
  let s = '';
  zones.forEach(([h0, h1, c, p], i) => {
    const y0 = y(h0), y1 = y(h1), m = (y0 + y1) / 2, ly = 142 - i * 28;
    s += `<path d="M${r1(110 - hw(y0))} ${y0} L${r1(110 + hw(y0))} ${y0} L${r1(110 + hw(y1))} ${y1} L${r1(110 - hw(y1))} ${y1} Z" fill="${c}" class="f-fade" style="--d:${i * 0.15}s"/>` +
      `<path d="M${r1(110 + hw(m) + 2)} ${r1(m)} L206 ${ly - 3}" stroke="rgba(255,255,255,.4)" stroke-width=".8"/>` + tx(209, ly, L(p), 'fg-tick');
  });
  return svg(340, 168, s + `<rect x="0" y="150" width="340" height="18" class="fg-landfill"/>` +
    tx(8, 14, L(['Kilimanjaro (5,895 m): belts with height', '乞力马扎罗山（5895 米）的垂直自然带']), 'fg-title') +
    tx(8, 162, L(['3° S, near the equator', '南纬 3°，靠近赤道']), 'fg-sub'), L(['Kilimanjaro: vertical zones', '乞力马扎罗山的垂直自然带']));
};

/** Prevailing winds (illustrative): trade winds blow towards the equator, westerlies towards the poles. */
const LONS = [-150, -100, -40, 0, 60, 110];
const NE_TRADES = arrows(LONS.map(lo => [[26, lo + 12], [8, lo - 4]]), C.gold, 0.4, 1.8);
const SE_TRADES = arrows(LONS.map(lo => [[-26, lo + 12], [-8, lo - 4]]), C.gold, 0.8, 1.8);
const WESTERLIES_N = arrows(LONS.map(lo => [[36, lo - 12], [56, lo + 10]]), C.teal, 1.6, 1.8);
const WESTERLIES_S = arrows(LONS.map(lo => [[-36, lo - 12], [-56, lo + 10]]), C.teal, 2, 1.8);
const ITCZ: Line = par(3, C.red, 0.2, { w: 2.2, flow: true });
/** The Gulf Stream and North Atlantic Drift, a warm current (schematic). */
const GULF_STREAM: Line = { pts: [[25, -80], [33, -76], [40, -62], [46, -42], [52, -25], [58, -12], [64, 0], [70, 14]], c: C.red, w: 2.4, flow: true, arrow: true, dur: 2.6, t: 0.6 };
const TROPICS = [par(23.44, C.orange, 0, { dur: 1.6 }), par(-23.44, C.orange, 0.3, { dur: 1.6 })];

export const CLIMATE_L: Lesson[] = [
  {
    id: 'weather', strand: 'climate', grade: 'g7a', tracks: ['us', 'uk', 'ib'], unit, icon: 'cloud', minutes: 9,
    title: ['Weather, wind and air', '多变的天气'],
    blurb: ['Tell weather from climate, read forecasts, symbols and satellite images, check the air quality, then meet the wind belts and monsoons.', '区分天气和气候，读懂天气预报、天气符号和卫星云图，了解空气质量，再认识气压带、风带和季风。'],
    keys: [
      ['Weather is the state of the air at a place over a short time and changes quickly; climate is the long-term average and is fairly stable.', '天气是一个地方短时间里的大气状况，变化很快；气候是多年的天气平均状况，比较稳定。'],
      ['A forecast gives the sky, highest and lowest temperatures, wind direction and force, chance of rain and air quality.', '天气预报包括天气状况、最高和最低气温、风向和风力、降水概率和空气质量等。'],
      ['Wind direction is where the wind comes from; wind force runs from 0 to 12 and above.', '风向是风吹来的方向；风力从 0 级到 12 级以上。'],
      ['On satellite images, white is cloud (the whiter, the thicker); green is land and blue is sea under clear skies.', '卫星云图上白色表示云区，越白云层越厚；绿色表示陆地，蓝色表示海洋。'],
      ['The lower the air quality index (AQI), the cleaner the air: 0–50 is good.', '空气质量指数越小，空气质量越好，0–50 为优。'],
      ['Trade winds and westerlies blow in belts between pressure belts; monsoons reverse with the seasons.', '信风和西风在气压带之间呈带状分布；季风随季节转换方向。'],
    ],
    steps: [
      {
        title: ['Weather or climate?', '天气和气候'], cam: [30, 108, 3.4], names: true, items: ['an_panda'],
        fig: { k: 'key', set: 'custom', title: ['Weather or climate?', '天气还是气候？'], items: [
          { c: C.gold, name: ['Weather: "Sunny, then a thunderstorm this afternoon"', '天气：“晴转雷阵雨”'] },
          { c: C.gold, name: ['Weather: "Sunrise in the east, rain in the west"', '天气：“东边日出西边雨”'] },
          { c: C.teal, name: ['Climate: "Kunming is like spring all year"', '气候：“昆明四季如春”'] },
          { c: C.teal, name: ['Climate: "Hainan is hot all year, with no winter"', '气候：“海南长夏无冬”'] },
        ] },
        marks: [
          mk([25.04, 102.7], 'Kunming: spring all year (climate)', '昆明：四季如春（气候）', { dot: true, c: C.teal, t: 0.4 }),
          mk([20.04, 110.2], 'Haikou: long summer, no winter (climate)', '海口：长夏无冬（气候）', { dot: true, c: C.teal, t: 0.8 }),
          mk([30.6, 104.1], 'Chengdu today: cloudy, 18 °C (weather)', '成都今天：阴，18 °C（天气）', { dot: true, c: C.gold, t: 1.2 }),
        ],
        body: ['Weather is the state of the air at one place over a short time: sunny now, a thunderstorm this afternoon, cooler tomorrow. It changes quickly and can differ a few kilometres away, as the saying "sunrise in the east, rain in the west" shows. Climate is the average weather of a place over many years (usually 30), so it is fairly stable: Kunming is "spring all year" and Hainan has "a long summer and no winter". Weather affects daily life, farming, transport and travel, so we check the forecast every day.',
          '天气是一个地方短时间里阴晴、风雨、冷热等大气状况：现在晴，下午有雷阵雨，明天降温。天气变化很快，相隔几千米也可能不同，就像“东边日出西边雨”。气候是一个地方多年（通常是 30 年）的天气平均状况，一般变化不大，比如昆明“四季如春”、海南“长夏无冬”。天气影响人们的生活、农业生产、交通和出行，所以我们每天都要关注天气预报。'],
      },
      {
        title: ['Forecasts and weather symbols', '天气预报和天气符号'], cam: [32, 112, 3.4], names: true, fig: { k: 'dia', id: 'weather' },
        marks: [
          mk([39.9, 116.4], 'Beijing: sunny, 2–14 °C', '北京：晴，2～14 °C', { dot: true, c: C.gold, t: 0.3 }),
          mk([31.2, 121.5], 'Shanghai: light rain, 80%', '上海：小雨，降水概率 80%', { dot: true, c: C.blue, t: 0.6 }),
          mk([45.8, 126.6], 'Harbin: snow, −12 °C', '哈尔滨：雪，−12 °C', { dot: true, c: C.white, t: 0.9 }),
          mk([23.1, 113.3], 'Guangzhou: thunderstorm', '广州：雷阵雨', { dot: true, c: C.violet, t: 1.2 }),
          mk([30.6, 104.1], 'Chengdu: overcast', '成都：阴', { dot: true, c: C.ice, t: 1.5 }),
        ],
        body: ['A forecast tells you the sky (sunny, cloudy, rain or snow), the highest and lowest temperatures, the wind direction and force, the chance of rain and the air quality. Weather maps show it with simple symbols: a sun for sunny, a half-hidden sun for partly cloudy, a cloud for overcast, raindrops, snowflakes and a lightning bolt for thunderstorms. A "chance of rain 80%" means rain is very likely, so take an umbrella. Forecasters build these from weather stations, balloons, radar and satellites.',
          '天气预报的内容包括天气状况（晴、多云、阴、雨、雪等）、最高和最低气温、风向和风力、降水概率和空气质量等。天气图用简单的符号表示：太阳表示晴，半遮的太阳表示多云，云朵表示阴，还有雨滴、雪花，闪电表示雷雨。“降水概率 80%”表示下雨的可能性很大，出门要带伞。天气预报依靠气象站、探空气球、雷达和气象卫星收集的资料制作。'],
      },
      {
        title: ['Wind direction and wind force', '风向和风力'], cam: [20, 128, 3.8],
        fig: { k: 'bars', title: ['Wind force and wind speed (approx.)', '风力等级与风速（约）'], unit: ['m/s', '米/秒'], rows: [
          { name: ['Force 1', '1 级'], v: 1, c: C.lime }, { name: ['Force 3', '3 级'], v: 4.4, c: C.green }, { name: ['Force 6', '6 级'], v: 12.3, c: C.gold },
          { name: ['Force 8', '8 级'], v: 19, c: C.orange }, { name: ['Force 10', '10 级'], v: 26.5, c: C.red }, { name: ['Force 12+', '12 级以上'], v: 34, c: C.violet },
        ] },
        lines: [{ pts: [[12, 145], [15, 136], [18, 128], [21, 123], [25, 120]], c: C.red, w: 2.4, arrow: true, flow: true, dur: 2.4, t: 0.4 }],
        marks: [mk([15, 136], 'Typhoon: force 12 and above', '台风：风力 12 级以上', { dot: true, c: C.red, t: 1 })],
        body: ['Wind direction is where the wind comes FROM: a north wind blows from the north. On a weather map a wind vane points into the wind, and its feathers show the wind force, from force 0 (calm) to force 12 and above. A typhoon brings force-12 winds and heavy rain to China\'s south-east coast in summer.',
          '风向是指风吹来的方向，北风就是从北方吹来的风。天气图上用风向标表示风向，用风尾（风羽）表示风力，从 0 级（无风）到 12 级以上。夏秋季节，台风常给我国东南沿海带来 12 级以上的大风和暴雨。'],
      },
      {
        title: ['Reading a satellite cloud image', '读卫星云图'], cam: [24, 125, 3.4], fig: { k: 'svg', draw: satFig },
        lines: [{ pts: [[13, 138], [16, 131], [19, 125], [21.5, 119], [22.6, 114.2]], c: C.red, w: 2.2, arrow: true, flow: true, dur: 2.4, t: 0.6 }],
        paint: [{ fill: { k: 'poly', pts: [[11, 137], [12.5, 141], [16, 141.5], [18.5, 139], [18, 134.5], [14.5, 133], [11.5, 134]], c: C.white }, t: 0.2, a: 0.55 }],
        marks: [mk([15, 137.5], 'Typhoon cloud spiral', '台风螺旋云系', { c: C.white, t: 0.4 }), mk([22.6, 114.2], 'Landfall near Shenzhen', '在深圳附近登陆', { dot: true, c: C.red, t: 2.8 })],
        body: ['Weather satellites such as China\'s Fengyun series photograph the clouds from space many times an hour. On a cloud image, white means cloud and the whiter the patch, the thicker the cloud and the more likely rain; green is land and blue is sea under a clear sky. A typhoon shows as a huge white spiral with a small dark hole, the eye, where the air is calm. Forecasters track it hour by hour to warn coasts such as Guangdong before it lands.',
          '我国的风云系列气象卫星每小时从太空拍摄多次云图。卫星云图上，白色表示云区，越白云层越厚，越可能降水；绿色表示陆地，蓝色表示海洋，说明那里晴朗无云。台风在云图上是一个巨大的白色螺旋云团，中心有一个小黑点，就是风平浪静的台风眼。预报员逐小时跟踪台风的移动，在它登陆广东等沿海地区之前发出预警。'],
      },
      {
        title: ['Air quality', '空气质量'], cam: [38, 108, 3.6], sketch: true,
        fig: { k: 'key', set: 'custom', title: ['Air quality index (AQI)', '空气质量指数'], items: [
          { c: '#40c057', name: ['0–50 Good', '0–50 优'] }, { c: '#fcc419', name: ['51–100 Moderate', '51–100 良'] },
          { c: '#ff922b', name: ['101–150 Light pollution', '101–150 轻度污染'] }, { c: '#fa5252', name: ['151–200 Moderate pollution', '151–200 中度污染'] },
          { c: '#9c36b5', name: ['201–300 Heavy pollution', '201–300 重度污染'] }, { c: '#862e2e', name: ['300+ Severe pollution', '300 以上 严重污染'] },
        ] },
        lines: arrows([[[43, 103], [41, 111], [40, 116]], [[41, 96], [38, 106], [36, 113]]], C.brown, 0.6, 2),
        marks: [mk([42, 102], 'Dust from the deserts', '沙尘来自荒漠', { c: C.brown, t: 0.8 }), mk([39.9, 116.4], 'Beijing', '北京', { dot: true, c: C.gold, t: 1.4 })],
        body: ['Forecasts also report the air quality index (AQI), worked out from fine particles (PM2.5 and PM10), ozone, sulphur dioxide, nitrogen dioxide and carbon monoxide. The smaller the number, the cleaner the air: 0–50 is good, 51–100 moderate, and above 150 children and older people should stay indoors. Exhaust from cars, smoke from factories and burning coal, and spring dust storms blown from the deserts of the north-west make it worse. Planting trees, clean energy and public transport make it better: Beijing\'s yearly average PM2.5 fell from about 90 to about 31 micrograms per cubic metre between 2013 and 2024.',
          '天气预报还会发布空气质量指数，它根据细颗粒物（PM2.5、PM10）、臭氧、二氧化硫、二氧化氮和一氧化碳等的浓度计算。指数越小，空气质量越好：0–50 为优，51–100 为良，超过 150 时儿童和老人应减少户外活动。汽车尾气、工厂废气、燃煤和春季从西北荒漠吹来的沙尘会使空气质量变差；植树造林、使用清洁能源、乘坐公共交通可以改善空气质量：2013—2024 年，北京 PM2.5 年均浓度从约 90 微克/立方米降到约 31 微克/立方米。'],
      },
      {
        title: ['Belts of high and low pressure', '气压带'], cam: [15, 20, 4.8], sketch: true, graticule: true,
        paint: [
          { fill: { k: 'band', s: -6, n: 6, c: C.red }, a: 0.36 },
          { fill: { k: 'band', s: 25, n: 35, c: C.orange }, t: 0.6, a: 0.34 }, { fill: { k: 'band', s: -35, n: -25, c: C.orange }, t: 0.6, a: 0.34 },
          { fill: { k: 'band', s: 55, n: 65, c: C.blue }, t: 1.2, a: 0.34 }, { fill: { k: 'band', s: -65, n: -55, c: C.blue }, t: 1.2, a: 0.34 },
        ],
        marks: [
          mk([0, 20], 'Equatorial low: hot air rises, heavy rain', '赤道低气压带：热空气上升，多雨', { big: true, c: C.red, t: 0.3 }),
          mk([30, 20], 'Subtropical high: air sinks, dry', '副热带高气压带：空气下沉，干燥', { big: true, c: C.orange, t: 0.9 }),
          mk([60, 20], 'Subpolar low', '副极地低气压带', { big: true, c: C.blue, t: 1.5 }),
        ],
        body: ['The Sun heats the equator most, so air there rises, leaving low pressure, towering clouds and rain almost every afternoon. The air spreads towards the poles high up and sinks again around 30° north and south, making belts of high pressure: sinking air warms and dries, which is why the Sahara and the Australian deserts lie there. Another low lies near 60°, where cold polar air meets warmer air, and cold air sinks over the poles to make the polar highs. Altogether there are seven belts, high and low in turn.',
          '赤道附近受热最多，空气膨胀上升，形成赤道低气压带，那里云层高耸，几乎每天午后都下雨。上升的空气在高空流向两极，在南北纬 30° 附近下沉，形成副热带高气压带：下沉的空气增温变干，所以撒哈拉沙漠和澳大利亚的沙漠分布在那里。南北纬 60° 附近冷暖空气相遇，形成副极地低气压带；两极空气寒冷下沉，形成极地高气压带。全球共有七个高低相间的气压带。'],
      },
      {
        title: ['Trade winds and westerlies', '信风带和西风带'], cam: [10, -30, 4.8], sketch: true,
        task: ['Turn the globe along the equator: check that the gold trade-wind arrows on both sides point towards it, and the westerlies point towards the poles.', '沿赤道转动地球：看看两侧金色的信风箭头是不是都指向赤道，而西风箭头都偏向两极。'],
        lines: [ITCZ, ...NE_TRADES, ...SE_TRADES, ...WESTERLIES_N, ...WESTERLIES_S],
        marks: [
          mk([3, -30], 'ITCZ: where the trade winds meet', '赤道辐合带：信风在此相遇', { c: C.red, t: 0.4 }),
          mk([18, -30], 'North-east trades', '东北信风带', { big: true, c: C.gold, t: 1 }), mk([-18, -30], 'South-east trades', '东南信风带', { big: true, c: C.gold, t: 1.3 }),
          mk([46, -30], 'Westerlies', '盛行西风带', { big: true, c: C.teal, t: 2 }), mk([-46, -30], 'Westerlies', '盛行西风带', { big: true, c: C.teal, t: 2.3 }),
        ],
        body: ['Air flows from high to low pressure, and the spinning Earth bends it. Between 30° and the equator the steady trade winds blow towards the equator, from the north-east in the north and the south-east in the south. They meet in the Intertropical Convergence Zone (ITCZ), a belt of storms. Between 30° and 60° the westerlies blow towards the poles.',
          '空气从高气压流向低气压，又因地球自转而发生偏转。在赤道和南北纬 30° 之间，信风稳定地吹向赤道：北半球是东北信风，南半球是东南信风，它们在赤道附近相遇，形成多雷雨的赤道辐合带。在纬度 30° 到 60° 之间，盛行西风吹向高纬度。'],
      },
      {
        title: ['Sea breezes and monsoons', '海陆风与季风'], cam: [22, 100, 4], sketch: true,
        task: ['Watch the arrows change: first the teal summer winds blow in from the sea, then the pale winter winds blow out from the land.', '观察箭头的变化：先是青色的夏季风从海洋吹向陆地，后是浅色的冬季风从陆地吹向海洋。'],
        lines: [
          ...arrows([[[5, 65], [18, 74]], [[6, 85], [20, 88]], [[10, 112], [24, 113]], [[18, 130], [30, 120]]], C.teal, 0.3, 2.2),
          ...arrows([[[45, 95], [32, 80], [22, 76]], [[50, 112], [38, 116], [26, 115]], [[30, 92], [16, 88]]], C.ice, 2.4, 2.2),
        ],
        marks: [mk([12, 70], 'Summer: wet wind from the sea', '夏季：湿润的风从海洋吹来', { c: C.teal, t: 0.8 }), mk([44, 100], 'Winter: dry wind from the land', '冬季：干冷的风从陆地吹来', { c: C.ice, t: 2.8 }), mk([19.1, 72.9], 'Mumbai', '孟买', { dot: true, c: C.gold, t: 1.2 })],
        body: ['Land heats up and cools down faster than the sea. On a sunny day a cool sea breeze blows onto the beach; at night a land breeze blows out to sea. Across a whole continent the same thing happens with the seasons: in summer wet winds blow in from the ocean and bring the monsoon rains (the south-west monsoon gives Mumbai over 2,000 mm from June to September), and in winter dry, cold winds blow out from the land. Eastern China lies in the monsoon too: south-east winds in summer, cold north-west winds in winter.',
          '陆地比海洋升温快、降温也快。晴天的白天，凉爽的海风吹向陆地；夜晚，陆风吹向海洋。在大陆和大洋之间，同样的事情随季节发生：夏季，湿润的风从海洋吹向陆地，带来季风降水（6—9 月西南季风给孟买带来 2000 多毫米降水）；冬季，干冷的风从陆地吹向海洋。这就是季风。我国东部也是季风区：夏季吹东南风，冬季吹寒冷的西北风。'],
      },
    ],
    quiz: [
      { q: ['Which of these describe WEATHER rather than climate? Pick all that apply.', '下列说法中，描述天气（而不是气候）的有（多选）'],
        options: [['Sunny, turning cloudy this afternoon', '今天晴转多云'], ['A thunderstorm is coming tonight', '今晚有雷阵雨'], ['Kunming is like spring all year', '昆明四季如春'], ['Shanghai\'s summers are hot and rainy', '上海夏季高温多雨'], ['Strong wind and dust tomorrow', '明天有大风沙尘']], multi: [0, 1, 4],
        why: ['Weather is short-term and changes quickly: today, tonight, tomorrow. "Spring all year" and "hot, rainy summers" describe the long-term average, which is climate.', '天气是短时间的、多变的，如今天、今晚、明天；“四季如春”“夏季高温多雨”描述的是多年的平均状况，属于气候。'] },
      { q: ['A "north wind" blows…', '“北风”是指'], options: [['From the north', '从北方吹来的风'], ['Towards the north', '吹向北方的风'], ['Only at the North Pole', '只在北极刮的风'], ['From the sea', '从海上吹来的风']], answer: 0,
        why: ['Wind direction always names where the wind comes from.', '风向指的是风吹来的方向。'] },
      { q: ['Today\'s air quality index is 168. The air quality is…', '今天的空气质量指数是 168，空气质量等级是'], options: [['Moderate pollution', '中度污染'], ['Good', '优'], ['Moderate', '良'], ['Severe pollution', '严重污染']], answer: 0,
        why: ['151–200 is moderate pollution: children and older people should cut down on outdoor exercise. 0–50 is good, 51–100 moderate, 101–150 light pollution.', '151–200 为中度污染，儿童和老人应减少户外运动。0–50 为优，51–100 为良，101–150 为轻度污染。'] },
      { q: ['On this satellite image, where is rain most likely?', '读卫星云图：哪里最可能下雨？'], fig: { k: 'svg', draw: satFig },
        options: [['Under the brightest white cloud', '最白的云区下面'], ['Over the green land', '绿色的陆地上'], ['Over the blue sea', '蓝色的海面上'], ['In the typhoon\'s eye', '台风眼里']], answer: 0,
        why: ['The whiter the cloud, the thicker it is, and thick cloud brings rain. Green and blue mean a clear sky, and the eye of a typhoon is calm and often clear.', '云区越白，云层越厚，越可能降水；绿色和蓝色表示晴朗无云；台风眼里风平浪静，往往是晴天。'] },
      { q: ['In summer the monsoon brings heavy rain to this city. Find Mumbai.', '夏季风给这座城市带来大量降水。在地球上点出孟买。'], at: [19.1, 72.9], tolKm: 500,
        why: ['Mumbai is on India\'s west coast, facing the wet south-west monsoon.', '孟买位于印度西海岸，迎着湿润的西南季风。'] },
      { q: ['Which of these make the air quality worse? Pick all that apply.', '下列因素中，会使空气质量变差的有（多选）'],
        options: [['Exhaust from cars', '汽车尾气'], ['Smoke from factories', '工厂排放的烟尘'], ['Dust blown from deserts', '从荒漠吹来的沙尘'], ['Planting trees and grass', '植树种草'], ['A good rain shower', '一场透雨']], multi: [0, 1, 2],
        why: ['Exhaust, smoke and dust put particles and gases into the air. Plants trap dust, and rain washes the air clean.', '汽车尾气、工厂烟尘和沙尘都会向空气中排放颗粒物和有害气体；植物能吸附灰尘，降雨能冲刷空气中的污染物。'] },
      { q: ['Match each pressure belt to where it lies and the weather it brings.', '把气压带和它的位置、天气特点连起来。'],
        match: [[['Equatorial low', '赤道低气压带'], ['Near the equator: rising air, heavy rain', '赤道附近：空气上升，多雨']], [['Subtropical high', '副热带高气压带'], ['About 30° N and S: sinking air, dry', '南北纬 30° 附近：空气下沉，干燥']], [['Subpolar low', '副极地低气压带'], ['About 60° N and S', '南北纬 60° 附近']], [['Polar high', '极地高气压带'], ['Near the poles: cold, sinking air', '两极附近：空气寒冷下沉']], [['North-east trades', '东北信风带'], ['From 30° N towards the equator', '从北纬 30° 吹向赤道']]],
        why: ['Heated air rises at the equator and sinks near 30°; another low lies near 60°, and cold air sinks over the poles. Between the subtropical high and the equatorial low, air flows towards the equator and is bent to the right in the north: the north-east trades.', '赤道受热空气上升，在南北纬 30° 附近下沉；南北纬 60° 附近是副极地低气压带，两极空气冷却下沉，形成极地高气压带。空气从副热带高气压带流向赤道低气压带，在北半球向右偏，形成东北信风。'] },
      { q: ['Read the chart: about how fast is a force-8 wind, in metres per second?', '读图：8 级风的风速约为每秒多少米？'],
        fig: { k: 'bars', title: ['Wind force and wind speed (approx.)', '风力等级与风速（约）'], unit: ['m/s', '米/秒'], rows: [
          { name: ['Force 1', '1 级'], v: 1, c: C.lime }, { name: ['Force 3', '3 级'], v: 4.4, c: C.green }, { name: ['Force 6', '6 级'], v: 12.3, c: C.gold },
          { name: ['Force 8', '8 级'], v: 19, c: C.orange }, { name: ['Force 10', '10 级'], v: 26.5, c: C.red }, { name: ['Force 12+', '12 级以上'], v: 34, c: C.violet }] },
        num: { answer: 19, tol: 1.5, unit: ['m/s', '米/秒'] },
        why: ['About 19 m/s, roughly 70 km per hour: strong enough to break twigs off trees. Each force step means a faster wind.', '约 19 米/秒，约合每小时 70 千米，能折断树枝。风力等级越高，风速越大。'] },
    ],
  },
  {
    id: 'climates', strand: 'climate', grade: 'g7a', tracks: ['uk', 'us', 'ib', 'au'], unit, icon: 'globe', minutes: 8,
    title: ['World climates: the tropics', '世界的气候类型（一）：热带'],
    blurb: ['The world climate map, then the four tropical climates: their graphs, where they are and what causes them.', '认识世界气候类型分布图，再读懂四种热带气候的气候图、分布和成因。'],
    keys: [
      ['Climate is the long-term pattern of temperature and rainfall at a place; places with similar patterns share a climate type.', '气候是一个地方多年的天气平均状况，主要看气温和降水；气温和降水特点相似的地区属于同一种气候类型。'],
      ['Tropical climates are hot all year (coldest month above about 15 °C); they differ in how much rain falls and when.', '热带气候终年炎热（最冷月一般在 15 °C 以上），区别主要在降水的多少和季节分配。'],
      ['Rainforest: wet all year. Monsoon and savanna: a wet and a dry season. Desert: dry all year.', '热带雨林气候全年多雨；热带季风和热带草原气候分旱、雨两季；热带沙漠气候终年干燥。'],
      ['The savanna\'s seasons come from the pressure and wind belts shifting with the overhead Sun.', '热带草原气候的干湿季，是气压带和风带随太阳直射点移动造成的。'],
      ['Hot deserts lie near the tropics, inland and on west coasts, under sinking air and beside cold currents.', '热带沙漠气候分布在回归线附近的大陆内部和西岸，受下沉气流和寒流影响。'],
    ],
    steps: [
      {
        title: ['The world climate map', '世界气候类型分布图'], cam: [15, 30, 4.8], sketch: true,
        paint: [{ fill: { k: 'climate' }, a: 0.6 }], fig: { k: 'key', set: 'climate' },
        body: ['Each colour is a climate type: places with a similar pattern of temperature and rainfall through the year. There are about a dozen main types. Temperature mostly depends on latitude, so the types sit in rough belts: tropical near the equator, temperate in the middle latitudes and polar near the poles. But coasts, the inside of continents and high mountains bend those belts, so the same latitude can be wet on one coast and desert on the other. This map is a simplified sketch.',
          '每种颜色代表一种气候类型，即一年中气温和降水变化特点相似的地区，世界上主要有十多种。气温主要取决于纬度，所以气候类型大致按纬度呈带状分布：赤道附近是热带，中纬度是温带，两极附近是寒带。但沿海和内陆、高山高原会使这些带弯曲断开，同一纬度的大陆东岸可能湿润多雨，西岸却是沙漠。这是一幅简化的示意图。'],
      },
      {
        title: ['Tropical rainforest', '热带雨林气候'], cam: [0, 100, 4], sketch: true, items: ['marinabay', 'pl_kapok'],
        task: ['Turn the globe along the equator and find the three great rainforest areas: the Amazon, the Congo Basin and South-East Asia.', '沿赤道转动地球，找到热带雨林气候的三大分布区：亚马孙平原、刚果盆地和东南亚。'],
        paint: [{ fill: { k: 'climate', only: ['rainforest'] }, a: 0.65 }], fig: { k: 'climo', city: 'singapore' },
        marks: [mk([1.35, 103.8], 'Singapore', '新加坡', { dot: true, c: C.green, t: 0.6 }), mk([-3, -60], 'Amazon', '亚马孙平原', { c: C.green, t: 1 }), mk([0, 22], 'Congo Basin', '刚果盆地', { c: C.green, t: 1.3 })],
        body: ['Near the equator the Sun is high all year, so every month is about 27 °C, and rising air brings a thunderstorm almost every afternoon: over 2,000 mm a year. Look at Singapore\'s graph: a flat temperature line (a range under 2 °C) and tall rain bars in every month, about 2,160 mm in all. The Amazon Plain, the Congo Basin and the islands of South-east Asia have this climate. It lies mainly between about 10° N and 10° S, where the equatorial low stays all year.',
          '赤道附近终年正午太阳高度大，各月气温都在 27 °C 左右；空气上升，几乎每天午后都有雷阵雨，年降水量在 2000 毫米以上。看新加坡的气候图：气温曲线很平（年较差不到 2 °C），每个月的降水柱都很高，全年约 2160 毫米。亚马孙平原、刚果盆地和东南亚的群岛属于这种气候，它主要分布在南北纬 10° 之间终年受赤道低气压带控制的地区。'],
      },
      {
        title: ['Tropical monsoon', '热带季风气候'], cam: [18, 95, 3.8], sketch: true, items: ['an_tiger'],
        paint: [{ fill: { k: 'climate', only: ['tmonsoon'] }, a: 0.65 }], fig: { k: 'climo', city: 'mumbai' },
        lines: arrows([[[5, 62], [16, 72]], [[6, 82], [18, 88]], [[6, 100], [18, 104]], [[10, 112], [19, 110]]], C.teal, 0.4, 2),
        marks: [mk([19.1, 72.9], 'Mumbai', '孟买', { dot: true, c: C.lime, t: 0.6 }), mk([20.0, 110.3], 'Haikou, Hainan', '海南海口', { dot: true, c: C.lime, t: 1 })],
        body: ['In the Indian Peninsula and the Indochina Peninsula it is hot all year, but the rain comes in one season. From June to September the wet south-west monsoon pours about 2,250 mm on Mumbai, nearly all of its year\'s rain; from November to May almost none falls. So there is a rainy season and a dry season, and the hottest month is May, just before the rains. In China, Hainan Island, the Leizhou Peninsula and the south of Taiwan and Yunnan have this climate too.',
          '印度半岛和中南半岛终年高温，但降水集中在一个季节。6 月到 9 月，湿润的西南季风给孟买带来约 2250 毫米的降水，几乎是全年的降水量；11 月到次年 5 月几乎不下雨。所以一年分为雨季和旱季，最热的月份是雨季到来前的 5 月。我国的海南岛、雷州半岛以及台湾南部、云南南部也属于热带季风气候。'],
      },
      {
        title: ['Tropical savanna', '热带草原气候'], cam: [-10, 80, 4.8], sketch: true, items: ['an_giraffe', 'an_zebra'],
        paint: [{ fill: { k: 'climate', only: ['savanna'] }, a: 0.65 }], fig: { k: 'climo', city: 'darwin' },
        marks: [mk([-12.5, 130.8], 'Darwin', '达尔文', { dot: true, c: C.gold, t: 0.6 }), mk([-3, 35], 'East African savanna', '东非高原草原', { c: C.gold, t: 1 })],
        body: ['On both sides of the rainforest, between about 10° and 20° latitude, lie the savannas: hot all year, with a wet season and a long dry season. Read Darwin\'s graph: rain pours from December to March and almost nothing falls from May to September. Its coolest month is July (about 25 °C), which tells you Darwin is in the southern hemisphere, where December to March is summer. Large areas of central and East Africa, Brazil and northern Australia are savanna.',
          '热带雨林的南北两侧，大约在南北纬 10°–20° 之间，是热带草原气候：终年高温，分明显的湿季和较长的干季。读达尔文的气候图：12 月到次年 3 月降水很多，5 月到 9 月几乎无雨；最冷月是 7 月（约 25 °C），说明达尔文在南半球，12 月到次年 3 月正是那里的夏季。非洲中部和东部、巴西高原和澳大利亚北部有大片热带草原。'],
      },
      {
        title: ['Why the savanna has two seasons', '热带草原为什么分干湿两季'], astro: { kit: 'belts', mode: 'season', clock: { from: 0, to: 365, rate: 30, unit: 'day' } },
        body: ['Watch the belts follow the overhead Sun through the year. The savanna lies between the equatorial low and the trade winds. In its summer the equatorial low moves over it: air rises and it rains almost every day, the wet season. In its winter the belts shift back, the dry trade winds take over and the grass turns yellow, the dry season. The same shift explains the Mediterranean climate further from the equator.',
          '观察气压带和风带随太阳直射点一年中的移动。热带草原位于赤道低气压带和信风带之间：当地夏季，赤道低气压带移来，空气上升，几乎天天下雨，是湿季；当地冬季，气压带和风带移回，受干燥的信风控制，草木枯黄，是干季。用同样的道理，也能解释离赤道更远的地中海气候。'],
      },
      {
        title: ['Tropical desert', '热带沙漠气候'], cam: [24, 20, 4.4], sketch: true, items: ['pyramids', 'an_camel'],
        task: ['Notice how the desert climate lies along the Tropic lines: follow it from the Sahara east to Arabia, then find Australia\'s deserts in the south.', '注意热带沙漠气候沿回归线分布：从撒哈拉沙漠向东找到阿拉伯半岛，再到南半球找到澳大利亚的沙漠。'],
        paint: [{ fill: { k: 'climate', only: ['desert'] }, a: 0.65 }], fig: { k: 'climo', city: 'cairo' }, lines: TROPICS,
        marks: [mk([30.0, 31.2], 'Cairo', '开罗', { dot: true, c: C.orange, t: 0.6 }), mk([23, 5], 'Sahara', '撒哈拉沙漠', { big: true, c: C.orange, t: 1 }),
          mk([-24, -69.5], 'Atacama', '阿塔卡马沙漠', { c: C.orange, t: 1.4 }), mk([-24, 15], 'Namib', '纳米布沙漠', { c: C.orange, t: 1.4 })],
        body: ['Around the tropics, under the subtropical high, sinking air warms and stays dry. Cairo gets about 25 mm of rain in a whole year: its rain bars almost vanish. Summers are very hot (about 28 °C in July) and clear skies make nights cold. On the west coasts of continents, cold currents chill the air from below so it cannot rise and rain: the Atacama in Chile and the Namib in south-west Africa are among the driest places on Earth. The Sahara, Arabia and western and central Australia are hot deserts too.',
          '南北回归线附近受副热带高气压带控制，空气下沉增温，干燥少雨。开罗全年降水只有约 25 毫米，气候图上几乎看不到降水柱。夏季炎热（7 月约 28 °C），晴朗少云，昼夜温差大。大陆西岸有寒流经过，使近地面空气变冷、难以上升形成降水，智利的阿塔卡马沙漠和非洲西南部的纳米布沙漠是世界上最干燥的地方之一。撒哈拉沙漠、阿拉伯半岛和澳大利亚中西部也属于热带沙漠气候。'],
      },
      {
        title: ['Four climates side by side', '比较四种热带气候'], cam: [10, 60, 5], sketch: true,
        paint: [{ fill: { k: 'climate', only: ['rainforest', 'tmonsoon', 'savanna', 'desert'] }, a: 0.6 }],
        marks: [mk([1.35, 103.8], 'Singapore', '新加坡', { dot: true, c: C.green }), mk([19.1, 72.9], 'Mumbai', '孟买', { dot: true, c: C.lime }), mk([-12.5, 130.8], 'Darwin', '达尔文', { dot: true, c: C.gold }), mk([30.0, 31.2], 'Cairo', '开罗', { dot: true, c: C.orange })],
        fig: { k: 'bars', title: ['Rain in a year (mm)', '年降水量（毫米）'], unit: ['mm', '毫米'], rows: [
          { name: ['Mumbai (monsoon)', '孟买（季风）'], v: 2373, c: C.lime }, { name: ['Singapore (rainforest)', '新加坡（雨林）'], v: 2157, c: C.green },
          { name: ['Darwin (savanna)', '达尔文（草原）'], v: 1723, c: C.gold }, { name: ['Cairo (desert)', '开罗（沙漠）'], v: 25, c: C.orange }] },
        body: ['All four are hot, so look at the rain. Ask two questions: how much falls in a year, and is it spread out or packed into one season? Singapore (about 2,160 mm) is wet in every month; Mumbai gets even more (about 2,370 mm) but nearly all of it in four summer months; Darwin (about 1,720 mm) has a wet and a dry season; Cairo gets just 25 mm. Monsoon and savanna graphs look alike: the monsoon has a much wetter rainy season, and its hottest month comes just before the rains.',
          '四种气候都终年高温，所以要看降水：一看年降水量多少，二看降水是全年分布均匀还是集中在某个季节。新加坡（约 2160 毫米）各月都多雨；孟买降水更多（约 2370 毫米），但几乎都集中在夏季的四个月；达尔文（约 1720 毫米）分干湿两季；开罗只有约 25 毫米。热带季风和热带草原的气候图很像：热带季风气候雨季降水更多，最热月出现在雨季之前。'],
      },
    ],
    quiz: [
      { q: ['Which climate is this?', '这是哪种气候类型？'], fig: { k: 'climo', city: 'cairo', blind: true },
        options: [['Tropical desert', '热带沙漠气候'], ['Tropical rainforest', '热带雨林气候'], ['Tropical monsoon', '热带季风气候'], ['Tropical savanna', '热带草原气候']], answer: 0,
        why: ['Warm to hot all year and almost no rain at all.', '全年气温较高，几乎没有降水。'] },
      { q: ['Read this graph. Which hemisphere is the place in, and what is its climate?', '读这幅气候图：这个地方在哪个半球？属于哪种气候类型？'], fig: { k: 'climo', city: 'darwin', blind: true },
        options: [['Southern hemisphere, tropical savanna', '南半球，热带草原气候'], ['Northern hemisphere, tropical savanna', '北半球，热带草原气候'], ['Southern hemisphere, tropical rainforest', '南半球，热带雨林气候'], ['Northern hemisphere, tropical desert', '北半球，热带沙漠气候']], answer: 0,
        why: ['Hot all year with a wet season (Dec–Mar) and a dry season (May–Sep): savanna. The coolest month is July and the rains come around January, so summer is in January: the southern hemisphere. This is Darwin.', '终年高温，12 月至次年 3 月为湿季、5 月至 9 月为干季，是热带草原气候；最冷月在 7 月，1 月前后多雨，说明 1 月是夏季，位于南半球。这是达尔文。'] },
      { q: ['Read Mumbai\'s graph: June 520 mm, July 840 mm, August 560 mm, September 330 mm. How much rain falls in these four months?', '读孟买的气候图：6 月 520 毫米，7 月 840 毫米，8 月 560 毫米，9 月 330 毫米。这四个月共降水多少毫米？'],
        fig: { k: 'climo', city: 'mumbai' }, num: { answer: 2250, tol: 20, unit: ['mm', '毫米'] },
        why: ['520 + 840 + 560 + 330 = 2,250 mm, about 95% of Mumbai\'s 2,370 mm a year. The summer monsoon brings almost all the rain: that is the mark of a tropical monsoon climate.', '520 + 840 + 560 + 330 = 2250 毫米，约占孟买全年降水（约 2370 毫米）的 95%。降水几乎全部来自夏季风，这正是热带季风气候的特点。'] },
      { q: ['Mumbai has a rainy season because of…', '孟买有明显的雨季，是因为'], options: [['The summer monsoon from the ocean', '来自海洋的夏季风'], ['Cold ocean currents', '寒流'], ['High mountains around it', '四周高山环绕'], ['Being on the equator', '位于赤道上']], answer: 0,
        why: ['In summer the south-west monsoon carries wet ocean air onto India.', '夏季，西南季风把海洋上的湿润空气带到印度。'] },
      { q: ['Singapore has a tropical rainforest climate. Find it.', '新加坡是热带雨林气候。在地球上点出新加坡。'], at: [1.35, 103.8], tolKm: 400,
        why: ['Singapore is at the tip of the Malay Peninsula, just north of the equator.', '新加坡在马来半岛南端，紧挨着赤道。'] },
      { q: ['Match each city to its climate type.', '把城市和它的气候类型连起来。'],
        match: [[['Singapore', '新加坡'], ['Tropical rainforest', '热带雨林气候']], [['Mumbai', '孟买'], ['Tropical monsoon', '热带季风气候']], [['Darwin', '达尔文'], ['Tropical savanna', '热带草原气候']], [['Cairo', '开罗'], ['Tropical desert', '热带沙漠气候']]],
        why: ['Singapore is wet all year; Mumbai has a summer monsoon rainy season; Darwin has a wet and a dry season; Cairo hardly ever gets rain.', '新加坡终年多雨；孟买夏季风带来雨季；达尔文分干湿两季；开罗终年少雨。'] },
      { q: ['Read the graph: Singapore\'s warmest month is 28.4 °C and its coolest is 26.5 °C. What is its annual temperature range?', '读图：新加坡最热月气温 28.4 °C，最冷月 26.5 °C。它的气温年较差是多少？'],
        fig: { k: 'climo', city: 'singapore' }, num: { answer: 1.9, tol: 0.2, unit: ['°C', '°C'] },
        why: ['28.4 − 26.5 = 1.9 °C. Near the equator the Sun is high all year, so it is hot in every month and the range is tiny.', '28.4 − 26.5 = 1.9 °C。赤道附近终年正午太阳高度大，各月都很热，气温年较差很小。'] },
      { q: ['Label these tropical regions on the globe.', '在地球上标出这些热带地区。'],
        place: [{ text: ['Amazon Plain (rainforest)', '亚马孙平原（热带雨林气候）'], at: [-4, -62], tolKm: 800 }, { text: ['Congo Basin (rainforest)', '刚果盆地（热带雨林气候）'], at: [0, 22], tolKm: 700 }, { text: ['Sahara (desert)', '撒哈拉沙漠（热带沙漠气候）'], at: [23, 8], tolKm: 800 }, { text: ['East African Plateau (savanna)', '东非高原（热带草原气候）'], at: [-3, 35], tolKm: 600 }],
        why: ['Rainforests straddle the equator; the savanna of East Africa lies on a high plateau; the Sahara spreads across the Tropic of Cancer.', '热带雨林分布在赤道两侧；东非高原上是热带草原；撒哈拉沙漠横跨北回归线。'] },
    ],
  },
  {
    id: 'climates2', strand: 'climate', grade: 'g7a', tracks: ['uk', 'us', 'ib'], unit, icon: 'globe', minutes: 9,
    title: ['World climates: temperate, cold and highland', '世界的气候类型（二）'],
    blurb: ['Read and compare climate graphs, meet the climates outside the tropics, find out what shapes them and learn to name a climate from its graph.', '学会阅读和比较气候图，认识热带以外的气候类型和影响气候的因素，学会根据气候图判断气候类型。'],
    keys: [
      ['A climate graph shows monthly temperature (line) and rainfall (bars): read the warmest and coldest months, the range and when the rain falls.', '气候图用曲线表示各月气温，用柱状表示各月降水量：读出最热月、最冷月、气温年较差和降水集中的季节。'],
      ['Monsoon climates: rain in summer. Mediterranean: rain in winter. Maritime: mild and wet all year. Continental: dry, with a large range.', '季风气候夏季多雨；地中海气候冬季多雨；温带海洋性气候全年温和多雨；温带大陆性气候干燥少雨，气温年较差大。'],
      ['Climate is shaped by latitude, land and sea, terrain and altitude, and ocean currents.', '影响气候的主要因素有纬度位置、海陆位置、地形地势和洋流。'],
      ['To name a climate, let temperature set the zone and rainfall set the type.', '判断气候类型：以温定带，以水定型。'],
    ],
    steps: [
      {
        title: ['Reading a climate graph', '怎样读气候图'], cam: [30, 115, 3.8], sketch: true, items: ['cn_bund'],
        paint: [{ fill: { k: 'climate', only: ['smonsoon'] }, a: 0.65 }], fig: { k: 'climo', city: 'shanghai' },
        marks: [mk([31.2, 121.5], 'Shanghai: subtropical monsoon', '上海：亚热带季风气候', { dot: true, c: C.teal, t: 0.6 })],
        body: ['The line is the average temperature of each month (left scale), the bars are each month\'s rain (right scale). Read Shanghai: the warmest month is July (about 29 °C), the coldest January (about 5 °C), so the annual range is about 24 °C; above 0 °C all winter means subtropical. The tallest bars are in June to August, so the hot season is also the wet season, and the year adds up to about 1,250 mm. This is the subtropical monsoon climate of south-east China; the south-east USA has a similar humid subtropical climate.',
          '气候图中的曲线表示各月平均气温（看左侧刻度），柱状表示各月降水量（看右侧刻度）。读上海的气候图：最热月是 7 月（约 29 °C），最冷月是 1 月（约 5 °C），气温年较差约 24 °C；冬季气温在 0 °C 以上，属于亚热带。6—8 月降水柱最高，雨热同期，全年降水约 1250 毫米。这就是我国东南部的亚热带季风气候，美国东南部也有类似的亚热带湿润气候。'],
      },
      {
        title: ['Mediterranean: rain in winter', '地中海气候：冬季多雨'], cam: [10, 15, 4.8], sketch: true, items: ['colosseum'],
        paint: [{ fill: { k: 'climate', only: ['med'] }, a: 0.7 }], fig: { k: 'climo', city: 'rome', b: 'capetown' },
        marks: [mk([41.9, 12.5], 'Rome', '罗马', { dot: true, c: C.pink, t: 0.6 }), mk([-33.9, 18.4], 'Cape Town', '开普敦', { dot: true, c: C.pink, t: 1 })],
        body: ['Rome\'s graph is the opposite of Shanghai\'s: hot, dry summers (only about 19 mm in July) and mild, rainy winters. In summer the subtropical high moves over it and the air sinks; in winter the westerlies bring rain off the sea. Cape Town has the same pattern turned around: rain peaks in June and the warmest month is February, because it is south of the equator. This climate lies on the west coasts of continents at about 30°–40°: around the Mediterranean Sea, California, central Chile, south-west Africa and south-west Australia.',
          '罗马的气候图和上海正好相反：夏季炎热干燥（7 月只有约 19 毫米降水），冬季温和多雨。夏季受副热带高气压带控制，盛行下沉气流；冬季受西风带控制，西风从海洋带来降水。开普敦的规律相同但月份相反：6 月降水最多，最热月是 2 月，因为它在南半球。地中海气候分布在南北纬 30°—40° 之间的大陆西岸：地中海沿岸、美国加利福尼亚、智利中部、非洲西南部和澳大利亚西南部。'],
      },
      {
        title: ['West coast and east coast', '大陆西岸和东岸'], cam: [48, 55, 4.8], sketch: true, items: ['bigben', 'forbidden'],
        task: ['Compare the two graphs: notice that London\'s rain is spread through the year, while Beijing\'s falls mostly in July and August.', '比较两幅气候图：伦敦的降水各月比较均匀，而北京的降水集中在 7、8 月。'],
        paint: [{ fill: { k: 'climate', only: ['maritime', 'tmonsoon2'] }, a: 0.65 }], fig: { k: 'climo', city: 'london', b: 'beijing' },
        marks: [mk([51.5, -0.1], 'London: temperate maritime', '伦敦：温带海洋性气候', { dot: true, c: C.blue, t: 0.6 }), mk([39.9, 116.4], 'Beijing: temperate monsoon', '北京：温带季风气候', { dot: true, c: C.teal, t: 1 })],
        body: ['London and Beijing each get about 600 mm of rain a year, but look how differently it falls. On the west coast of Europe, westerly winds from the Atlantic keep London mild and damp all year: January about 5 °C, July about 19 °C, and 40–70 mm of rain every month. This temperate maritime climate covers west and north-west Europe, the north-west USA and Canada, southern Chile and New Zealand at about 40°–60°. On the east side of Asia, Beijing has a temperate monsoon climate: January about −3 °C and dry, and almost 60% of the year\'s rain in July and August.',
          '伦敦和北京的年降水量都在 600 毫米左右，但分配很不一样。欧洲西部受来自大西洋的西风影响，伦敦全年温和湿润：1 月约 5 °C，7 月约 19 °C，每月降水 40—70 毫米，属于温带海洋性气候，分布在南北纬 40°—60° 的大陆西岸，如欧洲西部、北美西北部、智利南部和新西兰。亚洲东部的北京属于温带季风气候：1 月约 −3 °C，寒冷干燥；7、8 两个月的降水接近全年的 60%。'],
      },
      {
        title: ['Deep inside the continents', '大陆内部'], cam: [48, 70, 4.4], sketch: true, items: ['kremlin', 'an_saiga'],
        paint: [{ fill: { k: 'climate', only: ['continental'] }, a: 0.65 }], fig: { k: 'climo', city: 'moscow', b: 'urumqi' },
        marks: [mk([55.8, 37.6], 'Moscow', '莫斯科', { dot: true, c: C.gold, t: 0.6 }), mk([43.8, 87.6], 'Ürümqi', '乌鲁木齐', { dot: true, c: C.gold, t: 1 })],
        body: ['Far from the sea, land heats up and cools down quickly, so winters are cold, summers warm and the annual range is large: about 25 °C in Moscow and 37 °C in Ürümqi. Wet sea air rarely reaches so far, so rain is low and it gets drier the farther inland you go: Moscow gets about 700 mm a year, Ürümqi only about 260 mm. This is the temperate continental climate, covering much of central Asia, eastern Europe and the interior of North America; the driest parts are desert and steppe.',
          '远离海洋的大陆内部，陆地升温快、降温也快，冬季寒冷，夏季温暖，气温年较差大：莫斯科约 25 °C，乌鲁木齐约 37 °C。海洋湿润气流很难到达，降水较少，而且越往内陆越干旱：莫斯科年降水量约 700 毫米，乌鲁木齐只有约 260 毫米。这就是温带大陆性气候，分布在亚洲中部、欧洲东部和北美大陆内部，最干旱的地方是荒漠和草原。'],
      },
      {
        title: ['Cold climates', '寒冷的气候'], cam: [68, 100, 4.2], sketch: true, items: ['an_reindeer', 'an_polarbear'],
        task: ['Turn the globe over Siberia and Canada: find the broad subarctic belt, with the tundra along the Arctic coast to its north.', '转动地球看西伯利亚和加拿大：找到宽阔的亚寒带针叶林气候带，以及它北边沿北冰洋沿岸分布的苔原气候。'],
        paint: [{ fill: { k: 'climate', only: ['subarctic', 'tundra', 'icecap'] }, a: 0.65 }], fig: { k: 'climo', city: 'yakutsk', b: 'utqiagvik' },
        marks: [mk([62.0, 129.7], 'Yakutsk: subarctic', '雅库茨克：亚寒带针叶林气候', { dot: true, c: C.violet, t: 0.6 }), mk([71.3, -156.8], 'Utqiaġvik: tundra', '乌特恰维克：苔原气候', { dot: true, c: C.ice, t: 1 }), mk([75, -40], 'Greenland: ice cap', '格陵兰岛：冰原气候', { c: C.white, t: 1.4 })],
        body: ['Across northern Russia and Canada, roughly 50°–70° N, the subarctic climate has long, bitter winters (Yakutsk averages about −39 °C in January) and short, warm summers (about 20 °C in July), with little rain. Nearer the Arctic Ocean is the tundra: even the warmest month stays below 10 °C (Utqiaġvik reaches only about 5 °C in July), too cold for trees. On Greenland and Antarctica the ice cap climate is below freezing in every month. These climates are almost all in the northern hemisphere, because the south has little land at these latitudes.',
          '俄罗斯北部和加拿大北部，大约北纬 50°—70°，是亚寒带针叶林气候：冬季漫长严寒（雅库茨克 1 月平均约 −39 °C），夏季短暂温暖（7 月约 20 °C），降水少。靠近北冰洋的是苔原气候，最热月气温也低于 10 °C（乌特恰维克 7 月只有约 5 °C），树木无法生长。格陵兰岛和南极洲是冰原气候，各月气温都在 0 °C 以下。亚寒带针叶林气候和苔原气候几乎只分布在北半球，因为南半球这些纬度几乎没有陆地。'],
      },
      {
        title: ['Highland climate', '高原山地气候'], cam: [32, 88, 3.4], sketch: true, items: ['potala', 'an_yak'],
        paint: [{ fill: { k: 'climate', only: ['highland'] }, a: 0.65 }], fig: { k: 'climo', city: 'lhasa', b: 'shanghai' },
        marks: [mk([29.65, 91.1], 'Lhasa, 3,650 m', '拉萨，海拔 3650 米', { dot: true, c: C.brown, t: 0.6 }), mk([31.2, 121.5], 'Shanghai, near sea level', '上海，海拔接近 0 米', { dot: true, c: C.teal, t: 0.9 }), mk([-15, -70], 'Andes', '安第斯山脉', { c: C.brown, t: 1.2 })],
        body: ['Temperature falls about 0.6 °C for every 100 m you climb. Lhasa and Shanghai are at almost the same latitude, but Lhasa is about 3,650 m higher, so its warmest month is only about 16 °C against Shanghai\'s 29 °C, even though the high plateau soaks up strong sunshine. Thin, clear air gives strong sunshine and big day–night swings, which is why Lhasa is called the "City of Sunlight". The Tibetan Plateau, the Andes and the Ethiopian Highlands have this highland climate, which changes with height.',
          '海拔每升高 100 米，气温约下降 0.6 °C。拉萨和上海纬度相近，但拉萨海拔高约 3650 米，最热月平均气温只有约 16 °C，而上海约 29 °C。高原空气稀薄、晴朗，日照强，气温日较差大，拉萨因此被称为“日光城”。青藏高原、安第斯山脉、埃塞俄比亚高原等地是高原山地气候，气候随海拔高度变化。'],
      },
      {
        title: ['What shapes a climate', '影响气候的主要因素'], cam: [52, 0, 4.2], sketch: true,
        paint: [{ fill: { k: 'climate' }, a: 0.5 }], fig: { k: 'climo', city: 'london', b: 'moscow' },
        lines: [GULF_STREAM, ...arrows([[[48, -30], [53, -8]], [[52, -25], [57, -2]]], C.teal, 1.6, 1.8)],
        marks: [
          mk([42, -50], 'Ocean current: warm Gulf Stream', '洋流：墨西哥湾暖流', { c: C.red, t: 1 }),
          mk([56, -16], 'Sea–land position: westerlies from the sea', '海陆位置：西风来自海洋', { c: C.teal, t: 1.8 }),
          mk([55.8, 37.6], 'Inland: colder winters', '内陆：冬季更冷', { dot: true, c: C.gold, t: 2.4 }),
        ],
        body: ['Latitude sets how much sunshine a place gets, so it gets colder towards the poles. Sea–land position matters too: London and Moscow are at similar latitudes, but London, near the sea, is about 11 °C warmer in January. Terrain and altitude: mountains are cooler, windward slopes facing wet winds are rainy while the lee side is dry, and China\'s Qinling Mountains shelter the south from cold winter winds. Ocean currents like the warm Gulf Stream heat the coasts they wash, and cold currents dry them out.',
          '纬度位置决定一个地方获得太阳热量的多少，纬度越高，气温越低。海陆位置也很重要：伦敦和莫斯科纬度相近，但靠近海洋的伦敦 1 月平均气温比莫斯科高约 11 °C。地形和地势：山地气温低；迎风坡降水多，背风坡降水少；我国的秦岭阻挡了冬季南下的冷空气。洋流也会影响沿岸气候：墨西哥湾暖流让欧洲西部更加温暖湿润，寒流则使沿岸更加干燥。'],
      },
      {
        title: ['Naming a climate from its graph', '根据气候图判断气候类型'], cam: [15, 30, 4.8], sketch: true,
        paint: [{ fill: { k: 'climate' }, a: 0.55 }], fig: { k: 'svg', draw: climKeyFig },
        body: ['Here is a quick method. First let temperature set the zone: if the coldest month is above about 15 °C it is tropical, 0–15 °C subtropical, below 0 °C temperate, and if even the warmest month is below 10 °C it is polar. Then let rainfall set the type: wet all year, wet summers, wet winters or dry all year. Check the hemisphere too: if July is the coldest month, the place is south of the equator. These are rules of thumb: London stays above 0 °C in winter but is temperate maritime.',
          '判断气候类型有一个简便方法。第一步“以温定带”：最冷月在 15 °C 以上一般是热带，0—15 °C 是亚热带，0 °C 以下是温带，最热月也低于 10 °C 是寒带。第二步“以水定型”：看全年多雨、夏雨型、冬雨型还是全年少雨。还要判断半球：如果 7 月最冷，说明在南半球。这些只是经验方法，例如伦敦冬季气温在 0 °C 以上，却属于温带海洋性气候。'],
      },
    ],
    quiz: [
      { q: ['Read this graph. Which climate is it?', '读气候图，判断它的气候类型。'], fig: { k: 'climo', city: 'capetown', blind: true },
        options: [['Mediterranean, southern hemisphere', '地中海气候，南半球'], ['Mediterranean, northern hemisphere', '地中海气候，北半球'], ['Subtropical monsoon, southern hemisphere', '亚热带季风气候，南半球'], ['Temperate maritime, northern hemisphere', '温带海洋性气候，北半球']], answer: 0,
        why: ['Mild all year and rain mainly in the cool months: a Mediterranean climate. The warmest months are January and February and the rain peaks in June, so the seasons are reversed: southern hemisphere. This is Cape Town.', '全年温和，降水集中在气温较低的季节，是地中海气候；最热月在 1、2 月，6 月降水最多，季节与北半球相反，位于南半球。这是开普敦。'] },
      { q: ['Which climate is this?', '这是哪种气候类型？'], fig: { k: 'climo', city: 'beijing', blind: true },
        options: [['Temperate monsoon', '温带季风气候'], ['Temperate maritime', '温带海洋性气候'], ['Tropical monsoon', '热带季风气候'], ['Polar tundra', '极地苔原气候']], answer: 0,
        why: ['Winter below 0 °C and summer hot and rainy: temperate monsoon.', '冬季气温低于 0 °C，夏季高温多雨，是温带季风气候。'] },
      { q: ['London is much milder in winter than Moscow mainly because of…', '伦敦冬季比莫斯科温和得多，主要原因是'], options: [['Sea–land position', '海陆位置'], ['Latitude', '纬度位置'], ['Altitude', '海拔高度'], ['Air pollution', '空气污染']], answer: 0,
        why: ['They are at similar latitudes, but London is near the Atlantic and the warm Gulf Stream.', '两地纬度相近，但伦敦靠近大西洋，还受暖流影响。'] },
      { q: ['Lhasa is cool in summer though it is at a low latitude. Find Lhasa.', '拉萨纬度较低，夏季却很凉爽。在地球上点出拉萨。'], at: [29.65, 91.1], tolKm: 500,
        why: ['Lhasa is on the Tibetan Plateau, at about 3,650 m.', '拉萨位于青藏高原，海拔约 3650 米。'] },
      { q: ['Match each city to its climate type.', '把城市和它的气候类型连起来。'],
        match: [[['Shanghai', '上海'], ['Subtropical monsoon', '亚热带季风气候']], [['London', '伦敦'], ['Temperate maritime', '温带海洋性气候']], [['Moscow', '莫斯科'], ['Temperate continental', '温带大陆性气候']], [['Rome', '罗马'], ['Mediterranean', '地中海气候']], [['Yakutsk', '雅库茨克'], ['Subarctic', '亚寒带针叶林气候']]],
        why: ['Shanghai has hot, wet summers and mild winters; London is mild and damp all year; Moscow has cold winters and modest rain; Rome has dry summers and wet winters; Yakutsk has long, bitter winters.', '上海夏季高温多雨、冬季温和少雨；伦敦全年温和湿润；莫斯科冬季寒冷，降水较少；罗马夏季干燥、冬季多雨；雅库茨克冬季漫长而严寒。'] },
      { q: ['Which climates get most of their rain in summer? Pick all that apply.', '下列气候类型中，降水主要集中在夏季的有（多选）'],
        options: [['Temperate monsoon', '温带季风气候'], ['Subtropical monsoon', '亚热带季风气候'], ['Mediterranean', '地中海气候'], ['Temperate maritime', '温带海洋性气候']], multi: [0, 1],
        why: ['Monsoon climates are rainy in summer. Mediterranean climates are the opposite: hot and dry in summer, mild and wet in winter. Temperate maritime rain is spread evenly through the year.', '季风气候雨热同期，降水集中在夏季；地中海气候正好相反，夏季炎热干燥、冬季温和多雨；温带海洋性气候降水各月比较均匀。'] },
      { q: ['Yakutsk\'s warmest month averages 19.5 °C and its coldest −38.6 °C. What is its annual temperature range?', '雅库茨克最热月平均气温 19.5 °C，最冷月 −38.6 °C。它的气温年较差是多少？'],
        fig: { k: 'climo', city: 'yakutsk' }, num: { answer: 58.1, tol: 0.5, unit: ['°C', '°C'] },
        why: ['19.5 − (−38.6) = 58.1 °C, one of the largest ranges on Earth. Far from any sea and at a high latitude, its winters are extremely cold.', '19.5 −（−38.6）= 58.1 °C，是世界上气温年较差最大的地方之一。它纬度高、远离海洋，冬季极其寒冷。'] },
      { q: ['It is 26 °C at the foot of a mountain. What is the temperature on a peak 3,000 m higher?', '山脚气温为 26 °C，比山脚高 3000 米的山顶气温约为多少？'], num: { answer: 8, tol: 0.5, unit: ['°C', '°C'] },
        why: ['It cools about 0.6 °C per 100 m: 3,000 ÷ 100 × 0.6 = 18 °C cooler, so 26 − 18 = 8 °C. That is why mountains near the equator can have snow on top.', '海拔每升高 100 米气温约下降 0.6 °C：3000 ÷ 100 × 0.6 = 18 °C，26 − 18 = 8 °C。所以赤道附近的高山山顶也会有积雪。'] },
    ],
  },
  {
    id: 'biomes', strand: 'climate', tracks: ['us', 'uk', 'ib', 'au'], unit, icon: 'leaf', minutes: 9,
    title: ['Biomes: climate and life', '气候与自然植被'],
    blurb: ['Each climate grows its own kind of vegetation, and its own animals. Tour the world\'s biomes.', '不同的气候孕育不同的自然植被和动物。一起游览世界的自然带。'],
    keys: [
      ['A biome is a large area with similar vegetation and animals, shaped by climate.', '自然带（生物群落）是植被和动物相似的大片地区，由气候决定。'],
      ['Heat and water decide what grows: forests where it is wet, grass where it is drier, desert where it is driest.', '热量和水分决定植被：湿润处是森林，较干处是草原，最干处是荒漠。'],
      ['Animals are adapted to their biome, like camels to the desert and reindeer to the cold.', '动物适应各自的环境，比如骆驼适应沙漠，驯鹿适应寒冷。'],
      ['Biomes change from the equator to the poles, and also with height up a mountain.', '自然带从赤道向两极有规律地变化，在高山上也随海拔高度变化。'],
      ['People are changing biomes fast: rainforests are cleared for farms, grasslands ploughed and deserts spread.', '人类活动正迅速改变自然带：雨林被砍伐开垦，草原被开垦，荒漠在扩大。'],
    ],
    steps: [
      {
        title: ['From climate to vegetation', '从气候到植被'], cam: [15, 20, 4.8], sketch: true,
        task: ['Turn the globe from the equator towards a pole and watch the vegetation colours change band by band.', '从赤道向两极转动地球，观察自然植被的颜色怎样一带一带地变化。'],
        paint: [{ fill: { k: 'biome' }, a: 0.6 }], fig: { k: 'key', set: 'biome' },
        body: ['Plants need warmth and water. Hot and wet gives rainforest; hot with a dry season gives savanna; very dry gives desert; cool and dry gives grassland; long cold winters give conifer forest; and the coldest lands have only tundra and ice. Compare this map with the climate map: they match closely.',
          '植物生长需要热量和水分。高温多雨形成热带雨林；高温而有干季形成热带草原；极其干旱形成荒漠；温带较干形成温带草原；冬季漫长寒冷形成针叶林；最寒冷的地方只有苔原和冰原。把这幅图和气候图对比，它们非常相似。'],
      },
      {
        title: ['Tropical rainforest', '热带雨林'], cam: [-3, -62, 3.6], sketch: true, items: ['pl_kapok', 'an_jaguar', 'an_toucan', 'an_sloth', 'an_orangutan'],
        paint: [{ fill: { k: 'biome', only: ['rainforest'] }, a: 0.65 }], fig: { k: 'key', set: 'biome', only: ['rainforest'] },
        marks: [mk([-3.3, -60.6], 'Amazon rainforest', '亚马孙热带雨林', { big: true, c: C.green, t: 0.6 })],
        body: ['Constant heat and rain make the richest biome on Earth: giant kapok trees tower 50 m above layers of smaller trees and vines, and the forest stays green all year. Jaguars, toucans and slow sloths live in the Amazon; orangutans swing through the rainforests of Borneo. Rainforests cover only about 6% of the land but hold about half of all land species, and they store huge amounts of carbon. Yet millions of hectares are cleared each year for cattle, soya and oil palm: the Amazon has already lost almost a fifth of its forest.',
          '终年高温多雨，造就了地球上物种最丰富的自然带：高约 50 米的木棉树（吉贝树）耸立在多层树木和藤本植物之上，森林四季常绿。亚马孙雨林里有美洲豹、巨嘴鸟和行动缓慢的树懒，加里曼丹岛的雨林里生活着猩猩。雨林只占陆地面积的约 6%，却拥有约一半的陆地物种，还储存着大量的碳。然而每年都有数百万公顷雨林被砍伐，用来养牛、种大豆和油棕：亚马孙雨林已经失去了近五分之一。'],
      },
      {
        title: ['Savanna', '热带草原'], cam: [-3, 35, 3.6], sketch: true, items: ['an_lion', 'an_giraffe', 'an_zebra', 'mg_wildebeest'],
        paint: [{ fill: { k: 'biome', only: ['savanna'] }, a: 0.65 }], fig: { k: 'key', set: 'biome', only: ['savanna'] },
        lines: [{ pts: [[-2.5, 34.8], [-1.5, 35.2], [-2.2, 35.6], [-3.2, 35.1], [-2.5, 34.8]], c: C.gold, w: 2, flow: true, arrow: true, dur: 2.4, t: 0.8 }],
        marks: [mk([-2.5, 34.8], 'Serengeti', '塞伦盖蒂', { big: true, c: C.gold, t: 0.6 })],
        body: ['With a long dry season, trees grow only here and there in a sea of tall grass. In East Africa, zebras and giraffes graze, lions hunt, and over a million wildebeest migrate in a great loop, following the rains to fresh grass.',
          '由于有较长的干季，高高的草丛中只零星分布着树木。在东非高原上，斑马和长颈鹿吃草，狮子捕猎；一百多万只角马追随雨季的青草，进行大规模的环形迁徙。'],
      },
      {
        title: ['Deserts', '荒漠'], cam: [15, -20, 4.8], sketch: true, items: ['an_camel', 'an_fennec', 'pl_saguaro', 'pl_welwitschia'],
        paint: [{ fill: { k: 'biome', only: ['desert'] }, a: 0.65 }], fig: { k: 'key', set: 'biome', only: ['desert'] },
        marks: [mk([26, 30], 'Camel: stores fat in its hump', '骆驼：驼峰里储存脂肪', { c: C.orange, t: 0.6 }), mk([30.8, 7.3], 'Fennec fox: big ears lose heat', '耳廓狐：大耳朵散热', { c: C.orange, t: 1 }), mk([32.3, -110.8], 'Saguaro: stores water', '巨人柱仙人掌：储存水分', { c: C.orange, t: 1.4 }), mk([-22.6, 15.1], 'Welwitschia', '百岁兰', { c: C.orange, t: 1.8 })],
        body: ['Where almost no rain falls, plants and animals must save water. Cacti like the saguaro store water in fat stems; the welwitschia of the Namib can live over a thousand years. Camels can go many days without drinking, and fennec foxes hide from the heat in burrows and lose heat through their huge ears.',
          '降水极少的地方，动植物都要节约水分。巨人柱仙人掌用粗壮的茎储存水分；纳米布沙漠的百岁兰能活一千多年。骆驼可以多天不喝水，耳廓狐白天躲在洞里避暑，用大耳朵散热。'],
      },
      {
        title: ['Temperate grasslands', '温带草原'], cam: [45, -10, 5], sketch: true, items: ['an_bison', 'an_saiga'],
        paint: [{ fill: { k: 'biome', only: ['grassland'] }, a: 0.65 }], fig: { k: 'key', set: 'biome', only: ['grassland', 'temperateforest'] },
        marks: [mk([44.6, -105], 'Prairie', '北美大草原', { big: true, c: C.lime, t: 0.6 }), mk([48.3, 64.5], 'Steppe', '亚欧草原', { big: true, c: C.lime, t: 1 })],
        body: ['Inside the continents of the temperate zone there is too little rain for forest, so grass grows instead. The North American prairie was once home to tens of millions of bison; the Eurasian steppe, stretching to Inner Mongolia in China, is home to the saiga antelope. Many grasslands are now farmland and pasture.',
          '温带大陆内部降水较少，不足以生长森林，于是形成草原。北美大草原上曾生活着数千万头美洲野牛；亚欧大草原一直延伸到我国内蒙古，那里有赛加羚羊。如今许多草原已被开垦为农田和牧场。'],
      },
      {
        title: ['Forests of the middle latitudes', '中纬度的森林'], cam: [36, 75, 5], sketch: true, items: ['an_panda', 'an_snubmonkey', 'pl_bamboo'],
        paint: [{ fill: { k: 'biome', only: ['evergreen', 'temperateforest', 'shrubland'] }, a: 0.65 }], fig: { k: 'key', set: 'biome', only: ['evergreen', 'temperateforest', 'shrubland'] },
        marks: [mk([27, 113], 'Evergreen broadleaf forest', '亚热带常绿阔叶林', { big: true, c: C.green, t: 0.6 }), mk([50, 10], 'Deciduous forest', '温带落叶阔叶林', { big: true, c: C.lime, t: 1 }), mk([40, 15], 'Hard-leaved shrubs', '亚热带常绿硬叶林', { c: C.pink, t: 1.4 })],
        body: ['In southern China, warm, wet summers and mild winters grow subtropical evergreen broadleaf forest, with camphor trees and bamboo; giant pandas and golden snub-nosed monkeys live in the mountains of Sichuan and Shaanxi. Farther north, in northern China, western Europe and the eastern USA, winters are cold, so temperate deciduous trees such as oak and maple drop their leaves each autumn to save water. Around the Mediterranean, plants like olives and cork oaks have small, hard, waxy leaves to survive the dry summers. Most of these forests have long since been cleared for farms and cities.',
          '我国南方夏季高温多雨、冬季温和，生长着亚热带常绿阔叶林，有樟树和竹林；四川、陕西的山区生活着大熊猫和金丝猴。再往北，我国北方、欧洲西部和美国东部冬季寒冷，温带落叶阔叶林中的栎树、枫树等秋季落叶，以减少水分散失。地中海沿岸夏季干燥，油橄榄、栓皮栎等植物的叶片小而坚硬、表面有蜡质，能够度过干旱的夏季。这些森林大多早已被开垦为农田和城市。'],
      },
      {
        title: ['Taiga and tundra', '针叶林和苔原'], cam: [65, 40, 4.4], sketch: true, items: ['an_reindeer', 'mg_caribou', 'an_moose'],
        task: ['Find where the trees stop: trace the edge between the green taiga and the pale tundra across northern Russia.', '找到树木消失的地方：沿着俄罗斯北部，找出绿色的亚寒带针叶林和浅色苔原的分界线。'],
        paint: [{ fill: { k: 'biome', only: ['taiga', 'tundra'] }, a: 0.65 }], fig: { k: 'key', set: 'biome', only: ['taiga', 'tundra'] },
        marks: [mk([60, 90], 'Taiga', '亚寒带针叶林', { big: true, c: C.green, t: 0.6 }), mk([70, 60], 'Tundra', '苔原', { big: true, c: C.ice, t: 1 })],
        body: ['South of the Arctic, a belt of conifer forest (the taiga) circles the globe across Russia, Scandinavia and Canada. Its needle-leaved trees survive long, snowy winters. Farther north, summers are too short and cold for trees: the tundra has only mosses, lichens and low shrubs. Reindeer migrate between the two.',
          '北极圈附近以南，一条亚寒带针叶林带横贯俄罗斯、北欧和加拿大，针叶树能熬过漫长多雪的冬季。再往北，夏季太短太冷，树木无法生长，苔原上只有苔藓、地衣和低矮的灌木。驯鹿在两者之间迁徙。'],
      },
      {
        title: ['Climbing a mountain', '高山上的自然带'], cam: [-3.07, 37.35, 2.4], sketch: true, items: ['kilimanjaro', 'an_elephant'], fig: { k: 'svg', draw: kiliFig },
        marks: [mk([-3.07, 37.35], 'Kilimanjaro, 5,895 m', '乞力马扎罗山，5895 米', { dot: true, c: C.white, t: 0.6 })],
        body: ['Climbing a high mountain is like travelling towards a pole, because it cools about 0.6 °C every 100 m. Kilimanjaro in Tanzania is only 3° south of the equator, yet its slopes pass from savanna and farms through mountain rainforest, heath and alpine desert to ice and snow at the top. The higher and closer to the equator a mountain is, the more zones it has. But warming has shrunk Kilimanjaro\'s glaciers by more than 80% since 1912.',
          '登上一座高山，就像从赤道走向两极，因为海拔每升高 100 米，气温约下降 0.6 °C。坦桑尼亚的乞力马扎罗山位于南纬 3°，靠近赤道，从山麓到山顶依次是热带草原和农田、山地雨林、高山灌丛和草甸、高山荒漠，山顶是冰雪带。山越高、离赤道越近，垂直自然带越多。不过，自 1912 年以来，乞力马扎罗山的冰川已经缩小了 80% 以上。'],
      },
    ],
    quiz: [
      { q: ['Hot all year with a long dry season gives…', '终年高温、有较长干季的地区，自然植被是'], options: [['Savanna', '热带草原'], ['Rainforest', '热带雨林'], ['Taiga', '亚寒带针叶林'], ['Tundra', '苔原']], answer: 0,
        why: ['Too dry for a closed forest, but warm enough for tall grass and scattered trees.', '对森林来说太干，但足够让高草和零星的树木生长。'] },
      { q: ['Which animal is adapted to the desert?', '下面哪种动物适应沙漠环境'], options: [['Fennec fox', '耳廓狐'], ['Reindeer', '驯鹿'], ['Sloth', '树懒'], ['Polar bear', '北极熊']], answer: 0,
        why: ['Its big ears give off heat and it hides in burrows by day.', '它用大耳朵散热，白天躲在洞里。'] },
      { q: ['Why do no trees grow in the tundra?', '苔原上为什么没有树木'], options: [['Summers are too short and cold', '夏季太短、太冷'], ['It rains too much', '降水太多'], ['It is too hot', '太热'], ['People cut them all down', '被人砍光了']], answer: 0,
        why: ['Only mosses, lichens and low shrubs can grow in such a short, cold summer.', '短暂寒冷的夏季只能长出苔藓、地衣和低矮灌木。'] },
      { q: ['Read this climate graph. Which vegetation grows there?', '读气候图，判断当地的自然植被。'], fig: { k: 'climo', city: 'yakutsk', blind: true },
        options: [['Taiga (conifer forest)', '亚寒带针叶林'], ['Tundra', '苔原'], ['Temperate grassland', '温带草原'], ['Temperate deciduous forest', '温带落叶阔叶林']], answer: 0,
        why: ['Bitterly cold winters but a short summer of about 20 °C, warm enough for trees (tundra needs the warmest month below 10 °C), and little rain: subarctic climate, so conifer forest. This is Yakutsk in Siberia.', '冬季严寒，但短暂的夏季约 20 °C，足以让树木生长（苔原最热月低于 10 °C），降水较少，是亚寒带针叶林气候，自然植被为亚寒带针叶林。这是西伯利亚的雅库茨克。'] },
      { q: ['Find the Amazon rainforest.', '在地球上点出亚马孙热带雨林。'], at: [-3.5, -62], tolKm: 1200,
        why: ['It covers the Amazon Basin in South America, along the equator.', '它覆盖南美洲赤道附近的亚马孙平原。'] },
      { q: ['Match each biome to an animal adapted to it.', '把自然植被和适应那里环境的动物连起来。'],
        match: [[['Tropical rainforest', '热带雨林'], ['Sloth', '树懒']], [['Savanna', '热带草原'], ['Giraffe', '长颈鹿']], [['Desert', '荒漠'], ['Camel', '骆驼']], [['Tundra', '苔原'], ['Reindeer', '驯鹿']]],
        why: ['Sloths hang in rainforest trees, giraffes browse on savanna acacias, camels store fat and survive without water, and reindeer dig through snow for lichen.', '树懒生活在雨林的树上；长颈鹿吃稀树草原上的金合欢树叶；骆驼耐饥耐渴；驯鹿能刨开积雪找地衣吃。'] },
      { q: ['Travelling north from the Congo Basin to the Arctic coast of Russia, in what order do you meet these?', '从刚果盆地一路向北到俄罗斯北冰洋沿岸，依次经过的自然植被是'],
        order: [['Tropical rainforest', '热带雨林'], ['Savanna', '热带草原'], ['Desert', '荒漠'], ['Taiga', '亚寒带针叶林'], ['Tundra', '苔原']],
        why: ['Vegetation changes with heat and rain: wet rainforest at the equator, savanna with a dry season, the dry Sahara near the tropic, then cold-tolerant conifers and finally treeless tundra.', '自然植被随热量和水分而变化：赤道附近是湿热的雨林，向北依次是有干湿季的热带草原、回归线附近干旱的撒哈拉荒漠，再到耐寒的针叶林，最后是没有树木的苔原。'] },
      { q: ['Label these biomes on the globe.', '在地球上标出这些自然植被区。'],
        place: [{ text: ['Serengeti savanna', '塞伦盖蒂热带草原'], at: [-2.5, 34.8], tolKm: 600 }, { text: ['North American prairie', '北美大草原'], at: [44.6, -103], tolKm: 800 }, { text: ['Siberian taiga', '西伯利亚针叶林'], at: [60, 95], tolKm: 800 }, { text: ['Sahara Desert', '撒哈拉沙漠'], at: [23, 8], tolKm: 800 }],
        why: ['The Serengeti is in East Africa, the prairie in the middle of North America, the taiga across northern Russia, and the Sahara in North Africa.', '塞伦盖蒂在东非，北美大草原在北美洲中部，针叶林横跨俄罗斯北部，撒哈拉沙漠在非洲北部。'] },
    ],
  },
  {
    id: 'climatechange', strand: 'climate', tracks: ['uk', 'us', 'ib', 'au'], unit, icon: 'sun', minutes: 9,
    title: ['Climate change', '全球气候变暖'],
    blurb: ['How greenhouse gases warm the planet, where they come from, what is changing, and how we can cut them and adapt.', '温室气体怎样使地球变暖、从哪里来，带来哪些变化，以及人类怎样减缓和适应。'],
    keys: [
      ['Greenhouse gases such as CO2 trap heat; burning fossil fuels and clearing forests add more of them.', '二氧化碳等温室气体会留住热量，燃烧化石燃料和砍伐森林使它们增多。'],
      ['CO2 has risen from about 280 ppm to about 425 ppm; the Earth is about 1.2 °C warmer than in the late 1800s.', '二氧化碳浓度从约 280 ppm 升到约 425 ppm，全球气温比 19 世纪后期升高了约 1.2 °C。'],
      ['Ice is melting, seas are rising, extreme weather is more frequent and coral reefs are bleaching.', '冰川融化、海平面上升、极端天气增多、珊瑚白化。'],
      ['About three-quarters of emissions come from energy; rich countries emit far more per person.', '约四分之三的排放来自能源；发达国家人均排放量远高于发展中国家。'],
      ['Mitigation cuts emissions; adaptation helps us live with the changes. Both need international cooperation.', '减缓是减少排放，适应是应对已经发生的变化，两者都需要国际合作。'],
    ],
    steps: [
      {
        title: ['The greenhouse effect', '温室效应'], cam: [20, 100, 5], night: true, sun: true, fig: { k: 'dia', id: 'greenhouse' },
        clock: { mode: 'day', start: T.marchNoonChina, rate: 3 },
        body: ['Sunlight passes through the air and warms the ground, and the ground gives off heat. Gases such as carbon dioxide (CO2), methane and water vapour absorb some of that heat and send part of it back down, like the glass of a greenhouse. Without them the Earth would average about −18 °C instead of about 15 °C, too cold for most life. The problem is not the effect itself but making it stronger: more greenhouse gas traps more heat.',
          '太阳光穿过大气使地面变暖，地面再向外放出热量。二氧化碳、甲烷和水汽等气体吸收其中一部分热量，又把一部分返还给地面，就像温室的玻璃一样，这就是温室效应。没有它，地球平均气温将是约 −18 °C，而不是约 15 °C，大多数生物都无法生存。问题不在温室效应本身，而在于它被增强了：温室气体越多，留住的热量也越多。'],
      },
      {
        title: ['More and more CO2', '越来越多的二氧化碳'], cam: [20, -150, 3.8],
        task: ['Find the red dot on Hawaii\'s Mauna Loa, far out in the Pacific, where clean air has been sampled since 1958.', '找到太平洋中夏威夷冒纳罗亚火山上的红点，那里从 1958 年起就在测量洁净空气中的二氧化碳。'],
        fig: { k: 'line', title: ['CO2 in the air (approx.)', '大气中的二氧化碳浓度（约）'], unit: ['ppm', 'ppm'], min: 260, max: 440,
          x: [1850, 1958, 1980, 2000, 2010, 2020, 2024],
          series: [{ name: ['CO2', '二氧化碳'], c: C.red, y: [280, 315, 339, 370, 390, 414, 425] }],
          notes: [{ x: 1850, text: ['Before industry', '工业革命前'] }, { x: 1958, text: ['Measuring starts', '开始测量'] }] },
        marks: [mk([19.5, -155.6], 'Mauna Loa: CO2 measured since 1958', '冒纳罗亚：1958 年起测量二氧化碳', { dot: true, c: C.red, t: 0.6 })],
        body: ['Before factories and cars, the air held about 280 parts per million (ppm) of CO2. Since 1958 it has been measured on Mauna Loa in Hawaii: 315 ppm then, about 425 ppm in 2024, and the rise is getting faster. Bubbles of old air trapped in Antarctic ice show that CO2 never went above about 300 ppm in the past 800,000 years. Most of the rise comes from burning coal, oil and gas, and from cutting down forests that would otherwise soak up CO2.',
          '工业革命前，大气中的二氧化碳浓度约为 280 ppm（百万分之一）。从 1958 年起，夏威夷冒纳罗亚火山上一直在测量：当时是 315 ppm，2024 年约 425 ppm，而且上升越来越快。南极冰芯气泡里保存的古代空气表明，过去 80 万年里二氧化碳浓度从未超过约 300 ppm。增加的主要原因是燃烧煤、石油和天然气，以及砍伐能吸收二氧化碳的森林。'],
      },
      {
        title: ['Where the emissions come from', '温室气体从哪里来'], cam: [32, 95, 4.8], sketch: true,
        fig: { k: 'pie', title: ['World greenhouse gas emissions by sector (approx.)', '世界温室气体排放的来源（约）'], parts: [
          { name: ['Energy: power, transport, buildings, factories', '能源：发电、交通、建筑、工厂用能'], v: 73.2, c: C.red },
          { name: ['Farming, forests and land use', '农业、林业和土地利用'], v: 18.4, c: C.lime },
          { name: ['Industrial processes (cement, chemicals)', '工业生产过程（水泥、化工）'], v: 5.2, c: C.gold },
          { name: ['Waste', '废弃物'], v: 3.2, c: C.violet }] },
        marks: [mk([35, 105], 'China: about 30% of world CO2', '中国：约占世界二氧化碳排放的 30%', { c: C.red, t: 0.6 }), mk([39, -98], 'USA: about 14 t per person', '美国：人均约 14 吨', { c: C.orange, t: 1 }), mk([22, 79], 'India: about 2 t per person', '印度：人均约 2 吨', { c: C.gold, t: 1.4 })],
        body: ['About three-quarters of greenhouse gases come from using energy: power stations, cars, planes, heating and factories burning coal, oil and gas. Farming adds methane from cattle and rice paddies, and clearing forests releases their carbon. Today China emits the most CO2 in total (about 30%), but per person an American emits about 14 t a year, a Chinese about 8 t and an Indian about 2 t, against a world average of about 4.7 t. Developed countries have also emitted the most since 1850, so climate treaties follow "common but differentiated responsibilities".',
          '约四分之三的温室气体来自能源消耗：发电厂、汽车、飞机、取暖和工厂燃烧煤、石油和天然气。农业中牛的消化和水稻田会产生甲烷，砍伐森林会释放其中储存的碳。如今中国的二氧化碳排放总量最多（约占 30%），但按人均算，美国每人每年约 14 吨，中国约 8 吨，印度约 2 吨，世界平均约 4.7 吨。1850 年以来发达国家累计排放最多，所以国际气候协议坚持“共同但有区别的责任”原则。'],
      },
      {
        title: ['A warmer planet', '全球变暖'], cam: [30, 100, 4.8], sketch: true, sun: true,
        clock: { mode: 'year', start: T.julChina, rate: 0 }, paint: [{ fill: { k: 'temp' }, a: 0.55 }],
        fig: { k: 'line', title: ['Global warming since 1850–1900 (approx.)', '与 1850–1900 年相比的全球升温（约）'], unit: ['°C', '°C'], min: -0.2, max: 1.8,
          x: [1880, 1900, 1920, 1940, 1960, 1980, 2000, 2020, 2024],
          series: [{ name: ['Temperature rise', '升温幅度'], c: C.orange, y: [0, 0, 0.1, 0.3, 0.25, 0.45, 0.75, 1.25, 1.55] }] },
        marks: [mk([34.75, 113.65], 'Zhengzhou, 2021: 201.9 mm of rain in one hour', '郑州，2021 年：1 小时降雨 201.9 毫米', { dot: true, c: C.blue, t: 0.8 })],
        body: ['With more greenhouse gases, the world has warmed by about 1.1 °C (2011–2020 average, IPCC) and about 1.2 °C over the last ten years. 2024 was the warmest year on record, the first above 1.5 °C. That sounds small, but a warmer atmosphere holds more water vapour and energy, so heatwaves, downpours and droughts become more frequent and stronger: on 20 July 2021, Zhengzhou got 201.9 mm of rain in a single hour. Land and the Arctic warm faster than the average.',
          '随着温室气体增多，全球平均气温比 1850—1900 年升高了约 1.1 °C（2011—2020 年平均，IPCC），最近十年约 1.2 °C。2024 年是有记录以来最暖的一年，第一次超过 1.5 °C。这个数字看起来不大，但更暖的大气含有更多水汽和能量，热浪、暴雨和干旱更频繁、更强烈：2021 年 7 月 20 日，郑州 1 小时降雨达 201.9 毫米。陆地和北极地区升温比平均更快。'],
      },
      {
        title: ['Melting ice, rising seas', '冰雪融化，海平面上升'], cam: [55, -20, 4.4], items: ['an_polarbear', 'an_walrus'],
        task: ['Turn from the Arctic down to the Indian Ocean and find the Maldives and Bangladesh: notice how low and flat they are.', '从北极转到印度洋，找到马尔代夫和孟加拉国：注意它们的地势多么低平。'],
        paint: [{ fill: { k: 'band', s: 75, n: 90, c: C.ice }, a: 0.45 }],
        marks: [
          mk([78, -30], 'Arctic sea ice is shrinking', '北冰洋海冰在减少', { big: true, c: C.ice, t: 0.4 }),
          mk([72, -40], 'Greenland ice sheet melting', '格陵兰冰盖融化', { c: C.white, t: 0.9 }),
          mk([4.2, 73.5], 'Maldives: islands about 1 m high', '马尔代夫：岛屿海拔约 1 米', { dot: true, c: C.blue, t: 1.4 }),
          mk([23.7, 90.4], 'Bangladesh: low delta', '孟加拉国：低平的三角洲', { dot: true, c: C.blue, t: 1.8 }),
        ],
        body: ['In September, Arctic sea ice now covers about 40% less ocean than in 1979, so polar bears have less ice to hunt seals from. Mountain glaciers and the Greenland and Antarctic ice sheets are melting, and warmer sea water expands. Together they have raised the sea about 20 cm since 1900, and it now rises over 4 mm a year. That threatens low islands like the Maldives, delta lands like Bangladesh and coastal cities such as Shanghai.',
          '如今 9 月北冰洋海冰的面积比 1979 年少了约 40%，北极熊可以用来捕猎海豹的冰面越来越少。高山冰川、格陵兰冰盖和南极冰盖在融化，海水受热膨胀。两者使海平面自 1900 年以来上升了约 20 厘米，现在每年上升 4 毫米以上，威胁着马尔代夫这样的低平岛国、孟加拉国这样的三角洲地区，以及上海等沿海城市。'],
      },
      {
        title: ['Coral bleaching', '珊瑚白化'], cam: [-18, 150, 3.4], items: ['reef'],
        marks: [mk([-18.3, 147.7], 'Great Barrier Reef', '大堡礁', { big: true, c: C.pink, t: 0.6 })],
        body: ['Corals get their food and colour from tiny algae living inside them. When the sea stays too warm for weeks, corals push the algae out and turn white: coral bleaching. If the heat lasts, they starve and die. The Great Barrier Reef has suffered five mass bleachings since 2016, and in 2023–2025 bleaching hit reefs in over 80 countries. The oceans are also becoming more acidic as they absorb CO2, which makes it harder for corals and shellfish to build their skeletons.',
          '珊瑚体内生活着微小的藻类，为珊瑚提供养料和颜色。海水连续几周过热，珊瑚就会把藻类排出，变成白色，这就是珊瑚白化。高温持续下去，珊瑚就会饿死。2016 年以来，大堡礁已经发生了五次大规模白化；2023—2025 年，全球 80 多个国家的珊瑚礁都出现了白化。海洋吸收二氧化碳后还会变得更酸，使珊瑚和贝类更难形成骨骼和外壳。'],
      },
      {
        title: ['Cutting emissions: mitigation', '减缓：减少排放'], cam: [30, 100, 4.6], items: ['windmill'],
        fig: { k: 'key', set: 'custom', title: ['Mitigation: cut greenhouse gases', '减缓：减少温室气体'], items: [
          { c: C.gold, name: ['Clean energy: solar, wind, water, nuclear', '清洁能源：太阳能、风能、水能、核能'] },
          { c: C.teal, name: ['Save energy: efficient buildings, electric transport', '节约能源：节能建筑、电动交通'] },
          { c: C.green, name: ['Protect and plant forests to absorb CO2', '保护森林、植树造林，吸收二氧化碳'] },
          { c: C.violet, name: ['Everyday choices: walk, cycle, waste less', '日常行动：步行、骑车、减少浪费'] },
        ] },
        marks: [mk([48.9, 2.3], 'Paris Agreement, 2015', '《巴黎协定》，2015 年', { dot: true, c: C.gold, t: 0.6 }), mk([39.9, 116.4], 'China: carbon peak before 2030, neutral before 2060', '中国：2030 年前碳达峰，2060 年前碳中和', { dot: true, c: C.red, t: 1.2 })],
        body: ['Mitigation means cutting greenhouse gases at their source or taking them back out of the air: clean energy from the Sun and wind, efficient buildings and electric cars, and protecting and planting forests. In the 2015 Paris Agreement, almost every country agreed to keep warming well below 2 °C and to try to hold it to 1.5 °C. China aims to peak its CO2 emissions before 2030 and reach carbon neutrality before 2060; it now has more wind and solar power than any other country, and its Three-North shelterbelt has planted forests across the north. You can help too: save energy, walk or cycle, and waste less.',
          '减缓就是从源头减少温室气体排放，或把它们从大气中吸收回来：利用太阳能、风能等清洁能源，发展节能建筑和电动汽车，保护森林、植树造林。在 2015 年的《巴黎协定》中，几乎所有国家都同意把升温控制在 2 °C 以内，并努力限制在 1.5 °C 以内。我国提出二氧化碳排放力争 2030 年前达到峰值、2060 年前实现碳中和；我国的风电和光伏装机容量居世界第一，“三北”防护林工程也在北方大规模植树造林。我们也可以出一份力：节约能源、步行或骑车出行、减少浪费。'],
      },
      {
        title: ['Living with change: adaptation', '适应：应对变化'], cam: [28, 60, 5], sketch: true,
        fig: { k: 'key', set: 'custom', title: ['Adaptation: prepare for change', '适应：为变化做准备'], items: [
          { c: C.blue, name: ['Sea walls, storm barriers, raised islands', '海堤、风暴潮闸、人工加高岛屿'] },
          { c: C.teal, name: ['Sponge cities that soak up storm water', '能吸收雨水的海绵城市'] },
          { c: C.lime, name: ['Drought-resistant crops, saving water', '培育耐旱作物、节约用水'] },
          { c: C.orange, name: ['Heatwave and flood warnings', '高温和洪水预警'] },
        ] },
        marks: [mk([51.65, 3.7], 'Netherlands: Delta Works storm barriers', '荷兰：三角洲工程防潮闸', { dot: true, c: C.blue, t: 0.6 }), mk([4.22, 73.54], 'Maldives: Hulhumalé, a raised island', '马尔代夫：人工加高的胡鲁马累岛', { dot: true, c: C.blue, t: 1 }), mk([30.6, 114.3], 'Wuhan: a sponge city', '武汉：海绵城市', { dot: true, c: C.teal, t: 1.4 })],
        body: ['Even if emissions fall fast, some change is already locked in, so people must also adapt. A quarter of the Netherlands lies below sea level, so after a deadly flood in 1953 it built the Delta Works, giant dams and storm barriers. The Maldives has built Hulhumalé, a new island raised about 2 m above the sea. Chinese cities such as Wuhan and Shenzhen are becoming "sponge cities", with green roofs, wetlands and permeable pavements that soak up heavy rain. Farmers grow drought-resistant crops, and early warnings save lives in heatwaves and floods.',
          '即使排放迅速减少，一些变化也已无法避免，所以人们还必须适应。荷兰约四分之一的国土低于海平面，1953 年大洪水后修建了三角洲工程，包括巨大的水坝和防潮闸。马尔代夫建造了胡鲁马累岛，这是一座高出海面约 2 米的人工岛。武汉、深圳等我国城市正在建设“海绵城市”，用屋顶绿化、湿地和透水铺装吸收暴雨。农民种植耐旱作物，高温和洪水预警能挽救生命。'],
      },
    ],
    quiz: [
      { q: ['The main cause of today\'s global warming is…', '当今全球变暖的主要原因是'], options: [['Burning fossil fuels', '大量燃烧化石燃料'], ['Volcanoes', '火山喷发'], ['The Earth getting closer to the Sun', '地球离太阳越来越近'], ['Too many clouds', '云太多']], answer: 0,
        why: ['Coal, oil and gas release CO2, which traps heat. Volcanoes and the Earth\'s orbit change too slowly or too little to explain the rapid rise since 1850.', '燃烧煤、石油和天然气释放二氧化碳，留住更多热量。火山和地球轨道的变化太慢、太小，无法解释 1850 年以来的快速升温。'] },
      { q: ['CO2 rose from about 280 ppm before industry to about 420 ppm in 2023. By about what percentage did it rise?', '二氧化碳浓度从工业革命前的约 280 ppm 上升到 2023 年的约 420 ppm，约增加了百分之几？'],
        fig: { k: 'line', title: ['CO2 in the air (approx.)', '大气中的二氧化碳浓度（约）'], unit: ['ppm', 'ppm'], min: 260, max: 440, x: [1850, 1958, 1980, 2000, 2010, 2020, 2023], series: [{ name: ['CO2', '二氧化碳'], c: C.red, y: [280, 315, 339, 370, 390, 414, 420] }] },
        num: { answer: 50, tol: 3, unit: ['%', '%'] },
        why: ['(420 − 280) ÷ 280 = 0.5, so about 50% more, mostly from burning coal, oil and gas.', '（420 − 280）÷ 280 = 0.5，约增加了 50%，主要来自燃烧煤、石油和天然气。'] },
      { q: ['Put the steps of the greenhouse effect in order.', '把温室效应的过程排序。'],
        order: [['Sunlight passes through the air', '太阳光穿过大气'], ['The ground is warmed and gives off heat', '地面增温，向外放出热量'], ['Greenhouse gases absorb the heat', '温室气体吸收这些热量'], ['Some heat is sent back down, keeping the air near the ground warm', '一部分热量返回地面，使近地面保持温暖']],
        why: ['Sunlight warms the ground; the ground gives off heat; greenhouse gases trap part of it and send it back down. More gases trap more heat.', '太阳光使地面增温，地面向外放出热量，温室气体吸收其中一部分并返还给地面。温室气体越多，截留的热量越多。'] },
      { q: ['Match each piece of evidence to what has been measured.', '把全球变暖的证据和测量结果连起来。'],
        match: [[['Global temperature', '全球平均气温'], ['About 1.2 °C warmer than 1850–1900', '比 1850—1900 年升高约 1.2 °C']], [['CO2 in the air', '大气中的二氧化碳'], ['About 425 ppm, highest in 800,000 years', '约 425 ppm，80 万年来最高']], [['Arctic sea ice in September', '9 月北冰洋海冰'], ['About 40% less than in 1979', '比 1979 年减少约 40%']], [['Sea level', '海平面'], ['About 20 cm higher than in 1900', '比 1900 年高约 20 厘米']]],
        why: ['Thermometers, Mauna Loa and ice cores, satellites and tide gauges all tell the same story: the planet is warming because of more greenhouse gases.', '温度计、冒纳罗亚观测站和冰芯、卫星、验潮站的测量都说明了同一件事：温室气体增多使地球变暖。'] },
      { q: ['Which of these are mitigation (cutting greenhouse gases)? Pick all that apply.', '下列做法中，属于减缓（减少温室气体排放）的有（多选）'],
        options: [['Using solar and wind power', '利用太阳能和风能'], ['Planting forests', '植树造林'], ['Saving electricity', '节约用电'], ['Building higher sea walls', '加高海堤'], ['Growing drought-resistant crops', '种植耐旱作物']], multi: [0, 1, 2],
        why: ['Clean energy and saving power cut emissions, and forests take in CO2. Sea walls and drought-resistant crops are adaptation: they prepare for change.', '清洁能源、节约用电能减少排放，森林能吸收二氧化碳；加高海堤和种植耐旱作物属于适应，是为应对已经发生的变化做准备。'] },
      { q: ['Which of these is ADAPTATION to climate change?', '下列做法中，属于适应气候变化的是'], options: [['Building a sponge city to soak up storm water', '建设能吸收暴雨的海绵城市'], ['Switching from coal to wind power', '用风电代替燃煤发电'], ['Driving electric cars', '驾驶电动汽车'], ['Planting forests to absorb CO2', '植树造林吸收二氧化碳']], answer: 0,
        why: ['A sponge city prepares for heavier downpours that warming brings. The other three cut or absorb greenhouse gases, so they are mitigation.', '海绵城市是为应对变暖带来的更强暴雨做准备；其余三项是减少或吸收温室气体，属于减缓。'] },
      { q: ['Read the chart. About how many times as much CO2 does an average American emit as an average Indian?', '读图：美国人均二氧化碳排放量约是印度的多少倍？'],
        fig: { k: 'bars', title: ['CO2 emitted per person, 2023 (approx.)', '人均二氧化碳排放量，2023 年（约）'], unit: ['tonnes per year', '吨/年'], rows: [
          { name: ['USA', '美国'], v: 14.3, c: C.orange }, { name: ['China', '中国'], v: 8.4, c: C.red }, { name: ['Germany', '德国'], v: 7.1, c: C.gold }, { name: ['World', '世界平均'], v: 4.7, c: C.teal }, { name: ['India', '印度'], v: 2.1, c: C.lime }] },
        num: { answer: 6.8, tol: 0.4, unit: ['times', '倍'] },
        why: ['14.3 ÷ 2.1 ≈ 6.8. Totals and per-person figures tell different stories: India is the third-largest emitter in total, yet each Indian emits less than half the world average. That is why fairness matters in climate deals.', '14.3 ÷ 2.1 ≈ 6.8。排放总量和人均排放量反映的情况不同：印度排放总量居世界第三，人均却不到世界平均的一半。所以气候谈判要讲公平。'] },
      { q: ['Low islands here could be flooded by rising seas. Find the Maldives.', '海平面上升可能淹没这里的低平岛屿。在地球上点出马尔代夫。'], at: [3.2, 73.2], tolKm: 600,
        why: ['The Maldives lie in the Indian Ocean, south-west of India; most of its islands are less than 1.5 m above the sea.', '马尔代夫位于印度洋，印度的西南方，大部分岛屿海拔不到 1.5 米。'] },
    ],
  },
];
