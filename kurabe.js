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
    activites: [1, 2, 3, 4, 5],
    nbQuestions: 6,
    ecriture: 'hiragana',   // hiragana | kanji (avec furigana)
    noms: true,             // afficher le nom des objets
    court: true,            // demander aussi « le plus court »
    photos: 'melange',      // jamais | melange | toujours
    vitesse: 0.9,
    sons: true,
    dureeAppui: 0,          // ms : le doigt doit rester posé ce temps
    antiRebond: 0,          // ms : touchers suivants ignorés
    langue: (navigator.language || '').toLowerCase().startsWith('ja') ? 'ja' : 'fr',
  };

  function lireReglages() {
    try {
      return { ...DEFAUT, ...JSON.parse(localStorage.getItem(CLE_REGLAGES) || '{}') };
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

  function html(segments) {
    return segments.map((s) => {
      if (typeof s === 'string' || typeof s === 'number') return echapper(s);
      if (reglages.ecriture === 'kanji' && s.k) return `<ruby>${echapper(s.k)}<rt>${echapper(s.y)}</rt></ruby>`;
      return echapper(s.y);
    }).join('');
  }

  // Comme html(), mais chaque groupe de mots (séparé par une espace) reste sur une seule ligne.
  function htmlMots(segments) {
    return html(segments).split(' ').filter(Boolean).map((m) => `<span class="mot">${m}</span>`).join(' ');
  }

  function lecture(segments) {
    return segments.map((s) => (typeof s === 'object' ? s.y : String(s))).join('');
  }

  const NAGA = K('長', 'なが');
  const MIJIKA = K('短', 'みじか');
  const ICHIBAN = K('一番', 'いちばん');
  const TEHON = K('手本', 'てほん');
  const ONAJI = K('同', 'おな');

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
  ];

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
    const court = aleatoire(5, Math.min(15, 28 / r));
    const [c1, c2] = couleurs(2);
    const noms = Object.keys(SORTES);
    const s1 = choisir(noms);
    const s2 = sortesDifferentes ? choisir(noms.filter((s) => s !== s1)) : s1;
    return [objetDessine(s1, court, c1), objetDessine(s2, court * r, c2)];
  }

  function trioDessine(rmin) {
    const r1 = aleatoire(rmin, rmin + 0.2);
    const r2 = aleatoire(rmin, rmin + 0.2);
    const a = aleatoire(5, 30 / (r1 * r2));
    const sorte = choisir(Object.keys(SORTES));
    const cs = couleurs(3);
    return [objetDessine(sorte, a, cs[0]), objetDessine(sorte, a * r1, cs[1]), objetDessine(sorte, a * r1 * r2, cs[2])];
  }

  const indexMax = (objets) => objets.reduce((m, o, i) => (o.cm > objets[m].cm ? i : m), 0);
  const indexMin = (objets) => objets.reduce((m, o, i) => (o.cm < objets[m].cm ? i : m), 0);

  function genererQuestion(niveau, derniere) {
    const base = { niveau, essais: new Set(), resolu: false, indices: false };

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
    const m = aleatoire(9, 19);
    const [cModele, ...cs] = couleurs(4);
    const facteurs = derniere
      ? [aleatoire(0.45, 0.6), aleatoire(1.45, 1.6)]
      : [aleatoire(0.68, 0.82), aleatoire(1.22, 1.38)];
    const candidats = melanger([
      { ...objetDessine(sorte, m, cs[0]), egal: true },
      objetDessine(sorte, m * facteurs[0], cs[1]),
      objetDessine(sorte, m * facteurs[1], cs[2]),
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

  const ECRANS = ['accueil', 'question', 'fin', 'parents', 'photo'];
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
    if (barres === 'tehon') {
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
    ACTIVITES.filter((a) => reglages.activites.includes(a.n)).forEach((a) => {
      const carte = document.createElement('button');
      carte.type = 'button';
      carte.className = 'activite';
      carte.innerHTML = `<span class="numero">${a.n}</span>${svgActivite(a.barres)}`
        + `<strong>${html(a.titre)}</strong><span class="sous">${html(a.sous)}</span>`;
      carte.setAttribute('aria-label', `${a.n}. ${lecture(a.titre)} ${lecture(a.sous)}`);
      activable(carte, () => demarrer(a.n));
      zone.append(carte);
    });
  }

  /* ----- Série de questions ----- */

  let session = null;
  const courante = () => session.questions[session.index];

  function demarrer(niveau) {
    const n = Number(reglages.nbQuestions) || 6;
    session = {
      niveau,
      questions: Array.from({ length: n }, (_, i) => genererQuestion(niveau, i === n - 1)),
      index: 0,
    };
    montrer('question');
    afficherQuestion();
  }

  function consigneDe(q) {
    if (q.type === 'paire') return q.demande === 'long' ? PHRASES.dotchiNagai : PHRASES.dotchiMijikai;
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

  function explication(q) {
    const memesNoms = new Set(q.objets.map((o) => o.yomi)).size < q.objets.length;
    const o = q.objets[q.bonne];
    if (q.type === 'paire') {
      const qui = memesNoms || !reglages.noms ? 'こっち' : nomDe(o);
      return [qui, 'の ほうが ', q.demande === 'long' ? NAGA : MIJIKA, 'いね。'];
    }
    if (q.type === 'trio') {
      const qui = memesNoms || !reglages.noms ? 'これ' : nomDe(o);
      return [qui, 'が ', ICHIBAN, ' ', q.demande === 'long' ? NAGA : MIJIKA, 'いね。'];
    }
    if (q.type === 'tehon') return ['これが ', TEHON, 'と ', ONAJI, 'じ ', NAGA, 'さだね。'];
    return phraseDe(q, q.bonne);
  }

  function afficherQuestion() {
    const q = courante();
    $('retour').textContent = '';
    $('retour').classList.remove('ok');
    $('btn-suivant').hidden = true;
    $('confirmation-quitter').hidden = true;
    rendreQuestion();
    parlerConsigne();
  }

  function parlerConsigne() {
    const q = courante();
    if (q.type === 'phrase') parler([...phraseDe(q), '…… ', ...PHRASES.nagaiMijikai]);
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
    return { el, piste, forme, objet, largeur: 0 };
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
    etabli.classList.toggle('sans-noms', !reglages.noms && q.type !== 'phrase');
    lignes = [];

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

    const reperes = document.createElement('div');
    reperes.className = 'reperes';
    reperes.id = 'reperes';
    etabli.append(reperes);

    dimensionner();

    if (q.type === 'phrase') rendrePhrase();
    if (q.indices) afficherReperes();
  }

  function dimensionner() {
    if (!lignes.length) return;
    // Place gardée à droite pour la coche « juste » (sur téléphone en portrait, elle est au-dessus).
    const reserve = window.matchMedia('(max-width: 560px)').matches ? 10 : 56;
    const largeurPiste = lignes[lignes.length - 1].piste.clientWidth - 7 - reserve;
    const objets = lignes.map((l) => l.objet);
    const cmMax = Math.max(...objets.map((o) => o.cm));
    let ppc = Math.max(1, largeurPiste) / cmMax;
    const hauteurMax = window.innerWidth < 560 || window.innerHeight < 520 ? 72 : 112;
    const grossir = window.innerWidth >= 700 && window.innerHeight >= 520 ? 1.45 : 1;
    objets.filter((o) => o.type === 'photo').forEach((o) => {
      ppc = Math.min(ppc, hauteurMax / (o.cm * (o.h / o.w)));
    });
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
      sons.succes();
      const message = [...PHRASES.seikai, ...explication(q)];
      $('retour').innerHTML = htmlMots(message);
      $('retour').classList.add('ok');
      parler(message);
      rendreApresReponse();
      $('btn-suivant').hidden = false;
      return;
    }

    q.essais.add(reponse);
    q.indices = true;
    sons.oups();
    const message = q.type === 'tehon' ? PHRASES.oshiiTehon : PHRASES.oshii;
    $('retour').innerHTML = htmlMots(message);
    $('retour').classList.remove('ok');
    parler(message);
    rendreApresReponse(reponse);
  }

  function rendreApresReponse(erreur) {
    const q = courante();
    rendreProgression();
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

  function afficherFin() {
    montrer('fin');
    const n = session.questions.length;
    $('fin-titre').innerHTML = htmlMots(PHRASES.otsukare);
    const texte = [String(n), K('問', 'もん'), ' できたよ。'];
    $('fin-texte').innerHTML = htmlMots(texte);
    sons.fin();
    parler([...PHRASES.otsukare, ' ', ...texte]);
  }

  activable($('btn-suivant'), suivant);
  activable($('btn-ecouter'), parlerConsigne, { garde: false });
  activable($('btn-quitter'), () => { $('confirmation-quitter').hidden = false; });
  $('quitter-oui').addEventListener('click', () => { rendreAccueil(); montrer('accueil'); });
  $('quitter-non').addEventListener('click', () => { $('confirmation-quitter').hidden = true; });
  activable($('btn-recommencer'), () => demarrer(session.niveau));
  activable($('btn-menu'), () => { rendreAccueil(); montrer('accueil'); });

  let minuteurRedim = 0;
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
      ajouter: 'Ajouter une photo',
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
      ajouter: 'しゃしんを ついか',
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
    );
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
    const ajouter = document.createElement('label');
    ajouter.className = 'btn btn-principal';
    ajouter.htmlFor = 'fichier-photo';
    ajouter.tabIndex = 0;
    ajouter.textContent = `＋ ${t('ajouter')}`;
    ajouter.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); $('fichier-photo').click(); }
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

  $('fichier-photo').addEventListener('change', async (ev) => {
    const fichier = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!fichier) return;
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
  });

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
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); $('fichier-photo').click(); }
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
