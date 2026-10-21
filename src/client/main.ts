import './styles.css';
import './hud.css';
import './intro.css';
import type { Topology } from 'topojson-specification';
import { Globe } from './globe/scene.ts';
import type { SolarUI } from './solar/ui.ts';
import { detectQuality, lowFxFrom } from './globe/quality.ts';
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
import { load, onSessionOnly } from './lib/storage.ts';
import { mergeProgress } from '../shared/lib/progress.ts';
import { sfx } from './lib/sfx.ts';
import { music } from './lib/music.ts';
import { openTutorial } from './ui/tutorial.ts';
import { ScaleRail, type RailLevel } from './ui/scales.ts';
import { initTooltips } from './ui/tooltip.ts';
import { lazy, withBusy, showLoadError } from './ui/lazy.ts';
import type { ScaleId } from '../shared/data/cosmos.ts';

/** Panels not needed for the first screen load on first use (their chunks stay out of the entry). */
const later = <M,>(load: () => Promise<M>, what: () => string) => {
  const get = lazy(load);
  return (use: (m: M) => void) => void withBusy(get()).then(use, () => toast('⚠️ ' + t('loadFail', { s: what() })));
};
const gamesMod = later(() => import('./ui/games.ts'), () => t('game'));
const collectionMod = later(() => Promise.all([import('./ui/collection.ts'), import('./ui/passport.ts')]), () => t('collection'));
const photoMod = later(() => import('./ui/photo.ts'), () => t('photo'));
const accountMod = lazy(() => import('./ui/account.ts'));
const account = (use: (m: typeof import('./ui/account.ts')) => void) => void withBusy(accountMod()).then(use, () => toast('⚠️ ' + t('loadFail', { s: t('account') })));

declare global { interface Window { __pp?: { ready: boolean; globe: Globe; shell: Shell; itemScreen: (k: string) => { x: number; y: number } | null; solar: () => SolarUI | null } } }

const params = new URLSearchParams(location.search);
/** `#solar/jupiter`, `#milkyway/dp_sgr_a`, `#universe` … */
const SCALE_ROUTES: Record<string, ScaleId> = { solar: 'solar', milkyway: 'galaxy', localgroup: 'group', laniakea: 'laniakea', universe: 'universe' };
const lowfx = lowFxFrom(params, matchMedia('(prefers-reduced-motion: reduce)').matches);
const quality = detectQuality(params, lowfx);
const app = document.getElementById('app')!;
const loader = document.getElementById('loader');

