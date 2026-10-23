/** 七上 · 地球和地图 (1): shape and size, latitude and longitude, hemispheres, rotation. */
import { C, T, arrows, mer, mk, par, type Fig, type Lesson, type Pair } from './kit.ts';
import { arrowDef, svg, tx, fade, dot } from './figs.ts';

const unit = ['The Earth and maps', '地球和地图'] as const;

// ------------------------------------------------------------------------------------------------ figure helpers

const f1 = (v: number) => v.toFixed(1);
const ln = (x1: number, y1: number, x2: number, y2: number, cls = 'fg-guide', extra = '') =>
  `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" class="${cls}"${extra}/>`;
const pts = (p: [number, number][]) => p.map(([x, y]) => `${f1(x)},${f1(y)}`).join(' ');
const D2R = Math.PI / 180;

/** How people came to know the Earth is round: a vertical timeline. */
const ideasFig: Fig = {
  k: 'svg', draw: L => {
    const rows: [Pair, Pair, Pair, string][] = [
      [['Zhou dynasty', '周代'], ['"Round sky, square Earth"', '天圆地方'], ['the sky a round lid over a flat, square ground', '天像圆形的盖子，大地方正平坦'], C.brown],
      [['c. 350 BC', '约公元前 350 年'], ['Aristotle, Greece', '亚里士多德（古希腊）'], ['the Earth\'s shadow in a lunar eclipse is always round', '月食时地球的影子总是圆的'], C.teal],
      [['c. 240 BC', '约公元前 240 年'], ['Eratosthenes, Egypt', '埃拉托色尼（古埃及）'], ['measures the Earth from noon shadows', '用正午的日影测出地球的大小'], C.teal],
      [['c. 100 BC', '约公元前 100 年'], ['Zhoubi Suanjing', '《周髀算经》'], ['"the sky like a hat, the Earth an upturned dish"', '天如斗笠，地如覆盘'], C.brown],
      [['c. AD 120', '约公元 120 年'], ['Zhang Heng, Eastern Han', '东汉张衡'], ['the sky is like an egg, the Earth like its yolk', '浑天如鸡子，地如鸡中黄'], C.gold],
      [['1519–1522', '1519—1522 年'], ['Magellan\'s fleet', '麦哲伦船队'], ['sails west and comes home from the east', '一直向西航行，从东边回到出发地'], C.gold],
      [['1972', '1972 年'], ['Apollo 17', '阿波罗 17 号'], ['photographs the whole round Earth', '拍下完整的地球照片'], C.blue],
    ];
    const y0 = 32, rh = 21, x = 76;
    let o = tx(4, 12, L(['From a flat Earth to a round one', '人类认识地球形状的过程']), 'fg-title');
    o += ln(x, y0 - 8, x, y0 + rh * (rows.length - 1) + 4, 'fg-guide');
    rows.forEach(([when, who, what, c], i) => {
      const y = y0 + i * rh;
      o += fade(0.15 * i, dot(x, y - 3, c, 3) + tx(x - 7, y, L(when), 'fg-tick', 'e') + tx(x + 8, y, L(who), 'fg-label') + tx(x + 8, y + 8.5, L(what), 'fg-sub'));
    });
    return svg(320, y0 + rh * rows.length - 4, o, L(['Timeline of ideas about the Earth\'s shape', '人类认识地球形状的时间线']));
  },
};

/** A ship sailing away over the curved sea: the hull drops below the line of sight first. */
const shipFig: Fig = {
  k: 'svg', draw: (L, id) => {
    const cx = 150, cy = 662, R = 600, H = 132;
    const surf = (x: number) => cy - Math.sqrt(R * R - (x - cx) ** 2);
    const norm = (x: number): [number, number] => [(x - cx) / R, (surf(x) - cy) / R];
    const ex = 10, [nx0, ny0] = norm(ex), E: [number, number] = [ex + nx0 * 9, surf(ex) + ny0 * 9];
    // the tangent from the eye to the sea: the farthest point the eye can see
    const dx = E[0] - cx, dy = E[1] - cy, d = Math.hypot(dx, dy), th = Math.acos(R / d), a0 = Math.atan2(dy, dx) + th;
    const Tp: [number, number] = [cx + R * Math.cos(a0), cy + R * Math.sin(a0)];
    const k = (Tp[1] - E[1]) / (Tp[0] - E[0]), yAt = (x: number) => E[1] + k * (x - E[0]);
    const ship = (x: number) => {
      const [nx, ny] = norm(x), ux = -ny, uy = nx, b: [number, number] = [x, surf(x)];
      const P = (a: number, h: number): [number, number] => [b[0] + ux * a + nx * h, b[1] + uy * a + ny * h];
      return `<polygon points="${pts([P(-11, 0), P(11, 0), P(14, 6), P(-14, 6)])}" fill="#a47148"/>`
        + `<line x1="${f1(P(0, 6)[0])}" y1="${f1(P(0, 6)[1])}" x2="${f1(P(0, 34)[0])}" y2="${f1(P(0, 34)[1])}" stroke="#e9ecef" stroke-width="1.2"/>`
        + `<polygon points="${pts([P(1, 31), P(1, 10), P(12, 10)])}" fill="#f1f3f5"/><polygon points="${pts([P(-1, 28), P(-1, 10), P(-9, 10)])}" fill="#dee2e6"/>`
        + `<polygon points="${pts([P(0, 34), P(0, 38), P(5, 36)])}" fill="${C.red}"/>`;
    };
    const xs = [Tp[0] - 46, Tp[0] + 112, Tp[0] + 190];
    let o = `<defs><clipPath id="${id}v"><polygon points="${pts([[0, H], [Tp[0], H], [Tp[0], Tp[1]], [320, yAt(320)], [320, -20], [0, -20]])}"/></clipPath></defs>`;
    o += tx(4, 12, L(['Why the hull disappears first', '为什么船身先消失']), 'fg-title') + tx(4, 23, L(['side view; the curve is greatly exaggerated', '侧视示意，弯曲程度大大夸张']), 'fg-sub');
    o += `<path d="M0 ${f1(surf(0))} A${R} ${R} 0 0 1 320 ${f1(surf(320))} L320 ${H} L0 ${H} Z" class="fg-sea"/>`;
    o += `<g opacity=".28">${xs.map(ship).join('')}</g><g clip-path="url(#${id}v)">${xs.map(ship).join('')}</g>`;
    o += fade(0.6, ln(E[0], E[1], 320, yAt(320), 'fg-guide') + `<circle cx="${f1(E[0])}" cy="${f1(E[1])}" r="3" fill="${C.gold}"/>`
      + tx(E[0] - 2, E[1] - 6, L(['eye', '眼睛']), 'fg-tick') + tx(Tp[0] + 60, yAt(Tp[0] + 60) - 4, L(['line of sight', '视线']), 'fg-tick', 'm', ` transform="rotate(${f1(Math.atan(k) / D2R)} ${f1(Tp[0] + 60)} ${f1(yAt(Tp[0] + 60) - 4)})"`));
    o += fade(1, dot(Tp[0], Tp[1], C.gold, 2) + tx(Tp[0] + 4, Tp[1] - 5, L(['horizon', '地平线']), 'fg-tick'));
    const cap: Pair[] = [['whole ship seen', '整艘船可见'], ['hull hidden', '船身被挡住'], ['only the mast top', '只见桅杆顶']];
    xs.forEach((x, i) => { o += fade(1.2 + 0.3 * i, tx(i === 2 ? 316 : x, surf(x) + 18, L(cap[i]), 'fg-label', i === 2 ? 'e' : 'm')); });
    return svg(320, H, o, L(['A ship disappearing over the horizon', '远去的帆船消失在地平线下']));
  },
};

/** Eratosthenes: parallel sunlight, a well at Syene, a gnomon at Alexandria. */
const eratoFig: Fig = {
  k: 'svg', draw: (L, id) => {
    const cx = 76, cy = 98, r = 54, a = 24 * D2R;
    const S: [number, number] = [cx, cy - r], A: [number, number] = [cx - r * Math.sin(a), cy - r * Math.cos(a)];
    const G: [number, number] = [A[0] - 18 * Math.sin(a), A[1] - 18 * Math.cos(a)];
    let o = arrowDef(`${id}a`, C.gold) + tx(4, 12, L(['How Eratosthenes measured the Earth', '埃拉托色尼测量地球']), 'fg-title');
    o += `<circle cx="${cx}" cy="${cy}" r="${r}" class="fg-globe"/>`;
    for (const x of [G[0], 100, 118]) {
      const y1 = x === G[0] ? G[1] : cy - Math.sqrt(Math.max(0, r * r - (x - cx) ** 2));
      o += `<line x1="${f1(x)}" y1="18" x2="${f1(x)}" y2="${f1(y1)}" class="fg-sunray" stroke-width="1.2" marker-end="url(#${id}a)"/>`;
    }
    o += `<line x1="${cx}" y1="18" x2="${cx}" y2="${f1(S[1] + 6)}" class="fg-sunray" stroke-width="1.2"/>`;
    o += tx(130, 30, L(['parallel sunlight', '平行的太阳光']), 'fg-tick');
    // radii to the centre and the two equal angles
    o += fade(0.5, ln(cx, cy, S[0], S[1], 'fg-guide') + ln(cx, cy, G[0], G[1], 'fg-guide') + dot(cx, cy, C.white, 1.6)
      + `<path d="M${cx} ${cy - 16} A16 16 0 0 0 ${f1(cx - 16 * Math.sin(a))} ${f1(cy - 16 * Math.cos(a))}" fill="none" stroke="${C.gold}" stroke-width="1.2"/>`
      + tx(cx - 3, cy - 19, '7.2°', 'fg-label', 'e'));
    o += fade(0.9, `<line x1="${f1(A[0])}" y1="${f1(A[1])}" x2="${f1(G[0])}" y2="${f1(G[1])}" stroke="#e9ecef" stroke-width="2.2"/>`
      + `<path d="M${f1(G[0])} ${f1(G[1] + 9)} A9 9 0 0 1 ${f1(G[0] + 9 * Math.sin(a))} ${f1(G[1] + 9 * Math.cos(a))}" fill="none" stroke="${C.gold}" stroke-width="1.2"/>`
      + tx(G[0] - 4, G[1] + 6, '7.2°', 'fg-label', 'e') + tx(A[0] - 4, A[1] + 14, L(['Alexandria', '亚历山大']), 'fg-tick', 'e'));
    o += fade(1.1, `<rect x="${cx - 2.5}" y="${S[1] - 1}" width="5" height="9" fill="#1b2733" stroke="#e9ecef" stroke-width=".8"/>`
      + tx(cx, S[1] + 20, L(['Syene', '赛伊尼']), 'fg-tick', 'm'));
    const lines: [Pair, string][] = [
      [['Syene: Sun overhead at noon, summer solstice', '赛伊尼：夏至正午太阳直射'], 'fg-sub'],
      [['Alexandria: Sun 7.2° from overhead', '亚历山大：太阳偏离天顶 7.2°'], 'fg-sub'],
      [['7.2° is 1/50 of a full circle (360°)', '7.2° 是整圆 360° 的 1/50'], 'fg-sub'],
      [['The two cities: about 5,000 stadia (≈ 800 km)', '两城相距约 5000 斯塔迪亚（约 800 千米）'], 'fg-sub'],
      [['Circumference ≈ 50 × 800 km = 40,000 km', '周长 ≈ 50 × 800 千米 = 4 万千米'], 'fg-label'],
    ];
    lines.forEach(([t, c], i) => { o += fade(1.3 + 0.2 * i, tx(146, 62 + i * 15, L(t), c)); });
    return svg(320, 156, o, L(['Diagram of Eratosthenes\' measurement', '埃拉托色尼测量地球周长示意图']));
  },
};

/** The flattened Earth (exaggerated) and its measures. */
const oblateFig: Fig = {
  k: 'svg', draw: L => {
    const cx = 72, cy = 84, R = 58, a = 64, b = 50;
    let o = tx(4, 12, L(['A slightly flattened sphere', '两极稍扁的球体']), 'fg-title') + tx(4, 23, L(['flattening greatly exaggerated', '扁率大大夸张']), 'fg-sub');
    o += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" class="fg-guide"/>`;
    o += `<ellipse cx="${cx}" cy="${cy}" rx="${a}" ry="${b}" class="fg-globe f-fade"/>`;
    o += fade(0.5, ln(cx - a, cy, cx + a, cy, 'fg-guide') + `<line x1="${cx}" y1="${cy}" x2="${cx + a}" y2="${cy}" stroke="${C.gold}" stroke-width="2"/>`
      + `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - b}" stroke="${C.teal}" stroke-width="2"/>` + dot(cx, cy, C.white, 1.8)
      + tx(cx + a / 2, cy + 11, '6378 km', 'fg-label', 'm') + tx(cx + 4, cy - b / 2, '6357 km', 'fg-label'));
    o += fade(0.8, tx(cx, cy - b - 4, L(['N', '北极']), 'fg-tick', 'm') + tx(cx, cy + b + 10, L(['S', '南极']), 'fg-tick', 'm') + tx(cx - a + 5, cy - 4, L(['Equator', '赤道']), 'fg-tick'));
    const rows: [Pair, string][] = [
      [['Equatorial radius 6,378 km', '赤道半径 6378 千米'], C.gold],
      [['Polar radius 6,357 km (21 km less)', '极半径 6357 千米（短 21 千米）'], C.teal],
      [['Mean radius 6,371 km', '平均半径 6371 千米'], C.white],
      [['Equator 40,075 km round', '赤道周长 40075 千米'], C.white],
      [['Pole-to-pole circle 40,008 km', '经线圈周长 40008 千米'], C.white],
      [['Surface 510 million km²', '表面积 5.1 亿平方千米'], C.white],
    ];
    rows.forEach(([t, c], i) => { o += fade(1 + 0.15 * i, `<rect x="160" y="${41 + i * 16}" width="3" height="10" fill="${c}"/>` + tx(168, 49 + i * 16, L(t), 'fg-sub')); });
    return svg(320, 146, o, L(['The shape and measures of the Earth', '地球的形状和大小数据']));
  },
};

