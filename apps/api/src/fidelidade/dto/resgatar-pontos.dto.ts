import { IsInt, Min } from 'class-validator';

export class ResgatarPontosDto {
  @IsInt()
  clienteCodigo!: number;

  @IsInt()
  @Min(10)
  pontos!: number;
}
