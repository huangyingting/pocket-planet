/**
 * Classroom mode: bigger text, fewer controls, no third-party content (radio,
 * Wikipedia, guestbook), and a "pause motion" switch for explaining a still frame.
 * Turned on from the menu (remembered) or by a `?class=1` link (this visit only).
 */
import { load, save } from './storage.ts';

const listeners = new Set<() => void>();
const fromLink = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('class');
let on = fromLink === '1' ? true : fromLink === '0' ? false : load<boolean>('classroom', false);

/** Ambient motion switch read by the render loops (camera moves still work). */
export const motion = { still: false };

export const classroom = (): boolean => on;

export function setClassroom(v: boolean): void {
  on = v;
  save('classroom', v);
  if (!v) motion.still = false;
  apply();
}

export function setStill(v: boolean): void {
  motion.still = v;
  apply();
}

export function onClassroom(fn: () => void): () => void { listeners.add(fn); return () => listeners.delete(fn); }

/** The link a teacher shares: classroom on, straight into one tour. */
export function classroomLink(tour: string): string {
  return `${location.origin}${location.pathname}?class=1#tour/${tour}`;
}

export function apply(): void {
  document.documentElement.classList.toggle('classroom', on);
  document.body.classList.toggle('still', motion.still);
  listeners.forEach(fn => fn());
}
