/**
 * Astronomy lessons, extra topics: the 24 solar terms, the gnomon and its shadow, ancient Chinese astronomy, how the
 * Solar System formed, telescopes and the electromagnetic spectrum, and a first night of stargazing.
 */
import { C, type Fig, type Lesson, type Pair } from '../kit.ts';
import { svg, tx, type Lx } from '../figs.ts';

const D2R = Math.PI / 180;
const DAY = 864e5;
/** UTC instant of a Beijing (UTC+8) local time */
const bj = (y: number, m: number, d: number, h: number) => Date.UTC(y, m - 1, d, h - 8);

/** The Sun's apparent ecliptic longitude (°) at a UTC instant (the same low-precision formula the kits use). */
function sunLon(ms: number): number {
  const d = (ms - Date.UTC(2000, 0, 1, 12)) / DAY, g = (357.528 + 0.9856003 * d) * D2R;
  return (((280.46 + 0.9856474 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) % 360) + 360) % 360;
}
/** The Sun's declination (°) at noon in China on day `d` of 2025, as the gnomon kit reads its `day` slider. */
const decOfDay = (d: number) => Math.asin(Math.sin(23.44 * D2R) * Math.sin(sunLon(Date.UTC(2025, 0, 1, 4) + (d - 1) * DAY) * D2R)) / D2R;

// ------------------------------------------------------------------------------------------------ figures

/** The 24 terms from 立春, in season columns. */
const TERM_NAMES: Pair[] = [
  ['Start of Spring', '立春'], ['Rain Water', '雨水'], ['Insects Awaken', '惊蛰'], ['Spring Equinox', '春分'], ['Clear and Bright', '清明'], ['Grain Rain', '谷雨'],
  ['Start of Summer', '立夏'], ['Grain Buds', '小满'], ['Grain in Ear', '芒种'], ['Summer Solstice', '夏至'], ['Minor Heat', '小暑'], ['Major Heat', '大暑'],
  ['Start of Autumn', '立秋'], ['End of Heat', '处暑'], ['White Dew', '白露'], ['Autumn Equinox', '秋分'], ['Cold Dew', '寒露'], ['Frost Descent', '霜降'],
  ['Start of Winter', '立冬'], ['Minor Snow', '小雪'], ['Major Snow', '大雪'], ['Winter Solstice', '冬至'], ['Minor Cold', '小寒'], ['Major Cold', '大寒'],
];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** The Beijing date on which the Sun reaches longitude `lon` in the year from 1 February 2025. */
function termDate(lon: number): [number, number] {
  let t = bj(2025, 2, 1, 0);
  for (let i = 0; i < 370; i++, t += DAY) {
    const a = sunLon(t), b = sunLon(t + DAY), crossed = ((lon - a + 360) % 360) < ((b - a + 360) % 360);
    if (crossed) { const d = new Date(t + 8 * 36e5); return [d.getUTCMonth(), d.getUTCDate()]; }
  }
  return [0, 1];
}
const termsFig: Fig = {
  k: 'svg', draw: (L: Lx) => {
    const cols: [Pair, string][] = [[['Spring', '春'], '#69db7c'], [['Summer', '夏'], '#ff8787'], [['Autumn', '秋'], '#ffc078'], [['Winter', '冬'], '#74c0fc']];
    let o = tx(4, 12, L(['The 24 solar terms in 2025–26 (Beijing dates)', '二十四节气（2025—2026 年，北京时间）']), 'fg-title');
    o += tx(4, 23, L(['each term: the Sun moves another 15° along the ecliptic', '太阳在黄道上每移动 15° 交一个节气']), 'fg-sub');
    cols.forEach(([n, c], ci) => {
      const x = 6 + ci * 81;
      o += `<rect x="${x}" y="30" width="77" height="15" rx="3" fill="${c}" opacity=".22"/>` + tx(x + 38.5, 41, L(n), 'fg-label', 'm');
      for (let r = 0; r < 6; r++) {
        const k = ci * 6 + r, lon = (315 + k * 15) % 360, [m, d] = termDate(lon), y = 58 + r * 21;
        const key = lon % 90 === 0;
        o += `<g class="f-fade" style="--d:${(0.1 + k * 0.04).toFixed(2)}s">`;
        o += tx(x + 2, y, L(TERM_NAMES[k]), 'fg-label', 's', key ? `fill="${C.gold}"` : '');
        o += tx(x + 2, y + 9, L([`${d} ${MON[m]} · ${lon}°`, `${m + 1}月${d}日 · ${lon}°`]), 'fg-tick') + '</g>';
      }
    });
    return svg(332, 182, o, L(['The 24 solar terms and their dates', '二十四节气及其日期']));
  },
};

/** A rod, the noon Sun's rays and the shadow: L = h / tan H. */
const shadowFig: Fig = {
  k: 'svg', draw: (L: Lx) => {
    const gx = 70, gy = 140, h = 70, H = 30, Ls = h / Math.tan(H * D2R);
    let o = tx(4, 12, L(['Shadow length from the Sun’s altitude', '由太阳高度求影长']), 'fg-title');
    o += `<line x1="20" y1="${gy}" x2="310" y2="${gy}" class="fg-ground" stroke="#8a9bb0" stroke-width="1"/>`;
    o += `<line x1="${gx}" y1="${gy}" x2="${gx}" y2="${gy - h}" stroke="${C.white}" stroke-width="3"/>`;
    o += `<line x1="${gx}" y1="${gy}" x2="${gx + Ls}" y2="${gy}" stroke="#56627a" stroke-width="5"/>`;
    for (const dx of [-36, 0, 36]) {
      const ax = gx - 50 + dx, ay = gy - h - 50 * Math.tan(H * D2R);
      o += `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${(gx + Ls + dx).toFixed(1)}" y2="${gy}" stroke="${C.gold}" stroke-width=".9" opacity="${dx ? 0.4 : 1}"/>`;
    }
    o += `<path d="M${gx + Ls - 34} ${gy} A34 34 0 0 1 ${(gx + Ls - 34 * Math.cos(H * D2R)).toFixed(1)} ${(gy - 34 * Math.sin(H * D2R)).toFixed(1)}" fill="none" stroke="${C.pink}" stroke-width="1.2"/>`;
    o += tx(gx + Ls - 46, gy - 6, 'H', 'fg-label', 'e', `fill="${C.pink}"`);
    o += tx(gx - 8, gy - h / 2, L(['rod h', '表高 h']), 'fg-label', 'e');
    o += tx(gx + Ls / 2, gy + 14, L(['shadow L = h / tan H', '影长 L = h / tan H']), 'fg-label', 'm');
    o += tx(310, 40, L(['H = 90° − |φ − δ| at noon', '正午 H = 90° − |φ − δ|']), 'fg-label', 'e', `fill="${C.gold}"`);
    o += tx(310, 54, L(['φ latitude, δ subsolar latitude', 'φ 当地纬度，δ 直射点纬度']), 'fg-tick', 'e');
    return svg(320, 160, o, L(['A rod, the Sun’s rays and the shadow', '表、太阳光线和影子']));
  },
};

/** The magnitude scale: smaller numbers are brighter; 5 magnitudes = ×100. */
const magFig: Fig = {
  k: 'svg', draw: (L: Lx) => {
    const x0 = 24, x1 = 308, M0 = -2, M1 = 7, X = (m: number) => x0 + ((m - M0) / (M1 - M0)) * (x1 - x0), y = 82;
    let o = tx(4, 12, L(['The magnitude scale', '星等']), 'fg-title');
    o += tx(4, 23, L(['smaller numbers are brighter: 1 magnitude = ×2.512, 5 magnitudes = ×100', '数值越小越亮：相差 1 等亮度差 2.512 倍，相差 5 等差 100 倍']), 'fg-sub');
    o += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#56627a" stroke-width="1"/>`;
    for (let m = M0; m <= M1; m++) o += `<line x1="${X(m)}" x2="${X(m)}" y1="${y - 3}" y2="${y + 3}" stroke="#56627a"/>` + tx(X(m), y + 14, String(m), 'fg-tick', 'm');
    const stars: [number, Pair, number][] = [[-1.46, ['Sirius', '天狼星'], -1], [0.03, ['Vega', '织女星'], 1], [1.98, ['Polaris', '北极星'], -1], [3.32, ['Megrez', '天权'], 1], [5.5, ['faint star', '暗星'], -1]];
    stars.forEach(([m, n, s], i) => {
      const r = Math.max(0.7, 7 * 2.512 ** (-(m + 1.5) / 2));
      o += `<g class="f-fade" style="--d:${(0.2 + i * 0.2).toFixed(1)}s"><circle cx="${X(m).toFixed(1)}" cy="${y}" r="${r.toFixed(1)}" fill="#fff6dc"/>` + tx(X(m), y + (s < 0 ? -14 : 28), `${L(n)} ${m}`, 'fg-label', 'm') + '</g>';
    });
    for (const [m, n, c] of [[3.5, ['city sky limit ≈ 3–4', '城市夜空极限约 3～4 等'], C.orange], [6.5, ['dark sky ≈ 6.5', '暗夜极限约 6.5 等'], C.teal]] as [number, Pair, string][]) {
      o += `<line x1="${X(m)}" x2="${X(m)}" y1="${y + 34}" y2="${y + 50}" stroke="${c}" stroke-dasharray="2 2"/>` + tx(m > 5 ? 318 : X(m) - 10, y + 60, L(n), 'fg-label', m > 5 ? 'e' : 'm', `fill="${c}"`);
    }
    o += `<line x1="${X(2)}" y1="${y - 40}" x2="${X(-1)}" y2="${y - 40}" stroke="${C.gold}"/>` + tx(X(2) + 4, y - 37, L(['brighter', '更亮']), 'fg-label', 's', `fill="${C.gold}"`);
    o += `<path d="M${X(-1) + 5} ${y - 44} L${X(-1)} ${y - 40} L${X(-1) + 5} ${y - 36}" fill="none" stroke="${C.gold}"/>`;
    return svg(320, 152, o, L(['The magnitude scale', '星等标度']));
  },
};

