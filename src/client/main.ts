import './styles.css';
import type { Topology } from 'topojson-specification';
import { Globe } from './globe/scene.ts';
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

declare global { interface Window { __pp?: { ready: boolean; globe: Globe; shell: Shell; itemScreen: (k: string) => { x: number; y: number } | null } } }

const params = new URLSearchParams(location.search);
const lowfx = params.has('lowfx') || matchMedia('(prefers-reduced-motion: reduce)').matches && params.get('lowfx') !== '0';
const app = document.getElementById('app')!;
const loader = document.getElementById('loader');

async function boot(): Promise<void> {
  if (lowfx) document.body.classList.add('lowfx');
  document.documentElement.lang = lang();
  document.title = t('title');
  const topo = (await (await fetch(url('data/countries-110m.json'))).json()) as Topology;
  await Promise.race([document.fonts?.ready, new Promise(r => setTimeout(r, 150))]);
  const countries = loadCountries(topo);
  const texWidth = lowfx ? 512 : 2048;
  const paint = () => paintEarth(topo, countries, { terrain: store.settings.terrain, borders: store.settings.borders, width: texWidth });

  const globeEl = h('div', { id: 'globe' });
  app.append(globeEl);
  let shell!: Shell;
  const globe = new Globe(globeEl, {
    onPick: it => shell.showItem(it),
    onHover: (it, scr) => shell?.showHover(it, scr),
    onView: z => shell.setZoom(z),
  }, lowfx);
  globe.lang = lang();
  globe.applySettings(store.settings);
  if (!globe.init(paint(), countries, CATALOGUE, buildBorderPositions(topo))) {
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
  });
  shell.mount();
  shell.applySettings(store.settings);

  let painted = { terrain: store.settings.terrain, borders: store.settings.borders };
  subscribe(() => {
    const s = store.settings;
    if (!gaming) shell.applySettings(s); else globe.applySettings({ ...s, names: globe.settings.names });
    if (s.terrain !== painted.terrain || s.borders !== painted.borders) {
      painted = { terrain: s.terrain, borders: s.borders };
      setTimeout(() => globe.setEarthTexture(paint()), 0);
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
  window.__pp = { ready: true, globe, shell, itemScreen: k => globe.itemScreen(k) };

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
