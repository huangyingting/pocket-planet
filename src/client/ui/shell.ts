import { h, closeModal, openModal, toast, $ } from './dom.ts';
import { t, lang, setLang, countryName, fmtNum, onLang } from '../lib/i18n.ts';
import { store, updateProgress, updateSettings, resetSettings, subscribe } from '../store.ts';
import { tr, LANGS, type CatalogueItem, type Lang } from '../../shared/data/types.ts';
import { CATALOGUE, BY_TYPE } from '../../shared/data/catalogue.ts';
import { TYPE_META, TYPE_ORDER } from '../../shared/data/typemeta.ts';
import { CONTINENT_NAMES } from '../../shared/data/iso.ts';
import { AURA_PRESETS, type AuraPreset, type SurfaceMode, type Globe, type Settings } from '../globe/scene.ts';
import { createModelPreview } from '../models/preview.ts';
import { icon, TYPE_ICON, type IconName } from './icons.ts';
import { sfx, callFor, speak } from '../lib/sfx.ts';
import { music } from '../lib/music.ts';
import type { GREETINGS as Greetings } from '../../shared/data/greetings.ts';
// fetched next to the entry instead of inside it: only the "Say hello" button needs it
let GREETINGS: typeof Greetings | null = null;
const greetingsReady = import('../../shared/data/greetings.ts').then(m => { GREETINGS = m.GREETINGS; }, () => {});
import { TimeMachine } from './timemachine.ts';
import { api } from '../lib/api.ts';
import { HAS_API, url } from '../lib/env.ts';
import { sessionOnly } from '../lib/storage.ts';
import type { SpaceHit } from '../solar/space-index.ts';
import { searchAll, type SearchFilter } from '../lib/search.ts';
import { groupOf } from '../lib/compare.ts';
import { narrate, narrationSupported, splitSentences, stopNarration, type Narration } from '../lib/narrate.ts';
import { offlineSupported, offlineOn, offlineInfo, enableOffline, disableOffline, savePack, mb } from '../lib/offline.ts';
import { classroom, setClassroom, setStill, motion, onClassroom } from '../lib/classroom.ts';

export const DEX_ZOOM = 10;
const LANG_LABEL: Record<Lang, string> = { en: 'English', zh: '中文' };
const typeName = (ty: CatalogueItem['type']) => tr(TYPE_META[ty].one, lang());
const AURA_ORDER: AuraPreset[] = ['waves', 'aurora', 'ember', 'dusk', 'sculpture'];

export interface ShellHooks {
  openPhoto: () => void; openCollection: () => void; openGames: () => void; openTutorial: () => void; openTours: () => void; openBookmarks: () => void; openCompare: (id?: string) => void;
  openAccount: () => void; openGuestbook: () => void;
  openSolar: () => void;
  openSky: () => void;
  /** Earth radio on/off. */
  openRadio?: () => void;
  /** In space: a picked Earth item first takes you home (true = handled, the shell does nothing more). */
  toEarth?: (it: CatalogueItem) => boolean;
  /** In space the +/−/overview buttons drive the space view (true = handled). */
  zoom?: (inward: boolean) => boolean;
  overview?: () => void;
}

export class Shell {
  private zoomEl = h('span', { class: 'zoom-readout', 'data-testid': 'zoom' }, '×4.0');
  private coordLat = h('b', {}, '');
  private coordLon = h('b', {}, '');
  private coordEl = h('div', { class: 'coord-readout', 'aria-hidden': 'true' }, h('i', { class: 'coord-reticle' }), this.coordLat, h('span', { class: 'coord-sep' }), this.coordLon);
  private infoMain = h('div', { class: 'info-main', 'aria-live': 'polite' });
  private info = h('aside', { id: 'info', class: 'info hidden', 'data-testid': 'info' }, this.infoMain);
  private reader: import('./reader.ts').Reader | null = null;
  private readerOpen = false;
  private menu = h('div', { id: 'menu', class: 'menu hidden', role: 'dialog', 'aria-label': t('menu') });
  private hints = h('div', { class: 'hints hidden', id: 'hints' });
  private rideBar = h('div', { class: 'ride-bar hidden', 'data-testid': 'ride-bar' });
  private tipEl = h('div', { id: 'tip', class: 'globe-tip hidden', 'aria-hidden': 'true' });
  /** Top-centre slot: the search bar on Earth, back + breadcrumbs in space. */
  readonly topSlot = h('div', { class: 'top-center' });
  private space = false;
  current: CatalogueItem | null = null;
  readonly time: TimeMachine;

  constructor(private root: HTMLElement, private globe: Globe, private hooks: ShellHooks) {
    this.time = new TimeMachine(globe, it => this.showItem(it), open => { $('#btn-time')?.classList.toggle('active', open); $('#btn-time')?.setAttribute('aria-pressed', String(open)); });
  }

