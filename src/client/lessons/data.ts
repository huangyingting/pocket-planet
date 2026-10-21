/** The geography lessons, in textbook order. */
import { EARTH_A } from './l-earth.ts';
import { EARTH_B } from './l-earth2.ts';
import { LAND } from './l-land.ts';
import { REGIONS_L } from './l-regions.ts';
import { CHINA } from './l-china.ts';
import type { Grade, Lesson, Pair } from './kit.ts';

export type { Grade, Lesson, Quiz, Step } from './kit.ts';

export const LESSONS: Lesson[] = [...EARTH_A, ...EARTH_B, ...LAND, ...REGIONS_L, ...CHINA];
export const GRADES: Record<Grade, Pair> = {
  g7a: ['Grade 7 · Term 1', '七年级上册'],
  g7b: ['Grade 7 · Term 2', '七年级下册'],
  g8a: ['Grade 8 · Term 1', '八年级上册'],
};
export const lessonById = (id: string): Lesson | undefined => LESSONS.find(l => l.id === id);
