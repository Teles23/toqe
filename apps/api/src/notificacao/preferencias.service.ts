import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePreferenciasDto } from './dto/update-preferencias.dto';

const CANAIS = ['email', 'push', 'whatsapp', 'sms'] as const;

@Injectable()
export class PreferenciasService {
  constructor(private prisma: PrismaService) {}

  async find(usrCodigo: number, barCodigo: number) {
    const registros = await this.prisma.notificacaoPreferencia.findMany({
      where: { usrCodigo, barCodigo },
    });

    // Defaults: email=true, demais=false
    const resultado: Record<string, boolean> = {
      email: true,
      push: false,
      whatsapp: false,
      sms: false,
    };
    for (const r of registros) {
      resultado[r.canal] = r.ativo;
    }
    return resultado;
  }

  async update(
    usrCodigo: number,
    barCodigo: number,
    dto: UpdatePreferenciasDto,
  ) {
    await this.prisma.$transaction([
      this.prisma.notificacaoPreferencia.deleteMany({
        where: { usrCodigo, barCodigo },
      }),
      this.prisma.notificacaoPreferencia.createMany({
        data: CANAIS.map((canal) => ({
          usrCodigo,
          barCodigo,
          canal,
          ativo: dto[canal],
        })),
      }),
    ]);

    return this.find(usrCodigo, barCodigo);
  }
}
