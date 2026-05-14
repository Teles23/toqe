import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTemaDto } from './dto/update-tema.dto';

@Injectable()
export class TemaTenantService {
  constructor(private prisma: PrismaService) {}

  async getTema(barCodigo: number) {
    const tema = await this.prisma.temaTenant.findUnique({
      where: { barCodigo },
    });
    return (
      tema ?? {
        barCodigo,
        corPrimaria: null,
        corFundo: null,
        logoUrl: null,
        subdominio: null,
      }
    );
  }

  async upsertTema(barCodigo: number, dto: UpdateTemaDto) {
    return this.prisma.temaTenant.upsert({
      where: { barCodigo },
      update: dto,
      create: { barCodigo, ...dto },
    });
  }
}
