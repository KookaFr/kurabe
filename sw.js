/* くらべよう : fonctionnement hors ligne. Changer VERSION à chaque mise à jour. */
const VERSION = 'kurabe-v6';
const FICHIERS = ['./', './index.html', './kurabe.css', './kurabe.js', './manifest.webmanifest', './icone.svg', './icone-180.png', './icone-192.png', './icone-512.png'];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((c) => c.startsWith('kurabe-') && c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

// Réponse depuis le cache, mise à jour en arrière-plan.
self.addEventListener('fetch', (ev) => {
  const requete = ev.request;
  if (requete.method !== 'GET' || new URL(requete.url).origin !== self.location.origin) return;
  ev.respondWith(caches.open(VERSION).then(async (cache) => {
    const enCache = await cache.match(requete, { ignoreSearch: true });
    const reseau = fetch(requete).then((r) => { if (r.ok) cache.put(requete, r.clone()); return r; }).catch(() => enCache);
    if (enCache) { ev.waitUntil(reseau); return enCache; }
    return reseau;
  }));
});
