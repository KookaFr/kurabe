/* ======================================================================
   Leçons かず : le cadre de 10, les dizaines, les centaines
   ====================================================================== */

import { enleverPiece, P, somme } from './moteur.js';
import { ajusterCases, htmlBlocs } from '../questions/kazu.js';
import { activable } from '../tactile.js';
import { AUTRES_YOMI, ecrit, nombreYomi, SUJI } from '../texte.js';

// « 235を つくろう » : on guide sorte par sorte, de la plus grande à la plus petite.
// Trop : on dit laquelle enlever (100の いた, 10の まとまり ou ●), et la démonstration enlève celle-là.
// Après avoir enlevé : « 100の いたは これで いいね。 こんどは 10の まとまりを のせよう。 »
// (m.cle : l'état, pour ne le dire qu'une fois ; m.retirer : la sorte à enlever.)
const guideComposition = (cible) => (e) => {
  const nb = (v) => e.plateau.filter((x) => x.v === v).length;
  const [c, d, u] = [nb('cent'), nb('dix'), nb('pion')];
  const [tc, td, tu] = [Math.floor(cible / 100), Math.floor((cible % 100) / 10), cible % 10];
  const avec = (m, cle, retirer) => Object.assign(m, { cle, retirer });
  if (somme(e.plateau) > cible) {
    if (c > tc) return avec(['おおすぎ！ ◆100の いたが おおいよ。 さわって おろそう。'], 'trop-cent', 'cent');
    if (d > td) return avec(['おおすぎ！ ◇10の まとまりが おおいよ。 さわって おろそう。'], 'trop-dix', 'dix');
    return avec(['おおすぎ！ ●が おおいよ。 さわって おろそう。'], 'trop-un', 'pion');
  }
  // Tant que l'élève n'a rien enlevé, on le laisse faire (seule la voix compte).
  if (!e.guide) return null;
  if (c < tc) return avec(['◆100の いたを のせよう。'], 'plus-cent');
  if (d < td) return avec([tc ? '◆100の いたは これで いいね。 ' : '', 'こんどは ◇10の まとまりを のせよう。'], 'plus-dix');
  if (u < tu) return avec([td ? '◇10の まとまりも これで いいね。 ' : tc ? '◆100の いたは これで いいね。 ' : '', 'こんどは ●を のせよう。'], 'plus-un');
  return null;
};

export function etapesKazu1() {
  const total = (e) => somme(e.plateau);
  const un = (n) => P('pion', 1, n);
  return [
    {
      dire: ['これは 10の わく。 ●を 1こずつ のせて、 10まで かぞえよう。 ', SUJI, 'と よみかたが でるよ。'],
      scene: 'compte', cadre: true, contenu: [], reserve: [un(10)], vers: 'plateau', compter: true, fini: (e) => total(e) === 10,
      bravo: [ecrit('10！ '), '「じゅう」。 わくが いっぱいに なったね。'],
    },
    {
      dire: [ecrit('5は '), '「ご」。 うえの だんが いっぱい。 5の まとまり だよ。'],
      scene: 'compte', cadre: true, contenu: [un(5)],
    },
    {
      dire: [ecrit('4は '), '「よん」。 「し」とも よむよ。 ', ecrit('7は '), '「なな」、 「しち」とも よむよ。 ', ecrit('9は '), '「きゅう」、 「く」とも よむよ。'],
      scene: 'compte', cadre: true, contenu: [un(4)], autres: true,
    },
    {
      dire: ['●を さわって、 ぜんぶ おろそう。'],
      scene: 'compte', cadre: true, contenu: [un(6)], retirer: true, vers: 'plateau', compter: true, fini: (e) => total(e) === 0,
      bravo: ['なにも ない とき、 ', SUJI, 'は ', ecrit('0。 '), '「ぜろ」と よむ。 「れい」とも よむよ。'],
    },
    {
      dire: ['●は いくつ？'],
      scene: 'compte', cadre: true, contenu: [un(7)], cache: true,
      cinq: true,
      choix: { options: [7, 6, 8], bonne: 7, unite: '', indice: ['おしい！ うえの だんを かぞえよう： いち、 に、 さん、 よん、 ご。 5の まとまり。 あと いくつ？'] },
      bravo: ['5と 2で ', ecrit('7。 '), '「なな」。'],
    },
    {
      dire: ['●を 8こ のせよう。'],
      scene: 'compte', cadre: true, contenu: [], reserve: [un(10)], vers: 'plateau', retirer: true, compter: true, cache: true,
      fini: (e) => total(e) === 8,
      pendant: guideComposition(8),
      bravo: [ecrit('8！ '), '「はち」。 10まで あと 2つ。'],
    },
  ];
}

