# 84 — Pendências de Segurança

**Status:** Pendente
**Identificado em:** 2026-06-01
**Contexto:** Gaps identificados durante análise da arquitetura de autenticação (access token / refresh token) em sessão de teste da aplicação web.

---

## Gaps identificados

### 1. Sem rate limit no endpoint de login

**Risco:** 🔴 Alto  
**Arquivo:** `apps/api/src/auth/auth.controller.ts`

Tentativas de login não são limitadas por IP nem por e-mail. Um atacante pode fazer brute force de senhas sem qualquer bloqueio.

**Solução:** Adicionar `@nestjs/throttler` com limite por rota:

```typescript
// auth.module.ts — importar ThrottlerModule
ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }])

// auth.controller.ts — decorar o endpoint de login
@UseGuards(ThrottlerGuard)
@Throttle({ default: { ttl: 60_000, limit: 5 } })
@Post('login')
```

Limitar também `/auth/refresh` para evitar abuso de renovação em loop.

---

### 2. Refresh tokens expirados acumulam no banco

**Risco:** 🟡 Operacional  
**Tabela:** `TQE_REFRESH_TOKEN`

Tokens com `revogado = true` ou `expiraEm < now()` nunca são removidos. Com muitos usuários ou sessões frequentes, a tabela cresce indefinidamente e degrada queries.

**Solução:** Job periódico de limpeza (cron diário):

```typescript
// refresh-token-cleanup.service.ts
@Cron('0 3 * * *') // todo dia às 3h
async cleanupExpiredTokens() {
  await this.prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { revogado: true },
        { expiraEm: { lt: new Date() } },
      ],
    },
  });
}
```

---

### 3. Sem cabeçalhos de segurança HTTP (Helmet)

**Risco:** 🟠 Médio  
**Arquivo:** `apps/api/src/main.ts`

A API não define cabeçalhos como `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`. Isso deixa vetores abertos para clickjacking, MIME sniffing e injeção de conteúdo.

**Solução:**

```typescript
// main.ts
import helmet from 'helmet';
app.use(helmet());
```

Para o frontend Next.js, adicionar em `next.config.ts`:

```typescript
headers: async () => [
  {
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ],
  },
],
```

---

### 4. 2FA não obrigatório para o perfil dono

**Risco:** 🟠 Médio  
**Arquivo:** `apps/api/src/auth/auth.service.ts`

O 2FA existe na plataforma (TOTP implementado) mas é opcional. Um dono de barbearia com conta comprometida dá acesso total a dados de clientes, agendamentos e configurações financeiras.

**Solução:** Após período de aviso, tornar 2FA obrigatório para `perfil = 'dono'`:

```typescript
// No guard ou middleware pós-login:
if (perfil === 'dono' && !user.twoFaEnabled) {
  throw new ForbiddenException('2FA obrigatório para donos. Ative em Configurações > Segurança.');
}
```

Exibir banner de alerta na web enquanto não é obrigatório.

---

### 5. IDs sequenciais expostos nas rotas e respostas da API

**Risco:** 🟠 Médio
**Identificado em:** 2026-06-02
**Arquivos afetados:** todos os controllers — `barbearia.controller.ts`, `usuario.controller.ts`, routes web/mobile

IDs numéricos auto-increment (ex: `codigo: 132`) aparecem nas URLs das requisições e nos corpos de resposta visíveis pelo DevTools. Isso expõe:

1. **Enumeração de recursos** — atacante testa `/barbearias/1`, `/2`, ... `/132` para mapear todos os tenants
2. **Business intelligence** — concorrentes inferem volume de clientes pelo ID
3. **Amplificação de IDOR** — se qualquer guard falhar, IDs previsíveis facilitam acesso a dados alheios

**Solução:** Adicionar campo `publicId String @unique @default(cuid())` nas tabelas expostas externamente e usar esse campo nas rotas:

```prisma
// schema.prisma
model Barbearia {
  codigo   Int    @id @default(autoincrement())
  publicId String @unique @default(cuid()) @map("TQE_BAR_PUBLIC_ID") @db.VarChar(36)
  // ...
}

model Usuario {
  codigo   Int    @id @default(autoincrement())
  publicId String @unique @default(cuid()) @map("TQE_USR_PUBLIC_ID") @db.VarChar(36)
  // ...
}
```

```typescript
// barbearia.controller.ts — rota usa publicId, não codigo
@Get(':publicId')
findOne(@Param('publicId') publicId: string) {
  return this.barbeariaService.findByPublicId(publicId);
}
```

**Escopo do trabalho:**
- Migração Prisma para `Barbearia` e `Usuario` (prioridade)
- Atualizar todos os controllers, services e contratos
- Atualizar web (URLs, hooks, MSW handlers) e mobile (api-client, hooks)
- Manter `codigo` como PK interna — só a interface externa muda

**Nota:** o risco é BAIXO se a autorização estiver correta (TenantGuard + JWT). A exposição do ID numérico amplifica, mas não cria sozinha, uma vulnerabilidade IDOR.

---

## Prioridade de implementação

| # | Gap | Esforço | Impacto |
|---|-----|---------|---------|
| 1 | Rate limit no login | Baixo (1h) | Alto |
| 3 | Helmet HTTP headers | Baixo (30min) | Médio |
| 2 | Cleanup de refresh tokens | Médio (2h) | Operacional |
| 4 | 2FA obrigatório para donos | Alto (requer UX + período de aviso) | Médio |
| 5 | IDs públicos (CUID) nas rotas | Alto (refactor api + web + mobile) | Médio |

---

## Contexto da arquitetura de tokens

Para referência, o design atual de autenticação:

- **Access token:** JWT, 15 min, validado localmente pela API (stateless)
- **Refresh token:** token opaco de 64 hex chars, 30 dias, salvo na tabela `TQE_REFRESH_TOKEN` com hash bcrypt + SHA-256 para lookup O(1)
- **Rotação:** cada refresh revoga o token anterior e emite um novo par — detecta reuso
- **Revogação:** logout revoga o refresh token no banco; access token expira naturalmente em até 15 min
- **Cookies:** ambos httpOnly; refresh token com `path=/api/auth` (não vaza em requests normais)
