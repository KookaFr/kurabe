/* Écrit la VERSION du service worker (sw.js) à partir du dépôt git : kurabe-v<numéro>-<hash court>.
   À lancer avant chaque mise en ligne : npm run version-sw [numéro]
   Sans numéro, on garde celui qui est déjà dans sw.js et on ne change que le hash. */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const fichier = path.join(__dirname, '..', 'sw.js');
const source = fs.readFileSync(fichier, 'utf8');
const actuel = source.match(/const VERSION = 'kurabe-v(\d+)(?:-[0-9a-f]+)?';/);
if (!actuel) {
  console.error('sw.js : ligne VERSION introuvable');
  process.exit(1);
}
const numero = process.argv[2] || actuel[1];
let hash = 'local';
try { hash = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* hors git */ }
const version = `kurabe-v${numero}-${hash}`;
fs.writeFileSync(fichier, source.replace(actuel[0], `const VERSION = '${version}';`));
console.log(`sw.js : VERSION = ${version}`);
