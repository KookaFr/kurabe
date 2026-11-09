/* ======================================================================
   Leçons おもさ : てんびん, g と kg, つりあわせよう, はかって みよう, もんめ, はかりの よみかた
   ====================================================================== */

import { pasBoutons } from '../etude/etude.js';
import { enTsumiki } from '../etude/verre.js';
import { enG, enKg, equilibre, guidePoids, P, somme, unePose } from './moteur.js';
import { aleatoire, choisir, entier } from '../outils.js';
import { choixLecture, CHOSES, lectureHakari } from '../questions/mv.js';
import { reglages } from '../reglages.js';
import { AGA, KARU, ME, MI, nomDe, OMO, ONAJI, OOKI, SAGA, segU, SUJI, V } from '../texte.js';

// てんびん (むかしの はかり) : à partir des poids identiques, les masses sont en g (おもり 1こ ＝ 100 g).
export function etapesBalance() {
  const g100 = (n) => P('g100', 100, n);
  return [
    {
      dire: ['これは てんびん。 むかしは これで ', OMO, 'さを くらべたり はかったり したよ。 いまでも りかの じっけんで つかうよ。 なにも のって いない とき、 てんびんは まっすぐ。 まんなかの はりも まんなかを さして いる。'],
      balance: [[], []],
    },
    {
      dire: ['りんごを さわって、 ひだりの さらに のせよう。'],
      balance: [[], []], reserve: [P('ringo', 300)], vers: 0, fini: unePose,
      bravo: ['りんごを のせた ほうが ', SAGA, 'がったね。 りんごの ', OMO, 'さで ', SAGA, 'がったよ。'],
    },
    {
      dire: ['もう ひとつの りんごを、 みぎの さらに のせよう。'],
      balance: [[P('ringo', 300)], []], reserve: [P('ringo', 300)], vers: 1, fini: unePose,
      bravo: ['まっすぐに なった！ ', ONAJI, 'じ ', OMO, 'さだと まっすぐ。 これを「つりあう」と いうよ。'],
    },
    {
      dire: ['こんどは いちごを、 みぎの さらに のせよう。'],
      balance: [[P('ringo', 300)], []], reserve: [P('ichigo', 20)], vers: 1, fini: unePose,
      bravo: ['りんごの ほうが ', SAGA, 'がった。 ', SAGA, 'がった ほうが ', OMO, 'い。 いちごの ほうは ', AGA, 'がった。 ', AGA, 'がった ほうが ', KARU, 'い。'],
    },
    {
      dire: ['ひだりと みぎを いれかえて みよう。 りんごを みぎの さらに のせよう。'],
      balance: [[P('ichigo', 20)], []], reserve: [P('ringo', 300)], vers: 1, fini: unePose,
      bravo: ['こんどは みぎが ', SAGA, 'がった。 ひだりでも みぎでも、 ', OMO, 'い ほうが ', SAGA, 'がるよ。'],
    },
    {
      dire: ['これは おもり。 ぜんぶ ', ONAJI, 'じ ', OMO, 'さ だよ。 りんごと つりあう まで、 おもりを みぎに のせよう。'],
      balance: [[P('ringo', 300)], []], reserve: [P('omori', 100, 6)], vers: 1, retirer: true, fini: equilibre,
      bravo: ['つりあった！ この りんごは おもり 3こ ぶんの ', OMO, 'さ。'],
    },
    {
      dire: ['この おもりは 1こ ', segU(100, 'g'), '。 この りんごは ', segU('なん', 'g'), '？'],
      balance: [[P('ringo', 300)], [g100(3)]], cache: true,
      choix: { options: [300, 3, 100], bonne: 300, indice: ['おしい！ ', segU(100, 'g'), 'の おもりが 3こ。 100 ＋ 100 ＋ 100 は？'] },
      bravo: ['100 ＋ 100 ＋ 100 ＝ 300。 この りんごは ', segU(300, 'g'), '。'],
    },
    {
      dire: ['こんどは ボール。 おもりを のせて、 つりあわせよう。'],
      balance: [[P('booru', 500)], []], reserve: [P('omori', 100, 8)], vers: 1, retirer: true, fini: equilibre,
      bravo: ['つりあった！ この ボールは おもり 5こ ぶん。'],
    },
    {
      dire: ['おもりは 1こ ', segU(100, 'g'), '。 この ボールは ', segU('なん', 'g'), '？'],
      balance: [[P('booru', 500)], [g100(5)]], cache: true,
      choix: { options: [500, 5, 100], bonne: 500, indice: ['おしい！ ', segU(100, 'g'), 'の おもりが 5こ だよ。'] },
      bravo: ['100が 5つで 500。 この ボールは ', segU(500, 'g'), '。 りんごより ', OMO, 'いね。'],
    },
    {
      dire: ['べつの りんごを はかろう。 ', segU(100, 'g'), 'と ', segU(10, 'g'), 'の おもりを つかってね。'],
      balance: [[P('ringo', 320)], []], reserve: [P('g100', 100, 4), P('g10', 10, 9)], vers: 1, retirer: true, fini: equilibre,
      bravo: ['つりあった！ ', segU(100, 'g'), 'が 3こで ', segU(300, 'g'), '、 ', segU(10, 'g'), 'が 2こで ', segU(20, 'g'), '。 この りんごは ', segU(320, 'g'), '。 さっきの りんごより ', segU(20, 'g'), ' ', OMO, 'い。 りんごに よって ', OMO, 'さは ちがうね。'],
    },
    {
      dire: ['たしかめよう。 りんご（', segU(300, 'g'), '）と ボール（', segU(500, 'g'), '）を のせたよ。 ボールの ほうが ', SAGA, 'がったね。 ', SUJI, 'が ', OOKI, 'きい ほうが ', OMO, 'い！'],
      balance: [[P('ringo', 300)], [P('booru', 500)]],
    },
  ];
}

