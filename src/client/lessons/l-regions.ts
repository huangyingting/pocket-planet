/** 七下 · 认识大洲、我们邻近的地区和国家、极地: Asia, Japan & Southeast Asia, Australia, the polar regions. */
import { C, T, arrows, mk, par, type Lesson } from './kit.ts';
import { REGIONS, RIVERS } from './geo.ts';

const regions = ['Continents and regions', '大洲和地区'] as const;
const poles = ['The polar regions', '极地地区'] as const;
const flow = (pts: [number, number][], t: number) => ({ pts, c: C.blue, t, w: 1.4, flow: true, arrow: true, dur: 1.6 });

export const REGIONS_L: Lesson[] = [
  {
    id: 'asia', grade: 'g7b', unit: regions, icon: 'mountain', minutes: 5,
    title: ['Asia', '亚洲'],
    blurb: ['The biggest continent: high in the middle, rivers running out in every direction, monsoon winds.', '最大的大洲：中部高、四周低，河流呈放射状，季风显著。'],
    steps: [
      {
        title: ['The largest continent', '面积最大的大洲'], cam: [40, 95, 4.6],
        paint: [{ fill: { k: 'continents', only: ['asia'] }, a: 0.55 }],
        marks: [mk([45, 95], 'Asia: ~44 million km²', '亚洲：约 4400 万平方千米', { big: true, t: 0.6 })],
        body: ['Asia is the largest continent and has the most people. It stretches from the Arctic Ocean to the equator and beyond, and from the Mediterranean to the Pacific, across three of the four oceans\' shores.',
          '亚洲是世界上面积最大、人口最多的大洲。它北临北冰洋，东临太平洋，南临印度洋，跨寒、温、热三带。'],
      },
      {
        title: ['High in the middle', '中部高、四周低'], cam: [38, 90, 3.6], items: ['everest', 'an_snowleopard'],
        paint: [{ fill: { k: 'continents', only: ['asia'] }, a: 0.3 }, { fill: { k: 'poly', pts: REGIONS.asiaHigh, c: C.brown }, t: 0.6, a: 0.6 }],
        marks: [mk([38, 90], 'Plateaus and high mountains', '高原和高大山脉', { big: true, c: C.brown, t: 1 })],
        body: ['Asia\'s land is high in the middle and low around the edges. In the centre are great plateaus and mountain ranges, with the Qinghai–Tibet Plateau and Everest at the heart.',
          '亚洲地势中部高、四周低。中部是高原和高大山脉，青藏高原和珠穆朗玛峰就在这里。'],
      },
      {
        title: ['Rivers flow outward', '河流呈放射状'], cam: [42, 95, 4],
        paint: [{ fill: { k: 'poly', pts: REGIONS.asiaHigh, c: C.brown }, a: 0.45 }],
        lines: [flow(RIVERS.ob, 0.2), flow(RIVERS.yenisei, 0.4), flow(RIVERS.lena, 0.6), flow(RIVERS.yangtze, 0.8), flow(RIVERS.yellow, 1), flow(RIVERS.mekong, 1.2), flow(RIVERS.ganges, 1.4), flow(RIVERS.indus, 1.6)],
        marks: [mk([64, 70], 'Ob → Arctic Ocean', '鄂毕河 → 北冰洋', { t: 1.6, c: C.blue }), mk([31, 117], 'Yangtze → Pacific', '长江 → 太平洋', { t: 2, c: C.blue }), mk([24, 87], 'Ganges → Indian Ocean', '恒河 → 印度洋', { t: 2.4, c: C.blue })],
        body: ['Because the middle is high, big rivers start there and run outward in all directions: north into the Arctic Ocean, east into the Pacific and south into the Indian Ocean.',
          '由于地势中部高，大河多发源于中部的高原山地，呈放射状流向四周：向北流入北冰洋，向东流入太平洋，向南流入印度洋。'],
      },
      {
        title: ['Monsoon winds', '季风气候显著'], cam: [25, 110, 3.8], sketch: true, items: ['halong'],
        lines: arrows([[[5, 125], [22, 117]], [[10, 135], [28, 125]], [[0, 85], [15, 88]], [[2, 72], [18, 77]]], C.teal, 0, 2),
        marks: [mk([20, 128], 'Summer: wet winds from the sea', '夏季：海洋吹来湿润的风', { c: C.teal, t: 1 })],
        body: ['East and South Asia have monsoon climates. In summer, warm wet winds blow from the sea and bring heavy rain; in winter, cold dry winds blow from the land. Rainfall is concentrated in summer.',
          '亚洲东部和南部是季风气候。夏季，温暖湿润的风从海洋吹来，降水丰富；冬季，寒冷干燥的风从大陆吹来。降水集中在夏季。'],
      },
    ],
    quiz: [
      { q: ['The land of Asia is…', '亚洲的地势特点是'], options: [['High in the middle, low around the edges', '中部高、四周低'], ['High in the east, low in the west', '东高西低'], ['Flat everywhere', '到处平坦'], ['Low in the middle', '中部低、四周高']], answer: 0,
        why: ['Plateaus and mountains in the centre, plains around the edges.', '中部是高原山地，四周是平原。'] },
      { q: ['So Asia\'s big rivers…', '因此，亚洲的大河'], options: [['Flow outward in all directions', '呈放射状流向四周'], ['All flow north', '都向北流'], ['All flow into one lake', '都流入一个湖'], ['All flow east', '都向东流']], answer: 0,
        why: ['They start in the high centre and radiate outward.', '它们发源于中部高地，呈放射状流向四周。'] },
      { q: ['The Ob flows into the…', '鄂毕河注入'], options: [['Arctic Ocean', '北冰洋'], ['Pacific', '太平洋'], ['Indian Ocean', '印度洋'], ['Atlantic', '大西洋']], answer: 0,
        why: ['It flows north across Siberia.', '它向北流经西伯利亚，注入北冰洋。'] },
      { q: ['Find the Qinghai–Tibet Plateau.', '在地球上点出青藏高原。'], at: [32.5, 88], tolKm: 700,
        why: ['It is in south-west China, north of the Himalayas.', '它位于我国西南部，喜马拉雅山脉以北。'] },
    ],
  },
  {
    id: 'neighbours', grade: 'g7b', unit: regions, icon: 'volcano', minutes: 5,
    title: ['Japan and Southeast Asia', '日本和东南亚'],
    blurb: ['An island country on shaky ground, and the crossroads between two oceans.', '多火山地震的岛国，和两大洋之间的“十字路口”。'],
    steps: [
      {
        title: ['Japan: an island country', '日本：岛国'], cam: [36, 138, 1.9], tectonics: true, items: ['fuji', 'vo_sakurajima'],
        paint: [{ fill: { k: 'land', a2: ['JP'], c: C.red }, a: 0.55 }],
        marks: [mk([43.5, 142.5], 'Hokkaido', '北海道', { t: 0.5 }), mk([36.5, 139], 'Honshu', '本州', { t: 0.8 }), mk([33.6, 133.4], 'Shikoku', '四国', { t: 1.1 }), mk([32.6, 130.9], 'Kyushu', '九州', { t: 1.4 })],
        body: ['Japan is made of four big islands, Hokkaido, Honshu, Shikoku and Kyushu, and many small ones. Mountains cover most of the land, and Mount Fuji is the highest peak.',
          '日本由北海道、本州、四国、九州四个大岛和许多小岛组成。山地丘陵占大部分，富士山是最高峰。'],
      },
      {
        title: ['On a plate boundary', '位于板块交界处'], cam: [34, 145, 2.6], tectonics: true, items: ['fuji', 'vo_sakurajima'],
        lines: arrows([[[30, 165], [33, 147]], [[40, 168], [40, 149]]], C.red, 0.2, 2.2),
        marks: [mk([38, 160], 'Pacific Plate', '太平洋板块', { big: true, c: C.gold, t: 0.4 }), mk([45, 125], 'Eurasian Plate', '亚欧板块', { big: true, c: C.gold, t: 0.6 })],
        body: ['Japan lies where the Pacific Plate dives under the Eurasian Plate, so it has many volcanoes and earthquakes, and tsunamis can strike its coasts.',
          '日本位于太平洋板块和亚欧板块的交界处，地壳活跃，多火山和地震，沿海还可能发生海啸。'],
      },
      {
        title: ['The Strait of Malacca', '马六甲海峡'], cam: [8, 105, 2.6], items: ['vy_zhenghe'],
        lines: [{ pts: [[22, 116], [10, 110], [1.3, 104.3], [2.5, 101.3], [5.8, 97.5], [6, 80]], c: C.gold, w: 1.6, flow: true, arrow: true, dur: 2.2 }],
        marks: [mk([2.6, 101], 'Strait of Malacca', '马六甲海峡', { dot: true, big: true, c: C.gold, t: 1.6 })],
        body: ['Southeast Asia sits between the Pacific and Indian Oceans and between Asia and Oceania. Ships between East Asia and Europe pass through the Strait of Malacca: it is one of the busiest sea lanes in the world. Zheng He\'s fleet sailed through it 600 years ago.',
          '东南亚位于亚洲和大洋洲、太平洋和印度洋之间的“十字路口”。东亚往来欧洲的船只要经过马六甲海峡，它是世界上最繁忙的海峡之一。600 年前，郑和船队就曾经过这里。'],
      },
      {
        title: ['Rivers of Indochina', '中南半岛的河流'], cam: [17, 102, 2.2], items: ['angkor', 'borobudur'],
        lines: [flow(RIVERS.mekong, 0.2), flow(RIVERS.irrawaddy, 0.6), flow(RIVERS.chaophraya, 1)],
        marks: [mk([15, 105.8], 'Mekong', '湄公河', { c: C.blue, t: 1.2 }), mk([20, 95.2], 'Irrawaddy', '伊洛瓦底江', { c: C.blue, t: 1.4 })],
        body: ['On the Indochina Peninsula, mountains and rivers run north to south, and the rivers come down from China. The Mekong starts in China as the Lancang. Cities and rice fields crowd the river valleys and deltas.',
          '中南半岛地势北高南低，山河相间、纵列分布，许多河流发源于我国。湄公河的上游就是我国的澜沧江。城市和稻田多分布在河流沿岸和三角洲。'],
      },
    ],
    quiz: [
      { q: ['Japan has many earthquakes because it…', '日本多地震，是因为'], options: [['Lies on a plate boundary', '位于板块交界处'], ['Is very cold', '气候寒冷'], ['Has big rivers', '河流众多'], ['Is near the equator', '靠近赤道']], answer: 0,
        why: ['The Pacific and Eurasian plates meet here.', '太平洋板块和亚欧板块在这里交界。'] },
      { q: ['The Strait of Malacca links…', '马六甲海峡沟通了'], options: [['The Pacific and Indian Oceans', '太平洋和印度洋'], ['The Atlantic and Pacific', '大西洋和太平洋'], ['The Arctic and Atlantic', '北冰洋和大西洋'], ['Two lakes', '两个湖泊']], answer: 0,
        why: ['It is the shortcut between the two oceans.', '它是两大洋之间的捷径。'] },
      { q: ['Find the Strait of Malacca.', '在地球上点出马六甲海峡。'], at: [2.6, 101], tolKm: 500,
        why: ['It runs between the Malay Peninsula and Sumatra.', '它位于马来半岛和苏门答腊岛之间。'] },
    ],
  },
  {
    id: 'australia', grade: 'g7b', unit: regions, icon: 'paw', minutes: 4,
    title: ['Australia', '澳大利亚'],
    blurb: ['A whole continent for one country, and animals found nowhere else.', '一个国家占据一整个大陆，还有世界独有的动物。'],
    steps: [
      {
        title: ['A country that is a continent', '独占一块大陆'], cam: [-25, 135, 2.8],
        paint: [{ fill: { k: 'land', a2: ['AU'], c: C.orange }, a: 0.55 }],
        lines: [par(-23.44, C.orange, 0.6, { dur: 1.4 })],
        marks: [mk([-25, 134], 'Australia', '澳大利亚', { big: true, t: 0.4 }), mk([-23.44, 150], 'Tropic of Capricorn', '南回归线', { c: C.orange, t: 1.4 })],
        body: ['Australia is the only country that covers a whole continent. It lies in the Southern Hemisphere, and the Tropic of Capricorn crosses its middle, so much of it is hot and dry.',
          '澳大利亚是世界上唯一独占一块大陆的国家。它位于南半球，南回归线穿过中部，大部分地区炎热干燥。'],
      },
      {
        title: ['Drifting alone', '长期孤立'], cam: [-25, 135, 3.6], sketch: true,
        lines: arrows([[[-30, 125], [-22, 128]], [[-30, 140], [-22, 143]]], C.red, 0.2, 2.2),
        body: ['Long ago Australia broke away from the other continents and has drifted alone in the ocean ever since. Its animals evolved on their own and kept ancient features.',
          '很久以前，澳大利亚大陆和其他大陆分离，从此长期孤立在海洋中。这里的动物独立演化，保留了许多古老的特征。'],
      },
      {
        title: ['Living fossils', '古老生物的“博物馆”'], cam: [-30, 145, 1.9], items: ['an_kangaroo', 'an_koala', 'an_platypus'],
        body: ['Kangaroos and koalas carry their babies in pouches; the platypus is a mammal that lays eggs. They live naturally only here, which is why Australia is called a "museum of living fossils".',
          '袋鼠和考拉用育儿袋养育幼崽，鸭嘴兽是会下蛋的哺乳动物。它们只生活在这里，所以澳大利亚被称为“活化石博物馆”。'],
      },
      {
        title: ['Three landform regions', '三大地形区'], cam: [-24, 135, 2.8], items: ['uluru', 'reef'], sketch: true,
        paint: [{ fill: { k: 'poly', pts: [[-12, 113], [-12, 133], [-35, 133], [-35, 113]], c: C.brown, clip: ['AU'] }, a: 0.45 },
          { fill: { k: 'poly', pts: [[-12, 133], [-12, 145], [-38, 145], [-38, 133]], c: C.lime, clip: ['AU'] }, t: 0.6, a: 0.45 },
          { fill: { k: 'poly', pts: [[-10, 145], [-10, 154], [-44, 154], [-44, 145]], c: C.green, clip: ['AU'] }, t: 1.2, a: 0.5 }],
        marks: [mk([-25, 122], 'Western plateau', '西部高原', { c: C.brown, t: 0.4 }), mk([-27, 139], 'Central plains', '中部平原', { c: C.lime, t: 1 }), mk([-28, 150.5], 'Eastern mountains', '东部山地', { c: C.green, t: 1.6 })],
        body: ['Australia has a western plateau with deserts and Uluru, central lowland plains, and the Great Dividing Range in the east. Off the north-east coast lies the Great Barrier Reef.',
          '澳大利亚西部是高原，有大片沙漠和乌鲁鲁巨石；中部是平原；东部是大分水岭。东北部沿海有大堡礁。'],
      },
    ],
    quiz: [
      { q: ['Which animal is unique to Australia?', '下列动物中，澳大利亚特有的是'], options: [['Kangaroo', '袋鼠'], ['Panda', '大熊猫'], ['Polar bear', '北极熊'], ['Lion', '狮子']], answer: 0,
        why: ['Kangaroos live wild only in Australia.', '袋鼠只在澳大利亚野外生活。'] },
      { q: ['Australia is special because it…', '澳大利亚的特别之处是'], options: [['Covers a whole continent', '独占一块大陆'], ['Is in the Northern Hemisphere', '位于北半球'], ['Has no deserts', '没有沙漠'], ['Is the biggest country', '是面积最大的国家']], answer: 0,
        why: ['It is the only country that does.', '它是唯一独占一块大陆的国家。'] },
      { q: ['Find Uluru, the great red rock.', '在地球上点出乌鲁鲁巨石。'], at: [-25.3, 131], tolKm: 600,
        why: ['It stands in the middle of Australia.', '它位于澳大利亚中部。'] },
    ],
  },
  {
    id: 'polar', grade: 'g7b', unit: poles, icon: 'aurora', minutes: 5,
    title: ['The polar regions', '极地地区'],
    blurb: ['An icy continent and a frozen ocean, polar days and nights, and China\'s research stations.', '冰雪大陆和冰封的大洋、极昼极夜，以及我国的科考站。'],
    steps: [
      {
        title: ['Antarctica: an icy continent', '南极：冰雪高原大陆'], cam: [-70, 40, 3.4], items: ['an_penguin'],
        paint: [{ fill: { k: 'continents', only: ['antarctica'] }, a: 0.55 }],
        lines: [par(-66.56, C.ice, 0.6, { dur: 1.6 })],
        body: ['Antarctica is a continent covered by ice that is on average about 2,000 m thick: the coldest place on Earth, with strong winds and very little snowfall. Penguins live on its coasts.',
          '南极洲是被平均约 2000 米厚的冰层覆盖的大陆，是世界上最冷的大洲，风大，降水少。企鹅生活在它的沿海。'],
      },
      {
        title: ['The Arctic: an ocean ringed by land', '北极：被陆地环绕的大洋'], cam: [72, 40, 3.4], items: ['an_polarbear', 'vh_icebreaker', 'vy_fram'],
        paint: [{ fill: { k: 'oceans', only: ['arctic'] }, a: 0.55 }],
        lines: [par(66.56, C.ice, 0.6, { dur: 1.6 })],
        body: ['The Arctic is mainly the Arctic Ocean, mostly frozen over and surrounded by the northern edges of Asia, Europe and North America. Polar bears hunt on the sea ice.',
          '北极地区以北冰洋为主，海面大部分被冰覆盖，周围是亚洲、欧洲和北美洲的北部。北极熊在海冰上捕猎。'],
      },
      {
        title: ['Polar day and night', '极昼极夜'], cam: [-60, 60, 3.6], night: true, sun: true,
        clock: { mode: 'year', start: T.marchNoonChina, rate: 24 },
        lines: [par(-66.56, C.ice, 0, { dur: 1.2 }), par(66.56, C.ice, 0.3, { dur: 1.2 })],
        body: ['In the polar regions the Sun may not set for months, or not rise for months. Scientists go to Antarctica in its summer (around our winter), when there is daylight all the time.',
          '在极地，太阳可能几个月都不落下，也可能几个月都不升起。科学家一般在南极的夏季（我们的冬季前后）去考察，那时整天都有阳光。'],
      },
      {
        title: ['China\'s research stations', '我国的极地科考站'], cam: [-75, 80, 3.4],
        marks: [mk([-62.22, -58.96], 'Great Wall (1985)', '长城站（1985）', { dot: true, c: C.gold, t: 0.2 }), mk([-69.37, 76.37], 'Zhongshan (1989)', '中山站（1989）', { dot: true, c: C.gold, t: 0.5 }),
          mk([-80.42, 77.12], 'Kunlun (2009)', '昆仑站（2009）', { dot: true, c: C.gold, t: 0.8 }), mk([-73.86, 76.97], 'Taishan (2014)', '泰山站（2014）', { dot: true, c: C.gold, t: 1.1 }),
          mk([-74.94, 163.7], 'Qinling (2024)', '秦岭站（2024）', { dot: true, c: C.gold, t: 1.4 }), mk([78.92, 11.93], 'Yellow River (Arctic, 2004)', '黄河站（北极，2004）', { dot: true, c: C.teal, t: 1.7 })],
        body: ['China built its first Antarctic station, Great Wall, in 1985. Today there are five in Antarctica (Great Wall, Zhongshan, Kunlun, Taishan and Qinling) and the Yellow River Station in the Arctic.',
          '1985 年，我国在南极建立了第一个科考站——长城站。现在我国在南极有长城站、中山站、昆仑站、泰山站和秦岭站五个科考站，在北极有黄河站。'],
      },
    ],
    quiz: [
      { q: ['Antarctica is a…', '南极地区是'], options: [['Continent covered by ice', '被冰雪覆盖的大陆'], ['Frozen ocean', '冰封的大洋'], ['Group of islands', '一群岛屿'], ['Warm plain', '温暖的平原']], answer: 0,
        why: ['It is land beneath a thick ice sheet.', '它是被厚厚冰层覆盖的陆地。'] },
      { q: ['The Arctic region is mainly…', '北极地区主要是'], options: [['The Arctic Ocean', '北冰洋'], ['A continent', '一块大陆'], ['A desert', '沙漠'], ['Rainforest', '雨林']], answer: 0,
        why: ['An ocean, mostly frozen, ringed by land.', '是大部分被冰覆盖、被陆地环绕的大洋。'] },
      { q: ['China\'s first Antarctic station was…', '我国在南极建立的第一个科考站是'], options: [['Great Wall Station', '长城站'], ['Kunlun Station', '昆仑站'], ['Yellow River Station', '黄河站'], ['Qinling Station', '秦岭站']], answer: 0,
        why: ['Great Wall Station, built in 1985.', '长城站，建于 1985 年。'] },
      { q: ['Find the North Pole.', '在地球上点出北极点。'], at: [90, 0], tolKm: 700,
        why: ['It is in the middle of the Arctic Ocean, where all meridians meet.', '它在北冰洋中部，所有经线在这里相交。'] },
    ],
  },
];
