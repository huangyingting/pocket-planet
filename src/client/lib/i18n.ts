import { load, save } from './storage.ts';
import type { Lang } from '../../shared/data/types.ts';

type Dict = Record<string, string>;

const en: Dict = {
  title: 'Pocket Planet', badge: 'BETA', loading: 'Waking up the planet…', webglFail: 'Your browser could not start 3D graphics. Try another browser or turn on hardware acceleration.',
  counts: '{l} LANDMARKS · {c} COUNTRIES · {ci} CITIES · {a} ANIMALS · {d} DISCOVERIES · {v} VEHICLES',
  photo: 'Photo', collection: 'Collection', game: 'Game', menu: 'Menu', close: 'Close', back: 'Back', open: 'Open', start: 'Start', next: 'Next', done: 'Done', skip: 'Skip',
  hintDrag: '<b>Drag</b> spin the globe', hintZoom: '<b>Wheel / pinch</b> zoom in for more places', hintTap: '<b>Tap a marker</b> photo & info', tutorialAgain: '🎓 Show the tutorial again',
  fullscreen: 'Fullscreen', zoomIn: 'Zoom in', zoomOut: 'Zoom out', help: 'Help',
  mMap: 'Map', mGlobe: 'On the globe', mSettings: 'Settings', terrain: 'Terrain view', names: 'Place names', borders: 'Borders & grid lines', shadows: 'Day & night',
  landmarks: 'Landmarks', animals: 'Animals', discoveries: 'Discoveries', vehicles: 'Ships, planes & trains', sfx: 'Sound effects', bgm: 'Music',
  language: 'Language', reset: 'Reset view & settings', resetBtn: 'Reset', account: 'Account', signIn: 'Sign in', signOut: 'Sign out', guestbook: 'Guestbook',
  about: 'About', encyclopedia: 'Encyclopedia', credits: 'Credits', privacy: 'Privacy',
  tLandmark: 'Landmark', tAnimal: 'Animal', tDiscovery: 'Discovery', tVehicle: 'Vehicle', built: 'Built', height: 'Height', length: 'Length', weight: 'Weight', speed: 'Top speed', lifespan: 'Lifespan', depth: 'Depth', year: 'Year',
  diet: 'Diet', carnivore: 'Meat-eater', herbivore: 'Plant-eater', omnivore: 'Eats everything', status: 'Status', habitat: 'Lives in', funFact: 'Fun fact',
  LC: 'Doing fine', NT: 'Near threatened', VU: 'Vulnerable', EN: 'Endangered', CR: 'Critically endangered',
  like: 'Like', visited: 'I’ve been here', ride: 'Ride along', exitRide: 'Exit', rideTip: 'Drag to look around · wheel for distance', readMore: 'Read more →',
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
  signInSub: 'Optional. Sign in with an email link to keep your progress on every device. No password needed.', handleRule: '2–16 letters, numbers or _', creditsBody: 'Pocket Planet is an original, open-source learning toy. 3D models are drawn in code. Country shapes: Natural Earth (public domain) via world-atlas. Made with three.js.',
  of: 'of', tutStep: 'Step {i} of {n}',
  latitude: 'Latitude', north: 'N · Northern Hemisphere', south: 'S · Southern Hemisphere',
  notFound: 'Nothing found', search: 'Search', resetConfirm: 'Reset the camera and all settings?', sticker_unlocked: 'Sticker unlocked: {s}',
  auraPreset: 'Planetary Aura', surfaceMode: 'Surface Mode', modeSat: 'SAT · Satellite', modeVec: 'VEC · Minimal', modePol: 'ATLAS · Political',
  searchPlaceholder: 'Search 3D landmarks, animals, mysteries…', randomHop: 'Random Hop', filterAll: 'All', coords: 'Coordinates', zoomClose: 'Zoom 3D',
};

