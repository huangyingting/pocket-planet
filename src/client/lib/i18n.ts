import { load, save } from './storage.ts';
import type { Lang } from '../../shared/data/types.ts';

type Dict = Record<string, string>;

const en: Dict = {
  auraWaves: 'Atmosphere', auraAurora: 'Aurora', auraEmber: 'Solar wind', auraDusk: 'Magnetosphere', auraSculpture: 'Ionosphere',
  badgeNew: 'NEW', tools: 'Tools', globeLabel: 'Interactive 3D globe',
  solarSystem: 'Solar System', skyEvents: 'Sky events', solarLabel: 'Interactive 3D Solar System', backToEarth: 'Back to Earth', enterEarth: 'Land on Earth',
  solarHint: 'Drag to look around · scroll to zoom · tap a world', overview: 'Whole system',
  spPause: 'Pause', spReal: 'Real time', spHour: '1 hour/s', spDay: '1 day/s', spMonth: '1 month/s', spYear: '1 year/s', now: 'Now', timeSpeed: 'Time speed',
  bk_star: 'Star', bk_planet: 'Planet', bk_dwarf: 'Dwarf planet', bk_moon: 'Moon', moonOf: 'Moon of {p}',
  diameter: 'Diameter', dayLen: 'One day', yearLen: 'One year', orbitLen: 'One orbit', moonsN: 'Moons', gravity: 'Gravity', temperature: 'Temperature',
  fromSun: 'From the Sun', fromEarth: 'From Earth', fromParent: 'From {p}', sunlight: 'Sunlight takes', lockedDay: 'Same face to {p}',
  hoursN: '{n} h', daysN: '{n} days', yearsN: '{n} years', minutesN: '{n} min', xEarth: '{n}× Earth', size: 'Size',
  surface: 'Surface features', moonsList: 'Moons', backTo: 'Back to {p}', where: 'Where',
  fk_crater: 'Crater', fk_basin: 'Basin', fk_mare: 'Lunar sea', fk_mountain: 'Mountain', fk_volcano: 'Volcano', fk_canyon: 'Canyon', fk_plain: 'Plain',
  fk_cap: 'Polar cap', fk_storm: 'Storm', fk_landing: 'Landing site', fk_rift: 'Rift', fk_lake: 'Lake', fk_region: 'Region', fk_geyser: 'Geysers',
  fk_ridge: 'Ridge', fk_cliff: 'Cliff', fk_spot: 'Spot', fk_ring: 'Ring',
  sc_universe: 'Universe', sc_laniakea: 'Supercluster', sc_group: 'Local Group', sc_galaxy: 'Milky Way', sc_solar: 'Solar System', sc_earth: 'Earth',
  scales: 'Zoom levels of the universe', youAreHere: 'Solar System · you are here', deepHint: 'Drag to turn · scroll in to go back down · tap a name', deepHintTouch: 'Drag to turn · pinch in to go back down · tap a name', hud_target: 'Target', hud_coord: 'Coords', hud_range: 'Range', hud_radii: '{n} R', hud_scale: 'Scale', hud_span: 'Field', cst_toggle: 'Constellations', cst_kind: 'Constellation', cst_stars: 'Stars in the figure', cst_brightest: 'Brightest star',
  overviewScale: 'Whole view', lightYears: 'Distance from us', ly: '{n} light-years', across: 'Across', kindOf: 'Kind', lookback: 'Light left it',
  yearsAgo: '{n} years ago', scaleIs: 'Scale', highlights: 'Highlights',
  dk_blackhole: 'Black hole', dk_arm: 'Spiral arm', dk_bar: 'Galactic bar', dk_region: 'Gravity hub', dk_nebula: 'Nebula', dk_remnant: 'Supernova remnant', dk_starcluster: 'Star cluster', dk_globular: 'Globular cluster',
  dk_star: 'Star', dk_galaxy: 'Galaxy', dk_dwarf: 'Dwarf galaxy', dk_group: 'Galaxy group', dk_cluster: 'Galaxy cluster', dk_supercluster: 'Supercluster',
  dk_wall: 'Great wall', dk_void: 'Cosmic void', dk_quasar: 'Quasar', dk_cmb: 'Oldest light', dk_deepfield: 'Deep field',
  mo_spiral: 'Spiral', mo_barred: 'Barred spiral', mo_elliptical: 'Elliptical', mo_lenticular: 'Lenticular', mo_irregular: 'Irregular', mo_dwarf: 'Dwarf',
  sk_lander: 'Lander', sk_rover: 'Rover', sk_crewed: 'Crewed landing', sk_probe: 'Space probe', sk_orbiter: 'Orbiter', sk_flyby: 'Flyby', sk_plume: 'Plume',
  sk_landform: 'Landform', sk_station: 'Space station', explorers: 'Explorers & sites', agency: 'Agency', arrived: 'Arrived', planned: 'Planned',
  fromSunAU: '{n} AU from the Sun', filterSpace: 'Space',
  title: 'Pocket Planet', badge: 'BETA', loading: 'Waking up the planet…', webglFail: 'Your browser could not start 3D graphics. Try another browser or turn on hardware acceleration.',
  counts: '{l} LANDMARKS · {c} COUNTRIES · {ci} CITIES · {a} ANIMALS · {d} DISCOVERIES · {v} VEHICLES',
  photo: 'Photo', collection: 'Collection', game: 'Game', menu: 'Menu', close: 'Close', back: 'Back', open: 'Open', start: 'Start', next: 'Next', done: 'Done', skip: 'Skip',
  hintDrag: '<b>Drag</b> spin the globe', hintZoom: '<b>Wheel / pinch</b> zoom in for more places', hintTap: '<b>Tap a marker</b> photo & info', tutorialAgain: 'Show the tutorial again',
  fullscreen: 'Fullscreen', zoomIn: 'Zoom in', zoomOut: 'Zoom out', help: 'Help',
  mMap: 'Map', mGlobe: 'On the globe', mSettings: 'Settings', terrain: 'Terrain view', names: 'Place names', borders: 'Borders & grid lines', shadows: 'Day & night',
  landmarks: 'Landmarks', animals: 'Animals', discoveries: 'Discoveries', vehicles: 'Ships, planes & trains', sfx: 'Sound effects', bgm: 'Music',
  dinos: 'Dinosaurs', foods: 'Foods', festivals: 'Festivals', space: 'Space & science', plants: 'Plants & forests', sports: 'Sports', volcanoes: 'Volcanoes',
  migrations: 'Animal migrations', voyages: 'Great voyages', people: 'Famous people', born: 'Born', died: 'Died', mLayers: 'Layers', tectonics: 'Plates & fire belts', clouds: 'Clouds', aurora: 'Auroras',
  passport: 'Passport', passportSub: 'Stamp every place you visit', stamps: '{n} / {t} stamps', nextStop: 'Next stop: {p}', bookDone: 'Book complete! 🎉',
  timeMachine: 'Time machine', tmNow: 'Today', tmDino: 'Age of dinosaurs', tmCount: '{n} on the globe', tmAppear: 'New here:', bce: '{n} BCE', ce1: 'Year 1',
  sayHello: 'Say hello', hearIt: 'Hear it', helloIn: '👋 Hello in {lang}: “{say}”', noSpeech: '(speech not available in this browser)',
  foundIt: 'Collected ✓', collectIt: 'Collect', lived: 'Lived', myaAgo: '{n} million years ago', when: 'When',
  language: 'Language', reset: 'Reset view & settings', resetBtn: 'Reset', account: 'Account', signIn: 'Sign in', signOut: 'Sign out', guestbook: 'Guestbook',
  about: 'About', encyclopedia: 'Encyclopedia', privacy: 'Privacy',
  tLandmark: 'Landmark', tAnimal: 'Animal', tDiscovery: 'Discovery', tVehicle: 'Vehicle', built: 'Built', height: 'Height', length: 'Length', weight: 'Weight', speed: 'Top speed', lifespan: 'Lifespan', depth: 'Depth', year: 'Year',
  diet: 'Diet', carnivore: 'Meat-eater', herbivore: 'Plant-eater', omnivore: 'Eats everything', status: 'Status', habitat: 'Lives in', funFact: 'Fun fact', moreDetails: 'More details',
  LC: 'Doing fine', NT: 'Near threatened', VU: 'Vulnerable', EN: 'Endangered', CR: 'Critically endangered',
  like: 'Like', visited: 'I’ve been here', ride: 'Ride along', exitRide: 'Exit', rideTip: 'Drag to look around · wheel for distance', readMore: 'Read more',
  collectHint: 'Zoom in closer (×{z}) to add this animal to your dex', collected: 'In your dex ✓', addDex: 'Add to dex', logged: 'Logged ✓', logIt: 'Log this discovery',
  animalDex: 'Animal dex', animalDexSub: 'Find animals and zoom in close to collect them', discoveryDex: 'Discovery dex', discoveryDexSub: 'Find wrecks, mysteries and legends, tap to log them',
  stickers: 'Stickers', stickersSub: 'All the stickers you have earned', album: 'Photo album', albumSub: 'Snapshots you took of the globe', photos: '{n} photos', found: '{n} / {t} found',
  sortDefault: 'Default order', sortEarned: 'Earned first', locked: 'Not found yet', goThere: 'Fly there',
  chooseGame: 'Choose a game', daily: 'Daily Planet', dailySub: 'One mystery place a day. Six guesses.', placeit: 'Place it!', placeitSub: 'Tap where you think it is.', quiz: 'Globe quiz', quizSub: 'Multiple choice for 1–4 players.',
  practice: 'Practice', easy: 'Easy', medium: 'Medium', hard: 'Hard', normal: 'Normal', round: 'Round {r} / {n}', score: 'Score', total: 'Total', best: 'Best', hint: 'Hint', confirm: 'Confirm', guessHere: 'Tap the globe to place your pin',
  distance: '{d} away', points: '{p} points', perfect: 'Perfect!', great: 'Great!', good: 'Good', tryAgain: 'Keep trying!', results: 'Results', playAgain: 'Play again', newRecord: 'New record!',
  players: 'Players', player: 'Player {n}', set: 'Topic', level: 'Level', yourTurn: '{p}, your turn!', correct: 'Correct!', wrong: 'Not quite — it was {a}', question: 'Question {q} / {n}',
  setmixed: 'Mixed', setanimals: 'Animals', setgeo: 'Geography', setlandmarks: 'Landmarks', setsecrets: 'Secrets & legends',
  dailyPick: 'Pick on globe', dailyTap: 'Tap the globe where you think it is', dailyGuess: 'Type a place…', dailyWin: 'You found it in {n}!', dailyLose: 'It was {a}', share: 'Share', copied: 'Copied!', streak: 'Streak', played: 'Played', nextPuzzle: 'Next puzzle in {t}',
  dHintCont: 'Continent: {c}', dHintCountry: 'Country: {c}', dHintName: 'Starts with “{c}”',
  shutter: 'Take photo', photoSaved: 'Saved to your album', save: 'Save', del: 'Delete', noPhotos: 'No photos yet — press 📷 to take one!',
  tut1t: 'Spin the planet', tut1b: 'Drag the globe with your finger or mouse.', tut2t: 'Zoom in', tut2b: 'Use the wheel, pinch, or the + button.', tut3t: 'Tap something', tut3b: 'Tap a landmark or animal to see its card.',
  tut4t: 'Your collection', tut4b: 'Animals and discoveries you find are saved here.', tut5t: 'Play games', tut5b: 'Daily puzzle, Place it! and the quiz live here.', tut6t: 'Make it yours', tut6b: 'Turn layers, sounds and the language on and off in the menu.', tut7t: 'Have fun!', tut7b: 'Your progress is saved on this device. Sign in to keep it everywhere.',
  emailLabel: 'Email', sendLink: 'Send sign-in link', linkSent: 'Check your inbox for a sign-in link.', devLink: 'Dev mode: open this link to sign in', signedInAs: 'Signed in as {e}', syncNow: 'Sync now', synced: 'Progress synced', offline: 'Offline — progress is kept on this device',
  handle: 'Nickname', gbPlaceholder: 'Say hello (max 200 characters)', post: 'Post', report: 'Report', gbNeedLogin: 'Sign in to write in the guestbook', gbEmpty: 'Be the first to say hi!',
  deleteAccount: 'Delete account', deleteConfirm: 'Delete your account and server copy of your progress? Your device copy stays.', saveBtn: 'Save', signedOut: 'Signed out', reported: 'Thanks — a grown-up will check it.',
  signInSub: 'Optional. Sign in with an email link to keep your progress on every device. No password needed.', handleRule: '2–16 letters, numbers, Chinese characters or _',
  of: 'of', tutStep: 'Step {i} of {n}',
  latitude: 'Latitude', north: 'N · Northern Hemisphere', south: 'S · Southern Hemisphere',
  notFound: 'Nothing found', search: 'Search', resetConfirm: 'Reset the camera and all settings?', sticker_unlocked: 'Sticker unlocked: {s}',
  auraPreset: 'Atmosphere', surfaceMode: 'Surface Mode', modeSat: 'Satellite', modeVec: 'Minimal', modePol: 'Political',
  searchPlaceholder: 'Search places, animals, planets, galaxies', randomHop: 'Random Hop', filterAll: 'All', coords: 'Coordinates', zoomClose: 'Zoom 3D',
  inOrbit: 'In orbit',
  readerClose: 'Close reader', readerOpenWiki: 'Open on Wikipedia', readerContinue: 'Continue reading', readerMoreSections: '{n} more sections',
  readerMinutes: '{n} min read', readerSections: '{n} sections', readerOnlyEn: 'No Chinese article yet — showing the English one.', readerContents: 'Contents',
  readerLicense: 'Text from the Wikipedia article “{title}”, shared under', readerPage: 'Pocket Planet page', readerOffline: 'Couldn’t reach Wikipedia. Here’s what we know:',
  readerMissing: 'Wikipedia has no article for this one yet. Here’s what we know:', readerRetry: 'Try again', readerNearby: 'Nearby on Pocket Planet',
  graticule: 'Latitude & longitude lines',
};

