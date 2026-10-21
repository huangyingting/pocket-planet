/* Offline use is switched off: this worker replaces the old one, clears its caches and unregisters itself. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('pp-')).map(k => caches.delete(k))))
    .then(() => self.registration.unregister()));
});
