-- Corrige inconsistência: migration anterior usava maxBarbeiros=1 para 'free',
-- mas seed-runner.js usa 2. O valor 1 bloqueia o segundo convite pendente
-- de barbeiro, quebrando o fluxo de onboarding quando um convite ainda está
-- pendente ao convidar um segundo barbeiro.
UPDATE "TQE_PLANO_LIMITE"
SET "TQE_PLI_MAX_BARBEIROS" = 2
WHERE "TQE_PLI_PLANO" = 'free'
  AND "TQE_PLI_MAX_BARBEIROS" = 1;
