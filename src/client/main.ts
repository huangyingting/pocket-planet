import './styles.css';
import type { Topology } from 'topojson-specification';
import { Globe } from './globe/scene.ts';
import type { SolarUI } from './solar/ui.ts';
import { detectQuality } from './globe/quality.ts';
import { DEFAULT_H, MAX_H } from './globe/scene.ts';
import { loadCountries, paintEarth, buildBorderPositions } from './globe/painter.ts';
import { CATALOGUE, BY_KEY } from '../shared/data/catalogue.ts';
import { Shell } from './ui/shell.ts';
import { h, toast, confetti, closeModal } from './ui/dom.ts';
import { store, subscribe, setStickerHandler, setSyncer, setMe, replaceProgress } from './store.ts';
import { t, lang, onLang } from './lib/i18n.ts';
import { tr } from '../shared/data/types.ts';
import { STICKERS } from '../shared/lib/stickers.ts';
import { api } from './lib/api.ts';
import { HAS_API, url } from './lib/env.ts';
import { load } from './lib/storage.ts';
import { mergeProgress } from '../shared/lib/progress.ts';
import { sfx } from './lib/sfx.ts';
import { openPassport } from './ui/passport.ts';
import { openCollection } from './ui/collection.ts';
import { openPhotoMode } from './ui/photo.ts';
import { openGames, openDaily } from './ui/games.ts';
import { openTutorial } from './ui/tutorial.ts';
import { openAccount, openGuestbook, openCredits, syncNow } from './ui/account.ts';
import { ScaleRail, type RailLevel } from './ui/scales.ts';
import type { ScaleId } from '../shared/data/cosmos.ts';

declare global { interface Window { __pp?: { ready: boolean; globe: Globe; shell: Shell; itemScreen: (k: string) => { x: number; y: number } | null; solar: () => SolarUI | null } } }

const params = new URLSearchParams(location.search);
/** `#solar/jupiter`, `#milkyway/dp_sgr_a`, `#universe` … */
const SCALE_ROUTES: Record<string, ScaleId> = { solar: 'solar', milkyway: 'galaxy', localgroup: 'group', laniakea: 'laniakea', universe: 'universe' };
const lowfx = params.has('lowfx') || matchMedia('(prefers-reduced-motion: reduce)').matches && params.get('lowfx') !== '0';
const quality = detectQuality(params, lowfx);
const app = document.getElementById('app')!;
const loader = document.getElementById('loader');

