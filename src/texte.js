/* ======================================================================
   Textes japonais : kanji avec furigana, ou hiragana seuls
   Un texte est une liste de segments : 'texte' ou K('漢字', 'よみ').
   ====================================================================== */

import { echapper } from './outils.js';
import { reglages } from './reglages.js';

export const K = (k, y) => ({ k, y });
// Valeur avec unité : affichée « 10 cm », lue « 10センチ ».
export const V = (d, s) => ({ d, s });

// Symbole d'unité, avec sa lecture en petit au-dessus (comme des furigana) : g → グラム.
const LECTURES_UNITES = { g: 'グラム', kg: 'キログラム', ml: 'ミリリットル', l: 'リットル', cm: 'センチ', m: 'メートル' };
const SYMBOLES_UNITES = { g: 'g', kg: 'kg', ml: 'mL', l: 'L', cm: 'cm', m: 'm' };
export function uniteHtml(u) {
  const sym = SYMBOLES_UNITES[u] || u;
  if (reglages.lireUnites === false || !LECTURES_UNITES[u]) return echapper(sym);
  // Sans espace dans la balise : htmlMots() coupe le texte aux espaces.
  return `<ruby>${echapper(sym)}<rt>${LECTURES_UNITES[u]}</rt></ruby>`;
}
export const nombreUnite = (x, u) => `${echapper(String(x))}\u00a0${uniteHtml(u)}`;

// « ● » dans les textes : de la même couleur que les jetons dessinés (balise sans espace : voir htmlMots).
// ◆ ◇ ◎ : des pastilles muettes devant un groupe, dans sa couleur (100 violet, 10 bleu clair, ばら orange).
// Balises sans espace (htmlMots coupe aux espaces).
const pionsColores = (t) => t.replace(/●/g, '<mark>●</mark>').replace(/◆/g, '<pc>●</pc>').replace(/◇/g, '<pd>●</pd>').replace(/◎/g, '<pu>●</pu>');
export function html(segments) {
  return segments.map((s) => {
    if (typeof s === 'string' || typeof s === 'number') return pionsColores(echapper(s));
    // Mot qu'on peut toucher pour une explication (<aide-memori>, sans espace : voir htmlMots).
    if (s.mot) return `<aide-${s.mot}>${html(s.segs)}</aide-${s.mot}>`;
    if (s.u) return nombreUnite(s.x, s.u);
    if (s.d !== undefined) return echapper(s.d);
    if (reglages.ecriture === 'kanji' && s.k) return `<ruby>${echapper(s.k)}<rt>${echapper(s.y)}</rt></ruby>`;
    return echapper(s.y);
  }).join('');
}

// Comme html(), mais chaque groupe de mots (séparé par une espace) reste sur une seule ligne.
// Chaque phrase (jusqu'à 。！？) est aussi regroupée : on peut la toucher pour l'entendre seule.
export function htmlMots(segments) {
  const phrases = [];
  let phrase = [];
  const fermer = () => {
    if (phrase.length) phrases.push(`<span class="phrase-lue">${phrase.join(' ')}</span>`);
    phrase = [];
  };
  html(segments).split(' ').filter(Boolean).forEach((m) => {
    phrase.push(`<span class="mot">${m}</span>`);
    if (/[。！？!?]$/.test(m.replace(/<[^>]+>/g, ''))) fermer();
  });
  fermer();
  return phrases.join(' ');
}

// Ce que dit la voix : les unités et les signes en mots (cm → センチ, ＝ → は), « ● » → « まる »,
// et les pastilles de couleur (◆◇◎) ne se disent pas. Même règle que pour le texte touché (versParole).
export function lecture(segments) {
  return versParole(segments.map((s) => (typeof s === 'object' ? (s.s ?? s.y) : String(s))).join('').replace(/[◆◇◎]/g, ''));
}

export const NAGA = K('長', 'なが');
export const MIJIKA = K('短', 'みじか');
export const ICHIBAN = K('一番', 'いちばん');
export const TEHON = K('手本', 'てほん');
export const ONAJI = K('同', 'おな');
export const ME = K('目', 'め');   // 目もり (graduations), écrit comme dans les manuels
// 目もり qu'on peut toucher : ouvre l'explication illustrée 「目もりって なに？」 (explications.js).
// Seulement dans les consignes et les explications, jamais dans un bouton.
export const MEMORI = { mot: 'memori', segs: [ME, 'もり'], s: 'めもり', y: 'めもり' };

