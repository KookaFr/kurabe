/* ======================================================================
   おもさ (masses) et かさ (liquides)
   Mêmes principes que pour les longueurs : de grosses différences d'abord, la preuve
   après chaque bonne réponse, et la règle « 重い／多い ＝ 数が大きい ».
   ====================================================================== */

import {
  angleBalance, creerBalance, creerChose, creerContenant, creerHakari, creerVerre, creerVerreGradue, dessinerEcart,
  balanceNumerique, etiquetteMesure, nomMV, poserBalance, tournerAiguille,
} from '../dessins.js';
import { animationsReduites } from '../ecrans.js';
import { MAX_HAKARI } from '../lecons/moteur.js';
import { $, choisir, entier, melanger } from '../outils.js';
import { photos } from '../photos.js';
import { consigneKazu, explicationKazu, messageErreurKazu, rappelKazu, rendreKazuQ } from './kazu.js';
import { courante, repondre } from './session.js';
import { reglages } from '../reglages.js';
import { tp } from '../textes-perso.js';
import { activable } from '../tactile.js';
import {
  AGA, CHIISA, html, htmlMots, ICHIBAN, KARU, MEMORI, MI, MOTS, nombreUnite, nomDe, OMO, ONAJI, OO_I, OOKI, SAGA, segU,
  segValeur, SUJI, SUKU,
} from '../texte.js';

const UNITES = {
  g: { d: 'g', s: 'グラム', facteur: 1 },
  kg: { d: 'kg', s: 'キログラム', facteur: 1000 },
  ml: { d: 'mL', s: 'ミリリットル', facteur: 1 },
  l: { d: 'L', s: 'リットル', facteur: 1000 },
};

export const uniteDe = (theme) => (theme === 'omosa' ? 'g' : 'ml');
const valeurU = (x, u) => ({
  x, u, val: x * UNITES[u].facteur, grande: UNITES[u].facteur > 1,
  affichage: `${x}\u00a0${UNITES[u].d}`, lecture: `${x}${UNITES[u].s}`,
});
const motDe = (theme, sens) => MOTS[theme][sens];

// Objets à peser. « taille » : grosseur à l'écran (1 = normal). Poids réalistes, en g.
export const CHOSES = [
  { yomi: 'ふうせん', kanji: '風船', emoji: '🎈', val: 5, taille: 1.5 },
  { yomi: 'はね', kanji: '羽', emoji: '🪶', val: 1, taille: 1.15 },
  { yomi: 'ぬいぐるみ', emoji: '🧸', val: 150, taille: 1.45 },
  { yomi: 'いし', kanji: '石', emoji: '🪨', val: 700, taille: 0.75 },
  { yomi: 'かんづめ', kanji: null, emoji: '🥫', val: 400, taille: 0.7 },
  { yomi: 'りんご', emoji: '🍎', val: 300, taille: 0.85 },
  { yomi: 'いちご', emoji: '🍓', val: 20, taille: 0.55 },
  { yomi: 'たまご', kanji: '卵', emoji: '🥚', val: 60, taille: 0.6 },
  { yomi: 'ほん', kanji: '本', emoji: '📕', val: 500, taille: 1 },
  { yomi: 'バナナ', emoji: '🍌', val: 120, taille: 0.95 },
  { yomi: 'ボール', emoji: '⚽', val: 430, taille: 1.1 },
  { yomi: 'みかん', emoji: '🍊', val: 100, taille: 0.65 },
  { yomi: 'かぎ', kanji: null, emoji: '🔑', val: 10, taille: 0.55 },
  { yomi: 'トマト', emoji: '🍅', val: 200, taille: 0.7 },
  { yomi: 'くつ', kanji: '靴', emoji: '👟', val: 250, taille: 1.1 },
];
export const chose = (yomi) => CHOSES.find((c) => c.yomi === yomi);
export const objetChose = (c) => ({ type: 'chose', ...c });
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
  bin: { yomi: 'びん', kanji: null, w: 0.34, h: 1, forme: 'bin' },
  kappu: { yomi: 'カップ', w: 0.5, h: 0.6, forme: 'tasse' },
  boru: { yomi: 'ボウル', w: 1, h: 0.42, forme: 'bol' },
  nabe: { yomi: 'なべ', kanji: null, w: 0.8, h: 0.55, forme: 'nabe' },
};
export const capacite = (c) => Math.round(c.w * c.w * c.h * 2600);

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

