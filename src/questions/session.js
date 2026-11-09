/* ======================================================================
   Une série de questions : état, affichage, réponses, aides, passage à la suivante
   ====================================================================== */

import { objetDessine } from '../dessins.js';
import { ecranActuel, focaliser, montrer, terminer } from '../ecrans.js';
import { boutonMemori, dejaVue, ouvrirExplication } from '../explications.js';
import { tp } from '../textes-perso.js';
import { $, echapper } from '../outils.js';
import { aideKazu, exempleDe } from './kazu.js';
import {
  afficherPreuve, afficherReperes, afficherReperesLibre, aligner, consigneDe, creerLigne, dimensionner,
  explication, genererQuestion, libres, lignes, phraseDe, rappelDe, reinitialiserLongueurs, rendreLibre,
  rendrePhrase, valeurCm,
} from './longueurs.js';
import {
  cibles, estMV, messageErreurMV, ouVerser, regleMV, reinitialiserCibles, remplirChoixLecture, rendreMV, uniteDe,
} from './mv.js';
import { reglages } from '../reglages.js';
import { activable } from '../tactile.js';
import { htmlMots, lecture, nombreUnite, PHRASES, segU, segValeur, segValeurLue, TEHON, versParole } from '../texte.js';
import { parler, paroles, sons } from '../voix.js';

/* ----- Série de questions ----- */

export let session = null;
export const courante = () => session.questions[session.index];

export function demarrer(niveau) {
  const n = Number(reglages.nbQuestions) || 6;
  const exemple = exempleDe(niveau);
  session = {
    niveau,
    questions: [...(exemple ? [exemple] : []), ...Array.from({ length: n }, (_, i) => genererQuestion(niveau, i === n - 1, i, n))],
    index: 0,
  };
  montrer('question');
  afficherQuestion();
  // La première fois, 「はかりを よもう」 commence par l'explication 「目もりって なに？」.
  if (session.questions.some((q) => q.type === 'lecture') && !dejaVue('hakari')) ouvrirExplication('hakari', { apres: parlerConsigne });
}

export let debutAffichage = 0;   // le ResizeObserver ignore le changement de taille qui suit l'affichage d'une question
function afficherQuestion() {
  const q = courante();
  debutAffichage = performance.now();
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
  focaliser($('consigne'));
}

// Comparer deux nombres (cm, g, mL…) : l'énoncé redit les deux nombres, avec leur lecture en hiragana
// au-dessus ; 🔊 ou un toucher sur l'énoncé les fait réentendre.
const consigneAffichee = (q) => ((q.type === 'nombre' || q.type === 'mesures')
  ? [segValeurLue(q.valeurs[0]), 'と ', segValeurLue(q.valeurs[1]), '、 ', ...consigneDe(q)]
  : consigneDe(q));

export function parlerConsigne() {
  const q = courante();
  // Une fois la question résolue, 🔊 fait réécouter l'explication.
  if (q.resolu && q.messageFinal) {
    parler(q.messageFinal);
    return;
  }
  if (q.type === 'phrase') parler([...phraseDe(q), '…… ', ...PHRASES.nagaiMijikai]);
  else parler(consigneAffichee(q));
}

function rendreProgression() {
  const liste = $('progression');
  liste.replaceChildren();
  const vraies = session.questions.filter((q) => q.type !== 'tuto');
  const numero = vraies.indexOf(session.questions[session.index]) + 1;
  liste.setAttribute('aria-label', `すすみぐあい ${Math.max(1, numero)} / ${vraies.length}`);
  session.questions.forEach((q, i) => {
    if (q.type === 'tuto') return;
    const point = document.createElement('li');
    if (i < session.index || (i === session.index && q.resolu)) point.classList.add('fait');
    if (i === session.index) { point.classList.add('actuel'); point.setAttribute('aria-current', 'step'); }
    liste.append(point);
  });
}

