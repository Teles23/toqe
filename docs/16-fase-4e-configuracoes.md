# 16. Fase 4e — Migração da feature `configuracoes`

> **Status:** concluída · **Branch:** `arch/fase-4e-configuracoes` · **Base:** `feature/arquitetura-reorganizacao`
>
> Veja também: [`14-fase-4-replicacao-perf.md`](./14-fase-4-replicacao-perf.md) — registro completo da Fase 4.

## Objetivo

Migrar a página monolítica `app/(dashboard)/configuracoes/page.tsx` (1.015 linhas) para a estrutura feature-based estabelecida nas fases anteriores, separando os 5 painéis de configuração em componentes independentes, adicionando camadas de service e hooks (TanStack Query), e extraindo os shared components `Toggle` e `ConfigRow` para `src/shared/components/`.

---

## Arquivos criados

### `src/features/configuracoes/`

| Arquivo                               | Responsabilidade                                                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `types/configuracao.types.ts`         | `SecaoId`, `HorarioDia`, `NotificacaoConfig`, `BarbeariaConfig`, `Plano`, `SessaoAtiva`                              |
| `constants/configuracao.constants.ts` | `SECOES`, `HORARIOS_DEFAULT`, `NOTIFICACOES_DEFAULT`, `GRUPOS_NOTIFICACAO`                                           |
| `services/configuracao.service.ts`    | Métodos: `getBarbearia`, `updateBarbearia`, `getHorarios`, `updateHorarios`, `getNotificacoes`, `updateNotificacoes` |
| `hooks/use-configuracao.ts`           | `useConfiguracaoBarbearia`, `useConfiguracaoHorarios`, `useConfiguracaoNotificacoes` (query + mutation)              |
| `components/ConfiguracoesView.tsx`    | Orquestrador: sidebar de navegação + `AnimatePresence` entre seções                                                  |
| `components/SecaoBarbearia.tsx`       | Formulário de nome, telefone, e-mail e endereço da barbearia                                                         |
| `components/SecaoHorarios.tsx`        | Grade de horários por dia com toggle de aberto/fechado                                                               |
| `components/SecaoNotificacoes.tsx`    | Toggles por grupo de notificação usando `GRUPOS_NOTIFICACAO`                                                         |
| `components/SecaoPlano.tsx`           | Cards de plano atual (Basic/Pro/Enterprise) + próxima fatura                                                         |
| `components/SecaoSeguranca.tsx`       | Troca de senha, 2FA e sessões ativas                                                                                 |

### `src/shared/components/`

| Arquivo          | Responsabilidade                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `toggle.tsx`     | Botão switch animado (framer-motion) — reutilizado por Horários, Notificações e Segurança |
| `config-row.tsx` | Layout label + children alinhados — reutilizado por Segurança                             |

---

## Arquivos modificados

| Arquivo                                                  | Mudança                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/app/(dashboard)/configuracoes/page.tsx`             | Thin wrapper: extrai `barCodigo` de `useAuth()` e renderiza `<ConfiguracoesView>` |
| `src/features/configuracoes/types/configuracao.types.ts` | Adicionados `BarbeariaConfig`, `Plano`, `SessaoAtiva`                             |
| `docs/14-fase-4-replicacao-perf.md`                      | Status da 4d e 4e atualizados para mergeado                                       |

---

## Decisões

- **TanStack Query com `placeholderData`**: `useConfiguracaoHorarios` e `useConfiguracaoNotificacoes` usam `placeholderData` com os defaults dos constants, evitando tela em branco enquanto a API não responde (ou ainda não existe o endpoint).
- **Seções Plano e Segurança sem hook**: `SecaoPlano` usa dados hardcoded (planos são configurados no backend do SaaS, não via API de tenant). `SecaoSeguranca` é UI-only por ora — troca de senha e sessões exigem endpoints de auth ainda não expostos.
- **Mutations imediatas em Notificações**: cada toggle dispara `update.mutate` imediatamente (otimistic-like), sem botão "Salvar", porque cada configuração é independente.
- **`/* eslint-disable no-restricted-syntax */`**: necessário nos componentes que usam `style={{ ... }}` com CSS variables do design system — mesmo padrão dos shared components existentes.

---

## Checklist de aceite

- [x] TypeScript sem erros (`tsc --noEmit`)
- [x] ESLint sem warnings nos arquivos da feature
- [x] Rota `/configuracoes` renderiza as 5 seções sem erros
- [x] `page.tsx` é thin wrapper (< 10 linhas)
- [x] `Toggle` e `ConfigRow` movidos para `shared/components/` e importados de lá
- [x] Shared components com `/* eslint-disable no-restricted-syntax */` para CSS vars
- [x] Hooks com `staleTime: 60_000` (dados mudam pouco)
- [x] Documentação criada (`docs/16-fase-4e-configuracoes.md`)
- [x] `docs/14-fase-4-replicacao-perf.md` atualizado com status final da Fase 4
