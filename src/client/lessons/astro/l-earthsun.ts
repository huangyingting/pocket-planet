/**
 * Astronomy lessons: the Sun and the Earth (senior). Solar radiation and solar activity, local time and time zones,
 * the noon Sun's altitude, and the length of day and night.
 */
import { C, T, mer, mk, type Fig, type LL, type Lesson, type Pair } from '../kit.ts';
import { svg, tx, type Lx } from '../figs.ts';
import type { Paint } from '../stage.ts';
import { subsolar } from '../../../shared/lib/sun.ts';

const unit: Pair = ['The Sun and the Earth', '太阳对地球的影响与地球运动'];
const D2R = Math.PI / 180;
const OB = 23.44;

// ------------------------------------------------------------------------------------------------ figures

/** Smoothed sunspot number (approximate, SILSO v2): [minimum, maximum, peak]; the last cycle is a projection. */
const CYCLES: [number, number, number][] = [[1976.2, 1979.9, 220], [1986.7, 1989.9, 213], [1996.6, 2001.9, 180], [2008.9, 2014.3, 116], [2019.9, 2024.8, 161], [2030.5, 2035, 130]];
function sunspots(y: number): number {
  let s = 3;
  for (let i = 0; i < CYCLES.length; i++) {
    const [a, p, A] = CYCLES[i], end = (CYCLES[i + 1]?.[0] ?? a + 11) + 1.2;
    if (y < a || y > end) continue;
    s += y < p ? A * Math.sin(((Math.PI / 2) * (y - a)) / (p - a)) ** 2 : A * Math.cos((Math.PI / 2) * Math.min(1, (y - p) / (end - p))) ** 2;
  }
  return s;
}

/** Sunspot number 1986–2031: cycles 22–25 (approximate shape). */
const cycleFig: Fig = {
  k: 'svg', draw: (L: Lx) => {
    const x0 = 30, x1 = 312, y0 = 150, y1 = 34, Y0 = 1986, Y1 = 2031, MX = 240;
    const X = (y: number) => x0 + ((y - Y0) / (Y1 - Y0)) * (x1 - x0), Yp = (n: number) => y0 - (n / MX) * (y0 - y1);
    let o = tx(4, 12, L(['The 11-year sunspot cycle', '太阳黑子数的 11 年周期']), 'fg-title');
    o += tx(4, 23, L(['smoothed monthly sunspot number (approximate); after 2025 a projection', '月均黑子数（平滑，近似）；2025 年后为预测']), 'fg-sub');
    for (const n of [0, 100, 200]) o += `<line x1="${x0}" x2="${x1}" y1="${Yp(n)}" y2="${Yp(n)}" class="fg-grid"/>` + tx(x0 - 4, Yp(n) + 3, String(n), 'fg-tick', 'e');
    for (let y = 1990; y <= 2030; y += 10) o += tx(X(y), y0 + 11, String(y), 'fg-tick', 'm');
    const pts = (a: number, b: number) => Array.from({ length: Math.round((b - a) * 6) + 1 }, (_, i) => { const y = a + i / 6; return `${X(y).toFixed(1)},${Yp(sunspots(y)).toFixed(1)}`; }).join(' ');
    o += `<polyline points="${pts(Y0, 2025.4)}" fill="none" stroke="${C.gold}" stroke-width="1.6" class="fg-line"/>`;
    o += `<polyline points="${pts(2025.4, Y1)}" fill="none" stroke="${C.gold}" stroke-width="1.2" stroke-dasharray="3 2" opacity=".7"/>`;
    [[1989.9, 22], [2001.9, 23], [2014.3, 24], [2024.8, 25]].forEach(([y, n], i) => {
      o += `<g class="f-fade" style="--d:${(0.3 + i * 0.25).toFixed(2)}s">` + tx(X(y), Yp(sunspots(y)) - 5, L([`cycle ${n}`, `第 ${n} 周期`]), 'fg-label', 'm') + '</g>';
    });
    o += `<g class="f-fade" style="--d:1.4s"><line x1="${X(2008.9)}" x2="${X(2019.9)}" y1="${y0 - 8}" y2="${y0 - 8}" stroke="${C.teal}" stroke-width="1"/>` + tx((X(2008.9) + X(2019.9)) / 2, y0 - 11, L(['≈ 11 years', '约 11 年']), 'fg-label', 'm') + '</g>';
    return svg(320, 164, o, L(['Sunspot number from 1986 to 2031', '1986—2031 年太阳黑子数']));
  },
};

/** Noon Sun altitude through the year at a few latitudes. */
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const decOf = (m: number) => subsolar(Date.UTC(2025, m - 1, 15, 4))[0];
const noonFig: Fig = {
  k: 'line', title: ['Noon Sun altitude through the year', '一年中正午太阳高度的变化'], unit: ['°', '°'], x: MONTHS, min: 0, max: 90,
  series: [
    { name: ['Guangzhou 23.1°N', '广州 23.1°N'], c: C.orange, y: MONTHS.map(m => Math.round(90 - Math.abs(23.1 - decOf(m)))) },
    { name: ['Beijing 39.9°N', '北京 39.9°N'], c: C.gold, y: MONTHS.map(m => Math.round(90 - Math.abs(39.9 - decOf(m)))) },
    { name: ['Harbin 45.8°N', '哈尔滨 45.8°N'], c: C.blue, y: MONTHS.map(m => Math.round(90 - Math.abs(45.8 - decOf(m)))) },
  ],
};
const dayLen = (lat: number, dec: number) => { const c = -Math.tan(lat * D2R) * Math.tan(dec * D2R); return c >= 1 ? 0 : c <= -1 ? 24 : (2 * Math.acos(c)) / D2R / 15; };
const dayFig: Fig = {
  k: 'line', title: ['Day length through the year', '一年中昼长的变化'], unit: ['hours', '小时'], x: MONTHS, min: 0, max: 24,
  series: [
    { name: ['Equator', '赤道'], c: C.white, y: MONTHS.map(() => 12) },
    { name: ['Guangzhou', '广州'], c: C.orange, y: MONTHS.map(m => Math.round(dayLen(23.1, decOf(m)) * 10) / 10) },
    { name: ['Harbin', '哈尔滨'], c: C.blue, y: MONTHS.map(m => Math.round(dayLen(45.8, decOf(m)) * 10) / 10) },
    { name: ['Arctic 70°N', '北纬 70°'], c: C.violet, y: MONTHS.map(m => Math.round(dayLen(70, decOf(m)) * 10) / 10) },
  ],
};

