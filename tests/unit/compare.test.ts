import { describe, it, expect } from 'vitest';
import { compareGroups, groupOf, ratio, drawn } from '../../src/client/lib/compare.ts';
import { BODY } from '../../src/shared/data/solar.ts';

describe('compare bench', () => {
  const g = Object.fromEntries(compareGroups().map(x => [x.id, x]));
  it('compares bodies by diameter, never radius', () => {
    const earth = g.bodies.things.find(t => t.id === 'earth')!;
    expect(earth.size).toBe(Math.round(BODY.earth.radiusKm * 2));
    expect(g.bodies.unit).toBe('km');
  });
  it('keeps each group to one measure and drops facts that measure something else', () => {
    const names = (id: string) => g[id].things.map(t => t.name.en);
    expect(names('long')).not.toContain('Quetzalcoatlus');
    expect(names('tall')).not.toContain('Mount Rushmore');
    expect(names('tall')).toContain('Burj Khalifa');
    expect(names('long')).toContain('Blue whale');
    for (const x of compareGroups()) expect(new Set(x.pair).size).toBe(2);
    expect(groupOf('earth')?.id).toBe('bodies');
    expect(groupOf('child')).toBeUndefined();
  });
  it('rounds ratios and flags sub-pixel sizes at true scale', () => {
    expect(ratio(12742, 3475)).toEqual({ big: 0, times: 3.7 });
    expect(ratio(1.3, 828)).toEqual({ big: 1, times: 637 });
    const d = drawn(1392684, 2377, 200, 'true');
    expect(d.tiny).toEqual([false, true]);
    expect(drawn(1392684, 2377, 200, 'zoom').px).toEqual([200, 200]);
  });
});
