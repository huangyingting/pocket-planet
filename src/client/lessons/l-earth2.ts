/** 七上 · 地球和地图 (2): revolution and seasons, the five heat zones. */
import { C, T, mk, par, type Fig, type Lesson, type Pair } from './kit.ts';
import { svg, tx, arrowDef, type Lx } from './figs.ts';

const unit = ['The Earth and maps', '地球和地图'] as const;
const TROPICS = [par(23.44, C.orange, 0, { dur: 1.6 }), par(-23.44, C.orange, 0.3, { dur: 1.6 })];
const CIRCLES = [par(66.56, C.ice, 0.6, { dur: 1.6 }), par(-66.56, C.ice, 0.9, { dur: 1.6 })];
const ZONES_PAINT = [
  { fill: { k: 'band' as const, s: -23.44, n: 23.44, c: C.red }, a: 0.34 },
  { fill: { k: 'band' as const, s: 23.44, n: 66.56, c: C.green }, a: 0.32 }, { fill: { k: 'band' as const, s: -66.56, n: -23.44, c: C.green }, a: 0.32 },
  { fill: { k: 'band' as const, s: 66.56, n: 90, c: C.ice }, a: 0.42 }, { fill: { k: 'band' as const, s: -90, n: -66.56, c: C.ice }, a: 0.42 },
];
/** A UTC instant from Beijing time. */
const bj = (y: number, m: number, d: number, h: number) => Date.UTC(y, m - 1, d, h - 8);
const BEIJING: [number, number] = [39.9, 116.4];

// ------------------------------------------------------------------------------------------------ figure helpers

