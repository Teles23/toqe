-- Sprint C: Monetização — trial, plano válido até, integração Asaas

-- Alterar valor padrão de planoStatus para 'trial'
ALTER TABLE "TQE_BARBEARIA" ALTER COLUMN "TQE_BAR_PLANO_STATUS" SET DEFAULT 'trial';

-- Novas colunas para trial e assinatura
ALTER TABLE "TQE_BARBEARIA"
  ADD COLUMN IF NOT EXISTS "TQE_BAR_TRIAL_FIM" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "TQE_BAR_PLANO_VALIDO_ATE" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "TQE_BAR_ASAAS_CUSTOMER_ID" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "TQE_BAR_ASAAS_SUBSCRIPTION_ID" VARCHAR(50);

-- Barbearias existentes com status 'ativo' ficam como 'ativo' (não retroativo)
