import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CriarApiKeyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome!: string;
}
