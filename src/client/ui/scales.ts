/**
 * The scale rail: one vertical ladder from the whole universe down to the Earth, on every screen. It shows where you
 * are in the one connected system and jumps between levels (zooming also moves along it).
 */
import { h } from './dom.ts';
import { t, onLang } from '../lib/i18n.ts';
import { sfx } from '../lib/sfx.ts';

export type RailLevel = 'universe' | 'laniakea' | 'group' | 'galaxy' | 'solar' | 'earth';
export const RAIL: RailLevel[] = ['universe', 'laniakea', 'group', 'galaxy', 'solar', 'earth'];

export class ScaleRail {
  readonly el: HTMLElement;
  private btns = new Map<RailLevel, HTMLButtonElement>();
  private cur: RailLevel = 'earth';

  constructor(go: (l: RailLevel) => void) {
    this.el = h('nav', { class: 'scale-rail', 'data-testid': 'scale-rail', 'aria-label': t('scales') });
    for (const l of RAIL) {
      const b = h('button', { class: 'sr-step sr-' + l, 'data-testid': 'rail-' + l, 'aria-label': t('sc_' + l),
        onclick: () => { if (l !== this.cur) { sfx.tap(); go(l); } } },
        h('i', { 'aria-hidden': 'true' }), h('span', {}, t('sc_' + l))) as HTMLButtonElement;
      this.btns.set(l, b);
      this.el.append(b);
    }
    this.set('earth');
    onLang(() => {
      this.el.setAttribute('aria-label', t('scales'));
      for (const [l, b] of this.btns) { b.setAttribute('aria-label', t('sc_' + l)); b.querySelector('span')!.textContent = t('sc_' + l); }
    });
  }

  set(l: RailLevel): void {
    this.cur = l;
    for (const [k, b] of this.btns) {
      b.classList.toggle('on', k === l);
      if (k === l) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    }
  }
}
