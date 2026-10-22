/** 七上 · 天气与气候: weather, the world's climate types, biomes and climate change. */
import { C, T, arrows, mk, par, type Lesson } from './kit.ts';
import type { Line } from './stage.ts';

const unit = ['Weather and climate', '天气与气候'] as const;

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
    id: 'weather', strand: 'climate', grade: 'g7a', tracks: ['us', 'uk', 'ib'], unit, icon: 'cloud', minutes: 7,
    title: ['Weather, wind and air', '多变的天气'],
    blurb: ['Read weather symbols and air quality, then see the great wind belts that blow around the planet.', '认识天气符号和空气质量，再看看环绕地球的气压带和风带。'],
    keys: [
      ['Weather is the state of the air at a place over a short time; it changes quickly.', '天气是一个地方短时间里的大气状况，变化很快。'],
      ['Weather maps use symbols for sunny, cloudy, rain, snow, thunderstorms and wind.', '天气图用符号表示晴、阴、雨、雪、雷雨和风。'],
      ['The lower the air quality index, the cleaner the air.', '空气质量指数越小，空气质量越好。'],
      ['Trade winds and westerlies blow in belts; monsoons reverse with the seasons.', '信风和西风呈带状分布；季风随季节转换方向。'],
    ],
    steps: [
      {
        title: ['Weather symbols', '常用天气符号'], cam: [32, 112, 3.4], names: true, fig: { k: 'dia', id: 'weather' },
        marks: [
          mk([39.9, 116.4], 'Beijing: sunny', '北京：晴', { dot: true, c: C.gold, t: 0.3 }),
          mk([31.2, 121.5], 'Shanghai: rain', '上海：雨', { dot: true, c: C.blue, t: 0.6 }),
          mk([45.8, 126.6], 'Harbin: snow', '哈尔滨：雪', { dot: true, c: C.white, t: 0.9 }),
          mk([23.1, 113.3], 'Guangzhou: thunderstorm', '广州：雷雨', { dot: true, c: C.violet, t: 1.2 }),
          mk([30.6, 104.1], 'Chengdu: cloudy', '成都：阴', { dot: true, c: C.ice, t: 1.5 }),
        ],
        body: ['Weather is what the air is doing at one place over a short time: sunny now, rain this afternoon. TV forecasts and weather maps use simple symbols: a sun for sunny, a cloud for cloudy, raindrops, snowflakes, and a lightning bolt for thunderstorms.',
          '天气是一个地方短时间里的阴晴、风雨、冷热等大气状况，变化很快：现在晴，下午可能下雨。天气预报和天气图用简单的符号表示：太阳表示晴，云朵表示阴，还有雨滴、雪花，闪电表示雷雨。'],
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
        title: ['Air quality', '空气质量'], cam: [38, 108, 3.6], sketch: true,
        fig: { k: 'key', set: 'custom', title: ['Air quality index (AQI)', '空气质量指数'], items: [
          { c: '#40c057', name: ['0–50 Good', '0–50 优'] }, { c: '#fcc419', name: ['51–100 Moderate', '51–100 良'] },
          { c: '#ff922b', name: ['101–150 Light pollution', '101–150 轻度污染'] }, { c: '#fa5252', name: ['151–200 Moderate pollution', '151–200 中度污染'] },
          { c: '#9c36b5', name: ['201–300 Heavy pollution', '201–300 重度污染'] }, { c: '#862e2e', name: ['300+ Severe pollution', '300 以上 严重污染'] },
        ] },
        lines: arrows([[[43, 103], [41, 111], [40, 116]], [[41, 96], [38, 106], [36, 113]]], C.brown, 0.6, 2),
        marks: [mk([42, 102], 'Dust from the deserts', '沙尘来自荒漠', { c: C.brown, t: 0.8 }), mk([39.9, 116.4], 'Beijing', '北京', { dot: true, c: C.gold, t: 1.4 })],
        body: ['Forecasts also report the air quality index (AQI). The smaller the number, the cleaner the air: 0–50 is good. Exhaust from cars, smoke from factories and burning coal, and dust storms in spring make it worse. Planting trees, clean energy and public transport make it better.',
          '天气预报还会发布空气质量指数。指数越小，空气质量越好，0–50 为优。汽车尾气、工厂废气、燃煤和春季的沙尘天气会使空气质量变差；植树造林、使用清洁能源、乘坐公共交通可以改善空气质量。'],
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
        body: ['The Sun heats the equator most, so air there rises, leaving low pressure and lots of rain. The air sinks again around 30° north and south, making belts of high pressure where the great deserts lie. Another low lies near 60°, and high pressure sits over the poles.',
          '赤道附近受热最多，空气膨胀上升，形成赤道低气压带，多雨；上升的空气在南北纬 30° 附近下沉，形成副热带高气压带，那里分布着大沙漠。南北纬 60° 附近是副极地低气压带，两极是极地高气压带。'],
      },
      {
        title: ['Trade winds and westerlies', '信风带和西风带'], cam: [10, -30, 4.8], sketch: true,
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
        title: ['Sea breezes and monsoons', '海陆风与季风'], cam: [22, 100, 4], sketch: true, items: ['an_tiger'],
        lines: [
          ...arrows([[[5, 65], [18, 74]], [[6, 85], [20, 88]], [[10, 112], [24, 113]], [[18, 130], [30, 120]]], C.teal, 0.3, 2.2),
          ...arrows([[[45, 95], [32, 80], [22, 76]], [[50, 112], [38, 116], [26, 115]], [[30, 92], [16, 88]]], C.ice, 2.4, 2.2),
        ],
        marks: [mk([12, 70], 'Summer: wet wind from the sea', '夏季：湿润的风从海洋吹来', { c: C.teal, t: 0.8 }), mk([44, 100], 'Winter: dry wind from the land', '冬季：干冷的风从陆地吹来', { c: C.ice, t: 2.8 }), mk([19.1, 72.9], 'Mumbai', '孟买', { dot: true, c: C.gold, t: 1.2 })],
        body: ['Land heats up and cools down faster than the sea. On a sunny day a cool sea breeze blows onto the beach; at night a land breeze blows out to sea. Across a whole continent the same thing happens with the seasons: in summer wet winds blow in from the ocean and bring the monsoon rains, in winter dry winds blow out from the cold land.',
          '陆地比海洋升温快、降温也快。晴天的白天，凉爽的海风吹向陆地；夜晚，陆风吹向海洋。在大陆和大洋之间，同样的事情随季节发生：夏季，湿润的风从海洋吹向陆地，带来季风降水；冬季，干冷的风从陆地吹向海洋。这就是季风。'],
      },
    ],
    quiz: [
      { q: ['A "north wind" blows…', '“北风”是指'], options: [['From the north', '从北方吹来的风'], ['Towards the north', '吹向北方的风'], ['Only at the North Pole', '只在北极刮的风'], ['From the sea', '从海上吹来的风']], answer: 0,
        why: ['Wind direction always names where the wind comes from.', '风向指的是风吹来的方向。'] },
      { q: ['Which AQI value means the cleanest air?', '下面哪个空气质量指数表示空气最好'], options: [['35', '指数 35'], ['120', '指数 120'], ['180', '指数 180'], ['320', '指数 320']], answer: 0,
        why: ['0–50 is "good": the lower the index, the cleaner the air.', '0–50 为优，指数越小，空气质量越好。'] },
      { q: ['North of the equator, the trade winds blow from the…', '北半球的信风是'], options: [['North-east', '东北信风'], ['South-west', '西南风'], ['West', '西风'], ['North-west', '西北风']], answer: 0,
        why: ['Air flows from the subtropical high towards the equator and is bent to the right.', '空气从副热带高气压带吹向赤道，在北半球向右偏，成为东北信风。'] },
      { q: ['In summer the monsoon brings heavy rain to this city. Find Mumbai.', '夏季风给这座城市带来大量降水。在地球上点出孟买。'], at: [19.1, 72.9], tolKm: 500,
        why: ['Mumbai is on India\'s west coast, facing the wet south-west monsoon.', '孟买位于印度西海岸，迎着湿润的西南季风。'] },
    ],
  },
  {
    id: 'climates', strand: 'climate', grade: 'g7a', tracks: ['uk', 'us', 'ib', 'au'], unit, icon: 'globe', minutes: 6,
    title: ['World climates: the tropics', '世界的气候类型（一）：热带'],
    blurb: ['The world climate map, then the four tropical climates and their climate graphs.', '认识世界气候类型分布图，再读懂四种热带气候和它们的气候图。'],
    keys: [
      ['Climate is the long-term pattern of temperature and rainfall at a place.', '气候是一个地方多年的天气平均状况，主要看气温和降水。'],
      ['Tropical climates are hot all year; they differ in how much rain falls and when.', '热带气候终年炎热，区别主要在降水的多少和季节分配。'],
      ['Rainforest: wet all year. Monsoon and savanna: a wet and a dry season. Desert: dry all year.', '热带雨林气候全年多雨；热带季风和热带草原气候分旱、雨两季；热带沙漠气候终年干燥。'],
    ],
    steps: [
      {
        title: ['The world climate map', '世界气候类型分布图'], cam: [15, 30, 4.8], sketch: true,
        paint: [{ fill: { k: 'climate' }, a: 0.6 }], fig: { k: 'key', set: 'climate' },
        body: ['Each colour is a climate type: places with a similar pattern of temperature and rainfall through the year. The types sit in rough belts by latitude, but coasts, inland areas and mountains change the pattern. This map is a simplified sketch.',
          '每种颜色代表一种气候类型，即一年中气温和降水变化特点相似的地区。气候类型大致按纬度呈带状分布，但沿海、内陆和高山会改变它们的分布。这是一幅简化的示意图。'],
      },
      {
        title: ['Tropical rainforest', '热带雨林气候'], cam: [0, 100, 4], sketch: true, items: ['marinabay', 'pl_kapok'],
        paint: [{ fill: { k: 'climate', only: ['rainforest'] }, a: 0.65 }], fig: { k: 'climo', city: 'singapore' },
        marks: [mk([1.35, 103.8], 'Singapore', '新加坡', { dot: true, c: C.green, t: 0.6 }), mk([-3, -60], 'Amazon', '亚马孙平原', { c: C.green, t: 1 }), mk([0, 22], 'Congo Basin', '刚果盆地', { c: C.green, t: 1.3 })],
        body: ['Near the equator it is hot all year (about 27 °C every month) and it rains almost every afternoon, over 2,000 mm a year. Look at Singapore\'s graph: a flat temperature line and tall rain bars in every month. The Amazon, the Congo Basin and the islands of South-east Asia have this climate.',
          '赤道附近终年高温（每月约 27 °C），几乎每天午后都有雷阵雨，年降水量在 2000 毫米以上。看新加坡的气候图：气温曲线很平，每个月的降水柱都很高。亚马孙平原、刚果盆地和东南亚的群岛属于这种气候。'],
      },
      {
        title: ['Tropical monsoon', '热带季风气候'], cam: [18, 90, 3.8], sketch: true, items: ['an_tiger'],
        paint: [{ fill: { k: 'climate', only: ['tmonsoon'] }, a: 0.65 }], fig: { k: 'climo', city: 'mumbai' },
        lines: arrows([[[5, 62], [16, 72]], [[6, 82], [18, 88]], [[6, 100], [18, 104]]], C.teal, 0.4, 2),
        marks: [mk([19.1, 72.9], 'Mumbai', '孟买', { dot: true, c: C.lime, t: 0.6 })],
        body: ['In the Indian Peninsula and the Indochina Peninsula it is hot all year, but the rain comes in one season. From June to September the wet south-west monsoon pours rain on Mumbai; from November to April almost none falls. So there is a rainy season and a dry season.',
          '印度半岛和中南半岛终年高温，但降水集中在一个季节。6 月到 9 月，湿润的西南季风给孟买带来大量降水；11 月到次年 4 月几乎不下雨。所以一年分为雨季和旱季。'],
      },
      {
        title: ['Tropical savanna', '热带草原气候'], cam: [-10, 80, 4.8], sketch: true, items: ['an_giraffe', 'an_zebra'],
        paint: [{ fill: { k: 'climate', only: ['savanna'] }, a: 0.65 }], fig: { k: 'climo', city: 'darwin' },
        marks: [mk([-12.5, 130.8], 'Darwin', '达尔文', { dot: true, c: C.gold, t: 0.6 }), mk([-3, 35], 'East African savanna', '东非高原草原', { c: C.gold, t: 1 })],
        body: ['On both sides of the rainforest lie the savannas: hot all year, with a wet season and a long dry season. Darwin in northern Australia gets heavy rain from December to March (summer there) and almost nothing from May to September. Big areas of Africa and Brazil are savanna too.',
          '热带雨林的南北两侧是热带草原气候：终年高温，分明显的湿季和较长的干季。澳大利亚北部的达尔文在 12 月到次年 3 月（那里的夏季）降水很多，5 月到 9 月几乎无雨。非洲和巴西也有大片热带草原。'],
      },
      {
        title: ['Tropical desert', '热带沙漠气候'], cam: [24, 20, 4.4], sketch: true, items: ['pyramids', 'an_camel'],
        paint: [{ fill: { k: 'climate', only: ['desert'] }, a: 0.65 }], fig: { k: 'climo', city: 'cairo' }, lines: TROPICS,
        marks: [mk([30.0, 31.2], 'Cairo', '开罗', { dot: true, c: C.orange, t: 0.6 }), mk([23, 5], 'Sahara', '撒哈拉沙漠', { big: true, c: C.orange, t: 1 })],
        body: ['Around the tropics, under the subtropical high, sinking air stays dry. Cairo gets about 25 mm of rain in a whole year: its rain bars almost vanish. Summers are very hot and nights can be cold. The Sahara, Arabia and inland Australia are hot deserts.',
          '南北回归线附近受副热带高气压带控制，空气下沉，干燥少雨。开罗全年降水只有约 25 毫米，气候图上几乎看不到降水柱。夏季炎热，昼夜温差大。撒哈拉沙漠、阿拉伯半岛和澳大利亚中西部属于热带沙漠气候。'],
      },
    ],
    quiz: [
      { q: ['Which climate is this?', '这是哪种气候类型？'], fig: { k: 'climo', city: 'cairo', blind: true },
        options: [['Tropical desert', '热带沙漠气候'], ['Tropical rainforest', '热带雨林气候'], ['Tropical monsoon', '热带季风气候'], ['Tropical savanna', '热带草原气候']], answer: 0,
        why: ['Warm to hot all year and almost no rain at all.', '全年气温较高，几乎没有降水。'] },
      { q: ['Hot and wet all year is the…', '终年高温多雨的是'], options: [['Tropical rainforest climate', '热带雨林气候'], ['Tropical savanna climate', '热带草原气候'], ['Tropical desert climate', '热带沙漠气候'], ['Mediterranean climate', '地中海气候']], answer: 0,
        why: ['Near the equator the air rises and rains almost every day.', '赤道附近空气上升，几乎天天下雨。'] },
      { q: ['Mumbai has a rainy season because of…', '孟买有明显的雨季，是因为'], options: [['The summer monsoon from the ocean', '来自海洋的夏季风'], ['Cold ocean currents', '寒流'], ['High mountains around it', '四周高山环绕'], ['Being on the equator', '位于赤道上']], answer: 0,
        why: ['In summer the south-west monsoon carries wet ocean air onto India.', '夏季，西南季风把海洋上的湿润空气带到印度。'] },
      { q: ['Singapore has a tropical rainforest climate. Find it.', '新加坡是热带雨林气候。在地球上点出新加坡。'], at: [1.35, 103.8], tolKm: 400,
        why: ['Singapore is at the tip of the Malay Peninsula, just north of the equator.', '新加坡在马来半岛南端，紧挨着赤道。'] },
    ],
  },
  {
    id: 'climates2', strand: 'climate', grade: 'g7a', tracks: ['uk', 'us', 'ib'], unit, icon: 'globe', minutes: 7,
    title: ['World climates: temperate, cold and highland', '世界的气候类型（二）'],
    blurb: ['Read and compare climate graphs, meet the climates outside the tropics, and find out what shapes them.', '学会阅读和比较气候图，认识热带以外的气候类型和影响气候的因素。'],
    keys: [
      ['A climate graph shows monthly temperature (line) and rainfall (bars).', '气候图用曲线表示各月气温，用柱状表示各月降水量。'],
      ['Monsoon climates: rain in summer. Mediterranean: rain in winter. Maritime: mild and wet all year.', '季风气候夏季多雨；地中海气候冬季多雨；温带海洋性气候全年温和多雨。'],
      ['Climate is shaped by latitude, land and sea, terrain and altitude, and ocean currents.', '影响气候的主要因素有纬度位置、海陆位置、地形地势和洋流。'],
    ],
    steps: [
      {
        title: ['Reading a climate graph', '怎样读气候图'], cam: [35, 70, 4.6], sketch: true, items: ['cn_bund', 'rialto'],
        paint: [{ fill: { k: 'climate', only: ['smonsoon', 'med'] }, a: 0.65 }], fig: { k: 'climo', city: 'shanghai', b: 'rome' },
        marks: [mk([31.2, 121.5], 'Shanghai: subtropical monsoon', '上海：亚热带季风气候', { dot: true, c: C.teal, t: 0.6 }), mk([41.9, 12.5], 'Rome: Mediterranean', '罗马：地中海气候', { dot: true, c: C.pink, t: 1 })],
        body: ['The line is the temperature of each month, the bars are the rain. Shanghai and Rome are at similar latitudes and both have hot summers and mild winters. But Shanghai\'s rain bars are tallest in summer (hot and wet together), while Rome\'s summer is dry and its rain comes in winter.',
          '气候图中的曲线表示各月气温，柱状表示各月降水量。上海和罗马纬度相近，都是夏季炎热、冬季温和。但上海夏季降水柱最高，雨热同期；罗马夏季炎热干燥，降水集中在冬季。'],
      },
      {
        title: ['West coast and east coast', '大陆西岸和东岸'], cam: [48, 55, 4.8], sketch: true, items: ['bigben', 'forbidden'],
        paint: [{ fill: { k: 'climate', only: ['maritime', 'tmonsoon2'] }, a: 0.65 }], fig: { k: 'climo', city: 'london', b: 'beijing' },
        marks: [mk([51.5, -0.1], 'London: temperate maritime', '伦敦：温带海洋性气候', { dot: true, c: C.blue, t: 0.6 }), mk([39.9, 116.4], 'Beijing: temperate monsoon', '北京：温带季风气候', { dot: true, c: C.teal, t: 1 })],
        body: ['On the west coast of Europe, westerly winds from the Atlantic keep London mild and damp all year: no month is very hot or very cold, and it rains a little every month. On the east side of Asia, Beijing has a temperate monsoon climate: hot, rainy summers and cold, dry winters.',
          '欧洲西部受来自大西洋的西风影响，伦敦全年温和湿润，冬无严寒、夏无酷暑，各月降水比较均匀，属于温带海洋性气候。亚洲东部的北京属于温带季风气候：夏季高温多雨，冬季寒冷干燥。'],
      },
      {
        title: ['Deep inside the continents', '大陆内部'], cam: [48, 70, 4.4], sketch: true, items: ['kremlin', 'an_saiga'],
        paint: [{ fill: { k: 'climate', only: ['continental'] }, a: 0.65 }], fig: { k: 'climo', city: 'moscow', b: 'urumqi' },
        marks: [mk([55.8, 37.6], 'Moscow', '莫斯科', { dot: true, c: C.gold, t: 0.6 }), mk([43.8, 87.6], 'Ürümqi', '乌鲁木齐', { dot: true, c: C.gold, t: 1 })],
        body: ['Far from the sea, winters are cold and summers warm, and the range between them is large. Rainfall is low, and it gets drier the farther inland you go: Moscow gets about 700 mm a year, Ürümqi only about 300 mm. This is the temperate continental climate.',
          '远离海洋的大陆内部，冬季寒冷，夏季温暖，气温年较差大；降水较少，越往内陆越干旱：莫斯科年降水量约 700 毫米，乌鲁木齐只有约 300 毫米。这就是温带大陆性气候。'],
      },
      {
        title: ['Cold climates', '寒冷的气候'], cam: [68, 100, 4.2], sketch: true, items: ['an_reindeer', 'an_polarbear'],
        paint: [{ fill: { k: 'climate', only: ['subarctic', 'tundra', 'icecap'] }, a: 0.65 }], fig: { k: 'climo', city: 'yakutsk', b: 'utqiagvik' },
        marks: [mk([62.0, 129.7], 'Yakutsk: subarctic', '雅库茨克：亚寒带针叶林气候', { dot: true, c: C.violet, t: 0.6 }), mk([71.3, -156.8], 'Utqiaġvik: tundra', '乌特恰维克：苔原气候', { dot: true, c: C.ice, t: 1 }), mk([75, -40], 'Greenland: ice cap', '格陵兰岛：冰原气候', { c: C.white, t: 1.4 })],
        body: ['Across northern Russia and Canada the subarctic climate has long, bitter winters (Yakutsk averages −38 °C in January) and short, warm summers. Nearer the Arctic Ocean the tundra stays below 5 °C even in July. On Greenland and Antarctica the ice cap climate is below freezing all year.',
          '俄罗斯北部和加拿大北部是亚寒带针叶林气候，冬季漫长严寒（雅库茨克 1 月平均约 −38 °C），夏季短暂温暖。靠近北冰洋的苔原气候，7 月气温也不到 5 °C。格陵兰岛和南极洲是冰原气候，终年严寒，各月气温都在 0 °C 以下。'],
      },
      {
        title: ['Highland climate', '高原山地气候'], cam: [32, 88, 3.4], sketch: true, items: ['potala', 'an_yak'],
        paint: [{ fill: { k: 'climate', only: ['highland'] }, a: 0.65 }], fig: { k: 'climo', city: 'lhasa' },
        marks: [mk([29.65, 91.1], 'Lhasa, 3,650 m', '拉萨，海拔 3650 米', { dot: true, c: C.brown, t: 0.6 }), mk([-15, -70], 'Andes', '安第斯山脉', { c: C.brown, t: 1 })],
        body: ['Temperature falls about 0.6 °C for every 100 m you climb. Lhasa is at a lower latitude than Beijing, but at 3,650 m its summer is only about 16 °C. High plateaus and mountains like the Tibetan Plateau and the Andes have their own highland climate, cool and sunny, changing with height.',
          '海拔每升高 100 米，气温约下降 0.6 °C。拉萨的纬度比北京低，但海拔约 3650 米，夏季平均气温只有约 16 °C。青藏高原、安第斯山脉等高原和高山地区是高原山地气候，气温低、日照强，并随海拔高度变化。'],
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
        body: ['Latitude sets how much sunshine a place gets. Sea–land position matters too: London and Moscow are at similar latitudes, but London, near the sea, is about 11 °C warmer in January. Terrain and altitude make mountains cooler, and ocean currents like the warm Gulf Stream heat the coasts they wash.',
          '纬度位置决定一个地方获得太阳热量的多少。海陆位置也很重要：伦敦和莫斯科纬度相近，但靠近海洋的伦敦 1 月平均气温比莫斯科高约 11 °C。地形和地势使高山更凉爽；洋流也会影响沿岸气候，墨西哥湾暖流让欧洲西部更加温暖。'],
      },
    ],
    quiz: [
      { q: ['Which climate is this?', '这是哪种气候类型？'], fig: { k: 'climo', city: 'rome', blind: true },
        options: [['Mediterranean', '地中海气候'], ['Subtropical monsoon', '亚热带季风气候'], ['Temperate maritime', '温带海洋性气候'], ['Tropical desert', '热带沙漠气候']], answer: 0,
        why: ['Hot, dry summers and mild, rainy winters.', '夏季炎热干燥，冬季温和多雨。'] },
      { q: ['Which climate is this?', '这是哪种气候类型？'], fig: { k: 'climo', city: 'beijing', blind: true },
        options: [['Temperate monsoon', '温带季风气候'], ['Temperate maritime', '温带海洋性气候'], ['Tropical monsoon', '热带季风气候'], ['Polar tundra', '极地苔原气候']], answer: 0,
        why: ['Winter below 0 °C and summer hot and rainy: temperate monsoon.', '冬季气温低于 0 °C，夏季高温多雨，是温带季风气候。'] },
      { q: ['London is much milder in winter than Moscow mainly because of…', '伦敦冬季比莫斯科温和得多，主要原因是'], options: [['Sea–land position', '海陆位置'], ['Latitude', '纬度位置'], ['Altitude', '海拔高度'], ['Air pollution', '空气污染']], answer: 0,
        why: ['They are at similar latitudes, but London is near the Atlantic and the warm Gulf Stream.', '两地纬度相近，但伦敦靠近大西洋，还受暖流影响。'] },
      { q: ['Lhasa is cool in summer though it is at a low latitude. Find Lhasa.', '拉萨纬度较低，夏季却很凉爽。在地球上点出拉萨。'], at: [29.65, 91.1], tolKm: 500,
        why: ['Lhasa is on the Tibetan Plateau, at about 3,650 m.', '拉萨位于青藏高原，海拔约 3650 米。'] },
    ],
  },
  {
    id: 'biomes', strand: 'climate', tracks: ['us', 'uk', 'ib', 'au'], unit, icon: 'leaf', minutes: 7,
    title: ['Biomes: climate and life', '气候与自然植被'],
    blurb: ['Each climate grows its own kind of vegetation, and its own animals. Tour the world\'s biomes.', '不同的气候孕育不同的自然植被和动物。一起游览世界的自然带。'],
    keys: [
      ['A biome is a large area with similar vegetation and animals, shaped by climate.', '自然带（生物群落）是植被和动物相似的大片地区，由气候决定。'],
      ['Heat and water decide what grows: forests where it is wet, grass where it is drier, desert where it is driest.', '热量和水分决定植被：湿润处是森林，较干处是草原，最干处是荒漠。'],
      ['Animals are adapted to their biome, like camels to the desert and reindeer to the cold.', '动物适应各自的环境，比如骆驼适应沙漠，驯鹿适应寒冷。'],
    ],
    steps: [
      {
        title: ['From climate to vegetation', '从气候到植被'], cam: [15, 20, 4.8], sketch: true,
        paint: [{ fill: { k: 'biome' }, a: 0.6 }], fig: { k: 'key', set: 'biome' },
        body: ['Plants need warmth and water. Hot and wet gives rainforest; hot with a dry season gives savanna; very dry gives desert; cool and dry gives grassland; long cold winters give conifer forest; and the coldest lands have only tundra and ice. Compare this map with the climate map: they match closely.',
          '植物生长需要热量和水分。高温多雨形成热带雨林；高温而有干季形成热带草原；极其干旱形成荒漠；温带较干形成温带草原；冬季漫长寒冷形成针叶林；最寒冷的地方只有苔原和冰原。把这幅图和气候图对比，它们非常相似。'],
      },
      {
        title: ['Tropical rainforest', '热带雨林'], cam: [-3, -62, 3.6], sketch: true, items: ['pl_kapok', 'an_jaguar', 'an_toucan', 'an_sloth', 'an_orangutan'],
        paint: [{ fill: { k: 'biome', only: ['rainforest'] }, a: 0.65 }], fig: { k: 'key', set: 'biome', only: ['rainforest'] },
        marks: [mk([-3.3, -60.6], 'Amazon rainforest', '亚马孙热带雨林', { big: true, c: C.green, t: 0.6 })],
        body: ['Constant heat and rain make the richest biome on Earth: giant kapok trees tower above layers of smaller trees and vines. Jaguars, toucans and slow sloths live in the Amazon; orangutans swing through the rainforests of Borneo. Rainforests cover a small part of the land but hold about half of all land species.',
          '终年高温多雨，造就了地球上物种最丰富的自然带：高大的木棉树（吉贝树）耸立在多层树木和藤本植物之上。亚马孙雨林里有美洲豹、巨嘴鸟和行动缓慢的树懒，加里曼丹岛的雨林里生活着猩猩。雨林只占陆地很小一部分，却拥有约一半的陆地物种。'],
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
        title: ['Taiga and tundra', '针叶林和苔原'], cam: [65, 40, 4.4], sketch: true, items: ['an_reindeer', 'mg_caribou', 'an_moose'],
        paint: [{ fill: { k: 'biome', only: ['taiga', 'tundra'] }, a: 0.65 }], fig: { k: 'key', set: 'biome', only: ['taiga', 'tundra'] },
        marks: [mk([60, 90], 'Taiga', '亚寒带针叶林', { big: true, c: C.green, t: 0.6 }), mk([70, 60], 'Tundra', '苔原', { big: true, c: C.ice, t: 1 })],
        body: ['South of the Arctic, a belt of conifer forest (the taiga) circles the globe across Russia, Scandinavia and Canada. Its needle-leaved trees survive long, snowy winters. Farther north, summers are too short and cold for trees: the tundra has only mosses, lichens and low shrubs. Reindeer migrate between the two.',
          '北极圈附近以南，一条亚寒带针叶林带横贯俄罗斯、北欧和加拿大，针叶树能熬过漫长多雪的冬季。再往北，夏季太短太冷，树木无法生长，苔原上只有苔藓、地衣和低矮的灌木。驯鹿在两者之间迁徙。'],
      },
    ],
    quiz: [
      { q: ['Hot all year with a long dry season gives…', '终年高温、有较长干季的地区，自然植被是'], options: [['Savanna', '热带草原'], ['Rainforest', '热带雨林'], ['Taiga', '亚寒带针叶林'], ['Tundra', '苔原']], answer: 0,
        why: ['Too dry for a closed forest, but warm enough for tall grass and scattered trees.', '对森林来说太干，但足够让高草和零星的树木生长。'] },
      { q: ['Which animal is adapted to the desert?', '下面哪种动物适应沙漠环境'], options: [['Fennec fox', '耳廓狐'], ['Reindeer', '驯鹿'], ['Sloth', '树懒'], ['Polar bear', '北极熊']], answer: 0,
        why: ['Its big ears give off heat and it hides in burrows by day.', '它用大耳朵散热，白天躲在洞里。'] },
      { q: ['Why do no trees grow in the tundra?', '苔原上为什么没有树木'], options: [['Summers are too short and cold', '夏季太短、太冷'], ['It rains too much', '降水太多'], ['It is too hot', '太热'], ['People cut them all down', '被人砍光了']], answer: 0,
        why: ['Only mosses, lichens and low shrubs can grow in such a short, cold summer.', '短暂寒冷的夏季只能长出苔藓、地衣和低矮灌木。'] },
      { q: ['Find the Amazon rainforest.', '在地球上点出亚马孙热带雨林。'], at: [-3.5, -62], tolKm: 1200,
        why: ['It covers the Amazon Basin in South America, along the equator.', '它覆盖南美洲赤道附近的亚马孙平原。'] },
    ],
  },
  {
    id: 'climatechange', strand: 'climate', tracks: ['uk', 'us', 'ib', 'au'], unit, icon: 'sun', minutes: 7,
    title: ['Climate change', '全球气候变暖'],
    blurb: ['How greenhouse gases warm the planet, what is changing, and what we can do.', '温室气体怎样使地球变暖，带来哪些变化，我们能做些什么。'],
    keys: [
      ['Greenhouse gases such as CO2 trap heat; burning fossil fuels adds more of them.', '二氧化碳等温室气体会留住热量，燃烧化石燃料使它们增多。'],
      ['CO2 has risen from about 280 ppm to over 420 ppm; the Earth is about 1.1–1.2 °C warmer.', '二氧化碳浓度从约 280 ppm 升到 420 ppm 以上，全球气温升高了约 1.1–1.2 °C。'],
      ['Ice is melting, seas are rising and coral reefs are bleaching.', '冰川融化、海平面上升、珊瑚白化。'],
      ['Mitigation cuts emissions; adaptation helps us live with the changes.', '减缓是减少排放，适应是学会应对已经发生的变化。'],
    ],
    steps: [
      {
        title: ['The greenhouse effect', '温室效应'], cam: [20, 100, 5], night: true, sun: true, fig: { k: 'dia', id: 'greenhouse' },
        clock: { mode: 'day', start: T.marchNoonChina, rate: 3 },
        body: ['Sunlight warms the ground, and the ground gives off heat. Gases such as carbon dioxide (CO2) and methane hold some of that heat in, like the glass of a greenhouse. Without them the Earth would average about −18 °C instead of 15 °C. But adding more of them traps more heat.',
          '太阳光使地面变暖，地面再向外放出热量。二氧化碳、甲烷等气体会留住其中一部分热量，就像温室的玻璃一样，这就是温室效应。没有它，地球平均气温将是约 −18 °C，而不是 15 °C。但温室气体越多，留住的热量也越多。'],
      },
      {
        title: ['More and more CO2', '越来越多的二氧化碳'], cam: [20, -150, 3.8],
        fig: { k: 'line', title: ['CO2 in the air (approx.)', '大气中的二氧化碳浓度（约）'], unit: ['ppm', 'ppm'], min: 260, max: 440,
          x: [1850, 1958, 1980, 2000, 2010, 2020, 2023],
          series: [{ name: ['CO2', '二氧化碳'], c: C.red, y: [280, 315, 340, 370, 390, 412, 420] }],
          notes: [{ x: 1850, text: ['Before industry', '工业革命前'] }, { x: 1958, text: ['Measuring starts', '开始测量'] }] },
        marks: [mk([19.5, -155.6], 'Mauna Loa: CO2 measured since 1958', '冒纳罗亚：1958 年起测量二氧化碳', { dot: true, c: C.red, t: 0.6 })],
        body: ['Before factories and cars, the air held about 280 parts per million (ppm) of CO2. Since 1958 it has been measured on Mauna Loa in Hawaii: 315 ppm then, about 420 ppm by 2023. Most of the rise comes from burning coal, oil and gas, and from cutting down forests.',
          '工业革命前，大气中的二氧化碳浓度约为 280 ppm（百万分之一）。从 1958 年起，夏威夷冒纳罗亚火山上一直在测量：当时是 315 ppm，到 2023 年约 420 ppm。增加的主要原因是燃烧煤、石油和天然气，以及砍伐森林。'],
      },
      {
        title: ['A warmer planet', '全球变暖'], cam: [30, 60, 4.8], sketch: true, sun: true,
        clock: { mode: 'year', start: T.julChina, rate: 0 }, paint: [{ fill: { k: 'temp' }, a: 0.55 }],
        fig: { k: 'line', title: ['Global warming since 1850–1900 (approx.)', '与 1850–1900 年相比的全球升温（约）'], unit: ['°C', '°C'], min: -0.2, max: 1.4,
          x: [1880, 1900, 1920, 1940, 1960, 1980, 2000, 2010, 2020],
          series: [{ name: ['Temperature rise', '升温幅度'], c: C.orange, y: [0, 0, 0.1, 0.3, 0.3, 0.4, 0.7, 0.9, 1.2] }] },
        body: ['With more greenhouse gases, the world has warmed by about 1.1–1.2 °C since the late 1800s, and the last ten years were the warmest on record. That sounds small, but it means more heatwaves, heavier downpours and longer droughts. Land and the Arctic warm faster than the average.',
          '随着温室气体增多，全球平均气温比 19 世纪后期升高了约 1.1–1.2 °C，最近十年是有记录以来最暖的十年。这个数字看起来不大，却意味着更多的热浪、更强的暴雨和更长的干旱。陆地和北极地区升温比平均更快。'],
      },
      {
        title: ['Melting ice, rising seas', '冰雪融化，海平面上升'], cam: [55, -20, 4.4], items: ['an_polarbear', 'an_walrus'],
        paint: [{ fill: { k: 'band', s: 75, n: 90, c: C.ice }, a: 0.45 }],
        marks: [
          mk([78, -30], 'Arctic sea ice is shrinking', '北冰洋海冰在减少', { big: true, c: C.ice, t: 0.4 }),
          mk([72, -40], 'Greenland ice sheet melting', '格陵兰冰盖融化', { c: C.white, t: 0.9 }),
          mk([4.2, 73.5], 'Maldives: islands about 1 m high', '马尔代夫：岛屿海拔约 1 米', { dot: true, c: C.blue, t: 1.4 }),
          mk([23.7, 90.4], 'Bangladesh: low delta', '孟加拉国：低平的三角洲', { dot: true, c: C.blue, t: 1.8 }),
        ],
        body: ['In September, Arctic sea ice now covers about 40% less ocean than in 1979, so polar bears have less ice to hunt seals from. Glaciers and the Greenland ice sheet are melting, and warmer water expands. The sea has risen about 20 cm since 1900, threatening low islands like the Maldives and delta lands like Bangladesh.',
          '如今 9 月北冰洋海冰的面积比 1979 年少了约 40%，北极熊可以用来捕猎海豹的冰面越来越少。高山冰川和格陵兰冰盖在融化，海水受热膨胀。1900 年以来海平面上升了约 20 厘米，威胁着马尔代夫这样的低平岛国和孟加拉国这样的三角洲地区。'],
      },
      {
        title: ['Coral bleaching', '珊瑚白化'], cam: [-18, 150, 3.4], items: ['reef'],
        marks: [mk([-18.3, 147.7], 'Great Barrier Reef', '大堡礁', { big: true, c: C.pink, t: 0.6 })],
        body: ['Corals get their food and colour from tiny algae living inside them. When the sea stays too warm for weeks, corals push the algae out and turn white: coral bleaching. If the heat lasts, they starve and die. The Great Barrier Reef has suffered several mass bleachings since 2016. The oceans are also becoming more acidic as they absorb CO2.',
          '珊瑚体内生活着微小的藻类，为珊瑚提供养料和颜色。海水连续几周过热，珊瑚就会把藻类排出，变成白色，这就是珊瑚白化。高温持续下去，珊瑚就会饿死。2016 年以来，大堡礁已经发生了多次大规模白化。海洋吸收二氧化碳后还会变得更酸。'],
      },
      {
        title: ['What we can do', '我们能做什么'], cam: [30, 100, 4.6], items: ['windmill'],
        fig: { k: 'key', set: 'custom', title: ['Two kinds of action', '两类行动'], items: [
          { c: C.green, name: ['Mitigation: solar, wind, saving energy, planting trees', '减缓：太阳能、风能、节约能源、植树造林'] },
          { c: C.blue, name: ['Adaptation: sea walls, drought-resistant crops, heat warnings', '适应：修建海堤、种植耐旱作物、高温预警'] },
        ] },
        marks: [mk([48.9, 2.3], 'Paris Agreement, 2015', '《巴黎协定》，2015 年', { dot: true, c: C.gold, t: 0.6 }), mk([39.9, 116.4], 'China: carbon peak before 2030, neutral before 2060', '中国：2030 年前碳达峰，2060 年前碳中和', { dot: true, c: C.red, t: 1.2 })],
        body: ['Mitigation means cutting greenhouse gases: clean energy from the Sun and wind, efficient buildings and cars, protecting and planting forests. Adaptation means preparing for changes already coming, like higher sea walls and crops that survive drought. In the 2015 Paris Agreement, countries agreed to keep warming well below 2 °C. You can help too: save energy, walk or cycle, and waste less.',
          '减缓就是减少温室气体排放：利用太阳能、风能等清洁能源，提高建筑和汽车的能效，保护森林、植树造林。适应就是为已经到来的变化做准备，比如加高海堤、培育耐旱作物。2015 年的《巴黎协定》提出把升温控制在 2 °C 以内。我们也可以出一份力：节约能源、步行或骑车出行、减少浪费。'],
      },
    ],
    quiz: [
      { q: ['The main cause of today\'s global warming is…', '当今全球变暖的主要原因是'], options: [['Burning fossil fuels', '大量燃烧化石燃料'], ['Volcanoes', '火山喷发'], ['The Earth getting closer to the Sun', '地球离太阳越来越近'], ['Too many clouds', '云太多']], answer: 0,
        why: ['Coal, oil and gas release CO2, which traps heat.', '燃烧煤、石油和天然气释放二氧化碳，留住更多热量。'] },
      { q: ['Before industry CO2 was about 280 ppm. In 2023 it was about…', '工业革命前二氧化碳浓度约 280 ppm，2023 年约为'], fig: { k: 'line', title: ['CO2 in the air (approx.)', '大气中的二氧化碳浓度（约）'], unit: ['ppm', 'ppm'], min: 260, max: 440, x: [1850, 1958, 1980, 2000, 2010, 2020, 2023], series: [{ name: ['CO2', '二氧化碳'], c: C.red, y: [280, 315, 340, 370, 390, 412, 420] }] },
        options: [['420 ppm', '约 420 ppm'], ['280 ppm', '约 280 ppm'], ['315 ppm', '约 315 ppm'], ['1,000 ppm', '约 1000 ppm']], answer: 0,
        why: ['It has risen by half since before industry.', '比工业革命前增加了一半。'] },
      { q: ['Building higher sea walls is an example of…', '加高海堤属于'], options: [['Adaptation', '适应'], ['Mitigation', '减缓'], ['The greenhouse effect', '温室效应'], ['Coral bleaching', '珊瑚白化']], answer: 0,
        why: ['It helps people live with rising seas rather than cutting emissions.', '它帮助人们应对海平面上升，而不是减少排放。'] },
      { q: ['Low islands here could be flooded by rising seas. Find the Maldives.', '海平面上升可能淹没这里的低平岛屿。在地球上点出马尔代夫。'], at: [3.2, 73.2], tolKm: 600,
        why: ['The Maldives lie in the Indian Ocean, south-west of India.', '马尔代夫位于印度洋，印度的西南方。'] },
    ],
  },
];
