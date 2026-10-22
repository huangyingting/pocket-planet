import { describe, expect, it } from 'vitest';
import { ASTRO_LESSONS, ASTRO_STRANDS, ASTRO_VIEWS, astroCourse, type AstroView } from '../../src/client/lessons/astro/data.ts';
import { KITS } from '../../src/client/lessons/astro/kits.ts';
import { LESSONS, lessonById, nextLesson, subjectOf } from '../../src/client/lessons/data.ts';
import { renderFig, type Fig } from '../../src/client/lessons/figs.ts';
import type { AstroScene, Pair } from '../../src/client/lessons/kit.ts';
import { checkQuiz, checkScene, okPair } from './lesson-check.ts';

describe('astronomy lessons data', () => {
  it('has the whole course, junior and senior lessons with their own ids', () => {
    const ids = ASTRO_LESSONS.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(id => id.startsWith('a-'))).toBe(true);
    expect(LESSONS.some(l => l.id.startsWith('a-'))).toBe(false);
    expect(ASTRO_LESSONS.filter(l => l.level === 'jr').length).toBeGreaterThanOrEqual(12);
    expect(ASTRO_LESSONS.filter(l => l.level === 'sr').length).toBeGreaterThanOrEqual(14);
    for (const l of ASTRO_LESSONS) {
      expect(l.strand in ASTRO_STRANDS, l.id).toBe(true);
      expect(lessonById(l.id), l.id).toBe(l);
      expect(subjectOf(l.id)).toBe('astro');
    }
  });

  it('gives every curriculum a course, and "next" stays in it', () => {
    for (const v of Object.keys(ASTRO_VIEWS) as AstroView[]) {
      const flat = astroCourse(v).flatMap(g => g.lessons);
      expect(flat.length, v).toBeGreaterThanOrEqual(v === 'all' ? ASTRO_LESSONS.length : 5);
      expect(nextLesson(flat[0].id, v)?.id, v).toBe(flat[1].id);
      expect(nextLesson(flat[flat.length - 1].id, v), v).toBeUndefined();
    }
    expect(astroCourse('cnj').flatMap(g => g.lessons).every(l => l.level === 'jr')).toBe(true);
    expect(astroCourse('cns').flatMap(g => g.lessons).every(l => l.level === 'sr')).toBe(true);
  });

  it('is fully bilingual, runs only known kits and has answerable quizzes', () => {
    for (const l of ASTRO_LESSONS) {
      const at = l.id;
      for (const p of [l.title, l.blurb, l.unit, ...l.keys]) expect(okPair(p), `${at} ${p[0]}`).toBe(true);
      expect(l.keys.length, at).toBeGreaterThanOrEqual(3);
      expect(l.steps.length, at).toBeGreaterThanOrEqual(3);
      expect(l.quiz.length, at).toBeGreaterThanOrEqual(3);
      const scenes: AstroScene[] = [];
      for (const s of l.steps) {
        expect(okPair(s.title) && okPair(s.body), `${at}: ${s.title[0]}`).toBe(true);
        if (s.astro) scenes.push(s.astro);
        else expect(s.cam?.length, `${at} globe step`).toBe(3);
      }
      for (const q of l.quiz) {
        expect(okPair(q.q) && okPair(q.why), `${at} quiz ${q.q[0]}`).toBe(true);
        if (q.astro) scenes.push(q.astro);
        checkQuiz(q, at);
      }
      for (const sc of scenes) {
        expect(sc.kit in KITS, `${at} kit ${sc.kit}`).toBe(true);
        checkScene(sc, at);
      }
    }
  });

  it('draws every figure', () => {
    const figs = ASTRO_LESSONS.flatMap(l => [...l.steps.map(s => s.fig), ...l.quiz.map(q => q.fig)]).filter((f): f is Fig => !!f);
    expect(figs.length).toBeGreaterThanOrEqual(6);
    for (const f of figs) for (const L of [(p: Pair) => p[0], (p: Pair) => p[1]]) {
      const out = renderFig(f, L);
      expect(out.length, f.k).toBeGreaterThan(40);
      expect(out, f.k).not.toMatch(/NaN|undefined|Infinity/);
    }
  });
});
