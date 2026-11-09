/* ======================================================================
   ね、しっていた？ : からだで はかる (あた, ひろ), しゃくと すん, ごうと しょう
   ====================================================================== */

import { P, somme } from './moteur.js';
import { CHIISA, ME, MI, NAGA, ONAJI, OOKI, segU, SUJI } from '../texte.js';

// からだで はかる : あた (empan) d'un enfant et d'un adulte sur le même bureau, puis la règle.
const BUREAU = 72;
export function etapesCorps() {
  const mains = (e, v) => somme(e.plateau.filter((p) => p.v === v));
  return [
    {
      dire: ['むかしは ものさしが なかった。 からだで ', NAGA, 'さを はかったよ。 おやゆびと なかゆびを ひろげた ', NAGA, 'さを 「あた」と いう。'],
      scene: 'corps', contenu: [],
    },
    {
      dire: ['こどもの てで、 つくえの ', NAGA, 'さを はかろう。 てを さわって、 ならべよう。'],
      scene: 'corps', contenu: [], reserve: [P('teEnfant', 12, 8)], vers: 'plateau', fini: (e) => mains(e, 'teEnfant') >= BUREAU,
      bravo: ['つくえは こどもの あた 6つ ぶん。'],
    },
    {
      dire: ['こんどは おとなの てで はかろう。'],
      scene: 'corps', contenu: [P('teEnfant', 12, 6)], reserve: [P('teAdulte', 18, 6)], vers: 'plateau', fini: (e) => mains(e, 'teAdulte') >= BUREAU,
      bravo: ['おとなの あた 4つ ぶん。 こどもは 6つ、 おとなは 4つ。 ', ONAJI, 'じ つくえ なのに、 ', SUJI, 'が ちがうね。'],
    },
    {
      dire: ['ひとに よって ちがうと こまるね。 だから、 だれが はかっても ', ONAJI, 'じに なる 「cm」や 「m」が つくられたよ。 つくえは ', segU(72, 'cm'), '。'],
      scene: 'corps', regle: true, contenu: [P('teEnfant', 12, 6), P('teAdulte', 18, 4)],
    },
    {
      dire: ['りょうてを ひろげた ', NAGA, 'さは 「ひろ」。 せの たかさと だいたい ', ONAJI, 'じ だよ。 おうちの ひとと くらべて みよう！'],
      scene: 'hiro',
    },
  ];
}

// しゃくと すん : 1 寸 ≈ 3 cm (一寸法師), 10 寸 = 1 尺 ≈ 30 cm (une règle de 30 cm).
export function etapesShaku() {
  return [
    {
      dire: ['むかしの にほんでは、 ', NAGA, 'さを 「すん」と 「しゃく」で あらわしたよ。 うえが すん、 したが cm。'],
      scene: 'shaku',
    },
    {
      dire: ['1すんは だいたい ', segU(3, 'cm'), '。 おやゆびの はばくらい。'],
      scene: 'shaku', surligne: 'sun',
    },
    {
      dire: ['むかしばなしの 「いっすんぼうし」。 せの たかさは 1すん。 ', segU('なん', 'cm'), ' くらい？'],
      scene: 'shaku', surligne: 'sun', boushi: true,
      choix: { options: [3, 30, 100], bonne: 3, unite: 'cm', indice: ['おしい！ 1すんは だいたい ', segU(3, 'cm'), '。 ものさしを ', MI, 'てね。'] },
      bravo: ['いっすんぼうしは だいたい ', segU(3, 'cm'), '。 とても ', CHIISA, 'さいね！'],
    },
    {
      dire: ['10すんで 1しゃく。 1しゃくは だいたい ', segU(30, 'cm'), '。 30 cm の ものさしと ほとんど ', ONAJI, 'じ ', NAGA, 'さ。'],
      scene: 'shaku', surligne: 'shaku',
    },
    {
      dire: ['いまでも だいくさんは 「しゃく」や 「すん」を つかう ことが あるよ。 はしらや いたの ', NAGA, 'さ だね。'],
      scene: 'shaku', surligne: 'shaku',
    },
  ];
}

