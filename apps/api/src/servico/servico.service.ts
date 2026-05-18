import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';

@Injectable()
export class ServicoService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateServicoDto, barCodigo: number) {
    return this.prisma.servico.create({
      data: { ...dto, barCodigo },
    });
  }

  findAll(barCodigo: number) {
    return this.prisma.servico.findMany({
      where: { barCodigo, ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(codigo: number, barCodigo: number) {
    const servico = await this.prisma.servico.findFirst({
      where: { codigo, barCodigo },
    });
    if (!servico) throw new NotFoundException('Serviço não encontrado');
    return servico;
  }

  async update(codigo: number, dto: UpdateServicoDto, barCodigo: number) {
    await this.findOne(codigo, barCodigo);
    return this.prisma.servico.update({
      where: { codigo },
      data: dto,
    });
  }

  async remove(codigo: number, barCodigo: number) {
    await this.findOne(codigo, barCodigo);
    return this.prisma.servico.update({
      where: { codigo },
      data: { ativo: false },
    });
  }
}
