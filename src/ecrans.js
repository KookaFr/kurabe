/* ======================================================================
   Écrans
   ====================================================================== */

import { arreterVersement, versementEnCours } from './lecons/versement.js';
import { $ } from './outils.js';
import { plateforme } from './plateforme.js';
import { reglages } from './reglages.js';
import { htmlMots, PHRASES } from './texte.js';
import { parler, sons } from './voix.js';

const ECRANS = ['accueil', 'question', 'etude', 'fin', 'parents', 'photo'];
export let ecranActuel = 'accueil';

let majEnAttente = null;   // la nouvelle version attend ; on la propose seulement à l'accueil (jamais sur つぎへ)
export function montrer(nom) {
  plateforme.voix.annuler();
  if (versementEnCours) arreterVersement(false);
  ECRANS.forEach((e) => { $(`ecran-${e}`).hidden = e !== nom; });
  ecranActuel = nom;
  $('maj').hidden = !(nom === 'accueil' && majEnAttente);
  window.scrollTo(0, 0);
  focaliser($(`ecran-${nom}`).querySelector('h1, h2, .consigne'));
}

// Donne le focus à un titre ou une consigne (annoncé par VoiceOver / TalkBack), sans faire défiler.
export function focaliser(el) {
  if (!el) return;
  el.tabIndex = -1;
  try { el.focus({ preventScroll: true }); } catch { /* rien */ }
}

// Une nouvelle version est prête : la barre « あたらしく する » (activer : la met en service).
export function proposerMiseAJour(activer) {
  majEnAttente = activer;
  const barre = $('maj');
  barre.hidden = ecranActuel !== 'accueil';
  $('maj-oui').onclick = () => { barre.hidden = true; activer(); };
  $('maj-non').onclick = () => { barre.hidden = true; majEnAttente = null; };
}

export const animationsReduites = () => reglages.animations === 'reduites' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Le réglage « sans animations » des parents s'applique aussi au CSS (html[data-motion=reduce]).
export function appliquerAnimations() {
  if (reglages.animations === 'reduites') document.documentElement.dataset.motion = 'reduce';
  else delete document.documentElement.dataset.motion;
}

/* ----- Fin d'une série (questions ou べんきょう) ----- */

export let finDe = 'question';   // ce que « もういちど » recommence : une série de questions ou de べんきょう

// L'écran de fin : « おつかれさま！ », puis ce qu'on a fait (« 6問 できたよ。 »).
export function terminer(de, texte) {
  finDe = de;
  montrer('fin');
  $('fin-titre').innerHTML = htmlMots(PHRASES.otsukare);
  $('fin-texte').innerHTML = htmlMots(texte);
  sons.fin();
  parler([...PHRASES.otsukare, ' ', ...texte]);
}
