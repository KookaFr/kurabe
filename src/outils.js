/* ==========================================================================
   くらべよう — petits outils communs
   ========================================================================== */

export const $ = (id) => document.getElementById(id);
export const echapper = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));
export const aleatoire = (a, b) => a + Math.random() * (b - a);
export const choisir = (t) => t[Math.floor(Math.random() * t.length)];
export const melanger = (t) => {
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
};

export const entier = (a, b) => Math.floor(aleatoire(a, b + 1));
