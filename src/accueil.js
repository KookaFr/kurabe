/* ======================================================================
   Accueil : les onglets (かず・ながさ・おもさ・かさ), la liste des activités et leurs cartes
   ====================================================================== */

import { balanceNumerique } from './dessins.js';
import { demarrerEtude } from './etude/etude.js';
import { $ } from './outils.js';
import { demarrer } from './questions/session.js';
import { ecrireReglages, reglages } from './reglages.js';
import { activable } from './tactile.js';
import {
  html, ICHIBAN, K, KARU, lecture, ME, MI, MIJIKA, NAGA, OMO, ONAJI, OO_I, OOKI, SAGA, SUJI, SUKU, TEHON, V,
} from './texte.js';
import { parler } from './voix.js';

// Les quatre onglets de l'accueil.

const ICONE_TRAIT = 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
export const THEMES = [
  {
    cle: 'kazu', titre: ['かず'], sous: ['いくつ？ よめるかな？'],
    icone: `<svg viewBox="0 0 32 32" ${ICONE_TRAIT} aria-hidden="true"><path d="M5 10l3-2v16M5 24h6M14 12a3.5 3.5 0 0 1 7 0c0 4-7 7-7 12h7M24 9h5l-3 5a4 4 0 1 1-3 6"/></svg>`,
  },
  {
    cle: 'nagasa', titre: [NAGA, 'さ'], sous: [NAGA, 'い？ ', MIJIKA, 'い？'],
    icone: `<svg viewBox="0 0 32 32" ${ICONE_TRAIT} aria-hidden="true"><rect x="3" y="11" width="26" height="10" rx="2"/><path d="M8 11v4M13 11v3M18 11v4M23 11v3"/></svg>`,
  },
  {
    cle: 'omosa', titre: [OMO, 'さ'], sous: [OMO, 'い？ ', KARU, 'い？'],
    icone: `<svg viewBox="0 0 32 32" ${ICONE_TRAIT} aria-hidden="true"><path d="M16 7v19M10 28h12M5 11l22-2M5 11l-3 8h6zM27 9l-3 8h6z"/></svg>`,
  },
  {
    cle: 'kasa', titre: ['かさ'], sous: [OO_I, 'い？ ', SUKU, 'ない？'],
    icone: `<svg viewBox="0 0 32 32" ${ICONE_TRAIT} aria-hidden="true"><path d="M8 5h16l-2 23H10z"/><path d="M9.2 15h13.6" /><path d="M10 15l1 12h10l1-12z" fill="currentColor" opacity=".35" stroke="none"/></svg>`,
  },
];

