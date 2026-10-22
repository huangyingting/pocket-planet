/** Astronomy lessons · the night sky: constellations and the turning sky, finding Polaris, retrograde motion and world models. */
import { C, type Lesson, type Pair } from '../kit.ts';
import { svg, tx, type Lx } from '../figs.ts';
import type { AstroScene } from './types.ts';

const unitSky: Pair = ['The night sky', '星空'];
const unitModels: Pair = ['Planets and models of the universe', '行星运动和宇宙模型'];
const DAY = 864e5;
const OPP = Date.UTC(2025, 0, 16);
const VIC = Date.UTC(2025, 2, 23);
/** UTC instant of a Beijing (UTC+8) local time */
const bj = (y: number, m: number, d: number, h: number) => Date.UTC(y, m - 1, d, h - 8);

// ---------------------------------------------------------------------------------------------- figures

/** A phase icon: lit fraction k, lit limb toward `rot` degrees (0 = right, -90 = up). */
function phase(cx: number, cy: number, r: number, k: number, rot = 0): string {
  const w = Math.abs(2 * k - 1) * r, s = k > 0.5 ? 1 : 0, f = (v: number) => Math.round(v * 10) / 10;
  return `<g transform="rotate(${rot} ${f(cx)} ${f(cy)})"><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="#2b3242" stroke="#56627a" stroke-width=".6"/>` +
    `<path d="M${f(cx)} ${f(cy - r)} A${f(r)} ${f(r)} 0 0 1 ${f(cx)} ${f(cy + r)} A${f(w)} ${f(r)} 0 0 ${s} ${f(cx)} ${f(cy - r)}Z" fill="#f4e7c4"/></g>`;
}

const ring = (cx: number, cy: number, r: number, c = '#56627a', dash = '') =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width=".8"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
const dot = (cx: number, cy: number, r: number, c: string) => `<circle cx="${Math.round(cx * 10) / 10}" cy="${Math.round(cy * 10) / 10}" r="${r}" fill="${c}"/>`;

/** Ptolemy's Earth-centred order of the heavens next to Copernicus' Sun-centred one. */
function figModels(L: Lx): string {
  const geo: [string, string, number][] = [['moon', '#c9ced6', 12], ['mercury', '#b7a99a', 20], ['venus', '#e8d3a0', 28], ['sun', C.gold, 38], ['mars', '#e0603a', 47], ['jupiter', '#d9b58a', 55], ['saturn', '#e6cf8f', 63]];
  const hel: [string, string, number][] = [['mercury', '#b7a99a', 12], ['venus', '#e8d3a0', 21], ['earth', C.blue, 30], ['mars', '#e0603a', 39], ['jupiter', '#d9b58a', 51], ['saturn', '#e6cf8f', 63]];
  let b = '';
  geo.forEach(([, c, r], i) => { const a = -0.9 + i * 0.8; b += ring(80, 95, r) + dot(80 + r * Math.cos(a), 95 + r * Math.sin(a), 3, c); });
  b += dot(80, 95, 5, C.blue) + tx(80, 112, L(['Earth', '地球']), 'fg-label', 'm');
  b += tx(80 + 38 * Math.cos(1.5) + 6, 95 + 38 * Math.sin(1.5) + 3, L(['Sun', '太阳']), 'fg-label');
  hel.forEach(([, c, r], i) => { const a = -0.6 + i * 0.9; b += ring(240, 95, r) + dot(240 + r * Math.cos(a), 95 + r * Math.sin(a), 3, c); });
  b += dot(240, 95, 6, C.gold) + tx(240, 112, L(['Sun', '太阳']), 'fg-label', 'm');
  b += tx(240 + 30 * Math.cos(1.2) + 6, 95 + 30 * Math.sin(1.2) + 6, L(['Earth', '地球']), 'fg-label');
  b += tx(80, 16, L(['Ptolemy (c. 150): Earth-centred', '托勒密（约公元 150 年）：地心说']), 'fg-title', 'm');
  b += tx(240, 16, L(['Copernicus (1543): Sun-centred', '哥白尼（1543 年）：日心说']), 'fg-title', 'm');
  return svg(320, 165, b, L(['The geocentric and heliocentric models', '地心说和日心说模型']));
}

/** Venus' phases under the two models. */
function figVenus(L: Lx): string {
  let b = '';
  // Ptolemy: Venus' epicycle always lies between Earth and the Sun
  b += `<path d="M20 52 Q80 18 140 52" fill="none" stroke="#56627a" stroke-width=".8"/>`;
  b += dot(80, 33, 7, C.gold) + tx(92, 30, L(['Sun', '太阳']), 'fg-label');
  b += `<line x1="80" y1="150" x2="80" y2="40" stroke="#56627a" stroke-width=".6" stroke-dasharray="2 3"/>`;
  b += ring(80, 82, 20, '#b197fc');
  b += phase(60, 82, 6, 0.12, -90) + phase(100, 82, 6, 0.12, -90) + phase(80, 102, 8, 0.03, -90) + phase(80, 62, 5, 0.25, -90);
  b += dot(80, 150, 5, C.blue) + tx(90, 153, L(['Earth', '地球']), 'fg-label');
  b += tx(80, 125, L(['only crescents', '只能看到月牙形']), 'fg-sub', 'm');
  // Sun-centred: Venus goes round the Sun and shows every phase
  b += ring(240, 78, 38);
  b += dot(240, 78, 7, C.gold);
  b += phase(240, 40, 4, 0.98, 0) + phase(202, 78, 6.5, 0.5, 0) + phase(278, 78, 6.5, 0.5, 180) + phase(222, 110, 10, 0.15, -60) + phase(258, 110, 10, 0.15, -120);
  b += dot(240, 152, 5, C.blue) + tx(250, 155, L(['Earth', '地球']), 'fg-label');
  b += tx(250, 43, L(['full, small', '满相，小']), 'fg-label');
  b += tx(240, 134, L(['crescent, large', '月牙形，大']), 'fg-label', 'm');
  b += tx(80, 14, L(['Ptolemy: Venus between Earth and Sun', '托勒密：金星总在日地之间']), 'fg-title', 'm');
  b += tx(240, 14, L(['Sun-centred: what Galileo saw', '日心说：伽利略看到的']), 'fg-title', 'm');
  return svg(320, 165, b, L(['Phases of Venus under two models', '两种模型下的金星相位']));
}

