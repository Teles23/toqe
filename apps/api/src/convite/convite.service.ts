import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { GerarConviteResponse } from '@toqe/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { NotificacaoProducer } from '../notificacao/notificacao.producer';
import { AceitarConviteDto } from './dto/aceitar-convite.dto';
import { GerarConviteDto } from './dto/gerar-convite.dto';
import * as bcrypt from 'bcrypt';

/** Janela de validade do convite: 7 dias a partir da geração/renovação. */
const CONVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class ConviteService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private notificacaoProducer: NotificacaoProducer,
  ) {}

  /**
   * Gera (ou renova) um convite por e-mail para uma barbearia e dispara o envio
   * via job BullMQ. AuthZ é feita na controller (dono/gerente do tenant).
   *
   * Idempotência: se já existe um convite NÃO usado e NÃO expirado para o mesmo
   * e-mail+barbearia, ele é renovado (novo token + nova validade + perfil
   * atualizado) em vez de duplicar a linha.
   */
  async gerarConvite(
    barCodigo: number,
    dto: GerarConviteDto,
  ): Promise<GerarConviteResponse> {
    const barbearia = await this.prisma.barbearia.findUnique({
      where: { codigo: barCodigo },
      select: { nome: true },
    });
    if (!barbearia) {
      throw new NotFoundException('Barbearia não encontrada');
    }

    const email = dto.email.toLowerCase().trim();

    // 36 chars em VARCHAR(36) — randomBytes(16).toString('hex') = 32 chars,
    // 128 bits de entropia, cabe na coluna com folga.
    const token = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + CONVITE_TTL_MS);

    const agora = new Date();
    const conviteAtivo = await this.prisma.conviteBarbearia.findFirst({
      where: {
        barCodigo,
        email,
        usadoEm: null,
        expiresAt: { gt: agora },
      },
      select: { codigo: true },
    });

    const convite = conviteAtivo
      ? await this.prisma.conviteBarbearia.update({
          where: { codigo: conviteAtivo.codigo },
          data: { token, perfil: dto.perfil, expiresAt },
          select: {
            codigo: true,
            email: true,
            perfil: true,
            expiresAt: true,
            token: true,
          },
        })
      : await this.prisma.conviteBarbearia.create({
          data: { barCodigo, email, perfil: dto.perfil, token, expiresAt },
          select: {
            codigo: true,
            email: true,
            perfil: true,
            expiresAt: true,
            token: true,
          },
        });

    const base = process.env.FRONTEND_URL ?? 'http://localhost:4001';
    const conviteLink = `${base}/convite?token=${convite.token}`;

    await this.notificacaoProducer.enviarConvite({
      email: convite.email,
      conviteLink,
      barbeariaNome: barbearia.nome,
      perfil: convite.perfil,
    });

    return {
      codigo: convite.codigo,
      email: convite.email,
      perfil: convite.perfil,
      expiresAt: convite.expiresAt.toISOString(),
      reaproveitado: conviteAtivo !== null,
    };
  }

  async obterConvite(token: string) {
    const convite = await this.prisma.conviteBarbearia.findUnique({
      where: { token },
      include: {
        barbearia: { select: { nome: true, slug: true } },
      },
    });

    if (!convite || convite.expiresAt < new Date()) {
      throw new NotFoundException('Convite não encontrado ou expirado');
    }

    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { email: convite.email },
      select: { codigo: true },
    });

    return {
      token: convite.token,
      barbeariaNome: convite.barbearia.nome,
      barbeariaSlug: convite.barbearia.slug,
      email: convite.email,
      perfil: convite.perfil,
      expiresAt: convite.expiresAt.toISOString(),
      isNew: usuarioExistente === null,
    };
  }

  async aceitarConvite(token: string, dto: AceitarConviteDto) {
    const convite = await this.prisma.conviteBarbearia.findUnique({
      where: { token },
      include: { barbearia: { select: { nome: true } } },
    });

    if (!convite || convite.expiresAt < new Date()) {
      throw new NotFoundException('Convite não encontrado ou expirado');
    }

    if (convite.usadoEm) {
      throw new ConflictException('Este convite já foi utilizado');
    }

    const existente = await this.prisma.usuario.findUnique({
      where: { email: convite.email },
      select: { codigo: true, nome: true, email: true, senhaHash: true },
    });

    const isNew = existente === null;

    if (isNew) {
      if (!dto.nome || !dto.senha) {
        throw new BadRequestException(
          'Nome e senha são obrigatórios para novos usuários',
        );
      }
    } else {
      // Usuário existente: o token sozinho NÃO basta para auto-login (vetor de
      // account-takeover se o link vazar). Exige a senha da conta, verificada.
      if (!dto.senha) {
        throw new BadRequestException('Senha é obrigatória');
      }
      // Conta sem senha (ex.: criada via login social) não pode confirmar por senha.
      if (!existente.senhaHash) {
        throw new UnauthorizedException(
          'Esta conta não tem senha definida — entre pelo método de login original',
        );
      }
      const senhaOk = await bcrypt.compare(dto.senha, existente.senhaHash);
      if (!senhaOk) {
        throw new UnauthorizedException('Senha incorreta');
      }
    }

    // Cria usuário (se novo) + vincula como membro + marca convite usado numa
    // única transação — se qualquer passo falha, nada é persistido.
    const usuario = await this.prisma.$transaction(async (tx) => {
      const user = existente
        ? {
            codigo: existente.codigo,
            nome: existente.nome,
            email: existente.email,
          }
        : await tx.usuario.create({
            data: {
              nome: dto.nome!,
              email: convite.email,
              senhaHash: await bcrypt.hash(dto.senha!, await bcrypt.genSalt()),
            },
            select: { codigo: true, nome: true, email: true },
          });

      const membroExistente = await tx.membroBarbearia.findFirst({
        where: { barCodigo: convite.barCodigo, usrCodigo: user.codigo },
      });
      if (!membroExistente) {
        await tx.membroBarbearia.create({
          data: {
            barCodigo: convite.barCodigo,
            usrCodigo: user.codigo,
            perfil: convite.perfil,
          },
        });
      }

      // Atomic claim: only one concurrent request can set usadoEm from null.
      // The pre-transaction check (line ~146) is a fast-path UX guard only.
      const marked = await tx.conviteBarbearia.updateMany({
        where: { token, usadoEm: null },
        data: { usadoEm: new Date() },
      });
      if (marked.count === 0) {
        throw new ConflictException('Este convite já foi utilizado');
      }

      return user;
    });

    // Auto-login: a posse do link (enviado por e-mail) é a prova de identidade.
    const tokens = await this.authService.issueTokens(
      usuario.codigo,
      usuario.nome,
      usuario.email,
    );

    return {
      ...tokens,
      isNew,
      barbeariaNome: convite.barbearia.nome,
    };
  }

  /**
   * Rejeita um convite — remove o registro (não cria conta nem vínculo).
   * Idempotente: se o token não existe, retorna sucesso assim mesmo.
   */
  async rejeitarConvite(token: string) {
    await this.prisma.conviteBarbearia.deleteMany({ where: { token } });
    return { sucesso: true };
  }
}
