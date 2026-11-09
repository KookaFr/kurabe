/* ======================================================================
   Espace parents (français / japonais)
   ====================================================================== */

import { ACTIVITES, numeroAffiche, ordreTheme, themeDe, THEMES } from './accueil.js';
import { appliquerAnimations } from './ecrans.js';
import { $, echapper } from './outils.js';
import { definirPhotos, photos, urlPhoto, urlsPhotos } from './photos.js';
import { plateforme } from './plateforme.js';
import { A_COMPTER } from './questions/kazu.js';
import { ecrireReglages, reglages } from './reglages.js';
import { compteursActifs, lecture, PHRASES, TOUS_COMPTEURS } from './texte.js';
import { majBoutonsLire, parler, VOIX_HOMME, voixGrave, voixJa, voixJaponaise } from './voix.js';

const TEXTES = {
  fr: {
    titre: 'Réglages pour les parents',
    fermer: 'Retour',
    langue: 'Langue de cette page',
    activites: 'Activités proposées',
    activitesAide: 'Gardez au moins une activité. Commencez par la 1, puis ajoutez les autres quand elle est réussie.',
    nbQuestions: 'Questions par série',
    ecriture: 'Écriture',
    lireUnites: 'Lecture des unités en petit au-dessus des symboles (グラム sur g, センチ sur cm…)',
    toucherLire: 'Lecture au toucher (pour qui ne lit pas) : toucher une phrase la fait lire ; avec le bouton 👆, toucher un bouton le lit au lieu de l’activer',
    hiragana: 'Hiragana seuls',
    kanji: 'Kanji avec furigana',
    nombreMax: 'べんきょう : nombres jusqu’à',
    compter: 'べんきょう : la voix compte à chaque ＋1 / −1',
    etudeAide: 'Dans « べんきょう », votre enfant tire le ruban (n’importe où sur la zone, pas seulement sur la poignée) ou utilise les gros boutons ＋1 / −1. Chaque centimètre ajouté ou retiré apparaît comme un bloc numéroté. Dans « のばして みよう », la poignée bleue sous le ruban change le premier nombre sans changer le second. Avec des nombres plus grands, le geste doit être plus précis.',
    aide: 'Boutons d’aide (わからない, そろえる, うつす)',
    aideAide: 'Activités 6 et 7 : l’aide convertit d’abord dans la même unité (1 m ＝ 100 cm), puis dessine des barres à l’échelle. Activités 8 et 9 : elle fait glisser les objets jusqu’à la ligne de départ. Elle apparaît aussi d’elle-même après une erreur.',
    aideMV: 'Nombres (かず) : chaque nombre est écrit avec sa lecture en hiragana (3 さん, 23 にじゅうさん, 300 さんびゃく). « いくつ？ » : compter jusqu’à 5, puis 10, en rangées de 5 puis en désordre ; la preuve numérote les objets dans l’ordre. « よみかた » : chiffre → hiragana puis l’inverse (1–10, 11–20, jusqu’à 99). Les dizaines sont partout des cadres de 10 pleins (« 10の まとまり »), comptés 10, 20, 30… ; les unités sont les « ばら ». Les leçons utilisent aussi les plaques de 100 ; la voix dit le nombre à chaque jeton posé. « いくつ？ » demande avec le bon compteur (いぬは なんびき？, えんぴつは なんぼん？, りんごは なんこ？) et les réponses montrent la lecture (3びき さんびき). « かぞえかた » : d’abord choisir le compteur d’une chose (いきもの → ひき, ほそながい もの → ほん, うすい もの → まい, のりもの → だい, ひと → にん, ほん・ノート → さつ), puis la bonne lecture quand le son change (いっぽん, さんぼん, ろっぽん, はっぽん, じゅっぽん ; ひとり, ふたり). Les compteurs travaillés se choisissent plus bas (こ, ひき, ほん au départ). Après une erreur ou « わからない », l’aide décompose le nombre (16 ＝ 10 と 6 : « じゅう » et « ろく ») ou fait compter les 10 ; « おしい » n’est dit que si la réponse était presque juste. Masses : la balance de cuisine (はかり) est l’instrument principal. « はりで くらべる » compare deux balances sans aucun nombre ; « みためと ちがう » : l’élève devine d’abord (un gros objet peut être léger), puis les balances vérifient ; « はかりを よもう » : lire l’aiguille (centaines, puis 50, puis dizaines). Leçons guidées (l’élève pose ou enlève les objets en les touchant, puis la voix explique) : « はかりの よみかた », « g と kg » (1円玉 ＝ 1 g … 1 kg ＝ 1000 g), puis l’entraînement « はかって みよう ». La rubrique « ね、しっていた？（むかしは…）» rassemble la culture : la balance à plateaux (てんびん, avec son exercice et « つりあわせよう »), 匁 et la pièce de 5 円, et pour les longueurs あた／ひろ et 尺／寸, pour les liquides 合／升. Masses 5 et 6, liquides 4 et 5 : l’aide convertit d’abord dans la même unité (1 kg ＝ 1000 g, 1 L ＝ 1000 mL), puis montre des balances de cuisine ou des verres doseurs. « うつして くらべよう » : le bouton « うつす » (ou une erreur) verse les deux récipients dans des verres identiques. « つりあわせよう » : on touche le bac pour poser une つみき (jusqu’à 20) ou une おもり (1 g et 10 g, ou 10 g et 100 g jusqu’à 1000), on touche un poids sur le plateau pour le reposer ; les poids sont rangés par 5, une sorte par rangée, les plus lourds en bas, et l’égalité les compte (10 g × 9 ＋ 1 g × 7 ＝ 97 g) ; la balance penche moins quand on approche. « はかって いれよう » : on glisse le doigt vers le haut ou le bas ; la taille du verre doseur (200 mL, 500 mL, 1 L) se choisit en haut de l’écran.',
    theme_kazu: 'Nombres (かず)',
    compteurs: 'Compteurs travaillés (かぞえかた ; « いくつ？ » ne compte que des choses qui utilisent ces compteurs)',
    exemple: 'Exemple guidé avant la 1re question (« れい » : 10の まとまり)',
    theme_nagasa: 'Longueurs (ながさ)',
    theme_omosa: 'Masses (おもさ)',
    theme_kasa: 'Liquides (かさ)',
    noms: 'Afficher le nom des objets',
    court: 'Demander aussi « le plus court » (短い)',
    courtAide: 'Les élèves confondent souvent « long » et « court » : activez-le quand « long » est acquis.',
    oui: 'Oui',
    non: 'Non',
    photos: 'Photos d’objets de la maison',
    photosAide: 'Posez l’objet à l’horizontale sur un fond uni (une feuille blanche) et photographiez-le d’au-dessus. Mesurez-le avec une règle : l’outil l’affiche ensuite à la bonne échelle. Variez les longueurs (par exemple 5, 10, 15 et 25 cm) : les questions faciles demandent des objets très différents. Vous pouvez aussi le peser sur la balance de cuisine (en g), ou noter la contenance écrite sur une bouteille ou une brique (en mL) : la photo apparaîtra alors aussi dans les questions sur les masses ou les liquides.',
    photosUsage: 'Utiliser les photos dans les questions',
    jamais: 'Jamais',
    melange: 'Avec les dessins',
    toujours: 'Dès que possible',
    prendre: 'Prendre une photo',
    galerie: 'Choisir dans la galerie',
    aucune: 'Aucune photo pour l’instant. Il en faut au moins deux pour qu’elles apparaissent dans les questions.',
    prive: 'Les photos restent sur cet appareil. Elles ne sont envoyées nulle part.',
    stockage: 'Ici, les photos ne pourront pas être gardées après fermeture de la page (stockage indisponible).',
    supprimer: 'Supprimer',
    confirmer: 'Supprimer ?',
    annuler: 'Annuler',
    voix: 'Voix et sons',
    vitesse: 'Vitesse de la voix',
    lente: 'Lente',
    normale: 'Normale',
    rapide: 'Rapide',
    sons: 'Sons',
    ecouter: 'Écouter la voix',
    genreVoix: 'Voix',
    femme: 'Femme',
    homme: 'Homme',
    voixPrecise: 'Voix japonaises installées sur cet appareil',
    voixAuto: 'Automatique',
    voixGrave: 'Aucune voix japonaise d’homme n’est installée sur cet appareil : la voix habituelle est rendue plus grave. Pour une vraie voix d’homme : sur iPad, Réglages › Accessibilité › Contenu énoncé › Voix › Japonais › Otoya (ou Hattori), puis revenir ici ; sur Android (Samsung), Paramètres › Gestion globale › Synthèse vocale › réglages du moteur (Google ou Samsung) › Japonais : choisir une voix d’homme si le moteur en propose une.',
    sansVoix: 'Aucune voix japonaise trouvée. Sur iPad : Réglages › Accessibilité › Contenu énoncé › Voix › Japonais. Sur Android (Samsung) : Paramètres › Gestion globale › Synthèse vocale, puis installez la voix japonaise du moteur choisi.',
    toucher: 'Toucher',
    dureeAppui: 'Temps d’appui pour valider',
    immediat: 'Immédiat',
    antiRebond: 'Ignorer les touchers répétés',
    rebondMeme: '0,3 s (même bouton)',
    verser: 'Verser (はんぶんこ, まぜて みよう)',
    verserMaintenir: 'En appuyant',
    verserTouche: 'Par touches de 20 mL',
    animations: 'Animations',
    animAuto: 'Comme l’appareil',
    animReduites: 'Réduites',
    ipad: 'Sur la tablette ou le smartphone',
    ipadAide: 'iPad : Safari › Partager › « Sur l’écran d’accueil ». Pour empêcher de sortir de l’outil : Réglages › Accessibilité › Accès guidé. Android (Samsung) : Chrome › menu ⋮ › « Ajouter à l’écran d’accueil » ou « Installer l’application ». Pour bloquer l’écran sur l’outil : Paramètres › Sécurité › Épingler les applications. Les photos ajoutées restent sur l’appareil où elles ont été prises : ajoutez-les sur chaque appareil.',
    photoTitre: 'Nouvelle photo',
    recadrer: 'Encadrez l’objet exactement d’un bout à l’autre : la largeur du cadre correspond à sa longueur.',
    tourner: 'Tourner',
    autre: 'Autre photo',
    suivant: 'Suivant',
    retour: 'Retour',
    enregistrer: 'Enregistrer',
    infos: 'Nom et mesures de l’objet',
    yomi: 'Nom en hiragana (obligatoire)',
    kanjiChamp: 'Nom en kanji (facultatif)',
    cm: 'Longueur réelle en cm',
    cmAide: 'Mesurez l’objet avec une règle, d’un bout à l’autre (facultatif si vous indiquez un poids ou une contenance).',
    erreurYomi: 'Écrivez le nom de l’objet en hiragana.',
    erreurCm: 'Indiquez une longueur entre 1 et 300 cm.',
    erreurMesure: 'Indiquez au moins une mesure : longueur, poids ou contenance.',
    erreurG: 'Indiquez un poids entre 1 et 5000 g.',
    erreurMl: 'Indiquez une contenance entre 10 et 5000 mL.',
    g: 'Poids en g (balance de cuisine)',
    gAide: 'Facultatif : pour les questions sur les masses.',
    ml: 'Contenance en mL (écrite sur l’étiquette)',
    mlAide: 'Facultatif : pour « うつして くらべよう » (verser dans des verres identiques).',
    erreurImage: 'Cette image n’a pas pu être lue. Essayez une autre photo.',
  },
  ja: {
    titre: '保護者の方の設定',
    fermer: '戻る',
    langue: 'このページの言語',
    activites: '表示する問題',
    activitesAide: '1つ以上選んでください。1から始めて、できるようになったら他の問題を増やしましょう。',
    nbQuestions: '1回あたりの問題数',
    ecriture: '文字',
    lireUnites: '単位の読み方を小さく書く（g の上に グラム）',
    toucherLire: '触って読む：文を触ると読み上げます。👆を押すと、ボタンに触れても読み上げるだけになります',
    hiragana: 'ひらがな',
    kanji: '漢字＋ふりがな',
    nombreMax: 'べんきょう：数の範囲',
    compter: 'べんきょう：＋1・−1 で数を読み上げる',
    etudeAide: '「べんきょう」ではテープを引っ張るか（どこからでも）、＋1・−1 のボタンを使います。足したり引いたりした 1 cm ずつが番号つきのブロックで見えます。「のばして みよう」ではテープの下の青い●で最初の数を変えられます（2つめの数はそのまま）。数が大きいと細かい動きが必要です。',
    aide: '助けのボタン（わからない・そろえる・うつす）',
    aideAide: '6・7：まず同じ単位に直し（1 m＝100 cm）、次に棒で示します。8・9：物の端をそろえます。間違えたときは自動で出ます。',
    aideMV: 'かず：数字にはいつもひらがなの読み方がつきます（3 さん、23 にじゅうさん、300 さんびゃく）。10のまとまり（いっぱいの10のわく）を 10、20、30 と数え、べんきょうでは100の板も使い、のせるたびに声で数を言います。おもさ：はかりが中心です。「はりで くらべる」は数字のないはかりで比べます。「見た目と ちがう」はまず予想して（大きくても軽い物があります）、はかりで確かめます。「はかりを よもう」は針を読みます。べんきょうでは「はかりの よみかた」「g と kg」（1円玉＝1 g … 1 kg＝1000 g）「はかって みよう」をします。物を触ってのせたりおろしたりすると、声で説明します。「ね、しっていた？（むかしは…）」には てんびん、もんめ（5円玉）、あた・ひろ、しゃく・すん、ごう・しょう があります。おもさ 5・6、かさ 4・5 はまず同じ単位に直し（1 kg＝1000 g、1 L＝1000 mL）、次にはかりや計量カップで示します。「うつして くらべよう」は「うつす」ボタン（または間違い）で同じ器に移します。「つりあわせよう」は 20 まではつみき、それより大きいと g のおもりです。箱を触ると1個のり、皿のおもりを触ると箱に戻ります。おもりは5個ずつ並びます。「はかって いれよう」は指を上下に動かします。カップの大きさ（200 mL・500 mL・1 L）は画面の上で選べます。「はんぶんこ」「まぜて みよう」は器を押している間だけ注がれます（「タッチ」の設定で、1回タッチごとに 20 mL ずつ注ぐこともできます）。',
    theme_kazu: 'かず',
    compteurs: '練習する数え方（「いくつ？」もこの数え方の物だけ）',
    exemple: '最初の問題の前に例を見せる（10のまとまり）',
    theme_nagasa: 'ながさ',
    theme_omosa: 'おもさ',
    theme_kasa: 'かさ',
    noms: '物の名前を表示する',
    court: '「短い」も聞く',
    courtAide: '「長い」と「短い」は間違えやすいので、「長い」ができてから使いましょう。',
    oui: 'はい',
    non: 'いいえ',
    photos: '家の物の写真',
    photosAide: '物を横向きに無地の紙の上に置き、真上から撮ってください。定規で長さを測ると、正しい大きさで表示されます。長さの違う物を選びましょう（例：5・10・15・25 cm）。キッチンスケールで重さ（g）を量ったり、ボトルやパックの容量（mL）を入れたりすると、おもさ・かさの問題にも出ます。',
    photosUsage: '問題に写真を使う',
    jamais: '使わない',
    melange: 'イラストと混ぜる',
    toujours: 'できるだけ使う',
    prendre: '写真を撮る',
    galerie: 'アルバムから選ぶ',
    aucune: 'まだ写真はありません。問題に使うには2枚以上必要です。',
    prive: '写真はこの端末の中だけに保存され、どこにも送信されません。',
    stockage: 'この環境ではページを閉じると写真が消えます（保存できません）。',
    supprimer: '削除',
    confirmer: '削除しますか？',
    annuler: 'やめる',
    voix: '声と音',
    vitesse: '話す速さ',
    lente: 'ゆっくり',
    normale: 'ふつう',
    rapide: '速い',
    sons: '効果音',
    ecouter: '声を聞く',
    genreVoix: '声',
    femme: '女性の声',
    homme: '男性の声',
    voixPrecise: 'この端末にある日本語の声',
    voixAuto: '自動',
    voixGrave: '日本語の男性の声が入っていないため、今の声を低くしています。iPad：設定 › アクセシビリティ › 読み上げコンテンツ › 声 › 日本語 › Otoya（または Hattori）。Android（Galaxy）：設定 › 一般管理 › テキスト読み上げ › エンジンの設定 › 日本語 で男性の声を選んでください（ある場合）。',
    sansVoix: '日本語の声が見つかりません。iPad：設定 › アクセシビリティ › 読み上げコンテンツ › 声 › 日本語。Android（Galaxy）：設定 › 一般管理 › テキスト読み上げ で日本語の声を追加してください。',
    toucher: 'タッチ',
    dureeAppui: '長押しする時間（押し続けて決定）',
    immediat: 'すぐ',
    antiRebond: '連続タッチを無視する',
    rebondMeme: '0.3秒（同じボタン）',
    verser: '注ぐ（はんぶんこ・まぜて みよう）',
    verserMaintenir: '押している間',
    verserTouche: '1回タッチで 20 mL',
    animations: '動き（アニメーション）',
    animAuto: '端末の設定どおり',
    animReduites: '少なく',
    ipad: 'タブレット・スマートフォンで使う',
    ipadAide: 'iPad：Safari › 共有 › 「ホーム画面に追加」。他のアプリに移らないように：設定 › アクセシビリティ › アクセスガイド。Android（Galaxy）：Chrome › メニュー ⋮ › 「ホーム画面に追加」または「アプリをインストール」。画面の固定：設定 › セキュリティ › アプリの固定。写真は撮った端末の中だけにあるので、端末ごとに追加してください。',
    photoTitre: '新しい写真',
    recadrer: '物の端から端までぴったり囲んでください。枠の幅が物の長さになります。',
    tourner: '回転',
    autre: '撮り直す',
    suivant: '次へ',
    retour: '戻る',
    enregistrer: '保存',
    infos: '物の名前と長さ・重さ・容量',
    yomi: '名前（ひらがな・必須）',
    kanjiChamp: '名前（漢字・なくてもよい）',
    cm: '実際の長さ（cm）',
    cmAide: '定規で端から端まで測ってください（重さか容量を入れたら、なくてもかまいません）。',
    erreurYomi: '名前をひらがなで書いてください。',
    erreurCm: '1〜300 cm の長さを入れてください。',
    erreurMesure: '長さ・重さ・容量のどれか1つを入れてください。',
    erreurG: '1〜5000 g の重さを入れてください。',
    erreurMl: '10〜5000 mL の容量を入れてください。',
    g: '重さ（g・キッチンスケールで）',
    gAide: 'なくてもよい：おもさの問題に使います。',
    ml: '容量（mL・ラベルに書いてある）',
    mlAide: 'なくてもよい：「うつして くらべよう」に使います。',
    erreurImage: 'この写真は読み込めませんでした。他の写真で試してください。',
  },
};

