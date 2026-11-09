/* ======================================================================
   Photos des objets de la maison (gardées sur l'appareil seulement, voir plateforme.stockage) ;
   ajout d'une photo : recadrage, puis nom et longueur
   ====================================================================== */

import { montrer } from './ecrans.js';
import { $ } from './outils.js';
import { rendreParents, t } from './parents.js';
import { plateforme } from './plateforme.js';
import { reglages } from './reglages.js';

export let photos = [];
export const urlsPhotos = new Map();

export function urlPhoto(p) {
  if (!urlsPhotos.has(p.id)) urlsPhotos.set(p.id, URL.createObjectURL(p.blob));
  return urlsPhotos.get(p.id);
}

// La liste chargée au démarrage, ou après une suppression.
export function definirPhotos(liste) {
  photos = liste;
}

let source = null;      // canvas de travail (photo réduite)
let cadre = null;       // { x, y, w, h } en pixels de la photo
let photoRecadree = null;

const toile = $('toile');

function chargerImage(fichier) {
  return new Promise((resoudre, rejeter) => {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resoudre(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rejeter(new Error('image')); };
    img.src = url;
  });
}

function cadreParDefaut() {
  return { x: source.width * 0.1, y: source.height * 0.3, w: source.width * 0.8, h: source.height * 0.4 };
}