export const ACTIVITES = [
  { n: 1, titre: ['どっちが ', NAGA, 'い？'], sous: ['やさしい'], fr: 'Lequel est le plus long ? (facile)', barres: [1, 0.42] },
  { n: 2, titre: ['どっちが ', NAGA, 'い？'], sous: ['むずかしい'], fr: 'Lequel est le plus long ? (difficile)', barres: [1, 0.86] },
  { n: 3, titre: [ICHIBAN, ' ', NAGA, 'いのは？'], sous: ['3つから えらぶ'], fr: 'Le plus long parmi trois', barres: [0.62, 1, 0.8] },
  { n: 4, titre: ['ことばで いおう'], sous: [V('〇〇は △△より …', 'なになには なになにより')], fr: 'La phrase « A は B より 長い »', barres: [1, 0.55] },
  { n: 5, titre: [TEHON, 'と ', ONAJI, 'じ'], sous: [ONAJI, 'じ ', NAGA, 'さを さがす'], fr: 'Même longueur que le modèle', barres: 'tehon' },
  { n: 6, titre: ['cm で くらべる'], sous: ['10\u00a0cm と 43\u00a0cm'], fr: 'Nombres en cm (10 cm ou 43 cm ?)', barres: 'cm' },
  { n: 7, titre: ['m と cm'], sous: ['1\u00a0m ＝ 100\u00a0cm'], fr: 'Mètres et centimètres (1 m ou 75 cm ?)', barres: 'mcm' },
  { n: 8, titre: ['ずれている'], sous: ['はしが そろって いない'], fr: 'Objets décalés (pas alignés à gauche)', barres: 'decale' },
  { n: 9, titre: ['ななめ'], sous: ['かたむいている'], fr: 'Objets penchés', barres: 'incline' },
  { n: 10, etude: 'libre', titre: ['のばして みよう'], sous: [SUJI, 'が かわるよ'], fr: 'べんきょう : étirer le ruban et voir les nombres changer', barres: 'etude-libre' },
  { n: 11, etude: 'plus', titre: ['たしざん'], sous: ['みぎに のばす（＋）'], fr: 'べんきょう : additionner en tirant vers la droite', barres: 'etude-plus' },
  { n: 12, etude: 'moins', titre: ['ひきざん'], sous: ['ひだりに もどす（−）'], fr: 'べんきょう : soustraire en tirant vers la gauche', barres: 'etude-moins' },
  { n: 35, theme: 'kazu', titre: ['いくつ？'], sous: ['かぞえよう'], fr: 'Compter des objets (1 à 10), réponse en chiffres et en hiragana', barres: 'k-compter' },
  { n: 36, theme: 'kazu', titre: ['よみかた'], sous: [SUJI, 'と ひらがな'], fr: 'Lire les nombres : chiffre → hiragana, hiragana → chiffre', barres: 'k-lire' },
  { n: 37, theme: 'kazu', titre: ['10の まとまり'], sous: ['10ずつ かぞえる'], fr: 'Compter des jetons rangés par 10 (11 à 99)', barres: 'k-dizaines' },
  { n: 38, theme: 'kazu', titre: ['どっちが ', OOKI, 'きい？'], sous: [SUJI, 'を くらべる'], fr: 'Comparer deux nombres (1 à 100)', barres: 'k-comparer' },
  { n: 42, theme: 'kazu', titre: ['かぞえかた'], sous: [V('〜こ、 〜ひき、 〜ほん', 'こ、 ひき、 ほん')], fr: 'Les compteurs (助数詞) : choisir 〜こ, 〜ひき, 〜ほん… selon la chose, puis la bonne lecture (いっぽん, さんぼん, ろっぽん…)', barres: 'k-compteur' },
  { n: 39, theme: 'kazu', etude: 'lecon-kazu1', titre: ['1から 10まで'], sous: ['いち、 に、 さん…'], fr: 'べんきょう : compter jusqu’à 10 avec le cadre de 10 (et la lecture en hiragana)', barres: 'k-lecon1' },
  { n: 40, theme: 'kazu', etude: 'lecon-kazu2', titre: ['10より ', OOKI, 'きい かず'], sous: ['10の まとまりで 100まで'], fr: 'べんきょう : de 11 à 100 avec les « 10の まとまり » (cadres de 10 pleins), comptés par 10', barres: 'k-lecon2' },
  { n: 41, theme: 'kazu', etude: 'lecon-kazu3', titre: ['100より ', OOKI, 'きい かず'], sous: ['ひゃく、 せん'], fr: 'べんきょう : les centaines jusqu’à 1000 (さんびゃく, ろっぴゃく…)', barres: 'k-lecon3' },
  { n: 45, theme: 'kazu', etude: 'lecon-oto', titre: ['おとが かわる かぞえかた'], sous: ['いっぽん、 さんぼん、 ろっぽん'], fr: 'べんきょう : les compteurs dont le son change (1, 3, 6, 8, 10 : いっぽん, さんぼん, ろっぽん…), à retenir ; pour les grands nombres, le dernier chiffre décide', barres: 'k-oto' },
  { n: 32, groupe: 'culture', etude: 'lecon-corps', titre: ['からだで はかる'], sous: ['あた・ひろ'], fr: 'ね、しっていた？ Mesurer avec le corps (あた, ひろ), et pourquoi le cm', barres: 'lecon-corps' },
  { n: 33, groupe: 'culture', etude: 'lecon-shaku', titre: ['しゃくと すん'], sous: ['いっすんぼうしは なん cm？'], fr: 'ね、しっていた？ 尺 et 寸 : 1 寸 ≈ 3 cm, 1 尺 ≈ 30 cm', barres: 'lecon-shaku' },
  // Avec la はかり numérique (réglage des parents), « はりで くらべる » devient « すうじで くらべる » :
  // les deux objets sur deux balances à chiffres, on compare les nombres affichés.
  {
    n: 25, theme: 'omosa', barres: 'hakari-simple',
    get titre() { return balanceNumerique() ? [SUJI, 'で くらべる'] : ['はりで くらべる']; },
    get sous() { return balanceNumerique() ? ['はかりの ', SUJI, 'が ', OOKI, 'きい ほう'] : ['はかりの はりが たくさん まわった ほう']; },
    get fr() { return balanceNumerique() ? 'Balances de cuisine numériques : le nombre le plus grand' : 'Balances de cuisine sans nombres : l’aiguille qui a le plus tourné'; },
  },
  { n: 14, theme: 'omosa', titre: [MI, 'た', ME, 'と ちがう'], sous: ['よそうして、 はかりで たしかめる'], fr: 'Gros mais léger : deviner, puis vérifier sur les balances de cuisine', barres: 'devine' },
  { n: 15, theme: 'omosa', titre: [ICHIBAN, ' ', OMO, 'いのは？'], sous: ['はかりで くらべる'], fr: 'Le plus lourd parmi trois (balances de cuisine)', barres: 'hakari' },
  { n: 29, theme: 'omosa', titre: ['はかりを よもう'], sous: ['はりが さす ', SUJI, 'を よむ'], fr: 'Lire une balance de cuisine (trois nombres au choix)', barres: 'lecture-hakari' },
  { n: 16, theme: 'omosa', titre: ['g で くらべる'], sous: ['300\u00a0g と 250\u00a0g'], fr: 'Nombres en g (300 g ou 250 g ?)', barres: 'g' },
  { n: 17, theme: 'omosa', titre: ['kg と g'], sous: ['1\u00a0kg ＝ 1000\u00a0g'], fr: 'Kilogrammes et grammes (1 kg ou 800 g ?)', barres: 'kgg' },
  { n: 28, theme: 'omosa', etude: 'lecon-hakari', titre: ['はかりの よみかた'], sous: ['はりの うごきと ', ME, 'もり'], fr: 'べんきょう : lire une balance de cuisine (l’aiguille, les graduations)', barres: 'lecon-hakari' },
  { n: 27, theme: 'omosa', etude: 'lecon-unites', titre: ['g と kg'], sous: ['1えんだまは 1\u00a0g'], fr: 'べんきょう : les unités sur la balance de cuisine (1円玉 ＝ 1 g … 1 kg ＝ 1000 g)', barres: 'lecon-unites' },
  { n: 30, theme: 'omosa', etude: 'lecon-pratique', titre: ['はかって みよう'], sous: ['おもりを のせて ○\u00a0g に'], fr: 'べんきょう : poser des poids pour que l’aiguille montre une masse donnée', barres: 'lecon-pratique' },
  { n: 26, theme: 'omosa', groupe: 'culture', etude: 'lecon-balance', titre: ['てんびん'], sous: ['むかしの はかり'], fr: 'ね、しっていた？ La balance à plateaux (leçon guidée, poids identiques)', barres: 'lecon-balance' },
  { n: 13, theme: 'omosa', groupe: 'culture', titre: ['てんびんで くらべる'], sous: [SAGA, 'がった ほうが ', OMO, 'い'], fr: 'ね、しっていた？ Lequel est le plus lourd ? (balance à plateaux)', barres: 'balance' },
  { n: 18, theme: 'omosa', groupe: 'culture', etude: 'balance', titre: ['つりあわせよう'], sous: ['つみきや おもりを のせる'], fr: 'ね、しっていた？ Équilibrer la balance avec des cubes ou des poids', barres: 'etude-balance' },
  { n: 31, theme: 'omosa', groupe: 'culture', etude: 'lecon-monme', titre: ['もんめと 5えんだま'], sous: ['むかしの ', OMO, 'さの たんい'], fr: 'ね、しっていた？ 匁 (もんめ) : la pièce de 5 円 pèse 1 匁 (3,75 g)', barres: 'lecon-monme' },
  { n: 19, theme: 'kasa', titre: ['どっちが ', OO_I, 'い？'], sous: [ONAJI, 'じ コップで くらべる'], fr: 'Lequel contient le plus ? (verres identiques)', barres: 'verres' },
  { n: 20, theme: 'kasa', titre: [ICHIBAN, ' ', OO_I, 'いのは？'], sous: ['3つから えらぶ'], fr: 'Le plus rempli parmi trois verres', barres: 'verres3' },
  { n: 21, theme: 'kasa', titre: ['うつして くらべよう'], sous: ['かたちが ちがう いれもの'], fr: 'Récipients différents : verser dans des verres identiques', barres: 'transvaser' },
  { n: 22, theme: 'kasa', titre: ['mL で くらべる'], sous: ['200\u00a0mL と 350\u00a0mL'], fr: 'Nombres en mL (200 mL ou 350 mL ?)', barres: 'ml' },
  { n: 23, theme: 'kasa', titre: ['L と mL'], sous: ['1\u00a0L ＝ 1000\u00a0mL'], fr: 'Litres et millilitres (1 L ou 800 mL ?)', barres: 'lml' },
  { n: 24, theme: 'kasa', etude: 'verre', titre: ['はかって いれよう'], sous: ['カップの ', ME, 'もりを よむ'], fr: 'べんきょう : remplir un verre doseur jusqu’à la bonne quantité', barres: 'etude-verre' },
  { n: 43, theme: 'kasa', etude: 'lecon-hanbun', titre: ['はんぶんこ'], sous: ['2つの コップに ', ONAJI, 'じだけ'], fr: 'べんきょう : partager un liquide moitié-moitié dans deux verres identiques (verser en appuyant)', barres: 'lecon-hanbun' },
  { n: 44, theme: 'kasa', etude: 'lecon-maze', titre: ['まぜて みよう'], sous: ['いろが かわる？ かさは？'], fr: 'べんきょう : mélanger deux liquides (couleurs, かさの たしざん, こい・うすい)', barres: 'lecon-maze' },
  { n: 34, theme: 'kasa', groupe: 'culture', etude: 'lecon-gou', titre: ['ごうと しょう'], sous: ['おこめの カップ'], fr: 'ね、しっていた？ 合 et 升 : 1 合 ＝ 180 mL (le riz), 1 升 ＝ 1,8 L', barres: 'lecon-gou' },
];
export const themeDe = (a) => a.theme || 'nagasa';

