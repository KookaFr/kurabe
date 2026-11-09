/* ======================================================================
   Leçons かさ : はんぶんこ et まぜて みよう — verser tant qu'on appuie
   ====================================================================== */

import { creerVerre, etiquetteMesure } from '../dessins.js';
import { ecranActuel } from '../ecrans.js';
import { etude, messageEtude, rendreEtude } from '../etude/etude.js';
import { equationLecon, majLecon, verifierLecon } from './moteur.js';
import { $ } from '../outils.js';
import { reglages } from '../reglages.js';
import { activable } from '../tactile.js';
import { htmlMots, K, lecture, MI, nombreUnite, ONAJI, OO_I, PHRASES, segU, uniteHtml } from '../texte.js';
import { parler, sons } from '../voix.js';

// はんぶんこ : une ピッチャー et deux コップ identiques (300 mL). On appuie sur la コップ à remplir ;
// ça coule tant qu'on appuie. Quand la ピッチャー est vide, appuyer sur une コップ y verse l'autre :
// c'est ainsi qu'on rattrape (« ひだりから すこし うつそう »).
// まぜて みよう : deux liquides en haut, une grande コップ en bas ; on appuie sur le liquide à verser.
// La couleur du mélange suit les quantités (あお ＋ きいろ ＝ みどり ; シロップ ＋ みず : こい / うすい).
const COULEURS_LIQ = { bleu: '#3b82f6', jaune: '#facc15', rouge: '#ef4444', eau: '#cfe9f8', sirop: '#d6224f' };
const MELANGES = { 'bleu+jaune': '#2fa55a', 'jaune+rouge': '#f47c20', 'bleu+rouge': '#8b4bc4' };
const NOMS_LIQ = {
  bleu: ['あおい ', K('水', 'みず')], jaune: ['きいろい ', K('水', 'みず')], rouge: ['あかい ', K('水', 'みず')],
  eau: [K('水', 'みず')], sirop: ['シロップ'],
};
const DEBIT = 70;          // mL par seconde (ピッチャー, liquides de まぜて みよう)
const DEBIT_RETOUR = 35;   // d'une コップ à l'autre : plus doucement, pour ajuster
const CAP_VERRE = 300;     // les deux コップ de はんぶんこ
const CAP_GRAND = 400;     // la grande コップ de まぜて みよう

// La couleur d'un mélange (parts : [{ cle, ml }]).
function couleurMelange(parts) {
  const p = parts.filter((x) => x.ml > 0.5);
  if (!p.length) return COULEURS_LIQ.eau;
  if (p.length === 1) return COULEURS_LIQ[p[0].cle];
  const [a, b] = p;
  const total = a.ml + b.ml;
  const eau = p.find((x) => x.cle === 'eau');
  if (eau) {
    // Diluer : moins il y a de シロップ, plus c'est clair.
    const s = p.find((x) => x !== eau);
    const f = Math.round(100 * (s.ml / total) ** 0.6);
    return `color-mix(in oklab, ${COULEURS_LIQ[s.cle]} ${f}%, ${COULEURS_LIQ.eau})`;
  }
  const m = MELANGES[[a.cle, b.cle].sort().join('+')] || COULEURS_LIQ[a.cle];
  const r = b.ml / total;
  return r <= 0.5
    ? `color-mix(in oklab, ${COULEURS_LIQ[a.cle]} ${Math.round(100 * (1 - 2 * r))}%, ${m})`
    : `color-mix(in oklab, ${m} ${Math.round(100 * (2 - 2 * r))}%, ${COULEURS_LIQ[b.cle]})`;
}

