/** Ranked search across the globe catalogue and (once loaded) everything in space. */
import { CATALOGUE } from '../../shared/data/catalogue.ts';
import { SUB_ZH } from '../../shared/data/subs.ts';
import { ALIASES } from '../../shared/data/aliases.ts';
import { norm, scoreTerms } from '../../shared/lib/search.ts';
import type { CatalogueItem, Lang } from '../../shared/data/types.ts';
import type { SpaceHit } from '../solar/space-index.ts';
import { countryName } from './i18n.ts';

export type SearchHit =
  | { kind: 'item'; item: CatalogueItem; score: number }
  | { kind: 'space'; hit: SpaceHit; score: number };

export type SearchFilter = 'all' | 'space' | CatalogueItem['type'];

export function searchAll(query: string, l: Lang, space: SpaceHit[] | null, filter: SearchFilter = 'all'): SearchHit[] {
  const q = norm(query);
  const out: SearchHit[] = [];
  if (filter !== 'space') {
    for (const item of CATALOGUE) {
      if (filter !== 'all' && item.type !== filter) continue;
      const score = q ? scoreTerms(q, {
        names: [item.name.en, item.name.zh ?? ''],
        aliases: ALIASES[item.key],
        other: [countryName(item.country, l), countryName(item.country, 'en'), item.sub, SUB_ZH[item.sub] ?? ''],
      }) : 1;
      if (score > 0) out.push({ kind: 'item', item, score });
    }
  }
  if (space && (filter === 'space' || (filter === 'all' && q))) {
    for (const hit of space) {
      const score = q ? scoreTerms(q, { names: [hit.name.en, hit.name.zh ?? ''], aliases: ALIASES[hit.key] }) : 1;
      if (score > 0) out.push({ kind: 'space', hit, score });
    }
  }
  // Stable: equal scores keep catalogue order, globe before space.
  return q ? out.sort((a, b) => b.score - a.score) : out;
}
