import type { Progress } from './progress.ts';
import type { I18n } from '../data/types.ts';

export interface StickerDef { id: string; emoji: string; name: I18n; test: (p: Progress, totals: { animals: number; discoveries: number }) => boolean }

const n = (o: Record<string, number>) => Object.keys(o).length;

export const STICKERS: StickerDef[] = [
  { id: 'first_animal', emoji: '🐾', name: { en: 'First find', zh: '第一次发现' }, test: p => n(p.dex) >= 1 },
  { id: 'animals_10', emoji: '🦁', name: { en: 'Safari scout', zh: '草原侦察员' }, test: p => n(p.dex) >= 10 },
  { id: 'animals_all', emoji: '🏆', name: { en: 'Animal expert', zh: '动物专家' }, test: (p, t) => n(p.dex) >= t.animals },
  { id: 'first_log', emoji: '🔍', name: { en: 'Detective', zh: '小侦探' }, test: p => n(p.logs) >= 1 },
  { id: 'logs_all', emoji: '🗺️', name: { en: 'Mystery master', zh: '解谜大师' }, test: (p, t) => n(p.logs) >= t.discoveries },
  { id: 'placeit_play', emoji: '📍', name: { en: 'Pin dropper', zh: '插旗手' }, test: p => Object.values(p.placeit).some(r => r.plays > 0) },
  { id: 'placeit_7000', emoji: '🎯', name: { en: 'Sharp eye', zh: '火眼金睛' }, test: p => Object.values(p.placeit).some(r => r.best >= 7000) },
  { id: 'quiz_10', emoji: '🧠', name: { en: 'Quiz whiz', zh: '问答小达人' }, test: p => p.quiz.correct >= 10 },
  { id: 'quiz_geo', emoji: '🧭', name: { en: 'Geography expert', zh: '地理专家' }, test: p => (p.quiz.bySet.geo ?? 0) >= 20 },
  { id: 'daily_win', emoji: '📅', name: { en: 'Daily solver', zh: '每日解题王' }, test: p => p.daily.won >= 1 },
  { id: 'daily_streak3', emoji: '🔥', name: { en: 'On a roll', zh: '连胜中' }, test: p => p.daily.maxStreak >= 3 },
  { id: 'traveller', emoji: '🧳', name: { en: 'Globetrotter', zh: '环球旅行家' }, test: p => n(p.visited) >= 5 },
];

/** Returns ids of stickers newly earned; caller persists them. */
export function newlyEarned(p: Progress, totals: { animals: number; discoveries: number }, now = Date.now()): string[] {
  const out: string[] = [];
  for (const s of STICKERS) if (!(s.id in p.stickers) && s.test(p, totals)) { p.stickers[s.id] = now; out.push(s.id); }
  return out;
}
