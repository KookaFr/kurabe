/* ======================================================================
   べんきょう おもさ : équilibrer un objet avec des cubes (つみき) ou des poids.
   べんきょう かさ : remplir un verre doseur (glisser vers le haut ou le bas).
   ====================================================================== */

import { creerVerreGradue, dessinerEcart } from '../dessins.js';
import { etude, majCommandesEtude, messageEtude, reussirEtude } from './etude.js';
import { $, entier } from '../outils.js';
import { reglages } from '../reglages.js';
import { PHRASES, segU, uniteHtml } from '../texte.js';
import { parler } from '../voix.js';

export const LIMITES_VOLUME = [200, 500, 1000];
export const estEtudeMV = () => Boolean(etude && etude.mode === 'verre');
export const enTsumiki = () => (Number(reglages.nombreMax) || 20) <= 20;
export const volumeMax = () => Number(reglages.volumeMax) || 500;
// Le verre doseur est un peu plus haut que sa dernière graduation.
const hauteurVerre = () => volumeMax() * 1.12;

// Verre doseur : d'abord vide ; ensuite il contient déjà quelque chose (on ajoute ou on enlève).
export function nouveauProblemeMV(e) {
  const cap = volumeMax();
  const fin = cap >= 1000 ? 50 : 10;
  const n = cap / fin;
  e.cible = entier(Math.ceil(n * 0.15), n) * fin;
  if (e.index < Math.ceil(e.total / 2)) {
    e.base = 0;
  } else {
    do { e.base = entier(1, n - 1) * fin; } while (Math.abs(e.base - e.cible) < fin * 2);
  }
}

export function consigneEtudeMV() {
  const e = etude;
  if (!e.base) return [segU(e.cible, 'ml'), ' いれよう。'];
  return ['いま ', segU(e.base, 'ml'), '。 ', segU(e.cible, 'ml'), 'に しよう。'];
}

export function equationEtudeMV() {
  const e = etude;
  const d = e.cible - e.base;
  const signe = d > 0 ? '＋' : '−';
  const delta = e.resolu
    ? `<span class="${d > 0 ? 'terme-plus' : 'terme-moins'}">${signe}${Math.abs(d)}</span>`
    : `<span class="${d > 0 ? 'terme-plus' : 'terme-moins'}">${signe}</span> ？`;
  return `<span class="terme-base">${e.base}</span> ${delta} → <span class="resultat">${e.cible}</span> ${uniteHtml('ml')}`;
}

export function dessinerEtudeMV() {
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

export function verifierEtudeMV(parlerSiRien) {
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

export function reussirEtudeMV() {
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
