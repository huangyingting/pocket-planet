/** "Tonight from my city": a hand-picked city (no GPS), the dark window, Moon, planets, meteor showers and events ahead. */
import { h, openModal, closeModal } from './dom.ts';
import { Select } from './select.ts';
import { icon } from './icons.ts';
import { t, lang, fmtNum } from '../lib/i18n.ts';
import { load, save } from '../lib/storage.ts';
import { tr } from '../../shared/data/types.ts';
import { SHOWERS } from '../../shared/data/showers.ts';
import { tonight, type EventAhead } from '../../shared/lib/astro/tonight.ts';
import { SITES } from '../sky/text.ts';
import { eventTitle, bodyName } from '../sky/acts.ts';
import { zoneOffset, localClock } from '../sky/common.ts';

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const dir = (az: number) => t('dir_' + DIRS[Math.round(az / 45) % 8]);
const LASTS = new Set(['opposition', 'conjunction', 'elongation', 'supermoon']);

export function openTonight(open: (hash: string) => void, now = Date.now()): void {
  let siteId = load<string>('tonightSite', '');
  const body = h('div', { class: 'tn-body', 'aria-live': 'polite' });
  const select = new Select({ testid: 'tn-city', label: t('tnCity'), icon: 'pin', className: 'xsel-wide', value: siteId, placeholder: t('tnPick'),
    options: SITES.map(x => ({ value: x.id, label: tr(x.name, lang()) })),
    onChange: v => { siteId = v; save('tonightSite', siteId); render(); } }).el;

  const render = () => {
    const site = SITES.find(x => x.id === siteId);
    if (!site) { body.replaceChildren(h('p', { class: 'muted', 'data-testid': 'tn-empty' }, t('tnChoose'))); return; }
    const r = tonight(site, now);
    const sp = lang() === 'zh' ? '' : ' ';
    const clock = (ms: number, date = false) => localClock(ms, zoneOffset(site.zone, ms), date, lang());
    const hm = (ms: number) => clock(ms).replace(/ \(.*\)$/, '');
    const sec = (id: string, ic: Parameters<typeof icon>[0], title: string, ...kids: (Node | null)[]) =>
      h('section', { class: 'tn-sec', 'data-testid': 'tn-' + id }, h('h3', { html: icon(ic, 16) }, h('span', {}, title)), ...kids);
    const li = (...kids: (Node | string | null)[]) => h('li', {}, ...kids);

    const night = r.polar === 'day' ? t('tnPolarDay') : r.polar === 'night' ? t('tnPolarNight')
      : t('tnNight', { a: hm(r.night![0]), b: hm(r.night![1]) }) + sp + (r.dark ? t('tnDark', { a: hm(r.dark[0]), b: hm(r.dark[1]) }) : t('tnNoDark'));
    const m = r.moon;
    const moonTxt = t('tnMoon', { p: Math.round(m.illum * 100), phase: t(m.illum < 0.03 ? 'tnNew' : m.illum > 0.97 ? 'tnFull' : m.waxing ? 'tnWaxing' : 'tnWaning') })
      + sp + (m.maxAlt <= 0 ? t('tnMoonDown') : t('tnMoonUp', { p: Math.round(m.upFrac * 100) }))
      + (m.washout ? sp + t('tnWashout') : '');

    const planets = r.planets.length ? h('ul', { class: 'tn-list' }, ...r.planets.map(p => li(
      h('b', {}, bodyName(p.id)), ' · ', t('tnWhen_' + p.when), ' · ',
      t('tnLook', { d: dir(p.az), a: Math.round(p.alt) }), ' · ', t('tnBest', { t: hm(p.best) }))))
      : h('p', { class: 'muted' }, t('tnNoPlanets'));

    const showers = r.showers.filter(x => x.rate >= 1 || Math.abs(x.daysToPeak) < 3);
    const showerList = showers.length ? h('ul', { class: 'tn-list' }, ...showers.map(x => {
      const sh = SHOWERS.find(y => y.key === x.key)!;
      const d = Math.round(x.daysToPeak);
      const peak = t('tnPeak', { t: clock(x.peak, true) }) + ' ' + (d === 0 ? t('tnPeakNow') : d > 0 ? t('tnPeakIn', { n: d }) : t('tnPeakAgo', { n: -d }));
      return li(h('b', {}, tr(sh.name, lang())), ' · ', peak, h('br'),
        x.radiantAlt > 0 ? t('tnRate', { a: Math.round(x.radiantAlt), n: fmtNum(Math.max(1, Math.round(x.rate))), t: hm(x.best) }) : t('tnRadiantDown'),
        m.washout ? sp + t('tnShowerMoon') : '');
    })) : h('p', { class: 'muted' }, t('tnNoShowers'));

    const where = (e: EventAhead) => e.here === 'up' ? t('tnHereUp', { a: Math.round(e.alt ?? 0) })
      : e.here === 'none' ? t('tnHereNone')
      : (e.here === 'day' ? t('tnHereDay') : t('tnHereBelow')) + (LASTS.has(e.ev.kind) ? sp + t('tnNearby') : '');
    const events = r.events.length ? h('ul', { class: 'tn-list' }, ...r.events.map(e => li(
      h('button', { class: 'link tn-ev', 'data-testid': 'tn-event', onclick: () => { closeModal('tonight'); open('sky/' + e.ev.id); } }, eventTitle(e.ev)),
      ' · ', t('tnPeak', { t: clock(e.ev.t, true) }), h('br'),
      h('span', { class: 'tn-here tn-' + e.here }, where(e)))))
      : h('p', { class: 'muted' }, t('tnNoEvents'));

    body.replaceChildren(
      h('p', { class: 'tn-when' }, t('tnFor', { c: tr(site.name, lang()), d: clock(now, true) })),
      sec('night', 'clock', t('tnNightT'), h('p', {}, night)),
      sec('moon', 'eclipse', t('tnMoonT'), h('p', {}, moonTxt)),
      sec('planets', 'planet', t('tnPlanetsT'), planets),
      sec('showers', 'star', t('tnShowersT'), showerList),
      sec('events', 'calendar', t('tnEventsT'), h('p', { class: 'muted small' }, t('tnEventsNote')), events),
      h('p', { class: 'tn-weather', 'data-testid': 'tn-weather', html: icon('cloud', 16) }, h('span', {}, t('tnWeather'))));
  };
  render();
  openModal('tonight', t('tonight'), h('div', { class: 'tn', 'data-testid': 'tonight' },
    h('p', { class: 'muted' }, t('tnIntro')),
    h('div', { class: 'tn-city' }, select),
    body), { wide: true });
}
