import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBarbeariaDto } from './dto/create-barbearia.dto';
import { UpdateBarbeariaDto } from './dto/update-barbearia.dto';

@Injectable()
export class BarbeariaService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBarbeariaDto, usrCodigo: number) {
    const existing = await this.prisma.barbearia.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new ConflictException('Slug já está em uso');

    return this.prisma.$transaction(async (tx) => {
      const barbearia = await tx.barbearia.create({
        data: { nome: dto.nome, slug: dto.slug },
      });
      await tx.membroBarbearia.create({
        data: { barCodigo: barbearia.codigo, usrCodigo, perfil: 'dono' },
      });
      return barbearia;
    });
  }

  async findOne(barCodigo: number) {
    const barbearia = await this.prisma.barbearia.findUnique({
      where: { codigo: barCodigo },
      include: { tema: true },
    });
    if (!barbearia) throw new NotFoundException('Barbearia não encontrada');
    return barbearia;
  }

  findPublico(q?: string) {
    return this.prisma.barbearia.findMany({
      where: {
        ativo: true,
        ...(q ? { nome: { contains: q, mode: 'insensitive' } } : {}),
      },
      select: {
        codigo: true,
        nome: true,
        slug: true,
        tema: { select: { logoUrl: true } },
      },
      orderBy: { nome: 'asc' },
      take: 50,
    });
  }

  async update(barCodigo: number, dto: UpdateBarbeariaDto) {
    await this.findOne(barCodigo);

    if (dto.slug) {
      const existing = await this.prisma.barbearia.findFirst({
        where: { slug: dto.slug, codigo: { not: barCodigo } },
      });
      if (existing) throw new ConflictException('Slug já está em uso');
    }

    return this.prisma.barbearia.update({
      where: { codigo: barCodigo },
      data: dto,
    });
  }
}
