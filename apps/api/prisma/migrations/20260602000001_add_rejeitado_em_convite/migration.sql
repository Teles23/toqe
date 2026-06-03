-- AlterTable: adiciona coluna para registrar rejeição de convite sem apagar o registro
ALTER TABLE "TQE_CONVITE_BARBEARIA" ADD COLUMN "TQE_CVT_REJEITADO_EM" TIMESTAMPTZ;
