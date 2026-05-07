import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificacaoService } from './notificacao.service';
import { AGENDAMENTO_CONFIRMADO, NOTIFICACAO_QUEUE } from './notificacao.producer';
import { AgendamentoConfirmadoJob } from './notificacao.types';

@Processor(NOTIFICACAO_QUEUE)
export class NotificacaoConsumer {
  private readonly logger = new Logger(NotificacaoConsumer.name);

  constructor(private readonly notificacaoService: NotificacaoService) {}

  @Process(AGENDAMENTO_CONFIRMADO)
  async handleAgendamentoConfirmado(job: Job<AgendamentoConfirmadoJob>) {
    this.logger.log(
      `Processando job ${job.id} — Agendamento #${job.data.agendamentoCodigo} para ${job.data.clienteEmail}`,
    );

    await this.notificacaoService.enviarConfirmacaoAgendamento(job.data);

    this.logger.log(`Job ${job.id} processado com sucesso.`);
  }
}
