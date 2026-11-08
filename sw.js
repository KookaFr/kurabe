/* くらべよう : fonctionnement hors ligne.
   VERSION change à chaque mise à jour (npm run version-sw l'écrit depuis git) : le nouveau cache se remplit,
   puis la page propose « あたらしく する » ; l'ancienne version reste servie jusqu'à ce que l'élève accepte,
   pour ne jamais mélanger un index.html neuf et un kurabe.js ancien. */
const VERSION = 'kurabe-v31';
const FICHIERS = [
  './index.html', './kurabe.css', './kurabe.js', './manifest.webmanifest',
  './icone.svg', './icone-180.png', './icone-192.png', './icone-512.png', './icone-maskable-512.png',
  './polices/BIZUDPGothic-Regular.woff2', './polices/BIZUDPGothic-Bold.woff2',
];

self.addEventListener('install', (ev) => {
  // cache: 'reload' : on va chercher les fichiers sur le réseau, jamais dans le cache HTTP du navigateur
  // (sinon un kurabe.js vieux de quelques minutes pouvait se retrouver dans le nouveau cache).
  ev.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHIERS.map((f) => new Request(f, { cache: 'reload' })))));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((c) => c.startsWith('kurabe-') && c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

// La page a accepté la nouvelle version : on prend la main, elle se recharge (controllerchange).
self.addEventListener('message', (ev) => {
  if (ev.data && ev.data.type === 'activer') self.skipWaiting();
});

// Cache d'abord (l'app marche sans réseau) ; le réseau rafraîchit le cache en arrière-plan.
self.addEventListener('fetch', (ev) => {
  const requete = ev.request;
  if (requete.method !== 'GET' || new URL(requete.url).origin !== self.location.origin) return;
  // Toute navigation (./, ./index.html, ./index.html?x) reçoit la même page.
  const cle = requete.mode === 'navigate' ? './index.html' : requete;
  ev.respondWith(caches.open(VERSION).then(async (cache) => {
    const enCache = await cache.match(cle, { ignoreSearch: true });
    const reseau = fetch(requete).then((r) => {
      if (r.ok) cache.put(cle, r.clone());
      return r;
    }).catch(() => enCache || Response.error());
    if (enCache) {
      ev.waitUntil(reseau.catch(() => {}));
      return enCache;
    }
    return reseau;
  }));
});
