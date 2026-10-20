/** The sky-events calendar: a year of events, filters, countdowns and what each one looks like from your site. */
import { skyEvents, localSolar, topocentric, type SkyEvent, type SkyEventKind } from '../../shared/lib/astro/index.ts';
import { SHOWERS } from '../../shared/data/showers.ts';
import { h } from '../ui/dom.ts';
import { icon } from '../ui/icons.ts';
import { lang } from '../lib/i18n.ts';
import { s, regionOf, type SkyKey } from './text.ts';
import { eventTitle, type Site } from './acts.ts';

type Filter = 'top' | 'eclipse' | 'meteor' | 'moon' | 'planet' | 'season';
const FILTERS: Filter[] = ['top', 'eclipse', 'meteor', 'moon', 'planet', 'season'];
const DAY = 86400_000;

const cache = new Map<number, SkyEvent[]>();
export function eventsOf(year: number): SkyEvent[] {
  let e = cache.get(year);
  if (!e) { e = skyEvents(Date.UTC(year, 0, 1), Date.UTC(year + 1, 0, 1)); cache.set(year, e); }
  return e;
}

/** Find an event by id (ids carry their year). */
export function findEvent(id: string): SkyEvent | undefined {
  const y = Number(/(?:^|-)((?:19|20|21)\d\d)(?:-|$)/.exec(id)?.[1]);
  if (!y) return undefined;
  for (const yy of [y, y - 1, y + 1]) { const e = eventsOf(yy).find(x => x.id === id); if (e) return e; }
  return undefined;
}

const isTop = (e: SkyEvent) =>
  e.kind === 'solar-eclipse' || (e.kind === 'lunar-eclipse' && e.lunar!.type !== 'penumbral') || e.kind === 'supermoon' || e.kind === 'transit'
  || e.kind === 'opposition' || (e.kind === 'meteor-shower' && (SHOWERS.find(x => x.key === e.shower)?.zhr ?? 0) >= 50)
  || (e.kind === 'conjunction' && !e.bodies!.includes('moon') && (e.value ?? 9) < 1);
const KINDS: Record<Exclude<Filter, 'top'>, SkyEventKind[]> = {
  eclipse: ['solar-eclipse', 'lunar-eclipse'],
  meteor: ['meteor-shower'],
  moon: ['full-moon', 'new-moon', 'supermoon'],
  planet: ['opposition', 'conjunction', 'elongation', 'transit'],
  season: ['equinox', 'solstice'],
};
const match = (e: SkyEvent, f: Filter) => f === 'top' ? isTop(e) : KINDS[f].includes(e.kind) || (f === 'moon' && e.kind === 'conjunction' && e.bodies!.includes('moon'));

/** The first highlight from now (what the theatre opens on when no event is given). */
export function nextHighlight(now = Date.now()): SkyEvent | undefined {
  const y = new Date(now).getUTCFullYear();
  const all = [...eventsOf(y), ...eventsOf(y + 1)].filter(e => e.t > now - DAY);
  return all.find(e => e.kind === 'solar-eclipse' || e.kind === 'lunar-eclipse') && all.find(e => e.kind === 'solar-eclipse' || e.kind === 'lunar-eclipse')!.t - now < 200 * DAY
    ? all.find(e => e.kind === 'solar-eclipse' || e.kind === 'lunar-eclipse')
    : all.find(isTop) ?? all[0];
}

/** One line: what `site` gets of this event. */
export function seenFrom(e: SkyEvent, site: Site | null): string {
  if (e.kind === 'solar-eclipse') {
    const x = e.solar!;
    if (!site) return s('bestFrom', { r: regionOf(x.greatest.lat, x.greatest.lon) });
    const L = localSolar(x, site);
    const k: SkyKey = !L.visible || L.type === 'none' ? 'seesNone' : L.type === 'total' ? 'seesTotal' : L.type === 'annular' ? 'seesAnnular' : 'seesPartial';
    return s('hereSees', { p: site.name, s: s(k, { n: Math.round(L.obscuration * 100) }) });
  }
  if (e.kind === 'lunar-eclipse') {
    const l = e.lunar!;
    if (!site) return s('bestFrom', { r: regionOf(l.subMoon.lat, l.subMoon.lon) });
    const up = [l.u1 ?? l.p1, l.t, l.u4 ?? l.p4].some(t => topocentric(t, site).moon.alt > 0);
    return s('hereSees', { p: site.name, s: s(up ? 'seesUp' : 'seesNone') });
  }
  if (e.kind === 'meteor-shower') {
    const sh = SHOWERS.find(x => x.key === e.shower);
    return sh ? `ZHR ${sh.zhr} · ${s('parent')} ${lang() === 'zh' ? sh.parent.zh : sh.parent.en}` : '';
  }
  if (e.kind === 'conjunction') return `${s('separation')} ${(e.value ?? 0).toFixed(1)}°`;
  if (e.kind === 'elongation') return `${s('elongation')} ${(e.value ?? 0).toFixed(0)}°`;
  if (e.kind === 'supermoon' || e.kind === 'full-moon') return `${Math.round(e.value ?? 0).toLocaleString()} km`;
  return '';
}

