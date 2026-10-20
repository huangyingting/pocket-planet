import { subName } from '../../shared/data/subs.ts';
import { h, openModal, closeModal } from './dom.ts';
import { t, lang } from '../lib/i18n.ts';
import { store } from '../store.ts';
import { ANIMALS, DISCOVERIES, BY_TYPE, CATALOGUE } from '../../shared/data/catalogue.ts';
import { TYPE_META, TYPE_ORDER } from '../../shared/data/typemeta.ts';
import { tr, type CatalogueItem } from '../../shared/data/types.ts';
import { STICKERS } from '../../shared/lib/stickers.ts';
import { photos, openAlbum } from './photo.ts';
import { load, save } from '../lib/storage.ts';
import { icon, TYPE_ICON, type IconName } from './icons.ts';

export function openCollection(go: (it: CatalogueItem) => void, passport?: () => void): void {
  const p = store.progress;
  const card = (id: string, cls: string, ic: IconName, title: string, sub: string, stat: string, fn: () => void) =>
    h('button', { class: 'hub-card ' + cls, 'data-testid': id, onclick: fn },
      h('span', { class: 'hub-ico', html: icon(ic, 20) }), h('strong', {}, title), h('span', { class: 'hub-sub' }, sub),
      h('span', { class: 'hub-foot' }, h('span', { class: 'hub-stat' }, stat), h('span', { class: 'hub-open', html: icon('arrow', 16) })));
  const albumStat = h('span', {}, t('photos', { n: '…' }));
  const pass = passport ? card('hub-passport', 'c-type', 'passport', t('passport'), t('passportSub'), t('stamps', { n: Object.keys(p.seen).length, t: CATALOGUE.length }), passport) : null;
  pass?.style.setProperty('--c', '#f5b14c');
  const grid = h('div', { class: 'hub-grid' }, pass,
    card('hub-animals', 'c-green', 'paw', t('animalDex'), t('animalDexSub'), t('found', { n: Object.keys(p.dex).length, t: ANIMALS.length }), () => dex(t('animalDex'), ANIMALS, p.dex, go)),
    card('hub-discoveries', 'c-purple', 'compass', t('discoveryDex'), t('discoveryDexSub'), t('found', { n: Object.keys(p.logs).length, t: DISCOVERIES.length }), () => dex(t('discoveryDex'), DISCOVERIES, p.logs, go)),
    ...TYPE_ORDER.filter(ty => TYPE_META[ty].collect === 'found' && BY_TYPE[ty].length).map(ty => {
      const m = TYPE_META[ty], items = BY_TYPE[ty], l = lang();
      const c = card('hub-' + ty, 'c-type', TYPE_ICON[ty], tr(m.many, l), tr(m.hint, l), t('found', { n: items.filter(i => i.key in p.found).length, t: items.length }), () => dex(tr(m.many, l), items, p.found, go));
      c.style.setProperty('--c', m.color);
      return c;
    }),
    card('hub-stickers', 'c-orange', 'sparkle', t('stickers'), t('stickersSub'), t('found', { n: Object.keys(p.stickers).length, t: STICKERS.length }), stickers),
    card('hub-album', 'c-violet', 'camera', t('album'), t('albumSub'), '', () => { closeModal('collection'); void openAlbum(); }));
  (grid.lastElementChild!.querySelector('.hub-stat') as HTMLElement).append(albumStat);
  void photos.count().then(n => (albumStat.textContent = t('photos', { n })));
  openModal('collection', t('collection'), grid, { wide: true });
}

function dex(title: string, items: CatalogueItem[], got: Record<string, number>, go: (it: CatalogueItem) => void): void {
  const groups = new Map<string, CatalogueItem[]>();
  for (const it of items) { const k = it.sub; groups.set(k, [...(groups.get(k) ?? []), it]); }
  const body = h('div', { class: 'dex' }, h('p', { class: 'muted' }, t('found', { n: items.filter(i => i.key in got).length, t: items.length })));
  for (const [g, list] of groups) {
    body.append(h('h3', { class: 'dex-group' }, subName(g, lang())), h('div', { class: 'dex-grid' }, ...list.map(it => {
      const have = it.key in got;
      return h('button', { class: 'dex-cell' + (have ? ' have' : ''), 'data-testid': 'dex-' + it.key, title: have ? tr(it.name, lang()) : t('locked'),
        onclick: () => { closeModal('dex'); closeModal('collection'); go(it); } },
        h('span', { class: 'dex-emoji', 'aria-hidden': 'true' }, have ? it.emoji : '❔'), h('span', { class: 'dex-name' }, have ? tr(it.name, lang()) : '???'));
    })));
  }
  openModal('dex', title, body, { wide: true });
}

function stickers(): void {
  let order = load<'default' | 'earned'>('stickerSort', 'default');
  const grid = h('div', { class: 'sticker-grid', 'data-testid': 'sticker-grid' });
  const sel = h('select', { 'aria-label': 'Sort' }, h('option', { value: 'default', selected: order === 'default' }, t('sortDefault')), h('option', { value: 'earned', selected: order === 'earned' }, t('sortEarned')));
  const render = () => {
    const got = store.progress.stickers;
    const list = STICKERS.slice();
    if (order === 'earned') list.sort((a, b) => (got[a.id] ? 0 : 1) - (got[b.id] ? 0 : 1) || (got[a.id] ?? 0) - (got[b.id] ?? 0));
    grid.replaceChildren(...list.map(s => h('div', { class: 'sticker' + (got[s.id] ? ' have' : ''), 'data-sticker': s.id },
      h('span', { class: 'st-emoji', 'aria-hidden': 'true' }, got[s.id] ? s.emoji : '🔒'), h('span', {}, tr(s.name, lang())),
      got[s.id] ? h('small', {}, new Date(got[s.id]).toLocaleDateString()) : null)));
  };
  sel.addEventListener('change', () => { order = sel.value as typeof order; save('stickerSort', order); render(); });
  render();
  openModal('stickers', t('stickers'), h('div', {}, h('div', { class: 'row end' }, sel), grid), { wide: true });
}
