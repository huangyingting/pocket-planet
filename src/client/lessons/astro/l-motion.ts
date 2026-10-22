/** Astronomy lessons: gravity, orbits and spaceflight (kits `kepler`, `cannon`, `satellites`). */
import { C, type Fig, type Lesson, type Pair, type Track } from '../kit.ts';
import { svg, tx, arrowDef, type Lx } from '../figs.ts';

const unit: Pair = ['Gravity, orbits and spaceflight', '引力、轨道和航天'];
const JR: Track[] = ['uk', 'us', 'au', 'ib'];
const SR: Track[] = ['uk', 'ib', 'us'];

// ------------------------------------------------------------------------------------------------ figures

/** Milestones of spaceflight (China gold, others blue). */
function timeline(L: Lx): string {
  const rows: [number, string, string, boolean][] = [
    [1957, 'Sputnik 1: the first satellite', '斯普特尼克 1 号：第一颗人造卫星', false],
    [1961, 'Gagarin: the first person in space', '加加林：第一个进入太空的人', false],
    [1969, 'Apollo 11: first people on the Moon', '阿波罗 11 号：人类首次登上月球', false],
    [1970, 'Dongfanghong-1: China’s first satellite', '东方红一号：中国第一颗人造卫星', true],
    [1990, 'Hubble Space Telescope', '哈勃空间望远镜升空', false],
    [2003, 'Yang Liwei on Shenzhou-5', '杨利伟乘神舟五号飞天', true],
    [2019, 'Chang’e-4 lands on the far side', '嫦娥四号在月球背面着陆', true],
    [2020, 'Chang’e-5 brings back Moon rock', '嫦娥五号带回月球样品', true],
    [2021, 'Tianwen-1 and Zhurong reach Mars', '天问一号和祝融号到达火星', true],
    [2021, 'James Webb Space Telescope launched', '詹姆斯·韦布空间望远镜发射', false],
    [2022, 'Tiangong space station completed', '天宫空间站全面建成', true],
    [2024, 'Chang’e-6: samples from the far side', '嫦娥六号带回月球背面样品', true],
  ];
  const top = 28, rh = 11.6;
  let o = tx(4, 12, L(['Milestones of the space age', '航天大事记']), 'fg-title') + tx(4, 22, L(['gold: China', '金色：中国']), 'fg-sub');
  o += `<line x1="46" y1="${top - 4}" x2="46" y2="${top + rh * (rows.length - 1) + 3}" class="fg-grid" style="stroke:rgba(255,255,255,.25)"/>`;
  rows.forEach(([y, en, zh, cn], i) => {
    const yy = top + i * rh, c = cn ? C.gold : C.blue;
    o += `<g class="f-fade" style="--d:${(i * 0.06).toFixed(2)}s">` + tx(38, yy + 3, String(y), 'fg-tick', 'e')
      + `<circle cx="46" cy="${yy}" r="2.6" fill="${c}"/>` + tx(54, yy + 3, L([en, zh]), 'fg-label', 's', ` style="fill:${cn ? C.gold : '#dbe4ee'}"`) + '</g>';
  });
  return svg(320, top + rh * rows.length, o, L(['Milestones of the space age', '航天大事记']));
}

/** Kepler's third law on log axes: T² against a³ is one straight line. */
function keplerFig(L: Lx): string {
  const pl: [Pair, number, string][] = [[['Mercury', '水星'], 0.387, '#b8b0a6'], [['Venus', '金星'], 0.723, '#e8cf9a'], [['Earth', '地球'], 1, '#6fa8ff'], [['Mars', '火星'], 1.524, '#e07a52'], [['Jupiter', '木星'], 5.203, '#d9b38c'], [['Saturn', '土星'], 9.537, '#e6cf98']];
  const x0 = 44, x1 = 300, y0 = 152, y1 = 30, lo = -2, hi = 3;
  const X = (v: number) => x0 + ((Math.log10(v) - lo) / (hi - lo)) * (x1 - x0), Y = (v: number) => y0 - ((Math.log10(v) - lo) / (hi - lo)) * (y0 - y1);
  let o = tx(4, 12, L(['Kepler’s third law: T² = a³', '开普勒第三定律：T² = a³']), 'fg-title') + tx(4, 22, L(['T in years, a in AU (log scales)', 'T 单位为年，a 单位为天文单位（对数坐标）']), 'fg-sub');
  for (let k = lo; k <= hi; k++) {
    const v = 10 ** k, s = k < 0 ? v.toFixed(-k) : String(v);
    o += `<line x1="${X(v)}" y1="${y1}" x2="${X(v)}" y2="${y0}" class="fg-grid"/><line x1="${x0}" y1="${Y(v)}" x2="${x1}" y2="${Y(v)}" class="fg-grid"/>`;
    o += tx(X(v), y0 + 9, s, 'fg-tick', 'm') + tx(x0 - 4, Y(v) + 2.5, s, 'fg-tick', 'e');
  }
  o += tx(x1, y0 - 4, L(['a³ (AU³)', 'a³（AU³）']), 'fg-sub', 'e') + tx(x0 + 4, y1 + 8, L(['T² (yr²)', 'T²（年²）']), 'fg-sub');
  o += `<line x1="${X(0.01)}" y1="${Y(0.01)}" x2="${X(1000)}" y2="${Y(1000)}" class="fg-line f-fade" style="stroke:${C.gold};stroke-width:1.2;opacity:.7"/>`;
  pl.forEach(([n, a, c], i) => {
    const v = a ** 3;
    o += `<g class="f-fade" style="--d:${(0.3 + i * 0.12).toFixed(2)}s"><circle cx="${X(v).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3.2" fill="${c}"/>`
      + tx(X(v) + 6, Y(v) + 9, L(n), 'fg-label', 's', ` style="fill:${c}"`) + '</g>';
  });
  return svg(320, 166, o, L(['Kepler’s third law', '开普勒第三定律']));
}