// ------------------------------------------------------------------------------------------------ globe drawings

/** The 24 ideal time zones (15° strips), zone 0 gold and UTC+8 red. */
const ZONES: Paint[] = Array.from({ length: 24 }, (_, i) => {
  const z = i - 11;
  const c = z === 0 ? C.gold : z === 8 ? C.red : i % 2 ? C.blue : C.violet;
  return z === 12 ? { fill: { k: 'strip', w: 172.5, e: -172.5, c }, t: i * 0.08, a: 0.3 } : { fill: { k: 'strip', w: z * 15 - 7.5, e: z * 15 + 7.5, c }, t: i * 0.08, a: 0.3 };
});
/** China's five theoretical zones, UTC+5 … UTC+9. */
const CHINA_ZONES: Paint[] = [5, 6, 7, 8, 9].map((z, i) => ({ fill: { k: 'strip', w: z * 15 - 7.5, e: z * 15 + 7.5, c: z === 8 ? C.red : i % 2 ? C.blue : C.violet }, t: 0.4 + i * 0.15, a: 0.22 }));
/** The International Date Line, simplified. */
const DATE_LINE: LL[] = [[89.9, 180], [75, 180], [68, -169], [65.5, -169], [52.5, 170], [48, 180], [5, 180], [4, -150], [-10, -150], [-11, -171], [-16, -171.5], [-45, -172.5], [-51, 180], [-89.9, 180]];
const BEIJING: LL = [39.9, 116.4], KASHGAR: LL = [39.5, 76.0], FUYUAN: LL = [48.4, 134.3];
const EQ = T.marchNoonChina, Y25 = Date.UTC(2025, 0, 1, 4), Y26 = Date.UTC(2025, 11, 31, 4);