const ko: Dict = {
  auraPreset: '행성 오로라', surfaceMode: '표면 모드', modeSat: 'SAT · 위성 지형', modeVec: 'VEC · 미니멀 벡터', modePol: 'ATLAS · 세계 지도',
  searchPlaceholder: '3D 랜드마크, 동물, 미스터리 검색…', randomHop: '랜덤 이동', filterAll: '전체', coords: '좌표', zoomClose: '3D 클로즈업',
  latitude: '위도', north: 'N · 북반구', south: 'S · 남반구',
  deleteAccount: '계정 삭제', deleteConfirm: '계정과 서버에 저장된 진행 상황을 삭제할까요? 이 기기의 기록은 남아요.', saveBtn: '저장', signedOut: '로그아웃했어요', reported: '고마워요 — 어른이 확인할게요.',
  signInSub: '선택 사항이에요. 이메일 링크로 로그인하면 모든 기기에서 진행 상황이 이어져요. 비밀번호는 필요 없어요.', handleRule: '2–16자의 글자, 숫자 또는 _', creditsBody: '포켓 플래닛은 독창적인 오픈 소스 학습 장난감이에요. 3D 모델은 코드로 그렸어요. 국가 경계: Natural Earth(퍼블릭 도메인), world-atlas. three.js로 만들었어요.',
  of: '/', tutStep: '{n}단계 중 {i}단계',
  title: '포켓 플래닛', badge: '베타', loading: '지구를 깨우는 중…', webglFail: '브라우저에서 3D 그래픽을 시작할 수 없어요. 다른 브라우저를 사용하거나 하드웨어 가속을 켜 주세요.',
  counts: '랜드마크 {l} · 나라 {c} · 도시 {ci} · 동물 {a} · 발견 {d} · 탈것 {v}',
  photo: '사진', collection: '컬렉션', game: '게임', menu: '메뉴', close: '닫기', back: '뒤로', open: '열기', start: '시작', next: '다음', done: '완료', skip: '건너뛰기',
  hintDrag: '<b>드래그</b> 지구 돌리기', hintZoom: '<b>휠 / 핀치</b> 확대하면 더 많은 장소', hintTap: '<b>마커 탭</b> 사진과 정보', tutorialAgain: '🎓 튜토리얼 다시 보기',
  fullscreen: '전체 화면', zoomIn: '확대', zoomOut: '축소', help: '도움말',
  mMap: '지도', mGlobe: '지구본 위', mSettings: '설정', terrain: '지형 보기', names: '지명', borders: '국경선과 격자', shadows: '낮과 밤',
  landmarks: '랜드마크', animals: '동물', discoveries: '발견', vehicles: '배, 비행기, 기차', sfx: '효과음', bgm: '음악',
  language: '언어', reset: '화면과 설정 초기화', resetBtn: '초기화', account: '계정', signIn: '로그인', signOut: '로그아웃', guestbook: '방명록',
  about: '소개', encyclopedia: '백과사전', credits: '만든 사람', privacy: '개인정보',
  tLandmark: '랜드마크', tAnimal: '동물', tDiscovery: '발견', tVehicle: '탈것', built: '건설', height: '높이', length: '길이', weight: '무게', speed: '최고 속도', lifespan: '수명', depth: '깊이', year: '연도',
  diet: '먹이', carnivore: '육식', herbivore: '초식', omnivore: '잡식', status: '보전 상태', habitat: '사는 곳', funFact: '재미있는 사실',
  LC: '안전', NT: '준위협', VU: '취약', EN: '위기', CR: '위급',
  like: '좋아요', visited: '가 봤어요', ride: '같이 타기', exitRide: '나가기', rideTip: '드래그로 둘러보기 · 휠로 거리 조절', readMore: '더 읽기 →',
  collectHint: '더 가까이(×{z}) 확대하면 도감에 추가할 수 있어요', collected: '도감에 있어요 ✓', addDex: '도감에 추가', logged: '기록됨 ✓', logIt: '발견 기록하기',
  animalDex: '동물 도감', animalDexSub: '동물을 찾아 가까이 확대해서 모아요', discoveryDex: '발견 도감', discoveryDexSub: '난파선, 미스터리, 전설을 찾아 기록해요',
  stickers: '스티커', stickersSub: '지금까지 모은 스티커', album: '사진첩', albumSub: '지구에서 찍은 사진', photos: '사진 {n}장', found: '{n} / {t} 찾음',
  sortDefault: '기본 순서', sortEarned: '얻은 것 먼저', locked: '아직 못 찾음', goThere: '그곳으로 가기',
  chooseGame: '게임 고르기', daily: '오늘의 지구', dailySub: '하루에 하나, 수수께끼 장소. 기회는 6번.', placeit: '어디일까?', placeitSub: '있을 것 같은 곳을 탭하세요.', quiz: '지구 퀴즈', quizSub: '1~4명이 함께하는 객관식 퀴즈.',
  practice: '연습', easy: '쉬움', medium: '보통', hard: '어려움', normal: '보통', round: '{r} / {n} 라운드', score: '점수', total: '합계', best: '최고', hint: '힌트', confirm: '확인', guessHere: '지구를 탭해서 핀을 꽂으세요',
  distance: '{d} 떨어짐', points: '{p}점', perfect: '완벽해요!', great: '잘했어요!', good: '좋아요', tryAgain: '다시 해 봐요!', results: '결과', playAgain: '다시 하기', newRecord: '신기록!',
  players: '참가자', player: '참가자 {n}', set: '주제', level: '난이도', yourTurn: '{p} 차례예요!', correct: '정답!', wrong: '아쉬워요 — 정답은 {a}', question: '{q} / {n} 문제',
  setmixed: '섞어서', setanimals: '동물', setgeo: '지리', setlandmarks: '랜드마크', setsecrets: '비밀과 전설',
  dailyPick: '지구본에서 고르기', dailyTap: '정답이라고 생각하는 곳을 지구본에서 눌러요', dailyGuess: '장소를 입력하세요…', dailyWin: '{n}번 만에 찾았어요!', dailyLose: '정답은 {a}', share: '공유', copied: '복사했어요!', streak: '연속', played: '플레이', nextPuzzle: '다음 문제까지 {t}',
  dHintCont: '대륙: {c}', dHintCountry: '나라: {c}', dHintName: '“{c}”(으)로 시작해요',
  shutter: '사진 찍기', photoSaved: '사진첩에 저장했어요', save: '저장', del: '삭제', noPhotos: '아직 사진이 없어요 — 📷를 눌러 찍어 보세요!',
  tut1t: '지구 돌리기', tut1b: '손가락이나 마우스로 지구를 드래그하세요.', tut2t: '확대하기', tut2b: '휠, 핀치, + 버튼을 사용하세요.', tut3t: '눌러 보기', tut3b: '랜드마크나 동물을 탭하면 카드가 나와요.',
  tut4t: '내 컬렉션', tut4b: '찾은 동물과 발견이 여기에 저장돼요.', tut5t: '게임하기', tut5b: '오늘의 지구, 어디일까?, 퀴즈가 있어요.', tut6t: '내 마음대로', tut6b: '메뉴에서 레이어, 소리, 언어를 바꿀 수 있어요.', tut7t: '즐겁게 놀아요!', tut7b: '기록은 이 기기에 저장돼요. 로그인하면 어디서나 이어서 할 수 있어요.',
  emailLabel: '이메일', sendLink: '로그인 링크 보내기', linkSent: '메일함에서 로그인 링크를 확인하세요.', devLink: '개발 모드: 이 링크를 열어 로그인', signedInAs: '{e}(으)로 로그인됨', syncNow: '지금 동기화', synced: '기록을 동기화했어요', offline: '오프라인 — 기록은 이 기기에 보관돼요',
  handle: '닉네임', gbPlaceholder: '인사를 남겨 주세요 (최대 200자)', post: '올리기', report: '신고', gbNeedLogin: '방명록을 쓰려면 로그인하세요', gbEmpty: '첫 인사를 남겨 주세요!',
  notFound: '찾을 수 없어요', search: '검색', resetConfirm: '카메라와 모든 설정을 초기화할까요?', sticker_unlocked: '스티커 획득: {s}',
};

