/* くらべよう : fonctionnement hors ligne.
   VERSION change à chaque mise à jour (npm run version-sw l'écrit depuis git) : le nouveau cache se remplit,
   puis la page propose « あたらしく する » ; l'ancienne version reste servie jusqu'à ce que l'élève accepte,
   pour ne jamais mélanger un index.html neuf et des modules src/ anciens. */
const VERSION = 'kurabe-v37-f8f6829';
const FICHIERS = [
  './index.html', './kurabe.css', './manifest.webmanifest',
  './icone.svg', './icone-180.png', './icone-192.png', './icone-512.png', './icone-maskable-512.png',
  './polices/BIZUDPGothic-Regular.woff2', './polices/BIZUDPGothic-Bold.woff2',
  './src/accueil.js', './src/app.js', './src/dessins.js', './src/ecrans.js', './src/etude/etude.js',
  './src/etude/ruban.js', './src/etude/verre.js', './src/explications.js', './src/lecons/etapes-culture.js', './src/lecons/etapes-kazu.js',
  './src/lecons/etapes-masses.js', './src/lecons/etapes-oto.js', './src/lecons/moteur.js', './src/lecons/versement.js', './src/outils.js',
  './src/parents.js', './src/photos.js', './src/plateforme.js', './src/questions/kazu.js', './src/questions/longueurs.js',
  './src/questions/mv.js', './src/questions/session.js', './src/reglages.js', './src/tactile.js',
  './src/texte.js', './src/textes-perso.js', './src/voix.js',
];

self.addEventListener('install', (ev) => {
  // cache: 'reload' : on va chercher les fichiers sur le réseau, jamais dans le cache HTTP du navigateur
  // (sinon un module vieux de quelques minutes pouvait se retrouver dans le nouveau cache).
  ev.waitUntil(caches.open(VERSION)
    .then((c) => c.addAll(FICHIERS.map((f) => new Request(f, { cache: 'reload' }))))
    // Les versions 30 et plus anciennes n'ont pas la barre « あたらしく する » : on les remplace tout de suite,
    // comme elles le faisaient elles-mêmes (la nouvelle version s'affiche au prochain lancement).
    .then(() => caches.keys())
    .then((cles) => { if (cles.some((c) => /^kurabe-v([12]?\d|30)$/.test(c))) self.skipWaiting(); }));
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

// Cache d'abord : l'app marche sans réseau. Les fichiers de la version ne sont jamais réécrits dans son cache
// (sinon une version suivante s'y glisserait fichier par fichier) : on change de version en installant un nouveau
// service worker, avec la barre « あたらしく する ». Seul un fichier absent du cache est demandé au réseau.
self.addEventListener('fetch', (ev) => {
  const requete = ev.request;
  if (requete.method !== 'GET' || new URL(requete.url).origin !== self.location.origin) return;
  // Toute navigation (./, ./index.html, ./index.html?x) reçoit la même page.
  const cle = requete.mode === 'navigate' ? './index.html' : requete;
  ev.respondWith(caches.open(VERSION).then(async (cache) => {
    const enCache = await cache.match(cle, { ignoreSearch: true });
    if (enCache) return enCache;
    return fetch(requete).catch(() => Response.error());
  }));
});
