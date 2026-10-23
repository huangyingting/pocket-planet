/** 八上 · 中国的河流（长江、黄河）; 八下 · 四大地理区域、东北三省、黄土高原、三江源与青藏地区 (deeper lessons). */
import { C, T, arrows, mk, type Fig, type LL, type Lesson, type Pair } from './kit.ts';
import { svg, tx, arrowDef, type Lx, fade, dot } from './figs.ts';
import { RIVERS } from './geo.ts';
import {
  QT_EDGE, NW_LINE, NS_LINE, QT_POLY, NW_POLY, NORTH_POLY, SOUTH_POLY, YANGTZE, YZ, YZ_TRIBS, DONGTING, POYANG, JINGJIANG, YZ_BELT,
  YELLOW, YR, YR_TRIBS, NINGXIA_PLAIN, HETAO_PLAIN, LOESS_PLATEAU, DUST_SOURCES, NE_MOUNTAINS, NE_RIVERS, NE_PLAINS, NE_THREE,
  QT_RIVERS, SANJIANGYUAN_AREA, QT_RAIL,
} from './geo-cn.ts';

const nature = ['China\'s natural environment', '中国的自然环境'] as const;
const regions = ['Regions of China', '中国的地理差异与区域'] as const;
const CN = ['CN', 'TW'];
const REGION_C = { north: C.gold, south: C.green, nw: C.orange, qt: C.violet };
const DIM = '#868e96';

// ------------------------------------------------------------------------------------------------ figure helpers