export const t = (cle) => (TEXTES[reglages.langue] || TEXTES.fr)[cle] ?? cle;

function bloc(titre, aide) {
  const section = document.createElement('section');
  section.className = 'bloc';
  const h = document.createElement('h3');
  h.textContent = titre;
  section.append(h);
  if (aide) {
    const p = document.createElement('p');
    p.textContent = aide;
    section.append(p);
  }
  return section;
}

let compteurChamps = 0;

function groupeChoix(cle, libelle, options, { apres } = {}) {
  const fs = document.createElement('fieldset');
  fs.className = 'reglage';
  const lg = document.createElement('legend');
  lg.textContent = libelle;
  const zone = document.createElement('div');
  zone.className = 'options';
  const nom = `choix-${cle}-${compteurChamps++}`;
  options.forEach(([valeur, texte]) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = nom;
    input.id = `${nom}-${String(valeur)}`;
    input.checked = String(reglages[cle]) === String(valeur);
    input.addEventListener('change', () => {
      ecrireReglages({ [cle]: valeur });
      if (apres) apres();
    });
    label.append(input, document.createTextNode(texte));
    zone.append(label);
  });
  fs.append(lg, zone);
  return fs;
}

function groupeActivites() {
  const zone = document.createElement('div');
  zone.className = 'options';
  let themePrecedent = null;
  THEMES.flatMap((th) => ordreTheme(th.cle)).forEach((a) => {
    if (themeDe(a) !== themePrecedent) {
      themePrecedent = themeDe(a);
      const titre = document.createElement('p');
      titre.className = 'sous-titre-reglage';
      titre.textContent = t(`theme_${themePrecedent}`);
      zone.append(titre);
    }
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = `activite-${a.n}`;
    input.checked = reglages.activites.includes(a.n);
    input.addEventListener('change', () => {
      const choisies = ACTIVITES.filter((x) => $(`activite-${x.n}`).checked).map((x) => x.n);
      if (!choisies.length) {
        input.checked = true;
        return;
      }
      ecrireReglages({ activites: choisies });
    });
    const texte = reglages.langue === 'ja' ? `${numeroAffiche(a)}. ${lecture(a.titre)}（${lecture(a.sous)}）` : `${numeroAffiche(a)}. ${a.fr}`;
    label.append(input, document.createTextNode(texte));
    zone.append(label);
  });
  return zone;
}