/** An armillary sphere (浑仪) next to Guo Shoujing's simplified instrument (简仪). */
const armillaryFig: Fig = {
  k: 'svg', draw: (L: Lx) => {
    let o = tx(4, 12, L(['Armillary sphere and abridged armilla', '浑仪与简仪']), 'fg-title');
    const ring = (cx: number, cy: number, rx: number, ry: number, rot: number, c: string) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="none" stroke="${c}" stroke-width="1.6"/>`;
    // 浑仪: nested rings round one centre
    const ax = 80, ay = 88;
    o += ring(ax, ay, 48, 48, 0, '#c9a46a') + ring(ax, ay, 48, 14, 0, '#c9a46a') + ring(ax, ay, 48, 16, -40, '#e0b872') + ring(ax, ay, 14, 48, -40, '#e0b872') + ring(ax, ay, 44, 12, -16, C.teal);
    o += `<line x1="${ax - 40}" y1="${ay + 33}" x2="${ax + 40}" y2="${ay - 33}" stroke="${C.gold}" stroke-width="2.4"/>`;
    o += `<path d="M${ax - 34} 150 L${ax} ${ay + 48} L${ax + 34} 150" fill="none" stroke="#8a7a5a" stroke-width="2"/>`;
    o += tx(ax, 164, L(['Armillary sphere (Han–Song)', '浑仪（汉—宋）']), 'fg-label', 'm');
    o += tx(ax + 44, ay - 40, L(['sighting tube', '窥管']), 'fg-tick');
    // 简仪: an equatorial ring on a polar axis, and a separate alt-azimuth ring
    const bx = 236, by = 92;
    o += `<line x1="${bx - 60}" y1="${by + 40}" x2="${bx + 40}" y2="${by - 46}" stroke="#8a7a5a" stroke-width="2.4"/>`;
    o += ring(bx - 6, by - 6, 34, 34, 0, '#e0b872') + ring(bx - 6, by - 6, 34, 10, -41, C.teal);
    o += `<line x1="${bx - 30}" y1="${by + 14}" x2="${bx + 18}" y2="${by - 26}" stroke="${C.gold}" stroke-width="2.4"/>`;
    o += ring(bx + 46, by + 44, 18, 6, 0, '#c9a46a') + `<line x1="${bx + 46}" y1="${by + 44}" x2="${bx + 46}" y2="${by + 18}" stroke="#c9a46a" stroke-width="1.6"/>`;
    o += `<line x1="${bx - 74}" y1="150" x2="${bx + 70}" y2="150" stroke="#8a7a5a" stroke-width="2"/>`;
    o += tx(bx, 164, L(['Abridged armilla (Guo Shoujing, 1276)', '简仪（郭守敬，1276 年）']), 'fg-label', 'm');
    o += tx(bx + 30, by - 50, L(['polar axis → celestial pole', '极轴指向天极']), 'fg-tick', 'm');
    o += tx(bx + 66, by + 30, L(['alt-azimuth ring', '立运仪']), 'fg-tick', 'm');
    return svg(320, 170, o, L(['An armillary sphere and the abridged armilla', '浑仪和简仪']));
  },
};

// ------------------------------------------------------------------------------------------------ lessons

const unitSun: Pair = ['Earth’s motions and the Sun', '地球运动和太阳'];
const unitSky: Pair = ['The night sky', '星空'];
const unitSolar: Pair = ['The Solar System', '太阳系'];
const unitTools: Pair = ['Observing the universe', '观测宇宙'];

export const A_EXTRA: Lesson[] = [
  {
    id: 'a-solar-terms', strand: 'earthsun', level: 'jr', tracks: ['uk', 'us', 'au', 'ib'], unit: unitSun, icon: 'calendar', minutes: 9,
    title: ['The 24 solar terms', '二十四节气'],
    blurb: ['China’s farming calendar cuts the Earth’s orbit into 24 equal steps, and the tilted axis turns them into seasons.', '把地球公转轨道等分成 24 段的农事历法，以及让节气变成季节的倾斜地轴。'],
    keys: [
      ['The 24 solar terms divide the Sun’s yearly path (the ecliptic) into 24 steps of 15° of solar longitude; the Spring Equinox is 0°.', '二十四节气把太阳一年在黄道上的运行等分为 24 份，每份太阳黄经 15°，春分为 0°。'],
      ['Spring Equinox and Autumn Equinox: the Sun is overhead at the Equator; Summer Solstice: the Tropic of Cancer; Winter Solstice: the Tropic of Capricorn.', '春分、秋分太阳直射赤道；夏至直射北回归线；冬至直射南回归线。'],
      ['The seasons come from the 23.44° tilt of the Earth’s axis, which keeps pointing the same way all year; with no tilt there would be no seasons.', '季节变化源于地轴倾斜 23.44°，且一年中指向不变；地轴若不倾斜，就没有季节变化。'],
      ['The terms follow the Sun, so they fall on almost the same Gregorian dates every year (within a day or so); in 2016 UNESCO listed them as intangible cultural heritage.', '节气跟随太阳，所以在公历中的日期几乎固定（前后相差一两天）；2016 年列入联合国教科文组织人类非物质文化遗产名录。'],
    ],
    steps: [
      {
        title: ['An orbit in 24 steps', '把轨道分成 24 段'],
        astro: { kit: 'terms', sectors: true, names: 'all', clock: { from: bj(2025, 3, 20, 17), to: bj(2026, 3, 20, 17), rate: 12, unit: 'date' } },
        body: ['Seen from the Earth, the Sun creeps eastward against the stars, once round the sky (360°) in a year. Its position along this path, the ecliptic, is the solar longitude, counted from the Spring Equinox. Ancient Chinese astronomers cut the circle into 24 equal parts of 15°: each time the Sun reaches the next mark, a new solar term begins, about every 15 days. Watch the Earth go round: the bright label is the term we are in.', '从地球上看，太阳在星空背景中缓缓东移，一年绕天一周（360°）。太阳在这条路径（黄道）上的位置叫作太阳黄经，从春分点算起。我国古人把这一圈等分为 24 份，每份 15°：太阳每走到一个分点，就交一个节气，大约每 15 天一个。看地球绕太阳转：高亮的名字就是当前所在的节气。'],
      },
      {
        title: ['Solstices and equinoxes', '二分二至'],
        astro: { kit: 'terms', names: 'key', sectors: true, clock: { from: bj(2025, 3, 20, 17), to: bj(2026, 3, 20, 17), rate: 14, unit: 'date' } },
        body: ['Four terms are the pillars of the year. At the Spring Equinox (0°, about 20 March) and the Autumn Equinox (180°, about 23 September) the Sun is overhead at the Equator and day equals night everywhere. At the Summer Solstice (90°, about 21 June) it is overhead at the Tropic of Cancer (23.44°N): the longest day in the north. At the Winter Solstice (270°, about 21 December) it is overhead at the Tropic of Capricorn: the shortest northern day. Look at the axis: it keeps pointing the same way, so the north leans toward the Sun on one side of the orbit and away on the other.', '其中四个节气是一年的“骨架”。春分（黄经 0°，3 月 20 日前后）和秋分（180°，9 月 23 日前后）太阳直射赤道，全球昼夜等长；夏至（90°，6 月 21 日前后）太阳直射北回归线（23.44°N），北半球白昼最长；冬至（270°，12 月 21 日前后）太阳直射南回归线，北半球白昼最短。注意地轴：它的指向始终不变，所以在轨道一侧北半球倾向太阳，另一侧背向太阳。'],
      },
      {
        title: ['The four starts and the seasons', '四立与四季'],
        astro: { kit: 'terms', names: 'eight', seasons: true, clock: { from: bj(2025, 2, 3, 12), to: bj(2026, 2, 3, 12), rate: 14, unit: 'date' } },
        body: ['In the Chinese calendar each season begins with a “start” term halfway between a solstice and an equinox: Start of Spring (315°, about 4 February), Start of Summer (45°), Start of Autumn (135°) and Start of Winter (225°). So the Summer Solstice falls in the middle of the Chinese summer. The names also track the weather: Minor Heat and Major Heat come after the Summer Solstice, because land and sea take weeks to warm up.', '在我国传统历法里，四季各从一个“立”开始，它们位于二分二至的正中间：立春（黄经 315°，2 月 4 日前后）、立夏（45°）、立秋（135°）、立冬（225°）。所以夏至正处于传统夏季的中间。节气名称也反映天气：小暑、大暑排在夏至之后，因为陆地和海洋要几个星期才能热透。'],
      },
      {
        title: ['A calendar for farmers', '节气与农事'],
        astro: { kit: 'terms', names: 'all', clock: { from: bj(2025, 2, 3, 12), to: bj(2026, 2, 3, 12), rate: 10, unit: 'date', at: 0.17 } },
        fig: termsFig,
        body: ['The terms were made in the Yellow River valley to time farm work, and many names say what happens: Insects Awaken (insects stir from winter sleep), Grain Rain, Grain in Ear (harvest wheat, plant rice), White Dew, Frost Descent. Sayings pass the rules on: “Around Clear and Bright, sow melons and beans”. Children learn all 24 in order with a short rhyme, one syllable per term.', '二十四节气形成于黄河流域，用来安排农事，许多名称直接说出了物候和农事：惊蛰（冬眠的虫子被惊醒）、谷雨、芒种（收麦种稻）、白露、霜降。农谚把经验传下来：“清明前后，种瓜点豆。”还有好记的节气歌：“春雨惊春清谷天，夏满芒夏暑相连，秋处露秋寒霜降，冬雪雪冬小大寒。”'],
      },
      {
        title: ['Why the dates hardly move', '为什么节气的公历日期几乎固定'],
        astro: { kit: 'terms', names: 'key', sectors: true, clock: { from: bj(2025, 12, 21, 23), to: bj(2026, 12, 21, 23), rate: 10, unit: 'date' } },
        body: ['The solar terms are set by the Sun, not the Moon. The Gregorian calendar is also a solar calendar: its average year of 365.2425 days matches the year of the seasons (365.2422 days), so each term lands on the same date give or take a day (a Chinese saying: “the 6th and 21st in the first half of the year, the 8th and 23rd in the second”). In the Chinese lunisolar calendar (nongli), whose months follow the Moon, the same term can shift by almost a month. The steps are equal in angle but not in days: the Earth moves fastest in early January, so winter terms last about 14.7 days and summer ones about 15.7. In 2016 UNESCO inscribed the 24 solar terms as intangible cultural heritage.', '节气由太阳决定，而不是月亮。公历也是太阳历：平均一年 365.2425 天，与回归年（365.2422 天）几乎一样，所以每个节气在公历上的日期年年相近，前后差一天左右（“上半年逢六廿一，下半年逢八廿三”）。农历的月份跟着月相走，同一个节气在农历中的日期可以相差近一个月。节气按角度等分，天数却不相等：地球 1 月初公转最快，所以冬季的节气间隔约 14.7 天，夏季约 15.7 天。2016 年，二十四节气被列入联合国教科文组织人类非物质文化遗产代表作名录。'],
      },
      {
        title: ['Lab: tilt the Earth', '实验：改变地轴倾角'],
        task: ['Drag the tilt and watch the tropics, the polar circles and the noon Sun.', '拖动倾角，观察回归线、极圈和正午太阳高度的变化。'],
        astro: {
          kit: 'terms', view: 'tilt', clock: { from: bj(2025, 3, 20, 17), to: bj(2026, 3, 20, 17), rate: 12, unit: 'date', at: 0.25 },
          params: [
            { id: 'tilt', name: ['Axial tilt', '地轴倾角'], min: 0, max: 90, value: 23.44, step: 0.5, fmt: ['{v}°', '{v}°'], dp: 1 },
            { id: 'lat', name: ['Your latitude', '观察者纬度'], min: 0, max: 66, value: 40, step: 1, fmt: ['{v}°N', '北纬 {v}°'] },
          ],
          tasks: [
            { text: ['Set the tilt to 0°: the Sun stays over the Equator, so there are no seasons.', '把倾角调到 0°：太阳始终直射赤道，没有季节变化。'], done: p => p.tilt <= 0.5 },
            { text: ['Make the tropics reach 40°.', '让回归线到达 40° 纬线。'], done: p => Math.abs(p.tilt - 40) <= 0.75 },
            { text: ['Make the tropics meet the polar circles.', '让回归线与极圈重合。'], done: p => Math.abs(p.tilt - 45) <= 0.75 },
          ],
        },
        body: ['The tilt sets the whole pattern. The tropics lie at the tilt (23.44°) and the polar circles at 90° minus it (66.56°): the Sun can be overhead anywhere between the tropics, and there is a day without sunset somewhere beyond the polar circles. A bigger tilt means harsher seasons: at your latitude φ the noon Sun swings between 90° − |φ − ε| at the Summer Solstice and 90° − (φ + ε) at the Winter Solstice. With no tilt, every day of the year would be like an equinox.', '地轴倾角决定了整套格局：回归线的纬度等于倾角（23.44°），极圈的纬度等于 90° 减去倾角（66.56°）。回归线之间的地方都可能有太阳直射；极圈以内会出现极昼和极夜。倾角越大，季节差异越强烈：在纬度 φ 处，正午太阳高度在夏至日为 90° − |φ − ε|，冬至日为 90° − (φ + ε)。如果地轴不倾斜，一年中天天都像春分。'],
      },
    ],
    quiz: [
      { q: ['Put these terms in order through the year, starting with Start of Spring.', '从立春开始，按一年中的先后顺序排列这些节气。'],
        order: [['Start of Spring', '立春'], ['Spring Equinox', '春分'], ['Clear and Bright', '清明'], ['Start of Summer', '立夏'], ['Summer Solstice', '夏至']],
        why: ['Start of Spring 315°, Spring Equinox 0°, Clear and Bright 15°, Start of Summer 45°, Summer Solstice 90°: one term every 15° of the Sun’s longitude.', '立春 315°、春分 0°、清明 15°、立夏 45°、夏至 90°：太阳黄经每增加 15° 交一个节气。'] },
      { q: ['What is the Sun’s ecliptic longitude at the Start of Autumn (Liqiu)?', '立秋时太阳黄经是多少度？'], num: { answer: 135, tol: 0.5, unit: ['°', '°'] },
        why: ['The Summer Solstice is 90°; Minor Heat 105°, Major Heat 120°, Start of Autumn 135°, halfway to the Autumn Equinox (180°).', '夏至 90°，小暑 105°，大暑 120°，立秋 135°，正好在夏至和秋分（180°）中间。'] },
      { q: ['The Earth’s north pole leans the same way all year. Tap where the Earth is at the Winter Solstice.', '地轴北端的指向一年中不变。点出冬至日地球在轨道上的位置。'],
        astro: { kit: 'terms', names: 'none', clock: { from: bj(2025, 3, 20, 17), to: bj(2026, 3, 20, 17), rate: 0, unit: 'date', hold: true } }, pick: 'dongzhi',
        why: ['At the Winter Solstice the north pole leans away from the Sun, so the Sun is overhead at the Tropic of Capricorn.', '冬至日地轴北端背向太阳，太阳直射南回归线。'] },
      { q: ['Why does each solar term fall on almost the same Gregorian date every year?', '为什么每个节气在公历中的日期几乎固定？'],
        options: [['Both follow the Sun: the Gregorian year matches the year of the seasons', '两者都跟随太阳：公历年长与回归年几乎相同'], ['The terms follow the phases of the Moon', '节气跟随月相变化'], ['The dates were fixed by law in 2016', '2016 年起由法律规定了日期'], ['The Earth’s orbit is a perfect circle', '地球轨道是正圆']], answer: 0,
        why: ['The terms are positions of the Sun; the Gregorian calendar’s average year (365.2425 days) keeps in step with them. The lunar calendar does not.', '节气是太阳的位置；公历平均年长 365.2425 天，与之同步。农历月份跟随月相，日期就会变动。'] },
      { q: ['Which are true at the Summer Solstice in Beijing (40°N)?', '关于北京（40°N）的夏至日，哪些说法正确？'],
        options: [['The day is the longest of the year', '白昼是一年中最长的'], ['The noon Sun is the highest of the year', '正午太阳高度是一年中最高的'], ['The Sun is overhead at the Tropic of Cancer', '太阳直射北回归线'], ['The Earth is closest to the Sun', '地球离太阳最近'], ['It is always the hottest day of the year', '一定是一年中最热的一天']], multi: [0, 1, 2],
        why: ['The Earth is closest to the Sun in early January. The hottest weeks (Minor and Major Heat) come after the solstice because land and sea warm slowly.', '地球 1 月初离太阳最近。最热的时候（小暑、大暑）在夏至之后，因为海陆升温需要时间。'] },
      { q: ['Match each term to what happens.', '把节气与相应的物候或农事配对。'],
        match: [[['Insects Awaken', '惊蛰'], ['Spring thunder, insects stir', '春雷响，冬眠的虫子醒来']], [['Clear and Bright', '清明'], ['Sow melons and beans', '种瓜点豆']], [['Grain in Ear', '芒种'], ['Harvest wheat, plant rice', '收麦种稻']], [['Frost Descent', '霜降'], ['First frosts', '开始出现霜冻']]],
        why: ['The names record the farming year of the Yellow River valley.', '节气名称记录了黄河流域一年的物候和农事。'] },
    ],
  },
  {
    id: 'a-gnomon', strand: 'earthsun', level: 'jr', tracks: ['us', 'au', 'ib'], unit: unitSun, icon: 'ruler', minutes: 9,
    title: ['The gnomon and the Sun’s shadow', '圭表与日影'],
    blurb: ['A stick in the ground tells the time, the seasons and the length of the year, and Guo Shoujing built a 12-metre one.', '一根立在地上的杆子，就能测出时间、季节和一年的长度，郭守敬还把它建到了 12 米高。'],
    keys: [
      ['A gnomon (biao) is a vertical rod; its noon shadow falls along the scale (gui), which points due north.', '圭表由直立的“表”和正南北方向平放的“圭”组成，正午时表影落在圭上。'],
      ['North of the Tropic of Cancer the noon shadow is longest at the Winter Solstice and shortest at the Summer Solstice.', '北回归线以北，正午表影冬至最长，夏至最短。'],
      ['Noon Sun altitude H = 90° − |φ − δ|; shadow length L = h / tan H. Where the Sun is overhead, the noon shadow vanishes.', '正午太阳高度 H = 90° − |φ − δ|，影长 L = h / tan H；太阳直射时正午无影。'],
      ['Guo Shoujing’s observatory at Dengfeng (Yuan dynasty) measured the solstices so well that the Shoushi calendar (1281) gave a year of 365.2425 days.', '元代郭守敬在登封观星台精测冬至，《授时历》（1281 年）定一年为 365.2425 天。'],
    ],
    steps: [
      {
        title: ['A stick and its shadow', '一根杆子的影子'],
        astro: { kit: 'gnomon', mode: 'day', lat: 40, day: 80, clock: { from: 5.5, to: 18.5, rate: 0.9, unit: 'hour', fmt: ['Time', '时刻'] } },
        body: ['Stand a 1 m rod upright on level ground and follow its shadow through a day near the Spring Equinox. In the morning the Sun is in the east and the shadow points west; it shortens as the Sun climbs, is shortest at noon, when it points due north, and grows again toward the east in the afternoon. The shortest shadow marks local noon and the north–south line: the first sundial and the first compass.', '在平地上竖一根 1 米高的杆子，观察春分前后一天里它的影子：早上太阳在东方，影子指向西方；太阳升高，影子变短；正午影子最短，指向正北；下午影子又向东伸长。最短的影子标出了当地正午和正南北方向，这就是最早的日晷和“指南针”。'],
      },
      {
        title: ['The noon shadow through the year', '一年中的正午影长'],
        astro: { kit: 'gnomon', mode: 'year', lat: 40, clock: { from: bj(2025, 6, 21, 12), to: bj(2026, 6, 21, 12), rate: 20, unit: 'date' } },
        body: ['Now look only at noon, every day for a year. Lay a scale (gui) north from the rod (biao) to read the shadow’s length. At 40°N the noon shadow of a 1 m rod is just 0.3 m at the Summer Solstice, 0.84 m at the equinoxes and 2.0 m at the Winter Solstice. The longest noon shadow marks the Winter Solstice (Dongzhi), which ancient China used as the start of the astronomical year.', '现在只看正午，一天天看一整年。在表的北面平放一把尺（圭）量影长。在北纬 40°，1 米高的表，夏至正午影长只有约 0.3 米，春分、秋分约 0.84 米，冬至约 2.0 米。正午影子最长的那天就是冬至，我国古代把它作为推算历法的起点。'],
      },
      {
        title: ['Working out the shadow', '算一算影长'],
        fig: shadowFig,
        astro: { kit: 'gnomon', mode: 'day', lat: 40, day: 355, clock: { from: 5.5, to: 18.5, rate: 0.6, unit: 'hour', fmt: ['Time', '时刻'], at: 0.5, hold: true } },
        body: ['At noon the Sun’s altitude is H = 90° − |φ − δ|, where φ is your latitude and δ the latitude where the Sun is overhead that day (+23.44° at the Summer Solstice, 0° at the equinoxes, −23.44° at the Winter Solstice). The rod, its shadow and the sunbeam make a right triangle, so the shadow is L = h / tan H. At 40°N on the Winter Solstice: H = 90° − 63.44° = 26.56°, and tan 26.56° ≈ 0.5, so a 1 m rod casts a 2 m shadow.', '正午太阳高度 H = 90° − |φ − δ|，φ 是当地纬度，δ 是当天太阳直射点的纬度（夏至 +23.44°，春分秋分 0°，冬至 −23.44°）。表、影和太阳光线构成直角三角形，所以影长 L = h / tan H。北纬 40° 冬至日：H = 90° − 63.44° = 26.56°，tan 26.56° ≈ 0.5，1 米高的表影长 2 米。'],
      },
      {
        title: ['Dengfeng Observatory', '登封观星台'],
        astro: { kit: 'gnomon', mode: 'year', tower: true, clock: { from: bj(2025, 6, 21, 12), to: bj(2026, 6, 21, 12), rate: 20, unit: 'date', at: 0.5 } },
        body: ['A taller rod gives a longer shadow, so the same error in reading it matters less. In 1276 the Yuan astronomer Guo Shoujing built an observatory at Dengfeng in Henan (34.4°N): a brick tower whose crossbeam stands 40 chi (about 12.6 m) above a 31.2 m stone scale, the “sky-measuring ruler” (Liangtianchi), five times the traditional 8-chi gnomon. A pinhole device (jingfu) focused the beam’s blurry shadow into a sharp image. It is the oldest surviving observatory in China.', '表越高，影子越长，同样的读数误差影响就越小。1276 年，元代天文学家郭守敬在河南登封（北纬 34.4°）建起观星台：砖砌高台上横梁离地 40 尺（约 12.6 米），下面是长 31.2 米的石圭“量天尺”，表高是传统 8 尺表的 5 倍。他还用“景符”（小孔成像）把横梁模糊的影子聚成清晰的像。这是我国现存最早的天文台。'],
      },
      {
        title: ['Measuring the year', '测定一年的长度'],
        astro: { kit: 'gnomon', mode: 'year', tower: true, clock: { from: bj(2025, 12, 1, 12), to: bj(2026, 1, 10, 12), rate: 3, unit: 'date' } },
        body: ['Count the days from one Winter Solstice (the longest noon shadow) to the next and you have the length of the year. One year’s count is only good to a day, but averaging the shadows over many years and centuries pins it down. With the Dengfeng measurements, the Shoushi calendar (1281) took the year as 365.2425 days, only 26 seconds longer than the true value, and the same figure the Gregorian calendar adopted in 1582, three centuries later.', '数一数从一个冬至（正午影子最长）到下一个冬至有多少天，就得到一年的长度。只测一年只能准确到一天左右，但积累许多年甚至几百年的观测，就能测得非常精确。依据登封等地的观测，《授时历》（1281 年）定一年为 365.2425 天，只比实际长约 26 秒，与 300 年后（1582 年）公历采用的数值相同。'],
      },
      {
        title: ['Lab: shadows anywhere, any day', '实验：任何地方、任何日子的影子'],
        task: ['Change the latitude and the date; drag the time to see the shadow move.', '改变纬度和日期；拖动时间，看影子怎样移动。'],
        astro: {
          kit: 'gnomon', mode: 'day', clock: { from: 5.5, to: 18.5, rate: 0.9, unit: 'hour', fmt: ['Time', '时刻'], at: 0.5 },
          params: [
            { id: 'lat', name: ['Latitude', '纬度'], min: 0, max: 60, value: 40, step: 0.5, fmt: ['{v}°N', '北纬 {v}°'], dp: 1 },
            { id: 'day', name: ['Date (day of the year)', '日期（一年中的第几天）'], min: 1, max: 365, value: 80, step: 1, fmt: ['day {v}', '第 {v} 天'] },
          ],
          tasks: [
            { text: ['Make the noon shadow vanish: put the Sun straight overhead.', '让正午的影子消失：使太阳直射头顶。'], done: p => Math.abs(p.lat - decOfDay(p.day)) <= 0.5 },
            { text: ['At 40°N, find the day with the longest noon shadow of the year.', '在北纬 40°，找到一年中正午影子最长的那一天。'], done: p => Math.abs(p.lat - 40) <= 0.5 && decOfDay(p.day) <= -23.38 },
            { text: ['Make the noon shadow point south.', '让正午的影子指向南方。'], done: p => decOfDay(p.day) - p.lat > 0.5 },
          ],
        },
        body: ['The noon shadow can only vanish between the tropics, on the days the Sun is overhead there: in Guangzhou (23.1°N) around 11 June and 1 July. Between the tropics the noon shadow can even point south, when the Sun is overhead further north. Day 172 is the Summer Solstice, day 355 the Winter Solstice.', '只有在南北回归线之间，并且在太阳直射当地的日子，正午才会没有影子：广州（北纬 23.1°）大约在 6 月 11 日和 7 月 1 日前后。在回归线之间，当太阳直射点位于当地以北时，正午的影子甚至会指向南方。第 172 天是夏至，第 355 天是冬至。'],
      },
    ],
    quiz: [
      { q: ['What is the noon Sun’s altitude at 30°N on the Summer Solstice?', '夏至日北纬 30° 的正午太阳高度是多少度？'], num: { answer: 83.44, tol: 0.6, unit: ['°', '°'] },
        why: ['H = 90° − |30° − 23.44°| = 90° − 6.56° = 83.44°.', '正午太阳高度 H = 90° − |30° − 23.44°| = 90° − 6.56° = 83.44°。'] },
      { q: ['At 40°N on the Winter Solstice the noon Sun is 26.6° high (tan 26.6° ≈ 0.5). How long is the noon shadow of a 1 m rod?', '冬至日北纬 40° 的正午太阳高度为 26.6°（tan 26.6° ≈ 0.5），1 米高的杆子正午影长是多少米？'], num: { answer: 2, tol: 0.1, unit: ['m', '米'] },
        why: ['L = h / tan H = 1 m / 0.5 = 2 m.', 'L = h / tan H = 1 米 ÷ 0.5 = 2 米。'] },
      { q: ['In Beijing, on which day is the noon shadow longest?', '在北京，哪一天正午的影子最长？'], options: [['Winter Solstice', '冬至'], ['Summer Solstice', '夏至'], ['Spring Equinox', '春分'], ['Start of Autumn', '立秋']], answer: 0,
        why: ['The Sun is overhead at the Tropic of Capricorn, as far from Beijing as it gets, so the noon Sun is lowest.', '冬至日太阳直射南回归线，离北京最远，正午太阳高度最低，影子最长。'] },
      { q: ['Put these noon shadows of a 1 m rod in order, shortest first.', '把下列 1 米高杆子的正午影长从短到长排列。'],
        order: [['Beijing, Summer Solstice', '北京，夏至'], ['Beijing, Spring Equinox', '北京，春分'], ['Guangzhou, Winter Solstice', '广州，冬至'], ['Beijing, Winter Solstice', '北京，冬至']],
        why: ['Noon altitudes: 73.5°, 50.1°, 43.5° and 26.6°, so the shadows are 0.30 m, 0.84 m, 1.05 m and 2.0 m.', '正午太阳高度依次为 73.5°、50.1°、43.5°、26.6°，影长约 0.30 米、0.84 米、1.05 米、2.0 米。'] },
      { q: ['Which are true of the Dengfeng Observatory?', '关于登封观星台，哪些说法正确？'],
        options: [['Guo Shoujing built it in the Yuan dynasty', '由元代郭守敬主持修建'], ['Its tall crossbeam makes a long shadow that is easier to measure precisely', '高高的横梁投下长影，更容易测准'], ['Its measurements helped give a year of 365.2425 days', '它的观测帮助得出一年 365.2425 天'], ['It was built to watch the stars through a telescope', '它是用望远镜观测恒星的']], multi: [0, 1, 2],
        why: ['The telescope was invented in Europe in 1608, over 300 years later; Dengfeng measured the Sun’s noon shadow.', '望远镜 1608 年才在欧洲发明，比观星台晚 300 多年；观星台测的是正午日影。'] },
      { q: ['Match the parts and products of the gnomon.', '把圭表的部件和成果配对。'],
        match: [[['Biao', '表'], ['The upright rod', '直立的杆']], [['Gui', '圭'], ['The north-pointing scale on the ground', '正南北方向平放的尺']], [['Jingfu', '景符'], ['A pinhole that sharpens the shadow', '用小孔成像使影子清晰的装置']], [['Shoushi calendar', '授时历'], ['A year of 365.2425 days', '一年 365.2425 天']]],
        why: ['The rod casts the shadow, the scale measures it, the pinhole sharpens it, and the calendar used the results.', '表投影，圭量影，景符使影清晰，历法利用测量结果。'] },
      { q: ['Tap the crossbeam that casts the measured shadow.', '点出投下被测影子的横梁。'], astro: { kit: 'gnomon', mode: 'year', tower: true, clock: { from: bj(2025, 12, 21, 12), to: bj(2026, 6, 21, 12), rate: 0, unit: 'date', hold: true } }, pick: 'beam',
        why: ['The beam, 40 chi (≈ 12.6 m) above the scale, replaced the top of a rod: a five-times-taller gnomon.', '横梁离圭面 40 尺（约 12.6 米），相当于一根 5 倍高的表。'] },
    ],
  },
  {
    id: 'a-ancient', strand: 'sky', level: 'jr', tracks: [], unit: unitSky, icon: 'compass', minutes: 10,
    title: ['Astronomy in ancient China', '中国古代天文'],
    blurb: ['Three enclosures, 28 lunar mansions and four sacred animals: how China mapped the sky, and what its records still tell astronomers.', '三垣、二十八宿和四象：古人怎样划分星空，他们的观测记录今天仍在帮助天文学家。'],
    keys: [
      ['Ancient China divided the sky into the Three Enclosures (San Yuan) round the pole and the 28 lunar mansions (Ershiba Xiu) along the path of the Sun and Moon.', '我国古代把星空分为北天极周围的三垣和日月运行路径附近的二十八宿。'],
      ['The 28 mansions form four groups of seven, the Four Symbols: Azure Dragon (east), Black Tortoise (north), White Tiger (west), Vermilion Bird (south).', '二十八宿每七宿为一组，组成四象：东方苍龙、北方玄武、西方白虎、南方朱雀。'],
      ['Chinese records are long and careful: Halley’s Comet at every return since 240 BC, and the “guest star” of 1054 whose remnant is the Crab Nebula.', '我国天象记录持续时间长、记载详细：自公元前 240 年起哈雷彗星的每次回归都有记录；1054 年的“客星”留下了蟹状星云。'],
      ['Instruments such as the armillary sphere (hunyi) and Guo Shoujing’s abridged armilla (jianyi, 1276) measured star positions.', '浑仪和郭守敬的简仪（1276 年）等仪器用来测量天体的位置。'],
    ],
    steps: [
      {
        title: ['Enclosures and mansions', '三垣二十八宿'],
        astro: { kit: 'sky', view: 'chart', enclosures: true, mansions: 'names' },
        body: ['This chart looks like the stone star map carved in Suzhou in 1247: the north celestial pole is in the middle and the sky spreads out round it. Round the pole lies the Purple Forbidden Enclosure (Ziwei Yuan), the emperor’s palace, with the Supreme Palace (Taiwei Yuan) and the Heavenly Market (Tianshi Yuan) further out. Around the rim, the band the Sun, Moon and planets travel through is cut into 28 unequal “lodges”, the lunar mansions, each named after one determinative star (juxing). The Moon takes 27.3 days to go round the sky, so it lodges in about one mansion each night.', '这幅星图的样子和 1247 年刻成的苏州石刻天文图相似：北天极在中央，星空围绕它展开。天极周围是紫微垣（象征皇宫），外面还有太微垣和天市垣。外圈是日、月、五星经过的天区，分为宽窄不等的 28 段，就是二十八宿，每宿以一颗“距星”为起点。月亮约 27.3 天绕天一周，差不多每夜“住”一宿，所以叫“宿”。'],
      },
      {
        title: ['The Four Symbols', '四象'],
        astro: { kit: 'sky', view: 'chart', mansions: true, symbols: true },
        body: ['The 28 mansions fall into four groups of seven, each pictured as an animal: the Azure Dragon of the East (Jiao, Kang, Di, Fang, Xin, Wei, Ji), the Black Tortoise of the North (Dou, Niu, Nü, Xu, Wei, Shi, Bi), the White Tiger of the West (Kui, Lou, Wei, Mao, Bi, Zi, Shen) and the Vermilion Bird of the South (Jing, Gui, Liu, Xing, Zhang, Yi, Zhen). The directions match the evening sky in spring: then the Bird is in the south, the Dragon rising in the east, the Tiger setting in the west and the Tortoise below the northern horizon.', '二十八宿每七宿一组，各想象成一种动物：东方苍龙（角亢氐房心尾箕）、北方玄武（斗牛女虚危室壁）、西方白虎（奎娄胃昴毕觜参）、南方朱雀（井鬼柳星张翼轸）。这些方位与春季黄昏的星空相符：朱雀在南方，苍龙从东方升起，白虎在西方落下，玄武在北方地平线下。'],
      },
      {
        title: ['The Dragon in the summer sky', '夏夜的苍龙'],
        astro: { kit: 'sky', view: 'dome', look: [175, 24], fov: 96, t: bj(2025, 7, 20, 21), mansions: 'names', symbols: true, stars: ['Antares'] },
        body: ['On a summer evening the whole Azure Dragon stretches across the southern sky: its horn is Spica (Jiaoxiu Yi), its heart the red giant Antares (Xinxiu Er, “the Great Fire”, Dahuo) in Scorpius, and its tail curls toward Sagittarius. The Book of Songs says “in the seventh month, the Fire flows down”: in the seventh month of the old calendar the Fire star sinks west at dusk, a sign the heat is ending.', '夏季的晚上，整条苍龙横在南方天空：龙角是角宿一，龙心是红色的心宿二（又叫“大火”），在天蝎座，龙尾向人马座弯去。《诗经》说“七月流火”，意思是到了农历七月，黄昏时大火星向西沉落，天气将转凉。'],
      },
      {
        title: ['The Dipper, the Dragon’s horn and the seasons', '北斗、角宿与季节'],
        astro: { kit: 'sky', view: 'dome', look: [72, 45], fov: 100, t: bj(2025, 4, 10, 21), dipper: true, handle: true, mansions: 'names', stars: ['Arcturus', 'Spica'] },
        body: ['The Big Dipper (Beidou) belongs to the Purple Forbidden Enclosure and was imagined as the emperor’s carriage. Its handle points the way along the sky: follow its curve to orange Arcturus (Dajiao), then on to Spica, the horn of the Dragon. Through the year the handle swings round the pole like the hand of a clock: “When the handle points east, it is spring everywhere; south, summer; west, autumn; north, winter.”', '北斗七星属于紫微垣，被想象成天帝的车子。顺着斗柄的弧线延长，可以找到橙色的大角星，再往前就是苍龙的龙角——角宿一。一年里斗柄像钟表的指针一样绕北天极转动：“斗柄东指，天下皆春；斗柄南指，天下皆夏；斗柄西指，天下皆秋；斗柄北指，天下皆冬。”'],
      },
      {
        title: ['Records that still matter', '至今有用的观测记录'],
        astro: { kit: 'sky', view: 'dome', look: [195, 55], fov: 92, t: bj(2025, 1, 20, 21), cons: ['tau', 'ori'], mansions: 'names', marks: [{ ra: 83.63, dec: 22.01, name: ['Crab Nebula: the guest star of 1054', '蟹状星云：1054 年的客星'], c: C.pink }] },
        body: ['In the Warring States period, Gan De and Shi Shen listed the positions of over a hundred stars, one of the oldest star catalogues (later known as the Gan–Shi Star Classic). Court astronomers then logged comets, eclipses and sunspots for two thousand years. Halley’s Comet appears at every return since 240 BC. In 1054 a “guest star” (kexing) blazed near Tianguan (ζ Tauri), visible in daylight for 23 days. Today a telescope there shows the Crab Nebula, the wreck of that supernova, and the Chinese date fixes its age.', '战国时期的甘德和石申测定了一百多颗恒星的位置，是世界上最早的星表之一（后人合称《甘石星经》）。此后两千多年，历代天文官记录了大量彗星、日月食和太阳黑子。自公元前 240 年起，哈雷彗星的每次回归都有记载。1054 年，一颗“客星”出现在天关星（金牛座 ζ 星）附近，白天也能看见，持续了 23 天。今天用望远镜看那里，就是那次超新星爆发的遗迹——蟹状星云，中国的记录确定了它的年龄。'],
      },
      {
        title: ['Measuring the sky', '测量星空的仪器'],
        fig: armillaryFig,
        sketch: true,
        astro: { kit: 'sky', view: 'outside', mansions: true, t: bj(2025, 4, 20, 21), clock: { from: 0, to: 24, rate: 1.2, unit: 'hour' } },
        body: ['To measure where a star is, astronomers built the armillary sphere (hunyi): nested rings for the horizon, the celestial equator and the ecliptic, with a sighting tube that turns on a polar axis. Luoxia Hong built one in the Western Han, and Zhang Heng drove a celestial globe with water. The crowded rings blocked the view, so in 1276 Guo Shoujing split them into a simpler instrument, the abridged armilla (jianyi): an equatorial ring on an axis aimed at the pole, the same idea as a modern telescope’s equatorial mount. Ming copies stand at Purple Mountain Observatory in Nanjing.', '为了测出星星的位置，古人造了浑仪：几层圆环分别代表地平、赤道和黄道，中间的窥管绕极轴转动。西汉落下闳造过浑仪，东汉张衡还用水力推动浑象运转。浑仪的环太多，互相遮挡视线，1276 年郭守敬把它拆分简化成简仪：赤道环装在指向天极的极轴上，和现代望远镜的赤道式装置原理相同。南京紫金山天文台保存着明代仿制的浑仪和简仪。'],
      },
    ],
    quiz: [
      { q: ['Match each of the Four Symbols to its direction.', '把四象与它们的方位配对。'],
        match: [[['Azure Dragon', '苍龙'], ['East', '东方']], [['White Tiger', '白虎'], ['West', '西方']], [['Vermilion Bird', '朱雀'], ['South', '南方']], [['Black Tortoise', '玄武'], ['North', '北方']]],
        why: ['Dragon east, Tiger west, Bird south, Tortoise north, matching the evening sky in spring.', '东方苍龙、西方白虎、南方朱雀、北方玄武，与春季黄昏的星空方位相符。'] },
      { q: ['This is a winter evening sky, looking south. Tap the mansions of the White Tiger.', '这是冬季傍晚向南看的星空。点出西方白虎七宿。'],
        astro: { kit: 'sky', view: 'dome', look: [200, 42], fov: 100, t: bj(2025, 1, 20, 21), mansions: true, cons: ['ori'] }, pick: 'tiger',
        why: ['The White Tiger includes Mao (the Pleiades), Bi (the Hyades) and Shen (Orion), high in the south on winter evenings.', '白虎七宿包括昴宿（昴星团）、毕宿和参宿（猎户座），冬季傍晚高挂在南方天空。'] },
      { q: ['The guest star of 1054 recorded in China left behind what we see today as', '1054 年中国记录的客星，今天留下的遗迹是'],
        options: [['the Crab Nebula', '蟹状星云'], ['Halley’s Comet', '哈雷彗星'], ['the Pleiades', '昴星团'], ['the Andromeda Galaxy', '仙女星系']], answer: 0,
        why: ['It was a supernova in Taurus; its expanding debris is the Crab Nebula, with a pulsar at its centre.', '它是金牛座中的一次超新星爆发，向外膨胀的残骸就是蟹状星云，中心还有一颗脉冲星。'] },
      { q: ['Put these in time order, earliest first.', '按时间先后排列，最早的在前。'],
        order: [['Gan De and Shi Shen’s star lists', '甘德、石申测定星表'], ['First certain record of Halley’s Comet', '哈雷彗星的首次确切记录'], ['Zhang Heng’s water-driven celestial globe', '张衡制成水运浑象'], ['The guest star near Tianguan', '天关客星出现'], ['Guo Shoujing’s abridged armilla', '郭守敬制成简仪']],
        why: ['4th century BC; 240 BC; about AD 117 (Eastern Han); 1054 (Song); 1276 (Yuan).', '公元前 4 世纪；公元前 240 年；约公元 117 年（东汉）；1054 年（北宋）；1276 年（元）。'] },
      { q: ['Which of these mansions belong to the White Tiger of the West?', '下列哪些属于西方白虎七宿？'],
        options: [['Mao', '昴'], ['Shen', '参'], ['Bi (the Net)', '毕'], ['Xin (the Heart)', '心'], ['Jing (the Well)', '井']], multi: [0, 1, 2],
        why: ['The Tiger is Kui, Lou, Wei, Mao, Bi, Zi and Shen. Xin belongs to the Dragon and Jing to the Bird.', '白虎七宿是奎、娄、胃、昴、毕、觜、参；心宿属苍龙，井宿属朱雀。'] },
      { q: ['The Moon goes once round the sky against the stars in how many days? (It lodges in about one mansion a night.)', '月亮在星空背景上绕行一周约需多少天？（它差不多每夜经过一宿。）'], num: { answer: 27.3, tol: 0.4, unit: ['days', '天'] },
        why: ['The sidereal month is 27.3 days, close to 28, one of the reasons for 28 mansions.', '恒星月约 27.3 天，接近 28，这是划分二十八宿的原因之一。'] },
    ],
  },
  {
    id: 'a-formation', strand: 'solar', level: 'sr', tracks: ['uk', 'us', 'ib'], unit: unitSolar, icon: 'planet', minutes: 11,
    title: ['How the Solar System formed', '太阳系的形成'],
    blurb: ['From a cold, slowly turning cloud to a Sun and eight planets: the nebular hypothesis, step by step.', '从一团缓慢旋转的冷云到太阳和八大行星：一步步看懂星云假说。'],
    keys: [
      ['The Solar System formed about 4.6 billion years ago from a rotating cloud of gas and dust (the solar nebula), an idea first put forward by Kant and Laplace.', '太阳系约在 46 亿年前由一团旋转的气体尘埃云（太阳星云）形成，这一思想最早由康德和拉普拉斯提出。'],
      ['As the cloud collapsed it spun faster and flattened into a disk; most of the mass fell to the centre and became the Sun.', '星云收缩时越转越快、变扁成盘，大部分物质落到中心形成太阳。'],
      ['Inside the frost line only rock and metal could condense (rocky planets); beyond it ices too, so giant planets grew and gathered gas.', '冰线以内只有岩石和金属能凝结（类地行星）；冰线以外还有冰，于是长出了巨行星并吸积大量气体。'],
      ['Because all planets formed in one spinning disk, their orbits are nearly in one plane and all go the same way round.', '行星都在同一个旋转的盘中形成，所以轨道几乎共面，并且绕太阳的方向相同。'],
    ],
    steps: [
      {
        title: ['A cloud begins to fall', '星云开始收缩'],
        astro: { kit: 'nebula', clock: { from: 0, to: 1.2, rate: 0.1, unit: 'myr', once: true } },
        body: ['About 4.6 billion years ago there was no Sun, only a cold cloud of hydrogen and helium with a sprinkle of dust, left over from earlier generations of stars. Something, perhaps the shock wave of a nearby supernova, squeezed part of it. Gravity took over and the cloud began to fall inward on itself. In 1755 Immanuel Kant suggested the Sun and planets grew from such a cloud; in 1796 Pierre-Simon Laplace worked the idea out. Together it is called the Kant–Laplace nebular hypothesis.', '约 46 亿年前还没有太阳，只有一团寒冷的氢和氦，夹着少量尘埃，它们来自更早的几代恒星。也许是附近一次超新星爆发的冲击波挤压了它的一部分，引力随即占了上风，星云开始向内收缩。1755 年康德提出太阳和行星由这样一团星云形成，1796 年拉普拉斯进一步发展了这一思想，合称康德—拉普拉斯星云假说。'],
      },
      {
        title: ['Spinning up, flattening out', '越转越快，越来越扁'],
        astro: { kit: 'nebula', clock: { from: 0.3, to: 3, rate: 0.25, unit: 'myr' } },
        body: ['The cloud was turning very slowly. As it shrank it spun faster, like a skater pulling in her arms (conservation of angular momentum). Gas falling along the spin axis met no resistance, but gas moving round the axis could not fall straight in, so the cloud flattened into a spinning disk. More than 99.8% of the mass piled up in the hot centre: the protosun.', '星云原本转得很慢。收缩时它越转越快，就像花样滑冰运动员收拢双臂（角动量守恒）。沿自转轴方向下落的气体畅通无阻，而绕轴转动的气体不能直接掉进中心，于是星云变扁，成为旋转的盘。99.8% 以上的物质堆积在炽热的中心，形成原始太阳。'],
      },
      {
        title: ['The frost line', '冰线'],
        astro: { kit: 'nebula', frost: true, clock: { from: 1, to: 6, rate: 0.5, unit: 'myr' } },
        body: ['Close to the protosun the disk was hot, so only metal and rock could turn into solid grains. Beyond about 3 AU (between today’s Mars and Jupiter), it was cold enough for water, ammonia and methane to freeze too. This boundary is the frost line (snow line). Ices were far more plentiful than rock, so out there the solid grains were many times more abundant. Dust grains stuck together into pebbles, then into planetesimals a few kilometres across.', '靠近原始太阳的地方温度很高，只有金属和岩石能凝结成固体颗粒。在约 3 天文单位以外（今天的火星和木星之间），温度低到水、氨、甲烷也能结冰。这条分界叫冰线（雪线）。冰比岩石多得多，所以冰线外的固体物质要丰富好几倍。尘埃颗粒互相粘合成小石块，再长成几千米大小的星子。'],
      },
      {
        title: ['Giants grab the gas', '巨行星抢走气体'],
        astro: { kit: 'nebula', frost: true, names: true, clock: { from: 2, to: 12, rate: 1, unit: 'myr' } },
        body: ['Beyond the frost line, cores of rock and ice grew to about ten Earth masses. Their gravity was then strong enough to pull in the surrounding hydrogen and helium, and Jupiter and Saturn swelled into gas giants. Uranus and Neptune, farther out where material was thinner, grew more slowly and caught less gas: they are ice giants. This race had a deadline: within about 10 million years the young Sun’s wind and light had blown the remaining gas away.', '在冰线以外，岩石和冰组成的核心长到约 10 个地球质量后，引力强到能吸积周围的氢和氦，木星和土星因此膨胀成气态巨行星。天王星和海王星离得更远，物质稀薄，长得慢，抓到的气体较少，成为冰巨星。这场竞赛有时间限制：大约 1000 万年内，年轻太阳的星风和辐射就把剩余的气体吹散了。'],
      },
      {
        title: ['Rocky planets by collision', '碰撞中长大的类地行星'],
        astro: { kit: 'nebula', frost: true, names: true, orbits: true, clock: { from: 10, to: 100, rate: 8, unit: 'myr', once: true } },
        body: ['Inside the frost line there was too little solid material and no gas left to grab. Planetesimals crashed together into Moon- to Mars-sized embryos, and these collided over tens of millions of years to build Mercury, Venus, Earth and Mars. One such giant impact probably made our Moon. Around 50 million years the centre of the protosun became hot enough for hydrogen fusion: the Sun was born as a true star. Leftover planetesimals remain as the asteroid belt and the Kuiper belt. Watch the orbits: nearly flat, and all going the same way round, because the disk was flat and spinning.', '冰线以内固体物质少，又没有气体可吸积。星子相互碰撞，形成月球到火星大小的“行星胚胎”，它们在几千万年里继续碰撞，造就了水星、金星、地球和火星。月球很可能就来自这样一次大碰撞。大约 5000 万年时，原始太阳中心热到足以发生氢核聚变，太阳成为真正的恒星。剩下的星子留在小行星带和柯伊伯带。看这些轨道：几乎在同一平面上，而且绕行方向相同，因为原来的盘是扁平而旋转的。'],
      },
      {
        title: ['Seeing it happen elsewhere', '在别处看到这个过程'],
        astro: { kit: 'nebula', view: 'hltau' },
        body: ['Is the story true? We can watch other stars do it. In 2014 the ALMA radio telescope array in Chile imaged HL Tau, a star less than a million years old about 450 light-years away. Its dusty disk is striped with dark gaps, likely swept clear by young planets. Other evidence: the planets’ coplanar, same-direction orbits; the Sun’s spin in the same direction; and meteorites, the oldest of which date the Solar System to 4.568 billion years. A few oddities, like Venus spinning backwards and Uranus lying on its side, are thought to be scars of giant impacts.', '这个故事可信吗？我们能看到别的恒星正在经历它。2014 年，智利的 ALMA 射电望远镜阵列拍到了金牛座 HL 星：它年龄不到 100 万年，距离约 450 光年，尘埃盘上有一圈圈暗环，可能是年轻行星清扫出来的。其他证据还有：行星轨道共面、同向；太阳自转方向与行星公转相同；陨石中最古老的成分测得太阳系年龄为 45.68 亿年。金星逆向自转、天王星“躺着”转等少数例外，被认为是大碰撞留下的痕迹。'],
      },
    ],
    quiz: [
      { q: ['Put the stages in order, earliest first.', '按先后顺序排列这些阶段。'],
        order: [['A cold cloud starts to collapse', '冷星云开始收缩'], ['It spins faster and flattens into a disk', '越转越快，变扁成盘'], ['Dust sticks into planetesimals', '尘埃粘合成星子'], ['Giant planets gather gas', '巨行星吸积气体'], ['Rocky planets finish growing by collisions', '类地行星在碰撞中长成']],
        why: ['Collapse (< 1 Myr), disk, planetesimals, giants (before the gas clears at ~10 Myr), rocky planets (10–100 Myr).', '收缩（不到 100 万年）、成盘、形成星子、巨行星（在约 1000 万年气体散去之前）、类地行星（1000 万～1 亿年）。'] },
      { q: ['Why did the giant planets form beyond the frost line?', '为什么巨行星在冰线以外形成？'],
        options: [['Ices could freeze there, giving more solid material to build big cores that then pulled in gas', '那里冰能凝结，固体物质更多，能长成大核心，再吸积气体'], ['The Sun’s gravity is stronger far out', '远处太阳引力更强'], ['Rock cannot exist far from the Sun', '离太阳远的地方不可能有岩石'], ['The giants were captured from other stars', '巨行星是从其他恒星那里俘获来的']], answer: 0,
        why: ['Beyond ~3 AU water and other ices froze, so solids were plentiful; cores of ~10 Earth masses then captured hydrogen and helium.', '约 3 天文单位以外，水等物质结冰，固体丰富；约 10 个地球质量的核心随后吸积了氢和氦。'] },
      { q: ['Tap the frost line.', '点出冰线。'], astro: { kit: 'nebula', frost: true, clock: { from: 4, to: 5, rate: 0, unit: 'myr', hold: true } }, pick: 'frost',
        why: ['The blue ring at about 3 AU: inside it rocky grains, outside icy ones.', '约 3 天文单位处的蓝色圆环：环内是岩石颗粒，环外是冰质颗粒。'] },
      { q: ['Which observations support the nebular hypothesis?', '哪些观测支持星云假说？'],
        options: [['All planets orbit in nearly the same plane', '行星轨道几乎在同一平面'], ['All planets orbit the Sun in the same direction', '行星都沿同一方向绕太阳公转'], ['Disks with gaps around young stars, such as HL Tau', '年轻恒星（如金牛座 HL）周围有带暗环的盘'], ['Venus spins backwards', '金星逆向自转'], ['Mars is red', '火星是红色的']], multi: [0, 1, 2],
        why: ['A flat, spinning disk explains coplanar, same-way orbits, and we see such disks today. Venus’s spin is an exception explained by impacts; Mars’s colour is rust.', '扁平旋转的盘解释了轨道共面、同向，今天还能看到这样的盘。金星逆转是被碰撞解释的例外；火星发红是因为铁锈。'] },
      { q: ['How long ago did the Solar System form, in billions of years?', '太阳系形成于多少亿年前？（以“十亿年”为单位）'], num: { answer: 4.6, tol: 0.1, unit: ['billion years', '十亿年'] },
        why: ['About 4.6 billion years; the oldest meteorite grains give 4.568 billion.', '约 46 亿年（4.6 个十亿年）；陨石中最古老的颗粒给出 45.68 亿年。'] },
      { q: ['Match each region of the young disk to what formed there.', '把原行星盘的区域与在那里形成的天体配对。'],
        match: [[['The centre', '中心'], ['The Sun', '太阳']], [['Inside the frost line', '冰线以内'], ['Rocky planets', '类地行星']], [['Just beyond the frost line', '冰线外侧不远'], ['Gas giants', '气态巨行星']], [['Far out, thin material', '远处物质稀薄区'], ['Ice giants', '冰巨星']]],
        why: ['Sun; Mercury–Mars; Jupiter and Saturn; Uranus and Neptune.', '太阳；水星到火星；木星和土星；天王星和海王星。'] },
    ],
  },
  {
    id: 'a-telescopes', strand: 'stars', level: 'sr', tracks: ['uk', 'us', 'ib', 'au'], unit: unitTools, icon: 'telescope', minutes: 11,
    title: ['Telescopes and the electromagnetic spectrum', '望远镜与电磁波谱'],
    blurb: ['Lenses and mirrors, why aperture matters, and why some telescopes must fly above the air, from FAST to JWST.', '透镜和反射镜、口径为什么重要、为什么有的望远镜必须飞到大气层外——从中国天眼到韦布。'],
    keys: [
      ['A refractor focuses light with a lens; a reflector with a curved mirror. All the largest optical telescopes are reflectors.', '折射望远镜用透镜聚光，反射望远镜用凹面镜聚光。最大的光学望远镜都是反射式的。'],
      ['Light-gathering power grows as the square of the aperture D; finer detail (resolution) also needs a bigger D.', '集光力与口径 D 的平方成正比；口径越大，分辨率也越高（能看清更细的细节）。'],
      ['Light is one part of the electromagnetic spectrum (radio → gamma rays). The air lets through only visible light, some infrared and radio, so other telescopes go to space.', '可见光只是电磁波谱（无线电波 → 伽马射线）的一部分。大气只让可见光、部分红外线和无线电波通过，所以其他波段的望远镜要上太空。'],
      ['China’s FAST (500 m radio dish), LAMOST and the planned CSST, with Hubble and JWST, each look at the sky in different ways.', '中国天眼 FAST（500 米射电望远镜）、郭守敬望远镜 LAMOST、规划中的巡天空间望远镜 CSST，以及哈勃和韦布，各以不同方式观测宇宙。'],
    ],
    steps: [
      {
        title: ['The refractor: a lens', '折射望远镜：透镜'],
        astro: { kit: 'optics', view: 'refractor', D: 80, f: 900 },
        body: ['Light from a star arrives as parallel rays. A refractor’s big front lens, the objective, bends them so they meet at the focus; a small eyepiece then magnifies that image. Galileo turned one on the sky in 1609 and saw Jupiter’s moons. But a lens bends each colour slightly differently, leaving coloured fringes (chromatic aberration), and a big lens is heavy and can be held only by its edge, so it sags. The largest refractor ever built, at Yerkes Observatory (1897), has a lens of just 1.02 m.', '星光以平行光到达。折射望远镜前端的大透镜叫物镜，它把光线折向焦点会聚，再用小小的目镜把像放大。1609 年伽利略用它观察星空，发现了木星的卫星。但透镜对不同颜色的光折射程度略有不同，会产生彩色镶边（色差）；大透镜又重，只能托住边缘，容易下垂变形。世界上最大的折射望远镜在叶凯士天文台（1897 年），物镜口径只有 1.02 米。'],
      },
      {
        title: ['The reflector: a mirror', '反射望远镜：反射镜'],
        astro: { kit: 'optics', view: 'reflector', D: 200, f: 1000 },
        body: ['In 1668 Isaac Newton used a concave mirror instead. A mirror reflects every colour the same way, so there is no colour fringing. Light does not pass through it, so only the front surface must be perfect, and it can be supported from behind. A small flat mirror (the secondary) sends the light out to the side. That is why every big optical telescope today is a reflector, some with mirrors made of many segments.', '1668 年，牛顿改用凹面镜聚光。反射镜对各种颜色的光反射方式相同，没有色差；光不穿过镜体，只需磨好正面，而且可以从背后支撑。镜筒中的小平面镜（副镜）把光引到侧面观看。所以今天所有大型光学望远镜都是反射式的，有的主镜由许多块拼接而成。'],
      },
      {
        title: ['Lab: build your telescope', '实验：设计你的望远镜'],
        task: ['Change the aperture and focal length; watch the light grasp, the resolution and the double star.', '改变口径和焦距，观察集光力、分辨率和双星图像的变化。'],
        astro: {
          kit: 'optics', view: 'reflector', clock: { from: 0, to: 1, rate: 0.1, unit: 'x', hold: true, fmt: ['Scope', '望远镜'] },
          params: [
            { id: 'D', name: ['Aperture D', '口径 D'], min: 20, max: 1000, value: 60, step: 2, fmt: ['{v} mm', '{v} 毫米'] },
            { id: 'f', name: ['Focal length f', '焦距 f'], min: 200, max: 5000, value: 600, step: 50, fmt: ['{v} mm', '{v} 毫米'] },
          ],
          tasks: [
            { text: ['Gather 1,000 times as much light as your eye.', '让集光力达到人眼的 1000 倍。'], done: p => (p.D / 7) ** 2 >= 1000 },
            { text: ['Split stars 0.5″ apart (resolution 0.5″ or better).', '分辨相距 0.5″ 的两颗星（分辨率达到 0.5″ 或更好）。'], done: p => 138 / p.D <= 0.5 },
            { text: ['Reach 100× with the 20 mm eyepiece.', '用 20 毫米目镜达到 100 倍放大。'], done: p => p.f / 20 >= 100 },
          ],
        },
        body: ['A telescope’s most important number is its aperture D, the width of the lens or mirror. It collects light over its area, so light grasp goes as D²: compared with a dark-adapted pupil of 7 mm, a 70 mm telescope gathers (70/7)² = 100 times as much light and shows far fainter stars. A bigger aperture also blurs less, so it splits close double stars: resolution ≈ 138″ ÷ D (mm). Magnification is just focal length ÷ eyepiece focal length, and on its own it is not worth much: magnifying a dim, blurry image only gives a bigger blur.', '望远镜最重要的参数是口径 D，即透镜或反射镜的直径。它按面积收集光，所以集光力与 D² 成正比：与暗适应后 7 毫米的瞳孔相比，70 毫米的望远镜集光力是 (70/7)² = 100 倍，能看到暗得多的星。口径越大，像越清晰，越能分开靠得很近的双星：分辨率 ≈ 138″ ÷ D（毫米）。放大倍数等于物镜焦距 ÷ 目镜焦距，单靠放大并没有多大用处：把又暗又糊的像放大，只会得到更大的一团模糊。'],
      },
      {
        title: ['More than meets the eye', '看不见的光'],
        astro: { kit: 'optics', view: 'spectrum' },
        body: ['Visible light is a narrow slice of the electromagnetic spectrum. In order of decreasing wavelength: radio waves, microwaves, infrared, visible light, ultraviolet, X-rays and gamma rays. All travel at the speed of light. Different objects shine in different bands: cold dust and newborn stars in infrared, hot gas round black holes in X-rays, cold hydrogen and pulsars in radio. But our atmosphere absorbs most of the spectrum. Only two wide “windows” reach the ground: visible light (with some infrared) and radio.', '可见光只是电磁波谱中很窄的一段。按波长从长到短依次是：无线电波、微波、红外线、可见光、紫外线、X 射线和伽马射线，它们都以光速传播。不同的天体在不同波段发光：冷尘埃和新生恒星发红外线，黑洞周围的热气体发 X 射线，冷氢气和脉冲星发射电波。但大气层吸收了大部分波段，只有两个宽“窗口”能到达地面：可见光（加部分红外线）和无线电波。'],
      },
      {
        title: ['Why go to space', '为什么要上太空'],
        astro: { kit: 'optics', view: 'spectrum', scopes: true },
        body: ['To see in ultraviolet, X-rays or most of the infrared, a telescope must rise above the air. Space also removes the twinkling that blurs ground images. The Hubble Space Telescope (1990, 2.4 m mirror) orbits about 540 km up and sees ultraviolet, visible and near-infrared light. The James Webb Space Telescope (launched 25 December 2021) has a 6.5 m mirror of 18 gold-coated segments and works in the infrared, 1.5 million km from Earth, where it can stay very cold. China’s Xuntian survey telescope (CSST), with a 2 m mirror and a field of view about 300 times Hubble’s, is planned to fly near the Tiangong space station.', '要观测紫外线、X 射线或大部分红外线，望远镜必须升到大气层之上。太空中也没有使地面图像模糊的星光闪烁。哈勃空间望远镜（1990 年发射，主镜 2.4 米）在约 540 千米高的轨道上观测紫外、可见光和近红外。詹姆斯·韦布空间望远镜（2021 年 12 月 25 日发射）的主镜口径 6.5 米，由 18 块镀金镜片拼成，在距地球 150 万千米处保持极低温，专攻红外。中国的巡天空间望远镜（CSST）口径 2 米，视场约为哈勃的 300 倍，计划与天宫空间站共轨飞行。'],
      },
      {
        title: ['China’s Sky Eye', '中国天眼'],
        astro: { kit: 'optics', view: 'dish' },
        body: ['Radio waves pass through the air, so radio telescopes stay on the ground, and they must be huge because radio waves are long. FAST, the Five-hundred-meter Aperture Spherical radio Telescope, fills a natural karst hollow in Pingtang, Guizhou. Its 4,450 panels can reshape a 300 m patch into a paraboloid that focuses the waves onto a feed cabin hung from cables. Led by Nan Rendong and finished in 2016, it is the world’s largest single dish and has found more than 1,000 pulsars. China’s LAMOST (Guo Shoujing Telescope) at Xinglong uses 4,000 optical fibres to record the spectra of 4,000 stars at once, over 20 million so far.', '无线电波能穿过大气，所以射电望远镜建在地面；又因为电波波长很长，射电望远镜必须做得很大。FAST（500 米口径球面射电望远镜）建在贵州平塘的天然喀斯特洼地中，4450 块反射面板可以把其中 300 米口径的区域变成抛物面，把电波会聚到用索吊起的馈源舱。它由南仁东主持建设，2016 年落成，是世界最大的单口径射电望远镜，已发现 1000 多颗脉冲星。河北兴隆的郭守敬望远镜（LAMOST）用 4000 根光纤同时拍摄 4000 个天体的光谱，已获得 2000 多万条光谱。'],
      },
    ],
    quiz: [
      { q: ['A telescope has a 210 mm aperture. How many times more light does it gather than a 7 mm pupil?', '一架望远镜口径 210 毫米，它的集光力是 7 毫米瞳孔的多少倍？'], num: { answer: 900, tol: 20, unit: ['times', '倍'] },
        why: ['(210 ÷ 7)² = 30² = 900.', '集光力之比 = (210 ÷ 7)² = 30² = 900 倍。'] },
      { q: ['Why are all the largest optical telescopes reflectors?', '为什么最大的光学望远镜都是反射式的？'],
        options: [['Mirrors can be supported from behind and have no colour fringing', '反射镜可以从背后支撑，而且没有色差'], ['Mirrors magnify more than lenses', '反射镜比透镜放大倍数高'], ['Lenses cannot focus starlight', '透镜不能会聚星光'], ['Reflectors need no eyepiece', '反射望远镜不需要目镜']], answer: 0,
        why: ['A big lens sags and splits colours; a mirror reflects all colours alike and is held up from the back.', '大透镜会下垂并产生色差；反射镜对各色光反射相同，又能从背后支撑。'] },
      { q: ['Put the electromagnetic spectrum in order, longest wavelength first.', '把电磁波按波长从长到短排序。'],
        order: [['Radio', '无线电波'], ['Microwave', '微波'], ['Infrared', '红外线'], ['Visible', '可见光'], ['Ultraviolet', '紫外线'], ['X-ray', 'X 射线'], ['Gamma ray', '伽马射线']],
        why: ['Radio waves can be metres long; gamma rays are smaller than an atom’s nucleus.', '无线电波的波长可达数米，伽马射线的波长比原子核还小。'] },
      { q: ['Match each telescope to what it does.', '把望远镜与它的特点配对。'],
        match: [[['FAST', '中国天眼 FAST'], ['500 m radio dish in Guizhou', '贵州的 500 米射电望远镜']], [['JWST', '韦布空间望远镜'], ['Infrared, 1.5 million km away', '在 150 万千米外观测红外']], [['Hubble', '哈勃空间望远镜'], ['2.4 m mirror in low orbit since 1990', '1990 年起在近地轨道，主镜 2.4 米']], [['LAMOST', '郭守敬望远镜'], ['Spectra of 4,000 stars at once', '同时拍摄 4000 个天体的光谱']]],
        why: ['Each looks in its own way: radio, infrared, visible/UV from orbit, and mass spectroscopy.', '它们各有所长：射电、红外、近地轨道的可见光/紫外观测，以及大规模光谱巡天。'] },
      { q: ['Which kinds of light must be observed from space?', '哪些波段必须到太空去观测？'],
        options: [['X-rays', 'X 射线'], ['Most ultraviolet', '大部分紫外线'], ['Gamma rays', '伽马射线'], ['Visible light', '可见光'], ['Radio waves', '无线电波']], multi: [0, 1, 2],
        why: ['The air blocks X-rays, gamma rays and most ultraviolet. Visible light and radio pass through the windows.', '大气挡住了 X 射线、伽马射线和大部分紫外线；可见光和无线电波能穿过大气窗口。'] },
      { q: ['Tap the point where the lens brings the starlight together.', '点出透镜把星光会聚到的位置。'], astro: { kit: 'optics', view: 'refractor', D: 80, f: 900 }, pick: 'focus',
        why: ['Parallel rays meet at the focus, one focal length behind the objective; the eyepiece magnifies the image there.', '平行光在物镜后一个焦距处会聚到焦点，目镜放大那里的像。'] },
    ],
  },
  {
    id: 'a-stargazing', strand: 'sky', level: 'jr', tracks: ['uk', 'ib', 'au'], unit: unitSky, icon: 'eye', minutes: 10,
    title: ['Stargazing for beginners', '观星入门'],
    blurb: ['Magnitudes, dark skies and dark-adapted eyes: how to see more stars, find Polaris and catch a meteor shower.', '星等、暗夜和暗适应：怎样看到更多的星，找到北极星，迎接流星雨。'],
    keys: [
      ['Star brightness is measured in magnitudes: the smaller the number, the brighter the star; each step is about 2.512 times in brightness, so 5 steps = 100 times.', '恒星的亮度用星等表示：数值越小越亮；每差 1 等，亮度相差约 2.512 倍，差 5 等正好 100 倍。'],
      ['Light pollution brightens the sky: in a city you may see only stars brighter than magnitude 3–4, at a dark site down to about 6.5 and the Milky Way.', '光污染使夜空变亮：城市里也许只能看到 3～4 等以上的星，在暗夜地点能看到约 6.5 等的星和银河。'],
      ['Your eyes take 20–30 minutes to adapt to the dark; use a red light and avoid looking at screens.', '眼睛需要 20～30 分钟适应黑暗；使用红光手电，不要看手机屏幕。'],
      ['A star chart, the Big Dipper and binoculars are all you need to start: find Polaris, then the constellations around it.', '一张星图、北斗七星和一副双筒望远镜就能入门：先找北极星，再认识周围的星座。'],
    ],
    steps: [
      {
        title: ['Magnitudes: how bright?', '星等：有多亮？'],
        fig: magFig,
        astro: { kit: 'sky', view: 'dome', look: [180, 35], fov: 92, t: bj(2025, 1, 20, 21), cons: ['ori', 'cma', 'cmi', 'tau', 'aur', 'gem'], stars: ['Sirius', 'Betelgeuse', 'Rigel', 'Procyon', 'Aldebaran', 'Capella'] },
        body: ['Over 2,000 years ago Hipparchus sorted stars into six classes: the brightest were “first magnitude”, the faintest he could see “sixth”. In 1856 Norman Pogson made it exact: 5 magnitudes is exactly 100 times in brightness, so each magnitude is ×2.512 (because 2.512⁵ ≈ 100). A smaller number means brighter, and the brightest objects go below zero: Sirius, the brightest star of the night, is −1.46, Venus reaches −4.6, the full Moon −12.7 and the Sun −26.7. The winter sky has more first-magnitude stars than any other season.', '两千多年前，喜帕恰斯把星星分为六等：最亮的是“1 等星”，肉眼勉强能看见的是“6 等星”。1856 年波格森给出精确定义：相差 5 等，亮度正好相差 100 倍，所以每差 1 等是 2.512 倍（2.512⁵ ≈ 100）。数值越小越亮，最亮的天体星等是负数：夜空中最亮的恒星天狼星是 −1.46 等，金星可达 −4.6 等，满月 −12.7 等，太阳 −26.7 等。冬季星空的 1 等亮星比其他季节都多。'],
      },
      {
        title: ['Lab: light pollution', '实验：光污染'],
        task: ['Move the limiting magnitude between a city sky and a dark site.', '在城市夜空和暗夜地点之间调节极限星等。'],
        astro: {
          kit: 'sky', view: 'dome', look: [330, 42], fov: 100, t: bj(2025, 8, 15, 21), milkyway: true, dipper: true,
          clock: { from: 0, to: 4, rate: 0.4, unit: 'hour', hold: true, fmt: ['Tonight', '今晚'] },
          params: [{ id: 'mag', name: ['Faintest star you can see', '能看到的最暗星'], min: 1, max: 6.5, value: 4.5, step: 0.1, fmt: ['magnitude {v}', '{v} 等'], dp: 1 }],
          tasks: [
            { text: ['Make the Milky Way show.', '让银河显现出来。'], done: p => p.mag >= 5.5 },
            { text: ['Set a city sky of magnitude 3: how many stars of the Big Dipper remain?', '调到城市夜空的 3 等：北斗七星还剩几颗？'], done: p => Math.abs(p.mag - 3) <= 0.05 },
          ],
        },
        body: ['Street lights, signs and floodlights scatter off the air and wash out the sky. The faintest star you can see is the limiting magnitude. Under a dark, rural sky it is about 6.5 and some 9,000 stars cover the whole sky (about half above the horizon at once); in a city centre it may be 3–4 and only a few dozen remain. The Bortle scale (2001) rates the sky from 1 (excellent dark site) to 9 (inner city). Light pollution also wastes energy and confuses birds and insects; China and other countries now set up dark-sky reserves.', '路灯、广告牌和泛光灯的光被空气散射，把夜空“冲淡”了。能看到的最暗星的星等叫极限星等。在黑暗的乡村，极限星等约 6.5，全天约有 9000 颗星（同一时刻地平线上约一半）；在城市中心可能只有 3～4 等，只剩几十颗星。波特尔暗空分类（2001 年）把夜空从 1 级（极佳暗夜）分到 9 级（市中心）。光污染还浪费能源、干扰鸟类和昆虫；我国和其他国家已建立了一些暗夜保护地。'],
      },
      {
        title: ['Let your eyes adapt', '让眼睛适应黑暗'],
        astro: { kit: 'sky', view: 'dome', look: [330, 42], fov: 100, t: bj(2025, 8, 15, 21), milkyway: true, dipper: true, adapt: true, clock: { from: 0, to: 30, rate: 1.5, unit: 'x', dp: 0, once: true, fmt: ['{v} minutes in the dark', '进入黑暗 {v} 分钟'] } },
        body: ['Step out of a bright room and at first you see only the brightest stars. Your pupils open to about 7 mm within seconds, but the rods in your retina need 20–30 minutes to become fully sensitive. One glance at a white phone screen or torch resets much of it, so stargazers use a dim red light, which hardly disturbs the rods. Tip: a faint object is easier to see if you look slightly to one side of it (averted vision), where the retina has more rods.', '从明亮的房间走出来，起初只能看到最亮的几颗星。瞳孔几秒钟就能放大到约 7 毫米，但视网膜里的视杆细胞要 20～30 分钟才能完全变得灵敏。看一眼白色的手机屏幕或手电筒，大部分适应就前功尽弃了，所以观星者用暗红色的灯光，它几乎不影响视杆细胞。小窍门：看暗弱天体时，把目光稍稍偏向一旁（余光观察），那里的视杆细胞更多。'],
      },
      {
        title: ['Reading a star chart', '使用星图'],
        astro: { kit: 'sky', view: 'chart', dipper: true, marks: [{ ra: 37.95, dec: 89.26, name: ['Polaris', '北极星'], c: C.gold }] },
        body: ['A planisphere (rotating star chart) shows the stars above the horizon for any date and hour: turn it to tonight’s date and time, hold it above your head, and face north with the chart’s “north” edge down. Begin with the Big Dipper: the two stars at the end of its bowl point to Polaris, which marks north and barely moves all night. From there you can hop to Cassiopeia on the other side of the pole, and outward to the bright constellations of the season. Phone apps work too; switch them to red night mode.', '活动星图能显示任意日期和时刻地平线上的星空：把它转到当天的日期和时间，举过头顶，面朝北方，星图上的“北”朝下。先找北斗七星：斗口的两颗星指向北极星，它标示正北，整夜几乎不动。从这里可以找到天极另一侧的仙后座，再向外找到当季的亮星座。也可以用手机星图软件，记得切换到红色夜间模式。'],
      },
      {
        title: ['The Milky Way', '银河'],
        astro: { kit: 'sky', view: 'dome', look: [170, 40], fov: 105, t: bj(2025, 8, 1, 22), lat: 30, limit: 6.5, milkyway: true, cons: ['cyg', 'aql', 'lyr', 'sgr', 'sco'], names: true },
        body: ['The Milky Way is our own galaxy seen edge-on from inside: the light of hundreds of billions of distant stars merged into a soft band. It needs a dark sky of magnitude 5.5 or better and no Moon. From China it is best on summer evenings, when the bright, thick part toward the galaxy’s centre in Sagittarius stands in the south, and the band climbs past the Summer Triangle overhead. Light pollution means about a third of humanity, and most city dwellers, can no longer see it from home.', '银河是我们从内部侧看自己所在的星系：数千亿颗遥远恒星的光汇成一条柔和的光带。要看到它，需要极限星等 5.5 以上的暗夜，而且没有月光。在我国，夏季傍晚看银河最好：银心方向（人马座）明亮宽厚的部分在南方，光带向上经过头顶的夏季大三角。由于光污染，全世界约三分之一的人，以及大多数城市居民，在家里已看不到银河。'],
      },
      {
        title: ['Meteor showers', '流星雨'],
        astro: { kit: 'sky', view: 'dome', look: [45, 45], fov: 110, t: bj(2025, 8, 13, 2), limit: 6, milkyway: true, cons: ['per', 'cas'], meteors: { ra: 48, dec: 58, name: ['Perseids radiant', '英仙座流星雨辐射点'] } },
        body: ['When Earth crosses the trail of dust left by a comet, grains hit the air at tens of km per second and burn up as meteors. The streaks all seem to spread from one point, the radiant, which names the shower. The two best showers are the Perseids (peak about 12–13 August, from Comet Swift–Tuttle) and the Geminids (13–14 December). Tips: go somewhere dark after midnight, when your side of Earth faces forward into the dust; lie back and look at a wide area of sky, not straight at the radiant; and give it at least half an hour. No telescope needed.', '地球穿过彗星留下的尘埃带时，尘埃颗粒以每秒几十千米的速度冲入大气燃烧，形成流星。这些流星似乎都从同一点向外散开，这一点叫辐射点，流星雨以它所在的星座命名。最好看的两个流星雨是英仙座流星雨（约 8 月 12—13 日极大，来自斯威夫特—塔特尔彗星）和双子座流星雨（12 月 13—14 日）。窍门：午夜后到黑暗的地方去，那时你所在的半个地球正迎着尘埃前进；躺下来看一大片天空，不必直盯辐射点；至少坚持半小时。不需要望远镜。'],
      },
      {
        title: ['Binoculars: the best first telescope', '双筒望远镜：最好的入门工具'],
        astro: { kit: 'sky', view: 'dome', look: [75, 42], fov: 95, t: bj(2025, 11, 15, 21), limit: 6.5, milkyway: true, cons: ['and', 'cas', 'per', 'tau'], marks: [{ ra: 56.75, dec: 24.12, name: ['Pleiades (M45)', '昴星团 M45'], c: C.teal }, { ra: 10.68, dec: 41.27, name: ['Andromeda Galaxy (M31)', '仙女星系 M31'], c: C.pink }] },
        body: ['A pair of 10×50 binoculars (10 times magnification, 50 mm lenses) gathers about (50 ÷ 7)² ≈ 50 times the light of your eye and shows stars to about magnitude 9: tens of thousands more. Rest your elbows or use a tripod to keep them still. On an autumn evening try the Pleiades, a sparkling cluster in Taurus, and the Andromeda Galaxy, the most distant thing most people can see without a telescope, 2.5 million light-years away. Never point binoculars or a telescope at the Sun.', '一副 10×50 的双筒望远镜（放大 10 倍、物镜 50 毫米）的集光力约为人眼的 (50 ÷ 7)² ≈ 50 倍，能看到约 9 等的星，比肉眼多出几万颗。把手肘靠稳或用三脚架固定。秋天的晚上，试着看看金牛座里闪闪发光的昴星团，还有仙女星系——它距离我们 250 万光年，是大多数人不用天文望远镜就能看到的最遥远的天体。千万不要用双筒望远镜或天文望远镜看太阳。'],
      },
    ],
    quiz: [
      { q: ['A magnitude 1 star is how many times brighter than a magnitude 6 star?', '1 等星的亮度是 6 等星的多少倍？'], num: { answer: 100, tol: 3, unit: ['times', '倍'] },
        why: ['5 magnitudes = 2.512⁵ ≈ 100 times.', '相差 5 等，亮度相差 2.512⁵ ≈ 100 倍。'] },
      { q: ['Which is the brightest star in the night sky?', '夜空中最亮的恒星是'],
        options: [['Sirius', '天狼星'], ['Polaris', '北极星'], ['Vega', '织女星'], ['Betelgeuse', '参宿四']], answer: 0,
        why: ['Sirius, magnitude −1.46. Polaris is only about 2.0: it is famous for its position, not its brightness.', '天狼星，−1.46 等。北极星只有约 2 等，它出名是因为位置，而不是亮度。'] },
      { q: ['Order from brightest to faintest.', '按从亮到暗排序。'],
        order: [['The Sun', '太阳'], ['Full Moon', '满月'], ['Venus', '金星'], ['Sirius', '天狼星'], ['Polaris', '北极星']],
        why: ['−26.7, −12.7, up to −4.6, −1.46, about 2.0.', '−26.7 等、−12.7 等、最亮 −4.6 等、−1.46 等、约 2.0 等。'] },
      { q: ['Which help you see fainter stars?', '哪些做法能帮你看到更暗的星？'],
        options: [['Waiting 20–30 minutes in the dark', '在黑暗中等待 20～30 分钟'], ['Using a dim red light', '使用暗红色灯光'], ['Going far from city lights', '远离城市灯光'], ['Checking a bright phone screen often', '经常看明亮的手机屏幕'], ['Observing at full Moon', '在满月时观测']], multi: [0, 1, 2],
        why: ['Dark adaptation, red light and dark skies all help; bright screens and moonlight undo them.', '暗适应、红光和暗夜都有帮助；明亮的屏幕和月光会抵消这些努力。'] },
      { q: ['This is a city sky (limiting magnitude 3). Tap Polaris.', '这是城市夜空（极限星等 3 等）。点出北极星。'],
        astro: { kit: 'sky', view: 'dome', look: [0, 40], fov: 90, t: bj(2025, 10, 15, 21), limit: 3 }, pick: 'polaris',
        why: ['Follow the two end stars of the Dipper’s bowl about five times their spacing. Polaris (magnitude 2.0) survives even a city sky.', '沿北斗斗口两颗星的连线延长约 5 倍距离。北极星约 2 等，在城市里也能看到。'] },
      { q: ['Match each place to the faintest stars you can typically see.', '把地点与通常能看到的最暗星等配对。'],
        match: [[['Big-city centre', '大城市中心'], ['Magnitude 3–4', '3～4 等']], [['Suburbs', '郊区'], ['Magnitude about 5', '约 5 等']], [['Remote dark site', '偏远暗夜地点'], ['Magnitude 6.5 or fainter', '6.5 等或更暗']]],
        why: ['The darker the sky, the larger the limiting magnitude and the more stars you see.', '夜空越暗，极限星等越大，看到的星越多。'] },
      { q: ['Under a magnitude 3 sky, how many of the Big Dipper’s seven stars can still be seen?', '在极限星等 3 等的夜空下，北斗七星还能看到几颗？'], num: { answer: 6, tol: 0.5, unit: ['stars', '颗'] },
        why: ['Six are brighter than magnitude 3; Megrez, where the handle meets the bowl, is 3.3 and disappears.', '六颗比 3 等亮；位于斗柄与斗口连接处的天权星约 3.3 等，会消失。'] },
    ],
  },
];