// Liens entre もんだい et べんきょう : à la fin d'une série, un bouton propose l'activité liée
// (après はかりを よもう → la leçon はかりの よみかた ; après la leçon → les questions).
export const LIENS = {
  // もんだい → べんきょう
  35: 39, 36: 39, 37: 40, 38: 40, 42: 45,
  6: 10, 7: 10,
  25: 28, 14: 28, 15: 28, 29: 28, 16: 27, 17: 27, 13: 26,
  22: 24, 23: 24,
  // べんきょう → もんだい
  39: 35, 40: 37, 41: 36, 45: 42,
  10: 6, 11: 6, 12: 6,
  28: 29, 27: 16, 30: 29, 26: 13,
  24: 22,
};
export const activiteLiee = (n) => ACTIVITES.find((a) => a.n === LIENS[n]) || null;
export const lancerActivite = (a) => (a.etude ? demarrerEtude(a.etude) : demarrer(a.n));
// Numéro affiché : 1, 2, 3… dans chaque onglet (les もんだい, puis les べんきょう).
// Trois groupes : もんだい, べんきょう, puis ね、しっていた？ (la culture : むかしは…).
const groupeDe = (a) => a.groupe || (a.etude ? 'etude' : 'probleme');
export function ordreTheme(theme) {
  const liste = ACTIVITES.filter((a) => themeDe(a) === theme);
  return ['probleme', 'etude', 'culture'].flatMap((g) => liste.filter((a) => groupeDe(a) === g));
}
export const numeroAffiche = (a) => ordreTheme(themeDe(a)).indexOf(a) + 1;