// ごうと しょう : la mesure du riz, encore utilisée : 1 合 = 180 mL, 10 合 = 1 升 = 1,8 L.
export function etapesGou() {
  const total = (e) => somme(e.plateau);
  return [
    {
      dire: ['これは 1ごうの カップ。 おこめを はかる ときに、 いまも つかうよ。 すいはんきの ', ME, 'もりも 「ごう」だね。'],
      scene: 'verre', contenu: [], reserve: [P('gou', 180, 1)], vers: 'plateau',
    },
    {
      dire: ['1ごうの カップで、 みずを 1かい いれよう。'],
      scene: 'verre', contenu: [], reserve: [P('gou', 180, 5)], vers: 'plateau', fini: (e) => total(e) === 180,
      bravo: [segU(180, 'ml'), '。 1ごうは ', segU(180, 'ml'), '。'],
    },
    {
      dire: ['もう 1かい いれよう。'],
      scene: 'verre', contenu: [P('gou', 180)], reserve: [P('gou', 180, 4)], vers: 'plateau', fini: (e) => total(e) === 360,
      bravo: ['2ごうで ', segU(360, 'ml'), '。 「おこめを 2ごう たく」と いうね。'],
    },
    {
      dire: ['3ごうは ', segU('なん', 'ml'), '？ 180が 3つ だよ。'],
      scene: 'verre', contenu: [], reserve: [P('gou', 180, 3)], vers: 'plateau',
      choix: { options: [540, 300, 180], bonne: 540, unite: 'mL', indice: ['おしい！ 1ごうは ', segU(180, 'ml'), '。 それが 3つ だよ。'] },
      bravo: ['180が 3つで ', segU(540, 'ml'), '。'],
    },
    {
      dire: ['10ごうで 1しょう。 1しょうは ', segU(1.8, 'l'), '（', segU(1800, 'ml'), '）。 ', OOKI, 'きな びんを 「いっしょうびん」と いうよ。'],
      scene: 'verre', cap: 2000, bouteille: true, contenu: [P('gou', 180, 10)],
    },
  ];
}

// Un bureau de 72 cm ; dessous, les empans (あた) de l'enfant puis ceux de l'adulte.
export function creerCorpsLecon(W, H, et) {
  const el = document.createElement('div');
  el.className = 'corps-lecon';
  const hTotal = Math.max(150, Math.min(H, 320));
  const x0 = 16;
  const ppc = (W - 2 * x0 - 40) / BUREAU;
  const hRang = Math.max(44, Math.min(78, (hTotal - (et.regle ? 96 : 58)) / 2));
  el.style.width = `${W}px`;
  el.style.height = `${hTotal}px`;
  let contenu = `<span class="bureau" style="left:${x0}px;width:${BUREAU * ppc}px">つくえ</span>`;
  ['teEnfant', 'teAdulte'].forEach((v, k) => {
    contenu += `<span class="rang" data-v="${v}" style="top:${42 + k * (hRang + 6)}px;height:${hRang}px"></span>`;
  });
  if (et.regle) {
    const y = 42 + 2 * (hRang + 6);
    let traits = '';
    for (let c = 0; c <= BUREAU; c += 2) {
      const x = c * ppc;
      const grand = c % 10 === 0;
      traits += `<line x1="${x}" y1="0" x2="${x}" y2="${grand ? 12 : 6}"/>`;
      if (grand) traits += `<text x="${x}" y="26">${c}</text>`;
    }
    traits += `<line x1="${BUREAU * ppc}" y1="0" x2="${BUREAU * ppc}" y2="14" class="fin"/><text class="unite" x="${BUREAU * ppc + 4}" y="26">72 cm</text>`;
    contenu += `<div class="regle" style="left:${x0}px;top:${y}px;width:${BUREAU * ppc}px"><svg width="${BUREAU * ppc + 60}" height="32" aria-hidden="true">${traits}</svg></div>`;
  }
  el.innerHTML = contenu;
  el.geo = { ppc, x0, hRang, taille: 36, s: 26 };
  return el;
}

export function majCorpsLecon(el, e) {
  const { ppc, x0, hRang } = el.geo;
  el.querySelectorAll('.rang').forEach((rang) => {
    const v = rang.dataset.v;
    const mains = e.plateau.filter((p) => p.v === v);
    rang.replaceChildren();
    if (!mains.length) return;
    let x = x0;
    mains.forEach((p, k) => {
      const empan = document.createElement('span');
      empan.className = `empan ${v}`;
      empan.style.left = `${x}px`;
      empan.style.width = `${p.m * ppc}px`;
      empan.innerHTML = `<span class="main" style="font-size:${Math.min(hRang * 0.5, p.m * ppc * 0.8)}px">✋</span><span class="numero-empan">${k + 1}</span>`;
      rang.append(empan);
      x += p.m * ppc;
    });
    const nom = document.createElement('span');
    nom.className = 'rang-nom';
    nom.style.left = `${x + 6}px`;
    nom.textContent = v === 'teEnfant' ? 'こども' : 'おとな';
    rang.append(nom);
  });
}

