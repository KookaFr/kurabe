/* ======================================================================
   かず : compter et lire les nombres, toujours avec leur lecture en hiragana
   (programme « 数の学習 » : compter, associer chiffre et quantité, grouper par 10, les rangs).
   ====================================================================== */

import { $, aleatoire, choisir, entier, melanger } from '../outils.js';
import { cible } from './mv.js';
import { reglages } from '../reglages.js';
import {
  AUTRES_YOMI, chiffresColores, CHIISA, compteur, COMPTEURS, compteursActifs, ecrit, htmlCompteur, MI, nombreYomi,
  ONAJI, OO_I, OOKI, segCompteur, sonsQuiChangent, SUJI, TOUS_COMPTEURS, V, YOMI_DIX, YOMI_UN, yomiNombre,
} from '../texte.js';

// Des choses à compter (emoji), leur nom et leur compteur.
export const A_COMPTER = [
  ['りんご', '🍎', 'こ'], ['いちご', '🍓', 'こ'], ['みかん', '🍊', 'こ'], ['ボール', '⚽', 'こ'], ['たまご', '🥚', 'こ'], ['ふうせん', '🎈', 'こ'], ['ほし', '⭐', 'こ'],
  ['いぬ', '🐶', 'ひき'], ['ねこ', '🐱', 'ひき'], ['さかな', '🐟', 'ひき'], ['かえる', '🐸', 'ひき'],
  ['えんぴつ', '✏️', 'ほん'], ['かさ', '🌂', 'ほん'], ['バナナ', '🍌', 'ほん'], ['にんじん', '🥕', 'ほん'], ['はな', '🌷', 'ほん'],
  ['かみ', '📄', 'まい'], ['おさら', '🍽️', 'まい'], ['シャツ', '👕', 'まい'], ['クッキー', '🍪', 'まい'],
  ['くるま', '🚗', 'だい'], ['バス', '🚌', 'だい'], ['じてんしゃ', '🚲', 'だい'],
  ['こども', '🧒', 'にん'],
  ['ほん', '📕', 'さつ'], ['ノート', '📓', 'さつ'],
];
const choseDuCompteur = (c) => choisir(A_COMPTER.filter((x) => x[2] === c));

// Trois réponses : la bonne, et deux nombres proches ou faciles à confondre (13 / 31).
function choixNombres(n, min, max, pieges = []) {
  const autres = new Set();
  melanger([...pieges, n + 1, n - 1, n + 2, n - 2, n + 10, n - 10]).forEach((x) => {
    if (autres.size < 2 && x !== n && x >= min && x <= max) autres.add(x);
  });
  while (autres.size < 2) {
    const x = entier(min, max);
    if (x !== n) autres.add(x);
  }
  return melanger([n, ...autres]);
}
const inverse = (n) => (n >= 10 && n < 100 && n % 10 ? (n % 10) * 10 + Math.floor(n / 10) : null);

