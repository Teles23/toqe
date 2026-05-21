import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  /**
   * Ao iniciar a API, verifica se SUPER_ADMIN_EMAIL está definido.
   * Se sim, garante que esse usuário tem superAdmin=true no banco.
   * Idempotente — pode rodar toda vez que a API sobe.
   * NUNCA loga o e-mail do super admin.
   */
  async onApplicationBootstrap() {
    const email = process.env.SUPER_ADMIN_EMAIL;
    if (!email) return;

    const result = await this.prisma.usuario.updateMany({
      where: { email, superAdmin: false },
      data: { superAdmin: true },
    });

    if (result.count > 0) {
      this.logger.log('Super admin provisionado com sucesso.');
    }
  }
}
