/* ======================================================================
   Voix japonaise et sons
   ====================================================================== */

import { $ } from './outils.js';
import { plateforme } from './plateforme.js';
import { reglages } from './reglages.js';
import { activable } from './tactile.js';
import { lecture, texteParle } from './texte.js';

// L'API ne dit pas si une voix est d'homme ou de femme : on reconnaît les noms des voix japonaises
// d'homme connues (iPad : Otoya, Hattori ; Windows / Edge : Ichiro, Keita…).
export const VOIX_HOMME = /otoya|hattori|ichiro|keita|daichi|naoki|takumi|\bmale\b|男/i;
export const voixJa = () => plateforme.voix.voixDisponibles().filter((v) => /^ja/i.test(v.lang));
export function voixJaponaise() {
  const voix = voixJa();
  if (!voix.length) return null;
  if (reglages.voixNom) {
    const choisie = voix.find((v) => v.name === reglages.voixNom);
    if (choisie) return choisie;
  }
  const homme = reglages.voixGenre === 'homme';
  const duGenre = voix.filter((v) => VOIX_HOMME.test(v.name) === homme);
  const liste = duGenre.length ? duGenre : voix;
  return liste.find((v) => v.localService) || liste[0];
}
// Voix d'homme demandée, mais aucune n'est installée : la voix disponible, en plus grave.
export const voixGrave = () => reglages.voixGenre === 'homme' && !reglages.voixNom && !voixJa().some((v) => VOIX_HOMME.test(v.name));

export let paroles = 0;

export function parler(segmentsOuTexte, fin) {
  paroles += 1;
  if (!plateforme.voix.disponible) {
    if (fin) setTimeout(fin, 1500);
    return;
  }
  const texte = Array.isArray(segmentsOuTexte) ? lecture(segmentsOuTexte) : String(segmentsOuTexte);
  try {
    plateforme.voix.parler(texte, {
      voix: voixJaponaise(),
      rate: Number(reglages.vitesse) || 0.9,
      pitch: voixGrave() ? 0.6 : 1,
      lang: 'ja-JP',
      onend: fin,
    });
  } catch {
    if (fin) setTimeout(fin, 1500);
  }
}

let elementLu = null;
export function lireElement(el, texte) {
  const t = (texte || texteParle(el)).trim();
  if (!t) return;
  if (elementLu) elementLu.classList.remove('en-lecture');
  elementLu = el;
  el.classList.add('en-lecture');
  parler(t, () => {
    el.classList.remove('en-lecture');
    if (elementLu === el) elementLu = null;
  });
}

export let modeLecture = false;
export const lectureActive = () => reglages.toucherLire !== false;

// Les voix s'annoncent parfois après le démarrage : on demande la liste tout de suite.
plateforme.voix.voixDisponibles();

let contexteAudio = null;

function audio() {
  if (!contexteAudio) {
    const Contexte = window.AudioContext || window.webkitAudioContext;
    if (!Contexte) return null;
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
    try { contexteAudio = new Contexte(); } catch { return null; }
  }
  if (contexteAudio.state === 'suspended') contexteAudio.resume().catch(() => {});
  return contexteAudio;
}

export function note(frequence, { duree = 0.3, type = 'sine', volume = 0.18, delai = 0 } = {}) {
  if (!reglages.sons) return;
  const a = audio();
  if (!a) return;
  const debut = a.currentTime + delai;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.value = frequence;
  gain.gain.setValueAtTime(0.0001, debut);
  gain.gain.exponentialRampToValueAtTime(volume, debut + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, debut + duree);
  osc.connect(gain).connect(a.destination);
  osc.start(debut);
  osc.stop(debut + duree + 0.05);
}

export const sons = {
  succes: () => [523.25, 659.25, 783.99].forEach((f, i) => note(f, { delai: i * 0.11, duree: 0.28 })),
  oups: () => { note(392, { duree: 0.16, volume: 0.1, type: 'triangle' }); note(330, { duree: 0.24, volume: 0.1, type: 'triangle', delai: 0.15 }); },
  fin: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, { delai: i * 0.14, duree: 0.45 })),
};

