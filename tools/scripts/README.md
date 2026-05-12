# tools/scripts

Scripts auxiliares de desenvolvimento. Não são executados pelo CI; rodam manualmente no host do desenvolvedor.

## `wsl-firewall-open-ports.ps1`

Libera as portas de dev (`3000`, `3001`, `8081`) no Hyper-V firewall do WSL2.

**Quando usar:** se o `.wslconfig` está com `networkingMode=mirrored` e os containers respondem em `localhost` mas **não** no IP da LAN (ex.: `192.168.0.134:3001`), o motivo é que o firewall do Hyper-V só vem com regras para ICMP/mDNS por padrão — TCP inbound nas portas de aplicação fica bloqueado.

**Como rodar** (PowerShell **como Administrador**):

```powershell
cd C:\Users\Thiago Teles\Documents\toqe
Set-ExecutionPolicy -Scope Process Bypass
.\tools\scripts\wsl-firewall-open-ports.ps1
```

**Remover as regras**:

```powershell
.\tools\scripts\wsl-firewall-open-ports.ps1 -Remove
```

**Portas customizadas**:

```powershell
.\tools\scripts\wsl-firewall-open-ports.ps1 -Ports 3000,3001,8081,5432
```
