-- Item A: Double-booking race condition fix
-- Adds a Postgres EXCLUSION CONSTRAINT backed by btree_gist so that no two
-- non-walk-in, non-cancelled appointments can overlap for the same barber.
-- The application-level $queryRaw check remains as a fast-path (UX message
-- before DB round-trip); this constraint is the authoritative atomic guard.

-- Pré-condição: cancela agendamentos sobrepostos existentes antes de criar a constraint.
-- Mantém o agendamento com início mais antigo; cancela o sobreposto mais recente.
-- É seguro em banco limpo (UPDATE afeta 0 linhas).
WITH conflitos AS (
  SELECT DISTINCT
    CASE
      WHEN a1."TQE_AGD_INICIO" <= a2."TQE_AGD_INICIO" THEN a2."TQE_AGD_ID"
      ELSE a1."TQE_AGD_ID"
    END AS cancelar_id
  FROM "TQE_AGENDAMENTO" a1
  JOIN "TQE_AGENDAMENTO" a2
    ON  a1."TQE_AGD_BARBEIRO_ID" = a2."TQE_AGD_BARBEIRO_ID"
    AND a1."TQE_AGD_ID" < a2."TQE_AGD_ID"
    AND tstzrange(a1."TQE_AGD_INICIO", a1."TQE_AGD_FIM")
     && tstzrange(a2."TQE_AGD_INICIO", a2."TQE_AGD_FIM")
    AND a1."TQE_AGD_STATUS" NOT IN ('cancelado', 'no_show')
    AND a2."TQE_AGD_STATUS" NOT IN ('cancelado', 'no_show')
    AND a1."TQE_AGD_TIPO" != 'WALK_IN'
    AND a2."TQE_AGD_TIPO" != 'WALK_IN'
)
UPDATE "TQE_AGENDAMENTO"
SET "TQE_AGD_STATUS" = 'cancelado'
WHERE "TQE_AGD_ID" IN (SELECT cancelar_id FROM conflitos);

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
