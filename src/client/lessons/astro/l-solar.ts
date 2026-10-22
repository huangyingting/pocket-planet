/** Astronomy lessons: the Solar System — the planets, its scale, small bodies, and systems of celestial bodies. */
import { svg, tx, type Lx } from '../figs.ts';
import type { Lesson, Pair } from '../kit.ts';

const unit: Pair = ['The Solar System', '太阳系'];
const DAY = 864e5;
const T25 = Date.UTC(2025, 0, 1);

/** Nested boxes: the levels of celestial systems. */
function hierarchy(L: Lx): string {
  const box = (x: number, y: number, w: number, h: number, c: string, d: number) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${c}" fill-opacity=".07" stroke="${c}" stroke-opacity=".75" class="f-fade" style="--d:${d}s"/>`;
  const lab = (x: number, y: number, p: Pair, c: string, d: number) => `<g class="f-fade" style="--d:${d}s">${tx(x, y, L(p), 'fg-label', 's', ` style="fill:${c}"`)}</g>`;
  const sub = (x: number, y: number, p: Pair, d: number, a: 's' | 'm' | 'e' = 's') => `<g class="f-fade" style="--d:${d}s">${tx(x, y, L(p), 'fg-sub', a)}</g>`;
  let o = tx(160, 10, L(['Levels of celestial systems', '天体系统的层次']), 'fg-title', 'm');
  o += box(2, 16, 316, 158, '#ff922b', 0.9) + lab(9, 27, ['Observable universe', '可观测宇宙'], '#ff922b', 0.9);
  o += sub(312, 27, ['≈ 93 billion ly across', '直径约 930 亿光年'], 1, 'e');
  o += box(9, 33, 212, 136, '#b197fc', 0.6) + lab(16, 44, ['Milky Way', '银河系'], '#b197fc', 0.6);
  o += sub(16, 163, ['≈ 100 000 ly across', '直径约 10 万光年'], 0.7);
  o += box(16, 50, 144, 104, '#ffd24a', 0.3) + lab(23, 61, ['Solar System', '太阳系'], '#ffd24a', 0.3);
  o += box(23, 68, 74, 78, '#4dabf7', 0) + lab(30, 79, ['Earth–Moon', '地月系'], '#4dabf7', 0);
  o += `<circle cx="50" cy="110" r="11" fill="#4d8fd6"/><path d="M50 99 a11 11 0 0 1 0 22" fill="#1d3557" opacity=".55"/>`;
  o += `<circle cx="80" cy="100" r="4" fill="#ced4da"/><ellipse cx="50" cy="110" rx="30" ry="12" fill="none" stroke="#a5d8ff" stroke-opacity=".35" stroke-dasharray="2 2"/>`;
  o += sub(30, 139, ['384 400 km', '38.44 万千米'], 0.1);
  o += `<g class="f-fade" style="--d:.4s"><circle cx="136" cy="80" r="9" fill="#ffd24a"/>` +
    ['#c9c0b6:112:104:2', '#e0835a:124:118:2.4', '#e0bf96:146:106:5', '#ecd9a4:140:132:4.2'].map(s => { const [c, x, y, r] = s.split(':'); return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`; }).join('') + `</g>`;
  o += sub(104, 148, ['Sun, planets…', '太阳、行星…'], 0.4);
  o += `<g class="f-fade" style="--d:.7s">` + [[172, 70], [190, 92], [178, 120], [202, 130], [196, 64], [168, 146], [205, 108]].map(([x, y], i) =>
    `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.6 : 2.4}" fill="${i % 2 ? '#fff3bf' : '#d0ebff'}"/>`).join('') + `</g>`;
  o += sub(166, 158, ['other stars', '其他恒星'], 0.8);
  o += box(228, 33, 84, 136, '#3bc9db', 1.1) + lab(234, 44, ['Other galaxies', '河外星系'], '#3bc9db', 1.1);
  o += `<g class="f-fade" style="--d:1.2s" fill="#c5f6fa" fill-opacity=".55">` + [[256, 72, 14, 5, -20], [288, 100, 10, 4, 30], [252, 124, 12, 7, 10], [292, 146, 8, 3, -35]].map(([x, y, a, b, r]) =>
    `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" transform="rotate(${r} ${x} ${y})"/>`).join('') + `</g>`;
  o += sub(234, 163, ['e.g. Andromeda', '如仙女星系'], 1.2);
  return svg(320, 176, o, L(['Nested celestial systems', '天体系统的层次']));
}

export const A_SOLAR: Lesson[] = [
  // ------------------------------------------------------------------------------------------------ the planets
  {
    id: 'a-planets', strand: 'solar', level: 'jr', tracks: ['uk', 'us', 'ib'], unit, icon: 'planet', minutes: 9,
    title: ['The eight planets', '八大行星'],
    blurb: ['Meet the Sun’s family: rocky inner worlds, giant outer worlds, and the dwarf planets beyond.', '认识太阳的家族：岩质的类地行星、庞大的巨行星，还有更远处的矮行星。'],
    keys: [
      ['Order from the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.', '离太阳由近到远：水星、金星、地球、火星、木星、土星、天王星、海王星。'],
      ['The four inner planets are small and rocky (terrestrial planets).', '内侧四颗是体积小、由岩石构成的类地行星。'],
      ['Jupiter and Saturn are gas giants; Uranus and Neptune are ice giants. Jupiter is the largest planet.', '木星、土星是巨行星，天王星、海王星是远日行星（冰巨星）。木星是最大的行星。'],
      ['Dwarf planets such as Pluto and Ceres are round but have not cleared their orbits.', '冥王星、谷神星等矮行星呈球形，但没有清空自己轨道附近的区域。'],
    ],
    steps: [
      {
        title: ['The Sun’s family', '太阳的家族'],
        astro: { kit: 'orrery', clock: { from: 0, to: 12, rate: 0.2, unit: 'year' } },
        body: ['The Solar System is the Sun and everything that orbits it. The Sun holds 99.8% of all its mass, and its gravity keeps eight planets on their paths. In order from the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune.', '太阳系由太阳和所有绕它运行的天体组成。太阳占太阳系总质量的 99.8%，它的引力让八颗行星沿着各自的轨道运行。离太阳由近到远依次是：水星、金星、地球、火星、木星、土星、天王星和海王星。'],
      },
      {
        title: ['Rocky planets and giants', '类地行星和巨行星'],
        astro: { kit: 'orrery', groups: true, clock: { from: 0, to: 12, rate: 0.2, unit: 'year' } },
        body: ['The four inner planets are small, dense and rocky: the terrestrial planets. Jupiter and Saturn are huge gas giants made mostly of hydrogen and helium. Uranus and Neptune, far out in the cold, are ice giants, rich in water, ammonia and methane.', '内侧四颗行星体积小、密度大，由岩石构成，叫类地行星。木星和土星是主要由氢和氦组成的巨行星。天王星和海王星离太阳很远、非常寒冷，含有大量水、氨和甲烷冰，叫远日行星（冰巨星）。'],
      },
      {
        title: ['Sizes side by side', '大小比一比'],
        astro: { kit: 'orrery', mode: 'lineup', groups: true },
        body: ['Here the planets are drawn to the same scale, next to the edge of the Sun. Jupiter is 11 times wider than Earth, and the Sun is 109 times wider. Earth is the largest of the rocky planets; Mercury is the smallest planet of all.', '这里的行星按同一比例画出，左边是太阳的边缘。木星的直径是地球的 11 倍，太阳的直径是地球的 109 倍。地球是类地行星中最大的，水星是八颗行星中最小的。'],
      },
      {
        title: ['Four rocky worlds', '四颗岩质行星'],
        astro: { kit: 'orrery', planets: ['mercury', 'venus', 'earth', 'mars'], groups: true, clock: { from: 0, to: 4, rate: 0.12, unit: 'year' } },
        body: ['Mercury has almost no air and is covered in craters. Venus is wrapped in thick carbon dioxide clouds, and at about 464 °C it is the hottest planet. Earth is the only planet known to have liquid water on its surface and life. Mars is a cold red desert with Olympus Mons, a volcano about 22 km high.', '水星几乎没有大气，表面布满环形山。金星被浓厚的二氧化碳云层包裹，表面约 464 °C，是最热的行星。地球是目前所知唯一表面有液态水和生命的行星。火星是寒冷的红色荒漠，有高约 22 千米的奥林匹斯火山。'],
      },
      {
        title: ['Four giant worlds', '四颗巨大的行星'],
        astro: { kit: 'orrery', mode: 'lineup', planets: ['jupiter', 'saturn', 'uranus', 'neptune'], groups: true },
        body: ['Jupiter’s Great Red Spot is a storm wider than Earth. Saturn has the brightest rings, made of ice and rock, and is less dense than water. Uranus spins tipped on its side. Neptune has the fastest winds in the Solar System, about 2,000 km/h. None of them has a solid surface to stand on.', '木星的大红斑是一个比地球还宽的风暴。土星有最明亮的光环，由冰块和岩石组成，它的平均密度比水还小。天王星“躺着”自转。海王星的风速约 2000 千米/时，是太阳系中最快的。这四颗行星都没有可以站立的固体表面。'],
      },
      {
        title: ['Dwarf planets', '矮行星'],
        astro: { kit: 'orrery', dwarfs: true, belt: true, kuiper: true, scale: 'log', clock: { from: 0, to: 40, rate: 1, unit: 'year' } },
        body: ['In 2006 astronomers decided that Pluto is a dwarf planet: it is round and orbits the Sun, but it shares its orbit with many other icy bodies in the Kuiper belt. Ceres, the largest object in the asteroid belt, is a dwarf planet too, along with Eris, Haumea and Makemake.', '2006 年，天文学家把冥王星重新归类为矮行星：它呈球形、绕太阳运行，但它的轨道附近还有柯伊伯带里的许多冰质天体。小行星带中最大的谷神星也是矮行星，同类的还有阋神星、妊神星和鸟神星。'],
      },
    ],
    quiz: [
      { q: ['Tap the largest planet.', '点出最大的行星。'], pick: 'jupiter', astro: { kit: 'orrery', mode: 'lineup' },
        why: ['Jupiter is the largest planet, about 11 times wider than Earth.', '木星是最大的行星，直径约为地球的 11 倍。'] },
      { q: ['Which planets are terrestrial (rocky) planets?', '下列哪一组都是类地行星？'],
        options: [['Mercury, Venus, Earth, Mars', '水星、金星、地球、火星'], ['Jupiter, Saturn, Uranus, Neptune', '木星、土星、天王星、海王星'], ['Earth, Mars, Jupiter, Saturn', '地球、火星、木星、土星'], ['Venus, Earth, Uranus, Pluto', '金星、地球、天王星、冥王星']], answer: 0,
        why: ['The four inner planets are small and rocky.', '离太阳最近的四颗行星体积小，由岩石构成。'] },
      { q: ['Counting out from the Sun, which planet comes fourth?', '离太阳由近到远，第四颗行星是'],
        options: [['Mars', '火星'], ['Earth', '地球'], ['Jupiter', '木星'], ['Venus', '金星']], answer: 0,
        why: ['Mercury, Venus, Earth, then Mars.', '依次是水星、金星、地球，然后是火星。'] },
      { q: ['Why is Pluto called a dwarf planet?', '冥王星为什么被归为矮行星？'],
        options: [['It has not cleared other bodies from around its orbit', '它没有清空轨道附近的其他天体'], ['It does not orbit the Sun', '它不绕太阳运行'], ['It is not round', '它不是球形的'], ['It has no moons', '它没有卫星']], answer: 0,
        why: ['Pluto is round and orbits the Sun, but it shares its region with many Kuiper belt objects.', '冥王星呈球形、绕太阳运行，但它所在区域还有许多柯伊伯带天体。'] },
    ],
  },
  // ------------------------------------------------------------------------------------------------ scale
  {
    id: 'a-scale', strand: 'solar', level: 'jr', tracks: ['uk', 'us', 'ib'], unit, icon: 'ruler', minutes: 9,
    title: ['How big is the Solar System?', '太阳系有多大'],
    blurb: ['Astronomical units, a Sun the size of a football, and light that takes hours to cross the planets.', '天文单位、足球大小的太阳，以及要走几个小时才能穿过行星的光。'],
    keys: [
      ['1 astronomical unit (AU) is the average Earth–Sun distance, about 150 million km.', '1 天文单位是日地平均距离，约 1.5 亿千米。'],
      ['Neptune is about 30 AU from the Sun.', '海王星离太阳约 30 天文单位。'],
      ['Light from the Sun reaches Earth in about 8.3 minutes and Neptune in about 4.2 hours.', '太阳光约 8.3 分钟到达地球，约 4.2 小时到达海王星。'],
      ['Diagrams squash the distances and enlarge the planets; at true scale the planets are tiny dots far apart.', '示意图压缩了距离、放大了行星；按真实比例，行星只是相距遥远的小点。'],
    ],
    steps: [
      {
        title: ['Pictures that cheat', '“作弊”的示意图'],
        astro: { kit: 'orrery', clock: { from: 0, to: 10, rate: 0.2, unit: 'year' } },
        body: ['Almost every picture of the Solar System, including this one, is not to scale. The planets are drawn hundreds of times too big, and the distances are squeezed together. If both were true to scale, every planet would be smaller than a speck of dust on the screen.', '几乎所有太阳系的图，包括这一幅，都没有按比例画。行星被放大了几百倍，距离又被压缩了。如果大小和距离都按真实比例，每颗行星在屏幕上都比一粒灰尘还小。'],
      },
      {
        title: ['The astronomical unit', '天文单位'],
        astro: { kit: 'orrery', planets: ['mercury', 'venus', 'earth', 'mars'], au: true, clock: { from: 0, to: 2, rate: 0.06, unit: 'year' } },
        body: ['Kilometres get clumsy in space, so astronomers use the astronomical unit (AU): the average distance from Earth to the Sun, about 149.6 million km. Mars is about 1.5 AU from the Sun, Jupiter 5.2 AU and Neptune about 30 AU.', '在太空中用千米计量太麻烦，天文学家用天文单位：地球到太阳的平均距离，约 1.496 亿千米。火星距太阳约 1.5 天文单位，木星约 5.2 天文单位，海王星约 30 天文单位。'],
      },
      {
        title: ['If the Sun were a ball', '如果太阳是一个球'],
        astro: { kit: 'ladder', mode: 'model', clock: { from: 0, to: 1000, rate: 32, unit: 'x', fmt: ['{v} m from the Sun', '离太阳 {v} 米'], once: true } },
        body: ['Shrink the Sun to a 30 cm ball. Earth becomes a 2.7 mm peppercorn 32 m away, Jupiter a 3 cm marble at 168 m, and Neptune a 1 cm bead almost 1 km away. Nearly all of the Solar System is empty space.', '把太阳缩小成一个直径 30 厘米的球。地球就成了 32 米外一粒 2.7 毫米的胡椒，木星是 168 米外一颗 3 厘米的弹珠，海王星是将近 1 千米外一颗 1 厘米的珠子。太阳系几乎全是空荡荡的空间。'],
      },
      {
        title: ['Light takes time', '光也要走一阵子'],
        astro: { kit: 'ladder', mode: 'light', clock: { from: 0, to: 260, rate: 9, unit: 'x', fmt: ['{v} min', '{v} 分钟'], once: true } },
        body: ['Light travels 300,000 km every second, yet sunlight needs about 8.3 minutes to reach Earth. It passes Jupiter after 43 minutes and Neptune after about 4.2 hours. So we always see the Sun as it was a few minutes ago.', '光每秒传播 30 万千米，太阳光到达地球仍需约 8.3 分钟。它 43 分钟后经过木星，约 4.2 小时后才到达海王星。所以我们看到的太阳，总是几分钟以前的样子。'],
      },
      {
        title: ['To the next star', '到最近的恒星'],
        astro: { kit: 'ladder', clock: { from: 2, to: 3, rate: 0.1, unit: 'x', fmt: ['Zooming out', '视野放大'], once: true } },
        body: ['Beyond the planets, distances are measured in light-years: the distance light travels in a year, about 9.46 trillion km. The nearest star, Proxima Centauri, is 4.2 light-years away. On our 30 cm Sun model it would be about 8,600 km away, farther than from Beijing to London.', '行星以外的距离用光年来量：光在一年里走过的距离，约 9.46 万亿千米。离太阳最近的恒星比邻星距离我们 4.2 光年。在 30 厘米太阳的模型里，它在约 8600 千米以外，比北京到伦敦还远。'],
      },
    ],
    quiz: [
      { q: ['One astronomical unit (1 AU) is…', '1 天文单位是'],
        options: [['the average distance from Earth to the Sun', '地球到太阳的平均距离'], ['the distance light travels in a year', '光一年走过的距离'], ['the distance from Earth to the Moon', '地球到月球的距离'], ['the width of the Solar System', '太阳系的宽度']], answer: 0,
        why: ['1 AU ≈ 149.6 million km, the average Earth–Sun distance. A light-year is far larger.', '1 天文单位约 1.496 亿千米，是日地平均距离。光年要大得多。'] },
      { q: ['About how long does sunlight take to reach Earth?', '太阳光到达地球大约需要多长时间？'],
        options: [['8 minutes', '8 分钟'], ['8 seconds', '8 秒'], ['8 hours', '8 小时'], ['It arrives instantly', '瞬间到达']], answer: 0,
        why: ['About 8.3 minutes: 150 million km ÷ 300,000 km/s ≈ 500 s.', '约 8.3 分钟：1.5 亿千米 ÷ 30 万千米/秒 ≈ 500 秒。'] },
      { q: ['If the Sun were a 30 cm ball, Earth would be…', '如果太阳是直径 30 厘米的球，地球就是'],
        options: [['a 2.7 mm grain about 32 m away', '约 32 米外一粒 2.7 毫米的小球'], ['a 3 cm ball 1 m away', '1 米外一个 3 厘米的球'], ['a 10 cm ball 5 m away', '5 米外一个 10 厘米的球'], ['a 2.7 mm grain 1 km away', '1 千米外一粒 2.7 毫米的小球']], answer: 0,
        why: ['The Sun is 109 times wider than Earth and about 107 of its own diameters away.', '太阳直径是地球的 109 倍，日地距离约为太阳直径的 107 倍。'] },
      { q: ['Why are Solar System diagrams not drawn to scale?', '太阳系示意图为什么不按比例画？'],
        options: [['At true scale the planets would be invisible dots', '按真实比例，行星会小得看不见'], ['Nobody knows the real distances', '没有人知道真实的距离'], ['The planets are all the same size', '行星都一样大'], ['The planets are very close together', '行星彼此离得很近']], answer: 0,
        why: ['The distances are so huge compared with the planets that a true-scale picture shows almost nothing.', '和行星的大小相比，距离实在太大，按真实比例画几乎什么也看不见。'] },
    ],
  },
  // ------------------------------------------------------------------------------------------------ small bodies
  {
    id: 'a-small-bodies', strand: 'solar', level: 'jr', tracks: ['uk', 'us', 'ib'], unit, icon: 'sparkle', minutes: 10,
    title: ['Asteroids, comets and meteors', '小行星、彗星和流星'],
    blurb: ['Rocky asteroids, icy comets with tails that point away from the Sun, and the dust that makes shooting stars.', '岩质的小行星、尾巴背向太阳的冰质彗星，以及化作流星的尘埃。'],
    keys: [
      ['Most asteroids orbit in the asteroid belt between Mars and Jupiter.', '大多数小行星在火星和木星轨道之间的小行星带运行。'],
      ['Comets are balls of ice and dust; near the Sun they grow a coma and tails that point away from the Sun.', '彗星由冰和尘埃组成；接近太阳时形成彗发和彗尾，彗尾总是背向太阳。'],
      ['A meteor is a streak of light from a grain burning up in the atmosphere; a meteorite is a rock that reaches the ground.', '流星是微粒在大气中燃烧发出的光迹；落到地面的叫陨石。'],
      ['Meteor showers happen when Earth crosses the dust a comet left along its orbit.', '地球穿过彗星沿轨道留下的尘埃带时，就会出现流星雨。'],
    ],
    steps: [
      {
        title: ['The asteroid belt', '小行星带'],
        astro: { kit: 'orrery', planets: ['mercury', 'venus', 'earth', 'mars', 'jupiter'], belt: true, clock: { from: 0, to: 12, rate: 0.25, unit: 'year' } },
        body: ['Between Mars and Jupiter, millions of rocky asteroids orbit the Sun. The largest, Ceres, is about 940 km across and counts as a dwarf planet; most are far smaller. They are so spread out that spacecraft fly through the belt safely, and all of them together weigh only about 3% as much as the Moon.', '在火星和木星的轨道之间，数以百万计的岩质小行星绕太阳运行。最大的谷神星直径约 940 千米，属于矮行星，其余大多小得多。它们分布得非常稀疏，探测器可以安全穿过；全部加起来，质量也只有月球的 3% 左右。'],
      },
      {
        title: ['Comets and their tails', '彗星和彗尾'],
        astro: { kit: 'orrery', planets: ['mercury', 'venus', 'earth', 'mars', 'jupiter'], comet: 'encke', clock: { from: Date.UTC(2026, 5, 1), to: Date.UTC(2027, 7, 1), rate: 16, unit: 'date' } },
        body: ['A comet is a “dirty snowball” of ice and dust a few kilometres across. Near the Sun its ice turns to gas, making a glowing coma and two tails: a straight bluish gas tail and a curved yellowish dust tail. Sunlight and the solar wind push them, so the tails always point away from the Sun.', '彗星是直径几千米的“脏雪球”，由冰和尘埃组成。接近太阳时，冰升华成气体，形成发光的彗发和两条彗尾：一条笔直、偏蓝的气体彗尾，一条弯曲、偏黄的尘埃彗尾。太阳光和太阳风推动它们，所以彗尾总是背向太阳。'],
      },
      {
        title: ['Long journeys', '漫长的旅程'],
        astro: { kit: 'orrery', comet: 'halley', kuiper: true, t0: Date.UTC(1980, 0, 1), clock: { from: 0, to: 82, rate: 3, unit: 'year' } },
        body: ['Comets move on long, stretched ellipses. Halley’s Comet returns every 76 years: it last passed the Sun in 1986 and will be back in 2061. Short-period comets come from the Kuiper belt beyond Neptune; long-period ones fall in from the far-off Oort Cloud.', '彗星沿着又长又扁的椭圆轨道运行。哈雷彗星约每 76 年回归一次：上一次经过近日点是 1986 年，下一次是 2061 年。短周期彗星来自海王星以外的柯伊伯带，长周期彗星来自遥远的奥尔特云。'],
      },
      {
        title: ['Meteors and meteorites', '流星和陨石'],
        astro: { kit: 'model', kind: 'meteors', shower: 'perseids', event: 'meteor-shower', clock: { from: -8, to: 8, rate: 1, unit: 'day' } },
        body: ['A meteor, or shooting star, is a grain of space dust hitting the air at tens of kilometres per second and burning up as a streak of light. A rock big enough to survive the fall and land on the ground is a meteorite. Most meteorites are pieces of asteroids.', '流星是太空中的微粒以每秒几十千米的速度冲进大气层、燃烧发光留下的光迹。体积较大、没有烧完而落到地面的叫陨石。大多数陨石是小行星的碎块。'],
      },
      {
        title: ['Meteor showers', '流星雨'],
        astro: { kit: 'orrery', planets: ['mercury', 'venus', 'earth', 'mars', 'jupiter'], comet: 'encke', stream: true, clock: { from: 0, to: 6, rate: 0.15, unit: 'year' } },
        body: ['A comet leaves a trail of dust along its orbit. Each year, on the same dates, Earth ploughs through such a trail and we see a meteor shower: the Perseids every August come from Comet Swift–Tuttle, and the Taurids in autumn from Comet Encke, shown here.', '彗星沿轨道留下一条尘埃带。每年同一时间，地球穿过这样的尘埃带，我们就会看到流星雨：每年 8 月的英仙座流星雨来自斯威夫特—塔特尔彗星，秋季的金牛座流星雨来自图中的恩克彗星。'],
      },
    ],
    quiz: [
      { q: ['In which direction does a comet’s tail point?', '彗尾指向哪个方向？'], astro: { kit: 'orrery', planets: ['mercury', 'venus', 'earth', 'mars', 'jupiter'], comet: 'encke', t0: Date.UTC(2027, 0, 20), labels: false },
        options: [['Away from the Sun', '背向太阳'], ['Behind the comet, along its path', '沿运动方向的后方'], ['Toward the Sun', '指向太阳'], ['Toward Earth', '指向地球']], answer: 0,
        why: ['Sunlight and the solar wind push the gas and dust outward, so the tail points away from the Sun even when the comet is moving away.', '太阳光和太阳风把气体和尘埃向外推，所以即使彗星正远离太阳，彗尾仍背向太阳。'] },
      { q: ['Where is the asteroid belt?', '小行星带位于'],
        options: [['Between Mars and Jupiter', '火星和木星轨道之间'], ['Between Earth and Mars', '地球和火星轨道之间'], ['Beyond Neptune', '海王星轨道以外'], ['Between Venus and Earth', '金星和地球轨道之间']], answer: 0,
        why: ['The main belt lies about 2.1–3.3 AU from the Sun, between Mars and Jupiter. Beyond Neptune is the Kuiper belt.', '主小行星带距太阳约 2.1—3.3 天文单位，在火星和木星之间。海王星以外是柯伊伯带。'] },
      { q: ['What is a meteor?', '流星是什么？'],
        options: [['A streak of light from a grain burning up in the air', '微粒在大气中燃烧发出的光迹'], ['A star falling to Earth', '掉向地球的恒星'], ['A comet passing Earth', '经过地球的彗星'], ['A rock lying on the ground', '躺在地面上的石头']], answer: 0,
        why: ['Meteors are tiny grains burning up high in the atmosphere. A rock that reaches the ground is a meteorite.', '流星是在高空大气中燃烧的微粒。落到地面的岩石叫陨石。'] },
      { q: ['Why does the same meteor shower return every year?', '为什么同一个流星雨每年都会出现？'],
        options: [['Earth crosses the same comet dust trail on the same date', '地球每年在同一时间穿过同一条彗星尘埃带'], ['The Moon throws off dust each year', '月球每年抛出尘埃'], ['The Sun ejects meteors every year', '太阳每年喷出流星'], ['A planet passes Earth each year', '每年有行星经过地球']], answer: 0,
        why: ['The dust stays spread along the comet’s orbit, and Earth reaches that crossing point at the same time each year.', '尘埃沿彗星轨道散布，地球每年在同一时间到达那个交叉点。'] },
    ],
  },
  // ------------------------------------------------------------------------------------------------ systems and life
  {
    id: 'a-systems', strand: 'solar', level: 'sr', tracks: ['uk', 'us', 'ib'], unit, icon: 'globe', minutes: 12,
    title: ['Celestial systems and life on Earth', '天体系统和地球上的生命'],
    blurb: ['From the Earth–Moon system to the observable universe, and why Earth is a planet with life.', '从地月系到可观测宇宙，以及地球为什么是一颗有生命的行星。'],
    keys: [
      ['Bodies that attract and orbit each other form celestial systems: Earth–Moon system → Solar System → Milky Way → observable universe.', '相互吸引、相互绕转的天体构成天体系统：地月系→太阳系→银河系→可观测宇宙。'],
      ['The Milky Way is about 100,000 light-years across; galaxies beyond it are other galaxies, such as Andromeda.', '银河系直径约 10 万光年；银河系以外的星系叫河外星系，如仙女星系。'],
      ['Outside conditions for life: a stable Sun and a safe environment, with planets orbiting in the same direction, in nearly the same plane, on nearly circular orbits.', '生命存在的外部条件：稳定的太阳光照和安全的宇宙环境——行星绕日公转具有同向性、共面性和近圆性。'],
      ['Earth’s own conditions: a suitable distance from the Sun (the habitable zone), a mass that holds an atmosphere, and liquid water.', '地球自身条件：日地距离适中（位于宜居带）、质量适中能吸引大气、有液态水。'],
    ],
    steps: [
      {
        title: ['Systems inside systems', '层层嵌套的天体系统'],
        astro: { kit: 'ladder', clock: { from: 0, to: 2, rate: 0.14, unit: 'x', fmt: ['Zooming out', '视野放大'], once: true } },
        fig: { k: 'svg', draw: L => hierarchy(L) },
        body: ['Celestial bodies attract each other and orbit each other, forming celestial systems. The Moon and Earth orbit together as the Earth–Moon system, 384,400 km apart. The Sun’s gravity holds the planets, including the Earth–Moon system, in the Solar System.', '天体之间相互吸引、相互绕转，形成天体系统。月球和地球组成地月系，平均相距 38.44 万千米。太阳的引力把包括地月系在内的行星系统维系在一起，组成太阳系。'],
      },
      {
        title: ['Our galaxy', '我们的银河系'],
        astro: { kit: 'ladder', clock: { from: 2, to: 4, rate: 0.12, unit: 'x', fmt: ['Zooming out', '视野放大'], once: true } },
        body: ['The Sun is one of 100–400 billion stars in the Milky Way, a barred spiral galaxy about 100,000 light-years across. The nearest stars are a few light-years away. The Sun sits about 26,000 light-years from the centre and takes about 230 million years to go round it.', '太阳只是银河系 1000 亿—4000 亿颗恒星中的一颗。银河系是直径约 10 万光年的棒旋星系，离太阳最近的恒星也有几光年远。太阳距银河系中心约 2.6 万光年，绕中心转一圈约需 2.3 亿年。'],
      },
      {
        title: ['Other galaxies and the universe', '河外星系和可观测宇宙'],
        astro: { kit: 'ladder', clock: { from: 4, to: 6, rate: 0.12, unit: 'x', fmt: ['Zooming out', '视野放大'], once: true } },
        body: ['Galaxies outside the Milky Way are other galaxies. The Andromeda Galaxy, 2.5 million light-years away, is the largest member of our Local Group. The part of the universe we can observe holds perhaps 2 trillion galaxies and is about 93 billion light-years across.', '银河系以外的星系叫河外星系。距离 250 万光年的仙女星系是本星系群中最大的成员。人类能观测到的宇宙部分，叫可观测宇宙，可能包含约 2 万亿个星系，直径约 930 亿光年。'],
      },
      {
        title: ['A stable Sun, a safe neighbourhood', '稳定的太阳，安全的环境'],
        astro: { kit: 'orrery', dir: true, labels: false, scale: 'log', clock: { from: 0, to: 30, rate: 0.6, unit: 'year' } },
        body: ['For about 4.6 billion years the Sun has shone steadily, giving Earth stable light and heat. The planets orbit in the same direction, in nearly the same plane and on nearly circular paths, so each keeps to its own lane and they do not collide. This safe environment let life evolve.', '约 46 亿年来，太阳一直比较稳定，为地球提供稳定的光照和热量。各行星绕日公转具有同向性、共面性和近圆性，大小行星各行其道、互不干扰，使地球处于比较安全的宇宙环境中，生命得以演化。'],
      },
      {
        title: ['Just the right distance', '日地距离适中'],
        astro: { kit: 'orrery', planets: ['mercury', 'venus', 'earth', 'mars'], hz: true, clock: { from: 0, to: 4, rate: 0.12, unit: 'year' } },
        body: ['Earth orbits inside the habitable zone, the range of distances where a planet can keep liquid water on its surface. Its average surface temperature is about 15 °C. Venus, closer in, is far too hot; Mars, farther out, is too cold. Earth’s moderate day length also keeps the day–night temperature swing small.', '地球位于宜居带内，即行星表面能保持液态水的距离范围。地球表面平均温度约 15 °C。离太阳更近的金星太热，更远的火星太冷。地球自转周期适中，昼夜温差也不大。'],
      },
      {
        title: ['Just the right size', '体积和质量适中'],
        astro: { kit: 'orrery', mode: 'lineup', planets: ['mercury', 'venus', 'earth', 'mars'] },
        body: ['Earth’s mass gives enough gravity to hold a thick atmosphere, which over billions of years became rich in nitrogen and oxygen and shields us from harmful radiation. Small Mars has lost most of its air, and tiny Mercury has almost none. Water released from inside the young Earth gathered into the oceans.', '地球的体积和质量适中，引力足以吸引住厚厚的大气层，经过漫长演化形成以氮和氧为主、适合生物呼吸的大气，并能阻挡有害辐射。较小的火星失去了大部分大气，更小的水星几乎没有大气。早期地球内部释放出的水汽凝结降落，形成了原始海洋。'],
      },
    ],
    quiz: [
      { q: ['Which list goes from the smallest system to the largest?', '下列天体系统按从小到大排列正确的是'],
        options: [['Earth–Moon system → Solar System → Milky Way → observable universe', '地月系→太阳系→银河系→可观测宇宙'], ['Solar System → Earth–Moon system → Milky Way → observable universe', '太阳系→地月系→银河系→可观测宇宙'], ['Earth–Moon system → Milky Way → Solar System → observable universe', '地月系→银河系→太阳系→可观测宇宙'], ['Milky Way → Solar System → Earth–Moon system → observable universe', '银河系→太阳系→地月系→可观测宇宙']], answer: 0,
        fig: { k: 'svg', draw: L => hierarchy(L) },
        why: ['The Earth–Moon system is part of the Solar System, which is part of the Milky Way, one of countless galaxies in the observable universe.', '地月系属于太阳系，太阳系属于银河系，银河系是可观测宇宙中无数星系之一。'] },
      { q: ['Tap the planet that orbits inside the habitable zone.', '点出位于宜居带内的行星。'], pick: 'earth',
        astro: { kit: 'orrery', planets: ['mercury', 'venus', 'earth', 'mars'], hz: true, labels: false, t0: T25 + 40 * DAY },
        why: ['Earth, at 1 AU, is in the habitable zone where liquid water can last on the surface.', '地球距太阳 1 天文单位，位于表面能保持液态水的宜居带内。'] },
      { q: ['Why can Earth hold a thick atmosphere?', '地球为什么能保持厚厚的大气层？'],
        options: [['Its mass and gravity are large enough', '它的体积和质量适中，引力足够大'], ['It is the closest planet to the Sun', '它离太阳最近'], ['It has a moon', '它有卫星'], ['It spins very fast', '它自转得很快']], answer: 0,
        why: ['Enough mass means enough gravity to stop the gases escaping into space; small Mars lost most of its air.', '质量适中，引力足以让气体不逃逸到太空；较小的火星失去了大部分大气。'] },
      { q: ['Which is NOT one of the reasons Earth has a safe environment in space?', '下列哪一项不是地球处于安全宇宙环境的原因？'],
        options: [['Earth is the largest planet', '地球是最大的行星'], ['The planets orbit in the same direction', '各行星公转方向相同'], ['The orbits lie in nearly the same plane', '各行星轨道几乎在同一平面'], ['The orbits are nearly circular', '各行星轨道接近圆形']], answer: 0,
        why: ['Jupiter is the largest planet. The safe environment comes from orbits that share a direction and plane and are nearly circular.', '最大的行星是木星。安全的宇宙环境来自行星公转的同向性、共面性和近圆性。'] },
    ],
  },
];
