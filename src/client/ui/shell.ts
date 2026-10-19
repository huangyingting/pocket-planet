import { h, closeModal, openModal, toast, $ } from './dom.ts';
import { t, lang, setLang, countryName, fmtNum, onLang } from '../lib/i18n.ts';
import { store, updateProgress, updateSettings, resetSettings, subscribe } from '../store.ts';
import { tr, LANGS, type CatalogueItem, type Lang } from '../../shared/data/types.ts';
import { CATALOGUE, LANDMARKS, ANIMALS, DISCOVERIES, VEHICLES } from '../../shared/data/catalogue.ts';
import { CITIES } from '../../shared/data/cities.ts';
import { CONTINENT_NAMES } from '../../shared/data/iso.ts';
import { AURA_PRESETS, type AuraPreset, type SurfaceMode, type Globe, type Settings } from '../globe/scene.ts';
import { createModelPreview } from '../models/preview.ts';
import { sfx, setMusic } from '../lib/sfx.ts';
import { api } from '../lib/api.ts';
import { HAS_API, url } from '../lib/env.ts';

export const DEX_ZOOM = 10;
const LANG_LABEL: Record<Lang, string> = { en: 'English', ko: '한국어', ja: '日本語', zh: '中文' };
const TYPE_KEY = { landmark: 'tLandmark', animal: 'tAnimal', discovery: 'tDiscovery', vehicle: 'tVehicle' } as const;
const SECTION = { landmark: 'landmarks', animal: 'animals', discovery: 'discover', vehicle: '' } as const;
const AURA_ORDER: AuraPreset[] = ['waves', 'aurora', 'ember', 'dusk', 'sculpture'];

export interface ShellHooks {
  openPhoto: () => void; openCollection: () => void; openGames: () => void; openTutorial: () => void;
  openAccount: () => void; openGuestbook: () => void; openCredits: () => void;
}

export class Shell {
  private zoomEl = h('span', { class: 'zoom-readout', 'data-testid': 'zoom' }, '×4.0');
  private info = h('aside', { id: 'info', class: 'info hidden', 'aria-live': 'polite', 'data-testid': 'info' });
  private menu = h('div', { id: 'menu', class: 'menu hidden', role: 'dialog', 'aria-label': 'Menu' });
  private hints = h('div', { class: 'hints hidden', id: 'hints' });
  private rideBar = h('div', { class: 'ride-bar hidden', 'data-testid': 'ride-bar' });
  private tipEl = h('div', { id: 'tip', class: 'globe-tip hidden', 'aria-hidden': 'true' });
  private counts = h('p', { class: 'counts' });
  current: CatalogueItem | null = null;

  constructor(private root: HTMLElement, private globe: Globe, private hooks: ShellHooks) {}