  mount(): void {
    // Global tools stay on every level; `earth-only` ones need the globe and hide in space.
    const tool = (id: string, ico: IconName, key: string, fn: () => void, cls = '') =>
      h('button', { class: 'tool' + (cls ? ' ' + cls : ''), id, 'data-testid': id, title: t(key), html: icon(ico, 19), onclick: () => { sfx.tap(); fn(); } },
        h('span', { class: 'sr-only', 'data-i18n': key }, t(key)));
    this.topSlot.append(
      h('div', { class: 'omnibar', role: 'search' },
        h('button', { class: 'omni-search', id: 'btn-search', 'aria-label': t('search'), html: icon('search', 17), onclick: () => { sfx.tap(); this.openSearch(); } },
          h('span', { class: 'omni-placeholder', 'data-i18n': 'searchPlaceholder' }, t('searchPlaceholder')),
          h('kbd', { class: 'omni-kbd', 'aria-hidden': 'true' }, '⌘K')),
        h('button', { class: 'omni-btn', id: 'btn-random', title: t('randomHop'), 'aria-label': t('randomHop'), html: icon('shuffle', 17), onclick: () => { sfx.tap(); this.randomHop(); } })));
    const top = h('header', { class: 'topbar' },
      h('div', { class: 'brand' },
        h('span', { class: 'brand-mark', 'aria-hidden': 'true' }),
        h('h1', { 'data-i18n': 'title' }, t('title')),
        h('span', { class: 'class-badge', 'data-testid': 'class-badge', 'data-i18n': 'classroom' }, t('classroom'))),
      this.topSlot,
      h('nav', { class: 'tools', 'aria-label': t('tools') },
        tool('btn-find', 'search', 'search', () => this.openSearch(), 'space-only'),
        tool('btn-photo', 'camera', 'photo', this.hooks.openPhoto),
        tool('btn-collection', 'collection', 'collection', this.hooks.openCollection),
        tool('btn-game', 'game', 'game', this.hooks.openGames, 'earth-only'),
        tool('btn-time', 'clock', 'timeMachine', () => this.time.toggle(), 'earth-only'),
        tool('btn-radio', 'radio', 'radio', () => this.hooks.openRadio?.(), 'earth-only'),
        tool('btn-solar', 'planet', 'solarSystem', this.hooks.openSolar, 'earth-only'),
        tool('btn-sky', 'eclipse', 'skyEvents', this.hooks.openSky),
        h('span', { class: 'tools-sep', 'aria-hidden': 'true' }),
        tool('btn-menu', 'menu', 'menu', () => this.toggleMenu())));
    const bottomLeft = h('div', { class: 'bl' }, this.hints,
      h('button', { class: 'round-btn help', id: 'btn-help', 'aria-label': t('help'), 'aria-expanded': 'false', html: icon('help', 19), onclick: () => this.toggleHints() }));
    const zoom = (inward: boolean) => { if (!this.hooks.zoom?.(inward)) this.globe.zoomBy(inward ? 1.6 : 1 / 1.6); };
    const bottomRight = h('div', { class: 'br' },
      h('button', { class: 'round-btn', 'aria-label': t('fullscreen'), title: t('fullscreen'), html: icon('expand', 17), onclick: () => this.fullscreen() }),
      h('button', { class: 'round-btn space-only', 'data-testid': 'btn-overview', 'aria-label': t('overviewScale'), title: t('overviewScale'), html: icon('sun', 17), onclick: () => { sfx.tap(); this.hooks.overview?.(); } }),
      h('div', { class: 'zoom-ctl' },
        h('button', { id: 'btn-zoom-in', 'aria-label': t('zoomIn'), html: icon('plus', 17), onclick: () => zoom(true) }),
        this.zoomEl,
        h('button', { id: 'btn-zoom-out', 'aria-label': t('zoomOut'), html: icon('minus', 17), onclick: () => zoom(false) })));
    this.root.append(top, bottomLeft, bottomRight, this.coordEl, this.info, this.menu, this.rideBar, this.time.el, this.tipEl);
    this.renderHints();
    this.renderMenu();
    onClassroom(() => { if (!this.menu.classList.contains('hidden')) this.renderMenu(); });
    subscribe(() => { if (this.current) this.renderInfo(this.current); if (!this.menu.classList.contains('hidden')) this.renderMenu(); });
    onLang(() => { this.relabel(); this.reader?.relang(); });
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
      if (this.readerOpen) { this.toggleReader(false); return; }
      if (this.current) { this.showItem(null); return; }
      if (this.time.open) this.time.toggle(false);
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
    const where = item.route?.kind === 'orbit' ? t('inOrbit') : countryName(item.country, l) || (CONTINENT_NAMES[item.continent]?.[l] ?? '');
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

  private openSearch(): void {
    const l = lang();
    let query = '';
    let filter: SearchFilter = 'all';
    const listEl = h('div', { class: 'dex-grid search-grid' });
    let space: SpaceHit[] | null = null;
    void import('../solar/space-index.ts').then(m => { space = m.spaceIndex(); if (query.trim() || filter === 'space') renderList(); });
    const renderList = () => {
      const hits = searchAll(query, l, space, filter);
      if (!hits.length) {
        listEl.replaceChildren(h('p', { class: 'muted' }, filter === 'space' && !space ? '…' : t('notFound')));
        return;
      }
      // Each result says where it lives (level) and what it is (type).
      listEl.replaceChildren(...hits.slice(0, 400).map(r => r.kind === 'item'
        ? h('button', { class: 'dex-card unlocked', onclick: () => { closeModal(); this.showItem(r.item, true); } },
          h('span', { class: 'dex-emoji' }, r.item.emoji),
          h('strong', {}, tr(r.item.name, l)),
          h('small', {}, [t('lvEarth'), typeName(r.item.type), countryName(r.item.country, l)].filter(Boolean).join(' · ')))
        : h('button', { class: 'dex-card unlocked', onclick: () => { closeModal(); location.hash = '#' + r.hit.hash; } },
          h('span', { class: 'dex-emoji' }, r.hit.emoji),
          h('strong', {}, tr(r.hit.name, l)),
          h('small', {}, r.hit.kind === 'scaleIs' ? t('scaleIs') : tr(r.hit.level, l) + ' · ' + t(r.hit.kind)))));
    };
    const input = h('input', {
      type: 'search',
      class: 'input',
      placeholder: t('searchPlaceholder'),
      oninput: () => { query = input.value; renderList(); },
    });
    const filterBar = h('div', { class: 'seg-row' },
      ...(['all', 'space', ...TYPE_ORDER.filter(ty => BY_TYPE[ty].length)] as const).map(f =>
        h('button', {
          class: 'pill' + (filter === f ? ' active' : ''),
          onclick: e => {
            filter = f;
            (e.currentTarget as HTMLElement).parentElement?.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
            (e.currentTarget as HTMLElement).classList.add('active');
            renderList();
          },
        }, f === 'all' ? t('filterAll') : f === 'space' ? t('filterSpace') : typeName(f))
      )
    );
    renderList();
    openModal('search', t('search'), h('div', { class: 'search-modal' }, input, filterBar, listEl), { wide: true });
    setTimeout(() => input.focus(), 40);
  }

  private relabel(): void {
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => (el.textContent = t(el.dataset.i18n!)));
    document.title = t('title');
    this.renderHints();
    this.globe.lang = lang(); this.globe.markDirty();
    if (!this.menu.classList.contains('hidden')) this.renderMenu();
    if (this.current) this.renderInfo(this.current);
  }

