import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateBarbeariaDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome da barbearia é obrigatório' })
  nome: string;

  @IsString()
  @IsNotEmpty({ message: 'O slug é obrigatório' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug: string;
}
