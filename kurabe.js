/* ==========================================================================
   くらべよう — comparer des longueurs, des masses et des quantités de liquide
   --------------------------------------------------------------------------
   Pour les lycéens avec un retard intellectuel (programme « 比較 » :
   長い / 短い, 〜より長い, 一番長い, comparer avec un modèle ; 重い / 軽い ;
   多い / 少ない ; unités cm, m, g, kg, mL, L).

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
    activites: Array.from({ length: 42 }, (_, i) => i + 1),
    compteurs: ['こ', 'ひき', 'ほん'],
    exemple: true,          // un exemple guidé (れい) avant la 1re question, quand l'activité en a un   // かぞえかた : les compteurs travaillés (いくつ？ n'utilise que ceux-là)
    theme: 'nagasa',        // onglet de l'accueil : ながさ | おもさ | かさ
    nbQuestions: 6,
    ecriture: 'hiragana',   // hiragana | kanji (avec furigana)
    noms: true,             // afficher le nom des objets
    court: true,            // demander aussi « le plus court »
    photos: 'melange',      // jamais | melange | toujours
    vitesse: 0.9,
    voixGenre: 'femme',     // 'femme' ou 'homme' (voix d'homme installée, sinon la voix disponible plus grave)
    voixNom: '',            // une voix précise choisie par les parents ('' : automatique)
    sons: true,
    dureeAppui: 0,          // ms : le doigt doit rester posé ce temps
    antiRebond: 0,          // ms : touchers suivants ignorés
    aide: true,             // boutons « わからない », « そろえる », « うつす »
    nombreMax: 20,          // べんきょう : nombres jusqu'à 10, 20, 50, 100 ou 1000
    compter: true,          // べんきょう : la voix compte à chaque ＋1 / −1
    lireUnites: true,       // la lecture des unités au-dessus des symboles (グラム sur g)
    toucherLire: true,      // toucher une phrase la fait lire ; bouton 👆 : lire les boutons au lieu de les activer
    volumeMax: 500,         // べんきょう かさ : verre doseur de 200, 500 ou 1000 mL
    version: 8,
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
      // Version 4 : masses (13 à 18) et liquides (19 à 24).
      if (stocke.activites && (stocke.version || 1) < 4) {
        stocke.activites = [...new Set([...stocke.activites, ...Array.from({ length: 12 }, (_, i) => i + 13)])];
      }
      // Version 5 : はりで くらべる et les trois leçons sur les masses (25 à 28).
      if (stocke.activites && (stocke.version || 1) < 5) {
        stocke.activites = [...new Set([...stocke.activites, 25, 26, 27, 28])];
      }
      // Version 6 : はかりを よもう, はかって みよう, et la rubrique ね、しっていた？ (29 à 34).
      if (stocke.activites && (stocke.version || 1) < 6) {
        stocke.activites = [...new Set([...stocke.activites, 29, 30, 31, 32, 33, 34])];
      }
      // Version 7 : l'onglet かず (35 à 41).
      if (stocke.activites && (stocke.version || 1) < 7) {
        stocke.activites = [...new Set([...stocke.activites, 35, 36, 37, 38, 39, 40, 41])];
      }
      // Version 8 : かぞえかた (42).
      if (stocke.activites && (stocke.version || 1) < 8) {
        stocke.activites = [...new Set([...stocke.activites, 42])];
      }
      return { ...DEFAUT, ...stocke, version: 8 };
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

  // Symbole d'unité, avec sa lecture en petit au-dessus (comme des furigana) : g → グラム.
  const LECTURES_UNITES = { g: 'グラム', kg: 'キログラム', ml: 'ミリリットル', l: 'リットル', cm: 'センチ', m: 'メートル' };
  const SYMBOLES_UNITES = { g: 'g', kg: 'kg', ml: 'mL', l: 'L', cm: 'cm', m: 'm' };
  function uniteHtml(u) {
    const sym = SYMBOLES_UNITES[u] || u;
    if (reglages.lireUnites === false || !LECTURES_UNITES[u]) return echapper(sym);
    // Sans espace dans la balise : htmlMots() coupe le texte aux espaces.
    return `<ruby>${echapper(sym)}<rt>${LECTURES_UNITES[u]}</rt></ruby>`;
  }
  const nombreUnite = (x, u) => `${echapper(String(x))}\u00a0${uniteHtml(u)}`;

  // « ● » dans les textes : de la même couleur que les jetons dessinés (balise sans espace : voir htmlMots).
  // ◆ ◇ ◎ : des pastilles muettes devant un groupe, dans sa couleur (100 violet, 10 bleu clair, ばら orange).
  // Balises sans espace (htmlMots coupe aux espaces).
  const pionsColores = (t) => t.replace(/●/g, '<mark>●</mark>').replace(/◆/g, '<pc>●</pc>').replace(/◇/g, '<pd>●</pd>').replace(/◎/g, '<pu>●</pu>');
  function html(segments) {
    return segments.map((s) => {
      if (typeof s === 'string' || typeof s === 'number') return pionsColores(echapper(s));
      if (s.u) return nombreUnite(s.x, s.u);
      if (s.d !== undefined) return echapper(s.d);
      if (reglages.ecriture === 'kanji' && s.k) return `<ruby>${echapper(s.k)}<rt>${echapper(s.y)}</rt></ruby>`;
      return echapper(s.y);
    }).join('');
  }

  // Comme html(), mais chaque groupe de mots (séparé par une espace) reste sur une seule ligne.
  // Chaque phrase (jusqu'à 。！？) est aussi regroupée : on peut la toucher pour l'entendre seule.
  function htmlMots(segments) {
    const phrases = [];
    let phrase = [];
    const fermer = () => {
      if (phrase.length) phrases.push(`<span class="phrase-lue">${phrase.join(' ')}</span>`);
      phrase = [];
    };
    html(segments).split(' ').filter(Boolean).forEach((m) => {
      phrase.push(`<span class="mot">${m}</span>`);
      if (/[。！？!?]$/.test(m.replace(/<[^>]+>/g, ''))) fermer();
    });
    fermer();
    return phrases.join(' ');
  }

  // Ce que dit la voix : « ● » se dit « まる » (et non « くろまる »).
  function lecture(segments) {
    return segments.map((s) => (typeof s === 'object' ? (s.s ?? s.y) : String(s))).join('').replace(/[◆◇◎]/g, '').replace(/●/g, 'まる');
  }

  const NAGA = K('長', 'なが');
  const MIJIKA = K('短', 'みじか');
  const ICHIBAN = K('一番', 'いちばん');
  const TEHON = K('手本', 'てほん');
  const ONAJI = K('同', 'おな');
  const KAZU = K('数', 'かず');
  // Ce qu'on compare, c'est le nombre écrit (sur la règle, la はかり, l'étiquette) : 「すうじ」.
  // (「かず」 évoque d'abord le nombre d'objets qu'on compte.)
  const SUJI = K('数字', 'すうじ');
  const OOKI = K('大', 'おお');    // 大きい
  const CHIISA = K('小', 'ちい');  // 小さい
  const OMO = K('重', 'おも');     // 重い
  const KARU = K('軽', 'かる');    // 軽い
  const OO_I = K('多', 'おお');    // 多い
  const SUKU = K('少', 'すく');    // 少ない
  const SAGA = K('下', 'さ');      // 下がった
  const AGA = K('上', 'あ');       // 上がった
  const MI = K('見', 'み');

  // « plus » : 重い / 多い ; « moins » : 軽い / 少ない.
  const MOTS = {
    omosa: { plus: [OMO, 'い'], moins: [KARU, 'い'] },
    kasa: { plus: [OO_I, 'い'], moins: [SUKU, 'ない'] },
  };

  // Les trois onglets de l'accueil.
  const ICONE_TRAIT = 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
  const THEMES = [
    {
      cle: 'kazu', titre: ['かず'], sous: ['いくつ？ よめるかな？'],
      icone: `<svg viewBox="0 0 32 32" ${ICONE_TRAIT} aria-hidden="true"><path d="M5 10l3-2v16M5 24h6M14 12a3.5 3.5 0 0 1 7 0c0 4-7 7-7 12h7M24 9h5l-3 5a4 4 0 1 1-3 6"/></svg>`,
    },
    {
      cle: 'nagasa', titre: [NAGA, 'さ'], sous: [NAGA, 'い？ ', MIJIKA, 'い？'],
      icone: `<svg viewBox="0 0 32 32" ${ICONE_TRAIT} aria-hidden="true"><rect x="3" y="11" width="26" height="10" rx="2"/><path d="M8 11v4M13 11v3M18 11v4M23 11v3"/></svg>`,
    },
    {
      cle: 'omosa', titre: [OMO, 'さ'], sous: [OMO, 'い？ ', KARU, 'い？'],
      icone: `<svg viewBox="0 0 32 32" ${ICONE_TRAIT} aria-hidden="true"><path d="M16 7v19M10 28h12M5 11l22-2M5 11l-3 8h6zM27 9l-3 8h6z"/></svg>`,
    },
    {
      cle: 'kasa', titre: ['かさ'], sous: [OO_I, 'い？ ', SUKU, 'ない？'],
      icone: `<svg viewBox="0 0 32 32" ${ICONE_TRAIT} aria-hidden="true"><path d="M8 5h16l-2 23H10z"/><path d="M9.2 15h13.6" /><path d="M10 15l1 12h10l1-12z" fill="currentColor" opacity=".35" stroke="none"/></svg>`,
    },
  ];

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

  // L'API ne dit pas si une voix est d'homme ou de femme : on reconnaît les noms des voix japonaises
  // d'homme connues (iPad : Otoya, Hattori ; Windows / Edge : Ichiro, Keita…).
  const VOIX_HOMME = /otoya|hattori|ichiro|keita|daichi|naoki|takumi|\bmale\b|男/i;
  const voixJa = () => (synthese ? synthese.getVoices().filter((v) => /^ja/i.test(v.lang)) : []);
  function voixJaponaise() {
    const voix = voixJa();
    if (!voix.length) return null;
    if (reglages.voixNom) {
      const choisie = voix.find((v) => v.name === reglages.voixNom);
      if (choisie) return choisie;
    }
    const homme = reglages.voixGenre === 'homme';
    const duGenre = voix.filter((v) => VOIX_HOMME.test(v.name) === homme);
    const liste = duGenre.length ? duGenre : voix;
    return liste.find((v) => v.localService) || liste[0];
  }
  // Voix d'homme demandée, mais aucune n'est installée : la voix disponible, en plus grave.
  const voixGrave = () => reglages.voixGenre === 'homme' && !reglages.voixNom && !voixJa().some((v) => VOIX_HOMME.test(v.name));

  let paroles = 0;
  function parler(segmentsOuTexte, fin) {
    paroles += 1;
    if (!synthese) {
      if (fin) setTimeout(fin, 1500);
      return;
    }
    const texte = Array.isArray(segmentsOuTexte) ? lecture(segmentsOuTexte) : String(segmentsOuTexte);
    try {
      synthese.cancel();
      const enonce = new SpeechSynthesisUtterance(texte);
      if (fin) {
        enonce.onend = fin;
        enonce.onerror = fin;
      }
      enonce.lang = 'ja-JP';
      const voix = voixJaponaise();
      if (voix) enonce.voice = voix;
      enonce.rate = Number(reglages.vitesse) || 0.9;
      enonce.pitch = voixGrave() ? 0.6 : 1;
      synthese.speak(enonce);
    } catch {
      if (fin) setTimeout(fin, 1500);
    }
  }

  /* ----- Lire ce qu'on touche (pour qui ne lit pas) -----
     - Toucher une phrase (consigne, explication, rappel, égalité, nom d'un objet) : elle est lue seule.
     - Bouton 👆 (mode « よむ ») : toucher un bouton le lit au lieu de l'activer ; on le retouche pour revenir. */

  // Le texte à dire pour un élément : les furigana et les lectures d'unités (グラム) plutôt que les
  // symboles, et les signes des égalités en mots (＋ → たす, ＝ → は, → → で).
  function texteParle(el) {
    const copie = el.cloneNode(true);
    copie.querySelectorAll('svg, [aria-hidden="true"], .numero, pc, pd, pu').forEach((x) => x.remove());
    copie.querySelectorAll('.inconnu').forEach((x) => { x.textContent = ' いくつ '; });
    copie.querySelectorAll('ruby').forEach((r) => {
      const rt = r.querySelector('rt');
      r.replaceWith(rt ? rt.textContent : r.textContent);
    });
    return versParole(copie.textContent);
  }

  // Les symboles en mots : 100 g → 100グラム, « m と cm » → メートルと センチ, ＋ → たす…
  function versParole(texte) {
    const unites = { g: 'グラム', kg: 'キログラム', mL: 'ミリリットル', L: 'リットル', cm: 'センチ', m: 'メートル' };
    return String(texte)
      .replace(/(\d)\s*(kg|mL|cm|g|L|m)(?![a-zA-Z])/g, (_, d, u) => `${d}${unites[u]}`)
      .replace(/(^|[^a-zA-Z\d])(kg|mL|cm|g|L|m)(?![a-zA-Z])/g, (_, a, u) => `${a}${unites[u]}`)
      .replace(/＋/g, ' たす ')
      .replace(/−/g, ' ひく ')
      .replace(/×/g, ' かける ')
      .replace(/＝/g, ' は ')
      .replace(/→/g, ' で ')
      .replace(/●/g, 'まる')
      .replace(/\s+/g, ' ')
      .trim();
  }

  let elementLu = null;
  function lireElement(el, texte) {
    const t = (texte || texteParle(el)).trim();
    if (!t) return;
    if (elementLu) elementLu.classList.remove('en-lecture');
    elementLu = el;
    el.classList.add('en-lecture');
    parler(t, () => {
      el.classList.remove('en-lecture');
      if (elementLu === el) elementLu = null;
    });
  }

  let modeLecture = false;
  const lectureActive = () => reglages.toucherLire !== false;

  if (synthese) {
    synthese.getVoices();
    // Les voix arrivent parfois après le démarrage : la liste de l'espace parents se met à jour.
    if (typeof synthese.addEventListener === 'function') {
      synthese.addEventListener('voiceschanged', () => { if (ecranActuel === 'parents') rendreParents(); });
    }
  }

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
      if (modeLecture && lectureActive() && !el.classList.contains('btn-lire')) {
        lireElement(el, el.getAttribute('aria-label') ? versParole(el.getAttribute('aria-label')) : '');
        return;
      }
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
    { n: 10, etude: 'libre', titre: ['のばして みよう'], sous: [SUJI, 'が かわるよ'], fr: 'べんきょう : étirer le ruban et voir les nombres changer', barres: 'etude-libre' },
    { n: 11, etude: 'plus', titre: ['たしざん'], sous: ['みぎに のばす（＋）'], fr: 'べんきょう : additionner en tirant vers la droite', barres: 'etude-plus' },
    { n: 12, etude: 'moins', titre: ['ひきざん'], sous: ['ひだりに もどす（−）'], fr: 'べんきょう : soustraire en tirant vers la gauche', barres: 'etude-moins' },
    { n: 35, theme: 'kazu', titre: ['いくつ？'], sous: ['かぞえよう'], fr: 'Compter des objets (1 à 10), réponse en chiffres et en hiragana', barres: 'k-compter' },
    { n: 36, theme: 'kazu', titre: ['よみかた'], sous: [SUJI, 'と ひらがな'], fr: 'Lire les nombres : chiffre → hiragana, hiragana → chiffre', barres: 'k-lire' },
    { n: 37, theme: 'kazu', titre: ['10の まとまり'], sous: ['10ずつ かぞえる'], fr: 'Compter des jetons rangés par 10 (11 à 99)', barres: 'k-dizaines' },
    { n: 38, theme: 'kazu', titre: ['どっちが ', OOKI, 'きい？'], sous: [SUJI, 'を くらべる'], fr: 'Comparer deux nombres (1 à 100)', barres: 'k-comparer' },
    { n: 42, theme: 'kazu', titre: ['かぞえかた'], sous: ['〜こ、 〜ひき、 〜ほん'], fr: 'Les compteurs (助数詞) : choisir 〜こ, 〜ひき, 〜ほん… selon la chose, puis la bonne lecture (いっぽん, さんぼん, ろっぽん…)', barres: 'k-compteur' },
    { n: 39, theme: 'kazu', etude: 'lecon-kazu1', titre: ['1から 10まで'], sous: ['いち、 に、 さん…'], fr: 'べんきょう : compter jusqu’à 10 avec le cadre de 10 (et la lecture en hiragana)', barres: 'k-lecon1' },
    { n: 40, theme: 'kazu', etude: 'lecon-kazu2', titre: ['10より ', OOKI, 'きい かず'], sous: ['10の まとまりで 100まで'], fr: 'べんきょう : de 11 à 100 avec les « 10の まとまり » (cadres de 10 pleins), comptés par 10', barres: 'k-lecon2' },
    { n: 41, theme: 'kazu', etude: 'lecon-kazu3', titre: ['100より ', OOKI, 'きい かず'], sous: ['ひゃく、 せん'], fr: 'べんきょう : les centaines jusqu’à 1000 (さんびゃく, ろっぴゃく…)', barres: 'k-lecon3' },
    { n: 32, groupe: 'culture', etude: 'lecon-corps', titre: ['からだで はかる'], sous: ['あた・ひろ'], fr: 'ね、しっていた？ Mesurer avec le corps (あた, ひろ), et pourquoi le cm', barres: 'lecon-corps' },
    { n: 33, groupe: 'culture', etude: 'lecon-shaku', titre: ['しゃくと すん'], sous: ['いっすんぼうしは なん cm？'], fr: 'ね、しっていた？ 尺 et 寸 : 1 寸 ≈ 3 cm, 1 尺 ≈ 30 cm', barres: 'lecon-shaku' },
    { n: 25, theme: 'omosa', titre: ['はりで くらべる'], sous: ['はかりの はりが たくさん まわった ほう'], fr: 'Balances de cuisine sans nombres : l’aiguille qui a le plus tourné', barres: 'hakari-simple' },
    { n: 14, theme: 'omosa', titre: [MI, 'ためと ちがう'], sous: ['よそうして、 はかりで たしかめる'], fr: 'Gros mais léger : deviner, puis vérifier sur les balances de cuisine', barres: 'devine' },
    { n: 15, theme: 'omosa', titre: [ICHIBAN, ' ', OMO, 'いのは？'], sous: ['はかりで くらべる'], fr: 'Le plus lourd parmi trois (balances de cuisine)', barres: 'hakari' },
    { n: 29, theme: 'omosa', titre: ['はかりを よもう'], sous: ['はりは なん g？'], fr: 'Lire une balance de cuisine (trois nombres au choix)', barres: 'lecture-hakari' },
    { n: 16, theme: 'omosa', titre: ['g で くらべる'], sous: ['300\u00a0g と 250\u00a0g'], fr: 'Nombres en g (300 g ou 250 g ?)', barres: 'g' },
    { n: 17, theme: 'omosa', titre: ['kg と g'], sous: ['1\u00a0kg ＝ 1000\u00a0g'], fr: 'Kilogrammes et grammes (1 kg ou 800 g ?)', barres: 'kgg' },
    { n: 28, theme: 'omosa', etude: 'lecon-hakari', titre: ['はかりの よみかた'], sous: ['はりの うごきと めもり'], fr: 'べんきょう : lire une balance de cuisine (l’aiguille, les graduations)', barres: 'lecon-hakari' },
    { n: 27, theme: 'omosa', etude: 'lecon-unites', titre: ['g と kg'], sous: ['1えんだまは 1\u00a0g'], fr: 'べんきょう : les unités sur la balance de cuisine (1円玉 ＝ 1 g … 1 kg ＝ 1000 g)', barres: 'lecon-unites' },
    { n: 30, theme: 'omosa', etude: 'lecon-pratique', titre: ['はかって みよう'], sous: ['おもりを のせて ○\u00a0g に'], fr: 'べんきょう : poser des poids pour que l’aiguille montre une masse donnée', barres: 'lecon-pratique' },
    { n: 26, theme: 'omosa', groupe: 'culture', etude: 'lecon-balance', titre: ['てんびん'], sous: ['むかしの はかり'], fr: 'ね、しっていた？ La balance à plateaux (leçon guidée, poids identiques)', barres: 'lecon-balance' },
    { n: 13, theme: 'omosa', groupe: 'culture', titre: ['てんびんで くらべる'], sous: [SAGA, 'がった ほうが ', OMO, 'い'], fr: 'ね、しっていた？ Lequel est le plus lourd ? (balance à plateaux)', barres: 'balance' },
    { n: 18, theme: 'omosa', groupe: 'culture', etude: 'balance', titre: ['つりあわせよう'], sous: ['つみきや おもりを のせる'], fr: 'ね、しっていた？ Équilibrer la balance avec des cubes ou des poids', barres: 'etude-balance' },
    { n: 31, theme: 'omosa', groupe: 'culture', etude: 'lecon-monme', titre: ['もんめと 5えんだま'], sous: ['むかしの ', OMO, 'さの たんい'], fr: 'ね、しっていた？ 匁 (もんめ) : la pièce de 5 円 pèse 1 匁 (3,75 g)', barres: 'lecon-monme' },
    { n: 19, theme: 'kasa', titre: ['どっちが ', OO_I, 'い？'], sous: [ONAJI, 'じ コップで くらべる'], fr: 'Lequel contient le plus ? (verres identiques)', barres: 'verres' },
    { n: 20, theme: 'kasa', titre: [ICHIBAN, ' ', OO_I, 'いのは？'], sous: ['3つから えらぶ'], fr: 'Le plus rempli parmi trois verres', barres: 'verres3' },
    { n: 21, theme: 'kasa', titre: ['うつして くらべよう'], sous: ['かたちが ちがう いれもの'], fr: 'Récipients différents : verser dans des verres identiques', barres: 'transvaser' },
    { n: 22, theme: 'kasa', titre: ['mL で くらべる'], sous: ['200\u00a0mL と 350\u00a0mL'], fr: 'Nombres en mL (200 mL ou 350 mL ?)', barres: 'ml' },
    { n: 23, theme: 'kasa', titre: ['L と mL'], sous: ['1\u00a0L ＝ 1000\u00a0mL'], fr: 'Litres et millilitres (1 L ou 800 mL ?)', barres: 'lml' },
    { n: 24, theme: 'kasa', etude: 'verre', titre: ['はかって いれよう'], sous: ['カップの めもりを よむ'], fr: 'べんきょう : remplir un verre doseur jusqu’à la bonne quantité', barres: 'etude-verre' },
    { n: 34, theme: 'kasa', groupe: 'culture', etude: 'lecon-gou', titre: ['ごうと しょう'], sous: ['おこめの カップ'], fr: 'ね、しっていた？ 合 et 升 : 1 合 ＝ 180 mL (le riz), 1 升 ＝ 1,8 L', barres: 'lecon-gou' },
  ];
  const themeDe = (a) => a.theme || 'nagasa';
  // Numéro affiché : 1, 2, 3… dans chaque onglet (les もんだい, puis les べんきょう).
  // Trois groupes : もんだい, べんきょう, puis ね、しっていた？ (la culture : むかしは…).
  const groupeDe = (a) => a.groupe || (a.etude ? 'etude' : 'probleme');
  function ordreTheme(theme) {
    const liste = ACTIVITES.filter((a) => themeDe(a) === theme);
    return ['probleme', 'etude', 'culture'].flatMap((g) => liste.filter((a) => groupeDe(a) === g));
  }
  const numeroAffiche = (a) => ordreTheme(themeDe(a)).indexOf(a) + 1;

  const animationsReduites = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const entier = (a, b) => Math.floor(aleatoire(a, b + 1));
  const valeurCm = (c) => ({ cm: c, m: null, x: c, u: 'cm', affichage: `${c}\u00a0cm`, lecture: `${c}センチ` });
  const valeurM = (m) => ({ cm: m * 100, m, x: m, u: 'm', affichage: `${m}\u00a0m`, lecture: `${m}メートル` });
  // Nombre + unité : affiché « 10 g » (avec グラム en petit au-dessus), lu « 10グラム ».
  const segUnite = (x, u) => ({ x, u, d: `${x}\u00a0${SYMBOLES_UNITES[u]}`, s: `${x}${LECTURES_UNITES[u]}` });
  const segValeur = (v) => (v.u ? segUnite(v.x, v.u) : V(v.affichage, v.lecture));
  const cmTexte = (x) => String(Math.round(x * 10) / 10);
  const segCm = (x) => segUnite(cmTexte(x), 'cm');

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

  // Une photo peut n'avoir qu'un poids ou une contenance : pour les longueurs, il faut des cm.
  const photosCm = () => photos.filter((p) => Number(p.cm) > 0);

  function utiliserPhotos() {
    if (photosCm().length < 2 || reglages.photos === 'jamais') return false;
    return reglages.photos === 'toujours' || Math.random() < 0.5;
  }

  function pairePhotos(rmin, rmax, nomsDifferents) {
    const liste = photosCm();
    const possibles = [];
    for (let i = 0; i < liste.length; i++) {
      for (let j = i + 1; j < liste.length; j++) {
        const a = liste[i];
        const b = liste[j];
        const r = Math.max(a.cm, b.cm) / Math.min(a.cm, b.cm);
        if (r >= rmin && r <= rmax && (!nomsDifferents || a.yomi !== b.yomi)) possibles.push([a, b]);
      }
    }
    return possibles.length ? choisir(possibles).map(objetPhoto) : null;
  }

  function trioPhotos(rmin) {
    const t = photosCm().sort((a, b) => a.cm - b.cm);
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
    if ((niveau >= 35 && niveau <= 38) || niveau === 42) return genererQuestionKazu(niveau, derniere, i, n);
    if (niveau >= 13) return genererQuestionMV(niveau, derniere, i, n);
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

  // Petits dessins des cartes おもさ / かさ (même cadre 256 × 64 que les barres des longueurs).
  function contenuActiviteMV(code) {
    const trait = 'fill:none;stroke:var(--encre-douce);stroke-width:4;stroke-linecap:round;stroke-linejoin:round';
    const texte = 'fill:var(--encre);font-size:24px;font-weight:700';
    const question = '<text x="170" y="44" style="fill:var(--action);font-size:30px;font-weight:700">？</text>';
    const verre = (x, h, c, w = 34, H = 56) => `<path d="M${x} ${62 - H}v${H}h${w}v${-H}" style="${trait}"/>`
      + `<rect x="${x + 2}" y="${60 - h}" width="${w - 4}" height="${h}" style="fill:${c}"/>`;
    const cadran = (x, a) => `<circle cx="${x}" cy="34" r="22" style="${trait};stroke-width:3"/>`
      + `<line x1="${x}" y1="34" x2="${x + 16 * Math.sin(a)}" y2="${34 - 16 * Math.cos(a)}" style="stroke:var(--o1);stroke-width:4;stroke-linecap:round"/>`;
    switch (code) {
      case 'balance':
        return `<path d="M128 30v28M104 60h48" style="${trait}"/><g transform="rotate(9 128 30)"><path d="M48 30h160M30 22h36M190 22h36" style="${trait}"/>`
          + '<circle cx="48" cy="12" r="9" style="fill:var(--o5)"/><circle cx="208" cy="9" r="12" style="fill:var(--o2)"/></g>';
      case 'devine':
        return '<circle cx="60" cy="30" r="27" style="fill:var(--o6);opacity:.85"/><path d="M60 57v6" style="stroke:var(--encre-douce);stroke-width:2"/>'
          + '<circle cx="200" cy="46" r="13" style="fill:var(--encre-douce)"/>'
          + '<text x="116" y="44" style="fill:var(--action);font-size:30px;font-weight:700">？</text>';
      case 'hakari':
        return cadran(48, 1.2) + cadran(128, 3.4) + cadran(208, 2.1);
      case 'hakari-simple':
        return `<path d="M70 34L70 12A22 22 0 0 1 88 47Z" style="fill:var(--o5);opacity:.45"/>${cadran(70, 2.2)}`
          + `<path d="M170 34L170 12A22 22 0 0 1 182 16Z" style="fill:var(--o5);opacity:.45"/>${cadran(170, 0.6)}`;
      case 'lecon-balance':
        return `<path d="M128 30v28M104 60h48" style="${trait}"/><g transform="rotate(-9 128 30)"><path d="M48 30h160M30 22h36M190 22h36" style="${trait}"/>`
          + '<circle cx="48" cy="12" r="10" style="fill:var(--o1)"/></g>'
          + '<path d="M218 6l-10 12h6v14h8V18h6z" style="fill:var(--action)"/>';
      case 'lecon-unites':
        return '<circle cx="34" cy="44" r="12" style="fill:var(--metal);stroke:var(--encre-douce);stroke-width:2"/>'
          + '<text x="34" y="49" text-anchor="middle" style="fill:var(--encre);font-size:13px;font-weight:700">1</text>'
          + '<rect x="70" y="32" width="26" height="28" rx="4" style="fill:var(--metal)"/><rect x="118" y="22" width="36" height="38" rx="5" style="fill:var(--metal)"/>'
          + '<rect x="178" y="6" width="56" height="54" rx="6" style="fill:color-mix(in srgb, var(--metal) 70%, var(--encre-douce))"/>'
          + `<text x="83" y="51" text-anchor="middle" style="${texte};font-size:10px">10g</text><text x="136" y="46" text-anchor="middle" style="${texte};font-size:12px">100g</text>`
          + `<text x="206" y="40" text-anchor="middle" style="${texte};font-size:16px">1kg</text>`;
      case 'k-compter':
        return [0, 1, 2, 3, 4].map((k) => `<text x="${20 + k * 30}" y="44" style="font-size:24px">🍎</text>`).join('')
          + `<text x="185" y="46" style="${texte};font-size:30px">5</text>`;
      case 'k-lire':
        return `<text x="20" y="48" style="${texte};font-size:40px">7</text><path d="M60 34h40M92 26l8 8-8 8" style="${trait}"/>`
          + `<text x="115" y="44" style="${texte};font-size:26px">なな</text>`;
      case 'k-dizaines':
        return [0, 1, 2].map((k) => `<rect x="${12 + k * 60}" y="16" width="52" height="22" rx="3" style="fill:var(--o2)"/>`).join('')
          + '<circle cx="200" cy="27" r="6" style="fill:var(--o5)"/><circle cx="216" cy="27" r="6" style="fill:var(--o5)"/>'
          + `<text x="80" y="60" style="${texte};font-size:18px">10 10 10 ＋ 2</text>`;
      case 'k-compteur':
        return [0, 1, 2].map((k) => `<text x="${8 + k * 30}" y="44" style="font-size:24px">🐟</text>`).join('')
          + `<text x="104" y="44" style="${texte};font-size:26px">3びき</text>`;
      case 'k-comparer':
        return `<text x="20" y="46" style="${texte};font-size:32px">21</text><text x="88" y="46" style="${texte};font-size:30px">12</text>${question}`;
      case 'k-lecon1':
        return Array.from({ length: 10 }, (_, k) => `<circle cx="${30 + (k % 5) * 26}" cy="${18 + Math.floor(k / 5) * 26}" r="10" style="fill:${k < 7 ? 'var(--o5)' : 'none'};stroke:var(--encre-douce);stroke-width:2"/>`).join('')
          + `<text x="170" y="46" style="${texte};font-size:30px">7</text>`;
      case 'k-lecon2':
        return [0, 1, 2].map((k) => `<rect x="${6 + k * 38}" y="14" width="34" height="26" rx="3" style="fill:none;stroke:var(--encre-douce);stroke-width:1.5"/>`
          + Array.from({ length: 10 }, (_, j) => `<circle cx="${11 + k * 38 + (j % 5) * 6}" cy="${21 + Math.floor(j / 5) * 12}" r="2.6" style="fill:var(--o2)"/>`).join('')).join('')
          + '<circle cx="128" cy="34" r="5" style="fill:var(--o5)"/><circle cx="142" cy="34" r="5" style="fill:var(--o5)"/>'
          + `<text x="162" y="44" style="${texte};font-size:28px">32</text>`;
      case 'k-lecon3':
        return [14, 74].map((x0) => `<rect x="${x0}" y="6" width="54" height="54" rx="4" style="fill:none;stroke:var(--o4);stroke-width:1.5"/>`
          + Array.from({ length: 100 }, (_, j) => `<circle cx="${x0 + 3.2 + (j % 10) * 5.2}" cy="${9.2 + Math.floor(j / 10) * 5.2}" r="2" style="fill:var(--o4)"/>`).join('')).join('')
          + `<text x="146" y="44" style="${texte};font-size:28px">200</text>`;
      case 'lecture-hakari':
        return `${cadran(70, 2.1)}<text x="130" y="44" style="${texte}">？ g</text>`;
      case 'lecon-pratique':
        return `${cadran(70, 1.6)}<path d="M112 34h30M134 26l8 8-8 8" style="${trait}"/>`
          + '<rect x="160" y="26" width="20" height="30" rx="3" style="fill:var(--metal)"/><rect x="186" y="38" width="14" height="18" rx="3" style="fill:var(--metal)"/><rect x="204" y="38" width="14" height="18" rx="3" style="fill:var(--metal)"/>';
      case 'lecon-monme':
        return '<circle cx="70" cy="34" r="22" style="fill:#c9a227"/><circle cx="70" cy="34" r="6" style="fill:var(--surface)"/>'
          + `<text x="110" y="44" style="${texte}">＝ 1もんめ</text>`;
      case 'lecon-corps':
        return '<rect x="10" y="10" width="236" height="12" rx="3" style="fill:var(--bois)"/>'
          + [0, 1, 2, 3].map((k) => `<path d="M${14 + k * 58} 34h52" style="stroke:var(--o2);stroke-width:3"/><text x="${30 + k * 58}" y="60" style="font-size:22px">✋</text>`).join('');
      case 'lecon-shaku':
        return '<rect x="10" y="20" width="236" height="34" rx="4" style="fill:var(--bois)"/>'
          + Array.from({ length: 11 }, (_, k) => `<path d="M${10 + k * 22.4} 20v12" style="stroke:var(--encre);stroke-width:2"/>`).join('')
          + '<rect x="10" y="20" width="22.4" height="34" style="fill:var(--o5);opacity:.4"/><text x="12" y="16" style="font-size:16px">🧒</text>';
      case 'lecon-gou':
        return `${verre(60, 44, 'var(--eau)', 40)}<text x="62" y="20" style="${texte};font-size:14px">1ごう</text>`
          + `<path d="M110 34h30M132 26l8 8-8 8" style="${trait}"/><text x="152" y="44" style="${texte}">180 mL</text>`;
      case 'lecon-hakari':
        return `${cadran(70, 2.4)}<path d="M120 34h40M150 24l10 10-10 10" style="${trait}"/>`
          + [0, 1, 2].map((k) => `<rect x="${186 + k * 18}" y="${40 - k * 0}" width="15" height="18" rx="3" style="fill:var(--metal)"/>`).join('');
      case 'g': return `<text x="6" y="27" style="${texte}">300 g</text><text x="6" y="58" style="${texte}">250 g</text>${question}`;
      case 'kgg': return `<text x="6" y="27" style="${texte}">1 kg</text><text x="6" y="58" style="${texte}">800 g</text>${question}`;
      case 'ml': return `<text x="6" y="27" style="${texte}">200 mL</text><text x="6" y="58" style="${texte}">350 mL</text>${question}`;
      case 'lml': return `<text x="6" y="27" style="${texte}">1 L</text><text x="6" y="58" style="${texte}">800 mL</text>${question}`;
      case 'etude-balance':
        return `<path d="M128 30v28M104 60h48M48 30h160M30 22h36M190 22h36" style="${trait}"/>`
          + '<circle cx="48" cy="12" r="9" style="fill:var(--o5)"/>'
          + [0, 1, 2].map((k) => `<rect x="${195 + k * 9}" y="10" width="8" height="10" rx="1" style="fill:var(--o5)"/>`).join('')
          + '<rect x="199" y="0" width="8" height="10" rx="1" style="fill:var(--o5)"/>';
      case 'verres': return verre(70, 22, 'var(--eau)') + verre(150, 44, 'var(--jus)');
      case 'verres3': return verre(50, 30, 'var(--eau)') + verre(110, 46, 'var(--jus)') + verre(170, 18, 'var(--the)');
      case 'transvaser':
        return `<path d="M30 8h18v54H30z" style="${trait}"/><rect x="32" y="20" width="14" height="40" style="fill:var(--eau)"/>`
          + `<path d="M70 40v20h70V40" style="${trait}"/><rect x="72" y="48" width="66" height="12" style="fill:var(--jus)"/>`
          + `<path d="M154 34h26M172 26l8 8-8 8" style="${trait}"/>${verre(196, 26, 'var(--eau)', 22)}${verre(224, 40, 'var(--jus)', 22)}`;
      case 'etude-verre':
        return `${verre(100, 30, 'var(--eau)', 52)}`
          + [14, 26, 38, 50].map((y) => `<path d="M102 ${y}h10" style="stroke:var(--encre-douce);stroke-width:2"/>`).join('')
          + `<path d="M180 52V14M170 24l10-10 10 10" style="${trait};stroke:var(--o3)"/>`;
      default: return '';
    }
  }

  function svgActivite(barres) {
    const mv = typeof barres === 'string' ? contenuActiviteMV(barres) : '';
    if (mv) return `<svg viewBox="0 0 256 64" preserveAspectRatio="xMinYMid meet" aria-hidden="true">${mv}</svg>`;
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
    // Onglets ながさ / おもさ / かさ (seulement ceux qui ont des activités choisies par les parents).
    const avecActivites = THEMES.filter((th) => ACTIVITES.some((a) => themeDe(a) === th.cle && reglages.activites.includes(a.n)));
    const actif = avecActivites.find((th) => th.cle === reglages.theme) || avecActivites[0] || THEMES[0];
    $('sous-titre').innerHTML = html(actif.sous);
    const nav = $('themes');
    nav.replaceChildren();
    nav.hidden = avecActivites.length < 2;
    avecActivites.forEach((th) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'theme';
      b.setAttribute('aria-pressed', String(th === actif));
      b.innerHTML = `${th.icone}<span>${html(th.titre)}</span>`;
      activable(b, () => {
        if (th === actif) return;
        ecrireReglages({ theme: th.cle });
        rendreAccueil();
        parler(th.titre);
      });
      nav.append(b);
    });
    const zone = $('activites');
    zone.replaceChildren();
    zone.scrollTop = 0;
    const duTheme = ACTIVITES.filter((a) => themeDe(a) === actif.cle);
    const groupes = [
      { titre: ['もんだい'], liste: duTheme.filter((a) => groupeDe(a) === 'probleme') },
      { titre: [K('勉強', 'べんきょう')], liste: duTheme.filter((a) => groupeDe(a) === 'etude') },
      { titre: ['ね、 しっていた？', V('（むかしは…）', '')], liste: duTheme.filter((a) => groupeDe(a) === 'culture') },
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
        carte.dataset.n = String(a.n);
        carte.innerHTML = `<span class="numero">${numeroAffiche(a)}</span>${svgActivite(a.barres)}`
          + `<strong>${html(a.titre)}</strong><span class="sous">${html(a.sous)}</span>`;
        carte.setAttribute('aria-label', `${numeroAffiche(a)}. ${lecture(a.titre)} ${lecture(a.sous)}`);
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
    const exemple = exempleDe(niveau);
    session = {
      niveau,
      questions: [...(exemple ? [exemple] : []), ...Array.from({ length: n }, (_, i) => genererQuestion(niveau, i === n - 1, i, n))],
      index: 0,
    };
    montrer('question');
    afficherQuestion();
  }

  function consigneDe(q) {
    if (estMV(q)) return consigneMV(q);
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
      ? [ICHIBAN, ' ', mot, 'いのは ', SUJI, 'が ', ICHIBAN, ' ', ...taille, ' ほう。 ']
      : [mot, 'いのは ', SUJI, 'が ', ...taille, ' ほう。 '];
  }

  // La même règle, en court, affichée sous la consigne après une bonne réponse.
  function rappelDe(q) {
    if (estMV(q)) return rappelMV(q);
    if (q.type === 'tehon') return [ONAJI, 'じ ', NAGA, 'さ ＝ ', ONAJI, 'じ ', SUJI];
    const sens = q.type === 'phrase' ? q.bonne : q.demande;
    const mot = sens === 'long' ? NAGA : MIJIKA;
    const taille = sens === 'long' ? [OOKI, 'きい'] : [CHIISA, 'さい'];
    if (q.type === 'trio') return [ICHIBAN, ' ', mot, 'い ＝ ', SUJI, 'が ', ICHIBAN, ' ', ...taille];
    // 1 m et 75 cm : la règle ne vaut qu'une fois dans la même unité.
    const unite = q.mixte ? [ONAJI, 'じ たんいなら '] : [];
    return [...unite, mot, 'い ＝ ', SUJI, 'が ', ...taille];
  }

  // L'explication donne toujours les longueurs, la règle, puis la conclusion avec l'écart.
  function explication(q) {
    if (estMV(q)) return explicationMV(q);
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
      return [TEHON, 'は ', segCm(q.modele.cm), '。 これも ', segCm(q.objets[q.bonne].cm), '。 ', ONAJI, 'じ ', SUJI, 'だから、 ', ONAJI, 'じ ', NAGA, 'さだね。'];
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
    // L'exemple : つぎへ passe d'une étape à l'autre, はじめる lance les questions.
    if (q.type === 'tuto') {
      $('btn-suivant').hidden = false;
      $('btn-suivant').textContent = q.etape < q.etapes.length - 1 ? 'つぎへ' : 'はじめる';
    } else {
      $('btn-suivant').textContent = 'つぎへ';
    }
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
    else if (q.type === 'nombre' || q.type === 'mesures') parler([segValeur(q.valeurs[0]), 'と ', segValeur(q.valeurs[1]), '、 ', ...consigneDe(q)]);
    else parler(consigneDe(q));
  }

  function rendreProgression() {
    const liste = $('progression');
    liste.replaceChildren();
    session.questions.forEach((q, i) => {
      if (q.type === 'tuto') return;
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
    $('ecran-question').classList.toggle('q-kazu', q.theme === 'kazu');
    // Dès le départ (avant de mesurer la place des objets) : les réponses かず en liste.
    $('choix-mots').classList.toggle('choix-liste', q.theme === 'kazu' && q.type !== 'comparer' && q.type !== 'tuto');
    $('consigne').innerHTML = htmlMots(consigneDe(q));

    const phrase = $('phrase');
    const choix = $('choix-mots');
    phrase.hidden = q.type !== 'phrase';
    // かず : les réponses restent affichées pendant qu'on mesure la place des objets (elles en prennent).
    choix.hidden = q.type !== 'phrase' && !(q.theme === 'kazu' && q.type !== 'comparer' && q.type !== 'tuto');

    const etabli = $('etabli');
    etabli.replaceChildren();
    etabli.classList.remove('libre', 'nombres', 'scene-mv');
    etabli.classList.toggle('sans-noms', !reglages.noms && q.type !== 'phrase');
    lignes = [];
    libres = [];
    cibles = [];

    if (estMV(q)) {
      rendreMV(q, etabli);
      majBoutonAide();
      return;
    }

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
          conversion.innerHTML = `＝ ${nombreUnite(v.cm, 'cm')}`;
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
    rappel.dataset.parole = versParole(lecture(rappelDe(q)));
    rappel.hidden = false;
  }

  /* ----- Preuve après une bonne réponse : longueurs, règle, partie qui dépasse ----- */

  let echelle = null;   // { ppc } : pixels par centimètre de la question affichée
  const reserveRegle = () => (window.innerHeight < 520 ? 40 : 50);

  // Graduations lisibles : un nombre tous les 34 px au moins, un trait tous les 6 px au moins.
  function pasRegle(ppc) {
    const etiquette = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].find((p) => p * ppc >= 34) || 1000;
    const trait = [1, 2, 5, 10, 20, 50, 100, 200].find((p) => p * ppc >= 6 && etiquette % p === 0) || etiquette;
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
      + `<text class="unite" x="${largeur + 4 + String(cmFin).length * 3.5}" y="26">cm</text></svg>`;
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
    // おもさ / かさ : la preuve fait partie du dessin.
    if (estMV(q)) {
      rendreQuestion();
      return;
    }
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

  /* ======================================================================
     おもさ (masses) et かさ (liquides)
     Mêmes principes que pour les longueurs : de grosses différences d'abord, la preuve
     après chaque bonne réponse, et la règle « 重い／多い ＝ 数が大きい ».
     ====================================================================== */

  const UNITES = {
    g: { d: 'g', s: 'グラム', facteur: 1 },
    kg: { d: 'kg', s: 'キログラム', facteur: 1000 },
    ml: { d: 'mL', s: 'ミリリットル', facteur: 1 },
    l: { d: 'L', s: 'リットル', facteur: 1000 },
  };
  const segU = (x, u) => segUnite(x, u);
  const uniteDe = (theme) => (theme === 'omosa' ? 'g' : 'ml');
  const valeurU = (x, u) => ({
    x, u, val: x * UNITES[u].facteur, grande: UNITES[u].facteur > 1,
    affichage: `${x}\u00a0${UNITES[u].d}`, lecture: `${x}${UNITES[u].s}`,
  });
  const motDe = (theme, sens) => MOTS[theme][sens];

  // Objets à peser. « taille » : grosseur à l'écran (1 = normal). Poids réalistes, en g.
  const CHOSES = [
    { yomi: 'ふうせん', kanji: '風船', emoji: '🎈', val: 5, taille: 1.5 },
    { yomi: 'はね', kanji: '羽', emoji: '🪶', val: 1, taille: 1.15 },
    { yomi: 'ぬいぐるみ', emoji: '🧸', val: 150, taille: 1.45 },
    { yomi: 'いし', kanji: '石', emoji: '🪨', val: 700, taille: 0.75 },
    { yomi: 'かんづめ', kanji: '缶詰', emoji: '🥫', val: 400, taille: 0.7 },
    { yomi: 'りんご', emoji: '🍎', val: 300, taille: 0.85 },
    { yomi: 'いちご', emoji: '🍓', val: 20, taille: 0.55 },
    { yomi: 'たまご', kanji: '卵', emoji: '🥚', val: 60, taille: 0.6 },
    { yomi: 'ほん', kanji: '本', emoji: '📕', val: 500, taille: 1 },
    { yomi: 'バナナ', emoji: '🍌', val: 120, taille: 0.95 },
    { yomi: 'ボール', emoji: '⚽', val: 430, taille: 1.1 },
    { yomi: 'みかん', emoji: '🍊', val: 100, taille: 0.65 },
    { yomi: 'かぎ', kanji: '鍵', emoji: '🔑', val: 10, taille: 0.55 },
    { yomi: 'トマト', emoji: '🍅', val: 200, taille: 0.7 },
    { yomi: 'くつ', kanji: '靴', emoji: '👟', val: 250, taille: 1.1 },
  ];
  const chose = (yomi) => CHOSES.find((c) => c.yomi === yomi);
  const objetChose = (c) => ({ type: 'chose', ...c });
  // « みためと ちがう » : [gros mais léger, petit mais lourd]…
  const PIEGES = [['ふうせん', 'いし'], ['ふうせん', 'かんづめ'], ['ふうせん', 'りんご'], ['はね', 'たまご'],
    ['はね', 'かぎ'], ['ぬいぐるみ', 'いし'], ['ぬいぐるみ', 'かんづめ'], ['ふうせん', 'トマト'], ['ぬいぐるみ', 'りんご']];
  // … et quelques paires où le plus gros est aussi le plus lourd (pour ne pas apprendre « gros = léger »).
  const EVIDENTS = [['ボール', 'いちご'], ['ほん', 'かぎ'], ['くつ', 'いちご'], ['ボール', 'みかん'], ['ほん', 'たまご']];

  const BOISSONS = [
    { yomi: 'みず', kanji: '水', couleur: 'var(--eau)' },
    { yomi: 'ジュース', couleur: 'var(--jus)' },
    { yomi: 'おちゃ', kanji: 'お茶', couleur: 'var(--the)' },
    { yomi: 'ぎゅうにゅう', kanji: '牛乳', couleur: 'var(--lait)' },
  ];

  // Récipients de formes différentes (w, h : largeur et hauteur relatives). Contenance ∝ w² × h.
  const CONTENANTS = {
    bin: { yomi: 'びん', kanji: '瓶', w: 0.34, h: 1, forme: 'bin' },
    kappu: { yomi: 'カップ', w: 0.5, h: 0.6, forme: 'tasse' },
    boru: { yomi: 'ボウル', w: 1, h: 0.42, forme: 'bol' },
    nabe: { yomi: 'なべ', kanji: '鍋', w: 0.8, h: 0.55, forme: 'nabe' },
  };
  const capacite = (c) => Math.round(c.w * c.w * c.h * 2600);

  const idxMaxV = (t) => t.reduce((m, o, i) => (o.val > t[m].val ? i : m), 0);
  const idxMinV = (t) => t.reduce((m, o, i) => (o.val < t[m].val ? i : m), 0);

  const photosAvec = (cle) => photos.filter((p) => Number(p[cle]) > 0);
  const objetPhotoMV = (p, cle) => ({ type: 'photo', id: p.id, val: Number(p[cle]), yomi: p.yomi, kanji: p.kanji || null, w: p.w, h: p.h });

  function utiliserPhotosAvec(cle) {
    if (photosAvec(cle).length < 2 || reglages.photos === 'jamais') return false;
    return reglages.photos === 'toujours' || Math.random() < 0.5;
  }

  function pairePhotosAvec(cle, rmin, rmax) {
    const t = photosAvec(cle);
    const possibles = [];
    for (let i = 0; i < t.length; i++) {
      for (let j = i + 1; j < t.length; j++) {
        const r = Math.max(t[i][cle], t[j][cle]) / Math.min(t[i][cle], t[j][cle]);
        if (r >= rmin && r <= rmax && t[i].yomi !== t[j].yomi) possibles.push([t[i], t[j]]);
      }
    }
    return possibles.length ? choisir(possibles).map((p) => objetPhotoMV(p, cle)) : null;
  }

  function trioPhotosAvec(cle, rmin) {
    const t = photosAvec(cle).sort((a, b) => a[cle] - b[cle]);
    const possibles = [];
    for (let i = 0; i < t.length; i++) {
      for (let j = i + 1; j < t.length; j++) {
        for (let k = j + 1; k < t.length; k++) {
          if (t[j][cle] / t[i][cle] >= rmin && t[k][cle] / t[j][cle] >= rmin && t[k][cle] <= 1000) possibles.push([t[i], t[j], t[k]]);
        }
      }
    }
    return possibles.length ? choisir(possibles).map((p) => objetPhotoMV(p, cle)) : null;
  }

  function paireChoses(rmin, rmax, minVal = 0) {
    const possibles = [];
    for (let i = 0; i < CHOSES.length; i++) {
      for (let j = i + 1; j < CHOSES.length; j++) {
        const r = Math.max(CHOSES[i].val, CHOSES[j].val) / Math.min(CHOSES[i].val, CHOSES[j].val);
        const assez = Math.min(CHOSES[i].val, CHOSES[j].val) >= minVal && Math.max(CHOSES[i].val, CHOSES[j].val) <= 1000;
        if (r >= rmin && r <= rmax && (!minVal || assez)) possibles.push([CHOSES[i], CHOSES[j]]);
      }
    }
    return choisir(possibles).map(objetChose);
  }

  // Trois objets pour les はかり : au moins 20 g (sinon l'aiguille ne bouge presque pas), au plus 1 kg.
  function trioChoses(rmin) {
    const t = CHOSES.filter((c) => c.val >= 20 && c.val <= 1000).sort((a, b) => a.val - b.val);
    const possibles = [];
    for (let i = 0; i < t.length; i++) {
      for (let j = i + 1; j < t.length; j++) {
        for (let k = j + 1; k < t.length; k++) {
          if (t[j].val / t[i].val >= rmin && t[k].val / t[j].val >= rmin) possibles.push([t[i], t[j], t[k]]);
        }
      }
    }
    return choisir(possibles).map(objetChose);
  }

  // Des nombres seuls (g ou mL). Quelques pièges : chiffres inversés (350 / 530), 2 chiffres contre 3 (90 / 120).
  function paireNombresMV(theme, i, derniere) {
    const genre = derniere || i === 0 ? 'facile' : choisir(['facile', 'proche', 'proche', 'piege']);
    let a;
    let b;
    if (genre === 'facile') {
      a = entier(1, 4) * 50;
      b = a + entier(4, 10) * 50;
    } else if (genre === 'proche') {
      a = entier(10, 85) * 10;
      b = a + entier(2, 6) * 10;
    } else if (Math.random() < 0.6) {
      const c = entier(1, 7);
      const d = entier(c + 1, 9);
      a = c * 100 + d * 10;
      b = d * 100 + c * 10;
    } else {
      a = entier(6, 9) * 10;
      b = entier(10, 15) * 10;
    }
    const u = uniteDe(theme);
    return [valeurU(a, u), valeurU(b, u)];
  }

  // kg contre g, ou L contre mL : 1 kg contre 800 g (800 est plus grand que 1, mais 1 kg est plus lourd).
  function paireUnitesMV(theme, derniere) {
    const [grande, petite] = theme === 'omosa' ? ['kg', 'g'] : ['l', 'ml'];
    const k = derniere ? 1 : choisir([1, 1, 2, 2, 3]);
    const grandePlus = derniere || Math.random() < 0.5;
    const p = grandePlus ? entier(derniere ? 2 : 4, k * 10 - 1) * 100 : entier(k * 10 + 1, k * 10 + 9) * 100;
    return [valeurU(k, grande), valeurU(p, petite)];
  }

  // Verres identiques (300 mL) : des quantités bien différentes au début, puis plus proches.
  function quantitesVerres(n, facile) {
    const ecartMin = facile ? 90 : 30;
    for (let essai = 0; essai < 300; essai++) {
      const t = Array.from({ length: n }, () => entier(3, 27) * 10);
      const tri = [...t].sort((x, y) => x - y);
      const espaces = tri.every((v, k) => k === 0 || v - tri[k - 1] >= ecartMin);
      const proches = facile || tri[n - 1] - tri[0] <= (n === 2 ? 60 : 160);
      if (espaces && proches) return t;
    }
    return n === 2 ? [80, 240] : [60, 150, 250];
  }

  // Deux récipients de formes différentes. Souvent un piège : le liquide monte plus haut dans le
  // récipient étroit, mais il y en a moins.
  function paireContenants(facile) {
    const piege = !facile && Math.random() < 0.65;
    for (let essai = 0; essai < 600; essai++) {
      const A = CONTENANTS[choisir(['bin', 'kappu'])];
      const B = CONTENANTS[choisir(['boru', 'nabe'])];
      const ma = entier(2, Math.floor((capacite(A) * 0.88) / 50)) * 50;
      const mb = entier(2, Math.floor((capacite(B) * 0.88) / 50)) * 50;
      const hA = (ma / capacite(A)) * A.h;
      const hB = (mb / capacite(B)) * B.h;
      const r = Math.max(ma, mb) / Math.min(ma, mb);
      const coherent = (ma > mb && hA > hB * 1.2) || (mb > ma && hB > hA * 1.2);
      const ok = piege ? hA > hB * 1.4 && mb >= ma * 1.3 : coherent && r >= (facile ? 1.6 : 1.25);
      if (ok) return { objets: [{ c: A, val: ma }, { c: B, val: mb }], piege };
    }
    return { objets: [{ c: CONTENANTS.bin, val: 250 }, { c: CONTENANTS.boru, val: 500 }], piege: true };
  }

  const sensMV = (forcePlus) => (!reglages.court || forcePlus ? 'plus' : choisir(['plus', 'moins']));

  function genererQuestionMV(niveau, derniere, i, n) {
    const base = { niveau, essais: new Set(), resolu: false, indices: false };
    const facile = derniere || i < Math.ceil(n / 2);
    const avecBonne = (q, objets) => ({ ...q, bonne: q.demande === 'plus' ? idxMaxV(objets) : idxMinV(objets) });

    if (niveau === 13) {
      const photosOk = utiliserPhotosAvec('g') && pairePhotosAvec('g', facile ? 2.5 : 1.3, 9999);
      const objets = melanger(photosOk || paireChoses(facile ? 3 : 1.4, facile ? 9999 : 3));
      return avecBonne({ ...base, theme: 'omosa', type: 'balance', objets, demande: sensMV(i === 0 || derniere) }, objets);
    }
    if (niveau === 14) {
      // Le plus souvent un piège ; la dernière question est évidente (finir sur une réussite).
      const piege = !derniere && Math.random() < 0.7;
      const [gros, petit] = choisir(piege ? PIEGES : EVIDENTS);
      const objets = melanger([objetChose(chose(gros)), objetChose(chose(petit))]);
      return avecBonne({ ...base, theme: 'omosa', type: 'devine', etape: 'devine', simple: true, max: 1000, piege, objets, demande: sensMV(i === 0 || derniere) }, objets);
    }
    if (niveau === 25) {
      const photosOk = utiliserPhotosAvec('g') && pairePhotosAvec('g', facile ? 2.5 : 1.6, 9999);
      const objets = melanger(photosOk || paireChoses(facile ? 3 : 1.6, 9999, 20));
      return avecBonne({ ...base, theme: 'omosa', type: 'hakari', simple: true, objets, max: 1000, demande: sensMV(i === 0 || derniere) }, objets);
    }
    if (niveau === 29) {
      // D'abord des centaines (100, 200…), puis des 50, puis des dizaines ; la dernière est facile.
      const tiers = Math.ceil(n / 3);
      const pas = derniere || i < tiers ? 100 : i < 2 * tiers ? 50 : 10;
      const possibles = CHOSES.filter((c) => {
        const v = Math.round(c.val / pas) * pas;
        // Le nombre lu reste proche du vrai poids (à 15 % près) : un œuf ne pèse pas 100 g.
        return v >= pas && v <= 500 && (pas === 100 || v % 100 !== 0) && Math.abs(v - c.val) <= c.val * 0.15;
      });
      const c = choisir(possibles);
      const v = Math.round(c.val / pas) * pas;
      return { ...base, theme: 'omosa', type: 'lecture', objets: [objetChose(c)], valeur: v, options: choixLecture(v), bonne: v, pas, max: 500, demande: 'plus' };
    }
    if (niveau === 15) {
      const objets = melanger((utiliserPhotosAvec('g') && trioPhotosAvec('g', derniere ? 1.5 : 1.2)) || trioChoses(derniere ? 1.5 : 1.25));
      return avecBonne({ ...base, theme: 'omosa', type: 'hakari', objets, max: 1000, demande: sensMV(derniere) }, objets);
    }
    if (niveau === 16 || niveau === 17 || niveau === 22 || niveau === 23) {
      const theme = niveau <= 17 ? 'omosa' : 'kasa';
      const mixte = niveau === 17 || niveau === 23;
      const valeurs = melanger(mixte ? paireUnitesMV(theme, derniere) : paireNombresMV(theme, i, derniere));
      const max = Math.max(...valeurs.map((v) => v.val));
      // La contenance du verre doseur (ou de la はかり) proche du plus grand nombre : 130 et 180 → 200 mL.
      const paliers = theme === 'omosa' ? [500, 1000, 2000, 3000, 4000, 5000] : [200, 300, 500, 1000, 2000, 3000, 4000];
      return avecBonne({
        ...base, theme, type: 'mesures', mixte, valeurs, objets: valeurs,
        max: paliers.find((p) => p >= max) || 5000,
        demande: sensMV(derniere), aide: 0, aideMax: mixte ? 2 : 1,
      }, valeurs);
    }
    if (niveau === 19 || niveau === 20) {
      const nb = niveau === 19 ? 2 : 3;
      const quantites = quantitesVerres(nb, niveau === 19 ? facile : derniere);
      const boissons = melanger([...BOISSONS]).slice(0, nb);
      const objets = quantites.map((val, k) => ({ ...boissons[k], val }));
      return avecBonne({ ...base, theme: 'kasa', type: 'verres', objets, cap: 300, demande: sensMV(niveau === 19 && (i === 0 || derniere)) }, objets);
    }
    // 21 : verser dans des verres identiques pour comparer des récipients différents.
    const photosOk = utiliserPhotosAvec('ml') && pairePhotosAvec('ml', facile ? 1.6 : 1.2, 9999);
    let objets;
    let piege = false;
    if (photosOk) {
      objets = photosOk.map((o) => ({ ...o, couleur: 'var(--eau)' }));
    } else {
      const p = paireContenants(facile);
      piege = p.piege;
      const boissons = melanger([...BOISSONS]).slice(0, 2);
      objets = melanger(p.objets.map((o, k) => ({ yomi: o.c.yomi, kanji: o.c.kanji || null, contenant: o.c, val: o.val, couleur: boissons[k].couleur })));
    }
    const maxV = Math.max(...objets.map((o) => o.val));
    return avecBonne({
      ...base, theme: 'kasa', type: 'transvaser', etape: 'avant', piege, objets,
      cap: [300, 500, 1000, 2000].find((c) => c >= maxV) || maxV, demande: sensMV(derniere),
    }, objets);
  }

  /* ----- Phrases, règles et explications ----- */

  const POSITIONS_MV = { 2: ['ひだり', 'みぎ'], 3: ['ひだり', 'まんなか', 'みぎ'] };

  function referenceMV(q, i) {
    const t = q.objets;
    const nomsDistincts = new Set(t.map((o) => o.yomi)).size === t.length;
    if (q.type !== 'mesures' && reglages.noms && nomsDistincts && t[i].yomi) return nomDe(t[i]);
    if (q.type === 'mesures') return segValeur(t[i]);
    return (POSITIONS_MV[t.length] || [])[i] || 'これ';
  }

  function regleMV(theme, sens, superlatif) {
    const mot = motDe(theme, sens);
    const taille = sens === 'plus' ? [OOKI, 'きい'] : [CHIISA, 'さい'];
    return superlatif
      ? [ICHIBAN, ' ', ...mot, 'のは ', SUJI, 'が ', ICHIBAN, ' ', ...taille, ' ほう。 ']
      : [...mot, 'のは ', SUJI, 'が ', ...taille, ' ほう。 '];
  }

  const regleBalance = (sens) => (sens === 'plus'
    ? [SAGA, 'がった ほうが ', OMO, 'い。 ']
    : [AGA, 'がった ほうが ', KARU, 'い。 ']);

  const regleVerres = (sens) => (sens === 'plus'
    ? [ONAJI, 'じ コップなら、 たかい ほうが ', OO_I, 'い。 ']
    : [ONAJI, 'じ コップなら、 ひくい ほうが ', SUKU, 'ない。 ']);

  function consigneMV(q) {
    if (q.theme === 'kazu') return consigneKazu(q);
    if (q.type === 'lecture') return [nomDe(q.objets[0]), 'の ', OMO, 'さは ', segU('なん', 'g'), '？'];
    const mot = motDe(q.theme, q.demande);
    if (q.type === 'devine' && q.etape === 'devine') return ['どっちが ', ...mot, 'と おもう？'];
    if (q.objets.length === 3) return [ICHIBAN, ' ', ...mot, 'のは どれ？'];
    return ['どっちが ', ...mot, '？'];
  }

  function rappelMV(q) {
    if (q.theme === 'kazu') return rappelKazu(q);
    if (q.type === 'lecture') {
      if (q.pas === 100) return [SUJI, 'の めもりは ', segU(100, 'g'), ' ずつ'];
      return ['ちいさい めもり 1つ ＝ ', segU(10, 'g')];
    }
    const mot = motDe(q.theme, q.demande);
    const taille = q.demande === 'plus' ? [OOKI, 'きい'] : [CHIISA, 'さい'];
    if (q.type === 'balance') {
      return q.demande === 'plus' ? [SAGA, 'がった ほう ＝ ', OMO, 'い'] : [AGA, 'がった ほう ＝ ', KARU, 'い'];
    }
    if ((q.type === 'hakari' && q.simple) || q.type === 'devine') {
      return q.demande === 'plus' ? ['はりが たくさん まわった ほう ＝ ', OMO, 'い'] : ['はりが すこし まわった ほう ＝ ', KARU, 'い'];
    }
    if (q.objets.length === 3) return [ICHIBAN, ' ', ...mot, ' ＝ ', SUJI, 'が ', ICHIBAN, ' ', ...taille];
    const unite = q.mixte ? [ONAJI, 'じ たんいなら '] : [];
    return [...unite, ...mot, ' ＝ ', SUJI, 'が ', ...taille];
  }

  function explicationMV(q) {
    if (q.theme === 'kazu') return explicationKazu(q);
    if (q.type === 'lecture') return [...lectureHakari(q.valeur), ' この ', nomDe(q.objets[0]), 'は ', segU(q.valeur, 'g'), '。'];
    const mot = motDe(q.theme, q.demande);
    const u = uniteDe(q.theme);
    const t = q.objets;
    if (q.type === 'mesures') {
      const [a, b] = q.valeurs;
      const fin = [...regleMV(q.theme, q.demande), segValeur(q.valeurs[q.bonne]), 'の ほうが ', segU(Math.abs(a.val - b.val), u), ' ', ...mot, 'ね。'];
      if (!q.mixte) return fin;
      // On ne compare les nombres qu'une fois dans la même unité.
      const g = q.valeurs.find((v) => v.grande);
      const p = q.valeurs.find((v) => !v.grande);
      return [segValeur(g), 'は ', segU(g.val, u), '。 ', segU(g.val, u), 'と ', segU(p.val, u), '。 ', ...fin];
    }
    const mesures = [];
    // « この りんご » : toutes les pommes n'ont pas le même poids.
    const cette = (k) => (q.theme === 'omosa' && !Object.values(POSITIONS_MV).flat().includes(referenceMV(q, k)) ? 'この ' : '');
    t.forEach((o, k) => mesures.push(cette(k), referenceMV(q, k), 'は ', segU(o.val, u), k < t.length - 1 ? '、 ' : '。 '));
    if (t.length === 3) {
      const aiguille = q.demande === 'plus'
        ? ['はりが ', ICHIBAN, ' すすんだ ものが ', ICHIBAN, ' ', OMO, 'い。 ']
        : ['はりが ', ICHIBAN, ' すすまない ものが ', ICHIBAN, ' ', KARU, 'い。 '];
      const debut = q.type === 'hakari' ? aiguille : regleVerres(q.demande);
      return [...debut, ...mesures, ...regleMV(q.theme, q.demande, true), referenceMV(q, q.bonne), 'だね。'];
    }
    const lourd = idxMaxV(t);
    const leger = 1 - lourd;
    if (q.type === 'hakari' || q.type === 'devine') {
      const piege = q.type === 'devine' && q.piege ? [referenceMV(q, leger), 'は ', OOKI, 'きい けど ', KARU, 'いね。 '] : [];
      return q.demande === 'plus'
        ? ['はりが たくさん まわった ほうが ', OMO, 'い。 ', referenceMV(q, lourd), 'の はりの ほうが たくさん まわったね。 ', ...piege, 'だから ', referenceMV(q, q.bonne), 'の ほうが ', OMO, 'い。']
        : ['はりが すこししか まわらない ほうが ', KARU, 'い。 ', referenceMV(q, leger), 'の はりは すこししか まわって いないね。 ', ...piege, 'だから ', referenceMV(q, q.bonne), 'の ほうが ', KARU, 'い。'];
    }
    let debut = [];
    if (q.type === 'balance' || q.type === 'devine') {
      debut = ['てんびんは ', referenceMV(q, lourd), 'の ほうに ', SAGA, 'がったね。 ', ...regleBalance(q.demande)];
      if (q.type === 'devine' && q.piege) {
        debut.push(referenceMV(q, leger), 'は ', OOKI, 'きい けど ', KARU, 'いね。 ');
      }
    } else if (q.type === 'verres') {
      debut = regleVerres(q.demande);
    } else if (q.type === 'transvaser') {
      debut = [ONAJI, 'じ コップに うつすと、 ', referenceMV(q, lourd), 'の ほうが たかいね。 '];
      if (q.piege) debut.push(referenceMV(q, leger), 'は たかく ', MI, 'えた けど、 ', SUKU, 'なかったね。 ');
    }
    const ecart = Math.abs(t[0].val - t[1].val);
    return [...debut, ...mesures, ...regleMV(q.theme, q.demande), referenceMV(q, q.bonne), 'の ほうが ', segU(ecart, u), ' ', ...mot, 'ね。'];
  }

  function messageErreurMV(q) {
    if (q.theme === 'kazu') return messageErreurKazu(q);
    if (q.type === 'devine') {
      const regle = q.demande === 'plus'
        ? ['はりが たくさん まわった ほうが ', OMO, 'い。']
        : ['はりが すこししか まわらない ほうが ', KARU, 'い。'];
      return q.essais.size <= 1 ? ['おしい！ はかりで たしかめよう。 ', ...regle] : ['おしい！ ', ...regle];
    }
    if (q.type === 'balance') return ['おしい！ ', ...regleBalance(q.demande)];
    if (q.type === 'hakari') return ['おしい！ はりを よく ', MI, 'てね。'];
    if (q.type === 'lecture') return ['おしい！ はりの さきを よく ', MI, 'てね。 ', OOKI, 'きい めもりから かぞえよう。'];
    if (q.type === 'transvaser' && q.versePourErreur) {
      q.versePourErreur = false;
      return ['おしい！ ', ONAJI, 'じ コップに うつして くらべよう。 うつしても かさは かわらないよ。'];
    }
    return ['おしい！ たかさを よく ', MI, 'てね。'];
  }

  /* ----- Dessins : objets, balance, はかり, verres et récipients ----- */

  let cibles = [];   // ce que l'élève touche pour répondre (plateaux, はかり, verres…) : { el, index }

  function cible(el, index, label) {
    const q = courante();
    el.setAttribute('aria-label', label);
    if (q.resolu && index === q.bonne) el.classList.add('juste');
    if (q.essais.has(index)) el.classList.add('essaye');
    activable(el, () => repondre(index));
    cibles.push({ el, index });
  }

  function creerChose(o, px) {
    const el = document.createElement('span');
    el.className = 'chose';
    if (o.type === 'photo') {
      const p = photos.find((x) => x.id === o.id);
      const img = document.createElement('img');
      img.alt = '';
      img.draggable = false;
      if (p) img.src = urlPhoto(p);
      const r = o.w / o.h;
      img.style.height = `${Math.round(Math.min(px * 1.2, (px * 1.8) / r))}px`;
      el.append(img);
    } else {
      el.textContent = o.emoji;
      el.style.fontSize = `${Math.round(px * (o.taille || 1))}px`;
    }
    return el;
  }

  function etiquetteMesure(x, u) {
    const pill = document.createElement('span');
    pill.className = 'mesure-mv';
    if (u) pill.innerHTML = nombreUnite(x, u);
    else pill.textContent = x;
    return pill;
  }

  const ANGLE_MAX = 14;

  // Inclinaison du fléau (degrés, positif : le plateau de droite descend). Dans les questions, une
  // vraie balance penche franchement ; en べんきょう, elle penche un peu moins quand on approche.
  function angleBalance(gauche, droite, progressif) {
    const d = droite - gauche;
    if (!d) return 0;
    if (!progressif) return Math.sign(d) * ANGLE_MAX;
    const r = Math.abs(d) / Math.max(gauche, droite);
    return Math.sign(d) * Math.max(2.5, Math.min(ANGLE_MAX, ANGLE_MAX * r * 2.5));
  }

  // Balance à plateaux (上皿てんびん) : un fléau sur un pied, une aiguille au centre.
  function creerBalance(W, H, { interactif = false, noms = true, large = false } = {}) {
    const Wb = Math.max(220, Math.min(W, 820));
    const Lb = Wb * (large ? 0.54 : 0.62);
    const Pw = Math.min(Wb * (large ? 0.44 : 0.36), 270);
    const amp = (Lb / 2) * Math.sin((ANGLE_MAX * Math.PI) / 180);
    const hNom = noms ? 34 : 0;
    const hPied = Math.max(34, Math.min(90, H * 0.17));
    const hCharge = Math.max(50, H - (24 + amp + hPied + 14 + hNom));
    const yPivot = hCharge + 24 + amp;
    // Objet le plus gros : 1,5 × taille, ×1,12 de hauteur de ligne, plus l'étiquette « 300 g » au-dessus.
    const taille = Math.max(18, Math.min((hCharge - 34) / (1.5 * 1.12), Pw * 0.45));
    const b = document.createElement('div');
    b.className = 'balance';
    b.style.width = `${Wb}px`;
    b.style.height = `${yPivot + hPied + 14 + hNom}px`;
    b.innerHTML = `<span class="balance-socle" style="left:${Wb / 2 - Wb * 0.17}px;top:${yPivot + hPied}px;width:${Wb * 0.34}px"></span>`
      + `<span class="balance-pilier" style="left:${Wb / 2 - 8}px;top:${yPivot}px;height:${hPied}px"></span>`
      + `<span class="balance-cadran" style="left:${Wb / 2 - 30}px;top:${yPivot + hPied * 0.74 - 6}px"></span>`
      + `<span class="balance-aiguille" style="left:${Wb / 2 - 2}px;top:${yPivot}px;height:${hPied * 0.8}px"></span>`
      + `<span class="balance-fleau" style="left:${Wb / 2 - Lb / 2}px;top:${yPivot - 6}px;width:${Lb}px"></span>`
      + `<span class="balance-pivot" style="left:${Wb / 2 - 9}px;top:${yPivot - 9}px"></span>`;
    const plateaux = [0, 1].map((k) => {
      const el = document.createElement(interactif ? 'button' : 'div');
      if (interactif) el.type = 'button';
      el.className = `plateau ${k ? 'droite' : 'gauche'}`;
      const x = Wb / 2 + (k ? 1 : -1) * (Lb / 2);
      el.style.left = `${x - Pw / 2}px`;
      el.style.top = `${yPivot - 24 - hCharge}px`;
      el.style.width = `${Pw}px`;
      el.style.height = `${hCharge + 24}px`;
      el.innerHTML = '<span class="plateau-charge"></span><span class="plateau-assiette"></span><span class="plateau-tige"></span>';
      b.append(el);
      return { el, charge: el.querySelector('.plateau-charge') };
    });
    const etiquettes = [0, 1].map((k) => {
      const n = document.createElement('span');
      n.className = 'balance-nom';
      const x = Wb / 2 + (k ? 1 : -1) * (Lb / 2);
      n.style.left = `${x - Pw / 2}px`;
      n.style.width = `${Pw}px`;
      n.style.top = `${yPivot + hPied + 18}px`;
      n.hidden = !noms;
      b.append(n);
      return n;
    });
    b.geo = { Wb, Lb, Pw, hCharge, taille };
    b.plateaux = plateaux;
    b.noms = etiquettes;
    return b;
  }

  function incliner(b, angle) {
    const dy = (b.geo.Lb / 2) * Math.sin((angle * Math.PI) / 180);
    b.querySelector('.balance-fleau').style.transform = `rotate(${angle}deg)`;
    b.querySelector('.balance-aiguille').style.transform = `rotate(${angle}deg)`;
    b.plateaux[0].el.style.transform = `translateY(${-dy}px)`;
    b.plateaux[1].el.style.transform = `translateY(${dy}px)`;
  }

  // La balance part à plat puis penche : l'élève voit le mouvement (une seule fois par question).
  function poserBalance(b, angle, q) {
    if (q.vuBalance || animationsReduites()) {
      incliner(b, angle);
      q.vuBalance = true;
      return;
    }
    q.vuBalance = true;
    incliner(b, 0);
    setTimeout(() => {
      b.classList.add('anime');
      incliner(b, angle);
      if (angle) setTimeout(() => note(150, { duree: 0.18, volume: 0.12, type: 'triangle' }), 650);
    }, 450);
  }

  // Cadran d'une はかり de cuisine : 0 en haut, l'aiguille tourne dans le sens des aiguilles d'une montre.
  // « etiquette » : un nombre tous les … g ; « trait » : un trait tous les … g ; sans nombres pour débuter.
  // Le secteur coloré montre de combien l'aiguille a tourné (preuve de « はりで くらべる »).
  function svgCadran(max, { etiquette = max / 4, trait = max / 20, nombres = true } = {}) {
    const arc = 300;
    const n = Math.round(max / trait);
    const parGrand = Math.round(etiquette / trait);
    let traits = '';
    for (let k = 0; k <= n; k++) {
      const a = ((k / n) * arc * Math.PI) / 180;
      const grand = k % parGrand === 0;
      const moyen = !grand && parGrand >= 10 && k % (parGrand / 2) === 0;
      const r2 = grand ? 35 : moyen ? 37.5 : 40;
      const [s, c] = [Math.sin(a), Math.cos(a)];
      traits += `<line x1="${(s * 44).toFixed(1)}" y1="${(-c * 44).toFixed(1)}" x2="${(s * r2).toFixed(1)}" y2="${(-c * r2).toFixed(1)}"${grand ? ' class="g"' : ''}/>`;
      if (grand && nombres) traits += `<text x="${(s * 25).toFixed(1)}" y="${(-c * 25 + 3.4).toFixed(1)}">${Math.round((max * k) / n)}</text>`;
    }
    return `<svg class="cadran" viewBox="-50 -50 100 100" aria-hidden="true"><circle class="face" r="48"/>`
      + '<circle class="secteur" r="20" pathLength="360" transform="rotate(-90)"/>'
      + `${traits}${nombres ? '<text class="unite" y="17">g</text>' : ''}`
      + '<g class="aiguille-hakari"><line x1="0" y1="8" x2="0" y2="-40"/><circle r="4.5"/></g></svg>';
  }

  function tournerAiguille(svg, val, max) {
    const angle = (Math.min(val, max) / max) * 300;
    svg.querySelector('.aiguille-hakari').style.transform = `rotate(${angle}deg)`;
    svg.querySelector('.secteur').style.strokeDasharray = `${angle} 360`;
  }

  function creerHakari(D, max, options) {
    const corps = document.createElement('span');
    corps.className = 'hakari-corps';
    corps.style.width = `${D * 1.12}px`;
    corps.style.height = `${D * 1.08}px`;
    corps.innerHTML = svgCadran(max, options);
    corps.querySelector('svg').style.width = `${D}px`;
    return corps;
  }

  function creerVerre(w, h, ml, cap, couleur) {
    const v = document.createElement('span');
    v.className = 'verre';
    v.style.width = `${w}px`;
    v.style.height = `${h}px`;
    const l = document.createElement('span');
    l.className = 'liquide';
    l.style.setProperty('--c', couleur);
    l.style.height = `${Math.min(100, (ml / cap) * 100)}%`;
    v.append(l);
    return v;
  }

  // Pas des graduations : un nombre tous les « etiquette » mL, un trait tous les « trait » mL.
  function pasGraduation(max, hauteur) {
    const etiquette = [10, 20, 50, 100, 200, 250, 500, 1000].find((p) => (p / max) * hauteur >= 34) || 1000;
    const trait = [10, 20, 50, 100, 200, 250].find((p) => (p / max) * hauteur >= 7 && etiquette % p === 0) || etiquette;
    return { etiquette, trait };
  }

  // Verre doseur : le verre « cap » mL de haut, des graduations jusqu'à « max ».
  function creerVerreGradue(w, h, ml, cap, max, couleur) {
    const v = creerVerre(w, h, ml, cap, couleur);
    v.classList.add('gradue');
    const interieur = h - 4;
    const { etiquette, trait } = pasGraduation(cap, interieur);
    let html2 = '';
    for (let x = trait; x <= max; x += trait) {
      const y = (x / cap) * 100;
      const grand = x % etiquette === 0;
      html2 += `<span class="trait${grand ? ' grand' : ''}" style="bottom:${y}%"></span>`;
      if (grand) html2 += `<span class="graduation" style="bottom:${y}%">${x}</span>`;
    }
    const g = document.createElement('span');
    g.className = 'graduations';
    g.innerHTML = `${html2}<span class="graduation unite-ml" style="bottom:100%">mL</span>`;
    v.append(g);
    return v;
  }

  function creerContenant(o, S) {
    const el = document.createElement('span');
    if (!o.contenant) {
      el.className = 'contenant photo';
      el.append(creerChose(o, S * 0.7));
      return el;
    }
    const c = o.contenant;
    el.className = `contenant forme-${c.forme}`;
    el.style.width = `${c.w * S}px`;
    el.style.height = `${c.h * S}px`;
    const l = document.createElement('span');
    l.className = 'liquide';
    l.style.setProperty('--c', o.couleur);
    l.style.height = `${(o.val / capacite(c)) * 100}%`;
    el.append(l);
    return el;
  }

  function nomMV(o) {
    const n = document.createElement('span');
    n.className = 'nom-mv';
    n.innerHTML = html([nomDe(o)]);
    n.hidden = !reglages.noms;
    return n;
  }

  /* ----- Rendu des questions おもさ / かさ ----- */

  const estMV = (q) => Boolean(q && q.theme && q.theme !== 'nagasa');

  function rendreMV(q, etabli) {
    etabli.classList.add('scene-mv');
    // Place réelle (les marges de l'établi changent avec l'écran : paysage, téléphone…).
    const style = getComputedStyle(etabli);
    const W = etabli.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const H = etabli.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const scene = document.createElement('div');
    scene.className = 'scene';
    etabli.append(scene);
    if (q.theme === 'kazu') rendreKazuQ(q, scene, W, H);
    else if (q.type === 'devine' && q.etape === 'devine') rendreDevine(q, scene, W, H);
    else if (q.type === 'balance') rendreBalanceQ(q, scene, W, H);
    else if (q.type === 'hakari' || q.type === 'devine') rendreHakariQ(q, scene, W, H);
    else if (q.type === 'lecture') rendreLectureQ(q, scene, W, H);
    else if (q.type === 'verres') rendreVerresQ(q, scene, W, H, q.objets.map((o) => o));
    else if (q.type === 'transvaser') rendreTransvaserQ(q, scene, W, H);
    else rendreMesuresQ(q, scene, W, H);
  }

  function rendreBalanceQ(q, scene, W, H) {
    const b = creerBalance(W, H, { interactif: true, noms: reglages.noms });
    q.objets.forEach((o, k) => {
      const { el, charge } = b.plateaux[k];
      if (q.preuve) charge.append(etiquetteMesure(o.val, 'g'));
      charge.append(creerChose(o, b.geo.taille));
      b.noms[k].innerHTML = html([nomDe(o)]);
      cible(el, k, `${POSITIONS_MV[2][k]} ${o.yomi}`);
    });
    scene.append(b);
    poserBalance(b, angleBalance(q.objets[0].val, q.objets[1].val), q);
  }

  function rendreLectureQ(q, scene, W, H) {
    const col = document.createElement('div');
    col.className = 'hakari hakari-lecture';
    const hCharge = Math.max(50, Math.min(140, H * 0.3));
    const D = Math.max(90, Math.min(H - hCharge - 24, W * 0.6, 300));
    const charge = document.createElement('span');
    charge.className = 'hakari-charge';
    charge.style.height = `${hCharge}px`;
    if (q.preuve) charge.append(etiquetteMesure(q.valeur, 'g'));
    charge.append(creerChose(q.objets[0], Math.max(24, Math.min((hCharge - 34) / 1.6, 80))));
    const plateau = document.createElement('span');
    plateau.className = 'hakari-plateau';
    plateau.style.width = `${D * 1.05}px`;
    const corps = creerHakari(D, q.max, { etiquette: 100, trait: 10 });
    const svg = corps.querySelector('svg');
    if (q.preuve) svg.classList.add('avec-secteur');
    col.append(charge, plateau, corps);
    scene.append(col);
    if (q.vuAiguilles || animationsReduites()) tournerAiguille(svg, q.valeur, q.max);
    else setTimeout(() => { scene.classList.add('anime'); tournerAiguille(svg, q.valeur, q.max); }, 400);
    q.vuAiguilles = true;
    // Les trois réponses, en grands boutons sous l'établi.
    const choix = $('choix-mots');
    choix.hidden = false;
    choix.replaceChildren();
    q.options.forEach((v) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.innerHTML = nombreUnite(v, 'g');
      cible(b, v, `${v}グラム`);
      choix.append(b);
    });
  }

  // « みためと ちがう » : d'abord deviner, objets posés sur la table, à leur grosseur.
  function rendreDevine(q, scene, W, H) {
    const table = document.createElement('div');
    table.className = 'table-devine';
    const px = Math.max(24, Math.min((H - 60) / 1.5, W * 0.22));
    q.objets.forEach((o, k) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'devine-objet';
      const planche = document.createElement('span');
      planche.className = 'planche';
      planche.append(creerChose(o, px));
      el.append(planche, nomMV(o));
      cible(el, k, o.yomi);
      table.append(el);
    });
    scene.append(table);
  }

  function rendreHakariQ(q, scene, W, H) {
    const n = q.objets.length;
    const colW = Math.min(260, (W - 14 * (n - 1)) / n);
    // Écran très bas (téléphone, explication affichée) : on garde la place pour l'objet plutôt que pour son nom.
    const avecNoms = reglages.noms && H >= 220;
    const hNom = avecNoms ? 30 : 0;
    const D = Math.max(40, Math.min(colW * 0.86, H * 0.4, 190));
    const hCharge = Math.max(30, H - D * 1.08 - 10 - hNom - 20);
    const px = Math.max(14, Math.min((hCharge - 34) / (1.5 * 1.12), colW * 0.5));
    const rangee = document.createElement('div');
    rangee.className = 'rangee-mv';
    rangee.classList.toggle('sans-noms-mv', !avecNoms);
    const cadrans = [];
    q.objets.forEach((o, k) => {
      const col = document.createElement('button');
      col.type = 'button';
      col.className = 'hakari';
      col.style.width = `${colW}px`;
      const charge = document.createElement('span');
      charge.className = 'hakari-charge';
      charge.style.height = `${hCharge}px`;
      if (q.preuve && !q.simple) charge.append(etiquetteMesure(o.val, 'g'));
      charge.append(creerChose(o, px));
      const plateau = document.createElement('span');
      plateau.className = 'hakari-plateau';
      plateau.style.width = `${D * 1.02}px`;
      // Pour débuter : pas de nombres, on compare seulement de combien l'aiguille a tourné.
      const corps = creerHakari(D, q.max, { nombres: !q.simple });
      if (q.simple && q.preuve) corps.querySelector('svg').classList.add('avec-secteur');
      cadrans.push(corps.querySelector('svg'));
      col.append(charge, plateau, corps, nomMV(o));
      cible(col, k, `${k + 1}ばんめ ${o.yomi}`);
      rangee.append(col);
    });
    scene.append(rangee);
    const poser = () => cadrans.forEach((svg, k) => tournerAiguille(svg, q.objets[k].val, q.max));
    if (q.vuAiguilles || animationsReduites()) {
      poser();
    } else {
      setTimeout(() => { scene.classList.add('anime'); poser(); }, 400);
    }
    q.vuAiguilles = true;
  }

  // Verres identiques (aussi après avoir versé, activité 21). « avant » : petits récipients vides à côté.
  function rendreVerresQ(q, scene, W, H, objets, avant) {
    const n = objets.length;
    const colW = Math.min(250, (W - 16 * (n - 1)) / n);
    // Écran très bas (téléphone, explication affichée) : les verres d'abord, les noms ensuite.
    const avecNoms = reglages.noms && H >= 190;
    const hNom = avecNoms ? 30 : 0;
    // Après avoir versé : les verres un peu moins hauts, pour laisser la place au récipient penché au-dessus.
    const h = Math.max(48, Math.min(H - hNom - 64 - (avant ? 46 : 0), 330));
    // Verser : le récipient d'origine reste assez grand (environ 40 % de la colonne), à côté du verre.
    const wMini = avant ? colW * 0.42 : 0;
    const w = Math.max(36, Math.min((colW - wMini) * 0.75, h * 0.55, 150));
    const rangee = document.createElement('div');
    rangee.className = 'rangee-mv';
    rangee.classList.toggle('sans-noms-mv', !avecNoms);
    // L'animation (verser) dure 3,3 s ; si l'écran se redessine pendant ce temps (le texte qui apparaît
    // réduit la place sur téléphone), elle reprend là où elle en était (--decalage négatif).
    const maintenant = performance.now();
    if (!q.vuVerres) q.debutVerse = maintenant;
    const ecoule = maintenant - (q.debutVerse || 0);
    const verser = !animationsReduites() && ecoule < 3300;
    rangee.style.setProperty('--decalage', `${-Math.round(ecoule)}ms`);
    objets.forEach((o, k) => {
      const col = document.createElement('button');
      col.type = 'button';
      col.className = 'verre-col';
      col.style.width = `${colW}px`;
      const pill = etiquetteMesure(o.val, 'ml');
      pill.style.visibility = q.preuve ? 'visible' : 'hidden';
      const ligne = document.createElement('span');
      ligne.className = 'verre-ligne';
      let mini = null;
      let taille = 0;
      if (avant) {
        // Le récipient d'origine : il monte au-dessus du verre, se penche et se vide pendant que le verre
        // se remplit (la même quantité : « うつしても かさは かわらない »), puis se redresse, vide.
        const c = o.contenant || { w: 0.8, h: 0.8 };
        taille = Math.max(30, Math.min(wMini / c.w, (h * 0.7) / c.h, 160));
        mini = creerContenant(o, taille);
        mini.classList.add('mini');
        const liq = mini.querySelector('.liquide');
        if (liq) {
          liq.style.setProperty('--h0', liq.style.height);
          liq.style.height = '0%';
          if (verser) liq.classList.add('vide-anime');
        }
        ligne.append(mini);
      }
      const v = creerVerre(w, h, o.val, q.cap, o.couleur);
      if (verser) {
        v.querySelector('.liquide').classList.add('verse');
        if (mini) {
          // Le filet qui tombe dans le verre pendant qu'on verse.
          const filet = document.createElement('span');
          filet.className = 'filet';
          filet.style.setProperty('--c', o.couleur);
          v.append(filet);
          mini.classList.add('versement');
          const hMini = parseFloat(mini.style.height) || 40;
          // Il monte au-dessus du bord du verre, sans sortir du cadre (en tournant, son bord gauche remonte).
          const wMiniPx = parseFloat(mini.style.width) || 40;
          mini.style.setProperty('--monte', `${Math.max(0, Math.min(h - hMini + 14, h + 40 - hMini - wMiniPx * 0.88))}px`);
          mini.style.setProperty('--avance', `${Math.min(w * 0.35, 40)}px`);
          // Il part de sa taille d'avant (c'est le même récipient), puis rapetisse à côté du verre.
          mini.style.setProperty('--grand', String(Math.max(1, Math.min(1.5, (q.tailleAvant || taille) / taille))));
          mini.style.setProperty('--h', `${hMini}px`);
        }
      }
      ligne.append(v);
      col.append(pill, ligne, nomMV(o));
      cible(col, k, `${POSITIONS_MV[n]?.[k] || ''} ${o.yomi}`);
      rangee.append(col);
    });
    q.vuVerres = true;
    scene.append(rangee);
    if (q.preuve) preuveVerres(q, scene, objets);
  }

  // Preuve : un trait au niveau le plus bas, et la partie en plus dans le verre le plus rempli.
  function preuveVerres(q, scene, objets) {
    const verres = [...scene.querySelectorAll('.verre')];
    if (verres.length < 2) return;
    const base = scene.getBoundingClientRect();
    const niveaux = verres.map((v, k) => {
      const r = v.getBoundingClientRect();
      return { r, y: r.bottom - 4 - (objets[k].val / q.cap) * (r.height - 4) - base.top };
    });
    const bas = niveaux.reduce((m, x) => (x.y > m.y ? x : m));
    const trait = document.createElement('span');
    trait.className = 'niveau-ligne';
    trait.style.left = `${niveaux[0].r.left - base.left - 10}px`;
    trait.style.width = `${niveaux[niveaux.length - 1].r.right - niveaux[0].r.left + 20}px`;
    trait.style.top = `${bas.y}px`;
    scene.append(trait);
    if (objets.length === 2) {
      const haut = niveaux.reduce((m, x) => (x.y < m.y ? x : m));
      const ecart = Math.abs(objets[0].val - objets[1].val);
      dessinerEcart(scene, haut.r.left - base.left, haut.r.right - base.left, haut.y, bas.y - haut.y, ecart, `${ecart}\u00a0mL`);
      // Assez de place : l'écart s'écrit dans la bande (il ne cache pas l'étiquette du verre au-dessus).
      const bande = scene.querySelector('.ecart:last-of-type');
      if (bande && bas.y - haut.y >= 30) bande.classList.add('etiquette-dedans');
    }
  }

  function rendreTransvaserQ(q, scene, W, H) {
    if (q.etape === 'apres') {
      rendreVerresQ(q, scene, W, H, q.objets, true);
      return;
    }
    const hNom = reglages.noms ? 30 : 0;
    const formes = q.objets.map((o) => o.contenant || { w: 0.8, h: 0.8 });
    const S = Math.max(50, Math.min((H - hNom - 30) / Math.max(...formes.map((c) => c.h)), (W - 60) / formes.reduce((s, c) => s + c.w * 1.15, 0), 380));
    q.tailleAvant = S;   // pour que le récipient parte de cette taille quand on verse
    const rangee = document.createElement('div');
    rangee.className = 'rangee-mv';
    q.objets.forEach((o, k) => {
      const col = document.createElement('button');
      col.type = 'button';
      col.className = 'contenant-col';
      col.append(creerContenant(o, S), nomMV(o));
      cible(col, k, `${POSITIONS_MV[2][k]} ${o.yomi}`);
      rangee.append(col);
    });
    scene.append(rangee);
  }

  // Nombres seuls (g, kg, mL, L). L'aide convertit dans la même unité, puis montre はかり ou verres doseurs.
  function rendreMesuresQ(q, scene, W, H) {
    const jauges = q.aide >= q.aideMax;
    const u = uniteDe(q.theme);
    const colW = Math.min(330, (W - 20) / 2);
    const rangee = document.createElement('div');
    rangee.className = 'rangee-mv mesures';
    // Mêmes hauteurs de boutons, que la conversion (＝ 1000 g) soit affichée ou non : les jauges restent alignées.
    rangee.classList.toggle('avec-conversion', q.mixte && q.aide >= 1);
    const hJauge = Math.max(60, H - (q.mixte && q.aide >= 1 ? 112 : 84) - 28);
    const cadrans = [];
    q.valeurs.forEach((v, k) => {
      const col = document.createElement('div');
      col.className = 'mesure-col';
      col.style.width = `${colW}px`;
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'choix-valeur';
      bouton.innerHTML = `<span class="valeur-texte">${html([segValeur(v)])}</span>`;
      if (v.grande && q.aide >= 1) bouton.innerHTML += `<span class="conversion">＝ ${nombreUnite(v.val, u)}</span>`;
      cible(bouton, k, v.lecture);
      col.append(bouton);
      if (jauges) {
        if (q.theme === 'omosa') {
          const corps = creerHakari(Math.max(50, Math.min(colW * 0.62, hJauge / 1.1, 200)), q.max);
          cadrans.push([corps.querySelector('svg'), v.val]);
          col.append(corps);
        } else {
          const h = Math.max(60, Math.min(hJauge, 300));
          const verre = creerVerreGradue(Math.min(colW * 0.4, h * 0.6, 130), h, v.val, q.max * 1.1, q.max, 'var(--eau)');
          col.append(verre);
        }
      }
      rangee.append(col);
    });
    scene.append(rangee);
    cadrans.forEach(([svg, val]) => tournerAiguille(svg, val, q.max));
    if (q.preuve && q.theme === 'kasa' && jauges) preuveVerres({ cap: q.max * 1.1 }, scene, q.valeurs);
  }

  /* ======================================================================
     かず : compter et lire les nombres, toujours avec leur lecture en hiragana
     (programme « 数の学習 » : compter, associer chiffre et quantité, grouper par 10, les rangs).
     ====================================================================== */

  const YOMI_UN = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
  const YOMI_DIX = ['', 'じゅう', 'にじゅう', 'さんじゅう', 'よんじゅう', 'ごじゅう', 'ろくじゅう', 'ななじゅう', 'はちじゅう', 'きゅうじゅう'];
  const YOMI_CENT = ['', 'ひゃく', 'にひゃく', 'さんびゃく', 'よんひゃく', 'ごひゃく', 'ろっぴゃく', 'ななひゃく', 'はっぴゃく', 'きゅうひゃく'];
  const YOMI_MILLE = ['', 'せん', 'にせん', 'さんぜん', 'よんせん', 'ごせん', 'ろくせん', 'ななせん', 'はっせん', 'きゅうせん'];
  // Autres lectures qu'on entend aussi : 4 し, 7 しち, 9 く.
  const AUTRES_YOMI = { 4: 'し', 7: 'しち', 9: 'く' };

  // La lecture en hiragana : 23 → にじゅうさん, 235 → にひゃく さんじゅう ご, 1000 → せん.
  function yomiNombre(n) {
    if (n === 0) return 'ぜろ';
    const parties = [YOMI_MILLE[Math.floor(n / 1000) % 10], YOMI_CENT[Math.floor(n / 100) % 10],
      YOMI_DIX[Math.floor(n / 10) % 10], YOMI_UN[n % 10]].filter(Boolean);
    return parties.join(n >= 100 ? ' ' : '');
  }

  // Un nombre en chiffres, avec sa lecture en hiragana dessous.
  // Chaque chiffre souligné de la couleur de son groupe : centaines en violet (100の いた), dizaines en
  // bleu clair (10の まとまり), unités en orange (●), milliers en vert. Un indice pour lire et écrire les nombres.
  const PLACES = ['u', 'd', 'c', 'm'];
  const chiffresColores = (n) => {
    const t = String(n);
    return [...t].map((ch, i) => `<span class="place place-${PLACES[t.length - 1 - i] || 'm'}">${ch}</span>`).join('');
  };
  const nombreYomi = (n, places = false) => `<span class="nb"><span class="nb-chiffre">${places ? chiffresColores(n) : n}</span><span class="nb-yomi">${yomiNombre(n)}</span></span>`;

  /* ----- Les compteurs (助数詞) : en japonais, on ne compte pas tout avec 「いくつ」.
     Une chose se compte avec son compteur, et la question change avec lui (いぬは なんびき？).
     La lecture change aussi avec le nombre : いっぽん、 にほん、 さんぼん、 ろっぽん… ----- */
  const COMPTEURS = {
    'こ': {
      question: 'なんこ', variantes: ['こ', 'ご'], change: [1, 6, 8, 10],
      yomi: ['いっこ', 'にこ', 'さんこ', 'よんこ', 'ごこ', 'ろっこ', 'ななこ', 'はっこ', 'きゅうこ', 'じゅっこ'],
      regle: 'ちいさい ものは 「こ」で かぞえる。 りんごや ボール。', court: 'ちいさい もの ＝ こ', indice: 'ちいさい ものは 「こ」',
    },
    'ひき': {
      question: 'なんびき', variantes: ['ひき', 'びき', 'ぴき'], change: [1, 3, 6, 8, 10],
      yomi: ['いっぴき', 'にひき', 'さんびき', 'よんひき', 'ごひき', 'ろっぴき', 'ななひき', 'はっぴき', 'きゅうひき', 'じゅっぴき'],
      regle: 'ちいさい いきものは 「ひき」で かぞえる。 いぬや ねこ、 さかな。', court: 'いきもの ＝ ひき', indice: 'いきものは 「ひき」',
    },
    'ほん': {
      question: 'なんぼん', variantes: ['ほん', 'ぼん', 'ぽん'], change: [1, 3, 6, 8, 10],
      yomi: ['いっぽん', 'にほん', 'さんぼん', 'よんほん', 'ごほん', 'ろっぽん', 'ななほん', 'はっぽん', 'きゅうほん', 'じゅっぽん'],
      regle: 'ほそながい ものは 「ほん」で かぞえる。 えんぴつや かさ。', court: 'ほそながい もの ＝ ほん', indice: 'ほそながい ものは 「ほん」',
    },
    'まい': {
      question: 'なんまい', variantes: ['まい'], change: [],
      yomi: ['いちまい', 'にまい', 'さんまい', 'よんまい', 'ごまい', 'ろくまい', 'ななまい', 'はちまい', 'きゅうまい', 'じゅうまい'],
      regle: 'うすくて たいらな ものは 「まい」で かぞえる。 かみや おさら。', court: 'うすい もの ＝ まい', indice: 'うすい ものは 「まい」',
    },
    'だい': {
      question: 'なんだい', variantes: ['だい'], change: [],
      yomi: ['いちだい', 'にだい', 'さんだい', 'よんだい', 'ごだい', 'ろくだい', 'ななだい', 'はちだい', 'きゅうだい', 'じゅうだい'],
      regle: 'のりものや きかいは 「だい」で かぞえる。 くるまや じてんしゃ。', court: 'のりもの ＝ だい', indice: 'のりものは 「だい」',
    },
    'にん': {
      question: 'なんにん', variantes: ['にん'], change: [1, 2, 4],
      yomi: ['ひとり', 'ふたり', 'さんにん', 'よにん', 'ごにん', 'ろくにん', 'ななにん', 'はちにん', 'きゅうにん', 'じゅうにん'],
      regle: 'ひとは 「にん」で かぞえる。 でも 1は ひとり、 2は ふたり。', court: 'ひと ＝ にん（ひとり、 ふたり）', indice: 'ひとは 「にん」',
    },
    'さつ': {
      question: 'なんさつ', variantes: ['さつ'], change: [1, 8, 10],
      yomi: ['いっさつ', 'にさつ', 'さんさつ', 'よんさつ', 'ごさつ', 'ろくさつ', 'ななさつ', 'はっさつ', 'きゅうさつ', 'じゅっさつ'],
      regle: 'ほんや ノートは 「さつ」で かぞえる。', court: 'ほん・ノート ＝ さつ', indice: 'ほんや ノートは 「さつ」',
    },
  };
  const TOUS_COMPTEURS = Object.keys(COMPTEURS);
  // Les sons qui changent, à dire en exemple : いっぽん、 さんぼん、 ろっぽん、 はっぽん、 じゅっぽん。
  const sonsQuiChangent = (c) => COMPTEURS[c].change.map((k) => COMPTEURS[c].yomi[k - 1]).join('、 ');
  // 3 + ほん → { d: '3ぼん' (écrit comme on le dit), y: 'さんぼん' } ; 1 + にん → ひとり.
  function compteur(n, c) {
    const y = COMPTEURS[c].yomi[n - 1];
    if (c === 'にん' && n <= 2) return { d: y, y, n: '', s: y };
    const s = [...COMPTEURS[c].variantes].sort((a, b) => b.length - a.length).find((v) => y.endsWith(v)) || c;
    return { d: `${n}${s}`, y, n: String(n), s };
  }
  const htmlCompteur = (n, c) => {
    const k = compteur(n, c);
    return k.n
      ? `<span class="nb"><span class="nb-chiffre">${k.n}<small class="suffixe">${k.s}</small></span><span class="nb-yomi">${k.y}</span></span>`
      : `<span class="nb"><span class="nb-chiffre">${k.y}</span></span>`;
  };
  // Ce qu'on écrit et dit : « 3びき（さんびき） », la voix dit seulement « さんびき ».
  const segCompteur = (n, c) => {
    const k = compteur(n, c);
    return V(k.n ? `${k.d}（${k.y}）` : k.y, k.y);
  };
  // Les compteurs choisis par les parents (au moins 「こ」).
  const compteursActifs = () => {
    const l = (reglages.compteurs || []).filter((c) => COMPTEURS[c]);
    return l.length ? l : ['こ'];
  };

  // Des choses à compter (emoji), leur nom et leur compteur.
  const A_COMPTER = [
    ['りんご', '🍎', 'こ'], ['いちご', '🍓', 'こ'], ['みかん', '🍊', 'こ'], ['ボール', '⚽', 'こ'], ['たまご', '🥚', 'こ'], ['ふうせん', '🎈', 'こ'], ['ほし', '⭐', 'こ'],
    ['いぬ', '🐶', 'ひき'], ['ねこ', '🐱', 'ひき'], ['さかな', '🐟', 'ひき'], ['かえる', '🐸', 'ひき'],
    ['えんぴつ', '✏️', 'ほん'], ['かさ', '🌂', 'ほん'], ['バナナ', '🍌', 'ほん'], ['にんじん', '🥕', 'ほん'], ['はな', '🌷', 'ほん'],
    ['かみ', '📄', 'まい'], ['おさら', '🍽️', 'まい'], ['シャツ', '👕', 'まい'], ['クッキー', '🍪', 'まい'],
    ['くるま', '🚗', 'だい'], ['バス', '🚌', 'だい'], ['じてんしゃ', '🚲', 'だい'],
    ['こども', '🧒', 'にん'],
    ['ほん', '📕', 'さつ'], ['ノート', '📓', 'さつ'],
  ];
  const choseDuCompteur = (c) => choisir(A_COMPTER.filter((x) => x[2] === c));

  // Trois réponses : la bonne, et deux nombres proches ou faciles à confondre (13 / 31).
  function choixNombres(n, min, max, pieges = []) {
    const autres = new Set();
    melanger([...pieges, n + 1, n - 1, n + 2, n - 2, n + 10, n - 10]).forEach((x) => {
      if (autres.size < 2 && x !== n && x >= min && x <= max) autres.add(x);
    });
    while (autres.size < 2) {
      const x = entier(min, max);
      if (x !== n) autres.add(x);
    }
    return melanger([n, ...autres]);
  }
  const inverse = (n) => (n >= 10 && n < 100 && n % 10 ? (n % 10) * 10 + Math.floor(n / 10) : null);

  function genererQuestionKazu(niveau, derniere, i, n) {
    // aideMax : une aide avant la réponse (décomposer le nombre, compter les 10, montrer les cadres).
    const base = { niveau, theme: 'kazu', essais: new Set(), resolu: false, indices: false, demande: 'plus', aide: 0, aideMax: niveau === 35 ? 0 : 1 };
    const tiers = Math.ceil(n / 3);
    if (niveau === 35) {
      // いくつ？ : d'abord jusqu'à 5, en rangées de 5 ; ensuite jusqu'à 10, parfois en désordre.
      const facile = derniere || i < tiers;
      const v = facile ? entier(1, 5) : entier(4, 10);
      // Seulement des choses dont le compteur est travaillé (いぬ → なんびき, えんぴつ → なんぼん…).
      const actifs = compteursActifs();
      const [nom, emoji, cpt] = choisir(A_COMPTER.filter((x) => actifs.includes(x[2])));
      return { ...base, type: 'compter', valeur: v, nom, emoji, compteur: cpt, desordre: !facile && i >= 2 * tiers, options: choixNombres(v, 1, 10), bonne: v };
    }
    if (niveau === 42) {
      // かぞえかた : d'abord choisir le compteur (いぬは 〜ひき), ensuite la bonne lecture (さんびき, いっぽん…).
      const actifs = compteursActifs();
      const avecSons = actifs.filter((c) => COMPTEURS[c].change.length);
      const lire = !derniere && avecSons.length && i >= Math.ceil(n / 2);
      if (!lire) {
        const c = derniere ? (actifs.includes('こ') ? 'こ' : actifs[0]) : choisir(actifs);
        const [nom, emoji] = choseDuCompteur(c);
        const autres = melanger(actifs.filter((x) => x !== c));
        melanger(TOUS_COMPTEURS).forEach((x) => { if (x !== c && !autres.includes(x)) autres.push(x); });
        const v = entier(1, 5);
        return { ...base, type: 'compteur', sens: 'choisir', valeur: v, nom, emoji, compteur: c, options: melanger([c, ...autres.slice(0, 2)]), bonne: c };
      }
      const c = choisir(avecSons);
      const [nom, emoji] = choseDuCompteur(c);
      // Surtout les nombres où le son change (1, 3, 6, 8, 10 pour 「ほん」).
      const ch = COMPTEURS[c].change;
      const v = Math.random() < 0.7 ? choisir(ch) : entier(1, c === 'にん' ? 6 : 10);
      return { ...base, type: 'compteur', sens: 'lire', valeur: v, nom, emoji, compteur: c, options: melanger([compteur(v, c).y, ...fautesLecture(v, c)]), bonne: compteur(v, c).y };
    }
    if (niveau === 36) {
      // よみかた : chiffre → hiragana, puis hiragana → chiffre ; 1–10, puis 11–20, puis jusqu'à 99.
      const v = derniere || i < tiers ? entier(1, 10) : i < 2 * tiers ? entier(11, 20) : entier(21, 99);
      const sens = i % 2 === 0 ? 'chiffre' : 'yomi';
      const options = choixNombres(v, v > 20 ? 11 : 1, v > 20 ? 99 : 20, [inverse(v), v > 10 ? v % 10 : null].filter(Boolean));
      return { ...base, type: 'lire', valeur: v, sens, options, bonne: v };
    }
    if (niveau === 37) {
      // 10の まとまり : des jetons rangés par cadres de 10.
      const v = derniere ? entier(1, 3) * 10 + entier(1, 5) : entier(11, i < tiers ? 39 : 99);
      return { ...base, type: 'dizaines', valeur: v, options: choixNombres(v, 10, 99, [inverse(v)].filter(Boolean)), bonne: v };
    }
    // どっちが おおきい？ : 1–10 très différents, puis jusqu'à 100 avec des pièges (12 / 21, 39 / 41).
    let a;
    let b;
    if (derniere || i < tiers) {
      a = entier(1, 4);
      b = a + entier(3, 6);
    } else if (Math.random() < 0.5) {
      a = entier(12, 49);
      b = inverse(a) || a + 10;
    } else {
      const d = entier(2, 8);
      a = d * 10 + entier(5, 9);
      b = (d + 1) * 10 + entier(0, 4);
    }
    const valeurs = melanger([a, b]);
    const demande = !reglages.court || derniere ? 'plus' : choisir(['plus', 'moins']);
    const bonne = demande === 'plus' ? (valeurs[0] > valeurs[1] ? 0 : 1) : (valeurs[0] < valeurs[1] ? 0 : 1);
    return { ...base, type: 'comparer', valeurs, demande, bonne };
  }

  const motKazu = (sens) => (sens === 'plus' ? [OOKI, 'きい'] : [CHIISA, 'さい']);

  // Deux lectures fausses mais plausibles : さんほん, さんぽん pour さんぼん ; いちほん pour いっぽん…
  function fautesLecture(n, c) {
    const juste = compteur(n, c).y;
    const nombres = [YOMI_UN[n] || 'じゅう', { 1: 'いっ', 6: 'ろっ', 8: 'はっ', 10: 'じゅっ' }[n]].filter(Boolean);
    let fautes = c === 'にん'
      ? { 1: ['いちにん', 'ひとにん'], 2: ['ににん', 'ふたにん'], 4: ['よんにん', 'しにん'] }[n] || [`${YOMI_UN[n] || 'じゅう'}り`, `${YOMI_UN[n] || 'じゅう'}ひと`]
      : nombres.flatMap((x) => [...COMPTEURS[c].variantes, { 'こ': 'ご', 'さつ': 'ざつ', 'まい': 'ばい', 'だい': 'たい' }[c] || c].map((v) => x + v));
    // Pas de vrais mots qui embrouillent (いちご, じゅうご, ごご).
    fautes = melanger([...new Set(fautes)].filter((x) => x !== juste && !['いちご', 'じゅうご', 'ごご'].includes(x)));
    // Pas assez d'erreurs de son : le nombre d'à côté (よんさつ pour さんさつ).
    for (const k of [n - 1, n + 1, n + 2]) if (fautes.length < 2 && k >= 1 && k <= 10) fautes.push(compteur(k, c).y);
    return fautes.slice(0, 2);
  }

  function consigneKazu(q) {
    if (q.type === 'tuto') return q.etapes[q.etape].dire;
    if (q.type === 'compter') return [q.nom, 'は ', COMPTEURS[q.compteur || 'こ'].question, '？'];
    if (q.type === 'compteur') return q.sens === 'choisir' ? [q.nom, 'は どう かぞえる？'] : [q.nom, 'は ', COMPTEURS[q.compteur].question, '？'];
    if (q.type === 'lire') return q.sens === 'chiffre' ? ['この ', SUJI, 'の よみかたは？'] : ['「', yomiNombre(q.valeur), '」は どれ？'];
    if (q.type === 'dizaines') return ['●は いくつ？'];
    return ['どっちが ', ...motKazu(q.demande), '？'];
  }

  function rappelKazu(q) {
    if (q.type === 'tuto') return [''];
    if (q.type === 'compter') return ['ひとつずつ、 じゅんばんに かぞえる'];
    if (q.type === 'compteur') return q.sens === 'choisir' ? [COMPTEURS[q.compteur].court] : [sonsQuiChangent(q.compteur)];
    if (q.type === 'lire') return [V(`${q.valeur} ＝ `, 'この すうじは '), yomiNombre(q.valeur)];
    if (q.type === 'dizaines') return ['10の まとまりで かぞえると はやい'];
    const grand = Math.max(...q.valeurs) >= 10;
    return grand
      ? ['10の まとまりが ', OO_I, 'い ほう ＝ ', OOKI, 'きい']
      : ['あとに かぞえる ', SUJI, ' ＝ ', OOKI, 'きい'];
  }

  function explicationKazu(q) {
    const v = q.valeur;
    if (q.type === 'compter') {
      const compte = Array.from({ length: v }, (_, k) => YOMI_UN[k + 1] || 'じゅう').join('、 ');
      return [compte, '。 ', q.nom, 'は ぜんぶで ', segCompteur(v, q.compteur || 'こ'), '。'];
    }
    if (q.type === 'compteur') {
      const c = q.compteur;
      if (q.sens === 'choisir') return [COMPTEURS[c].regle, ' ', q.nom, 'が ', segCompteur(v, c), '。'];
      // La liste des sons qui changent est déjà écrite au-dessus (le rappel) : la voix la dit, l'écran reste court.
      const sons = COMPTEURS[c].change.length
        ? [V('', ` ${c === 'にん' ? '' : `${COMPTEURS[c].change.join('、 ')}で おとが かわる： `}${sonsQuiChangent(c)}。`)]
        : [];
      return [q.nom, 'が 「', compteur(v, c).y, '」。', ...sons];
    }
    if (q.type === 'lire') {
      const autre = AUTRES_YOMI[v] ? [' 「', AUTRES_YOMI[v], '」とも よむよ。'] : [];
      return [V(String(v), 'この すうじ'), 'は 「', yomiNombre(v), '」と よむ。', ...autre];
    }
    if (q.type === 'dizaines') {
      const d = Math.floor(v / 10);
      const u = v % 10;
      if (!u) return ['◇10の まとまりが ', `${d}つで `, ecrit(`${v}、 `), '「', yomiNombre(v), '」。 ◎ばらは ない。'];
      return ['◇10の まとまりが ', `${d}つで `, String(d * 10), '、 ◎ばらが ', `${u}つで `, String(u), '。 あわせて ', ecrit(`${v}、 `), '「', yomiNombre(v), '」。'];
    }
    const [a, b] = q.valeurs;
    const g = Math.max(a, b);
    const p = Math.min(a, b);
    let raison;
    if (g < 10) {
      raison = [String(p), 'の あとに ', String(g), 'を かぞえる。 '];
    } else if (Math.floor(g / 10) !== Math.floor(p / 10)) {
      raison = [String(g), 'は ◇10が ', `${Math.floor(g / 10)}つ、 `, String(p), 'は ◇10が ', `${Math.floor(p / 10)}つ。 `, '◇10の まとまりが ', OO_I, 'い ほうが ', OOKI, 'きい。 '];
    } else {
      raison = ['◇10の まとまりは ', ONAJI, 'じ。 ◎ばらは ', String(g % 10), 'と ', String(p % 10), '。 '];
    }
    return [...raison, String(q.valeurs[q.bonne]), 'の ほうが ', ...motKazu(q.demande), 'ね。'];
  }

  // Compter par 10 : la voix dit tout (じゅう、 にじゅう、 さんじゅう…), l'écran garde court (10、 20、 30…).
  const compterPar10 = (d) => V(d <= 3 ? Array.from({ length: d }, (_, k) => (k + 1) * 10).join('、 ') : '10、 20、 30…',
    YOMI_DIX.slice(1, d + 1).join('、 '));

  // Un nombre écrit mais pas dit, quand sa lecture suit juste après : sinon la voix dit « じゅうさん。 じゅうさん ».
  const ecrit = (texte) => V(texte, '');

  // L'aide かず : on DÉCOMPOSE le nombre (16 = 10 と 6 : 「じゅう」 と 「ろく」), on compte les 10 (じゅう、 にじゅう…).
  // Après une erreur sur un nombre (64 pour 66) : quelle partie était juste ? 'ba' : les dizaines sont justes,
  // on regarde les ばら ; 'dix' : les ばら sont justes, on regarde les 10の まとまり.
  function partieAVoir(q) {
    if (!['dizaines', 'lire'].includes(q.type) || typeof q.erreur !== 'number' || q.valeur < 10) return null;
    const [d, u, de, ue] = [Math.floor(q.valeur / 10), q.valeur % 10, Math.floor(q.erreur / 10), q.erreur % 10];
    if (d === de && u !== ue) return 'ba';
    if (u === ue && d !== de) return 'dix';
    return null;
  }

  function aideKazu(q) {
    const v = q.valeur;
    const d = Math.floor(v / 10);
    const u = v % 10;
    const voir = partieAVoir(q);
    if (q.type === 'dizaines' && voir === 'ba') {
      return ['◇10の まとまりは あって いるよ。 ', String(d * 10), '。 こんどは ◎ばらを ひとつずつ かぞえよう。'];
    }
    if (q.type === 'dizaines' && voir === 'dix') {
      return ['◎ばらは あって いるよ。 ◇10の まとまりを 10ずつ かぞえよう： ', compterPar10(d), '。'];
    }
    if (q.type === 'lire' && voir === 'ba') {
      return ['「', YOMI_DIX[d], '」は あって いるよ。 ◎ばらを よく ', MI, 'て： ばら ', `${u}つは 「`, YOMI_UN[u], '」。'];
    }
    if (q.type === 'lire' && voir === 'dix' && u) {
      return ['「', YOMI_UN[u], '」は あって いるよ。 ◇10の まとまりを よく ', MI, 'て： ◇10の まとまり ', `${d}つは 「`, YOMI_DIX[d], '」。'];
    }
    if (q.type === 'compteur') {
      const c = q.compteur;
      // Choisir : la règle de chaque compteur proposé. Lire : on compte ensemble jusqu'au nombre d'avant.
      if (q.sens === 'choisir') return [q.options.map((x) => COMPTEURS[x].indice).join('、 '), '。'];
      if (v === 1) return ['1の ときは おとが かわるよ： ', sonsQuiChangent(c), '。'];
      return ['いっしょに かぞえよう： ', COMPTEURS[c].yomi.slice(0, v - 1).join('、 '), '、 つぎは？'];
    }
    if (q.type === 'lire') {
      if (v < 10) return ['●を かぞえて みよう。 いち、 に、 さん…'];
      if (q.sens === 'chiffre') {
        return u
          ? ['◇10の まとまり ', `${d}つは 「`, YOMI_DIX[d], '」、 ばら ', `${u}つは 「`, YOMI_UN[u], '」。']
          : ['◇10の まとまりが ', `${d}つ。 10ずつ かぞえよう： `, compterPar10(d), '。'];
      }
      return u
        ? ['「', yomiNombre(v), '」は 「', YOMI_DIX[d], '」と 「', YOMI_UN[u], '」。 「', YOMI_DIX[d], '」は ◇10の まとまり ', `${d}つ`, '、 「', YOMI_UN[u], '」は ばら ', `${u}つ`, '。']
        : ['「', yomiNombre(v), '」は ◇10の まとまりが ', `${d}つ。`];
    }
    if (q.type === 'dizaines') {
      return ['◇10の まとまりを 10ずつ かぞえよう： ', compterPar10(d), '。', u ? ' それから ◎ばらを かぞえよう。' : ''];
    }
    return Math.max(...q.valeurs) >= 10 ? ['◇10の まとまりの かずを くらべよう。'] : ['●の かずを くらべよう。'];
  }

  function messageErreurKazu(q) {
    if (q.type === 'compter') return ['おしい！ ひとつずつ、 ゆびで さしながら かぞえよう。'];
    if (q.type === 'compteur') {
      // Les questions à se poser, seulement pour les compteurs proposés : いきもの？ ほそながい もの？
      const questions = { 'こ': 'ちいさい もの？', 'ひき': 'いきもの？', 'ほん': 'ほそながい もの？', 'まい': 'うすい もの？', 'だい': 'のりもの？', 'にん': 'ひと？', 'さつ': 'ほんや ノート？' };
      return q.sens === 'choisir'
        ? ['おしい！ ', q.nom, 'は ', q.options.map((x) => questions[x]).join(' '), ' よく ', MI, 'てね。']
        : ['おしい！ こえに だして かぞえて みよう。'];
    }
    if (q.type === 'lire') return ['おしい！ こえを よく きいてね。'];
    if (q.type === 'dizaines') {
      return partieAVoir(q) === 'ba' ? ['おしい！ ◎ばらを ゆびで さしながら かぞえよう。'] : ['おしい！ ◇10の まとまりを さきに かぞえよう。'];
    }
    return ['おしい！ ◇10の まとまりの かずを くらべよう。'];
  }

  // Les jetons d'un nombre : centaines (plaques de 100), dizaines (cadres de 10 pleins : « 10の まとまり »),
  // unités (« ばら ») dans un cadre de 10. Dans les leçons : exactement ce que l'élève a posé ({ c, d, u }).
  // compte : sous chaque dizaine, 10, 20, 30… (on apprend à compter par 10).
  // legende : sous chaque groupe, « 10の まとまり 4つ / 40 よんじゅう », « ばら 4つ / 4 よん » (yomi : avec la lecture).
  function htmlBlocs(n, { cadreVide = false, etiquettes = false, parties = null, compte = false, legende = false, yomi = true } = {}) {
    const { c, d, u } = parties || { c: Math.floor(n / 100), d: Math.floor((n % 100) / 10), u: n % 10 };
    const legendeDe = (nom, combien, valeur, place) => (legende
      ? `<span class="legende-blocs"><small>${nom} ${combien}つ</small><span class="legende-valeur legende-${place}"><b>${valeur}</b>${yomi ? `<span class="nb-yomi">${yomiNombre(valeur)}</span>` : ''}</span></span>`
      : '');
    let h = `<span class="blocs${legende ? ' avec-legende' : ''}">`;
    if (c) {
      h += `<span class="blocs-groupe"><span class="blocs-rang">${'<span class="plaque100"></span>'.repeat(c)}${etiquettes ? `<b class="ba">100 × ${c}</b>` : ''}</span>${legendeDe('<pc>●</pc>100の いた', c, c * 100, 'c')}</span>`;
    }
    if (d) {
      const dizaines = Array.from({ length: d }, (_, k) => (compte
        ? `<span class="cadre-groupe">${htmlCadre(10, 'dix')}<b>${(k + 1) * 10}</b></span>`
        : htmlCadre(10, 'dix'))).join('');
      h += `<span class="blocs-groupe"><span class="blocs-rang">${dizaines}${etiquettes ? `<b class="ba">10 × ${d}</b>` : ''}</span>${legendeDe('<pd>●</pd>10の まとまり', d, d * 10, 'd')}</span>`;
    }
    if (u || cadreVide) {
      const cadres = Math.max(1, Math.ceil(u / 10));
      h += `<span class="blocs-groupe"><span class="blocs-rang">${Array.from({ length: cadres }, (_, k) => htmlCadre(Math.min(10, u - k * 10))).join('')}${etiquettes && u ? `<b class="ba">1 × ${u}</b>` : ''}</span>${u ? legendeDe('<pu>●</pu>ばら', u, u, 'u') : ''}</span>`;
    }
    return `${h}</span>`;
  }
  // Un cadre de 10 (2 rangées de 5) : on voit ce qui manque pour faire 10. Plein, c'est « 10の まとまり ».
  const htmlCadre = (k, classe = '') => `<span class="cadre10${classe ? ` ${classe}` : ''}">${Array.from({ length: 10 }, (_, i) => `<i class="${i < k ? 'plein' : ''}"></i>`).join('')}</span>`;

  // Réduit la taille des cases (--c) jusqu'à ce que l'élément tienne dans W × H ; renvoie true si ça tient.
  function ajusterCases(el, W, H, cMax, cMin = 12) {
    const tient = () => {
      const r = el.getBoundingClientRect();
      return r.height <= H + 1 && r.width <= W + 1 && el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1;
    };
    for (let c = cMax; c >= cMin; c -= 2) {
      el.style.setProperty('--c', `${c}px`);
      if (tient()) return true;
    }
    return false;
  }
  // Sur un petit écran : d'abord plus compact (chiffres moins grands), puis, si les points deviendraient
  // illisibles, seulement la légende (« 10の まとまり 9つ … ») : jamais de points minuscules.
  function ajusterBlocs(el, W, H, cMax) {
    const enLigne = el.classList.contains('en-ligne');
    el.classList.remove('compacte', 'sans-cadres');
    if (ajusterCases(el, W, H, cMax)) return;
    // Compact : le chiffre et sa lecture sur une ligne, les cadres dessous.
    el.classList.remove('en-ligne');
    el.classList.add('compacte');
    if (ajusterCases(el, W, H, cMax, 10)) return;
    if (enLigne) {
      el.classList.add('en-ligne');
      if (ajusterCases(el, W, H, cMax, 10)) return;
    }
    if (el.querySelector('.legende-blocs')) el.classList.add('sans-cadres');
  }

  function rendreKazuQ(q, scene, W, H) {
    const choix = $('choix-mots');
    const avecChoix = q.type !== 'comparer' && q.type !== 'tuto';
    const aide = q.aide > 0 && !q.preuve;
    choix.hidden = !avecChoix;
    choix.replaceChildren();
    // Les réponses en liste : une par ligne, le chiffre et sa lecture en grand.
    choix.classList.toggle('choix-liste', avecChoix);
    if (q.type === 'compter' || q.type === 'compteur') {
      const zone = document.createElement('div');
      zone.className = `a-compter${q.desordre ? ' desordre' : ''}`;
      // Peu d'objets : plus gros et centrés (autant de colonnes que d'objets, 5 au plus).
      const colonnes = q.desordre ? 5 : Math.min(5, q.valeur);
      const rangees = q.desordre ? 3 : Math.ceil(q.valeur / 5);
      const taille = Math.max(32, Math.min(110, W / (colonnes * 1.28 + 0.6), H / (rangees * 1.28 + 0.8)));
      zone.style.setProperty('--t', `${taille}px`);
      if (!q.desordre) zone.style.gridTemplateColumns = `repeat(${colonnes}, var(--t))`;
      if (!q.places) {
        // En désordre : des cases tirées au hasard dans une grille 5 × 3, un peu décalées.
        const cases = melanger(Array.from({ length: 15 }, (_, k) => k)).slice(0, q.valeur).sort((x, y) => x - y);
        q.places = cases.map((c) => ({ c, dx: aleatoire(-0.15, 0.15), dy: aleatoire(-0.15, 0.15) }));
      }
      for (let k = 0; k < q.valeur; k++) {
        const o = document.createElement('span');
        o.className = 'objet-compte';
        o.textContent = q.emoji;
        if (q.desordre) {
          const p = q.places[k];
          o.style.gridColumn = String((p.c % 5) + 1);
          o.style.gridRow = String(Math.floor(p.c / 5) + 1);
          o.style.transform = `translate(${p.dx * taille}px, ${p.dy * taille}px)`;
        }
        if (q.preuve) {
          const num = document.createElement('b');
          num.className = 'num-compte';
          num.textContent = String(k + 1);
          num.style.animationDelay = `${k * 0.45}s`;
          o.append(num);
        }
        zone.append(o);
      }
      scene.append(zone);
    } else if (q.type === 'lire') {
      const carte = document.createElement('div');
      carte.className = 'carte-nombre';
      const chiffres = q.preuve || aide ? chiffresColores(q.valeur) : q.valeur;
      const tete = q.sens === 'chiffre'
        ? `<span class="nb-chiffre">${chiffres}</span>${q.preuve ? `<span class="nb-yomi">${yomiNombre(q.valeur)}</span>` : ''}`
        : `<span class="nb-yomi grand">${yomiNombre(q.valeur)}</span>${q.preuve ? `<span class="nb-chiffre">${chiffres}</span>` : ''}`;
      carte.innerHTML = `<span class="carte-tete">${tete}</span>`;
      // Aide et preuve : le nombre décomposé (10の まとまり / ばら), avec la lecture de chaque partie.
      if (q.preuve || aide) {
        carte.innerHTML += htmlBlocs(q.valeur, { compte: q.valeur >= 20, legende: q.valeur >= 10 });
        // La partie à regarder après l'erreur (dizaines ou ばら) est entourée.
        const voir = q.preuve ? null : partieAVoir(q);
        const groupes = carte.querySelectorAll('.blocs-groupe');
        if (voir && groupes.length === 2) groupes[voir === 'ba' ? 1 : 0].classList.add('a-regarder');
        carte.classList.toggle('en-ligne', W > H * 1.25);
      }
      scene.append(carte);
      if (q.preuve || aide) ajusterBlocs(carte, W, H - 2, 34);
    } else if (q.type === 'dizaines') {
      const zone = document.createElement('div');
      zone.className = 'zone-dizaines';
      const d = Math.floor(q.valeur / 10);
      const u = q.valeur % 10;
      // Aide et preuve : on compte les 10 (10, 20, 30…), puis les ばら.
      const compter = q.preuve || aide;
      const voir = q.preuve ? null : partieAVoir(q);
      zone.innerHTML = Array.from({ length: d }, (_, k) => `<span class="cadre-groupe${voir === 'dix' ? ' a-regarder' : ''}">${htmlCadre(10, 'dix')}${compter ? `<b>${(k + 1) * 10}</b>` : ''}</span>`).join('')
        + (u ? `<span class="cadre-groupe${voir === 'ba' ? ' a-regarder' : ''}">${htmlCadre(u)}${q.preuve ? `<b class="ba">ばら ${u}</b>` : voir === 'ba' ? '<b class="ba">ばら ？</b>' : ''}</span>` : '');
      placerCadres(zone, d + (u ? 1 : 0), scene, W, H);
    } else if (q.type === 'tuto') {
      rendreExemple(q, scene, W, H);
    } else {
      rendreComparerKazu(q, scene, W, H, aide);
    }
    afficherChoixKazu(q, choix, avecChoix);
  }

  // Taille des cases : on essaie 1 à 5 cadres par rangée et on garde la plus grande taille qui tient
  // (un cadre : 5 cases + 24 px de large, 2 cases + 15 px de haut, + l'étiquette 10, 20, 30…).
  function placerCadres(zone, nb, scene, W, H, cMax = 44) {
    {
      let meilleur = 9;
      let colonnes = Math.min(5, nb);
      for (let k = 1; k <= Math.min(5, nb); k++) {
        const r = Math.ceil(nb / k);
        const c = Math.min(cMax, (W - 8 - (k - 1) * 12 - k * 24) / (5 * k), (H - 8 - (r - 1) * 12 - r * (15 + 26)) / (2 * r));
        if (c > meilleur) {
          meilleur = c;
          colonnes = k;
        }
      }
      const poser = (c) => {
        zone.style.setProperty('--c', `${c}px`);
        zone.style.maxWidth = `${colonnes * (5 * c + 24) + (colonnes - 1) * 12 + 2}px`;
      };
      let c = Math.floor(meilleur);
      poser(c);
      scene.append(zone);
      // Vérifié sur l'écran réel (étiquettes 10, 20, 30… comprises) : on réduit si ça dépasse.
      const depasse = () => zone.getBoundingClientRect().height > H || zone.getBoundingClientRect().width > W + 1;
      while (c > 7 && depasse()) poser(--c);
      // Très petit écran : étiquettes et écarts plus serrés plutôt que des cadres coupés.
      if (depasse()) {
        zone.classList.add('serre');
        while (c > 5 && depasse()) poser(--c);
      }
    }
  }

  function rendreComparerKazu(q, scene, W, H, aide) {
    {
      const rangee = document.createElement('div');
      rangee.className = 'rangee-mv';
      q.valeurs.forEach((v, k) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'carte-nombre choix-comparer';
        b.innerHTML = nombreYomi(v, q.preuve || aide) + (q.preuve || aide ? htmlBlocs(v, { legende: v >= 10, yomi: false }) : '');
        cible(b, k, `${yomiNombre(v)}`);
        rangee.append(b);
      });
      scene.append(rangee);
      if (q.preuve || aide) ajusterBlocs(rangee, W, H - 2, 26);
    }
  }

  function afficherChoixKazu(q, choix, avecChoix) {
    if (avecChoix) {
      q.options.forEach((v) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn-nombre';
        // Hiragana → chiffre : seulement le chiffre (sinon la réponse serait écrite) ; sinon les deux.
        let label = yomiNombre(v);
        if (q.type === 'compter') {
          b.innerHTML = htmlCompteur(v, q.compteur || 'こ');
          label = compteur(v, q.compteur || 'こ').y;
        } else if (q.type === 'compteur' && q.sens === 'choisir') {
          // Le même nombre avec chaque compteur : 3びき / 3ぼん / 3まい.
          b.innerHTML = htmlCompteur(q.valeur, v);
          label = compteur(q.valeur, v).y;
        } else if (q.type === 'compteur') {
          b.innerHTML = `<span class="nb-yomi">${v}</span>`;
          label = v;
        } else {
          b.innerHTML = q.type === 'lire' && q.sens === 'chiffre' ? `<span class="nb-yomi">${yomiNombre(v)}</span>`
            : q.type === 'lire' ? `<span class="nb-chiffre">${q.aide || q.preuve ? chiffresColores(v) : v}</span>` : nombreYomi(v, q.type === 'dizaines' && (q.aide > 0 || q.preuve));
        }
        cible(b, v, label);
        choix.append(b);
      });
    }
  }

  /* ----- Exemple guidé (れい) avant la 1re question : on relie la consigne au dessin.
     10の まとまり : un cadre plein, c'est 10 (les ●, numérotés 1 à 10) ; on compte les cadres
     10, 20 ; puis les ばら 21, 22, 23 ; ぜんぶで 23. つぎへ passe d'une étape à l'autre, とばす saute l'exemple. ----- */
  const EXEMPLES = {
    37: () => ({
      valeur: 23,
      etapes: [
        { dire: ['まずは れいを みよう。 これは ◇10の まとまり。 ●が 10こ はいって いるよ。 ', V('1、 2、 3… 10。', 'いち、 に、 さん、 よん、 ご、 ろく、 なな、 はち、 きゅう、 じゅう。')], dizaines: 1, numeros: [1, 10] },
        { dire: ['◇10の まとまりは 10ずつ かぞえる： ', V('10、 20。', 'じゅう、 にじゅう。')], dizaines: 2, ba: 3, etiquettes: true },
        { dire: ['のこりの ●は 「◎ばら」。 ', V('21、 22、 23。', 'にじゅういち、 にじゅうに、 にじゅうさん。')], dizaines: 2, ba: 3, etiquettes: true, numerosBa: 21 },
        { dire: ['ぜんぶで ', ecrit('23、 '), '「にじゅうさん」。 では、 やって みよう！'], dizaines: 2, ba: 3, etiquettes: true, total: 23 },
      ],
    }),
  };
  // Au début d'une série : l'exemple, s'il existe pour cette activité (et si les parents le veulent).
  function exempleDe(niveau) {
    if (reglages.exemple === false || !EXEMPLES[niveau]) return null;
    return { ...EXEMPLES[niveau](), theme: 'kazu', type: 'tuto', etape: 0, essais: new Set(), resolu: false, aide: 0, aideMax: 0 };
  }

  // Les cadres de l'exemple ; les nombres apparaissent un à un, au rythme de la voix (≈ 0,6 s).
  function rendreExemple(q, scene, W, H) {
    const et = q.etapes[q.etape];
    const zone = document.createElement('div');
    zone.className = 'zone-dizaines zone-exemple';
    const pas = 0.62;
    const cadre = (k, numeroDepart, classe) => `<span class="cadre10${classe ? ` ${classe}` : ''}">${Array.from({ length: 10 }, (_, i) => {
      if (i >= k) return '<i></i>';
      const n = numeroDepart ? numeroDepart + i : 0;
      return `<i class="plein">${n ? `<b style="animation-delay:${(i * pas).toFixed(2)}s">${n}</b>` : ''}</i>`;
    }).join('')}</span>`;
    let h = '';
    for (let k = 0; k < et.dizaines; k++) {
      const num = et.numeros && k === 0 ? 1 : 0;
      const etiquette = et.etiquettes ? `<b style="animation-delay:${(et.numerosBa ? 0 : 0.8 + k * 0.9).toFixed(2)}s">${(k + 1) * 10}</b>` : '';
      h += `<span class="cadre-groupe">${cadre(10, num, 'dix')}${etiquette}</span>`;
    }
    if (et.ba) {
      h += `<span class="cadre-groupe">${cadre(et.ba, et.numerosBa || 0)}${et.numerosBa || et.total ? `<b class="ba">ばら ${et.ba}</b>` : ''}</span>`;
    }
    zone.innerHTML = h;
    // Les cadres, et dessous (dernière étape) le total : 23 にじゅうさん.
    const bloc = document.createElement('div');
    bloc.className = 'exemple';
    scene.append(bloc);
    placerCadres(zone, et.dizaines + (et.ba ? 1 : 0), bloc, W, et.total ? H - 80 : H);
    if (et.total) {
      const total = document.createElement('div');
      total.className = 'total-exemple';
      total.innerHTML = nombreYomi(et.total, true);
      bloc.append(total);
    }
  }

  /* ----- Leçons かず : le cadre de 10, les dizaines, les centaines ----- */

  // « 235を つくろう » : on guide sorte par sorte, de la plus grande à la plus petite.
  // Trop : on dit laquelle enlever (100の いた, 10の まとまり ou ●), et la démonstration enlève celle-là.
  // Après avoir enlevé : « 100の いたは これで いいね。 こんどは 10の まとまりを のせよう。 »
  // (m.cle : l'état, pour ne le dire qu'une fois ; m.retirer : la sorte à enlever.)
  const guideComposition = (cible) => (e) => {
    const nb = (v) => e.plateau.filter((x) => x.v === v).length;
    const [c, d, u] = [nb('cent'), nb('dix'), nb('pion')];
    const [tc, td, tu] = [Math.floor(cible / 100), Math.floor((cible % 100) / 10), cible % 10];
    const avec = (m, cle, retirer) => Object.assign(m, { cle, retirer });
    if (somme(e.plateau) > cible) {
      if (c > tc) return avec(['おおすぎ！ ◆100の いたが おおいよ。 さわって おろそう。'], 'trop-cent', 'cent');
      if (d > td) return avec(['おおすぎ！ ◇10の まとまりが おおいよ。 さわって おろそう。'], 'trop-dix', 'dix');
      return avec(['おおすぎ！ ●が おおいよ。 さわって おろそう。'], 'trop-un', 'pion');
    }
    // Tant que l'élève n'a rien enlevé, on le laisse faire (seule la voix compte).
    if (!e.guide) return null;
    if (c < tc) return avec(['◆100の いたを のせよう。'], 'plus-cent');
    if (d < td) return avec([tc ? '◆100の いたは これで いいね。 ' : '', 'こんどは ◇10の まとまりを のせよう。'], 'plus-dix');
    if (u < tu) return avec([td ? '◇10の まとまりも これで いいね。 ' : tc ? '◆100の いたは これで いいね。 ' : '', 'こんどは ●を のせよう。'], 'plus-un');
    return null;
  };

  const parlerNombre = (n) => parler(yomiNombre(n));

  function etapesKazu1() {
    const total = (e) => somme(e.plateau);
    const un = (n) => P('pion', 1, n);
    return [
      {
        dire: ['これは 10の わく。 ●を 1こずつ のせて、 10まで かぞえよう。 ', SUJI, 'と よみかたが でるよ。'],
        scene: 'compte', cadre: true, contenu: [], reserve: [un(10)], vers: 'plateau', compter: true, fini: (e) => total(e) === 10,
        bravo: [ecrit('10！ '), '「じゅう」。 わくが いっぱいに なったね。'],
      },
      {
        dire: [ecrit('5は '), '「ご」。 うえの ならびが いっぱい。 5の まとまり だよ。'],
        scene: 'compte', cadre: true, contenu: [un(5)],
      },
      {
        dire: [ecrit('4は '), '「よん」。 「し」とも よむよ。 ', ecrit('7は '), '「なな」、 「しち」とも よむ。 ', ecrit('9は '), '「きゅう」、 「く」とも よむ。'],
        scene: 'compte', cadre: true, contenu: [un(4)], autres: true,
      },
      {
        dire: ['●を さわって、 ぜんぶ おろそう。'],
        scene: 'compte', cadre: true, contenu: [un(6)], retirer: true, vers: 'plateau', compter: true, fini: (e) => total(e) === 0,
        bravo: ['なにも ない とき、 ', SUJI, 'は ', ecrit('0。 '), '「ぜろ」と よむ。'],
      },
      {
        dire: ['●は いくつ？'],
        scene: 'compte', cadre: true, contenu: [un(7)], cache: true,
        cinq: true,
        choix: { options: [7, 6, 8], bonne: 7, unite: '', indice: ['おしい！ うえの ならびを かぞえよう： いち、 に、 さん、 よん、 ご。 5の まとまり。 あと いくつ？'] },
        bravo: ['5と 2で ', ecrit('7。 '), '「なな」。'],
      },
      {
        dire: ['●を 8こ のせよう。'],
        scene: 'compte', cadre: true, contenu: [], reserve: [un(10)], vers: 'plateau', retirer: true, compter: true, cache: true,
        fini: (e) => total(e) === 8,
        pendant: guideComposition(8),
        bravo: [ecrit('8！ '), '「はち」。 10まで あと 2つ。'],
      },
    ];
  }

  function etapesKazu2() {
    const total = (e) => somme(e.plateau);
    const un = (n) => P('pion', 1, n);
    const dix = (n) => P('dix', 10, n);
    return [
      {
        dire: [ecrit('10は '), '「じゅう」。 10の わくが いっぱいに なったら、 それが 「◇10の まとまり」。 ◇10の まとまりは みずいろで かくよ。 10、 20、 30と、 10ずつ かぞえられるよ。'],
        scene: 'compte', contenu: [dix(1)],
      },
      {
        dire: ['◇10の まとまりの よこに ●を のせて、 13に しよう。'],
        scene: 'compte', cadre: true, contenu: [dix(1)], reserve: [un(9)], vers: 'plateau', retirer: true, compter: true,
        fini: (e) => total(e) === 13, pendant: guideComposition(13),
        bravo: ['10と 3で ', ecrit('13。 '), '「じゅうさん」。'],
      },
      {
        dire: ['いくつ？'],
        scene: 'compte', contenu: [dix(1), un(7)], cache: true,
        choix: { options: [17, 71, 7], bonne: 17, unite: '', indice: ['おしい！ ◇10の まとまりが 1つと、 ●が 7こ。'] },
        bravo: ['10と 7で ', ecrit('17。 '), '「じゅうなな」（「じゅうしち」）。'],
      },
      {
        dire: ['◇10の まとまりを のせて、 10ずつ かぞえよう。 100まで いくよ。'],
        scene: 'compte', contenu: [], reserve: [dix(10)], vers: 'plateau', compter: true, fini: (e) => total(e) === 100,
        bravo: ['◇10が 10こで ', ecrit('100。 '), '「ひゃく」。'],
      },
      {
        dire: ['34を つくろう。 ◇10の まとまりと ●を つかってね。'],
        scene: 'compte', cadre: true, contenu: [], reserve: [dix(5), un(9)], vers: 'plateau', retirer: true, compter: true,
        fini: (e) => total(e) === 34,
        pendant: guideComposition(34),
        bravo: ['◇10が 3つで 30、 ●が 4つで 4。 ', ecrit('34、 '), '「さんじゅうよん」。'],
      },
      {
        dire: ['いくつ？'],
        scene: 'compte', contenu: [dix(5), un(2)], cache: true,
        choix: { options: [52, 25, 7], bonne: 52, unite: '', indice: ['おしい！ ◇10の まとまりは いくつ？ ●は いくつ？'] },
        bravo: ['◇10が 5つで 50、 ●が 2つで 2。 ', ecrit('52、 '), '「ごじゅうに」。'],
      },
      {
        dire: ['まとめ： ひだりの ', SUJI, '（みずいろの せん）は ◇10の まとまりの かず、 みぎの ', SUJI, '（オレンジの せん）は ●の かず。 34は ◇10が 3つと ●が 4つ。'],
        scene: 'compte', contenu: [dix(3), un(4)], etiquettes: true,
      },
    ];
  }

  function etapesKazu3() {
    const total = (e) => somme(e.plateau);
    const un = (n) => P('pion', 1, n);
    const dix = (n) => P('dix', 10, n);
    const cent = (n) => P('cent', 100, n);
    return [
      {
        dire: ['◇10の まとまりが 10こで 100。 ◆100の いたに なる。 「ひゃく」。'],
        scene: 'compte', contenu: [cent(1)],
      },
      {
        dire: ['◆100の いたを のせて、 100ずつ かぞえよう。 よみかたが かわる ところを きいてね。'],
        scene: 'compte', contenu: [], reserve: [cent(9)], vers: 'plateau', compter: true, fini: (e) => total(e) === 900,
        bravo: ['◆100が 3つで 「さんびゃく」、 ◆100が 6つで 「ろっぴゃく」、 ◆100が 8つで 「はっぴゃく」。 よみかたが すこし かわるね。'],
      },
      {
        dire: ['235を つくろう。'],
        scene: 'compte', contenu: [], reserve: [cent(4), dix(9), un(9)], vers: 'plateau', retirer: true, compter: true,
        fini: (e) => total(e) === 235,
        pendant: guideComposition(235),
        bravo: ['◆100が 2つ、 ◇10が 3つ、 ●が 5つ。 ', ecrit('235、 '), '「にひゃく さんじゅう ご」。'],
      },
      {
        dire: ['いくつ？'],
        scene: 'compte', contenu: [cent(4), un(8)], cache: true,
        choix: { options: [408, 48, 480], bonne: 408, unite: '', indice: ['おしい！ ◆100の いたは いくつ？ ◇10の まとまりは ある？'] },
        bravo: ['◆100が 4つ、 ◇10の まとまりは ない、 ●が 8つ。 ', ecrit('408、 '), '「よんひゃく はち」。 10の ところは 0 だよ。'],
      },
      {
        dire: ['◆100の いたを 10まい のせると…'],
        scene: 'compte', contenu: [cent(9)], reserve: [cent(1)], vers: 'plateau', compter: true, fini: (e) => total(e) === 1000,
        bravo: [ecrit('1000！ '), '「せん」。 ◆100が 10こで 1000。'],
      },
      {
        dire: ['まとめ： ', SUJI, 'は ひだりから 100の かず（むらさき）、 10の かず（みずいろ）、 ●の かず（オレンジ）。 ', ecrit('235は '), '「にひゃく さんじゅう ご」。'],
        scene: 'compte', contenu: [cent(2), dix(3), un(5)], etiquettes: true,
      },
    ];
  }

  // La scène des leçons かず : le nombre (et sa lecture) en grand, puis les plaques, barres et jetons.
  function creerCompteLecon(W, H, et) {
    const el = document.createElement('div');
    el.className = 'compte-lecon';
    el.style.setProperty('--c', `${Math.max(10, Math.min(24, W / 30, H / 14))}px`);
    el.innerHTML = '<div class="compte-affiche"></div><div class="compte-plateau"></div>';
    el.geo = { taille: 40, s: Math.max(18, Math.min(30, W / 24)), W, H };
    return el;
  }

  function majCompteLecon(el, e) {
    const et = e.etape;
    const n = somme(e.plateau);
    const cache = et.cache && !e.resolu;
    el.querySelector('.compte-affiche').innerHTML = cache
      ? '<span class="nb"><span class="nb-chiffre">？</span></span>'
      : nombreYomi(n, true) + (et.autres && AUTRES_YOMI[n] ? `<span class="nb-autre">（${AUTRES_YOMI[n]}）</span>` : '');
    const plateau = el.querySelector('.compte-plateau');
    const nb = (v) => e.plateau.filter((x) => x.v === v).length;
    plateau.innerHTML = htmlBlocs(n, { cadreVide: et.cadre, etiquettes: et.etiquettes, compte: true, parties: { c: nb('cent'), d: nb('dix'), u: nb('pion') } });
    // 「5の まとまりと、 あと いくつ？」 : après une erreur, la rangée du haut descend sous le cadre, en plus
    // gros, et se compte 1 à 5 ; le reste attend (＋ ？). Une fois trouvé : 5 ＋ 2 ＝ 7, comptés 6, 7.
    el.querySelector('.aide-cinq')?.remove();
    if (et.cinq && (e.essais.size || e.resolu)) {
      const reste = n - 5;
      const pas = 0.62;
      const aide = document.createElement('div');
      aide.className = 'aide-cinq';
      const rond = (k, num) => `<i class="plein"><b style="animation-delay:${(0.5 + num * pas).toFixed(2)}s">${k}</b></i>`;
      aide.innerHTML = `<span class="groupe-cinq">${Array.from({ length: 5 }, (_, k) => rond(k + 1, k)).join('')}<small>5の まとまり</small></span>`
        + '<b class="signe">＋</b>'
        + `<span class="groupe-reste">${e.resolu
          ? Array.from({ length: reste }, (_, k) => rond(k + 6, k + 5)).join('')
          : `${'<i class="plein"></i>'.repeat(reste)}`}<small>${e.resolu ? `あと ${reste}` : 'あと ？'}</small></span>`;
      el.append(aide);
    }
    // Aussi gros que la place le permet (sur téléphone, le cadre était minuscule) ; la rangée 1 2 3 4 5 ＋ 6 7
    // doit aussi tenir en largeur.
    if (el.geo.W) {
      ajusterCases(el, el.geo.W, el.geo.H, 46, 10);
      const rangee = el.querySelector('.aide-cinq');
      let c = parseFloat(el.style.getPropertyValue('--c')) || 20;
      while (rangee && c > 10 && rangee.scrollWidth > el.geo.W - 4) {
        c -= 2;
        el.style.setProperty('--c', `${c}px`);
      }
    }
    // On touche une plaque, un « 10の まとまり » ou un jeton pour l'enlever.
    if (et.retirer && !e.resolu) {
      const enlever = (v) => {
        const p = [...e.plateau].reverse().find((x) => x.v === v);
        if (p) enleverPiece('plateau', p.id);
      };
      plateau.querySelectorAll('.plaque100').forEach((x) => activable(x, () => enlever('cent')));
      plateau.querySelectorAll('.cadre10.dix').forEach((x) => activable(x, () => enlever('dix')));
      plateau.querySelectorAll('.cadre10:not(.dix) i.plein').forEach((x) => activable(x, () => enlever('pion')));
      plateau.classList.add('enlevable');
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

  /* ----- Aides : « わからない » (toutes les questions), « そろえる » (objets libres), « うつす » (verser) ----- */

  function messageAide(q) {
    if (q.type === 'mesures') {
      if (q.mixte && q.aide === 1) {
        const g = q.valeurs.find((v) => v.grande);
        return [segValeur(g), 'は ', segU(g.val, uniteDe(q.theme)), '。'];
      }
      return q.theme === 'omosa' ? ['はかりで くらべて ', MI, 'よう。'] : ['カップで くらべて ', MI, 'よう。'];
    }
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
    if (q.type === 'tuto') texte = 'とばす';
    if (reglages.aide && !q.resolu) {
      if (q.type === 'libre' && !q.aligne) texte = 'そろえる';
      if (q.type === 'transvaser' && q.etape === 'avant') texte = 'うつす';
    }
    bouton.textContent = texte;
    bouton.hidden = !texte;
    $('btn-sais-pas').hidden = !reglages.aide || q.resolu || q.type === 'tuto';
  }

  function avancerAide() {
    const q = courante();
    if (q.type === 'tuto') {
      q.etape = q.etapes.length - 1;
      suivant();
      return;
    }
    if (q.resolu) return;
    if (q.type === 'libre') {
      aligner();
      $('retour').innerHTML = htmlMots(PHRASES.soroeta);
      $('retour').classList.remove('ok');
      parlerPuisRelancer(PHRASES.soroeta, q);
      majBoutonAide();
      return;
    }
    if (q.type === 'transvaser') {
      if (q.etape !== 'avant') return;
      q.etape = 'apres';
      rendreQuestion();
      const m = [ONAJI, 'じ コップに うつしたよ。 うつしても かさは かわらないよ。'];
      $('retour').innerHTML = htmlMots(m);
      $('retour').classList.remove('ok');
      parlerPuisRelancer(m, q);
      majBoutonAide();
    }
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
      sons.succes();
      resoudre(q, [...PHRASES.seikai, ...explication(q)], true);
      return;
    }

    q.essais.add(reponse);
    sons.oups();
    donnerAide(q, presque(q, reponse) ? ['おしい！ '] : ['もう いっかい！ '], reponse);
  }

  // « おしい » n'est vrai que si la réponse était presque juste (14 pour 15, deux longueurs très proches) ;
  // sinon on encourage sans exagérer : « もう いっかい！ ».
  function presque(q, reponse) {
    if (q.theme === 'kazu') {
      if (q.type === 'comparer') return Math.abs(q.valeurs[0] - q.valeurs[1]) <= 2;
      if (q.type === 'compteur') return false;
      return Math.abs(reponse - q.bonne) <= 1;
    }
    if (q.type === 'lecture') return Math.abs(reponse - q.bonne) <= (q.pas || 10);
    const mesure = (o) => (o ? (o.cm ?? o.val ?? o.ml) : null);
    const proches = (a, b) => a > 0 && b > 0 && Math.min(a, b) / Math.max(a, b) >= 0.85;
    if (q.type === 'tehon') return proches(mesure(q.objets[reponse]), mesure(q.modele));
    if (q.type === 'phrase') return proches(mesure(q.objets[0]), mesure(q.objets[1]));
    const liste = q.type === 'nombre' ? q.valeurs : q.objets;
    if (!Array.isArray(liste) || typeof reponse !== 'number') return false;
    return proches(mesure(liste[reponse]), mesure(liste[q.bonne]));
  }

  // Question résolue (trouvée, ou montrée après « わからない ») : explication, règle, preuve, つぎへ.
  function resoudre(q, message, trouve) {
    q.resolu = true;
    q.preuve = true;
    q.montree = !trouve;
    // Deviner / verser : la balance ou les verres identiques montrent pourquoi c'est juste.
    if (q.type === 'devine') q.etape = 'hakari';
    if (q.type === 'transvaser') q.etape = 'apres';
    q.messageFinal = message;
    $('retour').innerHTML = htmlMots(message);
    $('retour').classList.toggle('ok', trouve);
    afficherRappel(q);
    parler(message);
    // Même trouvé du premier coup, on montre pourquoi c'est juste.
    if ((q.type === 'nombre' || q.type === 'mesures') && q.aide < q.aideMax) {
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
  }

  // Après une erreur ou « わからない » : l'aide avance d'un cran (repères, balance, verres identiques,
  // conversion puis barres…), le conseil s'affiche et se dit, puis la question est reposée.
  function donnerAide(q, debut, erreur) {
    q.indices = true;
    if (erreur !== undefined) q.erreur = erreur;
    let message = q.type === 'tehon' ? PHRASES.oshiiTehon : PHRASES.oshii;
    if (q.type === 'libre') message = PHRASES.oshiiSoroe;
    if (estMV(q)) {
      // La balance se montre, ou l'on verse dans des verres identiques.
      if (q.type === 'devine' && q.etape === 'devine') q.etape = 'hakari';
      if (q.type === 'transvaser' && q.etape === 'avant') {
        q.etape = 'apres';
        q.versePourErreur = true;
      }
      message = q.type === 'mesures' ? regleMV(q.theme, q.demande) : messageErreurMV(q);
    }
    if (q.theme === 'kazu' && q.aide < q.aideMax) {
      q.aide += 1;
      message = aideKazu(q);
      rendreQuestion();
    } else if ((q.type === 'nombre' || q.type === 'mesures') && q.aide < q.aideMax) {
      q.aide += 1;
      message = messageAide(q);
      rendreQuestion();
    } else if (q.type === 'devine' || q.type === 'transvaser') {
      rendreQuestion();
    }
    message = [...debut, ...sansOshii(message)];
    $('retour').innerHTML = htmlMots(message);
    $('retour').classList.remove('ok');
    parlerPuisRelancer(message, q);
    rendreApresReponse(erreur);
    if (q.type === 'libre') {
      if (q.aligne) afficherReperesLibre(); else aligner();
    }
    majBoutonAide();
  }
  // Les conseils commencent souvent par « おしい！ » : on l'enlève (il est ajouté seulement après une erreur).
  function sansOshii(m) {
    const [premier, ...reste] = m;
    if (typeof premier !== 'string' || !premier.startsWith('おしい！')) return m;
    const suite = premier.slice('おしい！'.length).trimStart();
    return suite ? [suite, ...reste] : reste;
  }

  /* ----- Reposer la question après une aide -----
     Quand la voix a fini le conseil (« ぼうで くらべて みよう。 ») et que rien d'autre n'a été dit
     pendant 2,5 s, la question revient : « では、 どっちが みじかい？ ». */
  let minuteurRelance = 0;
  function parlerPuisRelancer(message, q) {
    clearTimeout(minuteurRelance);
    let numero = 0;
    parler(message, () => {
      if (paroles !== numero) return;
      clearTimeout(minuteurRelance);
      minuteurRelance = setTimeout(() => {
        if (paroles !== numero || q !== courante() || q.resolu || ecranActuel !== 'question') return;
        const relance = ['では、 ', ...consigneDe(q)];
        $('retour').insertAdjacentHTML('beforeend', ` ${htmlMots(relance)}`);
        parler(relance);
      }, 2500);
    });
    numero = paroles;
  }

  /* ----- わからない -----
     1re fois (et tant qu'il reste une aide : barres, balance, verres…) : « だいじょうぶ！ » et un conseil.
     Ensuite : la réponse, montrée avec sa preuve, sans reproche ; on passe à la suite avec つぎへ. */
  function nePasSavoir() {
    const q = courante();
    if (q.resolu) return;
    q.sansSavoir = (q.sansSavoir || 0) + 1;
    const resteAide = ((q.type === 'nombre' || q.type === 'mesures' || q.theme === 'kazu') && q.aide < q.aideMax)
      || (q.type === 'libre' && !q.aligne) || (q.type === 'transvaser' && q.etape === 'avant')
      || (q.type === 'devine' && q.etape === 'devine');
    if (q.sansSavoir === 1 || resteAide) {
      donnerAide(q, ['だいじょうぶ！ ']);
      return;
    }
    resoudre(q, ['こたえを ', MI, 'て みよう。 ', ...explication(q)], false);
  }

  function rendreApresReponse(erreur) {
    const q = courante();
    rendreProgression();
    if (estMV(q)) {
      cibles.forEach((c) => {
        c.el.classList.toggle('juste', q.resolu && c.index === q.bonne);
        c.el.classList.toggle('essaye', q.essais.has(c.index));
        if (erreur === c.index) {
          c.el.classList.remove('secoue');
          void c.el.offsetWidth;
          c.el.classList.add('secoue');
        }
      });
      return;
    }
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
    const q = courante();
    if (q.type === 'tuto' && q.etape < q.etapes.length - 1) {
      q.etape += 1;
      afficherQuestion();
      return;
    }
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
    const n = session.questions.filter((q) => q.type !== 'tuto').length;
    $('fin-titre').innerHTML = htmlMots(PHRASES.otsukare);
    const texte = [String(n), K('問', 'もん'), ' できたよ。'];
    $('fin-texte').innerHTML = htmlMots(texte);
    sons.fin();
    parler([...PHRASES.otsukare, ' ', ...texte]);
  }

  // Bouton 👆 dans chaque en-tête (accueil, question, べんきょう) : même état partout.
  const ICONE_LIRE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M9 12V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M12 10V8.5a1.5 1.5 0 0 1 3 0V12"/>'
    + '<path d="M15 11a1.5 1.5 0 0 1 3 0v4a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.7-2.3L4.6 16a1.6 1.6 0 0 1 2.5-2l1.9 2"/>'
    + '<path d="M17.5 2.5a5 5 0 0 1 2.5 4M16 4.6a2.6 2.6 0 0 1 1.3 2"/></svg>';
  function basculerLecture() {
    modeLecture = !modeLecture;
    document.body.classList.toggle('mode-lecture', modeLecture);
    document.querySelectorAll('.btn-lire').forEach((b) => b.setAttribute('aria-pressed', String(modeLecture)));
    parler(modeLecture ? ['さわった ところを よむよ。 もう いちど おすと、 もとに もどるよ。'] : ['もとに もどったよ。']);
  }
  function majBoutonsLire() {
    document.querySelectorAll('.btn-lire').forEach((b) => { b.hidden = !lectureActive(); });
    if (!lectureActive() && modeLecture) {
      modeLecture = false;
      document.body.classList.remove('mode-lecture');
    }
  }
  [['btn-parents', 'avant'], ['btn-ecouter', 'avant'], ['etude-ecouter', 'avant']].forEach(([id]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn-rond btn-lire';
    b.setAttribute('aria-label', 'さわった ところを よむ');
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = ICONE_LIRE;
    $(id).before(b);
    activable(b, basculerLecture, { garde: false });
  });
  majBoutonsLire();

  // Toucher une phrase ou un petit texte : on l'entend (sans déclencher autre chose).
  (() => {
    const LISIBLE = '.consigne, .rappel, .retour, .phrase, .equation, .titre-etude, .groupe-titre, .titre small, .reserve-titre, '
      + '.nom-mv, .balance-nom, .mesure-mv, .valeur-etude, .fin h2, .fin p, .rang-nom, .bulle-etude';
    let depart = null;
    document.addEventListener('pointerdown', (ev) => { depart = { x: ev.clientX, y: ev.clientY, t: performance.now() }; }, true);
    document.addEventListener('pointerup', (ev) => {
      if (!depart || !lectureActive()) return;
      const bouge = Math.hypot(ev.clientX - depart.x, ev.clientY - depart.y) > 12 || performance.now() - depart.t > 1500;
      depart = null;
      if (bouge || ev.target.closest('button, a, input, label, select, textarea, .zone-etude')) return;
      if (ev.target.closest('#ecran-parents, #ecran-photo')) return;
      const bloc = ev.target.closest('.phrase-lue') || ev.target.closest(LISIBLE);
      // Un bloc qui a sa propre phrase à dire (le rappel « 16 ＝ じゅうろく » → « この すうじは じゅうろく »).
      const avecParole = bloc && bloc.closest('[data-parole]');
      if (avecParole) lireElement(avecParole, avecParole.dataset.parole);
      else if (bloc) lireElement(bloc);
    }, true);
  })();

  activable($('btn-suivant'), suivant);
  activable($('btn-aide'), avancerAide);
  activable($('btn-sais-pas'), nePasSavoir);
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
    const lecon = Boolean(LECONS[mode]);
    $('ecran-etude').classList.toggle('mode-libre', mode === 'libre');
    $('ecran-etude').classList.toggle('mode-lecon', lecon);
    const plan = $('etude-plan');
    plan.classList.toggle('plan-verre', mode === 'verre');
    plan.classList.toggle('plan-lecon', lecon);
    plan.classList.remove('anime');
    plan.replaceChildren();
    // Les leçons ont leurs propres commandes ; les autres べんきょう retrouvent les boutons ±.
    $('choix-max').hidden = lecon && mode !== 'balance';
    $('lecon-choix').hidden = true;
    const commandes = $('etude-plus').parentElement;
    commandes.hidden = false;
    commandes.querySelectorAll('.btn-pas, .valeur-etude').forEach((x) => { x.hidden = false; });
    if (lecon) {
      montrer('etude');
      if (mode === 'balance') rendreChoixMax();
      demarrerLecon();
      return;
    }
    montrer('etude');
    rendreChoixMax();
    nouveauProbleme();
  }

  function nouveauProbleme() {
    const e = etude;
    const max = Number(reglages.nombreMax) || 20;
    const { petit } = pasBoutons();   // 1, ou 10 jusqu'à 1000 (nombres ronds en dizaines)
    e.resolu = false;
    // Jusqu'à 20, le 2e nombre reste un chiffre ; au-delà, il va jusqu'à la moitié de la limite.
    const pasMax = Math.floor((max <= 20 ? Math.min(9, max - 1) : max / 2) / petit);
    if (estEtudeMV()) {
      nouveauProblemeMV(e);
    } else if (e.mode === 'libre') {
      e.base = Math.round(max / 2 / petit) * petit;
      e.pas = null;
      e.cible = null;
    } else if (e.mode === 'plus') {
      e.pas = entier(1, pasMax) * petit;
      e.base = entier(1, Math.floor((max - e.pas) / petit)) * petit;
      e.cible = e.base + e.pas;
    } else {
      e.pas = entier(1, pasMax) * petit;
      e.base = entier(e.pas / petit + 1, Math.floor(max / petit)) * petit;
      e.cible = e.base - e.pas;
    }
    e.valeur = e.base;
    e.depart = e.base;
    $('etude-retour').textContent = '';
    $('etude-retour').classList.remove('ok');
    $('etude-suivant').hidden = true;
    if (estEtudeMV()) $('etude-plan').replaceChildren();
    rendreEtude();
    parler(consigneEtude(true));
  }

  // Pas des boutons et du glisser : ±1 et ±10, ou ±10 et ±100 quand on va jusqu'à 1000.
  function pasBoutons() {
    if (etude && etude.mode === 'verre') {
      return { petit: 10, grand: volumeMax() <= 200 ? 50 : 100, avecGrand: true };
    }
    const max = Number(reglages.nombreMax) || 20;
    return { petit: max >= 1000 ? 10 : 1, grand: max >= 1000 ? 100 : 10, avecGrand: max >= 50 };
  }

  const LIMITES = [10, 20, 50, 100, 1000];

  // Choix de la limite directement dans l'écran べんきょう.
  function rendreChoixMax() {
    const zone = $('choix-max');
    zone.replaceChildren();
    // Verre doseur : sa taille (200 mL, 500 mL, 1 L). Sinon : la limite des nombres.
    const verre = etude && etude.mode === 'verre';
    const cle = verre ? 'volumeMax' : 'nombreMax';
    const etiquette = document.createElement('span');
    etiquette.textContent = verre ? 'カップ：' : 'かず：';
    zone.append(etiquette);
    (verre ? LIMITES_VOLUME : LIMITES).forEach((v) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = verre ? (v >= 1000 ? '1\u00a0L' : `${v}\u00a0mL`) : `〜${v}`;
      b.setAttribute('aria-pressed', String(Number(reglages[cle]) === v));
      activable(b, () => {
        if (Number(reglages[cle]) === v) return;
        ecrireReglages({ [cle]: v });
        rendreChoixMax();
        if (estLecon()) demarrerLecon(); else nouveauProbleme();
      });
      zone.append(b);
    });
  }

  function bornesEtude() {
    if (etude.mode === 'verre') return [0, volumeMax()];
    const max = Number(reglages.nombreMax) || 20;
    if (etude.mode === 'plus') return [etude.base, max];
    if (etude.mode === 'moins') return [0, etude.base];
    return [0, max];
  }

  function consigneEtude(pourVoix) {
    const e = etude;
    if (estLecon()) return e.resolu && e.etape.bravo ? [...e.etape.dire, ' ', ...e.etape.bravo] : e.etape.dire;
    if (estEtudeMV()) return consigneEtudeMV();
    if (e.mode === 'libre') return ['テープを ひっぱって みよう。 ', SUJI, 'が かわるよ。'];
    const geste = e.mode === 'plus' ? ['みぎに ', String(e.pas), ' のばそう。'] : ['ひだりに ', String(e.pas), ' もどそう。'];
    if (!pourVoix) return geste;
    const op = e.mode === 'plus' ? ' たす ' : ' ひく ';
    return [String(e.base), op, String(e.pas), ' は いくつ？ ', ...geste];
  }

  // Code couleur, le même partout : 1er nombre et ruban de départ en bleu, « ＋ n » et les blocs
  // ajoutés en vert, « − n » et les blocs retirés en violet, le résultat en pastille comme la bulle.
  function equationEtude() {
    const e = etude;
    if (estEtudeMV()) return equationEtudeMV();
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
    if (e.mode === 'libre' || estEtudeMV()) return htmlMots(consigneEtude(false));
    const [debut, fin, classe] = e.mode === 'plus' ? ['みぎに', 'のばそう。', 'terme-plus'] : ['ひだりに', 'もどそう。', 'terme-moins'];
    return `<span class="mot">${debut}</span> <span class="mot ${classe}">${e.pas}</span> <span class="mot">${fin}</span>`;
  }

  function rendreEtude() {
    if (!etude || ecranActuel !== 'etude') return;
    if (estLecon()) {
      rendreLecon();
      return;
    }
    const e = etude;
    const activite = ACTIVITES.find((a) => a.etude === e.mode);
    const compte = e.mode === 'libre' ? '' : `<small>${e.index + 1} / ${e.total}</small>`;
    $('etude-titre').innerHTML = htmlMots(activite.titre) + compte;
    $('etude-consigne').innerHTML = consigneEtudeHtml();
    const plan = $('etude-plan');
    if (estEtudeMV()) {
      // Redessiné entièrement (taille de l'écran) : sans animation.
      plan.classList.remove('anime');
      plan.replaceChildren();
      dessinerEtudeMV();
      return;
    }
    plan.replaceChildren();
    const max = Number(reglages.nombreMax) || 20;
    const x0 = 27;
    const ppc = Math.max(0.1, (plan.clientWidth - x0 - 50) / max);
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
    // Taille d'un bloc : jusqu'à 20, des blocs de 1 (s'ils sont assez larges pour être numérotés) ;
    // au-delà, des paquets de 10 (la « dizaine » des manuels), ou de 100 quand 10 serait trop étroit.
    const limite = Number(reglages.nombreMax) || 20;
    const grain = limite <= 20 ? (ppc >= 16 ? 1 : 10) : ([10, 100].find((g) => g * ppc >= 18) || 100);
    const numeros = grain * ppc >= 18;
    // Dans un paquet, les unités (ou les dizaines) restent visibles par de fines lignes, comme
    // une réglette de 10 : on voit à la fois le paquet et ce qu'il contient.
    const sousUnite = [1, 10].filter((u) => u < grain && u * ppc >= 5).pop();
    // Quand les numéros sont plus larges que les paquets (1000 sur un petit téléphone), on n'écrit
    // que le dernier de chaque couleur, souligné : la règle juste en dessous donne les autres.
    const saut = grain * ppc >= String(limite).length * 8 + 4 ? 1 : 2;

    const segment = (de, a, classe) => {
      if (a <= de) return null;
      const el = document.createElement('span');
      el.className = classe;
      el.style.left = `${x0 + de * ppc}px`;
      el.style.width = `${(a - de) * ppc}px`;
      el.style.top = `${y - haut / 2}px`;
      el.style.height = `${haut}px`;
      if (sousUnite && classe.includes('bloc-cm')) el.style.setProperty('--sous', `${sousUnite * ppc}px`);
      couche.append(el);
      return el;
    };

    // Découpe [de, a) en paquets de « grain », depuis le début ou depuis la fin. Un paquet à cheval
    // sur « coupe » (la cible) est coupé en deux : la partie en trop change de couleur.
    const paquets = (de, a, depuisFin, coupe) => {
      const liste = [];
      if (a <= de) return liste;
      if (depuisFin) for (let q = a; q > de; q -= grain) liste.push([Math.max(de, q - grain), q]);
      else for (let p = de; p < a; p += grain) liste.push([p, Math.min(a, p + grain)]);
      if (coupe === undefined || coupe <= de || coupe >= a) return liste;
      return liste.flatMap(([p, q]) => (p < coupe && q > coupe ? [[p, coupe], [coupe, q]] : [[p, q]]));
    };

    const ecrire = (el, texte, classe, souligne) => {
      const n = document.createElement('span');
      n.className = classe;
      if (souligne) n.classList.add('numero-fin');
      n.textContent = texte;
      el.append(n);
    };

    // Numéro écrit sous le ruban, centré sous un paquet. Le plus grand numéro d'une couleur est
    // souligné : c'est le nombre de l'opération.
    const sous = (p, q, texte, couleur, souligne) => {
      const n = document.createElement('span');
      n.className = `numero-sous${grain * ppc < 40 ? ' petit' : ''}${souligne ? ' numero-fin' : ''}`;
      n.style.left = `${x0 + ((p + q) / 2) * ppc}px`;
      n.style.top = `${y + haut / 2 + 4}px`;
      n.style.color = couleur;
      n.textContent = texte;
      couche.append(n);
    };

    // Départ (bleu) ou partie ajoutée (vert) : comptés 1, 2, 3… ou 10, 20, 30… depuis leur début.
    const ecrit = (k, n) => k === n - 1 || saut === 1;
    const blocs = (de, a, classeDe, couleur, signe, coupe) => {
      const liste = paquets(de, a, false, coupe);
      liste.forEach(([p, q], k) => {
        const classe = classeDe(p);
        segment(p, q, `${classe} bloc-cm`);
        if (numeros && ecrit(k, liste.length)) sous(p, q, String(q - de), classe.includes('trop') ? 'var(--o5)' : couleur, q === a);
      });
      if (!numeros && a > de) sous(de, a, `${signe}${a - de}`, couleur, false);
    };

    const depart = (jusque) => blocs(0, jusque, () => 'ruban-base', 'var(--o2)', '');

    // Soustraction : le 1er nombre reste compté en bleu sous tout le ruban de départ (pointillés
    // compris), et les blocs retirés portent leur numéro violet à l'intérieur, depuis le bout.
    // Ce qui reste est donné par la bulle et le résultat.
    const retrait = (reste, total, classeDe, coupe) => {
      const retires = total - reste;
      paquets(0, reste, false).forEach(([p, q]) => segment(p, q, 'ruban-base bloc-cm'));
      const retireListe = paquets(reste, total, true, coupe);
      retireListe.forEach(([p, q], k) => {
        const el = segment(p, q, `${classeDe(p)} bloc-cm`);
        if (numeros && ecrit(k, retireListe.length)) {
          ecrire(el, String(total - p), `numero-dedans${grain * ppc < 40 ? ' petit' : ''}`, total - p === retires);
        }
      });
      if (numeros) {
        const tout = paquets(0, total, false);
        tout.forEach(([p, q], k) => { if (ecrit(k, tout.length)) sous(p, q, String(q), 'var(--o2)', q === total); });
      } else {
        sous(0, total, String(total), 'var(--o2)', false);
        if (retires > 0) ecrire(segment(reste, total, 'zone-compte'), `−${retires}`, 'numero-dedans');
      }
    };

    if (e.mode === 'plus') {
      depart(e.base);
      blocs(e.base, e.valeur, (p) => (p >= e.cible ? 'ruban-ajout trop' : 'ruban-ajout'), 'var(--o3)', '＋', e.cible);
    } else if (e.mode === 'moins') {
      retrait(e.valeur, e.base, (p) => (p < e.cible ? 'ruban-retire trop' : 'ruban-retire'), e.cible);
    } else if (e.valeur >= e.depart) {
      depart(e.depart);
      blocs(e.depart, e.valeur, () => 'ruban-ajout', 'var(--o3)', '＋');
    } else {
      retrait(e.valeur, e.depart, () => 'ruban-retire');
    }

    // Un paquet incomplet (350 = 3 centaines et 50) est étroit : son numéro pourrait toucher le
    // suivant. Les numéros soulignés passent d'abord (décalés vers la droite s'ils se touchent),
    // les autres s'effacent s'ils gênent.
    const marge = 4;
    const places = [];
    const etiquettes = [...couche.querySelectorAll('.numero-sous')];
    etiquettes.filter((n) => n.classList.contains('numero-fin')).forEach((n) => {
      let r = n.getBoundingClientRect();
      const avant = places.filter((g) => r.left < g.right + marge && r.right > g.left - marge);
      if (avant.length) {
        const decalage = Math.max(...avant.map((g) => g.right)) + marge - r.left;
        n.style.left = `${parseFloat(n.style.left) + decalage}px`;
        r = n.getBoundingClientRect();
      }
      places.push(r);
    });
    etiquettes.filter((n) => !n.classList.contains('numero-fin')).forEach((n) => {
      const r = n.getBoundingClientRect();
      if (places.some((g) => r.left < g.right + 2 && r.right > g.left - 2)) n.remove();
      else places.push(r);
    });

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

    majCommandesEtude();
  }

  // Nombre affiché, égalité, boutons (pas de ±1 / ±10…, grisés aux bornes), bouton つぎへ.
  function majCommandesEtude() {
    const e = etude;
    const mv = estEtudeMV();
    const unite = e.mode === 'verre' ? `\u00a0${uniteHtml('ml')}` : '';
    $('etude-valeur').innerHTML = `${e.valeur}${unite}`;
    $('etude-equation').innerHTML = equationEtude();
    const [min, max] = bornesEtude();
    const { petit, grand, avecGrand } = pasBoutons();
    $('etude-moins').textContent = `−${petit}`;
    $('etude-plus').textContent = `＋${petit}`;
    $('etude-moins-grand').textContent = `−${grand}`;
    $('etude-plus-grand').textContent = `＋${grand}`;
    const [moins, plus] = mv ? ['へらす', 'ふやす'] : ['もどす', 'のばす'];
    $('etude-moins').setAttribute('aria-label', petit === 1 ? `ひとつ ${moins}` : `${petit} ${moins}`);
    $('etude-plus').setAttribute('aria-label', petit === 1 ? `ひとつ ${plus}` : `${petit} ${plus}`);
    $('etude-moins-grand').setAttribute('aria-label', `${grand} ${moins}`);
    $('etude-plus-grand').setAttribute('aria-label', `${grand} ${plus}`);
    $('etude-moins-grand').hidden = !avecGrand;
    $('etude-moins-grand').parentElement.classList.toggle('avec-grand', avecGrand);
    $('etude-plus-grand').hidden = !avecGrand;
    $('etude-moins').disabled = e.resolu || e.valeur <= min;
    $('etude-plus').disabled = e.resolu || e.valeur >= max;
    $('etude-moins-grand').disabled = e.resolu || e.valeur <= min;
    $('etude-plus-grand').disabled = e.resolu || e.valeur >= max;
    $('etude-suivant').hidden = !e.resolu || e.mode === 'libre';
  }

  // Change la valeur d'un cran : petit son (plus aigu en montant), vibration sur Android.
  function changerValeur(v, voix) {
    const [min, max] = bornesEtude();
    const nouvelle = Math.max(min, Math.min(max, v));
    if (nouvelle === etude.valeur) return false;
    const monte = nouvelle > etude.valeur;
    etude.valeur = nouvelle;
    const hauteur = estEtudeMV() ? (nouvelle / max) * 60 : Math.min(nouvelle, 60);
    note((monte ? 440 : 400) + hauteur * 9, { duree: 0.08, volume: 0.09, type: 'triangle' });
    if (reglages.sons && navigator.vibrate) navigator.vibrate(8);
    if (estEtudeMV()) dessinerEtudeMV(); else dessinerRuban();
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
    if (estEtudeMV()) {
      verifierEtudeMV(parlerSiRien);
      return;
    }
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
    const message = estEtudeMV() ? reussirEtudeMV() : [...PHRASES.seikai, String(e.base), op, String(e.pas), ' は ', String(e.cible), '。'];
    messageEtude(message, true);
    parler(message);
    if (estEtudeMV()) dessinerEtudeMV(); else dessinerRuban();
  }

  /* ======================================================================
     べんきょう おもさ : équilibrer un objet avec des cubes (つみき) ou des poids.
     べんきょう かさ : remplir un verre doseur (glisser vers le haut ou le bas).
     ====================================================================== */

  const LIMITES_VOLUME = [200, 500, 1000];
  const estEtudeMV = () => Boolean(etude && etude.mode === 'verre');
  const enTsumiki = () => (Number(reglages.nombreMax) || 20) <= 20;
  const volumeMax = () => Number(reglages.volumeMax) || 500;
  // Le verre doseur est un peu plus haut que sa dernière graduation.
  const hauteurVerre = () => volumeMax() * 1.12;

  // Verre doseur : d'abord vide ; ensuite il contient déjà quelque chose (on ajoute ou on enlève).
  function nouveauProblemeMV(e) {
    const cap = volumeMax();
    const fin = cap >= 1000 ? 50 : 10;
    const n = cap / fin;
    e.cible = entier(Math.ceil(n * 0.15), n) * fin;
    if (e.index < Math.ceil(e.total / 2)) {
      e.base = 0;
    } else {
      do { e.base = entier(1, n - 1) * fin; } while (Math.abs(e.base - e.cible) < fin * 2);
    }
    e.etat = null;
  }


  function consigneEtudeMV() {
    const e = etude;
    if (!e.base) return [segU(e.cible, 'ml'), ' いれよう。'];
    return ['いま ', segU(e.base, 'ml'), '。 ', segU(e.cible, 'ml'), 'に しよう。'];
  }

  function equationEtudeMV() {
    const e = etude;
    const d = e.cible - e.base;
    const signe = d > 0 ? '＋' : '−';
    const delta = e.resolu
      ? `<span class="${d > 0 ? 'terme-plus' : 'terme-moins'}">${signe}${Math.abs(d)}</span>`
      : `<span class="${d > 0 ? 'terme-plus' : 'terme-moins'}">${signe}</span> ？`;
    return `<span class="terme-base">${e.base}</span> ${delta} → <span class="resultat">${e.cible}</span> ${uniteHtml('ml')}`;
  }

  function dessinerEtudeMV() {
    const plan = $('etude-plan');
    dessinerEtudeVerre(plan);
    majCommandesEtude();
  }

  function dessinerEtudeVerre(plan) {
    const e = etude;
    const cap = hauteurVerre();
    let v = plan.querySelector('.verre');
    if (!v || Number(plan.dataset.cap) !== cap) {
      plan.replaceChildren();
      plan.dataset.cap = String(cap);
      const H = plan.clientHeight;
      const W = plan.clientWidth;
      // Le verre prend presque toute la hauteur ; à droite : la poignée puis la bulle (≈ 150 px).
      const h = Math.max(100, H - 26);
      const w = Math.max(64, Math.min(200, W * 0.3, h * 0.72));
      const gauche = Math.max(48, Math.min((W - w) / 2, W - w - 150));
      v = creerVerreGradue(w, h, e.valeur, cap, volumeMax(), 'var(--eau)');
      v.style.position = 'absolute';
      v.style.left = `${gauche}px`;
      v.style.top = `${H - h - 12}px`;
      const poignee = document.createElement('span');
      poignee.className = 'poignee-etude poignee-verre';
      poignee.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 8l5-5 5 5M7 16l5 5 5-5M12 3v18"/></svg>';
      const bulle = document.createElement('span');
      bulle.className = 'bulle-etude bulle-verre';
      plan.append(v, poignee, bulle);
      e.geo = { ppm: (h - 4) / cap, bas: H - 12 - 4, gauche, w };
      requestAnimationFrame(() => requestAnimationFrame(() => plan.classList.add('anime')));
    }
    const { ppm, bas, gauche, w } = e.geo;
    const y = bas - e.valeur * ppm;
    v.querySelector('.liquide').style.height = `${(e.valeur / cap) * 100}%`;
    const poignee = plan.querySelector('.poignee-verre');
    poignee.style.left = `${gauche + w}px`;
    poignee.style.top = `${y}px`;
    const bulle = plan.querySelector('.bulle-verre');
    bulle.textContent = `${e.valeur} mL`;
    // À droite de la poignée, à la hauteur du niveau (sans la cacher).
    bulle.style.left = `${gauche + w + 62}px`;
    bulle.style.top = `${y - 19}px`;
    plan.querySelectorAll('.ecart').forEach((x) => x.remove());
    if (e.resolu && e.base) {
      const yBase = bas - e.base * ppm;
      const d = e.cible - e.base;
      dessinerEcart(plan, gauche + 4, gauche + w - 4, Math.min(y, yBase), Math.abs(yBase - y), Math.abs(d),
        `${d > 0 ? '＋' : '−'}${Math.abs(d)}`, d > 0 ? 'ecart-plus' : 'ecart-moins');
    }
  }

  function verifierEtudeMV(parlerSiRien) {
    const e = etude;
    if (e.valeur === e.cible) {
      reussirEtude();
      return;
    }
    const ecart = segU(Math.abs(e.valeur - e.cible), 'ml');
    const remplir = e.cible > e.base;
    let message;
    let trop = false;
    if (e.valeur < e.cible) {
      trop = !remplir;
      message = remplir ? ['あと ', ecart, ' いれよう。'] : ['すてすぎ！ ', ecart, ' いれよう。'];
    } else {
      trop = remplir;
      message = remplir ? ['いれすぎ！ ', ecart, ' すてよう。'] : ['あと ', ecart, ' すてよう。'];
    }
    messageEtude(message);
    if (trop || parlerSiRien) parler(message);
  }

  function reussirEtudeMV() {
    const e = etude;
    let message;
    if (!e.base) {
      message = [...PHRASES.seikai, segU(e.cible, 'ml'), '。'];
    } else {
      const d = e.cible - e.base;
      message = [...PHRASES.seikai, segU(e.base, 'ml'), d > 0 ? ' たす ' : ' ひく ', segU(Math.abs(d), 'ml'), ' は ', segU(e.cible, 'ml'), '。'];
    }
    return message;
  }

  /* ======================================================================
     Leçons guidées
     べんきょう (la balance de cuisine, l'instrument principal) :
     - はかりの よみかた : l'aiguille tourne quand on ajoute des poids, revient quand on
       les enlève ; grandes et petites graduations ; lire, puis composer une masse.
     - g と kg : 1円玉 = 1 g, 10 × 1 g = 10 g, 10 × 10 g = 100 g, 10 × 100 g = 1 kg.
     - はかって みよう : entraînement (poser des poids pour que l'aiguille montre … g).
     ね、しっていた？ (むかしは…) :
     - てんびん : la balance à plateaux, « つりあう », poids identiques (おもり 3こ ぶん) ;
     - もんめ : 5円玉 = 1 匁 = 3,75 g ; - からだで はかる : あた, ひろ, et pourquoi le cm ;
     - しゃくと すん : 1 寸 ≈ 3 cm (一寸法師), 1 尺 ≈ 30 cm ; - ごうと しょう : 1 合 = 180 mL.
     À chaque étape : une consigne lue, une action (poser ou enlever, ou choisir un nombre),
     puis une explication ; つぎへ passe à l'étape suivante.
     ====================================================================== */

  // Ce qu'on pose sur les plateaux. Les masses (m) sont données par chaque étape.
  const VISUELS = {
    ringo: { genre: 'chose', c: 'りんご' },
    ichigo: { genre: 'chose', c: 'いちご' },
    booru: { genre: 'chose', c: 'ボール' },
    hon: { genre: 'chose', c: 'ほん' },
    omori: { genre: 'fundou', taille: 1, texte: '', nom: ['おもり'] },
    yen1: { genre: 'yen', nom: ['1えんだま'] },
    g1: { genre: 'fundou', taille: 0.66, texte: '1g', unite: 1, nom: [segU(1, 'g'), 'の おもり'] },
    tsumiki: { genre: 'tsumiki', nom: ['つみき'] },
    g10: { genre: 'fundou', taille: 0.78, texte: '10g', unite: 10, nom: [segU(10, 'g'), 'の おもり'] },
    g100: { genre: 'fundou', taille: 1.05, texte: '100g', unite: 100, nom: [segU(100, 'g'), 'の おもり'] },
    kg1: { genre: 'fundou', taille: 1.7, texte: '1kg', unite: 1000, nom: [segU(1, 'kg'), 'の おもり'] },
    yen5: { genre: 'yen5', nom: ['5えんだま'] },
    monme1: { genre: 'fundou', taille: 0.75, texte: '1匁', nom: ['1もんめの おもり'] },
    monme10: { genre: 'fundou', taille: 1.25, texte: '10匁', nom: ['10もんめの おもり'] },
    okome: { genre: 'sac', texte: 'おこめ 1kg', nom: ['おこめ ', segU(1, 'kg')] },
    gou: { genre: 'gou', nom: ['1ごうの カップ'] },
    pion: { genre: 'pion', nom: ['●'] },
    dix: { genre: 'barre', nom: ['10の まとまり'] },
    cent: { genre: 'plaque', nom: ['100の いた'] },
    teEnfant: { genre: 'main', taille: 0.8, nom: ['こどもの て'] },
    teAdulte: { genre: 'main', taille: 1.15, nom: ['おとなの て'] },
  };
  const enG = (x) => segU(x, 'g');
  const enKg = (x) => segU(x, 'kg');
  const P = (v, m, n = 1) => ({ v, m, n });
  const somme = (liste) => liste.reduce((s, p) => s + p.m, 0);
  const nomVisuel = (v) => (VISUELS[v].genre === 'chose' ? [nomDe(chose(VISUELS[v].c))] : VISUELS[v].nom);
  const MAX_HAKARI = 500;
  const sceneDe = (et) => et.scene || (et.hakari ? 'hakari' : 'balance');

  const equilibre = (e) => Math.abs(somme(e.cotes[0]) - somme(e.cotes[1])) < 1e-9;
  const unePose = (e) => e.cotes[e.etape.vers].length > 0;

  // てんびん (むかしの はかり) : à partir des poids identiques, les masses sont en g (おもり 1こ ＝ 100 g).
  function etapesBalance() {
    const g100 = (n) => P('g100', 100, n);
    return [
      {
        dire: ['これは てんびん。 むかしは これで ', OMO, 'さを くらべたり はかったり したよ。 いまでも りかの じっけんで つかう。 なにも のって いない とき、 てんびんは まっすぐ。 まんなかの はりも まんなかを さして いる。'],
        balance: [[], []],
      },
      {
        dire: ['りんごを さわって、 ひだりの さらに のせよう。'],
        balance: [[], []], reserve: [P('ringo', 300)], vers: 0, fini: unePose,
        bravo: ['りんごを のせた ほうが ', SAGA, 'がったね。 りんごの ', OMO, 'さで ', SAGA, 'がったよ。'],
      },
      {
        dire: ['もう ひとつの りんごを、 みぎの さらに のせよう。'],
        balance: [[P('ringo', 300)], []], reserve: [P('ringo', 300)], vers: 1, fini: unePose,
        bravo: ['まっすぐに なった！ ', ONAJI, 'じ ', OMO, 'さだと まっすぐ。 これを「つりあう」と いうよ。'],
      },
      {
        dire: ['こんどは いちごを、 みぎの さらに のせよう。'],
        balance: [[P('ringo', 300)], []], reserve: [P('ichigo', 20)], vers: 1, fini: unePose,
        bravo: ['りんごの ほうが ', SAGA, 'がった。 ', SAGA, 'がった ほうが ', OMO, 'い。 いちごの ほうは ', AGA, 'がった。 ', AGA, 'がった ほうが ', KARU, 'い。'],
      },
      {
        dire: ['ひだりと みぎを かえて みよう。 りんごを みぎの さらに のせよう。'],
        balance: [[P('ichigo', 20)], []], reserve: [P('ringo', 300)], vers: 1, fini: unePose,
        bravo: ['こんどは みぎが ', SAGA, 'がった。 ひだりでも みぎでも、 ', OMO, 'い ほうが ', SAGA, 'がるよ。'],
      },
      {
        dire: ['これは おもり。 ぜんぶ ', ONAJI, 'じ ', OMO, 'さ だよ。 りんごと つりあう まで、 おもりを みぎに のせよう。'],
        balance: [[P('ringo', 300)], []], reserve: [P('omori', 100, 6)], vers: 1, retirer: true, fini: equilibre,
        bravo: ['つりあった！ この りんごは おもり 3こ ぶんの ', OMO, 'さ。'],
      },
      {
        dire: ['この おもりは 1こ ', segU(100, 'g'), '。 この りんごは ', segU('なん', 'g'), '？'],
        balance: [[P('ringo', 300)], [g100(3)]], cache: true,
        choix: { options: [300, 3, 100], bonne: 300, indice: ['おしい！ ', segU(100, 'g'), 'の おもりが 3こ。 100 ＋ 100 ＋ 100 は？'] },
        bravo: ['100 ＋ 100 ＋ 100 ＝ 300。 100 × 3 ＝ 300 でも いいね。 この りんごは ', segU(300, 'g'), '。'],
      },
      {
        dire: ['こんどは ボール。 おもりを のせて、 つりあわせよう。'],
        balance: [[P('booru', 500)], []], reserve: [P('omori', 100, 8)], vers: 1, retirer: true, fini: equilibre,
        bravo: ['つりあった！ この ボールは おもり 5こ ぶん。'],
      },
      {
        dire: ['おもりは 1こ ', segU(100, 'g'), '。 この ボールは ', segU('なん', 'g'), '？'],
        balance: [[P('booru', 500)], [g100(5)]], cache: true,
        choix: { options: [500, 5, 100], bonne: 500, indice: ['おしい！ ', segU(100, 'g'), 'の おもりが 5こ だよ。'] },
        bravo: ['100が 5つで 500。 この ボールは ', segU(500, 'g'), '。 りんごより ', OMO, 'いね。'],
      },
      {
        dire: ['べつの りんごを はかろう。 ', segU(100, 'g'), 'と ', segU(10, 'g'), 'の おもりを つかってね。'],
        balance: [[P('ringo', 320)], []], reserve: [P('g100', 100, 4), P('g10', 10, 9)], vers: 1, retirer: true, fini: equilibre,
        bravo: ['つりあった！ ', segU(100, 'g'), 'が 3こで ', segU(300, 'g'), '、 ', segU(10, 'g'), 'が 2こで ', segU(20, 'g'), '。 この りんごは ', segU(320, 'g'), '。 さっきの りんごより ', segU(20, 'g'), ' ', OMO, 'い。 りんごに よって ', OMO, 'さは ちがうね。'],
      },
      {
        dire: ['たしかめよう。 りんご（', segU(300, 'g'), '）と ボール（', segU(500, 'g'), '）を のせたよ。 ボールの ほうが ', SAGA, 'がったね。 ', SUJI, 'が ', OOKI, 'きい ほうが ', OMO, 'い！'],
        balance: [[P('ringo', 300)], [P('booru', 500)]],
      },
    ];
  }

  // g と kg, sur la balance de cuisine : 1 g bouge à peine l'aiguille ; 10, 100, 1000 g.
  function etapesUnites() {
    const total = (e) => somme(e.plateau);
    return [
      {
        dire: ['1えんだま 1こは ちょうど ', enG(1), '。 ', V('g（グラム）', 'グラム'), 'は ', OMO, 'さの たんい だよ。 ', enG(1), 'は とても ', KARU, 'いので、 はりは ほとんど うごかないね。'],
        hakari: [P('yen1', 1)],
      },
      {
        dire: ['1えんだまを のせて、 ぜんぶで 10こに しよう。'],
        hakari: [P('yen1', 1)], reserve: [P('yen1', 1, 9)], vers: 'plateau', retirer: true, fini: (e) => total(e) === 10,
        bravo: [enG(1), 'が 10こで ', enG(10), '。 はりが ちいさい めもり 1つ ぶん うごいた。'],
      },
      {
        dire: ['こんどは ', enG(10), 'の おもりを 10こ のせよう。'],
        hakari: [], reserve: [P('g10', 10, 10)], vers: 'plateau', retirer: true, fini: (e) => total(e) === 100,
        bravo: [enG(10), 'が 10こで ', enG(100), '。'],
      },
      {
        dire: [enG(100), 'の おもりを 5こ のせよう。'],
        hakari: [], reserve: [P('g100', 100, 5)], vers: 'plateau', retirer: true, fini: (e) => total(e) === 500,
        bravo: [enG(100), 'が 5こで ', enG(500), '。 この はかりの いちばん ', OOKI, 'きい めもり。'],
      },
      {
        dire: [OOKI, 'きい はかりに かえたよ（', segU(2, 'kg'), ' まで）。 ', enG(100), 'の おもりを 10こ のせよう。'],
        hakari: [], max: 2000, reserve: [P('g100', 100, 10)], vers: 'plateau', retirer: true, fini: (e) => total(e) === 1000,
        bravo: [enG(100), 'が 10こで ', enG(1000), '。 ', enG(1000), 'を ', segU(1, 'kg'), 'と いうよ。'],
      },
      {
        dire: ['おこめの ふくろを のせたよ。 はりは ', segU('なん', 'g'), '？'],
        hakari: [P('okome', 1000)], max: 2000, choix: { options: [1000, 100, 10], bonne: 1000 },
        bravo: ['はりは 1000を さして いる。 おこめは ', enG(1000), '、 つまり ', enKg(1), '。'], cache: true,
      },
      {
        dire: ['まとめ： ', enKg(1), ' ＝ ', enG(1000), '。 ', V('g も kg も', 'グラムも キログラムも'), ' ', OMO, 'さの たんい。 ', ONAJI, 'じ たんいなら、 ', SUJI, 'が ', OOKI, 'きい ほうが ', OMO, 'い。'],
        hakari: [P('g100', 100, 10)], max: 2000,
      },
    ];
  }

  // Entraînement : poser des poids pour que l'aiguille montre une masse donnée.
  // つりあわせよう : un objet à gauche ; on touche un bac pour poser une つみき (jusqu'à 20) ou une おもり
  // (1 g et 10 g, ou 10 g et 100 g jusqu'à 1000) ; toucher un poids sur le plateau le remet dans le bac.
  // Les poids sont rangés par 5 (10 = 5 + 5), une sorte par rangée, les plus lourds en bas.
  function etapesTsuriawase() {
    const n = Number(reglages.nbQuestions) || 6;
    const max = Number(reglages.nombreMax) || 20;
    const cubes = enTsumiki();
    const { petit, grand } = pasBoutons();
    const poids = { 1: 'g1', 10: 'g10', 100: 'g100' };
    let avant = null;
    return Array.from({ length: n }, () => {
      const autre = (c) => !avant || c.yomi !== avant.yomi;
      let objet;
      let cible;
      if (cubes) {
        // Une unité choisie (« つみき なんこ ぶん »), avec des objets assez lourds pour en demander plusieurs.
        objet = choisir(CHOSES.filter((c) => c.val >= 100 && autre(c)));
        cible = entier(2, max);
      } else {
        // Un objet dont le vrai poids tient dans la limite, à 15 % près (une tomate ne pèse pas 18 g).
        const possibles = CHOSES.filter((c) => c.val >= Math.max(petit * 2, max / 20) && c.val <= max && autre(c));
        objet = choisir(possibles.length ? possibles : CHOSES.filter((c) => c.val <= max));
        cible = Math.max(petit, Math.min(max, Math.round((objet.val * aleatoire(0.85, 1.15)) / petit) * petit));
      }
      avant = objet;
      const nom = nomDe(objet);
      return {
        dire: [nom, 'と つりあう ように、 ', cubes ? 'つみき' : 'おもり', 'を のせよう。'],
        balance: [[{ v: 'objet', c: objet, m: cible }], []],
        reserve: cubes ? [P('tsumiki', 1, max)]
          : [P(poids[grand], grand, Math.min(10, Math.floor(max / grand) + 1)), P(poids[petit], petit, 10)],
        bac: true, vers: 1, retirer: true, fini: equilibre,
        compter: reglages.compter === false ? false : (cubes ? true : 'g'),
        bravo: cubes
          ? ['つりあった！ この ', nom, 'は つみき ', String(cible), 'こ ぶんの ', OMO, 'さ。']
          : ['つりあった！ この ', nom, 'は ', segU(cible, 'g'), '。'],
      };
    });
  }

  function etapesPratique() {
    const n = Number(reglages.nbQuestions) || 6;
    return Array.from({ length: n }, (_, k) => {
      const cible = k === 0 || k === n - 1 ? entier(1, 4) * 100 : entier(5, 48) * 10;
      return {
        dire: ['はかりが ', enG(cible), 'を さす ように、 おもりを のせよう。'],
        hakari: [], reserve: [P('g100', 100, 4), P('g10', 10, 9)], vers: 'plateau', retirer: true, cache: true,
        fini: (e) => somme(e.plateau) === cible,
        pendant: (e) => {
          const t = somme(e.plateau);
          return t < cible ? ['あと ', enG(cible - t), '。'] : [OMO, 'すぎ！ ', enG(t - cible), ' おろそう。'];
        },
        bravo: ['できた！ ', ...lectureHakari(cible)],
      };
    });
  }

  // もんめ : l'ancienne unité ; la pièce de 5 円 pèse exactement 1 匁 (3,75 g).
  function etapesMonme() {
    return [
      {
        dire: ['むかしの にほんでは、 ', OMO, 'さを 「もんめ」で あらわしたよ。 5えんだま 1こが ちょうど 1もんめ。 てんびんで くらべると、 つりあうね。'],
        balance: [[P('monme1', 3.75)], [P('yen5', 3.75)]],
      },
      {
        dire: ['10もんめの おもりと つりあう まで、 5えんだまを みぎに のせよう。'],
        balance: [[P('monme10', 37.5)], []], reserve: [P('yen5', 3.75, 12)], vers: 1, retirer: true, fini: equilibre,
        bravo: ['5えんだま 10こで つりあった。 10もんめは ', segU(37.5, 'g'), '。'],
      },
      {
        dire: ['1000もんめで 1かん（', segU(3.75, 'kg'), '）。 いまでも しんじゅ（パール）は もんめで はかるよ。 5えんだまを みたら、 おもいだしてね。'],
        balance: [[P('monme10', 37.5)], [P('yen5', 3.75, 10)]],
      },
    ];
  }

  // からだで はかる : あた (empan) d'un enfant et d'un adulte sur le même bureau, puis la règle.
  const BUREAU = 72;
  function etapesCorps() {
    const mains = (e, v) => somme(e.plateau.filter((p) => p.v === v));
    return [
      {
        dire: ['むかしは ものさしが なかった。 からだで ', NAGA, 'さを はかったよ。 おやゆびと なかゆびを ひろげた ', NAGA, 'さを 「あた」と いう。'],
        scene: 'corps', contenu: [],
      },
      {
        dire: ['こどもの てで、 つくえの ', NAGA, 'さを はかろう。 て を さわって、 ならべよう。'],
        scene: 'corps', contenu: [], reserve: [P('teEnfant', 12, 8)], vers: 'plateau', fini: (e) => mains(e, 'teEnfant') >= BUREAU,
        bravo: ['つくえは こどもの あた 6つ ぶん。'],
      },
      {
        dire: ['こんどは おとなの てで はかろう。'],
        scene: 'corps', contenu: [P('teEnfant', 12, 6)], reserve: [P('teAdulte', 18, 6)], vers: 'plateau', fini: (e) => mains(e, 'teAdulte') >= BUREAU,
        bravo: ['おとなの あた 4つ ぶん。 こどもは 6つ、 おとなは 4つ。 ', ONAJI, 'じ つくえ なのに、 ', SUJI, 'が ちがうね。'],
      },
      {
        dire: ['ひとに よって ちがうと こまるね。 だから、 だれが はかっても ', ONAJI, 'じに なる 「cm」や 「m」が つくられたよ。 つくえは ', segU(72, 'cm'), '。'],
        scene: 'corps', regle: true, contenu: [P('teEnfant', 12, 6), P('teAdulte', 18, 4)],
      },
      {
        dire: ['りょうてを ひろげた ', NAGA, 'さは 「ひろ」。 せの たかさと だいたい ', ONAJI, 'じ だよ。 おうちの ひとと くらべて みよう！'],
        scene: 'hiro',
      },
    ];
  }

  // しゃくと すん : 1 寸 ≈ 3 cm (一寸法師), 10 寸 = 1 尺 ≈ 30 cm (une règle de 30 cm).
  function etapesShaku() {
    return [
      {
        dire: ['むかしの にほんでは、 ', NAGA, 'さを 「すん」と 「しゃく」で あらわしたよ。 うえが すん、 したが cm。'],
        scene: 'shaku',
      },
      {
        dire: ['1すんは だいたい ', segU(3, 'cm'), '。 おやゆびの はばくらい。'],
        scene: 'shaku', surligne: 'sun',
      },
      {
        dire: ['むかしばなしの 「いっすんぼうし」。 せの たかさは 1すん。 ', segU('なん', 'cm'), ' くらい？'],
        scene: 'shaku', surligne: 'sun', boushi: true,
        choix: { options: [3, 30, 100], bonne: 3, unite: 'cm', indice: ['おしい！ 1すんは だいたい ', segU(3, 'cm'), '。 ものさしを ', MI, 'てね。'] },
        bravo: ['いっすんぼうしは だいたい ', segU(3, 'cm'), '。 とても ', CHIISA, 'さいね！'],
      },
      {
        dire: ['10すんで 1しゃく。 1しゃくは だいたい ', segU(30, 'cm'), '。 30 cm の ものさしと ほとんど ', ONAJI, 'じ ', NAGA, 'さ。'],
        scene: 'shaku', surligne: 'shaku',
      },
      {
        dire: ['いまでも だいくさんは 「しゃく」や 「すん」を つかう ことが あるよ。 はしらや いたの ', NAGA, 'さ だね。'],
        scene: 'shaku', surligne: 'shaku',
      },
    ];
  }

  // ごうと しょう : la mesure du riz, encore utilisée : 1 合 = 180 mL, 10 合 = 1 升 = 1,8 L.
  function etapesGou() {
    const total = (e) => somme(e.plateau);
    return [
      {
        dire: ['これは 1ごうの カップ。 おこめを はかる ときに、 いまも つかうよ。 すいはんきの めもりも 「ごう」だね。'],
        scene: 'verre', contenu: [], reserve: [P('gou', 180, 1)],
      },
      {
        dire: ['1ごうの カップで、 みずを 1かい いれよう。'],
        scene: 'verre', contenu: [], reserve: [P('gou', 180, 5)], vers: 'plateau', fini: (e) => total(e) === 180,
        bravo: [segU(180, 'ml'), '。 1ごうは ', segU(180, 'ml'), '。'],
      },
      {
        dire: ['もう 1かい いれよう。'],
        scene: 'verre', contenu: [P('gou', 180)], reserve: [P('gou', 180, 4)], vers: 'plateau', fini: (e) => total(e) === 360,
        bravo: ['2ごうで ', segU(360, 'ml'), '。 「おこめを 2ごう たく」と いうね。'],
      },
      {
        dire: ['3ごうは ', segU('なん', 'ml'), '？ 180が 3つ だよ。'],
        scene: 'verre', contenu: [], reserve: [P('gou', 180, 3)],
        choix: { options: [540, 300, 180], bonne: 540, unite: 'mL', indice: ['おしい！ 1ごうは 180 mL。 それが 3つ だよ。'] },
        bravo: ['180が 3つで ', segU(540, 'ml'), '。'],
      },
      {
        dire: ['10ごうで 1しょう。 1しょうは ', segU(1.8, 'l'), '（', segU(1800, 'ml'), '）。 ', OOKI, 'きな びんを 「いっしょうびん」と いうよ。'],
        scene: 'verre', cap: 2000, bouteille: true, contenu: [P('gou', 180, 10)],
      },
    ];
  }

  // Lire la はかり : grandes graduations (100 g) et petites (10 g).
  function lectureHakari(v) {
    const c = Math.floor(v / 100) * 100;
    const p = (v - c) / 10;
    if (!c) return ['ちいさい めもり ', String(p), 'つ。 ', segU(v, 'g'), '。'];
    if (!p) return ['はりは ', String(c), 'を さして いる。 ', segU(v, 'g'), '。'];
    return [String(c), 'と、 ちいさい めもり ', String(p), 'つ。 ', segU(v, 'g'), '。'];
  }

  function choixLecture(v) {
    const faux = new Set();
    const candidats = melanger([v + 100, v - 100, v + 50, v - 50, v + 20, v - 20, v + 10 * (v % 100 ? 0 : 3)]);
    candidats.forEach((x) => { if (faux.size < 2 && x !== v && x > 0 && x <= MAX_HAKARI) faux.add(x); });
    return melanger([v, ...faux]);
  }

  function etapesHakari() {
    const totalPlateau = (e) => somme(e.plateau);
    // 1re lecture : une grande graduation (100, 200…) ; 2e : avec des petites (120, 430…).
    const objetLecture = (min, max, rond, petites) => {
      const c = choisir(CHOSES.filter((x) => {
        const v = Math.round(x.val / rond) * rond;
        return x.val >= min && x.val <= max && (!petites || v % 100 !== 0) && Math.abs(v - x.val) <= x.val * 0.15;
      }));
      const v = Math.max(rond, Math.round(c.val / rond) * rond);
      return { c, v };
    };
    const premiere = objetLecture(100, 500, 100, false);
    const seconde = objetLecture(20, 480, 10, true);
    const cible = entier(5, 48) * 10;
    const etapeLecture = ({ c, v }) => ({
      dire: [nomDe(c), 'を はかりに のせたよ。 はりは ', segU('なん', 'g'), '？'],
      hakari: [{ v: 'chose', c, m: v, n: 1 }], choix: { options: choixLecture(v), bonne: v },
      bravo: lectureHakari(v), cache: true,
    });
    return [
      {
        dire: ['これは はかり。 ものを のせると はりが まわって、 ', OMO, 'さが わかる。 なにも のって いない とき、 はりは 0 を さす。'],
        hakari: [],
      },
      {
        dire: [enG(100), 'の おもりを 1こ、 はかりに のせよう。'],
        hakari: [], reserve: [P('g100', 100, 5)], vers: 'plateau', fini: (e) => totalPlateau(e) === 100,
        bravo: ['はりが まわって、 100 を さしたね。 ', enG(100), '。'],
      },
      {
        dire: ['もう 1こ のせよう。'],
        hakari: [P('g100', 100)], reserve: [P('g100', 100, 4)], vers: 'plateau', fini: (e) => totalPlateau(e) === 200,
        bravo: ['200 を さした。 ', OMO, 'く なると、 はりは もっと まわる。'],
      },
      {
        dire: ['おもりを ぜんぶ のせて みよう。'],
        hakari: [P('g100', 100, 2)], reserve: [P('g100', 100, 3)], vers: 'plateau', fini: (e) => totalPlateau(e) === 500,
        bravo: [enG(500), '。 はりが いちばん たくさん まわった。'],
      },
      {
        dire: ['こんどは おもりを さわって、 ぜんぶ おろそう。'],
        hakari: [P('g100', 100, 5)], retirer: true, vers: 'plateau', fini: (e) => totalPlateau(e) === 0,
        bravo: ['はりが 0 に もどった。 ', KARU, 'く なると、 はりは もどる。'],
      },
      {
        dire: ['ちいさい めもりは 1つ ', enG(10), '。 ', enG(10), 'の おもりを 3こ のせて、 はりを ', MI, 'よう。'],
        hakari: [P('g100', 100)], reserve: [P('g10', 10, 5)], vers: 'plateau', retirer: true, fini: (e) => totalPlateau(e) === 130,
        bravo: ['100 と、 ちいさい めもり 3つ。 ', enG(130), '。'],
      },
      etapeLecture(premiere),
      etapeLecture(seconde),
      {
        dire: ['はかりが ', segU(cible, 'g'), 'を さす ように、 おもりを のせよう。'],
        hakari: [], reserve: [P('g100', 100, 5), P('g10', 10, 9)], vers: 'plateau', retirer: true, cache: true,
        fini: (e) => totalPlateau(e) === cible,
        pendant: (e) => {
          const t = totalPlateau(e);
          return t < cible ? ['あと ', segU(cible - t, 'g'), '。'] : [OMO, 'すぎ！ ', segU(t - cible, 'g'), ' おろそう。'];
        },
        bravo: ['できた！ ', ...lectureHakari(cible)],
      },
      {
        dire: ['まとめ： はりが さす かずを よむと、 ', OMO, 'さが わかる。 ', OMO, 'い ほど、 はりは たくさん まわる。'],
        hakari: [P('g100', 100, 3), P('g10', 10, 2)],
      },
    ];
  }

  const LECONS = {
    balance: etapesTsuriawase,
    'lecon-balance': etapesBalance,
    'lecon-unites': etapesUnites,
    'lecon-hakari': etapesHakari,
    'lecon-pratique': etapesPratique,
    'lecon-monme': etapesMonme,
    'lecon-corps': etapesCorps,
    'lecon-shaku': etapesShaku,
    'lecon-gou': etapesGou,
    'lecon-kazu1': etapesKazu1,
    'lecon-kazu2': etapesKazu2,
    'lecon-kazu3': etapesKazu3,
  };
  const estLecon = () => Boolean(etude && LECONS[etude.mode]);

  let compteurPieces = 0;
  // Une entrée P(v, m, n) devient n pièces distinctes (chacune peut être enlevée).
  const deplier = (liste) => liste.flatMap((p) => Array.from({ length: p.n || 1 }, () => ({ v: p.v, c: p.c, m: p.m, id: ++compteurPieces })));

  function demarrerLecon() {
    const e = etude;
    e.etapes = LECONS[e.mode]();
    e.total = e.etapes.length;
    e.index = 0;
    commencerEtape();
  }

  function commencerEtape() {
    const e = etude;
    const et = e.etapes[e.index];
    e.etape = et;
    e.cotes = (et.balance || [[], []]).map(deplier);
    e.plateau = deplier(et.hakari || et.contenu || []);
    e.reserve = (et.reserve || []).map((r) => ({ ...r }));
    e.resolu = !et.fini && !et.choix;
    e.essais = new Set();
    e.etatLecon = null;
    e.guide = false;
    e.vu = false;
    messageEtude([]);
    rendreLecon();
    parler(et.dire);
    // Étape où il faut enlever (« ぜんぶ おろそう ») : on montre le geste au début.
    if (et.retirer && !(et.reserve || []).length && !e.resolu) setTimeout(() => { if (etude && etude.etape === et) montrerRetrait(); }, 1400);
  }

  // Montrer comment enlever : un doigt touche la dernière pièce posée, elle descend vers la table…
  // puis revient à sa place (ce n'est qu'un exemple ; c'est à l'élève de le faire).
  function montrerRetrait(sorte) {
    const e = etude;
    const et = e.etape;
    const liste = et.vers === 'plateau' || et.vers === undefined ? e.plateau : e.cotes[et.vers];
    const dernier = liste[liste.length - 1];
    if (!dernier || e.resolu) return;
    const plan = $('etude-plan');
    let elements;
    if (sceneDe(et) === 'compte') {
      const sel = { cent: '.plaque100', dix: '.cadre10.dix', pion: '.cadre10:not(.dix) i.plein' }[sorte || dernier.v];
      elements = sel ? plan.querySelectorAll(`.compte-plateau ${sel}`) : [];
    } else {
      elements = plan.querySelectorAll('.piece-bouton');
    }
    const cible = elements[elements.length - 1];
    if (!cible) return;
    cible.classList.remove('demo-retrait');
    void cible.offsetWidth;
    cible.classList.add('demo-retrait');
    const r = cible.getBoundingClientRect();
    document.querySelectorAll('.main-demo').forEach((x) => x.remove());
    const main = document.createElement('span');
    main.className = 'main-demo';
    main.setAttribute('aria-hidden', 'true');
    main.textContent = '👆';
    main.style.left = `${r.left + r.width / 2}px`;
    main.style.top = `${r.top + r.height / 2}px`;
    document.body.append(main);
    setTimeout(() => {
      main.remove();
      cible.classList.remove('demo-retrait');
    }, 2700);
  }

  function rendreLecon() {
    const e = etude;
    const et = e.etape;
    const activite = ACTIVITES.find((a) => a.etude === e.mode);
    $('etude-titre').innerHTML = `${htmlMots(activite.titre)}<small>${e.index + 1} / ${e.total}</small>`;
    $('etude-consigne').innerHTML = htmlMots(et.dire);
    $('choix-max').hidden = e.mode !== 'balance';
    // Boutons ±1… cachés ; à leur place, les nombres à choisir (lecture de la はかり).
    const commandes = $('etude-plus').parentElement;
    commandes.hidden = !et.choix;
    commandes.querySelectorAll('.btn-pas, .valeur-etude').forEach((x) => { x.hidden = true; });
    const choix = $('lecon-choix');
    choix.hidden = !et.choix;
    choix.replaceChildren();
    if (et.choix) {
      et.choix.options.forEach((v) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn-choix-lecon';
        b.innerHTML = et.choix.unite === '' ? nombreYomi(v, true) : nombreUnite(v, ({ mL: 'ml', cm: 'cm', g: 'g' })[et.choix.unite || 'g']);
        if (e.essais.has(v)) b.classList.add('essaye');
        if (e.resolu && v === et.choix.bonne) b.classList.add('juste');
        activable(b, () => choisirLecon(v));
        choix.append(b);
      });
    }

    const plan = $('etude-plan');
    plan.classList.remove('anime');
    plan.replaceChildren();
    const cs = getComputedStyle(plan);
    const W = plan.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const H = plan.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 4;
    const avecReserve = e.reserve.length > 0 || et.retirer;
    // Les bacs ont une hauteur fixe : le reste va à la balance (les poids y sont en 4 rangées).
    const hReserve = !avecReserve ? 0 : et.bac ? 78 : Math.max(64, Math.min(104, H * 0.26));
    let instrument;
    const scene = sceneDe(et);
    if (scene === 'hakari') instrument = creerHakariLecon(W, H - hReserve, et.max || MAX_HAKARI);
    else if (scene === 'verre') instrument = creerVerreLecon(W, H - hReserve, et);
    else if (scene === 'corps') instrument = creerCorpsLecon(W, H - hReserve, et);
    else if (scene === 'shaku') instrument = creerShakuLecon(W, H - hReserve, et);
    else if (scene === 'hiro') instrument = creerHiroLecon(W, H - hReserve);
    else if (scene === 'compte') instrument = creerCompteLecon(W, H - hReserve, et);
    else {
      // Bacs : plateaux plus larges ; sur un écran bas, sans les noms (l'égalité dit déjà ce qu'il y a).
      instrument = creerBalance(W, H - hReserve, { noms: !(et.bac && H < 380), large: et.bac });
      instrument.classList.add('balance-lecon');
    }
    const reserve = document.createElement('div');
    reserve.className = 'reserve';
    reserve.hidden = !avecReserve;
    plan.append(instrument, reserve);
    e.scene = { instrument, reserve };
    majLecon();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      plan.classList.add('anime');
      instrument.classList.add('anime');
    }));
    $('etude-suivant').hidden = !e.resolu;
  }

  function creerHakariLecon(W, H, max) {
    const el = document.createElement('div');
    el.className = 'hakari hakari-lecon';
    const hCharge = Math.max(56, Math.min(150, H * 0.36));
    const D = Math.max(90, Math.min(H - hCharge - 30, W * 0.62, 300));
    const charge = document.createElement('span');
    charge.className = 'hakari-charge';
    charge.style.height = `${hCharge}px`;
    charge.style.width = `${Math.max(D * 1.3, 160)}px`;
    const plateau = document.createElement('span');
    plateau.className = 'hakari-plateau';
    plateau.style.width = `${D * 1.15}px`;
    // 500 g : un nombre tous les 100 g, un trait tous les 10 g ; 2 kg : tous les 500 g et 100 g.
    const pas = max <= 500 ? { etiquette: 100, trait: 10 } : max <= 1000 ? { etiquette: 200, trait: 20 } : { etiquette: 500, trait: 100 };
    const corps = creerHakari(D, max, pas);
    el.append(charge, plateau, corps);
    el.geo = { max, taille: Math.max(26, Math.min(hCharge * 0.55, 90)), s: Math.max(16, Math.min(30, D / 8)) };
    return el;
  }

  // Verre doseur (et, pour 1 升, une grande bouteille à côté).
  function creerVerreLecon(W, H, et) {
    const el = document.createElement('div');
    el.className = 'verre-lecon';
    const cap = et.cap || 1000;
    const h = Math.max(100, Math.min(H - 40, 360));
    const w = Math.max(64, Math.min(150, W * 0.24, h * 0.55));
    el.append(creerVerreGradue(w, h, 0, cap * 1.1, cap, 'var(--eau)'));
    if (et.bouteille) {
      const col = document.createElement('span');
      col.className = 'bouteille-col';
      col.innerHTML = `<span class="contenant forme-bin" style="width:${w * 0.5}px;height:${h * 0.9}px"><span class="liquide" style="height:90%;--c:var(--eau)"></span></span>`
        + '<span class="nom-mv">いっしょうびん</span>';
      el.append(col);
    }
    el.geo = { cap: cap * 1.1, taille: 40, s: Math.max(18, Math.min(30, w / 4)) };
    return el;
  }

  // Un bureau de 72 cm ; dessous, les empans (あた) de l'enfant puis ceux de l'adulte.
  function creerCorpsLecon(W, H, et) {
    const el = document.createElement('div');
    el.className = 'corps-lecon';
    const hTotal = Math.max(150, Math.min(H, 320));
    const x0 = 16;
    const ppc = (W - 2 * x0 - 40) / BUREAU;
    const hRang = Math.max(44, Math.min(78, (hTotal - (et.regle ? 96 : 58)) / 2));
    el.style.width = `${W}px`;
    el.style.height = `${hTotal}px`;
    let contenu = `<span class="bureau" style="left:${x0}px;width:${BUREAU * ppc}px">つくえ</span>`;
    ['teEnfant', 'teAdulte'].forEach((v, k) => {
      contenu += `<span class="rang" data-v="${v}" style="top:${42 + k * (hRang + 6)}px;height:${hRang}px"></span>`;
    });
    if (et.regle) {
      const y = 42 + 2 * (hRang + 6);
      let traits = '';
      for (let c = 0; c <= BUREAU; c += 2) {
        const x = c * ppc;
        const grand = c % 10 === 0;
        traits += `<line x1="${x}" y1="0" x2="${x}" y2="${grand ? 12 : 6}"/>`;
        if (grand) traits += `<text x="${x}" y="26">${c}</text>`;
      }
      traits += `<line x1="${BUREAU * ppc}" y1="0" x2="${BUREAU * ppc}" y2="14" class="fin"/><text class="unite" x="${BUREAU * ppc + 4}" y="26">72 cm</text>`;
      contenu += `<div class="regle" style="left:${x0}px;top:${y}px;width:${BUREAU * ppc}px"><svg width="${BUREAU * ppc + 60}" height="32" aria-hidden="true">${traits}</svg></div>`;
    }
    el.innerHTML = contenu;
    el.geo = { ppc, x0, hRang, taille: 36, s: 26 };
    return el;
  }

  function majCorpsLecon(el, e) {
    const { ppc, x0, hRang } = el.geo;
    el.querySelectorAll('.rang').forEach((rang) => {
      const v = rang.dataset.v;
      const mains = e.plateau.filter((p) => p.v === v);
      rang.replaceChildren();
      if (!mains.length) return;
      let x = x0;
      mains.forEach((p, k) => {
        const empan = document.createElement('span');
        empan.className = `empan ${v}`;
        empan.style.left = `${x}px`;
        empan.style.width = `${p.m * ppc}px`;
        empan.innerHTML = `<span class="main" style="font-size:${Math.min(hRang * 0.5, p.m * ppc * 0.8)}px">✋</span><span class="numero-empan">${k + 1}</span>`;
        rang.append(empan);
        x += p.m * ppc;
      });
      const nom = document.createElement('span');
      nom.className = 'rang-nom';
      nom.style.left = `${x + 6}px`;
      nom.textContent = v === 'teEnfant' ? 'こども' : 'おとな';
      rang.append(nom);
    });
  }

  // Une règle de 32 cm : en haut les 寸 (1 寸 ≈ 3,03 cm), en bas les cm.
  function creerShakuLecon(W, H, et) {
    const el = document.createElement('div');
    el.className = 'shaku-lecon';
    const x0 = 16;
    const L = 32;
    const SUN = 3.03;
    const ppc = (W - 2 * x0) / L;
    const hBoushi = et.boushi ? Math.max(30, Math.min(110, SUN * ppc * 1.8, H - 170)) : 0;
    const y = 44 + hBoushi;
    const hR = 72;
    // Texte un peu plus grand sur grand écran.
    el.style.setProperty('--t', `${Math.max(11, Math.min(17, ppc * 0.5))}px`);
    let t = `<rect class="bois" x="${x0}" y="${y}" width="${L * ppc}" height="${hR}" rx="4"/>`;
    if (et.surligne) {
      const fin = et.surligne === 'sun' ? SUN : SUN * 10;
      t += `<rect class="surligne" x="${x0}" y="${y}" width="${fin * ppc}" height="${hR}"/>`;
      const texte = et.surligne === 'sun' ? '1すん ≈ 3 cm' : '1しゃく ≈ 30 cm';
      t += `<text class="titre-sun" x="${Math.max(x0 + 50, x0 + (fin * ppc) / 2)}" y="${y - 8 - hBoushi}">${texte}</text>`;
    }
    for (let k = 0; k <= 10; k++) {
      const x = x0 + k * SUN * ppc;
      t += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 24}"/>`;
      if (k) t += `<text x="${x - (SUN * ppc) / 2}" y="${y + 20}" class="petit">${k}</text>`;
    }
    // Les unités, hors de la règle (elles ne gênent pas les nombres) : すん au-dessus, cm en dessous.
    t += `<text class="unite-gauche" x="${x0 + L * ppc - 18}" y="${y - 8}">すん</text>`;
    for (let c = 0; c <= L; c++) {
      const x = x0 + c * ppc;
      const grand = c % 5 === 0;
      if (ppc >= 5 || grand) t += `<line x1="${x}" y1="${y + hR}" x2="${x}" y2="${y + hR - (grand ? 16 : 8)}"/>`;
      if (grand) t += `<text x="${x}" y="${y + hR - 22}">${c}</text>`;
    }
    t += `<text class="unite-gauche" x="${x0 + L * ppc - 14}" y="${y + hR + 18}">cm</text>`;
    el.innerHTML = `<svg width="${W}" height="${y + hR + 26}" aria-hidden="true">${t}</svg>`;
    if (et.boushi) {
      const b = document.createElement('span');
      b.className = 'boushi';
      b.textContent = '🧒';
      b.style.left = `${x0 + (SUN * ppc) / 2}px`;
      b.style.top = `${y - 2}px`;
      b.style.fontSize = `${hBoushi * 0.85}px`;
      el.append(b);
    }
    el.geo = { taille: 40, s: 26 };
    return el;
  }

  // 「ひろ」 : les bras écartés, à peu près la taille.
  function creerHiroLecon(W, H) {
    const el = document.createElement('div');
    el.className = 'hiro-lecon';
    const h = Math.max(140, Math.min(H - 10, 320));
    el.innerHTML = `<svg viewBox="0 0 250 220" height="${h}" aria-hidden="true">`
      + '<path class="fleche" d="M30 22h170M30 22l8-6M30 22l8 6M200 22l-8-6M200 22l-8 6"/><text x="115" y="14">ひろ</text>'
      + '<path class="fleche" d="M222 36v174M222 36l-6 8M222 36l6 8M222 210l-6-8M222 210l6-8"/><text x="238" y="128">せ</text>'
      + '<circle class="personnage" cx="115" cy="50" r="14"/><path class="personnage" d="M115 64v80M30 82h170M115 144l-28 64M115 144l28 64"/>'
      + '</svg>';
    el.geo = { taille: 40, s: 26 };
    return el;
  }


  function creerPiece(p, taille, s) {
    const vis = VISUELS[p.v] || { genre: 'chose' };
    if (vis.genre === 'chose') return creerChose(objetChose(p.c || chose(vis.c)), taille);
    const el = document.createElement('span');
    if (vis.genre === 'yen5') {
      el.className = 'yen yen5';
      el.style.width = `${s * 1.3}px`;
      el.style.height = `${s * 1.3}px`;
      return el;
    }
    if (vis.genre === 'sac') {
      el.className = 'sac';
      el.style.width = `${taille * 1.3}px`;
      el.style.height = `${taille * 1.5}px`;
      el.style.fontSize = `${Math.max(10, taille * 0.24)}px`;
      el.textContent = vis.texte;
      return el;
    }
    if (vis.genre === 'gou') {
      el.className = 'gou';
      el.style.width = `${s * 1.8}px`;
      el.style.height = `${s * 1.5}px`;
      el.style.fontSize = `${Math.max(10, s * 0.38)}px`;
      el.textContent = '1ごう';
      return el;
    }
    if (vis.genre === 'tsumiki') {
      el.className = 'tsumiki';
      el.style.width = `${s}px`;
      el.style.height = `${s}px`;
      return el;
    }
    if (vis.genre === 'pion') {
      el.className = 'pion-piece';
      el.style.width = `${s}px`;
      el.style.height = `${s}px`;
      return el;
    }
    if (vis.genre === 'barre') {
      el.className = 'cadre10 dix piece';
      el.innerHTML = '<i class="plein"></i>'.repeat(10);
      return el;
    }
    if (vis.genre === 'plaque') {
      el.className = 'plaque100 piece';
      return el;
    }
    if (vis.genre === 'main') {
      el.className = 'main-piece';
      el.style.fontSize = `${s * 1.3 * vis.taille}px`;
      el.textContent = '✋';
      return el;
    }
    if (vis.genre === 'yen') {
      el.className = 'yen';
      el.style.width = `${s * 1.3}px`;
      el.style.height = `${s * 1.3}px`;
      el.style.fontSize = `${Math.max(11, s * 0.6)}px`;
      el.textContent = '1';
      return el;
    }
    el.className = 'fundou';
    el.style.width = `${s * vis.taille}px`;
    el.style.height = `${s * vis.taille * 1.15}px`;
    el.style.fontSize = `${Math.max(8, s * vis.taille * 0.34)}px`;
    el.textContent = vis.unite && s * vis.taille < 7 * vis.texte.length ? vis.texte.replace(/g$/, '') : vis.texte;
    return el;
  }

  // Le contenu d'un plateau : les objets, puis les poids en tas (on touche un poids pour l'enlever).
  function remplirPlateauLecon(zone, liste, cote, taille, s) {
    const e = etude;
    const et = e.etape;
    zone.replaceChildren();
    const pile = document.createElement('span');
    pile.className = 'pile pile-rangees';
    const enlevable = et.retirer && !e.resolu && (et.vers === cote);
    liste.forEach((p) => {
      const piece = creerPiece(p, taille, s);
      let el = piece;
      if (enlevable && VISUELS[p.v]?.genre !== 'chose') {
        el = document.createElement('button');
        el.type = 'button';
        el.className = 'piece-bouton';
        el.setAttribute('aria-label', `${lecture(nomVisuel(p.v))} を おろす`);
        el.append(piece);
        activable(el, () => enleverPiece(cote, p.id));
      }
      if (['chose', 'sac'].includes(VISUELS[p.v]?.genre) || !VISUELS[p.v]) {
        zone.append(el);
        return;
      }
      // Une rangée par sorte de poids, 5 au plus par rangée : 10 = 5 + 5, comme en classe.
      const rangees = [...pile.querySelectorAll(`.rangee-poids[data-v="${p.v}"]`)];
      let rangee = rangees.find((r) => r.childElementCount < 5);
      if (!rangee) {
        rangee = document.createElement('span');
        rangee.className = 'rangee-poids';
        rangee.dataset.v = p.v;
        pile.prepend(rangee);
      }
      rangee.append(el);
    });
    const masse = (r) => liste.find((p) => p.v === r.dataset.v)?.m || 0;
    [...pile.children].sort((a, b) => masse(a) - masse(b)).forEach((r) => pile.append(r));
    if (pile.childElementCount) zone.prepend(pile);
  }

  function majLecon() {
    const e = etude;
    const et = e.etape;
    const { instrument, reserve } = e.scene;
    const geo = instrument.geo;
    const s = geo.s || (et.bac ? tailleBac(geo, e.reserve) : Math.max(16, Math.min(30, geo.Pw / 6.5)));
    const scene = sceneDe(et);
    if (scene === 'hakari') {
      remplirPlateauLecon(instrument.querySelector('.hakari-charge'), e.plateau, 'plateau', geo.taille, s);
      tournerAiguille(instrument.querySelector('svg'), somme(e.plateau), geo.max);
    } else if (scene === 'verre') {
      instrument.querySelector('.verre .liquide').style.height = `${(somme(e.plateau) / geo.cap) * 100}%`;
    } else if (scene === 'corps') {
      majCorpsLecon(instrument, e);
    } else if (scene === 'compte') {
      majCompteLecon(instrument, e);
    } else if (scene === 'balance') {
      [0, 1].forEach((k) => {
        remplirPlateauLecon(instrument.plateaux[k].charge, e.cotes[k], k, geo.taille, s);
        instrument.noms[k].innerHTML = html(nomCote(e.cotes[k]));
      });
      incliner(instrument, angleBalance(somme(e.cotes[0]), somme(e.cotes[1]), true));
    }
    // La réserve : ce qu'on peut poser (touchez pour poser un exemplaire).
    reserve.replaceChildren();
    // « のこり » : ce qui reste à poser (« 2まい », « 6こ » ; plus de « ×2 », qui se lit comme une multiplication).
    if (!et.bac && e.reserve.length) {
      const titre = document.createElement('span');
      titre.className = 'reserve-titre';
      titre.textContent = 'のこり';
      reserve.append(titre);
    }
    e.reserve.forEach((r, k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'reserve-piece';
      b.disabled = e.resolu || r.n <= 0;
      if (et.bac) {
        // Un bac : trois exemplaires en tas, sans « ×10 » (on en reprend autant qu'il faut).
        b.classList.add('bac');
        const tas = document.createElement('span');
        tas.className = 'tas';
        for (let j = 0; j < Math.min(3, Math.max(1, r.n)); j++) tas.append(creerPiece(r, Math.min(geo.taille, 64), s));
        b.append(tas);
      } else {
        b.append(creerPiece(r, Math.min(geo.taille, 64), s));
        const n = document.createElement('span');
        n.className = 'reserve-nombre';
        n.textContent = `${r.n}${compteurReserve(r.v)}`;
        b.append(n);
      }
      b.setAttribute('aria-label', et.bac ? `${lecture(nomVisuel(r.v))} を のせる` : `${lecture(nomVisuel(r.v))} を のせる。 のこり ${r.n}${compteurReserve(r.v)}`);
      activable(b, () => poserPiece(k));
      reserve.append(b);
    });
    $('etude-equation').innerHTML = et.cache && !e.resolu ? '' : equationLecon();
  }

  // Bacs (つりあわせよう) : au plus 4 rangées de 5 dans le plateau (20 つみき, ou 2 rangées de chaque poids).
  function tailleBac(geo, reserve) {
    const tailles = reserve.map((r) => (VISUELS[r.v].genre === 'tsumiki' ? 1 : VISUELS[r.v].taille));
    const parLargeur = (geo.Pw - 16) / (5 * Math.max(...tailles));
    const cubes = reserve.every((r) => VISUELS[r.v].genre === 'tsumiki');
    // Une rangée de poids : 1,15 × la taille, + 6 px de crochet et 2 px d'écart.
    const parHauteur = cubes ? (geo.hCharge - 12) / 4 - 2
      : (geo.hCharge - 12 - tailles.length * 2 * 8) / (2 * 1.15 * tailles.reduce((a, b) => a + b, 0));
    return Math.max(14, Math.min(40, parLargeur, parHauteur));
  }

  // Le compteur des pièces qui restent : les choses plates (plaques, pièces de monnaie) en まい, le reste en こ.
  const compteurReserve = (v) => (['plaque', 'yen', 'yen5'].includes(VISUELS[v]?.genre) ? 'まい' : 'こ');

  // Nom affiché sous un plateau : l'objet, ou le nombre de poids.
  function nomCote(liste) {
    if (!liste.length) return [''];
    const objet = liste.find((p) => VISUELS[p.v]?.genre === 'chose' || p.c);
    if (objet) return [nomDe(objet.c || chose(VISUELS[objet.v].c))];
    return [compterPieces(liste).map(([v, n]) => {
      const vis = VISUELS[v];
      if (vis.genre === 'tsumiki') return `つみき ${n}こ`;
      if (vis.genre === 'yen') return `1えんだま × ${n}`;
      if (vis.genre === 'yen5') return `5えんだま × ${n}`;
      if (vis.texte && !vis.unite) return `${vis.texte.replace('匁', 'もんめ')}${n > 1 ? ` × ${n}` : ''}`;
      if (!vis.unite) return `おもり ${n}こ`;
      return `${vis.texte.replace(/(\d)([a-z])/, '$1\u00a0$2')} × ${n}`;
    }).join(' ＋ ')];
  }

  // [sorte, nombre], du plus lourd au plus léger : 10 g × 9 ＋ 1 g × 7.
  function compterPieces(liste) {
    const n = new Map();
    liste.forEach((p) => n.set(p.v, (n.get(p.v) || 0) + 1));
    const masse = (v) => (v === 'yen1' ? 1 : VISUELS[v]?.unite || 0);
    return [...n.entries()].sort(([a], [b]) => masse(b) - masse(a));
  }

  // Ce qu'il y a sur le plateau qu'on remplit, en nombres : 100 g × 3 ＋ 10 g × 2 ＝ 320 g.
  function equationLecon() {
    const e = etude;
    const et = e.etape;
    const scene = sceneDe(et);
    if (scene === 'verre') return et.choix ? '' : `<span class="resultat">${somme(e.plateau)}</span> ${uniteHtml('ml')}`;
    if (scene === 'corps') {
      return ['teEnfant', 'teAdulte'].map((v) => {
        const n = e.plateau.filter((p) => p.v === v).length;
        return n ? `${v === 'teEnfant' ? 'こども' : 'おとな'}の あた <span class="resultat">${n}</span>つ` : '';
      }).filter(Boolean).join('　');
    }
    if (scene !== 'hakari' && scene !== 'balance') return '';  // かず : le nombre est déjà en grand
    if (scene === 'balance' && et.vers !== undefined && e.cotes[et.vers].some((p) => p.v === 'yen5')) {
      return `5えんだま <span class="resultat">${e.cotes[et.vers].length}</span>こ`;
    }
    // Balance : seulement le plateau qu'on remplit (rien pendant les explications sans action).
    const liste = scene === 'hakari' ? e.plateau : (et.vers === undefined ? [] : e.cotes[et.vers]);
    const cubes = liste.filter((p) => p.v === 'tsumiki').length;
    if (cubes) return `つみき <span class="resultat">${cubes}</span>こ`;
    const pieces = compterPieces(liste.filter((p) => VISUELS[p.v] && (VISUELS[p.v].unite || VISUELS[p.v].genre === 'yen' || (VISUELS[p.v].genre === 'fundou' && !VISUELS[p.v].texte))));
    if (!pieces.length) return scene === 'hakari' && !et.cache ? `<span class="resultat">${somme(e.plateau)}</span> ${uniteHtml('g')}` : '';
    if (pieces.every(([v]) => !VISUELS[v].unite && VISUELS[v].genre === 'fundou')) {
      return `おもり <span class="resultat">${pieces[0][1]}</span>こ`;
    }
    const termes = pieces.map(([v, n]) => {
      const u = v === 'yen1' ? 1 : VISUELS[v].unite;
      return `<span class="terme-plus">${nombreUnite(u, 'g')} × ${n}</span>`;
    });
    const total = pieces.reduce((t, [v, n]) => t + (v === 'yen1' ? 1 : VISUELS[v].unite) * n, 0);
    return `${termes.join(' ＋ ')} ＝ <span class="resultat">${total}</span> ${uniteHtml('g')}`;
  }

  function poserPiece(k) {
    const e = etude;
    const et = e.etape;
    const r = e.reserve[k];
    if (e.resolu || !r || r.n <= 0) return;
    r.n -= 1;
    const piece = { v: r.v, c: r.c, m: r.m, id: ++compteurPieces };
    if (et.vers === 'plateau') e.plateau.push(piece);
    else e.cotes[et.vers].push(piece);
    note(520 + Math.min(r.m, 100) * 2, { duree: 0.09, volume: 0.1, type: 'triangle' });
    if (reglages.sons && navigator.vibrate) navigator.vibrate(8);
    majLecon();
    verifierLecon(compteLecon());
  }

  function enleverPiece(cote, id) {
    const e = etude;
    if (e.resolu) return;
    const liste = cote === 'plateau' ? e.plateau : e.cotes[cote];
    const i = liste.findIndex((p) => p.id === id);
    if (i < 0) return;
    const [p] = liste.splice(i, 1);
    e.guide = true;   // l'élève a enlevé : on peut lui dire quoi poser ensuite
    const r = e.reserve.find((x) => x.v === p.v && x.m === p.m);
    if (r) r.n += 1;
    else e.reserve.push({ v: p.v, c: p.c, m: p.m, n: 1 });
    note(400, { duree: 0.09, volume: 0.1, type: 'triangle' });
    majLecon();
    verifierLecon(compteLecon());
  }

  function finirEtape(message) {
    const e = etude;
    e.resolu = true;
    sons.succes();
    messageEtude(message, true);
    parler(message);
    majLecon();
    $('etude-suivant').hidden = false;
  }

  // À chaque pose quand on compte (et.compter) : le total de ce qu'on remplit (« 97 グラム » avec 'g').
  function compteLecon() {
    const e = etude;
    const et = e.etape;
    if (!et.compter) return null;
    const n = somme(et.vers === 'plateau' || et.vers === undefined ? e.plateau : e.cotes[et.vers]);
    return et.compter === 'g' ? [yomiNombre(n), ' グラム'] : [yomiNombre(n)];
  }

  function verifierLecon(compte) {
    const e = etude;
    const et = e.etape;
    if (!et.fini) {
      if (compte) parler(compte);
      return;
    }
    if (et.fini(e)) {
      finirEtape(et.bravo);
      return;
    }
    let message = et.pendant ? et.pendant(e) : null;
    if (!message && et.fini === equilibre) {
      const v = et.vers;
      const ici = somme(e.cotes[v]);
      const la = somme(e.cotes[1 - v]);
      const nomPose = e.reserve.length === 1 ? nomVisuel(e.reserve[0].v) : ['おもり'];
      // Plusieurs sortes de poids : quand le plus gros dépasserait, on conseille un plus petit.
      const dispo = e.reserve.filter((r) => r.n > 0).sort((x, y) => y.m - x.m);
      const petit = dispo.find((r) => r.m <= la - ici);
      if (ici < la && dispo.length && dispo[0].m > la - ici && petit) {
        message = ['おしい！ もう すこし かな。 ', ...nomVisuel(petit.v), 'を のせて みよう。'];
      } else if (ici < la && la - ici <= la * 0.1) {
        message = ['おしい！ もう すこし かな。', ...(dispo.length > 1 ? [' ', ...nomVisuel(dispo[0].v), 'を のせて みよう。'] : [])];
      } else {
        message = ici < la
          ? ['まだ ', ...nomCote(e.cotes[1 - v]), 'の ほうが ', OMO, 'い。 もっと のせよう。']
          : ['のせすぎ！ ', ...nomPose, 'を さわって おろそう。'];
      }
    }
    if (!message) {
      // Plus rien à dire (par ex. la pièce en trop a été enlevée) : on efface l'ancien conseil.
      messageEtude([]);
      e.etatLecon = null;
      if (compte) parler(compte);
      return;
    }
    const cle = lecture(message);
    messageEtude(message);
    // On ne répète à voix haute que quand la situation change (trop léger → trop lourd…).
    const etat = message.cle || cle.slice(0, 3);
    if (etat !== e.etatLecon) {
      parler(compte ? [...compte, '。 ', ...message] : message);
      // « …さわって おろそう » : on montre le geste une fois.
      if (cle.includes('おろそう')) montrerRetrait(message.retirer);
    }
    else if (compte) parler(compte);
    e.etatLecon = etat;
  }

  function choisirLecon(v) {
    const e = etude;
    const et = e.etape;
    if (e.resolu || e.essais.has(v)) return;
    if (v === et.choix.bonne) {
      finirEtape([...PHRASES.seikai, ...et.bravo]);
      rendreLecon();
      return;
    }
    e.essais.add(v);
    sons.oups();
    let message = et.choix.indice || ['おしい！ はりの さきを よく ', MI, 'てね。 ', OOKI, 'きい めもりから かぞえよう。'];
    // « おしい » seulement si c'est presque juste (17 pour 16, pas 71 pour 17).
    if (Math.abs(v - et.choix.bonne) > Math.max(1, Math.abs(et.choix.bonne) * 0.1)) message = ['もう いっかい！ ', ...sansOshii(message)];
    messageEtude(message);
    parler(message);
    rendreLecon();
  }

  function leconSuivante() {
    const e = etude;
    e.index += 1;
    if (e.index < e.total) {
      commencerEtape();
      return;
    }
    finDe = 'etude';
    montrer('fin');
    const texte = ['さいごまで できたね！'];
    $('fin-titre').innerHTML = htmlMots(PHRASES.otsukare);
    $('fin-texte').innerHTML = htmlMots(texte);
    sons.fin();
    parler([...PHRASES.otsukare, ' ', ...texte]);
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
      if (!etude || etude.resolu || estLecon()) return;
      ev.preventDefault();
      plan.setPointerCapture(ev.pointerId);
      const cible = presDuDepart(ev) ? 'depart' : 'fin';
      geste = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, v: etude.valeur, a: etude.depart, cible };
      plan.classList.add(cible === 'depart' ? 'en-glisse-depart' : 'en-glisse');
    });
    plan.addEventListener('pointermove', (ev) => {
      if (!geste || ev.pointerId !== geste.id) return;
      const { petit } = pasBoutons();
      if (etude.mode === 'verre') {
        changerValeur(geste.v + Math.round((geste.y - ev.clientY) / etude.geo.ppm / petit) * petit, false);
        return;
      }
      const pas = Math.round((ev.clientX - geste.x) / etude.geo.ppc / petit) * petit;
      if (geste.cible === 'depart') changerDepart(geste.a + pas);
      else changerValeur(geste.v + pas, false);
    });
    const finGeste = (ev) => {
      if (!geste || ev.pointerId !== geste.id) return;
      const bouge = etude.valeur !== geste.v || etude.depart !== geste.a;
      const cible = geste.cible;
      geste = null;
      plan.classList.remove('en-glisse', 'en-glisse-depart');
      if (!bouge) { if (estEtudeMV()) dessinerEtudeMV(); else dessinerRuban(); }
      else if (cible === 'depart') annoncerDepart();
      else verifierEtude(true);
    };
    plan.addEventListener('pointerup', finGeste);
    plan.addEventListener('pointercancel', finGeste);
  })();

  const bouger = (sens, quel) => {
    if (!etude || etude.resolu) return;
    if (changerValeur(etude.valeur + sens * pasBoutons()[quel], true)) verifierEtude(false);
  };
  activable($('etude-plus'), () => bouger(1, 'petit'));
  activable($('etude-moins'), () => bouger(-1, 'petit'));
  activable($('etude-plus-grand'), () => bouger(1, 'grand'));
  activable($('etude-moins-grand'), () => bouger(-1, 'grand'));
  activable($('etude-ecouter'), () => parler(consigneEtude(true)), { garde: false });
  activable($('etude-quitter'), () => { rendreAccueil(); montrer('accueil'); });
  activable($('etude-suivant'), () => {
    if (estLecon()) {
      leconSuivante();
      return;
    }
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
      lireUnites: 'Lecture des unités en petit au-dessus des symboles (グラム sur g, センチ sur cm…)',
      toucherLire: 'Lecture au toucher (pour qui ne lit pas) : toucher une phrase la fait lire ; avec le bouton 👆, toucher un bouton le lit au lieu de l’activer',
      hiragana: 'Hiragana seuls',
      kanji: 'Kanji avec furigana',
      nombreMax: 'べんきょう : nombres jusqu’à',
      compter: 'べんきょう : la voix compte à chaque ＋1 / −1',
      etudeAide: 'Dans « べんきょう », votre enfant tire le ruban (n’importe où sur la zone, pas seulement sur la poignée) ou utilise les gros boutons ＋1 / −1. Chaque centimètre ajouté ou retiré apparaît comme un bloc numéroté. Dans « のばして みよう », la poignée bleue sous le ruban change le premier nombre sans changer le second. Avec des nombres plus grands, le geste doit être plus précis.',
      aide: 'Boutons d’aide (わからない, そろえる, うつす)',
      aideAide: 'Activités 6 et 7 : l’aide convertit d’abord dans la même unité (1 m ＝ 100 cm), puis dessine des barres à l’échelle. Activités 8 et 9 : elle fait glisser les objets jusqu’à la ligne de départ. Elle apparaît aussi d’elle-même après une erreur.',
      aideMV: 'Nombres (かず) : chaque nombre est écrit avec sa lecture en hiragana (3 さん, 23 にじゅうさん, 300 さんびゃく). « いくつ？ » : compter jusqu’à 5, puis 10, en rangées de 5 puis en désordre ; la preuve numérote les objets dans l’ordre. « よみかた » : chiffre → hiragana puis l’inverse (1–10, 11–20, jusqu’à 99). Les dizaines sont partout des cadres de 10 pleins (« 10の まとまり »), comptés 10, 20, 30… ; les unités sont les « ばら ». Les leçons utilisent aussi les plaques de 100 ; la voix dit le nombre à chaque jeton posé. « いくつ？ » demande avec le bon compteur (いぬは なんびき？, えんぴつは なんぼん？, りんごは なんこ？) et les réponses montrent la lecture (3びき さんびき). « かぞえかた » : d’abord choisir le compteur d’une chose (いきもの → ひき, ほそながい もの → ほん, うすい もの → まい, のりもの → だい, ひと → にん, ほん・ノート → さつ), puis la bonne lecture quand le son change (いっぽん, さんぼん, ろっぽん, はっぽん, じゅっぽん ; ひとり, ふたり). Les compteurs travaillés se choisissent plus bas (こ, ひき, ほん au départ). Après une erreur ou « わからない », l’aide décompose le nombre (16 ＝ 10 と 6 : « じゅう » et « ろく ») ou fait compter les 10 ; « おしい » n’est dit que si la réponse était presque juste. Masses : la balance de cuisine (はかり) est l’instrument principal. « はりで くらべる » compare deux balances sans aucun nombre ; « みためと ちがう » : l’élève devine d’abord (un gros objet peut être léger), puis les balances vérifient ; « はかりを よもう » : lire l’aiguille (centaines, puis 50, puis dizaines). Leçons guidées (l’élève pose ou enlève les objets en les touchant, puis la voix explique) : « はかりの よみかた », « g と kg » (1円玉 ＝ 1 g … 1 kg ＝ 1000 g), puis l’entraînement « はかって みよう ». La rubrique « ね、しっていた？（むかしは…）» rassemble la culture : la balance à plateaux (てんびん, avec son exercice et « つりあわせよう »), 匁 et la pièce de 5 円, et pour les longueurs あた／ひろ et 尺／寸, pour les liquides 合／升. Masses 5 et 6, liquides 4 et 5 : l’aide convertit d’abord dans la même unité (1 kg ＝ 1000 g, 1 L ＝ 1000 mL), puis montre des balances de cuisine ou des verres doseurs. « うつして くらべよう » : le bouton « うつす » (ou une erreur) verse les deux récipients dans des verres identiques. « つりあわせよう » : on touche le bac pour poser une つみき (jusqu’à 20) ou une おもり (1 g et 10 g, ou 10 g et 100 g jusqu’à 1000), on touche un poids sur le plateau pour le reposer ; les poids sont rangés par 5, une sorte par rangée, les plus lourds en bas, et l’égalité les compte (10 g × 9 ＋ 1 g × 7 ＝ 97 g) ; la balance penche moins quand on approche. « はかって いれよう » : on glisse le doigt vers le haut ou le bas ; la taille du verre doseur (200 mL, 500 mL, 1 L) se choisit en haut de l’écran.',
      theme_kazu: 'Nombres (かず)',
      compteurs: 'Compteurs travaillés (かぞえかた ; « いくつ？ » ne compte que des choses qui utilisent ces compteurs)',
      exemple: 'Exemple guidé avant la 1re question (« れい » : 10の まとまり)',
      theme_nagasa: 'Longueurs (ながさ)',
      theme_omosa: 'Masses (おもさ)',
      theme_kasa: 'Liquides (かさ)',
      noms: 'Afficher le nom des objets',
      court: 'Demander aussi « le plus court » (短い)',
      courtAide: 'Les élèves confondent souvent « long » et « court » : activez-le quand « long » est acquis.',
      oui: 'Oui',
      non: 'Non',
      photos: 'Photos d’objets de la maison',
      photosAide: 'Posez l’objet à l’horizontale sur un fond uni (une feuille blanche) et photographiez-le d’au-dessus. Mesurez-le avec une règle : l’outil l’affiche ensuite à la bonne échelle. Variez les longueurs (par exemple 5, 10, 15 et 25 cm) : les questions faciles demandent des objets très différents. Vous pouvez aussi le peser sur la balance de cuisine (en g), ou noter la contenance écrite sur une bouteille ou une brique (en mL) : la photo apparaîtra alors aussi dans les questions sur les masses ou les liquides.',
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
      genreVoix: 'Voix',
      femme: 'Femme',
      homme: 'Homme',
      voixPrecise: 'Voix japonaises installées sur cet appareil',
      voixAuto: 'Automatique',
      voixGrave: 'Aucune voix japonaise d’homme n’est installée sur cet appareil : la voix habituelle est rendue plus grave. Pour une vraie voix d’homme : sur iPad, Réglages › Accessibilité › Contenu énoncé › Voix › Japonais › Otoya (ou Hattori), puis revenir ici ; sur Android (Samsung), Paramètres › Gestion globale › Synthèse vocale › réglages du moteur (Google ou Samsung) › Japonais : choisir une voix d’homme si le moteur en propose une.',
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
      infos: 'Nom et mesures de l’objet',
      yomi: 'Nom en hiragana (obligatoire)',
      kanjiChamp: 'Nom en kanji (facultatif)',
      cm: 'Longueur réelle en cm',
      cmAide: 'Mesurez l’objet avec une règle, d’un bout à l’autre (facultatif si vous indiquez un poids ou une contenance).',
      erreurYomi: 'Écrivez le nom de l’objet en hiragana.',
      erreurCm: 'Indiquez une longueur entre 1 et 300 cm.',
      erreurMesure: 'Indiquez au moins une mesure : longueur, poids ou contenance.',
      erreurG: 'Indiquez un poids entre 1 et 5000 g.',
      erreurMl: 'Indiquez une contenance entre 10 et 5000 mL.',
      g: 'Poids en g (balance de cuisine)',
      gAide: 'Facultatif : pour les questions sur les masses.',
      ml: 'Contenance en mL (écrite sur l’étiquette)',
      mlAide: 'Facultatif : pour « うつして くらべよう » (verser dans des verres identiques).',
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
      lireUnites: 'たんいの よみかたを 小さく かく（g の 上に グラム）',
      toucherLire: 'さわって よむ：ぶんを さわると よみます。👆 を おすと、ボタンを さわっても よむだけに なります',
      hiragana: 'ひらがな',
      kanji: '漢字＋ふりがな',
      nombreMax: 'べんきょう：かずの はんい',
      compter: 'べんきょう：＋1・−1 で かずを よみあげる',
      etudeAide: '「べんきょう」では テープを ひっぱるか（どこからでも）、＋1・−1 の ボタンを つかいます。たしたり ひいたり した 1cm ずつが ばんごうつきの ブロックで みえます。「のばして みよう」では テープの 下の あおい ●で さいしょの かずを かえられます（2つめの かずは そのまま）。かずが 大きいと こまかい うごきが ひつようです。',
      aide: 'たすけの ボタン（わからない・そろえる・うつす）',
      aideAide: '6・7：まず おなじ たんいに なおし（1m＝100cm）、つぎに ぼうで しめします。8・9：ものの はしを そろえます。まちがえたときは じどうで でます。',
      aideMV: 'かず：すうじには いつも ひらがなの よみかたが つきます（3 さん、23 にじゅうさん、300 さんびゃく）。10の まとまり（いっぱいの 10の わく）を 10、20、30と かぞえ、べんきょうでは 100の いたも つかい、のせる たびに こえで かずを いいます。おもさ：はかりが 中心です。「はりで くらべる」は すうじの ない はかりで くらべます。「みためと ちがう」は まず よそうして（大きくても かるい ものが あります）、はかりで たしかめます。「はかりを よもう」は はりを よみます。べんきょうでは「はかりの よみかた」「g と kg」（1円玉＝1g … 1kg＝1000g）「はかって みよう」を します。ものを さわって のせたり おろしたり すると、こえで せつめいします。「ね、しっていた？（むかしは…）」には てんびん、もんめ（5円玉）、あた・ひろ、しゃく・すん、ごう・しょうが あります。おもさ 5・6、かさ 4・5 は まず おなじ たんいに なおし（1kg＝1000g、1L＝1000mL）、つぎに はかりや けいりょうカップで しめします。「うつして くらべよう」は「うつす」ボタン（または まちがい）で おなじ コップに うつします。「つりあわせよう」は 20までは つみき、それより 大きいと g の おもりです。はこを さわると 1こ のり、さらの おもりを さわると はこに もどります。おもりは 5こずつ ならびます。「はかって いれよう」は ゆびを 上下に うごかします。カップの 大きさ（200mL・500mL・1L）は がめんの 上で えらべます。',
      theme_kazu: 'かず',
      compteurs: 'れんしゅうする かぞえかた（「いくつ？」も この かぞえかたの ものだけ）',
      exemple: 'さいしょの もんだいの まえに れいを みせる（10の まとまり）',
      theme_nagasa: 'ながさ',
      theme_omosa: 'おもさ',
      theme_kasa: 'かさ',
      noms: 'ものの なまえを ひょうじする',
      court: '「短い」も きく',
      courtAide: '「長い」と「短い」は まちがえやすいので、「長い」が できてから つかいましょう。',
      oui: 'はい',
      non: 'いいえ',
      photos: 'いえの ものの しゃしん',
      photosAide: 'ものを よこむきに むじの かみの 上に おき、まうえから とってください。じょうぎで ながさを はかると、ただしい 大きさで ひょうじされます。ながさの ちがう ものを えらびましょう（れい：5・10・15・25cm）。キッチンスケールで おもさ（g）を はかったり、ボトルや パックの かさ（mL）を いれたり すると、おもさ・かさの もんだいにも でます。',
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
      genreVoix: 'こえ',
      femme: 'おんなの ひと',
      homme: 'おとこの ひと',
      voixPrecise: 'この きかいに ある にほんごの こえ',
      voixAuto: 'じどう',
      voixGrave: 'おとこの こえが ありません。いまの こえを ひくく して います。iPad：設定 › アクセシビリティ › 読み上げコンテンツ › 声 › 日本語 › Otoya（または Hattori）。Android（Galaxy）：設定 › 一般管理 › テキスト読み上げ › エンジンの せってい › 日本語 で おとこの こえを えらんで ください（ある ばあい）。',
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
      infos: 'ものの なまえと ながさ・おもさ・かさ',
      yomi: 'なまえ（ひらがな・ひっす）',
      kanjiChamp: 'なまえ（漢字・なくても よい）',
      cm: 'ほんとうの ながさ（cm）',
      cmAide: 'じょうぎで はしから はしまで はかってください（おもさか かさを いれたら なくても よい）。',
      erreurYomi: 'なまえを ひらがなで かいてください。',
      erreurCm: '1〜300cm の ながさを いれてください。',
      erreurMesure: 'ながさ・おもさ・かさの どれか 1つを いれてください。',
      erreurG: '1〜5000g の おもさを いれてください。',
      erreurMl: '10〜5000mL の かさを いれてください。',
      g: 'おもさ（g・キッチンスケールで）',
      gAide: 'なくても よい：おもさの もんだいに つかいます。',
      ml: 'かさ（mL・ラベルに かいてある）',
      mlAide: 'なくても よい：「うつして くらべよう」に つかいます。',
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
    let themePrecedent = null;
    THEMES.flatMap((th) => ordreTheme(th.cle)).forEach((a) => {
      if (themeDe(a) !== themePrecedent) {
        themePrecedent = themeDe(a);
        const titre = document.createElement('p');
        titre.className = 'sous-titre-reglage';
        titre.textContent = t(`theme_${themePrecedent}`);
        zone.append(titre);
      }
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
      const texte = reglages.langue === 'ja' ? `${numeroAffiche(a)}. ${lecture(a.titre)}（${lecture(a.sous)}）` : `${numeroAffiche(a)}. ${a.fr}`;
      label.append(input, document.createTextNode(texte));
      zone.append(label);
    });
    return zone;
  }

  // かぞえかた : les compteurs travaillés (いくつ？ n'utilise que des choses comptées avec eux).
  function groupeCompteurs() {
    const fs = document.createElement('fieldset');
    fs.className = 'reglage';
    const lg = document.createElement('legend');
    lg.textContent = t('compteurs');
    const zone = document.createElement('div');
    zone.className = 'options';
    TOUS_COMPTEURS.forEach((c) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = compteursActifs().includes(c);
      input.dataset.compteur = c;
      input.addEventListener('change', () => {
        const choisis = [...zone.querySelectorAll('input:checked')].map((x) => x.dataset.compteur);
        if (!choisis.length) {
          input.checked = true;
          return;
        }
        ecrireReglages({ compteurs: choisis });
      });
      const ex = A_COMPTER.find((x) => x[2] === c);
      label.append(input, document.createTextNode(`〜${c}（${ex[0]}）`));
      zone.append(label);
    });
    fs.append(lg, zone);
    return fs;
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
    [...photos].sort((a, b) => (a.cm || 0) - (b.cm || 0)).forEach((p) => {
      const ligne = document.createElement('div');
      ligne.className = 'photo-ligne';
      const img = document.createElement('img');
      img.src = urlPhoto(p);
      img.alt = '';
      const infos = document.createElement('div');
      infos.className = 'infos';
      const mesures = [p.cm ? `${p.cm} cm` : '', p.g ? `${p.g} g` : '', p.ml ? `${p.ml} mL` : ''].filter(Boolean).join(' · ');
      infos.innerHTML = `<strong>${echapper(p.kanji ? `${p.kanji}（${p.yomi}）` : p.yomi)}</strong><span>${echapper(mesures)}</span>`;
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
      groupeChoix('lireUnites', t('lireUnites'), [[true, t('oui')], [false, t('non')]]),
      groupeChoix('toucherLire', t('toucherLire'), [[true, t('oui')], [false, t('non')]], { apres: majBoutonsLire }),
      groupeChoix('noms', t('noms'), [[true, t('oui')], [false, t('non')]]),
      groupeChoix('court', t('court'), [[true, t('oui')], [false, t('non')]]),
      groupeChoix('aide', t('aide'), [[true, t('oui')], [false, t('non')]]),
    );
    const aideAide = document.createElement('p');
    aideAide.textContent = t('aideAide');
    bActivites.append(
      aideAide,
      groupeChoix('nombreMax', t('nombreMax'), [[10, '10'], [20, '20'], [50, '50'], [100, '100'], [1000, '1000']]),
      groupeChoix('compter', t('compter'), [[true, t('oui')], [false, t('non')]]),
    );
    bActivites.append(groupeCompteurs(), groupeChoix('exemple', t('exemple'), [[true, t('oui')], [false, t('non')]]));
    const etudeAide = document.createElement('p');
    etudeAide.textContent = t('etudeAide');
    const aideMV = document.createElement('p');
    aideMV.textContent = t('aideMV');
    bActivites.append(etudeAide, aideMV);
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
    // Femme / homme, puis (si l'appareil en a plusieurs) la voix exacte ; on l'entend à chaque choix.
    const essayerVoix = () => {
      rendreParents();
      parler(['この こえで はなすよ。 ', ...PHRASES.dotchiNagai]);
    };
    bVoix.append(groupeChoix('voixGenre', t('genreVoix'), [['femme', t('femme')], ['homme', t('homme')]], {
      apres: () => {
        ecrireReglages({ voixNom: '' });
        essayerVoix();
      },
    }));
    const installees = voixJa();
    if (installees.length > 1) {
      bVoix.append(groupeChoix('voixNom', t('voixPrecise'), [
        ['', t('voixAuto')],
        ...installees.map((v) => [v.name, VOIX_HOMME.test(v.name) ? `${v.name} (${t('homme')})` : v.name]),
      ], { apres: essayerVoix }));
    }
    if (voixGrave()) {
      const p = document.createElement('p');
      p.textContent = t('voixGrave');
      bVoix.append(p);
    }
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
    $('lbl-g').textContent = t('g');
    $('aide-g').textContent = t('gAide');
    $('lbl-ml').textContent = t('ml');
    $('aide-ml').textContent = t('mlAide');
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
    $('champ-g').value = '';
    $('champ-ml').value = '';
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
    // Longueur, poids, contenance : au moins une des trois (les autres peuvent rester vides).
    const lire = (id) => {
      const brut = String($(id).value).trim().replace(',', '.');
      return brut === '' ? null : Number(brut);
    };
    const cm = lire('champ-cm');
    const g = lire('champ-g');
    const ml = lire('champ-ml');
    const erreur = (cle, id) => {
      $('erreur-photo').textContent = t(cle);
      $(id).focus();
    };
    if (!yomi) return erreur('erreurYomi', 'champ-yomi');
    if (cm === null && g === null && ml === null) return erreur('erreurMesure', 'champ-cm');
    if (cm !== null && (!Number.isFinite(cm) || cm < 1 || cm > 300)) return erreur('erreurCm', 'champ-cm');
    if (g !== null && (!Number.isFinite(g) || g < 1 || g > 5000)) return erreur('erreurG', 'champ-g');
    if (ml !== null && (!Number.isFinite(ml) || ml < 10 || ml > 5000)) return erreur('erreurMl', 'champ-ml');
    const objet = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      yomi,
      kanji: kanji || null,
      cm: cm === null ? null : Math.round(cm * 10) / 10,
      g: g === null ? null : Math.round(g),
      ml: ml === null ? null : Math.round(ml),
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
