-- Adiciona OR current_setting('app.bypass_rls', true) = 'true' a todas as
-- políticas de tabelas com FORCE ROW LEVEL SECURITY da migration 20260528.
-- Sem isso, runAdmin() falha em queries que fazem include dessas tabelas
-- (ex: barbearia.findMany({ include: { membros } }) dentro de runAdmin()).

DROP POLICY IF EXISTS tenant_isolation_policy ON "TQE_MEMBRO_BARBEARIA";
CREATE POLICY tenant_isolation_policy ON "TQE_MEMBRO_BARBEARIA" USING (
  current_setting('app.bypass_rls', true) = 'true'
  OR "TQE_MBR_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer
);

DROP POLICY IF EXISTS tenant_isolation_policy ON "TQE_SERVICO";
CREATE POLICY tenant_isolation_policy ON "TQE_SERVICO" USING (
  current_setting('app.bypass_rls', true) = 'true'
  OR "TQE_SRV_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer
);

DROP POLICY IF EXISTS tenant_isolation_policy ON "TQE_BARBEIRO_SERVICO";
CREATE POLICY tenant_isolation_policy ON "TQE_BARBEIRO_SERVICO" USING (
  current_setting('app.bypass_rls', true) = 'true'
  OR "TQE_BSV_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer
);

DROP POLICY IF EXISTS tenant_isolation_policy ON "TQE_AGENDAMENTO_ITEM";
CREATE POLICY tenant_isolation_policy ON "TQE_AGENDAMENTO_ITEM" USING (
  current_setting('app.bypass_rls', true) = 'true'
  OR "TQE_AGI_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer
);

DROP POLICY IF EXISTS tenant_isolation_policy ON "TQE_BLOQUEIO_AGENDA";
CREATE POLICY tenant_isolation_policy ON "TQE_BLOQUEIO_AGENDA" USING (
  current_setting('app.bypass_rls', true) = 'true'
  OR "TQE_BLA_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer
);

DROP POLICY IF EXISTS tenant_isolation_policy ON "TQE_JORNADA_TRABALHO";
CREATE POLICY tenant_isolation_policy ON "TQE_JORNADA_TRABALHO" USING (
  current_setting('app.bypass_rls', true) = 'true'
  OR "TQE_JOR_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer
);

DROP POLICY IF EXISTS tenant_isolation_policy ON "TQE_NOTIFICACAO_PREFERENCIA";
CREATE POLICY tenant_isolation_policy ON "TQE_NOTIFICACAO_PREFERENCIA" USING (
  current_setting('app.bypass_rls', true) = 'true'
  OR "TQE_NPR_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer
);

DROP POLICY IF EXISTS tenant_isolation_policy ON "TQE_TEMA_TENANT";
CREATE POLICY tenant_isolation_policy ON "TQE_TEMA_TENANT" USING (
  current_setting('app.bypass_rls', true) = 'true'
  OR "TQE_TEM_BAR_CODIGO" = NULLIF(current_setting('app.current_tenant', true), '')::integer
);
