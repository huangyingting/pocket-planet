/** 八上 · 中国的自然环境: the three steps of terrain, climate and rivers. */
import { C, arrows, mk, type Lesson } from './kit.ts';
import { MONSOON_LINE, MONSOON_REGION, QINLING_HUAIHE, RIVERS, STEP1, STEP2, STEP_POLYS } from './geo.ts';

const unit = ['China\'s natural environment', '中国的自然环境'] as const;
const CN = ['CN', 'TW'];

export const CHINA: Lesson[] = [
  {
    id: 'steps', strand: 'china', tracks: ['uk',  'us'], grade: 'g8a', unit, icon: 'mountain', minutes: 5,
    title: ['China\'s three steps', '地势西高东低，呈三级阶梯'],
    blurb: ['From the roof of the world down to the sea, in three big steps.', '从世界屋脊到大海，分三级阶梯逐级下降。'],
    keys: [
      ["China's land falls in three steps from west to east.", "中国地势西高东低，呈三级阶梯。"],
      ["Big rivers flow east, carrying water and transport links.", "大河向东流，便利了东西交通。"],
      ["Step boundaries bring falling water and hydropower.", "阶梯交界处落差大，水能丰富。"],
    ],
    steps: [
      {
        title: ['Where is China?', '中国的位置'], cam: [34, 105, 3.2], items: ['forbidden'],
        paint: [{ fill: { k: 'land', a2: CN, c: C.red }, a: 0.5 }],
        body: ['China is in the east of Asia, on the west coast of the Pacific. It stretches over about 60° of longitude and 50° of latitude, and covers about 9.6 million km² of land.',
          '我国位于亚洲东部、太平洋西岸，东西跨经度约 60°，南北跨纬度约 50°，陆地面积约 960 万平方千米。'],
      },
      {
        title: ['Two dividing lines', '阶梯的分界线'], cam: [34, 105, 3], sketch: true,
        paint: [{ fill: { k: 'land', a2: CN, c: C.white }, a: 0.22 }],
        lines: [{ pts: STEP1, c: C.gold, w: 1.8, dur: 2.2 }, { pts: STEP2, c: C.orange, w: 1.8, t: 1.8, dur: 2.2 }],
        marks: [mk([37.5, 92], 'Kunlun · Qilian · Hengduan', '昆仑山—祁连山—横断山', { c: C.gold, t: 1 }), mk([44, 118.5], 'Greater Khingan · Taihang · Wushan · Xuefeng', '大兴安岭—太行山—巫山—雪峰山', { c: C.orange, t: 3 })],
        body: ['Two lines of mountains split China into three steps. The first runs along the Kunlun, Qilian and Hengduan mountains; the second along the Greater Khingan, Taihang, Wushan and Xuefeng mountains.',
          '两条山脉线把我国分成三级阶梯。第一、二级阶梯的分界线是昆仑山—祁连山—横断山；第二、三级阶梯的分界线是大兴安岭—太行山—巫山—雪峰山。'],
      },
      {
        title: ['Three steps', '三级阶梯'], cam: [33, 103, 3], sketch: true, items: ['potala', 'everest', 'cn_bund'],
        paint: [{ fill: { k: 'poly', pts: STEP_POLYS[0], c: C.violet, clip: CN }, a: 0.55 }, { fill: { k: 'poly', pts: STEP_POLYS[1], c: C.brown, clip: CN }, t: 0.8, a: 0.55 }, { fill: { k: 'poly', pts: STEP_POLYS[2], c: C.green, clip: CN }, t: 1.6, a: 0.55 }],
        lines: [{ pts: STEP1, c: C.gold, w: 1.4, dur: 1 }, { pts: STEP2, c: C.orange, w: 1.4, dur: 1, t: 0.8 }],
        marks: [mk([33, 88], 'Step 1: above 4,000 m', '第一级：4000 米以上', { big: true, c: C.violet, t: 0.4 }), mk([39, 106], 'Step 2: 1,000–2,000 m', '第二级：1000—2000 米', { big: true, c: C.brown, t: 1.2 }), mk([30, 116], 'Step 3: mostly under 500 m', '第三级：多在 500 米以下', { big: true, c: C.green, t: 2 })],
        body: ['Step 1 is the Qinghai–Tibet Plateau, mostly above 4,000 m. Step 2 holds big plateaus and basins at 1,000–2,000 m. Step 3 is plains and hills, mostly under 500 m, down to the sea.',
          '第一级阶梯主要是青藏高原，平均海拔 4000 米以上；第二级阶梯多是大型高原和盆地，海拔 1000—2000 米；第三级阶梯以平原和丘陵为主，海拔多在 500 米以下。'],
      },
      {
        title: ['High in the west, low in the east', '西高东低的影响'], cam: [32, 105, 3.2], items: ['cn_yellowcrane'],
        lines: [{ pts: RIVERS.yangtze, c: C.blue, w: 1.6, flow: true, arrow: true, dur: 2.4 }, { pts: RIVERS.yellow, c: C.gold, w: 1.6, flow: true, arrow: true, dur: 2.4, t: 0.5 }],
        marks: [mk([30.8, 111.0], 'Three Gorges: falling water → power', '三峡：落差大，水能丰富', { dot: true, c: C.teal, t: 2.2 })],
        body: ['Because the land slopes down to the east, most big rivers flow east into the sea, linking east and west. Where rivers drop from one step to the next, they rush fast, and dams like the Three Gorges turn that drop into electricity.',
          '地势西高东低，使许多大河滚滚东流，沟通了东西交通；河流从一级阶梯流向下一级阶梯时，落差大，水能丰富，三峡水电站就建在这样的地方。'],
      },
    ],
    quiz: [
      { q: ['China\'s land is…', '我国地势的特点是'], options: [['High in the west, low in the east, in three steps', '西高东低，呈阶梯状分布'], ['High in the east, low in the west', '东高西低'], ['High in the middle', '中部高、四周低'], ['Flat everywhere', '到处平坦']], answer: 0,
        why: ['It drops in three steps from the west to the east.', '从西向东分三级阶梯逐级下降。'] },
      { q: ['The line between Step 2 and Step 3 is…', '第二、三级阶梯的分界线是'], options: [['Greater Khingan–Taihang–Wushan–Xuefeng', '大兴安岭—太行山—巫山—雪峰山'], ['Kunlun–Qilian–Hengduan', '昆仑山—祁连山—横断山'], ['Qinling–Huaihe', '秦岭—淮河'], ['The Great Wall', '长城']], answer: 0,
        why: ['Kunlun–Qilian–Hengduan divides Steps 1 and 2.', '昆仑山—祁连山—横断山是第一、二级阶梯的分界线。'] },
      { q: ['Find the Three Gorges.', '在地球上点出三峡。'], at: [30.8, 111], tolKm: 400,
        why: ['On the Yangtze where it leaves Step 2 near Yichang.', '在长江流出第二级阶梯的地方，宜昌附近。'] },
    ],
  },
  {
    id: 'china-climate', strand: 'china', tracks: ['uk',  'us'], grade: 'g8a', unit, icon: 'cloud', minutes: 6,
    title: ['China\'s climate and rivers', '中国的气候和河流'],
    blurb: ['Monsoons, the Qinling–Huaihe line, and the Yangtze and Yellow Rivers.', '季风、秦岭—淮河一线，以及长江和黄河。'],
    keys: [
      ["Winters are cold and dry; the north–south temperature gap is large.", "冬季南北温差大，普遍寒冷干燥。"],
      ["The summer monsoon brings rain, decreasing from southeast to northwest.", "夏季风带来降水，降水从东南沿海向西北内陆递减。"],
      ["The Qinling–Huaihe line divides north and south.", "秦岭—淮河一线是南北方的重要分界线。"],
    ],
    steps: [
      {
        title: ['Summer and winter monsoons', '夏季风和冬季风'], cam: [32, 112, 3.4], sketch: true,
        lines: [...arrows([[[15, 125], [26, 118]], [[18, 135], [30, 124]], [[12, 105], [22, 109]]], C.teal, 0, 2.2),
          ...arrows([[[52, 95], [42, 108]], [[55, 110], [44, 118]], [[45, 125], [36, 120]]], C.ice, 2, 2.2)],
        marks: [mk([20, 130], 'Summer: warm, wet sea winds', '夏季风：温暖湿润', { c: C.teal, t: 0.8 }), mk([50, 105], 'Winter: cold, dry land winds', '冬季风：寒冷干燥', { c: C.ice, t: 2.8 })],
        body: ['In summer, warm wet winds blow from the Pacific and Indian Oceans and bring rain. In winter, cold dry winds blow down from Mongolia and Siberia. Most of China\'s rain falls in summer.',
          '夏季，来自太平洋和印度洋的夏季风温暖湿润，带来降水；冬季，来自蒙古、西伯利亚一带的冬季风寒冷干燥。我国降水主要集中在夏季。'],
      },
      {
        title: ['Monsoon and non-monsoon areas', '季风区和非季风区'], cam: [36, 102, 3.2], sketch: true,
        paint: [{ fill: { k: 'poly', pts: MONSOON_REGION, c: C.teal, clip: CN }, a: 0.45 }],
        lines: [{ pts: MONSOON_LINE, c: C.gold, w: 1.8, dur: 2.4 }],
        marks: [mk([30, 112], 'Monsoon area', '季风区', { big: true, c: C.teal, t: 0.6 }), mk([42, 88], 'Non-monsoon area', '非季风区', { big: true, c: C.brown, t: 1.2 })],
        body: ['Summer monsoons rarely get past the Greater Khingan, Yinshan, Helan, Bayan Har and Gangdise mountains. East and south of that line is the monsoon area; north-west of it is dry, with deserts and grasslands.',
          '夏季风很难越过大兴安岭—阴山—贺兰山—巴颜喀拉山—冈底斯山一线。这条线东南是季风区，西北是非季风区，气候干燥，多沙漠和草原。'],
      },
      {
        title: ['The Qinling–Huaihe line', '秦岭—淮河一线'], cam: [33, 112, 2.2], items: ['cn_huangshan'],
        lines: [{ pts: QINLING_HUAIHE, c: C.gold, w: 2, dur: 2 }],
        marks: [mk([36, 113], 'North: dry land, wheat, frozen rivers in winter', '北方：旱地、小麦，冬季河流结冰', { c: C.ice, t: 1.4 }), mk([30, 113], 'South: paddy fields, rice', '南方：水田、水稻', { c: C.green, t: 1.8 })],
        body: ['The Qinling Mountains and the Huaihe River mark China\'s north–south divide. It roughly follows the 0 °C January temperature line and the 800 mm rainfall line. North of it, rivers freeze in winter and farmers grow wheat; south of it they grow rice.',
          '秦岭—淮河一线是我国南北方的重要分界线，大致与 1 月 0 ℃ 等温线和 800 毫米年等降水量线一致。北方冬季河流结冰，多种小麦；南方多水田，种水稻。'],
      },
      {
        title: ['The Yangtze', '长江'], cam: [30.5, 108, 2.6], items: ['cn_yellowcrane', 'leshan', 'cn_bund'],
        lines: [{ pts: RIVERS.yangtze.slice(0, 11), c: C.blue, w: 1.8, flow: true, dur: 2 }, { pts: RIVERS.yangtze.slice(10, 14), c: C.teal, w: 1.8, flow: true, t: 1.8, dur: 1 }, { pts: RIVERS.yangtze.slice(13), c: C.green, w: 1.8, flow: true, arrow: true, t: 2.6, dur: 1 }],
        marks: [mk([30.7, 111.3], 'Yichang', '宜昌', { dot: true, c: C.gold, t: 2 }), mk([29.75, 116.2], 'Hukou', '湖口', { dot: true, c: C.gold, t: 2.8 })],
        body: ['The Yangtze is China\'s longest river (about 6,300 km). Its upper course ends at Yichang, its middle course at Hukou. It carries more water than any other Chinese river and is a "golden waterway" for shipping.',
          '长江是我国第一长河，全长约 6300 千米。宜昌以上是上游，宜昌至湖口是中游，湖口以下是下游。长江水量丰富，航运价值大，被称为“黄金水道”。'],
      },
      {
        title: ['The Yellow River', '黄河'], cam: [37, 108, 2.6],
        lines: [{ pts: RIVERS.yellow.slice(0, 11), c: C.gold, w: 1.8, flow: true, dur: 2 }, { pts: RIVERS.yellow.slice(10, 16), c: C.brown, w: 2.2, flow: true, t: 1.8, dur: 1 }, { pts: RIVERS.yellow.slice(15), c: C.orange, w: 1.8, flow: true, arrow: true, t: 2.6, dur: 1 }],
        paint: [{ fill: { k: 'poly', pts: [[39.5, 104], [40, 111], [36.5, 113], [34.5, 111], [34.5, 104.5], [36.5, 102.5]], c: C.brown, clip: CN }, t: 1.8, a: 0.4 }],
        marks: [mk([40.3, 111.1], 'Hekou', '河口镇', { dot: true, c: C.gold, t: 1.8 }), mk([34.85, 112.6], 'Jiumengjin', '旧孟津', { dot: true, c: C.gold, t: 2.6 }), mk([37, 108], 'Loess Plateau', '黄土高原', { c: C.brown, t: 2.2 })],
        body: ['The Yellow River is China\'s second-longest river. In its middle course it crosses the Loess Plateau and picks up huge amounts of mud, which makes it yellow. Downstream, the mud settles and raises the riverbed above the land: a "river above the ground".',
          '黄河是我国第二长河。中游流经黄土高原，带走大量泥沙，河水变黄。下游泥沙沉积，河床高出两岸地面，形成“地上河”。'],
      },
    ],
    quiz: [
      { q: ['The Qinling–Huaihe line roughly follows…', '秦岭—淮河一线大致与哪条线一致'], options: [['The 0 °C January isotherm', '1 月 0 ℃ 等温线'], ['The Tropic of Cancer', '北回归线'], ['The 400 mm rainfall line', '400 毫米年等降水量线'], ['The Great Wall', '长城']], answer: 0,
        why: ['And the 800 mm rainfall line.', '也与 800 毫米年等降水量线大致一致。'] },
      { q: ['The upper and middle Yangtze are divided at…', '长江上游和中游的分界点是'], options: [['Yichang', '宜昌'], ['Hukou', '湖口'], ['Wuhan', '武汉'], ['Shanghai', '上海']], answer: 0,
        why: ['Yichang; the middle and lower courses meet at Hukou.', '宜昌；中、下游以湖口为界。'] },
      { q: ['The Yellow River gets its mud mostly from…', '黄河的泥沙主要来自'], options: [['The Loess Plateau', '黄土高原'], ['The Tibetan Plateau', '青藏高原'], ['The North China Plain', '华北平原'], ['The sea', '海洋']], answer: 0,
        why: ['Its middle course cuts through the loose loess.', '中游流经土质疏松的黄土高原。'] },
      { q: ['Find Yichang.', '在地球上点出宜昌。'], at: [30.7, 111.3], tolKm: 400,
        why: ['Yichang is in Hubei, just below the Three Gorges.', '宜昌在湖北省，三峡出口处。'] },
    ],
  },
];

