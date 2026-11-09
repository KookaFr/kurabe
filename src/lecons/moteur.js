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

import { ACTIVITES } from '../accueil.js';
import {
  angleBalance, creerBalance, creerChose, creerHakari, creerVerreGradue, incliner, tournerAiguille,
} from '../dessins.js';
import { terminer } from '../ecrans.js';
import { etude, messageEtude } from '../etude/etude.js';
import { boutonMemori } from '../explications.js';
import {
  creerCorpsLecon, creerHiroLecon, creerShakuLecon, etapesCorps, etapesGou, etapesShaku, majCorpsLecon,
} from './etapes-culture.js';
import { creerCompteLecon, etapesKazu1, etapesKazu2, etapesKazu3, majCompteLecon } from './etapes-kazu.js';
import {
  etapesBalance, etapesHakari, etapesMonme, etapesPratique, etapesTsuriawase, etapesUnites,
} from './etapes-masses.js';
import {
  arreterVersement, creerVersementLecon, demoHanbun, equationVersement, etapesHanbun, etapesMaze, nouveauVersement,
} from './versement.js';
import { $ } from '../outils.js';
import { plateforme } from '../plateforme.js';
import { chose, objetChose } from '../questions/mv.js';
import { sansOshii } from '../questions/session.js';
import { reglages } from '../reglages.js';
import { activable } from '../tactile.js';
import {
  html, htmlMots, lecture, MEMORI, MI, nombreUnite, nombreYomi, nomDe, OMO, OOKI, PHRASES, segU, uniteHtml, yomiNombre,
} from '../texte.js';
import { note, parler, sons } from '../voix.js';

