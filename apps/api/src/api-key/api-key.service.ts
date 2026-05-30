import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes, createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { ApiKey } from '../generated/prisma';

export type ApiKeyPublic = Omit<ApiKey, 'keyHash'>;

function omitKeyHash(apiKey: ApiKey): ApiKeyPublic {
  const { keyHash: _omitted, ...rest } = apiKey;
  void _omitted;
  return rest;
}

@Injectable()
export class ApiKeyService {
  constructor(private prisma: PrismaService) {}

  async criar(
    barCodigo: number,
    nome: string,
  ): Promise<{ key: string; apiKey: ApiKeyPublic }> {
    const prefix = randomBytes(4).toString('hex');
    const secret = randomBytes(16).toString('hex');
    const key = `toqe_${prefix}_${secret}`;

    const hmacSecret =
      process.env.API_KEY_HMAC_SECRET ?? process.env.JWT_SECRET;
    if (!hmacSecret) {
      throw new Error(
        'API_KEY_HMAC_SECRET (ou JWT_SECRET como fallback) deve estar configurado',
      );
    }
    const keyHash = createHmac('sha256', hmacSecret).update(key).digest('hex');
    const keyPrefix = key.slice(0, 15);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        barCodigo,
        nome,
        keyHash,
        keyPrefix,
        ativo: true,
      },
    });

    return { key, apiKey: omitKeyHash(apiKey) };
  }

  async listar(barCodigo: number): Promise<ApiKeyPublic[]> {
    const keys = await this.prisma.apiKey.findMany({
      where: { barCodigo },
      orderBy: { criadoEm: 'desc' },
    });

    return keys.map(omitKeyHash);
  }

  async revogar(codigo: number, barCodigo: number): Promise<void> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { codigo, barCodigo },
    });

    if (!apiKey) {
      throw new NotFoundException('ApiKey não encontrada');
    }

    await this.prisma.apiKey.update({
      where: { codigo },
      data: { ativo: false },
    });
  }
}
