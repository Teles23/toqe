<#
.SYNOPSIS
  Expõe as portas de dev do toqe (3000, 3001, 8081) para a LAN quando os
  containers rodam dentro do WSL2 + Docker Engine.

.DESCRIPTION
  O Docker Engine no WSL2 cria sua própria bridge (`docker0`, 172.17.x).
  Containers que mapeiam `0.0.0.0:PORT` ficam acessíveis em `localhost`
  do WSL via NAT do iptables — mas o NAT **não respeita as interfaces
  espelhadas** do `networkingMode=mirrored`. Resultado: do host Windows,
  `localhost:3001` funciona, mas `192.168.0.134:3001` (IP da Wi-Fi/LAN)
  falha.

  Este script monta a ponte completa:

    1. **Hyper-V firewall** (escopo da VM do WSL): permite inbound TCP
       nas portas. Sem isso, mirrored droparia o pacote antes mesmo de
       chegar ao port-proxy.

    2. **netsh portproxy** (escopo do host Windows): faz o host escutar
       em `<IP-LAN>:PORT` (ou em `0.0.0.0:PORT` para cobrir todas as
       interfaces) e encaminhar para `127.0.0.1:PORT`. Como em mirrored
       `127.0.0.1` do Windows = `127.0.0.1` do WSL, o tráfego cai no
       Docker e chega no container.

    3. **Windows Defender Firewall**: inbound TCP nas portas, para
       conexões vindas de outros dispositivos da LAN.

  Resultado: `http://<IP-LAN>:3001` responde de qualquer aparelho da
  rede.

.NOTES
  Requer execução como ADMIN. Rode em PowerShell elevado:

    cd C:\Users\Thiago Teles\Documents\toqe
    Set-ExecutionPolicy -Scope Process Bypass
    .\tools\scripts\wsl-firewall-open-ports.ps1

  Para REMOVER tudo (uninstall):

    .\tools\scripts\wsl-firewall-open-ports.ps1 -Remove
#>
[CmdletBinding()]
param(
    [switch]$Remove,
    [int[]]$Ports = @(3000, 3001, 8081),
    [string]$RuleName = "toqe-dev"
)

# ── Detecção de WSL e IP da LAN ──────────────────────────────────────
$wslCreator = Get-NetFirewallHyperVVMCreator -ErrorAction SilentlyContinue |
    Where-Object { $_.FriendlyName -match "WSL" } |
    Select-Object -First 1

if (-not $wslCreator) {
    Write-Error "Não encontrei o VM creator do WSL. Confira: wsl --status"
    exit 1
}
$vmCreatorId = $wslCreator.VMCreatorId
Write-Host "WSL VM Creator: $vmCreatorId" -ForegroundColor Cyan

# Pega o IP da Wi-Fi/Ethernet "real" (descarta loopback, link-local,
# adaptadores virtuais como vEthernet, WSL, Hyper-V).
$lanIp = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.IPAddress -notmatch "^(127\.|169\.254\.|0\.0\.|172\.)" -and
        $_.PrefixOrigin -ne "WellKnown" -and
        $_.InterfaceAlias -notmatch "WSL|vEthernet|Loopback"
    } |
    Sort-Object { if ($_.InterfaceAlias -match "Wi-Fi") { 0 } else { 1 } } |
    Select-Object -ExpandProperty IPAddress -First 1

if (-not $lanIp) {
    Write-Warning "Não detectei IP de LAN; vou usar 0.0.0.0 (todas interfaces)."
    $lanIp = "0.0.0.0"
}
Write-Host "IP da LAN para portproxy: $lanIp" -ForegroundColor Cyan

# ── REMOVE ───────────────────────────────────────────────────────────
if ($Remove) {
    Write-Host "Removendo regras..." -ForegroundColor Yellow
    foreach ($p in $Ports) {
        netsh interface portproxy delete v4tov4 listenaddress=$lanIp listenport=$p 2>&1 | Out-Null
        netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=$p 2>&1 | Out-Null
    }
    Remove-NetFirewallHyperVRule -Name "$RuleName-inbound" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "$RuleName (LAN inbound)" -ErrorAction SilentlyContinue
    Write-Host "Pronto." -ForegroundColor Green
    exit 0
}

# ── CREATE ───────────────────────────────────────────────────────────
$portsStr = $Ports -join ","
Write-Host "Liberando portas TCP: $portsStr" -ForegroundColor Cyan

# 1. Hyper-V firewall (VM do WSL) — idempotente.
$existingHv = Get-NetFirewallHyperVRule -Name "$RuleName-inbound" -ErrorAction SilentlyContinue
if ($existingHv) {
    Write-Host "  [skip] regra Hyper-V '$RuleName-inbound' ja existe" -ForegroundColor DarkGray
} else {
    try {
        New-NetFirewallHyperVRule `
            -Name "$RuleName-inbound" `
            -DisplayName "$RuleName (Hyper-V inbound)" `
            -VMCreatorId $vmCreatorId `
            -Direction Inbound `
            -Protocol TCP `
            -LocalPorts ($Ports | ForEach-Object { [string]$_ }) `
            -Action Allow `
            -ErrorAction Stop | Out-Null
        Write-Host "  [OK] regra Hyper-V criada" -ForegroundColor Green
    } catch {
        Write-Warning "Falha Hyper-V (seguindo mesmo assim): $($_.Exception.Message)"
    }
}

# 2. Port-proxy: <IP-LAN>:PORT -> 127.0.0.1:PORT (mirrored faz o resto).
foreach ($p in $Ports) {
    # Limpa qualquer entrada antiga primeiro pra evitar conflito.
    netsh interface portproxy delete v4tov4 listenaddress=$lanIp listenport=$p 2>&1 | Out-Null
    $out = netsh interface portproxy add v4tov4 `
        listenaddress=$lanIp listenport=$p `
        connectaddress=127.0.0.1 connectport=$p 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] portproxy ${lanIp}:$p -> 127.0.0.1:$p" -ForegroundColor Green
    } else {
        Write-Warning "Falha portproxy porta ${p}: $out"
    }
}

# 3. Windows Defender Firewall (host) — idempotente.
$existingFw = Get-NetFirewallRule -DisplayName "$RuleName (LAN inbound)" -ErrorAction SilentlyContinue
if ($existingFw) {
    Write-Host "  [skip] regra Windows Firewall ja existe" -ForegroundColor DarkGray
} else {
    try {
        New-NetFirewallRule `
            -DisplayName "$RuleName (LAN inbound)" `
            -Direction Inbound `
            -Protocol TCP `
            -LocalPort $Ports `
            -Action Allow `
            -Profile Any `
            -ErrorAction Stop | Out-Null
        Write-Host "  [OK] regra Windows Firewall criada" -ForegroundColor Green
    } catch {
        Write-Warning "Falha Windows Firewall: $($_.Exception.Message)"
    }
}

# ── Teste de conectividade ───────────────────────────────────────────
Write-Host ""
Write-Host "Testando conectividade..." -ForegroundColor Cyan
foreach ($p in $Ports) {
    $ok = Test-NetConnection -ComputerName $lanIp -Port $p -InformationLevel Quiet -WarningAction SilentlyContinue
    $status = if ($ok) { "[OK]" } else { "[FAIL]" }
    $color = if ($ok) { "Green" } else { "Yellow" }
    Write-Host "  $status http://${lanIp}:${p}/" -ForegroundColor $color
}

Write-Host ""
Write-Host "Portproxy ativo:" -ForegroundColor DarkGray
netsh interface portproxy show all