// g と kg, sur la balance de cuisine : 1 g bouge à peine l'aiguille ; 10, 100, 1000 g.
export function etapesUnites() {
  const total = (e) => somme(e.plateau);
  return [
    {
      dire: ['1えんだま 1こは ちょうど ', enG(1), '。 ', V('g（グラム）', 'グラム'), 'は ', OMO, 'さの たんい だよ。 ', enG(1), 'は とても ', KARU, 'いので、 はりは ほとんど うごかないね。'],
      hakari: [P('yen1', 1)],
    },
    {
      dire: ['1えんだまを のせて、 ぜんぶで 10こに しよう。'],
      hakari: [P('yen1', 1)], reserve: [P('yen1', 1, 9)], vers: 'plateau', retirer: true, fini: (e) => total(e) === 10,
      bravo: [enG(1), 'が 10こで ', enG(10), '。 はりが ちいさい ', ME, 'もり 1つ ぶん うごいた。'],
    },
    {
      dire: ['こんどは ', enG(10), 'の おもりを 10こ のせよう。'],
      hakari: [], reserve: [P('g10', 10, 10)], vers: 'plateau', retirer: true, fini: (e) => total(e) === 100,
      bravo: [enG(10), 'が 10こで ', enG(100), '。'],
    },
    {
      dire: [enG(100), 'の おもりを 5こ のせよう。'],
      hakari: [], reserve: [P('g100', 100, 5)], vers: 'plateau', retirer: true, fini: (e) => total(e) === 500,
      bravo: [enG(100), 'が 5こで ', enG(500), '。 この はかりの いちばん ', OOKI, 'きい ', ME, 'もり。'],
    },
    {
      dire: [OOKI, 'きい はかりに かえたよ（', segU(2, 'kg'), ' まで）。 ', enG(100), 'の おもりを 10こ のせよう。'],
      hakari: [], max: 2000, reserve: [P('g100', 100, 10)], vers: 'plateau', retirer: true, fini: (e) => total(e) === 1000,
      bravo: [enG(100), 'が 10こで ', enG(1000), '。 ', enG(1000), 'を ', segU(1, 'kg'), 'と いうよ。'],
    },
    {
      dire: ['おこめの ふくろを のせたよ。 はりは ', segU('なん', 'g'), '？'],
      hakari: [P('okome', 1000)], max: 2000, choix: { options: [1000, 100, 10], bonne: 1000 },
      bravo: ['はりは 1000を さして いる。 おこめは ', enG(1000), '、 つまり ', enKg(1), '。'], cache: true,
    },
    {
      dire: ['まとめ。 ', enKg(1), ' ＝ ', enG(1000), '。 ', V('g も kg も', 'グラムも キログラムも'), ' ', OMO, 'さの たんい。 ', ONAJI, 'じ たんいなら、 ', SUJI, 'が ', OOKI, 'きい ほうが ', OMO, 'い。'],
      hakari: [P('g100', 100, 10)], max: 2000,
    },
  ];
}