const ja: Dict = {
  title: 'ポケットプラネット', badge: 'ベータ', loading: '地球を起こしています…', photo: '写真', collection: 'コレクション', game: 'ゲーム', menu: 'メニュー', close: '閉じる', back: '戻る', open: '開く', start: 'スタート', next: '次へ', done: '完了', skip: 'スキップ',
  hintDrag: '<b>ドラッグ</b> 地球を回す', hintZoom: '<b>ホイール / ピンチ</b> ズームで場所が増える', hintTap: '<b>マーカーをタップ</b> 写真と情報', tutorialAgain: '🎓 チュートリアルをもう一度',
  mMap: '地図', mGlobe: '地球儀の上', mSettings: '設定', terrain: '地形表示', names: '地名', borders: '国境と経緯線', shadows: '昼と夜', landmarks: 'ランドマーク', animals: '動物', discoveries: '発見', vehicles: '船・飛行機・列車', sfx: '効果音', bgm: '音楽',
  language: '言語', reset: '表示と設定をリセット', resetBtn: 'リセット', account: 'アカウント', signIn: 'ログイン', signOut: 'ログアウト', guestbook: 'ゲストブック', about: 'について', encyclopedia: '百科事典', credits: 'クレジット',
  tLandmark: 'ランドマーク', tAnimal: '動物', tDiscovery: '発見', tVehicle: '乗り物', like: 'いいね', visited: '行ったことある', ride: '乗ってみる', exitRide: '降りる', readMore: 'もっと読む →',
  animalDex: '動物図鑑', discoveryDex: '発見図鑑', stickers: 'ステッカー', album: 'アルバム', chooseGame: 'ゲームを選ぶ', daily: '今日の地球', placeit: 'どこかな？', quiz: '地球クイズ',
  correct: '正解！', results: '結果', playAgain: 'もう一度', share: 'シェア', shutter: '撮影',
};

