import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { linkPublicoBarbeiro } from '../common/utils/slug.utils';
import * as bcrypt from 'bcrypt';

const SELECT_PERFIL = {
  codigo: true,
  nome: true,
  email: true,
  telefone: true,
  avatarUrl: true,
  ativo: true,
  dataNascimento: true,
  criadoEm: true,
  twoFaEnabled: true,
  superAdmin: true,
} as const;

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email já cadastrado');

    const senhaHash = await bcrypt.hash(dto.senha, await bcrypt.genSalt());

    return this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senhaHash,
        telefone: dto.telefone ?? null,
      },
      select: SELECT_PERFIL,
    });
  }

  findByEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  findById(codigo: number) {
    return this.prisma.usuario.findUnique({ where: { codigo } });
  }

  async me(usrCodigo: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { codigo: usrCodigo },
      select: {
        ...SELECT_PERFIL,
        membros: {
          select: {
            perfil: true,
            barbearia: { select: { codigo: true, nome: true, slug: true } },
          },
        },
      },
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    // Transforma membros → barbearias para corresponder ao contrato do frontend (UsuarioMe)
    const { membros, ...rest } = usuario;
    return {
      ...rest,
      linkPublico: linkPublicoBarbeiro(usuario.nome),
      barbearias: membros.map((m) => ({
        codigo: m.barbearia.codigo,
        nome: m.barbearia.nome,
        slug: m.barbearia.slug,
        perfil: m.perfil,
      })),
    };
  }

  async updateAvatar(usrCodigo: number, avatarUrl: string) {
    return this.prisma.usuario.update({
      where: { codigo: usrCodigo },
      data: { avatarUrl },
      select: SELECT_PERFIL,
    });
  }

  async update(usrCodigo: number, dto: UpdateUsuarioDto) {
    await this.me(usrCodigo);
    const { dataNascimento, ...rest } = dto;
    return this.prisma.usuario.update({
      where: { codigo: usrCodigo },
      data: {
        ...rest,
        dataNascimento: dataNascimento
          ? new Date(dataNascimento)
          : dataNascimento === ''
            ? null
            : undefined,
      },
      select: SELECT_PERFIL,
    });
  }
}
