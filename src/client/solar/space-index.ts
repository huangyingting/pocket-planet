/** Search entries for everything beyond the globe (loaded only when the search box opens). */
import { BODIES } from '../../shared/data/solar.ts';
import { SOLAR_FEATURES } from '../../shared/data/solar-features.ts';
import { SOLAR_SITES } from '../../shared/data/solar-sites.ts';
import { DEEP_OBJECTS, SCALE_INFO, type ScaleId } from '../../shared/data/cosmos.ts';
import type { I18n } from '../../shared/data/types.ts';

export interface SpaceHit { name: I18n; emoji: string; /** i18n key of the kind label */ kind: string; hash: string }

const HASH: Record<ScaleId, string> = { universe: 'universe', laniakea: 'laniakea', group: 'localgroup', galaxy: 'milkyway', solar: 'solar' };

export function spaceIndex(): SpaceHit[] {
  return [
    ...(Object.values(SCALE_INFO)).map(i => ({ name: i.name, emoji: i.emoji, kind: 'scaleIs', hash: HASH[i.id] })),
    ...BODIES.map(b => ({ name: b.name, emoji: b.emoji, kind: 'bk_' + b.kind, hash: 'solar/' + b.id })),
    ...SOLAR_SITES.map(s => ({ name: s.name, emoji: s.emoji, kind: 'sk_' + s.kind, hash: 'solar/' + s.key })),
    ...SOLAR_FEATURES.map(f => ({ name: f.name, emoji: f.emoji, kind: 'fk_' + f.kind, hash: 'solar/' + f.key })),
    ...DEEP_OBJECTS.map(o => ({ name: o.name, emoji: o.emoji, kind: 'dk_' + o.kind, hash: HASH[o.scale] + '/' + o.key })),
  ];
}
