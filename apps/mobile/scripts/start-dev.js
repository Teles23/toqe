#!/usr/bin/env node
/**
 * Wrapper para `expo start` no Windows que resolve dois problemas crônicos
 * deste ambiente de desenvolvimento:
 *
 * 1. **Porta 8081 ocupada por iphlpsvc** (Auxiliar de IP do Windows).
 *    Não dá pra matar o serviço sem quebrar IPv6/Teredo. Solução: usar 8082.
 *
 * 2. **Metro escolhe interface errada** quando há Hyper-V/WSL/vEthernet
 *    ativos — o QR code aponta para 172.x.x.x e o celular dá timeout.
 *    Solução: detectar a interface LAN real e exportar
 *    `REACT_NATIVE_PACKAGER_HOSTNAME` antes do `expo start`.
 *
 * Heurística da escolha de IP (em ordem):
 *   - prefere 192.168.x.x (Wi-Fi doméstica típica)
 *   - depois 10.x.x.x ou 172.16-31.x.x não-virtual
 *   - ignora interfaces internas, virtuais (vEthernet/WSL/Hyper-V/Docker/VirtualBox)
 *   - usuário pode sobrescrever via `MOBILE_HOST_IP=192.168.x.x pnpm start`
 *
 * Aceita argumentos extras (`--tunnel`, `--ios`, etc.) repassados para o expo.
 */
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawn } = require("node:child_process");

// Carrega .env antes de detectar o IP para que MOBILE_HOST_IP seja respeitado
const envFile = path.resolve(__dirname, "../.env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const match = line.match(/^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2];
    }
  }
}

const VIRTUAL_PATTERNS =
  /vEthernet|WSL|Hyper-?V|Docker|VirtualBox|VMware|Bluetooth|Loopback|TAP/i;

function detectLanIPv4() {
  if (process.env.MOBILE_HOST_IP) {
    return { ip: process.env.MOBILE_HOST_IP, source: "MOBILE_HOST_IP env" };
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

const detected = detectLanIPv4();
const env = { ...process.env };
env.TOQE_DISABLE_KEEP_AWAKE = "1";

if (detected) {
  env.REACT_NATIVE_PACKAGER_HOSTNAME = detected.ip;
  console.log(
    `[start-dev] Metro hostname = ${detected.ip} (${detected.source})`,
  );
} else {
  console.warn(
    "[start-dev] Nao encontrei interface LAN. Metro vai escolher sozinho.",
  );
  console.warn(
    "[start-dev] Se o celular der timeout, rode com MOBILE_HOST_IP=<seu_ip> pnpm start",
  );
}

const extraArgs = process.argv.slice(2);
const expoArgs = ["expo", "start", "--port", "8082", ...extraArgs];

const child = spawn("npx", expoArgs, {
  stdio: "inherit",
  shell: true,
  env,
});

child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (err) => {
  console.error("[start-dev] Falha ao subir Expo:", err.message);
  process.exit(1);
});
