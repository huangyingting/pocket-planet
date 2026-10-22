/** Shared types and small builders for the lesson data files. */
import type { IconName } from '../ui/icons.ts';
import type { LL, Line, Mark, Pair, StageScene } from './stage.ts';
import type { Fig } from './figs.ts';

export type { LL, Pair, Fig };

export interface Quiz {
  q: Pair;
  /** choice question */
  options?: Pair[]; answer?: number;
  /** "find it on the globe" question: tap within `tolKm` of `at` */
  at?: LL; tolKm?: number;
  /** a chart or diagram to read (a climate graph to identify, a pyramid to interpret…) */
  fig?: Fig;
  why: Pair;
}
export interface Step extends StageScene {
  title: Pair; body: Pair;
  /** the drawing is a simplified sketch, not measured data */
  sketch?: boolean;
  /** offer a button into the sky theatre's seasons model */
  sky?: 'seasons';
  /** a chart or diagram shown in the card, next to what the globe draws */
  fig?: Fig;
}
/** Volumes of the Chinese PEP (人教版) middle-school geography textbooks. */
export type Grade = 'g7a' | 'g7b' | 'g8a' | 'g8b';
/** The big themes every curriculum shares; the "all topics" view and the international tracks group by these. */
export type Strand = 'maps' | 'physical' | 'climate' | 'human' | 'world' | 'china';
/** Other middle-school (age 11–14) curricula: England KS3, US grades 6–8, IB MYP / Cambridge, Australia years 7–8. */
export type Track = 'uk' | 'us' | 'ib' | 'au';
export interface Lesson {
  id: string; strand: Strand;
  /** the Chinese textbook volume; absent when the topic is not in the Chinese middle-school course */
  grade?: Grade;
  /** other curricula that teach this topic */
  tracks: Track[];
  unit: Pair; title: Pair; blurb: Pair; icon: IconName; minutes: number;
  /** the take-aways, shown with the score */
  keys: Pair[];
  steps: Step[]; quiz: Quiz[];
}

export const C = {
  gold: '#ffd24a', red: '#ff6b6b', blue: '#4dabf7', green: '#51cf66', teal: '#3bc9db', violet: '#b197fc',
  orange: '#ff922b', white: '#f1f3f5', pink: '#f783ac', ice: '#a5d8ff', brown: '#d9a066', lime: '#c0eb75',
} as const;

/** A whole parallel, drawn west to east. */
export const par = (lat: number, c: string, t = 0, extra: Partial<Line> = {}): Line => ({ pts: [[lat, -180], [lat, 0], [lat, 180]], c, t, rhumb: true, dur: 2.2, ...extra });
/** A meridian from the South Pole to the North Pole. */
export const mer = (lon: number, c: string, t = 0, extra: Partial<Line> = {}): Line => ({ pts: [[-89.9, lon], [89.9, lon]], c, t, rhumb: true, dur: 2, ...extra });
/** A label (optionally with a dot). */
export const mk = (ll: LL, en: string, zh: string, extra: Partial<Mark> = {}): Mark => ({ ll, text: [en, zh], ...extra });
/** Short flow arrows (winds, motion), each a separate line. */
export const arrows = (paths: LL[][], c: string, t = 0, w = 1.6): Line[] => paths.map((pts, i) => ({ pts, c, t: t + i * 0.25, flow: true, arrow: true, w, dur: 1.2 }));

/** Moments used by the clocks (UTC). 04:00 UTC puts the noon Sun over 120°E, above China. */
export const T = {
  marchNoonChina: Date.UTC(2025, 2, 20, 4),
  janChina: Date.UTC(2025, 0, 15, 4),
  julChina: Date.UTC(2025, 6, 15, 4),
  dawnBeijing: Date.UTC(2025, 2, 20, 22),
  juneDawn: Date.UTC(2025, 5, 21, 0),
};
