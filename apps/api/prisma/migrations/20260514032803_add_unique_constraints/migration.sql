/*
  Warnings:

  - A unique constraint covering the columns `[TQE_AGD_BARBEIRO_ID,TQE_AGD_INICIO]` on the table `TQE_AGENDAMENTO` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[TQE_AGI_AGD_CODIGO,TQE_AGI_SRV_CODIGO]` on the table `TQE_AGENDAMENTO_ITEM` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[TQE_SRV_NOME,TQE_SRV_BAR_CODIGO]` on the table `TQE_SERVICO` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TQE_AGENDAMENTO_TQE_AGD_BARBEIRO_ID_TQE_AGD_INICIO_key" ON "TQE_AGENDAMENTO"("TQE_AGD_BARBEIRO_ID", "TQE_AGD_INICIO");

-- CreateIndex
CREATE UNIQUE INDEX "TQE_AGENDAMENTO_ITEM_TQE_AGI_AGD_CODIGO_TQE_AGI_SRV_CODIGO_key" ON "TQE_AGENDAMENTO_ITEM"("TQE_AGI_AGD_CODIGO", "TQE_AGI_SRV_CODIGO");

-- CreateIndex
CREATE UNIQUE INDEX "TQE_SERVICO_TQE_SRV_NOME_TQE_SRV_BAR_CODIGO_key" ON "TQE_SERVICO"("TQE_SRV_NOME", "TQE_SRV_BAR_CODIGO");
