/**
 * Optional offline use (F07). Off by default: turning it on registers the service worker, which saves the app shell
 * (the Earth, the base map and the small tools). Bigger packs are saved only when asked. Radio, Wikipedia and accounts
 * always need the internet. See scripts/build-offline.ts for what goes in each pack.
 */
import { load, save } from './storage.ts';

export type PackId = 'space' | 'sky' | 'models';
export const PACKS: PackId[] = ['space', 'sky', 'models'];
interface Manifest { version: string; shell: { files: string[]; bytes: number }; packs: Record<PackId, { files: string[]; bytes: number }> }
export interface OfflineInfo { version: string; shellBytes: number; usage: number | null; packs: { id: PackId; bytes: number; saved: boolean }[] }

const BASE = import.meta.env.BASE_URL;
const url = (f: string) => BASE + f;

export const offlineSupported = (): boolean =>
  import.meta.env.PROD && typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof caches !== 'undefined' && isSecureContext;
export const offlineOn = (): boolean => offlineSupported() && load<boolean>('offline', false);

let manifest: Promise<Manifest> | null = null;
const getManifest = () => manifest ??= fetch(url('offline.json'), { cache: 'no-cache' }).then(r => {
  if (!r.ok) throw new Error('offline.json ' + r.status);
  return r.json() as Promise<Manifest>;
}).catch((e: unknown) => { manifest = null; throw e; });

const register = () => navigator.serviceWorker.register(url('sw.js'), { scope: BASE });

/** Called at boot: keep the worker registered (and up to date) only while offline use is on. */
export function bootOffline(): void {
  if (offlineOn()) void register().catch(() => {});
}

/** Turn offline use on and wait until the shell is saved. */
export async function enableOffline(): Promise<void> {
  save('offline', true);
  await register();
  await navigator.serviceWorker.ready;
}

/** Turn it off and remove everything it saved. */
export async function disableOffline(): Promise<void> {
  save('offline', false);
  navigator.serviceWorker.controller?.postMessage('off');
  for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
  for (const k of await caches.keys()) if (k.startsWith('pp-')) await caches.delete(k);
}

const cached = async (f: string) => !!(await caches.match(url(f), { ignoreSearch: true }));

export async function offlineInfo(): Promise<OfflineInfo> {
  const m = await getManifest();
  const est = await navigator.storage?.estimate?.().catch(() => null);
  const packs = await Promise.all(PACKS.map(async id => {
    const p = m.packs[id];
    return { id, bytes: p.bytes, saved: (await Promise.all(p.files.map(cached))).every(Boolean) };
  }));
  return { version: m.version, shellBytes: m.shell.bytes, usage: est?.usage ?? null, packs };
}

/** Save one pack into this version's pack cache (the worker drops it when a new version arrives). */
export async function savePack(id: PackId): Promise<void> {
  const m = await getManifest();
  const c = await caches.open('pp-pack-' + m.version);
  await c.addAll(m.packs[id].files.map(url));
}

export const mb = (n: number): string => Math.max(0.1, n / 1e6).toFixed(1);
