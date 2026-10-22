/** 七下 · 东半球其他的国家和地区、西半球的国家: the Middle East, Europe, Africa, Russia, India, the USA, Brazil. */
import { C, arrows, mk, par, type Lesson } from './kit.ts';
import type { LL } from './stage.ts';
import { ASIA_EUROPE, REGIONS, RIVERS, SUEZ } from './geo.ts';

const east = ['Countries and regions of the Eastern Hemisphere', '东半球其他的国家和地区'] as const;
const west = ['Countries of the Western Hemisphere', '西半球的国家'] as const;
const flow = (pts: LL[], t: number, c: string = C.blue) => ({ pts, c, t, w: 1.4, flow: true, arrow: true, dur: 1.6 });
const route = (pts: LL[], t: number, c: string = C.gold) => ({ pts, c, t, w: 1.6, flow: true, arrow: true, dur: 2.4 });

// Hand-traced sketch lines and areas (textbook-diagram detail).
const NILE: LL[] = [[0.4, 33.2], [2.3, 31.5], [4.85, 31.6], [9.5, 31.65], [12.5, 32.6], [15.6, 32.5], [17.7, 34.0], [19.5, 33.3], [18.5, 31.8], [19.2, 30.5], [21.8, 31.3], [24.1, 32.9], [25.7, 32.6], [27.2, 31.2], [30.0, 31.2], [31.5, 31.0]];
const BLUE_NILE: LL[] = [[12.0, 37.3], [10.2, 37.9], [11.0, 35.3], [13.5, 33.6], [15.6, 32.5]];
const CONGO: LL[] = [[-11.0, 26.5], [-5.0, 26.9], [-2.9, 25.9], [0.5, 25.2], [2.0, 22.5], [1.5, 19.0], [0.0, 18.3], [-2.5, 16.2], [-4.3, 15.3], [-6.0, 12.4]];
const NIGER: LL[] = [[9.2, -10.6], [12.6, -8.0], [14.5, -4.2], [16.8, -3.0], [16.3, 0.0], [13.5, 2.1], [9.1, 4.8], [7.8, 6.7], [5.0, 6.2], [4.3, 6.0]];
const VOLGA: LL[] = [[57.3, 32.5], [56.9, 35.9], [57.6, 39.9], [56.3, 44.0], [55.8, 49.1], [53.2, 50.1], [51.5, 46.0], [48.7, 44.5], [46.35, 48.0], [45.8, 48.4]];
const URALS: LL[] = ASIA_EUROPE.slice(0, 5);
const TRANS_SIB: LL[] = [[55.75, 37.6], [56.3, 44.0], [56.8, 60.6], [55.0, 73.4], [55.0, 82.9], [56.0, 92.9], [52.3, 104.3], [51.8, 107.6], [52.0, 113.5], [54.0, 123.9], [48.5, 135.1], [43.1, 131.9]];
const MISSISSIPPI: LL[] = [[47.2, -95.2], [45.0, -93.3], [43.0, -91.2], [41.5, -90.6], [38.6, -90.2], [37.0, -89.2], [35.1, -90.1], [32.3, -90.9], [30.45, -91.2], [29.95, -90.1], [29.1, -89.3]];
const MISSOURI: LL[] = [[45.9, -111.5], [47.5, -111.3], [47.8, -106.0], [46.8, -100.8], [44.4, -100.3], [41.3, -95.9], [39.1, -94.6], [38.8, -90.1]];
const AMAZON_R: LL[] = [[-10.7, -73.8], [-7.5, -74.8], [-4.5, -73.5], [-3.75, -73.25], [-4.2, -69.9], [-3.3, -64.7], [-3.1, -60.0], [-2.6, -56.7], [-2.4, -54.7], [-1.5, -52.0], [-0.5, -50.0]];
const US_WEST: LL[] = [[49, -125], [49, -104.5], [44, -104], [38, -104.5], [32, -105], [31.3, -111], [32.5, -117.5], [40, -124.5]];
const US_PLAINS: LL[] = [[49, -104.5], [49, -89], [44, -85], [40, -84], [36, -86], [31, -87], [29, -95], [26, -97.5], [29, -103], [32, -105], [38, -104.5], [44, -104]];
const US_EAST: LL[] = [[47, -68], [44.5, -73.5], [42, -77.5], [39.5, -80.5], [36.5, -83.5], [33.8, -86], [33, -84.5], [35.5, -81], [38.5, -77.5], [41.5, -74], [44, -70]];
const ROCKIES: LL[] = [[49, -114.5], [46, -112.5], [43.5, -110], [40.5, -106.5], [38, -106], [35.5, -105.5], [32.5, -105.8]];
const APPALACHIANS: LL[] = [[46.5, -69], [44, -72], [42, -75], [40.5, -77.8], [38, -80.2], [36, -82.5], [34, -85]];
const CORN: LL[] = [[44.5, -97], [44.5, -90], [42, -84], [40, -82.5], [38.5, -85], [38.5, -91], [39.5, -96.5]];
const WHEAT_W: LL[] = [[40, -102], [40, -96.8], [37, -96.8], [35, -97.5], [35, -101], [37, -102]];
const WHEAT_S: LL[] = [[49, -111], [49, -97], [45.5, -97], [45.5, -104], [47, -111]];
const COTTON: LL[] = [[35, -101], [35, -90], [34.5, -84], [33, -81], [31.2, -82], [31, -88], [30.6, -91], [31, -97], [32, -101]];
const DAIRY: LL[] = [[47, -93], [46.5, -84], [45, -76], [43, -73], [42, -77], [42, -84], [43, -88], [44, -93]];
const DECCAN: LL[] = [[22.5, 73.5], [23, 80], [21.5, 85], [17, 82], [14, 80], [11, 77.5], [13, 75], [16, 74], [19, 73.3]];
const GANGES_PLAIN: LL[] = [[31, 74], [29.5, 78.5], [27.5, 83], [26.5, 88], [24.5, 89], [24, 87], [24.8, 82], [26.2, 78], [28, 73], [30, 72]];

const ME = ['SA', 'IR', 'IQ', 'KW', 'AE', 'QA', 'BH', 'OM', 'YE', 'JO', 'SY', 'LB', 'IL', 'PS', 'TR', 'CY', 'EG'];
const WEU = ['GB', 'IE', 'FR', 'DE', 'NL', 'BE', 'LU', 'CH', 'AT', 'ES', 'PT', 'IT', 'DK', 'NO', 'SE', 'FI', 'IS'];
const EU27 = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
const N_AFRICA = ['EG', 'LY', 'TN', 'DZ', 'MA', 'EH'];

