/* ======================================================================
   Dessins : objets de longueur libre (crayon, câble, ruban), règle graduée et écart,
   balance à plateaux, はかり (cadran), verres, verres doseurs et récipients
   ====================================================================== */

import { animationsReduites } from './ecrans.js';
import { melanger } from './outils.js';
import { photos, urlPhoto } from './photos.js';
import { capacite } from './questions/mv.js';
import { reglages } from './reglages.js';
import { cmTexte, html, nombreUnite, nomDe } from './texte.js';
import { note } from './voix.js';

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

export const SORTES = {
  enpitsu: { yomi: 'えんぴつ', kanji: null, dessin: svgCrayon, hauteur: 40 },
  keburu: { yomi: 'ケーブル', kanji: null, dessin: svgCable, hauteur: 36 },
  tepu: { yomi: 'テープ', kanji: null, dessin: svgRuban, hauteur: 30 },
};

export const couleurs = (n, exclure = []) => melanger([1, 2, 3, 4, 5, 6].filter((c) => !exclure.includes(c))).slice(0, n);
export const objetDessine = (sorte, cm, couleur) => ({ type: 'dessin', sorte, cm, couleur, yomi: SORTES[sorte].yomi, kanji: SORTES[sorte].kanji });
export const objetPhoto = (p) => ({ type: 'photo', id: p.id, cm: p.cm, yomi: p.yomi, kanji: p.kanji || null, w: p.w, h: p.h });

/* ----- Règle graduée et partie qui dépasse (preuve des longueurs, ruban de べんきょう) ----- */

export const reserveRegle = () => (window.innerHeight < 520 ? 40 : 50);

// Graduations lisibles : un nombre tous les 34 px au moins, un trait tous les 6 px au moins.
function pasRegle(ppc) {
  const etiquette = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].find((p) => p * ppc >= 34) || 1000;
  const trait = [1, 2, 5, 10, 20, 50, 100, 200].find((p) => p * ppc >= 6 && etiquette % p === 0) || etiquette;
  return { etiquette, trait };
}

