import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AceitarConviteDto } from './dto/aceitar-convite.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ConviteService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

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
      throw new BadRequestException('Este convite já foi utilizado');
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

      await tx.conviteBarbearia.update({
        where: { token },
        data: { usadoEm: new Date() },
      });

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