const fade = (d: number, s: string) => `<g class="f-fade" style="--d:${d}s">${s}</g>`;
const pts = (p: [number, number][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/** The Earth at the four turning points of its orbit; `letters` hides the names (for a quiz). */
const orbitFig = (letters: boolean): Fig => ({
  k: 'svg', draw: (L: Lx, id: string) => {
    const cx = 160, cy = 114, rx = 120, ry = 48;
    const E = (deg: number): [number, number] => [cx + rx * Math.cos((deg * Math.PI) / 180), cy + ry * Math.sin((deg * Math.PI) / 180)];
    const tilt = (23.5 * Math.PI) / 180, ax: [number, number] = [Math.sin(tilt), -Math.cos(tilt)], eq: [number, number] = [-ax[1], ax[0]];
    let o = arrowDef(id + 'a', C.gold) + tx(4, 12, L(['The Earth\'s orbit and the four turning points', '地球公转示意图：二分二至']), 'fg-title');
    o += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" class="fg-guide"/>`;
    // seen from above the North Pole the Earth moves anticlockwise: left → front → right → back
    for (const [a, b] of [[160, 118], [340, 298], [70, 28], [250, 208]]) {
      const seg: [number, number][] = [];
      for (let k = 0; k <= 8; k++) seg.push(E(a + ((b - a) * k) / 8));
      o += `<polyline points="${pts(seg)}" class="fg-arrow" marker-end="url(#${id}a)"/>`;
    }
    o += `<circle cx="${cx}" cy="${cy}" r="13" class="fg-sun"/>` + tx(cx, cy + 25, L(['Sun', '太阳']), 'fg-label', 'm');
    // [angle on the ellipse, radius (nearer = bigger), name, date, overhead latitude, letter, label below?]
    const P: [number, number, Pair, Pair, Pair, string, boolean][] = [
      [270, 9, ['March equinox', '春分'], ['about 21 Mar', '3 月 21 日前后'], ['Sun over the equator', '直射赤道'], 'A', false],
      [180, 11, ['June solstice', '夏至'], ['about 22 Jun', '6 月 22 日前后'], ['over 23.5°N', '直射北回归线'], 'B', true],
      [90, 13, ['September equinox', '秋分'], ['about 23 Sep', '9 月 23 日前后'], ['Sun over the equator', '直射赤道'], 'C', true],
      [0, 11, ['December solstice', '冬至'], ['about 22 Dec', '12 月 22 日前后'], ['over 23.5°S', '直射南回归线'], 'D', true],
    ];
    P.forEach(([a, r, name, date, over, letter, below], i) => {
      const [x, y] = E(a), dx = cx - x, dy = cy - y, n = Math.hypot(dx, dy), u: [number, number] = [dx / n, dy / n], pp: [number, number] = [-u[1], u[0]];
      const lit: [number, number][] = [];
      for (let k = 0; k <= 16; k++) { const t = (k / 16) * Math.PI; lit.push([x + r * (Math.cos(t) * pp[0] + Math.sin(t) * u[0]), y + r * (Math.cos(t) * pp[1] + Math.sin(t) * u[1])]); }
      let g = `<circle cx="${x}" cy="${y}" r="${r}" fill="#1c2a44" stroke="#74c0fc" stroke-width="0.8"/>` + `<polygon points="${pts(lit)}" fill="rgba(116,192,252,.75)"/>`;
      g += `<line x1="${(x - eq[0] * r).toFixed(1)}" y1="${(y - eq[1] * r).toFixed(1)}" x2="${(x + eq[0] * r).toFixed(1)}" y2="${(y + eq[1] * r).toFixed(1)}" stroke="${C.gold}" stroke-width="0.8"/>`;
      g += `<line x1="${(x - ax[0] * (r + 5)).toFixed(1)}" y1="${(y - ax[1] * (r + 5)).toFixed(1)}" x2="${(x + ax[0] * (r + 6)).toFixed(1)}" y2="${(y + ax[1] * (r + 6)).toFixed(1)}" stroke="${C.white}" stroke-width="1.2"/>`;
      g += tx(x + ax[0] * (r + 9), y + ax[1] * (r + 9) + 2, L(['N', '北']), 'fg-tick', 'm');
      const ly = below ? y + r + 13 : y - r - 22;
      g += letters ? tx(x, below ? y + r + 15 : y - r - 12, letter, 'fg-title', 'm')
        : tx(x, ly, `${L(name)} · ${L(date)}`, 'fg-label', 'm') + tx(x, ly + 10, L(over), 'fg-sub', 'm');
      o += fade(0.4 + 0.35 * i, g);
    });
    if (!letters) o += fade(1.9, tx(316, 214, L(['axis always points to Polaris', '地轴北端始终指向北极星附近']), 'fg-sub', 'e'));
    return svg(320, 220, o, L(['The Earth at the solstices and equinoxes, its axis tilted the same way all year', '二分二至时地球在公转轨道上的位置，地轴倾斜方向不变']));
  },
});

/** Beijing's noon Sun at the solstices and equinoxes, and the length of the day. */
const noonFig: Fig = {
  k: 'svg', draw: L => {
    const ox = 170, oy = 140, R = 112;
    let o = tx(4, 12, L(['Beijing (39.9°N): noon Sun and day length', '北京（39.9°N）的正午太阳高度和昼长']), 'fg-title');
    o += `<line x1="16" x2="306" y1="${oy}" y2="${oy}" class="fg-profile"/>` + tx(18, oy + 12, L(['south', '南']), 'fg-tick') + tx(304, oy + 12, L(['north', '北']), 'fg-tick', 'e');
    const rows: [number, string, Pair, Pair][] = [
      [73.5, C.red, ['June solstice 73.5°', '夏至 73.5°'], ['day ≈ 15 h', '昼长约 15 小时']],
      [50.1, C.gold, ['Equinoxes 50.1°', '春分、秋分 50.1°'], ['day ≈ 12 h', '昼长约 12 小时']],
      [26.6, C.blue, ['December solstice 26.6°', '冬至 26.6°'], ['day ≈ 9 h 20 min', '昼长约 9 小时 20 分']],
    ];
    rows.forEach(([a, c, name, day], i) => {
      const r = (a * Math.PI) / 180, x = ox - R * Math.cos(r), y = oy - R * Math.sin(r), ar = 24 + i * 9;
      let g = `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${ox}" y2="${oy}" stroke="${c}" stroke-width="1.6"/>` + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${c}"/>`;
      g += `<path d="M ${ox - ar} ${oy} A ${ar} ${ar} 0 0 1 ${(ox - ar * Math.cos(r)).toFixed(1)} ${(oy - ar * Math.sin(r)).toFixed(1)}" fill="none" stroke="${c}" stroke-width="0.8"/>`;
      g += tx(x - 8, y - 2, L(name), 'fg-label', 'e');
      g += `<rect x="214" y="${42 + i * 24}" width="8" height="8" fill="${c}"/>` + tx(226, 49 + i * 24, L(day), 'fg-label');
      o += fade(0.4 + 0.5 * i, g);
    });
    o += `<circle cx="${ox}" cy="${oy - 5}" r="3" fill="${C.white}"/><line x1="${ox}" x2="${ox}" y1="${oy - 2}" y2="${oy}" stroke="${C.white}"/>`;
    o += fade(2, tx(214, 120, L(['higher Sun + longer day', '太阳高 + 白昼长']), 'fg-sub') + tx(214, 131, L(['= more heat: summer', '= 得到热量多：夏季']), 'fg-sub'));
    return svg(320, 160, o, L(['Noon Sun altitude in Beijing at the solstices and equinoxes', '北京二分二至日的正午太阳高度']));
  },
};

/** Equinox sunlight on a cross-section of the Earth: the five zones, and the same beam spreading out toward the pole. */
const beamFig: Fig = {
  k: 'svg', draw: (L, id) => {
    const cx = 92, cy = 96, r = 64, Y = (lat: number) => cy - r * Math.sin((lat * Math.PI) / 180);
    let o = `<defs><clipPath id="${id}c"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>`;
    o += tx(4, 12, L(['Sunlight and the five zones (an equinox)', '太阳光照与五带（春分、秋分日）']), 'fg-title');
    const bands: [number, number, string][] = [[90, 66.56, C.ice], [66.56, 23.44, C.green], [23.44, -23.44, C.red], [-23.44, -66.56, C.green], [-66.56, -90, C.ice]];
    o += `<g clip-path="url(#${id}c)">` + bands.map(([n, s, c]) => `<rect x="${cx - r}" y="${Y(n).toFixed(1)}" width="${2 * r}" height="${(Y(s) - Y(n)).toFixed(1)}" fill="${c}" opacity="0.45"/>`).join('') + '</g>';
    o += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#74c0fc"/>`;
    for (const lat of [66.56, 23.44, 0, -23.44, -66.56]) { const w = r * Math.cos((lat * Math.PI) / 180); o += `<line x1="${(cx - w).toFixed(1)}" x2="${(cx + w).toFixed(1)}" y1="${Y(lat).toFixed(1)}" y2="${Y(lat).toFixed(1)}" stroke="${lat ? C.white : C.gold}" stroke-width="0.5" opacity="0.7"/>`; }
    // two beams of the same width: one at the equator, one at about 55°N
    const beam = (mid: number, d: number) => {
      const y1 = mid - 5, y2 = mid + 5, x = (y: number) => cx - Math.sqrt(r * r - (y - cy) ** 2);
      const a1 = Math.asin((cy - y1) / r), a2 = Math.asin((cy - y2) / r), arc: [number, number][] = [];
      for (let k = 0; k <= 10; k++) { const a = a1 + ((a2 - a1) * k) / 10; arc.push([cx - r * Math.cos(a), cy - r * Math.sin(a)]); }
      return fade(d, `<polygon points="${pts([[6, y1], [x(y1), y1], ...arc, [x(y2), y2], [6, y2]])}" fill="${C.gold}" opacity="0.55"/>`
        + `<polyline points="${pts(arc)}" fill="none" stroke="${C.gold}" stroke-width="3"/>`);
    };
    o += beam(cy, 0.5) + beam(Y(55), 0.9);
    o += fade(1.2, tx(8, cy - 8, L(['same beam', '同样多的阳光']), 'fg-tick') + tx(8, Y(55) - 8, L(['same beam', '同样多的阳光']), 'fg-tick'));
    const rows: [number, number, string, Pair, Pair][] = [
      [78, 30, C.ice, ['North Frigid Zone', '北寒带'], ['polar day and night', '有极昼极夜']],
      [45, 60, C.green, ['North Temperate Zone', '北温带'], ['no overhead Sun, no polar day', '无直射，无极昼极夜']],
      [0, 96, C.red, ['Torrid Zone', '热带'], ['overhead Sun twice a year', '有太阳直射']],
      [-45, 132, C.green, ['South Temperate Zone', '南温带'], ['four clear seasons', '四季分明']],
      [-78, 162, C.ice, ['South Frigid Zone', '南寒带'], ['Sun always low', '太阳高度终年很低']],
    ];
    rows.forEach(([lat, y, c, name, note], i) => {
      const px = cx + r * Math.cos((lat * Math.PI) / 180) - 2, py = Y(lat);
      o += fade(1.4 + 0.2 * i, `<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="176" y2="${y - 3}" stroke="${c}" stroke-width="0.6"/>`
        + `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="1.8" fill="${c}"/>` + tx(180, y - 1, L(name), 'fg-label') + tx(180, y + 9, L(note), 'fg-sub'));
    });
    o += fade(2.6, tx(4, 186, L(['High latitudes: low Sun, the same light spread over more ground', '纬度越高，太阳高度越低，同样多的阳光照射的面积越大，单位面积获得的热量越少']), 'fg-sub'));
    return svg(320, 192, o, L(['Sunlight falls head-on at the equator and slants toward the poles', '赤道附近太阳光直射，越往两极越斜']));
  },
};

/** Shares of the Earth's surface, from the sines of the boundary latitudes. */
const areaFig: Fig = {
  k: 'bars', title: ['Share of the Earth\'s surface', '五带面积占地球表面积的比例'], unit: ['%', '%'],
  rows: [
    { name: ['Torrid Zone', '热带'], v: 39.8, c: C.red },
    { name: ['North Temperate Zone', '北温带'], v: 26.0, c: C.green },
    { name: ['South Temperate Zone', '南温带'], v: 26.0, c: C.green },
    { name: ['North Frigid Zone', '北寒带'], v: 4.1, c: C.ice },
    { name: ['South Frigid Zone', '南寒带'], v: 4.1, c: C.ice },
  ],
};

export const EARTH_B: Lesson[] = [
  {
    id: 'revolution', strand: 'maps', tracks: ['uk',  'us',  'ib',  'au'], grade: 'g7a', unit, icon: 'sun', minutes: 10,
    title: ['Revolution and the seasons', '地球的公转与四季'],
    blurb: ['A year around the Sun on a tilted axis: the overhead Sun wanders between the tropics, and the seasons follow.', '地轴倾斜着绕太阳公转一年：太阳直射点在南北回归线之间来回移动，四季随之更替。'],
    keys: [
      ['The Earth revolves around the Sun from west to east (anticlockwise seen from above the North Pole), once a year: about 365 days 6 hours.', '地球绕太阳自西向东公转（从北极上空看呈逆时针方向），公转一周是一年，约 365 日 6 时。'],
      ['The axis is tilted, 66.5° to the plane of the orbit, and keeps pointing toward Polaris all year.', '地轴是倾斜的，与公转轨道面成 66.5° 夹角，而且北端始终指向北极星附近。'],
      ['So the overhead Sun moves between the tropics: equator about 21 Mar, Tropic of Cancer about 22 Jun, equator about 23 Sep, Tropic of Capricorn about 22 Dec.', '因此太阳直射点在南北回归线之间往返移动：春分（3 月 21 日前后）直射赤道，夏至（6 月 22 日前后）直射北回归线，秋分（9 月 23 日前后）回到赤道，冬至（12 月 22 日前后）直射南回归线。'],
      ['The noon Sun altitude and the length of day change through the year, giving the seasons; the two hemispheres have opposite seasons.', '正午太阳高度和昼夜长短随季节变化，形成四季；南北半球季节相反。'],
      ['Inside the polar circles there is polar day and polar night. Seasons come from the tilt, not from the distance to the Sun.', '极圈以内有极昼和极夜现象。四季是地轴倾斜造成的，而不是日地距离变化造成的。'],
    ],
    steps: [
      {
        title: ['A year around the Sun', '地球绕太阳公转'],
        astro: { kit: 'terms', names: 'key', clock: { from: bj(2025, 3, 20, 17), to: bj(2026, 3, 20, 17), rate: 14, unit: 'date' } },
        fig: orbitFig(false),
        task: ['Drag the date slider round a whole year and stop at each of the four labelled points: which way does the axis lean each time?', '拖动日期滑块走完一年，在四个标出的位置各停一下：每次地轴都朝哪边倾斜？'],
        body: ['The Earth travels round the Sun on a nearly circular orbit, on average about 150 million km from it, at about 30 km/s. It goes from west to east, the same direction as it spins: seen from above the North Pole, anticlockwise. One lap takes a year, about 365 days 6 hours; the spare quarter day is why every fourth year gets a 29 February. On the way it passes four turning points: the March equinox, the June solstice, the September equinox and the December solstice: the "two equinoxes and two solstices".',
          '地球沿着近似正圆的椭圆轨道绕太阳运动，叫作公转。日地平均距离约 1.5 亿千米，公转速度约 30 千米/秒。公转方向和自转一样是自西向东，从北极上空看呈逆时针方向。公转一周的时间是一年，约 365 日 6 时；每年多出的约 6 小时，四年凑成一天，所以每四年有一个 2 月 29 日（闰年）。一年中地球依次经过春分、夏至、秋分、冬至四个位置，合称“二分二至”。'],
      },
      {
        title: ['A tilted axis that keeps its direction', '倾斜的地轴，不变的指向'],
        astro: {
          kit: 'terms', view: 'tilt', clock: { from: bj(2025, 3, 20, 17), to: bj(2026, 3, 20, 17), rate: 12, unit: 'date', at: 0.25 },
          params: [
            { id: 'tilt', name: ['Axial tilt', '地轴倾角'], min: 0, max: 45, value: 23.44, step: 0.5, fmt: ['{v}°', '{v}°'], dp: 1 },
            { id: 'lat', name: ['Your latitude', '观察者纬度'], min: 0, max: 66, value: 40, step: 1, fmt: ['{v}°N', '北纬 {v}°'] },
          ],
          tasks: [
            { text: ['Set the tilt to 0°: the Sun stays over the equator all year, and the seasons vanish.', '把倾角调到 0°：太阳终年直射赤道，四季消失了。'], done: p => p.tilt <= 0.5 },
            { text: ['Give the Earth a 30° tilt: where do the tropics and the polar circles move to?', '把倾角调到 30°：回归线和极圈移到了哪里？'], done: p => Math.abs(p.tilt - 30) <= 0.75 },
            { text: ['Put the observer at Guangzhou (23°N) with today\'s tilt.', '保持现在的倾角，把观察者移到广州（北纬 23°）。'], done: p => Math.abs(p.lat - 23) <= 0.5 && Math.abs(p.tilt - 23.5) <= 0.75 },
          ],
        },
        body: ['The Earth\'s axis is not upright to its orbit: it leans 23.5° (23°26′), so the axis and the plane of the orbit meet at 66.5°. As the Earth goes round, the axis keeps pointing the same way in space, its north end toward Polaris. So in June the Northern Hemisphere leans toward the Sun and in December away from it. The tilt sets the lines on the globe: the tropics lie at 23.5° and the polar circles at 90° − 23.5° = 66.5°.',
          '地轴并不垂直于公转轨道面，而是倾斜的：地轴与公转轨道面的夹角是 66.5°（赤道面与轨道面的夹角是 23.5°，即 23°26′）。公转时地轴的空间指向保持不变，北端始终指向北极星附近。所以 6 月北半球倾向太阳，12 月北半球背向太阳。这个倾角决定了地球上的几条重要纬线：回归线在 23.5°，极圈在 90° − 23.5° = 66.5°。'],
      },
      {
        title: ['The overhead Sun moves', '太阳直射点的移动'], cam: [10, 120, 3.8], follow: 0, night: true, sun: true,
        clock: { mode: 'year', start: T.marchNoonChina, rate: 30 },
        lines: [...TROPICS, par(0, C.gold, 0.6, { dur: 1.4 })],
        marks: [mk([23.44, 150], 'Tropic of Cancer 23.5°N', '北回归线 23.5°N', { c: C.orange, t: 0.5 }), mk([-23.44, 150], 'Tropic of Capricorn 23.5°S', '南回归线 23.5°S', { c: C.orange, t: 0.8 }), mk([0, 150], 'Equator', '赤道', { c: C.gold, t: 1.1 })],
        task: ['Watch the Sun marker and the date: in which month does it reach the northern orange line, and in which the southern one?', '盯住太阳标记和日期：它在几月到达北边的橙色线，几月到达南边的橙色线？'],
        body: ['Because the tilted axis keeps its direction, the latitude where the noon Sun is straight overhead (the subsolar point) changes through the year. From the March equinox it moves north, reaches the Tropic of Cancer at the June solstice, turns back past the equator at the September equinox, reaches the Tropic of Capricorn at the December solstice and returns. It never goes beyond the tropics, and it covers 47° of latitude each way in half a year, about a quarter of a degree a day. "Tropic" means "turning", and the Chinese name, "return line", says the same.',
          '由于地轴倾斜且指向不变，正午太阳直射的纬度（太阳直射点）随季节变化。春分后直射点向北移动，夏至到达北回归线；然后向南移，秋分回到赤道，冬至到达南回归线，此后再向北移。直射点始终在南北回归线之间往返，不会越过回归线；半年移动 47 个纬度，平均每天约 0.25°。“回归线”的名字就来自直射点到这里便折返。'],
      },
      {
        title: ['The June solstice', '夏至日'], cam: [18, 0, 3.8], follow: 75, night: true, sun: true,
        clock: { mode: 'day', start: Date.UTC(2025, 5, 21, 6), rate: 1.5, span: 24 },
        lines: [par(23.44, C.orange, 0, { dur: 1.4 }), par(66.56, C.ice, 0.3, { dur: 1.4 }), par(-66.56, C.ice, 0.6, { dur: 1.4 })],
        marks: [mk(BEIJING, 'Beijing: day ≈ 15 h', '北京：昼长约 15 小时', { dot: true, c: C.gold, t: 0.6 }), mk([45.75, 126.65], 'Harbin ≈ 15.6 h', '哈尔滨约 15.6 小时', { dot: true, c: C.gold, t: 0.9 }), mk([23.13, 113.26], 'Guangzhou ≈ 13.5 h', '广州约 13.5 小时', { dot: true, c: C.gold, t: 1.2 }), mk([72, 130], 'Polar day', '极昼', { big: true, c: C.ice, t: 1.5 })],
        task: ['Let the day run: does the area inside the Arctic Circle ever go into the night? Watch Beijing\'s night: how short is it?', '让时间走一整天：北极圈以内有没有转进黑夜？再看北京的黑夜有多短。'],
        body: ['About 22 June (21 June in 2025) the Sun is overhead at the Tropic of Cancer, 23.5°N. The Northern Hemisphere leans toward the Sun, so the day–night line no longer runs through the poles: everywhere north of the equator has days longer than nights, and the further north the longer, about 13.5 hours in Guangzhou, 15 in Beijing and 15.6 in Harbin. Inside the Arctic Circle the Sun never sets: polar day. It is the north\'s longest day and highest noon Sun; the Antarctic sits in polar night.',
          '6 月 22 日前后（2025 年是 6 月 21 日）是夏至日，太阳直射北回归线（23.5°N）。北半球倾向太阳，晨昏线不再通过两极：北半球各地昼长夜短，纬度越高白昼越长，广州约 13.5 小时，北京约 15 小时，哈尔滨约 15.6 小时。北极圈以内太阳整天不落，出现极昼。这一天北半球白昼最长、正午太阳高度达到一年中的最大值；南极圈以内则是极夜。'],
      },
      {
        title: ['The equinoxes', '春分日和秋分日'], cam: [0, 0, 3.8], follow: 75, night: true, sun: true,
        clock: { mode: 'day', start: Date.UTC(2025, 2, 20, 6), rate: 1.5, span: 24 },
        lines: [par(0, C.gold, 0, { dur: 1.4 }), par(66.56, C.ice, 0.3, { dur: 1.4 }), par(-66.56, C.ice, 0.6, { dur: 1.4 })],
        marks: [mk(BEIJING, 'Beijing: 12 h', '北京：昼长 12 小时', { dot: true, c: C.gold, t: 0.6 }), mk([1.35, 103.82], 'Singapore: 12 h', '新加坡：12 小时', { dot: true, c: C.gold, t: 0.9 }), mk([0, 145], 'Sun overhead at the equator', '太阳直射赤道', { c: C.gold, t: 1.2 })],
        task: ['Follow the edge of the dark side up to the North Pole and down to the South Pole: where does it cross them?', '沿着昼夜分界线向上、向下追到两极：它从哪里经过？'],
        body: ['About 21 March (the spring equinox) and 23 September (the autumn equinox) the Sun is overhead at the equator. Neither hemisphere leans toward the Sun, so the day–night line runs through both poles and cuts every parallel in half. Day and night are both 12 hours everywhere, in Beijing, Singapore or Sydney. At the poles the Sun skims round the horizon: the North Pole\'s six-month day begins at the March equinox and ends at the September one.',
          '3 月 21 日前后（春分）和 9 月 23 日前后（秋分），太阳直射赤道。这时南北半球都不偏向太阳，晨昏线通过两极，把每条纬线都平分成两半，全球各地昼夜等长，都是 12 小时：北京、新加坡、悉尼都一样。在两极，太阳贴着地平线转一圈：北极点半年的白昼从春分开始，到秋分结束。'],
      },
      {
        title: ['The December solstice', '冬至日'], cam: [18, 0, 3.8], follow: 75, night: true, sun: true,
        clock: { mode: 'day', start: Date.UTC(2025, 11, 21, 6), rate: 1.5, span: 24 },
        lines: [par(-23.44, C.orange, 0, { dur: 1.4 }), par(66.56, C.ice, 0.3, { dur: 1.4 }), par(-66.56, C.ice, 0.6, { dur: 1.4 })],
        marks: [mk(BEIJING, 'Beijing: day ≈ 9 h 20 min', '北京：昼长约 9 小时 20 分', { dot: true, c: C.gold, t: 0.6 }), mk([45.75, 126.65], 'Harbin ≈ 8.6 h', '哈尔滨约 8.6 小时', { dot: true, c: C.gold, t: 0.9 }), mk([75, 130], 'Polar night', '极夜', { big: true, c: C.ice, t: 1.2 }), mk([-23.44, 125], 'Sun over 23.5°S', '太阳直射南回归线', { c: C.orange, t: 1.5 })],
        task: ['Let the day run: does the Arctic ever turn to the Sun? How long does Beijing stay in daylight?', '让时间走一整天：北极圈以内有没有转到白天？北京的白昼有多长？'],
        body: ['About 22 December (21 December in 2025) the Sun is overhead at the Tropic of Capricorn, 23.5°S. Now the Northern Hemisphere leans away: its days are the shortest of the year, about 9 h 20 min in Beijing and 8.6 h in Harbin, and the noon Sun is at its lowest. Inside the Arctic Circle the Sun does not rise at all: polar night. At the same moment Antarctica has polar day and the whole Southern Hemisphere has its longest days. In China this is Dongzhi, the day families eat dumplings or tangyuan.',
          '12 月 22 日前后（2025 年是 12 月 21 日）是冬至日，太阳直射南回归线（23.5°S）。北半球背向太阳，白昼是一年中最短的：北京约 9 小时 20 分，哈尔滨约 8.6 小时，正午太阳高度也降到最低。北极圈以内太阳整天不升起，出现极夜。与此同时，南极圈以内是极昼，整个南半球昼长夜短。冬至在我国是重要的节气，北方有吃饺子、南方有吃汤圆的习俗。'],
      },
      {
        title: ['Noon Sun and day length make the seasons', '正午太阳高度、昼长与四季'], sky: 'seasons',
        astro: { kit: 'rays', mode: 'noon', lat: 39.9, name: ['Beijing', '北京'], clock: { from: bj(2025, 3, 20, 17), to: bj(2026, 3, 20, 17), rate: 20, unit: 'date' } },
        fig: noonFig,
        task: ['Drag the date: when is Beijing\'s noon Sun highest, and when lowest? Compare with the figure.', '拖动日期：北京的正午太阳什么时候最高，什么时候最低？和图对照一下。'],
        body: ['Two things change together. The noon Sun\'s height: in Beijing about 73.5° at the June solstice, 50° at the equinoxes and only 26.6° at the December solstice. And the length of day: about 15 hours in June against 9 h 20 min in December. A high Sun concentrates its light on the ground and a long day lets it heat for longer, so June to August is hot and December to February cold. Meteorologists in the Northern Hemisphere count March–May as spring, June–August summer, September–November autumn and December–February winter.',
          '一年中两件事同时在变：一是正午太阳高度，北京夏至约 73.5°，春分、秋分约 50°，冬至只有 26.6°；二是昼夜长短，北京夏至白昼约 15 小时，冬至只有约 9 小时 20 分。太阳高，阳光集中，单位面积得到的热量多；白昼长，受热时间也长。所以夏季炎热，冬季寒冷，形成四季。气象上，北半球通常把 3—5 月划为春季，6—8 月为夏季，9—11 月为秋季，12 月至次年 2 月为冬季。'],
      },
      {
        title: ['Opposite seasons, and a myth', '南北半球季节相反，一个常见误解'], cam: [0, 135, 4.4], wide: true, night: true, sun: true,
        clock: { mode: 'year', start: Date.UTC(2025, 0, 4, 4), rate: 20 },
        paint: [{ fill: { k: 'temp' }, a: 0.5 }],
        lines: [par(0, C.gold, 0.4, { dur: 1.4 })],
        marks: [mk(BEIJING, 'Beijing: winter in January', '北京：1 月是冬季', { dot: true, c: C.blue, t: 0.6 }), mk([-33.87, 151.21], 'Sydney: summer in January', '悉尼：1 月是夏季', { dot: true, c: C.red, t: 1 })],
        fig: { k: 'climo', city: 'beijing', b: 'sydney' },
        task: ['Start in early January, when the Earth is closest to the Sun: which hemisphere is warm, and which is cold? Then let the year run.', '从 1 月初、地球离太阳最近的时候开始：哪个半球暖，哪个半球冷？再让一年走下去。'],
        body: ['When the Northern Hemisphere has summer, the Southern Hemisphere has winter: Sydney\'s warmest month is January (about 23 °C) and its coldest July, the mirror of Beijing, so Australians have Christmas at the beach. Many people think summer comes when the Earth is closest to the Sun. In fact the Earth is nearest, about 147.1 million km, in early January (perihelion) and furthest, about 152.1 million km, in early July (aphelion). The difference is only about 3%; the seasons come from the tilt, which is why the hemispheres have them at opposite times.',
          '北半球是夏季时，南半球是冬季。悉尼最热的月份是 1 月（约 23 ℃），最冷的是 7 月，和北京正好相反，所以澳大利亚人在海滩上过圣诞节。很多人以为地球离太阳近时是夏季。其实地球在 1 月初离太阳最近（近日点，约 1.471 亿千米），7 月初最远（远日点，约 1.521 亿千米），二者只差约 3%。四季是由地轴倾斜造成的，正因为如此，南北半球的季节才会相反。'],
      },
    ],
    quiz: [
      { q: ['Seen from above the North Pole, the Earth goes round the Sun…', '从北极上空看，地球绕太阳公转的方向是'], options: [['Anticlockwise (west to east)', '逆时针（自西向东）'], ['Clockwise (east to west)', '顺时针（自东向西）'], ['North to south', '自北向南'], ['It changes with the seasons', '随季节改变']], answer: 0,
        why: ['Revolution goes west to east, the same way as rotation: anticlockwise above the North Pole, clockwise above the South Pole.', '地球公转和自转方向相同，都是自西向东：从北极上空看呈逆时针方向，从南极上空看呈顺时针方向。'] },
      { q: ['In this diagram the axis leans the same way all year. At which position is the Sun overhead at the Tropic of Cancer?', '图中地轴的倾斜方向一年中不变。地球在哪个位置时，太阳直射北回归线？'], fig: orbitFig(true),
        options: [['B', 'B'], ['A', 'A'], ['C', 'C'], ['D', 'D']], answer: 0,
        why: ['At B the north end of the axis leans toward the Sun, so the Northern Hemisphere gets the overhead Sun: the June solstice. At D it leans away (December solstice); at A and C it leans sideways (the equinoxes).', '在 B 处地轴北端倾向太阳，太阳直射北半球的北回归线，是夏至；D 处北端背向太阳，是冬至；A、C 两处地轴侧向太阳，是春分和秋分。'] },
      { q: ['At about 40°N, what is the noon Sun altitude on the December solstice? (Noon altitude = 90° − the latitude difference between the place and the overhead Sun at 23.5°S.)', '北纬 40° 的地方，冬至日正午太阳高度约是多少度？（正午太阳高度 = 90° − 当地与太阳直射点（23.5°S）的纬度差）'], num: { answer: 26.5, tol: 0.6, unit: ['°', '°'] },
        why: ['The latitude difference is 40° + 23.5° = 63.5°, so the noon Sun is 90° − 63.5° = 26.5° high. In June it is 90° − (40° − 23.5°) = 73.5°.', '纬度差是 40° + 23.5° = 63.5°，正午太阳高度为 90° − 63.5° = 26.5°。夏至日则是 90° − (40° − 23.5°) = 73.5°。'] },
      { q: ['Starting at the spring equinox, put the overhead Sun\'s positions through the year in order.', '从春分开始，把一年中太阳直射点的位置按先后排序。'],
        order: [['Equator (spring equinox)', '赤道（春分）'], ['Tropic of Cancer (summer solstice)', '北回归线（夏至）'], ['Equator (autumn equinox)', '赤道（秋分）'], ['Tropic of Capricorn (winter solstice)', '南回归线（冬至）']],
        why: ['From the spring equinox the overhead Sun moves north to the Tropic of Cancer (summer solstice), back to the equator (autumn equinox), south to the Tropic of Capricorn (winter solstice), and back again.', '春分后太阳直射点向北移，夏至到达北回归线；然后南移，秋分回到赤道；冬至到达南回归线，之后再北移。'] },
      { q: ['Match each day to what happens on it in the Northern Hemisphere.', '把节气和这一天北半球出现的现象连起来。'],
        match: [[['Summer solstice', '夏至'], ['Polar day inside the Arctic Circle', '北极圈以内出现极昼']], [['Winter solstice', '冬至'], ['Polar night inside the Arctic Circle', '北极圈以内出现极夜']], [['Spring and autumn equinoxes', '春分和秋分'], ['Day and night are equal everywhere', '全球昼夜等长']]],
        why: ['At the June solstice the Sun is over the Tropic of Cancer and the Arctic is lit all day; in December it is dark all day; at the equinoxes the Sun is over the equator and day equals night everywhere.', '夏至太阳直射北回归线，北极圈以内整天被照亮；冬至北极圈以内整天黑暗；春分、秋分太阳直射赤道，全球昼夜等长。'] },
      { q: ['Which of these are true on 22 June? Pick all that apply.', '6 月 22 日前后，下列说法正确的有（多选）'],
        options: [['Beijing has its longest day of the year', '北京白昼是一年中最长的'], ['Harbin\'s day is longer than Guangzhou\'s', '哈尔滨的白昼比广州长'], ['It is winter in Sydney', '悉尼正值冬季'], ['The Sun is overhead at the equator', '太阳直射赤道'], ['There is polar night inside the Arctic Circle', '北极圈以内出现极夜']], multi: [0, 1, 2],
        why: ['On the June solstice the Sun is over the Tropic of Cancer: northern days are longest, longer the further north (Harbin > Guangzhou), and the Arctic has polar day, not night. Sydney, in the south, is in winter.', '夏至日太阳直射北回归线：北半球白昼最长，而且纬度越高白昼越长（哈尔滨长于广州），北极圈以内是极昼而不是极夜。悉尼在南半球，正值冬季。'] },
      { q: ['The Tropic of Cancer passes just north of this city. Find Guangzhou.', '北回归线从广州北郊经过。在地球上点出广州。'], at: [23.13, 113.26], tolKm: 400,
        why: ['Guangzhou is at about 23.1°N, 113.3°E; a Tropic of Cancer marker stands in its Conghua district. The Sun is overhead there only once a year, at the June solstice.', '广州约在北纬 23.1°、东经 113.3°，北回归线标志塔就建在广州从化。这里一年中只在夏至日有一次太阳直射。'] },
      { q: ['The Earth is closest to the Sun in early January. Why is it still winter in Beijing then?', '地球在 1 月初离太阳最近。为什么这时北京却是冬季？'],
        options: [['The overhead Sun is in the south: Beijing has a low noon Sun and short days', '太阳直射南半球，北京正午太阳高度低、白昼短'], ['The Sun gives out less heat in January', '1 月太阳放出的热量少'], ['Being closer to the Sun makes the Earth colder', '离太阳近反而使地球变冷'], ['The Earth spins more slowly in winter', '冬季地球自转变慢']], answer: 0,
        why: ['The 3% change in distance matters little. What counts is the tilt: in January the Northern Hemisphere leans away from the Sun, so its sunlight is slanting and its days are short. That is also why Sydney has summer at the same moment.', '日地距离只差约 3%，影响很小。关键是地轴倾斜：1 月北半球背向太阳，阳光斜射、白昼短，所以寒冷。也正因为如此，同一时间南半球的悉尼是夏季。'] },
    ],
  },
  {
    id: 'zones', strand: 'maps', tracks: ['us',  'ib'], grade: 'g7a', unit, icon: 'sun', minutes: 9,
    title: ['The five heat zones', '五带的划分'],
    blurb: ['The tropics and polar circles cut the Earth into five zones by how much sunshine they get.', '回归线和极圈把地球分成五个热量带。'],
    keys: [
      ['The tropics (23.5°) and the polar circles (66.5°) divide the Earth into five heat zones: Torrid, two Temperate and two Frigid.', '回归线（23.5°）和极圈（66.5°）把地球表面划分为五带：热带、北温带、南温带、北寒带、南寒带。'],
      ['The zones are defined by sunlight: overhead Sun in the Torrid Zone, polar day and night in the Frigid Zones, neither in the Temperate Zones.', '五带是按太阳照射情况划分的：热带有太阳直射，寒带有极昼极夜，温带两者都没有。'],
      ['The higher the latitude, the lower the noon Sun and the less heat each square metre gets.', '纬度越高，正午太阳高度越低，单位面积获得的太阳热量越少。'],
      ['The Torrid Zone covers about 40% of the Earth, the Temperate Zones 52%, the Frigid Zones 8%.', '热带约占地球表面积的 40%，两个温带共占 52%，两个寒带共占 8%。'],
      ['Most of China is in the North Temperate Zone and a small part in the Torrid Zone; none of it is in a Frigid Zone.', '我国大部分地区位于北温带，小部分位于热带，没有寒带。'],
    ],
    steps: [
      {
        title: ['The Torrid Zone', '热带'], cam: [5, -60, 3.8], items: ['an_jaguar', 'pl_kapok'],
        lines: TROPICS, paint: [{ fill: { k: 'band', s: -23.44, n: 23.44, c: C.red }, t: 0.6, a: 0.42 }],
        marks: [mk([5, -60], 'Torrid Zone', '热带', { big: true, c: C.red, t: 1 }), mk([23.44, -40], 'Tropic of Cancer 23.5°N', '北回归线 23.5°N', { c: C.orange, t: 1.3 }), mk([-23.44, -30], 'Tropic of Capricorn 23.5°S', '南回归线 23.5°S', { c: C.orange, t: 1.5 })],
        task: ['Turn the globe along the red band: which continents does the Torrid Zone cross?', '沿着红色带转动地球：热带经过了哪些大洲？'],
        body: ['The Torrid Zone lies between the Tropic of Cancer (23.5°N) and the Tropic of Capricorn (23.5°S), a band 47° of latitude wide. It is the only place where the noon Sun can be straight overhead: twice a year between the tropics, once a year on them. The Sun is high and days stay near 12 hours, so it is hot all year with no real winter. It crosses the Amazon, where the jaguar and the giant kapok tree live, the Congo basin and Southeast Asia.',
          '热带位于北回归线（23.5°N）和南回归线（23.5°S）之间，跨 47 个纬度。只有在热带才会出现太阳直射：回归线之间的地方一年有两次直射，回归线上一年一次。这里正午太阳高度大，昼夜长短变化小，终年炎热，没有真正的冬季。热带经过南美洲的亚马孙平原（美洲豹和高大的木棉树就生活在这里）、非洲的刚果盆地和东南亚。'],
      },
      {
        title: ['The Temperate Zones', '温带'], cam: [40, 105, 3.6], items: ['an_panda'],
        lines: [...TROPICS, ...CIRCLES],
        paint: [{ fill: { k: 'band', s: 23.44, n: 66.56, c: C.green }, t: 0.6, a: 0.4 }, { fill: { k: 'band', s: -66.56, n: -23.44, c: C.green }, t: 0.9, a: 0.4 }],
        marks: [mk([50, 95], 'North Temperate Zone', '北温带', { big: true, c: C.green, t: 1 }), mk(BEIJING, 'Beijing 39.9°N', '北京 39.9°N', { dot: true, c: C.gold, t: 1.3 }), mk([51.5, -0.13], 'London 51.5°N', '伦敦 51.5°N', { dot: true, c: C.gold, t: 1.6 })],
        task: ['Find the southern green band too: which continents does the South Temperate Zone touch?', '再找到南边的绿色带：南温带经过哪些大洲？'],
        body: ['Between each tropic and polar circle (23.5° to 66.5°) lie the North and South Temperate Zones, each 43° wide. Here the Sun is never directly overhead and never stays up or down for a whole day. But the noon Sun and the length of day change a lot through the year, so there are four clear seasons: Beijing\'s noon Sun swings from 73.5° to 26.6°. Most of China, Europe and the United States lie in the North Temperate Zone; Sydney, Buenos Aires and Cape Town lie in the South Temperate Zone.',
          '回归线和极圈之间（23.5°—66.5°）是北温带和南温带，各跨 43 个纬度。这里既没有太阳直射，也没有极昼极夜；但正午太阳高度和昼夜长短一年中变化很大，所以四季分明，北京的正午太阳高度在 73.5° 和 26.6° 之间变化。我国大部分地区、欧洲和美国大部分地区都在北温带；悉尼、布宜诺斯艾利斯、开普敦在南温带。'],
      },
      {
        title: ['The Frigid Zones', '寒带'], cam: [74, -20, 3.8], items: ['an_polarbear', 'ca_santa', 'an_walrus'],
        lines: CIRCLES,
        paint: [{ fill: { k: 'band', s: 66.56, n: 90, c: C.ice }, t: 0.6, a: 0.5 }, { fill: { k: 'band', s: -90, n: -66.56, c: C.ice }, t: 0.9, a: 0.5 }],
        marks: [mk([80, -40], 'North Frigid Zone', '北寒带', { big: true, c: C.ice, t: 1 }), mk([66.54, 25.85], 'Rovaniemi: on the Arctic Circle', '罗瓦涅米：位于北极圈上', { dot: true, c: C.gold, t: 1.3 })],
        task: ['Turn the globe over the North Pole: which countries reach inside the Arctic Circle?', '绕着北极转动地球：哪些国家有领土伸进北极圈？'],
        body: ['Inside the polar circles (66.5° to the poles) lie the North and South Frigid Zones, each 23.5° wide. Here the Sun is always low, and on at least one day a year it does not set (polar day) or does not rise (polar night); at the poles each lasts about six months. They are cold all year: polar bears and walruses hunt on Arctic sea ice, and emperor penguins breed on Antarctica. Rovaniemi in Finland sits right on the Arctic Circle; China\'s Zhongshan Station (69.4°S) lies inside the South Frigid Zone.',
          '极圈以内（66.5° 到极点）是北寒带和南寒带，各跨 23.5 个纬度。这里太阳高度终年很低，一年中至少有一天太阳不落（极昼）或不升（极夜），在极点上极昼、极夜各持续约半年。寒带终年寒冷：北极熊和海象在北冰洋的海冰上捕食，帝企鹅在南极洲繁殖。芬兰的罗瓦涅米正好位于北极圈上；我国南极中山站（69.4°S）就在南寒带内。'],
      },
      {
        title: ['Why sunshine differs', '热量差异从哪里来'], cam: [35, 105, 3.6],
        lines: [...TROPICS, par(66.56, C.ice, 0.6, { dur: 1.6 }), { pts: [[1.35, 103.82], [23.13, 113.26], [39.9, 116.4], [62.03, 129.73], [71.64, 128.87]], c: C.gold, t: 0.4, dur: 2 }],
        paint: ZONES_PAINT.slice(0, 2).concat(ZONES_PAINT[3]),
        marks: [mk([1.35, 103.82], 'Singapore 1°N: 89°', '新加坡 1°N：89°', { dot: true, c: C.red, t: 0.6 }), mk([23.13, 113.26], 'Guangzhou 23°N: 67°', '广州 23°N：67°', { dot: true, c: C.orange, t: 0.9 }), mk(BEIJING, 'Beijing 40°N: 50°', '北京 40°N：50°', { dot: true, c: C.gold, t: 1.2 }), mk([62.03, 129.73], 'Yakutsk 62°N: 28°', '雅库茨克 62°N：28°', { dot: true, c: C.green, t: 1.5 }), mk([71.64, 128.87], 'Tiksi 72°N: 18°', '提克西 72°N：18°', { dot: true, c: C.ice, t: 1.8 })],
        fig: beamFig,
        body: ['The labels give the noon Sun altitude at an equinox, when it is simply 90° minus the latitude: 89° in Singapore but only 18° in Tiksi on the Arctic coast. A beam of sunlight that hits the ground head-on lights a small patch; the same beam arriving at a slant is spread over a much bigger area, so each square metre gets less heat. At 60° the same light covers twice the ground it covers at the equator. Slanting rays also pass through more air. That is why it gets colder from the equator toward the poles.',
          '标注的是春分、秋分日的正午太阳高度，这时它等于 90° 减去当地纬度：新加坡约 89°，北冰洋岸边的提克西只有约 18°。同样一束阳光，直射时照射的面积小；斜射时铺开在更大的面积上，单位面积获得的热量就少。在纬度 60° 处，同样多的阳光照射的面积是赤道的 2 倍。斜射的阳光穿过的大气也更厚。所以从赤道向两极，气温逐渐降低。'],
      },
      {
        title: ['China and the five zones', '我国与五带'], cam: [28, 112, 3.2],
        lines: [par(23.44, C.orange, 0, { dur: 1.6 })],
        paint: [
          { fill: { k: 'poly', pts: [[23.44, 73], [23.44, 136], [54, 136], [54, 73]], c: C.green, clip: ['CN', 'TW'] }, t: 0.3, a: 0.5 },
          { fill: { k: 'poly', pts: [[3, 97], [3, 125], [23.44, 125], [23.44, 97]], c: C.red, clip: ['CN', 'TW'] }, t: 0.6, a: 0.6 },
        ],
        items: ['sp_wenchang'],
        marks: [
          mk([23.43, 101.68], 'Mojiang, Yunnan', '云南墨江', { dot: true, c: C.orange, t: 0.8 }), mk([23.55, 113.58], 'Conghua, Guangzhou', '广州从化', { dot: true, c: C.orange, t: 1.0 }),
          mk([23.46, 120.29], 'Chiayi, Taiwan', '台湾嘉义', { dot: true, c: C.orange, t: 1.2 }), mk([18.25, 109.5], 'Sanya: Torrid Zone', '三亚：热带', { dot: true, c: C.red, t: 1.4 }),
          mk([52.97, 122.54], 'Mohe 53°N: still temperate', '漠河 53°N：仍是温带', { dot: true, c: C.green, t: 1.6 }),
        ],
        task: ['Follow the orange Tropic of Cancer across southern China: which provinces does it pass through?', '沿着橙色的北回归线横穿我国南部：它经过了哪些省级行政区？'],
        body: ['The Tropic of Cancer crosses southern China through Yunnan, Guangxi, Guangdong and Taiwan; marker towers stand at Mojiang, Conghua near Guangzhou, Shantou and Chiayi. South of it lie Hainan, the Leizhou Peninsula, southern Yunnan and Taiwan and the South China Sea islands: China\'s small share of the Torrid Zone, where the Wenchang launch site and the beaches of Sanya are. Everything north of the line, most of China, is in the North Temperate Zone. Even Mohe, the most northerly town at about 53.5°N, is 13° short of the Arctic Circle, so China has no Frigid Zone.',
          '北回归线自西向东穿过我国云南、广西、广东和台湾，墨江、广州从化、汕头、嘉义等地都建有北回归线标志塔。线以南的海南岛、雷州半岛、云南南部、台湾南部和南海诸岛属于热带，文昌航天发射场和三亚的海滩都在这里。线以北，也就是我国的大部分地区，属于北温带。即使是最北的漠河（约 53.5°N），离北极圈也还差 13 个纬度，所以我国没有寒带。'],
      },
      {
        title: ['Zones of sunlight, not of weather', '五带是热量带，不等于气候'], cam: [0, 37, 3.6], items: ['kilimanjaro'],
        lines: TROPICS,
        paint: [{ fill: { k: 'band', s: -23.44, n: 23.44, c: C.red }, a: 0.3 }],
        marks: [mk([-3.07, 37.36], 'Kilimanjaro 5,895 m: glaciers', '乞力马扎罗山 5895 米：山顶有冰川', { dot: true, c: C.ice, t: 0.6 }), { ll: [-1.29, 36.82], dot: true, c: C.gold, t: 1 }, mk([1.6, 36.82], 'Nairobi 1,795 m: mild all year', '内罗毕（海拔 1795 米）：四季如春', { c: C.gold, t: 1 })],
        fig: { k: 'climo', city: 'singapore', b: 'utqiagvik' },
        task: ['Turn and zoom to Kilimanjaro, just south of the equator: why can it carry ice?', '转动并放大到赤道以南的乞力马扎罗山：为什么这里会有冰雪？'],
        body: ['The five zones sort places only by sunlight. The climographs show the extremes: Singapore (1°N) stays near 27 °C all year, while Utqiaġvik in Alaska (71°N) averages below −25 °C in February. But height, the sea and the winds change the picture. Kilimanjaro stands only 3° south of the equator, yet air cools about 0.6 °C every 100 m up, so its 5,895 m summit holds glaciers; Nairobi, at 1,795 m, is mild all year. The heat zones are the starting point for the climate types learned later.',
          '五带只是按照太阳照射情况划分的热量带。从两幅气候图看，新加坡（1°N）终年约 27 ℃，阿拉斯加的乌特恰维克（71°N）2 月平均气温低于 −25 ℃。但海拔、海陆和风也会改变一个地方的冷暖。乞力马扎罗山位于赤道以南仅 3°，可是海拔每升高 100 米，气温约下降 0.6 ℃，所以 5895 米高的山顶终年有冰川；海拔 1795 米的内罗毕四季如春。五带是以后学习气候类型的基础。'],
      },
      {
        title: ['All five, through the year', '五带与太阳直射点'], cam: [15, 100, 4.6], night: true, sun: true,
        clock: { mode: 'year', start: T.marchNoonChina, rate: 30 },
        lines: [...TROPICS, ...CIRCLES],
        paint: ZONES_PAINT,
        fig: areaFig,
        task: ['Watch the overhead Sun for a whole year: does it ever leave the red Torrid Zone? When is the Arctic all lit?', '观察太阳直射点一整年：它有没有离开过红色的热带？北寒带什么时候整天都被照亮？'],
        body: ['Put together, the boundaries come straight from the 23.5° tilt: the tropics mark how far the overhead Sun travels, the polar circles how far polar day and night reach. Watch the Sun marker stay inside the red band all year. Because the Earth is a sphere, the bands are not equal in area: the Torrid Zone covers about 40% of the surface, the two Temperate Zones 52% and the two Frigid Zones only about 8%. If the tilt were bigger, the tropics would move poleward and the polar circles toward the equator.',
          '合起来看，五带的界线都来自地轴 23.5° 的倾斜：回归线是太阳直射点移动的南北界限，极圈是出现极昼极夜的界限。看，太阳直射点一年到头都在红色的热带里移动。由于地球是球体，五带的面积并不相等：热带约占地球表面积的 40%，两个温带共占 52%，两个寒带只占约 8%。如果地轴倾角变大，回归线会向两极移动，极圈会向赤道移动。'],
      },
    ],
    quiz: [
      { q: ['The five zones are divided by…', '五带的分界线是'], options: [['The tropics and polar circles', '南北回归线和南北极圈'], ['The equator and prime meridian', '赤道和本初子午线'], ['The 0 °C and 20 °C isotherms', '0 ℃ 和 20 ℃ 等温线'], ['Coastlines and mountain ranges', '海岸线和山脉']], answer: 0,
        why: ['The tropics (23.5°) and polar circles (66.5°). The zones follow sunlight, so their boundaries are parallels, not temperature lines or coasts.', '五带的界线是南北回归线（23.5°）和南北极圈（66.5°）。五带按太阳照射划分，所以界线是纬线，而不是等温线或海岸线。'] },
      { q: ['Which of these cities are in the Torrid Zone? Pick all that apply.', '下列城市中，位于热带的有（多选）'],
        options: [['Singapore (1°N)', '新加坡（1°N）'], ['Haikou, Hainan (20°N)', '海南海口（20°N）'], ['Nairobi (1°S)', '内罗毕（1°S）'], ['Beijing (40°N)', '北京（40°N）'], ['Sydney (34°S)', '悉尼（34°S）']], multi: [0, 1, 2],
        why: ['The Torrid Zone lies between 23.5°N and 23.5°S. Beijing is in the North Temperate Zone and Sydney in the South Temperate Zone.', '热带在南北回归线（23.5°N 和 23.5°S）之间。北京在北温带，悉尼在南温带。'] },
      { q: ['Match each heat zone to what makes it special.', '把五带和它的特点连起来。'],
        match: [[['Torrid Zone', '热带'], ['The Sun can be straight overhead', '有太阳直射现象']], [['Temperate Zones', '温带'], ['No overhead Sun, no polar day: four clear seasons', '既无直射也无极昼极夜，四季分明']], [['Frigid Zones', '寒带'], ['Polar day and polar night', '有极昼极夜现象']]],
        why: ['The zones are defined by sunshine: overhead Sun in the Torrid Zone, polar day and night in the Frigid Zones, neither in the Temperate Zones.', '五带按太阳照射情况划分：热带有太阳直射，寒带有极昼极夜，温带两者都没有。'] },
      { q: ['At an equinox, put these places in order from the highest noon Sun to the lowest.', '春分日，把这些地方按正午太阳高度从高到低排列。'],
        order: [['Singapore (1°N)', '新加坡（1°N）'], ['Guangzhou (23°N)', '广州（23°N）'], ['Beijing (40°N)', '北京（40°N）'], ['Tiksi (72°N)', '提克西（72°N）']],
        why: ['At an equinox the noon Sun is 90° minus the latitude: about 89°, 67°, 50° and 18°. The further from the overhead Sun, the lower and weaker it is.', '春分日正午太阳高度 = 90° − 当地纬度：约 89°、67°、50°、18°。离直射点越远，太阳高度越低，热量越少。'] },
      { q: ['Imagine the axis were tilted 30° instead of 23.5°. At what latitude would the Arctic Circle be?', '假如地轴倾角是 30° 而不是 23.5°，北极圈会在北纬多少度？'], num: { answer: 60, tol: 0.2, unit: ['°N', '°N'] },
        why: ['The polar circles lie at 90° minus the tilt: 90° − 30° = 60°. The tropics would move to 30°, so the Torrid and Frigid Zones would grow and the Temperate Zones shrink to 30° wide.', '极圈纬度 = 90° − 倾角 = 90° − 30° = 60°。回归线则会移到 30°，热带和寒带变宽，温带只剩 30 个纬度宽。'] },
      { q: ['Label the map: tap a place in each zone.', '在地图上标注：分别点出位于下列各带的地点。'],
        place: [{ text: ['Singapore: Torrid Zone', '新加坡：热带'], at: [1.35, 103.82], tolKm: 600 }, { text: ['Beijing: North Temperate Zone', '北京：北温带'], at: [39.9, 116.4], tolKm: 600 }, { text: ['Sydney: South Temperate Zone', '悉尼：南温带'], at: [-33.87, 151.21], tolKm: 600 }],
        why: ['Singapore (1°N) lies between the tropics, Beijing (40°N) between the Tropic of Cancer and the Arctic Circle, Sydney (34°S) between the Tropic of Capricorn and the Antarctic Circle.', '新加坡（1°N）在南北回归线之间；北京（40°N）在北回归线和北极圈之间；悉尼（34°S）在南回归线和南极圈之间。'] },
      { q: ['This climograph comes from a place in which heat zone?', '这幅气候图所示地点位于哪个温度带？'], fig: { k: 'climo', city: 'utqiagvik', blind: true },
        options: [['North Frigid Zone', '北寒带'], ['Torrid Zone', '热带'], ['North Temperate Zone', '北温带'], ['South Frigid Zone', '南寒带']], answer: 0,
        why: ['Months far below freezing, a short cool summer peaking in July: a polar place in the north (it is Utqiaġvik, Alaska, 71°N). In the South Frigid Zone the warmest month would be January.', '大部分月份气温远低于 0 ℃，夏季短而凉，7 月最暖：这是北半球的极地（阿拉斯加的乌特恰维克，71°N）。如果在南寒带，最暖月应在 1 月。'] },
      { q: ['Kilimanjaro is in the Torrid Zone, yet its summit has glaciers. Why?', '乞力马扎罗山位于热带，山顶却有冰川，原因是'],
        options: [['Its 5,895 m summit is so high that the air is cold', '山顶海拔 5895 米，气温很低'], ['It is inside a polar circle', '它位于极圈以内'], ['The Sun is never overhead there', '那里从没有太阳直射'], ['It has polar night', '那里有极夜']], answer: 0,
        why: ['Temperature drops about 0.6 °C for every 100 m of height, so the top is roughly 35 °C colder than the plains below. The heat zones describe sunlight; height can override them.', '海拔每升高 100 米气温约降低 0.6 ℃，山顶比山麓低约 35 ℃。五带反映的是太阳照射，海拔可以改变一个地方的冷暖。'] },
    ],
  },
];
