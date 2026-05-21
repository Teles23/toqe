-- Migration: add_super_admin_and_planos
-- Adiciona campo superAdmin ao Usuario e preco ao PlanoLimite
-- Atualiza plano "pago" → "basic" na Barbearia e PlanoLimite

-- 1. Adicionar superAdmin ao Usuario
ALTER TABLE "TQE_USUARIO" ADD COLUMN "TQE_USR_SUPER_ADMIN" BOOLEAN NOT NULL DEFAULT false;

-- 2. Adicionar preco ao PlanoLimite
ALTER TABLE "TQE_PLANO_LIMITE" ADD COLUMN "TQE_PLI_PRECO" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- 3. Renomear plano "pago" para "basic" em PlanoLimite (se existir)
UPDATE "TQE_PLANO_LIMITE" SET "TQE_PLI_PLANO" = 'basic' WHERE "TQE_PLI_PLANO" = 'pago';

-- 4. Inserir/atualizar preços dos planos
INSERT INTO "TQE_PLANO_LIMITE" ("TQE_PLI_PLANO", "TQE_PLI_PRECO", "TQE_PLI_MAX_BARBEIROS", "TQE_PLI_MAX_AGD_MES", "TQE_PLI_WHITE_LABEL", "TQE_PLI_API_PUBLICA", "TQE_PLI_RELATORIOS_ADV")
VALUES
  ('free',  0.00,   1,   100, false, false, false),
  ('basic', 89.00,  5,  1000, false, false, false),
  ('pro',   189.00, NULL, NULL, true, true, true)
ON CONFLICT ("TQE_PLI_PLANO") DO UPDATE
  SET "TQE_PLI_PRECO" = EXCLUDED."TQE_PLI_PRECO",
      "TQE_PLI_MAX_BARBEIROS" = EXCLUDED."TQE_PLI_MAX_BARBEIROS",
      "TQE_PLI_MAX_AGD_MES" = EXCLUDED."TQE_PLI_MAX_AGD_MES",
      "TQE_PLI_WHITE_LABEL" = EXCLUDED."TQE_PLI_WHITE_LABEL",
      "TQE_PLI_API_PUBLICA" = EXCLUDED."TQE_PLI_API_PUBLICA",
      "TQE_PLI_RELATORIOS_ADV" = EXCLUDED."TQE_PLI_RELATORIOS_ADV";

-- 5. Atualizar barbearias com plano "pago" para "basic"
UPDATE "TQE_BARBEARIA" SET "TQE_BAR_PLANO" = 'basic' WHERE "TQE_BAR_PLANO" = 'pago';
