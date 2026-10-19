import type { CatalogueItem } from '../data/types.ts';

/** Time-machine stops: 'dino' is the age of dinosaurs, 'now' shows everything; numbers are years (negative = BCE). */
export type Stop = 'dino' | number | 'now';
export const STOPS: Stop[] = ['dino', -3000, -500, 1, 1000, 1500, 1800, 1900, 1950, 2000, 'now'];

/** Year an item appeared (built / happened), if known. */
export function dateOf(it: CatalogueItem): number | undefined {
  return it.facts?.built ?? it.facts?.year ?? it.facts?.born;
}

/** Whether an item exists on the globe at a given time-machine stop. */
export function visibleAt(it: CatalogueItem, stop: Stop): boolean {
  if (stop === 'now') return true;
  if (stop === 'dino') return it.facts?.mya !== undefined || it.type === 'volcano';
  if (it.facts?.mya !== undefined || it.type === 'vehicle') return false;
  const d = dateOf(it);
  return d === undefined || d <= stop;
}

/** Items that first appear at this stop (dated after the previous stop), newest first. */
export function appearingAt(items: CatalogueItem[], idx: number): CatalogueItem[] {
  const stop = STOPS[idx];
  if (typeof stop !== 'number') return stop === 'dino' ? items.filter(i => i.facts?.mya !== undefined) : [];
  const prev = typeof STOPS[idx - 1] === 'number' ? (STOPS[idx - 1] as number) : -Infinity;
  return items.filter(i => { const d = dateOf(i); return i.facts?.mya === undefined && d !== undefined && d > prev && d <= stop; })
    .sort((a, b) => dateOf(b)! - dateOf(a)!);
}