/* ----- Accueil ----- */

// Petits dessins des cartes おもさ / かさ (même cadre 256 × 64 que les barres des longueurs).
function contenuActiviteMV(code) {
  const trait = 'fill:none;stroke:var(--encre-douce);stroke-width:4;stroke-linecap:round;stroke-linejoin:round';
  const texte = 'fill:var(--encre);font-size:24px;font-weight:700';
  const question = '<text x="170" y="44" style="fill:var(--action);font-size:30px;font-weight:700">？</text>';
  const verre = (x, h, c, w = 34, H = 56) => `<path d="M${x} ${62 - H}v${H}h${w}v${-H}" style="${trait}"/>`
    + `<rect x="${x + 2}" y="${60 - h}" width="${w - 4}" height="${h}" style="fill:${c}"/>`;
  const cadran = (x, a) => `<circle cx="${x}" cy="34" r="22" style="${trait};stroke-width:3"/>`
    + `<line x1="${x}" y1="34" x2="${x + 16 * Math.sin(a)}" y2="${34 - 16 * Math.cos(a)}" style="stroke:var(--o1);stroke-width:4;stroke-linecap:round"/>`;
  // Une petite はかり numérique (réglage des parents) : un écran à chiffres.
  const ecranCarte = (x, v) => `<rect x="${x - 34}" y="8" width="68" height="48" rx="8" style="fill:var(--o2)"/>`
    + `<rect x="${x - 27}" y="17" width="54" height="26" rx="3" style="fill:#c7d5b4"/>`
    + `<text x="${x + 18}" y="38" style="fill:#1f2a1c;font-size:18px;font-weight:800;text-anchor:end">${v}</text>`
    + `<text x="${x + 21}" y="38" style="fill:#1f2a1c;font-size:10px;font-weight:800">g</text>`;
  switch (code) {
    case 'balance':
      return `<path d="M128 30v28M104 60h48" style="${trait}"/><g transform="rotate(9 128 30)"><path d="M48 30h160M30 22h36M190 22h36" style="${trait}"/>`
        + '<circle cx="48" cy="12" r="9" style="fill:var(--o5)"/><circle cx="208" cy="9" r="12" style="fill:var(--o2)"/></g>';
    case 'devine':
      return '<circle cx="60" cy="30" r="27" style="fill:var(--o6);opacity:.85"/><path d="M60 57v6" style="stroke:var(--encre-douce);stroke-width:2"/>'
        + '<circle cx="200" cy="46" r="13" style="fill:var(--encre-douce)"/>'
        + '<text x="116" y="44" style="fill:var(--action);font-size:30px;font-weight:700">？</text>';
    case 'hakari':
      if (balanceNumerique()) return ecranCarte(48, 150) + ecranCarte(128, 700) + ecranCarte(208, 430);
      return cadran(48, 1.2) + cadran(128, 3.4) + cadran(208, 2.1);
    case 'hakari-simple':
      // Numérique : deux petits écrans à chiffres ; à aiguille : deux cadrans, l'un a plus tourné.
      if (balanceNumerique()) return ecranCarte(70, 300) + ecranCarte(170, 20);
      return `<path d="M70 34L70 12A22 22 0 0 1 88 47Z" style="fill:var(--o5);opacity:.45"/>${cadran(70, 2.2)}`
        + `<path d="M170 34L170 12A22 22 0 0 1 182 16Z" style="fill:var(--o5);opacity:.45"/>${cadran(170, 0.6)}`;
    case 'lecon-balance':
      return `<path d="M128 30v28M104 60h48" style="${trait}"/><g transform="rotate(-9 128 30)"><path d="M48 30h160M30 22h36M190 22h36" style="${trait}"/>`
        + '<circle cx="48" cy="12" r="10" style="fill:var(--o1)"/></g>'
        + '<path d="M218 6l-10 12h6v14h8V18h6z" style="fill:var(--action)"/>';
    case 'lecon-unites':
      return '<circle cx="34" cy="44" r="12" style="fill:var(--metal);stroke:var(--encre-douce);stroke-width:2"/>'
        + '<text x="34" y="49" text-anchor="middle" style="fill:var(--encre);font-size:13px;font-weight:700">1</text>'
        + '<rect x="70" y="32" width="26" height="28" rx="4" style="fill:var(--metal)"/><rect x="118" y="22" width="36" height="38" rx="5" style="fill:var(--metal)"/>'
        + '<rect x="178" y="6" width="56" height="54" rx="6" style="fill:color-mix(in srgb, var(--metal) 70%, var(--encre-douce))"/>'
        + `<text x="83" y="51" text-anchor="middle" style="${texte};font-size:10px">10g</text><text x="136" y="46" text-anchor="middle" style="${texte};font-size:12px">100g</text>`
        + `<text x="206" y="40" text-anchor="middle" style="${texte};font-size:16px">1kg</text>`;
    case 'k-compter':
      return [0, 1, 2, 3, 4].map((k) => `<text x="${20 + k * 30}" y="44" style="font-size:24px">🍎</text>`).join('')
        + `<text x="185" y="46" style="${texte};font-size:30px">5</text>`;
    case 'k-lire':
      return `<text x="20" y="48" style="${texte};font-size:40px">7</text><path d="M60 34h40M92 26l8 8-8 8" style="${trait}"/>`
        + `<text x="115" y="44" style="${texte};font-size:26px">なな</text>`;
    case 'k-dizaines':
      return [0, 1, 2].map((k) => `<rect x="${12 + k * 60}" y="16" width="52" height="22" rx="3" style="fill:var(--o2)"/>`).join('')
        + '<circle cx="200" cy="27" r="6" style="fill:var(--o5)"/><circle cx="216" cy="27" r="6" style="fill:var(--o5)"/>'
        + `<text x="80" y="60" style="${texte};font-size:18px">10 10 10 ＋ 2</text>`;
    case 'k-compteur':
      return [0, 1, 2].map((k) => `<text x="${8 + k * 30}" y="44" style="font-size:24px">🐟</text>`).join('')
        + `<text x="104" y="44" style="${texte};font-size:26px">3びき</text>`;
    case 'k-oto':
      return `<text x="8" y="44" style="font-size:24px">✏️</text><text x="40" y="30" style="${texte};font-size:18px">1 3 6 8 10</text>`
        + `<text x="40" y="56" style="fill:var(--o5);font-size:20px;font-weight:700">っぽん ぼん</text>`;
    case 'k-comparer':
      return `<text x="20" y="46" style="${texte};font-size:32px">21</text><text x="88" y="46" style="${texte};font-size:30px">12</text>${question}`;
    case 'k-lecon1':
      return Array.from({ length: 10 }, (_, k) => `<circle cx="${30 + (k % 5) * 26}" cy="${18 + Math.floor(k / 5) * 26}" r="10" style="fill:${k < 7 ? 'var(--o5)' : 'none'};stroke:var(--encre-douce);stroke-width:2"/>`).join('')
        + `<text x="170" y="46" style="${texte};font-size:30px">7</text>`;
    case 'k-lecon2':
      return [0, 1, 2].map((k) => `<rect x="${6 + k * 38}" y="14" width="34" height="26" rx="3" style="fill:none;stroke:var(--encre-douce);stroke-width:1.5"/>`
        + Array.from({ length: 10 }, (_, j) => `<circle cx="${11 + k * 38 + (j % 5) * 6}" cy="${21 + Math.floor(j / 5) * 12}" r="2.6" style="fill:var(--o2)"/>`).join('')).join('')
        + '<circle cx="128" cy="34" r="5" style="fill:var(--o5)"/><circle cx="142" cy="34" r="5" style="fill:var(--o5)"/>'
        + `<text x="162" y="44" style="${texte};font-size:28px">32</text>`;
    case 'k-lecon3':
      return [14, 74].map((x0) => `<rect x="${x0}" y="6" width="54" height="54" rx="4" style="fill:none;stroke:var(--o4);stroke-width:1.5"/>`
        + Array.from({ length: 100 }, (_, j) => `<circle cx="${x0 + 3.2 + (j % 10) * 5.2}" cy="${9.2 + Math.floor(j / 10) * 5.2}" r="2" style="fill:var(--o4)"/>`).join('')).join('')
        + `<text x="146" y="44" style="${texte};font-size:28px">200</text>`;
    case 'lecture-hakari':
      return `${cadran(70, 2.1)}<text x="130" y="44" style="${texte}">？ g</text>`;
    case 'lecon-pratique':
      return `${cadran(70, 1.6)}<path d="M112 34h30M134 26l8 8-8 8" style="${trait}"/>`
        + '<rect x="160" y="26" width="20" height="30" rx="3" style="fill:var(--metal)"/><rect x="186" y="38" width="14" height="18" rx="3" style="fill:var(--metal)"/><rect x="204" y="38" width="14" height="18" rx="3" style="fill:var(--metal)"/>';
    case 'lecon-monme':
      return '<circle cx="70" cy="34" r="22" style="fill:#c9a227"/><circle cx="70" cy="34" r="6" style="fill:var(--surface)"/>'
        + `<text x="110" y="44" style="${texte}">＝ 1もんめ</text>`;
    case 'lecon-corps':
      return '<rect x="10" y="10" width="236" height="12" rx="3" style="fill:var(--bois)"/>'
        + [0, 1, 2, 3].map((k) => `<path d="M${14 + k * 58} 34h52" style="stroke:var(--o2);stroke-width:3"/><text x="${30 + k * 58}" y="60" style="font-size:22px">✋</text>`).join('');
    case 'lecon-shaku':
      return '<rect x="10" y="20" width="236" height="34" rx="4" style="fill:var(--bois)"/>'
        + Array.from({ length: 11 }, (_, k) => `<path d="M${10 + k * 22.4} 20v12" style="stroke:var(--encre);stroke-width:2"/>`).join('')
        + '<rect x="10" y="20" width="22.4" height="34" style="fill:var(--o5);opacity:.4"/><text x="12" y="16" style="font-size:16px">🧒</text>';
    case 'lecon-gou':
      return `${verre(60, 44, 'var(--eau)', 40)}<text x="62" y="20" style="${texte};font-size:14px">1ごう</text>`
        + `<path d="M110 34h30M132 26l8 8-8 8" style="${trait}"/><text x="152" y="44" style="${texte}">180 mL</text>`;
    case 'lecon-hakari':
      return `${cadran(70, 2.4)}<path d="M120 34h40M150 24l10 10-10 10" style="${trait}"/>`
        + [0, 1, 2].map((k) => `<rect x="${186 + k * 18}" y="${40 - k * 0}" width="15" height="18" rx="3" style="fill:var(--metal)"/>`).join('');
    case 'g': return `<text x="6" y="27" style="${texte}">300 g</text><text x="6" y="58" style="${texte}">250 g</text>${question}`;
    case 'kgg': return `<text x="6" y="27" style="${texte}">1 kg</text><text x="6" y="58" style="${texte}">800 g</text>${question}`;
    case 'ml': return `<text x="6" y="27" style="${texte}">200 mL</text><text x="6" y="58" style="${texte}">350 mL</text>${question}`;
    case 'lml': return `<text x="6" y="27" style="${texte}">1 L</text><text x="6" y="58" style="${texte}">800 mL</text>${question}`;
    case 'etude-balance':
      return `<path d="M128 30v28M104 60h48M48 30h160M30 22h36M190 22h36" style="${trait}"/>`
        + '<circle cx="48" cy="12" r="9" style="fill:var(--o5)"/>'
        + [0, 1, 2].map((k) => `<rect x="${195 + k * 9}" y="10" width="8" height="10" rx="1" style="fill:var(--o5)"/>`).join('')
        + '<rect x="199" y="0" width="8" height="10" rx="1" style="fill:var(--o5)"/>';
    case 'verres': return verre(70, 22, 'var(--eau)') + verre(150, 44, 'var(--jus)');
    case 'verres3': return verre(50, 30, 'var(--eau)') + verre(110, 46, 'var(--jus)') + verre(170, 18, 'var(--the)');
    case 'transvaser':
      return `<path d="M30 8h18v54H30z" style="${trait}"/><rect x="32" y="20" width="14" height="40" style="fill:var(--eau)"/>`
        + `<path d="M70 40v20h70V40" style="${trait}"/><rect x="72" y="48" width="66" height="12" style="fill:var(--jus)"/>`
        + `<path d="M154 34h26M172 26l8 8-8 8" style="${trait}"/>${verre(196, 26, 'var(--eau)', 22)}${verre(224, 40, 'var(--jus)', 22)}`;
    case 'lecon-hanbun':
      return `<path d="M100 6h30v30h-30z" style="${trait}"/><rect x="102" y="16" width="26" height="18" style="fill:var(--jus)"/>`
        + `<path d="M130 12c8 0 8 14 0 14" style="${trait};stroke-width:3"/>${verre(60, 24, 'var(--jus)', 30, 34)}${verre(170, 24, 'var(--jus)', 30, 34)}`
        + '<path d="M58 38h146" style="stroke:var(--repere);stroke-width:3;stroke-dasharray:6 5"/>';
    case 'lecon-maze':
      return `${verre(20, 30, '#3b82f6', 28, 40)}<text x="54" y="44" style="${texte}">＋</text>${verre(82, 30, '#facc15', 28, 40)}`
        + `<path d="M124 34h30M146 26l8 8-8 8" style="${trait}"/>${verre(170, 44, '#2fa55a', 40, 52)}`;
    case 'etude-verre':
      return `${verre(100, 30, 'var(--eau)', 52)}`
        + [14, 26, 38, 50].map((y) => `<path d="M102 ${y}h10" style="stroke:var(--encre-douce);stroke-width:2"/>`).join('')
        + `<path d="M180 52V14M170 24l10-10 10 10" style="${trait};stroke:var(--o3)"/>`;
    default: return '';
  }
}

