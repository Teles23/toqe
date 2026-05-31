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
import { PrismaService } from '../prisma/prisma.service';

@Processor(NOTIFICACAO_QUEUE)
export class NotificacaoConsumer {
  private readonly logger = new Logger(NotificacaoConsumer.name);

  constructor(
    private readonly notificacaoService: NotificacaoService,
    private readonly pushService: PushNotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Process(AGENDAMENTO_CONFIRMADO)
  async handleAgendamentoConfirmado(job: Job<AgendamentoConfirmadoJob>) {
    this.logger.log(
      `Processando job ${job.id} — Agendamento #${job.data.agendamentoCodigo}`,
    );

    // Busca dados do DB em vez de ler PII da fila Redis
    const ag = await this.prisma.agendamento.findUnique({
      where: { codigo: job.data.agendamentoCodigo },
      include: {
        cliente: { select: { nome: true, email: true } },
        contato: { select: { nome: true } },
        barbeiro: { select: { nome: true } },
        barbearia: { select: { nome: true } },
        itens: { include: { servico: { select: { nome: true } } } },
      },
    });

    if (!ag) {
      this.logger.warn(
        `Agendamento #${job.data.agendamentoCodigo} não encontrado — job ignorado`,
      );
      return;
    }

    const clienteEmail = ag.cliente?.email ?? '';
    const clienteNome = ag.cliente?.nome ?? ag.contato?.nome ?? '';
    const barbeiroNome = ag.barbeiro?.nome ?? '';
    const barbeariaNome = ag.barbearia?.nome ?? '';
    const inicio = ag.inicio.toISOString();
    const servicos = ag.itens
      .map((i) => i.servico?.nome)
      .filter((n): n is string => Boolean(n));

    if (clienteEmail) {
      await this.notificacaoService.enviarConfirmacaoAgendamento({
        agendamentoCodigo: ag.codigo,
        clienteNome,
        clienteEmail,
        barbeiroNome,
        barbeariaNome,
        inicio,
        fim: ag.fim.toISOString(),
        servicos,
      });
    }

    if (job.data.clienteUsrCodigo) {
      await this.pushService.send(
        job.data.clienteUsrCodigo,
        'Agendamento confirmado!',
        `${barbeariaNome} — ${new Date(inicio).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
      );
    }
    if (job.data.barbeiroUsrCodigo) {
      await this.pushService.send(
        job.data.barbeiroUsrCodigo,
        'Novo agendamento!',
        `${clienteNome} — ${new Date(inicio).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
        { barCodigo: job.data.barCodigo, dataAgendamento: inicio },
      );
    }

    this.logger.log(`Job ${job.id} processado com sucesso.`);
  }

  @Process(SEND_CONVITE)
  async handleSendConvite(job: Job<ConviteEmailJob>) {
    this.logger.log(
      `Processando job ${job.id} — Convite para barbearia ${job.data.barbeariaNome}`,
    );

    await this.notificacaoService.enviarConviteEmail(job.data);

    this.logger.log(`Job ${job.id} processado com sucesso.`);
  }
}