// L'état d'une étape (e.liq), à partir de sa description (et.versement).
export function nouveauVersement(v) {
  if (v.total) {
    const moitie = v.total / 2;
    return { mode: 'hanbun', total: v.total, pichet: v.fait ? 0 : v.total, verres: v.fait ? [moitie, moitie] : [0, 0], ligne: v.ligne, demo: v.demo, montrer: Boolean(v.fait) };
  }
  if (v.sources) return { mode: 'maze', sources: v.sources.map((s) => ({ ...s, reste: s.ml })), parts: v.sources.map((s) => ({ cle: s.cle, ml: 0 })) };
  return { mode: 'resultats', resultats: v.resultats, bonne: v.bonne, noms: v.noms, essais: new Set(), trouve: false };
}

const tolHanbun = (L) => Math.max(8, L.total * 0.05);

// はんぶんこ réussi : la ピッチャー est vide et les deux コップ sont à la même hauteur (à 5 % près) ;
// on les égalise alors exactement (la moitié).
function hanbunFini(e) {
  const L = e.liq;
  const ok = L.pichet <= 0.5 && Math.abs(L.verres[0] - L.verres[1]) <= tolHanbun(L);
  if (ok) {
    L.verres = [L.total / 2, L.total / 2];
    L.pichet = 0;
    L.montrer = true;
  }
  return ok;
}

// Ce qu'on dit après avoir relâché (はんぶんこ). m.cible : la コップ sur laquelle appuyer.
function hanbunConseil(e) {
  const L = e.liq;
  const [a, b] = L.verres;
  const cote = (i) => (i === 0 ? 'ひだり' : 'みぎ');
  const avec = (m, cle, poser) => Object.assign(m, { cle, poser });
  if (L.pichet > 0.5) {
    if (a < 0.5 && b < 0.5) return null;
    if (Math.abs(a - b) <= tolHanbun(L)) return avec(['いいね、 ', ONAJI, 'じ たかさ。 のこりも ', ONAJI, 'じだけ わけよう。'], 'pareil');
    const moins = a < b ? 0 : 1;
    return avec(['まだ ピッチャーに のこって いるよ。 ', cote(moins), 'の コップが すくないね。'], `pichet-${moins}`, moins);
  }
  const plus = a > b ? 0 : 1;
  const moins = 1 - plus;
  return avec([cote(plus), 'の ほうが ', OO_I, 'いね。 ', cote(moins), 'の コップを おして、 ', cote(plus), 'から すこし うつそう。'], `retour-${moins}`, moins);
}

function mazeFini(e) {
  const L = e.liq;
  const ok = L.sources.every((s) => s.reste <= 0.5);
  if (ok) L.sources.forEach((s, k) => { s.reste = 0; L.parts[k].ml = s.ml; });
  return ok;
}

function mazeConseil(e) {
  const L = e.liq;
  const avec = (m, cle, poser) => Object.assign(m, { cle, poser });
  const entame = L.sources.findIndex((s) => s.reste > 0.5 && s.reste < s.ml - 0.5);
  if (entame >= 0) return avec([...NOMS_LIQ[L.sources[entame].cle], 'が まだ のこって いるよ。 ぜんぶ いれよう。'], `reste-${entame}`, entame);
  const versees = L.sources.filter((s) => s.reste <= 0.5).length;
  if (!versees) return null;
  const k = L.sources.findIndex((s) => s.reste > 0.5);
  return avec(['こんどは ', ...NOMS_LIQ[L.sources[k].cle], 'も いれよう。'], `autre-${k}`, k);
}

// Question « どっちが こい？ » : on touche une コップ.
function toucherResultat(k) {
  const e = etude;
  const L = e.liq;
  if (!L || L.mode !== 'resultats' || e.resolu || L.essais.has(k)) return;
  if (k === L.bonne) {
    L.trouve = true;
    verifierLecon(null);
    return;
  }
  L.essais.add(k);
  sons.oups();
  const message = e.etape.indice || ['もう いっかい！ いろを よく ', MI, 'てね。'];
  messageEtude(message);
  parler(message);
  majLecon();
}

