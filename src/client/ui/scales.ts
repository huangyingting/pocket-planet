/**
 * The scale rail: one vertical ladder from the whole universe down to the Earth, on every screen. It shows where you
 * are in the one connected system and jumps between levels (zooming also moves along it).
 */
import { h } from './dom.ts';
import { t, onLang, lang } from '../lib/i18n.ts';
import { sfx } from '../lib/sfx.ts';

export type RailLevel = 'universe' | 'laniakea' | 'group' | 'galaxy' | 'solar' | 'earth';
export const RAIL: RailLevel[] = ['universe', 'laniakea', 'group', 'galaxy', 'solar', 'earth'];
/** Rough size of each level, shown as a HUD readout next to its name. */
const SPAN: Record<RailLevel, { en: string; zh: string }> = {
  universe: { en: '93 bn ly', zh: '930亿光年' }, laniakea: { en: '520 M ly', zh: '5.2亿光年' }, group: { en: '10 M ly', zh: '1000万光年' },
  galaxy: { en: '87,400 ly', zh: '8.7万光年' }, solar: { en: '~120 AU', zh: '约120天文单位' }, earth: { en: '12,742 km', zh: '12,742 公里' },
};

export class ScaleRail {
  readonly el: HTMLElement;
  private btns = new Map<RailLevel, HTMLButtonElement>();
  private cur: RailLevel = 'earth';

  constructor(go: (l: RailLevel) => void) {
    this.el = h('nav', { class: 'scale-rail', 'data-occludes': true, 'data-testid': 'scale-rail', 'aria-label': t('scales') });
    for (const l of RAIL) {
      const b = h('button', { class: 'sr-step sr-' + l, 'data-testid': 'rail-' + l, 'aria-label': t('sc_' + l),
        onclick: () => { if (l !== this.cur) { sfx.tap(); go(l); } } },
        h('i', { 'aria-hidden': 'true' }), h('span', {}, h('b', {}, t('sc_' + l)), h('small', {}, SPAN[l][lang()]))) as HTMLButtonElement;
      this.btns.set(l, b);
      this.el.append(b);
    }
    this.set('earth');
    onLang(() => {
      this.el.setAttribute('aria-label', t('scales'));
      for (const [l, b] of this.btns) {
        b.setAttribute('aria-label', t('sc_' + l));
        b.querySelector('b')!.textContent = t('sc_' + l);
        b.querySelector('small')!.textContent = SPAN[l][lang()];
      }
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
