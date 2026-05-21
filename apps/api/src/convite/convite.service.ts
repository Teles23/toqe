import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AceitarConviteDto } from './dto/aceitar-convite.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ConviteService {
  constructor(private prisma: PrismaService) {}

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
    });

    if (!convite || convite.expiresAt < new Date()) {
      throw new NotFoundException('Convite não encontrado ou expirado');
    }

    if (convite.usadoEm) {
      throw new BadRequestException('Este convite já foi utilizado');
    }

    let usuario = await this.prisma.usuario.findUnique({
      where: { email: convite.email },
      select: { codigo: true },
    });

    const isNew = usuario === null;

    if (isNew) {
      if (!dto.nome || !dto.senha) {
        throw new BadRequestException(
          'Nome e senha são obrigatórios para novos usuários',
        );
      }
      const salt = await bcrypt.genSalt();
      const senhaHash = await bcrypt.hash(dto.senha, salt);
      usuario = await this.prisma.usuario.create({
        data: {
          nome: dto.nome,
          email: convite.email,
          senhaHash,
        },
        select: { codigo: true },
      });
    }

    // Adiciona como membro se ainda não for membro
    const membroExistente = await this.prisma.membroBarbearia.findFirst({
      where: {
        barCodigo: convite.barCodigo,
        usrCodigo: usuario!.codigo,
      },
    });

    if (!membroExistente) {
      await this.prisma.membroBarbearia.create({
        data: {
          barCodigo: convite.barCodigo,
          usrCodigo: usuario!.codigo,
          perfil: convite.perfil,
        },
      });
    }

    await this.prisma.conviteBarbearia.update({
      where: { token },
      data: { usadoEm: new Date() },
    });

    return { sucesso: true, userId: usuario!.codigo };
  }
}
