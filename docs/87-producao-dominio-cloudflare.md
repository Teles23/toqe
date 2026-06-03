# 87 — Produção: domínio toqe-barber.com.br + Cloudflare + nginx subdomínios

**Status:** Implementado
**PRs:** #156 (nginx), #157 (develop→main), #158 (mobile URL)
**Data:** 2026-06-02

---

## Contexto

Migração do domínio de produção de `toqe.duckdns.org` (DuckDNS + Let's Encrypt) para
`toqe-barber.com.br` (registro.br + Cloudflare + Origin Certificate).

---

## Arquitetura de subdomínios

| Subdomínio | Destino | Porta host |
|---|---|---|
| `app.toqe-barber.com.br` | Next.js | 4001 |
| `api.toqe-barber.com.br` | NestJS | 4000 |
| `toqe-barber.com.br` | redirect → `app` | — |

---

## SSL — Cloudflare Origin Certificate

Modo Cloudflare: **Full (strict)**

1. Cloudflare dashboard → **SSL/TLS → Origin Server → Create Certificate**
   - Hostnames: `toqe-barber.com.br`, `*.toqe-barber.com.br`
   - Tipo: RSA 2048 — Validade: 15 anos
2. Salvar no VPS:
   ```bash
   sudo mkdir -p /etc/ssl/cloudflare
   sudo nano /etc/ssl/cloudflare/toqe-barber.pem   # Origin Certificate
   sudo nano /etc/ssl/cloudflare/toqe-barber.key   # Private Key
   sudo chmod 600 /etc/ssl/cloudflare/toqe-barber.key
   ```

---

## nginx — `nginx/conf.d/toqe.conf`

Arquivo sincronizado para o VPS pelo CI Deploy via SCP + `sudo nginx -t && systemctl reload nginx`.

Três server blocks:
- `api.toqe-barber.com.br:443` → proxy `127.0.0.1:4000` (API REST + Swagger + WebSocket)
- `app.toqe-barber.com.br:443` → proxy `127.0.0.1:4001` (Next.js)
- `toqe-barber.com.br:443/80` → `301 → https://app.toqe-barber.com.br`

---

## Cloudflare — configurações de segurança

| Seção | Configuração | Valor |
|---|---|---|
| SSL/TLS → Overview | Mode | Full (strict) |
| SSL/TLS → Edge Certificates | Always Use HTTPS | ON |
| SSL/TLS → Edge Certificates | Minimum TLS Version | TLS 1.2 |
| SSL/TLS → Edge Certificates | TLS 1.3 | ON |
| SSL/TLS → Edge Certificates | Automatic HTTPS Rewrites | ON |
| SSL/TLS → Edge Certificates | HSTS | Enabled (6 meses, includeSubDomains) |
| Security → Settings | Security Level | Medium |
| Security → Settings | Browser Integrity Check | ON |
| Security → Bots | Bot Fight Mode | ON |
| Speed → Optimization | Brotli | ON |

---

## GitHub Secrets atualizados

| Secret | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.toqe-barber.com.br/api/v1` |
| `NEXT_PUBLIC_BOOKING_DOMAIN` | `app.toqe-barber.com.br` |
| `FRONTEND_URL` | `https://app.toqe-barber.com.br` |
| `API_BASE_URL` | `https://api.toqe-barber.com.br` |
| `CORS_ORIGINS` | `https://app.toqe-barber.com.br` |
| `MOBILE_ANDROID_PACKAGE_NAME` | `com.teles23.toqe` |
| `MOBILE_ANDROID_SHA256_CERT_FINGERPRINTS` | SHA-256 do certificado Android (preview/prod separados por vírgula) |
| `MOBILE_IOS_APP_ID` | `TEAMID.com.teles23.toqe` |

`NEXT_PUBLIC_API_URL` é baked no bundle Next.js em build time. Mudança de URL requer
novo deploy via CI (push para main dispara rebuild automático).

---

## Mobile — EAS URL (`apps/mobile`)

| Arquivo | O que mudou |
|---|---|
| `eas.json` | `EXPO_PUBLIC_API_URL` → `https://api.toqe-barber.com.br/api/v1` e `EXPO_PUBLIC_APP_LINK_DOMAIN` → `app.toqe-barber.com.br` (preview + production) |
| `app.config.ts` | Fallback `API_URL_PROD` atualizado |
| `.env.example` | Comentário atualizado |

### Universal Links / App Links

O domínio `app.toqe-barber.com.br` também é o domínio de links públicos do mobile.
Quando o app estiver instalado e o build nativo tiver sido gerado com
`EXPO_PUBLIC_APP_LINK_DOMAIN=app.toqe-barber.com.br`, os caminhos abaixo podem
abrir o app:

- `https://app.toqe-barber.com.br/b/:slug`
- `https://app.toqe-barber.com.br/u/:slug`
- `https://app.toqe-barber.com.br/convite?token=...`

O Web serve os arquivos de associação em:

- `https://app.toqe-barber.com.br/.well-known/assetlinks.json`
- `https://app.toqe-barber.com.br/.well-known/apple-app-site-association`

Esses arquivos são parametrizados por variáveis de ambiente. Sem
`MOBILE_ANDROID_SHA256_CERT_FINGERPRINTS`, o Android não verifica App Links. Sem
`MOBILE_IOS_APP_ID` ou `MOBILE_APPLE_TEAM_ID`, o iOS não associa Universal Links.

Alterar `EXPO_PUBLIC_APP_LINK_DOMAIN`, `android.intentFilters` ou
`ios.associatedDomains` exige **novo build nativo EAS**; OTA update não altera
essa associação.


### Trocar URL no mobile sem novo build

```bash
# Opção 1: via EAS Environment Variables (expo.dev → projeto → Environment Variables)
eas update --environment production --message "nova URL da API"

# Opção 2: inline (sem configurar no painel)
EXPO_PUBLIC_API_URL=https://api.toqe-barber.com.br/api/v1 \
  eas update --branch production --message "nova URL da API"
```

`eas update --branch` não lê o bloco `env` do `eas.json` (exclusivo de `eas build`).
OTA Update empurra novo bundle JS para todos os dispositivos (~2 min).
Não precisa de submissão para App Store/Play Store.
Só exige novo build quando muda código nativo (plugins, permissões, SDK).

---

## Swagger em produção

O Swagger (`/docs`) é desabilitado quando `NODE_ENV=production`. Para acessar:

```bash
# SSH tunnel para o VPS
ssh -L 4000:127.0.0.1:4000 usuario@vps
# Acessa no browser:
# http://localhost:4000/docs
```
