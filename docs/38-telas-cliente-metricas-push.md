# Telas Cliente + Métricas de Serviços + Push Notifications

**Status:** Ativo | **Branch:** claude/field-limits-masks-XDba5 | **Base:** develop

## Resumo

Três entregas simultâneas que expandem funcionalidades do app mobile e web:

1. **Telas do cliente desbloqueadas** — 4 novos endpoints de API permitem que clientes vejam seus agendamentos e descubram barbearias
2. **Métricas reais de serviços** — stat cards da `ServicosView` usam dados reais do mês
3. **Push Notifications** — registro de token Expo + envio via `expo-server-sdk`

---

## 1. Telas cliente desbloqueadas (PROMPT 1)

### Arquivos criados/modificados

| Arquivo                                                           | Tipo                                        |
| ----------------------------------------------------------------- | ------------------------------------------- |
| `apps/api/src/agendamento/agendamento.service.ts`                 | Modificado — 3 novos métodos                |
| `apps/api/src/agendamento/agendamento.controller.ts`              | Modificado — 3 novas rotas                  |
| `apps/api/src/barbearia/barbearia.service.ts`                     | Modificado — método `findPublico`           |
| `apps/api/src/barbearia/barbearia.controller.ts`                  | Modificado — rota `GET /barbearias/publico` |
| `apps/mobile/src/shared/hooks/cliente/use-agendamentos-meus.ts`   | Criado                                      |
| `apps/mobile/src/shared/hooks/cliente/use-proximo-agendamento.ts` | Criado                                      |
| `apps/mobile/src/shared/hooks/barbeiro/use-agendamento-atual.ts`  | Criado                                      |
| `apps/mobile/src/shared/hooks/use-barbearias-publico.ts`          | Criado                                      |
| `apps/mobile/app/(cliente)/agendamentos/index.tsx`                | Reescrito                                   |
| `apps/mobile/app/(cliente)/home.tsx`                              | Atualizado                                  |
| `apps/mobile/app/(barbeiro)/agenda.tsx`                           | Atualizado                                  |
| `apps/mobile/app/(cliente)/buscar.tsx`                            | Reescrito                                   |

### Novos endpoints

```
GET /agendamentos/meus          — role: todos (incluindo cliente)
                                   Retorna agendamentos do cliente logado na barbearia

GET /agendamentos/proximo       — role: todos (incluindo cliente)
                                   Retorna próximo agendamento futuro do cliente logado

GET /agendamentos/atual         — role: dono, gerente, barbeiro, recepcionista
                                   Retorna agendamento em atendimento agora pelo barbeiro logado

GET /barbearias/publico?q=nome  — sem autenticação
                                   Lista pública de barbearias ativas (busca por nome)
```

### Fluxo das telas

```
/(cliente)/home         ← hero card "Próximo agendamento" via GET /agendamentos/proximo
                          atalhos com navegação real (não mais "Em breve")

/(cliente)/agendamentos ← lista real via GET /agendamentos/meus
                          com navegação para detalhe ao tocar

/(cliente)/buscar       ← busca real via GET /barbearias/publico
                          FlatList com SearchInput, throttle >= 2 chars

/(barbeiro)/agenda      ← card "Em atendimento agora" via GET /agendamentos/atual
                          aparece quando há agendamento em andamento
```

---

## 2. Métricas de Serviços (PROMPT 2)

### Arquivos criados/modificados

| Arquivo                                                         | Tipo                                       |
| --------------------------------------------------------------- | ------------------------------------------ |
| `apps/api/src/servico/servico.service.ts`                       | Modificado — método `getMetricas`          |
| `apps/api/src/servico/servico.controller.ts`                    | Modificado — rota `GET /servicos/metricas` |
| `apps/web/src/features/servicos/hooks/use-servicos-metricas.ts` | Criado                                     |
| `apps/web/src/features/servicos/components/ServicosView.tsx`    | Atualizado                                 |

### Endpoint

```
GET /servicos/metricas   — role: dono, gerente, barbeiro, recepcionista
                           Retorna: { totalAtivos, pedidosMes, receitaMes, ticketMedio }
```

### Cálculo

- `totalAtivos`: `COUNT(servicos WHERE ativo=true)`
- `pedidosMes`: agendamentos não cancelados/no-show no mês atual
- `receitaMes`: soma de `AgendamentoItem.preco` nesses agendamentos
- `ticketMedio`: `receitaMes / pedidosMes` (0 se sem pedidos)

---

## 3. Push Notifications (PROMPT 3)

### Arquivos criados/modificados

| Arquivo                                                                  | Tipo                                        |
| ------------------------------------------------------------------------ | ------------------------------------------- |
| `apps/api/prisma/schema.prisma`                                          | Modificado — modelo `PushToken`             |
| `apps/api/prisma/migrations/20260518000001_add_push_token/migration.sql` | Criado                                      |
| `apps/api/src/push-token/push-token.service.ts`                          | Criado                                      |
| `apps/api/src/push-token/push-token.controller.ts`                       | Criado                                      |
| `apps/api/src/push-token/push-token.module.ts`                           | Criado                                      |
| `apps/api/src/app.module.ts`                                             | Modificado — importa `PushTokenModule`      |
| `apps/mobile/package.json`                                               | Modificado — adiciona `expo-notifications`  |
| `apps/mobile/src/shared/hooks/use-push-notifications.ts`                 | Criado                                      |
| `apps/mobile/app/_layout.tsx`                                            | Modificado — chama `usePushNotifications()` |

### Modelo Prisma

```prisma
model PushToken {
  codigo     Int      @id @default(autoincrement())
  usrCodigo  Int
  token      String   @db.VarChar(255)
  plataforma String   @default("unknown") @db.VarChar(10)  // ios | android | unknown
  criadoEm  DateTime @default(now())

  @@unique([usrCodigo, token])
}
```

### Endpoints

```
POST /push-tokens   — requer JWT (sem tenant)
                      Body: { token: string, plataforma: 'ios' | 'android' | 'unknown' }
                      Registra ou atualiza token do dispositivo do usuário logado

DELETE /push-tokens — requer JWT
                      Body: { token: string }
                      Remove token
```

### Fluxo mobile

```
app/_layout.tsx → RootNavigator → usePushNotifications()
                                    ↓
                  requestPermissionsAsync()
                                    ↓
                  getExpoPushTokenAsync({ projectId })
                                    ↓
                  POST /push-tokens { token, plataforma }
```

Falhas no registro de token são silenciadas — não travam a app.

---

## Comandos para testar

```bash
# API
pnpm --filter api test
pnpm --filter api lint

# Web
pnpm --filter web test
pnpm --filter web lint

# Mobile
pnpm --filter mobile test
pnpm --filter mobile lint

# Tipo
cd apps/api && npx tsc --noEmit
cd apps/web && npx tsc --noEmit
cd apps/mobile && npx tsc --noEmit
```
