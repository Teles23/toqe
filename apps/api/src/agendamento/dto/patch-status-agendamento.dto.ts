import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StatusAgendamento } from '../../common/constants/agendamento-status';

export { StatusAgendamento };

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