/** A desk globe: the axis, the poles, the tilt. */
const globeFig: Fig = {
  k: 'svg', draw: (L, id) => {
    const cx = 92, cy = 86, r = 50, t = 23.5 * D2R, ux = Math.sin(t), uy = -Math.cos(t);
    const N: [number, number] = [cx + ux * r, cy + uy * r], S: [number, number] = [cx - ux * r, cy - uy * r];
    let o = arrowDef(`${id}a`, C.gold) + tx(4, 12, L(['A globe: a model of the Earth', '地球仪：地球的模型']), 'fg-title');
    o += `<path d="M${f1(cx - ux * (r + 8) - (-uy) * 0)} ${f1(cy - uy * (r + 8))} A${r + 8} ${r + 8} 0 0 1 ${f1(cx + ux * (r + 8))} ${f1(cy + uy * (r + 8))}" fill="none" stroke="#adb5bd" stroke-width="2.4" transform="rotate(180 ${cx} ${cy})"/>`;
    o += `<path d="M${cx - 30} ${cy + 68} Q${cx} ${cy + 60} ${cx + 30} ${cy + 68} Z" fill="#868e96"/><line x1="${cx}" y1="${cy + 65}" x2="${f1(S[0] - ux * 6)}" y2="${f1(S[1] - uy * 6)}" stroke="#adb5bd" stroke-width="2.4"/>`;
    o += `<circle cx="${cx}" cy="${cy}" r="${r}" class="fg-globe"/>`;
    o += `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="11" fill="none" stroke="${C.gold}" stroke-width="1.4" transform="rotate(${23.5} ${cx} ${cy})"/>`;
    o += `<ellipse cx="${cx}" cy="${cy}" rx="11" ry="${r}" fill="none" stroke="${C.teal}" stroke-width="1" opacity=".8" transform="rotate(${23.5} ${cx} ${cy})"/>`;
    o += fade(0.4, `<line x1="${f1(S[0] - ux * 10)}" y1="${f1(S[1] - uy * 10)}" x2="${f1(N[0] + ux * 26)}" y2="${f1(N[1] + uy * 26)}" stroke="#f1f3f5" stroke-width="1.4" marker-end="url(#${id}a)"/>`
      + dot(N[0], N[1], C.white, 2.6) + dot(S[0], S[1], C.white, 2.6)
      + tx(N[0] + 7, N[1] + 3, L(['North Pole', '北极']), 'fg-label') + tx(S[0] - 7, S[1] + 3, L(['South Pole', '南极']), 'fg-label', 'e')
      + tx(N[0] + ux * 26 + 4, N[1] + uy * 26 + 2, L(['to Polaris', '指向北极星']), 'fg-tick'));
    // the tilt: the axis makes 66.5° with the plane of the orbit (drawn level)
    o += fade(0.8, ln(cx - 4, cy, cx + 78, cy, 'fg-guide') + `<path d="M${cx + 24} ${cy} A24 24 0 0 0 ${f1(cx + 24 * ux)} ${f1(cy + 24 * uy)}" fill="none" stroke="${C.gold}" stroke-width="1.2"/>`
      + tx(cx + 27, cy - 9, '66.5°', 'fg-label') + tx(cx + 80, cy + 3, L(['orbit plane', '公转轨道面']), 'fg-tick'));
    o += fade(1.1, tx(cx - r - 2, cy + 22, L(['Equator', '赤道']), 'fg-tick', 'e') + tx(cx - 14, cy - 44, L(['axis', '地轴']), 'fg-tick', 'e'));
    const notes: Pair[] = [
      ['Axis: an imaginary line through the centre', '地轴：假想的穿过地心的轴'],
      ['Poles: where the axis meets the surface', '两极：地轴与地表的交点'],
      ['North Pole points almost at Polaris', '北极始终指向北极星附近'],
    ];
    notes.forEach((p, i) => { o += fade(1.3 + 0.2 * i, tx(176, 116 + i * 12, L(p), 'fg-sub')); });
    return svg(320, 158, o, L(['Diagram of a desk globe', '地球仪示意图']));
  },
};

/** A 10° grid of the kind printed on maps; points to read and, optionally, the directions and distances between them. */
const gridFig = (show: boolean): Fig => ({
  k: 'svg', draw: (L, id) => {
    const X = (lon: number) => 40 + (lon - 100) * 6.4, Y = (lat: number) => 136 - (lat - 20) * 3.6;
    let o = arrowDef(`${id}a`, C.gold) + tx(4, 12, L(['Reading a latitude–longitude grid', '在经纬网上判读']), 'fg-title');
    for (const la of [20, 30, 40, 50]) o += ln(X(100), Y(la), X(130), Y(la), 'fg-grid', ' stroke="#4dabf7" stroke-opacity=".55"') + tx(X(100) - 4, Y(la) + 3, `${la}°N`, 'fg-tick', 'e');
    for (const lo of [100, 110, 120, 130]) o += ln(X(lo), Y(20), X(lo), Y(50), 'fg-grid', ' stroke="#3bc9db" stroke-opacity=".55"') + tx(X(lo), Y(20) + 10, `${lo}°E`, 'fg-tick', 'm');
    const P: Record<string, [number, number]> = { A: [40, 110], B: [40, 125], C: [25, 110], D: [30, 120] };
    for (const [n, [la, lo]] of Object.entries(P)) o += dot(X(lo), Y(la), n === 'A' ? C.gold : C.white, 3) + tx(X(lo) + 5, Y(la) - 4, n, 'fg-label');
    if (show) {
      o += fade(0.6, `<line x1="${X(110) + 4}" y1="${Y(40)}" x2="${X(125) - 5}" y2="${Y(40)}" class="fg-arrow" marker-end="url(#${id}a)"/>`
        + tx(X(117.5), Y(40) - 5, L(['due east ≈ 1,280 km', '正东 约 1280 千米']), 'fg-tick', 'm'));
      o += fade(1, `<line x1="${X(110)}" y1="${Y(40) + 4}" x2="${X(110)}" y2="${Y(25) - 5}" class="fg-arrow" marker-end="url(#${id}a)"/>`
        + tx(X(110) - 4, Y(33), L(['due south', '正南']), 'fg-tick', 'e') + tx(X(110) - 4, Y(33) + 9, L(['≈ 1,670 km', '约 1670 千米']), 'fg-tick', 'e'));
      const notes: [Pair, Pair][] = [
        [['Along a parallel:', '沿纬线：'], ['east–west', '东西方向']],
        [['Along a meridian:', '沿经线：'], ['north–south', '南北方向']],
        [['1° of latitude', '纬度 1°'], ['≈ 111 km', '约 111 千米']],
        [['1° of longitude', '经度 1°'], ['≈ 85 km at 40°N', '在 40°N 约 85 千米']],
      ];
      notes.forEach(([a, b], i) => { o += fade(1.4 + 0.15 * i, tx(X(130) + 8, Y(48) + i * 26, L(a), 'fg-label') + tx(X(130) + 8, Y(48) + i * 26 + 10, L(b), 'fg-sub')); });
    }
    return svg(320, 150, o, L(['A latitude and longitude grid with points A to D', '标有 A—D 四点的经纬网']));
  },
});

/** East or west? A number line of longitude with the two hemispheres and some cities. */
const hemiFig: Fig = {
  k: 'svg', draw: L => {
    const X = (lon: number) => 16 + ((lon + 180) / 360) * 288, y0 = 64, h = 16;
    let o = tx(4, 12, L(['East or west? Read the longitude', '东半球还是西半球？看经度']), 'fg-title');
    o += `<rect x="${X(-180)}" y="${y0}" width="${X(-20) - X(-180)}" height="${h}" fill="${C.violet}" opacity=".45" class="f-growx"/>`;
    o += `<rect x="${X(-20)}" y="${y0}" width="${X(160) - X(-20)}" height="${h}" fill="${C.green}" opacity=".45" class="f-growx" style="--d:.2s"/>`;
    o += `<rect x="${X(160)}" y="${y0}" width="${X(180) - X(160)}" height="${h}" fill="${C.violet}" opacity=".45" class="f-growx" style="--d:.4s"/>`;
    o += tx(X(-100), y0 + 11, L(['Western Hemisphere', '西半球']), 'fg-label', 'm') + tx(X(70), y0 + 11, L(['Eastern Hemisphere', '东半球']), 'fg-label', 'm');
    for (const [lon, p] of [[-180, ['180°', '180°']], [-90, ['90°W', '90°W']], [0, ['0°', '0°']], [90, ['90°E', '90°E']], [180, ['180°', '180°']]] as [number, Pair][])
      o += ln(X(lon), y0 + h, X(lon), y0 + h + 4, 'fg-guide') + tx(X(lon), y0 + h + 12, L(p), 'fg-tick', 'm');
    for (const lon of [-20, 160]) o += `<line x1="${f1(X(lon))}" x2="${f1(X(lon))}" y1="${y0 - 3}" y2="${y0 + h + 3}" stroke="${C.gold}" stroke-width="2"/>`;
    o += tx(X(-20), y0 + h + 24, L(['20°W', '20°W']), 'fg-label', 'm') + tx(X(160), y0 + h + 24, L(['160°E', '160°E']), 'fg-label', 'm');
    const cities: [number, Pair, number, 's' | 'm' | 'e'][] = [
      [-74, ['New York 74°W', '纽约 74°W'], 50, 'm'], [-21.9, ['Reykjavík 21.9°W', '雷克雅未克 21.9°W'], 30, 'e'], [-17.4, ['Dakar 17.4°W', '达喀尔 17.4°W'], 40, 'e'],
      [-0.1, ['London 0.1°W', '伦敦 0.1°W'], 50, 's'], [116.4, ['Beijing', '北京'], 50, 'm'], [151.2, ['Sydney 151°E', '悉尼 151°E'], 40, 'e'], [174.8, ['Wellington 175°E', '惠灵顿 175°E'], 30, 'e'],
    ];
    cities.forEach(([lon, p, y, a], i) => { o += fade(0.6 + 0.12 * i, ln(X(lon), y + 2, X(lon), y0, 'fg-guide') + dot(X(lon), y0, C.white, 1.8) + tx(X(lon) + (a === 'e' ? 2 : a === 's' ? -2 : 0), y, L(p), 'fg-tick', a)); });
    o += fade(1.6, tx(4, 122, L(['West longitude below 20° is still in the Eastern Hemisphere;', '西经 20° 以内仍属东半球；']), 'fg-sub')
      + tx(4, 132, L(['east longitude beyond 160° is in the Western Hemisphere.', '东经 160° 以东属于西半球。']), 'fg-sub'));
    return svg(320, 138, o, L(['Longitude number line showing the Eastern and Western Hemispheres', '用经度数轴判断东西半球']));
  },
};

/** Seen from above each pole: which way the Earth turns. */
const polarFig: Fig = {
  k: 'svg', draw: (L, id) => {
    const r = 42, cy = 72;
    const disc = (cx: number, north: boolean, d: number) => {
      const R = r + 8, c = Math.cos(Math.PI / 3) * R, s = Math.sin(Math.PI / 3) * R;
      // SVG sweep 0 = anticlockwise on screen, 1 = clockwise
      const arcs = north
        ? `M${f1(cx + c)} ${f1(cy + s)} A${R} ${R} 0 0 0 ${f1(cx + c)} ${f1(cy - s)} M${f1(cx - c)} ${f1(cy - s)} A${R} ${R} 0 0 0 ${f1(cx - c)} ${f1(cy + s)}`
        : `M${f1(cx + c)} ${f1(cy - s)} A${R} ${R} 0 0 1 ${f1(cx + c)} ${f1(cy + s)} M${f1(cx - c)} ${f1(cy + s)} A${R} ${R} 0 0 1 ${f1(cx - c)} ${f1(cy - s)}`;
      const lab: [number, number, Pair, 's' | 'm' | 'e'][] = [
        [cx, cy + r - 4, ['0°', '0°'], 'm'], [cx, cy - r + 10, ['180°', '180°'], 'm'],
        [cx + r - 4, cy + 3, north ? ['90°E', '90°E'] : ['90°W', '90°W'], 'e'], [cx - r + 4, cy + 3, north ? ['90°W', '90°W'] : ['90°E', '90°E'], 's'],
      ];
      return fade(d, `<circle cx="${cx}" cy="${cy}" r="${r}" class="fg-globe"/>` + ln(cx - r, cy, cx + r, cy, 'fg-guide') + ln(cx, cy - r, cx, cy + r, 'fg-guide')
        + `<circle cx="${cx}" cy="${cy}" r="${r * 0.45}" fill="none" class="fg-guide"/>`
        + lab.map(([x, y, p, a]) => tx(x, y, L(p), 'fg-tick', a)).join('')
        + dot(cx, cy, C.white, 2.6) + tx(cx + 4, cy - 4, L(north ? ['N', '北极'] : ['S', '南极']), 'fg-label')
        + arcs.split(' M').map((d, k) => `<path d="${k ? 'M' + d : d}" class="fg-arrow" stroke-width="2" marker-end="url(#${id}a)"/>`).join('')
        + tx(cx, cy + r + 22, L(north ? ['Above the North Pole: anticlockwise', '北极上空看：逆时针'] : ['Above the South Pole: clockwise', '南极上空看：顺时针']), 'fg-label', 'm'));
    };
    return svg(320, 140, arrowDef(`${id}a`, C.gold) + disc(80, true, 0) + disc(240, false, 0.4), L(['The direction of rotation seen from above each pole', '从两极上空看地球自转方向']));
  },
};

/** Local (sun) times along a parallel when it is noon at 120°E. */
const localFig: Fig = {
  k: 'svg', draw: (L, id) => {
    const X = (lon: number) => 40 + (lon - 75) * 4, cy = 62, r = 14;
    let o = arrowDef(`${id}a`, C.gold) + tx(4, 12, L(['When the Sun is highest over 120°E…', '当东经 120° 正午时……']), 'fg-title');
    o += `<line x1="${X(75)}" y1="30" x2="${X(135) + 6}" y2="30" class="fg-arrow" marker-end="url(#${id}a)"/>`;
    o += tx(X(105), 26, L(['the Earth turns west → east: the east is ahead', '地球自西向东自转：东边时刻早']), 'fg-tick', 'm');
    const cities: Pair[] = [['Kashgar 76°E', '喀什 76°E'], ['Lhasa 91°E', '拉萨 91°E'], ['Chengdu 104°E', '成都 104°E'], ['Beijing Time', '北京时间'], ['Fuyuan 134°E', '抚远 134°E']];
    [75, 90, 105, 120, 135].forEach((lon, i) => {
      const hr = 9 + i, x = X(lon), ang = ((hr % 12) / 12) * 2 * Math.PI, gold = lon === 120;
      o += fade(0.2 * i, `<circle cx="${x}" cy="${cy}" r="${r}" fill="#0b1622" stroke="${gold ? C.gold : '#adb5bd'}" stroke-width="${gold ? 2 : 1.2}"/>`
        + [0, 3, 6, 9].map(k => { const a = (k / 12) * 2 * Math.PI; return ln(x + Math.sin(a) * (r - 3), cy - Math.cos(a) * (r - 3), x + Math.sin(a) * (r - 1), cy - Math.cos(a) * (r - 1), 'fg-guide'); }).join('')
        + `<line x1="${x}" y1="${cy}" x2="${f1(x + Math.sin(ang) * 8)}" y2="${f1(cy - Math.cos(ang) * 8)}" stroke="#f1f3f5" stroke-width="2" stroke-linecap="round"/>`
        + `<line x1="${x}" y1="${cy}" x2="${x}" y2="${cy - 11}" stroke="#f1f3f5" stroke-width="1.1" stroke-linecap="round"/>`
        + tx(x, cy + r + 11, `${lon}°E`, 'fg-tick', 'm') + tx(x, cy + r + 22, `${String(hr).padStart(2, '0')}:00`, gold ? 'fg-label' : 'fg-label', 'm')
        + tx(x, cy + r + 33, L(cities[i]), 'fg-sub', 'm'));
    });
    o += fade(1.3, tx(4, 136, L(['15° of longitude = 1 hour; 1° = 4 minutes of local time.', '经度相差 15°，地方时相差 1 小时；相差 1°，相差 4 分钟。']), 'fg-sub'));
    return svg(320, 142, o, L(['Local times at different longitudes', '不同经度的地方时']));
  },
};

