import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Notas privadas do barbeiro sobre um cliente (slide 13). Cada nota é escopada
 * por (barbearia, barbeiro, cliente) — visível só para o barbeiro autor. Uma
 * nota por terno (atualizada via upsert; conteúdo vazio remove).
 */
@Injectable()
export class ClienteNotaService {
  constructor(private prisma: PrismaService) {}

  async obterNota(barCodigo: number, barbeiroId: number, clienteId: number) {
    const nota = await this.prisma.clienteNota.findUnique({
      where: {
        barCodigo_barbeiroId_clienteId: { barCodigo, barbeiroId, clienteId },
      },
      select: { conteudo: true, atualizadoEm: true },
    });
    return {
      conteudo: nota?.conteudo ?? '',
      atualizadoEm: nota?.atualizadoEm?.toISOString() ?? null,
    };
  }

  async salvarNota(
    barCodigo: number,
    barbeiroId: number,
    clienteId: number,
    conteudo: string,
  ) {
    const limpo = conteudo.trim();

    // Conteúdo vazio → remove a nota (idempotente).
    if (!limpo) {
      await this.prisma.clienteNota.deleteMany({
        where: { barCodigo, barbeiroId, clienteId },
      });
      return { conteudo: '', atualizadoEm: null };
    }

    const nota = await this.prisma.clienteNota.upsert({
      where: {
        barCodigo_barbeiroId_clienteId: { barCodigo, barbeiroId, clienteId },
      },
      create: { barCodigo, barbeiroId, clienteId, conteudo: limpo },
      update: { conteudo: limpo },
      select: { conteudo: true, atualizadoEm: true },
    });
    return {
      conteudo: nota.conteudo,
      atualizadoEm: nota.atualizadoEm.toISOString(),
    };
  }
}
