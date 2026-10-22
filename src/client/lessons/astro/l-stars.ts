/** Astronomy lessons: the Milky Way and galaxies (junior), stars and their properties, the life of a star (senior). */
import { svg, tx, type Lx } from '../figs.ts';
import type { Fig, Lesson, Pair } from '../kit.ts';

// ------------------------------------------------------------------------------------------------ figures

/** Rough blackbody colour of a temperature, as a hex string. */
function tHex(T: number): string {
  const t = T / 100, c = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  const r = t <= 66 ? 255 : 329.7 * (t - 60) ** -0.1332;
  const g = t <= 66 ? 99.47 * Math.log(t) - 161.1 : 288.1 * (t - 60) ** -0.0755;
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5 * Math.log(t - 10) - 305;
  return `#${c(r)}${c(g)}${c(b)}`;
}
function rand(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/** A Hertzsprung–Russell diagram: main sequence, giants, supergiants, white dwarfs and the Sun. `letters`: regions marked A–D only (for a quiz). */
function hrFig(letters: boolean): Fig {
  return {
    k: 'svg', draw: (L: Lx) => {
      const x0 = 40, x1 = 304, y0 = 14, y1 = 146;
      const X = (T: number) => x0 + ((x1 - x0) * (Math.log10(40000) - Math.log10(T))) / (Math.log10(40000) - Math.log10(2400));
      const Y = (Lum: number) => y1 - ((y1 - y0) * (Math.log10(Lum) + 4)) / 10;
      const R = rand(29), g = () => (R() + R() + R() - 1.5) / 1.5;
      let o = '';
      for (const e of [-4, -2, 0, 2, 4, 6]) o += `<line x1="${x0}" x2="${x1}" y1="${Y(10 ** e)}" y2="${Y(10 ** e)}" class="fg-grid"/>` + tx(x0 - 4, Y(10 ** e) + 2.5, e === 0 ? '1' : `10${'⁻'.repeat(e < 0 ? 1 : 0)}${'⁰¹²³⁴⁵⁶'[Math.abs(e)]}`, 'fg-tick', 'e');
      for (const T of [30000, 10000, 6000, 3000]) o += `<line y1="${y0}" y2="${y1}" x1="${X(T)}" x2="${X(T)}" class="fg-grid"/>` + tx(X(T), y1 + 9, `${T.toLocaleString('en-US').replace(',', ' ')} K`, 'fg-tick', 'm');
      o += `<line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" class="fg-zero"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" class="fg-zero"/>`;
      o += tx((x0 + x1) / 2, y1 + 19, L(['surface temperature (← hotter)', '表面温度（← 越热）']), 'fg-sub', 'm');
      o += tx(8, (y0 + y1) / 2, L(['luminosity (Sun = 1)', '光度（太阳 = 1）']), 'fg-sub', 'm', ` transform="rotate(-90 8 ${(y0 + y1) / 2})"`);
      const dot = (T: number, Lum: number, r: number, i: number) => `<circle cx="${X(T).toFixed(1)}" cy="${Y(Lum).toFixed(1)}" r="${r}" fill="${tHex(T)}" class="f-fade" style="--d:${(0.1 + i * 0.006).toFixed(2)}s" opacity=".9"/>`;
      let i = 0;
      for (let k = 0; k < 70; k++) {
        const M = Math.exp(Math.log(0.12) + (Math.log(40) - Math.log(0.12)) * R() ** 1.35);
        const T = Math.min(39000, 5772 * (M < 1 ? M ** 0.35 : M ** 0.6) * 10 ** (g() * 0.02)), Lum = (M < 0.43 ? 0.23 * M ** 2.3 : M ** 3.5) * 10 ** (g() * 0.18);
        o += dot(T, Lum, 1.6 + Math.max(0, Math.log10(Lum)) * 0.25, i++);
      }
      for (let k = 0; k < 18; k++) { const u = R(); o += dot((5200 - 1800 * u) * 10 ** (g() * 0.02), 10 ** (1.2 + 1.9 * u + g() * 0.25), 2.6, i++); }
      for (let k = 0; k < 10; k++) o += dot(Math.exp(Math.log(3300) + (Math.log(32000) - Math.log(3300)) * R()), 10 ** (4.3 + R() * 1.5), 3.2, i++);
      for (let k = 0; k < 12; k++) { const T = Math.exp(Math.log(5500) + (Math.log(32000) - Math.log(5500)) * R()); o += dot(T, 0.012 ** 2 * (T / 5772) ** 4 * 10 ** (g() * 0.3), 1.4, i++); }
      // the Sun
      o += `<circle cx="${X(5772)}" cy="${Y(1)}" r="4.5" fill="none" stroke="#ffd24a" stroke-width="1.3"/>`;
      const regions: [T: number, Lum: number, name: Pair, letter: string, a: 's' | 'm' | 'e'][] = [
        [7000, 300, ['Main sequence', '主序星'], 'B', 'e'],
        [4000, 2000, ['Red giants', '红巨星'], 'A', 'm'],
        [9000, 3e6, ['Supergiants', '超巨星'], 'D', 'm'],
        [14000, 1.2e-4, ['White dwarfs', '白矮星'], 'C', 'm'],
      ];
      for (const [T, Lum, nm, let_, a] of regions) o += tx(X(T), Y(Lum), letters ? let_ : L(nm), 'fg-label', letters ? 'm' : a, letters ? ' style="font-size:11px"' : '');
      if (!letters) o += tx(X(5772) + 7, Y(1) + 11, L(['Sun', '太阳']), 'fg-label', 's', ' style="fill:#ffd24a"');
      return svg(320, 172, o, L(['Hertzsprung–Russell diagram', '赫罗图']));
    },
  };
}

/** Where the elements were made. */
const elementsFig: Fig = {
  k: 'svg', draw: (L: Lx) => {
    const col: [x: number, c: string, title: Pair, sub: Pair, els: string[]][] = [
      [8, '#74c0fc', ['Big Bang', '宇宙大爆炸'], ['the first 3 minutes', '最初的 3 分钟'], ['H', 'He']],
      [112, '#ffd24a', ['Fusion in stars', '恒星内部的聚变'], ['up to iron', '一直到铁'], ['C', 'N', 'O', 'Ne', 'Si', 'Fe']],
      [216, '#ff8787', ['Supernovae and', '超新星爆发和'], ['neutron-star mergers', '中子星并合'], ['Au', 'Pt', 'U', 'I']],
    ];
    let o = '';
    col.forEach(([x, c, t, s, els], k) => {
      o += `<g class="f-fade" style="--d:${0.15 + k * 0.35}s">`;
      o += `<rect x="${x}" y="8" width="96" height="120" rx="6" fill="${c}" fill-opacity=".08" stroke="${c}" stroke-opacity=".5"/>`;
      o += tx(x + 48, 24, L(t), 'fg-label', 'm', ` style="fill:${c}"`) + tx(x + 48, 35, L(s), 'fg-sub', 'm');
      els.forEach((e, i) => {
        const cx = x + 10 + (i % 3) * 27, cy = 46 + Math.floor(i / 3) * 30;
        o += `<rect x="${cx}" y="${cy}" width="22" height="24" rx="3" fill="${c}" fill-opacity=".2" stroke="${c}" stroke-opacity=".7"/>` + tx(cx + 11, cy + 16, e, 'fg-label', 'm');
      });
      o += '</g>';
    });
    o += tx(160, 146, L(['Explosions spread the elements into space: new stars, planets — and us.', '恒星爆发把这些元素撒向太空，构成新的恒星、行星，也构成了我们。']), 'fg-sub', 'm');
    return svg(320, 152, o, L(['Where the elements come from', '元素从哪里来']));
  },
};

/** A star's fate by its birth mass, on a logarithmic mass bar. */
const fateFig: Fig = {
  k: 'svg', draw: (L: Lx) => {
    const x0 = 14, x1 = 306, lo = Math.log10(0.08), hi = Math.log10(100);
    const X = (m: number) => x0 + ((x1 - x0) * (Math.log10(m) - lo)) / (hi - lo);
    const seg: [a: number, b: number, c: string, name: Pair, path: Pair, end: Pair][] = [
      [0.08, 0.5, '#ff8f6b', ['red dwarfs', '红矮星'], ['shine 100s of billions of years', '可燃烧数千亿年以上'], ['→ white dwarf (none yet)', '→ 白矮星（尚未出现）']],
      [0.5, 8, '#ffd24a', ['Sun-like', '类太阳'], ['red giant → planetary nebula', '红巨星 → 行星状星云'], ['→ white dwarf ≤ 1.4 M☉', '→ 白矮星 ≤ 1.4 M☉']],
      [8, 25, '#74c0fc', ['massive', '大质量'], ['red supergiant → supernova', '红超巨星 → 超新星'], ['→ neutron star, ~20 km', '→ 中子星，直径约 20 km']],
      [25, 100, '#b197fc', ['very massive', '特大质量'], ['supergiant → collapse', '超巨星 → 坍缩'], ['→ black hole', '→ 黑洞']],
    ];
    let o = tx(160, 12, L(['Birth mass decides the ending (M☉ = Sun’s mass)', '出生时的质量决定结局（M☉ = 太阳质量）']), 'fg-title', 'm');
    seg.forEach(([a, b, c, n, p, e], k) => {
      const xa = X(a), xb = X(b), xm = (xa + xb) / 2, y = 34 + (k % 2) * 0;
      o += `<g class="f-fade" style="--d:${0.15 + k * 0.3}s"><rect x="${xa.toFixed(1)}" y="${y}" width="${(xb - xa - 1).toFixed(1)}" height="16" rx="3" fill="${c}" fill-opacity=".3" stroke="${c}"/>`;
      o += tx(xm, y + 11.5, L(n), 'fg-label', 'm');
      const ty = 72 + k * 20;
      o += `<line x1="${xm.toFixed(1)}" y1="${y + 16}" x2="${xm.toFixed(1)}" y2="${ty - 9}" stroke="${c}" stroke-opacity=".6" stroke-width=".8"/>`;
      const anchor = k < 2 ? 's' : 'e', tx0 = k < 2 ? xm - 4 : xm + 4;
      o += tx(tx0, ty, L(p), 'fg-sub', anchor) + tx(tx0, ty + 9, L(e), 'fg-label', anchor, ` style="fill:${c}"`) + '</g>';
    });
    for (const m of [0.1, 0.5, 1, 8, 25, 100]) o += tx(X(m), 60, `${m}`, 'fg-tick', 'm');
    o += `<circle cx="${X(1).toFixed(1)}" cy="42" r="2.5" fill="#fff"/>`;
    return svg(320, 150, o, L(['The fate of a star by its mass', '不同质量恒星的结局']));
  },
};

// ------------------------------------------------------------------------------------------------ lessons

const cosmos: Pair = ['Galaxies and the universe', '星系和宇宙'];
const stars: Pair = ['Stars', '恒星'];

export const A_STARS: Lesson[] = [
  {
    id: 'a-milky-way', strand: 'cosmos', level: 'jr', tracks: ['uk', 'us', 'au', 'ib'], unit: cosmos, icon: 'sparkle', minutes: 9,
    title: ['The Milky Way and the universe', '银河系和宇宙'],
    blurb: ['Our galaxy, where the Sun sits in it, the light-year, and a universe full of galaxies.', '我们的星系、太阳在银河系中的位置、光年，以及充满星系的宇宙。'],
    keys: [
      ['The Milky Way is a barred spiral galaxy of 100–400 billion stars, about 100 000 light-years across.', '银河系是一个有棒旋结构的旋涡星系，有 1000 亿到 4000 亿颗恒星，直径约 10 万光年。'],
      ['A light-year is a distance: how far light travels in a year, about 9.46 trillion km.', '光年是距离单位：光在一年里走过的距离，约 9.46 万亿千米。'],
      ['The Sun lies about 26 000 light-years from the centre, in the Orion Arm, and circles it every ~230 million years.', '太阳位于猎户臂，距银河系中心约 2.6 万光年，约 2.3 亿年绕中心转一圈。'],
      ['The band of the Milky Way in the night sky is our galaxy’s disc, seen from inside.', '夜空中的银河，是我们从银盘内部看到的银盘。'],
      ['Andromeda is 2.5 million light-years away; the universe holds hundreds of billions of galaxies.', '仙女星系距我们约 250 万光年；宇宙中有数千亿个星系。'],
    ],
    steps: [
      {
        title: ['Our galaxy', '我们的星系'],
        body: ['The Sun is just one of 100–400 billion stars in the Milky Way, a barred spiral galaxy. Its stars, gas and dust form a flat disc about 100 000 light-years across. A bar of old stars crosses the centre, and spiral arms full of young blue stars wind outward.', '太阳只是银河系里 1000 亿到 4000 亿颗恒星中的一颗。银河系是一个棒旋星系，恒星、气体和尘埃组成一个直径约 10 万光年的扁平圆盘。中心有一根由老年恒星组成的“棒”，旋臂上布满年轻的蓝色恒星，向外盘旋伸展。'],
        astro: { kit: 'galaxy', mode: 'top', arms: true },
      },
      {
        title: ['Measuring with light: the light-year', '用光来量：光年'],
        body: ['Distances in space are so huge that we measure them with light. A light-year is the distance light travels in one year: about 9.46 trillion km (9.46 × 10¹² km). Sunlight takes about 8 minutes to reach us; light from the nearest star, Proxima Centauri, takes 4.2 years.', '宇宙中的距离太大了，人们用光来度量。1 光年就是光在一年里走过的距离，约 9.46 万亿千米（9.46 × 10¹² 千米）。太阳光到达地球约需 8 分钟，最近的恒星比邻星发出的光要走 4.2 年。'],
        astro: { kit: 'galaxy', mode: 'top', near: true },
      },
      {
        title: ['Where is the Sun?', '太阳在哪里？'],
        body: ['The Sun sits in a small arm, the Orion Arm, about 26 000 light-years from the centre. It races around the centre at about 230 km/s, yet one lap still takes about 230 million years — a “galactic year”. The last time the Sun was here, the first dinosaurs were appearing.', '太阳位于一条较小的旋臂——猎户臂上，距银河系中心约 2.6 万光年。太阳以每秒约 230 千米的速度绕银河系中心运行，即使这样，转一圈也要约 2.3 亿年，叫作一个“银河年”。上一次太阳在这个位置时，地球上最早的恐龙刚刚出现。'],
        astro: { kit: 'galaxy', mode: 'top', clock: { from: 0, to: 230, rate: 20, unit: 'myr' } },
      },
      {
        title: ['The Milky Way in our sky', '夜空中的银河'],
        body: ['Seen side-on, the disc is thin — only about 1 000 light-years thick — with a bulge of stars in the middle. We live inside the disc. Looking along it, we see so many faint stars that they blur into a glowing band across the sky: the Milky Way. Looking out of the disc, we see far fewer stars.', '从侧面看，银盘很薄，厚度只有约 1000 光年，中间鼓起的部分叫核球。我们就生活在银盘之中：沿着银盘方向看，无数暗弱的恒星连成一条横跨夜空的光带，这就是银河；朝银盘外看，恒星就稀少多了。'],
        astro: { kit: 'galaxy', mode: 'side' },
      },
      {
        title: ['Our neighbours: the Local Group', '我们的邻居：本星系群'],
        body: ['The Milky Way has company. Two small galaxies, the Large and Small Magellanic Clouds, lie about 160 000 and 200 000 light-years away. The Andromeda Galaxy, a big spiral, is 2.5 million light-years away: the light we see from it left before there were any humans. With dozens of smaller galaxies they form the Local Group.', '银河系并不孤单。大、小麦哲伦云是两个小星系，分别距我们约 16 万和 20 万光年。大型旋涡星系——仙女星系距我们约 250 万光年：我们今天看到的仙女星系的光，在人类出现之前就已经出发了。它们和几十个更小的星系一起组成本星系群。'],
        astro: { kit: 'galaxy', mode: 'local' },
      },
      {
        title: ['A universe of galaxies', '星系的宇宙'],
        body: ['Galaxies are the building blocks of the universe. Deep images from the Hubble and James Webb space telescopes show galaxies in every direction: spirals, ellipticals and irregular ones. The observable universe holds hundreds of billions of galaxies, each with millions to trillions of stars.', '星系是构成宇宙的基本单元。哈勃空间望远镜和詹姆斯·韦布空间望远镜拍摄的深空照片显示，各个方向都有星系：旋涡星系、椭圆星系和不规则星系。可观测宇宙中有数千亿个星系，每个星系都有数百万到数万亿颗恒星。'],
        astro: { kit: 'galaxy', mode: 'universe' },
      },
    ],
    quiz: [
      { q: ['A light-year is a unit of…', '光年是什么的单位？'], options: [['distance', '距离'], ['time', '时间'], ['speed', '速度'], ['brightness', '亮度']], answer: 0,
        why: ['It is the distance light travels in one year, about 9.46 trillion km.', '光年是光在一年里走过的距离，约 9.46 万亿千米，是距离单位。'] },
      { q: ['Tap where the Sun is in the Milky Way.', '在银河系中点出太阳的位置。'], astro: { kit: 'galaxy', mode: 'top' }, pick: 'sun',
        why: ['The Sun is in the Orion Arm, about 26 000 light-years from the centre — roughly halfway out.', '太阳在猎户臂上，距银河系中心约 2.6 万光年，大约在中心到边缘的一半处。'] },
      { q: ['Why does the Milky Way look like a band across the night sky?', '为什么银河在夜空中看起来是一条光带？'],
        options: [['We see our galaxy’s flat disc from inside it', '我们身处银盘之中，沿银盘方向看到密集的恒星'], ['It is a long cloud high in the atmosphere', '它是高空中一条长长的云'], ['It is the light of the planets in a line', '它是排成一列的行星发出的光'], ['It is sunlight reflected by dust near Earth', '它是地球附近尘埃反射的太阳光']], answer: 0,
        why: ['The disc is thin and we are inside it, so along the disc we see countless distant stars blurred into a band.', '银盘很薄，我们身处其中，沿银盘方向能看到无数遥远的恒星，它们连成了一条光带。'] },
      { q: ['Andromeda is 2.5 million light-years away. The light we see from it tonight left it…', '仙女星系距我们 250 万光年。我们今晚看到的它的光，是什么时候发出的？'],
        options: [['about 2.5 million years ago', '约 250 万年前'], ['about 2.5 years ago', '约 2.5 年前'], ['8 minutes ago', '8 分钟前'], ['just now', '刚刚']], answer: 0,
        why: ['Light takes one year to cross each light-year, so we see Andromeda as it was 2.5 million years ago.', '光走 1 光年要 1 年，所以我们看到的是 250 万年前的仙女星系。'] },
      { q: ['Proxima Centauri is 4.2 light-years away, and 1 light-year ≈ 9.46 trillion km. About how many trillion km away is it?', '比邻星距我们 4.2 光年，1 光年约 9.46 万亿千米。它距我们约多少万亿千米？'],
        num: { answer: 39.7, tol: 1, unit: ['trillion km', '万亿千米'] },
        why: ['4.2 × 9.46 ≈ 39.7 trillion km (4 × 10¹³ km). Even the nearest star is 270 000 times farther than the Sun.', '4.2 × 9.46 ≈ 39.7 万亿千米（4 × 10¹³ 千米）。即使最近的恒星，也比太阳远 27 万倍。'] },
      { q: ['Put these in order from nearest to farthest.', '把下面的天体按从近到远排序。'],
        order: [['Proxima Centauri (nearest star)', '比邻星（最近的恒星）'], ['The centre of the Milky Way', '银河系中心'], ['The Large Magellanic Cloud', '大麦哲伦云'], ['The Andromeda Galaxy', '仙女星系']],
        why: ['4.2 light-years, 26 000 light-years, 160 000 light-years, 2.5 million light-years: each step is roughly 10 to 6 000 times farther.', '4.2 光年、2.6 万光年、16 万光年、250 万光年：每一步都远了几倍到几千倍。'] },
      { q: ['Tap the Andromeda Galaxy, the biggest neighbour of the Milky Way.', '点出仙女星系——银河系最大的邻居。'], astro: { kit: 'galaxy', mode: 'local' }, pick: 'andromeda',
        why: ['Andromeda is a large spiral 2.5 million light-years away, a little bigger than the Milky Way; the two will merge in about 4–5 billion years.', '仙女星系是一个距我们 250 万光年的大型旋涡星系，比银河系略大；两者约 40～50 亿年后会相撞并合。'] },
    ],
  },
  {
    id: 'a-stars', strand: 'stars', level: 'sr', tracks: ['ib', 'us'], unit: stars, icon: 'star', minutes: 11,
    title: ['Stars: brightness, colour and temperature', '恒星：亮度、颜色和温度'],
    blurb: ['What a star’s colour, brightness and tiny yearly shift tell us — and the HR diagram that ties them together.', '恒星的颜色、亮度和每年微小的位移告诉了我们什么，以及把它们联系起来的赫罗图。'],
    keys: [
      ['Colour shows surface temperature: red ~3 000 K, the Sun ~5 800 K, blue ~30 000 K (classes O B A F G K M).', '颜色反映表面温度：红色约 3000 K，太阳约 5800 K，蓝色约 30000 K（光谱型 O、B、A、F、G、K、M）。'],
      ['Apparent brightness falls as 1/d²; absolute magnitude compares stars as if all were 10 parsecs away.', '视亮度与距离的平方成反比；绝对星等是把恒星都放在 10 秒差距处比较的亮度。'],
      ['Parallax gives distance: d (parsecs) = 1 / p (arcseconds); 1 pc ≈ 3.26 light-years.', '用视差测距离：d（秒差距）= 1 / p（角秒），1 秒差距约 3.26 光年。'],
      ['Luminosity L = 4πR²σT⁴. The HR diagram plots L against T: main sequence, giants, supergiants and white dwarfs.', '光度 L = 4πR²σT⁴。赫罗图以温度为横轴、光度为纵轴，分出主序星、巨星、超巨星和白矮星。'],
      ['Distance modulus: m − M = 5 log₁₀(d / 10 pc).', '距离模数：m − M = 5 log₁₀(d / 10 秒差距)。'],
      ['On the main sequence L ∝ M^3.5 and lifetime t ≈ 10 billion years × (M/M☉)^−2.5: heavy stars die young.', '主序星的光度 L ∝ M^3.5，寿命 t ≈ 100 亿年 × (M/M☉)^−2.5：质量越大，寿命越短。'],
    ],
    steps: [
      {
        title: ['Colour shows temperature', '颜色反映温度'],
        body: ['A star’s colour tells us its surface temperature. Cool stars (~3 000 K) glow red, the Sun (~5 800 K) yellow-white, and the hottest (~30 000 K) blue. Hotter bodies radiate most strongly at shorter wavelengths: λmax = 2.9 × 10⁻³ m·K / T (Wien’s law). Astronomers sort stars into classes O B A F G K M, hottest to coolest.', '恒星的颜色反映它的表面温度：较冷的恒星（约 3000 K）发红光，太阳（约 5800 K）呈黄白色，最热的恒星（约 30000 K）呈蓝色。温度越高，辐射最强的波长越短：λmax = 2.9 × 10⁻³ m·K / T（维恩位移定律）。天文学家按温度从高到低把恒星分为 O、B、A、F、G、K、M 型。'],
        astro: { kit: 'stars', mode: 'color', clock: { from: 3000, to: 30000, rate: 2500, unit: 'x', fmt: ['{v} K', '{v} K'] } },
      },
      {
        title: ['How bright? Apparent and absolute', '有多亮？视亮度和绝对亮度'],
        body: ['How bright a star looks depends on its power and its distance. Its light spreads over a sphere of area 4πd², so the brightness we see is b = L / 4πd²: twice as far means a quarter as bright. Astronomers use magnitudes (smaller = brighter; 5 magnitudes = 100 times). Absolute magnitude is how bright a star would look from 10 parsecs, so stars can be compared fairly.', '恒星看起来有多亮，取决于它的发光本领和距离。光向四面八方传播，分布在面积为 4πd² 的球面上，所以我们看到的亮度 b = L / 4πd²：距离加倍，亮度只剩 1/4。天文学家用星等表示亮度：星等越小越亮，相差 5 等亮度相差 100 倍。绝对星等是把恒星放在 10 秒差距处时的星等，便于公平比较。'],
        astro: { kit: 'stars', mode: 'bright', clock: { from: 1, to: 3, rate: 0.35, unit: 'x', fmt: ['Inverse-square law', '平方反比定律'] } },
      },
      {
        title: ['Measuring distance: parallax', '测量距离：视差'],
        sketch: true,
        body: ['As Earth goes round the Sun, a nearby star seems to shift back and forth against much more distant stars. Half of that shift is the parallax angle p. A star with p = 1 arcsecond is 1 parsec away (3.26 light-years): d = 1/p. Even the nearest star, Proxima Centauri, has p = 0.77″ — far too small to see by eye.', '地球绕太阳公转时，近处的恒星相对于遥远的背景恒星会来回移动。这个移动角度的一半叫视差角 p。视差为 1 角秒的恒星，距离就是 1 秒差距（约 3.26 光年）：d = 1/p。即使是最近的恒星比邻星，视差也只有 0.77″，肉眼根本看不出来。'],
        astro: { kit: 'stars', mode: 'parallax', clock: { from: 0, to: 365, rate: 45, unit: 'day' } },
      },
      {
        title: ['Magnitude and distance', '星等和距离'],
        body: ['Sirius (m = −1.46) is the brightest star of our night sky, and Rigel (m = +0.13) looks a little fainter. But Sirius is only 2.64 pc (8.6 light-years) away, Rigel about 260 pc. The distance modulus m − M = 5 log₁₀(d / 10 pc) turns that into absolute magnitudes: Sirius M = +1.4, Rigel M ≈ −7.0. Rigel truly gives out about 5 000 times more light; it just lies 100 times farther away.', '天狼星（视星等 −1.46）是夜空中最亮的恒星，参宿七（+0.13）看起来稍暗一些。可是天狼星距我们只有 2.64 秒差距（8.6 光年），参宿七却远在约 260 秒差距。用距离模数 m − M = 5 log₁₀(d / 10 秒差距) 换算成绝对星等：天狼星 M = +1.4，参宿七 M ≈ −7.0。参宿七实际的发光本领约是天狼星的 5000 倍，只是它远了 100 倍。'],
        astro: { kit: 'sky', view: 'dome', look: [180, 30], fov: 72, t: Date.UTC(2025, 0, 15, 13), cons: ['ori', 'cma', 'tau'], names: true, stars: ['Sirius', 'Rigel', 'Betelgeuse'] },
      },
      {
        title: ['Luminosity and the HR diagram', '光度和赫罗图'],
        fig: hrFig(false),
        body: ['A star’s luminosity L is the total power it gives out. It depends on size and temperature: L = 4πR²σT⁴. Plot luminosity against temperature and most stars, including the Sun, fall on one band: the main sequence. Stars that are cool but very bright must be huge (giants and supergiants); hot but dim ones must be tiny (white dwarfs).', '光度 L 是恒星每秒发出的总能量，它由大小和温度决定：L = 4πR²σT⁴。以温度为横轴、光度为纵轴画图，就是赫罗图。大多数恒星（包括太阳）都落在一条带上，叫主序星。温度低却很亮的恒星一定非常大（巨星和超巨星）；温度高却很暗的恒星一定非常小（白矮星）。'],
        astro: { kit: 'stars', mode: 'hr', named: true },
      },
      {
        title: ['The main sequence is a mass sequence', '主序就是质量序列'],
        body: ['Along the main sequence, mass decides everything. Luminosity rises steeply with mass, roughly L ∝ M^3.5: a 10 M☉ B star is about 3 000 times as luminous as the Sun, a 0.5 M☉ red dwarf less than 1/10. Since fuel ∝ M but burning rate ∝ L, lifetime t ≈ 10 billion years × M^−2.5: about 30 million years for 10 M☉, 1.8 billion for 2 M☉ and over 50 billion for 0.5 M☉. Top left is massive, hot and short-lived; bottom right is small, cool and almost immortal.', '在主序上，质量决定一切。光度随质量急剧增大，大约 L ∝ M^3.5：10 倍太阳质量的 B 型星光度约是太阳的 3000 倍，0.5 倍太阳质量的红矮星不到太阳的 1/10。燃料与 M 成正比，消耗速度与 L 成正比，所以寿命 t ≈ 100 亿年 × M^−2.5：10 倍太阳质量约 3000 万年，2 倍约 18 亿年，0.5 倍超过 500 亿年。主序左上方的恒星质量大、温度高、寿命短；右下方的恒星小、冷，几乎“长生不老”。'],
        astro: { kit: 'stars', mode: 'hr', named: true },
      },
      {
        title: ['Stars move on the diagram', '恒星在图上“移动”'],
        body: ['A star’s place on the HR diagram changes as it ages. The Sun has spent 4.6 billion years on the main sequence. Later it swells into a red giant (up and to the right), sheds its outer layers, and its core ends as a white dwarf (down and to the left). Watch the clock: these late stages are over in a flash compared with its long main-sequence life.', '随着年龄增长，恒星在赫罗图上的位置会改变。太阳已经在主序阶段度过了 46 亿年，将来它会膨胀成红巨星（向右上方移动），然后抛掉外层，核心变成白矮星（移到左下方）。看看时钟：和漫长的主序阶段相比，这些晚期阶段一闪而过。'],
        astro: { kit: 'stars', mode: 'hr', track: true, clock: { from: 0, to: 13, rate: 0.6, unit: 'gyr', at: 0.35, once: true } },
      },
    ],
    quiz: [
      { q: ['Two identical stars: one is 3 times farther from us than the other. The farther one looks…', '两颗完全相同的恒星，一颗到我们的距离是另一颗的 3 倍。较远的那颗看起来'],
        options: [['1/9 as bright', '亮度是 1/9'], ['1/3 as bright', '亮度是 1/3'], ['equally bright', '一样亮'], ['3 times brighter', '亮 3 倍']], answer: 0,
        why: ['Brightness falls as 1/d²: 3 times the distance gives 1/3² = 1/9 of the brightness.', '亮度与距离的平方成反比：距离变为 3 倍，亮度变为 1/3² = 1/9。'] },
      { q: ['On this HR diagram, which letter marks the white dwarfs?', '在这幅赫罗图中，哪个字母标出的是白矮星？'], fig: hrFig(true),
        options: [['A', 'A'], ['B', 'B'], ['C', 'C'], ['D', 'D']], answer: 2,
        why: ['White dwarfs are hot but very dim — bottom left. To be so faint at that temperature they must be tiny, about the size of Earth.', '白矮星温度高但非常暗，位于左下方。温度这么高却这么暗，说明它们非常小，大约和地球一样大。'] },
      { q: ['A star has a parallax angle of 0.1 arcseconds. How far away is it?', '一颗恒星的视差角是 0.1 角秒，它距我们多远？'],
        options: [['10 parsecs', '10 秒差距'], ['0.1 parsecs', '0.1 秒差距'], ['1 parsec', '1 秒差距'], ['100 parsecs', '100 秒差距']], answer: 0,
        why: ['d = 1/p = 1/0.1 = 10 parsecs, about 33 light-years.', 'd = 1/p = 1/0.1 = 10 秒差距，约 33 光年。'] },
      { q: ['Tap the Sun on the HR diagram.', '在赫罗图上点出太阳。'], astro: { kit: 'stars', mode: 'hr' }, pick: 'sun',
        why: ['The Sun is a middle-of-the-road main-sequence star: about 5 800 K, luminosity 1.', '太阳是一颗普通的主序星：表面温度约 5800 K，光度为 1。'] },
      { q: ['A star has apparent magnitude m = +5 and absolute magnitude M = 0. Using m − M = 5 log₁₀(d / 10 pc), how many parsecs away is it?', '一颗恒星的视星等 m = +5，绝对星等 M = 0。用 m − M = 5 log₁₀(d / 10 秒差距) 计算，它距我们多少秒差距？'],
        num: { answer: 100, tol: 2, unit: ['pc', '秒差距'] },
        why: ['5 = 5 log₁₀(d/10), so d/10 = 10 and d = 100 pc (326 light-years). Each 5 magnitudes of dimming means 10 times the distance.', '5 = 5 log₁₀(d/10)，所以 d/10 = 10，d = 100 秒差距（326 光年）。暗 5 个星等就相当于远 10 倍。'] },
      { q: ['A main-sequence star has twice the Sun’s mass. Lifetime scales as M^−2.5. How many times shorter is its life than the Sun’s?', '一颗主序星的质量是太阳的 2 倍。寿命与 M^−2.5 成正比。它的寿命比太阳短多少倍？'],
        num: { answer: 5.66, tol: 0.3, unit: ['times', '倍'] },
        why: ['2^2.5 = 5.66, so it lives about 10 / 5.66 ≈ 1.8 billion years. It has twice the fuel but burns it about 11 times faster (2^3.5).', '2^2.5 = 5.66，所以它只能存在约 100 / 5.66 ≈ 18 亿年。燃料是太阳的 2 倍，燃烧速度却约是 11 倍（2^3.5）。'] },
      { q: ['Put these spectral classes in order from hottest to coolest.', '把这些光谱型按从热到冷排序。'],
        order: [['O (blue, over 30 000 K)', 'O 型（蓝色，30000 K 以上）'], ['B (blue-white, e.g. Rigel)', 'B 型（蓝白色，如参宿七）'], ['A (white, e.g. Sirius, Vega)', 'A 型（白色，如天狼星、织女星）'], ['G (yellow, the Sun)', 'G 型（黄色，太阳）'], ['M (red, e.g. Betelgeuse)', 'M 型（红色，如参宿四）']],
        why: ['The sequence is O B A F G K M, from over 30 000 K down to below 3 700 K. Colour goes from blue through white and yellow to red.', '光谱型顺序是 O、B、A、F、G、K、M，温度从 30000 K 以上降到 3700 K 以下，颜色从蓝、白、黄变到红。'] },
      { q: ['Match each star with its surface temperature.', '把恒星和它的表面温度配对。'],
        match: [[['Betelgeuse (red)', '参宿四（红色）'], ['about 3 600 K', '约 3600 K']], [['The Sun (yellow-white)', '太阳（黄白色）'], ['about 5 800 K', '约 5800 K']], [['Sirius (white)', '天狼星（白色）'], ['about 9 900 K', '约 9900 K']], [['Rigel (blue-white)', '参宿七（蓝白色）'], ['about 12 000 K', '约 12000 K']]],
        why: ['Wien’s law: λmax = 2.9 × 10⁻³ / T. Betelgeuse peaks in the infrared (≈ 800 nm), the Sun in green-yellow (500 nm), Rigel in the ultraviolet (≈ 240 nm).', '维恩定律：λmax = 2.9 × 10⁻³ / T。参宿四的辐射峰值在红外（约 800 nm），太阳在黄绿光（500 nm），参宿七在紫外（约 240 nm）。'] },
    ],
  },
  {
    id: 'a-star-life', strand: 'stars', level: 'sr', tracks: ['uk', 'ib', 'us'], unit: stars, icon: 'sun', minutes: 11,
    title: ['The life of a star', '恒星的一生'],
    blurb: ['Fusion, two paths decided by mass, supernovae that make the elements, and the Sun’s future.', '核聚变、由质量决定的两条演化道路、制造元素的超新星，以及太阳的未来。'],
    keys: [
      ['Stars shine by fusing hydrogen into helium; the lost mass becomes energy (E = mc²).', '恒星靠氢聚变成氦而发光，减少的质量转化为能量（E = mc²）。'],
      ['A star’s mass decides its life. Sun-like: red giant → planetary nebula → white dwarf.', '质量决定恒星的一生。类太阳恒星：红巨星 → 行星状星云 → 白矮星。'],
      ['Massive stars: red supergiant → supernova → neutron star or black hole.', '大质量恒星：红超巨星 → 超新星爆发 → 中子星或黑洞。'],
      ['By birth mass: under 0.5 M☉ red dwarfs; 0.5–8 M☉ white dwarfs (at most 1.4 M☉, the Chandrasekhar limit); 8–25 M☉ neutron stars; above ~25 M☉ black holes.', '按出生质量分：0.5 M☉ 以下是红矮星；0.5～8 M☉ 最终成为白矮星（不超过 1.4 M☉，即钱德拉塞卡极限）；8～25 M☉ 成为中子星；约 25 M☉ 以上成为黑洞。'],
      ['Almost every element heavier than helium was made in stars: we are made of star stuff.', '几乎所有比氦重的元素都是在恒星中产生的：我们身体里的原子来自恒星。'],
      ['The Sun is 4.6 billion years old; in about 5 billion years it will become a red giant, then a white dwarf.', '太阳约 46 亿岁，再过约 50 亿年它将变成红巨星，最后成为白矮星。'],
    ],
    steps: [
      {
        title: ['What makes a star shine', '恒星为什么发光'],
        body: ['In a star’s core, at about 15 million °C, hydrogen nuclei fuse into helium. Four hydrogen nuclei make one helium nucleus, but about 0.7 % of their mass disappears, turned into energy (E = mc²). The Sun turns about 4 million tonnes of mass into energy every second, and the outward push of that energy balances gravity.', '在恒星核心约 1500 万 °C 的高温下，氢原子核聚变成氦原子核。4 个氢核结合成 1 个氦核，质量减少约 0.7%，减少的质量转化为能量（E = mc²）。太阳每秒有约 400 万吨质量转化为能量，这些能量向外的压力与引力相互平衡。'],
        astro: { kit: 'life', mode: 'fusion' },
      },
      {
        title: ['Mass decides a star’s fate', '质量决定命运'],
        body: ['Every star is born in a nebula, a cloud of gas and dust that gravity pulls together until fusion starts. What happens next depends on its mass. A star like the Sun lives about 10 billion years and fades quietly; a star of 20 solar masses burns its fuel so fast that it lasts only about 10 million years, then explodes.', '每颗恒星都诞生在星云中：气体和尘埃组成的云团在引力作用下收缩，直到核心开始核聚变。之后的命运取决于恒星的质量。像太阳这样的恒星能存在约 100 亿年，最后平静地暗淡下去；20 倍太阳质量的恒星消耗燃料极快，只能存在约 1000 万年，然后发生爆炸。'],
        astro: { kit: 'life', mode: 'both' },
      },
      {
        title: ['A Sun-like star', '类太阳恒星的一生'],
        body: ['When hydrogen runs out in the core, the core shrinks and heats up while the outer layers swell and cool: the star becomes a red giant. Later the outer layers drift away as a glowing planetary nebula. The hot core left behind is a white dwarf: about the size of Earth, yet holding about half the Sun’s mass.', '核心的氢耗尽后，核心收缩升温，外层却膨胀冷却，恒星变成红巨星。之后外层气体向外飘散，形成发光的行星状星云。留下的炽热核心就是白矮星：大小和地球差不多，质量却约有太阳的一半。'],
        astro: { kit: 'life', mode: 'sun', clock: { from: 0, to: 5, rate: 0.32, unit: 'x', fmt: ['Sun-like star', '类太阳恒星'], once: true } },
      },
      {
        title: ['A massive star', '大质量恒星的一生'],
        body: ['A massive star becomes a red supergiant and fuses heavier and heavier elements in its core, up to iron. Fusing iron releases no energy, so the core suddenly collapses in under a second and the star blows apart as a supernova, for a few weeks outshining a whole galaxy. The core left behind is a neutron star — or, for the most massive stars, a black hole.', '大质量恒星会变成红超巨星，核心里聚变出越来越重的元素，直到铁。铁的聚变不再释放能量，于是核心在不到一秒内突然坍缩，恒星发生超新星爆发，在几周内比整个星系还亮。留下的核心成为中子星；质量最大的恒星则会留下黑洞。'],
        astro: { kit: 'life', mode: 'massive', end: 'ns', clock: { from: 0, to: 5, rate: 0.32, unit: 'x', fmt: ['Massive star', '大质量恒星'], once: true } },
      },
      {
        title: ['Four endings by mass', '按质量分的四种结局'],
        fig: fateFig,
        body: ['Birth mass sorts stars into four fates. Red dwarfs under 0.5 M☉ burn so slowly that none has died yet in the universe’s 13.8 billion years. Stars of 0.5–8 M☉ end as white dwarfs, which can hold at most 1.4 M☉ (the Chandrasekhar limit, 1930). From about 8 to 25 M☉ the collapsing core becomes a neutron star: 1.4–2 M☉ squeezed into a ball 20 km across. Above about 25 M☉ even neutrons cannot stop the collapse, and a black hole forms.', '出生质量把恒星分成四种结局。0.5 M☉ 以下的红矮星燃烧得非常慢，宇宙诞生 138 亿年以来还没有一颗死去。0.5～8 M☉ 的恒星最终成为白矮星，白矮星的质量最多 1.4 M☉（钱德拉塞卡极限，1930 年）。约 8～25 M☉ 的恒星，坍缩的核心成为中子星：1.4～2 M☉ 的物质挤在直径约 20 千米的球里。约 25 M☉ 以上，连中子也挡不住坍缩，形成黑洞。'],
        astro: { kit: 'life', mode: 'both' },
      },
      {
        title: ['We are made of star stuff', '我们来自恒星'],
        fig: elementsFig,
        body: ['Hydrogen and helium came from the Big Bang. Carbon, oxygen, iron and most other elements were made by fusion inside stars, and many heavier ones, like gold and uranium, in supernovae and collisions of neutron stars. These explosions scatter the elements into space, where they become part of new stars and planets — and of us.', '氢和氦来自宇宙大爆炸。碳、氧、铁等大多数元素是在恒星内部通过核聚变产生的；金、铀等许多更重的元素产生于超新星爆发和中子星并合。这些爆发把元素撒向太空，成为新的恒星、行星——以及我们身体的一部分。'],
        astro: { kit: 'life', mode: 'massive', end: 'bh', clock: { from: 3.5, to: 5, rate: 0.15, unit: 'x', fmt: ['Massive star', '大质量恒星'], once: true } },
      },
      {
        title: ['The Sun’s future', '太阳的未来'],
        body: ['The Sun is 4.6 billion years old, about halfway through its main-sequence life. In about 5 billion years it will swell into a red giant over 100 times its present width, swallowing Mercury and Venus and perhaps Earth. Then it will shed its outer layers and end as a white dwarf. It is not massive enough to become a supernova.', '太阳约 46 亿岁，主序阶段大约过了一半。再过约 50 亿年，它会膨胀成红巨星，直径变为现在的 100 多倍，吞没水星和金星，甚至可能吞没地球。之后它会抛掉外层，最终成为一颗白矮星。太阳的质量不够大，不会发生超新星爆发。'],
        astro: { kit: 'stars', mode: 'hr', track: true, clock: { from: 4.6, to: 13, rate: 0.5, unit: 'gyr', once: true } },
      },
    ],
    quiz: [
      { q: ['What mainly decides how a star lives and dies?', '决定恒星一生的主要因素是什么？'],
        options: [['Its mass', '它的质量'], ['Its distance from Earth', '它到地球的距离'], ['How many planets it has', '它有多少颗行星'], ['Which constellation it is in', '它在哪个星座']], answer: 0,
        why: ['Mass sets how hot the core gets and how fast fuel burns, so it decides the whole path: white dwarf, or supernova and neutron star / black hole.', '质量决定核心温度和燃料消耗的快慢，因而决定恒星的整个演化道路：成为白矮星，或发生超新星爆发后成为中子星或黑洞。'] },
      { q: ['Tap the object the Sun will finally become.', '点出太阳最终会变成的天体。'], astro: { kit: 'life', mode: 'both' }, pick: 'wd',
        why: ['The Sun is not massive enough to explode: after the red giant and planetary nebula stages, its core will be a white dwarf.', '太阳质量不够大，不会爆炸：经过红巨星和行星状星云阶段后，它的核心将成为白矮星。'] },
      { q: ['Where were most elements heavier than iron, such as gold, made?', '金等比铁重的元素主要是在哪里产生的？'],
        options: [['In supernovae and neutron-star collisions', '超新星爆发和中子星并合'], ['In the Big Bang', '宇宙大爆炸'], ['In the Sun’s core today', '今天的太阳核心'], ['In Earth’s hot core', '地球炽热的地核']], answer: 0,
        why: ['Fusion in stars stops at iron. Heavier elements form in the extreme conditions of supernovae and neutron-star mergers.', '恒星内部的聚变到铁就停止了。更重的元素是在超新星爆发和中子星并合的极端条件下形成的。'] },
      { q: ['About when will the Sun become a red giant?', '太阳大约什么时候会变成红巨星？'],
        options: [['In about 5 billion years', '约 50 亿年后'], ['In about 5 million years', '约 500 万年后'], ['It already is one', '它已经是红巨星了'], ['Never: it will explode first', '永远不会：它会先爆炸']], answer: 0,
        why: ['The Sun is 4.6 billion years old, about halfway through its ~10-billion-year main-sequence life.', '太阳约 46 亿岁，大约走完了约 100 亿年主序阶段的一半。'] },
      { q: ['Put the stages in the life of a 20 M☉ star in order.', '把一颗 20 倍太阳质量恒星一生的阶段排好顺序。'],
        order: [['Nebula of gas and dust', '气体和尘埃组成的星云'], ['Main-sequence star fusing hydrogen', '主序星，氢聚变'], ['Red supergiant fusing up to iron', '红超巨星，聚变到铁'], ['Supernova', '超新星爆发'], ['Neutron star', '中子星']],
        why: ['Nebula → main sequence (about 10 million years) → red supergiant → core collapse and supernova → a neutron star about 20 km across.', '星云 → 主序星（约 1000 万年）→ 红超巨星 → 核心坍缩、超新星爆发 → 直径约 20 千米的中子星。'] },
      { q: ['Match each birth mass with how the star ends.', '把恒星的出生质量和它的结局配对。'],
        match: [[['0.2 M☉', '0.2 M☉'], ['still shining as a red dwarf', '仍是一颗红矮星']], [['1 M☉ (the Sun)', '1 M☉（太阳）'], ['white dwarf', '白矮星']], [['15 M☉', '15 M☉'], ['neutron star', '中子星']], [['40 M☉', '40 M☉'], ['black hole', '黑洞']]],
        why: ['Red dwarfs outlive the present universe; up to 8 M☉ a white dwarf remains; 8–25 M☉ leaves a neutron star; above ~25 M☉ a black hole.', '红矮星的寿命比现在的宇宙年龄还长；8 M☉ 以下留下白矮星；8～25 M☉ 留下中子星；约 25 M☉ 以上留下黑洞。'] },
      { q: ['Each second the Sun turns about 4 million tonnes of mass into energy. Using E = mc² with c = 3 × 10⁸ m/s, how many × 10²⁶ watts is that?', '太阳每秒约有 400 万吨质量转化为能量。用 E = mc²（c = 3 × 10⁸ m/s）计算，太阳的功率约是多少 × 10²⁶ 瓦？'],
        num: { answer: 3.6, tol: 0.3, unit: ['× 10²⁶ W', '× 10²⁶ 瓦'] },
        why: ['m = 4 × 10⁹ kg; E = 4 × 10⁹ × (3 × 10⁸)² = 3.6 × 10²⁶ J every second. The measured luminosity is 3.8 × 10²⁶ W.', 'm = 4 × 10⁹ 千克；E = 4 × 10⁹ × (3 × 10⁸)² = 3.6 × 10²⁶ 焦，每秒如此。实测太阳光度为 3.8 × 10²⁶ 瓦。'] },
    ],
  },
];
