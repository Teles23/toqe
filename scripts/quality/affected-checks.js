#!/usr/bin/env node
/**
 * Sugere checks relevantes a partir dos arquivos alterados.
 *
 * Uso:
 *   node scripts/quality/affected-checks.js
 *   node scripts/quality/affected-checks.js --base HEAD~1
 *   node scripts/quality/affected-checks.js --names-only
 */
const { execFileSync } = require("node:child_process");

const args = process.argv.slice(2);
const baseIndex = args.indexOf("--base");
const base = baseIndex >= 0 ? args[baseIndex + 1] : null;
const namesOnly = args.includes("--names-only");

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
  const files = [];

  if (base) {
    files.push(...git(["diff", "--name-only", base]).split("\n"));
  } else {
    files.push(...git(["diff", "--name-only"]).split("\n"));
    files.push(...git(["diff", "--cached", "--name-only"]).split("\n"));
    files.push(
      ...git(["ls-files", "--others", "--exclude-standard"]).split("\n"),
    );
  }

  return unique(files).filter(
    (file) => file && !file.startsWith("node_modules/"),
  );
}

const files = changedFiles();
const checks = new Map();
const notes = [];

function add(name, command, reason) {
  if (!checks.has(name)) checks.set(name, { command, reasons: [] });
  checks.get(name).reasons.push(reason);
}

for (const file of files) {
  if (file.startsWith("apps/api/")) {
    add("api:lint", "pnpm --filter api lint", file);
    add("api:test", "pnpm --filter api test", file);
  }

  if (file.startsWith("apps/web/")) {
    add("web:lint", "pnpm --filter web lint", file);
    add("web:types", "pnpm --filter web check-types", file);
    add("web:test", "pnpm --filter web test", file);
  }

  if (file.startsWith("apps/mobile/")) {
    add("mobile:lint", "pnpm --filter mobile lint", file);
    add("mobile:types", "pnpm --filter mobile type-check", file);
    add("mobile:test", "pnpm --filter mobile test", file);
  }

  if (
    file.startsWith("packages/contracts/") ||
    file.startsWith("packages/shared/")
  ) {
    add("root:types", "pnpm check-types", file);
    add("api:test", "pnpm --filter api test", file);
    add("web:test", "pnpm --filter web test", file);
    add("mobile:test", "pnpm --filter mobile test", file);
  }

  if (
    file.includes("prisma/schema.prisma") ||
    file.includes("prisma/migrations/")
  ) {
    add("api:prisma-generate", "pnpm --filter api exec prisma generate", file);
    add("api:test", "pnpm --filter api test", file);
    add("api:integration", "pnpm --filter api test:integration", file);
  }

  if (
    file.includes("/auth/") ||
    file.includes("/tenant/") ||
    file.includes("/asaas/") ||
    file.includes("/api-key/") ||
    file.includes("/fidelidade/") ||
    file.includes("guard") ||
    file.includes("webhook")
  ) {
    add("api:security", "pnpm --filter api test:security", file);
  }

  if (
    file.startsWith(".github/") ||
    file.startsWith("docker-compose") ||
    file.includes("Dockerfile")
  ) {
    add("root:build", "pnpm build", file);
    notes.push(`Revisar CI/infra manualmente: ${file}`);
  }

  if (
    file === "package.json" ||
    file.endsWith("/package.json") ||
    file === "pnpm-lock.yaml"
  ) {
    add("root:audit-prod", "pnpm audit --prod --audit-level=high", file);
  }
}

if (files.length === 0) {
  console.log("Nenhum arquivo alterado detectado.");
  process.exit(0);
}

if (namesOnly) {
  for (const [name] of checks) console.log(name);
  process.exit(0);
}

console.log("Arquivos alterados:");
for (const file of files) console.log(`- ${file}`);

console.log("\nChecks recomendados:");
for (const [name, check] of checks) {
  console.log(`- ${name}: ${check.command}`);
  console.log(`  motivos: ${unique(check.reasons).join(", ")}`);
}

if (notes.length) {
  console.log("\nNotas:");
  for (const note of unique(notes)) console.log(`- ${note}`);
}
