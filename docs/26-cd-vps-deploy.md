# 26 — CD automatizado: develop → VPS Contabo

**Status:** Implementado (aguardando setup da VPS para ativar)
**Branch:** fix/sentry-nextjs-deprecations → develop
**Base:** develop

---

## Contexto

O CI já buildava e pushava imagens Docker para o GHCR após cada push no `develop`.
Este documento descreve o CD adicionado: após o push das imagens, o GitHub Actions
SSH na VPS e atualiza os containers automaticamente.

---

## Fluxo completo

```
git push origin develop
       ↓
ci-full.yml
       ↓
[integration] + [security]  (paralelo)
       ↓  (se passou)
[docker] → ghcr.io/teles23/toqe-api:develop
         → ghcr.io/teles23/toqe-web:develop
       ↓  (se passou)
[deploy-develop]
  scp: docker-compose.prod.yml + nginx/conf.d/toqe.conf → VPS /opt/toqe/
  ssh: docker login → pull → up -d → healthcheck → prune
       ↓
http://<VPS_IP>/          → Next.js (web)
http://<VPS_IP>/api/v1/   → NestJS (api)
http://<VPS_IP>/docs      → Swagger
http://<VPS_IP>/socket.io → WebSocket
```

---

## Arquivos criados / modificados

| Arquivo                         | Mudança                                                                 |
| ------------------------------- | ----------------------------------------------------------------------- |
| `docker-compose.prod.yml`       | Novo — compose da VPS usando imagens GHCR                               |
| `nginx/conf.d/toqe.conf`        | Atualizado — `server_name _` (IP direto) + proxy para `web:3001`        |
| `.github/workflows/ci-full.yml` | Job `deploy-develop` + `build-args` no job docker (NEXT_PUBLIC_API_URL) |
| `docs/26-cd-vps-deploy.md`      | Esta documentação                                                       |

---

## Setup único na VPS (feito pelo desenvolvedor, não automatizado)

### 1. Estrutura de diretórios

```bash
mkdir -p /opt/toqe/nginx/conf.d
```

### 2. Arquivo .env em `/opt/toqe/.env`

```env
POSTGRES_USER=toqe
POSTGRES_PASSWORD=<senha-forte>
DATABASE_URL=postgresql://toqe:<senha>@postgres:5432/toqe
REDIS_PASSWORD=<senha-forte>
JWT_SECRET=<64-chars>
JWT_REFRESH_SECRET=<64-chars>
RESEND_API_KEY=re_...
LOG_LEVEL=info
NODE_ENV=production
```

> `NEXT_PUBLIC_API_URL`, `NEXTAUTH_URL` e `NEXTAUTH_SECRET` são passados como
> build args/secrets do GitHub — não precisam estar no `.env` da VPS.

### 3. Chave SSH de deploy

Na máquina local:

```bash
ssh-keygen -t ed25519 -C "github-deploy-toqe" -f ~/.ssh/toqe_deploy -N ""
ssh-copy-id -i ~/.ssh/toqe_deploy.pub root@<VPS_IP>
```

### 4. GitHub Secrets (Settings → Secrets → Actions)

| Secret                | Valor                                            |
| --------------------- | ------------------------------------------------ |
| `VPS_HOST`            | IP da VPS Contabo                                |
| `VPS_USER`            | `root` (ou usuário com Docker)                   |
| `VPS_SSH_KEY`         | Conteúdo de `~/.ssh/toqe_deploy` (chave privada) |
| `VPS_SSH_PORT`        | `22`                                             |
| `NEXT_PUBLIC_API_URL` | `http://<VPS_IP>/api/v1`                         |

> `GITHUB_TOKEN` existe automaticamente.

---

## Detalhes de implementação

### Por que `build-args` no job docker?

`NEXT_PUBLIC_*` são variáveis de build-time no Next.js (inlined no bundle pelo webpack).
Se não passadas durante o `docker build`, ficam `undefined` na UI em produção.
Adicionamos `NEXT_PUBLIC_API_URL` como GitHub Secret e passamos via `build-args`
no job `docker` do `ci-full.yml`. O Dockerfile da api ignora esse arg.

### Por que `scp` + `ssh` separados?

O `scp` sincroniza o `docker-compose.prod.yml` e o `nginx/conf.d/toqe.conf`
do repo para a VPS a cada deploy. Isso garante que a VPS nunca fique
desatualizada com configs antigas — não é necessário SSH na VPS para atualizar
manualmente os arquivos de config.

### Migrações

As migrações do Prisma rodam automaticamente no startup do container `api`
(CMD do Dockerfile: `prisma migrate deploy && node dist/main.js`). O `sleep 25`
no healthcheck do deploy aguarda esse processo antes de verificar `/health/ready`.

---

## Troubleshooting na VPS

```bash
# Ver status dos containers
docker compose -f /opt/toqe/docker-compose.prod.yml ps

# Logs da API (últimas 100 linhas)
docker compose -f /opt/toqe/docker-compose.prod.yml logs api --tail=100

# Logs do Web
docker compose -f /opt/toqe/docker-compose.prod.yml logs web --tail=100

# Reiniciar manualmente
docker compose -f /opt/toqe/docker-compose.prod.yml up -d --remove-orphans

# Verificar healthcheck
wget -qO- http://localhost/api/v1/health/ready
```

---

## Próximos passos (futuro)

- Adicionar domínio → trocar `server_name _` por `server_name seudominio.com`
- Adicionar HTTPS via Certbot/Let's Encrypt
- Criar ambiente `production` (branch `main`) com secrets separados
- Adicionar notificação no Slack/Discord em caso de deploy failure
