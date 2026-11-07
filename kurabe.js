/* ==========================================================================
   くらべよう — comparer des longueurs
   --------------------------------------------------------------------------
   Pour les lycéens avec un retard intellectuel (programme « 比較 » :
   長い / 短い, 〜より長い, 一番長い, comparer avec un modèle).

   Principes repris des plans de cours des enseignants :
   - de vrais objets (photos de la maison), à l'échelle réelle ;
   - des différences très marquées au début, puis plus fines ;
   - jamais de pénalité : l'élève réessaie avec un indice ;
   - la dernière question de la série est toujours facile (finir sur une réussite).
   Tout reste sur l'appareil : aucun compte, aucune donnée envoyée.
   ========================================================================== */

(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const echapper = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const aleatoire = (a, b) => a + Math.random() * (b - a);
  const choisir = (t) => t[Math.floor(Math.random() * t.length)];
  const melanger = (t) => {
    for (let i = t.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [t[i], t[j]] = [t[j], t[i]];
    }
    return t;
  };

  /* ======================================================================
     Réglages (gardés sur l'appareil)
     ====================================================================== */

  const CLE_REGLAGES = 'kurabe.reglages';
  const DEFAUT = {
    activites: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    nbQuestions: 6,
    ecriture: 'hiragana',   // hiragana | kanji (avec furigana)
    noms: true,             // afficher le nom des objets
    court: true,            // demander aussi « le plus court »
    photos: 'melange',      // jamais | melange | toujours
    vitesse: 0.9,
    sons: true,
    dureeAppui: 0,          // ms : le doigt doit rester posé ce temps
    antiRebond: 0,          // ms : touchers suivants ignorés
    aide: true,             // bouton « ヒント » / « そろえる »
    nombreMax: 20,          // べんきょう : nombres jusqu'à 10, 20, 50 ou 100
    compter: true,          // べんきょう : la voix compte à chaque ＋1 / −1
    version: 3,
    langue: (navigator.language || '').toLowerCase().startsWith('ja') ? 'ja' : 'fr',
  };

  function lireReglages() {
    try {
      const stocke = JSON.parse(localStorage.getItem(CLE_REGLAGES) || '{}');
      // Réglages d'une version précédente : on ajoute les nouvelles activités (6 à 9).
      if (stocke.activites && (stocke.version || 1) < 2) {
        stocke.activites = [...new Set([...stocke.activites, 6, 7, 8, 9])];
      }
      if (stocke.activites && (stocke.version || 1) < 3) {
        stocke.activites = [...new Set([...stocke.activites, 10, 11, 12])];
      }
      return { ...DEFAUT, ...stocke, version: 3 };
    } catch {
      return { ...DEFAUT };
    }
  }

  let reglages = lireReglages();

  function ecrireReglages(modifs) {
    reglages = { ...reglages, ...modifs };
    try { localStorage.setItem(CLE_REGLAGES, JSON.stringify(reglages)); } catch { /* stockage indisponible */ }
  }

  /* ======================================================================
     Textes japonais : kanji avec furigana, ou hiragana seuls
     Un texte est une liste de segments : 'texte' ou K('漢字', 'よみ').
     ====================================================================== */

  const K = (k, y) => ({ k, y });
  // Valeur avec unité : affichée « 10 cm », lue « 10センチ ».
  const V = (d, s) => ({ d, s });

  function html(segments) {
    return segments.map((s) => {
      if (typeof s === 'string' || typeof s === 'number') return echapper(s);
      if (s.d !== undefined) return echapper(s.d);
      if (reglages.ecriture === 'kanji' && s.k) return `<ruby>${echapper(s.k)}<rt>${echapper(s.y)}</rt></ruby>`;
      return echapper(s.y);
    }).join('');
  }

  // Comme html(), mais chaque groupe de mots (séparé par une espace) reste sur une seule ligne.
  function htmlMots(segments) {
    return html(segments).split(' ').filter(Boolean).map((m) => `<span class="mot">${m}</span>`).join(' ');
  }

  function lecture(segments) {
    return segments.map((s) => (typeof s === 'object' ? (s.s ?? s.y) : String(s))).join('');
  }

  const NAGA = K('長', 'なが');
  const MIJIKA = K('短', 'みじか');
  const ICHIBAN = K('一番', 'いちばん');
  const TEHON = K('手本', 'てほん');
  const ONAJI = K('同', 'おな');
  const KAZU = K('数', 'かず');
  const OOKI = K('大', 'おお');    // 大きい
  const CHIISA = K('小', 'ちい');  // 小さい

  const nomDe = (o) => (o.kanji ? K(o.kanji, o.yomi) : o.yomi);

  const PHRASES = {
    dotchiNagai: ['どっちが ', NAGA, 'い？'],
    dotchiMijikai: ['どっちが ', MIJIKA, 'い？'],
    ichibanNagai: [ICHIBAN, ' ', NAGA, 'いのは どれ？'],
    ichibanMijikai: [ICHIBAN, ' ', MIJIKA, 'いのは どれ？'],
    tehon: [TEHON, 'と ', ONAJI, 'じ ', NAGA, 'さは どれ？'],
    nagaiMijikai: [NAGA, 'い？ ', MIJIKA, 'い？'],
    seikai: [K('正解', 'せいかい'), '！ '],
    oshii: ['おしい！ はしを よく ', K('見', 'み'), 'てね。'],
    oshiiTehon: ['おしい！ ', TEHON, 'の はしと くらべてね。'],
    oshiiSoroe: ['おしい！ はしを そろえて ', K('見', 'み'), 'よう。'],
    barres: ['ぼうで くらべて ', K('見', 'み'), 'よう。'],
    soroeta: ['はしを そろえたよ。'],
    otsukare: ['おつかれさま！'],
  };

  /* ======================================================================
     Voix japonaise et sons
     ====================================================================== */

  const synthese = 'speechSynthesis' in window ? window.speechSynthesis : null;

  function voixJaponaise() {
    if (!synthese) return null;
    const voix = synthese.getVoices().filter((v) => /^ja/i.test(v.lang));
    return voix.find((v) => v.localService) || voix[0] || null;
  }

  function parler(segmentsOuTexte) {
    if (!synthese) return;
    const texte = Array.isArray(segmentsOuTexte) ? lecture(segmentsOuTexte) : String(segmentsOuTexte);
    try {
      synthese.cancel();
      const enonce = new SpeechSynthesisUtterance(texte);
      enonce.lang = 'ja-JP';
      const voix = voixJaponaise();
      if (voix) enonce.voice = voix;
      enonce.rate = Number(reglages.vitesse) || 0.9;
      synthese.speak(enonce);
    } catch { /* voix indisponible */ }
  }

  if (synthese) synthese.getVoices();

  let contexteAudio = null;

  function audio() {
    if (!contexteAudio) {
      const Contexte = window.AudioContext || window.webkitAudioContext;
      if (!Contexte) return null;
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
      try { contexteAudio = new Contexte(); } catch { return null; }
    }
    if (contexteAudio.state === 'suspended') contexteAudio.resume().catch(() => {});
    return contexteAudio;
  }

  function note(frequence, { duree = 0.3, type = 'sine', volume = 0.18, delai = 0 } = {}) {
    if (!reglages.sons) return;
    const a = audio();
    if (!a) return;
    const debut = a.currentTime + delai;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.value = frequence;
    gain.gain.setValueAtTime(0.0001, debut);
    gain.gain.exponentialRampToValueAtTime(volume, debut + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, debut + duree);
    osc.connect(gain).connect(a.destination);
    osc.start(debut);
    osc.stop(debut + duree + 0.05);
  }

  const sons = {
    succes: () => [523.25, 659.25, 783.99].forEach((f, i) => note(f, { delai: i * 0.11, duree: 0.28 })),
    oups: () => { note(392, { duree: 0.16, volume: 0.1, type: 'triangle' }); note(330, { duree: 0.24, volume: 0.1, type: 'triangle', delai: 0.15 }); },
    fin: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, { delai: i * 0.14, duree: 0.45 })),
  };

  // Les navigateurs n'autorisent le son qu'après un premier geste complet.
  function debloquerAudio() {
    const a = audio();
    if (!a) return;
    try {
      const source = a.createBufferSource();
      source.buffer = a.createBuffer(1, 1, 22050);
      source.connect(a.destination);
      source.start(0);
    } catch { /* rien */ }
    ['pointerup', 'touchend', 'keydown'].forEach((t) => document.removeEventListener(t, debloquerAudio, true));
  }
  ['pointerup', 'touchend', 'keydown'].forEach((t) => document.addEventListener(t, debloquerAudio, true));

  /* ======================================================================
     Garde tactile : appui maintenu, anti-rebond, tolérance au glissement.
     Le clavier et VoiceOver restent utilisables (clic sans pointeur).
     ====================================================================== */

  let derniereActivation = -Infinity;

  function activable(el, action, { duree = null, garde = true } = {}) {
    let suivi = null;
    let dernierPointeur = -Infinity;

    const terminer = () => {
      if (!suivi) return;
      clearTimeout(suivi.minuteur);
      el.classList.remove('en-appui', 'appui-long');
      suivi = null;
    };

    const declencher = () => {
      const maintenant = performance.now();
      const delai = garde ? Number(reglages.antiRebond) || 0 : 0;
      if (delai && maintenant - derniereActivation < delai) return;
      derniereActivation = maintenant;
      action();
    };

    el.addEventListener('pointerdown', (ev) => {
      if (suivi || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
      const attente = duree !== null ? duree : (garde ? Number(reglages.dureeAppui) || 0 : 0);
      suivi = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, attente };
      el.classList.add('en-appui');
      if (attente > 0) {
        el.style.setProperty('--duree', `${attente}ms`);
        el.classList.add('appui-long');
        suivi.minuteur = setTimeout(() => {
          terminer();
          dernierPointeur = performance.now();
          declencher();
        }, attente);
      }
    });

    el.addEventListener('pointermove', (ev) => {
      if (suivi && ev.pointerId === suivi.id && Math.hypot(ev.clientX - suivi.x, ev.clientY - suivi.y) > 30) terminer();
    });

    el.addEventListener('pointerup', (ev) => {
      if (!suivi || ev.pointerId !== suivi.id) return;
      const immediat = suivi.attente === 0;
      terminer();
      if (immediat) {
        dernierPointeur = performance.now();
        declencher();
      }
    });

    el.addEventListener('pointercancel', terminer);
    el.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse') terminer(); });

    el.addEventListener('click', (ev) => {
      if (ev.detail !== 0 || performance.now() - dernierPointeur < 500) return;
      declencher();
    });

    el.addEventListener('contextmenu', (ev) => ev.preventDefault());
  }

  /* ======================================================================
     Photos des objets de la maison (IndexedDB, sur l'appareil seulement)
     ====================================================================== */

  const Base = (() => {
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

  let photos = [];
  const urlsPhotos = new Map();

  function urlPhoto(p) {
    if (!urlsPhotos.has(p.id)) urlsPhotos.set(p.id, URL.createObjectURL(p.blob));
    return urlsPhotos.get(p.id);
  }

  /* ======================================================================
     Objets dessinés (longueur libre, couleurs tirées au hasard)
     ====================================================================== */

  function svgCrayon(L, c, H = 40) {
    const gomme = Math.min(H * 0.4, L * 0.08);
    const bague = H * 0.2;
    const pointe = Math.min(H, L * 0.22);
    const x0 = L - pointe;
    const g = pointe * 0.32;
    const corps = Math.max(0, x0 - gomme - bague);
    return `<svg viewBox="0 0 ${L} ${H}" width="${L}" height="${H}" aria-hidden="true">`
      + `<rect x="0" y="${H * 0.12}" width="${gomme}" height="${H * 0.76}" rx="${H * 0.1}" style="fill:var(--gomme)"/>`
      + `<rect x="${gomme}" y="${H * 0.07}" width="${bague}" height="${H * 0.86}" style="fill:var(--metal)"/>`
      + `<rect x="${gomme + bague}" y="${H * 0.05}" width="${corps}" height="${H * 0.9}" style="fill:${c}"/>`
      + `<rect x="${gomme + bague}" y="${H * 0.4}" width="${corps}" height="${H * 0.17}" style="fill:#fff;opacity:.22"/>`
      + `<polygon points="${x0},${H * 0.05} ${L - g},${H * 0.38} ${L - g},${H * 0.62} ${x0},${H * 0.95}" style="fill:var(--bois)"/>`
      + `<polygon points="${L - g},${H * 0.38} ${L},${H / 2} ${L - g},${H * 0.62}" style="fill:var(--mine)"/>`
      + '</svg>';
  }

  function svgCable(L, c, H = 36) {
    const prise = Math.min(H * 0.45, L * 0.12);
    const y = H / 2;
    const epais = H * 0.3;
    const haut = H * 0.62;
    return `<svg viewBox="0 0 ${L} ${H}" width="${L}" height="${H}" aria-hidden="true">`
      + `<line x1="${prise}" y1="${y}" x2="${L - prise}" y2="${y}" style="stroke:${c};stroke-width:${epais};stroke-linecap:round"/>`
      + `<rect x="0" y="${y - haut / 2}" width="${prise}" height="${haut}" rx="${H * 0.1}" style="fill:var(--prise)"/>`
      + `<rect x="${L - prise}" y="${y - haut / 2}" width="${prise}" height="${haut}" rx="${H * 0.1}" style="fill:var(--prise)"/>`
      + '</svg>';
  }

  function svgRuban(L, c, H = 30) {
    return `<svg viewBox="0 0 ${L} ${H}" width="${L}" height="${H}" aria-hidden="true">`
      + `<rect x="0" y="${H * 0.07}" width="${L}" height="${H * 0.86}" rx="${H * 0.1}" style="fill:${c}"/>`
      + `<rect x="0" y="${H * 0.17}" width="${L}" height="${H * 0.16}" style="fill:#fff;opacity:.25"/>`
      + '</svg>';
  }

  const SORTES = {
    enpitsu: { yomi: 'えんぴつ', kanji: '鉛筆', dessin: svgCrayon, hauteur: 40 },
    keburu: { yomi: 'ケーブル', kanji: null, dessin: svgCable, hauteur: 36 },
    tepu: { yomi: 'テープ', kanji: null, dessin: svgRuban, hauteur: 30 },
  };

  const couleurs = (n, exclure = []) => melanger([1, 2, 3, 4, 5, 6].filter((c) => !exclure.includes(c))).slice(0, n);
  const objetDessine = (sorte, cm, couleur) => ({ type: 'dessin', sorte, cm, couleur, yomi: SORTES[sorte].yomi, kanji: SORTES[sorte].kanji });
  const objetPhoto = (p) => ({ type: 'photo', id: p.id, cm: p.cm, yomi: p.yomi, kanji: p.kanji || null, w: p.w, h: p.h });

  /* ======================================================================
     Génération des questions
     ====================================================================== */

  const ACTIVITES = [
    { n: 1, titre: ['どっちが ', NAGA, 'い？'], sous: ['やさしい'], fr: 'Lequel est le plus long ? (facile)', barres: [1, 0.42] },
    { n: 2, titre: ['どっちが ', NAGA, 'い？'], sous: ['むずかしい'], fr: 'Lequel est le plus long ? (difficile)', barres: [1, 0.86] },
    { n: 3, titre: [ICHIBAN, ' ', NAGA, 'いのは？'], sous: ['3つから えらぶ'], fr: 'Le plus long parmi trois', barres: [0.62, 1, 0.8] },
    { n: 4, titre: ['ことばで いおう'], sous: ['〇〇は △△より …'], fr: 'La phrase « A は B より 長い »', barres: [1, 0.55] },
    { n: 5, titre: [TEHON, 'と ', ONAJI, 'じ'], sous: [ONAJI, 'じ ', NAGA, 'さを さがす'], fr: 'Même longueur que le modèle', barres: 'tehon' },
    { n: 6, titre: ['cm で くらべる'], sous: ['10\u00a0cm と 43\u00a0cm'], fr: 'Nombres en cm (10 cm ou 43 cm ?)', barres: 'cm' },
    { n: 7, titre: ['m と cm'], sous: ['1\u00a0m ＝ 100\u00a0cm'], fr: 'Mètres et centimètres (1 m ou 75 cm ?)', barres: 'mcm' },
    { n: 8, titre: ['ずれている'], sous: ['はしが そろっていない'], fr: 'Objets décalés (pas alignés à gauche)', barres: 'decale' },
    { n: 9, titre: ['ななめ'], sous: ['かたむいている'], fr: 'Objets penchés', barres: 'incline' },
    { n: 10, etude: 'libre', titre: ['のばして みよう'], sous: [KAZU, 'が かわるよ'], fr: 'べんきょう : étirer le ruban et voir les nombres changer', barres: 'etude-libre' },
    { n: 11, etude: 'plus', titre: ['たしざん'], sous: ['みぎに のばす（＋）'], fr: 'べんきょう : additionner en tirant vers la droite', barres: 'etude-plus' },
    { n: 12, etude: 'moins', titre: ['ひきざん'], sous: ['ひだりに もどす（−）'], fr: 'べんきょう : soustraire en tirant vers la gauche', barres: 'etude-moins' },
  ];

  const animationsReduites = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const entier = (a, b) => Math.floor(aleatoire(a, b + 1));
  const valeurCm = (c) => ({ cm: c, m: null, affichage: `${c}\u00a0cm`, lecture: `${c}センチ` });
  const valeurM = (m) => ({ cm: m * 100, m, affichage: `${m}\u00a0m`, lecture: `${m}メートル` });
  const segValeur = (v) => V(v.affichage, v.lecture);
  const cmTexte = (x) => String(Math.round(x * 10) / 10);
  const segCm = (x) => V(`${cmTexte(x)}\u00a0cm`, `${cmTexte(x)}センチ`);

  // Activité 6 : deux longueurs en cm. Quelques pièges : chiffres inversés (34 / 43), 1 chiffre contre 2 (9 / 12).
  function paireCm(i, derniere) {
    const genre = derniere || i === 0 ? 'facile' : choisir(['facile', 'proche', 'proche', 'piege']);
    let a;
    let b;
    if (genre === 'facile') {
      a = entier(4, 40);
      b = a + entier(20, 50);
    } else if (genre === 'proche') {
      a = entier(12, 85);
      b = a + entier(3, 9);
    } else if (Math.random() < 0.6) {
      const d = entier(1, 7);
      const u = entier(d + 1, 9);
      a = d * 10 + u;
      b = u * 10 + d;
    } else {
      a = entier(6, 9);
      b = entier(10, 15);
    }
    return [valeurCm(a), valeurCm(b)];
  }

  // Activité 7 : des mètres contre des centimètres (1 m contre 75 cm : 75 est plus grand que 1, mais 1 m est plus long).
  function paireMCm(derniere) {
    const m = derniere ? 1 : choisir([1, 1, 2, 2, 3]);
    const mPlusLong = derniere || Math.random() < 0.5;
    const c = mPlusLong ? entier(derniere ? 20 : 40, m * 100 - 10) : entier(m * 100 + 10, m * 100 + 90);
    return [valeurM(m), valeurCm(c)];
  }

  function utiliserPhotos() {
    if (photos.length < 2 || reglages.photos === 'jamais') return false;
    return reglages.photos === 'toujours' || Math.random() < 0.5;
  }

  function pairePhotos(rmin, rmax, nomsDifferents) {
    const possibles = [];
    for (let i = 0; i < photos.length; i++) {
      for (let j = i + 1; j < photos.length; j++) {
        const a = photos[i];
        const b = photos[j];
        const r = Math.max(a.cm, b.cm) / Math.min(a.cm, b.cm);
        if (r >= rmin && r <= rmax && (!nomsDifferents || a.yomi !== b.yomi)) possibles.push([a, b]);
      }
    }
    return possibles.length ? choisir(possibles).map(objetPhoto) : null;
  }

  function trioPhotos(rmin) {
    const t = [...photos].sort((a, b) => a.cm - b.cm);
    const possibles = [];
    for (let i = 0; i < t.length; i++) {
      for (let j = i + 1; j < t.length; j++) {
        for (let k = j + 1; k < t.length; k++) {
          if (t[j].cm / t[i].cm >= rmin && t[k].cm / t[j].cm >= rmin) possibles.push([t[i], t[j], t[k]]);
        }
      }
    }
    return possibles.length ? choisir(possibles).map(objetPhoto) : null;
  }

  function paireDessinee(rmin, rmax, sortesDifferentes) {
    const r = aleatoire(rmin, rmax);
    // Longueurs en cm entiers : elles sont affichées et lues dans l'explication.
    const court = Math.round(aleatoire(5, Math.min(15, 28 / r)));
    const long = Math.max(court + 1, Math.round(court * r));
    const [c1, c2] = couleurs(2);
    const noms = Object.keys(SORTES);
    const s1 = choisir(noms);
    const s2 = sortesDifferentes ? choisir(noms.filter((s) => s !== s1)) : s1;
    return [objetDessine(s1, court, c1), objetDessine(s2, long, c2)];
  }

  function trioDessine(rmin) {
    const r1 = aleatoire(rmin, rmin + 0.2);
    const r2 = aleatoire(rmin, rmin + 0.2);
    const a = Math.round(aleatoire(5, 30 / (r1 * r2)));
    const b = Math.max(a + 1, Math.round(a * r1));
    const c = Math.max(b + 1, Math.round(b * r2));
    const sorte = choisir(Object.keys(SORTES));
    const cs = couleurs(3);
    return [objetDessine(sorte, a, cs[0]), objetDessine(sorte, b, cs[1]), objetDessine(sorte, c, cs[2])];
  }

  const indexMax = (objets) => objets.reduce((m, o, i) => (o.cm > objets[m].cm ? i : m), 0);
  const indexMin = (objets) => objets.reduce((m, o, i) => (o.cm < objets[m].cm ? i : m), 0);

  function genererQuestion(niveau, derniere, i = 0, n = 6) {
    const base = { niveau, essais: new Set(), resolu: false, indices: false };

    if (niveau === 6 || niveau === 7) {
      const mixte = niveau === 7;
      const valeurs = melanger(mixte ? paireMCm(derniere) : paireCm(i, derniere));
      const [c1, c2] = couleurs(2);
      valeurs[0].couleur = c1;
      valeurs[1].couleur = c2;
      const demande = !reglages.court || derniere ? 'long' : choisir(['long', 'court']);
      return {
        ...base,
        type: 'nombre',
        mixte,
        valeurs,
        objets: [],
        demande,
        aide: 0,                 // étape d'aide atteinte
        aideMax: mixte ? 2 : 1,  // 7 : conversion puis barres ; 6 : barres
        bonne: demande === 'long' ? indexMax(valeurs) : indexMin(valeurs),
      };
    }

    if (niveau === 8 || niveau === 9) {
      const facile = derniere;
      const [rmin, rmax] = facile ? [1.8, 2.4] : [1.25, 1.6];
      const objets = melanger((utiliserPhotos() && pairePhotos(facile ? 1.6 : 1.2, facile ? 99 : 1.8, false)) || paireDessinee(rmin, rmax, false));
      const demande = !reglages.court || derniere ? 'long' : choisir(['long', 'court']);
      const long = indexMax(objets);
      const court = 1 - long;
      const cmMax = objets[long].cm;
      const pos = [];   // pour chaque objet : centre (en cm) et angle (en degrés)
      let espaceCm;

      if (niveau === 8) {
        // D'abord alignés à droite, puis décalés (souvent avec le piège : le plus court dépasse plus loin).
        if (derniere || i < Math.ceil(n / 2)) {
          espaceCm = cmMax;
          objets.forEach((o, k) => { pos[k] = { cx: cmMax - o.cm / 2, angle: 0 }; });
        } else {
          espaceCm = cmMax * 1.5;
          const Ll = objets[long].cm;
          const Lc = objets[court].cm;
          const gaucheLong = aleatoire(0, cmMax * 0.12);
          const minPiege = gaucheLong + Ll - Lc + cmMax * 0.06;
          const gaucheCourt = Math.random() < 0.7 && minPiege < espaceCm - Lc
            ? aleatoire(minPiege, espaceCm - Lc)
            : aleatoire(0, espaceCm - Lc);
          pos[long] = { cx: gaucheLong + Ll / 2, angle: 0 };
          pos[court] = { cx: gaucheCourt + Lc / 2, angle: 0 };
        }
      } else {
        espaceCm = cmMax * 1.3;
        const angles = derniere ? [aleatoire(4, 10), aleatoire(4, 10)] : melanger([aleatoire(18, 32), aleatoire(0, 10)]);
        objets.forEach((o, k) => {
          const angle = angles[k] * (Math.random() < 0.5 ? -1 : 1);
          const largeur = o.cm * Math.cos((angle * Math.PI) / 180);
          pos[k] = { cx: aleatoire(largeur / 2, espaceCm - largeur / 2), angle };
        });
      }
      return {
        ...base, type: 'libre', objets, demande, pos, espaceCm, aligne: false,
        bonne: demande === 'long' ? long : court,
      };
    }

    if (niveau === 1 || niveau === 2) {
      const facile = niveau === 1 || derniere;
      const [rmin, rmax] = facile ? [1.8, 2.8] : [1.12, 1.35];
      const [pmin, pmax] = facile ? [1.4, 99] : [1.06, 1.45];
      const objets = melanger((utiliserPhotos() && pairePhotos(pmin, pmax, false)) || paireDessinee(rmin, rmax, false));
      const demande = niveau === 1 || !reglages.court ? 'long' : choisir(['long', 'court']);
      return { ...base, type: 'paire', demande, objets, bonne: demande === 'long' ? indexMax(objets) : indexMin(objets) };
    }

    if (niveau === 3) {
      const rmin = derniere ? 1.5 : 1.22;
      const objets = melanger((utiliserPhotos() && trioPhotos(derniere ? 1.35 : 1.12)) || trioDessine(rmin));
      const demande = reglages.court ? choisir(['long', 'court']) : 'long';
      return { ...base, type: 'trio', demande, objets, bonne: demande === 'long' ? indexMax(objets) : indexMin(objets) };
    }

    if (niveau === 4) {
      const [rmin, rmax] = derniere ? [1.8, 2.6] : [1.4, 2.2];
      const objets = melanger((utiliserPhotos() && pairePhotos(derniere ? 1.4 : 1.25, 99, true)) || paireDessinee(rmin, rmax, true));
      const sujet = Math.random() < 0.5 ? 0 : 1;
      const autre = 1 - sujet;
      const bonne = objets[sujet].cm > objets[autre].cm ? 'long' : 'court';
      return { ...base, type: 'phrase', objets, sujet, autre, bonne };
    }

    // Niveau 5 : retrouver la même longueur que le modèle (comme couper un câble au modèle).
    const sorte = choisir(['keburu', 'tepu']);
    const m = entier(9, 19);
    const [cModele, ...cs] = couleurs(4);
    const facteurs = derniere
      ? [aleatoire(0.45, 0.6), aleatoire(1.45, 1.6)]
      : [aleatoire(0.68, 0.82), aleatoire(1.22, 1.38)];
    const autre = (f) => {
      const v = Math.round(m * f);
      return v === m ? m + (f > 1 ? 1 : -1) : v;
    };
    const candidats = melanger([
      { ...objetDessine(sorte, m, cs[0]), egal: true },
      objetDessine(sorte, autre(facteurs[0]), cs[1]),
      objetDessine(sorte, autre(facteurs[1]), cs[2]),
    ]);
    return {
      ...base,
      type: 'tehon',
      modele: objetDessine(sorte, m, cModele),
      objets: candidats,
      bonne: candidats.findIndex((o) => o.egal),
    };
  }

  /* ======================================================================
     Écrans
     ====================================================================== */

  const ECRANS = ['accueil', 'question', 'etude', 'fin', 'parents', 'photo'];
  let ecranActuel = 'accueil';

  function montrer(nom) {
    ECRANS.forEach((e) => { $(`ecran-${e}`).hidden = e !== nom; });
    ecranActuel = nom;
    window.scrollTo(0, 0);
  }

  /* ----- Accueil ----- */

  function svgActivite(barres) {
    const x0 = 10;
    const L = 236;
    let contenu = `<rect x="4" y="2" width="6" height="60" rx="2" style="fill:var(--repere)"/>`;
    if (barres === 'cm' || barres === 'mcm') {
      const [a, b] = barres === 'cm' ? ['10 cm', '43 cm'] : ['1 m', '75 cm'];
      const style = 'fill:var(--encre);font-size:24px;font-weight:700';
      contenu = `<text x="6" y="27" style="${style}">${a}</text><text x="6" y="58" style="${style}">${b}</text>`
        + `<text x="150" y="44" style="fill:var(--action);font-size:30px;font-weight:700">？</text>`;
    } else if (barres === 'decale') {
      contenu = `<rect x="70" y="10" width="170" height="16" rx="3" style="fill:var(--o2)"/>`
        + `<rect x="12" y="38" width="190" height="16" rx="3" style="fill:var(--o5)"/>`;
    } else if (barres === 'incline') {
      contenu = `<rect x="20" y="10" width="200" height="14" rx="3" transform="rotate(8 120 17)" style="fill:var(--o4)"/>`
        + `<rect x="40" y="40" width="160" height="14" rx="3" transform="rotate(-10 120 47)" style="fill:var(--o3)"/>`;
    } else if (barres === 'etude-libre') {
      contenu += `<rect x="10" y="26" width="140" height="18" rx="3" style="fill:var(--o2)"/>`
        + `<circle cx="150" cy="35" r="14" style="fill:var(--surface);stroke:var(--encre);stroke-width:4"/>`
        + `<path d="M176 35h60M228 27l8 8-8 8M184 27l-8 8 8 8" style="fill:none;stroke:var(--encre);stroke-width:3"/>`;
    } else if (barres === 'etude-plus') {
      contenu += `<rect x="10" y="26" width="110" height="18" rx="3" style="fill:var(--o2)"/>`;
      for (let k = 0; k < 5; k++) contenu += `<rect x="${122 + k * 22}" y="26" width="20" height="18" rx="2" style="fill:var(--o3)"/>`;
      contenu += `<text x="150" y="18" style="fill:var(--o3);font-size:18px;font-weight:700">＋5</text>`;
    } else if (barres === 'etude-moins') {
      contenu += `<rect x="10" y="26" width="140" height="18" rx="3" style="fill:var(--o2)"/>`;
      for (let k = 0; k < 4; k++) contenu += `<rect x="${152 + k * 22}" y="27" width="19" height="16" rx="2" style="fill:none;stroke:var(--o4);stroke-width:2;stroke-dasharray:4 3"/>`;
      contenu += `<text x="170" y="18" style="fill:var(--o4);font-size:18px;font-weight:700">−4</text>`;
    } else if (barres === 'tehon') {
      contenu += `<rect x="${x0}" y="4" width="${L * 0.66}" height="14" rx="3" style="fill:none;stroke:var(--encre-douce);stroke-width:2.5;stroke-dasharray:6 4"/>`;
      contenu += `<rect x="${x0}" y="27" width="${L * 0.66}" height="12" rx="3" style="fill:var(--o3)"/>`;
      contenu += `<rect x="${x0}" y="47" width="${L * 0.92}" height="12" rx="3" style="fill:var(--o5)"/>`;
    } else {
      const h = barres.length === 3 ? 13 : 18;
      const pas = barres.length === 3 ? 21 : 28;
      const teintes = ['--o2', '--o5', '--o4'];
      barres.forEach((b, i) => {
        contenu += `<rect x="${x0}" y="${6 + i * pas}" width="${L * b}" height="${h}" rx="3" style="fill:var(${teintes[i]})"/>`;
      });
    }
    return `<svg viewBox="0 0 256 64" preserveAspectRatio="xMinYMid meet" aria-hidden="true">${contenu}</svg>`;
  }

  function rendreAccueil() {
    $('sous-titre').innerHTML = html([NAGA, 'い？ ', MIJIKA, 'い？']);
    const zone = $('activites');
    zone.replaceChildren();
    const groupes = [
      { titre: ['もんだい'], liste: ACTIVITES.filter((a) => !a.etude) },
      { titre: [K('勉強', 'べんきょう')], liste: ACTIVITES.filter((a) => a.etude) },
    ];
    groupes.forEach((groupe) => {
      const visibles = groupe.liste.filter((a) => reglages.activites.includes(a.n));
      if (!visibles.length) return;
      const titre = document.createElement('h2');
      titre.className = 'groupe-titre';
      titre.innerHTML = html(groupe.titre);
      zone.append(titre);
      visibles.forEach((a) => {
        const carte = document.createElement('button');
        carte.type = 'button';
        carte.className = 'activite';
        carte.innerHTML = `<span class="numero">${a.n}</span>${svgActivite(a.barres)}`
          + `<strong>${html(a.titre)}</strong><span class="sous">${html(a.sous)}</span>`;
        carte.setAttribute('aria-label', `${a.n}. ${lecture(a.titre)} ${lecture(a.sous)}`);
        activable(carte, () => (a.etude ? demarrerEtude(a.etude) : demarrer(a.n)));
        zone.append(carte);
      });
    });
  }

  /* ----- Série de questions ----- */

  let session = null;
  const courante = () => session.questions[session.index];

  function demarrer(niveau) {
    const n = Number(reglages.nbQuestions) || 6;
    session = {
      niveau,
      questions: Array.from({ length: n }, (_, i) => genererQuestion(niveau, i === n - 1, i, n)),
      index: 0,
    };
    montrer('question');
    afficherQuestion();
  }

  function consigneDe(q) {
    if (q.type === 'paire' || q.type === 'nombre' || q.type === 'libre') {
      return q.demande === 'long' ? PHRASES.dotchiNagai : PHRASES.dotchiMijikai;
    }
    if (q.type === 'trio') return q.demande === 'long' ? PHRASES.ichibanNagai : PHRASES.ichibanMijikai;
    if (q.type === 'tehon') return PHRASES.tehon;
    return PHRASES.nagaiMijikai;
  }

  function phraseDe(q, mot) {
    const a = nomDe(q.objets[q.sujet]);
    const b = nomDe(q.objets[q.autre]);
    if (!mot) return [a, 'は ', b, 'より '];
    return [a, 'は ', b, 'より ', mot === 'long' ? NAGA : MIJIKA, 'い。'];
  }

  // Comment désigner un objet dans l'explication : son nom, ou sa place (うえ / まんなか / した).
  const POSITIONS = { 2: ['うえ', 'した'], 3: ['うえ', 'まんなか', 'した'] };

  function reference(q, i) {
    if (q.type === 'phrase') return nomDe(q.objets[i]);
    const nomsDistincts = new Set(q.objets.map((o) => o.yomi)).size === q.objets.length;
    if (q.type !== 'libre' && reglages.noms && nomsDistincts) return nomDe(q.objets[i]);
    return (POSITIONS[q.objets.length] || [])[i] || 'これ';
  }

  // La règle à retenir : « long » = le nombre le plus grand, « court » = le plus petit.
  function regleNombre(sens, superlatif) {
    const mot = sens === 'long' ? NAGA : MIJIKA;
    const taille = sens === 'long' ? [OOKI, 'きい'] : [CHIISA, 'さい'];
    return superlatif
      ? [ICHIBAN, ' ', mot, 'いのは ', KAZU, 'が ', ICHIBAN, ' ', ...taille, ' ほう。 ']
      : [mot, 'いのは ', KAZU, 'が ', ...taille, ' ほう。 '];
  }

  // La même règle, en court, affichée sous la consigne après une bonne réponse.
  function rappelDe(q) {
    if (q.type === 'tehon') return [ONAJI, 'じ ', NAGA, 'さ ＝ ', ONAJI, 'じ ', KAZU];
    const sens = q.type === 'phrase' ? q.bonne : q.demande;
    const mot = sens === 'long' ? NAGA : MIJIKA;
    const taille = sens === 'long' ? [OOKI, 'きい'] : [CHIISA, 'さい'];
    if (q.type === 'trio') return [ICHIBAN, ' ', mot, 'い ＝ ', KAZU, 'が ', ICHIBAN, ' ', ...taille];
    return [mot, 'い ＝ ', KAZU, 'が ', ...taille];
  }

  // L'explication donne toujours les longueurs, la règle, puis la conclusion avec l'écart.
  function explication(q) {
    const plus = q.demande === 'long' ? NAGA : MIJIKA;
    if (q.type === 'nombre') {
      const [a, b] = q.valeurs;
      const fin = [...regleNombre(q.demande), segValeur(q.valeurs[q.bonne]), 'の ほうが ', segCm(Math.abs(a.cm - b.cm)), ' ', plus, 'いね。'];
      if (!q.mixte) return fin;
      // On ne compare les nombres qu'une fois dans la même unité.
      const m = q.valeurs.find((v) => v.m);
      const c = q.valeurs.find((v) => !v.m);
      return [segValeur(m), 'は ', segCm(m.cm), '。 ', segCm(m.cm), 'と ', segCm(c.cm), '。 ', ...fin];
    }
    if (q.type === 'tehon') {
      return [TEHON, 'は ', segCm(q.modele.cm), '。 これも ', segCm(q.objets[q.bonne].cm), '。 ', ONAJI, 'じ ', KAZU, 'だから、 ', ONAJI, 'じ ', NAGA, 'さだね。'];
    }
    const longueurs = [];
    q.objets.forEach((o, i) => {
      longueurs.push(reference(q, i), 'は ', segCm(o.cm), i < q.objets.length - 1 ? '、 ' : '。 ');
    });
    const debut = q.type === 'libre' ? ['はしを そろえると、 ', ...longueurs] : longueurs;
    if (q.type === 'phrase') return [...debut, ...regleNombre(q.bonne), 'だから ', ...phraseDe(q, q.bonne)];
    if (q.type === 'trio') return [...debut, ...regleNombre(q.demande, true), reference(q, q.bonne), 'だね。'];
    const ecart = Math.abs(q.objets[0].cm - q.objets[1].cm);
    return [...debut, ...regleNombre(q.demande), reference(q, q.bonne), 'の ほうが ', segCm(ecart), ' ', plus, 'いね。'];
  }

  function afficherQuestion() {
    const q = courante();
    $('retour').textContent = '';
    $('retour').classList.remove('ok');
    $('btn-suivant').hidden = true;
    $('confirmation-quitter').hidden = true;
    $('rappel').hidden = true;
    rendreQuestion();
    parlerConsigne();
  }

  function parlerConsigne() {
    const q = courante();
    // Une fois la question résolue, 🔊 fait réécouter l'explication.
    if (q.resolu && q.messageFinal) {
      parler(q.messageFinal);
      return;
    }
    if (q.type === 'phrase') parler([...phraseDe(q), '…… ', ...PHRASES.nagaiMijikai]);
    else if (q.type === 'nombre') parler([segValeur(q.valeurs[0]), 'と ', segValeur(q.valeurs[1]), '、 ', ...consigneDe(q)]);
    else parler(consigneDe(q));
  }

  function rendreProgression() {
    const liste = $('progression');
    liste.replaceChildren();
    session.questions.forEach((q, i) => {
      const point = document.createElement('li');
      if (i < session.index || (i === session.index && q.resolu)) point.classList.add('fait');
      if (i === session.index) point.classList.add('actuel');
      liste.append(point);
    });
  }

  let lignes = [];

  function creerLigne(objet, interactif, etiquette) {
    const el = document.createElement(interactif ? 'button' : 'div');
    el.className = 'ligne';
    if (interactif) el.type = 'button';
    const etiq = document.createElement('span');
    etiq.className = 'etiquette';
    etiq.innerHTML = html(etiquette || [nomDe(objet)]);
    const piste = document.createElement('span');
    piste.className = 'piste';
    const forme = document.createElement('span');
    forme.className = 'objet';
    if (objet.type === 'photo') {
      const p = photos.find((x) => x.id === objet.id);
      const img = document.createElement('img');
      img.alt = objet.yomi;
      img.draggable = false;
      if (p) img.src = urlPhoto(p);
      forme.append(img);
    }
    piste.append(forme);
    el.append(etiq, piste);
    return { el, etiq, piste, forme, objet, largeur: 0 };
  }

  function rendreQuestion() {
    const q = courante();
    rendreProgression();
    $('consigne').innerHTML = htmlMots(consigneDe(q));

    const phrase = $('phrase');
    const choix = $('choix-mots');
    phrase.hidden = q.type !== 'phrase';
    choix.hidden = q.type !== 'phrase';

    const etabli = $('etabli');
    etabli.replaceChildren();
    etabli.classList.remove('libre', 'nombres');
    etabli.classList.toggle('sans-noms', !reglages.noms && q.type !== 'phrase');
    lignes = [];
    libres = [];

    const zoneReperes = document.createElement('div');
    zoneReperes.className = 'reperes';
    zoneReperes.id = 'reperes';

    if (q.type === 'libre') {
      rendreLibre(q, etabli);
      etabli.append(zoneReperes);
      if (q.aligne && q.preuve) afficherPreuve();
      else if (q.indices && q.aligne) afficherReperesLibre();
      majBoutonAide();
      return;
    }

    if (q.type === 'nombre') {
      etabli.classList.add('nombres');
      etabli.classList.remove('sans-noms');
      const barres = q.aide >= q.aideMax;
      q.valeurs.forEach((v, i) => {
        const l = creerLigne(objetDessine('tepu', v.cm, v.couleur), true, [segValeur(v)]);
        l.index = i;
        if (v.m && q.aide >= 1) {
          const conversion = document.createElement('span');
          conversion.className = 'conversion';
          conversion.textContent = `＝ ${v.cm}\u00a0cm`;
          l.etiq.append(conversion);
        }
        l.piste.hidden = !barres;
        l.el.setAttribute('aria-label', v.lecture);
        if (q.resolu && i === q.bonne) l.el.classList.add('juste');
        if (q.essais.has(i)) l.el.classList.add('essaye');
        activable(l.el, () => repondre(i));
        etabli.append(l.el);
        lignes.push(l);
      });
      etabli.append(zoneReperes);
      if (barres) dimensionner();
      if (q.preuve) afficherPreuve();
      else if (q.indices && barres) afficherReperes();
      majBoutonAide();
      return;
    }

    if (q.type === 'tehon') {
      const zone = document.createElement('div');
      zone.className = 'zone-modele';
      const l = creerLigne(q.modele, false, [TEHON]);
      l.el.classList.add('modele');
      l.modele = true;
      zone.append(l.el);
      etabli.append(zone);
      lignes.push(l);
    }

    q.objets.forEach((objet, i) => {
      const interactif = q.type !== 'phrase';
      const l = creerLigne(objet, interactif);
      l.index = i;
      if (interactif) {
        l.el.setAttribute('aria-label', `${i + 1}ばんめ${reglages.noms ? ` ${objet.yomi}` : ''}`);
        if (q.resolu && i === q.bonne) l.el.classList.add('juste');
        if (q.essais.has(i)) l.el.classList.add('essaye');
        activable(l.el, () => repondre(i));
      }
      etabli.append(l.el);
      lignes.push(l);
    });

    etabli.append(zoneReperes);

    dimensionner();

    if (q.type === 'phrase') rendrePhrase();
    if (q.preuve) afficherPreuve();
    else if (q.indices) afficherReperes();
    majBoutonAide();
  }

  function afficherRappel(q) {
    const rappel = $('rappel');
    rappel.innerHTML = htmlMots(rappelDe(q));
    rappel.hidden = false;
  }

  /* ----- Preuve après une bonne réponse : longueurs, règle, partie qui dépasse ----- */

  let echelle = null;   // { ppc } : pixels par centimètre de la question affichée
  const reserveRegle = () => (window.innerHeight < 520 ? 40 : 50);

  // Graduations lisibles : un nombre tous les 34 px au moins, un trait tous les 6 px au moins.
  function pasRegle(ppc) {
    const etiquette = [1, 2, 5, 10, 20, 50, 100].find((p) => p * ppc >= 34) || 100;
    const trait = [1, 2, 5, 10, 20, 50].find((p) => p * ppc >= 6 && etiquette % p === 0) || etiquette;
    return { etiquette, trait };
  }

  function dessinerRegle(etabli, x0, ppc, cmMax, avecMetres) {
    const { etiquette, trait } = pasRegle(ppc);
    const place = etabli.clientWidth - x0 - 40;
    const cmFin = Math.max(trait, Math.min(Math.floor(place / ppc / trait) * trait, Math.ceil((cmMax * 1.05) / trait) * trait));
    const hauteur = avecMetres ? 44 : 32;
    let traits = '';
    for (let c = 0; c <= cmFin; c += trait) {
      const x = c * ppc;
      const grand = c % etiquette === 0;
      traits += `<line x1="${x}" y1="0" x2="${x}" y2="${grand ? 12 : 6}"/>`;
      if (grand) traits += `<text x="${x}" y="26">${c}</text>`;
      if (avecMetres && c > 0 && c % 100 === 0) traits += `<text class="m" x="${x}" y="41">${c / 100}\u00a0m</text>`;
    }
    const largeur = cmFin * ppc;
    const regle = document.createElement('div');
    regle.className = 'regle preuve';
    regle.style.left = `${x0}px`;
    regle.style.width = `${largeur}px`;
    regle.innerHTML = `<svg width="${largeur}" height="${hauteur}" aria-hidden="true">${traits}`
      + `<text class="unite" x="${largeur + 10}" y="26">cm</text></svg>`;
    etabli.append(regle);
  }

  // La partie de l'objet le plus long qui dépasse, avec l'écart en cm.
  function dessinerEcart(etabli, xCourt, xLong, top, hauteur, ecart, libelle, variante) {
    if (xLong - xCourt < 2) return;
    const zone = document.createElement('div');
    zone.className = `ecart preuve${variante ? ` ${variante}` : ''}`;
    zone.style.left = `${xCourt}px`;
    zone.style.width = `${xLong - xCourt}px`;
    zone.style.top = `${top}px`;
    zone.style.height = `${hauteur}px`;
    const texte = document.createElement('span');
    texte.textContent = libelle || `${cmTexte(ecart)}\u00a0cm`;
    zone.append(texte);
    etabli.append(zone);
  }

  function afficherPreuve() {
    const q = courante();
    const etabli = $('etabli');
    etabli.querySelectorAll('.preuve').forEach((e) => e.remove());

    if (q.type === 'libre') {
      if (!geometrie || !libres.length) return;
      const { offsetX, ppc } = geometrie;
      afficherReperesLibre();
      dessinerRegle(etabli, offsetX, ppc, Math.max(...q.objets.map((o) => o.cm)), false);
      libres.forEach((item) => {
        const mesure = document.createElement('span');
        mesure.className = 'mesure-libre preuve';
        mesure.textContent = `${cmTexte(item.objet.cm)}\u00a0cm`;
        mesure.style.left = `${offsetX}px`;
        mesure.style.top = `${parseFloat(item.el.style.top) - 32}px`;
        etabli.append(mesure);
      });
      const [a, b] = libres;
      const longue = a.objet.cm >= b.objet.cm ? a : b;
      const courte = longue === a ? b : a;
      dessinerEcart(etabli, courte.finX, longue.finX, parseFloat(longue.el.style.top) - 6, longue.h + 12, longue.objet.cm - courte.objet.cm);
      return;
    }

    const visibles = lignes.filter((l) => !l.piste.hidden);
    if (!visibles.length || !echelle) return;
    if (q.type !== 'nombre') {
      visibles.forEach((l) => {
        const mesure = document.createElement('span');
        mesure.className = 'mesure preuve';
        mesure.textContent = `${cmTexte(l.objet.cm)}\u00a0cm`;
        l.etiq.append(mesure);
      });
    }
    afficherReperes();
    const base = etabli.getBoundingClientRect();
    const x0 = visibles[0].piste.getBoundingClientRect().left - base.left + 7;
    dessinerRegle(etabli, x0, echelle.ppc, Math.max(...visibles.map((l) => l.objet.cm)), q.type === 'nombre' && q.mixte);
    if (['paire', 'phrase', 'nombre'].includes(q.type) && visibles.length === 2) {
      const [a, b] = visibles;
      const longue = a.objet.cm >= b.objet.cm ? a : b;
      const courte = longue === a ? b : a;
      const r = longue.forme.getBoundingClientRect();
      dessinerEcart(etabli, x0 + courte.largeur, x0 + longue.largeur, r.top - base.top - 6, r.height + 12, longue.objet.cm - courte.objet.cm);
    }
  }

  /* ----- Objets décalés ou penchés (activités 8 et 9) ----- */

  let libres = [];          // { el, objet, index, L, h, finX }
  let geometrie = null;     // { offsetX, ppc, couloir, marge }

  function rendreLibre(q, etabli) {
    etabli.classList.add('libre');
    const marge = 16;
    const W = etabli.clientWidth - 2 * marge;
    const H = etabli.clientHeight - 2 * marge - reserveRegle();
    const couloir = H / q.objets.length;
    const grossir = window.innerWidth >= 700 && window.innerHeight >= 520 ? 1.45 : 1;
    let ppc = W / q.espaceCm;
    q.objets.forEach((o, i) => {
      const a = (Math.abs(q.pos[i].angle) * Math.PI) / 180;
      const sin = Math.sin(a);
      const cos = Math.cos(a);
      if (o.type === 'photo') {
        const r = o.h / o.w;
        ppc = Math.min(ppc, (couloir - 14) / (o.cm * (sin + r * cos)), Math.min(112, couloir - 14) / (o.cm * r));
      } else if (sin > 0.001) {
        const h = SORTES[o.sorte].hauteur * grossir;
        ppc = Math.min(ppc, (couloir - 14 - h * cos) / (o.cm * sin));
      }
    });
    ppc = Math.max(ppc, 1);
    const offsetX = marge + (W - q.espaceCm * ppc) / 2;
    geometrie = { offsetX, ppc, couloir, marge };

    const depart = document.createElement('span');
    depart.className = 'depart-libre';
    depart.id = 'depart-libre';
    depart.style.left = `${offsetX - 7}px`;
    depart.hidden = !q.aligne;
    etabli.append(depart);

    libres = q.objets.map((o, i) => {
      const L = Math.max(8, o.cm * ppc);
      const h = o.type === 'photo' ? L * (o.h / o.w) : SORTES[o.sorte].hauteur * grossir;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'objet-libre';
      el.style.width = `${L}px`;
      el.style.height = `${h}px`;
      if (o.type === 'dessin') {
        el.innerHTML = SORTES[o.sorte].dessin(Math.round(L), `var(--o${o.couleur})`, Math.round(h));
      } else {
        const p = photos.find((x) => x.id === o.id);
        const img = document.createElement('img');
        img.alt = '';
        img.draggable = false;
        if (p) img.src = urlPhoto(p);
        el.append(img);
      }
      el.setAttribute('aria-label', `${i + 1}ばんめ${reglages.noms ? ` ${o.yomi}` : ''}`);
      if (q.resolu && i === q.bonne) el.classList.add('juste');
      if (q.essais.has(i)) el.classList.add('essaye');
      activable(el, () => repondre(i));
      const item = { el, objet: o, index: i, L, h };
      placerLibre(q, item);
      etabli.append(el);
      return item;
    });
  }

  function placerLibre(q, item) {
    const { offsetX, ppc, couloir, marge } = geometrie;
    const p = q.pos[item.index];
    const cx = q.aligne ? item.objet.cm / 2 : p.cx;
    const angle = q.aligne ? 0 : p.angle;
    const centreX = offsetX + cx * ppc;
    const centreY = marge + couloir * (item.index + 0.5);
    item.el.style.left = `${centreX - item.L / 2}px`;
    item.el.style.top = `${centreY - item.h / 2}px`;
    item.el.style.transform = `rotate(${angle}deg)`;
    item.finX = offsetX + item.objet.cm * ppc;
  }

  // Fait glisser (et redresse) les objets jusqu'à la ligne de départ.
  function aligner() {
    const q = courante();
    if (q.type !== 'libre' || q.aligne) return;
    q.aligne = true;
    libres.forEach((item) => placerLibre(q, item));
    $('depart-libre').hidden = false;
    majBoutonAide();
    setTimeout(() => {
      if (courante() !== q || ecranActuel !== 'question') return;
      if (q.preuve) afficherPreuve();
      else if (q.indices) afficherReperesLibre();
    }, animationsReduites() ? 0 : 850);
  }

  function afficherReperesLibre() {
    const zone = $('reperes');
    if (!zone) return;
    zone.replaceChildren();
    libres.forEach((item) => {
      const trait = document.createElement('span');
      trait.className = 'repere-fin';
      trait.style.left = `${item.finX}px`;
      const o = item.objet;
      trait.style.setProperty('--c', o.type === 'dessin' ? `var(--o${o.couleur})` : 'var(--encre)');
      zone.append(trait);
    });
  }

  /* ----- Bouton d'aide : « ヒント » (nombres) ou « そろえる » (objets libres) ----- */

  function messageAide(q) {
    if (q.mixte && q.aide === 1) {
      const m = q.valeurs.find((v) => v.m);
      return [segValeur(m), 'は ', segValeur(valeurCm(m.cm)), '。'];
    }
    return PHRASES.barres;
  }

  function majBoutonAide() {
    const q = courante();
    const bouton = $('btn-aide');
    let texte = '';
    if (reglages.aide && !q.resolu) {
      if (q.type === 'nombre' && q.aide < q.aideMax) texte = 'ヒント';
      if (q.type === 'libre' && !q.aligne) texte = 'そろえる';
    }
    bouton.textContent = texte;
    bouton.hidden = !texte;
  }

  function avancerAide() {
    const q = courante();
    if (q.resolu) return;
    if (q.type === 'libre') {
      aligner();
      $('retour').innerHTML = htmlMots(PHRASES.soroeta);
      $('retour').classList.remove('ok');
      parler(PHRASES.soroeta);
      return;
    }
    if (q.type !== 'nombre' || q.aide >= q.aideMax) return;
    q.aide += 1;
    rendreQuestion();
    const message = messageAide(q);
    $('retour').innerHTML = htmlMots(message);
    $('retour').classList.remove('ok');
    parler(message);
  }

  function dimensionner() {
    if (!lignes.length) return;
    // Place gardée à droite pour la coche « juste » (sur téléphone en portrait, elle est au-dessus).
    const reserve = window.matchMedia('(max-width: 560px)').matches ? 10 : 56;
    const largeurPiste = lignes[lignes.length - 1].piste.clientWidth - 7 - reserve;
    const objets = lignes.map((l) => l.objet);
    if (lignes.every((l) => l.piste.hidden)) return;
    const cmMax = Math.max(...objets.map((o) => o.cm));
    let ppc = Math.max(1, largeurPiste) / cmMax;
    const hauteurMax = window.innerWidth < 560 || window.innerHeight < 520 ? 72 : 112;
    const grossir = window.innerWidth >= 700 && window.innerHeight >= 520 ? 1.45 : 1;
    objets.filter((o) => o.type === 'photo').forEach((o) => {
      ppc = Math.min(ppc, hauteurMax / (o.cm * (o.h / o.w)));
    });
    echelle = { ppc };
    lignes.forEach((l) => {
      const o = l.objet;
      const largeur = Math.max(8, o.cm * ppc);
      l.largeur = largeur;
      l.forme.style.width = `${largeur}px`;
      if (o.type === 'dessin') {
        const sorte = SORTES[o.sorte];
        l.forme.innerHTML = sorte.dessin(Math.round(largeur), `var(--o${o.couleur})`, Math.round(sorte.hauteur * grossir));
      } else {
        const img = l.forme.querySelector('img');
        img.style.width = `${largeur}px`;
        img.style.height = `${largeur * (o.h / o.w)}px`;
      }
    });
  }

  function afficherReperes() {
    const zone = $('reperes');
    if (!zone) return;
    zone.replaceChildren();
    const base = $('etabli').getBoundingClientRect().left;
    lignes.forEach((l) => {
      if (l.piste.hidden) return;
      const x = l.piste.getBoundingClientRect().left - base + 7 + l.largeur;
      const trait = document.createElement('span');
      trait.className = 'repere-fin';
      trait.style.left = `${x}px`;
      const o = l.objet;
      trait.style.setProperty('--c', o.type === 'dessin' ? `var(--o${o.couleur})` : 'var(--encre)');
      zone.append(trait);
    });
  }

  function rendrePhrase() {
    const q = courante();
    const debut = htmlMots(phraseDe(q));
    const trou = q.resolu ? html([q.bonne === 'long' ? NAGA : MIJIKA, 'い']) : '';
    $('phrase').innerHTML = `${debut}<span class="trou">${trou}</span>${q.resolu ? '。' : ''}`;

    const choix = $('choix-mots');
    choix.replaceChildren();
    ['long', 'court'].forEach((mot) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.innerHTML = html([mot === 'long' ? NAGA : MIJIKA, 'い']);
      if (q.resolu && q.bonne === mot) b.classList.add('juste');
      if (q.essais.has(mot)) b.classList.add('essaye');
      activable(b, () => repondre(mot));
      choix.append(b);
    });
  }

  function repondre(reponse) {
    const q = courante();
    if (q.resolu || q.essais.has(reponse)) return;

    if (reponse === q.bonne) {
      q.resolu = true;
      q.preuve = true;
      sons.succes();
      const message = [...PHRASES.seikai, ...explication(q)];
      q.messageFinal = message;
      $('retour').innerHTML = htmlMots(message);
      $('retour').classList.add('ok');
      afficherRappel(q);
      parler(message);
      // Même trouvé du premier coup, on montre pourquoi c'est juste.
      if (q.type === 'nombre' && q.aide < q.aideMax) {
        q.aide = q.aideMax;
        rendreQuestion();
      }
      rendreApresReponse();
      if (q.type === 'libre') {
        q.indices = true;
        if (q.aligne) afficherPreuve(); else aligner();
      } else {
        afficherPreuve();
      }
      majBoutonAide();
      $('btn-suivant').hidden = false;
      return;
    }

    q.essais.add(reponse);
    q.indices = true;
    sons.oups();
    let message = q.type === 'tehon' ? PHRASES.oshiiTehon : PHRASES.oshii;
    if (q.type === 'libre') message = PHRASES.oshiiSoroe;
    if (q.type === 'nombre' && q.aide < q.aideMax) {
      // Après une erreur, l'aide avance d'une étape (conversion, puis barres).
      q.aide += 1;
      message = ['おしい！ ', ...messageAide(q)];
      rendreQuestion();
    }
    $('retour').innerHTML = htmlMots(message);
    $('retour').classList.remove('ok');
    parler(message);
    rendreApresReponse(reponse);
    if (q.type === 'libre') {
      if (q.aligne) afficherReperesLibre(); else aligner();
    }
    majBoutonAide();
  }

  function rendreApresReponse(erreur) {
    const q = courante();
    rendreProgression();
    if (q.type === 'libre') {
      libres.forEach((item) => {
        item.el.classList.toggle('juste', q.resolu && item.index === q.bonne);
        item.el.classList.toggle('essaye', q.essais.has(item.index));
      });
      return;
    }
    lignes.forEach((l) => {
      if (l.modele || l.index === undefined || q.type === 'phrase') return;
      l.el.classList.toggle('juste', q.resolu && l.index === q.bonne);
      l.el.classList.toggle('essaye', q.essais.has(l.index));
      if (erreur === l.index) {
        l.el.classList.remove('secoue');
        void l.el.offsetWidth;
        l.el.classList.add('secoue');
      }
    });
    if (q.type === 'phrase') rendrePhrase();
    if (q.indices) afficherReperes();
  }

  function suivant() {
    if (session.index >= session.questions.length - 1) {
      afficherFin();
      return;
    }
    session.index += 1;
    afficherQuestion();
  }

  let finDe = 'question';   // ce que « もういちど » recommence : une série de questions ou de べんきょう

  function afficherFin() {
    finDe = 'question';
    montrer('fin');
    const n = session.questions.length;
    $('fin-titre').innerHTML = htmlMots(PHRASES.otsukare);
    const texte = [String(n), K('問', 'もん'), ' できたよ。'];
    $('fin-texte').innerHTML = htmlMots(texte);
    sons.fin();
    parler([...PHRASES.otsukare, ' ', ...texte]);
  }

  activable($('btn-suivant'), suivant);
  activable($('btn-aide'), avancerAide);
  activable($('btn-ecouter'), parlerConsigne, { garde: false });
  activable($('btn-quitter'), () => { $('confirmation-quitter').hidden = false; });
  $('quitter-oui').addEventListener('click', () => { rendreAccueil(); montrer('accueil'); });
  $('quitter-non').addEventListener('click', () => { $('confirmation-quitter').hidden = true; });
  activable($('btn-recommencer'), () => (finDe === 'etude' ? demarrerEtude(etude.mode) : demarrer(session.niveau)));
  activable($('btn-menu'), () => { rendreAccueil(); montrer('accueil'); });

  let minuteurRedim = 0;

  /* ======================================================================
     べんきょう : tirer un ruban sur la règle et voir les nombres changer
     (étirer librement, additionner en tirant à droite, soustraire à gauche)
     ====================================================================== */

  let etude = null;

  function demarrerEtude(mode) {
    etude = { mode, index: 0, total: Number(reglages.nbQuestions) || 6 };
    montrer('etude');
    nouveauProbleme();
  }

  function nouveauProbleme() {
    const e = etude;
    const max = Number(reglages.nombreMax) || 20;
    e.resolu = false;
    if (e.mode === 'libre') {
      e.base = Math.round(max / 2);
      e.pas = null;
      e.cible = null;
    } else if (e.mode === 'plus') {
      e.pas = entier(1, Math.min(9, max - 1));
      e.base = entier(1, max - e.pas);
      e.cible = e.base + e.pas;
    } else {
      e.pas = entier(1, Math.min(9, max - 1));
      e.base = entier(e.pas + 1, max);
      e.cible = e.base - e.pas;
    }
    e.valeur = e.base;
    e.depart = e.base;
    $('etude-retour').textContent = '';
    $('etude-retour').classList.remove('ok');
    $('etude-suivant').hidden = true;
    rendreEtude();
    parler(consigneEtude(true));
  }

  function bornesEtude() {
    const max = Number(reglages.nombreMax) || 20;
    if (etude.mode === 'plus') return [etude.base, max];
    if (etude.mode === 'moins') return [0, etude.base];
    return [0, max];
  }

  function consigneEtude(pourVoix) {
    const e = etude;
    if (e.mode === 'libre') return ['テープを ひっぱって みよう。 ', KAZU, 'が かわるよ。'];
    const geste = e.mode === 'plus' ? ['みぎに ', String(e.pas), ' のばそう。'] : ['ひだりに ', String(e.pas), ' もどそう。'];
    if (!pourVoix) return geste;
    const op = e.mode === 'plus' ? ' たす ' : ' ひく ';
    return [String(e.base), op, String(e.pas), ' は いくつ？ ', ...geste];
  }

  // Code couleur, le même partout : 1er nombre et ruban de départ en bleu, « ＋ n » et les blocs
  // ajoutés en vert, « − n » et les blocs retirés en violet, le résultat en pastille comme la bulle.
  function equationEtude() {
    const e = etude;
    if (e.mode === 'libre') {
      const d = e.valeur - e.depart;
      const delta = d ? ` <span class="${d > 0 ? 'terme-plus' : 'terme-moins'}">${d > 0 ? '＋' : '−'}${Math.abs(d)}</span>` : '';
      return `<span class="terme-base">${e.depart}</span>${delta} → <span class="resultat">${e.valeur}</span>`;
    }
    const resultat = e.resolu ? `<span class="resultat">${e.cible}</span>` : '<span class="resultat inconnu">？</span>';
    const terme = e.mode === 'plus' ? `<span class="terme-plus">＋ ${e.pas}</span>` : `<span class="terme-moins">− ${e.pas}</span>`;
    return `<span class="terme-base">${e.base}</span> ${terme} ＝ ${resultat}`;
  }

  // La consigne, avec le nombre à ajouter ou à retirer dans sa couleur.
  function consigneEtudeHtml() {
    const e = etude;
    if (e.mode === 'libre') return htmlMots(consigneEtude(false));
    const [debut, fin, classe] = e.mode === 'plus' ? ['みぎに', 'のばそう。', 'terme-plus'] : ['ひだりに', 'もどそう。', 'terme-moins'];
    return `<span class="mot">${debut}</span> <span class="mot ${classe}">${e.pas}</span> <span class="mot">${fin}</span>`;
  }

  function rendreEtude() {
    if (!etude || ecranActuel !== 'etude') return;
    const e = etude;
    const activite = ACTIVITES.find((a) => a.etude === e.mode);
    const compte = e.mode === 'libre' ? '' : `<small>${e.index + 1} / ${e.total}</small>`;
    $('etude-titre').innerHTML = html(activite.titre) + compte;
    $('etude-consigne').innerHTML = consigneEtudeHtml();
    const plan = $('etude-plan');
    plan.replaceChildren();
    const max = Number(reglages.nombreMax) || 20;
    const x0 = 27;
    const ppc = Math.max(1, (plan.clientWidth - x0 - 50) / max);
    e.geo = { x0, ppc };
    dessinerRegle(plan, x0, ppc, max, false);
    plan.querySelector('.regle')?.classList.remove('preuve');
    const depart = document.createElement('span');
    depart.className = 'depart-libre';
    depart.style.left = `${x0 - 7}px`;
    const couche = document.createElement('div');
    couche.id = 'couche-ruban';
    plan.append(depart, couche);
    dessinerRuban();
  }

  function dessinerRuban() {
    const e = etude;
    const { x0, ppc } = e.geo;
    const plan = $('etude-plan');
    const couche = $('couche-ruban');
    couche.replaceChildren();
    const haut = Math.min(56, Math.max(30, plan.clientHeight * 0.14));
    // Place sous le ruban : les numéros des blocs, et en mode libre la poignée du 1er nombre.
    const dessous = e.mode === 'libre' ? 78 : 28;
    const y = Math.max(haut / 2 + 80, Math.min(
      (plan.clientHeight - reserveRegle()) / 2 + 10,
      plan.clientHeight - reserveRegle() - dessous - haut / 2,
    ));
    e.geo.y = y;
    e.geo.haut = haut;
    const blocsVisibles = ppc >= 8;   // assez large pour voir chaque centimètre
    const numeros = ppc >= 16;        // assez large pour écrire 1, 2, 3… sous chaque bloc

    const segment = (de, a, classe) => {
      if (a <= de) return null;
      const el = document.createElement('span');
      el.className = classe;
      el.style.left = `${x0 + de * ppc}px`;
      el.style.width = `${(a - de) * ppc}px`;
      el.style.top = `${y - haut / 2}px`;
      el.style.height = `${haut}px`;
      couche.append(el);
      return el;
    };

    // Des blocs d'1 cm, numérotés 1, 2, 3… pour compter le départ, ce qu'on ajoute ou ce qu'on enlève.
    // Le plus grand numéro de chaque couleur est souligné : c'est le nombre de l'opération.
    const COULEURS_COMPTE = { '': 'var(--o2)', '＋': 'var(--o3)', '−': 'var(--o4)' };
    const blocs = (de, a, classeDe, numero, signe) => {
      if (a <= de) return;
      if (!blocsVisibles) {
        const el = segment(de, a, classeDe(de));
        const total = document.createElement('span');
        total.className = 'compte-segment';
        total.textContent = `${signe}${a - de}`;
        el.append(total);
        return;
      }
      for (let i = de; i < a; i++) {
        const el = segment(i, i + 1, `${classeDe(i)} bloc-cm`);
        if (numeros) {
          const n = document.createElement('span');
          n.className = 'numero-bloc';
          n.textContent = numero(i);
          if (n.textContent === String(a - de)) n.classList.add('numero-fin');
          el.append(n);
        }
      }
      if (!numeros) {
        // Blocs trop étroits pour être numérotés : on écrit le total sous l'ensemble.
        const zone = segment(de, a, 'zone-compte');
        const total = document.createElement('span');
        total.className = 'compte-segment';
        total.style.color = COULEURS_COMPTE[signe];
        total.textContent = `${signe}${a - de}`;
        zone.append(total);
      }
    };

    const depart = (jusque) => blocs(0, jusque, () => 'ruban-base', (i) => String(i + 1), '');

    const ecrire = (el, texte, classe, souligne) => {
      const n = document.createElement('span');
      n.className = classe;
      if (souligne) n.classList.add('numero-fin');
      n.textContent = texte;
      el.append(n);
    };

    // Soustraction : le 1er nombre reste compté en bleu sous tout le ruban de départ (pointillés
    // compris), et les blocs retirés portent leur numéro violet à l'intérieur, depuis le bout.
    // Ce qui reste est donné par la bulle et le résultat.
    const retrait = (reste, total, classeDe) => {
      const retires = total - reste;
      if (blocsVisibles) {
        for (let i = 0; i < total; i++) {
          const retire = i >= reste;
          const el = segment(i, i + 1, retire ? `${classeDe(i)} bloc-cm` : 'ruban-base bloc-cm');
          if (!numeros) continue;
          ecrire(el, String(i + 1), 'numero-bloc numero-bleu', i + 1 === total);
          if (retire) ecrire(el, String(total - i), 'numero-dedans', total - i === retires);
        }
      } else {
        segment(0, reste, 'ruban-base');
        segment(reste, total, classeDe(reste));
      }
      if (!numeros) {
        const tout = segment(0, total, 'zone-compte');
        ecrire(tout, String(total), 'compte-segment numero-bleu');
        if (retires > 0) ecrire(segment(reste, total, 'zone-compte'), `−${retires}`, 'numero-dedans');
      }
    };

    if (e.mode === 'plus') {
      depart(e.base);
      blocs(e.base, e.valeur, (i) => (i >= e.cible ? 'ruban-ajout trop' : 'ruban-ajout'), (i) => String(i - e.base + 1), '＋');
    } else if (e.mode === 'moins') {
      retrait(e.valeur, e.base, (i) => (i < e.cible ? 'ruban-retire trop' : 'ruban-retire'));
    } else if (e.valeur >= e.depart) {
      depart(e.depart);
      blocs(e.depart, e.valeur, () => 'ruban-ajout', (i) => String(i - e.depart + 1), '＋');
    } else {
      retrait(e.valeur, e.depart, () => 'ruban-retire');
    }

    const poignee = document.createElement('span');
    poignee.className = 'poignee-etude';
    poignee.style.left = `${x0 + e.valeur * ppc}px`;
    // Sur le bord haut du ruban : elle ne cache pas les numéros écrits dans les blocs.
    poignee.style.top = `${y - haut / 2}px`;
    poignee.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M3 12h18"/></svg>';
    const bulle = document.createElement('span');
    bulle.className = 'bulle-etude';
    bulle.textContent = String(e.valeur);
    bulle.style.left = `${x0 + e.valeur * ppc}px`;
    bulle.style.top = `${y - haut / 2 - 74}px`;
    couche.append(poignee, bulle);

    // Mode libre : une seconde poignée, bleue, sous la jonction bleu / vert.
    // Elle change le 1er nombre sans changer le 2e (la partie verte ou violette glisse avec elle).
    if (e.mode === 'libre') {
      const xDepart = x0 + e.depart * ppc;
      // Sous les numéros des blocs, mais au-dessus de la règle (petits écrans).
      const yDepart = Math.max(y + haut / 2 + 30, Math.min(y + haut / 2 + 50, plan.clientHeight - 66));
      e.geo.yDepart = yDepart;
      const tige = document.createElement('span');
      tige.className = 'tige-depart';
      tige.style.left = `${xDepart}px`;
      tige.style.top = `${y + haut / 2}px`;
      tige.style.height = `${Math.max(0, yDepart - 23 - (y + haut / 2))}px`;
      const poigneeDepart = document.createElement('span');
      poigneeDepart.className = 'poignee-etude poignee-depart';
      poigneeDepart.style.left = `${xDepart}px`;
      poigneeDepart.style.top = `${yDepart}px`;
      poigneeDepart.innerHTML = poignee.innerHTML;
      couche.append(tige, poigneeDepart);
    }

    if (e.resolu) {
      const debut = Math.min(e.base, e.cible);
      const fin = Math.max(e.base, e.cible);
      dessinerEcart(couche, x0 + debut * ppc, x0 + fin * ppc, y - haut / 2 - 6, haut + 12, e.pas,
        `${e.mode === 'plus' ? '＋' : '−'}${e.pas}`, e.mode === 'plus' ? 'ecart-plus' : 'ecart-moins');
    }

    $('etude-valeur').textContent = String(e.valeur);
    $('etude-equation').innerHTML = equationEtude();
    const [min, max] = bornesEtude();
    $('etude-moins').disabled = e.resolu || e.valeur <= min;
    $('etude-plus').disabled = e.resolu || e.valeur >= max;
    $('etude-suivant').hidden = !e.resolu || e.mode === 'libre';
  }

  // Change la valeur d'un cran : petit son (plus aigu en montant), vibration sur Android.
  function changerValeur(v, voix) {
    const [min, max] = bornesEtude();
    const nouvelle = Math.max(min, Math.min(max, v));
    if (nouvelle === etude.valeur) return false;
    const monte = nouvelle > etude.valeur;
    etude.valeur = nouvelle;
    note((monte ? 440 : 400) + Math.min(nouvelle, 60) * 9, { duree: 0.08, volume: 0.09, type: 'triangle' });
    if (reglages.sons && navigator.vibrate) navigator.vibrate(8);
    dessinerRuban();
    if (voix && reglages.compter) parler(String(nouvelle));
    return true;
  }

  // Mode libre : change le 1er nombre (partie bleue) ; le 2e nombre ne change pas.
  function changerDepart(a) {
    const e = etude;
    const max = Number(reglages.nombreMax) || 20;
    const b = e.valeur - e.depart;
    const nouveau = Math.max(Math.max(0, -b), Math.min(max, max - b, a));
    if (nouveau === e.depart) return;
    const monte = nouveau > e.depart;
    e.depart = nouveau;
    e.valeur = nouveau + b;
    note((monte ? 440 : 400) + Math.min(nouveau, 60) * 9, { duree: 0.08, volume: 0.09, type: 'triangle' });
    if (reglages.sons && navigator.vibrate) navigator.vibrate(8);
    dessinerRuban();
  }

  function annoncerDepart() {
    const e = etude;
    const b = e.valeur - e.depart;
    const message = b === 0
      ? [String(e.depart), '。']
      : [String(e.depart), b > 0 ? ' たす ' : ' ひく ', String(Math.abs(b)), ' は ', String(e.valeur), '。'];
    messageEtude(message);
    parler(message);
  }

  function messageEtude(segments, ok) {
    $('etude-retour').innerHTML = htmlMots(segments);
    $('etude-retour').classList.toggle('ok', Boolean(ok));
  }

  // Après un geste ou un appui : bravo, « encore N », ou « trop, reviens de N ».
  function verifierEtude(parlerSiRien) {
    const e = etude;
    if (e.mode === 'libre') {
      const d = e.valeur - e.depart;
      const message = d > 0 ? [String(e.valeur), '。 ', String(d), ' ふえたね。']
        : d < 0 ? [String(e.valeur), '。 ', String(-d), ' へったね。'] : [String(e.valeur), '。'];
      messageEtude(message);
      if (parlerSiRien) parler(message);
      return;
    }
    if (e.valeur === e.cible) {
      reussirEtude();
      return;
    }
    const ecart = Math.abs(e.valeur - e.cible);
    const trop = e.mode === 'plus' ? e.valeur > e.cible : e.valeur < e.cible;
    if (trop) {
      const message = [e.mode === 'plus' ? 'おおすぎ！ ひだりに ' : 'とりすぎ！ みぎに ', String(ecart), ' もどそう。'];
      messageEtude(message);
      parler(message);
    } else {
      const message = ['あと ', String(ecart), '。'];
      messageEtude(message);
      if (parlerSiRien) parler(message);
    }
  }

  function reussirEtude() {
    const e = etude;
    e.resolu = true;
    sons.succes();
    const op = e.mode === 'plus' ? ' たす ' : ' ひく ';
    const message = [...PHRASES.seikai, String(e.base), op, String(e.pas), ' は ', String(e.cible), '。'];
    messageEtude(message, true);
    parler(message);
    dessinerRuban();
  }

  // Glisser n'importe où sur la zone : le ruban suit le mouvement du doigt, sans sauter.
  (() => {
    const plan = $('etude-plan');
    let geste = null;
    // Le doigt est-il posé près de la poignée bleue (mode libre) ?
    const presDuDepart = (ev) => {
      if (etude.mode !== 'libre' || etude.geo.yDepart === undefined) return false;
      const r = plan.getBoundingClientRect();
      const cx = r.left + plan.clientLeft + etude.geo.x0 + etude.depart * etude.geo.ppc;
      const cy = r.top + plan.clientTop + etude.geo.yDepart;
      return Math.hypot(ev.clientX - cx, ev.clientY - cy) < 46;
    };

    plan.addEventListener('pointerdown', (ev) => {
      if (!etude || etude.resolu) return;
      ev.preventDefault();
      plan.setPointerCapture(ev.pointerId);
      const cible = presDuDepart(ev) ? 'depart' : 'fin';
      geste = { id: ev.pointerId, x: ev.clientX, v: etude.valeur, a: etude.depart, cible };
      plan.classList.add(cible === 'depart' ? 'en-glisse-depart' : 'en-glisse');
    });
    plan.addEventListener('pointermove', (ev) => {
      if (!geste || ev.pointerId !== geste.id) return;
      const pas = Math.round((ev.clientX - geste.x) / etude.geo.ppc);
      if (geste.cible === 'depart') changerDepart(geste.a + pas);
      else changerValeur(geste.v + pas, false);
    });
    const finGeste = (ev) => {
      if (!geste || ev.pointerId !== geste.id) return;
      const bouge = etude.valeur !== geste.v || etude.depart !== geste.a;
      const cible = geste.cible;
      geste = null;
      plan.classList.remove('en-glisse', 'en-glisse-depart');
      if (!bouge) dessinerRuban();
      else if (cible === 'depart') annoncerDepart();
      else verifierEtude(true);
    };
    plan.addEventListener('pointerup', finGeste);
    plan.addEventListener('pointercancel', finGeste);
  })();

  activable($('etude-plus'), () => {
    if (etude && !etude.resolu && changerValeur(etude.valeur + 1, true)) verifierEtude(false);
  });
  activable($('etude-moins'), () => {
    if (etude && !etude.resolu && changerValeur(etude.valeur - 1, true)) verifierEtude(false);
  });
  activable($('etude-ecouter'), () => parler(consigneEtude(true)), { garde: false });
  activable($('etude-quitter'), () => { rendreAccueil(); montrer('accueil'); });
  activable($('etude-suivant'), () => {
    etude.index += 1;
    if (etude.index < etude.total) {
      nouveauProbleme();
      return;
    }
    finDe = 'etude';
    montrer('fin');
    const texte = [String(etude.total), K('問', 'もん'), ' できたよ。'];
    $('fin-titre').innerHTML = htmlMots(PHRASES.otsukare);
    $('fin-texte').innerHTML = htmlMots(texte);
    sons.fin();
    parler([...PHRASES.otsukare, ' ', ...texte]);
  });

  let minuteurEtude = 0;
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      if (ecranActuel !== 'etude' || !etude) return;
      clearTimeout(minuteurEtude);
      minuteurEtude = setTimeout(rendreEtude, 60);
    }).observe($('etude-plan'));
  }

  // Quand la zone des objets change de taille (l'explication apparaît dessous, rotation de l'écran…),
  // on recalcule la place des objets, de la règle et des repères.
  let tailleEtabli = '';
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      const etabli = $('etabli');
      const taille = `${etabli.clientWidth}x${etabli.clientHeight}`;
      if (taille === tailleEtabli) return;
      tailleEtabli = taille;
      if (ecranActuel !== 'question' || !session) return;
      clearTimeout(minuteurRedim);
      minuteurRedim = setTimeout(rendreQuestion, 60);
    }).observe($('etabli'));
  }

  window.addEventListener('resize', () => {
    clearTimeout(minuteurRedim);
    minuteurRedim = setTimeout(() => {
      if (ecranActuel === 'question') rendreQuestion();
      if (ecranActuel === 'photo' && !$('etape-recadrage').hidden) placerCadre();
    }, 150);
  });

  /* ======================================================================
     Espace parents (français / japonais)
     ====================================================================== */

  const TEXTES = {
    fr: {
      titre: 'Réglages pour les parents',
      fermer: 'Retour',
      langue: 'Langue de cette page',
      activites: 'Activités proposées',
      activitesAide: 'Gardez au moins une activité. Commencez par la 1, puis ajoutez les autres quand elle est réussie.',
      nbQuestions: 'Questions par série',
      ecriture: 'Écriture',
      hiragana: 'Hiragana seuls',
      kanji: 'Kanji avec furigana',
      nombreMax: 'べんきょう : nombres jusqu’à',
      compter: 'べんきょう : la voix compte à chaque ＋1 / −1',
      etudeAide: 'Dans « べんきょう », votre enfant tire le ruban (n’importe où sur la zone, pas seulement sur la poignée) ou utilise les gros boutons ＋1 / −1. Chaque centimètre ajouté ou retiré apparaît comme un bloc numéroté. Dans « のばして みよう », la poignée bleue sous le ruban change le premier nombre sans changer le second. Avec des nombres plus grands, le geste doit être plus précis.',
      aide: 'Bouton d’aide (ヒント, そろえる)',
      aideAide: 'Activités 6 et 7 : l’aide convertit d’abord dans la même unité (1 m ＝ 100 cm), puis dessine des barres à l’échelle. Activités 8 et 9 : elle fait glisser les objets jusqu’à la ligne de départ. Elle apparaît aussi d’elle-même après une erreur.',
      noms: 'Afficher le nom des objets',
      court: 'Demander aussi « le plus court » (短い)',
      courtAide: 'Les élèves confondent souvent « long » et « court » : activez-le quand « long » est acquis.',
      oui: 'Oui',
      non: 'Non',
      photos: 'Photos d’objets de la maison',
      photosAide: 'Posez l’objet à l’horizontale sur un fond uni (une feuille blanche) et photographiez-le d’au-dessus. Mesurez-le avec une règle : l’outil l’affiche ensuite à la bonne échelle. Variez les longueurs (par exemple 5, 10, 15 et 25 cm) : les questions faciles demandent des objets très différents.',
      photosUsage: 'Utiliser les photos dans les questions',
      jamais: 'Jamais',
      melange: 'Avec les dessins',
      toujours: 'Dès que possible',
      prendre: 'Prendre une photo',
      galerie: 'Choisir dans la galerie',
      aucune: 'Aucune photo pour l’instant. Il en faut au moins deux pour qu’elles apparaissent dans les questions.',
      prive: 'Les photos restent sur cet appareil. Elles ne sont envoyées nulle part.',
      stockage: 'Ici, les photos ne pourront pas être gardées après fermeture de la page (stockage indisponible).',
      supprimer: 'Supprimer',
      confirmer: 'Supprimer ?',
      annuler: 'Annuler',
      voix: 'Voix et sons',
      vitesse: 'Vitesse de la voix',
      lente: 'Lente',
      normale: 'Normale',
      rapide: 'Rapide',
      sons: 'Sons',
      ecouter: 'Écouter la voix',
      sansVoix: 'Aucune voix japonaise trouvée. Sur iPad : Réglages › Accessibilité › Contenu énoncé › Voix › Japonais. Sur Android (Samsung) : Paramètres › Gestion globale › Synthèse vocale, puis installez la voix japonaise du moteur choisi.',
      toucher: 'Toucher',
      dureeAppui: 'Temps d’appui pour valider',
      immediat: 'Immédiat',
      antiRebond: 'Ignorer les touchers répétés',
      ipad: 'Sur la tablette ou le smartphone',
      ipadAide: 'iPad : Safari › Partager › « Sur l’écran d’accueil ». Pour empêcher de sortir de l’outil : Réglages › Accessibilité › Accès guidé. Android (Samsung) : Chrome › menu ⋮ › « Ajouter à l’écran d’accueil » ou « Installer l’application ». Pour bloquer l’écran sur l’outil : Paramètres › Sécurité › Épingler les applications. Les photos ajoutées restent sur l’appareil où elles ont été prises : ajoutez-les sur chaque appareil.',
      photoTitre: 'Nouvelle photo',
      recadrer: 'Encadrez l’objet exactement d’un bout à l’autre : la largeur du cadre correspond à sa longueur.',
      tourner: 'Tourner',
      autre: 'Autre photo',
      suivant: 'Suivant',
      retour: 'Retour',
      enregistrer: 'Enregistrer',
      infos: 'Nom et longueur de l’objet',
      yomi: 'Nom en hiragana (obligatoire)',
      kanjiChamp: 'Nom en kanji (facultatif)',
      cm: 'Longueur réelle en cm',
      cmAide: 'Mesurez l’objet avec une règle, d’un bout à l’autre.',
      erreurYomi: 'Écrivez le nom de l’objet en hiragana.',
      erreurCm: 'Indiquez une longueur entre 1 et 300 cm.',
      erreurImage: 'Cette image n’a pas pu être lue. Essayez une autre photo.',
    },
    ja: {
      titre: 'おうちの人の せってい',
      fermer: 'もどる',
      langue: 'この ページの ことば',
      activites: 'ひょうじする もんだい',
      activitesAide: '1つ以上 えらんでください。1から はじめて、できたら ほかの もんだいを ふやしましょう。',
      nbQuestions: '1回の もんだい数',
      ecriture: 'もじ',
      hiragana: 'ひらがな',
      kanji: '漢字＋ふりがな',
      nombreMax: 'べんきょう：かずの はんい',
      compter: 'べんきょう：＋1・−1 で かずを よみあげる',
      etudeAide: '「べんきょう」では テープを ひっぱるか（どこからでも）、＋1・−1 の ボタンを つかいます。たしたり ひいたり した 1cm ずつが ばんごうつきの ブロックで みえます。「のばして みよう」では テープの 下の あおい ●で さいしょの かずを かえられます（2つめの かずは そのまま）。かずが 大きいと こまかい うごきが ひつようです。',
      aide: 'ヒントの ボタン（ヒント・そろえる）',
      aideAide: '6・7：まず おなじ たんいに なおし（1m＝100cm）、つぎに ぼうで しめします。8・9：ものの はしを そろえます。まちがえたときは じどうで でます。',
      noms: 'ものの なまえを ひょうじする',
      court: '「短い」も きく',
      courtAide: '「長い」と「短い」は まちがえやすいので、「長い」が できてから つかいましょう。',
      oui: 'はい',
      non: 'いいえ',
      photos: 'いえの ものの しゃしん',
      photosAide: 'ものを よこむきに むじの かみの 上に おき、まうえから とってください。じょうぎで ながさを はかると、ただしい 大きさで ひょうじされます。ながさの ちがう ものを えらびましょう（れい：5・10・15・25cm）。',
      photosUsage: 'もんだいに しゃしんを つかう',
      jamais: 'つかわない',
      melange: 'イラストと まぜる',
      toujours: 'できるだけ つかう',
      prendre: 'しゃしんを とる',
      galerie: 'アルバムから えらぶ',
      aucune: 'まだ しゃしんは ありません。もんだいに つかうには 2まい いじょう ひつようです。',
      prive: 'しゃしんは この きかいの 中だけに ほぞんされ、どこにも おくられません。',
      stockage: 'ここでは ページを とじると しゃしんが きえます（ほぞんできません）。',
      supprimer: 'けす',
      confirmer: 'けしますか？',
      annuler: 'やめる',
      voix: 'こえと おと',
      vitesse: 'はなす はやさ',
      lente: 'ゆっくり',
      normale: 'ふつう',
      rapide: 'はやい',
      sons: 'おと',
      ecouter: 'こえを きく',
      sansVoix: 'にほんごの こえが ありません。iPad：設定 › アクセシビリティ › 読み上げコンテンツ › 声 › 日本語。Android（Galaxy）：設定 › 一般管理 › テキスト読み上げ で 日本語の こえを いれてください。',
      toucher: 'タッチ',
      dureeAppui: 'おしつづける じかん',
      immediat: 'すぐ',
      antiRebond: 'つづけて タッチしたときに むしする',
      ipad: 'タブレット・スマホで つかう',
      ipadAide: 'iPad：Safari › 共有 › 「ホーム画面に追加」。ほかの アプリに うつらないように：設定 › アクセシビリティ › アクセスガイド。Android（Galaxy）：Chrome › メニュー ⋮ › 「ホーム画面に追加」または「アプリをインストール」。画面の固定：設定 › セキュリティ › アプリの固定。しゃしんは とった きかいの 中だけに あるので、きかいごとに ついかしてください。',
      photoTitre: 'あたらしい しゃしん',
      recadrer: 'ものの はしから はしまで ぴったり かこんでください。わくの はばが ものの ながさに なります。',
      tourner: 'かいてん',
      autre: 'とりなおす',
      suivant: 'つぎへ',
      retour: 'もどる',
      enregistrer: 'ほぞん',
      infos: 'ものの なまえと ながさ',
      yomi: 'なまえ（ひらがな・ひっす）',
      kanjiChamp: 'なまえ（漢字・なくても よい）',
      cm: 'ほんとうの ながさ（cm）',
      cmAide: 'じょうぎで はしから はしまで はかってください。',
      erreurYomi: 'なまえを ひらがなで かいてください。',
      erreurCm: '1〜300cm の ながさを いれてください。',
      erreurImage: 'この しゃしんは よみこめませんでした。ほかの しゃしんで ためしてください。',
    },
  };

  const t = (cle) => (TEXTES[reglages.langue] || TEXTES.fr)[cle] ?? cle;

  function bloc(titre, aide) {
    const section = document.createElement('section');
    section.className = 'bloc';
    const h = document.createElement('h3');
    h.textContent = titre;
    section.append(h);
    if (aide) {
      const p = document.createElement('p');
      p.textContent = aide;
      section.append(p);
    }
    return section;
  }

  let compteurChamps = 0;

  function groupeChoix(cle, libelle, options, { apres } = {}) {
    const fs = document.createElement('fieldset');
    fs.className = 'reglage';
    const lg = document.createElement('legend');
    lg.textContent = libelle;
    const zone = document.createElement('div');
    zone.className = 'options';
    const nom = `choix-${cle}-${compteurChamps++}`;
    options.forEach(([valeur, texte]) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = nom;
      input.id = `${nom}-${String(valeur)}`;
      input.checked = String(reglages[cle]) === String(valeur);
      input.addEventListener('change', () => {
        ecrireReglages({ [cle]: valeur });
        if (apres) apres();
      });
      label.append(input, document.createTextNode(texte));
      zone.append(label);
    });
    fs.append(lg, zone);
    return fs;
  }

  function groupeActivites() {
    const zone = document.createElement('div');
    zone.className = 'options';
    ACTIVITES.forEach((a) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `activite-${a.n}`;
      input.checked = reglages.activites.includes(a.n);
      input.addEventListener('change', () => {
        const choisies = ACTIVITES.filter((x) => $(`activite-${x.n}`).checked).map((x) => x.n);
        if (!choisies.length) {
          input.checked = true;
          return;
        }
        ecrireReglages({ activites: choisies });
      });
      const texte = reglages.langue === 'ja' ? `${a.n}. ${lecture(a.titre)}（${lecture(a.sous)}）` : `${a.n}. ${a.fr}`;
      label.append(input, document.createTextNode(texte));
      zone.append(label);
    });
    return zone;
  }

  function listePhotos() {
    const liste = document.createElement('div');
    liste.className = 'liste-photos';
    if (!photos.length) {
      const p = document.createElement('p');
      p.textContent = t('aucune');
      liste.append(p);
      return liste;
    }
    [...photos].sort((a, b) => a.cm - b.cm).forEach((p) => {
      const ligne = document.createElement('div');
      ligne.className = 'photo-ligne';
      const img = document.createElement('img');
      img.src = urlPhoto(p);
      img.alt = '';
      const infos = document.createElement('div');
      infos.className = 'infos';
      infos.innerHTML = `<strong>${echapper(p.kanji ? `${p.kanji}（${p.yomi}）` : p.yomi)}</strong><span>${echapper(String(p.cm))} cm</span>`;
      const actions = document.createElement('div');
      actions.className = 'actions';
      const effacer = document.createElement('button');
      effacer.type = 'button';
      effacer.className = 'btn btn-petit btn-danger';
      effacer.textContent = t('supprimer');
      effacer.addEventListener('click', () => {
        actions.replaceChildren();
        const question = document.createElement('span');
        question.textContent = t('confirmer');
        const oui = document.createElement('button');
        oui.type = 'button';
        oui.className = 'btn btn-petit btn-danger';
        oui.textContent = t('supprimer');
        oui.addEventListener('click', async () => {
          await Base.enlever(p.id);
          photos = photos.filter((x) => x.id !== p.id);
          if (urlsPhotos.has(p.id)) URL.revokeObjectURL(urlsPhotos.get(p.id));
          urlsPhotos.delete(p.id);
          rendreParents();
        });
        const non = document.createElement('button');
        non.type = 'button';
        non.className = 'btn btn-petit';
        non.textContent = t('annuler');
        non.addEventListener('click', rendreParents);
        actions.append(question, oui, non);
      });
      actions.append(effacer);
      ligne.append(img, infos, actions);
      liste.append(ligne);
    });
    return liste;
  }

  function rendreParents() {
    $('ecran-parents').lang = reglages.langue;
    $('parents-titre').textContent = t('titre');
    $('btn-fermer-parents').textContent = t('fermer');
    const zone = $('parents');
    const defilement = zone.scrollTop;
    zone.replaceChildren();

    const bLangue = bloc(t('langue'));
    bLangue.append(groupeChoix('langue', t('langue'), [['fr', 'Français'], ['ja', '日本語']], { apres: rendreParents }));
    bLangue.querySelector('legend').hidden = true;

    const bActivites = bloc(t('activites'), t('activitesAide'));
    bActivites.append(
      groupeActivites(),
      groupeChoix('nbQuestions', t('nbQuestions'), [[4, '4'], [6, '6'], [8, '8']]),
      groupeChoix('ecriture', t('ecriture'), [['hiragana', t('hiragana')], ['kanji', t('kanji')]]),
      groupeChoix('noms', t('noms'), [[true, t('oui')], [false, t('non')]]),
      groupeChoix('court', t('court'), [[true, t('oui')], [false, t('non')]]),
      groupeChoix('aide', t('aide'), [[true, t('oui')], [false, t('non')]]),
    );
    const aideAide = document.createElement('p');
    aideAide.textContent = t('aideAide');
    bActivites.append(
      aideAide,
      groupeChoix('nombreMax', t('nombreMax'), [[10, '10'], [20, '20'], [50, '50'], [100, '100']]),
      groupeChoix('compter', t('compter'), [[true, t('oui')], [false, t('non')]]),
    );
    const etudeAide = document.createElement('p');
    etudeAide.textContent = t('etudeAide');
    bActivites.append(etudeAide);
    const aideCourt = document.createElement('p');
    aideCourt.textContent = t('courtAide');
    bActivites.append(aideCourt);

    const bPhotos = bloc(t('photos'), t('photosAide'));
    if (!Base.persistant) {
      const avert = document.createElement('p');
      avert.className = 'avertissement';
      avert.textContent = t('stockage');
      bPhotos.append(avert);
    }
    // Deux boutons : l'appareil photo, ou une photo déjà prise.
    // (Sur Android, un seul bouton ouvre souvent la galerie sans proposer l'appareil photo.)
    const ajouter = document.createElement('div');
    ajouter.className = 'boutons-photo';
    [['fichier-camera', t('prendre'), 'btn btn-principal'], ['fichier-photo', t('galerie'), 'btn']].forEach(([id, texte, classe]) => {
      const bouton = document.createElement('label');
      bouton.className = classe;
      bouton.htmlFor = id;
      bouton.tabIndex = 0;
      bouton.textContent = texte;
      bouton.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); $(id).click(); }
      });
      ajouter.append(bouton);
    });
    const prive = document.createElement('p');
    prive.textContent = t('prive');
    bPhotos.append(
      listePhotos(),
      ajouter,
      groupeChoix('photos', t('photosUsage'), [['jamais', t('jamais')], ['melange', t('melange')], ['toujours', t('toujours')]]),
      prive,
    );

    const bVoix = bloc(t('voix'));
    const ecouter = document.createElement('button');
    ecouter.type = 'button';
    ecouter.className = 'btn';
    ecouter.textContent = t('ecouter');
    ecouter.addEventListener('click', () => parler(PHRASES.dotchiNagai));
    bVoix.append(
      groupeChoix('vitesse', t('vitesse'), [[0.7, t('lente')], [0.9, t('normale')], [1.1, t('rapide')]]),
      groupeChoix('sons', t('sons'), [[true, t('oui')], [false, t('non')]]),
      ecouter,
    );
    if (synthese && synthese.getVoices().length && !voixJaponaise()) {
      const p = document.createElement('p');
      p.textContent = t('sansVoix');
      bVoix.append(p);
    }

    const bToucher = bloc(t('toucher'));
    bToucher.append(
      groupeChoix('dureeAppui', t('dureeAppui'), [[0, t('immediat')], [300, '0,3 s'], [600, '0,6 s'], [1000, '1 s']]),
      groupeChoix('antiRebond', t('antiRebond'), [[0, t('non')], [500, '0,5 s'], [1000, '1 s']]),
    );

    const bIpad = bloc(t('ipad'), t('ipadAide'));

    zone.append(bLangue, bActivites, bPhotos, bVoix, bToucher, bIpad);
    zone.scrollTop = defilement;
  }

  activable($('btn-parents'), () => { rendreParents(); montrer('parents'); }, { duree: 2000, garde: false });
  $('btn-fermer-parents').addEventListener('click', () => { rendreAccueil(); montrer('accueil'); });

  /* ======================================================================
     Ajout d'une photo : recadrage, puis nom et longueur
     ====================================================================== */

  let source = null;      // canvas de travail (photo réduite)
  let cadre = null;       // { x, y, w, h } en pixels de la photo
  let photoRecadree = null;

  const toile = $('toile');

  function chargerImage(fichier) {
    return new Promise((resoudre, rejeter) => {
      const url = URL.createObjectURL(fichier);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resoudre(img); };
      img.onerror = () => { URL.revokeObjectURL(url); rejeter(new Error('image')); };
      img.src = url;
    });
  }

  function cadreParDefaut() {
    return { x: source.width * 0.1, y: source.height * 0.3, w: source.width * 0.8, h: source.height * 0.4 };
  }

  // Repère l'objet posé sur un fond uni : ce qui diffère nettement de la couleur des bords.
  function detecterObjet() {
    const k = 160 / Math.max(source.width, source.height);
    const w = Math.max(1, Math.round(source.width * k));
    const h = Math.max(1, Math.round(source.height * k));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const cx = c.getContext('2d', { willReadFrequently: true });
    cx.drawImage(source, 0, 0, w, h);
    let donnees;
    try { donnees = cx.getImageData(0, 0, w, h).data; } catch { return null; }
    const bords = [[], [], []];
    const ajouterBord = (x, y) => {
      const i = (y * w + x) * 4;
      bords[0].push(donnees[i]); bords[1].push(donnees[i + 1]); bords[2].push(donnees[i + 2]);
    };
    for (let x = 0; x < w; x++) { ajouterBord(x, 0); ajouterBord(x, h - 1); }
    for (let y = 0; y < h; y++) { ajouterBord(0, y); ajouterBord(w - 1, y); }
    const mediane = (t) => t.sort((a, b) => a - b)[t.length >> 1];
    const fond = bords.map(mediane);
    let minX = w; let minY = h; let maxX = -1; let maxY = -1; let n = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        const d = Math.abs(donnees[i] - fond[0]) + Math.abs(donnees[i + 1] - fond[1]) + Math.abs(donnees[i + 2] - fond[2]);
        if (d > 80) {
          n++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (n < w * h * 0.005) return null;
    if ((maxX - minX) * (maxY - minY) > w * h * 0.9) return null;
    return { x: minX / k, y: minY / k, w: (maxX - minX + 1) / k, h: (maxY - minY + 1) / k };
  }

  function dessinerToile() {
    toile.width = source.width;
    toile.height = source.height;
    toile.getContext('2d').drawImage(source, 0, 0);
  }

  function echelleToile() {
    return toile.getBoundingClientRect().width / toile.width || 1;
  }

  function placerCadre() {
    if (!source || !cadre) return;
    const s = echelleToile();
    const el = $('cadre');
    el.style.left = `${cadre.x * s}px`;
    el.style.top = `${cadre.y * s}px`;
    el.style.width = `${cadre.w * s}px`;
    el.style.height = `${cadre.h * s}px`;
  }

  function borner(c) {
    const min = Math.max(12, Math.min(source.width, source.height) * 0.02);
    const x = Math.min(Math.max(0, c.x), source.width - min);
    const y = Math.min(Math.max(0, c.y), source.height - min);
    return {
      x,
      y,
      w: Math.min(Math.max(min, c.w), source.width - x),
      h: Math.min(Math.max(min, c.h), source.height - y),
    };
  }

  function etapePhoto(etape) {
    const recadrage = etape === 'recadrage';
    $('etape-recadrage').hidden = !recadrage;
    $('etape-infos').hidden = recadrage;
    $('photo-consigne').textContent = recadrage ? t('recadrer') : t('infos');
    $('btn-photo-tourner').hidden = !recadrage;
    $('btn-photo-autre').hidden = !recadrage;
    $('btn-photo-annuler').textContent = recadrage ? t('annuler') : t('retour');
    $('btn-photo-suivant').textContent = recadrage ? t('suivant') : t('enregistrer');
    $('erreur-photo').textContent = '';
    if (recadrage) requestAnimationFrame(placerCadre);
  }

  function preparerTextesPhoto() {
    $('ecran-photo').lang = reglages.langue;
    $('photo-titre').textContent = t('photoTitre');
    $('btn-photo-tourner').textContent = `↻ ${t('tourner')}`;
    $('btn-photo-autre').textContent = t('autre');
    $('lbl-yomi').textContent = t('yomi');
    $('lbl-kanji').textContent = t('kanjiChamp');
    $('lbl-cm').textContent = t('cm');
    $('aide-cm').textContent = t('cmAide');
  }

  async function chargerPhoto(ev) {
    const fichier = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!fichier) return;
    // « Autre photo » reprend la même source (appareil photo ou galerie).
    $('btn-photo-autre').htmlFor = ev.target.id;
    try {
      const img = await chargerImage(fichier);
      const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      source = document.createElement('canvas');
      source.width = Math.max(1, Math.round(img.naturalWidth * k));
      source.height = Math.max(1, Math.round(img.naturalHeight * k));
      source.getContext('2d').drawImage(img, 0, 0, source.width, source.height);
    } catch {
      rendreParents();
      montrer('parents');
      const p = document.createElement('p');
      p.className = 'erreur';
      p.textContent = t('erreurImage');
      $('parents').prepend(p);
      return;
    }
    preparerTextesPhoto();
    dessinerToile();
    cadre = borner(detecterObjet() || cadreParDefaut());
    $('champ-yomi').value = '';
    $('champ-kanji').value = '';
    $('champ-cm').value = '';
    montrer('photo');
    etapePhoto('recadrage');
  }

  $('fichier-photo').addEventListener('change', chargerPhoto);
  $('fichier-camera').addEventListener('change', chargerPhoto);

  // Déplacer le cadre, tirer un coin, ou tracer un nouveau cadre.
  (() => {
    const zone = $('zone-toile');
    let geste = null;

    const point = (ev) => {
      const r = toile.getBoundingClientRect();
      const s = echelleToile();
      return { x: (ev.clientX - r.left) / s, y: (ev.clientY - r.top) / s };
    };

    zone.addEventListener('pointerdown', (ev) => {
      if (!source) return;
      ev.preventDefault();
      zone.setPointerCapture(ev.pointerId);
      const p = point(ev);
      const coin = ev.target.closest('.poignee')?.dataset.coin;
      const dedans = p.x >= cadre.x && p.x <= cadre.x + cadre.w && p.y >= cadre.y && p.y <= cadre.y + cadre.h;
      geste = { id: ev.pointerId, depart: p, initial: { ...cadre }, mode: coin || (dedans ? 'deplacer' : 'tracer') };
    });

    zone.addEventListener('pointermove', (ev) => {
      if (!geste || ev.pointerId !== geste.id) return;
      const p = point(ev);
      const dx = p.x - geste.depart.x;
      const dy = p.y - geste.depart.y;
      const c = { ...geste.initial };
      switch (geste.mode) {
        case 'deplacer':
          c.x = Math.min(Math.max(0, c.x + dx), source.width - c.w);
          c.y = Math.min(Math.max(0, c.y + dy), source.height - c.h);
          cadre = c;
          break;
        case 'tracer':
          cadre = borner({
            x: Math.min(geste.depart.x, p.x),
            y: Math.min(geste.depart.y, p.y),
            w: Math.abs(dx),
            h: Math.abs(dy),
          });
          break;
        default: {
          let { x, y } = c;
          let x2 = c.x + c.w;
          let y2 = c.y + c.h;
          if (geste.mode.includes('w')) x += dx; else x2 += dx;
          if (geste.mode.includes('n')) y += dy; else y2 += dy;
          cadre = borner({ x: Math.min(x, x2), y: Math.min(y, y2), w: Math.abs(x2 - x), h: Math.abs(y2 - y) });
        }
      }
      placerCadre();
    });

    const fin = (ev) => { if (geste && ev.pointerId === geste.id) geste = null; };
    zone.addEventListener('pointerup', fin);
    zone.addEventListener('pointercancel', fin);
  })();

  $('btn-photo-tourner').addEventListener('click', () => {
    const c = document.createElement('canvas');
    c.width = source.height;
    c.height = source.width;
    const cx = c.getContext('2d');
    cx.translate(c.width, 0);
    cx.rotate(Math.PI / 2);
    cx.drawImage(source, 0, 0);
    source = c;
    dessinerToile();
    cadre = borner(detecterObjet() || cadreParDefaut());
    requestAnimationFrame(placerCadre);
  });

  $('btn-photo-autre').addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); $($('btn-photo-autre').htmlFor).click(); }
  });

  function recadrer() {
    const largeur = Math.max(1, Math.round(Math.min(900, cadre.w)));
    const hauteur = Math.max(1, Math.round(cadre.h * (largeur / cadre.w)));
    const c = document.createElement('canvas');
    c.width = largeur;
    c.height = hauteur;
    c.getContext('2d').drawImage(source, cadre.x, cadre.y, cadre.w, cadre.h, 0, 0, largeur, hauteur);
    return new Promise((resoudre) => {
      c.toBlob((blob) => resoudre({ blob, w: largeur, h: hauteur }), 'image/jpeg', 0.85);
    });
  }

  $('btn-photo-annuler').addEventListener('click', () => {
    if (!$('etape-infos').hidden) {
      etapePhoto('recadrage');
      return;
    }
    source = null;
    rendreParents();
    montrer('parents');
  });

  $('btn-photo-suivant').addEventListener('click', async () => {
    if (!$('etape-recadrage').hidden) {
      photoRecadree = await recadrer();
      if (!photoRecadree.blob) {
        $('erreur-photo').textContent = t('erreurImage');
        return;
      }
      const apercu = $('apercu-photo');
      if (apercu.src) URL.revokeObjectURL(apercu.src);
      apercu.src = URL.createObjectURL(photoRecadree.blob);
      etapePhoto('infos');
      $('champ-yomi').focus();
      return;
    }

    const yomi = $('champ-yomi').value.trim();
    const kanji = $('champ-kanji').value.trim();
    const cm = Number(String($('champ-cm').value).replace(',', '.'));
    if (!yomi) {
      $('erreur-photo').textContent = t('erreurYomi');
      $('champ-yomi').focus();
      return;
    }
    if (!Number.isFinite(cm) || cm < 1 || cm > 300) {
      $('erreur-photo').textContent = t('erreurCm');
      $('champ-cm').focus();
      return;
    }
    const objet = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      yomi,
      kanji: kanji || null,
      cm: Math.round(cm * 10) / 10,
      w: photoRecadree.w,
      h: photoRecadree.h,
      blob: photoRecadree.blob,
    };
    await Base.mettre(objet);
    photos.push(objet);
    source = null;
    rendreParents();
    montrer('parents');
  });

  $('etape-infos').addEventListener('submit', (ev) => ev.preventDefault());

  /* ======================================================================
     Démarrage
     ====================================================================== */

  document.addEventListener('contextmenu', (ev) => {
    if (!ev.target.closest('input, textarea')) ev.preventDefault();
  });
  document.addEventListener('gesturestart', (ev) => ev.preventDefault());

  (async () => {
    rendreAccueil();
    montrer('accueil');
    await Base.ouvrir();
    photos = await Base.tous();

    const horsLigne = !window.KURABE_ARTIFACT && 'serviceWorker' in navigator
      && (location.protocol === 'https:' || location.hostname === 'localhost');
    if (horsLigne) navigator.serviceWorker.register('sw.js').catch(() => {});
  })();
})();
