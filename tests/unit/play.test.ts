import { describe, it, expect } from 'vitest';
import { CATALOGUE, BY_KEY } from '../../src/shared/data/catalogue.ts';
import { PASSPORTS, bookProgress, bookDone } from '../../src/shared/data/passports.ts';
import { STOPS, visibleAt, appearingAt } from '../../src/shared/lib/timeline.ts';
import { GREETINGS } from '../../src/shared/data/greetings.ts';
import { newlyEarned } from '../../src/shared/lib/stickers.ts';
import { emptyProgress } from '../../src/shared/lib/progress.ts';
import type { CatalogueItem } from '../../src/shared/data/types.ts';

const item = (o: Partial<CatalogueItem>): CatalogueItem => ({ ...CATALOGUE[0], facts: {}, ...o }) as CatalogueItem;

describe('passport books', () => {
  it('are non-empty, unique and reference real catalogue keys', () => {
    expect(new Set(PASSPORTS.map(b => b.id)).size).toBe(PASSPORTS.length);
    for (const b of PASSPORTS) {
      expect(b.keys.length).toBeGreaterThan(0);
      for (const k of b.keys) expect(BY_KEY.has(k), `${b.id}:${k}`).toBe(true);
    }
    expect(PASSPORTS.find(b => b.id === 'wonders')!.keys).toHaveLength(8);
  });
  it('counts stamps and completion', () => {
    const b = PASSPORTS[0];
    const seen = Object.fromEntries(b.keys.slice(1).map(k => [k, 1]));
    expect(bookProgress(b, seen)).toBe(b.keys.length - 1);
    expect(bookDone(b, seen)).toBe(false);
    seen[b.keys[0]] = 1;
    expect(bookDone(b, seen)).toBe(true);
  });
  it('awards passport stickers', () => {
    const p = emptyProgress();
    for (const k of PASSPORTS[0].keys) p.seen[k] = 1;
    for (const it of CATALOGUE.slice(0, 10)) p.seen[it.key] = 1;
    const got = newlyEarned(p, { animals: 999, discoveries: 999 });
    expect(got).toContain('passport_10');
    expect(got).toContain('book_done');
  });
});

describe('time machine', () => {
  it('shows dinosaurs only in the dino era and hides future buildings', () => {
    const dino = item({ type: 'dino', facts: { mya: 66 } });
    const old = item({ type: 'landmark', facts: { built: -2560 } });
    const modern = item({ type: 'landmark', facts: { built: 1889 } });
    const timeless = item({ type: 'animal', facts: {} });
    expect(visibleAt(dino, 'dino')).toBe(true);
    expect(visibleAt(dino, 1000)).toBe(false);
    expect(visibleAt(old, 'dino')).toBe(false);
    expect(visibleAt(old, -500)).toBe(true);
    expect(visibleAt(modern, 1800)).toBe(false);
    expect(visibleAt(modern, 1900)).toBe(true);
    expect(visibleAt(timeless, 1)).toBe(true);
    for (const x of [dino, old, modern, timeless]) expect(visibleAt(x, 'now')).toBe(true);
  });
  it('lists each dated item at exactly one stop', () => {
    const dated = CATALOGUE.filter(i => i.facts?.mya === undefined && (i.facts?.built ?? i.facts?.year) !== undefined && (i.facts?.built ?? i.facts?.year)! <= 2000);
    const listed = STOPS.flatMap((_, i) => (STOPS[i] === 'dino' ? [] : appearingAt(CATALOGUE, i)));
    expect(listed.length).toBe(dated.length);
    expect(new Set(listed.map(i => i.key)).size).toBe(listed.length);
  });
});

describe('greetings', () => {
  it('have text, language and pronunciation for most catalogue countries', () => {
    for (const [c, g] of Object.entries(GREETINGS)) {
      expect(c).toMatch(/^[A-Z]{2}$/);
      expect(g[0] && g[1] && g[2], c).toBeTruthy();
    }
    const countries = [...new Set(CATALOGUE.map(i => i.country).filter(Boolean))] as string[];
    const covered = countries.filter(c => c in GREETINGS).length;
    expect(covered / countries.length).toBeGreaterThan(0.9);
  });
});
