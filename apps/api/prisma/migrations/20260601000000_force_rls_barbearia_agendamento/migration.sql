-- FORCE ROW LEVEL SECURITY em TQE_AGENDAMENTO.
-- TQE_BARBEARIA fica com apenas ENABLE ROW LEVEL SECURITY (owner é isento) —
-- requer auditoria de fluxos cross-tenant (create, lista pública, webhook) antes
-- de aplicar FORCE.
--
-- As políticas incluem um bypass para processos cross-tenant (cron)
-- que setam app.bypass_rls=true via TenantStore.runAdmin().

-- Barbearia: apenas atualiza a política para incluir bypass (sem FORCE RLS)
DROP POLICY IF EXISTS tenant_isolation_policy ON "TQE_BARBEARIA";
CREATE POLICY tenant_isolation_policy ON "TQE_BARBEARIA" USING (
  current_setting('app.bypass_rls', true) = 'true'
  OR "TQE_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer
);

-- Agendamento: atualiza política com bypass e aplica FORCE RLS
DROP POLICY IF EXISTS tenant_isolation_policy ON "TQE_AGENDAMENTO";
CREATE POLICY tenant_isolation_policy ON "TQE_AGENDAMENTO" USING (
  current_setting('app.bypass_rls', true) = 'true'
  OR "TQE_AGD_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer
);
ALTER TABLE "TQE_AGENDAMENTO" FORCE ROW LEVEL SECURITY;
