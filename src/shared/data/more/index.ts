import type { CatalogueItem } from '../types.ts';
import { DINOS } from './dinos.ts';
import { FOODS } from './foods.ts';
import { FESTIVALS } from './festivals.ts';
import { SPACE } from './space.ts';
import { PLANTS } from './plants.ts';
import { SPORTS } from './sports.ts';
import { VOLCANOES } from './volcanoes.ts';
import { MIGRATIONS } from './migrations.ts';
import { VOYAGES } from './voyages.ts';
import { CHINA } from './china.ts';
import { COUNTRIES_A } from './countries-a.ts';
import { COUNTRIES_B } from './countries-b.ts';
import { DEEPSEA } from './deepsea.ts';
import { ANIMALS2 } from './animals2.ts';
import { COUNTRIES_C } from './countries-c.ts';
import { ARCHAEOLOGY } from './archaeology.ts';
import { PEOPLE_A } from './people-a.ts';
import { PEOPLE_B } from './people-b.ts';
import { PEOPLE_C } from './people-c.ts';

/**
 * Content packs. A pack is a data file in this folder (built with `many()` from make.ts) plus, usually, a hero
 * model file of the same name in src/client/models/heroes/ referenced as `hero: '<pack>/<name>'`.
 * Items may be of any type; the catalogue sorts them into their type lists. To add a pack, add one line here.
 */
export const CONTENT_PACKS: Record<string, CatalogueItem[]> = {
  dinos: DINOS, foods: FOODS, festivals: FESTIVALS, space: SPACE, plants: PLANTS, sports: SPORTS, volcanoes: VOLCANOES,
  migrations: MIGRATIONS, voyages: VOYAGES, china: CHINA, 'countries-a': COUNTRIES_A, 'countries-b': COUNTRIES_B, deepsea: DEEPSEA,
  animals2: ANIMALS2, 'countries-c': COUNTRIES_C, archaeology: ARCHAEOLOGY,
  'people-a': PEOPLE_A, 'people-b': PEOPLE_B, 'people-c': PEOPLE_C,
};