// Une règle de 32 cm : en haut les 寸 (1 寸 ≈ 3,03 cm), en bas les cm.
export function creerShakuLecon(W, H, et) {
  const el = document.createElement('div');
  el.className = 'shaku-lecon';
  const x0 = 16;
  const L = 32;
  const SUN = 3.03;
  const ppc = (W - 2 * x0) / L;
  const hBoushi = et.boushi ? Math.max(30, Math.min(110, SUN * ppc * 1.8, H - 170)) : 0;
  const y = 44 + hBoushi;
  const hR = 72;
  // Texte un peu plus grand sur grand écran.
  el.style.setProperty('--t', `${Math.max(11, Math.min(17, ppc * 0.5))}px`);
  let t = `<rect class="bois" x="${x0}" y="${y}" width="${L * ppc}" height="${hR}" rx="4"/>`;
  if (et.surligne) {
    const fin = et.surligne === 'sun' ? SUN : SUN * 10;
    t += `<rect class="surligne" x="${x0}" y="${y}" width="${fin * ppc}" height="${hR}"/>`;
    const texte = et.surligne === 'sun' ? '1すん ≈ 3 cm' : '1しゃく ≈ 30 cm';
    t += `<text class="titre-sun" x="${Math.max(x0 + 50, x0 + (fin * ppc) / 2)}" y="${y - 8 - hBoushi}">${texte}</text>`;
  }
  for (let k = 0; k <= 10; k++) {
    const x = x0 + k * SUN * ppc;
    t += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 24}"/>`;
    if (k) t += `<text x="${x - (SUN * ppc) / 2}" y="${y + 20}" class="petit">${k}</text>`;
  }
  // Les unités, hors de la règle (elles ne gênent pas les nombres) : すん au-dessus, cm en dessous.
  t += `<text class="unite-gauche" x="${x0 + L * ppc - 18}" y="${y - 8}">すん</text>`;
  for (let c = 0; c <= L; c++) {
    const x = x0 + c * ppc;
    const grand = c % 5 === 0;
    if (ppc >= 5 || grand) t += `<line x1="${x}" y1="${y + hR}" x2="${x}" y2="${y + hR - (grand ? 16 : 8)}"/>`;
    if (grand) t += `<text x="${x}" y="${y + hR - 22}">${c}</text>`;
  }
  t += `<text class="unite-gauche" x="${x0 + L * ppc - 14}" y="${y + hR + 18}">cm</text>`;
  el.innerHTML = `<svg width="${W}" height="${y + hR + 26}" aria-hidden="true">${t}</svg>`;
  if (et.boushi) {
    const b = document.createElement('span');
    b.className = 'boushi';
    b.textContent = '🧒';
    b.style.left = `${x0 + (SUN * ppc) / 2}px`;
    b.style.top = `${y - 2}px`;
    b.style.fontSize = `${hBoushi * 0.85}px`;
    el.append(b);
  }
  el.geo = { taille: 40, s: 26 };
  return el;
}

// 「ひろ」 : les bras écartés, à peu près la taille.
export function creerHiroLecon(W, H) {
  const el = document.createElement('div');
  el.className = 'hiro-lecon';
  const h = Math.max(140, Math.min(H - 10, 320));
  el.innerHTML = `<svg viewBox="0 0 250 220" height="${h}" aria-hidden="true">`
    + '<path class="fleche" d="M30 22h170M30 22l8-6M30 22l8 6M200 22l-8-6M200 22l-8 6"/><text x="115" y="14">ひろ</text>'
    + '<path class="fleche" d="M222 36v174M222 36l-6 8M222 36l6 8M222 210l-6-8M222 210l6-8"/><text x="238" y="128">せ</text>'
    + '<circle class="personnage" cx="115" cy="50" r="14"/><path class="personnage" d="M115 64v80M30 82h170M115 144l-28 64M115 144l28 64"/>'
    + '</svg>';
  el.geo = { taille: 40, s: 26 };
  return el;
}
