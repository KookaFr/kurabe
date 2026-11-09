/* ==========================================================================
   くらべよう — comparer des longueurs, des masses et des quantités de liquide
   --------------------------------------------------------------------------
   Pour les lycéens avec un retard intellectuel (programme « 比較 » :
   長い / 短い, 〜より長い, 一番長い, comparer avec un modèle ; 重い / 軽い ;
   多い / 少ない ; unités cm, m, g, kg, mL, L).

   Principes repris des plans de cours des enseignants :
   - de vrais objets (photos de la maison), à l'échelle réelle ;
   - des différences très marquées au début, puis plus fines ;
   - jamais de pénalité : l'élève réessaie avec un indice ;
   - la dernière question de la série est toujours facile (finir sur une réussite).
   Tout reste sur l'appareil : aucun compte, aucune donnée envoyée.
   ========================================================================== */

import { ACTIVITES, activiteLiee, lancerActivite, rendreAccueil } from './accueil.js';
import {
  appliquerAnimations, definirLiens, ecranActuel, finDe, lienActuel, montrer, proposerMiseAJour,
} from './ecrans.js';
import { installerMotsAide } from './explications.js';
import {
  bouger, consigneEtude, demarrerEtude, etude, installerGestesEtude, rendreEtude, suivantEtude,
} from './etude/etude.js';
import { redessinerApresVersement, versementEnCours } from './lecons/versement.js';
import { $ } from './outils.js';
import { rendreParents } from './parents.js';
import { definirPhotos, installerPhotos, placerCadre } from './photos.js';
import { plateforme } from './plateforme.js';
import {
  avancerAide, debutAffichage, demarrer, nePasSavoir, parlerConsigne, rendreQuestion, session, suivant,
} from './questions/session.js';
import { activable, installerAntiZoomScenes } from './tactile.js';
import { installerBoutonsLire, installerLectureAuToucher, parler } from './voix.js';

/* ----- Boutons des écrans ----- */

activable($('btn-suivant'), suivant);
activable($('btn-aide'), avancerAide);
activable($('btn-sais-pas'), nePasSavoir);
activable($('btn-ecouter'), parlerConsigne, { garde: false });
activable($('btn-quitter'), () => { $('confirmation-quitter').hidden = false; });
activable($('quitter-oui'), () => { rendreAccueil(); montrer('accueil'); });
activable($('quitter-non'), () => { $('confirmation-quitter').hidden = true; });
activable($('btn-recommencer'), () => (finDe === 'etude' ? demarrerEtude(etude.mode) : demarrer(session.niveau)));
activable($('btn-menu'), () => { rendreAccueil(); montrer('accueil'); });
// Fin d'une série : l'activité liée (もんだい ↔ べんきょう).
definirLiens((de) => {
  const a = de === 'etude' ? ACTIVITES.find((x) => x.etude === etude?.mode) : ACTIVITES.find((x) => x.n === session?.niveau);
  const cible = a && activiteLiee(a.n);
  return cible ? { cible } : null;
});
activable($('btn-lien'), () => { if (lienActuel) lancerActivite(lienActuel.cible); });

activable($('etude-plus'), () => bouger(1, 'petit'));
activable($('etude-moins'), () => bouger(-1, 'petit'));
activable($('etude-plus-grand'), () => bouger(1, 'grand'));
activable($('etude-moins-grand'), () => bouger(-1, 'grand'));
activable($('etude-ecouter'), () => parler(consigneEtude(true)), { garde: false });
activable($('etude-quitter'), () => { rendreAccueil(); montrer('accueil'); });
activable($('etude-suivant'), suivantEtude);
installerGestesEtude();

activable($('btn-parents'), () => { rendreParents(); montrer('parents'); }, { duree: 2000, garde: false, lire: false });
$('btn-fermer-parents').addEventListener('click', () => { rendreAccueil(); montrer('accueil'); });

installerBoutonsLire();
installerLectureAuToucher();
installerPhotos();
installerMotsAide();
installerAntiZoomScenes();

// Les voix arrivent parfois après le démarrage : la liste de l'espace parents se met à jour.
plateforme.voix.surChangementVoix(() => { if (ecranActuel === 'parents') rendreParents(); });

/* ----- Changements de taille de l'écran ----- */

let minuteurRedim = 0;

let minuteurEtude = 0;
let taillePlan = '';
if ('ResizeObserver' in window) {
  new ResizeObserver(() => {
    const plan = $('etude-plan');
    const taille = `${plan.clientWidth}x${plan.clientHeight}`;
    if (taille === taillePlan) return;
    const largeurChange = taille.split('x')[0] !== taillePlan.split('x')[0];
    taillePlan = taille;
    if (ecranActuel !== 'etude' || !etude) return;
    // Pendant un versement, on ne reconstruit pas la scène (le doigt appuie sur la コップ) : après.
    if (versementEnCours) { redessinerApresVersement(); return; }
    // Pendant la démonstration du doigt 👆, et quand seule la hauteur bouge un peu (l'égalité ou le message
    // apparaît), on garde la scène : la reconstruire coupait la démonstration et faisait sauter la balance.
    if (document.querySelector('.main-demo')) return;
    if (!largeurChange && plan.clientHeight >= plan.scrollHeight - 2 && plan.clientHeight > 160) return;
    clearTimeout(minuteurEtude);
    minuteurEtude = setTimeout(rendreEtude, 60);
  }).observe($('etude-plan'));
}

// Quand la zone des objets change de taille (l'explication apparaît dessous, rotation de l'écran…),
// on recalcule la place des objets, de la règle et des repères.
let tailleEtabli = '';
if ('ResizeObserver' in window) {
  new ResizeObserver(() => {
    const etabli = $('etabli');
    const taille = `${etabli.clientWidth}x${etabli.clientHeight}`;
    if (taille === tailleEtabli) return;
    tailleEtabli = taille;
    if (ecranActuel !== 'question' || !session) return;
    // Juste après afficherQuestion, l'établi change de hauteur (l'explication s'efface) : le rendu vient d'être
    // fait à la bonne taille, et le refaire remplacerait la balance ou l'aiguille en pleine animation.
    if (performance.now() - debutAffichage < 700) return;
    clearTimeout(minuteurRedim);
    minuteurRedim = setTimeout(rendreQuestion, 60);
  }).observe($('etabli'));
}

window.addEventListener('resize', () => {
  clearTimeout(minuteurRedim);
  minuteurRedim = setTimeout(() => {
    if (ecranActuel === 'question') rendreQuestion();
    if (ecranActuel === 'photo' && !$('etape-recadrage').hidden) placerCadre();
  }, 150);
});

/* ======================================================================
   Démarrage
   ====================================================================== */

document.addEventListener('contextmenu', (ev) => {
  if (!ev.target.closest('input, textarea')) ev.preventDefault();
});

(async () => {
  appliquerAnimations();
  rendreAccueil();
  montrer('accueil');
  await plateforme.stockage.ouvrir();
  definirPhotos(await plateforme.stockage.tous());

  if (plateforme.installation.possible) plateforme.installation.enregistrerServiceWorker(proposerMiseAJour);
})();