export function genererQuestionMV(niveau, derniere, i, n) {
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
    objets = melanger(p.objets.map((o, k) => ({ yomi: o.c.yomi, kanji: o.c.kanji || null, contenant: o.c, val: o.val, couleur: boissons[k].couleur, boisson: boissons[k] })));
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

export function regleMV(theme, sens, superlatif) {
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

export function consigneMV(q) {
  if (q.theme === 'kazu') return consigneKazu(q);
  if (q.type === 'lecture') return [nomDe(q.objets[0]), 'の ', OMO, 'さは ', segU('なん', 'g'), '？'];
  const mot = motDe(q.theme, q.demande);
  if (q.type === 'devine' && q.etape === 'devine') return ['どっちが ', ...mot, 'と おもう？'];
  if (q.objets.length === 3) return [ICHIBAN, ' ', ...mot, 'のは どれ？'];
  return ['どっちが ', ...mot, '？'];
}

export function rappelMV(q) {
  if (q.theme === 'kazu') return rappelKazu(q);
  if (q.type === 'lecture') {
    if (q.pas === 100) return [OOKI, 'きい ', MEMORI, ' 1つ ＝ ', segU(100, 'g')];
    return ['ちいさい ', MEMORI, ' 1つ ＝ ', segU(10, 'g')];
  }
  const mot = motDe(q.theme, q.demande);
  const taille = q.demande === 'plus' ? [OOKI, 'きい'] : [CHIISA, 'さい'];
  if (q.type === 'balance') {
    return q.demande === 'plus' ? [SAGA, 'がった ほう ＝ ', OMO, 'い'] : [AGA, 'がった ほう ＝ ', KARU, 'い'];
  }
  if (q.type === 'devine' && balanceNumerique()) {
    return q.demande === 'plus' ? [SUJI, 'が ', OOKI, 'きい ほう ＝ ', OMO, 'い'] : [SUJI, 'が ', CHIISA, 'さい ほう ＝ ', KARU, 'い'];
  }
  if ((q.type === 'hakari' && q.simple) || q.type === 'devine') {
    return q.demande === 'plus' ? ['はりが たくさん まわった ほう ＝ ', OMO, 'い'] : ['はりが すこし まわった ほう ＝ ', KARU, 'い'];
  }
  if (q.objets.length === 3) return [ICHIBAN, ' ', ...mot, ' ＝ ', SUJI, 'が ', ICHIBAN, ' ', ...taille];
  const unite = q.mixte ? [ONAJI, 'じ たんいなら '] : [];
  return [...unite, ...tp(`regle.${q.theme}.${q.demande}`)];
}

export function explicationMV(q) {
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
    const aiguille = balanceNumerique()
      ? (q.demande === 'plus'
        ? ['はかりの ', SUJI, 'が ', ICHIBAN, ' ', OOKI, 'きい ものが ', ICHIBAN, ' ', OMO, 'い。 ']
        : ['はかりの ', SUJI, 'が ', ICHIBAN, ' ', CHIISA, 'さい ものが ', ICHIBAN, ' ', KARU, 'い。 '])
      : (q.demande === 'plus'
        ? ['はりが ', ICHIBAN, ' すすんだ ものが ', ICHIBAN, ' ', OMO, 'い。 ']
        : ['はりの うごきが ', ICHIBAN, ' ちいさい ものが、 ', ICHIBAN, ' ', KARU, 'い。 ']);
    const debut = q.type === 'hakari' ? aiguille : regleVerres(q.demande);
    return [...debut, ...mesures, ...regleMV(q.theme, q.demande, true), referenceMV(q, q.bonne), 'だね。'];
  }
  const lourd = idxMaxV(t);
  const leger = 1 - lourd;
  if (q.type === 'hakari' || q.type === 'devine') {
    const piege = q.type === 'devine' && q.piege ? [referenceMV(q, leger), 'は ', OOKI, 'きい けど ', KARU, 'いね。 '] : [];
    if (q.type === 'devine' && balanceNumerique()) {
      return q.demande === 'plus'
        ? ['はかりの ', SUJI, 'が ', OOKI, 'きい ほうが ', OMO, 'い。 ', ...mesures, ...piege, 'だから ', referenceMV(q, q.bonne), 'の ほうが ', OMO, 'い。']
        : ['はかりの ', SUJI, 'が ', CHIISA, 'さい ほうが ', KARU, 'い。 ', ...mesures, ...piege, 'だから ', referenceMV(q, q.bonne), 'の ほうが ', KARU, 'い。'];
    }
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
    // Les deux liquides sont dans des récipients identiques : on dit aussi lequel (なべの おちゃ).
    const liquide = (i) => (avecContenants(q) && t[i].boisson ? [referenceMV(q, i), 'の ', nomDe(t[i].boisson)] : [referenceMV(q, i)]);
    debut = [...ouVerser(q), ' うつすと、 ', ...liquide(lourd), 'の ほうが たかいね。 '];
    if (q.piege) debut.push(referenceMV(q, leger), 'は たかく ', MI, 'えた けど、 ', SUKU, 'なかったね。 ');
  }
  const ecart = Math.abs(t[0].val - t[1].val);
  return [...debut, ...mesures, ...regleMV(q.theme, q.demande), referenceMV(q, q.bonne), 'の ほうが ', segU(ecart, u), ' ', ...mot, 'ね。'];
}

export function messageErreurMV(q) {
  if (q.theme === 'kazu') return messageErreurKazu(q);
  if (q.type === 'devine') {
    const regle = balanceNumerique()
      ? (q.demande === 'plus' ? [SUJI, 'が ', OOKI, 'きい ほうが ', OMO, 'い。'] : [SUJI, 'が ', CHIISA, 'さい ほうが ', KARU, 'い。'])
      : (q.demande === 'plus' ? ['はりが たくさん まわった ほうが ', OMO, 'い。'] : ['はりが すこししか まわらない ほうが ', KARU, 'い。']);
    return q.essais.size <= 1 ? [...tp('mv.devine'), ' ', ...regle] : ['おしい！ ', ...regle];
  }
  if (q.type === 'balance') return ['おしい！ ', ...regleBalance(q.demande)];
  if (q.type === 'hakari') return tp(balanceNumerique({ aiguille: q.simple }) ? 'mv.hakariNum' : 'mv.hakari');
  if (q.type === 'lecture') return indiceLecture(q.bonne, [...q.essais].pop());
  if (q.type === 'transvaser' && q.versePourErreur) {
    q.versePourErreur = false;
    return tp('mv.transvaser', { どこ: ouVerser(q) });
  }
  return tp('mv.verres');
}

/* ----- Dessins : objets, balance, はかり, verres et récipients ----- */

export let cibles = [];   // ce que l'élève touche pour répondre (plateaux, はかり, verres…) : { el, index }

export function cible(el, index, label) {
  const q = courante();
  el.setAttribute('aria-label', label);
  if (q.resolu && index === q.bonne) el.classList.add('juste');
  if (q.essais.has(index)) el.classList.add('essaye');
  activable(el, () => repondre(index));
  cibles.push({ el, index });
}

// Au début de chaque rendu : plus de cibles.
export function reinitialiserCibles() {
  cibles = [];
}

/* ----- Rendu des questions おもさ / かさ ----- */

export const estMV = (q) => Boolean(q && q.theme && q.theme !== 'nagasa');

export function rendreMV(q, etabli) {
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
  // Toute la はかり doit tenir : la charge, le plateau (≈ 14 px) et le corps (1,08 × le cadran).
  const D = Math.max(80, Math.min((H - hCharge - 18) / 1.08, W * 0.6, 300));
  const charge = document.createElement('span');
  charge.className = 'hakari-charge';
  charge.style.height = `${hCharge}px`;
  if (q.preuve) charge.append(etiquetteMesure(q.valeur, 'g'));
  charge.append(creerChose(q.objets[0], Math.max(24, Math.min((hCharge - 34) / 1.6, 80))));
  const plateau = document.createElement('span');
  plateau.className = 'hakari-plateau';
  plateau.style.width = `${D * 1.05}px`;
  const corps = creerHakari(D, q.max, { etiquette: 100, trait: 10, aiguille: true });   // on apprend à lire l'aiguille
  const svg = corps.querySelector('svg');
  if (q.preuve) svg.classList.add('avec-secteur');
  col.append(charge, plateau, corps);
  scene.append(col);
  if (q.vuAiguilles || animationsReduites()) tournerAiguille(svg, q.valeur, q.max);
  else setTimeout(() => { scene.classList.add('anime'); tournerAiguille(svg, q.valeur, q.max); }, 400);
  q.vuAiguilles = true;
}

// Les trois réponses de 「はかりを よもう」, en grands boutons sous l'établi. Elles s'affichent AVANT
// qu'on mesure la place de la はかり (sinon elle était dessinée trop grande, puis coupée en bas).
export function remplirChoixLecture(q) {
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
    // はりで くらべる : l'aiguille, toujours (c'est ce qu'on compare) ; 見た目と ちがう suit le réglage.
    const corps = creerHakari(D, q.max, { nombres: !q.simple, aiguille: q.type === 'hakari' && q.simple });
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

// Après avoir versé, chaque récipient porte SON nom : la copie s'appelle comme la référence (なべ),
// le récipient vidé garde le sien (カップ). Une étiquette sous chaque récipient de la ligne, dans le même
// ordre, à la largeur de son récipient (alignerNoms, une fois dans la page).
const COPPU = { yomi: 'コップ', kanji: null };
function nomsSous(objets) {
  const r = document.createElement('span');
  r.className = 'noms-cote';
  objets.forEach((o) => r.append(nomMV(o)));
  return r;
}
function alignerNoms(scene) {
  scene.querySelectorAll('.verre-col').forEach((col) => {
    const ligne = col.querySelector(':scope > .verre-ligne:not(.pile)');
    const noms = col.querySelector(':scope > .noms-cote');
    if (!ligne || !noms) return;
    [...noms.children].forEach((n, i) => { if (ligne.children[i]) n.style.width = `${ligne.children[i].offsetWidth}px`; });
  });
}

// Verres identiques (aussi après avoir versé, activité 21). « avant » : petits récipients vides à côté.
function rendreVerresQ(q, scene, W, H, objets, avant) {
  const n = objets.length;
  let colW = Math.min(250, (W - 16 * (n - 1)) / n);
  // Écran très bas (téléphone, explication affichée) : les verres d'abord, les noms ensuite.
  const avecNoms = reglages.noms && H >= 190;
  const hNom = avecNoms ? 30 : 0;
  let h = Math.max(48, Math.min(H - hNom - 64, 330));
  let w = Math.max(36, Math.min(colW * 0.75, h * 0.55, 150));
  // Après avoir versé (うつして くらべよう) : récipients et verres À LA MÊME ÉCHELLE (S2 px par unité),
  // avec le même modèle que les récipients (contenance ＝ largeur² × hauteur × 2600 mL) : le liquide
  // a le même volume avant et après ; il monte plus haut dans le verre étroit, c'est tout.
  let S2 = 0;
  let largeurs = null;
  if (avant) {
    const formes = objets.map((o) => o.contenant || { w: 0.8, h: 0.8 });
    const Wg = 0.45;                                              // largeur des verres (identiques)
    const hLiquide = Math.max(...objets.map((o) => o.val)) / (2600 * Wg * Wg);
    const hVerre = Math.max(hLiquide * 1.12, ...formes.map((c) => c.h), 0.6);
    const largeurTotale = formes.reduce((t, c) => t + c.w + Wg + 0.2, 0);
    // 46 px au-dessus pour le récipient penché ; pas plus grand qu'avant (c'est le même récipient).
    S2 = Math.max(30, Math.min((W - 16 * (n - 1) - 12 * n) / largeurTotale, (H - hNom - 64 - (q.preuve ? 0 : 46)) / hVerre, q.echelle || 400));
    q.echelle = S2;
    w = Wg * S2;
    h = hVerre * S2;
    q.cap = Math.round(2600 * Wg * Wg * hVerre);                 // ce que contient un verre plein
    // (Au moins la largeur d'une étiquette « 1000 mL » : elles ne se chevauchent pas.)
    largeurs = formes.map((c) => Math.max((c.w + Wg + 0.2) * S2 + 12, Math.min(96, (W - 16 * (n - 1)) / n)));
    colW = Math.max(...largeurs);
  }
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
    col.style.width = `${largeurs ? largeurs[k] : colW}px`;
    const pill = etiquetteMesure(o.val, 'ml');
    pill.style.visibility = q.preuve ? 'visible' : 'hidden';
    const ligne = document.createElement('span');
    ligne.className = 'verre-ligne';
    let mini = null;
    let taille = 0;
    if (avant) {
      // Le récipient d'origine : il monte au-dessus du verre, se penche et se vide pendant que le verre
      // se remplit (la même quantité : « うつしても かさは かわらない »), puis se redresse, vide.
      taille = S2;
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
      }
    }
    ligne.append(v);
    col.append(pill, ligne, avant ? nomsSous([o, COPPU]) : nomMV(o));
    cible(col, k, `${POSITIONS_MV[n]?.[k] || ''} ${o.yomi}`);
    rangee.append(col);
  });
  q.vuVerres = true;
  scene.append(rangee);
  if (avant) alignerNoms(scene);
  if (q.preuve) preuveVerres(q, scene, objets);
}

