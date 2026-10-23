/** Astronomy lessons: gravity, orbits and spaceflight (kits `kepler`, `cannon`, `satellites`). */
import { C, mk, par, arrows, type Fig, type Lesson, type Pair, type Track } from '../kit.ts';
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
  const x0 = 40, x1 = 300, y0 = 140, y1 = 42, R = (r: number) => x0 + ((r - 0.5) / 4) * (x1 - x0), F = (f: number) => y0 - f * (y0 - y1);
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

/** Kepler's second law in the calendar: the equinox line cuts the orbit, the summer half is the longer (e exaggerated). */
function halfYears(L: Lx, id: string): string {
  // drawn like the scene: seen from above the North Pole, Earth at the March equinox on the left, December solstice at the top
  const a = 74, e = 0.3, p = a * (1 - e * e), LP = 102.9, k = Math.PI / 180;
  const sx = 160 + a * e * Math.cos(LP * k), sy = 112 - a * e * Math.sin(LP * k);
  const P = (nu: number): [number, number] => { const r = p / (1 + e * Math.cos(nu * k)), t = (nu + LP) * k; return [sx + r * Math.cos(t), sy - r * Math.sin(t)]; };
  const arc = (from: number, to: number) => { const s: string[] = []; for (let n = from; n <= to + 1e-6; n += 2) s.push(P(n).map(v => v.toFixed(1)).join(',')); return s.join(' '); };
  const nu = (theta: number) => theta - LP;
  const sum0 = nu(180), sum1 = nu(360);
  let o = arrowDef(id + 'o', C.orange) + arrowDef(id + 'b', C.blue);
  o += tx(4, 12, L(['Why the northern summer half-year is longer', '为什么北半球夏半年比冬半年长']), 'fg-title') + tx(4, 22, L(['seen from above the North Pole; eccentricity exaggerated (real e = 0.017)', '从北极上空俯视；椭圆被夸大（实际 e = 0.017）']), 'fg-sub');
  o += `<polyline points="${arc(sum0, sum1)}" class="fg-line f-fade" style="stroke:${C.orange};stroke-width:2"/>`;
  o += `<polyline points="${arc(sum1, sum0 + 360)}" class="fg-line f-fade" style="stroke:${C.blue};stroke-width:2"/>`;
  o += `<polyline points="${arc(nu(222), nu(229))}" fill="none" stroke="${C.orange}" stroke-width="2" marker-end="url(#${id}o)"/>`;
  o += `<polyline points="${arc(nu(402), nu(409))}" fill="none" stroke="${C.blue}" stroke-width="2" marker-end="url(#${id}b)"/>`;
  const [ax, ay] = P(sum0), [bx, by] = P(sum1);
  o += `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="#9aa7b4" stroke-dasharray="3 3" opacity=".7"/>`;
  o += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="7" fill="${C.gold}"/>` + tx(sx + 10, sy - 6, L(['Sun', '太阳']), 'fg-label', 's', ` style="fill:${C.gold}"`);
  const ev: [number, Pair, number, number, 's' | 'm' | 'e'][] = [
    [nu(90), ['Dec solstice 21/22 Dec', '冬至 12 月 21/22 日'], 7, -4, 's'],
    [0, ['perihelion ~3 Jan', '近日点 1 月初'], -5, -4, 'e'],
    [nu(180), ['Mar equinox 20/21 Mar', '春分 3 月 20/21 日'], -6, 4, 'e'],
    [nu(270), ['Jun solstice 21/22 Jun', '夏至 6 月 21/22 日'], -7, 11, 'e'],
    [180, ['aphelion ~4 Jul', '远日点 7 月初'], 5, 11, 's'],
    [nu(360), ['Sep equinox 22/23 Sep', '秋分 9 月 22/23 日'], 6, 4, 's'],
  ];
  ev.forEach(([n, lab, dx, dy, an], i) => {
    const [x, y] = P(n), apse = n === 0 || n === 180;
    o += `<g class="f-fade" style="--d:${(0.3 + i * 0.12).toFixed(2)}s"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${apse ? 2.4 : 3.6}" fill="${apse ? '#dfe6ee' : '#6fa8ff'}"/>`
      + tx(x + dx, y + dy, L(lab), apse ? 'fg-tick' : 'fg-label', an) + '</g>';
  });
  o += tx(316, 214, L(['spring + summer: ≈ 186 days', '春分→秋分（夏半年）：约 186 天']), 'fg-label', 'e', ` style="fill:${C.orange}"`);
  o += tx(316, 226, L(['slower, far from the Sun', '离太阳远，公转慢']), 'fg-sub', 'e');
  o += tx(4, 214, L(['autumn + winter: ≈ 179 days', '秋分→春分（冬半年）：约 179 天']), 'fg-label', 's', ` style="fill:${C.blue}"`);
  o += tx(4, 226, L(['faster, near the Sun', '离太阳近，公转快']), 'fg-sub', 's');
  return svg(320, 232, o, L(['Kepler’s second law and the half-years', '开普勒第二定律与冬、夏半年']));
}

/** Three geostationary satellites 120° apart, to scale, seen from above the North Pole. */
function geoCover(L: Lx, id: string): string {
  const cx = 160, cy = 110, r = 12, R = r * 6.62, half = Math.acos(1 / 6.62);
  const pt = (rad: number, ang: number) => [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)].map(v => v.toFixed(1));
  let o = arrowDef(id, C.gold) + tx(4, 12, L(['Three geostationary satellites see almost the whole Earth', '三颗地球静止卫星几乎覆盖全球']), 'fg-title')
    + tx(4, 22, L(['above the North Pole, to scale: r = 6.6 Earth radii', '从北极上空俯视，按比例：r = 6.6 倍地球半径']), 'fg-sub');
  o += `<circle cx="${cx}" cy="${cy}" r="${R.toFixed(1)}" fill="none" stroke="${C.gold}" stroke-dasharray="3 3" opacity=".55"/>`;
  [-90, 30, 150].forEach((deg, i) => {
    const a = (deg * Math.PI) / 180, [sx, sy] = pt(R, a), [t1x, t1y] = pt(r, a - half), [t2x, t2y] = pt(r, a + half);
    o += `<g class="f-fade" style="--d:${(0.3 + i * 0.25).toFixed(2)}s"><polygon points="${sx},${sy} ${t1x},${t1y} ${t2x},${t2y}" fill="${C.gold}" opacity=".12"/>`
      + `<line x1="${sx}" y1="${sy}" x2="${t1x}" y2="${t1y}" stroke="${C.gold}" opacity=".55"/><line x1="${sx}" y1="${sy}" x2="${t2x}" y2="${t2y}" stroke="${C.gold}" opacity=".55"/>`
      + `<circle cx="${sx}" cy="${sy}" r="3.4" fill="${C.gold}"/></g>`;
  });
  o += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#3b6fb0" stroke="#8fc0ff" stroke-width=".8"/>`;
  const a0 = (-58 * Math.PI) / 180, a1 = (-40 * Math.PI) / 180;
  // seen from above the North Pole, eastward is anticlockwise
  o += `<path d="M${pt(R + 7, a1).join(' ')} A${R + 7} ${R + 7} 0 0 0 ${pt(R + 7, a0).join(' ')}" fill="none" stroke="${C.gold}" stroke-width="1.4" marker-end="url(#${id})"/>`;
  o += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${(cy - R).toFixed(1)}" stroke="#9aa7b4" stroke-dasharray="2 2" opacity=".6"/>`;
  o += tx(cx + 4, cy - R / 2, L(['42 164 km', '42 164 千米']), 'fg-tick') + tx(cx, cy + r + 10, L(['Earth', '地球']), 'fg-tick', 'm');
  o += tx(234, 52, L(['west → east', '自西向东']), 'fg-label', 's', ` style="fill:${C.gold}"`) + tx(234, 63, L(['3.07 km/s', '3.07 千米/秒']), 'fg-label', 's', ` style="fill:${C.gold}"`);
  o += tx(4, 208, L(['each sees about 42% of the surface; the polar caps (above ~81°) are missed', '每颗约能看到地表的 42%；纬度约 81° 以上的极地看不到']), 'fg-sub');
  return svg(320, 214, o, L(['Geostationary coverage', '地球静止卫星的覆盖范围']));
}

/** Cavendish's torsion balance (a sketch). */
function torsion(L: Lx, id: string): string {
  let o = arrowDef(id, C.orange) + tx(4, 12, L(['Cavendish’s torsion balance, 1798', '卡文迪什扭秤实验（1798 年）']), 'fg-title')
    + tx(4, 22, L(['big balls M pull small balls m; the fibre twists a tiny angle', '大球 M 吸引小球 m，细丝扭转一个很小的角度']), 'fg-sub');
  o += `<rect x="108" y="30" width="24" height="5" fill="#6b7785"/><line x1="120" y1="35" x2="120" y2="92" stroke="#c9d2dc" stroke-width="1"/>`;
  o += `<rect x="114" y="68" width="12" height="8" fill="#a5d8ff" opacity=".85"/>`;
  o += `<line x1="52" y1="92" x2="188" y2="92" stroke="#dfe6ee" stroke-width="2"/>`;
  o += `<circle cx="74" cy="112" r="13" fill="#7d8896"/><circle cx="166" cy="72" r="13" fill="#7d8896"/>`;
  o += `<circle cx="52" cy="92" r="5" fill="${C.gold}"/><circle cx="188" cy="92" r="5" fill="${C.gold}"/>`;
  o += `<line x1="56" y1="96" x2="64" y2="104" stroke="${C.orange}" stroke-width="1.4" marker-end="url(#${id})"/><line x1="184" y1="88" x2="176" y2="80" stroke="${C.orange}" stroke-width="1.4" marker-end="url(#${id})"/>`;
  o += tx(44, 86, 'm', 'fg-label', 'e') + tx(196, 104, 'm', 'fg-label') + tx(74, 116, 'M', 'fg-label', 'm') + tx(166, 76, 'M', 'fg-label', 'm');
  o += tx(124, 46, L(['quartz fibre', '石英丝']), 'fg-tick') + tx(130, 66, L(['mirror', '平面镜']), 'fg-tick');
  o += `<circle cx="268" cy="44" r="4" fill="${C.gold}"/><line x1="264" y1="46" x2="126" y2="71" stroke="${C.gold}" opacity=".7"/><line x1="126" y1="73" x2="272" y2="120" stroke="${C.gold}" opacity=".7"/>`;
  o += `<line x1="282" y1="98" x2="282" y2="142" stroke="#9aa7b4"/>` + [0, 1, 2, 3, 4].map(k => `<line x1="278" y1="${100 + k * 10}" x2="282" y2="${100 + k * 10}" stroke="#9aa7b4"/>`).join('');
  o += `<circle cx="279" cy="122" r="2.6" fill="${C.gold}"/>` + tx(276, 38, L(['light', '光源']), 'fg-tick', 'e') + tx(316, 154, L(['the light spot magnifies the twist', '光点移动放大了扭转角']), 'fg-tick', 'e');
  o += tx(4, 140, 'F = G·Mm / r²', 'fg-label') + tx(4, 154, L(['G = 6.67 × 10⁻¹¹ N·m²/kg²', '引力常量 G = 6.67 × 10⁻¹¹ N·m²/kg²']), 'fg-label', 's', ` style="fill:${C.gold}"`);
  return svg(320, 162, o, L(['Cavendish’s torsion balance', '卡文迪什扭秤']));
}

