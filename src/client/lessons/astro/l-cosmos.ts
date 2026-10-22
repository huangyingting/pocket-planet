/** Astronomy lessons, senior: black holes and neutron stars, red-shift and the Big Bang, finding exoplanets. */
import { svg, tx, type Lx } from '../figs.ts';
import type { Lesson } from '../kit.ts';

// ------------------------------------------------------------------------------------------------ figures

/** Hubble's law: recession velocity against distance, galaxies scattered about v = H0·d. */
function hubbleFig(L: Lx): string {
  const x0 = 46, x1 = 304, y0 = 34, y1 = 136;
  const X = (d: number) => x0 + (d / 500) * (x1 - x0), Y = (v: number) => y1 - (v / 35000) * (y1 - y0);
  const pts: [number, number][] = [[35, 3300], [70, 4300], [105, 8100], [150, 9600], [185, 14000], [225, 15200], [260, 19100], [300, 20300], [335, 24700], [375, 25600], [420, 30300], [460, 31600]];
  let o = tx(4, 12, L(['Hubble’s law', '哈勃定律']), 'fg-title') + tx(4, 23, L(['speed of recession against distance', '星系的退行速度和距离']), 'fg-sub');
  for (let v = 0; v <= 35000; v += 7000) o += `<line x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" class="fg-grid"/>` + tx(x0 - 3, Y(v) + 3, v.toLocaleString('en-US'), 'fg-tick', 'e');
  for (let d = 0; d <= 500; d += 100) o += tx(X(d), y1 + 10, String(d), 'fg-tick', 'm');
  o += tx((x0 + x1) / 2, y1 + 21, L(['distance (Mpc; 1 Mpc ≈ 3.26 million ly)', '距离（百万秒差距，约 326 万光年）']), 'fg-sub', 'm');
  o += `<text transform="translate(9 ${(y0 + y1) / 2 + 4}) rotate(-90)" class="fg-sub" text-anchor="middle">${L(['km/s', '千米/秒'])}</text>`;
  o += `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(500)}" y2="${Y(35000)}" class="fg-line f-draw" pathLength="1" style="stroke:#ff8787;--d:.6s"/>`;
  pts.forEach(([d, v], i) => { o += `<circle cx="${X(d).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="2.6" fill="#a5d8ff" class="f-fade" style="--d:${(0.05 * i).toFixed(2)}s"/>`; });
  o += tx(X(255), Y(26500), L(['slope = H0 ≈ 70 km/s per Mpc', '斜率 = H0 ≈ 70 千米/秒/百万秒差距']), 'fg-label f-fade', 'e', ' style="--d:1.2s;fill:#ff8787"');
  return svg(320, 162, o, L(['Hubble’s law graph', '哈勃定律图']));
}

/** A transit light curve: two 1 % dips 3.5 days apart; `marks` adds the depth and period. */
function lightCurveFig(marks: boolean) {
  return (L: Lx): string => {
    const x0 = 46, x1 = 306, y0 = 32, y1 = 128, lo = 98.6, hi = 100.3;
    const X = (d: number) => x0 + (d / 7) * (x1 - x0), Y = (f: number) => y1 - ((f - lo) / (hi - lo)) * (y1 - y0);
    const flux = (t: number) => {
      let f = 100;
      for (const c of [1.75, 5.25]) { const u = Math.abs(t - c); if (u < 0.16) f = Math.min(f, u < 0.1 ? 99 : 99 + (u - 0.1) / 0.06); }
      return f;
    };
    let o = tx(4, 12, L(['Light curve of a star', '一颗恒星的光变曲线']), 'fg-title') + tx(4, 23, L(['brightness (%) measured by a space telescope', '空间望远镜测得的亮度（%）']), 'fg-sub');
    for (const f of [99, 99.5, 100]) o += `<line x1="${x0}" x2="${x1}" y1="${Y(f)}" y2="${Y(f)}" class="fg-grid"/>` + tx(x0 - 3, Y(f) + 3, `${f}%`, 'fg-tick', 'e');
    for (let d = 0; d <= 7; d++) o += tx(X(d), y1 + 10, String(d), 'fg-tick', 'm');
    o += tx((x0 + x1) / 2, y1 + 21, L(['time (days)', '时间（天）']), 'fg-sub', 'm');
    // measurements with a little scatter, and the curve through them
    let s = 7;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let t = 0.05; t < 7; t += 0.1) o += `<circle cx="${X(t).toFixed(1)}" cy="${Y(flux(t) + (rnd() - 0.5) * 0.22).toFixed(1)}" r="1.3" fill="#8fa0b2" opacity=".7"/>`;
    const path = Array.from({ length: 281 }, (_, i) => { const t = (i / 280) * 7; return `${X(t).toFixed(1)},${Y(flux(t)).toFixed(1)}`; }).join(' ');
    o += `<polyline points="${path}" class="fg-line f-draw" pathLength="1" style="stroke:#ffd24a"/>`;
    if (marks) {
      o += `<line x1="${X(2.15)}" x2="${X(2.15)}" y1="${Y(100)}" y2="${Y(99)}" stroke="#ff8787" stroke-width="1.4" class="f-fade" style="--d:1s"/>`;
      o += tx(X(2.25), Y(99.5) + 3, L(['dip 1% = (Rp/R*)²', '变暗 1% = (Rp/R*)²']), 'fg-label f-fade', 's', ' style="--d:1s;fill:#ff8787"');
      const yb = Y(98.8);
      o += `<path d="M${X(1.75)} ${yb - 4} V${yb} H${X(5.25)} V${yb - 4}" fill="none" stroke="#74c0fc" stroke-width="1.4" class="f-fade" style="--d:1.4s"/>`;
      o += tx(X(3.5), yb - 3, L(['period 3.5 days', '周期 3.5 天']), 'fg-label f-fade', 'm', ' style="--d:1.4s;fill:#74c0fc"');
    }
    return svg(320, 156, o, L(['Transit light curve', '凌星光变曲线']));
  };
}

