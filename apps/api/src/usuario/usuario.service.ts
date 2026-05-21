import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';

const SELECT_PERFIL = {
  codigo: true,
  nome: true,
  email: true,
  telefone: true,
  avatarUrl: true,
  ativo: true,
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
      data: { nome: dto.nome, email: dto.email, senhaHash },
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
      barbearias: membros.map((m) => ({
        codigo: m.barbearia.codigo,
        nome: m.barbearia.nome,
        slug: m.barbearia.slug,
        perfil: m.perfil,
      })),
    };
  }

  async update(usrCodigo: number, dto: UpdateUsuarioDto) {
    await this.me(usrCodigo);
    return this.prisma.usuario.update({
      where: { codigo: usrCodigo },
      data: dto,
      select: SELECT_PERFIL,
    });
  }
}
