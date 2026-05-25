import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma';
import { CriarContatoInput } from '@toqe/contracts';

@Injectable()
export class ContatoService {
  constructor(private prisma: PrismaService) {}

  async findOrCreate(
    barCodigo: number,
    dto: CriarContatoInput,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    if (dto.telefone) {
      const existing = await tx.contato.findFirst({
        where: { barCodigo, telefone: dto.telefone },
      });
      if (existing) return existing;
    }
    return tx.contato.create({
      data: { barCodigo, nome: dto.nome, telefone: dto.telefone || null },
    });
  }

  async findById(
    codigo: number,
    barCodigo: number,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const contato = await tx.contato.findFirst({
      where: { codigo, barCodigo },
    });
    if (!contato) throw new NotFoundException('Contato não encontrado');
    return contato;
  }
}