/** Quiz: day and night seen from above the North Pole; which point is at dawn? */
const dawnFig: Fig = {
  k: 'svg', draw: (L, id) => {
    const cx = 110, cy = 74, r = 46;
    let o = arrowDef(`${id}a`, C.gold) + tx(4, 12, L(['Looking down on the North Pole', '从北极上空俯视']), 'fg-title');
    o += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1b2733" stroke="#74c0fc"/>`;
    o += `<path d="M${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx} ${cy + r} Z" fill="rgba(116,192,252,.55)"/>`;
    for (const y of [40, 58, 74, 90, 108]) o += `<line x1="300" y1="${y}" x2="${f1(cx + Math.sqrt(Math.max(0, r * r - (y - cy) ** 2)) + 8)}" y2="${y}" class="fg-sunray" stroke-width="1.2" marker-end="url(#${id}a)"/>`;
    o += `<circle cx="306" cy="74" r="9" class="fg-sun"/>` + tx(296, 98, L(['sunlight', '阳光']), 'fg-tick', 'e');
    const R = r + 9, c = Math.cos(Math.PI / 3) * R, s = Math.sin(Math.PI / 3) * R;
    o += `<path d="M${f1(cx - c)} ${f1(cy - s)} A${R} ${R} 0 0 0 ${f1(cx - c)} ${f1(cy + s)}" class="fg-arrow" stroke-width="2" marker-end="url(#${id}a)"/>`;
    o += dot(cx, cy, C.white, 2.4) + tx(cx + 4, cy - 4, L(['N', '北极']), 'fg-label');
    o += dot(cx, cy + r, C.gold, 3.4) + tx(cx + 6, cy + r + 10, 'A', 'fg-label') + dot(cx, cy - r, C.gold, 3.4) + tx(cx + 6, cy - r - 3, 'B', 'fg-label');
    o += tx(cx - r - 6, cy + 3, L(['night', '夜']), 'fg-tick', 'e') + tx(cx + 18, cy + 22, L(['day', '昼']), 'fg-tick');
    return svg(320, 140, o, L(['Day and night from above the North Pole, with points A and B on the edge of the light', '北极上空俯视的昼夜分布，A、B 两点位于晨昏线上']));
  },
};

/** A small circle `km` round a point (for the horizon seen from a height). */
const ring = ([la, lo]: [number, number], km: number, n = 48): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 2 * Math.PI, d = km / 111.2;
    return [la + d * Math.cos(a), lo + (d * Math.sin(a)) / Math.cos(la * D2R)] as [number, number];
  });
/** Length of a parallel, km. */
const parLen = (lat: number) => Math.round(40075 * Math.cos(lat * D2R));
const SPEEDS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map(l => Math.round(1670 * Math.cos(l * D2R)));