/* Le geste : verser tant qu'on appuie (k : la コップ à remplir, ou le liquide à verser). */
export let versementEnCours = null;
let rendreApresVersement = false;   // l'écran a changé de taille pendant un versement : redessiner après

const PAR_TOUCHE = 20;   // mL versés par touche, quand on ne peut pas maintenir l'appui
function appuyerVersement(k) {
  const e = etude;
  if (!e || !e.liq || e.resolu || e.liq.demo) return;
  if (reglages.verserParTouche) {
    if (versementEnCours) return;
    const L = e.liq;
    const niveau = L.mode === 'hanbun' ? L.verres[k] : L.parts[k].ml;
    lancerVersement(k, niveau + PAR_TOUCHE);
    return;
  }
  lancerVersement(k);
}

function lacherVersement(k) {
  if (reglages.verserParTouche) return;   // la touche verse 20 mL puis s'arrête seule
  const v = versementEnCours;
  if (v && v.k === k && !v.fin) arreterVersement(true);
}

// limite (démonstration) : s'arrêter quand la コップ k atteint cette quantité ; fin : à faire ensuite.
function lancerVersement(k, limite, fin) {
  arreterVersement(false);
  const e = etude;
  // La source est fixée au moment où l'on appuie : quand la ピッチャー est vide, on s'arrête (on ne se
  // met pas à vider l'autre コップ sans le vouloir).
  const v = { k, dernier: performance.now(), limite, fin, etape: e.etape, source: sourceVersement(e.liq, k) };
  versementEnCours = v;
  if (!versementPossible(e.liq, k)) {
    versementEnCours = null;
    if (fin) fin();
    return;
  }
  $('etude-plan').classList.add('en-versement');
  majVersement(e);
  const pas = (t) => {
    if (versementEnCours !== v || !etude || etude.etape !== v.etape) return;
    const dt = Math.min(0.05, Math.max(0, (t - v.dernier) / 1000));
    v.dernier = t;
    const bouge = verserUnPeu(etude.liq, k, dt, limite, v.source);
    majVersement(etude);
    if (bouge) v.raf = requestAnimationFrame(pas);
    else arreterVersement(true);
  };
  v.raf = requestAnimationFrame(pas);
}

export function arreterVersement(verifier) {
  const v = versementEnCours;
  if (!v) return;
  versementEnCours = null;
  cancelAnimationFrame(v.raf);
  $('etude-plan').classList.remove('en-versement');
  if (rendreApresVersement) {
    rendreApresVersement = false;
    setTimeout(() => { if (ecranActuel === 'etude' && etude) rendreEtude(); }, 60);
  }
  if (!etude || etude.etape !== v.etape) return;
  majVersement(etude);
  if (v.fin) v.fin();
  else if (verifier) verifierLecon(null);
}

// D'où ça coule : la ピッチャー (はんぶんこ), l'autre コップ quand la ピッチャー est vide, ou le liquide k.
function sourceVersement(L, k) {
  if (L.mode === 'hanbun') {
    if (L.pichet > 0.5) return 'pichet';
    return L.verres[1 - k] > 0.5 ? `verre-${1 - k}` : null;
  }
  if (L.mode === 'maze') return L.sources[k].reste > 0.5 ? `source-${k}` : null;
  return null;
}

function versementPossible(L, k) {
  if (!L || !sourceVersement(L, k)) return false;
  if (L.mode === 'hanbun') return L.verres[k] < CAP_VERRE - 0.5;
  return true;
}