// かぞえかた : les compteurs travaillés (いくつ？ n'utilise que des choses comptées avec eux).
function groupeCompteurs() {
  const fs = document.createElement('fieldset');
  fs.className = 'reglage';
  const lg = document.createElement('legend');
  lg.textContent = t('compteurs');
  const zone = document.createElement('div');
  zone.className = 'options';
  TOUS_COMPTEURS.forEach((c) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = compteursActifs().includes(c);
    input.dataset.compteur = c;
    input.addEventListener('change', () => {
      const choisis = [...zone.querySelectorAll('input:checked')].map((x) => x.dataset.compteur);
      if (!choisis.length) {
        input.checked = true;
        return;
      }
      ecrireReglages({ compteurs: choisis });
    });
    const ex = A_COMPTER.find((x) => x[2] === c);
    label.append(input, document.createTextNode(`〜${c}（${ex[0]}）`));
    zone.append(label);
  });
  fs.append(lg, zone);
  return fs;
}

function listePhotos() {
  const liste = document.createElement('div');
  liste.className = 'liste-photos';
  if (!photos.length) {
    const p = document.createElement('p');
    p.textContent = t('aucune');
    liste.append(p);
    return liste;
  }
  [...photos].sort((a, b) => (a.cm || 0) - (b.cm || 0)).forEach((p) => {
    const ligne = document.createElement('div');
    ligne.className = 'photo-ligne';
    const img = document.createElement('img');
    img.src = urlPhoto(p);
    img.alt = '';
    const infos = document.createElement('div');
    infos.className = 'infos';
    const mesures = [p.cm ? `${p.cm} cm` : '', p.g ? `${p.g} g` : '', p.ml ? `${p.ml} mL` : ''].filter(Boolean).join(' · ');
    infos.innerHTML = `<strong>${echapper(p.kanji ? `${p.kanji}（${p.yomi}）` : p.yomi)}</strong><span>${echapper(mesures)}</span>`;
    const actions = document.createElement('div');
    actions.className = 'actions';
    const effacer = document.createElement('button');
    effacer.type = 'button';
    effacer.className = 'btn btn-petit btn-danger';
    effacer.textContent = t('supprimer');
    effacer.addEventListener('click', () => {
      actions.replaceChildren();
      const question = document.createElement('span');
      question.textContent = t('confirmer');
      const oui = document.createElement('button');
      oui.type = 'button';
      oui.className = 'btn btn-petit btn-danger';
      oui.textContent = t('supprimer');
      oui.addEventListener('click', async () => {
        await plateforme.stockage.enlever(p.id);
        definirPhotos(photos.filter((x) => x.id !== p.id));
        if (urlsPhotos.has(p.id)) URL.revokeObjectURL(urlsPhotos.get(p.id));
        urlsPhotos.delete(p.id);
        rendreParents();
      });
      const non = document.createElement('button');
      non.type = 'button';
      non.className = 'btn btn-petit';
      non.textContent = t('annuler');
      non.addEventListener('click', rendreParents);
      actions.append(question, oui, non);
    });
    actions.append(effacer);
    ligne.append(img, infos, actions);
    liste.append(ligne);
  });
  return liste;
}