export function genererQuestionKazu(niveau, derniere, i, n) {
  // aideMax : une aide avant la réponse (décomposer le nombre, compter les 10, montrer les cadres).
  const base = { niveau, theme: 'kazu', essais: new Set(), resolu: false, indices: false, demande: 'plus', aide: 0, aideMax: niveau === 35 ? 0 : 1 };
  const tiers = Math.ceil(n / 3);
  if (niveau === 35) {
    // いくつ？ : d'abord jusqu'à 5, en rangées de 5 ; ensuite jusqu'à 10, parfois en désordre.
    const facile = derniere || i < tiers;
    const v = facile ? entier(1, 5) : entier(4, 10);
    // Seulement des choses dont le compteur est travaillé (いぬ → なんびき, えんぴつ → なんぼん…).
    const actifs = compteursActifs();
    const [nom, emoji, cpt] = choisir(A_COMPTER.filter((x) => actifs.includes(x[2])));
    return { ...base, type: 'compter', valeur: v, nom, emoji, compteur: cpt, desordre: !facile && i >= 2 * tiers, options: choixNombres(v, 1, 10), bonne: v };
  }
  if (niveau === 42) {
    // かぞえかた : d'abord choisir le compteur (いぬは 〜ひき), ensuite la bonne lecture (さんびき, いっぽん…).
    const actifs = compteursActifs();
    const avecSons = actifs.filter((c) => COMPTEURS[c].change.length);
    const lire = !derniere && avecSons.length && i >= Math.ceil(n / 2);
    if (!lire) {
      const c = derniere ? (actifs.includes('こ') ? 'こ' : actifs[0]) : choisir(actifs);
      const [nom, emoji] = choseDuCompteur(c);
      const autres = melanger(actifs.filter((x) => x !== c));
      melanger(TOUS_COMPTEURS).forEach((x) => { if (x !== c && !autres.includes(x)) autres.push(x); });
      const v = entier(1, 5);
      return { ...base, type: 'compteur', sens: 'choisir', valeur: v, nom, emoji, compteur: c, options: melanger([c, ...autres.slice(0, 2)]), bonne: c };
    }
    const c = choisir(avecSons);
    const [nom, emoji] = choseDuCompteur(c);
    // Surtout les nombres où le son change (1, 3, 6, 8, 10 pour 「ほん」).
    const ch = COMPTEURS[c].change;
    const v = Math.random() < 0.7 ? choisir(ch) : entier(1, c === 'にん' ? 6 : 10);
    return { ...base, type: 'compteur', sens: 'lire', valeur: v, nom, emoji, compteur: c, options: melanger([compteur(v, c).y, ...fautesLecture(v, c)]), bonne: compteur(v, c).y };
  }
  if (niveau === 36) {
    // よみかた : chiffre → hiragana, puis hiragana → chiffre ; 1–10, puis 11–20, puis jusqu'à 99.
    const v = derniere || i < tiers ? entier(1, 10) : i < 2 * tiers ? entier(11, 20) : entier(21, 99);
    const sens = i % 2 === 0 ? 'chiffre' : 'yomi';
    const options = choixNombres(v, v > 20 ? 11 : 1, v > 20 ? 99 : 20, [inverse(v), v > 10 ? v % 10 : null].filter(Boolean));
    return { ...base, type: 'lire', valeur: v, sens, options, bonne: v };
  }
  if (niveau === 37) {
    // 10の まとまり : des jetons rangés par cadres de 10.
    const v = derniere ? entier(1, 3) * 10 + entier(1, 5) : entier(11, i < tiers ? 39 : 99);
    return { ...base, type: 'dizaines', valeur: v, options: choixNombres(v, 10, 99, [inverse(v)].filter(Boolean)), bonne: v };
  }
  // どっちが おおきい？ : 1–10 très différents, puis jusqu'à 100 avec des pièges (12 / 21, 39 / 41).
  let a;
  let b;
  if (derniere || i < tiers) {
    a = entier(1, 4);
    b = a + entier(3, 6);
  } else if (Math.random() < 0.5) {
    a = entier(12, 49);
    // 22, 33, 44 sont leur propre inverse : pas de question avec deux nombres égaux.
    const inv = inverse(a);
    b = inv && inv !== a ? inv : a + 10;
  } else {
    const d = entier(2, 8);
    a = d * 10 + entier(5, 9);
    b = (d + 1) * 10 + entier(0, 4);
  }
  const valeurs = melanger([a, b]);
  const demande = !reglages.court || derniere ? 'plus' : choisir(['plus', 'moins']);
  const bonne = demande === 'plus' ? (valeurs[0] > valeurs[1] ? 0 : 1) : (valeurs[0] < valeurs[1] ? 0 : 1);
  return { ...base, type: 'comparer', valeurs, demande, bonne };
}

const motKazu = (sens) => (sens === 'plus' ? [OOKI, 'きい'] : [CHIISA, 'さい']);

// Deux lectures fausses mais plausibles : さんほん, さんぽん pour さんぼん ; いちほん pour いっぽん…
export function fautesLecture(n, c) {
  const juste = compteur(n, c).y;
  // Le petit っ (いっ, ろっ…) n'est une confusion plausible que pour les compteurs où il existe (こ, ひき, ほん, さつ).
  const avecSokuon = COMPTEURS[c].change.some((k) => [1, 6, 8, 10].includes(k));
  const nombres = [YOMI_UN[n] || 'じゅう', avecSokuon ? { 1: 'いっ', 6: 'ろっ', 8: 'はっ', 10: 'じゅっ' }[n] : null].filter(Boolean);
  let fautes = c === 'にん'
    ? { 1: ['いちにん', 'ひとにん'], 2: ['ににん', 'ふたにん'], 4: ['よんにん', 'よんり'] }[n] || []
    : nombres.flatMap((x) => [...COMPTEURS[c].variantes, { 'こ': 'ご', 'さつ': 'ざつ', 'まい': 'ばい', 'だい': 'たい' }[c] || c].map((v) => x + v));
  // Pas de vrais mots qui embrouillent ou choquent (いちご, じゅうご, ごご, いったい 一体, しにん 死人).
  fautes = melanger([...new Set(fautes)].filter((x) => x !== juste && !['いちご', 'じゅうご', 'ごご', 'いったい', 'しにん'].includes(x)));
  // Pas assez d'erreurs de son : le nombre d'à côté (よんさつ pour さんさつ).
  for (const k of [n - 1, n + 1, n + 2]) if (fautes.length < 2 && k >= 1 && k <= 10) fautes.push(compteur(k, c).y);
  return fautes.slice(0, 2);
}

