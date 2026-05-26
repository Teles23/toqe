import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushTokenService {
  constructor(private prisma: PrismaService) {}

  upsertToken(usrCodigo: number, token: string, plataforma: string) {
    return this.prisma.pushToken.upsert({
      where: { usrCodigo_token: { usrCodigo, token } },
      create: { usrCodigo, token, plataforma },
      update: { plataforma },
    });
  }

  async findByUser(usrCodigo: number): Promise<string[]> {
    const rows = await this.prisma.pushToken.findMany({
      where: { usrCodigo },
      select: { token: true },
    });
    return rows.map((r: { token: string }) => r.token);
  }

  deleteToken(usrCodigo: number, token: string) {
    return this.prisma.pushToken.deleteMany({
      where: { usrCodigo, token },
    });
  }
}