// Ce qu'on pose sur les plateaux. Les masses (m) sont données par chaque étape.
const VISUELS = {
  ringo: { genre: 'chose', c: 'りんご' },
  ichigo: { genre: 'chose', c: 'いちご' },
  booru: { genre: 'chose', c: 'ボール' },
  hon: { genre: 'chose', c: 'ほん' },
  omori: { genre: 'fundou', taille: 1, texte: '', nom: ['おもり'] },
  yen1: { genre: 'yen', nom: ['1えんだま'] },
  g1: { genre: 'fundou', taille: 0.74, texte: '1g', unite: 1, nom: [segU(1, 'g'), 'の おもり'] },
  tsumiki: { genre: 'tsumiki', nom: ['つみき'] },
  g10: { genre: 'fundou', taille: 0.86, texte: '10g', unite: 10, nom: [segU(10, 'g'), 'の おもり'] },
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
export const enG = (x) => segU(x, 'g');
export const enKg = (x) => segU(x, 'kg');
export const P = (v, m, n = 1) => ({ v, m, n });
export const somme = (liste) => liste.reduce((s, p) => s + p.m, 0);
const nomVisuel = (v) => (VISUELS[v].genre === 'chose' ? [nomDe(chose(VISUELS[v].c))] : VISUELS[v].nom);
export const MAX_HAKARI = 500;
const sceneDe = (et) => et.scene || (et.hakari ? 'hakari' : 'balance');

export const equilibre = (e) => Math.abs(somme(e.cotes[0]) - somme(e.cotes[1])) < 1e-9;
export const unePose = (e) => e.cotes[e.etape.vers].length > 0;

// Poser des poids pour faire « cible » g (190 g ＝ 100 g × 1 ＋ 10 g × 9), guidé sorte par sorte, du plus
// lourd au plus léger. Trop lourd : on dit QUEL poids enlever (« 100g の おもりが おおいよ。 1こ おろそう »)
// et la main montre lequel — pas « 10g を おろそう » quand il n'y a que des 100 g sur le plateau. Après avoir
// enlevé : « 100g の おもりは これで いいね。 こんどは 10g の おもりを のせよう。 »
// (poses(e) : les poids posés ; montant : dire « あと 90g » — pas quand le poids est à trouver.)
export function guidePoids(cible, poses, montant) {
  return (e) => {
    const liste = poses(e);
    const sortes = [...new Map([...e.reserve, ...liste].filter((p) => VISUELS[p.v]?.unite).map((p) => [p.v, p.m])).entries()]
      .sort((a, b) => b[1] - a[1]);
    if (sortes.length < 2) return null;
    const nb = (v) => liste.filter((p) => p.v === v).length;
    const voulu = {};
    let reste = cible;
    sortes.forEach(([v, m]) => { voulu[v] = Math.floor(reste / m); reste -= voulu[v] * m; });
    const poids = (v) => segU(VISUELS[v].unite, 'g');
    const avec = (m, cle, retirer) => Object.assign(m, { cle, retirer });
    const t = somme(liste);
    if (t > cible) {
      const trop = sortes.find(([v]) => nb(v) > voulu[v]);
      if (!trop) return null;
      const [v, m] = trop;
      const combien = v === sortes[sortes.length - 1][0] ? Math.max(1, Math.ceil((t - cible) / m)) : 1;
      return avec([OMO, 'すぎ！ ', poids(v), 'の おもりが おおいよ。 ', String(combien), 'こ おろそう。'], `trop-${v}-${combien}`, v);
    }
    if (t === cible) return null;
    const r = cible - t;
    const encore = montant ? ['あと ', segU(r, 'g'), '。'] : null;
    // Tant que l'élève n'a rien enlevé, on le laisse faire.
    if (!e.guide) return encore && avec(encore, 'moins');
    // (Le plus lourd qui manque, même s'il fait dépasser : on dira ensuite quels petits poids enlever.)
    const manque = sortes.find(([v]) => nb(v) < voulu[v]);
    if (!manque) return encore && avec(encore, 'moins');
    const fait = sortes.filter(([v, m]) => m > manque[1] && voulu[v] > 0 && nb(v) === voulu[v]).pop();
    return Object.assign(avec([
      ...(encore ? [...encore, ' '] : []),
      ...(fait ? [poids(fait[0]), 'の おもりは これで いいね。 こんどは '] : []),
      poids(manque[0]), 'の おもりを のせよう。',
    ], `plus-${manque[0]}`), { poser: manque[0] });
  };
}

export const LECONS = {
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
  'lecon-hanbun': etapesHanbun,
  'lecon-maze': etapesMaze,
};
export const estLecon = () => Boolean(etude && LECONS[etude.mode]);

let compteurPieces = 0;
// Une entrée P(v, m, n) devient n pièces distinctes (chacune peut être enlevée).
const deplier = (liste) => liste.flatMap((p) => Array.from({ length: p.n || 1 }, () => ({ v: p.v, c: p.c, m: p.m, id: ++compteurPieces })));

export function demarrerLecon() {
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
  e.aPoser = null;
  e.explicationVue = false;
  arreterVersement(false);
  e.liq = et.versement ? nouveauVersement(et.versement) : null;
  messageEtude([]);
  rendreLecon();
  parler(et.dire);
  if (et.versement && et.versement.demo) demoHanbun(et);
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
    // (sorte : « g100 »… — la main montre un poids de cette sorte.)
    elements = plan.querySelectorAll(sorte && VISUELS[sorte] ? `.rangee-poids[data-v="${sorte}"] > *` : '.rangee-poids > *');
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
  // La balance penche encore : la main suit le poids.
  const suivre = () => {
    if (!main.isConnected) return;
    if (!cible.isConnected) { main.remove(); return; }
    const b = cible.getBoundingClientRect();
    main.style.left = `${b.left + b.width / 2}px`;
    main.style.top = `${b.top + b.height / 2}px`;
    requestAnimationFrame(suivre);
  };
  requestAnimationFrame(suivre);
  setTimeout(() => {
    main.remove();
    cible.classList.remove('demo-retrait');
  }, 2700);
}

export function rendreLecon() {
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
  // Étape « explication » (目もり) : un grand bouton à la place des choix ; l'étape est réussie
  // quand on a regardé l'explication jusqu'au bout.
  if (et.explication) {
    commandes.hidden = false;
    choix.hidden = false;
    const b = boutonMemori(et.explication, {
      grand: true,
      apres: (jusquauBout) => {
        if (!jusquauBout || etude !== e || e.etape !== et || e.resolu) return;
        e.explicationVue = true;
        verifierLecon(null);
        rendreLecon();
      },
    });
    b.classList.toggle('a-regarder', !e.resolu);
    choix.append(b);
  }

  const plan = $('etude-plan');
  plan.classList.remove('anime');
  plan.replaceChildren();
  const cs = getComputedStyle(plan);
  const W = plan.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const H = plan.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 4;
  const avecReserve = e.reserve.length > 0 || et.retirer;
  // Les bacs ont une hauteur fixe : le reste va à la balance (les poids y sont en 4 rangées).
  const hReserve = !avecReserve ? 0 : et.bac ? 78 : Math.max(64, Math.min(96, H * 0.21));
  let instrument;
  const scene = sceneDe(et);
  if (scene === 'hakari') instrument = creerHakariLecon(W, H - hReserve, et.max || MAX_HAKARI);
  else if (scene === 'verre') instrument = creerVerreLecon(W, H - hReserve, et);
  else if (scene === 'corps') instrument = creerCorpsLecon(W, H - hReserve, et);
  else if (scene === 'shaku') instrument = creerShakuLecon(W, H - hReserve, et);
  else if (scene === 'hiro') instrument = creerHiroLecon(W, H - hReserve);
  else if (scene === 'compte') instrument = creerCompteLecon(W, H - hReserve);
  else if (scene === 'versement') instrument = creerVersementLecon(W, H - hReserve, et);
  else {
    // Bacs : plateaux plus larges ; sur un écran bas, sans les noms (l'égalité dit déjà ce qu'il y a).
    instrument = creerBalance(W, H - hReserve, { noms: !(et.bac && H < 380), large: et.bac });
    instrument.classList.add('balance-lecon');
  }
  const reserve = document.createElement('div');
  reserve.className = 'reserve';
  reserve.hidden = !avecReserve;
  plan.append(instrument, reserve);
  // Lire la はかり : le bouton 🔍「目もり？」 dans le coin (はかりの よみかた, はかって みよう).
  if (scene === 'hakari' && !et.explication && ['lecon-hakari', 'lecon-pratique'].includes(e.mode)) {
    const coin = boutonMemori('hakari');
    coin.classList.add('coin');
    plan.append(coin);
  }
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
  // Le plateau garde de quoi poser 3 rangées de poids lisibles (≈ 32 px), même sur un écran bas.
  const hCharge = Math.max(56, Math.min(170, Math.max(H * 0.4, Math.min(128, H * 0.47))));
  const D = Math.max(90, Math.min(H - hCharge - 30, W * 0.62, 300));
  const charge = document.createElement('span');
  charge.className = 'hakari-charge';
  charge.style.height = `${hCharge}px`;
  // Plateau assez large pour 5 poids de 100 g côte à côte (une rangée de 5, comme en classe).
  const largeur = Math.max(D * 1.3, 160, Math.min(W - 24, 300));
  charge.style.width = `${largeur}px`;
  const plateau = document.createElement('span');
  plateau.className = 'hakari-plateau';
  plateau.style.width = `${Math.max(D * 1.15, largeur * 0.92)}px`;
  // 500 g : un nombre tous les 100 g, un trait tous les 10 g ; 2 kg : tous les 500 g et 100 g.
  const pas = max <= 500 ? { etiquette: 100, trait: 10 } : max <= 1000 ? { etiquette: 200, trait: 20 } : { etiquette: 500, trait: 100 };
  const corps = creerHakari(D, max, pas);
  el.append(charge, plateau, corps);
  // Poids : jusqu'à 3 rangées (100 g, puis 10 g par 5) sur le plateau, et bien lisibles.
  el.geo = { max, taille: Math.max(26, Math.min(hCharge * 0.55, 90)), s: Math.max(18, Math.min(46, (largeur - 12) / 6.3, (hCharge - 26) / 2.9)) };
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
  // Un peu plus large que haut : l'inscription (100g, 10g) s'écrit en entier et en grand.
  const large = s * vis.taille * 1.2;
  el.className = 'fundou';
  el.style.width = `${large}px`;
  el.style.height = `${s * vis.taille}px`;
  el.style.fontSize = `${Math.max(10, large * 0.34)}px`;
  el.textContent = vis.unite && large < 7.2 * vis.texte.length ? vis.texte.replace(/g$/, '') : vis.texte;
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
    const el = piece;
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
      if (enlevable && VISUELS[p.v]?.genre !== 'chose') {
        // La rangée entière (≥ 44 px) enlève la dernière pièce de sa sorte : une petite pièce ne se vise pas.
        rangee.classList.add('enlevable');
        rangee.setAttribute('role', 'button');
        rangee.tabIndex = 0;
        rangee.setAttribute('aria-label', `${lecture(nomVisuel(p.v))} を 1こ おろす`);
        const sorte = p.v;
        activable(rangee, () => {
          const derniere = [...liste].reverse().find((x) => x.v === sorte);
          if (derniere) enleverPiece(cote, derniere.id);
        });
      }
      pile.prepend(rangee);
    }
    rangee.append(el);
  });
  const masse = (r) => liste.find((p) => p.v === r.dataset.v)?.m || 0;
  [...pile.children].sort((a, b) => masse(a) - masse(b)).forEach((r) => pile.append(r));
  if (pile.childElementCount) zone.prepend(pile);
}

