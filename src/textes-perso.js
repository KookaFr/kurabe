/* ======================================================================
   Textes modifiables par les parents ou l'enseignant (les aides et les indices)
   ----------------------------------------------------------------------
   Chaque texte a une clé, un texte d'origine, et peut être remplacé dans l'espace parents,
   ou par un fichier tableur (CSV) exporté, modifié sur un ordinateur, puis réimporté.
   Écriture des textes :
   - 漢字《かんじ》 : un kanji avec sa lecture (affichée en furigana, ou seule en mode hiragana) ;
     ｜大きな《おおきな》 pour donner la lecture d'un groupe entier ;
   - {数} : une partie qui change (un nombre, un nom…), remplacée par l'appli ;
   - 10 g, 200 mL, 3 cm : un nombre et son unité (la voix dit « グラム », la lecture s'affiche au-dessus) ;
   - ● ◇ ◎ ◆ : les pastilles de couleur des かず (● se lit « まる », les autres ne se lisent pas) ;
   - 目《め》もり devient le mot qu'on touche pour l'explication 「目もりって なに？」.
   Tout reste sur l'appareil (localStorage), comme les autres réglages.
   (Ce module n'appelle texte.js qu'au moment de construire un texte : texte.js l'importe aussi.)
   ====================================================================== */

import { K, MEMORI, segU } from './texte.js';

const CLE_STOCKAGE = 'kurabe.textes';

