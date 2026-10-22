/** 八下 · 北京、长江三角洲、香港和澳门、台湾省、新疆、中国在世界中: the regional case studies in depth. */
import { C, arrows, mk, par, type Fig, type Lesson, type LL, type Pair } from './kit.ts';
import type { Line } from './stage.ts';
import { svg, tx, arrowDef, type Lx } from './figs.ts';
import {
  BEIJING, JINGJINJI, XIONGAN, YANSHAN, TAIHANG, GREAT_WALL_BJ, RAIL_BJ_TJ, RAIL_BJ_XA, RAIL_BJ_ZJK,
  TAIHU, YANGTZE_LOW, QIANTANG, GRAND_CANAL, YRD_REGION, YRD_CORE, DONGHAI_BRIDGE, G60, RAIL_YRD,
  PEARL_RIVERS, GBA, HZMB, SZ_ZS_LINK, XRL,
  TW_RANGES, TW_WEST_PLAIN, TW_STRAIT_NARROW, TYPHOON,
  ALTAI, TIANSHAN, KUNLUN, ALTUN, JUNGGAR, GURBANTUNGGUT, TAKLIMAKAN, XINJIANG, TARIM, TARIM_FEEDERS, TURPAN_BASIN, FLAMING_MTS, OASES,
  WEST_EAST_GAS_1, WEST_EAST_GAS_2, CENTRAL_ASIA_GAS, SILK_NORTH, SILK_SOUTH,
  BELT, ROAD, ROAD_AFRICA, CR_EXPRESS, CHINA_LAOS_RAIL, JAKARTA_BANDUNG, MOMBASA_NAIROBI, BUDAPEST_BELGRADE,
} from './geo-cn2.ts';
import { RIVERS } from './geo.ts';

const regions = ['Regions of China', '中国的地理差异与区域'] as const;
const world = ['China in the world', '中国在世界中'] as const;
const CN = ['CN'];
const TW = ['TW'];

// ---------------------------------------------------------------- figure helpers
const r = (v: number) => Math.round(v * 10) / 10;
const fig = (draw: (L: Lx, id: string) => string): Fig => ({ k: 'svg', draw });
const pts = (p: [number, number][]) => p.map(([x, y]) => `${r(x)},${r(y)}`).join(' ');
const head = (L: Lx, t: Pair, s?: Pair) => tx(4, 12, L(t), 'fg-title') + (s ? tx(4, 23, L(s), 'fg-sub') : '');
const dl = (s: number) => ` style="--d:${s}s"`;
const box = (x: number, y: number, w: number, h: number, c: string, d = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="rgba(255,255,255,.05)" stroke="${c}" class="f-fade"${dl(d)}/>`;
/** A short leader from a crowded place to its label, so neighbouring labels don't overlap. */
const lead = (from: LL, to: LL, t = 0, c: string = C.white): Line => ({ pts: [from, to], c, t, w: 0.7, dur: 0.4 });

/** Beijing's four roles as capital. */
const fourCentres = fig(L => {
  const card = (x: number, y: number, c: string, t: Pair, s: Pair, d: number) =>
    box(x, y, 124, 38, c, d) + tx(x + 62, y + 15, L(t), 'fg-label f-fade', 'm', ` style="fill:${c};--d:${d}s"`) + tx(x + 62, y + 29, L(s), 'fg-sub f-fade', 'm', dl(d));
  return svg(320, 146,
    `<line x1="128" y1="44" x2="140" y2="64" class="fg-guide"/><line x1="192" y1="44" x2="180" y2="64" class="fg-guide"/>` +
    `<line x1="128" y1="102" x2="140" y2="102" class="fg-guide"/><line x1="192" y1="102" x2="180" y2="102" class="fg-guide"/>` +
    `<circle cx="160" cy="83" r="29" fill="rgba(255,107,107,.22)" stroke="#ff6b6b" stroke-width="1.5"/>` +
    tx(160, 82, L(['Beijing', '北京']), 'fg-label', 'm') + tx(160, 94, L(['the capital', '首都']), 'fg-sub', 'm') +
    card(4, 6, '#ff6b6b', ['Political centre', '政治中心'], ['seat of the central government', '党和国家中央机关所在地'], 0.1) +
    card(192, 6, '#ffd24a', ['Cultural centre', '文化中心'], ['museums, universities, heritage', '古都风貌、博物馆、高校云集'], 0.3) +
    card(4, 104, '#3bc9db', ['International exchanges', '国际交往中心'], ['embassies, summits, Olympics', '使馆、国际会议、奥运会'], 0.5) +
    card(192, 104, '#b197fc', ['Sci-tech innovation', '科技创新中心'], ['Zhongguancun, labs, start-ups', '中关村、科研院所、新创企业'], 0.7),
  L(['Beijing: four centres', '北京的四个中心']));
});

/** North-west to south-east through Beijing: plateau, mountains, the "Beijing Bay" plain, the North China Plain, the sea. */
const bjProfile = fig((L, id) => {
  const y = (e: number) => 130 - e * 0.04;
  const p = pts(([[0, 1400], [30, 1450], [55, 1600], [75, 1900], [88, 2000], [100, 1500], [115, 800], [128, 250], [140, 80], [175, 50], [230, 20], [272, 0]] as [number, number][]).map(([x, e]) => [x, y(e)]));
  return svg(320, 150,
    arrowDef(id + 'c', '#a5d8ff') + arrowDef(id + 'w', '#ffa94d') + head(L, ['NW–SE profile through Beijing (sketch)', '北京西北—东南方向地形剖面（示意）'], ['Mountains behind, plain in front: the "Beijing Bay"', '背靠山地，面向平原：“北京湾”']) +
    `<rect x="272" y="130" width="48" height="12" class="fg-sea"/>` +
    `<polygon points="${p} 272,142 0,142" class="fg-landfill"/><polyline points="${p}" class="fg-profile f-draw" pathLength="1"/>` +
    `<circle cx="175" cy="${y(50)}" r="3.5" fill="#ff6b6b" class="f-fade"${dl(1)}/>` +
    tx(2, 66, L(['Bashang Plateau', '坝上高原']), 'fg-sub') + tx(97, 52, L(['Yanshan Mts', '燕山（军都山）']), 'fg-label') +
    tx(175, 140, L(['Beijing', '北京']), 'fg-label', 'm') + tx(232, 118, L(['North China Plain', '华北平原']), 'fg-sub', 'm') + tx(296, 140, L(['Bohai', '渤海']), 'fg-sub', 'm') +
    `<line x1="8" y1="40" x2="66" y2="40" stroke="#a5d8ff" stroke-width="1.6" marker-end="url(#${id}c)" class="f-fade"${dl(1.2)}/>` +
    tx(8, 34, L(['cold NW winds blocked', '挡住西北寒风']), 'fg-sub f-fade', 's', dl(1.2)) +
    `<line x1="312" y1="72" x2="206" y2="86" stroke="#ffa94d" stroke-width="1.6" marker-end="url(#${id}w)" class="f-fade"${dl(1.6)}/>` +
    tx(312, 66, L(['open to warm, wet sea air', '迎来温湿的海洋气流']), 'fg-sub f-fade', 'e', dl(1.6)),
  L(['Beijing terrain profile', '北京地形剖面']));
});

/** The Beijing Central Axis, south (left) to north (right). */
const axisFig = fig(L => {
  const X = (km: number) => r(24 + km * 35.4), Y = 74;
  const dot = (km: number, d: number) => `<circle cx="${X(km)}" cy="${Y}" r="3.2" fill="#ffd24a" class="f-fade"${dl(d)}/>`;
  return svg(320, 132,
    head(L, ['The Beijing Central Axis: 7.8 km', '北京中轴线：全长约 7.8 千米'], ['World Heritage since 2024 · north is to the right', '2024 年列入《世界遗产名录》· 图中右为北']) +
    `<line x1="${X(0)}" y1="${Y}" x2="${X(7.8)}" y2="${Y}" stroke="#ffd24a" stroke-width="2.4" class="f-draw" pathLength="1"/>` +
    `<rect x="136" y="${Y - 5}" width="24" height="10" fill="rgba(255,255,255,.14)"/>` +
    `<rect x="${X(4.25)}" y="${Y - 9}" width="${r(35.4)}" height="18" rx="2" fill="rgba(255,107,107,.35)" stroke="#ff6b6b" class="f-fade"${dl(1)}/>` +
    dot(0, 0.4) + dot(3, 0.7) + dot(4, 0.9) + dot(5.6, 1.2) + dot(7.6, 1.4) + dot(7.8, 1.5) +
    `<circle cx="66" cy="104" r="7" fill="none" stroke="#74c0fc" stroke-width="1.6" class="f-fade"${dl(1.7)}/>` +
    `<rect x="61" y="37" width="10" height="10" fill="none" stroke="#c0eb75" stroke-width="1.4" class="f-fade"${dl(1.8)}/>` +
    `<line x1="192" y1="53" x2="192" y2="64" class="fg-guide"/>` +
    tx(8, Y + 3, L(['S', '南']), 'fg-tick') + tx(316, Y + 3, L(['N', '北']), 'fg-tick', 'e') +
    tx(14, 88, L(['Yongdingmen', '永定门']), 'fg-label') + tx(X(3), 62, L(['Zhengyangmen', '正阳门']), 'fg-label', 'm') +
    tx(X(4), 88, L(['Tian\'anmen', '天安门']), 'fg-label', 'm') + tx(192, 50, L(['Forbidden City', '故宫']), 'fg-label', 'm', ' style="fill:#ff8787"') +
    tx(X(5.6), 88, L(['Jingshan', '景山']), 'fg-label', 'm') + tx(310, 62, L(['Bell & Drum Towers', '钟鼓楼']), 'fg-label', 'e') +
    tx(78, 107, L(['Temple of Heaven (E)', '天坛（东）']), 'fg-sub') + tx(78, 45, L(['Xiannongtan (W)', '先农坛（西）']), 'fg-sub') +
    `<line x1="240" y1="122" x2="${r(240 + 35.4)}" y2="122" stroke="#ced4da" stroke-width="1.4"/>` + tx(280, 125, L(['1 km', '1 千米']), 'fg-tick'),
  L(['Beijing Central Axis', '北京中轴线']));
});

/** One core, two wings: central Beijing, the sub-centre at Tongzhou, Xiong'an. */
const wingsFig = fig((L, id) => svg(320, 140,
  arrowDef(id + 'a', '#ffa94d') + head(L, ['One core, two wings', '一核两翼'], ['Moving non-capital functions out of central Beijing', '疏解北京非首都功能']) +
  `<ellipse cx="178" cy="66" rx="74" ry="34" fill="none" class="fg-guide"/>` + tx(250, 36, L(['Beijing', '北京市']), 'fg-sub', 'e') +
  `<circle cx="150" cy="64" r="20" fill="rgba(255,107,107,.3)" stroke="#ff6b6b" stroke-width="1.5"/>` + tx(150, 67, L(['core', '核心']), 'fg-label', 'm') +
  tx(160, 96, L(['Central Beijing', '中心城区']), 'fg-sub', 'm') +
  `<circle cx="222" cy="66" r="11" fill="rgba(59,201,219,.35)" stroke="#3bc9db" stroke-width="1.5" class="f-fade"${dl(0.6)}/>` +
  tx(222, 90, L(['Sub-centre (Tongzhou)', '城市副中心（通州）']), 'fg-label f-fade', 'm', dl(0.6)) +
  `<line x1="171" y1="64" x2="206" y2="66" stroke="#ffa94d" stroke-width="1.6" marker-end="url(#${id}a)" class="f-fade"${dl(0.8)}/>` +
  tx(172, 51, L(['city offices', '市级机关']), 'fg-sub f-fade', 's', dl(0.8)) +
  `<circle cx="70" cy="118" r="13" fill="rgba(255,146,43,.35)" stroke="#ff922b" stroke-width="1.5" class="f-fade"${dl(1.1)}/>` +
  tx(90, 122, L(['Xiong\'an New Area (2017)', '雄安新区（2017 年设立）']), 'fg-label f-fade', 's', dl(1.1)) +
  `<line x1="134" y1="78" x2="84" y2="106" stroke="#ffa94d" stroke-width="1.6" marker-end="url(#${id}a)" class="f-fade"${dl(1.3)}/>` +
  tx(104, 86, L(['colleges, hospitals, HQs', '高校、医院、企业总部']), 'fg-sub f-fade', 'e', dl(1.3)),
L(['One core, two wings', '一核两翼'])));

/** A Jiangnan water town in section. */
const waterTown = fig(L => {
  const house = (x: number, d: number) =>
    `<g class="f-fade"${dl(d)}><rect x="${x}" y="62" width="70" height="38" fill="#f1f3f5"/><polygon points="${x - 6},64 ${x + 35},42 ${x + 76},64" fill="#343a40"/>` +
    `<rect x="${x + 12}" y="72" width="12" height="12" fill="#495057"/><rect x="${x + 46}" y="72" width="12" height="12" fill="#495057"/><rect x="${x + 29}" y="80" width="12" height="20" fill="#5c4033"/></g>`;
  return svg(320, 150,
    head(L, ['A Jiangnan water town (sketch)', '江南水乡（示意）'], ['Small bridges, flowing water, homes by the river', '小桥、流水、人家']) +
    `<rect x="0" y="100" width="110" height="50" class="fg-landfill"/><rect x="210" y="100" width="110" height="50" class="fg-landfill"/>` +
    `<rect x="110" y="108" width="100" height="42" class="fg-water" opacity=".7"/>` +
    `<rect x="100" y="104" width="10" height="4" fill="#adb5bd"/><rect x="104" y="108" width="6" height="6" fill="#adb5bd"/>` +
    house(24, 0.2) + house(226, 0.4) +
    `<path d="M104 100 Q160 52 216 100" fill="none" stroke="#ced4da" stroke-width="7" class="f-fade"${dl(0.7)}/>` +
    `<path d="M128 108 A32 30 0 0 1 192 108" fill="none" stroke="#868e96" stroke-width="2" class="f-fade"${dl(0.7)}/>` +
    `<path d="M140 124 L184 124 L178 132 L146 132 Z" fill="#8d6e4a" class="f-fade"${dl(1)}/><line x1="176" y1="124" x2="190" y2="112" stroke="#ced4da" stroke-width="1.2"/>` +
    tx(60, 36, L(['white walls, black tiles', '粉墙黛瓦']), 'fg-label', 'm') + tx(160, 50, L(['stone arch bridge', '石拱桥']), 'fg-label', 'm') +
    tx(262, 36, L(['homes face the water', '枕河而居']), 'fg-label', 'm') + tx(54, 128, L(['river steps', '河埠头']), 'fg-sub', 'm') +
    tx(160, 146, L(['the canal is the street', '河道就是街道']), 'fg-sub', 'm'),
  L(['Water town', '江南水乡']));
});

/** The Grand Canal links five river systems (north on the left). */
const canalFig = fig((L, id) => {
  const X = (lat: number) => r(20 + ((39.9 - lat) / 9.6) * 280), Y = 70;
  const river = (lat: number, en: string, zh: string, d: number, a: 's' | 'm' | 'e' = 'm') =>
    `<line x1="${X(lat)}" y1="53" x2="${X(lat)}" y2="98" stroke="#4dabf7" stroke-width="2.4" marker-end="url(#${id}r)" class="f-fade"${dl(d)}/>` + tx(a === 'e' ? 312 : X(lat), 112, L([en, zh]), 'fg-label f-fade', a, ` style="fill:#74c0fc;--d:${d}s"`);
  const city = (lat: number, en: string, zh: string, y: number, a: 's' | 'm' | 'e' = 'm') =>
    `<circle cx="${X(lat)}" cy="${Y}" r="3" fill="#ffd24a"/>` + tx(a === 's' ? 14 : a === 'e' ? 312 : X(lat), y, L([en, zh]), 'fg-sub', a);
  return svg(320, 120,
    arrowDef(id + 'r', '#4dabf7') + head(L, ['The Grand Canal links five river systems', '京杭运河沟通五大水系'], ['1,794 km, north (left) to south (right); rivers flow east to the sea', '全长约 1794 千米，左北右南；河流向东入海']) +
    river(39.1, 'Hai', '海河', 0.6) + river(35.9, 'Yellow', '黄河', 0.8) + river(33.5, 'Huai', '淮河', 1) + river(32.25, 'Yangtze', '长江', 1.2) + river(30.3, 'Qiantang', '钱塘江', 1.4, 'e') +
    `<line x1="${X(39.9)}" y1="${Y}" x2="${X(30.3)}" y2="${Y}" stroke="#ffd24a" stroke-width="3" class="f-draw" pathLength="1"/>` +
    city(39.9, 'Beijing', '北京', 37, 's') + city(39.1, 'Tianjin', '天津', 47) + city(32.4, 'Yangzhou', '扬州', 47) + city(31.3, 'Suzhou', '苏州', 37) + city(30.3, 'Hangzhou', '杭州', 47, 'e'),
  L(['Grand Canal', '京杭运河']));
});

/** Victoria Harbour, between Kowloon and Hong Kong Island. */
const harbourFig = fig(L => svg(320, 140,
  head(L, ['Victoria Harbour (sketch)', '维多利亚港（示意）']) +
  `<rect x="0" y="28" width="320" height="112" class="fg-sea"/>` +
  `<polygon points="0,28 320,28 320,58 270,62 230,56 190,62 150,58 110,64 70,58 30,62 0,58" class="fg-landfill"/>` +
  `<polygon points="0,140 0,112 30,100 80,94 150,98 220,92 290,100 320,108 320,140" class="fg-landfill"/>` +
  [70, 80, 88, 96, 104, 114, 122].map((x, i) => `<rect x="${x}" y="${102 - (i % 3 + 1) * 6}" width="6" height="${(i % 3 + 1) * 6}" fill="#ced4da" class="f-grow"${dl(0.3 + i * 0.05)}/>`).join('') +
  [20, 34, 48].map(x => `<line x1="${x}" y1="58" x2="${x}" y2="40" stroke="#ffa94d" stroke-width="1.5"/><line x1="${x - 4}" y1="42" x2="${x + 8}" y2="42" stroke="#ffa94d" stroke-width="1.5"/>`).join('') +
  `<line x1="100" y1="64" x2="100" y2="92" class="fg-flowline f-flow"/><line x1="232" y1="58" x2="232" y2="94" class="fg-guide"/>` +
  `<path d="M160 82 h22 l-4 5 h-14 z" fill="#f1f3f5"/><path d="M196 68 h16 l-3 4 h-10 z" fill="#f1f3f5"/>` +
  tx(170, 46, L(['Kowloon', '九龙']), 'fg-label', 'm') + tx(58, 50, L(['container port', '集装箱码头']), 'fg-sub') +
  tx(150, 74, L(['Victoria Harbour', '维多利亚港']), 'fg-label', 'm', ' style="fill:#a5d8ff"') +
  tx(96, 72, L(['ferry', '天星小轮']), 'fg-sub', 'e') + tx(236, 76, L(['cross-harbour tunnel', '海底隧道']), 'fg-sub') +
  tx(96, 130, L(['Central: banks, finance', '中环：银行、金融']), 'fg-sub', 'm') + tx(250, 124, L(['Hong Kong Island', '香港岛']), 'fg-label', 'm'),
L(['Victoria Harbour', '维多利亚港'])));

/** "Front shop, back factory", and today's two-way cooperation. */
const shopFactory = fig((L, id) => {
  const col = (x: number, c: string, t: Pair, rows: Pair[], d: number) =>
    box(x, 28, 112, 74, c, d) + tx(x + 56, 44, L(t), 'fg-label f-fade', 'm', ` style="fill:${c};--d:${d}s"`) +
    rows.map((p, i) => tx(x + 56, 60 + i * 12, L(p), 'fg-sub f-fade', 'm', dl(d))).join('');
  return svg(320, 146,
    arrowDef(id + 'a', '#ffd24a') + arrowDef(id + 'b', '#3bc9db') + head(L, ['"Front shop, back factory" (1980s–1990s)', '“前店后厂”（20 世纪 80—90 年代）']) +
    col(4, '#f783ac', ['Shop: Hong Kong', '前店：香港'], [['finance, trade', '金融、贸易'], ['design, marketing', '设计、营销'], ['port, shipping', '港口、航运']], 0.1) +
    col(204, '#ff922b', ['Factory: PRD', '后厂：珠三角'], [['land, cheap labour', '土地、廉价劳动力'], ['factories', '工厂'], ['assembly', '加工装配']], 0.3) +
    `<line x1="120" y1="56" x2="200" y2="56" stroke="#ffd24a" stroke-width="1.6" marker-end="url(#${id}a)" class="f-fade"${dl(0.6)}/>` +
    tx(160, 40, L(['capital, orders,', '资金、订单']), 'fg-sub', 'm') + tx(160, 50, L(['tech, management', '技术、管理']), 'fg-sub', 'm') +
    `<line x1="200" y1="82" x2="120" y2="82" stroke="#3bc9db" stroke-width="1.6" marker-end="url(#${id}b)" class="f-fade"${dl(0.9)}/>` +
    tx(160, 94, L(['goods, exported', '产品经香港']), 'fg-sub', 'm') + tx(160, 104, L(['through Hong Kong', '销往世界']), 'fg-sub', 'm') +
    `<rect x="4" y="114" width="312" height="28" rx="6" fill="rgba(177,151,252,.16)" stroke="#b197fc" class="f-fade"${dl(1.3)}/>` +
    tx(160, 132, L(['Now: the Greater Bay Area — two-way cooperation in tech, finance, services', '如今：粤港澳大湾区——科技、金融、服务全面合作']), 'fg-sub f-fade', 'm', dl(1.3)),
  L(['Front shop, back factory', '前店后厂']));
});

/** The Hong Kong–Zhuhai–Macao Bridge in profile. */
const hzmbFig = fig(L => svg(320, 132,
  head(L, ['Hong Kong–Zhuhai–Macao Bridge: 55 km (not to scale)', '港珠澳大桥：全长 55 千米（不按比例）'], ['The tunnel leaves shipping lanes and airport airspace clear', '海底隧道：不挡航道，不碍机场航线']) +
  `<rect x="0" y="70" width="320" height="40" class="fg-sea"/><rect x="0" y="110" width="320" height="22" class="fg-landfill"/>` +
  `<rect x="0" y="60" width="34" height="12" fill="#adb5bd"/><rect x="290" y="60" width="30" height="12" fill="#adb5bd"/>` +
  `<line x1="34" y1="58" x2="198" y2="58" stroke="#ffd24a" stroke-width="3" class="f-draw" pathLength="1"/>` +
  [80, 120, 160].map(x => `<line x1="${x}" y1="70" x2="${x}" y2="36" stroke="#ced4da" stroke-width="2"/><path d="M${x - 18} 58 L${x} 38 L${x + 18} 58" fill="none" stroke="#ced4da" stroke-width=".8"/>`).join('') +
  `<ellipse cx="206" cy="68" rx="10" ry="5" fill="#c0eb75"/><ellipse cx="262" cy="68" rx="10" ry="5" fill="#c0eb75"/>` +
  `<path d="M212 70 L222 114 L246 114 L256 70" fill="none" stroke="#ff922b" stroke-width="3" class="f-draw" pathLength="1"${dl(0.8)}/>` +
  `<line x1="270" y1="62" x2="290" y2="62" stroke="#ffd24a" stroke-width="3"/>` +
  `<path d="M224 66 h18 l-3 4 h-12 z" fill="#f1f3f5"/>` +
  tx(4, 84, L(['Zhuhai / Macao', '珠海、澳门']), 'fg-label') + tx(316, 84, L(['Hong Kong', '香港']), 'fg-label', 'e') +
  tx(120, 86, L(['bridge ≈ 23 km', '桥梁约 23 千米']), 'fg-sub', 'm') + tx(234, 46, L(['artificial islands', '人工岛']), 'fg-sub', 'm') +
  tx(234, 126, L(['undersea tunnel 6.7 km', '海底隧道 6.7 千米']), 'fg-sub', 'm'),
L(['Hong Kong–Zhuhai–Macao Bridge', '港珠澳大桥'])));

/** West–east section across Taiwan at about 23.5°N. */
const twProfile = fig(L => {
  const y = (e: number) => 125 - e * 0.02;
  const p = pts(([[50, 0], [80, 30], [110, 100], [130, 600], [145, 1500], [155, 2480], [170, 1200], [182, 2600], [195, 3952], [212, 2500], [235, 3300], [252, 900], [265, 150], [280, 1200], [292, 0]] as [number, number][]).map(([x, e]) => [x, y(e)]));
  return svg(320, 150,
    head(L, ['West–east profile across Taiwan (sketch)', '台湾岛东西向地形剖面（示意）'], ['Plains in the west, high mountains in the middle and east', '西部平原，中、东部高山']) +
    `<rect x="0" y="125" width="52" height="10" class="fg-sea"/><rect x="290" y="125" width="30" height="10" class="fg-sea"/>` +
    `<polygon points="${p} 292,135 50,135" class="fg-landfill"/><polyline points="${p}" class="fg-profile f-draw" pathLength="1"/>` +
    `<circle cx="195" cy="${y(3952)}" r="3" fill="#ffd24a"/>` +
    tx(26, 146, L(['Taiwan Strait', '台湾海峡']), 'fg-sub', 'm') + tx(80, 116, L(['Jianan Plain', '嘉南平原']), 'fg-label', 'm') +
    tx(155, y(2480) - 6, L(['Alishan', '阿里山']), 'fg-sub', 'm') + tx(195, y(3952) - 6, L(['Yushan 3,952 m', '玉山 3952 米']), 'fg-label', 'm', ' style="fill:#ffd24a"') +
    tx(240, y(3300) - 6, L(['Central Range', '中央山脉']), 'fg-sub', 'm') + tx(258, 146, L(['rift valley', '花东纵谷']), 'fg-sub', 'm') +
    tx(290, y(1200) - 6, L(['Coastal Range', '海岸山脉']), 'fg-sub', 'm') + tx(316, 146, L(['Pacific', '太平洋']), 'fg-sub', 'e') +
    tx(4, 118, L(['W', '西']), 'fg-tick') + tx(316, 118, L(['E', '东']), 'fg-tick', 'e'),
  L(['Taiwan profile', '台湾地形剖面']));
});

/** Export processing, and the move up to high technology. */
const epzFig = fig((L, id) => {
  const card = (x: number, c: string, t: Pair, s: Pair, d: number) =>
    box(x, 28, 92, 40, c, d) + tx(x + 46, 44, L(t), 'fg-label f-fade', 'm', ` style="fill:${c};--d:${d}s"`) + tx(x + 46, 58, L(s), 'fg-sub f-fade', 'm', dl(d));
  return svg(320, 132,
    arrowDef(id + 'a', '#ffd24a') + head(L, ['Export processing in Taiwan', '台湾的加工出口工业']) +
    card(8, '#74c0fc', ['Import', '进口'], ['materials, parts', '原料、零部件'], 0.1) +
    card(114, '#ffd24a', ['Process', '加工装配'], ['labour, ports', '劳动力、港口'], 0.4) +
    card(220, '#51cf66', ['Export', '出口'], ['to world markets', '销往世界各地'], 0.7) +
    `<line x1="100" y1="48" x2="112" y2="48" stroke="#ffd24a" stroke-width="1.6" marker-end="url(#${id}a)"/><line x1="206" y1="48" x2="218" y2="48" stroke="#ffd24a" stroke-width="1.6" marker-end="url(#${id}a)"/>` +
    `<line x1="20" y1="94" x2="300" y2="94" stroke="#ced4da" stroke-width="1.4" marker-end="url(#${id}a)" class="f-draw" pathLength="1"${dl(0.8)}/>` +
    `<circle cx="64" cy="94" r="4" fill="#ff922b"/><circle cx="210" cy="94" r="4" fill="#b197fc"/>` +
    tx(64, 87, '1966', 'fg-label', 'm') + tx(210, 87, '1980', 'fg-label', 'm') +
    tx(64, 108, L(['Kaohsiung EPZ:', '高雄加工出口区：']), 'fg-sub', 'm') + tx(64, 119, L(['clothes, toys, radios', '服装、玩具、收音机']), 'fg-sub', 'm') +
    tx(210, 108, L(['Hsinchu Science Park:', '新竹科学工业园区：']), 'fg-sub', 'm') + tx(210, 119, L(['chips, computers', '芯片、电脑']), 'fg-sub', 'm') +
    tx(312, 108, L(['→ high tech', '→ 高新技术']), 'fg-sub', 'e'),
  L(['Export processing', '加工出口工业']));
});

/** Xinjiang north–south: three ranges and two basins. */
const xjSection = fig((L, id) => {
  const y = (e: number) => 132 - e * 0.0143;
  const p = pts(([[0, 1000], [25, 2500], [45, 3800], [60, 2200], [75, 800], [90, 500], [110, 400], [130, 500], [145, 900], [160, 3000], [175, 5400], [190, 4200], [200, 2500], [212, 1200], [240, 1000], [265, 1200], [276, 1700], [286, 4500], [296, 6000], [306, 5300], [320, 4900]] as [number, number][]).map(([x, e]) => [x, y(e)]));
  const blue = (a: [number, number], b: [number, number], d: number) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#4dabf7" stroke-width="1.6" marker-end="url(#${id}r)" class="f-fade"${dl(d)}/>`;
  return svg(320, 150,
    arrowDef(id + 'r', '#4dabf7') + head(L, ['North–south section: three ranges, two basins', '南北向剖面：三山夹两盆'], ['Sketch; heights exaggerated', '示意图，垂直比例放大']) +
    `<polygon points="${p} 320,150 0,150" class="fg-landfill"/><polyline points="${p}" class="fg-profile f-draw" pathLength="1"/>` +
    [[100, 126], [112, 127], [124, 126], [228, 116], [240, 117], [252, 116]].map(([x, yy]) => `<path d="M${x - 5} ${yy + 1} q5 -5 10 0" fill="none" stroke="#ffd24a" stroke-width="1"/>`).join('') +
    blue([196, 90], [214, 112], 1.2) + blue([280, 92], [266, 112], 1.4) +
    tx(45, y(3800) - 6, L(['Altai', '阿尔泰山']), 'fg-label', 'm') + tx(112, 104, L(['Junggar Basin', '准噶尔盆地']), 'fg-label', 'm', ' style="fill:#ffd24a"') +
    tx(175, y(5400) - 6, L(['Tianshan', '天山']), 'fg-label', 'm') + tx(240, 102, L(['Tarim Basin', '塔里木盆地']), 'fg-label', 'm', ' style="fill:#ffd24a"') +
    tx(296, y(6000) - 6, L(['Kunlun', '昆仑山']), 'fg-label', 'm') +
    tx(112, 144, L(['Gurbantünggüt Desert', '古尔班通古特沙漠']), 'fg-sub', 'm') + tx(240, 144, L(['Taklimakan Desert', '塔克拉玛干沙漠']), 'fg-sub', 'm') +
    tx(4, 144, L(['N', '北']), 'fg-tick') + tx(318, 144, L(['S', '南']), 'fg-tick', 'e'),
  L(['Three ranges, two basins', '三山夹两盆']));
});