export function majLecon() {
  const e = etude;
  const et = e.etape;
  const { instrument, reserve } = e.scene;
  const geo = instrument.geo;
  const s = geo.s || (et.bac ? tailleBac(geo, e.reserve) : Math.max(16, Math.min(40, geo.Pw / 6.6, (geo.hCharge - 20) / 2.9)));
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
  } else if (scene === 'versement') {
    instrument.maj();
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
    b.dataset.v = r.v;
    b.classList.toggle('a-regarder', e.aPoser === r.v && !e.resolu);
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
const cubesSeuls = (reserve) => reserve.every((r) => VISUELS[r.v].genre === 'tsumiki');
function tailleBac(geo, reserve) {
  const tailles = reserve.map((r) => (VISUELS[r.v].genre === 'tsumiki' ? 1 : VISUELS[r.v].taille));
  const parLargeur = (geo.Pw - 16) / (5 * Math.max(...tailles) * (cubesSeuls(reserve) ? 1 : 1.25));
  const cubes = reserve.every((r) => VISUELS[r.v].genre === 'tsumiki');
  // Une rangée de poids : 1 × la taille (ils sont 1,2 fois plus larges que hauts), + 6 px de crochet et 2 px d'écart.
  const parHauteur = cubes ? (geo.hCharge - 12) / 4 - 2
    : (geo.hCharge - 12 - tailles.length * 2 * 8) / (2 * 1.02 * tailles.reduce((a, b) => a + b, 0));
  return Math.max(14, Math.min(48, parLargeur, parHauteur));
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
    // « 10 g が 9こ » plutôt que « 10 g × 9 » : la multiplication n'est pas au programme de ces élèves.
    if (vis.genre === 'yen') return `1えんだま ${n}まい`;
    if (vis.genre === 'yen5') return `5えんだま ${n}まい`;
    if (vis.texte && !vis.unite) return `${vis.texte.replace('匁', 'もんめ')}${n > 1 ? ` ${n}こ` : ''}`;
    if (!vis.unite) return `おもり ${n}こ`;
    return `${vis.texte.replace(/(\d)([a-z])/, '$1\u00a0$2')}が ${n}こ`;
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
export function equationLecon() {
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
  if (scene === 'versement') return equationVersement(e);
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
  // Sans « vers », la pièce va sur le plateau (comme dans compteLecon).
  if (et.vers === 'plateau' || et.vers === undefined) e.plateau.push(piece);
  else e.cotes[et.vers].push(piece);
  note(520 + Math.min(r.m, 100) * 2, { duree: 0.09, volume: 0.1, type: 'triangle' });
  if (reglages.sons) plateforme.retour.vibrer(8);
  majLecon();
  verifierLecon(compteLecon());
}

export function enleverPiece(cote, id) {
  const e = etude;
  if (e.resolu) return;
  const liste = cote === 'plateau' ? e.plateau : e.cotes[cote];
  const i = liste.findIndex((p) => p.id === id);
  if (i < 0) return;
  const [p] = liste.splice(i, 1);
  e.guide = true;   // l'élève a enlevé : on peut lui dire quoi poser ensuite
  document.querySelectorAll('.main-demo').forEach((x) => x.remove());   // la démonstration a servi
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

export function verifierLecon(compte) {
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
    e.aPoser = null;
    document.querySelectorAll('.reserve-piece.a-regarder').forEach((b) => b.classList.remove('a-regarder'));
    if (compte) parler(compte);
    return;
  }
  const cle = lecture(message);
  messageEtude(message);
  // « こんどは 10g の おもりを のせよう » : le bon bouton de la réserve clignote.
  e.aPoser = message.poser ?? null;
  document.querySelectorAll('.reserve-piece').forEach((b) => b.classList.toggle('a-regarder', b.dataset.v === e.aPoser));
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
  let message = et.choix.indice || ['おしい！ はりの さきを よく ', MI, 'てね。 ', OOKI, 'きい ', MEMORI, 'から かぞえよう。'];
  // « おしい » seulement si c'est presque juste (17 pour 16, pas 71 pour 17).
  if (Math.abs(v - et.choix.bonne) > Math.max(1, Math.abs(et.choix.bonne) * 0.1)) message = ['もう いっかい！ ', ...sansOshii(message)];
  messageEtude(message);
  parler(message);
  rendreLecon();
}

export function leconSuivante() {
  const e = etude;
  e.index += 1;
  if (e.index < e.total) {
    commencerEtape();
    return;
  }
  terminer('etude', ['さいごまで できたね！']);
}
