/* Test de fumée : ouvre chaque activité sur quatre formats d'écran, joue un geste, et vérifie
   qu'il n'y a ni erreur JavaScript, ni débordement horizontal, ni texte coupé dans un bouton.
   Lancer : npm test   (le serveur local démarre tout seul ; Chromium via Playwright). */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 8125;
const URL = `http://localhost:${PORT}/index.html`;
const FORMATS = {
  ipad: { width: 1180, height: 820, isMobile: false },
  android: { width: 360, height: 740, isMobile: true },
  galaxy: { width: 320, height: 658, isMobile: true },
  paysage: { width: 780, height: 360, isMobile: true },
};
const ONGLETS = 4;

function serveur() {
  const racine = path.join(__dirname, '..');
  const proc = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: racine, stdio: 'ignore' });
  return new Promise((ok, ko) => {
    let essais = 0;
    const tenter = () => http.get(URL, (r) => { r.resume(); ok(proc); }).on('error', () => (essais++ < 40 ? setTimeout(tenter, 100) : ko(new Error('serveur injoignable'))));
    tenter();
  });
}

// Ce qu'on vérifie après chaque geste.
const controler = (page) => page.evaluate(() => {
  const vp = window.innerWidth;
  const horizontal = document.documentElement.scrollWidth > vp;
  const coupes = [...document.querySelectorAll('button:not([hidden])')]
    .filter((b) => b.offsetParent !== null && b.scrollWidth > b.clientWidth + 2)
    .map((b) => `${b.className.split(' ')[1] || b.className} « ${b.textContent.trim().slice(0, 24)} » ${b.scrollWidth}>${b.clientWidth}`);
  return { horizontal, coupes };
});

// Un geste par écran : répondre à une question, avancer une leçon.
async function jouer(page) {
  const clic = async (sel) => {
    const l = page.locator(`${sel}`).locator('visible=true').first();
    if (!(await l.count()) || !(await l.isEnabled())) return false;
    await l.click({ timeout: 3000 });
    await page.waitForTimeout(350);
    return true;
  };
  if (!(await page.locator('#ecran-etude').isHidden())) {
    if (!(await clic('#etude-suivant'))) if (!(await clic('.reserve-piece:not([disabled])'))) await clic('#etude-plus:not([disabled])');
    return;
  }
  await clic('#choix-mots button:not([disabled]), #etabli .ligne, #etabli .cible, #etabli button:not([disabled]), .choix button:not([disabled])');
  await clic('#btn-sais-pas');
  await page.waitForTimeout(400);
  await clic('#btn-suivant');
}

(async () => {
  const proc = await serveur();
  const browser = await chromium.launch();
  const problemes = [];
  let ecrans = 0;
  for (const [nom, f] of Object.entries(FORMATS)) {
    const ctx = await browser.newContext({ viewport: { width: f.width, height: f.height }, isMobile: f.isMobile, hasTouch: true, deviceScaleFactor: 1, locale: 'ja-JP' });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      delete window.speechSynthesis;
      if (navigator.serviceWorker) navigator.serviceWorker.register = () => new Promise(() => {});
    });
    let contexte = '';
    page.on('pageerror', (e) => problemes.push(`${nom} ${contexte} : exception ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|ERR_FAILED/.test(m.text())) problemes.push(`${nom} ${contexte} : console ${m.text()}`); });
    for (let onglet = 0; onglet < ONGLETS; onglet++) {
      await page.goto(URL, { waitUntil: 'load' });
      await page.click(`#themes button >> nth=${onglet}`);
      const cartes = await page.locator('#activites button').count();
      for (let carte = 0; carte < cartes; carte++) {
        await page.goto(URL, { waitUntil: 'load' });
        await page.click(`#themes button >> nth=${onglet}`);
        const titre = (await page.locator('#activites button strong').nth(carte).textContent()).trim();
        contexte = `onglet ${onglet} · ${titre}`;
        await page.locator('#activites button').nth(carte).click();
        await page.waitForTimeout(500);
        for (let pas = 0; pas < 2; pas++) {
          const c = await controler(page);
          if (c.horizontal) problemes.push(`${nom} ${contexte} : débordement horizontal`);
          c.coupes.forEach((x) => problemes.push(`${nom} ${contexte} : texte coupé ${x}`));
          ecrans++;
          await jouer(page);
        }
      }
    }
    await ctx.close();
  }
  await browser.close();
  proc.kill();
  const uniques = [...new Set(problemes)];
  console.log(`${ecrans} écrans vérifiés sur ${Object.keys(FORMATS).length} formats.`);
  if (uniques.length) {
    console.log(`${uniques.length} problème(s) :`);
    uniques.forEach((p) => console.log(' - ' + p));
    process.exit(1);
  }
  console.log('Aucun problème.');
})().catch((e) => { console.error(e); process.exit(1); });
