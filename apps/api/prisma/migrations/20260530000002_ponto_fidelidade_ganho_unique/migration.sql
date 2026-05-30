-- Item B: Prevent duplicate loyalty points for the same appointment
-- Partial unique index: only enforces uniqueness for ganho entries that have
-- an agendamentoCodigo. Resgate entries (agendamentoCodigo IS NULL) are
-- unaffected and multiple resgates per client are still allowed.
-- This is a belt-and-suspenders guard; the service still does a findFirst
-- check for a user-friendly early return before reaching the DB.

CREATE UNIQUE INDEX "TQE_PONTO_FIDELIDADE_ganho_agd_key"
  ON "TQE_PONTO_FIDELIDADE" ("TQE_PF_AGD_CODIGO")
  WHERE "TQE_PF_AGD_CODIGO" IS NOT NULL AND "TQE_PF_TIPO" = 'ganho';
