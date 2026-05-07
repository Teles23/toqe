import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateServicoDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do serviço é obrigatório' })
  nome: string;

  @IsNumber()
  @Min(0)
  precoBase: number;

  @IsNumber()
  @Min(1)
  duracaoBase: number; // Em minutos
}
