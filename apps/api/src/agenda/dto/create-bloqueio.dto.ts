import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsOptional,
} from 'class-validator';

export class CreateBloqueioDto {
  @IsDateString()
  @IsNotEmpty()
  inicio: string;

  @IsDateString()
  @IsNotEmpty()
  fim: string;

  @IsString()
  @IsOptional()
  motivo?: string;
}
