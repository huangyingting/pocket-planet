/**
 * 3D content on other worlds (like the landmarks on Earth): landers, rovers, crewed landing sites, orbiters
 * circling their world, spacecraft far out in the Solar System and active plumes (geysers, volcanoes).
 * Coordinates: planetocentric latitude, east-positive longitude in -180..180 (same convention as solar-features.ts).
 * Models are hero builders in `src/client/models/heroes/planets.ts`, referenced as `hero: 'planets/<name>'`.
 */
import type { BodyId } from './solar.ts';
import type { I18n, ModelRecipe } from './types.ts';

export type SiteKind = 'lander' | 'rover' | 'crewed' | 'probe' | 'orbiter' | 'flyby' | 'plume' | 'landform' | 'station';

export interface SolarSite {
  /** `ss_<body>_<slug>` (lower-case ASCII, unique). */
  key: string;
  body: BodyId;
  kind: SiteKind;
  name: I18n;
  emoji: string;
  /** Surface position (orbiters: where the orbit starts; deep-space craft: ignored). */
  lat: number;
  lon: number;
  /** Year it arrived / landed / was seen (future missions: planned year and `future: true`). */
  year?: number;
  future?: boolean;
  /** 'NASA', 'CNSA', 'USSR', 'ESA', 'ISRO', 'JAXA', … */
  agency?: string;
  desc: I18n;
  funFact?: I18n;
  /** English Wikipedia title. */
  wiki: string;
  /** The 3D model (`{ kind: 'space', hero: 'planets/<name>' }`); absent for pure particle effects. */
  model?: ModelRecipe;
  /** Model size multiplier (1 = the default toy size on the surface). */
  scale?: number;
  /** Orbiters: display altitude above the surface in body radii, inclination to the equator, real seconds per loop. */
  orbit?: { altR: number; inclDeg: number; periodS: number };
  /** Craft far out in the Solar System (body 'sun'): ecliptic longitude/latitude (deg) and distance (AU) on 2026-01-01, plus AU per year outward. */
  helio?: { lon: number; lat: number; au: number; auPerYear: number };
  /** Particle plume (geysers, volcanic plumes): colour and height in body radii. */
  fx?: { type: 'plume'; color: string; height: number };
}

const hero = (name: string): ModelRecipe => ({ kind: 'space', hero: `planets/${name}` });

