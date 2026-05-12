import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateServicoDto {
  @ApiProperty({ example: 'Corte de Cabelo', description: 'Nome do serviço' })
  @IsString()
  @IsNotEmpty({ message: 'Nome do serviço é obrigatório' })
  nome: string;

  @ApiProperty({ example: 50.0, description: 'Preço base do serviço em reais' })
  @IsNumber()
  @Min(0)
  precoBase: number;

  @ApiProperty({ example: 30, description: 'Duração base em minutos' })
  @IsNumber()
  @Min(1)
  duracaoBase: number;
}
