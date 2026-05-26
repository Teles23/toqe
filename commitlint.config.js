/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  ignores: [
    // Squash merges de sprint: "[1/2] Sprint name..."
    (commit) => /^\[\d+\/\d+\]/.test(commit),
    // Merge commits do git: "Merge branch", "Merge pull request", etc.
    (commit) => commit.startsWith("Merge "),
    // Merge records automáticos: "merge-record-*", "merge-integrate-*"
    (commit) => /^merge-/.test(commit),
    // Squash merge de PR do GitHub: qualquer commit cujo header termina com (#NNN)
    (commit) => /\(#\d+\)$/.test(commit.split("\n")[0]),
  ],
  rules: {
    // Projeto usa nomes próprios, siglas e classes nos subjects (VPS_USER, PessoaAPI,
    // ContatoService, Sprint C) — sentence-case seria inválido para todos esses casos
    "subject-case": [
      0,
      "never",
      ["sentence-case", "start-case", "pascal-case", "upper-case"],
    ],
    // Header: generoso mas com limite real (squash merges têm títulos longos)
    "header-max-length": [2, "always", 150],
    // Corpo/footer de squash merges agrega sub-commits — linhas longas inevitáveis
    "body-max-line-length": [0, "always", 100],
    "footer-max-line-length": [0, "always", 100],
  },
};
