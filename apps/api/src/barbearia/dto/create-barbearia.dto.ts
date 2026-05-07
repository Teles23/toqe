import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateBarbeariaDto {
  @ApiProperty({ example: 'Barbearia do Tio João', description: 'Nome da barbearia' })
  @IsString()
  @IsNotEmpty({ message: 'Nome da barbearia é obrigatório' })
  nome: string;

  @ApiProperty({ example: 'barbearia-tio-joao', description: 'Slug único (letras minúsculas, números e hífens)' })
  @IsString()
  @IsNotEmpty({ message: 'O slug é obrigatório' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug: string;
}
