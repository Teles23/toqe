import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { AgendamentoConfirmadoJob } from './notificacao.types';

export const NOTIFICACAO_QUEUE = 'notificacoes';
export const AGENDAMENTO_CONFIRMADO = 'agendamento_confirmado';

@Injectable()
export class NotificacaoProducer {
  constructor(
    @InjectQueue(NOTIFICACAO_QUEUE)
    private readonly queue: Queue,
  ) {}

  async agendamentoConfirmado(data: AgendamentoConfirmadoJob) {
    await this.queue.add(AGENDAMENTO_CONFIRMADO, data, {
      attempts: 3,        // Tenta até 3 vezes em caso de falha
      backoff: {
        type: 'exponential',
        delay: 5000,      // Começa com 5s, depois 10s, 20s
      },
    });
  }
}
