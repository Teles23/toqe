import { IsArray, IsDateString, IsInt, IsNotEmpty } from 'class-validator';

export class CreateAgendamentoDto {
  @IsInt()
  @IsNotEmpty()
  barbeiroId: number;

  @IsInt()
  @IsNotEmpty()
  clienteId: number;

  @IsDateString()
  @IsNotEmpty()
  inicio: string;

  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty()
  servicosIds: number[];
}
