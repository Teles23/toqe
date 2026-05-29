import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  InternalServerErrorException,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AsaasService } from './asaas.service';
import type { AsaasWebhookPayload } from './asaas-webhook.dto';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtRequest } from '../common/types/jwt-request';
import { SkipPlanoCheck } from '../auth/decorators/skip-plano-check.decorator';

@Controller('asaas')
export class AsaasController {
  constructor(
    private readonly asaas: AsaasService,
    private readonly prisma: PrismaService,
  ) {}

  /** Gera link de checkout para o plano solicitado. Cria customer se necessário. */
  @UseGuards(JwtAuthGuard)
  @Post('checkout/:barCodigo')
  async checkout(
    @Param('barCodigo') barCodigoStr: string,
    @Body() body: { plano: string },
    @Request() req: JwtRequest,
  ) {
    const barCodigo = Number(barCodigoStr);
    const membro = await this.prisma.membroBarbearia.findFirst({
      where: {
        barCodigo,
        usrCodigo: req.user.sub,
        perfil: { in: ['dono', 'gerente'] },
      },
    });
    if (!membro) {
      throw new ForbiddenException(
        'Você não tem permissão para fazer checkout para esta barbearia',
      );
    }
    const barbearia = await this.prisma.barbearia.findUniqueOrThrow({
      where: { codigo: barCodigo },
    });
    const usuario = await this.prisma.usuario.findUniqueOrThrow({
      where: { codigo: req.user.sub },
      select: { nome: true, email: true },
    });

    let customerId = barbearia.asaasCustomerId;
    if (!customerId) {
      const customer = await this.asaas.createCustomer(
        usuario.nome,
        usuario.email,
      );
      customerId = customer.id;
      await this.prisma.barbearia.update({
        where: { codigo: barCodigo },
        data: { asaasCustomerId: customerId },
      });
    }

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);
    const dueDateStr = nextDueDate.toISOString().slice(0, 10);

    const subscription = await this.asaas.createSubscription(
      customerId,
      body.plano,
      dueDateStr,
    );

    await this.prisma.barbearia.update({
      where: { codigo: barCodigo },
      data: {
        asaasSubscriptionId: subscription.id,
        plano: body.plano,
        planoStatus: 'ativo',
        planoValidoAte: new Date(subscription.nextDueDate),
      },
    });

    const link = await this.asaas.getPaymentLink(subscription.id);
    return { url: link.url };
  }

  /** Webhook do Asaas — sem autenticação, verificado pelo token de assinatura */
  @SkipPlanoCheck()
  @Post('webhook')
  async webhook(
    @Body() payload: AsaasWebhookPayload,
    @Headers() headers: Record<string, string>,
  ) {
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
    if (!webhookToken) {
      throw new InternalServerErrorException(
        'ASAAS_WEBHOOK_TOKEN não configurado',
      );
    }
    const receivedToken = headers['asaas-access-token'] ?? '';
    const expected = Buffer.from(webhookToken);
    const received = Buffer.from(receivedToken);
    const valid =
      expected.length === received.length &&
      timingSafeEqual(expected, received);
    if (!valid) {
      throw new UnauthorizedException('Token de webhook inválido');
    }
    const subId = payload.payment?.subscription ?? payload.subscription?.id;
    if (!subId) return { ok: true };

    const barbearia = await this.prisma.barbearia.findFirst({
      where: { asaasSubscriptionId: subId },
    });
    if (!barbearia) return { ok: true };

    switch (payload.event) {
      case 'PAYMENT_RECEIVED':
      case 'SUBSCRIPTION_RENEWED': {
        const nextDue =
          payload.payment?.dueDate ?? payload.subscription?.nextDueDate;
        await this.prisma.barbearia.update({
          where: { codigo: barbearia.codigo },
          data: {
            planoStatus: 'ativo',
            planoValidoAte: nextDue ? new Date(nextDue) : undefined,
            bloqueadaEm: null,
          },
        });
        break;
      }
      case 'PAYMENT_OVERDUE': {
        await this.prisma.barbearia.update({
          where: { codigo: barbearia.codigo },
          data: { planoStatus: 'inadimplente', bloqueadaEm: new Date() },
        });
        break;
      }
      case 'SUBSCRIPTION_INACTIVATED': {
        await this.prisma.barbearia.update({
          where: { codigo: barbearia.codigo },
          data: { planoStatus: 'cancelado', bloqueadaEm: new Date() },
        });
        break;
      }
    }
    return { ok: true };
  }
}