// Repère l'objet posé sur un fond uni : ce qui diffère nettement de la couleur des bords.
function detecterObjet() {
  const k = 160 / Math.max(source.width, source.height);
  const w = Math.max(1, Math.round(source.width * k));
  const h = Math.max(1, Math.round(source.height * k));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const cx = c.getContext('2d', { willReadFrequently: true });
  cx.drawImage(source, 0, 0, w, h);
  let donnees;
  try { donnees = cx.getImageData(0, 0, w, h).data; } catch { return null; }
  const bords = [[], [], []];
  const ajouterBord = (x, y) => {
    const i = (y * w + x) * 4;
    bords[0].push(donnees[i]); bords[1].push(donnees[i + 1]); bords[2].push(donnees[i + 2]);
  };
  for (let x = 0; x < w; x++) { ajouterBord(x, 0); ajouterBord(x, h - 1); }
  for (let y = 0; y < h; y++) { ajouterBord(0, y); ajouterBord(w - 1, y); }
  const mediane = (t) => t.sort((a, b) => a - b)[t.length >> 1];
  const fond = bords.map(mediane);
  let minX = w; let minY = h; let maxX = -1; let maxY = -1; let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      const d = Math.abs(donnees[i] - fond[0]) + Math.abs(donnees[i + 1] - fond[1]) + Math.abs(donnees[i + 2] - fond[2]);
      if (d > 80) {
        n++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (n < w * h * 0.005) return null;
  if ((maxX - minX) * (maxY - minY) > w * h * 0.9) return null;
  return { x: minX / k, y: minY / k, w: (maxX - minX + 1) / k, h: (maxY - minY + 1) / k };
}

function dessinerToile() {
  toile.width = source.width;
  toile.height = source.height;
  toile.getContext('2d').drawImage(source, 0, 0);
}

function echelleToile() {
  return toile.getBoundingClientRect().width / toile.width || 1;
}

export function placerCadre() {
  if (!source || !cadre) return;
  const s = echelleToile();
  const el = $('cadre');
  el.style.left = `${cadre.x * s}px`;
  el.style.top = `${cadre.y * s}px`;
  el.style.width = `${cadre.w * s}px`;
  el.style.height = `${cadre.h * s}px`;
}

function borner(c) {
  const min = Math.max(12, Math.min(source.width, source.height) * 0.02);
  const x = Math.min(Math.max(0, c.x), source.width - min);
  const y = Math.min(Math.max(0, c.y), source.height - min);
  return {
    x,
    y,
    w: Math.min(Math.max(min, c.w), source.width - x),
    h: Math.min(Math.max(min, c.h), source.height - y),
  };
}

function etapePhoto(etape) {
  const recadrage = etape === 'recadrage';
  $('etape-recadrage').hidden = !recadrage;
  $('etape-infos').hidden = recadrage;
  $('photo-consigne').textContent = recadrage ? t('recadrer') : t('infos');
  $('btn-photo-tourner').hidden = !recadrage;
  $('btn-photo-autre').hidden = !recadrage;
  $('btn-photo-annuler').textContent = recadrage ? t('annuler') : t('retour');
  $('btn-photo-suivant').textContent = recadrage ? t('suivant') : t('enregistrer');
  $('erreur-photo').textContent = '';
  if (recadrage) requestAnimationFrame(placerCadre);
}

function preparerTextesPhoto() {
  $('ecran-photo').lang = reglages.langue;
  $('photo-titre').textContent = t('photoTitre');
  $('btn-photo-tourner').textContent = `↻ ${t('tourner')}`;
  $('btn-photo-autre').textContent = t('autre');
  $('lbl-yomi').textContent = t('yomi');
  $('lbl-kanji').textContent = t('kanjiChamp');
  $('lbl-cm').textContent = t('cm');
  $('aide-cm').textContent = t('cmAide');
  $('lbl-g').textContent = t('g');
  $('aide-g').textContent = t('gAide');
  $('lbl-ml').textContent = t('ml');
  $('aide-ml').textContent = t('mlAide');
}

async function chargerPhoto(ev) {
  const fichier = ev.target.files && ev.target.files[0];
  ev.target.value = '';
  if (!fichier) return;
  // « Autre photo » reprend la même source (appareil photo ou galerie).
  $('btn-photo-autre').htmlFor = ev.target.id;
  try {
    const img = await chargerImage(fichier);
    const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    source = document.createElement('canvas');
    source.width = Math.max(1, Math.round(img.naturalWidth * k));
    source.height = Math.max(1, Math.round(img.naturalHeight * k));
    source.getContext('2d').drawImage(img, 0, 0, source.width, source.height);
  } catch {
    rendreParents();
    montrer('parents');
    const p = document.createElement('p');
    p.className = 'erreur';
    p.textContent = t('erreurImage');
    $('parents').prepend(p);
    return;
  }
  preparerTextesPhoto();
  dessinerToile();
  cadre = borner(detecterObjet() || cadreParDefaut());
  $('champ-yomi').value = '';
  $('champ-kanji').value = '';
  $('champ-cm').value = '';
  $('champ-g').value = '';
  $('champ-ml').value = '';
  montrer('photo');
  etapePhoto('recadrage');
}

function recadrer() {
  const largeur = Math.max(1, Math.round(Math.min(900, cadre.w)));
  const hauteur = Math.max(1, Math.round(cadre.h * (largeur / cadre.w)));
  const c = document.createElement('canvas');
  c.width = largeur;
  c.height = hauteur;
  c.getContext('2d').drawImage(source, cadre.x, cadre.y, cadre.w, cadre.h, 0, 0, largeur, hauteur);
  return new Promise((resoudre) => {
    c.toBlob((blob) => resoudre({ blob, w: largeur, h: hauteur }), 'image/jpeg', 0.85);
  });
}

// Les gestes de l'écran photo : choisir un fichier, déplacer le cadre, tourner, enregistrer.
export function installerPhotos() {
  $('fichier-photo').addEventListener('change', chargerPhoto);
  $('fichier-camera').addEventListener('change', chargerPhoto);

  // Déplacer le cadre, tirer un coin, ou tracer un nouveau cadre.
  (() => {
    const zone = $('zone-toile');
    let geste = null;

    const point = (ev) => {
      const r = toile.getBoundingClientRect();
      const s = echelleToile();
      return { x: (ev.clientX - r.left) / s, y: (ev.clientY - r.top) / s };
    };

    zone.addEventListener('pointerdown', (ev) => {
      if (!source) return;
      ev.preventDefault();
      zone.setPointerCapture(ev.pointerId);
      const p = point(ev);
      const coin = ev.target.closest('.poignee')?.dataset.coin;
      const dedans = p.x >= cadre.x && p.x <= cadre.x + cadre.w && p.y >= cadre.y && p.y <= cadre.y + cadre.h;
      geste = { id: ev.pointerId, depart: p, initial: { ...cadre }, mode: coin || (dedans ? 'deplacer' : 'tracer') };
    });

    zone.addEventListener('pointermove', (ev) => {
      if (!geste || ev.pointerId !== geste.id) return;
      const p = point(ev);
      const dx = p.x - geste.depart.x;
      const dy = p.y - geste.depart.y;
      const c = { ...geste.initial };
      switch (geste.mode) {
        case 'deplacer':
          c.x = Math.min(Math.max(0, c.x + dx), source.width - c.w);
          c.y = Math.min(Math.max(0, c.y + dy), source.height - c.h);
          cadre = c;
          break;
        case 'tracer':
          cadre = borner({
            x: Math.min(geste.depart.x, p.x),
            y: Math.min(geste.depart.y, p.y),
            w: Math.abs(dx),
            h: Math.abs(dy),
          });
          break;
        default: {
          let { x, y } = c;
          let x2 = c.x + c.w;
          let y2 = c.y + c.h;
          if (geste.mode.includes('w')) x += dx; else x2 += dx;
          if (geste.mode.includes('n')) y += dy; else y2 += dy;
          cadre = borner({ x: Math.min(x, x2), y: Math.min(y, y2), w: Math.abs(x2 - x), h: Math.abs(y2 - y) });
        }
      }
      placerCadre();
    });

    const fin = (ev) => { if (geste && ev.pointerId === geste.id) geste = null; };
    zone.addEventListener('pointerup', fin);
    zone.addEventListener('pointercancel', fin);
  })();

  $('btn-photo-tourner').addEventListener('click', () => {
    const c = document.createElement('canvas');
    c.width = source.height;
    c.height = source.width;
    const cx = c.getContext('2d');
    cx.translate(c.width, 0);
    cx.rotate(Math.PI / 2);
    cx.drawImage(source, 0, 0);
    source = c;
    dessinerToile();
    cadre = borner(detecterObjet() || cadreParDefaut());
    requestAnimationFrame(placerCadre);
  });

  $('btn-photo-autre').addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); $($('btn-photo-autre').htmlFor).click(); }
  });

  $('btn-photo-annuler').addEventListener('click', () => {
    if (!$('etape-infos').hidden) {
      etapePhoto('recadrage');
      return;
    }
    source = null;
    rendreParents();
    montrer('parents');
  });

  $('btn-photo-suivant').addEventListener('click', async () => {
    if (!$('etape-recadrage').hidden) {
      photoRecadree = await recadrer();
      if (!photoRecadree.blob) {
        $('erreur-photo').textContent = t('erreurImage');
        return;
      }
      const apercu = $('apercu-photo');
      if (apercu.src) URL.revokeObjectURL(apercu.src);
      apercu.src = URL.createObjectURL(photoRecadree.blob);
      etapePhoto('infos');
      $('champ-yomi').focus();
      return;
    }

    const yomi = $('champ-yomi').value.trim();
    const kanji = $('champ-kanji').value.trim();
    // Longueur, poids, contenance : au moins une des trois (les autres peuvent rester vides).
    const lire = (id) => {
      const brut = String($(id).value).trim().replace(',', '.');
      return brut === '' ? null : Number(brut);
    };
    const cm = lire('champ-cm');
    const g = lire('champ-g');
    const ml = lire('champ-ml');
    const erreur = (cle, id) => {
      $('erreur-photo').textContent = t(cle);
      $(id).focus();
    };
    if (!yomi) return erreur('erreurYomi', 'champ-yomi');
    if (cm === null && g === null && ml === null) return erreur('erreurMesure', 'champ-cm');
    if (cm !== null && (!Number.isFinite(cm) || cm < 1 || cm > 300)) return erreur('erreurCm', 'champ-cm');
    if (g !== null && (!Number.isFinite(g) || g < 1 || g > 5000)) return erreur('erreurG', 'champ-g');
    if (ml !== null && (!Number.isFinite(ml) || ml < 10 || ml > 5000)) return erreur('erreurMl', 'champ-ml');
    const objet = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      yomi,
      kanji: kanji || null,
      cm: cm === null ? null : Math.round(cm * 10) / 10,
      g: g === null ? null : Math.round(g),
      ml: ml === null ? null : Math.round(ml),
      w: photoRecadree.w,
      h: photoRecadree.h,
      blob: photoRecadree.blob,
    };
    await plateforme.stockage.mettre(objet);
    photos.push(objet);
    source = null;
    rendreParents();
    montrer('parents');
  });

  $('etape-infos').addEventListener('submit', (ev) => ev.preventDefault());
}