function verserUnPeu(L, k, dt, limite, source) {
  if (!source) return false;
  if (L.mode === 'hanbun') {
    const place = Math.min(CAP_VERRE, limite ?? CAP_VERRE) - L.verres[k];
    if (source === 'pichet') {
      const q = Math.min(L.pichet, DEBIT * dt, place);
      L.pichet -= q;
      L.verres[k] += q;
      return L.pichet > 0.01 && (q > 0 || (dt === 0 && place > 0));
    }
    const j = 1 - k;
    const q = Math.min(L.verres[j], DEBIT_RETOUR * dt, place);
    L.verres[j] -= q;
    L.verres[k] += q;
    return L.verres[j] > 0.01 && (q > 0 || (dt === 0 && place > 0));
  }
  const s = L.sources[k];
  const place = limite == null ? Infinity : Math.max(0, limite - L.parts[k].ml);
  const q = Math.min(s.reste, DEBIT * dt, place);
  s.reste -= q;
  L.parts[k].ml += q;
  return (s.reste > 0.01 && place - q > 0.01) || q > 0;
}

// Penche la source au-dessus de la cible : son coin (le bec) au-dessus du bord, à 35 % de sa largeur ;
// elle tourne de 70°, vers la cible. Positions sans transformation (offsetLeft/Top dans la scène).
function pencherSur(el, cible) {
  const gauche = el.offsetLeft + el.offsetWidth / 2 > cible.offsetLeft + cible.offsetWidth / 2;
  const px = gauche ? cible.offsetLeft + cible.offsetWidth * 0.62 : cible.offsetLeft + cible.offsetWidth * 0.38;
  const py = cible.offsetTop - 12;
  const ox = gauche ? el.offsetLeft : el.offsetLeft + el.offsetWidth;
  el.style.transformOrigin = gauche ? '0 0' : '100% 0';
  el.style.transform = `translate(${Math.round(px - ox)}px, ${Math.round(py - el.offsetTop)}px) rotate(${gauche ? -70 : 70}deg)`;
  el.classList.add('penche');
  el.classList.toggle('vers-droite', !gauche);   // l'anse de la ピッチャー, du côté opposé au bec
  return px - cible.offsetLeft;
}

function redresser(el) {
  el.style.transform = '';
  el.classList.remove('penche');
}

// Met la scène à jour (niveaux, couleur, ce qui penche, le filet), sans la reconstruire.
function majVersement(e) {
  const inst = e.scene && e.scene.instrument;
  if (inst && inst.maj) inst.maj();
}

