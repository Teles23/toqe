'use strict';
/**
 * Fonte única dos agendamentos de demonstração usados pelos dois seeds
 * (seed.ts via ts-node e seed-runner.js via node puro no Docker).
 *
 * Regras:
 *  - status sempre em minúsculo, batendo com o enum StatusAgendamento
 *    (apps/api/src/common/constants/agendamento-status.ts). O teste
 *    seed-demo-data.spec.ts garante que esses valores existem no enum.
 *  - inicio SEMPRE determinístico por dia (horário fixo). Nunca usar
 *    addHours(new Date(), ...) ou qualquer base relativa ao "agora": o seed
 *    deduplica por (barbeiroId, inicio), então um inicio que muda a cada
 *    execução cria um agendamento novo a cada boot (bug de acúmulo).
 */
const { startOfDay, setHours, setMinutes } = require('date-fns');

const STATUS = {
  CONCLUIDO: 'concluido',
  EM_ANDAMENTO: 'em_andamento',
};

/**
 * @param {Date} [refDate] data de referência (default: agora). Apenas o dia é
 *   considerado — o horário de cada agendamento é fixo.
 * @returns {{clienteEmail: string, barbeiroEmail: string, inicio: Date, status: string}[]}
 */
function buildAgendamentosDemo(refDate = new Date()) {
  const hoje = startOfDay(refDate);
  const as = (hora) => setHours(setMinutes(hoje, 0), hora);

  return [
    {
      clienteEmail: 'joao.cliente@email.com',
      barbeiroEmail: 'thiago@email.com',
      inicio: as(9),
      status: STATUS.CONCLUIDO,
    },
    {
      clienteEmail: 'marcos.silva@email.com',
      barbeiroEmail: 'barbeiro1@email.com',
      inicio: as(10),
      status: STATUS.CONCLUIDO,
    },
    {
      clienteEmail: 'joao.cliente@email.com',
      barbeiroEmail: 'thiago@email.com',
      inicio: as(14),
      status: STATUS.EM_ANDAMENTO,
    },
  ];
}

module.exports = { buildAgendamentosDemo };
