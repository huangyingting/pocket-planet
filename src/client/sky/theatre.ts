/**
 * The sky theatre: one full-screen stage that plays a sky event. It owns the renderer, the clock and the chrome;
 * scenes (ground / space) draw, acts decide what to show and say.
 */
import * as THREE from 'three';
import type { SkyEvent } from '../../shared/lib/astro/index.ts';
import { tr } from '../../shared/data/types.ts';
import { h } from '../ui/dom.ts';
import { icon } from '../ui/icons.ts';
import { lang } from '../lib/i18n.ts';
import { s, SITES, type SkyKey } from './text.ts';
import { localClock } from './common.ts';
import { GroundSky } from './ground.ts';
import { SpaceScene } from './space.ts';
import { LookControls, OrbitControls } from './controls.ts';
import { buildAct, type Act, type Ctx, type Site, type View } from './acts.ts';
import { Calendar, findEvent, nextHighlight, countdown } from './panel.ts';

export interface TheatreOpts {
  id?: string;
  /** Where the globe was facing (offered as a site). */
  globe?: { lat: number; lon: number };
  lowfx?: boolean;
  /** Device quality: pixel-ratio ceiling and whether to antialias. */
  dprMax?: number;
  msaa?: boolean;
  onClose: () => void;
  onSolar?: (focus: string, ms: number) => void;
}

const SITE_KEY = 'pp.skyObs';
const RATES = [1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8];
const VIEW_KEY: Record<View, SkyKey> = { ground: 'ground', space: 'space', moon: 'fromMoon' };

export class Theatre {
  readonly el: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private ground: GroundSky;
  private space: SpaceScene;
  private ctx: Ctx;
  private cal: Calendar;
  private act!: Act;
  private ev!: SkyEvent;
  private view: View = 'ground';
  private t = 0;
  private playing = true;
  private rateIx = 3;
  private raf = 0;
  private last = 0;
  private uiAcc = 1;
  /** Next frame is a cut: put the camera on its target instead of easing there. */
  private cut = true;
  private siteId: string;
  private ro: ResizeObserver;

  // chrome
  private cv: HTMLCanvasElement;
  private labels = h('div', { class: 'sky-labels', 'aria-hidden': 'true' });
  private titleEl = h('h2', { class: 'sky-title', id: 'sky-title' });
  private dateEl = h('small', { class: 'sky-date' });
  private viewsEl = h('div', { class: 'sky-views', role: 'tablist' });
  private siteSel = h('select', { class: 'sky-select', 'aria-label': s('where') });
  private readEl = h('dl', { class: 'sky-read' });
  private capEl = h('p', { class: 'sky-cap', 'aria-live': 'polite' });
  private noticeEl = h('p', { class: 'sky-notice' });
  private zoomEl = h('div', { class: 'sky-zoom' });
  private solarBtn: HTMLButtonElement;
  private playBtn: HTMLButtonElement;
  private rateEl = h('b', { class: 'sky-rate' });
  private range = h('input', { class: 'sky-range', type: 'range', min: '0', max: '1000', step: '1', 'aria-label': s('timeline') });
  private marksEl = h('div', { class: 'sky-marks' });
  private fillEl = h('i', { class: 'sky-fill' });
  private clockEl = h('output', { class: 'sky-clock' });
  private calBtn: HTMLButtonElement;