// Ce qu'on compare, c'est le nombre écrit (sur la règle, la はかり, l'étiquette) : 「すうじ」.
// (「かず」 évoque d'abord le nombre d'objets qu'on compte.)
export const SUJI = K('数字', 'すうじ');
export const OOKI = K('大', 'おお');    // 大きい
export const CHIISA = K('小', 'ちい');  // 小さい
export const OMO = K('重', 'おも');     // 重い
export const KARU = K('軽', 'かる');    // 軽い
export const OO_I = K('多', 'おお');    // 多い
export const SUKU = K('少', 'すく');    // 少ない
export const SAGA = K('下', 'さ');      // 下がった
export const AGA = K('上', 'あ');       // 上がった
export const MI = K('見', 'み');

// « plus » : 重い / 多い ; « moins » : 軽い / 少ない.
export const MOTS = {
  omosa: { plus: [OMO, 'い'], moins: [KARU, 'い'] },
  kasa: { plus: [OO_I, 'い'], moins: [SUKU, 'ない'] },
};

export const nomDe = (o) => (o.kanji ? K(o.kanji, o.yomi) : o.yomi);

export const PHRASES = {
  dotchiNagai: ['どっちが ', NAGA, 'い？'],
  dotchiMijikai: ['どっちが ', MIJIKA, 'い？'],
  ichibanNagai: [ICHIBAN, ' ', NAGA, 'いのは どれ？'],
  ichibanMijikai: [ICHIBAN, ' ', MIJIKA, 'いのは どれ？'],
  tehon: [TEHON, 'と ', ONAJI, 'じ ', NAGA, 'さは どれ？'],
  nagaiMijikai: [NAGA, 'い？ ', MIJIKA, 'い？'],
  seikai: [K('正解', 'せいかい'), '！ '],
  oshii: ['おしい！ はしを よく ', K('見', 'み'), 'てね。'],
  oshiiTehon: ['おしい！ ', TEHON, 'の はしと くらべてね。'],
  oshiiSoroe: ['おしい！ はしを そろえて ', K('見', 'み'), 'よう。'],
  barres: ['ぼうで くらべて ', K('見', 'み'), 'よう。'],
  soroeta: ['はしを そろえたよ。'],
  otsukare: ['おつかれさま！'],
};

// Nombre + unité : affiché « 10 g » (avec グラム en petit au-dessus), lu « 10グラム ».

const segUnite = (x, u) => ({ x, u, d: `${x}\u00a0${SYMBOLES_UNITES[u]}`, s: `${x}${LECTURES_UNITES[u]}` });
export const segValeur = (v) => (v.u ? segUnite(v.x, v.u) : V(v.affichage, v.lecture));
export const cmTexte = (x) => String(Math.round(x * 10) / 10);
export const segCm = (x) => segUnite(cmTexte(x), 'cm');

export const segU = (x, u) => segUnite(x, u);

/* ----- Lire ce qu'on touche (pour qui ne lit pas) -----
   - Toucher une phrase (consigne, explication, rappel, égalité, nom d'un objet) : elle est lue seule.
   - Bouton 👆 (mode « よむ ») : toucher un bouton le lit au lieu de l'activer ; on le retouche pour revenir. */

// Le texte à dire pour un élément : les furigana et les lectures d'unités (グラム) plutôt que les
// symboles, et les signes des égalités en mots (＋ → たす, ＝ → は, → → で).
export function texteParle(el) {
  const copie = el.cloneNode(true);
  // D'abord les furigana (la voix lit la lecture, pas le kanji), puis le décor caché.
  copie.querySelectorAll('ruby').forEach((r) => {
    const rt = r.querySelector('rt');
    r.replaceWith(rt ? rt.textContent : r.textContent);
  });
  copie.querySelectorAll('svg, [aria-hidden="true"], .numero, pc, pd, pu').forEach((x) => x.remove());
  copie.querySelectorAll('.inconnu').forEach((x) => { x.textContent = ' いくつ '; });
  return versParole(copie.textContent);
}

// « N こ » quand la lecture change (1, 6, 8, 10, 20…) ; sinon null (la voix lit bien にこ, さんこ).
function lectureKo(n) {
  if (!(n > 0 && n < 100)) return null;
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (u === 0) return `${YOMI_DIX[d].replace(/じゅう$/, 'じゅっ')}こ`;
  const sokuon = { 1: 'いっ', 6: 'ろっ', 8: 'はっ' }[u];
  return sokuon ? `${YOMI_DIX[d]}${sokuon}こ` : null;
}