// Entraînement : poser des poids pour que l'aiguille montre une masse donnée.
// つりあわせよう : un objet à gauche ; on touche un bac pour poser une つみき (jusqu'à 20) ou une おもり
// (1 g et 10 g, ou 10 g et 100 g jusqu'à 1000) ; toucher un poids sur le plateau le remet dans le bac.
// Les poids sont rangés par 5 (10 = 5 + 5), une sorte par rangée, les plus lourds en bas.
export function etapesTsuriawase() {
  const n = Number(reglages.nbQuestions) || 6;
  const max = Number(reglages.nombreMax) || 20;
  const cubes = enTsumiki();
  const { petit, grand } = pasBoutons();
  const poids = { 1: 'g1', 10: 'g10', 100: 'g100' };
  let avant = null;
  return Array.from({ length: n }, () => {
    const autre = (c) => !avant || c.yomi !== avant.yomi;
    let objet;
    let cible;
    if (cubes) {
      // Une unité choisie (« つみき なんこ ぶん »), avec des objets assez lourds pour en demander plusieurs.
      objet = choisir(CHOSES.filter((c) => c.val >= 100 && autre(c)));
      cible = entier(2, max);
    } else {
      // Un objet dont le vrai poids tient dans la limite, à 15 % près (une tomate ne pèse pas 18 g).
      const possibles = CHOSES.filter((c) => c.val >= Math.max(petit * 2, max / 20) && c.val <= max && autre(c));
      objet = choisir(possibles.length ? possibles : CHOSES.filter((c) => c.val <= max));
      cible = Math.max(petit, Math.min(max, Math.round((objet.val * aleatoire(0.85, 1.15)) / petit) * petit));
    }
    avant = objet;
    const nom = nomDe(objet);
    return {
      dire: [nom, 'と つりあう ように、 ', cubes ? 'つみき' : 'おもり', 'を のせよう。'],
      balance: [[{ v: 'objet', c: objet, m: cible }], []],
      reserve: cubes ? [P('tsumiki', 1, max)]
        : [P(poids[grand], grand, Math.min(10, Math.floor(max / grand) + 1)), P(poids[petit], petit, 10)],
      bac: true, vers: 1, retirer: true, fini: equilibre,
      pendant: cubes ? undefined : guidePoids(cible, (e) => e.cotes[1], false),
      compter: reglages.compter === false ? false : (cubes ? true : 'g'),
      bravo: cubes
        ? ['つりあった！ この ', nom, 'は つみき ', String(cible), 'こ ぶんの ', OMO, 'さ。']
        : ['つりあった！ この ', nom, 'は ', segU(cible, 'g'), '。'],
    };
  });
}

export function etapesPratique() {
  const n = Number(reglages.nbQuestions) || 6;
  return Array.from({ length: n }, (_, k) => {
    const cible = k === 0 || k === n - 1 ? entier(1, 4) * 100 : entier(5, 48) * 10;
    return {
      dire: ['はかりが ', enG(cible), 'を さす ように、 おもりを のせよう。'],
      hakari: [], reserve: [P('g100', 100, 4), P('g10', 10, 9)], vers: 'plateau', retirer: true, cache: true,
      fini: (e) => somme(e.plateau) === cible,
      pendant: guidePoids(cible, (e) => e.plateau, true),
      bravo: ['できた！ ', ...lectureHakari(cible)],
    };
  });
}

// もんめ : l'ancienne unité ; la pièce de 5 円 pèse exactement 1 匁 (3,75 g).
export function etapesMonme() {
  return [
    {
      dire: ['むかしの にほんでは、 ', OMO, 'さを 「もんめ」で あらわしたよ。 5えんだま 1こが ちょうど 1もんめ。 てんびんで くらべると、 つりあうね。'],
      balance: [[P('monme1', 3.75)], [P('yen5', 3.75)]],
    },
    {
      dire: ['10もんめの おもりと つりあう まで、 5えんだまを みぎに のせよう。'],
      balance: [[P('monme10', 37.5)], []], reserve: [P('yen5', 3.75, 12)], vers: 1, retirer: true, fini: equilibre,
      bravo: ['5えんだま 10こで つりあった。 10もんめは ', segU(37.5, 'g'), '。'],
    },
    {
      dire: ['1000もんめで 1かん（', segU(3.75, 'kg'), '）。 いまでも しんじゅ（パール）は もんめで はかるよ。 5えんだまを みたら、 おもいだしてね。'],
      balance: [[P('monme10', 37.5)], [P('yen5', 3.75, 10)]],
    },
  ];
}

