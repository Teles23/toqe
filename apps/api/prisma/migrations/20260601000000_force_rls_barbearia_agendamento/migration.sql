-- FORCE ROW LEVEL SECURITY em TQE_BARBEARIA e TQE_AGENDAMENTO.
--
-- Pré-requisito: lembrete.service foi refatorado para usar TenantStore.runAdmin()
-- nas leituras cross-tenant (cron) e TenantStore.run(barCodigo) nas escritas.
-- notificacao.consumer também usa TenantStore.run(barCodigo) para buscar agendamentos.
--
-- As políticas incluem um bypass via app.bypass_rls para processos cross-tenant
-- que não têm um barCodigo único no contexto (cron de cobranças, lembretes, etc.).
-- O PrismaService injeta set_config('app.bypass_rls','true',true) quando o contexto
-- ALS tem isAdmin=true (TenantStore.runAdmin).

-- Barbearia: drop + recreate policy com bypass, depois FORCE RLS
DROP POLICY IF EXISTS tenant_isolation_policy ON "TQE_BARBEARIA";
CREATE POLICY tenant_isolation_policy ON "TQE_BARBEARIA" USING (
  current_setting('app.bypass_rls', true) = 'true'
  OR "TQE_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer
);
ALTER TABLE "TQE_BARBEARIA" FORCE ROW LEVEL SECURITY;

-- Agendamento: drop + recreate policy com bypass, depois FORCE RLS
DROP POLICY IF EXISTS tenant_isolation_policy ON "TQE_AGENDAMENTO";
CREATE POLICY tenant_isolation_policy ON "TQE_AGENDAMENTO" USING (
  current_setting('app.bypass_rls', true) = 'true'
  OR "TQE_AGD_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer
);
ALTER TABLE "TQE_AGENDAMENTO" FORCE ROW LEVEL SECURITY;