export function etapesKazu2() {
  const total = (e) => somme(e.plateau);
  const un = (n) => P('pion', 1, n);
  const dix = (n) => P('dix', 10, n);
  return [
    {
      dire: [ecrit('10は '), '「じゅう」。 10の わくが いっぱいに なったら、 それが 「◇10の まとまり」。 ◇10の まとまりは みずいろで かくよ。 10、 20、 30と、 10ずつ かぞえられるよ。'],
      scene: 'compte', contenu: [dix(1)],
    },
    {
      dire: ['◇10の まとまりの よこに ●を のせて、 13に しよう。'],
      scene: 'compte', cadre: true, contenu: [dix(1)], reserve: [un(9)], vers: 'plateau', retirer: true, compter: true,
      fini: (e) => total(e) === 13, pendant: guideComposition(13),
      bravo: ['10と 3で ', ecrit('13。 '), '「じゅうさん」。'],
    },
    {
      dire: ['いくつ？'],
      scene: 'compte', contenu: [dix(1), un(7)], cache: true,
      choix: { options: [17, 71, 7], bonne: 17, unite: '', indice: ['おしい！ ◇10の まとまりが 1つと、 ●が 7こ。'] },
      bravo: ['10と 7で ', ecrit('17。 '), '「じゅうなな」（「じゅうしち」）。'],
    },
    {
      dire: ['◇10の まとまりを のせて、 10ずつ かぞえよう。 100まで いくよ。'],
      scene: 'compte', contenu: [], reserve: [dix(10)], vers: 'plateau', compter: true, fini: (e) => total(e) === 100,
      bravo: ['◇10が 10こで ', ecrit('100。 '), '「ひゃく」。'],
    },
    {
      dire: ['34を つくろう。 ◇10の まとまりと ●を つかってね。'],
      scene: 'compte', cadre: true, contenu: [], reserve: [dix(5), un(9)], vers: 'plateau', retirer: true, compter: true,
      fini: (e) => total(e) === 34,
      pendant: guideComposition(34),
      bravo: ['◇10が 3つで 30、 ●が 4つで 4。 ', ecrit('34、 '), '「さんじゅうよん」。'],
    },
    {
      dire: ['いくつ？'],
      scene: 'compte', contenu: [dix(5), un(2)], cache: true,
      choix: { options: [52, 25, 7], bonne: 52, unite: '', indice: ['おしい！ ◇10の まとまりは いくつ？ ●は いくつ？'] },
      bravo: ['◇10が 5つで 50、 ●が 2つで 2。 ', ecrit('52、 '), '「ごじゅうに」。'],
    },
    {
      dire: ['まとめ。 ひだりの ', SUJI, 'は、 ◇10の まとまりの かず。 みずいろの せん だよ。 みぎの ', SUJI, 'は、 ●の かず。 オレンジの せん だよ。 34は、 ◇10が 3つと ●が 4つ。'],
      scene: 'compte', contenu: [dix(3), un(4)], etiquettes: true,
    },
  ];
}

export function etapesKazu3() {
  const total = (e) => somme(e.plateau);
  const un = (n) => P('pion', 1, n);
  const dix = (n) => P('dix', 10, n);
  const cent = (n) => P('cent', 100, n);
  return [
    {
      dire: ['◇10の まとまりが 10こで 100。 ◆100の いたに なる。 「ひゃく」。'],
      scene: 'compte', contenu: [cent(1)],
    },
    {
      dire: ['◆100の いたを のせて、 100ずつ かぞえよう。 よみかたが かわる ところを きいてね。'],
      scene: 'compte', contenu: [], reserve: [cent(9)], vers: 'plateau', compter: true, fini: (e) => total(e) === 900,
      bravo: ['◆100が 3つで 「さんびゃく」、 ◆100が 6つで 「ろっぴゃく」、 ◆100が 8つで 「はっぴゃく」。 よみかたが すこし かわるね。'],
    },
    {
      dire: ['235を つくろう。'],
      scene: 'compte', contenu: [], reserve: [cent(4), dix(9), un(9)], vers: 'plateau', retirer: true, compter: true,
      fini: (e) => total(e) === 235,
      pendant: guideComposition(235),
      bravo: ['◆100が 2つ、 ◇10が 3つ、 ●が 5つ。 ', ecrit('235、 '), '「にひゃく さんじゅう ご」。'],
    },
    {
      dire: ['いくつ？'],
      scene: 'compte', contenu: [cent(4), un(8)], cache: true,
      choix: { options: [408, 48, 480], bonne: 408, unite: '', indice: ['おしい！ ◆100の いたは いくつ？ ◇10の まとまりは ある？'] },
      bravo: ['◆100が 4つ、 ◇10の まとまりは ない、 ●が 8つ。 ', ecrit('408、 '), '「よんひゃく はち」。 10の ところは 0 だよ。'],
    },
    {
      dire: ['◆100の いたを 10まい のせると…'],
      scene: 'compte', contenu: [cent(9)], reserve: [cent(1)], vers: 'plateau', compter: true, fini: (e) => total(e) === 1000,
      bravo: [ecrit('1000！ '), '「せん」。 ◆100が 10こで 1000。'],
    },
    {
      dire: ['まとめ。 ', SUJI, 'は、 ひだりから 100の かず、 10の かず、 ●の かず。 むらさき、 みずいろ、 オレンジの じゅん だよ。 ', ecrit('235は '), '「にひゃく さんじゅう ご」。'],
      scene: 'compte', contenu: [cent(2), dix(3), un(5)], etiquettes: true,
    },
  ];
}