function svgActivite(barres) {
  const mv = typeof barres === 'string' ? contenuActiviteMV(barres) : '';
  if (mv) return `<svg viewBox="0 0 256 64" preserveAspectRatio="xMinYMid meet" aria-hidden="true">${mv}</svg>`;
  const x0 = 10;
  const L = 236;
  let contenu = `<rect x="4" y="2" width="6" height="60" rx="2" style="fill:var(--repere)"/>`;
  if (barres === 'cm' || barres === 'mcm') {
    const [a, b] = barres === 'cm' ? ['10 cm', '43 cm'] : ['1 m', '75 cm'];
    const style = 'fill:var(--encre);font-size:24px;font-weight:700';
    contenu = `<text x="6" y="27" style="${style}">${a}</text><text x="6" y="58" style="${style}">${b}</text>`
      + `<text x="150" y="44" style="fill:var(--action);font-size:30px;font-weight:700">？</text>`;
  } else if (barres === 'decale') {
    contenu = `<rect x="70" y="10" width="170" height="16" rx="3" style="fill:var(--o2)"/>`
      + `<rect x="12" y="38" width="190" height="16" rx="3" style="fill:var(--o5)"/>`;
  } else if (barres === 'incline') {
    contenu = `<rect x="20" y="10" width="200" height="14" rx="3" transform="rotate(8 120 17)" style="fill:var(--o4)"/>`
      + `<rect x="40" y="40" width="160" height="14" rx="3" transform="rotate(-10 120 47)" style="fill:var(--o3)"/>`;
  } else if (barres === 'etude-libre') {
    contenu += `<rect x="10" y="26" width="140" height="18" rx="3" style="fill:var(--o2)"/>`
      + `<circle cx="150" cy="35" r="14" style="fill:var(--surface);stroke:var(--encre);stroke-width:4"/>`
      + `<path d="M176 35h60M228 27l8 8-8 8M184 27l-8 8 8 8" style="fill:none;stroke:var(--encre);stroke-width:3"/>`;
  } else if (barres === 'etude-plus') {
    contenu += `<rect x="10" y="26" width="110" height="18" rx="3" style="fill:var(--o2)"/>`;
    for (let k = 0; k < 5; k++) contenu += `<rect x="${122 + k * 22}" y="26" width="20" height="18" rx="2" style="fill:var(--o3)"/>`;
    contenu += `<text x="150" y="18" style="fill:var(--o3);font-size:18px;font-weight:700">＋5</text>`;
  } else if (barres === 'etude-moins') {
    contenu += `<rect x="10" y="26" width="140" height="18" rx="3" style="fill:var(--o2)"/>`;
    for (let k = 0; k < 4; k++) contenu += `<rect x="${152 + k * 22}" y="27" width="19" height="16" rx="2" style="fill:none;stroke:var(--o4);stroke-width:2;stroke-dasharray:4 3"/>`;
    contenu += `<text x="170" y="18" style="fill:var(--o4);font-size:18px;font-weight:700">−4</text>`;
  } else if (barres === 'tehon') {
    contenu += `<rect x="${x0}" y="4" width="${L * 0.66}" height="14" rx="3" style="fill:none;stroke:var(--encre-douce);stroke-width:2.5;stroke-dasharray:6 4"/>`;
    contenu += `<rect x="${x0}" y="27" width="${L * 0.66}" height="12" rx="3" style="fill:var(--o3)"/>`;
    contenu += `<rect x="${x0}" y="47" width="${L * 0.92}" height="12" rx="3" style="fill:var(--o5)"/>`;
  } else {
    const h = barres.length === 3 ? 13 : 18;
    const pas = barres.length === 3 ? 21 : 28;
    const teintes = ['--o2', '--o5', '--o4'];
    barres.forEach((b, i) => {
      contenu += `<rect x="${x0}" y="${6 + i * pas}" width="${L * b}" height="${h}" rx="3" style="fill:var(${teintes[i]})"/>`;
    });
  }
  return `<svg viewBox="0 0 256 64" preserveAspectRatio="xMinYMid meet" aria-hidden="true">${contenu}</svg>`;
}

