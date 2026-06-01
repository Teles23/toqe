import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationService } from '../push-token/push-notification.service';
import { NotificacaoService } from '../notificacao/notificacao.service';
import { Prisma } from '../generated/prisma';
import { StatusAgendamento } from '../common/constants/agendamento-status';

const LEMBRETE_INCLUDE = {
  cliente: { select: { codigo: true, nome: true, email: true } },
  contato: { select: { nome: true } },
  barbeiro: { select: { nome: true } },
  barbearia: { select: { nome: true } },
  itens: { include: { servico: { select: { nome: true } } } },
} as const;

const NO_SHOW_INCLUDE = {
  barbeiro: { select: { codigo: true, nome: true } },
  barbearia: { select: { nome: true } },
  cliente: { select: { nome: true } },
  contato: { select: { nome: true } },
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
          status: {
            in: [StatusAgendamento.CONFIRMADO, StatusAgendamento.PENDENTE],
          },
          lembrete24hEnviado: false,
          inicio: { gte: janela24hInicio, lte: janela24hFim },
        },
        include: LEMBRETE_INCLUDE,
      }),
      this.prisma.agendamento.findMany({
        where: {
          status: {
            in: [StatusAgendamento.CONFIRMADO, StatusAgendamento.PENDENTE],
          },
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

  @Cron('0 */30 * * * *')
  async detectarNoShows(): Promise<void> {
    this.logger.log('No-shows: iniciando varredura');
    const agora = new Date();

    const candidatos = await this.prisma.agendamento.findMany({
      where: {
        fim: { lt: agora },
        status: {
          in: [StatusAgendamento.PENDENTE, StatusAgendamento.CONFIRMADO],
        },
      },
      include: NO_SHOW_INCLUDE,
    });

    for (const ag of candidatos) {
      try {
        await this.prisma.agendamento.update({
          where: { codigo: ag.codigo },
          data: { status: StatusAgendamento.NO_SHOW },
        });

        const clienteNome = ag.cliente?.nome ?? ag.contato?.nome ?? 'Cliente';
        const horario = ag.fim.toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });

        await this.pushService.send(
          ag.barbeiro.codigo,
          'No-show detectado',
          `${clienteNome} não compareceu às ${horario} — ${ag.barbearia.nome}`,
        );

        this.logger.log(`No-show detectado: agendamento #${ag.codigo}`);
      } catch (err) {
        this.logger.error(
          `Falha ao processar no-show para agendamento #${ag.codigo}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  private async enviar(
    ag: Prisma.AgendamentoGetPayload<{ include: typeof LEMBRETE_INCLUDE }>,
    tipo: '24h' | '2h',
  ): Promise<void> {
    const updateField =
      tipo === '24h'
        ? { lembrete24hEnviado: true }
        : { lembrete2hEnviado: true };
    const whereField =
      tipo === '24h'
        ? { lembrete24hEnviado: false }
        : { lembrete2hEnviado: false };

    // Atomic claim: only proceed if this process is the first to claim this row.
    // Prevents duplicate sends when two cron ticks overlap.
    const claimed = await this.prisma.agendamento.updateMany({
      where: { codigo: ag.codigo, ...whereField },
      data: updateField,
    });
    if (claimed.count === 0) return;

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

      this.logger.log(
        `Lembrete ${tipo} enviado para agendamento #${ag.codigo}`,
      );
    } catch (err) {
      this.logger.error(
        `Falha ao enviar lembrete ${tipo} para agendamento #${ag.codigo}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  @Cron('0 5 0 * * *')
  async expirarTrials(): Promise<void> {
    const agora = new Date();
    const candidatos = await this.prisma.barbearia.findMany({
      where: { planoStatus: 'trial', trialFim: { lt: agora } },
      select: { codigo: true, nome: true },
    });

    for (const bar of candidatos) {
      try {
        await this.prisma.barbearia.update({
          where: { codigo: bar.codigo },
          data: { planoStatus: 'inadimplente', bloqueadaEm: agora },
        });
        // TODO: enviar push para o dono quando tivermos o sistema de push por barbearia
      } catch (err) {
        this.logger.error(
          `Falha ao expirar trial da barbearia #${bar.codigo}: ${String(err)}`,
        );
      }
    }
  }

  @Cron('0 0 9 * * *')
  async enviarEmailsCobranca(): Promise<void> {
    const agora = new Date();

    // 5 dias antes do vencimento
    const em5Dias = new Date(agora);
    em5Dias.setDate(em5Dias.getDate() + 5);

    const vencendoEm5 = await this.prisma.barbearia.findMany({
      where: {
        planoStatus: 'ativo',
        planoValidoAte: {
          gte: new Date(
            em5Dias.getFullYear(),
            em5Dias.getMonth(),
            em5Dias.getDate(),
          ),
          lt: new Date(
            em5Dias.getFullYear(),
            em5Dias.getMonth(),
            em5Dias.getDate() + 1,
          ),
        },
      },
      select: {
        codigo: true,
        nome: true,
        membros: {
          where: { perfil: 'dono' },
          select: { usuario: { select: { email: true, nome: true } } },
        },
      },
    });

    for (const bar of vencendoEm5) {
      const dono = bar.membros[0]?.usuario;
      if (!dono) continue;
      try {
        await this.notificacaoService.enviarEmail({
          to: dono.email,
          subject: `Sua assinatura Toqe vence em 5 dias`,
          html: `<p>Olá ${dono.nome}, sua assinatura da barbearia <strong>${bar.nome}</strong> vence em 5 dias. Renove para não perder o acesso.</p>`,
        });
      } catch (err) {
        this.logger.error(
          `Falha ao enviar email de cobrança para barbearia #${bar.codigo}: ${String(err)}`,
        );
      }
    }

    // No dia do vencimento
    const hoje = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate(),
    );
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const vencendoHoje = await this.prisma.barbearia.findMany({
      where: {
        planoStatus: 'ativo',
        planoValidoAte: { gte: hoje, lt: amanha },
      },
      select: {
        codigo: true,
        nome: true,
        membros: {
          where: { perfil: 'dono' },
          select: { usuario: { select: { email: true, nome: true } } },
        },
      },
    });

    for (const bar of vencendoHoje) {
      const dono = bar.membros[0]?.usuario;
      if (!dono) continue;
      try {
        await this.notificacaoService.enviarEmail({
          to: dono.email,
          subject: `Sua assinatura Toqe vence hoje`,
          html: `<p>Olá ${dono.nome}, sua assinatura da barbearia <strong>${bar.nome}</strong> vence hoje. Acesse o portal para renovar.</p>`,
        });
      } catch (err) {
        this.logger.error(
          `Falha ao enviar email de vencimento para barbearia #${bar.codigo}: ${String(err)}`,
        );
      }
    }

    // 3 dias após o vencimento (inadimplentes)
    const ha3Dias = new Date(agora);
    ha3Dias.setDate(ha3Dias.getDate() - 3);

    const inadimplentesHa3Dias = await this.prisma.barbearia.findMany({
      where: {
        planoStatus: 'inadimplente',
        bloqueadaEm: {
          gte: new Date(
            ha3Dias.getFullYear(),
            ha3Dias.getMonth(),
            ha3Dias.getDate(),
          ),
          lt: new Date(
            ha3Dias.getFullYear(),
            ha3Dias.getMonth(),
            ha3Dias.getDate() + 1,
          ),
        },
      },
      select: {
        codigo: true,
        nome: true,
        membros: {
          where: { perfil: 'dono' },
          select: { usuario: { select: { email: true, nome: true } } },
        },
      },
    });

    for (const bar of inadimplentesHa3Dias) {
      const dono = bar.membros[0]?.usuario;
      if (!dono) continue;
      try {
        await this.notificacaoService.enviarEmail({
          to: dono.email,
          subject: `Acesso suspenso — regularize sua assinatura Toqe`,
          html: `<p>Olá ${dono.nome}, o acesso à barbearia <strong>${bar.nome}</strong> está suspenso há 3 dias. Regularize sua assinatura para reativar.</p>`,
        });
      } catch (err) {
        this.logger.error(
          `Falha ao enviar email de inadimplência para barbearia #${bar.codigo}: ${String(err)}`,
        );
      }
    }
  }

  @Cron('0 9 * * *')
  async enviarPushAniversario(): Promise<void> {
    const hoje = new Date();
    const dia = hoje.getDate();
    const mes = hoje.getMonth() + 1;

    this.logger.log(`Aniversários: verificando dia ${dia}/${mes}`);

    const aniversariantes = await this.prisma.usuario.findMany({
      where: {
        dataNascimento: { not: null },
        ativo: true,
      },
      select: { codigo: true, nome: true, dataNascimento: true },
    });

    const deHoje = aniversariantes.filter((u) => {
      if (!u.dataNascimento) return false;
      const d = u.dataNascimento;
      return d.getDate() === dia && d.getMonth() + 1 === mes;
    });

    for (const u of deHoje) {
      try {
        await this.pushService.send(
          u.codigo,
          'Feliz aniversário! 🎉',
          `Parabéns, ${u.nome}! Que tal celebrar com um corte novo?`,
        );
        this.logger.log(`Push de aniversário enviado para #${u.codigo}`);
      } catch (err) {
        this.logger.error(
          `Falha ao enviar push de aniversário para #${u.codigo}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
}