export function consigneKazu(q) {
  if (q.type === 'tuto') return q.etapes[q.etape].dire;
  if (q.type === 'compter') return [q.nom, 'は ', COMPTEURS[q.compteur || 'こ'].question, '？'];
  if (q.type === 'compteur') return q.sens === 'choisir' ? [q.nom, 'は どう かぞえる？'] : [q.nom, 'は ', COMPTEURS[q.compteur].question, '？'];
  if (q.type === 'lire') return q.sens === 'chiffre' ? ['この ', SUJI, 'の よみかたは？'] : ['「', yomiNombre(q.valeur), '」は どれ？'];
  if (q.type === 'dizaines') return ['●は いくつ？'];
  return ['どっちが ', ...motKazu(q.demande), '？'];
}

export function rappelKazu(q) {
  if (q.type === 'tuto') return [''];
  if (q.type === 'compter') return ['ひとつずつ、 じゅんばんに かぞえる'];
  if (q.type === 'compteur') return q.sens === 'choisir' ? [COMPTEURS[q.compteur].court] : [sonsQuiChangent(q.compteur)];
  if (q.type === 'lire') return [V(`${q.valeur} ＝ `, 'この すうじは '), yomiNombre(q.valeur)];
  if (q.type === 'dizaines') return ['10の まとまりで かぞえると はやい'];
  const grand = Math.max(...q.valeurs) >= 10;
  return grand
    ? ['10の まとまりが ', OO_I, 'い ほう ＝ ', OOKI, 'きい']
    : ['あとから いう かず ＝ ', OOKI, 'きい'];
}

export function explicationKazu(q) {
  const v = q.valeur;
  if (q.type === 'compter') {
    const compte = Array.from({ length: v }, (_, k) => YOMI_UN[k + 1] || 'じゅう').join('、 ');
    return [compte, '。 ', q.nom, 'は ぜんぶで ', segCompteur(v, q.compteur || 'こ'), '。'];
  }
  if (q.type === 'compteur') {
    const c = q.compteur;
    if (q.sens === 'choisir') return [COMPTEURS[c].regle, ' ', q.nom, 'が ', segCompteur(v, c), '。'];
    // La liste des sons qui changent est déjà écrite au-dessus (le rappel) : la voix la dit, l'écran reste court.
    const sons = COMPTEURS[c].change.length
      ? [V('', ` ${c === 'にん' ? '' : `${COMPTEURS[c].change.join('、 ')}で おとが かわる： `}${sonsQuiChangent(c)}。`)]
      : [];
    return [q.nom, 'が 「', compteur(v, c).y, '」。', ...sons];
  }
  if (q.type === 'lire') {
    const autre = AUTRES_YOMI[v] ? [' 「', AUTRES_YOMI[v], '」とも よむよ。'] : [];
    return [V(String(v), 'この すうじ'), 'は 「', yomiNombre(v), '」と よむ。', ...autre];
  }
  if (q.type === 'dizaines') {
    const d = Math.floor(v / 10);
    const u = v % 10;
    if (!u) return ['◇10の まとまりが ', `${d}つで `, ecrit(`${v}、 `), '「', yomiNombre(v), '」。 ◎ばらは ない。'];
    return ['◇10の まとまりが ', `${d}つで `, String(d * 10), '、 ◎ばらが ', `${u}つで `, String(u), '。 あわせて ', ecrit(`${v}、 `), '「', yomiNombre(v), '」。'];
  }
  const [a, b] = q.valeurs;
  const g = Math.max(a, b);
  const p = Math.min(a, b);
  let raison;
  if (g < 10) {
    raison = ['かぞえると、 ', String(p), 'の あとに ', String(g), 'が くるね。 '];
  } else if (Math.floor(g / 10) !== Math.floor(p / 10)) {
    raison = [String(g), 'は ◇10が ', `${Math.floor(g / 10)}つ、 `, String(p), 'は ◇10が ', `${Math.floor(p / 10)}つ。 `, '◇10の まとまりが ', OO_I, 'い ほうが ', OOKI, 'きい。 '];
  } else {
    raison = ['◇10の まとまりは ', ONAJI, 'じ。 ◎ばらは ', String(g % 10), 'と ', String(p % 10), '。 '];
  }
  return [...raison, String(q.valeurs[q.bonne]), 'の ほうが ', ...motKazu(q.demande), 'ね。'];
}

// Compter par 10 : la voix dit tout (じゅう、 にじゅう、 さんじゅう…), l'écran garde court (10、 20、 30…).
const compterPar10 = (d) => V(d <= 3 ? Array.from({ length: d }, (_, k) => (k + 1) * 10).join('、 ') : '10、 20、 30…',
  YOMI_DIX.slice(1, d + 1).join('、 '));