  constructor(host: HTMLElement, private opts: TheatreOpts) {
    this.siteId = localStorage.getItem(SITE_KEY) ?? 'best';
    this.cv = h('canvas', { class: 'sky-cv', 'data-testid': 'sky-canvas' });
    this.renderer = new THREE.WebGLRenderer({ canvas: this.cv, antialias: opts.msaa ?? !opts.lowfx, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, opts.dprMax ?? 1.75, opts.lowfx ? 1 : 2));
    this.renderer.setClearColor(0x000000);
    this.ground = new GroundSky(this.labels);
    this.space = new SpaceScene();
    const look = new LookControls(this.cv, this.ground.camera);
    const orbit = new OrbitControls(this.cv, this.space.camera);
    this.ctx = { ground: this.ground, space: this.space, look, orbit, user: false };
    look.onUser = orbit.onUser = () => { this.ctx.user = true; };

    this.solarBtn = h('button', { class: 'sky-btn sky-solar', 'data-testid': 'sky-solar', onclick: () => this.toSolar() },
      h('span', { html: icon('planet', 18) }), h('span', {}, s('openSolar')));
    this.playBtn = h('button', { class: 'sky-btn sky-btn-sq sky-play', 'data-testid': 'sky-play', onclick: () => this.setPlaying(!this.playing) });
    this.calBtn = h('button', {
      class: 'sky-btn sky-calbtn', 'data-testid': 'sky-cal', 'aria-expanded': 'false', onclick: () => this.toggleCal(),
    }, h('span', { html: icon('calendar', 18) }), h('span', {}, s('list')));
    this.cal = new Calendar(() => this.pick(), e => { this.load(e); if (matchMedia('(max-width: 820px)').matches) this.toggleCal(false); });

    this.siteSel.append(
      h('option', { value: 'best' }, s('bestSpot')),
      ...(opts.globe ? [h('option', { value: 'globe' }, s('globeSpot'))] : []),
      ...SITES.map(x => h('option', { value: x.id }, tr(x.name, lang()))));
    if (![...this.siteSel.options].some(o => o.value === this.siteId)) this.siteId = 'best';
    this.siteSel.value = this.siteId;
    this.siteSel.addEventListener('change', () => {
      this.siteId = this.siteSel.value;
      try { localStorage.setItem(SITE_KEY, this.siteId); } catch { /* private mode */ }
      this.cal.render();
      this.load(this.ev, true);
    });

    this.range.addEventListener('input', () => {
      const a = this.act;
      this.t = a.t0 + (a.t1 - a.t0) * Number(this.range.value) / 1000;
      this.uiAcc = 1;
      if (!this.ctx.user) this.cut = true;
    });

    const back = h('button', { class: 'sky-btn sky-btn-sq sky-back', 'data-testid': 'sky-close', 'aria-label': s('close'), html: icon('close', 20), onclick: () => this.close() });
    const head = h('header', { class: 'sky-head' },
      back,
      h('div', { class: 'sky-titles' },
        h('span', { class: 'sky-kicker' }, h('i', { 'aria-hidden': 'true' }), s('theatre'), h('em', {}, 'SKY·THEATRE')),
        this.titleEl, this.dateEl),
      h('div', { class: 'sky-headr' },
        this.viewsEl,
        h('label', { class: 'sky-site' }, h('span', { html: icon('pin', 16) }), this.siteSel),
        this.calBtn));
    const side = h('div', { class: 'sky-side' },
      h('div', { class: 'sky-card' }, h('span', { class: 'sky-card-k' }, 'TELEMETRY'), this.readEl),
      this.solarBtn);
    const story = h('div', { class: 'sky-story' }, this.noticeEl, this.capEl);
    const time = h('footer', { class: 'sky-time' },
      this.playBtn,
      h('div', { class: 'sky-speed', role: 'group', 'aria-label': s('simSpeed') },
        h('button', { class: 'sky-btn sky-btn-sq', 'aria-label': s('slower'), title: s('slower'), html: icon('minus', 16), onclick: () => this.setRate(-1) }),
        this.rateEl,
        h('button', { class: 'sky-btn sky-btn-sq', 'aria-label': s('faster'), title: s('faster'), html: icon('plus', 16), onclick: () => this.setRate(1) })),
      h('div', { class: 'sky-track' }, h('div', { class: 'sky-rail' }, this.fillEl), this.marksEl, this.range),
      this.clockEl);
    const frame = h('div', { class: 'sky-frame', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i'));
    this.el = h('section', { class: 'sky', 'data-testid': 'sky', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sky-title' },
      this.cv, this.labels, frame, h('div', { class: 'sky-hint' }, s('dragHint')),
      head, side, this.zoomEl, story, time, this.cal.el);
    host.append(this.el);
    addEventListener('keydown', this.onKey, true);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.el);
    this.resize();

    const ev = (opts.id && findEvent(opts.id)) || nextHighlight();
    if (ev) this.load(ev);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
    requestAnimationFrame(() => this.el.classList.add('in'));
  }

  // ------------------------------------------------------------------------------------------------ state

  private pick(): Site | null {
    if (this.siteId === 'globe' && this.opts.globe) {
      const g = this.opts.globe;
      return { id: 'globe', name: s('globeSpot'), lat: g.lat, lon: g.lon, tz: Math.round(g.lon / 15) };
    }
    const x = SITES.find(y => y.id === this.siteId);
    return x ? { id: x.id, name: tr(x.name, lang()), lat: x.lat, lon: x.lon, tz: x.tz } : null;
  }

  /** Stage an event (`keep` = same event, new site: keep the moment and the view if possible). */
  load(ev: SkyEvent, keep = false): void {
    const prevT = this.t, prevView = this.view;
    this.ev = ev;
    this.ground.reset();
    this.act = buildAct(ev, this.pick());
    const a = this.act;
    this.ground.obs = { lat: a.site.lat, lon: a.site.lon };
    this.t = keep && prevT >= a.t0 && prevT <= a.t1 ? prevT : a.start;
    this.cal.active = ev.id;
    this.cal.showYear(new Date(ev.t).getUTCFullYear());
    this.cal.render();
    this.titleEl.textContent = a.title;
    const d = new Date(ev.t);
    this.dateEl.textContent = `${d.toLocaleDateString(lang() === 'zh' ? 'zh-CN' : 'en', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })} · ${countdown(ev.t)}`;
    this.noticeEl.textContent = a.notice ?? '';
    this.noticeEl.hidden = !a.notice;
    this.solarBtn.hidden = !a.solar || !this.opts.onSolar;
    this.viewsEl.replaceChildren(...a.views.map(v => h('button', {
      class: 'sky-seg', role: 'tab', 'data-view': v, 'data-testid': `sky-view-${v}`, onclick: () => this.setView(v),
    }, s(VIEW_KEY[v]))));
    this.viewsEl.hidden = a.views.length < 2;
    this.zoomEl.replaceChildren(
      h('button', { class: 'sky-btn sky-zbtn', 'data-z': 'tele', onclick: () => this.zoomTo('tele') }, h('span', { html: icon('telescope', 18) }), h('span', {}, s('tele'))),
      h('button', { class: 'sky-btn sky-zbtn', 'data-z': 'eye', onclick: () => this.zoomTo('eye') }, h('span', { html: icon('eye', 18) }), h('span', {}, s('eye'))));
    const span = a.t1 - a.t0;
    this.marksEl.replaceChildren(...a.marks.map(m => h('button', {
      class: 'sky-mark' + (m.major ? ' major' : ''), style: `left:${((m.t - a.t0) / span) * 100}%`,
      title: s('jumpTo', { m: m.label }), 'aria-label': s('jumpTo', { m: m.label }),
      onclick: () => { this.t = Math.max(a.t0, m.t - span * 0.004); this.setPlaying(true); if (!this.ctx.user) this.cut = true; },
    }, h('span', {}, m.label))));
    this.declutter();
    this.rateIx = 3;
    this.setRate(0);
    this.setPlaying(true);
    this.setView(keep && a.views.includes(prevView) ? prevView : a.view, !keep);
    history.replaceState(null, '', '#sky/' + encodeURIComponent(ev.id));
  }

  /** Contact marks bunch up (C2 / max / C3 sit minutes apart in a 3-hour act): keep labels apart, majors first. */
  private declutter(): void {
    const a = this.act, w = Math.max(200, this.marksEl.clientWidth || this.el.clientWidth * 0.6);
    const order = a.marks.map((m, i) => ({ m, i })).sort((x, y) => Number(!!y.m.major) - Number(!!x.m.major) || x.i - y.i);
    const kept: { x: number; half: number }[] = [];
    for (const { m, i } of order) {
      const x = ((m.t - a.t0) / (a.t1 - a.t0)) * w, half = [...m.label].reduce((n, c) => n + (c.charCodeAt(0) > 0x2e80 ? 11 : 6.8), 0) / 2 + 8;
      const free = kept.every(k => Math.abs(k.x - x) > k.half + half);
      if (free) kept.push({ x, half });
      this.marksEl.children[i]?.classList.toggle('mute', !free);
    }
  }

  /** Current act's span and contact marks (for tests and deep links). */
  get info(): { id: string; view: View; t0: number; t1: number; t: number; marks: { t: number; label: string }[] } {
    const a = this.act;
    return { id: this.ev.id, view: this.view, t0: a.t0, t1: a.t1, t: this.t, marks: a.marks.map(m => ({ t: m.t, label: m.label })) };
  }

  /** Jump the clock (paused unless `play`). */
  seek(t: number, play = false): void {
    this.t = Math.max(this.act.t0, Math.min(this.act.t1, t));
    this.setPlaying(play);
    if (!this.ctx.user) this.cut = true;
  }

  show(v: View): void { if (this.act.views.includes(v)) this.setView(v); }

  private setView(v: View, fovPreset = true): void {
    this.view = v;
    const a = this.act, { look, orbit } = this.ctx;
    this.ctx.user = false;
    look.enabled = v === 'ground';
    orbit.enabled = v !== 'ground';
    this.labels.hidden = v !== 'ground';
    this.zoomEl.hidden = v !== 'ground' || a.fov.tele === a.fov.eye;
    this.el.dataset.view = v;
    for (const b of this.viewsEl.querySelectorAll<HTMLElement>('.sky-seg')) {
      const on = b.dataset.view === v;
      b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on));
    }
    if (v === 'ground') {
      if (fovPreset) look.aim(look.az, look.alt, a.fov[a.fov.start], true);
      this.markZoom();
    } else {
      this.space.camera.fov = 40;
      this.space.camera.updateProjectionMatrix();
    }
    a.enter(v, this.ctx);
    this.uiAcc = 1;
    this.cut = true;
  }

