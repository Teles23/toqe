import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBarbeariaDto } from './dto/create-barbearia.dto';

@Injectable()
export class BarbeariaService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBarbeariaDto, usrCodigo: number) {
    const existing = await this.prisma.barbearia.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Slug já está em uso');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Cria a barbearia
      const barbearia = await tx.barbearia.create({
        data: {
          nome: dto.nome,
          slug: dto.slug,
        },
      });

      // 2. Vincula o usuário como DONO
      await tx.membroBarbearia.create({
        data: {
          barCodigo: barbearia.codigo,
          usrCodigo: usrCodigo,
          perfil: 'dono',
        },
      });

      return barbearia;
    });
  }
}
