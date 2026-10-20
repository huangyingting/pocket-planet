import type { Lang } from './types.ts';

/** Chinese names for catalogue sub-categories (`CatalogueItem.sub`); English uses the key itself. */
export const SUB_ZH: Record<string, string> = {
  tower: '塔', 'ancient-site': '古迹', statue: '雕像', religious: '宗教建筑', fort: '要塞', volcano: '火山', theatre: '剧院',
  stadium: '体育场', mill: '风车磨坊', monument: '纪念碑', bridge: '桥梁', skyscraper: '摩天大楼', castle: '城堡', palace: '宫殿',
  museum: '博物馆', mountain: '山峰', canyon: '峡谷', waterfall: '瀑布', rock: '巨岩', reef: '珊瑚礁', village: '村落', bay: '海湾',
  fjord: '峡湾', nature: '自然奇观', lake: '湖泊', river: '河流', desert: '沙漠', ruins: '遗迹', arena: '竞技场', capitol: '议会大厦',
  canal: '运河', temple: '神庙', 'spirit house': '神龛', harbour: '港湾', mosque: '清真寺', church: '教堂', fortress: '堡垒', stupa: '佛塔',
  parliament: '议会', minaret: '宣礼塔', pyramid: '金字塔', building: '建筑', kasbah: '城堡要塞', monastery: '修道院', 'old-town': '古城',
  'island-church': '岛上教堂', cathedral: '大教堂',
  mammal: '哺乳动物', bird: '鸟类', fish: '鱼类', reptile: '爬行动物', mollusc: '软体动物', amphibian: '两栖动物', insect: '昆虫', crab: '蟹类',
  wreck: '沉船', mystery: '未解之谜', cryptid: '神秘生物', deepsea: '深海', extreme: '极端环境', restricted: '禁区', tomb: '陵墓', cave: '洞穴',
  relic: '文物', city: '古城', geoglyph: '地画', fossil: '化石', ship: '船', landform: '奇特地貌', mummy: '木乃伊',
  plane: '飞机', train: '火车',
  theropod: '兽脚类', ceratopsian: '角龙类', armoured: '甲龙类', sauropod: '蜥脚类', ornithopod: '鸟脚类', 'flying reptile': '翼龙',
  'sea reptile': '海生爬行动物', prosauropod: '原蜥脚类', bonehead: '肿头龙类',
  bread: '面包', rice: '米饭', roast: '烤肉', dumplings: '饺子', soup: '汤', noodles: '面条', 'street food': '街头小吃', pancakes: '薄饼',
  stew: '炖菜', sweets: '甜点', seafood: '海鲜', dips: '蘸酱',
  'new year': '新年', lights: '灯节', summer: '夏季', harvest: '丰收', winter: '冬季', carnival: '狂欢节', spring: '春季', remembrance: '纪念日',
  sun: '太阳节', fire: '火节', fishing: '捕鱼节', balloons: '热气球', kites: '风筝', culture: '文化节',
  'launch site': '发射场', telescope: '望远镜', lab: '实验室', crater: '陨石坑', station: '空间站', observatory: '天文台', meteorite: '陨石',
  tree: '树木', flower: '花卉', forest: '森林', carnivorous: '食虫植物', crop: '农作物', seaweed: '海藻',
  running: '跑步', golf: '高尔夫', cycling: '自行车', skiing: '滑雪', football: '足球', baseball: '棒球', 'motor racing': '赛车', 'sled racing': '雪橇赛',
  surfing: '冲浪', wrestling: '摔跤', 'martial arts': '武术', cricket: '板球', racket: '球拍运动', ball: '球类', motor: '赛车', martial: '武术',
  horse: '马术', racing: '竞速',
  stratovolcano: '层状火山', shield: '盾状火山', island: '岛屿火山', supervolcano: '超级火山', caldera: '破火山口', 'lava lake': '熔岩湖',
  'cinder cone': '火山渣锥',
  explorer: '探险家', trade: '贸易航线', navigator: '航海家', science: '科学考察', monk: '僧人', aviator: '飞行家',
  thinker: '思想家', inventor: '发明家', mathematician: '数学家', doctor: '医生', scientist: '科学家', poet: '诗人', artist: '艺术家',
  writer: '作家', musician: '音乐家', healer: '医者', leader: '领袖', astronaut: '宇航员', athlete: '运动员', environmentalist: '环保人士',
};

export function subName(sub: string, l: Lang): string {
  if (l === 'zh') return SUB_ZH[sub] ?? sub;
  const s = sub.replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
