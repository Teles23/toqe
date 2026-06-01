import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { TenantStore } from '../tenant/tenant-store';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3002'],
    credentials: true,
  },
  namespace: '/agenda',
})
export class AgendaGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AgendaGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const auth = client.handshake.auth as { token?: string };
      const token: string =
        auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '') ||
        '';

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      (client.data as { user: JwtPayload }).user = payload;
      this.logger.log(`Cliente conectado: ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('join-barbearia')
  async handleJoin(
    @MessageBody() barCodigo: number,
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client.data as { user?: JwtPayload }).user;
    if (!user) {
      client.emit('error', { message: 'Não autenticado' });
      return;
    }
    const bc = Number(barCodigo);
    const membro = await TenantStore.run(bc, () =>
      this.prisma.membroBarbearia.findFirst({
        where: { barCodigo: bc, usrCodigo: user.sub },
      }),
    );

    if (!membro) {
      client.emit('error', { message: 'Acesso negado' });
      return;
    }

    const room = `barbearia-${barCodigo}`;
    void client.join(room);
    this.logger.log(`Cliente ${client.id} entrou na sala ${room}`);
    return { event: 'joined', room };
  }

  @SubscribeMessage('leave-barbearia')
  handleLeave(
    @MessageBody() barCodigo: number,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `barbearia-${barCodigo}`;
    void client.leave(room);
    this.logger.log(`Cliente ${client.id} saiu da sala ${room}`);
    return { event: 'left', room };
  }

  emitAgendamentoCriado(barCodigo: number, payload: unknown) {
    this.server
      .to(`barbearia-${barCodigo}`)
      .emit('agendamento:criado', payload);
  }

  emitStatusAtualizado(barCodigo: number, payload: unknown) {
    this.server
      .to(`barbearia-${barCodigo}`)
      .emit('agendamento:status', payload);
  }
}
