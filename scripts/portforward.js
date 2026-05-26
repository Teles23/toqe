#!/usr/bin/env node
/**
 * Configura port forwarding no Windows para expor as portas do WSL2 na rede Wi-Fi.
 *
 * Por que é necessário:
 *   Metro e API rodam dentro do WSL (172.x.x.x), mas o celular só enxerga o
 *   IP do host Windows (192.168.x.x / 10.x.x.x). Sem o portproxy, qualquer
 *   conexão de fora cai no Windows e não chega ao WSL.
 *
 * O que faz:
 *   1. Lê o IP do WSL (eth0)
 *   2. Remove regras antigas (IP do WSL muda a cada restart)
 *   3. Adiciona portproxy: Windows 0.0.0.0:<porta> → WSL <ip>:<porta>
 *   4. Abre regras de firewall para as mesmas portas
 *
 * Requer elevação UAC — um prompt aparecerá no Windows.
 */
const os = require("os");
const fs = require("fs");
const { spawnSync } = require("child_process");

const PORTS = [8082, 3000, 3002]; // Metro, API, Web
const PS = "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe";

function getWSLIP() {
  const eth0 = os.networkInterfaces()["eth0"] ?? [];
  return eth0.find((a) => a.family === "IPv4" && !a.internal)?.address ?? null;
}

function setupPortForward() {
  const wslIp = getWSLIP();
  if (!wslIp) {
    console.error(
      "[portforward] eth0 não encontrado — abortando port forwarding.",
    );
    return;
  }

  if (!fs.existsSync(PS)) {
    console.warn(
      "[portforward] powershell.exe não encontrado em /mnt/c/Windows. Pulando.",
    );
    return;
  }

  console.log(`[portforward] WSL IP: ${wslIp}`);

  const LEGACY_PORTS = [3001]; // portas antigas que devem ser limpas

  const lines = [
    // Remove regras legadas de versões anteriores
    ...LEGACY_PORTS.map(
      (p) =>
        `netsh interface portproxy delete v4tov4 listenport=${p} listenaddress=0.0.0.0 2>$null`,
    ),
    ...LEGACY_PORTS.map(
      (p) =>
        `netsh advfirewall firewall delete rule name="Toqe Dev ${p}" 2>$null`,
    ),
    // Remove regras antigas das portas gerenciadas
    ...PORTS.map(
      (p) =>
        `netsh interface portproxy delete v4tov4 listenport=${p} listenaddress=0.0.0.0 2>$null`,
    ),
    // Adiciona novas regras apontando para o WSL
    ...PORTS.map(
      (p) =>
        `netsh interface portproxy add v4tov4 listenport=${p} listenaddress=0.0.0.0 connectport=${p} connectaddress=${wslIp}`,
    ),
    // Firewall: remove regra antiga e recria
    ...PORTS.flatMap((p) => [
      `netsh advfirewall firewall delete rule name="Toqe Dev ${p}" 2>$null`,
      `netsh advfirewall firewall add rule name="Toqe Dev ${p}" dir=in action=allow protocol=TCP localport=${p}`,
    ]),
    `Write-Host "[portforward] Portas ${PORTS.join(", ")} configuradas para WSL ${wslIp}"`,
  ];

  // IMPORTANTE: gravar em C:\Windows\Temp (não /tmp do WSL). O processo elevado
  // via UAC roda como Administrador e NÃO consegue ler o caminho de rede
  // \\wsl.localhost\... — então o script precisa estar num path nativo Windows.
  const tmpScript = "/mnt/c/Windows/Temp/toqe-portforward.ps1";
  fs.writeFileSync(tmpScript, lines.join("\r\n"), "utf8");

  const winPathResult = spawnSync("wslpath", ["-w", tmpScript], {
    encoding: "utf8",
  });
  if (winPathResult.status !== 0) {
    console.error("[portforward] wslpath falhou:", winPathResult.stderr);
    return;
  }
  const winPath = winPathResult.stdout.trim();

  console.log(
    "[portforward] Solicitando elevação UAC para configurar port forwarding...",
  );

  const result = spawnSync(
    PS,
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      // ArgumentList como ARRAY @(...) — string única com aspas escapadas quebra
      // o parsing do -File no processo elevado.
      `Start-Process powershell.exe -Verb RunAs -Wait -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File','${winPath}')`,
    ],
    { encoding: "utf8", timeout: 30000 },
  );

  if (result.status !== 0 || result.error) {
    console.error(
      "[portforward] Erro ao elevar privilégios:",
      result.stderr || result.error?.message,
    );
  } else {
    console.log(
      `[portforward] Portas ${PORTS.join(", ")} → WSL ${wslIp} ativas.`,
    );
  }
}

setupPortForward();
