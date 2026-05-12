<#
.SYNOPSIS
  Libera as portas de dev do toqe (3000, 3001, 8081) no Hyper-V firewall do
  WSL (necessário com `networkingMode=mirrored` no `.wslconfig`).

.DESCRIPTION
  Em modo "mirrored" o WSL compartilha as interfaces de rede do Windows
  (`192.168.x.x`), mas o Hyper-V firewall que filtra o tráfego de/para a
  VM do WSL **só vem com regras inbound para ICMP e mDNS por padrão** —
  TCP inbound nas portas de aplicação é bloqueado. Resultado: containers
  Docker rodando dentro do WSL respondem em `localhost` mas não no IP
  da LAN da máquina (ex.: `192.168.0.134:3001`).

  Este script cria duas regras:
    1. Hyper-V firewall (escopo da VM do WSL): inbound TCP nas portas.
    2. Windows Defender Firewall (escopo do host): inbound TCP nas portas
       — necessário para conexões vindas de outros dispositivos da LAN.

.NOTES
  Requer execução como ADMIN. Rode em um PowerShell elevado:

    cd C:\Users\Thiago Teles\Documents\toqe
    Set-ExecutionPolicy -Scope Process Bypass
    .\tools\scripts\wsl-firewall-open-ports.ps1

  Para REMOVER as regras (uninstall):

    .\tools\scripts\wsl-firewall-open-ports.ps1 -Remove
#>
[CmdletBinding()]
param(
    [switch]$Remove,
    [int[]]$Ports = @(3000, 3001, 8081),
    [string]$RuleName = "toqe-dev"
)

# Detecta o VMCreatorId do WSL (UUID fixo do recurso "WSL" no host).
$wslCreator = Get-NetFirewallHyperVVMCreator -ErrorAction SilentlyContinue |
    Where-Object { $_.FriendlyName -match "WSL" } |
    Select-Object -First 1

if (-not $wslCreator) {
    Write-Error "Não encontrei o VM creator do WSL. Confira se mirrored networking está ativo (`wsl --status`)."
    exit 1
}

$vmCreatorId = $wslCreator.VMCreatorId
Write-Host "WSL VM Creator: $vmCreatorId" -ForegroundColor Cyan

# ── REMOVE ───────────────────────────────────────────────────────────
if ($Remove) {
    Write-Host "Removendo regras..." -ForegroundColor Yellow
    Remove-NetFirewallHyperVRule -Name "$RuleName-inbound" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "$RuleName (LAN inbound)" -ErrorAction SilentlyContinue
    Write-Host "Pronto." -ForegroundColor Green
    exit 0
}

# ── CREATE ───────────────────────────────────────────────────────────
$portsStr = $Ports -join ","
Write-Host "Liberando portas TCP: $portsStr" -ForegroundColor Cyan

# 1. Hyper-V firewall (VM do WSL).
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
    if ($_.Exception.Message -match "já existe|already exists") {
        Write-Host "  [skip] regra Hyper-V já existe" -ForegroundColor DarkGray
    } else {
        Write-Error "Falha ao criar regra Hyper-V: $($_.Exception.Message)"
        exit 1
    }
}

# 2. Windows Defender Firewall (host).
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
    if ($_.Exception.Message -match "já existe|already exists|0x80070571") {
        Write-Host "  [skip] regra Windows Firewall já existe" -ForegroundColor DarkGray
    } else {
        Write-Warning "Falha ao criar regra Windows Firewall: $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Host "Concluído. Teste de qualquer dispositivo da LAN:" -ForegroundColor Green
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
       Where-Object { $_.InterfaceAlias -match "Wi-Fi|Ethernet" -and $_.IPAddress -notmatch "^169\." } |
       Select-Object -First 1).IPAddress
if ($ip) {
    foreach ($p in $Ports) {
        Write-Host "  http://${ip}:${p}/"
    }
} else {
    Write-Host "  (IP da LAN não detectado automaticamente)"
}
