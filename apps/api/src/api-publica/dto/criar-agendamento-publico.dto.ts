import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsInt,
  IsDateString,
} from 'class-validator';

export class CriarAgendamentoPublicoDto {
  @IsString()
  @IsNotEmpty()
  clienteNome!: string;

  @IsEmail()
  clienteEmail!: string;

  @IsInt()
  servicoCodigo!: number;

  @IsInt()
  barbeiroId!: number;

  @IsDateString()
  inicio!: string;
}