const zh: Dict = {
  title: '口袋星球', badge: '测试版', loading: '正在唤醒星球…', webglFail: '你的浏览器无法启动 3D 图形。请换一个浏览器，或开启硬件加速。',
  counts: '{l} 个地标 · {c} 个国家 · {ci} 座城市 · {a} 种动物 · {d} 个发现 · {v} 种交通工具',
  photo: '拍照', collection: '收藏', game: '游戏', menu: '菜单', close: '关闭', back: '返回', open: '打开', start: '开始', next: '下一步', done: '完成', skip: '跳过',
  hintDrag: '<b>拖动</b> 旋转地球', hintZoom: '<b>滚轮 / 双指</b> 放大看到更多地方', hintTap: '<b>点击标记</b> 查看图片与介绍', tutorialAgain: '再看一次教程',
  fullscreen: '全屏', zoomIn: '放大', zoomOut: '缩小', help: '帮助',
  mMap: '地图', mGlobe: '地球上', mSettings: '设置', terrain: '地形视图', names: '地名', borders: '国界与经纬线', shadows: '昼夜',
  landmarks: '地标', animals: '动物', discoveries: '发现', vehicles: '船、飞机和火车', sfx: '音效', bgm: '音乐',
  dinos: '恐龙', foods: '美食', festivals: '节日', space: '太空与科学', plants: '植物与森林', sports: '体育', volcanoes: '火山',
  migrations: '动物迁徙', voyages: '伟大航程', people: '历史名人', born: '出生', died: '逝世', mLayers: '图层', tectonics: '板块与火山带', clouds: '云层', aurora: '极光',
  passport: '护照', passportSub: '去过的地方都盖个章', stamps: '{n} / {t} 个印章', nextStop: '下一站：{p}', bookDone: '这本集满啦！🎉',
  timeMachine: '时光机', tmNow: '今天', tmDino: '恐龙时代', tmCount: '地球上有 {n} 个', tmAppear: '新出现：', bce: '公元前 {n} 年', ce1: '公元 1 年',
  sayHello: '打招呼', hearIt: '听叫声', helloIn: '👋 用{lang}说你好：“{say}”', noSpeech: '（此浏览器不支持朗读）',
  foundIt: '已收集 ✓', collectIt: '收集', lived: '生活年代', myaAgo: '约 {w} 万年前', when: '时间',
  language: '语言', reset: '重置视图和设置', resetBtn: '重置', account: '账户', signIn: '登录', signOut: '退出登录', guestbook: '留言板',
  about: '关于', encyclopedia: '百科', privacy: '隐私',
  tLandmark: '地标', tAnimal: '动物', tDiscovery: '发现', tVehicle: '交通工具', built: '建成', height: '高度', length: '长度', weight: '体重', speed: '最高速度', lifespan: '寿命', depth: '深度', year: '年份',
  diet: '食性', carnivore: '吃肉', herbivore: '吃植物', omnivore: '什么都吃', status: '保护状况', habitat: '栖息地', funFact: '趣味知识', moreDetails: '更多详情',
  LC: '无危', NT: '近危', VU: '易危', EN: '濒危', CR: '极危',
  like: '喜欢', visited: '我去过', ride: '一起乘坐', exitRide: '退出', rideTip: '拖动环顾四周 · 滚轮调整距离', readMore: '阅读更多',
  collectHint: '再放大一些（×{z}）就能把这种动物收进图鉴', collected: '已收入图鉴 ✓', addDex: '收入图鉴', logged: '已记录 ✓', logIt: '记录这个发现',
  animalDex: '动物图鉴', animalDexSub: '找到动物并放大靠近来收集它们', discoveryDex: '发现图鉴', discoveryDexSub: '寻找沉船、谜团和传说，点击即可记录',
  stickers: '贴纸', stickersSub: '你获得的所有贴纸', album: '相册', albumSub: '你拍下的地球快照', photos: '{n} 张照片', found: '已找到 {n} / {t}',
  sortDefault: '默认顺序', sortEarned: '已获得优先', locked: '尚未找到', goThere: '飞过去',
  chooseGame: '选择游戏', daily: '每日星球', dailySub: '每天一个神秘地点，六次猜测机会。', placeit: '在哪里？', placeitSub: '点击你认为它所在的位置。', quiz: '地球问答', quizSub: '1–4 名玩家的选择题。',
  practice: '练习', easy: '简单', medium: '中等', hard: '困难', normal: '普通', round: '第 {r} / {n} 轮', score: '得分', total: '总分', best: '最佳', hint: '提示', confirm: '确定', guessHere: '点击地球放下你的图钉',
  distance: '相距 {d}', points: '{p} 分', perfect: '完美！', great: '很棒！', good: '不错', tryAgain: '继续加油！', results: '结果', playAgain: '再玩一次', newRecord: '新纪录！',
  players: '玩家', player: '玩家 {n}', set: '主题', level: '难度', yourTurn: '{p}，轮到你了！', correct: '答对了！', wrong: '差一点——答案是 {a}', question: '第 {q} / {n} 题',
  setmixed: '综合', setanimals: '动物', setgeo: '地理', setlandmarks: '地标', setsecrets: '秘密与传说',
  dailyPick: '在地球上选择', dailyTap: '点击地球上你认为的位置', dailyGuess: '输入一个地点…', dailyWin: '你用 {n} 次猜中了！', dailyLose: '答案是 {a}', share: '分享', copied: '已复制！', streak: '连胜', played: '已玩', nextPuzzle: '下一题还有 {t}',
  dHintCont: '大洲：{c}', dHintCountry: '国家：{c}', dHintName: '以“{c}”开头',
  shutter: '拍照', photoSaved: '已保存到相册', save: '保存', del: '删除', noPhotos: '还没有照片——按 📷 拍一张吧！',
  tut1t: '转动星球', tut1b: '用手指或鼠标拖动地球。', tut2t: '放大', tut2b: '使用滚轮、双指缩放或 + 按钮。', tut3t: '点一点', tut3b: '点击地标或动物，查看它的卡片。',
  tut4t: '你的收藏', tut4b: '你找到的动物和发现都保存在这里。', tut5t: '玩游戏', tut5b: '每日谜题、在哪里？和问答游戏都在这里。', tut6t: '随心设置', tut6b: '在菜单里开关图层、声音并切换语言。', tut7t: '玩得开心！', tut7b: '你的进度保存在这台设备上。登录后可在任何设备上继续。',
  emailLabel: '邮箱', sendLink: '发送登录链接', linkSent: '请在收件箱中查看登录链接。', devLink: '开发模式：打开此链接登录', signedInAs: '已登录：{e}', syncNow: '立即同步', synced: '进度已同步', offline: '离线——进度保存在这台设备上',
  handle: '昵称', gbPlaceholder: '打个招呼吧（最多 200 字）', post: '发布', report: '举报', gbNeedLogin: '登录后才能在留言板留言', gbEmpty: '来做第一个打招呼的人吧！',
  deleteAccount: '删除账户', deleteConfirm: '要删除你的账户以及服务器上的进度吗？这台设备上的进度会保留。', saveBtn: '保存', signedOut: '已退出登录', reported: '谢谢——大人会来检查的。',
  signInSub: '可选。通过邮箱链接登录，即可在每台设备上保留进度，无需密码。', handleRule: '2–16 个字母、数字、汉字或 _',
  of: '/', tutStep: '第 {i} 步，共 {n} 步',
  latitude: '纬度', north: '北纬 · 北半球', south: '南纬 · 南半球',
  notFound: '没有找到', search: '搜索', resetConfirm: '要重置镜头和所有设置吗？', sticker_unlocked: '获得贴纸：{s}',
  auraWaves: '大气层', auraAurora: '极光', auraEmber: '太阳风', auraDusk: '磁层', auraSculpture: '电离层',
  badgeNew: '新', tools: '工具', globeLabel: '可互动的 3D 地球',
  solarSystem: '太阳系', skyEvents: '天象', solarLabel: '可互动的 3D 太阳系', backToEarth: '返回地球', enterEarth: '降落地球',
  solarHint: '拖动环顾 · 滚轮缩放 · 点选星球', overview: '整个太阳系',
  spPause: '暂停', spReal: '真实速度', spHour: '1 小时/秒', spDay: '1 天/秒', spMonth: '1 个月/秒', spYear: '1 年/秒', now: '现在', timeSpeed: '时间速度',
  bk_star: '恒星', bk_planet: '行星', bk_dwarf: '矮行星', bk_moon: '卫星', moonOf: '{p}的卫星',
  diameter: '直径', dayLen: '一天', yearLen: '一年', orbitLen: '公转一圈', moonsN: '卫星', gravity: '重力', temperature: '温度',
  fromSun: '距太阳', fromEarth: '距地球', fromParent: '距{p}', sunlight: '阳光到达需', lockedDay: '总是同一面朝{p}',
  hoursN: '{n} 小时', daysN: '{n} 天', yearsN: '{n} 年', minutesN: '{n} 分钟', xEarth: '地球的 {n} 倍', size: '大小',
  surface: '地形地貌', moonsList: '卫星', backTo: '返回{p}', where: '位置',
  fk_crater: '撞击坑', fk_basin: '盆地', fk_mare: '月海', fk_mountain: '山', fk_volcano: '火山', fk_canyon: '峡谷', fk_plain: '平原',
  fk_cap: '极冠', fk_storm: '风暴', fk_landing: '着陆点', fk_rift: '裂谷', fk_lake: '湖泊', fk_region: '地区', fk_geyser: '间歇泉',
  fk_ridge: '山脊', fk_cliff: '悬崖', fk_spot: '斑', fk_ring: '环',
  sc_universe: '宇宙', sc_laniakea: '超星系团', sc_group: '本星系群', sc_galaxy: '银河系', sc_solar: '太阳系', sc_earth: '地球',
  scales: '宇宙的缩放层级', youAreHere: '太阳系 · 你在这里', deepHint: '拖动旋转 · 滚轮放大回到下一层 · 点名字看详情', deepHintTouch: '拖动旋转 · 双指放大回到下一层 · 点名字看详情', hud_target: '目标', hud_coord: '坐标', hud_range: '距离', hud_radii: '{n} 倍半径', hud_scale: '尺度', hud_span: '视野', cst_toggle: '星座', cst_kind: '星座', cst_stars: '连线的亮星', cst_brightest: '最亮的星',
  overviewScale: '全景', lightYears: '离我们', ly: '{n} 光年', across: '直径', kindOf: '类型', lookback: '光出发于',
  yearsAgo: '{n} 年前', scaleIs: '尺度', highlights: '看点',
  dk_blackhole: '黑洞', dk_arm: '旋臂', dk_bar: '星系棒', dk_region: '引力中心', dk_nebula: '星云', dk_remnant: '超新星遗迹', dk_starcluster: '星团', dk_globular: '球状星团',
  dk_star: '恒星', dk_galaxy: '星系', dk_dwarf: '矮星系', dk_group: '星系群', dk_cluster: '星系团', dk_supercluster: '超星系团',
  dk_wall: '长城', dk_void: '宇宙空洞', dk_quasar: '类星体', dk_cmb: '最古老的光', dk_deepfield: '深空场',
  mo_spiral: '旋涡星系', mo_barred: '棒旋星系', mo_elliptical: '椭圆星系', mo_lenticular: '透镜状星系', mo_irregular: '不规则星系', mo_dwarf: '矮星系',
  sk_lander: '着陆器', sk_rover: '巡视车', sk_crewed: '载人登陆', sk_probe: '探测器', sk_orbiter: '环绕器', sk_flyby: '飞掠', sk_plume: '羽流',
  sk_landform: '地貌', sk_station: '空间站', explorers: '探测器与遗址', agency: '机构', arrived: '到达', planned: '计划',
  fromSunAU: '距太阳 {n} 天文单位', filterSpace: '太空与宇宙',
  auraPreset: '大气', surfaceMode: '地表模式', modeSat: '卫星', modeVec: '极简', modePol: '政区',
  searchPlaceholder: '搜索地点、动物、星球和星系', randomHop: '随机跳转', filterAll: '全部', coords: '坐标', zoomClose: '3D 近看',
  inOrbit: '在轨道上',
  readerClose: '收起', readerOpenWiki: '在维基百科中打开', readerContinue: '继续阅读', readerMoreSections: '还有 {n} 个章节',
  readerMinutes: '约 {n} 分钟读完', readerSections: '{n} 个章节', readerOnlyEn: '暂无中文条目——显示英文版本。', readerContents: '目录',
  readerLicense: '正文来自维基百科条目“{title}”，遵循', readerPage: '口袋星球页面', readerOffline: '暂时连不上维基百科。以下是我们知道的：',
  readerMissing: '维基百科还没有这个条目。以下是我们知道的：', readerRetry: '重试', readerNearby: '附近的地点',
  graticule: '经纬线',
};

