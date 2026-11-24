/* ======================================================================
   Ce que l'élève a déjà fini (gardé sur l'appareil) : l'accueil coche les cartes
   et propose la suivante (« つぎは これ »).
   ====================================================================== */

const CLE = 'kurabe.progres';

function lire() {
  try {
    const p = JSON.parse(localStorage.getItem(CLE) || '{}');
    return p && typeof p === 'object' && !Array.isArray(p) ? p : {};
  } catch {
    return {};
  }
}

let faites = lire();   // { numéro de l'activité : nombre de séries finies }
let enCours = null;

export function commencer(n) { enCours = n; }

// Une série (questions ou べんきょう) est allée jusqu'au bout.
export function finir() {
  if (enCours === null) return;
  faites = { ...faites, [enCours]: (Number(faites[enCours]) || 0) + 1 };
  try { localStorage.setItem(CLE, JSON.stringify(faites)); } catch { /* stockage indisponible */ }
}

export const estFaite = (n) => Number(faites[n]) > 0;
export const nombreFaites = () => Object.keys(faites).filter((n) => estFaite(n)).length;

export function effacerProgres() {
  faites = {};
  try { localStorage.removeItem(CLE); } catch { /* rien */ }
}