// L'aide かず : on DÉCOMPOSE le nombre (16 = 10 と 6 : 「じゅう」 と 「ろく」), on compte les 10 (じゅう、 にじゅう…).
// Après une erreur sur un nombre (64 pour 66) : quelle partie était juste ? 'ba' : les dizaines sont justes,
// on regarde les ばら ; 'dix' : les ばら sont justes, on regarde les 10の まとまり.
function partieAVoir(q) {
  if (!['dizaines', 'lire'].includes(q.type) || typeof q.erreur !== 'number' || q.valeur < 10) return null;
  const [d, u, de, ue] = [Math.floor(q.valeur / 10), q.valeur % 10, Math.floor(q.erreur / 10), q.erreur % 10];
  if (d === de && u !== ue) return 'ba';
  if (u === ue && d !== de) return 'dix';
  return null;
}

export function aideKazu(q) {
  const v = q.valeur;
  const d = Math.floor(v / 10);
  const u = v % 10;
  const voir = partieAVoir(q);
  if (q.type === 'dizaines' && voir === 'ba') {
    return ['◇10の まとまりは あって いるよ。 ', String(d * 10), '。 こんどは ◎ばらを ひとつずつ かぞえよう。'];
  }
  if (q.type === 'dizaines' && voir === 'dix') {
    return ['◎ばらは あって いるよ。 ◇10の まとまりを 10ずつ かぞえよう： ', compterPar10(d), '。'];
  }
  if (q.type === 'lire' && voir === 'ba') {
    return ['「', YOMI_DIX[d], '」は あって いるよ。 ◎ばらを よく ', MI, 'て： ばら ', `${u}つは 「`, YOMI_UN[u], '」。'];
  }
  if (q.type === 'lire' && voir === 'dix' && u) {
    return ['「', YOMI_UN[u], '」は あって いるよ。 ◇10の まとまりを よく ', MI, 'て： ◇10の まとまり ', `${d}つは 「`, YOMI_DIX[d], '」。'];
  }
  if (q.type === 'compteur') {
    const c = q.compteur;
    // Choisir : la règle de chaque compteur proposé. Lire : on compte ensemble jusqu'au nombre d'avant.
    if (q.sens === 'choisir') return [q.options.map((x) => COMPTEURS[x].indice).join('、 '), '。'];
    return indiceSon(q);
  }
  if (q.type === 'lire') {
    if (v < 10) return ['●を かぞえて みよう。 いち、 に、 さん…'];
    if (q.sens === 'chiffre') {
      return u
        ? ['◇10の まとまり ', `${d}つは 「`, YOMI_DIX[d], '」、 ばら ', `${u}つは 「`, YOMI_UN[u], '」。']
        : ['◇10の まとまりが ', `${d}つ。 10ずつ かぞえよう： `, compterPar10(d), '。'];
    }
    return u
      ? ['「', yomiNombre(v), '」は 「', YOMI_DIX[d], '」と 「', YOMI_UN[u], '」。 「', YOMI_DIX[d], '」は ◇10の まとまり ', `${d}つ`, '、 「', YOMI_UN[u], '」は ばら ', `${u}つ`, '。']
      : ['「', yomiNombre(v), '」は ◇10の まとまりが ', `${d}つ。`];
  }
  if (q.type === 'dizaines') {
    return ['◇10の まとまりを 10ずつ かぞえよう： ', compterPar10(d), '。', u ? ' それから ◎ばらを かぞえよう。' : ''];
  }
  return Math.max(...q.valeurs) >= 10 ? ['◇10の まとまりの かずを くらべよう。'] : ['●の かずを くらべよう。'];
}

// かぞえかた, lire : l'erreur n'est pas de compter, c'est le son (さんびき, ろっぽん…), à retenir par cœur.
// - une lecture d'un autre nombre (よんひき pour 3) : on le dit ;
// - un nombre où le son change : on montre ce qui change (「ろく」→「ろっ」、 「ほん」→「ぽん」) ;
// - un nombre où rien ne change : 「に」と 「ひき」で 「にひき」。
const LECTURE_SIMPLE = (n) => YOMI_UN[n] || 'じゅう';
export const indiceSon = (q) => explicationSon(q.compteur, q.valeur, [...q.essais].pop());
export function explicationSon(c, v, choisi) {
  const juste = compteur(v, c).y;
  const autre = typeof choisi === 'string' ? COMPTEURS[c].yomi.indexOf(choisi) + 1 : 0;
  if (autre && autre !== v) {
    return ['おしい！ 「', choisi, '」は ', String(autre), 'の とき。 ここは ', String(v), 'だよ。'];
  }
  if (c === 'にん') {
    if (v <= 2) return ['おしい！ ひとは 1で 「ひとり」、 2で 「ふたり」。 とくべつな いいかた だよ。 おぼえよう。'];
    if (v === 4) return ['おしい！ 4の ときは 「よん」では なくて 「よ」： 「よにん」。 おぼえよう。'];
  }
  if (!COMPTEURS[c].change.includes(v)) {
    return ['おしい！ ', String(v), 'の ときは おとが かわらないよ。 「', LECTURE_SIMPLE(v), '」と 「', c, '」で 「', juste, '」。'];
  }
  // Ce qui change : le nombre (いち → いっ) et/ou le compteur (ほん → ぼん).
  const n = LECTURE_SIMPLE(v);
  const debutJuste = juste.slice(0, juste.length - c.length);
  const finJuste = juste.slice(juste.length - c.length);
  const changes = [];
  if (debutJuste !== n) changes.push(['「', n, '」が 「', debutJuste, '」に']);
  if (finJuste !== c) changes.push(['「', c, '」が 「', finJuste, '」に']);
  return ['おしい！ ', String(v), 'の ときは おとが かわるよ。 ', ...changes.flatMap((x, i) => (i ? ['、 ', ...x] : x)), ' かわって 「', juste, '」。 おぼえよう。'];
}

