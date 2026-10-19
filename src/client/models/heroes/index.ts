import type { Builder } from '../prims.ts';
import { EUROPE } from './europe.ts';
import { SACRED } from './sacred.ts';
import { ASIA } from './asia.ts';
import { AMERICAS } from './americas.ts';

/** Per-landmark detailed builders, selected by `recipe.hero`; falls back to the generic kind builder. */
export const HEROES: Record<string, Builder> = { ...EUROPE, ...SACRED, ...ASIA, ...AMERICAS };