export function rendreAccueil() {
  // Onglets ながさ / おもさ / かさ (seulement ceux qui ont des activités choisies par les parents).
  const avecActivites = THEMES.filter((th) => ACTIVITES.some((a) => themeDe(a) === th.cle && reglages.activites.includes(a.n)));
  const actif = avecActivites.find((th) => th.cle === reglages.theme) || avecActivites[0] || THEMES[0];
  $('sous-titre').innerHTML = html(actif.sous);
  const nav = $('themes');
  nav.replaceChildren();
  nav.hidden = avecActivites.length < 2;
  avecActivites.forEach((th) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'theme';
    b.setAttribute('aria-pressed', String(th === actif));
    b.innerHTML = `${th.icone}<span>${html(th.titre)}</span>`;
    activable(b, () => {
      if (th === actif) return;
      ecrireReglages({ theme: th.cle });
      rendreAccueil();
      parler(th.titre);
    });
    nav.append(b);
  });
  const zone = $('activites');
  zone.replaceChildren();
  zone.scrollTop = 0;
  const duTheme = ACTIVITES.filter((a) => themeDe(a) === actif.cle);
  const groupes = [
    { titre: ['もんだい'], liste: duTheme.filter((a) => groupeDe(a) === 'probleme') },
    { titre: [K('勉強', 'べんきょう')], liste: duTheme.filter((a) => groupeDe(a) === 'etude') },
    { titre: ['ね、 しっていた？', V('（むかしは…）', '')], liste: duTheme.filter((a) => groupeDe(a) === 'culture') },
  ];
  groupes.forEach((groupe) => {
    const visibles = groupe.liste.filter((a) => reglages.activites.includes(a.n));
    if (!visibles.length) return;
    const titre = document.createElement('h2');
    titre.className = 'groupe-titre';
    titre.innerHTML = html(groupe.titre);
    zone.append(titre);
    visibles.forEach((a) => {
      const carte = document.createElement('button');
      carte.type = 'button';
      carte.className = 'activite';
      carte.dataset.n = String(a.n);
      carte.innerHTML = `<span class="numero">${numeroAffiche(a)}</span>${svgActivite(a.barres)}`
        + `<strong>${html(a.titre)}</strong><span class="sous">${html(a.sous)}</span>`;
      carte.setAttribute('aria-label', `${numeroAffiche(a)}. ${lecture(a.titre)} ${lecture(a.sous)}`);
      activable(carte, () => lancerActivite(a));
      zone.append(carte);
    });
  });
}