export function etapesHakari() {
  const totalPlateau = (e) => somme(e.plateau);
  // 1re lecture : une grande graduation (100, 200…) ; 2e : avec des petites (120, 430…).
  const objetLecture = (min, max, rond, petites) => {
    const c = choisir(CHOSES.filter((x) => {
      const v = Math.round(x.val / rond) * rond;
      return x.val >= min && x.val <= max && (!petites || v % 100 !== 0) && Math.abs(v - x.val) <= x.val * 0.15;
    }));
    const v = Math.max(rond, Math.round(c.val / rond) * rond);
    return { c, v };
  };
  const premiere = objetLecture(100, 500, 100, false);
  const seconde = objetLecture(20, 480, 10, true);
  const cible = entier(5, 48) * 10;
  const etapeLecture = ({ c, v }) => ({
    dire: [nomDe(c), 'を はかりに のせたよ。 はりは ', segU('なん', 'g'), '？'],
    hakari: [{ v: 'chose', c, m: v, n: 1 }], choix: { options: choixLecture(v), bonne: v },
    bravo: lectureHakari(v), cache: true,
  });
  return [
    {
      dire: ['これは はかり。 ものを のせると はりが まわって、 ', OMO, 'さが わかる。 なにも のって いない とき、 はりは 0を さすよ。'],
      hakari: [],
    },
    {
      dire: [enG(100), 'の おもりを 1こ、 はかりに のせよう。'],
      hakari: [], reserve: [P('g100', 100, 5)], vers: 'plateau', fini: (e) => totalPlateau(e) === 100,
      bravo: ['はりが まわって、 100 を さしたね。 ', enG(100), '。'],
    },
    {
      dire: ['もう 1こ のせよう。'],
      hakari: [P('g100', 100)], reserve: [P('g100', 100, 4)], vers: 'plateau', fini: (e) => totalPlateau(e) === 200,
      bravo: ['200 を さした。 ', OMO, 'く なると、 はりは もっと まわる。'],
    },
    {
      dire: ['おもりを ぜんぶ のせて みよう。'],
      hakari: [P('g100', 100, 2)], reserve: [P('g100', 100, 3)], vers: 'plateau', fini: (e) => totalPlateau(e) === 500,
      bravo: [enG(500), '。 はりが いちばん たくさん まわった。'],
    },
    {
      dire: ['こんどは おもりを さわって、 ぜんぶ おろそう。'],
      hakari: [P('g100', 100, 5)], retirer: true, vers: 'plateau', fini: (e) => totalPlateau(e) === 0,
      bravo: ['はりが 0 に もどった。 ', KARU, 'く なると、 はりは もどる。'],
    },
    {
      dire: ['ちいさい ', ME, 'もりは 1つ ', enG(10), '。 ', enG(10), 'の おもりを 3こ のせて、 はりを ', MI, 'よう。'],
      hakari: [P('g100', 100)], reserve: [P('g10', 10, 5)], vers: 'plateau', retirer: true, fini: (e) => totalPlateau(e) === 130,
      bravo: ['100 と、 ちいさい ', ME, 'もり 3つ。 ', enG(130), '。'],
    },
    etapeLecture(premiere),
    etapeLecture(seconde),
    {
      dire: ['はかりが ', segU(cible, 'g'), 'を さす ように、 おもりを のせよう。'],
      hakari: [], reserve: [P('g100', 100, 4), P('g10', 10, 9)], vers: 'plateau', retirer: true, cache: true,
      fini: (e) => totalPlateau(e) === cible,
      pendant: guidePoids(cible, (e) => e.plateau, true),
      bravo: ['できた！ ', ...lectureHakari(cible)],
    },
    {
      dire: ['まとめ。 はりが さす かずを よむと、 ', OMO, 'さが わかる。 ', OMO, 'い ほど、 はりは たくさん まわる。'],
      hakari: [P('g100', 100, 3), P('g10', 10, 2)],
    },
  ];
}

/* ----- かさ : はんぶんこ et まぜて みよう — verser tant qu'on appuie ----- */

// はんぶんこ : une ピッチャー et deux コップ identiques (300 mL). On appuie sur la コップ à remplir ;
// ça coule tant qu'on appuie. Quand la ピッチャー est vide, appuyer sur une コップ y verse l'autre :
// c'est ainsi qu'on rattrape (« ひだりから すこし うつそう »).
// まぜて みよう : deux liquides en haut, une grande コップ en bas ; on appuie sur le liquide à verser.