export function messageErreurKazu(q) {
  if (q.type === 'compter') return ['おしい！ ひとつずつ、 ゆびで さしながら かぞえよう。'];
  if (q.type === 'compteur') {
    // Les questions à se poser, seulement pour les compteurs proposés : いきもの？ ほそながい もの？
    const questions = { 'こ': 'ちいさい もの？', 'ひき': 'いきもの？', 'ほん': 'ほそながい もの？', 'まい': 'うすい もの？', 'だい': 'のりもの？', 'にん': 'ひと？', 'さつ': 'ほんや ノート？' };
    return q.sens === 'choisir'
      ? ['おしい！ ', q.nom, 'は ', q.options.map((x) => questions[x]).join(' '), ' よく ', MI, 'てね。']
      : indiceSon(q);
  }
  if (q.type === 'lire') {
    if (q.sens === 'yomi') return ['おしい！ こえを よく きいてね。'];
    return q.valeur < 10 ? ['おしい！ ●を かぞえて みよう。'] : ['おしい！ ◇10の まとまりと ●を よく ', MI, 'てね。'];
  }
  if (q.type === 'dizaines') {
    return partieAVoir(q) === 'ba' ? ['おしい！ ◎ばらを ゆびで さしながら かぞえよう。'] : ['おしい！ ◇10の まとまりを さきに かぞえよう。'];
  }
  return ['おしい！ ◇10の まとまりの かずを くらべよう。'];
}

// Les jetons d'un nombre : centaines (plaques de 100), dizaines (cadres de 10 pleins : « 10の まとまり »),
// unités (« ばら ») dans un cadre de 10. Dans les leçons : exactement ce que l'élève a posé ({ c, d, u }).
// compte : sous chaque dizaine, 10, 20, 30… (on apprend à compter par 10).
// legende : sous chaque groupe, « 10の まとまり 4つ / 40 よんじゅう », « ばら 4つ / 4 よん » (yomi : avec la lecture).
export function htmlBlocs(n, { cadreVide = false, etiquettes = false, parties = null, compte = false, legende = false, yomi = true } = {}) {
  const { c, d, u } = parties || { c: Math.floor(n / 100), d: Math.floor((n % 100) / 10), u: n % 10 };
  const legendeDe = (nom, combien, valeur, place) => (legende
    ? `<span class="legende-blocs"><small>${nom} ${combien}つ</small><span class="legende-valeur legende-${place}"><b>${valeur}</b>${yomi ? `<span class="nb-yomi">${yomiNombre(valeur)}</span>` : ''}</span></span>`
    : '');
  let h = `<span class="blocs${legende ? ' avec-legende' : ''}">`;
  if (c) {
    h += `<span class="blocs-groupe"><span class="blocs-rang">${'<span class="plaque100"></span>'.repeat(c)}${etiquettes ? `<b class="ba">100 × ${c}</b>` : ''}</span>${legendeDe('<pc>●</pc>100の いた', c, c * 100, 'c')}</span>`;
  }
  if (d) {
    const dizaines = Array.from({ length: d }, (_, k) => (compte
      ? `<span class="cadre-groupe">${htmlCadre(10, 'dix')}<b>${(k + 1) * 10}</b></span>`
      : htmlCadre(10, 'dix'))).join('');
    h += `<span class="blocs-groupe"><span class="blocs-rang">${dizaines}${etiquettes ? `<b class="ba">10 × ${d}</b>` : ''}</span>${legendeDe('<pd>●</pd>10の まとまり', d, d * 10, 'd')}</span>`;
  }
  if (u || cadreVide) {
    const cadres = Math.max(1, Math.ceil(u / 10));
    h += `<span class="blocs-groupe"><span class="blocs-rang">${Array.from({ length: cadres }, (_, k) => htmlCadre(Math.min(10, u - k * 10))).join('')}${etiquettes && u ? `<b class="ba">1 × ${u}</b>` : ''}</span>${u ? legendeDe('<pu>●</pu>ばら', u, u, 'u') : ''}</span>`;
  }
  return `${h}</span>`;
}
// Un cadre de 10 (2 rangées de 5) : on voit ce qui manque pour faire 10. Plein, c'est « 10の まとまり ».
const htmlCadre = (k, classe = '') => `<span class="cadre10${classe ? ` ${classe}` : ''}">${Array.from({ length: 10 }, (_, i) => `<i class="${i < k ? 'plein' : ''}"></i>`).join('')}</span>`;