export function creerVersementLecon(W, H, et) {
  const e = etude;
  const L = e.liq;
  const el = document.createElement('div');
  el.className = `versement-lecon ${L.mode}`;
  const Hs = Math.max(220, Math.min(H, 560));
  el.style.width = `${W}px`;
  el.style.height = `${Hs}px`;
  const place = (x, gauche, haut, w, h) => {
    x.style.left = `${Math.round(gauche)}px`;
    x.style.top = `${Math.round(haut)}px`;
    if (w) x.style.width = `${Math.round(w)}px`;
    if (h) x.style.height = `${Math.round(h)}px`;
    el.append(x);
    return x;
  };
  // Une étiquette (nom, mL) sous un récipient.
  const sous = (cx, y, segs, classe = '') => {
    const s = document.createElement('span');
    s.className = `sous-versement ${classe}`;
    s.innerHTML = htmlMots(segs);
    s.style.left = `${Math.round(cx)}px`;
    s.style.top = `${Math.round(y)}px`;
    el.append(s);
    return s;
  };
  const pill = (cx, y) => {
    const p = etiquetteMesure(0, 'ml');
    p.classList.add('sous-versement');
    p.style.left = `${Math.round(cx)}px`;
    p.style.top = `${Math.round(y)}px`;
    el.append(p);
    return p;
  };
  // Un bouton « appuyer pour verser » (pointeur, ou espace / entrée au clavier).
  const appuyable = (b, k, label) => {
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      try { b.setPointerCapture(ev.pointerId); } catch { /* rien */ }
      appuyerVersement(k);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => b.addEventListener(t, () => lacherVersement(k)));
    b.addEventListener('keydown', (ev) => {
      if ((ev.key === ' ' || ev.key === 'Enter') && !ev.repeat) { ev.preventDefault(); appuyerVersement(k); }
    });
    b.addEventListener('keyup', (ev) => { if (ev.key === ' ' || ev.key === 'Enter') lacherVersement(k); });
    b.addEventListener('contextmenu', (ev) => ev.preventDefault());
    return b;
  };
  const bas = Hs - 40;   // la ligne des récipients du bas (les étiquettes dessous)

  if (L.mode === 'hanbun') {
    const gh = Math.max(80, Math.min(260, (Hs - 40) * 0.46));
    const gw = Math.max(50, Math.min(140, gh * 0.62, (W - 70) / 2));
    const ph = Math.max(70, Math.min(190, (Hs - 40) * 0.32));
    const pw = ph * 0.82;
    const D = Math.min((W - 16 - gw) / 2, gw / 2 + Math.max(36, pw * 0.45));
    // La ピッチャー (600 mL), en haut au milieu.
    const pichet = document.createElement('span');
    pichet.className = 'verseur pichet';
    pichet.innerHTML = `<span class="contenant forme-pichet" style="width:${Math.round(pw)}px;height:${Math.round(ph)}px"><span class="liquide" style="--c:var(--jus)"></span></span><span class="anse"></span>`;
    place(pichet, W / 2 - pw / 2, 6, pw, ph);
    const verres = [0, 1].map((k) => {
      const b = appuyable(document.createElement('button'), k, `${k === 0 ? 'ひだり' : 'みぎ'}の コップに いれる`);
      b.className = 'versoir';
      const v = creerVerre(gw, gh, 0, CAP_VERRE, 'var(--jus)');
      const ligne = document.createElement('span');
      ligne.className = 'ligne-moitie';
      ligne.style.bottom = `${(L.total / 2 / CAP_VERRE) * 100}%`;
      ligne.hidden = !L.ligne;
      const filet = document.createElement('span');
      filet.className = 'filet-continu';
      v.append(ligne, filet);
      b.append(v);
      place(b, W / 2 + (k ? D : -D) - gw / 2 - 7, bas - gh - 7);
      return { b, v, filet, p: pill(W / 2 + (k ? D : -D), bas + 4) };
    });
    // Le trait de même hauteur (preuve), d'une コップ à l'autre.
    const trait = document.createElement('span');
    trait.className = 'niveau-ligne';
    trait.hidden = true;
    el.append(trait);
    el.maj = () => {
      const S = versementEnCours && versementEnCours.etape === et ? versementEnCours : null;
      pichet.querySelector('.liquide').style.height = `${(L.pichet / 600) * 100}%`;
      verres.forEach(({ b, v, filet, p }, k) => {
        v.querySelector('.liquide').style.height = `${Math.min(100, (L.verres[k] / CAP_VERRE) * 100)}%`;
        p.innerHTML = nombreUnite(Math.round(L.verres[k]), 'ml');
        p.hidden = !L.montrer;
        b.classList.toggle('a-regarder', e.aPoser === k && !e.resolu);
        filet.classList.remove('actif');
      });
      const src = S && S.source;
      const elSource = src === 'pichet' ? pichet : src ? verres[Number(src.slice(-1))].b : null;
      [pichet, ...verres.map((x) => x.b)].forEach((x) => { if (x !== elSource && x.classList.contains('penche')) redresser(x); });
      if (S && elSource) {
        const cible = verres[S.k];
        if (!elSource.classList.contains('penche') || elSource.dataset.vers !== String(S.k)) {
          elSource.dataset.vers = String(S.k);
          cible.filet.style.left = `${Math.round(pencherSur(elSource, cible.b) - 7 - 3)}px`;
        }
        cible.filet.classList.add('actif');
      }
      if (L.montrer) {
        const y = bas - (L.verres[0] / CAP_VERRE) * (gh - 4) - 4;
        trait.hidden = false;
        trait.style.top = `${Math.round(y)}px`;
        trait.style.left = `${Math.round(W / 2 - D - gw / 2 - 12)}px`;
        trait.style.width = `${Math.round(2 * D + gw + 24)}px`;
      }
    };
  } else if (L.mode === 'maze') {
    const th = Math.max(90, Math.min(240, (Hs - 40) * 0.44));
    const tw = Math.max(70, Math.min(170, th * 0.8, W * 0.32));
    const sh = Math.max(60, Math.min(160, (Hs - 40) * 0.3));
    const sw = Math.max(44, Math.min(110, sh * 0.62, W * 0.2));
    const D = Math.min((W - 16 - sw) / 2, tw / 2 + sw / 2 + 40);
    const grand = document.createElement('span');
    grand.className = 'grand-verre';
    const v = creerVerre(tw, th, 0, CAP_GRAND, COULEURS_LIQ.eau);
    const filet = document.createElement('span');
    filet.className = 'filet-continu';
    v.append(filet);
    grand.append(v);
    place(grand, W / 2 - tw / 2, bas - th);
    const total = pill(W / 2, bas + 4);
    const sources = L.sources.map((s, k) => {
      const b = appuyable(document.createElement('button'), k, `${lecture(NOMS_LIQ[s.cle])}を いれる`);
      b.className = 'verseur source';
      const verre = creerVerre(sw, sh, s.ml, 250, COULEURS_LIQ[s.cle]);
      b.append(verre);
      place(b, W / 2 + (k ? D : -D) - sw / 2 - 7, 4);
      // Le nom, puis la quantité (deux lignes : sur téléphone, « あおい みず 100 mL » sortirait de l'écran).
      const cx = Math.max(52, Math.min(W - 52, W / 2 + (k ? D : -D)));
      sous(cx, 4 + sh + 16, NOMS_LIQ[s.cle]);
      sous(cx, 4 + sh + 40, [segU(s.ml, 'ml')]);
      return { b, verre };
    });
    let derniereEquation = '';
    el.maj = () => {
      const S = versementEnCours && versementEnCours.etape === et ? versementEnCours : null;
      const ml = L.parts.reduce((t, x) => t + x.ml, 0);
      v.querySelector('.liquide').style.height = `${Math.min(100, (ml / CAP_GRAND) * 100)}%`;
      v.querySelector('.liquide').style.setProperty('--c', couleurMelange(L.parts));
      total.innerHTML = nombreUnite(Math.round(ml / 5) * 5, 'ml');
      total.hidden = ml < 0.5;
      filet.classList.remove('actif');
      sources.forEach(({ b, verre }, k) => {
        verre.querySelector('.liquide').style.height = `${(L.sources[k].reste / 250) * 100}%`;
        b.classList.toggle('a-regarder', e.aPoser === k && !e.resolu);
        b.disabled = L.sources[k].reste <= 0.5 && !(S && S.k === k);
        if (!(S && S.k === k) && b.classList.contains('penche')) redresser(b);
      });
      if (S) {
        const { b } = sources[S.k];
        filet.style.setProperty('--c', COULEURS_LIQ[L.sources[S.k].cle]);
        if (!b.classList.contains('penche')) filet.style.left = `${Math.round(pencherSur(b, grand) - 3)}px`;
        filet.classList.add('actif');
      }
      const eq = equationLecon();
      if (eq !== derniereEquation) {
        derniereEquation = eq;
        $('etude-equation').innerHTML = eq;
      }
    };
  } else {
    // Les résultats côte à côte (question « どっちが こい？ », ou le résumé).
    const n = L.resultats.length;
    const th = Math.max(90, Math.min(240, (Hs - 40) * 0.6));
    const tw = Math.max(60, Math.min(150, th * 0.7, (W - 20 - 30 * (n - 1)) / n));
    const pas = Math.min((W - 20) / n, tw + 60);
    const question = L.bonne !== undefined;
    L.resultats.forEach((r, k) => {
      const b = document.createElement(question ? 'button' : 'span');
      b.className = 'versoir resultat-verre';
      const ml = r.parts.reduce((t, x) => t + x.ml, 0);
      b.append(creerVerre(tw, th, ml, CAP_GRAND, couleurMelange(r.parts)));
      const cx = W / 2 + (k - (n - 1) / 2) * pas;
      place(b, cx - tw / 2 - 7, bas - th - 7);
      if (question) {
        b.type = 'button';
        b.setAttribute('aria-label', r.nom ? lecture(r.nom) : `${k + 1}`);
        activable(b, () => toucherResultat(k));
      }
      if (r.nom) sous(cx, bas + 6, r.nom);
    });
    el.maj = () => {
      el.querySelectorAll('.resultat-verre').forEach((x, i) => {
        x.classList.toggle('essaye', L.essais.has(i));
        x.classList.toggle('juste', e.resolu && L.trouve && i === L.bonne);
      });
    };
  }
  el.geo = { s: 30, taille: 40 };
  return el;
}

