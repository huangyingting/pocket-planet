import type { Builder } from '../prims.ts';
import { EUROPE } from './europe.ts';
import { SACRED } from './sacred.ts';
import { ASIA } from './asia.ts';
import { AMERICAS } from './americas.ts';
import { EUROPE2 } from './europe2.ts';
import { ASIA2 } from './asia2.ts';
import { WORLD2 } from './world2.ts';
import { CLASSICS } from './classics.ts';

/** Per-landmark detailed builders, selected by `recipe.hero`; falls back to the generic kind builder. */
export const HEROES: Record<string, Builder> = { ...EUROPE, ...SACRED, ...ASIA, ...AMERICAS, ...EUROPE2, ...ASIA2, ...WORLD2, ...CLASSICS };
