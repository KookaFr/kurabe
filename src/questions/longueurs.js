/* ======================================================================
   ながさ : génération des questions sur les longueurs, phrases et explications,
   objets alignés ou libres (décalés, penchés), preuve (règle, mesures, écart)
   ====================================================================== */

import {
  couleurs, dessinerEcart, dessinerRegle, objetDessine, objetPhoto, reserveRegle, SORTES,
} from '../dessins.js';
import { animationsReduites, ecranActuel } from '../ecrans.js';
import { $, aleatoire, choisir, entier, melanger } from '../outils.js';
import { photos, urlPhoto } from '../photos.js';
import { genererQuestionKazu } from './kazu.js';
import { consigneMV, estMV, explicationMV, genererQuestionMV, rappelMV } from './mv.js';
import { courante, majBoutonAide, rendreQuestion, repondre } from './session.js';
import { reglages } from '../reglages.js';
import { activable } from '../tactile.js';
import {
  CHIISA, cmTexte, html, htmlMots, ICHIBAN, MIJIKA, NAGA, nomDe, ONAJI, OOKI, PHRASES, segCm, segValeur, SUJI,
  TEHON,
} from '../texte.js';

export const valeurCm = (c) => ({ cm: c, m: null, x: c, u: 'cm', affichage: `${c}\u00a0cm`, lecture: `${c}センチ` });
const valeurM = (m) => ({ cm: m * 100, m, x: m, u: 'm', affichage: `${m}\u00a0m`, lecture: `${m}メートル` });

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

export function genererQuestion(niveau, derniere, i = 0, n = 6) {
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

/* ----- Phrases, règles et explications (dispatch vers おもさ / かさ / かず) ----- */

export function consigneDe(q) {
  if (estMV(q)) return consigneMV(q);
  if (q.type === 'paire' || q.type === 'nombre' || q.type === 'libre') {
    return q.demande === 'long' ? PHRASES.dotchiNagai : PHRASES.dotchiMijikai;
  }
  if (q.type === 'trio') return q.demande === 'long' ? PHRASES.ichibanNagai : PHRASES.ichibanMijikai;
  if (q.type === 'tehon') return PHRASES.tehon;
  return PHRASES.nagaiMijikai;
}

export function phraseDe(q, mot) {
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
export function rappelDe(q) {
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
export function explication(q) {
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

/* ----- Objets alignés à gauche : une ligne par objet ----- */

export let lignes = [];

export function creerLigne(objet, interactif, etiquette) {
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

// Au début de chaque rendu : plus de lignes ni d'objets libres.
export function reinitialiserLongueurs() {
  lignes = [];
  libres = [];
}

/* ----- Preuve après une bonne réponse : longueurs, règle, partie qui dépasse ----- */

let echelle = null;   // { ppc } : pixels par centimètre de la question affichée

export function afficherPreuve() {
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

/* ----- Objets décalés ou penchés (activités 8 et 9) ----- */

export let libres = [];          // { el, objet, index, L, h, finX }
let geometrie = null;     // { offsetX, ppc, couloir, marge }

export function rendreLibre(q, etabli) {
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
export function aligner() {
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

export function afficherReperesLibre() {
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

export function dimensionner() {
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

export function afficherReperes() {
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

export function rendrePhrase() {
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
