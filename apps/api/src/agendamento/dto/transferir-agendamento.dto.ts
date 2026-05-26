import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class TransferirAgendamentoDto {
  @ApiProperty({
    example: 3,
    description: 'Código do novo barbeiro (membro da mesma barbearia)',
  })
  @IsInt()
  @IsPositive()
  novoBarbeiroId: number;
}