// Les symboles en mots : 100 g → 100グラム, « m と cm » → メートルと センチ, ＋ → たす…
export function versParole(texte) {
  const unites = { g: 'グラム', kg: 'キログラム', mL: 'ミリリットル', L: 'リットル', cm: 'センチ', m: 'メートル' };
  return String(texte)
    .replace(/(\d)\s*(kg|mL|cm|g|L|m)(?![a-zA-Z])/g, (_, d, u) => `${d}${unites[u]}`)
    .replace(/(^|[^a-zA-Z\d])(kg|mL|cm|g|L|m)(?![a-zA-Z])/g, (_, a, u) => `${a}${unites[u]}`)
    .replace(/＋/g, ' たす ')
    .replace(/−/g, ' ひく ')
    .replace(/×/g, ' かける ')
    // « 2 は 200 » : la voix avalait le は ; collé au nombre et suivi d'une pause, il s'entend (かける 2は、 200)。
    .replace(/\s*＝\s*/g, 'は、 ')
    // 1こ → いっこ (la voix disait « いちこ »), 6こ → ろっこ, 8こ → はっこ, 10こ → じゅっこ.
    .replace(/(\d+)\s*こ/g, (m, n) => lectureKo(Number(n)) || m)
    .replace(/→/g, ' で ')
    .replace(/●/g, 'まる')
    .replace(/\s+/g, ' ')
    .trim();
}

// Les lecteurs d'écran (VoiceOver, TalkBack) ne lisent que le kanji, pas « 長いながい » : les furigana
// sont cachés à l'accessibilité une fois dans la page (la balise <rt> reste sans attribut : htmlMots coupe aux espaces).
const cacherFurigana = (racine) => racine.querySelectorAll('rt:not([aria-hidden])').forEach((rt) => rt.setAttribute('aria-hidden', 'true'));
new MutationObserver((mutations) => {
  mutations.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) cacherFurigana(n); }));
}).observe(document.body, { childList: true, subtree: true });

/* ----- Les nombres : leur lecture en hiragana, les compteurs (助数詞) ----- */

export const YOMI_UN = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
export const YOMI_DIX = ['', 'じゅう', 'にじゅう', 'さんじゅう', 'よんじゅう', 'ごじゅう', 'ろくじゅう', 'ななじゅう', 'はちじゅう', 'きゅうじゅう'];
const YOMI_CENT = ['', 'ひゃく', 'にひゃく', 'さんびゃく', 'よんひゃく', 'ごひゃく', 'ろっぴゃく', 'ななひゃく', 'はっぴゃく', 'きゅうひゃく'];
const YOMI_MILLE = ['', 'せん', 'にせん', 'さんぜん', 'よんせん', 'ごせん', 'ろくせん', 'ななせん', 'はっせん', 'きゅうせん'];
// Autres lectures qu'on entend aussi : 4 し, 7 しち, 9 く.
export const AUTRES_YOMI = { 4: 'し', 7: 'しち', 9: 'く' };

// La lecture en hiragana : 23 → にじゅうさん, 235 → にひゃく さんじゅう ご, 1000 → せん.
export function yomiNombre(n) {
  if (n === 0) return 'ぜろ';
  const parties = [YOMI_MILLE[Math.floor(n / 1000) % 10], YOMI_CENT[Math.floor(n / 100) % 10],
    YOMI_DIX[Math.floor(n / 10) % 10], YOMI_UN[n % 10]].filter(Boolean);
  return parties.join(n >= 100 ? ' ' : '');
}

// Un nombre en chiffres, avec sa lecture en hiragana dessous.
// Chaque chiffre souligné de la couleur de son groupe : centaines en violet (100の いた), dizaines en
// bleu clair (10の まとまり), unités en orange (●), milliers en vert. Un indice pour lire et écrire les nombres.
const PLACES = ['u', 'd', 'c', 'm'];
export const chiffresColores = (n) => {
  const t = String(n);
  return [...t].map((ch, i) => `<span class="place place-${PLACES[t.length - 1 - i] || 'm'}">${ch}</span>`).join('');
};
export const nombreYomi = (n, places = false) => `<span class="nb"><span class="nb-chiffre">${places ? chiffresColores(n) : n}</span><span class="nb-yomi">${yomiNombre(n)}</span></span>`;

/* ----- Les compteurs (助数詞) : en japonais, on ne compte pas tout avec 「いくつ」.
   Une chose se compte avec son compteur, et la question change avec lui (いぬは なんびき？).
   La lecture change aussi avec le nombre : いっぽん、 にほん、 さんぼん、 ろっぽん… ----- */
