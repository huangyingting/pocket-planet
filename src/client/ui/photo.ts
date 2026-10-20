import { h, openModal, closeModal, toast } from './dom.ts';
import { t } from '../lib/i18n.ts';
import { sfx } from '../lib/sfx.ts';
import { icon } from './icons.ts';
import type { Globe } from '../globe/scene.ts';

export interface Photo { id: number; at: number; url: string; place: string }
const DB = 'pp-photos', STORE = 'photos';

function db(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((res, rej) => { const q = fn(d.transaction(STORE, mode).objectStore(STORE)); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
}
export const photos = {
  all: () => tx<Photo[]>('readonly', s => s.getAll() as IDBRequest<Photo[]>).then(a => a.sort((x, y) => y.at - x.at)).catch(() => [] as Photo[]),
  add: (p: Omit<Photo, 'id'>) => tx('readwrite', s => s.add(p)),
  del: (id: number) => tx('readwrite', s => s.delete(id)),
  count: () => tx<number>('readonly', s => s.count()).catch(() => 0),
};

export function openPhotoMode(globe: Globe, place: () => string): void {
  document.body.classList.add('photo-mode');
  const exit = () => { document.body.classList.remove('photo-mode'); bar.remove(); frame.remove(); };
  const frame = h('div', { class: 'viewfinder', 'aria-hidden': 'true' }, h('i', { class: 'c tl' }), h('i', { class: 'c tr' }), h('i', { class: 'c bl' }), h('i', { class: 'c br' }));
  const bar = h('div', { class: 'photo-bar' },
    h('button', { class: 'pill', 'data-testid': 'photo-album', onclick: () => { exit(); void openAlbum(); }, html: icon('image', 16) }, ' ' + t('album')),
    h('button', { class: 'shutter', 'aria-label': t('shutter'), 'data-testid': 'shutter', onclick: async () => {
      sfx.shutter();
      frame.classList.add('flash');
      setTimeout(() => frame.classList.remove('flash'), 300);
      const url = globe.capture();
      await photos.add({ at: Date.now(), url, place: place() });
      toast('📸 ' + t('photoSaved'));
    } }),
    h('button', { class: 'pill', 'data-testid': 'photo-exit', onclick: exit }, t('close')));
  document.body.append(frame, bar);
}

export async function openAlbum(): Promise<void> {
  const list = await photos.all();
  const grid = h('div', { class: 'album-grid', 'data-testid': 'album-grid' });
  if (!list.length) grid.append(h('p', { class: 'muted' }, t('noPhotos')));
  for (const p of list) {
    grid.append(h('button', { class: 'thumb', onclick: () => view(p) }, h('img', { src: p.url, alt: p.place || 'Globe photo', loading: 'lazy' })));
  }
  openModal('album', t('album'), grid, { wide: true });
  function view(p: Photo) {
    const dl = h('a', { class: 'pill', href: p.url, download: `pocket-planet-${p.id}.jpg`, html: icon('download', 16) }, ' ' + t('save'));
    const share = navigator.share ? h('button', { class: 'pill', onclick: async () => {
      const blob = await (await fetch(p.url)).blob();
      await navigator.share({ files: [new File([blob], 'pocket-planet.jpg', { type: blob.type })], title: t('title') }).catch(() => {});
    }, html: icon('share', 16) }, ' ' + t('share')) : null;
    openModal('photo-view', p.place || t('album'), h('div', { class: 'photo-view' }, h('img', { src: p.url, alt: p.place || 'Globe photo' }),
      h('p', { class: 'muted' }, new Date(p.at).toLocaleString()),
      h('div', { class: 'row' }, dl, share, h('button', { class: 'pill danger', onclick: async () => { await photos.del(p.id); closeModal('photo-view'); closeModal('album'); void openAlbum(); }, html: icon('trash', 16) }, ' ' + t('del')))), { wide: true });
  }
}