// はんぶんこ : regarder, puis partager 300, 400, 200 et 500 mL (avec, puis sans les traits).
export function etapesHanbun() {
  const bravo = (total) => ['はんぶんこ できた！ どちらも ', segU(total / 2, 'ml'), '。 ', ONAJI, 'じ たかさ ＝ ', ONAJI, 'じ かさ。'];
  const pratique = (total, ligne) => ({
    dire: ligne
      ? ['コップを おして いる あいだ、 ジュースが はいるよ。 てんせんまで いれて、 はんぶんこ しよう。']
      : ['ジュース ', segU(total, 'ml'), 'を、 2つの コップに ', ONAJI, 'じだけ わけよう。'],
    scene: 'versement', versement: { total, ligne }, fini: hanbunFini, pendant: hanbunConseil, bravo: bravo(total),
  });
  return [
    {
      dire: ['ピッチャーの ジュースを、 2つの ', ONAJI, 'じ コップに ', ONAJI, 'じだけ いれるよ。 ', MI, 'て いてね。'],
      scene: 'versement', versement: { total: 300, demo: true },
      apresDemo: [ONAJI, 'じ たかさに なったね。 2つに ', ONAJI, 'じだけ わける ことを 「はんぶんこ」と いうよ。'],
    },
    pratique(300, true),
    pratique(400, true),
    pratique(200, false),
    pratique(500, false),
    {
      dire: ['まとめ。 ', ONAJI, 'じ コップに ', ONAJI, 'じ たかさまで いれると、 ', ONAJI, 'じ かさ。 ', segU(400, 'ml'), 'の はんぶんは ', segU(200, 'ml'), '。'],
      scene: 'versement', versement: { total: 400, fait: true },
    },
  ];
}