// Réduit la taille des cases (--c) jusqu'à ce que l'élément tienne dans W × H ; renvoie true si ça tient.
export function ajusterCases(el, W, H, cMax, cMin = 12) {
  const tient = () => {
    const r = el.getBoundingClientRect();
    return r.height <= H + 1 && r.width <= W + 1 && el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1;
  };
  for (let c = cMax; c >= cMin; c -= 2) {
    el.style.setProperty('--c', `${c}px`);
    if (tient()) return true;
  }
  return false;
}
// Sur un petit écran : d'abord plus compact (chiffres moins grands), puis, si les points deviendraient
// illisibles, seulement la légende (« 10の まとまり 9つ … ») : jamais de points minuscules.
function ajusterBlocs(el, W, H, cMax) {
  const enLigne = el.classList.contains('en-ligne');
  el.classList.remove('compacte', 'sans-cadres');
  if (ajusterCases(el, W, H, cMax)) return;
  // Compact : le chiffre et sa lecture sur une ligne, les cadres dessous.
  el.classList.remove('en-ligne');
  el.classList.add('compacte');
  if (ajusterCases(el, W, H, cMax, 10)) return;
  if (enLigne) {
    el.classList.add('en-ligne');
    if (ajusterCases(el, W, H, cMax, 10)) return;
  }
  if (el.querySelector('.legende-blocs')) el.classList.add('sans-cadres');
}

export function rendreKazuQ(q, scene, W, H) {
  const choix = $('choix-mots');
  const avecChoix = q.type !== 'comparer' && q.type !== 'tuto';
  const aide = q.aide > 0 && !q.preuve;
  choix.hidden = !avecChoix;
  choix.replaceChildren();
  // Les réponses en liste : une par ligne, le chiffre et sa lecture en grand.
  choix.classList.toggle('choix-liste', avecChoix);
  if (q.type === 'compter' || q.type === 'compteur') {
    const zone = document.createElement('div');
    zone.className = `a-compter${q.desordre ? ' desordre' : ''}`;
    // Peu d'objets : plus gros et centrés (autant de colonnes que d'objets, 5 au plus).
    const colonnes = q.desordre ? 5 : Math.min(5, q.valeur);
    const rangees = q.desordre ? 3 : Math.ceil(q.valeur / 5);
    const taille = Math.max(32, Math.min(110, W / (colonnes * 1.28 + 0.6), H / (rangees * 1.28 + 0.8)));
    zone.style.setProperty('--t', `${taille}px`);
    if (!q.desordre) zone.style.gridTemplateColumns = `repeat(${colonnes}, var(--t))`;
    if (!q.places) {
      // En désordre : des cases tirées au hasard dans une grille 5 × 3, un peu décalées.
      const cases = melanger(Array.from({ length: 15 }, (_, k) => k)).slice(0, q.valeur).sort((x, y) => x - y);
      q.places = cases.map((c) => ({ c, dx: aleatoire(-0.15, 0.15), dy: aleatoire(-0.15, 0.15) }));
    }
    for (let k = 0; k < q.valeur; k++) {
      const o = document.createElement('span');
      o.className = 'objet-compte';
      o.textContent = q.emoji;
      if (q.desordre) {
        const p = q.places[k];
        o.style.gridColumn = String((p.c % 5) + 1);
        o.style.gridRow = String(Math.floor(p.c / 5) + 1);
        o.style.transform = `translate(${p.dx * taille}px, ${p.dy * taille}px)`;
      }
      if (q.preuve) {
        const num = document.createElement('b');
        num.className = 'num-compte';
        num.textContent = String(k + 1);
        num.style.animationDelay = `${k * 0.45}s`;
        o.append(num);
      }
      zone.append(o);
    }
    scene.append(zone);
  } else if (q.type === 'lire') {
    const carte = document.createElement('div');
    carte.className = 'carte-nombre';
    const chiffres = q.preuve || aide ? chiffresColores(q.valeur) : q.valeur;
    const tete = q.sens === 'chiffre'
      ? `<span class="nb-chiffre">${chiffres}</span>${q.preuve ? `<span class="nb-yomi">${yomiNombre(q.valeur)}</span>` : ''}`
      : `<span class="nb-yomi grand">${yomiNombre(q.valeur)}</span>${q.preuve ? `<span class="nb-chiffre">${chiffres}</span>` : ''}`;
    carte.innerHTML = `<span class="carte-tete">${tete}</span>`;
    // Aide et preuve : le nombre décomposé (10の まとまり / ばら), avec la lecture de chaque partie.
    if (q.preuve || aide) {
      carte.innerHTML += htmlBlocs(q.valeur, { compte: q.valeur >= 20, legende: q.valeur >= 10 });
      // La partie à regarder après l'erreur (dizaines ou ばら) est entourée.
      const voir = q.preuve ? null : partieAVoir(q);
      const groupes = carte.querySelectorAll('.blocs-groupe');
      if (voir && groupes.length === 2) groupes[voir === 'ba' ? 1 : 0].classList.add('a-regarder');
      carte.classList.toggle('en-ligne', W > H * 1.25);
    }
    scene.append(carte);
    if (q.preuve || aide) ajusterBlocs(carte, W, H - 2, 34);
  } else if (q.type === 'dizaines') {
    const zone = document.createElement('div');
    zone.className = 'zone-dizaines';
    const d = Math.floor(q.valeur / 10);
    const u = q.valeur % 10;
    // Aide et preuve : on compte les 10 (10, 20, 30…), puis les ばら.
    const compter = q.preuve || aide;
    const voir = q.preuve ? null : partieAVoir(q);
    zone.innerHTML = Array.from({ length: d }, (_, k) => `<span class="cadre-groupe${voir === 'dix' ? ' a-regarder' : ''}">${htmlCadre(10, 'dix')}${compter ? `<b>${(k + 1) * 10}</b>` : ''}</span>`).join('')
      + (u ? `<span class="cadre-groupe${voir === 'ba' ? ' a-regarder' : ''}">${htmlCadre(u)}${q.preuve ? `<b class="ba">ばら ${u}</b>` : voir === 'ba' ? '<b class="ba">ばら ？</b>' : ''}</span>` : '');
    placerCadres(zone, d + (u ? 1 : 0), scene, W, H);
  } else if (q.type === 'tuto') {
    rendreExemple(q, scene, W, H);
  } else {
    rendreComparerKazu(q, scene, W, H, aide);
  }
  afficherChoixKazu(q, choix, avecChoix);
}