// Les navigateurs n'autorisent le son qu'après un premier geste complet.
function debloquerAudio() {
  const a = audio();
  if (!a) return;
  try {
    const source = a.createBufferSource();
    source.buffer = a.createBuffer(1, 1, 22050);
    source.connect(a.destination);
    source.start(0);
  } catch { /* rien */ }
  ['pointerup', 'touchend', 'keydown'].forEach((t) => document.removeEventListener(t, debloquerAudio, true));
}
['pointerup', 'touchend', 'keydown'].forEach((t) => document.addEventListener(t, debloquerAudio, true));

// Bouton 👆 dans chaque en-tête (accueil, question, べんきょう) : même état partout.
const ICONE_LIRE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<path d="M9 12V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M12 10V8.5a1.5 1.5 0 0 1 3 0V12"/>'
  + '<path d="M15 11a1.5 1.5 0 0 1 3 0v4a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.7-2.3L4.6 16a1.6 1.6 0 0 1 2.5-2l1.9 2"/>'
  + '<path d="M17.5 2.5a5 5 0 0 1 2.5 4M16 4.6a2.6 2.6 0 0 1 1.3 2"/></svg>';
function basculerLecture() {
  modeLecture = !modeLecture;
  document.body.classList.toggle('mode-lecture', modeLecture);
  document.querySelectorAll('.btn-lire').forEach((b) => b.setAttribute('aria-pressed', String(modeLecture)));
  parler(modeLecture ? ['さわった ところを よむよ。 もう いちど おすと、 もとに もどるよ。'] : ['もとに もどったよ。']);
}
export function majBoutonsLire() {
  document.querySelectorAll('.btn-lire').forEach((b) => { b.hidden = !lectureActive(); });
  if (!lectureActive() && modeLecture) {
    modeLecture = false;
    document.body.classList.remove('mode-lecture');
  }
}

// Le bouton 👆 est ajouté devant les boutons d'en-tête (accueil, question, べんきょう).
export function installerBoutonsLire() {
  [['btn-parents', 'avant'], ['btn-ecouter', 'avant'], ['etude-ecouter', 'avant']].forEach(([id]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn-rond btn-lire';
    b.setAttribute('aria-label', 'さわった ところを よむ');
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = ICONE_LIRE;
    $(id).before(b);
    activable(b, basculerLecture, { garde: false });
  });
  majBoutonsLire();
}

// Toucher une phrase ou un petit texte : on l'entend (sans déclencher autre chose).
export function installerLectureAuToucher() {
  const LISIBLE = '.consigne, .rappel, .retour, .phrase, .equation, .titre-etude, .groupe-titre, .titre small, .reserve-titre, '
    + '.nom-mv, .balance-nom, .mesure-mv, .valeur-etude, .fin h2, .fin p, .rang-nom, .bulle-etude';
  let depart = null;
  document.addEventListener('pointerdown', (ev) => { depart = { x: ev.clientX, y: ev.clientY, t: performance.now() }; }, true);
  document.addEventListener('pointerup', (ev) => {
    if (!depart || !lectureActive()) return;
    const bouge = Math.hypot(ev.clientX - depart.x, ev.clientY - depart.y) > 12 || performance.now() - depart.t > 1500;
    depart = null;
    if (bouge || ev.target.closest('button, [role="button"], a, input, label, select, textarea, .zone-etude, .explication')) return;
    if (ev.target.closest('#ecran-parents, #ecran-photo')) return;
    const bloc = ev.target.closest('.phrase-lue') || ev.target.closest(LISIBLE);
    // Un bloc qui a sa propre phrase à dire (le rappel « 16 ＝ じゅうろく » → « この すうじは じゅうろく »).
    const avecParole = bloc && bloc.closest('[data-parole]');
    if (avecParole) lireElement(avecParole, avecParole.dataset.parole);
    else if (bloc) lireElement(bloc);
  }, true);
}