// まぜて みよう : les couleurs, la かさ qui s'additionne, puis こい / うすい.
export function etapesMaze() {
  const src = (cle, ml) => ({ cle, ml });
  const etape = (dire, a, b, bravo) => ({
    dire, scene: 'versement', versement: { sources: [a, b] }, fini: mazeFini, pendant: mazeConseil,
    bravo: [...bravo, segU(a.ml, 'ml'), ' と ', segU(b.ml, 'ml'), 'で ', segU(a.ml + b.ml, 'ml'), '。'],
  });
  const parts = (a, b) => [{ cle: a.cle, ml: a.ml }, { cle: b.cle, ml: b.ml }];
  const koi = [src('sirop', 50), src('eau', 50)];
  const usui = [src('sirop', 50), src('eau', 200)];
  const bonne = Math.random() < 0.5 ? 0 : 1;
  const deux = bonne === 0 ? [koi, usui] : [usui, koi];
  return [
    etape(['あおい ', K('水', 'みず'), 'と きいろい ', K('水', 'みず'), 'を、 おおきい コップに ぜんぶ いれよう。 コップを おして いる あいだ、 はいるよ。 なにいろに なるかな？'],
      src('bleu', 100), src('jaune', 100), ['みどりに なった！ あおと きいろを まぜると、 みどり。 かさは たして ふえるよ。 ']),
    etape(['こんどは あかと きいろ。 なにいろに なるかな？'],
      src('rouge', 200), src('jaune', 100), ['オレンジに なった！ あかと きいろで オレンジ。 ']),
    etape(['あかと あおを まぜると？'],
      src('rouge', 100), src('bleu', 100), ['むらさきに なった！ あかと あおで むらさき。 ']),
    etape(['シロップに ', K('水', 'みず'), 'を まぜて、 ジュースを つくろう。 ', K('水', 'みず'), 'は すこし。'],
      koi[0], koi[1], [K('水', 'みず'), 'が すこし だから、 いろが こいね。 ']),
    etape(['こんどは ', K('水', 'みず'), 'を たくさん いれよう。'],
      usui[0], usui[1], [K('水', 'みず'), 'を たくさん いれたから、 いろが うすいね。 ']),
    {
      dire: ['いろが こいのは どっち？ コップを さわってね。'],
      scene: 'versement', versement: { resultats: deux.map(([a, b]) => ({ parts: parts(a, b) })), bonne },
      fini: (e) => e.liq.trouve,
      indice: ['もう いっかい！ ', K('水', 'みず'), 'が すくない ほうが、 いろが こいよ。'],
      bravo: [...PHRASES.seikai, K('水', 'みず'), 'が すくない ほうが こい。 ', K('水', 'みず'), 'が ', OO_I, 'い ほうが うすい。'],
    },
    {
      dire: ['まとめ。 まぜると いろが かわる。 あわせると、 かさは たしざんで ふえる。 ', K('水', 'みず'), 'を たくさん いれると、 うすく なる。'],
      scene: 'versement',
      versement: {
        resultats: [
          { parts: parts(src('bleu', 100), src('jaune', 100)), nom: ['みどり'] },
          { parts: parts(src('rouge', 200), src('jaune', 100)), nom: ['オレンジ'] },
          { parts: parts(src('rouge', 100), src('bleu', 100)), nom: ['むらさき'] },
        ],
      },
    },
  ];
}