// Taille des cases : on essaie 1 à 5 cadres par rangée et on garde la plus grande taille qui tient
// (un cadre : 5 cases + 24 px de large, 2 cases + 15 px de haut, + l'étiquette 10, 20, 30…).
function placerCadres(zone, nb, scene, W, H, cMax = 44) {
  {
    let meilleur = 9;
    let colonnes = Math.min(5, nb);
    for (let k = 1; k <= Math.min(5, nb); k++) {
      const r = Math.ceil(nb / k);
      const c = Math.min(cMax, (W - 8 - (k - 1) * 12 - k * 24) / (5 * k), (H - 8 - (r - 1) * 12 - r * (15 + 26)) / (2 * r));
      if (c > meilleur) {
        meilleur = c;
        colonnes = k;
      }
    }
    const poser = (c) => {
      zone.style.setProperty('--c', `${c}px`);
      zone.style.maxWidth = `${colonnes * (5 * c + 24) + (colonnes - 1) * 12 + 2}px`;
    };
    let c = Math.floor(meilleur);
    poser(c);
    scene.append(zone);
    // Vérifié sur l'écran réel (étiquettes 10, 20, 30… comprises) : on réduit si ça dépasse.
    const depasse = () => zone.getBoundingClientRect().height > H || zone.getBoundingClientRect().width > W + 1;
    while (c > 7 && depasse()) poser(--c);
    // Très petit écran : étiquettes et écarts plus serrés plutôt que des cadres coupés.
    if (depasse()) {
      zone.classList.add('serre');
      while (c > 5 && depasse()) poser(--c);
    }
  }
}

function rendreComparerKazu(q, scene, W, H, aide) {
  {
    const rangee = document.createElement('div');
    rangee.className = 'rangee-mv';
    q.valeurs.forEach((v, k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'carte-nombre choix-comparer';
      b.innerHTML = nombreYomi(v, q.preuve || aide) + (q.preuve || aide ? htmlBlocs(v, { legende: v >= 10, yomi: false }) : '');
      cible(b, k, `${yomiNombre(v)}`);
      rangee.append(b);
    });
    scene.append(rangee);
    if (q.preuve || aide) ajusterBlocs(rangee, W, H - 2, 26);
  }
}

