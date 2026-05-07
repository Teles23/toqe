import { IsInt, IsString, Matches, Max, Min } from 'class-validator';

export class ConfigJornadaDto {
  @IsInt()
  @Min(0)
  @Max(6)
  diaSemana: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  inicio: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  fim: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  almocoIni: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  almocoFim: string;
}
