-- Walk-ins podem coexistir com agendamentos normais no mesmo horário.
-- Substituímos o unique total por um índice parcial que exclui WALK_IN.

DROP INDEX IF EXISTS "TQE_AGENDAMENTO_TQE_AGD_BARBEIRO_ID_TQE_AGD_INICIO_key";

CREATE UNIQUE INDEX "TQE_AGENDAMENTO_BARBEIRO_INICIO_AGENDADO_key"
  ON "TQE_AGENDAMENTO" ("TQE_AGD_BARBEIRO_ID", "TQE_AGD_INICIO")
  WHERE "TQE_AGD_TIPO" <> 'WALK_IN';