export const COMPTEURS = {
  'こ': {
    question: 'なんこ', variantes: ['こ', 'ご'], change: [1, 6, 8, 10],
    yomi: ['いっこ', 'にこ', 'さんこ', 'よんこ', 'ごこ', 'ろっこ', 'ななこ', 'はっこ', 'きゅうこ', 'じゅっこ'],
    regle: 'ちいさい ものは 「こ」で かぞえる。 りんごや ボール。', court: 'ちいさい もの ＝ こ', indice: 'ちいさい ものは 「こ」',
  },
  'ひき': {
    question: 'なんびき', variantes: ['ひき', 'びき', 'ぴき'], change: [1, 3, 6, 8, 10],
    yomi: ['いっぴき', 'にひき', 'さんびき', 'よんひき', 'ごひき', 'ろっぴき', 'ななひき', 'はっぴき', 'きゅうひき', 'じゅっぴき'],
    regle: 'ちいさい いきものは 「ひき」で かぞえる。 いぬや ねこ、 さかな。', court: 'いきもの ＝ ひき', indice: 'いきものは 「ひき」',
  },
  'ほん': {
    question: 'なんぼん', variantes: ['ほん', 'ぼん', 'ぽん'], change: [1, 3, 6, 8, 10],
    yomi: ['いっぽん', 'にほん', 'さんぼん', 'よんほん', 'ごほん', 'ろっぽん', 'ななほん', 'はっぽん', 'きゅうほん', 'じゅっぽん'],
    regle: 'ほそながい ものは 「ほん」で かぞえる。 えんぴつや かさ。', court: 'ほそながい もの ＝ ほん', indice: 'ほそながい ものは 「ほん」',
  },
  'まい': {
    question: 'なんまい', variantes: ['まい'], change: [],
    yomi: ['いちまい', 'にまい', 'さんまい', 'よんまい', 'ごまい', 'ろくまい', 'ななまい', 'はちまい', 'きゅうまい', 'じゅうまい'],
    regle: 'うすくて たいらな ものは 「まい」で かぞえる。 かみや おさら。', court: 'うすい もの ＝ まい', indice: 'うすい ものは 「まい」',
  },
  'だい': {
    question: 'なんだい', variantes: ['だい'], change: [],
    yomi: ['いちだい', 'にだい', 'さんだい', 'よんだい', 'ごだい', 'ろくだい', 'ななだい', 'はちだい', 'きゅうだい', 'じゅうだい'],
    regle: 'のりものや きかいは 「だい」で かぞえる。 くるまや じてんしゃ。', court: 'のりもの ＝ だい', indice: 'のりものは 「だい」',
  },
  'にん': {
    question: 'なんにん', variantes: ['にん'], change: [1, 2, 4],
    yomi: ['ひとり', 'ふたり', 'さんにん', 'よにん', 'ごにん', 'ろくにん', 'ななにん', 'はちにん', 'きゅうにん', 'じゅうにん'],
    regle: 'ひとは 「にん」で かぞえる。 でも 1は ひとり、 2は ふたり。', court: 'ひと ＝ にん（ひとり、 ふたり）', indice: 'ひとは 「にん」',
  },
  'さつ': {
    question: 'なんさつ', variantes: ['さつ'], change: [1, 8, 10],
    yomi: ['いっさつ', 'にさつ', 'さんさつ', 'よんさつ', 'ごさつ', 'ろくさつ', 'ななさつ', 'はっさつ', 'きゅうさつ', 'じゅっさつ'],
    regle: 'ほんや ノートは 「さつ」で かぞえる。', court: 'ほん・ノート ＝ さつ', indice: 'ほんや ノートは 「さつ」',
  },
};
export const TOUS_COMPTEURS = Object.keys(COMPTEURS);
// Les sons qui changent, à dire en exemple : いっぽん、 さんぼん、 ろっぽん、 はっぽん、 じゅっぽん。
export const sonsQuiChangent = (c) => COMPTEURS[c].change.map((k) => COMPTEURS[c].yomi[k - 1]).join('、 ');
// 3 + ほん → { d: '3ぼん' (écrit comme on le dit), y: 'さんぼん' } ; 1 + にん → ひとり.
export function compteur(n, c) {
  const y = COMPTEURS[c].yomi[n - 1];
  if (c === 'にん' && n <= 2) return { d: y, y, n: '', s: y };
  const s = [...COMPTEURS[c].variantes].sort((a, b) => b.length - a.length).find((v) => y.endsWith(v)) || c;
  return { d: `${n}${s}`, y, n: String(n), s };
}
export const htmlCompteur = (n, c) => {
  const k = compteur(n, c);
  return k.n
    ? `<span class="nb"><span class="nb-chiffre">${k.n}<small class="suffixe">${k.s}</small></span><span class="nb-yomi">${k.y}</span></span>`
    : `<span class="nb"><span class="nb-chiffre">${k.y}</span></span>`;
};
// Ce qu'on écrit et dit : « 3びき（さんびき） », la voix dit seulement « さんびき ».
export const segCompteur = (n, c) => {
  const k = compteur(n, c);
  return V(k.n ? `${k.d}（${k.y}）` : k.y, k.y);
};
// Les compteurs choisis par les parents (au moins 「こ」).
export const compteursActifs = () => {
  const l = (reglages.compteurs || []).filter((c) => COMPTEURS[c]);
  return l.length ? l : ['こ'];
};

// Un nombre écrit mais pas dit, quand sa lecture suit juste après : sinon la voix dit « じゅうさん。 じゅうさん ».
export const ecrit = (texte) => V(texte, '');
