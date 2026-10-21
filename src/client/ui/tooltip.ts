/**
 * App-wide tooltip in the HUD style, replacing the browser's own `title` tooltip and copying its behaviour:
 * - every `title` attribute (now or later, in any scene) moves to `data-tip`, so the native one never shows;
 * - shows after the mouse rests on an element for a moment, at the pointer, just under the cursor, and stays put;
 * - hides when the pointer leaves, and on click, key press, wheel or scroll; it stays hidden on that element
 *   until the pointer leaves it;
 * - once one has shown, moving quickly onto the next titled element shows its tooltip at once;
 * - mouse only (touch and pen never show it); `title=""` switches off an ancestor's tooltip.
 */
const DELAY = 500;
const WARM = 400;
const CURSOR_H = 20;
const EDGE = 4;

let tip: HTMLDivElement;
let target: Element | null = null;
let timer = 0;
let shown = false;
let lastHide = -Infinity;
let px = 0, py = 0;

function adopt(el: Element): void {
  const v = el.getAttribute('title');
  if (v === null) return;
  el.removeAttribute('title');
  el.setAttribute('data-tip', v);
  // the title was also the accessible name of icon-only buttons
  // (marked, so a later title change, e.g. a language switch, renames it too)
  const own = el.hasAttribute('data-tip-label');
  if (own || (v && !el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby') && !(el.textContent ?? '').trim())) {
    el.setAttribute('aria-label', v);
    el.setAttribute('data-tip-label', '');
  }
  if (el === target && shown) place();
}

function adoptTree(root: ParentNode): void {
  if (root instanceof Element && root.hasAttribute('title')) adopt(root);
  for (const el of root.querySelectorAll('[title]')) adopt(el);
}

function place(): void {
  const text = target?.getAttribute('data-tip');
  if (!target?.isConnected || !text) { hide(); return; }
  tip.textContent = text;
  tip.hidden = false;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let x = px, y = py + CURSOR_H;
  if (y + h > innerHeight - EDGE) y = py - h - 6;
  x = Math.max(EDGE, Math.min(x, innerWidth - EDGE - w));
  y = Math.max(EDGE, y);
  tip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  shown = true;
}

function hide(): void {
  window.clearTimeout(timer);
  if (shown) lastHide = performance.now();
  shown = false;
  tip.hidden = true;
}

/** Hide without forgetting the element: the tooltip comes back only after the pointer leaves it. */
function dismiss(): void {
  hide();
  lastHide = -Infinity;
}

function enter(el: Element | null): void {
  if (el === target) return;
  hide();
  target = el;
  if (!el?.getAttribute('data-tip')) return;
  if (performance.now() - lastHide < WARM) place();
  else timer = window.setTimeout(place, DELAY);
}

export function initTooltips(): void {
  if (tip) return;
  tip = document.createElement('div');
  tip.className = 'pp-tip';
  tip.setAttribute('role', 'tooltip');
  tip.setAttribute('aria-hidden', 'true');
  tip.hidden = true;
  document.body.append(tip);
  adoptTree(document);
  new MutationObserver(list => {
    for (const m of list) {
      if (m.type === 'attributes') { adopt(m.target as Element); if (m.target === target && shown) place(); }
      else for (const n of m.addedNodes) if (n instanceof Element) adoptTree(n);
    }
    if (target && !target.isConnected) { hide(); target = null; }
  }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['title', 'data-tip'] });

  window.addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') { enter(null); return; }
    px = e.clientX; py = e.clientY;
    enter((e.target as Element).closest?.('[data-tip]') ?? null);
  }, true);
  window.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && !shown) { px = e.clientX; py = e.clientY; } }, { capture: true, passive: true });
  document.documentElement.addEventListener('pointerleave', () => enter(null));
  for (const ev of ['pointerdown', 'keydown', 'wheel'] as const) addEventListener(ev, dismiss, { capture: true, passive: true });
  // only a scroll that moves the element under the pointer (code nudging some other strip's scrollLeft does not count)
  window.addEventListener('scroll', e => { const n = e.target; if (target && (n === document || (n instanceof Node && n.contains(target)))) dismiss(); }, { capture: true, passive: true });
  window.addEventListener('blur', () => enter(null));
}