export function rendreQuestion() {
  const q = courante();
  rendreProgression();
  $('ecran-question').classList.toggle('q-kazu', q.theme === 'kazu');
  // Dès le départ (avant de mesurer la place des objets) : les réponses かず en liste.
  $('choix-mots').classList.toggle('choix-liste', q.theme === 'kazu' && q.type !== 'comparer' && q.type !== 'tuto');
  $('consigne').innerHTML = htmlMots(consigneAffichee(q));

  const phrase = $('phrase');
  const choix = $('choix-mots');
  phrase.hidden = q.type !== 'phrase';
  // かず : les réponses restent affichées pendant qu'on mesure la place des objets (elles en prennent).
  choix.hidden = q.type !== 'phrase' && !(q.theme === 'kazu' && q.type !== 'comparer' && q.type !== 'tuto');

  const etabli = $('etabli');
  etabli.replaceChildren();
  etabli.classList.remove('libre', 'nombres', 'scene-mv');
  etabli.classList.toggle('sans-noms', !reglages.noms && q.type !== 'phrase');
  reinitialiserLongueurs();
  reinitialiserCibles();

  if (estMV(q)) {
    if (q.type === 'lecture') remplirChoixLecture(q);
    rendreMV(q, etabli);
    // Lire la はかり : le bouton 🔍「目もり？」 dans le coin de la scène.
    if (q.type === 'lecture') {
      const coin = boutonMemori('hakari');
      coin.classList.add('coin');
      etabli.append(coin);
    }
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

/* ----- Aides : « わからない » (toutes les questions), « そろえる » (objets libres), « うつす » (verser) ----- */

function messageAide(q) {
  if (q.type === 'mesures') {
    if (q.mixte && q.aide === 1) {
      const g = q.valeurs.find((v) => v.grande);
      return [segValeur(g), 'は ', segU(g.val, uniteDe(q.theme)), '。'];
    }
    return q.theme === 'omosa' ? tp('mv.aidePoids') : tp('mv.aideLiquide');
  }
  if (q.mixte && q.aide === 1) {
    const m = q.valeurs.find((v) => v.m);
    return [segValeur(m), 'は ', segValeur(valeurCm(m.cm)), '。'];
  }
  return PHRASES.barres;
}

const ICONE_AIDE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';
export function majBoutonAide() {
  const q = courante();
  const bouton = $('btn-aide');
  let texte = '';
  if (q.type === 'tuto') texte = 'とばす';
  if (reglages.aide && !q.resolu) {
    if (q.type === 'libre' && !q.aligne) texte = 'そろえる';
    if (q.type === 'transvaser' && q.etape === 'avant') texte = 'うつす';
  }
  bouton.innerHTML = texte ? `${ICONE_AIDE}${echapper(texte)}` : '';
  bouton.hidden = !texte;
  $('btn-sais-pas').hidden = !reglages.aide || q.resolu || q.type === 'tuto';
}

export function avancerAide() {
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
    const m = [...ouVerser(q), ' うつしたよ。 うつしても かさは かわらないよ。'];
    $('retour').innerHTML = htmlMots(m);
    $('retour').classList.remove('ok');
    parlerPuisRelancer(m, q);
    majBoutonAide();
  }
}

export function repondre(reponse) {
  const q = courante();
  if (q.resolu || q.essais.has(reponse)) return;

  if (reponse === q.bonne) {
    sons.succes();
    resoudre(q, [...PHRASES.seikai, ...explication(q)], true);
    return;
  }

  q.essais.add(reponse);
  sons.oups();
  // Deviner faux dans 見た目と ちがう est le but du jeu : pas de « もう いっかい » à la première réponse.
  const devine = q.type === 'devine' && q.etape === 'devine';
  donnerAide(q, devine ? [] : presque(q, reponse) ? tp('presque') : tp('encore'), reponse);
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
export function sansOshii(m) {
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
export function nePasSavoir() {
  const q = courante();
  if (q.resolu) return;
  q.sansSavoir = (q.sansSavoir || 0) + 1;
  const resteAide = ((q.type === 'nombre' || q.type === 'mesures' || q.theme === 'kazu') && q.aide < q.aideMax)
    || (q.type === 'libre' && !q.aligne) || (q.type === 'transvaser' && q.etape === 'avant')
    || (q.type === 'devine' && q.etape === 'devine');
  if (q.sansSavoir === 1 || resteAide) {
    donnerAide(q, tp('daijoubu'));
    return;
  }
  resoudre(q, [...tp('voirReponse'), ...explication(q)], false);
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

export function suivant() {
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

function afficherFin() {
  const n = session.questions.filter((q) => q.type !== 'tuto').length;
  terminer('question', tp('finSerie', { 数: n }));
}