const zh: Dict = {
  title: '口袋星球', badge: '测试版', loading: '正在唤醒星球…', photo: '拍照', collection: '收藏', game: '游戏', menu: '菜单', close: '关闭', back: '返回', open: '打开', start: '开始', next: '下一步', done: '完成', skip: '跳过',
  hintDrag: '<b>拖动</b> 旋转地球', hintZoom: '<b>滚轮 / 双指</b> 放大看到更多地方', hintTap: '<b>点击标记</b> 图片与介绍', tutorialAgain: '🎓 再看一次教程',
  mMap: '地图', mGlobe: '地球上', mSettings: '设置', terrain: '地形视图', names: '地名', borders: '国界与经纬线', shadows: '昼夜', landmarks: '地标', animals: '动物', discoveries: '发现', vehicles: '船、飞机和火车', sfx: '音效', bgm: '音乐',
  language: '语言', reset: '重置视图和设置', resetBtn: '重置', account: '账户', signIn: '登录', signOut: '退出', guestbook: '留言板', about: '关于', encyclopedia: '百科', credits: '致谢',
  tLandmark: '地标', tAnimal: '动物', tDiscovery: '发现', tVehicle: '交通工具', like: '喜欢', visited: '我去过', ride: '一起乘坐', exitRide: '退出', readMore: '阅读更多 →',
  animalDex: '动物图鉴', discoveryDex: '发现图鉴', stickers: '贴纸', album: '相册', chooseGame: '选择游戏', daily: '每日星球', placeit: '在哪里？', quiz: '地球问答',
  correct: '答对了！', results: '结果', playAgain: '再玩一次', share: '分享', shutter: '拍照',
};

const DICTS: Record<Lang, Dict> = { en, ko, ja, zh };

function detect(): Lang {
  const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en';
  return (['en', 'ko', 'ja', 'zh'] as Lang[]).includes(nav as Lang) ? (nav as Lang) : 'en';
}

let current: Lang = load<Lang | null>('lang', null) ?? detect();
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
  if (a2 === 'XK') return { en: 'Kosovo', ko: '코소보', ja: 'コソボ', zh: '科索沃' }[l];
  let dn = regionNames.get(l);
  if (!dn) { dn = new Intl.DisplayNames([l], { type: 'region' }); regionNames.set(l, dn); }
  try { return dn.of(a2) ?? a2; } catch { return a2; }
}

export function fmtNum(n: number, l: Lang = current): string { return new Intl.NumberFormat(l).format(n); }