// ---------------------------------------------------------------------------------------------- scenes

const northSpring = (extra: Partial<AstroScene & { kit: 'sky' }> = {}): AstroScene => ({ kit: 'sky', view: 'dome', look: [0, 44], fov: 86, t: bj(2025, 4, 20, 21), ...extra });

export const A_SKY: Lesson[] = [
  {
    id: 'a-constellations', strand: 'sky', level: 'jr', tracks: ['us', 'ib'], unit: unitSky, icon: 'star', minutes: 10,
    title: ['Constellations and the seasonal sky', '星座和四季星空'],
    blurb: ['Why the stars wheel round the pole every night, and why each season has its own constellations.', '星星为什么每晚绕着北天极转，每个季节为什么能看到不同的星座。'],
    keys: [
      ['The sky is divided into 88 constellations; their patterns stay the same for centuries.', '全天划分为 88 个星座，它们的图形几百年都几乎不变。'],
      ['Earth rotates from west to east, so the stars seem to turn from east to west around the celestial pole, about 15° an hour.', '地球自西向东自转，所以星空看起来绕着天极自东向西转动，每小时约 15°。'],
      ['The celestial sphere: Earth’s axis points at the celestial poles, its equator at the celestial equator; star positions are given by right ascension and declination.', '天球：地轴延长指向南北天极，赤道平面延伸成天赤道；恒星的位置用赤经和赤纬表示。'],
      ['Stars close to the pole never set: they are circumpolar stars.', '靠近天极的恒星永不落到地平线以下，叫作拱极星。'],
      ['Earth orbits the Sun, so the evening sky changes with the seasons: Orion in winter, the Summer Triangle in summer.', '地球绕太阳公转，所以傍晚的星空随季节变化：冬季看猎户座，夏季看夏季大三角。'],
      ['In the early evening the Big Dipper’s handle points roughly east in spring, south in summer, west in autumn and north in winter.', '初昏时北斗的斗柄：春季大致指东，夏季指南，秋季指西，冬季指北。'],
    ],
    steps: [
      {
        title: ['88 constellations', '88 个星座'],
        body: ['People have always joined bright stars into pictures. Today astronomers divide the whole sky into 88 constellations, each with fixed borders, so every star belongs to one. This is a winter evening looking south: Orion the hunter, with red Betelgeuse and blue-white Rigel, and Sirius, the brightest star of the night sky.', '自古以来，人们就把亮星连成各种图形。今天天文学家把全天划分为 88 个星座，每个星座都有固定的边界，每颗恒星都属于某一个星座。这是冬季傍晚向南看到的星空：猎户座里有红色的参宿四和蓝白色的参宿七，旁边的天狼星是夜空中最亮的恒星。'],
        astro: { kit: 'sky', view: 'dome', look: [180, 35], fov: 75, t: bj(2025, 1, 15, 21), cons: ['ori', 'tau', 'cma', 'cmi', 'gem', 'aur', 'lep'], names: true, stars: ['Betelgeuse', 'Rigel', 'Sirius'] },
      },
      {
        title: ['The sky turns round the pole', '星空绕着天极转'],
        body: ['Watch the northern sky for a few hours. Every star moves along a circle around one point, the north celestial pole, close to Polaris. The stars are not really moving: Earth rotates from west to east, so the sky seems to turn the other way, about 15° every hour.', '面向北方观察几个小时：每颗星都绕着同一个点——北天极——画圆，北天极就在北极星旁边。其实并不是星星在转，而是地球自西向东自转，所以星空看起来反方向转动，每小时约转 15°。'],
        astro: { kit: 'sky', view: 'dome', look: [0, 38], fov: 78, t: bj(2025, 2, 15, 18), trails: true, dipper: true, cons: ['umi', 'cas'], stars: ['Polaris'], clock: { from: 0, to: 10, rate: 1, unit: 'hour', once: true } },
      },
      {
        title: ['The celestial sphere', '天球'],
        body: ['Astronomers picture every star fixed on one huge celestial sphere with Earth at its centre. Extend Earth’s axis (gold) and it meets the sphere at the north and south celestial poles; extend the equator and you get the celestial equator (teal). A star’s address is its right ascension (0–24 h, measured along the celestial equator) and declination (−90° to +90°, like latitude): Polaris is at Dec +89.3°, Sirius at −16.7°. Because Earth turns, the whole sphere seems to spin once every 23 h 56 min, one sidereal day.', '天文学家把所有恒星想象成镶在一个以地球为中心的巨大球面上，这就是天球。把地轴（金色）延长，与天球相交于北天极和南天极；把赤道平面延伸，就是天赤道（青色）。恒星在天球上的“地址”用赤经（0～24 时，沿天赤道量）和赤纬（−90° 到 +90°，类似纬度）表示：北极星的赤纬是 +89.3°，天狼星是 −16.7°。由于地球自转，整个天球看起来每 23 小时 56 分转一圈，这叫一个恒星日。'],
        astro: { kit: 'sky', view: 'outside', lat: 40, t: bj(2025, 2, 15, 18), arc: true, circles: true, cons: ['umi', 'ori', 'cas'], clock: { from: 0, to: 24, rate: 2, unit: 'hour' } },
      },
      {
        title: ['Circumpolar stars', '拱极星'],
        body: ['Here is the celestial sphere seen from outside, with you at the centre of the horizon. At 40° N the pole is 40° above the northern horizon. Stars inside the gold circle never set: these are circumpolar stars, such as Cassiopeia and the Little Dipper. Stars near the south celestial pole never rise.', '这是从外面看的天球，观测者站在地平面的中心。在北纬 40°，北天极高出北方地平线 40°。金色圆圈以内的恒星永不落下，叫作拱极星，例如仙后座和小熊座；靠近南天极的恒星则永远不会升起。'],
        astro: { kit: 'sky', view: 'outside', lat: 40, t: bj(2025, 2, 15, 18), circumpolar: true, circles: true, trails: true, dipper: true, cons: ['umi', 'cas', 'ori'], clock: { from: 0, to: 24, rate: 1.6, unit: 'hour' } },
      },
      {
        title: ['A different sky every season', '四季星空不同'],
        body: ['Look south at 9 pm through the year. Earth also orbits the Sun, so at night we face a different part of space each month: the same stars rise about 4 minutes earlier each night, 2 hours earlier a month. Spring brings Leo, summer Scorpius, autumn the Square of Pegasus and winter Orion.', '每天晚上 9 点向南看，连续看一年。地球还在绕太阳公转，所以每个月夜晚面对的是宇宙的不同方向：同一颗星每晚提前约 4 分钟升起，每月提前约 2 小时。春季看狮子座，夏季看天蝎座，秋季看飞马座四边形，冬季看猎户座。'],
        astro: { kit: 'sky', view: 'dome', look: [180, 38], fov: 80, cons: ['ori', 'cma', 'leo', 'vir', 'sco', 'sgr', 'peg', 'and', 'tau'], names: true, clock: { from: bj(2025, 1, 1, 21), to: bj(2025, 12, 31, 21), rate: 24, unit: 'date' } },
      },
      {
        title: ['The Big Dipper’s handle', '斗柄指四季'],
        body: ['An old Chinese saying: “When the handle points east, it is spring everywhere; south, summer; west, autumn; north, winter.” Look north at the same early-evening time all year: the Big Dipper swings once round Polaris, and its handle turns with the seasons. (The sky has shifted a little in 2,000 years, so today the match is rough.)', '古人说：“斗柄东指，天下皆春；斗柄南指，天下皆夏；斗柄西指，天下皆秋；斗柄北指，天下皆冬。”每天在同一个初昏时刻向北看，一年里北斗七星绕北极星转一圈，斗柄的指向随季节变化。（两千多年来星空位置略有变化，所以今天只是大致对应。）'],
        astro: { kit: 'sky', view: 'dome', look: [0, 42], fov: 86, dipper: true, handle: true, cons: ['umi'], stars: ['Polaris'], clock: { from: bj(2025, 1, 1, 20), to: bj(2025, 12, 31, 20), rate: 20, unit: 'date' } },
      },
      {
        title: ['The Summer Triangle', '夏季大三角'],
        body: ['On summer evenings three bright stars stand high in the sky: Vega in Lyra, Altair in Aquila and Deneb in Cygnus. Together they make the Summer Triangle, with the Milky Way running through it. In winter it is gone from the evening sky, and Orion takes its place.', '夏季的夜晚，三颗亮星高挂天空：天琴座的织女星、天鹰座的牛郎星和天鹅座的天津四，它们组成夏季大三角，银河从中穿过。到了冬季傍晚，它们就看不到了，猎户座成为主角。'],
        astro: { kit: 'sky', view: 'dome', look: [150, 55], fov: 85, t: bj(2025, 8, 15, 21), triangle: true, cons: ['lyr', 'cyg', 'aql', 'sco', 'sgr', 'her'], stars: ['Vega', 'Altair', 'Deneb', 'Antares'] },
      },
    ],
    quiz: [
      { q: ['Why do the stars seem to circle around Polaris during the night?', '为什么夜里星星看起来绕着北极星转？'],
        options: [['Earth rotates on its axis', '地球绕地轴自转'], ['Earth orbits the Sun', '地球绕太阳公转'], ['The stars orbit Earth', '恒星绕地球运动'], ['Polaris pulls the other stars round', '北极星吸引其他恒星转动']], answer: 0,
        why: ['Earth spins from west to east once a day, so the whole sky seems to turn the other way around the celestial pole, near Polaris.', '地球每天自西向东自转一周，所以整个星空看起来反向绕着北天极转动，北极星就在北天极附近。'] },
      { q: ['Tap the Big Dipper in this spring evening sky.', '在这片春季傍晚的星空中点出北斗七星。'], pick: 'dipper',
        astro: northSpring({ cons: ['uma', 'umi', 'cas', 'dra', 'cep'] }),
        why: ['The Big Dipper is the bright “ladle” of seven stars in Ursa Major; on spring evenings it is high in the north-east.', '北斗七星是大熊座中七颗亮星组成的“勺子”，春季傍晚高挂在东北方的天空。'] },
      { q: ['In the early evening the Big Dipper’s handle points south. Which season is it?', '初昏时北斗的斗柄指向南方，这是什么季节？'],
        options: [['Spring', '春季'], ['Summer', '夏季'], ['Autumn', '秋季'], ['Winter', '冬季']], answer: 1,
        why: ['“When the handle points south, it is summer everywhere.” East is spring, west autumn, north winter.', '“斗柄南指，天下皆夏。”指东为春，指西为秋，指北为冬。'] },
      { q: ['Why do we see different constellations on winter and summer evenings?', '为什么冬季和夏季傍晚看到的星座不同？'],
        options: [['Earth moves round the Sun, so night faces a different direction', '地球绕太阳公转，夜晚朝向的方向不同'], ['The stars move around the galaxy each season', '恒星每个季节在银河系中移动'], ['Earth’s axis flips over', '地轴翻转'], ['Clouds hide them', '被云遮住了']], answer: 0,
        why: ['Over a year Earth goes round the Sun, so our night side points at different parts of the sky; stars on the Sun’s side are lost in daylight.', '一年中地球绕太阳公转，夜半球朝向天空的不同方向；与太阳同一方向的星星淹没在白天的阳光里。'] },
      { q: ['At 8 pm Vega is due east. The sky turns 15° an hour. How many degrees has Vega moved along its daily circle by 11 pm?', '晚上 8 点织女星在正东方。星空每小时转 15°。到晚上 11 点，织女星沿它的周日圆转过了多少度？'],
        num: { answer: 45, tol: 1, unit: ['°', '°'] },
        why: ['360° in about 24 hours is 15° per hour; 3 hours × 15° = 45°.', '24 小时约转 360°，即每小时 15°；3 小时 × 15° = 45°。'] },
      { q: ['Match each season with the constellation that stands high in the south on its evenings.', '把季节和那个季节傍晚高挂南天的星座配对。'],
        match: [[['Spring', '春季'], ['Leo', '狮子座']], [['Summer', '夏季'], ['Scorpius', '天蝎座']], [['Autumn', '秋季'], ['Square of Pegasus', '飞马座四边形']], [['Winter', '冬季'], ['Orion', '猎户座']]],
        why: ['Each month the evening sky shifts about 30° westward, so a full season moves a new quarter of the sky into view: Leo, Scorpius, Pegasus, Orion.', '傍晚的星空每月向西移动约 30°，每过一个季节就换上四分之一个新的天区：狮子座、天蝎座、飞马座、猎户座。'] },
      { q: ['At 40° N, stars within 40° of the north celestial pole (declination above +50°) never set. Which of these are circumpolar there? Choose all.', '在北纬 40°，离北天极 40° 以内（赤纬高于 +50°）的恒星永不落下。下面哪些在那里是拱极星？选出所有正确答案。'],
        multi: [0, 1, 3], options: [['Dubhe in the Big Dipper (Dec +61.8°)', '北斗的天枢（赤纬 +61.8°）'], ['Cassiopeia (Dec about +60°)', '仙后座（赤纬约 +60°）'], ['Betelgeuse in Orion (Dec +7.4°)', '猎户座参宿四（赤纬 +7.4°）'], ['Kochab in the Little Dipper (Dec +74.2°)', '小熊座北极二（赤纬 +74.2°）'], ['Antares in Scorpius (Dec −26.4°)', '天蝎座心宿二（赤纬 −26.4°）']],
        why: ['A star is circumpolar when its declination is greater than 90° − latitude = 50°. Dubhe, Cassiopeia and Kochab qualify; Betelgeuse and Antares rise and set.', '赤纬大于 90° − 纬度 = 50° 的恒星就是拱极星。天枢、仙后座和北极二符合；参宿四和心宿二有升有落。'] },
    ],
  },
  {
    id: 'a-polaris', strand: 'sky', level: 'jr', tracks: ['us', 'ib'], unit: unitSky, icon: 'compass', minutes: 9,
    title: ['Finding north by Polaris', '北极星辨方向'],
    blurb: ['Use the Big Dipper to find Polaris, and Polaris to find north and your latitude.', '用北斗七星找到北极星，再用北极星辨认方向、估计纬度。'],
    keys: [
      ['Extend the line from Merak to Dubhe about 5 times to reach Polaris.', '把天璇到天枢的连线延长约 5 倍，就能找到北极星。'],
      ['Polaris is less than 1° from the north celestial pole, so it hardly moves: facing it, you face north.', '北极星离北天极不到 1°，几乎不动：面向北极星就是面向北方。'],
      ['The altitude of Polaris equals your latitude: about 40° in Beijing, 23° in Guangzhou, 90° at the North Pole.', '北极星的高度等于当地纬度：北京约 40°，广州约 23°，北极点 90°。'],
      ['South of the equator Polaris is below the horizon; there is no bright south pole star, but the Southern Cross points the way.', '在南半球看不到北极星；南天极附近没有亮星，可以用南十字座找南方。'],
    ],
    steps: [
      {
        title: ['Start with the Big Dipper', '先找北斗七星'],
        body: ['On a spring evening, look high in the north-east for seven bright stars shaped like a ladle: the Big Dipper, part of Ursa Major. Ancient Chinese astronomers gave each star its own name: four make the bowl and three the handle.', '春季傍晚，在东北方高空找到七颗排成勺子形状的亮星，这就是北斗七星，它属于大熊座。我国古代把它们叫作天枢、天璇、天玑、天权（斗勺）和玉衡、开阳、摇光（斗柄）。'],
        astro: northSpring({ dipper: 'names', cons: ['umi'] }),
      },
      {
        title: ['Follow the pointer stars', '沿着指极星找'],
        body: ['The two stars at the end of the bowl, Merak and Dubhe, are the pointer stars. Draw a line from Merak through Dubhe and extend it about 5 times their distance: you reach a moderately bright star standing alone. That is Polaris, the end of the Little Dipper’s handle.', '斗勺前端的天璇和天枢叫作指极星。从天璇向天枢画一条线，再延长约 5 倍的距离，就会遇到一颗比较孤单的亮星——北极星，它是小熊座斗柄末端的一颗星。'],
        astro: northSpring({ dipper: true, pointer: 'polaris', cons: ['umi'] }),
      },
      {
        title: ['Polaris marks north', '北极星指示北方'],
        body: ['Polaris is less than 1° from the north celestial pole, so while every other star circles through the night, Polaris almost stays put. Face Polaris and you face north: south is behind you, east on your right, west on your left. Travellers and sailors have used it for thousands of years.', '北极星离北天极不到 1°。整夜里其他星星都在绕圈，北极星却几乎不动。面向北极星就是面向北方：背后是南，右手是东，左手是西。几千年来，旅行者和航海者都靠它辨认方向。'],
        astro: { kit: 'sky', view: 'dome', look: [0, 36], fov: 78, t: bj(2025, 4, 20, 20), trails: true, dipper: true, cons: ['umi'], stars: ['Polaris'], clock: { from: 0, to: 9, rate: 1, unit: 'hour', once: true } },
      },
      {
        title: ['Altitude equals latitude', '北极星高度等于纬度'],
        body: ['Travel from the equator to the North Pole and watch the pole rise. At the equator Polaris sits on the northern horizon; at the North Pole it is straight overhead. Its altitude equals your latitude: about 23° in Guangzhou, 40° in Beijing and 46° in Harbin. More stars become circumpolar the farther north you go.', '从赤道一路向北走到北极，看北天极怎样升高：在赤道，北极星贴着北方地平线；在北极点，它就在头顶。北极星的高度等于当地的纬度：广州约 23°，北京约 40°，哈尔滨约 46°。越往北，拱极星越多。'],
        astro: { kit: 'sky', view: 'outside', arc: true, circumpolar: true, dipper: true, cons: ['umi'], t: bj(2025, 4, 20, 21), clock: { from: 0, to: 90, rate: 9, unit: 'lat' } },
      },
      {
        title: ['Why the angles match', '为什么角度相等'],
        body: ['Polaris is so far away (about 430 light years) that its light reaches every place on Earth along parallel lines, all parallel to Earth’s axis. Your horizon is tilted from the equator’s by your latitude φ, so the angle between your horizon and Polaris is φ too.', '北极星非常遥远（约 430 光年），它的光到达地球各地时都是平行的，并且与地轴平行。当地的地平面相对于赤道处的地平面倾斜了一个纬度角 φ，所以北极星与地平面的夹角也是 φ。'],
        astro: { kit: 'sky', view: 'earth', clock: { from: 0, to: 90, rate: 8, unit: 'lat', at: 0.44, hold: true } },
      },
      {
        title: ['South of the equator', '在南半球'],
        body: ['From Sydney (34° S) Polaris is always below the horizon, and no bright star marks the south celestial pole. Use the Southern Cross instead: extend its long bar about 4½ times to find the pole, then drop straight down to the horizon for south. The pole is 34° high there: altitude equals latitude again.', '在悉尼（南纬 34°）永远看不到北极星，南天极附近也没有亮星。可以用南十字座：把十字架的长轴延长约 4.5 倍，就到了南天极，从那里向地平线垂直往下就是正南方。那里的南天极高度是 34°，同样等于当地纬度。'],
        astro: { kit: 'sky', view: 'dome', look: [180, 30], fov: 80, lat: -34, lon: 151.2, tz: 10, t: Date.UTC(2025, 4, 15, 10), pointer: 'crux', arc: true, trails: 3.5, cons: ['cru', 'cen'], stars: ['Alpha Centauri', 'Hadar'], clock: { from: 0, to: 6, rate: 0.8, unit: 'hour', once: true } },
      },
      {
        title: ['Pole stars change', '北极星会换'],
        body: ['Earth’s axis wobbles slowly like a spinning top: it traces a circle of radius 23.4° around the ecliptic pole every 25,800 years (precession). So the pole star changes. When the pyramids were built, about 2700 BC, the pole was near Thuban in Draco. Polaris will be closest to the pole around AD 2100 (0.45° away), and in about AD 14,000 bright Vega will be near the pole, though 4–5° away.', '地轴像旋转的陀螺一样缓慢晃动，每 25,800 年绕黄极画一个半径 23.4° 的圆，这叫岁差。所以北极星会换：约公元前 2700 年修建金字塔时，北天极在天龙座的右枢附近；北极星在公元 2100 年前后离天极最近（约 0.45°）；大约公元 14000 年，明亮的织女星将来到天极附近，但仍相差 4～5°。'],
        astro: { kit: 'sky', view: 'dome', look: [0, 55], fov: 90, t: bj(2025, 8, 20, 21), cons: ['umi', 'dra', 'lyr'], stars: ['Polaris', 'Vega'],
          marks: [{ ra: 211.10, dec: 64.38, name: ['Thuban: pole star c. 2700 BC', '右枢：约公元前 2700 年的北极星'], c: '#ffa94d' }, { ra: 270, dec: 66.56, name: ['ecliptic pole: centre of the precession circle', '北黄极：岁差圆的中心'], c: '#74c0fc' }] },
      },
    ],
    quiz: [
      { q: ['Tap Polaris.', '点出北极星。'], pick: 'polaris',
        astro: northSpring({ cons: ['uma', 'umi', 'cas'] }),
        why: ['Follow Merak → Dubhe about 5 times their distance: Polaris is the end of the Little Dipper’s handle.', '沿天璇→天枢方向延长约 5 倍，就是北极星，它在小熊座斗柄的末端。'] },
      { q: ['Guangzhou is at about 23° N. How high above the northern horizon is Polaris there?', '广州约在北纬 23°。在那里北极星离北方地平线多高？'],
        options: [['About 23°', '约 23°'], ['About 67°', '约 67°'], ['About 40°', '约 40°'], ['Straight overhead', '在头顶正上方']], answer: 0,
        why: ['The altitude of Polaris equals the latitude, so about 23°.', '北极星的高度等于当地纬度，所以约为 23°。'] },
      { q: ['Which two stars of the Big Dipper point to Polaris?', '北斗七星中哪两颗星指向北极星？'],
        options: [['Merak and Dubhe', '天璇和天枢'], ['Mizar and Alkaid', '开阳和摇光'], ['Megrez and Alioth', '天权和玉衡'], ['Phecda and Alkaid', '天玑和摇光']], answer: 0,
        why: ['Extend the line from Merak through Dubhe about 5 times to reach Polaris.', '从天璇向天枢方向延长约 5 倍就是北极星。'] },
      { q: ['A student in Sydney (34° S) wants to find south at night. What should she use?', '悉尼（南纬 34°）的学生夜里想辨认南方，应该用什么？'],
        options: [['The Southern Cross', '南十字座'], ['Polaris', '北极星'], ['The Big Dipper’s handle', '北斗的斗柄'], ['The Moon, which is always in the south', '月亮，它总在南方']], answer: 0,
        why: ['Polaris is below the horizon in the southern hemisphere. The long bar of the Southern Cross points toward the south celestial pole.', '在南半球看不到北极星。南十字座的长轴指向南天极。'] },
      { q: ['Harbin is at 45.8° N. How many degrees above the northern horizon is Polaris there?', '哈尔滨位于北纬 45.8°。在那里北极星高出北方地平线多少度？'],
        num: { answer: 45.8, tol: 1, unit: ['°', '°'] },
        why: ['Altitude of the pole = latitude, so about 46° (Polaris itself is within 0.7° of the pole).', '天极高度 = 当地纬度，约 46°（北极星离天极不到 0.7°）。'] },
      { q: ['Match each place with the altitude of Polaris there.', '把地点和那里北极星的高度配对。'],
        match: [[['Guangzhou (23° N)', '广州（北纬 23°）'], ['about 23°', '约 23°']], [['Beijing (40° N)', '北京（北纬 40°）'], ['about 40°', '约 40°']], [['North Pole', '北极点'], ['90°, overhead', '90°，头顶']], [['Equator', '赤道'], ['0°, on the horizon', '0°，贴着地平线']]],
        why: ['The rule altitude = latitude works everywhere in the northern hemisphere, from 0° on the equator to 90° at the pole.', '“北极星高度 = 纬度”在整个北半球都成立：赤道 0°，北极点 90°。'] },
      { q: ['Put the steps for finding north at night in order.', '把夜里辨认北方的步骤排好顺序。'],
        order: [['Find the seven stars of the Big Dipper', '找到北斗七星'], ['Pick the two pointer stars, Merak and Dubhe', '找到两颗指极星：天璇和天枢'], ['Extend the line about 5 times to Polaris', '把连线延长约 5 倍，找到北极星'], ['Drop straight down from Polaris to the horizon: that is north', '从北极星垂直向下到地平线，那里就是正北']],
        why: ['Dipper → pointers → Polaris → down to the horizon. Polaris is less than 1° from the pole, so the point below it is true north.', '北斗 → 指极星 → 北极星 → 垂直向下到地平线。北极星离天极不到 1°，它正下方就是正北。'] },
    ],
  },
  {
    id: 'a-retrograde', strand: 'sky', level: 'sr', tracks: ['ib', 'us'], unit: unitModels, icon: 'planet', minutes: 12,
    title: ['Retrograde motion: Earth-centred and Sun-centred models', '行星逆行，地心说和日心说'],
    blurb: ['Why Mars sometimes loops backwards, how Ptolemy and Copernicus explained it, and what Galileo saw.', '火星为什么有时会倒退打圈，托勒密和哥白尼怎样解释，伽利略又看到了什么。'],
    keys: [
      ['Planets usually drift eastward among the stars; for weeks around opposition an outer planet moves westward: retrograde motion.', '行星通常在恒星背景上向东移动（顺行）；外行星在冲日前后几周向西移动，叫作逆行。'],
      ['In the Sun-centred view, retrograde motion happens when the faster Earth overtakes Mars on the inside.', '在日心说中，逆行是因为跑得更快的地球从内侧超过了火星。'],
      ['Ptolemy kept Earth at the centre and explained the loops with epicycles moving on deferents.', '托勒密以地球为中心，用本轮在均轮上运动来解释逆行的圈。'],
      ['Galileo saw Venus go through a full set of phases and Jupiter’s moons: evidence against Ptolemy’s model.', '伽利略观测到金星有完整的相位变化、木星有卫星，这些是反对托勒密模型的证据。'],
      ['Loops repeat every synodic period, 1/S = 1 − 1/P: 780 days for Mars, 399 for Jupiter, 378 for Saturn.', '逆行每隔一个会合周期出现一次，1/S = 1 − 1/P：火星 780 天，木星 399 天，土星 378 天。'],
    ],
    steps: [
      {
        title: ['Mars turns back', '火星倒退了'],
        body: ['Night after night Mars normally drifts eastward among the stars. But from 7 December 2024 to 24 February 2025 it slid westward through Gemini and Cancer, then turned east again, tracing a loop. This backward stretch is retrograde motion. (The up–down scale here is stretched 2.5×.)', '火星通常一夜一夜地在恒星背景上向东移动（顺行）。但从 2024 年 12 月 7 日到 2025 年 2 月 24 日，它在双子座和巨蟹座之间向西倒退，然后才又向东，走出一个圈。这段倒退就是逆行。（图中上下方向放大了 2.5 倍。）'],
        astro: { kit: 'retro', mode: 'geo', clock: { from: OPP - 150 * DAY, to: OPP + 150 * DAY, rate: 25, unit: 'date' } },
      },
      {
        title: ['Earth overtakes Mars', '地球超车'],
        body: ['Seen from above the Solar System it is simple. Earth (1 AU from the Sun, 29.8 km/s) moves faster than Mars (1.52 AU, 24.1 km/s). Around opposition, when Earth passes Mars on the inside lane, our line of sight to Mars swings backwards against the far stars, just as a slower car seems to drift back as you overtake it.', '从太阳系上方看就很简单了：地球（距太阳 1 AU，速度 29.8 km/s）比火星（1.52 AU，24.1 km/s）跑得快。在冲日前后，地球从内圈超过火星，我们看火星的视线就在遥远的恒星背景上向后扫，就像超车时，慢车看起来在向后退。'],
        astro: { kit: 'retro', mode: 'helio', every: 12, clock: { from: OPP - 150 * DAY, to: OPP + 150 * DAY, rate: 20, unit: 'date' } },
      },
      {
        title: ['Ptolemy’s epicycles', '托勒密的本轮'],
        body: ['Around AD 150 Ptolemy kept Earth still at the centre. Each planet rides on a small circle, the epicycle, whose centre moves along a big circle, the deferent. When the planet is on the inner side of its epicycle it runs backwards and makes a loop. Here the epicycle is exactly the size of Earth’s orbit, so it gives the very same loop as the Sun-centred picture.', '公元 150 年前后，托勒密让地球静止在宇宙中心。每颗行星在一个小圆——本轮——上运动，本轮的中心又沿着大圆——均轮——运动。当行星转到本轮靠近地球的一侧时，就会倒退打圈。这里的本轮恰好和地球轨道一样大，所以画出的圈和日心说完全相同。'],
        astro: { kit: 'retro', mode: 'epicycle', clock: { from: OPP - 400 * DAY, to: OPP + 400 * DAY, rate: 45, unit: 'date' } },
      },
      {
        title: ['Copernicus: the Sun at the centre', '哥白尼：太阳在中心'],
        body: ['In 1543 Copernicus put the Sun at the centre and Earth among the planets. Loops need no extra circles: they are a viewpoint effect, and they come only when an outer planet is opposite the Sun, when it is closest and brightest, just as observed. His circular orbits were not yet more accurate; Kepler’s ellipses (1609) fixed that.', '1543 年，哥白尼把太阳放在中心，地球只是一颗普通行星。逆行不需要额外的圆圈，而是观察角度造成的：外行星只在冲日前后逆行，此时它离地球最近、最亮，与观测完全一致。不过他仍用圆形轨道，精度并没有更高；直到开普勒提出椭圆轨道（1609 年）才解决。'],
        fig: { k: 'svg', draw: figModels },
        astro: { kit: 'retro', mode: 'helio', every: 20, clock: { from: OPP - 300 * DAY, to: OPP + 300 * DAY, rate: 30, unit: 'date' }, cam: { from: [0, -0.15, 1], dist: 16, target: [0, 2.6, 0] } },
      },
      {
        title: ['Galileo’s evidence', '伽利略的证据'],
        body: ['In 1610 Galileo turned a telescope on the sky. Venus showed a full set of phases, small and nearly full when far beyond the Sun, large and crescent when close to us. In Ptolemy’s model Venus stays between Earth and the Sun and could only show crescents. He also found four moons circling Jupiter: not everything orbits Earth.', '1610 年，伽利略用望远镜观察天空：金星有完整的相位变化——在太阳另一侧时又小又接近满相，离我们近时又大又是月牙形。在托勒密的模型里，金星总在地球和太阳之间，只能出现月牙形。他还发现有四颗卫星绕木星转动：并不是所有天体都绕地球转。'],
        fig: { k: 'svg', draw: figVenus },
        astro: { kit: 'retro', mode: 'venus', clock: { from: VIC - 290 * DAY, to: VIC + 290 * DAY, rate: 30, unit: 'date', at: 0.3 } },
      },
      {
        title: ['How often do loops come?', '多久逆行一次'],
        body: ['A loop happens each time Earth laps a planet, at every opposition. The time between laps is the synodic period S, from 1/S = 1/1 yr − 1/P. Mars (P = 1.88 yr) gives S = 2.14 yr = 780 days: after 16 January 2025 the next opposition is 19 February 2027. Jupiter (11.86 yr) gives 399 days and Saturn (29.5 yr) 378 days, so those slow giants loop almost every year, each loop lasting about 4 months.', '每当地球“套圈”超过一颗外行星，也就是每次冲日，就会出现一次逆行。两次超车之间的时间叫会合周期 S，满足 1/S = 1/1 年 − 1/P。火星（P = 1.88 年）的 S = 2.14 年 = 780 天：2025 年 1 月 16 日冲日之后，下一次是 2027 年 2 月 19 日。木星（11.86 年）是 399 天，土星（29.5 年）是 378 天，所以这些慢吞吞的巨行星几乎每年逆行一次，每次约 4 个月。'],
        astro: { kit: 'retro', mode: 'helio', every: 20, clock: { from: OPP - 60 * DAY, to: OPP + 840 * DAY, rate: 50, unit: 'date' } },
      },
    ],
    quiz: [
      { q: ['During retrograde motion, Mars appears to move…', '逆行时，火星看起来'],
        options: [['westward against the stars', '在恒星背景上向西移动'], ['eastward faster than usual', '向东移动得比平时快'], ['toward the north celestial pole', '向北天极移动'], ['backwards along its orbit around the Sun', '沿绕日轨道真的倒退']], answer: 0,
        why: ['Mars never really reverses; seen from the overtaking Earth it drifts westward (backwards) against the background stars for a while.', '火星并没有真的倒退，只是从超车的地球上看，它在恒星背景上暂时向西移动。'] },
      { q: ['Look at the loop. Around which point is Mars closest to Earth and brightest?', '看这个圈。火星在什么时候离地球最近、最亮？'],
        astro: { kit: 'retro', mode: 'geo', clock: { from: OPP - 150 * DAY, to: OPP + 150 * DAY, rate: 0, unit: 'date', at: 1, hold: true } },
        options: [['In the middle of the retrograde loop, at opposition', '逆行圈的中间，冲日时'], ['At the first stationary point', '第一个“留”的时候'], ['At the start of the path', '轨迹开始的时候'], ['It is always equally bright', '亮度始终一样']], answer: 0,
        why: ['Opposition falls in the middle of the retrograde loop, when Earth passes between the Sun and Mars and is closest to it.', '冲日在逆行圈的中间，此时地球位于太阳和火星之间，离火星最近。'] },
      { q: ['Which observation could Ptolemy’s Earth-centred model not explain?', '哪项观测是托勒密的地心模型无法解释的？'],
        fig: { k: 'svg', draw: figVenus },
        options: [['Venus showing a full set of phases, including nearly full', '金星有完整的相位变化，包括接近满相'], ['Mars moving in a loop', '火星打圈'], ['Stars turning around the pole', '星星绕天极转'], ['The Sun rising in the east', '太阳从东方升起']], answer: 0,
        why: ['In Ptolemy’s model Venus is always between Earth and the Sun, so it could only look crescent. Gibbous and full Venus means it goes round the Sun.', '在托勒密模型里金星总在日地之间，只能是月牙形。看到凸月形和接近满相的金星，说明它绕太阳运动。'] },
      { q: ['In the Sun-centred model, why does Mars go retrograde around opposition?', '在日心说中，火星为什么在冲日前后逆行？'],
        options: [['Earth, moving faster on the inside orbit, overtakes Mars', '地球在内圈跑得更快，超过了火星'], ['Mars stops and reverses on its orbit', '火星在轨道上停下并倒退'], ['The Sun’s gravity pulls Mars backwards', '太阳引力把火星往回拉'], ['Mars moves on an epicycle', '火星在本轮上运动']], answer: 0,
        why: ['Like overtaking a slower car: our line of sight to Mars swings backwards against the distant stars.', '就像超过一辆慢车：我们看火星的视线在遥远恒星背景上向后扫。'] },
      { q: ['Jupiter orbits the Sun in 11.86 years. Using 1/S = 1 − 1/P, how many days are there between two oppositions of Jupiter?', '木星绕太阳一周需 11.86 年。用 1/S = 1 − 1/P 计算，木星两次冲日相隔多少天？'],
        num: { answer: 399, tol: 5, unit: ['days', '天'] },
        why: ['1/S = 1 − 1/11.86 = 0.9157, so S = 1.092 yr × 365.25 ≈ 399 days. Earth needs just over a year to catch up with slow Jupiter again.', '1/S = 1 − 1/11.86 = 0.9157，S = 1.092 年 × 365.25 ≈ 399 天。地球只要一年多一点就能再次追上慢吞吞的木星。'] },
      { q: ['Put these steps in the history of the Sun-centred model in order.', '把日心说发展史上的这些事件按时间排序。'],
        order: [['Ptolemy’s Almagest: Earth-centred epicycles (c. AD 150)', '托勒密《天文学大成》：地心说和本轮（约公元 150 年）'], ['Copernicus puts the Sun at the centre (1543)', '哥白尼把太阳放在中心（1543 年）'], ['Kepler: planets move on ellipses (1609)', '开普勒：行星沿椭圆轨道运动（1609 年）'], ['Galileo sees the phases of Venus (1610)', '伽利略看到金星的相位（1610 年）']],
        why: ['About 1,400 years separate Ptolemy and Copernicus; Kepler’s ellipses (1609) and Galileo’s telescope (1610) came within a year of each other.', '托勒密和哥白尼相隔约 1400 年；开普勒的椭圆轨道（1609 年）和伽利略的望远镜观测（1610 年）只相差一年。'] },
      { q: ['Which did Galileo discover with his telescope in 1609–1610? Choose all.', '伽利略在 1609～1610 年用望远镜发现了哪些？选出所有正确答案。'],
        multi: [0, 1, 2], options: [['Venus shows a full set of phases', '金星有完整的相位变化'], ['Four moons circling Jupiter', '四颗卫星绕木星运动'], ['Mountains and craters on the Moon', '月球上的山和环形山'], ['Planets move on ellipses', '行星沿椭圆轨道运动'], ['The planet Neptune', '海王星']],
        why: ['Galileo saw Venus’ phases, Jupiter’s four large moons and the Moon’s mountains. Ellipses were Kepler’s result from Tycho’s data; Neptune was found only in 1846.', '伽利略看到了金星相位、木星的四颗大卫星和月球上的山。椭圆轨道是开普勒根据第谷的数据得出的；海王星直到 1846 年才被发现。'] },
      { q: ['Match each person with the idea.', '把人物和他的观点配对。'],
        match: [[['Ptolemy', '托勒密'], ['epicycles on deferents around a still Earth', '静止地球周围均轮上的本轮']], [['Copernicus', '哥白尼'], ['the Sun at the centre, Earth a planet', '太阳在中心，地球是行星']], [['Kepler', '开普勒'], ['elliptical orbits', '椭圆轨道']], [['Galileo', '伽利略'], ['telescope evidence: Venus’ phases', '望远镜证据：金星相位']]],
        why: ['Ptolemy described the loops, Copernicus re-centred the system, Kepler made it accurate and Galileo’s telescope supplied the evidence.', '托勒密描述了逆行圈，哥白尼把中心换成太阳，开普勒让它变得精确，伽利略的望远镜提供了证据。'] },
    ],
  },
];