const pts = (p: [number, number][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const hline = (x1: number, x2: number, y: number, c = 'fg-grid') => `<line x1="${x1}" x2="${x2}" y1="${y}" y2="${y}" class="${c}"/>`;
const vline = (x: number, y1: number, y2: number, c = 'fg-note') => `<line x1="${x}" x2="${x}" y1="${y1}" y2="${y2}" class="${c}"/>`;
/** Rough rendered width of a string: Latin and CJK characters differ. */
const textW = (s: string, latin: number, cjk: number) => [...s].reduce((w, ch) => w + (/[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? cjk : latin), 0);
/** Two lines of caption under a panel. */
const cap = (L: Lx, x: number, y: number, a: Pair, b: Pair, anchor: 's' | 'm' | 'e' = 'm') => tx(x, y, L(a), 'fg-label', anchor) + tx(x, y + 10, L(b), 'fg-sub', anchor);

/** West–east profile of China at about 30–33°N: the plateau edge drops through the 3,000 m contour. */
const profileFig: Fig = {
  k: 'svg', draw: L => {
    const X = (lon: number) => 34 + ((lon - 78) / (123 - 78)) * 280, Y = (e: number) => 138 - (e / 6000) * 98;
    const prof: [number, number][] = [[78, 4300], [80, 4700], [83, 5000], [86, 4700], [89, 5100], [92, 4800], [95, 4600], [97, 4300], [99, 4200],
      [100.5, 3900], [101.5, 3500], [102.3, 3000], [102.8, 2200], [103.4, 1000], [104, 500], [105.5, 400], [107, 500], [108.2, 1300], [109.5, 1600],
      [110.6, 900], [111.3, 150], [113, 40], [116, 30], [119, 15], [121.5, 4], [122, 0]];
    const xy = prof.map(([l, e]) => [X(l), Y(e)] as [number, number]);
    let o = tx(4, 12, L(['A west–east profile across China (about 30–33°N)', '我国地势剖面示意（约北纬 30°—33°）']), 'fg-title');
    o += tx(4, 23, L(['heights much exaggerated', '垂直比例尺放大']), 'fg-sub');
    for (const e of [0, 2000, 4000, 6000]) o += hline(34, 314, Y(e)) + tx(31, Y(e) + 3, String(e), 'fg-tick', 'e');
    o += tx(31, Y(6000) - 5, 'm', 'fg-tick', 'e');
    o += `<polygon points="${pts([[X(78), Y(0)], ...xy, [X(122), Y(0)]])}" class="fg-landfill"/>`;
    o += `<polyline points="${pts(xy)}" class="fg-profile f-draw" pathLength="1"/>`;
    o += `<rect x="${X(122)}" y="${Y(0) - 1.5}" width="${X(123) - X(122)}" height="4" class="fg-sea"/>`;
    o += fade(0.8, hline(34, 314, Y(3000), 'fg-guide') + tx(314, Y(3000) - 3, L(['3,000 m', '3000 米']), 'fg-tick', 'e'));
    o += fade(1.2, vline(X(102.3), Y(6000), Y(0)) + tx(X(90), Y(5600), L(['Qinghai–Tibet region', '青藏地区']), 'fg-label', 'm')
      + tx(X(113), Y(5600), L(['Southern region', '南方地区']), 'fg-label', 'm'));
    o += fade(1.6, tx(X(89), Y(3500), L(['plateau, over 4,000 m', '高原，海拔 4000 米以上']), 'fg-tick', 'm')
      + `<line x1="${X(105.5)}" x2="${X(105.5)}" y1="${Y(2300) + 3}" y2="${Y(500)}" class="fg-guide"/>` + tx(X(103.9), Y(2300), L(['Sichuan Basin', '四川盆地']), 'fg-tick')
      + tx(X(111.2), Y(1500), L(['Wushan', '巫山']), 'fg-tick')
      + tx(X(122), Y(30) - 6, L(['Yangtze plains', '长江中下游平原']), 'fg-tick', 'e'));
    for (const l of [80, 90, 100, 110, 120]) o += tx(X(l), 150, `${l}°E`, 'fg-tick', 'm');
    return svg(320, 156, o, L(['Elevation profile of China from Tibet to the East China Sea', '从青藏高原到东海的地势剖面']));
  },
};

/** North and south of the Qinling–Huaihe line, compared. */
const nsTable: Fig = {
  k: 'svg', draw: L => {
    const rows: [Pair, Pair, Pair][] = [
      [['Farmland', '耕地'], ['Dry fields', '旱地'], ['Paddy fields', '水田']],
      [['Main crops', '主要作物'], ['Wheat, maize', '小麦、玉米'], ['Rice', '水稻']],
      [['Harvests', '熟制'], ['1 a year to 3 in 2 years', '一年一熟至两年三熟'], ['2–3 a year', '一年两熟至三熟']],
      [['Rivers', '河流'], ['Short flood season, ice', '汛期短，冬季结冰'], ['Long flood season, no ice', '汛期长，水量大，不结冰']],
      [['Transport', '传统交通'], ['Horses and carts', '北马：陆路车马'], ['Boats', '南船：河湖水运']],
      [['Staple food', '饮食'], ['Noodles, steamed buns', '面食'], ['Rice', '米饭']],
      [['Houses', '民居'], ['Thick walls, gentle roofs', '墙厚，屋顶坡度小'], ['Thin walls, steep roofs', '墙薄，屋顶坡度大']],
    ];
    const y0 = 30, rh = 17, cx = [4, 82, 202];
    let o = tx(4, 12, L(['North and south of the Qinling–Huaihe line', '秦岭—淮河两侧的差异']), 'fg-title');
    o += `<rect x="${cx[1] - 2}" y="${y0 - 11}" width="118" height="${rh * rows.length + 15}" rx="3" fill="${REGION_C.north}" opacity=".13"/>`;
    o += `<rect x="${cx[2] - 2}" y="${y0 - 11}" width="116" height="${rh * rows.length + 15}" rx="3" fill="${REGION_C.south}" opacity=".13"/>`;
    o += tx(cx[1] + 2, y0, L(['Northern region', '北方地区']), 'fg-label') + tx(cx[2] + 2, y0, L(['Southern region', '南方地区']), 'fg-label');
    rows.forEach(([h, n, s], i) => {
      const y = y0 + (i + 1) * rh;
      o += hline(4, 316, y - 11);
      o += fade(0.15 * i, tx(cx[0], y, L(h), 'fg-label') + tx(cx[1] + 2, y, L(n), 'fg-sub') + tx(cx[2] + 2, y, L(s), 'fg-sub'));
    });
    return svg(320, y0 + rh * rows.length + 8, o, L(['Table comparing the northern and southern regions', '北方地区与南方地区对比表']));
  },
};

/** Traditional houses of the four regions. */
const housesFig: Fig = {
  k: 'svg', draw: L => {
    const g = 108;
    const panels: { name: Pair; c: string; a: Pair; b: Pair; draw: (x: number) => string }[] = [
      { name: ['North', '北方'], c: REGION_C.north, a: ['Courtyard house', '四合院'], b: ['thick walls', '墙厚、屋顶坡缓'],
        draw: x => `<rect x="${x + 12}" y="${g - 24}" width="56" height="24" class="fg-rock"/><polygon points="${pts([[x + 8, g - 24], [x + 40, g - 34], [x + 72, g - 24]])}" fill="#8f5f3a"/>`
          + `<rect x="${x + 34}" y="${g - 14}" width="12" height="14" fill="#5c3b22"/><rect x="${x + 18}" y="${g - 18}" width="8" height="6" fill="${C.gold}" opacity=".7"/><rect x="${x + 54}" y="${g - 18}" width="8" height="6" fill="${C.gold}" opacity=".7"/>` },
      { name: ['South', '南方'], c: REGION_C.south, a: ['Stilt house', '吊脚楼'], b: ['steep roof for rain', '屋顶陡，利于排水'],
        draw: x => `<rect x="${x + 4}" y="${g - 5}" width="72" height="5" class="fg-water" opacity=".6"/>`
          + [20, 34, 46, 60].map(s => `<line x1="${x + s}" x2="${x + s}" y1="${g - 18}" y2="${g}" stroke="#8f5f3a" stroke-width="2"/>`).join('')
          + `<rect x="${x + 16}" y="${g - 38}" width="48" height="20" fill="#a47148"/><polygon points="${pts([[x + 10, g - 38], [x + 40, g - 64], [x + 70, g - 38]])}" fill="#495057"/>`
          + `<rect x="${x + 26}" y="${g - 32}" width="10" height="8" fill="${C.gold}" opacity=".7"/><rect x="${x + 44}" y="${g - 32}" width="10" height="8" fill="${C.gold}" opacity=".7"/>` },
      { name: ['Northwest', '西北'], c: REGION_C.nw, a: ['Yurt, flat roof', '蒙古包、平顶房'], b: ['easy to move; dry', '便于迁徙；降水少'],
        draw: x => `<path d="M${x + 12} ${g} L${x + 12} ${g - 18} Q${x + 34} ${g - 44} ${x + 56} ${g - 18} L${x + 56} ${g} Z" fill="#e9ecef" opacity=".9"/>`
          + `<rect x="${x + 29}" y="${g - 13}" width="10" height="13" fill="#c92a2a"/><line x1="${x + 12}" x2="${x + 56}" y1="${g - 18}" y2="${g - 18}" stroke="#c92a2a" stroke-width="1.5"/>`
          + `<rect x="${x + 58}" y="${g - 14}" width="18" height="14" class="fg-landfill" stroke="#d9a066"/>` },
      { name: ['Qinghai–Tibet', '青藏'], c: REGION_C.qt, a: ['Stone house', '碉房'], b: ['thick stone walls', '石墙厚、窗小，防寒'],
        draw: x => `<polygon points="${pts([[x + 14, g], [x + 18, g - 38], [x + 62, g - 38], [x + 66, g]])}" fill="#ced4da"/><rect x="${x + 16}" y="${g - 42}" width="48" height="5" fill="#862e2e"/>`
          + [[26, 28], [48, 28], [26, 14], [48, 14]].map(([dx, dy]) => `<rect x="${x + dx}" y="${g - dy}" width="6" height="8" fill="#212529"/>`).join('')
          + `<path d="M${x + 18} ${g - 46} L${x + 40} ${g - 54} L${x + 62} ${g - 46}" fill="none" stroke="${C.gold}" stroke-width="1" stroke-dasharray="2 2"/>` },
    ];
    let o = tx(4, 12, L(['Houses fit the climate', '民居与自然环境']), 'fg-title');
    o += `<line x1="0" x2="320" y1="${g}" y2="${g}" stroke="#868e96" stroke-width="1"/>`;
    panels.forEach((p, i) => {
      const x = i * 80;
      o += fade(0.25 * i, tx(x + 40, 34, L(p.name), 'fg-label', 'm') + `<rect x="${x + 20}" y="37" width="40" height="2" fill="${p.c}"/>` + p.draw(x) + cap(L, x + 40, g + 14, p.a, p.b));
    });
    return svg(320, g + 30, o, L(['Traditional houses of the four regions', '四大地理区域的传统民居']));
  },
};

/** The Yangtze's long profile: almost all of the drop is in the upper course. */
const yzProfile: Fig = {
  k: 'svg', draw: (L, id) => {
    const X = (km: number) => 30 + (km / 6300) * 278, Y = (e: number) => 136 - (e / 5500) * 96;
    const prof: [number, number][] = [[0, 5400], [60, 5000], [350, 4500], [1200, 3500], [1800, 2600], [2300, 1820], [2600, 1000], [3000, 600],
      [3464, 270], [3840, 160], [4440, 40], [4900, 20], [5375, 14], [6300, 0]];
    const xy = prof.map(([k, e]) => [X(k), Y(e)] as [number, number]);
    let o = arrowDef(`${id}a`, C.gold) + tx(4, 12, L(['The Yangtze from source to sea', '长江干流纵剖面示意']), 'fg-title');
    o += tx(4, 23, L(['height above sea level along the river (approx.)', '沿干流的海拔（近似）']), 'fg-sub');
    for (const e of [0, 2000, 4000]) o += hline(30, 310, Y(e)) + tx(27, Y(e) + 3, String(e), 'fg-tick', 'e');
    o += tx(27, Y(5500) - 6, 'm', 'fg-tick', 'e');
    o += `<polygon points="${pts([[X(0), Y(0)], ...xy, [X(6300), Y(0)]])}" class="fg-landfill"/>`;
    o += `<polyline points="${pts(xy)}" fill="none" stroke="${C.blue}" stroke-width="2.2" class="f-draw" pathLength="1"/>`;
    o += fade(0.9, vline(X(4440), 30, Y(0)) + vline(X(5375), 30, Y(0))
      + tx(X(2220), 38, L(['Upper course ≈4,500 km', '上游约 4500 千米']), 'fg-label', 'm')
      + tx(X(4908), 38, L(['Mid', '中游']), 'fg-tick', 'm') + tx(X(5838), 38, L(['Lower', '下游']), 'fg-tick', 'm'));
    const city = (km: number, e: number, p: Pair, d: number, a: 's' | 'm' | 'e' = 'm') => fade(d, dot(X(km), Y(e), C.white, 2) + tx(X(km), 148, L(p), 'fg-tick', a));
    o += city(3464, 270, ['Yibin', '宜宾'], 1.2) + city(4440, 40, ['Yichang', '宜昌'], 1.4) + city(5375, 14, ['Hukou', '湖口'], 1.6, 'e') + city(6300, 0, ['Shanghai', '上海'], 1.8, 'e');
    o += fade(1.0, dot(X(0), Y(5400), C.ice, 2.4) + tx(X(0) + 5, Y(5400) + 7, L(['Geladandong', '各拉丹冬']), 'fg-tick'));
    o += fade(1.1, dot(X(2300), Y(1820), C.white, 2) + tx(X(2300) + 5, Y(1820) - 3, L(['Shigu bend', '石鼓']), 'fg-tick'));
    o += fade(2.0, `<path d="M${X(2500)} ${Y(3500)} L${X(1950)} ${Y(2750)}" class="fg-arrow" marker-end="url(#${id}a)"/>`
      + tx(X(2500) + 3, Y(3500) - 2, L(['steep: hydropower', '落差大：水能丰富']), 'fg-label'));
    const gw = L(['gentle: shipping', '平缓：航运便利']);
    o += fade(2.3, `<rect x="${X(5150) - textW(gw, 4.7, 8.6) / 2 - 3}" y="${Y(1300) - 9}" width="${textW(gw, 4.7, 8.6) + 6}" height="12" rx="2" fill="#08111c"/>` + tx(X(5150), Y(1300), gw, 'fg-label', 'm'));
    return svg(320, 154, o, L(['Long profile of the Yangtze', '长江纵剖面']));
  },
};

/** Cutting off a meander on the Jingjiang. */
const cutoffFig: Fig = {
  k: 'svg', draw: L => {
    const loop = (x: number, a: number, b: number) => `M${x + a} 80 C${x + 14} 62 ${x + 12} 30 ${x + 52} 30 C${x + 92} 30 ${x + 90} 62 ${x + b} 80`;
    let o = tx(4, 12, L(['Cutting off a meander', '裁弯取直示意']), 'fg-title');
    o += tx(4, 23, L(['the lower Jingjiang, "nine bends and eighteen loops"', '下荆江“九曲回肠”']), 'fg-sub');
    const caps: [Pair, Pair][] = [[['Winding channel', '河道弯曲'], ['floods drain slowly', '洪水下泄不畅']], [['Cut the neck', '人工裁弯'], ['shorter, steeper path', '河道缩短，水流加快']],
      [['Straighter channel', '河道取直'], ['old bend: oxbow lake', '旧河道成牛轭湖']]];
    [0, 1, 2].forEach(i => {
      const x = 4 + i * 106;
      let p = '';
      if (i === 0) p = `<path d="M${x} 80 L${x + 36} 80" class="fg-meander"/><path d="${loop(x, 36, 68)} L${x + 102} 80" class="fg-meander"/>`;
      if (i === 1) p = `<path d="M${x} 80 L${x + 44} 80" class="fg-meander"/><path d="${loop(x, 44, 60)} L${x + 102} 80" class="fg-meander" opacity=".55"/>`
        + `<line x1="${x + 42}" x2="${x + 62}" y1="80" y2="80" stroke="${C.gold}" stroke-width="2.4" stroke-dasharray="3 2"/>`;
      if (i === 2) p = `<path d="M${x} 80 L${x + 102} 80" class="fg-meander"/><path d="M${x + 44} 73 C${x + 14} 58 ${x + 12} 30 ${x + 52} 30 C${x + 92} 30 ${x + 90} 58 ${x + 60} 73" fill="none" stroke="${C.blue}" stroke-width="4" opacity=".55" stroke-linecap="round"/>`;
      o += fade(0.4 + i * 0.5, `<rect x="${x}" y="28" width="102" height="62" rx="4" fill="rgba(140,109,70,.25)"/>` + p + cap(L, x + 51, 102, caps[i][0], caps[i][1]));
    });
    o += fade(2, tx(160, 132, L(['1967–1972 cut-offs shortened the river by about 80 km', '1967—1972 年裁弯使河道缩短约 80 千米']), 'fg-sub', 'm'));
    return svg(320, 138, o, L(['Three stages of cutting off a meander', '裁弯取直的三个阶段']));
  },
};

/** The lower Yellow River: a river above the land. */
const raisedBedFig: Fig = {
  k: 'svg', draw: (L, id) => {
    const g = 124, bed = 104;
    let o = arrowDef(`${id}a`, C.white) + tx(4, 12, L(['A "river above the ground"', '“地上河”剖面示意']), 'fg-title');
    o += tx(4, 23, L(['usually 3–5 m above the plain; about 10 m at Kaifeng', '一般高出两岸地面 3～5 米，开封段达 10 米']), 'fg-sub');
    o += tx(4, 33, L(['it is a watershed: rivers flow away from it', '成为海河流域与淮河流域的分水岭']), 'fg-sub');
    o += `<rect x="0" y="${g}" width="320" height="26" class="fg-land"/>`;
    o += `<rect x="146" y="${bed}" width="108" height="${g - bed}" class="fg-landfill"/>` + [110, 116, 121].map(y => hline(150, 250, y, 'fg-guide')).join('');
    o += fade(0.4, `<polygon points="${pts([[150, 80], [250, 80], [242, bed], [158, bed]])}" class="fg-water" opacity=".75"/>`);
    o += `<polygon points="${pts([[110, g], [132, 62], [144, 62], [158, bed], [158, g]])}" class="fg-rock"/>`;
    o += `<polygon points="${pts([[290, g], [268, 62], [256, 62], [242, bed], [242, g]])}" class="fg-rock"/>`;
    const house = (x: number) => `<rect x="${x}" y="${g - 10}" width="14" height="10" fill="#e9ecef"/><polygon points="${pts([[x - 2, g - 10], [x + 7, g - 17], [x + 16, g - 10]])}" fill="#c92a2a"/>`;
    o += house(30) + house(62) + house(298) + `<circle cx="90" cy="${g - 6}" r="5" class="fg-tree"/>`;
    o += fade(0.9, tx(138, 56, L(['Levee', '大堤']), 'fg-label', 'm') + tx(262, 56, L(['Levee', '大堤']), 'fg-label', 'm') + tx(200, 95, L(['river', '河水']), 'fg-label', 'm'));
    o += fade(1.2, tx(200, 117, L(['silt raises the bed', '泥沙淤积，河床抬高']), 'fg-tick', 'm'));
    o += fade(1.6, `<line x1="12" x2="158" y1="${bed}" y2="${bed}" class="fg-guide"/><line x1="104" x2="104" y1="${bed + 1}" y2="${g - 1}" stroke="${C.white}" stroke-width="1.2" marker-start="url(#${id}a)" marker-end="url(#${id}a)"/>`
      + tx(4, bed - 4, L(['bed 3–5 m higher', '河床高出地面 3～5 米']), 'fg-label'));
    o += tx(60, g + 16, L(['North China Plain', '华北平原']), 'fg-tick', 'm');
    return svg(320, 150, o, L(['Cross-section of the lower Yellow River', '黄河下游河道剖面']));
  },
};

/** Ice-jam floods where the river flows from low to high latitude. */
const iceJamFig: Fig = {
  k: 'svg', draw: (L, id) => {
    let o = arrowDef(`${id}a`, C.white) + tx(4, 12, L(['Why ice-jam floods happen', '凌汛的形成']), 'fg-title');
    o += tx(4, 23, L(['a reach flowing from lower to higher latitude, late winter–early spring', '自低纬流向高纬的河段，冬末春初']), 'fg-sub');
    o += `<rect x="16" y="70" width="160" height="20" class="fg-water" opacity=".7"/>`;
    o += `<line x1="24" x2="168" y1="80" y2="80" class="fg-flowline f-flow"/>`;
    o += `<rect x="196" y="70" width="110" height="20" class="fg-ice"/>` + [216, 240, 262, 286].map(x => `<line x1="${x}" x2="${x + 6}" y1="70" y2="90" stroke="#74c0fc" stroke-width=".8"/>`).join('');
    o += fade(0.6, [[172, 62, 12, 30, -14], [182, 56, 14, 36, 10], [194, 64, 12, 26, -6], [186, 74, 10, 18, 24]].map(([x, y, w, h, r]) =>
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="fg-ice" stroke="#a5d8ff" transform="rotate(${r} ${x + w / 2} ${y + h / 2})"/>`).join(''));
    o += fade(1.0, `<polygon points="${pts([[144, 70], [172, 54], [172, 70]])}" class="fg-water" opacity=".55"/>` + tx(150, 46, L(['water backs up and spills over', '水位上涨，漫溢成灾']), 'fg-label', 'm'));
    o += fade(0.3, tx(18, 64, L(['upstream: lower latitude, thawed', '上游：纬度低，先解冻']), 'fg-sub') + tx(306, 64, L(['downstream: still frozen', '下游：纬度高，仍封冻']), 'fg-sub', 'e'));
    o += fade(1.3, tx(186, 104, L(['ice dam', '冰坝']), 'fg-label', 'm'));
    o += `<line x1="20" x2="300" y1="120" y2="120" stroke="${C.white}" stroke-width="1.2" marker-end="url(#${id}a)"/>`;
    o += tx(160, 133, L(['flow direction · latitude rising', '河水流向 · 纬度升高']), 'fg-sub', 'm');
    return svg(320, 138, o, L(['Ice-jam flood diagram', '凌汛示意图']));
  },
};

/** Black soil then and now. */
const soilFig: Fig = {
  k: 'svg', draw: L => {
    const top = 40, base = 132;
    const col = (x: number, black: number, head: Pair, val: string, d: number) => fade(d,
      `<rect x="${x}" y="${top}" width="40" height="${base - top}" fill="#9c7a54"/><rect x="${x}" y="${top}" width="40" height="${black}" fill="#2b2420" stroke="rgba(255,255,255,.35)" stroke-width=".6"/>`
      + tx(x + 20, top - 5, L(head), 'fg-label', 'm') + tx(x + 44, top + black / 2 + 3, val, 'fg-label'));
    let o = tx(4, 12, L(['The black soil is getting thinner', '黑土层变薄了']), 'fg-title');
    o += tx(4, 23, L(['typical thickness of the black topsoil (1 px ≈ 1 cm)', '黑土层的一般厚度（示意）']), 'fg-sub');
    o += col(16, 65, ['First farmed', '开垦初期'], '60–70 cm', 0.2) + col(108, 25, ['Today, in places', '现在部分地区'], '20–30 cm', 0.7);
    o += tx(16, base + 10, L(['brown: subsoil', '下层为黄土状母质']), 'fg-tick');
    const lines: [Pair, string][] = [
      [['Why so fertile?', '为什么肥沃？'], 'fg-label'], [['long cold winters:', '冬季漫长寒冷，'], 'fg-sub'], [['dead plants rot slowly,', '枯枝落叶分解缓慢，'], 'fg-sub'], [['so humus builds up', '腐殖质积累多'], 'fg-sub'],
      [['Why thinner?', '为什么变薄？'], 'fg-label'], [['wind and water erosion,', '风蚀、水蚀，'], 'fg-sub'], [['farming without care', '重用轻养'], 'fg-sub'],
      [['Protect it:', '保护措施：'], 'fg-label'], [['straw cover, no-till', '秸秆还田、少耕免耕'], 'fg-sub'],
    ];
    let y = 44;
    lines.forEach(([p, c], i) => { if (c === 'fg-label' && i) y += 5; o += fade(1 + i * 0.12, tx(206, y, L(p), c)); y += 10.5; });
    return svg(320, 146, o, L(['Black soil thickness then and now', '黑土层厚度变化']));
  },
};

/** Wind sorting: coarse grains drop first, fine silt travels on to the Loess Plateau. */
const grainFig: Fig = {
  k: 'svg', draw: (L, id) => {
    let o = arrowDef(`${id}a`, '#e9ecef') + tx(4, 12, L(['How the wind sorted the dust', '风力沉积：颗粒由粗到细']), 'fg-title');
    o += tx(4, 23, L(['the wind theory of the loess (sketch)', '黄土“风成说”示意']), 'fg-sub');
    o += fade(0.2, tx(10, 40, L(['northwest winds, winter and spring', '冬春季西北风']), 'fg-label'));
    for (const [y, x0, x1, d] of [[50, 10, 140, 0.3], [60, 60, 220, 0.5], [70, 120, 300, 0.7]]) o += fade(d, `<path d="M${x0} ${y} L${x1} ${y + 8}" class="fg-wind" marker-end="url(#${id}a)"/>`);
    o += `<rect x="6" y="96" width="308" height="14" class="fg-landfill"/>`;
    let g = '', s = '', l = '';
    for (let i = 0; i < 9; i++) g += `<circle cx="${14 + i * 11}" cy="${100 + (i % 2) * 5}" r="3.4" fill="#adb5bd"/>`;
    for (let i = 0; i < 24; i++) s += `<circle cx="${112 + i * 4.1}" cy="${99 + (i % 3) * 4}" r="1.7" fill="#f0c674"/>`;
    for (let i = 0; i < 60; i++) l += `<circle cx="${212 + (i % 30) * 3.3}" cy="${100 + Math.floor(i / 30) * 4 + (i % 2) * 2}" r=".9" fill="#d9a066"/>`;
    o += fade(0.9, g) + fade(1.2, s) + fade(1.5, l);
    o += fade(1.8, [230, 250, 270, 290].map((x, i) => dot(x, 80 + (i % 2) * 6, '#d9a066', 1)).join(''));
    o += tx(10, 90, L(['NW', '西北']), 'fg-tick') + tx(310, 90, L(['SE', '东南']), 'fg-tick', 'e');
    o += cap(L, 56, 122, ['Gobi', '戈壁'], ['gravel', '砾石']) + cap(L, 160, 122, ['Desert', '沙漠'], ['sand', '沙粒']) + cap(L, 262, 122, ['Loess Plateau', '黄土高原'], ['silt', '粉砂（黄土）']);
    return svg(320, 140, o, L(['Grain size gets finer from the northwest to the southeast', '颗粒自西北向东南由粗变细']));
  },
};

/** Yuan, liang and mao. */
const formsFig: Fig = {
  k: 'svg', draw: L => {
    const b = 104;
    const shapes: { a: Pair; c: Pair; prof: (x: number) => string; top: (x: number) => string }[] = [
      { a: ['Yuan: tableland', '塬：顶面平坦宽阔'], c: ['steep, gullied edges', '四周被沟谷切割'],
        prof: x => `<polygon points="${pts([[x + 2, b], [x + 10, 62], [x + 26, 60], [x + 31, 70], [x + 36, 60], [x + 92, 59], [x + 100, b]])}" class="fg-landfill" stroke="#e0b37a" stroke-width="1.6"/>`,
        top: x => `<rect x="${x + 70}" y="30" width="30" height="16" rx="3" fill="#d9a066" opacity=".8"/><path d="M${x + 78} 30 l2 6 M${x + 92} 46 l-2 -6 M${x + 100} 38 l-6 1" stroke="#1b2733" stroke-width="1.4"/>` },
      { a: ['Liang: long ridge', '梁：长条状高地'], c: ['long, rounded top', '顶部浑圆，延伸较长'],
        prof: x => `<path d="M${x + 2} ${b} Q${x + 16} 66 ${x + 50} 63 Q${x + 84} 66 ${x + 100} ${b} Z" class="fg-landfill" stroke="#e0b37a" stroke-width="1.6"/>`,
        top: x => `<ellipse cx="${x + 85}" cy="38" rx="15" ry="4" fill="#d9a066" opacity=".8"/>` },
      { a: ['Mao: round hills', '峁：圆顶小丘'], c: ['steep on all sides', '四周坡度较陡'],
        prof: x => `<path d="M${x + 2} ${b} Q${x + 12} 66 ${x + 26} 64 Q${x + 42} 66 ${x + 50} ${b - 14} Q${x + 58} 64 ${x + 76} 64 Q${x + 92} 66 ${x + 100} ${b} Z" class="fg-landfill" stroke="#e0b37a" stroke-width="1.6"/>`,
        top: x => `<circle cx="${x + 78}" cy="38" r="5.5" fill="#d9a066" opacity=".8"/><circle cx="${x + 94}" cy="38" r="5.5" fill="#d9a066" opacity=".8"/>` },
    ];
    let o = tx(4, 12, L(['Landforms of the Loess Plateau', '黄土高原的地貌']), 'fg-title');
    o += tx(4, 23, L(['side view; small shapes at top right: seen from above', '侧视图；右上角小图为俯视']), 'fg-sub');
    shapes.forEach((s, i) => {
      const x = 4 + i * 106;
      o += fade(0.4 * i, `<line x1="${x}" x2="${x + 102}" y1="${b}" y2="${b}" stroke="#868e96"/>` + s.prof(x) + s.top(x) + cap(L, x + 51, b + 14, s.a, s.c));
    });
    o += fade(1.4, tx(160, 142, L(['gullies keep cutting back: yuan → liang → mao, broken ground', '沟谷不断侵蚀：塬 → 梁 → 峁，地表越来越破碎']), 'fg-sub', 'm'));
    return svg(320, 148, o, L(['Yuan, liang and mao landforms', '塬、梁、峁示意图']));
  },
};

/** Treating a small loess catchment. */
const treatFig: Fig = {
  k: 'svg', draw: L => {
    const prof: [number, number][] = [[0, 40], [40, 40], [100, 73]];
    for (let x = 100; x < 180; x += 16) { const y = 73 + (x - 100) * 0.55, y2 = 73 + (x + 16 - 100) * 0.55; prof.push([x + 16, y], [x + 16, y2]); }
    prof.push([200, 130], [262, 130], [320, 64]);
    let o = tx(4, 12, L(['Treating a gully', '小流域综合治理示意']), 'fg-title');
    o += `<polygon points="${pts([...prof, [320, 150], [0, 150]])}" class="fg-landfill"/>`;
    o += `<polyline points="${pts(prof)}" class="fg-profile"/>`;
    const trees = [[12, 40], [28, 40], [52, 46.6], [68, 55.4], [84, 64.2], [292, 93], [306, 80]];
    o += fade(0.4, trees.map(([x, y]) => `<circle cx="${x}" cy="${y - 6}" r="4" class="fg-tree"/>`).join(''));
    o += fade(0.6, tx(42, 30, L(['steep slopes: back to forest and grass', '陡坡：退耕还林还草']), 'fg-label'));
    o += fade(1.0, `<polygon points="${pts([[185, 120], [238, 120], [238, 130], [200, 130]])}" fill="#c9a36b"/><polygon points="${pts([[236, 130], [240, 112], [248, 112], [254, 130]])}" class="fg-rock"/>`);
    o += fade(1.2, [104, 120, 136, 152, 168].map(x => `<line x1="${x + 2}" x2="${x + 14}" y1="${73 + (x + 16 - 100) * 0.55 - 2}" y2="${73 + (x + 16 - 100) * 0.55 - 2}" stroke="${C.lime}" stroke-width="1.5"/>`).join('')
      + tx(150, 70, L(['gentle slopes: terraces', '缓坡：修梯田']), 'fg-label'));
    o += fade(1.6, tx(222, 143, L(['check dam traps silt → flat new fields', '淤地坝拦泥淤地 → 形成坝地']), 'fg-sub', 'm'));
    return svg(320, 150, o, L(['Forest on steep slopes, terraces on gentle slopes, check dams in the gully', '坡上林草、坡面梯田、沟里淤地坝']));
  },
};

/** Cave dwellings. */
const yaodongFig: Fig = {
  k: 'svg', draw: L => {
    let o = tx(4, 12, L(['Cave dwellings (yaodong)', '窑洞']), 'fg-title');
    o += `<rect x="10" y="22" width="300" height="94" class="fg-landfill"/><rect x="0" y="116" width="320" height="12" class="fg-land"/>`;
    o += [18, 24, 30].map(y => hline(10, 310, y + 0.5, 'fg-guide')).join('');
    for (const x of [44, 140, 236]) {
      o += `<path d="M${x} 116 L${x} 92 A20 20 0 0 1 ${x + 40} 92 L${x + 40} 116 Z" fill="#3b2a1a"/>`;
      o += `<path d="M${x + 4} 116 L${x + 4} 93 A16 16 0 0 1 ${x + 36} 93 L${x + 36} 116" fill="none" stroke="#e9ecef" stroke-width=".6" opacity=".6"/>`;
      o += `<rect x="${x + 14}" y="98" width="12" height="18" fill="#8f5f3a"/><rect x="${x + 6}" y="86" width="28" height="7" fill="${C.gold}" opacity=".35"/>`;
    }
    o += fade(0.4, tx(160, 44, L(['thick, firm loess stands upright and is easy to dig', '黄土层深厚、直立性好，便于挖掘']), 'fg-label', 'm'));
    o += fade(0.9, tx(160, 58, L(['thick earth walls: warm in winter, cool in summer', '土层厚，保温隔热：冬暖夏凉']), 'fg-sub', 'm'));
    return svg(320, 132, o, L(['Cave dwellings dug into a loess cliff', '在黄土崖上开挖的窑洞']));
  },
};

/** Herds move with the seasons. */
const pastureFig: Fig = {
  k: 'svg', draw: (L, id) => {
    const Y = (x: number) => 124 - ((x - 6) * 84) / 290;
    let o = arrowDef(`${id}a`, C.gold) + tx(4, 12, L(['Moving the herds with the seasons', '季节转场']), 'fg-title');
    o += `<polygon points="${pts([[0, 124], [6, 124], [296, 40], [306, 32], [320, 46], [320, 140], [0, 140]])}" class="fg-landfill"/>`;
    o += `<polyline points="${pts([[0, 124], [6, 124], [296, 40], [306, 32], [320, 46]])}" class="fg-profile"/>`;
    o += `<polygon points="${pts([[284, 43.5], [306, 32], [318, 44], [300, 40]])}" fill="#f1f3f5"/>`;
    o += `<polyline points="${pts([[30, Y(30)], [120, Y(120)]])}" stroke="${C.lime}" stroke-width="4" opacity=".7"/><polyline points="${pts([[200, Y(200)], [270, Y(270)]])}" stroke="${C.green}" stroke-width="4" opacity=".8"/>`;
    o += `<rect x="60" y="${Y(60) - 12}" width="14" height="10" fill="#e9ecef"/><polygon points="${pts([[226, Y(226) - 2], [234, Y(226) - 14], [242, Y(226) - 2]])}" fill="#343a40" stroke="#e9ecef" stroke-width=".6"/>`;
    o += [[90, 0], [100, 2], [250, 0], [260, 1]].map(([x, d]) => `<ellipse cx="${x}" cy="${Y(x) - 5 - d}" rx="4.5" ry="2.6" fill="#212529"/>`).join('');
    o += fade(0.5, cap(L, 8, 70, ['Winter pasture', '冬季草场'], ['low, sheltered, sunny', '海拔低、背风向阳'], 's'));
    o += fade(0.9, cap(L, 150, 34, ['Summer pasture', '夏季草场'], ['high, cool, fresh grass', '海拔高、凉爽、牧草鲜嫩'], 's'));
    o += fade(1.3, `<path d="M130 ${Y(130) - 12} L196 ${Y(196) - 12}" class="fg-arrow" marker-end="url(#${id}a)" marker-start="url(#${id}a)"/>`);
    o += fade(1.5, tx(170, 112, L(['up in early summer, down in autumn', '初夏上山，秋季下山']), 'fg-label', 'm'));
    return svg(320, 140, o, L(['Seasonal pastures on a mountain slope', '山坡上的季节牧场']));
  },
};

/** Keeping the permafrost frozen under the Qinghai–Tibet Railway. */
const railFig: Fig = {
  k: 'svg', draw: (L, id) => {
    const g = 100;
    let o = arrowDef(`${id}a`, C.ice) + tx(4, 12, L(['Keeping the permafrost frozen', '青藏铁路：保护多年冻土']), 'fg-title');
    o += `<rect x="0" y="${g}" width="320" height="12" fill="#8d6e4a" opacity=".7"/><rect x="0" y="${g + 12}" width="320" height="38" fill="rgba(165,216,255,.3)"/>`;
    o += tx(8, g + 32, L(['permafrost', '多年冻土']), 'fg-label') + tx(8, g - 4, L(['active layer', '活动层：夏融冬冻']), 'fg-tick');
    o += `<polygon points="${pts([[90, g], [130, 52], [190, 52], [230, g]])}" class="fg-rock" opacity=".8"/>`;
    let r = '';
    for (let y = 58; y < g; y += 8) for (let x = 100; x < 222; x += 9) { const inset = ((g - y) / 48) * 40; if (x > 90 + inset + 2 && x < 230 - inset - 2) r += `<circle cx="${x + ((y / 8) % 2) * 4}" cy="${y}" r="3" fill="none" stroke="#5c3b22" stroke-width=".8"/>`; }
    o += r;
    o += `<rect x="128" y="48" width="64" height="4" fill="#495057"/>` + [136, 184].map(x => `<rect x="${x}" y="44" width="2.5" height="4" fill="#ced4da"/>`).join('');
    for (const x of [112, 208]) o += fade(0.6, `<line x1="${x}" x2="${x}" y1="38" y2="${g + 40}" stroke="#ced4da" stroke-width="2.2"/>` + [40, 44, 48].map(y => hline(x - 5, x + 5, y, '')).join('').replace(/class=""/g, `stroke="#ced4da" stroke-width="1.2"`) + tx(x, 33, L(['heat pipe', '热棒']), 'fg-tick', 'm'));
    o += fade(1.0, [70, 84].map(y => `<path d="M138 ${y} L182 ${y}" class="fg-wind" stroke-width="1.2" marker-end="url(#${id}a)"/>`).join(''));
    o += fade(1.2, `<line x1="74" x2="124" y1="72" y2="80" class="fg-guide"/>` + tx(8, 74, L(['crushed-rock bed', '片石通风路基']), 'fg-tick'));
    const notes: Pair[] = [['heat pipes carry', '热棒：冬季把地下'], ['ground heat out', '热量导出，使冻土'], ['in winter', '保持冻结'], ['rock bed: cold air', '片石路基：冷空气'], ['flows between stones', '在石缝间流动降温']];
    notes.forEach((p, i) => { o += fade(1.4 + i * 0.1, tx(236, 46 + i * 10 + (i > 2 ? 6 : 0), L(p), 'fg-sub')); });
    return svg(320, 150, o, L(['Cross-section of a railway embankment on permafrost', '多年冻土区铁路路基剖面']));
  },
};

// ------------------------------------------------------------------------------------------------ lessons

const fourRegions = (a = 0.42, t = 0) => [
  { fill: { k: 'poly' as const, pts: NORTH_POLY, c: REGION_C.north, clip: CN }, a, t },
  { fill: { k: 'poly' as const, pts: SOUTH_POLY, c: REGION_C.south, clip: CN }, a, t: t + 0.5 },
  { fill: { k: 'poly' as const, pts: NW_POLY, c: REGION_C.nw, clip: CN }, a, t: t + 1 },
  { fill: { k: 'poly' as const, pts: QT_POLY, c: REGION_C.qt, clip: CN }, a, t: t + 1.5 },
];
const regionKey: Fig = { k: 'key', set: 'custom', title: ['Share of China (approx.): land · people', '约占全国：面积 · 人口'], items: [
  { c: REGION_C.north, name: ['Northern region: 20% · 40%', '北方地区：20% · 40%'] }, { c: REGION_C.south, name: ['Southern region: 25% · 55%', '南方地区：25% · 55%'] },
  { c: REGION_C.nw, name: ['Northwest region: 30% · 4%', '西北地区：30% · 4%'] }, { c: REGION_C.qt, name: ['Qinghai–Tibet region: 25% · under 1%', '青藏地区：25% · 不足 1%'] }] };

export const CHINA_C: Lesson[] = [
  {
    id: 'china-regions', strand: 'china', tracks: [], grade: 'g8b', unit: regions, icon: 'grid', minutes: 9,
    title: ['The four geographical regions', '中国的四大地理区域'],
    blurb: ['Three dividing lines split China into the north, the south, the northwest and Qinghai–Tibet.', '三条分界线把我国分为北方、南方、西北和青藏四大地理区域。'],
    keys: [
      ['The Qinling–Huaihe line divides north from south: about the January 0 ℃ isotherm and the 800 mm isohyet.', '秦岭—淮河一线是北方与南方的分界线，大致与 1 月 0 ℃ 等温线、800 毫米年等降水量线一致。'],
      ['The north and the northwest are divided roughly along the 400 mm isohyet.', '北方地区与西北地区大致以 400 毫米年等降水量线为界。'],
      ['The Qinghai–Tibet region\'s edge is roughly the 3,000 m contour.', '青藏地区与其他地区大致以 3000 米等高线为界。'],
      ['Key features: north, dry farmland; south, paddy fields; northwest, dryness; Qinghai–Tibet, high and cold.', '主要特征：北方旱地农业，南方水田农业，西北干旱，青藏高寒。'],
    ],
    steps: [
      {
        title: ['Four regions', '四大地理区域'], cam: [35, 104, 3.2], sketch: true, paint: fourRegions(),
        marks: [mk([38.5, 115], 'Northern region', '北方地区', { big: true, c: REGION_C.north, t: 0.3 }), mk([27, 112], 'Southern region', '南方地区', { big: true, c: REGION_C.south, t: 0.8 }),
          mk([42.5, 92], 'Northwest region', '西北地区', { big: true, c: REGION_C.nw, t: 1.3 }), mk([32.5, 87], 'Qinghai–Tibet region', '青藏地区', { big: true, c: REGION_C.qt, t: 1.8 })],
        fig: regionKey,
        task: ['Compare the key with the map: which region is big but has very few people?', '对照图例看地图：哪个区域面积大、人口却很少？'],
        body: ['China is so big that places differ a lot. Geographers group them by location and natural features into four regions. The north and south lie in the monsoon east, where most people live; the northwest and Qinghai–Tibet are huge but thinly peopled. The boundaries are wide transition zones, not sharp lines.',
          '我国幅员辽阔，各地差异很大。根据地理位置、自然地理和人文地理特点，可以把全国划分为北方地区、南方地区、西北地区和青藏地区四大地理区域。北方和南方位于东部季风区，人口稠密；西北和青藏面积广大，人口稀少。区域之间的分界线其实是一个过渡带，并不是截然分开的一条线。'],
      },
      {
        title: ['The Qinling–Huaihe line', '秦岭—淮河一线'], cam: [33.5, 112, 1.9], sketch: true,
        paint: [{ fill: { k: 'poly', pts: NORTH_POLY, c: REGION_C.north, clip: CN }, a: 0.22 }, { fill: { k: 'poly', pts: SOUTH_POLY, c: REGION_C.south, clip: CN }, a: 0.22 }],
        lines: [{ pts: NS_LINE, c: C.white, w: 2.6, dur: 2.4, t: 0.3 }],
        marks: [mk([33.9, 108.3], 'Qinling', '秦岭', { c: C.white, t: 1 }), mk([32.6, 116.5], 'Huaihe', '淮河', { c: C.white, t: 1.6 }),
          mk([36.2, 112.5], 'Jan below 0 ℃ · under 800 mm · warm temperate · semi-humid', '1 月均温 < 0 ℃ · 年降水 < 800 毫米 · 暖温带 · 半湿润', { c: REGION_C.north, t: 2.3 }),
          mk([30.8, 112.5], 'Jan above 0 ℃ · over 800 mm · subtropical · humid', '1 月均温 > 0 ℃ · 年降水 > 800 毫米 · 亚热带 · 湿润', { c: REGION_C.south, t: 2.8 })],
        fig: { k: 'climo', city: 'beijing', b: 'shanghai' },
        task: ['Look at January on both graphs: which city is below 0 ℃, and which has more rain?', '看两幅图的 1 月：哪个城市气温低于 0 ℃？哪个城市降水更多？'],
        body: ['The Qinling Mountains and the Huaihe River make China\'s most important geographical line. It is close to the January 0 ℃ isotherm and the 800 mm isohyet, and it divides warm temperate from subtropical, and semi-humid from humid land. North of it, rivers freeze in winter; south of it they do not. The Qinling also blocks cold winter air from the north.',
          '秦岭—淮河一线是我国一条重要的地理分界线：它大致与 1 月 0 ℃ 等温线、800 毫米年等降水量线相吻合，也是暖温带与亚热带、半湿润区与湿润区的分界线。线以北，河流冬季结冰；线以南，河流不结冰。秦岭还能阻挡冬季北方冷空气南下。'],
      },
      {
        title: ['The 400 mm line', '400 毫米年等降水量线'], cam: [42, 110, 2.6], sketch: true,
        paint: [{ fill: { k: 'poly', pts: NW_POLY, c: REGION_C.nw, clip: CN }, a: 0.3 }, { fill: { k: 'poly', pts: NORTH_POLY, c: REGION_C.north, clip: CN }, a: 0.2 }],
        lines: [{ pts: NW_LINE, c: C.white, w: 2.6, dur: 2.6, t: 0.3 },
          ...arrows([[[24, 117], [29, 113]], [[29, 123], [34, 117]], [[34, 123], [38, 116.5]], [[39, 125], [42.5, 119.5]]], C.teal, 1.8, 2)],
        marks: [mk([48.5, 121.6], 'Greater Khingan', '大兴安岭', { c: C.white, t: 0.8 }), mk([41.3, 110.5], 'Yinshan', '阴山', { c: C.white, t: 1.2 }), mk([38.9, 105.9], 'Helan Shan', '贺兰山', { c: C.white, t: 1.6 }),
          mk([45.2, 126.5], 'Summer monsoon reaches here', '夏季风可以到达', { c: C.teal, t: 2.6 }), mk([42.5, 98], 'Little rain: under 400 mm', '降水少于 400 毫米', { c: REGION_C.nw, t: 3 })],
        fig: { k: 'climo', city: 'beijing', b: 'urumqi' },
        task: ['Follow the white line south-west from the Greater Khingan: on which side do the teal monsoon arrows stop?', '沿白线从大兴安岭向西南看：青色的夏季风箭头停在线的哪一侧？'],
        body: ['The north and the northwest are divided roughly by the 400 mm isohyet, which runs from the Greater Khingan along the edge of the Inner Mongolian Plateau and the Great Wall. It is close to the edge of the summer monsoon (Greater Khingan–Yinshan–Helan Shan). East of it the summer monsoon brings enough rain for farming; west of it, far from the sea, grassland and desert take over, and herding is the main way of life.',
          '北方地区与西北地区大致以 400 毫米年等降水量线为界，这条线从大兴安岭经内蒙古高原东南边缘、长城一带延伸。它与大兴安岭—阴山—贺兰山一线（季风区与非季风区的分界）大体一致。线以东，夏季风带来较多降水，以种植业为主；线以西，深居内陆，降水稀少，多草原和荒漠，以畜牧业为主。'],
      },
      {
        title: ['The 3,000 m contour', '3000 米等高线'], cam: [33, 92, 2.8], sketch: true,
        paint: [{ fill: { k: 'poly', pts: QT_POLY, c: REGION_C.qt, clip: CN }, a: 0.45, t: 1.6 }],
        lines: [{ pts: QT_EDGE, c: C.white, w: 2.4, dur: 3, t: 0.2 }],
        marks: [mk([36.3, 84], 'Kunlun', '昆仑山', { c: C.white, t: 1 }), mk([38.3, 98.5], 'Qilian', '祁连山', { c: C.white, t: 1.4 }), mk([28, 99.9], 'Hengduan', '横断山脉', { c: C.white, t: 1.8 }),
          mk([32.5, 88], 'Over 3,000 m: high and cold', '海拔 3000 米以上：高寒', { big: true, c: REGION_C.qt, t: 2.2 })],
        fig: profileFig,
        task: ['On the profile, find where the land drops through the 3,000 m line; then find the same edge on the globe.', '在剖面图上找到地势穿过 3000 米线的位置，再到地球上找到这条边缘。'],
        body: ['The Qinghai–Tibet region is set apart by height: its edge is roughly the 3,000 m contour, along the foot of the Kunlun, Altun and Qilian mountains in the north and the Hengduan Mountains in the east. Inside, most land is over 4,000 m. Height, not latitude, controls its climate, so it is cold even though it is as far south as Shanghai.',
          '青藏地区与其他三个区域主要以海拔来划分，大致以 3000 米等高线为界：北面沿昆仑山、阿尔金山、祁连山北麓，东面沿横断山脉东缘。区内大部分地区海拔在 4000 米以上。这里的气候主要受海拔影响，纬度和上海相近，却十分寒冷。'],
      },
      {
        title: ['Each region\'s main feature', '各区域的主要特征'], cam: [35, 104, 3.2], sketch: true, paint: fourRegions(0.35), items: ['cn_yuanyang', 'cn_mogao', 'potala'],
        marks: [mk([37.2, 115.5], 'Dry fields', '旱地农业', { c: REGION_C.north, t: 0.4 }), mk([27, 113.5], 'Paddy fields', '水田农业', { c: REGION_C.south, t: 0.9 }),
          mk([41.5, 90], 'Dry: drought', '干旱', { big: true, c: REGION_C.nw, t: 1.4 }), mk([32, 88], 'High and cold', '高寒', { big: true, c: REGION_C.qt, t: 1.9 })],
        fig: { k: 'pie', title: ['Share of China\'s people (approx.)', '各区域人口约占全国比例'], parts: [
          { name: ['North', '北方'], v: 40, c: REGION_C.north }, { name: ['South', '南方'], v: 55, c: REGION_C.south }, { name: ['Northwest', '西北'], v: 4, c: REGION_C.nw }, { name: ['Qinghai–Tibet', '青藏'], v: 1, c: REGION_C.qt }] },
        body: ['Each region has one main natural feature that shapes life there. The north is a temperate monsoon land of dry fields. The south is warm and wet, with paddy fields. The northwest\'s key feature is dryness: water decides where people can live. Qinghai–Tibet is high and cold. Almost all of China\'s people live in the north and south.',
          '每个区域都有自己最突出的自然特征：北方地区属温带季风气候，以旱地为主；南方地区温暖湿润，以水田为主；西北地区的主要特征是干旱，有水的地方才有人居住；青藏地区的主要特征是高寒。全国绝大多数人口集中在北方和南方地区。'],
      },
      {
        title: ['North and south compared', '南北方的差异'], cam: [33, 114, 2.1], sketch: true,
        paint: [{ fill: { k: 'poly', pts: NORTH_POLY, c: REGION_C.north, clip: CN }, a: 0.3 }, { fill: { k: 'poly', pts: SOUTH_POLY, c: REGION_C.south, clip: CN }, a: 0.3 }],
        lines: [{ pts: NS_LINE, c: C.white, w: 2, dur: 1.6 }],
        marks: [mk([36.5, 114.5], 'Wheat, maize: dry fields', '小麦、玉米：旱地', { c: REGION_C.north, t: 0.6 }), mk([29.5, 114.5], 'Rice: paddy fields', '水稻：水田', { c: REGION_C.south, t: 1 }),
          mk([39, 108], '"North: horses"', '北马', { big: true, c: REGION_C.north, t: 1.6 }), mk([30.5, 120], '"South: boats"', '南船', { big: true, c: REGION_C.south, t: 2 })],
        fig: nsTable,
        task: ['Read the table, then name two differences you could see from a train crossing the Huaihe.', '读表格，说出坐火车跨过淮河时能看到的两点差异。'],
        body: ['Climate shapes farming and daily life. In the north, rain is less and the growing season shorter, so dry fields grow wheat and maize; people eat more noodles and steamed buns. The south has paddy fields of rice, two or three harvests a year, and dense rivers and lakes, so people once travelled by boat: "south boats, north horses".',
          '自然条件影响农业和生活。北方降水较少、生长期较短，耕地以旱地为主，种植小麦、玉米等，饮食以面食为主；南方以水田为主，种植水稻，一年两熟到三熟，河湖密布，过去出行多靠船，所谓“南船北马”。'],
      },
      {
        title: ['Houses for each climate', '各具特色的民居'], cam: [35, 104, 3.2], sketch: true, paint: fourRegions(0.25), items: ['forbidden', 'potala'],
        marks: [mk([39.9, 116.4], 'Courtyard houses', '四合院', { dot: true, c: REGION_C.north, t: 0.4 }), mk([28.3, 109.7], 'Stilt houses', '吊脚楼', { dot: true, c: REGION_C.south, t: 0.8 }),
          mk([43.9, 113], 'Yurts', '蒙古包', { dot: true, c: REGION_C.nw, t: 1.2 }), mk([29.65, 91.1], 'Stone houses', '碉房', { dot: true, c: REGION_C.qt, t: 1.6 })],
        fig: housesFig,
        body: ['Houses show the climate. Northern courtyard houses have thick walls and face south to catch winter sun. Southern roofs are steep to shed heavy rain, and stilt houses keep rooms dry above damp ground. Herders on the dry grasslands live in yurts they can move, and in Tibet thick stone walls and small windows keep out the cold wind.',
          '民居反映了自然环境。北方的四合院墙体厚实，坐北朝南，冬季能多晒太阳；南方雨水多，屋顶坡度大，便于排水，吊脚楼底层架空，可以通风防潮；西北草原上的牧民住便于拆装迁移的蒙古包；青藏地区的碉房石墙厚、窗户小，能抵御寒风。'],
      },
    ],
    quiz: [
      { q: ['Match each region with its main natural feature.', '把各区域与其主要自然特征连起来。'],
        match: [[['Northern region', '北方地区'], ['Dry farmland, temperate monsoon', '温带季风，旱地为主']], [['Southern region', '南方地区'], ['Paddy fields, subtropical monsoon', '亚热带季风，水田为主']],
          [['Northwest region', '西北地区'], ['Drought', '干旱']], [['Qinghai–Tibet region', '青藏地区'], ['High and cold', '高寒']]],
        why: ['Water separates north from south and east from northwest; height sets Qinghai–Tibet apart.', '水分条件区分了南北和东西，海拔则使青藏地区与众不同。'] },
      { q: ['Label the map: put each region\'s name inside it.', '标注地图：把各区域的名称放到相应位置。'],
        place: [{ text: ['Northern region', '北方地区'], at: [38, 114], tolKm: 550 }, { text: ['Southern region', '南方地区'], at: [27, 112], tolKm: 550 },
          { text: ['Northwest region', '西北地区'], at: [42, 92], tolKm: 650 }, { text: ['Qinghai–Tibet region', '青藏地区'], at: [32, 88], tolKm: 650 }],
        why: ['North and south share the monsoon east; the northwest is inland; Qinghai–Tibet is the high plateau in the southwest.', '北方、南方位于东部季风区；西北深居内陆；青藏地区是西南部的高原。'] },
      { q: ['The Qinling–Huaihe line is close to… (choose all)', '秦岭—淮河一线大致与下列哪些界线一致？（多选）'],
        options: [['The January 0 ℃ isotherm', '1 月 0 ℃ 等温线'], ['The 800 mm isohyet', '800 毫米年等降水量线'], ['The 400 mm isohyet', '400 毫米年等降水量线'],
          ['Warm temperate / subtropical', '暖温带与亚热带的分界'], ['The 3,000 m contour', '3000 米等高线'], ['Semi-humid / humid', '半湿润区与湿润区的分界']], multi: [0, 1, 3, 5],
        why: ['The 400 mm line divides north from northwest; the 3,000 m contour marks the plateau.', '400 毫米线是北方与西北的分界，3000 米等高线是青藏地区的边界。'] },
      { q: ['This climate graph is from a city in which region?', '这幅气候图所示城市位于哪个区域？'], fig: { k: 'climo', city: 'lhasa', blind: true },
        options: [['Qinghai–Tibet region', '青藏地区'], ['Southern region', '南方地区'], ['Northern region', '北方地区'], ['Northwest region', '西北地区']], answer: 0,
        why: ['Summer is only about 16 ℃ even at 30°N, with little rain: it is very high (Lhasa).', '纬度只有约 30°，夏季气温却只有 16 ℃ 左右，降水不多：海拔很高（拉萨）。'] },
      { q: ['What marks the edge of the Qinghai–Tibet region?', '青藏地区与其他区域的分界大致是'],
        options: [['The 3,000 m contour', '3000 米等高线'], ['The Great Wall', '长城'], ['The Yangtze', '长江'], ['The 800 mm isohyet', '800 毫米年等降水量线']], answer: 0,
        why: ['It is set apart by height: almost all of it is above 3,000 m.', '青藏地区以海拔划分，几乎全部在 3000 米以上。'] },
      { q: ['The Qinling–Huaihe line is roughly the isohyet of how many mm a year?', '秦岭—淮河一线大致是年降水量多少毫米的等降水量线？'], num: { answer: 800, tol: 50, unit: ['mm', '毫米'] },
        why: ['800 mm: north of it is semi-humid, south of it humid.', '800 毫米：线以北为半湿润区，以南为湿润区。'] },
      { q: ['Tap the Qinling Mountains, the western half of the north–south dividing line.', '在地球上点出秦岭——南北分界线的西段。'], at: [33.9, 108.3], tolKm: 250,
        why: ['The Qinling runs west–east across southern Shaanxi, south of Xi\'an; the Huaihe continues the line to the east.', '秦岭东西横亘于陕西南部、西安以南，淮河向东延续这条分界线。'] },
    ],
  },
  {
    id: 'yangtze', strand: 'china', tracks: [], grade: 'g8a', unit: nature, icon: 'ship', minutes: 9,
    title: ['The Yangtze River', '长江'],
    blurb: ['From a Tibetan glacier to Shanghai: power, shipping, floods and protection on China\'s longest river.', '从青藏高原的冰川到上海：中国第一长河的水能、航运、防洪与保护。'],
    keys: [
      ['The Yangtze rises at Geladandong in the Tanggula Mountains, is about 6,300 km long and flows into the East China Sea.', '长江发源于唐古拉山脉主峰各拉丹冬雪山，全长约 6300 千米，注入东海。'],
      ['Yichang and Hukou divide it into the upper, middle and lower course.', '宜昌、湖口是长江上、中、下游的分界点。'],
      ['The upper course is rich in water power (Three Gorges); the middle and lower course is a "golden waterway" for ships.', '上游水能丰富（三峡工程），中下游航运发达，被誉为“黄金水道”。'],
      ['The winding Jingjiang reach floods easily: cut-offs, stronger dykes and "returning farmland to lakes" help.', '荆江河段河道弯曲，易发洪涝，可采取裁弯取直、加固大堤、退田还湖等措施。'],
    ],
    steps: [
      {
        title: ['China\'s longest river', '中国第一长河'], cam: [30.5, 106, 2.8], sketch: true,
        lines: [{ pts: YANGTZE, c: C.ice, w: 3, dur: 4, flow: true }],
        marks: [mk([33.45, 91.1], 'Geladandong (source)', '各拉丹冬（源头）', { dot: true, c: C.white, t: 0.2 }), mk([31.25, 122], 'East China Sea', '东海', { c: C.ice, t: 3.8 }),
          mk([29.56, 106.55], 'Chongqing', '重庆', { dot: true, t: 2.2 }), mk([30.58, 114.3], 'Wuhan', '武汉', { dot: true, t: 3 }), mk([31.23, 121.47], 'Shanghai', '上海', { dot: true, t: 3.6 })],
        fig: { k: 'bars', title: ['The world\'s longest rivers (approx.)', '世界最长的河流（约）'], unit: ['km', '千米'], rows: [
          { name: ['Nile', '尼罗河'], v: 6670, c: DIM }, { name: ['Amazon', '亚马孙河'], v: 6400, c: DIM }, { name: ['Yangtze', '长江'], v: 6300, c: C.ice },
          { name: ['Mississippi', '密西西比河'], v: 6020, c: DIM }, { name: ['Yellow River', '黄河'], v: 5464, c: C.gold }] },
        task: ['Trace the river from its source: which provinces and big cities does it pass?', '从源头开始追踪长江：它流经哪些省区和大城市？'],
        body: ['The Yangtze rises at Geladandong, a glacier-capped peak of the Tanggula Mountains, and flows about 6,300 km east to the East China Sea at Shanghai. It is China\'s longest river and the third longest in the world. It crosses 11 provincial-level divisions and drops over 5,400 m. Its basin covers about a fifth of China and its water flow is the largest of any Chinese river.',
          '长江发源于青藏高原唐古拉山脉主峰各拉丹冬雪山，自西向东流经 11 个省级行政区，在上海注入东海，全长约 6300 千米，是我国第一长河、世界第三长河，落差 5400 多米。长江流域面积约占全国的五分之一，径流量居全国各河流之首。'],
      },
      {
        title: ['Upper, middle and lower course', '上游、中游和下游'], cam: [30.5, 106, 2.8], sketch: true,
        lines: [{ pts: YANGTZE.slice(0, YZ.yichang + 1), c: C.violet, w: 3.2, dur: 2.4 }, { pts: YANGTZE.slice(YZ.yichang, YZ.hukou + 1), c: C.green, w: 3.2, dur: 1.2, t: 2.2 },
          { pts: YANGTZE.slice(YZ.hukou), c: C.ice, w: 3.2, dur: 1, t: 3.2 }],
        marks: [mk(YANGTZE[YZ.yibin], 'Yibin', '宜宾', { dot: true, t: 1.4 }), mk(YANGTZE[YZ.yichang], 'Yichang', '宜昌', { dot: true, big: true, c: C.white, t: 2.2 }),
          mk(YANGTZE[YZ.hukou], 'Hukou', '湖口', { dot: true, big: true, c: C.white, t: 3.2 }),
          mk([31.5, 99], 'Upper: gorges, fast water', '上游：峡谷多，水流急', { c: C.violet, t: 2 }), mk([28.7, 113.4], 'Middle: winding, lakes', '中游：河道弯曲，湖泊多', { c: C.green, t: 3 }),
          mk([32.6, 118.6], 'Lower: wide, slow', '下游：江阔水深', { c: C.ice, t: 4 })],
        fig: yzProfile,
        task: ['On the profile, which course falls most steeply? Find Yichang and Hukou on the globe.', '在纵剖面图上，哪一段落差最大？在地球上找到宜昌和湖口。'],
        body: ['From the source to Yichang is the upper course (about 4,500 km): the river runs through deep gorges and most of its 5,400 m drop is here. Below Yibin it is called the Chang Jiang. From Yichang to Hukou, at the mouth of Poyang Lake, is the middle course, which winds across flat plains with many lakes. Below Hukou the lower course is wide and deep, with a big delta.',
          '从源头到湖北宜昌为上游，长约 4500 千米，河流多穿行于高山峡谷之中，落差大，水流急；宜宾以下始称“长江”。宜昌到江西湖口为中游，河道弯曲，流经平原，湖泊众多。湖口以下为下游，江阔水深，在入海处形成长江三角洲。'],
      },
      {
        title: ['Tributaries and lakes', '支流与湖泊'], cam: [29.5, 109, 2.2], sketch: true,
        paint: [{ fill: { k: 'poly', pts: DONGTING, c: C.ice }, a: 0.8, t: 2 }, { fill: { k: 'poly', pts: POYANG, c: C.ice }, a: 0.8, t: 2.4 }],
        lines: [{ pts: YANGTZE, c: C.ice, w: 3, dur: 0 }, ...[YZ_TRIBS.yalong, YZ_TRIBS.min, YZ_TRIBS.jialing, YZ_TRIBS.wu, YZ_TRIBS.han, YZ_TRIBS.xiang, YZ_TRIBS.gan]
          .map((p, i) => ({ pts: p as LL[], c: C.teal, w: 2, dur: 1, t: 0.3 + i * 0.25 }))],
        marks: [mk([30.3, 100.6], 'Yalong', '雅砻江', { c: C.teal, t: 0.4 }), mk([31.2, 103.4], 'Min', '岷江', { c: C.teal, t: 0.6 }), mk([31.6, 106.3], 'Jialing', '嘉陵江', { c: C.teal, t: 0.8 }),
          mk([27.4, 107.2], 'Wu', '乌江', { c: C.teal, t: 1 }), mk([32.4, 110.6], 'Han', '汉江', { c: C.teal, t: 1.2 }), mk([26.7, 112.3], 'Xiang', '湘江', { c: C.teal, t: 1.4 }),
          mk([27.0, 115.3], 'Gan', '赣江', { c: C.teal, t: 1.6 }), mk([28.9, 112.2], 'Dongting Lake', '洞庭湖', { c: C.ice, t: 2.2 }), mk([28.8, 116.6], 'Poyang Lake', '鄱阳湖', { c: C.ice, t: 2.6 })],
        fig: { k: 'bars', title: ['China\'s biggest freshwater lakes (approx., in flood season)', '我国最大的淡水湖（约，丰水期）'], unit: ['km²', '平方千米'], rows: [
          { name: ['Poyang', '鄱阳湖'], v: 3500, c: C.ice }, { name: ['Dongting', '洞庭湖'], v: 2600, c: C.ice }, { name: ['Taihu', '太湖'], v: 2400, c: C.teal }, { name: ['Hongze', '洪泽湖'], v: 1600, c: DIM }] },
        task: ['Which tributaries feed Dongting Lake and Poyang Lake? Which joins at Wuhan?', '哪些支流注入洞庭湖和鄱阳湖？哪条支流在武汉汇入长江？'],
        body: ['Hundreds of tributaries make the Yangtze huge. The Yalong, Min, Jialing and Wu join in the upper course; the Han joins at Wuhan. The Xiang flows into Dongting Lake and the Gan into Poyang Lake, and both lakes drain into the Yangtze. These lakes act like sponges: they store floodwater in summer and release it in the dry season.',
          '长江支流众多，雅砻江、岷江、嘉陵江、乌江在上游汇入，汉江在武汉汇入；湘江注入洞庭湖，赣江注入鄱阳湖，两湖再与长江相通。湖泊像海绵一样，汛期蓄积洪水，枯水期补给长江，起着调节水量的作用。'],
      },
      {
        title: ['Three Gorges: water power', '三峡：水能宝库'], cam: [29.5, 106, 1.7], sketch: true,
        lines: [{ pts: YANGTZE.slice(16, YZ.yichang + 1), c: C.ice, w: 3, dur: 1.6 }, { pts: YANGTZE.slice(32, YZ.yichang + 1), c: C.violet, w: 5, dur: 1, t: 1.6 }],
        marks: [mk([30.82, 111.0], 'Three Gorges Dam', '三峡大坝', { dot: true, big: true, c: C.gold, t: 1.2 }), mk([31.15, 109.6], 'Qutang · Wu · Xiling gorges', '瞿塘峡 · 巫峡 · 西陵峡', { c: C.violet, t: 2 }),
          mk([27.2, 102.9], 'Baihetan', '白鹤滩', { dot: true, c: C.gold, t: 1.6 }), mk([28.26, 103.65], 'Xiluodu', '溪洛渡', { dot: true, c: C.gold, t: 1.8 }),
          mk([26.2, 102.63], 'Wudongde', '乌东德', { dot: true, c: C.gold, t: 2 }), mk([28.65, 104.4], 'Xiangjiaba', '向家坝', { dot: true, c: C.gold, t: 2.2 }),
          mk([30.74, 111.27], 'Gezhouba', '葛洲坝', { dot: true, c: DIM, t: 2.4 })],
        fig: { k: 'bars', title: ['Power stations on the Yangtze (capacity, approx.)', '长江干流上的水电站（装机容量，约）'], unit: ['GW', '吉瓦'], rows: [
          { name: ['Three Gorges', '三峡'], v: 22.5, c: C.gold }, { name: ['Baihetan', '白鹤滩'], v: 16, c: C.gold }, { name: ['Xiluodu', '溪洛渡'], v: 13.9, c: C.gold },
          { name: ['Wudongde', '乌东德'], v: 10.2, c: C.gold }, { name: ['Xiangjiaba', '向家坝'], v: 6.4, c: C.gold }] },
        task: ['Why are all these dams on the upper course, not near Shanghai?', '为什么这些水电站都建在上游，而不是在上海附近？'],
        body: ['A big drop plus a big flow means water power, and the Yangtze has the most of any Chinese river. Most is in the upper course, where narrow gorges make good dam sites. The Three Gorges Dam near Yichang is the world\'s largest power station. It also controls floods downstream and its ship lift and locks let big ships reach Chongqing. A chain of dams on the Jinsha (the upper Yangtze) now forms a "clean energy corridor".',
          '落差大、水量大，水能就丰富。长江水能资源居全国首位，主要集中在上游，那里峡谷狭窄，适宜建坝。宜昌附近的三峡水利枢纽是世界最大的水电站，兼有防洪、发电、航运等综合效益——船闸和升船机使万吨船队能直达重庆。金沙江上的乌东德、白鹤滩、溪洛渡、向家坝等电站连成了“清洁能源走廊”。'],
      },
      {
        title: ['The golden waterway', '黄金水道'], cam: [30.5, 113, 1.9], sketch: true, items: ['cn_yellowcrane'],
        lines: [{ pts: YANGTZE.slice(YZ.yibin - 3), c: C.gold, w: 3.4, dur: 2.4, flow: true }],
        marks: [mk([29.56, 106.55], 'Chongqing', '重庆', { dot: true, t: 0.4 }), mk([30.58, 114.3], 'Wuhan', '武汉', { dot: true, t: 1 }), mk([29.7, 116.0], 'Jiujiang', '九江', { dot: true, t: 1.3 }),
          mk([32.06, 118.77], 'Nanjing', '南京', { dot: true, t: 1.7 }), mk([31.23, 121.47], 'Shanghai', '上海', { dot: true, t: 2.2 }),
          mk([30.4, 117.8], 'Over 10,000-tonne ships reach Wuhan', '万吨级船舶可达武汉', { c: C.gold, t: 2.6 })],
        fig: { k: 'bars', title: ['Freight carried on main rivers (approx., per year)', '主要河流干线货运量（约，每年）'], unit: ['100 million t', '亿吨'], rows: [
          { name: ['Yangtze', '长江'], v: 39, c: C.gold }, { name: ['Mississippi', '密西西比河'], v: 5, c: DIM }, { name: ['Rhine', '莱茵河'], v: 3, c: DIM }] },
        task: ['Why can ships sail on the Yangtze all year round, but not on many northern rivers?', '为什么长江终年可以通航，而北方许多河流不行？'],
        body: ['The Yangtze carries more freight than any other river on Earth. It has plenty of water all year, no winter ice, and its main stream links the coast with the heart of China, so ships go a long way inland. Ocean-going ships sail up to Nanjing and 10,000-tonne ships reach Wuhan. Ports along it serve the biggest industrial belt in China.',
          '长江水量丰富，终年不冻，干流横贯东西，通航里程长，被誉为“黄金水道”，货运量居世界内河首位。海轮可直达南京，万吨级船舶可达武汉。沿江港口密布，连接着我国最大的工业走廊。'],
      },
      {
        title: ['Floods on the Jingjiang', '荆江的洪涝'], cam: [30, 113.5, 1.3], sketch: true,
        paint: [{ fill: { k: 'poly', pts: DONGTING, c: C.ice }, a: 0.8 }, { fill: { k: 'poly', pts: POYANG, c: C.ice }, a: 0.8 }],
        lines: [{ pts: YANGTZE.slice(YZ.yichang, YZ.hukou + 1), c: C.ice, w: 2.6, dur: 0 }, { pts: JINGJIANG, c: C.gold, w: 5, dur: 2.4, t: 0.3 }],
        marks: [mk([30.33, 112.24], 'Jingzhou', '荆州', { dot: true, t: 0.3 }), mk([29.44, 113.14], 'Chenglingji', '城陵矶', { dot: true, t: 2.2 }), mk([28.4, 112.4], 'Dongting Lake', '洞庭湖', { c: C.ice, t: 1 }),
          mk([31.3, 112.4], '"Nine bends and eighteen turns"', '“九曲回肠”', { c: C.gold, t: 2.6 })],
        fig: cutoffFig,
        task: ['Follow the drawn river from Jingzhou: why does water back up on such a winding course?', '从荆州顺着河道走：河道这么弯曲，为什么洪水容易排泄不畅？'],
        body: ['The Jingjiang reach in the middle course loops back and forth across flat land, so floodwater drains slowly and silt builds up, and the riverbed is higher than the land behind the dykes. In the summer rains, floods are a big danger. People cut through the narrow necks of loops to shorten the river, strengthened the dykes, built flood-storage areas, and gave reclaimed land back to the lakes so they can hold more water.',
          '中游的荆江河段河道弯曲，有“九曲回肠”之称，水流不畅，泥沙易淤积，河床高出两岸地面，汛期常有洪水威胁。治理措施有：裁弯取直、加固大堤、修建分洪区，以及退田还湖，恢复湖泊的蓄洪能力。'],
      },
      {
        title: ['The Yangtze River Economic Belt', '长江经济带'], cam: [30, 110, 2.6], sketch: true, items: ['cn_bund'],
        paint: [{ fill: { k: 'poly', pts: YZ_BELT, c: C.green, clip: CN }, a: 0.3 }],
        lines: [{ pts: YANGTZE, c: C.ice, w: 3, dur: 2 }],
        marks: [mk([31.0, 120.2], 'Yangtze Delta', '长三角', { big: true, c: C.gold, t: 0.6 }), mk([30.4, 113.6], 'Middle-reach cities', '长江中游城市群', { c: C.gold, t: 1 }),
          mk([30.1, 105.0], 'Chengdu–Chongqing', '成渝地区', { c: C.gold, t: 1.4 }), mk([25.3, 102.7], 'Yunnan', '云南', { c: C.green, t: 1.8 })],
        fig: { k: 'bars', title: ['The economic belt\'s share of China (approx.)', '长江经济带约占全国的比例'], unit: ['%', '%'], rows: [
          { name: ['Land', '面积'], v: 21, c: C.green }, { name: ['People', '人口'], v: 43, c: C.gold }, { name: ['GDP', '经济总量'], v: 46, c: C.orange }] },
        task: ['Compare the three bars: what do they tell you about how crowded and rich the belt is?', '比较三根柱子：它们说明长江经济带的人口和经济怎样？'],
        body: ['Eleven provinces and cities along the river form the Yangtze River Economic Belt: about a fifth of the land but over two-fifths of the people and the economy. Fast growth also brought pollution and overfishing, so the rule now is "protect it together, no big development". Since 2021 fishing has been banned for ten years and a Yangtze Protection Law is in force.',
          '沿江 11 个省市组成长江经济带，面积约占全国的五分之一，人口和经济总量却超过全国的五分之二。快速发展也带来了污染和过度捕捞等问题，因此要“共抓大保护，不搞大开发”。2021 年起长江流域重点水域实行十年禁渔，《长江保护法》正式施行。'],
      },
    ],
    quiz: [
      { q: ['Label the map.', '标注地图。'],
        place: [{ text: ['Three Gorges', '三峡'], at: [31.0, 110.2], tolKm: 180 }, { text: ['Dongting Lake', '洞庭湖'], at: [29.0, 112.6], tolKm: 150 },
          { text: ['Poyang Lake', '鄱阳湖'], at: [29.1, 116.3], tolKm: 150 }, { text: ['River mouth', '长江入海口'], at: [31.3, 121.9], tolKm: 180 }],
        why: ['The gorges are in the upper course, the two lakes in the middle course, and the mouth at Shanghai.', '三峡在上游，两湖在中游，入海口在上海。'] },
      { q: ['Put these cities in order going downstream.', '按顺流而下的顺序排列这些城市。'],
        order: [['Yibin', '宜宾'], ['Chongqing', '重庆'], ['Yichang', '宜昌'], ['Wuhan', '武汉'], ['Nanjing', '南京'], ['Shanghai', '上海']],
        why: ['Yichang ends the upper course; Wuhan is in the middle course; Nanjing is in the lower course.', '宜昌是上游的终点，武汉在中游，南京在下游。'] },
      { q: ['Match each tributary with where it flows.', '把支流与它的去向连起来。'],
        match: [[['Han', '汉江'], ['Joins at Wuhan', '在武汉汇入长江']], [['Xiang', '湘江'], ['Into Dongting Lake', '注入洞庭湖']],
          [['Gan', '赣江'], ['Into Poyang Lake', '注入鄱阳湖']], [['Jialing', '嘉陵江'], ['Joins at Chongqing', '在重庆汇入长江']]],
        why: ['Xiang feeds Dongting (Hunan), Gan feeds Poyang (Jiangxi).', '湘江注入洞庭湖（湖南），赣江注入鄱阳湖（江西）。'] },
      { q: ['How long is the Yangtze?', '长江全长约多少千米？'], num: { answer: 6300, tol: 200, unit: ['km', '千米'] },
        why: ['About 6,300 km: third in the world after the Nile and the Amazon.', '约 6300 千米，仅次于尼罗河和亚马孙河，居世界第三。'] },
      { q: ['Which help with floods on the Jingjiang reach? (choose all)', '下列哪些措施有利于荆江河段防洪？（多选）'],
        options: [['Cutting off meander loops', '裁弯取直'], ['Returning farmland to lakes', '退田还湖'], ['Strengthening the dykes', '加固大堤'],
          ['Reclaiming more land from lakes', '围湖造田'], ['Cutting trees in the upper course', '砍伐上游森林']], multi: [0, 1, 2],
        why: ['Reclaiming lakes and cutting forests make floods worse.', '围湖造田、砍伐森林会加重洪涝灾害。'] },
      { q: ['On this profile, where is most of the water power?', '据图，长江的水能主要集中在哪一段？'], fig: yzProfile,
        options: [['The upper course', '上游'], ['The middle course', '中游'], ['The lower course', '下游'], ['The delta', '河口三角洲']], answer: 0,
        why: ['The upper course has by far the biggest drop.', '上游落差最大，水能最丰富。'] },
      { q: ['Tap Hukou, where the middle course ends.', '在地图上点出湖口——长江中游与下游的分界点。'], at: [29.74, 116.22], tolKm: 150,
        why: ['Hukou is at the mouth of Poyang Lake in Jiangxi.', '湖口位于江西，在鄱阳湖入江口。'] },
    ],
  },
  {
    id: 'yellow-river', strand: 'china', tracks: [], grade: 'g8a', unit: nature, icon: 'sail', minutes: 9,
    title: ['The Yellow River', '黄河'],
    blurb: ['The mother river: irrigation, silt from the Loess Plateau, a riverbed above the plain, and how it is tamed.', '母亲河：灌溉之利、黄土高原的泥沙、高出地面的“地上河”，以及黄河的治理。'],
    keys: [
      ['The Yellow River rises in the Bayan Har Mountains, is about 5,464 km long and enters the Bohai Sea.', '黄河发源于巴颜喀拉山脉，全长约 5464 千米，注入渤海。'],
      ['Hekou town (Inner Mongolia) and Taohuayu (Zhengzhou, Henan) divide its upper, middle and lower course.', '内蒙古河口镇、河南郑州桃花峪是黄河上、中、下游的分界点。'],
      ['The middle course crosses the Loess Plateau and picks up huge amounts of silt; the lower course is a raised "above-ground river".', '中游流经黄土高原，带入大量泥沙；下游泥沙淤积，形成“地上河”。'],
      ['Treatment: soil conservation in the middle course, stronger dykes downstream, and reservoirs to regulate water and silt.', '治理：中游保持水土，下游加固黄河大堤，利用水库调水调沙。'],
    ],
    steps: [
      {
        title: ['The great bend', '“几”字形大弯'], cam: [37, 106, 2.6], sketch: true,
        lines: [{ pts: YELLOW, c: C.gold, w: 3.2, dur: 4, flow: true }],
        marks: [mk(YELLOW[0], 'Bayan Har Mountains (source)', '巴颜喀拉山（源头）', { dot: true, c: C.white, t: 0.2 }), mk(YELLOW[YR.lanzhou], 'Lanzhou', '兰州', { dot: true, t: 1.2 }),
          mk([40.6, 109.8], 'Baotou', '包头', { dot: true, t: 2 }), mk([34.75, 113.65], 'Zhengzhou', '郑州', { dot: true, t: 3 }), mk([36.67, 116.98], 'Jinan', '济南', { dot: true, t: 3.4 }),
          mk([38.2, 119.6], 'Bohai Sea', '渤海', { c: C.ice, t: 3.8 })],
        fig: { k: 'bars', title: ['Water flow of China\'s great rivers (approx., per year)', '我国大河的年径流量（约）'], unit: ['100 million m³', '亿立方米'], rows: [
          { name: ['Yangtze', '长江'], v: 9600, c: C.ice }, { name: ['Pearl', '珠江'], v: 3300, c: C.teal }, { name: ['Yellow', '黄河'], v: 580, c: C.gold }] },
        task: ['Follow the river: where does it flow north, where east, and where south? Can you see the shape of the character jī?', '沿河而行：哪段向北流、哪段向东流、哪段向南流？你看出“几”字了吗？'],
        body: ['The Yellow River rises at the foot of the Bayan Har Mountains in Qinghai and runs about 5,464 km through nine provinces to the Bohai Sea. It is China\'s second longest river and the cradle of Chinese civilisation. It swings north into the Inner Mongolian desert edge and back south, a shape like the Chinese character jī, an upside-down U. Much of its basin is dry, so it carries far less water than the Yangtze.',
          '黄河发源于青海省巴颜喀拉山脉北麓，流经 9 个省区，注入渤海，全长约 5464 千米，是我国第二长河，也是中华民族的摇篮。黄河在内蒙古一带向北、再向东、又向南拐了一个大弯，呈“几”字形。流域内大部分地区比较干旱，所以黄河的水量远小于长江。'],
      },
      {
        title: ['Upper course: plains in the desert', '上游：塞上江南'], cam: [38.5, 105, 1.6], sketch: true,
        paint: [{ fill: { k: 'poly', pts: NINGXIA_PLAIN, c: C.green }, a: 0.7, t: 1.6 }, { fill: { k: 'poly', pts: HETAO_PLAIN, c: C.green }, a: 0.7, t: 2 }],
        lines: [{ pts: YELLOW.slice(0, YR.hekou + 1), c: C.violet, w: 3.2, dur: 2.4 }],
        marks: [mk(YELLOW[YR.hekou], 'Hekou town', '河口镇', { dot: true, big: true, c: C.white, t: 2.4 }), mk([36.1, 101.4], 'Longyangxia', '龙羊峡', { dot: true, c: C.gold, t: 0.8 }),
          mk([35.93, 103.33], 'Liujiaxia', '刘家峡', { dot: true, c: C.gold, t: 1.1 }), mk([38.3, 105.8], 'Ningxia Plain', '宁夏平原', { c: C.green, t: 1.8 }),
          mk([41.3, 108.3], 'Hetao Plain', '河套平原', { c: C.green, t: 2.2 }), mk([38.47, 106.27], 'Yinchuan', '银川', { dot: true, t: 2.6 })],
        fig: { k: 'bars', title: ['Yinchuan: rain and evaporation (approx., per year)', '银川的年降水量与蒸发量（约）'], unit: ['mm', '毫米'], rows: [
          { name: ['Rain', '降水量'], v: 190, c: C.ice }, { name: ['Evaporation', '蒸发量'], v: 1800, c: C.orange }] },
        task: ['Yinchuan gets under 200 mm of rain: how can rice grow there?', '银川年降水量不足 200 毫米，那里为什么能种水稻？'],
        body: ['Above Hekou town is the upper course, about 3,470 km — more than half the river. In the deep gorges near its start, dams such as Longyangxia and Liujiaxia produce power. Then the river crosses the dry lands of Ningxia and Inner Mongolia. Rain is far too little for crops, but canals from the river have watered the flat Ningxia and Hetao plains for over 2,000 years, so there are rice and wheat fields in the desert: "the south of the Yangtze beyond the Great Wall".',
          '河口镇以上为上游，长约 3470 千米，占全河一半以上。上游峡谷段落差大，建有龙羊峡、刘家峡等水电站。随后黄河流经宁夏、内蒙古的干旱地区，降水稀少，但地势平坦，引黄灌溉已有两千多年的历史。宁夏平原和河套平原成为荒漠中的“塞上江南”，盛产小麦和水稻。'],
      },
      {
        title: ['Middle course: the silt', '中游：泥沙的来源'], cam: [36.8, 109.5, 1.4], sketch: true, items: [],
        paint: [{ fill: { k: 'poly', pts: LOESS_PLATEAU, c: C.gold, clip: CN }, a: 0.38 }],
        lines: [{ pts: YELLOW.slice(YR.hekou, YR.taohuayu + 1), c: C.orange, w: 3.4, dur: 1.6 }, { pts: YR_TRIBS.wei as LL[], c: C.orange, w: 2, dur: 1, t: 1.2 },
          { pts: YR_TRIBS.fen as LL[], c: C.orange, w: 2, dur: 1, t: 1.4 }, { pts: YR_TRIBS.wuding as LL[], c: C.orange, w: 2, dur: 0.8, t: 1.6 }],
        marks: [mk(YELLOW[YR.taohuayu], 'Taohuayu', '桃花峪', { dot: true, big: true, c: C.white, t: 1.6 }), mk([36.15, 110.45], 'Hukou Falls', '壶口瀑布', { dot: true, c: C.gold, t: 0.8 }),
          mk([34.35, 108.2], 'Wei', '渭河', { c: C.orange, t: 1.4 }), mk([37.5, 112.1], 'Fen', '汾河', { c: C.orange, t: 1.6 }), mk([38.3, 109.2], 'Wuding', '无定河', { c: C.orange, t: 1.8 }),
          mk([36.0, 107.6], 'Loess Plateau', '黄土高原', { big: true, c: C.gold, t: 0.4 })],
        fig: { k: 'bars', title: ['Silt carried each year (approx., before 2000)', '多年平均输沙量（约，2000 年前）'], unit: ['100 million t', '亿吨'], rows: [
          { name: ['Yellow', '黄河'], v: 16, c: C.gold }, { name: ['Yangtze', '长江'], v: 5, c: C.ice }, { name: ['Pearl', '珠江'], v: 0.8, c: C.teal }] },
        task: ['Which tributaries in this step drain the Loess Plateau? What do they add to the river?', '这一步中哪些支流流经黄土高原？它们给黄河带来了什么？'],
        body: ['From Hekou town to Taohuayu, near Zhengzhou, is the middle course, about 1,200 km long (older maps put the boundary at old Mengjin). The river cuts a gorge between Shanxi and Shaanxi (Hukou Falls is here) and, with tributaries like the Wuding, Fen and Wei, crosses the loose loess. Summer rainstorms wash huge amounts of soil into the water. Over 90% of the river\'s silt comes from this stretch, making it the muddiest big river in the world.',
          '河口镇到郑州桃花峪为中游，长约 1200 千米（旧时以旧孟津为界）。黄河在晋陕峡谷中奔流（壶口瀑布在此），与无定河、汾河、渭河等支流一起流经黄土高原。黄土疏松，夏季多暴雨，大量泥沙被冲入河中。黄河 90% 以上的泥沙来自中游，使它成为世界上含沙量最大的河流。'],
      },
      {
        title: ['Lower course: a river above the land', '下游：地上河'], cam: [36, 115.5, 1.05], sketch: true,
        lines: [{ pts: YELLOW.slice(YR.taohuayu), c: C.gold, w: 4, dur: 1.8 }],
        marks: [mk([34.75, 113.65], 'Zhengzhou', '郑州', { dot: true, t: 0.4 }), mk([34.8, 114.3], 'Kaifeng', '开封', { dot: true, t: 0.8 }), mk([36.67, 116.98], 'Jinan', '济南', { dot: true, t: 1.2 }),
          mk([37.43, 118.67], 'Dongying', '东营', { dot: true, t: 1.6 }), mk([35.6, 114.4], 'Riverbed 3–5 m above the land (10 m at Kaifeng)', '河床高出两岸 3～5 米（开封段达 10 米）', { c: C.orange, t: 2 }),
          mk([33.8, 116.6], 'North China Plain', '华北平原', { c: C.white, t: 2.4 })],
        fig: raisedBedFig,
        task: ['On the cross-section, compare the riverbed with the town: why must the dykes never break?', '在剖面图上比较河床和城镇的高低：为什么大堤绝不能决口？'],
        body: ['Below Taohuayu, the last 786 km of the river spreads out on the flat North China Plain and slows down, so silt settles on its bed. People raised the dykes again and again, and the bed rose with them. Now the riverbed is higher than the land on both sides: an "above-ground river". Almost no tributaries can flow into it, and it divides the Huai basin from the Hai basin. If a dyke breaks, the water floods the plain.',
          '桃花峪以下为下游，长约 786 千米。黄河进入华北平原，地势平坦，流速变慢，泥沙大量淤积，河床不断抬高，人们只好不断加高大堤。如今河床高出两岸地面，成为“地上河”（悬河）。下游几乎没有支流汇入，成为淮河与海河流域的分水岭。一旦决口，洪水将淹没大片平原。'],
      },
      {
        title: ['Ice-jam floods', '凌汛'], cam: [38, 112, 2.2], sketch: true,
        lines: [{ pts: YELLOW, c: C.gold, w: 2.4, dur: 0 }, { pts: YELLOW.slice(19, YR.hekou + 1), c: C.ice, w: 4.5, dur: 1.4, t: 0.4 }, { pts: YELLOW.slice(49), c: C.ice, w: 4.5, dur: 1, t: 1.4 }],
        marks: [mk([39.6, 105.8], 'Flows south → north', '由低纬流向高纬', { c: C.ice, t: 1 }), mk([37.9, 117], 'Flows southwest → northeast', '由低纬流向高纬', { c: C.ice, t: 2 }),
          mk([38.3, 103.8], 'Ningxia–Inner Mongolia reach', '宁蒙河段', { c: C.white, t: 1.3 }), mk([35.5, 117.6], 'Shandong reach', '山东河段', { c: C.white, t: 2.2 })],
        fig: iceJamFig,
        task: ['Find the two blue reaches: in which direction does the water flow in each?', '找到两段蓝色河段：它们分别朝哪个方向流？'],
        body: ['In two reaches, the Ningxia–Inner Mongolia stretch and the lower course in Shandong, the river flows from lower (warmer) to higher (colder) latitudes. In winter the downstream part freezes first; in spring the upstream part thaws first. Water and floating ice pile up against the still-frozen ice below, the level rises sharply and the dykes may burst. This is an ice-jam flood (lingxun). People blast the ice and use reservoirs to cut the flow.',
          '黄河宁蒙河段和山东河段都是从较低纬度流向较高纬度。冬季，下游先结冰；春季，上游先解冻，河水和冰凌在下游未解冻的河段堆积，水位骤涨，可能冲毁大堤，这就是凌汛。可以通过爆破冰坝、利用上游水库控制下泄水量等方法防治。'],
      },
      {
        title: ['When the river ran dry', '黄河断流'], cam: [36.2, 115, 1.4], sketch: true,
        lines: [{ pts: YELLOW.slice(YR.tongguan), c: C.gold, w: 3, dur: 1.4 }, { pts: YELLOW.slice(52), c: DIM, w: 4, dur: 0.8, t: 1.4 }],
        marks: [mk([35.0, 112.4], 'Xiaolangdi Dam', '小浪底水利枢纽', { dot: true, big: true, c: C.gold, t: 0.6 }), mk([37.5, 118.3], 'Lijin station', '利津水文站', { dot: true, t: 1.2 }),
          mk([36.9, 116.2], 'Dry riverbed', '河床干涸', { c: DIM, t: 2 })],
        fig: { k: 'line', title: ['Days without flow at Lijin (lower Yellow River)', '黄河下游利津站断流天数'], unit: ['days', '天'],
          x: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001], min: 0, max: 240,
          series: [{ name: ['No-flow days', '断流天数'], c: C.orange, y: [16, 83, 60, 74, 122, 136, 226, 142, 42, 0, 0] }],
          notes: [{ x: 1999, text: ['Unified allocation', '统一调度'] }] },
        task: ['Find the worst year on the graph. What changed after 1999?', '在图中找出断流最严重的年份。1999 年后发生了什么变化？'],
        body: ['In the 1990s the lower Yellow River often ran dry: in 1997 there was no water at Lijin for 226 days. Too much water was taken for farms and cities upstream in a dry basin. Since 1999 the whole river\'s water has been shared out by one plan, and it has not run dry since. Since 2002 the Xiaolangdi reservoir also sends big pulses of water each year to flush silt out to sea ("regulating water and silt").',
          '20 世纪 90 年代，黄河下游频繁断流，1997 年利津站断流长达 226 天。原因是流域降水少，而上中游工农业和城市用水过多。1999 年起，黄河水量实行统一调度，此后再未断流。2002 年起，小浪底水库每年进行“调水调沙”，用大流量把下游河床的泥沙冲入大海。'],
      },
      {
        title: ['Taming the Yellow River', '黄河的治理'], cam: [37, 109, 2.2], sketch: true, items: [],
        paint: [{ fill: { k: 'poly', pts: LOESS_PLATEAU, c: C.green, clip: CN }, a: 0.32, t: 0.4 }],
        lines: [{ pts: YELLOW.slice(0, YR.hekou + 1), c: C.violet, w: 3, dur: 1.2 }, { pts: YELLOW.slice(YR.hekou, YR.taohuayu + 1), c: C.orange, w: 3, dur: 1, t: 1.2 },
          { pts: YELLOW.slice(YR.taohuayu), c: C.gold, w: 3, dur: 1, t: 2.2 }],
        marks: [mk([37.2, 103], 'Upper: dams, saving water', '上游：建水库，节约用水', { c: C.violet, t: 1 }), mk([36.4, 108.2], 'Middle: soil conservation', '中游：保持水土', { c: C.green, t: 2 }),
          mk([35.6, 116.6], 'Lower: stronger dykes, flushing silt', '下游：加固大堤，调水调沙', { c: C.gold, t: 3 })],
        task: ['Why is soil conservation in the middle course called the "root" of taming the river?', '为什么说中游保持水土是治理黄河的根本？'],
        body: ['The key problem is silt, and silt comes from the middle course, so planting trees and grass, building terraces and check dams on the Loess Plateau is the root cure. Downstream, the dykes are strengthened and widened, and reservoirs flush silt to the sea. Upstream, water is saved and shared. Since 2019 the whole basin\'s protection has been a national strategy, and a Yellow River Protection Law came into force in 2023.',
          '黄河的根本问题是泥沙，而泥沙主要来自中游，所以在黄土高原植树种草、修梯田、建淤地坝，保持水土是治本之策。下游加固、加宽黄河大堤，利用水库调水调沙；上游节约用水，统一调度。2019 年，黄河流域生态保护和高质量发展上升为国家战略，2023 年《黄河保护法》施行。'],
      },
    ],
    quiz: [
      { q: ['Put these cities in order going downstream.', '按顺流而下的顺序排列这些城市。'],
        order: [['Lanzhou', '兰州'], ['Yinchuan', '银川'], ['Baotou', '包头'], ['Zhengzhou', '郑州'], ['Jinan', '济南'], ['Dongying', '东营']],
        why: ['The river goes north from Lanzhou through Yinchuan to Baotou, then south and east to Zhengzhou and Jinan, and reaches the sea at Dongying.', '黄河从兰州北上经银川到包头，再南下、东流经郑州、济南，在东营入海。'] },
      { q: ['Match each problem with the main way to deal with it.', '把问题与主要治理措施连起来。'],
        match: [[['Soil erosion in the middle course', '中游水土流失'], ['Plant trees and grass, build terraces', '植树种草，修建梯田']],
          [['Above-ground river downstream', '下游地上河'], ['Strengthen the dykes, flush silt', '加固大堤，调水调沙']],
          [['Running dry', '断流'], ['Save water, share it by one plan', '节约用水，统一调度']]],
        why: ['Each problem has its own cure; the silt from the middle course is the root of the others.', '对症下药；中游的泥沙是下游问题的根源。'] },
      { q: ['What does this cross-section show?', '这幅剖面图表示的是什么现象？'], fig: raisedBedFig,
        options: [['An above-ground river', '地上河'], ['An ice-jam flood', '凌汛'], ['A river running dry', '断流'], ['A meander cut-off', '裁弯取直']], answer: 0,
        why: ['The riverbed is higher than the land behind the dykes.', '河床高于大堤外的地面。'] },
      { q: ['How long is the Yellow River?', '黄河全长约多少千米？'], num: { answer: 5464, tol: 150, unit: ['km', '千米'] },
        why: ['About 5,464 km, China\'s second longest river.', '约 5464 千米，是我国第二长河。'] },
      { q: ['Label the map.', '标注地图。'],
        place: [{ text: ['Hekou town', '河口镇'], at: YELLOW[YR.hekou], tolKm: 180 }, { text: ['Taohuayu', '桃花峪'], at: YELLOW[YR.taohuayu], tolKm: 180 },
          { text: ['Ningxia Plain', '宁夏平原'], at: [38.3, 106.1], tolKm: 180 }, { text: ['River mouth', '黄河入海口'], at: [37.75, 119.15], tolKm: 180 }],
        why: ['Hekou town and Taohuayu split the three courses; the Ningxia Plain is in the upper course.', '河口镇、桃花峪把黄河分为上、中、下游；宁夏平原在上游。'] },
      { q: ['Why do ice-jam floods happen on these reaches? (choose all)', '这些河段为什么会发生凌汛？（多选）'],
        options: [['The river flows from lower to higher latitudes', '河流由较低纬度流向较高纬度'], ['The lower part freezes earlier and thaws later', '下游结冰早、解冻晚'],
          ['Upstream ice and water pile up against the ice', '上游的冰凌和河水在下游堆积'], ['Summer rainstorms', '夏季暴雨'], ['Too much water is used', '用水过多']], multi: [0, 1, 2],
        why: ['Ice-jam floods happen in winter and spring, not in the summer rains.', '凌汛发生在冬春季节，与夏季暴雨无关。'] },
      { q: ['Tap Hukou Falls on the middle course.', '在地图上点出黄河中游的壶口瀑布。'], at: [36.15, 110.45], tolKm: 120,
        why: ['Hukou Falls is in the Jin–Shaan gorge, between Shanxi and Shaanxi.', '壶口瀑布位于晋陕峡谷，山西与陕西交界处。'] },
    ],
  },
  {
    id: 'northeast', strand: 'china', tracks: [], grade: 'g8b', unit: regions, icon: 'leaf', minutes: 9,
    title: ['The Northeast: black soil and white snow', '东北三省：白山黑水'],
    blurb: ['Mountains around wide plains, fertile black soil, long cold winters: a granary, an old industrial base and an ice-and-snow playground.', '山环水绕、沃野千里、冬季漫长：东北是商品粮基地、老工业基地和冰雪旅游胜地。'],
    keys: [
      ['Mountains (Greater and Lesser Khingan, Changbai) ring the Sanjiang, Songnen and Liaohe plains: "white mountains, black waters".', '大小兴安岭和长白山环绕着三江平原、松嫩平原和辽河平原，素有“白山黑水”之称。'],
      ['The black soil is very fertile but has been thinning, so it must be protected.', '黑土肥沃，但正在变薄，需要保护。'],
      ['Winters are long and cold, summers short and warm: one harvest a year of maize, soybeans, spring wheat and rice.', '冬季漫长寒冷，夏季短促温暖，一年一熟，盛产玉米、大豆、春小麦和水稻。'],
      ['It is China\'s biggest commodity grain base and an old heavy-industry base (Anshan steel, Daqing oil).', '东北是我国最大的商品粮基地，也是重要的老工业基地（鞍山钢铁、大庆石油）。'],
    ],
    steps: [
      {
        title: ['White mountains, black waters', '白山黑水'], cam: [46.5, 126, 1.7], sketch: true, items: ['vo_tianchi'],
        paint: [{ fill: { k: 'poly', pts: NE_THREE, c: C.green, clip: CN }, a: 0.18 }],
        lines: [{ pts: NE_MOUNTAINS.greaterKhingan, c: C.orange, w: 4, dur: 1.2 }, { pts: NE_MOUNTAINS.lesserKhingan, c: C.orange, w: 4, dur: 0.8, t: 0.4 },
          { pts: NE_MOUNTAINS.changbai, c: C.orange, w: 4, dur: 1, t: 0.8 },
          ...[NE_RIVERS.heilong, NE_RIVERS.wusuli, NE_RIVERS.nen, NE_RIVERS.songhua2, NE_RIVERS.songhua, NE_RIVERS.liao].map((p, i) => ({ pts: p as LL[], c: C.ice, w: 2.4, dur: 1.2, t: 1.4 + i * 0.25 }))],
        marks: [mk([49.8, 120.6], 'Greater Khingan', '大兴安岭', { c: C.orange, t: 0.6 }), mk([48.6, 128.9], 'Lesser Khingan', '小兴安岭', { c: C.orange, t: 0.9 }),
          mk([42.3, 127.4], 'Changbai Mountains', '长白山', { c: C.orange, t: 1.2 }), mk([52.6, 126.6], 'Heilong Jiang (Amur)', '黑龙江', { c: C.ice, t: 1.8 }),
          mk([46.4, 129.3], 'Songhua', '松花江', { c: C.ice, t: 2.2 }), mk([46.6, 134.3], 'Wusuli', '乌苏里江', { c: C.ice, t: 2.4 }), mk([42.4, 122.8], 'Liao', '辽河', { c: C.ice, t: 2.6 })],
        task: ['Trace the three orange mountain ranges: what shape do they make around the plains?', '描一描三条橙色山脉：它们在平原周围围成什么形状？'],
        body: ['Heilongjiang, Jilin and Liaoning form the Northeast. The Greater Khingan in the west, the Lesser Khingan in the north and the Changbai Mountains in the east form a horseshoe that wraps around wide plains. The Heilong (Amur), Wusuli, Songhua and Liao rivers drain it. The snowy peaks of Changbai and the dark rivers give the old name "white mountains and black waters".',
          '东北三省包括黑龙江、吉林、辽宁。西面是大兴安岭，北面是小兴安岭，东面是长白山，山地呈马蹄形环绕着广阔的平原；黑龙江、乌苏里江、松花江、辽河等河流流经这里。长白山终年积雪，黑龙江江水黝黑，所以东北又被称为“白山黑水”。'],
      },
      {
        title: ['Three great plains', '三大平原'], cam: [45.5, 126, 1.6], sketch: true,
        paint: [{ fill: { k: 'poly', pts: NE_PLAINS.sanjiang, c: C.green }, a: 0.6, t: 0.3 }, { fill: { k: 'poly', pts: NE_PLAINS.songnen, c: C.green }, a: 0.6, t: 0.8 },
          { fill: { k: 'poly', pts: NE_PLAINS.liaohe, c: C.green }, a: 0.6, t: 1.3 }],
        lines: [{ pts: NE_MOUNTAINS.greaterKhingan, c: C.orange, w: 3, dur: 0 }, { pts: NE_MOUNTAINS.lesserKhingan, c: C.orange, w: 3, dur: 0 }, { pts: NE_MOUNTAINS.changbai, c: C.orange, w: 3, dur: 0 }],
        marks: [mk([47.0, 132.6], 'Sanjiang Plain', '三江平原', { big: true, c: C.green, t: 0.5 }), mk([46.4, 125.2], 'Songnen Plain', '松嫩平原', { big: true, c: C.green, t: 1 }),
          mk([42.2, 122.8], 'Liaohe Plain', '辽河平原', { big: true, c: C.green, t: 1.5 })],
        fig: { k: 'bars', title: ['China\'s largest plains (approx.)', '我国最大的平原（约）'], unit: ['10,000 km²', '万平方千米'], rows: [
          { name: ['Northeast Plain', '东北平原'], v: 35, c: C.green }, { name: ['North China Plain', '华北平原'], v: 30, c: C.gold }, { name: ['Middle–lower Yangtze Plain', '长江中下游平原'], v: 20, c: C.ice }] },
        task: ['Which plain lies where three rivers meet? Name the three rivers.', '哪个平原位于三条江河汇流处？说出这三条江河。'],
        body: ['Together the Sanjiang, Songnen and Liaohe plains make the Northeast Plain, China\'s largest. The Sanjiang ("three rivers") Plain lies where the Heilong, Songhua and Wusuli meet; it was once a wetland called the "Great Northern Wilderness" and was turned into farmland from the 1950s. Today part of it is protected as wetland again.',
          '三江平原、松嫩平原和辽河平原合称东北平原，是我国面积最大的平原。三江平原由黑龙江、松花江、乌苏里江冲积而成，过去是沼泽遍布的“北大荒”，20 世纪 50 年代起被开垦为“北大仓”。现在部分地区退耕还湿，恢复和保护湿地。'],
      },
      {
        title: ['Long, cold winters', '冬季漫长严寒'], cam: [44, 124, 2.2], sketch: true,
        clock: { mode: 'year', start: T.janChina, rate: 0 }, paint: [{ fill: { k: 'temp' }, a: 0.6 }],
        lines: [{ pts: NE_THREE, c: C.white, w: 1.6, dur: 1.2, closed: true }],
        marks: [mk([53.48, 122.37], 'Mohe: −52.3 ℃ (1969)', '漠河：−52.3 ℃（1969 年）', { dot: true, c: C.white, t: 0.6 }), mk([45.75, 126.63], 'Harbin', '哈尔滨', { dot: true, t: 1 }),
          mk([41.8, 123.43], 'Shenyang', '沈阳', { dot: true, t: 1.2 })],
        fig: { k: 'climo', city: 'harbin' },
        task: ['Read the graph: how many months are below 0 ℃ in Harbin? How long is the warm season?', '读图：哈尔滨有几个月气温低于 0 ℃？温暖的季节有多长？'],
        body: ['The Northeast is China\'s highest-latitude region and is open to cold air from Siberia, so winters are long and bitter: Harbin\'s January average is about −18 ℃, and Mohe once reached −52.3 ℃. The northern edge is cold temperate, the rest temperate monsoon. Summers are short but warm and wet, with long daylight, so there is one harvest a year. Cool, moist conditions also slow the rotting of plant matter in the soil.',
          '东北纬度是全国最高的，又靠近冬季风的源地，冬季漫长而严寒：哈尔滨 1 月平均气温约 −18 ℃，漠河曾测到 −52.3 ℃。北部属寒温带，其余大部分属中温带，为温带季风气候。夏季短促但温暖湿润，白昼长，农作物一年一熟。气候冷湿，土壤中的有机质分解慢。'],
      },
      {
        title: ['The black soil', '肥沃的黑土地'], cam: [46, 126, 1.2], sketch: true,
        paint: [{ fill: { k: 'poly', pts: NE_PLAINS.songnen, c: DIM }, a: 0.75, t: 0.2 }, { fill: { k: 'poly', pts: NE_PLAINS.sanjiang, c: DIM }, a: 0.75, t: 0.5 }],
        marks: [mk([46.4, 125.2], 'Black soil', '黑土', { big: true, c: C.white, t: 0.6 }), mk([44.9, 127.2], 'Wuchang rice', '五常大米', { dot: true, c: C.gold, t: 1.2 })],
        fig: soilFig,
        task: ['Look at the figure: how many centimetres of black soil have been lost?', '看图：黑土层大约减少了多少厘米？'],
        body: ['Under the cool, damp grasslands, dead plants piled up faster than they could rot, making a thick black soil rich in humus: one of only a few great black-soil regions in the world. "Squeeze it and oil comes out; plant a chopstick and it sprouts." But after decades of farming, wind and water erosion and too much fertiliser, the black layer has thinned. Now crop rotation, leaving straw on fields and no-till farming help, and a Black Soil Protection Law came into force in 2022.',
          '东北气候冷湿，植物残体分解慢，积累了大量腐殖质，形成深厚的黑土，是世界上仅有的几大黑土区之一，“捏把黑土冒油花，插双筷子也发芽”。但长期过度开垦、风蚀水蚀和过量使用化肥，使黑土层变薄、变瘦。如今通过轮作、秸秆还田、保护性耕作等措施保护黑土地，2022 年《黑土地保护法》施行。'],
      },
      {
        title: ['China\'s granary', '“中华大粮仓”'], cam: [45.5, 126, 1.7], sketch: true,
        paint: [{ fill: { k: 'poly', pts: NE_THREE, c: C.gold, clip: CN }, a: 0.32 }],
        marks: [mk([47.4, 132.4], 'Rice, soybeans', '水稻、大豆', { c: C.gold, t: 0.4 }), mk([46.4, 125.2], 'Maize, soybeans, spring wheat', '玉米、大豆、春小麦', { c: C.gold, t: 0.8 }),
          mk([42.2, 122.8], 'Maize, rice, sorghum', '玉米、水稻、高粱', { c: C.gold, t: 1.2 }), mk([41.0, 125.3], 'Apples, ginseng (south)', '苹果、人参（南部）', { c: C.green, t: 1.6 })],
        fig: { k: 'bars', title: ['Grain output by province, 2023 (approx.)', '各省粮食产量，2023 年（约）'], unit: ['million t', '百万吨'], rows: [
          { name: ['Heilongjiang', '黑龙江'], v: 77.9, c: C.gold }, { name: ['Henan', '河南'], v: 66.2, c: DIM }, { name: ['Shandong', '山东'], v: 56.6, c: DIM },
          { name: ['Jilin', '吉林'], v: 41.9, c: C.gold }, { name: ['Anhui', '安徽'], v: 41.5, c: DIM }] },
        task: ['Henan grows a lot of grain too. Why does the Northeast sell much more of its grain to other provinces?', '河南粮食产量也很高，为什么东北能调出的商品粮却多得多？'],
        body: ['Flat, fertile land, summer rain and heat at the same time, and large farms with big machines make the Northeast China\'s biggest commodity grain base: it sends grain to the rest of the country. With fewer people than the North China Plain, much more grain is left over to sell. Heilongjiang grows the most grain of any province, and the Northeast is famous for maize, soybeans, spring wheat and high-quality rice.',
          '东北地势平坦，土壤肥沃，雨热同期，耕地集中连片，便于大规模机械化生产，是我国最大的商品粮基地。这里人口相对较少，粮食商品率高，能向全国大量调出粮食。黑龙江粮食产量居全国首位，东北盛产玉米、大豆、春小麦和优质水稻。'],
      },
      {
        title: ['An old industrial base', '老工业基地'], cam: [44, 124, 1.5], sketch: true,
        lines: [{ pts: [[46.59, 125.1], [45.75, 126.63], [43.88, 125.32], [41.8, 123.43], [41.11, 122.99], [38.91, 121.6]], c: C.violet, w: 2.4, dur: 1.6 }],
        marks: [mk([46.59, 125.1], 'Daqing: oil', '大庆：石油', { dot: true, c: C.orange, t: 0.4 }), mk([45.75, 126.63], 'Harbin: power equipment', '哈尔滨：电站设备', { dot: true, t: 0.7 }),
          mk([43.88, 125.32], 'Changchun & Jilin: cars, chemicals', '长春·吉林：汽车、化工', { dot: true, t: 1 }),
          mk([41.8, 123.43], 'Shenyang & Fushun: machinery, coal', '沈阳·抚顺：机械、煤炭', { dot: true, t: 1.4 }),
          mk([41.11, 122.99], 'Anshan: steel', '鞍山：钢铁', { dot: true, t: 1.8 }), mk([38.91, 121.6], 'Dalian: ships, port', '大连：造船、港口', { dot: true, t: 2 })],
        task: ['Follow the purple railway: which resources and industries line it up?', '沿紫色铁路看：沿线分布着哪些资源和工业？'],
        body: ['Coal, iron ore and oil, plus railways and the port of Dalian, made the Northeast China\'s first heavy-industry base after 1949: Anshan steel, Daqing oil (from 1959), Changchun cars, Shenyang machinery. Later, old factories and running-down mines brought hard times. Since 2003, "revitalising the Northeast" has upgraded industry towards high-end equipment, new energy and services.',
          '东北煤、铁、石油等资源丰富，铁路密集，又有大连港，新中国成立后成为我国最早的重工业基地：鞍山的钢铁、大庆的石油（1959 年发现）、长春的汽车、沈阳的机械……后来由于设备老化、资源枯竭，一度陷入困境。2003 年起实施“振兴东北老工业基地”战略，向高端装备、新能源和现代服务业转型。'],
      },
      {
        title: ['Ice and snow', '冰雪旅游'], cam: [45, 127, 1.4], sketch: true, items: ['fs_harbin'],
        clock: { mode: 'year', start: T.janChina, rate: 0 }, paint: [{ fill: { k: 'temp' }, a: 0.45 }],
        marks: [mk([45.75, 126.63], 'Harbin Ice and Snow World', '哈尔滨冰雪大世界', { dot: true, big: true, c: C.white, t: 0.4 }), mk([44.75, 128.45], 'Yabuli skiing', '亚布力滑雪', { dot: true, c: C.white, t: 0.8 }),
          mk([43.8, 126.5], 'Jilin rime', '吉林雾凇', { dot: true, c: C.white, t: 1.2 }), mk([42.0, 128.1], 'Changbai Mountains', '长白山', { dot: true, c: C.white, t: 1.6 })],
        task: ['How has the cold, once a problem, become a resource?', '曾经的“冷”是怎样变成资源的？'],
        body: ['The long cold winter is now a resource. Harbin, the "ice city", holds a famous ice and snow festival with buildings carved from Songhua River ice; Yabuli has some of China\'s best ski slopes, and Jilin is famous for rime-covered trees. Harbin hosted the Asian Winter Games in 2025. "Ice and snow are also mountains of gold and silver": tourism is a new engine of growth.',
          '漫长的冬季如今成为宝贵的资源。“冰城”哈尔滨用松花江的冰块雕成冰雪大世界，亚布力有我国一流的滑雪场，吉林雾凇闻名全国。2025 年哈尔滨举办了亚洲冬季运动会。“冰天雪地也是金山银山”，冰雪旅游成为东北经济发展的新动力。'],
      },
    ],
    quiz: [
      { q: ['Label the map.', '标注地图。'],
        place: [{ text: ['Greater Khingan', '大兴安岭'], at: [49.5, 121.0], tolKm: 200 }, { text: ['Lesser Khingan', '小兴安岭'], at: [48.7, 128.4], tolKm: 180 },
          { text: ['Changbai Mountains', '长白山'], at: [42.3, 127.6], tolKm: 180 }, { text: ['Sanjiang Plain', '三江平原'], at: [47.0, 132.6], tolKm: 180 }],
        why: ['Greater Khingan in the west, Lesser Khingan in the north, Changbai in the east; the Sanjiang Plain is in the far northeast.', '大兴安岭在西，小兴安岭在北，长白山在东；三江平原在东北角。'] },
      { q: ['Match each city with its best-known industry.', '把城市与其著名的工业连起来。'],
        match: [[['Daqing', '大庆'], ['Oil', '石油']], [['Anshan', '鞍山'], ['Steel', '钢铁']], [['Changchun', '长春'], ['Cars', '汽车']], [['Harbin', '哈尔滨'], ['Power equipment', '电站设备']]],
        why: ['Industries grew next to resources (oil, iron ore) and along the railways.', '工业依托石油、铁矿等资源和铁路发展起来。'] },
      { q: ['Which city could this climate graph be from?', '这幅气候图可能是哪个城市的？'], fig: { k: 'climo', city: 'harbin', blind: true },
        options: [['Harbin', '哈尔滨'], ['Shanghai', '上海'], ['Lhasa', '拉萨'], ['Urumqi', '乌鲁木齐']], answer: 0,
        why: ['A very cold winter, warm summer and summer rain: a temperate monsoon climate in the Northeast.', '冬季严寒，夏季温暖多雨：东北的温带季风气候。'] },
      { q: ['Harbin: January −17.6 ℃, July 23.5 ℃. What is the annual temperature range?', '哈尔滨 1 月均温 −17.6 ℃，7 月均温 23.5 ℃。气温年较差是多少？'], num: { answer: 41.1, tol: 1, unit: ['℃', '℃'] },
        why: ['23.5 − (−17.6) = 41.1 ℃: a huge range, typical of high latitudes in the monsoon east.', '23.5 −（−17.6）= 41.1 ℃，气温年较差很大。'] },
      { q: ['Why is the Northeast\'s black soil so fertile? (choose all)', '东北黑土肥沃的原因有哪些？（多选）'],
        options: [['Lots of dead grass and leaves each year', '每年有大量枯枝落叶'], ['Cold winters slow down rotting', '冬季寒冷，分解缓慢'], ['Humus builds up over a long time', '腐殖质长期积累'],
          ['Heavy rain all year washes it', '全年多雨冲刷'], ['Lots of chemical fertiliser', '大量施用化肥']], multi: [0, 1, 2],
        why: ['Humus accumulates because the cold slows decay; fertiliser and erosion actually harm the soil.', '寒冷使有机质分解慢而积累；化肥和冲刷反而会破坏黑土。'] },
      { q: ['Order these cities from north to south.', '按从北到南的顺序排列这些城市。'],
        order: [['Mohe', '漠河'], ['Harbin', '哈尔滨'], ['Changchun', '长春'], ['Shenyang', '沈阳'], ['Dalian', '大连']],
        why: ['Mohe is China\'s northernmost town; Dalian is at the tip of the Liaodong Peninsula.', '漠河是我国最北的城镇，大连在辽东半岛南端。'] },
      { q: ['Tap Daqing, China\'s famous oil city.', '在地图上点出著名的石油城——大庆。'], at: [46.59, 125.1], tolKm: 120,
        why: ['Daqing is in western Heilongjiang on the Songnen Plain.', '大庆位于黑龙江西部的松嫩平原上。'] },
    ],
  },
  {
    id: 'loess', strand: 'china', tracks: [], grade: 'g8b', unit: regions, icon: 'mountain', minutes: 9,
    title: ['The Loess Plateau', '黄土高原'],
    blurb: ['Dust blown from the northwest built the world\'s largest loess plateau; rain has cut it into a thousand gullies.', '西北吹来的尘土堆成世界最大的黄土高原，雨水又把它切割得千沟万壑。'],
    keys: [
      ['The Loess Plateau is the world\'s largest area of loess, mostly 50–80 m thick.', '黄土高原是世界上最大的黄土堆积区，黄土一般厚 50～80 米。'],
      ['Most scientists think the loess was blown in by wind from the deserts to the northwest.', '多数科学家认为，黄土是由西北方向的风从荒漠地区搬运而来的（风成说）。'],
      ['Loose soil, summer rainstorms, few plants and human overuse cause severe soil erosion.', '土质疏松、夏季多暴雨、植被稀少以及人类不合理利用，造成严重的水土流失。'],
      ['Treatment: return farmland to forest and grass, build terraces and check dams.', '治理措施：退耕还林还草，修梯田，打坝淤地。'],
    ],
    steps: [
      {
        title: ['A plateau of yellow earth', '黄土堆成的高原'], cam: [36.8, 108.5, 1.6], sketch: true,
        paint: [{ fill: { k: 'poly', pts: LOESS_PLATEAU, c: C.gold, clip: CN }, a: 0.5, t: 0.3 }],
        lines: [{ pts: YELLOW.slice(14, YR.taohuayu + 2), c: C.ice, w: 2.4, dur: 2 }, { pts: LOESS_PLATEAU, c: C.gold, w: 1.6, dur: 2, closed: true }],
        marks: [mk([39.15, 109.2], 'Great Wall', '长城', { c: C.white, t: 1 }), mk([33.9, 108.3], 'Qinling', '秦岭', { c: C.white, t: 1.2 }), mk([38.2, 114.5], 'Taihang', '太行山', { c: C.white, t: 1.4 }),
          mk([37.2, 102.87], 'Wushaoling', '乌鞘岭', { c: C.white, t: 1.6 }), mk([36.6, 109.49], "Yan'an", '延安', { dot: true, t: 2 }), mk([36.06, 103.83], 'Lanzhou', '兰州', { dot: true, t: 2.2 })],
        task: ['Find the four edges: which mountains or ranges border the plateau on each side?', '找出四条边界：高原的东、南、西、北分别以什么为界？'],
        body: ['Between the Taihang Mountains in the east, Wushaoling in the west, the Qinling in the south and the Great Wall in the north lies the Loess Plateau: about 640,000 km², mostly 1,000–2,000 m high. It is covered by loess, a fine, yellow, crumbly soil, usually 50–80 m deep and over 300 m near Lanzhou. It is the largest area of loess on Earth.',
          '黄土高原东起太行山，西至乌鞘岭，南连秦岭，北抵长城，面积约 64 万平方千米，海拔多在 1000～2000 米。这里覆盖着深厚的黄土，黄土颗粒细、质地疏松，厚度一般在 50～80 米，兰州附近超过 300 米，是世界上最大的黄土堆积区。'],
      },
      {
        title: ['Built by the wind', '风吹来的黄土'], cam: [39, 106, 2], sketch: true,
        paint: [{ fill: { k: 'poly', pts: LOESS_PLATEAU, c: C.gold, clip: CN }, a: 0.42 }],
        lines: arrows([[[43.5, 98], [40.5, 103.5], [37.6, 108]], [[44, 103], [40.6, 107], [37.6, 110.6]], [[41.5, 96.5], [38.4, 101.5], [36.3, 105.2]]], C.orange, 2.2, 2.2),
        marks: DUST_SOURCES.map((d, i) => mk(d.at, d.en, d.zh, { c: C.orange, t: 0.4 + i * 0.3 })),
        fig: grainFig,
        task: ['Look at the figure: why are grains coarser in the northwest of the plateau and finer in the southeast?', '看图：为什么高原西北部的黄土颗粒粗，东南部的颗粒细？'],
        body: ['Where did so much fine dust come from? Over the last 2.6 million years, strong northwest winter winds lifted dust from the deserts and the Gobi of the northwest and dropped it here. Evidence: the grains get finer and the loess thinner from northwest to southeast, as the wind dropped heavy grains first; and the loess drapes over hills and valleys alike, like snow. This is the wind-origin theory.',
          '这么多细土从哪里来？多数科学家认为：近 260 万年来，冬季强劲的西北风把西北荒漠和戈壁的沙尘吹起，搬运到这里沉积下来，这就是“风成说”。证据之一是：从西北向东南，黄土颗粒由粗变细，厚度由厚变薄——风力减弱，粗颗粒先落下；而且黄土像雪一样覆盖在高低不同的地面上。'],
      },
      {
        title: ['A thousand gullies', '千沟万壑'], cam: [36.6, 108.5, 1.05], sketch: true,
        paint: [{ fill: { k: 'poly', pts: LOESS_PLATEAU, c: C.gold, clip: CN }, a: 0.35 }],
        marks: [mk([35.6, 107.7], 'Dongzhi tableland (yuan)', '董志塬', { dot: true, c: C.gold, t: 0.4 }), mk([35.75, 109.4], 'Luochuan tableland', '洛川塬', { dot: true, c: C.gold, t: 0.7 }),
          mk([36.86, 109.32], 'Ridges and hillocks', '梁峁沟壑', { dot: true, c: C.orange, t: 1 }), mk([37.5, 110.25], 'Suide', '绥德', { dot: true, t: 1.3 })],
        fig: formsFig,
        task: ['Match the three shapes in the figure with their names: which is flat-topped, which long, which round?', '对照图中三种地形：哪种顶面平坦？哪种是长条形？哪种是圆丘形？'],
        body: ['Running water has cut the soft loess into a maze of gullies. Three landforms are typical. A yuan is a broad, flat-topped tableland with steep edges — the best farmland. A liang is a long ridge left between parallel gullies. A mao is a small round hill, what remains when a ridge is cut up further. The more erosion, the more yuan turn into liang and mao.',
          '流水把疏松的黄土切割得支离破碎，千沟万壑。典型地貌有三种：塬——顶面平坦宽阔、四周陡峭的台地，是最好的耕地；梁——平行沟谷之间长条状的高地；峁——梁被进一步切割后形成的圆丘。侵蚀越强烈，塬就越多地变成梁和峁。'],
      },
      {
        title: ['Why the soil washes away', '水土流失的原因'], cam: [36.6, 109, 1.2], sketch: true,
        paint: [{ fill: { k: 'poly', pts: LOESS_PLATEAU, c: C.orange, clip: CN }, a: 0.4 }],
        lines: arrows([[[36.6, 109.3], [36.8, 110.4]], [[37.5, 109.4], [37.4, 110.3]], [[35.8, 108.4], [35.2, 109.2]]], C.ice, 2, 1.4),
        marks: [mk([36.6, 109.49], "Yan'an", '延安', { dot: true, t: 0.4 })],
        fig: { k: 'line', title: ["Yan'an: monthly rainfall (approx.)", '延安各月降水量（约）'], unit: ['mm', '毫米'], x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], min: 0, max: 120,
          series: [{ name: ['Rain', '降水量'], c: C.ice, y: [3, 7, 15, 28, 47, 70, 110, 100, 77, 38, 13, 3] }],
          notes: [{ x: 6, text: ['Jun–Sep: about 70%', '6—9 月约占 70%'] }] },
        task: ['Read the graph: in which months does most rain fall? Why does that matter for loose soil?', '读图：降水集中在哪几个月？这对疏松的黄土有什么影响？'],
        body: ['Natural causes: loess is loose and soaks up water, then crumbles; most rain falls in a few summer rainstorms; and the slopes are steep with few plants to protect the soil. Human causes made it much worse: over centuries forests were cut, grassland ploughed and slopes over-farmed and over-grazed. Every year the plateau lost vast amounts of soil to the Yellow River.',
          '自然原因：黄土疏松，遇水易崩解；降水集中在夏季，且多暴雨；地面坡度大，植被稀少，地表缺少保护。人为原因：长期以来毁林开荒、过度放牧、陡坡开垦，破坏了植被，加剧了水土流失。黄土高原每年都有大量泥沙被冲入黄河。'],
      },
      {
        title: ['Effects: poor land, a muddy river', '水土流失的危害'], cam: [37, 111, 2], sketch: true,
        paint: [{ fill: { k: 'poly', pts: LOESS_PLATEAU, c: C.orange, clip: CN }, a: 0.38 }],
        lines: [{ pts: YELLOW.slice(YR.hekou), c: C.gold, w: 4, dur: 2.4, flow: true }],
        marks: [mk([36.4, 116.8], 'Raised riverbed downstream', '下游河床抬高', { c: C.gold, t: 1.8 }), mk([37.2, 108.6], 'Thin, poor soil', '土地贫瘠', { c: C.orange, t: 0.6 })],
        fig: { k: 'line', title: ['Silt reaching the Yellow River from the plateau (approx., 10-year averages)', '黄河年输沙量变化（约，十年平均）'], unit: ['100 million t', '亿吨'],
          x: [1955, 1965, 1975, 1985, 1995, 2005, 2015], min: 0, max: 20, series: [{ name: ['Silt', '输沙量'], c: C.gold, y: [18, 15, 13, 8, 8, 3, 2] }] },
        task: ['How much has the silt fallen from the 1950s to the 2010s?', '从 20 世纪 50 年代到 21 世纪 10 年代，输沙量减少了多少？'],
        body: ['Erosion strips away the fertile topsoil, so farms yield less and people stay poor; gullies cut up the land and make travel hard. The soil ends up in the Yellow River, filling reservoirs and raising the riverbed downstream. Thanks to decades of treatment, the silt reaching the river has fallen sharply.',
          '水土流失使表层肥沃的土壤流失，土地贫瘠，农业减产，群众生活贫困；沟壑纵横，交通不便。大量泥沙进入黄河，淤积水库，抬高下游河床。经过几十年的治理，入黄泥沙大幅减少。'],
      },
      {
        title: ['Treating the land', '综合治理'], cam: [37, 108.8, 1.2], sketch: true,
        paint: [{ fill: { k: 'poly', pts: LOESS_PLATEAU, c: C.green, clip: CN }, a: 0.4, t: 0.4 }],
        marks: [mk([36.93, 108.18], 'Wuqi: first to return farmland to forest (1999)', '吴起：率先退耕还林（1999 年）', { dot: true, c: C.green, t: 0.6 }),
          mk([38.05, 110.2], 'Check dams', '淤地坝', { dot: true, c: C.gold, t: 1 }), mk([35.5, 105.7], 'Terraces', '梯田', { dot: true, c: C.gold, t: 1.4 })],
        fig: treatFig,
        task: ['In the figure, which measure works on the slopes, which in the gully bottom, which on the tops?', '在图中，哪些措施用在坡面上？哪些用在沟底？哪些用在顶部？'],
        body: ['Treatment works from top to bottom: trees and grass on steep slopes and hilltops ("returning farmland to forest and grass", since 1999); terraces on gentler slopes that hold water and soil; and check dams across gullies that trap silt and turn it into flat new fields ("building dams to make land"). Vegetation cover rose from about 32% in 1999 to over 60% today, and the plateau has turned green.',
          '治理要因地制宜、综合治理：陡坡和梁峁顶部退耕还林还草（1999 年起）；缓坡修梯田，保水保土保肥；沟谷中打坝淤地，拦截泥沙，造出平坦的坝地。黄土高原的植被覆盖度从 1999 年的约 32% 提高到现在的 60% 以上，“黄”土高原正在变绿。'],
      },
      {
        title: ['Caves and waist drums', '窑洞与安塞腰鼓'], cam: [36.8, 109.4, 1.05], sketch: true,
        paint: [{ fill: { k: 'poly', pts: LOESS_PLATEAU, c: C.gold, clip: CN }, a: 0.32 }],
        marks: [mk([36.6, 109.49], "Yan'an & Ansai: cave homes, waist drums", '延安·安塞：窑洞、腰鼓', { dot: true, c: C.gold, t: 0.4 })],
        fig: yaodongFig,
        task: ['Why is a cave dwelling warm in winter and cool in summer?', '窑洞为什么冬暖夏凉？'],
        body: ['Loess is firm and does not collapse easily when dry, so people dug homes into the hillsides: cave dwellings (yaodong). Thick earth keeps them warm in winter and cool in summer, and they need little wood, which is scarce here. The plateau also gave rise to loud, bold folk arts: Ansai waist drums, xintianyou folk songs and paper-cuts.',
          '黄土直立性好，干燥时不易坍塌，人们在山坡上挖洞而居，这就是窑洞。厚厚的黄土使窑洞冬暖夏凉，而且省木料（这里树木少）。黄土高原还孕育了粗犷豪放的民间艺术，如安塞腰鼓、信天游、剪纸等。'],
      },
    ],
    quiz: [
      { q: ['Match each landform with its description.', '把黄土地貌与特征连起来。'],
        match: [[['Yuan', '塬'], ['Broad and flat-topped, steep sides', '顶面平坦宽阔，四周陡峭']], [['Liang', '梁'], ['A long ridge', '长条状的高地']], [['Mao', '峁'], ['A small round hill', '圆丘状的小山']]],
        why: ['Erosion turns yuan into liang and then mao.', '侵蚀加剧时，塬逐渐变成梁，再变成峁。'] },
      { q: ['Put this chain of cause and effect in order.', '把这条因果链按顺序排列。'],
        order: [['Plants removed from slopes', '坡地植被被破坏'], ['Summer rainstorms hit bare loose soil', '夏季暴雨冲刷裸露疏松的黄土'], ['Soil washes into rivers', '泥沙流入河流'],
          ['Silt settles on the lower Yellow River bed', '泥沙淤积在黄河下游河床'], ['The riverbed rises above the land', '河床高出地面']],
        why: ['Erosion on the plateau and the above-ground river downstream are one connected problem.', '黄土高原的水土流失与黄河下游的地上河是相互联系的。'] },
      { q: ['Which are natural causes of erosion on the plateau? (choose all)', '下列属于黄土高原水土流失自然原因的有（多选）'],
        options: [['Loose loess', '黄土疏松'], ['Rain falls in summer rainstorms', '夏季多暴雨'], ['Sparse vegetation on steep slopes', '坡陡，植被稀少'], ['Ploughing steep slopes', '陡坡开垦'], ['Over-grazing', '过度放牧']], multi: [0, 1, 2],
        why: ['Ploughing steep slopes and over-grazing are human causes.', '陡坡开垦和过度放牧是人为原因。'] },
      { q: ['In this figure, what is the structure built across the gully bottom for?', '图中修在沟底的坝主要作用是什么？'], fig: treatFig,
        options: [['Trapping silt to make new flat fields', '拦截泥沙，淤出坝地'], ['Generating hydropower', '水力发电'], ['Storing water for cities', '为城市供水'], ['Helping ships pass', '方便通航']], answer: 0,
        why: ['Check dams trap silt behind them; the silt becomes flat, fertile fields.', '淤地坝拦截泥沙，淤积成平坦肥沃的坝地。'] },
      { q: ['From the 1950s to the 2010s, by about how much did the yearly silt fall (100 million t)?', '据图，20 世纪 50 年代到 21 世纪 10 年代，年输沙量约减少了多少亿吨？'],
        fig: { k: 'line', title: ['Yellow River silt (approx., 10-year averages)', '黄河年输沙量（约，十年平均）'], unit: ['100 million t', '亿吨'], x: [1955, 1965, 1975, 1985, 1995, 2005, 2015], min: 0, max: 20,
          series: [{ name: ['Silt', '输沙量'], c: C.gold, y: [18, 15, 13, 8, 8, 3, 2] }] },
        num: { answer: 16, tol: 2, unit: ['100 million t', '亿吨'] },
        why: ['About 18 − 2 = 16 hundred million tonnes: the treatment has worked.', '约 18 − 2 = 16 亿吨，治理效果显著。'] },
      { q: ['Label the map.', '标注地图。'],
        place: [{ text: ['Loess Plateau', '黄土高原'], at: [36.8, 108.5], tolKm: 300 }, { text: ['Tengger Desert', '腾格里沙漠'], at: [38.6, 104.5], tolKm: 220 },
          { text: ['North China Plain', '华北平原'], at: [36.5, 116.0], tolKm: 300 }],
        why: ['The dust came from the deserts northwest of the plateau; the silt ends up on the plain to the east.', '黄土来自高原西北的荒漠，泥沙最终淤积在东边的平原上。'] },
      { q: ['Why are cave dwellings common on the Loess Plateau?', '黄土高原为什么多窑洞？'],
        options: [['Loess is thick and stands firm when dry', '黄土深厚，干燥时直立性好'], ['It rains a lot all year', '全年多雨'], ['There is plenty of timber', '木材丰富'], ['The ground is rocky', '地面多岩石']], answer: 0,
        why: ['Thick, firm loess can be dug into; timber is scarce and the climate is dry.', '黄土深厚、直立性好，便于挖掘；这里木材少，气候较干。'] },
    ],
  },
  {
    id: 'sanjiangyuan', strand: 'china', tracks: [], grade: 'g8b', unit: regions, icon: 'mountain', minutes: 10,
    title: ['Qinghai–Tibet: roof of the world, source of rivers', '青藏地区：世界屋脊与江河源'],
    blurb: ['High and cold but sunny: the sources of great rivers, yak pastures, barley valleys and a railway on frozen ground.', '高寒而日照强烈：大江大河的源头、牦牛牧场、青稞河谷和冻土上的铁路。'],
    keys: [
      ['The region averages over 4,000 m: its main feature is high and cold, with thin air and very strong sunlight.', '青藏地区平均海拔 4000 米以上，主要自然特征是高寒，空气稀薄，太阳辐射强，日照时间长。'],
      ['Sanjiangyuan in Qinghai is the source of the Yangtze, the Yellow River and the Lancang: "China\'s water tower".', '青海的三江源地区是长江、黄河、澜沧江的发源地，被誉为“中华水塔”。'],
      ['Herding (yaks, Tibetan sheep) on high pastures; farming (highland barley) only in warm valleys like the Yarlung Tsangpo and Huangshui.', '高寒牧区放牧牦牛、藏绵羊；河谷农业分布在雅鲁藏布江谷地、湟水谷地等，种植青稞等。'],
      ['The Qinghai–Tibet Railway overcame permafrost, thin air and fragile ecology.', '青藏铁路克服了多年冻土、高寒缺氧和生态脆弱三大难题。'],
    ],
    steps: [
      {
        title: ['The roof of the world', '世界屋脊'], cam: [32, 89, 2.7], sketch: true, items: ['everest'],
        paint: [{ fill: { k: 'poly', pts: QT_POLY, c: REGION_C.qt, clip: CN }, a: 0.4 }],
        lines: [{ pts: QT_EDGE, c: C.white, w: 1.6, dur: 1.6 }],
        marks: [mk([32.5, 88], 'Average over 4,000 m', '平均海拔 4000 米以上', { big: true, c: REGION_C.qt, t: 0.6 }), mk([29.65, 91.1], 'Lhasa 3,650 m', '拉萨 3650 米', { dot: true, t: 1 }),
          mk([36.62, 101.78], 'Xining 2,260 m', '西宁 2260 米', { dot: true, t: 1.3 })],
        fig: { k: 'climo', city: 'lhasa', b: 'shanghai' },
        task: ['Lhasa and Shanghai are at almost the same latitude. Compare their July temperatures.', '拉萨和上海纬度相近，比较两地 7 月气温。'],
        body: ['The Qinghai–Tibet Plateau is the highest and largest plateau on Earth, so it is called the "roof of the world". Its main feature is "high and cold": Lhasa is as far south as Shanghai, yet its July is about 12 ℃ cooler, because temperature falls about 0.6 ℃ for every 100 m you climb. Many places have no real summer, and snow can fall in any month.',
          '青藏高原是世界上海拔最高、面积最大的高原，被称为“世界屋脊”。青藏地区的主要自然特征是“高寒”：拉萨与上海纬度相近，7 月气温却低了约 12 ℃，因为海拔每升高 100 米，气温约下降 0.6 ℃。许多地方“无夏”，一年四季都可能下雪。'],
      },
      {
        title: ['Cold but sunny', '冷，但阳光强烈'], cam: [33, 95, 2.4], sketch: true,
        paint: [{ fill: { k: 'poly', pts: QT_POLY, c: C.gold, clip: CN }, a: 0.3 }],
        marks: [mk([29.65, 91.1], 'Lhasa: "sunlight city"', '拉萨：“日光城”', { dot: true, big: true, c: C.gold, t: 0.4 }), mk([36.2, 100.6], 'Talatan solar park', '塔拉滩光伏园区', { dot: true, c: C.gold, t: 0.9 })],
        fig: { k: 'bars', title: ['Sunshine hours per year (approx.)', '年日照时数（约）'], unit: ['hours', '小时'], rows: [
          { name: ['Lhasa', '拉萨'], v: 3000, c: C.gold }, { name: ['Beijing', '北京'], v: 2500, c: DIM }, { name: ['Shanghai', '上海'], v: 1800, c: DIM }, { name: ['Chengdu', '成都'], v: 1100, c: DIM }] },
        task: ['Why does thin air give stronger sunshine? How do people use it?', '为什么空气稀薄会使太阳辐射更强？人们怎样利用它？'],
        body: ['High up, the air is thin, clean and dry, so less sunlight is absorbed or reflected on the way down. Solar radiation is the strongest in China and Lhasa gets about 3,000 hours of sun a year. Days can be warm while nights freeze, and the big day–night difference makes crops sweeter. Today vast solar parks, like Talatan in Qinghai, turn this sunshine into power, and the panels\' shade even helps grass grow.',
          '高原海拔高，空气稀薄、洁净、干燥，大气对太阳辐射的削弱作用小，所以太阳辐射强，是我国太阳能最丰富的地区，拉萨年日照约 3000 小时，被称为“日光城”。这里气温日较差大，有利于农作物积累养分。如今，青海塔拉滩等地建起了大型光伏电站，光伏板的遮阴还促进了草的生长。'],
      },
      {
        title: ['Where three rivers begin', '三江源'], cam: [34.2, 96, 1.3], sketch: true,
        paint: [{ fill: { k: 'poly', pts: SANJIANGYUAN_AREA, c: C.teal }, a: 0.3 }],
        lines: [{ pts: YANGTZE.slice(0, 9), c: C.ice, w: 3, dur: 1.4, t: 0.3 }, { pts: YELLOW.slice(0, 9), c: C.gold, w: 3, dur: 1.4, t: 0.8 }, { pts: QT_RIVERS.lancang, c: C.green, w: 3, dur: 1.4, t: 1.3 }],
        marks: [mk([33.45, 91.1], 'Yangtze source', '长江源', { dot: true, c: C.ice, t: 0.4 }), mk([35.0, 95.9], 'Yueguzonglie: Yellow River', '约古宗列：黄河源', { dot: true, c: C.gold, t: 0.9 }),
          mk([33.75, 94.68], 'Lancang source', '澜沧江源', { dot: true, c: C.green, t: 1.4 })],
        fig: { k: 'bars', title: ['Share of each river\'s water from Sanjiangyuan (approx.)', '三江源供给各河的水量比例（约）'], unit: ['%', '%'], rows: [
          { name: ['Yellow River', '黄河'], v: 49, c: C.gold }, { name: ['Yangtze', '长江'], v: 25, c: C.ice }, { name: ['Lancang', '澜沧江'], v: 15, c: C.green }] },
        task: ['Find the three sources. Which river relies most on this region for its water?', '找到三条河的源头。哪条河的水量最依赖这里？'],
        body: ['In southern Qinghai, the Yangtze, the Yellow River and the Lancang (Mekong) all begin within a few hundred kilometres of each other: this is Sanjiangyuan, "the source of three rivers". Glaciers, snowfields, lakes, marshes and permafrost store water here and release it slowly. Nearly half of the Yellow River\'s water comes from here, so it is called "China\'s water tower".',
          '在青海南部，长江、黄河、澜沧江的源头相距不远，这里就是“三江源”。冰川、积雪、湖泊、沼泽和冻土储存着大量的水，并缓慢释放。黄河近一半的水量来自这里，所以三江源被誉为“中华水塔”。'],
      },
      {
        title: ['Asia\'s water tower', '亚洲水塔'], cam: [28, 97, 3.4], sketch: true, wide: true,
        lines: [RIVERS.yangtze, RIVERS.yellow, RIVERS.mekong, QT_RIVERS.yarlung, RIVERS.ganges, RIVERS.indus, RIVERS.irrawaddy].map((p, i) => ({ pts: p as LL[], c: C.ice, w: 2.4, dur: 1.6, t: i * 0.3, flow: true })),
        marks: [mk([31.4, 121.9], 'Yangtze → East China Sea', '长江 → 东海', { c: C.ice, t: 1 }), mk([37.75, 119.2], 'Yellow → Bohai', '黄河 → 渤海', { c: C.ice, t: 1.3 }),
          mk([10.2, 106.5], 'Lancang–Mekong → South China Sea', '澜沧江—湄公河 → 南海', { c: C.ice, t: 1.6 }), mk([22.0, 90.2], 'Yarlung Tsangpo → Bay of Bengal', '雅鲁藏布江 → 孟加拉湾', { c: C.ice, t: 1.9 }),
          mk([24.0, 67.5], 'Indus → Arabian Sea', '印度河 → 阿拉伯海', { c: C.ice, t: 2.2 })],
        task: ['How many countries depend on rivers that start on this plateau?', '有多少国家依赖发源于这片高原的河流？'],
        body: ['With the most glaciers outside the polar regions, the plateau feeds many of Asia\'s great rivers: the Yangtze, Yellow and Lancang–Mekong flow east; the Yarlung Tsangpo (Brahmaputra), Ganges and Indus flow south to the Indian Ocean. Over a billion people live downstream. As the climate warms, the glaciers are shrinking, which threatens this supply.',
          '青藏高原是除两极以外冰川最多的地区，是亚洲许多大河的发源地：长江、黄河、澜沧江—湄公河向东流，雅鲁藏布江（布拉马普特拉河）、恒河、印度河向南注入印度洋。下游生活着十多亿人。全球变暖使冰川退缩，威胁着这座“亚洲水塔”。'],
      },
      {
        title: ['High, cold pastures', '高寒牧区'], cam: [33, 95, 2.2], sketch: true, items: ['an_yak'],
        paint: [{ fill: { k: 'poly', pts: QT_POLY, c: C.green, clip: CN }, a: 0.28 }],
        marks: [mk([31.48, 92.05], 'Nagqu pastures', '那曲牧区', { dot: true, c: C.green, t: 0.4 }), mk([34.0, 100.2], 'Golog / Yushu pastures', '果洛、玉树牧区', { c: C.green, t: 0.8 }),
          mk([36.9, 100.2], 'Qinghai Lake grassland', '青海湖草原', { dot: true, c: C.green, t: 1.2 })],
        fig: pastureFig,
        task: ['In the figure, where do herders take their animals in summer, and where in winter?', '看图：牧民夏季和冬季分别在哪里放牧？'],
        body: ['Most of the plateau is too high and cold for crops, but it has vast grasslands. Herders raise animals that thrive in thin, cold air: the yak ("boat of the plateau"), with thick hair and big lungs, Tibetan sheep and goats. They move between high summer pastures and lower winter pastures. Over-grazing damages the thin turf, so grazing limits and "returning pasture to grassland" protect it.',
          '高原大部分地区海拔高、气温低，不适宜种植业，但草场广阔，是我国重要的牧区。这里饲养适应高寒缺氧环境的牦牛（“高原之舟”，毛长、肺活量大）、藏绵羊、藏山羊等。牧民在夏季高山牧场和冬季低处牧场之间转场。过度放牧会破坏脆弱的草皮，因此要以草定畜、退牧还草。'],
      },
      {
        title: ['Valley farming', '河谷农业'], cam: [31, 94, 2.2], sketch: true,
        lines: [{ pts: QT_RIVERS.yarlung, c: C.ice, w: 3, dur: 2 }, { pts: QT_RIVERS.lhasa, c: C.ice, w: 2.2, dur: 0.8, t: 1 }, { pts: QT_RIVERS.nyang, c: C.ice, w: 2.2, dur: 0.6, t: 1.2 },
          { pts: QT_RIVERS.huangshui, c: C.ice, w: 2.4, dur: 0.8, t: 1.4 }],
        marks: [mk([28.5, 86.6], 'Yarlung Tsangpo valley', '雅鲁藏布江谷地', { c: C.green, t: 0.8 }), mk([36.62, 101.78], 'Huangshui valley', '湟水谷地', { dot: true, c: C.green, t: 1.4 }),
          mk([29.27, 88.88], 'Shigatse', '日喀则', { dot: true, t: 1.6 }), mk([29.65, 91.1], 'Lhasa', '拉萨', { dot: true, t: 1.8 }), mk([31.48, 92.05], 'Nagqu', '那曲', { dot: true, t: 2 })],
        fig: { k: 'bars', title: ['Elevation of plateau towns (approx.)', '高原城镇的海拔（约）'], unit: ['m', '米'], rows: [
          { name: ['Xining', '西宁'], v: 2260, c: C.green }, { name: ['Lhasa', '拉萨'], v: 3650, c: C.green }, { name: ['Shigatse', '日喀则'], v: 3840, c: C.green }, { name: ['Nagqu', '那曲'], v: 4500, c: DIM }] },
        task: ['Compare the heights: why is Nagqu a herding area, while Lhasa and Xining have farms?', '比较海拔：为什么那曲以畜牧为主，而拉萨、西宁一带有种植业？'],
        body: ['Farming is possible only in the lower, warmer river valleys: the Yarlung Tsangpo and its tributaries the Lhasa and Nyang in Tibet, and the Huangshui in Qinghai. The valleys are sheltered, flat, have water to irrigate and long hours of strong sun. The main crop is highland barley (qingke), roasted into tsampa; there are also wheat, rape and peas. Strong sun and cold nights give big grains and high yields.',
          '种植业只分布在海拔较低、热量较充足的河谷地区，如西藏的雅鲁藏布江谷地及其支流拉萨河、年楚河谷地，青海的湟水谷地。河谷地势平坦，水源充足，日照时间长。主要作物是青稞（可做成糌粑），还有小麦、油菜、豌豆等。光照强、昼夜温差大，作物籽粒饱满，单产高。'],
      },
      {
        title: ['A railway on frozen ground', '冻土上的天路'], cam: [33.5, 96, 1.8], sketch: true, items: ['vh_qinghaitibet'],
        lines: [{ pts: QT_RAIL, c: C.orange, w: 3, dur: 3 }],
        marks: [mk([36.62, 101.78], 'Xining', '西宁', { dot: true, t: 0.2 }), mk([36.4, 94.9], 'Golmud', '格尔木', { dot: true, t: 1 }), mk([35.65, 94.06], 'Kunlun Pass', '昆仑山口', { t: 1.3 }),
          mk([34.7, 93.9], 'Hoh Xil: wildlife passages', '可可西里：动物通道', { c: C.green, t: 1.5 }), mk([32.9, 91.83], 'Tanggula Pass 5,072 m', '唐古拉山口 5072 米', { dot: true, c: C.white, t: 1.8 }),
          mk([31.48, 92.05], 'Nagqu', '那曲', { dot: true, t: 2.2 }), mk([29.65, 91.1], 'Lhasa', '拉萨', { dot: true, t: 2.8 })],
        fig: railFig,
        task: ['In the figure, how do the heat pipes and crushed rock keep the frozen ground frozen?', '看图：热棒和碎石路基怎样让冻土保持冻结？'],
        body: ['The Qinghai–Tibet Railway (1,956 km, Golmud–Lhasa opened in 2006) is the highest railway in the world, crossing Tanggula Pass at 5,072 m. It faced three hard problems. Permafrost: about 550 km runs on frozen ground that softens if warmed, so engineers used crushed-rock beds, heat pipes and long bridges. Thin air: carriages are pressurised with oxygen. Fragile ecology: 33 passages let Tibetan antelope migrate under the line.',
          '青藏铁路全长 1956 千米，格尔木至拉萨段 2006 年通车，是世界上海拔最高的铁路，唐古拉山口段海拔 5072 米。建设中克服了三大难题：多年冻土——约 550 千米经过冻土区，采用片石通风路基、热棒、以桥代路等措施；高寒缺氧——车厢供氧；生态脆弱——设置 33 处野生动物通道，方便藏羚羊迁徙。'],
      },
      {
        title: ['Protecting the source', '保护江河源'], cam: [34.5, 93.5, 1.6], sketch: true, items: ['an_snowleopard'],
        paint: [{ fill: { k: 'poly', pts: SANJIANGYUAN_AREA, c: C.green }, a: 0.36 }],
        marks: [mk([35.2, 92.5], 'Hoh Xil (World Heritage 2017)', '可可西里（2017 年世界自然遗产）', { c: C.white, t: 0.4 }), mk([34.0, 97.0], 'Sanjiangyuan National Park (2021)', '三江源国家公园（2021 年）', { big: true, c: C.green, t: 0.8 })],
        task: ['Why does protecting this remote area matter to people living thousands of kilometres away?', '为什么保护这片偏远的地区，对几千千米外的人们也很重要？'],
        body: ['The ecology here is fragile: grass grows slowly in the cold and damaged land takes decades to recover. Over-grazing, rodents, warming and poaching once caused shrinking lakes, spreading desert and falling numbers of Tibetan antelope. In 2021 Sanjiangyuan became one of China\'s first national parks; herders now work as rangers, and grassland, wetlands and wildlife are recovering. Protecting the source protects water for hundreds of millions downstream.',
          '这里生态环境脆弱，气候寒冷，草生长缓慢，一旦破坏很难恢复。过去由于过度放牧、鼠害、气候变暖和盗猎，出现了湖泊萎缩、草地退化、藏羚羊减少等问题。2021 年三江源成为我国首批国家公园之一，牧民当上了生态管护员，草原、湿地和野生动物正在恢复。保护好江河源，就是保护下游亿万人的水源。'],
      },
    ],
    quiz: [
      { q: ['Match each river with where it ends.', '把河流与它最终注入的海洋连起来。'],
        match: [[['Yangtze', '长江'], ['East China Sea', '东海']], [['Yellow River', '黄河'], ['Bohai Sea', '渤海']], [['Lancang–Mekong', '澜沧江—湄公河'], ['South China Sea', '南海']],
          [['Yarlung Tsangpo', '雅鲁藏布江'], ['Bay of Bengal', '孟加拉湾']]],
        why: ['The first three flow east to the Pacific; the Yarlung Tsangpo turns south to the Indian Ocean.', '前三条河向东注入太平洋，雅鲁藏布江向南注入印度洋。'] },
      { q: ['Lhasa (left) and Shanghai (right) are at almost the same latitude. Why is Lhasa\'s summer much cooler?', '拉萨（左）和上海（右）纬度相近，为什么拉萨夏季凉爽得多？'], fig: { k: 'climo', city: 'lhasa', b: 'shanghai' },
        options: [['It is much higher', '海拔高得多'], ['It is further north', '纬度更高'], ['It is near the sea', '靠近海洋'], ['It gets less sunshine', '日照更少']], answer: 0,
        why: ['Height is the key: about 0.6 ℃ cooler per 100 m. Lhasa actually gets more sunshine.', '关键是海拔：每升高 100 米气温约降低 0.6 ℃。拉萨的日照其实更多。'] },
      { q: ['Temperature falls about 0.6 ℃ per 100 m. Xining is at 2,260 m, Nagqu at 4,500 m. About how much colder is Nagqu because of height?', '海拔每升高 100 米气温约降低 0.6 ℃。西宁海拔 2260 米，那曲海拔 4500 米。仅因海拔，那曲比西宁约低多少摄氏度？'],
        num: { answer: 13.4, tol: 0.6, unit: ['℃', '℃'] },
        why: ['(4,500 − 2,260) ÷ 100 × 0.6 ≈ 13.4 ℃.', '（4500 − 2260）÷ 100 × 0.6 ≈ 13.4 ℃，那曲约低 13.4 ℃。'] },
      { q: ['Why can crops grow in the Yarlung Tsangpo and Huangshui valleys? (choose all)', '雅鲁藏布江谷地、湟水谷地能发展种植业的原因有（多选）'],
        options: [['Lower and warmer than the plateau around', '海拔较低，热量较充足'], ['Flat land and water to irrigate', '地势平坦，便于灌溉'], ['Long hours of strong sunshine', '日照时间长'],
          ['Heavy rain all year', '全年多雨'], ['Hot all year', '全年高温']], multi: [0, 1, 2],
        why: ['The valleys are not rainy or hot: they are just warm enough, with water from rivers.', '河谷并不多雨也不炎热，只是热量相对充足，又有河水灌溉。'] },
      { q: ['Label the map.', '标注地图。'],
        place: [{ text: ['Geladandong', '各拉丹冬'], at: [33.45, 91.1], tolKm: 180 }, { text: ['Yueguzonglie', '约古宗列'], at: [35.0, 95.9], tolKm: 180 },
          { text: ['Qinghai Lake', '青海湖'], at: [36.9, 100.2], tolKm: 150 }, { text: ['Lhasa', '拉萨'], at: [29.65, 91.1], tolKm: 150 }],
        why: ['Geladandong is the Yangtze source and Yueguzonglie the Yellow River source; Qinghai Lake is China\'s largest lake.', '各拉丹冬是长江源，约古宗列是黄河源；青海湖是我国最大的湖泊。'] },
      { q: ['Order the stations travelling from Xining to Lhasa.', '按从西宁到拉萨的顺序排列沿途地点。'],
        order: [['Xining', '西宁'], ['Golmud', '格尔木'], ['Kunlun Pass', '昆仑山口'], ['Tanggula Pass', '唐古拉山口'], ['Nagqu', '那曲'], ['Lhasa', '拉萨']],
        why: ['The line runs west to Golmud, then south over the Kunlun and Tanggula ranges to Lhasa.', '铁路先向西到格尔木，再向南翻越昆仑山、唐古拉山到达拉萨。'] },
      { q: ['What do the heat pipes beside the Qinghai–Tibet Railway do?', '青藏铁路两侧的热棒有什么作用？'], fig: railFig,
        options: [['Carry heat out of the ground so it stays frozen', '把地下的热量导出，使冻土保持冻结'], ['Heat the track to melt snow', '加热铁轨以融化积雪'],
          ['Supply oxygen to passengers', '为旅客供氧'], ['Generate electricity', '发电']], answer: 0,
        why: ['In winter they move heat from the soil to the air; if permafrost thaws, the track would sink.', '冬季热棒把土中的热量导到空中；冻土一旦融化，路基就会下沉。'] },
    ],
  },
];
