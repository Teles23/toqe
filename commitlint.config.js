/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [
    (commit) => /^\[\d+\/\d+\]/.test(commit),
    (commit) => commit.startsWith('Merge '),
    // squash merge de PR — header é o título da PR, fora do controle do autor
    (commit) => /\(#\d+\)$/.test(commit.split('\n')[0]),
  ],
  rules: {
    'header-max-length': [2, 'always', 150],
    'body-max-line-length': [0, 'always', 100],
    'footer-max-line-length': [0, 'always', 100],
  },
}
