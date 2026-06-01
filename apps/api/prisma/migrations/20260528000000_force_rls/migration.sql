-- FORCE ROW LEVEL SECURITY nas tabelas que NUNCA precisam de leitura cross-tenant.
--
-- TQE_BARBEARIA e TQE_AGENDAMENTO são excluídas intencionalmente: o lembrete.service
-- (cron) lê essas tabelas atravessando todos os tenants. Elas receberão FORCE RLS
-- num PR dedicado, após o lembrete ser refatorado para iterar por tenant.
--
-- Com FORCE RLS, mesmo o role proprietário da tabela (toqe_app) precisa ter
-- app.current_tenant configurado — o PrismaService injeta set_config via ALS/hook.

ALTER TABLE "TQE_MEMBRO_BARBEARIA" FORCE ROW LEVEL SECURITY;
ALTER TABLE "TQE_SERVICO" FORCE ROW LEVEL SECURITY;
ALTER TABLE "TQE_BARBEIRO_SERVICO" FORCE ROW LEVEL SECURITY;
ALTER TABLE "TQE_AGENDAMENTO_ITEM" FORCE ROW LEVEL SECURITY;
ALTER TABLE "TQE_BLOQUEIO_AGENDA" FORCE ROW LEVEL SECURITY;
ALTER TABLE "TQE_JORNADA_TRABALHO" FORCE ROW LEVEL SECURITY;
ALTER TABLE "TQE_NOTIFICACAO_PREFERENCIA" FORCE ROW LEVEL SECURITY;
ALTER TABLE "TQE_TEMA_TENANT" FORCE ROW LEVEL SECURITY;
