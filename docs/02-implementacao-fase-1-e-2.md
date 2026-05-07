# Relatório de Implementação — Fases 1 & 2

Este documento registra o que foi desenvolvido nas Fases 1 (Fundação) e 2 (Autenticação e Usuários), conforme os requisitos técnicos do Toqe.

## ✅ Fase 1: Fundação (Concluída)

### Banco de Dados (Prisma 7)
- **Schema**: Modelagem completa em `apps/api/prisma/schema.prisma`.
- **Nomenclatura**: Todas as tabelas seguem o prefixo `TQE_` e campos em caixa alta com siglas de 3 letras (ex: `TQE_USR_NOME`).
- **Tipos**: Uso de `Decimal` para preços e `Timestamptz` para datas em UTC.
- **Configuração**: Implementado `prisma.config.ts` para conformidade com a versão 7 do Prisma.
- **Infra**: Docker Compose com PostgreSQL 16 e Redis configurados. Porta 5432 exposta para o host em desenvolvimento.

### Isolamento por Tenant (RLS)
- **`TenantContextService`**: Wrapper transacional que executa `set_config('app.current_tenant', ...)` antes das queries.
- **`TenantInterceptor`**: Interceptor que captura o contexto do tenant na requisição e o injeta no objeto `Request`.
- **Políticas Físicas (Postgres)**: Implementadas via migration `add_rls_policies`. Todas as tabelas sensíveis ao tenant agora possuem `ROW LEVEL SECURITY` ativado com políticas de filtragem automática por `app.current_tenant`.

## ✅ Fase 2: Autenticação e Usuários (Concluída)

### Autenticação Global
- **Estratégia**: Usuários são globais (tabela única sem `bar_codigo`).
- **Segurança**: Senhas protegidas com `bcrypt`.
- **JWT**: Implementado `AuthService` com geração de `access_token` (15min).
- **Refresh Token**: Implementada lógica de **rotação de tokens** (Refresh Token de 30 dias) com revogação no banco para maior segurança.
- **Validação**: Ativado `ValidationPipe` global no NestJS para garantir integridade via DTOs.

### Gestão de Tenants (Pós-login)
- **Vínculos**: Implementada tabela `TQE_MEMBRO_BARBEARIA` para associar usuários globais a barbearias específicas.
- **Criação de Barbearia**: Endpoint `POST /barbearias` que cria o tenant e vincula o criador como `dono` em uma única transação.

---

## 🔍 Validação Técnica Realizada

1. **Isolamento**: Verificado que o `set_config` local à transação impede vazamento de dados entre conexões do pool.
2. **Persistência**: Verificado que senhas são salvas como hashes salgados (Bcrypt).
3. **Segurança**: Endpoints de criação de barbearia exigem obrigatoriamente um token JWT válido.
