# 27 — Correções CI/CD, Docker, Seed e HTTPS

**Status:** Concluído
**Branch:** develop
**Base:** develop

---

## Contexto

Após a implementação do CD automatizado (doc 26), uma série de problemas impediu
o funcionamento completo do ambiente de staging na VPS. Este documento registra
cada falha encontrada, a causa raiz e a correção aplicada.

---

## Problemas resolvidos

### 1. Container API unhealthy — URL do health check errada

**Sintoma:** `container toqe-prod-api-1 is unhealthy` no job de deploy do CI.

**Causa:** O health check usava `/api/v1/health/ready`, mas em `main.ts` o NestJS
exclui rotas `health/*` do prefixo global:

```typescript
app.setGlobalPrefix("api/v1", {
  exclude: ["health/*path"],
});
```

A URL real é `/health/ready`, não `/api/v1/health/ready`.

**Correção:** Atualizado o health check no Dockerfile, `docker-compose.prod.yml`
e `docker-compose.yml` para usar a URL correta:

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3000/health/ready || exit 1
```

```yaml
healthcheck:
  test: ["CMD", "wget", "-qO-", "http://localhost:3000/health/ready"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 60s
```

---

### 2. Login retornava `Cannot POST /api/auth/login` — nginx roteando errado

**Sintoma:** Erro `Cannot POST /api/auth/login` ao tentar logar no frontend.

**Causa:** O nginx tinha `location /api/` que interceptava as chamadas do BFF do
Next.js (`/api/auth/login`) e mandava para o NestJS, que não tem essa rota.
O NestJS só conhece `/api/v1/auth/login`.

**Fluxo correto:**

```
Browser → /api/auth/login → nginx → Next.js (BFF) → /api/v1/auth/login → NestJS
```

**Correção:** Trocado `location /api/` por `location /api/v1/` no nginx, para que
apenas rotas reais do NestJS sejam interceptadas:

```nginx
location /api/v1/ {
    proxy_pass http://127.0.0.1:4000;  # NestJS
}

location / {
    proxy_pass http://127.0.0.1:4001;  # Next.js (inclui /api/auth/*)
}
```

---

### 3. Deploy falhando em 17s — nginx sem sudo no CI

**Sintoma:** Job `deploy-develop` falhava após 17s (muito rápido para ser o health check).

**Causa:** O script SSH tentava escrever em `/etc/nginx/sites-available/` e
executar `systemctl reload nginx` sem `sudo`, e o usuário de deploy não tem
essas permissões.

**Correção:** Adicionado `sudo` nos comandos nginx do script de deploy em
`ci-full.yml`:

```yaml
sudo cp nginx/conf.d/toqe.conf /etc/nginx/sites-available/toqe
sudo nginx -t && sudo systemctl reload nginx
```

> **Pré-requisito na VPS:** o usuário SSH de deploy precisa ter entrada no
> sudoers sem senha para esses comandos específicos.

---

### 4. Login retornava `Serviço indisponível` — INTERNAL_API_URL não definido

**Sintoma:** BFF do Next.js retornava 503 `Serviço indisponível` ao tentar logar.

**Causa:** A Route Handler `/api/auth/login` usa `INTERNAL_API_URL` para chamar
o NestJS internamente. Como a variável não estava definida no container web, caía
no fallback `http://localhost:3000` — que dentro do container web aponta para ele
mesmo, não para o container `api`.

```typescript
// apps/web/src/app/api/auth/login/route.ts
const INTERNAL_API =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1"; // ← errado dentro do Docker
```

**Correção:** Adicionado `INTERNAL_API_URL` hardcoded no `docker-compose.prod.yml`
usando o nome DNS interno do Docker:

```yaml
web:
  environment:
    INTERNAL_API_URL: "http://api:3000/api/v1"
```

> `INTERNAL_API_URL` é server-side (Route Handlers). `NEXT_PUBLIC_API_URL` é
> client-side (browser). São variáveis distintas com propósitos diferentes.

---

### 5. Login retornava `Credenciais inválidas` — seed incompleto

**Sintoma:** Login chegava no NestJS mas retornava credenciais inválidas.

**Causa:** Existiam dois arquivos de seed:

- `prisma/seed.ts` — completo (usuários, barbearia, membros, serviços, agendamentos)
- `prisma/seed-runner.js` — **só criava planos**

O Dockerfile executa apenas o `seed-runner.js`. O `seed.ts` nunca rodava em
produção, deixando o banco sem usuários.

**Correção:** Migrado todo o conteúdo do `seed.ts` para o `seed-runner.js`
(formato CommonJS, executável diretamente pelo Node):

```
Credenciais de demonstração (APENAS DESENVOLVIMENTO LOCAL):
  thiago@email.com   / senha123  (dono)
  barbeiro1@email.com / senha123  (barbeiro)
```

> **ATENÇÃO — segurança:** Essas credenciais existem apenas para ambiente de
> desenvolvimento local. O Dockerfile de produção executa `seed-estrutural.js`,
> que insere somente os planos (dados obrigatórios). O `seed-runner.js` **não
> roda em produção** e possui guarda explícita que aborta se `NODE_ENV=production`
> (a menos que `RUN_DEMO_SEED=true` seja definido explicitamente).

---

### 6. `Failed to fetch` após login — NEXT_PUBLIC_API_URL incorreto

**Sintoma:** Login do BFF funcionava (API logava 201), mas o browser jogava
`Failed to fetch` na chamada subsequente a `GET /usuarios/me`.

**Causa:** Após o login, o `AuthProvider` chama `api.get("/usuarios/me")` que
usa `NEXT_PUBLIC_API_URL` — variável de build-time embutida no bundle pelo Next.js.
Se o secret no GitHub estava com `https://` antes do certificado estar ativo,
o browser bloqueava por mixed content (página HTTP chamando HTTPS). Se estava
vazio ou errado, o fallback `http://localhost:3000` apontava para a máquina do
usuário.

**Correção:** Atualizado o GitHub Secret `NEXT_PUBLIC_API_URL` para o valor
correto e feito rebuild da imagem:

| Fase      | Valor do secret                   |
| --------- | --------------------------------- |
| Sem HTTPS | `http://toqe.duckdns.org/api/v1`  |
| Com HTTPS | `https://toqe.duckdns.org/api/v1` |

---

### 7. HTTPS ativado via Certbot

**Comando executado na VPS:**

```bash
sudo certbot --nginx -d toqe.duckdns.org
```

O Certbot detectou o `server_name toqe.duckdns.org` no nginx, obteve o
certificado Let's Encrypt e configurou automaticamente o bloco SSL.

**Renovação automática** já configurada via systemd timer:

```bash
sudo systemctl status certbot.timer
```

> **Atenção:** Após ativar HTTPS, o `NEXT_PUBLIC_API_URL` no GitHub Secret deve
> usar `https://`, caso contrário o browser bloqueia por mixed content.

---

## Arquivos modificados

| Arquivo                          | Mudança                                                             |
| -------------------------------- | ------------------------------------------------------------------- |
| `apps/api/Dockerfile`            | Health check corrigido para `/health/ready` + `start_period=60s`    |
| `docker-compose.prod.yml`        | Health check corrigido + `INTERNAL_API_URL` no serviço web          |
| `docker-compose.yml`             | Health check corrigido para `/health/ready` + `start_period=60s`    |
| `nginx/conf.d/toqe.conf`         | `location /api/` → `location /api/v1/`                              |
| `.github/workflows/ci-full.yml`  | `sudo` nos comandos nginx do deploy                                 |
| `apps/api/prisma/seed-runner.js` | Seed completo: usuários, barbearia, membros, serviços, agendamentos |

---

## Commits

| Hash      | Descrição                                                            |
| --------- | -------------------------------------------------------------------- |
| `e17e344` | fix: health check URL corrigida para `/health/ready`                 |
| `1316d51` | fix(nginx): `location /api/` → `location /api/v1/`                   |
| `16cb323` | fix(ci): sincronizar nginx.conf para VPS e recarregar no deploy      |
| `6c1c231` | fix(ci): adicionar sudo nos comandos nginx do deploy                 |
| `fbc3d67` | fix(docker): definir INTERNAL_API_URL no container web               |
| `87cf60e` | fix(seed): incluir usuários, barbearia e agendamentos no seed-runner |

---

## Troubleshooting

```bash
# Verificar logs da API (seed, migrations, erros de boot)
docker compose -f /opt/projetos/toqe/docker-compose.prod.yml logs api --tail=50

# Verificar logs do Web
docker compose -f /opt/projetos/toqe/docker-compose.prod.yml logs web --tail=50

# Testar health check manualmente
wget -qO- http://127.0.0.1:4000/health/ready

# Verificar status do certificado
sudo certbot certificates

# Verificar renovação automática
sudo systemctl status certbot.timer
```

---

## Lições aprendidas

- `setGlobalPrefix` com `exclude` muda a URL real das rotas — verificar sempre
  antes de configurar health checks
- Dentro de containers Docker, `localhost` ≠ outro container; usar o nome do
  serviço definido no compose (`api`, `web`, etc.)
- `NEXT_PUBLIC_*` são build-time (browser); `INTERNAL_API_URL` é runtime
  server-side — variáveis diferentes para contextos diferentes
- Arquivos de seed duplicados desalinhados são uma armadilha silenciosa;
  manter um único ponto de verdade (`seed-runner.js`)
- Ativar HTTPS antes de atualizar `NEXT_PUBLIC_API_URL` para `https://`
  causa mixed content e bloqueia todas as chamadas de API no browser
