import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationService } from '../push-token/push-notification.service';
import { NotificacaoService } from '../notificacao/notificacao.service';
import { Prisma } from '../generated/prisma';

const LEMBRETE_INCLUDE = {
  cliente: { select: { codigo: true, nome: true, email: true } },
  contato: { select: { nome: true } },
  barbeiro: { select: { nome: true } },
  barbearia: { select: { nome: true } },
  itens: { include: { servico: { select: { nome: true } } } },
} as const;

@Injectable()
export class LembreteService {
  private readonly logger = new Logger(LembreteService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushNotificationService,
    private readonly notificacaoService: NotificacaoService,
  ) {}

  @Cron('0 */30 * * * *')
  async enviarLembretes(): Promise<void> {
    this.logger.log('Cron lembretes: iniciando varredura');
    const agora = new Date();

    // Janela de 24h: agendamentos entre (agora + 23h30) e (agora + 24h30)
    const em24h = new Date(agora.getTime() + 24 * 60 * 60 * 1000);
    const janela24hInicio = new Date(em24h.getTime() - 30 * 60 * 1000);
    const janela24hFim = new Date(em24h.getTime() + 30 * 60 * 1000);

    // Janela de 2h: agendamentos entre (agora + 1h30) e (agora + 2h30)
    const em2h = new Date(agora.getTime() + 2 * 60 * 60 * 1000);
    const janela2hInicio = new Date(em2h.getTime() - 30 * 60 * 1000);
    const janela2hFim = new Date(em2h.getTime() + 30 * 60 * 1000);

    const [para24h, para2h] = await Promise.all([
      this.prisma.agendamento.findMany({
        where: {
          status: { in: ['CONFIRMADO', 'PENDENTE'] },
          lembrete24hEnviado: false,
          inicio: { gte: janela24hInicio, lte: janela24hFim },
        },
        include: LEMBRETE_INCLUDE,
      }),
      this.prisma.agendamento.findMany({
        where: {
          status: { in: ['CONFIRMADO', 'PENDENTE'] },
          lembrete2hEnviado: false,
          inicio: { gte: janela2hInicio, lte: janela2hFim },
        },
        include: LEMBRETE_INCLUDE,
      }),
    ]);

    this.logger.log(`Lembretes 24h: ${para24h.length}, 2h: ${para2h.length}`);

    await Promise.allSettled([
      ...para24h.map((ag) => this.enviar(ag, '24h')),
      ...para2h.map((ag) => this.enviar(ag, '2h')),
    ]);
  }

  private async enviar(
    ag: Prisma.AgendamentoGetPayload<{ include: typeof LEMBRETE_INCLUDE }>,
    tipo: '24h' | '2h',
  ): Promise<void> {
    const clienteNome = ag.cliente?.nome ?? ag.contato?.nome ?? 'Cliente';
    const servicos = ag.itens.map((i) => i.servico.nome).join(', ');
    const horario = ag.inicio.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    try {
      if (ag.cliente?.codigo) {
        await this.pushService.send(
          ag.cliente.codigo,
          tipo === '24h'
            ? 'Lembrete: amanhã é dia de cuidar do visual!'
            : 'Lembrete: seu horário é em breve!',
          `${ag.barbearia.nome} — ${horario} — ${servicos}`,
        );
      }
      if (ag.cliente?.email) {
        await this.notificacaoService.enviarLembrete({
          clienteNome,
          clienteEmail: ag.cliente.email,
          barbeariaNome: ag.barbearia.nome,
          barbeiroNome: ag.barbeiro.nome,
          inicio: ag.inicio.toISOString(),
          servicos: ag.itens.map((i) => i.servico.nome),
          tipo,
        });
      }

      const updateField =
        tipo === '24h'
          ? { lembrete24hEnviado: true }
          : { lembrete2hEnviado: true };
      await this.prisma.agendamento.update({
        where: { codigo: ag.codigo },
        data: updateField,
      });
      this.logger.log(
        `Lembrete ${tipo} enviado para agendamento #${ag.codigo}`,
      );
    } catch (err) {
      this.logger.error(
        `Falha ao enviar lembrete ${tipo} para agendamento #${ag.codigo}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
