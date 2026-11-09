/* ==========================================================================
   Couche plateforme : tout ce qui touche à l'appareil passe par ici
   (voix, stockage, vibration, installation). Une application native (Capacitor)
   remplacera ces implémentations sans toucher au reste du code.
   ========================================================================== */

const synthese = 'speechSynthesis' in window ? window.speechSynthesis : null;

/* ----- Voix : la synthèse vocale du navigateur ----- */
const voix = {
  get disponible() { return Boolean(synthese); },
  // Les voix installées (parfois vides au démarrage : voir surChangementVoix).
  voixDisponibles() { return synthese ? synthese.getVoices() : []; },
  // Dit un texte (la parole en cours est interrompue). onend est aussi appelé en cas d'erreur.
  parler(texte, { voix: choisie = null, rate = 1, pitch = 1, lang = 'ja-JP', onend = null } = {}) {
    synthese.cancel();
    const enonce = new SpeechSynthesisUtterance(texte);
    if (onend) {
      enonce.onend = onend;
      enonce.onerror = onend;
    }
    enonce.lang = lang;
    if (choisie) enonce.voice = choisie;
    enonce.rate = rate;
    enonce.pitch = pitch;
    synthese.speak(enonce);
  },
  annuler() {
    if (synthese) { try { synthese.cancel(); } catch { /* rien */ } }
  },
  // Les voix arrivent parfois après le démarrage.
  surChangementVoix(cb) {
    if (synthese && typeof synthese.addEventListener === 'function') synthese.addEventListener('voiceschanged', cb);
  },
};

/* ----- Stockage des photos (IndexedDB, sur l'appareil seulement) ----- */

const stockage = (() => {
  let db = null;
  const memoire = new Map();

  const ouvrir = () => new Promise((resoudre) => {
    try {
      const requete = indexedDB.open('kurabe', 1);
      requete.onupgradeneeded = () => requete.result.createObjectStore('objets', { keyPath: 'id' });
      requete.onsuccess = () => { db = requete.result; resoudre(true); };
      requete.onerror = () => resoudre(false);
      requete.onblocked = () => resoudre(false);
    } catch {
      resoudre(false);
    }
  });

  const transaction = (mode, fn) => new Promise((resoudre) => {
    try {
      const t = db.transaction('objets', mode);
      const r = fn(t.objectStore('objets'));
      t.oncomplete = () => resoudre(r?.result);
      t.onerror = () => resoudre(null);
    } catch {
      resoudre(null);
    }
  });

  return {
    ouvrir,
    get persistant() { return Boolean(db); },
    async tous() {
      if (!db) return [...memoire.values()];
      const liste = await transaction('readonly', (s) => s.getAll());
      return Array.isArray(liste) ? liste : [];
    },
    async mettre(objet) {
      memoire.set(objet.id, objet);
      if (db) await transaction('readwrite', (s) => s.put(objet));
    },
    async enlever(id) {
      memoire.delete(id);
      if (db) await transaction('readwrite', (s) => s.delete(id));
    },
  };
})();

/* ----- Retour haptique ----- */
const retour = {
  vibrer(ms) {
    if (navigator.vibrate) navigator.vibrate(ms);
  },
};

/* ----- Installation : le service worker (hors ligne, mises à jour) -----
   surNouvelleVersion(activer) : une nouvelle version attend ; activer() la met en service (la page se recharge). */
const installation = {
  possible: 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost'),
  enregistrerServiceWorker(surNouvelleVersion) {
    let rechargement = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (rechargement) return;
      rechargement = true;
      location.reload();
    });
    navigator.serviceWorker.register('sw.js').then((reg) => {
      const proposer = (sw) => {
        if (!navigator.serviceWorker.controller) return;   // première installation : rien à proposer
        surNouvelleVersion(() => sw.postMessage({ type: 'activer' }));
      };
      if (reg.waiting) proposer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => { if (sw.state === 'installed' && reg.waiting) proposer(reg.waiting); });
      });
      // Au retour dans l'app après un moment, on regarde s'il y a du nouveau.
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(() => {});
  },
};

export const plateforme = { voix, stockage, retour, installation };
