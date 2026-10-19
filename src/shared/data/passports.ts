import type { CatalogueItem, I18n, ItemType } from './types.ts';
import { CATALOGUE } from './catalogue.ts';
import { TYPE_META } from './typemeta.ts';

/** A passport book: a themed set of places that get stamped when their info card is opened. */
export interface PassportBook { id: string; emoji: string; name: I18n; keys: string[] }

const WONDERS = ['greatwall', 'petra', 'redeemer', 'machupicchu', 'chichenitza', 'colosseum', 'taj', 'pyramids'];

const book = (id: string, emoji: string, name: I18n, test: (it: CatalogueItem) => boolean): PassportBook =>
  ({ id, emoji, name, keys: CATALOGUE.filter(test).map(i => i.key) });
const landmarksIn = (...cs: CatalogueItem['continent'][]) => (it: CatalogueItem) => it.type === 'landmark' && cs.includes(it.continent);
const ofType = (ty: ItemType) => book(ty, TYPE_META[ty].emoji, TYPE_META[ty].many, it => it.type === ty);

export const PASSPORTS: PassportBook[] = [
  book('wonders', '🌟', { en: 'Wonders of the World', zh: '世界奇迹' }, it => WONDERS.includes(it.key)),
  book('china', '🇨🇳', { en: 'Discover China', zh: '发现中国' }, it => it.country === 'CN' || it.country === 'TW'),
  book('asia', '🏯', { en: 'Asia', zh: '亚洲' }, landmarksIn('asia')),
  book('europe', '🏰', { en: 'Europe', zh: '欧洲' }, landmarksIn('europe')),
  book('africa', '🌍', { en: 'Africa', zh: '非洲' }, landmarksIn('africa')),
  book('americas', '🗽', { en: 'The Americas', zh: '美洲' }, landmarksIn('north-america', 'south-america')),
  book('oceania', '🦘', { en: 'Oceania & poles', zh: '大洋洲与极地' }, landmarksIn('oceania', 'antarctica', 'ocean')),
  book('animal', '🦁', { en: 'Animal safari', zh: '动物探险' }, it => it.type === 'animal'),
  ...(['dino', 'food', 'festival', 'space', 'plant', 'sport', 'volcano', 'migration', 'voyage'] as const).map(ofType),
].filter(b => b.keys.length > 0);

export const bookProgress = (b: PassportBook, seen: Record<string, number>) => b.keys.filter(k => k in seen).length;
export const bookDone = (b: PassportBook, seen: Record<string, number>) => bookProgress(b, seen) === b.keys.length;