// groupe : où le texte apparaît ; fr / ja : ce qu'il est (pour l'adulte) ; vars : les parties qui changent,
// avec un exemple (pour écouter le texte) ; prefixe : suivi d'un autre texte (une espace est ajoutée).
export const TEXTES_PERSO = [
  // ----- Partout
  { cle: 'seikai', groupe: 'general', prefixe: true, defaut: '正解《せいかい》！', fr: 'Bonne réponse (avant l’explication)', ja: '正解のとき（説明の前）' },
  { cle: 'presque', groupe: 'general', prefixe: true, defaut: 'おしい！', fr: 'Réponse presque juste (avant l’aide)', ja: '惜しいとき（ヒントの前）' },
  { cle: 'encore', groupe: 'general', prefixe: true, defaut: 'もう いっかい！', fr: 'Réponse fausse (avant l’aide)', ja: '間違えたとき（ヒントの前）' },
  { cle: 'daijoubu', groupe: 'general', prefixe: true, defaut: 'だいじょうぶ！', fr: 'Bouton わからない (avant l’aide)', ja: '「わからない」を押したとき（ヒントの前）' },
  { cle: 'voirReponse', groupe: 'general', prefixe: true, defaut: 'こたえを 見《み》て みよう。', fr: 'わからない une 2e fois : on montre la réponse', ja: '2回目の「わからない」：答えを見せる前' },
  { cle: 'otsukare', groupe: 'general', defaut: 'おつかれさま！', fr: 'Fin d’une série (titre)', ja: '終わり（見出し）' },
  { cle: 'finSerie', groupe: 'general', defaut: '{数}問《もん》 できたよ。', vars: { 数: 6 }, fr: 'Fin d’une série de questions', ja: '問題の終わり' },
  { cle: 'finLecon', groupe: 'general', defaut: 'さいごまで できたね！', fr: 'Fin d’une leçon べんきょう', ja: 'べんきょうの終わり' },

  // ----- かず
  { cle: 'kazu.compter', groupe: 'kazu', defaut: 'おしい！ ひとつずつ、 ゆびで さしながら かぞえよう。', fr: 'いくつ？ : erreur de comptage', ja: '「いくつ？」数え間違い' },
  { cle: 'kazu.lireVoix', groupe: 'kazu', defaut: 'おしい！ こえを よく きいてね。', fr: 'よみかた : choisir le nombre entendu', ja: '「よみかた」聞いた数を選ぶ' },
  { cle: 'kazu.lirePetit', groupe: 'kazu', defaut: 'おしい！ ●を かぞえて みよう。', fr: 'よみかた : nombre jusqu’à 10', ja: '「よみかた」10まで' },
  { cle: 'kazu.lireGrand', groupe: 'kazu', defaut: 'おしい！ ◇10の まとまりと ●を よく 見《み》てね。', fr: 'よみかた : nombre plus grand que 10', ja: '「よみかた」10より大きい数' },
  { cle: 'kazu.baraErreur', groupe: 'kazu', defaut: 'おしい！ ◎ばらを ゆびで さしながら かぞえよう。', fr: '10の まとまり : les ばら sont fausses', ja: '「10の まとまり」ばらの間違い' },
  { cle: 'kazu.dixErreur', groupe: 'kazu', defaut: 'おしい！ ◇10の まとまりを さきに かぞえよう。', fr: '10の まとまり : les dizaines sont fausses', ja: '「10の まとまり」10の間違い' },
  { cle: 'kazu.aideBara', groupe: 'kazu', defaut: '◇10の まとまりは あって いるよ。 {数}。 こんどは ◎ばらを ひとつずつ かぞえよう。', vars: { 数: 30 }, fr: '10の まとまり : aide quand les dizaines sont justes', ja: '「10の まとまり」10はあっている時のヒント' },
  { cle: 'kazu.aideDix', groupe: 'kazu', defaut: '◎ばらは あって いるよ。 ◇10の まとまりを 10ずつ かぞえよう： {かぞえる}。', vars: { かぞえる: 'じゅう、 にじゅう、 さんじゅう' }, fr: '10の まとまり : aide quand les ばら sont justes', ja: '「10の まとまり」ばらはあっている時のヒント' },
  { cle: 'kazu.comparer', groupe: 'kazu', defaut: 'おしい！ ◇10の まとまりの かずを くらべよう。', fr: 'どっちが 大きい？ : erreur', ja: '「どっちが 大きい？」間違い' },
  { cle: 'son.autre', groupe: 'kazu', defaut: 'おしい！ 「{よみ}」は {かず}の とき。 ここは {数}だよ。', vars: { よみ: 'よんほん', かず: 4, 数: 3 }, fr: 'かぞえかた : lecture d’un autre nombre', ja: '「かぞえかた」別の数の読み方を選んだ' },
  { cle: 'son.pareil', groupe: 'kazu', defaut: 'おしい！ {数}の ときは おとが かわらないよ。 「{よみかた}」と 「{助数詞}」で 「{こたえ}」。', vars: { 数: 2, よみかた: 'に', 助数詞: 'ほん', こたえ: 'にほん' }, fr: 'かぞえかた : le son ne change pas', ja: '「かぞえかた」音が変わらない数' },
  { cle: 'son.change', groupe: 'kazu', defaut: 'おしい！ {数}の ときは おとが かわるよ。 {かわる} かわって 「{こたえ}」。 おぼえよう。', vars: { 数: 6, かわる: '「ろく」が 「ろっ」に、 「ほん」が 「ぽん」に', こたえ: 'ろっぽん' }, fr: 'かぞえかた : le son change (à retenir)', ja: '「かぞえかた」音が変わる数（覚える）' },
  { cle: 'son.nin12', groupe: 'kazu', defaut: 'おしい！ ひとは 1で 「ひとり」、 2で 「ふたり」。 とくべつな いいかた だよ。 おぼえよう。', fr: 'かぞえかた : ひとり, ふたり', ja: '「かぞえかた」ひとり・ふたり' },
  { cle: 'son.nin4', groupe: 'kazu', defaut: 'おしい！ 4の ときは 「よん」では なくて 「よ」： 「よにん」。 おぼえよう。', fr: 'かぞえかた : よにん', ja: '「かぞえかた」よにん' },

  // ----- ながさ
  { cle: 'nagasa.oshii', groupe: 'nagasa', defaut: 'おしい！ はしを よく 見《み》てね。', fr: 'Erreur (objets alignés)', ja: '間違い（そろっている物）' },
  { cle: 'nagasa.tehon', groupe: 'nagasa', defaut: 'おしい！ 手本《てほん》の はしと くらべてね。', fr: '手本と 同じ : erreur', ja: '「手本と 同じ」間違い' },
  { cle: 'nagasa.soroe', groupe: 'nagasa', defaut: 'おしい！ はしを そろえて 見《み》よう。', fr: 'ずれている, ななめ : erreur', ja: '「ずれている」「ななめ」間違い' },
  { cle: 'nagasa.barres', groupe: 'nagasa', defaut: 'ぼうで くらべて 見《み》よう。', fr: 'cm で くらべる : aide (barres)', ja: '「cm で くらべる」ヒント（ぼう）' },
  { cle: 'nagasa.soroeta', groupe: 'nagasa', defaut: 'はしを そろえたよ。', fr: 'Bouton そろえる', ja: '「そろえる」ボタン' },
  { cle: 'regle.nagasa.long', groupe: 'nagasa', defaut: '長《なが》い ＝ 数字《すうじ》が 大《おお》きい', fr: 'Règle rappelée : le plus long', ja: 'きまり：長い' },
  { cle: 'regle.nagasa.court', groupe: 'nagasa', defaut: '短《みじか》い ＝ 数字《すうじ》が 小《ちい》さい', fr: 'Règle rappelée : le plus court', ja: 'きまり：短い' },

  // ----- おもさ・かさ
  { cle: 'mv.devine', groupe: 'mv', defaut: 'そう おもうよね。 はかりで たしかめよう。', fr: '見た目と ちがう : après la devinette', ja: '「見た目と ちがう」予想のあと' },
  { cle: 'mv.hakari', groupe: 'mv', defaut: 'おしい！ はりを よく 見《み》てね。', fr: 'はかり à aiguille : erreur', ja: '針のはかり：間違い' },
  { cle: 'mv.hakariNum', groupe: 'mv', defaut: 'おしい！ はかりの 数字《すうじ》を よく 見《み》てね。', fr: 'はかり numérique : erreur', ja: 'デジタルのはかり：間違い' },
  { cle: 'mv.verres', groupe: 'mv', defaut: 'おしい！ たかさを よく 見《み》てね。', fr: 'Verres identiques : erreur', ja: '同じコップ：間違い' },
  { cle: 'mv.transvaser', groupe: 'mv', defaut: 'おしい！ {どこ} うつして くらべよう。 うつしても かさは かわらないよ。', vars: { どこ: 'おなじ なべに' }, fr: 'うつして くらべよう : erreur', ja: '「うつして くらべよう」間違い' },
  { cle: 'mv.aidePoids', groupe: 'mv', defaut: 'はかりで くらべて 見《み》よう。', fr: 'g で くらべる : aide', ja: '「g で くらべる」ヒント' },
  { cle: 'mv.aideLiquide', groupe: 'mv', defaut: 'カップで くらべて 見《み》よう。', fr: 'mL で くらべる : aide', ja: '「mL で くらべる」ヒント' },
  { cle: 'lecture.grands', groupe: 'mv', defaut: 'おしい！ はりの さきを よく 見《み》てね。 まず 大《おお》きい 目《め》もりを 見《み》よう。 はりの すぐ まえの 大《おお》きい 目《め》もりは いくつ？', fr: 'はかりを よもう : les centaines sont fausses', ja: '「はかりを よもう」100の位の間違い' },
  { cle: 'lecture.juste', groupe: 'mv', defaut: 'おしい！ はりは ちょうど 大《おお》きい 目《め》もりの {数}を さして いるよ。', vars: { 数: 300 }, fr: 'はかりを よもう : l’aiguille est sur un grand trait', ja: '「はかりを よもう」針が大きい目もりの上' },
  { cle: 'lecture.petits', groupe: 'mv', defaut: 'おしい！ {数}は あって いるよ。 そこから ちいさい 目《め》もりを ひとつずつ かぞえよう。 1つで 10 g。', vars: { 数: 200 }, fr: 'はかりを よもう : les dizaines sont fausses', ja: '「はかりを よもう」10の位の間違い' },
  { cle: 'lecture.petitsZero', groupe: 'mv', defaut: 'おしい！ ちいさい 目《め》もりを 0から ひとつずつ かぞえよう。 1つで 10 g。', fr: 'はかりを よもう : moins de 100 g', ja: '「はかりを よもう」100 gより少ない' },
  { cle: 'regle.omosa.plus', groupe: 'mv', defaut: '重《おも》い ＝ 数字《すうじ》が 大《おお》きい', fr: 'Règle rappelée : le plus lourd', ja: 'きまり：重い' },
  { cle: 'regle.omosa.moins', groupe: 'mv', defaut: '軽《かる》い ＝ 数字《すうじ》が 小《ちい》さい', fr: 'Règle rappelée : le plus léger', ja: 'きまり：軽い' },
  { cle: 'regle.kasa.plus', groupe: 'mv', defaut: '多《おお》い ＝ 数字《すうじ》が 大《おお》きい', fr: 'Règle rappelée : le plus de liquide', ja: 'きまり：多い' },
  { cle: 'regle.kasa.moins', groupe: 'mv', defaut: '少《すく》ない ＝ 数字《すうじ》が 小《ちい》さい', fr: 'Règle rappelée : le moins de liquide', ja: 'きまり：少ない' },
];
export const GROUPES_TEXTES = ['general', 'kazu', 'nagasa', 'mv'];
const PAR_CLE = Object.fromEntries(TEXTES_PERSO.map((d) => [d.cle, d]));