const DAY = 864e5, OPP = Date.UTC(2025, 0, 16);

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
    id: 'a-gravity', strand: 'motion', level: 'jr', tracks: JR, unit, icon: 'sun', minutes: 12,
    title: ['Gravity keeps the planets going round', '引力让行星绕太阳转'],
    blurb: ['Why the planets circle the Sun, what would happen without gravity, why you would weigh less on the Moon, and how gravity raises tides and builds worlds.', '行星为什么绕太阳转？没有引力会怎样？为什么在月球上体重会变轻？引力怎样掀起潮汐、塑造星球？'],
    keys: [
      ['Every object with mass pulls on every other: this is gravity. The pull is stronger for bigger masses and weaker the farther apart they are (twice as far: a quarter of the pull).', '任何有质量的物体之间都相互吸引，这就是万有引力。质量越大，引力越大；距离越远，引力越小（距离变为 2 倍，引力只剩 1/4）。'],
      ['The Sun’s gravity keeps bending each planet’s path, so it goes round instead of flying away; without gravity a moving planet would fly off in a straight line.', '太阳的引力不断改变行星的运动方向，使它绕太阳转动而不飞走；如果没有引力，运动的行星会沿直线飞走。'],
      ['The Moon and satellites are falling round the Earth: they move sideways so fast (about 7.9 km/s near the ground) that the ground curves away as fast as they fall.', '月球和人造卫星都在绕地球“下落”：它们横向运动得足够快（贴近地面约 7.9 千米/秒），地面弯下去的速度和它们下落一样快。'],
      ['Your mass is the same everywhere; your weight (the pull of gravity on you) depends on where you are: on the Moon it is about one sixth of that on Earth.', '你的质量在哪里都一样；你受到的重力随所在的地方而变：在月球上只有地球上的约六分之一。'],
      ['“Down” means towards the Earth’s centre, so people in Sydney are not upside down.', '“向下”就是指向地心，所以悉尼的人并没有头朝下。'],
      ['The Moon’s gravity raises the ocean tides, and gravity pulled a spinning cloud of gas and dust together into the Sun and planets 4.6 billion years ago.', '月球的引力引起海洋潮汐；46 亿年前，引力把一团旋转的气体尘埃云聚集成了太阳和行星。'],
    ],
    steps: [
      {
        title: ['A pull towards the Sun', '指向太阳的拉力'],
        body: ['The Earth races sideways at about 30 km/s (green arrow), covering about 940 million km in one lap of a year. At the same time the Sun’s gravity pulls it towards the Sun (orange arrow). The two arrows are almost at right angles, so the pull does not slow the Earth down: it only bends its path. In each second the Earth moves 30 km forwards but drops only about 3 mm towards the Sun away from a straight line, and that tiny bend, second after second, adds up to a whole circle.', '地球以约 30 千米/秒的速度向前飞（绿色箭头），一年绕太阳一圈，要走约 9.4 亿千米。同时，太阳的引力把它拉向太阳（橙色箭头）。两个箭头几乎互相垂直，所以引力并不让地球变慢，只是不断改变它的方向。每一秒，地球向前飞 30 千米，却只偏离直线“落向”太阳约 3 毫米；这一点点弯曲日积月累，就成了一整圈。'],
        astro: { kit: 'kepler', mode: 'gravity', cut: 0 },
      },
      {
        title: ['Switch gravity off', '如果引力消失'],
        body: ['Imagine the Sun’s gravity suddenly vanished. Nothing would bend the Earth’s path any more, so by Newton’s first law it would keep going in a straight line, in the direction it was moving at that moment (the green dashed line). A hammer thrower’s ball does the same: while the athlete pulls on the wire it goes round, and when he lets go it flies off along the tangent, not straight outwards.', '设想太阳的引力突然消失了。再也没有力改变地球的运动方向，根据牛顿第一定律（惯性定律），它会沿着那一刻的运动方向笔直飞走（绿色虚线）。链球运动员掷链球也是这样：运动员拉着链子时，链球绕圈转；一松手，链球就沿圆周的切线方向飞出去，而不是沿半径向外飞。'],
        astro: { kit: 'kepler', mode: 'gravity', cut: 1.25 },
      },
      {
        title: ['Falling around the Earth', '绕着地球“下落”'],
        body: ['Newton imagined a cannon on a very high mountain. A slow cannonball (3.5 km/s) falls nearby; a faster one (6 km/s) lands much farther away. At about 7.9 km/s the ground curves away as fast as the ball falls, so it never lands: it circles the Earth. This is just what the Moon does: in each second it falls about 1.4 mm towards the Earth from a straight line, while moving 1 km sideways. Newton realised that the force that drops an apple is the same force that holds the Moon.', '牛顿设想在一座很高的山顶上架一门大炮。炮弹打得慢（3.5 千米/秒），落在近处；打得快（6 千米/秒），落得远得多。速度达到约 7.9 千米/秒时，地面弯下去的速度和炮弹下落一样快，炮弹再也落不了地，就绕着地球转。月球也是这样：它每秒横向运动约 1 千米，同时偏离直线“落向”地球约 1.4 毫米。牛顿意识到，让苹果落地的力和拉住月球的力是同一种力。'],
        sketch: true,
        astro: { kit: 'cannon', mode: 'shots', v: [3.5, 6, 7.9] },
      },
      {
        title: ['Mass and distance', '质量和距离'],
        body: ['The more mass an object has, the harder it pulls; the farther away you are, the weaker the pull, and it fades fast: at twice the distance the pull is a quarter, at three times a ninth (the chart). The Sun holds about 99.86% of all the mass in the Solar System, so everything orbits it. Close to the Sun the pull is strong, and a planet must race round to stay up: Mercury moves at 47 km/s and takes 88 days, the Earth 30 km/s and one year, Jupiter only 13 km/s and almost 12 years.', '物体的质量越大，引力越大；距离越远，引力越小，而且减小得很快：距离变为 2 倍，引力只剩 1/4；变为 3 倍，只剩 1/9（见图）。太阳约占太阳系总质量的 99.86%，所以所有行星都绕着它转。离太阳越近，引力越强，行星必须转得越快才不会掉下去：水星速度约 47 千米/秒，绕太阳一圈 88 天；地球约 30 千米/秒，一圈 1 年；木星只有约 13 千米/秒，一圈将近 12 年。'],
        fig: { k: 'svg', draw: (L, id) => inverseSquare(L, id) },
        astro: { kit: 'kepler', mode: 'law3', clock: { from: 0, to: 12, rate: 0.4, unit: 'year' } },
      },
      {
        title: ['Mass and weight on other worlds', '质量和重力：在其他星球上'],
        body: ['Mass is how much matter you are made of, and it is the same everywhere. Weight is the pull of gravity on you: weight = mass × g, where g is 9.8 N/kg on the Earth. A 40 kg student weighs about 392 N on Earth, only 65 N on the Moon (g = 1.6 N/kg, about a sixth), 148 N on Mars and about 990 N on Jupiter (g = 24.8 N/kg). Size matters as well as mass: Saturn has 95 times the Earth’s mass, but it is so wide that at its cloud tops g is only 10.4 N/kg, hardly more than here. On every world, “down” means towards its centre, which is why people in Sydney are not upside down.', '质量是物体所含物质的多少，在哪里都一样。重力是星球对你的引力：重力 = 质量 × g，地球上 g = 9.8 牛/千克。一个质量 40 千克的学生在地球上受到的重力约 392 牛，在月球上只有 65 牛（g = 1.6 牛/千克，约六分之一），在火星上 148 牛，在木星上约 990 牛（g = 24.8 牛/千克）。星球的大小也有关系：土星质量是地球的 95 倍，但它太大了，云顶处的 g 只有 10.4 牛/千克，和地球差不多。在每个星球上，“向下”都指向星球的中心，所以悉尼的人并没有头朝下。'],
        fig: weights,
        astro: { kit: 'orrery', mode: 'lineup', planets: ['venus', 'earth', 'mars', 'jupiter', 'saturn'] },
      },
      {
        title: ['Every mass pulls: the tides', '万物相吸：潮汐'],
        body: ['The Earth pulls the Moon, and the Moon pulls the Earth back. The Moon pulls the near side of the Earth a little harder than the centre, and the centre harder than the far side, so the oceans are stretched into two bulges, one facing the Moon and one opposite. As the Earth turns, most coasts pass through both bulges: two high tides about every 24 h 50 min. The Sun’s pull adds to it at new and full moon. In China the tidal bore of the Qiantang River is strongest around the 18th day of the eighth lunar month, when crowds gather at Haining to watch it.', '地球吸引月球，月球也吸引地球。月球对地球近月一侧的引力比对地心稍大，对地心又比对背月一侧稍大，于是海水被拉成两个隆起：一个朝向月球，一个在相反一侧。地球自转时，大多数海岸每天先后经过两个隆起：大约每 24 小时 50 分钟出现两次高潮。新月和满月时，太阳的引力也叠加进来。我国钱塘江大潮在农历八月十八前后最为壮观，人们纷纷到海宁观潮。'],
        astro: { kit: 'tides', mode: 'why' },
      },
      {
        title: ['Gravity builds worlds', '引力塑造星球'],
        body: ['About 4.6 billion years ago the Solar System began as a huge, slowly turning cloud of gas and dust. Gravity pulled it inwards; it spun faster and flattened into a disk. The centre became the Sun, and in the disk dust stuck into lumps that gathered into planets. That is why all the planets go round the Sun in the same direction and almost in the same flat plane. Gravity also makes every big body round: it pulls all its matter towards the centre, so planets and large moons become balls, while small asteroids can stay lumpy.', '大约 46 亿年前，太阳系还是一团巨大的、缓慢旋转的气体尘埃云。引力使它向内收缩，越转越快，变成一个扁平的圆盘。中心形成了太阳，盘中的尘埃粘结成团，又聚集成行星。所以所有行星都沿同一方向、几乎在同一平面上绕太阳公转。引力还让大天体变圆：它把所有物质拉向中心，所以行星和大卫星都是球形，而小小的小行星可以是不规则的形状。'],
        astro: { kit: 'nebula', names: true, orbits: true, clock: { from: 0, to: 100, rate: 8, unit: 'myr' } },
      },
    ],
    quiz: [
      { q: ['If the Sun’s gravity suddenly vanished, the Earth would…', '如果太阳的引力突然消失，地球会'],
        options: [['fall into the Sun', '掉进太阳里'], ['stop moving', '停下来不动'], ['fly off in a straight line', '沿直线飞走'], ['keep circling the Sun', '继续绕太阳转']], answer: 2,
        why: ['With no pull to bend its path, the Earth keeps going straight in the direction it was moving (Newton’s first law).', '没有引力改变它的运动方向，地球就沿原来的运动方向一直直线飞行（牛顿第一定律）。'],
        astro: { kit: 'kepler', mode: 'gravity', cut: 0 } },
      { q: ['Two objects move twice as far apart. The gravity between them becomes…', '两个物体之间的距离变为原来的 2 倍，它们之间的引力变为原来的'],
        options: [['half as strong', '1/2 倍'], ['a quarter as strong', '1/4 倍'], ['twice as strong', '2 倍'], ['the same', '不变']], answer: 1,
        why: ['Gravity falls with the square of the distance: 2 × 2 = 4, so the pull becomes ¼.', '引力与距离的平方成反比：2 × 2 = 4，所以引力变为 1/4。'] },
      { q: ['An astronaut has a mass of 60 kg on Earth. On the Moon her mass is…', '一名航天员在地球上的质量是 60 千克，她在月球上的质量是'],
        options: [['10 kg', '10 千克'], ['60 kg', '60 千克'], ['0 kg', '0 千克'], ['360 kg', '360 千克']], answer: 1,
        why: ['Mass does not change. Her weight on the Moon is about one sixth, because the Moon’s gravity is weaker.', '质量不会变。月球引力较小，她在月球上受到的重力约为地球上的六分之一。'] },
      { q: ['On the Moon g = 1.6 N/kg. What does the 60 kg astronaut weigh there?', '月球上 g = 1.6 牛/千克。这名 60 千克的航天员在月球上受到的重力是多少？'], num: { answer: 96, tol: 1, unit: ['N', '牛'] },
        why: ['Weight = mass × g = 60 × 1.6 = 96 N, against 60 × 9.8 = 588 N on Earth: about a sixth.', '重力 = 质量 × g = 60 × 1.6 = 96 牛；在地球上是 60 × 9.8 = 588 牛，约为它的 6 倍。'] },
      { q: ['Put these planets in order of orbital speed, fastest first.', '按公转速度从快到慢排列这些行星。'],
        order: [['Mercury', '水星'], ['Venus', '金星'], ['Earth', '地球'], ['Mars', '火星'], ['Jupiter', '木星']],
        why: ['47, 35, 30, 24 and 13 km/s: the closer to the Sun, the stronger its pull and the faster a planet must move.', '分别约为 47、35、30、24 和 13 千米/秒：离太阳越近，引力越强，行星必须运动得越快。'] },
      { q: ['Match each world to the gravity g at its surface.', '把星球和它表面的 g 值连起来。'],
        match: [[['Moon', '月球'], ['1.6 N/kg', '1.6 牛/千克']], [['Mars', '火星'], ['3.7 N/kg', '3.7 牛/千克']], [['Earth', '地球'], ['9.8 N/kg', '9.8 牛/千克']], [['Jupiter', '木星'], ['24.8 N/kg', '24.8 牛/千克']]],
        why: ['The small Moon pulls weakly; giant Jupiter pulls about 2.5 times as hard as the Earth.', '小小的月球引力很弱；巨大的木星表面引力约是地球的 2.5 倍。'] },
      { q: ['Which of these are caused by gravity? Pick all that are right.', '下列哪些现象是由引力造成的？选出所有正确的。'],
        options: [['The Moon going round the Earth', '月球绕地球运行'], ['Ocean tides', '海洋潮汐'], ['Planets being round', '行星是球形的'], ['Day and night', '昼夜交替'], ['The seasons', '四季变化']], multi: [0, 1, 2],
        why: ['Day and night come from the Earth’s spin, and the seasons from the tilt of its axis, not from gravity.', '昼夜交替是地球自转造成的，四季变化是地轴倾斜造成的，都不是引力的结果。'] },
      { q: ['A student in Sydney drops a ball. Which way does it fall?', '悉尼的一名学生松手放开一个球，球会朝哪个方向落？'],
        options: [['Towards the Earth’s centre, like everywhere', '和各地一样，朝向地心'], ['Up into the sky, because Sydney is upside down', '飞向天空，因为悉尼是“倒着的”'], ['Towards the South Pole', '朝向南极'], ['Towards the Sun', '朝向太阳']], answer: 0,
        why: ['Gravity pulls towards the Earth’s centre, so “down” is towards the centre wherever you stand.', '地球引力指向地心，所以无论站在哪里，“向下”都是指向地心。'] },
    ],
  },
  {
    id: 'a-kepler', strand: 'motion', level: 'sr', tracks: SR, unit, icon: 'planet', minutes: 14,
    title: ['Kepler’s three laws', '开普勒三定律'],
    blurb: ['From epicycles to ellipses: equal areas in equal times, T² ∝ a³, the longer summer half-year, Halley’s Comet, and why gravity makes it all work.', '从本轮到椭圆：面积定律、T² ∝ a³、更长的夏半年、哈雷彗星，以及万有引力为什么能解释这一切。'],
    keys: [
      ['First law: every planet moves on an ellipse with the Sun at one focus; e = c/a says how stretched it is (Earth 0.017, Mars 0.093, Mercury 0.206).', '第一定律：所有行星绕太阳运动的轨道都是椭圆，太阳处在椭圆的一个焦点上；偏心率 e = c/a 表示椭圆的扁平程度（地球 0.017，火星 0.093，水星 0.206）。'],
      ['Second law: the line from the Sun to a planet sweeps out equal areas in equal times, so a planet is fastest at perihelion: the Earth moves at 30.3 km/s in early January and 29.3 km/s in early July.', '第二定律：太阳和行星的连线在相等的时间内扫过相等的面积，所以行星在近日点最快：地球 1 月初约 30.3 千米/秒，7 月初约 29.3 千米/秒。'],
      ['Because the Earth is slower near aphelion, the northern spring and summer half-year (about 186 days) is about 7 days longer than autumn and winter (about 179 days).', '地球在远日点附近运动较慢，所以北半球春夏半年（约 186 天）比秋冬半年（约 179 天）长约 7 天。'],
      ['Third law: a³/T² is the same for every planet of the Sun; with a in AU and T in years, T² = a³ (Mars 1.52 AU → 1.88 yr, Jupiter 5.20 AU → 11.9 yr).', '第三定律：所有行星轨道半长轴的三次方与公转周期的二次方之比都相等；a 以天文单位、T 以年为单位时，T² = a³（火星 1.52 天文单位 → 1.88 年，木星 5.20 天文单位 → 11.9 年）。'],
      ['The constant depends only on the central mass: a³/T² = GM/4π². So the laws hold for comets, moons and satellites too, each central body with its own constant.', '这个比值只与中心天体的质量有关：a³/T² = GM/4π²。彗星、卫星和人造卫星也遵循这些规律，只是中心天体不同，比值不同。'],
      ['The laws came from careful data: Tycho’s naked-eye measurements, Kepler’s laws (1609, 1619), then Newton’s gravity (1687) explained them.', '这些定律来自精确的观测数据：第谷的肉眼观测，开普勒总结出三定律（1609 年、1619 年），牛顿的万有引力定律（1687 年）解释了它们。'],
    ],
    steps: [
      {
        title: ['From circles to ellipses', '从圆到椭圆'],
        body: ['For 1,400 years astronomers followed Ptolemy (about AD 150): the Earth at the centre, each planet riding a small circle (an epicycle) on a bigger circle, which explained the backward loops of Mars. Copernicus (1543) put the Sun at the centre, but still used perfect circles. Tycho Brahe then measured planet positions by eye to about 1–2′ (1576–1597). Working on Tycho’s Mars data, Kepler found that the best circles still missed by 8′. He trusted the data, dropped the circles, and in 1609 published his first two laws; the third followed in 1619.', '托勒密（约公元 150 年）的地心说统治了约 1400 年：地球在中心，行星沿小圆（本轮）运动，小圆的中心又沿大圆运动，以此解释火星的逆行“打圈”。哥白尼（1543 年）把太阳放在中心，但仍然使用完美的圆。随后，第谷用肉眼把行星位置测到约 1′～2′ 的精度（1576～1597 年）。开普勒分析第谷的火星资料时发现，最好的圆轨道仍有 8′ 的偏差。他相信观测数据，放弃了圆，1609 年发表了前两条定律，1619 年又发表了第三定律。'],
        sketch: true,
        astro: { kit: 'retro', mode: 'epicycle', clock: { from: OPP - 400 * DAY, to: OPP + 400 * DAY, rate: 45, unit: 'date' }, cam: { from: [0, -0.55, 1], dist: 10.5, target: [0, 0.5, 0] } },
      },
      {
        title: ['Lab: first law, ellipses', '实验：第一定律，椭圆轨道'],
        task: ['Drag the slider to change the eccentricity e and watch the second focus move away from the Sun.', '拖动滑块改变偏心率 e，观察另一个焦点怎样离开太阳。'],
        body: ['Every planet moves on an ellipse with the Sun at one focus. The eccentricity e = c/a, where c is the distance from the centre to a focus and a the semi-major axis, says how stretched the ellipse is: e = 0 is a circle, and the closer e gets to 1, the longer and thinner it becomes. Real planet orbits are nearly round: Venus 0.007, Earth 0.017, Mars 0.093. Mercury, the most eccentric planet, has e = 0.206; comets can reach 0.97 or more.', '所有行星绕太阳运动的轨道都是椭圆，太阳处在椭圆的一个焦点上。偏心率 e = c/a（c 是中心到焦点的距离，a 是半长轴）表示椭圆的扁平程度：e = 0 就是圆，e 越接近 1，椭圆越扁长。行星的实际轨道都很接近圆：金星 0.007，地球 0.017，火星 0.093。偏心率最大的行星水星 e = 0.206；彗星的偏心率可达 0.97 以上。'],
        astro: {
          kit: 'kepler', mode: 'law1', string: false, clock: { from: 0, to: 0.8, rate: 0.08, unit: 'x', fmt: ['e = {v}', '偏心率 e = {v}'], dp: 2, at: 0.6, hold: true },
          tasks: [
            { text: ['Set e to Mercury’s orbit, 0.21.', '把 e 调到水星轨道的 0.21。'], done: (_p, v) => Math.abs(v - 0.206) <= 0.015 },
            { text: ['Stretch the orbit to e = 0.7 or more, like a comet’s.', '把轨道拉长到 e ≥ 0.7，像彗星轨道那样。'], done: (_p, v) => v >= 0.7 },
          ],
        },
      },
      {
        title: ['Two pins and a string', '两个图钉和一根线'],
        body: ['To draw an ellipse, pin the two ends of a string at two points, the foci, keep it tight with a pencil and run round: the distances r₁ + r₂ always add up to 2a. The Sun sits at one focus; the other is empty. The nearest point to the Sun is perihelion, the farthest aphelion, so perihelion + aphelion = 2a. For the Earth they are 147.1 and 152.1 million km: a = (147.1 + 152.1) ÷ 2 = 149.6 million km (1 AU), c = (152.1 − 147.1) ÷ 2 = 2.5 million km, and e = 2.5 ÷ 149.6 = 0.017. Drawn to scale, the Earth’s orbit would look like a perfect circle, so the ellipse here is stretched to e = 0.6 to show the foci clearly.', '画椭圆时，把一根线的两端固定在两个点（焦点）上，用笔把线拉紧画一圈：两段距离之和 r₁ + r₂ 始终等于 2a。太阳在一个焦点上，另一个焦点上什么也没有。轨道上离太阳最近的点叫近日点，最远的点叫远日点，近日距 + 远日距 = 2a。地球的近日距和远日距分别为 1.471 亿千米和 1.521 亿千米：a = (1.471 + 1.521) ÷ 2 = 1.496 亿千米（1 天文单位），c = (1.521 − 1.471) ÷ 2 = 0.025 亿千米，e = 0.025 ÷ 1.496 ≈ 0.017。按比例画出来，地球轨道几乎就是一个正圆，所以图中把椭圆夸大到 e = 0.6，以便看清两个焦点。'],
        astro: { kit: 'kepler', mode: 'law1', e: 0.6, axes: false },
      },
      {
        title: ['Second law: equal areas', '第二定律：面积定律'],
        body: ['The line from the Sun to a planet sweeps out equal areas in equal times. Each coloured wedge takes the same time, so near perihelion, where the wedges are short and wide, the planet must move faster. For a thin wedge at perihelion and one at aphelion, equal areas give r_p·v_p = r_a·v_a, so v_p ÷ v_a = r_a ÷ r_p. For the Earth that is 152.1 ÷ 147.1 = 1.034: about 30.3 km/s at perihelion in early January and 29.3 km/s at aphelion in early July.', '太阳和行星的连线在相等的时间内扫过相等的面积。每块彩色扇形所用的时间相同，近日点附近的扇形又短又宽，所以行星在那里运动得更快。取近日点和远日点处极短时间内扫过的细扇形，面积相等给出 r近·v近 = r远·v远，即 v近 ÷ v远 = r远 ÷ r近。对地球，152.1 ÷ 147.1 ≈ 1.034：1 月初过近日点时约 30.3 千米/秒，7 月初过远日点时约 29.3 千米/秒。'],
        astro: { kit: 'kepler', mode: 'law2', e: 0.6, sectors: 8, clock: { from: 0, to: 2, rate: 0.08, unit: 'x', fmt: ['t = {v} T', 't = {v} T'], dp: 2 } },
      },
      {
        title: ['Why the summer half-year is longer', '为什么夏半年更长'],
        body: ['The equinox line through the Sun cuts the Earth’s orbit into two halves. The Earth passes perihelion in early January, during the northern winter, and aphelion in early July. So from the Spring Equinox (about 20 March) to the Autumn Equinox (about 23 September) it moves more slowly and takes about 186 days, while autumn and winter take only about 179 days. You can see it in the 24 solar terms too: each term is 15° of the Sun’s longitude, and the terms are about 14.7 days apart in winter but about 15.7 days apart in summer.', '过太阳的二分点连线把地球轨道分成两半。地球 1 月初（北半球冬季）经过近日点，7 月初经过远日点。所以从春分（约 3 月 20 日）到秋分（约 9 月 23 日），地球运动较慢，约需 186 天；而秋冬半年只需约 179 天。二十四节气也能体现这一点：每个节气相隔太阳黄经 15°，冬季两个节气之间约 14.7 天，夏季约 15.7 天。'],
        fig: { k: 'svg', draw: (L, id) => halfYears(L, id) },
        astro: { kit: 'terms', names: 'key', sectors: true, clock: { from: Date.UTC(2025, 2, 20, 9), to: Date.UTC(2026, 2, 20, 15), rate: 12, unit: 'date' } },
      },
      {
        title: ['Third law: T² ∝ a³', '第三定律：T² ∝ a³'],
        body: ['Farther planets have longer years, and not just in proportion: a³/T² is the same for every planet. With a in AU and T in years, the Earth gives 1³/1² = 1, so T² = a³, or T = a√a. Mars: a = 1.524, a³ = 3.54, T = √3.54 = 1.88 years. Jupiter: a = 5.20, a³ = 141, T = 11.9 years. Saturn: a = 9.54, a³ = 867, T = 29.5 years. On log scales every planet falls on one straight line with slope 3/2.', '离太阳越远的行星公转周期越长，而且不是简单的正比关系：所有行星的 a³/T² 都相等。以天文单位和年为单位，地球给出 1³/1² = 1，所以 T² = a³，即 T = a√a。火星：a = 1.524，a³ = 3.54，T = √3.54 ≈ 1.88 年。木星：a = 5.20，a³ ≈ 141，T ≈ 11.9 年。土星：a = 9.54，a³ ≈ 867，T ≈ 29.5 年。在对数坐标中，所有行星都落在一条斜率为 3/2 的直线上。'],
        fig: { k: 'svg', draw: L => keplerFig(L) },
        astro: { kit: 'kepler', mode: 'law3', clock: { from: 0, to: 12, rate: 0.5, unit: 'year' } },
      },
      {
        title: ['Halley’s Comet', '哈雷彗星'],
        body: ['Comets obey Kepler’s laws too. Halley’s Comet swings from 0.59 AU from the Sun, inside Venus’s orbit, out to about 35 AU, beyond Neptune: e = 0.967, a = (0.59 + 35) ÷ 2 ≈ 17.8 AU, so T = 17.8 × √17.8 ≈ 75 years (between 74 and 79, as the planets tug on it). Using Newton’s new physics, Edmond Halley saw that the comets of 1531, 1607 and 1682 were one object and predicted its return for 1758. It was seen again on Christmas night 1758, after his death. It last passed in 1986 and returns in 2061; Chinese chronicles record its visits for more than 2,000 years.', '彗星也遵循开普勒定律。哈雷彗星近日距只有 0.59 天文单位（在金星轨道以内），远日距约 35 天文单位（在海王星以外）：e = 0.967，a = (0.59 + 35) ÷ 2 ≈ 17.8 天文单位，所以 T = 17.8 × √17.8 ≈ 75 年（受行星引力影响，在 74～79 年之间变化）。哈雷运用牛顿的新理论，发现 1531、1607 和 1682 年的彗星是同一颗，并预言它将在 1758 年回归。1758 年圣诞之夜，它果然再次出现，而哈雷已经去世。它上一次回归是 1986 年，下一次在 2061 年；我国史书记录它的回归已有两千多年。'],
        astro: { kit: 'orrery', comet: 'halley', kuiper: true, t0: Date.UTC(1980, 0, 1), clock: { from: 0, to: 82, rate: 3, unit: 'year' } },
      },
      {
        title: ['Why it works: gravity', '原因：万有引力'],
        body: ['Newton (1687) showed that all three laws follow from gravity, F = GMm/r². For a circular orbit, gravity provides the centripetal force: GMm/r² = m(2π/T)²r, which gives r³/T² = GM/4π². The constant depends only on the central mass, not on the planet. So the laws also hold for moons around planets and satellites around the Earth, each with its own constant. Example: the Moon circles the Earth at 384,400 km in 27.3 days. A satellite that goes round in one day must sit at 384,400 × (1/27.3)^(2/3) ≈ 42,000 km from the Earth’s centre: exactly where geostationary satellites are.', '牛顿（1687 年）证明，开普勒三定律都可以由万有引力定律 F = GMm/r² 推出。对圆轨道，万有引力提供向心力：GMm/r² = m(2π/T)²r，得到 r³/T² = GM/4π²。这个比值只与中心天体的质量有关，与行星本身无关。所以卫星绕行星、人造卫星绕地球的运动也遵循开普勒定律，只是比值不同。例：月球在距地心 38.44 万千米处绕地球运行，周期 27.3 天。周期为 1 天的卫星，轨道半径应为 384 400 × (1/27.3)^(2/3) ≈ 42 000 千米：正是地球静止轨道卫星所在的位置。'],
        astro: { kit: 'satellites', mode: 'overview', clock: { from: 0, to: 48, rate: 1, unit: 'hour' } },
      },
    ],
    quiz: [
      { q: ['Where is the Sun on a planet’s elliptical orbit?', '在行星的椭圆轨道中，太阳位于'],
        options: [['At the centre of the ellipse', '椭圆的中心'], ['At one focus', '椭圆的一个焦点上'], ['At aphelion', '远日点'], ['On the orbit itself', '轨道上']], answer: 1,
        why: ['Kepler’s first law: the Sun is at one focus; the other focus is empty.', '开普勒第一定律：太阳在椭圆的一个焦点上，另一个焦点是空的。'],
        astro: { kit: 'kepler', mode: 'law2', e: 0.6, sectors: 8 } },
      { q: ['When is the Earth moving fastest along its orbit?', '地球在什么时候公转速度最快？'],
        options: [['Early July', '7 月初'], ['Early January', '1 月初'], ['Around the Spring Equinox', '春分前后'], ['Around the Autumn Equinox', '秋分前后']], answer: 1,
        why: ['The Earth is at perihelion in early January, so by the second law it moves fastest then (30.3 km/s).', '地球在 1 月初经过近日点，根据第二定律，这时公转速度最快（约 30.3 千米/秒）。'] },
      { q: ['An asteroid’s orbit has a = 4 AU. What is its period?', '某小行星轨道的半长轴 a = 4 天文单位，它的公转周期是多少年？'], num: { answer: 8, tol: 0.1, unit: ['years', '年'] },
        why: ['T² = a³ = 4³ = 64, so T = 8 years.', 'T² = a³ = 4³ = 64，所以 T = 8 年。'] },
      { q: ['Halley’s Comet returns about every 76 years. Find the semi-major axis a of its orbit.', '哈雷彗星的回归周期约为 76 年，求它轨道的半长轴 a。'], num: { answer: 17.9, tol: 0.3, unit: ['AU', '天文单位'] },
        why: ['a³ = T² = 76² = 5,776, so a = ∛5,776 ≈ 17.9 AU.', 'a³ = T² = 76² = 5776，所以 a = ∛5776 ≈ 17.9 天文单位。'] },
      { q: ['Match each law to what it says.', '把定律和它的内容连起来。'],
        match: [[['Kepler’s first law', '开普勒第一定律'], ['Orbits are ellipses with the Sun at one focus', '轨道是椭圆，太阳在一个焦点上']], [['Kepler’s second law', '开普勒第二定律'], ['Equal areas are swept in equal times', '相等时间内扫过相等面积']], [['Kepler’s third law', '开普勒第三定律'], ['a³/T² is the same for all the planets', '所有行星的 a³/T² 都相等']], [['Newton’s law of gravitation', '牛顿万有引力定律'], ['F = GMm/r² explains all three', 'F = GMm/r² 能解释上述三条']]],
        why: ['Kepler described how the planets move (1609, 1619); Newton explained why (1687).', '开普勒描述了行星怎样运动（1609、1619 年），牛顿解释了为什么这样运动（1687 年）。'] },
      { q: ['Which statements are true? Pick all that are right.', '下列说法哪些正确？选出所有正确的。'],
        options: [['The Earth is closest to the Sun during the northern winter', '北半球冬季时地球离太阳最近'], ['A planet moves fastest at aphelion', '行星在远日点运动最快'], ['The other focus of a planet’s ellipse is empty', '行星椭圆轨道的另一个焦点上没有天体'], ['Mars’s orbit is more stretched than the Earth’s', '火星轨道比地球轨道更扁'], ['The Moon around the Earth has the same a³/T² as the planets around the Sun', '月球绕地球的 a³/T² 与行星绕太阳的相同']], multi: [0, 2, 3],
        why: ['Perihelion is in early January; planets are slowest at aphelion; Mars e = 0.093 > Earth 0.017; and a³/T² depends on the central body, so the Earth’s value is far smaller than the Sun’s.', '地球 1 月初过近日点；行星在远日点最慢；火星 e = 0.093，大于地球的 0.017；a³/T² 取决于中心天体，地球的这个比值远小于太阳的。'] },
      { q: ['Put these steps in order, earliest first.', '把下列事件按时间先后排序。'],
        order: [['Ptolemy’s Earth-centred system with epicycles', '托勒密的地心说与本轮'], ['Copernicus puts the Sun at the centre', '哥白尼提出日心说'], ['Tycho Brahe measures the planets precisely', '第谷精确观测行星'], ['Kepler publishes his first two laws', '开普勒发表前两条定律'], ['Newton publishes the law of gravitation', '牛顿发表万有引力定律']],
        why: ['About AD 150, 1543, 1576–1597, 1609 and 1687.', '分别约为公元 150 年、1543 年、1576～1597 年、1609 年和 1687 年。'] },
      { q: ['From the Spring Equinox to the Autumn Equinox takes about 186 days, but the other half of the year only about 179. Why?', '从春分到秋分约 186 天，而从秋分到次年春分只有约 179 天。为什么？'],
        options: [['The Earth is near aphelion in July and moves more slowly', '7 月地球在远日点附近，公转速度较慢'], ['The Earth spins more slowly in summer', '夏季地球自转变慢'], ['The Sun moves away from the Earth in summer', '夏季太阳离开地球'], ['The calendar has more days in the summer months', '历法中夏季月份天数更多']], answer: 0,
        why: ['Kepler’s second law: near aphelion the Earth moves more slowly, so it takes longer to cover the summer half of its orbit.', '开普勒第二定律：在远日点附近地球运动较慢，所以走完夏半年那半圈轨道要用更长时间。'] },
    ],
  },
  {
    id: 'a-cosmic-speeds', strand: 'motion', level: 'sr', tracks: SR, unit, icon: 'rocket', minutes: 15,
    title: ['Gravitation and the cosmic speeds', '万有引力和宇宙速度'],
    blurb: ['The Moon test, F = GMm/r², weighing the Earth and the Sun, the three cosmic speeds 7.9, 11.2 and 16.7 km/s, and why China launches from Wenchang.', '月地检验、F = GMm/r²、“称量”地球和太阳、三个宇宙速度 7.9、11.2、16.7 千米/秒，以及为什么在文昌发射。'],
    keys: [
      ['Law of universal gravitation: F = GMm/r², with G = 6.67 × 10⁻¹¹ N·m²/kg², first measured by Cavendish (1798). The Moon test (g/60² = the Moon’s 2.7 × 10⁻³ m/s²) showed that one force rules the apple and the Moon.', '万有引力定律：F = GMm/r²，引力常量 G = 6.67 × 10⁻¹¹ N·m²/kg²，由卡文迪什（1798 年）首先测出。月地检验（g/60² 恰好等于月球的 2.7 × 10⁻³ m/s²）证明苹果和月球受的是同一种力。'],
      ['Weighing a central body: from g and R, M = gR²/G (Earth 6.0 × 10²⁴ kg); from an orbit, M = 4π²r³/(GT²) (Sun 2.0 × 10³⁰ kg). The orbiting body’s own mass cancels.', '计算中心天体质量：由 g 和 R 得 M = gR²/G（地球 6.0 × 10²⁴ 千克）；由环绕天体的轨道得 M = 4π²r³/(GT²)（太阳 2.0 × 10³⁰ 千克）。环绕天体自身的质量被约去。'],
      ['First cosmic speed v₁ = √(GM/R) = √(gR) ≈ 7.9 km/s: the least launch speed for a satellite and the greatest speed of any circular orbit (shortest period about 85 min).', '第一宇宙速度 v₁ = √(GM/R) = √(gR) ≈ 7.9 千米/秒：发射人造卫星的最小速度，也是卫星绕地球做圆周运动的最大速度（最短周期约 85 分钟）。'],
      ['Between 7.9 and 11.2 km/s the orbit is an ellipse around the Earth; the second cosmic speed v₂ = √2 · v₁ ≈ 11.2 km/s escapes the Earth.', '发射速度介于 7.9 和 11.2 千米/秒之间时，卫星沿椭圆轨道绕地球运行；第二宇宙速度 v₂ = √2 · v₁ ≈ 11.2 千米/秒，达到它就能挣脱地球引力。'],
      ['Third cosmic speed 16.7 km/s: escape from the Solar System, launching along the Earth’s 29.8 km/s motion round the Sun.', '第三宇宙速度为 16.7 千米/秒：顺着地球 29.8 千米/秒的公转方向发射，达到它就能飞出太阳系。'],
      ['Rockets launch eastwards to borrow the Earth’s spin (465 cos φ m/s); low-latitude, coastal Wenchang (19.6°N) gains the most and ships big rockets by sea.', '火箭向东发射可以借助地球自转（465 cos φ 米/秒）；纬度低、靠海的文昌（19.6°N）借力最多，大型火箭还能走海运。'],
    ],
    steps: [
      {
        title: ['From the apple to the Moon', '从苹果到月球'],
        body: ['Newton guessed that the pull that drops an apple also holds the Moon, and that it weakens as 1/r². The Moon is about 60 Earth radii away, so its pull should be g/60² = 9.8 ÷ 3,600 = 2.72 × 10⁻³ m/s². Check it with the Moon’s orbit: r = 3.84 × 10⁸ m and T = 27.3 days = 2.36 × 10⁶ s give a centripetal acceleration 4π²r/T² = 2.72 × 10⁻³ m/s². The two agree: this “Moon test” showed that one law of gravity rules the Earth and the heavens.', '牛顿猜想：让苹果落地的力也拉住了月球，而且这个力与距离的平方成反比。月球离地心约 60 个地球半径，所以它的加速度应为 g/60² = 9.8 ÷ 3600 ≈ 2.72 × 10⁻³ m/s²。再用月球的轨道来验证：r = 3.84 × 10⁸ 米，T = 27.3 天 ≈ 2.36 × 10⁶ 秒，向心加速度 4π²r/T² ≈ 2.72 × 10⁻³ m/s²。两者一致：这次“月地检验”证明，地上和天上遵循同一个引力规律。'],
        fig: { k: 'svg', draw: (L, id) => inverseSquare(L, id) },
        astro: { kit: 'compare', mode: 'distance' },
      },
      {
        title: ['G and weighing the Earth', '引力常量与“称量”地球'],
        body: ['Any two masses attract with F = GMm/r². G is tiny: Cavendish measured it in 1798 with a torsion balance, twisting a fine fibre with the pull between lead balls; today G = 6.674 × 10⁻¹¹ N·m²/kg². Two 50 kg students 0.5 m apart pull each other with only 6.7 × 10⁻⁷ N. Knowing G lets us weigh the Earth. On the ground mg = GMm/R², so M = gR²/G = 9.8 × (6.4 × 10⁶)² ÷ (6.67 × 10⁻¹¹) ≈ 6.0 × 10²⁴ kg. Tiangong’s orbit agrees: r = 6,770 km, T = 92 min gives M = 4π²r³/(GT²) ≈ 6.0 × 10²⁴ kg.', '任何两个物体之间都相互吸引，F = GMm/r²。G 非常小：1798 年卡文迪什用扭秤测出了它，铅球之间微弱的引力使细丝发生扭转；今天测得 G = 6.674 × 10⁻¹¹ N·m²/kg²。两个相距 0.5 米、质量各 50 千克的同学之间的引力只有约 6.7 × 10⁻⁷ 牛。知道了 G，就能“称量”地球：在地面上 mg = GMm/R²，所以 M = gR²/G = 9.8 × (6.4 × 10⁶)² ÷ (6.67 × 10⁻¹¹) ≈ 6.0 × 10²⁴ 千克。用天宫的轨道也能算：r = 6770 千米，T = 92 分钟，M = 4π²r³/(GT²) ≈ 6.0 × 10²⁴ 千克。'],
        fig: { k: 'svg', draw: (L, id) => torsion(L, id) },
        astro: { kit: 'satellites', mode: 'leo', clock: { from: 0, to: 3, rate: 0.1, unit: 'hour', dp: 1 } },
      },
      {
        title: ['Weighing the Sun, finding Neptune', '“称量”太阳，发现海王星'],
        body: ['For any body orbiting a central mass M, GMm/r² = m(2π/T)²r gives M = 4π²r³/(GT²); the orbiting body’s own mass m cancels. For the Earth around the Sun, r = 1.50 × 10¹¹ m and T = 3.16 × 10⁷ s give M ≈ 2.0 × 10³⁰ kg, about 333,000 Earths and 99.86% of the Solar System’s mass. Gravity even predicted a planet: Uranus drifted from its calculated path, and Le Verrier worked out where an unseen planet must be pulling it. On 23 September 1846 Galle found Neptune within 1° of the predicted spot: “the planet found with pen and paper”.', '对于绕中心天体运行的任何天体，GMm/r² = m(2π/T)²r，得 M = 4π²r³/(GT²)；环绕天体自身的质量 m 被约去了。用地球绕太阳的 r = 1.50 × 10¹¹ 米、T = 3.16 × 10⁷ 秒，算得太阳质量 M ≈ 2.0 × 10³⁰ 千克，约为地球的 33.3 万倍，占太阳系总质量的 99.86%。万有引力定律甚至预言了新行星：天王星总是偏离计算的轨道，勒维耶据此算出一颗未知行星应在的位置。1846 年 9 月 23 日，伽勒在离预言位置不到 1° 处找到了海王星，它被称为“笔尖下发现的行星”。'],
        astro: { kit: 'orrery' },
      },
      {
        title: ['Lab: the first cosmic speed', '实验：第一宇宙速度'],
        task: ['Drag the launch speed and watch the cannonball’s path.', '拖动发射速度，观察炮弹的运动轨迹。'],
        body: ['For a circular orbit just above the ground, gravity provides the centripetal force: GMm/R² = mv²/R, so v₁ = √(GM/R). Since GM = gR², v₁ = √(gR) = √(9.8 × 6.4 × 10⁶) ≈ 7.9 × 10³ m/s. Below 7.9 km/s the ball falls back; at 7.9 km/s it circles once in 2πR/v ≈ 85 min. It is the least launch speed for a satellite and the greatest speed of any circular orbit, because higher orbits are slower: Tiangong, 400 km up, moves at 7.7 km/s.', '卫星贴近地面做匀速圆周运动时，万有引力提供向心力：GMm/R² = mv²/R，所以 v₁ = √(GM/R)。又因为 GM = gR²，v₁ = √(gR) = √(9.8 × 6.4 × 10⁶) ≈ 7.9 × 10³ 米/秒。低于 7.9 千米/秒，炮弹会落回地面；达到 7.9 千米/秒，它绕地球一圈需 2πR/v ≈ 85 分钟。它是发射人造卫星的最小速度，也是卫星绕地球做圆周运动的最大速度，因为轨道越高，速度越小：400 千米高的天宫速度约为 7.7 千米/秒。'],
        astro: {
          kit: 'cannon', mode: 'speed', marks: [6.5, 7.9, 8.4], clock: { from: 6, to: 8.4, rate: 0.2, unit: 'kms', at: 0.1, hold: true },
          tasks: [
            { text: ['Find the speed that just circles the Earth: 7.9 km/s.', '找出恰好绕地球做圆周运动的速度：7.9 千米/秒。'], done: (_p, v) => Math.abs(v - 7.9) < 0.06 },
            { text: ['Launch faster than 8.2 km/s: the circle stretches into an ellipse.', '以大于 8.2 千米/秒的速度发射：圆变成了椭圆。'], done: (_p, v) => v >= 8.2 },
          ],
        },
      },
      {
        title: ['Faster: ellipses and transfer orbits', '更快：椭圆轨道和转移轨道'],
        body: ['Launch faster than 7.9 km/s and the orbit becomes an ellipse, with the launch point as perigee. The faster the launch, the more stretched the ellipse and the higher the apogee, and the craft slows down as it climbs (Kepler’s second law). This is how communications satellites get to geostationary height: a Long March 3B from Xichang leaves them on a geostationary transfer orbit, with perigee about 200 km up at about 10.2 km/s and apogee near 36,000 km, where they are moving at only about 1.6 km/s. Up to 11.2 km/s the craft stays bound to the Earth.', '发射速度大于 7.9 千米/秒时，卫星的轨道变为椭圆，发射点就是近地点。发射速度越大，椭圆越扁长，远地点越高；卫星向上爬升时速度越来越小（开普勒第二定律）。通信卫星就是这样到达地球静止轨道高度的：西昌发射的长征三号乙火箭把卫星送入地球同步转移轨道，近地点高约 200 千米，速度约 10.2 千米/秒；远地点高约 3.6 万千米，速度只有约 1.6 千米/秒。只要不超过 11.2 千米/秒，航天器仍然绕地球运行。'],
        sketch: true,
        astro: { kit: 'cannon', mode: 'shots', v: [7.9, 9, 10.4] },
      },
      {
        title: ['Lab: the second cosmic speed', '实验：第二宇宙速度'],
        task: ['Speed up the launch until the path no longer comes back.', '逐渐加大发射速度，直到轨迹不再回来。'],
        body: ['The faster the launch, the farther out the apogee, until at v₂ = √(2GM/R) = √2 × 7.9 ≈ 11.2 km/s the ellipse opens into a parabola and the craft never comes back; faster still, a hyperbola. It escapes the Earth and becomes a small planet of the Sun. Chang’e probes leave their parking orbit at about 10.9 km/s, just short of escape, so they coast out to the Moon’s distance and are captured by the Moon. Tianwen-1, launched by a Long March 5 from Wenchang in July 2020, had to go faster than 11.2 km/s to reach Mars.', '发射速度越大，远地点越远，直到 v₂ = √(2GM/R) = √2 × 7.9 ≈ 11.2 千米/秒时，椭圆变成抛物线，航天器一去不返；速度更大则是双曲线。航天器挣脱了地球引力，成为绕太阳运行的“人造行星”。嫦娥探测器从停泊轨道出发时的速度约 10.9 千米/秒，略低于第二宇宙速度，所以能飞到月球附近，再被月球引力捕获。2020 年 7 月由长征五号在文昌发射的天问一号要飞往火星，速度必须超过 11.2 千米/秒。'],
        astro: {
          kit: 'cannon', mode: 'speed', marks: [7.9, 10, 11.2], clock: { from: 9.5, to: 12.5, rate: 0.2, unit: 'kms', hold: true },
          tasks: [
            { text: ['Launch at 11.0 km/s: a very long ellipse that still comes back.', '以 11.0 千米/秒发射：轨道是很长的椭圆，但仍会回来。'], done: (_p, v) => Math.abs(v - 11) <= 0.08 },
            { text: ['Reach 11.2 km/s: escape from the Earth.', '达到 11.2 千米/秒：挣脱地球引力。'], done: (_p, v) => v >= 11.2 },
          ],
        },
      },
      {
        title: ['Lab: the third cosmic speed', '实验：第三宇宙速度'],
        task: ['Drag the launch speed and follow the probe’s path round the Sun.', '拖动发射速度，观察探测器绕太阳的轨迹。'],
        body: ['To escape the Sun from the Earth’s orbit takes √2 × 29.8 ≈ 42.1 km/s. The Earth already carries us at 29.8 km/s, so a probe launched along the Earth’s motion needs only 12.3 km/s more once it has climbed away from the Earth. Climbing out of the Earth’s pull costs as much as 11.2 km/s, so the launch speed must be √(11.2² + 12.3²) ≈ 16.7 km/s: the third cosmic speed. About 14.2 km/s is enough to coast out to Jupiter. Voyager 1, launched in 1977 and helped by fly-bys of Jupiter and Saturn, left the Sun’s bubble in 2012 and is now more than 160 AU away.', '在地球轨道处挣脱太阳引力需要 √2 × 29.8 ≈ 42.1 千米/秒。地球已经带着我们以 29.8 千米/秒运动，所以顺着地球公转方向发射，探测器挣脱地球引力后只需再有 12.3 千米/秒。挣脱地球引力本身要“消耗”相当于 11.2 千米/秒的速度，所以发射速度应为 √(11.2² + 12.3²) ≈ 16.7 千米/秒，这就是第三宇宙速度。约 14.2 千米/秒就足以飞到木星轨道。1977 年发射的旅行者 1 号借助木星和土星的引力加速，2012 年飞出日球层，如今已在 160 多天文单位之外。'],
        fig: { k: 'bars', title: ['The three cosmic speeds', '三个宇宙速度'], unit: ['km/s, launched from the Earth’s surface', '千米/秒，从地面发射'],
          rows: [{ name: ['1st: orbit', '第一：环绕地球'], v: 7.9, c: C.green }, { name: ['2nd: escape Earth', '第二：脱离地球'], v: 11.2, c: C.violet }, { name: ['3rd: leave the Sun', '第三：飞出太阳系'], v: 16.7, c: C.red }] },
        astro: {
          kit: 'cannon', mode: 'solar', clock: { from: 12, to: 17.5, rate: 0.35, unit: 'kms', hold: true },
          tasks: [
            { text: ['Launch at about 14.2 km/s: just enough to reach Jupiter’s orbit.', '以约 14.2 千米/秒发射：刚好能飞到木星轨道。'], done: (_p, v) => Math.abs(v - 14.2) <= 0.15 },
            { text: ['Reach 16.7 km/s: leave the Solar System.', '达到 16.7 千米/秒：飞出太阳系。'], done: (_p, v) => v >= 16.7 },
          ],
        },
      },
      {
        title: ['Where to launch: China’s spaceports', '在哪里发射：我国的航天发射场'],
        cam: [28, 106, 2.6], sketch: true,
        lines: [par(0, C.gold, 0.2), ...arrows([[[17, 111.5], [17, 119.5]]], C.orange, 1.2, 2.2)],
        marks: [
          mk([0, 128], 'Equator: 465 m/s', '赤道：465 米/秒', { c: C.gold, t: 0.4 }),
          mk([19.61, 110.95], 'Wenchang 19.6°N · 438 m/s', '文昌 19.6°N · 438 米/秒', { dot: true, big: true, c: C.orange, t: 0.8 }),
          mk([28.25, 102.03], 'Xichang 28.2°N · 410 m/s', '西昌 28.2°N · 410 米/秒', { dot: true, c: C.teal, t: 1.1 }),
          mk([38.85, 111.61], 'Taiyuan 38.8°N · 362 m/s', '太原 38.8°N · 362 米/秒', { dot: true, c: C.teal, t: 1.4 }),
          mk([40.96, 100.29], 'Jiuquan 41.0°N · 351 m/s', '酒泉 41.0°N · 351 米/秒', { dot: true, c: C.teal, t: 1.7 }),
        ],
        body: ['The Earth turns eastwards, carrying the ground at 465 cos φ m/s, where φ is the latitude. A rocket launched eastwards gets that speed for free, so the nearer the equator the better: Wenchang in Hainan (19.6°N) gains 438 m/s, Xichang 410, Taiyuan 362 and Jiuquan 351. A low latitude also means less turning for a satellite heading for the equatorial geostationary orbit. Wenchang is on the coast: the 5 m wide stages of Long March 5 are too big for railway tunnels and come by ship, and spent stages fall into the sea. That is why Tianwen-1, Chang’e-5 and Tiangong’s modules flew from Wenchang, while crewed Shenzhou missions still leave from Jiuquan in the Gobi Desert.', '地球自西向东自转，地面向东运动的速度为 465 cos φ 米/秒（φ 为纬度）。火箭向东发射可以“免费”获得这部分速度，所以越靠近赤道越有利：海南文昌（19.6°N）可借力 438 米/秒，西昌 410 米/秒，太原 362 米/秒，酒泉 351 米/秒。纬度低，发射地球静止轨道卫星时需要的轨道面调整也更小。文昌濒临海洋：长征五号的芯级直径 5 米，铁路隧道运不了，要用船运；火箭残骸也落入大海，更安全。所以天问一号、嫦娥五号和天宫的舱段都从文昌发射，而载人的神舟飞船仍从戈壁滩上的酒泉发射。'],
      },
    ],
    quiz: [
      { q: ['If the distance between two masses triples, the gravitational force becomes…', '两个物体间的距离变为原来的 3 倍，它们之间的引力变为原来的'],
        options: [['1/3', '1/3 倍'], ['1/9', '1/9 倍'], ['3 times', '3 倍'], ['9 times', '9 倍']], answer: 1,
        why: ['F ∝ 1/r²: three times the distance gives 1/3² = 1/9 of the force.', 'F ∝ 1/r²，距离变为 3 倍，引力变为 1/3² = 1/9。'] },
      { q: ['Take g = 9.8 m/s², R = 6.4 × 10⁶ m and G = 6.67 × 10⁻¹¹ N·m²/kg². What is the Earth’s mass, in units of 10²⁴ kg?', '取 g = 9.8 m/s²，R = 6.4 × 10⁶ 米，G = 6.67 × 10⁻¹¹ N·m²/kg²。地球质量是多少（以 10²⁴ 千克为单位）？'], num: { answer: 6.0, tol: 0.15, unit: ['× 10²⁴ kg', '× 10²⁴ 千克'] },
        why: ['mg = GMm/R² gives M = gR²/G = 9.8 × 4.1 × 10¹³ ÷ 6.67 × 10⁻¹¹ ≈ 6.0 × 10²⁴ kg.', '由 mg = GMm/R² 得 M = gR²/G = 9.8 × 4.1 × 10¹³ ÷ (6.67 × 10⁻¹¹) ≈ 6.0 × 10²⁴ 千克。'] },
      { q: ['On the Moon g = 1.6 m/s² and the radius is 1.7 × 10⁶ m. What is the Moon’s first cosmic speed?', '月球表面 g = 1.6 m/s²，月球半径 1.7 × 10⁶ 米。月球的第一宇宙速度是多少？'], num: { answer: 1.65, tol: 0.05, unit: ['km/s', '千米/秒'] },
        why: ['v = √(gR) = √(1.6 × 1.7 × 10⁶) = √(2.72 × 10⁶) ≈ 1.65 × 10³ m/s: about a fifth of the Earth’s 7.9 km/s.', 'v = √(gR) = √(1.6 × 1.7 × 10⁶) = √(2.72 × 10⁶) ≈ 1.65 × 10³ 米/秒，约为地球 7.9 千米/秒的五分之一。'] },
      { q: ['A cannonball is fired horizontally near the ground at 10 km/s. It will…', '在地面附近以 10 千米/秒水平发射一颗炮弹，它将'],
        options: [['fall back to the ground', '落回地面'], ['circle just above the ground', '贴着地面做圆周运动'], ['orbit the Earth on an ellipse', '沿椭圆轨道绕地球运行'], ['escape the Earth', '挣脱地球引力']], answer: 2,
        why: ['10 km/s is between 7.9 and 11.2 km/s: an elliptical orbit with the launch point as perigee.', '10 千米/秒介于 7.9 和 11.2 千米/秒之间，轨道是椭圆，发射点为近地点。'],
        astro: { kit: 'cannon', mode: 'shots', v: [7.9, 11.2] } },
      { q: ['Match each launch speed from the ground to what happens.', '把从地面发射的速度和结果连起来。'],
        match: [[['5 km/s', '5 千米/秒'], ['Falls back to the ground', '落回地面']], [['7.9 km/s', '7.9 千米/秒'], ['Circles just above the ground', '贴地做圆周运动']], [['10 km/s', '10 千米/秒'], ['An ellipse round the Earth', '绕地球的椭圆轨道']], [['11.2 km/s', '11.2 千米/秒'], ['Escapes the Earth, orbits the Sun', '挣脱地球，绕太阳运行']], [['16.7 km/s', '16.7 千米/秒'], ['Leaves the Solar System', '飞出太阳系']]],
        why: ['7.9, 11.2 and 16.7 km/s are the three cosmic speeds; between the first two the orbit is an ellipse.', '7.9、11.2、16.7 千米/秒是三个宇宙速度；介于前两者之间时轨道是椭圆。'] },
      { q: ['Which statements about the first cosmic speed are true? Pick all that are right.', '关于第一宇宙速度，哪些说法正确？选出所有正确的。'],
        options: [['It is the least launch speed for an Earth satellite', '它是发射人造地球卫星的最小速度'], ['It is the greatest speed of a circular Earth orbit', '它是卫星绕地球做圆周运动的最大速度'], ['It equals √(gR)', '它等于 √(gR)'], ['Tiangong orbits faster than 7.9 km/s', '天宫的运行速度大于 7.9 千米/秒'], ['A geostationary satellite moves at 7.9 km/s', '地球静止卫星的运行速度是 7.9 千米/秒']], multi: [0, 1, 2],
        why: ['Higher orbits are slower: Tiangong moves at 7.7 km/s and a geostationary satellite at only 3.1 km/s.', '轨道越高速度越小：天宫约 7.7 千米/秒，地球静止卫星只有约 3.1 千米/秒。'] },
      { q: ['Place China’s four spaceports on the globe.', '在地球仪上标出我国的四个航天发射场。'],
        place: [{ text: ['Wenchang', '文昌'], at: [19.61, 110.95], tolKm: 300 }, { text: ['Xichang', '西昌'], at: [28.25, 102.03], tolKm: 300 }, { text: ['Taiyuan', '太原'], at: [38.85, 111.61], tolKm: 300 }, { text: ['Jiuquan', '酒泉'], at: [40.96, 100.29], tolKm: 300 }],
        why: ['Wenchang is on Hainan Island, Xichang in the hills of Sichuan, Taiyuan in Shanxi, and Jiuquan in the Gobi Desert of Inner Mongolia, near Gansu.', '文昌在海南岛，西昌在四川山区，太原在山西，酒泉在内蒙古额济纳旗的戈壁滩上（靠近甘肃）。'] },
      { q: ['Why does China launch its heaviest rockets from Wenchang?', '我国为什么在文昌发射最重的火箭？'],
        options: [['Low latitude gives a bigger eastward boost, and the coast allows sea transport', '纬度低，地球自转借力大；临海，便于海运'], ['The air over Hainan is thinner', '海南上空空气更稀薄'], ['Hainan never has cloudy weather', '海南从不阴天'], ['It is closest to the Moon', '那里离月球最近']], answer: 0,
        why: ['At 19.6°N the ground moves east at 438 m/s, and Long March 5’s wide stages can only travel by ship.', '文昌位于 19.6°N，地面向东运动速度约 438 米/秒；长征五号的粗大芯级只能海运。'] },
    ],
  },
  {
    id: 'a-satellites', strand: 'motion', level: 'sr', tracks: SR, unit, icon: 'globe', minutes: 15,
    title: ['Orbits of artificial satellites', '人造卫星的轨道'],
    blurb: ['Why higher satellites are slower, Tiangong and weightlessness, polar and geostationary orbits, BeiDou, changing orbits, and which orbit suits which job.', '为什么卫星越高越慢？天宫与失重、极地轨道和地球静止轨道、北斗系统、变轨，以及不同任务选什么轨道。'],
    keys: [
      ['Gravity is the centripetal force: GMm/r² = mv²/r, so a = GM/r², v = √(GM/r), ω = √(GM/r³) and T = 2π√(r³/GM). Higher orbits are slower and longer: Tiangong 7.7 km/s and 92 min, geostationary 3.1 km/s and 23 h 56 min.', '万有引力提供向心力：GMm/r² = mv²/r，得 a = GM/r²，v = √(GM/r)，ω = √(GM/r³)，T = 2π√(r³/GM)。轨道越高，速度越小，周期越长：天宫约 7.7 千米/秒、92 分钟；地球静止卫星约 3.1 千米/秒、23 时 56 分。'],
      ['Astronauts in orbit are weightless not because gravity is gone (it is still about 89% of g at 400 km) but because they and the station fall round the Earth together.', '航天员在轨道上处于失重状态，不是因为没有引力（400 千米高处仍约为 g 的 89%），而是因为他们和空间站一起绕地球“下落”。'],
      ['Polar and sun-synchronous orbits (about 500–1,000 km) pass over every latitude at the same local time: ideal for weather and Earth-observation satellites such as Fengyun-3.', '极地轨道和太阳同步轨道（约 500～1000 千米）经过所有纬度，并在相同的地方时经过同一地点：适合风云三号等气象卫星和对地观测卫星。'],
      ['A geostationary satellite orbits 35,786 km above the equator (r = 42,164 km) once per sidereal day, eastwards, and stays above one point; three of them cover almost the whole Earth except the polar regions.', '地球静止卫星位于赤道上空 35 786 千米（r = 42 164 千米），自西向东运行，周期等于地球自转周期，始终停留在同一地点上空；三颗就能覆盖除两极地区以外的几乎整个地球。'],
      ['BeiDou-3 (2020) combines 24 MEO satellites at about 21,500 km with 3 GEO and 3 IGSO satellites; a receiver needs signals from at least four satellites.', '北斗三号（2020 年建成）由 24 颗约 2.15 万千米高的中圆轨道卫星以及 3 颗地球静止轨道卫星、3 颗倾斜地球同步轨道卫星组成；接收机至少需要 4 颗卫星的信号。'],
      ['To move to a higher orbit a spacecraft speeds up (into an ellipse), then speeds up again at apogee to make it round; to come down it slows down.', '航天器要升到更高的轨道，先加速进入椭圆轨道，到远地点再加速使轨道变圆；要返回地面则需减速。'],
    ],
    steps: [
      {
        title: ['Higher is slower', '越高越慢'],
        body: ['Gravity provides the centripetal force: GMm/r² = mv²/r = mω²r = m(2π/T)²r. So a = GM/r², v = √(GM/r), ω = √(GM/r³) and T = 2π√(r³/GM): the farther from the Earth’s centre, the smaller a, v and ω and the longer T. Tiangong, r = 6,770 km, moves at 7.7 km/s and laps in 92 min. BeiDou’s MEO satellites, r ≈ 27,900 km, move at 3.8 km/s and take 12.9 h. A geostationary satellite, r = 42,164 km, moves at 3.1 km/s and takes 23 h 56 min.', '万有引力提供向心力：GMm/r² = mv²/r = mω²r = m(2π/T)²r。所以 a = GM/r²，v = √(GM/r)，ω = √(GM/r³)，T = 2π√(r³/GM)：离地心越远，a、v、ω 越小，T 越大。天宫 r ≈ 6770 千米，速度约 7.7 千米/秒，92 分钟绕一圈；北斗中圆轨道卫星 r ≈ 27 900 千米，速度约 3.8 千米/秒，周期约 12.9 小时；地球静止卫星 r = 42 164 千米，速度约 3.1 千米/秒，周期 23 时 56 分。'],
        fig: { k: 'bars', title: ['Higher orbit, longer period', '轨道越高，周期越长'], unit: ['period in hours', '周期（小时）'],
          rows: [{ name: ['Tiangong 400 km', '天宫 400 千米'], v: 1.5, c: C.white }, { name: ['polar 700 km', '极地轨道 700 千米'], v: 1.6, c: C.teal }, { name: ['BeiDou MEO 21,500 km', '北斗中圆轨道 2.15 万千米'], v: 12.9, c: C.violet }, { name: ['geostationary 35,786 km', '地球静止轨道 35 786 千米'], v: 23.9, c: C.gold }] },
        astro: { kit: 'satellites', mode: 'overview', clock: { from: 0, to: 48, rate: 1.2, unit: 'hour' } },
      },
      {
        title: ['Low Earth orbit: Tiangong', '近地轨道：天宫空间站'],
        body: ['Tiangong orbits about 400 km up, tilted 41.5° to the equator, about 15.5 laps a day. During each 92-minute lap the Earth turns about 23° beneath it, so its ground track (gold) shifts west each time and weaves between 41.5°N and 41.5°S. It passes over Beijing (39.9°N) but never directly over Harbin (45.8°N). Low orbits are easy to reach and close for crews and cameras, but the thin air there slowly drags the station down, so its engines boost it back up from time to time.', '天宫在约 400 千米高的轨道上运行，轨道面与赤道面的夹角为 41.5°，每天绕地球约 15.5 圈。每绕一圈的 92 分钟里，地球在下方自转约 23°，所以星下点轨迹（金色）每圈都向西移动，在北纬 41.5° 和南纬 41.5° 之间来回穿梭。它能经过北京（39.9°N）上空，却永远不会从哈尔滨（45.8°N）头顶经过。近地轨道容易到达，离地面近，便于航天员往返和对地观测；但那里稀薄的大气会使空间站慢慢降低，需要不时开动发动机抬升轨道。'],
        astro: { kit: 'satellites', mode: 'leo', track: true, clock: { from: 0, to: 12, rate: 0.3, unit: 'hour', dp: 1 } },
      },
      {
        title: ['Weightlessness', '失重'],
        body: ['At 400 km gravity is still strong: g′ = g·R²/r² = 9.8 × (6,400 ÷ 6,800)² ≈ 8.7 m/s², about 89% of its value on the ground. Yet astronauts float, because gravity is entirely used to bend their path round the Earth: the station and everything in it fall together, so nothing presses on the floor and scales read zero (Tiangong measures the crew’s mass with a spring device that uses F = ma). In the first Tiangong Classroom, on 9 December 2021, Wang Yaping pushed a ping-pong ball into water and it stayed there: with no weight there is no buoyancy. A water ball with an air bubble inside showed two images of her face, one upside down.', '在 400 千米高处，引力依然很强：g′ = g·R²/r² = 9.8 × (6400 ÷ 6800)² ≈ 8.7 m/s²，约为地面的 89%。航天员却飘浮着，因为引力全部用来改变他们绕地球运动的方向：空间站和里面的一切一起“下落”，没有东西压在地板上，秤的示数为零（天宫用弹簧装置根据 F = ma 测量航天员的质量）。2021 年 12 月 9 日第一次“天宫课堂”上，王亚平把乒乓球按进水里，乒乓球就停在水中：没有重力，也就没有浮力。中间有气泡的水球里，呈现出她一正一倒两个像。'],
        astro: { kit: 'satellites', mode: 'leo', clock: { from: 0, to: 3, rate: 0.1, unit: 'hour', dp: 1 } },
      },
      {
        title: ['Polar and sun-synchronous orbits', '极地轨道和太阳同步轨道'],
        body: ['A polar orbit passes near both poles. The Earth turns about 25° during each 99-minute lap, so the ground track shifts west and the satellite eventually sees the whole planet. Tilt the orbit a little past 90° (about 98°) and the Earth’s equatorial bulge slowly turns its plane eastwards by about 0.986° a day, keeping pace with the Sun. In this sun-synchronous orbit the satellite crosses each latitude at the same local time every day, so the lighting in its pictures stays the same. China’s Fengyun-3 weather satellites fly like this, about 836 km up at 98.75°, and so do Earth-observation satellites such as Gaofen.', '极地轨道经过地球两极附近。卫星每绕一圈约 99 分钟，这期间地球自转约 25°，所以星下点轨迹不断向西移动，卫星最终能看遍整个地球。把轨道倾角稍稍调到 90° 以上（约 98°），地球赤道的隆起会使轨道面每天向东转动约 0.986°，正好跟上太阳。在这种太阳同步轨道上，卫星每天在相同的地方时经过同一纬度，图像的光照条件保持一致。我国风云三号气象卫星就在约 836 千米高、倾角 98.75° 的太阳同步轨道上运行，高分系列等对地观测卫星也是如此。'],
        astro: { kit: 'satellites', mode: 'polar', clock: { from: 0, to: 12, rate: 0.3, unit: 'hour', dp: 1 } },
      },
      {
        title: ['Geostationary orbit', '地球静止轨道'],
        body: ['For T = 23 h 56 min = 86,164 s, GMm/r² = m(2π/T)²r gives r = ∛(GMT²/4π²) ≈ 42,164 km: 35,786 km above the equator, about 5.6 Earth radii up, where v = 2πr/T ≈ 3.07 km/s. A satellite there, moving east above the equator, keeps pace with the turning ground and hangs over one spot, so dishes can point at it without moving. It must be above the equator, because every orbit is centred on the Earth’s centre. One satellite sees about 42% of the Earth; three, 120° apart, cover all but the polar caps beyond about 81°. Fengyun-4 watches China’s weather from here, and Tianlian relay satellites pass Tiangong’s data to the ground.', '取 T = 23 时 56 分 = 86 164 秒，由 GMm/r² = m(2π/T)²r 得 r = ∛(GMT²/4π²) ≈ 42 164 千米，即赤道上空 35 786 千米，约 5.6 个地球半径高，速度 v = 2πr/T ≈ 3.07 千米/秒。卫星在赤道上空自西向东运行，与地面同步转动，始终停在同一地点上空，地面天线不用转动就能对准它。它只能位于赤道上空，因为卫星轨道平面必须经过地心。一颗静止卫星能看到约 42% 的地球表面；相隔 120° 的三颗就能覆盖除约 81° 以上两极地区以外的全球。风云四号在这里监测我国天气，天链中继卫星在这里把天宫的数据转发到地面。'],
        fig: { k: 'svg', draw: (L, id) => geoCover(L, id) },
        astro: { kit: 'satellites', mode: 'geo', clock: { from: 0, to: 24, rate: 1.5, unit: 'hour' } },
      },
      {
        title: ['The BeiDou navigation system', '北斗卫星导航系统'],
        body: ['BeiDou-3, completed in 2020, has 30 satellites. 24 are in medium Earth orbit at about 21,500 km, in three planes tilted 55°, each going round in 12 h 53 min, so several are always above any place on Earth. Over Asia and the Pacific it adds 3 geostationary and 3 inclined geosynchronous (IGSO) satellites; the IGSO satellites take a day per lap but are tilted 55°, so their ground tracks draw a figure 8 centred near 118°E. A receiver times signals from at least four satellites: three for its position and one more to correct its own clock. GPS is similar, with satellites at 20,200 km in six planes.', '北斗三号系统于 2020 年建成，共 30 颗卫星。其中 24 颗是约 2.15 万千米高的中圆轨道卫星，分布在 3 个倾角 55° 的轨道面上，周期 12 时 53 分，任何地方上空总有好几颗。为了重点服务亚太地区，又加了 3 颗地球静止轨道卫星和 3 颗倾斜地球同步轨道卫星；后者周期也是一天，但轨道倾角 55°，星下点轨迹是以约 118°E 为中心的“8”字形。接收机测量至少 4 颗卫星信号的传播时间：3 颗确定位置，再加 1 颗校正自己的时钟。美国的 GPS 与此类似，卫星高约 2.02 万千米，分布在 6 个轨道面上。'],
        astro: { kit: 'satellites', mode: 'beidou', clock: { from: 0, to: 26, rate: 1.2, unit: 'hour' } },
      },
      {
        title: ['Changing orbits', '变轨'],
        body: ['To climb higher, a spacecraft fires its engine forwards to speed up: its circle becomes an ellipse whose far end is higher. As it climbs it slows down, so at apogee it must speed up again to make the orbit round. A geostationary satellite leaves its rocket on a transfer orbit at about 10.2 km/s near perigee, arrives near 36,000 km at only about 1.6 km/s, and fires its engine there to reach 3.07 km/s. Strangely, after speeding up twice it ends up slower than before, because the higher orbit is slower. To catch up with Tiangong, a cargo ship starts in a lower, faster orbit and rises to meet it: on 12 November 2022 Tianzhou-5 docked just 2 h 07 min after launch, a world record. To come home, Shenzhou fires its engine backwards and slows down.', '要升到更高的轨道，航天器向后喷气加速：圆轨道变成椭圆，远地点升高。航天器向上爬升时速度变小，所以到远地点还要再加速，把轨道变圆。地球静止卫星由火箭送入转移轨道，在近地点附近速度约 10.2 千米/秒，到达约 3.6 万千米高的远地点时只剩约 1.6 千米/秒，再在那里点火加速到 3.07 千米/秒。奇怪的是，加速两次后它反而比原来慢，因为高轨道速度小。货运飞船要追上天宫，先在较低、较快的轨道上追赶，再升高与它会合：2022 年 11 月 12 日，天舟五号发射后仅 2 小时 07 分就与空间站对接，创造了世界纪录。返回地面时，神舟飞船向前喷气减速。'],
        sketch: true,
        astro: { kit: 'cannon', mode: 'shots', v: [7.9, 10.4] },
      },
      {
        title: ['Which orbit for which job?', '什么任务选什么轨道？'],
        body: ['Each job picks its orbit. Crews and close-up cameras go low (Tiangong, about 400 km). Weather and mapping satellites that must see every part of the Earth in the same light use sun-synchronous orbits (Fengyun-3, Gaofen). Navigation needs many satellites spread around the sky: medium orbits (BeiDou, GPS). Satellites that must stay over one region, for TV, weather pictures every few minutes or data relay, sit in geostationary orbit (Fengyun-4, Tianlian). Together they power the “3S” technologies of geography: remote sensing (RS) gathers images, satellite navigation (GNSS, such as BeiDou) gives positions, and geographic information systems (GIS) analyse the data for farming, disaster relief and city planning.', '不同的任务选择不同的轨道。载人航天和高分辨率拍照要飞得低（天宫，约 400 千米）。需要在相同光照下看遍全球的气象和测绘卫星，用太阳同步轨道（风云三号、高分系列）。导航需要很多颗卫星分布在天空各处，用中圆轨道（北斗、GPS）。需要始终盯住一个地区的电视、几分钟一幅云图的气象观测和数据中继，用地球静止轨道（风云四号、天链）。它们共同支撑着地理学中的“3S”技术：遥感（RS）获取图像，全球卫星导航系统（GNSS，如北斗）提供位置，地理信息系统（GIS）分析数据，服务于农业、防灾减灾和城市规划。'],
        astro: { kit: 'satellites', mode: 'overview', clock: { from: 0, to: 48, rate: 1, unit: 'hour' } },
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
      { q: ['A satellite skimming the ground takes about 85 min per lap. Another orbits 4 Earth radii from the centre. What is its period, in hours?', '贴近地面运行的卫星周期约为 85 分钟。另一颗卫星的轨道半径是地球半径的 4 倍，它的周期是多少小时？'], num: { answer: 11.3, tol: 0.2, unit: ['h', '小时'] },
        why: ['T ∝ r^1.5, so T = 85 × 4^1.5 = 85 × 8 = 680 min ≈ 11.3 h.', '由 T ∝ r^1.5，T = 85 × 4^1.5 = 85 × 8 = 680 分钟 ≈ 11.3 小时。'] },
      { q: ['Take g = 9.8 m/s² and R = 6,400 km. What is the gravitational acceleration at Tiangong’s height of 400 km?', '取 g = 9.8 m/s²，R = 6400 千米。天宫所在的 400 千米高处，重力加速度是多少？'], num: { answer: 8.68, tol: 0.1, unit: ['m/s²', 'm/s²'] },
        why: ['g′ = g·R²/(R + h)² = 9.8 × (6,400 ÷ 6,800)² ≈ 8.7 m/s²: astronauts float because they are falling, not because gravity is gone.', 'g′ = g·R²/(R + h)² = 9.8 × (6400 ÷ 6800)² ≈ 8.7 m/s²：航天员飘浮是因为在“下落”，而不是没有引力。'] },
      { q: ['Match each satellite to its orbit.', '把卫星和它的轨道连起来。'],
        match: [[['Tiangong space station', '天宫空间站'], ['Low orbit, about 400 km', '约 400 千米的近地轨道']], [['Fengyun-3 weather satellite', '风云三号气象卫星'], ['Sun-synchronous orbit', '太阳同步轨道']], [['Fengyun-4 weather satellite', '风云四号气象卫星'], ['Geostationary orbit', '地球静止轨道']], [['BeiDou-3 MEO satellites', '北斗三号中圆轨道卫星'], ['Medium orbit, about 21,500 km', '约 2.15 万千米的中圆轨道']]],
        why: ['Fengyun-3 sees the whole globe at the same local time; Fengyun-4 stares at the same half of the Earth all day.', '风云三号在相同地方时看遍全球；风云四号整天盯着同一半个地球。'] },
      { q: ['Which are true of every geostationary satellite? Pick all that are right.', '下列哪些是所有地球静止卫星的共同特点？选出所有正确的。'],
        options: [['It is above the equator', '位于赤道上空'], ['Its period is one turn of the Earth, 23 h 56 min', '周期等于地球自转周期 23 时 56 分'], ['It is about 35,786 km up', '离地面约 35 786 千米'], ['It can hover above Beijing', '可以停在北京上空'], ['It moves faster than Tiangong', '运行速度比天宫大']], multi: [0, 1, 2],
        why: ['The period fixes r = 42,164 km, so all share one ring above the equator, moving at only 3.07 km/s.', '周期确定了 r = 42 164 千米，所以它们都在赤道上空的同一圆环上，速度只有 3.07 千米/秒。'] },
      { q: ['Put these orbits in order of height, lowest first.', '把这些轨道按高度从低到高排列。'],
        order: [['Tiangong space station', '天宫空间站'], ['Fengyun-3 (sun-synchronous)', '风云三号（太阳同步轨道）'], ['GPS satellites', 'GPS 卫星'], ['BeiDou MEO satellites', '北斗中圆轨道卫星'], ['Fengyun-4 (geostationary)', '风云四号（地球静止轨道）']],
        why: ['About 400 km, 836 km, 20,200 km, 21,500 km and 35,786 km. The higher the orbit, the longer the period: 92 min, 102 min, 11 h 58 min, 12 h 53 min and 23 h 56 min.', '分别约为 400 千米、836 千米、2.02 万千米、2.15 万千米和 35 786 千米。轨道越高，周期越长：92 分钟、102 分钟、11 时 58 分、12 时 53 分和 23 时 56 分。'] },
    ],
  },
];
