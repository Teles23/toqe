import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome: string;

  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  senha: string;
}
