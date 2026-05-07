import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBarbeariaDto } from './dto/create-barbearia.dto';
import { ConvidarMembroDto } from './dto/convidar-membro.dto';
import { UpdateTemaDto } from './dto/update-tema.dto';

@Injectable()
export class BarbeariaService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBarbeariaDto, usrCodigo: number) {
    const existing = await this.prisma.barbearia.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug já está em uso');

    return this.prisma.$transaction(async (tx) => {
      const barbearia = await tx.barbearia.create({ data: { nome: dto.nome, slug: dto.slug } });
      await tx.membroBarbearia.create({
        data: { barCodigo: barbearia.codigo, usrCodigo, perfil: 'dono' },
      });
      return barbearia;
    });
  }

  async findMembros(barCodigo: number) {
    return this.prisma.membroBarbearia.findMany({
      where: { barCodigo },
      include: {
        usuario: { select: { codigo: true, nome: true, email: true, telefone: true, avatarUrl: true } },
      },
      orderBy: { perfil: 'asc' },
    });
  }

  async convidarMembro(barCodigo: number, dto: ConvidarMembroDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (!usuario) throw new NotFoundException(`Usuário com e-mail '${dto.email}' não encontrado`);

    const jaEMembro = await this.prisma.membroBarbearia.findUnique({
      where: { barCodigo_usrCodigo: { barCodigo, usrCodigo: usuario.codigo } },
    });
    if (jaEMembro) throw new ConflictException('Usuário já é membro desta barbearia');

    return this.prisma.membroBarbearia.create({
      data: { barCodigo, usrCodigo: usuario.codigo, perfil: dto.perfil },
      include: {
        usuario: { select: { codigo: true, nome: true, email: true } },
      },
    });
  }

  async getTema(barCodigo: number) {
    const tema = await this.prisma.temaTenant.findUnique({ where: { barCodigo } });
    return tema ?? { barCodigo, corPrimaria: null, corFundo: null, logoUrl: null, subdominio: null };
  }

  async upsertTema(barCodigo: number, dto: UpdateTemaDto) {
    return this.prisma.temaTenant.upsert({
      where: { barCodigo },
      update: dto,
      create: { barCodigo, ...dto },
    });
  }

  async removerMembro(barCodigo: number, usrCodigo: number) {
    const membro = await this.prisma.membroBarbearia.findUnique({
      where: { barCodigo_usrCodigo: { barCodigo, usrCodigo } },
    });
    if (!membro) throw new NotFoundException('Membro não encontrado nesta barbearia');
    if (membro.perfil === 'dono') throw new BadRequestException('Não é possível remover o dono da barbearia');

    return this.prisma.membroBarbearia.delete({
      where: { barCodigo_usrCodigo: { barCodigo, usrCodigo } },
    });
  }
}
