/** The geography lessons, in course order, and the curricula they belong to. */
import { EARTH_A } from './l-earth.ts';
import { EARTH_B } from './l-earth2.ts';
import { LAND } from './l-land.ts';
import { REGIONS_L } from './l-regions.ts';
import { CHINA } from './l-china.ts';
import { MAPS } from './l-maps.ts';
import { PHYSICAL } from './l-physical.ts';
import { CLIMATE_L } from './l-climate.ts';
import { HUMAN } from './l-human.ts';
import { WORLD } from './l-world.ts';
import { CHINA_B } from './l-china2.ts';
import { ASTRO_LESSONS, ASTRO_VIEWS, astroCourse, type AstroView } from './astro/data.ts';
import type { Grade, Lesson, Pair, Strand, Track } from './kit.ts';

export type { Grade, Lesson, Quiz, Step, Strand, Track } from './kit.ts';

const ALL: Lesson[] = [...EARTH_A, ...EARTH_B, ...MAPS, ...LAND, ...PHYSICAL, ...CLIMATE_L, ...HUMAN, ...REGIONS_L, ...WORLD, ...CHINA, ...CHINA_B];
const STRAND_ORDER: Strand[] = ['maps', 'physical', 'climate', 'human', 'world', 'china'];
/** Grouped by theme (stable within a theme), so "next lesson" follows the course. */
export const LESSONS: Lesson[] = STRAND_ORDER.flatMap(s => ALL.filter(l => l.strand === s));

export const GRADES: Record<Grade, Pair> = {
  g7a: ['Grade 7 · Term 1', '七年级上册'],
  g7b: ['Grade 7 · Term 2', '七年级下册'],
  g8a: ['Grade 8 · Term 1', '八年级上册'],
  g8b: ['Grade 8 · Term 2', '八年级下册'],
};
export const STRANDS: Record<Strand, Pair> = {
  maps: ['The Earth, maps and time', '地球、地图与时间'],
  physical: ['Landforms, rocks and water', '地貌、岩石与水'],
  climate: ['Weather, climate and biomes', '天气、气候与生物群落'],
  human: ['People, cities and the economy', '人口、城市与经济'],
  world: ['Regions and countries', '世界的地区和国家'],
  china: ['China', '中国地理'],
};
export type View = 'all' | 'cn' | Track;
/** The course picker: one entry per curriculum, with what that curriculum asks for. */
export const VIEWS: Record<View, { name: Pair; note: Pair }> = {
  all: { name: ['All topics', '全部主题'], note: ['Every lesson, grouped by theme.', '所有课程，按主题分组。'] },
  cn: { name: ['China · PEP grades 7–8', '中国 · 人教版初中地理'], note: ['The four volumes of the Chinese middle-school textbook, in order.', '按人教版初中地理七上、七下、八上、八下四册的顺序。'] },
  uk: { name: ['England · Key Stage 3', '英国 · 英格兰 KS3'], note: ['National Curriculum: locational and place knowledge (Africa, Russia, Asia with China and India, the Middle East), physical and human geography, map skills.', '英格兰国家课程：区位和地方知识（非洲、俄罗斯、亚洲中的中国和印度、中东），自然与人文地理，地图技能。'] },
  us: { name: ['USA · grades 6–8', '美国 · 6–8 年级'], note: ['National Geography Standards and C3: the world in spatial terms, places and regions, physical systems, human systems, environment and society.', '美国国家地理标准与 C3 框架：空间视角、地方与区域、自然系统、人文系统、环境与社会。'] },
  ib: { name: ['IB MYP · Cambridge', 'IB 中学项目 · 剑桥国际'], note: ['Concept-based courses for international schools: systems, global interactions, sustainability and development.', '国际学校的概念式课程：系统、全球互动、可持续发展与发展。'] },
  au: { name: ['Australia · years 7–8', '澳大利亚 · 7–8 年级'], note: ['Australian Curriculum: water in the world, place and liveability, landforms and landscapes, changing nations.', '澳大利亚国家课程：世界的水、地方与宜居性、地貌与景观、变化中的国家。'] },
};

/** A lesson of either subject. */
export const lessonById = (id: string): Lesson | undefined => LESSONS.find(l => l.id === id) ?? ASTRO_LESSONS.find(l => l.id === id);

export type Subject = 'geo' | 'astro';
/** Astronomy lesson ids start with `a-`. */
export const subjectOf = (id: string): Subject => (id.startsWith('a-') ? 'astro' : 'geo');
/** A subject's course picker: its curricula, their lessons in groups, where the choice is saved and the default. */
export interface Catalog { views: Record<string, { name: Pair; note: Pair }>; course(v: string): { name: Pair; lessons: Lesson[] }[]; key: string; def(zh: boolean): string }
export const CATALOGS: Record<Subject, Catalog> = {
  geo: { views: VIEWS, course: v => course(v as View), key: 'lessonTrack', def: zh => (zh ? 'cn' : 'all') },
  astro: { views: ASTRO_VIEWS, course: v => astroCourse(v as AstroView), key: 'astroTrack', def: zh => (zh ? 'cnj' : 'all') },
};

/** A curriculum's lessons, in groups: textbook volumes for China, themes for the others. */
export function course(view: View): { name: Pair; lessons: Lesson[] }[] {
  if (view === 'cn') {
    return (Object.keys(GRADES) as Grade[]).map(g => ({ name: GRADES[g], lessons: CN_ORDER.filter(l => l.grade === g) }));
  }
  return STRAND_ORDER.map(s => ({ name: STRANDS[s], lessons: LESSONS.filter(l => l.strand === s && (view === 'all' || l.tracks.includes(view))) }))
    .filter(g => g.lessons.length > 0);
}
/** The Chinese course keeps the textbook's own order. */
const CN_ORDER: Lesson[] = ALL.filter(l => l.grade);

/** The lesson after `id` in a curriculum (of the lesson's own subject). */
export function nextLesson(id: string, view: string): Lesson | undefined {
  const flat = CATALOGS[subjectOf(id)].course(view).flatMap(g => g.lessons);
  const i = flat.findIndex(l => l.id === id);
  return i >= 0 ? flat[i + 1] : undefined;
}
