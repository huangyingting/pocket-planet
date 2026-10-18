import type { DailyStats } from '../games/daily.ts';
import { EMPTY_STATS } from '../games/daily.ts';
import type { PlaceItRecord } from '../games/placeit.ts';

export type Stamp = Record<string, number>;
export interface Progress {
  v: 1;
  dex: Stamp; logs: Stamp; likes: Stamp; visited: Stamp; stickers: Stamp;
  placeit: Record<string, PlaceItRecord>;
  quiz: { answered: number; correct: number; bySet: Record<string, number> };
  daily: DailyStats;
  updatedAt: number;
}

export function emptyProgress(): Progress {
  return { v: 1, dex: {}, logs: {}, likes: {}, visited: {}, stickers: {}, placeit: {}, quiz: { answered: 0, correct: 0, bySet: {} },
    daily: { ...EMPTY_STATS, dist: [...EMPTY_STATS.dist] }, updatedAt: 0 };
}

function unionEarliest(a: Stamp = {}, b: Stamp = {}): Stamp {
  const out: Stamp = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = k in out ? Math.min(out[k], v) : v;
  return out;
}

/**
 * Conflict-free merge used for device <-> server sync: collections are unioned keeping the earliest
 * timestamp, records keep the maximum, counters keep the maximum (they only grow on a single device).
 * likes/visited are toggles, so for those the newer side wins per key presence.
 */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const newer = (a.updatedAt ?? 0) >= (b.updatedAt ?? 0) ? a : b;
  const placeit: Record<string, PlaceItRecord> = { ...a.placeit };
  for (const [k, r] of Object.entries(b.placeit ?? {})) {
    const p = placeit[k];
    placeit[k] = p ? { best: Math.max(p.best, r.best), plays: Math.max(p.plays, r.plays) } : r;
  }
  const bySet: Record<string, number> = { ...a.quiz?.bySet };
  for (const [k, v] of Object.entries(b.quiz?.bySet ?? {})) bySet[k] = Math.max(bySet[k] ?? 0, v);
  const da = a.daily ?? EMPTY_STATS, db = b.daily ?? EMPTY_STATS;
  const dailyNewer = (da.lastWonDay ?? -1) >= (db.lastWonDay ?? -1) ? da : db;
  return {
    v: 1,
    dex: unionEarliest(a.dex, b.dex), logs: unionEarliest(a.logs, b.logs), stickers: unionEarliest(a.stickers, b.stickers),
    likes: { ...newer.likes }, visited: { ...newer.visited },
    placeit,
    quiz: { answered: Math.max(a.quiz?.answered ?? 0, b.quiz?.answered ?? 0), correct: Math.max(a.quiz?.correct ?? 0, b.quiz?.correct ?? 0), bySet },
    daily: {
      played: Math.max(da.played, db.played), won: Math.max(da.won, db.won), streak: dailyNewer.streak,
      maxStreak: Math.max(da.maxStreak, db.maxStreak), lastWonDay: dailyNewer.lastWonDay,
      dist: da.dist.map((v, i) => Math.max(v, db.dist?.[i] ?? 0)),
    },
    updatedAt: Math.max(a.updatedAt ?? 0, b.updatedAt ?? 0),
  };
}

export function isProgress(x: unknown): x is Progress {
  if (!x || typeof x !== 'object') return false;
  const p = x as Progress;
  return p.v === 1 && typeof p.dex === 'object' && typeof p.logs === 'object' && typeof p.stickers === 'object';
}
