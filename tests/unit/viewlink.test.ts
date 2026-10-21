import { describe, it, expect } from 'vitest';
import { parseView, encodeView } from '../../src/client/lib/viewlink.ts';

describe('view links', () => {
  it('round-trips a globe camera on an item route', () => {
    const v = { route: 'eiffel', cam: { lat: 48.86, lon: 2.35, h: 0.8 } };
    expect(parseView(encodeView(v))).toEqual({ ...v, bad: false });
  });

  it('keeps plain routes untouched', () => {
    expect(parseView('solar/mars')).toEqual({ route: 'solar/mars', bad: false });
    expect(encodeView({ route: 'sky/solar-eclipse-2026-08-12' })).toBe('sky/solar-eclipse-2026-08-12');
  });

  it('falls back to the route for unknown versions or broken numbers', () => {
    for (const tail of ['v9:1,2,3', 'v1:abc,2,3', 'v1:95,2,1', 'v1:10,20,0', 'v1:10,20', 'garbage', 'v1:1e5,2,3'])
      expect(parseView('eiffel@' + tail)).toEqual({ route: 'eiffel', bad: true });
  });

  it('clamps and wraps the camera', () => {
    expect(parseView('@v1:89,190,99').cam).toEqual({ lat: 85, lon: -170, h: 20 });
  });
});
