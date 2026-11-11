/* ======================================================================
   Explications illustrées : 「目もりって なに？」
   Une carte par-dessus l'écran, en 4 étapes lues à voix haute, avec un dessin agrandi
   (はかり ou カップ) : les traits → les grands traits et leurs nombres → les petits traits,
   comptés un par un → une lecture complète (100 と、 ちいさい 目もり 3つ。 130)。
   On l'ouvre :
   - par le bouton 🔍「目もり？」 dans le coin de la scène (はかりを よもう, はかって いれよう…) ;
   - en touchant le mot 目もり (souligné, avec un « ? ») dans une consigne ou une explication ;
   - à une étape de la leçon 「はかりの よみかた」 ;
   - toute seule la première fois qu'on ouvre 「はかりを よもう」 ou 「はかって いれよう」.
   ====================================================================== */

import { focaliser } from './ecrans.js';
import { $ } from './outils.js';
import { plateforme } from './plateforme.js';
import { html, htmlMots, ME, MI, OOKI, segU, SUJI } from './texte.js';
import { activable } from './tactile.js';
import { parler } from './voix.js';

const CLE_VUES = 'kurabe-explications-vues';
function lireVues() {
  try { return JSON.parse(localStorage.getItem(CLE_VUES)) || {}; } catch { return {}; }
}
export const dejaVue = (contexte) => Boolean(lireVues()[contexte]);
function marquerVue(contexte) {
  try { localStorage.setItem(CLE_VUES, JSON.stringify({ ...lireVues(), [contexte]: true })); } catch { /* rien */ }
}

const MEMORI = ['「', ME, 'もり」'];
export const TITRE_MEMORI = [...MEMORI, 'って なに？'];

/* ----- Les dessins (SVG). Les étapes changent seulement data-etape : le CSS fait le reste. ----- */

// はかり agrandie : 0 à 200 g, un trait tous les 10 g (15° chacun), un nombre tous les 100 g.
function dessinHakari() {
  let traits = '';
  for (let k = 0; k <= 20; k += 1) {
    const a = (k * 15 * Math.PI) / 180;
    const [s, c] = [Math.sin(a), Math.cos(a)];
    const grand = k % 10 === 0;
    const moyen = k % 5 === 0 && !grand;
    const r2 = grand ? 33 : moyen ? 36.5 : 39;
    const classes = ['t', grand ? 'g' : 'p', k === 10 ? 'depart' : '', k >= 11 && k <= 13 ? `c c${k - 10}` : ''].filter(Boolean).join(' ');
    traits += `<line class="${classes}" x1="${(s * 44).toFixed(2)}" y1="${(-c * 44).toFixed(2)}" x2="${(s * r2).toFixed(2)}" y2="${(-c * r2).toFixed(2)}"/>`;
    if (grand) traits += `<text class="n${k === 10 ? ' depart' : ''}" x="${(s * 24).toFixed(2)}" y="${(-c * 24 + 3.6).toFixed(2)}">${k * 10}</text>`;
    if (k >= 11 && k <= 13) traits += `<text class="compte c${k - 10}" x="${(s * 56.5).toFixed(2)}" y="${(-c * 56.5 + 2.2).toFixed(2)}">${k * 10}</text>`;
  }
  return '<svg class="dessin-memori hakari-memori" viewBox="-62 -62 124 124" aria-hidden="true">'
    + '<circle class="face" r="48"/><circle class="secteur" r="20" pathLength="360" transform="rotate(-90)"/>'
    + `${traits}<text class="unite" y="15">g</text>`
    + '<g class="aiguille"><line x1="0" y1="8" x2="0" y2="-41"/><circle r="4.5"/></g></svg>';
}