  private zoomTo(z: 'tele' | 'eye'): void {
    const look = this.ctx.look;
    look.aim(look.az, look.alt, this.act.fov[z]);
    this.markZoom(z);
  }

  private markZoom(z?: 'tele' | 'eye'): void {
    const f = this.ctx.look.targetFov, a = this.act;
    const cur = z ?? (Math.abs(Math.log(f / a.fov.tele)) < Math.abs(Math.log(f / a.fov.eye)) ? 'tele' : 'eye');
    for (const b of this.zoomEl.querySelectorAll<HTMLElement>('.sky-zbtn')) b.classList.toggle('on', b.dataset.z === cur);
  }

  private setPlaying(on: boolean): void {
    if (on && this.t >= this.act.t1 - 1) this.t = this.act.t0;
    this.playing = on;
    this.playBtn.innerHTML = icon(on ? 'pause' : 'play', 20);
    this.playBtn.setAttribute('aria-label', s(on ? 'pause' : 'play'));
    this.el.classList.toggle('paused', !on);
  }

  private setRate(d: number): void {
    this.rateIx = Math.max(0, Math.min(RATES.length - 1, this.rateIx + d));
    const r = RATES[this.rateIx];
    this.rateEl.textContent = r >= 1 ? `×${r}` : `×1/${1 / r}`;
  }