export function dessinerRegle(etabli, x0, ppc, cmMax, avecMetres) {
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
export function dessinerEcart(etabli, xCourt, xLong, top, hauteur, ecart, libelle, variante) {
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

/* ----- Objets posés, balance, はかり, verres et récipients ----- */

export function creerChose(o, px) {
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

export function etiquetteMesure(x, u) {
  const pill = document.createElement('span');
  pill.className = 'mesure-mv';
  if (u) pill.innerHTML = nombreUnite(x, u);
  else pill.textContent = x;
  return pill;
}

const ANGLE_MAX = 14;

// Inclinaison du fléau (degrés, positif : le plateau de droite descend). Dans les questions, une
// vraie balance penche franchement ; en べんきょう, elle penche un peu moins quand on approche.
export function angleBalance(gauche, droite, progressif) {
  const d = droite - gauche;
  if (!d) return 0;
  if (!progressif) return Math.sign(d) * ANGLE_MAX;
  const r = Math.abs(d) / Math.max(gauche, droite);
  return Math.sign(d) * Math.max(2.5, Math.min(ANGLE_MAX, ANGLE_MAX * r * 2.5));
}

// Balance à plateaux (上皿てんびん) : un fléau sur un pied, une aiguille au centre.
export function creerBalance(W, H, { interactif = false, noms = true, large = false } = {}) {
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

export function incliner(b, angle) {
  const dy = (b.geo.Lb / 2) * Math.sin((angle * Math.PI) / 180);
  b.querySelector('.balance-fleau').style.transform = `rotate(${angle}deg)`;
  b.querySelector('.balance-aiguille').style.transform = `rotate(${angle}deg)`;
  b.plateaux[0].el.style.transform = `translateY(${-dy}px)`;
  b.plateaux[1].el.style.transform = `translateY(${dy}px)`;
}

// La balance part à plat puis penche : l'élève voit le mouvement (une seule fois par question).
export function poserBalance(b, angle, q) {
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
// Un nombre tous les 100, 200 ou 500 g selon la はかり (jamais 125 / 250 / 375), dix traits par nombre.
const pasCadran = (max) => [100, 200, 500, 1000].find((p) => max / p <= 10) || 1000;

// Le secteur coloré montre de combien l'aiguille a tourné (preuve de « はりで くらべる »).
function svgCadran(max, { etiquette = pasCadran(max), trait = pasCadran(max) / 10, nombres = true } = {}) {
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

export function tournerAiguille(svg, val, max) {
  if (svg.classList.contains('ecran-hakari')) {
    afficherPoids(svg, Math.min(val, 9999));
    return;
  }
  const angle = (Math.min(val, max) / max) * 300;
  svg.querySelector('.aiguille-hakari').style.transform = `rotate(${angle}deg)`;
  svg.querySelector('.secteur').style.strokeDasharray = `${angle} 360`;
}

/* ----- はかり numérique : un écran à cristaux liquides, chiffres à 7 segments -----
   Réglage des parents (« balance : à aiguille / numérique »). Les activités où l'on apprend à LIRE
   l'aiguille la gardent toujours (options.aiguille) : はかりを よもう, はかりの よみかた. */
export const balanceNumerique = (options = {}) => reglages.balance === 'numerique' && !options.aiguille;

// Les 7 segments (a en haut, puis b, c à droite, d en bas, e, f à gauche, g au milieu) d'un chiffre 14 × 24.
const SEGMENTS = {
  a: [2.2, 0, 9.6, 2.6], b: [11.4, 1.6, 2.6, 9.6], c: [11.4, 12.8, 2.6, 9.6], d: [2.2, 21.4, 9.6, 2.6],
  e: [0, 12.8, 2.6, 9.6], f: [0, 1.6, 2.6, 9.6], g: [2.2, 10.7, 9.6, 2.6],
};
const CHIFFRES = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];
function svgEcran() {
  // Quatre chiffres (jusqu'à 9999 g), alignés à droite, puis « g ». Les segments éteints restent visibles, très pâles.
  let chiffres = '';
  for (let k = 0; k < 4; k++) {
    chiffres += `<g class="chiffre" transform="translate(${-41 + k * 17} -12) skewX(-6)">`
      + Object.entries(SEGMENTS).map(([nom, [x, y, w, h]]) => `<rect class="seg" data-s="${nom}" x="${x}" y="${y}" width="${w}" height="${h}" rx="1.2"/>`).join('')
      + '</g>';
  }
  return '<svg class="ecran-hakari" viewBox="-50 -50 100 100" aria-hidden="true">'
    + '<rect class="facade" x="-48" y="-40" width="96" height="80" rx="10"/>'
    + '<rect class="lcd" x="-45" y="-22" width="90" height="40" rx="4"/>'
    + `${chiffres}<text class="unite-lcd" x="33" y="11">g</text>`
    + '<circle class="touche" cx="-14" cy="29" r="4.5"/><circle class="touche" cx="14" cy="29" r="4.5"/></svg>';
}
function dessinerPoids(svg, v) {
  const texte = String(Math.max(0, Math.min(9999, Math.round(v)))).padStart(4, ' ');
  svg.querySelectorAll('.chiffre').forEach((g, k) => {
    const allumes = texte[k] === ' ' ? '' : CHIFFRES[Number(texte[k])];
    g.querySelectorAll('.seg').forEach((seg) => seg.classList.toggle('on', allumes.includes(seg.dataset.s)));
  });
}
// Comme une vraie balance : les chiffres défilent jusqu'au poids (tout de suite si les animations sont réduites).
function afficherPoids(svg, val) {
  const depart = svg.poids || 0;
  svg.poids = val;
  cancelAnimationFrame(svg.anim || 0);
  if (animationsReduites() || depart === val || !svg.isConnected) {
    dessinerPoids(svg, val);
    return;
  }
  const t0 = performance.now();
  const duree = 700;
  const pas = (t) => {
    // (L'horodatage de requestAnimationFrame peut précéder t0 : sans max(0, …), le poids passait en négatif.)
    const x = Math.min(1, Math.max(0, (t - t0) / duree));
    const lisse = 1 - (1 - x) ** 3;
    dessinerPoids(svg, depart + (val - depart) * lisse);
    if (x < 1) svg.anim = requestAnimationFrame(pas);
  };
  svg.anim = requestAnimationFrame(pas);
}

// Un petit cadran (téléphone) ne peut pas porter 11 nombres : au plus 6 (0, 200, 400… 1000).
const pasPetitCadran = (max) => [100, 200, 500, 1000].find((p) => max / p <= 5) || 1000;
export function creerHakari(D, max, options = {}) {
  if (balanceNumerique(options)) {
    // Même encombrement que la はかり à aiguille : les mises en page ne changent pas.
    const corps = document.createElement('span');
    corps.className = 'hakari-corps hakari-numerique';
    corps.style.width = `${D * 1.12}px`;
    corps.style.height = `${D * 1.08}px`;
    corps.innerHTML = svgEcran();
    corps.querySelector('svg').style.width = `${D}px`;
    dessinerPoids(corps.querySelector('svg'), 0);
    return corps;
  }
  if (options.etiquette === undefined && D < 240) {
    const etiquette = pasPetitCadran(max);
    options = { ...options, etiquette, trait: etiquette / 10 };
  }
  const corps = document.createElement('span');
  corps.className = 'hakari-corps';
  corps.style.width = `${D * 1.12}px`;
  corps.style.height = `${D * 1.08}px`;
  corps.innerHTML = svgCadran(max, options);
  corps.querySelector('svg').style.width = `${D}px`;
  return corps;
}

export function creerVerre(w, h, ml, cap, couleur) {
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
export function creerVerreGradue(w, h, ml, cap, max, couleur) {
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

export function creerContenant(o, S) {
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

export function nomMV(o) {
  const n = document.createElement('span');
  n.className = 'nom-mv';
  n.innerHTML = html([nomDe(o)]);
  n.hidden = !reglages.noms;
  return n;
}

/* ----- Rendu des questions おもさ / かさ ----- */