/** How a karez works. */
const karezFig = fig(L => {
  const g = (x: number) => 58 + (x - 50) * 46 / 260, ch = (x: number) => 118 - (x - 80) * 24 / 170;
  return svg(320, 150,
    head(L, ['Karez: water flows underground by gravity (sketch)', '坎儿井：地下水自流引灌（示意）']) +
    `<polygon points="0,150 0,40 22,32 42,46 50,58 310,${r(g(310))} 320,${r(g(320))} 320,150" class="fg-landfill"/>` +
    `<polygon points="12,37 22,32 32,38 26,40 18,39" fill="#e7f5ff"/>` +
    `<line x1="10" y1="92" x2="88" y2="120" class="fg-ground"/>` +
    [100, 130, 160, 190, 220].map((x, i) => `<rect x="${x - 2}" y="${r(g(x))}" width="4" height="${r(ch(x) - g(x))}" fill="#1b2733" class="f-grow"${dl(0.3 + i * 0.12)}/>`).join('') +
    `<rect x="78" y="${r(g(80))}" width="5" height="${r(118 - g(80))}" fill="#1b2733"/>` +
    `<line x1="80" y1="118" x2="250" y2="${r(ch(250))}" stroke="#4dabf7" stroke-width="3" class="f-draw" pathLength="1"${dl(1)}/>` +
    `<line x1="250" y1="${r(g(250))}" x2="276" y2="${r(g(276))}" stroke="#4dabf7" stroke-width="3"/>` +
    `<ellipse cx="284" cy="${r(g(284) + 1)}" rx="9" ry="3" fill="#4dabf7"/>` +
    [298, 306, 314].map(x => `<circle cx="${x}" cy="${r(g(x) - 6)}" r="5" fill="#2f9e44"/>`).join('') +
    tx(30, 28, L(['snow & glaciers', '高山冰雪']), 'fg-sub', 'm') + tx(160, 66, L(['shafts', '竖井']), 'fg-label', 'm') +
    tx(170, 128, L(['underground channel', '暗渠']), 'fg-label', 'm', ' style="fill:#74c0fc"') +
    tx(6, 136, L(['meltwater seeps in', '冰雪融水渗入地下']), 'fg-sub') +
    tx(316, 142, L(['canal → pond → oasis', '明渠 → 涝坝 → 绿洲']), 'fg-sub', 'e'),
  L(['Karez', '坎儿井']));
});

/** Sea zones measured from the baseline. */
const seaZones = fig(L => {
  const band = (x: number, w: number, a: number, d: number) => `<rect x="${x}" y="56" width="${w}" height="34" fill="rgba(28,126,214,${a})" class="f-growx"${dl(d)}/>`;
  return svg(320, 120,
    head(L, ['Sea zones, measured from the baseline (not to scale)', '从领海基线向外的海域（不按比例）'], ['1 nautical mile = 1.852 km', '1 海里 = 1.852 千米']) +
    `<rect x="0" y="50" width="40" height="46" class="fg-landfill"/>` + band(40, 24, 0.8, 0.1) + band(64, 24, 0.6, 0.3) + band(88, 172, 0.4, 0.5) + band(260, 60, 0.15, 0.7) +
    `<line x1="40" y1="46" x2="40" y2="96" stroke="#ffd24a" stroke-width="1.6"/>` +
    `<line x1="52" y1="38" x2="52" y2="56" class="fg-guide"/><line x1="76" y1="49" x2="76" y2="56" class="fg-guide"/>` +
    tx(46, 35, L(['Territorial sea: full sovereignty', '领海：享有主权']), 'fg-label') + tx(70, 47, L(['Contiguous zone', '毗连区']), 'fg-sub') +
    tx(174, 72, L(['Exclusive economic zone', '专属经济区']), 'fg-label', 'm') + tx(174, 84, L(['rights to fish, oil and gas', '对渔业、油气等享有主权权利']), 'fg-sub', 'm') +
    tx(290, 76, L(['High seas', '公海']), 'fg-label', 'm') + tx(20, 76, L(['Land', '陆地']), 'fg-sub', 'm') +
    tx(40, 106, L(['baseline', '基线']), 'fg-tick', 'm') + tx(64, 106, '12', 'fg-tick', 'm') + tx(88, 106, '24', 'fg-tick', 'm') +
    tx(260, 106, L(['200 nautical miles', '200 海里']), 'fg-tick', 'm'),
  L(['Sea zones', '海洋权益']));
});

// ---------------------------------------------------------------- places used on the globe
const BJ: LL = [39.9, 116.4], TJ: LL = [39.13, 117.2], SJZ: LL = [38.04, 114.51], XA: LL = [38.97, 115.98];
const SH: LL = [31.23, 121.47], NJ: LL = [32.06, 118.8], HZ: LL = [30.27, 120.15], SZ: LL = [31.3, 120.6], HF: LL = [31.82, 117.23], NB: LL = [29.87, 121.55];
const HK: LL = [22.3, 114.17], MO: LL = [22.19, 113.55], GZ: LL = [23.13, 113.26], SZN: LL = [22.54, 114.06];
const HK_L: LL = [21.35, 115.0], MO_L: LL = [21.25, 111.7];
const TPE: LL = [25.03, 121.56], KHH: LL = [22.63, 120.3], YUSHAN: LL = [23.47, 120.96];
const KASHGAR: LL = [39.47, 75.99], URUMQI: LL = [43.83, 87.62], KHORGOS: LL = [44.21, 80.42];