// カップ agrandie : 0 à 200 mL, un trait tous les 10 mL, un nombre tous les 50 mL ; l'eau monte à 130.
function dessinKappu() {
  const y = (ml) => 152 - ml * 0.7;
  let traits = '';
  for (let k = 1; k <= 20; k += 1) {
    const ml = k * 10;
    const grand = k % 5 === 0;
    const classes = ['t', grand ? 'g' : 'p', k === 10 ? 'depart' : '', k >= 11 && k <= 13 ? `c c${k - 10}` : ''].filter(Boolean).join(' ');
    traits += `<line class="${classes}" x1="41" y1="${y(ml)}" x2="${grand ? 54 : 48}" y2="${y(ml)}"/>`;
    if (grand) traits += `<text class="n${k === 10 ? ' depart' : ''}" x="58" y="${y(ml) + 2.8}">${ml}</text>`;
    if (k >= 11 && k <= 13) traits += `<text class="compte c${k - 10}" x="35" y="${y(ml) + 2.1}">${ml}</text>`;
  }
  return '<svg class="dessin-memori kappu-memori" viewBox="0 0 120 162" aria-hidden="true">'
    + `<rect class="eau" x="41.5" y="${y(130)}" width="51" height="${152 - y(130)}"/>`
    + `<line class="surface" x1="41.5" y1="${y(130)}" x2="92.5" y2="${y(130)}"/>`
    + '<path class="verre-contour" d="M40 4V153H94V4"/>'
    + `${traits}<text class="unite" x="104" y="12">mL</text></svg>`;
}

const CONTEXTES = {
  hakari: {
    dessin: dessinHakari,
    etapes: [
      { etat: 'traits', texte: ['はかりの まわりに ある ほそい せんを ', ...MEMORI, 'と いうよ。'] },
      { etat: 'grands', texte: [OOKI, 'きい ', ME, 'もりには ', SUJI, 'が かいて あるよ。 0、 100、 200。'] },
      { etat: 'petits', texte: ['ちいさい ', ME, 'もりは 1つで ', segU(10, 'g'), '。 100から かぞえよう。 110、 120、 130。'] },
      { etat: 'lecture', texte: ['はりが ここなら、 100と、 ちいさい ', ME, 'もり 3つ。 ', segU(130, 'g'), '。'] },
    ],
  },
  kappu: {
    dessin: dessinKappu,
    etapes: [
      { etat: 'traits', texte: ['カップの よこに ある ほそい せんを ', ...MEMORI, 'と いうよ。'] },
      { etat: 'grands', texte: [OOKI, 'きい ', ME, 'もりには ', SUJI, 'が かいて あるよ。 50、 100、 150、 200。'] },
      { etat: 'petits', texte: ['ちいさい ', ME, 'もりは 1つで ', segU(10, 'ml'), '。 100から かぞえよう。 110、 120、 130。'] },
      { etat: 'lecture', texte: ['みずの うえが ここなら、 100と、 ちいさい ', ME, 'もり 3つ。 ', segU(130, 'ml'), '。'] },
    ],
  },
};

/* ----- La carte ----- */

const ICONE_FERMER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const ICONE_ECOUTER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>';
export const ICONE_LOUPE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="M15 15l5.5 5.5"/><path d="M7.5 10h5M10 7.5v5" stroke-width="2"/></svg>';

let carte = null;
let ouverte = null;   // { contexte, etape, apres, focusAvant }

function construire() {
  carte = document.createElement('div');
  carte.className = 'explication';
  carte.id = 'explication';
  carte.hidden = true;
  carte.setAttribute('role', 'dialog');
  carte.setAttribute('aria-modal', 'true');
  carte.setAttribute('aria-labelledby', 'explication-titre');
  carte.innerHTML = `<div class="explication-carte">
      <header class="explication-tete">
        <button type="button" class="btn-rond" id="explication-fermer" aria-label="とじる">${ICONE_FERMER}</button>
        <h2 id="explication-titre"></h2>
        <button type="button" class="btn-rond" id="explication-ecouter" aria-label="もう いちど きく">${ICONE_ECOUTER}</button>
      </header>
      <div class="explication-dessin"></div>
      <p class="explication-texte consigne" aria-live="polite"></p>
      <div class="explication-pied">
        <ol class="explication-points" aria-hidden="true"></ol>
        <button type="button" class="btn" id="explication-encore" hidden>もう いちど</button>
        <button type="button" class="btn btn-principal" id="explication-suivant">つぎへ</button>
      </div>
    </div>`;
  document.body.append(carte);
  activable($('explication-fermer'), fermerExplication, { garde: false });
  activable($('explication-ecouter'), () => parler(CONTEXTES[ouverte.contexte].etapes[ouverte.etape].texte), { garde: false });
  activable($('explication-suivant'), () => {
    const n = CONTEXTES[ouverte.contexte].etapes.length;
    if (ouverte.etape < n - 1) montrerEtape(ouverte.etape + 1);
    else fermerExplication();
  });
  activable($('explication-encore'), () => montrerEtape(0));
  document.addEventListener('keydown', (ev) => { if (ouverte && ev.key === 'Escape') fermerExplication(); });
}

