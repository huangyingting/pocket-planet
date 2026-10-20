/** Strings for the sky theatre (loaded with it, so they live here instead of the global dictionary). */
import { lang } from '../lib/i18n.ts';

type Pair = { en: string; zh: string };
const S = {
  title: { en: 'Sky Events', zh: '天象' },
  subtitle: { en: 'Eclipses, meteor showers and planets: when, where, and what you will see', zh: '日食、月食、流星雨和行星：什么时候、在哪里、能看到什么' },
  close: { en: 'Close', zh: '关闭' },
  list: { en: 'Calendar', zh: '天象日历' },
  f_top: { en: 'Highlights', zh: '精选' },
  f_eclipse: { en: 'Eclipses', zh: '日食月食' },
  f_meteor: { en: 'Meteors', zh: '流星雨' },
  f_moon: { en: 'Moon', zh: '月相' },
  f_planet: { en: 'Planets', zh: '行星' },
  f_season: { en: 'Seasons', zh: '节气点' },
  ground: { en: 'From the ground', zh: '地面看' },
  space: { en: 'From space', zh: '太空看' },
  where: { en: 'Watch from', zh: '观测地点' },
  bestSpot: { en: 'Best spot on Earth', zh: '最佳观测点' },
  globeSpot: { en: 'Where the globe is facing', zh: '地球视角中心' },
  play: { en: 'Play', zh: '播放' },
  pause: { en: 'Pause', zh: '暂停' },
  slower: { en: 'Slower', zh: '慢一点' },
  faster: { en: 'Faster', zh: '快一点' },
  inDays: { en: 'in {n} days', zh: '还有 {n} 天' },
  inHours: { en: 'in {n} h', zh: '还有 {n} 小时' },
  today: { en: 'today', zh: '就在今天' },
  daysAgo: { en: '{n} days ago', zh: '{n} 天前' },
  next: { en: 'Up next', zh: '下一个' },
  empty: { en: 'Nothing of this kind this year.', zh: '这一年没有这类天象。' },
  openSolar: { en: 'See it in the Solar System', zh: '在太阳系中查看' },
  belowHorizon: { en: 'Below the horizon from here right now', zh: '此刻在这里的地平线以下' },
  notVisibleHere: { en: 'Not visible from {p}: showing the best spot instead', zh: '{p}看不到这次天象，改为从最佳观测点观看' },
  sunAlt: { en: 'Sun altitude', zh: '太阳高度' },
  moonAlt: { en: 'Moon altitude', zh: '月亮高度' },
  covered: { en: 'Sun covered', zh: '太阳被遮' },
  magnitude: { en: 'Magnitude', zh: '食分' },
  duration: { en: 'Totality', zh: '全食持续' },
  durationAnn: { en: 'Ring of fire', zh: '环食持续' },
  pathWidth: { en: 'Path width', zh: '食带宽度' },
  localTime: { en: 'Local time', zh: '当地时间' },
  rate: { en: 'Meteors per hour', zh: '每小时流星' },
  radiant: { en: 'Radiant', zh: '辐射点' },
  parent: { en: 'Comes from', zh: '母体' },
  speed: { en: 'Speed', zh: '速度' },
  distance: { en: 'Distance', zh: '距离' },
  illum: { en: 'Lit', zh: '被照亮' },
  dayLength: { en: 'Daylight at {p}', zh: '{p}的白昼' },
  separation: { en: 'Apart', zh: '相距' },
  elongation: { en: 'From the Sun', zh: '离太阳' },
  hereSees: { en: '{p}: {s}', zh: '{p}：{s}' },
  seesTotal: { en: 'total!', zh: '全食！' },
  seesAnnular: { en: 'ring of fire!', zh: '环食！' },
  seesPartial: { en: '{n}% partial', zh: '偏食 {n}%' },
  seesNone: { en: 'not visible', zh: '看不到' },
  seesUp: { en: 'visible', zh: '可以看到' },
  utc: { en: 'UTC', zh: '世界时' },
  // kinds
  k_solar_total: { en: 'Total solar eclipse', zh: '日全食' },
  k_solar_annular: { en: 'Annular solar eclipse', zh: '日环食' },
  k_solar_hybrid: { en: 'Hybrid solar eclipse', zh: '全环食' },
  k_solar_partial: { en: 'Partial solar eclipse', zh: '日偏食' },
  k_lunar_total: { en: 'Total lunar eclipse', zh: '月全食' },
  k_lunar_partial: { en: 'Partial lunar eclipse', zh: '月偏食' },
  k_lunar_penumbral: { en: 'Penumbral lunar eclipse', zh: '半影月食' },
  k_full: { en: 'Full Moon', zh: '满月' },
  k_new: { en: 'New Moon', zh: '新月（朔）' },
  k_super: { en: 'Supermoon', zh: '超级月亮' },
  k_march: { en: 'March equinox', zh: '春分' },
  k_june: { en: 'June solstice', zh: '夏至' },
  k_september: { en: 'September equinox', zh: '秋分' },
  k_december: { en: 'December solstice', zh: '冬至' },
  k_opposition: { en: '{p} at opposition', zh: '{p}冲日' },
  k_conjunction: { en: '{a} meets {b}', zh: '{a}合{b}' },
  k_elong_e: { en: '{p} in the evening sky', zh: '{p}东大距' },
  k_elong_w: { en: '{p} in the morning sky', zh: '{p}西大距' },
  k_transit: { en: '{p} crosses the Sun', zh: '{p}凌日' },
  // contacts
  c_p1: { en: 'Penumbra begins', zh: '半影食始' },
  c_p4: { en: 'Penumbra ends', zh: '半影食终' },
  c_c1: { en: 'First contact', zh: '初亏' },
  c_c2: { en: 'Totality begins', zh: '食既' },
  c_max: { en: 'Greatest', zh: '食甚' },
  c_c3: { en: 'Totality ends', zh: '生光' },
  c_c4: { en: 'Last contact', zh: '复圆' },
  c_peak: { en: 'Peak', zh: '极大' },
  c_closest: { en: 'Closest', zh: '最接近' },
  c_midtransit: { en: 'Mid-transit', zh: '凌甚' },
  c_rise: { en: 'Sunrise', zh: '日出' },
  c_set: { en: 'Sunset', zh: '日落' },
  c_ingress: { en: 'Ingress', zh: '入凌' },
  c_egress: { en: 'Egress', zh: '出凌' },
  // captions
  cap_solar_pre: { en: 'The New Moon slides between the Sun and Earth. Never look at the Sun without eclipse glasses!', zh: '新月正从太阳和地球之间滑过。千万不要直视太阳，一定要戴专用的日食眼镜！' },
  cap_solar_partial: { en: 'The Moon takes a bite out of the Sun. The light gets strangely dim and shadows turn sharp.', zh: '月亮“咬”掉了太阳的一块。光线变得奇怪地暗淡，影子变得特别锐利。' },
  cap_solar_beads: { en: "Baily's beads: the last sunlight shines through valleys on the Moon's edge. Then the diamond ring!", zh: '贝利珠：最后的阳光穿过月球边缘的山谷闪烁，接着出现“钻石环”！' },
  cap_solar_total: { en: "Totality! The Sun's pearly corona appears, stars and planets come out, and a 360° sunset glows on the horizon.", zh: '全食！太阳珍珠般的日冕出现了，星星和行星露了出来，四周地平线一圈都是晚霞。' },
  cap_solar_annular: { en: 'Ring of fire: the Moon is a little too far away to cover the whole Sun.', zh: '“火环”：月亮离地球稍远，看起来比太阳小一点，挡不住整个太阳。' },
  cap_solar_space: { en: "From space the Moon's shadow is a dark smudge racing across Earth at over 2,000 km/h. Only inside its tiny black core do people see a total eclipse.", zh: '从太空看，月亮的影子是一块暗斑，以每小时 2000 多公里的速度掠过地球。只有在中间那个小黑点里的人才能看到全食。' },
  cap_lunar_pen: { en: "The Moon enters Earth's faint outer shadow, the penumbra. It dims only a little.", zh: '月亮进入地球淡淡的外影——半影，只是稍微变暗一点。' },
  cap_lunar_partial: { en: "Earth's dark core shadow, the umbra, creeps across the Moon. Its curved edge shows Earth is round!", zh: '地球漆黑的本影慢慢爬上月面。影子的边缘是弯的——这说明地球是圆的！' },
  cap_lunar_total: { en: 'Blood Moon: all the sunrises and sunsets around Earth bend red light into the shadow and paint the Moon copper.', zh: '“血月”：地球上所有正在日出和日落的地方，把红光折射进影子里，把月亮染成了古铜色。' },
  cap_lunar_space: { en: 'Beside the Moon: Earth hides the Sun, ringed by a thin red line of every sunrise and sunset at once.', zh: '在月球旁边看：地球挡住了太阳，地球边缘是一圈细细的红光——那是全世界同时发生的日出和日落。' },
  cap_meteor: { en: 'Meteors are grains of comet dust burning up 100 km above us. Trace them backwards and they all point to the radiant.', zh: '流星是彗星留下的尘粒，在离地 100 公里的高空烧毁。把它们的轨迹往回延长，都会指向同一个“辐射点”。' },
  cap_meteor_tip: { en: 'Best after midnight, far from city lights. Let your eyes adapt for 20 minutes.', zh: '午夜以后、远离城市灯光看得最好。让眼睛先适应黑暗 20 分钟。' },
  cap_full: { en: 'Full Moon: the Moon is opposite the Sun, so we see its whole sunlit face.', zh: '满月：月亮和太阳分别在地球两侧，我们看到它被照亮的整个半球。' },
  cap_new: { en: "New Moon: the Moon is between us and the Sun, its lit side faces away. It's the best time to see faint stars.", zh: '新月（朔）：月亮在地球和太阳之间，亮面背对我们。这时最适合看暗淡的星星。' },
  cap_super: { en: "Supermoon: a Full Moon near perigee, the closest point of the Moon's oval orbit, looks about 14% bigger and 30% brighter than a far one.", zh: '超级月亮：满月恰好在近地点附近（月球椭圆轨道上离地球最近的位置），比最远时的满月大约大 14%、亮 30%。' },
  cap_equinox: { en: 'Equinox: the Sun is over the equator and day and night are nearly equal everywhere.', zh: '春分 / 秋分：太阳直射赤道，全世界昼夜几乎等长。' },
  cap_solstice: { en: 'Solstice: the Sun is over a tropic: the longest day in one hemisphere, the shortest in the other.', zh: '夏至 / 冬至：太阳直射回归线，一个半球白昼最长，另一个半球白昼最短。' },
  cap_season: { en: "Earth's axis is tilted 23.4°. As we circle the Sun, the hemispheres take turns leaning toward it: that's why we have seasons.", zh: '地轴倾斜了 23.4°。地球绕太阳公转时，南北半球轮流朝向太阳——这就是四季的由来。' },
  cap_opposition: { en: 'Opposition: Earth passes between the Sun and {p}. It is at its closest and brightest, and up all night.', zh: '冲日：地球从太阳和{p}之间穿过。这时它离我们最近、最亮，整夜都能看见。' },
  cap_conjunction: { en: 'Conjunction: two worlds line up in our sky. They only look close; in space they are hundreds of millions of kilometres apart.', zh: '相合：两个天体在天空中排成一线。它们只是看起来很近，实际上相距上亿公里。' },
  cap_elongation: { en: 'Greatest elongation: {p} is as far from the Sun as it gets in our sky. The best time to spot it.', zh: '大距：{p}在天空中离太阳最远的时候，是观察它的最好时机。' },
  cap_transit: { en: '{p} passes in front of the Sun as a tiny black dot. Only ever watch through a proper solar filter!', zh: '{p}从太阳正前方经过，像一个小黑点。一定要用专业的太阳滤镜观看！' },
  // regions
  r_arctic: { en: 'the Arctic', zh: '北极地区' }, r_antarctic: { en: 'Antarctica', zh: '南极洲' },
  r_namerica: { en: 'North America', zh: '北美洲' }, r_samerica: { en: 'South America', zh: '南美洲' },
  r_europe: { en: 'Europe', zh: '欧洲' }, r_africa: { en: 'Africa', zh: '非洲' }, r_asia: { en: 'Asia', zh: '亚洲' },
  r_oceania: { en: 'Australia & Oceania', zh: '大洋洲' }, r_pacific: { en: 'the Pacific', zh: '太平洋' },
  r_atlantic: { en: 'the Atlantic', zh: '大西洋' }, r_indian: { en: 'the Indian Ocean', zh: '印度洋' },
  bestFrom: { en: 'Best from {r}', zh: '最佳观测地：{r}' },
  theatre: { en: 'Sky theatre', zh: '天象剧场' },
  fromMoon: { en: 'From the Moon', zh: '月球上看' },
  tele: { en: 'Telescope', zh: '望远镜' },
  eye: { en: 'Naked eye', zh: '肉眼' },
  timeline: { en: 'Timeline', zh: '时间轴' },
  simSpeed: { en: 'Simulation speed', zh: '模拟速度' },
  jumpTo: { en: 'Jump to {m}', zh: '跳到{m}' },
  dragHint: { en: 'Drag to look around · pinch or scroll to zoom', zh: '拖动环顾四周 · 双指或滚轮缩放' },
  loading: { en: 'Computing the sky…', zh: '正在计算天空…' },
} satisfies Record<string, Pair>;

