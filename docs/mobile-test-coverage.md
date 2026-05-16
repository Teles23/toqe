# Mobile — Cobertura de Testes (estado final)

**Status:** ✅ Atualizado
**Branch:** `mobile/test/coverage` → `mobile/base`
**Base:** Jest 29 + jest-expo 54 + React Native Testing Library 13

---

## Visão geral

|                                  | Antes | Depois                                         |
| -------------------------------- | ----- | ---------------------------------------------- |
| Test suites                      | 11    | **17**                                         |
| Testes                           | 48    | **83**                                         |
| Telas testadas (auth + barbeiro) | 0     | **3** (login, cadastro, agenda)                |
| Edge cases de api-client         | ❌    | ✅ JSON malformado, network, dedup             |
| Erros de SecureStore             | ❌    | ✅                                             |
| Integração auth flow             | ❌    | ✅ (bootstrap, login, logout, switchBarbearia) |
| Bug crítico fechado              | —     | ✅ refresh single-flight                       |

---

## Arquivos novos / modificados

| Arquivo                                                 | Cenários                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(auth)/__tests__/login.test.tsx`                   | Render dos campos+botão; submit chama useAuth.login com payload correto; erro 401 → "E-mail ou senha incorretos"; erro 5xx → "Erro no servidor"; outros erros (TypeError de rede) → "Sem conexão"                                                                                                          |
| `app/(auth)/__tests__/cadastro.test.tsx`                | Render dos 5 campos+botão; senha != confirmação → mensagem de erro local (sem chamar API); sucesso → `POST /auth/register` + `login()` automático; telefone vazio enviado como `undefined`; 409 marca erro no campo email; 5xx → erro global de servidor                                                   |
| `app/(barbeiro)/__tests__/agenda.test.tsx`              | Loading state; empty state (texto muda entre "hoje" e "este dia"); error state; renderização de cards na FlatList; navegação Próximo/Anterior altera a data passada ao hook; "Ir para hoje" volta data atual; label central formatado em pt-BR                                                             |
| `src/shared/api/__tests__/api-client.edge.test.ts`      | HTTP error com body não-JSON ainda vira `ApiError` com status; resposta 200 com JSON malformado propaga SyntaxError; fetch rejeitado propaga TypeError; **2 requests concorrentes com 401 → apenas 1 chamada ao `/auth/refresh`** (single-flight)                                                          |
| `src/shared/lib/__tests__/secure-storage.error.test.ts` | Cada método (get×2, save, clear) propaga erro do SecureStore; chaves canônicas (`toqe_access_token`, `toqe_refresh_token`) verificadas                                                                                                                                                                     |
| `src/shared/__tests__/auth-flow.integration.test.tsx`   | **Integração ponta-a-ponta** do AuthProvider real: bootstrap sem token; bootstrap com token → carrega /usuarios/me; login completo → salva tokens → carrega me → redirect por perfil; logout chama API + limpa tokens; logout robusto a 500 (limpa tokens mesmo assim); switchBarbearia troca perfil ativo |
| `src/shared/api/api-client.ts`                          | **FIX:** adicionado `inflightRefresh` (single-flight) — dedup de POST `/auth/refresh` sob concorrência                                                                                                                                                                                                     |
| `docs/mobile-auth.md`                                   | Documenta single-flight do refresh + nova matriz de cobertura                                                                                                                                                                                                                                              |

---

## Bug encontrado e corrigido

### Sintoma

Sob conexão lenta ou após app voltar do background, duas requests podiam disparar simultaneamente, ambas receber 401, e ambas chamar `POST /auth/refresh`. A segunda chamada usa o `refresh_token` antigo (já invalidado pela primeira), recebe 401 e força logout — mesmo com sessão válida.

### Como foi descoberto

O teste `api-client.edge.test.ts` ("Refresh concorrente — apenas 1 chamada a /auth/refresh") foi escrito **antes** do fix e expôs a falha: o mock de fetch esgotava a fila porque ambas as requests entravam em refresh e tentavam consumir respostas duplicadas.

### Fix (em `api-client.ts`)

```ts
let inflightRefresh: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  if (inflightRefresh) return inflightRefresh;
  inflightRefresh = refreshTokensInternal().finally(() => {
    inflightRefresh = null;
  });
  return inflightRefresh;
}
```

Promise é compartilhada por todas as requests que entram na janela de refresh. Quando uma resolve (ok ou falha), todas continuam a partir do mesmo resultado.

---

## Segurança / Performance / Escalabilidade dos próprios testes

### Segurança

- Nenhum teste hardcoda credenciais reais (apenas strings fictícias tipo `"senha123"`, `"a@b.com"`)
- Mocks isolam SecureStore real do disco em todos os specs
- Testes cobrem cenários de falha (não-feliz paths) onde a maioria dos bugs de auth aparecem

### Performance

- Mocks por `jest.fn()` evitam I/O real
- `beforeEach` reseta apenas mocks usados (não recria providers/components)
- Tempo total do mobile test: ~25s para 83 testes (média 0,3s/teste)

### Escalabilidade

- Padrão `makeAuthValue()` / `makeAgendamento()` em cada spec — factories para reduzir boilerplate de cenários novos
- Mock central de `expo-secure-store` / `expo-router` / `expo-constants` reusa o mesmo formato em todos os specs

---

## Como rodar

```bash
# Todos os testes mobile
pnpm --filter mobile test

# Um arquivo específico
pnpm --filter mobile test -- --testPathPattern="api-client.edge"

# Watch mode (dev)
pnpm --filter mobile test -- --watch
```