export const CHINA_D: Lesson[] = [
  {
    id: 'beijing', strand: 'china', tracks: [], grade: 'g8b', unit: regions, icon: 'landmark', minutes: 8,
    title: ['Beijing, the capital', '祖国的首都——北京'],
    blurb: ['Four centres, an ancient capital on its central axis, and a capital region that shares the load.', '四个中心、古都与中轴线、疏解非首都功能与京津冀协同发展。'],
    keys: [
      ['Beijing is China\'s political, cultural, international-exchange and sci-tech innovation centre.', '北京是全国的政治中心、文化中心、国际交往中心和科技创新中心。'],
      ['It sits at the north end of the North China Plain, with the Yanshan and Taihang mountains behind it.', '北京位于华北平原北端，背靠燕山、太行山，面向平原。'],
      ['The 7.8 km Central Axis and seven other World Heritage sites make it a great ancient capital.', '7.8 千米的北京中轴线等 8 项世界遗产，展现了古都风貌。'],
      ['Non-capital functions move out to Xiong\'an and Tongzhou; Beijing, Tianjin and Hebei develop together.', '疏解非首都功能，建设雄安新区和城市副中心，推动京津冀协同发展。'],
    ],
    steps: [
      {
        title: ['The capital and its four centres', '首都北京的四个中心'], cam: [39.9, 116.4, 1.6],
        paint: [{ fill: { k: 'poly', pts: BEIJING, c: C.red, clip: CN }, a: 0.55 }],
        lines: [par(39.9, C.gold, 0.6, { w: 0.8 })],
        marks: [mk(BJ, 'Beijing', '北京', { dot: true, big: true, c: C.red, t: 0.3 })],
        fig: fourCentres,
        task: ['Follow the gold line round the globe: which other capitals lie near 40°N?', '沿着金色纬线转动地球：还有哪些首都也在北纬 40° 附近？'],
        body: ['Beijing is the capital of the People\'s Republic of China. The municipality covers about 16,400 km² and is home to about 22 million people. As the capital it has four roles: the country\'s political centre, where the central government sits; its cultural centre, with an ancient city, great museums and many universities; its centre for international exchanges, with embassies and summits; and a centre of science and innovation, led by Zhongguancun.',
          '北京是中华人民共和国的首都，面积约 1.64 万平方千米，常住人口约 2200 万。北京的城市战略定位是全国政治中心、文化中心、国际交往中心和科技创新中心：党和国家中央机关在这里办公；这里古迹众多、文化设施和高等院校云集；外国使馆和国际组织集中，经常举办重大国际活动；以中关村为代表，科技创新实力雄厚。'],
      },
      {
        title: ['Mountains behind, plain in front', '背靠山地，面向平原'], cam: [39.6, 116.3, 1.8],
        paint: [{ fill: { k: 'poly', pts: BEIJING, c: C.red, clip: CN }, a: 0.4 }],
        lines: [{ pts: YANSHAN, c: C.brown, w: 1.8, dur: 1.4, t: 0.3 }, { pts: TAIHANG, c: C.brown, w: 1.8, dur: 1.4, t: 0.9 }],
        marks: [
          mk([41.25, 117.6], 'Yanshan', '燕山', { c: C.brown, t: 0.8 }), mk([38.2, 113.3], 'Taihang', '太行山', { c: C.brown, t: 1.4 }),
          mk(BJ, 'Beijing', '北京', { dot: true, c: C.red, t: 0.2 }), mk([37.4, 116.3], 'North China Plain', '华北平原', { big: true, c: C.lime, t: 1.8 }),
          mk([39.0, 120.2], 'Bohai', '渤海', { c: C.blue, t: 2.1 }),
        ],
        fig: bjProfile,
        task: ['Turn the globe: see how the mountains curve round Beijing on the north and west, open to the south-east.', '转动地球：看山地怎样从北面和西面环抱北京，只向东南方敞开。'],
        body: ['Beijing lies at the northern tip of the North China Plain. The Yanshan (Jundu) Mountains curve round it on the north and the Taihang (Western Hills) on the west, while the land opens to the plain and the Bohai Sea in the south-east — a small plain often called the "Beijing Bay". The mountains guarded the city and shelter it from cold north-west winds; the open plain made it easy to reach the rest of China. Beijing has a temperate monsoon climate with hot, rainy summers and cold, dry winters.',
          '北京位于华北平原北端，西部是太行山（西山），北部是燕山（军都山），两山在北京西北方向交会，向东南敞开，面向平原和渤海，形成一个半封闭的小平原，被称为“北京湾”。山地既是天然屏障，又能削弱冬季西北寒风；东南方的平原交通便利，便于联系全国。北京属于温带季风气候，夏季高温多雨，冬季寒冷干燥。'],
      },
      {
        title: ['The Central Axis', '北京中轴线'], cam: [39.9, 116.4, 1.3], items: ['forbidden', 'templeofheaven'],
        lines: [{ pts: [[39.866, 116.397], [39.942, 116.393]], c: C.gold, w: 2.4, dur: 1.2, t: 0.4 }],
        marks: [mk([39.6, 116.9], 'Old city of Beijing', '北京老城', { c: C.gold, t: 0.8 })],
        fig: axisFig,
        task: ['Tap the Forbidden City and Temple of Heaven pins: both sit on or beside the axis.', '点一点故宫和天坛的图标：它们都在中轴线上或两侧。'],
        body: ['Beijing has been a capital for about 870 years. Its old city was laid out along a 7.8 km north–south Central Axis, from Yongdingmen Gate in the south, through Zhengyangmen, Tian\'anmen and the Forbidden City (the imperial palace of the Ming and Qing) and Jingshan Hill, to the Bell and Drum Towers in the north. The Temple of Heaven and the Temple of Agriculture face each other on either side. In 2024 the Central Axis became a World Heritage site.',
          '北京建都已有约 870 年历史。北京老城沿着一条南北走向、全长约 7.8 千米的中轴线规划：南起永定门，经正阳门、天安门、故宫（明清两代的皇宫）、景山，北至钟鼓楼；天坛和先农坛在中轴线南段东西两侧对称分布。2024 年，“北京中轴线——中国理想都城秩序的杰作”列入《世界遗产名录》。'],
      },
      {
        title: ['Eight World Heritage sites', '八项世界遗产'], cam: [40.3, 116.6, 1.8], items: ['greatwall', 'forbidden', 'templeofheaven'], sketch: true,
        lines: [{ pts: GREAT_WALL_BJ, c: C.brown, w: 1.8, dur: 2.4, t: 0.3 }],
        marks: [mk([41.05, 118.3], 'Ming Great Wall', '明长城', { c: C.brown, t: 1.4 }), mk([40.0, 119.78], 'Shanhaiguan', '山海关', { dot: true, c: C.white, t: 2 })],
        fig: { k: 'key', set: 'custom', title: ['World Heritage sites in Beijing (year listed)', '北京的世界遗产（列入年份）'], items: [
          { c: C.brown, name: ['Great Wall 1987', '长城 1987'] }, { c: C.red, name: ['Forbidden City 1987', '故宫 1987'] },
          { c: C.lime, name: ['Peking Man site, Zhoukoudian 1987', '周口店北京人遗址 1987'] }, { c: C.blue, name: ['Temple of Heaven 1998', '天坛 1998'] },
          { c: C.teal, name: ['Summer Palace 1998', '颐和园 1998'] }, { c: C.violet, name: ['Ming Tombs 2003', '明十三陵 2003'] },
          { c: C.ice, name: ['Grand Canal 2014', '大运河 2014'] }, { c: C.gold, name: ['Central Axis 2024', '北京中轴线 2024'] },
        ] },
        task: ['Tap the Great Wall pin at Mutianyu, then follow the wall east to the sea at Shanhaiguan.', '点开慕田峪长城的图标，再沿着长城向东找到入海的山海关。'],
        body: ['With eight World Heritage sites, Beijing is one of the richest cities in the world in heritage. The Ming Great Wall runs along the ridges of the Yanshan north of the city; the Summer Palace is a royal garden around Kunming Lake; the Ming Tombs lie in a valley to the north; and at Zhoukoudian, south-west of the city, the bones of Peking Man, who lived about 500,000 years ago, were found. Protecting the old city, its hutong lanes and courtyard houses, is part of Beijing\'s role as a cultural centre.',
          '北京拥有 8 项世界遗产，是世界上拥有世界遗产最多的城市之一。明长城蜿蜒在城北的燕山山脊上；颐和园是以昆明湖、万寿山为基础的皇家园林；明十三陵坐落在城北的山谷中；城西南的周口店发现了距今约 50 万年的北京人化石。保护好老城、胡同和四合院，是建设全国文化中心的重要任务。'],
      },
      {
        title: ['Easing the load: Xiong\'an and Tongzhou', '疏解非首都功能'], cam: [39.4, 116.2, 1.6],
        paint: [{ fill: { k: 'poly', pts: BEIJING, c: C.red, clip: CN }, a: 0.3 }, { fill: { k: 'poly', pts: XIONGAN, c: C.orange, clip: CN }, a: 0.8, t: 0.6 }],
        lines: [...arrows([[[39.82, 116.3], [39.1, 116.0]]], C.orange, 0.8, 2.2), { pts: RAIL_BJ_XA, c: C.gold, w: 1.4, t: 1.6, dur: 1 },
          lead(BJ, [40.55, 114.9], 0.2, C.red), lead(XA, [38.55, 115.25], 1, C.orange), lead([39.9, 116.66], [40.9, 118.8], 1.2, C.teal)],
        marks: [
          mk([40.61, 114.9], 'Beijing', '北京', { c: C.red, t: 0.2 }), mk([38.49, 115.25], 'Xiong\'an', '雄安新区', { c: C.orange, t: 1 }),
          mk([40.96, 118.8], 'Sub-centre (Tongzhou)', '城市副中心（通州）', { c: C.teal, t: 1.2 }), mk(TJ, 'Tianjin', '天津', { dot: true, c: C.white, t: 1.3 }),
        ],
        fig: wingsFig,
        task: ['Follow the orange arrow: Xiong\'an is about 105 km south-west of central Beijing.', '顺着橙色箭头看：雄安新区在北京城区西南约 105 千米处。'],
        body: ['Too many offices, markets, hospitals and colleges crowded into central Beijing brought traffic jams, high housing costs and pressure on water. So Beijing is moving out functions a capital does not need at its heart. Xiong\'an New Area in Hebei, set up in 2017, takes colleges, hospitals and company headquarters; the Beijing Municipal Government moved to the city sub-centre at Tongzhou in 2019. Together they form "one core, two wings".',
          '北京中心城区人口、产业过度聚集，带来交通拥堵、房价高涨、水资源紧张等“大城市病”。为此，北京有序疏解非首都功能：2017 年设立河北雄安新区，承接高校、医院、企业总部等；2019 年北京市级机关迁入通州的北京城市副中心。中心城区与雄安新区、城市副中心形成“一核两翼”的格局。'],
      },
      {
        title: ['Beijing, Tianjin and Hebei together', '京津冀协同发展'], cam: [39.3, 116.3, 1.9],
        paint: [{ fill: { k: 'poly', pts: JINGJINJI, c: C.teal, clip: CN }, a: 0.3 }, { fill: { k: 'poly', pts: BEIJING, c: C.red, clip: CN }, a: 0.45 }],
        lines: [...[RAIL_BJ_TJ, RAIL_BJ_XA, RAIL_BJ_ZJK].map((p, i): Line => ({ pts: p, c: C.gold, w: 1.6, dur: 1, t: 0.5 + i * 0.4 })), lead(BJ, [41.25, 117.3], 0.2, C.red)],
        marks: [
          mk([41.31, 117.3], 'Beijing', '北京', { c: C.red, t: 0.2 }), mk(TJ, 'Tianjin', '天津', { dot: true, c: C.white, t: 0.5 }),
          mk(SJZ, 'Shijiazhuang', '石家庄', { dot: true, c: C.white, t: 0.8 }), mk([40.77, 114.88], 'Zhangjiakou', '张家口', { dot: true, c: C.white, t: 1.3 }),
          mk([37.2, 115.0], 'Hebei', '河北', { big: true, c: C.teal, t: 1.6 }),
        ],
        fig: { k: 'bars', title: ['GDP per person, 2023', '2023 年人均地区生产总值'], unit: ['thousand yuan (approx.)', '千元（约数）'], rows: [
          { name: ['Beijing', '北京'], v: 200, c: C.red }, { name: ['Tianjin', '天津'], v: 123, c: C.gold }, { name: ['Hebei', '河北'], v: 59, c: C.teal },
        ] },
        task: ['Trace the three gold rail lines out of Beijing: to Tianjin, Xiong\'an and Zhangjiakou.', '找出从北京出发的三条金色铁路：通往天津、雄安和张家口。'],
        body: ['Since 2014, coordinated development of Beijing, Tianjin and Hebei has been a national strategy. Beijing leads in science, culture and services; Tianjin is a port and manufacturing city; Hebei has space, farmland and industry, and takes firms that move out of Beijing. High-speed lines tie them together: Beijing to Tianjin takes about 30 minutes, and the Beijing–Zhangjiakou line was built for the 2022 Winter Olympics, which made Beijing the first city to host both Summer and Winter Games. Daxing Airport (2019) sits on the Beijing–Hebei border.',
          '2014 年起，京津冀协同发展上升为国家战略。北京发挥科技、文化和服务业优势；天津是港口城市和制造业基地；河北土地广阔，承接北京转移的产业。高速铁路把三地连成一体：京津城际约半小时可达；京张高铁为 2022 年冬奥会而建，北京成为世界上首个“双奥之城”。2019 年建成的北京大兴国际机场就坐落在京冀交界处。'],
      },
    ],
    quiz: [
      { q: ['Which is NOT one of Beijing\'s four roles as capital?', '下列哪项不属于北京的城市战略定位？'], options: [['Political centre', '政治中心'], ['Centre for international exchanges', '国际交往中心'], ['Sci-tech innovation centre', '科技创新中心'], ['The country\'s biggest port', '全国最大的港口城市']], answer: 3,
        why: ['Beijing is inland; its four roles are political, cultural, international exchanges and sci-tech innovation.', '北京不临海；四个中心是政治、文化、国际交往和科技创新中心。'] },
      { q: ['Put the Central Axis in order, south to north.', '把北京中轴线上的建筑按从南到北排序。'], order: [['Yongdingmen', '永定门'], ['Zhengyangmen', '正阳门'], ['Tian\'anmen', '天安门'], ['Forbidden City', '故宫'], ['Jingshan', '景山'], ['Bell and Drum Towers', '钟鼓楼']],
        why: ['The axis runs 7.8 km from Yongdingmen to the Bell and Drum Towers.', '中轴线南起永定门，北至钟鼓楼，全长约 7.8 千米。'] },
      { q: ['Match each heritage site to what it is.', '把世界遗产与它的介绍连起来。'], match: [
        [['Forbidden City', '故宫'], ['Palace of the Ming and Qing emperors', '明清两代的皇宫']],
        [['Temple of Heaven', '天坛'], ['Where emperors prayed for good harvests', '皇帝祭天祈谷的地方']],
        [['Summer Palace', '颐和园'], ['Royal garden round Kunming Lake', '环绕昆明湖的皇家园林']],
        [['Zhoukoudian', '周口店'], ['Where Peking Man was found', '发现北京人化石的地方']],
      ], why: ['All four are among Beijing\'s eight World Heritage sites.', '它们都是北京的世界遗产。'] },
      { q: ['Which of these are World Heritage sites in Beijing? Pick all.', '下列哪些是位于北京的世界遗产？（多选）'], options: [['Forbidden City', '故宫'], ['Summer Palace', '颐和园'], ['The Bund', '外滩'], ['Temple of Heaven', '天坛'], ['West Lake', '西湖'], ['Ming Tombs', '明十三陵']], multi: [0, 1, 3, 5],
        why: ['The Bund is in Shanghai and West Lake in Hangzhou.', '外滩在上海，西湖在杭州。'] },
      { q: ['Label the map.', '在地图上标出这些地方。'], place: [{ text: ['Beijing', '北京'], at: BJ, tolKm: 70 }, { text: ['Tianjin', '天津'], at: TJ, tolKm: 70 }, { text: ['Xiong\'an', '雄安新区'], at: XA, tolKm: 70 }, { text: ['Shijiazhuang', '石家庄'], at: SJZ, tolKm: 70 }],
        why: ['Tianjin is south-east of Beijing on the coast, Xiong\'an south-west, Shijiazhuang further south-west.', '天津在北京东南、临海；雄安在北京西南；石家庄更远，在西南方。'] },
      { q: ['On a 1 : 1,000,000 map, Beijing to Xiong\'an measures 10.5 cm. How far is it really?', '在比例尺为 1∶1 000 000 的地图上，北京到雄安的图上距离是 10.5 厘米，实际距离是多少？'], num: { answer: 105, tol: 2, unit: ['km', '千米'] },
        why: ['1 cm on the map is 1,000,000 cm = 10 km, so 10.5 cm is 105 km.', '图上 1 厘米代表实地 1 000 000 厘米，即 10 千米；10.5 × 10 = 105 千米。'] },
      { q: ['Beijing lies at the northern end of which plain?', '北京位于哪个平原的北端？'], options: [['North China Plain', '华北平原'], ['Northeast Plain', '东北平原'], ['Middle–Lower Yangtze Plain', '长江中下游平原'], ['Guanzhong Plain', '关中平原']], answer: 0,
        why: ['The Yanshan and Taihang ring it on the north and west.', '北京北、西两面被燕山和太行山环绕，位于华北平原北端。'] },
    ],
  },
  {
    id: 'yrd', strand: 'china', tracks: [], grade: 'g8b', unit: regions, icon: 'ship', minutes: 8,
    title: ['The Yangtze River Delta', '长江三角洲地区'],
    blurb: ['Water towns and the Grand Canal, Shanghai the dragon head, and China\'s biggest city cluster.', '江南水乡与大运河，“龙头”上海，我国最大的城市群。'],
    keys: [
      ['The delta is low, flat and laced with rivers, lakes and canals: the classic "land of fish and rice".', '长江三角洲地势低平，河网密布，湖泊众多，是著名的“鱼米之乡”。'],
      ['Water towns, Taihu and the Grand Canal shaped a rich Jiangnan culture.', '江南水乡、太湖和京杭运河孕育了繁荣的江南文化。'],
      ['Shanghai is the "dragon head": China\'s largest city, with the world\'s busiest container port.', '上海是长江流域的“龙头”，拥有世界上最繁忙的集装箱港口。'],
      ['Shanghai, Jiangsu, Zhejiang and Anhui now grow as one: Yangtze River Delta integration.', '沪苏浙皖推进长三角一体化发展。'],
    ],
    steps: [
      {
        title: ['Small area, big weight', '面积小，分量重'], cam: [31.0, 119.5, 2.1],
        paint: [{ fill: { k: 'poly', pts: YRD_REGION, c: C.teal, clip: CN }, a: 0.3 }, { fill: { k: 'poly', pts: YRD_CORE, c: C.teal, clip: CN }, a: 0.45, t: 0.6 }],
        lines: [{ pts: YANGTZE_LOW, c: C.blue, w: 2, flow: true, arrow: true, dur: 1.4, t: 0.4 }, { pts: QIANTANG, c: C.blue, w: 1.4, flow: true, dur: 1, t: 0.8 }],
        marks: [
          mk(SH, 'Shanghai', '上海', { dot: true, big: true, c: C.gold, t: 0.3 }), mk([33.3, 119.4], 'Jiangsu', '江苏', { c: C.white, t: 1 }),
          mk([29.0, 120.0], 'Zhejiang', '浙江', { c: C.white, t: 1.2 }), mk([31.6, 116.9], 'Anhui', '安徽', { c: C.white, t: 1.4 }),
          mk([30.3, 123.6], 'East China Sea', '东海', { c: C.blue, t: 1.7 }),
        ],
        fig: { k: 'bars', title: ['The delta\'s share of China, 2023', '长三角地区占全国的比重（2023 年）'], unit: ['% (approx.)', '%（约数）'], rows: [
          { name: ['Land', '面积'], v: 3.7, c: C.green }, { name: ['People', '人口'], v: 17, c: C.blue }, { name: ['Economy (GDP)', '经济总量'], v: 24, c: C.gold },
        ] },
        task: ['Zoom out and compare the size of the shaded area with the whole of China.', '缩小地图，比较着色区域与全国的大小。'],
        body: ['The Yangtze River Delta region, in its widest sense, is Shanghai with Jiangsu, Zhejiang and Anhui provinces — "three provinces and one city". It lies where the Yangtze meets the East China Sea, at the middle of China\'s coast. With less than 4% of the country\'s land it has about one person in six and almost a quarter of the economy. It has a subtropical monsoon climate: warm, with plenty of rain.',
          '长江三角洲地区包括上海市、江苏省、浙江省和安徽省，即“三省一市”。它位于长江入海口，东临东海，地处我国东部沿海的中部。长三角以不到全国 4% 的面积，承载了约 1/6 的人口，创造了近 1/4 的经济总量。这里属于亚热带季风气候，温暖湿润，降水丰沛。'],
      },
      {
        title: ['Water towns of Jiangnan', '江南水乡'], cam: [31.0, 120.6, 1.4],
        paint: [{ fill: { k: 'poly', pts: TAIHU, c: C.blue }, a: 0.7 }],
        lines: [lead([31.12, 120.85], [31.85, 121.55], 0.4, C.gold), lead([30.75, 120.49], [30.0, 120.0], 0.8, C.gold)],
        marks: [mk([31.91, 121.55], 'Zhouzhuang', '周庄', { c: C.gold, t: 0.4 }), mk([29.94, 120.0], 'Wuzhen', '乌镇', { c: C.gold, t: 0.8 }), mk([31.22, 120.15], 'Taihu', '太湖', { c: C.ice, t: 1.2 })],
        fig: waterTown,
        task: ['Zoom in near Taihu: the water towns sit in a maze of rivers and canals.', '放大太湖周边：水乡古镇就坐落在纵横交错的河网中。'],
        body: ['The delta is so flat and so wet that rivers, canals and lakes cover much of it. People built their towns along the water: houses with white walls and black tiles back onto the canals, stone bridges arch over them, and boats were the main way to move goods. Zhouzhuang, Tongli and Wuzhen keep this "small bridges, flowing water, homes" look. Around Huzhou, farmers dug fish ponds and planted mulberry trees on the dykes between them, to feed silkworms — the delta has long been famous for silk.',
          '长江三角洲地势低平，河湖密布。人们依水而居，民居粉墙黛瓦、临河而建，石拱桥横跨河道，船是主要的交通工具，形成了“小桥、流水、人家”的江南水乡景观，周庄、同里、乌镇等古镇保存完好。湖州一带人们挖塘养鱼、塘基种桑、桑叶养蚕，形成“桑基鱼塘”，这里自古就以丝绸闻名。'],
      },
      {
        title: ['Taihu and the Grand Canal', '太湖与京杭运河'], cam: [35.0, 118.0, 2.6], sketch: true,
        paint: [{ fill: { k: 'poly', pts: TAIHU, c: C.blue }, a: 0.8 }],
        lines: [
          { pts: GRAND_CANAL, c: C.gold, w: 2.2, dur: 3, t: 0.3 },
          { pts: RIVERS.yellow.slice(-4), c: C.blue, w: 1.4, flow: true, dur: 1, t: 1 }, { pts: RIVERS.yangtze.slice(-4), c: C.blue, w: 1.4, flow: true, dur: 1, t: 1.2 },
        ],
        marks: [
          mk(BJ, 'Beijing', '北京', { dot: true, c: C.white, t: 0.3 }), mk([36.2, 117.4], 'Grand Canal', '京杭运河', { c: C.gold, t: 1.4 }),
          mk([32.39, 119.42], 'Yangzhou', '扬州', { dot: true, c: C.white, t: 2 }), mk(HZ, 'Hangzhou', '杭州', { dot: true, c: C.white, t: 2.6 }),
          mk([31.1, 119.4], 'Taihu', '太湖', { c: C.ice, t: 2.4 }),
        ],
        fig: canalFig,
        task: ['Follow the gold canal from Beijing to Hangzhou: how many big rivers does it cross?', '沿着金色的运河从北京走到杭州：它穿过了几条大河？'],
        body: ['Taihu, about 2,400 km², is one of China\'s largest freshwater lakes and the heart of the delta\'s water network, with Suzhou and Wuxi on its shores. The Beijing–Hangzhou Grand Canal, dug in stages from about 2,500 years ago, runs 1,794 km north to south and links five river systems: the Hai, Yellow, Huai, Yangtze and Qiantang. For centuries it carried grain from the south to the capital. It became a World Heritage site in 2014 and still carries barges in the south.',
          '太湖面积约 2400 平方千米，是我国大型淡水湖之一，也是长三角水网的中心，苏州、无锡就在太湖之滨。京杭运河始凿于约 2500 年前，北起北京、南到杭州，全长约 1794 千米，沟通了海河、黄河、淮河、长江和钱塘江五大水系，历史上是南粮北运的大动脉。2014 年，中国大运河列入《世界遗产名录》，运河南段至今仍是繁忙的航道。'],
      },
      {
        title: ['Shanghai, the dragon head', '“龙头”上海'], cam: [31.0, 121.7, 1.3], items: ['cn_bund', 'fd_xiaolongbao'],
        lines: [{ pts: YANGTZE_LOW.slice(-5), c: C.blue, w: 2, flow: true, arrow: true, dur: 1, t: 0.3 }, { pts: DONGHAI_BRIDGE, c: C.gold, w: 2.4, dur: 1, t: 1 },
          lead(SH, [32.1, 120.7], 0.2, C.gold), lead([30.62, 122.07], [30.5, 123.3], 1.4, C.teal), lead([29.93, 121.85], [29.3, 122.6], 1.8, C.teal)],
        marks: [
          mk([32.17, 120.7], 'Shanghai', '上海', { big: true, c: C.gold, t: 0.2 }), mk([30.56, 123.3], 'Yangshan Port', '洋山深水港', { c: C.teal, t: 1.4 }),
          mk([29.24, 122.6], 'Ningbo-Zhoushan Port', '宁波舟山港', { c: C.teal, t: 1.8 }),
        ],
        fig: { k: 'bars', title: ['Busiest container ports, 2023', '世界集装箱吞吐量最大的港口（2023 年）'], unit: ['million TEU', '百万标准箱'], rows: [
          { name: ['Shanghai', '上海'], v: 49.2, c: C.gold }, { name: ['Singapore', '新加坡'], v: 39.0, c: C.blue }, { name: ['Ningbo-Zhoushan', '宁波舟山'], v: 35.3, c: C.teal },
          { name: ['Shenzhen', '深圳'], v: 29.9, c: C.blue }, { name: ['Qingdao', '青岛'], v: 28.8, c: C.blue },
        ] },
        task: ['Tap the Bund pin, then find Yangshan port out at sea at the end of the Donghai Bridge.', '点开外滩的图标，再找到东海大桥尽头、海中的洋山深水港。'],
        body: ['Shanghai sits where the Yangtze meets the sea, halfway along China\'s coast: the river carries goods from deep inland and the sea links it to the world. It is China\'s largest city and an international centre of economy, finance, trade, shipping and innovation. Pudong, opened up in 1990, grew from farmland into the skyline of Lujiazui. Because the river mouth is shallow, the deep-water Yangshan Port was built on islands 30 km offshore, joined by the 32.5 km Donghai Bridge. Since 2010 Shanghai has been the world\'s busiest container port.',
          '上海位于长江入海口、我国海岸线的中部，向内可通过长江深入腹地，向外可通达世界各大港口。上海是我国最大的城市，正在建设国际经济、金融、贸易、航运和科技创新中心，被誉为长江流域发展的“龙头”。1990 年浦东开发开放，农田变成了陆家嘴的高楼群。由于长江口水浅，上海在约 30 千米外的海岛上建设了洋山深水港，由 32.5 千米长的东海大桥与陆地相连。自 2010 年起，上海港集装箱吞吐量居世界第一。'],
      },
      {
        title: ['China\'s biggest city cluster', '我国最大的城市群'], cam: [31.2, 119.6, 1.8],
        paint: [{ fill: { k: 'poly', pts: YRD_REGION, c: C.teal, clip: CN }, a: 0.2 }],
        lines: [...RAIL_YRD.map((p, i): Line => ({ pts: p, c: C.gold, w: 1.6, dur: 1.4, t: 0.4 + i * 0.4 })),
          lead(NJ, [32.85, 118.8], 0.6), lead(SZ, [32.45, 120.9], 0.8), lead(HZ, [29.45, 119.3], 1)],
        marks: [
          mk(SH, 'Shanghai', '上海', { dot: true, big: true, c: C.gold, t: 0.2 }), mk([32.91, 118.8], 'Nanjing', '南京', { c: C.white, t: 0.6 }),
          mk([32.51, 120.9], 'Suzhou', '苏州', { c: C.white, t: 0.8 }), mk([29.39, 119.3], 'Hangzhou', '杭州', { c: C.white, t: 1 }),
          mk(HF, 'Hefei', '合肥', { dot: true, c: C.white, t: 1.2 }), mk(NB, 'Ningbo', '宁波', { dot: true, c: C.white, t: 1.4 }),
        ],
        fig: { k: 'bars', title: ['Economy of the biggest cities, 2023', '长三角主要城市地区生产总值（2023 年）'], unit: ['trillion yuan (approx.)', '万亿元（约数）'], rows: [
          { name: ['Shanghai', '上海'], v: 4.72, c: C.gold }, { name: ['Suzhou', '苏州'], v: 2.47, c: C.teal }, { name: ['Hangzhou', '杭州'], v: 2.01, c: C.teal },
          { name: ['Nanjing', '南京'], v: 1.74, c: C.teal }, { name: ['Ningbo', '宁波'], v: 1.65, c: C.teal }, { name: ['Hefei', '合肥'], v: 1.27, c: C.teal },
        ] },
        task: ['Zoom in on the gold rail lines: most big cities are within one or two hours of Shanghai.', '放大看金色的高铁线：多数大城市到上海只需一两个小时。'],
        body: ['Dozens of cities crowd the delta, more densely than anywhere else in China: the Yangtze River Delta city cluster is one of the six largest in the world. Shanghai leads; Nanjing, Hangzhou and Hefei are provincial capitals; Suzhou, with its classical gardens and huge industrial park, is one of China\'s biggest industrial cities; Ningbo shares the Ningbo-Zhoushan port, the world\'s largest by tonnage. High-speed railways, motorways and the Yangtze waterway link them so closely that many people live in one city and work in another.',
          '长江三角洲城市密集，是我国城市最集中的地区，长江三角洲城市群是世界六大城市群之一。上海是核心；南京、杭州、合肥是省会城市；苏州既有古典园林，又有大型工业园区，是我国重要的工业城市；宁波舟山港货物吞吐量居世界第一。高速铁路、高速公路和长江黄金水道把城市紧密相连，“同城化”趋势明显。'],
      },
      {
        title: ['Growing as one', '长三角一体化发展'], cam: [31.2, 119.6, 1.8],
        paint: [{ fill: { k: 'poly', pts: YRD_REGION, c: C.teal, clip: CN }, a: 0.3 }, { fill: { k: 'poly', pts: [[31.2, 120.6], [31.25, 121.15], [30.95, 121.2], [30.8, 120.75], [30.95, 120.55]], c: C.green, clip: CN }, a: 0.85, t: 1.6 }],
        lines: [{ pts: G60, c: C.violet, w: 2.2, dur: 2, t: 0.4 }, lead([30.95, 120.9], [30.2, 124.0], 1.8, C.green)],
        marks: [
          mk(SH, 'Shanghai', '上海', { dot: true, c: C.gold, t: 0.2 }), mk(HF, 'Hefei', '合肥', { dot: true, c: C.white, t: 0.6 }),
          mk([30.1, 118.6], 'G60 sci-tech corridor', 'G60 科创走廊', { c: C.violet, t: 1.2 }), mk([30.14, 124.0], 'Green demo zone', '生态绿色一体化发展示范区', { c: C.green, t: 1.8 }),
        ],
        fig: { k: 'key', set: 'custom', title: ['Leading industries', '优势产业'], items: [
          { c: C.gold, name: ['Shanghai: chips, cars, finance, biomedicine', '上海：集成电路、汽车、金融、生物医药'] },
          { c: C.teal, name: ['Suzhou, Wuxi: electronics, equipment', '苏州、无锡：电子信息、装备制造'] },
          { c: C.green, name: ['Hangzhou: digital economy, e-commerce', '杭州：数字经济、电子商务'] },
          { c: C.violet, name: ['Hefei: science, displays, new-energy cars', '合肥：科学研究、新型显示、新能源汽车'] },
          { c: C.blue, name: ['Ningbo: port, petrochemicals', '宁波：港口、石化'] },
        ] },
        task: ['Follow the violet G60 corridor from Shanghai\'s Songjiang district inland to Hefei.', '沿着紫色的 G60 科创走廊，从上海松江一路向西找到合肥。'],
        body: ['In 2018 Yangtze River Delta integration became a national strategy. The four provinces and Shanghai share transport, science, environmental protection and public services: medical cards work across borders, and the G60 sci-tech corridor links nine cities from Shanghai to Hefei. Where Shanghai, Jiangsu and Zhejiang meet, a green integration demonstration zone tests shared planning. The delta leads China in chips, artificial intelligence, biomedicine and new-energy cars, and is learning to grow while protecting Taihu and its waterways.',
          '2018 年，长江三角洲区域一体化发展上升为国家战略。沪苏浙皖在交通、科技、生态环境和公共服务等方面协同合作：异地就医可直接结算，G60 科创走廊串联起从上海到合肥的九座城市；在沪苏浙交界处设立了长三角生态绿色一体化发展示范区。长三角在集成电路、人工智能、生物医药、新能源汽车等产业上走在全国前列，同时加强对太湖等水环境的保护。'],
      },
    ],
    quiz: [
      { q: ['Label the four big cities.', '在地图上标出这四座城市。'], place: [{ text: ['Shanghai', '上海'], at: SH, tolKm: 40 }, { text: ['Nanjing', '南京'], at: NJ, tolKm: 60 }, { text: ['Hangzhou', '杭州'], at: HZ, tolKm: 60 }, { text: ['Suzhou', '苏州'], at: SZ, tolKm: 40 }],
        why: ['Shanghai at the river mouth, Nanjing up the Yangtze, Hangzhou on Hangzhou Bay, Hefei further inland.', '上海在长江口，南京在长江下游沿岸，杭州在杭州湾畔，合肥更靠内陆。'] },
      { q: ['Match each city with what it is known for.', '把城市和它的特点连起来。'], match: [
        [['Shanghai', '上海'], ['World\'s busiest container port', '集装箱吞吐量世界第一的港口']],
        [['Hangzhou', '杭州'], ['West Lake and e-commerce', '西湖与电子商务']],
        [['Suzhou', '苏州'], ['Classical gardens and an industrial park', '古典园林与工业园区']],
        [['Hefei', '合肥'], ['Science city, new-energy cars', '科学城、新能源汽车']],
      ], why: ['Each city has its own strengths in the cluster.', '城市群中的城市各有所长、分工合作。'] },
      { q: ['Order the Grand Canal cities, north to south.', '把京杭运河沿线城市按从北到南排序。'], order: [['Beijing', '北京'], ['Tianjin', '天津'], ['Yangzhou', '扬州'], ['Suzhou', '苏州'], ['Hangzhou', '杭州']],
        why: ['The canal runs from Beijing to Hangzhou, crossing the Yangtze at Yangzhou.', '运河北起北京，南到杭州，在扬州一带穿过长江。'] },
      { q: ['Which natural conditions helped the delta develop? Pick all.', '哪些自然条件有利于长三角的发展？（多选）'], options: [['Flat plains', '地形平坦'], ['Dense rivers and lakes', '河湖密布'], ['Warm, wet climate', '气候温暖湿润'], ['At the mouth of the Yangtze, on the coast', '位于长江入海口，临海'], ['Rich coal and iron ore', '煤、铁资源丰富'], ['Long, cold winters', '冬季漫长寒冷']], multi: [0, 1, 2, 3],
        why: ['The delta is short of coal and iron; its winters are mild.', '长三角煤、铁资源缺乏，冬季温和。'] },
      { q: ['A truck crosses the 32.5 km Donghai Bridge at 65 km/h. How many minutes does it take?', '一辆货车以 65 千米/时的速度驶过 32.5 千米长的东海大桥，需要多少分钟？'], num: { answer: 30, tol: 1, unit: ['minutes', '分钟'] },
        why: ['32.5 ÷ 65 = 0.5 hours = 30 minutes.', '32.5 ÷ 65 = 0.5 小时 = 30 分钟。'] },
      { q: ['Which scene belongs in a Jiangnan water town?', '下列哪种景观属于江南水乡？'], options: [['White walls, black tiles, stone bridges over canals', '粉墙黛瓦、小桥流水'], ['Cave homes dug into loess', '黄土窑洞'], ['Felt tents on grassland', '草原上的蒙古包'], ['Flat-roofed stone houses on a plateau', '高原上的平顶碉房']], answer: 0,
        why: ['Water towns grew along canals on the wet, flat delta.', '水乡古镇沿河而建，与湿润平坦的环境相适应。'] },
      { q: ['Find Taihu.', '在地球上点出太湖。'], at: [31.2, 120.2], tolKm: 80,
        why: ['Taihu lies between Suzhou, Wuxi and Huzhou, west of Shanghai.', '太湖位于上海以西，苏州、无锡、湖州之间。'] },
    ],
  },
  {
    id: 'hk-macau', strand: 'china', tracks: [], grade: 'g8b', unit: regions, icon: 'sail', minutes: 7,
    title: ['Hong Kong and Macao', '香港和澳门'],
    blurb: ['Two special administrative regions at the Pearl River mouth, the bridge that joins them, and the Greater Bay Area.', '珠江口的两个特别行政区、港珠澳大桥与粤港澳大湾区。'],
    keys: [
      ['Hong Kong (1997) and Macao (1999) are special administrative regions under "one country, two systems".', '香港（1997 年）、澳门（1999 年）回归祖国，是实行“一国两制”的特别行政区。'],
      ['Hong Kong is an international centre of finance, trade and shipping, around Victoria Harbour.', '香港是国际金融、贸易和航运中心，维多利亚港是天然良港。'],
      ['Macao lives on tourism; its Historic Centre mixes Chinese and Western culture.', '澳门以旅游业为支柱，澳门历史城区体现了中西文化交融。'],
      ['From "front shop, back factory" to the Greater Bay Area, linked by the 55 km Hong Kong–Zhuhai–Macao Bridge.', '从“前店后厂”到粤港澳大湾区，55 千米的港珠澳大桥把三地连在一起。'],
    ],
    steps: [
      {
        title: ['Two special administrative regions', '两个特别行政区'], cam: [22.4, 113.8, 1.4],
        lines: [...PEARL_RIVERS.map((p, i) => ({ pts: p, c: C.blue, w: 1.6, flow: true, arrow: true, dur: 1.2, t: 0.2 + i * 0.2 })), lead(HK, HK_L, 0.8), lead(MO, [21.0, 110.6], 1.1)],
        marks: [
          mk(HK_L, 'Hong Kong SAR', '香港特别行政区', { c: C.pink, t: 0.9 }), mk([20.94, 110.6], 'Macao SAR', '澳门特别行政区', { c: C.pink, t: 1.2 }),
          mk([23.35, 112.4], 'Pearl River', '珠江', { c: C.blue, t: 0.6 }), mk([19.9, 113.2], 'South China Sea', '南海', { c: C.blue, t: 1.6 }),
        ],
        fig: { k: 'bars', title: ['People per km², about 2023', '人口密度（约 2023 年）'], unit: ['people per km²', '人/平方千米'], rows: [
          { name: ['Macao', '澳门'], v: 21000, c: C.pink }, { name: ['Hong Kong', '香港'], v: 6800, c: C.pink }, { name: ['Shanghai', '上海'], v: 3900, c: C.gold }, { name: ['China average', '全国平均'], v: 147, c: C.green },
        ] },
        task: ['Zoom in on the river mouth: Hong Kong is on the east side, Macao on the west, about 60 km apart.', '放大珠江口：香港在东侧，澳门在西侧，相距约 60 千米。'],
        body: ['Hong Kong and Macao lie on either side of the Pearl River Estuary, on the coast of the South China Sea. Both have been part of China since ancient times; China resumed sovereignty over Hong Kong on 1 July 1997 and over Macao on 20 December 1999. They are special administrative regions under "one country, two systems": as part of the People\'s Republic of China they keep their own economic system and way of life, with a high degree of autonomy. Both are small and very crowded — Macao is among the most densely populated places on Earth.',
          '香港和澳门分别位于珠江口东西两侧，濒临南海，自古以来就是中国的领土。1997 年 7 月 1 日和 1999 年 12 月 20 日，我国政府先后对香港、澳门恢复行使主权，设立香港特别行政区和澳门特别行政区，实行“一国两制”“港人治港”“澳人治澳”、高度自治的方针。两地面积小、人口稠密，澳门是世界上人口密度最大的地区之一。'],
      },
      {
        title: ['Hong Kong: finance, trade and shipping', '香港：国际金融、贸易和航运中心'], cam: [22.3, 114.17, 1.2], items: ['fs_midautumn'],
        lines: [lead(HK, HK_L, 0.3, C.pink)],
        marks: [mk(HK_L, 'Hong Kong', '香港', { big: true, c: C.pink, t: 0.3 }), mk([20.3, 113.3], 'South China Sea', '南海', { c: C.blue, t: 1 })],
        fig: harbourFig,
        task: ['Tap the Mid-Autumn pin in Hong Kong to see the city by night.', '点开香港的中秋节图标，看看夜色中的维多利亚港。'],
        body: ['Hong Kong (about 1,110 km², 7.5 million people) is made up of Hong Kong Island, Kowloon, the New Territories and over 200 islands. Victoria Harbour, deep and sheltered between Kowloon and Hong Kong Island, made it one of the world\'s great ports. Today Hong Kong is an international centre of finance, trade and shipping: banks crowd Central, its port and airport are among the busiest in the world, and finance, trade and logistics, tourism and professional services are its pillar industries. Land is so short that much of the city is built on reclaimed land and up steep hills.',
          '香港面积约 1110 平方千米，人口约 750 万，由香港岛、九龙、新界及 200 多个岛屿组成。维多利亚港水深港阔、风平浪静，是世界著名的天然良港。香港是国际金融、贸易和航运中心，中环银行林立，港口和机场都是世界上最繁忙的之一；金融、贸易及物流、旅游、专业服务是其支柱产业。香港平地少，不少城区建在填海造出的土地和陡峭的山坡上。'],
      },
      {
        title: ['Macao: where East meets West', '澳门：中西文化交融'], cam: [22.19, 113.55, 1.2],
        marks: [mk(MO, 'Macao', '澳门', { dot: true, big: true, c: C.pink, t: 0.3 }), mk([22.6, 113.0], 'Zhuhai, Hengqin', '珠海、横琴', { c: C.white, t: 1 })],
        lines: [lead(MO, [22.55, 113.25], 0.9)],
        fig: { k: 'line', title: ['Macao grows into the sea', '澳门填海造陆'], unit: ['land area, km² (approx.)', '陆地面积（平方千米，约数）'], x: [1912, 1999, 2009, 2023], series: [{ name: ['Macao', '澳门'], c: C.pink, y: [11.6, 23.8, 29.2, 33.3] }], min: 0 },
        task: ['Zoom right in: Macao is a small peninsula and two islands joined by reclaimed land.', '尽量放大：澳门由半岛和两个由填海连成一体的离岛组成。'],
        body: ['Macao is tiny — about 33 km², almost three times its size in 1912 thanks to land reclaimed from the sea — with about 680,000 people. For more than 400 years Chinese and Portuguese lived side by side here, and temples stand beside churches: the A-Ma Temple gave the city its name, and the façade of St Paul\'s is its symbol. The Historic Centre of Macao became a World Heritage site in 2005. Tourism, including gaming, is the pillar of the economy. To grow and diversify, Macao is working with Guangdong on nearby Hengqin island.',
          '澳门面积约 33 平方千米，由于填海造地，比 1912 年扩大了近两倍，人口约 68 万。400 多年来，中西方居民在这里共同生活，庙宇与教堂比邻而立：妈阁庙相传是澳门名称的由来，大三巴牌坊是澳门的标志。2005 年，澳门历史城区列入《世界遗产名录》。旅游业（包括博彩业）是澳门的支柱产业。为促进经济适度多元发展，澳门与广东合作建设横琴粤澳深度合作区。'],
      },
      {
        title: ['Front shop, back factory', '前店后厂'], cam: [22.75, 113.75, 1.5],
        paint: [{ fill: { k: 'poly', pts: [[23.5, 113.0], [23.3, 114.1], [22.6, 114.4], [22.1, 113.6], [22.2, 112.8], [22.9, 112.5]], c: C.orange, clip: CN }, a: 0.45 }],
        lines: [...arrows([[[22.35, 114.25], [22.95, 113.85]]], C.gold, 0.6, 2), ...arrows([[[23.0, 113.45], [22.4, 113.95]]], C.teal, 1.2, 2), lead(HK, HK_L, 0.3)],
        marks: [mk(HK_L, 'Hong Kong', '香港', { c: C.pink, t: 0.4 }), mk(SZN, 'Shenzhen', '深圳', { dot: true, c: C.white, t: 0.7 }), mk(GZ, 'Guangzhou', '广州', { dot: true, c: C.white, t: 0.9 }), mk([23.6, 112.6], 'Pearl River Delta', '珠江三角洲', { c: C.orange, t: 1.5 })],
        fig: shopFactory,
        task: ['Follow the arrows: orders and money go one way, finished goods the other.', '顺着箭头看：资金、订单流向珠三角，产品经香港流向世界。'],
        body: ['From the 1980s, after reform and opening-up, Hong Kong factories moved across the border into the Pearl River Delta, where land and labour were cheap. Hong Kong became the "front shop" — taking orders, raising money, designing and marketing, and shipping goods out through its port — while the delta became the "back factory". Shenzhen grew from a fishing town into a city of over 17 million. Now the delta has its own high-tech firms and the partnership runs both ways, in finance, science and services.',
          '20 世纪 80 年代改革开放以后，香港的大量工厂迁到土地和劳动力便宜的珠江三角洲。香港负责接订单、融资金、搞设计和营销，并通过港口把产品运往世界，是“前店”；珠三角负责加工生产，是“后厂”。深圳从一个小渔村发展成为常住人口超过 1700 万的大城市。如今珠三角高新技术产业迅速发展，粤港澳之间在金融、科技、服务等领域全面合作、优势互补。'],
      },
      {
        title: ['A bridge across the estuary', '港珠澳大桥'], cam: [22.35, 113.8, 1.2],
        lines: [{ pts: HZMB, c: C.gold, w: 2.6, dur: 1.4, t: 0.3 }, { pts: SZ_ZS_LINK, c: C.teal, w: 2, dur: 1, t: 1.2 }, { pts: XRL, c: C.red, w: 1.6, dur: 1.4, t: 1.8 }, lead(HK, HK_L, 0.2), lead(MO, MO_L, 0.2)],
        marks: [mk(HK_L, 'Hong Kong', '香港', { c: C.pink, t: 0.2 }), mk(MO_L, 'Zhuhai, Macao', '珠海、澳门', { c: C.pink, t: 0.2 }), mk(GZ, 'Guangzhou', '广州', { dot: true, c: C.white, t: 1.8 })],
        fig: hzmbFig,
        task: ['Find the three crossings: the gold bridge (2018), the teal Shenzhen–Zhongshan link (2024) and the red express railway (2018).', '找出三条通道：金色的港珠澳大桥（2018 年）、青色的深中通道（2024 年）和红色的广深港高铁（2018 年）。'],
        body: ['The Hong Kong–Zhuhai–Macao Bridge opened in October 2018. At 55 km it is the world\'s longest sea crossing of bridge and tunnel. In the middle, two artificial islands lead into a 6.7 km tunnel under the seabed, so that big ships can still pass and planes using Hong Kong airport are not blocked. The drive from Hong Kong to Zhuhai fell from about 3 hours round the estuary to about 45 minutes. The Guangzhou–Shenzhen–Hong Kong express rail link (2018) and the Shenzhen–Zhongshan Link (2024) tie the two sides even closer.',
          '港珠澳大桥于 2018 年 10 月正式通车，全长 55 千米，是世界上最长的跨海桥隧工程。大桥中段通过东西两个人工岛转入长约 6.7 千米的海底隧道，既不影响大型船舶通航，也不妨碍香港机场的航线。从香港到珠海的车程由绕行约 3 小时缩短到约 45 分钟。广深港高铁（2018 年）和深中通道（2024 年）让珠江口两岸联系更加紧密。'],
      },
      {
        title: ['The Greater Bay Area', '粤港澳大湾区'], cam: [22.9, 113.6, 1.6],
        paint: [{ fill: { k: 'poly', pts: GBA, c: C.violet, clip: CN }, a: 0.4 }],
        lines: [...PEARL_RIVERS.map(p => ({ pts: p, c: C.blue, w: 1.2, flow: true, dur: 1 })), { pts: HZMB, c: C.gold, w: 2, dur: 1, t: 0.4 }, lead(HK, HK_L, 0.3), lead(MO, MO_L, 0.3)],
        marks: [
          mk(GZ, 'Guangzhou', '广州', { dot: true, c: C.white, t: 0.4 }), mk(SZN, 'Shenzhen', '深圳', { dot: true, c: C.white, t: 0.6 }),
          mk(HK_L, 'Hong Kong', '香港', { c: C.pink, t: 0.8 }), mk(MO_L, 'Macao', '澳门', { c: C.pink, t: 1 }),
          mk([24.1, 113.0], 'Greater Bay Area', '粤港澳大湾区', { big: true, c: C.violet, t: 1.4 }),
        ],
        fig: { k: 'key', set: 'custom', title: ['9 + 2 cities', '“9 + 2”城市群'], items: [
          { c: C.violet, name: ['Guangzhou, Shenzhen, Zhuhai, Foshan, Huizhou, Dongguan, Zhongshan, Jiangmen, Zhaoqing', '广州、深圳、珠海、佛山、惠州、东莞、中山、江门、肇庆'] },
          { c: C.pink, name: ['Hong Kong SAR, Macao SAR', '香港特别行政区、澳门特别行政区'] },
        ] },
        task: ['Count the cities: nine in Guangdong, plus Hong Kong and Macao.', '数一数：广东 9 个城市，加上香港和澳门。'],
        body: ['In 2019 China published its plan for the Guangdong–Hong Kong–Macao Greater Bay Area: nine cities of the Pearl River Delta plus Hong Kong and Macao, about 56,000 km² with about 86 million people. Like the bay areas of Tokyo, New York and San Francisco, it aims to be a world-class city cluster. Hong Kong brings finance and world links, Macao tourism and links with Portuguese-speaking countries, Guangzhou trade and transport, and Shenzhen technology and innovation.',
          '2019 年，国家发布《粤港澳大湾区发展规划纲要》。大湾区包括珠三角 9 个城市和香港、澳门两个特别行政区，面积约 5.6 万平方千米，人口约 8600 万。与东京湾区、纽约湾区、旧金山湾区一样，它的目标是建设世界级城市群：香港发挥国际金融中心的优势，澳门建设世界旅游休闲中心和中国与葡语国家商贸合作服务平台，广州是商贸和交通枢纽，深圳是科技创新之城。'],
      },
    ],
    quiz: [
      { q: ['What does "one country, two systems" mean for Hong Kong and Macao?', '“一国两制”对港澳意味着什么？'], options: [['They are part of China but keep their own economic system and way of life', '它们是中国的一部分，同时保持原有的资本主义制度和生活方式'], ['They are separate countries', '它们是独立的国家'], ['They are run as ordinary provinces', '它们和普通省份一样管理'], ['They belong to two countries at once', '它们同时属于两个国家']], answer: 0,
        why: ['They are special administrative regions of the People\'s Republic of China with a high degree of autonomy.', '港澳是中华人民共和国的特别行政区，享有高度自治权。'] },
      { q: ['Put these events in order, earliest first.', '把这些事件按时间先后排序。'], order: [['Hong Kong returns to China', '香港回归祖国'], ['Macao returns to China', '澳门回归祖国'], ['Hong Kong–Zhuhai–Macao Bridge opens', '港珠澳大桥通车'], ['Greater Bay Area plan published', '《粤港澳大湾区发展规划纲要》发布']],
        why: ['1997, 1999, 2018, 2019.', '依次为 1997 年、1999 年、2018 年、2019 年。'] },
      { q: ['Match each city with its main role.', '把城市和它的主要特色连起来。'], match: [
        [['Hong Kong', '香港'], ['International finance, trade and shipping', '国际金融、贸易和航运中心']],
        [['Macao', '澳门'], ['Tourism and a World Heritage old town', '旅游业与世界遗产历史城区']],
        [['Shenzhen', '深圳'], ['Tech and innovation, grown from a fishing town', '由小渔村发展起来的科技创新之城']],
        [['Guangzhou', '广州'], ['Provincial capital, trade and transport hub', '省会、商贸和交通枢纽']],
      ], why: ['The bay area\'s cities complement one another.', '大湾区城市优势互补。'] },
      { q: ['Hong Kong covers about 1,110 km², Macao about 33 km². About how many times bigger is Hong Kong?', '香港面积约 1110 平方千米，澳门约 33 平方千米。香港大约是澳门的多少倍？'], num: { answer: 34, tol: 3, unit: ['times', '倍'] },
        why: ['1,110 ÷ 33 ≈ 34.', '1110 ÷ 33 ≈ 34，香港约为澳门的 34 倍。'] },
      { q: ['In "front shop, back factory", what did the Pearl River Delta provide? Pick all.', '在“前店后厂”中，珠江三角洲提供了什么？（多选）'], options: [['Land', '土地'], ['Cheap labour', '廉价劳动力'], ['International banking', '国际金融服务'], ['Overseas orders and marketing', '海外订单和营销']], multi: [0, 1],
        why: ['Hong Kong brought money, orders and marketing; the delta had land and workers.', '香港提供资金、订单和营销，珠三角提供土地和劳动力。'] },
      { q: ['Label the map.', '在地图上标出这些地方。'], place: [{ text: ['Hong Kong', '香港'], at: HK, tolKm: 35 }, { text: ['Macao', '澳门'], at: MO, tolKm: 35 }, { text: ['Guangzhou', '广州'], at: GZ, tolKm: 35 }],
        why: ['Hong Kong is east of the Pearl River mouth, Macao west of it, Guangzhou at its head.', '香港在珠江口东侧，澳门在西侧，广州在珠江口北面。'] },
      { q: ['Why does the Hong Kong–Zhuhai–Macao Bridge dive into a tunnel in the middle?', '港珠澳大桥中段为什么要转入海底隧道？'],
        options: [['So big ships can pass and planes near Hong Kong airport are not blocked', '不影响大型船舶通航，也不妨碍香港机场的航线'], ['Because the sea there is too shallow for a bridge', '因为那里海水太浅，无法建桥'],
          ['To save money: tunnels are cheaper than bridges', '为了省钱：隧道比桥便宜'], ['To keep out typhoon rain', '为了躲避台风降雨']], answer: 0,
        why: ['The 6.7 km tunnel, between two artificial islands, keeps the main shipping channel and the airport\'s flight paths clear.', '长约 6.7 千米的海底隧道连接东西两个人工岛，既保证了主航道通航，又避开了机场航线。'] },
    ],
  },
  {
    id: 'taiwan', strand: 'china', tracks: [], grade: 'g8b', unit: regions, icon: 'leaf', minutes: 8,
    title: ['Taiwan Province', '祖国的神圣领土——台湾省'],
    blurb: ['Mountains in the east and plains in the west, typhoons and rain, a treasure island of farms and factories.', '东部多山、西部平原，台风与多雨，物产丰富的宝岛与加工出口工业。'],
    keys: [
      ['Taiwan is an inseparable part of China, across the Taiwan Strait from Fujian.', '台湾是祖国神圣领土不可分割的一部分，隔台湾海峡与福建相望。'],
      ['Mountains cover two thirds of the island; Yushan (3,952 m) is the highest peak in eastern China. The plains are in the west.', '台湾岛山地约占 2/3，玉山海拔 3952 米，是我国东部最高峰；平原分布在西部。'],
      ['The Tropic of Cancer crosses it; summers bring typhoons, and Huoshaoliao is China\'s wettest place.', '北回归线穿过台湾岛中部，夏秋多台风，火烧寮是我国年降水量最多的地方。'],
      ['A "treasure island" of rice, sugar cane, tea, fruit and forests, with export processing and high-tech industry.', '台湾盛产稻米、甘蔗、茶叶、水果和林木，被誉为“宝岛”；加工出口工业和高新技术产业发达。'],
    ],
    steps: [
      {
        title: ['Across the Taiwan Strait', '隔海相望'], cam: [24.3, 120.3, 1.6],
        paint: [{ fill: { k: 'land', a2: TW, c: C.green }, a: 0.5 }],
        lines: [{ pts: TW_STRAIT_NARROW, c: C.gold, w: 2, dur: 1, t: 0.8 }, lead([25.45, 119.82], [26.15, 120.4], 1, C.gold)],
        marks: [
          mk([23.6, 121.0], 'Taiwan Island', '台湾岛', { big: true, c: C.green, t: 0.3 }), mk([26.3, 118.2], 'Fujian', '福建', { c: C.white, t: 0.5 }),
          mk([24.0, 119.4], 'Taiwan Strait', '台湾海峡', { c: C.blue, t: 0.7 }), mk([26.21, 120.4], 'Pingtan', '平潭', { c: C.gold, t: 1 }),
          mk([23.5, 123.4], 'Pacific Ocean', '太平洋', { c: C.blue, t: 1.3 }),
        ],
        fig: { k: 'bars', title: ['China\'s largest islands', '我国的大岛'], unit: ['km² (approx.)', '平方千米（约数）'], rows: [
          { name: ['Taiwan', '台湾岛'], v: 35800, c: C.green }, { name: ['Hainan', '海南岛'], v: 33900, c: C.teal }, { name: ['Chongming', '崇明岛'], v: 1270, c: C.blue },
        ] },
        task: ['Follow the gold line across the strait\'s narrowest part, from Pingtan to Hsinchu: about 130 km.', '沿着金色线段横跨海峡最窄处，从平潭到新竹，约 130 千米。'],
        body: ['Taiwan Province includes Taiwan Island, Penghu, Diaoyu and other islands. Taiwan Island, about 36,000 km², is China\'s largest island. It lies off the south-east coast, facing Fujian across the Taiwan Strait — only about 130 km wide at its narrowest — with the East China Sea to the north, the Pacific to the east and the South China Sea to the south. Taiwan has been part of China since ancient times. Most people are Han, with ancestors mainly from Fujian and Guangdong; the Gaoshan are the island\'s earliest inhabitants.',
          '台湾省包括台湾岛及其附近的澎湖列岛、钓鱼岛等岛屿。台湾岛面积约 3.6 万平方千米，是我国第一大岛。它位于我国东南沿海，西隔台湾海峡与福建省相望，海峡最窄处只有约 130 千米；北临东海，东临太平洋，南临南海。台湾自古以来就是中国的领土。台湾居民以汉族为主，祖籍多是福建和广东，高山族是岛上最早的居民。'],
      },
      {
        title: ['Mountains east, plains west', '东部多山，西部平原'], cam: [23.7, 121.0, 1.4], sketch: true,
        paint: [{ fill: { k: 'land', a2: TW, c: C.green }, a: 0.3 }, { fill: { k: 'poly', pts: TW_WEST_PLAIN, c: C.lime, clip: TW }, a: 0.6, t: 1.6 }],
        lines: [...(['xueshan', 'central', 'yushan', 'alishan', 'coastal'] as const).map((k, i): Line => ({ pts: TW_RANGES[k], c: C.brown, w: 2.4, dur: 1, t: 0.3 + i * 0.25 })),
          lead(YUSHAN, [23.1, 123.4], 1.4, C.gold), lead([23.2, 120.2], [22.8, 118.3], 1.8, C.lime)],
        marks: [mk([23.04, 123.4], 'Yushan 3,952 m', '玉山 3952 米', { c: C.gold, t: 1.4 }), mk([24.3, 121.55], 'Central Range', '中央山脉', { c: C.brown, t: 0.8 }), mk([22.74, 118.3], 'Western plains', '西部平原', { c: C.lime, t: 1.8 })],
        fig: twProfile,
        task: ['Tilt the globe and look along the island: the ranges run north-east to south-west.', '倾斜地球、顺着岛的走向看：山脉大致呈东北—西南走向。'],
        body: ['Mountains cover about two thirds of Taiwan Island. Five ranges run along it from north-east to south-west: the Central Range forms its backbone, with the Xueshan, Yushan and Alishan ranges to the west and the Coastal Range in the east. Yushan, at 3,952 m, is the highest peak in eastern China. The east coast drops steeply into the Pacific, while the west has wide plains and terraces — the Jianan Plain is the largest — where most people, farms and cities are. Rivers are short and fast, and rich in water power.',
          '台湾岛山地约占全岛面积的 2/3。山脉多呈东北—西南走向，中央山脉纵贯南北，是全岛的“脊梁”，西侧有雪山山脉、玉山山脉和阿里山山脉，东侧有海岸山脉。玉山海拔 3952 米，是我国东部的最高峰。东部山地直逼海岸，西部是平原和台地，以嘉南平原面积最大，人口、农田和城市多集中在这里。台湾的河流短小流急，水能丰富。'],
      },
      {
        title: ['Typhoons and heavy rain', '台风与丰沛的降水'], cam: [23.5, 122.5, 2.2], sketch: true,
        paint: [{ fill: { k: 'land', a2: TW, c: C.green }, a: 0.3 }],
        lines: [par(23.44, C.gold, 0.3, { w: 1 }), { pts: TYPHOON, c: C.red, w: 2.4, flow: true, arrow: true, dur: 2.2, t: 1 }, ...arrows([[[27.6, 125.5], [25.4, 122.3]]], C.ice, 1.8, 2), lead([25.0, 121.73], [24.3, 124.6], 2.3, C.blue)],
        marks: [
          mk([24.24, 124.6], 'Huoshaoliao: 6,000+ mm', '火烧寮：6000 毫米以上', { c: C.blue, t: 2.3 }), mk([23.1, 124.6], 'Tropic of Cancer', '北回归线', { c: C.gold, t: 0.6 }),
          mk([19.3, 127.4], 'Summer typhoons', '夏秋台风', { c: C.red, t: 1.4 }), mk([28.0, 126.6], 'NE winter monsoon', '冬季东北季风', { c: C.ice, t: 2 }),
        ],
        fig: { k: 'bars', title: ['Average rain per year', '年平均降水量'], unit: ['mm (approx.)', '毫米（约数）'], rows: [
          { name: ['Huoshaoliao', '火烧寮'], v: 6500, c: C.blue }, { name: ['Taipei', '台北'], v: 2400, c: C.teal }, { name: ['Shanghai', '上海'], v: 1250, c: C.green }, { name: ['Beijing', '北京'], v: 580, c: C.gold },
        ] },
        task: ['Follow the red typhoon track from the Pacific: Taiwan stands right in its path.', '顺着红色台风路径看：台湾正处在太平洋台风北上的路上。'],
        body: ['The Tropic of Cancer crosses the middle of the island: the north has a subtropical monsoon climate, the south a tropical one. Summers are long and hot, winters warm. Taiwan gets plenty of rain, especially on windward slopes. Huoshaoliao, in the north-east, faces the wet north-east monsoon in winter as well as summer rains and typhoons, and gets over 6,000 mm a year — the most in China. From summer to autumn typhoons often strike: they bring vital rain but also floods, landslides and damage.',
          '北回归线穿过台湾岛中部，北部属于亚热带季风气候，南部属于热带季风气候，夏季长而炎热，冬季温暖。台湾降水丰沛，迎风坡尤其多雨。东北部的火烧寮冬季迎着来自海洋的东北季风，夏秋又有季风降水和台风雨，年降水量在 6000 毫米以上，是我国年降水量最多的地方。夏秋季节台风频繁，既带来丰沛的降水，也常造成洪涝、滑坡等灾害。'],
      },
      {
        title: ['A treasure island', '物产丰富的宝岛'], cam: [23.7, 121.0, 1.4], items: ['fs_lantern'],
        paint: [{ fill: { k: 'land', a2: TW, c: C.green }, a: 0.45 }, { fill: { k: 'poly', pts: TW_WEST_PLAIN, c: C.gold, clip: TW }, a: 0.55, t: 0.6 }],
        marks: [mk([23.1, 119.4], 'Rice, sugar cane', '稻米、甘蔗', { c: C.gold, t: 0.8 }), mk([24.1, 121.3], 'Forests, camphor', '森林、樟树', { c: C.green, t: 1.2 }), mk([22.6, 121.3], 'Tropical fruit', '热带水果', { c: C.orange, t: 1.6 }), mk([25.4, 122.5], 'Fishing', '海洋渔业', { c: C.blue, t: 2 })],
        fig: { k: 'bars', title: ['Forest cover', '森林覆盖率'], unit: ['% (approx.)', '%（约数）'], rows: [
          { name: ['Taiwan Island', '台湾岛'], v: 60, c: C.green }, { name: ['World', '世界'], v: 31, c: C.teal }, { name: ['China as a whole', '全国'], v: 24, c: C.lime },
        ] },
        task: ['Tap the lantern pin: the Pingxi sky-lantern festival is in the hills near Taipei.', '点开天灯图标：平溪天灯节就在台北附近的山区。'],
        body: ['Warmth, rain and fertile plains make Taiwan a "treasure island". The western plains grow two or three crops of rice a year, and sugar cane in the south-west. Tea grows on misty hillsides — Alishan and Dongding oolong are famous — and fruit includes bananas, pineapples and mangoes. About 60% of the island is forested, from tropical trees low down to conifers on the peaks; Taiwan was once the world\'s biggest producer of camphor, from its camphor trees. The warm and cold currents offshore make good fishing grounds.',
          '台湾气候温暖湿润，西部平原土壤肥沃，物产丰富，被誉为“宝岛”。西部平原水稻一年两熟至三熟，西南部盛产甘蔗；山区云雾缭绕，适宜种茶，阿里山茶、冻顶乌龙茶闻名；香蕉、菠萝、芒果等水果四季不断。台湾森林覆盖率约 60%，从山脚的热带林到山顶的针叶林，林木种类繁多，樟树曾使台湾成为世界上最大的樟脑产地，有“樟脑王国”之称。台湾附近海域寒暖流交汇，渔业资源丰富。'],
      },
      {
        title: ['Export processing and high tech', '加工出口工业与高新技术产业'], cam: [23.8, 120.8, 1.4], items: ['taipei101'],
        lines: [lead([24.8, 120.97], [24.85, 120.25], 0.6)],
        marks: [mk(TPE, 'Taipei', '台北', { dot: true, c: C.white, t: 0.3 }), mk([24.85, 120.25], 'Hsinchu', '新竹', { c: C.violet, t: 0.7 }), mk(KHH, 'Kaohsiung', '高雄', { dot: true, c: C.orange, t: 1 }), mk([24.15, 120.67], 'Taichung', '台中', { dot: true, c: C.white, t: 1.3 })],
        fig: epzFig,
        task: ['Tap the Taipei 101 pin, then find Kaohsiung, the biggest port, in the south-west.', '点开台北 101 的图标，再找到西南部的最大港口高雄。'],
        body: ['With few minerals and a small home market, Taiwan built its industry on processing for export: it imported raw materials and parts, used its workers and ports to assemble them, and sold the products abroad. The first export processing zone opened at Kaohsiung in 1966, making clothes, toys and electronics. Since the Hsinchu Science Park opened in 1980, Taiwan has moved into computers and chips and is now one of the world\'s leading chip makers. The main cities — Taipei, Kaohsiung, Taichung, Tainan — and the ports of Kaohsiung and Keelung are on the west side.',
          '台湾矿产资源不多，岛内市场狭小，因此大力发展加工出口工业：进口原料和零部件，利用劳动力和港口优势加工装配，产品销往海外。1966 年，高雄设立了第一个加工出口区，生产服装、玩具和电子产品。1980 年新竹科学工业园区建立后，台湾逐步发展电脑、芯片等高新技术产业，成为世界重要的芯片生产地。台北、高雄、台中、台南等主要城市和高雄、基隆等港口都分布在西部。'],
      },
      {
        title: ['Sun Moon Lake, Alishan and links across the strait', '日月潭、阿里山与两岸交流'], cam: [24.2, 120.0, 1.6],
        paint: [{ fill: { k: 'land', a2: TW, c: C.green }, a: 0.3 }],
        lines: [
          { pts: [[26.07, 119.3], [25.08, 121.23]], c: C.gold, w: 1.4, flow: true, dur: 1, t: 1.2 }, { pts: [[24.48, 118.09], [22.57, 120.35]], c: C.gold, w: 1.4, flow: true, dur: 1, t: 1.5 },
          { pts: [[31.2, 121.8], [25.08, 121.23]], c: C.gold, w: 1.4, flow: true, dur: 1.2, t: 1.8 }, lead([23.51, 120.8], [23.4, 120.1], 0.6),
        ],
        marks: [
          mk([23.86, 120.92], 'Sun Moon Lake', '日月潭', { dot: true, c: C.teal, t: 0.3 }), mk([23.4, 120.1], 'Alishan', '阿里山', { c: C.green, t: 0.6 }),
          mk([26.07, 119.3], 'Fuzhou', '福州', { dot: true, c: C.white, t: 1 }), mk([24.48, 118.09], 'Xiamen', '厦门', { dot: true, c: C.white, t: 1.2 }),
        ],
        fig: { k: 'line', title: ['Trade across the strait', '两岸贸易额'], unit: ['billion US$ (approx.)', '十亿美元（约数）'], x: [2000, 2005, 2010, 2015, 2020, 2022], series: [{ name: ['trade', '贸易额'], c: C.gold, y: [31, 91, 145, 189, 261, 320] }], notes: [{ x: 2008, text: ['Three Links', '全面“三通”'] }], min: 0 },
        task: ['Follow the gold lines: direct flights and shipping now link Taiwan with Fujian, Shanghai and beyond.', '顺着金色线看：两岸已实现直接通航，台湾与福建、上海等地往来便捷。'],
        body: ['Sun Moon Lake, in the mountains of central Taiwan, is the island\'s largest natural lake, named for its round eastern half and crescent-shaped western half. Alishan is famous for sunrise over a sea of clouds, giant ancient trees and its mountain railway. Ties across the strait are close: since direct mail, trade and transport — the "Three Links" — were fully opened in 2008, flights and ships cross daily, and the mainland is Taiwan\'s largest trading partner. Many families on both sides share roots in Fujian and Guangdong.',
          '日月潭位于台湾中部山区，是台湾最大的天然湖泊，因东半部形如圆日、西半部形如弯月而得名。阿里山以日出、云海、神木和森林小火车闻名。两岸同胞血脉相连，交流密切：2008 年两岸实现全面直接“三通”（通邮、通商、通航），往来航班和船舶每天穿梭于海峡之间，大陆是台湾最大的贸易伙伴。'],
      },
    ],
    quiz: [
      { q: ['Order these places on a west–east line across Taiwan.', '把这些地方按台湾岛从西到东的顺序排列。'], order: [['Taiwan Strait', '台湾海峡'], ['Jianan Plain', '嘉南平原'], ['Yushan', '玉山'], ['East rift valley', '花东纵谷'], ['Pacific Ocean', '太平洋']],
        why: ['Plains in the west, high mountains in the middle, then a rift valley and the Coastal Range before the Pacific.', '西部是平原，中部是高山，东部有纵谷和海岸山脉，再往东是太平洋。'] },
      { q: ['The coast is 28 °C. Temperature falls about 0.6 °C per 100 m. What is it on top of Yushan (3,952 m)?', '山脚海边气温 28 ℃，海拔每升高 100 米气温约下降 0.6 ℃，玉山顶（3952 米）气温约是多少？'], num: { answer: 4.3, tol: 0.6, unit: ['°C', '摄氏度'] },
        why: ['3,952 ÷ 100 × 0.6 ≈ 23.7 °C cooler: 28 − 23.7 ≈ 4.3 °C.', '降温约 3952 ÷ 100 × 0.6 ≈ 23.7 ℃，山顶气温约 28 − 23.7 ≈ 4.3 ℃。'] },
      { q: ['Match each place with what it is known for.', '把地方和它的特点连起来。'], match: [
        [['Yushan', '玉山'], ['Highest peak in eastern China', '我国东部最高峰']],
        [['Sun Moon Lake', '日月潭'], ['Taiwan\'s largest natural lake', '台湾最大的天然湖泊']],
        [['Huoshaoliao', '火烧寮'], ['China\'s wettest place', '我国年降水量最多的地方']],
        [['Kaohsiung', '高雄'], ['Biggest port, first export processing zone', '最大港口，第一个加工出口区']],
      ], why: ['Each is a classic fact about Taiwan.', '这些都是台湾地理的典型特征。'] },
      { q: ['Which are typical products of Taiwan? Pick all.', '下列哪些是台湾的特产？（多选）'], options: [['Rice', '稻米'], ['Sugar cane', '甘蔗'], ['Tea', '茶叶'], ['Camphor', '樟脑'], ['Long-staple cotton', '长绒棉'], ['Highland barley', '青稞']], multi: [0, 1, 2, 3],
        why: ['Long-staple cotton comes from Xinjiang, highland barley from the Qinghai–Tibet Plateau.', '长绒棉产自新疆，青稞产自青藏高原。'] },
      { q: ['Label the map.', '在地图上标出这些地方。'], place: [{ text: ['Taipei', '台北'], at: TPE, tolKm: 40 }, { text: ['Kaohsiung', '高雄'], at: KHH, tolKm: 40 }, { text: ['Yushan', '玉山'], at: YUSHAN, tolKm: 40 }],
        why: ['Taipei in the north, Kaohsiung in the south-west, Yushan in the central mountains.', '台北在北部，高雄在西南部，玉山在中部山区。'] },
      { q: ['Why is Huoshaoliao so wet?', '火烧寮降水特别多的主要原因是'], options: [['It faces the wet north-east monsoon in winter and gets summer rain and typhoons too', '冬季迎着来自海洋的东北季风，夏秋又多季风雨和台风雨'], ['It is on the Equator', '它位于赤道上'], ['It lies in a rain shadow', '它位于背风坡'], ['Cold currents bring rain', '寒流带来降水']], answer: 0,
        why: ['Moist winds rise up its windward slopes almost all year.', '一年中大部分时间湿润气流都沿迎风坡抬升，形成降水。'] },
      { q: ['Find the Taiwan Strait.', '在地球上点出台湾海峡。'], at: [24.3, 119.6], tolKm: 120,
        why: ['The strait lies between Fujian and Taiwan Island.', '台湾海峡位于福建与台湾岛之间。'] },
    ],
  },
  {
    id: 'xinjiang', strand: 'china', tracks: [], grade: 'g8b', unit: regions, icon: 'mountain', minutes: 8,
    title: ['Xinjiang: mountains, deserts and oases', '新疆：山地、沙漠与绿洲'],
    blurb: ['Three ranges and two basins, the Tarim River, oasis farms and karez, Turpan, gas pipelines and the Silk Road.', '三山夹两盆、塔里木河、绿洲农业与坎儿井、吐鲁番盆地、西气东输与丝绸之路。'],
    keys: [
      ['Xinjiang\'s landforms are "three ranges enclosing two basins": Altai, Junggar Basin, Tianshan, Tarim Basin, Kunlun.', '新疆地形为“三山夹两盆”：阿尔泰山、准噶尔盆地、天山、塔里木盆地、昆仑山。'],
      ['Far from the sea, it is very dry; rivers are fed by snow and ice melt and end inland, like the Tarim.', '新疆深居内陆、气候干旱，河流多由冰雪融水补给，塔里木河是我国最长的内流河。'],
      ['Oases at the foot of the mountains grow cotton and sweet fruit, watered by meltwater, karez and drip irrigation.', '山麓绿洲依靠冰雪融水、坎儿井和滴灌发展农业，盛产棉花和瓜果。'],
      ['Gas flows east from Xinjiang, and the old Silk Road is a Belt and Road gateway again.', '西气东输把新疆的天然气送往东部；古丝绸之路如今是“一带一路”的重要通道。'],
    ],
    steps: [
      {
        title: ['Three ranges and two basins', '三山夹两盆'], cam: [42.5, 85.0, 2.6],
        paint: [{ fill: { k: 'poly', pts: XINJIANG, c: C.orange, clip: CN }, a: 0.18 }, { fill: { k: 'poly', pts: JUNGGAR, c: C.gold, clip: CN }, a: 0.3, t: 1 }, { fill: { k: 'poly', pts: GURBANTUNGGUT, c: C.gold, clip: CN }, a: 0.35, t: 1.2 }, { fill: { k: 'poly', pts: TAKLIMAKAN, c: C.gold, clip: CN }, a: 0.4, t: 1.6 }],
        lines: [...[ALTAI, TIANSHAN, KUNLUN].map((p, i) => ({ pts: p, c: C.brown, w: 3, dur: 1.4, t: 0.3 + i * 0.6 })), { pts: ALTUN, c: C.brown, w: 1.6, dur: 1, t: 1.8 }],
        marks: [
          mk([48.6, 88.6], 'Altai Mts', '阿尔泰山', { c: C.brown, t: 0.6 }), mk([45.6, 86.8], 'Junggar Basin', '准噶尔盆地', { c: C.gold, t: 1.2 }),
          mk([42.75, 84.5], 'Tianshan', '天山', { c: C.brown, t: 1.2 }), mk([39.4, 83.0], 'Tarim Basin', '塔里木盆地', { c: C.gold, t: 1.8 }),
          mk([35.6, 84.0], 'Kunlun Mts', '昆仑山', { c: C.brown, t: 1.8 }),
        ],
        fig: xjSection,
        task: ['Turn the globe north to south across Xinjiang and name each range and basin in turn.', '从北向南扫过新疆，依次说出每一座山脉和盆地的名字。'],
        body: ['Xinjiang, about 1.66 million km², is China\'s largest provincial-level region — one sixth of the country. Its landforms are often summed up as "three ranges enclosing two basins". From north to south: the Altai Mountains; the Junggar Basin; the Tianshan, which splits Xinjiang into the north and south; the Tarim Basin, China\'s largest inland basin; and the Kunlun Mountains on the edge of the Qinghai–Tibet Plateau. The basins are dry and sandy in the middle, while the high mountains catch snow and hold glaciers.',
          '新疆面积约 166 万平方千米，约占全国的 1/6，是我国面积最大的省级行政区。新疆的地形可以概括为“三山夹两盆”：从北到南依次是阿尔泰山、准噶尔盆地、天山、塔里木盆地和昆仑山。天山把新疆分为“北疆”和“南疆”；塔里木盆地是我国面积最大的内陆盆地。盆地中部干旱多沙，高山上则积雪终年不化，发育着大量冰川。'],
      },
      {
        title: ['The Taklimakan and the Tarim River', '塔克拉玛干沙漠与塔里木河'], cam: [39.6, 83.5, 2.2], sketch: true,
        paint: [{ fill: { k: 'poly', pts: TAKLIMAKAN, c: C.gold, clip: CN }, a: 0.5 }],
        lines: [
          ...TARIM_FEEDERS.map((p, i) => ({ pts: p, c: C.ice, w: 1.4, flow: true, dur: 1.2, t: 0.3 + i * 0.2 })),
          { pts: TARIM, c: C.blue, w: 2.4, flow: true, arrow: true, dur: 1.6, t: 1 },
          { pts: [[41.7, 84.25], [40.4, 84.1], [38.8, 83.6], [37.07, 82.7]], c: C.orange, w: 1.6, dur: 1.2, t: 2 },
        ],
        marks: [
          mk([39.2, 80.6], 'Taklimakan Desert', '塔克拉玛干沙漠', { big: true, c: C.gold, t: 0.4 }), mk([41.55, 86.4], 'Tarim River', '塔里木河', { c: C.blue, t: 1.4 }),
          mk([38.2, 85.4], 'Desert highway', '沙漠公路', { c: C.orange, t: 2.2 }),
        ],
        fig: { k: 'line', title: ['Tarim River flow through the year', '塔里木河径流量的季节变化'], unit: ['illustrative, m³/s', '示意，立方米/秒'], x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], series: [{ name: ['flow', '径流量'], c: C.blue, y: [60, 55, 60, 70, 150, 450, 1100, 1300, 600, 150, 80, 65] }], notes: [{ x: 7.5, text: ['summer melt', '夏季冰雪融化'] }], min: 0 },
        task: ['Trace the pale blue meltwater rivers down from the mountains into the Tarim.', '顺着浅蓝色的冰雪融水河流，从高山一直追到塔里木河。'],
        body: ['The Taklimakan, about 337,000 km², is China\'s largest desert and one of the world\'s biggest seas of shifting sand. Around it, rivers fed by melting snow and glaciers on the Tianshan, the Karakoram and the Kunlun flow into the Tarim River. At about 2,180 km it is China\'s longest inland river: it never reaches the sea, but dries up or ends in lakes in the desert. Its flow peaks in July and August, when the mountain ice melts fastest, and almost stops in winter. A 522 km highway (1995) crosses the desert, protected by belts of plants watered by drip lines.',
          '塔克拉玛干沙漠面积约 33.7 万平方千米，是我国面积最大的沙漠，也是世界上最大的流动沙漠之一。天山、喀喇昆仑山和昆仑山上的冰雪融水汇成河流，注入塔里木河。塔里木河全长约 2179 千米，是我国最长的内流河，最终消失在沙漠中或注入尾闾湖泊。它的流量在 7、8 月气温最高、冰雪融化最多时达到最大，冬季几乎断流。1995 年建成的塔里木沙漠公路长 522 千米，两旁用滴灌种植防护林带来固沙。'],
      },
      {
        title: ['Oasis farming', '绿洲农业'], cam: [41.5, 83.0, 2.4],
        paint: OASES.map((p, i) => ({ fill: { k: 'poly' as const, pts: p, c: C.green, clip: CN }, a: 0.75, t: 0.3 + i * 0.3 })),
        lines: [TIANSHAN, KUNLUN].map(p => ({ pts: p, c: C.brown, w: 1.6, dur: 1 })),
        marks: [
          mk([44.3, 86.04], 'Shihezi', '石河子', { dot: true, c: C.white, t: 1 }), mk([41.17, 80.26], 'Aksu: long-staple cotton', '阿克苏：长绒棉', { dot: true, c: C.white, t: 1.3 }),
          mk(KASHGAR, 'Kashgar', '喀什', { dot: true, c: C.white, t: 1.6 }), mk([37.11, 79.93], 'Hotan', '和田', { dot: true, c: C.white, t: 1.9 }),
          mk([41.73, 86.15], 'Korla: pears', '库尔勒：香梨', { dot: true, c: C.white, t: 2.2 }),
        ],
        fig: { k: 'pie', title: ['China\'s cotton harvest, 2023', '2023 年全国棉花产量'], parts: [{ name: ['Xinjiang', '新疆'], v: 91, c: C.green }, { name: ['Rest of China', '其他省区'], v: 9, c: C.blue }] },
        task: ['Zoom in on the green belts: oases follow the foot of the mountains, where meltwater comes out.', '放大绿色地带：绿洲沿山麓分布，那里正是冰雪融水流出的地方。'],
        body: ['Rain is scarce in Xinjiang, but where meltwater runs out of the mountains onto the plains, green oases appear, ringing the basins like a necklace. Long sunny days and a large difference between day and night temperatures — "fur coat in the morning, silk at noon, watermelon by the stove" — let crops store more sugar: Turpan grapes, Hami melons and Korla pears are famous. Xinjiang grows about 90% of China\'s cotton, including high-quality long-staple cotton around Aksu. Drip irrigation under plastic film saves water, which is precious: if too much is used, rivers shrink and deserts spread.',
          '新疆降水稀少，但高山冰雪融水流出山口，在山麓冲积扇上形成一片片绿洲，像项链一样环绕在盆地边缘。这里光照充足，昼夜温差大，“早穿皮袄午穿纱，围着火炉吃西瓜”，有利于作物积累糖分，吐鲁番的葡萄、哈密的瓜、库尔勒的香梨闻名全国。新疆的棉花产量约占全国的 90%，阿克苏一带出产优质长绒棉。这里推广膜下滴灌，十分节水。水是绿洲的生命，用水过度会导致河流断流、土地沙化。'],
      },
      {
        title: ['Turpan: below sea level', '吐鲁番盆地'], cam: [42.9, 89.3, 1.4],
        paint: [{ fill: { k: 'poly', pts: TURPAN_BASIN, c: C.red, clip: CN }, a: 0.4 }],
        lines: [{ pts: FLAMING_MTS, c: C.orange, w: 3, dur: 1, t: 0.6 }, { pts: TIANSHAN.slice(6, 10), c: C.brown, w: 2, dur: 1 },
          lead([42.65, 89.27], [41.75, 89.27], 1, C.blue), lead([42.95, 90.2], [43.3, 91.6], 0.8, C.orange), lead([43.8, 88.32], [44.75, 88.32], 1.4)],
        marks: [
          mk([41.69, 89.27], 'Aydingkol Lake −154 m', '艾丁湖 −154 米', { c: C.blue, t: 1 }), mk([43.36, 91.6], 'Flaming Mountains', '火焰山', { c: C.orange, t: 0.8 }),
          mk([44.81, 88.32], 'Bogda Peak 5,445 m', '博格达峰 5445 米', { c: C.white, t: 1.4 }),
        ],
        fig: karezFig,
        task: ['Find Aydingkol Lake, then Bogda Peak just 150 km away: almost 5,600 m of difference.', '找到艾丁湖，再找到仅约 150 千米外的博格达峰：两地高差近 5600 米。'],
        body: ['The Turpan Basin, at the eastern end of the Tianshan, sinks below sea level: Aydingkol Lake, at about −154 m, is the lowest point in China. Shut in by mountains and far from the sea, it is China\'s hottest place — summer air has passed 50 °C, and the red Flaming Mountains shimmer in the heat. Yet Turpan grows grapes and melons thanks to the karez: tunnels dug from the mountain foot that carry groundwater by gravity to the oasis, losing little to evaporation on the way. Turpan has about 1,100 karez, some 5,000 km in all.',
          '吐鲁番盆地位于天山东段，地势低于海平面，其中艾丁湖湖面海拔约 −154 米，是我国陆地最低点。盆地四周高山环绕，又深居内陆，是我国最热的地方，夏季气温曾超过 50 ℃，红色的火焰山热浪滚滚。吐鲁番依靠坎儿井发展绿洲农业：从山麓开挖竖井和暗渠，让地下水依靠重力自流到绿洲，暗渠在地下，蒸发损失少。吐鲁番现有坎儿井约 1100 条，总长约 5000 千米。'],
      },
      {
        title: ['Gas to the east', '西气东输'], cam: [37.0, 98.0, 3.4], sketch: true,
        lines: [
          { pts: CENTRAL_ASIA_GAS, c: C.violet, w: 2, flow: true, dur: 1.4, t: 0.3 },
          { pts: WEST_EAST_GAS_1, c: C.orange, w: 2.2, flow: true, arrow: true, dur: 2.6, t: 0.8 },
          { pts: WEST_EAST_GAS_2, c: C.gold, w: 2.2, flow: true, arrow: true, dur: 2.6, t: 1.6 },
        ],
        marks: [
          mk([41.75, 84.3], 'Tarim gas fields', '塔里木气田', { dot: true, c: C.orange, t: 0.8 }), mk(KHORGOS, 'Khorgos', '霍尔果斯', { dot: true, c: C.violet, t: 1.2 }),
          mk(SH, 'Shanghai', '上海', { dot: true, c: C.white, t: 3 }), mk(GZ, 'Guangzhou', '广州', { dot: true, c: C.white, t: 3.6 }),
        ],
        fig: { k: 'key', set: 'custom', title: ['Pipelines', '输气管道'], items: [
          { c: C.orange, name: ['West–East line 1 (2004): Tarim → Shanghai, about 4,000 km', '西气东输一线（2004 年）：塔里木—上海，约 4000 千米'] },
          { c: C.gold, name: ['West–East line 2 (2012): Khorgos → Guangzhou', '西气东输二线（2012 年）：霍尔果斯—广州'] },
          { c: C.violet, name: ['Central Asia–China pipeline (2009), from Turkmenistan', '中亚天然气管道（2009 年），起自土库曼斯坦'] },
        ] },
        task: ['Follow the pipelines east: which big cities does the gas reach?', '沿着管道向东走：天然气最终送到了哪些大城市？'],
        body: ['Under Xinjiang\'s basins lie large fields of oil and natural gas; Karamay, in the Junggar Basin, was the first big oilfield of the People\'s Republic. The eastern provinces need far more energy than they have, so the West–East Gas Pipeline carries gas thousands of kilometres east: line 1 opened in 2004 from the Tarim Basin to Shanghai, and line 2 brings gas from Central Asia via Khorgos to Guangzhou and Hong Kong. Burning gas instead of coal cuts smoke and carbon, and the project brings income and jobs to Xinjiang.',
          '新疆的盆地中蕴藏着丰富的石油和天然气，准噶尔盆地的克拉玛依油田是新中国第一个大油田。东部地区能源需求大、资源不足，于是国家建设了西气东输工程：一线于 2004 年建成，从塔里木盆地通到上海；二线把来自中亚的天然气经霍尔果斯输送到广州、香港等地。用天然气代替煤炭，减少了大气污染和碳排放，也促进了新疆的经济发展。'],
      },
      {
        title: ['The Silk Road, then and now', '丝绸之路的今昔'], cam: [40.5, 82.0, 2.8], items: ['vy_silkroad', 'cn_mogao'], borders: true,
        lines: [{ pts: SILK_NORTH, c: C.gold, w: 1.8, dur: 2, t: 0.3 }, { pts: SILK_SOUTH, c: C.gold, w: 1.8, dur: 2, t: 0.6 }, { pts: [[43.83, 87.62], [44.6, 84.5], [45.17, 82.57]], c: C.red, w: 1.6, dur: 1, t: 1.6 }, { pts: [[43.83, 87.62], [44.21, 80.42]], c: C.red, w: 1.6, dur: 1, t: 1.8 },
          lead(KHORGOS, [45.75, 78.2], 1.8, C.red), lead([45.17, 82.57], [47.75, 83.6], 2, C.red)],
        marks: [
          mk(KASHGAR, 'Kashgar', '喀什', { dot: true, c: C.gold, t: 0.8 }), mk(URUMQI, 'Ürümqi', '乌鲁木齐', { dot: true, big: true, c: C.white, t: 1 }),
          mk([45.9, 78.2], 'Khorgos', '霍尔果斯', { c: C.red, t: 1.8 }), mk([47.9, 83.6], 'Alashankou', '阿拉山口', { c: C.red, t: 2 }),
        ],
        fig: { k: 'climo', city: 'urumqi' },
        task: ['Tap the Silk Road pin; then find the two land ports where trains now leave for Europe.', '点开丝绸之路的图标，再找出如今开往欧洲的班列经过的两个口岸。'],
        body: ['Over 2,000 years ago the Silk Road crossed Xinjiang, its caravans going round the Taklimakan by oases on its northern and southern edges, through towns like Kashgar. Today Xinjiang is again a gateway: it borders eight countries, and China–Europe freight trains leave through Alashankou and Khorgos. Ürümqi, the capital, is the city farthest from any sea in the world — about 2,500 km — which is why its climate is so dry, with cold winters and hot summers. Xinjiang is home to the Uygur, Han, Kazak, Hui and many other peoples.',
          '2000 多年前，丝绸之路就从新疆穿过，商队沿着塔克拉玛干沙漠南北边缘的绿洲前行，喀什等城镇因此繁荣。如今新疆再次成为向西开放的门户：它与 8 个国家接壤，中欧班列从阿拉山口、霍尔果斯出境驶向欧洲。首府乌鲁木齐是世界上离海洋最远的城市，距海约 2500 千米，因此气候干燥，冬冷夏热。新疆生活着维吾尔族、汉族、哈萨克族、回族等多个民族。'],
      },
    ],
    quiz: [
      { q: ['Put the ranges and basins in order, north to south.', '把新疆的山脉和盆地按从北到南的顺序排列。'], order: [['Altai Mountains', '阿尔泰山'], ['Junggar Basin', '准噶尔盆地'], ['Tianshan', '天山'], ['Tarim Basin', '塔里木盆地'], ['Kunlun Mountains', '昆仑山']],
        why: ['"Three ranges enclosing two basins": Altai, Junggar, Tianshan, Tarim, Kunlun.', '“三山夹两盆”：阿尔泰山、准噶尔盆地、天山、塔里木盆地、昆仑山。'] },
      { q: ['Label the three ranges.', '在地图上标出三大山脉。'], place: [{ text: ['Tianshan', '天山'], at: [42.9, 84.0], tolKm: 250 }, { text: ['Kunlun Mountains', '昆仑山'], at: [36.0, 82.5], tolKm: 250 }, { text: ['Altai Mountains', '阿尔泰山'], at: [47.6, 89.3], tolKm: 250 }],
        why: ['The Altai is in the far north, the Tianshan across the middle, the Kunlun in the south.', '阿尔泰山在最北，天山横贯中部，昆仑山在南部。'] },
      { q: ['Bogda Peak is 5,445 m, Aydingkol Lake −154 m. What is the difference in height?', '博格达峰海拔 5445 米，艾丁湖湖面海拔 −154 米，两地相对高度是多少？'], num: { answer: 5599, tol: 10, unit: ['m', '米'] },
        why: ['5,445 − (−154) = 5,599 m.', '相对高度 = 5445 − (−154) = 5599 米。'] },
      { q: ['Why are Xinjiang\'s melons and grapes so sweet? Pick all.', '新疆的瓜果为什么特别甜？（多选）'], options: [['Long hours of strong sunshine', '光照充足'], ['Big difference between day and night temperatures', '昼夜温差大'], ['Heavy summer rain', '夏季降水丰富'], ['Mild, cloudy weather', '天气温和多云']], multi: [0, 1],
        why: ['Sunny days build sugar; cool nights mean less is used up.', '白天光照强、光合作用旺盛，夜间气温低、消耗少，糖分积累多。'] },
      { q: ['Match each place with its product.', '把地方和特产连起来。'], match: [
        [['Turpan', '吐鲁番'], ['Grapes', '葡萄']], [['Hami', '哈密'], ['Melons', '哈密瓜']], [['Aksu', '阿克苏'], ['Long-staple cotton', '长绒棉']],
        [['Karamay', '克拉玛依'], ['Oil', '石油']], [['Korla', '库尔勒'], ['Fragrant pears', '香梨']],
      ], why: ['Oasis farming and mineral wealth both matter in Xinjiang.', '新疆既有绿洲农业，又有丰富的矿产资源。'] },
      { q: ['Where does most of the Tarim River\'s water come from?', '塔里木河的水主要来自'], options: [['Melting snow and glaciers', '高山冰雪融水'], ['Monsoon rain', '季风降水'], ['The sea', '海水'], ['Underground hot springs', '地下温泉']], answer: 0,
        why: ['That is why its flow peaks in July and August.', '所以它的流量在 7、8 月最大。'] },
      { q: ['Find the Turpan Basin.', '在地球上点出吐鲁番盆地。'], at: [42.8, 89.3], tolKm: 150,
        why: ['At the eastern end of the Tianshan, south-east of Ürümqi.', '位于天山东段、乌鲁木齐东南。'] },
    ],
  },
  {
    id: 'china-world', strand: 'china', tracks: [], grade: 'g8b', unit: world, icon: 'globe', minutes: 8,
    title: ['China in the world', '中国在世界中'],
    blurb: ['A top economy and trader, the Belt and Road, China–Europe trains, our seas and islands, and the climate pledge.', '经济大国与贸易大国、“一带一路”、中欧班列、海洋权益与南海诸岛，以及“双碳”目标。'],
    keys: [
      ['China is the world\'s second-largest economy, its biggest manufacturer and its biggest trader in goods.', '中国是世界第二大经济体、第一制造业大国和第一货物贸易大国。'],
      ['The Belt and Road (2013) links China with Asia, Europe and Africa by land and sea.', '“一带一路”倡议（2013 年）通过陆上和海上通道，把中国与亚欧非各国联系起来。'],
      ['The South China Sea Islands and the Diaoyu Islands are China\'s territory; territorial seas reach 12 nautical miles.', '南海诸岛、钓鱼岛是中国的领土；领海宽度为 12 海里。'],
      ['China aims to peak carbon emissions by 2030 and reach carbon neutrality by 2060.', '中国力争 2030 年前实现碳达峰、2060 年前实现碳中和。'],
    ],
    steps: [
      {
        title: ['A top economy', '世界第二大经济体'], cam: [33.0, 104.0, 3.2], wide: true,
        paint: [{ fill: { k: 'land', a2: CN, c: C.red }, a: 0.55 }, { fill: { k: 'land', a2: TW, c: C.red }, a: 0.55 }],
        marks: [mk([35.0, 103.0], 'China', '中国', { big: true, c: C.white, t: 0.4 })],
        fig: { k: 'bars', title: ['Largest economies, 2024', '世界主要经济体的经济总量（2024 年）'], unit: ['trillion US$ (approx.)', '万亿美元（约数）'], rows: [
          { name: ['United States', '美国'], v: 29.2, c: C.blue }, { name: ['China', '中国'], v: 18.7, c: C.red }, { name: ['Germany', '德国'], v: 4.7, c: C.blue },
          { name: ['Japan', '日本'], v: 4.0, c: C.blue }, { name: ['India', '印度'], v: 3.9, c: C.blue },
        ] },
        task: ['Spin the globe: how much of the world can you see from China\'s side?', '转动地球：从中国这一侧，能看到世界的多大部分？'],
        body: ['Since reform and opening-up began in 1978, China has grown from a poor farming country into the world\'s second-largest economy. Since 2010 it has been the largest manufacturer, making about 30% of the world\'s factory goods — from phones and solar panels to ships and electric cars — and since 2013 the largest trader in goods. But with about 1.4 billion people, output per person is still far below that of rich countries: China is still a developing country, with more to do.',
          '1978 年改革开放以来，中国从一个贫穷的农业国发展成为世界第二大经济体。自 2010 年起，中国连续多年是世界第一制造业大国，生产了全球约 30% 的工业制成品，从手机、太阳能电池板到船舶和电动汽车；自 2013 年起成为世界第一货物贸易大国。但中国人口约 14 亿，人均水平与发达国家相比仍有较大差距，中国仍然是发展中国家。'],
      },
      {
        title: ['Trading partners', '主要贸易伙伴'], cam: [30.0, 70.0, 3.4], wide: true, items: ['vh_container'],
        paint: [
          { fill: { k: 'land', a2: CN, c: C.red }, a: 0.5 }, { fill: { k: 'land', a2: TW, c: C.red }, a: 0.5 },
          { fill: { k: 'land', a2: ['ID', 'MY', 'TH', 'VN', 'PH', 'SG', 'MM', 'KH', 'LA', 'BN'], c: C.teal }, a: 0.55, t: 0.6 },
          { fill: { k: 'land', a2: ['DE', 'FR', 'IT', 'ES', 'PL', 'NL', 'BE', 'AT', 'CZ', 'SE', 'FI', 'PT', 'GR', 'HU', 'RO', 'BG', 'SK', 'DK', 'IE', 'HR', 'SI', 'LT', 'LV', 'EE', 'LU'], c: C.blue }, a: 0.5, t: 1 },
          { fill: { k: 'land', a2: ['US'], c: C.violet }, a: 0.5, t: 1.4 },
          { fill: { k: 'land', a2: ['JP', 'KR'], c: C.gold }, a: 0.55, t: 1.8 },
        ],
        marks: [mk([5.0, 110.0], 'ASEAN', '东盟', { big: true, c: C.teal, t: 0.8 }), mk([50.0, 12.0], 'EU', '欧盟', { big: true, c: C.blue, t: 1.2 })],
        fig: { k: 'bars', title: ['China\'s trade by partner, 2024', '中国与主要贸易伙伴的进出口额（2024 年）'], unit: ['billion US$ (approx.)', '十亿美元（约数）'], rows: [
          { name: ['ASEAN', '东盟'], v: 980, c: C.teal }, { name: ['European Union', '欧盟'], v: 790, c: C.blue }, { name: ['United States', '美国'], v: 690, c: C.violet },
          { name: ['South Korea', '韩国'], v: 330, c: C.gold }, { name: ['Japan', '日本'], v: 310, c: C.gold },
        ] },
        task: ['Tap the container ship, then find China\'s biggest trading partner on the globe.', '点开集装箱船，再在地球上找出中国最大的贸易伙伴。'],
        body: ['China trades with more than 200 countries and regions. Its neighbours in South-East Asia — the ten countries of ASEAN — are now its largest trading partner, followed by the European Union and the United States. China imports oil, gas, iron ore and soybeans, and exports machines, electronics, clothing, cars and much more. Most of this trade goes by container ship through ports such as Shanghai, Ningbo-Zhoushan and Shenzhen.',
          '中国与 200 多个国家和地区有贸易往来。东南亚的东盟十国已成为中国最大的贸易伙伴，其次是欧盟和美国。中国进口石油、天然气、铁矿石、大豆等，出口机械设备、电子产品、服装、汽车等。这些货物大多由集装箱船经上海港、宁波舟山港、深圳港等港口运输。'],
      },
      {
        title: ['The Belt and Road', '“一带一路”'], cam: [30.0, 72.0, 3.4], wide: true, items: ['dc_nanhai1'],
        lines: [
          { pts: BELT, c: C.red, w: 2.4, flow: true, arrow: true, dur: 3, t: 0.3 },
          { pts: ROAD, c: C.blue, w: 2.4, flow: true, arrow: true, dur: 3.4, t: 1 },
          { pts: ROAD_AFRICA, c: C.blue, w: 2, flow: true, arrow: true, dur: 1.2, t: 3 },
        ],
        marks: [
          mk([34.27, 108.95], "Xi'an", '西安', { dot: true, c: C.red, t: 0.3 }), mk([24.85, 118.7], 'Quanzhou', '泉州', { dot: true, c: C.blue, t: 1 }),
          mk([1.3, 103.6], 'Strait of Malacca', '马六甲海峡', { c: C.blue, t: 1.8 }), mk([6.9, 79.85], 'Colombo', '科伦坡', { dot: true, c: C.blue, t: 2.2 }),
          mk([30.6, 32.3], 'Suez Canal', '苏伊士运河', { dot: true, c: C.blue, t: 3 }), mk([37.94, 23.64], 'Piraeus', '比雷埃夫斯港', { dot: true, c: C.blue, t: 3.6 }),
          mk([51.92, 4.48], 'Rotterdam', '鹿特丹', { dot: true, c: C.red, t: 3.3 }),
        ],
        fig: { k: 'key', set: 'custom', title: ['The Belt and Road', '“一带一路”'], items: [
          { c: C.red, name: ['Silk Road Economic Belt (overland)', '丝绸之路经济带（陆上）'] },
          { c: C.blue, name: ['21st-Century Maritime Silk Road', '21 世纪海上丝绸之路'] },
        ] },
        task: ['Follow the blue sea road from Quanzhou: which strait and canal does it pass?', '沿着蓝色海上航线从泉州出发：它经过了哪个海峡和哪条运河？'],
        body: ['In 2013 China proposed the Belt and Road Initiative, named after the ancient Silk Roads. The "Belt" is the Silk Road Economic Belt overland, through Central Asia and on to Europe; the "Road" is the 21st-Century Maritime Silk Road, from China\'s coast through the South China Sea, the Strait of Malacca and the Indian Ocean to Africa and, via the Suez Canal, the Mediterranean. Quanzhou, a great port of the old maritime Silk Road, is now a World Heritage site. More than 150 countries have signed up to build ports, railways, power and trade links together.',
          '2013 年，中国提出共建“丝绸之路经济带”和“21 世纪海上丝绸之路”，简称“一带一路”倡议。“一带”是陆上通道，经中亚通往欧洲；“一路”是海上通道，从我国沿海经南海、马六甲海峡、印度洋，通往非洲，并经苏伊士运河进入地中海。古代海上丝绸之路的起点之一泉州，已被列入世界遗产名录。目前已有 150 多个国家参与共建，共同修建港口、铁路、电站，开展贸易合作。'],
      },
      {
        title: ['China–Europe freight trains', '中欧班列'], cam: [45.0, 60.0, 3.2], wide: true, items: ['vh_transsib'], sketch: true,
        lines: [{ pts: CR_EXPRESS, c: C.gold, w: 2.4, flow: true, arrow: true, dur: 3.4, t: 0.3 }],
        marks: [
          mk([29.56, 106.55], 'Chongqing', '重庆', { dot: true, c: C.gold, t: 0.3 }), mk([45.17, 82.57], 'Alashankou', '阿拉山口', { dot: true, c: C.white, t: 1.2 }),
          mk([55.75, 37.62], 'Moscow', '莫斯科', { dot: true, c: C.white, t: 2.4 }), mk([51.43, 6.76], 'Duisburg', '杜伊斯堡', { dot: true, c: C.gold, t: 3.4 }),
        ],
        fig: { k: 'bars', title: ['China to Europe: time in transit', '从中国到欧洲的运输时间'], unit: ['days (approx.)', '天（约数）'], rows: [
          { name: ['Container ship', '海运'], v: 35, c: C.blue }, { name: ['Freight train', '中欧班列'], v: 15, c: C.gold }, { name: ['Air cargo', '空运'], v: 2.5, c: C.violet },
        ] },
        task: ['Follow the gold train from Chongqing to Duisburg: where does it leave China?', '跟着金色的班列从重庆开到杜伊斯堡：它从哪里出境？'],
        body: ['The first China–Europe Railway Express ran from Chongqing to Duisburg in Germany in 2011. By late 2024 more than 100,000 trains had made the trip, reaching over 200 cities in 25 European countries. A train takes about two weeks, much faster than a ship around Asia (about five weeks) and far cheaper than a plane. It carries laptops, car parts and clothes west, and wine, machinery and food east, helping inland cities like Chongqing, Chengdu and Xi\'an trade directly with Europe.',
          '2011 年，首列中欧班列从重庆开往德国杜伊斯堡。到 2024 年底，中欧班列累计开行超过 10 万列，通达欧洲 25 个国家的 200 多个城市。班列运输约需两周，比绕行亚洲的海运（约五周）快得多，运费又比空运低得多。班列向西运出笔记本电脑、汽车零部件、服装等，向东运回葡萄酒、机械、食品等，使重庆、成都、西安等内陆城市能直接与欧洲开展贸易。'],
      },
      {
        title: ['Building together', '共建合作项目'], cam: [15.0, 70.0, 3.4], wide: true,
        lines: [CHINA_LAOS_RAIL, JAKARTA_BANDUNG, MOMBASA_NAIROBI, BUDAPEST_BELGRADE].map((p, i) => ({ pts: p, c: C.gold, w: 3, dur: 1, t: 0.4 + i * 0.5 })),
        marks: [
          mk([17.97, 102.63], 'Vientiane', '万象', { dot: true, c: C.gold, t: 0.6 }), mk([-6.2, 106.85], 'Jakarta', '雅加达', { dot: true, c: C.gold, t: 1.1 }),
          mk([-1.29, 36.82], 'Nairobi', '内罗毕', { dot: true, c: C.gold, t: 1.6 }), mk([44.79, 20.45], 'Belgrade', '贝尔格莱德', { dot: true, c: C.gold, t: 2.1 }),
          mk([37.94, 23.64], 'Piraeus port', '比雷埃夫斯港', { dot: true, c: C.blue, t: 2.4 }),
        ],
        fig: { k: 'bars', title: ['Railways built with China (length)', '中外合作修建的铁路（长度）'], unit: ['km (approx.)', '千米（约数）'], rows: [
          { name: ['China–Laos (2021)', '中老铁路（2021）'], v: 1035, c: C.gold }, { name: ['Mombasa–Nairobi (2017)', '蒙内铁路（2017）'], v: 480, c: C.gold },
          { name: ['Budapest–Belgrade', '匈塞铁路'], v: 350, c: C.gold }, { name: ['Jakarta–Bandung (2023)', '雅万高铁（2023）'], v: 142, c: C.gold },
        ] },
        task: ['Find the four gold railways — one in Africa, one in Europe and two in South-East Asia.', '找出四条金色铁路：非洲一条、欧洲一条、东南亚两条。'],
        body: ['Under the Belt and Road, China has helped partner countries build much-needed infrastructure. The China–Laos Railway (2021) turned land-locked Laos into a "land-linked" country; the Jakarta–Bandung line (2023) is South-East Asia\'s first high-speed railway; the Mombasa–Nairobi railway (2017) links Kenya\'s capital to the sea; the Budapest–Belgrade line is being upgraded; and the Greek port of Piraeus, run by a Chinese company, has become one of the Mediterranean\'s busiest. Such projects create jobs and trade — and must also respect local people and the environment.',
          '在“一带一路”框架下，中国与合作伙伴共建了一批基础设施。中老铁路（2021 年通车）让内陆国老挝从“陆锁国”变成“陆联国”；雅万高铁（2023 年通车）是东南亚第一条高速铁路；蒙内铁路（2017 年通车）把肯尼亚首都内罗毕与出海口蒙巴萨连接起来；匈塞铁路正在升级改造；中国企业运营的希腊比雷埃夫斯港已成为地中海最繁忙的港口之一。这些项目带来了就业和贸易，同时也要尊重当地民众、保护环境。'],
      },
      {
        title: ['Our seas and islands', '海洋权益与南海诸岛'], cam: [17.0, 117.0, 2.6], borders: true,
        paint: [{ fill: { k: 'land', a2: CN, c: C.red }, a: 0.35 }, { fill: { k: 'land', a2: TW, c: C.red }, a: 0.35 }],
        lines: [lead([15.9, 114.4], [16.9, 118.2], 1, C.gold)],
        marks: [
          mk([20.7, 116.75], 'Dongsha Is.', '东沙群岛', { dot: true, c: C.gold, t: 0.4 }), mk([16.5, 112.0], 'Xisha Is.', '西沙群岛', { dot: true, c: C.gold, t: 0.7 }),
          mk([16.96, 118.2], 'Zhongsha Is.', '中沙群岛', { c: C.gold, t: 1 }), mk([10.0, 114.0], 'Nansha Is.', '南沙群岛', { dot: true, c: C.gold, t: 1.3 }),
          mk([3.97, 112.27], 'Zengmu Ansha', '曾母暗沙', { dot: true, c: C.white, t: 1.6 }), mk([25.74, 123.47], 'Diaoyu Dao', '钓鱼岛', { dot: true, c: C.white, t: 1.9 }),
          mk([12.9, 116.0], 'South China Sea', '南海', { big: true, c: C.blue, t: 0.2 }),
        ],
        fig: seaZones,
        task: ['Find the four island groups of the South China Sea, then Zengmu Ansha at the southern tip.', '找出南海的四大群岛，再找到最南端的曾母暗沙。'],
        body: ['China\'s seas cover about 4.7 million km², of which about 3 million km² are under its jurisdiction. Under the law of the sea, a country\'s territorial sea reaches 12 nautical miles (about 22 km) from its baselines, and its exclusive economic zone 200 nautical miles, where it controls the fish, oil and gas. The South China Sea Islands — the Dongsha, Xisha, Zhongsha and Nansha Islands — have been Chinese territory since ancient times; Zengmu Ansha in the Nansha is the southernmost point of China\'s territory. The Diaoyu Islands, north-east of Taiwan, are also China\'s. Protecting our maritime rights also means protecting the ocean itself.',
          '我国海域面积约 470 万平方千米，其中管辖海域约 300 万平方千米。按照海洋法，领海宽度为从领海基线量起 12 海里（约 22 千米），专属经济区不超过 200 海里，沿海国对其中的渔业、油气等资源享有主权权利。南海诸岛包括东沙群岛、西沙群岛、中沙群岛和南沙群岛，自古以来就是中国的领土，南沙群岛的曾母暗沙是我国领土的最南端。台湾东北的钓鱼岛及其附属岛屿也是中国的固有领土。维护海洋权益，也要保护好海洋环境。'],
      },
      {
        title: ['A green promise', '“双碳”目标与全球合作'], cam: [36.0, 108.0, 2.6],
        paint: [{ fill: { k: 'land', a2: CN, c: C.green }, a: 0.2 }, { fill: { k: 'land', a2: TW, c: C.green }, a: 0.2 }],
        marks: [
          mk([42.4, 117.3], 'Saihanba forest', '塞罕坝林场', { dot: true, c: C.green, t: 0.4 }), mk([40.3, 108.5], 'Kubuqi Desert greening', '库布其沙漠治理', { dot: true, c: C.gold, t: 0.8 }),
          mk([30.82, 111.0], 'Three Gorges hydropower', '三峡水电站', { dot: true, c: C.blue, t: 1.2 }), mk([36.1, 100.4], 'Talatan solar park', '塔拉滩光伏园区', { dot: true, c: C.orange, t: 1.6 }),
        ],
        fig: { k: 'line', title: ['Non-fossil share of China\'s energy use', '非化石能源占我国能源消费的比重'], unit: ['%', '%'], x: [2005, 2010, 2015, 2020, 2023, 2025, 2030],
          series: [{ name: ['actual', '实际'], c: C.green, y: [7.4, 9.4, 12.0, 15.9, 17.9, null, null] }, { name: ['target', '目标'], c: C.gold, y: [null, null, null, null, 17.9, 20, 25] }], min: 0 },
        task: ['Find the four green and clean-energy places on the map; which one is a forest planted by hand?', '在地图上找到四处绿色发展和清洁能源的地点，哪一处是人工种出的林海？'],
        body: ['As a large country, China takes part in solving global problems: it sends peacekeepers, gives aid, and joined the Paris Agreement on climate change. In 2020 China pledged to peak its carbon dioxide emissions before 2030 and reach carbon neutrality before 2060. It now builds more wind and solar power than any other country and makes most of the world\'s solar panels and electric-car batteries. At home, people turned the barren Saihanba into a vast forest and greened much of the Kubuqi Desert — examples now shared with the world.',
          '作为负责任的大国，中国积极参与解决全球性问题：派出维和部队、开展对外援助，并加入了应对气候变化的《巴黎协定》。2020 年，中国提出二氧化碳排放力争于 2030 年前达到峰值，努力争取 2060 年前实现碳中和。中国的风电、光伏装机容量世界第一，生产了全球大部分的太阳能电池板和动力电池。在国内，塞罕坝几代人把荒原变成了林海，库布其沙漠也得到大面积治理，这些经验正在与世界分享。'],
      },
    ],
    quiz: [
      { q: ['Which is China\'s largest trading partner today?', '目前中国最大的贸易伙伴是'], options: [['ASEAN', '东盟'], ['European Union', '欧盟'], ['United States', '美国'], ['Japan', '日本']], answer: 0,
        why: ['The ten ASEAN countries next door, ahead of the EU and the US.', '是近邻东盟十国，其次是欧盟和美国。'] },
      { q: ['Match each project with its country.', '把合作项目与所在国家连起来。'], match: [
        [['China–Laos Railway', '中老铁路'], ['Laos', '老挝']], [['Jakarta–Bandung high-speed rail', '雅万高铁'], ['Indonesia', '印度尼西亚']],
        [['Mombasa–Nairobi Railway', '蒙内铁路'], ['Kenya', '肯尼亚']], [['Piraeus port', '比雷埃夫斯港'], ['Greece', '希腊']],
      ], why: ['Belt and Road projects reach Asia, Africa and Europe.', '“一带一路”合作项目遍及亚洲、非洲和欧洲。'] },
      { q: ['Put the stops on the Maritime Silk Road in order, starting from China.', '把 21 世纪海上丝绸之路上的地点按从中国出发的顺序排列。'], order: [['Quanzhou', '泉州'], ['Strait of Malacca', '马六甲海峡'], ['Colombo', '科伦坡'], ['Suez Canal', '苏伊士运河'], ['Piraeus', '比雷埃夫斯港']],
        why: ['South China Sea → Malacca → Indian Ocean → Red Sea and Suez → Mediterranean.', '南海 → 马六甲海峡 → 印度洋 → 红海与苏伊士运河 → 地中海。'] },
      { q: ['The territorial sea is 12 nautical miles wide; 1 nautical mile = 1.852 km. How many km is that?', '领海宽度为 12 海里，1 海里 = 1.852 千米。领海宽约多少千米？'], num: { answer: 22.2, tol: 0.3, unit: ['km', '千米'] },
        why: ['12 × 1.852 ≈ 22.2 km.', '12 × 1.852 ≈ 22.2 千米。'] },
      { q: ['Which island groups belong to the South China Sea Islands? Pick all.', '下列哪些属于南海诸岛？（多选）'], options: [['Xisha Islands', '西沙群岛'], ['Nansha Islands', '南沙群岛'], ['Dongsha Islands', '东沙群岛'], ['Zhoushan Islands', '舟山群岛'], ['Penghu Islands', '澎湖列岛']], multi: [0, 1, 2],
        why: ['Dongsha, Xisha, Zhongsha and Nansha; Zhoushan is in the East China Sea, Penghu in the Taiwan Strait.', '南海诸岛包括东沙、西沙、中沙、南沙群岛；舟山群岛在东海，澎湖列岛在台湾海峡。'] },
      { q: ['Label the map.', '在地图上标出这些地点。'], place: [{ text: ['Xisha Islands', '西沙群岛'], at: [16.5, 112.0], tolKm: 200 }, { text: ['Diaoyu Dao', '钓鱼岛'], at: [25.74, 123.47], tolKm: 200 }, { text: ['Zengmu Ansha', '曾母暗沙'], at: [3.97, 112.27], tolKm: 200 }],
        why: ['Zengmu Ansha is China\'s southernmost point; the Diaoyu Islands lie north-east of Taiwan.', '曾母暗沙是我国领土的最南端；钓鱼岛位于台湾岛东北。'] },
      { q: ['By when does China aim to reach carbon neutrality?', '中国力争在哪一年前实现碳中和？'], options: [['2030', '2030'], ['2050', '2050'], ['2060', '2060'], ['2100', '2100']], answer: 2,
        why: ['Carbon peak before 2030, carbon neutrality before 2060.', '2030 年前碳达峰，2060 年前碳中和。'] },
    ],
  },
];