// Preuve : un trait au niveau le plus bas, et la partie en plus dans le verre le plus rempli.
// (sel, cap : les récipients identiques à comparer et ce qu'ils contiennent ; des verres par défaut.)
function preuveVerres(q, scene, objets, sel = '.verre', cap = q.cap) {
  const verres = [...scene.querySelectorAll(sel)];
  if (verres.length < 2) return;
  const base = scene.getBoundingClientRect();
  const niveaux = verres.map((v, k) => {
    const r = v.getBoundingClientRect();
    // Niveau calculé (pas mesuré) : juste même si le liquide est encore en train de monter.
    const bord = parseFloat(getComputedStyle(v).borderBottomWidth) || 0;
    return { r, y: r.bottom - bord - Math.min(1, objets[k].val / cap) * v.clientHeight - base.top };
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

// うつして くらべよう avec deux récipients dessinés : on verse l'un dans un récipient IDENTIQUE à l'autre.
// Celui-ci (la référence) est un récipient où les deux quantités tiennent ; le plus étroit si possible,
// car les hauteurs s'y distinguent mieux. Son liquide ne bouge pas.
const avecContenants = (q) => q.objets.every((o) => o.contenant);
function refTransvaser(q) {
  if (q.ref === undefined) {
    const t = q.objets;
    const maxV = Math.max(...t.map((o) => o.val));
    const tient = t.map((o, k) => k).filter((k) => capacite(t[k].contenant) >= maxV * 1.08);
    q.ref = tient.length
      ? tient.reduce((m, k) => (t[k].contenant.w < t[m].contenant.w ? k : m))
      : idxMaxV(t.map((o) => ({ val: capacite(o.contenant) })));
  }
  return q.ref;
}

// Où l'on verse, pour les phrases : 「おなじ ボウルに」 (「おなじ コップに」 avec les photos).
export function ouVerser(q) {
  if (q.type !== 'transvaser' || !avecContenants(q)) return [ONAJI, 'じ コップに'];
  const c = q.objets[refTransvaser(q)].contenant;
  return [ONAJI, 'じ ', reglages.noms ? nomDe(c) : 'いれもの', 'に'];
}

// Même échelle avant et après avoir versé : la référence ne change pas de taille, et le récipient versé
// garde la sienne. La place « après » compte : référence ＋ récipient versé ＋ sa copie, et la place du
// récipient penché. Deux dispositions : côte à côte (écran large), ou le récipient à verser AU-DESSUS de
// sa copie (écran haut, téléphone debout) ; on garde celle qui donne les plus grands récipients.
// (Preuve affichée : plus d'animation, la place du récipient penché n'est plus nécessaire.)
function echelleTransvaser(q, W, H, hNom) {
  const libre = Boolean(q.preuve);
  const t = q.objets;
  const formes = t.map((o) => o.contenant || { w: 0.8, h: 0.8 });
  const S = Math.min((H - hNom - 30) / Math.max(...formes.map((c) => c.h)), (W - 60) / formes.reduce((s, c) => s + c.w * 1.15, 0), 380);
  if (!avecContenants(q)) return Math.max(30, S);
  const r = refTransvaser(q);
  const rc = formes[r];
  const ac = formes[1 - r];
  const hMax = Math.max(rc.h, ac.h);
  const hDispo = H - hNom - 64;
  // Côte à côte. Un récipient haut (びん) qui se penche déborde sur le côté (0,88 × hauteur − 0,53 × largeur).
  // (Colonnes : bordure 3 px et marge 4 px de chaque côté ; 14 px entre elles, 10 px dans la colonne.)
  const deborde = Math.max(0, 0.88 * ac.h - 0.53 * ac.w);
  const cote = Math.min(S, (W - 56) / (2 * rc.w + ac.w), (W - 120) / (rc.w + ac.w), (hDispo - 10) / hMax,
    libre ? 999 : (W - 44) / (2 * rc.w + ac.w + deborde), libre ? 999 : (hDispo + 16) / (hMax + 0.9 * ac.w));
  // L'un au-dessus de l'autre. Penché (85°), il s'allonge au-dessus de la référence : sa largeur en haut.
  const large = Math.max(ac.w, rc.w);
  const pile = Math.min(S, (W - 50) / (large + rc.w), (hDispo - 42) / (ac.h + rc.h),
    libre ? 999 : (hDispo + 20) / (rc.h + 0.1 * ac.h + ac.w), libre ? 999 : (W - 30) / ((large - rc.w) / 2 + 0.35 * rc.w + 0.1 * ac.w + ac.h));
  if (q.empile === undefined) q.empile = pile > cote * 1.1;
  return Math.max(30, q.empile ? pile : cote);
}

function rendreTransvaserApres(q, scene, W, H) {
  const t = q.objets;
  const r = refTransvaser(q);
  const refC = t[r].contenant;
  const avecNoms = reglages.noms && H >= 190;
  const hNom = avecNoms ? 30 : 0;
  // Une seule échelle pour tous les récipients ; si la place manque, ils rapetissent TOUS ensemble.
  let S = Math.min(echelleTransvaser(q, W, H, hNom), q.echelle || 400);
  // Explication affichée sur un petit écran : plutôt que de tout rapetisser, on retire le récipient vidé
  // (il a servi) ; les deux récipients à comparer gardent leur taille.
  let sansVide = false;
  if (q.preuve && S < (q.echelle || 400) * 0.97) {
    const S2 = Math.min((W - 56) / (2 * refC.w), (W - 120) / refC.w, (H - hNom - 74) / refC.h, q.echelle || 400);
    if (S2 > S) { S = S2; sansVide = true; }
  }
  q.echelle = S;
  const ECART = 10;   // entre le récipient versé et sa copie (.verre-ligne)
  const rangee = document.createElement('div');
  rangee.className = 'rangee-mv';
  rangee.classList.toggle('sans-noms-mv', !avecNoms);
  // Référence et copie voisines : assez d'écart pour leurs étiquettes (≈ 90 px).
  if (!q.empile || sansVide) rangee.style.gap = `${Math.max(14, Math.round(76 - refC.w * S))}px`;
  // L'animation dure 3,3 s ; si l'écran se redessine pendant ce temps, elle reprend où elle en était.
  const maintenant = performance.now();
  if (!q.vuVerres) q.debutVerse = maintenant;
  const ecoule = maintenant - (q.debutVerse || 0);
  const verser = !animationsReduites() && ecoule < 3300;
  rangee.style.setProperty('--decalage', `${-Math.round(ecoule)}ms`);
  let penche = null;
  t.forEach((obj, k) => {
    const col = document.createElement('button');
    col.type = 'button';
    col.className = 'verre-col';
    const pill = etiquetteMesure(obj.val, 'ml');
    pill.style.visibility = q.preuve ? 'visible' : 'hidden';
    const ligne = document.createElement('span');
    ligne.className = 'verre-ligne';
    if (k === r) {
      // La référence : le même récipient qu'avant, avec son liquide.
      const ref = creerContenant(obj, S);
      ref.classList.add('a-comparer');
      ligne.append(ref);
      col.append(pill, ligne, nomMV(obj));
    } else {
      // L'autre : son récipient se penche et se vide dans une copie de la référence. Côte à côte, le
      // récipient vidé est du côté extérieur (les deux récipients identiques au milieu) ; empilés, il est
      // au-dessus de sa copie et, penché, s'allonge au-dessus de la référence.
      const aGauche = k === 0;
      const copie = creerContenant({ ...obj, contenant: refC }, S);
      copie.classList.add('a-comparer');
      const mini = creerContenant(obj, S);
      mini.classList.add('mini');
      const liq = mini.querySelector('.liquide');
      liq.style.setProperty('--h0', liq.style.height);
      liq.style.height = '0%';
      const wCopie = refC.w * S;
      const hMini = obj.contenant.h * S;
      const wMini = obj.contenant.w * S;
      const filet = document.createElement('span');
      filet.className = 'filet';
      filet.style.setProperty('--c', obj.couleur);
      penche = { mini, copie, filet, aGauche, wMini, hMini, empile: q.empile };
      if (sansVide) {
        penche = null;
        ligne.append(copie);
        col.append(pill, ligne, nomMV(refC));
      } else if (q.empile) {
        // Il verse par le coin du côté de sa colonne et s'allonge vers la référence.
        // Son nom (カップ) juste sous lui ; sous la copie, celui de la référence (なべ).
        penche.pivotGauche = aGauche;
        ligne.classList.add('pile');
        const nomVide = nomMV(obj);
        nomVide.classList.add('nom-vide');
        ligne.append(mini, nomVide, pill, copie);
        col.append(ligne, nomMV(refC));
      } else {
        // Son bord monte au-dessus de la copie ; en tournant, l'autre bord remonte (0,88 × sa largeur)
        // et le fond part sur le côté (0,88 × sa hauteur).
        const avance = Math.min(wCopie * 0.35, 40);
        const monte = Math.max(0, refC.h * S - hMini + 14);
        Object.assign(penche, { pivotGauche: !aGauche, avance, monte, haut: hMini + monte + wMini * 0.88, cote: hMini * 0.88 - wMini * 0.53 - avance });
        filet.style[aGauche ? 'left' : 'right'] = `${Math.max(4, avance - ECART - 3)}px`;
        if (aGauche) ligne.append(mini, copie); else ligne.append(copie, mini);
        // L'étiquette (mL) au-dessus de la copie, pas au milieu de la colonne.
        pill.style.transform = `translateX(${(aGauche ? 1 : -1) * (wMini + ECART) / 2}px)`;
        col.append(pill, ligne, nomsSous(aGauche ? [obj, refC] : [refC, obj]));
      }
      if (penche) filet.classList.toggle('droite', q.empile ? !penche.pivotGauche : !aGauche);
      if (penche && verser) {
        liq.classList.add('vide-anime');
        copie.querySelector('.liquide').classList.add('verse');
        copie.append(filet);
        penche.verser = true;   // l'animation du récipient démarre une fois sa place calculée
      }
    }
    cible(col, k, `${POSITIONS_MV[2][k] || ''} ${obj.yomi}`);
    rangee.append(col);
  });
  q.vuVerres = true;
  scene.append(rangee);
  alignerNoms(scene);
  if (penche && penche.verser) placerVersement(scene, rangee, penche, ECART);
  if (q.preuve) preuveVerres(q, scene, t, '.a-comparer', capacite(refC));
}

// Le récipient penché ne sort pas du cadre : la rangée se décale (vers le bas, sur le côté) s'il y a de
// la place, sinon il monte moins haut. Même décalage avant et après l'animation : rien ne saute.
function placerVersement(scene, rangee, p, ecart) {
  const cadre = scene.parentElement.getBoundingClientRect();
  const rc = p.copie.getBoundingClientRect();
  const rr = rangee.getBoundingClientRect();
  let dx = 0;
  let dy = 0;
  if (p.empile) {
    // Le coin qui verse (pivot) au-dessus de la copie, à 35 % de son bord ; penché à 85°, le récipient
    // s'étend au-dessus du pivot (sa largeur) et vers la référence (sa hauteur), sans descendre plus bas
    // que le bord de la copie. (offsetLeft/offsetTop : positions sans l'animation, dans la .pile.)
    const { mini, copie, wMini: wM, hMini: hM } = p;
    const wC = copie.offsetWidth;
    const px = p.pivotGauche ? copie.offsetLeft + 0.35 * wC : copie.offsetLeft + 0.65 * wC;
    const py = copie.offsetTop - 10 - 0.09 * hM;
    const pivotX = p.pivotGauche ? mini.offsetLeft : mini.offsetLeft + mini.offsetWidth;
    mini.style.setProperty('--angle', '85deg');
    mini.style.setProperty('--avance', `${Math.round(p.pivotGauche ? pivotX - px : px - pivotX)}px`);
    mini.style.setProperty('--monte', `${Math.round(mini.offsetTop - py)}px`);
    p.filet.style[p.pivotGauche ? 'left' : 'right'] = `${Math.round(0.35 * wC - 3)}px`;
    const haut = rc.top - 10 - 0.09 * hM - wM;
    dy = Math.max(0, Math.min(cadre.top + 8 - haut, cadre.bottom - 2 - rr.bottom));
    const bout = 0.35 * wC + 0.09 * wM + hM;
    if (p.pivotGauche) {
      const droite = rc.left + bout;
      dx = -Math.max(0, Math.min(droite - (cadre.right - 4), rr.left - (cadre.left + 2)));
    } else {
      const gauche = rc.right - bout;
      dx = Math.max(0, Math.min(cadre.left + 4 - gauche, cadre.right - 2 - rr.right));
    }
  } else {
    p.mini.style.setProperty('--avance', `${p.avance}px`);
    if (p.cote > 0) {
      if (p.aGauche) {
        const gauche = rc.left - ecart - p.wMini - p.cote;
        dx = Math.max(0, Math.min(cadre.left + 2 - gauche, cadre.right - 2 - rr.right));
      } else {
        const droite = rc.right + ecart + p.wMini + p.cote;
        dx = -Math.max(0, Math.min(droite - (cadre.right - 2), rr.left - (cadre.left + 2)));
      }
    }
    const haut = rc.bottom - p.haut;
    dy = Math.max(0, Math.min(cadre.top + 8 - haut, cadre.bottom - 2 - rr.bottom));
    const manque = cadre.top + 8 - (haut + dy);
    p.mini.style.setProperty('--monte', `${Math.max(0, p.monte - Math.max(0, manque))}px`);
  }
  if (dx || dy) {
    rangee.style.position = 'relative';
    rangee.style.left = `${Math.round(dx)}px`;
    rangee.style.top = `${Math.round(dy)}px`;
  }
  // Seulement maintenant : une animation déjà lancée garderait les anciennes valeurs (--monte…) dans Chrome.
  if (p.verser) {
    p.mini.classList.add('versement');
    p.mini.classList.toggle('vers-gauche', p.pivotGauche);
  }
}

// La hauteur de l'établi quand ce message sera affiché sous lui (mesurée, puis on remet l'ancien).
function hauteurAvecMessage(scene, H, message) {
  const retour = $('retour');
  const etabli = scene.parentElement;
  if (!retour || !etabli) return H;
  const ancien = retour.innerHTML;
  const avant = etabli.clientHeight;
  retour.innerHTML = htmlMots(message);
  const apres = etabli.clientHeight;
  retour.innerHTML = ancien;
  return H - Math.max(0, avant - apres);
}

function rendreTransvaserQ(q, scene, W, H) {
  if (q.etape === 'apres') {
    if (avecContenants(q)) rendreTransvaserApres(q, scene, W, H);
    else rendreVerresQ(q, scene, W, H, q.objets, true);
    return;
  }
  const hNom = reglages.noms ? 30 : 0;
  // Dès le début, la taille qui tiendra encore quand le message 「おなじ なべに うつしたよ…」 s'affichera
  // (sur téléphone, il prend de la place) : en versant, aucun récipient ne change de taille.
  const message = [...ouVerser(q), ' うつしたよ。 うつしても かさは かわらないよ。 では、 どっちが すくない？'];
  const S = Math.min(echelleTransvaser(q, W, hauteurAvecMessage(scene, H, message), hNom), q.echelle || 400);
  q.echelle = S;
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
        // Le corps fait 1,12 × le cadran : 0,85 × la colonne laisse une petite marge.
        const corps = creerHakari(Math.max(50, Math.min(colW * 0.85, hJauge / 1.1, 220)), q.max);
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

/* ----- Lire la はかり (questions et leçons) ----- */

// Lire la はかり, après une erreur : ce qui est déjà juste, puis ce qu'il faut regarder.
// - les centaines fausses → les grands 目もり ;
// - les centaines justes, les dizaines fausses → les petits 目もり, comptés à partir de la centaine.
export function indiceLecture(bonne, choisi) {
  const c = Math.floor(bonne / 100) * 100;
  const memeCentaine = typeof choisi === 'number' && Math.floor(choisi / 100) === c / 100;
  if (!memeCentaine) {
    return tp('lecture.grands');
  }
  if (bonne === c) return tp('lecture.juste', { 数: c });
  if (!c) return tp('lecture.petitsZero');
  return tp('lecture.petits', { 数: c });
}

// Lire la はかり : grandes graduations (100 g) et petites (10 g).
export function lectureHakari(v) {
  const c = Math.floor(v / 100) * 100;
  const p = (v - c) / 10;
  if (!c) return ['ちいさい ', MEMORI, ' ', String(p), 'つ。 ', segU(v, 'g'), '。'];
  if (!p) return ['はりは ', String(c), 'を さして いる。 ', segU(v, 'g'), '。'];
  return [String(c), 'と、 ちいさい ', MEMORI, ' ', String(p), 'つ。 ', segU(v, 'g'), '。'];
}

export function choixLecture(v) {
  const faux = new Set();
  const candidats = melanger([v + 100, v - 100, v + 50, v - 50, v + 20, v - 20, v + 10 * (v % 100 ? 0 : 3)]);
  candidats.forEach((x) => { if (faux.size < 2 && x !== v && x > 0 && x <= MAX_HAKARI) faux.add(x); });
  return melanger([v, ...faux]);
}
