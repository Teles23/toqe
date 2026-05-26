/**
 * Commitlint — valida mensagens de commit em Conventional Commits.
 * Doc: https://www.conventionalcommits.org/
 *
 * Tipos permitidos: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
 * Escopos sugeridos (não obrigatórios): web, api, mobile, contracts, ui, infra, docs, arch.
 *
 * Exemplos válidos:
 *   feat(web): adicionar dashboard metrics
 *   fix(api): corrigir refresh token rotation
 *   chore(arch): scaffolding Fase 1
 */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [1, "always", 120],
    "subject-case": [
      2,
      "never",
      ["start-case", "pascal-case", "upper-case"],
    ],
    "scope-enum": [
      1,
      "always",
      [
        "web",
        "api",
        "mobile",
        "contracts",
        "shared",
        "ui",
        "config",
        "eslint-config",
        "typescript-config",
        "infra",
        "docker",
        "ci",
        "docs",
        "arch",
        "deps",
      ],
    ],
  },
};
