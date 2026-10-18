import { h, openModal, closeModal } from './dom.ts';
import { t, lang } from '../lib/i18n.ts';
import { store } from '../store.ts';
import { ANIMALS, DISCOVERIES } from '../../shared/data/catalogue.ts';
import { tr, type CatalogueItem } from '../../shared/data/types.ts';
import { STICKERS } from '../../shared/lib/stickers.ts';
import { photos, openAlbum } from './photo.ts';
import { load, save } from '../lib/storage.ts';

export function openCollection(go: (it: CatalogueItem) => void): void {
  const p = store.progress;
  const card = (id: string, cls: string, emoji: string, title: string, sub: string, stat: string, fn: () => void) =>
    h('button', { class: 'hub-card ' + cls, 'data-testid': id, onclick: fn },
      h('span', { class: 'hub-emoji', 'aria-hidden': 'true' }, emoji), h('strong', {}, title), h('span', { class: 'hub-sub' }, sub), h('span', { class: 'hub-stat' }, stat), h('span', { class: 'hub-open' }, '▶ ' + t('open')));
  const albumStat = h('span', {}, t('photos', { n: '…' }));
  const grid = h('div', { class: 'hub-grid' },
    card('hub-animals', 'c-green', '📖', t('animalDex'), t('animalDexSub'), t('found', { n: Object.keys(p.dex).length, t: ANIMALS.length }), () => dex('animals', ANIMALS, p.dex, go)),
    card('hub-discoveries', 'c-purple', '🗺️', t('discoveryDex'), t('discoveryDexSub'), t('found', { n: Object.keys(p.logs).length, t: DISCOVERIES.length }), () => dex('discoveries', DISCOVERIES, p.logs, go)),
    card('hub-stickers', 'c-orange', '🏅', t('stickers'), t('stickersSub'), t('found', { n: Object.keys(p.stickers).length, t: STICKERS.length }), stickers),
    card('hub-album', 'c-violet', '📷', t('album'), t('albumSub'), '', () => { closeModal('collection'); void openAlbum(); }));
  (grid.lastElementChild!.querySelector('.hub-stat') as HTMLElement).append(albumStat);
  void photos.count().then(n => (albumStat.textContent = t('photos', { n })));
  openModal('collection', '📚 ' + t('collection'), grid, { wide: true });
}

function dex(kind: 'animals' | 'discoveries', items: CatalogueItem[], got: Record<string, number>, go: (it: CatalogueItem) => void): void {
  const groups = new Map<string, CatalogueItem[]>();
  for (const it of items) { const k = it.sub; groups.set(k, [...(groups.get(k) ?? []), it]); }
  const body = h('div', { class: 'dex' }, h('p', { class: 'muted' }, t('found', { n: Object.keys(got).length, t: items.length })));
  for (const [g, list] of groups) {
    body.append(h('h3', { class: 'dex-group' }, g), h('div', { class: 'dex-grid' }, ...list.map(it => {
      const have = it.key in got;
      return h('button', { class: 'dex-cell' + (have ? ' have' : ''), 'data-testid': 'dex-' + it.key, title: have ? tr(it.name, lang()) : t('locked'),
        onclick: () => { closeModal('dex'); closeModal('collection'); go(it); } },
        h('span', { class: 'dex-emoji', 'aria-hidden': 'true' }, have ? it.emoji : '❔'), h('span', { class: 'dex-name' }, have ? tr(it.name, lang()) : '???'));
    })));
  }
  openModal('dex', kind === 'animals' ? '📖 ' + t('animalDex') : '🗺️ ' + t('discoveryDex'), body, { wide: true });
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
  openModal('stickers', '🏅 ' + t('stickers'), h('div', {}, h('div', { class: 'row end' }, sel), grid), { wide: true });
}
