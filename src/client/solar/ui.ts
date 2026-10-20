/**
 * Solar System UI: breadcrumb + back button, planet dock, time controls, and the body / feature card (same card
 * and Wikipedia reader as on the globe). Lazily loaded together with the view on first entry.
 */
import { h } from '../ui/dom.ts';
import { icon } from '../ui/icons.ts';
import { t, lang, onLang, fmtNum } from '../lib/i18n.ts';
import { sfx } from '../lib/sfx.ts';
import { tr, type Lang } from '../../shared/data/types.ts';
import { BODIES, BODY, type BodyId, type SolarBody } from '../../shared/data/solar.ts';
import { BODY_TEXT } from '../../shared/data/solar-text.ts';
import { SOLAR_FEATURES } from '../../shared/data/solar-features.ts';
import { AU_KM, daysJ2000, relativePosition } from '../../shared/lib/orbits.ts';
import type { Quality } from '../globe/quality.ts';
import type { Reader, Readable } from '../ui/reader.ts';
import { SolarView, SPEEDS, featuresOf, type SolarSelection } from './view.ts';

export interface SolarHost {
  quality: Quality;
  earthCanvas: () => HTMLCanvasElement;
  /** Leave for the globe, looking down at lat/lon. */
  exit: (lat: number, lon: number) => void;
}

