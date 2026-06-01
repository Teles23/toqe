#!/usr/bin/env node
/**
 * Scanner rápido para padrões de bypass e riscos óbvios.
 *
 * Por padrão varre apenas arquivos alterados. Use `--all` para varrer o repo.
 * Não substitui lint, gitleaks ou revisão humana.
 */
const { execFileSync, spawnSync } = require("node:child_process");

const args = process.argv.slice(2);
const scanAll = args.includes("--all");

const patterns = [
  "@ts-ignore",
  "@ts-expect-error",
  "--passWithNoTests",
  "describe.skip",
  "it.skip",
  "executeRawUnsafe",
  "$queryRawUnsafe",
];

function git(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch (error) {
    if (typeof error.stdout === "string") {
      return error.stdout.trim();
    }
    throw error;
  }
}

function unique(values) {
  return [...new Set(values)].filter(Boolean);
}

function changedFiles() {
  return unique([
    ...git(["diff", "--name-only"]).split("\n"),
    ...git(["diff", "--cached", "--name-only"]).split("\n"),
    ...git(["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ]).filter(
    (file) =>
      file &&
      (file.startsWith("apps/") || file.startsWith("packages/")) &&
      /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file) &&
      !file.startsWith("apps/api/dist/"),
  );
}

const targets = scanAll ? ["apps", "packages"] : changedFiles();

if (targets.length === 0) {
  console.log("[security-scan] Nenhum arquivo de código alterado para varrer.");
  process.exit(0);
}

const result = spawnSync("rg", ["-n", patterns.join("|"), ...targets], {
  encoding: "utf8",
});

if (result.status === 0) {
  console.log(result.stdout);
  console.log(
    "\n[security-scan] Corrija os achados acima ou documente explicitamente uma exceção antes de prosseguir.",
  );
  process.exit(1);
}

if (result.status > 1) {
  process.stderr.write(result.stderr);
  process.exit(result.status);
}

console.log("[security-scan] Nenhum padrão crítico encontrado.");
