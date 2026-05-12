import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Matches } from 'class-validator';

export class UpdateTemaDto {
  @ApiPropertyOptional({
    example: '#1a1a1a',
    description: 'Cor primária em hex (#RRGGBB)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'corPrimaria deve ser um hex válido (#RRGGBB)',
  })
  corPrimaria?: string;

  @ApiPropertyOptional({
    example: '#f5f5f5',
    description: 'Cor de fundo em hex (#RRGGBB)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'corFundo deve ser um hex válido (#RRGGBB)',
  })
  corFundo?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.toqe.com.br/logos/barba-ze.png',
    description: 'URL do logotipo',
  })
  @IsOptional()
  @IsUrl({}, { message: 'logoUrl deve ser uma URL válida' })
  logoUrl?: string;

  @ApiPropertyOptional({
    example: 'barba-do-ze',
    description: 'Subdomínio personalizado (sem .toqe.com.br)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]{3,60}$/, {
    message:
      'Subdomínio deve ter 3-60 caracteres: letras minúsculas, números e hífens',
  })
  subdominio?: string;
}
