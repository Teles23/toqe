import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum StatusAgendamento {
  CONFIRMADO = 'confirmado',
  CANCELADO = 'cancelado',
  CONCLUIDO = 'concluido',
  NO_SHOW = 'no_show',
}

export class PatchStatusAgendamentoDto {
  @ApiProperty({
    enum: StatusAgendamento,
    example: 'concluido',
    description: 'Novo status do agendamento',
  })
  @IsEnum(StatusAgendamento, {
    message:
      'Status inválido. Use: confirmado | cancelado | concluido | no_show',
  })
  status: StatusAgendamento;
}