export const WORLD: Lesson[] = [
  {
    id: 'middleeast', strand: 'world', tracks: ['uk', 'us', 'ib'], grade: 'g7b', unit: east, icon: 'landmark', minutes: 5,
    title: ['The Middle East', '中东'],
    blurb: ['Where three continents meet: oil under the sand, water in short supply, and holy cities for three faiths.', '“三洲五海之地”：丰富的石油、匮乏的水资源和三大宗教的圣地。'],
    keys: [
      ['The Middle East links Asia, Africa and Europe, and lies between two oceans and five seas.', '中东地处亚、非、欧三大洲交界处，被称为“两洋三洲五海之地”。'],
      ['It holds about half of the world\'s known oil; most is shipped out through the Strait of Hormuz.', '中东石油储量约占世界一半，大多经霍尔木兹海峡运往世界各地。'],
      ['Its dry desert climate makes water very scarce.', '气候干旱，以热带沙漠气候为主，水资源十分缺乏。'],
      ['Jerusalem is holy to Jews, Christians and Muslims.', '耶路撒冷是犹太教、基督教和伊斯兰教三大宗教的圣地。'],
    ],
    steps: [
      {
        title: ['Three continents, five seas', '三洲五海之地'], cam: [30, 42, 3.0], names: true,
        paint: [{ fill: { k: 'continents', only: ['asia', 'africa', 'europe'] }, a: 0.3 }, { fill: { k: 'land', a2: ME, c: C.gold }, t: 0.4, a: 0.55 }],
        marks: [
          mk([42.5, 34.5], 'Black Sea', '黑海', { c: C.blue, t: 0.8 }), mk([42, 50.5], 'Caspian Sea', '里海', { c: C.blue, t: 1.0 }),
          mk([34, 22], 'Mediterranean Sea', '地中海', { c: C.blue, t: 1.2 }), mk([20, 38.5], 'Red Sea', '红海', { c: C.blue, t: 1.4 }),
          mk([15, 63], 'Arabian Sea', '阿拉伯海', { c: C.blue, t: 1.6 }), mk([24, 46], 'Middle East', '中东', { big: true, c: C.gold, t: 0.4 }),
        ],
        body: ['The Middle East is where Asia, Africa and Europe meet. It touches the Indian and Atlantic oceans and five seas: the Caspian, Black, Mediterranean and Red Seas and the Arabian Sea. Since ancient times, traders and armies have crossed it.',
          '中东地处亚洲、非洲、欧洲三大洲的交界地带，沟通印度洋和大西洋，濒临里海、黑海、地中海、红海和阿拉伯海，被称为“两洋三洲五海之地”。自古以来就是东西方交通的要道。'],
      },
      {
        title: ['Straits and canals', '海峡与运河'], cam: [27, 40, 3.0],
        lines: [{ pts: SUEZ, c: C.red, w: 2.4, dur: 0.8 }],
        marks: [
          mk([30.6, 32.4], 'Suez Canal', '苏伊士运河', { dot: true, c: C.red, t: 0.6 }), mk([41.1, 29.0], 'Turkish Straits', '土耳其海峡', { dot: true, c: C.red, t: 0.9 }),
          mk([26.6, 56.3], 'Strait of Hormuz', '霍尔木兹海峡', { dot: true, c: C.red, t: 1.2 }), mk([12.6, 43.3], 'Bab-el-Mandeb', '曼德海峡', { dot: true, c: C.red, t: 1.5 }),
        ],
        body: ['Narrow waters make the region a crossroads. The Suez Canal links the Red Sea and the Mediterranean, the Turkish Straits link the Black Sea to the Mediterranean, and the Strait of Hormuz is the only way out of the Persian Gulf.',
          '中东有许多重要的海上通道：苏伊士运河沟通红海和地中海，土耳其海峡沟通黑海和地中海，霍尔木兹海峡是波斯湾通往外界的唯一出口。'],
      },
      {
        title: ['The world\'s oil store', '世界石油宝库'], cam: [22, 70, 4.2], sketch: true, items: ['burj', 'vh_dhow'],
        paint: [{ fill: { k: 'poly', pts: [[30.5, 47.5], [29, 48.5], [26, 50], [24, 52], [24.5, 55], [26.5, 56], [27.5, 52], [29.5, 50], [32, 49], [33, 46]], c: C.orange }, a: 0.55 }],
        lines: [
          route([[27.5, 51], [26.4, 56.5], [22, 62], [10, 75], [6, 80.5], [6.2, 94], [2.5, 101], [1.3, 104.3], [10, 110], [22, 116], [30, 123]], 0.4),
          route([[27.5, 51], [26.4, 56.5], [22.5, 60], [13, 50], [12.6, 43.4], [20, 38.5], [27.5, 34], [29.9, 32.55], [31.3, 32.3], [34, 25], [37.3, 11.5], [36, -5.6], [44, -10], [49.5, -5], [51, 1.5]], 0.8, C.orange),
          route([[22.5, 60], [0, 55], [-20, 42], [-35, 20], [-20, 5], [10, -20], [36, -12], [49.5, -5]], 1.2, C.pink),
        ],
        marks: [mk([28, 50.5], 'Persian Gulf oilfields', '波斯湾沿岸油田', { big: true, c: C.orange, t: 0.2 }), mk([20, 120], 'to East Asia', '运往东亚', { c: C.gold, t: 2 }), mk([47, -8], 'to Europe', '运往欧洲', { c: C.orange, t: 2.4 })],
        fig: { k: 'pie', title: ['Known oil reserves by region (approx.)', '世界石油探明储量分布（约）'], parts: [
          { name: ['Middle East', '中东'], v: 48, c: C.orange }, { name: ['Central & South America', '中南美洲'], v: 19, c: C.green },
          { name: ['North America', '北美洲'], v: 14, c: C.red }, { name: ['Europe & Russia region', '欧洲及俄罗斯等'], v: 9, c: C.blue },
          { name: ['Africa', '非洲'], v: 7, c: C.brown }, { name: ['Asia–Pacific', '亚太地区'], v: 3, c: C.violet },
        ] },
        body: ['Around the Persian Gulf lies about half of the world\'s known oil. Most of it is exported: tankers leave through the Strait of Hormuz, then sail east via Malacca to East Asia, west through the Suez Canal, or round the Cape of Good Hope to Europe and America. Oil money built cities like Dubai.',
          '波斯湾及其沿岸地区石油储量约占世界的一半，是世界上石油储量最大、生产和出口石油最多的地区。油轮经霍尔木兹海峡驶出，向东经马六甲海峡运往东亚，向西经苏伊士运河或绕过好望角运往欧洲和美国。石油财富建起了迪拜等城市。'],
      },
      {
        title: ['Scarce water', '匮乏的水资源'], cam: [27, 45, 3.0], items: ['petra'],
        paint: [{ fill: { k: 'climate', only: ['desert'] }, a: 0.5 }],
        lines: [flow(NILE.slice(9), 0.3), flow([[39.5, 39.5], [37, 38.3], [36, 40], [34.5, 41], [33.3, 44.4], [31, 47.4]], 0.6), flow([[38.5, 43.5], [37, 42.5], [34, 45], [31, 47.4]], 0.8)],
        marks: [mk([33.5, 41.5], 'Euphrates & Tigris', '幼发拉底河与底格里斯河', { c: C.blue, t: 1.2 }), mk([26, 31.8], 'Nile', '尼罗河', { c: C.blue, t: 1.4 })],
        fig: { k: 'climo', city: 'cairo' },
        body: ['Most of the Middle East has a hot desert climate with almost no rain, and many places have no permanent rivers. Water for farms and cities comes from a few big rivers, deep wells and desalinated seawater, and sharing rivers can cause tension between countries.',
          '中东大部分地区属于热带沙漠气候，降水稀少，许多地区没有常年河流。农业和城市用水依靠少数大河、地下水和海水淡化，河流用水还常常引起国家之间的争端。'],
      },
      {
        title: ['Holy cities and cultures', '宗教圣地与文化'], cam: [27, 42, 2.6], items: ['sheikhzayed', 'petra'],
        marks: [mk([31.78, 35.23], 'Jerusalem', '耶路撒冷', { dot: true, big: true, c: C.gold, t: 0.4 }), mk([21.42, 39.83], 'Mecca', '麦加', { dot: true, c: C.gold, t: 0.9 })],
        body: ['Judaism, Christianity and Islam all began in this region. Jerusalem is holy to all three. Most people today are Arabs and Muslims, and Mecca is Islam\'s holiest city. Oil, water, land and religion have all made the Middle East a region of long conflicts.',
          '犹太教、基督教和伊斯兰教都发源于这里，耶路撒冷是三大宗教的圣地。如今中东居民以阿拉伯人为主，多信仰伊斯兰教，麦加是伊斯兰教的第一圣地。石油、水源、领土和宗教等问题使中东长期成为热点地区。'],
      },
    ],
    quiz: [
      { q: ['The Middle East is called the land of…', '中东被称为'], options: [['Two oceans, three continents and five seas', '两洋三洲五海之地'], ['Ice and snow', '冰雪之地'], ['Rainforests', '雨林之地'], ['A thousand lakes', '千湖之国']], answer: 0,
        why: ['It joins Asia, Africa and Europe and touches two oceans and five seas.', '它连接亚、非、欧三洲，沟通两大洋，濒临五个海。'] },
      { q: ['Find the Strait of Hormuz, the gateway of the Persian Gulf oil.', '在地球上点出霍尔木兹海峡。'], at: [26.6, 56.3], tolKm: 500,
        why: ['It is the only way out of the Persian Gulf.', '它是波斯湾通往外界的唯一出口。'] },
      { q: ['Which is the Middle East\'s biggest resource problem?', '中东最突出的资源问题是'], options: [['Shortage of water', '水资源匮乏'], ['Shortage of oil', '石油匮乏'], ['Too much rain', '降水过多'], ['Too many forests', '森林过多']], answer: 0,
        why: ['A hot desert climate leaves little fresh water.', '热带沙漠气候降水稀少，淡水缺乏。'] },
      { q: ['Which city is holy to Jews, Christians and Muslims?', '哪座城市是三大宗教的圣地？'], options: [['Jerusalem', '耶路撒冷'], ['Dubai', '迪拜'], ['Cairo', '开罗'], ['Baghdad', '巴格达']], answer: 0,
        why: ['All three faiths have holy sites in Jerusalem.', '三大宗教在耶路撒冷都有圣迹。'] },
    ],
  },
  {
    id: 'europe', strand: 'world', tracks: ['us', 'ib'], grade: 'g7b', unit: east, icon: 'flag', minutes: 5,
    title: ['Western Europe and the EU', '欧洲西部'],
    blurb: ['Mild, wet winds from the Atlantic, green pastures, famous sights and countries that work together.', '大西洋吹来的温和湿润的风、绿色的牧场、闻名世界的旅游胜地和紧密合作的国家。'],
    keys: [
      ['Westerlies and a warm current give Western Europe a mild, wet maritime climate.', '受西风和北大西洋暖流影响，欧洲西部以温带海洋性气候为主。'],
      ['Cool, damp weather grows grass well, so dairy and livestock farming lead.', '温和湿润的气候利于多汁牧草生长，畜牧业发达，以乳畜业为主。'],
      ['Old cities, the Alps and coasts make it the world\'s busiest tourist region.', '古城、阿尔卑斯山和海滨使这里成为世界上旅游业最发达的地区。'],
      ['Most countries here have joined the European Union.', '这里的大多数国家加入了欧洲联盟。'],
    ],
    steps: [
      {
        title: ['Many developed countries', '发达国家集中'], cam: [50, 8, 2.8], names: true,
        paint: [{ fill: { k: 'land', a2: WEU, c: C.green }, t: 0.3, a: 0.5 }],
        marks: [mk([56, -15], 'Atlantic Ocean', '大西洋', { c: C.blue, t: 0.8 }), mk([46.5, 9.5], 'Alps', '阿尔卑斯山脉', { c: C.brown, t: 1.2 }), mk([52, 14], 'North European Plain', '欧洲平原', { c: C.lime, t: 1.5 })],
        items: ['matterhorn'],
        body: ['Western Europe has many countries in a small area, and almost all of them are developed. Plains and low land cover the north, while the high Alps rise in the south. The coastline is long and winding, so no place is far from the sea.',
          '欧洲西部国家众多，面积不大，绝大多数是发达国家。地形以平原为主，南部有高大的阿尔卑斯山脉。海岸线曲折，大部分地方离海不远。'],
      },
      {
        title: ['A mild, wet climate', '温带海洋性气候'], cam: [52, -2, 3.2], sketch: true,
        paint: [{ fill: { k: 'climate', only: ['maritime'] }, t: 0.6, a: 0.55 }],
        lines: [...arrows([[[47, -25], [50, -8]], [[52, -25], [54, -8]], [[57, -22], [59, -6]]], C.teal, 0, 2), { pts: [[40, -40], [48, -25], [55, -15], [62, -4], [68, 8]], c: C.red, t: 0.5, w: 2, flow: true, arrow: true, dur: 2 }],
        marks: [mk([51, -21], 'Westerlies', '西风', { c: C.teal, t: 0.8 }), mk([58, -14], 'North Atlantic Drift (warm)', '北大西洋暖流', { c: C.red, t: 1.4 })],
        fig: { k: 'climo', city: 'london' },
        body: ['Westerly winds blow all year from the Atlantic, carrying warmth and moisture from the warm North Atlantic Drift. With no high mountains running north–south to block them, they reach far inland. Winters are mild, summers cool, and rain falls evenly in every month.',
          '这里常年受西风影响，西风带来北大西洋暖流的温暖和水汽。地势低平，山脉多为东西走向，海洋气流可以深入内陆。因此冬季温和、夏季凉爽，全年降水较均匀。'],
      },
      {
        title: ['Dairy and livestock', '发达的乳畜业'], cam: [52, 5, 2.2], items: ['windmill', 'pl_tulips'],
        paint: [{ fill: { k: 'land', a2: ['NL', 'DK', 'IE', 'GB', 'FR', 'DE', 'BE'], c: C.lime }, a: 0.45 }],
        marks: [mk([52.3, 5.3], 'Netherlands', '荷兰', { dot: true, t: 0.5 }), mk([56, 9.5], 'Denmark', '丹麦', { dot: true, t: 0.8 })],
        fig: { k: 'bars', title: ['Share of farm output from livestock (approx.)', '畜牧业产值占农业产值的比重（约）'], unit: ['%', '%'], rows: [
          { name: ['Ireland', '爱尔兰'], v: 75, c: C.green }, { name: ['Denmark', '丹麦'], v: 65, c: C.green }, { name: ['UK', '英国'], v: 55, c: C.green }, { name: ['China', '中国'], v: 30, c: C.gold },
        ] },
        body: ['Cool, damp summers are poor for many crops but perfect for juicy grass. So farmers raise dairy cows and sell milk, butter and cheese. The Netherlands and Denmark are famous dairy countries, and the Dutch also grow flowers like tulips for export.',
          '这里夏季凉爽、阴雨天多，不利于许多农作物生长，却利于多汁牧草生长。因此农民大量饲养奶牛，生产牛奶、黄油和奶酪。荷兰、丹麦的乳畜业很有名，荷兰的郁金香等花卉还大量出口。'],
      },
      {
        title: ['A tourist magnet', '旅游业发达'], cam: [48, 6, 2.4], items: ['eiffel', 'bigben', 'colosseum', 'neuschwanstein'],
        marks: [mk([48.86, 2.35], 'Paris', '巴黎', { dot: true, t: 0.4 }), mk([51.5, -0.12], 'London', '伦敦', { dot: true, t: 0.7 }), mk([41.9, 12.5], 'Rome', '罗马', { dot: true, t: 1.0 }), mk([46.3, 8.5], 'Alps', '阿尔卑斯山', { c: C.brown, t: 1.3 })],
        fig: { k: 'bars', title: ['International tourist arrivals, 2019 (approx.)', '2019 年接待国际游客人数（约）'], unit: ['million', '百万人次'], rows: [
          { name: ['France', '法国'], v: 90, c: C.blue }, { name: ['Spain', '西班牙'], v: 84, c: C.blue }, { name: ['Italy', '意大利'], v: 65, c: C.blue }, { name: ['UK', '英国'], v: 39, c: C.blue },
        ] },
        body: ['Western Europe is the busiest tourist region on Earth. Visitors come for old cities and museums, the snowy Alps for skiing, and sunny Mediterranean beaches. France welcomes more international tourists than any other country.',
          '欧洲西部是世界上旅游业最发达的地区。人们来这里游览历史名城和博物馆，到阿尔卑斯山滑雪，去地中海沿岸享受阳光和海滩。法国是接待国际游客最多的国家。'],
      },
      {
        title: ['The European Union', '欧洲联盟'], cam: [50, 14, 3.0], borders: true,
        paint: [{ fill: { k: 'land', a2: EU27, c: C.blue }, t: 0.3, a: 0.5 }],
        marks: [mk([50.85, 4.35], 'Brussels (EU headquarters)', '布鲁塞尔（欧盟总部）', { dot: true, big: true, c: C.gold, t: 1 })],
        body: ['After two world wars, European countries chose to cooperate. Today 27 countries form the European Union: goods, money and people move freely between them, and 21 of them share one currency, the euro. The UK left the EU in 2020.',
          '两次世界大战之后，欧洲国家走上了合作之路。今天欧洲联盟有 27 个成员国，成员国之间商品、资金和人员可以自由流动，其中 21 个国家使用统一货币欧元。英国于 2020 年退出欧盟。'],
      },
    ],
    quiz: [
      { q: ['Western Europe\'s main climate is…', '欧洲西部主要的气候类型是'], options: [['Temperate maritime', '温带海洋性气候'], ['Hot desert', '热带沙漠气候'], ['Tropical rainforest', '热带雨林气候'], ['Temperate monsoon', '温带季风气候']], answer: 0,
        why: ['Westerlies from the Atlantic keep it mild and wet all year.', '大西洋吹来的西风使这里全年温和湿润。'] },
      { q: ['Which climate graph belongs to Western Europe?', '下面的气候资料图最可能属于哪里？'], fig: { k: 'climo', city: 'london', blind: true }, options: [['Western Europe', '欧洲西部'], ['The Middle East', '中东'], ['India', '印度'], ['Siberia', '西伯利亚']], answer: 0,
        why: ['Mild winters, cool summers and rain spread evenly: maritime.', '冬暖夏凉、降水均匀，是温带海洋性气候。'] },
      { q: ['Why is dairy farming so important here?', '这里乳畜业发达的主要原因是'], options: [['The cool, damp climate grows grass well', '温和湿润的气候利于牧草生长'], ['It is too dry for any plants', '气候太干旱'], ['There are no cities', '没有城市'], ['Cows came from the Middle East', '奶牛来自中东']], answer: 0,
        why: ['Cool summers suit grass better than grain.', '夏季凉爽，利于牧草而不利于谷物生长。'] },
      { q: ['Find Paris, home of the Eiffel Tower.', '在地球上点出巴黎。'], at: [48.86, 2.35], tolKm: 350,
        why: ['Paris is in northern France on the River Seine.', '巴黎位于法国北部的塞纳河畔。'] },
    ],
  },
  {
    id: 'africa', strand: 'world', tracks: ['uk', 'us', 'ib'], grade: 'g7b', unit: east, icon: 'paw', minutes: 6,
    title: ['Sub-Saharan Africa', '撒哈拉以南非洲'],
    blurb: ['A high plateau continent, great rivers, savanna wildlife, and fast-growing young nations.', '高原大陆、大江大河、草原上的野生动物，以及人口快速增长的国家。'],
    keys: [
      ['Most people south of the Sahara are black: it is called the homeland of black people.', '撒哈拉以南非洲是黑种人的故乡。'],
      ['Africa is a plateau continent; the Nile flows north and the Congo crosses the equator.', '非洲被称为“高原大陆”；尼罗河向北流，刚果河两次穿过赤道。'],
      ['Climate zones mirror each other north and south of the equator.', '非洲的气候以赤道为中心，大致呈南北对称分布。'],
      ['Many economies rely on one export, and food struggles to keep up with population.', '许多国家经济结构单一，人口增长过快，粮食问题突出。'],
    ],
    steps: [
      {
        title: ['South of the Sahara', '撒哈拉以南'], cam: [2, 20, 3.4],
        paint: [{ fill: { k: 'continents', only: ['africa'] }, a: 0.5 }, { fill: { k: 'land', a2: N_AFRICA, c: C.white }, t: 0.6, a: 0.35 }],
        marks: [mk([24, 10], 'Sahara Desert', '撒哈拉沙漠', { big: true, c: C.orange, t: 0.8 }), mk([-5, 22], 'Sub-Saharan Africa', '撒哈拉以南非洲', { big: true, c: C.gold, t: 1.2 })],
        body: ['The Sahara divides Africa in two. North Africa has closer links with the Middle East, while the vast lands south of the desert are home to about 1.2 billion people, mostly black Africans. That is why it is called the homeland of black people.',
          '撒哈拉沙漠把非洲分成两部分。北非与中东联系密切；撒哈拉沙漠以南的广大地区约有 12 亿人，绝大多数是黑种人，因此被称为“黑种人的故乡”。'],
      },
      {
        title: ['A plateau continent', '高原大陆'], cam: [-2, 28, 3.2], sketch: true, items: ['kilimanjaro', 'victoriafalls'],
        paint: [
          { fill: { k: 'poly', pts: [[15, 36.5], [13, 42], [8, 44], [4, 39], [7, 35], [11, 35]], c: C.brown }, t: 0.3, a: 0.6 },
          { fill: { k: 'poly', pts: [[4, 30], [3, 36.5], [-5, 39.5], [-10, 37], [-9, 31], [-3, 29.5]], c: C.brown }, t: 0.6, a: 0.6 },
          { fill: { k: 'poly', pts: [[-12, 15], [-14, 33], [-25, 32], [-33, 27], [-33, 20], [-26, 16], [-18, 13]], c: C.brown }, t: 0.9, a: 0.6 },
        ],
        marks: [mk([10, 39.5], 'Ethiopian Highlands', '埃塞俄比亚高原', { c: C.brown, t: 1 }), mk([-3, 34], 'East African Plateau', '东非高原', { c: C.brown, t: 1.3 }), mk([-24, 24], 'South African Plateau', '南非高原', { c: C.brown, t: 1.6 }), mk([-3.07, 37.35], 'Kilimanjaro', '乞力马扎罗山', { dot: true, t: 1.9 })],
        body: ['Much of Africa is high, flat plateau, so it is called the plateau continent. The land is higher in the south-east and lower in the north-west. Kilimanjaro, the highest peak, is a volcano near the equator with snow on top.',
          '非洲地形以高原为主，被称为“高原大陆”，地势东南高、西北低。最高峰乞力马扎罗山是一座火山，虽然靠近赤道，山顶却有积雪。'],
      },
      {
        title: ['The Nile and the Congo', '尼罗河与刚果河'], cam: [8, 26, 3.6],
        lines: [flow(NILE, 0.2), flow(BLUE_NILE, 0.6), flow(CONGO, 1.0), flow(NIGER, 1.4)],
        marks: [mk([20, 29.5], 'Nile', '尼罗河', { c: C.blue, t: 1.2 }), mk([1.5, 21], 'Congo', '刚果河', { c: C.blue, t: 1.6 }), mk([15.5, -4], 'Niger', '尼日尔河', { c: C.blue, t: 2 }), mk([1, 33], 'Lake Victoria', '维多利亚湖', { t: 1 })],
        body: ['The Nile, about 6,700 km long, is the world\'s longest river. It flows north from East Africa across the desert to the Mediterranean. The Congo crosses the equator twice through the rainforest and carries more water than any other African river.',
          '尼罗河全长约 6700 千米，是世界上最长的河流。它从东非高原向北穿过沙漠，注入地中海。刚果河两次穿过赤道，流经热带雨林，是非洲流量最大的河流。'],
      },
      {
        title: ['Climate in mirror image', '气候南北对称'], cam: [2, 18, 3.6], sketch: true, items: ['an_lion', 'an_elephant', 'mg_wildebeest'],
        paint: [{ fill: { k: 'climate', only: ['rainforest', 'savanna', 'desert', 'med'] }, a: 0.6 }],
        lines: [par(0, C.gold, 0.3)],
        marks: [mk([0.5, -5], 'Equator', '赤道', { c: C.gold, t: 0.6 }), mk([1, 22], 'Rainforest', '热带雨林', { t: 1 }), mk([10, 22], 'Savanna', '热带草原', { t: 1.3 }), mk([-15, 25], 'Savanna', '热带草原', { t: 1.5 }), mk([23, 12], 'Desert', '热带沙漠', { t: 1.8 }), mk([-24, 17], 'Desert', '热带沙漠', { t: 2 })],
        fig: { k: 'key', set: 'climate', only: ['rainforest', 'savanna', 'desert', 'med'] },
        body: ['The equator crosses the middle of Africa, so its climates are arranged almost like a mirror: rainforest at the centre, then savanna, then desert, then Mediterranean at both ends. Most of the continent is hot. On the savanna, lions, elephants and huge herds of wildebeest follow the rains.',
          '赤道横穿非洲中部，非洲的气候以赤道为中心大致呈南北对称分布：中部是热带雨林气候，向南北依次是热带草原气候、热带沙漠气候和地中海气候。非洲大部分地区炎热，被称为“热带大陆”。热带草原上，狮子、大象和成群的角马随雨季迁徙。'],
      },
      {
        title: ['One export, many people', '单一经济与人口问题'], cam: [0, 20, 3.4],
        paint: [{ fill: { k: 'land', a2: ['NG', 'ZM', 'CI', 'GH', 'BW', 'ET'], c: C.orange }, a: 0.55 }],
        marks: [mk([9, 8], 'Nigeria: oil', '尼日利亚：石油', { t: 0.4 }), mk([-14, 27.5], 'Zambia: copper', '赞比亚：铜', { t: 0.7 }), mk([7.5, -5.5], 'Côte d\'Ivoire: cocoa', '科特迪瓦：可可', { t: 1 }), mk([-22, 24], 'Botswana: diamonds', '博茨瓦纳：钻石', { t: 1.3 })],
        fig: { k: 'bars', title: ['Share of exports from one product (approx.)', '单一产品占出口总额的比重（约）'], unit: ['%', '%'], rows: [
          { name: ['Nigeria · oil', '尼日利亚 · 石油'], v: 80, c: C.orange }, { name: ['Botswana · diamonds', '博茨瓦纳 · 钻石'], v: 80, c: C.orange },
          { name: ['Zambia · copper', '赞比亚 · 铜'], v: 70, c: C.orange }, { name: ['Côte d\'Ivoire · cocoa', '科特迪瓦 · 可可'], v: 40, c: C.orange },
        ] },
        body: ['Many countries here earn most of their money from selling one raw material or crop, so a fall in its world price hurts the whole country. Populations are young and growing fast, and in some places food production has not kept up. Better farming, schools and new industries are helping.',
          '这里许多国家主要依靠出口一两种矿产品或农产品，经济结构单一，一旦国际市场价格下跌，整个国家都会受影响。人口增长过快，有些地方粮食生产赶不上人口增长。发展农业、教育和工业是解决问题的出路。'],
      },
      {
        title: ['A young population', '年轻的人口'], cam: [12, 8, 3.2],
        paint: [{ fill: { k: 'land', a2: ['NE'], c: C.gold }, a: 0.6 }],
        marks: [mk([17, 9], 'Niger', '尼日尔', { big: true, t: 0.4 })],
        fig: { k: 'pyramid', a: 'niger', b: 'japan' },
        body: ['Compare Niger\'s population pyramid with Japan\'s. Niger\'s wide base means many children are born, and half the people are under 15. Africa\'s population is expected to double by about 2050, so jobs and food are big challenges.',
          '比较尼日尔和日本的人口金字塔。尼日尔的金字塔底部很宽，说明出生的孩子多，一半人口不到 15 岁。预计到 2050 年左右非洲人口将翻一番，就业和粮食都是巨大的挑战。'],
      },
    ],
    quiz: [
      { q: ['Africa is called the…', '非洲被称为'], options: [['Plateau continent', '高原大陆'], ['Ice continent', '冰雪大陆'], ['Plain continent', '平原大陆'], ['Island continent', '岛屿大陆']], answer: 0,
        why: ['Most of Africa is high, flat plateau.', '非洲地形以高原为主。'] },
      { q: ['Africa\'s climate zones are arranged…', '非洲的气候分布特点是'], options: [['Almost symmetrically about the equator', '以赤道为中心南北大致对称'], ['From east to west only', '只有东西差异'], ['Randomly', '杂乱无章'], ['All desert', '全是沙漠']], answer: 0,
        why: ['Rainforest at the centre, then savanna, desert and Mediterranean on both sides.', '中部为热带雨林，向南北依次为热带草原、热带沙漠和地中海气候。'] },
      { q: ['Find the mouth of the Nile.', '在地球上点出尼罗河的入海口。'], at: [31.3, 31.0], tolKm: 500,
        why: ['The Nile flows north into the Mediterranean, near Cairo.', '尼罗河向北流，在开罗以北注入地中海。'] },
      { q: ['Why are economies with "one export" risky?', '经济结构单一的国家面临什么风险？'], options: [['A price fall hurts the whole country', '国际价格下跌会使整个国家受损'], ['They have too many factories', '工厂太多'], ['They import no food', '不进口粮食'], ['They are too cold', '气候太冷']], answer: 0,
        why: ['When most money comes from one product, its price decides everything.', '大部分收入来自一种产品，价格波动影响巨大。'] },
    ],
  },
  {
    id: 'russia', strand: 'world', tracks: ['uk', 'us'], grade: 'g7b', unit: east, icon: 'compass', minutes: 5,
    title: ['Russia', '俄罗斯'],
    blurb: ['The biggest country on Earth: across Europe and Asia, rivers to the Arctic, cold winters and a railway 9,000 km long.', '世界上面积最大的国家：横跨亚欧，河流北流，冬季严寒，铁路绵延 9000 多千米。'],
    keys: [
      ['Russia is the largest country, spanning Europe and Asia; the Urals divide the two parts.', '俄罗斯是世界上面积最大的国家，地跨欧、亚两洲，以乌拉尔山脉为界。'],
      ['The Ob, Yenisei and Lena flow north to the Arctic; the Volga flows into the Caspian Sea.', '鄂毕河、叶尼塞河、勒拿河向北注入北冰洋，伏尔加河注入里海。'],
      ['Most of Russia is cold, with long, freezing winters.', '俄罗斯大部分地区纬度高，冬季漫长严寒。'],
      ['Rich in oil, gas, timber and coal; the Trans-Siberian Railway links east and west.', '石油、天然气、森林和煤炭资源丰富，西伯利亚大铁路连接东西。'],
    ],
    steps: [
      {
        title: ['The largest country', '面积最大的国家'], cam: [60, 90, 4.4],
        paint: [{ fill: { k: 'land', a2: ['RU'], c: C.red }, t: 0.2, a: 0.5 }],
        lines: [{ pts: URALS, c: C.brown, t: 0.8, w: 2.4, dur: 1.4 }],
        marks: [mk([62, 64], 'Ural Mountains', '乌拉尔山脉', { c: C.brown, t: 1.4 }), mk([57, 42], 'European part', '欧洲部分', { big: true, t: 1.8 }), mk([63, 110], 'Asian part (Siberia)', '亚洲部分（西伯利亚）', { big: true, t: 2.1 })],
        body: ['Russia covers about 17 million km², the largest country on Earth. It stretches across eastern Europe and northern Asia. The low Ural Mountains divide it: the Asian part, Siberia, is about three-quarters of the land, but most people live in the European part.',
          '俄罗斯面积约 1710 万平方千米，是世界上面积最大的国家，地跨欧洲东部和亚洲北部。乌拉尔山脉是欧洲部分和亚洲部分的分界：亚洲部分约占全国面积的四分之三，但大部分人口居住在欧洲部分。'],
      },
      {
        title: ['Sunrise across 11 time zones', '跨越 11 个时区'], cam: [60, 90, 4.6], night: true,
        clock: { mode: 'day', start: Date.UTC(2025, 2, 20, 18), rate: 2, span: 12 },
        marks: [mk([43.1, 131.9], 'Vladivostok', '符拉迪沃斯托克', { dot: true, t: 0.4 }), mk([54.7, 20.5], 'Kaliningrad', '加里宁格勒', { dot: true, t: 0.6 })],
        body: ['Russia is so wide from west to east that it spans 11 time zones. When the Sun rises in Vladivostok on the Pacific coast, people in Moscow are still in the middle of the night. Watch the dawn sweep across the country.',
          '俄罗斯东西跨度很大，共跨 11 个时区。当东部太平洋沿岸的符拉迪沃斯托克迎来日出时，莫斯科还是深夜。看，晨光正自东向西扫过这个国家。'],
      },
      {
        title: ['Rivers that flow north', '向北流的河流'], cam: [60, 85, 4.2], items: ['basil'],
        lines: [flow(RIVERS.ob, 0.2), flow(RIVERS.yenisei, 0.5), flow(RIVERS.lena, 0.8), flow(VOLGA, 1.2)],
        marks: [mk([63, 69], 'Ob', '鄂毕河', { c: C.blue, t: 1 }), mk([64, 88], 'Yenisei', '叶尼塞河', { c: C.blue, t: 1.2 }), mk([65, 125], 'Lena', '勒拿河', { c: C.blue, t: 1.4 }), mk([52, 47], 'Volga → Caspian Sea', '伏尔加河 → 里海', { c: C.blue, t: 1.8 }), mk([44, 50.5], 'Caspian Sea', '里海', { t: 2.1 })],
        body: ['The land of Asian Russia slopes down to the north, so the great Siberian rivers, the Ob, Yenisei and Lena, flow north into the Arctic Ocean. In spring their southern upper reaches thaw first while the northern lower reaches are still frozen, causing ice floods. The Volga, Russia\'s "mother river" and Europe\'s longest, flows south into the Caspian Sea.',
          '俄罗斯亚洲部分地势南高北低，鄂毕河、叶尼塞河和勒拿河都向北注入北冰洋。春季上游先解冻，下游仍然冰封，容易形成凌汛。伏尔加河是俄罗斯的“母亲河”，也是欧洲最长的河流，向南注入里海。'],
      },
      {
        title: ['A cold country', '寒冷的国家'], cam: [62, 100, 4.2], sketch: true,
        paint: [{ fill: { k: 'climate', only: ['continental', 'subarctic', 'tundra'] }, a: 0.5 }],
        lines: [{ pts: [[66.56, 25], [66.56, 100], [66.56, 180]], c: C.ice, t: 0.4, rhumb: true, dur: 2 }],
        marks: [mk([67.5, 100], 'Arctic Circle', '北极圈', { c: C.ice, t: 1 }), mk([62.0, 129.7], 'Yakutsk', '雅库茨克', { dot: true, t: 1.4 })],
        fig: { k: 'climo', city: 'moscow', b: 'yakutsk' },
        body: ['Most of Russia lies far north, and part is inside the Arctic Circle. Winters are long and freezing, especially in the east: Yakutsk averages almost −40 °C in January. Huge taiga forests cover Siberia, with tundra along the Arctic coast.',
          '俄罗斯大部分地区纬度高，有一部分位于北极圈内，冬季漫长而严寒，越往东越冷：雅库茨克 1 月平均气温接近 −40 °C。西伯利亚分布着广阔的亚寒带针叶林，北冰洋沿岸是苔原。'],
      },
      {
        title: ['Riches and the railway', '资源与西伯利亚大铁路'], cam: [56, 85, 4.4], items: ['vh_transsib', 'kremlin', 'basil'],
        lines: [{ pts: TRANS_SIB, c: C.gold, t: 0.3, w: 2, dur: 3 }],
        paint: [{ fill: { k: 'poly', pts: [[67, 66], [67, 80], [60, 82], [56, 76], [58, 66]], c: C.orange }, t: 1, a: 0.5 }],
        marks: [mk([55.75, 37.6], 'Moscow', '莫斯科', { dot: true, big: true, t: 0.4 }), mk([43.1, 131.9], 'Vladivostok', '符拉迪沃斯托克', { dot: true, t: 2.8 }), mk([62, 74], 'West Siberian oil & gas', '西西伯利亚油气田', { c: C.orange, t: 1.4 })],
        body: ['Russia is rich in oil, natural gas, coal, timber and metals, and pipelines carry its gas to Europe and China. Most industry is in the European part, around Moscow, while resources lie in Siberia. The Trans-Siberian Railway, about 9,300 km long, links Moscow with Vladivostok.',
          '俄罗斯石油、天然气、煤炭、森林和金属矿产资源丰富，天然气通过管道输往欧洲和中国。工业主要分布在以莫斯科为中心的欧洲部分，而资源多在西伯利亚。西伯利亚大铁路全长约 9300 千米，连接莫斯科和符拉迪沃斯托克。'],
      },
    ],
    quiz: [
      { q: ['Which mountains divide Russia into European and Asian parts?', '俄罗斯欧洲部分和亚洲部分的分界是'], options: [['The Ural Mountains', '乌拉尔山脉'], ['The Alps', '阿尔卑斯山脉'], ['The Himalayas', '喜马拉雅山脉'], ['The Rockies', '落基山脉']], answer: 0,
        why: ['The low Urals run north–south through western Russia.', '乌拉尔山脉南北走向，位于俄罗斯西部。'] },
      { q: ['The Ob, Yenisei and Lena flow…', '鄂毕河、叶尼塞河和勒拿河的流向是'], options: [['North, into the Arctic Ocean', '向北，注入北冰洋'], ['South, into the Indian Ocean', '向南，注入印度洋'], ['East, into the Pacific', '向东，注入太平洋'], ['Into the Caspian Sea', '注入里海']], answer: 0,
        why: ['Siberia slopes down to the north.', '西伯利亚地势南高北低。'] },
      { q: ['Find the Ural Mountains.', '在地球上点出乌拉尔山脉。'], at: [60, 59.5], tolKm: 600,
        why: ['They run north–south at about 60°E.', '它大致沿东经 60° 南北延伸。'] },
      { q: ['Which railway crosses Russia from Moscow to the Pacific?', '哪条铁路横贯俄罗斯，从莫斯科通往太平洋沿岸？'], options: [['The Trans-Siberian Railway', '西伯利亚大铁路'], ['The Orient Express', '东方快车'], ['The Qinghai–Tibet Railway', '青藏铁路'], ['The Channel Tunnel', '英吉利海峡隧道']], answer: 0,
        why: ['It runs about 9,300 km to Vladivostok.', '它全长约 9300 千米，通往符拉迪沃斯托克。'] },
    ],
  },
  {
    id: 'india', strand: 'world', tracks: ['uk', 'us', 'ib'], grade: 'g7b', unit: east, icon: 'festival', minutes: 5,
    title: ['India', '印度'],
    blurb: ['A subcontinent shaped by the Himalayas and the monsoon: rice fields, booming software and the world\'s largest population.', '喜马拉雅山和季风塑造的次大陆：稻田、软件业和世界第一的人口。'],
    keys: [
      ['India fills most of the South Asian subcontinent, with the Himalayas to the north.', '印度占据南亚次大陆的大部分，北部是喜马拉雅山脉。'],
      ['The south-west monsoon brings a wet season; when it fails, drought follows.', '西南季风带来雨季，季风不稳定时容易发生旱涝灾害。'],
      ['The Green Revolution helped India grow enough grain for its people.', '“绿色革命”使印度基本实现了粮食自给。'],
      ['India has the world\'s largest population and a booming software industry.', '印度人口居世界第一，软件业发展迅速。'],
    ],
    steps: [
      {
        title: ['The South Asian subcontinent', '南亚次大陆'], cam: [22, 80, 3.0], items: ['everest'],
        paint: [{ fill: { k: 'land', a2: ['IN'], c: C.orange }, a: 0.45 }, { fill: { k: 'poly', pts: REGIONS.himalaya, c: C.white }, t: 0.5, a: 0.7 }, { fill: { k: 'poly', pts: GANGES_PLAIN, c: C.lime, clip: ['IN', 'BD'] }, t: 0.9, a: 0.55 }, { fill: { k: 'poly', pts: DECCAN, c: C.brown, clip: ['IN'] }, t: 1.3, a: 0.55 }],
        lines: [flow(RIVERS.ganges, 1.6)],
        marks: [mk([30, 82], 'Himalayas', '喜马拉雅山脉', { c: C.white, t: 0.6 }), mk([26.5, 81], 'Ganges Plain', '恒河平原', { c: C.lime, t: 1 }), mk([17.5, 77.5], 'Deccan Plateau', '德干高原', { c: C.brown, t: 1.4 }), mk([24.5, 88.5], 'Ganges', '恒河', { c: C.blue, t: 2 })],
        body: ['India fills most of a great triangle of land called the South Asian subcontinent. The Himalayas wall it off in the north, the fertile Ganges Plain lies in the middle, and the Deccan Plateau forms the south. The Ganges is India\'s holy river.',
          '印度占据南亚次大陆的大部分。北部是喜马拉雅山脉，中部是肥沃的恒河平原，南部是德干高原。恒河被印度人视为“圣河”。'],
      },
      {
        title: ['The monsoon', '热带季风气候'], cam: [18, 78, 3.4], sketch: true,
        lines: [...arrows([[[2, 60], [14, 70]], [[0, 70], [12, 76]], [[5, 85], [18, 88]], [[8, 90], [22, 91]]], C.teal, 0, 2), ...arrows([[[28, 88], [20, 82]], [[27, 78], [18, 74]]], C.orange, 1.6, 1.6)],
        marks: [mk([8, 66], 'Jun–Sep: wet SW monsoon', '6–9 月：湿润的西南季风', { c: C.teal, t: 0.8 }), mk([26, 72], 'Oct–May: dry NE monsoon', '10 月–次年 5 月：干燥的东北季风', { c: C.orange, t: 2 }), mk([19.08, 72.88], 'Mumbai', '孟买', { dot: true, t: 1 }), mk([25.3, 91.7], 'Cherrapunji', '乞拉朋齐', { dot: true, t: 1.4 })],
        fig: { k: 'climo', city: 'mumbai' },
        body: ['India has a tropical monsoon climate with a wet and a dry season. From June to September the south-west monsoon blows in from the Indian Ocean and brings heavy rain; the rest of the year is dry. If the monsoon comes late or weak there is drought; too strong, and floods follow.',
          '印度大部分属于热带季风气候，一年分为旱季和雨季。6–9 月，西南季风从印度洋吹来，带来大量降水；其余月份比较干燥。季风来得晚、势力弱时容易发生旱灾，势力强时又易发生洪涝。'],
      },
      {
        title: ['The Green Revolution', '绿色革命'], cam: [26, 79, 2.6], items: ['goldentemple'],
        paint: [{ fill: { k: 'land', a2: ['IN'], c: C.orange }, a: 0.25 }, { fill: { k: 'poly', pts: [[32.5, 74], [31.5, 77], [29.5, 77.5], [28.5, 76.5], [29.5, 73.5], [30.5, 73.5]], c: C.green }, t: 0.4, a: 0.7 }],
        marks: [mk([30.8, 75.5], 'Punjab: wheat bowl', '旁遮普：小麦产区', { dot: true, c: C.green, t: 0.8 }), mk([22.5, 88.3], 'Rice in the wet east', '东部湿润区：水稻', { c: C.lime, t: 1.2 })],
        fig: { k: 'line', title: ['India\'s grain harvest (approx.)', '印度粮食产量（约）'], unit: ['million tonnes', '百万吨'], x: [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020], series: [{ name: ['Grain', '粮食'], c: C.green, y: [51, 82, 108, 130, 176, 197, 245, 310] }], notes: [{ x: 1966, text: ['Green Revolution', '绿色革命'] }], min: 0 },
        body: ['In the 1960s India often faced famine. Then, in the "Green Revolution", farmers planted high-yield seeds of wheat and rice and used more irrigation and fertiliser. Harvests grew fast, and India now grows enough grain to feed itself and even export rice. Rice grows in the wet east, wheat in the drier north-west.',
          '20 世纪 60 年代，印度经常闹饥荒。后来通过“绿色革命”，推广小麦和水稻高产品种，扩大灌溉，增施化肥，粮食产量迅速增长，基本实现了自给，还出口大米。水稻主要分布在湿润的东部，小麦主要分布在较干旱的西北部。'],
      },
      {
        title: ['1.4 billion people', '14 亿人口'], cam: [22, 80, 3.0], items: ['taj'],
        marks: [mk([28.6, 77.2], 'New Delhi', '新德里', { dot: true, big: true, t: 0.4 }), mk([19.08, 72.88], 'Mumbai', '孟买', { dot: true, t: 0.7 }), mk([22.57, 88.36], 'Kolkata', '加尔各答', { dot: true, t: 1 }), mk([27.17, 78.04], 'Agra: Taj Mahal', '阿格拉：泰姬陵', { t: 1.3 })],
        fig: { k: 'pyramid', a: 'india', b: 'china' },
        body: ['In 2023 India passed China to have the most people of any country, about 1.4 billion. Its population is young and still growing. Big numbers of workers can help the economy grow, but also put pressure on jobs, housing, schools and the environment.',
          '2023 年，印度人口超过中国，约 14 亿，居世界第一。印度人口年轻，仍在增长。众多的劳动力有利于经济发展，但也给就业、住房、教育和环境带来很大压力。'],
      },
      {
        title: ['India\'s Silicon Valley', '“印度硅谷”'], cam: [15, 78, 2.6],
        lines: [{ pts: [[12.97, 77.59], [25, 60], [40, 20], [45, -40], [37.4, -122.1]], c: C.violet, t: 0.6, w: 1.4, flow: true, arrow: true, dur: 2.4 }],
        marks: [mk([12.97, 77.59], 'Bengaluru', '班加罗尔', { dot: true, big: true, c: C.violet, t: 0.3 }), mk([17.4, 78.5], 'Hyderabad', '海得拉巴', { dot: true, t: 0.8 })],
        body: ['Bengaluru is called India\'s Silicon Valley. Many young engineers speak English, wages are lower, and India\'s working day falls during America\'s night, so companies can work around the clock. Software and IT services are now a major export.',
          '班加罗尔被称为“印度硅谷”。这里有大量会说英语的年轻工程师，劳动力成本较低，而且与美国有时差，可以昼夜不停地工作。软件和信息技术服务已成为印度重要的出口产业。'],
      },
    ],
    quiz: [
      { q: ['Which climate graph is Mumbai\'s?', '下图最可能是哪里的气候资料图？'], fig: { k: 'climo', city: 'mumbai', blind: true }, options: [['India: tropical monsoon', '印度：热带季风气候'], ['London: maritime', '伦敦：温带海洋性气候'], ['Cairo: desert', '开罗：热带沙漠气候'], ['Moscow: continental', '莫斯科：温带大陆性气候']], answer: 0,
        why: ['Hot all year, almost all the rain in June–September.', '全年高温，降水集中在 6–9 月。'] },
      { q: ['Why does India often suffer droughts and floods?', '印度旱涝灾害频繁的主要原因是'], options: [['The monsoon is unreliable', '季风不稳定'], ['It has no rivers', '没有河流'], ['It is too cold', '气候寒冷'], ['It is in a desert', '位于沙漠中']], answer: 0,
        why: ['A late or weak monsoon means drought; a strong one means floods.', '季风来得晚、势力弱易旱，势力强易涝。'] },
      { q: ['Find Bengaluru, India\'s Silicon Valley.', '在地球上点出“印度硅谷”班加罗尔。'], at: [12.97, 77.59], tolKm: 400,
        why: ['It is on the Deccan Plateau in southern India.', '它位于印度南部的德干高原上。'] },
      { q: ['The Green Revolution helped India by…', '“绿色革命”帮助印度'], options: [['Growing much more grain', '大幅提高了粮食产量'], ['Planting more forests', '大量植树造林'], ['Building software parks', '建设软件园'], ['Stopping the monsoon', '阻止了季风']], answer: 0,
        why: ['High-yield seeds, irrigation and fertiliser raised harvests.', '高产品种、灌溉和化肥提高了粮食产量。'] },
    ],
  },
  {
    id: 'usa', strand: 'world', tracks: ['us'], grade: 'g7b', unit: west, icon: 'flag', minutes: 6,
    title: ['The United States', '美国'],
    blurb: ['A nation of immigrants on a land of mountains and plains, with farm belts and high-tech valleys.', '移民国家：西部山地、中部平原、东部山地，农业带和高新技术产业。'],
    keys: [
      ['The USA is a nation of immigrants from every continent.', '美国是一个移民国家，居民来自世界各地。'],
      ['Mountains in the west and east, a great plain in the middle drained by the Mississippi.', '地形西部是高大山地，中部是平原，东部是低缓山地；密西西比河流经中部。'],
      ['Farming is specialised in belts: corn, wheat, cotton, dairy.', '农业地区专业化：玉米带、小麦区、棉花带、乳畜带。'],
      ['High-tech industry leads, as in Silicon Valley.', '高新技术产业发达，如“硅谷”。'],
    ],
    steps: [
      {
        title: ['A nation of immigrants', '移民国家'], cam: [38, -95, 3.4], items: ['liberty'],
        paint: [{ fill: { k: 'land', a2: ['US'], c: C.blue }, a: 0.4 }],
        lines: [route([[50, -5], [45, -40], [40.7, -74]], 0.4, C.gold), route([[10, -15], [20, -45], [32.8, -79.9]], 0.8, C.orange), route([[19.4, -99.1], [29.4, -98.5]], 1.2, C.green), route([[31, 121], [40, 180], [37.8, -122.4]], 1.4, C.pink)],
        marks: [mk([40.69, -74.04], 'Statue of Liberty', '自由女神像', { dot: true, t: 0.3 }), mk([45, -35], 'from Europe', '来自欧洲', { c: C.gold, t: 1.4 }), mk([18, -40], 'from Africa', '来自非洲', { c: C.orange, t: 1.8 })],
        fig: { k: 'pie', title: ['Americans by origin, 2020 (approx.)', '2020 年美国居民构成（约）'], parts: [
          { name: ['White (European origin)', '白人（欧洲裔）'], v: 58, c: C.gold }, { name: ['Hispanic / Latino', '拉美裔'], v: 19, c: C.green },
          { name: ['Black (African origin)', '黑人（非洲裔）'], v: 12, c: C.orange }, { name: ['Asian', '亚裔'], v: 6, c: C.pink }, { name: ['Native & other', '印第安人及其他'], v: 5, c: C.violet },
        ] },
        body: ['About 335 million people live in the USA. Native Americans lived here first; then came Europeans, Africans brought as slaves, and later Latin Americans and Asians. That mix is why it is called a nation of immigrants, and why English, Spanish and many other languages are spoken.',
          '美国约有 3.35 亿人。印第安人是这里的原住民；后来欧洲移民来到这里，大批非洲黑人被贩卖为奴，再后来拉美和亚洲移民不断迁入。因此美国被称为“移民国家”，人们说英语、西班牙语和许多其他语言。'],
      },
      {
        title: ['Mountains, plains, mountains', '西部山地、中部平原、东部山地'], cam: [39, -98, 3.2], sketch: true, items: ['grandcanyon', 'gatewayarch'],
        paint: [{ fill: { k: 'poly', pts: US_WEST, c: C.brown, clip: ['US'] }, t: 0.2, a: 0.55 }, { fill: { k: 'poly', pts: US_PLAINS, c: C.lime, clip: ['US'] }, t: 0.6, a: 0.45 }, { fill: { k: 'poly', pts: US_EAST, c: C.orange, clip: ['US'] }, t: 1.0, a: 0.5 }],
        lines: [{ pts: ROCKIES, c: C.brown, t: 0.3, w: 2.2, dur: 1.4 }, { pts: APPALACHIANS, c: C.orange, t: 1.1, w: 2, dur: 1.2 }, flow(MISSOURI, 1.5), flow(MISSISSIPPI, 1.8)],
        marks: [mk([41, -110], 'Rocky Mountains', '落基山脉', { c: C.brown, t: 0.8 }), mk([40, -98], 'Central Plains', '中部平原', { c: C.lime, t: 1.2 }), mk([38, -79.5], 'Appalachians', '阿巴拉契亚山脉', { c: C.orange, t: 1.5 }), mk([33, -91.5], 'Mississippi', '密西西比河', { c: C.blue, t: 2.4 })],
        body: ['The land falls into three north–south strips: high, young mountains such as the Rockies in the west; a huge central plain; and the lower, older Appalachians in the east. The Mississippi and its tributary the Missouri drain the plain into the Gulf of Mexico.',
          '美国地形大致分为南北延伸的三部分：西部是高大的落基山脉等山地；中部是广阔的平原；东部是较低缓的阿巴拉契亚山脉。密西西比河及其支流密苏里河流经中部平原，注入墨西哥湾。'],
      },
      {
        title: ['Farm belts', '农业地区专业化'], cam: [39, -95, 3.0], sketch: true, items: ['an_bison'],
        paint: [
          { fill: { k: 'poly', pts: DAIRY, c: C.white }, t: 0.2, a: 0.55 }, { fill: { k: 'poly', pts: CORN, c: C.gold }, t: 0.5, a: 0.6 },
          { fill: { k: 'poly', pts: WHEAT_S, c: C.brown }, t: 0.8, a: 0.6 }, { fill: { k: 'poly', pts: WHEAT_W, c: C.orange }, t: 1.0, a: 0.6 },
          { fill: { k: 'poly', pts: COTTON, c: C.pink, clip: ['US'] }, t: 1.2, a: 0.55 },
        ],
        fig: { k: 'key', set: 'custom', title: ['US farm belts (sketch)', '美国农业带（示意）'], items: [
          { c: C.white, name: ['Dairy belt', '乳畜带'] }, { c: C.gold, name: ['Corn belt', '玉米带'] }, { c: C.brown, name: ['Spring wheat', '春小麦区'] },
          { c: C.orange, name: ['Winter wheat', '冬小麦区'] }, { c: C.pink, name: ['Cotton belt', '棉花带'] },
        ] },
        body: ['American farms are big, highly mechanised and specialised: each region grows what suits its climate and soil best. Dairy is near the cool Great Lakes, corn in the warm, wet Midwest, wheat on the drier plains, and cotton in the hot South. Fewer than 2 in 100 workers farm, yet the USA is a top food exporter.',
          '美国农场规模大，机械化水平高，并按照各地的自然条件形成了专业化的农业带：五大湖附近是乳畜带，中部湿润的平原是玉米带，较干旱的大平原是小麦区，南部炎热地区是棉花带。务农人口不到总劳动力的 2%，美国却是世界上最大的农产品出口国之一。'],
      },
      {
        title: ['High-tech industry', '高新技术产业'], cam: [38, -105, 3.4], items: ['goldengate'],
        paint: [{ fill: { k: 'poly', pts: [[42, -91], [43, -76], [40, -73.5], [38.8, -77], [39.5, -88]], c: C.violet, clip: ['US'] }, t: 0.3, a: 0.45 }, { fill: { k: 'poly', pts: [[37, -125], [37, -76], [33, -76], [25, -81], [26, -97], [32, -117]], c: C.gold, clip: ['US'] }, t: 0.8, a: 0.3 }],
        marks: [mk([37.4, -122.1], 'Silicon Valley', '硅谷', { dot: true, big: true, c: C.gold, t: 0.4 }), mk([41.5, -82], 'Old industrial belt', '东北部传统工业区', { c: C.violet, t: 0.9 }), mk([31, -100], 'Sun Belt', '“阳光地带”', { c: C.gold, t: 1.3 }), mk([29.7, -95.4], 'Houston', '休斯敦', { dot: true, t: 1.6 })],
        body: ['Steel and car factories first grew around the Great Lakes, near coal and iron. Today new high-tech industries such as computers, chips, aircraft and space lead the economy. Silicon Valley, near San Francisco, gathers top universities and tech companies, and many industries have moved south and west to the sunny "Sun Belt".',
          '美国东北部五大湖附近煤、铁资源丰富，钢铁和汽车等传统工业最早在那里发展。如今，电子、芯片、航空航天等高新技术产业成为经济的主导。旧金山附近的“硅谷”集中了著名大学和高科技企业，许多产业向南部和西部的“阳光地带”转移。'],
      },
    ],
    quiz: [
      { q: ['From west to east, US landforms are…', '美国地形从西向东依次是'], options: [['High mountains, central plain, lower mountains', '高大山地、中部平原、低缓山地'], ['Plain, mountains, plain', '平原、山地、平原'], ['Plateau everywhere', '全是高原'], ['Desert, rainforest, desert', '沙漠、雨林、沙漠']], answer: 0,
        why: ['The Rockies, the central plain, then the Appalachians.', '依次是落基山脉、中部平原、阿巴拉契亚山脉。'] },
      { q: ['Find Silicon Valley.', '在地球上点出“硅谷”。'], at: [37.4, -122.1], tolKm: 400,
        why: ['It is just south of San Francisco, California.', '它位于加利福尼亚州旧金山以南。'] },
      { q: ['Why does the corn belt lie in the Midwest?', '美国玉米带分布在中部的原因是'], options: [['Flat land, fertile soil, warm wet summers', '地势平坦、土壤肥沃、夏季温暖湿润'], ['It is a desert', '那里是沙漠'], ['It is very mountainous', '那里山地多'], ['It is very cold all year', '全年寒冷']], answer: 0,
        why: ['Farming belts match natural conditions: that is specialisation.', '农业带与自然条件相适应，这就是地区专业化。'] },
      { q: ['The USA is called a nation of immigrants because…', '美国被称为移民国家，是因为'], options: [['Most people\'s families came from other continents', '大多数居民的祖先来自其他大洲'], ['Nobody lives there', '那里没有人居住'], ['Everyone speaks one language', '所有人说同一种语言'], ['It has no cities', '没有城市']], answer: 0,
        why: ['Europeans, Africans, Latin Americans and Asians all moved there.', '欧洲人、非洲人、拉美人和亚洲人都迁入美国。'] },
    ],
  },
  {
    id: 'brazil', strand: 'world', tracks: ['us', 'ib'], grade: 'g7b', unit: west, icon: 'leaf', minutes: 5,
    title: ['Brazil', '巴西'],
    blurb: ['The giant of South America: the Amazon rainforest, coffee and soybeans, and a mixed, lively culture.', '南美洲的大国：亚马孙雨林、咖啡和大豆，以及多元的混血文化。'],
    keys: [
      ['Brazil is the largest country in South America.', '巴西是南美洲面积最大的国家。'],
      ['The Amazon rainforest is the world\'s largest and must be protected.', '亚马孙热带雨林是世界上面积最大的热带雨林，需要保护。'],
      ['Its people mix Indigenous, Portuguese and African roots.', '巴西居民由印第安人、葡萄牙等欧洲移民和非洲黑人后裔混血而成。'],
      ['Brazil leads the world in coffee and soybeans.', '巴西的咖啡和大豆产量居世界前列。'],
    ],
    steps: [
      {
        title: ['Giant of South America', '南美洲最大的国家'], cam: [-12, -54, 3.4], items: ['redeemer'],
        paint: [{ fill: { k: 'continents', only: ['south-america'] }, a: 0.3 }, { fill: { k: 'land', a2: ['BR'], c: C.green }, t: 0.4, a: 0.55 }],
        lines: [par(0, C.gold, 0.8), { pts: [[-23.44, -75], [-23.44, -40]], c: C.orange, t: 1, rhumb: true, dur: 1.4 }],
        marks: [mk([-10, -52], 'Brazil', '巴西', { big: true, t: 0.6 }), mk([-15.8, -47.9], 'Brasília', '巴西利亚', { dot: true, t: 1.2 }), mk([-22.9, -43.2], 'Rio de Janeiro', '里约热内卢', { dot: true, t: 1.5 }), mk([-23.55, -46.6], 'São Paulo', '圣保罗', { dot: true, t: 1.8 })],
        body: ['Brazil covers about 8.5 million km², almost half of South America, and has about 200 million people. The equator crosses the north and the Tropic of Capricorn the south, so most of it is tropical. Most people live in big cities near the south-east coast.',
          '巴西面积约 850 万平方千米，约占南美洲的一半，人口约 2 亿。赤道穿过北部，南回归线穿过南部，大部分国土位于热带。人口和城市主要集中在东南沿海。'],
      },
      {
        title: ['The Amazon rainforest', '亚马孙热带雨林'], cam: [-4, -62, 3.0], items: ['an_jaguar', 'an_macaw', 'pl_kapok'],
        paint: [{ fill: { k: 'poly', pts: REGIONS.amazon, c: C.green }, t: 0.3, a: 0.6 }],
        lines: [flow(AMAZON_R, 0.6)],
        marks: [mk([-3.1, -60.0], 'Manaus', '马瑙斯', { dot: true, t: 1.4 }), mk([-1.5, -63], 'Amazon River', '亚马孙河', { c: C.blue, t: 1.8 })],
        fig: { k: 'climo', city: 'singapore' },
        body: ['The Amazon basin holds the world\'s largest tropical rainforest, home to perhaps one in ten of all known species, from jaguars to macaws. The Amazon River carries more water than any other river. It is hot and wet all year, much like Singapore\'s climate shown here.',
          '亚马孙平原上分布着世界上面积最大的热带雨林，生活着全球约十分之一的已知物种，如美洲豹和金刚鹦鹉。亚马孙河是世界上流量最大的河流。这里终年高温多雨，气候与图中的新加坡相似。'],
      },
      {
        title: ['Protecting the forest', '保护热带雨林'], cam: [-8, -58, 3.0], sketch: true,
        paint: [{ fill: { k: 'poly', pts: REGIONS.amazon, c: C.green }, a: 0.5 }, { fill: { k: 'poly', pts: [[-6, -48], [-3, -48.5], [-6, -52], [-9, -60], [-11, -64], [-12.5, -60], [-11, -52], [-8, -49]], c: C.orange, clip: ['BR'] }, t: 0.6, a: 0.6 }],
        marks: [mk([-9.5, -56], '"Arc of deforestation"', '“毁林弧”', { c: C.orange, big: true, t: 1 })],
        fig: { k: 'line', title: ['Amazon forest cleared each year in Brazil (approx.)', '巴西亚马孙每年毁林面积（约）'], unit: ['thousand km²', '千平方千米'], x: [1995, 2000, 2004, 2008, 2012, 2016, 2019, 2023], series: [{ name: ['Cleared', '毁林面积'], c: C.orange, y: [29, 18, 28, 13, 4.6, 7.9, 10, 9] }], min: 0 },
        body: ['Forest has been cut for cattle ranches, soybean fields, logging, mines and roads, mostly along the southern and eastern edge. The rainforest stores huge amounts of carbon and makes rain, so losing it affects the whole world. Brazil now watches the forest by satellite and protects large reserves.',
          '为了开辟牧场、种植大豆、采伐木材、开矿和修路，雨林遭到砍伐，主要发生在雨林的南缘和东缘。热带雨林储存大量的碳，还能调节降水，被称为“地球之肺”，它的破坏影响全世界。如今巴西利用卫星监测雨林，并建立了大面积的保护区。'],
      },
      {
        title: ['A mixed culture', '多元的混血文化'], cam: [-15, -45, 2.8], items: ['fs_rio', 'redeemer'],
        lines: [route([[38.7, -9.1], [20, -25], [-8, -34.9]], 0.3, C.gold), route([[6, 2], [-5, -15], [-12.97, -38.5]], 0.7, C.orange)],
        marks: [mk([30, -18], 'from Portugal', '来自葡萄牙', { c: C.gold, t: 1 }), mk([2, -8], 'from Africa', '来自非洲', { c: C.orange, t: 1.4 }), mk([-22.9, -43.2], 'Rio Carnival', '里约狂欢节', { dot: true, t: 1.8 })],
        fig: { k: 'pie', title: ['Brazilians by group, 2022 census (approx.)', '2022 年巴西居民构成（约）'], parts: [
          { name: ['Mixed (pardo)', '混血种人'], v: 45, c: C.lime }, { name: ['White', '白人'], v: 44, c: C.gold }, { name: ['Black', '黑人'], v: 10, c: C.orange }, { name: ['Indigenous & Asian', '印第安人及亚裔'], v: 1, c: C.violet },
        ] },
        body: ['Indigenous peoples lived here first. Portugal ruled Brazil for 300 years, so Brazilians speak Portuguese, and millions of Africans were brought as slaves. Over time these groups mixed: mixed-race people are now the largest group. Samba, football and the Rio Carnival show this lively blend.',
          '印第安人是这里的原住民。巴西曾是葡萄牙的殖民地长达 300 多年，所以通用葡萄牙语；殖民者还从非洲贩运来大批黑奴。各种族长期通婚，混血种人如今是最大的群体。桑巴舞、足球和里约狂欢节都体现了这种多元文化。'],
      },
      {
        title: ['Coffee, soybeans and development', '咖啡、大豆与经济发展'], cam: [-18, -50, 2.8], items: ['pl_coffee', 'iguazu'],
        paint: [{ fill: { k: 'poly', pts: [[-15, -48], [-14, -40], [-22, -40], [-24, -47], [-22.5, -50]], c: C.brown, clip: ['BR'] }, t: 0.3, a: 0.6 }, { fill: { k: 'poly', pts: [[-10, -60], [-10, -46], [-15, -46], [-20, -51], [-30, -50], [-30, -56], [-17, -58]], c: C.lime, clip: ['BR'] }, t: 0.7, a: 0.45 }],
        marks: [mk([-19, -44], 'Coffee', '咖啡', { c: C.brown, t: 0.6 }), mk([-13, -55], 'Soybeans', '大豆', { c: C.lime, t: 1 }), mk([-25.7, -54.4], 'Iguazu Falls', '伊瓜苏瀑布', { dot: true, t: 1.4 }), mk([-15.8, -47.9], 'Brasília', '巴西利亚', { dot: true, t: 1.7 })],
        fig: { k: 'bars', title: ['Brazil\'s share of world output (approx.)', '巴西产量占世界的比重（约）'], unit: ['%', '%'], rows: [
          { name: ['Coffee', '咖啡'], v: 35, c: C.brown }, { name: ['Soybeans', '大豆'], v: 40, c: C.lime }, { name: ['Sugar cane', '甘蔗'], v: 40, c: C.green }, { name: ['Iron ore', '铁矿石'], v: 15, c: C.red },
        ] },
        body: ['Brazil is the world\'s biggest producer of coffee and soybeans and a huge exporter of beef, sugar and iron ore; China buys much of its soy. It is a developing country building modern industry, from cars to aircraft. In 1960 the capital moved inland to Brasília to help develop the interior.',
          '巴西是世界上最大的咖啡和大豆生产国，牛肉、蔗糖和铁矿石的出口量也很大，大豆很多出口到中国。巴西是发展中国家，正在发展汽车、飞机制造等现代工业。1960 年，首都从里约热内卢迁到内陆的巴西利亚，以带动内陆的开发。'],
      },
    ],
    quiz: [
      { q: ['Find the Amazon rainforest.', '在地球上点出亚马孙热带雨林。'], at: [-4, -62], tolKm: 900,
        why: ['It covers the Amazon basin in northern Brazil.', '它分布在巴西北部的亚马孙平原。'] },
      { q: ['Why is the Amazon rainforest called the "lungs of the Earth"?', '亚马孙热带雨林为什么被称为“地球之肺”？'], options: [['It takes in carbon dioxide and gives out oxygen', '它吸收二氧化碳，释放氧气'], ['It is shaped like a lung', '形状像肺'], ['It is very dry', '非常干燥'], ['It has no animals', '没有动物']], answer: 0,
        why: ['Its trees store carbon and help keep the climate stable.', '雨林储存大量的碳，有助于稳定全球气候。'] },
      { q: ['What language do most Brazilians speak?', '巴西的通用语言是'], options: [['Portuguese', '葡萄牙语'], ['Spanish', '西班牙语'], ['English', '英语'], ['French', '法语']], answer: 0,
        why: ['Brazil was a Portuguese colony.', '巴西曾是葡萄牙的殖民地。'] },
      { q: ['Brazil is the world\'s biggest producer of…', '巴西是世界上最大的哪种农产品生产国？'], options: [['Coffee', '咖啡'], ['Wheat', '小麦'], ['Tea', '茶叶'], ['Rubber', '橡胶']], answer: 0,
        why: ['It grows about a third of the world\'s coffee.', '巴西的咖啡产量约占世界的三分之一。'] },
    ],
  },
];
