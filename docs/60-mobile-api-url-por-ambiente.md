# 60 — URL da API por ambiente (dev container vs build prod) + bind mounts do dev

**Status:** Implementado
**Branch:** develop

## Objetivo

Dev client (`expo start`) aponta para a **API do container de dev**; build EAS
(APK/loja) usa a **API de produção**. Sem mudança de código no app — só config.

## Como resolve

`api-client` lê `Constants.expoConfig.extra.apiUrl`. O `app.config.ts` agora
resolve isso de `process.env.EXPO_PUBLIC_API_URL`, com **fallback para produção**
(um build nunca vaza dev por engano).

| Cenário                          | De onde vem `EXPO_PUBLIC_API_URL`     | Resultado            |
| -------------------------------- | ------------------------------------- | -------------------- |
| `expo start` (dev client)        | `apps/mobile/.env.local` (gitignored) | API do container dev |
| `eas build --profile production` | `eas.json` → `production.env`         | `https://api.toqe-barber.com.br/api/v1` |
| `eas build --profile preview`    | `eas.json` → `preview.env`            | `https://api.toqe-barber.com.br/api/v1` |
| Nada definido                    | fallback no `app.config.ts`           | `https://api.toqe-barber.com.br/api/v1` |

| Arquivo                                 | Mudança                                                             |
| --------------------------------------- | ------------------------------------------------------------------- |
| `apps/mobile/app.config.ts`             | `extra.apiUrl = process.env.EXPO_PUBLIC_API_URL ?? <prod>`          |
| `apps/mobile/eas.json`                  | `preview` e `production` definem `env.EXPO_PUBLIC_API_URL = <prod>` |
| `apps/mobile/.env.local` _(gitignored)_ | URL do container dev (ex.: `http://192.168.100.55:3000/api/v1`)     |
| `apps/mobile/.env.local.example`        | template versionado (físico/emulador/simulador)                     |

### Trocar URL sem novo build (OTA Update)

`eas update` não lê as variáveis do bloco `env` do `eas.json` (que são exclusivas de
`eas build`). Para que o bundle OTA receba o valor correto, configure a variável no
painel do EAS e use `--environment`:

**1. No painel expo.dev:**
- Acesse o projeto → **Environment Variables**
- Adicione `EXPO_PUBLIC_API_URL` com o valor de produção no environment `production`

**2. Publique o OTA:**
```bash
eas update --environment production --message "nova URL da API"
```

Alternativamente, passe a variável inline (sem precisar do painel):
```bash
EXPO_PUBLIC_API_URL=https://api.toqe-barber.com.br/api/v1 \
  eas update --branch production --message "nova URL da API"
```

Não precisa de submissão para App Store/Play Store. Ver [87-producao-dominio-cloudflare.md](87-producao-dominio-cloudflare.md).

### Dev client — qual URL no `.env.local`

O device não enxerga `localhost` do host igual:

- **Celular físico (mesma WiFi):** `http://<IP_LAN_DO_HOST>:3000/api/v1` (use o `LAN_HOST_IP` do `.env` da raiz).
- **Emulador Android:** `http://10.0.2.2:3000/api/v1`.
- **Simulador iOS:** `http://localhost:3000/api/v1`.

## Bind mounts do `docker-compose.dev.yml`

O `pnpm install` no workspace toca o `node_modules` de **todos** os packages. O
compose dev faz bind mount de todo o repo (`.:/app`); sem volume isolando, um
`pnpm install` dentro do container reescreve o `node_modules` do host (Windows)
com symlinks/binários Linux → quebra o tooling do Windows (tsc, `expo start`) — e
o inverso também. Adicionamos volumes isolados para `apps/mobile`,
`packages/shared` e `packages/config` no serviço `api` (somando-se a
`root`/`apps/api`/`packages/contracts` que já tinham). Assim o install do
container fica contido nos volumes e não toca o host.

> **Aplicar:** recriar os containers para os novos volumes valerem
> (`docker compose -f docker-compose.dev.yml up -d --build`). Se faltar dep no
> container, recriar os volumes de node_modules a partir da imagem (não fazer
> `pnpm install` no host enquanto o do container roda — corrompe cross-OS).

**Solução definitiva (futura):** mover o repo para o fs nativo do WSL (`~/toqe`)
e trabalhar via VS Code Remote-WSL — elimina a lentidão do `/mnt/c` e o clash
cross-OS de node_modules. Ver memória `project_dev_infra`.
