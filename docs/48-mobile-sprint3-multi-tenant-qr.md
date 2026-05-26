# 48 — Sprint 3 · Multi-Tenant + QR + Auth + Fila (pixel-accurate)

**Status:** Implementado  
**Branch:** `feat/mobile-sprint3-perfil-tenant`  
**Base:** `develop`

---

## Contexto

Implementação do fluxo multi-tenant, QR scan, correção das telas de login (estado "link enviado") e fila do barbeiro para ficarem pixel-accurate com o protótipo Urban Flow v2.

---

## Arquivos Criados

| Arquivo                                             | Descrição                                                                                    |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `apps/mobile/src/shared/ui/TenantSwitcherSheet.tsx` | Bottom sheet para trocar barbearia ativa com logo, nome, perfil e checkmark                  |
| `apps/mobile/app/(cliente)/buscar/qr.tsx`           | Tela de scan QR — mock visual com frame amber (4 cantos), botão "Digitar código manualmente" |

---

## Arquivos Modificados

| Arquivo                                            | Modificação                                                                                                     |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/app/index.tsx`                        | `SplashTenantPicker` embutido: redireciona para login, home ou mostra picker de barbearia quando há 2+ vínculos |
| `apps/mobile/app/(cliente)/home.tsx`               | Pill interativo `HeaderComTenant` + `EmptyClienteSemBarbearia` pixel-accurate + `TenantSwitcherSheet`           |
| `apps/mobile/app/(cliente)/agendamentos/index.tsx` | Pill `HeaderComTenant` no header com `TenantSwitcherSheet`                                                      |
| `apps/mobile/app/(auth)/login.tsx`                 | Estado `emailSent` com ícone envelope, pulse dot amber, botão "Reenviar link", link "Usar outra conta"          |
| `apps/mobile/app/(barbeiro)/fila.tsx`              | Seção vermelha `#ef44441a` com dot pulsante, `WalkInCard` + `FilaCard`, pull-to-refresh                         |
| `apps/mobile/src/shared/ui/index.ts`               | Exportação de `TenantSwitcherSheet`                                                                             |

---

## Tests Atualizados

| Arquivo                                                           | Modificação                                                                                  |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `apps/mobile/app/(barbeiro)/__tests__/fila.test.tsx`              | `getByText` → `getAllByText` para nomes duplicados em WalkInCard+FilaCard; testIDs alinhados |
| `apps/mobile/app/(cliente)/__tests__/home.test.tsx`               | Texto do `home-sem-barbearia` atualizado para design v2                                      |
| `apps/mobile/app/(cliente)/agendamentos/__tests__/index.test.tsx` | Mock de `useAuth` adicionado                                                                 |

---

## Lógica de Roteamento Multi-Tenant (`app/index.tsx`)

```
loading → ActivityIndicator
!user → /(auth)/login
barbearias.length === 0 → /(cliente)/home (EmptyClienteSemBarbearia)
barbearias.length === 1 → redirect para rota do perfil
barbearias.length > 1 → SplashTenantPicker
```

---

## Resultados

- `pnpm --filter mobile lint`: 0 errors (1 warning pré-existente em test file)
- `npx tsc --noEmit`: 0 erros novos (1 erro pré-existente em `secure-storage.ts`)
- `pnpm --filter mobile test`: 90 suites · 518 tests · all passed