export const A_EARTHSUN: Lesson[] = [
  {
    id: 'a-solar-activity', strand: 'earthsun', level: 'sr', tracks: ['us'], unit, icon: 'sun', minutes: 8,
    title: ['Solar radiation and solar activity', '太阳辐射和太阳活动'],
    blurb: ['Where the Earth\'s energy comes from, and how storms on the Sun reach us.', '地球的能量从哪里来，太阳上的“风暴”又怎样影响地球。'],
    keys: [
      ['Solar radiation is the main source of energy at the Earth\'s surface: it drives winds, water and life; coal and oil are stored solar energy.', '太阳辐射是地球表面最主要的能量来源：推动大气和水的运动、维持生命活动；煤、石油是地质时期储存的太阳能。'],
      ['The Sun\'s atmosphere has three layers: photosphere (sunspots), chromosphere (flares, prominences) and corona (solar wind).', '太阳大气由里向外分为光球层（黑子）、色球层（耀斑、日珥）和日冕层（太阳风）。'],
      ['Sunspots and flares wax and wane together in a cycle of about 11 years.', '黑子和耀斑的多少同步变化，周期约为 11 年。'],
      ['Solar activity disturbs the ionosphere (shortwave radio) and the magnetic field (magnetic storms), lights up aurorae, and threatens satellites, GPS and power grids.', '太阳活动扰动电离层（短波通信中断），扰动地球磁场（磁暴），产生极光，并危及卫星、导航和电网。'],
    ],
    steps: [
      {
        title: ['The Earth\'s power station', '地球的能量源泉'],
        astro: { kit: 'sun', mode: 'energy' },
        body: ['The Sun pours out energy in every direction; the Earth intercepts about one part in 2.2 billion, still about 1361 W on every square metre facing the Sun above the air. This solar radiation warms the land and sea, drives the winds, ocean currents and the water cycle, and feeds photosynthesis. Coal, oil and gas are solar energy stored by plants and plankton millions of years ago.', '太阳向四面八方辐射能量，地球只接收到其中约二十二亿分之一，但在大气上界、垂直于太阳光的每平方米上仍有约 1361 瓦。太阳辐射使地表增温，推动大气运动、洋流和水循环，为光合作用提供能量。煤、石油、天然气是地质历史时期生物固定、积累下来的太阳能。'],
      },
      {
        title: ['Layers of the Sun\'s atmosphere', '太阳大气的分层'],
        astro: { kit: 'sun', mode: 'layers', labels: 'layers' },
        body: ['What we see as the Sun\'s surface is the photosphere, about 5,500 °C, seething with granules of rising gas. Above it lies the thin, red chromosphere and then the faint, million-degree corona, which streams away as the solar wind. The chromosphere and corona are normally lost in the glare: you see them during a total solar eclipse.', '我们看到的太阳“表面”是光球层，温度约 5500 °C，布满米粒状的对流组织。它外面是薄薄的、发红的色球层，最外面是稀薄而温度高达上百万度的日冕层，不断向外抛出带电粒子流——太阳风。色球层和日冕层平时被光球层的强光淹没，日全食时才能看到。'],
      },
      {
        title: ['Sunspots, flares and the 11-year cycle', '黑子、耀斑和 11 年周期'],
        astro: { kit: 'sun', mode: 'layers', labels: 'features', clock: { from: Date.UTC(2007, 0, 1), to: Date.UTC(2031, 0, 1), rate: 500, unit: 'date', at: 0.3 } },
        fig: cycleFig,
        body: ['Sunspots are cooler, darker patches of the photosphere where strong magnetic fields hold back the heat; flares are sudden brightenings in the chromosphere above them, releasing in minutes the energy of billions of nuclear bombs. Prominences are loops of gas lifted by the field. The number of sunspots rises and falls about every 11 years (cycle 25 peaked around 2024–25), and flares follow it, so sunspots are the sign of solar activity.', '黑子是光球层上温度较低而显得较暗的区域，那里的强磁场阻碍了热量上涌；耀斑是黑子上方色球层中突然增亮的现象，几分钟内释放出巨大的能量。日珥是被磁场托起的气体环。黑子数大约每 11 年起落一次（第 25 周期约在 2024—2025 年达到高峰），耀斑也同步增减，所以黑子是太阳活动强弱的标志。'],
      },
      {
        title: ['A storm crosses space', '太阳风暴奔向地球'],
        astro: { kit: 'sun', mode: 'flare', clock: { from: 0, to: 72, rate: 6, unit: 'hour' } },
        body: ['A big flare is often followed by a coronal mass ejection (CME): a billion tonnes of magnetised plasma flung out at 500–2,000 km/s. It takes one to three days to reach the Earth. There the magnetosphere, the Earth\'s magnetic field squeezed on the day side by the solar wind into a bow shock, deflects most of it, but the storm shakes the field and drives particles down along the field lines towards the poles.', '大耀斑常伴随日冕物质抛射：数十亿吨带磁场的等离子体以每秒 500—2000 千米的速度被抛出，1—3 天后到达地球。地球磁场被太阳风压扁在向阳一侧，形成弓形激波，挡住了大部分带电粒子；但太阳风暴会剧烈扰动磁场，并把带电粒子沿磁力线引向两极地区。'],
      },
      {
        title: ['Aurora', '极光'],
        astro: { kit: 'sun', mode: 'aurora' },
        body: ['Guided down near the magnetic poles, the particles hit the upper atmosphere 100–300 km up and make it glow: oxygen green low down and red higher, nitrogen violet. The aurora forms an oval ring round each magnetic pole, at about 65–70° magnetic latitude; in a strong storm it spreads towards the equator, and in May 2024 it was seen as far south as northern China.', '带电粒子在磁极附近沉降，撞击 100—300 千米高空的稀薄大气使之发光：较低处的氧原子发绿光、较高处发红光，氮发紫光。极光在每个磁极周围形成一个椭圆形的光环（极光卵），大约位于磁纬 65°—70°；磁暴强烈时极光带向低纬扩展，2024 年 5 月我国北方也看到了极光。'],
      },
      {
        title: ['Space weather at home', '太阳活动对地球的影响'],
        astro: { kit: 'sun', mode: 'effects' },
        body: ['A flare\'s X-rays disturb the ionosphere on the day side within minutes, cutting shortwave radio. A magnetic storm makes compasses swing, drags and damages satellites, upsets GPS positioning, and induces currents in long power lines: in March 1989 it blacked out Québec for nine hours. Space-weather forecasts watch the Sun to give warning.', '耀斑的 X 射线几分钟内就会扰动白昼半球的电离层，使短波通信中断；磁暴会使磁针剧烈摆动（“磁暴”），干扰甚至损坏人造卫星，影响导航定位，还会在长距离输电线中感应出电流——1989 年 3 月加拿大魁北克因此停电 9 小时。空间天气预报通过监测太阳活动提前预警。'],
      },
    ],
    quiz: [
      { q: ['Tap a sunspot on the Sun.', '在太阳上点出一个黑子。'], astro: { kit: 'sun', mode: 'layers', labels: 'none' }, pick: 'sunspot',
        why: ['Sunspots are the dark patches on the photosphere, cooler than their surroundings.', '黑子是光球层上温度较低、显得较暗的斑点。'] },
      { q: ['In which layer of the Sun\'s atmosphere do flares occur?', '耀斑发生在太阳大气的哪一层？'], options: [['Chromosphere', '色球层'], ['Photosphere', '光球层'], ['Corona', '日冕层'], ['The core', '日核']], answer: 0,
        why: ['Flares are sudden brightenings in the chromosphere, above sunspot groups; sunspots are in the photosphere, the solar wind comes from the corona.', '耀斑是色球层中突然增亮的现象，常出现在黑子群上方；黑子在光球层，太阳风来自日冕层。'] },
      { q: ['About how long is the cycle of solar activity?', '太阳活动的周期大约是多少年？'], options: [['11 years', '11 年'], ['1 year', '1 年'], ['76 years', '76 年'], ['100 years', '100 年']], answer: 0,
        why: ['Sunspot numbers (and flares) peak about every 11 years.', '黑子数和耀斑大约每 11 年出现一次高峰。'] },
      { q: ['Which is NOT an effect of solar activity on the Earth?', '下列哪项不是太阳活动对地球的影响？'], options: [['Earthquakes', '引发地震'], ['Aurorae', '产生极光'], ['Shortwave radio blackouts', '短波通信中断'], ['Magnetic storms', '产生磁暴']], answer: 0,
        why: ['Earthquakes come from the Earth\'s own internal energy, not from the Sun.', '地震的能量来自地球内部，与太阳活动无关。'] },
      { q: ['Coal is a store of energy that originally came from…', '煤炭中储存的能量最初来自'], options: [['the Sun', '太阳辐射'], ['the Earth\'s core', '地球内部'], ['the Moon\'s gravity', '月球引力'], ['volcanoes', '火山活动']], answer: 0,
        why: ['Plants captured sunlight by photosynthesis; buried and compressed, they became coal.', '古代植物通过光合作用固定太阳能，被埋藏后形成煤炭。'] },
    ],
  },
  {
    id: 'a-time-zones', strand: 'earthsun', level: 'sr', tracks: [], unit, icon: 'clock', minutes: 8,
    title: ['Local time, time zones and the date line', '地方时、时区和日界线'],
    blurb: ['Work out the time anywhere, and find where on Earth the new day has begun.', '算出任何地方的时间，找出地球上哪些地方已进入新的一天。'],
    keys: [
      ['Local time: 15° of longitude = 1 hour, 1° = 4 minutes; places further east are later.', '地方时：经度相差 15° 时间相差 1 小时，相差 1° 相差 4 分钟；东早西晚。'],
      ['24 time zones, each 15° wide; zone = longitude ÷ 15, rounded. Zone time: east add, west subtract.', '全球分 24 个时区，各跨经度 15°；时区数 = 经度 ÷ 15（四舍五入）。区时计算“东加西减”。'],
      ['Beijing Time is the local time of 120°E (UTC+8), used across China\'s five theoretical zones.', '北京时间是东经 120° 的地方时（东八区区时），我国跨五个时区但统一使用北京时间。'],
      ['The new day runs east from the midnight (0:00) meridian to 180°; at UTC 12:00 (Beijing 20:00) the whole world shares one date.', '新的一天从 0 时所在经线向东到 180° 经线；协调世界时 12 时（北京时间 20 时）全球同属一天。'],
    ],
    steps: [
      {
        title: ['Local time', '地方时'], cam: [32, 105, 3.6], night: true, sun: true,
        clock: { mode: 'day', start: T.marchNoonChina, rate: 0 },
        paint: [{ fill: { k: 'land', a2: ['CN'], c: C.gold }, a: 0.15 }],
        lines: [mer(120, C.red, 0, { w: 1.3 }), mer(116.4, C.gold, 0.4), mer(76, C.teal, 0.8), mer(134.3, C.violet, 1.2)],
        marks: [
          mk([30, 120], '120°E: 12:00', '东经 120°：12:00', { c: C.red, big: true, t: 0.3 }),
          mk(BEIJING, 'Beijing 116.4°E: 11:46', '北京 116.4°E：11:46', { dot: true, c: C.gold, t: 0.8 }),
          mk(KASHGAR, 'Kashgar 76°E: 9:04', '喀什 76°E：9:04', { dot: true, c: C.teal, t: 1.3 }),
          mk(FUYUAN, 'Fuyuan 134.3°E: 12:57', '抚远 134.3°E：12:57', { dot: true, c: C.violet, t: 1.8 }),
        ],
        body: ['Local (sun) time is set by the Sun: it is 12:00 when the Sun crosses your meridian. The Earth turns 360° in 24 hours, so 15° = 1 hour and 1° = 4 minutes, and places to the east see noon first. When the Sun is due south at 120°E, Beijing (3.6° further west) is 14.4 minutes behind, about 11:46, Kashgar 44° west is at 9:04, and Fuyuan in the far east already at 12:57.', '因经度不同而不同的时刻叫地方时，太阳上中天时为当地正午 12 时。地球 24 小时自转 360°，经度相差 15° 地方时相差 1 小时，相差 1° 相差 4 分钟，东边的地点先到正午（东早西晚）。东经 120° 正午时，北京（偏西 3.6°）晚 14.4 分钟，约 11:46；喀什偏西 44°，是 9:04；最东的抚远已是 12:57。'],
      },
      {
        title: ['Twenty-four zones', '时区和区时'], cam: [25, 60, 5.4], night: true, sketch: true,
        clock: { mode: 'day', start: T.marchNoonChina, rate: 1.5 },
        paint: ZONES,
        marks: [mk([60, 0], 'Zone 0 (UTC)', '中时区', { c: C.gold, t: 0.9 }), mk([60, 120], 'UTC+8', '东八区', { c: C.red, t: 1.6 }), mk([60, -75], 'UTC−5', '西五区', { c: C.blue, t: 0.6 }), mk([-30, 180], 'East/West 12', '东西十二区', { c: C.violet, t: 2 })],
        body: ['Local times are impractical, so the world is divided into 24 time zones, each 15° wide, centred on the meridians 0°, 15°, 30°… Each zone keeps the local time of its central meridian: its zone time. A place\'s zone is its longitude ÷ 15, rounded (116°E → 7.7 → UTC+8). Between two zones, the time differs by the number of zones: east add, west subtract.', '为方便统一，全球按经度划分为 24 个时区，每个时区跨经度 15°，以 0°、15°、30°……为中央经线，各时区统一使用中央经线的地方时，叫区时。某地所在时区 = 经度 ÷ 15，四舍五入（东经 116° → 7.7 → 东八区）。两地相差几个时区，区时就相差几小时，“东加西减”。'],
      },
      {
        title: ['One clock for China', '北京时间'], cam: [35, 105, 3.2], night: true, sun: true,
        clock: { mode: 'day', start: T.marchNoonChina, rate: 0.3 },
        paint: [{ fill: { k: 'land', a2: ['CN'], c: C.gold }, a: 0.2 }, ...CHINA_ZONES],
        lines: [mer(120, C.red, 0.3, { w: 1.4 })],
        marks: [mk([20, 75], 'UTC+5', '东五区', { c: C.violet, t: 0.5 }), mk([20, 90], '+6', '东六区', { c: C.blue, t: 0.65 }), mk([20, 105], '+7', '东七区', { c: C.violet, t: 0.8 }), mk([20, 120], 'UTC+8 · 120°E', '东八区 · 东经 120°', { c: C.red, big: true, t: 0.95 }), mk([20, 135], '+9', '东九区', { c: C.violet, t: 1.1 })],
        body: ['China spans about 73°E to 135°E, which covers five zones, UTC+5 to UTC+9, but the whole country uses Beijing Time: the local time of 120°E, which is UTC+8. So in Xinjiang the Sun is highest at about 14:00 Beijing Time, and people there often keep a local “Xinjiang time” two hours behind for daily life.', '我国领土东西跨经度 60 多度（约东经 73°—135°），跨东五区到东九区五个时区，但全国统一使用北京时间，即东经 120° 的地方时（东八区区时）。所以新疆的正午在北京时间 14 时左右，当地生活中也常用比北京时间晚 2 小时的“新疆时间”。'],
      },
      {
        title: ['Two dates at once', '两个日期'], cam: [20, 60, 6], night: true, sun: true, wide: true, sketch: true,
        clock: { mode: 'day', start: EQ, rate: 0 },
        paint: [{ fill: { k: 'strip', w: -60, e: 180, c: C.gold }, a: 0.22, t: 0.4 }, { fill: { k: 'strip', w: 180, e: -60, c: C.violet }, a: 0.28, t: 0.8 }],
        lines: [mer(-60, C.teal, 0, { w: 1.4 }), { pts: DATE_LINE, c: C.gold, t: 0.3, dur: 2.5, w: 1.4 }],
        marks: [mk([10, -60], '0:00 midnight (60°W)', '0 时经线（西经 60°）', { c: C.teal, big: true, t: 0.5 }), mk([45, 60], '20 March (new day)', '3 月 20 日（新的一天）', { c: C.gold, big: true, t: 1.2 }), mk([45, -120], '19 March', '3 月 19 日', { c: C.violet, big: true, t: 1.6 }), mk([-20, 180], 'Date line ≈ 180°', '日界线 ≈ 180°', { c: C.gold, t: 2 })],
        body: ['There are always two date boundaries. One is the midnight meridian, where the local time is 0:00; it sweeps west 15° every hour. The other is the International Date Line, near 180°, which stays put. From midnight east to 180° it is already the new day. At 12:00 Beijing Time (04:00 UTC) midnight is at 60°W, so 240° of 360°, two-thirds of the world, is on the new date. Crossing the date line westward, add a day; eastward, subtract one.', '地球上始终有两条日期分界线：一条是 0 时所在的经线，它每小时向西移动 15°；另一条是国际日期变更线（日界线），大致沿 180° 经线，位置固定。从 0 时经线向东到 180° 经线是“新的一天”。北京时间 12 时（协调世界时 4 时），0 时经线在西经 60°，新的一天范围占 240°，即全球的三分之二。向西越过日界线日期加一天，向东越过减一天。'],
      },
      {
        title: ['One date for the whole world', '全球同一日期'], cam: [20, 180, 6], night: true, sun: true, wide: true, sketch: true,
        clock: { mode: 'day', start: Date.UTC(2025, 2, 20, 12), rate: 0 },
        paint: [{ fill: { k: 'strip', w: -180, e: 180, c: C.gold }, a: 0.18, t: 0.4 }],
        lines: [mer(180, C.teal, 0, { w: 1.6 })],
        marks: [mk([10, 180], '180°: 0:00', '180°：0 时', { c: C.teal, big: true, t: 0.5 }), mk([45, 120], 'Beijing 20:00, 20 March', '北京 3 月 20 日 20 时', { c: C.red, t: 1 }), mk([40, -100], 'Everywhere: 20 March', '全球都是 3 月 20 日', { c: C.gold, big: true, t: 1.5 })],
        body: ['When midnight reaches 180°, the two boundaries coincide and, for an instant, the whole world shares one date. That happens at 12:00 UTC, which is 20:00 Beijing Time. One hour later midnight has moved to 165°E and a new date begins again just west of the date line.', '当 0 时经线与 180° 经线重合时，两条分界线合二为一，全球处在同一日期。这发生在协调世界时 12 时，也就是北京时间 20 时。再过一小时，0 时经线移到东经 165°，日界线西侧又开始了新的一天。'],
      },
    ],
    quiz: [
      { q: ['A is at 120°E and B at 90°E. When the local time at A is 10:00, what is it at B?', '甲地位于东经 120°，乙地位于东经 90°。甲地地方时 10 时，乙地地方时是'], options: [['08:00', '8 时'], ['12:00', '12 时'], ['09:30', '9 时 30 分'], ['10:30', '10 时 30 分']], answer: 0,
        why: ['30° apart = 2 hours, and B is to the west, so its clock is behind: 10 − 2 = 8:00.', '经度差 30°，时差 2 小时；乙在西边，东早西晚：10 − 2 = 8 时。'] },
      { q: ['At 12:00 Beijing Time, what is the local time in Kashgar (76°E)?', '北京时间 12 时，喀什（东经 76°）的地方时约是'], options: [['09:04', '9 时 04 分'], ['14:56', '14 时 56 分'], ['12:00', '12 时'], ['10:00', '10 时']], answer: 0,
        why: ['Beijing Time is the local time of 120°E. 120 − 76 = 44°, × 4 min = 176 min = 2 h 56 min earlier: 9:04.', '北京时间是东经 120° 的地方时。经度差 44°，× 4 分钟 = 176 分钟 = 2 小时 56 分，西减：9 时 04 分。'] },
      { q: ['In which time zone is Lhasa (91°E)?', '拉萨（东经 91°）位于哪个时区？'], options: [['UTC+6', '东六区'], ['UTC+8', '东八区'], ['UTC+9', '东九区'], ['UTC+5', '东五区']], answer: 0,
        why: ['91 ÷ 15 ≈ 6.1, rounded to 6: UTC+6 (82.5°E–97.5°E), even though Lhasa uses Beijing Time.', '91 ÷ 15 ≈ 6.1，四舍五入为 6，属东六区（东经 82.5°—97.5°），尽管拉萨使用北京时间。'] },
      { q: ['At 12:00 Beijing Time, what share of the world is already on the new date?', '北京时间 12 时，全球进入新一天的范围约占'], options: [['Two-thirds', '三分之二'], ['One-half', '二分之一'], ['One-third', '三分之一'], ['All of it', '全部']], answer: 0,
        why: ['04:00 UTC: midnight is at 60°W. From 60°W east to 180° is 240°, 240/360 = 2/3.', '此时协调世界时 4 时，0 时经线在西经 60°。从西经 60° 向东到 180° 共 240°，占 240/360 = 2/3。'] },
      { q: ['At what Beijing Time does the whole world share the same date?', '北京时间几时，全球处于同一日期？'], options: [['20:00', '20 时'], ['08:00', '8 时'], ['00:00', '0 时'], ['12:00', '12 时']], answer: 0,
        why: ['When it is 0:00 at 180°, i.e. 12:00 UTC = 20:00 Beijing Time.', '当 180° 经线为 0 时，即协调世界时 12 时 = 北京时间 20 时。'] },
    ],
  },
  {
    id: 'a-noon-sun', strand: 'earthsun', level: 'sr', tracks: [], unit, icon: 'ruler', minutes: 7,
    title: ['The noon Sun\'s altitude', '正午太阳高度'],
    blurb: ['How high the Sun climbs at noon, from place to place and season to season, and why it matters for houses.', '正午太阳有多高？它怎样随纬度和季节变化，又怎样决定楼间距。'],
    keys: [
      ['Noon Sun altitude H = 90° − |φ − δ|: φ the latitude, δ the latitude of the subsolar point.', '正午太阳高度 H = 90° − |当地纬度 − 直射点纬度|。'],
      ['H is highest at the subsolar point (90°) and falls away from it to the north and south.', '正午太阳高度由直射点向南北两侧递减。'],
      ['North of the Tropic of Cancer, H is highest at the summer solstice and lowest at the winter solstice.', '北回归线以北，夏至日正午太阳高度最大，冬至日最小。'],
      ['Buildings are spaced so the winter-solstice noon shadow does not reach the next block: L = h / tan H; solar heaters tilt at 90° − H.', '楼间距按冬至日正午影长确定：L = h / tan H；太阳能热水器倾角 = 90° − H。'],
    ],
    steps: [
      {
        title: ['Measuring the noon Sun', '正午太阳高度'],
        astro: { kit: 'rays', mode: 'noon', lat: 39.9, dec: OB, name: ['Beijing', '北京'] },
        body: ['The Sun\'s altitude is the angle between its rays and the local horizon. Sunlight arrives in parallel rays, and only at the subsolar point (where it is directly overhead, latitude δ) is the altitude 90°. Each degree of latitude away from it lowers the noon Sun by one degree: H = 90° − |φ − δ|. On 21 June (δ = 23.44°N) Beijing (39.9°N) has H = 90° − 16.5° = 73.5°.', '太阳高度是太阳光线与当地地平面的夹角。太阳光是平行光，只有太阳直射点（纬度为 δ）的正午太阳高度是 90°；离直射点每远 1 个纬度，正午太阳高度就减小 1°：H = 90° − |φ − δ|。夏至日直射点在北纬 23.44°，北京（39.9°N）的正午太阳高度 = 90° − 16.5° = 73.5°。'],
      },
      {
        title: ['From place to place', '随纬度变化'],
        astro: { kit: 'rays', mode: 'noon', dec: OB, clock: { from: -70, to: 85, rate: 12, unit: 'lat', at: 0.4 } },
        body: ['Slide the observer from south to north on the June solstice. The noon Sun is highest (90°) at the Tropic of Cancer and lower the further you go either way. North of the Arctic Circle it still stays above the horizon at midnight; south of the Antarctic Circle it never rises: H would be negative.', '在夏至日让观察者从南向北移动：北回归线上正午太阳高度为 90°，向南、向北都逐渐减小。北极圈以北太阳整天不落；南极圈以南太阳整天不出，按公式算出的 H 小于 0。'],
      },
      {
        title: ['From season to season', '随季节变化'],
        astro: { kit: 'rays', mode: 'noon', lat: 39.9, name: ['Beijing', '北京'], clock: { from: Y25, to: Y26, rate: 24, unit: 'date', at: 0.47 } },
        fig: noonFig,
        body: ['Because the Earth\'s axis is tilted 23.44°, the subsolar point moves between the Tropics in a year: on the Tropic of Cancer at the June solstice, the Equator at the equinoxes, the Tropic of Capricorn at the December solstice. So Beijing\'s noon Sun swings from 73.5° in June to 26.6° in December. North of the Tropic of Cancer it is highest at the summer solstice and lowest at the winter solstice.', '由于地轴倾斜 23.44°，太阳直射点一年中在南北回归线之间来回移动：夏至日直射北回归线，春分、秋分日直射赤道，冬至日直射南回归线。所以北京的正午太阳高度从夏至日的 73.5° 降到冬至日的 26.6°。北回归线以北各地，夏至日正午太阳高度达一年中最大，冬至日最小。'],
      },
      {
        title: ['Spacing buildings', '确定楼间距'],
        astro: { kit: 'rays', mode: 'spacing', clock: { from: 18, to: 50, rate: 2.5, unit: 'lat', fmt: ['Latitude {v}°N', '北纬 {v}°'], dp: 1 } },
        body: ['Every flat should get some winter sunshine, so the gap between blocks is set by the shortest-sun day, the winter solstice. At noon the front block casts a shadow L = h / tan H. For 20 m blocks that is about 20 m in Guangzhou (H ≈ 43.5°) but 40 m in Beijing (26.6°) and 53 m in Harbin (20.7°): the further north, the wider the spacing.', '为了让每户冬季都能照到阳光，楼间距要按一年中正午太阳高度最小的冬至日来算：正午时前楼的影长 L = h / tan H。同样 20 米高的楼，广州（H ≈ 43.5°）约需 20 米，北京（26.6°）约需 40 米，哈尔滨（20.7°）约需 53 米。纬度越高，楼间距越大。'],
      },
      {
        title: ['Tilting a solar water heater', '太阳能热水器的倾角'],
        astro: { kit: 'rays', mode: 'spacing', heater: true, clock: { from: 18, to: 50, rate: 2.5, unit: 'lat', fmt: ['Latitude {v}°N', '北纬 {v}°'], dp: 1, at: 0.6 } },
        body: ['A solar collector works best when the rays hit it square on. Then the panel and the horizon make an angle of 90° − H, so the tilt should be steeper where the Sun is lower: further north and in winter. Many heaters can be re-angled with the seasons; a fixed one is usually set at about the latitude.', '太阳光线与集热板垂直时效果最好，此时集热板与地面的夹角（倾角）= 90° − H。太阳越低，倾角越大：纬度越高、越接近冬季，集热板要立得越陡。有的热水器可以随季节调节倾角；固定安装的一般取与当地纬度相近的角度。'],
      },
    ],
    quiz: [
      { q: ['Tap the subsolar point, where the Sun is directly overhead.', '点出太阳直射点。'], astro: { kit: 'rays', mode: 'noon', lat: 39.9, dec: 12 }, pick: 'subsolar',
        why: ['The subsolar point is where the rays meet the surface head-on, at latitude δ.', '太阳直射点是太阳光线垂直射到地面的地方，其纬度为 δ。'] },
      { q: ['What is Beijing\'s (40°N) noon Sun altitude on the winter solstice?', '冬至日北京（40°N）的正午太阳高度约为'], options: [['26.5°', '26.5°'], ['50°', '50°'], ['73.5°', '73.5°'], ['16.5°', '16.5°']], answer: 0,
        why: ['δ = −23.44°: H = 90° − |40° − (−23.44°)| = 90° − 63.44° ≈ 26.5°.', '直射点在 23.44°S：H = 90° − (40° + 23.44°) ≈ 26.5°。'] },
      { q: ['On the June solstice, where is the noon Sun altitude 90°?', '夏至日，正午太阳高度为 90° 的地方在'], options: [['Tropic of Cancer', '北回归线'], ['Equator', '赤道'], ['Arctic Circle', '北极圈'], ['Tropic of Capricorn', '南回归线']], answer: 0,
        why: ['On 21 June the subsolar point is at 23.44°N, the Tropic of Cancer.', '夏至日太阳直射北回归线（23.44°N）。'] },
      { q: ['Why do blocks of flats in Harbin stand further apart than in Guangzhou?', '为什么哈尔滨的楼间距比广州大？'], options: [['The winter noon Sun is lower, so shadows are longer', '冬季正午太阳高度更低，影子更长'], ['Land is cheaper', '土地更便宜'], ['It snows more', '降雪更多'], ['Days are longer in winter', '冬季白昼更长']], answer: 0,
        why: ['Further north the noon Sun is lower (20.7° vs 43.5° at the winter solstice), so L = h / tan H is larger.', '纬度高，冬至日正午太阳高度低（20.7° 对 43.5°），影长 L = h / tan H 更大。'] },
      { q: ['Where the noon Sun is 50° high, at what angle to the ground should a solar panel be set?', '某地正午太阳高度为 50°，太阳能集热板与地面的夹角应调为'], options: [['40°', '40°'], ['50°', '50°'], ['90°', '90°'], ['25°', '25°']], answer: 0,
        why: ['For the rays to hit square on, tilt = 90° − H = 40°.', '使太阳光线与集热板垂直，倾角 = 90° − H = 40°。'] },
    ],
  },
  {
    id: 'a-day-length', strand: 'earthsun', level: 'sr', tracks: [], unit, icon: 'globe', minutes: 7,
    title: ['Day and night: how long?', '昼夜长短的变化'],
    blurb: ['Why summer days are long, and why the Arctic has days that never end.', '为什么夏季白昼长，北极地区又为什么会有“不落的太阳”。'],
    keys: [
      ['The terminator (day–night line) cuts the Earth in half; how much of a latitude circle lies on the day side sets the day length.', '晨昏线把地球分成昼半球和夜半球；某纬线圈上昼弧的长短决定当地昼长。'],
      ['At the equinoxes the terminator passes through the poles: 12 hours everywhere. The Equator always has 12 hours.', '春分、秋分日晨昏线通过两极，全球昼夜等长（各 12 小时）；赤道上终年昼夜等长。'],
      ['When the subsolar point is in the north, northern days are longer than nights, longer the further north; north of 90° − δ there is polar day. The south is the opposite.', '直射点在北半球时，北半球昼长夜短，纬度越高昼越长，北纬 (90° − δ) 以北出现极昼；南半球相反。'],
      ['Day length = 2 × (12 − sunrise time) in local time; cos H₀ = −tan φ · tan δ.', '昼长 = 2 ×（12 − 日出时刻）（地方时）；cos H₀ = −tan φ · tan δ。'],
    ],
    steps: [
      {
        title: ['The terminator', '晨昏线'],
        astro: { kit: 'rays', mode: 'daylen', dec: 0 },
        body: ['Half the Earth faces the Sun at any moment. The circle between the day hemisphere and the night hemisphere is the terminator: along it the Sun is rising (the dawn line) or setting (the dusk line). As the Earth turns, each place is carried round its latitude circle; the fraction of that circle on the day side is the fraction of 24 hours that is daytime. At the equinoxes the terminator runs through both poles and halves every circle: 12 hours of day and 12 of night everywhere.', '任何时刻地球都有一半被太阳照亮。昼半球和夜半球的分界线叫晨昏线，由夜进入昼的是晨线，由昼进入夜的是昏线。地球自转时，各地沿所在纬线圈运动，纬线圈在昼半球的部分（昼弧）占多少，白昼就占 24 小时的多少。春分、秋分日，晨昏线通过两极，平分所有纬线圈，全球昼夜等长，各 12 小时。'],
      },
      {
        title: ['The June solstice', '夏至日'],
        astro: { kit: 'rays', mode: 'daylen', dec: OB },
        body: ['The Earth\'s axis is tilted 23.44°. On 21 June the North Pole leans towards the Sun: the terminator no longer passes through the poles, and in the north each latitude circle has a longer day arc than night arc. The further north, the longer the day: about 13.4 h in Guangzhou, 14.8 h in Beijing, 15.5 h in Harbin (a few minutes more with refraction). North of the Arctic Circle the whole circle is lit: polar day, the midnight Sun. The Equator still has 12 hours.', '地轴倾斜 23.44°。6 月 22 日前后（夏至日），北极倾向太阳，晨昏线不再通过两极，北半球各纬线圈昼弧长于夜弧，昼长夜短，且纬度越高白昼越长：广州约 13.4 小时，北京约 14.8 小时，哈尔滨约 15.5 小时（大气折射还会多出几分钟）。北极圈以北整个纬线圈都在昼半球，出现极昼。赤道上仍是昼夜等长。'],
      },
      {
        title: ['The December solstice', '冬至日'],
        astro: { kit: 'rays', mode: 'daylen', dec: -OB },
        body: ['Six months later everything is reversed. The South Pole leans towards the Sun, northern days are short (Harbin about 8.5 h) and north of the Arctic Circle there is polar night, while Antarctica has 24-hour daylight. Whichever hemisphere holds the subsolar point has days longer than nights.', '半年后情况正好相反：12 月 22 日前后（冬至日），南极倾向太阳，北半球昼短夜长（哈尔滨约 8.5 小时），北极圈以北出现极夜，南极圈以南出现极昼。太阳直射点在哪个半球，哪个半球就昼长夜短。'],
      },
      {
        title: ['Through the year', '一年中的变化'],
        astro: { kit: 'rays', mode: 'daylen', clock: { from: Y25, to: Y26, rate: 20, unit: 'date' } },
        fig: dayFig,
        body: ['As the subsolar point travels between the Tropics, day lengths change: in the northern hemisphere days grow from the December solstice to the June solstice and shrink after it. The higher the latitude, the bigger the swing; at the Equator nothing changes. The day length follows cos H₀ = −tan φ · tan δ, where H₀ is half the day arc; day length = 2H₀ ÷ 15° per hour.', '随着直射点在南北回归线之间移动，各地昼长不断变化：北半球从冬至日到夏至日白昼渐长，夏至日后渐短。纬度越高，昼长的年变化越大；赤道上终年不变。昼长可用 cos H₀ = −tan φ · tan δ 计算，H₀ 为半个昼弧所对的角度，昼长 = 2H₀ ÷ 15°/小时。'],
      },
      {
        title: ['Why it happens: the tilt', '原因：地轴倾斜'],
        astro: { kit: 'model', kind: 'seasons', clock: { from: Y25, to: Y26, rate: 20, unit: 'date' } },
        body: ['As the Earth orbits the Sun its axis keeps pointing the same way in space, towards Polaris. In June the northern half leans sunward, in December the southern half. That one fact moves the subsolar point between the Tropics, and with it the noon Sun\'s altitude, the day length and the seasons.', '地球绕太阳公转时，地轴的空间指向保持不变，北端始终指向北极星附近。6 月北半球倾向太阳，12 月南半球倾向太阳。正是这一点使太阳直射点在南北回归线之间移动，从而带来正午太阳高度、昼夜长短的变化和四季更替。'],
      },
    ],
    quiz: [
      { q: ['On this day, tap the region that has polar day.', '这一天，点出出现极昼的区域。'], astro: { kit: 'rays', mode: 'daylen', dec: OB }, pick: 'polarday',
        why: ['With the subsolar point at 23.44°N, everywhere north of the Arctic Circle (66.56°N) is lit all day.', '直射点在 23.44°N 时，北极圈（66.56°N）以北全天都在昼半球，出现极昼。'] },
      { q: ['On the March equinox, how long is the day in Harbin?', '春分日，哈尔滨的昼长约是'], options: [['12 hours', '12 小时'], ['15.5 hours', '15.5 小时'], ['8.5 hours', '8.5 小时'], ['24 hours', '24 小时']], answer: 0,
        why: ['At the equinoxes the terminator passes through the poles and halves every latitude circle.', '春分、秋分日晨昏线通过两极，平分所有纬线圈，全球昼夜等长。'] },
      { q: ['On 22 June, which city has the longest day?', '6 月 22 日，下列城市中白昼最长的是'], options: [['Harbin', '哈尔滨'], ['Beijing', '北京'], ['Guangzhou', '广州'], ['Singapore', '新加坡']], answer: 0,
        why: ['When the subsolar point is in the north, the further north, the longer the day.', '直射点在北半球时，北半球纬度越高白昼越长。'] },
      { q: ['At a place the Sun rises at 05:00 local time. How long is the day?', '某地日出时间为地方时 5 时，该地昼长为'], options: [['14 hours', '14 小时'], ['10 hours', '10 小时'], ['12 hours', '12 小时'], ['17 hours', '17 小时']], answer: 0,
        why: ['The day is symmetric about local noon: 12 − 5 = 7 hours before noon, so 2 × 7 = 14 hours.', '白昼以地方时 12 时为中心对称：日出到正午 7 小时，昼长 = 2 × 7 = 14 小时。'] },
      { q: ['On the December solstice, where is there polar night?', '冬至日，出现极夜的范围是'], options: [['North of the Arctic Circle', '北极圈以北'], ['South of the Antarctic Circle', '南极圈以南'], ['Between the Tropics', '南北回归线之间'], ['Nowhere', '没有极夜']], answer: 0,
        why: ['The subsolar point is at 23.44°S; the North Pole leans away, so north of 66.56°N stays dark.', '冬至日直射点在 23.44°S，北极背向太阳，北极圈以北全天处于夜半球。'] },
    ],
  },
];