/* ----- Stockage ----- */

function lireStockage() {
  try { return JSON.parse(localStorage.getItem(CLE_STOCKAGE)) || {}; } catch { return {}; }
}
let perso = lireStockage();
function ecrireStockage() {
  try { localStorage.setItem(CLE_STOCKAGE, JSON.stringify(perso)); } catch { /* stockage indisponible */ }
}
export const textePerso = (cle) => perso[cle] ?? null;
export const texteActuel = (cle) => perso[cle] ?? PAR_CLE[cle]?.defaut ?? '';
export const nbTextesPerso = () => Object.keys(perso).filter((c) => PAR_CLE[c]).length;
// Un texte vide, ou identique à l'original, revient à l'original.
export function definirTextePerso(cle, texte) {
  if (!PAR_CLE[cle]) return;
  const t = (texte ?? '').replace(/\r\n?/g, '\n').trim();
  if (!t || t === PAR_CLE[cle].defaut) delete perso[cle];
  else perso[cle] = t;
  ecrireStockage();
}
export function toutRetablir() {
  perso = {};
  ecrireStockage();
}

/* ----- Du texte écrit par l'adulte aux segments de l'appli ----- */

const UNITES = { kg: 'kg', mL: 'ml', cm: 'cm', g: 'g', L: 'l', m: 'm' };
const MOTIF = /\{([^}]+)\}|｜([^《｜]+)《([^》]+)》|([\u3400-\u9FFF々〆]+)《([^》]+)》|(\d+(?:\.\d+)?)[ \u00a0]?(kg|mL|cm|g|L|m)(?![A-Za-z])/g;

