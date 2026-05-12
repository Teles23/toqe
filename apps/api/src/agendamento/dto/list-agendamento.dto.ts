import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListAgendamentoDto {
  @ApiPropertyOptional({
    example: '2026-05-10',
    description: 'Filtrar por data (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  data?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Filtrar por código do barbeiro',
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number(value))
  barbeiroId?: number;

  @ApiPropertyOptional({
    example: 'confirmado',
    description: 'Filtrar por status',
    enum: ['confirmado', 'cancelado', 'concluido', 'no_show'],
  })
  @IsOptional()
  @IsString()
  status?: string;
}