async function boot(): Promise<void> {
  if (lowfx) document.body.classList.add('lowfx');
  document.body.classList.add('q-' + quality.tier);
  initTooltips();
  document.documentElement.lang = lang();
  document.title = t('title');
  // a deep link into another scene: fetch that scene's code alongside the Earth's, not after it
  const linkHead = location.hash.slice(1).split('/')[0];
  if (linkHead === 'sky') void import('./sky/index.ts').catch(() => {});
  else if (SCALE_ROUTES[linkHead]) void import('./solar/ui.ts').catch(() => {});
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
    onView: (z, la, lo) => shell.setZoom(z, la, lo),
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
    if (on) navSeq++;
    globe.gameMode = on;
    if (on) { shell.showItem(null); shell.toggleMenu(false); shell.time.toggle(false); radio?.toggle(false); }
    document.body.classList.toggle('gaming', on);
    globe.applySettings(on && names === false ? { ...store.settings, names: false } : store.settings);
    if (!on) globe.ev.onGlobeTap = undefined;
  };
  const host = { globe, setGameMode };

  // ---- Earth radio (lazy): station dots on the globe + a player dock ----
  let radio: import('./ui/radio.ts').Radio | null = null;
  const loadRadio = lazy(() => import('./ui/radio.ts'));
  const toggleRadio = async () => {
    if (gaming || inSolar) return;
    try {
      const m = await withBusy(loadRadio());
      radio = await m.getRadio(globe, app, on => { const b = document.getElementById('btn-radio'); b?.classList.toggle('active', on); b?.setAttribute('aria-pressed', String(on)); });
    } catch { toast(t('radioLoadFail')); return; }
    if (gaming || inSolar || inSky) return;
    if (!radio.active) shell.time.toggle(false);
    radio.toggle();
  };

  // ---- Solar System (lazy: its own renderer, loaded on first use) ----
  let solar: SolarUI | null = null;
  let inSolar = false;
  /** Bumped by every navigation, so a load that finishes after the user went elsewhere is dropped. */
  let navSeq = 0;
  let scaleNow: ScaleId = 'solar';
  // Background music follows the level the user is looking at.
  const tune = () => music.setLevel(inSky ? 'sky' : inSolar ? scaleNow : 'earth');
  const loadSolarMod = lazy(() => import('./solar/ui.ts'));
  const loadSolar = async () => solar ??= new (await loadSolarMod()).SolarUI(app, { quality, earthCanvas: () => earthCv, exit: leaveSolar, onScale: s => { rail.set(s); scaleNow = s; tune(); }, openSky: () => void openSky(), topSlot: shell.topSlot });
  const routeOf = (o: { focus?: string; scale?: ScaleId }) => {
    const head = Object.keys(SCALE_ROUTES).find(k => SCALE_ROUTES[k] === (o.scale ?? 'solar'))!;
    return head + (o.focus && o.focus !== 'overview' ? '/' + o.focus : '');
  };
  const fade = (fn: () => void) => {
    document.body.classList.add('fading');
    setTimeout(() => { fn(); requestAnimationFrame(() => document.body.classList.remove('fading')); }, lowfx ? 0 : 230);
  };
  const enterSolar = async (opts: { focus?: string; scale?: ScaleId } = {}) => {
    if (inSolar || gaming) return;
    const seq = ++navSeq;
    let ui: SolarUI;
    try { ui = await withBusy(loadSolar()); } catch (e) {
      console.error(e);
      if (seq === navSeq) showLoadError(t('solarSystem'), () => void enterSolar(opts), routeOf(opts));
      return;
    }
    // the user went elsewhere (back to Earth, a game, another load) while this was loading
    if (seq !== navSeq || inSolar || gaming) return;
    inSolar = true;
    radio?.suspend(true);
    shell.showItem(null); shell.toggleMenu(false); shell.time.toggle(false);
    fade(() => {
      globe.paused = true;
      document.body.classList.add('solar');
      shell.setSpace(true);
      ui.enter(opts.focus || opts.scale ? opts : { from: { lat: globe.lat, lon: globe.lon } });
      tune();
    });
  };
  const leaveSolar = (lat: number, lon: number, then?: () => void) => {
    if (!inSolar) return;
    navSeq++;
    inSolar = false;
    tune();
    if (!inSky) radio?.suspend(false);
    fade(() => {
      solar?.leave();
      rail.set('earth');
      document.body.classList.remove('solar');
      shell.setSpace(false);
      globe.paused = false;
      globe.lat = lat; globe.lon = lon; globe.h = MAX_H;
      globe.flyTo(lat, lon, DEFAULT_H, 1400);
      history.replaceState(null, '', location.pathname + location.search);
      then?.();
    });
  };

  // ---- Sky theatre (lazy): eclipses, meteor showers, planets, played out over the globe or the Solar System ----
  const loadSky = lazy(() => import('./sky/index.ts'));
  let inSky = false;
  const openSky = async (id?: string): Promise<import('./sky/theatre.ts').Theatre | null> => {
    if (gaming) return null;
    const seq = ++navSeq;
    let m: typeof import('./sky/index.ts');
    try { m = await withBusy(loadSky()); } catch (e) {
      console.error(e);
      if (seq === navSeq) showLoadError(t('skyEvents'), () => void openSky(id), 'sky' + (id ? '/' + id : ''));
      return null;
    }
    if (seq !== navSeq || gaming) return null;
    if (!inSky) { shell.toggleMenu(false); shell.time.toggle(false); }
    // replacing an open theatre runs its onClose first, so the "in the sky" state is set after the swap
    const th = m.openSky(document.body, {
      id, lowfx, dprMax: quality.dprMax, msaa: quality.msaa,
      globe: { lat: globe.lat, lon: globe.lon },
      onClose: () => {
        if (sky !== th) return;
        sky = null;
        inSky = false;
        tune();
        if (!inSolar) radio?.suspend(false);
        if (inSolar) solar?.view.suspend(false); else globe.paused = false;
      },
      onSolar: (focus, ms) => {
        if (inSolar && solar) { solar.showAt(ms, focus); return; }
        void withBusy(loadSolar()).then(ui => { ui.showAt(ms); void enterSolar({ focus }); }, () => showLoadError(t('solarSystem'), () => void enterSolar({ focus }), 'solar/' + (focus ?? '')));
      },
    });
    sky = th;
    inSky = true;
    tune();
    radio?.suspend(true);
    globe.paused = true;
    solar?.view.suspend(true);
    return th;
  };

  // ---- guided tours (lazy): they drive the same navigation a user would ----
  const toursMod = later(() => import('./ui/tours.ts'), () => t('tours'));
  const navTo = (hash: string) => {
    if (inSky) sky?.close();
    if (location.hash === '#' + hash) route(); else location.hash = hash;
  };
  const tourHost: import('./ui/tours.ts').TourHost = {
    earth: (lat, lon, hh) => {
      if (gaming) return;
      if (inSky) sky?.close();
      shell.showItem(null);
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
      if (inSolar) leaveSolar(lat, lon, () => globe.flyTo(lat, lon, hh, 1400)); else globe.flyTo(lat, lon, hh, 1600);
    },
    go: hash => navTo(hash),
    sky: (id, view) => void openSky(id).then(th => { if (th && view) th.show(view); }),
    path: pts => { if (!inSolar && !inSky) pts.slice(1).forEach((p, i) => globe.showFlightArc(pts[i], p, i > 0)); },
    item: key => navTo(key),
  };
  const openTours = () => toursMod(m => m.openTours(tourHost));
  const startTour = (id: string) => toursMod(m => m.startTour(id, tourHost));

  const showCollection = () => collectionMod(([{ openCollection }, { openPassport }]) => {
    const passport = () => openPassport({
      here: () => shell.current ? [shell.current.lat, shell.current.lon] : [globe.lat, globe.lon],
      travel: (it, from) => { shell.showItem(it); if (Math.abs(from[0] - it.lat) + Math.abs(from[1] - it.lon) > 2) globe.showFlightArc(from, [it.lat, it.lon]); },
    });
    openCollection(it => { closeModal(); closeModal(); shell.showItem(it); }, passport);
  });
  shell = new Shell(app, globe, {
    openPhoto: () => photoMod(m => m.openPhotoMode(globe, () => shell.current ? tr(shell.current.name, lang()) : '')),
    openCollection: showCollection,
    openGames: () => { if (!gaming) gamesMod(m => m.openGames(host)); },
    openTutorial: () => openTutorial(openTours),
    openTours,
    openAccount: () => account(m => m.openAccount()), openGuestbook: () => account(m => void m.openGuestbook()),
    openSolar: () => void enterSolar(),
    openSky: () => void openSky(),
    openRadio: () => void toggleRadio(),
    toEarth: it => { if (!inSolar) return false; leaveSolar(it.lat, it.lon, () => shell.showItem(it)); return true; },
    zoom: inward => { if (!inSolar) return false; solar?.zoom(inward); return true; },
    overview: () => solar?.overview(),
  });
  shell.mount();
  // One ladder for the whole system: universe → … → Solar System → Earth.
  const rail = new ScaleRail((l: RailLevel) => {
    if (l === 'earth') { navSeq++; if (inSolar) leaveSolar(20, 10); return; }
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
  onSessionOnly(() => toast('⚠️ ' + t('sessionOnly'), 6000));
  setSyncer(async () => { await (await accountMod()).syncNow(true); });

  // ---- routing ----
  let sky: import('./sky/theatre.ts').Theatre | null = null;
  const route = () => {
    let hsh: string;
    try { hsh = decodeURIComponent(location.hash.slice(1)).trim(); } catch { hsh = '\u0000'; }
    if (!hsh) {
      // back/forward to the bare page: show the Earth
      if (inSky) sky?.close();
      if (inSolar) leaveSolar(globe.lat, globe.lon);
      return;
    }
    const [head, rest = ''] = hsh.split('/');
    if (head === 'sky') { void openSky(rest || undefined); return; }
    if (head === 'tour') { if (rest) startTour(rest); else openTours(); history.replaceState(null, '', location.pathname + location.search); return; }
    const scale = SCALE_ROUTES[head];
    if (scale) {
      const focus = rest || (scale === 'solar' ? 'overview' : '');
      if (!inSolar) void enterSolar({ focus, scale }); else solar?.goTo(focus, scale);
      return;
    }
    if (hsh === 'daily') gamesMod(m => m.openDaily(host));
    else if (hsh === 'placeit' || hsh === 'quiz' || hsh === 'games') gamesMod(m => m.openGames(host));
    else if (hsh === 'collection') showCollection();
    else if (HAS_API && hsh === 'guestbook') account(m => void m.openGuestbook());
    else if (HAS_API && (hsh === 'account' || hsh === 'signed-in')) { if (hsh === 'signed-in') toast('👋 ' + t('synced')); account(m => m.openAccount()); }
    else if (hsh === 'auth-error') toast('⚠️ ' + t('linkExpired'));
    else {
      const it = BY_KEY.get(hsh);
      if (it) { if (inSolar) leaveSolar(it.lat, it.lon, () => shell.showItem(it)); else shell.showItem(it); }
      else { toast('🧭 ' + t('linkUnknown')); history.replaceState(null, '', location.pathname + location.search); }
    }
  };
  window.addEventListener('hashchange', route);

  // Opening: warp out of the star field while the globe flies in from deep space.
  if (loader && !lowfx) {
    if (!location.hash) { const lon = globe.lon; globe.h = MAX_H; globe.lon = lon - 70; globe.flyTo(globe.lat, lon, DEFAULT_H, 2600); }
    loader.classList.add('go');
    setTimeout(() => loader.remove(), 1300);
  } else loader?.remove();
  window.__pp = { ready: true, globe, shell, itemScreen: k => globe.itemScreen(k), solar: () => solar };

  // ---- account (optional) ----
  void api.me().then(async me => {
    if (!me) return;
    setMe(me);
    try {
      const { progress } = await api.getProgress();
      if (progress) replaceProgress(mergeProgress(store.progress, progress));
      await (await accountMod()).syncNow(true);
    } catch { /* offline */ }
  });

  const deepLink = !!location.hash;
  route();
  if (!deepLink && load<string | null>('tutorial', null) !== 'done' && !params.has('notut')) setTimeout(openTutorial, 600);
}

boot().catch(err => {
  console.error(err);
  loader?.remove();
  app.replaceChildren(h('div', { class: 'fatal', role: 'alert' }, h('p', { class: 'big' }, '🌍'), h('p', {}, String(err))));
});
