# 33 — Tela Perfil completa (Mobile, Barbeiro)

**Status:** ✅ Implementado
**Branch:** `mobile/feat/barbeiro-perfil` → `mobile/base`

---

## Visão geral

Tela de perfil completa com 6 sub-rotas via Stack interno do Expo Router:

- **index** — visão geral (avatar + nome + email + menus por seção + sair)
- **editar** — atualiza nome + telefone (`PUT /usuarios/me`)
- **senha** — altera senha (`POST /auth/change-password`)
- **2fa** — setup/disable 2FA com QR code (POST /auth/2fa/{setup,enable,disable})
- **sessoes** — lista sessões ativas + revogar individual/todas
- **notificacoes** — toggles email/push/whatsapp/sms (com atualização otimista)

---

## Estrutura

```
app/(barbeiro)/perfil/
├── _layout.tsx          # Stack interno
├── index.tsx            # Lista de seções (CONTA, SEGURANÇA, BARBEARIA)
├── editar.tsx
├── senha.tsx
├── 2fa.tsx
├── sessoes.tsx
└── notificacoes.tsx

src/features/perfil/
├── PerfilHeader.tsx     # Avatar grande + nome + email
├── SecaoCard.tsx        # Grupo de ListItems com título uppercase
└── QrCodeView.tsx       # QR (Image data URL) + secret selecionável

src/shared/hooks/perfil/
├── use-editar-perfil.ts            (PUT /usuarios/me)
├── use-mudar-senha.ts              (POST /auth/change-password)
├── use-sessoes.ts                  (GET /auth/sessions)
├── use-revogar-sessao.ts           (DELETE /auth/sessions/:id e /auth/sessions)
├── use-2fa.ts                      (setup, enable, disable)
└── use-notificacao-preferencias.ts (GET + PUT com optimistic update)
```

---

## Decisões importantes

| Decisão                                                | Justificativa                                                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Stack interno (sub-rotas)** vs múltiplos modais      | Navegação back nativa do Android funciona. Cada subtela tem URL distinta (deeplink futuro). Transições suaves |
| **2FA: confirmação destrutiva via Alert nativo**       | Backend exige código TOTP atual para desativar — duplo gate (código + alert)                                  |
| **Mudança de senha → backend revoga refresh tokens**   | Comportamento já implementado em develop. Toast no mobile explica ao user que outras sessões foram encerradas |
| **Notificações: optimistic update**                    | UX instantâneo (toggle muda no ato). Em erro, mutation reverte cache para estado anterior                     |
| **Avatar: só exibe** (sem upload)                      | Backend não tem endpoint de upload de avatar para usuário. Fica para fase futura                              |
| **switchBarbearia inline na seção BARBEARIA**          | Só renderiza se >1 barbearia. UX rápida sem precisar sub-tela                                                 |
| **`<ListItem trailing="radio">`** para barbearia ativa | Indicação visual clara do estado atual                                                                        |

---

## Hooks — endpoints

| Hook                                  | Endpoint                            | Header tenant |
| ------------------------------------- | ----------------------------------- | ------------- |
| `useEditarPerfil`                     | `PUT /usuarios/me`                  | Não           |
| `useMudarSenha`                       | `POST /auth/change-password`        | Não           |
| `useSessoes`                          | `GET /auth/sessions`                | Não           |
| `useRevogarSessao(codigo)`            | `DELETE /auth/sessions/:codigo`     | Não           |
| `useRevogarTodasSessoes`              | `DELETE /auth/sessions`             | Não           |
| `use2faSetup`                         | `POST /auth/2fa/setup` (sem body)   | Não           |
| `use2faEnable(code)`                  | `POST /auth/2fa/enable` `{ code }`  | Não           |
| `use2faDisable(code)`                 | `POST /auth/2fa/disable` `{ code }` | Não           |
| `useNotificacaoPreferencias`          | `GET /notificacoes/preferencias`    | **Sim**       |
| `useAtualizarPreferenciasNotificacao` | `PUT /notificacoes/preferencias`    | **Sim**       |

---

## Acessibilidade

- Todas as `<ListItem>` com `accessibilityRole="button"` e label/hint claros
- `<Switch>` nativo para toggles de notificação (acessibility role="switch")
- Sessões: cada ação "Encerrar" com `accessibilityLabel` específico
- Alert nativo do RN para confirmações destrutivas (já inclui anúncio para screen readers)

---

## Testes

```bash
pnpm --filter mobile test
```

| Spec                                    | Cobertura                                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------------------------- |
| `use-editar-perfil.test.tsx`            | PUT payload, invalidação de cache                                                            |
| `use-mudar-senha.test.tsx`              | POST payload, propagação de 401                                                              |
| `use-sessoes.test.tsx`                  | GET dispara automático                                                                       |
| `use-revogar-sessao.test.tsx`           | DELETE por código; DELETE all (sem id); invalidação                                          |
| `use-2fa.test.tsx`                      | setup/enable/disable, 3 mutations isoladas                                                   |
| `use-notificacao-preferencias.test.tsx` | GET prefs, gate em barbearia, optimistic update, rollback em erro                            |
| `PerfilHeader.test.tsx`                 | nome+email, fallback `—`, sem email                                                          |
| `SecaoCard.test.tsx`                    | children, título condicional                                                                 |
| `QrCodeView.test.tsx`                   | renderiza QR (data URL), secret selecionável, instrução                                      |
| `perfil/index.test.tsx`                 | 3 seções, seção Barbearia condicional (>1), switchBarbearia, navegação, sair com confirmação |

### Maestro

`.maestro/flows/barbeiro-perfil.yaml`:

1. Navega para Perfil → CONTA visível
2. Editar/Senha/Notificações/2FA/Sessões: cada um abre → voltar
3. Sair da conta + cancelar

---

## Segurança / Performance / Escalabilidade

### Segurança

- Mudança de senha revoga refresh tokens existentes (já no backend) — força logout em outros devices
- 2FA disable requer código TOTP válido (gate duplo: usuário + app autenticador)
- Confirmação Alert antes de revogar sessão ou desativar 2FA
- Logout via `useAuth().logout()` (já testado: limpa SecureStore + redireciona)

### Performance

- `useSessoes` staleTime 30s — reflete login em outros devices rapidamente
- `useNotificacaoPreferencias` staleTime 60s; optimistic update = UI instantânea
- Sub-rotas via Stack interno = navegação sem re-render dos componentes pais (tabs/agenda persistem)
- QR code é data URL — sem download adicional, sem lib externa

### Escalabilidade

- Adicionar nova seção (ex: "Privacidade") = criar arquivo em `perfil/` + linha em `index.tsx`
- Adicionar nova preferência de notificação (ex: in-app) = 1 linha em `LABEL` + extender schema no backend
- `ListItem trailing` é extensível — novo tipo de trailing adiciona case no `TrailingRenderer`
