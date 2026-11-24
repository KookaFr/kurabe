/* ======================================================================
   Les objets dessinés (pomme, œuf, crayon…) : les mêmes sur tous les appareils,
   dans le style de l'appli (aplats, contour foncé). Ils remplacent les emoji du système,
   qui changeaient de dessin entre l'iPad et le téléphone.
   Chaque dessin tient dans un carré de 64 × 64 ; il prend la taille du texte (1em).
   ====================================================================== */

const R = '#d93a2b';    // rouge
const O = '#f08a24';    // orange
const J = '#f2b61f';    // jaune
const V = '#2c7a45';    // vert
const VC = '#6fb04a';   // vert clair
const B = '#2f6fd0';    // bleu
const BC = '#9fd0f2';   // bleu clair
const VI = '#6a3fc0';   // violet
const RO = '#f08a9a';   // rose
const BR = '#9a5b2c';   // brun
const BE = '#f3d9b1';   // beige
const PEAU = '#f6d2a8';
const G = '#b9c2c6';    // gris
const GF = '#7a8791';   // gris foncé (traits libres : lisibles sur fond clair et sombre)
const N = '#1d2427';    // encre
const W = '#ffffff';

const oeil = (x, y, r = 2.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${N}" stroke="none"/>`;
const point = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="none"/>`;

const DESSINS = {
  '🍎': `<path d="M32 20C22 10 6 17 7 34c1 16 12 28 25 23 13 5 24-7 25-23 1-17-15-24-25-14z" fill="${R}"/><path d="M32 21c0-6 1-10 4-14"/><path d="M36 13c4-7 12-8 17-5-2 6-9 10-17 5z" fill="${V}"/>`,
  '🍓': `<path d="M32 59C18 51 9 37 12 25c2-7 10-9 20-9s18 2 20 9c3 12-6 26-20 34z" fill="${R}"/><path d="M20 17l6-9 6 6 6-6 6 9-12 5z" fill="${V}"/>${[[24, 31], [34, 29], [42, 33], [28, 41], [38, 43], [32, 51]].map(([x, y]) => point(x, y, 1.8, '#ffe08a')).join('')}`,
  '🍊': `<circle cx="32" cy="37" r="23" fill="${O}"/><path d="M32 14c-2-3-1-6 1-8"/><path d="M33 12c4-5 10-5 14-2-3 5-9 7-14 2z" fill="${V}"/>`,
  '⚽': `<circle cx="32" cy="32" r="26" fill="${W}"/><path d="M32 21l10 7-4 12H26l-4-12z" fill="${N}"/><path d="M32 21V7M42 28l14-5M38 40l8 13M26 40l-8 13M22 28L8 23"/>`,
  '🥚': `<path d="M32 5c11 0 21 22 21 35 0 13-9 20-21 20S11 53 11 40C11 27 21 5 32 5z" fill="${BE}"/>`,
  '🎈': `<path d="M32 51c-4 4 4 6 0 11" stroke="${GF}"/><path d="M32 4c12 0 20 9 20 20 0 12-10 22-20 22S12 36 12 24C12 13 20 4 32 4z" fill="${R}"/><path d="M28 46h8l-4 5z" fill="${R}"/>`,
  '⭐': `<path d="M32 5l8 17 19 2-14 13 4 19-17-10-17 10 4-19L5 24l19-2z" fill="${J}"/>`,
  '🐶': `<path d="M13 15c-7 4-9 17-5 26l9-7z" fill="${BR}"/><path d="M51 15c7 4 9 17 5 26l-9-7z" fill="${BR}"/><path d="M32 9c14 0 20 10 20 25 0 14-9 22-20 22S12 48 12 34C12 19 18 9 32 9z" fill="#e2b07a"/><ellipse cx="32" cy="43" rx="10" ry="8" fill="${W}"/>${oeil(24, 30)}${oeil(40, 30)}<path d="M28 38h8l-4 4z" fill="${N}"/><path d="M32 42v3M27 47c3 2 7 2 10 0"/>`,
  '🐱': `<path d="M11 32V8l15 11z" fill="#f2b05e"/><path d="M53 32V8L38 19z" fill="#f2b05e"/><circle cx="32" cy="37" r="22" fill="#f2b05e"/>${oeil(24, 33)}${oeil(40, 33)}<path d="M29 40h6l-3 3z" fill="${RO}"/><path d="M32 43c-2 4-6 4-8 2M32 43c2 4 6 4 8 2M4 37h11M5 45l10-2M60 37H49M59 45l-10-2"/>`,
  '🐟': `<path d="M5 32c8-14 26-18 41-6l13-10v32L46 38C31 50 13 46 5 32z" fill="${B}"/>${oeil(18, 29)}<path d="M29 23c3 6 3 12 0 18"/>`,
  '🐸': `<circle cx="19" cy="18" r="10" fill="${VC}"/><circle cx="45" cy="18" r="10" fill="${VC}"/><ellipse cx="32" cy="39" rx="26" ry="20" fill="${VC}"/><circle cx="19" cy="18" r="5" fill="${W}"/><circle cx="45" cy="18" r="5" fill="${W}"/>${oeil(19, 18, 2.2)}${oeil(45, 18, 2.2)}<path d="M16 42c8 8 24 8 32 0"/>`,
  '✏️': `<g transform="rotate(-45 32 32)"><rect x="-2" y="24" width="12" height="16" rx="4" fill="${RO}"/><rect x="10" y="24" width="7" height="16" fill="${G}"/><rect x="17" y="24" width="34" height="16" fill="${J}"/><path d="M51 24l15 8-15 8z" fill="${BE}"/><path d="M60 28.800l6 3.200-6 3.200z" fill="${N}"/></g>`,
  '🌂': `<path d="M32 32v20c0 8 10 8 10 1" stroke="${GF}"/><path d="M32 6V3" stroke="${GF}"/><path d="M4 33C6 17 18 6 32 6s26 11 28 27c-5-5-10-5-14 0-4-5-10-5-14 0-4-5-10-5-14 0-4-5-9-5-14 0z" fill="${VI}"/>`,
  '🍌': `<path d="M12 8c-2 24 12 46 38 46 5 0 8-3 7-7C38 46 22 30 20 8z" fill="${J}"/><path d="M11 8h10" style="stroke-width:5"/>`,
  '🥕': `<path d="M38 24c-2-8 2-16 8-18 2 6 0 12-4 18zM40 26c6-6 14-8 20-4-4 6-12 8-18 6z" fill="${V}"/><path d="M40 22c-6-6-14-6-20 2C12 36 8 50 6 58c8-2 22-6 34-16 6-6 6-14 0-20z" fill="${O}"/><path d="M22 34l6 4M16 44l6 4"/>`,
  '🌷': `<path d="M32 34v26" stroke="${V}" style="stroke-width:4"/><path d="M32 52c-8 0-14-4-16-11 8 0 13 4 16 11zM32 52c8 0 14-4 16-11-8 0-13 4-16 11z" fill="${VC}"/><path d="M18 8l8 8 6-11 6 11 8-8c2 14-2 28-14 28S16 22 18 8z" fill="${RO}"/>`,
  '📄': `<path d="M14 5h26l12 12v42H14z" fill="${W}"/><path d="M40 5v12h12M22 28h22M22 36h22M22 44h14"/>`,
  '🍽️': `<circle cx="32" cy="32" r="27" fill="${W}"/><circle cx="32" cy="32" r="16" fill="#e3eaed"/>`,
  '👕': `<path d="M22 8L6 18l6 12 8-4v30h24V26l8 4 6-12L42 8c-2 5-6 7-10 7s-8-2-10-7z" fill="${BC}"/>`,
  '🍪': `<circle cx="32" cy="32" r="26" fill="#d9a05b"/>${[[22, 22, 4], [40, 20, 3.5], [44, 36, 4], [26, 40, 4], [36, 48, 3], [32, 30, 3]].map(([x, y, r]) => point(x, y, r, BR)).join('')}`,
  '🚗': `<path d="M5 45V34l9-4 6-12h22l8 12 9 4v11z" fill="${R}"/><path d="M22 22h8v8H18zM34 22h7l5 8H34z" fill="${BC}"/><circle cx="18" cy="46" r="7" fill="#3b464d"/><circle cx="46" cy="46" r="7" fill="#3b464d"/>${point(18, 46, 2.5, W)}${point(46, 46, 2.5, W)}`,
  '🚌': `<rect x="4" y="11" width="56" height="38" rx="6" fill="${J}"/><path d="M10 19h10v10H10zM24 19h10v10H24zM38 19h10v10H38z" fill="${BC}"/><path d="M4 36h56"/><circle cx="17" cy="50" r="6" fill="#3b464d"/><circle cx="47" cy="50" r="6" fill="#3b464d"/>${point(17, 50, 2, W)}${point(47, 50, 2, W)}`,
  '🚲': `<g stroke="${GF}"><circle cx="14" cy="42" r="11" fill="none"/><circle cx="50" cy="42" r="11" fill="none"/></g><path d="M14 42l10-20h18l8 20M24 22l12 20h14M36 42l6-20M20 22h8M38 16h9" stroke="${R}" style="stroke-width:3.5"/>`,
  '🧒': `<path d="M12 61c0-12 8-18 20-18s20 6 20 18z" fill="${B}"/><circle cx="32" cy="25" r="16" fill="${PEAU}"/><path d="M16 23c0-11 8-17 16-17s16 6 16 17c-6-2-10-5-12-9-4 5-12 8-20 9z" fill="${BR}"/>${oeil(26, 28, 2)}${oeil(38, 28, 2)}<path d="M27 34c3 2 7 2 10 0"/>`,
  '📕': `<rect x="12" y="6" width="40" height="52" rx="4" fill="${R}"/><path d="M20 6v52"/><rect x="26" y="16" width="20" height="10" rx="2" fill="${W}"/>`,
  '📓': `<rect x="13" y="6" width="40" height="52" rx="4" fill="${B}"/><rect x="24" y="16" width="22" height="12" rx="2" fill="${W}"/><path d="M17 14H8M17 24H8M17 34H8M17 44H8M17 52H8" stroke="${GF}" style="stroke-width:3.5"/>`,
  '🪶': `<path d="M56 6C36 6 16 22 12 46l6 6c24-4 40-24 38-46z" fill="#dfeaf2"/><path d="M6 58l40-40M22 42l-2-10M30 34l-2-10M22 42l10 2M30 34l10 2" stroke="${GF}"/>`,
  '🧸': `<circle cx="16" cy="13" r="8" fill="#c98a4b"/><circle cx="48" cy="13" r="8" fill="#c98a4b"/><circle cx="11" cy="44" r="7" fill="#c98a4b"/><circle cx="53" cy="44" r="7" fill="#c98a4b"/><ellipse cx="32" cy="47" rx="17" ry="14" fill="#c98a4b"/><circle cx="32" cy="24" r="18" fill="#c98a4b"/><ellipse cx="32" cy="30" rx="8" ry="6" fill="${BE}"/>${oeil(25, 21, 2.2)}${oeil(39, 21, 2.2)}<path d="M30 28h4l-2 2.500z" fill="${N}"/>`,
  '🪨': `<path d="M8 46l6-20 14-12 18 4 10 16-4 16-20 6-18-2z" fill="${G}"/><path d="M28 14l4 14 14 6M32 28l-10 8"/>`,
  '🥫': `<path d="M12 14v36c0 4 9 8 20 8s20-4 20-8V14z" fill="${G}"/><path d="M12 24c0 4 9 8 20 8s20-4 20-8v18c0 4-9 8-20 8s-20-4-20-8z" fill="${R}"/><ellipse cx="32" cy="14" rx="20" ry="8" fill="#e3eaed"/>`,
  '🔑': `<path d="M27 31l4-4 28 28v5h-7v-5h-5v-5h-5z" fill="${J}"/><circle cx="20" cy="20" r="14" fill="${J}"/><circle cx="18" cy="18" r="4.500" fill="${W}"/>`,
  '🍅': `<path d="M32 16c16-4 26 6 26 20 0 12-11 22-26 22S6 48 6 36c0-14 10-24 26-20z" fill="${R}"/><path d="M32 19l-10-6h6l-2-7 6 5 6-5-2 7h6z" fill="${V}"/>`,
  '👟': `<path d="M6 30l16-10 12 14 20 4c4 1 6 4 6 8H6z" fill="${B}"/><path d="M6 46h54v7H6z" fill="${W}"/><path d="M24 27l6-4M28 32l6-4"/>`,
  '✋': `<path d="M20 34V14a4 4 0 018 0v14V8a4 4 0 018 0v20V12a4 4 0 018 0v20l4-8a4 4 0 017 4l-7 20c-2 6-8 10-16 10-10 0-18-6-20-16l-4-14a4 4 0 017-3z" fill="${PEAU}"/>`,
};
DESSINS['✏'] = DESSINS['✏️'];
DESSINS['🍽'] = DESSINS['🍽️'];

const CADRE = `fill="none" stroke="${N}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;

export const aUnDessin = (emoji) => Boolean(DESSINS[emoji]);

// Le dessin, à la taille du texte (font-size de l'élément qui le reçoit). Sans dessin connu : l'emoji tel quel.
export function dessinObjet(emoji) {
  const d = DESSINS[emoji];
  return d ? `<svg class="objet-dessin" viewBox="0 0 64 64" ${CADRE} aria-hidden="true">${d}</svg>` : emoji;
}

// Le même dessin, posé dans un autre SVG (les vignettes des cartes) : coin haut-gauche et côté, en unités du SVG.
export function dessinDans(emoji, x, y, cote) {
  const d = DESSINS[emoji];
  return d ? `<svg x="${x}" y="${y}" width="${cote}" height="${cote}" viewBox="0 0 64 64" ${CADRE}>${d}</svg>` : '';
}
