import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServicoDto } from './dto/create-servico.dto';

@Injectable()
export class ServicoService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateServicoDto, barCodigo: number) {
    return this.prisma.servico.create({
      data: {
        ...dto,
        barCodigo,
      },
    });
  }

  async findAll(barCodigo: number) {
    return this.prisma.servico.findMany({
      where: { barCodigo },
    });
  }
}
