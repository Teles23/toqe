import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsInt, IsNotEmpty } from 'class-validator';

export class CreateAgendamentoDto {
  @ApiProperty({ example: 1, description: 'Código do barbeiro' })
  @IsInt()
  @IsNotEmpty()
  barbeiroId: number;

  @ApiProperty({
    example: 2,
    description: 'Código do cliente (usuário global)',
  })
  @IsInt()
  @IsNotEmpty()
  clienteId: number;

  @ApiProperty({
    example: '2026-05-10T09:00:00.000Z',
    description: 'Data e hora de início (ISO 8601)',
  })
  @IsDateString()
  @IsNotEmpty()
  inicio: string;

  @ApiProperty({
    example: [1, 2],
    description: 'Lista de códigos dos serviços selecionados',
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty()
  servicosIds: number[];
}
