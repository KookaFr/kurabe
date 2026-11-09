/* ======================================================================
   Garde tactile : appui maintenu, anti-rebond, tolérance au glissement.
   Le clavier et VoiceOver restent utilisables (clic sans pointeur).
   ====================================================================== */

import { reglages } from './reglages.js';
import { versParole } from './texte.js';
import { lectureActive, lireElement, modeLecture } from './voix.js';

let derniereActivation = -Infinity;
let derniereActivationEl = null;

export function activable(el, action, { duree = null, garde = true, lire = true } = {}) {
  let suivi = null;
  let dernierPointeur = -Infinity;

  const terminer = () => {
    if (!suivi) return;
    clearTimeout(suivi.minuteur);
    el.classList.remove('en-appui', 'appui-long');
    suivi = null;
  };

  const declencher = () => {
    const maintenant = performance.now();
    const delai = garde ? Number(reglages.antiRebond) || 0 : 0;
    // Jusqu'à 0,3 s, on n'ignore que les touches répétées sur le même bouton (tremblement) ;
    // au-delà (réglage 0,5 s / 1 s), toute touche qui suit de trop près, où qu'elle soit.
    if (delai && maintenant - derniereActivation < delai && (delai > 300 || derniereActivationEl === el)) return;
    derniereActivation = maintenant;
    derniereActivationEl = el;
    if (lire && modeLecture && lectureActive() && !el.classList.contains('btn-lire')) {
      lireElement(el, el.getAttribute('aria-label') ? versParole(el.getAttribute('aria-label')) : '');
      return;
    }
    action();
  };

  el.addEventListener('pointerdown', (ev) => {
    if (suivi || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
    const attente = duree !== null ? duree : (garde ? Number(reglages.dureeAppui) || 0 : 0);
    suivi = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, attente };
    el.classList.add('en-appui');
    if (attente > 0) {
      el.style.setProperty('--duree', `${attente}ms`);
      el.classList.add('appui-long');
      suivi.minuteur = setTimeout(() => {
        terminer();
        dernierPointeur = performance.now();
        declencher();
      }, attente);
    }
  });

  el.addEventListener('pointermove', (ev) => {
    const tolerance = Math.max(30, Math.min(el.offsetWidth, el.offsetHeight) * 0.5);
    if (suivi && ev.pointerId === suivi.id && Math.hypot(ev.clientX - suivi.x, ev.clientY - suivi.y) > tolerance) terminer();
  });

  el.addEventListener('pointerup', (ev) => {
    if (!suivi || ev.pointerId !== suivi.id) return;
    const immediat = suivi.attente === 0;
    terminer();
    if (immediat) {
      dernierPointeur = performance.now();
      declencher();
    }
  });

  el.addEventListener('pointercancel', terminer);
  el.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse') terminer(); });

  el.addEventListener('click', (ev) => {
    if (ev.detail !== 0 || performance.now() - dernierPointeur < 500) return;
    declencher();
  });

  el.addEventListener('contextmenu', (ev) => ev.preventDefault());
  // Un élément qui n'est pas un vrai bouton (cadre de 10, rangée de poids) : Entrée et Espace l'activent.
  if (!['BUTTON', 'INPUT', 'LABEL', 'A'].includes(el.tagName)) {
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); declencher(); }
    });
  }
}

/* ----- Pince-zoom : permis sur l'écran (pour lire), mais pas dans une scène qu'on manipule -----
   En versant, sur la balance, sur le ruban ou dans la réserve, un 2e doigt est presque toujours
   un accident : la page ne doit pas s'agrandir sous la main de l'élève. */
const SCENES = '#etude-plan, #etabli, #lecon-choix, .explication-dessin';
export function installerAntiZoomScenes() {
  const dansScene = (ev) => ev.target instanceof Element && ev.target.closest(SCENES);
  const bloquer = (ev) => { if (ev.touches.length > 1 && dansScene(ev)) ev.preventDefault(); };
  document.addEventListener('touchstart', bloquer, { passive: false });
  document.addEventListener('touchmove', bloquer, { passive: false });
  // Safari (iPad) : le geste de zoom a son propre événement.
  document.addEventListener('gesturestart', (ev) => { if (dansScene(ev)) ev.preventDefault(); });
}
