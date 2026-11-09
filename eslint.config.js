// ESLint (configuration plate). Lancer : npm run lint
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser } },
    rules: {
      'no-unused-vars': ['warn', { args: 'none' }],
      'prefer-const': 'warn',
      'eqeqeq': ['error', 'smart'],
      'no-implicit-globals': 'error',
    },
  },
  {
    files: ['sw.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.serviceworker } },
  },
  {
    files: ['tests/**/*.js', 'outils/**/*.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node, ...globals.browser } },
  },
];
