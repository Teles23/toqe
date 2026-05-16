# 32 — Correções CI/CD: deploy VPS, seed e validação

**Status:** Concluído
**Branch:** develop
**Base:** develop

---

## Contexto

Após o merge da feature `feat/real-integration` (integração API ↔ Web) e do
`feat/mobile-base` (Google Auth + walk-in + mobile completo), o job de deploy
do `ci-full` passou a falhar sistematicamente. Este documento registra cada
problema encontrado, a causa raiz e a correção aplicada.

---

## Problemas resolvidos

### 1. Loop de health-check saía com `set -e` no primeiro wget

**Sintoma:** Deploy falha com `Process exited with status 4` logo após
"Aguardando API inicializar". Nenhum log da API era capturado.

**Causa:** O script usava `wget -qO- URL && echo && break` com `set -e` ativo.
O `wget` retorna exit code 4 (network failure) enquanto a API ainda está
inicializando. Com `set -e`, qualquer comando não-zero fora de contexto
condicional encerra o script — o `&&` chain não é condicional.

**Correção** (`ci-full.yml`):

```bash
# Antes — saía no primeiro wget com falha
for i in $(seq 1 12); do
  sleep 15
  wget -qO- http://127.0.0.1:4000/health/ready && echo "✓ API healthy" && break
  ...
done

# Depois — if é contexto condicional, set -e não dispara em falha
API_HEALTHY=0
for i in $(seq 1 12); do
  sleep 15
  echo "Tentativa $i/12..."
  docker compose -f docker-compose.prod.yml ps api
  if wget -qO- http://127.0.0.1:4000/health/ready; then
    echo "✓ API healthy"
    API_HEALTHY=1
    break
  fi
done
if [ "$API_HEALTHY" -eq 0 ]; then
  echo "✗ API não respondeu após 180s — logs abaixo:"
  docker compose -f docker-compose.prod.yml logs api --tail=200
  exit 1
fi
```

**PRs:** #42, #43

---

### 2. API em crash loop — seed usa `barbeiroId_inicio` removido do Prisma client

**Sintoma:** Container `toqe-prod-api-1` em `Restarting (1)` continuamente.
Logs mostram:

```
Unknown argument `barbeiroId_inicio`. Available options are marked with ?.
```

**Causa:** A migration `20260516000000_walkin_partial_unique` removeu
`@@unique([barbeiroId, inicio])` do schema Prisma (substituindo por índice
parcial SQL que exclui `WALK_IN`). O Prisma client deixou de gerar o compound
key name `barbeiroId_inicio`. O seed (`seed-runner.js`) ainda usava:

```js
prisma.agendamento.upsert({
  where: { barbeiroId_inicio: { barbeiroId: 1, inicio: ... } },
  ...
})
```

**Correção** (`apps/api/prisma/seed-runner.js`):

```js
// Antes
const agendamento = await prisma.agendamento.upsert({
  where: { barbeiroId_inicio: { barbeiroId: ..., inicio: ... } },
  update: { status: a.status },
  create: { ... },
});

// Depois — findFirst + update/create condicional por codigo
let agendamento = await prisma.agendamento.findFirst({
  where: { barbeiroId: ..., inicio: ... },
});
if (agendamento) {
  agendamento = await prisma.agendamento.update({
    where: { codigo: agendamento.codigo },
    data: { status: a.status },
  });
} else {
  agendamento = await prisma.agendamento.create({ data: { ... } });
}
```

**Motivo do `upsert` não ser possível:** o índice parcial SQL
(`WHERE tipo <> 'WALK_IN'`) não é reconhecido pelo Prisma como unique constraint
— logo não gera o helper de compound key necessário para `upsert`.

**PR:** #44

---

### 3. Seed não era validado antes do deploy

**Problema de processo:** a falha do seed só era detectada na VPS, após o
docker build e o push da imagem. Não havia nenhum gate de CI que executasse o
seed antes do deploy.

**Correção** (`ci-full.yml` — job `integration-security`):

- Adicionado serviço `postgres:16-alpine` ao job (o `DATABASE_URL` já
  existia mas apontava para um postgres que não estava rodando — os integration
  tests usam Testcontainers com banco próprio)
- Novo step `Validate seed` após os testes de segurança:

```yaml
- name: Validate seed
  run: |
    pnpm --filter api exec prisma migrate deploy
    pnpm --filter api exec prisma db seed
  env:
    DATABASE_URL: postgresql://ci:ci@localhost:5432/ci
```

**Fluxo resultante:**

| Check                                   | ci-fast (PR) | ci-full (pós-merge) |
| --------------------------------------- | :----------: | :-----------------: |
| Lint + types + unit tests + build       |      ✅      |          —          |
| Integration + security (Testcontainers) |      —       |         ✅          |
| Seed validate                           |      —       |         ✅          |
| Docker build + deploy                   |      —       |         ✅          |

**PR:** #45

---

### 4. Cache Docker `mode=max` lotando os 10 GB gratuitos

**Sintoma:** Cache GitHub Actions atingiu 11 GB (limite 10 GB).

**Causa:** `cache-to: type=gha,mode=max` salva todas as camadas intermediárias
do Docker build (~4 GB por run × 2 apps).

**Correção** (`ci-full.yml`):

```yaml
# Antes
cache-to: type=gha,mode=max,scope=${{ matrix.app }}

# Depois
cache-to: type=gha,mode=min,scope=${{ matrix.app }}
```

`mode=min` salva apenas as camadas da imagem final (~500 MB–1 GB), sem perda
significativa de velocidade (camadas base do Node/Next continuam cacheadas).

**PR:** #43

---

## Checklist de desenvolvimento — mudanças de schema

Toda mudança de `schema.prisma` deve tocar os seguintes arquivos **no mesmo commit**:

1. `schema.prisma` — a mudança
2. Migration SQL (`prisma migrate dev --name descricao`)
3. `seed-runner.js` / qualquer código que usa tipos afetados
4. Specs relevantes

O `ci-full` agora valida o seed automaticamente, mas a sincronia manual
continua sendo a primeira linha de defesa.

---

## Arquivos modificados

| Arquivo                          | Tipo       | Descrição                                                    |
| -------------------------------- | ---------- | ------------------------------------------------------------ |
| `.github/workflows/ci-full.yml`  | modificado | Loop health-check, mode=min, postgres service, validate seed |
| `apps/api/prisma/seed-runner.js` | modificado | Substituir upsert por findFirst+create/update                |