// L'égalité sous la consigne : « 300 mL の はんぶん ＝ 150 mL », « 100 mL ＋ 100 mL ＝ 200 mL ».
export function equationVersement(e) {
  const L = e.liq;
  if (!L) return '';
  if (L.mode === 'hanbun') return L.montrer ? `${nombreUnite(L.total, 'ml')} の はんぶん ＝ <span class="ensemble"><span class="resultat">${L.total / 2}</span>\u00a0${uniteHtml('ml')}</span>` : '';
  if (L.mode === 'maze') {
    const v = L.parts.map((x) => Math.round(x.ml / 5) * 5);
    if (!v.some(Boolean)) return '';
    return `${nombreUnite(v[0], 'ml')} ＋ ${nombreUnite(v[1], 'ml')} ＝ <span class="ensemble"><span class="resultat">${v[0] + v[1]}</span>\u00a0${uniteHtml('ml')}</span>`;
  }
  return '';
}

// Démonstration (はんぶんこ, 1re étape) : la ピッチャー verse dans une コップ, puis dans l'autre.
export function demoHanbun(et) {
  const e = etude;
  const L = e.liq;
  const encore = () => etude && etude.etape === et;
  setTimeout(() => {
    if (!encore()) return;
    lancerVersement(0, L.total / 2, () => setTimeout(() => {
      if (!encore()) return;
      lancerVersement(1, L.total / 2, () => {
        if (!encore()) return;
        L.montrer = true;
        majLecon();
        messageEtude(et.apresDemo, true);
        parler(et.apresDemo);
      });
    }, 500));
  }, 1600);
}

// L'écran a changé de taille pendant un versement : on redessinera quand le doigt sera levé.
export function redessinerApresVersement() {
  rendreApresVersement = true;
}
