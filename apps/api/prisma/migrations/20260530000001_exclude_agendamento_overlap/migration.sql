-- Item A: Double-booking race condition fix
-- Adds a Postgres EXCLUSION CONSTRAINT backed by btree_gist so that no two
-- non-walk-in, non-cancelled appointments can overlap for the same barber.
-- The application-level $queryRaw check remains as a fast-path (UX message
-- before DB round-trip); this constraint is the authoritative atomic guard.

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
