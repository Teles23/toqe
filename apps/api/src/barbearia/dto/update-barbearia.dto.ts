import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class UpdateBarbeariaDto {
  @ApiPropertyOptional({ example: 'Barbearia do Tio João' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ example: 'barbearia-tio-joao' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 30, description: 'Intervalo de slots em minutos (15 | 30 | 60)' })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(60)
  slotInterval?: number;
}
