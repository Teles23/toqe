#!/usr/bin/env node
const os = require("os");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const VIRTUAL_PATTERNS =
  /vEthernet|WSL|Hyper-?V|Docker|VirtualBox|VMware|Bluetooth|Loopback|TAP/i;

function isWSL() {
  try {
    const version = fs.readFileSync("/proc/version", "utf8");
    return /microsoft|wsl/i.test(version);
  } catch {
    return false;
  }
}

// No WSL2, busca o IP LAN real do host Windows via powershell.exe
function detectWindowsLanIP() {
  try {
    const ps = fs.existsSync(
      "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe",
    )
      ? "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe"
      : "powershell.exe";
    // Usa spawnSync com args como array para evitar que o bash expanda $_ etc.
    const result = spawnSync(
      ps,
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "$p = Get-NetIPAddress -AddressFamily IPv4; $r = $p | Where-Object { $_.IPAddress -like '192.168.*' } | Select-Object -First 1; if (-not $r) { $r = $p | Where-Object { $_.IPAddress -like '10.*' } | Select-Object -First 1 }; $r.IPAddress",
      ],
      { encoding: "utf8", timeout: 5000 },
    );
    const raw = (result.stdout ?? "").trim().replace(/\r/g, "");

    if (raw && /^\d+\.\d+\.\d+\.\d+$/.test(raw)) {
      return { ip: raw, source: "Windows host (powershell)" };
    }
  } catch (err) {
    console.warn("[detect-ip] powershell.exe falhou:", err.message);
  }
  return null;
}

function detectLanIPv4() {
  if (process.env.MOBILE_HOST_IP) {
    return { ip: process.env.MOBILE_HOST_IP, source: "MOBILE_HOST_IP env" };
  }

  if (isWSL()) {
    const winIp = detectWindowsLanIP();
    if (winIp) return winIp;
    console.warn(
      "[detect-ip] Não conseguiu IP do Windows via powershell, tentando interfaces WSL...",
    );
  }

  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (VIRTUAL_PATTERNS.test(name)) continue;
    for (const addr of addrs ?? []) {
      if (addr.family !== "IPv4" || addr.internal) continue;
      let priority = 99;
      if (addr.address.startsWith("192.168.")) priority = 1;
      else if (addr.address.startsWith("10.")) priority = 2;
      else if (/^172\.(1[6-9]|2\d|3[01])\./.test(addr.address)) priority = 3;
      candidates.push({ ip: addr.address, name, priority });
    }
  }

  candidates.sort((a, b) => a.priority - b.priority);
  const winner = candidates[0];
  return winner ? { ip: winner.ip, source: winner.name } : null;
}

function upsertEnvVar(content, key, value) {
  const line = `${key}=${value}`;
  if (content.includes(`${key}=`)) {
    return content.replace(new RegExp(`${key}=.*`), line);
  }
  return content.endsWith("\n")
    ? content + line + "\n"
    : content + "\n" + line + "\n";
}

function updateMobileEnvFile(filePath, ip) {
  const apiUrl = `http://${ip}:3000/api/v1`;
  let content = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, "utf8")
    : "";
  content = upsertEnvVar(content, "EXPO_PUBLIC_API_URL", apiUrl);
  content = upsertEnvVar(content, "MOBILE_HOST_IP", ip);
  fs.writeFileSync(filePath, content);
}

function updateWebEnvFile(filePath, ip) {
  let content = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, "utf8")
    : "";
  content = upsertEnvVar(content, "DEV_HOST_IP", ip);
  content = upsertEnvVar(
    content,
    "NEXT_PUBLIC_API_URL",
    `http://${ip}:3000/api/v1`,
  );
  fs.writeFileSync(filePath, content);
}

const detected = detectLanIPv4();
if (!detected) {
  console.warn("⚠️  Nenhuma interface LAN detectada. Usando localhost.");
  process.exit(0);
}

const ip = detected.ip;
console.log(`✅ IP detectado: ${ip} (${detected.source})`);

const rootDir = path.resolve(__dirname, "..");

const mobileEnvFile = path.join(rootDir, "apps/mobile/.env.local");
updateMobileEnvFile(mobileEnvFile, ip);
console.log(`✅ ${mobileEnvFile} atualizado`);

const webEnvFile = path.join(rootDir, "apps/web/.env.local");
updateWebEnvFile(webEnvFile, ip);
console.log(`✅ ${webEnvFile} atualizado (DEV_HOST_IP + NEXT_PUBLIC_API_URL)`);

console.log(`\n🚀 Pronto! App conectará em: http://${ip}:3000/api/v1`);
