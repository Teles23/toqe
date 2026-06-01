-- Item A: Double-booking race condition fix
-- Adds a Postgres EXCLUSION CONSTRAINT backed by btree_gist so that no two
-- non-walk-in, non-cancelled appointments can overlap for the same barber.
-- The application-level $queryRaw check remains as a fast-path (UX message
-- before DB round-trip); this constraint is the authoritative atomic guard.

-- Pré-condição: cancela agendamentos sobrepostos existentes antes de criar a constraint.
-- Para cada par sobreposto dentro da mesma barbearia:
--   - Se um deles está 'concluido', cancela o outro (preserva histórico real de atendimento).
--   - Caso contrário, cancela o mais recente por TQE_AGD_INICIO.
-- A guarda final no WHERE impede que um 'concluido' seja cancelado mesmo se eleito pelo CASE.
-- É seguro em banco limpo (UPDATE afeta 0 linhas).
WITH conflitos AS (
  SELECT DISTINCT
    CASE
      WHEN a1."TQE_AGD_STATUS" = 'concluido' THEN a2."TQE_AGD_CODIGO"
      WHEN a2."TQE_AGD_STATUS" = 'concluido' THEN a1."TQE_AGD_CODIGO"
      WHEN a1."TQE_AGD_INICIO" <= a2."TQE_AGD_INICIO" THEN a2."TQE_AGD_CODIGO"
      ELSE a1."TQE_AGD_CODIGO"
    END AS cancelar_codigo
  FROM "TQE_AGENDAMENTO" a1
  JOIN "TQE_AGENDAMENTO" a2
    ON  a1."TQE_AGD_BARBEIRO_ID"  = a2."TQE_AGD_BARBEIRO_ID"
    AND a1."TQE_AGD_BAR_CODIGO"   = a2."TQE_AGD_BAR_CODIGO"
    AND a1."TQE_AGD_CODIGO" < a2."TQE_AGD_CODIGO"
    AND tstzrange(a1."TQE_AGD_INICIO", a1."TQE_AGD_FIM")
     && tstzrange(a2."TQE_AGD_INICIO", a2."TQE_AGD_FIM")
    AND a1."TQE_AGD_STATUS" NOT IN ('cancelado', 'no_show')
    AND a2."TQE_AGD_STATUS" NOT IN ('cancelado', 'no_show')
    AND a1."TQE_AGD_TIPO" != 'WALK_IN'
    AND a2."TQE_AGD_TIPO" != 'WALK_IN'
)
UPDATE "TQE_AGENDAMENTO"
SET "TQE_AGD_STATUS" = 'cancelado'
WHERE "TQE_AGD_CODIGO" IN (SELECT cancelar_codigo FROM conflitos)
  AND "TQE_AGD_STATUS" != 'concluido';

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "TQE_AGENDAMENTO"
  ADD CONSTRAINT "agendamento_no_overlap"
  EXCLUDE USING GIST (
    "TQE_AGD_BARBEIRO_ID" WITH =,
    tstzrange("TQE_AGD_INICIO", "TQE_AGD_FIM") WITH &&
  ) WHERE (
    "TQE_AGD_STATUS" NOT IN ('cancelado', 'no_show')
    AND "TQE_AGD_TIPO" != 'WALK_IN'
  );
