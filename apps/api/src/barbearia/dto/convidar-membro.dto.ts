import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';

export enum PerfilMembro {
  GERENTE = 'gerente',
  BARBEIRO = 'barbeiro',
  RECEPCIONISTA = 'recepcionista',
  CLIENTE = 'cliente',
}

export class ConvidarMembroDto {
  @ApiProperty({
    example: 'joao@email.com',
    description: 'E-mail do usuário a ser convidado',
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    enum: PerfilMembro,
    example: 'barbeiro',
    description: 'Perfil do membro na barbearia',
  })
  @IsEnum(PerfilMembro, {
    message:
      'Perfil inválido. Use: gerente | barbeiro | recepcionista | cliente',
  })
  perfil: PerfilMembro;
}
