import { describe, it, expect } from 'vitest';
import { tonight, activeOn } from '../../src/shared/lib/astro/tonight.ts';

const BEIJING = { lat: 39.9, lon: 116.4 };
describe('tonight from a city', () => {
  it('finds the night and the darkness, and knows when it never gets dark', () => {
    const r = tonight(BEIJING, Date.parse('2026-12-13T12:00:00Z'));
    expect(r.dark![0]).toBeGreaterThan(r.night![0]);
    expect(r.dark![1]).toBeLessThan(r.night![1]);
    const ice = tonight({ lat: 64.15, lon: -21.94 }, Date.parse('2026-06-21T12:00:00Z'));
    expect(ice.dark).toBeNull();
    expect(tonight({ lat: 78.2, lon: 15.6 }, Date.parse('2026-06-21T12:00:00Z')).polar).toBe('day');
  });
  it('keeps a peak apart from whether this place can see it', () => {
    const r = tonight(BEIJING, Date.parse('2026-08-11T12:00:00Z'));
    const per = r.showers.find(s => s.key === 'perseids')!;
    expect(per.daysToPeak).toBeGreaterThan(1);
    expect(per.radiantAlt).toBeGreaterThan(40);
    // the 28 Aug 2026 lunar eclipse happens in Beijing's daytime: the Moon is below the horizon there
    expect(r.events.find(e => e.ev.kind === 'lunar-eclipse')?.here).toBe('below');
    expect(r.events.find(e => e.ev.kind === 'solar-eclipse')?.here).toBe('none');
  });
  it('handles activity windows that wrap the new year', () => {
    expect(activeOn('Dec 28', 'Jan 12', Date.parse('2027-01-03T00:00:00Z'))).toBe(true);
    expect(activeOn('Dec 28', 'Jan 12', Date.parse('2027-02-03T00:00:00Z'))).toBe(false);
    expect(activeOn('Jul 17', 'Aug 24', Date.parse('2026-08-12T00:00:00Z'))).toBe(true);
  });
});
