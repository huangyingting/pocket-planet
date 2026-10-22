/** 七上 · 陆地和海洋, 天气与气候: landforms, continents and oceans, plates, temperature and rainfall. */
import { C, T, arrows, mk, type Lesson } from './kit.ts';
import { ASIA_EUROPE, BERING, EAST_AFRICA_RIFT, MED_HIMALAYA, PANAMA, PLATES, REGIONS, RING_OF_FIRE, SUEZ } from './geo.ts';

const land = ['Land and sea', '陆地和海洋'] as const;
const climate = ['Weather and climate', '天气与气候'] as const;

export const LAND: Lesson[] = [
  {
    id: 'landforms', strand: 'physical', tracks: ['uk',  'us',  'ib',  'au'], grade: 'g7a', unit: land, icon: 'mountain', minutes: 5,
    title: ['Five basic landforms', '五种基本地形'],
    blurb: ['Plains, plateaus, mountains, hills and basins: all of them can be found in China.', '平原、高原、山地、丘陵和盆地，在中国都能找到。'],
    keys: [
      ["Five basic landforms: plains, plateaus, mountains, hills, basins.", "五种基本地形：平原、高原、山地、丘陵、盆地。"],
      ["They differ by height and by relief (how much the ground rises and falls).", "它们的区别在于海拔和起伏。"],
      ["Contour colours on a layered map show height.", "分层设色地形图用颜色表示海拔。"],
    ],
    steps: [
      {
        title: ['Plains', '平原'], cam: [36, 116, 1.9], items: ['forbidden', 'cn_taishan'],
        paint: [{ fill: { k: 'poly', pts: REGIONS.northChinaPlain, c: C.green }, a: 0.55 }],
        marks: [mk([36.5, 115.6], 'North China Plain', '华北平原', { big: true, c: C.green, t: 0.6 })],
        body: ['Plains are low (mostly under 200 m) and flat, with very little rise and fall. They are good for farming and cities. The North China Plain was built up by mud carried down the Yellow River.',
          '平原海拔较低（多在 200 米以下），地面平坦，起伏很小，适合耕种和建城市。华北平原主要由黄河带来的泥沙堆积而成。'],
      },
      {
        title: ['Plateaus', '高原'], cam: [32, 90, 2.4], items: ['potala', 'an_yak'],
        paint: [{ fill: { k: 'poly', pts: REGIONS.tibet, c: C.violet, clip: ['CN'] }, a: 0.5 }],
        marks: [mk([33, 89], 'Qinghai–Tibet Plateau', '青藏高原', { big: true, c: C.violet, t: 0.6 })],
        body: ['Plateaus are high (usually above 500 m) with wide, fairly flat tops and steep edges. The Qinghai–Tibet Plateau averages over 4,000 m: the "roof of the world".',
          '高原海拔较高（一般在 500 米以上），顶面宽广、比较平坦，边缘比较陡。青藏高原平均海拔 4000 米以上，被称为“世界屋脊”。'],
      },
      {
        title: ['Mountains', '山地'], cam: [29, 85, 1.8], items: ['everest', 'an_snowleopard'],
        paint: [{ fill: { k: 'poly', pts: REGIONS.himalaya, c: C.white }, a: 0.55 }],
        marks: [mk([27.99, 86.93], 'Everest 8,849 m', '珠穆朗玛峰 8849 米', { dot: true, c: C.gold, t: 0.8 })],
        body: ['Mountains are high with peaks and steep slopes, often in long ranges. The Himalayas hold the world\'s highest peak, Everest (8,848.86 m).',
          '山地海拔较高，山峰突出，山坡陡峻，常常连绵成山脉。喜马拉雅山脉有世界最高峰——珠穆朗玛峰（8848.86 米）。'],
      },
      {
        title: ['Hills', '丘陵'], cam: [27, 115, 2], items: ['cn_huangshan', 'cn_guilin'],
        paint: [{ fill: { k: 'poly', pts: REGIONS.southeastHills, c: C.lime }, a: 0.5 }],
        marks: [mk([27, 115], 'Southeast Hills', '东南丘陵', { big: true, c: C.lime, t: 0.6 })],
        body: ['Hills are low (mostly under 500 m) with gentle, rounded slopes that rise and fall one after another, like the Southeast Hills of China.',
          '丘陵海拔较低（多在 500 米以下），坡度和缓，地势起伏，连绵不断，比如我国的东南丘陵。'],
      },
      {
        title: ['Basins', '盆地'], cam: [33, 95, 2.8], items: ['leshan'],
        paint: [{ fill: { k: 'poly', pts: REGIONS.sichuan, c: C.orange }, a: 0.6 }, { fill: { k: 'poly', pts: REGIONS.tarim, c: C.brown }, t: 0.6, a: 0.6 }],
        marks: [mk([30.5, 105.6], 'Sichuan Basin', '四川盆地', { big: true, c: C.orange, t: 0.4 }), mk([39.4, 83.5], 'Tarim Basin', '塔里木盆地', { big: true, c: C.brown, t: 1 })],
        body: ['A basin is low in the middle and ringed by higher mountains or plateaus, like a bowl. The Sichuan Basin is warm and fertile; the Tarim Basin, China\'s largest, holds a huge desert.',
          '盆地四周高、中间低，像一个盆。四川盆地温暖湿润、物产丰富；我国最大的塔里木盆地里有大片沙漠。'],
      },
    ],
    quiz: [
      { q: ['Low in the middle, ringed by mountains:', '四周高、中间低的地形是'], options: [['Basin', '盆地'], ['Plateau', '高原'], ['Plain', '平原'], ['Hills', '丘陵']], answer: 0,
        why: ['That is a basin, like the Sichuan Basin.', '这是盆地，比如四川盆地。'] },
      { q: ['Which is called "the roof of the world"?', '被称为“世界屋脊”的是'], options: [['Qinghai–Tibet Plateau', '青藏高原'], ['North China Plain', '华北平原'], ['Sichuan Basin', '四川盆地'], ['Southeast Hills', '东南丘陵']], answer: 0,
        why: ['Its average height is over 4,000 m.', '它的平均海拔在 4000 米以上。'] },
      { q: ['Find the Sichuan Basin.', '在地球上点出四川盆地。'], at: [30.3, 105.5], tolKm: 400,
        why: ['It is in south-west China, ringed by mountains and plateaus.', '它位于我国西南，四周被山地和高原环绕。'] },
    ],
  },
  {
    id: 'continents', strand: 'physical', tracks: ['uk',  'us',  'ib',  'au'], grade: 'g7a', unit: land, icon: 'globe', minutes: 5,
    title: ['Seven continents, four oceans', '七大洲和四大洋'],
    blurb: ['Where each continent ends, and how much of the Earth is sea.', '各大洲的分界在哪里，地球上海洋占多少。'],
    keys: [
      ["Seven continents; Asia is the largest, Australia (Oceania's mainland) the smallest.", "七大洲中亚洲最大、大洋洲最小。"],
      ["Four oceans; the Pacific is the largest.", "四大洋中太平洋最大。"],
      ["About 71% of the surface is ocean.", "地球表面约 71% 是海洋。"],
    ],
    steps: [
      {
        title: ['Seven continents', '七大洲'], cam: [20, 60, 5.2],
        paint: (['asia', 'africa', 'north-america', 'south-america', 'antarctica', 'europe', 'oceania'] as const).map((c, i) => ({ fill: { k: 'continents' as const, only: [c] }, t: i * 0.45, a: 0.65 })),
        marks: [mk([45, 95], '1 Asia', '① 亚洲', { t: 0.2, big: true }), mk([5, 20], '2 Africa', '② 非洲', { t: 0.65, big: true }), mk([45, -100], '3 North America', '③ 北美洲', { t: 1.1, big: true }),
          mk([-15, -60], '4 South America', '④ 南美洲', { t: 1.55, big: true }), mk([-80, 30], '5 Antarctica', '⑤ 南极洲', { t: 2, big: true }), mk([52, 15], '6 Europe', '⑥ 欧洲', { t: 2.45, big: true }), mk([-25, 135], '7 Oceania', '⑦ 大洋洲', { t: 2.9, big: true })],
        body: ['From largest to smallest: Asia, Africa, North America, South America, Antarctica, Europe and Oceania. Asia alone is almost a third of all land. Spin the globe to see them all.',
          '按面积从大到小：亚洲、非洲、北美洲、南美洲、南极洲、欧洲、大洋洲。亚洲面积几乎占全球陆地的三分之一。转动地球看看它们。'],
      },
      {
        title: ['Where continents meet', '大洲的分界线'], cam: [42, 30, 3.6], items: ['cb_panamacanal'],
        paint: [{ fill: { k: 'continents', only: ['asia', 'europe', 'africa'] }, a: 0.4 }],
        lines: [{ pts: ASIA_EUROPE, c: C.gold, w: 1.6, dur: 2.4 }, { pts: SUEZ, c: C.red, w: 2, t: 2, dur: 0.8 }, { pts: PANAMA, c: C.red, w: 2, t: 2.4, dur: 0.8 }, { pts: BERING, c: C.red, w: 2, t: 2.8, dur: 0.8 }],
        marks: [mk([57, 60], 'Ural Mts · Caspian · Caucasus', '乌拉尔山脉—里海—大高加索山脉', { c: C.gold, t: 1 }), mk([30.6, 32.4], 'Suez Canal', '苏伊士运河', { c: C.red, t: 2.2, dot: true }),
          mk([9.1, -79.7], 'Panama Canal', '巴拿马运河', { c: C.red, t: 2.6, dot: true }), mk([66, -169], 'Bering Strait', '白令海峡', { c: C.red, t: 3, dot: true })],
        body: ['Asia and Europe meet along the Urals, the Ural River, the Caspian Sea, the Greater Caucasus and the Turkish Straits. The Suez Canal divides Asia from Africa, the Panama Canal North from South America, and the Bering Strait Asia from North America.',
          '亚洲和欧洲以乌拉尔山脉、乌拉尔河、里海、大高加索山脉和土耳其海峡为界。苏伊士运河是亚洲和非洲的分界，巴拿马运河是南、北美洲的分界，白令海峡是亚洲和北美洲的分界。'],
      },
      {
        title: ['Four oceans', '四大洋'], cam: [10, -150, 5.4],
        paint: (['pacific', 'atlantic', 'indian', 'arctic'] as const).map((o, i) => ({ fill: { k: 'oceans' as const, only: [o] }, t: i * 0.6, a: 0.6 })),
        marks: [mk([0, -150], 'Pacific: largest and deepest', '太平洋：最大最深', { big: true, t: 0.3 }), mk([20, -40], 'Atlantic', '大西洋', { big: true, t: 0.9 }),
          mk([-20, 80], 'Indian Ocean', '印度洋', { big: true, t: 1.5 }), mk([82, 0], 'Arctic: smallest', '北冰洋：最小', { big: true, t: 2.1 })],
        body: ['The four oceans are the Pacific, Atlantic, Indian and Arctic. The Pacific is the largest and deepest; it is bigger than all the land put together. The Arctic is the smallest and shallowest.',
          '四大洋是太平洋、大西洋、印度洋和北冰洋。太平洋面积最大、最深，比全世界陆地面积加起来还大；北冰洋面积最小、最浅。'],
      },
      {
        title: ['Seven parts sea, three parts land', '七分海洋，三分陆地'], cam: [-45, 170, 4.6],
        paint: [{ fill: { k: 'oceans' }, a: 0.5 }],
        body: ['About 71% of the Earth\'s surface is sea and only 29% land. From this side, you see almost nothing but water. That is why the Earth looks blue from space.',
          '地球表面约 71% 是海洋，陆地只占 29%。从这一面看，几乎全是海水。这就是为什么从太空看地球是蓝色的。'],
      },
    ],
    quiz: [
      { q: ['The largest continent is…', '面积最大的大洲是'], options: [['Asia', '亚洲'], ['Africa', '非洲'], ['North America', '北美洲'], ['Antarctica', '南极洲']], answer: 0,
        why: ['Asia covers almost a third of the world\'s land.', '亚洲面积约占世界陆地的三分之一。'] },
      { q: ['Asia and Africa are divided by…', '亚洲和非洲的分界线是'], options: [['The Suez Canal', '苏伊士运河'], ['The Panama Canal', '巴拿马运河'], ['The Bering Strait', '白令海峡'], ['The Ural Mountains', '乌拉尔山脉']], answer: 0,
        why: ['The Suez Canal.', '苏伊士运河。'] },
      { q: ['The largest ocean is…', '面积最大的大洋是'], options: [['Pacific', '太平洋'], ['Atlantic', '大西洋'], ['Indian', '印度洋'], ['Arctic', '北冰洋']], answer: 0,
        why: ['The Pacific, which is also the deepest.', '太平洋，它也是最深的大洋。'] },
      { q: ['Find the Panama Canal.', '在地球上点出巴拿马运河。'], at: [9.1, -79.7], tolKm: 600,
        why: ['It cuts across the narrow land joining North and South America.', '它穿过连接南、北美洲的狭窄地峡。'] },
    ],
  },
  {
    id: 'plates', strand: 'physical', tracks: ['uk',  'us',  'ib',  'au'], grade: 'g7a', unit: land, icon: 'plates', minutes: 5,
    title: ['Plates on the move', '板块的运动'],
    blurb: ['Six great plates drift slowly; where they meet, mountains rise and volcanoes erupt.', '六大板块缓慢漂移，在交界处形成山脉、火山和地震。'],
    keys: [
      ["The crust is broken into about six large plates that slowly move.", "岩石圈由六大板块组成，板块在缓慢移动。"],
      ["Earthquakes and volcanoes cluster along plate boundaries.", "火山和地震多分布在板块交界处。"],
      ["Collisions build mountains, like the Himalayas.", "板块碰撞挤压形成高大山脉，如喜马拉雅山。"],
    ],
    steps: [
      {
        title: ['Six great plates', '六大板块'], cam: [20, 60, 5.4], tectonics: true, sketch: true,
        marks: PLATES.map(([ll, text], i) => ({ ll, text, big: true, t: 0.3 + i * 0.3, c: C.gold })),
        body: ['The Earth\'s rocky shell is broken into plates. The textbook shows six big ones: Eurasian, African, American, Pacific, Indo-Australian and Antarctic. They float on hotter rock below and move a few centimetres a year.',
          '地球的岩石圈不是一整块，而是由板块拼合而成。课本上划分了六大板块：亚欧板块、非洲板块、美洲板块、太平洋板块、印度洋板块和南极洲板块。它们漂浮在软流层上，每年移动几厘米。'],
      },
      {
        title: ['When plates collide', '板块碰撞'], cam: [27, 84, 2.4], tectonics: true, items: ['everest'],
        lines: arrows([[[15, 78], [24, 80]], [[13, 84], [22, 86]], [[16, 90], [24, 91]]], C.red, 0.2, 2.2),
        marks: [mk([30, 86], 'Himalayas still rising', '喜马拉雅山仍在升高', { big: true, c: C.gold, t: 1.2 })],
        body: ['Where plates push together, the crust crumples upward. The Indo-Australian Plate pushes into the Eurasian Plate, which raised the Himalayas and the Qinghai–Tibet Plateau. They are still rising today.',
          '板块相互碰撞挤压的地方，地壳隆起形成高大的山脉。印度洋板块和亚欧板块碰撞挤压，形成了喜马拉雅山脉和青藏高原，它们至今还在升高。'],
      },
      {
        title: ['When plates pull apart', '板块张裂'], cam: [2, 38, 2.6], tectonics: true, items: ['kilimanjaro'],
        lines: [{ pts: EAST_AFRICA_RIFT, c: C.orange, w: 1.6, dur: 2 }, ...arrows([[[2, 37], [2, 31]], [[2, 39], [2, 45]], [[-6, 33.5], [-6, 28]], [[-6, 36], [-6, 41.5]]], C.red, 1.5)],
        marks: [mk([5, 37.5], 'East African Rift', '东非大裂谷', { big: true, c: C.orange, t: 1 })],
        body: ['Where plates pull apart, rifts and new seas open up. The East African Rift is tearing Africa slowly apart, and the Red Sea keeps getting wider.',
          '板块张裂的地方，常形成裂谷和海洋。东非大裂谷正在把非洲慢慢撕开，红海也在不断扩大。'],
      },
      {
        title: ['Volcano and earthquake belts', '火山地震带'], cam: [25, 150, 5], tectonics: true, items: ['fuji', 'vo_sakurajima', 'vo_kilauea', 'vo_etna'],
        lines: [{ pts: RING_OF_FIRE, c: C.red, w: 1.8, dur: 3 }, { pts: MED_HIMALAYA, c: C.orange, w: 1.8, t: 1.5, dur: 3 }],
        marks: [mk([40, -175], 'Circum-Pacific belt', '环太平洋火山地震带', { big: true, c: C.red, t: 1.5 }), mk([36, 50], 'Mediterranean–Himalayan belt', '地中海—喜马拉雅火山地震带', { big: true, c: C.orange, t: 3 })],
        body: ['Plate edges are restless, so most volcanoes and earthquakes follow them. The two biggest belts are the Circum-Pacific belt (the "Ring of Fire") and the Mediterranean–Himalayan belt. Japan sits right on a plate boundary.',
          '板块交界地带地壳比较活跃，火山和地震大多分布在这里。世界上两大火山地震带是环太平洋火山地震带和地中海—喜马拉雅火山地震带。日本就位于板块交界处。'],
      },
    ],
    quiz: [
      { q: ['The Himalayas were formed by plates…', '喜马拉雅山脉是板块怎样运动形成的'], options: [['Colliding', '碰撞挤压'], ['Pulling apart', '张裂'], ['Sliding past', '平移'], ['Not moving', '静止不动']], answer: 0,
        why: ['The Indo-Australian Plate is colliding with the Eurasian Plate.', '印度洋板块与亚欧板块碰撞挤压。'] },
      { q: ['Why does Japan have so many earthquakes?', '日本多地震，主要是因为'], options: [['It lies on a plate boundary', '位于板块交界处'], ['It is an island', '它是岛国'], ['It has many mountains', '山地多'], ['It is near the equator', '靠近赤道']], answer: 0,
        why: ['Japan is where the Pacific and Eurasian plates meet.', '日本位于太平洋板块和亚欧板块的交界处。'] },
      { q: ['Find Mount Everest.', '在地球上点出珠穆朗玛峰。'], at: [27.99, 86.93], tolKm: 500,
        why: ['It is on the border of China and Nepal, in the Himalayas.', '它在中国和尼泊尔边境的喜马拉雅山脉上。'] },
    ],
  },
  {
    id: 'climate', strand: 'climate', tracks: ['uk',  'us',  'ib',  'au'], grade: 'g7a', unit: climate, icon: 'cloud', minutes: 5,
    title: ['Temperature and rainfall', '气温和降水'],
    blurb: ['How temperature changes with latitude and season, and where it rains most.', '气温随纬度和季节怎样变化，哪里降水最多。'],
    keys: [
      ["Weather is short-term; climate is the long-term average.", "天气是短时间的，气候是多年的平均状况。"],
      ["Temperature falls from the equator to the poles and with height.", "气温从低纬向高纬、随海拔升高而降低。"],
      ["Rainfall is highest near the equator and on windward coasts.", "赤道附近和迎风海岸降水多。"],
    ],
    steps: [
      {
        title: ['January', '1 月'], cam: [25, 100, 4.6], sketch: true, sun: true,
        clock: { mode: 'year', start: T.janChina, rate: 0 }, paint: [{ fill: { k: 'temp' }, a: 0.62 }],
        body: ['Temperature falls from low latitudes to high latitudes. In January the Northern Hemisphere is in winter: the continents in the north get very cold, colder than the sea at the same latitude.',
          '气温从低纬度向高纬度逐渐降低。1 月北半球是冬季，北半球的大陆非常冷，比同纬度的海洋还要冷。'],
      },
      {
        title: ['July', '7 月'], cam: [25, 100, 4.6], sketch: true, sun: true,
        clock: { mode: 'year', start: T.julChina, rate: 0 }, paint: [{ fill: { k: 'temp' }, a: 0.62 }],
        body: ['In July it is the other way round: northern land heats up fast and is hotter than the sea at the same latitude. Land warms and cools faster than water.',
          '7 月正好相反：北半球大陆升温快，比同纬度的海洋更热。陆地比海洋升温快、降温也快。'],
      },
      {
        title: ['Through the year', '一年的变化'], cam: [25, 100, 4.6], sketch: true, sun: true, night: true,
        clock: { mode: 'year', start: T.janChina, rate: 24 }, paint: [{ fill: { k: 'temp' }, a: 0.62 }],
        body: ['Watch the warm band follow the overhead Sun north and south through the year, and the big northern continents swing from very cold to hot.',
          '看暖色带跟着太阳直射点一年里南北移动，北半球的大陆从严寒变得炎热。'],
      },
      {
        title: ['Where it rains', '降水的分布'], cam: [5, 20, 4.6], sketch: true, items: ['pl_kapok', 'dc_richat'],
        paint: [{ fill: { k: 'band', s: -10, n: 10, c: C.blue }, a: 0.45 }, { fill: { k: 'band', s: 15, n: 32, c: C.brown }, t: 0.8, a: 0.4 }, { fill: { k: 'band', s: -32, n: -15, c: C.brown }, t: 0.8, a: 0.4 }],
        marks: [mk([0, 20], 'Rainy near the equator', '赤道附近降水多', { big: true, c: C.blue, t: 0.4 }), mk([23, 10], 'Dry near the tropics', '回归线附近多沙漠', { big: true, c: C.brown, t: 1.2 })],
        body: ['Near the equator it is hot and wet, with rain almost every day. Around the tropics, especially inside big continents and on west coasts, it is dry, and there are great deserts like the Sahara. Coasts are usually wetter than inland areas.',
          '赤道附近降水多，几乎天天下雨；南北回归线附近，特别是大陆内部和西岸，降水少，有撒哈拉沙漠这样的大沙漠。一般来说，沿海地区比内陆地区降水多。'],
      },
    ],
    quiz: [
      { q: ['From the equator to the poles, temperature generally…', '从赤道向两极，气温总体上'], options: [['Falls', '逐渐降低'], ['Rises', '逐渐升高'], ['Stays the same', '保持不变'], ['Rises then falls', '先升高再降低']], answer: 0,
        why: ['Higher latitudes get less direct sunshine.', '纬度越高，获得的太阳热量越少。'] },
      { q: ['In July, northern land compared with sea at the same latitude is…', '7 月，北半球同纬度的陆地比海洋'], options: [['Hotter', '更热'], ['Colder', '更冷'], ['The same', '一样'], ['Always frozen', '一直结冰']], answer: 0,
        why: ['Land heats up faster than water.', '陆地比海洋升温快。'] },
      { q: ['The wettest belt of the world is…', '世界上降水最多的地带是'], options: [['Near the equator', '赤道附近'], ['Near the tropics', '回归线附近'], ['Near the poles', '两极地区'], ['Inside big continents', '大陆内部']], answer: 0,
        why: ['Hot air rises near the equator and drops its rain.', '赤道附近空气受热上升，容易形成降水。'] },
    ],
  },
];
