import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Matches } from 'class-validator';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({
    example: 'João Silva',
    description: 'Novo nome do usuário',
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    example: '+5511999999999',
    description: 'Telefone com DDD e código do país',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Telefone inválido' })
  telefone?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.toqe.com.br/avatars/123.jpg',
    description: 'URL do avatar',
  })
  @IsOptional()
  @IsUrl({}, { message: 'avatarUrl deve ser uma URL válida' })
  avatarUrl?: string;
}
