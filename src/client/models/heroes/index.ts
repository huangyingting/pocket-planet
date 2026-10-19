import type { Builder } from '../prims.ts';
import { EUROPE } from './europe.ts';
import { SACRED } from './sacred.ts';
import { ASIA } from './asia.ts';
import { AMERICAS } from './americas.ts';
import { EUROPE2 } from './europe2.ts';
import { ASIA2 } from './asia2.ts';
import { WORLD2 } from './world2.ts';
import { CLASSICS } from './classics.ts';
import { EUROPE3 } from './europe3.ts';
import { ASIA3 } from './asia3.ts';
import { WORLD3 } from './world3.ts';
import { PEAKS } from './peaks.ts';
import { WATERS } from './waters.ts';
import { ICONS2 } from './icons2.ts';
import { H_DINOS } from './dinos.ts';
import { H_FOODS } from './foods.ts';
import { H_FESTIVALS } from './festivals.ts';
import { H_SPACE } from './space.ts';
import { H_PLANTS } from './plants.ts';
import { H_SPORTS } from './sports.ts';
import { H_VOLCANOES } from './volcanoes.ts';
import { H_JOURNEYS } from './journeys.ts';
import { H_CHINA } from './china.ts';
import { H_COUNTRIES_A } from './countries-a.ts';
import { H_COUNTRIES_B } from './countries-b.ts';
import { H_DEEPSEA } from './deepsea.ts';

/** Per-landmark detailed builders, selected by `recipe.hero`; falls back to the generic kind builder. */
export const HEROES: Record<string, Builder> = { ...EUROPE, ...SACRED, ...ASIA, ...AMERICAS, ...EUROPE2, ...ASIA2, ...WORLD2, ...CLASSICS,
  ...EUROPE3, ...ASIA3, ...WORLD3, ...PEAKS, ...WATERS, ...ICONS2,
  ...H_DINOS, ...H_FOODS, ...H_FESTIVALS, ...H_SPACE, ...H_PLANTS, ...H_SPORTS, ...H_VOLCANOES, ...H_JOURNEYS, ...H_CHINA, ...H_COUNTRIES_A, ...H_COUNTRIES_B, ...H_DEEPSEA };
