import type { Progress } from './progress.ts';
import type { I18n } from '../data/types.ts';

export interface StickerDef { id: string; emoji: string; name: I18n; test: (p: Progress, totals: { animals: number; discoveries: number }) => boolean }

const n = (o: Record<string, number>) => Object.keys(o).length;

export const STICKERS: StickerDef[] = [
  { id: 'first_animal', emoji: '🐾', name: { en: 'First find', ko: '첫 발견' }, test: p => n(p.dex) >= 1 },
  { id: 'animals_10', emoji: '🦁', name: { en: 'Safari scout', ko: '사파리 탐험가' }, test: p => n(p.dex) >= 10 },
  { id: 'animals_all', emoji: '🏆', name: { en: 'Animal expert', ko: '동물 박사' }, test: (p, t) => n(p.dex) >= t.animals },
  { id: 'first_log', emoji: '🔍', name: { en: 'Detective', ko: '탐정' }, test: p => n(p.logs) >= 1 },
  { id: 'logs_all', emoji: '🗺️', name: { en: 'Mystery master', ko: '미스터리 마스터' }, test: (p, t) => n(p.logs) >= t.discoveries },
  { id: 'placeit_play', emoji: '📍', name: { en: 'Pin dropper', ko: '핀 꽂기' }, test: p => Object.values(p.placeit).some(r => r.plays > 0) },
  { id: 'placeit_7000', emoji: '🎯', name: { en: 'Sharp eye', ko: '날카로운 눈' }, test: p => Object.values(p.placeit).some(r => r.best >= 7000) },
  { id: 'quiz_10', emoji: '🧠', name: { en: 'Quiz whiz', ko: '퀴즈 척척박사' }, test: p => p.quiz.correct >= 10 },
  { id: 'quiz_geo', emoji: '🧭', name: { en: 'Geography expert', ko: '지리 박사' }, test: p => (p.quiz.bySet.geo ?? 0) >= 20 },
  { id: 'daily_win', emoji: '📅', name: { en: 'Daily solver', ko: '오늘의 해결사' }, test: p => p.daily.won >= 1 },
  { id: 'daily_streak3', emoji: '🔥', name: { en: 'On a roll', ko: '연승 행진' }, test: p => p.daily.maxStreak >= 3 },
  { id: 'traveller', emoji: '🧳', name: { en: 'Globetrotter', ko: '세계 여행자' }, test: p => n(p.visited) >= 5 },
];

/** Returns ids of stickers newly earned; caller persists them. */
export function newlyEarned(p: Progress, totals: { animals: number; discoveries: number }, now = Date.now()): string[] {
  const out: string[] = [];
  for (const s of STICKERS) if (!(s.id in p.stickers) && s.test(p, totals)) { p.stickers[s.id] = now; out.push(s.id); }
  return out;
}
