/** Shared checks for lesson data: every question type is answerable, every lab is usable. */
import { expect } from 'vitest';
import type { AstroScene, Home, Lesson, LL, Pair, Quiz, Step } from '../../src/client/lessons/kit.ts';

export const okPair = (p: Pair) => p.length === 2 && p[0].trim().length > 0 && p[1].trim().length > 0 && /[\u4e00-\u9fff]/.test(p[1]) && !/[\u4e00-\u9fff]/.test(p[0]);
/** numbers, symbols and letters read the same in both languages */
const okSame = (p: Pair) => p[0] === p[1] && p[0].trim().length > 0 && !/[\u4e00-\u9fff]/.test(p[0]);
export const okLL = ([la, lo]: LL) => la >= -90 && la <= 90 && lo >= -180 && lo <= 180;

/** Sample homes for lessons made from where the learner lives. */
export const HOMES: Home[] = [
  { ll: [39.9, 116.4], country: { a2: 'CN', name: ['China', '中国'] }, climate: 'tmonsoon2', biome: 'temperateforest' },
  { ll: [-33.9, 151.2], country: { a2: 'AU', name: ['Australia', '澳大利亚'] }, climate: 'smonsoon', biome: 'evergreen' },
  { ll: [64.1, -21.9], country: { a2: 'IS', name: ['Iceland', '冰岛'] }, climate: 'subarctic', biome: 'tundra' },
  { ll: [1.3, 103.8], country: { a2: 'SG', name: ['Singapore', '新加坡'] }, climate: 'rainforest', biome: 'rainforest' },
  { ll: [-10, -30] },
];
/** A lesson's steps and quiz, made for each sample home when it is built from one. */
export const versions = (l: Lesson): { steps: Step[]; quiz: Quiz[]; at: string }[] =>
  l.build ? HOMES.map(h => ({ ...l.build!(h), at: `${l.id}@${h.ll}` })) : [{ steps: l.steps, quiz: l.quiz, at: l.id }];

export function checkQuiz(q: Quiz, at: string): void {
  const opt = (o: Pair) => okPair(o) || okSame(o);
  const kinds = [q.options && !q.multi, q.multi, q.order, q.match, q.num, q.place, q.at, q.pick].filter(Boolean).length;
  expect(kinds, `${at} one question type: ${q.q[0]}`).toBe(1);
  if (q.options) {
    expect(q.options.length, at).toBeGreaterThanOrEqual(2);
    expect(q.options.every(opt), `${at} options`).toBe(true);
    if (q.multi) {
      expect(q.multi.length, at).toBeGreaterThanOrEqual(1);
      expect(new Set(q.multi).size === q.multi.length && q.multi.every(j => j >= 0 && j < q.options!.length), `${at} multi`).toBe(true);
      expect(q.multi.length, `${at} multi leaves a wrong option`).toBeLessThan(q.options.length);
    } else expect(q.answer! >= 0 && q.answer! < q.options.length, at).toBe(true);
  } else if (q.order) {
    expect(q.order.length, at).toBeGreaterThanOrEqual(3);
    expect(q.order.every(opt), `${at} order`).toBe(true);
    expect(new Set(q.order.map(p => p[0])).size, `${at} order unique`).toBe(q.order.length);
  } else if (q.match) {
    expect(q.match.length, at).toBeGreaterThanOrEqual(3);
    expect(q.match.every(([a, b]) => opt(a) && opt(b)), `${at} match`).toBe(true);
    expect(new Set(q.match.map(m => m[1][0])).size, `${at} match unique`).toBe(q.match.length);
  } else if (q.num) {
    expect(Number.isFinite(q.num.answer) && q.num.tol > 0, `${at} num`).toBe(true);
    if (q.num.unit) expect(opt(q.num.unit), `${at} unit`).toBe(true);
  } else if (q.place) {
    expect(q.place.length, at).toBeGreaterThanOrEqual(2);
    expect(q.place.every(p => okLL(p.at) && okPair(p.text) && (p.tolKm ?? 500) > 0), `${at} place`).toBe(true);
  } else if (q.pick) expect(q.astro, `${at} pick needs a scene`).toBeTruthy();
  else expect(q.at && okLL(q.at) && (q.tolKm ?? 0) > 0, `${at} locate`).toBe(true);
}

export function checkStep(s: Step, at: string): void {
  expect(okPair(s.title) && okPair(s.body), `${at}: ${s.title[0]}`).toBe(true);
  if (s.task) expect(okPair(s.task), `${at} task`).toBe(true);
  if (s.astro) checkScene(s.astro, at);
}

export function checkScene(sc: AstroScene, at: string): void {
  if (sc.clock) expect(sc.clock.to !== sc.clock.from && Number.isFinite(sc.clock.rate), `${at} clock`).toBe(true);
  const ids = new Set<string>();
  for (const p of sc.params ?? []) {
    expect(okPair(p.name), `${at} param ${p.id}`).toBe(true);
    expect(p.min < p.max && p.value >= p.min && p.value <= p.max, `${at} param ${p.id} range`).toBe(true);
    if (p.fmt) expect(p.fmt.every(f => f.includes('{v}')), `${at} param ${p.id} fmt`).toBe(true);
    ids.add(p.id);
  }
  expect(ids.size, `${at} param ids`).toBe(sc.params?.length ?? 0);
  for (const tk of sc.tasks ?? []) {
    expect(okPair(tk.text), `${at} task`).toBe(true);
    // a task isn't done before the learner does anything
    expect(tk.done(Object.fromEntries((sc.params ?? []).map(p => [p.id, p.value])), sc.clock?.from ?? 0), `${at} task already done: ${tk.text[0]}`).toBe(false);
  }
}
