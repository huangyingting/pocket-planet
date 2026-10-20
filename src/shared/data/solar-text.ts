/** Card text for each solar-system body (every body needs an entry). */
import type { I18n } from './types.ts';
import type { BodyId } from './solar.ts';

export const BODY_TEXT: Record<BodyId, { desc: I18n; funFact: I18n }> = {
  sun: {
    desc: { en: 'The Sun is our star: a gigantic ball of glowing hot gas at the centre of the Solar System. Its light and warmth make life on Earth possible. Never look straight at it!',
      zh: '太阳是我们的恒星，是太阳系中心一个巨大的炽热气体球。它的光和热让地球上的生命得以生存。千万不要直接盯着它看！' },
    funFact: { en: 'About 1.3 million Earths could fit inside the Sun!',
      zh: '太阳里面大约能装下 130 万个地球！' },
  },
  mercury: {
    desc: { en: 'Mercury is the smallest planet and the closest to the Sun. It has almost no air to hold heat, so its days are scorching and its nights are freezing.',
      zh: '水星是最小的行星，也是离太阳最近的行星。它几乎没有空气来保温，所以白天热得发烫，夜晚冷得结冰。' },
    funFact: { en: 'A year on Mercury lasts just 88 Earth days, but from one sunrise to the next takes 176 Earth days — longer than its year!',
      zh: '水星上一年只有 88 个地球日，可从一次日出到下一次日出却要 176 个地球日，比它的一年还长！' },
  },
  venus: {
    desc: { en: 'Venus is about the same size as Earth, but it is wrapped in thick clouds of acid that trap heat. It is the hottest planet — hot enough to melt lead.',
      zh: '金星和地球差不多大，但它裹着厚厚的酸性云层，把热量牢牢困住。它是最热的行星，热得能把铅熔化。' },
    funFact: { en: 'Venus spins backwards, so the Sun rises in the west — and one spin takes 243 Earth days, longer than its whole 225-day year!',
      zh: '金星是倒着转的，所以那里的太阳从西边升起；而且它自转一圈要 243 个地球日，比绕太阳一圈（225 天）还长！' },
  },
  earth: {
    desc: { en: 'Earth is our home — the only planet we know of with life. Liquid water covers about 71% of its surface, and its air keeps us warm and safe.',
      zh: '地球是我们的家园，也是我们所知唯一有生命的星球。约 71% 的表面被液态水覆盖，大气层让我们温暖又安全。' },
    funFact: { en: 'Earth races around the Sun at about 30 km every second — that\'s more than 100,000 km/h!',
      zh: '地球绕太阳飞奔的速度约为每秒 30 千米，一小时能跑 10 万多千米！' },
  },
  moon: {
    desc: { en: 'The Moon is Earth\'s only natural satellite. It always shows us the same face, and its dark patches are old plains of frozen lava. Twelve astronauts have walked on it.',
      zh: '月球是地球唯一的天然卫星。它总是用同一面对着我们，上面的暗斑是古老岩浆凝固成的平原。已经有 12 位宇航员在月球上行走过。' },
    funFact: { en: 'The Moon is slowly drifting away from Earth — about 3.8 cm every year, roughly as fast as your fingernails grow.',
      zh: '月球正在慢慢远离地球，每年大约远离 3.8 厘米，差不多和指甲长得一样快。' },
  },
  mars: {
    desc: { en: 'Mars is the Red Planet: its dust is full of rusty iron. It has the tallest volcano and one of the biggest canyons in the Solar System, and robot rovers are exploring it right now.',
      zh: '火星是一颗红色星球，因为它的尘土里有很多“生锈”的铁。这里有太阳系最高的火山和最大的峡谷之一，现在还有机器人火星车正在探索它。' },
    funFact: { en: 'On Mars the sky is reddish by day, but sunsets are blue!',
      zh: '火星上白天的天空是淡红色的，可日落时天空却是蓝色的！' },
  },
  ceres: {
    desc: { en: 'Ceres is the biggest object in the asteroid belt between Mars and Jupiter, and the only dwarf planet in the inner Solar System. The Dawn spacecraft orbited it from 2015 to 2018.',
      zh: '谷神星是火星和木星之间小行星带里最大的天体，也是太阳系内侧唯一的矮行星。“黎明号”探测器在 2015 到 2018 年间环绕它飞行。' },
    funFact: { en: 'Ceres was the very first asteroid ever discovered, on New Year\'s Day 1801.',
      zh: '谷神星是人类发现的第一颗小行星，发现日期正好是 1801 年的元旦！' },
  },
  jupiter: {
    desc: { en: 'Jupiter is the biggest planet — a giant ball of gas with colourful stripes of clouds. Its Great Red Spot is a storm bigger than Earth.',
      zh: '木星是最大的行星，一个缠着彩色云带的巨大气体球。它的大红斑是一个比地球还大的风暴。' },
    funFact: { en: 'More than 1,300 Earths could fit inside Jupiter, yet it spins so fast that a day there lasts less than 10 hours.',
      zh: '木星里能装下 1300 多个地球，可它转得飞快，一天还不到 10 个小时。' },
  },
  io: {
    desc: { en: 'Io is the most volcanic world in the Solar System, with hundreds of active volcanoes. Jupiter\'s gravity squeezes it like a stress ball, heating it up inside.',
      zh: '木卫一是太阳系火山最多的星球，有几百座活火山。木星的引力像捏解压球一样挤压它，让它的内部变得滚烫。' },
    funFact: { en: 'Its yellow and orange colours come from sulfur — and some of its volcanoes shoot plumes hundreds of kilometres into space!',
      zh: '它的黄色和橙色来自硫磺，有些火山能把喷发柱喷到几百千米高的太空中！' },
  },
  europa: {
    desc: { en: 'Europa is an icy moon covered in cracks. Under its ice shell hides a salty ocean — one of the best places to search for life beyond Earth.',
      zh: '木卫二是一颗布满裂纹的冰卫星。冰壳下面藏着一片咸咸的海洋，是在地球以外寻找生命的最佳地点之一。' },
    funFact: { en: 'Its hidden ocean may hold about twice as much water as all of Earth\'s oceans put together!',
      zh: '它隐藏的海洋里的水，可能是地球所有海洋加起来的两倍！' },
  },
  ganymede: {
    desc: { en: 'Ganymede is the biggest moon in the Solar System — even bigger than the planet Mercury. It is a mix of dark old ground and bright grooved ice.',
      zh: '木卫三是太阳系最大的卫星，比水星还大！它的表面有古老的暗色地区，也有布满沟纹的明亮冰原。' },
    funFact: { en: 'It is the only moon with its own magnetic field, so it even has its own auroras.',
      zh: '它是唯一拥有自己磁场的卫星，所以它也有自己的极光！' },
  },
  callisto: {
    desc: { en: 'Callisto is a dark, icy moon almost as big as Mercury. Its surface is very old and has hardly changed in about 4 billion years.',
      zh: '木卫四是一颗暗色的冰卫星，差不多和水星一样大。它的表面非常古老，大约 40 亿年来几乎没有变过。' },
    funFact: { en: 'It is one of the most heavily cratered places in the Solar System — craters on top of craters!',
      zh: '它是太阳系撞击坑最密集的地方之一，坑上面还叠着坑！' },
  },
  saturn: {
    desc: { en: 'Saturn is a giant gas planet famous for its beautiful rings made of ice. It has more known moons than any other planet.',
      zh: '土星是一颗巨大的气态行星，以它由冰块组成的美丽光环而闻名。它是已知卫星最多的行星。' },
    funFact: { en: 'Saturn is so light for its size that it would float in a bathtub — if you could find one big enough!',
      zh: '按体积来说土星非常轻，如果能找到一个足够大的浴缸，它能浮在水面上！' },
  },
  enceladus: {
    desc: { en: 'Enceladus is a small, snow-white moon of Saturn. Geysers at its south pole spray water from a hidden ocean out into space.',
      zh: '土卫二是土星的一颗雪白小卫星。它南极的喷泉把地下海洋里的水喷向太空。' },
    funFact: { en: 'It is one of the shiniest objects in the Solar System, reflecting almost all the sunlight that hits it.',
      zh: '它是太阳系最亮闪闪的天体之一，几乎能把照到它身上的阳光全部反射回去。' },
  },
  titan: {
    desc: { en: 'Titan is Saturn\'s biggest moon and the only moon with thick air. It has clouds, rain, rivers and seas — but they are made of liquid methane, not water.',
      zh: '土卫六是土星最大的卫星，也是唯一有浓厚大气的卫星。那里有云、有雨、有河也有海，不过都是液态甲烷，不是水。' },
    funFact: { en: 'With thick air and low gravity, you could fly on Titan just by flapping wings strapped to your arms!',
      zh: '土卫六空气浓、重力小，你只要在胳膊上绑一对翅膀扇一扇，就能飞起来！' },
  },
  uranus: {
    desc: { en: 'Uranus is an icy, blue-green giant that is tipped right over on its side, so it rolls around the Sun like a ball.',
      zh: '天王星是一颗蓝绿色的冰巨星，它几乎是“躺着”的，像一个球一样滚着绕太阳转。' },
    funFact: { en: 'Because of its tilt, each pole gets about 42 years of sunlight followed by 42 years of darkness.',
      zh: '因为它是躺着转的，每个极地都要先经历约 42 年的白天，再经历约 42 年的黑夜。' },
  },
  neptune: {
    desc: { en: 'Neptune is the farthest planet from the Sun — a deep-blue ice giant with the fastest winds in the Solar System.',
      zh: '海王星是离太阳最远的行星，一颗深蓝色的冰巨星，拥有太阳系最快的风。' },
    funFact: { en: 'Neptune was found using maths before anyone saw it. One Neptune year lasts 165 Earth years!',
      zh: '海王星是先用数学算出来、后来才被看到的。它的一年相当于 165 个地球年！' },
  },
  triton: {
    desc: { en: 'Triton is Neptune\'s biggest moon, and it orbits backwards. It was probably captured from the icy Kuiper Belt and has geysers of nitrogen.',
      zh: '海卫一是海王星最大的卫星，而且它是倒着绕行的。它很可能是从冰冷的柯伊伯带被“抓”来的，上面还有喷发氮气的喷泉。' },
    funFact: { en: 'Triton is one of the coldest places ever measured, about −235 °C.',
      zh: '海卫一是人类测量到的最冷的地方之一，大约零下 235 摄氏度。' },
  },
  pluto: {
    desc: { en: 'Pluto is a dwarf planet far out in the icy Kuiper Belt. In 2015 the New Horizons spacecraft flew past and found a giant heart-shaped glacier and mountains of ice.',
      zh: '冥王星是一颗位于遥远冰冷的柯伊伯带的矮行星。2015 年“新视野号”飞过它，发现了一个巨大的爱心形冰川和冰山。' },
    funFact: { en: 'One year on Pluto lasts 248 Earth years, so it hasn\'t finished a single orbit since it was discovered in 1930.',
      zh: '冥王星上一年等于 248 个地球年，所以从 1930 年被发现到现在，它连一圈都还没绕完！' },
  },
  charon: {
    desc: { en: 'Charon is Pluto\'s biggest moon — about half Pluto\'s size. The two always face each other as they spin around, like dancers holding hands.',
      zh: '冥卫一是冥王星最大的卫星，大小约为冥王星的一半。它们总是面对面地转圈，就像手拉手跳舞的舞伴。' },
    funFact: { en: 'Seen from one side of Pluto, Charon hangs in the same spot in the sky forever — it never rises or sets!',
      zh: '在冥王星的一侧看，冥卫一永远挂在天空同一个位置，从来不升起也不落下！' },
  },
};