export const SOLAR_SITES: SolarSite[] = [
  // ── Moon ────────────────────────────────────────────────────────────────────────────────────────────────
  {
    key: 'ss_moon_apollo11', body: 'moon', kind: 'crewed', emoji: '🧑‍🚀', lat: 0.674, lon: 23.473, year: 1969, agency: 'NASA',
    name: { en: 'Apollo 11', zh: '阿波罗11号' },
    desc: { en: 'The first people on the Moon! Neil Armstrong and Buzz Aldrin landed the Eagle in the Sea of Tranquility.', zh: '人类第一次登上月球！阿姆斯特朗和奥尔德林驾驶“鹰”号登月舱降落在静海。' },
    funFact: { en: 'Their bootprints are still there: there is no wind on the Moon to blow them away.', zh: '他们的脚印至今还在——月球上没有风能把它们吹走。' },
    wiki: 'Apollo 11', model: hero('apollo11'),
  },
  {
    key: 'ss_moon_apollo12', body: 'moon', kind: 'crewed', emoji: '🧑‍🚀', lat: -3.012, lon: -23.422, year: 1969, agency: 'NASA',
    name: { en: 'Apollo 12 & Surveyor 3', zh: '阿波罗12号和勘测者3号' },
    desc: { en: 'Pete Conrad and Alan Bean landed right next to Surveyor 3, a robot that had arrived two and a half years earlier.', zh: '康拉德和比恩降落在“勘测者3号”旁边——这个机器人两年半前就到了。' },
    funFact: { en: 'The astronauts took parts of Surveyor 3, like its camera, back to Earth to see how the Moon had changed them.', zh: '宇航员把勘测者3号的相机等零件带回地球，研究月球环境对它们的影响。' },
    wiki: 'Apollo 12', model: hero('apollo12'),
  },
  {
    key: 'ss_moon_apollo15', body: 'moon', kind: 'crewed', emoji: '🚙', lat: 26.132, lon: 3.634, year: 1971, agency: 'NASA',
    name: { en: 'Apollo 15 Moon buggy', zh: '阿波罗15号月球车' },
    desc: { en: 'The first drive on the Moon! Dave Scott and Jim Irwin explored the winding Hadley Rille in the Lunar Roving Vehicle.', zh: '第一次在月球上开车！斯科特和欧文驾驶月球车，在蜿蜒的哈德利月溪旁探险。' },
    funFact: { en: 'The Moon buggy folded up like a book to fit on the side of the lunar lander.', zh: '月球车可以像书一样折叠起来，挂在登月舱的侧面。' },
    wiki: 'Apollo 15', model: hero('apollo15'),
  },
  {
    key: 'ss_moon_apollo17', body: 'moon', kind: 'crewed', emoji: '🧑‍🚀', lat: 20.191, lon: 30.772, year: 1972, agency: 'NASA',
    name: { en: 'Apollo 17', zh: '阿波罗17号' },
    desc: { en: 'The last crewed Moon landing so far. Geologist Harrison Schmitt even found orange soil in the Taurus–Littrow valley!', zh: '迄今最后一次载人登月。地质学家施密特在金牛-利特罗山谷里发现了橙色的土壤！' },
    funFact: { en: 'On the way, the Apollo 17 crew took the famous “Blue Marble” photo of the whole Earth.', zh: '在飞往月球的路上，阿波罗17号的宇航员拍下了著名的地球照片“蓝色弹珠”。' },
    wiki: 'Apollo 17', model: hero('apollo17'),
  },
  {
    key: 'ss_moon_luna9', body: 'moon', kind: 'lander', emoji: '🚀', lat: 7.13, lon: -64.37, year: 1966, agency: 'USSR',
    name: { en: 'Luna 9', zh: '月球9号' },
    desc: { en: 'The first spacecraft to land softly on the Moon and send back pictures from its surface.', zh: '第一个在月球上软着陆、并从月面传回照片的探测器。' },
    funFact: { en: 'It proved the ground was firm. Some scientists had feared landers would sink into deep dust!', zh: '它证明了月面很结实——之前有科学家担心着陆器会陷进厚厚的尘土里！' },
    wiki: 'Luna 9', model: hero('luna9'),
  },
  {
    key: 'ss_moon_lunokhod1', body: 'moon', kind: 'rover', emoji: '🤖', lat: 38.315, lon: -35.008, year: 1970, agency: 'USSR',
    name: { en: 'Lunokhod 1', zh: '月球车1号' },
    desc: { en: 'The first robot rover on another world, driven by remote control from Earth across the Sea of Rains.', zh: '第一辆在其他星球上行驶的机器人车，由地球上的人遥控，在雨海上行驶。' },
    funFact: { en: 'Its lid opened like a bathtub cover to show its solar cells, and closed at night to keep warm.', zh: '它的盖子像浴缸盖一样打开晒太阳，夜里再合上保暖。' },
    wiki: 'Lunokhod 1', model: hero('lunokhod'),
  },
  {
    key: 'ss_moon_change3', body: 'moon', kind: 'rover', emoji: '🐇', lat: 44.118, lon: -19.51, year: 2013, agency: 'CNSA',
    name: { en: "Chang'e 3 & Yutu", zh: '嫦娥三号和玉兔号' },
    desc: { en: "China's first Moon landing, in the Sea of Rains, carrying the little rover Yutu (“Jade Rabbit”).", zh: '中国首次登月，降落在雨海，带着“玉兔号”月球车。' },
    funFact: { en: "Yutu is named after the jade rabbit that lives on the Moon with Chang'e in Chinese legend.", zh: '“玉兔”的名字来自中国神话中陪伴嫦娥住在月亮上的玉兔。' },
    wiki: "Chang'e 3", model: hero('change3'),
  },
  {
    key: 'ss_moon_change4', body: 'moon', kind: 'rover', emoji: '🐇', lat: -45.444, lon: 177.599, year: 2019, agency: 'CNSA',
    name: { en: "Chang'e 4 & Yutu-2", zh: '嫦娥四号和玉兔二号' },
    desc: { en: 'The first landing on the far side of the Moon, in Von Kármán crater, with the rover Yutu-2.', zh: '人类第一次在月球背面着陆，降落在冯·卡门撞击坑，带着“玉兔二号”月球车。' },
    funFact: { en: 'The far side never faces Earth, so a relay satellite called Queqiao (“Magpie Bridge”) passes on its messages.', zh: '月球背面永远背对地球，所以要靠“鹊桥”中继卫星帮它传递消息。' },
    wiki: "Chang'e 4", model: hero('change4'),
  },
  {
    key: 'ss_moon_change5', body: 'moon', kind: 'lander', emoji: '🇨🇳', lat: 43.06, lon: -51.92, year: 2020, agency: 'CNSA',
    name: { en: "Chang'e 5", zh: '嫦娥五号' },
    desc: { en: "Chang'e 5 scooped and drilled 1,731 grams of Moon rock and soil and flew them back to Earth.", zh: '嫦娥五号挖取和钻取了1731克月球岩石和土壤，并把它们带回了地球。' },
    funFact: { en: 'It unfurled a Chinese flag made of fabric on the Moon.', zh: '它在月面上展开了一面用织物做成的五星红旗。' },
    wiki: "Chang'e 5", model: hero('change5'),
  },
  {
    key: 'ss_moon_change6', body: 'moon', kind: 'lander', emoji: '🇨🇳', lat: -41.6385, lon: -153.9852, year: 2024, agency: 'CNSA',
    name: { en: "Chang'e 6", zh: '嫦娥六号' },
    desc: { en: 'The first mission to bring back rocks from the far side of the Moon, from the giant South Pole–Aitken basin.', zh: '人类首次从月球背面带回样品，它们来自巨大的南极-艾特肯盆地。' },
    funFact: { en: 'It brought home 1,935.3 grams of far-side Moon samples.', zh: '它带回了1935.3克月球背面的样品。' },
    wiki: "Chang'e 6", model: hero('change5'),
  },
  {
    key: 'ss_moon_chandrayaan3', body: 'moon', kind: 'rover', emoji: '🇮🇳', lat: -69.373, lon: 32.32, year: 2023, agency: 'ISRO',
    name: { en: 'Chandrayaan-3', zh: '月船3号' },
    desc: { en: "India's Vikram lander touched down near the Moon's south pole, and the Pragyan rover rolled out to explore.", zh: '印度的“维克拉姆”着陆器降落在月球南极附近，“普拉吉安”月球车随后开出来探索。' },
    funFact: { en: "Pragyan's wheels stamped India's lion emblem and the ISRO logo into the Moon dust.", zh: '普拉吉安号的车轮在月尘上印下了印度国徽上的狮子和印度空间研究组织的标志。' },
    wiki: 'Chandrayaan-3', model: hero('chandrayaan3'),
  },
  {
    key: 'ss_moon_slim', body: 'moon', kind: 'lander', emoji: '🙃', lat: -13.316, lon: 25.251, year: 2024, agency: 'JAXA',
    name: { en: 'SLIM, the “Moon Sniper”', zh: '“月球狙击手”SLIM' },
    desc: { en: "Japan's SLIM landed about 55 m from its target, super precise! But it tipped over and ended up standing on its nose.", zh: '日本的SLIM降落在离目标约55米的地方，非常精准！但它翻了个身，倒立在了月面上。' },
    funFact: { en: 'A tiny ball-shaped robot, SORA-Q, rolled out and took a picture of the upside-down lander.', zh: '一个球形小机器人SORA-Q滚了出来，给倒立的着陆器拍了照片。' },
    wiki: 'Smart Lander for Investigating Moon', model: hero('slim'),
  },
  {
    key: 'ss_moon_south_pole_ice', body: 'moon', kind: 'landform', emoji: '🧊', lat: -89.67, lon: 129.78, year: 2018, agency: 'ISRO/NASA',
    name: { en: 'Ice in the dark craters', zh: '暗坑里的冰' },
    desc: { en: "Some craters near the Moon's south pole never see sunlight. They are colder than −200 °C and hide water ice.", zh: '月球南极附近有些撞击坑永远晒不到太阳，温度低于零下200摄氏度，里面藏着水冰。' },
    funFact: { en: 'Future astronauts could turn this ice into drinking water, air to breathe and even rocket fuel.', zh: '未来的宇航员可以把这些冰变成饮用水、呼吸用的氧气，甚至火箭燃料。' },
    wiki: 'Lunar water', model: hero('ice_crater'), scale: 1.2,
  },

  // ── Mars ────────────────────────────────────────────────────────────────────────────────────────────────
  {
    key: 'ss_mars_viking1', body: 'mars', kind: 'lander', emoji: '🚀', lat: 22.27, lon: -47.95, year: 1976, agency: 'NASA',
    name: { en: 'Viking 1', zh: '海盗1号' },
    desc: { en: 'The first US spacecraft to land on Mars. It sent pictures and weather reports from Chryse Planitia for over six years.', zh: '美国第一个登陆火星的探测器，从克律塞平原发回照片和天气报告，长达六年多。' },
    funFact: { en: 'Viking 1 and 2 tested Martian soil for signs of life with a tiny laboratory on board.', zh: '海盗1号和2号用随身携带的小实验室，检测火星土壤里有没有生命的迹象。' },
    wiki: 'Viking 1', model: hero('viking'),
  },
  {
    key: 'ss_mars_viking2', body: 'mars', kind: 'lander', emoji: '🚀', lat: 47.64, lon: 134.29, year: 1976, agency: 'NASA',
    name: { en: 'Viking 2', zh: '海盗2号' },
    desc: { en: 'Viking 2 landed on Utopia Planitia and photographed thin white frost on the ground in winter.', zh: '海盗2号降落在乌托邦平原，冬天还拍到了地面上一层薄薄的白霜。' },
    funFact: { en: 'One of its legs landed on a rock, so the lander sat tilted by about 8 degrees.', zh: '它的一条腿落在了石头上，所以着陆器一直倾斜着大约8度。' },
    wiki: 'Viking 2', model: hero('viking'),
  },
  {
    key: 'ss_mars_pathfinder', body: 'mars', kind: 'rover', emoji: '🎈', lat: 19.13, lon: -33.22, year: 1997, agency: 'NASA',
    name: { en: 'Mars Pathfinder & Sojourner', zh: '火星探路者和旅居者号' },
    desc: { en: 'Mars Pathfinder bounced down on giant airbags and let out Sojourner, the first rover on Mars.', zh: '火星探路者裹着巨大的气囊弹跳着陆，放出了第一辆火星车“旅居者号”。' },
    funFact: { en: 'Sojourner was about the size of a microwave oven and weighed only about 11 kg.', zh: '旅居者号只有微波炉那么大，重量只有大约11千克。' },
    wiki: 'Mars Pathfinder', model: hero('pathfinder'),
  },
  {
    key: 'ss_mars_spirit', body: 'mars', kind: 'rover', emoji: '🤖', lat: -14.5684, lon: 175.4726, year: 2004, agency: 'NASA',
    name: { en: 'Spirit rover', zh: '勇气号火星车' },
    desc: { en: 'Spirit explored Gusev crater for six years and found rocks that formed in hot water long ago.', zh: '勇气号在古谢夫撞击坑探索了六年，发现了很久以前在热水中形成的岩石。' },
    funFact: { en: 'When a wheel broke, Spirit drove backwards dragging it, and the stuck wheel dug up bright white silica!', zh: '一个轮子坏了，勇气号只好倒着开、拖着坏轮子走——结果拖出了雪白的二氧化硅！' },
    wiki: 'Spirit (rover)', model: hero('mer'),
  },
  {
    key: 'ss_mars_opportunity', body: 'mars', kind: 'rover', emoji: '🤖', lat: -1.9462, lon: -5.5266, year: 2004, agency: 'NASA',
    name: { en: 'Opportunity rover', zh: '机遇号火星车' },
    desc: { en: 'Opportunity was planned to work for 90 days but kept driving for almost 15 years, more than 45 km!', zh: '机遇号原计划只工作90天，却开了将近15年，行驶了超过45千米！' },
    funFact: { en: 'It found tiny round “blueberries”, little balls of the mineral hematite that formed in water.', zh: '它发现了许多小圆珠“蓝莓”——它们由赤铁矿组成，是在水里形成的。' },
    wiki: 'Opportunity (rover)', model: hero('mer'),
  },
  {
    key: 'ss_mars_phoenix', body: 'mars', kind: 'lander', emoji: '❄️', lat: 68.2188, lon: -125.7492, year: 2008, agency: 'NASA',
    name: { en: 'Phoenix', zh: '凤凰号' },
    desc: { en: 'Phoenix landed in the icy far north of Mars, dug little trenches and found water ice just under the soil.', zh: '凤凰号降落在火星寒冷的北方，挖了几条小沟，在泥土下面发现了水冰。' },
    funFact: { en: 'It even saw snow falling from Martian clouds; the snow turned to vapour before reaching the ground.', zh: '它还看到火星的云里飘下了雪，不过雪还没落到地面就变成水汽消失了。' },
    wiki: 'Phoenix (spacecraft)', model: hero('phoenix'),
  },
  {
    key: 'ss_mars_curiosity', body: 'mars', kind: 'rover', emoji: '🤖', lat: -4.5895, lon: 137.4417, year: 2012, agency: 'NASA',
    name: { en: 'Curiosity rover', zh: '好奇号火星车' },
    desc: { en: 'Curiosity, a car-sized rover, climbs Mount Sharp in Gale crater, reading its rock layers like pages of a book.', zh: '好奇号是一辆汽车大小的火星车，正在盖尔撞击坑里攀登夏普山，像翻书一样研究岩层。' },
    funFact: { en: 'It was lowered to the ground on cables by a rocket-powered “sky crane”.', zh: '它是被火箭驱动的“空中吊车”用绳索吊着放到地面上的。' },
    wiki: 'Curiosity (rover)', model: hero('curiosity'),
  },
  {
    key: 'ss_mars_insight', body: 'mars', kind: 'lander', emoji: '📡', lat: 4.502, lon: 135.623, year: 2018, agency: 'NASA',
    name: { en: 'InSight', zh: '洞察号' },
    desc: { en: 'InSight listened to “marsquakes” with a super-sensitive seismometer to learn what is deep inside Mars.', zh: '洞察号用超灵敏的地震仪聆听“火星地震”，了解火星内部深处的样子。' },
    funFact: { en: 'It recorded more than 1,300 marsquakes before dust covered its solar panels in 2022.', zh: '在2022年尘土盖住它的太阳能板之前，它记录了1300多次火星地震。' },
    wiki: 'InSight', model: hero('insight'),
  },
  {
    key: 'ss_mars_perseverance', body: 'mars', kind: 'rover', emoji: '🚁', lat: 18.4447, lon: 77.4508, year: 2021, agency: 'NASA',
    name: { en: 'Perseverance & Ingenuity', zh: '毅力号和机智号' },
    desc: { en: 'Perseverance explores Jezero crater, an ancient lake, and seals rock samples in tubes for a future trip to Earth.', zh: '毅力号在古老的湖泊杰泽罗撞击坑里探索，把岩石样品封进小管子，等待将来送回地球。' },
    funFact: { en: 'It carried Ingenuity, the first helicopter to fly on another planet. It made 72 flights!', zh: '它带去了“机智号”——第一架在其他星球上飞行的直升机，一共飞了72次！' },
    wiki: 'Perseverance (rover)', model: hero('perseverance'),
  },
  {
    key: 'ss_mars_zhurong', body: 'mars', kind: 'rover', emoji: '🔥', lat: 25.066, lon: 109.925, year: 2021, agency: 'CNSA',
    name: { en: 'Zhurong rover', zh: '祝融号火星车' },
    desc: { en: "Zhurong, China's first Mars rover, rolled down a ramp from the Tianwen-1 lander onto Utopia Planitia.", zh: '祝融号是中国第一辆火星车，它从天问一号着陆平台的坡道上驶下，来到乌托邦平原。' },
    funFact: { en: 'Zhurong is named after the god of fire in Chinese myths, a good name for the red planet.', zh: '“祝融”是中国神话里的火神，正适合去红色的火星。' },
    wiki: 'Zhurong (rover)', model: hero('zhurong'),
  },
  {
    key: 'ss_mars_olympus_mons', body: 'mars', kind: 'landform', emoji: '🌋', lat: 18.653, lon: -133.8, year: 1971, agency: 'NASA',
    name: { en: 'Olympus Mons', zh: '奥林帕斯山' },
    desc: { en: 'The tallest volcano in the Solar System: about 22 km high, almost three times as tall as Mount Everest!', zh: '太阳系最高的火山：大约22千米高，几乎是珠穆朗玛峰的三倍！' },
    funFact: { en: 'It is about 600 km wide, so standing on it you could not even see its edges.', zh: '它宽约600千米，站在山上，你根本看不到它的边缘。' },
    wiki: 'Olympus Mons', model: hero('olympus'), scale: 2.2,
  },
  {
    key: 'ss_mars_mro', body: 'mars', kind: 'orbiter', emoji: '🛰️', lat: 0, lon: -60, year: 2006, agency: 'NASA',
    name: { en: 'Mars Reconnaissance Orbiter', zh: '火星勘测轨道飞行器' },
    desc: { en: 'Its giant camera, HiRISE, can spot things as small as a kitchen table on Mars from orbit.', zh: '它的超强相机HiRISE能从轨道上看清火星上餐桌大小的东西。' },
    funFact: { en: 'It also passes messages between the rovers and Earth, like a post office in space.', zh: '它还在火星车和地球之间传递消息，就像一个太空邮局。' },
    wiki: 'Mars Reconnaissance Orbiter', model: hero('mro'), orbit: { altR: 0.25, inclDeg: 93, periodS: 30 },
  },
  {
    key: 'ss_mars_tianwen1', body: 'mars', kind: 'orbiter', emoji: '🛰️', lat: 0, lon: 110, year: 2021, agency: 'CNSA',
    name: { en: 'Tianwen-1 orbiter', zh: '天问一号环绕器' },
    desc: { en: 'Tianwen-1 orbited, landed and roved on Mars in one single mission, a world first!', zh: '天问一号一次任务就完成了对火星的环绕、着陆和巡视，这是世界首次！' },
    funFact: { en: 'Its name comes from “Heavenly Questions”, an ancient poem by the poet Qu Yuan.', zh: '“天问”这个名字来自古代诗人屈原的长诗《天问》。' },
    wiki: 'Tianwen-1', model: hero('tianwen1'), orbit: { altR: 0.4, inclDeg: 87, periodS: 40 },
  },

  // ── Venus & Mercury ─────────────────────────────────────────────────────────────────────────────────────
  {
    key: 'ss_venus_venera13', body: 'venus', kind: 'lander', emoji: '🔥', lat: -7.5, lon: -57, year: 1982, agency: 'USSR',
    name: { en: 'Venera 13', zh: '金星13号' },
    desc: { en: 'Venera 13 landed on scorching Venus and took the first colour photos of its orange, rocky surface.', zh: '金星13号降落在炽热的金星上，拍下了第一批金星表面的彩色照片：一片橙色的岩石。' },
    funFact: { en: "At 457 °C and 89 times Earth's air pressure, it survived 127 minutes. It was built to last only 32!", zh: '在457摄氏度、89倍地球气压的环境中，它坚持了127分钟，而设计寿命只有32分钟！' },
    wiki: 'Venera 13', model: hero('venera13'),
  },
  {
    key: 'ss_venus_maat_mons', body: 'venus', kind: 'landform', emoji: '🌋', lat: 0.5, lon: -165.4, year: 1991, agency: 'NASA',
    name: { en: 'Maat Mons', zh: '玛阿特山' },
    desc: { en: 'The tallest volcano on Venus, about 8 km high, mapped by radar through the thick clouds. It may still be active!', zh: '金星上最高的火山，大约8千米高，是用雷达穿过厚厚的云层绘制出来的。它可能现在还在活动！' },
    funFact: { en: 'In 2023, scientists saw a volcanic vent near it change shape in old radar pictures from Magellan.', zh: '2023年，科学家在麦哲伦号拍的旧雷达图里发现，它附近的一个火山口改变了形状。' },
    wiki: 'Maat Mons', model: hero('maat'), scale: 1.8,
  },
  {
    key: 'ss_venus_akatsuki', body: 'venus', kind: 'orbiter', emoji: '🛰️', lat: 0, lon: 0, year: 2015, agency: 'JAXA',
    name: { en: 'Akatsuki', zh: '拂晓号' },
    desc: { en: "Akatsuki (“Dawn”) studied Venus's thick clouds and the super-fast winds that race around the planet.", zh: '“拂晓号”研究金星浓厚的云层，还有绕着整个行星飞驰的超级大风。' },
    funFact: { en: 'Its first try to enter orbit failed in 2010. It waited five years, tried again in 2015 and made it!', zh: '它2010年第一次入轨失败，等了五年，2015年再次尝试，终于成功了！' },
    wiki: 'Akatsuki (spacecraft)', model: hero('akatsuki'), orbit: { altR: 0.45, inclDeg: 3, periodS: 50 },
  },
  {
    key: 'ss_mercury_messenger', body: 'mercury', kind: 'orbiter', emoji: '🛰️', lat: 0, lon: 0, year: 2011, agency: 'NASA',
    name: { en: 'MESSENGER', zh: '信使号' },
    desc: { en: 'MESSENGER was the first spacecraft to orbit Mercury, and it mapped the whole planet closest to the Sun.', zh: '信使号是第一个环绕水星的探测器，绘制了这颗离太阳最近的行星的完整地图。' },
    funFact: { en: "It found water ice in shadowy craters at Mercury's poles, on the planet closest to the Sun!", zh: '它在水星两极阴暗的撞击坑里发现了水冰——这可是离太阳最近的行星！' },
    wiki: 'MESSENGER', model: hero('messenger'), orbit: { altR: 0.5, inclDeg: 82.5, periodS: 40 },
  },

  // ── Jupiter & its moons ─────────────────────────────────────────────────────────────────────────────────
  {
    key: 'ss_jupiter_juno', body: 'jupiter', kind: 'orbiter', emoji: '🛰️', lat: 0, lon: 0, year: 2016, agency: 'NASA',
    name: { en: 'Juno', zh: '朱诺号' },
    desc: { en: "Juno swoops over Jupiter's poles, peering under the clouds at giant storms and deep inside the planet.", zh: '朱诺号从木星两极上空掠过，探测云层下的巨大风暴和行星的内部。' },
    funFact: { en: 'It carries three tiny LEGO figures: the scientist Galileo, the god Jupiter and the goddess Juno.', zh: '它带着三个乐高小人：科学家伽利略、天神朱庇特和女神朱诺。' },
    wiki: 'Juno (spacecraft)', model: hero('juno'), orbit: { altR: 0.6, inclDeg: 90, periodS: 60 },
  },
  {
    key: 'ss_io_tvashtar', body: 'io', kind: 'plume', emoji: '🌋', lat: 62.76, lon: -123.53, year: 2007, agency: 'NASA',
    name: { en: 'Tvashtar volcano', zh: '特瓦史塔火山' },
    desc: { en: 'A volcano on Io that shot an umbrella-shaped plume about 330 km high, photographed by New Horizons in 2007.', zh: '木卫一上的一座火山，2007年新视野号拍到它喷出约330千米高的伞状烟柱。' },
    funFact: { en: "Io is the most volcanic world in the Solar System, squeezed and heated by Jupiter's gravity.", zh: '木卫一是太阳系火山最活跃的星球，木星的引力不停地挤压它，让它发热。' },
    wiki: 'Tvashtar Paterae', fx: { type: 'plume', color: '#f4d27a', height: 0.25 },
  },
  {
    key: 'ss_io_pele', body: 'io', kind: 'plume', emoji: '🌋', lat: -18.71, lon: 104.72, year: 1979, agency: 'NASA',
    name: { en: 'Pele volcano', zh: '皮勒火山' },
    desc: { en: 'In 1979 Voyager 1 saw Pele erupting: the first volcano ever seen erupting on another world.', zh: '1979年，旅行者1号拍到皮勒火山正在喷发，这是人类第一次看到其他星球上的火山喷发。' },
    funFact: { en: 'Its plume rains sulfur down in a huge red ring over 1,000 km wide.', zh: '它喷出的硫落下来，形成一个直径超过1000千米的巨大红色圆环。' },
    wiki: 'Pele (volcano)', fx: { type: 'plume', color: '#e9a35c', height: 0.17 },
  },
  {
    key: 'ss_europa_clipper', body: 'europa', kind: 'flyby', emoji: '🛰️', lat: 0, lon: 0, year: 2030, future: true, agency: 'NASA',
    name: { en: 'Europa Clipper', zh: '欧罗巴快船' },
    desc: { en: 'Europa Clipper will zoom past Europa about 49 times to study the salty ocean hidden under its ice.', zh: '欧罗巴快船将飞掠木卫二约49次，研究藏在冰层下面的咸水海洋。' },
    funFact: { en: "It is NASA's biggest planetary spacecraft: its solar wings are as long as a basketball court.", zh: '它是NASA最大的行星探测器，太阳能翼展开后和一个篮球场一样长。' },
    wiki: 'Europa Clipper', model: hero('clipper'), orbit: { altR: 0.5, inclDeg: 25, periodS: 45 },
  },
  {
    key: 'ss_europa_plumes', body: 'europa', kind: 'plume', emoji: '💨', lat: -55, lon: 180, year: 2013, agency: 'NASA/ESA',
    name: { en: 'Possible water plumes', zh: '可能存在的水汽喷泉' },
    desc: { en: "The Hubble telescope saw hints of water vapour spraying up to about 200 km above Europa's southern half.", zh: '哈勃望远镜发现了一些迹象：木卫二的南半球可能喷出高达约200千米的水汽。' },
    funFact: { en: 'If the plumes are real, a spacecraft could “taste” the hidden ocean without drilling through the ice.', zh: '如果这些喷泉是真的，探测器不用钻透冰层，就能“尝一尝”冰下的海洋。' },
    wiki: 'Europa (moon)', fx: { type: 'plume', color: '#dff3ff', height: 0.13 },
  },

  // ── Saturn & its moons ──────────────────────────────────────────────────────────────────────────────────
  {
    key: 'ss_saturn_cassini', body: 'saturn', kind: 'orbiter', emoji: '🛰️', lat: 0, lon: 0, year: 2004, agency: 'NASA/ESA/ASI',
    name: { en: 'Cassini', zh: '卡西尼号' },
    desc: { en: 'Cassini circled Saturn for 13 years, studying its rings and moons, then dived into Saturn in 2017.', zh: '卡西尼号绕着土星飞了13年，研究它的光环和卫星，2017年最后冲进了土星。' },
    funFact: { en: 'It dived into Saturn on purpose, so it could never crash onto a moon that might have life.', zh: '它是故意冲进土星的，这样就永远不会撞上可能有生命的卫星。' },
    wiki: 'Cassini–Huygens', model: hero('cassini'), orbit: { altR: 1.5, inclDeg: 20, periodS: 60 },
  },
  {
    key: 'ss_titan_huygens', body: 'titan', kind: 'lander', emoji: '🪂', lat: -10.573, lon: 167.665, year: 2005, agency: 'ESA',
    name: { en: 'Huygens probe', zh: '惠更斯号' },
    desc: { en: "Huygens parachuted through Titan's orange haze and landed among icy pebbles: the farthest landing ever made.", zh: '惠更斯号乘降落伞穿过土卫六的橙色雾霾，降落在冰卵石之间——这是人类最远的一次着陆。' },
    funFact: { en: 'The “pebbles” around it are not stone but water ice, frozen as hard as rock.', zh: '它周围的“卵石”不是石头，而是冻得像岩石一样硬的水冰。' },
    wiki: 'Huygens (spacecraft)', model: hero('huygens'),
  },
  {
    key: 'ss_titan_dragonfly', body: 'titan', kind: 'lander', emoji: '🚁', lat: 7, lon: 161, year: 2034, future: true, agency: 'NASA',
    name: { en: 'Dragonfly', zh: '蜻蜓号' },
    desc: { en: 'Dragonfly is a car-sized drone with eight rotors that will fly from place to place on Titan, studying its chemistry.', zh: '蜻蜓号是一架汽车大小的八旋翼无人机，将在土卫六上从一个地方飞到另一个地方，研究那里的化学物质。' },
    funFact: { en: "Flying is easy on Titan: its air is four times thicker than Earth's, and gravity is weak.", zh: '在土卫六上飞行很容易：那里的空气比地球稠密4倍，重力又很小。' },
    wiki: 'Dragonfly (Titan space probe)', model: hero('dragonfly'),
  },
  {
    key: 'ss_enceladus_tiger_stripes', body: 'enceladus', kind: 'plume', emoji: '⛲', lat: -80.6, lon: 74, year: 2005, agency: 'NASA',
    name: { en: 'Tiger-stripe geysers', zh: '虎纹喷泉' },
    desc: { en: "Jets of icy water spray out of four long cracks, the “tiger stripes”, at Enceladus's south pole.", zh: '冰冷的水从土卫二南极四条长长的裂缝——“虎纹”中喷射出来。' },
    funFact: { en: "The icy spray feeds Saturn's faint E ring, and Cassini flew right through it!", zh: '这些冰雾形成了土星暗淡的E环，卡西尼号还直接从喷流中穿了过去！' },
    wiki: 'Tiger stripes (Enceladus)', fx: { type: 'plume', color: '#e8f6ff', height: 0.6 },
  },

  // ── Neptune's Triton, Ceres, Pluto ──────────────────────────────────────────────────────────────────────
  {
    key: 'ss_triton_geysers', body: 'triton', kind: 'plume', emoji: '⛲', lat: -50, lon: 30, year: 1989, agency: 'NASA',
    name: { en: 'Nitrogen geysers', zh: '氮气喷泉' },
    desc: { en: 'Voyager 2 saw dark geysers on frozen Triton, blowing nitrogen gas and dust about 8 km high.', zh: '旅行者2号在冰冻的海卫一上看到黑色的喷泉，把氮气和尘埃喷到大约8千米高。' },
    funFact: { en: 'Triton orbits Neptune backwards. It was probably a dwarf planet captured from the Kuiper belt.', zh: '海卫一绕着海王星“倒着”转，它很可能是从柯伊伯带被抓来的矮行星。' },
    wiki: 'Triton (moon)', fx: { type: 'plume', color: '#6b6b70', height: 0.15 },
  },
  {
    key: 'ss_ceres_dawn', body: 'ceres', kind: 'orbiter', emoji: '🛰️', lat: 0, lon: 0, year: 2015, agency: 'NASA',
    name: { en: 'Dawn', zh: '黎明号' },
    desc: { en: 'Dawn used gentle ion engines to orbit two worlds: the asteroid Vesta and then the dwarf planet Ceres.', zh: '黎明号用温和的离子发动机，先后环绕了两个世界：小行星灶神星和矮行星谷神星。' },
    funFact: { en: 'Its ion engine pushed as gently as the weight of a sheet of paper, but it could keep pushing for days.', zh: '它的离子发动机推力只有一张纸的重量那么轻，但可以一连推好多天。' },
    wiki: 'Dawn (spacecraft)', model: hero('dawn'), orbit: { altR: 0.6, inclDeg: 90, periodS: 40 },
  },
  {
    key: 'ss_ceres_ahuna_mons', body: 'ceres', kind: 'landform', emoji: '🏔️', lat: -10.48, lon: -43.8, year: 2015, agency: 'NASA',
    name: { en: 'Ahuna Mons', zh: '阿胡那山' },
    desc: { en: 'A lonely ice volcano on Ceres, about 4 km tall, with bright salty streaks running down its steep sides.', zh: '谷神星上一座孤零零的冰火山，大约4千米高，陡峭的山坡上有一道道明亮的盐带。' },
    funFact: { en: 'Instead of hot lava, it oozed out a cold, muddy mix of salty water and ice.', zh: '它冒出来的不是滚烫的熔岩，而是由咸水和冰混成的冰冷泥浆。' },
    wiki: 'Ahuna Mons', model: hero('ahuna'), scale: 1.6,
  },
  {
    key: 'ss_pluto_new_horizons', body: 'pluto', kind: 'flyby', emoji: '🛰️', lat: 0, lon: 0, year: 2015, agency: 'NASA',
    name: { en: 'New Horizons', zh: '新视野号' },
    desc: { en: 'New Horizons zoomed past Pluto in 2015 and showed us its giant heart-shaped plain of ice.', zh: '新视野号在2015年飞掠冥王星，让我们看到了它巨大的心形冰原。' },
    funFact: { en: 'It carries some of the ashes of Clyde Tombaugh, who discovered Pluto in 1930.', zh: '它带着1930年发现冥王星的汤博的一部分骨灰。' },
    wiki: 'New Horizons', model: hero('new_horizons'), orbit: { altR: 1.0, inclDeg: 10, periodS: 60 },
  },

  // ── Sun & Earth ─────────────────────────────────────────────────────────────────────────────────────────
  {
    key: 'ss_sun_parker', body: 'sun', kind: 'orbiter', emoji: '☀️', lat: 0, lon: 0, year: 2018, agency: 'NASA',
    name: { en: 'Parker Solar Probe', zh: '帕克太阳探测器' },
    desc: { en: "Parker Solar Probe flies closer to the Sun than anything ever built, right through the Sun's outer air, the corona.", zh: '帕克太阳探测器比任何人造物体都更接近太阳，直接穿过太阳的外层大气——日冕。' },
    funFact: { en: 'It is the fastest object ever built: about 690,000 km/h at its closest pass!', zh: '它是人类造出的最快物体：最接近太阳时，速度约每小时69万千米！' },
    wiki: 'Parker Solar Probe', model: hero('parker'), orbit: { altR: 0.8, inclDeg: 3.4, periodS: 45 },
  },
  {
    key: 'ss_earth_iss', body: 'earth', kind: 'station', emoji: '🛰️', lat: 0, lon: 0, year: 1998, agency: 'NASA/Roscosmos/ESA/JAXA/CSA',
    name: { en: 'International Space Station', zh: '国际空间站' },
    desc: { en: 'A home in orbit where astronauts from many countries live and do science experiments.', zh: '轨道上的家园，来自许多国家的宇航员在这里生活和做科学实验。' },
    funFact: { en: 'It goes around Earth every 90 minutes, so the crew sees 16 sunrises a day!', zh: '它每90分钟绕地球一圈，宇航员一天能看到16次日出！' },
    wiki: 'International Space Station', model: hero('iss'), orbit: { altR: 0.12, inclDeg: 51.6, periodS: 20 },
  },
  {
    key: 'ss_earth_tiangong', body: 'earth', kind: 'station', emoji: '🛰️', lat: 0, lon: 120, year: 2021, agency: 'CMSA',
    name: { en: 'Tiangong space station', zh: '天宫空间站' },
    desc: { en: "Tiangong (“Heavenly Palace”) is China's space station, where taikonauts live and even teach lessons from space.", zh: '天宫是中国的空间站，航天员在这里生活，还给地面上的同学们上“天宫课堂”。' },
    funFact: { en: 'Its first module, Tianhe, launched in 2021, and the T-shaped station was finished in 2022.', zh: '它的第一个舱段“天和”在2021年发射，T字形的空间站在2022年建成。' },
    wiki: 'Tiangong space station', model: hero('tiangong'), orbit: { altR: 0.12, inclDeg: 41.5, periodS: 21 },
  },
  {
    key: 'ss_earth_hubble', body: 'earth', kind: 'orbiter', emoji: '🔭', lat: 0, lon: -120, year: 1990, agency: 'NASA/ESA',
    name: { en: 'Hubble Space Telescope', zh: '哈勃空间望远镜' },
    desc: { en: 'Since 1990, Hubble has orbited above the blurry air, taking sharp pictures of faraway galaxies and nebulae.', zh: '从1990年起，哈勃在模糊的大气层之上运行，拍下遥远星系和星云的清晰照片。' },
    funFact: { en: 'Its mirror was slightly the wrong shape at first, so in 1993 astronauts gave it “glasses”.', zh: '它的镜子一开始形状有一点点不对，1993年宇航员给它戴上了“眼镜”。' },
    wiki: 'Hubble Space Telescope', model: hero('hubble'), orbit: { altR: 0.13, inclDeg: 28.5, periodS: 22 },
  },
  {
    key: 'ss_earth_jwst', body: 'earth', kind: 'orbiter', emoji: '🔭', lat: 0, lon: 60, year: 2022, agency: 'NASA/ESA/CSA',
    name: { en: 'James Webb Space Telescope', zh: '詹姆斯·韦布空间望远镜' },
    desc: { en: 'Webb watches the first galaxies in infrared light from 1.5 million km away from Earth.', zh: '韦布望远镜在离地球150万千米远的地方，用红外线观察宇宙中最早的星系。' },
    funFact: { en: 'Its sunshield is as big as a tennis court and keeps the telescope colder than −220 °C.', zh: '它的遮阳板有网球场那么大，让望远镜保持在零下220摄氏度以下。' },
    wiki: 'James Webb Space Telescope', model: hero('jwst'), orbit: { altR: 3.0, inclDeg: 10, periodS: 120 },
  },

  // ── Deep space (positions on 2026-01-01, JPL Horizons) ────────────────────────────────────────────────
  {
    key: 'ss_sun_voyager1', body: 'sun', kind: 'probe', emoji: '📀', lat: 35.15, lon: -103.3, year: 1977, agency: 'NASA',
    name: { en: 'Voyager 1', zh: '旅行者1号' },
    desc: { en: "The farthest human-made object, sailing through interstellar space beyond the Sun's bubble.", zh: '离我们最远的人造物体，正在太阳风泡之外的星际空间中航行。' },
    funFact: { en: 'It carries a Golden Record with sounds and music of Earth and greetings in 55 languages.', zh: '它带着一张“金唱片”，上面有地球的声音、音乐和55种语言的问候。' },
    wiki: 'Voyager 1', model: hero('voyager'), helio: { lon: 256.7, lat: 35.15, au: 169.26, auPerYear: 3.56 },
  },
  {
    key: 'ss_sun_voyager2', body: 'sun', kind: 'probe', emoji: '📀', lat: -38.35, lon: -69.33, year: 1977, agency: 'NASA',
    name: { en: 'Voyager 2', zh: '旅行者2号' },
    desc: { en: 'The only spacecraft to visit Uranus and Neptune. Now it is sailing through interstellar space too.', zh: '唯一造访过天王星和海王星的探测器，现在它也在星际空间中航行。' },
    funFact: { en: 'Its radio signals take more than 19 hours to reach Earth.', zh: '它发出的无线电信号要飞19个多小时才能到达地球。' },
    wiki: 'Voyager 2', model: hero('voyager'), helio: { lon: 290.67, lat: -38.35, au: 141.71, auPerYear: 3.17 },
  },
  {
    key: 'ss_sun_pioneer10', body: 'sun', kind: 'probe', emoji: '🛰️', lat: 2.99, lon: 80.17, year: 1972, agency: 'NASA',
    name: { en: 'Pioneer 10', zh: '先驱者10号' },
    desc: { en: 'The first spacecraft to cross the asteroid belt and fly past Jupiter. It went silent in 2003.', zh: '第一个穿越小行星带、飞掠木星的探测器，2003年后就再也没有消息了。' },
    funFact: { en: 'It carries a plaque with a drawing of a man and a woman and a map showing where the Sun is.', zh: '它带着一块金属板，上面画着一男一女，还有一张标出太阳位置的地图。' },
    wiki: 'Pioneer 10', model: hero('pioneer'), helio: { lon: 80.17, lat: 2.99, au: 140.06, auPerYear: 2.49 },
  },
  {
    key: 'ss_sun_pioneer11', body: 'sun', kind: 'probe', emoji: '🛰️', lat: 13.86, lon: -75.39, year: 1973, agency: 'NASA',
    name: { en: 'Pioneer 11', zh: '先驱者11号' },
    desc: { en: 'The first spacecraft to visit Saturn, flying past its rings in 1979.', zh: '第一个造访土星的探测器，1979年从土星光环旁飞过。' },
    funFact: { en: "It flew past Jupiter first and used Jupiter's gravity to swing across the Solar System to Saturn.", zh: '它先飞掠木星，借助木星的引力“甩”到太阳系另一边的土星。' },
    wiki: 'Pioneer 11', model: hero('pioneer'), helio: { lon: 284.61, lat: 13.86, au: 116.21, auPerYear: 2.33 },
  },
  {
    key: 'ss_sun_new_horizons', body: 'sun', kind: 'probe', emoji: '🛰️', lat: 1.99, lon: -71.64, year: 2006, agency: 'NASA',
    name: { en: 'New Horizons', zh: '新视野号' },
    desc: { en: 'After Pluto, New Horizons kept going and in 2019 flew past Arrokoth, the farthest object ever visited.', zh: '飞过冥王星以后，新视野号继续前进，2019年飞掠了阿罗科斯——人类探访过的最远天体。' },
    funFact: { en: 'It was the fastest spacecraft ever launched, passing the orbit of the Moon in only 9 hours.', zh: '它是发射速度最快的探测器，只用了9个小时就飞过了月球的轨道。' },
    wiki: 'New Horizons', model: hero('new_horizons'), helio: { lon: 288.36, lat: 1.99, au: 63.58, auPerYear: 2.86 },
  },
];
