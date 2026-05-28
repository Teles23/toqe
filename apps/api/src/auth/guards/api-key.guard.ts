import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

export interface ApiKeyRequest extends Request {
  apiKeyBarCodigo?: number;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ApiKeyRequest>();
    const key = request.headers['x-api-key'];

    if (!key || typeof key !== 'string') {
      throw new UnauthorizedException('x-api-key header required');
    }

    // Formato da key: "toqe_<prefix>_<secret>"
    const parts = key.split('_');
    if (parts.length !== 3 || parts[0] !== 'toqe') {
      throw new UnauthorizedException('invalid api key format');
    }

    const hmacSecret =
      process.env.API_KEY_HMAC_SECRET ?? process.env.JWT_SECRET ?? 'fallback';
    const hash = createHmac('sha256', hmacSecret).update(key).digest('hex');

    const apiKey = await this.prisma.apiKey.findFirst({
      where: { keyHash: hash, ativo: true },
    });

    if (!apiKey) {
      throw new UnauthorizedException('invalid or inactive api key');
    }

    // Atualizar ultimoUsoEm de forma assíncrona (não bloquear a request)
    void this.prisma.apiKey.update({
      where: { codigo: apiKey.codigo },
      data: { ultimoUsoEm: new Date() },
    });

    request.apiKeyBarCodigo = apiKey.barCodigo;
    return true;
  }
}
