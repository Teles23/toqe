---
name: toqe-security
description: Use quando tocar autenticação, autorização, multi-tenancy, Prisma raw SQL, webhooks, API keys, pagamentos, dados pessoais, tokens, cookies, SecureStore, CORS ou variáveis sensíveis no Toqe.
---

# Toqe Security

## Leituras

- `AGENTS.md`
- `docs/82-auditoria-seguranca.md`
- `docs/83-auditoria-seguranca-rounds-2-3.md`
- Código real do endpoint/guard/service tocado.

## Checklist

- AuthN: token JWT, refresh token, tokenVersion e logout preservados.
- AuthZ: guards e roles explícitos; super admin sem bypass indevido.
- Tenant: toda query/mutação escopada por `barCodigo`.
- Ownership: perfil `cliente` só acessa o próprio recurso.
- Webhooks: fail-closed se secret ausente; validação de assinatura/token.
- API keys: hash/HMAC, nunca armazenar segredo puro em resposta.
- Raw SQL: tagged template, sem unsafe/interpolação.
- PII: não vazar em logs, Redis jobs, push payloads ou endpoints públicos.
- Web: cookies httpOnly, `sameSite`, BFF e `INTERNAL_API_URL` obrigatório em produção.
- Mobile: tokens em SecureStore, nada sensível em `EXPO_PUBLIC_*`.

## Validação

```bash
pnpm audit --prod --audit-level=high
pnpm --filter api test:security
pnpm --filter api test:integration
```

Use integration/security real para auth, tenant, payment, slots, fidelidade e webhooks.