export function countdown(t: number, now = Date.now()): string {
  const d = (t - now) / DAY;
  if (Math.abs(d) < 1) return d > 0 && d * 24 >= 1 ? s('inHours', { n: Math.round(d * 24) }) : s('today');
  return d > 0 ? s('inDays', { n: Math.ceil(d) }) : s('daysAgo', { n: Math.floor(-d) });
}

const KIND_ICON: Partial<Record<SkyEventKind, string>> = {
  'solar-eclipse': '◐', 'lunar-eclipse': '◑', 'meteor-shower': '✶', 'full-moon': '○', 'new-moon': '●', supermoon: '◯',
  equinox: '◒', solstice: '◓', opposition: '⊕', conjunction: '∴', elongation: '∠', transit: '⊙',
};

export class Calendar {
  readonly el: HTMLElement;
  private list: HTMLElement;
  private yearEl: HTMLElement;
  private chips: HTMLElement;
  private year = new Date().getUTCFullYear();
  private filter: Filter = 'top';
  active: string | null = null;

  constructor(private site: () => Site | null, private pick: (e: SkyEvent) => void) {
    this.yearEl = h('b', { class: 'skycal-year' });
    this.chips = h('div', { class: 'skycal-chips', role: 'tablist' });
    this.list = h('ol', { class: 'skycal-list', style: 'position:relative' });
    this.el = h('aside', { class: 'skycal', 'aria-label': s('list') },
      h('header', { class: 'skycal-head' },
        h('span', { class: 'skycal-kicker' }, 'EPHEMERIS · ' + s('list')),
        h('div', { class: 'skycal-years' },
          h('button', { class: 'sky-btn sky-btn-sq', 'aria-label': '−1', html: icon('collapse', 18), onclick: () => this.go(-1) }),
          this.yearEl,
          h('button', { class: 'sky-btn sky-btn-sq', 'aria-label': '+1', html: icon('chevron', 18), onclick: () => this.go(1) }))),
      this.chips, this.list);
    this.render();
  }

  private go(d: number): void { this.year = Math.max(1900, Math.min(2199, this.year + d)); this.render(); }
  showYear(y: number): void { if (y !== this.year) { this.year = y; this.render(); } }

  render(): void {
    this.yearEl.textContent = String(this.year);
    this.chips.replaceChildren(...FILTERS.map(f => h('button', {
      class: 'skycal-chip' + (f === this.filter ? ' on' : ''), role: 'tab', 'aria-selected': String(f === this.filter),
      onclick: () => { this.filter = f; this.render(); },
    }, s(`f_${f}` as SkyKey))));
    const now = Date.now(), site = this.site();
    const evs = eventsOf(this.year).filter(e => match(e, this.filter));
    if (!evs.length) { this.list.replaceChildren(h('li', { class: 'skycal-empty' }, s('empty'))); return; }
    const l = lang(), nextIdx = evs.findIndex(e => e.t > now);
    this.list.replaceChildren(...evs.map((e, i) => {
      const d = new Date(e.t);
      const md = l === 'zh' ? `${d.getMonth() + 1}月${d.getDate()}日` : d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
      const wk = d.toLocaleDateString(l === 'zh' ? 'zh-CN' : 'en', { weekday: 'short' });
      const past = e.t < now - DAY;
      return h('li', {},
        h('button', {
          class: 'skycal-item' + (e.id === this.active ? ' on' : '') + (past ? ' past' : '') + (i === nextIdx ? ' next' : ''),
          'data-kind': e.kind, 'data-id': e.id, onclick: () => this.pick(e),
        },
          h('span', { class: 'skycal-glyph', 'aria-hidden': 'true' }, KIND_ICON[e.kind] ?? '·'),
          h('span', { class: 'skycal-date' }, h('b', {}, md), h('small', {}, `${wk} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)),
          h('span', { class: 'skycal-main' }, h('b', {}, eventTitle(e)), h('small', {}, seenFrom(e, site))),
          h('span', { class: 'skycal-cd' }, i === nextIdx ? h('em', {}, s('next')) : null, countdown(e.t, now))));
    }));
    // scrollIntoView would also scroll the clipped stage to reveal a closed drawer: scroll only the list
    const it = this.list.querySelector<HTMLElement>('.on, .next');
    if (it) this.list.scrollTop = Math.max(0, it.offsetTop - this.list.clientHeight / 3);
  }
}