export const EARTH_A: Lesson[] = [
  // ============================================================================================== shape
  {
    id: 'shape', strand: 'maps', tracks: ['us', 'ib'], grade: 'g7a', unit, icon: 'globe', minutes: 8,
    title: ['The shape and size of the Earth', '地球的形状和大小'],
    blurb: ['A sphere slightly flattened at the poles: how we know, and how big it is.', '地球是两极稍扁的球体：人们是怎么知道的，它有多大。'],
    keys: [
      ['The Earth is a sphere slightly flattened at the poles: mean radius 6,371 km, equator about 40,000 km, surface 510 million km².', '地球是一个两极稍扁、赤道略鼓的球体：平均半径 6371 千米，赤道周长约 4 万千米，表面积约 5.1 亿平方千米。'],
      ['People\'s ideas changed from "round sky, square Earth" to a round Earth through observation, reasoning and voyages.', '人类对地球形状的认识，经历了从“天圆地方”到“地球是球体”的漫长过程，靠的是观察、推理和航海实践。'],
      ['Evidence: Magellan\'s fleet sailed round the world; ships vanish hull first; the Earth\'s shadow on the Moon is round; photos from space.', '证据：麦哲伦船队环球航行；远去的船船身先消失；月食时地球的影子是圆的；太空拍摄的地球照片。'],
      ['Eratosthenes measured the Earth around 240 BC: a 7.2° difference in the noon Sun over 800 km gives about 40,000 km.', '埃拉托色尼约在公元前 240 年测量地球：两地正午太阳高度相差 7.2°，相距约 800 千米，算出周长约 4 万千米。'],
      ['Mountains and trenches are tiny next to the Earth: on a 30 cm globe, the 20 km from deepest trench to highest peak would be under 0.5 mm.', '与地球相比，高山和海沟都非常微小：在直径 30 厘米的地球仪上，从最深海沟到最高峰约 20 千米的落差还不到 0.5 毫米。'],
    ],
    steps: [
      {
        title: ['A sphere in space', '太空中的球体'], cam: [-8, 28, 3.3], wide: true,
        lines: [par(0, C.gold, 0.3, { w: 1.3 })],
        marks: [
          mk([4, 20], 'Africa', '非洲', { t: 0.5 }), mk([23, 46], 'Arabia', '阿拉伯半岛', { t: 0.7 }), mk([-20, 47], 'Madagascar', '马达加斯加岛', { t: 0.9 }),
          mk([-78, 30], 'Antarctica', '南极洲', { t: 1.1 }), mk([1.5, -2], 'Equator: 40,075 km round', '赤道：周长 40075 千米', { c: C.gold, t: 1.4 }),
        ],
        body: ['On 7 December 1972 the crew of Apollo 17, about 29,000 km from home, photographed the whole sunlit Earth: the famous "Blue Marble", with Africa, Arabia and the ice of Antarctica on it, the same face you see here. The Earth is a huge ball: its mean radius is 6,371 km, the equator is 40,075 km round, and its surface covers about 510 million km², 71% of it ocean. A jet at 900 km/h would need about 45 hours to fly round the equator without stopping. Because it is so big, the ground around us looks flat.',
          '1972 年 12 月 7 日，阿波罗 17 号的宇航员在离地球约 2.9 万千米的地方，拍下了被阳光完全照亮的地球，这就是著名的“蓝色弹珠”照片：上面有非洲、阿拉伯半岛和南极洲的冰盖，正是你现在看到的这一面。地球是一个巨大的球体：平均半径 6371 千米，赤道周长 40075 千米，表面积约 5.1 亿平方千米，其中 71% 是海洋。乘时速 900 千米的飞机不停地绕赤道飞一圈，也要约 45 小时。正因为地球太大，我们脚下的大地看起来是平的。'],
      },
      {
        title: ['From a square Earth to a ball', '从“天圆地方”到地球是球体'], cam: [33, 70, 4.4], fig: ideasFig,
        marks: [
          mk([37.98, 23.73], 'Athens: Aristotle', '雅典：亚里士多德', { dot: true, c: C.teal, t: 0.3 }), mk([31.2, 29.92], 'Alexandria: Eratosthenes', '亚历山大：埃拉托色尼', { dot: true, c: C.teal, t: 0.6 }),
          mk([34.62, 112.45], 'Luoyang: Zhang Heng', '洛阳：张衡', { dot: true, c: C.gold, t: 0.9 }),
        ],
        body: ['Standing on the ground, the Earth looks flat and the sky like a dome, so in ancient China people said "the sky is round, the Earth is square". Around 350 BC Aristotle in Greece argued from eclipses that the Earth is a ball, and around 240 BC Eratosthenes in Alexandria even measured its size. In China the Zhoubi Suanjing (about 100 BC) pictured the Earth as an upturned dish, and around AD 120 Zhang Heng, working in Luoyang, wrote that "the sky is like an egg, and the Earth like the yolk inside it". Each idea was tested by new observations until voyages and space photos settled the question.',
          '站在地面上看，大地平坦、天空像一个圆顶，所以我国古代有“天圆地方”的说法。约公元前 350 年，古希腊的亚里士多德根据月食推断地球是球体；约公元前 240 年，在亚历山大城工作的埃拉托色尼还测出了地球的大小。我国的《周髀算经》（约公元前 100 年）认为“天如斗笠，地如覆盘”；约公元 120 年，东汉张衡在洛阳提出“浑天如鸡子，地如鸡中黄”，把地球比作蛋黄。每一种看法都要接受新观测的检验，直到环球航行和太空照片给出了最终答案。'],
      },
      {
        title: ['Sailing all the way round', '麦哲伦船队环球航行'], cam: [0, -40, 5.2], wide: true, items: ['vy_magellan'],
        marks: [
          mk([36.78, -6.35], 'Sanlúcar, Sep 1519', '桑卢卡尔 1519 年 9 月', { dot: true, c: C.gold, t: 0.4 }),
          mk([-53.5, -70.9], 'Strait of Magellan, 1520', '麦哲伦海峡 1520 年', { dot: true, c: C.gold, t: 0.8 }),
          mk([10.3, 123.98], 'Mactan: Magellan killed, 1521', '马克坦岛：麦哲伦被杀 1521 年', { dot: true, c: C.red, t: 1.2 }),
          mk([-34.36, 18.47], 'Cape of Good Hope', '好望角', { dot: true, c: C.gold, t: 1.6 }),
          mk([14.9, -23.5], 'Cape Verde: a day "lost"', '佛得角：日志少了一天', { dot: true, c: C.violet, t: 2 }),
        ],
        task: ['Turn the globe and follow the route all the way round: it leaves Spain heading west and comes back from the east.', '转动地球，沿着航线走一圈：船队从西班牙一直向西，最后从东边回到出发地。'],
        body: ['On 20 September 1519 five ships and about 270 men left Sanlúcar in Spain under Ferdinand Magellan, sailing west. They found a passage round the tip of South America (the Strait of Magellan, late 1520), crossed the Pacific for over three months, and reached the Philippines, where Magellan was killed on Mactan island in April 1521. Led by Elcano, the ship Victoria crossed the Indian Ocean, rounded the Cape of Good Hope and reached Spain on 6 September 1522 with just 18 men. Always heading west, they had come back from the east: only a ball allows that. At Cape Verde they found their logbook a whole day behind the calendar, because sailing west with the Sun they had seen one sunrise fewer.',
          '1519 年 9 月 20 日，麦哲伦率领 5 艘船、约 270 人从西班牙桑卢卡尔港出发，一路向西航行。他们绕过南美洲南端（1520 年底穿过麦哲伦海峡），横渡太平洋三个多月，到达菲律宾；1521 年 4 月，麦哲伦在马克坦岛的冲突中被杀。余下的人在埃尔卡诺率领下，乘“维多利亚号”横渡印度洋，绕过好望角，于 1522 年 9 月 6 日回到西班牙，只剩 18 人。他们一直向西，最后却从东边回到了出发地，这只有在球体上才可能。船到佛得角时，他们发现航海日志比当地日历少了一天：一路随着太阳向西走，他们少看了一次日出。'],
      },
      {
        title: ['Ships and the horizon', '船只和地平线'], cam: [31.6, 121.1, 1.6], fig: shipFig,
        lines: [{ pts: ring([31.2355, 121.5055], 83), c: C.gold, t: 0.4, dur: 2, closed: true, w: 2 }],
        marks: [
          mk([31.2355, 121.5055], 'Shanghai Tower, deck 546 m', '上海中心大厦 546 米观光层', { dot: true, c: C.gold, t: 0.3 }),
          mk([32.05, 121.5], 'Horizon ≈ 83 km away, as far as Suzhou', '地平线约在 83 千米外，远及苏州', { c: C.gold, t: 1.6 }),
        ],
        body: ['Watch a ship sail away on a calm sea: the hull disappears first, then the sails, and last the top of the mast. Coming in, the mast top appears first. On a flat sea the ship would just shrink to a dot; on a curved one the bulge of water hides its lower part. The higher you stand, the farther you see, roughly d ≈ 3.57 × √h km for a height h in metres: an eye 1.7 m above the sea sees about 4.7 km, but from the 546 m deck of the Shanghai Tower the horizon is about 83 km away, as far as Suzhou (the gold ring). As the Tang poet Wang Zhihuan put it: "to see a thousand li further, climb one more storey."',
          '在平静的海面上看一艘船远去：先消失的是船身，然后是船帆，最后才是桅杆顶；船驶来时则先看到桅杆顶。如果海面是平的，船只会越来越小，缩成一个点；正因为海面是弯曲的，鼓起的海水才挡住了船的下部。站得越高，看得越远，大约是 d ≈ 3.57 × √h 千米（h 是高度，单位米）：眼睛离海面 1.7 米只能看到约 4.7 千米远，而在上海中心大厦 546 米高的观光层，地平线远在约 83 千米外，差不多到苏州（图中金色圆圈）。正如唐诗所说：“欲穷千里目，更上一层楼。”'],
      },
      {
        title: ['A round shadow on the Moon', '月食：地球圆形的影子'],
        astro: { kit: 'model', kind: 'lunar', event: 'lunar-eclipse', t: Date.UTC(2025, 8, 1), clock: { from: -3, to: 3, rate: 0.4, unit: 'hour', dp: 1 } },
        body: ['In a lunar eclipse the Earth passes between the Sun and the Moon, and the Earth\'s shadow slides across the Moon. Around 350 BC Aristotle noticed that the edge of this shadow is always part of a circle, whether the Moon is high or low and whatever the time of night. Only a ball casts a round shadow in every direction: a disc seen edge-on would cast a thin line. You can check it yourself: on the night of 7–8 September 2025 a total lunar eclipse was seen across the whole of China, with totality lasting about 82 minutes; watch the curved shadow edge in the model.',
          '月食时，地球运行到太阳和月球之间，地球的影子扫过月面。约公元前 350 年，亚里士多德注意到：无论月亮高低、发生在夜里什么时候，月面上地影的边缘总是圆弧形的。只有球体才能在任何方向都投下圆形的影子；如果地球是个圆盘，侧面对着太阳时影子就会变成一条细线。你也可以亲自验证：2025 年 9 月 7 日夜到 8 日凌晨，我国全境都能看到一次月全食，全食持续约 82 分钟。看看模型里地影弯弯的边缘。'],
      },
      {
        title: ['Measuring the Earth with shadows', '用日影测量地球'], cam: [28, 31, 2.2], fig: eratoFig,
        lines: [{ pts: [[31.2, 29.92], [24.09, 32.9]], c: C.gold, t: 0.5, dur: 1.4, w: 1.6 }, par(23.44, C.orange, 0.2, { w: 1 })],
        marks: [
          mk([31.2, 29.92], 'Alexandria: Sun 7.2° from overhead', '亚历山大：太阳偏离天顶 7.2°', { dot: true, c: C.gold, t: 0.4 }),
          mk([24.09, 32.9], 'Syene (Aswan): Sun overhead', '赛伊尼（阿斯旺）：太阳直射', { dot: true, c: C.gold, t: 0.8 }),
          mk([27.6, 31.6], '≈ 800 km', '约 800 千米', { c: C.gold, t: 1.2 }),
          mk([22.6, 25], 'Tropic of Cancer', '北回归线', { c: C.orange, t: 1.5 }),
        ],
        body: ['Around 240 BC Eratosthenes heard that at noon on midsummer day the Sun shone straight down a well at Syene (now Aswan), near the Tropic of Cancer. At the same moment in Alexandria, about 5,000 stadia (≈ 800 km) to the north, a vertical rod cast a shadow showing the Sun 7.2° from overhead. Sunlight arrives in parallel rays, so 7.2° is also the angle between the two places at the Earth\'s centre, and 7.2° is 1/50 of a full circle. The Earth must therefore be about 50 × 800 = 40,000 km round, very close to the true 40,008 km. In AD 724 the Tang monk Yixing led the world\'s first measured survey of a meridian arc across the North China Plain, using noon shadows in the same way.',
          '约公元前 240 年，埃拉托色尼听说：夏至日正午，阳光能直射到北回归线附近赛伊尼（今阿斯旺）的井底。同一时刻，在北边约 5000 斯塔迪亚（约 800 千米）的亚历山大城，竖直木杆的影子表明太阳偏离天顶 7.2°。太阳光是平行射来的，所以 7.2° 也是两地在地心处的夹角，而 7.2° 正好是圆周 360° 的 1/50。因此地球周长约为 50 × 800 = 40000 千米，与实际的 40008 千米非常接近。公元 724 年，唐代僧人一行组织人员在华北平原用同样的日影方法，实测了子午线的长度，这是世界上第一次实测子午线。'],
      },
      {
        title: ['Slightly flattened at the poles', '两极稍扁的球体'], cam: [25, -30, 5], wide: true, fig: oblateFig,
        lines: [par(0, C.gold, 0.2, { w: 1.2 })],
        marks: [
          mk([-0.18, -78.47], 'Quito: French survey 1735–44', '基多：法国测量队 1735—1744 年', { dot: true, c: C.teal, t: 0.5 }),
          mk([65.85, 24.15], 'Tornio, Lapland: 1736–37', '托尔讷河谷（拉普兰）：1736—1737 年', { dot: true, c: C.teal, t: 0.9 }),
          { ll: [-1.469, -78.817], dot: true, c: C.gold, t: 1.3 }, mk([-6, -79], 'Chimborazo 6,263 m (dot)', '钦博拉索山 6263 米（金点）', { c: C.gold, t: 1.3 }),
        ],
        body: ['The Earth spins once a day, and the spinning makes the equator bulge out a little, as Isaac Newton predicted in 1687. To test it, France sent surveyors to Quito near the equator (1735–44) and to Lapland near the Arctic Circle (1736–37): one degree of latitude turned out longer in the north, so the Earth is flatter at the poles. The equatorial radius is 6,378 km and the polar radius 6,357 km, only 21 km (about 1/300) less, too little to see in any photo. Because of the bulge, the summit of Chimborazo in Ecuador, 6,263 m high but almost on the equator, is about 2 km farther from the Earth\'s centre than the top of Everest.',
          '地球每天自转一周，自转使赤道部分稍稍向外鼓出，这是牛顿在 1687 年就预言了的。为了验证，法国派出两支测量队：一支去赤道附近的基多（1735—1744 年），一支去北极圈附近的拉普兰（1736—1737 年）。结果北方 1° 纬度的弧长更长，说明地球两极较扁。地球赤道半径 6378 千米，极半径 6357 千米，只相差 21 千米（约 1/300），在照片上根本看不出来。也正因为赤道鼓出，厄瓜多尔的钦博拉索山虽然海拔只有 6263 米，但几乎位于赤道上，它的山顶比珠穆朗玛峰峰顶离地心还远约 2 千米。'],
      },
      {
        title: ['Smoother than it looks', '高山和海沟有多“小”'], cam: [22, 115, 4.2], items: ['everest'],
        lines: [{ pts: [[27.988, 86.925], [11.37, 142.59]], c: C.teal, t: 0.6, dur: 1.6, w: 1.2 }],
        marks: [
          mk([30.5, 86.9], 'Everest 8,849 m', '珠穆朗玛峰 8849 米', { c: C.gold, t: 0.3 }),
          mk([11.37, 142.59], 'Challenger Deep ≈ 10,900 m', '挑战者深渊 约 10900 米', { dot: true, c: C.blue, t: 0.8 }),
          mk([14.5, 142.59], 'Fendouzhe dived 10,909 m (2020)', '“奋斗者”号下潜 10909 米（2020 年）', { c: C.blue, t: 1.3 }),
        ],
        body: ['The Earth\'s surface has its giants: Everest rises 8,848.86 m above sea level, and the Challenger Deep in the Mariana Trench sinks to about 10,900 m below it. On 10 November 2020 China\'s crewed submersible Fendouzhe ("Striver") reached 10,909 m there. Together that is under 20 km of relief on a ball 12,742 km across, about 0.3% of its radius. Shrink the Earth to a 30 cm desk globe and Everest would stand 0.2 mm high, the trench would be 0.26 mm deep, and the polar flattening would be about 0.5 mm: you could not feel any of them with your finger.',
          '地球表面也有“巨人”：珠穆朗玛峰海拔 8848.86 米，马里亚纳海沟的挑战者深渊深约 10900 米。2020 年 11 月 10 日，我国“奋斗者”号载人潜水器在那里下潜到 10909 米。两者加起来不到 20 千米，而地球直径有 12742 千米，这点起伏只相当于半径的 0.3% 左右。如果把地球缩小成直径 30 厘米的地球仪，珠穆朗玛峰只有 0.2 毫米高，海沟只有 0.26 毫米深，两极扁平的程度也只有约 0.5 毫米，用手指几乎摸不出来。'],
      },
    ],
    quiz: [
      { q: ['What is the Earth\'s mean radius?', '地球的平均半径约是多少？'], options: [['6,371 km', '6371 千米'], ['40,000 km', '40000 千米'], ['1,737 km', '1737 千米'], ['637 km', '637 千米']], answer: 0,
        why: ['The mean radius is 6,371 km. 40,000 km is the length of the equator, and 1,737 km is the Moon\'s radius.', '地球平均半径 6371 千米；4 万千米是赤道周长，1737 千米是月球的半径。'] },
      { q: ['Put these steps in how people came to know the Earth\'s shape in time order.', '把人类认识地球形状的过程按时间先后排序。'],
        order: [['"Round sky, square Earth"', '天圆地方'], ['Aristotle\'s round shadow', '亚里士多德发现地影是圆的'], ['Zhang Heng: the Earth like an egg yolk', '张衡：地如鸡中黄'], ['Magellan\'s fleet sails round the world', '麦哲伦船队环球航行'], ['Apollo 17 photographs the whole Earth', '阿波罗 17 号拍下地球全貌']],
        why: ['Zhou-dynasty "round sky, square Earth" came first; Aristotle c. 350 BC; Zhang Heng c. AD 120; Magellan 1519–22; Apollo 17 in 1972.', '“天圆地方”出现在周代；亚里士多德约公元前 350 年；张衡约公元 120 年；麦哲伦船队 1519—1522 年；阿波罗 17 号 1972 年。'] },
      { q: ['Which of these are evidence that the Earth is a sphere? Choose all.', '下列哪些现象能说明地球是球体？（多选）'],
        options: [['A ship sailing away disappears hull first', '远去的帆船船身先消失'], ['The Earth\'s shadow on the Moon is always round', '月食时地影总是圆的'], ['Sailing always west brings you back from the east', '一直向西航行能从东边回到出发地'], ['The Sun rises in the east', '太阳从东方升起'], ['Photos of the Earth taken from space', '从太空拍摄的地球照片']],
        multi: [0, 1, 2, 4],
        why: ['The hull, the round shadow, the voyage round the world and space photos all show a ball. The Sun rising in the east is caused by the Earth turning west to east, and would happen on a spinning disc too.', '船身先消失、圆形地影、环球航行和太空照片都说明地球是球体。太阳东升是地球自西向东自转造成的，即使是旋转的圆盘也会如此，不能证明地球是球体。'] },
      { q: ['At noon the Sun is overhead at Syene but 7.2° from overhead at Alexandria, 800 km to the north. How long is the Earth\'s circumference?', '正午太阳直射赛伊尼，而在其北方 800 千米的亚历山大，太阳偏离天顶 7.2°。地球周长约是多少？'],
        num: { answer: 40000, tol: 500, unit: ['km', '千米'] }, fig: eratoFig,
        why: ['7.2° is 1/50 of 360°, so the circumference is 50 × 800 km = 40,000 km.', '7.2° 是 360° 的 1/50，所以周长 = 50 × 800 千米 = 40000 千米。'] },
      { q: ['Label the voyage of Magellan\'s fleet.', '标出麦哲伦船队航线上的地点。'],
        place: [{ text: ['Start: Sanlúcar, Spain', '出发地：西班牙桑卢卡尔'], at: [36.78, -6.35], tolKm: 700 }, { text: ['Strait of Magellan', '麦哲伦海峡'], at: [-53.5, -70.9], tolKm: 700 }, { text: ['Mactan, Philippines', '菲律宾马克坦岛'], at: [10.3, 123.98], tolKm: 700 }, { text: ['Cape of Good Hope', '好望角'], at: [-34.36, 18.47], tolKm: 700 }],
        why: ['They sailed west from Spain, round South America by the strait, across the Pacific to the Philippines, then home round Africa\'s Cape of Good Hope.', '船队从西班牙向西，经麦哲伦海峡绕过南美洲，横渡太平洋到菲律宾，再绕过非洲的好望角回到西班牙。'] },
      { q: ['Match each person with what they did.', '把人物和他们的贡献连起来。'],
        match: [[['Aristotle', '亚里士多德'], ['Saw the round shadow in a lunar eclipse', '从月食中的圆形地影推断地球是球体']], [['Eratosthenes', '埃拉托色尼'], ['Measured the circumference from noon shadows', '用正午日影测出地球周长']], [['Zhang Heng', '张衡'], ['Compared the Earth to an egg yolk', '把大地比作鸡蛋黄']], [['Yixing', '一行'], ['Led the first measured meridian survey', '主持世界上第一次子午线实测']], [['Newton', '牛顿'], ['Predicted the bulge at the equator', '预言地球赤道鼓出']]],
        why: ['Aristotle (c. 350 BC) used eclipses, Eratosthenes (c. 240 BC) shadows, Zhang Heng (c. AD 120) the egg; Yixing measured a meridian in AD 724; Newton predicted the flattening in 1687.', '亚里士多德（约公元前 350 年）依据月食，埃拉托色尼（约公元前 240 年）测量日影，张衡（约公元 120 年）提出浑天说，一行在公元 724 年实测子午线，牛顿在 1687 年预言地球两极稍扁。'] },
      { q: ['Which of these points is farthest from the centre of the Earth?', '下列地点中，哪个离地心最远？'], options: [['The summit of Everest (28°N, 8,849 m)', '珠穆朗玛峰峰顶（28°N，8849 米）'], ['The summit of Chimborazo (1.5°S, 6,263 m)', '钦博拉索山山顶（1.5°S，6263 米）'], ['The North Pole', '北极点'], ['The Challenger Deep', '挑战者深渊']], answer: 1,
        why: ['The equator bulges out about 21 km more than the poles. Chimborazo sits almost on the equator, so although it is 2.6 km lower than Everest, its top is about 2 km farther from the centre.', '赤道半径比极半径长约 21 千米。钦博拉索山几乎位于赤道上，虽然比珠穆朗玛峰低 2.6 千米，山顶却比珠峰峰顶离地心远约 2 千米。'] },
      { q: ['The horizon is about d = 3.57 × √h km away when your eye is h metres up. How far can you see from the 546 m deck of the Shanghai Tower?', '眼睛离地面 h 米时，地平线约在 d = 3.57 × √h 千米外。从上海中心大厦 546 米高的观光层能看多远？'],
        num: { answer: 83, tol: 4, unit: ['km', '千米'] },
        why: ['√546 ≈ 23.4, and 3.57 × 23.4 ≈ 83 km. On a flat Earth height would not matter; on a ball, climbing higher pushes the horizon out.', '√546 ≈ 23.4，3.57 × 23.4 ≈ 83 千米。如果地面是平的，站得高也看不了更远；正因为地球是球体，登得越高，地平线越远。'] },
    ],
  },
  // ============================================================================================== graticule
  {
    id: 'graticule', strand: 'maps', tracks: ['uk', 'us', 'ib', 'au'], grade: 'g7a', unit, icon: 'grid', minutes: 9,
    title: ['Latitude and longitude', '经线和纬线'],
    blurb: ['Parallels and meridians: the grid that gives every place an address.', '纬线和经线：给地球上每个地方一个“地址”。'],
    keys: [
      ['A globe is a model of the Earth; the axis through it is tilted 66.5° to the orbit plane and the North Pole points towards Polaris.', '地球仪是地球的模型；地轴与公转轨道面成 66.5° 夹角，北极指向北极星附近。'],
      ['Parallels run east–west and shrink towards the poles (equator 40,075 km, 60° about half); latitude goes 0–90°N and 0–90°S.', '纬线指示东西方向，长度从赤道（40075 千米）向两极递减，60° 纬线约为赤道的一半；纬度从 0° 到北纬、南纬各 90°。'],
      ['Meridians run north–south and are all equal half-circles; longitude goes 0–180°E and 0–180°W from the prime meridian through Greenwich.', '经线指示南北方向，都是等长的半圆；经度从经过格林尼治的本初子午线起，向东、向西各 180°。'],
      ['Key parallels: equator 0°, tropics 23.5°N/S, polar circles 66.5°N/S; low latitudes 0–30°, middle 30–60°, high 60–90°.', '特殊纬线：赤道 0°，南北回归线 23.5°，南北极圈 66.5°；0°—30° 为低纬度，30°—60° 为中纬度，60°—90° 为高纬度。'],
      ['The grid gives every place an address (Beijing ≈ 40°N, 116°E) and shows direction: meridians point north–south, parallels east–west.', '经纬网能确定任何地点的位置（北京约 40°N，116°E），也能判断方向：经线指示南北，纬线指示东西。'],
      ['1° of latitude is about 111 km everywhere; 1° of longitude is about 111 km × cos(latitude).', '纬度 1° 处处约 111 千米；经度 1° 的长度约为 111 千米 × cos（纬度）。'],
    ],
    steps: [
      {
        title: ['A model of the Earth', '地球仪：地球的模型'], cam: [62, 110, 3.6], wide: true, graticule: true, fig: globeFig,
        lines: [par(0, C.gold, 0.4, { w: 1.3 })],
        marks: [mk([89.9, 0], 'North Pole (90°N)', '北极（北纬 90°）', { dot: true, c: C.white, t: 0.3 }), mk([2, 110], 'Equator', '赤道', { c: C.gold, t: 0.8 })],
        body: ['A globe is a small model of the Earth. A typical 30 cm desk globe shrinks the Earth\'s 12,742 km diameter about 42 million times. It turns on an imaginary axis through the centre; where the axis meets the surface are the North and South Poles. The axis is not upright: it is tilted, making 66.5° with the plane of the Earth\'s orbit, and the North Pole points almost exactly at Polaris, the Pole Star. The grid of lines drawn on a globe, parallels and meridians, lets us describe any place on it.',
          '地球仪是按比例缩小的地球模型。常见的直径 30 厘米的地球仪，把直径 12742 千米的地球缩小了约 4200 万倍。地球仪绕着一根假想的轴转动，这根轴叫地轴，地轴穿过地心，与地球表面相交的两点就是北极和南极。地轴是倾斜的，它与地球公转轨道面成 66.5° 的夹角，北极始终指向北极星附近。地球仪上画着纬线和经线，组成经纬网，用它可以描述地球上任何地方的位置。'],
      },
      {
        title: ['Parallels', '纬线'], cam: [35, 100, 3.8], wide: true,
        lines: [par(0, C.gold, 0.2), par(30, C.teal, 0.6), par(60, C.blue, 1), par(80, C.ice, 1.4)],
        marks: [
          mk([2, 100], `Equator ${parLen(0).toLocaleString('en')} km`, `赤道 ${parLen(0)} 千米`, { c: C.gold, t: 0.4 }),
          mk([32, 100], `30°N ${parLen(30).toLocaleString('en')} km`, `北纬 30° ${parLen(30)} 千米`, { c: C.teal, t: 0.8 }),
          mk([62, 100], `60°N ${parLen(60).toLocaleString('en')} km`, `北纬 60° ${parLen(60)} 千米`, { c: C.blue, t: 1.2 }),
          mk([81.5, 100], `80°N ${parLen(80).toLocaleString('en')} km`, `北纬 80° ${parLen(80)} 千米`, { c: C.ice, t: 1.6 }),
        ],
        fig: { k: 'bars', title: ['Length of each parallel', '各纬线的长度'], unit: ['km', '千米'], rows: [0, 30, 40, 60, 80].map(l => ({ name: [l ? `${l}°` : 'Equator', l ? `${l}°` : '赤道'] as Pair, v: parLen(l), c: l === 60 ? C.blue : C.gold })) },
        body: ['Parallels (lines of latitude) are circles drawn round the globe, each parallel to the equator; they all run due east–west. They are not the same length: the equator, the longest, is 40,075 km, and the circles shrink towards the poles in proportion to the cosine of the latitude. The 40°N parallel through Beijing is about 30,700 km, the 60°N parallel through Oslo and St Petersburg about 20,000 km (half the equator), and at the poles a parallel shrinks to a single point. You can draw as many parallels as you like; globes usually show one every 10° or 15°.',
          '纬线是在地球仪上与赤道平行的圆圈，每条纬线都指示东西方向。纬线长短不一：赤道最长，为 40075 千米，越往两极越短，长度与纬度的余弦成正比。经过北京的北纬 40° 纬线约 30700 千米，经过奥斯陆和圣彼得堡的北纬 60° 纬线约 20000 千米，只有赤道的一半，到了两极，纬线缩成了一个点。纬线可以画出无数条，地球仪上一般每隔 10° 或 15° 画一条。'],
      },
      {
        title: ['Latitude and its special lines', '纬度和特殊纬线'], cam: [38, 70, 4.4], wide: true,
        lines: [par(0, C.gold, 0.2), par(23.44, C.orange, 0.6), par(-23.44, C.orange, 0.6), par(66.56, C.ice, 1), par(-66.56, C.ice, 1)],
        marks: [
          mk([1.5, 60], 'Equator 0°', '赤道 0°', { c: C.gold, t: 0.4 }),
          mk([25, 60], 'Tropic of Cancer 23.5°N', '北回归线 23.5°N', { c: C.orange, t: 0.8 }), mk([-22, 60], 'Tropic of Capricorn 23.5°S', '南回归线 23.5°S', { c: C.orange, t: 0.9 }),
          mk([68, 110], 'Arctic Circle 66.5°N', '北极圈 66.5°N', { c: C.ice, t: 1.2 }),
          mk([23.13, 113.26], 'Guangzhou 23.1°N', '广州 23.1°N', { dot: true, t: 1.5 }), mk([66.54, 25.85], 'Rovaniemi on the Arctic Circle', '北极圈上的罗瓦涅米', { dot: true, t: 1.8 }),
        ],
        body: ['Latitude measures how far a place is north or south of the equator, from 0° at the equator to 90° at each pole: north of it is north latitude (N), south of it south latitude (S). A few parallels have names because of the Sun: the Tropics of Cancer and Capricorn at about 23.5°N and S (23°26′) mark the furthest the overhead Sun ever reaches, and the Arctic and Antarctic Circles at 66.5° mark where the midnight Sun begins. The Tropic of Cancer crosses Taiwan, Guangdong, Guangxi and Yunnan, passing just north of Guangzhou, and Rovaniemi in Finland, the "home of Santa Claus", is built right on the Arctic Circle.',
          '纬度表示一个地方在赤道以北或以南多远：赤道是 0°，向北、向南各分 90°，到两极为 90°。赤道以北是北纬（N），以南是南纬（S）。有几条纬线和太阳有关，所以有专门的名字：南北回归线约在 23.5°（23°26′），是太阳直射点所能到达的最北和最南界线；南北极圈在 66.5°，是出现极昼极夜的界线。北回归线穿过我国台湾、广东、广西和云南，从广州北面不远处经过；芬兰的罗瓦涅米号称“圣诞老人的故乡”，就建在北极圈上。'],
      },
      {
        title: ['Meridians and the prime meridian', '经线和本初子午线'], cam: [42, 0, 3.4], items: ['sp_greenwich'],
        lines: [mer(0, C.red, 0.2, { w: 1.5 }), mer(30, C.teal, 0.8), mer(-30, C.teal, 0.8), mer(60, C.teal, 1.1), mer(-60, C.teal, 1.1)],
        marks: [mk([20, 1.5], 'Prime meridian 0°', '本初子午线 0°', { c: C.red, big: true, t: 0.6 }), mk([-5, 30], '30°E', '东经 30°', { c: C.teal, t: 1.2 }), mk([-5, -30], '30°W', '西经 30°', { c: C.teal, t: 1.2 })],
        body: ['Meridians (lines of longitude) are half-circles running from the North Pole to the South Pole; every one points due north–south, and all are the same length, about 20,000 km. A meridian and the one opposite it together make a full meridian circle of 40,008 km. Unlike the equator, no meridian is special by nature, so a starting line had to be agreed: in 1884 the International Meridian Conference in Washington chose the meridian through the Royal Observatory at Greenwich, in London, as 0°, the prime meridian. (Today\'s satellite systems put 0° about 100 m east of the brass line visitors stand astride.)',
          '经线是连接南北两极、与纬线垂直相交的半圆，每条经线都指示南北方向，长度都相等，约 2 万千米。两条相对的经线组成一个经线圈，周长约 40008 千米。经线不像赤道那样有天然的起点，所以必须商定：1884 年在华盛顿召开的国际子午线会议，决定以经过英国伦敦格林尼治天文台的经线为 0° 经线，叫做本初子午线。（今天卫星定位系统采用的 0° 经线，在天文台那条铜线以东约 100 米处。）'],
      },
      {
        title: ['East and west longitude', '东经和西经'], cam: [40, 120, 4.6], wide: true,
        lines: [mer(180, C.violet, 0.2, { w: 1.4 }), mer(73.5, C.gold, 0.8, { w: 1 }), mer(135.08, C.gold, 1, { w: 1 })],
        marks: [
          mk([62, 178], '180°: neither E nor W', '180°：不分东经西经', { c: C.violet, t: 0.5 }), mk([-17.7, 178.1], 'Fiji', '斐济', { dot: true, c: C.violet, t: 0.8 }), mk([66, -173], 'Chukotka', '楚科奇半岛', { c: C.violet, t: 1 }),
          mk([39.3, 73.6], 'China\'s west ≈ 73°E', '我国最西端 约 73°E', { dot: true, c: C.gold, t: 1.3 }), mk([48.4, 135.08], 'China\'s east 135°E', '我国最东端 135°E', { dot: true, c: C.gold, t: 1.6 }),
        ],
        body: ['Longitude measures how far east or west of the prime meridian a place is. Going east from 0° the numbers rise to 180°E (east longitude, E); going west they rise to 180°W (west longitude, W). The 180° meridian is both, so it is written just "180°"; it runs almost entirely over the Pacific, crossing Fiji and the Chukotka peninsula of Russia. A quick rule: if the numbers increase eastward it is east longitude, if they increase westward it is west longitude. China stretches from about 73°E in the Pamirs to 135°E where the Heilongjiang and Wusuli rivers meet, over 60° of longitude.',
          '经度表示一个地方在本初子午线以东或以西多远。从 0° 向东到 180° 是东经（E），向西到 180° 是西经（W）。180° 经线既是东经 180°，也是西经 180°，所以直接写作“180°”；它几乎全部经过太平洋，穿过斐济和俄罗斯的楚科奇半岛。判断方法：度数向东增大的是东经，向西增大的是西经。我国从帕米尔高原约东经 73° 一直延伸到黑龙江与乌苏里江主航道汇合处的东经 135° 附近，东西跨经度 60° 多。'],
      },
      {
        title: ['Low, middle and high latitudes', '低、中、高纬度'], cam: [30, 105, 4.2], wide: true, graticule: true,
        paint: [
          { fill: { k: 'band', s: -30, n: 30, c: C.red }, a: 0.38 },
          { fill: { k: 'band', s: 30, n: 60, c: C.gold }, t: 0.6, a: 0.38 }, { fill: { k: 'band', s: -60, n: -30, c: C.gold }, t: 0.6, a: 0.38 },
          { fill: { k: 'band', s: 60, n: 90, c: C.blue }, t: 1.2, a: 0.42 }, { fill: { k: 'band', s: -90, n: -60, c: C.blue }, t: 1.2, a: 0.42 },
        ],
        marks: [
          mk([12, 70], 'Low latitudes 0–30°', '低纬度 0°—30°', { c: C.red, t: 0.3 }), mk([47, 70], 'Middle latitudes 30–60°', '中纬度 30°—60°', { c: C.gold, t: 0.9 }), mk([68, 80], 'High latitudes 60–90°', '高纬度 60°—90°', { c: C.blue, t: 1.5 }),
          mk([53.56, 123.27], 'Mohe 53.5°N', '漠河 53.5°N', { dot: true, t: 1.9 }), mk([3.97, 112.28], 'Zengmu Ansha 4°N', '曾母暗沙 4°N', { dot: true, t: 2.2 }),
        ],
        body: ['Geographers group latitudes into three belts: low latitudes from 0° to 30°, middle latitudes from 30° to 60°, and high latitudes from 60° to 90°, in each hemisphere. The belts match broad differences in sunshine: low latitudes get the Sun high overhead all year, high latitudes have low Sun, long summer days and long winter nights. China runs from Zengmu Ansha at about 4°N to the Heilongjiang river near Mohe at about 53.5°N, nearly 50° of latitude. Most of China lies in the middle latitudes, the south (Hainan, southern Guangdong, Taiwan, Yunnan) is in the low latitudes, and no part reaches the high latitudes.',
          '地理上把纬度分成三个带：0°—30° 为低纬度，30°—60° 为中纬度，60°—90° 为高纬度，南北半球都是这样。它们和获得太阳光热的多少大致对应：低纬度地区全年太阳高度大，高纬度地区太阳高度小，夏季昼长、冬季夜长。我国最南端在曾母暗沙（约北纬 4°），最北端在漠河以北的黑龙江主航道（约北纬 53.5°），南北跨纬度近 50°。我国大部分地区位于中纬度，南部的海南、广东南部、台湾、云南南部等地属于低纬度，没有地区位于高纬度。'],
      },
      {
        title: ['An address on the grid', '用经纬网定位'], cam: [34, 108, 2.8], items: ['forbidden', 'potala'],
        lines: [
          { pts: [[39.9, 95], [39.9, 125]], c: C.gold, t: 0.3, rhumb: true, dur: 1.4 }, { pts: [[22, 116.4], [48, 116.4]], c: C.teal, t: 0.6, rhumb: true, dur: 1.4 },
          { pts: [[29.66, 82], [29.66, 112]], c: C.gold, t: 1.2, rhumb: true, dur: 1.4 }, { pts: [[20, 91.1], [42, 91.1]], c: C.teal, t: 1.5, rhumb: true, dur: 1.4 },
        ],
        marks: [
          mk([39.9, 116.4], 'Beijing 39.9°N, 116.4°E', '北京 39.9°N，116.4°E', { dot: true, c: C.gold, t: 0.9 }), mk([29.66, 91.12], 'Lhasa 29.7°N, 91.1°E', '拉萨 29.7°N，91.1°E', { dot: true, c: C.gold, t: 1.8 }),
          mk([30.27, 120.15], '30°N, 120°E: ?', '北纬 30°，东经 120°：？', { dot: true, c: C.violet, t: 2.3 }),
        ],
        task: ['Find 30°N, 120°E on the globe (the violet dot): which city is it? Turn on the names to check.', '在地球上找到 30°N、120°E（紫色圆点），它是哪座城市？可以打开地名检查一下。'],
        body: ['Every parallel crosses every meridian at exactly one point, so a latitude plus a longitude is a unique address. The Forbidden City in Beijing sits at about 39.9°N, 116.4°E: on the 39.9° north parallel (gold) where it meets the 116.4° east meridian (teal). The Potala Palace in Lhasa is at 29.7°N, 91.1°E. Always give both numbers and the letters: "40°, 116°" alone could be four different places: in China, in the USA, in the Southern Ocean south of Australia, or in the South Pacific. The violet dot at 30°N, 120°E is Hangzhou.',
          '每一条纬线和每一条经线只相交于一点，所以纬度加经度就构成一个独一无二的“地址”。北京故宫约在 39.9°N、116.4°E，也就是北纬 39.9° 纬线（金色）与东经 116.4° 经线（青色）的交点；拉萨的布达拉宫约在 29.7°N、91.1°E。描述位置时，两个数和 N、S、E、W 都不能少：只说“40°，116°”，可能指中国、美国、澳大利亚以南的海洋或南太平洋上的四个不同地方。紫色圆点 30°N、120°E 附近是杭州。'],
      },
      {
        title: ['Directions and distances on the grid', '在经纬网上判断方向和距离'], cam: [33, 116, 3], fig: gridFig(true),
        lines: [
          { pts: [[40, 110], [40, 125]], c: C.gold, t: 0.4, rhumb: true, arrow: true, dur: 1.2, w: 1.5 },
          { pts: [[40, 110], [25, 110]], c: C.gold, t: 0.9, rhumb: true, arrow: true, dur: 1.2, w: 1.5 },
        ],
        marks: [mk([40, 110], 'A', 'A 点', { dot: true, c: C.gold, big: true, t: 0.2 }), mk([40, 125], 'B', 'B 点', { dot: true, big: true, t: 0.6 }), mk([25, 110], 'C', 'C 点', { dot: true, big: true, t: 1.1 }), mk([30, 120], 'D', 'D 点', { dot: true, big: true, t: 1.4 })],
        body: ['Meridians point north–south and parallels east–west, so the grid also tells direction. B is on A\'s parallel and 15° further east, so it is due east of A; C is on A\'s meridian and 15° further south, so it is due south. D has a lower latitude (south) and a greater east longitude (east) than A, so D is southeast of A. Distances follow too: 1° of latitude is about 111 km anywhere, so A to C is 15 × 111 ≈ 1,670 km, but 1° of longitude shrinks with latitude (111 km × cos 40° ≈ 85 km at 40°N), so A to B is only about 1,280 km.',
          '经线指示南北方向，纬线指示东西方向，所以经纬网还能用来判断方向。B 与 A 在同一条纬线上，经度向东大 15°，所以 B 在 A 的正东方；C 与 A 在同一条经线上，纬度低 15°，所以 C 在 A 的正南方。D 的纬度比 A 低（偏南）、东经度数比 A 大（偏东），所以 D 在 A 的东南方。经纬网还能估算距离：纬度 1° 处处约 111 千米，A 到 C 约 15 × 111 ≈ 1670 千米；而经度 1° 的长度随纬度增高而变短，北纬 40° 处约 111 × cos40° ≈ 85 千米，所以 A 到 B 只有约 1280 千米。'],
      },
    ],
    quiz: [
      { q: ['Going from the equator towards the poles, the parallels…', '从赤道向两极，纬线的长度'], options: [['get shorter', '逐渐变短'], ['get longer', '逐渐变长'], ['stay the same', '都一样长'], ['are longest at 45°', '在 45° 最长']], answer: 0,
        why: ['The equator is the longest parallel (40,075 km); they shrink towards the poles, where they become points.', '赤道是最长的纬线（40075 千米），纬线越往两极越短，到极点缩成一个点。'] },
      { q: ['Which statements about meridians are true? Choose all.', '关于经线，下列说法正确的是（多选）'],
        options: [['They are all the same length', '所有经线都一样长'], ['They point north–south', '经线指示南北方向'], ['Each is a half-circle from pole to pole', '每条经线都是连接两极的半圆'], ['They get shorter towards the poles', '越往两极经线越短'], ['The 0° meridian passes Greenwich', '0° 经线经过格林尼治']],
        multi: [0, 1, 2, 4],
        why: ['Meridians are equal half-circles from pole to pole, pointing north–south; 0° passes Greenwich. It is the parallels that shrink towards the poles.', '经线都是连接南北两极、长度相等的半圆，指示南北方向，0° 经线经过格林尼治。越往两极越短的是纬线。'] },
      { q: ['Match each line with its latitude.', '把特殊纬线和它的纬度连起来。'],
        match: [[['Equator', '赤道'], ['0°', '0° 纬线']], [['Tropic of Cancer', '北回归线'], ['23.5°N', '北纬 23.5°']], [['Arctic Circle', '北极圈'], ['66.5°N', '北纬 66.5°']], [['Tropic of Capricorn', '南回归线'], ['23.5°S', '南纬 23.5°']], [['Antarctic Circle', '南极圈'], ['66.5°S', '南纬 66.5°']]],
        why: ['The tropics are at 23.5° (23°26′) north and south, the polar circles at 66.5° (66°34′).', '南北回归线在南北纬 23.5°（23°26′），南北极圈在南北纬 66.5°（66°34′）。'] },
      { q: ['Find these grid points on the globe.', '在地球上找出这些经纬度位置。'],
        place: [{ text: ['Latitude 0°, longitude 0°', '纬度 0°，经度 0°'], at: [0, 0], tolKm: 600 }, { text: ['40°N, 116°E', '北纬 40°，东经 116°'], at: [40, 116], tolKm: 600 }, { text: ['62°S, 59°W', '南纬 62°，西经 59°'], at: [-62, -59], tolKm: 600 }],
        why: ['0°, 0° is in the Gulf of Guinea off Africa; 40°N, 116°E is Beijing; 62°S, 59°W is King George Island, home of China\'s Great Wall Station in Antarctica.', '0°，0° 在非洲几内亚湾的海面上；40°N，116°E 是北京；62°S，59°W 是乔治王岛，我国南极长城站就在那里。'] },
      { q: ['Guangzhou (23°N) and Beijing (40°N) are roughly on the same meridian. About how far apart are they north to south? (1° of latitude ≈ 111 km)', '广州（23°N）和北京（40°N）大致在同一条经线上。两地南北相距约多少千米？（纬度 1° ≈ 111 千米）'],
        num: { answer: 1887, tol: 120, unit: ['km', '千米'] },
        why: ['They are 40 − 23 = 17° apart, and 17 × 111 ≈ 1,890 km.', '两地纬度相差 40° − 23° = 17°，17 × 111 ≈ 1890 千米。'] },
      { q: ['About how long is the 60°N parallel?', '北纬 60° 纬线大约有多长？'], options: [['40,000 km', '40000 千米'], ['30,000 km', '30000 千米'], ['20,000 km', '20000 千米'], ['10,000 km', '10000 千米']], answer: 2,
        why: ['A parallel\'s length is 40,075 km × cos(latitude), and cos 60° = 0.5, so the 60° parallel is half the equator, about 20,000 km.', '纬线长度 = 40075 千米 × cos（纬度），cos60° = 0.5，所以北纬 60° 纬线约是赤道的一半，约 20000 千米。'] },
      { q: ['A plane flies due east along 40°N, starting at 160°E. Put the meridians in the order it crosses them.', '一架飞机从东经 160° 出发，沿北纬 40° 一直向正东飞。把它依次经过的经线排序。'],
        order: [['170°E', '东经 170°'], ['The 180° meridian', '180° 经线'], ['170°W', '西经 170°'], ['160°W', '西经 160°'], ['150°W', '西经 150°']],
        why: ['Flying east, east longitude rises to 180°, then becomes west longitude, which falls: 170°W, 160°W, 150°W.', '向东飞，东经度数增大到 180°，之后进入西经，度数逐渐减小：170°W、160°W、150°W。'] },
      { q: ['On this grid, in which direction is D from A?', '在这幅经纬网图上，D 在 A 的什么方向？'], fig: gridFig(false),
        options: [['Northeast', '东北方'], ['Southeast', '东南方'], ['Southwest', '西南方'], ['Northwest', '西北方']], answer: 1,
        why: ['D (30°N, 120°E) has a lower latitude than A (40°N, 110°E), so it is to the south, and a greater east longitude, so it is to the east: southeast.', 'D（30°N，120°E）比 A（40°N，110°E）纬度低，在 A 的南面；东经度数大，在 A 的东面，所以是东南方。'] },
    ],
  },
  // ============================================================================================== hemispheres
  {
    id: 'hemispheres', strand: 'maps', tracks: ['uk', 'us', 'ib', 'au'], grade: 'g7a', unit, icon: 'compass', minutes: 8,
    title: ['Hemispheres', '半球的划分'],
    blurb: ['North and south, east and west, and why the east–west line is at 20°W and 160°E.', '南北半球和东西半球，以及为什么东西半球以 20°W 和 160°E 为界。'],
    keys: [
      ['The equator divides the Northern and Southern Hemispheres: north latitudes are in the north, south latitudes in the south.', '赤道是南北半球的分界线：北纬属于北半球，南纬属于南半球。'],
      ['The Northern Hemisphere holds about two-thirds of the land and close to 90% of the people; the seasons of the two hemispheres are opposite.', '北半球集中了约三分之二的陆地和近 90% 的人口；南北半球的季节正好相反。'],
      ['The Eastern and Western Hemispheres are divided by the circle of 20°W and 160°E, which avoids cutting Europe and Africa in two.', '东西半球以 20°W 和 160°E 组成的经线圈为界，这样可以不把欧洲、非洲的国家分割在两个半球。'],
      ['East of 20°W up to 160°E is the Eastern Hemisphere: west longitudes under 20° are still east, east longitudes over 160° are west.', '20°W 向东到 160°E 是东半球：西经 20° 以内仍属东半球，东经 160° 以东属于西半球。'],
      ['China lies wholly in the Northern and Eastern Hemispheres.', '我国全部位于北半球和东半球。'],
    ],
    steps: [
      {
        title: ['Northern and Southern', '南北半球'], cam: [8, 105, 3.8], wide: true,
        paint: [{ fill: { k: 'band', s: 0, n: 90, c: C.teal }, t: 0.5, a: 0.24 }, { fill: { k: 'band', s: -90, n: 0, c: C.orange }, t: 0.9, a: 0.24 }],
        lines: [par(0, C.gold, 0.2, { w: 1.5 })],
        marks: [
          mk([30, 100], 'Northern Hemisphere', '北半球', { big: true, c: C.teal, t: 0.7 }), mk([-30, 100], 'Southern Hemisphere', '南半球', { big: true, c: C.orange, t: 1.1 }),
          mk([0, 109.32], 'Pontianak: equator monument', '坤甸：赤道纪念碑', { dot: true, c: C.gold, t: 1.5 }), mk([1.29, 103.85], 'Singapore 1.3°N', '新加坡 1.3°N', { dot: true, t: 1.8 }),
        ],
        body: ['The equator, latitude 0°, cuts the Earth into two equal halves: the Northern Hemisphere, where latitudes are north (N), and the Southern Hemisphere, where they are south (S). The equator runs through Indonesia, central Africa and South America, and towns built on it mark the line: Pontianak on Borneo has an equator monument, and so does Mitad del Mundo outside Quito in Ecuador. Singapore, at 1.3°N, is only about 140 km north of the equator. The North Pole is the middle of the Northern Hemisphere, the South Pole the middle of the Southern.',
          '赤道（0° 纬线）把地球平分为两半：北边是北半球，纬度为北纬（N）；南边是南半球，纬度为南纬（S）。赤道穿过印度尼西亚、非洲中部和南美洲，一些城镇就建在赤道上，并竖立了纪念碑：加里曼丹岛上的坤甸有赤道纪念碑，厄瓜多尔基多城外也有“世界中心”纪念碑。新加坡位于北纬 1.3°，离赤道只有约 140 千米。北极点是北半球的中心，南极点是南半球的中心。'],
      },
      {
        title: ['A land half and a sea half', '陆地多在北半球'], cam: [30, 20, 4.6], wide: true,
        paint: [{ fill: { k: 'continents' }, t: 0.3, a: 0.55 }],
        lines: [par(0, C.gold, 0.2, { w: 1.3 })],
        marks: [mk([47.2, -1.55], 'Centre of the "land hemisphere"', '“陆半球”的中心', { dot: true, c: C.gold, t: 1 }), mk([-49.7, 178.8], 'Centre of the "water hemisphere"', '“水半球”的中心', { dot: true, c: C.blue, t: 1.4 })],
        fig: { k: 'bars', title: ['Share of the surface that is land', '陆地占地表面积的比例'], unit: ['%', '%'], rows: [{ name: ['Northern Hemisphere', '北半球'], v: 39, c: C.teal }, { name: ['Southern Hemisphere', '南半球'], v: 19, c: C.orange }, { name: ['Whole Earth', '全球'], v: 29, c: C.gold }] },
        body: ['The two hemispheres are the same size but not alike. About 39% of the Northern Hemisphere is land, against only 19% of the Southern, so about two-thirds of all land, and close to 90% of the world\'s people, are in the north. The Southern Hemisphere is mostly ocean: near 60°S a ship can sail right round the world without meeting land. Even the half of the Earth centred near Nantes in France, which holds the most land possible, is still about 53% sea, while the opposite half, centred near New Zealand\'s Antipodes Islands, is about 89% water.',
          '南北半球面积相等，却很不一样。北半球约 39% 是陆地，南半球只有 19%，所以全球约三分之二的陆地、近 90% 的人口都在北半球。南半球以海洋为主：沿着南纬 60° 附近，船可以绕地球一圈都碰不到陆地。即使以法国南特附近为中心、包含陆地最多的“陆半球”，海洋仍占约 53%；而它对面以新西兰对跖岛附近为中心的“水半球”，约 89% 是海洋。'],
      },
      {
        title: ['Opposite seasons', '南北半球季节相反'], cam: [5, 135, 3.8], wide: true, night: true, sun: true,
        clock: { mode: 'year', start: T.julChina, rate: 0 }, fig: { k: 'climo', city: 'beijing', b: 'sydney' },
        marks: [
          mk([39.9, 116.4], 'Beijing, July: 26.7 °C', '北京 7 月：26.7 °C', { dot: true, c: C.orange, t: 0.4 }),
          mk([-33.87, 151.21], 'Sydney, July: 13.4 °C', '悉尼 7 月：13.4 °C', { dot: true, c: C.blue, t: 0.8 }),
          mk([21.5, 135], 'Sun overhead near 21°N', '太阳直射北纬 21° 附近', { c: C.gold, t: 1.2 }),
        ],
        body: ['In July the Sun is overhead in the Northern Hemisphere (here around 21°N on 15 July), so the north has long days and high Sun, and the south short days and low Sun. That is why the seasons of the two hemispheres are opposite. In July Beijing is in midsummer, averaging 26.7 °C, while Sydney is in midwinter, averaging 13.4 °C; compare the two climate graphs. Australians celebrate Christmas in summer, often on the beach, and Chinese families in Sydney celebrate the Spring Festival in the summer heat of January or February.',
          '7 月太阳直射北半球（图中 7 月 15 日直射北纬 21° 附近），北半球昼长、太阳高度大，南半球昼短、太阳高度小，所以南北半球的季节正好相反。7 月的北京正值盛夏，月平均气温 26.7 °C；悉尼却是隆冬，月平均气温只有 13.4 °C，比较一下两幅气候图。澳大利亚人在夏天过圣诞节，常常到海滩上庆祝；在悉尼的华人则在炎热的 1、2 月间过春节。'],
      },
      {
        title: ['Eastern and Western', '东西半球'], cam: [25, -20, 4.6], wide: true,
        lines: [mer(-20, C.gold, 0, { w: 1.5 }), mer(160, C.gold, 0.4, { w: 1.5 })],
        paint: [{ fill: { k: 'strip', w: -20, e: 160, c: C.green }, t: 0.8, a: 0.32 }, { fill: { k: 'strip', w: 160, e: -20, c: C.violet }, t: 1.2, a: 0.32 }],
        marks: [
          mk([22, 25], 'Eastern Hemisphere', '东半球', { big: true, c: C.green, t: 1 }), mk([22, -68], 'Western Hemisphere', '西半球', { big: true, c: C.violet, t: 1.3 }), mk([35, -20], '20°W', '西经 20°', { c: C.gold, t: 0.5 }), mk([35, 160], '160°E', '东经 160°', { c: C.gold, t: 0.8 }),
          mk([64.9, -18.6], 'Iceland', '冰岛', { dot: true, t: 1.4 }), mk([56, 160], 'Kamchatka', '堪察加半岛', { dot: true, t: 1.6 }), mk([-9.6, 160.1], 'Solomon Islands', '所罗门群岛', { dot: true, t: 1.8 }),
        ],
        task: ['Turn the globe and follow the gold 20°W and 160°E lines all the way round: which lands do they cross?', '转动地球，沿金色的 20°W 和 160°E 经线绕一圈：它们穿过了哪些陆地？'],
        body: ['To split the Earth into Eastern and Western Hemispheres we need a full meridian circle. The one chosen is made of 20°W and 160°E: everything from 20°W eastward to 160°E is the Eastern Hemisphere (Europe, Africa, Asia and Australia), and the rest is the Western Hemisphere (the Americas). The circle runs mostly over the Atlantic and Pacific Oceans. It does cross a few lands: 20°W cuts through Iceland, east Greenland and Antarctica, and 160°E through Kamchatka and eastern Siberia, the Solomon Islands and Antarctica again, but no major country of Europe or Africa.',
          '划分东西半球需要一个完整的经线圈，人们选的是 20°W 和 160°E 组成的经线圈：从 20°W 向东到 160°E 是东半球，包括欧洲、非洲、亚洲和大洋洲；其余部分是西半球，主要是南北美洲。这个经线圈大部分经过大西洋和太平洋。它也穿过少数陆地：20°W 经过冰岛、格陵兰岛东部和南极洲，160°E 经过俄罗斯的堪察加半岛和西伯利亚东部、所罗门群岛以及南极洲，但没有穿过欧洲和非洲的大陆国家。'],
      },
      {
        title: ['Why not 0° and 180°?', '为什么不用 0° 和 180°？'], cam: [25, 0, 3.4],
        lines: [mer(0, C.red, 0.2, { w: 1.5 }), mer(-20, C.gold, 0.6, { w: 1.2 })],
        paint: [{ fill: { k: 'land', a2: ['GB', 'FR', 'ES', 'DZ', 'ML', 'BF', 'TG', 'GH'], c: C.red }, t: 0.8, a: 0.55 }],
        marks: [
          mk([52.5, -1], 'UK', '英国', { t: 1 }), mk([46.6, 2.4], 'France', '法国', { t: 1.1 }), mk([40.2, -3.5], 'Spain', '西班牙', { t: 1.2 }), mk([28, 2.6], 'Algeria', '阿尔及利亚', { t: 1.3 }),
          mk([17, -2.5], 'Mali', '马里', { t: 1.4 }), mk([7.9, -1.0], 'Ghana', '加纳', { t: 1.5 }), mk([20, -20], '20°W: open sea', '20°W：大洋', { c: C.gold, t: 1.8 }),
        ],
        body: ['The prime meridian would be the obvious border, but look where it runs: through Britain, France, Spain, Algeria, Mali, Burkina Faso, Togo and Ghana (red). Using it would put parts of each of these countries in different hemispheres. Its partner, the 180° meridian, crosses Fiji and Russia\'s Chukotka. Moving the line 20° west, to the Atlantic, keeps Europe and Africa whole in the Eastern Hemisphere, and its partner then moves to 160°E in the Pacific. That is why the dividing circle is 20°W–160°E.',
          '最直接的办法是用本初子午线来分，但看看它经过哪里：英国、法国、西班牙、阿尔及利亚、马里、布基纳法索、多哥和加纳（红色）。如果以它为界，这些国家都会被分在两个半球。与它相对的 180° 经线也穿过斐济和俄罗斯的楚科奇半岛。把界线向西移 20° 到大西洋上，欧洲和非洲就完整地留在了东半球，相对的那一半经线则移到太平洋上的 160°E。这就是东西半球以 20°W 和 160°E 为界的原因。'],
      },
      {
        title: ['Edge cases in the Atlantic', '大西洋两岸的判断'], cam: [45, -15, 3.2], fig: hemiFig,
        lines: [mer(-20, C.gold, 0.2, { w: 1.5 }), mer(0, C.white, 0.5, { w: 0.8 })],
        marks: [
          mk([38.72, -9.14], 'Lisbon 9°W: East', '里斯本 9°W：东半球', { dot: true, c: C.green, t: 0.6 }), mk([14.69, -17.44], 'Dakar 17°W: East', '达喀尔 17°W：东半球', { dot: true, c: C.green, t: 0.9 }),
          mk([64.15, -21.94], 'Reykjavík 22°W: West', '雷克雅未克 22°W：西半球', { dot: true, c: C.violet, t: 1.2 }), mk([51.51, -0.13], 'London 0.1°W: East', '伦敦 0.1°W：东半球', { dot: true, c: C.green, t: 1.5 }),
        ],
        body: ['Because the line is at 20°W, "west longitude" does not always mean "Western Hemisphere". London (0.1°W), Lisbon (9°W) and Dakar in Senegal (17.4°W), the westernmost city of Africa, all have west longitudes, yet they lie east of 20°W and so are in the Eastern Hemisphere. Reykjavík, the capital of Iceland, is at 21.9°W, just beyond the line, so it is in the Western Hemisphere, while the east of Iceland is in the Eastern. The rule: a west longitude below 20° is still in the Eastern Hemisphere.',
          '由于界线在 20°W，西经并不一定就是西半球。伦敦（0.1°W）、里斯本（9°W）和非洲最西端的城市塞内加尔首都达喀尔（17.4°W）都是西经，但都在 20°W 以东，所以属于东半球。冰岛首都雷克雅未克在 21.9°W，刚刚越过界线，属于西半球；而冰岛东部则在东半球。规律是：西经度数小于 20° 的地方仍属于东半球。'],
      },
      {
        title: ['China and the Pacific edge', '我国和太平洋上的判断'], cam: [-5, 150, 4.2], wide: true,
        lines: [mer(160, C.gold, 0.2, { w: 1.5 })],
        paint: [{ fill: { k: 'land', a2: ['CN'], c: C.gold }, t: 0.4, a: 0.45 }],
        marks: [
          mk([35, 103], 'China: North & East', '中国：北半球、东半球', { c: C.gold, t: 0.6 }),
          mk([-33.87, 151.21], 'Sydney 151°E: East', '悉尼 151°E：东半球', { dot: true, c: C.green, t: 1 }),
          mk([-41.29, 174.78], 'Wellington 175°E: West', '惠灵顿 175°E：西半球', { dot: true, c: C.violet, t: 1.3 }),
          mk([-18.14, 178.44], 'Suva 178°E: West', '苏瓦 178°E：西半球', { dot: true, c: C.violet, t: 1.6 }),
        ],
        body: ['China lies between about 4°N and 53.5°N and between 73°E and 135°E, so it is wholly in the Northern and the Eastern Hemispheres. On the far side of the Pacific the opposite surprise happens: east longitudes greater than 160° belong to the Western Hemisphere. Sydney (151°E) is in the Eastern Hemisphere, but Wellington, the capital of New Zealand (174.8°E), and Suva, the capital of Fiji (178.4°E), are in the Western Hemisphere even though their longitudes are east. So New Zealand is in the Southern and Western Hemispheres.',
          '我国大致位于北纬 4° 到 53.5°、东经 73° 到 135° 之间，所以全部在北半球和东半球。在太平洋的另一边，情况正好相反：东经度数大于 160° 的地方属于西半球。悉尼（151°E）在东半球，而新西兰首都惠灵顿（174.8°E）和斐济首都苏瓦（178.4°E）虽然是东经，却位于西半球。所以新西兰位于南半球和西半球。'],
      },
    ],
    quiz: [
      { q: ['Which line divides the Earth into the Northern and Southern Hemispheres?', '南北半球的分界线是'], options: [['The equator', '赤道'], ['The prime meridian', '本初子午线'], ['The Tropic of Cancer', '北回归线'], ['The 20°W–160°E circle', '20°W 和 160°E 组成的经线圈']], answer: 0,
        why: ['The equator (0° latitude) is the line between north and south latitudes.', '赤道（0° 纬线）是北纬和南纬的分界线，也是南北半球的分界线。'] },
      { q: ['Why is the Eastern–Western Hemisphere border at 20°W and 160°E rather than 0° and 180°?', '东西半球为什么以 20°W 和 160°E 为界，而不用 0° 和 180°？'],
        options: [['So that Europe and Africa are not split between two hemispheres', '为了不把欧洲、非洲的国家分在两个半球'], ['Because Greenwich is at 20°W', '因为格林尼治在 20°W'], ['Because 20°W is where the date changes', '因为 20°W 是日期变更的地方'], ['So that both halves have the same amount of land', '为了让两个半球陆地一样多']], answer: 0,
        why: ['The 0° meridian runs through eight countries in Europe and Africa; 20°W lies in the Atlantic and keeps them whole.', '0° 经线穿过欧洲和非洲的 8 个国家；20°W 位于大西洋上，可以让它们完整地留在东半球。'] },
      { q: ['Match each city with its hemispheres.', '把城市和它所在的半球连起来。'],
        match: [[['Beijing', '北京'], ['Northern and Eastern', '北半球、东半球']], [['Sydney', '悉尼'], ['Southern and Eastern', '南半球、东半球']], [['New York', '纽约'], ['Northern and Western', '北半球、西半球']], [['Buenos Aires', '布宜诺斯艾利斯'], ['Southern and Western', '南半球、西半球']]],
        why: ['Beijing 40°N 116°E; Sydney 34°S 151°E; New York 41°N 74°W; Buenos Aires 35°S 58°W.', '北京 40°N，116°E；悉尼 34°S，151°E；纽约 41°N，74°W；布宜诺斯艾利斯 35°S，58°W。'] },
      { q: ['Which of these cities are in the Western Hemisphere? Choose all.', '下列城市中，哪些位于西半球？（多选）'],
        options: [['Reykjavík (21.9°W)', '雷克雅未克（21.9°W）'], ['Wellington (174.8°E)', '惠灵顿（174.8°E）'], ['London (0.1°W)', '伦敦（0.1°W）'], ['Dakar (17.4°W)', '达喀尔（17.4°W）'], ['New York (74°W)', '纽约（74°W）']],
        multi: [0, 1, 4],
        why: ['The Western Hemisphere runs west from 20°W to 160°E. Reykjavík and New York are west of 20°W, and Wellington is east of 160°E. London and Dakar are west longitudes under 20°, so they are in the Eastern Hemisphere.', '西半球是 20°W 向西到 160°E 的范围。雷克雅未克和纽约在 20°W 以西，惠灵顿在 160°E 以东，都属于西半球；伦敦和达喀尔虽然是西经，但小于 20°，属于东半球。'] },
      { q: ['Mark where the Eastern–Western Hemisphere border crosses the equator.', '在地球上标出东西半球分界线与赤道的两个交点。'],
        place: [{ text: ['Where 20°W crosses the equator', '20°W 与赤道的交点'], at: [0, -20], tolKm: 700 }, { text: ['Where 160°E crosses the equator', '160°E 与赤道的交点'], at: [0, 160], tolKm: 700 }],
        why: ['20°W meets the equator in the Atlantic west of Africa; 160°E meets it in the Pacific northeast of New Guinea.', '20°W 与赤道相交在非洲西面的大西洋上；160°E 与赤道相交在新几内亚岛东北的太平洋上。'] },
      { q: ['In July, what season is it in Buenos Aires (35°S)?', '7 月，布宜诺斯艾利斯（35°S）是什么季节？'], options: [['Summer', '夏季'], ['Winter', '冬季'], ['Spring', '春季'], ['Autumn', '秋季']], answer: 1,
        why: ['Buenos Aires is in the Southern Hemisphere, whose seasons are opposite to ours: July is midwinter there.', '布宜诺斯艾利斯在南半球，季节与北半球相反，7 月正是冬季。'] },
      { q: ['Use the chart: about how many times larger is the Northern Hemisphere\'s share of land than the Southern\'s?', '读图：北半球的陆地比例约是南半球的几倍？'],
        fig: { k: 'bars', title: ['Share of the surface that is land', '陆地占地表面积的比例'], unit: ['%', '%'], rows: [{ name: ['Northern Hemisphere', '北半球'], v: 39, c: C.teal }, { name: ['Southern Hemisphere', '南半球'], v: 19, c: C.orange }, { name: ['Whole Earth', '全球'], v: 29, c: C.gold }] },
        num: { answer: 2, tol: 0.3, unit: ['times', '倍'] },
        why: ['39% ÷ 19% ≈ 2: the north has about twice the share of land, and two-thirds of all land.', '39% ÷ 19% ≈ 2，北半球的陆地比例约是南半球的 2 倍，集中了全球约三分之二的陆地。'] },
      { q: ['Tap Wellington, a capital in the Southern and Western Hemispheres.', '在地球上点出新西兰首都惠灵顿，它位于南半球和西半球。'], at: [-41.29, 174.78], tolKm: 500,
        why: ['Wellington is at 41.3°S, 174.8°E, at the south of New Zealand\'s North Island: east of 160°E, so in the Western Hemisphere.', '惠灵顿位于 41.3°S、174.8°E，在新西兰北岛南端；它在 160°E 以东，所以属于西半球。'] },
    ],
  },
  // ============================================================================================== rotation
  {
    id: 'rotation', strand: 'maps', tracks: ['uk', 'us', 'ib'], grade: 'g7a', unit, icon: 'reset', minutes: 9,
    title: ['The Earth\'s rotation', '地球的自转'],
    blurb: ['West to east, once a day: day and night, and why clocks differ around the world.', '自西向东，一天一圈：昼夜交替和时间差异。'],
    keys: [
      ['The Earth spins on its axis from west to east: anticlockwise seen from above the North Pole, clockwise from above the South Pole.', '地球绕地轴自西向东自转：从北极上空看呈逆时针方向，从南极上空看呈顺时针方向。'],
      ['One turn relative to the Sun takes 24 hours (a solar day); relative to the stars, 23 h 56 min.', '自转一周相对太阳约 24 小时（太阳日），相对恒星为 23 小时 56 分。'],
      ['Rotation makes day and night alternate, makes the Sun rise in the east and set in the west, and makes local time differ by longitude.', '地球自转产生昼夜交替、太阳东升西落，并使不同经度的地方时不同。'],
      ['15° of longitude = 1 hour, 1° = 4 minutes; places further east see the Sun earlier; Beijing Time is the local time of 120°E.', '经度每隔 15° 地方时相差 1 小时，1° 相差 4 分钟；东边的地方先看到日出；北京时间是东经 120° 的地方时。'],
      ['Every place turns 15° an hour, but the speed of the ground falls from 1,670 km/h at the equator to 0 at the poles.', '各地自转的角速度都是每小时 15°，但线速度从赤道的 1670 千米/时向两极递减到 0。'],
    ],
    steps: [
      {
        title: ['West to east', '自西向东转'], cam: [20, 0, 3.6], follow: 55, night: true,
        clock: { mode: 'day', start: T.dawnBeijing, rate: 2.4 },
        lines: arrows([[[0, -150], [0, -115]], [[0, -60], [0, -25]], [[0, 30], [0, 65]], [[0, 120], [0, 155]], [[35, -100], [35, -70]], [[35, 80], [35, 110]]], C.gold),
        body: ['The Earth spins around its axis from west to east. Here the Sun stays still and you watch the ground turn beneath it: the gold arrows ride along. Measured against the stars, one turn takes 23 h 56 min 4 s; measured against the Sun it takes 24 hours, because the Earth also moves along its orbit and must turn about 1° more each day to face the Sun again. We do not feel the spin because everything, air included, turns with us, but we see it every day: the Sun, Moon and stars all appear to cross the sky from east to west.',
          '地球绕着地轴自西向东旋转。这里让太阳保持不动，你看到的是地面在它下面转动，金色箭头也跟着地面一起走。以恒星为参照，地球自转一周需要 23 小时 56 分 4 秒；以太阳为参照则是 24 小时，因为地球同时还在公转，每天要多转约 1° 才能重新对着太阳。我们感觉不到地球在转，因为地面、空气和我们都在一起转动；但每天都能看到它的效果：太阳、月亮和星星都从东方升起、向西方落下。'],
      },
      {
        title: ['Seen from above the poles', '从两极上空看'], cam: [88, 0, 3.6], night: true, fig: polarFig,
        clock: { mode: 'day', start: T.dawnBeijing, rate: 2.4 },
        lines: [20, 110, -160, -70].map((lo, i) => ({ pts: [[62, lo], [62, lo + 40]] as [number, number][], c: C.gold, t: 0.3 + i * 0.25, rhumb: true, flow: true, arrow: true, w: 1.6, dur: 1.2 })),
        marks: [mk([89.9, 0], 'North Pole', '北极', { dot: true, t: 0.2 })],
        task: ['Watch from above the North Pole: which way does the Earth turn? Then drag the globe to the South Pole and compare.', '从北极上空俯视：地球是顺时针还是逆时针转？再把地球拖到南极上空比一比。'],
        body: ['Look straight down on the North Pole and the Earth turns anticlockwise; from above the South Pole the same west-to-east spin looks clockwise, as when you look at a spinning wheel from its two sides. A short rhyme helps: "north anticlockwise, south clockwise". On a polar view, east is the direction of the turn, so the longitudes increase eastward along the arrows. Watch the edge of the night sweep round: whatever faces the Sun is day.',
          '从北极正上方俯视，地球按逆时针方向旋转；从南极上空看，同样的自西向东转动却是顺时针的，就像从车轮的两侧看它转动方向相反。可以记住“北逆南顺”。在极地俯视图上，自转的方向就是东方，所以沿箭头方向东经度数逐渐增大。看昼夜的边界线扫过地面：朝向太阳的一面就是白天。'],
      },
      {
        title: ['Day and night take turns', '昼夜交替'], cam: [62, -150, 4], wide: true, night: true, sun: true, items: ['templeofheaven', 'liberty'],
        clock: { mode: 'day', start: T.dawnBeijing, rate: 2 },
        marks: [mk([39.9, 116.4], 'Beijing', '北京', { dot: true, c: C.gold }), mk([40.7, -74], 'New York', '纽约', { dot: true, c: C.teal })],
        task: ['Watch Beijing and New York as the Earth turns: when Beijing crosses into daylight, where is New York?', '看着地球转动时的北京和纽约：北京进入白天时，纽约在哪里？'],
        body: ['The Earth makes no light of its own and is not transparent, so the Sun lights only the half facing it: that half is day, the other night. The circle between them is the terminator: the dawn line, where places are turning into the light, and the dusk line, where they are turning out of it. Rotation carries every place across both lines once a day, so day and night take turns. Beijing and New York are about 190° of longitude apart, nearly opposite, so as Beijing crosses the dawn line New York is crossing the dusk line. A 24-hour cycle keeps days from getting too hot and nights too cold; on the Moon, where a day lasts about 29.5 Earth days, the ground swings from about 120 °C to −170 °C.',
          '地球本身不发光也不透明，所以太阳只能照亮朝向它的一半：被照亮的半球是白天，另一半是黑夜。昼半球和夜半球的分界线叫晨昏线，其中由夜进入昼的是晨线，由昼进入夜的是昏线。地球自转使每个地方每天都经过一次晨线和昏线，于是昼夜交替。北京和纽约经度相差约 190°，几乎在地球的两侧，所以北京经过晨线时，纽约正经过昏线。24 小时的昼夜交替周期使白天不会太热、夜晚不会太冷；在月球上，一个昼夜长约 29.5 个地球日，地面温度在约 120 °C 和 −170 °C 之间剧烈变化。'],
      },
      {
        title: ['The Sun crosses the sky', '太阳东升西落'],
        astro: {
          kit: 'gnomon', mode: 'day', lat: 40, day: 80, clock: { from: 5.5, to: 18.5, rate: 0.9, unit: 'hour', fmt: ['Time', '时刻'], hold: true },
          tasks: [
            { text: ['Stop the clock at local noon, when the shadow is shortest and points due north.', '把时间停在当地正午：这时影子最短，指向正北。'], done: (_p, v) => Math.abs(v - 12) <= 0.25 },
            { text: ['Run on to late afternoon (after 17:00): which way does the shadow point now?', '继续到傍晚（17 点以后）：影子现在指向哪里？'], done: (_p, v) => v >= 17 },
          ],
        },
        task: ['Drag the time slider and watch the rod\'s shadow swing from west, through north, to east.', '拖动时间，看木杆的影子怎样从西边经过北边转到东边。'],
        body: ['Because the ground turns eastward, the Sun appears to move the other way: it rises in the east, climbs to its highest point at local noon, and sets in the west. This model stands a 1 m rod at 40°N, Beijing\'s latitude, on the March equinox. The Sun rises due east at 6:00 local time, so the first shadow points west; at noon the Sun stands due south, 50° above the horizon, and the shadow is shortest (0.84 m) and points due north; at 18:00 it sets due west. The shadow turns clockwise all day: the oldest clock there is.',
          '地面自西向东转，太阳看起来就向相反方向移动：从东方升起，正午升到最高，然后向西方落下。这个模型在北纬 40°（北京的纬度）立一根 1 米高的木杆，日期是春分。地方时 6 点太阳从正东升起，影子指向正西；正午太阳在正南方，高度 50°，影子最短（0.84 米），指向正北；18 点太阳在正西落下。一天中影子按顺时针方向转动，这就是最古老的“钟”：日晷。'],
      },
      {
        title: ['Fifteen degrees an hour', '每小时 15°'], cam: [30, 105, 3.8], wide: true, night: true, sun: true, fig: localFig,
        clock: { mode: 'day', start: T.marchNoonChina, rate: 1 },
        lines: [mer(120, C.gold, 0, { w: 1.3 }), mer(75, C.teal, 0.3), mer(90, C.teal, 0.4), mer(105, C.teal, 0.5), mer(135, C.teal, 0.6)],
        marks: [mk([47, 120], '120°E: Beijing Time', '东经 120°：北京时间', { c: C.gold, t: 0.4 }), mk([39.9, 116.4], 'Beijing 116.4°E', '北京 116.4°E', { dot: true, t: 0.8 })],
        body: ['The Earth turns 360° in 24 hours, which is 15° of longitude every hour, or 1° every 4 minutes. Local time is set by the Sun: it is 12:00 local time when the Sun is highest. Places to the east turn into the sunlight first, so their local time is always ahead: when it is noon at 120°E, it is 13:00 at 135°E and only 9:00 at 75°E. Beijing Time is the local time of the 120°E meridian, not of Beijing itself: Beijing is at 116.4°E, so its own Sun reaches its highest about 14 minutes after 12:00 Beijing Time.',
          '地球 24 小时自转 360°，即每小时转过经度 15°，每 4 分钟转过 1°。地方时由太阳决定：太阳升到最高时是当地正午 12 点。东边的地方先转到阳光下，地方时总是比西边早：东经 120° 正午 12 点时，东经 135° 已是 13 点，东经 75° 才 9 点。北京时间是东经 120° 的地方时，而不是北京本地的时间：北京在东经 116.4°，按北京时间算，那里的太阳要在 12 点过后约 14 分钟才升到最高。'],
      },
      {
        title: ['One clock for all of China', '全国统一的北京时间'], cam: [40, 104, 4], wide: true, night: true, sun: true,
        clock: { mode: 'day', start: Date.UTC(2025, 5, 20, 18, 30), rate: 1.2, span: 10 },
        lines: [mer(120, C.gold, 0.2, { w: 1.2 })],
        marks: [
          mk([39.47, 75.99], 'Kashgar 76°E: Sun highest ≈ 14:56', '喀什 76°E：约 14:56 太阳最高', { dot: true, c: C.orange, t: 0.5 }),
          mk([48.36, 134.29], 'Fuyuan 134°E: Sun highest ≈ 11:03', '抚远 134°E：约 11:03 太阳最高', { dot: true, c: C.teal, t: 0.9 }),
          mk([30, 120], 'Beijing Time = 120°E', '北京时间 = 120°E', { c: C.gold, t: 1.3 }),
        ],
        task: ['Watch dawn on 21 June: the light reaches Fuyuan around 3:00 Beijing Time, and Kashgar more than four hours later.', '看 6 月 21 日的黎明：北京时间 3 点左右阳光就照到抚远，而喀什要晚 4 个多小时。'],
        body: ['China spans over 60° of longitude, more than 4 hours of local time, yet the whole country uses Beijing Time. Kashgar in Xinjiang (76°E) is 44° west of 120°E, so its Sun is highest 44 × 4 = 176 minutes after 12:00, at about 14:56 Beijing Time; in June the Sun does not set there until after 10 p.m. Fuyuan in Heilongjiang (134.3°E), "the first place in China to see the Sun", is 14° east, so its noon comes 57 minutes early, around 11:03, and in June the sky lightens before 3 a.m. That is why many people in Xinjiang also use a local "Xinjiang Time", two hours behind Beijing Time, for daily life.',
          '我国东西跨经度 60° 多，地方时相差 4 个多小时，但全国统一使用北京时间。新疆喀什（76°E）比东经 120° 偏西 44°，所以当地太阳最高时比 12 点晚 44 × 4 = 176 分钟，约为北京时间 14:56；6 月那里要到晚上 10 点以后才日落。黑龙江抚远（134.3°E）号称“华夏东极”，比东经 120° 偏东 14°，正午提前约 57 分钟，约在 11:03；6 月凌晨不到 3 点天就亮了。所以新疆许多人在日常生活中也使用比北京时间晚 2 小时的“新疆时间”。'],
      },
      {
        title: ['Same turn, different speeds', '角速度相同，线速度不同'], cam: [30, 106, 3.4], items: ['sp_wenchang', 'sp_jiuquan'],
        lines: [
          ...arrows([[[17.4, 111], [17.4, 117]], [[38.7, 100.3], [38.7, 105.5]]], C.gold, 0.6, 1.8),
          { pts: [[0, 95], [0, 125]], c: C.gold, t: 0.2, rhumb: true, dur: 1.2, w: 1.1 },
        ],
        marks: [
          mk([19.61, 110.95], 'Wenchang 19.6°N ≈ 1,574 km/h', '文昌 19.6°N 约 1574 千米/时', { dot: true, c: C.gold, t: 0.4 }),
          mk([40.96, 100.29], 'Jiuquan 41°N ≈ 1,261 km/h', '酒泉 41°N 约 1261 千米/时', { dot: true, c: C.teal, t: 0.8 }),
          mk([1.5, 110], 'Equator 1,670 km/h', '赤道 1670 千米/时', { c: C.gold, t: 1.2 }),
        ],
        fig: { k: 'line', title: ['Speed of the ground due to rotation', '地球自转的线速度'], unit: ['km/h', '千米/时'], x: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90], min: 0, max: 1800,
          series: [{ name: ['Linear speed by latitude (°)', '不同纬度（°）的线速度'], c: C.gold, y: SPEEDS }], notes: [{ x: 19.6, text: ['Wenchang', '文昌'] }, { x: 41, text: ['Jiuquan', '酒泉'] }] },
        body: ['Every place on Earth (except the poles) turns through the same angle, 15° an hour: the angular speed is the same. But places near the equator travel round a much bigger circle in the same 24 hours, so the ground moves faster: about 1,670 km/h at the equator, 1,446 km/h at 30°, 835 km/h at 60°, and zero at the poles, falling with the cosine of latitude. Rockets launched eastward get this speed for free. That is one reason China built the Wenchang launch site on Hainan (19.6°N, about 1,574 km/h) for its heaviest rockets, while Jiuquan in Gansu (41°N) moves at only about 1,261 km/h.',
          '地球上除两极外，各地每小时都转过 15°，即角速度相同。但在同样的 24 小时里，赤道附近的地方要绕一个大得多的圆圈，所以运动得更快，即线速度更大：赤道约 1670 千米/时，30° 约 1446 千米/时，60° 约 835 千米/时，到两极为 0，与纬度的余弦成正比。向东发射的火箭可以“借用”这个速度。这正是我国在海南建设文昌航天发射场（北纬 19.6°，约 1574 千米/时）发射最重型火箭的原因之一；而甘肃酒泉（北纬 41°）的线速度只有约 1261 千米/时。'],
      },
      {
        title: ['A pendulum that proves the spin', '傅科摆：证明地球在自转'], cam: [62, 60, 4.4], wide: true,
        marks: [
          mk([48.846, 2.346], 'Panthéon, Paris 1851: 11.3°/h', '巴黎先贤祠 1851 年：每小时 11.3°', { dot: true, c: C.gold, t: 0.4 }),
          mk([39.936, 116.336], 'Beijing Planetarium: 9.6°/h', '北京天文馆：每小时 9.6°', { dot: true, c: C.teal, t: 0.8 }),
          mk([89.9, 0], 'At the pole: one turn a day', '极点：一天转一圈', { dot: true, c: C.white, t: 1.2 }),
        ],
        lines: [par(0, C.violet, 1.5, { w: 1 })],
        body: ['In 1851 Léon Foucault hung a 28 kg ball on a 67 m wire from the dome of the Panthéon in Paris and set it swinging. A pendulum keeps swinging in the same plane, yet over the hours the line of its swing slowly turned clockwise, about 11.3° an hour, all the way round in about 32 hours: it was the floor, and the Earth, turning underneath. The rate is 15° × sin(latitude) per hour: at a pole the swing would turn once a day, at the equator not at all. The Foucault pendulum in the Beijing Planetarium (39.9°N) turns about 9.6° an hour, a full circle in about 37 hours.',
          '1851 年，傅科在巴黎先贤祠的穹顶下用 67 米长的钢丝挂上一个 28 千克的摆锤，让它来回摆动。摆总是在同一个平面里摆动，可是几个小时后，人们看到摆动的方向在慢慢按顺时针方向偏转，每小时约 11.3°，约 32 小时转一整圈：转动的其实是地面，也就是地球。偏转的速度是每小时 15° × sin（纬度）：在极点每天正好转一圈，在赤道则完全不偏转。北京天文馆（北纬 39.9°）的傅科摆每小时偏转约 9.6°，约 37 小时转一圈。'],
      },
    ],
    quiz: [
      { q: ['Which way does the Earth spin?', '地球自转的方向是'], options: [['West to east', '自西向东'], ['East to west', '自东向西'], ['North to south', '自北向南'], ['It does not spin', '不旋转']], answer: 0,
        why: ['The Earth turns from west to east, which is why the Sun and stars appear to move from east to west.', '地球自西向东自转，所以太阳和星星看起来都是东升西落。'] },
      { q: ['Which of these are caused by the Earth\'s rotation? Choose all.', '下列现象中，哪些是由地球自转产生的？（多选）'],
        options: [['Day and night take turns', '昼夜交替'], ['The Sun rises in the east and sets in the west', '太阳东升西落'], ['Local time differs with longitude', '不同经度的地方时不同'], ['The four seasons', '四季变化'], ['There are a day side and a night side at all', '地球上有昼半球和夜半球']],
        multi: [0, 1, 2],
        why: ['Rotation makes day and night alternate, the Sun cross the sky and local times differ. Seasons come from the Earth\'s orbit round the Sun with a tilted axis. A lit half and a dark half exist because the Earth is an opaque ball; rotation only makes them take turns.', '地球自转产生昼夜交替、太阳东升西落和地方时差异。四季变化是地球斜着身子公转造成的。有昼半球和夜半球，是因为地球是不发光、不透明的球体；自转只是让昼夜交替出现。'] },
      { q: ['Put these cities in the order in which the Sun reaches its highest point each day, first to last.', '按每天太阳升到最高的先后顺序排列这些城市。'],
        order: [['Tokyo (139.7°E)', '东京（139.7°E）'], ['Shanghai (121.5°E)', '上海（121.5°E）'], ['Chengdu (104.1°E)', '成都（104.1°E）'], ['Lhasa (91.1°E)', '拉萨（91.1°E）']],
        why: ['The Earth turns west to east, so the further east a place is, the earlier its noon: Tokyo, Shanghai, Chengdu, then Lhasa.', '地球自西向东自转，越往东的地方正午越早：东京、上海、成都，最后是拉萨。'] },
      { q: ['Kashgar is at 76°E. Its Sun is highest how many minutes after 12:00 Beijing Time (the local time of 120°E)?', '喀什位于东经 76°。按北京时间（东经 120° 的地方时），喀什的太阳在 12 点之后多少分钟升到最高？'],
        num: { answer: 176, tol: 6, unit: ['minutes', '分钟'] },
        why: ['120° − 76° = 44°, and each degree is 4 minutes: 44 × 4 = 176 minutes, so about 14:56 Beijing Time.', '120° − 76° = 44°，经度每差 1° 地方时差 4 分钟：44 × 4 = 176 分钟，即北京时间约 14:56。'] },
      { q: ['Match each latitude with the speed of the ground there.', '把纬度和该处的自转线速度连起来。'],
        match: [[['Equator', '赤道'], ['≈ 1,670 km/h', '约 1670 千米/时']], [['30°', '纬度 30°'], ['≈ 1,450 km/h', '约 1450 千米/时']], [['60°', '纬度 60°'], ['≈ 835 km/h', '约 835 千米/时']], [['The poles', '两极'], ['0 km/h', '0 千米/时']]],
        why: ['The speed is 1,670 km/h × cos(latitude): cos 30° ≈ 0.87, cos 60° = 0.5, cos 90° = 0.', '线速度 = 1670 千米/时 × cos（纬度）：cos30° ≈ 0.87，cos60° = 0.5，cos90° = 0。'] },
      { q: ['Seen from above the North Pole, the Earth turns anticlockwise and the Sun is to the right. Which point is just reaching dawn?', '从北极上空俯视，地球逆时针转动，太阳在右边。哪个点正迎来日出？'], fig: dawnFig,
        options: [['A', 'A 点'], ['B', 'B 点'], ['Both', '两点都是'], ['Neither', '都不是']], answer: 0,
        why: ['Turning anticlockwise, A (bottom) is carried from the night side into the light: it is on the dawn line. B is being carried into the dark: it is on the dusk line.', '地球逆时针转动，A 点（下方）正由夜半球转入昼半球，位于晨线上；B 点正由昼半球转入夜半球，位于昏线上。'] },
      { q: ['Tap the eastern tip of China, where the summer sunrise comes earliest in the whole country.', '在地球上点出我国的最东端，也就是夏季全国最早看到日出的地方。'], at: [48.4, 135.08], tolKm: 450,
        why: ['China\'s eastern tip is where the Heilongjiang meets the Wusuli, near Fuyuan, at about 135°E: the most easterly land turns into the sunlight first, around 3:00 Beijing Time in June. (In midwinter its long nights let places further south, such as eastern Taiwan, see the Sun a little earlier.)', '我国最东端在黑龙江与乌苏里江主航道汇合处，抚远附近，约东经 135°。越往东越早转到阳光下，6 月约北京时间 3 点就日出。（隆冬时那里夜长，台湾东部等偏南的地方反而稍早日出。）'] },
      { q: ['Seen from above the South Pole, the Earth turns…', '从南极上空看，地球自转的方向是'], options: [['Clockwise', '顺时针'], ['Anticlockwise', '逆时针'], ['It changes with the season', '随季节变化'], ['It cannot be seen', '看不出方向']], answer: 0,
        why: ['West-to-east spin looks anticlockwise from above the North Pole and clockwise from above the South Pole: "north anticlockwise, south clockwise".', '自西向东的自转，从北极上空看是逆时针，从南极上空看是顺时针，即“北逆南顺”。'] },
    ],
  },
];