export type SkyKey = keyof typeof S;
export function s(key: SkyKey, vars?: Record<string, string | number>): string {
  let v: string = S[key][lang()];
  if (vars) for (const [k, x] of Object.entries(vars)) v = v.replaceAll('{' + k + '}', String(x));
  return v;
}

/** Observing sites to pick from (plus "best spot" and "where the globe faces"); `tz` = standard UTC offset (no DST). */
export const SITES: { id: string; name: Pair; lat: number; lon: number; tz: number }[] = [
  { id: 'beijing', name: { en: 'Beijing', zh: '北京' }, lat: 39.9, lon: 116.4, tz: 8 },
  { id: 'shanghai', name: { en: 'Shanghai', zh: '上海' }, lat: 31.23, lon: 121.47, tz: 8 },
  { id: 'hongkong', name: { en: 'Hong Kong', zh: '香港' }, lat: 22.32, lon: 114.17, tz: 8 },
  { id: 'taipei', name: { en: 'Taipei', zh: '台北' }, lat: 25.03, lon: 121.56, tz: 8 },
  { id: 'chengdu', name: { en: 'Chengdu', zh: '成都' }, lat: 30.66, lon: 104.07, tz: 8 },
  { id: 'lhasa', name: { en: 'Lhasa', zh: '拉萨' }, lat: 29.65, lon: 91.1, tz: 8 },
  { id: 'urumqi', name: { en: 'Ürümqi', zh: '乌鲁木齐' }, lat: 43.83, lon: 87.62, tz: 8 },
  { id: 'singapore', name: { en: 'Singapore', zh: '新加坡' }, lat: 1.35, lon: 103.82, tz: 8 },
  { id: 'tokyo', name: { en: 'Tokyo', zh: '东京' }, lat: 35.68, lon: 139.69, tz: 9 },
  { id: 'sydney', name: { en: 'Sydney', zh: '悉尼' }, lat: -33.87, lon: 151.21, tz: 10 },
  { id: 'delhi', name: { en: 'Delhi', zh: '新德里' }, lat: 28.61, lon: 77.21, tz: 5.5 },
  { id: 'cairo', name: { en: 'Cairo', zh: '开罗' }, lat: 30.04, lon: 31.24, tz: 2 },
  { id: 'madrid', name: { en: 'Madrid', zh: '马德里' }, lat: 40.42, lon: -3.7, tz: 1 },
  { id: 'london', name: { en: 'London', zh: '伦敦' }, lat: 51.51, lon: -0.13, tz: 0 },
  { id: 'reykjavik', name: { en: 'Reykjavík', zh: '雷克雅未克' }, lat: 64.15, lon: -21.94, tz: 0 },
  { id: 'newyork', name: { en: 'New York', zh: '纽约' }, lat: 40.71, lon: -74.01, tz: -5 },
  { id: 'dallas', name: { en: 'Dallas', zh: '达拉斯' }, lat: 32.78, lon: -96.8, tz: -6 },
  { id: 'losangeles', name: { en: 'Los Angeles', zh: '洛杉矶' }, lat: 34.05, lon: -118.24, tz: -8 },
  { id: 'saopaulo', name: { en: 'São Paulo', zh: '圣保罗' }, lat: -23.55, lon: -46.63, tz: -3 },
  { id: 'capetown', name: { en: 'Cape Town', zh: '开普敦' }, lat: -33.92, lon: 18.42, tz: 2 },
];

/** Very coarse "where on Earth" for a point, for captions like "best from North America". */
export function regionOf(lat: number, lon: number): string {
  const k: SkyKey = lat > 66 ? 'r_arctic' : lat < -60 ? 'r_antarctic'
    : lon >= -170 && lon < -52 && lat > 12 ? (lon > -64 && lat < 40 ? 'r_atlantic' : 'r_namerica')
    : lon >= -82 && lon < -34 && lat <= 12 ? 'r_samerica'
    : lon >= -52 && lon < -12 ? 'r_atlantic'
    : lon >= -12 && lon < 45 && lat > 36 ? 'r_europe'
    : lon >= -18 && lon < 52 && lat <= 36 && lat > -36 ? 'r_africa'
    : lon >= 45 && lon < 150 && lat > 8 ? 'r_asia'
    : lon >= 95 && lon < 180 && lat <= 8 && lat > -50 ? 'r_oceania'
    : lon >= 40 && lon < 115 && lat <= 8 ? 'r_indian'
    : lon >= 150 || lon < -70 ? 'r_pacific' : 'r_atlantic';
  return s(k);
}
