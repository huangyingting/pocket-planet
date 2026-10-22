/** Astronomy lessons: Earth and Moon (junior). The Sun and the Moon, phases and the lunar calendar, eclipses, tides. */
import { C, mk, type Fig, type LL, type Lesson, type Pair } from '../kit.ts';
import { svg, tx, arrowDef, type Lx } from '../figs.ts';

const unit: Pair = ['The Earth and the Moon', '地球和月球'];

// ------------------------------------------------------------------------------------------------ figures

/** The lit part of a Moon at phase angle `ph` (0 new … π full … 2π), seen from the northern hemisphere. */
function moonPath(cx: number, cy: number, r: number, ph: number): string {
  const p = ((ph % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const rx = (Math.abs(Math.cos(p)) * r).toFixed(1), top = `${cx} ${cy - r}`, bot = `${cx} ${cy + r}`;
  // waxing: lit on the right (crescent until first quarter, then gibbous); waning: lit on the left
  if (p < Math.PI) return `M${top} A${r} ${r} 0 0 1 ${bot} A${rx} ${r} 0 0 ${p < Math.PI / 2 ? 0 : 1} ${top}Z`;
  return `M${top} A${r} ${r} 0 0 0 ${bot} A${rx} ${r} 0 0 ${p < 1.5 * Math.PI ? 0 : 1} ${top}Z`;
}

const PHASES: { n: Pair; d: Pair }[] = [
  { n: ['New', '新月'], d: ['day 1', '初一'] },
  { n: ['Waxing crescent', '蛾眉月'], d: ['day 4', '初四'] },
  { n: ['First quarter', '上弦月'], d: ['day 8', '初七、八'] },
  { n: ['Waxing gibbous', '盈凸月'], d: ['day 11', '十一'] },
  { n: ['Full', '满月'], d: ['day 15', '十五、六'] },
  { n: ['Waning gibbous', '亏凸月'], d: ['day 19', '十九'] },
  { n: ['Last quarter', '下弦月'], d: ['day 23', '廿二、三'] },
  { n: ['Waning crescent', '残月'], d: ['day 26', '廿六'] },
];

/** The eight phases in a row with their names and lunar-calendar days; `ask` hides one name behind a “?”. */
function phaseStrip(ask?: number): Fig {
  return {
    k: 'svg', draw: (L: Lx, id: string) => {
      let o = tx(4, 12, L(['Phases of the Moon (seen from the northern hemisphere)', '月相变化（在北半球看）']), 'fg-title');
      o += tx(4, 23, L(['one lunar month ≈ 29.53 days', '一个朔望月约 29.53 天']), 'fg-sub');
      PHASES.forEach((p, i) => {
        const cx = 22 + i * 39.5, cy = 50, r = 14;
        o += `<g class="f-fade" style="--d:${(i * 0.12).toFixed(2)}s">`;
        o += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#2b3138" stroke="rgba(255,255,255,.25)" stroke-width=".6"/>`;
        if (i === 4) o += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#e9ecef"/>`;
        else if (i > 0) o += `<path d="${moonPath(cx, cy, r, (i * Math.PI) / 4)}" fill="#e9ecef"/>`;
        if (i === ask) {
          o += `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="${C.gold}" stroke-width="1.4"/>`;
          o += tx(cx, 84, '?', 'fg-title', 'm', ` style="fill:${C.gold}"`);
        } else {
          L(p.n).split(' ').forEach((s, k) => { o += tx(cx, 80 + k * 9, s, 'fg-label', 'm'); });
          if (ask === undefined) o += tx(cx, 103, L(p.d), 'fg-tick', 'm');
        }
        o += '</g>';
      });
      o += `<line x1="8" x2="156" y1="118" y2="118" stroke="${C.gold}" stroke-width="1.2" marker-end="url(#${id}a)"/>` + tx(10, 131, L(['waxing: lit part grows', '盈：亮面变大']), 'fg-sub');
      o += `<line x1="166" x2="314" y1="118" y2="118" stroke="${C.violet}" stroke-width="1.2" marker-end="url(#${id}b)"/>` + tx(168, 131, L(['waning: lit part shrinks', '亏：亮面变小']), 'fg-sub');
      return svg(320, 138, arrowDef(`${id}a`, C.gold) + arrowDef(`${id}b`, C.violet) + o, L(['Phases of the Moon', '月相']));
    },
  };
}

/** Sun, Moon and Earth with the Moon's umbra and penumbra (not to scale). */
const shadowFig: Fig = {
  k: 'svg', draw: (L: Lx, id: string) => {
    let o = `<defs><linearGradient id="${id}p" x1="0" x2="1"><stop offset="0" stop-color="#868e96" stop-opacity=".55"/><stop offset="1" stop-color="#868e96" stop-opacity=".22"/></linearGradient></defs>`;
    o += tx(4, 12, L(['A solar eclipse: the Moon\'s shadow', '日食：月球的影子']), 'fg-title') + tx(4, 23, L(['not to scale', '未按比例']), 'fg-sub');
    o += `<path d="M170 68 L290 35.4 L290 124.6 L170 92Z" fill="url(#${id}p)" class="f-fade" style="--d:.4s"/>`;
    o += `<path d="M170 68 L290 80 L170 92Z" fill="#0b0d12" opacity=".92" class="f-fade" style="--d:.8s"/>`;
    o += `<g stroke="${C.gold}" stroke-width=".6" opacity=".65" class="f-fade" style="--d:.2s"><line x1="30" y1="54" x2="290" y2="80"/><line x1="30" y1="106" x2="290" y2="80"/><line x1="30" y1="54" x2="290" y2="124.6"/><line x1="30" y1="106" x2="290" y2="35.4"/></g>`;
    o += `<circle cx="30" cy="80" r="26" fill="${C.gold}"/>` + tx(30, 122, L(['Sun', '太阳']), 'fg-label', 'm');
    o += `<circle cx="170" cy="80" r="12" fill="#adb5bd"/>` + tx(170, 108, L(['Moon', '月球']), 'fg-label', 'm');
    o += `<circle cx="335" cy="80" r="50" fill="#1c7ed6"/>` + tx(312, 146, L(['Earth', '地球']), 'fg-label', 'm');
    o += `<line x1="246" y1="79" x2="236" y2="48" stroke="#fff" stroke-width=".6"/>` + tx(236, 44, L(['umbra: total', '本影：日全食']), 'fg-label', 'm');
    o += `<line x1="262" y1="108" x2="236" y2="134" stroke="#fff" stroke-width=".6"/>` + tx(236, 143, L(['penumbra: partial', '半影：日偏食']), 'fg-label', 'm');
    return svg(320, 152, o, L(['Umbra and penumbra', '本影和半影']));
  },
};

/** Tide height at one port over two days: two highs and two lows a day, 12 h 25 min apart. */
const tideFig: Fig = {
  k: 'svg', draw: (L: Lx, id: string) => {
    const x0 = 30, x1 = 312, y0 = 48, y1 = 120, P = 12.42;
    const X = (h: number) => x0 + (h / 48) * (x1 - x0), Y = (v: number) => (y0 + y1) / 2 - (v * (y1 - y0)) / 2.4;
    let o = tx(4, 12, L(['Tide height at one port over two days', '某港口两天内的潮位变化']), 'fg-title') + tx(4, 23, L(['metres above / below the average sea level', '高于或低于平均海面（米）']), 'fg-sub');
    for (const v of [-1, 0, 1]) o += `<line x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" class="${v ? 'fg-grid' : 'fg-zero'}"/>` + tx(x0 - 4, Y(v) + 3, (v > 0 ? '+' : '') + v, 'fg-tick', 'e');
    for (let h = 0; h <= 48; h += 6) o += tx(X(h), y1 + 12, `${h} h`, 'fg-tick', 'm');
    const pts: string[] = [];
    for (let h = 0; h <= 48; h += 0.5) pts.push(`${X(h).toFixed(1)},${Y(Math.cos((2 * Math.PI * (h - 2)) / P)).toFixed(1)}`);
    o += `<polyline points="${pts.join(' ')}" class="fg-line f-draw" pathLength="1" style="stroke:${C.blue}"/>`;
    for (let k = 0; k < 4; k++) {
      const h = 2 + k * P, d = `--d:${(0.6 + k * 0.25).toFixed(2)}s`;
      o += `<circle cx="${X(h).toFixed(1)}" cy="${Y(1)}" r="2.4" fill="${C.ice}" class="f-fade" style="${d}"/>`;
      if (k) o += tx(X(h), Y(1) - 5, L(['high', '高潮']), 'fg-sub f-fade', 'm', ` style="${d}"`);
    }
    o += `<line x1="${X(2)}" x2="${X(2 + P)}" y1="${y0 - 10}" y2="${y0 - 10}" stroke="${C.gold}" stroke-width=".8" marker-start="url(#${id}t)" marker-end="url(#${id}t)"/>` + tx(X(2 + P / 2), y0 - 13, L(['12 h 25 min', '12 小时 25 分']), 'fg-sub', 'm');
    return svg(320, 140, arrowDef(`${id}t`, C.gold) + o, L(['Tide height over two days', '两天内的潮位']));
  },
};

/** When each main phase rises, is highest (due south) and sets, in local sun time: the Moon is about 6 h later each quarter. */
const RISE: [Pair, string, string, string, Pair][] = [
  [['New', '新月'], '6:00', '12:00', '18:00', ['not seen (lost in the glare)', '看不见（淹没在阳光里）']],
  [['First quarter', '上弦月'], '12:00', '18:00', '0:00', ['evening, in the south and west', '上半夜，南方和西方天空']],
  [['Full', '满月'], '18:00', '0:00', '6:00', ['all night long', '整夜可见']],
  [['Last quarter', '下弦月'], '0:00', '6:00', '12:00', ['after midnight, before dawn', '下半夜到清晨，东方天空']],
];
const riseFig: Fig = {
  k: 'svg', draw: (L: Lx) => {
    let o = tx(4, 12, L(['When is each phase in the sky?', '不同月相什么时候出现在天空？']), 'fg-title') + tx(4, 23, L(['approximate local sun time', '当地地方时，约数']), 'fg-sub');
    const X = [4, 74, 112, 152, 190];
    const HEAD: Pair[] = [['Phase', '月相'], ['Rises', '升起'], ['Due south', '正南'], ['Sets', '落下'], ['Best seen', '观看时段']];
    HEAD.forEach((h, i) => { o += tx(X[i], 40, L(h), 'fg-sub'); });
    RISE.forEach((r, k) => {
      const y = 56 + k * 17;
      o += `<g class="f-fade" style="--d:${(0.2 + k * 0.2).toFixed(1)}s">` + tx(X[0], y, L(r[0]), 'fg-label') + tx(X[1], y, r[1], 'fg-tick') + tx(X[2], y, r[2], 'fg-tick') + tx(X[3], y, r[3], 'fg-tick') + tx(X[4], y, L(r[4]), 'fg-tick') + '</g>';
    });
    o += tx(4, 130, L(['each day the Moon rises about 50 minutes later', '月亮每天升起的时间推迟约 50 分钟']), 'fg-sub');
    return svg(320, 136, o, L(['Moonrise and moonset by phase', '各月相的升落时间']));
  },
};

/** Central lines of two total solar eclipses over China (NASA / F. Espenak path tables). */
const ECL2009: LL[] = [[23.4, 78.9], [26.3, 88.0], [27.8, 93.7], [28.8, 98.2], [29.5, 102.0], [30.0, 105.4], [30.4, 108.4], [30.6, 111.2], [30.8, 114.0], [30.8, 116.3], [30.7, 118.6], [30.6, 120.8], [30.5, 122.8], [30.2, 125.8], [29.5, 129.4], [28.3, 134.4], [26.6, 138.9]];
const ECL2035: LL[] = [[38.1, 79.6], [39.5, 91.8], [40.0, 97.3], [40.2, 101.4], [40.3, 104.8], [40.3, 107.7], [40.3, 110.3], [40.3, 112.7], [40.2, 114.8], [40.1, 116.9], [40.0, 118.7], [39.7, 122.2], [39.3, 125.3], [38.9, 128.1], [38.3, 132.0], [37.6, 135.4], [36.8, 138.6], [36.0, 141.5]];

// ------------------------------------------------------------------------------------------------ lessons

export const A_EARTHMOON: Lesson[] = [
  {
    id: 'a-sun-moon', strand: 'earthmoon', level: 'jr', tracks: ['uk', 'us', 'ib'], unit, icon: 'sun', minutes: 9,
    title: ['The Sun and the Moon', '太阳和月球'],
    blurb: ['How big and how far: a star 109 times wider than the Earth, and a dusty, airless Moon.', '有多大、有多远：直径是地球 109 倍的恒星，和没有空气、布满尘土的月球。'],
    keys: [
      ['The Sun is about 1.39 million km across, 109 times the Earth; the Moon is 3,474 km, about a quarter of the Earth.', '太阳直径约 139 万千米，是地球的 109 倍；月球直径 3474 千米，约为地球的 1/4。'],
      ['The Moon is about 384,400 km away (about 30 Earths); the Sun about 150 million km (light takes 8 min 20 s).', '月球距地球约 38.44 万千米（约 30 个地球排起来）；太阳约 1.5 亿千米（光要走约 8 分 20 秒）。'],
      ['The Moon has no air and no liquid water; its surface is covered in craters and dark lava plains.', '月球上没有空气，也没有液态水；月面布满环形山和暗色的熔岩平原（月海）。'],
      ['The Sun is a star: a ball of hot gas that makes its own energy by nuclear fusion in its core.', '太阳是一颗恒星：一个炽热的气体球，核心的核聚变产生巨大能量。'],
      ['The Sun is about 400 times wider and 400 times farther than the Moon, so both look the same size in our sky.', '太阳直径约为月球的 400 倍，距离也约远 400 倍，所以两者在天上看起来差不多大。'],
      ['Solar activity (sunspots, flares) rises and falls in an 11-year cycle and can cause aurorae and radio blackouts on Earth.', '太阳活动（黑子、耀斑）约以 11 年为周期起伏，会引起地球上的极光和无线电短波通信中断。'],
    ],
    steps: [
      {
        title: ['Three very different sizes', '大小悬殊的三个天体'],
        astro: { kit: 'compare', mode: 'sizes', clock: { from: 0, to: 1, rate: 0.11, unit: 'x', fmt: ['Zooming out', '拉远视野'], once: true } },
        body: ['The Earth and the Moon beside the edge of the Sun, all to the same scale. The Sun is about 1.39 million km across: 109 Earths would fit across it, and about 1.3 million Earths inside it. The Moon is 3,474 km across, about a quarter of the Earth.', '图中地球、月球和太阳按同一比例画出。太阳的直径约 139 万千米，能并排放下 109 个地球，体积约是地球的 130 万倍。月球直径 3474 千米，约为地球的 1/4。'],
      },
      {
        title: ['How far is the Moon?', '月球离我们有多远？'],
        astro: { kit: 'compare', mode: 'distance', clock: { from: 0, to: 1.3, rate: 0.25, unit: 'x', fmt: ['{v} s', '{v} 秒'], dp: 1 } },
        body: ['On average the Moon is 384,400 km away: about 30 Earths in a row would just reach it. Light crosses that gap in about 1.3 seconds. The Sun is about 150 million km away, roughly 390 times farther; its light takes about 8 minutes 20 seconds to reach us.', '月球与地球的平均距离约为 38.44 万千米，大约 30 个地球排成一排才够得着。光走完这段距离只要约 1.3 秒。太阳离我们约 1.5 亿千米，大约是月球距离的 390 倍，太阳光要走约 8 分 20 秒才能到达地球。'],
      },
      {
        title: ['The Moon\'s surface', '月球表面'],
        astro: { kit: 'compare', mode: 'moon' },
        body: ['The Moon has no air and no liquid water, so there is no weather and no life. Craters from meteorite impacts stay almost unchanged for billions of years. The dark "seas" (maria) are really old lava plains. With no air to hold heat, the ground swings from about 127 °C in sunlight to about −173 °C at night.', '月球上没有空气，也没有液态水，所以没有天气变化，也没有生命。陨石撞击形成的环形山几十亿年来几乎保持原样。月面上暗色的“月海”其实是古老的熔岩平原，并没有水。没有大气保温，月面白天约 127 °C，夜晚可降到约 −173 °C。'],
      },
      {
        title: ['Standing on the Moon', '站在月球上'],
        astro: { kit: 'compare', mode: 'moon' },
        fig: { k: 'bars', title: ['The weight of a 60 kg astronaut', '质量 60 千克的航天员所受重力'], unit: ['newtons (N); the mass stays 60 kg', '单位：牛（N）；质量始终是 60 千克'],
          rows: [{ name: ['Moon', '月球'], v: 97, c: '#b9c0c8' }, { name: ['Mars', '火星'], v: 223, c: '#e07a52' }, { name: ['Earth', '地球'], v: 588, c: '#4dabf7' }] },
        body: ['The Moon has only 1/81 of the Earth\'s mass, so its gravity is about 1/6 as strong: an astronaut weighs a sixth as much and can leap high even in a heavy suit. With no air the sky is black even by day, sound cannot travel, and footprints stay for millions of years. China\'s Chang\'e-4 made the first landing on the far side in 2019, and Chang\'e-5 (2020) and Chang\'e-6 (2024, far side) brought rock samples home.', '月球的质量只有地球的 1/81，表面引力约为地球的 1/6：航天员在月球上受到的重力只有地球上的六分之一，穿着笨重的航天服也能跳得很高。月球上没有空气，白天天空也是黑的，声音无法传播，脚印可以保存数百万年。我国嫦娥四号 2019 年首次在月球背面着陆，嫦娥五号（2020 年）和嫦娥六号（2024 年，月球背面）把月壤样品带回了地球。'],
      },
      {
        title: ['The Sun is a star', '太阳是一颗恒星'],
        astro: { kit: 'compare', mode: 'sun' },
        body: ['The Sun is a huge ball of hot gas, mostly hydrogen and helium. In its core, at about 15 million °C, nuclear fusion turns hydrogen into helium and releases enormous energy, which reaches us as light and heat. Its visible surface, the photosphere, is about 5,500 °C and bubbles with granules. Never look straight at the Sun.', '太阳是一个巨大的炽热气体球，主要由氢和氦组成。核心温度约 1500 万 °C，氢在那里通过核聚变变成氦，释放出巨大的能量，以光和热的形式传到地球。我们看到的太阳表面叫光球层，温度约 5500 °C，布满“米粒组织”。千万不要直视太阳。'],
      },
      {
        title: ['Sunspots and solar storms', '黑子和太阳活动'],
        astro: { kit: 'sun', mode: 'layers', labels: 'features', clock: { from: Date.UTC(2007, 0, 1), to: Date.UTC(2031, 0, 1), rate: 500, unit: 'date', at: 0.3 } },
        body: ['Sunspots are darker patches of the photosphere, about 1,500 °C cooler than their surroundings, where strong magnetic fields hold back the heat. Above them, flares suddenly brighten and blast out radiation and charged particles. The number of sunspots rises and falls in a cycle of about 11 years; watch it change as the years run. When a big storm reaches the Earth it can cut shortwave radio, upset satellites and compasses, and light up aurorae near the poles.', '太阳黑子是光球层上比周围温度低约 1500 °C 而显得较暗的区域，那里的强磁场阻挡了热量上涌。黑子上方常会突然增亮，这就是耀斑，它会释放出强烈的辐射和带电粒子。黑子数大约以 11 年为周期起伏变化，可以看着年份推移观察黑子的增减。强烈的太阳活动到达地球时，会使无线电短波通信中断，干扰人造卫星和指南针，并在两极地区产生美丽的极光。'],
      },
      {
        title: ['A lucky coincidence', '奇妙的巧合'],
        astro: { kit: 'compare', mode: 'coincidence' },
        body: ['The Sun is about 400 times wider than the Moon, but it is also about 400 times farther away. So in our sky both look almost exactly the same size, about half a degree across. That is why the Moon can just cover the Sun in a total solar eclipse.', '太阳的直径约是月球的 400 倍，而它离我们的距离也约是月球的 400 倍。所以从地球上看，太阳和月球的大小几乎一样，都约为 0.5°。正因为如此，发生日全食时月球恰好能把太阳完全遮住。'],
      },
    ],
    quiz: [
      { q: ['About how many Earths would fit side by side across the Sun?', '太阳的直径上大约能并排放下多少个地球？'], astro: { kit: 'compare', mode: 'sizes' },
        options: [['109', '109 个'], ['4', '4 个'], ['1,000', '1000 个'], ['1.3 million', '130 万个']], answer: 0,
        why: ['The Sun\'s diameter is 109 times the Earth\'s. 1.3 million is how many Earths would fit inside it (by volume).', '太阳的直径是地球的 109 倍。130 万是按体积算，太阳里面能装下的地球个数。'] },
      { q: ['Tap the body that is about 400 times wider than the Moon.', '在图中点出直径约为月球 400 倍的天体。'], astro: { kit: 'compare', mode: 'coincidence', bare: true }, pick: 'sun',
        why: ['The Sun is about 400 times wider than the Moon and about 400 times farther away, so they look the same size.', '太阳的直径约是月球的 400 倍，距离也约远 400 倍，所以看起来一样大。'] },
      { q: ['The dark "seas" on the Moon are…', '月球上暗色的“月海”是'], astro: { kit: 'compare', mode: 'moon', bare: true }, options: [['old lava plains', '古老的熔岩平原'], ['oceans of water', '海洋'], ['shadows of mountains', '山的影子'], ['forests', '森林']], answer: 0,
        why: ['The maria are plains of dark basalt lava that flooded huge basins billions of years ago. The Moon has no liquid water.', '月海是几十亿年前熔岩填满巨大盆地后形成的暗色玄武岩平原。月球上没有液态水。'] },
      { q: ['Where does the Sun\'s energy come from?', '太阳的能量来自'], astro: { kit: 'compare', mode: 'sun' }, options: [['Nuclear fusion in its core', '核心的核聚变'], ['Burning coal', '燃烧煤炭'], ['Light reflected from the planets', '行星反射的光'], ['Volcanoes on its surface', '表面的火山']], answer: 0,
        why: ['In the Sun\'s core hydrogen nuclei fuse into helium, releasing huge amounts of energy.', '在太阳核心，氢原子核聚变成氦，释放出巨大的能量。'] },
      { q: ['Light travels 300,000 km per second and the Sun is 150 million km away. How many seconds does sunlight take to reach us?', '光速约为每秒 30 万千米，太阳距地球约 1.5 亿千米。太阳光到达地球需要多少秒？'], num: { answer: 500, tol: 10, unit: ['s', '秒'] },
        why: ['150,000,000 ÷ 300,000 = 500 s, about 8 minutes 20 seconds.', '150 000 000 ÷ 300 000 = 500 秒，约 8 分 20 秒。'] },
      { q: ['Gravity on the Moon is about 1/6 of the Earth\'s. A 60 kg astronaut weighs about 588 N on Earth. About how many newtons does she weigh on the Moon?', '月球表面引力约为地球的 1/6。质量 60 千克的航天员在地球上受到的重力约 588 牛，在月球上约为多少牛？'], num: { answer: 98, tol: 4, unit: ['N', '牛'] },
        why: ['588 ÷ 6 ≈ 98 N. Her mass is still 60 kg: only the pull on her is smaller.', '588 ÷ 6 ≈ 98 牛。她的质量仍然是 60 千克，只是受到的引力变小了。'] },
      { q: ['Match each thing to the right description.', '把下列事物和对应的描述连起来。'],
        match: [[['Sun', '太阳'], ['A star that makes its own light', '自己发光的恒星']], [['Moon', '月球'], ['Shines by reflected sunlight', '反射太阳光而发亮']], [['Craters', '环形山'], ['Made by meteorite impacts', '陨石撞击形成']], [['Sunspots', '黑子'], ['Cooler, darker patches on the Sun', '太阳表面温度较低的暗区']]],
        why: ['The Sun is the only star here; the Moon reflects its light. Craters are impact scars; sunspots are cooler magnetic patches.', '太阳是恒星，月球反射太阳光；环形山是撞击坑；黑子是太阳表面温度较低的区域。'] },
      { q: ['Which are true of the Moon? Pick all that apply.', '关于月球，下列哪些说法正确？（多选）'], options: [['It has no air, so its sky is black', '没有空气，天空是黑色的'], ['Its gravity is about 1/6 of the Earth\'s', '表面引力约为地球的 1/6'], ['Its seas are full of water', '月海里充满了水'], ['It makes its own light', '它自己会发光']], multi: [0, 1],
        why: ['No air and weak gravity are right. The maria are dry lava plains, and moonlight is reflected sunlight.', '没有空气、引力弱是对的。月海是干燥的熔岩平原，月光是反射的太阳光。'] },
    ],
  },
  {
    id: 'a-phases', strand: 'earthmoon', level: 'jr', tracks: ['us', 'au', 'ib'], unit, icon: 'calendar', minutes: 10,
    title: ['Phases of the Moon and the lunar calendar', '月相和农历'],
    blurb: ['Why the Moon changes shape through a month, and how the Chinese lunar calendar follows it.', '月亮为什么一个月里会“变脸”，农历又是怎样跟着月相走的。'],
    keys: [
      ['The Sun always lights half of the Moon; phases are how much of that lit half we see from Earth.', '太阳总是照亮月球的一半；月相就是我们从地球上看到的亮面的多少。'],
      ['From new moon the lit part grows (waxing) to full moon, then shrinks (waning).', '从新月开始，亮面逐渐变大（盈）到满月，然后逐渐变小（亏）。'],
      ['From one new moon to the next takes 29.53 days (a synodic month); one orbit against the stars takes 27.32 days.', '从一次新月到下一次新月约 29.53 天，叫做一个朔望月；月球相对恒星绕地球一周只需 27.32 天。'],
      ['In the lunar calendar the 1st day is the new moon, and the full moon falls on the 15th or 16th.', '农历每月初一是新月（朔），十五或十六前后是满月（望）。'],
      ['The Moon turns once on its axis in the same time it orbits the Earth, so we always see the same face.', '月球自转一周的时间和绕地球公转一周的时间相同，所以我们总是看到同一面。'],
    ],
    steps: [
      {
        title: ['Half lit, always', '永远亮一半'],
        astro: { kit: 'model', kind: 'phases', event: 'new-moon', clock: { from: 0, to: 29.5, rate: 2, unit: 'day' } },
        body: ['The Moon makes no light of its own: it shines by reflecting sunlight. The Sun always lights exactly half of it. As the Moon goes round the Earth, we see different amounts of that lit half: these changing shapes are the phases of the Moon.', '月球自己不发光，它是反射太阳光才显得明亮的。太阳总是照亮月球的一半。月球绕地球运行时，我们从地球上看到的亮面时多时少，这就是月相变化。'],
      },
      {
        title: ['Waxing and waning', '由盈到亏'],
        astro: { kit: 'model', kind: 'phases', event: 'new-moon', clock: { from: 0, to: 29.5, rate: 2, unit: 'day', at: 0.1 } },
        fig: phaseStrip(),
        body: ['At new moon the Moon is between the Earth and the Sun, its dark side toward us. Then the lit part grows (waxing): crescent, first quarter, gibbous, full. After full moon it shrinks (waning) through gibbous and last quarter to a thin crescent. Seen from the northern hemisphere, a waxing Moon is lit on the right.', '新月时，月球位于地球和太阳之间，暗面朝向地球。之后亮面逐渐变大（盈）：蛾眉月、上弦月、凸月，直到满月。满月以后亮面又逐渐变小（亏）：凸月、下弦月，最后变成细细的残月。在北半球看，上半月月亮的亮面在右侧（西侧）。'],
      },
      {
        title: ['A month of 29.5 days', '29.5 天的朔望月'],
        astro: { kit: 'model', kind: 'phases', event: 'full-moon', clock: { from: 0, to: 29.5, rate: 3, unit: 'day' } },
        body: ['From one full moon to the next takes about 29.53 days: the synodic month. The Moon goes once round the Earth, measured against the stars, in 27.32 days, but meanwhile the Earth has moved about 27° along its orbit round the Sun, so the Moon needs about 2.2 more days to line up with the Sun again.', '从一次满月到下一次满月约需 29.53 天，叫做朔望月。以恒星为参照，月球绕地球公转一周只要 27.32 天（恒星月），但这段时间里地球也沿着轨道绕太阳走了约 27°，所以月球要再多走约 2.2 天，才能回到和太阳、地球相同的相对位置。'],
      },
      {
        title: ['When to look for each phase', '什么时候能看到什么月相'],
        astro: { kit: 'model', kind: 'phases', event: 'new-moon', clock: { from: 0, to: 29.5, rate: 2, unit: 'day', at: 0.25 } },
        fig: riseFig,
        body: ['The Moon rises about 50 minutes later each day, so each phase keeps its own hours. A new moon rises and sets with the Sun and cannot be seen. A first-quarter Moon rises around noon and is due south at sunset, so it shines in the evening; a full moon is opposite the Sun, rising at sunset and up all night. A last-quarter Moon rises around midnight and is seen in the morning sky.', '月亮每天升起的时间推迟约 50 分钟，所以不同月相出现在天空的时段不同。新月和太阳同升同落，看不见。上弦月中午前后升起，傍晚位于正南方，在上半夜的西南天空可见；满月与太阳方向相反，日落时升起，整夜可见。下弦月半夜前后升起，在下半夜到清晨的东方天空出现。'],
      },
      {
        title: ['Not the Earth\'s shadow', '月相不是地球的影子'],
        astro: { kit: 'model', kind: 'phases', event: 'new-moon', clock: { from: 0, to: 29.5, rate: 2, unit: 'day', at: 0.12 } },
        body: ['A common mistake is to think the phases are the Earth\'s shadow covering part of the Moon. Look at the model: at a crescent the Moon is nearly between the Earth and the Sun, while the Earth\'s shadow points the other way, away from the Sun. The dark part is simply the Moon\'s own night side turned towards us. The Earth\'s shadow reaches the Moon only at full moon, and then we get a lunar eclipse. Near new moon you can sometimes see the "dark" part glowing faintly: that is earthshine, sunlight reflected from the Earth.', '很多人以为月相是地球的影子挡住了月亮的一部分。看看模型：蛾眉月时，月球差不多位于地球和太阳之间，而地球的影子却指向背离太阳的另一侧。我们看到的暗面，其实是月球自己背着太阳的“夜半球”。只有满月时地球的影子才可能落到月球上，那就是月食。新月前后，有时还能看到月面暗的部分发出微弱的灰光，那是地球反射的太阳光（地照）。'],
      },
      {
        title: ['The lunar calendar', '农历和月相'],
        astro: { kit: 'model', kind: 'phases', event: 'new-moon', clock: { from: 0, to: 29.5, rate: 2, unit: 'day' } },
        body: ['The Chinese lunar calendar follows the Moon: the 1st day of each month is the new moon and the full moon falls on the 15th or 16th. Lunar months have 29 or 30 days, so 12 of them make only about 354 days; a leap month is added about every three years to keep in step with the seasons. So the Mid-Autumn Festival, on the 15th of the 8th month, always has a full moon.', '我国的农历是按月相来定月份的：每月初一是新月（朔），十五、十六前后是满月（望）。农历一个月 29 天或 30 天，12 个月只有约 354 天，所以大约每三年要加一个闰月，以便和季节保持一致。这就是为什么农历八月十五的中秋节总能看到圆月。'],
      },
      {
        title: ['Always the same face', '总是同一面'],
        astro: { kit: 'compare', mode: 'moon' },
        body: ['The Moon spins once on its axis in exactly the time it takes to go round the Earth (27.32 days), so the same side, with these seas and craters, always faces us. The far side is not dark: it gets sunlight too, we just never see it from Earth.', '月球自转一周的时间正好等于它绕地球公转一周的时间（27.3 天），所以它总是用同一面朝向地球，我们看到的总是这些月海和环形山。月球背面并不是一直黑暗的，它也能被太阳照亮，只是我们在地球上看不到。'],
      },
    ],
    quiz: [
      { q: ['Which phase is marked with “?”', '图中“?”处是什么月相？'], fig: phaseStrip(2), options: [['First quarter', '上弦月'], ['Last quarter', '下弦月'], ['Waxing gibbous', '盈凸月'], ['Waning crescent', '残月']], answer: 0,
        why: ['Its right half is lit and it comes after the waxing crescent: a first quarter, about a week after new moon.', '它右半边亮，在蛾眉月之后：是上弦月，约在新月后一周（初七、初八）。'] },
      { q: ['How long is it from one full moon to the next?', '从一次满月到下一次满月大约要多少天？'], options: [['About 29.5 days', '约 29.5 天'], ['About 27.3 days', '约 27.3 天'], ['7 days', '7 天'], ['365 days', '365 天']], answer: 0,
        why: ['The synodic month is about 29.5 days; 27.3 days is one orbit measured against the stars.', '朔望月约 29.5 天；27.3 天是相对于恒星绕地球转一周的时间。'] },
      { q: ['In the Chinese lunar calendar, the full moon falls around…', '在农历中，满月一般出现在'], options: [['the 15th or 16th', '十五、十六'], ['the 1st', '初一'], ['the 8th', '初八'], ['the 23rd', '廿三']], answer: 0,
        why: ['Each lunar month starts at new moon, so the full moon comes about half a month later.', '农历每月初一是新月，大约半个月后，即十五、十六前后是满月。'] },
      { q: ['Why do we always see the same face of the Moon?', '为什么我们总是看到月球的同一面？'], options: [['It spins once in the same time it orbits the Earth', '它的自转周期和公转周期相同'], ['It does not spin at all', '它根本不自转'], ['The far side is always dark', '背面总是黑暗的'], ['The Earth blocks the other side', '地球挡住了另一面']], answer: 0,
        why: ['Rotation and orbit both take 27.32 days, so the same side keeps facing the Earth.', '月球的自转和公转都是 27.32 天，所以始终是同一面朝向地球。'] },
      { q: ['Put these phases in order, starting from new moon.', '从新月开始，把下列月相按出现的先后排序。'],
        order: [['New', '新月'], ['Waxing crescent', '蛾眉月'], ['First quarter', '上弦月'], ['Full', '满月'], ['Last quarter', '下弦月']],
        why: ['The lit part grows from new to full (waxing), then shrinks through last quarter (waning).', '从新月到满月亮面逐渐变大（盈），满月后经下弦月逐渐变小（亏）。'] },
      { q: ['Match each phase to its day of the lunar month.', '把月相和农历日期连起来。'],
        match: [[['New moon', '新月（朔）'], ['1st', '初一']], [['First quarter', '上弦月'], ['7th–8th', '初七、初八']], [['Full moon', '满月（望）'], ['15th–16th', '十五、十六']], [['Last quarter', '下弦月'], ['22nd–23rd', '廿二、廿三']]],
        why: ['Each lunar month begins at new moon, and the quarters come about every 7.4 days.', '农历每月从朔（新月）开始，大约每隔 7.4 天换一个主要月相。'] },
      { q: ['A lunar month is 29.53 days. About how many days do 12 lunar months last?', '一个朔望月约 29.53 天，12 个朔望月约有多少天？'], num: { answer: 354, tol: 1, unit: ['days', '天'] },
        why: ['12 × 29.53 ≈ 354 days, about 11 days short of a solar year: that is why the lunar calendar needs leap months.', '12 × 29.53 ≈ 354 天，比一个回归年少约 11 天，所以农历需要设置闰月。'] },
      { q: ['Which phases can you see in the evening sky soon after sunset? Pick all that apply.', '日落后不久的傍晚，能在天空中看到哪些月相？（多选）'], options: [['Waxing crescent', '蛾眉月'], ['First quarter', '上弦月'], ['Last quarter', '下弦月'], ['Waning crescent', '残月']], multi: [0, 1],
        why: ['Waxing phases are east of the Sun, so they are up in the evening. A last-quarter Moon rises around midnight, and a waning crescent only just before dawn.', '上半月的月相位于太阳东侧，傍晚可见。下弦月半夜前后才升起，残月要到黎明前才出现。'] },
    ],
  },
  {
    id: 'a-eclipses', strand: 'earthmoon', level: 'jr', tracks: ['us', 'au', 'ib'], unit, icon: 'eclipse', minutes: 11,
    title: ['Solar and lunar eclipses', '日食和月食'],
    blurb: ['When the Sun, the Earth and the Moon line up: shadows in space, and why it does not happen every month.', '当日、地、月排成一条直线：太空中的影子，以及为什么不是每个月都有日食和月食。'],
    keys: [
      ['A solar eclipse happens when the Moon\'s shadow falls on the Earth: only at new moon.', '月球的影子落到地球上就会发生日食，只能发生在新月（朔）时。'],
      ['A lunar eclipse happens when the Moon passes into the Earth\'s shadow: only at full moon.', '月球进入地球的影子就会发生月食，只能发生在满月（望）时。'],
      ['In the umbra the Sun is fully hidden (total); in the penumbra only partly (partial). When the Moon is far away, a ring of Sun is left (annular).', '在本影里太阳被完全遮住（全食），在半影里只被遮住一部分（偏食）；月球离地球较远时，太阳边缘露出一圈亮环（环食）。'],
      ['The Moon\'s orbit is tilted about 5°, so most new and full moons pass above or below the shadow.', '月球轨道与地球公转轨道约有 5° 的夹角，所以大多数新月、满月时影子会从上方或下方错过。'],
      ['A total solar eclipse goes through first contact, second contact, greatest eclipse, third contact and last contact; the next one in Beijing is on 2 September 2035.', '日全食依次经历初亏、食既、食甚、生光、复圆五个阶段；北京下一次日全食在 2035 年 9 月 2 日。'],
    ],
    steps: [
      {
        title: ['The Moon\'s shadow on the Earth', '月球的影子落在地球上'],
        astro: { kit: 'model', kind: 'solar', event: 'solar-eclipse', clock: { from: -3, to: 3, rate: 0.4, unit: 'hour', dp: 1 } },
        body: ['When the Moon passes exactly between the Sun and the Earth, its shadow falls on the Earth: a solar eclipse. This can only happen at new moon. The darkest part of the shadow is small, so only people in a narrow strip of the Earth see the Sun completely covered.', '当月球恰好运行到太阳和地球之间时，月球的影子落在地球上，就发生了日食。所以日食只能发生在新月（农历初一）前后。月影最暗的部分很小，只有地球上一条狭窄地带里的人才能看到太阳被完全遮住。'],
      },
      {
        title: ['Umbra and penumbra', '本影和半影'],
        astro: { kit: 'model', kind: 'solar', event: 'solar-eclipse', clock: { from: -3, to: 3, rate: 0.3, unit: 'hour', dp: 1, at: 0.4 } },
        fig: shadowFig,
        body: ['The Moon casts two kinds of shadow. Inside the dark central cone, the umbra, the Sun is completely hidden: a total eclipse. In the wider, lighter penumbra the Moon covers only part of the Sun: a partial eclipse.', '月球的影子分为两部分。中间最暗的锥形区域叫本影，在本影里太阳被完全遮住，看到的是日全食。外面较淡、较宽的区域叫半影，在半影里太阳只被遮住一部分，看到的是日偏食。'],
      },
      {
        title: ['Totality, seen from the ground', '在地面上看日全食'],
        astro: { kit: 'compare', mode: 'cover', ratio: 1.05, clock: { from: -2.4, to: 2.4, rate: 0.32, unit: 'x', fmt: ['Moon crossing the Sun', '月球移过日面'] } },
        body: ['The Moon moves west to east across the Sun, so the Sun\'s western edge is bitten first: first contact. Daylight fades; at second contact the last sliver vanishes and totality begins. The sky turns dark, bright stars and planets come out, and the Sun\'s pearly outer atmosphere, the corona, appears; mid-eclipse is greatest eclipse. At third contact the Sun reappears, and at last contact the Moon leaves it. Totality lasts only a few minutes, at most about 7½. Never look at the Sun without proper eclipse glasses.', '月球自西向东移过日面，所以太阳的西边缘先被“咬”掉一块，叫初亏。天色逐渐变暗，当太阳最后一丝亮边消失，全食开始，叫食既。这时天空一片昏暗，亮星和行星出现，太阳外层大气——珍珠白色的日冕显现出来；全食的中间时刻叫食甚。太阳西边缘重新露出叫生光，月球完全离开日面叫复圆。全食只持续几分钟，最长约 7 分半。观看日食一定要戴专门的日食眼镜，千万不要直视太阳。'],
      },
      {
        title: ['A ring of fire', '日环食'],
        astro: { kit: 'compare', mode: 'cover', ratio: 0.93, clock: { from: -2.4, to: 2.4, rate: 0.32, unit: 'x', fmt: ['Moon crossing the Sun', '月球移过日面'] } },
        body: ['The Moon\'s orbit is an ellipse. When an eclipse happens with the Moon near its farthest point, it looks slightly smaller than the Sun and cannot cover it all. Its umbra does not reach the Earth, and a bright ring of Sun is left: an annular eclipse.', '月球绕地球的轨道是椭圆。如果日食发生时月球离地球较远，它看起来比太阳略小，不能把太阳全部遮住，本影也到达不了地面，太阳边缘就会露出一圈明亮的光环，这就是日环食。'],
      },
      {
        title: ['A lunar eclipse', '月食'],
        astro: { kit: 'model', kind: 'lunar', event: 'lunar-eclipse', clock: { from: -3, to: 3, rate: 0.4, unit: 'hour', dp: 1 } },
        body: ['At full moon the Earth can be exactly between the Sun and the Moon. The Moon then moves into the Earth\'s shadow: a lunar eclipse. Everyone on the night side of the Earth can see it, and it lasts for hours; totality can last up to about 1 h 45 min. In totality the Moon turns coppery red, because the Earth\'s air bends some red sunlight into the shadow. The edge of the Earth\'s shadow on the Moon is always curved: more than 2,000 years ago Aristotle took this as evidence that the Earth is round.', '满月时，地球有可能恰好位于太阳和月球之间，月球进入地球的影子，就发生了月食。凡是处在夜半球的人都能看到月食，整个过程可持续几个小时，其中全食阶段最长约 1 小时 45 分。月全食时月亮呈古铜红色，因为地球大气把一部分红光折射进了地影。月面上地影的边缘总是圆弧形的，两千多年前亚里士多德就以此作为地球是球体的证据。'],
      },
      {
        title: ['Total eclipses over China', '我国的日全食'], cam: [33, 112, 3.4], sketch: true,
        lines: [{ pts: ECL2009, c: C.gold, t: 0.2, dur: 2.2, w: 1.6 }, { pts: ECL2035, c: C.violet, t: 1.2, dur: 2.2, w: 1.6 }],
        marks: [
          mk([25.6, 95], '22 Jul 2009', '2009 年 7 月 22 日', { c: C.gold, big: true, t: 0.5 }),
          mk([30.66, 104.07], 'Chengdu', '成都', { dot: true, c: C.gold, t: 0.9 }), mk([30.59, 114.3], 'Wuhan', '武汉', { dot: true, c: C.gold, t: 1.2 }), mk([31.23, 121.47], 'Shanghai', '上海', { dot: true, c: C.gold, t: 1.5 }),
          mk([42.6, 97], '2 Sep 2035', '2035 年 9 月 2 日', { c: C.violet, big: true, t: 1.5 }),
          mk([40.1, 113.3], 'Datong', '大同', { dot: true, c: C.violet, t: 1.9 }), mk([39.9, 116.4], 'Beijing', '北京', { dot: true, c: C.violet, t: 2.2 }), mk([39.9, 119.6], 'Qinhuangdao', '秦皇岛', { dot: true, c: C.violet, t: 2.5 }),
        ],
        body: ['The umbra races across the Earth at more than 1,500 km/h, tracing a narrow path of totality tens to a few hundred kilometres wide (the lines show its centre). On 22 July 2009 the longest total eclipse of the 21st century crossed the Yangtze valley, from Chengdu through Wuhan to Hangzhou and Shanghai, with up to about 6 minutes of totality. The next one for northern China comes on the morning of 2 September 2035: its path crosses Inner Mongolia, Datong, Beijing, Tangshan and Qinhuangdao, with about 1½ minutes of totality in Beijing.', '月球的本影以每小时 1500 千米以上的速度扫过地面，形成一条宽几十到几百千米的狭长全食带（图中画的是它的中心线）。2009 年 7 月 22 日，21 世纪持续时间最长的日全食经过长江流域，从成都经武汉到杭州、上海，全食最长约 6 分钟。我国北方的下一次日全食在 2035 年 9 月 2 日上午：全食带经过内蒙古、大同、北京、唐山和秦皇岛，北京可见约 1 分半钟的全食。'],
      },
      {
        title: ['Why not every month?', '为什么不是每个月都有？'],
        astro: { kit: 'model', kind: 'solar', event: 'solar-eclipse', clock: { from: -15, to: 15, rate: 2, unit: 'day' } },
        body: ['The Moon\'s orbit is tilted about 5° to the Earth\'s. At most new and full moons the Moon passes a little above or below the Sun–Earth line and the shadows miss. Eclipses happen only when a new or full moon falls near a node, where the two orbits cross. That lines up about every six months, giving 2 to 5 solar eclipses a year.', '月球公转轨道平面与地球公转轨道平面约有 5° 的夹角。所以大多数新月、满月时，月球从日地连线的上方或下方经过，影子就错开了。只有新月或满月恰好发生在两个轨道的交点附近时，才会发生日食或月食。这样的机会约每半年出现一次，每年有 2～5 次日食。'],
      },
    ],
    quiz: [
      { q: ['A solar eclipse can only happen at…', '日食只可能发生在'], options: [['new moon', '新月（朔）'], ['full moon', '满月（望）'], ['first quarter', '上弦月'], ['any phase', '任何月相']], answer: 0,
        why: ['The Moon must be between the Sun and the Earth, which is new moon.', '月球必须位于太阳和地球之间，那正是新月的时候。'] },
      { q: ['What kind of eclipse is this?', '这是哪一种日食？'], astro: { kit: 'compare', mode: 'cover', ratio: 0.93, clock: { from: -2.4, to: 2.4, rate: 0, unit: 'x', at: 0.5, hold: true, fmt: ['Moon crossing the Sun', '月球移过日面'] } },
        options: [['Annular', '日环食'], ['Total', '日全食'], ['Partial', '日偏食'], ['Lunar', '月食']], answer: 0,
        why: ['The Moon is right in front of the Sun but looks smaller, leaving a bright ring: an annular eclipse.', '月球正对着太阳，但看起来比太阳小，周围露出一圈亮环，这是日环食。'] },
      { q: ['Why is there not an eclipse every month?', '为什么不是每个月都有日食和月食？'], options: [['The Moon\'s orbit is tilted about 5°', '月球轨道与地球轨道有约 5° 的夹角'], ['The Moon is too small', '月球太小'], ['Clouds hide them', '被云遮住了'], ['The Sun moves too fast', '太阳运动太快']], answer: 0,
        why: ['Because of the 5° tilt the Moon usually passes above or below the Sun–Earth line; eclipses need a new or full moon near a node.', '由于 5° 的夹角，月球通常从日地连线的上方或下方经过；只有新月或满月发生在交点附近才会出现日食或月食。'] },
      { q: ['During a total lunar eclipse the Moon looks…', '月全食时，月亮看起来'], options: [['coppery red', '呈古铜红色'], ['completely invisible', '完全消失'], ['bright blue', '亮蓝色'], ['brighter than usual', '比平时更亮']], answer: 0,
        why: ['The Earth\'s atmosphere bends red sunlight into the shadow, so the eclipsed Moon glows a dim red.', '地球大气把红色的太阳光折射进地影里，所以月全食时月亮呈暗红色。'] },
      { q: ['Put the stages of a total solar eclipse in order.', '把日全食的各个阶段按先后排序。'],
        order: [['First contact', '初亏'], ['Second contact (totality begins)', '食既'], ['Greatest eclipse', '食甚'], ['Third contact (totality ends)', '生光'], ['Last contact', '复圆']],
        why: ['The Moon first touches the Sun\'s western edge (first contact), covers it (second contact), is centred (greatest), uncovers it (third contact) and leaves (last contact).', '月球先接触太阳西边缘（初亏），把太阳全部遮住（食既），到达中心（食甚），太阳重新露出（生光），最后完全离开（复圆）。'] },
      { q: ['Match each eclipse to what causes it.', '把各种食象和它的成因连起来。'],
        match: [[['Total solar eclipse', '日全食'], ['You are in the Moon\'s umbra', '观测者位于月球本影中']], [['Partial solar eclipse', '日偏食'], ['You are in the Moon\'s penumbra', '观测者位于月球半影中']], [['Annular eclipse', '日环食'], ['The Moon is far away, its umbra misses the Earth', '月球较远，本影到不了地面']], [['Lunar eclipse', '月食'], ['The Moon is in the Earth\'s shadow', '月球进入地球的影子']]],
        why: ['Where you stand in the Moon\'s shadow decides what you see; a lunar eclipse is the Earth\'s shadow on the Moon.', '在月影中所处的位置决定看到哪种日食；月食则是地球的影子落在月球上。'] },
      { q: ['Which statements are true? Pick all that apply.', '下列说法哪些正确？（多选）'], options: [['A lunar eclipse can be seen from the whole night side of the Earth', '整个夜半球都能看到月食'], ['A solar eclipse can only happen around the 1st day of the lunar month', '日食只可能发生在农历初一前后'], ['A lunar eclipse can happen at first quarter', '上弦月时可能发生月食'], ['Totality of a solar eclipse lasts several hours', '日全食的全食阶段会持续几个小时']], multi: [0, 1],
        why: ['Lunar eclipses need a full moon and are seen across the night side; solar eclipses need a new moon (the 1st). Solar totality lasts minutes, not hours.', '月食发生在满月，整个夜半球都可见；日食发生在新月（初一）。日全食的全食阶段只有几分钟。'] },
      { q: ['The Earth\'s shadow at the Moon\'s distance is about 9,200 km wide; the Moon is 3,474 km wide and moves through the shadow at about 3,400 km/h. At most, how many hours can a total lunar eclipse last?', '在月球距离处，地球本影宽约 9200 千米；月球直径 3474 千米，在地影中移动速度约每小时 3400 千米。月全食的全食阶段最长约多少小时？'], num: { answer: 1.7, tol: 0.15, unit: ['h', '小时'] },
        why: ['The whole Moon is inside the shadow while it moves (9,200 − 3,474) ≈ 5,700 km: 5,700 ÷ 3,400 ≈ 1.7 h, about 1 h 40 min.', '整个月球都在地影中的这段路程约为 9200 − 3474 ≈ 5700 千米：5700 ÷ 3400 ≈ 1.7 小时，约 1 小时 40 分。'] },
    ],
  },
  {
    id: 'a-tides', strand: 'earthmoon', level: 'jr', tracks: ['au', 'ib'], unit, icon: 'globe', minutes: 9,
    title: ['Tides', '潮汐'],
    blurb: ['Why the sea rises and falls twice a day, and why some tides are much bigger than others.', '海水为什么一天涨落两次，为什么有时潮水特别大。'],
    keys: [
      ['The Moon pulls harder on the near side of the Earth than on the far side, raising two bulges of ocean water.', '月球对地球近月一侧的引力大，对远月一侧的引力小，使海水形成两个隆起。'],
      ['The Earth turns under the two bulges, so most coasts get two high and two low tides a day.', '地球在两个隆起下自转，所以大多数海岸一天有两次高潮、两次低潮。'],
      ['High tides come about every 12 h 25 min, about 50 minutes later each day, because the Moon moves on in its orbit.', '高潮约每 12 小时 25 分出现一次，每天推迟约 50 分钟，因为月球在轨道上不断前进。'],
      ['Spring tides (big range) come at new and full moon, when the Sun and Moon line up; neap tides (small range) at the quarters.', '新月和满月时日、月引潮力叠加，出现大潮（潮差大）；上弦和下弦时相互削弱，出现小潮（潮差小）。'],
      ['Funnel-shaped bays make the biggest tides (Bay of Fundy about 16 m, Hangzhou Bay about 9 m); tides matter for ports, fishing, tidal flats and tidal power.', '喇叭形海湾潮差最大（芬迪湾约 16 米，杭州湾约 9 米）；潮汐与港口航运、渔业、滩涂利用和潮汐发电关系密切。'],
    ],
    steps: [
      {
        title: ['Why two bulges?', '为什么有两个潮汐隆起？'], sketch: true,
        astro: { kit: 'tides', mode: 'why' },
        body: ['The Moon\'s gravity pulls on the whole Earth, but more strongly on the near side and more weakly on the far side. Compared with the Earth\'s centre, the water nearest the Moon is pulled ahead, while the water on the far side is left behind. So the oceans form two bulges: one toward the Moon and one away from it.', '月球的引力作用于整个地球，但对近月一侧的引力较大，对远月一侧的引力较小。与地心相比，离月球最近的海水被拉得更多，而背面的海水则被“甩在后面”。于是海水形成两个隆起：一个朝向月球，一个背向月球。'],
      },
      {
        title: ['Two high tides a day', '一天两次涨落'], sketch: true,
        astro: { kit: 'tides', mode: 'daily', clock: { from: 0, to: 50, rate: 2, unit: 'hour' } },
        fig: tideFig,
        body: ['The bulges stay lined up with the Moon while the Earth turns underneath them. A port like Shanghai passes through both bulges each day: two high tides and two low tides. Because the Moon moves on along its orbit, the bulges come round every 12 h 25 min, so the tides are about 50 minutes later each day.', '两个隆起始终对着月球的方向，地球则在它们下面自转。像上海这样的港口每天都要经过两个隆起，所以一天有两次高潮、两次低潮。由于月球在轨道上不断前进，高潮约每 12 小时 25 分出现一次，每天的潮时推迟约 50 分钟。'],
      },
      {
        title: ['Spring tides and neap tides', '大潮和小潮'], sketch: true,
        astro: { kit: 'tides', mode: 'springneap', clock: { from: 0, to: 29.5, rate: 1.5, unit: 'day' } },
        body: ['The Sun raises tides too, a bit less than half as strong as the Moon\'s. At new and full moon the Sun, Earth and Moon are in a line and the two bulges add up: spring tides, with very high highs and very low lows. At first and last quarter they are at right angles and partly cancel: neap tides, with a small range.', '太阳也会引起潮汐，强度不到月球的一半。新月和满月时，日、地、月大致在一条直线上，两种潮汐隆起叠加，形成大潮：高潮特别高，低潮特别低。上弦月和下弦月时，太阳和月球的方向成直角，作用相互削弱，形成小潮，潮差较小。'],
      },
      {
        title: ['The Qiantang River bore', '钱塘江大潮'], sketch: true,
        astro: { kit: 'tides', mode: 'daily', place: { name: ['Haining', '海宁'], lat: 30.4, lon: 120.6 }, clock: { from: 0, to: 50, rate: 2, unit: 'hour' } },
        body: ['Every year around the 18th day of the 8th lunar month, crowds gather at Haining to watch the Qiantang River bore. It comes at a spring tide just after the full moon, near the autumn equinox when the Sun\'s pull helps too, and the funnel-shaped Hangzhou Bay squeezes the rising tide into a wall of water that can be several metres high, rushing upriver. Watch from a safe distance: the bore can sweep over the embankment.', '每年农历八月十八前后，人们聚集在浙江海宁观看钱塘江大潮。这时正值满月后的大潮，又接近秋分，太阳的引潮力也来助力；喇叭口形状的杭州湾把涌入的潮水越挤越高，形成可达几米高的“潮墙”向上游奔涌。观潮一定要站在安全的地方，潮水可能漫过堤岸。'],
      },
      {
        title: ['The world\'s biggest tides', '世界上潮差最大的地方'], cam: [38, 20, 7.5], wide: true, sketch: true,
        marks: [
          mk([45.3, -64.4], 'Bay of Fundy ≈ 16 m', '芬迪湾 ≈ 16 米', { dot: true, c: C.gold, big: true, t: 0.3 }),
          mk([51.4, -2.9], 'Severn Estuary ≈ 14 m', '塞文河口 ≈ 14 米', { dot: true, c: C.gold, t: 0.7 }),
          mk([48.64, -1.51], 'Mont-Saint-Michel ≈ 14 m', '圣米歇尔山 ≈ 14 米', { dot: true, c: C.gold, t: 1.0 }),
          mk([37.45, 126.6], 'Incheon ≈ 9 m', '仁川 ≈ 9 米', { dot: true, c: C.teal, t: 1.4 }),
          mk([30.4, 120.9], 'Hangzhou Bay ≈ 9 m', '杭州湾 ≈ 9 米', { dot: true, c: C.red, big: true, t: 1.7 }),
          mk([0, -150], 'Open ocean: under 1 m', '大洋中：不到 1 米', { c: C.ice, t: 2.1 }),
        ],
        body: ['In the open ocean the tidal bulge is less than a metre high. The biggest tidal ranges, the height between high and low water, happen where a long, funnel-shaped bay squeezes the tide, especially when the bay\'s natural sloshing time matches the 12 h 25 min rhythm. Canada\'s Bay of Fundy reaches about 16 m, the Severn and Mont-Saint-Michel about 14 m. In China, Hangzhou Bay has the largest range, up to about 9 m at Ganpu; across the Yellow Sea, Incheon has about 9 m too.', '在大洋中，潮汐隆起不到 1 米高。潮差（高潮与低潮的水位差）最大的地方，多是又长又呈喇叭形的海湾，潮水被越挤越高，尤其当海湾水体自然振荡的周期接近 12 小时 25 分时。加拿大的芬迪湾潮差可达约 16 米，英国塞文河口和法国圣米歇尔山约 14 米。我国潮差最大的是杭州湾，澉浦最大潮差约 9 米；黄海对岸的韩国仁川也约有 9 米。'],
      },
      {
        title: ['Using the tides', '潮汐的利用'], sketch: true,
        astro: { kit: 'tides', mode: 'daily', place: { name: ['Wenling', '温岭'], lat: 28.35, lon: 121.2 }, clock: { from: 0, to: 50, rate: 2, unit: 'hour' } },
        body: ['Big ships time their arrivals with high tide to have deep water in a port, and fishers and shellfish farmers work the tidal flats at low tide. Tidal power stations let the sea fill a basin at high tide and run it back through turbines: France\'s La Rance (1966, 240 MW) and South Korea\'s Sihwa Lake (2011, 254 MW) are the largest. China\'s Jiangxia station at Wenling, Zhejiang, has run since 1980. Tides are perfectly predictable, so tidal power is reliable, but few coasts have a big enough range.', '大型船舶常趁高潮进出港口，以获得足够的水深；渔民和养殖户则在低潮时到滩涂上赶海、养殖贝类。潮汐电站在高潮时让海水灌满水库，退潮时放水推动水轮机发电：法国朗斯电站（1966 年，24 万千瓦）和韩国始华湖电站（2011 年，25.4 万千瓦）规模最大，我国浙江温岭的江厦潮汐电站自 1980 年运行至今。潮汐可以准确预报，所以潮汐能很稳定，但潮差足够大的海岸并不多。'],
      },
    ],
    quiz: [
      { q: ['Tap the bulge on the far side of the Earth from the Moon.', '点出地球背向月球一侧的潮汐隆起。'], astro: { kit: 'tides', mode: 'daily', clock: { from: 0, to: 50, rate: 0, unit: 'hour', hold: true } }, pick: 'far-bulge',
        why: ['The far side is pulled less than the Earth\'s centre, so its water is left behind as a second bulge.', '背月一侧受到的引力比地心小，海水被“甩在后面”，形成第二个隆起。'] },
      { q: ['How many high tides do most coasts get each day?', '大多数海岸每天有几次高潮？'], options: [['Two', '两次'], ['One', '一次'], ['Four', '四次'], ['None: only once a month', '没有，每月才一次']], answer: 0,
        why: ['There are two bulges and the Earth turns under both of them each day.', '海水有两个隆起，地球每天自转经过两个隆起。'] },
      { q: ['Spring tides happen when…', '大潮出现在'], options: [['the Moon is new or full', '新月或满月时'], ['it is spring', '春季'], ['the Moon is at first or last quarter', '上弦月或下弦月时'], ['the Earth is nearest the Sun', '地球离太阳最近时']], answer: 0,
        why: ['At new and full moon the Sun and Moon line up and their tidal bulges add up. Spring tides have nothing to do with the season.', '新月和满月时日、月成一直线，潮汐隆起相互叠加。大潮和春季无关。'] },
      { q: ['Why are high tides about 50 minutes later each day?', '为什么每天的潮时要推迟约 50 分钟？'], options: [['The Moon moves along its orbit', '月球在轨道上不断向前运动'], ['The Earth slows down every day', '地球每天都在变慢'], ['The Sun pulls the bulges back', '太阳把隆起往回拉'], ['The sea gets heavier', '海水变重了']], answer: 0,
        why: ['While the Earth turns once, the Moon moves on about 13°, so a coast needs about 50 more minutes to face it again.', '地球自转一周时，月球又向前走了约 13°，海岸要再多转约 50 分钟才能再次对准月球。'] },
      { q: ['Each day the Moon moves about 13.2° further east round the Earth. The Earth turns 360° in 24 hours. How many minutes does the Earth need to turn the extra 13.2°?', '月球每天绕地球向东多走约 13.2°，地球 24 小时自转 360°。地球多转这 13.2° 需要多少分钟？'], num: { answer: 53, tol: 3, unit: ['min', '分钟'] },
        why: ['360° in 24 h is 1° every 4 minutes, so 13.2° × 4 ≈ 53 minutes: the tides (and moonrise) come about 50 minutes later each day.', '24 小时转 360°，即每 4 分钟转 1°，13.2° × 4 ≈ 53 分钟。所以潮时和月出每天都推迟约 50 分钟。'] },
      { q: ['Tap these two places with very large tides.', '在地球仪上标出这两个潮差很大的地方。'],
        place: [{ text: ['Bay of Fundy', '芬迪湾'], at: [45.3, -64.4], tolKm: 700 }, { text: ['Hangzhou Bay', '杭州湾'], at: [30.4, 121.0], tolKm: 500 }],
        why: ['The Bay of Fundy lies between New Brunswick and Nova Scotia in eastern Canada; Hangzhou Bay opens to the East China Sea south of Shanghai.', '芬迪湾位于加拿大东部新不伦瑞克省和新斯科舍省之间；杭州湾在上海南面，向东海敞开。'] },
      { q: ['Match each term to its meaning.', '把下列名词和含义连起来。'],
        match: [[['Spring tide', '大潮'], ['Big range, at new or full moon', '潮差大，出现在新月或满月']], [['Neap tide', '小潮'], ['Small range, at the quarter moons', '潮差小，出现在上弦或下弦']], [['Tidal bore', '涌潮'], ['A wall of water rushing up a river', '沿河道上涌的“潮墙”']], [['Tidal range', '潮差'], ['Height between high and low water', '高潮与低潮的水位差']]],
        why: ['Spring and neap tides follow the Moon\'s phases; a bore forms where a funnel-shaped bay meets a river; the range is the difference in water height.', '大潮小潮随月相变化；涌潮出现在喇叭形河口；潮差是高低潮的水位差。'] },
      { q: ['Which are uses of the tides? Pick all that apply.', '下列哪些是对潮汐的利用？（多选）'], options: [['Ships entering port at high tide', '船舶趁高潮进港'], ['Generating electricity', '潮汐发电'], ['Gathering shellfish on tidal flats at low tide', '低潮时在滩涂赶海'], ['Forecasting earthquakes', '预报地震']], multi: [0, 1, 2],
        why: ['Ports, tidal power and tidal flats all use the regular rise and fall of the sea; tides cannot forecast earthquakes.', '港口航运、潮汐发电和滩涂利用都利用了海水有规律的涨落；潮汐不能用来预报地震。'] },
    ],
  },
];
