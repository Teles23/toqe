import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { AgendamentoConfirmadoJob, ConviteEmailJob } from './notificacao.types';

export const NOTIFICACAO_QUEUE = 'notificacoes';
export const AGENDAMENTO_CONFIRMADO = 'agendamento_confirmado';
export const SEND_CONVITE = 'send_convite';

@Injectable()
export class NotificacaoProducer {
  constructor(
    @InjectQueue(NOTIFICACAO_QUEUE)
    private readonly queue: Queue,
  ) {}

  async agendamentoConfirmado(data: AgendamentoConfirmadoJob) {
    await this.queue.add(AGENDAMENTO_CONFIRMADO, data, {
      attempts: 3, // Tenta até 3 vezes em caso de falha
      backoff: {
        type: 'exponential',
        delay: 5000, // Começa com 5s, depois 10s, 20s
      },
    });
  }

  async enviarConvite(data: ConviteEmailJob) {
    await this.queue.add(SEND_CONVITE, data, {
      attempts: 3, // Tenta até 3 vezes em caso de falha
      backoff: {
        type: 'exponential',
        delay: 5000, // Começa com 5s, depois 10s, 20s
      },
    });
  }
}