export function analyserTexte(texte, vars = {}) {
  const segs = [];
  const ajouter = (v) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) v.forEach(ajouter);
    else if (typeof v === 'number') segs.push(String(v));
    else segs.push(v);
  };
  let fin = 0;
  for (const m of String(texte).matchAll(MOTIF)) {
    ajouter(texte.slice(fin, m.index));
    fin = m.index + m[0].length;
    if (m[1] !== undefined) ajouter(m[1] in vars ? vars[m[1]] : m[0]);
    else if (m[2] !== undefined) ajouter(K(m[2], m[3]));
    else if (m[4] !== undefined) ajouter(K(m[4], m[5]));
    else ajouter(segU(m[6], UNITES[m[7]]));
  }
  ajouter(texte.slice(fin));
  // 目《め》もり : le mot qu'on touche pour l'explication 「目もりって なに？」.
  for (let i = 0; i < segs.length - 1; i++) {
    const s = segs[i];
    const suite = segs[i + 1];
    if (s && s.k === '目' && s.y === 'め' && typeof suite === 'string' && suite.startsWith('もり')) {
      segs.splice(i, 2, MEMORI, ...(suite.length > 2 ? [suite.slice(2)] : []));
    }
  }
  return segs;
}

// Le texte (modifié, ou d'origine) d'une clé, prêt à afficher et à dire.
export function tp(cle, vars = {}) {
  const d = PAR_CLE[cle];
  if (!d) return [cle];
  const segs = analyserTexte(texteActuel(cle), vars);
  if (d.prefixe) {
    const dernier = segs[segs.length - 1];
    if (typeof dernier !== 'string' || !/\s$/.test(dernier)) segs.push(' ');
  }
  return segs;
}
// Pour écouter un texte dans l'espace parents : avec les exemples de ses variables.
export const exempleTexte = (cle, texte) => analyserTexte(texte ?? texteActuel(cle), PAR_CLE[cle]?.vars || {});
export const variablesDe = (cle) => Object.keys(PAR_CLE[cle]?.vars || {});