const DICTS: Record<Lang, Dict> = { en, zh };

function detect(): Lang {
  const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en';
  return nav === 'zh' ? 'zh' : 'en';
}

const saved = load<string | null>('lang', null);
let current: Lang = saved === 'en' || saved === 'zh' ? saved : detect();
const subs = new Set<(l: Lang) => void>();

export function lang(): Lang { return current; }
export function setLang(l: Lang): void {
  current = l;
  save('lang', l);
  if (typeof document !== 'undefined') document.documentElement.lang = l;
  for (const fn of subs) fn(l);
}
export function onLang(fn: (l: Lang) => void): () => void { subs.add(fn); return () => subs.delete(fn); }

export function t(key: string, vars?: Record<string, string | number>, l: Lang = current): string {
  let s = DICTS[l][key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll('{' + k + '}', String(v));
  return s;
}

export function hasKey(key: string, l: Lang): boolean { return key in DICTS[l]; }
export const EN_KEYS = Object.keys(en);

const regionNames = new Map<Lang, Intl.DisplayNames>();
export function countryName(a2: string | undefined, l: Lang = current): string {
  if (!a2) return '';
  if (a2 === 'XK') return { en: 'Kosovo', zh: '科索沃' }[l];
  let dn = regionNames.get(l);
  if (!dn) { dn = new Intl.DisplayNames([l], { type: 'region' }); regionNames.set(l, dn); }
  try { return dn.of(a2) ?? a2; } catch { return a2; }
}

export function fmtNum(n: number, l: Lang = current): string { return new Intl.NumberFormat(l).format(n); }