export function rendreParents() {
  $('ecran-parents').lang = reglages.langue;
  $('parents-titre').textContent = t('titre');
  $('btn-fermer-parents').textContent = t('fermer');
  const zone = $('parents');
  const defilement = zone.scrollTop;
  zone.replaceChildren();

  const bLangue = bloc(t('langue'));
  bLangue.append(groupeChoix('langue', t('langue'), [['fr', 'Français'], ['ja', '日本語']], { apres: rendreParents }));
  bLangue.querySelector('legend').hidden = true;

  const bActivites = bloc(t('activites'), t('activitesAide'));
  bActivites.append(
    groupeActivites(),
    groupeChoix('nbQuestions', t('nbQuestions'), [[4, '4'], [6, '6'], [8, '8']]),
    groupeChoix('ecriture', t('ecriture'), [['hiragana', t('hiragana')], ['kanji', t('kanji')]]),
    groupeChoix('lireUnites', t('lireUnites'), [[true, t('oui')], [false, t('non')]]),
    groupeChoix('toucherLire', t('toucherLire'), [[true, t('oui')], [false, t('non')]], { apres: majBoutonsLire }),
    groupeChoix('noms', t('noms'), [[true, t('oui')], [false, t('non')]]),
    groupeChoix('court', t('court'), [[true, t('oui')], [false, t('non')]]),
    groupeChoix('aide', t('aide'), [[true, t('oui')], [false, t('non')]]),
  );
  const aideAide = document.createElement('p');
  aideAide.textContent = t('aideAide');
  bActivites.append(
    aideAide,
    groupeChoix('nombreMax', t('nombreMax'), [[10, '10'], [20, '20'], [50, '50'], [100, '100'], [1000, '1000']]),
    groupeChoix('compter', t('compter'), [[true, t('oui')], [false, t('non')]]),
  );
  bActivites.append(groupeCompteurs(), groupeChoix('exemple', t('exemple'), [[true, t('oui')], [false, t('non')]]));
  const etudeAide = document.createElement('p');
  etudeAide.textContent = t('etudeAide');
  const aideMV = document.createElement('p');
  aideMV.textContent = t('aideMV');
  bActivites.append(etudeAide, aideMV);
  const aideCourt = document.createElement('p');
  aideCourt.textContent = t('courtAide');
  bActivites.append(aideCourt);

  const bPhotos = bloc(t('photos'), t('photosAide'));
  if (!plateforme.stockage.persistant) {
    const avert = document.createElement('p');
    avert.className = 'avertissement';
    avert.textContent = t('stockage');
    bPhotos.append(avert);
  }
  // Deux boutons : l'appareil photo, ou une photo déjà prise.
  // (Sur Android, un seul bouton ouvre souvent la galerie sans proposer l'appareil photo.)
  const ajouter = document.createElement('div');
  ajouter.className = 'boutons-photo';
  [['fichier-camera', t('prendre'), 'btn btn-principal'], ['fichier-photo', t('galerie'), 'btn']].forEach(([id, texte, classe]) => {
    const bouton = document.createElement('label');
    bouton.className = classe;
    bouton.htmlFor = id;
    bouton.tabIndex = 0;
    bouton.textContent = texte;
    bouton.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); $(id).click(); }
    });
    ajouter.append(bouton);
  });
  const prive = document.createElement('p');
  prive.textContent = t('prive');
  bPhotos.append(
    listePhotos(),
    ajouter,
    groupeChoix('photos', t('photosUsage'), [['jamais', t('jamais')], ['melange', t('melange')], ['toujours', t('toujours')]]),
    prive,
  );

  const bVoix = bloc(t('voix'));
  const ecouter = document.createElement('button');
  ecouter.type = 'button';
  ecouter.className = 'btn';
  ecouter.textContent = t('ecouter');
  ecouter.addEventListener('click', () => parler(PHRASES.dotchiNagai));
  // Femme / homme, puis (si l'appareil en a plusieurs) la voix exacte ; on l'entend à chaque choix.
  const essayerVoix = () => {
    rendreParents();
    parler(['この こえで はなすよ。 ', ...PHRASES.dotchiNagai]);
  };
  bVoix.append(groupeChoix('voixGenre', t('genreVoix'), [['femme', t('femme')], ['homme', t('homme')]], {
    apres: () => {
      ecrireReglages({ voixNom: '' });
      essayerVoix();
    },
  }));
  const installees = voixJa();
  if (installees.length > 1) {
    bVoix.append(groupeChoix('voixNom', t('voixPrecise'), [
      ['', t('voixAuto')],
      ...installees.map((v) => [v.name, VOIX_HOMME.test(v.name) ? `${v.name} (${t('homme')})` : v.name]),
    ], { apres: essayerVoix }));
  }
  if (voixGrave()) {
    const p = document.createElement('p');
    p.textContent = t('voixGrave');
    bVoix.append(p);
  }
  bVoix.append(
    groupeChoix('vitesse', t('vitesse'), [[0.7, t('lente')], [0.9, t('normale')], [1.1, t('rapide')]]),
    groupeChoix('sons', t('sons'), [[true, t('oui')], [false, t('non')]]),
    ecouter,
  );
  if (plateforme.voix.disponible && plateforme.voix.voixDisponibles().length && !voixJaponaise()) {
    const p = document.createElement('p');
    p.textContent = t('sansVoix');
    bVoix.append(p);
  }

  const bToucher = bloc(t('toucher'));
  bToucher.append(
    groupeChoix('dureeAppui', t('dureeAppui'), [[0, t('immediat')], [300, '0,3 s'], [600, '0,6 s'], [1000, '1 s']]),
    groupeChoix('antiRebond', t('antiRebond'), [[0, t('non')], [300, t('rebondMeme')], [500, '0,5 s'], [1000, '1 s']]),
    groupeChoix('verserParTouche', t('verser'), [[false, t('verserMaintenir')], [true, t('verserTouche')]]),
    groupeChoix('animations', t('animations'), [['auto', t('animAuto')], ['reduites', t('animReduites')]], { apres: appliquerAnimations }),
  );

  const bIpad = bloc(t('ipad'), t('ipadAide'));

  zone.append(bLangue, bActivites, bPhotos, bVoix, bToucher, bIpad);
  zone.scrollTop = defilement;
}
