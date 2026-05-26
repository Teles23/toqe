/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [
    (commit) => /^\[\d+\/\d+\]/.test(commit),
    (commit) => commit.startsWith('Merge '),
  ],
  rules: {
    // Squash merges com PR title longo excedem 100 chars naturalmente
    'header-max-length': [0, 'always', 100],
    // Corpo de squash merges agrega mensagens de sub-commits, linhas longas são normais
    'body-max-line-length': [0, 'always', 100],
    'footer-max-line-length': [0, 'always', 100],
  },
}
