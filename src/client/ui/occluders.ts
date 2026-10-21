/**
 * Screen rectangles taken by the chrome (top bar, scale rail, bottom docks, the open card…). Scene labels skip any spot
 * that would land under one of them, so a name never hides behind a button or the other way round.
 *
 * A panel opts in with the attribute `data-occludes` (`h('div', { 'data-occludes': true })`); hidden panels measure
 * 0×0 and drop out on their own. Only chrome whose visibility is a state class rather than `display: none` is listed by
 * selector below.
 */
const SEL = ['[data-occludes]', '.top-center > :not(.hidden)', '.solar-hint:not(.gone)'].join(',');
let cache: DOMRect[] = [];
let at = -1e9;
let sig = '';
/** Bumped whenever the chrome's rectangles change (label layers that cache their layout re-place on it). */
export let uiVersion = 0;

/** Cached for a few frames: reading layout every frame would cost more than the labels themselves. */
export function uiRects(): DOMRect[] {
  const now = performance.now();
  if (now - at > 250) {
    at = now;
    cache = [...document.querySelectorAll(SEL)].map(e => e.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0);
    const s = cache.map(r => `${r.left | 0},${r.top | 0},${r.width | 0},${r.height | 0}`).join(';');
    if (s !== sig) { sig = s; uiVersion++; }
  }
  return cache;
}

/** Does the box (x, y, w, h) in viewport px overlap any chrome? */
export function underUI(x: number, y: number, w: number, h: number, pad = 4): boolean {
  for (const r of uiRects()) if (x < r.right + pad && x + w > r.left - pad && y < r.bottom + pad && y + h > r.top - pad) return true;
  return false;
}

/** Forces a re-read on the next call (after the chrome changes, e.g. a card opens). */
export function invalidateUI(): void { at = -1e9; }

/** Rough label width in px (CJK glyphs are about twice as wide as Latin ones). */
export function textW(s: string, px: number): number {
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) > 0x2e80 ? px * 1.8 : px;
  return w;
}
