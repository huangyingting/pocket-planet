/**
 * Offline use has been switched off. Browsers that turned it on earlier still have the old service worker and its
 * caches: remove them at boot (public/sw.js also unregisters itself when the browser checks for an update).
 */
export function retireOffline(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  void navigator.serviceWorker.getRegistrations().then(rs => Promise.all(rs.map(r => r.unregister())), () => {});
  if (typeof caches !== 'undefined') void caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('pp-')).map(k => caches.delete(k))), () => {});
}
