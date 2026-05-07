# Relatório de Implementação — Fases 1 & 2

Este documento registra o que foi desenvolvido nas Fases 1 (Fundação) e 2 (Autenticação e Usuários), conforme os requisitos técnicos do Toqe.

## ✅ Fase 1: Fundação (Concluída)

### Banco de Dados (Prisma 7)
- **Schema**: Modelagem completa em `apps/api/prisma/schema.prisma`.
- **Nomenclatura**: Todas as tabelas seguem o prefixo `TQE_` e campos em caixa alta com siglas de 3 letras (ex: `TQE_USR_NOME`).
- **Tipos**: Uso de `Decimal` para preços e `Timestamptz` para datas em UTC.
- **Configuração**: Implementado `prisma.config.ts` para conformidade com a versão 7 do Prisma.
- **Infra**: Docker Compose com PostgreSQL 16 e Redis configurados. Porta 5432 exposta para o host em desenvolvimento.

### Isolamento por Tenant (RLS no NestJS)
- **`TenantContextService`**: Wrapper transacional que executa `set_config('app.current_tenant', ...)` antes das queries.
- **`TenantInterceptor`**: Interceptor que captura o contexto do tenant na requisição e o injeta no objeto `Request`.

## ✅ Fase 2: Autenticação e Usuários (Concluída)

### Autenticação Global
- **Estratégia**: Usuários são globais (tabela única sem `bar_codigo`).
- **Segurança**: Senhas protegidas com `bcrypt`.
- **JWT**: Implementado `AuthService` com geração de `access_token` (expiração de 15min).
- **Validação**: Ativado `ValidationPipe` global no NestJS para garantir integridade via DTOs.

### Gestão de Tenants (Pós-login)
- **Vínculos**: Implementada tabela `TQE_MEMBRO_BARBEARIA` para associar usuários globais a barbearias específicas.
- **Criação de Barbearia**: Endpoint `POST /barbearias` que cria o tenant e vincula o criador como `dono` em uma única transação.

---

## 🔍 Lacunas Identificadas para Validação

Para que as Fases 1 e 2 estejam 100% de acordo com a documentação original, identificamos os seguintes pontos pendentes que serão abordados no Plano de Validação:

1. **Postgres RLS Policies**: O wrapper no NestJS está pronto, mas as `POLICIES` físicas ainda não foram criadas no PostgreSQL via SQL/Migration.
2. **Refresh Token Logic**: A tabela existe, mas a lógica de rotação e expiração prolongada (30 dias) no `AuthService` ainda não foi implementada (apenas Access Token está funcional).
3. **Roles PostgreSQL**: Configurar os usuários `toqe_app` e `toqe_admin` no banco para que o RLS seja aplicado corretamente.
