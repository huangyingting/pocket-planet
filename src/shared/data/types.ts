import type { Continent } from './iso.ts';

export type Lang = 'en' | 'zh';
export const LANGS: Lang[] = ['en', 'zh'];
export type I18n = { en: string } & Partial<Record<Exclude<Lang, 'en'>, string>>;

export type ItemType = 'landmark' | 'animal' | 'discovery' | 'vehicle';

export interface ModelRecipe {
  kind: string;
  color?: string;
  accent?: string;
  [k: string]: unknown;
}

export interface Facts {
  built?: number;
  heightM?: number;
  lengthM?: number;
  weightKg?: number;
  speedKmh?: number;
  lifespanY?: number;
  depthM?: number;
  year?: number;
}

export interface Route {
  kind: 'ship' | 'plane' | 'train';
  pts: [number, number][];
  mode: 'loop' | 'pingpong';
  /** degrees of arc per second at ×1 */
  speed: number;
}

export interface CatalogueItem {
  key: string;
  slug: string;
  type: ItemType;
  name: I18n;
  country?: string;
  continent: Continent | 'ocean';
  lat: number;
  lon: number;
  tier: 1 | 2 | 3;
  emoji: string;
  model: ModelRecipe;
  desc: I18n;
  sub: string;
  facts?: Facts;
  diet?: 'carnivore' | 'herbivore' | 'omnivore';
  status?: 'LC' | 'NT' | 'VU' | 'EN' | 'CR';
  habitat?: I18n;
  funFact?: I18n;
  route?: Route;
  /** extra km of allowance for very large sites in the location game */
  area?: number;
}

export function tr(s: I18n | undefined, lang: Lang): string {
  if (!s) return '';
  return s[lang] ?? s.en;
}
