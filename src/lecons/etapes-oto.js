/* ======================================================================
   べんきょう かず : 「おとが かわる かぞえかた」
   Les compteurs dont le son change avec le nombre : いっぽん, さんぼん, ろっぽん…
   C'est à retenir par cœur ; la leçon montre le tableau 1 → 10 (les sons qui changent
   en orange, chaque case se touche pour l'entendre), fait choisir la bonne lecture,
   puis montre que pour les grands nombres, c'est le DERNIER chiffre qui décide
   (じゅういっぽん, にじゅっぽん).
   ====================================================================== */

import { explicationSon, fautesLecture } from '../questions/kazu.js';
import { echapper, melanger } from '../outils.js';
import { activable } from '../tactile.js';
import { compteur, COMPTEURS, compteursActifs, OOKI, SUJI, V, YOMI_DIX, YOMI_UN } from '../texte.js';
import { parler } from '../voix.js';

// Ce qu'on compte avec chaque compteur, dans l'ordre de la leçon (ほん d'abord : le modèle 1, 3, 6, 8, 10).
const CHOSES = {
  'ほん': { nom: 'えんぴつ', emoji: '✏️' },
  'ひき': { nom: 'さかな', emoji: '🐟' },
  'こ': { nom: 'りんご', emoji: '🍎' },
  'さつ': { nom: 'ノート', emoji: '📓' },
  'にん': { nom: 'こども', emoji: '🧒' },
};
const ORDRE = ['ほん', 'ひき', 'こ', 'さつ', 'にん'];

// La lecture d'un nombre jusqu'à 99 avec son compteur : c'est le dernier chiffre qui décide.
// 16 → じゅう + ろっぽん ; 20 → に + じゅっぽん.
export function lectureCompteur(n, c) {
  if (n <= 10) return compteur(n, c).y;
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (!u) return `${YOMI_DIX[d].replace(/じゅう$/, '')}${COMPTEURS[c].yomi[9]}`;
  return `${YOMI_DIX[d]}${COMPTEURS[c].yomi[u - 1]}`;
}
const dernier = (n) => (n % 10 || 10);
const change = (n, c) => COMPTEURS[c].change.includes(n <= 10 ? n : dernier(n));

// La lecture avec ce qui change en gras : ろっ|ぽん (le nombre et/ou le compteur).
function lectureMarquee(n, c) {
  const y = lectureCompteur(n, c);
  if (!change(n, c)) return echapper(y);
  if (c === 'にん') return `<b>${echapper(y)}</b>`;
  const u = dernier(n);
  const base = COMPTEURS[c].yomi[u - 1];   // ろっぽん
  const avant = y.slice(0, y.length - base.length);   // じゅう
  const simple = YOMI_UN[u] || 'じゅう';
  const debut = base.slice(0, base.length - c.length);
  const fin = base.slice(base.length - c.length);
  const marque = (x, ok) => (ok ? echapper(x) : `<b>${echapper(x)}</b>`);
  return `${echapper(avant)}${marque(debut, debut === simple)}${marque(fin, fin === c)}`;
}

const listeDite = (c, nombres) => V('', ` ${nombres.map((n) => lectureCompteur(n, c)).join('、 ')}。`);
const nombresQuiChangent = (c) => COMPTEURS[c].change.join('、 ');

// Une étape « choisir la lecture » : la chose, le nombre, trois lectures (une juste).
function etapeChoix(c, n) {
  const { nom } = CHOSES[c];
  const juste = lectureCompteur(n, c);
  const fautes = n <= 10 ? fautesLecture(n, c) : fautesLecture(dernier(n), c).map((f) => `${YOMI_DIX[Math.floor(n / 10)].replace(n % 10 ? /$/ : /じゅう$/, '')}${f}`);
  return {
    dire: [nom, 'は ', COMPTEURS[c].question, '？'],
    scene: 'oto', oto: { c, question: n },
    choix: {
      options: melanger([juste, ...fautes.filter((f) => f !== juste).slice(0, 2)]), bonne: juste, texte: true,
      indice: (choisi) => (n <= 10
        ? explicationSon(c, n, choisi)
        : ['おしい！ さいごの ', SUJI, 'は ', String(dernier(n)), '。 ', String(dernier(n)), 'の ときと おなじ： 「', COMPTEURS[c].yomi[dernier(n) - 1], '」。']),
    },
    bravo: ['「', juste, '」。', change(n, c) ? ' おとが かわる かずだね。' : ' おとは かわらないね。'],
  };
}