  private dexClose: boolean | null = null;
  setZoom(z: number, lat = 0, lon = 0): void {
    this.zoomEl.textContent = '×' + z.toFixed(1);
    const ln = ((lon + 540) % 360) - 180;
    this.coordLat.textContent = `${Math.abs(lat).toFixed(2).padStart(5, '0')}°${lat >= 0 ? 'N' : 'S'}`;
    this.coordLon.textContent = `${Math.abs(ln).toFixed(2).padStart(6, '0')}°${ln >= 0 ? 'E' : 'W'}`;
    // onView fires on every dirty frame; only rebuild the dex row when crossing the collect threshold
    const close = z >= DEX_ZOOM;
    if (this.current?.type === 'animal' && close !== this.dexClose) this.renderDexRow();
  }

  /** Switches the global chrome between the globe and the space levels. */
  setSpace(on: boolean): void {
    if (this.space === on) return;
    this.space = on;
    this.toggleHints(false);
    this.toggleMenu(false);
    this.renderHints();
  }

  private renderHints(): void {
    const keys = this.space ? ['hintSpaceDrag', 'hintSpaceZoom', 'hintSpaceTap', 'hintSpaceRail'] : ['hintDrag', 'hintZoom', 'hintTap'];
    this.hints.replaceChildren(
      ...keys.map(k => h('p', { html: t(k) })),
      h('div', { class: 'row' },
        h('button', { class: 'chip', id: 'btn-tutorial', onclick: () => { this.toggleHints(false); this.hooks.openTutorial(); } }, t('tutorialAgain')),
        h('button', { class: 'chip', 'data-testid': 'btn-tours', onclick: () => { this.toggleHints(false); this.hooks.openTours(); } }, t('tours'))));
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
    const sw = (key: keyof Settings, ic: IconName) => {
      const input = h('input', { type: 'checkbox', role: 'switch', 'data-testid': 'set-' + key, checked: Boolean(s[key]) });
      input.addEventListener('change', () => {
        sfx.tap();
        if (key === 'terrain') {
          updateSettings({ terrain: input.checked, surfaceMode: input.checked ? 'realistic' : 'political' });
        } else {
          updateSettings({ [key]: input.checked });
        }
      });
      return h('label', { class: 'switch-card' }, h('span', { class: 'sw-emoji', html: icon(ic, 16) }), h('span', { class: 'sw-label' }, t(key)), input, h('span', { class: 'sw-track', 'aria-hidden': 'true' }));
    };
    /** A switch that is not a globe setting (classroom mode, pause motion). */
    const flag = (id: string, ic: IconName, label: string, val: boolean, set: (v: boolean) => void) => {
      const input = h('input', { type: 'checkbox', role: 'switch', 'data-testid': id, checked: val });
      input.addEventListener('change', () => { sfx.tap(); set(input.checked); });
      return h('label', { class: 'switch-card' }, h('span', { class: 'sw-emoji', html: icon(ic, 16) }), h('span', { class: 'sw-label' }, t(label)), input, h('span', { class: 'sw-track', 'aria-hidden': 'true' }));
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
          h('span', { class: 'aura-dot' }),
          t(AURA_PRESETS[p].label),
        )
      )
    );
    const sel = h('select', { id: 'lang-select', 'aria-label': t('language') }, ...LANGS.map(l => h('option', { value: l, selected: l === lang() }, LANG_LABEL[l])));
    sel.addEventListener('change', () => setLang(sel.value as Lang));
    const row = (ic: IconName, label: string, ctl: Node) => h('div', { class: 'menu-row' }, h('span', { class: 'sw-emoji', html: icon(ic, 16) }), h('span', { class: 'grow' }, label), ctl);
    // Globe options belong to the Earth scene only; in space the menu keeps just the app-wide settings.
    const earth = this.space ? [] : [
      h('h3', {}, t('surfaceMode')), modeRow,
      h('h3', {}, t('auraPreset')), auraRow,
      h('h3', {}, t('mMap')), h('div', { class: 'grid2' }, sw('terrain', 'mountain'), sw('names', 'tag'), sw('borders', 'globe'), sw('shadows', 'contrast')),
      h('h3', {}, t('mGlobe')), h('div', { class: 'grid2' }, ...TYPE_ORDER.filter(ty => BY_TYPE[ty].length).map(ty => sw(TYPE_META[ty].layer, TYPE_ICON[ty]))),
      h('h3', {}, t('mLayers')), h('div', { class: 'grid2' }, sw('graticule', 'grid'), sw('tectonics', 'plates'), sw('clouds', 'cloud'), sw('aurora', 'aurora')),
    ];
    this.menu.classList.toggle('menu-space', this.space);
    this.menu.replaceChildren(
      ...earth,
      h('h3', {}, t('mSettings')), h('div', { class: 'grid2' }, sw('sfx', 'sound'), sw('bgm', 'music')),
      row('ruler', t('compare'), h('button', { class: 'pill', 'data-testid': 'menu-compare', onclick: () => { this.toggleMenu(false); this.hooks.openCompare(); } }, t('open'))),
      row('pin', t('bookmarks'), h('button', { class: 'pill', 'data-testid': 'menu-bookmarks', onclick: () => { this.toggleMenu(false); this.hooks.openBookmarks(); } }, t('open'))),
      row('compass', t('tours'), h('button', { class: 'pill', 'data-testid': 'menu-tours', onclick: () => { this.toggleMenu(false); this.hooks.openTours(); } }, t('open'))),
      h('h3', {}, t('classroom')),
      h('p', { class: 'menu-note' }, t('classroomNote')),
      h('div', { class: 'grid2' }, flag('set-classroom', 'bulb', 'classroom', classroom(), v => { setClassroom(v); if (v) this.toggleReader(false); }),
        ...(classroom() ? [flag('set-still', 'pause', 'pauseMotion', motion.still, setStill)] : [])),
      ...this.offlineSection(flag, row),
      row('language', t('language'), sel),
      row('download', t('backup'), h('span', { class: 'row' },
        h('button', { class: 'pill', 'data-testid': 'backup-export', onclick: () => void import('./backup.ts').then(m => m.exportProgress(), () => toast('⚠️ ' + t('loadFail', { s: t('backup') }))) }, t('backupExport')),
        h('button', { class: 'pill', 'data-testid': 'backup-import', onclick: () => void import('./backup.ts').then(m => m.importProgress(), () => toast('⚠️ ' + t('loadFail', { s: t('backup') }))) }, t('backupImport')))),
      ...(sessionOnly() ? [h('p', { class: 'menu-warn', role: 'status' }, t('sessionOnly'))] : []),
      row('reset', t('reset'), h('button', { class: 'pill', 'data-testid': 'reset', onclick: () => { if (confirm(t('resetConfirm'))) { resetSettings(); this.globe.flyTo(25, 40, 2.2); } } }, t('resetBtn'))),
      ...(HAS_API ? [row('user', store.me ? t('signedInAs', { e: store.me.handle ?? store.me.email }) : t('account'), h('button', { class: 'pill', 'data-testid': 'menu-account', onclick: () => { this.toggleMenu(false); this.hooks.openAccount(); } }, store.me ? t('account') : t('signIn'))),
      ...(classroom() ? [] : [row('chat', t('guestbook'), h('button', { class: 'pill', 'data-testid': 'menu-guestbook', onclick: () => { this.toggleMenu(false); this.hooks.openGuestbook(); } }, t('open')))])] : []),
      h('footer', { class: 'menu-links' },
        ...([['about/', 'about', 'bulb'], ['encyclopedia/', 'encyclopedia', 'book'], ['privacy/', 'privacy', 'eye']] as const).map(([href, key, ic]) =>
          h('a', { href: url(href), 'data-testid': 'menu-link-' + key }, h('span', { class: 'ml-ico', html: icon(ic, 15) }), h('span', {}, t(key))))));
  }

  /** Optional offline use: one switch, then the optional packs, the space used and a clear button. */
  private offlineSection(flag: (id: string, ic: IconName, label: string, val: boolean, set: (v: boolean) => void) => HTMLElement,
    row: (ic: IconName, label: string, ctl: Node) => HTMLElement): Node[] {
    if (!offlineSupported()) return [];
    const on = offlineOn();
    const rerender = () => { if (!this.menu.classList.contains('hidden')) this.renderMenu(); };
    const box = h('div', { class: 'offline-box', 'data-testid': 'offline-box' });
    if (on) {
      box.append(h('p', { class: 'menu-note' }, t('offlineChecking')));
      void offlineInfo().then(inf => {
        box.replaceChildren(
          h('p', { class: 'menu-note', 'data-testid': 'offline-status' }, t('offlineStatus', { v: inf.version, mb: inf.usage == null ? '?' : mb(inf.usage) })),
          ...inf.packs.map(p => row(p.id === 'space' ? 'planet' : p.id === 'sky' ? 'eclipse' : 'landmark', `${t(('pack_' + p.id) as 'pack_space')} · ${mb(p.bytes)} MB`,
            p.saved ? h('span', { class: 'meta', 'data-testid': 'pack-saved-' + p.id }, '✓ ' + t('offlineSaved'))
              : h('button', { class: 'pill', 'data-testid': 'pack-' + p.id, onclick: async (e: Event) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.disabled = true; b.textContent = t('offlineSavingShort');
                try { await savePack(p.id); toast('✓ ' + t('offlineSaved')); } catch { toast('⚠️ ' + t('offlineFail'), 4000); }
                rerender();
              } }, t('offlineSave')))),
          row('trash', t('offlineClear'), h('button', { class: 'pill', 'data-testid': 'offline-clear', onclick: async () => {
            await disableOffline().catch(() => {}); toast(t('offlineCleared')); rerender();
          } }, t('offlineClearBtn'))));
      }, () => box.replaceChildren(h('p', { class: 'menu-warn', role: 'status' }, t('offlineFail'))));
    }
    return [
      h('h3', {}, t('offlineTitle')),
      h('p', { class: 'menu-note' }, t('offlineNote')),
      h('div', { class: 'grid2' }, flag('set-offline', 'download', 'offlineUse', on, v => {
        if (!v) { void disableOffline().catch(() => {}).then(() => { toast(t('offlineCleared')); rerender(); }); return; }
        toast(t('offlineSavingShort'));
        void enableOffline().then(() => { toast('✓ ' + t('offlineReady')); rerender(); }, () => { toast('⚠️ ' + t('offlineFail'), 4000); void disableOffline().catch(() => {}).then(rerender); });
      })),
      box,
    ];
  }

  applySettings(s: Settings): void {
    this.globe.applySettings(s);
    sfx.setEnabled(s.sfx);
    music.setOn(s.bgm);
  }

  // ---------- info card ----------
  showItem(item: CatalogueItem | null, fly = true): void {
    if (item && this.hooks.toEarth?.(item)) return;
    const prev = this.current;
    this.current = item;
    this.globe.select(item?.key ?? null);
    if (!item) {
      stopNarration();
      this.toggleReader(false);
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
    // Passport stamp; the store update re-renders the open card through the subscription.
    if (!(item.key in store.progress.seen)) updateProgress(pp => { pp.seen[item.key] = Date.now(); });
    else this.renderInfo(item);
    this.info.classList.remove('hidden');
    if (this.readerOpen) this.reader?.show(item);
  }

  /** Expands the info card sideways into the Wikipedia reader (lazy-loaded) or folds it back. */
  async toggleReader(open = !this.readerOpen): Promise<void> {
    if (open === this.readerOpen || (open && (!this.current || classroom()))) return;
    this.readerOpen = open;
    this.info.classList.toggle('expanded', open);
    const btn = this.infoMain.querySelector('.read-more');
    btn?.setAttribute('aria-expanded', String(open));
    if (btn?.firstChild) btn.firstChild.textContent = open ? t('readerClose') : t('readMore');
    if (!open) return;
    if (!this.reader) {
      let Reader: typeof import('./reader.ts').Reader;
      try { ({ Reader } = await import('./reader.ts')); } catch { toast(t('loadFail', { s: t('readMore') })); void this.toggleReader(false); return; }
      this.reader ??= new Reader({ close: () => void this.toggleReader(false), pick: it => this.showItem(it) });
    }
    if (!this.readerOpen || !this.current) return;
    if (!this.reader.el.isConnected) this.info.append(this.reader.el);
    this.reader.show(this.current);
  }

  private dexRow = h('div', { class: 'dex-row' });
  private narration: Narration | null = null;

  /** Reads the name, description and fun fact aloud on request, highlighting each sentence as it is spoken. */
  private toggleNarration(it: CatalogueItem, btn: HTMLButtonElement, segs: { el: HTMLElement; text: string; lead: Node[] }[]): void {
    if (this.narration) { this.narration.stop(); return; }
    const l = lang();
    const spans: HTMLElement[] = [];
    for (const seg of segs) {
      const parts = splitSentences(seg.text).map(x => h('span', { class: 'say' }, x + (l === 'zh' ? '' : ' ')));
      seg.el.replaceChildren(...seg.lead, ...parts);
      spans.push(...parts);
    }
    const set = (on: boolean) => {
      btn.setAttribute('aria-pressed', String(on));
      btn.replaceChildren(h('span', { html: icon(on ? 'pause' : 'sound', 14) }), on ? t('listenStop') : t('listen'));
    };
    const name = tr(it.name, l);
    this.narration = narrate([name + (l === 'zh' ? '。' : '.'), ...spans.map(x => x.textContent!.trim())], l, {
      sentence: i => spans.forEach((x, j) => {
        x.classList.toggle('now', j === i - 1);
        if (j === i - 1) { x.closest('details')?.setAttribute('open', ''); x.scrollIntoView({ block: 'nearest' }); }
      }),
      end: () => { this.narration = null; spans.forEach(x => x.classList.remove('now')); set(false); },
    });
    if (this.narration) set(true); else toast(t('noSpeech'));
  }

  private renderDexRow(): void {
    const it = this.current;
    this.dexClose = this.globe.zoom >= DEX_ZOOM;
    if (!it) return;
    const p = store.progress;
    if (it.type === 'animal') {
      const have = it.key in p.dex;
      const close = this.globe.zoom >= DEX_ZOOM;
      this.dexRow.replaceChildren(have ? h('span', { class: 'ok' }, t('collected'))
        : close ? h('button', { class: 'cta', 'data-testid': 'add-dex', onclick: () => { updateProgress(pp => { pp.dex[it.key] = Date.now(); }); sfx.good(); toast('📖 ' + tr(it.name, lang())); } }, t('addDex'))
          : h('span', { class: 'muted' }, t('collectHint', { z: DEX_ZOOM }), ' ', h('button', { class: 'pill pill-sm', 'data-testid': 'zoom-close', 'aria-label': t('zoomClose'), html: icon('zoom', 15), onclick: () => this.globe.flyTo(it.lat, it.lon, 0.8) })));
    } else if (it.type === 'discovery') {
      const have = it.key in p.logs;
      this.dexRow.replaceChildren(have ? h('span', { class: 'ok' }, t('logged'))
        : h('button', { class: 'cta', 'data-testid': 'log-discovery', onclick: () => { updateProgress(pp => { pp.logs[it.key] = Date.now(); }); sfx.good(); } }, t('logIt')));
    } else if (TYPE_META[it.type].collect === 'found') {
      const have = it.key in p.found;
      this.dexRow.replaceChildren(have ? h('span', { class: 'ok' }, t('foundIt'))
        : h('button', { class: 'cta', 'data-testid': 'collect-found', onclick: () => { updateProgress(pp => { pp.found[it.key] = Date.now(); }); sfx.good(); toast(it.emoji + ' ' + tr(it.name, lang())); } }, t('collectIt')));
    } else this.dexRow.replaceChildren();
  }

  private renderInfo(it: CatalogueItem): void {
    const l = lang();
    const f = it.facts ?? {};
    const nf = (n: number, unit: string) => fmtNum(n) + unit;
    const chips: [string, string][] = [];
    if (f.built !== undefined) chips.push([t('built'), f.built < 0 ? t('bce', { n: -f.built }) : String(f.built)]);
    if (f.year !== undefined) chips.push([t('year'), f.year < 0 ? t('bce', { n: -f.year }) : String(f.year)]);
    if (f.born !== undefined) chips.push([t('born'), f.born < 0 ? t('bce', { n: -f.born }) : String(f.born)]);
    if (f.died !== undefined) chips.push([t('died'), f.died < 0 ? t('bce', { n: -f.died }) : String(f.died)]);
    if (f.mya !== undefined) chips.push([t('lived'), t('myaAgo', { n: fmtNum(f.mya), w: fmtNum(Math.round(f.mya * 100)) })]);
    if (it.season) chips.push([t('when'), new Intl.DateTimeFormat(l, { month: 'long', day: 'numeric' }).format(new Date(2024, it.season.month - 1, it.season.day))]);
    if (f.heightM) chips.push([t('height'), nf(f.heightM, ' m')]);
    if (f.lengthM) chips.push([t('length'), f.lengthM >= 10000 ? nf(Math.round(f.lengthM / 1000), ' km') : nf(f.lengthM, ' m')]);
    if (f.depthM) chips.push([t('depth'), nf(f.depthM, ' m')]);
    if (f.weightKg) chips.push([t('weight'), f.weightKg >= 1000 ? nf(Math.round(f.weightKg / 100) / 10, ' t') : nf(f.weightKg, ' kg')]);
    if (f.speedKmh) chips.push([t('speed'), nf(f.speedKmh, ' km/h')]);
    if (f.lifespanY) chips.push([t('lifespan'), nf(f.lifespanY, l === 'en' ? ' yrs' : '')]);
    if (it.diet) chips.push([t('diet'), t(it.diet)]);
    if (it.status) chips.push([t('status'), t(it.status)]);
    const where = it.route?.kind === 'orbit' ? t('inOrbit') : [countryName(it.country, l), CONTINENT_NAMES[it.continent]?.[l]].filter(Boolean).join(' · ');
    const coordStr = `${Math.abs(it.lat).toFixed(1)}°${it.lat >= 0 ? 'N' : 'S'} · ${Math.abs(it.lon).toFixed(1)}°${it.lon >= 0 ? 'E' : 'W'}`;
    const p = store.progress;
    const react = (kind: 'like' | 'visited', ico: IconName) => {
      const on = kind === 'like' ? it.key in p.likes : it.key in p.visited;
      const count = h('span', { class: 'count', 'data-count': kind });
      return h('button', { class: 'react' + (on ? ' on' : ''), 'aria-pressed': String(on), 'data-testid': 'react-' + kind, title: t(kind), html: icon(ico, 16),
        onclick: () => {
          const now = !on;
          updateProgress(pp => { const m = kind === 'like' ? pp.likes : pp.visited; if (now) m[it.key] = Date.now(); else delete m[it.key]; });
          if (store.me) void api.react(it.key, kind, now).then(r => this.setCounts(r)).catch(() => {});
        } }, h('span', { class: 'react-label' }, t(kind)), count);
    };
    const secondary = l !== 'en' ? it.name.en : it.name.zh;
    const key = chips.slice(0, 3), extra = chips.slice(3);
    if (!it.route) extra.push([t('latitude'), coordStr]);
    const hasMore = true;
    this.renderDexRow();
    stopNarration();
    const descP = h('p', { class: 'desc', 'data-testid': 'info-desc' }, tr(it.desc, l));
    const funLead = (): Node[] => [h('b', {}, t('funFact')), document.createTextNode(' ')];
    const funP = it.funFact ? h('p', { class: 'fun' }, ...funLead(), tr(it.funFact, l)) : null;
    const listen: HTMLButtonElement | null = narrationSupported() ? h('button', { class: 'pill pill-sm info-listen', 'data-testid': 'info-listen', 'aria-pressed': 'false',
      onclick: () => this.toggleNarration(it, listen!, [{ el: descP, text: tr(it.desc, l), lead: [] }, ...(funP ? [{ el: funP, text: tr(it.funFact, l), lead: funLead() }] : [])]) },
      h('span', { html: icon('sound', 14) }), t('listen')) : null;
    this.infoMain.replaceChildren(
      h('div', { class: 'info-hero', 'data-type': it.type },
        createModelPreview(it, { width: 360, height: 208, id: 'info-preview' }),
        h('span', { class: 'type-chip t-' + it.type }, typeName(it.type)),
        h('span', { class: 'info-serial', 'aria-hidden': 'true' }, `#${String(CATALOGUE.indexOf(it) + 1).padStart(4, '0')}`, h('small', {}, ` / ${CATALOGUE.length}`)),
        h('button', { class: 'icon-btn info-x', 'aria-label': t('close'), 'data-testid': 'info-close', html: icon('close', 16), onclick: () => this.showItem(null) }),
        this.heroActions(it),
        it.type !== 'animal' && !it.route ? h('button', { class: 'hero-btn info-zoom-btn', title: t('zoomClose'), html: icon('zoom', 15), onclick: () => this.globe.flyTo(it.lat, it.lon, 0.25) }, h('span', {}, t('zoomClose'))) : null,
      ),
      h('div', { class: 'info-body' },
        where ? h('p', { class: 'eyebrow', html: icon('pin', 13) }, h('span', {}, where)) : null,
        h('h2', { 'data-testid': 'info-name' }, tr(it.name, l)),
        secondary ? h('p', { class: 'alt-name' }, secondary) : null,
        descP,
        listen,
        key.length ? h('dl', { class: 'stats-row' }, ...key.map(([k, v]) => h('div', {}, h('dt', {}, k), h('dd', {}, v)))) : null,
        groupOf(it.key) ? h('button', { class: 'pill cmp-open', 'data-testid': 'info-compare', onclick: () => this.hooks.openCompare(it.key) }, h('span', { html: icon('ruler', 14) }), t('cmpThis')) : null,
        this.dexRow,
        hasMore ? h('details', { class: 'more' },
          h('summary', { html: icon('chevron', 14) }, h('span', {}, t('moreDetails'))),
          funP,
          it.habitat ? h('p', { class: 'meta' }, t('habitat') + ': ' + tr(it.habitat, l)) : null,
          extra.length ? h('dl', { class: 'facts' }, ...extra.map(([k, v]) => h('div', {}, h('dt', {}, k), h('dd', {}, v)))) : null,
          h('p', { class: 'meta prov', 'data-testid': 'provenance' }, t('modelNote') + ' ' + t(it.route ? 'routeNote' : it.type === 'animal' ? 'rangeNote' : ['landmark', 'volcano', 'space', 'discovery'].includes(it.type) ? 'placeNote' : 'repNote'))) : null,
        h('div', { class: 'info-footer' },
          it.type !== 'vehicle' ? h('div', { class: 'reactions' }, react('like', 'heart'), react('visited', 'flag')) : null,
          it.route ? h('button', { class: 'cta cta-sm', 'data-testid': 'ride', html: icon('ride', 16), onclick: () => void this.startRide(it) }, h('span', {}, t('ride'))) : null,
          h('button', { class: 'read-more', 'data-testid': 'read-more', 'aria-expanded': String(this.readerOpen), onclick: () => { sfx.tap(); void this.toggleReader(); } },
            h('span', {}, this.readerOpen ? t('readerClose') : t('readMore')), h('span', { html: icon('book', 14) })))));
    if (HAS_API && it.type !== 'vehicle') void api.reactions(it.key).then(r => this.setCounts(r)).catch(() => {});
  }

  /** "Say hello" (local greeting via speech) and "Hear it" (procedural animal call) buttons over the model. */
  private heroActions(it: CatalogueItem): HTMLElement | null {
    const l = lang();
    const greets = !!it.country && it.type !== 'animal' && it.type !== 'dino' && it.type !== 'migration';
    if (greets && !GREETINGS) {
      const slot = h('div', { hidden: true });
      void greetingsReady.then(() => { if (slot.isConnected && GREETINGS) slot.replaceWith(this.heroActions(it) ?? ''); });
      return slot;
    }
    const g = greets ? GREETINGS?.[it.country!] : undefined;
    const call = callFor(it);
    if (!g && !call) return null;
    const btn = (id: string, ic: IconName, label: string, fn: () => void) =>
      h('button', { class: 'hero-btn', 'data-testid': id, title: label, onclick: fn, html: icon(ic, 16) }, h('span', {}, label));
    return h('div', { class: 'hero-acts' },
      g ? btn('say-hello', 'hand', t('sayHello'), () => {
        const langName = new Intl.DisplayNames([l], { type: 'language' }).of(g[1].split('-')[0]) ?? g[1];
        const ok = speak(g[0], g[1]);
        toast(t('helloIn', { lang: langName, say: g[2] }) + (ok ? '' : ' ' + t('noSpeech')), 4200);
      }) : null,
      call ? btn('hear-it', 'sound', t('hearIt'), () => sfx.call(call)) : null);
  }

  private setCounts(r: { like: number; visited: number }): void {
    this.info.querySelectorAll<HTMLElement>('[data-count]').forEach(el => { const n = r[el.dataset.count as 'like' | 'visited']; el.textContent = n ? ' ' + fmtNum(n) : ''; });
  }

  // ---------- ride ----------
  async startRide(it: CatalogueItem): Promise<void> {
    if (!(await this.globe.prepare(it.key)) || !this.globe.startRide(it.key)) return;
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
