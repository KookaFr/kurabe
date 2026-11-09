/* ======================================================================
   べんきょう : tirer un ruban sur la règle et voir les nombres changer
   (étirer librement, additionner en tirant à droite, soustraire à gauche)
   ====================================================================== */

import { ACTIVITES } from '../accueil.js';
import { dessinerRegle } from '../dessins.js';
import { ecranActuel, montrer, terminer } from '../ecrans.js';
import { dessinerRuban } from './ruban.js';
import {
  consigneEtudeMV, dessinerEtudeMV, equationEtudeMV, estEtudeMV, LIMITES_VOLUME, nouveauProblemeMV, reussirEtudeMV,
  verifierEtudeMV, volumeMax,
} from './verre.js';
import { demarrerLecon, estLecon, LECONS, leconSuivante, rendreLecon } from '../lecons/moteur.js';
import { dejaVue, ouvrirExplication } from '../explications.js';
import { tp } from '../textes-perso.js';
import { $, entier } from '../outils.js';
import { plateforme } from '../plateforme.js';
import { ecrireReglages, reglages } from '../reglages.js';
import { activable } from '../tactile.js';
import { htmlMots, PHRASES, SUJI, uniteHtml } from '../texte.js';
import { note, parler, sons } from '../voix.js';

export let etude = null;

export function demarrerEtude(mode) {
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
  // La première fois, le verre doseur commence par l'explication 「目もりって なに？」.
  if (mode === 'verre' && !dejaVue('kappu')) ouvrirExplication('kappu', { apres: () => parler(consigneEtude(true)) });
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
export function pasBoutons() {
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

export function consigneEtude(pourVoix) {
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

export function rendreEtude() {
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

export function majCommandesEtude() {
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
  if (reglages.sons) plateforme.retour.vibrer(8);
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
  if (reglages.sons) plateforme.retour.vibrer(8);
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

export function messageEtude(segments, ok) {
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

export function reussirEtude() {
  const e = etude;
  e.resolu = true;
  sons.succes();
  const op = e.mode === 'plus' ? ' たす ' : ' ひく ';
  const message = estEtudeMV() ? reussirEtudeMV() : [...PHRASES.seikai, String(e.base), op, String(e.pas), ' は ', String(e.cible), '。'];
  messageEtude(message, true);
  parler(message);
  if (estEtudeMV()) dessinerEtudeMV(); else dessinerRuban();
}

// Glisser n'importe où sur la zone : le ruban suit le mouvement du doigt, sans sauter.
export function installerGestesEtude() {
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
    if (ev.target.closest('.btn-memori')) return;   // le bouton 🔍「目もり？」 n'est pas un geste
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
}

export const bouger = (sens, quel) => {
  if (!etude || etude.resolu) return;
  if (changerValeur(etude.valeur + sens * pasBoutons()[quel], true)) verifierEtude(false);
};

// つぎへ : le problème suivant, ou la fin de la série.
export function suivantEtude() {
  if (estLecon()) {
    leconSuivante();
    return;
  }
  etude.index += 1;
  if (etude.index < etude.total) {
    nouveauProbleme();
    return;
  }
  terminer('etude', tp('finSerie', { 数: etude.total }));
}