  private toggleCal(on?: boolean): void {
    const open = on ?? !this.el.classList.contains('cal-open');
    this.el.classList.toggle('cal-open', open);
    this.calBtn.setAttribute('aria-expanded', String(open));
    if (open) this.cal.render();
  }

  private toSolar(): void {
    const sol = this.act.solar;
    if (!sol || !this.opts.onSolar) return;
    const cb = this.opts.onSolar;
    this.close();
    cb(sol.focus, sol.ms);
  }

  private onKey = (e: KeyboardEvent): void => {
    if (document.querySelector('.modal')) return;
    // the globe and Solar System listen on document: keep keys meant for the theatre away from them
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.stopPropagation(); return; }
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      if (this.el.classList.contains('cal-open')) this.toggleCal(false); else this.close();
      return;
    }
    if (e.target instanceof HTMLSelectElement || e.target instanceof HTMLButtonElement) return;
    if (e.key === ' ') { e.preventDefault(); e.stopPropagation(); this.setPlaying(!this.playing); }
    else if (e.key === '+' || e.key === '=') { e.stopPropagation(); this.setRate(1); }
    else if (e.key === '-') { e.stopPropagation(); this.setRate(-1); }
  };

  // ------------------------------------------------------------------------------------------------ loop

  private resize(): void {
    const w = Math.max(1, this.el.clientWidth), hh = Math.max(1, this.el.clientHeight);
    this.renderer.setSize(w, hh, false);
    for (const c of [this.ground.camera, this.space.camera]) { c.aspect = w / hh; c.updateProjectionMatrix(); }
    this.ground.rendererH = hh * this.renderer.getPixelRatio();
    this.el.classList.toggle('narrow', w < 720);
    if (this.act) this.declutter();
  }

  private loop = (now: number): void => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const a = this.act;
    if (!a) return;
    let rate = 0;
    if (this.playing) {
      rate = a.rate * RATES[this.rateIx] * (a.slow?.(this.t) ?? 1);
      this.t += dt * 1000 * rate;
      if (this.t >= a.t1) { this.t = a.t1; this.setPlaying(false); }
    }
    const ms = a.at?.(this.t) ?? this.t;
    const simRate = a.at ? 0 : rate;
    let fr;
    if (this.view === 'ground') {
      this.ground.update(ms, dt, simRate);
      fr = a.frame(ms, 'ground', this.ctx);
      if (this.cut) this.ctx.look.settle();
      this.ctx.look.update(dt);
      this.ground.placeLabels(this.el.clientWidth, this.el.clientHeight);
      this.ground.render(this.renderer);
    } else {
      this.space.update(ms, dt);
      fr = a.frame(ms, this.view, this.ctx);
      if (this.cut) this.ctx.orbit.settle();
      this.ctx.orbit.update(dt);
      this.space.render(this.renderer);
    }
    if (this.cut) { this.cut = false; this.uiAcc = 1; }
    this.uiAcc += dt;
    if (this.uiAcc >= 0.12) {
      this.uiAcc = 0;
      this.paintUi(ms, fr);
    }
  };

  private paintUi(ms: number, fr: { caption: string; read: [string, string][] }): void {
    const a = this.act, k = (this.t - a.t0) / (a.t1 - a.t0);
    if (document.activeElement !== this.range) this.range.value = String(Math.round(k * 1000));
    this.fillEl.style.width = `${k * 100}%`;
    const site = a.site;
    this.clockEl.textContent = a.days ? localClock(ms, site.tz, true, lang()) : localClock(ms, site.tz, false, lang());
    if (this.capEl.textContent !== fr.caption) {
      this.capEl.textContent = fr.caption;
      this.capEl.classList.remove('flash'); void this.capEl.offsetWidth; this.capEl.classList.add('flash');
    }
    const rows = fr.read;
    if (this.readEl.childElementCount !== rows.length * 2) this.readEl.replaceChildren(...rows.flatMap(() => [h('dt'), h('dd')]));
    rows.forEach(([key, v], i) => {
      const dt = this.readEl.children[i * 2] as HTMLElement, dd = this.readEl.children[i * 2 + 1] as HTMLElement;
      if (dt.textContent !== key) dt.textContent = key;
      if (dd.textContent !== v) dd.textContent = v;
    });
    if (this.view === 'ground') this.markZoom();
  }

  close(): void {
    if (!this.el.isConnected) return;
    cancelAnimationFrame(this.raf);
    removeEventListener('keydown', this.onKey, true);
    this.ro.disconnect();
    this.ctx.look.dispose(); this.ctx.orbit.dispose();
    this.ground.dispose(); this.space.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.el.remove();
    if (location.hash.startsWith('#sky')) history.replaceState(null, '', location.pathname + location.search);
    this.opts.onClose();
  }
}
