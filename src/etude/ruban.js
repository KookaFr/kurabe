/* ======================================================================
   べんきょう : le ruban sur la règle (のばして みよう, たしざん, ひきざん)
   ====================================================================== */

import { dessinerEcart, reserveRegle } from '../dessins.js';
import { etude, majCommandesEtude } from './etude.js';
import { $ } from '../outils.js';
import { reglages } from '../reglages.js';

export function dessinerRuban() {
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
