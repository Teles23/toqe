import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateServicoDto {
  @ApiPropertyOptional({
    example: 'Corte + Barba',
    description: 'Novo nome do serviço',
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    example: 65.0,
    description: 'Novo preço base em reais',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precoBase?: number;

  @ApiPropertyOptional({
    example: 45,
    description: 'Nova duração base em minutos',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duracaoBase?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Ativar ou desativar o serviço',
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