/** The inverse-square law. */
function inverseSquare(L: Lx, id: string): string {
  const x0 = 40, x1 = 300, y0 = 140, y1 = 30, R = (r: number) => x0 + ((r - 0.5) / 4) * (x1 - x0), F = (f: number) => y0 - f * (y0 - y1);
  let o = arrowDef(id, '#9aa7b4') + tx(4, 12, L(['Gravity and distance: F ∝ 1/r²', '引力和距离：F ∝ 1/r²']), 'fg-title') + tx(4, 22, L(['force at r = 1 taken as F', '以 r = 1 处的引力为 F']), 'fg-sub');
  o += `<line x1="${x0}" y1="${y0}" x2="${x1 + 6}" y2="${y0}" stroke="#9aa7b4" marker-end="url(#${id})"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1 - 6}" stroke="#9aa7b4" marker-end="url(#${id})"/>`;
  const pts: string[] = [];
  for (let r = 1; r <= 4.5; r += 0.05) pts.push(`${R(r).toFixed(1)},${F(1 / (r * r)).toFixed(1)}`);
  o += `<polyline points="${pts.join(' ')}" class="fg-line f-fade" style="stroke:${C.orange}"/>`;
  ([[1, 'F'], [2, 'F/4'], [3, 'F/9'], [4, 'F/16']] as const).forEach(([r, s], i) => {
    const x = R(r), y = F(1 / (r * r));
    o += `<g class="f-fade" style="--d:${(0.4 + i * 0.2).toFixed(1)}s"><line x1="${x}" y1="${y0}" x2="${x}" y2="${y}" class="fg-grid" style="stroke:rgba(255,255,255,.25)"/><circle cx="${x}" cy="${y}" r="3" fill="${C.orange}"/>`
      + tx(x + 5, y - 4, s, 'fg-label') + tx(x, y0 + 10, `r = ${r}`, 'fg-tick', 'm') + '</g>';
  });
  o += tx(x1 + 4, y0 + 10, L(['distance', '距离']), 'fg-sub', 'e') + tx(x0 + 5, y1 - 2, L(['force', '引力']), 'fg-sub');
  return svg(320, 156, o, L(['The inverse-square law', '平方反比定律']));
}

const weights: Fig = { k: 'bars', title: ['A 40 kg student’s weight', '质量 40 千克的学生所受的重力'], unit: ['newtons (N); the mass is 40 kg everywhere', '单位：牛（N）；质量在哪里都是 40 千克'],
  rows: [
    { name: ['Moon', '月球'], v: 65, c: '#b9c0c8' }, { name: ['Mars', '火星'], v: 148, c: '#e07a52' }, { name: ['Venus', '金星'], v: 355, c: '#e8cf9a' },
    { name: ['Earth', '地球'], v: 392, c: '#4dabf7' }, { name: ['Jupiter', '木星'], v: 992, c: '#d9b38c' },
  ] };

// ------------------------------------------------------------------------------------------------ lessons

