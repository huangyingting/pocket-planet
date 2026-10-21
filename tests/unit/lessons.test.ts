import { describe, expect, it } from 'vitest';
import { LESSONS, GRADES, lessonById } from '../../src/client/lessons/data.ts';
import { oceanAt, tempAt } from '../../src/client/lessons/stage.ts';
import { subsolar } from '../../src/shared/lib/sun.ts';
import { BY_KEY } from '../../src/shared/data/catalogue.ts';
import type { LL, Pair } from '../../src/client/lessons/kit.ts';

const okLL = ([la, lo]: LL) => la >= -90 && la <= 90 && lo >= -180 && lo <= 180;
const okPair = (p: Pair) => p.length === 2 && p[0].trim().length > 0 && p[1].trim().length > 0 && /[\u4e00-\u9fff]/.test(p[1]) && !/[\u4e00-\u9fff]/.test(p[0]);

describe('geography lessons data', () => {
  it('has unique ids in every grade and finds them by id', () => {
    const ids = LESSONS.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of Object.keys(GRADES)) expect(LESSONS.some(l => l.grade === g)).toBe(true);
    expect(lessonById('steps')?.grade).toBe('g8a');
  });

  it('is fully bilingual, with valid places, models and answers', () => {
    for (const l of LESSONS) {
      const at = `${l.id}`;
      for (const p of [l.title, l.blurb, l.unit]) expect(okPair(p), at).toBe(true);
      expect(l.steps.length, at).toBeGreaterThanOrEqual(3);
      expect(l.quiz.length, at).toBeGreaterThanOrEqual(3);
      for (const s of l.steps) {
        expect(okPair(s.title) && okPair(s.body), `${at}: ${s.title[0]}`).toBe(true);
        expect(okLL([s.cam[0], s.cam[1]]) && s.cam[2] > 1, `${at} cam`).toBe(true);
        for (const k of s.items ?? []) expect(BY_KEY.has(k), `${at} item ${k}`).toBe(true);
        for (const m of s.marks ?? []) { expect(okLL(m.ll), `${at} mark`).toBe(true); if (m.text) expect(okPair(m.text), `${at} mark ${m.text[0]}`).toBe(true); }
        for (const ln of s.lines ?? []) { expect(ln.pts.length, at).toBeGreaterThanOrEqual(2); expect(ln.pts.every(okLL), `${at} line`).toBe(true); }
        for (const p of s.paint ?? []) if (p.fill.k === 'poly') expect(p.fill.pts.every(okLL), `${at} poly`).toBe(true);
      }
      for (const q of l.quiz) {
        expect(okPair(q.q) && okPair(q.why), `${at} quiz ${q.q[0]}`).toBe(true);
        if (q.options) {
          expect(q.options.every(okPair), at).toBe(true);
          expect(q.answer! >= 0 && q.answer! < q.options.length, at).toBe(true);
        } else {
          expect(q.at && okLL(q.at) && (q.tolKm ?? 0) > 0, `${at} locate`).toBe(true);
        }
      }
    }
  });
});

describe('lesson geometry', () => {
  it('puts the overhead Sun on the tropics at the solstices and on the equator at the equinoxes', () => {
    expect(subsolar(Date.UTC(2025, 5, 21, 3))[0]).toBeCloseTo(23.44, 0);
    expect(subsolar(Date.UTC(2025, 11, 21, 15))[0]).toBeCloseTo(-23.44, 0);
    expect(Math.abs(subsolar(Date.UTC(2025, 2, 20, 9))[0])).toBeLessThan(0.5);
    // 04:00 UTC: noon over 120°E (Beijing time), give or take the equation of time
    expect(Math.abs(subsolar(Date.UTC(2025, 2, 20, 4))[1] - 120)).toBeLessThan(3);
  });

  it('names the four oceans like the textbook does', () => {
    expect(oceanAt(0, -150)).toBe('pacific');
    expect(oceanAt(10, 150)).toBe('pacific');
    expect(oceanAt(0, -30)).toBe('atlantic');
    expect(oceanAt(-20, 80)).toBe('indian');
    expect(oceanAt(80, 0)).toBe('arctic');
    expect(oceanAt(20, 38)).toBe('indian');
    expect(oceanAt(35, 18)).toBe('atlantic');
  });

  it('makes an illustrative temperature map that follows the seasons', () => {
    expect(tempAt(0, 20, true, 0)).toBeGreaterThan(tempAt(60, 20, true, 0));
    // northern land: hot in July, very cold in January, more extreme than the sea
    expect(tempAt(55, 100, true, 23) - tempAt(55, 100, true, -23)).toBeGreaterThan(tempAt(55, -30, false, 23) - tempAt(55, -30, false, -23));
  });
});