function montrerEtape(i) {
  const { contexte } = ouverte;
  const etapes = CONTEXTES[contexte].etapes;
  ouverte.etape = i;
  const et = etapes[i];
  const svg = carte.querySelector('.dessin-memori');
  // Rejouer l'animation de l'étape : on repasse par « rien » le temps d'une image.
  svg.dataset.etape = '';
  requestAnimationFrame(() => requestAnimationFrame(() => { svg.dataset.etape = et.etat; }));
  carte.querySelector('.explication-texte').innerHTML = htmlMots(et.texte);
  carte.querySelector('.explication-points').innerHTML = etapes.map((_, k) => `<li${k === i ? ' class="actuel"' : ''}${k < i ? ' class="fait"' : ''}></li>`).join('');
  const derniere = i === etapes.length - 1;
  $('explication-suivant').textContent = derniere ? 'わかった' : 'つぎへ';
  $('explication-encore').hidden = !derniere;
  if (derniere) marquerVue(contexte);
  parler(et.texte);
}

export const explicationOuverte = () => Boolean(ouverte);

export function ouvrirExplication(contexte, { apres = null } = {}) {
  if (!CONTEXTES[contexte]) return;
  if (!carte) construire();
  ouverte = { contexte, etape: 0, apres, focusAvant: document.activeElement };
  $('explication-titre').innerHTML = html(TITRE_MEMORI);
  carte.querySelector('.explication-dessin').innerHTML = CONTEXTES[contexte].dessin();
  document.querySelector('.app')?.setAttribute('inert', '');
  carte.hidden = false;
  montrerEtape(0);
  focaliser($('explication-titre'));
}

export function fermerExplication() {
  if (!ouverte) return;
  const { apres, focusAvant, contexte, etape } = ouverte;
  const jusquauBout = etape === CONTEXTES[contexte].etapes.length - 1;
  ouverte = null;
  carte.hidden = true;
  document.querySelector('.app')?.removeAttribute('inert');
  plateforme.voix.annuler();
  if (focusAvant && focusAvant.isConnected) { try { focusAvant.focus({ preventScroll: true }); } catch { /* rien */ } }
  if (apres) apres(jusquauBout);
}

/* ----- Le bouton 🔍「目もり？」 dans le coin d'une scène ----- */

export function boutonMemori(contexte, { apres = null, grand = false } = {}) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = grand ? 'btn btn-memori btn-memori-grand' : 'btn btn-memori';
  b.setAttribute('aria-label', 'めもりって なに？');
  b.innerHTML = `${ICONE_LOUPE}<span>${html(grand ? [ME, 'もりを ', MI, 'る'] : [ME, 'もり？'])}</span>`;
  activable(b, () => ouvrirExplication(contexte, { apres }));
  return b;
}

/* ----- Le mot 目もり qu'on peut toucher (<aide-memori>, écrit par html() dans les textes) ----- */

// La scène en cours dit quel dessin montrer : un verre doseur → カップ ; sinon la はかり.
const contexteCourant = () => (document.querySelector('#ecran-etude:not([hidden]) #etude-plan.plan-verre, #ecran-etude:not([hidden]) .verre-lecon, #ecran-question:not([hidden]) .verre.gradue') ? 'kappu' : 'hakari');

function preparerMot(el) {
  if (el.dataset.pret) return;
  el.dataset.pret = '1';
  el.setAttribute('role', 'button');
  el.tabIndex = 0;
  el.setAttribute('aria-label', 'めもりって なに？');
  // Entrée et Espace : activable s'en charge déjà pour un élément qui n'est pas un bouton.
  activable(el, () => ouvrirExplication(contexteCourant()), { garde: false });
}

export function installerMotsAide() {
  document.querySelectorAll('aide-memori').forEach(preparerMot);
  new MutationObserver((changements) => {
    changements.forEach((c) => c.addedNodes.forEach((n) => {
      if (n.nodeType !== 1) return;
      if (n.localName === 'aide-memori') preparerMot(n);
      else n.querySelectorAll?.('aide-memori').forEach(preparerMot);
    }));
  }).observe(document.body, { childList: true, subtree: true });
}