export const A_MOTION: Lesson[] = [
  {
    id: 'a-exploration', strand: 'motion', level: 'jr', tracks: JR, unit, icon: 'rocket', minutes: 9,
    title: ['Humans explore space', '人类探索太空'],
    blurb: ['Rockets, satellites, the Tiangong space station, Chang’e to the Moon and Tianwen-1 to Mars.', '火箭和卫星、天宫空间站、嫦娥探月和天问一号探火。'],
    keys: [
      ['To orbit the Earth a spacecraft must reach about 7.9 km/s sideways.', '航天器要达到约 7.9 千米/秒的水平速度，才能环绕地球运行。'],
      ['China’s Tiangong space station flies about 400 km up and circles the Earth in about 90 minutes.', '中国空间站“天宫”在约 400 千米高的轨道上运行，大约 90 分钟绕地球一圈。'],
      ['Chang’e-4 made the first landing on the Moon’s far side (2019); Chang’e-5 (2020) and Chang’e-6 (2024) brought back Moon samples.', '嫦娥四号首次在月球背面着陆（2019 年），嫦娥五号（2020 年）和嫦娥六号（2024 年）带回了月球样品。'],
      ['Tianwen-1 reached Mars in 2021, and its rover Zhurong drove on the Martian surface.', '天问一号在 2021 年到达火星，祝融号火星车在火星表面巡视探测。'],
      ['Space telescopes such as Hubble and JWST see the universe without the blurring air.', '哈勃、韦布等空间望远镜在大气层外观测，看得更清楚。'],
      ['Astronauts float not because there is no gravity, but because they and their station are falling round the Earth together.', '航天员飘浮起来不是因为没有引力，而是因为他们和空间站一起绕地球“下落”。'],
    ],
    steps: [
      {
        title: ['Rockets and orbits', '火箭和轨道'],
        body: ['A rocket throws hot gas backwards very fast, and the gas pushes the rocket forwards. To stay up, a spacecraft must fly sideways at about 7.9 km/s, roughly 28 000 km an hour. Slower, it falls back; at that speed it keeps falling around the Earth: it is in orbit.', '火箭向后高速喷出燃气，燃气就推着火箭向前飞。航天器要留在太空，必须沿水平方向飞到约 7.9 千米/秒，也就是每小时约 2.8 万千米。速度不够就会落回地面；达到这个速度，它就一直绕着地球“下落”，进入了轨道。'],
        astro: { kit: 'cannon', mode: 'shots', v: [4.5, 6.5, 7.9] },
      },
      {
        title: ['Tiangong, China’s space station', '中国空间站“天宫”'],
        body: ['Tiangong flies about 400 km above the ground and goes round the Earth about every 90 minutes, so its crew sees about 16 sunrises a day. Its core module Tianhe was launched in 2021 and the station was completed in 2022. Three astronauts usually live on board for about six months at a time.', '天宫空间站在离地面约 400 千米的高度飞行，大约每 90 分钟绕地球一圈，航天员一天能看到约 16 次日出。核心舱“天和”于 2021 年发射，空间站在 2022 年全面建成。通常有 3 名航天员在站上工作生活约 6 个月。'],
        astro: { kit: 'satellites', mode: 'leo', track: true, clock: { from: 0, to: 12, rate: 0.3, unit: 'hour', dp: 1 } },
      },
      {
        title: ['Floating in orbit', '太空中的失重'],
        body: ['At 400 km up, the Earth\'s gravity is still about 90% as strong as on the ground, so why do astronauts float? Because the station and everyone in it are falling round the Earth together, at the same rate. Nothing presses them against the floor, just as you feel light for a moment when a lift drops suddenly. This is weightlessness, or microgravity. In the Tiangong Classroom lessons, astronauts showed Chinese students how water forms floating balls and how a spinning top keeps its axis in orbit.', '在 400 千米高的轨道上，地球的引力仍有地面的约 90%，航天员为什么会飘起来？因为空间站和里面的一切都以相同的方式一起绕地球“下落”，没有什么东西把他们压向地板，就像电梯突然下降时你会感到身体一轻。这就是失重（微重力）。在“天宫课堂”上，航天员向同学们演示了太空中水会变成悬浮的水球、陀螺能稳稳保持方向等现象。'],
        astro: { kit: 'satellites', mode: 'leo', clock: { from: 0, to: 3, rate: 0.1, unit: 'hour', dp: 1 } },
      },
      {
        title: ['To the Moon', '飞向月球'],
        body: ['In 1969 Apollo 11’s astronauts became the first people to walk on the Moon. China’s Chang’e probes take about five days to get there. Chang’e-4 made the first ever landing on the Moon’s far side in 2019; Chang’e-5 brought back 1,731 g of Moon rock in 2020, and Chang’e-6 brought back the first samples from the far side in 2024.', '1969 年，阿波罗 11 号的航天员第一次踏上月球。中国的嫦娥探测器飞到月球大约需要 5 天。2019 年，嫦娥四号实现人类首次月球背面软着陆；2020 年，嫦娥五号带回 1731 克月球样品；2024 年，嫦娥六号带回了人类第一份月球背面样品。'],
        astro: { kit: 'satellites', mode: 'moon', clock: { from: 0, to: 6, rate: 0.7, unit: 'day', once: true } },
      },
      {
        title: ['To Mars: Tianwen-1', '飞向火星：天问一号'],
        body: ['Mars is much farther away, so a probe flies round the Sun on a long ellipse that touches Earth’s orbit at one end and Mars’s at the other. Tianwen-1 launched in July 2020 and reached Mars in February 2021, about 7 months later. In May 2021 its rover Zhurong landed and began exploring the Martian surface.', '火星远得多，探测器要沿一条绕太阳的长椭圆轨道飞行：一端与地球轨道相接，另一端与火星轨道相接。天问一号在 2020 年 7 月发射，2021 年 2 月到达火星，飞行了约 7 个月。2021 年 5 月，祝融号火星车成功着陆，开始在火星表面巡视探测。'],
        sketch: true,
        astro: { kit: 'satellites', mode: 'mars', clock: { from: 0, to: 280, rate: 28, unit: 'day', once: true } },
      },
      {
        title: ['Eyes above the air', '大气层外的“眼睛”'],
        body: ['Air blurs and blocks starlight, so astronomers put telescopes in space. Hubble has orbited a little over 500 km up since 1990. The James Webb Space Telescope, launched in 2021, works 1.5 million km from Earth and sees in infrared. Satellites also bring us weather maps, navigation (BeiDou) and phone links.', '大气会让星光变模糊，还会挡住一部分光，所以天文学家把望远镜送上太空。哈勃空间望远镜自 1990 年起在 500 多千米高的轨道上运行；2021 年发射的詹姆斯·韦布空间望远镜在离地球约 150 万千米的地方用红外线观测。人造卫星还为我们提供天气云图、导航（北斗）和通信。'],
        fig: { k: 'svg', draw: L => timeline(L) },
        astro: { kit: 'satellites', mode: 'overview', clock: { from: 0, to: 48, rate: 1, unit: 'hour' } },
      },
      {
        title: ['What comes next', '未来的探索'],
        body: ['China\'s plans keep growing. Tianwen-2, launched in 2025, is flying to a small near-Earth asteroid to bring back a sample and then visit a comet. Chang\'e-7 and Chang\'e-8 are planned to explore the Moon\'s south pole, looking for water ice, and to test building a research station there. China aims to land astronauts on the Moon before 2030, using the new Long March 10 rocket, the Mengzhou spacecraft and the Lanyue lander. Mission dates can slip: space is hard, and safety comes first.', '我国的探索计划不断推进。2025 年发射的天问二号正飞往一颗近地小行星采样返回，之后还将探测一颗彗星。嫦娥七号、嫦娥八号计划探测月球南极，寻找水冰，并试验建设月球科研站的技术。我国计划在 2030 年前实现中国人首次登陆月球，将使用长征十号火箭、梦舟飞船和揽月着陆器。航天任务的日期可能推迟：太空探索很难，安全永远第一。'],
        astro: { kit: 'satellites', mode: 'moon', clock: { from: 0, to: 6, rate: 0.7, unit: 'day', once: true } },
      },
    ],
    quiz: [
      { q: ['Which mission made the first landing on the Moon’s far side?', '哪个探测器首次在月球背面着陆？'],
        options: [['Apollo 11', '阿波罗 11 号'], ['Chang’e-4', '嫦娥四号'], ['Tianwen-1', '天问一号'], ['Hubble', '哈勃望远镜']], answer: 1,
        why: ['Chang’e-4 landed on the far side in January 2019. Apollo 11 landed on the near side in 1969.', '嫦娥四号在 2019 年 1 月于月球背面着陆。阿波罗 11 号 1969 年降落在月球正面。'] },
      { q: ['Tap the Tiangong space station.', '在图中点出天宫空间站。'], pick: 'tiangong',
        astro: { kit: 'satellites', mode: 'overview', labels: false, clock: { from: 0, to: 48, rate: 0.3, unit: 'hour' } },
        why: ['Tiangong is in low Earth orbit, only about 400 km up: the satellite skimming just above the Earth.', '天宫在近地轨道上，离地面只有约 400 千米，就是紧贴着地球飞行的那颗。'] },
      { q: ['About how long does Tiangong take to go once round the Earth?', '天宫绕地球一圈大约需要多长时间？'],
        options: [['About 90 minutes', '约 90 分钟'], ['About 24 hours', '约 24 小时'], ['About 27 days', '约 27 天'], ['About a year', '约 1 年']], answer: 0,
        why: ['Low orbits are fast: about 7.7 km/s, once round in about 90 minutes.', '近地轨道速度很快，约 7.7 千米/秒，大约 90 分钟绕地球一圈。'] },
      { q: ['Which world did the rover Zhurong explore?', '祝融号巡视探测的是哪个星球？'],
        options: [['The Moon', '月球'], ['Venus', '金星'], ['Mars', '火星'], ['Jupiter', '木星']], answer: 2,
        why: ['Zhurong landed on Mars in May 2021, carried there by Tianwen-1.', '祝融号由天问一号送到火星，2021 年 5 月着陆。'] },
      { q: ['Put these events in order, earliest first.', '把下列事件按时间先后排序。'],
        order: [['Sputnik 1, the first satellite', '第一颗人造卫星斯普特尼克 1 号'], ['Gagarin, the first person in space', '加加林首次进入太空'], ['Apollo 11 lands on the Moon', '阿波罗 11 号登月'], ['Yang Liwei flies on Shenzhou-5', '杨利伟乘神舟五号飞天'], ['Chang’e-4 lands on the far side', '嫦娥四号在月球背面着陆']],
        why: ['1957, 1961, 1969, 2003 and 2019.', '分别是 1957、1961、1969、2003 和 2019 年。'] },
      { q: ['Match each mission to its target.', '把任务和它的探测目标连起来。'],
        match: [[['Chang’e-6', '嫦娥六号'], ['Samples from the Moon’s far side', '月球背面样品']], [['Tianwen-1', '天问一号'], ['Mars', '火星']], [['Tianwen-2', '天问二号'], ['A near-Earth asteroid', '一颗近地小行星']], [['James Webb telescope', '韦布空间望远镜'], ['Distant galaxies in infrared light', '用红外线观测遥远星系']]],
        why: ['Chang’e-6 returned far-side samples in 2024, Tianwen-1 reached Mars in 2021, Tianwen-2 launched to an asteroid in 2025, and JWST observes in the infrared.', '嫦娥六号 2024 年带回月背样品，天问一号 2021 年到达火星，天问二号 2025 年飞往小行星，韦布望远镜在红外波段观测。'] },
      { q: ['Tiangong goes once round the Earth in about 90 minutes. About how many times does it go round in one day (24 hours)?', '天宫大约 90 分钟绕地球一圈，一天（24 小时）大约绕多少圈？'], num: { answer: 16, tol: 0.6, unit: ['times', '圈'] },
        why: ['24 × 60 = 1,440 minutes; 1,440 ÷ 90 = 16 laps, so the crew sees about 16 sunrises a day.', '24 × 60 = 1440 分钟，1440 ÷ 90 = 16 圈，所以航天员一天能看到约 16 次日出。'] },
      { q: ['Why do astronauts float inside Tiangong? Pick all that are true.', '航天员为什么能在天宫里飘浮？选出所有正确的说法。'], options: [['The station and the crew are falling round the Earth together', '空间站和航天员一起绕地球“下落”'], ['Gravity up there is still about 90% of that on the ground', '那里的引力仍有地面的约 90%'], ['There is no gravity in space', '太空中没有引力'], ['The station is too far away for the Earth to pull it', '空间站太远，地球拉不到它']], multi: [0, 1],
        why: ['Gravity keeps the station in orbit; without it, Tiangong would fly off in a straight line. Everything falls together, so nothing presses on the floor.', '正是引力让空间站绕地球运行，没有引力它就会沿直线飞走。舱内一切一起下落，所以没有东西压在地板上。'] },
    ],
  },
  {
    id: 'a-gravity', strand: 'motion', level: 'jr', tracks: JR, unit, icon: 'sun', minutes: 8,
    title: ['Gravity keeps the planets going round', '引力让行星绕太阳转'],
    blurb: ['Why the planets circle the Sun, what would happen without gravity, and why you would weigh less on the Moon.', '行星为什么绕太阳转？没有引力会怎样？为什么在月球上体重会变轻？'],
    keys: [
      ['Every object with mass pulls on every other: this is gravity.', '任何有质量的物体之间都相互吸引，这就是万有引力。'],
      ['The Sun’s gravity keeps bending each planet’s path, so it goes round instead of flying away.', '太阳的引力不断改变行星的运动方向，使它绕太阳转动而不飞走。'],
      ['Without gravity a moving planet would fly off in a straight line.', '如果没有引力，运动的行星会沿直线飞走。'],
      ['Gravity is stronger between bigger masses and weaker the farther apart they are.', '物体质量越大，引力越大；距离越远，引力越小。'],
      ['Your mass is the same everywhere; your weight depends on the gravity where you are.', '你的质量在哪里都一样，而所受的重力随所在星球的引力而变。'],
    ],
    steps: [
      {
        title: ['A pull towards the Sun', '指向太阳的拉力'],
        body: ['The Earth races sideways at about 30 km/s (green arrow). At the same time the Sun’s gravity pulls it towards the Sun (orange arrow). The pull keeps bending the Earth’s path, so it goes round and round the Sun.', '地球以约 30 千米/秒的速度向前飞（绿色箭头），同时太阳的引力把它拉向太阳（橙色箭头）。这个拉力不断改变地球的运动方向，于是地球一圈又一圈地绕太阳转。'],
        astro: { kit: 'kepler', mode: 'gravity', cut: 0 },
      },
      {
        title: ['Switch gravity off', '如果引力消失'],
        body: ['Imagine the Sun’s gravity suddenly vanished. Nothing would bend the Earth’s path any more, so it would fly off in a straight line in the direction it was moving at that moment, like a stone let go from a sling.', '设想太阳的引力突然消失了。再也没有力改变地球的运动方向，它就会沿着那一刻的运动方向笔直飞走，就像用绳子甩动的石块松手后飞出去一样。'],
        astro: { kit: 'kepler', mode: 'gravity', cut: 1.25 },
      },
      {
        title: ['Falling around the Earth', '绕着地球“下落”'],
        body: ['Newton imagined a cannon on a very high mountain. A slow cannonball falls nearby; a faster one lands farther away. At about 7.9 km/s the ground curves away as fast as the ball falls, so it never lands: it circles the Earth. The Moon and satellites are falling around the Earth like this.', '牛顿设想在一座很高的山顶上架一门大炮。炮弹打得慢，落在近处；打得快，落得更远。速度达到约 7.9 千米/秒时，地面弯下去的速度和炮弹下落一样快，炮弹再也落不了地，就绕着地球转。月球和人造卫星就是这样绕着地球“下落”的。'],
        sketch: true,
        astro: { kit: 'cannon', mode: 'shots', v: [3.5, 6, 7.9] },
      },
      {
        title: ['Mass and distance', '质量和距离'],
        body: ['The more mass an object has, the harder it pulls; the farther away you are, the weaker the pull. The Sun holds 99.8% of the Solar System’s mass, so everything orbits it. Near the Sun the pull is strong and planets race round: Mercury takes 88 days, Jupiter almost 12 years.', '物体的质量越大，引力越大；距离越远，引力越小。太阳占太阳系总质量的 99.8%，所以所有行星都绕着它转。离太阳越近，引力越强，行星转得越快：水星绕太阳一圈只要 88 天，木星却要将近 12 年。'],
        sketch: true,
        astro: { kit: 'kepler', mode: 'law3', clock: { from: 0, to: 12, rate: 0.4, unit: 'year' } },
      },
      {
        title: ['Your weight on other worlds', '在其他星球上的体重'],
        body: ['Mass is how much matter you are made of, and it is the same everywhere. Weight is the pull of gravity on you. A 40 kg student weighs about 390 N on Earth, only about 65 N on the Moon (one sixth) and about 990 N on giant Jupiter.', '质量是物体所含物质的多少，在哪里都一样；重力是星球的引力对你的拉力。一个质量 40 千克的学生在地球上受到的重力约 390 牛，在月球上只有约 65 牛（约六分之一），在巨大的木星上却约有 990 牛。'],
        fig: weights,
        sketch: true,
        astro: { kit: 'kepler', mode: 'law3', planets: ['venus', 'earth', 'mars', 'jupiter'], clock: { from: 0, to: 12, rate: 0.4, unit: 'year' } },
      },
    ],
    quiz: [
      { q: ['If the Sun’s gravity suddenly vanished, the Earth would…', '如果太阳的引力突然消失，地球会'],
        options: [['fall into the Sun', '掉进太阳里'], ['stop moving', '停下来不动'], ['fly off in a straight line', '沿直线飞走'], ['keep circling the Sun', '继续绕太阳转']], answer: 2,
        why: ['With no pull to bend its path, the Earth keeps going straight in the direction it was moving.', '没有引力改变它的运动方向，地球就沿原来的运动方向一直直线飞行。'],
        astro: { kit: 'kepler', mode: 'gravity', cut: 0 } },
      { q: ['The gravity between two objects gets weaker when…', '两个物体之间的引力在什么情况下会变小？'],
        options: [['they move farther apart', '它们离得更远'], ['their masses get bigger', '它们的质量变大'], ['they move faster', '它们运动得更快'], ['they get hotter', '它们温度升高']], answer: 0,
        why: ['Gravity weakens with distance and grows with mass.', '距离越远引力越小，质量越大引力越大。'] },
      { q: ['An astronaut has a mass of 60 kg on Earth. On the Moon her mass is…', '一名航天员在地球上的质量是 60 千克，她在月球上的质量是'],
        options: [['10 kg', '10 千克'], ['60 kg', '60 千克'], ['0 kg', '0 千克'], ['360 kg', '360 千克']], answer: 1,
        why: ['Mass does not change. Her weight on the Moon is about one sixth, because the Moon’s gravity is weaker.', '质量不会变。月球引力较小，她在月球上受到的重力约为地球上的六分之一。'] },
      { q: ['On which world would you weigh the most?', '在哪个星球上你受到的重力最大？'],
        options: [['Mars', '火星'], ['the Moon', '月球'], ['Earth', '地球'], ['Jupiter', '木星']], answer: 3,
        why: ['Jupiter is so massive that its surface gravity is about 2.5 times Earth’s.', '木星质量非常大，它表面的引力约是地球的 2.5 倍。'] },
    ],
  },
  {
    id: 'a-kepler', strand: 'motion', level: 'sr', tracks: SR, unit, icon: 'planet', minutes: 10,
    title: ['Kepler’s three laws', '开普勒三定律'],
    blurb: ['Ellipses, equal areas in equal times, and T² ∝ a³: the rules of planetary motion.', '椭圆轨道、相等时间扫过相等面积、T² ∝ a³：行星运动的规律。'],
    keys: [
      ['First law: every planet moves on an ellipse with the Sun at one focus.', '第一定律：所有行星绕太阳运动的轨道都是椭圆，太阳处在椭圆的一个焦点上。'],
      ['Second law: the line from the Sun to a planet sweeps out equal areas in equal times, so a planet is fastest at perihelion.', '第二定律：太阳和行星的连线在相等的时间内扫过相等的面积，所以行星在近日点最快。'],
      ['Third law: a³/T² is the same for every planet of the Sun; with a in AU and T in years, T² = a³.', '第三定律：所有行星轨道半长轴的三次方与公转周期的二次方之比都相等；a 以天文单位、T 以年为单位时，T² = a³。'],
      ['The constant depends only on the central mass: a³/T² = GM/4π². The laws hold for moons and satellites too.', '这个比值只与中心天体的质量有关：a³/T² = GM/4π²。卫星绕行星运动同样遵循这些规律。'],
    ],
    steps: [
      {
        title: ['First law: ellipses', '第一定律：椭圆轨道'],
        body: ['Using Tycho Brahe’s careful measurements of Mars, Kepler found in 1609 that planets move on ellipses, not circles, with the Sun at one focus. The eccentricity e = c/a says how stretched an ellipse is: e = 0 is a circle. Real planet orbits are nearly round: Earth e = 0.017, Mars 0.093.', '开普勒利用第谷对火星的精确观测资料，在 1609 年发现行星的轨道是椭圆而不是圆，太阳在椭圆的一个焦点上。偏心率 e = c/a 表示椭圆的扁平程度，e = 0 就是圆。行星的实际轨道都很接近圆：地球 e = 0.017，火星 e = 0.093。'],
        astro: { kit: 'kepler', mode: 'law1', string: false, clock: { from: 0, to: 0.8, rate: 0.08, unit: 'x', fmt: ['e = {v}', '偏心率 e = {v}'], dp: 2 } },
      },
      {
        title: ['Two pins and a string', '两个图钉和一根线'],
        body: ['To draw an ellipse, pin a loop of string at two points, the foci, and run a pencil round it: the distances r₁ + r₂ always add up to 2a. The Sun sits at one focus; the other is empty. The nearest point to the Sun is perihelion, the farthest aphelion.', '画椭圆时，把一根线的两端固定在两个点（焦点）上，用笔把线拉紧画一圈：两段距离之和 r₁ + r₂ 始终等于 2a。太阳在一个焦点上，另一个焦点上什么也没有。轨道上离太阳最近的点叫近日点，最远的点叫远日点。'],
        astro: { kit: 'kepler', mode: 'law1', e: 0.6, axes: false },
      },
      {
        title: ['Second law: equal areas', '第二定律：面积定律'],
        body: ['The line from the Sun to a planet sweeps out equal areas in equal times. Each coloured wedge takes the same time, so near perihelion, where the wedges are short and wide, the planet must move faster. Earth moves at 30.3 km/s in early January and 29.3 km/s in early July.', '太阳和行星的连线在相等的时间内扫过相等的面积。每块彩色扇形所用的时间相同，近日点附近的扇形又短又宽，所以行星在那里运动得更快。地球在 1 月初的速度约为 30.3 千米/秒，7 月初约为 29.3 千米/秒。'],
        astro: { kit: 'kepler', mode: 'law2', e: 0.6, sectors: 8, clock: { from: 0, to: 2, rate: 0.08, unit: 'x', fmt: ['t = {v} T', 't = {v} T'], dp: 2 } },
      },
      {
        title: ['Third law: T² ∝ a³', '第三定律：T² ∝ a³'],
        body: ['Farther planets have longer years, and not just in proportion: a³/T² is the same for every planet. With a in AU and T in years, T² = a³. Mars at a = 1.52 AU takes 1.88 years; Jupiter at 5.20 AU takes 11.9 years. On log scales every planet falls on one straight line.', '离太阳越远的行星公转周期越长，而且不是简单的正比关系：所有行星的 a³/T² 都相等。a 以天文单位、T 以年为单位时，T² = a³。火星 a = 1.52 天文单位，周期 1.88 年；木星 a = 5.20 天文单位，周期 11.9 年。在对数坐标中，所有行星都落在同一条直线上。'],
        fig: { k: 'svg', draw: L => keplerFig(L) },
        sketch: true,
        astro: { kit: 'kepler', mode: 'law3', clock: { from: 0, to: 12, rate: 0.5, unit: 'year' } },
      },
      {
        title: ['Why it works: gravity', '原因：万有引力'],
        body: ['Newton showed that all three laws follow from gravity, F = GMm/r². For a circular orbit, GMm/r² = m(2π/T)²r gives a³/T² = GM/4π²: the constant depends only on the central mass. So the laws also hold for moons around planets and satellites around the Earth, each with its own constant.', '牛顿证明，开普勒三定律都可以由万有引力定律 F = GMm/r² 推出。对圆轨道，GMm/r² = m(2π/T)²r，得到 a³/T² = GM/4π²：这个比值只与中心天体的质量有关。所以卫星绕行星、人造卫星绕地球的运动也遵循开普勒定律，只是比值不同。'],
        astro: { kit: 'satellites', mode: 'overview', clock: { from: 0, to: 48, rate: 1, unit: 'hour' } },
      },
    ],
    quiz: [
      { q: ['Where is the Sun on a planet’s elliptical orbit?', '在行星的椭圆轨道中，太阳位于'],
        options: [['At the centre of the ellipse', '椭圆的中心'], ['At one focus', '椭圆的一个焦点上'], ['At aphelion', '远日点'], ['On the orbit itself', '轨道上']], answer: 1,
        why: ['Kepler’s first law: the Sun is at one focus; the other focus is empty.', '开普勒第一定律：太阳在椭圆的一个焦点上，另一个焦点是空的。'],
        astro: { kit: 'kepler', mode: 'law1', e: 0.6, string: false } },
      { q: ['Where on its orbit does a planet move fastest?', '行星在轨道上哪里运动得最快？'],
        options: [['At aphelion', '远日点'], ['The speed never changes', '速度始终不变'], ['At perihelion', '近日点'], ['Halfway between', '两者之间的中点']], answer: 2,
        why: ['Equal areas in equal times: close to the Sun the planet must cover more of its orbit in the same time.', '相等时间扫过相等面积：离太阳近时，行星在相同时间内要走更长的路程。'] },
      { q: ['An asteroid’s orbit has a = 4 AU. What is its period?', '某小行星轨道的半长轴 a = 4 天文单位，它的公转周期是'],
        options: [['4 years', '4 年'], ['16 years', '16 年'], ['64 years', '64 年'], ['8 years', '8 年']], answer: 3,
        why: ['T² = a³ = 64, so T = 8 years.', 'T² = a³ = 64，所以 T = 8 年。'] },
      { q: ['Which quantity is the same for all the planets of the Sun?', '对太阳系所有行星都相同的量是'],
        options: [['a³ / T²', '比值 a³ / T²'], ['a / T', '比值 a / T'], ['a × T', '乘积 a × T'], ['T² × a³', '乘积 T² × a³']], answer: 0,
        why: ['Kepler’s third law: a³/T² = GM/4π², fixed by the Sun’s mass.', '开普勒第三定律：a³/T² = GM/4π²，由太阳的质量决定。'] },
    ],
  },
  {
    id: 'a-cosmic-speeds', strand: 'motion', level: 'sr', tracks: SR, unit, icon: 'rocket', minutes: 11,
    title: ['Gravitation and the cosmic speeds', '万有引力和宇宙速度'],
    blurb: ['F = GMm/r², Newton’s cannon and the three cosmic speeds: 7.9, 11.2 and 16.7 km/s.', 'F = GMm/r²、牛顿的大炮和三个宇宙速度：7.9、11.2、16.7 千米/秒。'],
    keys: [
      ['Law of universal gravitation: F = GMm/r², with G = 6.67 × 10⁻¹¹ N·m²/kg².', '万有引力定律：F = GMm/r²，引力常量 G = 6.67 × 10⁻¹¹ N·m²/kg²。'],
      ['First cosmic speed v₁ = √(GM/R) ≈ 7.9 km/s: the least launch speed to orbit the Earth.', '第一宇宙速度 v₁ = √(GM/R) ≈ 7.9 千米/秒，是发射人造地球卫星的最小速度。'],
      ['Between 7.9 and 11.2 km/s the orbit is an ellipse around the Earth.', '发射速度介于 7.9 千米/秒和 11.2 千米/秒之间时，卫星沿椭圆轨道绕地球运行。'],
      ['Second cosmic speed v₂ = √2 · v₁ ≈ 11.2 km/s: escape from the Earth.', '第二宇宙速度 v₂ = √2 · v₁ ≈ 11.2 千米/秒，达到它就能挣脱地球引力。'],
      ['Third cosmic speed 16.7 km/s: escape from the Solar System.', '第三宇宙速度为 16.7 千米/秒，达到它就能挣脱太阳引力，飞出太阳系。'],
    ],
    steps: [
      {
        title: ['Universal gravitation', '万有引力定律'],
        body: ['Newton proposed that any two masses attract with F = GMm/r², where G = 6.67 × 10⁻¹¹ N·m²/kg². Double the distance and the force drops to a quarter. The same force that pulls an apple down holds the Moon in orbit. Fire a cannonball sideways from a mountain and gravity bends its path back to the ground.', '牛顿提出：任何两个物体之间都相互吸引，F = GMm/r²，其中引力常量 G = 6.67 × 10⁻¹¹ N·m²/kg²。距离加倍，引力变为原来的四分之一。让苹果落地的力，也正是让月球绕地球运行的力。从山顶水平射出炮弹，引力会使它的路径弯曲，落回地面。'],
        fig: { k: 'svg', draw: (L, id) => inverseSquare(L, id) },
        astro: { kit: 'cannon', mode: 'shots', v: [3, 5, 6.5] },
      },
      {
        title: ['First cosmic speed', '第一宇宙速度'],
        body: ['For a circular orbit just above the ground, gravity provides the centripetal force: GMm/R² = mv²/R, so v₁ = √(GM/R) = √(gR) ≈ 7.9 km/s. It is the least launch speed for a satellite and the greatest speed of any circular orbit, since higher orbits are slower.', '卫星贴近地面做匀速圆周运动时，万有引力提供向心力：GMm/R² = mv²/R，所以 v₁ = √(GM/R) = √(gR) ≈ 7.9 千米/秒。它是发射人造卫星的最小速度，也是卫星绕地球做圆周运动的最大速度，因为轨道越高，运行速度越小。'],
        astro: { kit: 'cannon', mode: 'speed', marks: [7.9], clock: { from: 6, to: 8.4, rate: 0.2, unit: 'kms', at: 0.1 } },
      },
      {
        title: ['Faster: ellipses', '更快：椭圆轨道'],
        body: ['Launch faster than 7.9 km/s and the orbit becomes an ellipse, with the launch point as perigee. The faster the launch, the more stretched the ellipse and the higher the apogee. Up to 11.2 km/s the spacecraft still stays bound to the Earth.', '发射速度大于 7.9 千米/秒时，卫星的轨道变为椭圆，发射点就是近地点。发射速度越大，椭圆越扁长，远地点越高。只要不超过 11.2 千米/秒，航天器仍然绕地球运行。'],
        astro: { kit: 'cannon', mode: 'shots', v: [7.9, 9, 9.8, 10.3] },
      },
      {
        title: ['Second cosmic speed: escape', '第二宇宙速度：挣脱地球'],
        body: ['At v₂ = √(2GM/R) = √2 · v₁ ≈ 11.2 km/s the path opens into a parabola and never comes back; faster still, a hyperbola. The spacecraft escapes the Earth’s gravity and becomes a small planet orbiting the Sun. Probes to Mars, such as Tianwen-1, must beat this speed.', '发射速度达到 v₂ = √(2GM/R) = √2 · v₁ ≈ 11.2 千米/秒时，轨道变成抛物线，航天器一去不返；速度更大则是双曲线。航天器挣脱了地球引力，成为绕太阳运行的“人造行星”。天问一号这样的火星探测器，发射速度必须超过这个值。'],
        astro: { kit: 'cannon', mode: 'speed', marks: [7.9, 10], clock: { from: 9.5, to: 12.5, rate: 0.2, unit: 'kms' } },
      },
      {
        title: ['Third cosmic speed: leaving the Sun', '第三宇宙速度：飞出太阳系'],
        body: ['The Earth already carries us round the Sun at 29.8 km/s; escaping the Sun from Earth’s orbit needs 42.1 km/s. Launching in the direction of Earth’s motion, a probe needs 16.7 km/s from the ground to leave the Solar System. Voyager 1 and 2, helped by planet fly-bys, are now in interstellar space.', '地球带着我们以 29.8 千米/秒的速度绕太阳运行，从地球轨道处挣脱太阳引力需要 42.1 千米/秒。顺着地球公转方向发射，探测器在地面的发射速度达到 16.7 千米/秒，就能飞出太阳系。借助行星引力加速的旅行者 1 号和 2 号，如今已进入星际空间。'],
        fig: { k: 'bars', title: ['The three cosmic speeds', '三个宇宙速度'], unit: ['km/s, launched from the Earth’s surface', '千米/秒，从地面发射'],
          rows: [{ name: ['1st: orbit', '第一：环绕地球'], v: 7.9, c: C.green }, { name: ['2nd: escape Earth', '第二：脱离地球'], v: 11.2, c: C.violet }, { name: ['3rd: leave the Sun', '第三：飞出太阳系'], v: 16.7, c: C.red }] },
        astro: { kit: 'cannon', mode: 'solar', clock: { from: 12, to: 17.5, rate: 0.35, unit: 'kms', at: 0.3 } },
      },
    ],
    quiz: [
      { q: ['If the distance between two masses triples, the gravitational force becomes…', '两个物体间的距离变为原来的 3 倍，它们之间的引力变为原来的'],
        options: [['1/3', '1/3 倍'], ['1/9', '1/9 倍'], ['3 times', '3 倍'], ['9 times', '9 倍']], answer: 1,
        why: ['F ∝ 1/r²: three times the distance gives 1/3² = 1/9 of the force.', 'F ∝ 1/r²，距离变为 3 倍，引力变为 1/3² = 1/9。'] },
      { q: ['A cannonball is fired horizontally near the ground at 10 km/s. It will…', '在地面附近以 10 千米/秒水平发射一颗炮弹，它将'],
        options: [['fall back to the ground', '落回地面'], ['circle just above the ground', '贴着地面做圆周运动'], ['orbit the Earth on an ellipse', '沿椭圆轨道绕地球运行'], ['escape the Earth', '挣脱地球引力']], answer: 2,
        why: ['10 km/s is between 7.9 and 11.2 km/s: an elliptical orbit with the launch point as perigee.', '10 千米/秒介于 7.9 和 11.2 千米/秒之间，轨道是椭圆，发射点为近地点。'],
        astro: { kit: 'cannon', mode: 'speed', v: 10 } },
      { q: ['Which expression gives the first cosmic speed (M, R: the Earth’s mass and radius)?', '第一宇宙速度的表达式是（M、R 为地球的质量和半径）'],
        options: [['v = √(2GM/R)', '速度 v = √(2GM/R)'], ['v = GM/R²', '速度 v = GM/R²'], ['v = √(GM/R)', '速度 v = √(GM/R)'], ['v = √(GMR)', '速度 v = √(GMR)']], answer: 2,
        why: ['GMm/R² = mv²/R gives v₁ = √(GM/R) ≈ 7.9 km/s; √(2GM/R) is the escape speed.', '由 GMm/R² = mv²/R 得 v₁ = √(GM/R) ≈ 7.9 千米/秒；√(2GM/R) 是第二宇宙速度。'] },
      { q: ['What does 16.7 km/s let a probe launched from Earth do?', '从地球发射的探测器达到 16.7 千米/秒，能够'],
        options: [['Leave the Solar System', '飞出太阳系'], ['Orbit the Earth', '绕地球运行'], ['Just escape the Earth', '刚好挣脱地球引力'], ['Reach the Moon', '到达月球']], answer: 0,
        why: ['16.7 km/s is the third cosmic speed: enough to escape the Sun’s gravity too.', '16.7 千米/秒是第三宇宙速度，足以挣脱太阳的引力。'] },
    ],
  },
  {
    id: 'a-satellites', strand: 'motion', level: 'sr', tracks: SR, unit, icon: 'globe', minutes: 10,
    title: ['Orbits of artificial satellites', '人造卫星的轨道'],
    blurb: ['Why higher satellites are slower, low and polar orbits, geostationary satellites and the BeiDou system.', '为什么卫星越高越慢？近地轨道、极地轨道、地球静止卫星和北斗系统。'],
    keys: [
      ['Gravity is the centripetal force: GMm/r² = mv²/r, so v = √(GM/r) and T = 2π√(r³/GM). Higher orbits are slower and longer.', '万有引力提供向心力：GMm/r² = mv²/r，得 v = √(GM/r)，T = 2π√(r³/GM)。轨道越高，速度越小，周期越长。'],
      ['Low Earth orbit (about 400 km, 90 min) suits space stations such as Tiangong.', '近地轨道（约 400 千米、约 90 分钟一圈）适合天宫等空间站。'],
      ['Polar orbits pass over every latitude; their ground track shifts west each lap.', '极地轨道经过地球上所有纬度，每绕一圈星下点轨迹向西移动。'],
      ['A geostationary satellite orbits 35 786 km above the equator once per sidereal day and stays above one point.', '地球静止卫星位于赤道上空 35 786 千米，周期等于地球自转周期，始终停留在同一地点上空。'],
      ['BeiDou combines MEO, GEO and IGSO satellites for worldwide navigation.', '北斗系统由中圆轨道、地球静止轨道和倾斜地球同步轨道卫星组成，提供全球导航服务。'],
    ],
    steps: [
      {
        title: ['Higher is slower', '越高越慢'],
        body: ['Gravity provides the centripetal force: GMm/r² = mv²/r, so v = √(GM/r) and T = 2π√(r³/GM). The farther from the Earth’s centre, the slower and longer the orbit. Tiangong, 400 km up, moves at 7.7 km/s and laps in 92 min; a geostationary satellite, 42 164 km from the centre, moves at 3.1 km/s and takes a day.', '万有引力提供向心力：GMm/r² = mv²/r，所以 v = √(GM/r)，T = 2π√(r³/GM)。离地心越远，运行速度越小，周期越长。天宫在约 400 千米高处，速度约 7.7 千米/秒，92 分钟绕一圈；地球静止卫星离地心 42 164 千米，速度只有约 3.1 千米/秒，一天才绕一圈。'],
        fig: { k: 'bars', title: ['Higher orbit, longer period', '轨道越高，周期越长'], unit: ['period in hours', '周期（小时）'],
          rows: [{ name: ['Tiangong 400 km', '天宫 400 千米'], v: 1.5, c: C.white }, { name: ['polar 700 km', '极地轨道 700 千米'], v: 1.6, c: C.teal }, { name: ['BeiDou MEO', '北斗中圆轨道'], v: 12.9, c: C.violet }, { name: ['geostationary', '地球静止轨道'], v: 23.9, c: C.gold }] },
        astro: { kit: 'satellites', mode: 'overview', clock: { from: 0, to: 48, rate: 1.2, unit: 'hour' } },
      },
      {
        title: ['Low Earth orbit: Tiangong', '近地轨道：天宫空间站'],
        body: ['Tiangong orbits about 400 km up, tilted 41.5° to the equator, about 15.5 laps a day. As the Earth turns beneath it, its ground track (gold) weaves between 41.5°N and 41.5°S. Low orbits are easy to reach and close for crews and cameras, but thin air slowly drags them down, so stations need regular boosts.', '天宫在约 400 千米高的轨道上运行，轨道面与赤道面的夹角为 41.5°，每天绕地球约 15.5 圈。地球在下方自转，它的星下点轨迹（金色）在北纬 41.5° 和南纬 41.5° 之间来回穿梭。近地轨道容易到达，离地面近，便于航天员往返和对地观测，但稀薄大气会使轨道慢慢降低，所以空间站需要定期抬升轨道。'],
        astro: { kit: 'satellites', mode: 'leo', track: true, clock: { from: 0, to: 12, rate: 0.3, unit: 'hour', dp: 1 } },
      },
      {
        title: ['Polar and sun-synchronous orbits', '极地轨道和太阳同步轨道'],
        body: ['A polar orbit passes near both poles. The Earth turns about 25° during each 99-minute lap, so the ground track shifts west and the satellite eventually sees the whole planet. In a sun-synchronous orbit the orbital plane turns with the Sun, so each place is passed at the same local time: ideal for weather satellites such as Fengyun-3.', '极地轨道经过地球两极附近。卫星每绕一圈约 99 分钟，这期间地球自转约 25°，所以星下点轨迹不断向西移动，卫星最终能看遍整个地球。太阳同步轨道的轨道面随太阳转动，卫星总在相同的地方时经过同一地点上空，非常适合风云三号这样的气象卫星。'],
        astro: { kit: 'satellites', mode: 'polar', clock: { from: 0, to: 12, rate: 0.3, unit: 'hour', dp: 1 } },
      },
      {
        title: ['Geostationary orbit', '地球静止轨道'],
        body: ['At 35 786 km up (r = 42 164 km) the period equals one turn of the Earth, 23 h 56 min. A satellite there, moving east above the equator, keeps pace with the turning ground and hangs over one spot, so dishes can point at it without moving. It must be above the equator: every orbit is centred on the Earth’s centre.', '在赤道上空 35 786 千米（r = 42 164 千米）处，卫星的周期等于地球自转周期 23 时 56 分。卫星在赤道上空自西向东运行，与地面同步转动，始终停在同一地点上空，地面天线不用转动就能对准它。它只能位于赤道上空，因为卫星轨道平面必须经过地心。'],
        astro: { kit: 'satellites', mode: 'geo', clock: { from: 0, to: 24, rate: 1.5, unit: 'hour' } },
      },
      {
        title: ['The BeiDou navigation system', '北斗卫星导航系统'],
        body: ['BeiDou-3, completed in 2020, uses 24 satellites in medium Earth orbit at about 21 500 km in three planes tilted 55°, plus 3 geostationary and 3 inclined geosynchronous (IGSO) satellites over Asia and the Pacific. A receiver times signals from at least four satellites to work out where it is.', '北斗三号系统于 2020 年建成，由 24 颗约 2.15 万千米高、分布在 3 个倾角 55° 轨道面上的中圆轨道卫星，加上 3 颗地球静止轨道卫星和 3 颗倾斜地球同步轨道卫星组成，后两类重点覆盖亚太地区。接收机测量至少 4 颗卫星信号的传播时间，就能算出自己的位置。'],
        astro: { kit: 'satellites', mode: 'beidou', clock: { from: 0, to: 26, rate: 1.2, unit: 'hour' } },
      },
    ],
    quiz: [
      { q: ['Tap the geostationary satellite.', '在图中点出一颗地球静止卫星。'], pick: 'geo',
        astro: { kit: 'satellites', mode: 'overview', labels: false, clock: { from: 0, to: 48, rate: 0.6, unit: 'hour' } },
        why: ['Geostationary satellites sit far out, 6.6 Earth radii from the centre, on a ring above the equator.', '地球静止卫星离地心约 6.6 个地球半径，位于赤道上空的圆环轨道上。'] },
      { q: ['Compared with Tiangong, a geostationary satellite moves…', '与天宫相比，地球静止卫星'],
        options: [['faster, with a shorter period', '速度更大，周期更短'], ['slower, with a longer period', '速度更小，周期更长'], ['at the same speed', '速度相同'], ['faster, with a longer period', '速度更大，周期更长']], answer: 1,
        why: ['v = √(GM/r) falls and T = 2π√(r³/GM) grows with r: 3.1 km/s and 24 h against 7.7 km/s and 92 min.', 'v = √(GM/r) 随 r 增大而减小，T = 2π√(r³/GM) 随 r 增大而增大：3.1 千米/秒、24 小时，对比 7.7 千米/秒、92 分钟。'] },
      { q: ['Why can’t a geostationary satellite hover above Beijing?', '为什么不能让地球静止卫星停在北京上空？'],
        options: [['Beijing is too far north for radio', '北京太靠北，无线电信号到不了'], ['The air above Beijing is too thick', '北京上空的大气太厚'], ['Every orbit’s plane passes through the Earth’s centre', '卫星的轨道平面必须经过地心'], ['It would be too close to the Moon', '那样离月球太近']], answer: 2,
        why: ['Gravity points to the Earth’s centre, so an orbit circles the centre. Only an equatorial orbit can keep pace above one fixed point.', '引力指向地心，轨道必须以地心为圆心，只有赤道上空的轨道才能与地面同步，静止在某地上空。'] },
      { q: ['A satellite’s orbital radius becomes 4 times larger. Its period becomes…', '卫星轨道半径变为原来的 4 倍，周期变为原来的'],
        options: [['2 times', '2 倍'], ['4 times', '4 倍'], ['8 times', '8 倍'], ['16 times', '16 倍']], answer: 2,
        why: ['T ∝ r^1.5: 4^1.5 = 8.', '由 T ∝ r^1.5，得周期变为 4^1.5 = 8 倍。'] },
    ],
  },
];
