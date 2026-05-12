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
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/agenda' })
export class AgendaGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AgendaGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('join-barbearia')
  handleJoin(
    @MessageBody() barCodigo: number,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `barbearia-${barCodigo}`;
    client.join(room);
    this.logger.log(`Cliente ${client.id} entrou na sala ${room}`);
    return { event: 'joined', room };
  }

  @SubscribeMessage('leave-barbearia')
  handleLeave(
    @MessageBody() barCodigo: number,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `barbearia-${barCodigo}`;
    client.leave(room);
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
