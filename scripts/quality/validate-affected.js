#!/usr/bin/env node
/**
 * Executa checks seletivos com base no diff atual.
 *
 * Uso:
 *   node scripts/quality/validate-affected.js
 *   node scripts/quality/validate-affected.js --base HEAD~1
 *   node scripts/quality/validate-affected.js --dry-run
 */
const { execFileSync, spawnSync } = require("node:child_process");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const baseIndex = args.indexOf("--base");
const base = baseIndex >= 0 ? args[baseIndex + 1] : null;

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

function affectedChecks(files) {
  const checks = new Set();

  for (const file of files) {
    if (file.startsWith("apps/api/")) {
      checks.add("api:lint");
      checks.add("api:test");
    }

    if (file.startsWith("apps/web/")) {
      checks.add("web:lint");
      checks.add("web:types");
      checks.add("web:test");
    }

    if (file.startsWith("apps/mobile/")) {
      checks.add("mobile:lint");
      checks.add("mobile:types");
      checks.add("mobile:test");
    }

    if (
      file.startsWith("packages/contracts/") ||
      file.startsWith("packages/shared/")
    ) {
      checks.add("root:types");
      checks.add("api:test");
      checks.add("web:test");
      checks.add("mobile:test");
    }

    if (
      file.includes("prisma/schema.prisma") ||
      file.includes("prisma/migrations/")
    ) {
      checks.add("api:prisma-generate");
      checks.add("api:test");
      checks.add("api:integration");
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
      checks.add("api:security");
    }

    if (
      file.startsWith(".github/") ||
      file.startsWith("docker-compose") ||
      file.includes("Dockerfile")
    ) {
      checks.add("root:build");
    }

    if (
      file === "package.json" ||
      file.endsWith("/package.json") ||
      file === "pnpm-lock.yaml"
    ) {
      checks.add("root:audit-prod");
    }
  }

  return [...checks];
}

const commands = {
  "api:lint": ["pnpm", ["--filter", "api", "lint"]],
  "api:prisma-generate": [
    "pnpm",
    ["--filter", "api", "exec", "prisma", "generate"],
  ],
  "api:test": ["pnpm", ["--filter", "api", "test"]],
  "api:integration": ["pnpm", ["--filter", "api", "test:integration"]],
  "api:security": ["pnpm", ["--filter", "api", "test:security"]],
  "web:lint": ["pnpm", ["--filter", "web", "lint"]],
  "web:types": ["pnpm", ["--filter", "web", "check-types"]],
  "web:test": ["pnpm", ["--filter", "web", "test"]],
  "mobile:lint": ["pnpm", ["--filter", "mobile", "lint"]],
  "mobile:types": ["pnpm", ["--filter", "mobile", "type-check"]],
  "mobile:test": ["pnpm", ["--filter", "mobile", "test"]],
  "root:types": ["pnpm", ["check-types"]],
  "root:build": ["pnpm", ["build"]],
  "root:audit-prod": ["pnpm", ["audit", "--prod", "--audit-level=high"]],
};

const checks = affectedChecks(changedFiles());

if (checks.length === 0) {
  console.log("Nenhum check seletivo necessário.");
  process.exit(0);
}

for (const name of checks) {
  const command = commands[name];
  if (!command) continue;

  const printable = [command[0], ...command[1]].join(" ");
  if (dryRun) {
    console.log(printable);
    continue;
  }

  console.log(`\n[validate-affected] ${printable}`);
  const result = spawnSync(command[0], command[1], { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
