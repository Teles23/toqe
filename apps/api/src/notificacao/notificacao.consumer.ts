import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { NotificacaoService } from './notificacao.service';
import {
  AGENDAMENTO_CONFIRMADO,
  NOTIFICACAO_QUEUE,
  SEND_CONVITE,
} from './notificacao.producer';
import { AgendamentoConfirmadoJob, ConviteEmailJob } from './notificacao.types';
import { PushNotificationService } from '../push-token/push-notification.service';

@Processor(NOTIFICACAO_QUEUE)
export class NotificacaoConsumer {
  private readonly logger = new Logger(NotificacaoConsumer.name);

  constructor(
    private readonly notificacaoService: NotificacaoService,
    private readonly pushService: PushNotificationService,
  ) {}

  @Process(AGENDAMENTO_CONFIRMADO)
  async handleAgendamentoConfirmado(job: Job<AgendamentoConfirmadoJob>) {
    this.logger.log(
      `Processando job ${job.id} — Agendamento #${job.data.agendamentoCodigo} para ${job.data.clienteEmail}`,
    );

    await this.notificacaoService.enviarConfirmacaoAgendamento(job.data);

    if (job.data.clienteUsrCodigo) {
      await this.pushService.send(
        job.data.clienteUsrCodigo,
        'Agendamento confirmado!',
        `${job.data.barbeariaNome} — ${new Date(job.data.inicio).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
      );
    }
    if (job.data.barbeiroUsrCodigo) {
      await this.pushService.send(
        job.data.barbeiroUsrCodigo,
        'Novo agendamento!',
        `${job.data.clienteNome} — ${new Date(job.data.inicio).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
        { barCodigo: job.data.barCodigo, dataAgendamento: job.data.inicio },
      );
    }

    this.logger.log(`Job ${job.id} processado com sucesso.`);
  }

  @Process(SEND_CONVITE)
  async handleSendConvite(job: Job<ConviteEmailJob>) {
    this.logger.log(
      `Processando job ${job.id} — Convite para ${job.data.email} (${job.data.barbeariaNome})`,
    );

    await this.notificacaoService.enviarConviteEmail(job.data);

    this.logger.log(`Job ${job.id} processado com sucesso.`);
  }
}
