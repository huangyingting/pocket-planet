/** 七上 · 地球和地图 (2): revolution and seasons, the five heat zones. */
import { C, T, mk, par, type Lesson } from './kit.ts';

const unit = ['The Earth and maps', '地球和地图'] as const;
const TROPICS = [par(23.44, C.orange, 0, { dur: 1.6 }), par(-23.44, C.orange, 0.3, { dur: 1.6 })];
const CIRCLES = [par(66.56, C.ice, 0.6, { dur: 1.6 }), par(-66.56, C.ice, 0.9, { dur: 1.6 })];

export const EARTH_B: Lesson[] = [
  {
    id: 'revolution', strand: 'maps', tracks: ['uk',  'us',  'ib',  'au'], grade: 'g7a', unit, icon: 'sun', minutes: 6,
    title: ['Revolution and the seasons', '地球的公转与四季'],
    blurb: ['A year around the Sun on a tilted axis: the overhead Sun wanders between the tropics.', '地轴倾斜着绕太阳公转一年：太阳直射点在南北回归线之间来回移动。'],
    keys: [
      ["The Earth orbits the Sun once a year, its axis tilted 23.5°.", "地球绕太阳公转一周约一年，地轴倾斜约 23.5°。"],
      ["The overhead Sun moves between the tropics, giving the seasons.", "太阳直射点在南北回归线之间移动，产生四季。"],
      ["Seasons are opposite in the two hemispheres.", "南北半球的季节相反。"],
    ],
    steps: [
      {
        title: ['The overhead Sun moves', '太阳直射点的移动'], cam: [10, 120, 3.8], follow: 0, night: true, sun: true,
        clock: { mode: 'year', start: T.marchNoonChina, rate: 30 },
        lines: [...TROPICS, par(0, C.gold, 0.6, { dur: 1.4 })],
        marks: [mk([23.44, 150], 'Tropic of Cancer 23.4°N', '北回归线 23.4°N', { c: C.orange, t: 0.5 }), mk([-23.44, 150], 'Tropic of Capricorn 23.4°S', '南回归线 23.4°S', { c: C.orange, t: 0.8 })],
        body: ['The Earth goes round the Sun once a year with its axis tilted the same way all the time. So the latitude where the Sun is straight overhead at noon moves north and south between the two tropics. Watch the Sun marker as the months go by.',
          '地球绕太阳公转一周是一年，地轴始终倾斜、指向不变。于是正午太阳直射的纬度在南北回归线之间来回移动。看着太阳标记随月份移动。'],
      },
      {
        title: ['Solstices and equinoxes', '二分二至'], cam: [10, 120, 3.8], follow: 0, night: true, sun: true,
        clock: { mode: 'year', start: T.marchNoonChina, rate: 18 },
        lines: [...TROPICS, par(0, C.gold, 0.4, { dur: 1.4 })],
        marks: [mk([23.44, 90], 'Jun 21: summer solstice', '6 月 22 日前后：夏至', { c: C.orange, t: 0.6 }), mk([0, 90], 'Mar 21 / Sep 23: equinoxes', '3 月 21 日 / 9 月 23 日前后：春分 / 秋分', { c: C.gold, t: 1 }), mk([-23.44, 90], 'Dec 22: winter solstice', '12 月 22 日前后：冬至', { c: C.orange, t: 1.4 })],
        body: ['Around 21 March and 23 September (the equinoxes) the Sun is overhead at the equator and day equals night everywhere. Around 22 June (summer solstice) it reaches the Tropic of Cancer; around 22 December (winter solstice), the Tropic of Capricorn.',
          '春分（3 月 21 日前后）和秋分（9 月 23 日前后），太阳直射赤道，全球昼夜等长。夏至（6 月 22 日前后）太阳直射北回归线，冬至（12 月 22 日前后）太阳直射南回归线。'],
      },
      {
        title: ['Polar day and polar night', '极昼和极夜'], cam: [55, -150, 3.6], follow: 180, night: true, sun: true,
        clock: { mode: 'year', start: T.marchNoonChina, rate: 24 },
        lines: CIRCLES,
        marks: [mk([66.56, -150], 'Arctic Circle 66.6°N', '北极圈 66.6°N', { c: C.ice, t: 1 })],
        body: ['Near the June solstice the whole area inside the Arctic Circle stays lit all day: polar day. Near the December solstice it stays dark: polar night. The Antarctic is the other way round.',
          '夏至前后，北极圈以内整天都被照亮，出现极昼；冬至前后则整天黑暗，出现极夜。南极圈以内正好相反。'],
      },
      {
        title: ['Long days, short days', '昼长与四季'], cam: [30, 115, 3.4], night: true, sun: true, sky: 'seasons',
        clock: { mode: 'year', start: T.marchNoonChina, rate: 20 },
        marks: [mk([39.9, 116.4], 'Beijing', '北京', { dot: true, c: C.gold })],
        body: ['When the overhead Sun is in the north, the Northern Hemisphere gets higher noon Sun and longer days: summer. Half a year later it is winter here and summer in the south. Open the sky view to watch the Sun\'s path change.',
          '太阳直射北半球时，北半球正午太阳高，白天长，是夏季；半年后，北半球是冬季，南半球是夏季。打开星空看看太阳的路径怎样变化。'],
      },
    ],
    quiz: [
      { q: ['Around 22 June the Sun is overhead at…', '6 月 22 日前后，太阳直射'], options: [['The Tropic of Cancer', '北回归线'], ['The equator', '赤道'], ['The Tropic of Capricorn', '南回归线'], ['The Arctic Circle', '北极圈']], answer: 0,
        why: ['That is the (northern) summer solstice.', '这一天是夏至。'] },
      { q: ['One revolution around the Sun takes…', '地球公转一周需要'], options: [['One year', '一年'], ['One day', '一天'], ['One month', '一个月'], ['Ten years', '十年']], answer: 0,
        why: ['About 365¼ days.', '约 365.25 天。'] },
      { q: ['At the winter solstice, days in Beijing are…', '冬至这天，北京的白天'], options: [['The shortest of the year', '一年中最短'], ['The longest of the year', '一年中最长'], ['Equal to night', '和黑夜一样长'], ['24 hours long', '长达 24 小时']], answer: 0,
        why: ['The overhead Sun is farthest south, so northern days are shortest.', '太阳直射点最偏南，北半球白天最短。'] },
      { q: ['The Tropic of Cancer passes near this city. Find Guangzhou.', '北回归线从广州附近经过，在地球上点出广州。'], at: [23.1, 113.3], tolKm: 400,
        why: ['Guangzhou is at about 23°N, 113°E.', '广州大约在 23°N、113°E。'] },
    ],
  },
  {
    id: 'zones', strand: 'maps', tracks: ['us',  'ib'], grade: 'g7a', unit, icon: 'sun', minutes: 4,
    title: ['The five heat zones', '五带的划分'],
    blurb: ['The tropics and polar circles cut the Earth into five zones by how much sunshine they get.', '回归线和极圈把地球分成五个热量带。'],
    keys: [
      ["The tropics and polar circles divide the Earth into five heat zones.", "回归线和极圈把地球分为五带。"],
      ["Tropical: the Sun can be overhead; polar: polar day and night.", "热带有太阳直射，寒带有极昼极夜。"],
      ["The temperate zones have clear seasons.", "温带四季分明。"],
    ],
    steps: [
      {
        title: ['The Torrid Zone', '热带'], cam: [5, -60, 3.8], items: ['an_jaguar', 'pl_kapok'],
        lines: TROPICS, paint: [{ fill: { k: 'band', s: -23.44, n: 23.44, c: C.red }, t: 0.6, a: 0.42 }],
        marks: [mk([5, -60], 'Torrid Zone', '热带', { big: true, c: C.red, t: 1 })],
        body: ['Between the two tropics the Sun can be straight overhead, so it is hot all year. Rainforests and jaguars live here.',
          '南北回归线之间有太阳直射现象，终年炎热。热带雨林和美洲豹就生活在这里。'],
      },
      {
        title: ['The Temperate Zones', '温带'], cam: [40, 105, 3.6], items: ['an_panda'],
        lines: [...TROPICS, ...CIRCLES],
        paint: [{ fill: { k: 'band', s: 23.44, n: 66.56, c: C.green }, t: 0.6, a: 0.4 }, { fill: { k: 'band', s: -66.56, n: -23.44, c: C.green }, t: 0.9, a: 0.4 }],
        marks: [mk([45, 105], 'North Temperate Zone', '北温带', { big: true, c: C.green, t: 1 })],
        body: ['Between a tropic and a polar circle the Sun is never overhead and never stays down all day. There are four clear seasons. Most of China is in the North Temperate Zone.',
          '回归线和极圈之间，既没有太阳直射，也没有极昼极夜，四季分明。我国大部分地区位于北温带。'],
      },
      {
        title: ['The Frigid Zones', '寒带'], cam: [70, 20, 3.8], items: ['an_polarbear', 'an_penguin'],
        lines: CIRCLES,
        paint: [{ fill: { k: 'band', s: 66.56, n: 90, c: C.ice }, t: 0.6, a: 0.5 }, { fill: { k: 'band', s: -90, n: -66.56, c: C.ice }, t: 0.9, a: 0.5 }],
        marks: [mk([75, 20], 'North Frigid Zone', '北寒带', { big: true, c: C.ice, t: 1 })],
        body: ['Inside the polar circles the Sun is always low and there are polar days and nights. It is cold all year. Polar bears live in the north, penguins in the south.',
          '极圈以内，太阳高度一直很低，有极昼极夜现象，终年寒冷。北极有北极熊，南极有企鹅。'],
      },
      {
        title: ['All five', '五带'], cam: [15, 100, 4.6], night: true, sun: true,
        clock: { mode: 'year', start: T.marchNoonChina, rate: 30 },
        lines: [...TROPICS, ...CIRCLES],
        paint: [
          { fill: { k: 'band', s: -23.44, n: 23.44, c: C.red }, a: 0.34 },
          { fill: { k: 'band', s: 23.44, n: 66.56, c: C.green }, a: 0.32 }, { fill: { k: 'band', s: -66.56, n: -23.44, c: C.green }, a: 0.32 },
          { fill: { k: 'band', s: 66.56, n: 90, c: C.ice }, a: 0.42 }, { fill: { k: 'band', s: -90, n: -66.56, c: C.ice }, a: 0.42 },
        ],
        body: ['The five zones are split by sunshine: is the Sun ever overhead (Torrid), is there ever polar day or night (Frigid), or neither (Temperate)? Watch the overhead Sun stay inside the red band all year.',
          '五带是按照太阳照射情况来划分的：有没有太阳直射（热带），有没有极昼极夜（寒带），两者都没有就是温带。看，太阳直射点一年到头都在红色的热带里移动。'],
      },
    ],
    quiz: [
      { q: ['The five zones are divided by…', '五带的分界线是'], options: [['The tropics and polar circles', '南北回归线和南北极圈'], ['The equator and prime meridian', '赤道和本初子午线'], ['20°W and 160°E', '20°W 和 160°E'], ['Coastlines', '海岸线']], answer: 0,
        why: ['The tropics (23.4°) and polar circles (66.6°).', '南北回归线（23.4°）和南北极圈（66.6°）。'] },
      { q: ['Most of China is in the…', '我国大部分地区位于'], options: [['North Temperate Zone', '北温带'], ['Torrid Zone', '热带'], ['North Frigid Zone', '北寒带'], ['South Temperate Zone', '南温带']], answer: 0,
        why: ['Only the far south of China is in the Torrid Zone.', '只有我国南部一小部分地区在热带。'] },
      { q: ['Polar bears live in the…', '北极熊生活在'], options: [['North Frigid Zone', '北寒带'], ['South Frigid Zone', '南寒带'], ['Torrid Zone', '热带'], ['South Temperate Zone', '南温带']], answer: 0,
        why: ['Polar bears live around the Arctic; penguins live in the south.', '北极熊生活在北极地区，企鹅生活在南半球。'] },
    ],
  },
];