async function boot(): Promise<void> {
  if (lowfx) document.body.classList.add('lowfx');
  document.body.classList.add('q-' + quality.tier);
  document.documentElement.lang = lang();
  document.title = t('title');
  const topo = (await (await fetch(url('data/countries-110m.json'))).json()) as Topology;
  await Promise.race([document.fonts?.ready, new Promise(r => setTimeout(r, 150))]);
  const countries = loadCountries(topo);
  const texWidth = quality.mapW;
  const paint = () => paintEarth(topo, countries, { terrain: store.settings.terrain, borders: store.settings.borders, width: texWidth });

  const globeEl = h('div', { id: 'globe' });
  app.append(globeEl);
  let shell!: Shell;
  const globe = new Globe(globeEl, {
    onPick: it => shell.showItem(it),
    onHover: (it, scr) => shell?.showHover(it, scr),
    onView: z => shell.setZoom(z),
    onBeyond: () => void enterSolar(),
  }, lowfx, quality);
  globe.lang = lang();
  globe.applySettings(store.settings);
  let earthCv = paint();
  if (!globe.init(earthCv, countries, CATALOGUE, buildBorderPositions(topo))) {
    loader?.remove();
    app.replaceChildren(h('div', { class: 'fatal', role: 'alert' }, h('p', { class: 'big' }, '🌍'), h('p', {}, t('webglFail'))));
    return;
  }

  let gaming = false;
  const setGameMode = (on: boolean, names?: boolean) => {
    gaming = on;
    globe.gameMode = on;
    if (on) { shell.showItem(null); shell.toggleMenu(false); shell.time.toggle(false); }
    document.body.classList.toggle('gaming', on);
    globe.applySettings(on && names === false ? { ...store.settings, names: false } : store.settings);
    if (!on) globe.ev.onGlobeTap = undefined;
  };
  const host = { globe, setGameMode };

  // ---- Solar System (lazy: its own renderer, loaded on first use) ----
  let solar: SolarUI | null = null;
  let solarLoad: Promise<SolarUI> | null = null;
  let inSolar = false;
  const loadSolar = () => solarLoad ??= import('./solar/ui.ts').then(m => (solar = new m.SolarUI(app, { quality, earthCanvas: () => earthCv, exit: leaveSolar, onScale: s => rail.set(s) })));
  const fade = (fn: () => void) => {
    document.body.classList.add('fading');
    setTimeout(() => { fn(); requestAnimationFrame(() => document.body.classList.remove('fading')); }, lowfx ? 0 : 230);
  };
  const enterSolar = async (opts: { focus?: string; scale?: ScaleId } = {}) => {
    if (inSolar || gaming) return;
    inSolar = true;
    shell.showItem(null); shell.toggleMenu(false); shell.time.toggle(false);
    const ui = await loadSolar();
    fade(() => {
      globe.paused = true;
      document.body.classList.add('solar');
      ui.enter(opts.focus || opts.scale ? opts : { from: { lat: globe.lat, lon: globe.lon } });
    });
  };
  const leaveSolar = (lat: number, lon: number) => {
    if (!inSolar) return;
    inSolar = false;
    fade(() => {
      solar?.leave();
      rail.set('earth');
      document.body.classList.remove('solar');
      globe.paused = false;
      globe.lat = lat; globe.lon = lon; globe.h = MAX_H;
      globe.flyTo(lat, lon, DEFAULT_H, 1400);
      history.replaceState(null, '', location.pathname + location.search);
    });
  };

  const passport = () => openPassport({
    here: () => shell.current ? [shell.current.lat, shell.current.lon] : [globe.lat, globe.lon],
    travel: (it, from) => { shell.showItem(it); if (Math.abs(from[0] - it.lat) + Math.abs(from[1] - it.lon) > 2) globe.showFlightArc(from, [it.lat, it.lon]); },
  });
  const showCollection = () => openCollection(it => { closeModal(); closeModal(); shell.showItem(it); }, passport);
  shell = new Shell(app, globe, {
    openPhoto: () => openPhotoMode(globe, () => shell.current ? tr(shell.current.name, lang()) : ''),
    openCollection: showCollection,
    openGames: () => { if (!gaming) openGames(host); },
    openTutorial,
    openAccount, openGuestbook: () => void openGuestbook(), openCredits,
    openSolar: () => void enterSolar(),
  });
  shell.mount();
  // One ladder for the whole system: universe → … → Solar System → Earth.
  const rail = new ScaleRail((l: RailLevel) => {
    if (l === 'earth') { if (inSolar) leaveSolar(20, 10); return; }
    if (!inSolar) void enterSolar({ scale: l });
    else solar?.goScale(l);
  });
  app.append(rail.el);
  shell.applySettings(store.settings);

  let painted = { terrain: store.settings.terrain, borders: store.settings.borders };
  subscribe(() => {
    const s = store.settings;
    if (!gaming) shell.applySettings(s); else globe.applySettings({ ...s, names: globe.settings.names });
    if (s.terrain !== painted.terrain || s.borders !== painted.borders) {
      painted = { terrain: s.terrain, borders: s.borders };
      setTimeout(() => { earthCv = paint(); globe.setEarthTexture(earthCv); solar?.view.setEarthCanvas(earthCv); }, 0);
    }
  });
  onLang(l => { document.documentElement.lang = l; });

  setStickerHandler(id => {
    const st = STICKERS.find(s => s.id === id);
    if (!st) return;
    toast(t('sticker_unlocked', { s: `${st.emoji} ${tr(st.name, lang())}` }), 3500);
    confetti(30); sfx.good();
  });
  setSyncer(async () => { await syncNow(true); });

  // ---- routing ----
  const route = () => {
    const hsh = decodeURIComponent(location.hash.slice(1));
    if (!hsh) return;
    const [head, rest = ''] = hsh.split('/');
    const scale = SCALE_ROUTES[head];
    if (scale) {
      const focus = rest || (scale === 'solar' ? 'overview' : '');
      if (!inSolar) void enterSolar({ focus, scale }); else solar?.goTo(focus, scale);
      return;
    }
    if (hsh === 'daily') openDaily(host);
    else if (hsh === 'placeit' || hsh === 'quiz' || hsh === 'games') openGames(host);
    else if (hsh === 'collection') showCollection();
    else if (HAS_API && hsh === 'guestbook') void openGuestbook();
    else if (HAS_API && (hsh === 'account' || hsh === 'signed-in')) { if (hsh === 'signed-in') toast('👋 ' + t('synced')); openAccount(); }
    else if (hsh === 'auth-error') toast('⚠️ Link expired');
    else { const it = BY_KEY.get(hsh); if (it) shell.showItem(it); }
  };
  window.addEventListener('hashchange', route);

  loader?.remove();
  window.__pp = { ready: true, globe, shell, itemScreen: k => globe.itemScreen(k), solar: () => solar };

  // ---- account (optional) ----
  void api.me().then(async me => {
    if (!me) return;
    setMe(me);
    try {
      const { progress } = await api.getProgress();
      if (progress) replaceProgress(mergeProgress(store.progress, progress));
      await syncNow(true);
    } catch { /* offline */ }
  });

  route();
  if (!location.hash && load<string | null>('tutorial', null) !== 'done' && !params.has('notut')) setTimeout(openTutorial, 600);
}

boot().catch(err => {
  console.error(err);
  loader?.remove();
  app.replaceChildren(h('div', { class: 'fatal', role: 'alert' }, h('p', { class: 'big' }, '🌍'), h('p', {}, String(err))));
});