const DOCK: BodyId[] = ['sun', 'mercury', 'venus', 'earth', 'mars', 'ceres', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
const SPEED_KEYS = ['spPause', 'spReal', 'spHour', 'spDay', 'spMonth', 'spYear'];
const DOT: Partial<Record<BodyId, string>> = { mercury: '#a8a29e', ceres: '#8b857d', moon: '#c9c5bd', io: '#e8d36a', europa: '#d9cbb0', ganymede: '#a39a8c', callisto: '#6f665c', enceladus: '#eef4f8', triton: '#d8c8c0', charon: '#a99f97' };
const dotColor = (b: SolarBody) => DOT[b.id] ?? b.glow ?? '#9ca3af';
const EMPTY = { en: '', zh: '' };

/** "227.9 million km" / "2.28 亿公里". */
export function fmtKm(km: number, l: Lang): string {
  if (l === 'zh') {
    if (km >= 1e8) return `${(km / 1e8).toFixed(2)} 亿公里`;
    if (km >= 1e4) return `${fmtNum(Math.round(km / 1e4), l)} 万公里`;
    return `${fmtNum(Math.round(km), l)} 公里`;
  }
  if (km >= 1e9) return `${(km / 1e9).toFixed(2)} billion km`;
  if (km >= 1e6) return `${(km / 1e6).toFixed(1)} million km`;
  return `${fmtNum(Math.round(km), l)} km`;
}

/** Duration in hours → "9.9 h" / "58.6 days" / "11.9 years". */
export function fmtDur(hours: number): string {
  const a = Math.abs(hours);
  if (a < 48) return t('hoursN', { n: +a.toFixed(1) });
  if (a < 24 * 1000) return t('daysN', { n: fmtNum(+(a / 24).toFixed(a < 24 * 100 ? 1 : 0)) });
  return t('yearsN', { n: fmtNum(+(a / 24 / 365.25).toFixed(1)) });
}

export class SolarUI {
  readonly view: SolarView;
  readonly el: HTMLElement;
  private crumbs = h('nav', { class: 'solar-crumbs', 'data-testid': 'solar-crumbs', 'aria-label': 'breadcrumb' });
  private infoMain = h('div', { class: 'info-main', 'aria-live': 'polite' });
  private info = h('aside', { class: 'info solar-info hidden', 'data-testid': 'solar-info' }, this.infoMain);
  private dock = h('div', { class: 'solar-dock', role: 'toolbar' });
  private dateEl = h('span', { class: 'solar-date', 'data-testid': 'solar-date' });
  private speedEl = h('span', { class: 'solar-speed', 'data-testid': 'solar-speed' });
  private playBtn = h('button', { class: 'icon-btn', 'data-testid': 'solar-play' });
  private hint = h('p', { class: 'solar-hint' });
  private sel: SolarSelection | null = null;
  private speedIdx = 3;
  private reader: Reader | null = null;
  private readerOpen = false;

  constructor(root: HTMLElement, private host: SolarHost) {
    this.view = new SolarView(root, {
      onSelect: s => this.showCard(s),
      onView: () => this.renderCrumbs(),
      onEnterEarth: (lat, lon) => this.host.exit(lat, lon),
      onTime: ms => this.renderDate(ms),
      onTexture: id => { if (this.sel && (this.sel.kind === 'body' ? this.sel.id : this.sel.f.body) === id) this.drawHero(); },
    }, host.quality);
    this.view.root.querySelector('canvas')?.setAttribute('aria-label', t('solarLabel'));
    this.el = h('div', { class: 'solar-ui hidden', 'data-testid': 'solar-ui' },
      h('header', { class: 'solar-top' },
        h('button', { class: 'pill solar-back', 'data-testid': 'solar-back', html: icon('globe', 16), onclick: () => { sfx.tap(); this.backToEarth(); } },
          h('span', { 'data-i18n': 'backToEarth' }, t('backToEarth'))),
        this.crumbs),
      this.info,
      h('div', { class: 'solar-bottom' },
        h('div', { class: 'solar-time', role: 'group', 'aria-label': t('timeSpeed') },
          this.playBtn,
          h('button', { class: 'icon-btn', 'aria-label': '−', 'data-testid': 'solar-slower', html: icon('collapse', 15), onclick: () => this.setSpeed(Math.max(1, this.speedIdx - 1)) }),
          this.speedEl,
          h('button', { class: 'icon-btn', 'aria-label': '+', 'data-testid': 'solar-faster', html: icon('chevron', 15), onclick: () => this.setSpeed(Math.min(SPEEDS.length - 1, this.speedIdx + 1)) }),
          this.dateEl,
          h('button', { class: 'pill pill-sm', 'data-testid': 'solar-now', 'data-i18n': 'now', onclick: () => { this.view.resetTime(); this.renderDate(this.view.simMs); } }, t('now'))),
        this.dock),
      h('div', { class: 'solar-zoom zoom-ctl' },
        h('button', { 'aria-label': t('zoomIn'), 'data-testid': 'solar-zoom-in', html: icon('plus', 17), onclick: () => this.view.zoomBy(0.55) }),
        h('button', { 'aria-label': t('overview'), title: t('overview'), 'data-testid': 'solar-overview', html: icon('sun', 17), onclick: () => this.overview() }),
        h('button', { 'aria-label': t('zoomOut'), 'data-testid': 'solar-zoom-out', html: icon('minus', 17), onclick: () => this.view.zoomBy(1.8) })),
      this.hint);
    root.append(this.el);
    this.playBtn.onclick = () => this.setSpeed(this.speedIdx === 0 ? 3 : 0);
    this.renderDock();
    this.setSpeed(3);
    this.view.setEarthCanvas(host.earthCanvas());
    onLang(() => this.relabel());
    document.addEventListener('keydown', e => {
      if (!this.view.isActive || e.key !== 'Escape') return;
      if (this.readerOpen) void this.toggleReader(false);
      else if (this.sel) this.showCard(null);
      else this.overview();
    });
  }

  enter(opts: { from?: { lat: number; lon: number }; focus?: BodyId | string } = {}): void {
    this.el.classList.remove('hidden');
    this.hint.textContent = t('solarHint');
    this.hint.classList.remove('gone');
    setTimeout(() => this.hint.classList.add('gone'), 6000);
    const f = opts.focus ? SOLAR_FEATURES.find(x => x.key === opts.focus) : undefined;
    if (f) { this.view.show(); this.view.selectFeature(f); }
    else if (opts.focus && opts.focus in BODY) { this.view.show(); this.view.select(opts.focus as BodyId); }
    else if (opts.from) { this.view.show({ from: opts.from }); this.showCard(null); }
    else { this.view.show(); this.overview(); }
    this.renderCrumbs();
    this.renderDate(this.view.simMs);
  }

  /** Jump to a body, a feature key or 'overview' while the view is already open (e.g. a #solar/… link). */
  goTo(focus: string): void {
    const f = SOLAR_FEATURES.find(x => x.key === focus);
    if (f) this.view.selectFeature(f);
    else if (focus in BODY) this.view.select(focus as BodyId);
    else this.overview();
    this.renderCrumbs();
  }

  leave(): void {
    void this.toggleReader(false);
    this.view.hide();
    this.el.classList.add('hidden');
  }

  private backToEarth(): void {
    const [lat, lon] = this.view.focusId === 'earth' ? this.view.earthLatLon() : [20, 10];
    this.host.exit(lat, lon);
  }

  private overview(): void {
    this.showCard(null);
    this.view.overview();
  }

  private setSpeed(i: number): void {
    this.speedIdx = i;
    this.view.setSpeed(SPEEDS[i]);
    this.speedEl.textContent = t(SPEED_KEYS[i]);
    this.speedEl.dataset.idx = String(i);
    this.playBtn.innerHTML = icon(i === 0 ? 'play' : 'pause', 15);
    this.playBtn.setAttribute('aria-label', i === 0 ? t('spDay') : t('spPause'));
    this.renderDate(this.view.simMs);
  }

  private renderDate(ms: number): void {
    const l = lang();
    const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    if (SPEEDS[this.speedIdx] <= 3600) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
    this.dateEl.textContent = new Intl.DateTimeFormat(l === 'zh' ? 'zh-CN' : 'en', opts).format(new Date(ms));
  }

  private renderDock(): void {
    const l = lang();
    this.dock.replaceChildren(...DOCK.map(id => {
      const b = BODY[id];
      return h('button', { class: 'solar-chip' + (this.view.focusId === id ? ' on' : ''), 'data-testid': 'sp-' + id, title: tr(b.name, l),
        onclick: () => { sfx.tap(); this.view.select(id); } },
        h('i', { class: 'dot', style: `--c:${dotColor(b)}` + (b.rings ? ';--ring:1' : '') }), h('span', {}, tr(b.name, l)));
    }));
  }

  private renderCrumbs(): void {
    const l = lang();
    const v = this.view, fid = v.focusId;
    const parts: HTMLElement[] = [h('button', { class: 'crumb', 'data-testid': 'crumb-system', onclick: () => this.overview() }, t('solarSystem'))];
    const chain: BodyId[] = fid === 'sun' && !this.sel ? [] : BODY[fid].parent && BODY[fid].parent !== 'sun' ? [BODY[fid].parent!, fid] : [fid];
    for (const id of chain) parts.push(h('span', { class: 'sep', 'aria-hidden': 'true' }, '›'), h('button', { class: 'crumb', onclick: () => this.view.select(id) }, tr(BODY[id].name, l)));
    if (this.sel?.kind === 'feature') parts.push(h('span', { class: 'sep', 'aria-hidden': 'true' }, '›'), h('span', { class: 'crumb cur' }, tr(this.sel.f.name, l)));
    parts.at(-1)?.classList.add('cur');
    this.crumbs.replaceChildren(...parts);
    for (const c of this.dock.children) c.classList.toggle('on', (c as HTMLElement).dataset.testid === 'sp-' + fid);
  }

  private relabel(): void {
    this.view.relabel();
    for (const el of this.el.querySelectorAll<HTMLElement>('[data-i18n]')) el.textContent = t(el.dataset.i18n!);
    this.view.root.querySelector('canvas')?.setAttribute('aria-label', t('solarLabel'));
    this.renderDock();
    this.renderCrumbs();
    this.setSpeed(this.speedIdx);
    if (this.sel) this.renderCard();
    this.reader?.relang();
  }

  // ---------- card ----------
  private showCard(sel: SolarSelection | null): void {
    this.sel = sel;
    this.renderCrumbs();
    if (!sel) {
      void this.toggleReader(false);
      this.info.classList.add('hidden');
      history.replaceState(null, '', '#solar');
      return;
    }
    sfx.pop();
    history.replaceState(null, '', '#solar/' + (sel.kind === 'body' ? sel.id : sel.f.key));
    this.renderCard();
    this.info.classList.remove('hidden');
    if (this.readerOpen) this.reader?.show(this.readable());
  }

  private readable(): Readable {
    const s = this.sel!;
    if (s.kind === 'feature') return { key: s.f.key, name: s.f.name, desc: s.f.desc, wiki: s.f.wiki, funFact: s.f.funFact };
    const b = BODY[s.id], tx = BODY_TEXT[s.id];
    return { key: 'sb_' + s.id, name: b.name, desc: tx?.desc ?? EMPTY, wiki: b.wiki, funFact: tx?.funFact };
  }

  private hero = h('canvas', { class: 'solar-map', width: 720, height: 360 });

  /** The body's surface map as the card hero (with a marker for a feature). */
  private drawHero(): void {
    const s = this.sel;
    if (!s) return;
    const id = s.kind === 'body' ? s.id : s.f.body;
    const src = this.view.mapImage(id);
    const cv = this.hero, ctx = cv.getContext('2d')!;
    ctx.fillStyle = '#0d0d11';
    ctx.fillRect(0, 0, cv.width, cv.height);
    if (src) ctx.drawImage(src, 0, 0, cv.width, cv.height);
    if (s.kind === 'feature') {
      const x = ((s.f.lon + 180) / 360) * cv.width, y = ((90 - s.f.lat) / 180) * cv.height;
      ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 28, y); ctx.lineTo(x - 20, y); ctx.moveTo(x + 20, y); ctx.lineTo(x + 28, y);
      ctx.moveTo(x, y - 28); ctx.lineTo(x, y - 20); ctx.moveTo(x, y + 20); ctx.lineTo(x, y + 28); ctx.stroke();
    }
  }

  private renderCard(): void {
    const s = this.sel!, l = lang();
    const body = BODY[s.kind === 'body' ? s.id : s.f.body];
    const it = this.readable();
    const alt = l === 'en' ? it.name.zh : it.name.en;
    const stat = (k: string, v: string) => h('div', {}, h('dt', {}, k), h('dd', {}, v));
    let eyebrow: string, key: [string, string][], extra: [string, string][] = [];
    if (s.kind === 'body') {
      const f = body.facts, pName = body.parent ? tr(BODY[body.parent].name, l) : '';
      eyebrow = body.kind === 'moon' ? t('moonOf', { p: pName }) : t('bk_' + body.kind);
      key = [[t('diameter'), fmtNum(Math.round(body.radiusKm * 2)) + (l === 'zh' ? ' 公里' : ' km')]];
      if (body.locked && body.parent) key.push([t('dayLen'), t('lockedDay', { p: pName })]);
      else if (f.dayH) key.push([t('dayLen'), fmtDur(f.dayH)]);
      if (f.yearD) key.push([t('yearLen'), fmtDur(f.yearD * 24)]);
      else if (body.moon) key.push([t('orbitLen'), fmtDur(Math.abs(body.moon.periodD) * 24)]);
      const d = daysJ2000(this.view.simMs);
      const sunAU = (id: BodyId) => { const p = relativePosition(id, d); return Math.hypot(p[0], p[1], p[2]); };
      if (body.kepler) {
        const au = sunAU(body.id);
        extra.push([t('fromSun'), fmtKm(au * AU_KM, l)]);
        extra.push([t('sunlight'), t('minutesN', { n: fmtNum(Math.round((au * AU_KM) / 299_792.458 / 60)) })]);
        if (body.id !== 'earth') {
          const a = relativePosition(body.id, d), e = relativePosition('earth', d);
          extra.push([t('fromEarth'), fmtKm(Math.hypot(a[0] - e[0], a[1] - e[1], a[2] - e[2]) * AU_KM, l)]);
        }
      } else if (body.moon) extra.push([t('fromParent', { p: pName }), fmtKm(body.moon.aKm, l)]);
      if (f.moons !== undefined && body.kind !== 'star') extra.push([t('moonsN'), fmtNum(f.moons)]);
      if (f.gravity !== undefined) extra.push([t('gravity'), t('xEarth', { n: f.gravity })]);
      if (f.tempC) extra.push([t('temperature'), f.tempC[0] === f.tempC[1] ? `${fmtNum(f.tempC[0])} °C` : `${fmtNum(f.tempC[0])} ~ ${fmtNum(f.tempC[1])} °C`]);
    } else {
      const f = s.f;
      eyebrow = `${t('fk_' + f.kind)} · ${tr(body.name, l)}`;
      key = [];
      if (f.sizeKm) key.push([t('size'), fmtNum(f.sizeKm) + (l === 'zh' ? ' 公里' : ' km')]);
      key.push([t('where'), `${Math.abs(f.lat).toFixed(1)}°${f.lat >= 0 ? 'N' : 'S'} · ${Math.abs(f.lon).toFixed(1)}°${f.lon >= 0 ? 'E' : 'W'}`]);
    }
    const feats = s.kind === 'body' ? featuresOf(s.id) : [];
    const moons = s.kind === 'body' ? BODIES.filter(b => b.parent === s.id && b.kind === 'moon') : [];
    const hasMore = extra.length > 0 || Boolean(it.funFact?.en);
    this.drawHero();
    this.infoMain.replaceChildren(
      h('div', { class: 'info-hero solar-hero' },
        this.hero,
        h('span', { class: 'type-chip', style: `color:${dotColor(body)}` }, body.emoji + ' ' + (s.kind === 'body' ? t('bk_' + body.kind) : t('fk_' + s.f.kind))),
        h('button', { class: 'icon-btn info-x', 'aria-label': t('close'), 'data-testid': 'solar-info-close', html: icon('close', 16), onclick: () => this.showCard(null) })),
      h('div', { class: 'info-body' },
        h('p', { class: 'eyebrow', html: icon(s.kind === 'body' ? 'planet' : 'pin', 13) }, h('span', {}, eyebrow)),
        h('h2', { 'data-testid': 'solar-name' }, tr(it.name, l)),
        alt ? h('p', { class: 'alt-name' }, alt) : null,
        h('p', { class: 'desc' }, tr(it.desc, l)),
        key.length ? h('dl', { class: 'stats-row' }, ...key.map(([k, v]) => stat(k, v))) : null,
        hasMore ? h('details', { class: 'more' },
          h('summary', { html: icon('chevron', 14) }, h('span', {}, t('moreDetails'))),
          it.funFact?.en ? h('p', { class: 'fun' }, h('b', {}, t('funFact')), ' ', tr(it.funFact, l)) : null,
          extra.length ? h('dl', { class: 'facts' }, ...extra.map(([k, v]) => stat(k, v))) : null) : null,
        feats.length ? h('div', { class: 'solar-list' },
          h('h3', {}, t('surface')),
          h('div', { class: 'solar-tags' }, ...feats.map(f => h('button', { class: 'tag-chip', 'data-testid': 'feat-' + f.key, onclick: () => { sfx.tap(); this.view.selectFeature(f); } },
            h('span', { 'aria-hidden': 'true' }, f.emoji), h('span', {}, tr(f.name, l)))))) : null,
        moons.length ? h('div', { class: 'solar-list' },
          h('h3', {}, t('moonsList')),
          h('div', { class: 'solar-tags' }, ...moons.map(m => h('button', { class: 'tag-chip', 'data-testid': 'moon-' + m.id, onclick: () => { sfx.tap(); this.view.select(m.id); } },
            h('i', { class: 'dot', style: `--c:${dotColor(m)}` }), h('span', {}, tr(m.name, l)))))) : null,
        h('div', { class: 'info-footer' },
          s.kind === 'feature' ? h('button', { class: 'pill pill-sm', 'data-testid': 'solar-back-body', onclick: () => this.view.select(body.id) }, t('backTo', { p: tr(body.name, l) })) : null,
          s.kind === 'body' && s.id === 'earth' ? h('button', { class: 'cta cta-sm', 'data-testid': 'solar-enter-earth', html: icon('globe', 16), onclick: () => this.backToEarth() }, h('span', {}, t('enterEarth'))) : null,
          h('button', { class: 'read-more', 'data-testid': 'solar-read-more', 'aria-expanded': String(this.readerOpen), onclick: () => { sfx.tap(); void this.toggleReader(); } },
            h('span', {}, this.readerOpen ? t('readerClose') : t('readMore')), h('span', { html: icon('book', 14) })))));
  }

  private async toggleReader(open = !this.readerOpen): Promise<void> {
    if (open === this.readerOpen || (open && !this.sel)) return;
    this.readerOpen = open;
    this.info.classList.toggle('expanded', open);
    const btn = this.infoMain.querySelector('.read-more');
    btn?.setAttribute('aria-expanded', String(open));
    if (btn?.firstChild) btn.firstChild.textContent = open ? t('readerClose') : t('readMore');
    if (!open) return;
    if (!this.reader) {
      const { Reader } = await import('../ui/reader.ts');
      this.reader ??= new Reader({ close: () => void this.toggleReader(false), pick: () => {} });
    }
    if (!this.readerOpen || !this.sel) return;
    if (!this.reader.el.isConnected) this.info.append(this.reader.el);
    this.reader.show(this.readable());
  }
}