function afficherChoixKazu(q, choix, avecChoix) {
  if (avecChoix) {
    q.options.forEach((v) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-nombre';
      // Hiragana → chiffre : seulement le chiffre (sinon la réponse serait écrite) ; sinon les deux.
      let label = yomiNombre(v);
      if (q.type === 'compter') {
        b.innerHTML = htmlCompteur(v, q.compteur || 'こ');
        label = compteur(v, q.compteur || 'こ').y;
      } else if (q.type === 'compteur' && q.sens === 'choisir') {
        // Le même nombre avec chaque compteur : 3びき / 3ぼん / 3まい.
        b.innerHTML = htmlCompteur(q.valeur, v);
        label = compteur(q.valeur, v).y;
      } else if (q.type === 'compteur') {
        b.innerHTML = `<span class="nb-yomi">${v}</span>`;
        label = v;
      } else {
        b.innerHTML = q.type === 'lire' && q.sens === 'chiffre' ? `<span class="nb-yomi">${yomiNombre(v)}</span>`
          : q.type === 'lire' ? `<span class="nb-chiffre">${q.aide || q.preuve ? chiffresColores(v) : v}</span>` : nombreYomi(v, q.type === 'dizaines' && (q.aide > 0 || q.preuve));
      }
      cible(b, v, label);
      choix.append(b);
    });
  }
}

/* ----- Exemple guidé (れい) avant la 1re question : on relie la consigne au dessin.
   10の まとまり : un cadre plein, c'est 10 (les ●, numérotés 1 à 10) ; on compte les cadres
   10, 20 ; puis les ばら 21, 22, 23 ; ぜんぶで 23. つぎへ passe d'une étape à l'autre, とばす saute l'exemple. ----- */
const EXEMPLES = {
  37: () => ({
    valeur: 23,
    etapes: [
      { dire: ['まずは れいを みよう。 これは ◇10の まとまり。 ●が 10こ はいって いるよ。 ', V('1、 2、 3… 10。', 'いち、 に、 さん、 よん、 ご、 ろく、 なな、 はち、 きゅう、 じゅう。')], dizaines: 1, numeros: [1, 10] },
      { dire: ['◇10の まとまりは 10ずつ かぞえる： ', V('10、 20。', 'じゅう、 にじゅう。')], dizaines: 2, ba: 3, etiquettes: true },
      { dire: ['のこりの ●は 「◎ばら」。 ', V('21、 22、 23。', 'にじゅういち、 にじゅうに、 にじゅうさん。')], dizaines: 2, ba: 3, etiquettes: true, numerosBa: 21 },
      { dire: ['ぜんぶで ', ecrit('23、 '), '「にじゅうさん」。 では、 やって みよう！'], dizaines: 2, ba: 3, etiquettes: true, total: 23 },
    ],
  }),
};
// Au début d'une série : l'exemple, s'il existe pour cette activité (et si les parents le veulent).
export function exempleDe(niveau) {
  if (reglages.exemple === false || !EXEMPLES[niveau]) return null;
  return { ...EXEMPLES[niveau](), theme: 'kazu', type: 'tuto', etape: 0, essais: new Set(), resolu: false, aide: 0, aideMax: 0 };
}

// Les cadres de l'exemple ; les nombres apparaissent un à un, au rythme de la voix (≈ 0,6 s).
function rendreExemple(q, scene, W, H) {
  const et = q.etapes[q.etape];
  const zone = document.createElement('div');
  zone.className = 'zone-dizaines zone-exemple';
  const pas = 0.62;
  const cadre = (k, numeroDepart, classe) => `<span class="cadre10${classe ? ` ${classe}` : ''}">${Array.from({ length: 10 }, (_, i) => {
    if (i >= k) return '<i></i>';
    const n = numeroDepart ? numeroDepart + i : 0;
    return `<i class="plein">${n ? `<b style="animation-delay:${(i * pas).toFixed(2)}s">${n}</b>` : ''}</i>`;
  }).join('')}</span>`;
  let h = '';
  for (let k = 0; k < et.dizaines; k++) {
    const num = et.numeros && k === 0 ? 1 : 0;
    const etiquette = et.etiquettes ? `<b style="animation-delay:${(et.numerosBa ? 0 : 0.8 + k * 0.9).toFixed(2)}s">${(k + 1) * 10}</b>` : '';
    h += `<span class="cadre-groupe">${cadre(10, num, 'dix')}${etiquette}</span>`;
  }
  if (et.ba) {
    h += `<span class="cadre-groupe">${cadre(et.ba, et.numerosBa || 0)}${et.numerosBa || et.total ? `<b class="ba">ばら ${et.ba}</b>` : ''}</span>`;
  }
  zone.innerHTML = h;
  // Les cadres, et dessous (dernière étape) le total : 23 にじゅうさん.
  const bloc = document.createElement('div');
  bloc.className = 'exemple';
  scene.append(bloc);
  placerCadres(zone, et.dizaines + (et.ba ? 1 : 0), bloc, W, et.total ? H - 80 : H);
  if (et.total) {
    const total = document.createElement('div');
    total.className = 'total-exemple';
    total.innerHTML = nombreYomi(et.total, true);
    bloc.append(total);
  }
}