// ------------------------------------------------------------------------------------------------ lessons

export const A_COSMOS: Lesson[] = [
  {
    id: 'a-black-holes', strand: 'stars', level: 'sr', tracks: ['uk', 'ib'], icon: 'sparkle', minutes: 10,
    unit: ['The deaths of stars', '恒星的归宿'],
    title: ['Black holes and neutron stars', '黑洞和中子星'],
    blurb: ['What a giant star leaves behind: city-sized neutron stars, pulsars and black holes that even light cannot escape.', '大质量恒星死亡后留下什么：城市大小的中子星、脉冲星，以及连光都逃不出去的黑洞。'],
    keys: [
      ['A supernova leaves a neutron star (about 20 km across) or, if the core is heavier than about 3 Suns, a black hole.', '超新星爆发后留下中子星（直径约 20 千米）；如果残核超过约 3 个太阳质量，就会形成黑洞。'],
      ['Pulsars are spinning neutron stars whose beams sweep past us; Jocelyn Bell found the first in 1967.', '脉冲星是快速自转的中子星，它的辐射束扫过地球形成脉冲；1967 年乔斯林·贝尔发现了第一颗。'],
      ['Inside the event horizon the escape speed is greater than the speed of light: Rs = 2GM/c² ≈ 2.95 km × (M / M☉).', '在事件视界以内，逃逸速度超过光速：史瓦西半径 Rs = 2GM/c² ≈ 2.95 千米 ×（M / 太阳质量）。'],
      ['Mass bends light (gravitational lensing); the EHT photographed black-hole shadows and LIGO heard black holes merge.', '质量会使光线弯曲（引力透镜）；事件视界望远镜拍到了黑洞的“阴影”，LIGO 探测到了黑洞并合产生的引力波。'],
    ],
    steps: [
      {
        title: ['Neutron stars and pulsars', '中子星和脉冲星'],
        body: ['When a star of more than about 8 Suns runs out of fuel, its core collapses and the rest is blasted away in a supernova. A core of about 1.4–3 Suns is crushed into a neutron star only about 20 km across: a teaspoonful would weigh around a billion tonnes. It spins fast, and beams of radio waves from its magnetic poles sweep round like a lighthouse.', '质量超过约 8 个太阳的恒星耗尽燃料后，核心坍缩，外层在超新星爆发中被抛散。质量约为 1.4～3 个太阳的残核被压成中子星，直径只有约 20 千米，一茶匙的物质就重约 10 亿吨。它自转极快，从磁极射出的射电波束像灯塔一样扫过太空。'],
        astro: { kit: 'compact', mode: 'pulsar' },
      },
      {
        title: ['Lighthouses in space', '太空中的灯塔'],
        body: ['In 1967 the student Jocelyn Bell noticed radio pulses arriving every 1.34 seconds, as regular as a clock: the first pulsar. Each time a beam points at the Earth we get a pulse. China’s FAST telescope, the world’s largest single dish, has found more than 1,000 new pulsars.', '1967 年，研究生乔斯林·贝尔发现了每隔 1.34 秒到来一次、像钟表一样精确的射电脉冲，这就是第一颗脉冲星。每当辐射束扫过地球，我们就收到一个脉冲。世界最大的单口径射电望远镜——中国天眼 FAST 已经发现了 1000 多颗新的脉冲星。'],
        astro: { kit: 'compact', mode: 'pulsar', cam: { from: [0.55, -1, 0.5], dist: 13, target: [1, 0, -0.3] } },
      },
      {
        title: ['A black hole', '黑洞'],
        body: ['If the collapsing core is heavier than about 3 Suns, nothing can stop it: it becomes a black hole. The escape speed from a mass M at distance r is v = √(2GM/r); at the event horizon it reaches the speed of light, so nothing from inside, not even light, can get out. Gas swirling in is heated to millions of degrees and glows in an accretion disc; the side moving towards us looks brighter.', '如果坍缩的核心超过约 3 个太阳质量，就没有什么能阻止它，它会变成黑洞。从质量为 M 的天体、距离 r 处逃离的速度是 v = √(2GM/r)；在事件视界上，逃逸速度达到光速，所以视界以内的任何东西，连光都出不来。旋入的气体被加热到上百万度，在吸积盘中发光；朝我们运动的一侧看起来更亮。'],
        astro: { kit: 'compact', mode: 'hole' },
      },
      {
        title: ['How big is the event horizon?', '事件视界有多大'],
        body: ['Setting the escape speed equal to c gives the Schwarzschild radius Rs = 2GM/c², about 2.95 km for every solar mass. Squeeze the Sun into a ball of radius 3 km, or the Earth to 9 mm, and it would become a black hole. Drag the slider to change the mass.', '令逃逸速度等于光速 c，得到史瓦西半径 Rs = 2GM/c²：每 1 个太阳质量约 2.95 千米。如果把太阳压缩到半径 3 千米，或把地球压缩到半径 9 毫米，它们就会变成黑洞。拖动滑块改变黑洞的质量。'],
        astro: { kit: 'compact', mode: 'hole', clock: { from: 1, to: 100, rate: 8, unit: 'x', fmt: ['M = {v} Suns', 'M = {v} 个太阳质量'] }, cam: { from: [0, -1, 0.42], dist: 14, target: [0, 0, 0] } },
      },
      {
        title: ['Bending light', '弯曲的光线'],
        body: ['Einstein’s general relativity says mass curves space, so light passing a galaxy or black hole is bent: gravitational lensing. A distant galaxy behind a massive one appears as bright arcs, and when the two line up exactly, as a complete Einstein ring.', '爱因斯坦的广义相对论认为，质量使时空弯曲，所以从星系或黑洞旁经过的光会偏折，这叫引力透镜。一个大质量星系后面的遥远星系会被“放大”成明亮的弧；当两者恰好排成一条直线时，就形成一个完整的爱因斯坦环。'],
        astro: { kit: 'compact', mode: 'lens', clock: { from: 0, to: 100, rate: 12, unit: 'x', fmt: ['lined up {v}%', '对准程度 {v}%'], once: true } },
      },
      {
        title: ['Seeing and hearing black holes', '“看见”和“听见”黑洞'],
        body: ['In 2019 the Event Horizon Telescope, radio dishes across the Earth working as one, showed the shadow of M87*, a black hole of 6.5 billion Suns. In 2022 it imaged Sgr A* at the centre of our galaxy: 4 million Suns, weighed from stars such as S2 racing round it every 16 years (Nobel Prize 2020). Since 2015 LIGO has also detected gravitational waves, ripples in space from pairs of black holes merging.', '2019 年，由遍布全球的射电望远镜组成的事件视界望远镜（EHT）发布了 M87 星系中心黑洞的“阴影”照片，它的质量是 65 亿个太阳。2022 年又拍到了银河系中心的人马座 A*：约 400 万个太阳质量，这是通过 S2 等恒星绕它 16 年一圈的高速运动“称”出来的（2020 年诺贝尔物理学奖）。2015 年起，LIGO 还多次探测到两个黑洞并合时发出的引力波——时空的涟漪。'],
        astro: { kit: 'compact', mode: 'eht' },
      },
    ],
    quiz: [
      { q: ['What is the event horizon of a black hole?', '黑洞的事件视界是指'],
        options: [['The boundary inside which the escape speed is greater than the speed of light', '逃逸速度超过光速的区域的边界'], ['The solid surface of the black hole', '黑洞坚硬的表面'], ['The outer edge of the accretion disc', '吸积盘的外边缘'], ['The shell of gas thrown off by the supernova', '超新星抛出的气体壳']], answer: 0,
        why: ['At the event horizon the escape speed equals c, so nothing from inside can get out. It is a boundary, not a surface.', '在事件视界上逃逸速度等于光速，视界内的任何东西都出不来。它是一个边界，不是实体表面。'] },
      { q: ['Rs ≈ 2.95 km × (M / M☉). About how big is the Schwarzschild radius of a 10-solar-mass black hole?', 'Rs ≈ 2.95 千米 ×（M / 太阳质量）。10 个太阳质量的黑洞，史瓦西半径约为'],
        options: [['3 km', '3 千米'], ['30 km', '30 千米'], ['300 km', '300 千米'], ['3,000 km', '3000 千米']], answer: 1,
        why: ['2.95 km × 10 ≈ 30 km: a black hole ten times the Sun’s mass would fit inside a large city.', '2.95 千米 × 10 ≈ 30 千米：10 倍太阳质量的黑洞，大小还不如一座大城市。'] },
      { q: ['Tap the event horizon (the black hole’s dark shadow).', '在图中点出事件视界（黑洞的黑色“阴影”）。'], astro: { kit: 'compact', mode: 'hole' }, pick: 'horizon',
        why: ['The dark centre is the black hole’s shadow; the glowing ring around it is gas in the accretion disc and bent light.', '中间的黑色区域是黑洞的“阴影”；周围的亮环是吸积盘中的气体和被弯折的光。'] },
      { q: ['Who discovered the first pulsar, and when?', '第一颗脉冲星是谁、在哪一年发现的？'],
        options: [['Jocelyn Bell, 1967', '乔斯林·贝尔，1967 年'], ['Albert Einstein, 1915', '爱因斯坦，1915 年'], ['Edwin Hubble, 1929', '哈勃，1929 年'], ['Penzias and Wilson, 1965', '彭齐亚斯和威尔逊，1965 年']], answer: 0,
        why: ['Jocelyn Bell spotted the regular pulses in 1967 while a research student in Cambridge.', '1967 年，还是剑桥大学研究生的乔斯林·贝尔发现了这些规律的脉冲。'] },
      { q: ['Sgr A* has a mass of about 4 million Suns. With Rs ≈ 2.95 km × (M / M☉), what is its Schwarzschild radius in millions of km?', '人马座 A* 的质量约为 400 万个太阳。用 Rs ≈ 2.95 千米 ×（M / 太阳质量）计算，它的史瓦西半径是多少百万千米？'],
        num: { answer: 11.8, tol: 0.6, unit: ['million km', '百万千米'] },
        why: ['2.95 km × 4 × 10⁶ ≈ 1.18 × 10⁷ km: about 17 times the Sun’s radius, yet small enough to fit inside Mercury’s orbit (58 million km).', '2.95 千米 × 4 × 10⁶ ≈ 1.18 × 10⁷ 千米，约为太阳半径的 17 倍，但仍能放进水星轨道（5800 万千米）以内。'] },
      { q: ['Match each object with its size.', '把天体和它的大小配对。'],
        match: [[['White dwarf', '白矮星'], ['about the size of Earth (~12 000 km)', '与地球差不多大（约 12000 千米）']], [['Neutron star', '中子星'], ['about 20 km across', '直径约 20 千米']], [['10 M☉ black hole', '10 倍太阳质量的黑洞'], ['horizon radius about 30 km', '视界半径约 30 千米']], [['Sgr A*', '人马座 A*'], ['horizon radius about 12 million km', '视界半径约 1200 万千米']]],
        why: ['Dead stars get smaller as they get denser: a white dwarf is Earth-sized, a neutron star city-sized, and a black hole’s horizon grows in proportion to its mass.', '恒星残骸越致密就越小：白矮星和地球差不多大，中子星只有一座城市大；黑洞视界的大小与质量成正比。'] },
      { q: ['Which of these are real evidence that black holes exist? Choose all.', '下面哪些是黑洞存在的真实证据？选出所有正确答案。'],
        multi: [0, 1, 2], options: [['Stars orbiting an invisible 4-million-Sun mass at the galaxy’s centre', '恒星绕银河系中心一个看不见的、400 万倍太阳质量的天体运动'], ['Gravitational waves from merging black holes (LIGO, 2015)', '黑洞并合产生的引力波（LIGO，2015 年）'], ['The EHT images of the shadows of M87* and Sgr A*', 'EHT 拍到的 M87* 和人马座 A* 的“阴影”'], ['Regular radio pulses every 1.34 seconds', '每 1.34 秒一次的规律射电脉冲'], ['Light coming out from inside the event horizon', '从事件视界内部射出的光']],
        why: ['Orbiting stars, gravitational waves and the shadow images all point to black holes. Regular pulses come from pulsars (neutron stars), and no light escapes from inside the horizon.', '恒星的轨道运动、引力波和黑洞阴影照片都证明了黑洞存在。规律的脉冲来自脉冲星（中子星）；而视界内部的光根本出不来。'] },
    ],
  },
  {
    id: 'a-big-bang', strand: 'cosmos', level: 'sr', tracks: ['uk', 'ib', 'us', 'au'], icon: 'sparkle', minutes: 16,
    unit: ['The universe', '宇宙'],
    title: ['Red-shift and the Big Bang', '红移和大爆炸'],
    blurb: ['Galaxies are rushing apart, the farther the faster: run the film backwards and everything began 13.8 billion years ago.', '星系彼此远离，越远退行越快：把“电影”倒放，宇宙起源于 138 亿年前。'],
    keys: [
      ['Light from distant galaxies is red-shifted: z = Δλ/λ ≈ v/c, so they are moving away from us.', '遥远星系的光发生红移：z = Δλ/λ ≈ v/c，说明它们在远离我们。'],
      ['Hubble’s law: v = H0·d, with H0 ≈ 70 km/s per Mpc: the farther a galaxy, the faster it recedes.', '哈勃定律：v = H0·d，H0 ≈ 70 千米/秒/百万秒差距：星系越远，退行越快。'],
      ['Distances come from a ladder of methods, each calibrating the next: radar, parallax, Cepheid variables (period → luminosity), Type Ia supernovae (peak M ≈ −19.3), then Hubble’s law.', '距离靠一级级“阶梯”测量，每一级校准下一级：雷达、三角视差、造父变星（周期 → 光度）、Ia 型超新星（峰值绝对星等约 −19.3），最后是哈勃定律。'],
      ['Space itself is expanding everywhere; there is no centre and no edge the galaxies fly into.', '是空间本身在各处膨胀，没有中心，星系也不是飞向某个边缘。'],
      ['The universe began in a hot, dense Big Bang 13.8 billion years ago; the 2.7 K cosmic microwave background (found 1965) is its afterglow.', '宇宙起源于 138 亿年前一次炽热、致密的大爆炸；1965 年发现的 2.7 K 宇宙微波背景辐射是它的余晖。'],
    ],
    steps: [
      {
        title: ['Red-shift', '红移'],
        body: ['A galaxy’s spectrum has dark absorption lines at wavelengths fixed by its atoms. If the galaxy moves away, every line is shifted toward the red end: red-shift. The shift z = Δλ/λ ≈ v/c tells us its speed (for speeds well below light).', '星系的光谱中有暗的吸收线，它们的波长由原子决定。星系远离我们时，所有谱线都向红端（长波方向）移动，这就是红移。红移量 z = Δλ/λ ≈ v/c，由此可以算出它远离的速度（适用于远小于光速时）。'],
        astro: { kit: 'expand', mode: 'redshift', clock: { from: 0, to: 0.2, rate: 0.025, unit: 'x', fmt: ['z = {v}', '红移 z = {v}'], dp: 3 } },
      },
      {
        title: ['Cepheids: stars with a built-in brightness', '造父变星：自带“亮度标签”的星'],
        body: ['Cepheid variables are yellow supergiants that swell and shrink, brightening and fading with a steady period. In 1912 Henrietta Leavitt found that in the Small Magellanic Cloud the longer the period, the more luminous the star: δ Cephei pulses every 5.37 days at about 2 000 Suns, ℓ Carinae every 35.6 days at about 12 000. So measure the period, read off the luminosity, compare it with how bright the star looks, and the inverse-square law gives the distance. In 1923–24 Hubble found Cepheids in Andromeda and showed it lies far outside the Milky Way.', '造父变星是会周期性膨胀和收缩的黄色超巨星，亮度以稳定的周期变化。1912 年，勒维特研究小麦哲伦云时发现：周期越长，光度越大。造父一（仙王座 δ）每 5.37 天变化一次，光度约 2000 个太阳；船底座 ℓ 每 35.6 天变化一次，光度约 12000 个太阳。所以只要测出周期，就知道它的光度，再和看到的亮度比较，用平方反比定律就能算出距离。1923～1924 年，哈勃在仙女星系中找到了造父变星，证明它远在银河系之外。'],
        astro: { kit: 'stars', mode: 'cepheid', clock: { from: 0, to: 36, rate: 3, unit: 'day' } },
      },
      {
        title: ['Hubble’s law', '哈勃定律'],
        body: ['In 1929 Edwin Hubble (building on work by Lemaître) put Cepheid distances together with red-shifts and found that the farther a galaxy is, the faster it is moving away: v = H0·d. Today H0 ≈ 70 km/s per megaparsec, so a galaxy 100 Mpc away recedes at about 7,000 km/s. Turned around, d = v / H0: measure a red-shift and you know the distance.', '1929 年，哈勃（在勒梅特等人工作的基础上）把造父变星测出的距离和红移放在一起，发现星系离我们越远，远离的速度越快，即 v = H0·d。今天测得 H0 ≈ 70 千米/秒/百万秒差距，所以距离 100 百万秒差距的星系以约 7000 千米/秒的速度远离。反过来，d = v / H0：测出红移，就知道距离。'],
        fig: { k: 'svg', draw: L => hubbleFig(L) },
        astro: { kit: 'expand', mode: 'grid', center: 17, clock: { from: 0, to: 5, rate: 0.5, unit: 'gyr' } },
      },
      {
        title: ['The cosmic distance ladder', '宇宙距离阶梯'],
        body: ['No single method reaches every distance, so astronomers climb a ladder. Radar echoes fix the astronomical unit (149.6 million km). With that baseline, parallax measures nearby stars; the Gaia satellite has measured about 1.5 billion. Parallax calibrates Cepheids, which reach about 40 Mpc; Cepheids calibrate Type Ia supernovae, which reach billions of light-years; and the supernovae calibrate Hubble’s law. Each rung is checked where it overlaps the one below (dashed lines), so an error low down spreads all the way up.', '没有一种方法能测量所有距离，所以天文学家要一级一级“爬梯子”。雷达回波确定了天文单位（1.496 亿千米）；以它为基线，用三角视差测量近处的恒星，盖亚卫星已经测了约 15 亿颗。视差校准造父变星，造父变星可测到约 4000 万秒差距；造父变星校准 Ia 型超新星，它可测到几十亿光年以外；超新星再校准哈勃定律。每一级都在与下一级重叠的地方（虚线）互相核对，所以底层的误差会一路传上去。'],
        astro: { kit: 'expand', mode: 'ladder', clock: { from: 0, to: 5, rate: 0.45, unit: 'x', fmt: ['rung {v}', '第 {v} 级'], dp: 0 } },
      },
      {
        title: ['Type Ia supernovae', 'Ia 型超新星'],
        body: ['A white dwarf in a close binary pulls gas from its companion. As it nears 1.4 solar masses, the Chandrasekhar limit, it detonates completely: a Type Ia supernova. Because they all blow up at about the same mass, they all peak near absolute magnitude −19.3, billions of times the Sun, bright enough to be seen across billions of light-years. In 1998 two teams found distant ones fainter than expected: the expansion is speeding up, driven by “dark energy” (Nobel Prize 2011).', '密近双星中的白矮星不断从伴星吸积气体，当质量接近 1.4 个太阳质量（钱德拉塞卡极限）时，会被彻底炸毁，这就是 Ia 型超新星。由于它们都在差不多相同的质量下爆炸，峰值绝对星等都约为 −19.3，相当于几十亿个太阳，几十亿光年外都能看到。1998 年，两个研究团队发现遥远的 Ia 型超新星比预期的暗：宇宙在加速膨胀，推动它的是“暗能量”（2011 年诺贝尔物理学奖）。'],
        astro: { kit: 'expand', mode: 'ladder', clock: { from: 3, to: 4.6, rate: 0.3, unit: 'x', fmt: ['rung {v}', '第 {v} 级'], dp: 0, once: true } },
      },
      {
        title: ['Expansion, not an explosion', '是膨胀，不是爆炸'],
        body: ['The galaxies are not flying out from one spot. Space itself stretches, like raisins in rising bread: from any galaxy, all the others recede, and the farther ones faster. So there is no centre. The stretching also stretches light on its way to us, which is the cosmological red-shift.', '星系并不是从某一点向外飞散，而是空间本身在膨胀，就像发酵面包里的葡萄干：从任何一个星系看，其他星系都在远离，越远的退行越快。所以宇宙没有中心。光在途中也被空间拉长，这就是宇宙学红移。'],
        astro: { kit: 'expand', mode: 'grid', center: 'cycle', clock: { from: 0, to: 5, rate: 0.35, unit: 'gyr' } },
      },
      {
        title: ['Running the film backwards', '把时间倒回去'],
        body: ['If everything is moving apart, it was once all together. A galaxy at distance d moving at v = H0·d took d / v = 1/H0 to get there. With 1 Mpc = 3.086 × 10¹⁹ km, 1/H0 = 3.086 × 10¹⁹ / 70 s ≈ 4.4 × 10¹⁷ s ≈ 14 billion years. Careful fits to the CMB give 13.8 billion years. The universe began hot and dense in the Big Bang, cooled, made the first stars after a few hundred million years, and then galaxies.', '既然一切都在彼此远离，过去它们一定靠得很近。距离为 d、速度为 v = H0·d 的星系，走到今天的位置用了 d / v = 1/H0 的时间。1 百万秒差距 = 3.086 × 10¹⁹ 千米，所以 1/H0 = 3.086 × 10¹⁹ / 70 秒 ≈ 4.4 × 10¹⁷ 秒 ≈ 140 亿年。根据宇宙微波背景的精确测量，宇宙年龄为 138 亿年。宇宙在大爆炸中从炽热、致密的状态开始，逐渐冷却，几亿年后诞生了第一代恒星，然后形成了星系。'],
        astro: { kit: 'expand', mode: 'timeline', clock: { from: 0, to: 13.8, rate: 0.9, unit: 'gyr', once: true } },
      },
      {
        title: ['The afterglow of the Big Bang', '大爆炸的余晖'],
        body: ['About 380,000 years after the Big Bang, the universe cooled enough for atoms to form and light to travel freely. That light still fills space, stretched by expansion into microwaves at just 2.7 K: the cosmic microwave background, found by Penzias and Wilson in 1965. It is strong evidence for the Big Bang; its tiny ripples were the seeds of galaxies.', '大爆炸后约 38 万年，宇宙冷却到原子可以形成，光才能自由传播。这些光至今仍充满整个空间，被宇宙膨胀拉长成温度只有 2.7 K 的微波，这就是 1965 年彭齐亚斯和威尔逊发现的宇宙微波背景辐射。它是大爆炸的有力证据，其中微小的起伏是后来星系形成的“种子”。'],
        astro: { kit: 'expand', mode: 'cmb' },
      },
    ],
    quiz: [
      { q: ['Use the graph. About how fast is a galaxy 400 Mpc away moving away from us?', '读图：距离我们 400 百万秒差距的星系，退行速度约为'], fig: { k: 'svg', draw: L => hubbleFig(L) },
        options: [['2,800 km/s', '2800 千米/秒'], ['28,000 km/s', '28000 千米/秒'], ['280,000 km/s', '280000 千米/秒'], ['4,000 km/s', '4000 千米/秒']], answer: 1,
        why: ['v = H0·d ≈ 70 × 400 = 28,000 km/s, as the line on the graph shows.', 'v = H0·d ≈ 70 × 400 = 28000 千米/秒，和图中直线一致。'] },
      { q: ['The dark lines in this galaxy’s spectrum are shifted toward the red. What does that tell us?', '这个星系光谱中的暗线向红端移动了，这说明'], astro: { kit: 'expand', mode: 'redshift', clock: { from: 0, to: 0.2, rate: 0, unit: 'x', fmt: ['z = {v}', '红移 z = {v}'], dp: 3, at: 0.75 } },
        options: [['It is moving away from us', '它正在远离我们'], ['It is moving toward us', '它正在靠近我们'], ['It is very hot', '它的温度很高'], ['It is made of iron', '它由铁组成']], answer: 0,
        why: ['A shift to longer wavelengths (red-shift) means the source is receding; a blue-shift would mean it is approaching.', '谱线向长波方向移动（红移）说明光源在远离；向蓝端移动（蓝移）则说明在靠近。'] },
      { q: ['Which statement about the expanding universe is correct?', '关于宇宙膨胀，下列说法正确的是'],
        options: [['Space itself is stretching, so every galaxy sees the others moving away', '空间本身在膨胀，从任何一个星系看，其他星系都在远离'], ['The Milky Way is at the centre of the explosion', '银河系位于爆炸的中心'], ['Galaxies are flying into empty space beyond the edge of the universe', '星系正飞向宇宙边缘以外的空旷空间'], ['Nearer galaxies recede faster than farther ones', '近的星系比远的星系退行更快']], answer: 0,
        why: ['There is no centre: expansion happens everywhere, and farther galaxies recede faster (v = H0·d).', '宇宙膨胀没有中心，处处都在膨胀，而且越远的星系退行越快（v = H0·d）。'] },
      { q: ['A galaxy’s lines are red-shifted by z = 0.02. Using v = cz (c = 300 000 km/s) and d = v / H0 with H0 = 70 km/s/Mpc, how many Mpc away is it?', '一个星系的谱线红移 z = 0.02。用 v = cz（c = 300000 千米/秒）和 d = v / H0（H0 = 70 千米/秒/百万秒差距）计算，它距我们多少百万秒差距？'],
        num: { answer: 86, tol: 3, unit: ['Mpc', '百万秒差距'] },
        why: ['v = 0.02 × 300 000 = 6 000 km/s; d = 6 000 / 70 ≈ 86 Mpc, about 280 million light-years.', 'v = 0.02 × 300000 = 6000 千米/秒；d = 6000 / 70 ≈ 86 百万秒差距，约 2.8 亿光年。'] },
      { q: ['Two Cepheids have the same period, so the same luminosity. One looks 100 times fainter than the other. How many times farther away is it?', '两颗造父变星周期相同，所以光度相同。其中一颗看起来暗 100 倍。它远多少倍？'],
        num: { answer: 10, tol: 0.5, unit: ['times', '倍'] },
        why: ['Brightness ∝ 1/d², so 100 times fainter means √100 = 10 times farther. This is how a standard candle gives distance.', '亮度 ∝ 1/d²，暗 100 倍就是远 √100 = 10 倍。“标准烛光”就是这样测距离的。'] },
      { q: ['Tap the Cepheid that is more luminous.', '点出光度更大的那颗造父变星。'], astro: { kit: 'stars', mode: 'cepheid', clock: { from: 0, to: 36, rate: 0, unit: 'day', at: 1, hold: true } }, pick: 'long',
        why: ['Leavitt’s law: the longer the period, the more luminous. ℓ Carinae (35.6 days) is about 6 times as luminous as δ Cephei (5.37 days).', '勒维特定律：周期越长，光度越大。船底座 ℓ（35.6 天）的光度约为造父一（5.37 天）的 6 倍。'] },
      { q: ['Put the rungs of the distance ladder in order, from the nearest reach to the farthest.', '把距离阶梯的各级按能测量的距离从近到远排序。'],
        order: [['Radar (the astronomical unit)', '雷达（天文单位）'], ['Parallax of nearby stars', '近处恒星的三角视差'], ['Cepheid variables', '造父变星'], ['Type Ia supernovae', 'Ia 型超新星'], ['Hubble’s law from red-shift', '由红移用哈勃定律']],
        why: ['Each rung is calibrated by the one below it where their ranges overlap: AU → parallax → Cepheids → supernovae → Hubble’s law.', '每一级都在测量范围重叠处由下一级校准：天文单位 → 视差 → 造父变星 → 超新星 → 哈勃定律。'] },
      { q: ['Match each discovery with who made it.', '把发现和发现者配对。'],
        match: [[['Cepheid period–luminosity law (1912)', '造父变星的周期–光度关系（1912 年）'], ['Henrietta Leavitt', '勒维特']], [['Galaxies recede faster the farther they are (1929)', '星系越远退行越快（1929 年）'], ['Edwin Hubble', '哈勃']], [['The 2.7 K cosmic microwave background (1965)', '2.7 K 宇宙微波背景辐射（1965 年）'], ['Penzias and Wilson', '彭齐亚斯和威尔逊']], [['The expansion is accelerating (1998)', '宇宙加速膨胀（1998 年）'], ['Perlmutter, Schmidt and Riess', '珀尔马特、施密特和里斯']]],
        why: ['Leavitt gave astronomers a yardstick, Hubble used it to find the expansion, the CMB is the Big Bang’s afterglow from 380 000 years after it, and Type Ia supernovae revealed dark energy.', '勒维特给了天文学家一把“尺子”，哈勃用它发现了宇宙膨胀；宇宙微波背景是大爆炸后 38 万年的余晖；Ia 型超新星揭示了暗能量。'] },
    ],
  },
  {
    id: 'a-exoplanets', strand: 'stars', level: 'sr', tracks: [], icon: 'telescope', minutes: 10,
    unit: ['Other worlds', '其他世界'],
    title: ['Finding exoplanets', '寻找系外行星'],
    blurb: ['Planets of other stars are too faint to see: we find them by the wobble and the shadow they give their stars.', '其他恒星的行星太暗，几乎看不见：我们通过恒星的“晃动”和行星挡住的星光找到它们。'],
    keys: [
      ['More than 5,000 exoplanets are confirmed; most were found indirectly, by their effect on their star.', '目前已确认 5000 多颗系外行星，大多数是通过它们对恒星的影响间接发现的。'],
      ['Radial velocity: star and planet orbit their centre of mass, so the star’s spectral lines shift blue and red in turn.', '视向速度法：恒星和行星绕共同质心运动，恒星的谱线交替发生蓝移和红移。'],
      ['Transit method: the dip in brightness gives the size, (Rp/R*)² = depth; the time between dips gives the period.', '凌星法：亮度下降的幅度给出行星大小，(Rp/R*)² = 变暗幅度；两次变暗的时间间隔就是公转周期。'],
      ['51 Pegasi b (1995, Mayor and Queloz) was the first planet found around a Sun-like star.', '飞马座 51b（1995 年，马约尔和奎洛兹发现）是第一颗在类太阳恒星周围发现的行星。'],
      ['In the habitable zone a planet could have liquid water on its surface, as TRAPPIST-1 e, f and g might.', '在宜居带中，行星表面可能存在液态水，比如 TRAPPIST-1 e、f、g。'],
    ],
    steps: [
      {
        title: ['The wobbling star', '会晃动的恒星'],
        body: ['A planet does not simply orbit its star: both orbit their common centre of mass. The star is far heavier, so it only makes a small wobble, but that wobble can be measured. More than 5,000 planets around other stars have now been confirmed, nearly all found by such indirect clues.', '行星并不是简单地绕恒星转，而是两者一起绕共同的质心转。恒星质量大得多，所以只做小小的“晃动”，但这种晃动可以被测出来。目前已确认的系外行星超过 5000 颗，几乎都是靠这类间接线索发现的。'],
        astro: { kit: 'transit', mode: 'rv', clock: { from: 0, to: 8.46, rate: 0.6, unit: 'day' } },
      },
      {
        title: ['Radial velocity: lines that shift', '视向速度法：移动的谱线'],
        body: ['When the star moves towards us its spectral lines shift to the blue; when it moves away, to the red. Plotting its speed against time gives a wave: the period is the planet’s year and the size of the wave tells us the planet’s mass. In 1995 Mayor and Queloz found 51 Pegasi b this way, a giant planet circling a Sun-like star every 4.2 days (Nobel Prize 2019).', '恒星朝我们运动时，谱线向蓝端移动；远离时向红端移动。把它的视向速度随时间画出来是一条波形曲线：周期就是行星公转一圈的时间，波的幅度反映行星的质量。1995 年，马约尔和奎洛兹用这种方法发现了飞马座 51b，一颗每 4.2 天绕类太阳恒星一圈的巨行星（2019 年获诺贝尔物理学奖）。'],
        astro: { kit: 'transit', mode: 'rv', clock: { from: 0, to: 8.46, rate: 0.6, unit: 'day' }, cam: { from: [0, -1, 0.2], dist: 15, target: [0, -0.4, -1.4] } },
      },
      {
        title: ['The transit method', '凌星法'],
        body: ['If we see a planet’s orbit edge-on, the planet passes in front of its star once every orbit and blocks a little of its light. A telescope measuring the star’s brightness sees a small, regular dip: a transit. NASA’s Kepler and TESS telescopes found thousands of planets this way.', '如果行星的轨道恰好侧对着我们，行星每公转一圈就会从恒星前方经过一次，挡住一小部分星光。测量恒星亮度的望远镜会看到一次小而有规律的变暗，这就是凌星。美国的开普勒和 TESS 空间望远镜用这种方法发现了数千颗行星。'],
        astro: { kit: 'transit', mode: 'transit', period: 3.5, clock: { from: 0, to: 7, rate: 0.5, unit: 'day' } },
      },
      {
        title: ['Reading a light curve', '读懂光变曲线'],
        body: ['The depth of the dip is the fraction of the star’s disc that is covered: depth = (Rp/R*)². A 1% dip means Rp = 0.1 R*, about Jupiter’s size if the star is like the Sun; an Earth would dim it by under 0.01%. The time between dips is the orbital period.', '变暗的幅度等于行星挡住的恒星圆面的比例：变暗幅度 = (Rp/R*)²。变暗 1% 说明 Rp = 0.1 R*，如果恒星和太阳差不多，行星就和木星差不多大；而地球大小的行星只能让星光变暗不到 0.01%。两次变暗之间的时间就是行星的公转周期。'],
        fig: { k: 'svg', draw: lightCurveFig(true) },
        astro: { kit: 'transit', mode: 'transit', period: 3.5, clock: { from: 0, to: 7, rate: 0.5, unit: 'day', at: 0.15 }, cam: { from: [0.3, -1, 0.2], dist: 14, target: [0, 0, -1.1] } },
      },
      {
        title: ['Rock or gas? Using both methods', '岩石还是气体？两种方法合用'],
        body: ['The transit gives a planet’s radius; the wobble gives its mass. Together they give its density, which tells us what it is made of. HD 209458 b, the first planet seen to transit (1999), orbits every 3.52 days with 0.69 Jupiter masses but 1.38 Jupiter radii: a density of only about 0.35 g/cm³, a puffed-up hot gas giant. Earth, at 5.5 g/cm³, is rock and iron; Saturn, at 0.69 g/cm³, would float on water.', '凌星给出行星的半径，恒星的晃动给出行星的质量，合在一起就能算出密度，从而知道它由什么组成。HD 209458 b 是第一颗被观测到凌星的行星（1999 年），每 3.52 天公转一圈，质量是木星的 0.69 倍，半径却是木星的 1.38 倍，密度只有约 0.35 克/厘米³，是一颗被烤得膨胀的热气态巨行星。地球的密度是 5.5 克/厘米³，由岩石和铁组成；土星只有 0.69 克/厘米³，放进水里都能浮起来。'],
        astro: { kit: 'transit', mode: 'transit', period: 3.5, clock: { from: 0, to: 7, rate: 0.5, unit: 'day' } },
      },
      {
        title: ['The habitable zone', '宜居带'],
        body: ['Around every star there is a habitable zone where a planet could be warm enough, but not too hot, for liquid water on its surface. TRAPPIST-1, a cool red dwarf 40 light years away, has seven Earth-sized planets, all closer to it than Mercury is to the Sun; e, f and g lie in its habitable zone.', '每颗恒星周围都有一个宜居带：行星在这里的温度不太冷也不太热，表面可能存在液态水。距离我们 40 光年的红矮星 TRAPPIST-1 有 7 颗和地球差不多大的行星，它们离恒星都比水星离太阳还近，其中 e、f、g 三颗位于宜居带内。'],
        astro: { kit: 'transit', mode: 'hz', clock: { from: 0, to: 40, rate: 2, unit: 'day' } },
      },
    ],
    quiz: [
      { q: ['The planet makes the star 1% dimmer. Its radius is about what fraction of the star’s?', '行星使恒星变暗 1%，行星半径约为恒星半径的'], fig: { k: 'svg', draw: lightCurveFig(false) },
        options: [['1/100', '1/100'], ['1/10', '1/10'], ['1/2', '1/2'], ['1/1000', '1/1000']], answer: 1,
        why: ['Depth = (Rp/R*)² = 0.01, so Rp/R* = √0.01 = 0.1.', '变暗幅度 = (Rp/R*)² = 0.01，所以 Rp/R* = √0.01 = 0.1。'] },
      { q: ['From the same light curve, what is the planet’s orbital period?', '根据同一条光变曲线，这颗行星的公转周期是'], fig: { k: 'svg', draw: lightCurveFig(false) },
        options: [['1.75 days', '1.75 天'], ['3.5 days', '3.5 天'], ['5.25 days', '5.25 天'], ['7 days', '7 天']], answer: 1,
        why: ['The dips come at day 1.75 and day 5.25: one orbit takes 5.25 − 1.75 = 3.5 days.', '两次变暗分别在第 1.75 天和第 5.25 天，公转一圈需要 5.25 − 1.75 = 3.5 天。'] },
      { q: ['Tap a planet in TRAPPIST-1’s habitable zone.', '点出 TRAPPIST-1 宜居带中的一颗行星。'], astro: { kit: 'transit', mode: 'hz', clock: { from: 0, to: 40, rate: 0, unit: 'day', at: 0.1 } }, pick: 'hz',
        why: ['Planets e, f and g orbit inside the green habitable zone, where liquid water might exist.', 'e、f、g 三颗行星在绿色的宜居带内运行，那里可能存在液态水。'] },
      { q: ['How was 51 Pegasi b, the first planet found around a Sun-like star (1995), discovered?', '1995 年发现的第一颗类太阳恒星的行星——飞马座 51b 是用什么方法发现的？'],
        options: [['From the star’s spectral lines shifting back and forth (radial velocity)', '恒星谱线来回移动（视向速度法）'], ['From a photograph of the planet itself', '直接拍到了行星的照片'], ['From its transit light curve', '凌星光变曲线'], ['From radio signals sent by the planet', '行星发出的无线电信号']], answer: 0,
        why: ['Mayor and Queloz measured the star’s wobble: its lines shifted with a 4.2-day period.', '马约尔和奎洛兹测出了恒星的晃动：它的谱线以 4.2 天为周期来回移动。'] },
      { q: ['A planet dims a Sun-like star (radius 696 000 km) by 0.25 %. Using depth = (Rp/R*)², what is the planet’s radius in km?', '一颗行星使类太阳恒星（半径 696000 千米）变暗 0.25%。用变暗幅度 = (Rp/R*)² 计算，行星半径是多少千米？'],
        num: { answer: 34800, tol: 1500, unit: ['km', '千米'] },
        why: ['Rp/R* = √0.0025 = 0.05, so Rp = 0.05 × 696 000 ≈ 34 800 km: about half of Jupiter’s radius (69 900 km), between Neptune and Saturn in size.', 'Rp/R* = √0.0025 = 0.05，所以 Rp = 0.05 × 696000 ≈ 34800 千米，约为木星半径（69900 千米）的一半，大小介于海王星和土星之间。'] },
      { q: ['Which can the transit method alone tell us? Choose all.', '只用凌星法，能知道行星的哪些信息？选出所有正确答案。'],
        multi: [0, 1], options: [['The planet’s radius (if we know the star’s)', '行星的半径（已知恒星半径时）'], ['Its orbital period', '它的公转周期'], ['Its mass', '它的质量'], ['Whether it has life', '它上面有没有生命']],
        why: ['Depth gives radius and the spacing of dips gives the period. Mass needs the star’s wobble (radial velocity); life is far beyond a light curve.', '变暗幅度给出半径，两次变暗的间隔给出周期。质量要靠恒星的晃动（视向速度法）测；有没有生命，光变曲线更是看不出来。'] },
      { q: ['Put these milestones in order.', '把这些里程碑按时间排序。'],
        order: [['51 Pegasi b found by radial velocity (1995)', '用视向速度法发现飞马座 51b（1995 年）'], ['First transit seen, HD 209458 b (1999)', '首次观测到凌星：HD 209458 b（1999 年）'], ['Kepler space telescope launched (2009)', '开普勒空间望远镜发射（2009 年）'], ['More than 5 000 exoplanets confirmed (2022)', '确认的系外行星超过 5000 颗（2022 年）']],
        why: ['Radial velocity came first; transits then let Kepler (2009–2018) and TESS (from 2018) find planets by the thousand.', '视向速度法最先成功；之后的凌星法让开普勒（2009～2018 年）和 TESS（2018 年起）成千上万地发现行星。'] },
    ],
  },
];
