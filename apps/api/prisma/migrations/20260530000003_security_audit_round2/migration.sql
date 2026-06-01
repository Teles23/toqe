-- Security Audit Round 2 changes

-- Item A4: Prevent a barber from having duplicate jornada entries for the same
-- barbearia + day. Previously only (barbeiroId, diaSemana) was checked in code;
-- this unique constraint enforces it at DB level so the guard holds even under
-- concurrent writes.
CREATE UNIQUE INDEX "TQE_JORNADA_barbeiro_bar_dia_key"
  ON "TQE_JORNADA_TRABALHO" ("TQE_JOR_BARBEIRO_ID", "TQE_JOR_BAR_CODIGO", "TQE_JOR_DIA_SEMANA");

-- Item C3: Add a SHA-256 token hash for O(1) refresh-token lookup.
-- Nullable so existing tokens (which only have the bcrypt hash) are unaffected.
-- Once the column is populated for a token, the unique index enforces no two
-- tokens share the same pre-image.
ALTER TABLE "TQE_REFRESH_TOKEN"
  ADD COLUMN "TQE_RTK_TOKEN_HASH" VARCHAR(64);

CREATE UNIQUE INDEX "TQE_REFRESH_TOKEN_token_hash_key"
  ON "TQE_REFRESH_TOKEN" ("TQE_RTK_TOKEN_HASH")
  WHERE "TQE_RTK_TOKEN_HASH" IS NOT NULL;