  mount(): void {
    const tool = (id: string, emoji: string, key: string, fn: () => void) =>
      h('button', { class: 'tool', id, 'data-testid': id, onclick: () => { sfx.tap(); fn(); } }, h('span', { class: 'tool-ico', 'aria-hidden': 'true' }, emoji), h('span', { 'data-i18n': key }, t(key)));
    const top = h('header', { class: 'topbar' },
      h('div', { class: 'brand' },
        h('div', { class: 'brand-main' },
          h('span', { class: 'live-dot', 'aria-hidden': 'true' }),
          h('h1', { 'data-i18n': 'title' }, t('title')),
          h('span', { class: 'badge', 'data-i18n': 'badge' }, t('badge')),
          this.zoomEl,
        ),
        h('div', { class: 'sub' }, this.counts)),
      h('div', { class: 'omnibar', role: 'search' },
        h('button', { class: 'omni-search', id: 'btn-search', title: t('search'), 'aria-label': t('search'), onclick: () => { sfx.tap(); this.openSearch(); } },
          h('span', { class: 'omni-ico', 'aria-hidden': 'true' }, '🔍'),
          h('span', { class: 'omni-placeholder', 'data-i18n': 'searchPlaceholder' }, t('searchPlaceholder')),
          h('kbd', { class: 'omni-kbd', 'aria-hidden': 'true' }, '⌘K')),
        h('span', { class: 'omni-sep', 'aria-hidden': 'true' }),
        h('button', { class: 'omni-btn', id: 'btn-random', title: t('randomHop'), 'aria-label': t('randomHop'), onclick: () => { sfx.tap(); this.randomHop(); } }, '🎲'),
        h('button', { class: 'omni-btn', id: 'btn-aura', title: t('auraPreset'), 'aria-label': t('auraPreset'), onclick: () => { sfx.tap(); this.cycleAura(); } }, '✨')),
      h('nav', { class: 'tools', 'aria-label': 'Tools' },
        tool('btn-photo', '📷', 'photo', this.hooks.openPhoto),
        tool('btn-collection', '📚', 'collection', this.hooks.openCollection),
        tool('btn-game', '🎯', 'game', this.hooks.openGames),
        tool('btn-menu', '☰', 'menu', () => this.toggleMenu())));
    const bottomLeft = h('div', { class: 'bl' }, this.hints,
      h('button', { class: 'round-btn help', id: 'btn-help', 'aria-label': t('help'), 'aria-expanded': 'false', onclick: () => this.toggleHints() }, '?'));
    const bottomRight = h('div', { class: 'br' },
      h('button', { class: 'round-btn', 'aria-label': t('fullscreen'), onclick: () => this.fullscreen() }, '⛶'),
      h('button', { class: 'round-btn', id: 'btn-zoom-in', 'aria-label': t('zoomIn'), onclick: () => this.globe.zoomBy(1.6) }, '+'),
      h('button', { class: 'round-btn', id: 'btn-zoom-out', 'aria-label': t('zoomOut'), onclick: () => this.globe.zoomBy(1 / 1.6) }, '−'));
    this.root.append(top, bottomLeft, bottomRight, this.info, this.menu, this.rideBar, this.tipEl);
    this.renderHints();
    this.renderMenu();
    this.renderCounts();
    subscribe(() => { if (this.current) this.renderInfo(this.current); if (!this.menu.classList.contains('hidden')) this.renderMenu(); });
    onLang(() => this.relabel());
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openSearch();
        return;
      }
      if (e.key !== 'Escape') return;
      if (closeModal()) return;
      if (!this.menu.classList.contains('hidden')) { this.toggleMenu(false); return; }
      if (this.globe.ride) { this.exitRide(); return; }
      if (this.current) this.showItem(null);
    });
    document.addEventListener('pointerdown', e => {
      if (this.menu.classList.contains('hidden')) return;
      const tgt = e.target as Node;
      if (!this.menu.contains(tgt) && !$('#btn-menu').contains(tgt)) this.toggleMenu(false);
    });
  }

  showHover(item: CatalogueItem | null, screen: { x: number; y: number } | null): void {
    if (!item || !screen || this.globe.gameMode || this.globe.ride) {
      this.tipEl.classList.add('hidden');
      return;
    }
    const l = lang();
    const where = countryName(item.country, l) || (CONTINENT_NAMES[item.continent]?.[l] ?? '');
    this.tipEl.replaceChildren(
      h('span', { class: 'tip-emoji' }, item.emoji),
      h('span', { class: 'tip-name' }, tr(item.name, l)),
      ...(where ? [h('span', { class: 'tip-sub' }, where)] : []),
    );
    this.tipEl.style.transform = `translate(${screen.x.toFixed(1)}px, ${(screen.y - 26).toFixed(1)}px) translate(-50%, -100%)`;
    this.tipEl.classList.remove('hidden');
  }

  private randomHop(): void {
    const pool = CATALOGUE.filter(i => i.type !== 'vehicle' && i.key !== this.current?.key);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) this.showItem(pick, true);
  }

  private cycleAura(): void {
    const cur = store.settings.auraPreset ?? 'waves';
    const next = AURA_ORDER[(AURA_ORDER.indexOf(cur) + 1) % AURA_ORDER.length];
    updateSettings({ auraPreset: next });
    toast(`✨ ${AURA_PRESETS[next].label}`);
  }

  private openSearch(): void {
    const l = lang();
    let query = '';
    let filter: 'all' | CatalogueItem['type'] = 'all';
    const listEl = h('div', { class: 'dex-grid search-grid' });
    const renderList = () => {
      const q = query.trim().toLowerCase();
      const matches = CATALOGUE.filter(it => {
        if (filter !== 'all' && it.type !== filter) return false;
        if (!q) return true;
        return tr(it.name, l).toLowerCase().includes(q) ||
          it.name.en.toLowerCase().includes(q) ||
          countryName(it.country, l).toLowerCase().includes(q) ||
          it.sub.toLowerCase().includes(q);
      });
      if (!matches.length) {
        listEl.replaceChildren(h('p', { class: 'muted' }, t('notFound')));
        return;
      }
      listEl.replaceChildren(...matches.map(it =>
        h('button', {
          class: 'dex-card unlocked',
          onclick: () => { closeModal(); this.showItem(it, true); },
        },
          h('span', { class: 'dex-emoji' }, it.emoji),
          h('strong', {}, tr(it.name, l)),
          h('small', {}, countryName(it.country, l) || t(TYPE_KEY[it.type]))
        )
      ));
    };
    const input = h('input', {
      type: 'search',
      class: 'input',
      placeholder: t('searchPlaceholder'),
      oninput: () => { query = input.value; renderList(); },
    });
    const filterBar = h('div', { class: 'seg-row' },
      ...(['all', 'landmark', 'animal', 'discovery', 'vehicle'] as const).map(f =>
        h('button', {
          class: 'pill' + (filter === f ? ' active' : ''),
          onclick: e => {
            filter = f;
            (e.currentTarget as HTMLElement).parentElement?.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
            (e.currentTarget as HTMLElement).classList.add('active');
            renderList();
          },
        }, f === 'all' ? t('filterAll') : t(TYPE_KEY[f]))
      )
    );
    renderList();
    openModal('search', '🔍 ' + t('search'), h('div', { class: 'search-modal' }, input, filterBar, listEl), { wide: true });
    setTimeout(() => input.focus(), 40);
  }

  private relabel(): void {
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => (el.textContent = t(el.dataset.i18n!)));
    document.title = t('title');
    this.renderHints(); this.renderCounts();
    this.globe.lang = lang(); this.globe.markDirty();
    if (!this.menu.classList.contains('hidden')) this.renderMenu();
    if (this.current) this.renderInfo(this.current);
  }

  private renderCounts(): void {
    this.counts.textContent = t('counts', { l: LANDMARKS.length, c: 177, ci: CITIES.length, a: ANIMALS.length, d: DISCOVERIES.length, v: VEHICLES.length });
  }

  private dexClose: boolean | null = null;
  setZoom(z: number): void {
    this.zoomEl.textContent = '×' + z.toFixed(1);
    // onView fires on every dirty frame; only rebuild the dex row when crossing the collect threshold
    const close = z >= DEX_ZOOM;
    if (this.current?.type === 'animal' && close !== this.dexClose) this.renderDexRow();
  }

  private renderHints(): void {
    this.hints.replaceChildren(
      h('p', { html: t('hintDrag') }), h('p', { html: t('hintZoom') }), h('p', { html: t('hintTap') }),
      h('button', { class: 'chip', id: 'btn-tutorial', onclick: () => { this.toggleHints(false); this.hooks.openTutorial(); } }, t('tutorialAgain')));
  }
  toggleHints(force?: boolean): void {
    const show = force ?? this.hints.classList.contains('hidden');
    this.hints.classList.toggle('hidden', !show);
    $('#btn-help').setAttribute('aria-expanded', String(show));
  }

  toggleMenu(force?: boolean): void {
    const show = force ?? this.menu.classList.contains('hidden');
    if (show) this.renderMenu();
    this.menu.classList.toggle('hidden', !show);
    $('#btn-menu').classList.toggle('active', show);
    $('#btn-menu').setAttribute('aria-expanded', String(show));
  }

  private renderMenu(): void {
    const s = store.settings;
    const sw = (key: keyof Settings, emoji: string) => {
      const input = h('input', { type: 'checkbox', role: 'switch', 'data-testid': 'set-' + key, checked: Boolean(s[key]) });
      input.addEventListener('change', () => {
        sfx.tap();
        if (key === 'terrain') {
          updateSettings({ terrain: input.checked, surfaceMode: input.checked ? 'realistic' : 'political' });
        } else {
          updateSettings({ [key]: input.checked });
        }
      });
      return h('label', { class: 'switch-card' }, h('span', { class: 'sw-emoji', 'aria-hidden': 'true' }, emoji), h('span', { class: 'sw-label' }, t(key)), input, h('span', { class: 'sw-track', 'aria-hidden': 'true' }));
    };
    const curMode: SurfaceMode = s.surfaceMode ?? (s.terrain ? 'realistic' : 'political');
    const modeRow = h('div', { class: 'seg-row' },
      ...([
        ['realistic', t('modeSat'), { terrain: true, surfaceMode: 'realistic' as SurfaceMode }],
        ['minimal', t('modeVec'), { surfaceMode: 'minimal' as SurfaceMode }],
        ['political', t('modePol'), { terrain: false, surfaceMode: 'political' as SurfaceMode }],
      ] as const).map(([m, label, patch]) =>
        h('button', {
          class: 'pill' + (curMode === m ? ' active' : ''),
          'data-testid': 'mode-' + m,
          onclick: () => { sfx.tap(); updateSettings(patch); },
        }, label)
      )
    );
    const curAura: AuraPreset = s.auraPreset ?? 'waves';
    const auraRow = h('div', { class: 'seg-row aura-row' },
      ...AURA_ORDER.map(p =>
        h('button', {
          class: 'pill aura-pill' + (curAura === p ? ' active' : ''),
          'data-testid': 'aura-' + p,
          onclick: () => { sfx.tap(); updateSettings({ auraPreset: p }); },
        },
          h('span', { class: 'aura-dot', style: `background:${AURA_PRESETS[p].colors[0]}` }),
          AURA_PRESETS[p].label,
        )
      )
    );
    const sel = h('select', { id: 'lang-select', 'aria-label': t('language') }, ...LANGS.map(l => h('option', { value: l, selected: l === lang() }, LANG_LABEL[l])));
    sel.addEventListener('change', () => setLang(sel.value as Lang));
    const row = (emoji: string, label: string, ctl: Node) => h('div', { class: 'menu-row' }, h('span', { 'aria-hidden': 'true' }, emoji), h('span', { class: 'grow' }, label), ctl);
    this.menu.replaceChildren(
      h('h3', {}, t('surfaceMode')), modeRow,
      h('h3', {}, t('auraPreset')), auraRow,
      h('h3', {}, t('mMap')), h('div', { class: 'grid2' }, sw('terrain', '⛰️'), sw('names', '🏷️'), sw('borders', '🌐'), sw('shadows', '🌗')),
      h('h3', {}, t('mGlobe')), h('div', { class: 'grid2' }, sw('landmarks', '🏛️'), sw('animals', '🦁'), sw('discoveries', '🔍'), sw('vehicles', '🚢')),
      h('h3', {}, t('mSettings')), h('div', { class: 'grid2' }, sw('sfx', '🔊'), sw('bgm', '🎵')),
      row('🌏', t('language'), sel),
      row('↩️', t('reset'), h('button', { class: 'pill', 'data-testid': 'reset', onclick: () => { if (confirm(t('resetConfirm'))) { resetSettings(); this.globe.flyTo(25, 40, 2.2); } } }, t('resetBtn'))),
      ...(HAS_API ? [row('👤', store.me ? t('signedInAs', { e: store.me.handle ?? store.me.email }) : t('account'), h('button', { class: 'pill', 'data-testid': 'menu-account', onclick: () => { this.toggleMenu(false); this.hooks.openAccount(); } }, store.me ? t('account') : t('signIn'))),
      row('💬', t('guestbook'), h('button', { class: 'pill', 'data-testid': 'menu-guestbook', onclick: () => { this.toggleMenu(false); this.hooks.openGuestbook(); } }, t('open')))] : []),
      h('footer', { class: 'menu-links' },
        h('a', { href: url('about/') }, t('about')), h('a', { href: url('landmarks/') }, t('encyclopedia')),
        h('button', { class: 'link', onclick: () => { this.toggleMenu(false); this.hooks.openCredits(); } }, t('credits')), h('a', { href: url('privacy/') }, t('privacy'))));
  }

  applySettings(s: Settings): void {
    this.globe.applySettings(s);
    sfx.setEnabled(s.sfx);
    setMusic(s.bgm);
  }

  // ---------- info card ----------
  showItem(item: CatalogueItem | null, fly = true): void {
    const prev = this.current;
    this.current = item;
    this.globe.select(item?.key ?? null);
    if (!item) {
      this.info.classList.add('hidden');
      if (prev && decodeURIComponent(location.hash.slice(1)) === prev.key) history.replaceState(null, '', location.pathname + location.search);
      return;
    }
    sfx.pop();
    history.replaceState(null, '', '#' + item.key);
    if (fly) {
      const minZoomH = item.type === 'animal'
        ? (item.tier === 3 ? 1.5 : item.tier === 2 ? 1.9 : this.globe.h)
        : (item.tier === 3 ? 1.45 : 1.75);
      this.globe.flyTo(item.lat, item.lon, Math.min(this.globe.h, minZoomH));
    }
    this.renderInfo(item);
    this.info.classList.remove('hidden');
  }

  private dexRow = h('div', { class: 'dex-row' });

  private renderDexRow(): void {
    const it = this.current;
    this.dexClose = this.globe.zoom >= DEX_ZOOM;
    if (!it) return;
    const p = store.progress;
    if (it.type === 'animal') {
      const have = it.key in p.dex;
      const close = this.globe.zoom >= DEX_ZOOM;
      this.dexRow.replaceChildren(have ? h('span', { class: 'ok' }, t('collected'))
        : close ? h('button', { class: 'cta', 'data-testid': 'add-dex', onclick: () => { updateProgress(pp => { pp.dex[it.key] = Date.now(); }); sfx.good(); toast('📖 ' + tr(it.name, lang())); } }, '📖 ' + t('addDex'))
          : h('span', { class: 'muted' }, t('collectHint', { z: DEX_ZOOM }), ' ', h('button', { class: 'pill', 'data-testid': 'zoom-close', onclick: () => this.globe.flyTo(it.lat, it.lon, 0.8) }, '🔍')));
    } else if (it.type === 'discovery') {
      const have = it.key in p.logs;
      this.dexRow.replaceChildren(have ? h('span', { class: 'ok' }, t('logged'))
        : h('button', { class: 'cta', 'data-testid': 'log-discovery', onclick: () => { updateProgress(pp => { pp.logs[it.key] = Date.now(); }); sfx.good(); } }, '🔍 ' + t('logIt')));
    } else this.dexRow.replaceChildren();
  }

  private renderInfo(it: CatalogueItem): void {
    const l = lang();
    const f = it.facts ?? {};
    const nf = (n: number, unit: string) => fmtNum(n) + unit;
    const chips: [string, string][] = [];
    if (f.built !== undefined) chips.push([t('built'), f.built < 0 ? `${-f.built} BCE` : String(f.built)]);
    if (f.year !== undefined) chips.push([t('year'), String(f.year)]);
    if (f.heightM) chips.push([t('height'), nf(f.heightM, ' m')]);
    if (f.lengthM) chips.push([t('length'), f.lengthM >= 10000 ? nf(Math.round(f.lengthM / 1000), ' km') : nf(f.lengthM, ' m')]);
    if (f.depthM) chips.push([t('depth'), nf(f.depthM, ' m')]);
    if (f.weightKg) chips.push([t('weight'), f.weightKg >= 1000 ? nf(Math.round(f.weightKg / 100) / 10, ' t') : nf(f.weightKg, ' kg')]);
    if (f.speedKmh) chips.push([t('speed'), nf(f.speedKmh, ' km/h')]);
    if (f.lifespanY) chips.push([t('lifespan'), nf(f.lifespanY, l === 'en' ? ' yrs' : '')]);
    if (it.diet) chips.push([t('diet'), t(it.diet)]);
    if (it.status) chips.push([t('status'), t(it.status)]);
    if (it.type !== 'vehicle') chips.push([t('latitude'), `${Math.abs(it.lat).toFixed(1)}°${t(it.lat >= 0 ? 'north' : 'south')}`]);
    const where = [countryName(it.country, l), CONTINENT_NAMES[it.continent]?.[l]].filter(Boolean).join(' · ');
    const coordStr = `${Math.abs(it.lat).toFixed(1)}°${it.lat >= 0 ? 'N' : 'S'} · ${Math.abs(it.lon).toFixed(1)}°${it.lon >= 0 ? 'E' : 'W'}`;
    const p = store.progress;
    const react = (kind: 'like' | 'visited', emoji: string) => {
      const on = kind === 'like' ? it.key in p.likes : it.key in p.visited;
      const count = h('span', { class: 'count', 'data-count': kind });
      return h('button', { class: 'react' + (on ? ' on' : ''), 'aria-pressed': String(on), 'data-testid': 'react-' + kind,
        onclick: () => {
          const now = !on;
          updateProgress(pp => { const m = kind === 'like' ? pp.likes : pp.visited; if (now) m[it.key] = Date.now(); else delete m[it.key]; });
          if (store.me) void api.react(it.key, kind, now).then(r => this.setCounts(r)).catch(() => {});
        } }, emoji + ' ' + t(kind), count);
    };
    const secondary = l !== 'en' ? it.name.en : it.name.ko;
    const section = SECTION[it.type];
    this.renderDexRow();
    this.info.replaceChildren(
      h('button', { class: 'icon-btn info-x', 'aria-label': t('close'), 'data-testid': 'info-close', onclick: () => this.showItem(null) }, '✕'),
      h('div', { class: 'info-hero', 'data-type': it.type },
        h('div', { class: 'info-hero-top' },
          h('span', { class: 'type-chip t-' + it.type }, t(TYPE_KEY[it.type])),
          h('span', { class: 'coord-chip' }, coordStr),
        ),
        createModelPreview(it, { width: 340, height: 164, id: 'info-preview' }),
        it.type !== 'animal' ? h('button', { class: 'pill pill-sm info-zoom-btn', onclick: () => this.globe.flyTo(it.lat, it.lon, 0.25) }, '🔍 ' + t('zoomClose')) : null,
      ),
      h('div', { class: 'info-body' },
        h('div', { class: 'info-title-block' },
          h('h2', { 'data-testid': 'info-name' }, tr(it.name, l)),
          secondary ? h('span', { class: 'alt-name' }, secondary) : null,
        ),
        where ? h('p', { class: 'meta' }, '📍 ' + where) : null,
        h('p', { class: 'desc' }, tr(it.desc, l)),
        it.habitat ? h('p', { class: 'meta' }, '🏞️ ' + t('habitat') + ': ' + tr(it.habitat, l)) : null,
        chips.length ? h('dl', { class: 'facts' }, ...chips.map(([k, v]) => h('div', {}, h('dt', {}, k), h('dd', {}, v)))) : null,
        it.funFact ? h('p', { class: 'fun' }, h('b', {}, '💡 ' + t('funFact') + ' '), tr(it.funFact, l)) : null,
        this.dexRow,
        h('div', { class: 'info-footer' },
          it.type !== 'vehicle' ? h('div', { class: 'reactions' }, react('like', '♥'), react('visited', '🧳')) : null,
          it.route ? h('div', { class: 'ride-row' }, h('button', { class: 'cta', 'data-testid': 'ride', onclick: () => this.startRide(it) }, '🎢 ' + t('ride'))) : null,
          section ? h('a', { class: 'read-more', href: url(`${section}/${it.slug}/`) }, t('readMore') + ' →') : null)));
    if (HAS_API && it.type !== 'vehicle') void api.reactions(it.key).then(r => this.setCounts(r)).catch(() => {});
  }

  private setCounts(r: { like: number; visited: number }): void {
    this.info.querySelectorAll<HTMLElement>('[data-count]').forEach(el => { const n = r[el.dataset.count as 'like' | 'visited']; el.textContent = n ? ' ' + fmtNum(n) : ''; });
  }

  // ---------- ride ----------
  startRide(it: CatalogueItem): void {
    if (!this.globe.startRide(it.key)) return;
    this.info.classList.add('hidden');
    document.body.classList.add('riding');
    let first = false;
    const viewBtn = h('button', { class: 'pill', 'data-testid': 'ride-view', onclick: () => { first = !first; this.globe.setRideView(first); viewBtn.textContent = first ? '🎥 3rd' : '👀 1st'; } }, '👀 1st');
    this.rideBar.replaceChildren(h('strong', {}, it.emoji + ' ' + tr(it.name, lang())), viewBtn,
      h('button', { class: 'pill danger', 'data-testid': 'ride-exit', onclick: () => this.exitRide() }, t('exitRide')), h('span', { class: 'tip' }, t('rideTip')));
    this.rideBar.classList.remove('hidden');
  }
  exitRide(): void {
    this.globe.stopRide();
    document.body.classList.remove('riding');
    this.rideBar.classList.add('hidden');
    if (this.current) this.info.classList.remove('hidden');
  }

  private fullscreen(): void {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => toast('Fullscreen is not available here'));
  }
}
