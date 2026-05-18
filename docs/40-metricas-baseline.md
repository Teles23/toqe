# Métricas Baseline

**Data da medição:** 2026-05-18
**Branch:** develop @ `1461c6d`

---

## Cold Start (`pnpm dev:web`)

Requer medição manual em ambiente local (servidor interativo necessário):

```bash
time pnpm dev:web
# Anotar o tempo até a linha "Ready in X.Xs" aparecer no terminal
```

| Medição   | Tempo                   |
| --------- | ----------------------- |
| 1         | N/A — medir manualmente |
| 2         | N/A — medir manualmente |
| 3         | N/A — medir manualmente |
| **Média** | **N/A**                 |

---

## Bundle Size (JavaScript, chunks estáticos)

Medido com `pnpm build` no `apps/web` — chunks em `.next/static/chunks/`:

| Métrica                        | Tamanho               |
| ------------------------------ | --------------------- |
| Total raw (todos os chunks JS) | **2,731 KB** (2.7 MB) |
| Total gzip estimado            | **~820 KB** (0.8 MB)  |

> Nota: Next.js não exibe breakdown por rota no modo estático com App Router sem `ANALYZE=true`.
> Para análise detalhada por rota, instalar `@next/bundle-analyzer` e rodar `ANALYZE=true pnpm build`.

---

## Cobertura Unit — Frontend (Vitest + `@vitest/coverage-v8`)

Medido com `npx vitest run --coverage` em `apps/web` (16 suítes, 123 testes):

| Métrica    | % (baseline)         | Meta    |
| ---------- | -------------------- | ------- |
| Statements | **68.33%** (287/420) | >60% ✅ |
| Branches   | **69.56%** (160/230) | >60% ✅ |
| Functions  | **55.95%** (108/193) | >60% ⚠️ |
| Lines      | **68.81%** (278/404) | >60% ✅ |

---

## Cobertura Unit — Backend (Jest)

A instrumentação de cobertura do Jest (`babel-plugin-istanbul`) não é suportada
neste ambiente de CI remoto (erro de Babel durante a transformação).

Para medir manualmente em ambiente local:

```bash
cd apps/api && npx jest --coverage
```

| Módulo  | % Statements               |
| ------- | -------------------------- |
| (todos) | N/A — executar manualmente |

---

## Metas originais vs baseline real

Definidas em `docs/10-arquitetura-reorganizacao.md`:

| Métrica             | Meta      | Baseline                | Status                    |
| ------------------- | --------- | ----------------------- | ------------------------- |
| Cold start `-30%`   | -30% vs X | N/A — medir manualmente | —                         |
| Bundle gz `-20%`    | -20% vs X | ~820 KB total chunks    | — (sem baseline anterior) |
| Cobertura FE `>60%` | >60%      | 68.33% statements       | ✅                        |
| Cobertura BE `>70%` | >70%      | N/A — medir manualmente | —                         |

> Para estabelecer se as metas de cold start e bundle foram atingidas,
> é necessário registrar o valor **antes** das otimizações e medir depois.
> Este documento registra o ponto de partida atual.
