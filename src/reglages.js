/* ======================================================================
   Réglages (gardés sur l'appareil)
   ====================================================================== */

const CLE_REGLAGES = 'kurabe.reglages';
const DEFAUT = {
  activites: Array.from({ length: 45 }, (_, i) => i + 1),
  compteurs: ['こ', 'ひき', 'ほん'],
  exemple: true,          // un exemple guidé (れい) avant la 1re question, quand l'activité en a un   // かぞえかた : les compteurs travaillés (いくつ？ n'utilise que ceux-là)
  theme: 'nagasa',        // onglet de l'accueil : ながさ | おもさ | かさ
  nbQuestions: 6,
  ecriture: 'hiragana',   // hiragana | kanji (avec furigana)
  noms: true,             // afficher le nom des objets
  court: true,            // demander aussi « le plus court »
  photos: 'melange',      // jamais | melange | toujours
  vitesse: 0.9,
  voixGenre: 'femme',     // 'femme' ou 'homme' (voix d'homme installée, sinon la voix disponible plus grave)
  voixNom: '',            // une voix précise choisie par les parents ('' : automatique)
  sons: true,
  dureeAppui: 0,          // ms : le doigt doit rester posé ce temps
  antiRebond: 300,        // ms : touchers suivants ignorés (évite les doubles touches)
  verserParTouche: false, // はんぶんこ, まぜて : verser par petites touches (20 mL) au lieu d'appuyer longtemps
  animations: 'auto',     // 'auto' (suit le système) ou 'reduites'
  aide: true,             // boutons « わからない », « そろえる », « うつす »
  nombreMax: 20,          // べんきょう : nombres jusqu'à 10, 20, 50, 100 ou 1000
  compter: true,          // べんきょう : la voix compte à chaque ＋1 / −1
  lireUnites: true,       // la lecture des unités au-dessus des symboles (グラム sur g)
  toucherLire: true,      // toucher une phrase la fait lire ; bouton 👆 : lire les boutons au lieu de les activer
  volumeMax: 500,         // べんきょう かさ : verre doseur de 200, 500 ou 1000 mL
  version: 10,
  langue: (navigator.language || '').toLowerCase().startsWith('ja') ? 'ja' : 'fr',
};

function lireReglages() {
  try {
    const stocke = JSON.parse(localStorage.getItem(CLE_REGLAGES) || '{}');
    // Réglages d'une version précédente : on ajoute les nouvelles activités (6 à 9).
    if (stocke.activites && (stocke.version || 1) < 2) {
      stocke.activites = [...new Set([...stocke.activites, 6, 7, 8, 9])];
    }
    if (stocke.activites && (stocke.version || 1) < 3) {
      stocke.activites = [...new Set([...stocke.activites, 10, 11, 12])];
    }
    // Version 4 : masses (13 à 18) et liquides (19 à 24).
    if (stocke.activites && (stocke.version || 1) < 4) {
      stocke.activites = [...new Set([...stocke.activites, ...Array.from({ length: 12 }, (_, i) => i + 13)])];
    }
    // Version 5 : はりで くらべる et les trois leçons sur les masses (25 à 28).
    if (stocke.activites && (stocke.version || 1) < 5) {
      stocke.activites = [...new Set([...stocke.activites, 25, 26, 27, 28])];
    }
    // Version 6 : はかりを よもう, はかって みよう, et la rubrique ね、しっていた？ (29 à 34).
    if (stocke.activites && (stocke.version || 1) < 6) {
      stocke.activites = [...new Set([...stocke.activites, 29, 30, 31, 32, 33, 34])];
    }
    // Version 7 : l'onglet かず (35 à 41).
    if (stocke.activites && (stocke.version || 1) < 7) {
      stocke.activites = [...new Set([...stocke.activites, 35, 36, 37, 38, 39, 40, 41])];
    }
    // Version 8 : かぞえかた (42).
    if (stocke.activites && (stocke.version || 1) < 8) {
      stocke.activites = [...new Set([...stocke.activites, 42])];
    }
    // Version 9 : はんぶんこ et まぜて みよう (43, 44).
    if (stocke.activites && (stocke.version || 1) < 9) {
      stocke.activites = [...new Set([...stocke.activites, 43, 44])];
    }
    // Version 10 : おとが かわる かぞえかた (45).
    if (stocke.activites && (stocke.version || 1) < 10) {
      stocke.activites = [...new Set([...stocke.activites, 45])];
    }
    // Une liste d'activités vide (réglage abîmé) donnerait un accueil sans rien : on reprend tout.
    if (Array.isArray(stocke.activites) && stocke.activites.length === 0) delete stocke.activites;
    return { ...DEFAUT, ...stocke, version: 9 };
  } catch {
    return { ...DEFAUT };
  }
}

export let reglages = lireReglages();

export function ecrireReglages(modifs) {
  reglages = { ...reglages, ...modifs };
  try { localStorage.setItem(CLE_REGLAGES, JSON.stringify(reglages)); } catch { /* stockage indisponible */ }
}