// La scène des leçons かず : le nombre (et sa lecture) en grand, puis les plaques, barres et jetons.
export function creerCompteLecon(W, H) {
  const el = document.createElement('div');
  el.className = 'compte-lecon';
  el.style.setProperty('--c', `${Math.max(10, Math.min(24, W / 30, H / 14))}px`);
  el.innerHTML = '<div class="compte-affiche"></div><div class="compte-plateau"></div>';
  el.geo = { taille: 40, s: Math.max(18, Math.min(30, W / 24)), W, H };
  return el;
}

export function majCompteLecon(el, e) {
  const et = e.etape;
  const n = somme(e.plateau);
  const cache = et.cache && !e.resolu;
  el.querySelector('.compte-affiche').innerHTML = cache
    ? '<span class="nb"><span class="nb-chiffre">？</span></span>'
    : nombreYomi(n, true) + (et.autres && AUTRES_YOMI[n] ? `<span class="nb-autre">（${AUTRES_YOMI[n]}）</span>` : '');
  const plateau = el.querySelector('.compte-plateau');
  const nb = (v) => e.plateau.filter((x) => x.v === v).length;
  plateau.innerHTML = htmlBlocs(n, { cadreVide: et.cadre, etiquettes: et.etiquettes, compte: true, parties: { c: nb('cent'), d: nb('dix'), u: nb('pion') } });
  // 「5の まとまりと、 あと いくつ？」 : après une erreur, la rangée du haut descend sous le cadre, en plus
  // gros, et se compte 1 à 5 ; le reste attend (＋ ？). Une fois trouvé : 5 ＋ 2 ＝ 7, comptés 6, 7.
  el.querySelector('.aide-cinq')?.remove();
  if (et.cinq && (e.essais.size || e.resolu)) {
    const reste = n - 5;
    const pas = 0.62;
    const aide = document.createElement('div');
    aide.className = 'aide-cinq';
    const rond = (k, num) => `<i class="plein"><b style="animation-delay:${(0.5 + num * pas).toFixed(2)}s">${k}</b></i>`;
    aide.innerHTML = `<span class="groupe-cinq">${Array.from({ length: 5 }, (_, k) => rond(k + 1, k)).join('')}<small>5の まとまり</small></span>`
      + '<b class="signe">＋</b>'
      + `<span class="groupe-reste">${e.resolu
        ? Array.from({ length: reste }, (_, k) => rond(k + 6, k + 5)).join('')
        : `${'<i class="plein"></i>'.repeat(reste)}`}<small>${e.resolu ? `あと ${reste}` : 'あと ？'}</small></span>`;
    el.append(aide);
  }
  // Aussi gros que la place le permet (sur téléphone, le cadre était minuscule) ; la rangée 1 2 3 4 5 ＋ 6 7
  // doit aussi tenir en largeur.
  if (el.geo.W) {
    ajusterCases(el, el.geo.W, el.geo.H, 46, 10);
    const rangee = el.querySelector('.aide-cinq');
    let c = parseFloat(el.style.getPropertyValue('--c')) || 20;
    while (rangee && c > 10 && rangee.scrollWidth > el.geo.W - 4) {
      c -= 2;
      el.style.setProperty('--c', `${c}px`);
    }
  }
  // On touche une plaque, un « 10の まとまり » ou un jeton pour l'enlever.
  if (et.retirer && !e.resolu) {
    const enlever = (v) => {
      const p = [...e.plateau].reverse().find((x) => x.v === v);
      if (p) enleverPiece('plateau', p.id);
    };
    // Tout le cadre ou toute la plaque est la cible (un jeton de 12 px ne se vise pas) : une touche enlève une pièce.
    const retrait = (x, v, label) => {
      x.setAttribute('role', 'button');
      x.tabIndex = 0;
      x.setAttribute('aria-label', label);
      x.classList.add('enlevable');
      activable(x, () => enlever(v));
    };
    plateau.querySelectorAll('.plaque100').forEach((x) => retrait(x, 'cent', '100の いたを 1まい おろす'));
    plateau.querySelectorAll('.cadre10.dix').forEach((x) => retrait(x, 'dix', '10の まとまりを 1つ おろす'));
    plateau.querySelectorAll('.cadre10:not(.dix)').forEach((x) => retrait(x, 'pion', 'まるを 1こ おろす'));
    plateau.classList.add('enlevable');
  }
}

/* ----- Objets décalés ou penchés (activités 8 et 9) ----- */