export function etapesOto() {
  let liste = ORDRE.filter((c) => compteursActifs().includes(c));
  if (!liste.length) liste = ['ほん', 'こ'];
  const dix = Array.from({ length: 10 }, (_, k) => k + 1);
  const etapes = [];
  let modele = null;   // le premier compteur « 1, 3, 6, 8, 10 » vu : on compare les suivants avec lui
  liste.forEach((c) => {
    const { nom } = CHOSES[c];
    let dire;
    if (c === 'にん') {
      dire = ['ひとは 「にん」で かぞえる。 でも 1は 「ひとり」、 2は 「ふたり」、 4は 「よにん」。 とくべつ だよ。 おぼえよう。'];
    } else if (modele && COMPTEURS[modele].change.join() === COMPTEURS[c].change.join()) {
      dire = [nom, 'は 「', c, '」。 「', modele, '」と おなじ： ', nombresQuiChangent(c), 'で おとが かわるよ。'];
    } else {
      dire = [nom, 'は 「', c, '」で かぞえる。 オレンジの ', SUJI, 'は おとが かわるよ： ', nombresQuiChangent(c), '。'];
    }
    etapes.push({ dire: [...dire, listeDite(c, dix)], scene: 'oto', oto: { c, nombres: dix } });
    // Deux lectures à choisir : une qui change (la plus « piège »), une qui ne change pas ou une autre qui change.
    const qui = melanger(COMPTEURS[c].change.filter((n) => n > 1 || c === 'にん'));
    const autre = melanger(dix.filter((n) => n !== qui[0] && (c !== 'にん' || n <= 5)));
    etapes.push(etapeChoix(c, qui[0] || 1));
    etapes.push(etapeChoix(c, autre[0]));
    if (!modele && c !== 'にん') modele = c;
  });
  // Les grands nombres : le dernier chiffre décide (pas pour 「にん」 : じゅういちにん).
  if (modele) {
    const grands = [11, 13, 16, 18, 20];
    etapes.push({
      dire: [SUJI, 'が ', OOKI, 'きく なっても、 さいごの ', SUJI, 'を みれば いいよ。 11は 1で おわる： 「', lectureCompteur(11, modele), '」。', listeDite(modele, grands)],
      scene: 'oto', oto: { c: modele, nombres: grands },
    });
    etapes.push(etapeChoix(modele, melanger([16, 21, 18, 31])[0]));
  }
  etapes.push({
    dire: ['まとめ。 おとが かわる ', SUJI, 'を おぼえよう。 さわると きこえるよ。'],
    scene: 'oto', oto: { resume: liste },
  });
  return etapes;
}

/* ----- La scène : le tableau des lectures, la question, ou le résumé ----- */

function caseLecture(n, c, { cachee = false, petite = false } = {}) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `case-oto${change(n, c) ? ' change' : ''}${petite ? ' petite' : ''}`;
  b.innerHTML = `<span class="oto-nombre">${n}</span><span class="oto-yomi">${cachee ? '？' : lectureMarquee(n, c)}</span>`;
  b.setAttribute('aria-label', cachee ? `${n}` : lectureCompteur(n, c));
  if (!cachee) activable(b, () => parler(lectureCompteur(n, c)), { garde: false });
  return b;
}

export function creerOtoLecon(W, H, et) {
  const el = document.createElement('div');
  el.className = 'oto-lecon';
  const { c, nombres, question, resume } = et.oto;
  if (resume) {
    el.classList.add('oto-resume');
    resume.forEach((k) => {
      const ligne = document.createElement('div');
      ligne.className = 'oto-ligne';
      ligne.innerHTML = `<span class="oto-chose" aria-hidden="true">${CHOSES[k].emoji}</span><span class="oto-compteur" data-emoji="${CHOSES[k].emoji}">${k}</span>`;
      COMPTEURS[k].change.forEach((n) => ligne.append(caseLecture(n, k, { petite: true })));
      el.append(ligne);
    });
  } else if (question) {
    el.classList.add('oto-question');
    const tas = document.createElement('div');
    tas.className = 'oto-tas';
    tas.setAttribute('aria-hidden', 'true');
    // Jusqu'à 10 : les choses, en rangées de 5. Au-delà, une seule (le nombre suffit, et 31 crayons ne tiennent pas).
    const montres = question <= 10 ? question : 1;
    tas.innerHTML = Array.from({ length: montres }, () => `<span>${CHOSES[c].emoji}</span>`).join('');
    tas.style.setProperty('--n', String(Math.min(5, montres)));
    el.append(tas, caseLecture(question, c, { cachee: true }));
  } else {
    el.classList.add('oto-tableau');
    // Les grands nombres (じゅういっぽん) sont longs : 3 colonnes quand la scène est étroite.
    el.style.setProperty('--colonnes', String(nombres.length > 5 || W >= 600 ? Math.min(5, nombres.length) : 3));
    el.style.setProperty('--lignes', String(Math.ceil(nombres.length / 2)));
    const chose = document.createElement('div');
    chose.className = 'oto-entete';
    chose.innerHTML = `<span aria-hidden="true">${CHOSES[c].emoji}</span> ${echapper(CHOSES[c].nom)}：「${echapper(c)}」`;
    el.append(chose);
    const grille = document.createElement('div');
    grille.className = 'oto-grille';
    nombres.forEach((n, i) => {
      const b = caseLecture(n, c);
      b.style.setProperty('--i', String(i));
      grille.append(b);
    });
    el.append(grille);
  }
  el.geo = { s: 26, taille: 40 };
  return el;
}
