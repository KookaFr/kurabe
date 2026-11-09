/* ======================================================================
   Écrans
   ====================================================================== */

import { arreterVersement, versementEnCours } from './lecons/versement.js';
import { $ } from './outils.js';
import { plateforme } from './plateforme.js';
import { reglages } from './reglages.js';
import { htmlMots, lecture, PHRASES, versParole } from './texte.js';
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

export let finDe = 'question';
export let lienActuel = null;
const ICONE_LIVRE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5.5c3-1.5 6-1.5 9 .5 3-2 6-2 9-.5V19c-3-1.5-6-1.5-9 .5-3-2-6-2-9-.5z"/><path d="M12 6v13.5"/></svg>';
const ICONE_CRAYON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1-5L16 4l4 4L9 19z"/><path d="M13.5 6.5l4 4"/></svg>';   // ce que « もういちど » recommence : une série de questions ou de べんきょう

// L'écran de fin : « おつかれさま！ », puis ce qu'on a fait (« 6問 できたよ。 »).
// L'activité liée (もんだい ↔ べんきょう) : app.js la fournit, avec de quoi la lancer.
let fournisseurLien = () => null;
export function definirLiens(fn) { fournisseurLien = fn; }

export function terminer(de, texte) {
  finDe = de;
  montrer('fin');
  $('fin-titre').innerHTML = htmlMots(PHRASES.otsukare);
  $('fin-texte').innerHTML = htmlMots(texte);
  const lien = fournisseurLien(de);
  const bouton = $('btn-lien');
  bouton.hidden = !lien;
  if (lien) {
    const sorte = lien.cible.etude ? 'べんきょう' : 'もんだい';
    bouton.innerHTML = `${lien.cible.etude ? ICONE_LIVRE : ICONE_CRAYON}<span class="lien-texte"><small>${sorte}</small>${htmlMots(lien.cible.titre)}</span>`;
    bouton.setAttribute('aria-label', `${sorte}： ${versParole(lecture(lien.cible.titre))}`);
    bouton.onclick = null;
    bouton.dataset.cible = String(lien.cible.n);
    lienActuel = lien;
  }
  sons.fin();
  parler([...PHRASES.otsukare, ' ', ...texte]);
}