/* ----- Fichier tableur (CSV) : exporter, modifier sur un ordinateur, réimporter ----- */

const ENTETES = ['キー', '場所', '説明', '元の文', '新しい文'];
const champ = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
export function exporterCSV(langue) {
  const lignes = [ENTETES.map(champ).join(',')];
  TEXTES_PERSO.forEach((d) => {
    lignes.push([d.cle, d.groupe, langue === 'ja' ? d.ja : d.fr, d.defaut, perso[d.cle] ?? ''].map(champ).join(','));
  });
  // BOM : Excel reconnaît alors l'UTF-8 (sinon les kana s'affichent mal).
  return `\uFEFF${lignes.join('\r\n')}\r\n`;
}

// Un lecteur CSV simple : guillemets, virgules et retours à la ligne dans les champs ; « ; » ou tabulation aussi.
function lireCSV(texte) {
  const t = texte.replace(/^\uFEFF/, '');
  const premiere = t.split(/\r?\n/, 1)[0] || '';
  const sep = [',', ';', '\t'].map((c) => [c, premiere.split(c).length]).sort((a, b) => b[1] - a[1])[0][0];
  const lignes = [];
  let ligne = [];
  let val = '';
  let guillemets = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (guillemets) {
      if (c === '"' && t[i + 1] === '"') { val += '"'; i++; } else if (c === '"') guillemets = false; else val += c;
    } else if (c === '"') guillemets = true;
    else if (c === sep) { ligne.push(val); val = ''; } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      ligne.push(val); lignes.push(ligne); ligne = []; val = '';
    } else val += c;
  }
  if (val || ligne.length) { ligne.push(val); lignes.push(ligne); }
  return lignes.filter((l) => l.some((x) => x.trim()));
}

// Réimporter : la colonne 新しい文 remplace le texte (vide : on revient à l'original). Rend le nombre de textes lus.
export function importerCSV(texte) {
  const lignes = lireCSV(String(texte || '').replace(/^\uFEFF/, ''));
  if (!lignes.length) return { lus: 0, inconnus: 0 };
  const entete = lignes[0].map((x) => x.trim());
  // Sans les deux colonnes attendues (fichier mal encodé ou autre tableau), on n'importe rien :
  // deviner la colonne enregistrait du charabia avec un message de succès.
  if (!entete.includes('キー') || !entete.includes('新しい文')) return { lus: 0, inconnus: lignes.length };
  const iCle = entete.indexOf('キー');
  const iNouveau = entete.indexOf('新しい文');
  let lus = 0;
  let inconnus = 0;
  lignes.slice(entete.includes('キー') ? 1 : 0).forEach((l) => {
    const cle = (l[iCle] || '').trim();
    if (!PAR_CLE[cle]) { inconnus += 1; return; }
    // Un texte d'aide reste court (300 caractères) et sans caractère de remplacement (fichier abîmé).
    const nouveau = (l[iNouveau] || '').replace(/\r\n?/g, '\n').trim().slice(0, 300);
    if (nouveau.includes('\uFFFD')) { inconnus += 1; return; }
    if (nouveau) perso[cle] = nouveau; else delete perso[cle];
    if (nouveau === PAR_CLE[cle].defaut) delete perso[cle];
    lus += 1;
  });
  ecrireStockage();
  return { lus, inconnus };
}
