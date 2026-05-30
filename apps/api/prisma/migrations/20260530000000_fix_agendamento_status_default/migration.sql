-- AlterTable: corrige default de status para lowercase, alinhado ao enum StatusAgendamento
ALTER TABLE "TQE_AGENDAMENTO" ALTER COLUMN "TQE_AGD_STATUS" SET DEFAULT 'pendente';

-- Corrige registros existentes com valor uppercase (caso existam em dev/seed)
UPDATE "TQE_AGENDAMENTO" SET "TQE_AGD_STATUS" = LOWER("TQE_AGD_STATUS")
WHERE "TQE_AGD_STATUS" IN ('PENDENTE', 'CONFIRMADO', 'CANCELADO', 'NO_SHOW', 'CONCLUIDO', 'EM_ANDAMENTO');
