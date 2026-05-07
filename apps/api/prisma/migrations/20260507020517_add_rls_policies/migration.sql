-- Enable RLS for all tenant-related tables
ALTER TABLE "TQE_BARBEARIA" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TQE_MEMBRO_BARBEARIA" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TQE_SERVICO" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TQE_BARBEIRO_SERVICO" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TQE_AGENDAMENTO" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TQE_AGENDAMENTO_ITEM" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TQE_BLOQUEIO_AGENDA" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TQE_JORNADA_TRABALHO" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TQE_NOTIFICACAO_PREFERENCIA" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TQE_TEMA_TENANT" ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY tenant_isolation_policy ON "TQE_BARBEARIA" USING ("TQE_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer);
CREATE POLICY tenant_isolation_policy ON "TQE_MEMBRO_BARBEARIA" USING ("TQE_MBR_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer);
CREATE POLICY tenant_isolation_policy ON "TQE_SERVICO" USING ("TQE_SRV_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer);
CREATE POLICY tenant_isolation_policy ON "TQE_BARBEIRO_SERVICO" USING ("TQE_BSV_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer);
CREATE POLICY tenant_isolation_policy ON "TQE_AGENDAMENTO" USING ("TQE_AGD_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer);
CREATE POLICY tenant_isolation_policy ON "TQE_AGENDAMENTO_ITEM" USING ("TQE_AGI_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer);
CREATE POLICY tenant_isolation_policy ON "TQE_BLOQUEIO_AGENDA" USING ("TQE_BLA_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer);
CREATE POLICY tenant_isolation_policy ON "TQE_JORNADA_TRABALHO" USING ("TQE_JOR_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer);
CREATE POLICY tenant_isolation_policy ON "TQE_NOTIFICACAO_PREFERENCIA" USING ("TQE_NPR_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer);
CREATE POLICY tenant_isolation_policy ON "TQE_TEMA_TENANT" USING ("TQE_TEM_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer);